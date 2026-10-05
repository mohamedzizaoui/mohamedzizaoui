// AVD Velgen · echte 3D-velgen, opgebouwd uit een ontwerp (spaken, naaf, lip, band, rem).
// Alle maten in meter. De velg ligt in het XY-vlak, het zichtvlak wijst naar +Z (buitenkant van de wagen).
import * as THREE from 'three';

export const INCH = 0.0254;

/* ---------------------------------------------------------------- *
 *  Afwerkingen: [vlak (spaakvoorkant), zijkant (flanken, vensters), lip]
 * ---------------------------------------------------------------- */
const fys = (o) => new THREE.MeshPhysicalMaterial(Object.assign({ side: THREE.FrontSide }, o));
const lak = (kleur, extra) => fys(Object.assign({ color: kleur, metalness: 0.35, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.08 }, extra));
const mat = (kleur, extra) => fys(Object.assign({ color: kleur, metalness: 0.2, roughness: 0.62 }, extra));
const gepolijst = () => fys({ color: 0xe2e4e7, metalness: 1, roughness: 0.14, clearcoat: 0.6, clearcoatRoughness: 0.05, envMapIntensity: 1.3 });
const chroom = () => fys({ color: 0xf0f2f4, metalness: 1, roughness: 0.06, envMapIntensity: 1.4 });

export const AFWERKINGEN = {
  'zwart-gepolijst':   { naam: 'Zwart gepolijst',   vlak: gepolijst, zij: () => lak(0x0a0b0d), lip: gepolijst },
  'zwart-glans':       { naam: 'Zwart glans',       vlak: () => lak(0x0a0b0d), zij: () => lak(0x0a0b0d), lip: () => lak(0x0a0b0d) },
  'zwart-mat':         { naam: 'Zwart mat',         vlak: () => mat(0x1a1b1e), zij: () => mat(0x1a1b1e), lip: () => mat(0x1a1b1e) },
  'grafiet-gepolijst': { naam: 'Grafiet gepolijst', vlak: gepolijst, zij: () => lak(0x3b3f45), lip: gepolijst },
  'grafiet-glans':     { naam: 'Grafiet glans',     vlak: () => lak(0x44484f, { metalness: 0.6 }), zij: () => lak(0x44484f, { metalness: 0.6 }), lip: () => lak(0x44484f, { metalness: 0.6 }) },
  'gunmetal':          { naam: 'Gunmetal mat',      vlak: () => mat(0x4b4f56, { metalness: 0.5, roughness: 0.5 }), zij: () => mat(0x4b4f56, { metalness: 0.5, roughness: 0.5 }), lip: () => mat(0x4b4f56, { metalness: 0.5, roughness: 0.5 }) },
  'zilver':            { naam: 'Zilver glans',      vlak: () => lak(0xc3c6ca, { metalness: 0.85, roughness: 0.3 }), zij: () => lak(0xc3c6ca, { metalness: 0.85, roughness: 0.3 }), lip: () => lak(0xc3c6ca, { metalness: 0.85, roughness: 0.3 }) },
  'hyperzilver':       { naam: 'Hyperzilver',       vlak: () => lak(0x9ea2a8, { metalness: 0.95, roughness: 0.2 }), zij: () => lak(0x9ea2a8, { metalness: 0.95, roughness: 0.2 }), lip: () => lak(0x9ea2a8, { metalness: 0.95, roughness: 0.2 }) },
  'brons':             { naam: 'Brons mat',         vlak: () => mat(0x8a6b42, { metalness: 0.7, roughness: 0.45 }), zij: () => mat(0x8a6b42, { metalness: 0.7, roughness: 0.45 }), lip: () => mat(0x8a6b42, { metalness: 0.7, roughness: 0.45 }) },
  'wit':               { naam: 'Wit glans',         vlak: () => lak(0xf2f3f4), zij: () => lak(0xf2f3f4), lip: () => lak(0xf2f3f4) },
  'chroom':            { naam: 'Chroom',            vlak: chroom, zij: chroom, lip: chroom }
};

/* ---------------------------------------------------------------- *
 *  Hulpfuncties
 * ---------------------------------------------------------------- */
