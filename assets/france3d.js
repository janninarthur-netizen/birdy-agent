/* Birdy Golf : la France en 3D. Les villes dessinent la carte, les 621 golfs brillent,
   des ondes partent des parcours, et les golfs trouvés par la recherche s'illuminent.
   Three.js r128 (cdnjs). Désactivé si WebGL est absent ; calme si l'utilisateur réduit les animations. */
(function () {
  "use strict";
  var cv = document.getElementById("gp-3d");
  if (!cv || !window.THREE || !window.BirdyGolf) return;
  var calme = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); } catch (e) { return; }
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  var scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  cam.position.set(0, -6.5, 13); cam.lookAt(0, 0.2, 0);
  var groupe = new THREE.Group(); scene.add(groupe);
  var K = 0.7, cosL = Math.cos(46.6 * Math.PI / 180);
  function xy(la, lo) { return [(lo - 2.45) * cosL * K, (la - 46.6) * K]; }
  function metro(la, lo) { return la > 41 && la < 51.6 && lo > -5.6 && lo < 10; }

  var vert = [
    "attribute float taille; attribute float phase; attribute float hi; uniform float t; uniform float px;",
    "varying float vA; varying float vHi;",
    "void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0);",
    " float s = taille * (1.0 + 0.25*sin(t*1.6 + phase)) * (1.0 + hi*0.9);",
    " gl_PointSize = s * px * (12.0 / -mv.z); vA = 0.55 + 0.45*sin(t*1.3 + phase); vHi = hi; gl_Position = projectionMatrix * mv; }"
  ].join("\n");
  var frag = [
    "uniform vec3 c1; uniform vec3 c2; uniform float base; uniform float sel; varying float vA; varying float vHi;",
    "void main(){ vec2 d = gl_PointCoord - 0.5; float r = length(d); if (r > 0.5) discard;",
    " float a = smoothstep(0.5, 0.0, r); vec3 c = mix(c1, c2, vHi);",
    " gl_FragColor = vec4(c, a * (base + (1.0-base)*vA) * mix(1.0 - sel*0.7, 1.0, vHi)); }"
  ].join("\n");
  function nuage(pts, opt) {
    var g = new THREE.BufferGeometry(), n = pts.length, pos = new Float32Array(n * 3), ta = new Float32Array(n), ph = new Float32Array(n), hi = new Float32Array(n);
    pts.forEach(function (p, i) { pos[i * 3] = p[0]; pos[i * 3 + 1] = p[1]; pos[i * 3 + 2] = p[2] || 0; ta[i] = opt.taille * (p[3] || 1); ph[i] = Math.random() * 6.28; });
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("taille", new THREE.BufferAttribute(ta, 1));
    g.setAttribute("phase", new THREE.BufferAttribute(ph, 1)); g.setAttribute("hi", new THREE.BufferAttribute(hi, 1));
    var m = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { t: { value: 0 }, px: { value: renderer.getPixelRatio() }, c1: { value: new THREE.Color(opt.c1) }, c2: { value: new THREE.Color(opt.c2 || "#FFFFFF") }, base: { value: opt.base }, sel: { value: 0 } } });
    var o = new THREE.Points(g, m); groupe.add(o); return o;
  }
  // Socle : léger halo sous la carte

  var villes, golfs, ids = [], ondes = [], visible = true, mx = 0, my = 0;
  Promise.all([BirdyGolf.charger(), fetch("/data/france-points.json").then(function (r) { return r.json(); })]).then(function (x) {
    var D = x[0];
    villes = nuage(x[1].map(function (v) { var p = xy(v[0], v[1]); return [p[0], p[1], 0, 1]; }), { taille: 2.1, c1: "#5C9C82", base: 0.85 });
    var gs = D.golfs.filter(function (g) { return metro(g.la, g.lo); });
    ids = gs.map(function (g) { return g.i; });
    golfs = nuage(gs.map(function (g) { var p = xy(g.la, g.lo); return [p[0], p[1], 0.06, g.t18 ? 1.25 : 0.8]; }), { taille: 4.6, c1: "#BFE0D1", c2: "#FFFFFF", base: 0.45 });
    taille(); cv.classList.add("on"); if (calme) dessine(0);
  }).catch(function () {});

  // Ondes : un anneau s'élargit autour d'un golf au hasard (ou d'un golf trouvé)
  var anneau = new THREE.RingGeometry(0.05, 0.058, 48), choisis = [];
  function onde() {
    if (!golfs) return;
    var pos = golfs.geometry.attributes.position.array, i = choisis.length ? choisis[Math.floor(Math.random() * choisis.length)] : Math.floor(Math.random() * ids.length);
    var m = new THREE.Mesh(anneau, new THREE.MeshBasicMaterial({ color: 0xA3C9B8, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending }));
    m.position.set(pos[i * 3], pos[i * 3 + 1], 0.07); m.userData.t = 0; groupe.add(m); ondes.push(m);
  }
  // Appelé par la recherche : les golfs trouvés s'illuminent
  window.BirdyGolf3D = {
    surligne: function (liste) {
      if (!golfs) return;
      var set = {}, a = golfs.geometry.attributes.hi; (liste || []).forEach(function (x) { set[x] = 1; });
      choisis = [];
      for (var k = 0; k < ids.length; k++) { var on = set[ids[k]] ? 1 : 0; a.array[k] = on; if (on) choisis.push(k); }
      a.needsUpdate = true; golfs.material.uniforms.sel.value = choisis.length ? 1 : 0;
    }
  };
  function taille() {
    var r = cv.getBoundingClientRect(); if (!r.width || !r.height) return;
    renderer.setSize(r.width, r.height, false); cam.aspect = r.width / r.height;
    cam.position.z = r.width < 600 ? 15.5 : 13; cam.updateProjectionMatrix(); groupe.position.x = r.width > 700 ? 0.8 : 0;
  }
  addEventListener("resize", taille);
  addEventListener("pointermove", function (e) { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; }, { passive: true });
  if (window.IntersectionObserver) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(cv);
  var t0 = performance.now(), prochaine = 0;
  function dessine(now) {
    var t = (now - t0) / 1000;
    groupe.rotation.x = -0.12 + my * 0.12;
    groupe.rotation.z = Math.sin(t * 0.12) * 0.22 + mx * 0.25;
    [villes, golfs].forEach(function (o) { if (o) o.material.uniforms.t.value = t; });
    if (!calme && t > prochaine) { onde(); prochaine = t + (choisis.length ? 0.3 : 0.75); }
    for (var i = ondes.length - 1; i >= 0; i--) {
      var o = ondes[i]; o.userData.t += 0.016; var k = o.userData.t;
      o.scale.setScalar(1 + k * 6); o.material.opacity = Math.max(0, 0.7 - k * 0.6);
      if (k > 1.2) { groupe.remove(o); o.material.dispose(); ondes.splice(i, 1); }
    }
    renderer.render(scene, cam);
  }
  (function boucle(now) { if (visible && !calme) dessine(now); requestAnimationFrame(boucle); })(performance.now());
})();
