/*
# SENIM Platform — Security Hardening

## Overview
This migration closes the vulnerabilities found in the initial schema audit.
It does NOT add any new product features (payments, OCR, QR vouchers). It only:

1. Removes policies that let anonymous/authenticated clients directly rewrite
   financial and trust-critical data (campaign totals, platform stats,
   transaction feed, partner directory).
2. Restricts campaign creation to authenticated users with the `susn` role.
3. Locks down which profile columns a user can update after signup, so a
   user cannot self-escalate `role` or self-set `verified` post-registration.
4. Adds CHECK constraints so invalid enum values can't be written via the
   API even if the UI is bypassed.
5. Introduces `donation_intents`, a safe append-only table where an
   authenticated donor can record their own intent to donate. It does NOT
   move money and does NOT touch `campaigns.raised_amount` or
   `platform_stats` — those remain writable only by a trusted backend
   process (service role), which is out of scope for this task.

## Security model after this migration
- anon: read-only on campaigns, partners, transactions, platform_stats.
- authenticated (any role): read-only on the same tables, plus manage own
  profile (limited columns) and own donation_intents rows.
- authenticated + role = 'susn': may INSERT campaigns (their own requests).
- No client role can UPDATE campaigns, platform_stats, or INSERT
  transactions/partners. Those require a service-role (backend) process.
*/

-- =========================================================
-- CAMPAIGNS: remove open UPDATE, restrict INSERT to susn role
-- =========================================================

DROP POLICY IF EXISTS "auth_update_campaigns" ON campaigns;

DROP POLICY IF EXISTS "auth_insert_campaigns" ON campaigns;
CREATE POLICY "susn_insert_own_campaigns"
  ON campaigns FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'susn'
    )
  );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'campaigns_category_check'
  ) THEN
    ALTER TABLE campaigns ADD CONSTRAINT campaigns_category_check
      CHECK (category IN ('grocery', 'medicine', 'winter', 'education'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'campaigns_status_check'
  ) THEN
    ALTER TABLE campaigns ADD CONSTRAINT campaigns_status_check
      CHECK (status IN ('active', 'funded', 'completed'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'campaigns_urgency_check'
  ) THEN
    ALTER TABLE campaigns ADD CONSTRAINT campaigns_urgency_check
      CHECK (urgency IS NULL OR urgency IN ('urgent', 'high_priority', 'verified'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'campaigns_amounts_check'
  ) THEN
    ALTER TABLE campaigns ADD CONSTRAINT campaigns_amounts_check
      CHECK (goal_amount >= 0 AND raised_amount >= 0);
  END IF;
END $$;


-- =========================================================
-- PARTNERS: remove open self-service INSERT (registration is
-- reviewed by SENIM staff per product copy; no admin backend
-- exists yet in this codebase, so there is no safe client path
-- to create partner rows until one does)
-- =========================================================

DROP POLICY IF EXISTS "auth_insert_partners" ON partners;


-- =========================================================
-- TRANSACTIONS: remove open INSERT. The public feed must only
-- ever be written by a trusted backend/service role once real
-- redemptions exist.
-- =========================================================

DROP POLICY IF EXISTS "anon_insert_transactions" ON transactions;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transactions_type_check'
  ) THEN
    ALTER TABLE transactions ADD CONSTRAINT transactions_type_check
      CHECK (type IN ('voucher_redemption', 'medicine_purchase', 'utility_payment'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transactions_amount_check'
  ) THEN
    ALTER TABLE transactions ADD CONSTRAINT transactions_amount_check
      CHECK (amount >= 0);
  END IF;
END $$;


-- =========================================================
-- PLATFORM_STATS: remove open UPDATE. Only a trusted backend
-- process should ever change these numbers.
-- =========================================================

DROP POLICY IF EXISTS "anon_update_stats" ON platform_stats;


-- =========================================================
-- PROFILES: keep INSERT (role is chosen once at signup by
-- design), but stop authenticated users from changing role or
-- verified after the fact. Column-level GRANT is used because
-- RLS is row-level, not column-level.
-- =========================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
      CHECK (role IN ('donor', 'susn', 'partner'));
  END IF;
END $$;

REVOKE UPDATE ON profiles FROM authenticated;
GRANT UPDATE (display_name, phone) ON profiles TO authenticated;


-- =========================================================
-- DONATION_INTENTS: safe, honest replacement for the old
-- "donate = rewrite campaigns.raised_amount from the browser"
-- flow. This records what a logged-in donor says they want to
-- give. It never moves money and never changes campaign totals
-- or platform stats — a trusted backend process (payment
-- webhook, out of scope here) is required to confirm intents
-- and reconcile totals server-side.
-- =========================================================

CREATE TABLE IF NOT EXISTS donation_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  payment_type text NOT NULL DEFAULT 'full' CHECK (payment_type IN ('full', 'partial', 'subscription')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE donation_intents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insert_own_donation_intent" ON donation_intents;
CREATE POLICY "insert_own_donation_intent"
  ON donation_intents FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = donor_id);

DROP POLICY IF EXISTS "select_own_donation_intent" ON donation_intents;
CREATE POLICY "select_own_donation_intent"
  ON donation_intents FOR SELECT TO authenticated
  USING (auth.uid() = donor_id);

-- No UPDATE/DELETE policy: once submitted, a donor cannot alter or erase
-- their own pending intent (prevents tampering with the audit trail).
-- Status transitions (pending -> confirmed/rejected) and any resulting
-- campaign/stat updates must be done by a service-role backend process.

CREATE INDEX IF NOT EXISTS idx_donation_intents_donor ON donation_intents(donor_id);
CREATE INDEX IF NOT EXISTS idx_donation_intents_campaign ON donation_intents(campaign_id);