const TAU = Math.PI * 2;
const pol = (r, a) => new THREE.Vector2(r * Math.cos(a), r * Math.sin(a));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);

// Vormen (Shape) tot één geometrie extruderen; groep 0 = voor/achter, groep 1 = zijkanten
function extrudeer(vormen, diepte, bevel) {
  return new THREE.ExtrudeGeometry(vormen, { depth: diepte, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 24, steps: 1 });
}

// Het velgvlak hol maken: hoe dichter bij de naaf, hoe dieper (concaaf)
function maakConcaaf(geo, r0, r1, diepte, macht) {
  if (!diepte) return geo;
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const r = Math.hypot(p.getX(i), p.getY(i));
    const t = THREE.MathUtils.clamp((r1 - r) / (r1 - r0), 0, 1);
    p.setZ(i, p.getZ(i) - diepte * Math.pow(t, macht || 1.5));
  }
  geo.computeVertexNormals();
  return geo;
}

// Een spaak als veelhoek in poolcoördinaten rond het velgmiddelpunt.
// s: { hoek, r0, r1, bHub, bRim, kromming, splits, armHoek, armBreedte, zwaai }
function spaakVorm(s) {
  const L = [], R = [];
  const n = 14;
  const links = [], rechts = [];
  const breedte = (t) => lerp(s.bHub, s.bRim, smooth(t));
  const zijdelings = (t) => (s.kromming || 0) * t * t + (s.zwaai || 0) * t;   // zijwaartse verschuiving (m) langs de spaak
  const tSplits = s.splits == null ? 1.01 : s.splits;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    if (t > tSplits) break;
    const r = lerp(s.r0, s.r1, t), w = breedte(t) / 2, x = zijdelings(t);
    links.push(pol(r, s.hoek + (x - w) / r));
    rechts.push(pol(r, s.hoek + (x + w) / r));
  }
  if (tSplits <= 1) {
    // Y-spaak: twee armen vanaf het splitspunt naar de velgrand
    const rS = lerp(s.r0, s.r1, tSplits), xS = zijdelings(tSplits), wS = breedte(tSplits) / 2;
    const arm = s.armBreedte || s.bRim, a = s.armHoek;      // halve openingshoek aan de rand (rad)
    const rand = (kant) => {
      const binnen = pol(s.r1, s.hoek + xS / s.r1 + kant * (a - arm / 2 / s.r1));
      const buiten = pol(s.r1, s.hoek + xS / s.r1 + kant * (a + arm / 2 / s.r1));
      return [binnen, buiten];
    };
    const [lb, lbu] = rand(-1), [rb, rbu] = rand(1);
    const kruis = pol(rS + (s.r1 - rS) * 0.32, s.hoek + xS / rS);     // de punt tussen de armen
    const pts = [...links, lbu, lb, kruis, rb, rbu, ...rechts.reverse()];
    return new THREE.Shape(pts);
  }
  return new THREE.Shape([...links, ...rechts.reverse()]);
}

// Ring (annulus) als Shape
function ringVorm(rBinnen, rBuiten) {
  const v = new THREE.Shape(); v.absarc(0, 0, rBuiten, 0, TAU, false);
  const g = new THREE.Path(); g.absarc(0, 0, rBinnen, 0, TAU, true);
  v.holes.push(g);
  return v;
}

// Schijf met vensters (gaten), bv. Carbonado Rebellion
function schijfMetVensters(rBuiten, vensters) {
  const v = new THREE.Shape(); v.absarc(0, 0, rBuiten, 0, TAU, false);
  for (const w of vensters) {
    const g = new THREE.Path();
    const pts = [pol(w.r0, w.hoek - w.b0 / 2 / w.r0), pol(w.r1, w.hoek - w.b1 / 2 / w.r1), pol(w.r1, w.hoek + w.b1 / 2 / w.r1), pol(w.r0, w.hoek + w.b0 / 2 / w.r0)];
    g.moveTo(pts[0].x, pts[0].y); for (let i = 1; i < 4; i++) g.lineTo(pts[i].x, pts[i].y); g.closePath();
    v.holes.push(g);
  }
  return v;
}

