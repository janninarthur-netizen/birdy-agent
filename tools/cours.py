#!/usr/bin/env python3
"""Pôle 3 « Cours & Pros » : page /cours/ (trouver un cours ou un pro dans un golf de France).

    python3 tools/cours.py      (lancé aussi par tools/guides.py)

Aucune fiche de pro n'est inventée : seules les fiches de data/pros.json (pros partenaires validés) sont affichées.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import pages  # noqa: E402

S, TEL, e = pages.SITE, pages.TEL, pages.e
G = json.load(open("data/golfs.json", encoding="utf8"))
PROS = json.load(open("data/pros.json", encoding="utf8")).get("pros", [])
GOLF = {g["i"]: g for g in G["golfs"]}

TYPES = [
    ("Cours individuel", "🎯", "Un pro rien que pour vous, pour travailler votre swing, votre petit jeu ou votre putting."),
    ("Cours collectif", "👥", "À plusieurs, entre amis ou en famille : plus convivial et plus économique."),
    ("Stage", "📅", "Plusieurs jours d’entraînement pour franchir un cap, souvent pendant les vacances."),
    ("Parcours accompagné", "⛳", "Jouer avec un pro sur le parcours : stratégie, gestion de partie, choix des coups."),
    ("Analyse vidéo / Trackman", "📊", "Mesures et vidéo de votre swing pour comprendre et corriger précisément."),
    ("Initiation", "🌱", "Découvrir le golf de zéro, sans matériel ni expérience, en toute simplicité."),
]
NIVEAUX = ["Je n’ai jamais joué", "Débutant (carte verte en cours)", "Index 54 à 37", "Index 36 à 25", "Index 24 à 15", "Index 14 à 5", "Index inférieur à 5"]


def carte_pro(p):
    g = GOLF.get(p.get("golf"), {})
    lieu = f'{g.get("n", "")} · {g.get("v", "")}' if g else ""
    spe = "".join(f"<span>{e(x)}</span>" for x in p.get("specialites", [])[:4])
    photo = (f'<img src="{e(p["photo"])}" alt="{e(p["prenom"])} {e(p["nom"])}, enseignant de golf" loading="lazy">'
             if p.get("photo") else f'<span class="cp-ini">{e(p["prenom"][:1])}{e(p["nom"][:1])}</span>')
    return (f'<article class="cp-pro t3d" data-golf="{e(p.get("golf", ""))}"><div class="cp-pro-ph">{photo}</div>'
            f'<div class="cp-pro-c"><b>{e(p["prenom"])} {e(p["nom"])}</b><small>{e(lieu)}</small>'
            f'<p>{e(p.get("diplome", ""))}</p><div class="cp-spe">{spe}</div>'
            f'<div class="cp-pro-f"><span>{e(p.get("tarif", "Tarif sur demande"))}</span>'
            f'<button type="button" class="btn gold sm cp-dem" data-golf="{e(p.get("golf", ""))}" data-pro="{e(p["prenom"])} {e(p["nom"])}">Demander un cours</button></div></div></article>')


def page():
    n18 = sum(1 for g in G["golfs"] if g["t18"])
    path = "cours/"
    title = "Cours de golf et pros en France | Birdy Agent"
    desc = (f"Cours de golf individuels, stages, parcours accompagnés, analyse vidéo ou Trackman dans {len(G['golfs'])} golfs de France. "
            "Demande gratuite, un conseiller trouve le pro.")
    faq = [("Comment prendre un cours de golf avec Birdy Agent ?",
            "Choisissez un golf, votre niveau et le type de cours, indiquez vos disponibilités dans le calendrier, puis envoyez votre demande. "
            "Un conseiller trouve l’enseignant et vous rappelle pour confirmer l’horaire et le tarif."),
           ("Combien coûte un cours de golf ?",
            "Le tarif dépend du pro, du golf, de la durée et du type de cours (individuel, collectif, stage). Le conseiller vous confirme le prix exact "
            "avant toute réservation ; la demande est gratuite et sans engagement."),
           ("Peut-on prendre un cours sans jamais avoir joué ?",
            "Oui : choisissez « Initiation » ou « Je n’ai jamais joué ». Le matériel peut généralement être prêté sur place, le conseiller le vérifie pour vous."),
           ("Je suis enseignant de golf, comment rejoindre Birdy Agent ?",
            "Remplissez le formulaire « Vous êtes pro ? ». Après un échange avec notre équipe et votre accord, votre fiche apparaît sur cette page."),
           ("Les créneaux affichés sont-ils réservés ?",
            "Non : le calendrier sert à indiquer vos disponibilités. Le conseiller les transmet à l’enseignant puis vous confirme le créneau retenu.")]
    extra = '<link rel="stylesheet" href="/parcours/parcours.css">\n<link rel="stylesheet" href="/parcours/pro.css">\n<link rel="stylesheet" href="/cours/cours.css">\n'
    extra += pages.ld({"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Accueil", "item": S},
        {"@type": "ListItem", "position": 2, "name": "Cours & pros", "item": S + path}]})
    extra += pages.ld({"@context": "https://schema.org", "@type": "Service", "name": "Birdy Pro : cours de golf avec un enseignant en France",
                       "serviceType": "Cours de golf", "areaServed": "FR", "url": S + path,
                       "provider": {"@type": "TravelAgency", "@id": S + "#agence", "name": "Birdy Agent", "telephone": "+33616213447"},
                       "offers": {"@type": "Offer", "price": "0", "priceCurrency": "EUR", "description": "Demande de cours gratuite et sans engagement"}})
    extra += pages.ld({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": r}} for q, r in faq]})
    types = "".join(f'<button type="button" class="cp-type t3d" data-type="{e(t)}" aria-pressed="false"><i>{ic}</i><b>{e(t)}</b><span>{e(d)}</span></button>'
                    for t, ic, d in TYPES)
    niv = "".join(f"<option>{e(n)}</option>" for n in NIVEAUX)
    typ_opts = "".join(f"<option>{e(t)}</option>" for t, _, _ in TYPES)
    pros = ("".join(carte_pro(p) for p in PROS) if PROS else "")
    recrute = ('<article class="cp-pro cp-join t3d"><div class="cp-join-c"><i>★</i><b>Vous êtes enseignant de golf ?</b>'
               '<p>Rejoignez Birdy Agent : recevez des demandes d’élèves près de votre golf. Votre fiche (photo, diplômes, spécialités, tarif) '
               'est publiée après un échange avec notre équipe.</p><button type="button" class="btn gold sm" id="cp-join">Rejoindre Birdy Pro</button></div></article>')
    out = pages.head(title, desc, path, S + "og.jpg", extra)
    out += f"""<main class="gp cp">
