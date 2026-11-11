#!/usr/bin/env python3
"""Génère les pages destinations (golf/*.html), la page d'index des destinations et le sitemap.

Lancer depuis la racine du dépôt :  python3 tools/pages.py
Source des données : data/destinations.json
"""
import html
import json
import os
import re
import unicodedata
import sys
from urllib.parse import quote

sys.path.insert(0, os.path.dirname(__file__))
from seo_data import PREP, PAYS, PROFILS, TAGS, profils, pays_de  # noqa: E402

SITE = "https://birdy-agent.pages.dev/"
TEL = "06 16 21 34 47"
WA = "https://wa.me/33616213447?text="
REGIONS = [
    ("france", "France"), ("europe", "Europe"), ("afrique", "Afrique"), ("indien", "Océan Indien"),
    ("asie", "Moyen-Orient et Asie"), ("ameriques", "Amérique du Nord"), ("caraibes", "Caraïbes"), ("oceanie", "Océanie"),
]
RL = dict(REGIONS)
e = html.escape


def slug(t):
    t = unicodedata.normalize("NFD", t).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-")


def photo(pid, w):
    """Photo hébergée sur le site (assets/img/p), en 480, 960 ou 1600 px de large."""
    t = 480 if w <= 600 else 960 if w <= 1000 else 1600
    return f"/assets/img/p/{pid}-{t}.webp"


def photo_abs(pid, w=1200):
    return SITE.rstrip("/") + photo(pid, w)


def carte(d, w=800):
    """Carte magazine 4:3 : photo, dégradé noir en bas, étiquette dorée de région au survol."""
    n = d["nom"]
    im = (f'<img src="{photo(d["photo"], w)}" srcset="{photo(d["photo"], 480)} 480w, {photo(d["photo"], 960)} 960w" '
          f'sizes="(max-width: 640px) 92vw, 360px" alt="{e(n)}, {e(d["pays"])}" loading="lazy" decoding="async" onerror="this.remove()">'
          if d["photo"] else f'<span class="mc-fb">{e(RL[d["region"]])}</span>')
    return (f'<a class="mc" href="/golf/{slug(n)}.html">{im}<span class="mc-shade"></span>'
            f'<span class="mc-tag">{e(RL[d["region"]])}</span>'
            f'<span class="mc-body"><small>{e(d["pays"])}</small><b>{e(n)}</b>'
            f'<span class="mc-txt">{e(d["texte"])}</span>'
            f'<span class="mc-cta">Découvrir la destination <i aria-hidden="true">→</i></span></span></a>')


# Les 4 onglets du site : Débuter, Cours avec un Pro, Réserver un parcours, Voyages (apprendre, progresser, jouer, partir)
ONGLETS = [("/debuter/", "Débuter", ("debuter/",)),
           ("/cours/", "Cours avec un Pro", ("cours/",)),
           ("/parcours/", "Réserver un parcours", ("parcours/",)),
           ("/voyages/", "Voyages", ("voyages/", "golf/", "guides/"))]


def nav_onglets(path=""):
    actif = ' aria-current="page"'
    return "".join(f'<a href="{h}"{actif if path.startswith(pref) else ""}>{e(n)}</a>' for h, n, pref in ONGLETS)


