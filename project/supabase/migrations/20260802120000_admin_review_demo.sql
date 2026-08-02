/*
# SENIM Platform — Admin Review Demo

## Overview
Adds the admin role and the review workflow for SUSN verification
applications. The core principle: AI checks documents, but only an
admin makes the final decision.

This migration does NOT create new tables — it adapts the existing
`susn_verification_requests` table (the MVP source of truth) and keeps
`profiles.verified` for compatibility with `VerificationBadge`.

## What it adds
1. `admin` role to the `profiles.role` CHECK constraint.
2. `is_admin()` — a SECURITY DEFINER helper so policies/RPCs don't repeat
   the `EXISTS (...)` subquery everywhere.
3. `ai_result jsonb` on `susn_verification_requests` — the AI/OCR analysis
   result (confidence, checks, summary). AI only records its findings; it
   never flips `profiles.verified`.
4. RLS policies so admins can SELECT all verification requests and all
   profiles (read-only).
5. Two SECURITY DEFINER RPCs:
   - `admin_list_verification_requests()` — all requests + applicant name.
   - `admin_review_application(request_id, new_status, note)` — transitions
     pending -> approved|rejected AND flips `profiles.verified` accordingly.
     Only an admin can call these (checked inside via `is_admin()`).

## Security model
- `is_admin()` is SECURITY DEFINER and reads `profiles` with the definer's
  privileges, so it is safe to call from RLS policies and RPCs.
- The RPCs check `is_admin()` first and raise an exception otherwise.
- `profiles.verified` is still NOT writable by the client — only the
  `admin_review_application` RPC (SECURITY DEFINER) can flip it.
*/

-- =========================================================
-- 1. ADMIN ROLE
-- =========================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_check'
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT profiles_role_check;
  END IF;
END $$;

ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('donor', 'susn', 'partner', 'admin'));


-- =========================================================
-- 2. IS_ADMIN() HELPER
-- =========================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;


-- =========================================================
-- 3. AI RESULT COLUMN
-- =========================================================

ALTER TABLE susn_verification_requests
  ADD COLUMN IF NOT EXISTS ai_result jsonb;


-- =========================================================
-- 4. RLS: ADMIN READ ACCESS
-- =========================================================

-- Admins can read all verification requests (to review them).
DROP POLICY IF EXISTS "admin_select_verification_requests" ON susn_verification_requests;
CREATE POLICY "admin_select_verification_requests"
  ON susn_verification_requests FOR SELECT TO authenticated
  USING (is_admin());

-- Admins can read all profiles (to see applicant names).
DROP POLICY IF EXISTS "admin_select_profiles" ON profiles;
CREATE POLICY "admin_select_profiles"
  ON profiles FOR SELECT TO authenticated
  USING (is_admin());


-- =========================================================
-- 5. RPC: LIST VERIFICATION REQUESTS (ADMIN)
-- =========================================================

CREATE OR REPLACE FUNCTION admin_list_verification_requests()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  document_path text,
  status text,
  reviewer_note text,
  created_at timestamptz,
  reviewed_at timestamptz,
  ai_result jsonb,
  display_name text,
  phone text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Forbidden: not an admin';
  END IF;

  RETURN QUERY
  SELECT
    r.id,
    r.user_id,
    r.document_path,
    r.status,
    r.reviewer_note,
    r.created_at,
    r.reviewed_at,
    r.ai_result,
    p.display_name,
    p.phone
  FROM susn_verification_requests r
  LEFT JOIN profiles p ON p.id = r.user_id
  ORDER BY
    CASE r.status WHEN 'pending' THEN 0 ELSE 1 END,
    r.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION admin_list_verification_requests() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_list_verification_requests() TO authenticated;


-- =========================================================
-- 6. RPC: REVIEW APPLICATION (ADMIN)
-- =========================================================

CREATE OR REPLACE FUNCTION admin_review_application(
  p_request_id uuid,
  p_status text,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_current_status text;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Forbidden: not an admin';
  END IF;

  IF p_status NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'status must be approved or rejected';
  END IF;

  SELECT user_id, status INTO v_user_id, v_current_status
  FROM susn_verification_requests
  WHERE id = p_request_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Application not found';
  END IF;

  IF v_current_status <> 'pending' THEN
    RAISE EXCEPTION 'Application already %', v_current_status;
  END IF;

  -- Transition the request.
  UPDATE susn_verification_requests
  SET status = p_status,
      reviewer_note = p_note,
      reviewed_at = now()
  WHERE id = p_request_id;

  -- Flip the profile flag: approved -> verified=true, rejected -> false.
  UPDATE profiles
  SET verified = (p_status = 'approved')
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'ok', true,
    'application_id', p_request_id,
    'status', p_status,
    'user_id', v_user_id
  );
END;
$$;

REVOKE ALL ON FUNCTION admin_review_application(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_review_application(uuid, text, text) TO authenticated;