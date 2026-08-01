/*
# SENIM Platform — Require verified SUSN to create campaigns

## Overview
The initial `susn_insert_own_campaigns` policy (migration 20260731063554)
only checked that the inserting user has `profiles.role = 'susn'`. This
allowed any unverified SUSN profile to create campaigns, which contradicts
the platform's trust model: assistance requests must only be posted by
**verified** SUSN users (verified via the `susn_verification_requests`
review process, backend/service-role only).

This migration tightens that policy so that campaign INSERT is allowed only
when the caller:
- is authenticated,
- has `profiles.role = 'susn'`, AND
- has `profiles.verified = true`.

No UI change alone is sufficient — RLS is the only real enforcement. The
frontend (Navbar link, CreateRequest page gate) is UX-only and cannot be
relied on for security.

## Security model after this migration
- anon / authenticated (any role): read campaigns (unchanged).
- authenticated + role='susn' + verified=true: INSERT campaigns.
- No client role can UPDATE campaigns (the permissive `auth_update_campaigns`
  policy was removed in migration 20260731063554). Only a service-role
  backend process can update campaign totals/status.
*/


-- =========================================================
-- CAMPAIGNS: restrict INSERT to verified SUSN users only.
-- =========================================================

DROP POLICY IF EXISTS "susn_insert_own_campaigns" ON campaigns;
CREATE POLICY "susn_insert_own_campaigns"
  ON campaigns FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'susn'
        AND profiles.verified = true
    )
  );