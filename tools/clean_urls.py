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
    t = re.sub(r'href="(/?(?:golf|guides)/)index\.html', r'href="/\1', t.replace('href="golf/', 'href="/golf/'))
    t = re.sub(r'href="(/(?:golf|guides)/[\w/-]+)\.html', r'href="\1', t)
    t = re.sub(r'href="/?mentions-legales\.html"', 'href="/mentions-legales"', t)
    t = t.replace('href="//', 'href="/')
    return t


if __name__ == "__main__":
    for f in ["index.html", "404.html", "mentions-legales.html"] + glob.glob("golf/*.html") + glob.glob("golf/pays/*.html") + glob.glob("guides/*.html"):
        try:
            s = open(f, encoding="utf8").read()
        except FileNotFoundError:
            continue
        n = propre(s)
        if n != s:
            open(f, "w", encoding="utf8").write(n)
    # Version du script dans l'adresse : les navigateurs rechargent birdy.js dès qu'il change
    import hashlib
    v = hashlib.md5(open("assets/birdy.js", "rb").read()).hexdigest()[:8]
    ix = open("index.html", encoding="utf8").read()
    ix2 = re.sub(r'src="/assets/birdy\.js(\?v=\w+)?"', f'src="/assets/birdy.js?v={v}"', ix)
    if ix2 != ix:
        open("index.html", "w", encoding="utf8").write(ix2)
    sm = open("sitemap.xml", encoding="utf8").read()
    sm = propre(sm)
    jour = date.today().isoformat()
    sm = re.sub(r"<url><loc>([^<]+)</loc>(?:<lastmod>[^<]*</lastmod>)?</url>", lambda m: f"<url><loc>{m.group(1)}</loc><lastmod>{jour}</lastmod></url>", sm)
    open("sitemap.xml", "w", encoding="utf8").write(sm)
    print("Adresses propres appliquées")