// Steek "5x112" → { n, pcd (m) }
export function leesSteek(s) {
  const m = /(\d+)\s*[x×]\s*([\d.,]+)/.exec(String(s || '5x112'));
  return m ? { n: +m[1], pcd: parseFloat(m[2].replace(',', '.')) / 1000 } : { n: 5, pcd: 0.112 };
}

// Canvas-textuur voor de naafdop (merknaam)
const dopCache = new Map();
function dopTextuur(merk, kleur, tekstKleur) {
  const sleutel = merk + kleur + tekstKleur;
  if (dopCache.has(sleutel)) return dopCache.get(sleutel);
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = kleur; g.beginPath(); g.arc(128, 128, 128, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 6; g.beginPath(); g.arc(128, 128, 112, 0, TAU); g.stroke();
  g.fillStyle = tekstKleur; g.textAlign = 'center'; g.textBaseline = 'middle';
  const korte = merk.length > 9 ? merk.slice(0, 9) : merk;
  g.font = `700 ${korte.length > 6 ? 44 : 60}px "Roboto Slab", Georgia, serif`;
  g.fillText(korte.toUpperCase(), 128, 132);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  dopCache.set(sleutel, t);
  return t;
}

/* ---------------------------------------------------------------- *
 *  De velg
 * ---------------------------------------------------------------- */
// ontwerp: { merk, stijl: 'spaken'|'vensters', spaken, splits, armHoek, bHub, bRim, kromming, zwaai, dubbel, concaaf, diepteVlak, lipBreedte, naafR, accent, vensters:{...} }
// opties: { inch, breedteJ, steek, naafgat, afwerking, accentKleur }
export function maakVelg(ontwerp, opties) {
  const inch = opties.inch || 18, breedteJ = opties.breedteJ || 8;
  const R = inch * INCH / 2;                         // nominale velgstraal (bandzitting)
  const W = breedteJ * INCH;                         // velgbreedte
  const afw = AFWERKINGEN[opties.afwerking] || AFWERKINGEN['zwart-glans'];
  const mVlak = afw.vlak(), mZij = afw.zij(), mLip = afw.lip();
  const schaal = R / (19 * INCH / 2);                // ontwerpmaten zijn getekend voor 19"
  const g = new THREE.Group();
  g.name = 'velg';

  const rLip = R + 0.011;                            // buitenrand van de hoorn
  const rVlak = R * (ontwerp.rVlak || 0.9);          // buitenrand van het spakenvlak (binnen de lip)
  const rNaaf = (ontwerp.naafR || 0.075) * schaal;   // straal van het naafgedeelte
  const dik = (ontwerp.diepteVlak || 0.024) * schaal;
  const concaaf = (ontwerp.concaaf || 0) * schaal;
  const bevel = 0.0015;

  /* lip en hoorn: lathe-profiel (r, z) rond de Z-as */
  const prof = [
    [rLip, 0.004], [rLip - 0.002, 0.009], [R - 0.004, 0.009], [R - 0.012, 0.0], [R - 0.014, -0.014],
    [R - 0.016, -W + 0.03], [R - 0.004, -W + 0.012], [rLip - 0.002, -W + 0.004], [rLip, -W]
  ].map(([r, z]) => new THREE.Vector2(r, z)).reverse();
  const velgbed = new THREE.Mesh(new THREE.LatheGeometry(prof, 128), mLip);
  velgbed.rotation.x = Math.PI / 2;   // lathe draait om Y → om Z
  velgbed.name = 'velgbed';
  g.add(velgbed);
  // binnenkant van het velgbed (donker), zichtbaar door de vensters
  const binnen = new THREE.Mesh(new THREE.CylinderGeometry(R - 0.017, R - 0.02, W - 0.05, 96, 1, true), fys({ color: ontwerp.accent === 'binnenrood' ? (opties.accentKleur || 0xc8102e) : 0x1b1c1f, metalness: 0.6, roughness: 0.5, side: THREE.BackSide }));
  binnen.rotation.x = Math.PI / 2; binnen.position.z = -W / 2 + 0.005; binnen.name = 'binnenbed';
  g.add(binnen);
  if (ontwerp.accent === 'randrood') {               // gekleurde rand op de hoorn (Borbet LX19 BGRR)
    const ring = new THREE.Mesh(new THREE.TorusGeometry(rLip - 0.0035, 0.0032, 10, 128), lak(opties.accentKleur || 0xd4111f));
    ring.position.z = 0.0065; ring.name = 'accentrand'; g.add(ring);
  }

  /* het spakenvlak */
  const vlakGroep = new THREE.Group(); vlakGroep.name = 'spakenvlak'; vlakGroep.position.z = -dik + 0.004;
  const vormen = [];
  if (ontwerp.stijl === 'vensters') {
    const v = ontwerp.vensters, n = v.aantal;
    const lijst = [];
    for (let i = 0; i < n; i++) {
      const hoek = TAU * i / n + Math.PI / 2;
      lijst.push({ hoek, r0: rVlak * v.r0, r1: rVlak * v.r1, b0: v.b0 * schaal, b1: v.b1 * schaal });
    }
    vormen.push(schijfMetVensters(rVlak, lijst));
  } else {
    const n = ontwerp.spaken;
    for (let i = 0; i < n; i++) {
      const hoek = TAU * i / n + Math.PI / 2 + (ontwerp.fase || 0);
      const basis = { hoek, r0: rNaaf * 0.75, r1: rVlak + 0.004, bHub: ontwerp.bHub * schaal, bRim: ontwerp.bRim * schaal, kromming: (ontwerp.kromming || 0) * schaal, zwaai: (ontwerp.zwaai || 0) * schaal, splits: ontwerp.splits, armHoek: ontwerp.armHoek, armBreedte: ontwerp.armBreedte ? ontwerp.armBreedte * schaal : undefined };
      if (ontwerp.dubbel) {
        const d = ontwerp.dubbel * schaal / 2;
        vormen.push(spaakVorm(Object.assign({}, basis, { hoek: hoek - d / rVlak, zwaai: basis.zwaai - d * 0.3 })));
        vormen.push(spaakVorm(Object.assign({}, basis, { hoek: hoek + d / rVlak, zwaai: basis.zwaai + d * 0.3 })));
      } else vormen.push(spaakVorm(basis));
    }
    // buitenring die de spaken aan de velgrand verbindt
    vormen.push(ringVorm(rVlak - 0.006, rVlak + 0.004));
  }
  const vlakGeo = maakConcaaf(extrudeer(vormen, dik, bevel), rNaaf, rVlak, concaaf, 1.6);
  const vlak = new THREE.Mesh(vlakGeo, [mVlak, mZij]);
  vlak.name = 'spaken';
  vlakGroep.add(vlak);

  /* naaf met boutgaten en naafgat */
  const steek = leesSteek(opties.steek);
  const naafVorm = new THREE.Shape(); naafVorm.absarc(0, 0, rNaaf, 0, TAU, false);
  const boutR = steek.pcd / 2, gatR = 0.0085;
  for (let i = 0; i < steek.n; i++) {
    const a = TAU * i / steek.n + Math.PI / 2, c = pol(boutR, a);
    const h = new THREE.Path(); h.absarc(c.x, c.y, gatR, 0, TAU, true); naafVorm.holes.push(h);
  }
  const naafgatR = Math.max(0.03, Math.min((opties.naafgat || 66.5) / 2000, boutR - gatR - 0.004));
  const centrum = new THREE.Path(); centrum.absarc(0, 0, naafgatR, 0, TAU, true); naafVorm.holes.push(centrum);
  const naafDik = dik + 0.006;
  const naafGeo = maakConcaaf(extrudeer([naafVorm], naafDik, bevel), rNaaf, rVlak, concaaf, 1.6);
  const naaf = new THREE.Mesh(naafGeo, [ontwerp.naafGepolijst === false ? mZij : mVlak, mZij]);
  naaf.position.z = -0.006; naaf.name = 'naaf';
  vlakGroep.add(naaf);
  // wielbouten (verzonken) en naafdop
  const zNaaf = -concaaf - 0.004;
  const boutMat = fys({ color: 0x2a2c30, metalness: 0.9, roughness: 0.35 });
  for (let i = 0; i < steek.n; i++) {
    const a = TAU * i / steek.n + Math.PI / 2, c = pol(boutR, a);
    const bout = new THREE.Mesh(new THREE.CylinderGeometry(gatR * 0.75, gatR * 0.75, 0.012, 6), boutMat);
    bout.rotation.x = Math.PI / 2; bout.position.set(c.x, c.y, zNaaf - 0.004); vlakGroep.add(bout);
  }
  const dopKleur = ontwerp.dopKleur || '#111214', dopTekst = ontwerp.dopTekst || '#f2f2f2';
  const dop = new THREE.Mesh(new THREE.CylinderGeometry(naafgatR * 0.98, naafgatR * 0.9, 0.006, 48), [
    fys({ color: 0x9a9ea3, metalness: 0.9, roughness: 0.3 }),
    fys({ map: dopTextuur(ontwerp.merk || 'AVD', dopKleur, dopTekst), roughness: 0.35, metalness: 0.2, clearcoat: 1 }),
    fys({ color: 0x111214 })
  ]);
  dop.rotation.x = Math.PI / 2; dop.position.z = zNaaf + 0.002; dop.name = 'naafdop';
  vlakGroep.add(dop);
  g.add(vlakGroep);

  /* ventiel */
  const ventiel = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.0045, 0.03, 12), fys({ color: 0x202226, metalness: 0.7, roughness: 0.4 }));
  const va = Math.PI / 2 + Math.PI / (ontwerp.spaken || 10);
  ventiel.position.set(Math.cos(va) * (R - 0.028), Math.sin(va) * (R - 0.028), 0.0);
  ventiel.rotation.x = Math.PI / 2; ventiel.rotation.z = va + Math.PI / 2; ventiel.rotation.order = 'ZXY';
  ventiel.rotation.set(Math.PI / 2 + 0.35, 0, va - Math.PI / 2, 'ZXY');
  g.add(ventiel);

  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.userData = { R, W, rLip, dik, concaaf };
  return g;
}

