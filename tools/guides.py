#!/usr/bin/env python3
"""Génère les pages guides (guides/*.html), leur page d'accueil et le sitemap complet.

Lancer depuis la racine du dépôt, après tools/pages.py :  python3 tools/guides.py
Chaque guide répond à une recherche précise d'un client (ex. « week-end golf entre amis Portugal »).
"""
import html
import json
import os
import sys
from urllib.parse import quote

sys.path.insert(0, os.path.dirname(__file__))
import pages  # noqa: E402

SITE, TEL, WA = pages.SITE, pages.TEL, pages.WA
e = html.escape
DEST = {d["nom"]: d for d in json.load(open("data/destinations.json", encoding="utf8"))}

GUIDES = [
    {
        "slug": "week-end-golf-entre-amis-portugal",
        "titre": "Week-end golf entre amis au Portugal : Algarve ou Lisbonne ?",
        "h1": "Un week-end golf entre amis au Portugal",
        "court": "Week-end golf entre amis au Portugal",
        "desc": "Organiser un week-end golf entre potes au Portugal : où jouer (Algarve, Lisbonne et Cascais), "
                "quand partir, le programme type sur 3 jours et comment tout réserver sans prise de tête.",
        "lead": "Vous êtes 4, 8 ou 12 copains, vous voulez du soleil, de beaux parcours et une bonne table le soir ? "
                "Le Portugal coche toutes les cases, à environ 2 h 30 de vol de Paris.",
        "photo": DEST["Algarve"]["photo"],
        "dest": "Algarve",
        "wa": "Bonjour Birdy Agent, on est un groupe d’amis et on voudrait un week-end golf au Portugal.",
        "sections": [
            ("Pourquoi le Portugal pour un week-end golf", "ul", [
                "Plus d’une centaine de parcours, surtout en Algarve et autour de Lisbonne.",
                "Des vols courts : environ 2 h 30 jusqu’à Faro, un peu moins jusqu’à Lisbonne. Trois jours suffisent.",
                "Un climat doux une grande partie de l’année, qui permet de jouer quand il pleut en France.",
                "Des parcours pour tous les niveaux : le meilleur joueur de la bande et celui qui débute s’y retrouvent.",
                "Des soirées faciles : bonnes tables, terrasses et bord de mer.",
            ]),
            ("Algarve ou Lisbonne et Cascais ?", "duo", [
                ("Algarve", "La référence du golf au Portugal. Monte Rei, signé Jack Nicklaus, Quinta do Lago, Vale do Lobo… "
                            "Idéal pour enchaîner les parcours sans passer la journée en voiture.", "/golf/algarve.html"),
                ("Lisbonne et Cascais", "Le golf le jour, la ville le soir. Des parcours entre océan et collines, "
                                        "avec Lisbonne et ses quartiers à proximité.", "/golf/lisbonne-et-cascais.html"),
            ]),
            ("Le week-end type : 3 jours, 2 nuits", "ol", [
                "<b>Vendredi</b> : vol le matin, transfert à l’hôtel, practice ou 9 trous l’après-midi, premier dîner tous ensemble.",
                "<b>Samedi</b> : 18 trous le matin, déjeuner au club-house, second parcours ou détente l’après-midi, dîner de groupe.",
                "<b>Dimanche</b> : un dernier parcours tôt le matin, puis vol retour en fin de journée.",
            ]),
            ("Quand partir ?", "p", [
                "Le printemps et l’automne sont les périodes préférées des golfeurs : il fait doux et c’est agréable toute la journée. "
                "L’hiver reste une bonne option en Algarve. En été il fait chaud : on joue alors tôt le matin.",
                "Pour un groupe, mieux vaut s’y prendre tôt : les week-ends du printemps et de l’automne partent vite.",
            ]),
            ("Combien ça coûte ?", "p", [
                "Le budget dépend surtout de trois choses : l’hôtel, le nombre de parcours et les vols. "
                "Nous demandons les vrais tarifs aux hôtels et aux golfs pour votre groupe, puis nous vous envoyons "
                "une proposition détaillée, sans engagement. Vous comparez, vous décidez.",
            ]),
        ],
        "faq": [
            ("On n’a pas tous le même niveau, c’est un problème ?",
             "Non. On choisit des parcours qui plaisent à tout le monde, et les débutants peuvent prendre un cours pendant que les autres jouent."),
            ("Et si certains n’ont pas leurs clubs ?",
             "Dites-le-nous dans votre demande : nous vérifions la location de matériel sur place et la prévoyons pour ceux qui en ont besoin."),
            ("Vous vous occupez aussi des vols ?",
             "Oui, si vous le souhaitez. Vous pouvez aussi réserver vos vols vous-mêmes : nous organisons le reste."),
            ("Faut-il réserver longtemps à l’avance ?",
             "Le plus tôt possible pour un groupe, surtout pour les week-ends du printemps et de l’automne, très demandés."),
        ],
        "liens": ["Algarve", "Lisbonne et Cascais", "Açores", "Marbella", "Marrakech"],
    },
    {
        "slug": "enterrement-de-vie-de-garcon-golf",
        "titre": "EVG golf : un enterrement de vie de garçon au soleil",
        "h1": "Un enterrement de vie de garçon autour du golf",
        "court": "Enterrement de vie de garçon au golf",
        "desc": "Organiser un EVG golf : destinations au soleil à quelques heures de vol (Portugal, Espagne, Maroc), "
                "programme sur un week-end, compétition entre amis et soirées. Demande gratuite et sans engagement.",
        "lead": "Le futur marié aime le golf ? Offrez-lui un week-end entre amis au soleil, avec une compétition pour rire, "
                "de bons dîners et zéro organisation de votre côté.",
        "photo": DEST["Marbella"]["photo"],
        "dest": "Marbella",
        "wa": "Bonjour Birdy Agent, on organise un enterrement de vie de garçon et on aimerait un week-end golf.",
        "sections": [
            ("Les bonnes destinations pour un EVG golf", "ul", [
                "<b>L’Algarve</b>, au Portugal : de très beaux parcours et des soirées au bord de l’océan.",
                "<b>Marbella</b> et la Costa del Sol : des dizaines de parcours et une vie nocturne animée.",
                "<b>La Catalogne</b> : Barcelone à environ 1 h 45 de vol de Paris, golf et ville dans le même week-end.",
                "<b>Marrakech</b> : le golf entre palmeraie et Atlas, et une ambiance unique le soir.",
            ]),
            ("Un programme qui plaît à tout le monde", "ol", [
                "<b>Une compétition amicale</b> en équipes (un scramble, par exemple) : les bons joueurs et les débutants jouent ensemble.",
                "<b>Un cours d’initiation</b> pour ceux qui n’ont jamais joué.",
                "<b>Un grand dîner</b> pour le futur marié, et une soirée selon vos envies.",
                "<b>Du temps libre</b> : plage, piscine, ou un dernier parcours le dimanche.",
            ]),
            ("Combien ça coûte ?", "p", [
                "Tout dépend du nombre de participants, de l’hôtel, du nombre de parcours et des vols. "
                "Dites-nous votre budget par personne : nous demandons les vrais tarifs et vous proposons un séjour qui le respecte.",
            ]),
        ],
        "faq": [
            ("Tout le monde ne joue pas au golf, c’est possible ?",
             "Oui. Les non-golfeurs peuvent prendre un cours d’initiation, ou profiter de la plage et de la piscine pendant que les autres jouent."),
            ("Combien de temps à l’avance faut-il s’y prendre ?",
             "Idéalement deux à trois mois avant, pour avoir le choix des hôtels et des horaires de départ au golf."),
            ("Le futur marié ne doit rien savoir : comment faire ?",
             "Un seul organisateur fait la demande et échange avec nous. Nous ne contactons que lui."),
        ],
        "liens": ["Algarve", "Marbella", "Catalogne", "Marrakech", "Majorque"],
    },
    {
        "slug": "seminaire-golf-entreprise",
        "titre": "Séminaire golf d’entreprise : destinations et organisation",
        "h1": "Un séminaire d’entreprise autour du golf",
        "court": "Séminaire golf d’entreprise",
        "desc": "Organiser un séminaire golf ou un incentive : hôtels sur le golf, initiation pour les débutants, "
                "dîners de groupe et transferts. Belek, Marrakech, Algarve, mer Rouge et plus de 50 destinations.",
        "lead": "Réunir vos équipes autour du golf, c’est créer des souvenirs communs, entre joueurs confirmés et débutants. "
                "Nous organisons tout : hôtel, parcours, cours, dîners et transferts.",
        "photo": DEST["Belek"]["photo"],
        "dest": "Belek",
        "wa": "Bonjour Birdy Agent, nous préparons un séminaire d’entreprise et aimerions y intégrer du golf.",
        "sections": [
            ("Des destinations faites pour les groupes", "ul", [
                "<b>Belek</b>, en Turquie : de grands resorts et des hôtels au bord du golf.",
                "<b>Marrakech</b> : des parcours entre palmeraie et Atlas, et des lieux de réception uniques.",
                "<b>L’Algarve</b> : des resorts de golf à environ 2 h 30 de vol de Paris.",
                "<b>La mer Rouge</b> : El Gouna et Soma Bay, des resorts 5 étoiles au soleil toute l’année.",
            ]),
            ("Ce que nous organisons pour vous", "ul", [
                "Un hôtel adapté à la taille du groupe et à vos temps de travail.",
                "Une initiation pour les débutants et une compétition par équipes.",
                "Les dîners de groupe et les transferts.",
                "Un interlocuteur unique du premier message au retour.",
            ]),
        ],
        "faq": [
            ("La plupart de nos collaborateurs n’ont jamais joué : est-ce adapté ?",
             "Oui. Une initiation encadrée permet à chacun de découvrir le golf, et les formats par équipes mélangent tous les niveaux."),
            ("À partir de combien de personnes ?",
             "Nous organisons des séjours pour les petits comités comme pour les grands groupes. Indiquez votre nombre de participants dans la demande."),
            ("Comment recevoir une proposition ?",
             f"Répondez à quatre questions sur le site ou appelez le {TEL}. Un conseiller revient vers vous avec une proposition et les vrais tarifs."),
        ],
        "liens": ["Belek", "Marrakech", "Algarve", "Mer Rouge", "Dubaï"],
    },
    {
        "slug": "voyage-golf-club-association",
        "titre": "Voyage golf pour club ou association",
        "h1": "Le voyage de votre club ou de votre association",
        "court": "Voyage golf pour club ou association",
        "desc": "Organiser le voyage golf de votre club ou de votre association : Écosse et Saint-Andrews, Irlande, "
                "Algarve, Maroc… Hôtel, parcours, compétition et dîner de clôture. Demande gratuite.",
        "lead": "Le voyage annuel du club, c’est le moment que tout le monde attend. Nous nous occupons de l’organisation, "
                "vous profitez du jeu et de la compétition.",
        "photo": DEST["Irlande"]["photo"],
        "dest": "Saint-Andrews",
        "wa": "Bonjour Birdy Agent, nous organisons le voyage golf de notre club.",
        "sections": [
            ("Des destinations qui font rêver les golfeurs", "ul", [
                "<b>L’Écosse</b> : Saint-Andrews, l’Old Course et les links de la côte est.",
                "<b>L’Irlande</b> : Druids Glen et The K Club, hôte de la Ryder Cup 2006.",
                "<b>L’Algarve</b> : des parcours au soleil, accessibles à tous les niveaux.",
                "<b>Le Maroc</b> : Marrakech, Agadir, El Jadida, Fès… plus de quarante parcours dans le pays.",
            ]),
            ("Ce que nous organisons pour le club", "ul", [
                "L’hébergement de tout le groupe et la répartition des chambres.",
                "Les départs groupés sur les parcours et la compétition du club.",
                "Le dîner de clôture et la remise des prix.",
                "Les transferts entre l’aéroport, l’hôtel et les golfs.",
            ]),
        ],
        "faq": [
            ("Nos membres ont des index très différents : comment faire ?",
             "Nous choisissons des parcours adaptés et pouvons organiser la compétition en équipes ou en stableford pour que chacun ait sa chance."),
            ("Peut-on partir à plus de vingt personnes ?",
             "Oui. Indiquez le nombre de participants dans votre demande : nous cherchons les hôtels et les golfs capables d’accueillir tout le groupe."),
            ("Qui est notre interlocuteur ?",
             "Un conseiller suit votre voyage du premier message jusqu’au retour."),
        ],
        "liens": ["Saint-Andrews", "East Lothian", "Irlande", "Algarve", "Marrakech"],
    },
    {
        "slug": "golf-au-soleil-en-hiver",
        "titre": "Golf au soleil en hiver : où partir en groupe ?",
        "h1": "Jouer au golf au soleil en hiver",
        "court": "Golf au soleil en hiver",
        "desc": "Où jouer au golf au soleil en hiver : Algarve, Canaries, Marrakech, Agadir, mer Rouge, Dubaï, île Maurice, "
                "Floride, Caraïbes… Destinations proches ou lointaines pour un séjour golf de groupe.",
        "lead": "Quand les parcours sont détrempés en France, d’autres golfs vous attendent au soleil. "
                "À quelques heures de vol pour un long week-end, ou plus loin pour une vraie semaine de golf.",
        "photo": DEST["Agadir"]["photo"] or DEST["Algarve"]["photo"],
        "dest": "Algarve",
        "wa": "Bonjour Birdy Agent, nous aimerions partir jouer au golf au soleil cet hiver.",
        "sections": [
            ("Au soleil, à quelques heures de vol", "ul", [
                "<b>L’Algarve</b>, au Portugal : la référence du golf en Europe, à environ 2 h 30 de vol de Paris.",
                "<b>Les Canaries</b> : pour jouer au soleil toute l’année.",
                "<b>Marbella</b> et la Costa del Sol : des dizaines de parcours.",
                "<b>Marrakech</b> et <b>Agadir</b>, au Maroc : le golf entre palmeraie, Atlas et océan.",
                "<b>Djerba</b> et <b>la mer Rouge</b> : des resorts au soleil pour une semaine au chaud.",
            ]),
            ("Plus loin, pour une semaine ou plus", "ul", [
                "<b>Dubaï</b> : des parcours spectaculaires au milieu du désert.",
                "<b>L’océan Indien</b> : île Maurice, La Réunion, Seychelles.",
                "<b>L’Asie</b> : Thaïlande, Vietnam, Cambodge.",
                "<b>Les Amériques</b> : Floride, Cancún, Punta Mita, Bahamas, Jamaïque, République dominicaine, Barbade.",
                "<b>L’hémisphère sud</b> : Le Cap et la Garden Route, Sun City, Australie, Nouvelle-Zélande, où c’est l’été.",
            ]),
            ("Bien choisir sa destination", "p", [
                "Pour un week-end de trois ou quatre jours, restez sur un vol court : Portugal, Espagne ou Maroc. "
                "Pour une semaine, les destinations lointaines valent le voyage.",
                "Les vacances d’hiver sont très demandées : pour un groupe, mieux vaut s’y prendre tôt. "
                "Dites-nous vos dates, nous vérifions les disponibilités des hôtels et des golfs.",
            ]),
        ],
        "faq": [
            ("Quelle est la destination golf la plus proche pour avoir du soleil en hiver ?",
             "Le Portugal (Algarve), le sud de l’Espagne, les Canaries et le Maroc sont les plus proches de la France. "
             "Nous vous aidons à choisir selon vos dates et votre groupe."),
            ("Combien coûte un séjour golf au soleil en hiver ?",
             "Le prix dépend de la destination, des dates, de l’hôtel et du nombre de parcours. "
             "Nous demandons les vrais tarifs pour votre groupe et vous envoyons une proposition détaillée, sans engagement."),
            ("Vous occupez-vous des vols ?",
             "Oui, si vous le souhaitez. Vous pouvez aussi réserver vos vols vous-mêmes : nous organisons le reste."),
        ],
        "liens": ["Algarve", "Canaries", "Marrakech", "Agadir", "Mer Rouge", "Dubaï", "Île Maurice", "Floride"],
    },
    {
        "slug": "sejour-golf-tout-compris",
        "titre": "Séjour golf tout compris en groupe : ce qui est inclus",
        "h1": "Un séjour golf tout compris pour votre groupe",
        "court": "Séjour golf tout compris",
        "desc": "Séjour golf tout compris en groupe : hébergement, green-fees, transferts, dîners et vols si vous le souhaitez. "
                "Ce qui est inclus, ce qu’il faut vérifier et comment recevoir une proposition.",
        "lead": "Un seul interlocuteur, un seul devis : l’hôtel, les parcours, les transferts et les dîners sont organisés pour tout le groupe. "
                "Vous n’avez plus qu’à jouer.",
        "photo": DEST["Belek"]["photo"],
        "dest": "Algarve",
        "wa": "Bonjour Birdy Agent, nous cherchons un séjour golf tout compris pour notre groupe.",
        "sections": [
            ("Ce que nous pouvons inclure", "ul", [
                "<b>L’hébergement</b> de tout le groupe, de l’hôtel au resort sur le golf, et la répartition des chambres.",
                "<b>Les green-fees</b> et les heures de départ réservées sur chaque parcours.",
                "<b>Les transferts</b> entre l’aéroport, l’hôtel et les golfs.",
                "<b>Les dîners de groupe</b> et les moments à partager.",
                "<b>Des cours</b> pour les débutants, et la location de matériel si besoin.",
                "<b>Les vols</b>, si vous le souhaitez.",
            ]),
            ("Ce qu’il faut vérifier avant de réserver", "ul", [
                "Le nombre de parcours compris et leur niveau, pour que tout le groupe s’amuse.",
                "Les repas compris : petit-déjeuner, demi-pension ou dîners de groupe.",
                "Le transport des sacs de golf en avion.",
                "Les conditions de modification et d’annulation pour un groupe.",
            ]),
            ("Comment se construit votre proposition", "ol", [
                "<b>Vous nous dites votre envie</b> : groupe, période, budget, destination si vous en avez une.",
                "<b>Nous demandons les vrais tarifs</b> aux hôtels et aux golfs pour vos dates.",
                "<b>Vous recevez une proposition détaillée</b>, poste par poste, sans engagement.",
            ]),
        ],
        "faq": [
            ("Le prix est-il fixé à l’avance ?",
             "Non : chaque séjour est sur mesure. Nous demandons les tarifs pour votre groupe et vos dates, puis nous vous envoyons une proposition détaillée."),
            ("Peut-on réserver les vols nous-mêmes ?",
             "Oui. Nous organisons alors le séjour sur place : hôtel, parcours, transferts et dîners."),
            ("La demande est-elle payante ?",
             "Non. La demande est gratuite et sans engagement."),
        ],
        "liens": ["Algarve", "Belek", "Marrakech", "Marbella", "Mer Rouge"],
    },
    {
        "slug": "sejour-golf-debutant",
        "titre": "Séjour golf pour débutants : partir en groupe sans stress",
        "h1": "Un séjour golf quand on débute",
        "court": "Séjour golf pour débutants",
        "desc": "Débutant au golf ? Partez en groupe avec des joueurs confirmés : cours, practice, parcours adaptés et location de matériel. "
                "Nos conseils et nos destinations.",
        "lead": "Pas besoin d’avoir un index pour partir. Avec des cours, des parcours adaptés et un groupe bienveillant, "
                "un séjour golf est la meilleure façon de commencer.",
        "photo": DEST["Marbella"]["photo"],
        "dest": "Algarve",
        "wa": "Bonjour Birdy Agent, il y a des débutants dans notre groupe et nous aimerions partir au golf.",
        "sections": [
            ("Ce que nous prévoyons pour les débutants", "ul", [
                "<b>Des cours</b> avec un enseignant, en petit groupe.",
                "<b>Du temps au practice</b> et sur le putting green.",
                "<b>Des parcours adaptés</b>, ou des 9 trous, pour jouer sans pression.",
                "<b>La location de matériel</b> pour ceux qui n’ont pas de clubs.",
            ]),
            ("Débutants et confirmés dans le même groupe", "p", [
                "C’est le cas de la plupart des groupes. Les joueurs confirmés partent sur un grand parcours pendant que les débutants prennent leur cours, "
                "puis tout le monde se retrouve pour une partie par équipes, un déjeuner au club-house ou le dîner.",
                "Les formats par équipes, comme le scramble, permettent à chacun de jouer avec les autres sans ralentir la partie.",
            ]),
        ],
        "faq": [
            ("Faut-il une carte verte ou un index pour jouer ?",
             "Certains parcours demandent un niveau minimum. Dites-nous le niveau de chacun : nous choisissons des parcours accessibles et prévoyons des cours."),
            ("Faut-il acheter des clubs avant de partir ?",
             "Non. Indiquez-le dans votre demande : nous vérifions la location de matériel sur place."),
            ("Quelle destination pour un premier séjour golf ?",
             "Une destination proche avec de nombreux parcours, comme l’Algarve, Marbella ou Marrakech, est un bon choix pour commencer."),
        ],
        "liens": ["Algarve", "Marbella", "Marrakech", "Agadir", "Belek"],
    },
]


