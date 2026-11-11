/* Accueil : la scène 3D des pôles (Three.js).
   Au centre, le médaillon Birdy (l'assistant) entouré d'anneaux lumineux ; autour, les 4 pôles en orbite,
   chacun avec sa petite maquette. Survol ou clic : le pôle vient devant, la caméra s'approche, sa carte s'affiche.
   Sans WebGL, la section garde ses 4 cartes classiques (rien n'est masqué). */
(function () {
  "use strict";
  var sec = document.getElementById("a-quoi-sert"), box = document.getElementById("h3"), T = window.THREE;
  if (!sec || !box || !T) return;
  var cartes = Array.prototype.slice.call(document.querySelectorAll("#ha-poles .ha-pole"));
  if (cartes.length < 4) return;
  var r;
  try { r = new T.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { return; }
  var calme = matchMedia("(prefers-reduced-motion: reduce)").matches, tactile = matchMedia("(hover: none)").matches;
  // au doigt, le premier toucher choisit le pôle (le second, ou le bouton de la carte, ouvre la page)
  addEventListener("pointerdown", function (e) { if (e.pointerType === "touch") tactile = true; else if (e.pointerType === "mouse") tactile = matchMedia("(hover: none)").matches; }, true);
  box.hidden = false; sec.classList.add("en3d");
  r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); r.outputEncoding = T.sRGBEncoding;
  box.insertBefore(r.domElement, box.firstChild);
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function V(x, y, z) { return new T.Vector3(x, y, z); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function m(c, o) { var x = new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.6, metalness: 0 }, o || {})); x.color.convertSRGBToLinear(); if (x.emissive && o && o.emissive != null) x.emissive.convertSRGBToLinear(); return x; }
  function mesh(g, mt, x, y, z, parent) { var o = new T.Mesh(g, mt); o.position.set(x || 0, y || 0, z || 0); if (parent) parent.add(o); return o; }

  var sc = new T.Scene(), cam = new T.PerspectiveCamera(32, 1, 0.1, 100);
  sc.add(new T.HemisphereLight(0xe4f6ec, 0x1c3a2e, 0.9));
  var sol = new T.DirectionalLight(0xfff3da, 1.1); sol.position.set(5, 9, 8); sc.add(sol);
  var coeur = new T.PointLight(0xa3c9b8, 1.6, 14, 2); coeur.position.set(0, 0.6, 1.5); sc.add(coeur);
  sc.fog = new T.Fog(0x0a1e17, 10, 24);

  /* ----- Textures générées : halo lumineux ----- */
  var cv = document.createElement("canvas"); cv.width = cv.height = 128; var g2 = cv.getContext("2d"), gr = g2.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.35, "rgba(255,255,255,.35)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g2.fillStyle = gr; g2.fillRect(0, 0, 128, 128);
  var HALO = new T.CanvasTexture(cv);
  function halo(couleur, taille, op) { var s = new T.Sprite(new T.SpriteMaterial({ map: HALO, color: couleur, transparent: true, opacity: op, blending: T.AdditiveBlending, depthWrite: false, fog: false })); s.scale.set(taille, taille, 1); return s; }
  var MENTHE = 0xa3c9b8, OR = 0xe9c98a;
  var BLANC = m(0xfbfbf7, { roughness: 0.35 }), PEAU = m(0xd9a47b), SAPIN = m(0x1e4a3d, { roughness: 0.85 }), VERT = m(0x2f8a5c, { roughness: 0.9 }), VERTC = m(0x8bdc9c, { roughness: 0.9 }),
    SABLE = m(0xe0cb94, { roughness: 0.95 }), ROUGE = m(0xe5484d, { side: T.DoubleSide }), DORE = m(OR, { roughness: 0.25, metalness: 0.85 }), ACIER = m(0xe2e8e5, { roughness: 0.25, metalness: 0.85 }),
    MENT = m(0x8fc4ad, { roughness: 0.7 }), FONCE = m(0x15221d, { roughness: 0.4, metalness: 0.5 });

  /* ----- Au centre : le médaillon Birdy et ses anneaux ----- */
  var centre = new T.Group(); centre.position.y = 0.75; sc.add(centre);
  centre.add(halo(MENTHE, 9, 0.55));
  var medaillon = new T.Group(); centre.add(medaillon);
  var face = new T.MeshStandardMaterial({ color: 0x1b4d3e, roughness: 0.5, metalness: 0.1 }); face.color.convertSRGBToLinear();
  var piece = mesh(new T.CylinderGeometry(1.25, 1.25, 0.16, 80), [DORE, face, DORE], 0, 0, 0, medaillon); piece.rotation.x = Math.PI / 2;
  mesh(new T.TorusGeometry(1.25, 0.05, 14, 80), DORE, 0, 0, 0.02, medaillon);
  new T.TextureLoader().load("/logo.webp", function (t) { t.encoding = T.sRGBEncoding; t.anisotropy = 8; t.center.set(0.5, 0.5); t.rotation = Math.PI / 2; face.map = t; face.color.set(0xffffff); face.needsUpdate = true; });
  var anneaux = [[1.75, MENTHE, 0.9, 0.5], [2.05, OR, 0.6, -0.35], [2.35, MENTHE, 0.5, 0.2]].map(function (a, i) {
    var mt = new T.MeshBasicMaterial({ color: a[1], transparent: true, opacity: a[2], fog: false }); mt.color.convertSRGBToLinear();
    var t = mesh(new T.TorusGeometry(a[0], 0.014, 8, 120), mt, 0, 0, 0, centre); t.rotation.set(1.1 + i * 0.5, i * 0.9, 0); t.userData.v = a[3]; return t;
  });
  // poussière lumineuse
  var NP = tactile ? 90 : 190, pp = new Float32Array(NP * 3);
  for (var i = 0; i < NP; i++) { var a0 = Math.random() * 6.283, d0 = 2.4 + Math.random() * 6.5; pp[i * 3] = Math.cos(a0) * d0; pp[i * 3 + 1] = -1.6 + Math.random() * 5; pp[i * 3 + 2] = Math.sin(a0) * d0 * 0.7; }
  var pg = new T.BufferGeometry(); pg.setAttribute("position", new T.BufferAttribute(pp, 3));
  var poussiere = new T.Points(pg, new T.PointsMaterial({ map: HALO, color: MENTHE, size: 0.16, transparent: true, opacity: 0.55, blending: T.AdditiveBlending, depthWrite: false })); sc.add(poussiere);

  /* ----- Les maquettes des pôles ----- */
  function socle() {
    var g = new T.Group();
    mesh(new T.CylinderGeometry(1.0, 0.94, 0.18, 56), m(0xa3c9b8, { transparent: true, opacity: 0.26, roughness: 0.08, metalness: 0.2 }), 0, 0, 0, g);
    mesh(new T.CylinderGeometry(0.9, 0.9, 0.04, 56), SAPIN, 0, 0.1, 0, g);
    var bord = new T.MeshBasicMaterial({ color: MENTHE, transparent: true, opacity: 0.85, fog: false }); bord.color.convertSRGBToLinear();
    var a = mesh(new T.TorusGeometry(1.0, 0.016, 8, 90), bord, 0, 0.09, 0, g); a.rotation.x = Math.PI / 2; g.userData.bord = bord;
    var h = halo(MENTHE, 3.4, 0.35); h.position.y = -0.3; g.add(h); g.userData.halo = h;
    return g;
  }
  function debuter() {            // une balle sur son tee, deux balles de practice
    var g = new T.Group();
    mesh(new T.CylinderGeometry(0.03, 0.018, 0.5, 12), DORE, 0, 0.37, 0, g); mesh(new T.CylinderGeometry(0.09, 0.03, 0.08, 16), DORE, 0, 0.65, 0, g);
    mesh(new T.SphereGeometry(0.27, 28, 20), BLANC, 0, 0.95, 0, g);
    mesh(new T.SphereGeometry(0.11, 16, 12), BLANC, 0.5, 0.23, 0.25, g); mesh(new T.SphereGeometry(0.11, 16, 12), BLANC, -0.45, 0.23, -0.3, g);
    [[0.3, -0.4], [-0.5, 0.3], [0.1, 0.55], [-0.2, -0.55], [0.6, -0.1]].forEach(function (p, i) { mesh(new T.ConeGeometry(0.05, 0.22 + (i % 2) * 0.08, 5), i % 2 ? VERT : VERTC, p[0], 0.22, p[1], g); });
    return g;
  }
  function tige(A, B, r1, r2, mt, parent) { var d = B.clone().sub(A), L = d.length(), o = mesh(new T.CylinderGeometry(r2, r1, L, 14), mt, 0, 0, 0, parent); o.position.copy(A).addScaledVector(d, 0.5); o.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); return o; }
  function cours() {              // un golfeur au sommet de son swing
    var g = new T.Group(), main = V(-0.3, 1.52, -0.08);
    tige(V(-0.13, 0.12, 0), V(-0.1, 0.72, 0), 0.07, 0.085, SAPIN, g); tige(V(0.15, 0.12, 0), V(0.1, 0.72, 0), 0.07, 0.085, SAPIN, g);
    tige(V(0, 0.7, 0), V(-0.03, 1.2, 0.03), 0.15, 0.19, BLANC, g);
    mesh(new T.SphereGeometry(0.13, 20, 16), PEAU, -0.04, 1.4, 0.05, g);
    var c = mesh(new T.SphereGeometry(0.14, 20, 10, 0, 6.283, 0, 1.571), MENT, -0.04, 1.43, 0.05, g); mesh(new T.BoxGeometry(0.16, 0.02, 0.16), MENT, -0.04, 1.44, 0.2, g);
    tige(V(0.14, 1.16, 0.03), main, 0.045, 0.035, PEAU, g); tige(V(-0.2, 1.16, 0.03), main, 0.045, 0.035, PEAU, g);
    mesh(new T.SphereGeometry(0.055, 12, 10), BLANC, main.x, main.y, main.z, g);
    tige(main, V(0.55, 1.72, -0.25), 0.012, 0.009, ACIER, g); mesh(new T.BoxGeometry(0.1, 0.06, 0.03), FONCE, 0.58, 1.72, -0.26, g);
    mesh(new T.SphereGeometry(0.05, 12, 10), BLANC, 0.05, 0.17, 0.5, g);
    [-0.13, 0.15].forEach(function (x) { var p = mesh(new T.SphereGeometry(1, 14, 10), BLANC, x, 0.15, 0.05, g); p.scale.set(0.07, 0.05, 0.14); });
    return g;
  }
  function parcours() {           // un green, son trou et son drapeau
    var g = new T.Group();
    mesh(new T.CylinderGeometry(0.8, 0.8, 0.05, 48), VERT, 0, 0.14, 0, g);
    var gn = mesh(new T.CylinderGeometry(0.62, 0.62, 0.06, 48), VERTC, 0.05, 0.16, 0, g); gn.scale.z = 0.82;
    var b = mesh(new T.SphereGeometry(0.24, 20, 12), SABLE, -0.52, 0.15, 0.42, g); b.scale.set(1, 0.18, 0.7);
    var t = mesh(new T.CircleGeometry(0.07, 18), new T.MeshBasicMaterial({ color: 0x06140f }), 0.18, 0.195, -0.05, g); t.rotation.x = -Math.PI / 2;
    mesh(new T.CylinderGeometry(0.014, 0.014, 1.25, 8), BLANC, 0.18, 0.82, -0.05, g);
    var fg = new T.PlaneGeometry(0.48, 0.3, 8, 1); fg.translate(0.24, 0, 0); var f = mesh(fg, ROUGE, 0.18, 1.28, -0.05, g); g.userData.drapeau = f;
    mesh(new T.SphereGeometry(0.06, 14, 10), BLANC, -0.12, 0.25, 0.2, g);
    return g;
  }
  function voyages() {            // un globe, des destinations, un avion qui tourne autour
    var g = new T.Group();
    mesh(new T.CylinderGeometry(0.16, 0.24, 0.12, 20), DORE, 0, 0.18, 0, g);
    var globe = new T.Group(); globe.position.y = 0.92; globe.rotation.z = 0.35; g.add(globe);
    mesh(new T.SphereGeometry(0.56, 32, 22), m(0x1b6e52, { roughness: 0.55 }), 0, 0, 0, globe);
    var fil = new T.LineSegments(new T.WireframeGeometry(new T.SphereGeometry(0.565, 12, 8)), new T.LineBasicMaterial({ color: MENTHE, transparent: true, opacity: 0.45 })); fil.material.color.convertSRGBToLinear(); globe.add(fil);
    [[0.6, 0.5], [2.1, 0.2], [3.4, -0.3], [4.6, 0.6], [5.5, -0.1]].forEach(function (p) { var s = Math.cos(p[1]); mesh(new T.SphereGeometry(0.035, 10, 8), DORE, Math.cos(p[0]) * s * 0.57, Math.sin(p[1]) * 0.57, Math.sin(p[0]) * s * 0.57, globe); });
    var orbite = new T.Group(); orbite.position.y = 0.92; orbite.rotation.set(0.5, 0, 0.25); g.add(orbite);
    var avion = new T.Group(); avion.position.x = 0.86; orbite.add(avion);
    var corps = mesh(new T.CylinderGeometry(0.035, 0.035, 0.3, 10), BLANC, 0, 0, 0, avion); corps.rotation.x = Math.PI / 2;
    mesh(new T.BoxGeometry(0.34, 0.012, 0.09), BLANC, 0, 0, 0.02, avion); mesh(new T.BoxGeometry(0.13, 0.012, 0.05), BLANC, 0, 0, 0.14, avion); mesh(new T.BoxGeometry(0.012, 0.08, 0.05), BLANC, 0, 0.04, 0.14, avion);
    var tr = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 }); var trace = mesh(new T.TorusGeometry(0.86, 0.007, 6, 40, 1.1), tr, 0, 0, 0, orbite); trace.rotation.x = Math.PI / 2; trace.rotation.z = 0.08;
    g.userData.globe = globe; g.userData.orbite = orbite;
    return g;
  }
  var FAB = { debuter: debuter, cours: cours, parcours: parcours, voyages: voyages };

  /* ----- Les pôles : lus dans les cartes de la page (une seule source de texte) ----- */
  var lbls = document.getElementById("h3-lbls"), carte = document.getElementById("h3-card"),
    cK = carte.querySelector("small"), cT = carte.querySelector("b"), cX = carte.querySelector("p"), cA = carte.querySelector("a");
  var poles = cartes.map(function (c, i) {
    var g = new T.Group(), s = socle(), mo = FAB[c.dataset.pole](); g.add(s); g.add(mo); sc.add(g);
    var l = el("a", "h3-lbl"); l.href = c.getAttribute("href"); l.appendChild(el("i", null, c.querySelector("i").textContent)); l.appendChild(el("span", null, c.querySelector("small").textContent)); lbls.appendChild(l);
    var p = { i: i, g: g, socle: s, mo: mo, lbl: l, c: c, href: c.getAttribute("href"), k: c.querySelector("small").textContent, t: c.querySelector("b").textContent,
      x: c.querySelector("span").textContent.trim(), cta: c.querySelector("em").textContent, e: 1, px: 0, py: 0, pr: 0, z: 0 };
    l.addEventListener("mouseenter", function () { active(i); }); l.addEventListener("focus", function () { active(i); });
    // au doigt : si ce toucher vient de choisir le pôle (le focus l'a activé à l'instant), on n'ouvre pas encore la page
    l.addEventListener("click", function (ev) { if (tactile && (actif !== i || performance.now() - depuis < 700)) { ev.preventDefault(); active(i); } });
    c.addEventListener("mouseenter", function () { active(i); }); c.addEventListener("focus", function () { active(i); }); c.addEventListener("mouseleave", relache);
    return p;
  });
  var lblB = el("a", "h3-lbl h3-birdy"); lblB.href = "#ha-chat"; lblB.appendChild(el("span", null, "Birdy · votre assistant")); lbls.appendChild(lblB);
  function parler(ev) { var b = document.getElementById("ha-parler2"); if (b) { ev.preventDefault(); b.click(); } }
  lblB.addEventListener("click", parler);

  /* ----- État : rotation de l'orbite, pôle actif ----- */
  var rot = 0.55, actif = -1, minuteur = 0, depuis = 0, AV = Math.PI / 2;      // AV : angle du « devant »
  function carteDe(i) {
    carte.classList.remove("flash"); void carte.offsetWidth; carte.classList.add("flash");
    if (i < 0) { cK.textContent = "Au centre · Birdy"; cT.textContent = "Dites-le à Birdy"; cX.textContent = "Il comprend ce que vous cherchez et vous emmène au bon pôle."; cA.textContent = "Parler à Birdy"; cA.href = "#ha-chat"; cA.onclick = parler; }
    else { var p = poles[i]; cK.textContent = p.k; cT.textContent = p.t; cX.textContent = p.x; cA.textContent = p.cta.replace(/\s*→\s*$/, "") + " →"; cA.href = p.href; cA.onclick = null; }
  }
  function active(i) {
    clearTimeout(minuteur); if (actif === i) return; actif = i; depuis = performance.now(); carteDe(i);
    poles.forEach(function (p) { p.lbl.classList.toggle("on", p.i === i); p.c.classList.toggle("actif", p.i === i); });
    box.classList.toggle("choisi", i >= 0);
  }
  function relache() { clearTimeout(minuteur); minuteur = setTimeout(function () { active(-1); }, 900); }
  carte.addEventListener("mouseenter", function () { clearTimeout(minuteur); }); carte.addEventListener("mouseleave", relache);
  carteDe(-1);

  /* ----- Pointeur : parallaxe, survol des maquettes, glisser pour tourner ----- */
  var W = 1, H = 1, mx = 0, my = 0, bas = null, glisse = false;
  function local(e) { var b = box.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; }
  function sous(e) {                 // le pôle sous le pointeur (le plus proche de la caméra)
    var q = local(e), best = -1, bz = 9;
    poles.forEach(function (p) { var dx = q.x - p.px, dy = q.y - (p.py - p.pr * 0.55); if (dx * dx + dy * dy < p.pr * p.pr && p.z < bz) { bz = p.z; best = p.i; } });
    return best;
  }
  box.addEventListener("pointermove", function (e) {
    var q = local(e); mx = q.x / W * 2 - 1; my = q.y / H * 2 - 1;
    if (bas) { var dx = e.clientX - bas.x; if (Math.abs(dx) > 6) { glisse = true; box.classList.add("tourne"); } if (glisse) { rot = bas.rot - dx * 0.006; if (actif >= 0) active(-1); } return; }
    if (tactile || e.target.closest(".h3-card,.h3-lbl")) return;
    var s = sous(e); if (s >= 0) { active(s); box.style.cursor = "pointer"; } else { box.style.cursor = ""; if (actif >= 0) relache(); }
  });
  box.addEventListener("pointerdown", function (e) { if (e.target.closest("a,button")) return; bas = { x: e.clientX, rot: rot }; glisse = false; });
  addEventListener("pointerup", function () { bas = null; box.classList.remove("tourne"); });
  addEventListener("pointercancel", function () { bas = null; box.classList.remove("tourne"); });
  box.addEventListener("pointerleave", function () { mx = 0; my = 0; if (!tactile) relache(); });
  box.addEventListener("click", function (e) {
    if (glisse || e.target.closest("a,button")) return;
    var s = sous(e); if (s < 0) { if (tactile) active(-1); return; }
    if (tactile && actif !== s) active(s); else location.href = poles[s].href;
  });

  /* ----- Taille et cadrage ----- */
  var A = 5, B = 3, D = 13.5, CY = 0.75, LY = -0.9, visible = !window.IntersectionObserver;   // orbite, distance caméra, hauteur du médaillon, point visé
  function taille() {
    var b = r.domElement.getBoundingClientRect(); W = Math.max(1, b.width); H = Math.max(1, b.height); r.setSize(W, H, false); cam.aspect = W / H; cam.updateProjectionMatrix();
    var a = W / H;
    // écran étroit : orbite resserrée, médaillon remonté au-dessus des maquettes
    if (a < 1.15) { A = 2.1; B = 2.0; D = 15.5 / Math.max(0.72, Math.min(1, a / 0.85)); CY = 2.0; LY = 0.3; } else if (a < 1.8) { A = 3.9; B = 2.7; D = 14.5; CY = 0.75; LY = -0.9; } else { A = Math.min(5.6, 2.3 * a); B = 3.0; D = 13.5; CY = 0.75; LY = -0.9; }
    sc.fog.near = D - 3; sc.fog.far = D + 9; box.classList.toggle("etroit", a < 1.15); AV = a < 1.15 ? Math.PI / 2 : Math.PI / 2 - 0.82;
  }
  if (window.ResizeObserver) new ResizeObserver(taille).observe(r.domElement); else addEventListener("resize", taille);
  taille();
  if (window.IntersectionObserver) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }, { rootMargin: "120px" }).observe(box);

  /* ----- Boucle ----- */
  var t0 = performance.now(), dernier = 0, v3 = V(0, 0, 0), camPos = V(0, 2.6, D), cible = V(0, LY, 0), tmp = V(0, 0, 0), ctmp = V(0, 0, 0);
  function ecran(p, hauteur, o) { v3.copy(p); v3.y += hauteur; v3.project(cam); o.x = (v3.x * 0.5 + 0.5) * W; o.y = (-v3.y * 0.5 + 0.5) * H; o.z = v3.z; return o; }
  var e1 = {}, e2 = {};
  (function boucle(now) {
    requestAnimationFrame(boucle);
    if (!visible || document.hidden) return;
    var t = ((now || t0) - t0) / 1000, dt = Math.min(0.05, t - dernier); dernier = t;
    // orbite : tourne doucement ; si un pôle est choisi, il vient devant par le plus court chemin
    if (actif >= 0 && !bas) { var d = AV - (rot + actif * Math.PI / 2); d = Math.atan2(Math.sin(d), Math.cos(d)); rot += d * Math.min(1, dt * 3.2); }
    else if (!bas && !calme) rot += dt * 0.11;
    poles.forEach(function (p) {
      var th = rot + p.i * Math.PI / 2, s = Math.sin(th), on = p.i === actif;
      p.g.position.set(A * Math.cos(th), -0.75 - 0.5 * s + (calme ? 0 : Math.sin(t * 1.1 + p.i * 1.7) * 0.09), B * s);
      p.e = lerp(p.e, on ? 1.2 : actif >= 0 ? 0.9 : 1, Math.min(1, dt * 5)); p.g.scale.setScalar(p.e);
      p.mo.rotation.y += dt * (on ? 0.9 : 0.35);
      p.socle.userData.halo.material.opacity = lerp(p.socle.userData.halo.material.opacity, on ? 0.95 : 0.3, dt * 5);
      p.socle.userData.bord.opacity = on ? 1 : 0.75;
      var u = p.mo.userData;
      if (u.orbite) { u.orbite.rotation.y = t * 1.3; u.globe.rotation.y = t * 0.25; }
      if (u.drapeau) { var fp = u.drapeau.geometry.attributes.position; for (var k = 0; k < fp.count; k++) { var x = fp.getX(k); fp.setZ(k, Math.sin(x * 9 - t * 5) * 0.06 * x * 2); } fp.needsUpdate = true; u.drapeau.rotation.y = -p.mo.rotation.y; }
    });
    // centre : le médaillon suit légèrement le pointeur, les anneaux tournent
    medaillon.rotation.y = lerp(medaillon.rotation.y, mx * 0.55 + (calme ? 0 : Math.sin(t * 0.6) * 0.18), dt * 3); medaillon.rotation.x = lerp(medaillon.rotation.x, my * 0.3, dt * 3);
    centre.position.y = CY + (calme ? 0 : Math.sin(t * 0.9) * 0.08);
    if (!calme) { anneaux.forEach(function (a) { a.rotation.z += dt * a.userData.v; a.rotation.y += dt * a.userData.v * 0.4; }); poussiere.rotation.y = t * 0.03; }
    // caméra : parallaxe, et approche du pôle choisi
    tmp.set(mx * 0.9, 2.6 - my * 0.5, D); ctmp.set(0, LY, 0);
    if (actif >= 0) { var ap = poles[actif].g.position; tmp.set(ap.x * 0.16 + mx * 0.5, 2.3 - my * 0.35, D - (LY > 0 ? 0.6 : 1.5)); ctmp.set(ap.x * 0.14, LY - 0.05, 0.3); }
    camPos.lerp(tmp, Math.min(1, dt * 2.6)); cible.lerp(ctmp, Math.min(1, dt * 2.6)); cam.position.copy(camPos); cam.lookAt(cible);
    cam.updateMatrixWorld();
    // étiquettes projetées
    poles.forEach(function (p) {
      ecran(p.g.position, 2.15 * p.e, e1); ecran(p.g.position, 0.1, e2);
      p.px = e2.x; p.py = e2.y; p.z = e2.z; p.pr = Math.max(44, Math.abs(e2.y - e1.y) * 0.62);
      var loin = (p.g.position.z + B) / (2 * B);                      // 0 : au fond, 1 : devant
      p.lbl.style.transform = "translate(" + e1.x.toFixed(1) + "px," + e1.y.toFixed(1) + "px) scale(" + (0.82 + loin * 0.22).toFixed(3) + ")";
      p.lbl.style.opacity = (0.45 + loin * 0.55).toFixed(2); p.lbl.style.zIndex = Math.round(loin * 10) + (p.i === actif ? 20 : 0);
    });
    ecran(centre.position, -1.95, e1); lblB.style.transform = "translate(" + e1.x.toFixed(1) + "px," + e1.y.toFixed(1) + "px)";
    r.render(sc, cam);
  })(t0);
})();
