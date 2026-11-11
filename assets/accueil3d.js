/* Accueil : la scène 3D des pôles (Three.js).
   Au centre, le médaillon Birdy (l'assistant) et ses anneaux ; autour, les 4 pôles en orbite, chacun avec sa maquette :
   une balle à alvéoles sur son tee, un golfeur qui swingue, un green et son drapeau, un globe et son avion.
   Matériaux réalistes (reflets d'environnement, verre, or brossé). Survol ou toucher : le pôle vient devant,
   la caméra s'approche et la carte correspondante, sous la scène, s'illumine. Sans WebGL, les 4 cartes restent seules. */
(function () {
  "use strict";
  var sec = document.getElementById("a-quoi-sert"), box = document.getElementById("h3"), T = window.THREE;
  if (!sec || !box || !T) return;
  var cartes = Array.prototype.slice.call(document.querySelectorAll("#ha-poles .ha-pole"));
  if (cartes.length < 4) return;
  var r;
  try { r = new T.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { return; }
  var calme = matchMedia("(prefers-reduced-motion: reduce)").matches, tactile = matchMedia("(hover: none)").matches;
  // au doigt, le premier toucher choisit le pôle (le second ouvre la page)
  addEventListener("pointerdown", function (e) { if (e.pointerType === "touch") tactile = true; else if (e.pointerType === "mouse") tactile = matchMedia("(hover: none)").matches; }, true);
  box.hidden = false; sec.classList.add("en3d");
  var DPR = Math.min(window.devicePixelRatio || 1, tactile ? 1.75 : 2), qualite = DPR;      // résolution du rendu, abaissée toute seule si l'appareil peine
  r.setPixelRatio(DPR); r.outputEncoding = T.sRGBEncoding; r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1.12;
  var halo = document.getElementById("h3-halo");
  box.insertBefore(r.domElement, halo ? halo.nextSibling : box.firstChild);
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function V(x, y, z) { return new T.Vector3(x, y, z); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function toile(w, h) { var c = document.createElement("canvas"); c.width = w; c.height = h; return c; }
  function tex(c, rep) { var t = new T.CanvasTexture(c); t.anisotropy = 4; if (rep) { t.wrapS = t.wrapT = T.RepeatWrapping; } return t; }
  function lin(o) { ["color", "emissive"].forEach(function (k) { if (o[k] && o[k].isColor) o[k].convertSRGBToLinear(); }); return o; }
  function m(c, o) { return lin(new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.6, metalness: 0 }, o || {}))); }
  function mp(c, o) { return lin(new T.MeshPhysicalMaterial(Object.assign({ color: c, roughness: 0.3, metalness: 0 }, o || {}))); }
  function mb(c, o) { return lin(new T.MeshBasicMaterial(Object.assign({ color: c }, o || {}))); }
  function mesh(g, mt, x, y, z, parent) { var o = new T.Mesh(g, mt); o.position.set(x || 0, y || 0, z || 0); if (parent) parent.add(o); return o; }
  function tour(pts, seg) { return new T.LatheGeometry(pts.map(function (p) { return new T.Vector2(p[0], p[1]); }), seg || 48); }

  var sc = new T.Scene(), cam = new T.PerspectiveCamera(32, 1, 0.1, 100);
  sc.add(new T.HemisphereLight(0xe4f6ec, 0x1c3a2e, 0.55));
  var sol = new T.DirectionalLight(0xfff3da, 1.25); sol.position.set(5, 9, 8); sc.add(sol);
  var contre = new T.DirectionalLight(0xbfe8d6, 0.5); contre.position.set(-6, 3, -6); sc.add(contre);
  sc.fog = new T.Fog(0x0a1e17, 10, 24);

  /* ----- Environnement : un studio (ciel dégradé et panneaux lumineux) qui se reflète dans le verre, l'or et la balle ----- */
  (function () {
    var c = toile(512, 256), g = c.getContext("2d"), gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, "#e8f7ef"); gr.addColorStop(0.42, "#5d8a76"); gr.addColorStop(0.56, "#1d3b2f"); gr.addColorStop(1, "#06120e"); g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
    g.fillStyle = "#ffffff"; g.fillRect(50, 26, 96, 56); g.fillRect(292, 18, 130, 44); g.fillStyle = "#ffeecb"; g.fillRect(196, 70, 54, 30); g.fillStyle = "#cfeee0"; g.fillRect(440, 60, 50, 60);
    var t = new T.CanvasTexture(c); t.mapping = T.EquirectangularReflectionMapping; t.encoding = T.sRGBEncoding;
    try { var pm = new T.PMREMGenerator(r); sc.environment = pm.fromEquirectangular(t).texture; pm.dispose(); } catch (e) {}
    t.dispose();
  })();

  /* ----- Textures générées ----- */
  // lueur : un disque parfaitement fondu (chute douce jusqu'au bord, sans cerne)
  var LUEUR = (function () {
    var n = 128, c = toile(n, n), g = c.getContext("2d"), d = g.createImageData(n, n);
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
      var dx = (x + 0.5) / n * 2 - 1, dy = (y + 0.5) / n * 2 - 1, q = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy)), i = (y * n + x) * 4;
      d.data[i] = d.data[i + 1] = d.data[i + 2] = 255; d.data[i + 3] = Math.round(255 * Math.pow(q * q * (3 - 2 * q), 3.2));
    }
    g.putImageData(d, 0, 0); return tex(c);
  })();
  function lueur(couleur, taille, op) { var s = new T.Sprite(lin(new T.SpriteMaterial({ map: LUEUR, color: couleur, transparent: true, opacity: op, blending: T.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false }))); s.scale.set(taille, taille, 1); return s; }
  // alvéoles de la balle de golf : rangées décalées, resserrées vers les pôles pour rester rondes sur la sphère
  function alveoles(relief) {
    var W = 1024, H = 512, c = toile(W, H), g = c.getContext("2d"), rangs = 19;
    g.fillStyle = relief ? "#ffffff" : "#f7f7f2"; g.fillRect(0, 0, W, H);
    for (var j = 0; j < rangs; j++) {
      var lat = (-81 + j * 162 / (rangs - 1)) * Math.PI / 180, cs = Math.cos(lat), n = Math.max(5, Math.round(38 * cs)), y = (0.5 - lat / Math.PI) * H, ry = H / rangs * 0.44, rx = ry / cs;
      for (var k = 0; k < n; k++) for (var w = -1; w <= 1; w++) {
        var x = (k + (j % 2) * 0.5) / n * W + w * W; if (x < -rx || x > W + rx) continue;
        g.save(); g.translate(x, y); g.scale(rx / ry, 1);
        var gr = g.createRadialGradient(0, 0, 0, 0, 0, ry);
        if (relief) { gr.addColorStop(0, "#2e2e2e"); gr.addColorStop(0.72, "#9c9c9c"); gr.addColorStop(1, "#ffffff"); }
        else { gr.addColorStop(0, "rgba(40,60,50,.20)"); gr.addColorStop(0.8, "rgba(40,60,50,.06)"); gr.addColorStop(1, "rgba(40,60,50,0)"); }
        g.fillStyle = gr; g.beginPath(); g.arc(0, 0, ry, 0, 6.283); g.fill(); g.restore();
      }
    }
    var t = tex(c); if (!relief) t.encoding = T.sRGBEncoding; return t;
  }
  var BALLE = mp(0xffffff, { map: alveoles(false), bumpMap: alveoles(true), bumpScale: 0.022, roughness: 0.28, clearcoat: 0.6, clearcoatRoughness: 0.28, envMapIntensity: 0.9 });
  function balle(rayon, x, y, z, parent) { var b = mesh(new T.SphereGeometry(rayon, rayon > 0.2 ? 56 : 24, rayon > 0.2 ? 40 : 16), BALLE, x, y, z, parent); b.rotation.set(0.4, 0.8, 0.2); return b; }
  // métal brossé (fines rayures), gazon tondu en bandes, grain du sable, ombre de contact
  var BROSSE = (function () { var c = toile(256, 256), g = c.getContext("2d"); g.fillStyle = "#808080"; g.fillRect(0, 0, 256, 256); for (var i = 0; i < 900; i++) { var v = 90 + Math.random() * 110 | 0; g.fillStyle = "rgba(" + v + "," + v + "," + v + ",.5)"; g.fillRect(0, Math.random() * 256, 256, 0.6 + Math.random()); } return tex(c, true); })();
  function gazon(base, clair) {
    var c = toile(256, 256), g = c.getContext("2d"); g.fillStyle = base; g.fillRect(0, 0, 256, 256);
    for (var b = 0; b < 8; b++) if (b % 2) { g.fillStyle = clair; g.fillRect(b * 32, 0, 32, 256); }
    for (var i = 0; i < 2600; i++) { g.fillStyle = i % 2 ? "rgba(255,255,255,.05)" : "rgba(0,40,20,.08)"; g.fillRect(Math.random() * 256, Math.random() * 256, 1.2, 2 + Math.random() * 3); }
    var t = tex(c); t.encoding = T.sRGBEncoding; return t;
  }
  var GRAIN = (function () { var c = toile(128, 128), g = c.getContext("2d"); g.fillStyle = "#808080"; g.fillRect(0, 0, 128, 128); for (var i = 0; i < 2600; i++) { var v = Math.random() * 255 | 0; g.fillStyle = "rgba(" + v + "," + v + "," + v + ",.35)"; g.fillRect(Math.random() * 128, Math.random() * 128, 1.5, 1.5); } return tex(c, true); })();
  var OMBRE = (function () { var c = toile(128, 128), g = c.getContext("2d"), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(0,0,0,.5)"); gr.addColorStop(0.6, "rgba(0,0,0,.18)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return tex(c); })();
  function ombre(taille, x, z, parent) { var o = mesh(new T.PlaneGeometry(taille, taille), new T.MeshBasicMaterial({ map: OMBRE, transparent: true, depthWrite: false }), x, 0.006, z, parent); o.rotation.x = -Math.PI / 2; return o; }

  /* ----- Matériaux ----- */
  var MENTHE = 0xa3c9b8, OR = 0xe2bd76;
  var DORE = m(OR, { roughness: 0.32, metalness: 1, bumpMap: BROSSE, bumpScale: 0.004, envMapIntensity: 1.25 }), ACIER = m(0xe6ecea, { roughness: 0.2, metalness: 1, envMapIntensity: 1.2 }),
    BLANC = mp(0xfbfbf7, { roughness: 0.3, clearcoat: 0.5, clearcoatRoughness: 0.3 }), BOIS = m(0xd6ac72, { roughness: 0.55 }), SABLE = m(0xe3cf9c, { roughness: 1, bumpMap: GRAIN, bumpScale: 0.02 }),
    ROUGE = m(0xe5484d, { side: T.DoubleSide, roughness: 0.75 }), VERRE = mp(0xc6e8d8, { transparent: true, opacity: 0.3, roughness: 0.04, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.6, depthWrite: false }),
    HERBE = m(0xffffff, { map: gazon("#17492f", "rgba(255,255,255,.06)"), roughness: 0.95, envMapIntensity: 0.3 }), GREEN = m(0xffffff, { map: gazon("#3f9a5c", "rgba(255,255,255,.1)"), roughness: 0.9, envMapIntensity: 0.3 });

  /* ----- Au centre : le médaillon Birdy (or brossé, logo sous vernis) et ses anneaux ----- */
  var centre = new T.Group(); sc.add(centre);
  var medaillon = new T.Group(); centre.add(medaillon);
  var face = mp(0x1b4d3e, { roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 0.8 });
  var piece = mesh(new T.CylinderGeometry(1.22, 1.22, 0.14, 96), [DORE, face, DORE], 0, 0, 0, medaillon); piece.rotation.x = Math.PI / 2;
  mesh(new T.TorusGeometry(1.24, 0.07, 20, 120), DORE, 0, 0, 0.0, medaillon);
  mesh(new T.TorusGeometry(1.1, 0.012, 8, 120), DORE, 0, 0, 0.072, medaillon);
  new T.TextureLoader().load("/logo.webp", function (t) { t.encoding = T.sRGBEncoding; t.anisotropy = 8; t.center.set(0.5, 0.5); t.rotation = Math.PI / 2; face.map = t; face.color.set(0xffffff); face.needsUpdate = true; });
  var anneaux = [[1.72, mb(MENTHE, { transparent: true, opacity: 0.9, fog: false }), 0.012, 0.5], [2.02, DORE, 0.018, -0.35], [2.32, mb(MENTHE, { transparent: true, opacity: 0.5, fog: false }), 0.01, 0.2]].map(function (a, i) {
    var t = mesh(new T.TorusGeometry(a[0], a[2], 10, 140), a[1], 0, 0, 0, centre); t.rotation.set(1.1 + i * 0.5, i * 0.9, 0); t.userData.v = a[3]; return t;
  });
  var NP = tactile ? 80 : 170, pp = new Float32Array(NP * 3);
  for (var i = 0; i < NP; i++) { var a0 = Math.random() * 6.283, d0 = 2.4 + Math.random() * 6.5; pp[i * 3] = Math.cos(a0) * d0; pp[i * 3 + 1] = -2.2 + Math.random() * 6; pp[i * 3 + 2] = Math.sin(a0) * d0 * 0.7; }
  var pg = new T.BufferGeometry(); pg.setAttribute("position", new T.BufferAttribute(pp, 3));
  var poussiere = new T.Points(pg, lin(new T.PointsMaterial({ map: LUEUR, color: MENTHE, size: 0.15, transparent: true, opacity: 0.6, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false }))); sc.add(poussiere);

  /* ----- Le socle des pôles : un palet de verre au bord lumineux ----- */
  var HAUT = 0.11;
  function socle(dessus) {
    var g = new T.Group();
    mesh(new T.CylinderGeometry(0.88, 0.88, 0.03, 64), dessus, 0, HAUT - 0.012, 0, g);
    mesh(tour([[0, -0.11], [0.93, -0.11], [1.0, -0.07], [1.03, 0], [1.0, 0.07], [0.93, HAUT], [0, HAUT]], 72), VERRE, 0, 0, 0, g).renderOrder = 2;
    var bord = mb(MENTHE, { transparent: true, opacity: 0.85, fog: false, toneMapped: false });
    var a = mesh(new T.TorusGeometry(1.03, 0.012, 8, 100), bord, 0, 0, 0, g); a.rotation.x = Math.PI / 2; g.userData.bord = bord;
    var h = lueur(MENTHE, 2.9, 0.22); h.position.y = -0.2; g.add(h); g.userData.lueur = h;
    return g;
  }

  /* ----- Les maquettes ----- */
  function brins(n, parent) {          // une touffe d'herbe : de fins brins de teintes variées
    var im = new T.InstancedMesh(new T.ConeGeometry(0.014, 1, 4), m(0xffffff, { roughness: 0.9, envMapIntensity: 0.2 }), n), o = new T.Object3D(), c = new T.Color();
    for (var i = 0; i < n; i++) {
      var a = Math.random() * 6.283, d = 0.16 + Math.sqrt(Math.random()) * 0.66, h = 0.1 + Math.random() * 0.2;
      o.position.set(Math.cos(a) * d, HAUT + h / 2, Math.sin(a) * d); o.scale.set(1, h, 1); o.rotation.set((Math.random() - 0.5) * 0.5, a, (Math.random() - 0.5) * 0.5); o.updateMatrix(); im.setMatrixAt(i, o.matrix);
      c.setHSL(0.36 + Math.random() * 0.06, 0.62, 0.1 + Math.random() * 0.14); im.setColorAt(i, c);
    }
    im.instanceColor.needsUpdate = true; parent.add(im); return im;
  }
  function debuter() {            // la balle à alvéoles sur son tee en bois, dans l'herbe
    var g = new T.Group();
    mesh(tour([[0, 0], [0.01, 0.02], [0.02, 0.3], [0.03, 0.44], [0.078, 0.53], [0.088, 0.55], [0.06, 0.555], [0, 0.52]], 28), BOIS, 0, HAUT, 0, g);
    balle(0.3, 0, HAUT + 0.82, 0, g); ombre(1.0, 0, 0, g).position.y = HAUT + 0.006;
    balle(0.105, 0.52, HAUT + 0.105, 0.3, g); balle(0.105, -0.46, HAUT + 0.105, -0.34, g);
    brins(tactile ? 50 : 90, g);
    return { g: g, dessus: HERBE, h: 1.5 };
  }
  function cours() {              // le golfeur modélisé, qui enchaîne son swing
    var g = new T.Group(), u = {};
    if (window.BirdyGolfeur) {
      var gf = window.BirdyGolfeur.cree(T); gf.groupe.scale.setScalar(0.86); gf.groupe.position.set(0, HAUT, -0.3); g.add(gf.groupe); u.gf = gf;
      balle(0.03, 0.03, HAUT + 0.03, 0.4, g); ombre(1.3, 0, -0.25, g).position.y = HAUT + 0.006;
    }
    g.userData = u; return { g: g, dessus: HERBE, h: 2.05 };
  }
  function parcours() {           // le green bombé, son trou, son drapeau et un bunker
    var g = new T.Group();
    var gn = mesh(new T.SphereGeometry(0.74, 56, 20), GREEN, 0.06, HAUT - 0.005, 0, g); gn.scale.set(1, 0.07, 0.86);
    var b = mesh(new T.SphereGeometry(0.26, 28, 14), SABLE, -0.56, HAUT, 0.42, g); b.scale.set(1, 0.14, 0.72);
    var tx = 0.2, tz = -0.06, ty = HAUT + 0.05;
    var t = mesh(new T.CircleGeometry(0.062, 24), mb(0x04100c), tx, ty + 0.003, tz, g); t.rotation.x = -Math.PI / 2;
    var bordT = mesh(new T.TorusGeometry(0.064, 0.008, 8, 28), BLANC, tx, ty + 0.002, tz, g); bordT.rotation.x = Math.PI / 2;
    mesh(new T.CylinderGeometry(0.012, 0.012, 1.3, 10), ACIER, tx, ty + 0.65, tz, g); mesh(new T.SphereGeometry(0.022, 12, 10), DORE, tx, ty + 1.31, tz, g);
    var fg = new T.PlaneGeometry(0.5, 0.3, 16, 4); fg.translate(0.25, 0, 0); var f = mesh(fg, ROUGE, tx, ty + 1.13, tz, g);
    balle(0.062, -0.14, HAUT + 0.105, 0.2, g); ombre(0.3, -0.14, 0.2, g).position.y = HAUT + 0.052;
    g.userData = { drapeau: f }; return { g: g, dessus: HERBE, h: 1.75 };
  }
  function voyages() {            // un globe de bureau en verre sombre et or, des destinations, un avion et son sillage
    var g = new T.Group(), cy = HAUT + 0.86;
    mesh(tour([[0, 0], [0.3, 0], [0.31, 0.03], [0.2, 0.07], [0.07, 0.11], [0.05, 0.24], [0, 0.24]], 40), DORE, 0, HAUT, 0, g);
    var c = toile(1024, 512), x2 = c.getContext("2d"); x2.fillStyle = "#0f4a38"; x2.fillRect(0, 0, 1024, 512); x2.strokeStyle = "rgba(233,201,138,.75)"; x2.lineWidth = 2;
    for (var i = 0; i <= 12; i++) { x2.beginPath(); x2.moveTo(i * 1024 / 12, 0); x2.lineTo(i * 1024 / 12, 512); x2.stroke(); }
    for (i = 1; i < 6; i++) { x2.beginPath(); x2.moveTo(0, i * 512 / 6); x2.lineTo(1024, i * 512 / 6); x2.stroke(); }
    var carte = tex(c); carte.encoding = T.sRGBEncoding;
    var globe = new T.Group(); globe.position.y = cy; globe.rotation.z = 0.38; g.add(globe);
    mesh(new T.SphereGeometry(0.55, 56, 40), mp(0xffffff, { map: carte, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.3 }), 0, 0, 0, globe);
    [[0.6, 0.5], [2.1, 0.2], [3.4, -0.3], [4.6, 0.6], [5.5, -0.1], [1.3, -0.5]].forEach(function (p) {
      var s = Math.cos(p[1]), d = V(Math.cos(p[0]) * s, Math.sin(p[1]), Math.sin(p[0]) * s);
      mesh(new T.SphereGeometry(0.03, 12, 10), DORE, d.x * 0.6, d.y * 0.6, d.z * 0.6, globe); var tg = mesh(new T.CylinderGeometry(0.006, 0.006, 0.06, 6), DORE, d.x * 0.575, d.y * 0.575, d.z * 0.575, globe); tg.quaternion.setFromUnitVectors(V(0, 1, 0), d);
    });
    var arc = mesh(new T.TorusGeometry(0.64, 0.018, 12, 60, Math.PI), DORE, 0, cy, 0, g); arc.rotation.z = Math.PI / 2 + 0.38;
    var orbite = new T.Group(); orbite.position.y = cy; orbite.rotation.set(0.5, 0, 0.25); g.add(orbite);
    var avion = new T.Group(); avion.position.x = 0.9; orbite.add(avion);
    var corps = mesh(new T.CylinderGeometry(0.036, 0.03, 0.26, 16), BLANC, 0, 0, 0.01, avion); corps.rotation.x = Math.PI / 2;
    var nez = mesh(new T.SphereGeometry(0.036, 16, 12), BLANC, 0, 0, -0.12, avion); nez.scale.z = 1.6; mesh(new T.SphereGeometry(0.03, 12, 10), BLANC, 0, 0, 0.14, avion).scale.z = 1.4;
    [1, -1].forEach(function (s) { var a = mesh(new T.BoxGeometry(0.2, 0.01, 0.07), BLANC, s * 0.11, -0.005, 0.02, avion); a.rotation.y = -s * 0.42; var q = mesh(new T.BoxGeometry(0.08, 0.008, 0.04), BLANC, s * 0.045, 0.004, 0.14, avion); q.rotation.y = -s * 0.42; mesh(new T.CylinderGeometry(0.014, 0.014, 0.05, 10), ACIER, s * 0.1, -0.022, 0.0, avion).rotation.x = Math.PI / 2; });
    mesh(new T.BoxGeometry(0.008, 0.07, 0.05), mb(MENTHE), 0, 0.04, 0.14, avion);
    for (i = 1; i <= 7; i++) { var sp = mesh(new T.SphereGeometry(0.016 * (1 - i / 9), 8, 6), mb(0xffffff, { transparent: true, opacity: 0.7 * (1 - i / 8) }), Math.cos(-i * 0.13) * 0.9, 0, -Math.sin(-i * 0.13) * 0.9, orbite); sp.userData.i = i; }
    ombre(1.0, 0, 0, g).position.y = HAUT + 0.006;
    g.userData = { globe: globe, orbite: orbite }; return { g: g, dessus: m(0x163d31, { roughness: 0.5 }), h: 1.85 };
  }
  var FAB = { debuter: debuter, cours: cours, parcours: parcours, voyages: voyages };

  /* ----- Les pôles : textes lus dans les cartes de la page, qui restent les vrais conteneurs d'information ----- */
  var lbls = document.getElementById("h3-lbls");
  var poles = cartes.map(function (c, i) {
    var g = new T.Group(), f = FAB[c.dataset.pole](), s = socle(f.dessus); g.add(s); g.add(f.g); sc.add(g);
    var l = el("a", "h3-lbl"); l.href = c.getAttribute("href"); l.appendChild(el("i", null, c.querySelector("i").textContent)); l.appendChild(el("span", null, c.querySelector("small").textContent)); lbls.appendChild(l);
    var p = { i: i, g: g, socle: s, mo: f.g, lbl: l, c: c, href: c.getAttribute("href"), h: f.h, e: 1, px: 0, py: 0, pr: 0, z: 0 };
    l.addEventListener("mouseenter", function () { active(i); }); l.addEventListener("focus", function () { active(i); });
    // au doigt : si ce toucher vient de choisir le pôle, on n'ouvre pas encore la page
    l.addEventListener("click", function (ev) { if (tactile && (actif !== i || performance.now() - depuis < 700)) { ev.preventDefault(); active(i); } });
    c.addEventListener("mouseenter", function () { active(i); }); c.addEventListener("focus", function () { active(i); }); c.addEventListener("mouseleave", relache); c.addEventListener("blur", relache);
    return p;
  });
  var lblB = el("a", "h3-lbl h3-birdy"); lblB.href = "#ha-chat"; lblB.appendChild(el("span", null, "Birdy · votre assistant")); lbls.appendChild(lblB);
  function parler(ev) { var b = document.getElementById("ha-parler2"); if (b) { if (ev) ev.preventDefault(); b.click(); } else location.hash = "#ha-chat"; }
  lblB.addEventListener("click", parler);

  /* ----- État : rotation de l'orbite, pôle actif ----- */
  var rot = 0.55, actif = -1, minuteur = 0, depuis = 0, AV = Math.PI / 2;      // AV : angle du « devant »
  function active(i) {
    clearTimeout(minuteur); if (actif === i) return; actif = i; depuis = performance.now();
    poles.forEach(function (p) { p.lbl.classList.toggle("on", p.i === i); p.c.classList.toggle("actif", p.i === i); });
    box.classList.toggle("choisi", i >= 0); sec.classList.toggle("choisi", i >= 0);
  }
  function relache() { clearTimeout(minuteur); minuteur = setTimeout(function () { active(-1); }, 900); }

  /* ----- Pointeur : parallaxe, survol des maquettes, glisser pour tourner ----- */
  var W = 1, H = 1, mx = 0, my = 0, bas = null, glisse = false, cx = 0, cy0 = 0, cr = 0;
  function local(e) { var b = r.domElement.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; }
  function sous(q) { var best = -1, bz = 9; poles.forEach(function (p) { var dx = q.x - p.px, dy = q.y - (p.py - p.pr * 0.55); if (dx * dx + dy * dy < p.pr * p.pr && p.z < bz) { bz = p.z; best = p.i; } }); return best; }
  function surBirdy(q) { var dx = q.x - cx, dy = q.y - cy0; return dx * dx + dy * dy < cr * cr; }
  box.addEventListener("pointermove", function (e) {
    var q = local(e); mx = q.x / W * 2 - 1; my = q.y / H * 2 - 1;
    if (bas) { var dx = e.clientX - bas.x; if (Math.abs(dx) > 6) { glisse = true; box.classList.add("tourne"); } if (glisse) { rot = bas.rot - dx * 0.006; if (actif >= 0) active(-1); } return; }
    if (tactile || e.target.closest(".h3-lbl")) return;
    var s = sous(q); if (s >= 0) { active(s); box.style.cursor = "pointer"; } else { box.style.cursor = surBirdy(q) ? "pointer" : ""; if (actif >= 0) relache(); }
  });
  box.addEventListener("pointerdown", function (e) { if (e.target.closest("a,button")) return; bas = { x: e.clientX, rot: rot }; glisse = false; });
  addEventListener("pointerup", function () { bas = null; box.classList.remove("tourne"); });
  addEventListener("pointercancel", function () { bas = null; box.classList.remove("tourne"); });
  box.addEventListener("pointerleave", function () { mx = 0; my = 0; if (!tactile) relache(); });
  box.addEventListener("click", function (e) {
    if (glisse || e.target.closest("a,button")) return;
    var q = local(e), s = sous(q);
    if (s < 0) { if (surBirdy(q)) parler(); else if (tactile) active(-1); return; }
    if (tactile && actif !== s) active(s); else location.href = poles[s].href;
  });

  /* ----- Taille et cadrage ----- */
  var A = 5, B = 3, D = 13.5, CY = 1.45, LY = -0.25, visible = !window.IntersectionObserver;   // orbite, distance caméra, hauteur du médaillon, point visé
  function taille() {
    var b = r.domElement.getBoundingClientRect(); W = Math.max(1, b.width); H = Math.max(1, b.height); r.setSize(W, H, false); cam.aspect = W / H; cam.updateProjectionMatrix();
    var a = W / H;
    // écran étroit : orbite resserrée, médaillon remonté au-dessus des maquettes
    if (a < 1.15) { A = 2.1; B = 2.0; D = 15.5 / Math.max(0.72, Math.min(1, a / 0.85)); CY = 2.3; LY = 0.25; } else if (a < 1.8) { A = 3.9; B = 2.7; D = 14.5; CY = 1.45; LY = -0.25; } else { A = Math.min(5.6, 2.3 * a); B = 3.0; D = 13.5; CY = 1.45; LY = -0.25; }
    sc.fog.near = D - 3; sc.fog.far = D + 9; box.classList.toggle("etroit", a < 1.15);
  }
  if (window.ResizeObserver) new ResizeObserver(taille).observe(r.domElement); else addEventListener("resize", taille);
  taille();
  if (window.IntersectionObserver) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }, { rootMargin: "120px" }).observe(box);

  /* ----- Boucle ----- */
  var lent = 0.016, vues = 0;
  var t0 = performance.now(), dernier = 0, v3 = V(0, 0, 0), camPos = V(0, 2.4, D), cible = V(0, LY, 0), tmp = V(0, 0, 0), ctmp = V(0, 0, 0), milieu = V(0, 0, 0), KT = window.BirdyGolfeur ? window.BirdyGolfeur.KT : null;
  function ecran(p, hauteur, o) { v3.copy(p); v3.y += hauteur; v3.project(cam); o.x = (v3.x * 0.5 + 0.5) * W; o.y = (-v3.y * 0.5 + 0.5) * H; o.z = v3.z; return o; }
  var e1 = {}, e2 = {};
  (function boucle(now) {
    requestAnimationFrame(boucle);
    if (!visible || document.hidden) return;
    var t = ((now || t0) - t0) / 1000, brut = t - dernier, dt = Math.min(0.05, brut); dernier = t;
    // fluidité : si les images mettent trop de temps, on baisse la résolution par paliers (jamais sous 0,6)
    if (brut < 1) { lent = lent * 0.8 + brut * 0.2; if (++vues > 12 && lent > 0.04 && qualite > 0.6) { qualite = Math.max(0.6, qualite - 0.3); r.setPixelRatio(qualite); r.setSize(W, H, false); vues = 0; lent = 0.016; } }
    // orbite : tourne doucement ; si un pôle est choisi, il vient devant par le plus court chemin
    if (actif >= 0 && !bas) { var d = AV - (rot + actif * Math.PI / 2); d = Math.atan2(Math.sin(d), Math.cos(d)); rot += d * Math.min(1, dt * 3.2); }
    else if (!bas && !calme) rot += dt * 0.11;
    poles.forEach(function (p) {
      var th = rot + p.i * Math.PI / 2, s = Math.sin(th), on = p.i === actif;
      p.g.position.set(A * Math.cos(th), -0.75 - 0.9 * s + (calme ? 0 : Math.sin(t * 1.1 + p.i * 1.7) * 0.08), B * s);
      p.e = lerp(p.e, on ? 1.2 : actif >= 0 ? 0.9 : 1, Math.min(1, dt * 5)); p.g.scale.setScalar(p.e);
      if (!calme) p.mo.rotation.y += dt * (on ? 0.7 : 0.3);
      p.socle.userData.lueur.material.opacity = lerp(p.socle.userData.lueur.material.opacity, on ? 0.75 : 0.2, dt * 5);
      p.socle.userData.bord.opacity = on ? 1 : 0.7;
      var u = p.mo.userData;
      if (u.orbite) { u.orbite.rotation.y = t * 1.3; u.globe.rotation.y = t * 0.25; }
      if (u.drapeau) { var fp = u.drapeau.geometry.attributes.position; for (var k = 0; k < fp.count; k++) { var x = fp.getX(k); fp.setZ(k, Math.sin(x * 9 - t * 5) * 0.05 * x * 2); } fp.needsUpdate = true; u.drapeau.geometry.computeVertexNormals(); u.drapeau.rotation.y = -p.mo.rotation.y - 0.4; }
      if (u.gf) { if (calme) u.gf.pose(KT[2]); else { var c = (t + 1) % 5.2; u.gf.pose(c < 0.6 ? 0 : c < 4.2 ? (c - 0.6) / 3.6 : 1); } }   // adresse, swing, tenue du finish, et on recommence
    });
    // centre : le médaillon suit légèrement le pointeur, les anneaux tournent
    medaillon.rotation.y = lerp(medaillon.rotation.y, mx * 0.5 + (calme ? 0 : Math.sin(t * 0.6) * 0.16), dt * 3); medaillon.rotation.x = lerp(medaillon.rotation.x, my * 0.28, dt * 3);
    centre.position.y = CY + (calme ? 0 : Math.sin(t * 0.9) * 0.07);
    if (!calme) { anneaux.forEach(function (a) { a.rotation.z += dt * a.userData.v; a.rotation.y += dt * a.userData.v * 0.4; }); poussiere.rotation.y = t * 0.03; }
    // caméra : parallaxe, et approche du pôle choisi
    tmp.set(mx * 0.9, 2.4 - my * 0.5, D); ctmp.set(0, LY, 0);
    if (actif >= 0) { var ap = poles[actif].g.position; tmp.set(ap.x * 0.2 + mx * 0.5, 2.0 - my * 0.35, D - (LY > 0 ? 0.6 : 1.9)); ctmp.set(ap.x * 0.2, LY - 0.3, 0.4); }
    camPos.lerp(tmp, Math.min(1, dt * 2.6)); cible.lerp(ctmp, Math.min(1, dt * 2.6)); cam.position.copy(camPos); cam.lookAt(cible);
    cam.updateMatrixWorld();
    // étiquettes projetées
    poles.forEach(function (p) {
      ecran(p.g.position, p.h * p.e, e1); ecran(p.g.position, 0.1, e2);
      p.px = e2.x; p.py = e2.y; p.z = e2.z; p.pr = Math.max(48, Math.abs(e2.y - e1.y) * 0.7);
      var loin = (p.g.position.z + B) / (2 * B);                      // 0 : au fond, 1 : devant
      p.lbl.style.transform = "translate(" + e1.x.toFixed(1) + "px," + e1.y.toFixed(1) + "px) scale(" + (0.82 + loin * 0.22).toFixed(3) + ")";
      var cache = loin < 0.3 && Math.abs(e1.x - cx) < cr * 1.25 && p.i !== actif;      // derrière le médaillon : l'étiquette s'efface
      p.lbl.style.opacity = cache ? "0" : (0.45 + loin * 0.55).toFixed(2); p.lbl.style.pointerEvents = cache ? "none" : ""; p.lbl.style.zIndex = Math.round(loin * 10) + (p.i === actif ? 20 : 0);
    });
    ecran(centre.position, 0, e1); cx = e1.x; cy0 = e1.y; ecran(centre.position, 1.25, e2); cr = Math.abs(e1.y - e2.y);
    ecran(centre.position, -1.95, e2); lblB.style.transform = "translate(" + e2.x.toFixed(1) + "px," + e2.y.toFixed(1) + "px)";
    // le halo de la page : un disque parfait, centré derrière la scène (entre le médaillon et l'orbite)
    if (halo) { milieu.set(0, (CY + LY) / 2 - 0.2, 0); ecran(milieu, 0, e2); halo.style.transform = "translate(" + e2.x.toFixed(1) + "px," + e2.y.toFixed(1) + "px)"; }
    r.render(sc, cam);
  })(t0);
})();
