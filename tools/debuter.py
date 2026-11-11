#!/usr/bin/env python3
"""Pôle 4 « Débuter » (Birdy Start) : page /debuter/ pour celui qui n'a jamais joué.

    python3 tools/debuter.py      (lancé aussi par tools/guides.py)

Page visuelle, peu de texte : on apprend en manipulant.
  - un trou de golf en 3D : on « joue » les 5 étapes du débutant, le vocabulaire s'affiche sur le terrain ;
  - le swing en 3D : un personnage exécute le geste phase par phase ;
  - les clubs : la trajectoire de la balle selon le club choisi ;
  - le score (compteur), l'étiquette (cartes qui se retournent), le starter pack (à cocher), le lexique ;
  - Birdy en coach, dans un panneau flottant.
Aucun prix : le budget dépend du golf, de l'enseignant et du matériel.
Comportement : assets/debuter.js (interface) et assets/debuter3d.js (scènes 3D, Three.js). Styles : debuter/debuter.css.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import pages  # noqa: E402

S, e = pages.SITE, pages.e
G = json.load(open("data/golfs.json", encoding="utf8"))["golfs"]
NB, N9 = len(G), sum(1 for g in G if g["t9"])

# Les 5 étapes, jouées comme un trou : (mot, titre, une phrase, libellé du bouton, lien / « ?question pour Birdy »)
ETAPES = [
    ("Découvrir", "L’initiation", "Une à deux heures avec un enseignant. Clubs prêtés, aucun niveau requis.",
     "Trouver une initiation", "/cours/?type=Initiation"),
    ("Apprendre", "Les bases du swing", "Quelques cours et un seau de balles au practice pour installer un geste régulier.",
     "Voir le swing en 3D", "#swing"),
    ("Comprendre", "Les règles et l’étiquette", "Compter ses coups, savoir quoi faire dans le sable ou dans l’eau, respecter les autres joueurs.",
     "Voir les bons réflexes", "#parcours"),
    ("Valider", "La carte verte", "Un petit examen avec un enseignant : il valide que vous pouvez jouer en autonomie.",
     "Demander à Birdy", "?C’est quoi la carte verte et comment la passer ?"),
    ("Jouer", "Le premier parcours", f"Commencez par un 9 trous, aux heures calmes. {N9} golfs de France en proposent un.",
     "Trouver un 9 trous", "/parcours/?trous=9"),
]

# Le vocabulaire affiché sur le trou en 3D : (identifiant du repère dans la scène, mot, définition)
TERRAIN = [
    ("depart", "Départ", "La zone d’où l’on joue le premier coup du trou."),
    ("fairway", "Fairway", "L’herbe tondue court : là où il faut viser."),
    ("rough", "Rough", "L’herbe haute sur les côtés, plus difficile à jouer."),
    ("bunker", "Bunker", "Un obstacle de sable."),
    ("eau", "Obstacle d’eau", "Si la balle y tombe : un coup de pénalité."),
    ("green", "Green", "L’herbe très rase autour du trou, où l’on putte."),
    ("drapeau", "Drapeau", "Il indique où se trouve le trou."),
]

# Le swing, phase par phase : (nom, la phrase à retenir)
SWING = [
    ("L’adresse", "Stable et détendu : dos droit, genoux souples, bras relâchés."),
    ("La montée", "Les épaules tournent, les bras suivent."),
    ("Le sommet", "Dos à la cible, le poids côté arrière."),
    ("La descente", "Les hanches lancent le mouvement, les bras suivent."),
    ("L’impact", "Le poids passe à l’avant, les mains devant la balle."),
    ("Le finish", "En équilibre, face à la cible."),
]
# Gros plans : (identifiant, nom, la phrase)
ZOOMS = [
    ("grip", "Le grip", "Les deux mains collées, dans les doigts. Pression légère, comme un tube de dentifrice."),
    ("posture", "La posture", "On s’incline depuis les hanches, dos droit, poids au milieu des pieds."),
    ("alignement", "L’alignement", "Pieds et épaules parallèles à la ligne de jeu, comme deux rails de train."),
]

# Les clubs : (identifiant, nom, rôle en quelques mots, inclinaison approximative de la face en degrés, portée relative, hauteur relative)
CLUBS = [
    ("bois", "Bois", "Le plus long : pour le départ des grands trous.", 15, 1.0, 0.52),
    ("hybride", "Hybride", "Long et facile : l’ami du débutant.", 22, 0.82, 0.62),
    ("fer7", "Fer 7", "Le club à tout faire, celui des premiers cours.", 33, 0.62, 0.78),
    ("fer9", "Fer 9", "Plus court et plus haut : pour viser le green.", 41, 0.47, 0.9),
    ("wedge", "Sand wedge", "Très haut, très court : approches et sorties de bunker.", 56, 0.23, 0.84),
    ("putter", "Putter", "Sur le green : la balle roule jusqu’au trou.", 3, 0.13, 0.0),
]

# L'étiquette : (pictogramme, titre, la règle en une phrase)
ETIQUETTE = [
    ("🤫", "Silence", "On ne parle pas et on ne bouge pas quand quelqu’un joue."),
    ("⚠️", "Sécurité", "On ne joue jamais si un joueur est à portée. En cas de danger, on crie « Balle ! »."),
    ("⏱️", "Rythme", "On avance sans traîner et on laisse passer les plus rapides."),
    ("🟢", "Le green", "On relève ses pitchs : la marque que la balle laisse en tombant."),
    ("🏖️", "Le bunker", "On ratisse le sable après son coup."),
    ("🌱", "Le fairway", "On replace la motte de gazon arrachée par le club."),
]

LEXIQUE = [
    ("Par", "Le nombre de coups prévu pour finir un trou : 3, 4 ou 5."),
    ("Birdie", "Un coup de moins que le par sur un trou."),
    ("Eagle", "Deux coups de moins que le par."),
    ("Bogey", "Un coup de plus que le par. Deux de plus : double bogey."),
    ("Départ (tee)", "La zone d’où l’on joue le premier coup d’un trou. Le tee est aussi la petite cheville qui porte la balle."),
    ("Fairway", "La partie tondue court entre le départ et le green : là où il faut viser."),
    ("Rough", "L’herbe haute qui borde le fairway, plus difficile à jouer."),
    ("Green", "La surface très rase où se trouve le trou, sur laquelle on putte."),
    ("Bunker", "Un obstacle de sable."),
    ("Practice", "La zone d’entraînement où l’on tape des balles."),
    ("Putt", "Un coup roulé sur le green, joué avec le putter."),
    ("Approche", "Un coup court joué vers le green."),
    ("Drive", "Le long coup de départ, souvent joué avec le driver."),
    ("Fer", "Un club à tête fine en métal, numéroté : plus le chiffre est grand, plus la balle monte et moins elle va loin."),
    ("Bois", "Un club à grosse tête pour les longs coups. Le plus long est le driver."),
    ("Hybride", "Un club entre le fer et le bois, plus facile à jouer qu’un long fer."),
    ("Wedge", "Un fer très ouvert pour les coups courts et les sorties de bunker (sand wedge)."),
    ("Loft", "L’inclinaison de la face du club : c’est elle qui fait monter la balle."),
    ("Index", "Le chiffre qui mesure votre niveau. Il démarre à 54 ; plus il est bas, meilleur est le joueur."),
    ("Carte verte", "Le petit examen qui valide que vous pouvez jouer sur un parcours en autonomie."),
    ("Green-fee", "Le droit de jeu payé pour jouer un parcours."),
    ("Pitch", "La marque laissée par la balle en tombant sur le green, à réparer avec un relève-pitch."),
    ("Divot", "La motte de gazon arrachée par le club, à replacer."),
    ("Mulligan", "Un coup rejoué par tolérance entre amis. Il n’existe pas dans les règles."),
    ("Stableford", "Une formule de jeu où l’on marque des points par trou : idéale pour débuter, car un trou raté ne gâche pas la partie."),
    ("Scramble", "Une formule par équipe : chacun joue, on garde la meilleure balle et tout le monde rejoue de là."),
]

# Le starter pack : (identifiant, onglet, phrase, [(pictogramme, objet, précision)])
PACK = [
    ("jour1", "Le premier jour", "Rien à acheter : venez comme vous êtes.",
     [("👕", "Tenue confortable", "pantalon ou bermuda, polo"), ("👟", "Baskets", "à semelle plate"),
      ("💧", "Bouteille d’eau", "et une casquette"), ("🏌️", "Clubs prêtés", "à confirmer avec le golf")]),
    ("essentiel", "Quand vous êtes mordu", "L’essentiel pour jouer régulièrement.",
     [("⛳", "Demi-série", "bois ou hybride, fers 7 et 9, sand wedge, putter"), ("🎒", "Sac léger", "à bretelles ou trépied"),
      ("⚪", "Balles", "d’occasion : on en perd"), ("📍", "Tees", "bois ou plastique"),
      ("🧤", "Gant", "main gauche pour un droitier"), ("🔧", "Relève-pitch", "et marque-balle"),
      ("👞", "Chaussures de golf", "à crampons souples")]),
    ("plus-tard", "Plus tard", "Quand vous jouez sur le parcours.",
     [("🪪", "Licence", "pour l’index et les compétitions"), ("🏌️‍♂️", "Série complète", "14 clubs au maximum"),
      ("🛒", "Chariot", "pour 18 trous"), ("📐", "Essai sur mesure", "le fitting")]),
]
ATTENDRE = ["driver haut de gamme", "série complète neuve", "balles de compétition", "gadgets d’entraînement"]

FAQ = [
    ("Combien de temps faut-il pour savoir jouer au golf ?",
     "Quelques séances suffisent pour taper la balle au practice et prendre du plaisir. Pour jouer un parcours avec aisance, comptez de quelques semaines à "
     "quelques mois selon la fréquence de vos cours et de vos entraînements."),
    ("Faut-il acheter du matériel pour commencer ?",
     "Non. Pour une initiation, les clubs et les balles sont en général prêtés par le golf ou l’enseignant. Attendez d’être sûr d’aimer le golf, "
     "puis commencez par une demi-série, neuve ou d’occasion."),
    ("C’est quoi la carte verte ?",
     "C’est un petit examen passé avec un enseignant : des questions de règles et d’étiquette, puis quelques trous joués. Elle valide que vous pouvez jouer "
     "sur un parcours en autonomie ; de nombreux golfs la demandent pour accéder au grand parcours."),
    ("Je suis gaucher : qu’est-ce que ça change ?",
     "Presque rien : il existe des clubs pour gauchers et les conseils s’inversent simplement. Certains gauchers préfèrent jouer en droitier ; "
     "essayez les deux pendant l’initiation et gardez le côté le plus naturel."),
    ("À quel âge peut-on commencer le golf ?",
     "À tout âge. Les enfants débutent dans les écoles de golf, et beaucoup de joueurs commencent à l’âge adulte ou à la retraite. "
     "Le golf se pratique à son rythme."),
    ("Combien coûte le golf quand on débute ?",
     "Cela dépend du golf, de l’enseignant et du matériel choisi. Birdy Agent ne publie pas de prix : envoyez une demande gratuite, "
     "un conseiller vous donne les vrais tarifs près de chez vous."),
]


def page():
    path = "debuter/"
    title = "Débuter le golf : étapes, bases et starter pack | Birdy Agent"
    desc = ("Débuter le golf simplement : les 5 étapes sur un trou en 3D, le swing animé phase par phase, les clubs, les règles et le matériel. "
            "Birdy répond à vos questions.")
    extra = ('<link rel="stylesheet" href="/parcours/parcours.css">\n<link rel="stylesheet" href="/parcours/pro.css">\n'
             '<link rel="stylesheet" href="/debuter/debuter.css">\n<link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin>\n')
    extra += pages.ld({"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Accueil", "item": S},
        {"@type": "ListItem", "position": 2, "name": "Débuter", "item": S + path}]})
    extra += pages.ld({"@context": "https://schema.org", "@type": "HowTo", "name": "Débuter le golf en 5 étapes", "inLanguage": "fr-FR",
                       "step": [{"@type": "HowToStep", "position": i + 1, "name": t, "text": x} for i, (_, t, x, _, _) in enumerate(ETAPES)]})
    extra += pages.ld({"@context": "https://schema.org", "@type": "DefinedTermSet", "name": "Lexique du golf pour débutants", "inLanguage": "fr-FR",
                       "hasDefinedTerm": [{"@type": "DefinedTerm", "name": m, "description": d} for m, d in LEXIQUE]})
    extra += pages.ld({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": r}} for q, r in FAQ]})

    # Données lues par les scripts de la page
    data = {"etapes": [{"k": k, "t": t, "x": x, "lib": lib, "c": c} for k, t, x, lib, c in ETAPES],
            "terrain": [{"id": i, "n": n, "d": d} for i, n, d in TERRAIN],
            "swing": [{"n": n, "x": x} for n, x in SWING], "zooms": [{"id": i, "n": n, "x": x} for i, n, x in ZOOMS],
            "clubs": [{"id": i, "n": n, "x": x, "loft": lo, "d": d, "h": h} for i, n, x, lo, d, h in CLUBS]}

    points = "".join(f'<button type="button" data-i="{i}" aria-label="Étape {i + 1} : {e(t)}"></button>' for i, (_, t, _, _, _) in enumerate(ETAPES))
    etapes_txt = "".join(f"<li><b>{e(t)}</b> : {e(x)}</li>" for _, t, x, _, _ in ETAPES)
    phases = "".join(f'<button type="button" role="tab" data-i="{i}" aria-selected="{"true" if i == 0 else "false"}"><i>{i + 1}</i>{e(n)}</button>'
                     for i, (n, _) in enumerate(SWING))
    zooms = "".join(f'<button type="button" data-z="{i}">{e(n)}</button>' for i, n, _ in ZOOMS)
    clubs = "".join(f'<button type="button" role="tab" data-c="{i}" aria-selected="{"true" if i == "fer7" else "false"}">{e(n)}</button>' for i, n, _, _, _, _ in CLUBS)
    cartes = "".join(f'<button type="button" class="et-c" aria-pressed="false"><span class="et-in"><span class="et-f"><i>{ic}</i><b>{e(t)}</b></span>'
                     f'<span class="et-b">{e(x)}</span></span></button>' for ic, t, x in ETIQUETTE)
    onglets = "".join(f'<button type="button" role="tab" data-g="{g}" aria-selected="{"true" if n == 0 else "false"}">{e(t)}</button>'
                      for n, (g, t, _, _) in enumerate(PACK))
    packs = "".join(
        f'<div class="pk-g" data-g="{g}"{"" if n == 0 else " hidden"}><p class="pk-st">{e(st)}</p><div class="pk-items">'
        + "".join(f'<label class="pk-i"><input type="checkbox" data-id="{g}-{j}"><i>{ic}</i><b>{e(a)}</b><small>{e(b)}</small></label>'
                  for j, (ic, a, b) in enumerate(items))
        + "</div></div>" for n, (g, _, st, items) in enumerate(PACK))
    total = sum(len(x[3]) for x in PACK)
    mots = "".join(f'<button type="button" class="lx-m" data-d="{e(d)}">{e(m)}</button>' for m, d in LEXIQUE)
    lex_txt = "".join(f"<dt>{e(m)}</dt><dd>{e(d)}</dd>" for m, d in LEXIQUE)

    out = pages.head(title, desc, path, S + "og.jpg", extra)
    out += f"""<main class="gp db">

