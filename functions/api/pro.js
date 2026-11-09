// POST /api/pro : un enseignant de golf demande à rejoindre Birdy Agent.
// Enregistré dans le suivi (type « pro ») pour validation ; rien n'est publié automatiquement.
import { normaliserTel } from "./demande.js";
import { enregistrer } from "../../lib/demandes.js";

const propre = (v, max) => String(v == null ? "" : v).replace(/[\u0000-\u001f]+/g, " ").trim().slice(0, max);
const json = (status, body) => Response.json(body, { status });

export async function onRequestPost({ request, env }) {
  let data;
  try {
    const type = request.headers.get("content-type") || "";
    data = type.includes("application/json") ? await request.json() : Object.fromEntries(await request.formData());
  } catch { return json(400, { erreur: "Demande illisible" }); }
  if (data.site) return json(200, { ok: true });
  const d = {
    prenom: propre(data.prenom, 60), nom: propre(data.nom, 60), golf_attache: propre(data.golf_attache, 120),
    diplome: propre(data.diplome, 120), specialites: propre(data.specialites, 200), site_web: propre(data.site_web, 160),
    tel: propre(data.tel, 20), email: propre(data.email, 120), note: propre(data.note, 400),
  };
  const tel = normaliserTel(d.tel);
  if (!d.prenom || !d.nom || !tel || !d.golf_attache) return json(400, { erreur: "Prénom, nom, golf et téléphone obligatoires" });
  if (data.accord !== "oui") return json(400, { erreur: "Accord manquant" });
  const id = await enregistrer(env, { type: "pro", titre: d.prenom + " " + d.nom + " · " + d.golf_attache, ...d, tel_e164: tel });
  if (env.NTFY_TOPIC) {
    const actions = [{ action: "view", label: "Appeler " + d.prenom, url: "tel:+" + tel }];
    if (id) actions.push({ action: "view", label: "Suivi", url: new URL("/suivi/?id=" + id, request.url).href });
    await fetch("https://ntfy.sh/", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
      topic: env.NTFY_TOPIC, title: "Nouveau pro candidat : " + d.prenom + " " + d.nom,
      message: [d.golf_attache, d.diplome, d.specialites, d.tel + (d.email ? " · " + d.email : "")].filter(Boolean).join("\n"),
      tags: ["golf", "star"], priority: 3, actions }) }).catch(() => {});
  }
  return id || env.NTFY_TOPIC ? json(200, { ok: true }) : json(500, { erreur: "Service indisponible" });
}
