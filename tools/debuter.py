#!/usr/bin/env python3
"""Pôle 4 « Débuter » (Birdy Start) : page /debuter/ pour celui qui n'a jamais joué.

    python3 tools/debuter.py      (lancé aussi par tools/guides.py)

Contenu : le parcours du débutant en 5 étapes, les fiches des bases, le lexique, le starter pack
à cocher et Birdy en coach. Aucun prix : le budget dépend du golf, de l'enseignant et du matériel.
Comportement : assets/debuter.js. Styles : debuter/debuter.css (mise en page partagée avec cours/cours.css).
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import pages  # noqa: E402

S, e = pages.SITE, pages.e
G = json.load(open("data/golfs.json", encoding="utf8"))["golfs"]
NB, N9 = len(G), sum(1 for g in G if g["t9"])

# (numéro, titre, texte, libellé du bouton, lien ou question pour Birdy)
ETAPES = [
    ("Découvrir", "L’initiation",
     "Une à deux heures avec un enseignant. On vous prête les clubs, vous tapez vos premières balles au practice et vous essayez le putting. "
     "Aucun matériel ni niveau requis.",
     "Trouver une initiation", "/cours/?type=Initiation"),
    ("Apprendre", "Les bases du swing",
     "Quelques cours pour installer la tenue du club, la posture et un geste régulier. Entre deux cours, un seau de balles au practice suffit pour progresser.",
     "Voir les fiches", "#bases"),
    ("Comprendre", "Les règles et l’étiquette",
     "Compter son score, savoir quoi faire quand la balle est perdue ou dans l’eau, et bien se comporter sur le parcours. C’est plus simple qu’il n’y paraît.",
     "Lire l’étiquette", "#fiche-etiquette"),
    ("Valider", "La carte verte",
     "Un petit examen passé avec un enseignant : quelques questions de règles et d’étiquette, puis quelques trous joués. "
     "De nombreux golfs la demandent pour accéder au grand parcours.",
     "Demander à Birdy", "?C’est quoi la carte verte et comment la passer ?"),
    ("Jouer", "Le premier parcours",
     f"Commencez par un 9 trous, aux heures calmes, si possible avec un joueur plus expérimenté. {N9} golfs de France ont un parcours 9 trous.",
     "Trouver un 9 trous", "/parcours/?trous=9"),
]

# (identifiant, icône, titre, l'idée en une phrase, 3 points clés, l'erreur classique, question pour Birdy)
FICHES = [
    ("grip", "🤝", "Tenir le club", "Les deux mains travaillent ensemble, sans serrer.",
     ["Pour un droitier, la main gauche est en haut du manche, la droite juste en dessous (l’inverse pour un gaucher).",
      "Le club se tient dans les doigts plus que dans la paume, les deux mains bien collées.",
      "Pression légère : comme un tube de dentifrice ouvert qu’on ne veut pas vider."],
     "Serrer trop fort : les poignets se bloquent et la balle part moins loin.",
     "Comment bien tenir mon club de golf ?"),
    ("posture", "🧍", "Se placer", "Une position stable et détendue, prête à tourner.",
     ["Pieds écartés de la largeur des épaules, genoux légèrement fléchis.",
      "Le dos reste droit et s’incline depuis les hanches, les bras pendent naturellement.",
      "Le poids est au milieu des pieds, ni sur les talons ni sur les pointes."],
     "Le dos rond et les jambes raides : le corps ne peut plus tourner.",
     "Quelle est la bonne posture au golf ?"),
    ("alignement", "🎯", "Viser", "On vise avec le club, puis on aligne le corps.",
     ["Posez d’abord la face du club vers la cible, ensuite placez-vous.",
      "Pieds, hanches et épaules sont parallèles à la ligne de jeu, comme deux rails de train.",
      "La balle est au milieu des pieds pour les clubs courts, plus vers le pied avant pour les clubs longs."],
     "Viser la cible avec les épaules : on se retrouve aligné trop à droite (pour un droitier).",
     "Comment bien m’aligner vers la cible ?"),
    ("swing", "🏌️", "Le swing", "Une rotation fluide, pas un coup de force.",
     ["À la montée, les épaules tournent et le poids passe côté arrière.",
      "À la descente, le poids revient vers l’avant et le corps tourne vers la cible.",
      "On termine en équilibre, face à la cible, sur le pied avant."],
     "Vouloir lever la balle ou frapper fort : c’est l’inclinaison du club qui la fait monter, pas vous.",
     "Quels sont les bases du swing pour un débutant ?"),
    ("petit-jeu", "🌿", "Les approches", "Près du green, un petit geste précis vaut mieux qu’un grand.",
     ["Le poids est côté cible et y reste pendant tout le geste.",
      "Les mains sont un peu en avant de la balle, le mouvement vient des épaules.",
      "Faites rouler la balle dès que possible : c’est plus facile à doser."],
     "Donner un coup de poignet pour lever la balle : elle part trop loin ou reste sur place.",
     "Comment réussir mes approches autour du green ?"),
    ("putting", "⛳", "Le putting", "Sur le green, le dosage compte plus que la ligne.",
     ["Les yeux sont au-dessus de la balle, les poignets restent fermes.",
      "Le geste est un balancier des épaules, aussi long à l’aller qu’au retour.",
      "Gardez la tête immobile et écoutez la balle tomber dans le trou."],
     "Relever la tête trop tôt pour suivre la balle.",
     "Comment mieux putter quand on débute ?"),
    ("score", "🔢", "Compter son score", "Chaque coup compte un point, le moins possible gagne.",
     ["Chaque trou a un par : le nombre de coups prévu (3, 4 ou 5).",
      "Un coup de moins que le par, c’est un birdie ; un de plus, un bogey.",
      "L’index mesure votre niveau : il démarre à 54 et baisse quand vous progressez."],
     "S’acharner sur un trou raté : en partie amicale, relevez la balle et passez au suivant.",
     "Comment compter mon score au golf ?"),
    ("etiquette", "🤫", "L’étiquette", "Les bons réflexes pour jouer en sécurité et sans gêner.",
     ["Silence et immobilité quand quelqu’un joue ; ne jouez jamais si un joueur est à portée de balle.",
      "Gardez le rythme et laissez passer la partie suivante si vous êtes plus lents.",
      "Réparez le terrain : relevez vos pitchs sur le green, replacez les mottes, ratissez le bunker."],
     "Oublier de crier « Balle ! » quand un coup part vers d’autres joueurs.",
     "Quelles sont les règles de politesse sur un parcours de golf ?"),
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

# (identifiant, titre, sous-titre, [éléments]) : chaque élément est (libellé, précision)
PACK = [
    ("jour1", "Le premier jour", "Rien à acheter : venez comme vous êtes.",
     [("Une tenue confortable", "pantalon ou bermuda, polo ou tee-shirt simple"),
      ("Des baskets à semelle plate", "pas besoin de chaussures de golf pour une initiation"),
      ("Une bouteille d’eau", "et une casquette s’il fait beau"),
      ("Les clubs et les balles prêtés", "à confirmer avec le golf au moment de réserver")]),
    ("essentiel", "Quand vous êtes mordu", "L’essentiel pour jouer régulièrement.",
     [("Une demi-série", "un bois ou un hybride, deux fers (7 et 9), un sand wedge et un putter"),
      ("Un sac léger", "avec des bretelles ou un trépied"),
      ("Des balles", "d’occasion ou recyclées : on en perd beaucoup au début"),
      ("Des tees", "en bois ou en plastique"),
      ("Un gant", "à la main gauche pour un droitier, à la droite pour un gaucher"),
      ("Un relève-pitch et un marque-balle", "pour réparer le green et marquer sa balle"),
      ("Des chaussures de golf", "à crampons souples, pour l’adhérence sur l’herbe humide")]),
    ("plus-tard", "Plus tard", "Quand vous jouez sur le parcours.",
     [("La licence de golf", "nécessaire pour avoir un index officiel et jouer en compétition"),
      ("La série complète", "14 clubs au maximum dans le sac"),
      ("Un chariot", "pour ne plus porter le sac sur 18 trous"),
      ("Un essai de clubs sur mesure (fitting)", "quand votre swing est devenu régulier")]),
]
ATTENDRE = ["Un driver haut de gamme", "Une série complète neuve", "Des balles de compétition", "Les gadgets d’entraînement"]

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


def bouton(lib, cible, cls="btn gold sm"):
    """Lien normal, ou question envoyée à Birdy quand la cible commence par « ? »."""
    if cible.startswith("?"):
        return f'<button type="button" class="{cls} db-ask" data-q="{e(cible[1:])}">{e(lib)}</button>'
    return f'<a class="{cls}" href="{e(cible)}">{e(lib)}</a>'


def page():
    path = "debuter/"
    title = "Débuter le golf : étapes, bases et starter pack | Birdy Agent"
    desc = ("Débuter le golf simplement : les 5 étapes du débutant, les bases du swing, les règles, le lexique et le matériel pour commencer. "
            "Birdy répond à vos questions.")
    extra = ('<link rel="stylesheet" href="/parcours/parcours.css">\n<link rel="stylesheet" href="/parcours/pro.css">\n'
             '<link rel="stylesheet" href="/cours/cours.css">\n<link rel="stylesheet" href="/debuter/debuter.css">\n')
    extra += pages.ld({"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Accueil", "item": S},
        {"@type": "ListItem", "position": 2, "name": "Débuter", "item": S + path}]})
    extra += pages.ld({"@context": "https://schema.org", "@type": "HowTo", "name": "Débuter le golf en 5 étapes", "inLanguage": "fr-FR",
                       "step": [{"@type": "HowToStep", "position": i + 1, "name": t, "text": x} for i, (_, t, x, _, _) in enumerate(ETAPES)]})
    extra += pages.ld({"@context": "https://schema.org", "@type": "DefinedTermSet", "name": "Lexique du golf pour débutants", "inLanguage": "fr-FR",
                       "hasDefinedTerm": [{"@type": "DefinedTerm", "name": m, "description": d} for m, d in LEXIQUE]})
    extra += pages.ld({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": r}} for q, r in FAQ]})

    etapes = "".join(
        f'<li class="db-step t3d" style="--k:{i}"><i>{i + 1}</i><small>{e(k)}</small><b>{e(t)}</b><p>{e(x)}</p>{bouton(lib, c)}</li>'
        for i, (k, t, x, lib, c) in enumerate(ETAPES))
    def fiche(n, i, ic, t, idee, pts, err, q):
        return (f'<details class="db-fiche" id="fiche-{i}" style="--o:{n}"><summary><i>{ic}</i><span><b>{e(t)}</b><small>{e(idee)}</small></span></summary>'
                f'<div class="db-fiche-c"><ul>{"".join(f"<li>{e(p)}</li>" for p in pts)}</ul>'
                f'<p class="db-err"><b>L’erreur classique</b>{e(err)}</p>'
                f'<button type="button" class="db-plus db-ask" data-q="{e(q)}">Demander plus de détails à Birdy</button></div></details>')
    # Deux colonnes indépendantes (ouvrir une fiche ne crée pas de trou à côté) ; l'ordre de lecture est gardé sur mobile
    cols = ["".join(fiche(n, *f) for n, f in enumerate(FICHES) if n % 2 == k) for k in (0, 1)]
    fiches_cols = "".join(f'<div class="db-col">{c}</div>' for c in cols)
    lexique = "".join(f'<div class="db-mot"><dt>{e(m)}</dt><dd>{e(d)}</dd></div>' for m, d in LEXIQUE)
    pack = "".join(
        f'<section class="db-pack" data-g="{g}"><h3>{e(t)}</h3><p>{e(st)}</p><ul>'
        + "".join(f'<li><label><input type="checkbox" data-id="{g}-{j}"><span><b>{e(a)}</b><small>{e(b)}</small></span></label></li>' for j, (a, b) in enumerate(items))
        + "</ul></section>" for g, t, st, items in PACK)
    attendre = "".join(f"<li>{e(a)}</li>" for a in ATTENDRE)
    total = sum(len(x[3]) for x in PACK)

    out = pages.head(title, desc, path, S + "og.jpg", extra)
    out += f"""<main class="gp cp db">
