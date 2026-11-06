#!/usr/bin/env python3
"""Pôle Birdy Golf : annuaire des parcours de France et pages /parcours/.

Source : Recensement des équipements sportifs (Data ES), ministère des Sports, licence ouverte.
    python3 tools/golfs.py          # reconstruit les données et les pages depuis data/sources/
    python3 tools/golfs.py --maj    # télécharge d'abord la dernière version de la source

Produit :
    data/golfs.json        annuaire compact utilisé par le site, Birdy et /api/depart
    data/villes.json       villes de France (≥ 8 000 habitants) pour la recherche par lieu
    parcours/index.html    recherche, carte et demande de départ
    parcours/<ville>.html  pages « golf autour de … » pour Google
"""
import html
import json
import math
import os
import re
import subprocess
import sys
import time
import urllib.parse
from datetime import date

sys.path.insert(0, os.path.dirname(__file__))
import pages  # noqa: E402

SITE, TEL = pages.SITE, pages.TEL
e = html.escape
SRC = "data/sources/data-es-golfs.json"
SOURCE_TXT = "Recensement des équipements sportifs (ministère des Sports), licence ouverte"
GESTION = {"Etablissement privé commercial": "Golf privé", "Association(s)": "Golf associatif", "Commune": "Golf public",
           "EPCI": "Golf public", "Etablissement Public": "Golf public", "Privé non commercial": "Golf privé"}
PETITS = {"de", "du", "des", "la", "le", "les", "et", "en", "sur", "aux", "au", "a", "à", "l", "d"}
SIGLES = {"UGOLF", "UCPA", "BLUEGREEN", "PGA", "EPCI", "SNCF", "ASPTT"}

# Pages « golf autour de … » : ville, rayon (km)
VILLES_SEO = [("Paris", 30), ("Lyon", 40), ("Marseille", 40), ("Bordeaux", 40), ("Toulouse", 40), ("Nice", 40), ("Nantes", 40),
              ("Lille", 40), ("Strasbourg", 40), ("Montpellier", 40), ("Rennes", 40), ("Grenoble", 40), ("Aix-en-Provence", 30),
              ("Annecy", 40), ("Biarritz", 30), ("Tours", 40), ("Dijon", 40), ("Reims", 40), ("Rouen", 40), ("Deauville", 40),
              ("Cannes", 30), ("Avignon", 40), ("La Rochelle", 50), ("Clermont-Ferrand", 40), ("Le Touquet-Paris-Plage", 40)]


def maj_source():
    """Télécharge les parcours 18 et 9 trous (codes 1202 et 1204), page par page."""
    champs = ("equip_numero,inst_numero,inst_nom,equip_nom,equip_type_code,equip_type_name,inst_adresse,inst_cp,new_name,"
              "new_code,dep_code,dep_nom,reg_nom,equip_x,equip_y,equip_url,equip_prop_type,equip_gest_type,equip_saison,"
              "inst_hs_bool,equip_maj_date")
    base = "https://equipements.sports.gouv.fr/api/explore/v2.1/catalog/datasets/data-es/records?"
    out, total = [], None
    while total is None or len(out) < total:
        q = urllib.parse.urlencode({"where": 'equip_type_code in ("1202","1204")', "select": champs, "limit": 100,
                                    "offset": len(out), "order_by": "equip_numero"})
        for _ in range(20):
            r = subprocess.run(["curl", "-s", "-m", "40", base + q], capture_output=True, text=True)
            try:
                d = json.loads(r.stdout)
                break
            except ValueError:
                time.sleep(5)
        else:
            sys.exit("Téléchargement interrompu")
        total = d["total_count"]
        out += d["results"]
    json.dump(out, open(SRC, "w", encoding="utf8"), ensure_ascii=False)
    print(len(out), "équipements téléchargés")