/* ---------------------------------------------------------------- *
 *  De band
 * ---------------------------------------------------------------- */
// band: { breedte (mm), profiel (%), inch }  → mesh met de velg op z=0 (voorkant velg) en de band eromheen
export function maakBand(band, velgBreedteJ) {
  const inch = band.inch, R = inch * INCH / 2, h = band.breedte * band.profiel / 100 / 1000;   // zijwandhoogte
  const Rb = R + h;                                   // buitenstraal
  const B = band.breedte / 1000;                      // sectiebreedte
  const W = (velgBreedteJ || 8) * INCH;
  const zMid = -W / 2;                                // de band staat gecentreerd op de velg
  // profiel (r, z) van hiel naar hiel over de buitenkant
  const pts = [];
  const push = (r, z) => pts.push(new THREE.Vector2(r, z));
  push(R + 0.004, zMid + W / 2 + 0.006);
  push(R + 0.012, zMid + W / 2 + 0.012);
  const stappen = 10;
  for (let i = 1; i <= stappen; i++) {                 // zijwand buiten: bolling
    const t = i / stappen, r = lerp(R + 0.012, Rb - 0.012, Math.sin(t * Math.PI / 2)), z = zMid + lerp(W / 2 + 0.012, B / 2 - 0.004, t) * (1 - 0.08 * Math.sin(t * Math.PI));
    push(r, z);
  }
  push(Rb - 0.004, zMid + B / 2 - 0.006);
  // loopvlak met vier groeven
  const loop = B * 0.84, groeven = [-0.3, -0.1, 0.1, 0.3];
  const nL = 60;
  for (let i = 0; i <= nL; i++) {
    const t = -0.5 + i / nL, z = zMid + t * loop;
    let r = Rb - 0.0012 * (t * t * 4);               // licht gewelfd loopvlak
    for (const gz of groeven) if (Math.abs(t - gz) < 0.028) r -= 0.0055 * (1 - Math.abs(t - gz) / 0.028 * 0.3);
    push(r, z);
  }
  push(Rb - 0.004, zMid - B / 2 + 0.006);
  for (let i = stappen; i >= 1; i--) {               // zijwand binnen
    const t = i / stappen, r = lerp(R + 0.012, Rb - 0.012, Math.sin(t * Math.PI / 2)), z = zMid - lerp(W / 2 + 0.012, B / 2 - 0.004, t);
    push(r, z);
  }
  push(R + 0.012, zMid - W / 2 - 0.012);
  push(R + 0.004, zMid - W / 2 - 0.006);
  const geo = new THREE.LatheGeometry(pts.reverse(), 160);
  const rubber = fys({ color: 0x141517, roughness: 0.78, metalness: 0.0, clearcoat: 0.15, clearcoatRoughness: 0.6 });
  const mesh = new THREE.Mesh(geo, rubber);
  mesh.rotation.x = Math.PI / 2;
  mesh.name = 'band';
  mesh.castShadow = true; mesh.receiveShadow = true;
  mesh.userData = { Rb, B };
  return mesh;
}

