/* Pôle « Débuter » : les deux scènes 3D (Three.js).
   1. Le trou de golf : on joue les 5 étapes du débutant, la balle vole d'un point à l'autre, le vocabulaire s'affiche sur le terrain.
   2. Le swing : un personnage articulé exécute le geste, phase par phase.
   Sans WebGL, la page reste utilisable : les cartes et les phrases sont en HTML. */
(function () {
  "use strict";
  var D = JSON.parse(document.getElementById("db-data").textContent);
  var T = window.THREE, calme = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function V(x, y, z) { return new T.Vector3(x, y, z); }
  function lerp(a, b, k) { return a + (b - a) * k; }

  /* ---------- Socle commun : rendu, taille, boucle (seulement quand la scène est à l'écran) ---------- */
  function monte(box, fov) {
    if (!T) { box.classList.add("sans3d"); return null; }
    var r;
    try { r = new T.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { box.classList.add("sans3d"); return null; }
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); r.outputEncoding = T.sRGBEncoding;
    box.insertBefore(r.domElement, box.firstChild);
    var o = { r: r, sc: new T.Scene(), cam: new T.PerspectiveCamera(fov, 1, 0.1, 200), w: 1, h: 1, vu: !window.IntersectionObserver, frame: function () {} };
    o.sc.add(new T.HemisphereLight(0xe4f6ec, 0x2a4a3c, 0.85));
    var sol = new T.DirectionalLight(0xfff3da, 1.05); sol.position.set(6, 12, 7); o.sc.add(sol); o.soleil = sol;
    function taille() {
      var b = box.getBoundingClientRect(); o.w = Math.max(1, b.width); o.h = Math.max(1, b.height);
      r.setSize(o.w, o.h, false); o.cam.aspect = o.w / o.h; o.cam.updateProjectionMatrix(); if (o.surTaille) o.surTaille();
    }
    if (window.ResizeObserver) new ResizeObserver(taille).observe(box); else addEventListener("resize", taille);
    taille();
    if (window.IntersectionObserver) new IntersectionObserver(function (e) { o.vu = e[0].isIntersecting; }, { rootMargin: "150px" }).observe(box);
    var t0 = performance.now();
    (function boucle(now) {
      requestAnimationFrame(boucle);
      if (!o.vu || document.hidden) return;
      o.frame(((now || t0) - t0) / 1000); r.render(o.sc, o.cam);
    })(t0);
    return o;
  }
  // Glisser pour tourner : renvoie un objet {az, el} modifié par le pointeur
  function glisse(box, etat, lim) {
    var bas = null;
    box.addEventListener("pointerdown", function (e) { if (e.target.closest("button,a,input,.dh-card")) return; bas = { x: e.clientX, y: e.clientY, az: etat.az, el: etat.el }; box.classList.add("tourne"); });
    addEventListener("pointermove", function (e) {
      if (!bas) return;
      etat.az = Math.max(-lim, Math.min(lim, bas.az - (e.clientX - bas.x) * 0.006));
      etat.el = Math.max(-0.25, Math.min(0.35, bas.el + (e.clientY - bas.y) * 0.004));
    });
    addEventListener("pointerup", function () { bas = null; box.classList.remove("tourne"); });
    addEventListener("pointercancel", function () { bas = null; box.classList.remove("tourne"); });
  }
  function mat(c, o) { var x = new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.85, metalness: 0, flatShading: true }, o || {})); x.color.convertSRGBToLinear(); return x; }

  /* =====================================================================
     1. LE TROU DE GOLF
     ===================================================================== */
  var boxT = document.getElementById("dh-scene");
  // Où se pose la balle à chaque étape (x, z) et repères du vocabulaire (x, y, z)
  var POSE = [[-7.2, 0.25], [-2.3, 0.2], [2.4, -2.55], [5.3, 0.75], [6.75, -0.3]];
  var REP = { depart: [-7.2, 1.0, 0.25], fairway: [-0.6, 0.9, -0.2], rough: [-4.6, 0.9, -3.3], bunker: [2.4, 0.95, -2.55], eau: [-1.3, 0.85, 3.0], green: [5.2, 0.9, 1.1], drapeau: [7.6, 2.3, -0.3] };
  var trou = null, etape = 0;

  function construitTrou() {
    var o = monte(boxT, 30); if (!o) return null;
    var sc = o.sc, HAUT = 0.6;
    function plat(shape, y, c, ep, opt) {
      var g = new T.ExtrudeGeometry(shape, { depth: ep, bevelEnabled: false, curveSegments: 28 }); g.rotateX(-Math.PI / 2);
      var m = new T.Mesh(g, mat(c, opt)); m.position.y = y; sc.add(m); return m;
    }
    function arrondi(w, d, r) {
      var s = new T.Shape(), x = w / 2, y = d / 2;
      s.moveTo(-x + r, -y); s.lineTo(x - r, -y); s.absarc(x - r, -y + r, r, -Math.PI / 2, 0, false); s.lineTo(x, y - r);
      s.absarc(x - r, y - r, r, 0, Math.PI / 2, false); s.lineTo(-x + r, y); s.absarc(-x + r, y - r, r, Math.PI / 2, Math.PI, false);
      s.lineTo(-x, -y + r); s.absarc(-x + r, -y + r, r, Math.PI, Math.PI * 1.5, false); return s;
    }
    function ovale(cx, cz, rx, rz) { var s = new T.Shape(); s.absellipse(cx, -cz, rx, rz, 0, Math.PI * 2, false, 0); return s; }
    // Le socle : terre, puis rough
    plat(arrondi(19.6, 9.6, 2.4), -0.55, 0x3a2a1c, 0.6);
    plat(arrondi(20, 10, 2.6), 0, 0x1f5a3f, HAUT);
    // Fairway (forme libre), départ, green et sa bordure
    var f = new T.Shape();
    f.moveTo(-6.4, -0.9); f.bezierCurveTo(-4, -2.3, -1, -2.0, 1.2, -1.3); f.bezierCurveTo(2.6, -0.9, 3.4, -1.5, 4.3, -1.2);
    f.bezierCurveTo(5.0, -0.3, 4.8, 0.9, 4.0, 1.4); f.bezierCurveTo(2.5, 2.0, 1.0, 1.1, -0.6, 1.6); f.bezierCurveTo(-2.8, 2.3, -5.2, 2.0, -6.4, 1.0);
    f.quadraticCurveTo(-7.0, 0.0, -6.4, -0.9);
    plat(f, HAUT, 0x3e9461, 0.04);
    plat(arrondi(1.7, 1.2, 0.3), HAUT, 0x57b07a, 0.09).position.set(-7.2, HAUT, 0.25);
    plat(ovale(6.0, 0.1, 2.65, 2.2), HAUT, 0x56b276, 0.05);
    plat(ovale(6.0, 0.1, 2.15, 1.75), HAUT, 0x8bdc9c, 0.07);
    // Bunkers et eau
    [[2.4, -2.55, 1.15, 0.75], [5.6, 2.9, 0.95, 0.6], [8.3, -1.9, 0.75, 0.6]].forEach(function (b) { plat(ovale(b[0], b[1], b[2], b[3]), HAUT, 0xe0cb94, 0.05); });
    var eau = plat(ovale(-1.3, 3.0, 2.1, 0.95), HAUT, 0x3b9ccb, 0.03, { roughness: 0.15, metalness: 0.1, flatShading: false, transparent: true, opacity: 0.92 });
    // Arbres
    var tronc = mat(0x5a3d26), feuil = [mat(0x145c45), mat(0x1b6e52), mat(0x0f4a38)];
    [[-8.6, -3.6, 1.1], [-6.0, -3.9, 0.85], [-2.7, -3.9, 1.2], [0.2, -4.0, 0.9], [4.6, -3.9, 1.15], [7.0, -3.8, 0.8], [9.0, -2.9, 1.0],
      [-8.9, 3.4, 0.9], [-5.6, 3.9, 1.1], [2.6, 3.9, 0.85], [8.8, 3.2, 1.05], [9.2, 0.8, 0.8]].forEach(function (a, i) {
      var g = new T.Group(), s = a[2];
      var t = new T.Mesh(new T.CylinderGeometry(0.09 * s, 0.13 * s, 0.6 * s, 6), tronc); t.position.y = 0.3 * s; g.add(t);
      [[0.62, 1.0, 0.85], [0.48, 0.85, 1.4], [0.32, 0.7, 1.9]].forEach(function (c, k) {
        var m = new T.Mesh(new T.ConeGeometry(c[0] * s, c[1] * s, 7), feuil[(i + k) % 3]); m.position.y = c[2] * s; g.add(m);
      });
      g.position.set(a[0], HAUT, a[1]); g.rotation.y = i; sc.add(g);
    });
    // Le trou, le drapeau (qui flotte), les marques de départ
    var tx = POSE[4][0], tz = POSE[4][1], Y = HAUT + 0.075;
    var noir = new T.Mesh(new T.CircleGeometry(0.13, 20), new T.MeshBasicMaterial({ color: 0x06140f })); noir.rotation.x = -Math.PI / 2; noir.position.set(tx, Y + 0.004, tz); sc.add(noir);
    var mt = new T.Mesh(new T.CylinderGeometry(0.025, 0.025, 2.0, 8), mat(0xf4f4ee, { flatShading: false })); mt.position.set(tx, Y + 1.0, tz); sc.add(mt);
    var fg = new T.PlaneGeometry(0.85, 0.5, 10, 1); fg.translate(0.425, 0, 0);
    var drap = new T.Mesh(fg, mat(0xe5484d, { side: T.DoubleSide, roughness: 0.7, flatShading: false })); drap.position.set(tx, Y + 1.72, tz); sc.add(drap);
    var fp = fg.attributes.position, fz0 = []; for (var i = 0; i < fp.count; i++) fz0.push(fp.getX(i));
    [[-7.75, 0.65], [-7.75, -0.15]].forEach(function (p) { var b = new T.Mesh(new T.SphereGeometry(0.07, 10, 8), mat(0xffffff, { flatShading: false })); b.position.set(p[0], HAUT + 0.14, p[1]); sc.add(b); });
    // La balle, son ombre, la trajectoire projetée (pointillés) et l'anneau d'arrivée
    var balle = new T.Mesh(new T.SphereGeometry(0.15, 20, 14), new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, emissive: 0x333333 })); sc.add(balle);
    var ombre = new T.Mesh(new T.CircleGeometry(0.19, 18), new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28 })); ombre.rotation.x = -Math.PI / 2; sc.add(ombre);
    var NP = 48, lg = new T.BufferGeometry(); lg.setAttribute("position", new T.BufferAttribute(new Float32Array(NP * 3), 3));
    var ligne = new T.Line(lg, new T.LineDashedMaterial({ color: 0xffffff, dashSize: 0.16, gapSize: 0.14, transparent: true, opacity: 0.9 })); ligne.frustumCulled = false; sc.add(ligne);
    var anneau = new T.Mesh(new T.RingGeometry(0.2, 0.26, 32), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, side: T.DoubleSide })); anneau.rotation.x = -Math.PI / 2; sc.add(anneau);
    function sol(i) { var hb = i === 2 ? 0.05 : i === 0 ? 0.09 : i >= 3 ? 0.07 : 0.04; return HAUT + hb + 0.15; }
    function pose(i) { return V(POSE[i][0], sol(i), POSE[i][1]); }

    var vol = null, pos = pose(0).clone(), fin = 0; balle.position.copy(pos);
    function arc(a, b, k, h) { var p = a.clone().lerp(b, k); p.y += Math.sin(Math.PI * k) * h; return p; }
    o.va = function (i, direct) {
      var a = balle.position.clone(), b = pose(i), d = a.distanceTo(b);
      if (direct || calme || d < 0.01) { balle.position.copy(b); vol = null; ligne.visible = false; fin = i === 4 ? 1 : 0; if (i === 4) balle.position.y -= 0.2; return; }
      var putt = i === 4 && etape4;                       // du green au trou : la balle roule
      var h = putt ? 0 : 0.6 + d * 0.3, pts = lg.attributes.position;
      for (var k = 0; k < NP; k++) { var p = arc(a, b, k / (NP - 1), h); pts.setXYZ(k, p.x, p.y, p.z); }
      pts.needsUpdate = true; ligne.computeLineDistances(); ligne.visible = true; lg.setDrawRange(0, 0);
      vol = { a: a, b: b, h: h, t: -1, d: putt ? 1.3 : 0.9 + d * 0.11, i: i, vise: 0.45 }; fin = 0; anneau.material.opacity = 0;
    };
    var etape4 = false;
    // Caméra : tourne autour d'un point qui suit la balle
    var cam = { az: 0, el: 0 }, cible = V(0, HAUT, 0), portrait = false, base = { az: 0.0, el: 0.62, R: 22, dy: 0, suit: 0.22 };
    glisse(boxT, cam, 1.1);
    o.surTaille = function () {
      var a = o.w / o.h; portrait = a < 1.05;
      // Écran étroit : vue plongeante depuis le départ, tout le trou tient dans le cadre. Écran large : vue de côté.
      var demi = Math.atan(Math.tan(15 * Math.PI / 180) * a);
      base = portrait ? { az: -1.45, el: 0.92, R: Math.max(6.4 / Math.tan(demi), 34), dy: 0, suit: 0.12 } : { az: -0.1, el: 0.6, R: 24.5 * Math.max(1, 1.9 / a), dy: 1.5, suit: 0.22 };
    };
    o.surTaille();
    var tmp = V(0, 0, 0), dernier = 0;
    o.frame = function (t) {
      var dt = Math.min(0.05, t - dernier); dernier = t;
      // drapeau et eau
      for (var i = 0; i < fp.count; i++) { var x = fz0[i]; fp.setZ(i, Math.sin(x * 7 - t * 5) * 0.07 * x * 1.6); } fp.needsUpdate = true;
      eau.material.opacity = 0.86 + Math.sin(t * 1.4) * 0.06;
      // vol de la balle : on trace d'abord la trajectoire, puis la balle la suit
      if (vol) {
        if (vol.t < 0) { vol.vise -= dt; lg.setDrawRange(0, Math.round(NP * Math.min(1, 1 - vol.vise / 0.45))); if (vol.vise <= 0) vol.t = 0; }
        else {
          vol.t += dt / vol.d; var k = Math.min(1, vol.t), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
          balle.position.copy(arc(vol.a, vol.b, vol.h ? k : e, vol.h));
          if (k >= 1) { ligne.visible = false; fin = vol.i === 4 ? 0.001 : 0; anneau.position.set(vol.b.x, vol.b.y - 0.13, vol.b.z); anneau.scale.setScalar(1); anneau.material.opacity = 0.9; vol = null; }
        }
      }
      if (fin > 0 && fin < 1) { fin = Math.min(1, fin + dt * 2.2); balle.position.y = pose(4).y - 0.2 * fin; }   // la balle tombe dans le trou
      if (anneau.material.opacity > 0) { anneau.scale.multiplyScalar(1 + dt * 3.2); anneau.material.opacity = Math.max(0, anneau.material.opacity - dt * 1.3); }
      ombre.position.set(balle.position.x, sol(0) - 0.14, balle.position.z); ombre.material.opacity = fin >= 1 ? 0 : 0.28;
      // caméra
      tmp.set(balle.position.x * base.suit, HAUT + base.dy, balle.position.z * (portrait ? 0.1 : 0.3)); cible.lerp(tmp, Math.min(1, dt * 2.2));
      var az = base.az + cam.az + (calme ? 0 : Math.sin(t * 0.22) * 0.05), elv = base.el + cam.el, R = base.R;
      o.cam.position.set(cible.x + R * Math.sin(az) * Math.cos(elv), cible.y + R * Math.sin(elv), cible.z + R * Math.cos(az) * Math.cos(elv));
      o.cam.lookAt(cible);
      place();
    };
    // Repères HTML (numéros d'étape et mots du vocabulaire) projetés sur la scène
    var pins = [], v3 = V(0, 0, 0);
    o.pin = function (node, p) { pins.push({ n: node, p: V(p[0], p[1], p[2]) }); };
    function place() {
      o.cam.updateMatrixWorld();
      pins.forEach(function (q) {
        v3.copy(q.p).project(o.cam);
        var vis = v3.z < 1 && Math.abs(v3.x) < 1.05 && Math.abs(v3.y) < 1.05;
        q.n.style.transform = "translate(" + ((v3.x * 0.5 + 0.5) * o.w).toFixed(1) + "px," + ((-v3.y * 0.5 + 0.5) * o.h).toFixed(1) + "px)";
        q.n.style.visibility = vis ? "" : "hidden";
      });
    }
    o.etape4 = function (b) { etape4 = b; };
    return o;
  }

  // La carte des étapes (HTML) : fonctionne avec ou sans 3D
  (function () {
    if (!boxT) return;
    var k = document.getElementById("dh-k"), t = document.getElementById("dh-t"), x = document.getElementById("dh-x"), act = document.getElementById("dh-act"),
      prev = document.getElementById("dh-prev"), next = document.getElementById("dh-next"), dots = document.getElementById("dh-dots").children,
      pinsBox = document.getElementById("dh-pins"), voc = document.getElementById("dh-voc"), def = document.getElementById("dh-def"), card = document.getElementById("dh-card");
    trou = construitTrou();
    var num = [];
    if (trou) {
      D.etapes.forEach(function (e, i) {
        var b = el("button", "dh-num", String(i + 1)); b.type = "button"; b.setAttribute("aria-label", "Étape " + (i + 1) + " : " + e.t);
        b.addEventListener("click", function () { aller(i); }); pinsBox.appendChild(b); num.push(b);
        trou.pin(b, [POSE[i][0], i === 4 ? 3.3 : 1.75, POSE[i][1]]);
      });
      D.terrain.forEach(function (m) {
        var b = el("button", "dh-mot", m.n); b.type = "button";
        b.addEventListener("click", function () { def.hidden = false; def.textContent = ""; def.appendChild(el("b", null, m.n)); def.appendChild(document.createTextNode(m.d)); });
        pinsBox.appendChild(b); trou.pin(b, REP[m.id]);
      });
    } else if (voc) voc.hidden = true;
    function montre(i) {
      var e = D.etapes[i];
      k.textContent = "Étape " + (i + 1) + " sur " + D.etapes.length + " · " + e.k; t.textContent = e.t; x.textContent = e.x;
      act.textContent = "";
      var b;
      if (e.c.charAt(0) === "?") { b = el("button", "btn gold sm db-ask", e.lib); b.type = "button"; b.dataset.q = e.c.slice(1); }
      else { b = el("a", "btn gold sm", e.lib); b.href = e.c; }
      act.appendChild(b);
      Array.prototype.forEach.call(dots, function (d, n) { d.classList.toggle("on", n === i); d.classList.toggle("fait", n < i); });
      num.forEach(function (n, j) { n.classList.toggle("on", j === i); n.classList.toggle("fait", j < i); });
      prev.disabled = i === 0;
      next.textContent = i === D.etapes.length - 1 ? "Rejouer le trou ↺" : "Coup suivant →";
      card.classList.remove("flash"); void card.offsetWidth; card.classList.add("flash");
    }
    function aller(i, direct) {
      i = Math.max(0, Math.min(D.etapes.length - 1, i));
      if (trou) { trou.etape4(etape === 3 && i === 4); trou.va(i, direct || Math.abs(i - etape) !== 1 || i < etape); }
      etape = i; montre(i);
    }
    next.addEventListener("click", function () { aller(etape === D.etapes.length - 1 ? 0 : etape + 1); });
    prev.addEventListener("click", function () { aller(etape - 1); });
    Array.prototype.forEach.call(dots, function (d, n) { d.addEventListener("click", function () { aller(n); }); });
    if (voc) voc.addEventListener("click", function () {
      var on = voc.getAttribute("aria-pressed") !== "true"; voc.setAttribute("aria-pressed", on ? "true" : "false");
      boxT.classList.toggle("voc", on); if (!on) def.hidden = true;
    });
    montre(0);
  })();

  /* =====================================================================
     2. LE SWING
     ===================================================================== */
  var boxS = document.getElementById("sw-scene");
  // Clés du mouvement, une par phase : instant, angle des mains sur le plan de swing, armé des poignets,
  // rotation des épaules, rotation des hanches, déplacement du poids, inclinaison du buste (degrés), talon droit, regard
  var KT = [0, 0.28, 0.5, 0.63, 0.72, 1],
    K = { th: [0, -88, -166, -84, 4, 162], po: [0, -74, -98, -96, -5, 95], ep: [0, 48, 92, 38, -20, -104], ha: [0, 18, 42, -4, -38, -88],
      px: [0, -0.04, -0.06, 0.03, 0.07, 0.11], bu: [32, 32, 31, 32, 30, 9],
      tl: [0, 0, 0, 0.04, 0.3, 1], tt: [0, 0, 0, 0, 10, 72] };   // talon droit qui se lève, tête qui se tourne vers la cible
  function cle(v, t) {
    var n = KT.length, i = 0; while (i < n - 2 && t > KT[i + 1]) i++;
    var h = KT[i + 1] - KT[i], s = Math.max(0, Math.min(1, (t - KT[i]) / h));
    var m0 = i > 0 ? (v[i + 1] - v[i - 1]) / (KT[i + 1] - KT[i - 1]) : 0, m1 = i < n - 2 ? (v[i + 2] - v[i]) / (KT[i + 2] - KT[i]) : 0;
    var s2 = s * s, s3 = s2 * s;
    return (2 * s3 - 3 * s2 + 1) * v[i] + (s3 - 2 * s2 + s) * h * m0 + (-2 * s3 + 3 * s2) * v[i + 1] + (s3 - s2) * h * m1;
  }

  function construitSwing() {
    var o = monte(boxS, 30); if (!o) return null;
    var sc = o.sc, RAD = Math.PI / 180, AXE_Y = V(0, 1, 0);
    // Lumière : ombres portées douces, plus un contre-jour pour détacher le personnage du fond
    o.r.shadowMap.enabled = true; o.r.shadowMap.type = T.PCFSoftShadowMap;
    var sol = o.soleil; sol.position.set(3.0, 7.5, 4.8); sol.intensity = 1.15; sol.castShadow = true; sol.shadow.mapSize.set(1024, 1024);
    var oc = sol.shadow.camera; oc.left = -2.4; oc.right = 2.4; oc.top = 2.4; oc.bottom = -2.4; oc.near = 1; oc.far = 22; oc.updateProjectionMatrix();
    sol.shadow.bias = -0.0006; sol.shadow.radius = 5; sol.target.position.set(0.2, 0.5, 0.3); sc.add(sol.target);
    var contre = new T.DirectionalLight(0xbfe8d6, 0.55); contre.position.set(-4, 3.5, -5); sc.add(contre);
    function m(c, r, me) { var x = new T.MeshStandardMaterial({ color: c, roughness: r == null ? 0.7 : r, metalness: me || 0 }); x.color.convertSRGBToLinear(); return x; }
    var PEAU = m(0xd9a47b, 0.6), POLO = m(0xf6f3ea, 0.82), MENTHE = m(0x8fc4ad, 0.75), PANT = m(0x1e4a3d, 0.88), CUIR = m(0x2b1e15, 0.5), BLANC = m(0xfbfbf7, 0.45),
      SEMELLE = m(0x232c28, 0.85), CHEVEUX = m(0x3b2a1e, 0.95), ACIER = m(0xe2e8e5, 0.22, 0.9), GRIP = m(0x151a18, 0.92), FONCE = m(0x18201d, 0.3, 0.7), OEIL = m(0x1c1612, 0.4);

    // Sol : un disque d'herbe tondue en bandes, qui reçoit l'ombre
    var cv = document.createElement("canvas"); cv.width = cv.height = 512; var g2 = cv.getContext("2d");
    g2.fillStyle = "#256b47"; g2.fillRect(0, 0, 512, 512);
    for (var b = 0; b < 8; b++) { g2.fillStyle = b % 2 ? "rgba(255,255,255,.075)" : "rgba(0,0,0,.075)"; g2.fillRect(b * 64, 0, 64, 512); }
    for (var n = 0; n < 5200; n++) { g2.fillStyle = n % 2 ? "rgba(255,255,255,.045)" : "rgba(0,45,22,.07)"; g2.fillRect(Math.random() * 512, Math.random() * 512, 1.5, 3 + Math.random() * 3); }
    var herbe = new T.CanvasTexture(cv); herbe.encoding = T.sRGBEncoding; herbe.anisotropy = 4;
    var cote = m(0x1a5a3e, 0.9);
    var disque = new T.Mesh(new T.CylinderGeometry(1.75, 1.75, 0.06, 72), [cote, new T.MeshStandardMaterial({ map: herbe, roughness: 0.95 }), cote]);
    disque.position.set(0.25, -0.03, 0.35); disque.rotation.y = 0.55; disque.receiveShadow = true; sc.add(disque);
    var bord = new T.Mesh(new T.CylinderGeometry(1.8, 1.6, 0.22, 72), m(0x103a2c, 0.9)); bord.position.set(0.25, -0.15, 0.35); sc.add(bord);
    var BZ = 0.82, rails = [];
    [[BZ, 0xffffff], [0.0, 0xa3c9b8]].forEach(function (r) {
      var x = new T.Mesh(new T.BoxGeometry(2.9, 0.012, 0.035), new T.MeshBasicMaterial({ color: r[1], transparent: true, opacity: 0 })); x.position.set(0.25, 0.008, r[0]); sc.add(x); rails.push(x);
    });
    var balle = new T.Mesh(new T.SphereGeometry(0.0235, 18, 14), BLANC); balle.castShadow = true; sc.add(balle);
    var trait = new T.Mesh(new T.BoxGeometry(1, 0.006, 0.012), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 })); sc.add(trait);

    /* ----- Le personnage : un golfeur modélisé (buste, bassin, tête, membres articulés), replacé à chaque image ----- */
    var perso = new T.Group(); sc.add(perso);
    function ajoute(x, parent) { x.castShadow = true; (parent || perso).add(x); return x; }
    function membre(rA, rB, mt) { return ajoute(new T.Mesh(new T.CylinderGeometry(rB, rA, 1, 22), mt)); }       // rA : rayon au départ, rB : à l'arrivée
    function boule(r, mt, sx, sy, sz, parent) { var x = ajoute(new T.Mesh(new T.SphereGeometry(r, 24, 18), mt), parent); if (sx) x.scale.set(sx, sy, sz); return x; }
    function tour(pts, mt) { return ajoute(new T.Mesh(new T.LatheGeometry(pts.map(function (p) { return new T.Vector2(p[0], p[1]); }), 36), mt)); }
    var tv = V(0, 0, 0);
    function tige(x, A, B) { tv.copy(B).sub(A); var L = tv.length() || 0.0001; x.position.copy(A).addScaledVector(tv, 0.5); x.scale.set(1, L, 1); x.quaternion.setFromUnitVectors(AXE_Y, tv.divideScalar(L)); }
    var mx = new T.Matrix4(), bx = V(0, 0, 0), by = V(0, 0, 0), bz = V(0, 0, 0);
    function oriente(x, pos, droite, haut) {      // repère : « haut » exact, « droite » approximative, l'avant s'en déduit
      by.copy(haut).normalize(); bz.crossVectors(droite, by).normalize(); bx.crossVectors(by, bz);
      mx.makeBasis(bx, by, bz); x.quaternion.setFromRotationMatrix(mx); x.position.copy(pos);
    }
    function coude(A, C, l1, l2, pole) {          // articulation intermédiaire (coude, genou) entre deux points
      var d = C.clone().sub(A), L = Math.min(d.length(), l1 + l2 - 0.001), dir = d.normalize();
      var a = (l1 * l1 - l2 * l2 + L * L) / (2 * L), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
      var p = pole.clone().addScaledVector(dir, -pole.dot(dir)); if (p.lengthSq() < 1e-6) p.set(0, 0, 1); p.normalize();
      return A.clone().addScaledVector(dir, a).addScaledVector(p, h);
    }
    // Buste (polo) : taille, poitrine, épaules, base du cou. Bassin (pantalon) avec ceinture.
    var torse = tour([[0.0, -0.02], [0.112, 0], [0.124, 0.08], [0.148, 0.2], [0.17, 0.3], [0.186, 0.375], [0.182, 0.415], [0.14, 0.455], [0.075, 0.485], [0.05, 0.5], [0, 0.505]], POLO); torse.scale.z = 0.68;
    var col = ajoute(new T.Mesh(new T.TorusGeometry(0.058, 0.02, 10, 28), MENTHE), torse); col.rotation.x = Math.PI / 2; col.position.y = 0.485; col.scale.set(1, 1.2, 1);
    var bassin = tour([[0, -0.17], [0.09, -0.16], [0.146, -0.09], [0.152, -0.01], [0.136, 0.07], [0.116, 0.13], [0, 0.135]], PANT); bassin.scale.z = 0.8;
    var ceinture = ajoute(new T.Mesh(new T.TorusGeometry(0.122, 0.015, 10, 36), CUIR), bassin); ceinture.rotation.x = Math.PI / 2; ceinture.position.y = 0.105;
    ajoute(new T.Mesh(new T.BoxGeometry(0.04, 0.032, 0.012), ACIER), bassin).position.set(0, 0.105, 0.136);
    // Tête : crâne, cheveux, oreilles, nez, yeux, casquette à visière
    var tete = new T.Group(); perso.add(tete);
    boule(0.1, PEAU, 0.9, 1.08, 1.0, tete);
    boule(0.103, CHEVEUX, 0.93, 1.0, 1.0, tete).position.set(0, 0.012, -0.014);
    [1, -1].forEach(function (s) { boule(0.024, PEAU, 0.45, 1, 0.75, tete).position.set(s * 0.09, -0.005, 0); boule(0.0105, OEIL, 1, 1, 1, tete).position.set(s * 0.034, 0.014, 0.089); });
    boule(0.017, PEAU, 0.9, 1.1, 1.2, tete).position.set(0, -0.012, 0.097);
    var calotte = ajoute(new T.Mesh(new T.SphereGeometry(0.109, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.5), MENTHE), tete); calotte.position.y = 0.024; calotte.scale.set(0.95, 0.98, 1.03);
    var visiere = ajoute(new T.Mesh(new T.CylinderGeometry(0.1, 0.1, 0.012, 28, 1, false, -Math.PI / 2, Math.PI), MENTHE), tete); visiere.position.set(0, 0.03, 0.072); visiere.scale.set(0.9, 1, 1.2); visiere.rotation.x = 0.2;
    boule(0.014, BLANC, 1, 0.6, 1, tete).position.set(0, 0.13, 0);
    var cou = membre(0.05, 0.044, PEAU);
    // Bras : épaule, manche du polo, bras, coude, avant-bras, main (gant blanc à la main gauche)
    var bras = [0, 1].map(function (k) {
      return { ep: boule(0.062, POLO), manche: membre(0.06, 0.054, POLO), lisere: membre(0.056, 0.056, MENTHE), haut: membre(0.046, 0.04, PEAU), co: boule(0.041, PEAU), bas: membre(0.039, 0.03, PEAU), main: boule(0.043, k ? PEAU : BLANC, 0.9, 1.15, 0.8) };
    });
    // Jambes : cuisse, genou, mollet (pantalon), chaussure (dessus blanc, semelle)
    var jambes = [0, 1].map(function () {
      var ch = new T.Group(); ch.rotation.order = "YXZ"; perso.add(ch);
      boule(1, SEMELLE, 0.057, 0.017, 0.128, ch).position.set(0, 0.017, 0.045);
      boule(1, BLANC, 0.052, 0.05, 0.118, ch).position.set(0, 0.048, 0.04);
      boule(1, BLANC, 0.046, 0.05, 0.05, ch).position.set(0, 0.07, -0.02);
      return { haut: membre(0.092, 0.066, PANT), ge: boule(0.066, PANT), bas: membre(0.064, 0.046, PANT), ch: ch };
    });
    // Club : grip, manche en acier, tête de fer avec sa face
    var grip = membre(0.0145, 0.012, GRIP), manche = membre(0.0068, 0.0052, ACIER), tetec = ajoute(new T.Mesh(new T.BoxGeometry(0.08, 0.052, 0.02), FONCE));
    ajoute(new T.Mesh(new T.BoxGeometry(0.07, 0.044, 0.004), ACIER), tetec).position.z = 0.0105;

    var U = V(1, 0, 0), Vp = V(0, -0.92, 0.39).normalize(), BRAS = 0.58, CLUB = 0.9;
    var P = V(0, 0, 0), N = V(0, 0, 0), dos = V(0, 0, 0), av = V(0, 0, 0), H = V(0, 0, 0), H2 = V(0, 0, 0), bout = V(0, 0, 0), dc = V(0, 0, 0), nf = V(0, 0, 0), orteil = V(0, 0, 0),
      E = [V(0, 0, 0), V(0, 0, 0)], Hp = [V(0, 0, 0), V(0, 0, 0)], CH = [V(0, 0, 0), V(0, 0, 0)], PX = [0.22, -0.22], a1 = V(0, 0, 0), a2 = V(0, 0, 0), a3 = V(0, 0, 0);
    o.pose = function (t) {
      var th = cle(K.th, t) * RAD, po = cle(K.po, t) * RAD, ep = cle(K.ep, t) * RAD, ha = cle(K.ha, t) * RAD, px = cle(K.px, t), bu = cle(K.bu, t) * RAD,
        tl = Math.max(0, cle(K.tl, t)), tt = cle(K.tt, t) * RAD;
      P.set(px, 0.93, -0.07); dos.set(0, Math.cos(bu), Math.sin(bu)); av.set(0, -Math.sin(bu), Math.cos(bu)); N.copy(P).addScaledVector(dos, 0.54);
      // épaules (elles tournent autour de la colonne) et hanches
      for (var k = 0; k < 2; k++) {
        var s = k ? -1 : 1;
        E[k].copy(N).addScaledVector(U, s * 0.192 * Math.cos(ep)).addScaledVector(av, s * 0.192 * Math.sin(ep));
        Hp[k].set(P.x + s * 0.105 * Math.cos(ha), P.y - 0.06, P.z + s * 0.105 * Math.sin(ha));
      }
      oriente(torse, a1.copy(P).addScaledVector(dos, 0.1), a2.copy(E[0]).sub(E[1]), dos);
      oriente(bassin, P, a2.set(Math.cos(ha), 0, Math.sin(ha)), a3.set(0, 0.75, 0).addScaledVector(dos, 0.25));
      // tête : elle regarde la balle jusqu'à l'impact, puis se tourne vers la cible
      var Tt = a1.copy(N).addScaledVector(dos, 0.2).addScaledVector(av, 0.03);
      a3.copy(dos).multiplyScalar(0.8).add(AXE_Y).normalize();
      a2.copy(av).multiplyScalar(Math.cos(tt)).addScaledVector(U, Math.sin(tt)); a2.y -= 0.25 * Math.cos(tt);
      bz.crossVectors(a3, a2); oriente(tete, Tt, bz.clone(), a3);
      tige(cou, a2.copy(N).addScaledVector(dos, 0.02), a3.copy(Tt).addScaledVector(dos, -0.05));
      // mains sur le plan de swing ; le club les prolonge, avec l'armé des poignets
      H.copy(N).addScaledVector(U, Math.sin(th) * BRAS).addScaledVector(Vp, Math.cos(th) * BRAS);
      var ph = th + po; dc.set(0, 0, 0).addScaledVector(U, Math.sin(ph)).addScaledVector(Vp, Math.cos(ph)); nf.set(0, 0, 0).addScaledVector(U, Math.cos(ph)).addScaledVector(Vp, -Math.sin(ph));
      bout.copy(H).addScaledVector(dc, CLUB); H2.copy(H).addScaledVector(dc, 0.085);
      for (k = 0; k < 2; k++) {
        var Hk = k ? H2 : H, c = coude(E[k], Hk, 0.33, 0.33, a2.set(k ? -0.5 : 0.5, -1, -0.15)), b = bras[k];
        b.ep.position.copy(E[k]); tige(b.manche, E[k], a2.copy(E[k]).lerp(c, 0.58)); tige(b.lisere, a2.copy(E[k]).lerp(c, 0.55), a3.copy(E[k]).lerp(c, 0.62));
        tige(b.haut, a2.copy(E[k]).lerp(c, 0.5), c); b.co.position.copy(c); tige(b.bas, c, Hk);
        b.main.position.copy(Hk); b.main.quaternion.setFromUnitVectors(AXE_Y, dc);
        // pieds : le gauche reste à plat ; le droit se lève sur la pointe et pivote vers la cible en fin de geste
        var lev = k ? tl : 0, ch = jambes[k].ch;
        ch.position.set(PX[k] + (k ? lev * 0.03 : 0), lev * 0.035, lev * 0.02); ch.rotation.set(lev * 1.05, k ? -0.12 + lev * 0.95 : 0.3, 0);
        CH[k].set(ch.position.x, 0.085 + lev * 0.13, ch.position.z - 0.015 + lev * 0.03);
        var g = coude(Hp[k], CH[k], 0.45, 0.45, a2.set(-Math.sin(ha) * 0.9 + (k ? lev * 0.6 : 0), 0, Math.cos(ha) + 0.25));
        tige(jambes[k].haut, Hp[k], g); jambes[k].ge.position.copy(g); tige(jambes[k].bas, g, CH[k]);
      }
      tige(grip, a2.copy(H).addScaledVector(dc, -0.08), a3.copy(H).addScaledVector(dc, 0.2)); tige(manche, a3, bout);
      orteil.crossVectors(dc, nf).normalize(); oriente(tetec, a2.copy(bout).addScaledVector(orteil, 0.028).addScaledVector(dc, -0.012), orteil, dc);
      // la balle part à l'impact
      var imp = KT[4];
      if (t < imp) { balle.position.set(0.03, 0.0235, BZ); balle.visible = true; trait.material.opacity = 0; }
      else { var a = (t - imp) / (1 - imp), d = a * 5.5; balle.position.set(0.03 + d, 0.0235 + Math.sin(Math.min(1, a) * 1.2) * 1.5, BZ); balle.visible = d < 4.6;
        trait.scale.set(Math.min(d, 2.2), 1, 1); trait.position.set(0.03 + Math.min(d, 2.2) / 2, 0.012, BZ); trait.material.opacity = 0.75 * (1 - a * 0.6); }
    };
    // Caméra : face, profil, ou gros plans ; on peut tourner à la souris ou au doigt
    var VUES = { face: { c: [0.12, 0.68, 0.3], az: 0.05, el: 0.16, R: 5.2 }, profil: { c: [0.0, 0.68, 0.35], az: -1.5, el: 0.16, R: 5.2 },
      grip: { c: [0, 0.83, 0.5], az: 0.5, el: 0.3, R: 1.5 }, posture: { c: [0, 0.82, 0.3], az: -1.5, el: 0.08, R: 4.4 }, alignement: { c: [0.3, 0.2, 0.42], az: -1.25, el: 0.85, R: 5.8 } };
    var vue = "face", cam = { az: 0, el: 0 }, cur = { c: V(0.12, 0.68, 0.3), az: 0.05, el: 0.16, R: 5.2 }, echelle = 1;
    glisse(boxS, cam, 3.2);
    o.vue = function (n) { vue = n; cam.az = 0; cam.el = 0; };
    o.surTaille = function () { echelle = Math.max(1, 0.82 / (o.w / o.h)); };
    o.surTaille();
    var dernier = 0;
    o.frame = function (t) {
      var dt = Math.min(0.05, t - dernier); dernier = t;
      var v = VUES[vue], k = Math.min(1, dt * 4);
      cur.c.lerp(V(v.c[0], v.c[1], v.c[2]), k); cur.az = lerp(cur.az, v.az + cam.az, k); cur.el = lerp(cur.el, v.el + cam.el, k); cur.R = lerp(cur.R, v.R * echelle, k);
      o.cam.position.set(cur.c.x + cur.R * Math.sin(cur.az) * Math.cos(cur.el), cur.c.y + cur.R * Math.sin(cur.el), cur.c.z + cur.R * Math.cos(cur.az) * Math.cos(cur.el));
      o.cam.lookAt(cur.c);
      var cibleR = vue === "alignement" ? 0.95 : 0; rails.forEach(function (r) { r.material.opacity = lerp(r.material.opacity, cibleR, k); });
      if (o.anime) o.anime(dt);
    };
    o.pose(0);
    return o;
  }

  (function () {
    if (!boxS) return;
    var cap = document.getElementById("sw-cap"), tabs = document.getElementById("sw-phases").children, play = document.getElementById("sw-play"),
      range = document.getElementById("sw-t"), vues = document.getElementById("sw-vues").children, zooms = document.getElementById("sw-zooms").querySelectorAll("button");
    var sw = construitSwing(), t = 0, cible = null, lecture = false, phase = 0;
    function dit(nom, x) { cap.textContent = ""; cap.appendChild(el("b", null, nom)); cap.appendChild(document.createTextNode(x)); }
    function phaseDe(tt) { var i = 0; for (var k = 0; k < KT.length; k++) if (tt >= KT[k] - 0.035) i = k; return i; }
    function maj(z) {
      var p = phaseDe(t);
      if (p !== phase || z === 0) { phase = p; if (!zoomActif) dit(D.swing[p].n, D.swing[p].x); }
      Array.prototype.forEach.call(tabs, function (b, i) { b.setAttribute("aria-selected", i === phase && !zoomActif ? "true" : "false"); });
      range.value = Math.round(t * 1000); if (sw) sw.pose(t);
    }
    var zoomActif = null;
    function zoom(id) {
      zoomActif = id;
      Array.prototype.forEach.call(zooms, function (b) { b.setAttribute("aria-pressed", b.dataset.z === id ? "true" : "false"); });
      if (id) { var z = D.zooms.filter(function (q) { return q.id === id; })[0]; lecture = false; cible = 0; play.textContent = "▶"; dit(z.n, z.x); if (sw) sw.vue(id); }
    }
    function vueNormale() {
      if (!zoomActif) return; zoom(null);
      var v = "face"; Array.prototype.forEach.call(vues, function (b) { if (b.getAttribute("aria-pressed") === "true") v = b.dataset.v; });
      if (sw) sw.vue(v); phase = -1;
    }
    Array.prototype.forEach.call(tabs, function (b, i) { b.addEventListener("click", function () { vueNormale(); lecture = false; play.textContent = "▶"; cible = KT[i]; if (calme || !sw) { t = cible; cible = null; } maj(); }); });
    play.addEventListener("click", function () {
      vueNormale();
      if (lecture) { lecture = false; play.textContent = "▶"; return; }
      if (t >= 0.999) t = 0; lecture = true; cible = null; play.textContent = "❚❚";
      if (!sw) { t = 1; lecture = false; play.textContent = "▶"; maj(); }
    });
    range.addEventListener("input", function () { vueNormale(); lecture = false; cible = null; play.textContent = "▶"; t = range.value / 1000; maj(); });
    Array.prototype.forEach.call(vues, function (b) { b.addEventListener("click", function () {
      zoom(null); Array.prototype.forEach.call(vues, function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); }); if (sw) sw.vue(b.dataset.v); phase = -1; maj();
    }); });
    Array.prototype.forEach.call(zooms, function (b) { b.addEventListener("click", function () { if (zoomActif === b.dataset.z) { vueNormale(); maj(); } else { zoom(b.dataset.z); t = 0; cible = null; maj(); } }); });
    if (sw) sw.anime = function (dt) {
      if (lecture) { t += dt * (t < KT[2] ? 0.3 : t < KT[4] ? 0.34 : 0.42); if (t >= 1) { t = 1; lecture = false; play.textContent = "↺"; } maj(); }
      else if (cible != null) { var d = cible - t; if (Math.abs(d) < 0.004) { t = cible; cible = null; } else t += d * Math.min(1, dt * 5); maj(); }
    };
    dit(D.swing[0].n, D.swing[0].x); maj(0);
    // Premier passage à l'écran : le swing se joue une fois tout seul
    if (sw && !calme && window.IntersectionObserver) {
      var io = new IntersectionObserver(function (e) { if (e[0].isIntersecting && e[0].intersectionRatio > 0.55) { io.disconnect(); if (t === 0 && !zoomActif) { lecture = true; play.textContent = "❚❚"; } } }, { threshold: [0.6] });
      io.observe(boxS);
    }
  })();
})();
