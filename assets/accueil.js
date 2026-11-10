/* Page d'accueil : le grand chat Birdy. Birdy répond à tout et oriente vers les pôles
   (Voyages, Réserver un parcours, Cours avec un Pro) avec de vraies cartes cliquables. */
(function () {
  "use strict";
  var say = document.getElementById("ha-say"), sugg = document.getElementById("ha-sugg"),
    form = document.getElementById("ha-ask"), q = document.getElementById("ha-q"), logo = document.getElementById("ha-logo"),
    chat = document.getElementById("ha-chat");
  if (!say || !form) return;
  var BG = window.BirdyGolf, histo = [], occupe = false;
  var calme = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var GROUPES = ["2 à 4 personnes", "5 à 8 personnes", "9 à 16 personnes", "17 personnes ou plus"];
  var PERIODES = ["au printemps", "en été", "en automne", "en hiver", "à des dates flexibles"];
  var BUDGETS = ["moins de 800 €", "800 à 1 500 €", "1 500 à 2 500 €", "plus de 2 500 €", "à définir ensemble"];
  var projet = {}; // séjour en cours de discussion (groupe, période, budget, destination)

  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
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
  // Texte de Birdy → HTML sûr. Seuls les liens internes du site sont cliquables. Retient les destinations citées.
  function md(t, dests) {
    var h = t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\*\*([^*\n]+)\*\*/g, "<b>$1</b>");
    h = h.replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, function (m, x, u) {
      if (u === "/#organiser") u = "/voyages/#organiser";
      if (!/^\/(golf|guides|parcours|cours)\/[\w\/?=&%.-]*$|^\/voyages\/(#organiser)?$/.test(u)) return x;
      if (dests && /^\/golf\/[\w-]+$/.test(u)) dests.push(x.replace(/<[^>]+>/g, ""));
      return '<a href="' + u + '">' + x + "</a>";
    });
    return h.replace(/^[-•] /gm, "• ").replace(/\n/g, "<br>");
  }

  /* ---------- Cartes sous la réponse ---------- */
  // Parcours : les vrais golfs de la zone (annuaire officiel), comme sur la page Réserver un parcours
  function carteGolfs(c, deduit, sinon) {
    if (!BG) return;
    BG.chercher(c).then(function (r) {
      // Lieu deviné à partir de la phrase et introuvable : ce n'était pas une recherche de parcours, on traite la réponse comme un voyage
      if (!r.zone) { if (!deduit) bulle("b", "Je n’ai pas trouvé ce lieu. Pouvez-vous préciser la ville ou le département ?", true); else if (sinon) sinon(); return; }
      var w = el("div", "ha-res");
      r.res.slice(0, 3).forEach(function (o) {
        var a = el("a", "ha-g"); a.href = BG.url(Object.assign({}, c, { golf: o.g.i }));
        a.appendChild(el("b", null, o.g.n));
        a.appendChild(el("i", null, "Demander un départ"));
        a.appendChild(el("small", null, o.g.v + " (" + o.g.d + ") · " + BG.trousTxt(o.g).join(", ") + (o.dist != null ? " · " + Math.round(o.dist) + " km" : "")));
        w.appendChild(a);
      });
      var tout = el("a", "ha-go"); tout.href = BG.url(r.res.length ? c : Object.assign({}, c, { rayon: 100 }));
      tout.textContent = !r.res.length ? "Élargir la recherche sur la carte →" : r.res.length > 3 ? "Voir les " + r.res.length + " parcours sur la carte →" : "Voir sur la carte →";
      w.appendChild(tout);
      bulle("b ha-wrap", w);
    }).catch(function () {});
  }
  // Cours : renvoi vers la page Cours avec un Pro, critères déjà remplis
  function carteCours(c) {
    var w = el("div", "ha-res"), a = el("a", "ha-go");
    a.href = "/cours/?" + (c.lieu ? "lieu=" + encodeURIComponent(c.lieu) + "&" : "") + (c.type ? "type=" + encodeURIComponent(c.type) : "");
    a.textContent = c.lieu ? "Voir les golfs pour un cours près de " + c.lieu + " →" : "Trouver un cours de golf →";
    w.appendChild(a); bulle("b ha-wrap", w);
  }
  // Voyage : renvoi vers l'onglet Voyages, formulaire déjà rempli avec ce que Birdy a compris
  function majProjet(f, dests) {
    if (f) {
      var n = +f.nb || 0;
      if (n > 0) projet.groupe = GROUPES[n <= 4 ? 0 : n <= 8 ? 1 : n <= 16 ? 2 : 3]; else if (GROUPES.indexOf(f.groupe) > -1) projet.groupe = f.groupe;
      if (PERIODES.indexOf(f.periode) > -1) projet.periode = f.periode;
      if (BUDGETS.indexOf(f.budget) > -1) projet.budget = f.budget;
      if (f.destination) projet.destination = String(f.destination).slice(0, 60);
    }
    // Une seule destination citée : c'est celle du projet. Plusieurs : le visiteur choisira dans le formulaire.
    if (dests && dests.length === 1) projet.destination = dests[0];
  }
  function carteVoyage() {
    var p = new URLSearchParams(), d = projet.destination;
    if (d) p.set("dest", d);
    ["groupe", "periode", "budget"].forEach(function (k) { if (projet[k]) p.set(k, projet[k]); });
    var w = el("div", "ha-res"), a = el("a", "ha-go");
    a.href = "/voyages/" + (p.toString() ? "?" + p.toString() : "") + "#organiser";
    a.textContent = "Préparer ma demande de séjour →";
    w.appendChild(a);
    var v = el("a", "ha-go alt", "Voir les destinations en photos"); v.href = "/golf/"; w.appendChild(v);
    w.style.gridAutoFlow = "column"; w.style.justifyContent = "start";
    bulle("b ha-wrap", w);
  }

  /* ---------- Échange avec Birdy ---------- */
  function envoie(txt) {
    txt = (txt || "").trim(); if (!txt || occupe) return; occupe = true;
    bulle("u", txt, true); sugg.textContent = "";
    var t = bulle("b", '<span class="typing"><i></i><i></i><i></i></span>');
    if (logo) logo.classList.add("pense");
    histo.push({ role: "user", content: txt });
    var rep = "", golf = null, cours = null, fiche = null, choix = null, err = null;
    fetch("/api/birdy", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: histo.slice(-16) }) })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(function (b) {
        b.split("\n\n").forEach(function (l) {
          if (l.indexOf("data: ") !== 0) return;
          try {
            var o = JSON.parse(l.slice(6));
            if (o.reset) rep = "";
            if (o.t != null) rep += String(o.t);
            if (o.golf) golf = o.golf; if (o.cours) cours = o.cours; if (o.fiche) fiche = o.fiche;
            if (o.choix) choix = o.choix; if (o.erreur) err = o.erreur;
          } catch (e) {}
        });
        if (err || !rep.trim()) throw new Error(err || "vide");
        rep = rep.trim(); histo.push({ role: "assistant", content: rep });
        var dests = []; t.innerHTML = md(rep, dests); bas();
        // Secours : Birdy parle de parcours sans donner de critères → on déduit le lieu de la phrase du visiteur
        // Voyage : Birdy cite des destinations (liens /golf/…) ou remplit la fiche du séjour
        var aDest = dests.length > 0;
        var ficheVoyage = fiche && (fiche.nb || fiche.groupe || fiche.periode || fiche.budget || fiche.destination);
        function voyage() { majProjet(fiche, dests); if (aDest || ficheVoyage) carteVoyage(); }
        var deduit = false;
        if (aDest) golf = null; // des destinations de voyage : ce n'est pas une recherche de parcours en France
        // Secours : Birdy parle de parcours sans donner de critères → on déduit le lieu de la phrase du visiteur
        if (!golf && !cours && !aDest && BG && /18 trous|9 trous|parcours|partie|jouer|green.?fee|d[ée]part/i.test(txt) && /parcours/i.test(rep)) {
          var dv = BG.devine(txt); if (dv.lieu) { golf = dv; deduit = true; }
        }
        if (cours) carteCours(cours);
        else if (golf && BG) { var dt = BG.dateDe && BG.dateDe(txt); if (dt) golf.date = dt; carteGolfs(golf, deduit, voyage); }
        else voyage();
        rapides(choix);
      })
      .catch(function () {
        histo.pop();
        // Birdy indisponible : on oriente quand même vers le bon onglet
        var dv = BG ? BG.devine(txt) : {};
        if (/cours|le[çc]on|stage|pro\b|d[ée]but|initiation|apprendre/i.test(txt)) { t.textContent = "Je vous montre où prendre un cours de golf."; carteCours({ lieu: dv.lieu }); }
        else if (dv.lieu && BG) { t.textContent = "Voici les parcours de la liste officielle autour de " + dv.lieu + "."; carteGolfs(dv); }
        else {
          t.textContent = "Je n’arrive pas à répondre pour l’instant. Choisissez ce que vous cherchez, ou réessayez dans un instant.";
          rapides(["Un voyage golf en groupe", "Un parcours près de chez moi", "Un cours de golf"]);
          var w = el("div", "ha-res"); w.style.gridAutoFlow = "column"; w.style.justifyContent = "start";
          [["/voyages/", "Voyages"], ["/parcours/", "Réserver un parcours"], ["/cours/", "Cours avec un Pro"]].forEach(function (x) { var a = el("a", "ha-go alt", x[1]); a.href = x[0]; w.appendChild(a); });
          bulle("b ha-wrap", w);
        }
      })
      .then(function () { occupe = false; if (logo) logo.classList.remove("pense"); });
  }
  form.addEventListener("submit", function (ev) { ev.preventDefault(); envoie(q.value); q.value = ""; });
  sugg.addEventListener("click", function (ev) { var b = ev.target.closest && ev.target.closest("button"); if (b) envoie(b.textContent); });

  /* ---------- Reste de la page : exemples et boutons « Parler à Birdy » ---------- */
  function versChat(apres) {
    chat.scrollIntoView({ behavior: calme ? "auto" : "smooth", block: "center" });
    setTimeout(function () { if (apres) apres(); else q.focus({ preventScroll: true }); }, calme ? 0 : 450);
  }
  Array.prototype.forEach.call(document.querySelectorAll(".ha-ex"), function (b) {
    b.addEventListener("click", function () { var x = b.textContent; versChat(function () { envoie(x); }); });
  });
  ["ha-parler", "ha-parler2"].forEach(function (id) {
    var a = document.getElementById(id); if (a) a.addEventListener("click", function (ev) { ev.preventDefault(); versChat(); });
  });

  /* ---------- Texte d'exemple qui change dans la zone de saisie ---------- */
  var EX = ["Écrivez à Birdy…", "Je débute, par où commencer ?", "Un 18 trous près de Lyon samedi", "8 amis au soleil en mars", "Un cours près de Bordeaux", "C’est quoi un birdie ?"], ie = 0;
  if (!calme) setInterval(function () { if (document.activeElement !== q && !q.value) { ie = (ie + 1) % EX.length; q.placeholder = EX[ie]; } }, 3200);

  /* ---------- Cartes des pôles : inclinaison 3D au survol ---------- */
  if (!calme && !matchMedia("(hover: none)").matches) {
    Array.prototype.forEach.call(document.querySelectorAll(".t3d"), function (c) {
      c.addEventListener("pointermove", function (ev) {
        var r = c.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
        c.style.transform = "perspective(900px) rotateY(" + ((x - 0.5) * 12) + "deg) rotateX(" + ((0.5 - y) * 10) + "deg) translateZ(6px)";
        c.style.setProperty("--gx", (x * 100) + "%"); c.style.setProperty("--gy", (y * 100) + "%");
      });
      c.addEventListener("pointerleave", function () { c.style.transform = ""; });
    });
  }
})();
