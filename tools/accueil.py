#!/usr/bin/env python3
"""Page d'accueil du site (index.html) : à quoi sert Birdy Agent.

Page générale qui réunit tout : l'assistant IA Birdy au centre (logo en grand, grand titre,
grand chat), puis les pôles (Birdy l'assistant, Voyages, Réserver un parcours, Cours avec un Pro),
pour qui, et comment ça marche. Comportement : assets/accueil.js. Styles : assets/accueil.css.
L'ancienne page d'accueil (séjours golf de groupe) est l'onglet Voyages : voyages/index.html.
Lancé par tools/guides.py.
"""
import json

import pages

S = pages.SITE
TITLE = "Birdy Agent · Le golf sur mesure"
DESC = ("Birdy Agent, le golf sur mesure : voyages golf en groupe dans 55 destinations, "
        "réservation de parcours et cours avec un pro dans 621 golfs de France.")

# Données Google : le site et l'agence (reprises de l'ancienne page d'accueil)
AGENCE = {'@context': 'https://schema.org',
 '@type': 'TravelAgency',
 'name': 'Birdy Agent',
 'slogan': 'Le golf sur mesure',
 'url': 'https://birdy-agent.pages.dev/',
 'logo': 'https://birdy-agent.pages.dev/logo.webp',
 'image': 'https://birdy-agent.pages.dev/og.jpg',
 'telephone': '+33616213447',
 'description': 'Le golf sur mesure : séjours golf de groupe dans 55 destinations, réservation de parcours et cours avec un pro en France.',
 'areaServed': 'FR',
 'knowsAbout': ['Séjours golf', 'Voyages de groupe', 'Séminaires golf', 'Enterrement de vie de garçon golf', 'Voyages de club de golf'],
 '@id': 'https://birdy-agent.pages.dev/#agence',
 'priceRange': 'Sur devis',
 'contactPoint': {'@type': 'ContactPoint', 'telephone': '+33616213447', 'contactType': 'customer service', 'availableLanguage': 'French'},
 'sameAs': ['https://www.parcours-voyages.fr/'],
 'alternateName': ['Birdy-Agent', 'BirdyAgent', 'Birdy Agent golf', 'Birdy Agent – Le golf sur mesure'],
 'hasOfferCatalog': {'@type': 'OfferCatalog',
                     'name': 'Services Birdy Agent',
                     'itemListElement': [{'@type': 'Offer',
                                          'itemOffered': {'@type': 'Service',
                                                          'name': 'Birdy Travel : séjours golf de groupe sur mesure',
                                                          'url': 'https://birdy-agent.pages.dev/voyages/'},
                                          'price': '0',
                                          'priceCurrency': 'EUR',
                                          'description': 'Demande de séjour gratuite, proposition aux vrais tarifs'},
                                         {'@type': 'Offer',
                                          'itemOffered': {'@type': 'Service',
                                                          'name': 'Birdy Golf : demande de départ sur un parcours en France',
                                                          'url': 'https://birdy-agent.pages.dev/parcours/'},
                                          'price': '0',
                                          'priceCurrency': 'EUR',
                                          'description': 'Demande de départ gratuite, confirmée par un conseiller'},
                                         {'@type': 'Offer',
                                          'itemOffered': {'@type': 'Service',
                                                          'name': 'Birdy Pro : cours de golf avec un pro en France',
                                                          'url': 'https://birdy-agent.pages.dev/cours/'},
                                          'price': '0',
                                          'priceCurrency': 'EUR',
                                          'description': 'Demande de cours gratuite, confirmée par un conseiller'}]}}
SITE_WEB = {"@context": "https://schema.org", "@type": "WebSite", "name": "Birdy Agent",
            "alternateName": ["Birdy-Agent", "BirdyAgent", "Birdy Agent golf", "Birdy Agent – Le golf sur mesure"],
            "url": S, "inLanguage": "fr-FR", "publisher": {"@type": "TravelAgency", "@id": S + "#agence", "name": "Birdy Agent", "url": S}}

G = json.load(open("data/golfs.json", encoding="utf8"))["golfs"]
NB, N18, ND = len(G), sum(1 for g in G if g["t18"]), len(json.load(open("data/destinations.json", encoding="utf8")))
e = pages.e

