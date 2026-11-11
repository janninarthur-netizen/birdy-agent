#!/usr/bin/env python3
"""Adresses propres pour Cloudflare Pages : /golf/algarve au lieu de /golf/algarve.html.

Cloudflare redirige (308) chaque adresse en .html vers sa version sans extension.
Ce script réécrit les liens internes, les adresses canoniques, les données Google
et le sitemap pour pointer directement vers la bonne adresse. Lancé par tools/guides.py.
"""
import glob
import re
from datetime import date

SITE = "https://birdy-agent.pages.dev/"


def propre(t):
    # https://birdy-agent.pages.dev/x/index.html -> /x/ ; /x/y.html -> /x/y
    t = re.sub(r'(https://birdy-agent\.pages\.dev/(?:[\w-]+/)*)index\.html', r'\1', t)
    t = re.sub(r'(https://birdy-agent\.pages\.dev/[\w/-]+)\.html', r'\1', t)
    # liens internes
    t = re.sub(r'href="(/?(?:golf|guides|parcours|voyages|cours|debuter)/)index\.html', r'href="/\1', t.replace('href="golf/', 'href="/golf/'))
    t = re.sub(r'href="(/(?:golf|guides|parcours)/[\w/-]+)\.html', r'href="\1', t)
    t = re.sub(r'href="/?mentions-legales\.html"', 'href="/mentions-legales"', t)
    t = t.replace('href="//', 'href="/')
    return t


_H = {}


def version(t):
    """Ajoute ?v=<empreinte> à chaque script et feuille de style du site.
    Les navigateurs gardent ces fichiers en mémoire : avec l'empreinte, toute modification change l'adresse et la nouvelle version est chargée."""
    import hashlib
    import os

    def rep(m):
        f = m.group(2).lstrip("/")
        if not os.path.exists(f):
            return m.group(0)
        if f not in _H:
            _H[f] = hashlib.md5(open(f, "rb").read()).hexdigest()[:8]
        return f'{m.group(1)}="{m.group(2)}?v={_H[f]}"'
    return re.sub(r'(src|href)="(/(?:assets|parcours|cours|debuter|golf)/[\w./-]+\.(?:js|css))(?:\?v=\w+)?"', rep, t)


if __name__ == "__main__":
    for f in ["index.html", "voyages/index.html", "404.html", "mentions-legales.html", "suivi/index.html"] + glob.glob("golf/*.html") + glob.glob("golf/pays/*.html") + glob.glob("guides/*.html") + glob.glob("parcours/**/*.html", recursive=True) + ["a-propos/index.html", "cours/index.html", "debuter/index.html"]:
        try:
            s = open(f, encoding="utf8").read()
        except FileNotFoundError:
            continue
        n = version(propre(s))
        if n != s:
            open(f, "w", encoding="utf8").write(n)
    sm = open("sitemap.xml", encoding="utf8").read()
    sm = propre(sm)
    jour = date.today().isoformat()
    sm = re.sub(r"<url><loc>([^<]+)</loc>(?:<lastmod>[^<]*</lastmod>)?</url>", lambda m: f"<url><loc>{m.group(1)}</loc><lastmod>{jour}</lastmod></url>", sm)
    open("sitemap.xml", "w", encoding="utf8").write(sm)
    print("Adresses propres appliquées")