<div class="in cp-grid">
  <aside class="cp-side">
    <div class="gp-chat cp-chat">
      <div class="gp-chat-h"><img src="/favicon-96.png" alt="" width="44" height="44"><div><b>Birdy</b><span><i class="gp-dot"></i>Votre conseiller cours · répond tout de suite</span></div></div>
      <div class="gp-log" id="cp-say" aria-live="polite"><div class="gm b">Bonjour ! Je vous aide à trouver le bon cours. Quel est votre niveau, et près de quelle ville souhaitez-vous apprendre ?</div></div>
      <div class="gp-sugg" id="cp-sugg"><button type="button">Je débute, près de Lyon</button><button type="button">Stage de 3 jours en avril</button><button type="button">Analyser mon swing à Paris</button></div>
      <form class="gp-ask" id="cp-ask" autocomplete="off"><label class="sr" for="cp-q">Votre message à Birdy</label>
        <input id="cp-q" maxlength="400" placeholder="Votre niveau, votre ville, vos envies…"><button class="btn gold" type="submit" aria-label="Envoyer">→</button></form>
    </div>
    <p class="cp-side-note">Demande gratuite · un conseiller trouve le pro et confirme l’horaire et le prix</p>
  </aside>

  <div class="cp-main">
    <nav class="crumbs cp-crumbs" aria-label="Fil d’Ariane"><a href="/">Accueil</a> › <span>Cours &amp; pros</span></nav>
    <p class="tag cp-tag">Birdy Pro · Cours de golf en France</p>
    <h1 class="cp-h1">Le bon pro, <em>pour chaque swing.</em></h1>
    <p class="cp-lead">Cours individuels, stages, parcours accompagnés ou analyse vidéo, dans {len(G['golfs'])} golfs de France.</p>

    <form class="cp-f" id="cp-f" autocomplete="off">
      <label class="cp-lieu">Où ?<input name="lieu" placeholder="Ville, département ou région" list="cp-villes"></label>
      <datalist id="cp-villes"></datalist>
      <label>Rayon<select name="rayon"><option value="15">15 km</option><option value="30" selected>30 km</option><option value="50">50 km</option></select></label>
      <label>Niveau<select name="niveau"><option value="">Tous niveaux</option>{niv}</select></label>
      <label>Élèves<select name="eleves"><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option><option>6</option></select></label>
      <button class="btn gold" type="submit">Trouver un cours</button>
      <input type="hidden" name="type">
    </form>

    <div class="cp-types" id="cp-types" role="group" aria-label="Type de cours">{types}</div>

    <section class="cp-res" aria-live="polite"><p class="cp-count" id="cp-count"></p><div class="cp-list" id="cp-list"></div>
      <button class="btn ghost cp-plus" id="cp-plus" type="button" hidden>Voir plus de golfs</button></section>

    <section class="cp-pros"><p class="gp-k">Pros partenaires</p><h2>Nos enseignants</h2>
      <div class="cp-pros-grid">{pros}{recrute}</div>
      {'' if PROS else '<p class="cp-soon">Les premières fiches de pros partenaires arrivent. En attendant, envoyez votre demande : un conseiller trouve l’enseignant du golf choisi.</p>'}
    </section>

    <ol class="cp-steps"><li><i>1</i><span><b>Choisissez</b> un golf, votre niveau et le type de cours</span></li><li><i>2</i><span><b>Indiquez</b> vos disponibilités dans le calendrier</span></li><li><i>3</i><span><b>Un conseiller</b> trouve le pro et confirme l’horaire et le prix</span></li></ol>
  </div>
