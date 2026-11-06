// API de la page privée /suivi/ : liste, détail et mise à jour des demandes.
// Accès : en-tête « x-suivi-code » égal au secret SUIVI_CODE. Stockage : liaison KV « DEMANDES ».
import { autorise, lister, lire, modifier, STATUTS } from "../../lib/demandes.js";

const json = (status, body) => Response.json(body, { status, headers: { "cache-control": "no-store", "x-robots-tag": "noindex" } });

function verifie(request, env) {
  if (!env.DEMANDES || !env.SUIVI_CODE || env.SUIVI_CODE.length < 8)
    return json(503, { erreur: "non_configure", stockage: !!env.DEMANDES, code: !!(env.SUIVI_CODE && env.SUIVI_CODE.length >= 8) });
  if (!autorise(request, env)) return json(401, { erreur: "code" });
  return null;
}

export async function onRequestGet({ request, env }) {
  const refus = verifie(request, env); if (refus) return refus;
  const id = new URL(request.url).searchParams.get("id");
  if (id) { const d = await lire(env, id); return d ? json(200, d) : json(404, { erreur: "introuvable" }); }
  return json(200, { demandes: await lister(env), statuts: STATUTS });
}

export async function onRequestPost({ request, env }) {
  const refus = verifie(request, env); if (refus) return refus;
  let b; try { b = await request.json(); } catch { return json(400, { erreur: "format" }); }
  if (!b || typeof b.id !== "string" || !b.id.startsWith("d:")) return json(400, { erreur: "id" });
  const d = await modifier(env, b.id, { statut: b.statut, note_interne: b.note_interne });
  return d ? json(200, d) : json(404, { erreur: "introuvable" });
}
