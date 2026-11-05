// Assistant IA Birdy : POST /api/birdy  {messages: [{role: "user"|"assistant", content: "..."}]}
// Répond en flux (text/event-stream) : lignes `data: {"t": "..."}` puis `data: {"fin": true}`.
// Sans clé ANTHROPIC_API_KEY (secret Cloudflare), répond 503 et le site garde l'agent simple.
import { SYSTEM } from "../../lib/birdy-ctx.js";

const MAX_MSG = 16, MAX_LEN = 1200, MAX_TOTAL = 9000;

function json(obj, status) {
  return new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}

function nettoie(body) {
  if (!body || !Array.isArray(body.messages)) return null;
  const msgs = body.messages.slice(-MAX_MSG)
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, MAX_LEN) }));
  while (msgs.length && msgs[0].role !== "user") msgs.shift();
  // rôles alternés obligatoires : on fusionne les messages consécutifs du même rôle
  const out = [];
  for (const m of msgs) {
    const prev = out[out.length - 1];
    if (prev && prev.role === m.role) prev.content += "\n" + m.content; else out.push({ ...m });
  }
  if (!out.length || out[out.length - 1].role !== "user") return null;
  let total = 0, debut = 0;
  for (let i = out.length - 1; i >= 0; i--) { total += out[i].content.length; if (total > MAX_TOTAL) { debut = i + 1; break; } }
  const garde = out.slice(debut);
  while (garde.length && garde[0].role !== "user") garde.shift();
  return garde.length ? garde : null;
}

export async function onRequestPost({ request, env }) {
  if (!env.ANTHROPIC_API_KEY) return json({ erreur: "indisponible" }, 503);
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(request.url).host) return json({ erreur: "origine" }, 403);

  let body;
  try { body = await request.json(); } catch { return json({ erreur: "format" }, 400); }
  const messages = nettoie(body);
  if (!messages) return json({ erreur: "format" }, 400);

  const model = env.CLAUDE_MODEL || "claude-opus-5-5";
  const req = {
    model,
    max_tokens: 2000,
    stream: true,
    output_config: { effort: "low" },
    system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
    messages,
  };
  const headers = {
    "content-type": "application/json",
    "x-api-key": env.ANTHROPIC_API_KEY,
    "anthropic-version": "2026-10-21",
  };
  if (!model.startsWith("claude-haiku")) { // relance automatique sur un autre modèle en cas de refus de sécurité
    req.fallbacks = "default";
    headers["anthropic-beta"] = "server-side-fallback-2026-07-01";
  }

  let up;
  try {
    up = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers, body: JSON.stringify(req) });
  } catch {
    return json({ erreur: "reseau" }, 502);
  }
  if (!up.ok || !up.body) {
    console.log("Anthropic", up.status, (await up.text()).slice(0, 300));
    return json({ erreur: up.status === 429 ? "occupe" : "api" }, up.status === 429 ? 429 : 502);
  }

  const enc = new TextEncoder(), dec = new TextDecoder();
  const { readable, writable } = new TransformStream();
  const w = writable.getWriter();
  const envoie = (o) => w.write(enc.encode("data: " + JSON.stringify(o) + "\n\n"));

  (async () => {
    const lecteur = up.body.getReader();
    let tampon = "", refus = false;
    try {
      for (;;) {
        const { done, value } = await lecteur.read();
        if (done) break;
        tampon += dec.decode(value, { stream: true });
        let k;
        while ((k = tampon.indexOf("\n\n")) > -1) {
          const bloc = tampon.slice(0, k); tampon = tampon.slice(k + 2);
          const ligne = bloc.split("\n").find((l) => l.startsWith("data:"));
          if (!ligne) continue;
          let ev; try { ev = JSON.parse(ligne.slice(5)); } catch { continue; }
          if (ev.type === "content_block_start" && ev.content_block && ev.content_block.type === "fallback") await envoie({ reset: true });
          else if (ev.type === "content_block_delta" && ev.delta && ev.delta.type === "text_delta") await envoie({ t: ev.delta.text });
          else if (ev.type === "message_delta" && ev.delta && ev.delta.stop_reason === "refusal") refus = true;
          else if (ev.type === "error") { await envoie({ erreur: "api" }); }
        }
      }
      await envoie(refus ? { erreur: "refus" } : { fin: true });
    } catch {
      try { await envoie({ erreur: "reseau" }); } catch {}
    } finally {
      try { await w.close(); } catch {}
    }
  })();

  return new Response(readable, { headers: { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" } });
}
