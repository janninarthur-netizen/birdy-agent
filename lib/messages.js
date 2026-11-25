// Messages prêts à envoyer pour chaque demande : au client (WhatsApp ou SMS), au golf, et une relance.
// Utilisés par la notification (bouton WhatsApp) et par la page privée /suivi/.
// Rien n'est envoyé automatiquement : le conseiller relit et appuie sur Envoyer.

export const TEL_AGENCE = "06 16 21 34 47";
const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

function quand(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || "")) return iso || "";
  const j = new Date(iso + "T12:00:00Z");
  return JOURS[j.getUTCDay()] + " " + j.getUTCDate() + " " + MOIS[j.getUTCMonth()];
}
const de = (x) => (/^[aeiouyhéèêâîô]/i.test(x) ? "d’" : "de ") + x;
const pluriel = (n, mot) => n + " " + mot + (n > 1 ? "s" : "");
const golfDe = (n) => (/golf/i.test(n) ? "au " + n.replace(/^Le /, "") : "au golf " + n);

// Phrase sur le prix, uniquement quand le golf publie ses tarifs (data/tarifs.json)
function phraseTarif(tf) {
  if (!tf) return "Je me renseigne sur le tarif du jour et je vous le confirme avant de réserver.";
  if (tf.p) return "Pour information, le tarif public affiché par le golf est de " + tf.p + " par joueur" + (tf.a ? " (" + tf.a.toLowerCase() + ")" : "") +
    " ; je vous confirme le prix exact pour votre date avant de réserver.";
  if (tf.t === "membres") return "C’est un club privé : je vérifie avec lui si un départ est possible pour vous, et à quel prix.";
  return "Le prix varie selon le jour et l’heure : je vous confirme le tarif exact avant de réserver.";
}

export function messages(d) {
  const p = d.prenom || "";
  const signe = "\nBirdy Agent · " + TEL_AGENCE;
  if (d.type === "depart" && d.golf) {
    const g = d.golf, cr = d.creneau && !/indiff/i.test(d.creneau) ? ", " + d.creneau.toLowerCase() : "";
    return {
      client: "Bonjour " + p + ", c’est Birdy Agent ! J’ai bien reçu votre demande de départ " + golfDe(g.n) + " (" + g.v + ") pour " + quand(d.date) + cr +
        ", " + pluriel(d.joueurs, "joueur") + ". " + phraseTarif(g.tf) + " Je contacte le golf et je reviens vers vous très vite avec l’horaire. Bonne journée !",
      golf: "Bonjour,\nJe souhaite réserver un départ 18 trous le " + quand(d.date) + (cr ? " (" + d.creneau.toLowerCase() + ")" : ", créneau indifférent") +
        " pour " + pluriel(d.joueurs, "joueur") + (d.niveau ? " (niveau : " + d.niveau + ")" : "") + ".\nPourriez-vous me proposer un horaire et me confirmer le tarif par joueur ?\n" +
        "Réservation au nom de : " + p + "." + (d.note ? "\nPrécision : " + d.note : "") + "\nMerci beaucoup," + signe,
      relance: "Bonjour " + p + ", c’est Birdy Agent. Je reviens vers vous au sujet de votre départ " + golfDe(g.n) + " le " + quand(d.date) +
        ". Souhaitez-vous toujours que je le réserve ? Je peux aussi vous proposer un autre golf ou un autre créneau.",
    };
  }
  if (d.type === "cours") {
    const ou = d.golf ? golfDe(d.golf.n) + " (" + d.golf.v + ")" : "vers " + d.lieu;
    return {
      client: "Bonjour " + p + ", c’est Birdy Agent ! Merci pour votre demande " + de((d.type_cours || "cours").toLowerCase()) + " " + ou + " (" + pluriel(d.eleves || 1, "élève") +
        ", niveau : " + (d.niveau || "à préciser") + "). Je cherche l’enseignant disponible" + (d.dispos ? " selon vos disponibilités (" + d.dispos + ")" : "") +
        " et je reviens vers vous pour confirmer l’horaire et le tarif. À très vite !",
      golf: "Bonjour,\nJe cherche un enseignant (" + (d.type_cours || "cours").toLowerCase() + ") : " + pluriel(d.eleves || 1, "élève") + ", niveau " + (d.niveau || "à préciser") +
        (d.objectif ? ", objectif : " + d.objectif : "") + ".\n" + (d.dispos ? "Disponibilités : " + d.dispos + ".\n" : "") +
        "Pourriez-vous me mettre en relation avec un pro du club et m’indiquer son tarif ?\nMerci beaucoup," + signe,
      relance: "Bonjour " + p + ", c’est Birdy Agent. Je reviens vers vous au sujet de votre demande de cours de golf. Êtes-vous toujours intéressé(e) ? Je peux vous proposer un créneau dès que vous me confirmez vos disponibilités.",
    };
  }
  if (d.type === "pro") {
    return {
      client: "Bonjour " + p + ", c’est Birdy Agent ! Merci pour votre candidature à Birdy Pro. Je regarde votre profil et je vous rappelle très vite pour en parler. Bonne journée !",
      relance: "Bonjour " + p + ", c’est Birdy Agent. Je reviens vers vous au sujet de votre candidature Birdy Pro : quand seriez-vous disponible pour un court appel ?",
    };
  }
  return {
    client: "Bonjour " + p + ", c’est Birdy Agent ! Merci pour votre demande de séjour golf" + (d.destination && !/préciser/.test(d.destination) ? " (" + d.destination + ")" : "") +
      (d.groupe && !/préciser/.test(d.groupe) ? " pour " + d.groupe.toLowerCase() : "") + (d.periode && !/préciser/.test(d.periode) ? ", " + d.periode : "") +
      ". Pour vous préparer une proposition sur mesure, pouvez-vous me dire combien de parcours vous aimeriez jouer, le niveau des joueurs et le type d’hébergement souhaité ? " +
      "Je vous envoie ensuite une proposition gratuite et sans engagement.",
    relance: "Bonjour " + p + ", c’est Birdy Agent. Je reviens vers vous au sujet de votre projet de séjour golf. Avez-vous pu avancer sur les dates ? Je peux vous envoyer une première proposition dès que vous le souhaitez.",
  };
}

// Lien WhatsApp avec le message déjà écrit
export const lienWhatsApp = (tel, texte) => "https://wa.me/" + tel + "?text=" + encodeURIComponent(texte);
