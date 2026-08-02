/*
# SENIM Platform — Mock donation funding progress

## Overview
This migration adds a SECURITY DEFINER RPC that lets the frontend record a
successful mock payment and atomically update the campaign's funding progress
in one transaction. It reuses the idempotency pattern from `confirm_donation`
(provider_reference as the idempotency key) but is callable by authenticated
donors after a successful mock payment.

## Why a new RPC instead of reusing confirm_donation?
`confirm_donation` is REVOKE'd from anon/authenticated — it is designed for
the service-role payment-webhook Edge Function. The mock payment flow runs
entirely client-side (no Edge Function), so we need a donor-callable RPC that
performs the same atomic reconciliation but is safe to expose to authenticated
users. It validates ownership (donor_id = auth.uid()) and idempotency
(provider_reference must be unique) inside the transaction.

## Security model
- `record_mock_donation()` is SECURITY DEFINER and runs with definer privileges.
- It is GRANT'd to `authenticated` only (not anon).
- It validates `p_donor_id = auth.uid()` — a donor can only record their own
  donation.
- It uses `provider_reference` as an idempotency key: if the same mock payment
  ID is submitted twice, the second call is a no-op (duplicate).
- `campaigns.raised_amount` and `campaigns.status` are updated ONLY inside this
  RPC (definer privileges). The client has no direct UPDATE path (RLS policies
  removed in migration 20260731063554).
- `campaigns.status` transitions active -> funded automatically when
  raised_amount >= goal_amount. The client cannot set status directly.

## Idempotency
The RPC checks `EXISTS (SELECT 1 FROM donation_intents WHERE provider_reference
= p_provider_reference)` before inserting. If the reference already exists, it
returns `{ ok: true, duplicate: true }` without touching raised_amount again.
*/

-- =========================================================
-- record_mock_donation() — SECURITY DEFINER RPC
-- =========================================================

CREATE OR REPLACE FUNCTION record_mock_donation(
  p_donor_id uuid,
  p_campaign_id uuid,
  p_amount numeric,
  p_payment_type text,
  p_provider_reference text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_intent_id uuid;
  v_prev_status text;
  v_new_raised numeric;
  v_goal numeric;
  v_campaign_exists boolean;
BEGIN
  -- Validate the caller is recording their own donation.
  IF p_donor_id <> auth.uid() THEN
    RAISE EXCEPTION 'Forbidden: cannot record a donation for another user';
  END IF;

  -- Validate amount is positive.
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  -- Validate payment type.
  IF p_payment_type NOT IN ('full', 'partial', 'subscription') THEN
    RAISE EXCEPTION 'Invalid payment type';
  END IF;

  -- Idempotency: if this provider_reference was already processed, no-op.
  IF EXISTS (
    SELECT 1 FROM donation_intents
    WHERE provider_reference = p_provider_reference
  ) THEN
    RETURN jsonb_build_object('ok', true, 'duplicate', true);
  END IF;

  -- If a campaign is specified, verify it exists and is not already funded.
  IF p_campaign_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM campaigns WHERE id = p_campaign_id
    ) INTO v_campaign_exists;

    IF NOT v_campaign_exists THEN
      RAISE EXCEPTION 'Campaign not found';
    END IF;

    -- Reject donations to already-funded/completed campaigns.
    IF EXISTS (
      SELECT 1 FROM campaigns
      WHERE id = p_campaign_id AND status IN ('funded', 'completed')
    ) THEN
      RAISE EXCEPTION 'Campaign is already funded';
    END IF;
  END IF;

  -- Insert the donation intent (status = 'confirmed' since mock payment succeeded).
  INSERT INTO donation_intents (
    donor_id, campaign_id, amount, payment_type, status, provider_reference
  )
  VALUES (
    p_donor_id, p_campaign_id, p_amount, p_payment_type, 'confirmed', p_provider_reference
  )
  RETURNING id INTO v_intent_id;

  -- Update the campaign funding progress (if a specific campaign).
  IF p_campaign_id IS NOT NULL THEN
    UPDATE campaigns
      SET raised_amount = raised_amount + p_amount
    WHERE id = p_campaign_id
    RETURNING status, goal_amount, raised_amount
    INTO v_prev_status, v_goal, v_new_raised;

    -- If the campaign was 'active' and has now reached its goal, flip to 'funded'.
    IF v_prev_status = 'active' AND v_new_raised >= v_goal THEN
      UPDATE campaigns SET status = 'funded' WHERE id = p_campaign_id;
    END IF;
  END IF;

  -- Refresh platform_stats.updated_at so the landing ticker knows something happened.
  UPDATE platform_stats SET updated_at = now() WHERE id = 1;

  RETURN jsonb_build_object(
    'ok', true,
    'duplicate', false,
    'intent_id', v_intent_id,
    'campaign_id', p_campaign_id,
    'amount', p_amount
  );
END;
$$;

-- Only authenticated donors may call this (not anon, not service role).
REVOKE ALL ON FUNCTION record_mock_donation(uuid, uuid, numeric, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION record_mock_donation(uuid, uuid, numeric, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION record_mock_donation(uuid, uuid, numeric, text, text) TO authenticated;