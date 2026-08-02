import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * Payment webhook Edge Function (provider-agnostic skeleton).
 *
 * This function receives webhook deliveries from a payment provider when a
 * donation payment is confirmed. It verifies the provider's signature (TODO —
 * provider-specific), parses the payload (TODO — provider-specific), and calls
 * the `confirm_donation` RPC to atomically reconcile the donation intent,
 * campaign totals, and platform stats.
 *
 * STATUS: SKELETON — not deployed. Signature verification and payload parsing
 * are stubs that must be replaced with provider-specific logic once a payment
 * provider (Kaspi Pay, Halyk e-commerce gateway, or other) is selected and its
 * official API docs are provided. Do NOT deploy this function until those stubs
 * are filled in — a webhook endpoint without real signature verification is a
 * security hole.
 *
 * TASK-013b (separate): payment initiation — creating a payment session at the
 * provider and writing `provider_reference` to `donation_intents` before the
 * user pays. This webhook only handles the confirmation side.
 */

Deno.serve(async (req) => {
  if (req.method !== "POST")
    return new Response("Method not allowed", { status: 405 });

  // =========================================================
  // 1. Signature verification (TODO — provider-specific)
  // =========================================================
  // Replace this stub with the provider's documented signature verification.
  // Common patterns:
  //   - HMAC-SHA256 of the raw request body, compared in constant time.
  //   - The header name varies by provider (e.g. X-Signature, X-Webhook-Signature).
  //   - The signing key is stored as a Supabase secret (PAYMENT_WEBHOOK_SECRET).
  //
  // Example (pseudo-code):
  //   const rawBody = await req.text();
  //   const signature = req.headers.get("X-Provider-Signature");
  //   const webhookSecret = Deno.env.get("PAYMENT_WEBHOOK_SECRET");
  //   if (!webhookSecret || !signature) return 401;
  //   const computed = await crypto.subtle.digest("HMAC-SHA256", ...);
  //   if (!constantTimeEqual(computed, signature)) return 401;

  const signature = req.headers.get("X-Provider-Signature");
  const webhookSecret = Deno.env.get("PAYMENT_WEBHOOK_SECRET");

  // TODO: implement real signature verification per provider API docs.
  // Until then, reject all webhook deliveries to prevent unauthenticated calls.
  if (!webhookSecret || !signature) {
    return new Response(
      JSON.stringify({ error: "Invalid signature — provider not configured" }),
      { status: 401 },
    );
  }

  // =========================================================
  // 2. Payload parsing (TODO — provider-specific)
  // =========================================================
  // Replace this stub with the provider's documented payload structure.
  // The webhook must extract:
  //   - intent_id: the donation_intents.id (passed to the provider during
  //     payment initiation in TASK-013b, echoed back in the webhook).
  //   - provider_reference: the provider's transaction/session id.
  //   - amount: the confirmed payment amount (for validation; the RPC trusts
  //     the DB row's amount, not this value, to prevent tampering).

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON payload" }),
      { status: 400 },
    );
  }

  // TODO: replace with provider-specific field names per official API docs.
  const intentId = body?.intent_id;
  const providerReference = body?.provider_reference;
  const amount = body?.amount;

  if (!intentId) {
    return new Response(
      JSON.stringify({ error: "intent_id required in payload" }),
      { status: 400 },
    );
  }

  // =========================================================
  // 3. Reconciliation via confirm_donation RPC (service role)
  // =========================================================
  // The RPC is SECURITY DEFINER and REVOKE'd from anon/authenticated — only
  // the service role can call it. It handles:
  //   a. Idempotent pending -> confirmed transition (duplicate webhook = no-op)
  //   b. campaigns.raised_amount increment
  //   c. active -> funded transition + families_helped increment
  //   d. platform_stats.updated_at refresh

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc(
    "confirm_donation",
    {
      p_intent_id: intentId,
      p_provider_reference: providerReference ?? null,
      p_amount: amount ?? 0,
    },
  );

  if (rpcError) {
    return new Response(
      JSON.stringify({ error: "Reconciliation failed", detail: rpcError.message }),
      { status: 500 },
    );
  }

  // The RPC returns { ok, duplicate, intent_id, campaign_id, amount }.
  // A duplicate webhook (already confirmed) returns { ok: true, duplicate: true }
  // — we respond 200 so the provider stops retrying.
  return new Response(
    JSON.stringify({ ok: true, result: rpcResult }),
    { status: 200 },
  );
});