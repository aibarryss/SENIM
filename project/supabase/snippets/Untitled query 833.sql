SELECT
  grantee,
  table_name,
  privilege_type,
  column_name
FROM information_schema.column_privileges
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND grantee = 'authenticated'
  AND privilege_type = 'UPDATE'
ORDER BY column_name;