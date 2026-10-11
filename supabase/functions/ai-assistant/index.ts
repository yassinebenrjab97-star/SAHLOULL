// ============================================================================
//  Supabase Edge Function — ai-assistant
//  Proxies an OpenAI-compatible chat completion endpoint, streaming the answer
//  back as Server-Sent Events. The client (src/lib/ai.ts) parses those frames
//  and degrades gracefully to a local assistant if this function is unavailable.
//
//  Required secret:  AI_API_KEY
//  Optional:         AI_API_URL (default https://api.openai.com/v1/chat/completions)
//                    AI_MODEL   (default gpt-4o-mini)
//
//  Deploy:  supabase functions deploy ai-assistant --no-verify-jwt
//  Secret:  supabase secrets set AI_API_KEY=sk-...
// ============================================================================

// deno-lint-ignore-file no-explicit-any

const AI_API_URL =
  Deno.env.get("AI_API_URL") ?? "https://api.openai.com/v1/chat/completions";
const AI_MODEL = Deno.env.get("AI_MODEL") ?? "gpt-4o-mini";
const AI_API_KEY = Deno.env.get("AI_API_KEY") ?? "";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface IncomingMessage {
  role: "user" | "assistant";
  content: string;
}

interface Payload {
  messages?: IncomingMessage[];
  language?: string;
  system?: string;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const system = (payload.system ?? "").trim();
  const messages = Array.isArray(payload.messages) ? payload.messages : [];

  if (!system || messages.length === 0) {
    return json({ error: "missing_system_or_messages" }, 400);
  }
  if (!AI_API_KEY) {
    // The client falls back to its built-in assistant on any non-2xx.
    return json({ error: "ai_not_configured" }, 503);
  }

  const upstreamBody = {
    model: AI_MODEL,
    stream: true,
    temperature: 0.3,
    max_tokens: 700,
    messages: [
      { role: "system", content: system },
      ...messages.slice(-12).map((m) => ({
        role: m.role,
        content: String(m.content ?? "").slice(0, 4000),
      })),
    ],
  };

  let upstream: Response;
  try {
    upstream = await fetch(AI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify(upstreamBody),
    });
  } catch {
    return json({ error: "upstream_unreachable" }, 502);
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    return json({ error: "upstream_error", status: upstream.status, detail: detail.slice(0, 300) }, 502);
  }

  // Pipe the upstream SSE stream straight through to the browser.
  return new Response(upstream.body, {
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
});
