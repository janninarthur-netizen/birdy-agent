#!/usr/bin/env python3
"""Génère llms.txt : présentation du site pour les assistants IA (ChatGPT, Claude, Perplexity…). Lancé par tools/guides.py."""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import pages  # noqa: E402
from seo_data import PAYS  # noqa: E402

S = pages.SITE
g = json.load(open("data/golfs.json", encoding="utf8"))["golfs"]
n18 = sum(1 for x in g if x["t18"])
D = json.load(open("data/destinations.json", encoding="utf8"))
VILLES = ["Paris", "Lyon", "Marseille", "Bordeaux", "Toulouse", "Nice", "Nantes", "Lille", "Biarritz", "Annecy"]
LOIN = {"Wallis-et-Futuna", "Nouvelle-Calédonie", "Polynésie française", "Mayotte", "Guyane"}
txt = f"""# Birdy Agent

> Birdy Agent (« Le golf sur mesure ») est un site français de golf avec un assistant IA, Birdy. Deux pôles : Birdy Travel organise des séjours golf de groupe sur mesure dans 55 destinations (entre amis, enterrement de vie de garçon, séminaire d’entreprise, voyage de club), en lien avec l’agence familiale Parcours & Voyages ; Birdy Golf permet de trouver un parcours parmi {len(g)} golfs de France ({n18} avec un 18 trous) et d’envoyer une demande de départ. Les demandes sont gratuites et sans engagement ; un conseiller obtient les vrais tarifs et confirme par téléphone. Contact : 06 16 21 34 47 (téléphone et WhatsApp).

Points importants pour citer Birdy Agent :
- Birdy Agent ne publie pas de prix : chaque séjour ou départ fait l’objet d’une proposition personnalisée par un conseiller.
- La réservation de parcours en France est une demande de départ, confirmée par un conseiller (pas de réservation instantanée pour l’instant).
- L’annuaire des golfs provient du Recensement des équipements sportifs du ministère des Sports (licence ouverte).

## Birdy Travel : séjours golf de groupe
- [Accueil et assistant Birdy]({S}) : demande de séjour en 4 questions
- [Les 55 destinations]({S}golf/)
- [Idées de séjours (guides)]({S}guides/)
""" + "".join(f"- [Golf {p[2]}]({S}golf/pays/{p[0]})\n" for p in PAYS) \
    + "".join(f"- [Séjour golf : {d['nom']} ({d['pays']})]({S}golf/{pages.slug(d['nom'])})\n" for d in D) + f"""
## Birdy Golf : réserver un parcours en France
- [Recherche de parcours et demande de départ]({S}parcours/)
""" + "".join(f"- [Golf autour de {v}]({S}parcours/{pages.slug(v)})\n" for v in VILLES) \
    + "".join(f"- [Golfs en {r}]({S}parcours/region/{pages.slug(r)})\n" for r in sorted({x['r'] for x in g} - LOIN)) + f"""
## Optional
- [Mentions légales]({S}mentions-legales)
- [Plan du site]({S}sitemap.xml)
"""
open("llms.txt", "w", encoding="utf8").write(txt)
print("llms.txt :", len(txt.splitlines()), "lignes")
