#!/usr/bin/env python3
"""Signale toutes les pages du sitemap à IndexNow (Bing, Yandex, Seznam… ; Bing alimente ChatGPT Search et Copilot).
À lancer après une mise en ligne :  python3 tools/indexnow.py
La clé publique est dans le fichier /0fb86aa00955a67579e8ca2aa9b0e054.txt à la racine du site (c'est normal qu'il soit public)."""
import json
import re
import subprocess

CLE = "0fb86aa00955a67579e8ca2aa9b0e054"
HOTE = "birdy-agent.pages.dev"
urls = re.findall(r"<loc>([^<]+)</loc>", open("sitemap.xml", encoding="utf8").read())
corps = {"host": HOTE, "key": CLE, "keyLocation": f"https://{HOTE}/{CLE}.txt", "urlList": urls}
r = subprocess.run(["curl", "-s", "-m", "60", "-o", "/dev/null", "-w", "%{http_code}", "-X", "POST", "https://api.indexnow.org/indexnow",
                    "-H", "content-type: application/json; charset=utf-8", "-d", json.dumps(corps)], capture_output=True, text=True)
print(len(urls), "adresses envoyées à IndexNow : réponse", r.stdout, "(200 ou 202 = reçu)")
