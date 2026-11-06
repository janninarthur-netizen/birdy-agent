// POST /api/depart : demande de départ sur un parcours (pôle Birdy Golf).
// Notification ntfy sur le téléphone du conseiller (variable NTFY_TOPIC), comme /api/demande.
// Ce n'est PAS une réservation : le conseiller réserve auprès du golf puis rappelle le client.
import { normaliserTel } from "./demande.js";
import { golfs } from "../../lib/golf-providers.js";

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
    [d.budget ? "green fee max " + d.budget + (/€/.test(d.budget) ? "" : " €") : "", d.niveau].filter(Boolean).join(" · "),
    d.prenom + " · " + d.tel + (d.email ? " · " + d.email : ""),
    d.note ? "Note : " + d.note : "",
  ].filter(Boolean).join("\n");

  if (!env.NTFY_TOPIC) { console.error("NTFY_TOPIC manquant"); return json(500, { erreur: "Service indisponible" }); }
  const actions = [{ action: "view", label: "Appeler " + d.prenom, url: "tel:+" + tel }];
  if (golf.u) actions.push({ action: "view", label: "Site du golf", url: golf.u });
  const msg = { topic: env.NTFY_TOPIC, title: "Demande de départ : " + golf.n, message: texte, tags: ["golf", "calendar"], priority: 4, actions };
  if (env.NTFY_EMAIL) msg.email = env.NTFY_EMAIL;
  const r = await fetch("https://ntfy.sh/", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(msg) });
  if (!r.ok) { console.error("ntfy " + r.status); return json(502, { erreur: "Envoi impossible" }); }
  return json(200, { ok: true });
}
