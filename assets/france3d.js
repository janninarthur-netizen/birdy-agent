/* Birdy Golf : la France en 3D.
   - la carte pointillée de France apparaît en s'élevant, puis tourne doucement (glisser pour la faire pivoter) ;
   - les 621 golfs brillent et des ondes partent des parcours ;
   - survol : nom du golf ; clic : demande de départ ;
   - recherche : la caméra zoome sur la zone et des faisceaux de lumière sortent des golfs trouvés.
   Three.js r128 (cdnjs). Rien ne s'affiche sans WebGL ; animations réduites si l'utilisateur le demande. */
(function () {
  "use strict";
  var cv = document.getElementById("gp-3d");
  if (!cv || !window.THREE || !window.BirdyGolf) return;
  var calme = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Thème clair (classe « clair » sur <html>) : points vert foncé sur fond clair, sans effet lumineux additif
  var CLAIR = document.documentElement.classList.contains("clair");
  var MELANGE = CLAIR ? THREE.NormalBlending : THREE.AdditiveBlending;
  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); } catch (e) { return; }
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  var scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  var pivot = new THREE.Group(), carte = new THREE.Group(); pivot.add(carte); scene.add(pivot);
  var K = 0.72, cosL = Math.cos(46.6 * Math.PI / 180);
  function xy(la, lo) { return [(lo - 2.45) * cosL * K, (la - 46.6) * K]; }
  function metro(la, lo) { return la > 41 && la < 51.6 && lo > -5.6 && lo < 10; }
  var tip = document.getElementById("gp-tip");

  var vert = [
    "attribute float taille; attribute float phase; attribute float hi; uniform float t; uniform float px; uniform float lev; uniform float zoom;",
    "varying float vA; varying float vHi;",
    "void main(){ vec3 p = position; p.z += (1.0 - lev) * (-2.0 + phase * 0.25);",
    " vec4 mv = modelViewMatrix * vec4(p,1.0);",
    " float s = taille * (1.0 + 0.25*sin(t*1.6 + phase)) * (1.0 + hi*1.1) * zoom;",
    " gl_PointSize = s * px * (13.0 / -mv.z); vA = 0.55 + 0.45*sin(t*1.3 + phase); vHi = hi; gl_Position = projectionMatrix * mv; }"
  ].join("\n");
  var frag = [
    "uniform vec3 c1; uniform vec3 c2; uniform float base; uniform float sel; uniform float lev; varying float vA; varying float vHi;",
    "void main(){ vec2 d = gl_PointCoord - 0.5; float r = length(d); if (r > 0.5) discard;",
    " float a = smoothstep(0.5, 0.0, r); vec3 c = mix(c1, c2, vHi);",
    " gl_FragColor = vec4(c, lev * a * (base + (1.0-base)*vA) * mix(1.0 - sel*0.72, 1.0, vHi)); }"
  ].join("\n");
  function nuage(pts, opt) {
    var g = new THREE.BufferGeometry(), n = pts.length, pos = new Float32Array(n * 3), ta = new Float32Array(n), ph = new Float32Array(n), hi = new Float32Array(n);
    pts.forEach(function (p, i) { pos[i * 3] = p[0]; pos[i * 3 + 1] = p[1]; pos[i * 3 + 2] = p[2] || 0; ta[i] = opt.taille * (p[3] || 1); ph[i] = Math.random() * 6.28; });
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("taille", new THREE.BufferAttribute(ta, 1));
    g.setAttribute("phase", new THREE.BufferAttribute(ph, 1)); g.setAttribute("hi", new THREE.BufferAttribute(hi, 1));
    var m = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, transparent: true, depthWrite: false, blending: MELANGE,
      uniforms: { t: { value: 0 }, zoom: { value: 1 }, px: { value: renderer.getPixelRatio() }, lev: { value: calme ? 1 : 0 }, sel: { value: 0 },
        c1: { value: new THREE.Color(opt.c1) }, c2: { value: new THREE.Color(opt.c2 || "#FFFFFF") }, base: { value: opt.base } } });
    var o = new THREE.Points(g, m); carte.add(o); return o;
  }

  var fond, golfs, liste = [], ondes = [], faisceaux = new THREE.Group(), visible = true, mx = 0, my = 0, survol = -1;
  carte.add(faisceaux);
  var vise = { x: 0, y: 0, s: 1 }, actuel = { x: 0, y: 0, s: 1 }, glisse = 0, tourne = 0, depart = null;

  Promise.all([BirdyGolf.charger(), fetch("/data/france-points.json").then(function (r) { return r.json(); })]).then(function (x) {
    fond = nuage(x[1].map(function (v) { var p = xy(v[0], v[1]); return [p[0], p[1], 0, 1]; }), CLAIR ? { taille: 2.8, c1: "#7FAE97", base: 0.95 } : { taille: 3.1, c1: "#9AD6BC", base: 1.0 });
    liste = x[0].golfs.filter(function (g) { return metro(g.la, g.lo); });
    golfs = nuage(liste.map(function (g) { var p = xy(g.la, g.lo); return [p[0], p[1], 0.06, g.t18 ? 1.25 : 0.8]; }), CLAIR ? { taille: 5.2, c1: "#2F7A55", c2: "#0E3A31", base: 0.75 } : { taille: 6.4, c1: "#F4FFF9", c2: "#FFFFFF", base: 0.75 });
    taille(); cv.classList.add("on"); depart = performance.now();
  }).catch(function () {});

  // Ondes : un anneau s'élargit autour d'un golf (au hasard, ou parmi les golfs trouvés)
  var anneau = new THREE.RingGeometry(0.05, 0.058, 48), choisis = [];
  function onde() {
    if (!golfs || !liste.length) return;
    var pos = golfs.geometry.attributes.position.array, i = choisis.length ? choisis[Math.floor(Math.random() * choisis.length)] : Math.floor(Math.random() * liste.length);
    var m = new THREE.Mesh(anneau, new THREE.MeshBasicMaterial({ color: CLAIR ? 0x2F7A55 : 0xA3C9B8, transparent: true, opacity: 0.7, depthWrite: false, blending: MELANGE }));
    m.position.set(pos[i * 3], pos[i * 3 + 1], 0.07); m.userData.t = 0; carte.add(m); ondes.push(m);
  }
  // Faisceaux lumineux verticaux au-dessus des golfs trouvés
  var faisceauGeo = new THREE.CylinderGeometry(0.012, 0.03, 1, 6, 1, true); faisceauGeo.rotateX(Math.PI / 2); faisceauGeo.translate(0, 0, 0.5);
  function faisceauxPour(idx) {
    while (faisceaux.children.length) { var c = faisceaux.children.pop(); c.material.dispose(); }
    var pos = golfs.geometry.attributes.position.array;
    idx.slice(0, 80).forEach(function (i, k) {
      var m = new THREE.Mesh(faisceauGeo, new THREE.MeshBasicMaterial({ color: CLAIR ? 0x2F7A55 : 0xD0E4DC, transparent: true, opacity: 0.55, depthWrite: false, blending: MELANGE }));
      m.position.set(pos[i * 3], pos[i * 3 + 1], 0.06); m.scale.set(1, 1, 0.001);
      m.userData = { t: -k * 0.03, h: 0.35 + Math.random() * 0.45 }; faisceaux.add(m);
    });
  }
  window.BirdyGolf3D = {
    onPick: null,
    surligne: function (ids) {
      if (!golfs) return;
      var set = {}, a = golfs.geometry.attributes.hi, pos = golfs.geometry.attributes.position.array;
      (ids || []).forEach(function (x) { set[x] = 1; });
      choisis = [];
      for (var k = 0; k < liste.length; k++) { var on = set[liste[k].i] ? 1 : 0; a.array[k] = on; if (on) choisis.push(k); }
      a.needsUpdate = true;
      golfs.material.uniforms.sel.value = choisis.length ? 1 : 0;
      faisceauxPour(choisis);
      // Caméra : centrer et zoomer sur la zone trouvée
      if (choisis.length) {
        var x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
        choisis.forEach(function (i) { x0 = Math.min(x0, pos[i * 3]); x1 = Math.max(x1, pos[i * 3]); y0 = Math.min(y0, pos[i * 3 + 1]); y1 = Math.max(y1, pos[i * 3 + 1]); });
        var span = Math.max(x1 - x0, y1 - y0, 0.35);
        vise = { x: -(x0 + x1) / 2, y: -(y0 + y1) / 2, s: Math.max(1, Math.min(4.2, 3.4 / span)) };
      } else vise = { x: 0, y: 0, s: 1 };
    }
  };

  // Survol et clic sur un golf (recherche du point le plus proche à l'écran)
  var v3 = new THREE.Vector3();
  function proche(cx, cy) {
    if (!golfs) return -1;
    var r = cv.getBoundingClientRect(), pos = golfs.geometry.attributes.position.array, best = -1, bd = 14 * 14;
    for (var i = 0; i < liste.length; i++) {
      v3.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]).applyMatrix4(golfs.matrixWorld).project(cam);
      var sx = (v3.x + 1) / 2 * r.width, sy = (1 - v3.y) / 2 * r.height, d = (sx - cx) * (sx - cx) + (sy - cy) * (sy - cy);
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }
  function montre(i, cx, cy) {
    survol = i;
    cv.classList.toggle("pick", i >= 0);
    if (!tip) return;
    if (i < 0) { tip.hidden = true; return; }
    var g = liste[i]; tip.innerHTML = ""; tip.appendChild(document.createTextNode(g.n));
    var sm = document.createElement("small"); sm.textContent = g.v + " (" + g.d + ") · " + BirdyGolf.trousTxt(g).join(", "); tip.appendChild(sm);
    tip.style.left = cx + "px"; tip.style.top = cy + "px"; tip.hidden = false;
  }
  var bas = null;
  cv.addEventListener("pointermove", function (e) {
    var r = cv.getBoundingClientRect(), cx = e.clientX - r.left, cy = e.clientY - r.top;
    if (bas) { tourne += (e.clientX - bas.x) * 0.006; glisse += Math.abs(e.clientX - bas.x); bas = { x: e.clientX }; montre(-1); return; }
    montre(proche(cx, cy), cx, cy);
  });
  cv.addEventListener("pointerleave", function () { montre(-1); bas = null; });
  var vise_clic = -1;
  cv.addEventListener("pointerdown", function (e) { bas = { x: e.clientX }; glisse = 0; vise_clic = survol; });
  cv.addEventListener("pointerup", function (e) {
    var r = cv.getBoundingClientRect(), cx = e.clientX - r.left, cy = e.clientY - r.top, i = glisse < 6 ? (vise_clic >= 0 ? vise_clic : proche(cx, cy)) : -1;
    bas = null;
    if (i >= 0 && window.BirdyGolf3D.onPick) window.BirdyGolf3D.onPick(liste[i].i);
  });
  addEventListener("pointermove", function (e) { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; }, { passive: true });

  function taille() {
    var r = cv.getBoundingClientRect(); if (!r.width || !r.height) return;
    renderer.setSize(r.width, r.height, false); cam.aspect = r.width / r.height;
    // Cadrage : la France remplit la zone, centrée (un peu plus loin sur écran étroit)
    var loin = r.width / r.height < 0.9 ? 10.8 : 9.3;
    cam.position.set(0, -4.4, loin); cam.lookAt(0, 0.05, 0); pivot.position.x = r.width > 520 ? -0.55 : 0; cam.updateProjectionMatrix();
  }
  addEventListener("resize", taille);
  if (window.IntersectionObserver) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(cv);
  var t0 = performance.now(), prochaine = 0;
  function ease(x) { return 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3); }
  function dessine(now) {
    var t = (now - t0) / 1000, lev = depart ? (calme ? 1 : ease((now - depart) / 2200)) : 0;
    [fond, golfs].forEach(function (o) { if (o) { var u = o.material.uniforms; u.t.value = t; u.lev.value = lev; u.zoom.value = Math.pow(actuel.s, o === fond ? 0.75 : 0.45); } });
    // Arrivée : la carte s'incline et se pose ; ensuite léger balancement + parallaxe souris + rotation à la main
    pivot.rotation.x = -0.9 * (1 - lev) - 0.1 + my * 0.1;
    pivot.rotation.z = (calme ? 0 : Math.sin(t * 0.12) * 0.18) + mx * 0.2 + tourne + (1 - lev) * 0.6;
    tourne *= 0.985;
    actuel.x += (vise.x - actuel.x) * 0.06; actuel.y += (vise.y - actuel.y) * 0.06; actuel.s += (vise.s - actuel.s) * 0.06;
    carte.position.set(actuel.x * actuel.s, actuel.y * actuel.s, 0); carte.scale.setScalar(actuel.s);
    if (!calme && lev > 0.9 && t > prochaine) { onde(); prochaine = t + (choisis.length ? 0.28 : 0.7); }
    for (var i = ondes.length - 1; i >= 0; i--) {
      var o = ondes[i]; o.userData.t += 0.016; var k = o.userData.t;
      o.scale.setScalar((1 + k * 6) / Math.sqrt(actuel.s)); o.material.opacity = Math.max(0, 0.7 - k * 0.6);
      if (k > 1.2) { carte.remove(o); o.material.dispose(); ondes.splice(i, 1); }
    }
    faisceaux.children.forEach(function (m) {
      m.userData.t += 0.02; var h = ease(m.userData.t * 1.6) * m.userData.h;
      m.scale.set(1, 1, Math.max(0.001, h / actuel.s * 1.6)); m.material.opacity = 0.35 + 0.25 * Math.sin(t * 3 + m.position.x * 9);
    });
    renderer.render(scene, cam);
  }
  (function boucle(now) { if (visible) dessine(now); requestAnimationFrame(boucle); })(performance.now());
})();
