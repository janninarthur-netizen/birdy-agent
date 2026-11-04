// Lancée automatiquement par Netlify à chaque demande reçue par le formulaire « demande ».
// Envoie une notification instantanée sur le téléphone via ntfy (gratuit) : variable NTFY_TOPIC.
// Plus tard, si BREVO_API_KEY et AGENCE_TEL sont définis, envoie aussi un SMS (payant).
// L'e-mail de chaque demande se règle dans Netlify : Forms → Form notifications.

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

export function lire(data) {
  return {
    groupe: propre(data.groupe, 40) || "Groupe à préciser",
    destination: propre(data.destination, 60) || "Destination à préciser",
    periode: propre(data.periode, 40) || "période à préciser",
    budget: propre(data.budget, 40) || "à définir",
    prenom: propre(data.prenom, 60) || "Client",
    tel: propre(data.tel, 20),
    email: propre(data.email, 120),
    note: propre(data.note, 300)
  };
}

export function texte(d) {
  return [
    d.groupe + " · " + d.destination,
    d.periode + " · budget " + d.budget + "/pers.",
    d.prenom + " · " + d.tel + (d.email ? " · " + d.email : ""),
    d.note ? "Note : " + d.note : ""
  ].filter(Boolean).join("\n");
}

export const handler = async (event) => {
  let data = {};
  try { data = JSON.parse(event.body).payload.data || {}; } catch { return { statusCode: 200, body: "ignoré" }; }
  const d = lire(data);
  const taches = [];

  const topic = process.env.NTFY_TOPIC;
  if (topic) {
    const tel = normaliserTel(d.tel);
    const msg = { topic, title: "Nouvelle demande Birdy : " + d.prenom, message: texte(d), tags: ["golf"], priority: 4 };
    if (tel) msg.actions = [{ action: "view", label: "Appeler " + d.prenom, url: "tel:+" + tel }];
    taches.push(fetch("https://ntfy.sh/", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(msg) })
      .then((r) => { if (!r.ok) throw new Error("ntfy " + r.status); }));
  }

  const cle = process.env.BREVO_API_KEY;
  const agences = String(process.env.AGENCE_TEL || "").split(",").map(normaliserTel).filter(Boolean);
  if (cle && agences.length) {
    for (const n of agences) {
      taches.push(fetch("https://api.brevo.com/v3/transactionalSMS/sms", {
        method: "POST",
        headers: { "api-key": cle, "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ sender: (process.env.SMS_EXPEDITEUR || "BirdyAgent").slice(0, 11), recipient: n, type: "transactional",
          content: ("Nouvelle demande Birdy Agent\n" + texte(d)).slice(0, 600) })
      }).then((r) => { if (!r.ok) throw new Error("Brevo " + r.status); }));
    }
  }

  const res = await Promise.allSettled(taches);
  res.filter((r) => r.status === "rejected").forEach((r) => console.error(r.reason && r.reason.message));
  return { statusCode: 200, body: "ok" };
};
