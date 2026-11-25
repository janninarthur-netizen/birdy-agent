// GET /api/rappel : récapitulatif du matin des demandes encore ouvertes, envoyé sur le téléphone du conseiller (ntfy).
// Appelé chaque matin par .github/workflows/rappel.yml. Une seule notification par jour (clé KV « rappel:AAAA-MM-JJ »),
// et la réponse ne contient aucune donnée personnelle : un appel extérieur ne peut ni lire les demandes ni spammer.
import { lister, lire, autorise } from "../../lib/demandes.js";

const json = (status, body) => Response.json(body, { status, headers: { "cache-control": "no-store", "x-robots-tag": "noindex" } });
const OUVERTS = ["nouveau", "a_rappeler", "en_cours"];
const LIB = { nouveau: "nouvelle", a_rappeler: "à rappeler", en_cours: "en cours" };

function jourParis(decalage = 0) {
  const d = new Date(Date.now() + decalage * 864e5);
  return new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(d); // AAAA-MM-JJ
}

export async function onRequestGet({ request, env }) {
  if (!env.DEMANDES || !env.NTFY_TOPIC) return json(503, { erreur: "non_configure" });
  const aujourdhui = jourParis(), demain = jourParis(1);
  // Test manuel : ?force=1 avec le code de suivi en en-tête
  const force = new URL(request.url).searchParams.get("force") === "1" && (await autorise(request, env));
  const cleJour = "rappel:" + aujourdhui;
  if (!force && (await env.DEMANDES.get(cleJour))) return json(200, { ok: true, deja: true });

  const toutes = await lister(env, 500);
  const ouvertes = toutes.filter((d) => OUVERTS.includes(d.statut));
  await env.DEMANDES.put(cleJour, "1", { expirationTtl: 3 * 864e2 });
  if (!ouvertes.length) return json(200, { ok: true, ouvertes: 0 });

  // Détail : ancienneté et départs imminents (lecture des fiches ouvertes uniquement)
  const fiches = (await Promise.all(ouvertes.slice(0, 40).map((d) => lire(env, d.id)))).filter(Boolean);
  const vieilles = fiches.filter((d) => d.statut === "nouveau" && Date.now() - Date.parse(d.cree) > 864e5);
  const urgents = fiches.filter((d) => d.type === "depart" && (d.date === aujourdhui || d.date === demain));
  const compte = OUVERTS.map((s) => [s, ouvertes.filter((d) => d.statut === s).length]).filter(([, n]) => n)
    .map(([s, n]) => n + " " + LIB[s] + (n > 1 && s === "nouveau" ? "s" : ""));

  const lignes = [compte.join(" · ")];
  if (urgents.length) lignes.push("⚠ Départ aujourd’hui ou demain : " + urgents.map((d) => d.prenom + " (" + d.golf.n + ", " + (d.date === aujourdhui ? "aujourd’hui" : "demain") + ")").join(", "));
  if (vieilles.length) lignes.push("En attente depuis plus de 24 h : " + vieilles.map((d) => d.prenom).join(", "));
  const plusAncienne = fiches.reduce((a, d) => (!a || d.cree < a.cree ? d : a), null);
  if (plusAncienne) lignes.push("La plus ancienne : " + plusAncienne.prenom + " · " + (plusAncienne.titre || plusAncienne.type));

  const msg = {
    topic: env.NTFY_TOPIC,
    title: "Bonjour ! " + ouvertes.length + " demande" + (ouvertes.length > 1 ? "s" : "") + " à traiter",
    message: lignes.join("\n"), tags: ["sunrise", "golf"], priority: urgents.length ? 4 : 3,
    actions: [{ action: "view", label: "Ouvrir le suivi", url: new URL("/suivi/", request.url).href }],
  };
  const r = await fetch("https://ntfy.sh/", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(msg) });
  return json(r.ok ? 200 : 502, { ok: r.ok, ouvertes: ouvertes.length });
}