def head(title, desc, path, image, extra=""):
    url = SITE + path
    # Page web datée (fraîcheur du contenu, signal utilisé par Google et les moteurs de réponse IA)
    from datetime import date as _d
    extra = ld({"@context": "https://schema.org", "@type": "WebPage", "name": title, "url": url.replace("index.html", ""), "inLanguage": "fr-FR",
                "dateModified": _d.today().isoformat(), "isPartOf": {"@type": "WebSite", "name": "Birdy Agent", "url": SITE},
                "publisher": {"@type": "TravelAgency", "@id": SITE + "#agence", "name": "Birdy Agent"}}) + extra
    onglets = nav_onglets(path)
    return f"""<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{url}">
<meta name="theme-color" content="#0E3A31">
<meta property="og:type" content="website">
<meta property="og:locale" content="fr_FR">
<meta property="og:site_name" content="Birdy Agent">
<meta property="og:url" content="{url}">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:image" content="{image if image.startswith('http') else SITE.rstrip('/') + image}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" type="image/png" sizes="96x96" href="/favicon-96.png">
<link rel="icon" type="image/png" sizes="192x192" href="/favicon-192.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Cormorant+Garamond:wght@600;700&family=Instrument+Sans:wght@400;500;600&display=swap">
<link rel="stylesheet" href="/golf/style.css">
<script defer src="/assets/menu.js"></script>
{extra}</head>
<body>
<header class="top"><div class="in">
  <a class="logo" href="/"><img src="/logo.webp" alt="Birdy Agent" width="48" height="48"><span>BIRDY AGENT</span></a>
  <nav>{onglets}<a class="btn gold sm" href="/voyages/#organiser">Organiser mon séjour</a></nav>
</div></header>
"""


def foot():
    wa = WA + quote("Bonjour Birdy Agent, je souhaite organiser un séjour golf.")
    return f"""<a class="wa" href="{wa}" target="_blank" rel="noopener" aria-label="Nous écrire sur WhatsApp">WhatsApp</a>
<footer><div class="in">
  <div><strong>BIRDY AGENT</strong><span>Le golf sur mesure · séjours golf de groupe</span></div>
  <div class="links"><a href="/">Accueil</a><a href="/debuter/">Débuter le golf</a><a href="/cours/">Cours avec un Pro</a><a href="/parcours/">Réserver un parcours en France</a><a href="/voyages/">Voyages golf</a><a href="/golf/">Toutes les destinations</a><a href="/guides/">Idées de séjours</a><a href="/a-propos/">À propos</a><a href="/mentions-legales.html">Mentions légales</a></div>
  <div class="tel">{TEL}</div>
</div></footer>
</body>
</html>
"""


def ld(obj):
    return '<script type="application/ld+json">' + json.dumps(obj, ensure_ascii=False) + "</script>\n"


def faq_destination(d):
    n, prep = d["nom"], PREP[d["nom"]]
    tags = profils(d)
    out = [(f"Combien coûte un séjour golf en groupe {prep} ?",
            "Le prix dépend de la taille du groupe, des dates, de l’hôtel et du nombre de parcours. "
            "Nous demandons les vrais tarifs aux hôtels et aux golfs, puis nous vous envoyons une proposition détaillée, sans engagement.")]
    extra = []
    if "court" in tags:
        extra.append((f"Peut-on partir {prep} le temps d’un week-end ?",
                      "Oui. C’est une destination proche, qui se prête bien à un séjour de trois ou quatre jours entre amis : "
                      "nous calons les départs sur les parcours pour profiter de chaque journée."))
    if "hiver" in tags:
        extra.append((f"Peut-on jouer au golf {prep} en hiver ?",
                      f"Oui, {n} fait partie des destinations que nous conseillons pour jouer au soleil pendant l’hiver en France. "
                      "Dites-nous vos dates : nous vérifions les disponibilités des hôtels et des golfs."))
    if "links" in tags:
        extra.append(("Qu’est-ce qu’un links ?",
                      "Un parcours tracé en bord de mer, sur des dunes, exposé au vent. C’est le golf des origines, "
                      "un rêve pour beaucoup de clubs et de groupes de joueurs."))
    if "fete" in tags:
        extra.append((f"Peut-on organiser un enterrement de vie de garçon golf {prep} ?",
                      "Oui : une compétition amicale par équipes, une initiation pour ceux qui ne jouent pas, "
                      "un grand dîner et du temps libre. Nous organisons le programme avec l’organisateur seulement."))
    if "pro" in tags:
        extra.append((f"Organisez-vous des séminaires d’entreprise {prep} ?",
                      "Oui. Nous cherchons un hôtel adapté à la taille du groupe et à vos temps de travail, "
                      "avec une initiation pour les débutants, une compétition par équipes et les dîners."))
    if "exotique" in tags or d["region"] in ("oceanie", "asie", "ameriques", "caraibes", "indien"):
        extra.append(("Combien de temps faut-il prévoir ?",
                      "Pour une destination lointaine, comptez plutôt une semaine ou plus pour profiter du voyage. "
                      "Nous adaptons le nombre de parcours et les journées de repos à votre groupe."))
    out += extra[:2]
    out += [("Faut-il être un bon joueur pour partir ?",
             "Non. Débutants et joueurs confirmés peuvent partir ensemble : nous adaptons les parcours et pouvons prévoir des cours pour les débutants."),
            ("Comment faire une demande ?",
             f"Répondez à quatre questions sur notre site, ou écrivez-nous sur WhatsApp au {TEL}. "
             "Un conseiller vous recontacte avec une proposition.")]
    return out


