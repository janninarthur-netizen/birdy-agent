// POST /api/depart : demande de départ sur un parcours (pôle Birdy Golf).
// Notification ntfy sur le téléphone du conseiller (variable NTFY_TOPIC), comme /api/demande.
// Ce n'est PAS une réservation : le conseiller réserve auprès du golf puis rappelle le client.
import { normaliserTel } from "./demande.js";
import { golfs } from "../../lib/golf-providers.js";
import { enregistrer } from "../../lib/demandes.js";
import { messages, lienWhatsApp } from "../../lib/messages.js";

const propre = (v, max) => String(v == null ? "" : v).replace(/[\u0000-\u001f]+/g, " ").trim().slice(0, max);
const json = (status, body) => Response.json(body, { status });
const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

export async function onRequestPost({ request, env }) {
  let data;
  try {
    const type = request.headers.get("content-type") || "";
    data = type.includes("application/json") ? await request.json() : Object.fromEntries(await request.formData());
  } catch { return json(400, { erreur: "Demande illisible" }); }
  if (data.site) return json(200, { ok: true }); // champ piège : robot

  let golf;
  try { golf = (await golfs(env, request)).find((g) => g.i === String(data.golf || "")); } catch { golf = null; }
  if (!golf) return json(400, { erreur: "Golf inconnu" });
  const date = propre(data.date, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return json(400, { erreur: "Date invalide" });
  const d = {
    creneau: propre(data.creneau, 20) || "créneau indifférent",
    joueurs: Math.min(8, Math.max(1, parseInt(data.joueurs, 10) || 1)),
    budget: propre(data.budget, 12), niveau: propre(data.niveau, 40),
    prenom: propre(data.prenom, 60), tel: propre(data.tel, 20), email: propre(data.email, 120), note: propre(data.note, 300),
  };
  const tel = normaliserTel(d.tel);
  if (!d.prenom || !tel) return json(400, { erreur: "Prénom et téléphone obligatoires" });
  if (data.accord !== "oui") return json(400, { erreur: "Accord manquant" });

  const j = new Date(date + "T12:00:00Z");
  const quand = JOURS[j.getUTCDay()] + " " + date.split("-").reverse().join("/");
  const texte = [
    golf.n + " · " + golf.v + " (" + golf.d + ")",
    quand + " · " + d.creneau + " · " + d.joueurs + " joueur" + (d.joueurs > 1 ? "s" : ""),
    golf.tf && golf.tf.p ? "Tarif public : " + golf.tf.p + (golf.tf.a ? " (" + golf.tf.a + ")" : "") : "Tarif : à demander au golf",
    [d.budget ? "budget max " + d.budget + (/€/.test(d.budget) ? "" : " €") : "", d.niveau].filter(Boolean).join(" · "),
    d.prenom + " · " + d.tel + (d.email ? " · " + d.email : ""),
    d.note ? "Note : " + d.note : "",
  ].filter(Boolean).join("\n");

  const id = await enregistrer(env, {
    type: "depart", titre: golf.n + " · " + quand, golf: { i: golf.i, n: golf.n, v: golf.v, d: golf.d, u: golf.u, s: golf.s, tf: golf.tf ? { p: golf.tf.p, a: golf.tf.a, t: golf.tf.t } : undefined },
    date, ...d, tel_e164: tel,
  });
  if (!env.NTFY_TOPIC) {
    console.error("NTFY_TOPIC manquant");
    return id ? json(200, { ok: true }) : json(500, { erreur: "Service indisponible" });
  }
  // Boutons de la notification : WhatsApp avec le message déjà écrit, appel, fiche de suivi
  const m = messages({ type: "depart", date, ...d, golf: { n: golf.n, v: golf.v, tf: golf.tf } });
  const actions = [{ action: "view", label: "WhatsApp " + d.prenom, url: lienWhatsApp(tel, m.client) },
    { action: "view", label: "Appeler", url: "tel:+" + tel }];
  if (id) actions.push({ action: "view", label: "Suivi", url: new URL("/suivi/?id=" + id, request.url).href });
  const msg = { topic: env.NTFY_TOPIC, title: "Demande de départ : " + golf.n, message: texte, tags: ["golf", "calendar"], priority: 4, actions };
  if (env.NTFY_EMAIL) msg.email = env.NTFY_EMAIL;
  const r = await fetch("https://ntfy.sh/", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(msg) });
  if (!r.ok) { console.error("ntfy " + r.status); if (!id) return json(502, { erreur: "Envoi impossible" }); }
  return json(200, { ok: true });
}
