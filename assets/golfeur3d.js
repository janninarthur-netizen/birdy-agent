/* Le golfeur 3D (Three.js), partagé par la page Débuter (le swing phase par phase) et la scène des pôles de l'accueil.
   BirdyGolfeur.cree(THREE) renvoie { groupe, pose(t) } : t va de 0 (adresse) à 1 (finish). BirdyGolfeur.KT : l'instant de chaque phase. */
(function () {
  "use strict";
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

  window.BirdyGolfeur = { KT: KT, cree: function (T) {
    function V(x, y, z) { return new T.Vector3(x, y, z); }
    var RAD = Math.PI / 180, AXE_Y = V(0, 1, 0);
    function m(c, r, me) { var x = new T.MeshStandardMaterial({ color: c, roughness: r == null ? 0.7 : r, metalness: me || 0 }); x.color.convertSRGBToLinear(); return x; }
    var PEAU = m(0xd9a47b, 0.6), POLO = m(0xf6f3ea, 0.82), MENTHE = m(0x8fc4ad, 0.75), PANT = m(0x1e4a3d, 0.88), CUIR = m(0x2b1e15, 0.5), BLANC = m(0xfbfbf7, 0.45),
      SEMELLE = m(0x232c28, 0.85), CHEVEUX = m(0x3b2a1e, 0.95), ACIER = m(0xe2e8e5, 0.22, 0.9), GRIP = m(0x151a18, 0.92), FONCE = m(0x18201d, 0.3, 0.7), OEIL = m(0x1c1612, 0.4);
    /* ----- Le personnage : un golfeur modélisé (buste, bassin, tête, membres articulés), replacé à chaque image ----- */
    var perso = new T.Group();
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
    function pose(t) {
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
    }
    pose(0);
    return { groupe: perso, pose: pose };
  } };
})();