def joli(nom):
    """« GOLF DE LA COMMANDERIE » -> « Golf de la Commanderie » ; garde les noms déjà bien écrits."""
    nom = re.sub(r"\s+", " ", (nom or "").strip())
    if not nom:
        return nom
    lettres = [c for c in nom if c.isalpha()]
    if lettres and sum(c.isupper() for c in lettres) / len(lettres) < 0.7:
        return nom[0].upper() + nom[1:]
    mots = re.split(r"(\s+|-|'|’)", nom.lower())
    res = []
    for i, m in enumerate(mots):
        if not m or not m.strip() or m in "-'’":
            res.append(m)
        elif m.upper() in SIGLES:
            res.append(m.upper())
        elif i > 0 and m in PETITS:
            res.append(m)
        else:
            res.append(m[0].upper() + m[1:])
    return "".join(res)


def km(a, b, c, d):
    r = math.radians
    x = math.sin(r(c - a) / 2) ** 2 + math.cos(r(a)) * math.cos(r(c)) * math.sin(r(d - b) / 2) ** 2
    return 6371 * 2 * math.asin(math.sqrt(x))


def construire():
    brut = json.load(open(SRC, encoding="utf8"))
    par_inst = {}
    for x in brut:
        if x.get("inst_hs_bool") == "Oui" or not x.get("equip_x"):
            continue
        g = par_inst.setdefault(x["inst_numero"], {"x": x, "t18": 0, "t9": 0, "url": None, "maj": ""})
        g["t18" if x["equip_type_code"] == "1202" else "t9"] += 1
        g["url"] = g["url"] or x.get("equip_url")
        g["maj"] = max(g["maj"], x.get("equip_maj_date") or "")
    golfs, vus = [], {}
    for num, g in par_inst.items():
        x = g["x"]
        nom = joli(x["inst_nom"]) or joli(x["equip_nom"])
        s = pages.slug(nom + " " + x["new_name"])
        if s in vus:
            s += "-" + num[-4:]
        vus[s] = 1
        url = (g["url"] or "").strip()
        if url and not url.startswith("http"):
            url = "https://" + url
        golfs.append({
            "i": num, "s": s, "n": nom, "v": x["new_name"], "cp": x.get("inst_cp") or "", "d": x["dep_code"].zfill(2),
            "dn": x["dep_nom"], "r": x["reg_nom"], "la": round(float(x["equip_y"]), 5), "lo": round(float(x["equip_x"]), 5),
            "t18": g["t18"], "t9": g["t9"], "u": url or None, "a": joli(x.get("inst_adresse") or ""),
            "g": GESTION.get(x.get("equip_gest_type"), "")})
    golfs.sort(key=lambda g: (g["r"], g["n"]))
    jour = date.today().isoformat()
    json.dump({"maj": jour, "source": SOURCE_TXT, "golfs": golfs}, open("data/golfs.json", "w", encoding="utf8"),
              ensure_ascii=False, separators=(",", ":"))
    villes = json.load(open("data/sources/villes.json", encoding="utf8"))
    json.dump(villes, open("data/villes.json", "w", encoding="utf8"), ensure_ascii=False, separators=(",", ":"))
    return golfs, villes


def trous(g):
    out = []
    if g["t18"]:
        out.append(("18 trous" if g["t18"] == 1 else f"{g['t18']} × 18 trous"))
    if g["t9"]:
        out.append(("9 trous" if g["t9"] == 1 else f"{g['t9']} × 9 trous"))
    return out


def fiche(g, dist=None):
    badges = "".join(f'<span class="gb">{e(t)}</span>' for t in trous(g))
    lien = (f'<a class="btn ghost sm" href="{e(g["u"])}" target="_blank" rel="noopener nofollow">Site du golf</a>' if g["u"] else "")
    loin = f'<span class="gd">{dist:.0f} km</span>' if dist is not None else ""
    return (f'<article class="gc"><div class="gc-h"><h3>{e(g["n"])}</h3>{loin}</div>'
            f'<p class="gc-v">{e(g["v"])} ({e(g["d"])}) · {e(g["dn"])}</p><div class="gc-b">{badges}'
            f'{"<span class=gg>" + e(g["g"]) + "</span>" if g["g"] else ""}</div>'
            f'<div class="gc-cta"><a class="btn gold sm" href="/parcours/?golf={g["i"]}">Demander un départ</a>{lien}</div></article>')


