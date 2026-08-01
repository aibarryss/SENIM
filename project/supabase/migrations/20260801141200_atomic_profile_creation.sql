/*
# SENIM Platform — Atomic Profile Creation via Trigger

## Overview
Previously, `signUp` in the frontend created an auth user via
`supabase.auth.signUp`, then made a *separate* INSERT into `profiles`.
If the second request failed (network, RLS, race), the result was an
"orphaned" auth user with no profile row — the user could log in but
`useAuth().profile` would always be `null`, breaking role-based UI.

This migration moves profile creation into the database as a trigger on
`auth.users`, so the profile row is created atomically with the auth user.
The frontend passes `role`, `display_name`, and `phone` through
`user_metadata` (Supabase Auth's `options.data`), and the trigger reads
them from `NEW.user_metadata`.

## Security model after this migration
- The `handle_new_user` function is `SECURITY DEFINER` so it can INSERT
  into `profiles` regardless of RLS (the just-created user is not yet
  authenticated when the trigger fires).
- EXECUTE is revoked from `anon` and `authenticated` so the function
  cannot be called directly via the API — only the trigger can invoke it.
- `role` defaults to `'donor'` if missing from metadata; `verified`
  is always `false` (only a service-role backend can flip it).
- The existing `insert_own_profile` RLS policy is kept as a safety net
  for backward compatibility, but the frontend no longer relies on it.
*/


-- =========================================================
-- handle_new_user: SECURITY DEFINER function that creates a
-- profiles row atomically with the auth.users row.
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
    COALESCE(NEW.user_metadata->>'role', 'donor'),
    NEW.user_metadata->>'display_name',
    NEW.user_metadata->>'phone',
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Prevent direct API calls; only the trigger may invoke this function.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;


-- =========================================================
-- TRIGGER: fire AFTER INSERT on auth.users
-- =========================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();