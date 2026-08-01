/*
# SENIM Platform — SUSN Verification Review

## Overview
This migration removes the ability for a client to self-certify a SUSN
(assistance seeker) profile as `verified`. Previously the AuthModal faked
verification with a 2-second setTimeout and then allowed registration to
proceed as if the user were verified. The mission of SENIM is to eliminate
human factor and fraud via verification against government databases and
face-ID — self-certification from the browser is a direct fraud vector.

This migration does NOT implement a real AI / face-ID / eGov provider
(vendor selection is a separate business decision). It only:

1. Introduces `susn_verification_requests`, an append-only table where an
   authenticated SUSN user can submit their own verification request
   (document uploaded to a private Storage bucket). The request starts as
   `pending` and can only be transitioned to `approved` / `rejected` by a
   trusted backend process (service role / Edge Function).
2. Creates a private Storage bucket `verification-documents` with RLS
   policies so a user can only upload/read objects inside their own
   `{user_id}/...` folder.
3. Re-asserts (idempotently) that `profiles.verified` cannot be updated by
   `authenticated` / `anon` — only `display_name` and `phone` remain
   client-writable, as established by migration 20260731063554.

## Security model after this migration
- authenticated (any role): may INSERT a `susn_verification_requests` row
  only for themselves (`user_id = auth.uid()`), and SELECT only their own
  rows. No client role can UPDATE or DELETE a verification request —
  status transitions (`pending` -> `approved` / `rejected`) and the
  resulting `profiles.verified = true` flip must be performed by a
  service-role backend process.
- Storage: a user may upload and read their own documents under
  `verification-documents/{auth.uid()}/...`. No client role can list,
  update, or delete other users' documents.
- `profiles.verified` remains non-writable from the client (column-level
  GRANT from migration 20260731063554 is re-asserted here).
*/


-- =========================================================
-- SUSN_VERIFICATION_REQUESTS: append-only table where a SUSN
-- user submits a document for review. Status transitions are
-- backend-only (service role).
-- =========================================================

CREATE TABLE IF NOT EXISTS susn_verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_path text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewer_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

ALTER TABLE susn_verification_requests ENABLE ROW LEVEL SECURITY;

-- A user can only insert a request for themselves.
DROP POLICY IF EXISTS "insert_own_verification_request" ON susn_verification_requests;
CREATE POLICY "insert_own_verification_request"
  ON susn_verification_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- A user can only read their own requests (to see the status).
DROP POLICY IF EXISTS "select_own_verification_request" ON susn_verification_requests;
CREATE POLICY "select_own_verification_request"
  ON susn_verification_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- No UPDATE / DELETE policy: once submitted, a user cannot alter the
-- request, its status, reviewer_note, or reviewed_at. Only a service-role
-- backend process (review tool / Edge Function) can transition
-- pending -> approved|rejected and, on approval, set profiles.verified = true.

CREATE INDEX IF NOT EXISTS idx_susn_verification_requests_user ON susn_verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_susn_verification_requests_status ON susn_verification_requests(status);


-- =========================================================
-- STORAGE BUCKET: verification-documents (private).
-- A user uploads their document into a folder named after their
-- own auth.uid(), e.g. `verification-documents/{user_id}/cert.pdf`.
-- RLS on storage.objects enforces folder ownership.
-- =========================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-documents', 'verification-documents', false)
ON CONFLICT (id) DO NOTHING;

-- INSERT: user may upload only into their own folder.
DROP POLICY IF EXISTS "verification_docs_insert_own_folder" ON storage.objects;
CREATE POLICY "verification_docs_insert_own_folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'verification-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- SELECT: user may read only their own folder.
DROP POLICY IF EXISTS "verification_docs_select_own_folder" ON storage.objects;
CREATE POLICY "verification_docs_select_own_folder"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'verification-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- No UPDATE / DELETE policy: a user cannot replace or remove a document
-- once uploaded. Only a service-role backend process may manage these
-- objects (e.g. purge after review/retention window).


-- =========================================================
-- PROFILES.verified: re-assert that the client cannot set it.
-- Migration 20260731063554 already did REVOKE UPDATE + GRANT only
-- (display_name, phone). We repeat it here idempotently so this
-- migration is self-documenting and survives even if the earlier
-- migration is ever re-run or reordered.
-- =========================================================

REVOKE UPDATE ON profiles FROM authenticated;
GRANT UPDATE (display_name, phone) ON profiles TO authenticated;

-- verified, role, id, created_at are NOT in the GRANT above, so the
-- anon/authenticated client cannot write them. Only a service-role
-- backend process (bypassing RLS) can set profiles.verified = true.