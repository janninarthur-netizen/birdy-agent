/* Version mobile condensée (écrans de moins de 768 px) : complète assets/mobile.css.
   Ne fait rien sur ordinateur. Tout ce qu'il ajoute porte la classe .m-only, masquée à partir de 768 px,
   et tout le contenu reste dans la page (rien n'est supprimé, utile pour Google). */
(function () {
  "use strict";
  var MQ = matchMedia("(max-width: 767px)");
  if (!MQ.matches) return;
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function chaque(l, f) { Array.prototype.forEach.call(l, f); }
  var main = document.querySelector("main") || document.body;

  function lance() {
    /* ---------- En-tête : logo, bouton d'action adapté à la page, menu ---------- */
    var cta = document.querySelector('.top .btn.gold.sm[href="/voyages/#organiser"]'), chemin = location.pathname;
    if (cta) {
      var cible = null;
      if (/^\/parcours\/?$/.test(chemin) && document.getElementById("gp-f")) cible = ["Trouver un départ", "#gp-f"];
      else if (/^\/parcours\//.test(chemin)) cible = ["Réserver un départ", "/parcours/"];
      else if (/^\/cours\//.test(chemin) && document.getElementById("cp-f")) cible = ["Trouver un cours", "#cp-f"];
      else if (/^\/debuter\//.test(chemin) && document.getElementById("bc-place")) cible = ["Poser une question", "#bc-place"];
      if (cible) { cta.textContent = cible[0]; cta.setAttribute("href", cible[1]); }
    }

    /* ---------- Carrousels : points indicateurs sous chaque piste ---------- */
    chaque(document.querySelectorAll(".mc-grid,.ha-poles,.ha-qui,.poles-grid,.who-grid,.cp-types,.gp-mosa,.et-grid"), function (piste) {
      var n = piste.children.length; if (n < 2 || piste.dataset.mDots) return; piste.dataset.mDots = "1";
      // jusqu'à 7 cartes : des points ; au-delà : une fine barre de progression
      if (n > 7) {
        var barre = el("div", "m-barre m-only"), cur = el("i"); barre.setAttribute("aria-hidden", "true"); barre.appendChild(cur);
        piste.parentNode.insertBefore(barre, piste.nextSibling);
        var majB = function () { var m = piste.scrollWidth - piste.clientWidth, f = m > 0 ? piste.scrollLeft / m : 0, l = piste.clientWidth / piste.scrollWidth;
          cur.style.width = (l * 100).toFixed(1) + "%"; cur.style.marginLeft = (f * (1 - l) * 100).toFixed(1) + "%"; };
        piste.addEventListener("scroll", majB, { passive: true }); majB(); return;
      }
      var dots = el("div", "m-dots m-only"); dots.setAttribute("aria-hidden", "true");
      for (var i = 0; i < n; i++) dots.appendChild(el("i", i ? "" : "on"));
      piste.parentNode.insertBefore(dots, piste.nextSibling);
      var maj = function () {
        var w = piste.firstElementChild ? piste.firstElementChild.getBoundingClientRect().width + 12 : 1;
        var k = Math.min(n - 1, Math.round(piste.scrollLeft / w));
        if (piste.scrollLeft + piste.clientWidth >= piste.scrollWidth - 4) k = n - 1;
        chaque(dots.children, function (d, j) { d.classList.toggle("on", j === k); });
      };
      piste.addEventListener("scroll", maj, { passive: true });
    });
    // Accueil : le pôle choisi dans la scène 3D défile jusqu'à sa carte
    var poles = document.getElementById("ha-poles");
    if (poles && window.MutationObserver) new MutationObserver(function () {
      var a = poles.querySelector(".ha-pole.actif"); if (a) poles.scrollTo({ left: a.offsetLeft - 16, behavior: "smooth" });
    }).observe(poles, { subtree: true, attributes: true, attributeFilter: ["class"] });

    /* ---------- Onglets : page des destinations, une région à la fois ---------- */
    var regions = Array.prototype.filter.call(main.querySelectorAll("section[id]"), function (s) {
      var g = s.querySelector(".mc-grid"); return g && g.children.length >= 2 && s.querySelector("h2");
    });
    if (regions.length >= 4) {
      var wrap = el("div", "m-tabs-wrap m-only"), tabs = el("div", "m-tabs"); tabs.setAttribute("role", "tablist"); tabs.setAttribute("aria-label", "Régions");
      wrap.appendChild(tabs);
      var choisir = function (i, defile) {
        regions.forEach(function (s, j) { s.classList.toggle("m-tab-cache", j !== i); tabs.children[j].setAttribute("aria-selected", j === i ? "true" : "false"); });
        tabs.children[i].scrollIntoView({ inline: "center", block: "nearest" });
        if (defile) { var y = wrap.getBoundingClientRect().top + scrollY - 66; if (scrollY > y) scrollTo({ top: y, behavior: "smooth" }); }
      };
      regions.forEach(function (s, i) {
        var b = el("button", null, s.querySelector("h2").textContent); b.type = "button"; b.setAttribute("role", "tab");
        b.appendChild(el("small", null, String(s.querySelector(".mc-grid").children.length)));
        b.addEventListener("click", function () { choisir(i, true); }); tabs.appendChild(b);
      });
      regions[0].parentNode.insertBefore(wrap, regions[0]);
      wrap.style.background = getComputedStyle(regions[0]).backgroundColor;
      var h = location.hash && regions.findIndex(function (s) { return "#" + s.id === location.hash; });
      choisir(h > 0 ? h : 0, false);
    }

    /* ---------- Textes longs : repliés avec « Lire la suite » ---------- */
    chaque(main.querySelectorAll(".txt"), function (t) {
      if (t.offsetHeight < 560 || t.closest(".m-repli")) return;
      t.classList.add("m-repli");
      var b = el("button", "m-plus m-only", "Lire la suite"); b.type = "button"; b.setAttribute("aria-expanded", "false");
      b.addEventListener("click", function () {
        var o = t.classList.toggle("m-ouvert"); b.setAttribute("aria-expanded", o ? "true" : "false"); b.firstChild.textContent = o ? "Réduire" : "Lire la suite";
        if (!o) t.scrollIntoView({ block: "start", behavior: "smooth" });
      });
      t.parentNode.insertBefore(b, t.nextSibling);
    });

    /* ---------- Longues listes de liens : les 8 premiers, puis « Voir tout » ---------- */
    function raccourcit(liste, libelle) {
      liste.classList.add("m-court");
      var b = el("button", "m-plus m-only", libelle); b.type = "button"; b.setAttribute("aria-expanded", "false");
      b.addEventListener("click", function () {
        var o = liste.classList.toggle("m-ouvert"); b.setAttribute("aria-expanded", o ? "true" : "false"); b.firstChild.textContent = o ? "Réduire" : libelle;
      });
      liste.parentNode.insertBefore(b, liste.nextSibling);
      return b;
    }
    chaque(main.querySelectorAll(".others"), function (l) { if (l.children.length > 10) raccourcit(l, "Voir tout (" + l.children.length + ")"); });
    var lx = document.getElementById("lx-mots");
    if (lx) {
      var bl = raccourcit(lx, "Voir les " + lx.children.length + " mots");
      var q = document.getElementById("lx-q");
      if (q) q.addEventListener("input", function () { if (q.value.trim() && !lx.classList.contains("m-ouvert")) bl.click(); });
    }

    /* ---------- « Toutes nos destinations » (Voyages) en accordéons ---------- */
    chaque(document.querySelectorAll(".alld-cols>div"), function (d) {
      var h = d.querySelector("h3"), ul = d.querySelector("ul"); if (!h || !ul) return;
      h.setAttribute("role", "button"); h.tabIndex = 0; h.setAttribute("aria-expanded", "false");
      var bascule = function () { var o = d.classList.toggle("m-ouvert"); h.setAttribute("aria-expanded", o ? "true" : "false"); };
      h.addEventListener("click", bascule);
      h.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); bascule(); } });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", lance); else lance();
})();
