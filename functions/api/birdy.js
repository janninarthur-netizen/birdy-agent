// Assistant IA Birdy : POST /api/birdy  {messages: [{role: "user"|"assistant", content: "..."}]}
// Répond en flux (text/event-stream) : lignes `data: {"t": "..."}` (texte visible), puis
// `data: {"choix": [...]}` (réponses rapides), `data: {"fiche": {...}}` (projet du visiteur) et `data: {"fin": true}`.
// Le modèle écrit <choix>…</choix> et <fiche>…</fiche> après sa réponse : ces balises ne sont jamais affichées.
// Deux moteurs possibles :
//  - gratuit : l'IA de Cloudflare (liaison « Workers AI » nommée AI dans les réglages Cloudflare Pages) ;
//  - payant : Claude, si le secret ANTHROPIC_API_KEY existe (prioritaire).
// Sans aucun des deux, ou si le quota gratuit du jour est épuisé, le site garde l'agent simple.
import { SYSTEM } from "../../lib/birdy-ctx.js";

// Date du jour (heure de Paris), pour que Birdy comprenne « samedi », « ce week-end »…
function aujourdhui() {
  const d = new Date();
  const long = d.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const iso = d.toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });
  return "\n\n# Date du jour\nNous sommes le " + long + " (" + iso + ").";
}

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
      const co = tout.match(/<cours>([\s\S]*?)(?:<\/cours>|$)/);
      if (co) { try { const o = JSON.parse(co[1].trim()); if (o && typeof o === "object") await w.write(sse({ cours: o })); } catch {} }
      const g = tout.match(/<golf>([\s\S]*?)(?:<\/golf>|$)/);
      if (g) { try { const o = JSON.parse(g[1].trim()); if (o && typeof o === "object") await w.write(sse({ golf: o })); } catch {} }
      const f = tout.match(/<fiche>([\s\S]*?)(?:<\/fiche>|$)/);
      if (f) {
        const brut = f[1].trim().replace(/^```(?:json)?|```$/g, "");
        let o = null;
        try { o = JSON.parse(brut); } catch {
          o = {}; // JSON mal formé : on récupère champ par champ
          for (const k of ["groupe", "nb", "destination", "periode", "dates", "budget", "niveau", "occasion", "resume"]) {
            const m = brut.match(new RegExp('"?' + k + '"?\\s*:\\s*(?:"([^"]*)"|(\\d+))'));
            if (m) o[k] = m[1] !== undefined ? m[1] : +m[2];
          }
        }
        if (o && typeof o === "object" && !Array.isArray(o) && Object.keys(o).length) await w.write(sse({ fiche: o }));
      }
      await w.write(sse({ fin: true }));
    },
  };
}

// Texte d'une réponse Workers AI, quel que soit le format du modèle
function texteDe(r) {
  if (!r) return "";
  if (typeof r === "string") return r;
  if (typeof r.response === "string") return r.response;
  if (r.choices && r.choices[0] && r.choices[0].message) return r.choices[0].message.content || "";
  if (Array.isArray(r.output)) {
    return r.output.filter((o) => o.type === "message").flatMap((o) => o.content || [])
      .filter((c) => c.type === "output_text" || c.type === "text").map((c) => c.text).join("");
  }
  return "";
}

// gpt-oss renvoie parfois son raisonnement interne (« analysis: … ») au lieu de sa réponse.
// On garde la partie finale si elle existe ; sinon la réponse est rejetée et on réessaie.
function reponseFinale(t, francais) {
  if (!t) return "";
  const m = t.split(/assistant\s*final|<\|channel\|>\s*final<\|message\|>/i);
  if (m.length > 1) t = m[m.length - 1];
  t = t.replace(/<\|[^|]*\|>/g, "").trim();
  if (/^(analysis|commentary|thinking|reasoning)\b/i.test(t)) return "";
  if (/\b(we need to|need respond|the user (asks|wants|says)|let's (craft|answer|respond))\b/i.test(t.slice(0, 200))) return "";
  // Réponse en anglais alors que le site est en français : rejetée (sauf si le visiteur écrit lui-même en anglais)
  if (francais) {
    const vis = t.split("<")[0];
    const en = (vis.match(/\b(the|and|you|your|with|within|offers|several|near|for|is|are|this|that)\b/gi) || []).length;
    const fr = (vis.match(/\b(le|la|les|des|vous|votre|pour|avec|est|sont|une|un|du|et)\b/gi) || []).length;
    if (en > 4 && en > fr) return "";
    // Mélange de langues (anglais, chinois…) au milieu d'une phrase française : rejeté aussi
    if (/[\u0400-\u04FF\u0590-\u06FF\u0E00-\u0E7F\u3040-\u30FF\u3400-\u9FFF\uAC00-\uD7AF]/.test(vis)) return "";
    if (/\b(could you|would you|can you|how many|per person|what is|please|near (?=[A-Z]))/i.test(vis)) return "";
  }
  return t;
}

// IA gratuite de Cloudflare. Génération en un bloc (le mode flux perd des espaces devant les nombres).
// Si un modèle échoue (quota, indisponible), on essaie le suivant.
async function cloudflareIA(env, messages) {
  const modeles = [env.CF_AI_MODEL, "@cf/openai/gpt-oss-120b", "@cf/openai/gpt-oss-120b", "@cf/meta/llama-3.3-70b-instruct-fp8-fast"].filter(Boolean);
  let texte = "";
  // Le visiteur écrit-il en français ? (dernier message)
  const dernier = messages[messages.length - 1].content;
  const francais = !/\b(the|and|you|what|where|how|please|golf course near)\b/i.test(dernier) || /[éèàçù]|\b(le|la|les|un|une|pour|près|vers)\b/i.test(dernier);
  for (const m of modeles) {
    try {
      const r = m.startsWith("@cf/openai/")
        ? await env.AI.run(m, { instructions: SYSTEM + aujourdhui(), input: messages, reasoning: { effort: "low" }, max_output_tokens: 3000 })
        : await env.AI.run(m, { messages: [{ role: "system", content: SYSTEM + aujourdhui() }, ...messages], max_tokens: 900, temperature: 0.3 });
      texte = reponseFinale(texteDe(r).trim(), francais);
      if (texte) break;
      console.log("Workers AI vide", m, JSON.stringify(r).slice(0, 300));
    } catch (e) {
      console.log("Workers AI", m, String(e).slice(0, 300));
    }
  }
  if (!texte) return json({ erreur: "occupe" }, 429);
  const { readable, writable } = new TransformStream();
  const w = writable.getWriter();
  const s = sortie(w);
  (async () => {
    try { await s.texte(texte); await s.fin(); } catch {} finally { try { await w.close(); } catch {} }
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
    system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }, { type: "text", text: aujourdhui() }],
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