FAQ = [("Qu’est-ce que Birdy Agent ?",
        "Birdy Agent est un assistant golf en ligne. Vous écrivez à Birdy, son intelligence artificielle, ce que vous cherchez : un séjour golf en groupe, "
        f"un départ sur l’un des {NB} golfs de France, un cours avec un pro ou une simple réponse à une question de golf. Birdy vous guide et prépare votre demande."),
       ("Est-ce gratuit ?",
        "Oui. Parler à Birdy et envoyer une demande est gratuit et sans engagement. Un conseiller vous recontacte ensuite avec les vrais tarifs."),
       ("Faut-il déjà savoir jouer au golf ?",
        "Non. Birdy s’adresse autant aux débutants qu’aux joueurs confirmés : il explique le vocabulaire, conseille une initiation et trouve un golf près de chez vous."),
       ("Birdy réserve-t-il directement ?",
        "Pas encore. Birdy prépare votre demande ; un conseiller réserve auprès du golf, de l’hôtel ou de l’enseignant, puis vous confirme l’horaire et le prix. "
        "Rien n’est réservé sans votre accord.")]

extra = ('<meta name="google-site-verification" content="9CmbDk2RYy_-zVtR54PaEHLoKOCGyIaTBsAj_KvGPvg">\n'
         '<link rel="stylesheet" href="/parcours/parcours.css">\n<link rel="stylesheet" href="/parcours/pro.css">\n'
         '<link rel="stylesheet" href="/assets/accueil.css">\n'
         '<link rel="preload" as="image" href="/assets/img/green-coucher-soleil.webp" fetchpriority="high">\n'
         # Anciennes adresses : /#organiser et /?dest=… mènent maintenant à l'onglet Voyages
         '<script>if(location.hash==="#organiser"||/[?&]dest=/.test(location.search))location.replace("/voyages/"+location.search+location.hash)</script>\n'
         + pages.ld(SITE_WEB) + pages.ld(AGENCE)
         + pages.ld({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
             {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": r}} for q, r in FAQ]}))

out = pages.head(TITLE, DESC, "", S + "og.jpg", extra)
out = out.replace('<html lang="fr">', '<html lang="fr" class="pro">', 1)
# Accueil général : uniquement le logo et les 3 onglets dans l'en-tête (pas le bouton du pôle Voyages)
out = out.replace('<a class="btn gold sm" href="/voyages/#organiser">Organiser mon séjour</a>', "", 1)

faq = "".join(f"<details><summary>{e(q)}</summary><p>{e(r)}</p></details>" for q, r in FAQ)
out += f"""<main class="gp home" id="accueil">

<section class="ha-hero"><div class="in">
  <div class="ha-logo" id="ha-logo"><img src="/logo.webp" alt="Birdy Agent" width="132" height="132"></div>
  <p class="ha-k"><i class="gp-dot"></i>L’assistant IA du golf</p>
  <h1 class="ha-h1">Tout le golf, <em>en une conversation.</em></h1>
  <p class="ha-lead">Voyage, parcours, cours ou simple question : dites-le à Birdy, que vous débutiez ou que vous jouiez depuis vingt ans.</p>

  <div class="gp-chat ha-chat" id="ha-chat">
    <div class="gp-chat-h"><img src="/favicon-96.png" alt="" width="52" height="52"><div><b>Birdy</b><span><i class="gp-dot"></i>Votre assistant golf · répond tout de suite</span></div></div>
    <div class="gp-log" id="ha-say" aria-live="polite"><div class="gm b">Bonjour, je suis Birdy. Un voyage golf entre amis, un parcours près de chez vous, un cours pour débuter ou une simple question : dites-moi tout.</div></div>
    <div class="gp-sugg" id="ha-sugg"><button type="button">Je débute, par où commencer ?</button><button type="button">Un 18 trous près de Lyon samedi</button><button type="button">8 amis au soleil en mars</button><button type="button">Un cours près de Bordeaux</button><button type="button">C’est quoi un index ?</button></div>
    <form class="gp-ask" id="ha-ask" autocomplete="off"><label class="sr" for="ha-q">Votre message à Birdy</label>
      <input id="ha-q" maxlength="400" placeholder="Écrivez à Birdy…"><button class="btn gold" type="submit" aria-label="Envoyer">→</button></form>
  </div>
  <p class="ha-note">Gratuit · sans inscription · un conseiller confirme chaque demande</p>
</div></section>

<section class="ha-sec" id="a-quoi-sert"><div class="in">
  <p class="ha-k">À quoi sert Birdy Agent ?</p>
  <h2 class="ha-h2">Un seul assistant, tout votre golf</h2>
  <p class="ha-sub">Birdy comprend ce que vous cherchez et vous emmène au bon endroit. Vous pouvez aussi y aller directement.</p>
  <div class="ha-poles">
    <a class="ha-pole t3d ha-ia" href="#ha-chat" id="ha-parler"><i>💬</i><small>Birdy · assistant IA</small><b>Poser une question de golf</b>
      <span>Règles, vocabulaire, matériel, premiers pas : Birdy répond simplement, à toute heure, et vous oriente.</span><em>Parler à Birdy →</em></a>
    <a class="ha-pole t3d" href="/voyages/"><i>✈️</i><small>Voyages</small><b>Partir jouer en groupe</b>
      <span>{ND} destinations dans le monde, entre amis, en club ou en séminaire. Un conseiller obtient les vrais tarifs.</span><em>Organiser un séjour →</em></a>
    <a class="ha-pole t3d" href="/parcours/"><i>⛳</i><small>Réserver un parcours</small><b>Jouer près de chez vous</b>
      <span>{NB} golfs de France, dont {N18} avec un parcours 18 trous. Choisissez, demandez votre départ.</span><em>Trouver un parcours →</em></a>
    <a class="ha-pole t3d" href="/cours/"><i>🎓</i><small>Cours avec un Pro</small><b>Apprendre et progresser</b>
      <span>Initiation, cours individuels, stages ou analyse vidéo, dans le golf de votre choix.</span><em>Trouver un cours →</em></a>
  </div>
</div></section>

<section class="ha-sec"><div class="in">
  <p class="ha-k">Pour tous les golfeurs</p>
  <h2 class="ha-h2">Débutant ou confirmé, Birdy parle votre golf</h2>
  <div class="ha-qui">
    <div><b>Vous débutez</b><p>Birdy explique sans jargon, conseille une initiation et trouve un golf accueillant près de chez vous.</p><button type="button" class="ha-ex">Je n’ai jamais joué, comment débuter ?</button></div>
    <div><b>Vous jouez régulièrement</b><p>Un départ ce week-end, un nouveau parcours à découvrir, un pro pour gagner en régularité.</p><button type="button" class="ha-ex">Un 18 trous autour de Nantes dimanche matin</button></div>
    <div><b>Vous partez en groupe</b><p>Amis, club, association ou entreprise : Birdy trouve la destination, un conseiller s’occupe du reste.</p><button type="button" class="ha-ex">Séminaire golf pour 20 personnes au printemps</button></div>
  </div>
</div></section>

<section class="ha-sec"><div class="in">
  <p class="ha-k">Comment ça marche</p>
  <h2 class="ha-h2">De la question au départ</h2>
  <ol class="ha-steps">
    <li><i>1</i><div><b>Vous écrivez à Birdy</b><p>En une phrase, comme à un ami golfeur.</p></div></li>
    <li><i>2</i><div><b>Birdy trouve et prépare</b><p>Destinations, parcours ou cours : il affiche les bonnes pistes et prépare votre demande.</p></div></li>
    <li><i>3</i><div><b>Un conseiller confirme</b><p>Il réserve pour vous et vous donne l’horaire et le vrai prix. Rien n’est réservé sans votre accord.</p></div></li>
  </ol>
  <div class="ha-nums"><div><b>{ND}</b><span>destinations de voyage</span></div><div><b>{NB}</b><span>golfs en France</span></div><div><b>{N18}</b><span>parcours 18 trous</span></div><div><b>0 €</b><span>la demande</span></div></div>
</div></section>

<section class="ha-sec ha-faq"><div class="in">
  <h2 class="ha-h2">Questions fréquentes</h2>
  <div class="faq">{faq}</div>
  <p class="ha-cta"><a class="btn gold" href="#ha-chat" id="ha-parler2">Parler à Birdy</a></p>
</div></section>

</main>
<script defer src="/assets/parcours.js"></script>
<script defer src="/assets/accueil.js"></script>
"""
open("index.html", "w", encoding="utf8").write(out + pages.foot())
print("index.html : accueil général")
