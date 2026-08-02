/*
# SENIM Platform - Secure admin role + server-only ai_result

## Security fixes
1. Admin self-escalation is closed at the database level. The
   `handle_new_user` trigger (migration 20260801141200) previously accepted
   `role` straight from `raw_user_meta_data`, so any client could register
   with `role = 'admin'` and gain access to the admin RPCs. We re-create
   the function to only ever assign a non-privileged role from the client;
   `admin` is provisioned exclusively by the backend / service role.
2. `ai_result` on `susn_verification_requests` is no longer writable by
   the client. The client must insert a request without it; the result is
   computed server-side by the Edge Function. This prevents anyone from
   faking an AI/OCR document check.
*/

-- =========================================================
-- 1. handle_new_user: never assign 'admin' from raw_user_meta_data
-- =========================================================
-- NOTE: GoTrue stores Supabase Auth `options.data` in the
-- `raw_user_meta_data` column of `auth.users`, NOT in a column named
-- `user_metadata`. Using `NEW.user_metadata` raises at runtime (column
-- does not exist), which rolls back the entire auth.users INSERT and
-- breaks every signUp(). This was the bug fixed by this migration's
-- successor (20260802234000); it is corrected here too so that a fresh
-- `db reset` produces a correct function without relying on the patch.

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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- =========================================================
-- 2. ai_result: server-only (client cannot INSERT it)
-- =========================================================

-- The client may only insert their own pending verification request, and
-- only WITHOUT ai_result. All other transitions are service-role only.
DROP POLICY IF EXISTS "insert_own_verification_request" ON susn_verification_requests;
CREATE POLICY "insert_own_verification_request"
  ON susn_verification_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND ai_result IS NULL);