<section class="dh"><div class="in">
  <nav class="crumbs dh-crumbs" aria-label="Fil d’Ariane"><a href="/">Accueil</a> › <span>Débuter</span></nav>
  <div class="dh-head">
    <p class="db-k">Birdy Start · Débuter le golf</p>
    <h1 class="dh-h1">Débuter le golf, <em>du bon pied.</em></h1>
    <p class="dh-lead">Jouez ce trou : chaque coup est une étape de vos débuts.</p>
  </div>
  <div class="dh-wrap">
    <div class="dh-scene" id="dh-scene">
      <div class="dh-pins" id="dh-pins"></div>
      <button type="button" class="dh-voc" id="dh-voc" aria-pressed="false"><i></i>Vocabulaire</button>
      <p class="dh-def" id="dh-def" hidden></p>
      <p class="dh-hint" aria-hidden="true">Faites glisser pour tourner</p>
    </div>
    <div class="dh-card" id="dh-card">
      <small id="dh-k"></small><b id="dh-t"></b><p id="dh-x"></p>
      <div id="dh-act" class="dh-act"></div>
      <div class="dh-nav"><button type="button" id="dh-prev" aria-label="Étape précédente">←</button><div class="dh-dots" id="dh-dots">{points}</div><button type="button" id="dh-next" class="dh-next">Coup suivant →</button></div>
    </div>
  </div>
  <ol class="sr">{etapes_txt}</ol>
