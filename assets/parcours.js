/* Birdy Golf : recherche de parcours en France (accueil + page /parcours/).
   Données : /data/golfs.json (Recensement des équipements sportifs) et /data/villes.json.
   Aucune disponibilité n'est inventée : la réservation est une demande confirmée par un conseiller. */
(function () {
  "use strict";
  function norm(s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[’']/g, " ").replace(/[^a-z0-9 -]/g, " ").replace(/\s+/g, " ").trim(); }
  function km(a, b, c, d) {
    var r = Math.PI / 180, x = Math.pow(Math.sin((c - a) * r / 2), 2) + Math.cos(a * r) * Math.cos(c * r) * Math.pow(Math.sin((d - b) * r / 2), 2);
    return 12742 * Math.asin(Math.sqrt(x));
  }
  var data = null;
  function charger() {
    if (data) return data;
    data = Promise.all([fetch("/data/golfs.json").then(function (r) { return r.json(); }), fetch("/data/villes.json").then(function (r) { return r.json(); })])
      .then(function (x) { return { golfs: x[0].golfs, maj: x[0].maj, villes: x[1] }; });
    data.catch(function () { data = null; });
    return data;
  }
  var SUD = ["Occitanie", "Provence-Alpes-Côte d'Azur", "Nouvelle-Aquitaine", "Corse"];
  var ZONES = [
    [/sud de la france|^sud$|^le sud$|midi de la france/, { label: "le sud de la France", r: SUD }],
    [/cote d azur|riviera/, { label: "la Côte d’Azur", d: ["06", "83"] }],
    [/pays basque/, { label: "le Pays basque", d: ["64"] }],
    [/alpes(?! maritimes| de haute)/, { label: "les Alpes", d: ["73", "74", "38", "05", "04"] }],
    [/region parisienne|ile de france|idf/, { label: "l’Île-de-France", r: ["Île-de-France"] }],
    [/provence/, { label: "la Provence", r: ["Provence-Alpes-Côte d'Azur"] }],
    [/^nord$|le nord/, { label: "le Nord", r: ["Hauts-de-France"] }],
    [/cote basque/, { label: "la côte basque", d: ["64", "40"] }]
  ];
  function nettoie(q) { return norm(q).replace(/^(a |au |aux |en |dans |vers |pres de |pres d |proche de |autour de |autour d |region de |cote de )+/, "").replace(/^(le |la |les )/, "").trim(); }
  function sansArt(s) { return norm(s).replace(/^(le |la |les )/, ""); }
  // Lieu tapé -> zone : { label, lat, lon } (point) ou { label, d: [...] } / { label, r: [...] } (département, région)
  function lieu(q) {
    var gps = String(q || "").match(/^(-?\d+\.\d+),\s*(-?\d+\.\d+)$/);
    if (gps) return Promise.resolve({ label: "votre position", lat: +gps[1], lon: +gps[2] });
    var t = nettoie(q);
    if (!t) return Promise.resolve(null);
    return charger().then(function (D) {
      for (var i = 0; i < ZONES.length; i++) if (ZONES[i][0].test(t)) return ZONES[i][1];
      var g, k;
      if (/^\d{2,3}$|^2a$|^2b$/.test(t)) {
        var code = t.length === 1 ? "0" + t : t.toUpperCase();
        g = D.golfs.find(function (x) { return x.d === code; });
        if (g) return { label: g.dn + " (" + code + ")", d: [code] };
      }
      var regs = {}, deps = {};
      D.golfs.forEach(function (x) { regs[norm(x.r)] = x.r; deps[norm(x.dn)] = [x.d, x.dn]; });
      if (regs[t]) return { label: regs[t], r: [regs[t]] };
      for (k = 0; k < D.villes.length; k++) if (sansArt(D.villes[k][0]) === t && D.villes[k][4] > 100000) return { label: D.villes[k][0], lat: D.villes[k][1], lon: D.villes[k][2] };
      if (deps[t]) return { label: deps[t][1] + " (" + deps[t][0] + ")", d: [deps[t][0]] };
      for (k = 0; k < D.villes.length; k++) if (sansArt(D.villes[k][0]) === t) return { label: D.villes[k][0], lat: D.villes[k][1], lon: D.villes[k][2] };
      g = D.golfs.find(function (x) { return sansArt(x.v) === t; });
      if (g) return { label: g.v, lat: g.la, lon: g.lo };
      for (k = 0; k < D.villes.length; k++) if (sansArt(D.villes[k][0]).indexOf(t) === 0) return { label: D.villes[k][0], lat: D.villes[k][1], lon: D.villes[k][2] };
      return fetch("https://geo.api.gouv.fr/communes?nom=" + encodeURIComponent(q) + "&boost=population&limit=1&fields=nom,centre")
        .then(function (r) { return r.json(); })
        .then(function (l) { return l && l[0] && l[0].centre ? { label: l[0].nom, lat: l[0].centre.coordinates[1], lon: l[0].centre.coordinates[0] } : null; })
        .catch(function () { return null; });
    });
  }
  // Critères : { lieu, rayon, trous (18|9|0), date, creneau, joueurs, budget }
  function chercher(c) {
    return Promise.all([charger(), lieu(c.lieu)]).then(function (x) {
      var D = x[0], z = x[1], rayon = +c.rayon || 30, trous = c.trous === undefined || c.trous === "" ? 18 : +c.trous;
      var res = [];
      D.golfs.forEach(function (g) {
        if (trous === 18 && !g.t18) return;
        if (trous === 9 && !g.t9) return;
        if (!z) return;
        if (z.d && z.d.indexOf(g.d) < 0) return;
        if (z.r && z.r.indexOf(g.r) < 0) return;
        var dist = z.lat != null ? km(z.lat, z.lon, g.la, g.lo) : null;
        if (dist != null && dist > rayon) return;
        res.push({ g: g, dist: dist });
      });
      res.sort(function (a, b) { return a.dist != null ? a.dist - b.dist : (b.g.t18 - a.g.t18) || a.g.n.localeCompare(b.g.n, "fr"); });
      return { zone: z, res: res, rayon: rayon, trous: trous, maj: D.maj };
    });
  }
  function url(c) {
    var p = [];
    ["lieu", "rayon", "trous", "date", "creneau", "joueurs", "budget", "golf"].forEach(function (k) { if (c[k] != null && c[k] !== "") p.push(k + "=" + encodeURIComponent(c[k])); });
    return "/parcours/" + (p.length ? "?" + p.join("&") : "");
  }
  function trousTxt(g) {
    var o = [];
    if (g.t18) o.push(g.t18 > 1 ? g.t18 + " × 18 trous" : "18 trous");
    if (g.t9) o.push(g.t9 > 1 ? g.t9 + " × 9 trous" : "9 trous");
    return o;
  }
  // Critères déduits d'une phrase, si l'IA ne répond pas
  function devine(txt) {
    var t = norm(txt), c = { trous: /9 trous/.test(t) ? 9 : 18 };
    var j = t.match(/(\d)\s*(joueurs|personnes|pers|golfeurs|amis|potes)/) || t.match(/a (\d) /);
    if (j) c.joueurs = +j[1];
    if (/matin/.test(t)) c.creneau = "Matin"; else if (/apres midi|aprem/.test(t)) c.creneau = "Après-midi"; else if (/midi/.test(t)) c.creneau = "Midi";
    var b = t.match(/(\d{2,3})\s*(e|eur|euros)\b/); if (b) c.budget = b[1] + " €";
    var m = t.match(/(?:autour de|pres de|proche de|a cote de|vers|sur|a|au|en|dans le|dans la|dans les) ([a-z][a-z -]{2,40}?)(?: ce | pour | samedi| dimanche| demain| le | la | avec | a moins|,|$)/);
    if (m) c.lieu = m[1].trim();
    return c;
  }
  window.BirdyGolf = { charger: charger, lieu: lieu, chercher: chercher, url: url, trousTxt: trousTxt, devine: devine, norm: norm };

  /* ---------- Page /parcours/ ---------- */
  var F = document.getElementById("gp-f");
  if (!F) return;
  var list = document.getElementById("gp-list"), count = document.getElementById("gp-count"), dlg = document.getElementById("gp-dlg");
  var dep = document.getElementById("gp-dep"), carte = null, couche = null, marques = {}, dernier = [];
  var auj = new Date(); auj.setMinutes(auj.getMinutes() - auj.getTimezoneOffset());
  var iso = auj.toISOString().slice(0, 10);
  F.date.min = iso; dep.date.min = iso;
  function crit() { return { lieu: F.lieu.value.trim(), rayon: F.rayon.value, trous: F.trous.value, date: F.date.value, creneau: F.creneau.value, joueurs: F.joueurs.value }; }
  function remplir(c) {
    if (c.lieu) F.lieu.value = c.lieu;
    if (c.rayon) { var r = [15, 30, 50, 100].reduce(function (a, b) { return Math.abs(b - c.rayon) < Math.abs(a - c.rayon) ? b : a; }); F.rayon.value = r; }
    if (c.trous !== undefined && c.trous !== "") F.trous.value = String(c.trous);
    if (c.date && /^\d{4}-\d{2}-\d{2}$/.test(c.date) && c.date >= iso) F.date.value = c.date;
    if (c.creneau) { var cr = norm(c.creneau); F.creneau.value = /matin/.test(cr) ? "Matin" : /apres/.test(cr) ? "Après-midi" : /midi/.test(cr) ? "Midi" : ""; }
    if (c.joueurs) F.joueurs.value = String(Math.min(8, Math.max(1, +c.joueurs || 2)));
    if (c.budget) F.dataset.budget = String(c.budget);
  }
  function carteInit() {
    if (carte || !window.L) return;
    carte = L.map("gp-map", { scrollWheelZoom: false, zoomSnap: 0.25 }).setView([46.6, 2.4], 5);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, className: "gp-tuiles", attribution: "© OpenStreetMap" }).addTo(carte);
    couche = L.layerGroup().addTo(carte);
  }
  // Grille de résultats : 12 cartes, puis « Voir plus »
  var montres = 0, bPlus = document.getElementById("gp-plus");
  function plus(n) {
    dernier.slice(montres, montres + n).forEach(function (o, k) { var f = fiche(o); f.style.setProperty("--k", k); list.appendChild(f); });
    montres = Math.min(dernier.length, montres + n);
    if (bPlus) { bPlus.hidden = montres >= dernier.length; bPlus.textContent = "Voir plus de parcours (" + (dernier.length - montres) + ")"; }
  }
  if (bPlus) bPlus.addEventListener("click", function () { plus(12); });
  function fiche(o) {
    var g = o.g, a = document.createElement("article"); a.className = "gc"; a.id = "g-" + g.i;
    var h = document.createElement("div"); h.className = "gc-h";
    var t = document.createElement("h3"), tl = document.createElement("a"); tl.href = "/parcours/golf/" + g.s; tl.textContent = g.n; t.appendChild(tl); h.appendChild(t);
    if (o.dist != null) { var d = document.createElement("span"); d.className = "gd"; d.textContent = Math.round(o.dist) + " km"; h.appendChild(d); }
    var v = document.createElement("p"); v.className = "gc-v"; v.textContent = g.v + " (" + g.d + ") · " + g.dn;
    var b = document.createElement("div"); b.className = "gc-b";
    trousTxt(g).concat(g.g ? [g.g] : []).forEach(function (x, k, arr) { var s = document.createElement("span"); s.className = g.g && k === arr.length - 1 ? "gg" : "gb"; s.textContent = x; b.appendChild(s); });
    var c = document.createElement("div"); c.className = "gc-cta";
    var go = document.createElement("button"); go.type = "button"; go.className = "btn gold sm"; go.textContent = "Demander un départ";
    go.addEventListener("click", function () { ouvrir(g); });
    c.appendChild(go);
    if (g.u) { var l = document.createElement("a"); l.className = "btn ghost sm"; l.href = g.u; l.target = "_blank"; l.rel = "noopener nofollow"; l.textContent = "Site du golf"; c.appendChild(l); }
    a.appendChild(h); a.appendChild(v); a.appendChild(b); a.appendChild(c);
    a.addEventListener("mouseenter", function () { var m = marques[g.i]; if (m) m.setStyle({ radius: 11, fillColor: "#FFFFFF" }); });
    a.addEventListener("mouseleave", function () { var m = marques[g.i]; if (m) m.setStyle({ radius: 7, fillColor: "#A3C9B8" }); });
    return a;
  }
  function de(x) { return /^Le /.test(x) ? "du " + x.slice(3) : /^Les /.test(x) ? "des " + x.slice(4) : /^[aeiouyhâéèêîôûAEIOUYHÂÉÈÊÎÔÛ]/.test(x) ? "d’" + x : "de " + x; }
  function afficher(r, c) {
    dernier = r.res; list.textContent = "";
    if (window.BirdyGolf3D) BirdyGolf3D.surligne(r.res.map(function (o) { return o.g.i; }));
    if (!r.zone) { count.textContent = c.lieu ? "Lieu introuvable : essayez une ville, un département ou une région." : "Indiquez un lieu pour voir les parcours."; return; }
    var n = r.res.length, quoi = r.trous === 18 ? "parcours 18 trous" : r.trous === 9 ? "parcours 9 trous" : "golfs";
    count.textContent = n ? n + " " + (n === 1 && quoi === "golfs" ? "golf" : quoi) + (r.zone.lat != null ? " à moins de " + r.rayon + " km " + de(r.zone.label) : " · " + r.zone.label)
      : "Aucun " + quoi.replace(/^golfs$/, "golf") + (r.zone.lat != null ? " à moins de " + r.rayon + " km " + de(r.zone.label) + " : élargissez le rayon." : " ici.");
    montres = 0; plus(12);
    carteInit();
    if (!carte) return;
    couche.clearLayers(); marques = {};
    var pts = [];
    r.res.forEach(function (o) {
      var m = L.circleMarker([o.g.la, o.g.lo], { radius: 7, color: "#E8F1EC", weight: 1.5, fillColor: "#A3C9B8", fillOpacity: .95 }).addTo(couche);
      m.bindTooltip(o.g.n);
      m.on("click", function () { var el = document.getElementById("g-" + o.g.i); if (el) { el.scrollIntoView({ behavior: "smooth", block: "nearest" }); el.classList.add("on"); setTimeout(function () { el.classList.remove("on"); }, 1600); } });
      marques[o.g.i] = m; pts.push([o.g.la, o.g.lo]);
    });
    if (r.zone.lat != null) pts.push([r.zone.lat, r.zone.lon]);
    if (pts.length) carte.fitBounds(pts, { padding: [30, 30], maxZoom: 11 });
  }
  function lancer() {
    var c = crit();
    count.textContent = "Recherche…";
    history.replaceState(null, "", url(Object.assign({}, c, { golf: null })));
    return chercher(c).then(function (r) { afficher(r, c); return r; });
  }
  F.addEventListener("submit", function (ev) { ev.preventDefault(); lancer().then(function () { count.scrollIntoView({ behavior: "smooth", block: "start" }); }); });

  // Raccourcis et « Autour de moi »
  var chips = document.getElementById("gp-chips");
  if (chips) chips.addEventListener("click", function (ev) {
    var b = ev.target.closest && ev.target.closest("button[data-lieu]"); if (!b) return;
    F.lieu.value = b.getAttribute("data-lieu");
    lancer().then(function () { count.scrollIntoView({ behavior: "smooth", block: "start" }); });
  });
  var moi = document.getElementById("gp-moi");
  if (moi) moi.addEventListener("click", function () {
    if (!navigator.geolocation) { F.lieu.focus(); return; }
    moi.textContent = "Localisation…";
    navigator.geolocation.getCurrentPosition(function (pos) {
      moi.textContent = "◎ Près de moi";
      F.lieu.value = pos.coords.latitude.toFixed(4) + "," + pos.coords.longitude.toFixed(4);
      lancer().then(function () { count.scrollIntoView({ behavior: "smooth", block: "start" }); });
    }, function () { moi.textContent = "◎ Près de moi"; count.textContent = "Position indisponible : indiquez une ville."; F.lieu.focus(); }, { timeout: 10000, maximumAge: 600000 });
  });

  // Panneau d'accueil avant la première recherche : logo, chiffres clés, grandes villes
  function accueil(D) {
    var n18 = D.golfs.filter(function (g) { return g.t18; }).length, regs = {};
    D.golfs.forEach(function (g) { regs[g.r] = 1; });
    var p = document.createElement("div"); p.className = "gp-start";
    p.innerHTML = '<div class="gp-start-h"><img src="/favicon-192.png" alt="Birdy Agent" width="74" height="74"><div><b>Où voulez-vous jouer ?</b><span>Touchez une ville, ou cherchez par lieu ci-dessus.</span></div></div>' +
      '<div class="gp-stats"><div><b>' + n18 + '</b><small>parcours 18 trous</small></div><div><b>' + D.golfs.length + '</b><small>golfs en France</small></div><div><b>0 €</b><small>pour demander</small></div></div>';
    var v = document.createElement("div"); v.className = "gp-villes";
    ["Paris", "Lyon", "Bordeaux", "Marseille", "Nice", "Toulouse", "Nantes", "Lille", "Biarritz", "Annecy"].forEach(function (nom, k) {
      var c = D.villes.find(function (x) { return x[0] === nom; }); if (!c) return;
      var n = D.golfs.filter(function (g) { return g.t18 && km(c[1], c[2], g.la, g.lo) <= 30; }).length;
      var b = document.createElement("button"); b.type = "button"; b.style.setProperty("--k", k);
      b.innerHTML = "<span></span><small></small>"; b.firstChild.textContent = nom; b.lastChild.textContent = n + " parcours · 30 km";
      b.addEventListener("click", function () { F.lieu.value = nom; F.rayon.value = "30"; lancer().then(function () { count.scrollIntoView({ behavior: "smooth", block: "start" }); }); });
      v.appendChild(b);
    });
    p.appendChild(v); list.appendChild(p);
  }
  // Carte de départ : tous les golfs de France
  function apercu(D) {
    carteInit(); if (!carte || dernier.length) return;
    couche.clearLayers(); marques = {};
    D.golfs.forEach(function (g) {
      if (!g.t18 || g.la < 41 || g.la > 51.6 || g.lo < -5.6 || g.lo > 10) return;
      var m = L.circleMarker([g.la, g.lo], { radius: 4, color: "#0A1E17", weight: 1, fillColor: "#A3C9B8", fillOpacity: .9 }).addTo(couche);
      m.bindTooltip(g.n + " · " + g.v);
      m.on("click", function () { ouvrir(g); });
    });
    carte.fitBounds([[42.2, -4.9], [51.1, 8.3]], { padding: [8, 8] });
  }

  // Demande de départ
  function ouvrir(g) {
    var c = crit();
    document.getElementById("d-nom").textContent = g.n;
    document.getElementById("d-lieu").textContent = [g.a, (g.cp ? g.cp + " " : "") + g.v].filter(Boolean).join(", ") + " · " + trousTxt(g).join(", ");
    dep.golf.value = g.i;
    if (c.date) dep.date.value = c.date;
    dep.creneau.value = c.creneau; dep.joueurs.value = c.joueurs || "2";
    if (F.dataset.budget && !dep.budget.value) dep.budget.value = F.dataset.budget;
    document.getElementById("d-msg").textContent = "";
    dep.hidden = false; document.getElementById("d-merci").hidden = true;
    var sl = document.getElementById("d-slots"); sl.hidden = true; sl.textContent = "";
    // Créneaux en temps réel : seulement si un partenaire de réservation est branché pour ce golf
    fetch("/api/disponibilites?golf=" + encodeURIComponent(g.i) + "&date=" + encodeURIComponent(dep.date.value || "") + "&joueurs=" + encodeURIComponent(dep.joueurs.value))
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !d.temps_reel || !d.creneaux || !d.creneaux.length) return;
        d.creneaux.forEach(function (s) { var b = document.createElement("button"); b.type = "button"; b.className = "btn ghost sm"; b.textContent = s.heure + (s.prix ? " · " + s.prix : ""); b.addEventListener("click", function () { dep.note.value = "Créneau choisi : " + s.heure; }); sl.appendChild(b); });
        sl.hidden = false;
      }).catch(function () {});
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
  }
  dep.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var m = document.getElementById("d-msg"), btn = dep.querySelector("button[type=submit]");
    if (!dep.prenom.value.trim() || dep.tel.value.replace(/\D/g, "").length < 9) { m.textContent = "Indiquez votre prénom et un numéro de téléphone valide."; return; }
    if (!dep.date.value) { m.textContent = "Choisissez une date."; return; }
    if (!dep.accord.checked) { m.textContent = "Cochez la case pour que nous puissions vous recontacter."; return; }
    btn.disabled = true; m.textContent = "Envoi en cours…";
    var corps = {}; new FormData(dep).forEach(function (v, k) { corps[k] = v; });
    fetch("/api/depart", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) })
      .then(function (r) { if (!r.ok) throw new Error(r.status); dep.hidden = true; document.getElementById("d-merci").hidden = false; m.textContent = ""; })
      .catch(function () { m.textContent = "L’envoi n’a pas fonctionné. Appelez-nous au 06 16 21 34 47."; })
      .then(function () { btn.disabled = false; });
  });

  // Demander à Birdy
  var ask = document.getElementById("gp-ask"), say = document.getElementById("gp-say"), histo = [];
  function md(t) {
    var h = t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\*\*([^*\n]+)\*\*/g, "<b>$1</b>");
    h = h.replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, function (m, x, u) { return /^\/(golf|guides|parcours)\/[\w\/?=&%.-]*$|^\/#organiser$/.test(u) ? '<a href="' + u + '">' + x + "</a>" : x; });
    return h.replace(/\n/g, "<br>");
  }
  function appliquer(c, txt) {
    remplir(c);
    if (!F.lieu.value) { if (txt) say.innerHTML = md(txt) + "<br>Où souhaitez-vous jouer ?"; F.lieu.focus(); return; }
    lancer().then(function () { document.getElementById("gp-count").scrollIntoView({ behavior: "smooth", block: "start" }); });
  }
  ask.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var q = document.getElementById("gp-q"), txt = q.value.trim(); if (!txt) return;
    q.value = ""; say.hidden = false; say.innerHTML = '<span class="typing"><i></i><i></i><i></i></span>';
    histo.push({ role: "user", content: "[Page réservation de parcours en France] " + txt });
    var rep = "", golf = null, err = null;
    fetch("/api/birdy", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: histo }) })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(function (b) {
        b.split("\n\n").forEach(function (l) {
          if (l.indexOf("data: ") !== 0) return;
          try { var o = JSON.parse(l.slice(6)); if (o.t != null) rep += String(o.t); if (o.golf) golf = o.golf; if (o.erreur) err = o.erreur; } catch (e) {}
        });
        if (err || !rep.trim()) throw new Error(err || "vide");
        rep = rep.trim(); histo.push({ role: "assistant", content: rep });
        say.innerHTML = md(rep);
        appliquer(golf || devine(txt));
      })
      .catch(function () {
        histo.pop();
        var c = devine(txt);
        say.textContent = c.lieu ? "Voici les parcours qui correspondent à votre recherche." : "Dites-moi où vous souhaitez jouer (ville, département ou région).";
        appliquer(c);
      });
  });

  // Démarrage : critères dans l'adresse, liste des villes
  var P = new URLSearchParams(location.search), c0 = {};
  ["lieu", "rayon", "trous", "date", "creneau", "joueurs", "budget"].forEach(function (k) { if (P.get(k)) c0[k] = P.get(k); });
  remplir(c0);
  addEventListener("load", carteInit);
  // Clic sur un golf de la France en 3D : demande de départ
  function brancher3D(D) {
    if (window.BirdyGolf3D) window.BirdyGolf3D.onPick = function (id) { var g = D.golfs.find(function (x) { return x.i === id; }); if (g) ouvrir(g); };
    else setTimeout(function () { brancher3D(D); }, 400);
  }
  // Apparition des sections au défilement, inclinaison 3D des étapes
  if (window.IntersectionObserver && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var io = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("vu"); io.unobserve(x.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
    Array.prototype.forEach.call(document.querySelectorAll(".gp-steps .gp-step, .gp-f, .gp-info, main.gp > .band:not(.gp-band) .in > *"), function (el, k) {
      el.classList.add("rv"); el.style.transitionDelay = (k % 3) * 90 + "ms"; io.observe(el);
    });
  }
  Array.prototype.forEach.call(document.querySelectorAll(".gp-step"), function (el) {
    el.addEventListener("pointermove", function (e) {
      var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = "perspective(700px) rotateY(" + (x * 10) + "deg) rotateX(" + (-y * 10) + "deg) translateY(-3px)";
    });
    el.addEventListener("pointerleave", function () { el.style.transform = ""; });
  });
  charger().then(function (D) {
    brancher3D(D);
    var dl = document.getElementById("f-villes");
    D.villes.slice(0, 400).forEach(function (v) { var o = document.createElement("option"); o.value = v[0]; dl.appendChild(o); });
    if (c0.lieu) lancer(); else {
      accueil(D);
      count.textContent = "Tous les parcours 18 trous de France sont sur la carte.";
      if (window.L) apercu(D); else addEventListener("load", function () { apercu(D); });
    }
    var id = P.get("golf");
    if (id) { var g = D.golfs.find(function (x) { return x.i === id; }); if (g) ouvrir(g); }
  });
})();
