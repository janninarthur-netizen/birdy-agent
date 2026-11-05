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
from urllib.parse import quote

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
    return f"https://images.pexels.com/photos/{pid}/pexels-photo-{pid}.jpeg?auto=compress&cs=tinysrgb&w={w}"


def carte(d, w=800):
    """Carte magazine 4:3 : photo, dégradé noir en bas, étiquette dorée de région au survol."""
    n = d["nom"]
    im = (f'<img src="{photo(d["photo"], w)}" alt="{e(n)}, {e(d["pays"])}" loading="lazy" onerror="this.remove()">'
          if d["photo"] else f'<span class="mc-fb">{e(RL[d["region"]])}</span>')
    return (f'<a class="mc" href="/golf/{slug(n)}.html">{im}<span class="mc-shade"></span>'
            f'<span class="mc-tag">{e(RL[d["region"]])}</span>'
            f'<span class="mc-body"><small>{e(d["pays"])}</small><b>{e(n)}</b>'
            f'<span class="mc-txt">{e(d["texte"])}</span>'
            f'<span class="mc-cta">Découvrir la destination <i aria-hidden="true">→</i></span></span></a>')


def head(title, desc, path, image, extra=""):
    url = SITE + path
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
<meta property="og:image" content="{image}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/logo.webp">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Cormorant+Garamond:wght@600;700&family=Instrument+Sans:wght@400;500;600&display=swap">
<link rel="stylesheet" href="/golf/style.css">
{extra}</head>
<body>
<header class="top"><div class="in">
  <a class="logo" href="/"><img src="/logo.webp" alt="Birdy Agent" width="48" height="48"><span>BIRDY AGENT</span></a>
  <nav><a href="/golf/">Destinations</a><a href="/guides/">Idées de séjours</a><a class="btn gold sm" href="/#organiser">Organiser mon séjour</a></nav>
</div></header>
"""


def foot():
    wa = WA + quote("Bonjour Birdy Agent, je souhaite organiser un séjour golf.")
    return f"""<a class="wa" href="{wa}" target="_blank" rel="noopener" aria-label="Nous écrire sur WhatsApp">WhatsApp</a>
<footer><div class="in">
  <div><strong>BIRDY AGENT</strong><span>Le golf sur mesure · séjours golf de groupe</span></div>
  <div class="links"><a href="/">Accueil</a><a href="/golf/">Toutes les destinations</a><a href="/guides/">Idées de séjours</a><a href="/mentions-legales.html">Mentions légales</a></div>
  <div class="tel">{TEL}</div>
</div></footer>
</body>
</html>
"""


def ld(obj):
    return '<script type="application/ld+json">' + json.dumps(obj, ensure_ascii=False) + "</script>\n"


def page_destination(d, voisines):
    n, s = d["nom"], slug(d["nom"])
    path = f"golf/{s}.html"
    title = f"Séjour golf en groupe · {n} ({d['pays']}) | Birdy Agent"
    desc = (f"Séjour golf de groupe sur mesure, destination {n} ({d['pays']}). {d['texte']} "
            "Demande gratuite et sans engagement, avec les vrais tarifs des hôtels et des golfs.")
    img = photo(d["photo"], 1200) if d["photo"] else SITE + "og.jpg"
    faq = [
        (f"Combien coûte un séjour golf en groupe, destination {n} ?",
         "Le prix dépend de la taille du groupe, des dates, de l’hôtel et du nombre de parcours. "
         "Nous demandons les vrais tarifs aux hôtels et aux golfs, puis nous vous envoyons une proposition détaillée, sans engagement."),
        ("Faut-il être un bon joueur pour partir ?",
         "Non. Débutants et joueurs confirmés peuvent partir ensemble : nous adaptons les parcours et pouvons prévoir des cours pour les débutants."),
        ("Comment faire une demande ?",
         f"Répondez à quatre questions sur notre site, ou écrivez-nous sur WhatsApp au {TEL}. "
         "Un conseiller vous recontacte avec une proposition."),
    ]
    extra = ld({"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Accueil", "item": SITE},
        {"@type": "ListItem", "position": 2, "name": "Destinations", "item": SITE + "golf/"},
        {"@type": "ListItem", "position": 3, "name": n, "item": SITE + path}]})
    extra += ld({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": r}} for q, r in faq]})
    extra += ld({"@context": "https://schema.org", "@type": "TouristDestination", "name": n,
                 "description": d["texte"], "geo": {"@type": "GeoCoordinates", "latitude": d["lat"], "longitude": d["lon"]},
                 "touristType": "Golfeurs", "url": SITE + path})
    organiser = "/?dest=" + quote(n) + "#organiser"
    wa = WA + quote(f"Bonjour Birdy Agent, je souhaite organiser un séjour golf en groupe ({n}).")
    hero_img = (f'<img class="ph" src="{photo(d["photo"], 1600)}" alt="{e(n)}, {e(d["pays"])}" onerror="this.remove()">'
                if d["photo"] else "")
    voisins = "".join(f'<a href="/golf/{slug(v["nom"])}.html">{e(v["nom"])}<small>{e(v["pays"])}</small></a>' for v in voisines)
    out = head(title, desc, path, img, extra)
    out += f"""<main>