</div>

<section class="band tint"><div class="in">
  <h2>Questions fréquentes</h2>
  <div class="faq">{"".join(f"<details><summary>{e(a)}</summary><p>{e(b)}</p></details>" for a, b in faq)}</div>
  <p class="more"><a href="/parcours/">Réserver un départ sur un parcours</a> · <a href="/golf/">Voyages golf de groupe</a></p>
</div></section>
</main>

<dialog class="gp-dlg cp-dlg" id="cp-dlg">
  <form method="dialog" class="gp-x"><button aria-label="Fermer">×</button></form>
  <p class="tag">Demande de cours</p>
  <h2 id="cd-nom">Votre cours de golf</h2><p class="gc-v" id="cd-lieu"></p>
  <form id="cp-dem" class="gp-dep">
    <input type="hidden" name="golf"><input type="hidden" name="lieu"><input type="hidden" name="dispos"><input type="hidden" name="note">
    <div class="gp-row"><label>Type de cours<select name="type_cours">{typ_opts}</select></label>
      <label>Niveau<select name="niveau">{niv}</select></label>
      <label>Élèves<select name="eleves"><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option><option>6</option></select></label></div>
    <div class="cp-cal"><p class="cp-cal-t">Vos disponibilités <small>(touchez plusieurs jours et moments)</small></p>
      <div class="cp-jours" id="cp-jours"></div>
      <div class="cp-moments" id="cp-moments"><button type="button" data-m="Matin">Matin</button><button type="button" data-m="Midi">Midi</button><button type="button" data-m="Après-midi">Après-midi</button><button type="button" data-m="Soir">Soir</button></div>
      <p class="cp-recap" id="cp-recap">Aucune disponibilité choisie.</p></div>
    <div class="gp-row"><label>Budget (facultatif)<input name="budget" maxlength="20" placeholder="ex. 60 € l’heure"></label>
      <label>Objectif (facultatif)<input name="objectif" maxlength="200" placeholder="ex. passer la carte verte, régularité au drive"></label></div>
    <div class="gp-row"><label>Prénom<input name="prenom" required maxlength="60" autocomplete="given-name"></label>
      <label>Téléphone<input name="tel" required maxlength="20" inputmode="tel" autocomplete="tel"></label></div>
    <label>E-mail (facultatif)<input name="email" type="email" maxlength="120" autocomplete="email"></label>
    <input class="hp" name="site" tabindex="-1" autocomplete="off" aria-hidden="true">
    <label class="gp-ok"><input type="checkbox" name="accord" value="oui" required> J’accepte d’être recontacté au sujet de ma demande (<a href="/mentions-legales">données personnelles</a>).</label>
    <button class="btn gold" type="submit">Envoyer ma demande de cours</button>
    <p class="gp-msg" id="cd-msg" aria-live="polite"></p>
  </form>
  <div class="gp-merci" id="cd-merci" hidden><h3>Demande envoyée</h3><p>Un conseiller contacte l’enseignant et vous rappelle pour confirmer le créneau et le tarif. Rien n’est réservé avant sa confirmation.</p></div>