EXTRA_CSS = '<link rel="stylesheet" href="/parcours/parcours.css">\n'


def page_app(golfs, maj):
    n18 = sum(1 for g in golfs if g["t18"])
    title = "Réserver un parcours de golf en France : 18 trous près de chez vous | Birdy Agent"
    desc = (f"Trouvez et réservez votre départ sur l’un des {len(golfs)} golfs de France, dont {n18} avec un parcours 18 trous. "
            "Recherche par ville et distance, demande de départ gratuite, confirmée par un conseiller.")
    extra = EXTRA_CSS + '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css">\n'
    extra += pages.ld({"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Accueil", "item": SITE},
        {"@type": "ListItem", "position": 2, "name": "Réserver un parcours", "item": SITE + "parcours/"}]})
    villes = "".join(f'<a href="/parcours/{pages.slug(v)}.html">Golf autour de {e(v)}</a>' for v, _ in VILLES_SEO)
    out = pages.head(title, desc, "parcours/", SITE + "og.jpg", extra)
    out += f"""<main class="gp">
<section class="hero short gp-hero"><div class="veil"></div><div class="in">
  <nav class="crumbs" aria-label="Fil d’Ariane"><a href="/">Accueil</a> › <span>Réserver un parcours</span></nav>
  <p class="tag">Birdy Golf · Nouveau</p>
  <h1>Réservez votre départ sur un parcours en France</h1>
  <p class="lead">{len(golfs)} golfs, dont {n18} avec un parcours 18 trous. Dites à Birdy ce que vous cherchez, il trouve les parcours et transmet votre demande.</p>
  <form class="gp-ask" id="gp-ask" autocomplete="off">
    <label class="sr" for="gp-q">Décrivez votre partie</label>
    <input id="gp-q" maxlength="400" placeholder="Ex. : 4 joueurs samedi matin, un 18 trous autour de Bordeaux">
    <button class="btn gold" type="submit">Demander à Birdy</button>
  </form>
  <div class="gp-say" id="gp-say" hidden></div>
</div></section>

<section class="band gp-band"><div class="in">
  <form class="gp-f" id="gp-f" autocomplete="off">
    <label>Où ?<input name="lieu" id="f-lieu" placeholder="Ville, département ou région" list="f-villes"></label>
    <datalist id="f-villes"></datalist>
    <label>Rayon<select name="rayon"><option value="15">15 km</option><option value="30" selected>30 km</option><option value="50">50 km</option><option value="100">100 km</option></select></label>
    <label>Parcours<select name="trous"><option value="18" selected>18 trous</option><option value="9">9 trous</option><option value="0">Tous</option></select></label>
    <label>Date<input type="date" name="date"></label>
    <label>Créneau<select name="creneau"><option value="">Indifférent</option><option>Matin</option><option>Midi</option><option>Après-midi</option></select></label>
    <label>Joueurs<select name="joueurs"><option>1</option><option selected>2</option><option>3</option><option>4</option><option>5</option><option>6</option><option>7</option><option>8</option></select></label>
    <button class="btn gold" type="submit">Rechercher</button>
  </form>
  <p class="gp-info">Les tarifs et créneaux en temps réel arrivent bientôt. Aujourd’hui, vous envoyez une <b>demande de départ</b> gratuite : un conseiller réserve auprès du golf et vous confirme l’horaire et le prix.</p>
  <div class="gp-res">
    <div><p class="gp-count" id="gp-count" aria-live="polite">Indiquez un lieu pour voir les parcours.</p><div class="gp-list" id="gp-list"></div></div>
    <div class="gp-map" id="gp-map" aria-label="Carte des parcours"></div>
  </div>
  <p class="gp-src">Liste des parcours : {e(SOURCE_TXT)}, mise à jour le {maj}. Un golf manque ou une information est fausse ? Appelez le {TEL}.</p>
</div></section>

<section class="band tint"><div class="in"><h2>Golfs autour des grandes villes</h2><div class="others plain">{villes}</div></div></section>
</main>

<dialog class="gp-dlg" id="gp-dlg">
  <form method="dialog" class="gp-x"><button aria-label="Fermer">×</button></form>
  <p class="tag">Demande de départ</p>
  <h2 id="d-nom"></h2><p class="gc-v" id="d-lieu"></p>
  <div class="gp-slots" id="d-slots" hidden></div>
  <form id="gp-dep" class="gp-dep">
    <input type="hidden" name="golf">
    <div class="gp-row"><label>Date<input type="date" name="date" required></label>
      <label>Créneau<select name="creneau"><option value="">Indifférent</option><option>Matin</option><option>Midi</option><option>Après-midi</option></select></label>
      <label>Joueurs<select name="joueurs"><option>1</option><option selected>2</option><option>3</option><option>4</option><option>5</option><option>6</option><option>7</option><option>8</option></select></label></div>
    <div class="gp-row"><label>Green fee max. / joueur (facultatif)<input name="budget" inputmode="numeric" maxlength="6" placeholder="ex. 80 €"></label>
      <label>Niveau ou index (facultatif)<input name="niveau" maxlength="40" placeholder="ex. index 24"></label></div>
    <div class="gp-row"><label>Prénom<input name="prenom" required maxlength="60" autocomplete="given-name"></label>
      <label>Téléphone<input name="tel" required maxlength="20" inputmode="tel" autocomplete="tel"></label></div>
    <label>E-mail (facultatif)<input name="email" type="email" maxlength="120" autocomplete="email"></label>
    <label>Un détail ? (facultatif)<input name="note" maxlength="300" placeholder="Voiturette, location de clubs, carte verte…"></label>
    <input class="hp" name="site" tabindex="-1" autocomplete="off" aria-hidden="true">
    <label class="gp-ok"><input type="checkbox" name="accord" value="oui" required> J’accepte d’être recontacté au sujet de ma demande (<a href="/mentions-legales">données personnelles</a>).</label>
    <button class="btn gold" type="submit">Envoyer ma demande</button>
    <p class="gp-msg" id="d-msg" aria-live="polite"></p>
  </form>
  <div class="gp-merci" id="d-merci" hidden><h3>Demande envoyée</h3><p>Un conseiller contacte le golf et vous rappelle pour confirmer l’horaire et le tarif. Rien n’est réservé tant qu’il ne vous l’a pas confirmé.</p></div>
</dialog>
<script defer src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
<script defer src="/assets/parcours.js"></script>
"""
    return "parcours/index.html", out + pages.foot()