<section class="hero">{hero_img}<div class="veil"></div><div class="in">
  <nav class="crumbs" aria-label="Fil d’Ariane"><a href="/">Accueil</a> › <a href="/golf/">Destinations</a> › <span>{e(n)}</span></nav>
  <p class="tag">{e(d['pays'])} · {e(RL[d['region']])}</p>
  <h1>Séjour golf en groupe · {e(n)}</h1>
  <p class="lead">{e(d['texte'])}</p>
  <div class="cta"><a class="btn gold" href="{organiser}">Organiser un séjour ici</a><a class="btn light" href="{wa}" target="_blank" rel="noopener">Écrire sur WhatsApp</a></div>
</div></section>

<section class="band"><div class="in grid">
  <div class="txt">
    <h2>Votre séjour golf, organisé pour vous</h2>
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
  </div>
  <aside class="box">
    <h2>Prêt à partir ?</h2>
    <p>Demande gratuite, sans engagement. Réponse d’un conseiller.</p>
    <a class="btn gold" href="{organiser}">Organiser mon séjour</a>
    <p class="call">Ou appelez-nous<br><b>{TEL}</b></p>
  </aside>
</div></section>

<section class="band tint"><div class="in">
  <h2>Questions fréquentes</h2>
  <div class="faq">{"".join(f"<details><summary>{e(q)}</summary><p>{e(r)}</p></details>" for q, r in faq)}</div>
</div></section>

<section class="band"><div class="in">
  <h2>Autres destinations · {e(RL[d['region']])}</h2>
  <div class="others">{voisins}</div>
  <p class="more"><a href="/golf/">Voir les {TOTAL} destinations</a></p>
</div></section>
</main>
"""
    return path, out + foot()


def page_index(D):
    path = "golf/index.html"
    title = f"Nos {len(D)} destinations de séjours golf en groupe | Birdy Agent"
    desc = (f"Séjours golf de groupe sur mesure dans {len(D)} destinations : Portugal, Espagne, Écosse, Maroc, île Maurice, "
            "Dubaï, Floride, Caraïbes et plus. Demande gratuite et sans engagement.")
    extra = ld({"@context": "https://schema.org", "@type": "ItemList", "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "url": SITE + "golf/" + slug(d["nom"]) + ".html", "name": d["nom"]}
        for i, d in enumerate(D)]})
    out = head(title, desc, "golf/", SITE + "og.jpg", extra)
    out += f"""<main>
<section class="hero short"><div class="veil"></div><div class="in">
  <nav class="crumbs" aria-label="Fil d’Ariane"><a href="/">Accueil</a> › <span>Destinations</span></nav>
  <h1>Nos {len(D)} destinations golf</h1>
  <p class="lead">Des séjours golf de groupe sur mesure, en France, en Europe et dans le monde entier.</p>
</div></section>
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
    for d in D:
        voisines = [v for v in D if v["region"] == d["region"] and v is not d]
        p, html_ = page_destination(d, voisines)
        open(p, "w", encoding="utf8").write(html_)
        paths.append(p)
    p, html_ = page_index(D)
    open(p, "w", encoding="utf8").write(html_)
    paths.append("mentions-legales.html")
    open("sitemap.xml", "w", encoding="utf8").write(sitemap(paths))
    print(len(D), "pages destinations, index et sitemap générés")
