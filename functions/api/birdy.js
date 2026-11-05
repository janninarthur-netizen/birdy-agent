// Assistant IA Birdy : POST /api/birdy  {messages: [{role: "user"|"assistant", content: "..."}]}
// Répond en flux (text/event-stream) : lignes `data: {"t": "..."}` (texte visible), puis
// `data: {"choix": [...]}` (réponses rapides), `data: {"fiche": {...}}` (projet du visiteur) et `data: {"fin": true}`.
// Le modèle écrit <choix>…</choix> et <fiche>…</fiche> après sa réponse : ces balises ne sont jamais affichées.
// Deux moteurs possibles :
//  - gratuit : l'IA de Cloudflare (liaison « Workers AI » nommée AI dans les réglages Cloudflare Pages) ;
//  - payant : Claude, si le secret ANTHROPIC_API_KEY existe (prioritaire).
// Sans aucun des deux, ou si le quota gratuit du jour est épuisé, le site garde l'agent simple.
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

const enc = new TextEncoder();
const sse = (o) => enc.encode("data: " + JSON.stringify(o) + "\n\n");
const FLUX = { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" };

// Lit un flux SSE ligne à ligne et appelle chaque(objet) pour chaque « data: {...} »
async function litSSE(corps, chaque) {
  const lecteur = corps.getReader(), dec = new TextDecoder();
  let tampon = "";
  for (;;) {
    const { done, value } = await lecteur.read();
    if (done) break;
    tampon += dec.decode(value, { stream: true });
    let k;
    while ((k = tampon.indexOf("\n")) > -1) {
      const l = tampon.slice(0, k).trim(); tampon = tampon.slice(k + 1);
      if (!l.startsWith("data:")) continue;
      const d = l.slice(5).trim();
      if (d === "[DONE]") continue;
      let ev; try { ev = JSON.parse(d); } catch { continue; }
      await chaque(ev);
    }
  }
}

// Filtre la sortie du modèle : envoie le texte visible au fur et à mesure, garde les balises pour la fin
function sortie(w) {
  let tout = "", envoye = 0;
  return {
    reset() { tout = ""; envoye = 0; },
    async texte(t) {
      tout += t;
      const cut = tout.indexOf("<"), vis = cut < 0 ? tout : tout.slice(0, cut);
      if (vis.length > envoye) { await w.write(sse({ t: vis.slice(envoye) })); envoye = vis.length; }
    },
    async fin() {
      const c = tout.match(/<choix>([\s\S]*?)(?:<\/choix>|$)/);
      if (c) {
        const l = c[1].split("|").map((x) => x.replace(/<[^>]*>/g, "").trim()).filter(Boolean).slice(0, 4).map((x) => x.slice(0, 40));
        if (l.length) await w.write(sse({ choix: l }));
      }
      const f = tout.match(/<fiche>([\s\S]*?)(?:<\/fiche>|$)/);
      if (f) {
        try {
          const o = JSON.parse(f[1].trim().replace(/^```(?:json)?|```$/g, ""));
          if (o && typeof o === "object" && !Array.isArray(o)) await w.write(sse({ fiche: o }));
        } catch {}
      }
      await w.write(sse({ fin: true }));
    },
  };
}

async function cloudflareIA(env, messages) {
  const model = env.CF_AI_MODEL || "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
  let flux;
  try {
    flux = await env.AI.run(model, { messages: [{ role: "system", content: SYSTEM }, ...messages], stream: true, max_tokens: 600, temperature: 0.35 });
  } catch (e) {
    console.log("Workers AI", String(e).slice(0, 300)); // quota du jour épuisé, modèle indisponible…
    return json({ erreur: "occupe" }, 429);
  }
  const { readable, writable } = new TransformStream();
  const w = writable.getWriter();
  const s = sortie(w);
  (async () => {
    try {
      await litSSE(flux, async (ev) => {
        const t = ev.response ?? (ev.choices && ev.choices[0] && ev.choices[0].delta && ev.choices[0].delta.content);
        if (t !== undefined && t !== null && t !== "") await s.texte(String(t));
      });
      await s.fin();
    } catch {
      try { await w.write(sse({ erreur: "reseau" })); } catch {}
    } finally {
      try { await w.close(); } catch {}
    }
  })();
  return new Response(readable, { headers: FLUX });
}

export async function onRequestPost({ request, env }) {
  if (!env.ANTHROPIC_API_KEY && !env.AI) return json({ erreur: "indisponible" }, 503);
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(request.url).host) return json({ erreur: "origine" }, 403);

  let body;
  try { body = await request.json(); } catch { return json({ erreur: "format" }, 400); }
  const messages = nettoie(body);
  if (!messages) return json({ erreur: "format" }, 400);
  if (!env.ANTHROPIC_API_KEY) return cloudflareIA(env, messages);

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

  const { readable, writable } = new TransformStream();
  const w = writable.getWriter();
  const s = sortie(w);
  (async () => {
    let refus = false;
    try {
      await litSSE(up.body, async (ev) => {
        if (ev.type === "content_block_start" && ev.content_block && ev.content_block.type === "fallback") { s.reset(); await w.write(sse({ reset: true })); }
        else if (ev.type === "content_block_delta" && ev.delta && ev.delta.type === "text_delta") await s.texte(ev.delta.text);
        else if (ev.type === "message_delta" && ev.delta && ev.delta.stop_reason === "refusal") refus = true;
        else if (ev.type === "error") await w.write(sse({ erreur: "api" }));
      });
      if (refus) await w.write(sse({ erreur: "refus" })); else await s.fin();
    } catch {
      try { await w.write(sse({ erreur: "reseau" })); } catch {}
    } finally {
      try { await w.close(); } catch {}
    }
  })();

  return new Response(readable, { headers: FLUX });
}