<div class="in cp-grid">
  <aside class="cp-side">
    <div class="gp-chat cp-chat">
      <div class="gp-chat-h"><img src="/favicon-96.png" alt="" width="44" height="44"><div><b>Birdy</b><span><i class="gp-dot"></i>Votre coach pour débuter · répond tout de suite</span></div></div>
      <div class="gp-log" id="db-say" aria-live="polite"><div class="gm b">Bonjour ! Je suis Birdy, votre coach pour débuter. Ici, aucune question n’est bête : posez la vôtre.</div></div>
      <div class="gp-sugg" id="db-sugg"><button type="button">Par où commencer ?</button><button type="button">C’est quoi la carte verte ?</button><button type="button">Je suis gaucher, ça change quoi ?</button><button type="button">Quels clubs pour débuter ?</button></div>
      <form class="gp-ask" id="db-form" autocomplete="off"><label class="sr" for="db-q">Votre question à Birdy</label>
        <input id="db-q" maxlength="400" placeholder="Votre question de débutant…"><button class="btn gold" type="submit" aria-label="Envoyer">→</button></form>
    </div>
    <p class="cp-side-note">Gratuit · sans inscription · Birdy explique simplement</p>
  </aside>

  <div class="cp-main">
    <nav class="crumbs cp-crumbs" aria-label="Fil d’Ariane"><a href="/">Accueil</a> › <span>Débuter</span></nav>
    <p class="tag cp-tag">Birdy Start · Débuter le golf</p>
    <h1 class="cp-h1 db-h1">Débuter le golf, <em>du bon pied.</em></h1>
    <p class="cp-lead">Les étapes, les bases et le matériel pour commencer, expliqués simplement. Et Birdy répond à toutes vos questions de débutant.</p>

    <section class="db-sec" id="etapes"><p class="gp-k">Le parcours du débutant</p><h2>De la première balle au premier parcours</h2>
      <ol class="db-steps">{etapes}</ol>
    </section>

    <section class="db-sec" id="bases"><p class="gp-k">Les bases</p><h2>L’essentiel, en une minute par fiche</h2>
      <p class="db-sub">Les conseils sont donnés pour un droitier : inversez gauche et droite si vous êtes gaucher. Rien ne remplace un cours avec un enseignant.</p>
      <div class="db-fiches">{fiches_cols}</div>
    </section>

    <section class="db-sec" id="lexique"><p class="gp-k">Le lexique</p><h2>Les mots du golf, sans jargon</h2>
      <label class="db-cherche"><span class="sr">Chercher un mot</span><input id="db-mot" type="search" placeholder="Chercher un mot : birdie, green, index…" autocomplete="off"></label>
      <dl class="db-lexique court" id="db-lexique">{lexique}</dl>
      <button type="button" class="db-tout" id="db-tout">Voir les {len(LEXIQUE)} mots du lexique</button>
      <p class="db-vide" id="db-vide" hidden>Ce mot n’est pas dans le lexique. <button type="button" class="db-lien db-ask" id="db-vide-ask">Demander à Birdy</button></p>
    </section>

    <section class="db-sec" id="starter-pack"><p class="gp-k">Le starter pack</p><h2>Le matériel, au bon moment</h2>
      <p class="db-sub">Cochez ce que vous avez déjà : votre liste est gardée sur cet appareil.</p>
      <div class="db-prog" aria-live="polite"><div class="db-bar"><i id="db-bar"></i></div><span id="db-compte">0 sur {total}</span></div>
      <div class="db-packs">{pack}
        <section class="db-pack db-non"><h3>À ne pas acheter tout de suite</h3><p>Attendez d’avoir un swing régulier.</p><ul>{attendre}</ul></section>
      </div>
      <p class="db-note">Nous n’affichons pas de prix : ils varient selon les marques et l’état (neuf ou occasion). Le pro de votre golf saura vous conseiller.</p>
    </section>

    <section class="db-sec db-suite"><h2>Prêt à taper vos premières balles ?</h2>
      <div class="db-cta"><a class="btn gold" href="/cours/?type=Initiation">Trouver une initiation près de chez moi</a><a class="btn ghost db-ghost" href="/parcours/?trous=9">Voir les golfs 9 trous</a></div>
    </section>
  </div>
</div>

<section class="band tint"><div class="in">
  <h2>Questions de débutant</h2>
  <div class="faq">{"".join(f"<details><summary>{e(a)}</summary><p>{e(b)}</p></details>" for a, b in FAQ)}</div>
  <p class="more"><a href="/cours/">Cours avec un pro</a> · <a href="/parcours/">Réserver un parcours</a> · <a href="/voyages/">Voyages golf</a></p>
</div></section>
</main>
<script defer src="/assets/parcours.js"></script>
<script defer src="/assets/debuter.js"></script>
"""
    out = out.replace('<html lang="fr">', '<html lang="fr" class="pro">', 1)
    os.makedirs("debuter", exist_ok=True)
    open("debuter/index.html", "w", encoding="utf8").write(out + pages.foot())
    print("debuter/index.html :", len(ETAPES), "étapes,", len(FICHES), "fiches,", len(LEXIQUE), "mots,", total, "éléments du starter pack")


if __name__ == "__main__":
    page()
