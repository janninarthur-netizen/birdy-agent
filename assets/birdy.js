/* Birdy Agent : demande guidée, agent Birdy (à règles), globe 3D, exploration, récit au défilement. */
(function () {
  "use strict";
  var B = JSON.parse(document.getElementById("birdy-data").textContent);
  var D = B.dest, N = D.length;
  var calme = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (id) { return document.getElementById(id); };
  function ph(id, w) { return "/assets/img/p/" + id + "-" + (w <= 600 ? 480 : w <= 1000 ? 960 : 1600) + ".webp"; }
  function idx(nom) { for (var i = 0; i < N; i++) if (D[i].n === nom) return i; return -1; }
  function each(list, fn) { Array.prototype.forEach.call(list, fn); }
  function vers(id) { var el = $(id); if (el) el.scrollIntoView({ behavior: calme ? "auto" : "smooth", block: "start" }); }

  /* ---------- Demande guidée ---------- */
  var W = (function () {
    var qs = Array.prototype.slice.call(document.querySelectorAll("#organiser .q"));
    if (!qs.length) return null;
    var dots = document.querySelectorAll("#organiser .dots i"), back = $("retour"), choix = {}, cur = 0;
    function cle(i) { return qs[i].getAttribute("data-k"); }
    function show(n) {
      cur = n;
      qs.forEach(function (q, k) { q.classList.toggle("on", k === n); });
      each(dots, function (d, k) { d.classList.toggle("on", k <= n); });
      back.hidden = n === 0;
      var fait = Math.min(n, 4), fill = $("wz-fill"), bar = $("wz-bar");
      if (fill) {
        fill.style.width = (fait / 4 * 100) + "%"; bar.setAttribute("aria-valuenow", fait);
        $("wz-step").textContent = cle(n) === "fin" ? "Dernière étape : vos coordonnées" : "Étape " + (n + 1) + " sur 4";
        $("wz-pct").textContent = Math.round(fait / 4 * 100) + " %";
      }
      if (cle(n) === "fin") recap();
    }
    function suivant(from) { for (var j = from; j < qs.length; j++) if (cle(j) === "fin" || !choix[cle(j)]) return j; return qs.length - 1; }
    function marque() {
      qs.forEach(function (q) {
        var k = q.getAttribute("data-k");
        each(q.querySelectorAll("[data-v]"), function (x) { x.classList.toggle("sel", x.getAttribute("data-v") === choix[k]); });
      });
    }
    function recap() {
      var r = $("recap"); r.textContent = "";
      [["Groupe", choix.groupe], ["Destination", choix.destination], ["Quand", choix.periode], ["Budget", choix.budget]].forEach(function (x) {
        var d = document.createElement("div"), s = document.createElement("small"), b = document.createElement("b");
        s.textContent = x[0]; b.textContent = x[1] ? x[1].charAt(0).toUpperCase() + x[1].slice(1) : "À préciser";
        d.appendChild(s); d.appendChild(b); r.appendChild(d);
      });
    }
    qs.forEach(function (q, k) {
      each(q.querySelectorAll("[data-v]"), function (b) {
        b.addEventListener("click", function () {
          choix[q.getAttribute("data-k")] = b.getAttribute("data-v"); marque();
          setTimeout(function () { show(suivant(k + 1)); }, 180);
        });
      });
    });
    back.addEventListener("click", function () { if (cur > 0) show(cur - 1); });
    var wreg = $("w-regions");
    function wRegion(r) {
      each(wreg.children, function (x) { x.setAttribute("aria-pressed", x.getAttribute("data-wr") === r ? "true" : "false"); });
      each(document.querySelectorAll("#w-dest .pill"), function (x) { x.hidden = x.getAttribute("data-r") !== r; });
    }
    each(wreg.children, function (c) { c.addEventListener("click", function () { wRegion(c.getAttribute("data-wr")); }); });
    var form = $("form");
    $("recommencer").addEventListener("click", function () {
      choix = {}; marque(); $("msg").textContent = ""; form.hidden = false; form.reset();
      $("envoyer").disabled = false; $("merci").hidden = true; show(0);
    });
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      var m = $("msg"), btn = $("envoyer"), prenom = form.prenom.value.trim(), tel = form.tel.value.trim();
      if (!prenom || tel.replace(/\D/g, "").length < 9) { m.textContent = "Indiquez votre prénom et un numéro de téléphone valide."; return; }
      if (!$("rgpd").checked) { m.textContent = "Cochez la case pour que nous puissions vous recontacter."; return; }
      btn.disabled = true; m.textContent = "Envoi en cours…";
      try {
        ["groupe", "destination", "periode", "budget"].forEach(function (k) { form.elements[k].value = choix[k] || ""; });
        var r = await fetch("/api/demande", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(new FormData(form)).toString() });
        if (!r.ok) throw new Error("envoi");
        $("m-nom").textContent = prenom; form.hidden = true; $("merci").hidden = false; m.textContent = "";
      } catch (err) {
        btn.disabled = false; m.textContent = "L’envoi n’a pas fonctionné. Appelez-nous au 06 16 21 34 47, nous prenons votre demande au téléphone.";
      }
    });
    return {
      prefill: function (o, aller) {
        Object.keys(o).forEach(function (k) { if (o[k]) choix[k] = o[k]; });
        if (o.destination) { var i = idx(o.destination); if (i >= 0) wRegion(D[i].r); }
        marque(); show(suivant(0)); if (aller !== false) vers("organiser");
      }
    };
  })();

  /* ---------- Globe 3D ---------- */
  var GL = (function () {
    var box = $("globe");
    if (!box) return null;
    var act = -1, onPick = [];
    var card = $("gcard");
    function remplitCarte(i) {
      var d = D[i];
      card.classList.add("swap");
      setTimeout(function () {
        $("gcard-tag").textContent = d.p === d.rl ? d.p : d.p + " · " + d.rl;
        $("gcard-name").textContent = d.n;
        $("gcard-desc").textContent = d.t;
        $("gcard-more").href = "/golf/" + d.s;
        var im = $("gcard-img");
        if (d.ph) { im.hidden = false; im.onerror = function () { im.hidden = true; }; im.src = ph(d.ph, 300); im.alt = d.n; } else { im.hidden = true; }
        card.classList.remove("swap");
      }, 220);
    }
    $("gcard-go").addEventListener("click", function () { if (act >= 0 && W) W.prefill({ destination: D[act].n }); });
    var api = { select: function (i) { act = i; remplitCarte(i); onPick.forEach(function (f) { f(i); }); }, onPick: onPick, fly: function () {} };
    if (!window.THREE) { box.classList.add("noweb"); box.querySelector(".globe-fallback").textContent = "Utilisez la recherche ci-dessous pour explorer nos destinations."; return api; }
    var THREE = window.THREE, renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { box.classList.add("noweb"); return api; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    box.appendChild(renderer.domElement);
    var scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    cam.position.set(0, 0, 4.4);
    var G = new THREE.Group(); scene.add(G);
    function ll(lat, lon, r) {
      var p = (90 - lat) * Math.PI / 180, t = (lon + 180) * Math.PI / 180;
      return new THREE.Vector3(-r * Math.sin(p) * Math.cos(t), r * Math.cos(p), r * Math.sin(p) * Math.sin(t));
    }
    function disc(col, doux) {
      var c = document.createElement("canvas"); c.width = c.height = 64;
      var x = c.getContext("2d"), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, col); g.addColorStop(doux ? 0.22 : 0.55, col); g.addColorStop(1, "rgba(0,0,0,0)");
      x.fillStyle = g; x.fillRect(0, 0, 64, 64);
      var t = new THREE.CanvasTexture(c); return t;
    }
    G.add(new THREE.Mesh(new THREE.SphereGeometry(0.992, 64, 64), new THREE.MeshBasicMaterial({ color: 0x082a21 })));
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.13, 64, 64), new THREE.ShaderMaterial({
      transparent: true, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false,
      vertexShader: "varying vec3 vN;void main(){vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
      fragmentShader: "varying vec3 vN;void main(){float i=pow(0.7-dot(vN,vec3(0.0,0.0,1.0)),3.6);gl_FragColor=vec4(0.42,0.8,0.6,1.0)*i*0.75;}"
    })));
    var P = B.pts, pos = new Float32Array(P.length / 2 * 3);
    for (var k = 0; k < P.length; k += 2) { var v = ll(P[k + 1], P[k], 1.0); pos[k / 2 * 3] = v.x; pos[k / 2 * 3 + 1] = v.y; pos[k / 2 * 3 + 2] = v.z; }
    var geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    G.add(new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.026, map: disc("rgba(170,232,196,1)"), transparent: true, depthWrite: false, opacity: 1 })));
    var or = disc("rgba(225,245,236,1)", true), blanc = disc("rgba(255,255,255,1)", true), pins = [];
    D.forEach(function (d, i) {
      var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: or, transparent: true, depthWrite: false }));
      s.position.copy(ll(d.lat, d.lon, 1.008)); s.scale.set(0.05, 0.05, 1); G.add(s); pins.push(s);
    });
    var paris = ll(48.86, 2.35, 1.008);
    var ps = new THREE.Sprite(new THREE.SpriteMaterial({ map: blanc, transparent: true, depthWrite: false })); ps.position.copy(paris); ps.scale.set(0.04, 0.04, 1); G.add(ps);
    var arcs = [];
    function arc(i, garde) {
      var b = ll(D[i].lat, D[i].lon, 1.008), mid = paris.clone().add(b).multiplyScalar(0.5), dist = paris.distanceTo(b);
      if (mid.length() < 0.01) mid.set(0, 1, 0);
      mid.normalize().multiplyScalar(1 + dist * 0.42);
      var curve = new THREE.QuadraticBezierCurve3(paris.clone(), mid, b);
      var g = new THREE.BufferGeometry().setFromPoints(curve.getPoints(90)); g.setDrawRange(0, 0);
      var line = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xa3c9b8, transparent: true, opacity: garde ? 1 : 0.55 }));
      var avion = new THREE.Sprite(new THREE.SpriteMaterial({ map: blanc, transparent: true, depthWrite: false }));
      avion.scale.set(garde ? 0.045 : 0.03, garde ? 0.045 : 0.03, 1);
      G.add(line); G.add(avion);
      var o = { line: line, avion: avion, curve: curve, t: 0, garde: garde };
      if (garde) arcs.forEach(function (a) { if (a.garde) a.fin = true; });
      arcs.push(o);
    }
    var rotY = -1.65, rotX = 0.62, tY = null, tX = null, vy = 0, glisse = false, dernier = 0, visible = true;
    function vise(lat, lon) {
      var p = ll(lat, lon, 1), ry = -Math.atan2(p.x, p.z), d = ry - rotY;
      d = Math.atan2(Math.sin(d), Math.cos(d)); tY = rotY + d; tX = Math.max(-0.95, Math.min(0.95, lat * Math.PI / 180 * 0.9));
    }
    api.fly = function (i) { vise(D[i].lat, D[i].lon); arc(i, true); dernier = Date.now(); };
    var tip = $("globe-tip"), hint = $("globe-hint"), w = new THREE.Vector3();
    function taille() { var r = box.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); cam.aspect = r.width / r.height; cam.updateProjectionMatrix(); }
    function proche(cx, cy) {
      var r = box.getBoundingClientRect(), best = -1, bd = 22 * 22;
      for (var i = 0; i < pins.length; i++) {
        pins[i].getWorldPosition(w); if (w.z < 0.15) continue;
        var s = w.clone().project(cam), x = (s.x + 1) / 2 * r.width, y = (1 - s.y) / 2 * r.height, dd = (x - cx) * (x - cx) + (y - cy) * (y - cy);
        if (dd < bd) { bd = dd; best = i; }
      }
      return best;
    }
    var x0 = 0, y0 = 0, lx = 0, ly = 0, bouge = 0;
    box.addEventListener("pointerdown", function (e) { glisse = true; bouge = 0; x0 = lx = e.clientX; y0 = ly = e.clientY; tY = null; vy = 0; box.setPointerCapture(e.pointerId); box.classList.add("drag"); hint.style.opacity = 0; });
    box.addEventListener("pointermove", function (e) {
      var r = box.getBoundingClientRect();
      if (glisse) {
        var dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
        bouge = Math.max(bouge, Math.abs(e.clientX - x0) + Math.abs(e.clientY - y0));
        rotY += dx * 0.006; rotX = Math.max(-1, Math.min(1, rotX + dy * 0.004)); vy = dx * 0.006; dernier = Date.now(); return;
      }
      var i = proche(e.clientX - r.left, e.clientY - r.top);
      if (i >= 0) { tip.hidden = false; tip.textContent = D[i].n; tip.style.left = (e.clientX - r.left) + "px"; tip.style.top = (e.clientY - r.top) + "px"; box.style.cursor = "pointer"; }
      else { tip.hidden = true; box.style.cursor = ""; }
    });
    function lache(e) {
      if (!glisse) return; glisse = false; box.classList.remove("drag");
      if (bouge < 6) { var r = box.getBoundingClientRect(), i = proche(e.clientX - r.left, e.clientY - r.top); if (i >= 0) { api.select(i); api.fly(i); } }
    }
    box.addEventListener("pointerup", lache); box.addEventListener("pointercancel", lache);
    box.addEventListener("pointerleave", function () { tip.hidden = true; });
    if (window.ResizeObserver) new ResizeObserver(taille).observe(box); else addEventListener("resize", taille);
    if (window.IntersectionObserver) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(box);
    taille(); box.classList.add("ready");
    var ambiant = 0;
    function image(t) {
      requestAnimationFrame(image);
      if (!visible || document.hidden) return;
      if (tY !== null) { rotY += (tY - rotY) * 0.06; rotX += (tX - rotX) * 0.06; if (Math.abs(tY - rotY) < 0.0015 && Math.abs(tX - rotX) < 0.0015) tY = null; }
      else if (!glisse) {
        rotY += vy; vy *= 0.94;
        if (!calme && Date.now() - dernier > 5000) { rotY += 0.0018; rotX += (0.5 - rotX) * 0.004; }
      }
      G.rotation.set(rotX, rotY, 0);
      for (var i = 0; i < pins.length; i++) { var s = i === act ? 0.11 + Math.sin(t / 200) * 0.018 : 0.048 + (calme ? 0 : Math.sin(t / 520 + i * 1.7) * 0.01); pins[i].scale.set(s, s, 1); }
      if (!calme && t - ambiant > 2600 && Date.now() - dernier > 3000) { ambiant = t; arc(Math.floor(Math.random() * N), false); }
      for (var a = arcs.length - 1; a >= 0; a--) {
        var o = arcs[a]; o.t += o.garde ? 0.014 : 0.01;
        var u = Math.min(o.t, 1); o.line.geometry.setDrawRange(0, Math.floor(u * 91));
        o.avion.position.copy(o.curve.getPoint(u));
        var vieux = o.garde ? o.fin : o.t > 1.7;
        if (vieux) {
          o.line.material.opacity -= 0.03; o.avion.material.opacity -= 0.05;
          if (o.line.material.opacity <= 0) { G.remove(o.line); G.remove(o.avion); o.line.geometry.dispose(); arcs.splice(a, 1); }
        } else if (u >= 1 && !o.garde) { o.avion.material.opacity = Math.max(0, 1.7 - o.t); }
      }
      relie();
      renderer.render(scene, cam);
    }
    var gl = $("g-line"), gd = $("g-dot"), gs = $("g-link"), pp = new THREE.Vector3();
    function relie() {
      if (!gl || act < 0 || innerWidth <= 900) { if (gs) gs.style.opacity = 0; return; }
      pins[act].getWorldPosition(pp);
      if (pp.z < 0.1 || card.classList.contains("swap")) { gs.style.opacity = 0; return; }
      var s = pp.clone().project(cam), r = box.getBoundingClientRect(), base = box.parentNode.getBoundingClientRect();
      var x = (s.x + 1) / 2 * r.width + r.left - base.left, y = (1 - s.y) / 2 * r.height + r.top - base.top;
      var c = card.getBoundingClientRect(), cx = c.left - base.left + 18, cy = c.top - base.top;
      gl.setAttribute("x1", x.toFixed(1)); gl.setAttribute("y1", y.toFixed(1)); gl.setAttribute("x2", cx.toFixed(1)); gl.setAttribute("y2", cy.toFixed(1));
      gd.setAttribute("cx", x.toFixed(1)); gd.setAttribute("cy", y.toFixed(1)); gs.style.opacity = 1;
    }
    requestAnimationFrame(image);
    return api;
  })();

  /* ---------- Exploration : recherche, régions, liste ---------- */
  (function () {
    var list = $("ex-list"), q = $("ex-q"), regs = $("ex-regions");
    if (!list) return;
    var reg = "", btns = [];
    function norm(s) { return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }
    D.forEach(function (d, i) {
      var b = document.createElement("button"); b.type = "button"; b.setAttribute("role", "listitem");
      b.innerHTML = "<span></span><small></small>"; b.firstChild.textContent = d.n; b.lastChild.textContent = d.p;
      b.addEventListener("click", function () { if (GL) { GL.select(i); GL.fly(i); } if (innerWidth < 900) vers("globe"); });
      list.appendChild(b); btns.push(b);
    });
    var vide = document.createElement("p"); vide.className = "none"; vide.textContent = "Aucune destination ne correspond. Essayez un pays ou une région."; vide.hidden = true; list.appendChild(vide);
    function filtre() {
      var t = norm(q.value.trim()), n = 0;
      btns.forEach(function (b, i) {
        var d = D[i], ok = (!reg || d.r === reg) && (!t || norm(d.n + " " + d.p + " " + d.rl).indexOf(t) > -1);
        b.hidden = !ok; if (ok) n++;
      });
      vide.hidden = n > 0;
    }
    q.addEventListener("input", filtre);
    each(regs.children, function (b) {
      b.addEventListener("click", function () {
        reg = reg === b.dataset.r ? "" : b.dataset.r;
        each(regs.children, function (x) { x.setAttribute("aria-pressed", x.dataset.r === reg ? "true" : "false"); });
        filtre();
        if (reg && GL) { for (var i = 0; i < N; i++) if (D[i].r === reg) { GL.select(i); GL.fly(i); break; } }
      });
    });
    if (GL) GL.onPick.push(function (i) {
      btns.forEach(function (b, k) { b.setAttribute("aria-pressed", k === i ? "true" : "false"); });
      var b = btns[i]; if (!b.hidden) list.scrollTo({ left: b.offsetLeft - list.clientWidth / 2 + b.offsetWidth / 2, behavior: calme ? "auto" : "smooth" });
    });
  })();

  /* ---------- Agent Birdy (à règles) ---------- */
  (function () {
    var log = $("agent-log"), form = $("agent-form"), inp = $("agent-in"), sugg = $("agent-sugg");
    if (!log) return;
    var TAGS = B.tags;
    var MOTS = [
      [/soleil|chaud|chaleur|plage|mer\b|bronz/, "soleil"], [/hiver|d[ée]cembre|janvier|f[ée]vrier|no[eë]l/, "hiver"],
      [/week-?end|court|proche|rapide|3 jours|2 nuits|pas loin/, "court"], [/evg|enterrement|vie de gar|f[eê]te|f[eê]tard|soir[ée]e/, "fete"],
      [/s[ée]minaire|entreprise|coll[eè]gue|incentive|team|boite|soci[ée]t[ée]/, "pro"], [/links|mythique|histoire|berceau|old course|tradition/, "links"],
      [/exotique|lagon|paradis|luxe|noces|tropical|cocotier|palmier/, "exotique"], [/nature|safari|montagne|aventure|sauvage|lac/, "nature"]
    ];
    var PAYS = [["portugal", "Portugal"], ["espagne", "Espagne"], ["maroc", "Maroc"], ["ecosse", "Écosse"], ["irlande", "Irlande"], ["italie", "Italie"], ["grece", "Grèce"], ["chypre", "Chypre"], ["turquie", "Turquie"], ["hongrie", "Hongrie"], ["autriche", "Autriche"], ["france", "France"], ["egypte", "Égypte"], ["tunisie", "Tunisie"], ["afrique du sud", "Afrique du Sud"], ["thailande", "Thaïlande"], ["vietnam", "Vietnam"], ["cambodge", "Cambodge"], ["etats-unis", "États-Unis"], ["usa", "États-Unis"], ["amerique", "États-Unis"], ["floride", "États-Unis"], ["mexique", "Mexique"], ["canada", "Canada"], ["caraibes", "Caraïbes"], ["antilles", "Caraïbes"], ["emirats", "Émirats arabes unis"], ["ocean indien", "Océan Indien"], ["australie", "Océanie"], ["nouvelle-zelande", "Océanie"]];
    var REG = [["asie", "asie"], ["afrique", "afrique"], ["europe", "europe"], ["oceanie", "oceanie"]];
    var MOIS = [[/mars|avril|mai|printemps/, "au printemps"], [/juin|juillet|ao[uû]t|[ée]t[ée]/, "en été"], [/septembre|octobre|novembre|automne/, "en automne"], [/d[ée]cembre|janvier|f[ée]vrier|hiver/, "en hiver"]];
    function norm(s) { return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }
    function bulle(cls, contenu) {
      var b = document.createElement("div"); b.className = cls;
      if (typeof contenu === "string") b.textContent = contenu; else b.appendChild(contenu);
      log.appendChild(b); log.scrollTop = log.scrollHeight; return b;
    }
    function dit(texte, fin) {
      var b = bulle("msg-b", "");
      if (calme) { b.textContent = texte; if (fin) fin(); return b; }
      var i = 0, c = document.createElement("span"); c.className = "caret";
      (function pas() {
        i = Math.min(texte.length, i + 2 + Math.floor(Math.random() * 2));
        b.textContent = texte.slice(0, i); b.appendChild(c); log.scrollTop = log.scrollHeight;
        if (i < texte.length) setTimeout(pas, 16 + Math.random() * 18); else { c.remove(); if (fin) setTimeout(fin, 120); }
      })();
      return b;
    }
    function tape(fn) {
      var t = bulle("msg-b", ""); t.innerHTML = '<span class="typing"><i></i><i></i><i></i></span>';
      setTimeout(function () { t.remove(); fn(); }, calme ? 50 : 650);
    }
    function analyse(txt) {
      var t = norm(txt), r = { tags: [], pays: [], regs: [], noms: [] };
      MOTS.forEach(function (m) { if (m[0].test(t)) r.tags.push(m[1]); });
      PAYS.forEach(function (p) { if (t.indexOf(p[0]) > -1 && r.pays.indexOf(p[1]) < 0) r.pays.push(p[1]); });
      REG.forEach(function (p) { if (t.indexOf(p[0]) > -1) r.regs.push(p[1]); });
      D.forEach(function (d) { if (norm(d.n).length > 3 && t.indexOf(norm(d.n)) > -1) r.noms.push(d.n); });
      var g = t.match(/(\d{1,3})\s*(pers|potes|amis|joueurs|golfeurs|coll|copains|membres|participants|salari|personnes|copines|filles|gars)/) || t.match(/(?:on est|nous sommes|groupe de|equipe de)\s*(\d{1,3})/);
      if (g) { var n = +g[1]; r.groupe = n <= 4 ? "2 à 4 personnes" : n <= 8 ? "5 à 8 personnes" : n <= 16 ? "9 à 16 personnes" : "17 personnes ou plus"; r.nb = n; }
      MOIS.forEach(function (m) { if (!r.periode && m[0].test(t)) r.periode = m[1]; });
      var bu = t.match(/(\d[\d\s.]{1,6})\s*(€|eur|euros?)/);
      if (bu) { var v = parseInt(bu[1].replace(/[\s.]/g, ""), 10); if (v > 50) r.budget = v < 800 ? "moins de 800 €" : v <= 1500 ? "800 à 1 500 €" : v <= 2500 ? "1 500 à 2 500 €" : "plus de 2 500 €"; }
      return r;
    }
    function score(r) {
      return D.map(function (d, i) {
        var s = Math.random() * 0.5;
        if (r.noms.indexOf(d.n) > -1) s += 12;
        r.pays.forEach(function (p) { if (d.p.indexOf(p) > -1 || d.rl === p) s += 7; });
        r.regs.forEach(function (g) { if (d.r === g) s += 4; });
        r.tags.forEach(function (g) { if ((TAGS[g] || []).indexOf(d.n) > -1) s += 2.5; });
        if (r.groupe && r.nb <= 12 && (TAGS.court || []).indexOf(d.n) > -1 && !r.pays.length) s += 0.6;
        return { i: i, s: s };
      }).sort(function (a, b) { return b.s - a.s; });
    }
    var dernier = null;
    function repond(txt) {
      var r = analyse(txt);
      var compris = r.tags.length + r.pays.length + r.regs.length + r.noms.length;
      tape(function () {
        if (!compris && !r.groupe && !r.periode && !r.budget) {
          dit("Dites-m’en un peu plus : combien vous êtes, quand vous aimeriez partir, et plutôt soleil, links mythiques ou destination exotique ?");
          return;
        }
        var top = score(r).slice(0, 3);
        var bits = [];
        if (r.nb) bits.push(r.nb + " personnes");
        if (r.periode) bits.push(r.periode);
        if (r.budget) bits.push("budget " + r.budget);
        dit((bits.length ? "C’est noté : " + bits.join(", ") + ". " : "") + "Voici ce que je vous propose :", function () { suite(r, top); });
      });
    }
    function suite(r, top) {
        var g = document.createElement("div"); g.className = "recos";
        top.forEach(function (o, k) {
          var d = D[o.i], b = document.createElement("button"); b.type = "button"; b.className = "reco"; b.style.setProperty("--k", k);
          b.innerHTML = '<span class="p"></span><b></b><small></small>';
          if (d.ph) b.firstChild.style.backgroundImage = "url(" + ph(d.ph, 300) + ")";
          b.children[1].textContent = d.n; b.children[2].textContent = d.p;
          b.addEventListener("click", function () { if (GL) { GL.select(o.i); GL.fly(o.i); } });
          g.appendChild(b);
        });
        var rw = bulle("msg-b recos-wrap", g); rw.style.background = "transparent"; rw.style.border = "0"; rw.style.padding = "0";
        if (GL) { GL.select(top[0].i); GL.fly(top[0].i); }
        dernier = { r: r, d: D[top[0].i].n };
        var c = document.createElement("div"); c.className = "agent-cta";
        var go = document.createElement("button"); go.type = "button"; go.className = "btn gold sm"; go.textContent = "Préparer ma demande";
        go.addEventListener("click", function () {
          var dest = GL && document.getElementById("gcard-name").textContent || dernier.d;
          if (W) W.prefill({ groupe: dernier.r.groupe, destination: dest, periode: dernier.r.periode, budget: dernier.r.budget });
        });
        var plus = document.createElement("a"); plus.className = "btn glass sm"; plus.textContent = "Voir " + D[top[0].i].n; plus.href = "/golf/" + D[top[0].i].s;
        c.appendChild(go); c.appendChild(plus);
        setTimeout(function () { var cb = bulle("msg-b", c); cb.style.background = "transparent"; cb.style.border = "0"; }, calme ? 0 : 520);
    }
    function envoie(txt) { txt = txt.trim(); if (!txt) return; bulle("msg-u", txt); repond(txt); }
    form.addEventListener("submit", function (e) { e.preventDefault(); envoie(inp.value); inp.value = ""; });
    each(sugg.children, function (b) { b.addEventListener("click", function () { envoie(b.textContent); }); });
    setTimeout(function () {
      tape(function () { dit("Bonjour, je suis Birdy, votre agent golf. Dites-moi en une phrase le séjour dont vous rêvez : je vous trouve la destination et je prépare votre demande."); });
    }, calme ? 0 : 900);
  })();

  /* ---------- Trou de golf : la balle avance au défilement ---------- */
  (function () {
    var path = $("gs-path"), list = $("gs-steps");
    if (!path || !list) return;
    var ns = "http://www.w3.org/2000/svg", L = path.getTotalLength(), ball = $("gs-ball"), sh = $("gs-shadow"), ring = $("gs-ring");
    var cap = $("gs-cap-n"), bar = $("gs-bar"), steps = list.querySelectorAll(".gs-step");
    var POS = [0.16, 0.42, 0.66, 0.86], NOMS = ["Envie", "Destinations", "Tarifs", "Séjour"], mk = [];
    path.style.strokeDasharray = L; path.style.strokeDashoffset = L;
    POS.forEach(function (f, i) {
      var pt = path.getPointAtLength(L * f), g = document.createElementNS(ns, "g"); g.setAttribute("class", "gs-mk");
      g.innerHTML = '<circle r="13"/><text>' + (i + 1) + '</text><text class="lb"></text>';
      g.setAttribute("transform", "translate(" + pt.x.toFixed(1) + " " + pt.y.toFixed(1) + ")");
      var lb = g.querySelector(".lb"); lb.textContent = NOMS[i]; lb.setAttribute("y", i === 0 ? 0 : -26); lb.setAttribute("x", i === 0 ? -42 : 0);
      $("gs-marks").appendChild(g); mk.push(g);
    });
    var sol = [440, 300, 0]; // départ du sol
    function maj() {
      var h = innerHeight, art = document.querySelector(".gs-art").getBoundingClientRect();
      var ligne = innerWidth <= 900 ? art.bottom + 230 : h * 0.55;
      var tops = Array.prototype.map.call(steps, function (st) { return st.getBoundingClientRect().top; });
      var idx = -1; tops.forEach(function (tp, i) { if (tp < ligne) idx = i; });
      var A = [0].concat(POS, [1]), deb = idx < 0 ? tops[0] - h * 0.5 : tops[idx], finT = idx + 1 < tops.length ? tops[idx + 1] : deb + h * 0.4;
      var f = Math.max(0, Math.min(1, (ligne - deb) / Math.max(1, finT - deb)));
      var p = idx >= 4 ? 1 : A[idx + 1] + (A[idx + 2] - A[idx + 1]) * f;
      if (idx < 0) p = POS[0] * f;
      path.style.strokeDashoffset = L * (1 - p);
      var pt = path.getPointAtLength(L * p);
      ball.setAttribute("cx", pt.x.toFixed(1)); ball.setAttribute("cy", pt.y.toFixed(1));
      var gy = 462 - (462 - 386) * Math.min(1, Math.max(0, (pt.x - 76) / (512 - 76)));
      var haut = Math.max(0, gy - pt.y);
      sh.setAttribute("cx", pt.x.toFixed(1)); sh.setAttribute("cy", gy.toFixed(1));
      sh.setAttribute("rx", (8 + haut * 0.02).toFixed(1)); sh.setAttribute("opacity", Math.max(0.12, 0.45 - haut / 900).toFixed(2));
      var k = Math.min(idx, 3), fin = idx >= 4;
      mk.forEach(function (g, i) { g.classList.toggle("on", i <= k); });
      ring.classList.toggle("go", fin);
      each(steps, function (st, i) { st.classList.toggle("on", i === Math.max(idx, 0)); });
      cap.textContent = fin ? "Dans le trou !" : k < 0 ? "Départ" : "Étape " + (k + 1) + " · " + NOMS[k];
      bar.style.width = (p * 100).toFixed(1) + "%";
    }
    addEventListener("scroll", maj, { passive: true }); addEventListener("resize", maj); maj();
    var talk = $("gs-talk");
    if (talk) talk.addEventListener("click", function (e) { e.preventDefault(); vers("accueil"); setTimeout(function () { var i = $("agent-in"); if (i) i.focus({ preventScroll: true }); }, calme ? 0 : 700); });
  })();

  /* ---------- Chiffres, apparitions, inclinaison ---------- */
  (function () {
    var io = window.IntersectionObserver ? new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target; el.classList.remove("pre"); io.unobserve(el);
        var b = el.querySelector("[data-count]");
        if (b && !calme) {
          var fin = +b.dataset.count, suf = b.dataset.suffix || "", t0 = performance.now();
          (function tic(t) { var u = Math.min((t - t0) / 1200, 1), v = Math.round(fin * (1 - Math.pow(1 - u, 3))); b.textContent = v + suf; if (u < 1) requestAnimationFrame(tic); })(t0);
        }
      });
    }, { threshold: 0.15 }) : null;
    each(document.querySelectorAll(".rv"), function (el) {
      if (!io || calme) return;
      if (el.getBoundingClientRect().top > innerHeight) { el.classList.add("pre"); io.observe(el); }
    });
    if (!calme) each(document.querySelectorAll(".wc"), function (c) {
      c.addEventListener("pointermove", function (e) {
        var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.style.transform = "rotateY(" + ((x - 0.5) * 12).toFixed(1) + "deg) rotateX(" + ((0.5 - y) * 10).toFixed(1) + "deg) translateY(-4px)";
        c.style.setProperty("--gx", (x * 100).toFixed(0) + "%"); c.style.setProperty("--gy", (y * 100).toFixed(0) + "%");
      });
      c.addEventListener("pointerleave", function () { c.style.transform = ""; });
    });
  })();

  /* ---------- Halo doré ---------- */
  (function () {
    var h = $("halo"); if (!h || calme || matchMedia("(hover: none)").matches) return;
    var x = 0, y = 0, tx = 0, ty = 0, on = false, raf = null;
    addEventListener("pointermove", function (e) {
      tx = e.clientX; ty = e.clientY;
      var sombre = e.target.closest && e.target.closest(".hx,.cx,.story,footer");
      if (!!sombre !== on) { on = !!sombre; h.classList.toggle("on", on); }
      if (!raf) raf = requestAnimationFrame(suit);
    }, { passive: true });
    function suit() { x += (tx - x) * 0.18; y += (ty - y) * 0.18; h.style.transform = "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px,0)"; raf = (Math.abs(tx - x) + Math.abs(ty - y) > 0.5) ? requestAnimationFrame(suit) : null; }
  })();

  /* ---------- Liens entre les briques ---------- */
  window.birdyChoisir = function (n) { var i = idx(n); if (i < 0) return; if (GL) GL.select(i); if (W) W.prefill({ destination: n }); };
  var start = idx("Algarve");
  try {
    var qd = new URLSearchParams(location.search).get("dest");
    if (qd && idx(qd) >= 0) { start = idx(qd); if (W) W.prefill({ destination: qd }, false); }
  } catch (e) {}
  if (GL) { GL.select(start); setTimeout(function () { GL.fly(start); }, 600); }
})();
