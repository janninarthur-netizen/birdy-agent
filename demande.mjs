// Reçoit une demande de séjour depuis le site et l'envoie à l'agence :
// - un SMS à chaque numéro de AGENCE_TEL (séparés par des virgules)
// - un e-mail à AGENCE_EMAIL (facultatif)
// - un SMS de confirmation au client (si CONFIRMATION_CLIENT=oui)
// Envoi par l'API Brevo (https://www.brevo.com). Les clés restent dans les réglages Netlify, jamais dans le code.

const BREVO = "https://api.brevo.com/v3";

export const config = { path: "/api/demande" };

function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8" } });
}

// 06 12 34 56 78, +33 6..., 0033 6... -> 33612345678
export function normaliserTel(t) {
  let d = String(t || "").replace(/[^\d+]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  else if (d.startsWith("00")) d = d.slice(2);
  else if (/^0[1-9]\d{8}$/.test(d)) d = "33" + d.slice(1);
  return /^\d{10,15}$/.test(d) ? d : null;
}

function propre(v, max) {
  return String(v == null ? "" : v).replace(/[\u0000-\u001f]+/g, " ").trim().slice(0, max);
}

export function texteSms(d) {
  return [
    "Nouvelle demande Birdy Agent",
    d.groupe + " · " + d.destination,
    d.periode + " · budget " + d.budget + "/pers.",
    d.prenom + " · " + d.telAffiche,
    d.note ? "Note : " + d.note : ""
  ].filter(Boolean).join("\n").slice(0, 600);
}

async function brevo(path, body, cle) {
  const r = await fetch(BREVO + path, {
    method: "POST",
    headers: { "api-key": cle, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error("Brevo " + path + " : " + r.status + " " + (await r.text()).slice(0, 300));
  return r.json().catch(() => ({}));
}

export default async (req) => {
  if (req.method !== "POST") return json(405, { erreur: "Méthode non autorisée" });
  let b;
  try { b = await req.json(); } catch { return json(400, { erreur: "Demande illisible" }); }

  // Champ piège invisible : rempli seulement par les robots.
  if (b.site) return json(200, { ok: true });

  const d = {
    groupe: propre(b.groupe, 40) || "Groupe à préciser",
    destination: propre(b.destination, 60) || "Destination à préciser",
    periode: propre(b.periode, 40) || "période à préciser",
    budget: propre(b.budget, 40) || "à définir",
    prenom: propre(b.prenom, 60),
    email: propre(b.email, 120),
    note: propre(b.note, 300)
  };
  const telClient = normaliserTel(b.tel);
  if (!d.prenom || !telClient) return json(400, { erreur: "Prénom et téléphone obligatoires" });
  d.telAffiche = propre(b.tel, 20);

  const cle = process.env.BREVO_API_KEY;
  const expediteur = (process.env.SMS_EXPEDITEUR || "BirdyAgent").slice(0, 11);
  const agences = String(process.env.AGENCE_TEL || "").split(",").map(normaliserTel).filter(Boolean);
  if (!cle || !agences.length) {
    console.error("Configuration manquante : BREVO_API_KEY ou AGENCE_TEL");
    return json(500, { erreur: "Service momentanément indisponible" });
  }

  const taches = agences.map((n) => brevo("/transactionalSMS/sms", { sender: expediteur, recipient: n, content: texteSms(d), type: "transactional" }, cle));

  if (process.env.AGENCE_EMAIL && process.env.EMAIL_EXPEDITEUR) {
    const lignes = [
      "Nouvelle demande de séjour golf reçue sur le site Birdy Agent.", "",
      "Groupe : " + d.groupe, "Destination : " + d.destination, "Période : " + d.periode, "Budget par personne : " + d.budget, "",
      "Prénom : " + d.prenom, "Téléphone : " + d.telAffiche, "E-mail : " + (d.email || "non indiqué"),
      "Note : " + (d.note || "aucune"), "", "Le client a accepté d’être recontacté au sujet de cette demande."
    ];
    const mail = {
      sender: { name: "Birdy Agent", email: process.env.EMAIL_EXPEDITEUR },
      to: process.env.AGENCE_EMAIL.split(",").map((e) => ({ email: e.trim() })),
      subject: "Demande Birdy : " + d.groupe + " · " + d.destination + " · " + d.prenom,
      textContent: lignes.join("\n")
    };
    if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) mail.replyTo = { email: d.email, name: d.prenom };
    taches.push(brevo("/smtp/email", mail, cle));
  }

  if ((process.env.CONFIRMATION_CLIENT || "").toLowerCase() === "oui") {
    taches.push(brevo("/transactionalSMS/sms", {
      sender: expediteur, recipient: telClient, type: "transactional",
      content: "Merci " + d.prenom + " ! Votre demande de séjour golf (" + d.destination + ") est bien reçue. Un conseiller Birdy Agent vous rappelle rapidement."
    }, cle));
  }

  const res = await Promise.allSettled(taches);
  res.filter((r) => r.status === "rejected").forEach((r) => console.error(r.reason && r.reason.message));
  // Réussi si au moins un SMS à l'agence est parti.
  const smsAgenceOk = res.slice(0, agences.length).some((r) => r.status === "fulfilled");
  return smsAgenceOk ? json(200, { ok: true }) : json(502, { erreur: "Envoi impossible pour le moment" });
};
