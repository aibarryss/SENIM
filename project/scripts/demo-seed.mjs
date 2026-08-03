#!/usr/bin/env node
/**
 * SENIM — Demo Seed Script
 *
 * Creates (idempotently) the four demo accounts, their profiles, three demo
 * campaigns/offers, and a demo SUSN verification request so the Admin Review
 * screen is not empty.
 *
 * REQUIREMENTS
 * - Node 18+ (uses global fetch).
 * - `@supabase/supabase-js` is already a dependency of this project.
 * - Environment variables (in project/.env, NOT prefixed with VITE_):
 *     SUPABASE_URL=http://127.0.0.1:54321        (local) or https://xxx.supabase.co
 *     SUPABASE_SERVICE_ROLE_KEY=eyJ...            (service role key — NEVER in frontend)
 *
 * USAGE
 *   npm run demo:seed
 *
 * SAFETY
 * - Never deletes real users/data.
 * - If a demo user already exists, it is reused (no duplicate).
 * - Demo-owned rows are marked with profiles.is_demo = true so demo:reset
 *   can remove ONLY demo data.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Minimal .env parser (no dotenv dependency). Reads project/.env.
// ---------------------------------------------------------------------------
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
      // Strip surrounding quotes.
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
      'Local: run `supabase status` to get the service_role key.',
      'Cloud: Supabase Dashboard → Project Settings → API → service_role.',
      '',
    ].join('\n'),
  );
  process.exit(1);
}

// Service-role client — bypasses RLS, used ONLY by this local/cloud script.
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ---------------------------------------------------------------------------
// Demo account definitions
// ---------------------------------------------------------------------------
const DEMO_PASSWORD = 'Demo1234!';

const DEMO_ACCOUNTS = [
  {
    email: 'demo.donor@senim.test',
    role: 'donor',
    displayName: 'Demo Donor',
    phone: '+7 700 000 0001',
    verified: false,
  },
  {
    email: 'demo.susn@senim.test',
    role: 'susn',
    displayName: 'Demo Beneficiary',
    phone: '+7 700 000 0002',
    verified: true,
  },
  {
    email: 'demo.partner@senim.test',
    role: 'partner',
    displayName: 'Demo Partner',
    phone: '+7 700 000 0003',
    verified: false,
  },
  {
    email: 'demo.admin@senim.test',
    role: 'admin',
    displayName: 'Demo Admin',
    phone: '+7 700 000 0004',
    verified: false,
  },
];

const DEMO_CAMPAIGNS = [
  {
    title: 'Food Package for a Family',
    description:
      'A monthly food package for a family in need: flour, rice, oil, canned goods and fresh produce.',
    category: 'grocery',
    region: 'Almaty',
    goal: 50000,
    raised: 15000,
    status: 'active',
    titleI18n: {
      ru: 'Продуктовый набор для семьи',
      kk: 'Отбасына азық-түлік жиынтығы',
    },
    descriptionI18n: {
      ru: 'Ежемесячный продуктовый набор для нуждающейся семьи: мука, рис, масло, консервы и свежие продукты.',
      kk: 'Мұқтаж отбасына ай сайынғы азық-түлік жиынтығы: ұн, күріш, май, консервілер және жаңа өнімдер.',
    },
  },
  {
    title: 'Medicine Support',
    description:
      'Covering the cost of essential prescription medicine for a chronically ill beneficiary for three months.',
    category: 'medicine',
    region: 'Astana',
    goal: 30000,
    raised: 25000,
    status: 'active',
    titleI18n: {
      ru: 'Поддержка лекарствами',
      kk: 'Дәрі-дәрмек қолдауы',
    },
    descriptionI18n: {
      ru: 'Покрытие стоимости жизненно важных рецептурных лекарств для хронически больного получателя на три месяца.',
      kk: 'Созылмалы ауруы бар алушыға үш айға қажетті рецепттік дәрілер құнын жабу.',
    },
  },
  {
    title: 'Winter Coal Support',
    description:
      'Providing coal for heating a rural household through the winter months.',
    category: 'winter',
    region: 'Karaganda',
    goal: 40000,
    raised: 40000,
    status: 'funded',
    titleI18n: {
      ru: 'Поддержка углём на зиму',
      kk: 'Қысқы көмір қолдауы',
    },
    descriptionI18n: {
      ru: 'Обеспечение углём для отопления сельского домохозяйства в зимние месяцы.',
      kk: 'Қыс айларында ауылдық үй шаруашылығын жылытуға көмірмен қамтамасыз ету.',
    },
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function log(step, message) {
  console.log(`[${step}] ${message}`);
}

async function findUserByEmail(email) {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  return data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

async function ensureDemoUser(account) {
  let user = await findUserByEmail(account.email);

  if (!user) {
    log('auth', `Creating ${account.email}...`);
    const { data, error } = await admin.auth.admin.createUser({
      email: account.email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: {
        role: account.role,
        display_name: account.displayName,
        phone: account.phone,
      },
    });
    if (error) throw error;
    user = data.user;
    log('auth', `Created ${account.email} (${user.id})`);
  } else {
    log('auth', `${account.email} already exists — reusing (${user.id})`);
  }

  // Upsert the profile (role / verified / display_name) via the service-role RPC.
  const { error: profileError } = await admin.rpc('upsert_demo_profile', {
    p_user_id: user.id,
    p_role: account.role,
    p_display_name: account.displayName,
    p_phone: account.phone,
    p_verified: account.verified,
  });
  if (profileError) throw profileError;
  log('profile', `Upserted profile for ${account.email} (role=${account.role}, verified=${account.verified})`);

  return user;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('=== SENIM Demo Seed ===\n');

  // 1. Demo users + profiles
  const users = {};
  for (const account of DEMO_ACCOUNTS) {
    users[account.role] = await ensureDemoUser(account);
  }

  // 2. Demo campaigns/offers
  for (const c of DEMO_CAMPAIGNS) {
    log('campaign', `Upserting "${c.title}"...`);
    const { error: campaignError } = await admin.rpc('upsert_demo_campaign', {
      p_title: c.title,
      p_description: c.description,
      p_category: c.category,
      p_region: c.region,
      p_goal: c.goal,
      p_raised: c.raised,
      p_status: c.status,
      p_creator_id: users.susn.id,
      p_title_i18n: c.titleI18n,
      p_description_i18n: c.descriptionI18n,
    });
    if (campaignError) throw campaignError;
  }
  log('campaign', 'Demo campaigns ready.');

  // 3. Demo SUSN verification request (pending, with demo AI result).
  //    AI result is a RECOMMENDATION only — the admin makes the final decision.
  log('verification', 'Upserting demo SUSN verification request...');
  const { error: verificationError } = await admin.rpc('upsert_demo_verification_request', {
    p_user_id: users.susn.id,
    p_document_path: `verification-documents/${users.susn.id}/demo-id-card.pdf`,
    p_ai_result: {
      confidence: 0.92,
      checks: ['document_valid', 'name_match', 'date_valid'],
      summary: 'Demo AI check: document appears valid. Final decision is made by an admin.',
    },
  });
  if (verificationError) throw verificationError;
  log('verification', 'Demo verification request ready.');

  console.log('\n=== Demo Seed Complete ===');
  console.log('');
  console.log('Demo accounts (password for all: Demo1234!):');
  for (const account of DEMO_ACCOUNTS) {
    console.log(`  ${account.role.padEnd(8)} ${account.email}`);
  }
  console.log('');
  console.log('See DEMO_ACCOUNTS.md for the full presentation flow.');
}

main().catch((err) => {
  console.error('\nDemo seed failed:', err.message);
  process.exit(1);
});