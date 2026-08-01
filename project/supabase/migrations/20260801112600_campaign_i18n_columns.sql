/*
# SENIM Platform — Add i18n columns for campaign title & description

## Overview
Campaigns store user-generated `title` and `description` as plain text.
On a multilingual platform (kk/ru/en) this means a request created in
one language is shown verbatim in every other locale — the core of the
reported bug ("some data from the DB is still in English").

This migration adds nullable JSONB columns `title_i18n` and
`description_i18n` to `campaigns`. Each is a map of locale -> text, e.g.
  {"kk": "...", "ru": "...", "en": "..."}

The original `title` / `description` columns are kept as the fallback
source of truth for rows that have no translation yet, so existing data
and the current insert flow keep working unchanged.

## Backfill
Existing rows get `title_i18n` / `description_i18n` populated from the
plain-text columns under the `en` locale (the historical seed language),
so the new accessor can always find a value. This is a one-time backfill
and is safe to re-run (it only fills NULLs).

## RLS
No policy changes — the new columns inherit the existing campaigns
SELECT (public read) / INSERT (verified SUSN) / UPDATE (service role)
policies because RLS is table-level, not column-level here.
*/

-- Add nullable JSONB i18n columns.
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS title_i18n jsonb,
  ADD COLUMN IF NOT EXISTS description_i18n jsonb;

-- One-time backfill: copy plain-text values into the `en` locale slot
-- so the localized accessor always has a fallback for legacy rows.
UPDATE campaigns
SET title_i18n = COALESCE(title_i18n, jsonb_build_object('en', title))
WHERE title_i18n IS NULL;

UPDATE campaigns
SET description_i18n = COALESCE(description_i18n, jsonb_build_object('en', description))
WHERE description_i18n IS NULL;