</dialog>

<dialog class="gp-dlg cp-dlg" id="cp-prodlg">
  <form method="dialog" class="gp-x"><button aria-label="Fermer">×</button></form>
  <p class="tag">Birdy Pro</p><h2>Rejoindre Birdy Agent</h2>
  <p class="gc-v">Vous êtes enseignant de golf ? Laissez-nous vos coordonnées : nous vous rappelons pour créer votre fiche avec votre accord.</p>
  <form id="cp-proform" class="gp-dep">
    <div class="gp-row"><label>Prénom<input name="prenom" required maxlength="60"></label><label>Nom<input name="nom" required maxlength="60"></label></div>
    <label>Golf d’attache<input name="golf_attache" required maxlength="120" placeholder="ex. Golf de Pessac"></label>
    <div class="gp-row"><label>Diplôme<input name="diplome" maxlength="120" placeholder="ex. DEJEPS golf, PGA"></label><label>Spécialités<input name="specialites" maxlength="200" placeholder="ex. débutants, petit jeu, Trackman"></label></div>
    <div class="gp-row"><label>Téléphone<input name="tel" required maxlength="20" inputmode="tel"></label><label>E-mail<input name="email" type="email" maxlength="120"></label></div>
    <label>Site web ou réseaux (facultatif)<input name="site_web" maxlength="160"></label>
    <input class="hp" name="site" tabindex="-1" autocomplete="off" aria-hidden="true">
    <label class="gp-ok"><input type="checkbox" name="accord" value="oui" required> J’accepte d’être recontacté par Birdy Agent (<a href="/mentions-legales">données personnelles</a>).</label>
    <button class="btn gold" type="submit">Envoyer ma candidature</button>
    <p class="gp-msg" id="cpp-msg" aria-live="polite"></p>
  </form>
  <div class="gp-merci" id="cpp-merci" hidden><h3>Merci !</h3><p>Nous vous rappelons très vite pour faire connaissance et préparer votre fiche.</p></div>
</dialog>
<script defer src="/assets/parcours.js"></script>
<script defer src="/assets/cours.js"></script>
"""
    out = out.replace('<html lang="fr">', '<html lang="fr" class="pro">', 1)
    os.makedirs("cours", exist_ok=True)
    open("cours/index.html", "w", encoding="utf8").write(out + pages.foot())
    print("cours/index.html :", len(PROS), "pro(s) partenaire(s)")


if __name__ == "__main__":
    page()