</div></section>

<section class="db-sec" id="swing"><div class="in db-two">
  <div class="db-txt">
    <div class="db-tete"><p class="db-k">Le swing en 3D</p>
    <h2>Le geste, image par image</h2></div>
    <div class="sw-phases" id="sw-phases" role="tablist" aria-label="Phases du swing">{phases}</div>
    <p class="sw-cap" id="sw-cap" aria-live="polite"></p>
    <div class="sw-zooms" id="sw-zooms"><span>Gros plan</span>{zooms}</div>
    <p class="db-note">Geste d’un droitier ; pour un gaucher, tout s’inverse. Rien ne remplace un cours avec un enseignant.</p>
  </div>
  <div class="sw-scene" id="sw-scene">
    <div class="sw-ctrl">
      <button type="button" class="sw-play" id="sw-play" aria-label="Lancer le swing">▶</button>
      <input type="range" id="sw-t" min="0" max="1000" value="0" aria-label="Avancer dans le swing">
      <div class="sw-vues" id="sw-vues"><button type="button" data-v="face" aria-pressed="true">Face</button><button type="button" data-v="profil" aria-pressed="false">Profil</button></div>
    </div>
  </div>
</div></section>

<section class="db-sec" id="clubs"><div class="in">
  <p class="db-k">Les clubs</p>
  <h2>Un club, une trajectoire</h2>
  <div class="cl-box">
    <div class="cl-tabs" id="cl-tabs" role="tablist" aria-label="Choisir un club">{clubs}</div>
    <div class="cl-vue">
      <svg id="cl-svg" viewBox="0 0 800 300" role="img" aria-label="Trajectoire de la balle selon le club">
        <defs><linearGradient id="cl-sol" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#3E9461"/><stop offset="1" stop-color="#1F5A3F"/></linearGradient></defs>
        <path d="M0 258 Q400 244 800 258 L800 300 L0 300Z" fill="url(#cl-sol)"/>
        <g id="cl-fant"></g>
        <path id="cl-arc" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="1 9"/>
        <ellipse id="cl-ombre" cx="60" cy="256" rx="7" ry="2.4" fill="rgba(0,0,0,.35)"/>
        <g id="cl-drap"><line x1="0" y1="0" x2="0" y2="-46" stroke="#E8F1EC" stroke-width="2"/><path d="M0 -46 L20 -39 L0 -32Z" fill="#E5484D"/></g>
        <circle id="cl-balle" cx="60" cy="250" r="6" fill="#fff"/>
      </svg>
      <div class="cl-info">
        <svg class="cl-face" viewBox="0 0 90 90" aria-hidden="true"><line x1="14" y1="76" x2="80" y2="76" stroke="rgba(232,241,236,.4)" stroke-width="2"/><line x1="30" y1="76" x2="30" y2="14" stroke="rgba(232,241,236,.25)" stroke-width="2" stroke-dasharray="3 5"/><line id="cl-loft" x1="30" y1="76" x2="30" y2="14" stroke="#A3C9B8" stroke-width="6" stroke-linecap="round"/></svg>
        <div><b id="cl-n"></b><p id="cl-x"></p><small id="cl-l"></small></div>
      </div>
    </div>
  </div>
  <p class="db-note">Les portées sont comparées entre elles : la distance réelle dépend de chaque joueur.</p>
