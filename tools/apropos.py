#!/usr/bin/env python3
"""Page « À propos » (/a-propos/) : qui est Birdy Agent, comment il travaille, d'où viennent les données.
Signal de confiance pour Google et les moteurs de réponse IA. Lancé par tools/guides.py."""
import json
import os
import sys
from datetime import date

sys.path.insert(0, os.path.dirname(__file__))
import pages  # noqa: E402

S, TEL, e = pages.SITE, pages.TEL, pages.e
G = json.load(open("data/golfs.json", encoding="utf8"))
n18 = sum(1 for g in G["golfs"] if g["t18"])
ND = len(json.load(open("data/destinations.json", encoding="utf8")))
maj = date.today().strftime("%d/%m/%Y")
FAQ = [
    ("Qu’est-ce que Birdy Agent ?",
     f"Birdy Agent (« Le golf sur mesure ») est un site français dédié au golf, avec un assistant IA, Birdy. Il permet d’organiser un séjour golf "
     f"de groupe dans {ND} destinations (Birdy Travel) et de demander un départ sur l’un des {len(G['golfs'])} golfs de France (Birdy Golf)."),
    ("Qui organise les séjours ?",
     "Les séjours sont préparés par un conseiller passionné de golf, en lien avec Parcours & Voyages (parcours-voyages.fr), agence de voyages golf familiale."),
    ("Combien coûte une demande ?",
     "Rien : les demandes de séjour et de départ sont gratuites et sans engagement. Birdy Agent ne publie pas de prix : le conseiller demande les vrais "
     "tarifs aux hôtels et aux golfs, puis envoie une proposition détaillée."),
    ("La réservation d’un parcours est-elle immédiate ?",
     "Pas encore. Vous envoyez une demande de départ ; un conseiller réserve auprès du golf et vous rappelle pour confirmer l’horaire et le tarif. "
     "Rien n’est réservé avant sa confirmation."),
    ("Birdy est-il une vraie intelligence artificielle ?",
     "Oui. Birdy comprend vos messages, conseille des destinations et des parcours, et prépare votre demande. Comme toute IA, il peut se tromper : "
     "un conseiller vérifie chaque proposition avant de vous l’envoyer."),
]
extra = pages.ld({"@context": "https://schema.org", "@type": "AboutPage", "name": "À propos de Birdy Agent", "url": S + "a-propos/",
                  "inLanguage": "fr-FR", "dateModified": date.today().isoformat(),
                  "mainEntity": {"@type": "TravelAgency", "@id": S + "#agence", "name": "Birdy Agent", "url": S, "telephone": "+33616213447",
                                 "slogan": "Le golf sur mesure", "logo": S + "logo.webp", "sameAs": ["https://www.parcours-voyages.fr/"]}})
extra += pages.ld({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
    {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": r}} for q, r in FAQ]})
extra += pages.ld({"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "Accueil", "item": S},
    {"@type": "ListItem", "position": 2, "name": "À propos", "item": S + "a-propos/"}]})
out = pages.head("À propos de Birdy Agent : le golf sur mesure", "Qui est Birdy Agent : séjours golf de groupe, parcours et cours de golf en France, "
                 "assistant IA Birdy, Parcours & Voyages, sources et contact.", "a-propos/", S + "og.jpg", extra)
out += f"""<main>
<section class="hero short"><div class="veil"></div><div class="in">
  <nav class="crumbs" aria-label="Fil d’Ariane"><a href="/">Accueil</a> › <span>À propos</span></nav>
  <h1>À propos de Birdy Agent</h1>
  <p class="lead">Le golf sur mesure : un assistant IA et un conseiller passionné, pour organiser vos séjours golf et vos parties en France.</p>
</div></section>
<section class="band"><div class="in grid">
  <div class="txt">
    <h2>Ce que nous faisons</h2>
    <p>Birdy Agent est un site français dédié au golf, construit autour de deux pôles :</p>
    <ul>
      <li><b><a href="/golf/">Birdy Travel</a></b> : des séjours golf de groupe sur mesure dans {ND} destinations, en France et à l’étranger : entre amis, enterrement de vie de garçon, séminaire d’entreprise, voyage de club.</li>
      <li><b><a href="/parcours/">Birdy Golf</a></b> : trouver un parcours parmi {len(G['golfs'])} golfs de France, dont {n18} avec un parcours 18 trous, et demander un départ.</li>
    </ul>
    <h3>Comment nous travaillons</h3>
    <ol>
      <li><b>Vous décrivez votre envie</b> à Birdy ou dans le formulaire : groupe, dates, budget, destination ou parcours.</li>
      <li><b>Un conseiller passionné de golf</b> demande les vrais tarifs aux hôtels et aux golfs.</li>
      <li><b>Vous recevez une proposition</b> détaillée, gratuite et sans engagement. Pour un départ, le conseiller réserve auprès du golf et vous confirme l’horaire et le prix.</li>
    </ol>
    <p>Birdy Agent ne publie pas de prix : chaque séjour et chaque départ fait l’objet d’une proposition personnalisée.</p>
    <h3>Notre lien avec Parcours &amp; Voyages</h3>
    <p>Birdy Agent est lié à <a href="https://www.parcours-voyages.fr/" target="_blank" rel="noopener">Parcours &amp; Voyages</a>, agence de voyages golf familiale. Les informations sur nos destinations s’appuient sur les séjours qu’elle propose.</p>
    <h3>Birdy, notre assistant IA</h3>
    <p>Birdy comprend vos messages, répond à vos questions sur le golf, conseille des destinations et des parcours, puis prépare votre demande. Comme toute intelligence artificielle, il peut se tromper : un conseiller vérifie chaque proposition.</p>
    <h3>Nos sources</h3>
    <ul>
      <li>Destinations : informations publiées par Parcours &amp; Voyages.</li>
      <li>Golfs de France : {e(G['source'])}, mise à jour le {e(G['maj'])}.</li>
      <li>Cartes : © les contributeurs d’OpenStreetMap.</li>
      <li>Photos : Pexels et Unsplash, selon leurs licences.</li>
    </ul>
  </div>
  <aside class="box">
    <h2>Nous contacter</h2>
    <p>Par téléphone ou sur WhatsApp, au même numéro.</p>
    <a class="btn gold" href="/voyages/#organiser">Organiser mon séjour</a>
    <p class="call">Ou appelez-nous<br><b>{TEL}</b></p>
  </aside>
</div></section>
<section class="band tint"><div class="in">
  <h2>Questions fréquentes</h2>
  <div class="faq">{"".join(f"<details><summary>{e(q)}</summary><p>{e(r)}</p></details>" for q, r in FAQ)}</div>
  <p class="gp-src" style="margin-top:14px;font-size:13px;color:#51675D">Page mise à jour le {maj}.</p>
</div></section>
</main>
"""
os.makedirs("a-propos", exist_ok=True)
open("a-propos/index.html", "w", encoding="utf8").write(out + pages.foot())
print("a-propos/index.html")
