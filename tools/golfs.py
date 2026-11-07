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
    return (f'<article class="gc"><div class="gc-h"><h3><a href="/parcours/golf/{g["s"]}.html">{e(g["n"])}</a></h3>{loin}</div>'
            f'<p class="gc-v">{e(g["v"])} ({e(g["d"])}) · {e(g["dn"])}</p><div class="gc-b">{badges}'
            f'{"<span class=gg>" + e(g["g"]) + "</span>" if g["g"] else ""}</div>'
            f'<div class="gc-cta"><a class="btn gold sm" href="/parcours/?golf={g["i"]}">Demander un départ</a>{lien}</div></article>')


EXTRA_CSS = '<link rel="stylesheet" href="/parcours/parcours.css">\n'


def page_app(golfs, maj):
    n18 = sum(1 for g in golfs if g["t18"])
    title = "Réserver un parcours de golf en France : 18 trous près de chez vous | Birdy Agent"
    desc = (f"Trouvez et réservez votre départ sur l’un des {len(golfs)} golfs de France, dont {n18} avec un parcours 18 trous. "
            "Recherche par ville et distance, demande de départ gratuite, confirmée par un conseiller.")
    extra = EXTRA_CSS + '<link rel="stylesheet" href="/parcours/clair.css">\n<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css">\n'
    extra += pages.ld({"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Accueil", "item": SITE},
        {"@type": "ListItem", "position": 2, "name": "Réserver un parcours", "item": SITE + "parcours/"}]})
    villes = "".join(f'<a href="/parcours/{pages.slug(v)}.html">Golf autour de {e(v)}</a>' for v, _ in VILLES_SEO)
    regs = sorted({g["r"] for g in golfs}, key=lambda r: (-sum(1 for g in golfs if g["r"] == r), r))
    regions = "".join(f'<a href="/parcours/region/{pages.slug(r)}.html">{e(r)}<small>{sum(1 for g in golfs if g["r"] == r)} golfs</small></a>' for r in regs)
    faq = [("Comment réserver un parcours de golf avec Birdy Agent ?",
            "Cherchez un golf par ville, département ou région, ou décrivez votre partie à Birdy. Choisissez le parcours, la date, "
            "le créneau et le nombre de joueurs, puis envoyez votre demande de départ. Un conseiller réserve auprès du golf et vous rappelle pour confirmer."),
           ("La réservation est-elle immédiate ?",
            "Pas encore : vous envoyez une demande de départ gratuite. Rien n’est réservé tant que le conseiller ne vous a pas confirmé "
            "l’horaire et le tarif auprès du golf. La réservation en temps réel arrivera avec nos futurs partenaires."),
           ("Combien coûte un green fee en France ?",
            "Le prix dépend du golf, du jour, de l’heure et de la saison. Indiquez votre budget maximum par joueur dans la demande : "
            "le conseiller vous confirme le tarif exact avant toute réservation. La demande est gratuite."),
           (f"Combien de golfs 18 trous y a-t-il en France ?",
            f"Notre annuaire, issu du recensement officiel des équipements sportifs, compte {len(golfs)} golfs, dont {n18} avec au moins un parcours 18 trous."),
           ("Peut-on réserver pour un groupe ?",
            "Oui, de 1 à 8 joueurs par demande de départ. Pour un séjour golf de groupe avec hôtel, utilisez notre pôle voyages Birdy Travel.")]
    extra += pages.ld({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": r}} for q, r in faq]})
    extra += pages.ld({"@context": "https://schema.org", "@type": "Service", "name": "Birdy Golf : demande de départ sur un parcours de golf en France",
                       "serviceType": "Réservation de départs de golf", "areaServed": "FR", "url": SITE + "parcours/",
                       "provider": {"@type": "TravelAgency", "name": "Birdy Agent", "url": SITE, "telephone": "+33616213447"},
                       "offers": {"@type": "Offer", "price": "0", "priceCurrency": "EUR", "description": "Demande de départ gratuite et sans engagement"}})
    chips = "".join(f'<button type="button" data-lieu="{e(l)}">{e(t)}</button>' for t, l in
                    [("Paris", "Paris"), ("Lyon", "Lyon"), ("Bordeaux", "Bordeaux"), ("Côte d’Azur", "Côte d’Azur")])
    out = pages.head(title, desc, "parcours/", SITE + "og.jpg", extra)
    out += f"""<main class="gp">
<section class="hero short gp-hero"><img class="gp-bg" src="/assets/img/green-coucher-soleil.webp" alt="" fetchpriority="high"><div class="veil"></div><div class="in gp-hin"><div class="gp-txt">
  <nav class="crumbs" aria-label="Fil d’Ariane"><a href="/">Accueil</a> › <span>Réserver un parcours</span></nav>
  <p class="tag">Birdy Golf · Réserver un parcours en France</p>
  <h1 class="gp-slogan">Du clic au <em>tee</em>, en un swing.</h1>
  <p class="lead">{n18} parcours 18 trous. Dites où et quand : Birdy s’occupe du départ.</p>
  <form class="gp-ask" id="gp-ask" autocomplete="off">
    <label class="sr" for="gp-q">Décrivez votre partie</label>
    <input id="gp-q" maxlength="400" placeholder="Ex. : samedi matin à 4, près de Bordeaux">
    <button class="btn gold" type="submit" aria-label="Demander à Birdy">Trouver</button>
  </form>
  <div class="gp-say" id="gp-say" hidden></div>
  <div class="gp-chips" id="gp-chips" role="group" aria-label="Recherches rapides"><button type="button" id="gp-moi">◎ Près de moi</button>{chips}</div>
</div>
  <div class="gp-viz" aria-hidden="true"><canvas class="gp-3d" id="gp-3d"></canvas><div class="gp-tip" id="gp-tip" hidden></div></div>
  <p class="gp-cap"><span class="gp-dot"></span>Touchez un golf sur la carte</p>
</div></section>

<section class="gp-steps" aria-label="Comment ça marche"><div class="in">
  <div class="gp-step"><i>1</i><b>Trouvez votre parcours</b><span>Par ville, département ou région, ou en décrivant votre partie à Birdy.</span></div>
  <div class="gp-step"><i>2</i><b>Envoyez votre demande</b><span>Date, créneau, nombre de joueurs, budget : gratuit et sans engagement.</span></div>
  <div class="gp-step"><i>3</i><b>Un conseiller confirme</b><span>Il réserve auprès du golf et vous rappelle avec l’horaire et le tarif.</span></div>
</div></section>

<section class="band gp-band"><img class="gp-bg2" src="/assets/img/golfeur-bunker.webp" alt="" loading="lazy"><img class="gp-bg3" src="/assets/img/parcours-vue-aerienne.webp" alt="" loading="lazy"><div class="in">
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
    <div><p class="gp-count" id="gp-count" aria-live="polite">Indiquez un lieu pour voir les parcours.</p><div class="gp-list gp-grid" id="gp-list"></div>
      <button class="btn ghost gp-plus" id="gp-plus" type="button" hidden>Voir plus de parcours</button></div>
    <div class="gp-map" id="gp-map" aria-label="Carte des parcours"></div>
  </div>
  <p class="gp-src">Liste des parcours : {e(SOURCE_TXT)}, mise à jour le {maj}. Un golf manque ou une information est fausse ? Appelez le {TEL}.</p>
</div></section>

<section class="band"><div class="in">
  <h2>Questions fréquentes</h2>
  <div class="faq">{"".join(f"<details><summary>{e(a)}</summary><p>{e(b)}</p></details>" for a, b in faq)}</div>
  <p class="more"><a href="/golf/">Envie d’un séjour golf à l’étranger ? Découvrez Birdy Travel et nos 55 destinations</a></p>
</div></section>

<section class="band tint"><div class="in"><h2>Golfs autour des grandes villes</h2><div class="others plain">{villes}</div>
<h2 class="mt">Golfs par région</h2><div class="others">{regions}</div></div></section>
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
<script defer src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script defer src="/assets/parcours.js"></script>
<script defer src="/assets/france3d.js"></script>
"""
    out = out.replace('<html lang="fr">', '<html lang="fr" class="clair">', 1)  # thème clair (parcours/clair.css)
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


def ariane(liens):
    """liens : [(nom, chemin)] ; le dernier n'a pas de lien."""
    html_ = " › ".join(f'<a href="/{c}">{e(n)}</a>' for n, c in liens[:-1]) + f" › <span>{e(liens[-1][0])}</span>"
    ld = pages.ld({"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "name": n, "item": SITE + c} for i, (n, c) in enumerate(liens)]})
    return html_, ld


def chemin_dep(g):
    return f"parcours/departement/{pages.slug(g['dn'])}.html"


def chemin_reg(r):
    return f"parcours/region/{pages.slug(r)}.html"


def page_golf(g, golfs, villes, maj):
    path = f"parcours/golf/{g['s']}.html"
    tr = trous(g)
    trtxt = " et ".join(tr) if tr else "parcours"
    proches = sorted(((km(g["la"], g["lo"], x["la"], x["lo"]), x) for x in golfs if x is not g), key=lambda t: t[0])[:6]
    grandes = [v for v in villes if v[4] >= 40000 and v[0] != g["v"]]
    vd, vv = min(((km(g["la"], g["lo"], v[1], v[2]), v) for v in grandes), key=lambda t: t[0])
    situ = f"à {max(vd, 1):.0f} km de {vv[0]}"
    title = f"{g['n']} ({g['v']}) : réserver un départ | Birdy Agent"
    if len(title) > 65:
        title = f"{g['n']} ({g['v']}) : réserver un départ"
    if len(title) > 65:
        title = f"{g['n']} : réserver un départ"
    desc = (f"{g['n']}, golf {('de ' + trtxt) if tr else ''} à {g['v']} ({g['d']}), {situ}. Adresse, itinéraire, golfs à proximité. "
            "Demande de départ gratuite, confirmée par un conseiller Birdy Agent.").replace("  ", " ")
    fil, ld_fil = ariane([("Accueil", ""), ("Réserver un parcours", "parcours/"), (g["r"], chemin_reg(g["r"])),
                          (f"{g['dn']} ({g['d']})", chemin_dep(g)), (g["n"], path)])
    faq = [(f"Comment réserver un départ au {g['n']} ?",
            "Indiquez la date, le créneau et le nombre de joueurs dans votre demande de départ. Un conseiller Birdy Agent réserve "
            f"auprès du golf et vous rappelle pour confirmer l’horaire. Vous pouvez aussi appeler le {TEL}."),
           (f"Combien coûte un green fee au {g['n']} ?",
            "Le tarif dépend du jour, de l’heure et de la saison. Indiquez votre budget dans la demande : le conseiller vous confirme "
            "le prix exact avant toute réservation."),
           (f"Combien de trous compte le {g['n']} ?",
            f"D’après le recensement officiel des équipements sportifs, le {g['n']} propose : {trtxt}.")]
    gc = {"@context": "https://schema.org", "@type": "GolfCourse", "name": g["n"], "url": SITE + path,
          "address": {"@type": "PostalAddress", "streetAddress": g["a"], "postalCode": g["cp"], "addressLocality": g["v"],
                      "addressRegion": g["r"], "addressCountry": "FR"},
          "geo": {"@type": "GeoCoordinates", "latitude": g["la"], "longitude": g["lo"]}}
    if g["u"]:
        gc["sameAs"] = g["u"]
    extra = EXTRA_CSS + ld_fil + pages.ld(gc) + pages.ld({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": r}} for q, r in faq]})
    itin = f"https://www.google.com/maps/dir/?api=1&destination={g['la']},{g['lo']}"
    infos = [("Adresse", ", ".join(x for x in [g["a"], f"{g['cp']} {g['v']}".strip()] if x)), ("Parcours", trtxt),
             ("Type", g["g"] or "Golf"), ("Situation", f"{g['v']}, {situ}, {g['dn']} ({g['d']}), {g['r']}")]
    lignes = "".join(f"<dt>{e(a)}</dt><dd>{e(b)}</dd>" for a, b in infos if b)
    site = f'<a class="btn ghost sm" href="{e(g["u"])}" target="_blank" rel="noopener nofollow">Site du golf</a>' if g["u"] else ""
    voisins = "".join(fiche(x, d) for d, x in proches)
    out = pages.head(title, desc, path, SITE + "og.jpg", extra)
    out += f"""<main class="gp">
<section class="hero short gp-hero"><div class="veil"></div><div class="in">
  <nav class="crumbs" aria-label="Fil d’Ariane">{fil}</nav>
  <p class="tag">Golf · {e(g['v'])} ({e(g['d'])})</p>
  <h1>{e(g['n'])}</h1>
  <p class="lead">{e(trtxt[0].upper() + trtxt[1:])} à {e(g['v'])}, {e(situ)}. Envoyez votre demande de départ : un conseiller réserve auprès du golf et vous confirme l’horaire et le prix.</p>
  <div class="cta"><a class="btn gold" href="/parcours/?golf={g['i']}">Demander un départ</a></div>
</div></section>
<section class="band"><div class="in grid">
  <div class="txt">
    <h2>Informations pratiques</h2>
    <dl class="gi">{lignes}</dl>
    <div class="gc-cta"><a class="btn ghost sm" href="{itin}" target="_blank" rel="noopener nofollow">Itinéraire</a>{site}</div>
    <p class="gp-src">Source : {e(SOURCE_TXT)}, mise à jour le {maj}. Une information est fausse ? Appelez le {TEL}.</p>
  </div>
  <aside class="box">
    <h2>Jouer ici</h2>
    <p>Demande de départ gratuite et sans engagement. Rien n’est réservé avant la confirmation du conseiller.</p>
    <a class="btn gold" href="/parcours/?golf={g['i']}">Demander un départ</a>
    <p class="call">Ou appelez-nous<br><b>{TEL}</b></p>
  </aside>
</div></section>
<section class="band tint"><div class="in">
  <h2>Questions fréquentes</h2>
  <div class="faq">{"".join(f"<details><summary>{e(a)}</summary><p>{e(b)}</p></details>" for a, b in faq)}</div>
</div></section>
<section class="band"><div class="in">
  <h2>Golfs à proximité</h2>
  <div class="gp-list static">{voisins}</div>
  <p class="more"><a href="/{chemin_dep(g)}">Tous les golfs : {e(g['dn'])} ({e(g['d'])})</a></p>
</div></section>
</main>
"""
    return path, out + pages.foot()


def page_zone(titre_zone, path, liste, fil_liens, sous, maj, intro_lieu):
    n18 = sum(1 for g in liste if g["t18"])
    title = f"Golf {titre_zone} : {len(liste)} golfs, {n18} parcours 18 trous | Birdy Agent"
    desc = (f"Les {len(liste)} golfs {intro_lieu}, dont {n18} avec un parcours 18 trous : adresse, nombre de trous, site web. "
            "Demande de départ gratuite, confirmée par un conseiller Birdy Agent.")
    fil, ld_fil = ariane(fil_liens)
    liste = sorted(liste, key=lambda g: (-min(g["t18"], 1), g["n"]))
    extra = EXTRA_CSS + ld_fil + pages.ld({"@context": "https://schema.org", "@type": "ItemList", "name": f"Golfs {intro_lieu}",
        "itemListElement": [{"@type": "ListItem", "position": i + 1, "url": SITE + f"parcours/golf/{g['s']}.html", "name": g["n"]}
                            for i, g in enumerate(liste)]})
    sous_html = f'<h2>Par département</h2><div class="others">{sous}</div>' if sous else ""
    faq = [(f"Combien y a-t-il de golfs {intro_lieu} ?",
            f"Nous recensons {len(liste)} golfs {intro_lieu}, dont {n18} avec au moins un parcours 18 trous (source : {SOURCE_TXT})."),
           (f"Comment réserver un départ sur un golf {intro_lieu} ?",
            "Choisissez un golf dans la liste, puis indiquez la date, le créneau et le nombre de joueurs. Un conseiller Birdy Agent "
            f"réserve auprès du golf et vous rappelle pour confirmer l’horaire et le tarif. Vous pouvez aussi appeler le {TEL}."),
           ("La demande de départ est-elle payante ?", "Non, la demande est gratuite et sans engagement. Rien n’est réservé avant la confirmation du conseiller.")]
    extra += pages.ld({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": r}} for q, r in faq]})
    faq_html = "".join(f"<details><summary>{e(a)}</summary><p>{e(b)}</p></details>" for a, b in faq)
    out = pages.head(title, desc, path, SITE + "og.jpg", extra)
    out += f"""<main class="gp">
<section class="hero short gp-hero"><div class="veil"></div><div class="in">
  <nav class="crumbs" aria-label="Fil d’Ariane">{fil}</nav>
  <p class="tag">Birdy Golf</p>
  <h1>Golf · {e(titre_zone)}</h1>
  <p class="lead">{len(liste)} golfs {e(intro_lieu)}, dont {n18} avec un parcours 18 trous. Choisissez votre parcours : un conseiller réserve votre départ.</p>
</div></section>
<section class="band"><div class="in">
  {sous_html}
  <h2 class="mt">Tous les golfs</h2>
  <div class="gp-list static">{"".join(fiche(g) for g in liste)}</div>
  <p class="gp-src">Source : {e(SOURCE_TXT)}, mise à jour le {maj}.</p>
</div></section>
<section class="band tint"><div class="in"><h2>Questions fréquentes</h2><div class="faq">{faq_html}</div></div></section>
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
    for d in ("parcours/golf", "parcours/departement", "parcours/region"):
        os.makedirs(d, exist_ok=True)
    for g in golfs:
        p, h = page_golf(g, golfs, villes, maj)
        open(p, "w", encoding="utf8").write(h)
    deps = {}
    for g in golfs:
        deps.setdefault(g["d"], []).append(g)
    for code, liste in deps.items():
        g0 = liste[0]
        p, h = page_zone(f"{g0['dn']} ({code})", chemin_dep(g0), liste,
                         [("Accueil", ""), ("Réserver un parcours", "parcours/"), (g0["r"], chemin_reg(g0["r"])), (f"{g0['dn']} ({code})", chemin_dep(g0))],
                         "", maj, f"du département {g0['dn']} ({code})")
        open(p, "w", encoding="utf8").write(h)
    for r in sorted({g["r"] for g in golfs}):
        liste = [g for g in golfs if g["r"] == r]
        ds = sorted({(g["dn"], g["d"]) for g in liste})
        sous = "".join(f'<a href="/{chemin_dep({"dn": dn})}">{e(dn)} ({e(c)})<small>{len(deps[c])} golfs</small></a>' for dn, c in ds) if len(ds) > 1 else ""
        p, h = page_zone(r, chemin_reg(r), liste, [("Accueil", ""), ("Réserver un parcours", "parcours/"), (r, chemin_reg(r))], sous, maj, f"de la région {r}")
        open(p, "w", encoding="utf8").write(h)
    print(len(golfs), "pages golf ;", len(deps), "départements ;")
    print(len(golfs), "golfs ;", sum(1 for g in golfs if g["t18"]), "avec un 18 trous ;", len(VILLES_SEO), "pages ville")