</div></section>

<section class="db-sec" id="parcours"><div class="in db-duo">
  <div class="sc-box">
    <p class="db-k">Le score</p>
    <h2>Comptez vos coups</h2>
    <p class="sc-par">Ce trou est un <b>par 4</b> : quatre coups prévus.</p>
    <div class="sc-jeu"><button type="button" id="sc-moins" aria-label="Un coup de moins">−</button><div class="sc-n"><b id="sc-n">4</b><small>coups</small></div><button type="button" id="sc-plus" aria-label="Un coup de plus">+</button></div>
    <p class="sc-nom" id="sc-nom" aria-live="polite">Par</p>
    <p class="sc-x" id="sc-x">Pile le score prévu.</p>
  </div>
  <div class="et-box">
    <p class="db-k">L’étiquette</p>
    <h2>Les bons réflexes</h2>
    <div class="et-grid">{cartes}</div>
    <p class="db-note">Touchez une carte pour la retourner.</p>
  </div>
</div></section>

<section class="db-sec" id="starter-pack"><div class="in">
  <p class="db-k">Le starter pack</p>
  <h2>Le matériel, au bon moment</h2>
  <div class="pk-box">
    <div class="pk-top"><div class="pk-tabs" id="pk-tabs" role="tablist" aria-label="Moment">{onglets}</div>
      <div class="pk-prog" aria-live="polite"><div class="pk-bar"><i id="pk-bar"></i></div><span id="pk-compte">0 sur {total}</span></div></div>
    {packs}
    <p class="pk-non"><b>Pas tout de suite</b> {" · ".join(e(a) for a in ATTENDRE)}</p>
  </div>
  <p class="db-note">Cochez ce que vous avez : la liste est gardée sur cet appareil. Pas de prix affichés, ils varient selon la marque et l’état.</p>
