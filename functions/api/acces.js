// POST /api/acces : connexion au suivi sans le code (« code oublié »).
//  { "action": "oubli" }  -> envoie un lien de connexion à usage unique sur le téléphone du conseiller (ntfy), valable 15 min.
//  { "jeton": "…" }       -> échange ce lien contre une session de 30 jours (en-tête « x-suivi-session » ensuite).
// Le lien part uniquement vers NTFY_TOPIC, là où arrivent déjà toutes les demandes : même niveau de confiance.
import { jeton } from "../../lib/demandes.js";

const json = (status, body) => Response.json(body, { status, headers: { "cache-control": "no-store", "x-robots-tag": "noindex" } });

export async function onRequestPost({ request, env }) {
  if (!env.DEMANDES || !env.NTFY_TOPIC) return json(503, { erreur: "non_configure" });
  let b; try { b = await request.json(); } catch { return json(400, { erreur: "format" }); }

  if (b && b.action === "oubli") {
    // Un lien toutes les 2 minutes au plus (la réponse est la même dans tous les cas)
    if (await env.DEMANDES.get("acces:dernier")) return json(200, { ok: true });
    await env.DEMANDES.put("acces:dernier", "1", { expirationTtl: 120 });
    const j = jeton();
    await env.DEMANDES.put("jeton:" + j, "1", { expirationTtl: 900 });
    const lien = new URL("/suivi/#jeton=" + j, request.url).href;
    await fetch("https://ntfy.sh/", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
      topic: env.NTFY_TOPIC, title: "Connexion au suivi Birdy", priority: 4, tags: ["key"],
      message: "Appuyez sur « Me connecter » pour ouvrir le suivi des demandes sans code. Lien valable 15 minutes, une seule fois. " +
        "Si vous n’avez rien demandé, ignorez ce message.",
      actions: [{ action: "view", label: "Me connecter", url: lien }],
    }) });
    return json(200, { ok: true });
  }

  if (b && typeof b.jeton === "string" && /^[0-9a-f]{64}$/.test(b.jeton)) {
    const cle = "jeton:" + b.jeton;
    if (!(await env.DEMANDES.get(cle))) return json(401, { erreur: "lien_expire" });
    await env.DEMANDES.delete(cle);
    const s = jeton();
    await env.DEMANDES.put("session:" + s, "1", { expirationTtl: 30 * 864e2 });
    return json(200, { session: s });
  }
  return json(400, { erreur: "requete" });
}