/* ---------------------------------------------------------------- *
 *  Rem (schijf + klauw) achter de spaken
 * ---------------------------------------------------------------- */
export function maakRem(R, opties) {
  const g = new THREE.Group(); g.name = 'rem';
  const rS = Math.min(R * 0.66, 0.175);
  const schijf = new THREE.Mesh(new THREE.CylinderGeometry(rS, rS, 0.026, 96), fys({ color: 0x5a5d62, metalness: 0.9, roughness: 0.55 }));
  if (opties.achterplaat !== false) {   // donkere wielkast achter het wiel
    const plaat = new THREE.Mesh(new THREE.CircleGeometry(R + 0.12, 64), new THREE.MeshStandardMaterial({ color: 0x0d0e10, roughness: 1 }));
    plaat.position.z = -0.16; g.add(plaat);
  }
  schijf.rotation.x = Math.PI / 2; schijf.position.z = -0.075; g.add(schijf);
  const hoed = new THREE.Mesh(new THREE.CylinderGeometry(rS * 0.5, rS * 0.5, 0.034, 48), fys({ color: 0x3b3d42, metalness: 0.7, roughness: 0.6 }));
  hoed.rotation.x = Math.PI / 2; hoed.position.z = -0.072; g.add(hoed);
  // klauw: sector over de schijfrand
  const a0 = opties.voor ? -0.35 : Math.PI + 0.35, span = 0.62;
  const kv = new THREE.Shape();
  kv.absarc(0, 0, rS + 0.014, a0 - span / 2, a0 + span / 2, false);
  kv.absarc(0, 0, rS - 0.05, a0 + span / 2, a0 - span / 2, true);
  kv.closePath();
  const klauwMat = fys({ color: opties.klauwKleur || 0x4a4d53, metalness: 0.35, roughness: 0.4, clearcoat: 0.8, clearcoatRoughness: 0.2 });
  const klauw = new THREE.Mesh(extrudeer([kv], 0.052, 0.003), klauwMat);
  klauw.position.z = -0.1; klauw.name = 'remklauw';
  g.add(klauw);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.userData.klauwMat = klauwMat;
  return g;
}

/* ---------------------------------------------------------------- *
 *  Volledig wiel: velg + band + rem, gecentreerd op de as
 * ---------------------------------------------------------------- */
export function maakWiel(ontwerp, opties) {
  const w = new THREE.Group(); w.name = 'wiel';
  const velg = maakVelg(ontwerp, opties);
  const band = opties.band ? maakBand(Object.assign({ inch: opties.inch }, opties.band), opties.breedteJ) : null;
  const rem = opties.rem === false ? null : maakRem(velg.userData.R, { voor: opties.voor !== false, klauwKleur: opties.klauwKleur });
  w.add(velg); if (band) w.add(band); if (rem) w.add(rem);
  // het hele wiel zo verschuiven dat het midden van de velgbreedte op z=0 ligt
  const W = velg.userData.W;
  w.children.forEach(c => { c.position.z += W / 2; });
  w.userData = { velg, band, rem, R: velg.userData.R, Rb: band ? band.userData.Rb : velg.userData.R + 0.1, W };
  return w;
}
