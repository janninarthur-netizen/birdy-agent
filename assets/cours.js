/* Pôle « Cours & Pros » (/cours/) : chat Birdy, filtres, cartes 3D, recherche de golfs, calendrier de disponibilités.
   S'appuie sur window.BirdyGolf (assets/parcours.js) pour l'annuaire des golfs. Aucune disponibilité n'est inventée :
   le calendrier sert à indiquer les disponibilités de l'élève, un conseiller confirme ensuite le créneau. */
(function () {
  "use strict";
  var F = document.getElementById("cp-f");
  if (!F || !window.BirdyGolf) return;
  var BG = window.BirdyGolf, list = document.getElementById("cp-list"), count = document.getElementById("cp-count");
  var plus = document.getElementById("cp-plus"), dlg = document.getElementById("cp-dlg"), dem = document.getElementById("cp-dem");
  var resultats = [], montres = 0;
  function el(t, cls, txt) { var x = document.createElement(t); if (cls) x.className = cls; if (txt != null) x.textContent = txt; return x; }

  /* ---------- Effet 3D (inclinaison + reflet) ---------- */
  var calme = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function t3d(root) {
    if (calme || matchMedia("(hover: none)").matches) return;
    Array.prototype.forEach.call((root || document).querySelectorAll(".t3d"), function (c) {
      if (c.dataset.t3d) return; c.dataset.t3d = "1";
      c.addEventListener("pointermove", function (ev) {
        var r = c.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
        c.style.transform = "perspective(900px) rotateY(" + ((x - 0.5) * 14) + "deg) rotateX(" + ((0.5 - y) * 12) + "deg) translateZ(6px)";
        c.style.setProperty("--gx", (x * 100) + "%"); c.style.setProperty("--gy", (y * 100) + "%");
      });
      c.addEventListener("pointerleave", function () { c.style.transform = ""; });
    });
  }
  t3d();

  /* ---------- Types de cours ---------- */
  var types = document.getElementById("cp-types");
  function choisirType(t) {
    F.type.value = t || "";
    Array.prototype.forEach.call(types.querySelectorAll(".cp-type"), function (b) { b.setAttribute("aria-pressed", b.dataset.type === t ? "true" : "false"); });
  }
  types.addEventListener("click", function (ev) {
    var b = ev.target.closest(".cp-type"); if (!b) return;
    choisirType(F.type.value === b.dataset.type ? "" : b.dataset.type);
    if (F.lieu.value.trim()) lancer();
  });

  /* ---------- Recherche de golfs ---------- */
  function ligne(o) {
    var g = o.g, a = el("article", "cp-row");
    var c = el("div", "cp-row-c"), h = el("h3"), l = el("a", null, g.n); l.href = "/parcours/golf/" + g.s; h.appendChild(l); c.appendChild(h);
    c.appendChild(el("p", null, g.v + " (" + g.d + ") · " + BG.trousTxt(g).join(", ") + (o.dist != null ? " · " + Math.round(o.dist) + " km" : "")));
    var b = el("button", "btn gold sm", "Demander un cours"); b.type = "button";
    b.addEventListener("click", function () { ouvrir(g); });
    a.appendChild(el("span", "cp-row-i", "⛳")); a.appendChild(c); a.appendChild(b);
    return a;
  }
  function afficherPlus(n) {
    resultats.slice(montres, montres + n).forEach(function (o, k) { var r = ligne(o); r.style.setProperty("--k", k); list.appendChild(r); });
    montres = Math.min(resultats.length, montres + n);
    plus.hidden = montres >= resultats.length;
    if (!plus.hidden) plus.textContent = "Voir plus de golfs (" + (resultats.length - montres) + ")";
  }
  plus.addEventListener("click", function () { afficherPlus(10); });
  function lancer() {
    var lieu = F.lieu.value.trim();
    if (!lieu) { count.textContent = "Indiquez une ville, un département ou une région."; F.lieu.focus(); return Promise.resolve(); }
    count.textContent = "Recherche…";
    return BG.chercher({ lieu: lieu, rayon: F.rayon.value, trous: 0 }).then(function (r) {
      list.textContent = ""; montres = 0; resultats = r.res;
      if (!r.zone) { count.textContent = "Lieu introuvable : essayez une ville, un département ou une région."; plus.hidden = true; return; }
      var t = F.type.value ? " · " + F.type.value.toLowerCase() : "";
      count.textContent = r.res.length ? r.res.length + " golf" + (r.res.length > 1 ? "s" : "") + (r.zone.lat != null ? " à moins de " + r.rayon + " km de " + r.zone.label : " · " + r.zone.label) + t + " : choisissez où prendre votre cours"
        : "Aucun golf ici : élargissez le rayon.";
      afficherPlus(10);
      history.replaceState(null, "", "/cours/?lieu=" + encodeURIComponent(lieu) + (F.type.value ? "&type=" + encodeURIComponent(F.type.value) : ""));
    });
  }
  F.addEventListener("submit", function (ev) { ev.preventDefault(); lancer().then(function () { count.scrollIntoView({ behavior: "smooth", block: "start" }); }); });

  /* ---------- Calendrier de disponibilités (carrousel des 21 prochains jours) ---------- */
  var jours = document.getElementById("cp-jours"), moments = document.getElementById("cp-moments"), recap = document.getElementById("cp-recap");
  var J = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."], M = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  (function () {
    var d = new Date();
    for (var i = 1; i <= 21; i++) {
      var x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i);
      var b = el("button"); b.type = "button"; b.dataset.j = J[x.getDay()] + " " + x.getDate() + " " + M[x.getMonth()];
      if (x.getDay() === 0 || x.getDay() === 6) b.className = "we";
      b.innerHTML = "<small></small><b></b><small></small>";
      b.children[0].textContent = J[x.getDay()]; b.children[1].textContent = x.getDate(); b.children[2].textContent = M[x.getMonth()];
      jours.appendChild(b);
    }
  })();
  function majRecap() {
    var js = Array.prototype.filter.call(jours.children, function (b) { return b.classList.contains("on"); }).map(function (b) { return b.dataset.j; });
    var ms = Array.prototype.filter.call(moments.children, function (b) { return b.classList.contains("on"); }).map(function (b) { return b.dataset.m.toLowerCase(); });
    var t = js.length ? js.join(", ") + (ms.length ? " · " + ms.join(", ") : "") : (ms.length ? "Moments : " + ms.join(", ") : "");
    dem.dispos.value = t; recap.textContent = t || "Aucune disponibilité choisie.";
  }
  jours.addEventListener("click", function (ev) { var b = ev.target.closest("button"); if (b) { b.classList.toggle("on"); majRecap(); } });
  moments.addEventListener("click", function (ev) { var b = ev.target.closest("button"); if (b) { b.classList.toggle("on"); majRecap(); } });

  /* ---------- Demande de cours ---------- */
  function ouvrir(g, pro) {
    document.getElementById("cd-nom").textContent = g ? g.n : "Votre cours de golf";
    document.getElementById("cd-lieu").textContent = g ? g.v + " (" + g.d + ") · " + BG.trousTxt(g).join(", ") + (pro ? " · avec " + pro : "") : (F.lieu.value || "");
    dem.golf.value = g ? g.i : ""; dem.lieu.value = F.lieu.value || "";
    if (F.type.value) dem.type_cours.value = F.type.value;
    if (F.niveau.value) dem.niveau.value = F.niveau.value;
    dem.eleves.value = F.eleves.value || "1";
    if (pro && dem.note) dem.note.value = "Pro souhaité : " + pro;
    document.getElementById("cd-msg").textContent = ""; dem.hidden = false; document.getElementById("cd-merci").hidden = true;
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
  }
  dem.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var m = document.getElementById("cd-msg"), btn = dem.querySelector("button[type=submit]");
    if (!dem.prenom.value.trim() || dem.tel.value.replace(/\D/g, "").length < 9) { m.textContent = "Indiquez votre prénom et un numéro de téléphone valide."; return; }
    if (!dem.accord.checked) { m.textContent = "Cochez la case pour que nous puissions vous recontacter."; return; }
    btn.disabled = true; m.textContent = "Envoi en cours…";
    var corps = {}; new FormData(dem).forEach(function (v, k) { corps[k] = v; });
    fetch("/api/cours", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) })
      .then(function (r) { if (!r.ok) throw new Error(r.status); dem.hidden = true; document.getElementById("cd-merci").hidden = false; m.textContent = ""; })
      .catch(function () { m.textContent = "L’envoi n’a pas fonctionné. Appelez-nous au 06 16 21 34 47."; })
      .then(function () { btn.disabled = false; });
  });
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest && ev.target.closest(".cp-dem"); if (!b) return;
    BG.charger().then(function (D) { ouvrir(D.golfs.find(function (x) { return x.i === b.dataset.golf; }), b.dataset.pro); });
  });

  /* ---------- Candidature des pros ---------- */
  var prodlg = document.getElementById("cp-prodlg"), proform = document.getElementById("cp-proform");
  document.getElementById("cp-join").addEventListener("click", function () { if (prodlg.showModal) prodlg.showModal(); else prodlg.setAttribute("open", ""); });
  proform.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var m = document.getElementById("cpp-msg"), btn = proform.querySelector("button[type=submit]");
    if (!proform.accord.checked) { m.textContent = "Cochez la case pour que nous puissions vous recontacter."; return; }
    btn.disabled = true; m.textContent = "Envoi en cours…";
    var corps = {}; new FormData(proform).forEach(function (v, k) { corps[k] = v; });
    fetch("/api/pro", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) })
      .then(function (r) { if (!r.ok) throw new Error(r.status); proform.hidden = true; document.getElementById("cpp-merci").hidden = false; m.textContent = ""; })
      .catch(function () { m.textContent = "L’envoi n’a pas fonctionné. Appelez-nous au 06 16 21 34 47."; })
      .then(function () { btn.disabled = false; });
  });

  /* ---------- Chat Birdy ---------- */
  var say = document.getElementById("cp-say"), sugg = document.getElementById("cp-sugg"), histo = [], occupe = false;
  function md(t) {
    var h = t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\*\*([^*\n]+)\*\*/g, "<b>$1</b>");
    h = h.replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, function (m, x, u) { if (u === "/#organiser") u = "/voyages/#organiser"; return /^\/(golf|guides|parcours|cours|debuter)\/[\w\/?=&%.-]*$|^\/voyages\/(#organiser)?$/.test(u) ? '<a href="' + u + '">' + x + "</a>" : x; });
    return h.replace(/\n/g, "<br>");
  }
  function bulle(cls, contenu, texte) { var d = el("div", "gm " + cls); if (texte) d.textContent = contenu; else d.innerHTML = contenu; say.appendChild(d); say.scrollTop = say.scrollHeight; return d; }
  function rapides(l) { if (!l || !l.length) return; sugg.textContent = ""; l.slice(0, 4).forEach(function (x) { var b = el("button", null, String(x)); b.type = "button"; sugg.appendChild(b); }); }
  var NIV = [[/jamais|zero|zéro|debut|début|novice|decouv|découv/i, "Je n’ai jamais joué"], [/carte verte/i, "Débutant (carte verte en cours)"]];
  function appliquer(c, txt) {
    if (c.lieu) F.lieu.value = c.lieu;
    if (c.type) { var t = Array.prototype.find.call(types.querySelectorAll(".cp-type"), function (b) { return b.dataset.type.toLowerCase() === String(c.type).toLowerCase(); }); if (t) choisirType(t.dataset.type); }
    else if (/stage/i.test(txt)) choisirType("Stage"); else if (/vid[ée]o|trackman|analys/i.test(txt)) choisirType("Analyse vidéo / Trackman");
    else if (/initiation|jamais|d[ée]couvr/i.test(txt)) choisirType("Initiation");
    var nv = c.niveau || ""; if (!nv) NIV.forEach(function (n) { if (!nv && n[0].test(txt)) nv = n[1]; });
    if (nv) Array.prototype.forEach.call(F.niveau.options, function (o) { if (o.text === nv) F.niveau.value = nv; });
    if (c.eleves) F.eleves.value = String(Math.min(6, Math.max(1, +c.eleves || 1)));
    if (F.lieu.value) lancer().then(function () { setTimeout(function () { count.scrollIntoView({ behavior: "smooth", block: "start" }); }, 600); });
  }
  function envoie(txt) {
    txt = (txt || "").trim(); if (!txt || occupe) return; occupe = true;
    bulle("u", txt, true);
    var t = bulle("b", '<span class="typing"><i></i><i></i><i></i></span>');
    histo.push({ role: "user", content: "[Page cours de golf et pros] " + txt });
    var rep = "", crit = null, choix = null, err = null;
    fetch("/api/birdy", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: histo }) })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(function (b) {
        b.split("\n\n").forEach(function (l) {
          if (l.indexOf("data: ") !== 0) return;
          try { var o = JSON.parse(l.slice(6)); if (o.t != null) rep += String(o.t); if (o.cours) crit = o.cours; else if (o.golf && !crit) crit = o.golf; if (o.choix) choix = o.choix; if (o.erreur) err = o.erreur; } catch (e) {}
        });
        if (err || !rep.trim()) throw new Error(err || "vide");
        rep = rep.trim(); histo.push({ role: "assistant", content: rep });
        t.innerHTML = md(rep); say.scrollTop = say.scrollHeight; rapides(choix);
        var c = crit || BG.devine(txt); appliquer(c, txt);
      })
      .catch(function () {
        histo.pop(); var c = BG.devine(txt);
        t.textContent = c.lieu ? "Voici les golfs où prendre votre cours, juste à droite. Choisissez-en un pour envoyer votre demande." : "Dites-moi près de quelle ville vous souhaitez prendre votre cours, et votre niveau.";
        appliquer(c, txt);
      })
      .then(function () { occupe = false; });
  }
  document.getElementById("cp-ask").addEventListener("submit", function (ev) { ev.preventDefault(); var q = document.getElementById("cp-q"); envoie(q.value); q.value = ""; });
  sugg.addEventListener("click", function (ev) { var b = ev.target.closest && ev.target.closest("button"); if (b) envoie(b.textContent); });

  /* ---------- Démarrage ---------- */
  BG.charger().then(function (D) {
    var dl = document.getElementById("cp-villes");
    D.villes.slice(0, 300).forEach(function (v) { var o = document.createElement("option"); o.value = v[0]; dl.appendChild(o); });
    var P = new URLSearchParams(location.search);
    if (P.get("type")) choisirType(P.get("type"));
    if (P.get("lieu")) { F.lieu.value = P.get("lieu"); lancer(); }
    else {
      count.textContent = "Où voulez-vous prendre votre cours ?";
      var v = el("div", "cp-villes");
      ["Paris", "Lyon", "Bordeaux", "Marseille", "Nice", "Toulouse", "Nantes", "Lille"].forEach(function (n, k) {
        var b = el("button", "t3d", n); b.type = "button"; b.style.setProperty("--k", k);
        b.addEventListener("click", function () { F.lieu.value = n; lancer(); }); v.appendChild(b);
      });
      list.appendChild(v); t3d(list);
    }
  });
})();
