#!/usr/bin/env python3
"""Refonte de la première page : Birdy (agent à règles) + globe 3D + récit + chiffres + Pour qui.

Transformation unique de voyages/index.html (ancienne page d'accueil, devenue l'onglet Voyages) (lancée une fois). Les données des destinations et
du globe sont injectées dans <script id="birdy-data">, le comportement est dans assets/birdy.js.
"""
import html
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(__file__))
import pages  # noqa: E402
import home_parts as H  # noqa: E402

e = html.escape
D = json.load(open("data/destinations.json", encoding="utf8"))
PTS = json.load(open("data/globe.json"))
RL = dict(pages.REGIONS)

TAGS = {
    "soleil": ["Algarve", "Lisbonne et Cascais", "Canaries", "Marbella", "Majorque", "Catalogne", "Sardaigne", "Sicile", "Grèce", "Chypre",
               "Belek", "Côte d’Azur", "Corse", "Marrakech", "Agadir", "El Jadida", "Tanger", "Mer Rouge", "Djerba", "Dubaï", "Île Maurice",
               "La Réunion", "Seychelles", "Thaïlande", "Floride", "Cancún", "Punta Mita", "Bahamas", "Jamaïque", "République dominicaine",
               "Barbade", "Le Cap et Garden Route", "Californie"],
    "hiver": ["Algarve", "Canaries", "Marbella", "Marrakech", "Agadir", "Mer Rouge", "Dubaï", "Île Maurice", "La Réunion", "Seychelles",
              "Thaïlande", "Floride", "Cancún", "Punta Mita", "Bahamas", "Jamaïque", "République dominicaine", "Barbade",
              "Le Cap et Garden Route", "Sun City et Kruger", "Australie", "Nouvelle-Zélande", "Vietnam", "Cambodge", "Djerba"],
    "court": [d["nom"] for d in D if d["region"] in ("france", "europe")] + ["Marrakech", "Agadir", "El Jadida", "Tanger", "Fès", "Djerba"],
    "fete": ["Algarve", "Marbella", "Catalogne", "Majorque", "Marrakech", "Lisbonne et Cascais", "Dubaï", "Mer Rouge"],
    "pro": ["Belek", "Marrakech", "Algarve", "Mer Rouge", "Dubaï", "El Jadida", "Marbella", "Agadir", "Majorque"],
    "links": ["Saint-Andrews", "East Lothian", "Turnberry", "Irlande", "Irlande du Nord", "Bretagne"],
    "exotique": ["Île Maurice", "Seychelles", "La Réunion", "Bahamas", "Barbade", "Jamaïque", "République dominicaine", "Thaïlande",
                 "Punta Mita", "Cancún", "Dubaï", "Vietnam"],
    "nature": ["Açores", "Nouvelle-Zélande", "Sun City et Kruger", "Le Cap et Garden Route", "Québec", "Autriche", "La Réunion"],
}
noms = {d["nom"] for d in D}
for k, v in TAGS.items():
    bad = [n for n in v if n not in noms]
    assert not bad, (k, bad)

data = {"dest": [{"n": d["nom"], "p": d["pays"], "r": d["region"], "rl": RL[d["region"]], "t": d["texte"], "ph": d["photo"],
                  "s": pages.slug(d["nom"]), "lat": d["lat"], "lon": d["lon"]} for d in D],
        "pts": PTS, "tags": TAGS}


def titre(t, gold_from=None):
    out, i = "", 0
    for wi, w in enumerate(t.split(" ")):
        cls = "w"
        spans = ""
        for c in w:
            i += 1
            g = " gold" if gold_from is not None and wi >= gold_from else ""
            spans += f'<span class="ch{g}" style="--i:{i}">{e(c)}</span>'
        out += f'<span class="{cls}">{spans}</span> '
    return out.strip()


s = open("voyages/index.html", encoding="utf8").read()


def rep(a, b, count=1):
    global s
    n = s.count(a)
    assert n == count, (n, a[:80])
    s = s.replace(a, b)


def cut(start, end_marker, include_end=True):
    """Retourne et retire le bloc de start jusqu'à end_marker (inclus)."""
    global s
    a = s.index(start)
    b = s.index(end_marker, a) + (len(end_marker) if include_end else 0)
    bloc = s[a:b]
    s = s[:a] + s[b:]
    return bloc


# 1. Menu
rep('<nav class="links"><a href="#etapes">Comment ça marche</a><a href="#destinations">Destinations</a></nav>',
    '<nav class="links"><a href="#carte">La carte</a><a href="#birdy">Comment ça marche</a><a href="#pourqui">Pour qui</a><a href="/guides/">Idées de séjours</a></nav>')

# 2. Retrait des anciennes sections
cx = cut('<section class="cx" id="accueil"', "</section>")
cut('<section class="band" id="etapes">', "</section>")
cut('<section class="band" id="destinations">', "</div></section>")
while '<template id="art-' in s:
    cut('<template id="art-', "</template>")
organiser = cut('<section class="band plan" id="organiser">', "</div></section>")

# 3. Carrousel : devient « Explorez en images »
cx = cx.replace('id="accueil"', 'id="images"').replace('aria-label="Nos destinations golf"', 'aria-label="Nos destinations en images"')
cx = re.sub(r'<h1 aria-label="[^"]*"><span aria-hidden="true">.*?</span></h1>',
            '<h2 class="cx-title">Explorez en images</h2>', cx, count=1, flags=re.S)
cx = cx.replace('<p class="cx-sub">Choisissez votre prochain parcours. Faites glisser les cartes, nous organisons le reste.</p>',
                '<p class="cx-sub">Faites glisser les cartes et laissez-vous inspirer. Chaque destination a sa page détaillée.</p>')

# 4. Nouvelles sections
regions = "".join(f'<button type="button" data-r="{k}" aria-pressed="false">{e(v)}</button>' for k, v in pages.REGIONS)
ticker = "".join(f"<span>{e(d['nom'])}</span>" for d in D) * 2
hero = (H.HERO.replace("%N%", str(len(D))).replace("%TITLE%", titre("Le golf sur mesure", gold_from=2))
        .replace("%REGIONS%", regions).replace("%TICKER%", ticker))
story = H.STORY.replace("%N%", str(len(D)))
cards = "".join(
    f'<a class="wc rv" href="{href}"><img src="{pages.photo(pid, 700)}" alt="" loading="lazy" onerror="this.remove()"><span class="gl"></span>'
    f'<span class="t"><b>{e(t)}</b><small>{e(x)}</small><em>Voir le guide →</em></span></a>' for t, x, href, pid in H.WHO)
qui = H.POURQUI.replace("%CARDS%", cards)
organiser = organiser.replace('<div class="title"><h2>Organisez votre séjour</h2>',
                              '<div class="title rv"><p class="eyebrow">Votre demande</p><h2>Organisez votre séjour</h2>')
rep("<main>\n", "<main>\n" + hero + "\n" + story + "\n" + cx + "\n" + qui + "\n" + organiser + "\n")

# 5. Ancien script (demande + carte 2D) remplacé par assets/birdy.js ; le carrousel garde le sien
a = s.index("<script>\n", s.index("</footer>"))
b = s.index("</script>", a) + len("</script>")
s = s[:a] + s[b:]
payload = json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
rep("</body>", '<script id="birdy-data" type="application/json">' + payload + "</script>\n"
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>\n'
    '<script src="assets/birdy.js"></script>\n</body>')

# 6. Styles
rep("</style>", H.CSS + "</style>")
open("voyages/index.html", "w", encoding="utf8").write(s)
print("Première page refaite :", len(s) // 1024, "Ko")
