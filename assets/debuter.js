/* Pôle « Débuter » : Birdy en coach, fiches, lexique et starter pack à cocher. */
(function () {
  "use strict";
  var say = document.getElementById("db-say"), sugg = document.getElementById("db-sugg"),
    form = document.getElementById("db-form"), q = document.getElementById("db-q");
  if (!say || !form) return;
  var BG = window.BirdyGolf, histo = [], occupe = false;
  var calme = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }

  /* ---------- Chat Birdy ---------- */
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
  function carteGolfs(c, deduit) {
    if (!BG) return;
    BG.chercher(c).then(function (r) {
      if (!r.zone) { if (!deduit) bulle("b", "Je n’ai pas trouvé ce lieu. Pouvez-vous préciser la ville ou le département ?", true); return; }
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
        if (cours) carteCours(cours);
        else if (golf && BG) carteGolfs(golf, false);
        rapides(choix);
      })
      .catch(function () {
        histo.pop();
        // Birdy indisponible (quota gratuit du jour atteint, panne) : on répond avec le guide de la page
        var loc = secours(txt);
        if (loc) { t.textContent = ""; t.appendChild(el("b", null, "Réponse du guide : ")); t.appendChild(document.createTextNode(loc)); }
        else t.textContent = "Birdy est très demandé aujourd’hui et ne peut pas répondre tout de suite. Les fiches, le lexique et les questions fréquentes de cette page ont sûrement la réponse ; sinon, réessayez un peu plus tard.";
        rapides(["Par où commencer ?", "C’est quoi la carte verte ?", "Quels clubs pour débuter ?"]);
      })
      .then(function () { occupe = false; });
  }
  // Réponse de secours tirée de la page : questions fréquentes, première étape ou lexique
  var SECOURS = [[/carte verte/, 2], [/gaucher/, 3], [/\b(age|enfants?|vieux|retraite|ans)\b/, 4], [/co[uû]te|prix|cher|tarif|budget/, 5],
    [/clubs?|materiel|acheter|equipement|starter/, 1], [/temps|longtemps|combien de (seances|cours|mois)/, 0]];
  function secours(txt) {
    var v = txt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""), faq = document.querySelectorAll(".faq details p"), i;
    for (i = 0; i < SECOURS.length; i++) if (SECOURS[i][0].test(v) && faq[SECOURS[i][1]]) return faq[SECOURS[i][1]].textContent;
    if (/commencer|debuter|par ou|premier|initiation/.test(v)) { var e1 = document.querySelector(".db-step p"); if (e1) return "Commencez par une initiation. " + e1.textContent; }
    var mots = document.querySelectorAll(".db-mot");
    for (i = 0; i < mots.length; i++) {
      var m = mots[i].querySelector("dt").textContent.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(" (")[0];
      if (m.length > 2 && new RegExp("\\b" + m.replace(/[-.]/g, ".") + "s?\\b").test(v)) return mots[i].querySelector("dt").textContent + " : " + mots[i].querySelector("dd").textContent;
    }
    return "";
  }
  form.addEventListener("submit", function (ev) { ev.preventDefault(); envoie(q.value); q.value = ""; });
  sugg.addEventListener("click", function (ev) { var b = ev.target.closest && ev.target.closest("button"); if (b) envoie(b.textContent); });
  // Boutons « Demander à Birdy » de la page : la question part dans le chat (qui est remonté à l'écran sur mobile)
  function demande(txt) {
    var chat = say.closest(".gp-chat"), r = chat.getBoundingClientRect();
    if (r.top < 60 || r.bottom > innerHeight) chat.scrollIntoView({ behavior: calme ? "auto" : "smooth", block: "center" });
    setTimeout(function () { envoie(txt); }, calme ? 0 : 350);
  }
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest && ev.target.closest(".db-ask"); if (b && b.dataset.q) demande(b.dataset.q);
  });

  /* ---------- Fiches : un lien vers une fiche (#fiche-…) l'ouvre ---------- */
  function ouvre() {
    var f = location.hash.indexOf("#fiche-") === 0 && document.getElementById(location.hash.slice(1));
    if (f) { f.open = true; f.scrollIntoView({ behavior: calme ? "auto" : "smooth", block: "center" }); }
  }
  addEventListener("hashchange", ouvre); ouvre();

  /* ---------- Lexique : recherche d'un mot ---------- */
  var champ = document.getElementById("db-mot"), mots = document.querySelectorAll(".db-mot"), vide = document.getElementById("db-vide"), videAsk = document.getElementById("db-vide-ask");
  function norm(s) { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  var liste = document.getElementById("db-lexique"), tout = document.getElementById("db-tout");
  // Le lexique est replié par défaut (les premiers mots) ; le bouton ou une recherche l'ouvre
  if (tout) tout.addEventListener("click", function () { liste.classList.remove("court"); tout.hidden = true; });
  if (champ) champ.addEventListener("input", function () {
    var v = norm(champ.value.trim()), n = 0;
    liste.classList.toggle("cherche", !!v); if (tout) tout.hidden = !!v || !liste.classList.contains("court");
    Array.prototype.forEach.call(mots, function (m) {
      var ok = !v || norm(m.textContent).indexOf(v) > -1; m.hidden = !ok; if (ok) n++;
    });
    vide.hidden = n > 0;
    if (!n) videAsk.dataset.q = "Que veut dire « " + champ.value.trim().slice(0, 60) + " » au golf ?";
  });

  /* ---------- Starter pack : cases à cocher gardées sur l'appareil ---------- */
  var cases = document.querySelectorAll(".db-pack input[type=checkbox]"), bar = document.getElementById("db-bar"), compte = document.getElementById("db-compte");
  var CLE = "birdy-starter-pack", etat = {};
  try { etat = JSON.parse(localStorage.getItem(CLE) || "{}") || {}; } catch (e) { etat = {}; }
  function maj() {
    var n = 0; Array.prototype.forEach.call(cases, function (c) { if (c.checked) n++; });
    if (bar) bar.style.width = (cases.length ? Math.round(n / cases.length * 100) : 0) + "%";
    if (compte) compte.textContent = n + " sur " + cases.length;
  }
  Array.prototype.forEach.call(cases, function (c) {
    c.checked = !!etat[c.dataset.id];
    c.addEventListener("change", function () {
      if (c.checked) etat[c.dataset.id] = 1; else delete etat[c.dataset.id];
      try { localStorage.setItem(CLE, JSON.stringify(etat)); } catch (e) {}
      maj();
    });
  });
  maj();

  /* ---------- Étapes : inclinaison 3D au survol ---------- */
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
