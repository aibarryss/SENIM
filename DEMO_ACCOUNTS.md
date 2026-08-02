# SENIM — Demo Accounts & Presentation Flow

This file documents the demo accounts, how to seed them, and the full demo presentation flow.

## Demo Accounts

| Role    | Email                          | Password  | Display name       |
| ------- | ------------------------------ | --------- | ------------------ |
| Donor   | demo.donor@senim.test          | Demo1234! | Demo Donor         |
| SUSN    | demo.susn@senim.test           | Demo1234! | Demo Beneficiary   |
| Partner | demo.partner@senim.test       | Demo1234! | Demo Partner       |
| Admin   | demo.admin@senim.test         | Demo1234! | Demo Admin         |

> Password is the same for all demo accounts: `Demo1234!`

## How to create demo accounts

### 1. Prerequisites

- Node 18+
- A running Supabase instance (local or cloud)
- The latest migrations applied

### 2. Add service-role credentials to `project/.env`

These are **server-side only** variables (no `VITE_` prefix, so they never reach the frontend):

```
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

- **Local Supabase**: run `supabase status` to get the `service_role` key.
- **Cloud Supabase**: Dashboard → Project Settings → API → `service_role`.

### 3. Apply migrations (if not already)

```
supabase db push
```

### 4. Seed demo data

```
npm run demo:seed
```

This creates (idempotently — safe to re-run):
- 4 demo auth users (donor, susn, partner, admin) with `email_confirm: true`
- Their `profiles` rows (role, display_name, verified flag)
- The demo SUSN is `verified = true` (so it can create requests)
- The demo admin has `role = 'admin'` (provisioned server-side — the client cannot self-assign admin)
- A demo partner store (`Demo Partner Store`)
- 3 demo campaigns/offers (see below)
- A demo SUSN verification request (pending, with a demo AI result) so Admin Review is not empty

### 5. (Optional) Reset demo data

```
npm run demo:reset
```

This removes **only** demo-owned rows (marked `profiles.is_demo = true`, fixed campaign titles, fixed partner name). It never touches real users or real content.

## Demo Campaigns / Offers

| Title                     | Goal (₸) | Raised (₸) | Status  |
| ------------------------- | -------- | ---------- | ------- |
| Food Package for a Family | 50 000   | 15 000     | active  |
| Medicine Support          | 30 000   | 25 000     | active  |
| Winter Coal Support       | 40 000   | 40 000     | funded  |

## Demo Presentation Flow

1. **Login as Donor** (`demo.donor@senim.test`)
2. Open the list of offers (`/browse`)
3. Open an offer → click **Donate**
4. Choose an amount → open **Mock Payment**
5. Complete the Mock Payment
6. See the success result (donation intent created via `record_mock_donation`)
7. Open **My Donations** (`/my-donations`) → see the donation, payment ID, and offer progress
8. **Login as SUSN** (`demo.susn@senim.test`)
9. Open **My Requests** (`/my-requests`)
10. Show notifications (funded / voucher ready / help received)
11. Show the QR voucher (generate one if empty)
12. **Login as Partner** (`demo.partner@senim.test`)
13. Open **Partner Dashboard** (`/partner-dashboard`)
14. Enter the voucher code → **Scan** → see Valid
15. Click **Redeem** → voucher becomes Redeemed
16. Try to redeem the same code again → see "Already Redeemed"
17. **Login as Admin** (`demo.admin@senim.test`)
18. Open **Admin Review** (`/admin`)
19. Show the pending verification request + AI result
20. Click **Approve** (or **Reject**) → the SUSN's `verified` flag updates

## What is REAL vs MOCK/DEMO

### REAL (backed by the database + RLS)
- Auth (Supabase Auth — real sign-in, real JWT sessions)
- `profiles` (role, verified) — role/verified are set server-side only
- `campaigns` (offers) — real rows in the DB
- `donation_intents` — real rows, created via the `record_mock_donation` RPC
- `record_mock_donation` RPC — atomically increments `raised_amount` and flips `status` to `funded`
- Admin Review — real RPCs (`admin_list_verification_requests`, `admin_review_application`)
- RLS enforcement on all tables

### MOCK / DEMO (clearly marked in the UI)
- **Mock Payment** (`MockPaymentModal`) — simulates a payment, no real money
- **QR Vouchers** — stored in `localStorage` (`senim_demo_vouchers`), not in the DB
- **Partner Dashboard statistics** — derived from the localStorage demo vouchers
- **SUSN notifications** — stored in `localStorage` (`senim_demo_notifications_{userId}`)
- **Demo seed data** — the 4 accounts, 3 campaigns, 1 partner, 1 verification request

## Known limitations

- **QR voucher flow is localStorage-only**: vouchers exist per-browser. The donor/SUSN and the partner must use the same browser for the demo scan/redeem to work. This is explicitly labelled as "Demo" in the UI.
- **No real payment provider**: Mock Payment is the only path. `confirm_donation` (service-role webhook RPC) exists but no real webhook is wired.
- **No `notifications` table**: SUSN notifications are demo-only (localStorage). They are seeded on first visit to `/my-requests`.
- **Partner Dashboard stats are demo-only**: they reflect localStorage vouchers, not a server-side aggregate.
- **Admin Review covers SUSN verification only**: `partner_applications` are not shown in the Admin Review UI (out of scope for this demo).
- **"Help Delivered" is an approximation**: it is shown when a campaign is `funded` and a related demo voucher has been redeemed in the same browser.
- **Email confirmation**: demo users are created with `email_confirm: true` via the Admin API, so no email round-trip is needed for the demo.
- **Not production-verified**: everything here was tested locally only.