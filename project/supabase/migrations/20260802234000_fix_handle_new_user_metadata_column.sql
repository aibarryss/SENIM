/*
# SENIM Platform — Fix handle_new_user metadata column reference

## Bug
`handle_new_user()` (created by 20260801141200 and re-created by
20260802230000) referenced `NEW.user_metadata`, but GoTrue stores
Supabase Auth `options.data` in the `raw_user_meta_data` column of
`auth.users` — there is no `user_metadata` column on that table.

## Effect
Any `supabase.auth.signUp()` caused the `AFTER INSERT ON auth.users`
trigger to raise `column "user_metadata" does not exist`, which rolled
back the entire auth.users INSERT. Registration was impossible for every
role (donor, susn, partner). This was not caught by typecheck, lint, or
build — only at runtime.

## Fix
Re-create `handle_new_user()` reading from `NEW.raw_user_meta_data`
instead. The admin self-escalation guard introduced by 20260802230000
(only `donor`/`susn`/`partner` accepted from the client; `admin` never
provisioned from metadata) is preserved verbatim.

## Why a new migration instead of only editing the old ones
- Already-deployed environments have 20260801141200 and 20260802230000
  applied; editing those files does not re-run them. This migration
  applies the fix on top of whatever version of the function currently
  exists.
- Fresh deploys / `db reset` get a correct function from the edited
  historical migrations; this migration then re-creates the same correct
  function (idempotent — no behavioral conflict).
*/

-- =========================================================
-- handle_new_user: read profile fields from raw_user_meta_data
-- (admin self-escalation guard from 20260802230000 preserved)
-- =========================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, display_name, phone, verified)
  VALUES (
    NEW.id,
    -- The client may only self-select a non-privileged role. 'admin' is
    -- never accepted from raw_user_meta_data: enforcing this in the
    -- trigger closes the self-escalation vector even if the UI or API
    -- is bypassed.
    CASE WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'donor')
              IN ('donor', 'susn', 'partner')
         THEN COALESCE(NEW.raw_user_meta_data->>'role', 'donor')
         ELSE 'donor' END,
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'phone',
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Prevent direct API calls; only the trigger may invoke this function.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

-- Re-attach the trigger so it points at the corrected function body.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();