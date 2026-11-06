// Branchement des partenaires de réservation de départs (Birdy Golf).
//
// Aujourd'hui aucun partenaire n'est connecté : le site envoie une DEMANDE de départ,
// qu'un conseiller confirme par téléphone. Rien n'est présenté comme réservé.
//
// Pour brancher un partenaire (logiciel de réservation d'un golf, plateforme de départs…) :
//  1. ajouter un objet dans PARTENAIRES, avec :
//       nom                       nom affiché
//       couvre(golf, env)         true si ce partenaire gère ce golf (identifiant de golf, clé API présente…)
//       creneaux(golf, date, joueurs, env)  -> [{ heure: "08:30", prix: "65 €", id: "…" }]   (temps réel)
//       reserver(golf, creneau, client, env) -> { ok: true, reference: "…" }              (réservation ferme)
//  2. mettre sa clé dans les secrets Cloudflare (jamais dans le code).
// L'interface affiche alors les créneaux réels à la place de la simple demande.

export const PARTENAIRES = [];

export function partenaire(golf, env) {
  return PARTENAIRES.find((p) => { try { return p.couvre(golf, env); } catch { return false; } }) || null;
}

export async function disponibilites(golf, date, joueurs, env) {
  const p = partenaire(golf, env);
  if (!p || !date) return { temps_reel: false, mode: "demande", creneaux: [] };
  try {
    const creneaux = await p.creneaux(golf, date, joueurs, env);
    return { temps_reel: true, mode: "reservation", partenaire: p.nom, creneaux: creneaux || [] };
  } catch (e) {
    console.log("Partenaire " + p.nom, String(e).slice(0, 200));
    return { temps_reel: false, mode: "demande", creneaux: [] };
  }
}

// Annuaire des golfs (fichier statique du site), lu par les fonctions serveur
export async function golfs(env, request) {
  const r = await env.ASSETS.fetch(new URL("/data/golfs.json", request.url));
  if (!r.ok) throw new Error("annuaire " + r.status);
  return (await r.json()).golfs;
}
