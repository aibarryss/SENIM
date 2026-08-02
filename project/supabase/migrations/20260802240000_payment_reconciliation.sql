/*
# SENIM Platform — Payment reconciliation backend

## Overview
This migration adds the server-side reconciliation infrastructure for
confirming donation intents and reconciling campaign totals. It does NOT
integrate a specific payment provider — that is a separate decision
(TASK-013b). It provides:

1. `donation_intents.provider_reference` — nullable text column for the
   payment provider's session/transaction id, so the webhook can match
   a confirmed payment back to the intent.
2. `confirm_donation()` — a SECURITY DEFINER RPC that:
   a. Atomically transitions a donation_intent from 'pending' to 'confirmed'
      (idempotent: duplicate webhook calls are a no-op).
   b. Increments `campaigns.raised_amount` for the linked campaign (if any).
   c. When a campaign crosses its goal (raised_amount >= goal_amount) and
      transitions from 'active' to 'funded', increments
      `platform_stats.families_helped` by 1 — per the review decision,
      this is per-fulfilled-campaign, NOT per-donation.
   d. Updates `platform_stats.updated_at`.

## Security model
- `confirm_donation()` is SECURITY DEFINER and REVOKE'd from anon/authenticated.
  Only the service-role Edge Function (payment-webhook) can call it.
- `campaigns.raised_amount` and `platform_stats` remain non-writable from
  the client (RLS policies removed in migration 20260731063554). This RPC
  is the only path to update them, and it runs with definer privileges.
- `donation_intents.provider_reference` is set by this RPC, not by the
  client. The client INSERT policy (migration 20260731063554) does not
  grant UPDATE, so a donor cannot tamper with it.

## Idempotency
The core UPDATE uses `WHERE id = p_intent_id AND status = 'pending'`.
If a webhook is delivered twice, the second call finds status='confirmed'
(no row returned), and the RPC returns `{ ok: true, duplicate: true }`
without touching raised_amount or families_helped again.
*/

-- =========================================================
-- 1. provider_reference column on donation_intents
-- =========================================================

ALTER TABLE donation_intents
  ADD COLUMN IF NOT EXISTS provider_reference text;

-- Index for webhook lookup by provider reference (optional fast-path).
CREATE INDEX IF NOT EXISTS idx_donation_intents_provider_ref
  ON donation_intents(provider_reference)
  WHERE provider_reference IS NOT NULL;


-- =========================================================
-- 2. confirm_donation() — SECURITY DEFINER RPC
-- =========================================================

CREATE OR REPLACE FUNCTION confirm_donation(
  p_intent_id uuid,
  p_provider_reference text,
  p_amount numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_campaign_id uuid;
  v_confirmed_amount numeric;
  v_prev_status text;
  v_new_raised numeric;
  v_goal numeric;
BEGIN
  -- Step (a): atomically transition pending -> confirmed.
  -- The WHERE status = 'pending' guard makes duplicate webhook deliveries
  -- a no-op: if the intent was already confirmed, RETURNING yields nothing.
  UPDATE donation_intents
    SET status = 'confirmed',
        provider_reference = COALESCE(p_provider_reference, provider_reference)
  WHERE id = p_intent_id AND status = 'pending'
  RETURNING campaign_id, amount INTO v_campaign_id, v_confirmed_amount;

  -- No row updated — either not found, or already confirmed (duplicate webhook).
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', true, 'duplicate', true);
  END IF;

  -- Use the confirmed amount from the DB row (source of truth), not the
  -- webhook payload, to prevent a tampered webhook from inflating totals.
  -- If the caller-supplied amount differs from the DB, we trust the DB.
  IF v_campaign_id IS NOT NULL THEN
    -- Step (b): increment raised_amount and capture the previous status +
    -- new total in one atomic UPDATE so we can detect the active->funded
    -- transition without a race condition.
    UPDATE campaigns
      SET raised_amount = raised_amount + v_confirmed_amount
    WHERE id = v_campaign_id
    RETURNING status, goal_amount, raised_amount
    INTO v_prev_status, v_goal, v_new_raised;

    -- Step (c): if the campaign was 'active' and has now reached its goal,
    -- flip it to 'funded' and increment families_helped (per-fulfilled-
    -- campaign, NOT per-donation, per the review decision).
    IF v_prev_status = 'active' AND v_new_raised >= v_goal THEN
      UPDATE campaigns SET status = 'funded' WHERE id = v_campaign_id;
      UPDATE platform_stats
        SET families_helped = families_helped + 1, updated_at = now()
        WHERE id = 1;
    ELSE
      -- Still below goal (or already funded/completed) — just bump updated_at.
      UPDATE platform_stats SET updated_at = now() WHERE id = 1;
    END IF;
  ELSE
    -- General fund (campaign_id IS NULL) — no campaign to update, but we
    -- still refresh updated_at so the landing-page ticker knows something
    -- happened. families_helped is NOT incremented here (per review: only
    -- on campaign fulfillment).
    UPDATE platform_stats SET updated_at = now() WHERE id = 1;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'duplicate', false,
    'intent_id', p_intent_id,
    'campaign_id', v_campaign_id,
    'amount', v_confirmed_amount
  );
END;
$$;

-- Only the service-role Edge Function may call this. The client (anon /
-- authenticated) has no direct path to confirm donations or touch totals.
REVOKE ALL ON FUNCTION confirm_donation(uuid, text, numeric) FROM PUBLIC;
REVOKE ALL ON FUNCTION confirm_donation(uuid, text, numeric) FROM anon, authenticated;