</div></section>

<section class="db-sec" id="lexique"><div class="in">
  <p class="db-k">Le lexique</p>
  <h2>Un mot vous échappe ?</h2>
  <div class="lx-box">
    <label class="lx-ch"><span class="sr">Chercher un mot</span><input id="lx-q" type="search" placeholder="birdie, green, index…" autocomplete="off"></label>
    <div class="lx-mots" id="lx-mots">{mots}</div>
    <p class="lx-def" id="lx-def" aria-live="polite"><b>Touchez un mot</b>pour voir ce qu’il veut dire.</p>
    <p class="lx-vide" id="lx-vide" hidden>Pas dans le lexique. <button type="button" class="db-ask" id="lx-ask">Demander à Birdy</button></p>
  </div>
  <dl class="sr">{lex_txt}</dl>
</div></section>

<section class="db-sec db-fin"><div class="in"><div class="db-fin-b">
  <h2>Prêt à taper vos premières balles ?</h2>
  <div class="db-cta"><a class="btn gold" href="/cours/?type=Initiation">Trouver une initiation</a><a class="btn ghost db-ghost" href="/parcours/?trous=9">Voir les golfs 9 trous</a></div>
</div></div></section>

<section class="band tint"><div class="in">
  <h2>Questions de débutant</h2>
  <div class="faq">{"".join(f"<details><summary>{e(a)}</summary><p>{e(b)}</p></details>" for a, b in FAQ)}</div>
  <p class="more"><a href="/cours/">Cours avec un pro</a> · <a href="/parcours/">Réserver un parcours</a> · <a href="/voyages/">Voyages golf</a></p>
