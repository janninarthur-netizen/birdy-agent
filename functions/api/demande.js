// Cloudflare Pages Function : reçoit une demande de séjour envoyée par le formulaire du site.
// Envoie une notification ntfy (variable NTFY_TOPIC) et, si NTFY_EMAIL est défini, un e-mail via ntfy.
// Réglages dans Cloudflare : Workers & Pages → birdy-agent → Settings → Variables and Secrets.

function propre(v, max) {
  return String(v == null ? "" : v).replace(/[\u0000-\u001f]+/g, " ").trim().slice(0, max);
}

export function normaliserTel(t) {
  let d = String(t || "").replace(/[^\d+]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  else if (d.startsWith("00")) d = d.slice(2);
  else if (/^0[1-9]\d{8}$/.test(d)) d = "33" + d.slice(1);
  return /^\d{10,15}$/.test(d) ? d : null;
}

function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8" } });
}

export async function onRequestPost({ request, env }) {
  let data = {};
  try {
    const type = request.headers.get("content-type") || "";
    if (type.includes("application/json")) data = await request.json();
    else data = Object.fromEntries(await request.formData());
  } catch { return json(400, { erreur: "Demande illisible" }); }

  if (data.site) return json(200, { ok: true }); // champ piège : robot

  const d = {
    groupe: propre(data.groupe, 40) || "Groupe à préciser",
    destination: propre(data.destination, 60) || "Destination à préciser",
    periode: propre(data.periode, 40) || "période à préciser",
    budget: propre(data.budget, 40) || "à définir",
    prenom: propre(data.prenom, 60),
    tel: propre(data.tel, 20),
    email: propre(data.email, 120),
    note: propre(data.note, 300),
  };
  const tel = normaliserTel(d.tel);
  if (!d.prenom || !tel) return json(400, { erreur: "Prénom et téléphone obligatoires" });
  if (data.accord !== "oui") return json(400, { erreur: "Accord manquant" });

  const texte = [
    d.groupe + " · " + d.destination,
    d.periode + " · budget " + d.budget + "/pers.",
    d.prenom + " · " + d.tel + (d.email ? " · " + d.email : ""),
    d.note ? "Note : " + d.note : "",
  ].filter(Boolean).join("\n");

  if (!env.NTFY_TOPIC) { console.error("NTFY_TOPIC manquant"); return json(500, { erreur: "Service indisponible" }); }
  const msg = {
    topic: env.NTFY_TOPIC,
    title: "Nouvelle demande Birdy : " + d.prenom,
    message: texte,
    tags: ["golf"],
    priority: 4,
    actions: [{ action: "view", label: "Appeler " + d.prenom, url: "tel:+" + tel }],
  };
  if (env.NTFY_EMAIL) msg.email = env.NTFY_EMAIL;
  const r = await fetch("https://ntfy.sh/", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(msg) });
  if (!r.ok) { console.error("ntfy " + r.status + " " + (await r.text()).slice(0, 200)); return json(502, { erreur: "Envoi impossible" }); }
  return json(200, { ok: true });
}
