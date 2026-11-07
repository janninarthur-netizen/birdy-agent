/* Menu mobile commun à toutes les pages : bouton ☰ dans l'en-tête, panneau avec les deux pôles. */
(function () {
  "use strict";
  var top = document.querySelector(".top .in");
  if (!top || document.getElementById("mb-btn")) return;
  var css = document.createElement("style");
  css.textContent =
    ".mb-btn{display:none;width:46px;height:46px;flex:none;border-radius:50%;border:1px solid rgba(255,255,255,.28);background:rgba(255,255,255,.08);color:#fff;cursor:pointer;align-items:center;justify-content:center;position:relative;z-index:31}" +
    ".mb-btn span,.mb-btn span:before,.mb-btn span:after{display:block;width:18px;height:2px;background:#fff;border-radius:2px;position:relative;transition:transform .25s,background .25s}" +
    ".mb-btn span:before,.mb-btn span:after{content:'';position:absolute;left:0}.mb-btn span:before{top:-6px}.mb-btn span:after{top:6px}" +
    ".mb-btn[aria-expanded=true] span{background:transparent}.mb-btn[aria-expanded=true] span:before{transform:translateY(6px) rotate(45deg)}.mb-btn[aria-expanded=true] span:after{transform:translateY(-6px) rotate(-45deg)}" +
    ".mb-pan{position:fixed;inset:0;z-index:30;background:rgba(8,24,18,.97);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);display:flex;flex-direction:column;gap:10px;padding:calc(96px + env(safe-area-inset-top,0px)) max(20px,env(safe-area-inset-right,0px)) 28px max(20px,env(safe-area-inset-left,0px));overflow:auto;opacity:0;visibility:hidden;transition:opacity .25s,visibility .25s}" +
    ".mb-pan.on{opacity:1;visibility:visible}" +
    ".mb-pan a{color:#fff;text-decoration:none}" +
    ".mb-pole{display:block;border:1px solid rgba(208,228,220,.22);border-radius:18px;padding:16px 18px;background:linear-gradient(160deg,rgba(163,201,184,.14),rgba(255,255,255,.03))}" +
    ".mb-pole small{display:block;font:600 11.5px/1.2 'Instrument Sans',system-ui,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#A3C9B8;margin-bottom:4px}" +
    ".mb-pole b{display:block;font:700 24px/1.15 'Cormorant Garamond',Georgia,serif}" +
    ".mb-pole em{display:block;font-style:normal;font-size:14px;color:rgba(232,241,236,.75);margin-top:3px}" +
    ".mb-l{display:flex;flex-direction:column;margin-top:6px}.mb-l a{font:500 17px/1 'Instrument Sans',system-ui,sans-serif;padding:15px 4px;border-bottom:1px solid rgba(255,255,255,.08)}" +
    ".mb-c{display:flex;gap:10px;margin-top:auto;padding-top:18px}.mb-c a{flex:1;text-align:center;font:600 15px/1 'Instrument Sans',system-ui,sans-serif;padding:15px;border-radius:99px;border:1px solid rgba(255,255,255,.25)}.mb-c a.mb-wa{background:#25D366;border-color:#25D366}" +
    "body.mb-open{overflow:hidden}body.mb-open .top{z-index:32}body.mb-open a.wa,body.mb-open .wa-float,body.mb-open .whatsapp{display:none!important}" +
    "@media (max-width:900px){.mb-btn{display:inline-flex}.top nav a:not(.btn),.top .links{display:none!important}}" +
    "@media (max-width:420px){.top .btn.sm{padding:10px 13px;font-size:13px}}";
  document.head.appendChild(css);
  var btn = document.createElement("button");
  btn.type = "button"; btn.id = "mb-btn"; btn.className = "mb-btn";
  btn.setAttribute("aria-label", "Menu"); btn.setAttribute("aria-expanded", "false"); btn.setAttribute("aria-controls", "mb-pan");
  btn.innerHTML = "<span></span>";
  var pan = document.createElement("nav");
  pan.id = "mb-pan"; pan.className = "mb-pan"; pan.setAttribute("aria-label", "Menu principal");
  var accueil = location.pathname === "/" || location.pathname === "/index.html";
  pan.innerHTML =
    '<a class="mb-pole" href="' + (accueil ? "#organiser" : "/#organiser") + '"><small>Birdy Travel</small><b>Voyages golf de groupe</b><em>55 destinations, un conseiller obtient les vrais tarifs</em></a>' +
    '<a class="mb-pole" href="/parcours/"><small>Birdy Golf</small><b>Réserver un parcours en France</b><em>Trouvez un départ près de chez vous</em></a>' +
    '<div class="mb-l"><a href="/">Accueil et Birdy</a><a href="/golf/">Toutes les destinations</a><a href="/guides/">Idées de séjours</a><a href="/parcours/region/ile-de-france">Golfs en Île-de-France</a><a href="/a-propos/">À propos de Birdy Agent</a></div>' +
    '<div class="mb-c"><a href="tel:+33616213447">Appeler</a><a class="mb-wa" href="https://wa.me/33616213447?text=' + encodeURIComponent("Bonjour Birdy Agent, je souhaite organiser une partie ou un séjour golf.") + '" target="_blank" rel="noopener">WhatsApp</a></div>';
  top.appendChild(btn);
  document.body.appendChild(pan);
  function ferme() { pan.classList.remove("on"); btn.setAttribute("aria-expanded", "false"); document.body.classList.remove("mb-open"); }
  btn.addEventListener("click", function () {
    var ouvre = !pan.classList.contains("on");
    pan.classList.toggle("on", ouvre); btn.setAttribute("aria-expanded", ouvre ? "true" : "false"); document.body.classList.toggle("mb-open", ouvre);
    if (ouvre) { var a = pan.querySelector("a"); if (a) a.focus({ preventScroll: true }); }
  });
  pan.addEventListener("click", function (e) { if (e.target.closest("a")) ferme(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && pan.classList.contains("on")) { ferme(); btn.focus(); } });
  addEventListener("resize", function () { if (innerWidth > 900) ferme(); });
})();
