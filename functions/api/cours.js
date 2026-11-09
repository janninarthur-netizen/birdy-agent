// POST /api/cours : demande de cours de golf (pôle « Cours & Pros »).
// Notification ntfy + enregistrement dans le suivi. Ce n'est PAS une réservation :
// un conseiller trouve l'enseignant, puis confirme l'horaire et le tarif au client.
import { normaliserTel } from "./demande.js";
import { golfs } from "../../lib/golf-providers.js";
import { enregistrer } from "../../lib/demandes.js";

const propre = (v, max) => String(v == null ? "" : v).replace(/[\u0000-\u001f]+/g, " ").trim().slice(0, max);
const json = (status, body) => Response.json(body, { status });
const TYPES = ["Cours individuel", "Cours collectif", "Stage", "Parcours accompagné", "Analyse vidéo / Trackman", "Initiation"];

export async function onRequestPost({ request, env }) {
  let data;
  try {
    const type = request.headers.get("content-type") || "";
    data = type.includes("application/json") ? await request.json() : Object.fromEntries(await request.formData());
  } catch { return json(400, { erreur: "Demande illisible" }); }
  if (data.site) return json(200, { ok: true });

  let golf = null;
  if (data.golf) {
    try { golf = (await golfs(env, request)).find((g) => g.i === String(data.golf)); } catch { golf = null; }
  }
  const d = {
    lieu: propre(data.lieu, 80),
    type_cours: TYPES.includes(data.type_cours) ? data.type_cours : "Cours individuel",
    niveau: propre(data.niveau, 40) || "à préciser",
    eleves: Math.min(12, Math.max(1, parseInt(data.eleves, 10) || 1)),
    dispos: propre(data.dispos, 300),
    budget: propre(data.budget, 20), objectif: propre(data.objectif, 200),
    prenom: propre(data.prenom, 60), tel: propre(data.tel, 20), email: propre(data.email, 120), note: propre(data.note, 300),
  };
  if (!golf && !d.lieu) return json(400, { erreur: "Golf ou lieu manquant" });
  const tel = normaliserTel(d.tel);
  if (!d.prenom || !tel) return json(400, { erreur: "Prénom et téléphone obligatoires" });
  if (data.accord !== "oui") return json(400, { erreur: "Accord manquant" });

  const ou = golf ? golf.n + " · " + golf.v + " (" + golf.d + ")" : d.lieu;
  const id = await enregistrer(env, {
    type: "cours", titre: d.type_cours + " · " + ou,
    golf: golf ? { i: golf.i, n: golf.n, v: golf.v, d: golf.d, u: golf.u, s: golf.s } : null, ...d, tel_e164: tel,
  });
  const texte = [
    ou, d.type_cours + " · " + d.niveau + " · " + d.eleves + " élève" + (d.eleves > 1 ? "s" : ""),
    d.dispos ? "Disponibilités : " + d.dispos : "", [d.budget ? "budget " + d.budget : "", d.objectif].filter(Boolean).join(" · "),
    d.prenom + " · " + d.tel + (d.email ? " · " + d.email : ""), d.note ? "Note : " + d.note : "",
  ].filter(Boolean).join("\n");
  if (!env.NTFY_TOPIC) return id ? json(200, { ok: true }) : json(500, { erreur: "Service indisponible" });
  const actions = [{ action: "view", label: "Appeler " + d.prenom, url: "tel:+" + tel }];
  if (id) actions.push({ action: "view", label: "Suivi", url: new URL("/suivi/?id=" + id, request.url).href });
  const msg = { topic: env.NTFY_TOPIC, title: "Demande de cours : " + d.prenom, message: texte, tags: ["golf", "mortar_board"], priority: 4, actions };
  if (env.NTFY_EMAIL) msg.email = env.NTFY_EMAIL;
  const r = await fetch("https://ntfy.sh/", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(msg) });
  if (!r.ok && !id) return json(502, { erreur: "Envoi impossible" });
  return json(200, { ok: true });
}
