
/*
# SENIM Platform — Initial Schema

## Overview
Creates the full data model for the SENIM charity platform — a B2B2C system
connecting donors, assistance seekers (SUSN), and partner stores in Kazakhstan.

## New Tables

### partners
Registered partner stores/pharmacies that redeem QR vouchers.
- id (uuid, pk)
- name (text) — store display name
- type (text) — 'supermarket' | 'pharmacy' | 'clothing' | 'education'
- city (text)
- logo_letter (text) — single letter for the logo avatar
- logo_color (text) — hex color for the avatar background
- created_at

### campaigns
Each assistance request (offer) posted by a verified SUSN user.
- id (uuid, pk)
- title, description
- category — 'grocery' | 'medicine' | 'winter' | 'education'
- region — city in Kazakhstan
- goal_amount, raised_amount (numeric)
- urgency — 'urgent' | 'high_priority' | 'verified' | null
- status — 'active' | 'funded' | 'completed'
- image_url — hotlinked stock photo
- partner_id — which store fulfills this request
- created_at

### transactions
Live feed of voucher redemptions and donations.
- id (uuid, pk)
- type — 'voucher_redemption' | 'medicine_purchase' | 'utility_payment'
- voucher_number (text)
- store_name, city
- amount (numeric)
- created_at — used for "X mins ago" display

### platform_stats
Single-row table for live ticker numbers.
- id (int, pk = 1)
- food_baskets_today (int)
- verified_aid_almaty (numeric)
- active_qr_vouchers (int)
- families_helped (int)
- partner_retailers (int)

### profiles
Extended user info linked to Supabase auth users.
- id (uuid, pk, references auth.users)
- role — 'donor' | 'susn' | 'partner'
- display_name (text, nullable for anonymous donors)
- phone (text)
- verified (boolean) — AI verification status for SUSN
- created_at

## Security
- RLS enabled on all tables
- Public read access (anon + authenticated) for campaigns, partners, transactions, platform_stats
- Profiles: users can only read/update their own row
- Campaigns: authenticated users can insert; public can read
- Transactions: public read; system insert only
*/

-- PARTNERS
CREATE TABLE IF NOT EXISTS partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'supermarket',
  city text NOT NULL DEFAULT 'Almaty',
  logo_letter text NOT NULL DEFAULT 'P',
  logo_color text NOT NULL DEFAULT '#000000',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_partners" ON partners;
CREATE POLICY "anon_select_partners" ON partners FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_partners" ON partners;
CREATE POLICY "auth_insert_partners" ON partners FOR INSERT TO authenticated WITH CHECK (true);


-- CAMPAIGNS
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'grocery',
  region text NOT NULL DEFAULT 'Almaty',
  goal_amount numeric NOT NULL DEFAULT 0,
  raised_amount numeric NOT NULL DEFAULT 0,
  urgency text,
  status text NOT NULL DEFAULT 'active',
  image_url text,
  partner_id uuid REFERENCES partners(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_campaigns" ON campaigns;
CREATE POLICY "anon_select_campaigns" ON campaigns FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_campaigns" ON campaigns;
CREATE POLICY "auth_insert_campaigns" ON campaigns FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_campaigns" ON campaigns;
CREATE POLICY "auth_update_campaigns" ON campaigns FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);


-- TRANSACTIONS
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'voucher_redemption',
  voucher_number text,
  store_name text NOT NULL,
  city text NOT NULL DEFAULT 'Almaty',
  amount numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_transactions" ON transactions;
CREATE POLICY "anon_select_transactions" ON transactions FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_transactions" ON transactions;
CREATE POLICY "anon_insert_transactions" ON transactions FOR INSERT TO anon, authenticated WITH CHECK (true);


-- PLATFORM STATS
CREATE TABLE IF NOT EXISTS platform_stats (
  id int PRIMARY KEY DEFAULT 1,
  food_baskets_today int NOT NULL DEFAULT 0,
  verified_aid_almaty numeric NOT NULL DEFAULT 0,
  active_qr_vouchers int NOT NULL DEFAULT 0,
  families_helped int NOT NULL DEFAULT 0,
  partner_retailers int NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE platform_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_stats" ON platform_stats;
CREATE POLICY "anon_select_stats" ON platform_stats FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_update_stats" ON platform_stats;
CREATE POLICY "anon_update_stats" ON platform_stats FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);


-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'donor',
  display_name text,
  phone text,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);


-- INDEXES
CREATE INDEX IF NOT EXISTS idx_campaigns_category ON campaigns(category);
CREATE INDEX IF NOT EXISTS idx_campaigns_region ON campaigns(region);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
