import { createClient } from 'jsr:@supabase/supabase-js@2';

// CORS headers for admin dashboard access.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Comma-separated list of auth user IDs allowed to call this function.
// Set in Supabase Edge Function secrets as ADMIN_USER_IDS, e.g.
// "11111111-... , 22222222-...". This is the only authorization layer —
// the client JWT alone is NOT sufficient.
function isAdmin(userId: string | undefined): boolean {
  if (!userId) return false;
  const admins = (Deno.env.get('ADMIN_USER_IDS') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  return admins.includes(userId);
}

interface VerifyRequest {
  /** Target table: 'susn_verification_requests' | 'partner_applications'. Defaults based on body.table. */
  table?: 'susn_verification_requests' | 'partner_applications';
  /** Row id of the application to review. */
  request_id: string;
  /** New status: 'approved' | 'rejected'. Transitions from 'pending' only. */
  status: 'approved' | 'rejected';
  /** Optional reviewer note. */
  reviewer_note?: string;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    // Authorization: the caller must present a valid user JWT AND be in
    // the ADMIN_USER_IDS allowlist. Without this, any signed-in user could
    // approve their own verification — bypassing the entire trust model.
    const authHeader = req.headers.get('Authorization') ?? '';
    const jwt = authHeader.replace('Bearer ', '');
    if (!jwt) {
      return jsonResponse({ error: 'Missing Authorization header' }, 401);
    }
    const supabaseAnon = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
    );
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(jwt);
    if (authError || !user) {
      return jsonResponse({ error: 'Invalid or expired token' }, 401);
    }
    if (!isAdmin(user.id)) {
      return jsonResponse({ error: 'Forbidden: not an admin' }, 403);
    }

    const payload = (await req.json()) as VerifyRequest;
    if (!payload?.request_id || !payload?.status) {
      return jsonResponse({ error: 'Missing request_id or status' }, 400);
    }
    if (payload.status !== 'approved' && payload.status !== 'rejected') {
      return jsonResponse({ error: 'status must be approved or rejected' }, 400);
    }

    // Use the service role key — bypasses RLS, only runs on the server.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } },
    );

    const table = payload.table ?? 'susn_verification_requests';

    // Fetch the application row.
    const { data: app, error: fetchError } = await supabaseAdmin
      .from(table)
      .select('*')
      .eq('id', payload.request_id)
      .maybeSingle();
    if (fetchError) {
      return jsonResponse({ error: `Fetch failed: ${fetchError.message}` }, 500);
    }
    if (!app) {
      return jsonResponse({ error: 'Application not found' }, 404);
    }
    if (app.status !== 'pending') {
      return jsonResponse({ error: `Application already ${app.status}` }, 409);
    }

    const user_id = app.user_id as string;

    if (payload.status === 'approved') {
      if (table === 'partner_applications') {
        // For partners: mark profile verified + create a `partners` row.
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({ verified: true })
          .eq('id', user_id);
        if (profileError) {
          return jsonResponse({ error: `Profile update failed: ${profileError.message}` }, 500);
        }

        const { error: partnerInsertError } = await supabaseAdmin
          .from('partners')
          .insert({
            name: app.store_name as string,
            type: app.store_type as string,
            city: app.city as string,
            logo_letter: (app.store_name as string).charAt(0)?.toUpperCase() ?? 'P',
            logo_color: '#000000',
          });
        if (partnerInsertError) {
          return jsonResponse({ error: `Partner insert failed: ${partnerInsertError.message}` }, 500);
        }
      } else {
        // For SUSN: mark profile verified only.
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({ verified: true })
          .eq('id', user_id);
        if (profileError) {
          return jsonResponse({ error: `Profile update failed: ${profileError.message}` }, 500);
        }
      }
    } else {
      // Rejected: do not change profile.verified, just record the note.
    }

    // Update the application status (backend-only transition).
    const { error: updateError } = await supabaseAdmin
      .from(table)
      .update({
        status: payload.status,
        reviewer_note: payload.reviewer_note ?? null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', payload.request_id);
    if (updateError) {
      return jsonResponse({ error: `Update failed: ${updateError.message}` }, 500);
    }

    return jsonResponse({
      ok: true,
      application_id: payload.request_id,
      status: payload.status,
      user_id,
    });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Unknown error' }, 500);
  }
});