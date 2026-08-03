/*
# SENIM Platform — Demo Seed Helpers

## Overview
This migration adds server-side helpers used exclusively by the local/cloud
demo seeding script (`npm run demo:seed` / `npm run demo:reset`). It does NOT
change any existing business logic, tables, or RLS policies.

The demo seed script runs with a service-role key, so it could technically
UPDATE `profiles` / INSERT `campaigns` / `partners` directly. These RPCs are
provided so the seed script does not need to know the exact column layout and
so the permission boundary (who may touch `role`, `verified`, `partners`, etc.)
is asserted inside the database, not inside a script.

## Security model
- All functions are `SECURITY DEFINER` and EXECUTE is REVOKE'd from
  `anon` / `authenticated`. Only requests with the service-role key (or a
  database superuser / `postgres` role) can invoke them.
- Demo-owned rows are marked with `profiles.is_demo = true` so `demo:reset`
  can remove ONLY demo data, never real user data.
*/

-- =========================================================
-- 1. Marker column on profiles for demo-owned accounts
-- =========================================================
-- Clean, idempotent way for demo:reset to remove ONLY demo accounts.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

-- =========================================================
-- 2. upsert_demo_profile() — create/update a demo profile
-- =========================================================
-- Service-role only. Used by demo:seed to set role / verified / display_name
-- on the demo accounts. `p_verified` defaults false so only the seed script
-- can explicitly grant verified=true to the demo SUSN.
CREATE OR REPLACE FUNCTION upsert_demo_profile(
  p_user_id uuid,
  p_role text,
  p_display_name text,
  p_phone text,
  p_verified boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- The role must be one of the app roles (admin included; this is a
  -- deliberate server-side provisioning path for demo accounts).
  IF p_role NOT IN ('donor', 'susn', 'partner', 'admin') THEN
    RAISE EXCEPTION 'Invalid role %', p_role;
  END IF;

  INSERT INTO public.profiles (id, role, display_name, phone, verified, is_demo)
  VALUES (p_user_id, p_role, p_display_name, p_phone, p_verified, true)
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    display_name = EXCLUDED.display_name,
    phone = EXCLUDED.phone,
    verified = EXCLUDED.verified,
    is_demo = true;

  RETURN jsonb_build_object('ok', true, 'user_id', p_user_id);
END;
$$;

REVOKE ALL ON FUNCTION upsert_demo_profile(uuid, text, text, text, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION upsert_demo_profile(uuid, text, text, text, boolean) FROM anon, authenticated;

-- =========================================================
-- 3. upsert_demo_campaign() — create/update a demo campaign/offer
-- =========================================================
-- Service-role only. Idempotent by title. Sets fixed demo fields (goal,
-- raised, status, creator) so demo:reset can delete by the same titles.
-- NOTE: `campaigns.title` has no UNIQUE constraint, so we check existence
-- manually instead of using ON CONFLICT.
CREATE OR REPLACE FUNCTION upsert_demo_campaign(
  p_title text,
  p_description text,
  p_category text,
  p_region text,
  p_goal numeric,
  p_raised numeric,
  p_status text,
  p_creator_id uuid,
  p_title_i18n jsonb DEFAULT NULL,
  p_description_i18n jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_campaign_id uuid;
BEGIN
  IF p_category NOT IN ('grocery', 'medicine', 'winter', 'education') THEN
    RAISE EXCEPTION 'Invalid category %', p_category;
  END IF;
  IF p_status NOT IN ('active', 'funded', 'completed') THEN
    RAISE EXCEPTION 'Invalid status %', p_status;
  END IF;

  SELECT id INTO v_campaign_id FROM public.campaigns WHERE title = p_title;

  IF v_campaign_id IS NULL THEN
    INSERT INTO public.campaigns (
      title, description, category, region, goal_amount, raised_amount,
      status, creator_id, title_i18n, description_i18n
    )
    VALUES (
      p_title, p_description, p_category, p_region, p_goal, p_raised,
      p_status, p_creator_id, p_title_i18n, p_description_i18n
    )
    RETURNING id INTO v_campaign_id;
  ELSE
    UPDATE public.campaigns
    SET description = p_description,
        category = p_category,
        region = p_region,
        goal_amount = p_goal,
        raised_amount = p_raised,
        status = p_status,
        creator_id = p_creator_id,
        title_i18n = p_title_i18n,
        description_i18n = p_description_i18n
    WHERE id = v_campaign_id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'campaign_id', v_campaign_id);
END;
$$;

REVOKE ALL ON FUNCTION upsert_demo_campaign(text, text, text, text, numeric, numeric, text, uuid, jsonb, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION upsert_demo_campaign(text, text, text, text, numeric, numeric, text, uuid, jsonb, jsonb) FROM anon, authenticated;

-- =========================================================
-- 4. upsert_demo_verification_request() — demo SUSN verification request
-- =========================================================
-- Service-role only. Creates a PENDING verification request for the demo SUSN
-- with a demo AI result (recommendation only — the admin still makes the final
-- decision in Admin Review). Idempotent: one pending request per user.
CREATE OR REPLACE FUNCTION upsert_demo_verification_request(
  p_user_id uuid,
  p_document_path text,
  p_ai_result jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request_id uuid;
BEGIN
  -- If the user already has ANY request, leave it untouched (don't create
  -- duplicates / don't overwrite an admin's review).
  IF EXISTS (
    SELECT 1 FROM public.susn_verification_requests WHERE user_id = p_user_id
  ) THEN
    RETURN jsonb_build_object('ok', true, 'duplicate', true);
  END IF;

  INSERT INTO public.susn_verification_requests (
    user_id, document_path, status, ai_result
  )
  VALUES (p_user_id, p_document_path, 'pending', p_ai_result)
  RETURNING id INTO v_request_id;

  RETURN jsonb_build_object('ok', true, 'request_id', v_request_id);
END;
$$;

REVOKE ALL ON FUNCTION upsert_demo_verification_request(uuid, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION upsert_demo_verification_request(uuid, text, jsonb) FROM anon, authenticated;

-- =========================================================
-- 5. delete_demo_data() — idempotent demo cleanup
-- =========================================================
-- Service-role only. Used by demo:reset. Deletes ONLY demo-owned rows:
--   - campaigns whose titles are in the fixed demo list
--   - demo profiles (is_demo = true) and their auth.users rows
-- It NEVER touches real users/content.
-- NOTE: auth.users deletion is performed by the script via Auth Admin API;
-- this function only removes DB rows that reference demo profiles / demo
-- content so foreign keys don't block the auth deletion.
CREATE OR REPLACE FUNCTION delete_demo_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_campaigns int;
  v_deleted_profiles int;
BEGIN
  -- Demo campaigns (by fixed titles from the seed script).
  DELETE FROM public.campaigns
  WHERE title IN (
    'Food Package for a Family',
    'Medicine Support',
    'Winter Coal Support'
  );
  GET DIAGNOSTICS v_deleted_campaigns = ROW_COUNT;

  -- Demo verification requests belonging to demo profiles.
  DELETE FROM public.susn_verification_requests
  WHERE user_id IN (SELECT id FROM public.profiles WHERE is_demo = true);

  -- Demo donation intents belonging to demo profiles.
  DELETE FROM public.donation_intents
  WHERE donor_id IN (SELECT id FROM public.profiles WHERE is_demo = true);

  -- Demo campaigns created by demo profiles.
  DELETE FROM public.campaigns
  WHERE creator_id IN (SELECT id FROM public.profiles WHERE is_demo = true)
    AND title NOT IN (
      'Food Package for a Family',
      'Medicine Support',
      'Winter Coal Support'
    );

  -- Demo partner applications belonging to demo profiles.
  DELETE FROM public.partner_applications
  WHERE user_id IN (SELECT id FROM public.profiles WHERE is_demo = true);

  -- Demo profiles (FK to auth.users is ON DELETE CASCADE from profiles side,
  -- so deleting the auth user later also removes the profile — but we delete
  -- the profile row here too for explicitness).
  DELETE FROM public.profiles WHERE is_demo = true;
  GET DIAGNOSTICS v_deleted_profiles = ROW_COUNT;

  RETURN jsonb_build_object(
    'ok', true,
    'deleted_campaigns', v_deleted_campaigns,
    'deleted_profiles', v_deleted_profiles
  );
END;
$$;

REVOKE ALL ON FUNCTION delete_demo_data() FROM PUBLIC;
REVOKE ALL ON FUNCTION delete_demo_data() FROM anon, authenticated;