def section_html(titre, kind, items):
    out = f"<h2>{e(titre)}</h2>"
    if kind == "ul":
        out += "<ul>" + "".join(f"<li>{i}</li>" for i in items) + "</ul>"
    elif kind == "ol":
        out += '<ol class="steps">' + "".join(f"<li>{i}</li>" for i in items) + "</ol>"
    elif kind == "p":
        out += "".join(f"<p>{e(i)}</p>" for i in items)
    elif kind == "duo":
        out += '<div class="duo">' + "".join(
            f'<a class="choice" href="{h}"><b>{e(t)}</b><span>{e(x)}</span><em>Voir la destination</em></a>' for t, x, h in items) + "</div>"
    return out


def page_guide(g):
    path = f"guides/{g['slug']}.html"
    img = pages.photo_abs(g["photo"])
    extra = pages.ld({"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Accueil", "item": SITE},
        {"@type": "ListItem", "position": 2, "name": "Idées de séjours", "item": SITE + "guides/"},
        {"@type": "ListItem", "position": 3, "name": g["court"], "item": SITE + path}]})
    extra += pages.ld({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": r}} for q, r in g["faq"]]})
    extra += pages.ld({"@context": "https://schema.org", "@type": "Article", "headline": g["titre"], "description": g["desc"],
                       "image": img, "inLanguage": "fr-FR", "author": {"@type": "Organization", "name": "Birdy Agent", "url": SITE},
                       "publisher": {"@type": "Organization", "name": "Birdy Agent", "logo": {"@type": "ImageObject", "url": SITE + "logo.webp"}},
                       "mainEntityOfPage": SITE + path})
    organiser = "/?dest=" + quote(g["dest"]) + "#organiser"
    wa = WA + quote(g["wa"])
    corps = "".join(f'<section class="block">{section_html(*s)}</section>' for s in g["sections"])
    liens = "".join(f'<a href="/golf/{pages.slug(n)}.html">{e(n)}<small>{e(DEST[n]["pays"])}</small></a>' for n in g["liens"])
    autres = "".join(f'<a href="/guides/{o["slug"]}.html">{e(o["court"])}</a>' for o in GUIDES if o is not g)
    out = pages.head(g["titre"] + " | Birdy Agent", g["desc"], path, img, extra)
    out += f"""<main>
<section class="hero">
  <img class="ph" src="{pages.photo(g['photo'], 1600)}" srcset="{pages.photo(g['photo'], 960)} 960w, {pages.photo(g['photo'], 1600)} 1600w" sizes="100vw" fetchpriority="high" alt="" onerror="this.remove()"><div class="veil"></div>
  <div class="in">
    <nav class="crumbs" aria-label="Fil d’Ariane"><a href="/">Accueil</a> › <a href="/guides/">Idées de séjours</a> › <span>{e(g['court'])}</span></nav>
    <h1>{e(g['h1'])}</h1>
    <p class="lead">{e(g['lead'])}</p>
    <div class="cta"><a class="btn gold" href="{organiser}">Recevoir une proposition</a><a class="btn light" href="{wa}" target="_blank" rel="noopener">Écrire sur WhatsApp</a></div>
  </div>
</section>
<section class="band"><div class="in grid">
  <article class="txt guide">{corps}</article>
  <aside class="box">
    <h2>On s’occupe de tout</h2>
    <p>Quatre questions, moins d’une minute. Demande gratuite et sans engagement.</p>
    <a class="btn gold" href="{organiser}">Organiser notre séjour</a>
    <p class="call">Ou appelez-nous<br><b>{TEL}</b></p>
  </aside>
</div></section>
<section class="band tint"><div class="in">
  <h2>Vos questions</h2>
  <div class="faq">{"".join(f"<details><summary>{e(q)}</summary><p>{e(r)}</p></details>" for q, r in g["faq"])}</div>
</div></section>
<section class="band"><div class="in">
  <h2>Destinations conseillées</h2>
  <div class="others">{liens}</div>
  <h2 class="mt">D’autres idées de séjours</h2>
  <div class="others plain">{autres}</div>
</div></section>
</main>
"""
    return path, out + pages.foot()


def page_hub():
    path = "guides/index.html"
    title = "Idées de séjours golf en groupe : amis, EVG, séminaire, hiver | Birdy Agent"
    desc = ("Week-end golf entre amis au Portugal, enterrement de vie de garçon, séminaire d’entreprise, voyage de club, "
            "golf au soleil en hiver, séjour tout compris ou pour débutants : nos idées de séjours golf de groupe.")
    out = pages.head(title, desc, "guides/", SITE + "og.jpg", "")
    cards = "".join(
        f'<a class="card" href="/guides/{g["slug"]}.html"><span class="pic"><img src="{pages.photo(g["photo"], 480)}" alt="" loading="lazy" onerror="this.remove()"></span>'
        f'<b>{e(g["court"])}</b><span class="t">{e(g["lead"])}</span></a>' for g in GUIDES)
    out += f"""<main>
<section class="hero short"><div class="veil"></div><div class="in">
  <nav class="crumbs" aria-label="Fil d’Ariane"><a href="/">Accueil</a> › <span>Idées de séjours</span></nav>
  <h1>Idées de séjours golf</h1>
  <p class="lead">Entre amis, pour un enterrement de vie de garçon, avec vos collègues ou votre club : trouvez le séjour qui vous ressemble.</p>
</div></section>
<section class="band"><div class="in"><div class="cards">{cards}</div></div></section>
</main>
"""
    return path, out + pages.foot()


if __name__ == "__main__":
    os.makedirs("guides", exist_ok=True)
    paths = []
    for g in GUIDES:
        p, h = page_guide(g)
        open(p, "w", encoding="utf8").write(h)
        paths.append(p)
    p, h = page_hub()
    open(p, "w", encoding="utf8").write(h)
    # Sitemap complet : accueil, guides, destinations, mentions légales
    golf = sorted(f"golf/{f}" for f in os.listdir("golf") if f.endswith(".html") and f != "index.html")
    pays = sorted(f"golf/pays/{f}" for f in os.listdir("golf/pays") if f.endswith(".html"))
    import glob as _glob
    parc = sorted(f for f in _glob.glob("parcours/**/*.html", recursive=True) if f != "parcours/index.html")
    allp = ["", "guides/index.html"] + paths + ["golf/index.html"] + pays + golf + ["parcours/index.html"] + parc + ["mentions-legales.html"]
    open("sitemap.xml", "w", encoding="utf8").write(pages.sitemap(allp))
    print(len(GUIDES), "guides générés ;", len(allp), "pages dans le sitemap")
    __import__("subprocess").run(["python3", os.path.join(os.path.dirname(__file__), "clean_urls.py")], check=True)
    __import__("subprocess").run(["python3", os.path.join(os.path.dirname(__file__), "llms.py")], check=True)