def page_ville(nom, rayon, golfs, villes, maj):
    v = next(x for x in villes if x[0] == nom)
    proches = sorted(((km(v[1], v[2], g["la"], g["lo"]), g) for g in golfs), key=lambda t: t[0])
    proches = [(d, g) for d, g in proches if d <= rayon]
    n18 = sum(1 for _, g in proches if g["t18"])
    s = pages.slug(nom)
    path = f"parcours/{s}.html"
    title = f"Golf autour de {nom} : {n18} parcours 18 trous à moins de {rayon} km | Birdy Agent"
    desc = (f"Les {len(proches)} golfs à moins de {rayon} km de {nom}, dont {n18} avec un parcours 18 trous : distance, adresse, "
            "site web. Demande de départ gratuite, confirmée par un conseiller Birdy Agent.")
    faq = [(f"Combien y a-t-il de golfs 18 trous autour de {nom} ?",
            f"Nous recensons {n18} golfs avec au moins un parcours 18 trous à moins de {rayon} km de {nom}, "
            f"et {len(proches)} golfs en comptant les parcours 9 trous (source : {SOURCE_TXT})."),
           ("Combien coûte un green fee ?",
            "Le prix dépend du golf, du jour, de l’heure et de la saison. Indiquez votre budget dans votre demande : "
            "le conseiller vous confirme le tarif exact avant toute réservation."),
           ("Comment réserver un départ ?",
            f"Choisissez un golf, la date, le créneau et le nombre de joueurs, puis envoyez votre demande. Un conseiller réserve "
            f"auprès du golf et vous rappelle pour confirmer. Vous pouvez aussi appeler le {TEL}.")]
    extra = EXTRA_CSS + pages.ld({"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Accueil", "item": SITE},
        {"@type": "ListItem", "position": 2, "name": "Réserver un parcours", "item": SITE + "parcours/"},
        {"@type": "ListItem", "position": 3, "name": f"Golf autour de {nom}", "item": SITE + path}]})
    extra += pages.ld({"@context": "https://schema.org", "@type": "ItemList", "name": f"Golfs autour de {nom}",
                       "itemListElement": [{"@type": "ListItem", "position": i + 1, "item": {
                           "@type": "GolfCourse", "name": g["n"],
                           "address": {"@type": "PostalAddress", "streetAddress": g["a"], "postalCode": g["cp"],
                                       "addressLocality": g["v"], "addressCountry": "FR"},
                           "geo": {"@type": "GeoCoordinates", "latitude": g["la"], "longitude": g["lo"]},
                           **({"url": g["u"]} if g["u"] else {})}} for i, (_, g) in enumerate(proches[:30])]})
    extra += pages.ld({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": r}} for q, r in faq]})
    cartes = "".join(fiche(g, d) for d, g in proches)
    autres = "".join(f'<a href="/parcours/{pages.slug(x)}.html">Golf autour de {e(x)}</a>' for x, _ in VILLES_SEO if x != nom)
    q = urllib.parse.urlencode({"lieu": nom, "rayon": rayon})
    out = pages.head(title, desc, path, SITE + "og.jpg", extra)
    out += f"""<main class="gp">
<section class="hero short gp-hero"><div class="veil"></div><div class="in">
  <nav class="crumbs" aria-label="Fil d’Ariane"><a href="/">Accueil</a> › <a href="/parcours/">Réserver un parcours</a> › <span>{e(nom)}</span></nav>
  <p class="tag">Birdy Golf</p>
  <h1>Golf autour de {e(nom)}</h1>
  <p class="lead">{len(proches)} golfs à moins de {rayon} km de {e(nom)}, dont {n18} avec un parcours 18 trous. Choisissez votre parcours : un conseiller réserve votre départ.</p>
  <div class="cta"><a class="btn gold" href="/parcours/?{q}">Voir sur la carte et réserver</a></div>
</div></section>
<section class="band"><div class="in">
  <p class="gp-info">Pas encore de réservation instantanée : vous envoyez une <b>demande de départ</b> gratuite, un conseiller réserve auprès du golf et vous confirme l’horaire et le prix.</p>
  <div class="gp-list static">{cartes}</div>
  <p class="gp-src">Source : {e(SOURCE_TXT)}, mise à jour le {maj}.</p>
</div></section>
<section class="band tint"><div class="in">
  <h2>Questions fréquentes</h2>
  <div class="faq">{"".join(f"<details><summary>{e(a)}</summary><p>{e(b)}</p></details>" for a, b in faq)}</div>
</div></section>
<section class="band"><div class="in"><h2>Golfs autour d’autres villes</h2><div class="others plain">{autres}</div>
<p class="more"><a href="/golf/">Envie de partir à l’étranger ? Nos 55 destinations de voyages golf</a></p></div></section>
</main>
"""
    return path, out + pages.foot()


if __name__ == "__main__":
    if "--maj" in sys.argv:
        maj_source()
    golfs, villes = construire()
    maj = date.today().strftime("%d/%m/%Y")
    os.makedirs("parcours", exist_ok=True)
    p, h = page_app(golfs, maj)
    open(p, "w", encoding="utf8").write(h)
    for nom, rayon in VILLES_SEO:
        p, h = page_ville(nom, rayon, golfs, villes, maj)
        open(p, "w", encoding="utf8").write(h)
    print(len(golfs), "golfs ;", sum(1 for g in golfs if g["t18"]), "avec un 18 trous ;", len(VILLES_SEO), "pages ville")
