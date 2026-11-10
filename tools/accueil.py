#!/usr/bin/env python3
"""Page d'accueil du site (index.html).

Pour l'instant volontairement vierge : uniquement l'en-tête (logo + 3 onglets) et le fond
habituel (vert avec la photo de golf en fondu). Le contenu sera construit dans <main>.
L'ancienne page d'accueil (séjours golf de groupe) est devenue l'onglet Voyages : voyages/index.html.
Lancé par tools/guides.py.
"""
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

extra = ('<meta name="google-site-verification" content="9CmbDk2RYy_-zVtR54PaEHLoKOCGyIaTBsAj_KvGPvg">\n'
         '<link rel="stylesheet" href="/parcours/parcours.css">\n<link rel="stylesheet" href="/parcours/pro.css">\n'
         '<link rel="preload" as="image" href="/assets/img/green-coucher-soleil.webp" fetchpriority="high">\n'
         # Le fond occupe tout l'écran sous l'en-tête, même sans contenu
         '<style>html.pro main.gp.home{min-height:calc(100vh - 69px);min-height:calc(100svh - 69px)}.top .logo span{display:block!important}</style>\n'
         # Anciennes adresses : /#organiser et /?dest=… mènent maintenant à l'onglet Voyages
         '<script>if(location.hash==="#organiser"||/[?&]dest=/.test(location.search))location.replace("/voyages/"+location.search+location.hash)</script>\n'
         + pages.ld(SITE_WEB) + pages.ld(AGENCE))

out = pages.head(TITLE, DESC, "", S + "og.jpg", extra)
out = out.replace('<html lang="fr">', '<html lang="fr" class="pro">', 1)
# Accueil neutre : uniquement le logo et les 3 onglets (pas le bouton « Organiser mon séjour » du pôle Voyages)
out = out.replace('<a class="btn gold sm" href="/voyages/#organiser">Organiser mon séjour</a>', "", 1)
out += """<main class="gp home" id="accueil">
  <h1 class="sr">Birdy Agent, le golf sur mesure</h1>
  <!-- Nouveau contenu de la page d'accueil : à construire ici -->
</main>
</body>
</html>
"""
open("index.html", "w", encoding="utf8").write(out)
print("index.html : accueil (vierge)")