</div></section>
</main>

<button type="button" class="bc-btn" id="bc-btn" aria-expanded="false" aria-controls="bc-pan"><img src="/favicon-96.png" alt="" width="44" height="44"><span><b>Birdy</b><small>Une question ?</small></span></button>
<div class="bc-pan" id="bc-pan" role="dialog" aria-label="Birdy, votre coach pour débuter" hidden>
  <div class="gp-chat">
    <div class="gp-chat-h"><img src="/favicon-96.png" alt="" width="44" height="44"><div><b>Birdy</b><span><i class="gp-dot"></i>Votre coach pour débuter</span></div><button type="button" class="bc-x" id="bc-x" aria-label="Fermer">×</button></div>
    <div class="gp-log" id="db-say" aria-live="polite"><div class="gm b">Bonjour ! Je suis Birdy, votre coach pour débuter. Ici, aucune question n’est bête : posez la vôtre.</div></div>
    <div class="gp-sugg" id="db-sugg"><button type="button">Par où commencer ?</button><button type="button">C’est quoi la carte verte ?</button><button type="button">Je suis gaucher, ça change quoi ?</button><button type="button">Quels clubs pour débuter ?</button></div>
    <form class="gp-ask" id="db-form" autocomplete="off"><label class="sr" for="db-q">Votre question à Birdy</label>
      <input id="db-q" maxlength="400" placeholder="Votre question de débutant…"><button class="btn gold" type="submit" aria-label="Envoyer">→</button></form>
  </div>
</div>
<script id="db-data" type="application/json">{json.dumps(data, ensure_ascii=False).replace("</", "<\\/")}</script>
<script defer src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script defer src="/assets/parcours.js"></script>
<script defer src="/assets/debuter.js"></script>
<script defer src="/assets/debuter3d.js"></script>
"""
    out = out.replace('<html lang="fr">', '<html lang="fr" class="pro">', 1)
    os.makedirs("debuter", exist_ok=True)
    open("debuter/index.html", "w", encoding="utf8").write(out + pages.foot())
    print("debuter/index.html :", len(ETAPES), "étapes,", len(SWING), "phases du swing,", len(CLUBS), "clubs,", len(LEXIQUE), "mots,", total, "éléments du starter pack")


if __name__ == "__main__":
    page()
