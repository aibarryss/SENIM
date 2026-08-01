/*
# SENIM Platform — Partner Applications

## Overview
This migration introduces `partner_applications`, an append-only table where
an authenticated user registering as a `partner` (store / pharmacy) can
submit a real application with store details. Previously the AuthModal only
collected email/password/name/phone for partners and showed a static
"reviewed in 2-3 business days" message — but no application data was ever
stored, so there was nothing for staff to review.

This mirrors the `donation_intents` and `susn_verification_requests` pattern:
the client may INSERT its own row and SELECT it back, but status transitions
(`pending` -> `approved` / `rejected`) are backend-only (service role). The
`profiles.verified` flag for partners is never set from the client — only a
service-role process can approve an application and flip `verified = true`.

## Security model after this migration
- authenticated (any role): may INSERT a `partner_applications` row only for
  themselves (`user_id = auth.uid()`), and SELECT only their own rows.
- No client role can UPDATE or DELETE a partner application — status
  transitions and the resulting `profiles.verified = true` flip must be
  performed by a service-role backend process (admin review tool / Edge
  Function). This is an explicit admin task; the UI no longer promises a
  specific review window because no automated review exists yet.
*/


-- =========================================================
-- PARTNER_APPLICATIONS: append-only table where a partner
-- (store / pharmacy) submits their registration details for
-- manual review by SENIM staff. Status transitions are
-- backend-only (service role).
-- =========================================================

CREATE TABLE IF NOT EXISTS partner_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  store_name text NOT NULL,
  store_type text NOT NULL CHECK (store_type IN ('supermarket', 'pharmacy', 'clothing', 'education')),
  city text NOT NULL,
  address text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewer_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

ALTER TABLE partner_applications ENABLE ROW LEVEL SECURITY;

-- A user can only insert an application for themselves.
DROP POLICY IF EXISTS "insert_own_partner_application" ON partner_applications;
CREATE POLICY "insert_own_partner_application"
  ON partner_applications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- A user can only read their own applications (to see the status).
DROP POLICY IF EXISTS "select_own_partner_application" ON partner_applications;
CREATE POLICY "select_own_partner_application"
  ON partner_applications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- No UPDATE / DELETE policy: once submitted, a user cannot alter the
-- application, its status, reviewer_note, or reviewed_at. Only a
-- service-role backend process (admin review tool / Edge Function) can
-- transition pending -> approved|rejected and, on approval, set
-- profiles.verified = true and create a row in the `partners` table.

CREATE INDEX IF NOT EXISTS idx_partner_applications_user ON partner_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_applications_status ON partner_applications(status);