#!/usr/bin/env node
/**
 * SENIM — Demo Reset Script
 *
 * Removes ONLY demo data:
 *   - the four demo auth users (by fixed emails)
 *   - their profiles (is_demo = true)
 *   - the demo partner store (by fixed name)
 *   - the three demo campaigns (by fixed titles)
 *   - demo verification requests / donation intents / partner applications
 *     belonging to demo profiles
 *
 * It NEVER touches real users or real content.
 *
 * REQUIREMENTS
 * - Same env vars as demo:seed (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).
 *
 * USAGE
 *   npm run demo:reset
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

function loadEnv() {
  const envPath = resolve(projectRoot, '.env');
  const env = {};
  try {
    const raw = readFileSync(envPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    }
  } catch {
    // .env missing — handled below.
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    [
      'Missing Supabase credentials.',
      '',
      'Add to project/.env (NOT prefixed with VITE_):',
      '  SUPABASE_URL=http://127.0.0.1:54321',
      '  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key',
      '',
    ].join('\n'),
  );
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const DEMO_EMAILS = [
  'demo.donor@senim.test',
  'demo.susn@senim.test',
  'demo.partner@senim.test',
  'demo.admin@senim.test',
];

function log(step, message) {
  console.log(`[${step}] ${message}`);
}

async function main() {
  console.log('=== SENIM Demo Reset ===\n');

  // 1. Remove demo DB rows (campaigns, partner, verification requests,
  //    donation intents, partner applications, profiles) via the
  //    service-role RPC. This is scoped to demo-owned rows only.
  log('db', 'Removing demo-owned DB rows...');
  const { data: cleanup, error: cleanupError } = await admin.rpc('delete_demo_data');
  if (cleanupError) throw cleanupError;
  log('db', `Removed ${cleanup?.deleted_campaigns ?? 0} demo campaigns, ${cleanup?.deleted_profiles ?? 0} demo profiles.`);

  // 2. Delete the demo auth users (by fixed emails). Deleting an auth user
  //    cascades to their profile row (FK ON DELETE CASCADE).
  for (const email of DEMO_EMAILS) {
    const { data: users, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listError) throw listError;
    const user = users.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!user) {
      log('auth', `${email} not found — skipping.`);
      continue;
    }
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) throw deleteError;
    log('auth', `Deleted ${email} (${user.id})`);
  }

  console.log('\n=== Demo Reset Complete ===');
  console.log('Run `npm run demo:seed` to recreate the demo data.');
}

main().catch((err) => {
  console.error('\nDemo reset failed:', err.message);
  process.exit(1);
});