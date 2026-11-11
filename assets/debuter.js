/* Pôle « Débuter » : l'interface (hors scènes 3D, voir debuter3d.js).
   Birdy en coach dans un panneau flottant, trajectoires des clubs, score, étiquette, starter pack, lexique. */
(function () {
  "use strict";
  var D = JSON.parse(document.getElementById("db-data").textContent);
  var calme = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function sans(s) { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function chaque(l, f) { Array.prototype.forEach.call(l, f); }

  /* ---------- Birdy, coach flottant ---------- */
  var btn = document.getElementById("bc-btn"), pan = document.getElementById("bc-pan"), say = document.getElementById("db-say"),
    sugg = document.getElementById("db-sugg"), form = document.getElementById("db-form"), q = document.getElementById("db-q");
  var BG = window.BirdyGolf, histo = [], occupe = false;
  function ouvre(focus) {
    pan.hidden = false; requestAnimationFrame(function () { pan.classList.add("on"); });
    btn.setAttribute("aria-expanded", "true"); document.body.classList.add("bc-on");
    if (focus !== false) setTimeout(function () { q.focus({ preventScroll: true }); }, 250);
  }
  function ferme() { pan.classList.remove("on"); btn.setAttribute("aria-expanded", "false"); document.body.classList.remove("bc-on"); setTimeout(function () { if (!pan.classList.contains("on")) pan.hidden = true; }, 260); }
  btn.addEventListener("click", function () { if (pan.classList.contains("on")) ferme(); else ouvre(); });
  document.getElementById("bc-x").addEventListener("click", ferme);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && pan.classList.contains("on")) { ferme(); btn.focus(); } });
  function bas() { say.scrollTop = say.scrollHeight; }
  function bulle(cls, contenu, texte) {
    var d = el("div", "gm " + cls);
    if (texte) d.textContent = contenu; else if (typeof contenu === "string") d.innerHTML = contenu; else d.appendChild(contenu);
    say.appendChild(d); bas(); return d;
  }
  function rapides(l) {
    sugg.textContent = ""; if (!l || !l.length) return;
    l.slice(0, 4).forEach(function (x) { var b = el("button", null, String(x)); b.type = "button"; sugg.appendChild(b); });
  }
  // Texte de Birdy → HTML sûr ; seuls les liens internes du site sont cliquables
  function md(t) {
    var h = t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\*\*([^*\n]+)\*\*/g, "<b>$1</b>");
    h = h.replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, function (m, x, u) {
      if (u === "/#organiser") u = "/voyages/#organiser";
      return /^\/(golf|guides|parcours|cours|debuter)\/[\w\/?=&%.#-]*$|^\/voyages\/(#organiser)?$/.test(u) ? '<a href="' + u + '">' + x + "</a>" : x;
    });
    return h.replace(/^[-•] /gm, "• ").replace(/\n/g, "<br>");
  }
  // Initiation ou cours : renvoi vers l'onglet Cours avec un Pro, critères déjà remplis
  function carteCours(c) {
    var w = el("div", "ha-res"), a = el("a", "ha-go");
    a.href = "/cours/?" + (c.lieu ? "lieu=" + encodeURIComponent(c.lieu) + "&" : "") + "type=" + encodeURIComponent(c.type || "Initiation");
    a.textContent = c.lieu ? "Voir les golfs pour une initiation près de " + c.lieu + " →" : "Trouver une initiation →";
    w.appendChild(a); bulle("b ha-wrap", w);
  }
  // Premier parcours : les vrais golfs de la zone (annuaire officiel)
  function carteGolfs(c) {
    if (!BG) return;
    BG.chercher(c).then(function (r) {
      if (!r.zone) { bulle("b", "Je n’ai pas trouvé ce lieu. Pouvez-vous préciser la ville ou le département ?", true); return; }
      var w = el("div", "ha-res");
      r.res.slice(0, 3).forEach(function (o) {
        var a = el("a", "ha-g"); a.href = BG.url(Object.assign({}, c, { golf: o.g.i }));
        a.appendChild(el("b", null, o.g.n));
        a.appendChild(el("small", null, o.g.v + " (" + o.g.d + ") · " + BG.trousTxt(o.g).join(", ") + (o.dist != null ? " · " + Math.round(o.dist) + " km" : "")));
        a.appendChild(el("i", null, "Demander un départ"));
        w.appendChild(a);
      });
      var tout = el("a", "ha-go"); tout.href = BG.url(r.res.length ? c : Object.assign({}, c, { rayon: 100 }));
      tout.textContent = !r.res.length ? "Élargir la recherche sur la carte →" : "Voir tous les parcours sur la carte →";
      w.appendChild(tout); bulle("b ha-wrap", w);
    }).catch(function () {});
  }
  // Réponse de secours tirée de la page quand Birdy est indisponible : questions fréquentes, première étape ou lexique
  var SECOURS = [[/carte verte/, 2], [/gaucher/, 3], [/\b(age|enfants?|vieux|retraite|ans)\b/, 4], [/co[uû]te|prix|cher|tarif|budget/, 5],
    [/clubs?|materiel|acheter|equipement|starter/, 1], [/temps|longtemps|combien de (seances|cours|mois)/, 0]];
  function secours(txt) {
    var v = sans(txt), faq = document.querySelectorAll(".faq details p"), i;
    for (i = 0; i < SECOURS.length; i++) if (SECOURS[i][0].test(v) && faq[SECOURS[i][1]]) return faq[SECOURS[i][1]].textContent.replace(/^(Non|Oui)\. /, "");
    if (/commencer|debuter|par ou|premier|initiation/.test(v)) return "Commencez par une initiation. " + D.etapes[0].x;
    var mots = document.querySelectorAll(".lx-m");
    for (i = 0; i < mots.length; i++) {
      var m = sans(mots[i].textContent).split(" (")[0];
      if (m.length > 2 && new RegExp("\\b" + m.replace(/[-.]/g, ".") + "s?\\b").test(v)) return mots[i].textContent + " : " + mots[i].dataset.d;
    }
    return "";
  }
  function envoie(txt) {
    txt = (txt || "").trim(); if (!txt || occupe) return; occupe = true;
    bulle("u", txt, true); sugg.textContent = "";
    var t = bulle("b", '<span class="typing"><i></i><i></i><i></i></span>');
    histo.push({ role: "user", content: "[Page débuter le golf] " + txt });
    var rep = "", golf = null, cours = null, choix = null, err = null;
    fetch("/api/birdy", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: histo.slice(-16) }) })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(function (b) {
        b.split("\n\n").forEach(function (l) {
          if (l.indexOf("data: ") !== 0) return;
          try {
            var o = JSON.parse(l.slice(6));
            if (o.reset) rep = "";
            if (o.t != null) rep += String(o.t);
            if (o.golf) golf = o.golf; if (o.cours) cours = o.cours; if (o.choix) choix = o.choix; if (o.erreur) err = o.erreur;
          } catch (e) {}
        });
        if (err || !rep.trim()) throw new Error(err || "vide");
        rep = rep.trim(); histo.push({ role: "assistant", content: rep });
        t.innerHTML = md(rep); bas();
        if (cours) carteCours(cours); else if (golf && BG) carteGolfs(golf);
        rapides(choix);
      })
      .catch(function () {
        histo.pop();
        var loc = secours(txt);
        if (loc) { t.textContent = ""; t.appendChild(el("b", null, "Réponse du guide : ")); t.appendChild(document.createTextNode(loc)); }
        else t.textContent = "Birdy est très demandé aujourd’hui et ne peut pas répondre tout de suite. Le lexique et les questions fréquentes de cette page ont sûrement la réponse ; sinon, réessayez un peu plus tard.";
        rapides(["Par où commencer ?", "C’est quoi la carte verte ?", "Quels clubs pour débuter ?"]);
      })
      .then(function () { occupe = false; });
  }
  form.addEventListener("submit", function (ev) { ev.preventDefault(); envoie(q.value); q.value = ""; });
  sugg.addEventListener("click", function (ev) { var b = ev.target.closest && ev.target.closest("button"); if (b) envoie(b.textContent); });
  // Boutons « Demander à Birdy » de la page : le panneau s'ouvre et la question part
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest && ev.target.closest(".db-ask");
    if (b && b.dataset.q) { ouvre(false); setTimeout(function () { envoie(b.dataset.q); }, 200); }
  });

  /* ---------- Les clubs : une trajectoire par club ---------- */
  (function () {
    var tabs = document.getElementById("cl-tabs"); if (!tabs) return;
    var arc = document.getElementById("cl-arc"), balle = document.getElementById("cl-balle"), ombre = document.getElementById("cl-ombre"), drap = document.getElementById("cl-drap"),
      fant = document.getElementById("cl-fant"), loft = document.getElementById("cl-loft"), n = document.getElementById("cl-n"), x = document.getElementById("cl-x"), l = document.getElementById("cl-l");
    var X0 = 60, Y0 = 250, LARG = 690, HMAX = 215, NS = "http://www.w3.org/2000/svg", anim = 0;
    function chemin(c) { var x1 = X0 + c.d * LARG, h = c.h * HMAX; return { d: "M" + X0 + " " + Y0 + " Q" + ((X0 + x1) / 2) + " " + (Y0 - 2 * h) + " " + x1 + " " + Y0, x1: x1, h: h }; }
    // toutes les trajectoires en filigrane, pour comparer d'un coup d'œil
    D.clubs.forEach(function (c) { var p = document.createElementNS(NS, "path"); p.setAttribute("d", chemin(c).d); p.setAttribute("fill", "none"); p.setAttribute("stroke", "rgba(232,241,236,.16)"); p.setAttribute("stroke-width", "1.5"); p.dataset.c = c.id; fant.appendChild(p); });
    function choisit(id, joue) {
      var c = D.clubs.filter(function (k) { return k.id === id; })[0], ch = chemin(c);
      chaque(tabs.children, function (b) { b.setAttribute("aria-selected", b.dataset.c === id ? "true" : "false"); });
      chaque(fant.children, function (p) { p.style.opacity = p.dataset.c === id ? 0 : 1; });
      n.textContent = c.n; x.textContent = c.x; l.textContent = "Face inclinée d’environ " + c.loft + "°";
      loft.setAttribute("transform", "rotate(" + c.loft + " 30 76)");
      arc.setAttribute("d", ch.d); drap.setAttribute("transform", "translate(" + ch.x1 + " " + Y0 + ")");
      cancelAnimationFrame(anim);
      var L = arc.getTotalLength(), t0 = null, dur = 700 + c.d * 900;
      function pose(k) { var p = arc.getPointAtLength(L * k); balle.setAttribute("cx", p.x); balle.setAttribute("cy", p.y - 6); ombre.setAttribute("cx", p.x); ombre.setAttribute("opacity", 1 - Math.min(0.8, (Y0 - p.y) / 260)); }
      if (!joue || calme) { pose(1); return; }
      pose(0);
      anim = requestAnimationFrame(function pas(now) { if (t0 == null) t0 = now + 180; var k = Math.max(0, Math.min(1, (now - t0) / dur)); pose(k); if (k < 1) anim = requestAnimationFrame(pas); });
    }
    tabs.addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) choisit(b.dataset.c, true); });
    choisit("fer7", false);
    if (window.IntersectionObserver && !calme) { var io = new IntersectionObserver(function (e) { if (e[0].isIntersecting) { io.disconnect(); choisit("fer7", true); } }, { threshold: 0.5 }); io.observe(document.getElementById("cl-svg")); }
  })();

  /* ---------- Le score : un compteur sur un par 4 ---------- */
  (function () {
    var nb = document.getElementById("sc-n"); if (!nb) return;
    var nom = document.getElementById("sc-nom"), x = document.getElementById("sc-x"), v = 4, PAR = 4;
    var NOMS = { "-3": ["Albatros", "Trois coups sous le par : rarissime."], "-2": ["Eagle", "Deux coups sous le par : exceptionnel."], "-1": ["Birdie", "Un coup sous le par : bravo !"],
      "0": ["Par", "Pile le score prévu."], "1": ["Bogey", "Un coup au-dessus du par : très correct quand on débute."], "2": ["Double bogey", "Deux coups au-dessus du par."], "3": ["Triple bogey", "Trois coups au-dessus du par."] };
    function maj() {
      var d = v - PAR, o = NOMS[d] || ["+" + d, "En partie amicale, relevez la balle et passez au trou suivant."];
      if (v === 1) o = ["Trou en un", "La balle rentre dès le premier coup !"];
      nb.textContent = v; nom.textContent = o[0]; x.textContent = o[1];
      nom.className = "sc-nom " + (d < 0 ? "bon" : d === 0 ? "" : "haut"); nom.classList.remove("pop"); void nom.offsetWidth; nom.classList.add("pop");
    }
    document.getElementById("sc-plus").addEventListener("click", function () { if (v < 10) { v++; maj(); } });
    document.getElementById("sc-moins").addEventListener("click", function () { if (v > 1) { v--; maj(); } });
  })();

  /* ---------- L'étiquette : cartes qui se retournent ---------- */
  chaque(document.querySelectorAll(".et-c"), function (c) {
    c.addEventListener("click", function () { c.setAttribute("aria-pressed", c.getAttribute("aria-pressed") === "true" ? "false" : "true"); });
  });

  /* ---------- Starter pack : onglets et cases gardées sur l'appareil ---------- */
  (function () {
    var tabs = document.getElementById("pk-tabs"); if (!tabs) return;
    var groupes = document.querySelectorAll(".pk-g"), cases = document.querySelectorAll(".pk-i input"), bar = document.getElementById("pk-bar"), compte = document.getElementById("pk-compte");
    var CLE = "birdy-starter-pack", etat = {};
    try { etat = JSON.parse(localStorage.getItem(CLE) || "{}") || {}; } catch (e) { etat = {}; }
    tabs.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      chaque(tabs.children, function (x) { x.setAttribute("aria-selected", x === b ? "true" : "false"); });
      chaque(groupes, function (g) { g.hidden = g.dataset.g !== b.dataset.g; });
    });
    function maj() {
      var n = 0; chaque(cases, function (c) { if (c.checked) n++; });
      bar.style.width = (cases.length ? Math.round(n / cases.length * 100) : 0) + "%"; compte.textContent = n + " sur " + cases.length;
    }
    chaque(cases, function (c) {
      c.checked = !!etat[c.dataset.id];
      c.addEventListener("change", function () {
        if (c.checked) etat[c.dataset.id] = 1; else delete etat[c.dataset.id];
        try { localStorage.setItem(CLE, JSON.stringify(etat)); } catch (e) {}
        maj();
      });
    });
    maj();
  })();

  /* ---------- Lexique : toucher un mot, ou le chercher ---------- */
  (function () {
    var box = document.getElementById("lx-mots"); if (!box) return;
    var champ = document.getElementById("lx-q"), def = document.getElementById("lx-def"), vide = document.getElementById("lx-vide"), ask = document.getElementById("lx-ask"), mots = box.children;
    function montre(b) {
      chaque(mots, function (m) { m.classList.toggle("on", m === b); });
      def.textContent = ""; def.appendChild(el("b", null, b.textContent)); def.appendChild(document.createTextNode(b.dataset.d));
      def.classList.remove("pop"); void def.offsetWidth; def.classList.add("pop");
    }
    box.addEventListener("click", function (e) { var b = e.target.closest(".lx-m"); if (b) montre(b); });
    champ.addEventListener("input", function () {
      var v = sans(champ.value.trim()), vus = [];
      chaque(mots, function (m) { var ok = !v || sans(m.textContent + " " + m.dataset.d).indexOf(v) > -1; m.hidden = !ok; if (ok) vus.push(m); });
      vide.hidden = vus.length > 0; def.hidden = !vus.length;
      if (!vus.length) ask.dataset.q = "Que veut dire « " + champ.value.trim().slice(0, 60) + " » au golf ?";
      else if (v) { var exact = vus.filter(function (m) { return sans(m.textContent).indexOf(v) === 0; })[0]; montre(exact || vus[0]); }
    });
  })();

  /* ---------- Apparition des sections au défilement ---------- */
  if (window.IntersectionObserver && !calme) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("vu"); io.unobserve(e.target); } }); }, { threshold: 0.12 });
    chaque(document.querySelectorAll(".db-sec"), function (s) { s.classList.add("att"); io.observe(s); });
  }
})();
