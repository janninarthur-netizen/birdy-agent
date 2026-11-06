// Enregistrement des demandes (voyage et départ) pour la page privée /suivi/.
//
// Stockage : Cloudflare KV, liaison nommée DEMANDES (Workers & Pages → birdy-agent → Settings → Bindings).
// Accès à /suivi/ : secret SUIVI_CODE (Settings → Variables and Secrets), au moins 8 caractères.
// Sans liaison DEMANDES, rien n'est enregistré et le site fonctionne comme avant (notification seule).

export const STATUTS = ["nouveau", "a_rappeler", "en_cours", "confirme", "annule"];

function cle() {
  // Clé décroissante dans le temps : la liste KV renvoie les demandes les plus récentes d'abord
  const rev = (9e15 - Date.now()).toString(36).padStart(11, "0");
  return "d:" + rev + "-" + Math.random().toString(36).slice(2, 7);
}

function meta(d) {
  return { type: d.type, statut: d.statut, cree: d.cree, prenom: d.prenom.slice(0, 40), titre: (d.titre || "").slice(0, 120) };
}

// Renvoie l'identifiant de la demande, ou null si le stockage n'est pas activé
export async function enregistrer(env, d) {
  if (!env.DEMANDES) return null;
  try {
    const id = cle();
    const fiche = { id, statut: "nouveau", cree: new Date().toISOString(), note_interne: "", historique: [], ...d };
    await env.DEMANDES.put(id, JSON.stringify(fiche), { metadata: meta(fiche) });
    return id;
  } catch (e) {
    console.error("Enregistrement demande : " + String(e).slice(0, 200));
    return null;
  }
}

export async function lister(env, limite = 300) {
  const out = [];
  let curseur;
  do {
    const r = await env.DEMANDES.list({ prefix: "d:", cursor: curseur, limit: 1000 });
    for (const k of r.keys) out.push({ id: k.name, ...(k.metadata || {}) });
    curseur = r.list_complete ? null : r.cursor;
  } while (curseur && out.length < limite);
  return out.slice(0, limite);
}

export async function lire(env, id) {
  const v = await env.DEMANDES.get(id);
  return v ? JSON.parse(v) : null;
}

export async function modifier(env, id, changes) {
  const d = await lire(env, id);
  if (!d) return null;
  if (changes.statut && STATUTS.includes(changes.statut) && changes.statut !== d.statut) {
    d.historique.push({ quand: new Date().toISOString(), de: d.statut, vers: changes.statut });
    d.statut = changes.statut;
  }
  if (typeof changes.note_interne === "string") d.note_interne = changes.note_interne.slice(0, 1000);
  await env.DEMANDES.put(id, JSON.stringify(d), { metadata: meta(d) });
  return d;
}

// Vérifie le code d'accès (en-tête « x-suivi-code »), en temps constant
export function autorise(request, env) {
  const attendu = env.SUIVI_CODE || "";
  const donne = request.headers.get("x-suivi-code") || "";
  if (attendu.length < 8 || donne.length !== attendu.length) return false;
  let diff = 0;
  for (let i = 0; i < attendu.length; i++) diff |= attendu.charCodeAt(i) ^ donne.charCodeAt(i);
  return diff === 0;
}
