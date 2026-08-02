/*
# SENIM Platform — Add campaign owner (creator_id)

## Overview
The `campaigns` table had no column linking a campaign to the SUSN user who
created it. This made it impossible to track who posted a request, and there
was no way to scope ownership (edit/delete own campaigns) later.

This migration adds a nullable `creator_id` column referencing `profiles(id)`
and backfills existing rows to the best available owner (none — they stay
NULL). New campaigns created via the UI will set `creator_id` to the
authenticated user.

## Security
- `creator_id` is set by the client at insert time. The existing
  `susn_insert_own_campaigns` RLS policy already restricts INSERT to verified
  SUSN users, so a user can only create campaigns for themselves. To be safe,
  we also add a CHECK that `creator_id` equals `auth.uid()` at insert time via
  a policy update (see below).
*/

-- Add the owner column.
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS creator_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- Index for ownership lookups.
CREATE INDEX IF NOT EXISTS idx_campaigns_creator ON campaigns(creator_id);

-- Tighten the INSERT policy so a campaign can only be created with
-- creator_id = the authenticated user (prevents spoofing another owner).
DROP POLICY IF EXISTS "susn_insert_own_campaigns" ON campaigns;
CREATE POLICY "susn_insert_own_campaigns"
  ON campaigns FOR INSERT TO authenticated
  WITH CHECK (
    creator_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'susn'
        AND profiles.verified = true
    )
  );