def chips(d):
    out = []
    for k in profils(d):
        label, guide = PROFILS[k]
        out.append(f'<a class="chip" href="/guides/{guide}.html">{e(label)}</a>' if guide else f'<span class="chip">{e(label)}</span>')
    return "".join(out)


def page_destination(d, voisines):
    n, s = d["nom"], slug(d["nom"])
    prep = PREP[n]
    path = f"golf/{s}.html"
    title = f"Séjour golf {prep} en groupe | Birdy Agent"
    if len(title) > 62:
        title = f"Séjour golf {prep} | Birdy Agent"
    desc = (f"Séjour golf de groupe sur mesure {prep} ({d['pays']}). {d['texte']} "
            "Demande gratuite et sans engagement, avec les vrais tarifs des hôtels et des golfs.")
    if len(desc) > 160:
        desc = f"Séjour golf de groupe sur mesure {prep} ({d['pays']}). {d['texte']} Demande gratuite, vrais tarifs."
    if len(desc) > 160:
        desc = desc[:157].rsplit(" ", 1)[0] + "…"
    img = photo_abs(d["photo"]) if d["photo"] else SITE + "og.jpg"
    faq = faq_destination(d)
    hub = pays_de(n)
    crumbs = [("Accueil", SITE), ("Voyages", SITE + "voyages/"), ("Destinations", SITE + "golf/")]
    if hub:
        crumbs.append((hub[1], SITE + f"golf/pays/{hub[0]}.html"))
    crumbs.append((n, SITE + path))
    extra = ld({"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "name": c, "item": u} for i, (c, u) in enumerate(crumbs)]})
    extra += ld({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": r}} for q, r in faq]})
    td = {"@context": "https://schema.org", "@type": "TouristDestination", "name": n,
          "description": d["texte"], "geo": {"@type": "GeoCoordinates", "latitude": d["lat"], "longitude": d["lon"]},
          "touristType": "Golfeurs", "url": SITE + path}
    if d["photo"]:
        td["image"] = img
    extra += ld(td)
    organiser = "/voyages/?dest=" + quote(n) + "#organiser"
    wa = WA + quote(f"Bonjour Birdy Agent, je souhaite organiser un séjour golf en groupe ({n}).")
    hero_img = (f'<img class="ph" src="{photo(d["photo"], 1600)}" srcset="{photo(d["photo"], 480)} 480w, {photo(d["photo"], 960)} 960w, {photo(d["photo"], 1600)} 1600w" '
                f'sizes="100vw" alt="Golf {e(prep)}, {e(d["pays"])}" fetchpriority="high" onerror="this.remove()">'
                if d["photo"] else "")
    voisins = "".join(f'<a href="/golf/{slug(v["nom"])}.html">{e(v["nom"])}<small>{e(v["pays"])}</small></a>' for v in voisines)
    fil = '<a href="/">Accueil</a> › <a href="/voyages/">Voyages</a> › <a href="/golf/">Destinations</a> › '
    if hub:
        fil += f'<a href="/golf/pays/{hub[0]}.html">{e(hub[1])}</a> › '
    noms = [PROFILS[k][0].lower() for k in profils(d)]
    ideal = (" Idéal pour : " + ", ".join(noms[:3]) + ".") if noms else ""
    hub_line = (f'<p class="more"><a href="/golf/pays/{hub[0]}.html">Toutes nos destinations golf {e(hub[2])}</a></p>' if hub else "")
    out = head(title, desc, path, img, extra)
    out += f"""<main>
<section class="hero">{hero_img}<div class="veil"></div><div class="in">
  <nav class="crumbs" aria-label="Fil d’Ariane">{fil}<span>{e(n)}</span></nav>
  <p class="tag">{e(d['pays'])} · {e(RL[d['region']])}</p>
  <h1>Séjour golf {e(prep)}</h1>
  <p class="lead">{e(d['texte'])}</p>
  <div class="cta"><a class="btn gold" href="{organiser}">Organiser un séjour ici</a><a class="btn light" href="{wa}" target="_blank" rel="noopener">Écrire sur WhatsApp</a></div>
</div></section>

<section class="band"><div class="in grid">
  <div class="txt">
    <p class="answer"><b>Birdy Agent organise votre séjour golf de groupe {e(prep)}</b> ({e(d['pays'])}) : hébergement, green-fees, transferts et dîners, avec une proposition sur mesure aux vrais tarifs des hôtels et des golfs.{e(ideal)}</p>
    <div class="chips" aria-label="Idéal pour">{chips(d)}</div>
    <h2>Votre séjour golf {e(prep)}, organisé pour vous</h2>
    <p>Vous partez entre amis, en équipe ou avec votre club ? Dites-nous combien vous êtes, quand vous souhaitez partir et votre budget. Nous préparons une proposition sur mesure pour {e(n)}, avec les vrais tarifs des hôtels et des golfs.</p>
    <h3>Ce que nous organisons</h3>
    <ul>
      <li>L’hébergement, de l’hôtel au resort sur le golf, et la répartition des chambres.</li>
      <li>Les green-fees et le choix des parcours selon le niveau du groupe.</li>
      <li>Des cours pour les débutants, si vous le souhaitez.</li>
      <li>Les transferts entre l’aéroport, l’hôtel et les golfs.</li>
      <li>Les dîners de groupe et les moments à partager.</li>
    </ul>
    <h3>Comment ça marche</h3>
    <ol>
      <li><b>Vous nous dites votre envie</b> en quatre clics : groupe, période, budget.</li>
      <li><b>Nous préparons tout</b> et demandons les tarifs aux hôtels et aux golfs.</li>
      <li><b>Vous recevez votre proposition</b> : un conseiller vous recontacte, sans engagement.</li>
    </ol>
    <p class="more"><a href="{e(d['lien'])}" target="_blank" rel="noopener">Voir les séjours {e(n)} chez Parcours &amp; Voyages</a></p>
    {hub_line}
  </div>
  <aside class="box">
    <h2>Prêt à partir ?</h2>
    <p>Demande gratuite, sans engagement. Réponse d’un conseiller.</p>
    <a class="btn gold" href="{organiser}">Organiser mon séjour</a>
    <p class="call">Ou appelez-nous<br><b>{TEL}</b></p>
  </aside>
</div></section>

<section class="band tint"><div class="in">
  <h2>Questions fréquentes · séjour golf {e(prep)}</h2>
  <div class="faq">{"".join(f"<details><summary>{e(q)}</summary><p>{e(r)}</p></details>" for q, r in faq)}</div>
</div></section>

<section class="band"><div class="in">
  <h2>Autres destinations à découvrir</h2>
  <div class="others">{voisins}</div>
  <p class="more"><a href="/golf/">Voir les {TOTAL} destinations</a></p>
</div></section>
</main>
"""
    return path, out + foot()


def page_pays(p, D):
    s, titre, prep, noms, intro = p
    path = f"golf/pays/{s}.html"
    items = [d for d in D if d["nom"] in noms]
    title = f"Séjour golf {prep} en groupe : {len(items)} destinations | Birdy Agent"
    if len(title) > 65:
        title = f"Séjour golf {prep} en groupe : {len(items)} destinations"
    desc = (f"Séjours golf de groupe sur mesure {prep} : {', '.join(noms)}. {intro.split('. ')[0].rstrip('.')}. "
            "Demande gratuite et sans engagement.")
    if len(desc) > 160:
        desc = desc[:157].rsplit(" ", 1)[0] + "…"
    first = next((d for d in items if d["photo"]), None)
    img = photo_abs(first["photo"]) if first else SITE + "og.jpg"
    guides = {}
    for d in items:
        for k in profils(d):
            lab, g = PROFILS[k]
            if g:
                guides[g] = lab
    faq = [(f"Où jouer au golf {prep} ?",
            f"Nous proposons {len(items)} destinations golf {prep} : {', '.join(noms)}. {intro}"),
           (f"Combien coûte un séjour golf {prep} ?",
            "Le prix dépend de la taille du groupe, des dates, de l’hôtel et du nombre de parcours. "
            "Nous demandons les vrais tarifs aux hôtels et aux golfs, puis nous vous envoyons une proposition détaillée, sans engagement."),
           ("Comment faire une demande ?",
            f"Répondez à quatre questions sur notre site, ou écrivez-nous sur WhatsApp au {TEL}. Un conseiller vous recontacte avec une proposition.")]
    extra = ld({"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Accueil", "item": SITE},
        {"@type": "ListItem", "position": 2, "name": "Voyages", "item": SITE + "voyages/"},
        {"@type": "ListItem", "position": 3, "name": "Destinations", "item": SITE + "golf/"},
        {"@type": "ListItem", "position": 4, "name": titre, "item": SITE + path}]})
    extra += ld({"@context": "https://schema.org", "@type": "ItemList", "name": f"Destinations golf {prep}", "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "url": SITE + "golf/" + slug(d["nom"]) + ".html", "name": d["nom"]}
        for i, d in enumerate(items)]})
    extra += ld({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": r}} for q, r in faq]})
    hero_img = (f'<img class="ph" src="{photo(first["photo"], 1600)}" srcset="{photo(first["photo"], 960)} 960w, {photo(first["photo"], 1600)} 1600w" '
                f'sizes="100vw" alt="Golf {e(prep)}" fetchpriority="high" onerror="this.remove()">' if first else "")
    cards = "".join(carte(d) for d in items)
    gl = "".join(f'<a href="/guides/{g}.html">{e(l)}</a>' for g, l in guides.items())
    autres = "".join(f'<a href="/golf/pays/{o[0]}.html">Golf {e(o[2])}</a>' for o in PAYS if o[0] != s)
    organiser = "/voyages/?dest=" + quote(noms[0]) + "#organiser"
    out = head(title, desc, path, img, extra)
    out += f"""<main>
<section class="hero">{hero_img}<div class="veil"></div><div class="in">
  <nav class="crumbs" aria-label="Fil d’Ariane"><a href="/">Accueil</a> › <a href="/voyages/">Voyages</a> › <a href="/golf/">Destinations</a> › <span>{e(titre)}</span></nav>
  <p class="tag">{len(items)} destinations golf</p>
  <h1>Séjour golf {e(prep)}</h1>
  <p class="lead">{e(intro)}</p>
  <div class="cta"><a class="btn gold" href="{organiser}">Organiser mon séjour</a></div>
</div></section>
<section class="band ivory"><div class="in">
  <p class="mc-eyebrow">{e(titre)}</p><h2>Nos destinations golf {e(prep)}</h2>
  <div class="mc-grid">{cards}</div>
</div></section>
<section class="band tint"><div class="in">
  <h2>Questions fréquentes · golf {e(prep)}</h2>
  <div class="faq">{"".join(f"<details><summary>{e(q)}</summary><p>{e(r)}</p></details>" for q, r in faq)}</div>
</div></section>
<section class="band"><div class="in">
  {"<h2>Idées de séjours</h2><div class='others plain'>" + gl + "</div>" if gl else ""}
  <h2 class="mt">Le golf dans d’autres pays</h2>
  <div class="others plain">{autres}</div>
</div></section>
</main>
"""
    return path, out + foot()


def page_index(D):
    path = "golf/index.html"
    title = f"Nos {len(D)} destinations de séjours golf en groupe | Birdy Agent"
    desc = (f"Séjours golf de groupe sur mesure dans {len(D)} destinations : Portugal, Espagne, Écosse, Maroc, île Maurice, "
            "Dubaï, Floride… Demande gratuite.")
    extra = ld({"@context": "https://schema.org", "@type": "ItemList", "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "url": SITE + "golf/" + slug(d["nom"]) + ".html", "name": d["nom"]}
        for i, d in enumerate(D)]})
    out = head(title, desc, "golf/", SITE + "og.jpg", extra)
    out += f"""<main>
<section class="hero short"><div class="veil"></div><div class="in">
  <nav class="crumbs" aria-label="Fil d’Ariane"><a href="/">Accueil</a> › <a href="/voyages/">Voyages</a> › <span>Destinations</span></nav>
  <h1>Nos {len(D)} destinations golf</h1>
  <p class="lead">Des séjours golf de groupe sur mesure, en France, en Europe et dans le monde entier.</p>
</div></section>
<section class="band"><div class="in"><h2>Par pays</h2><div class="others plain">{"".join(f'<a href="/golf/pays/{p[0]}.html">Golf {e(p[2])}</a>' for p in PAYS)}</div></div></section>
"""
    for k, label in REGIONS:
        items = [d for d in D if d["region"] == k]
        cards = "".join(carte(d) for d in items)
        alt = " ivory" if REGIONS.index((k, label)) % 2 == 0 else ""
        out += f'<section class="band{alt}" id="{k}"><div class="in"><p class="mc-eyebrow">{len(items)} destination{"s" if len(items) > 1 else ""}</p><h2>{e(label)}</h2><div class="mc-grid">{cards}</div></div></section>\n'
    return path, out + "</main>\n" + foot()


def sitemap(paths):
    urls = "".join(f"  <url><loc>{SITE}{p.replace('index.html', '')}</loc></url>\n" for p in paths)
    return f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}</urlset>\n'


if __name__ == "__main__":
    D = json.load(open("data/destinations.json", encoding="utf8"))
    TOTAL = len(D)
    os.makedirs("golf", exist_ok=True)
    paths = ["", "golf/index.html"]
    os.makedirs("golf/pays", exist_ok=True)
    for pp in PAYS:
        p, html_ = page_pays(pp, D)
        open(p, "w", encoding="utf8").write(html_)
        paths.append(p)
    for d in D:
        hub = pays_de(d["nom"])
        meme = [v for v in D if v is not d and hub and pays_de(v["nom"]) == hub]
        region = [v for v in D if v is not d and v["region"] == d["region"] and v not in meme]
        voisines = (meme + region)[:8]
        p, html_ = page_destination(d, voisines)
        open(p, "w", encoding="utf8").write(html_)
        paths.append(p)
    p, html_ = page_index(D)
    open(p, "w", encoding="utf8").write(html_)
    paths.append("mentions-legales.html")
    open("sitemap.xml", "w", encoding="utf8").write(sitemap(paths))
    print(len(D), "pages destinations, index et sitemap générés")
