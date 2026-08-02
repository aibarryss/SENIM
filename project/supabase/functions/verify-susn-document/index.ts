import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method !== "POST")
    return new Response("Method not allowed", { status: 405 });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader)
    return new Response(JSON.stringify({ error: "Missing authorization" }), {
      status: 401,
    });

  const supabaseUser = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: userData, error: userError } =
    await supabaseUser.auth.getUser();
  if (userError || !userData.user) {
    return new Response(JSON.stringify({ error: "Invalid session" }), {
      status: 401,
    });
  }

  const { request_id } = await req.json();
  if (!request_id) {
    return new Response(JSON.stringify({ error: "request_id required" }), {
      status: 400,
    });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: reqRow, error: reqError } = await supabaseAdmin
    .from("susn_verification_requests")
    .select("id, user_id, document_path, status")
    .eq("id", request_id)
    .maybeSingle();

  if (reqError || !reqRow) {
    return new Response(JSON.stringify({ error: "Request not found" }), {
      status: 404,
    });
  }
  if (reqRow.user_id !== userData.user.id) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
    });
  }
  if (reqRow.status !== "pending") {
    return new Response(JSON.stringify({ error: "Request already reviewed" }), {
      status: 409,
    });
  }

  const { data: fileData, error: fileError } = await supabaseAdmin.storage
    .from("verification-documents")
    .download(reqRow.document_path);

  if (fileError || !fileData) {
    return new Response(
      JSON.stringify({ error: "Document not found in storage" }),
      { status: 404 },
    );
  }

  const bytes = new Uint8Array(await fileData.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i++)
    binary += String.fromCharCode(bytes[i]);
  const base64 = btoa(binary);
  const isPdf = reqRow.document_path.toLowerCase().endsWith(".pdf");
  const mediaType = isPdf ? "application/pdf" : "image/jpeg";

  // OpenRouter (OpenAI-compatible) supports image inputs via data URLs.
  // PDF documents are not supported by most OpenRouter vision models, so
  // we return a fallback AI result instead of failing the whole request.
  if (isPdf) {
    const parsed = {
      confidence: 0,
      checks: [] as string[],
      summary:
        "PDF documents are not supported by the current AI provider. Manual review required.",
    };
    await supabaseAdmin
      .from("susn_verification_requests")
      .update({ ai_result: parsed })
      .eq("id", request_id);
    return new Response(JSON.stringify({ ok: true, ai_result: parsed }), {
      status: 200,
    });
  }

  const openrouterKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!openrouterKey) {
    return new Response(
      JSON.stringify({ error: "AI provider not configured" }),
      { status: 500 },
    );
  }

  const prompt = `Ты помощник модератора платформы благотворительности SENIM (Казахстан).
Документ должен подтверждать статус нуждаемости (справка о многодетности,
инвалидности, малообеспеченности и т.п.). Ты НЕ принимаешь решение —
только даёшь рекомендацию человеку. Верни СТРОГО JSON, без markdown и пояснений:
{"confidence": number от 0 до 1, "checks": массив из "document_valid"|"name_match"|"date_valid" (только те, что подтвердились), "summary": "2-3 предложения на русском: что видно на документе, есть ли подозрения"}`;

  // OpenRouter uses the OpenAI chat completions format. Vision models accept
  // image inputs as data URLs in the content array.
  const aiResponse = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openrouterKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemma-2-9b-it:free",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:${mediaType};base64,${base64}` },
              },
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
    },
  );

  if (!aiResponse.ok) {
    return new Response(JSON.stringify({ error: "AI provider error" }), {
      status: 502,
    });
  }

  const aiJson = await aiResponse.json();
  // OpenRouter (OpenAI-compatible) returns choices[].message.content as a
  // string, not the Anthropic content-block array format.
  const textContent =
    aiJson?.choices?.[0]?.message?.content ?? "{}";

  let parsed;
  try {
    parsed = JSON.parse(textContent.replace(/```json|```/g, "").trim());
  } catch {
    parsed = {
      confidence: 0,
      checks: [],
      summary: "AI response could not be parsed — requires manual review.",
    };
  }

  const { error: updateError } = await supabaseAdmin
    .from("susn_verification_requests")
    .update({ ai_result: parsed })
    .eq("id", request_id);

  if (updateError) {
    return new Response(JSON.stringify({ error: "Failed to save AI result" }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify({ ok: true, ai_result: parsed }), {
    status: 200,
  });
});