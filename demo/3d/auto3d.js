// Een Sketchfab-wagen laden en normaliseren: assen, schaal, wielen herkennen, lak vinden.
// Overgenomen uit de eerste 3D-pagina; zonder DOM, zodat de simulator het kan gebruiken.
import * as THREE from 'three';

/* -------- model laden en normaliseren -------- */
// bbox van alleen de zichtbare meshes (verborgen grondvlakken tellen niet mee)
function bbox(o) {
  const b = new THREE.Box3();
  o.updateMatrixWorld(true);
  o.traverse(m => { if (m.isMesh && m.visible && m.geometry) { if (!m.geometry.boundingBox) m.geometry.computeBoundingBox(); const bb = m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld); b.union(bb); } });
  if (b.isEmpty()) b.setFromObject(o);
  return b;
}

export async function laadAuto(loader, id, manifest, auto, pad, leesBand) {
  const m = manifest[id];
  if (!m) throw new Error('Voor deze wagen is nog geen 3D-model gekozen.');
  const gltf = await loader.loadAsync((pad || 'modellen/') + m.bestand);
  const root = gltf.scene;
  root.updateMatrixWorld(true);
  // Sketchfab-exports: "transparante" lak zonder doorzicht (x-ray-effect) en omgekeerde normalen (onzichtbare carrosserie)
  root.traverse(o => {
    if (!o.isMesh) return;
    const ms = Array.isArray(o.material) ? o.material : [o.material];
    for (const mt of ms) {
      if (!mt) continue;
      const glasNaam = GLASNAAM.test((mt.name || '') + ' ' + (o.name || ''));
      // carrosserie met "transmission" of lage opacity zonder glas-naam (bv. Kia Sportage): x-ray-effect → ondoorzichtig
      if (!glasNaam && (mt.transmission > 0 || (mt.transparent && mt.opacity < 0.95 && mt.opacity > 0.05 && isGroot(o)))) {
        mt.transmission = 0; mt.transparent = false; mt.opacity = 1; mt.depthWrite = true;
      }
      if (mt.transparent && mt.opacity >= 0.95 && !(mt.transmission > 0)) { mt.transparent = false; mt.depthWrite = true; mt.alphaTest = mt.map ? 0.5 : 0; }
      if (!mt.transparent) mt.side = THREE.DoubleSide;
      mt.needsUpdate = true;
    }
  });
  verbergVlakken(root);

  // 1. assen: langste horizontale maat = lengte → Z, kleinste = hoogte → Y
  const b0 = bbox(root), s0 = new THREE.Vector3(); b0.getSize(s0);
  const dims = [['x', s0.x], ['y', s0.y], ['z', s0.z]].sort((p, q) => q[1] - p[1]);
  const lengteAs = dims[0][0], hoogteAs = dims[2][0];
  // aparte groepen per draaiing, zodat elke stap om een wereld-as draait (Euler-volgorde speelt dan geen rol)
  const wrap = new THREE.Group();
  const tilt = new THREE.Group();     // hoogte-as naar Y
  const yaw = new THREE.Group();      // lengte langs Z, neus naar -Z
  const flip = new THREE.Group();     // op zijn kop → omdraaien
  tilt.add(root); yaw.add(tilt); flip.add(yaw); wrap.add(flip);
  if (hoogteAs === 'z') tilt.rotation.x = -Math.PI / 2;            // Z-up model
  else if (hoogteAs === 'x') tilt.rotation.z = Math.PI / 2;
  wrap.updateMatrixWorld(true);
  const b1 = bbox(tilt), s1 = new THREE.Vector3(); b1.getSize(s1);
  if (s1.x > s1.z) yaw.rotation.y = Math.PI / 2;                    // lengte langs Z
  wrap.updateMatrixWorld(true);
  // op zijn kop? een auto is onderaan (dorpels, wielen) breder dan bovenaan (dak)
  if (opZijnKop(yaw)) { flip.rotation.z = Math.PI; wrap.updateMatrixWorld(true); }
  // neus naar -Z: het uiteinde met de laagste bovenkant (motorkap) is de voorkant
  if (m.draai == null && voorkantAanPlusZ(flip)) yaw.rotation.y += Math.PI;
  if (m.draai) yaw.rotation.y += m.draai * Math.PI / 180;
  if (typeof localStorage !== 'undefined' && localStorage.getItem('avdv:draai:' + id) === '1') yaw.rotation.y += Math.PI;
  wrap.updateMatrixWorld(true);
  // 2. schaal op de echte lengte, wielen op de grond, midden op de oorsprong
  const b2 = bbox(flip), s2 = new THREE.Vector3(); b2.getSize(s2);
  const schaal = (auto.L / 1000) / s2.z;
  wrap.scale.setScalar(schaal);
  wrap.updateMatrixWorld(true);
  const b3 = bbox(wrap), c3 = new THREE.Vector3(); b3.getCenter(c3);
  wrap.position.set(-c3.x, -b3.min.y, -c3.z);
  wrap.updateMatrixWorld(true);

  // 3. wielen herkennen
  const wielen = herkenWielen(wrap, m, auto, leesBand);
  // 4. lak en glas
  const lakMats = vindLak(wrap, m, wielen);
  wrap.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
  return { groep: wrap, wielen, lakMats, L: auto.L / 1000, WB: auto.WB / 1000, manifest: m, maat: [s2.x, s2.y, s2.z].map(v => +(v * schaal).toFixed(2)) };
}

// Grondvlakken, schaduwplaten en achtergronden uit het model halen: grote, platte meshes
function verbergVlakken(root) {
  const tot = new THREE.Vector3(); bbox(root).getSize(tot);
  const max = Math.max(tot.x, tot.y, tot.z);
  root.traverse(o => {
    if (!o.isMesh) return;
    const s = new THREE.Vector3(); bbox(o).getSize(s);
    const dims = [s.x, s.y, s.z].sort((a, b) => a - b);
    if (dims[0] < dims[2] * 0.02 && dims[2] > max * 0.6) o.visible = false;
  });
}

function opZijnKop(obj) {
  const b = bbox(obj), H = b.max.y - b.min.y, cx = (b.min.x + b.max.x) / 2, v = new THREE.Vector3();
  let onder = 0, boven = 0, nOnder = 0, nBoven = 0;                 // gemiddelde |x| (t.o.v. het midden) onderaan en bovenaan
  obj.traverse(o => {
    if (!o.isMesh || !o.visible || !o.geometry.attributes.position) return;
    const p = o.geometry.attributes.position, stap = Math.max(1, Math.floor(p.count / 4000));
    for (let i = 0; i < p.count; i += stap) {
      v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld);
      const h = (v.y - b.min.y) / H;
      if (h < 0.2) { onder += Math.abs(v.x - cx); nOnder++; } else if (h > 0.8) { boven += Math.abs(v.x - cx); nBoven++; }
    }
  });
    return nOnder > 50 && nBoven > 50 && boven / nBoven > (onder / nOnder) * 1.15;
}

function voorkantAanPlusZ(obj) {
  const b = bbox(obj), L = b.max.z - b.min.z, H = b.max.y - b.min.y;
  let hMin = 0, hMax = 0;                  // hoogste punt in de laatste 12 % aan elk uiteinde
  const v = new THREE.Vector3();
  obj.traverse(o => {
    if (!o.isMesh || !o.geometry.attributes.position) return;
    const p = o.geometry.attributes.position, stap = Math.max(1, Math.floor(p.count / 4000));
    for (let i = 0; i < p.count; i += stap) {
      v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld);
      if (v.z < b.min.z + L * 0.12) hMin = Math.max(hMin, v.y - b.min.y);
      else if (v.z > b.max.z - L * 0.12) hMax = Math.max(hMax, v.y - b.min.y);
    }
  });
  return hMax < hMin;                      // +Z-kant lager → dat is de neus
}

const WIELNAAM =/wheel|rim|tire|tyre|felge|reifen|\brad\b|wiel|velg|llanta|rueda|roue|jante|disk|disc|колес|диск/i;
const GLASNAAM = /glass|glas|window|ruit|windshield|windscreen|vidro|vidrio|verre|scheibe|fenster|lamp|light|licht|lens|headl|taill|mirror|spiegel/i;
// een mesh die een flink deel van de wagen beslaat (carrosseriedeel, geen ruit of lampje)
function isGroot(o) { const s = new THREE.Vector3(); bbox(o).getSize(s); return Math.max(s.x, s.y, s.z) > 1.2; }
const BINNENNAAM = /rim|felge|velg|spoke|speich|cap|hub|nut|bolt|lug|disk|disc|brake|calip|rotor|логотип|logo|centre|center/i;

function herkenWielen(wrap, m, auto, leesBand) {
  const meshes = [];
  wrap.traverse(o => { if (o.isMesh && o.geometry) meshes.push(o); });
  let groepen = [];
  if (m.wielen) {
    // handmatig: nodenamen per wiel
    for (const [k, naam] of Object.entries(m.wielen)) {
      const node = wrap.getObjectByName(naam);
      if (!node) continue;
      const bb = bbox(node), c = new THREE.Vector3(), s = new THREE.Vector3(); bb.getCenter(c); bb.getSize(s);
      const leden = []; node.traverse(o => { if (o.isMesh) leden.push(o); });
      groepen.push({ center: c, tireR: Math.max(s.y, s.z) / 2, leden, node, links: k.endsWith('l'), voor: k.startsWith('f') });
    }
  } else {
    // automatisch: schijfvormige meshes opzij van de wagen, onderaan
    const kandidaten = [];
    const rBand = (leesBand(auto.band) || leesBand('225/45R17')).od / 2000;   // bandstraal volgens de wagenlijst
    const WB = auto.WB / 1000;
    for (const o of meshes) {
      const bb = bbox(o), s = new THREE.Vector3(), c = new THREE.Vector3(); bb.getSize(s); bb.getCenter(c);
      const d = Math.max(s.y, s.z), dun = s.x;
      if (d < 0.38 || d > 0.95) continue;                       // wieldiameter 38 tot 95 cm (ook losse velg of remschijf)
      if (Math.min(s.y, s.z) / d < 0.8) continue;               // rond in het zijvlak
      if (Math.abs(c.y - d / 2) > 0.12) continue;               // raakt de grond
      if (Math.abs(d / 2 - rBand) > 0.12) continue;             // straal past bij de band van deze wagen
      if (Math.abs(c.x) > 0.45 && dun <= d * 0.75) {            // één wiel, opzij van de wagen
        kandidaten.push({ o, c, d });
      } else if (Math.abs(c.x) < 0.2 && dun > 1.2) {            // linker- en rechterwiel in één mesh (as)
        for (const kant of [-1, 1]) kandidaten.push({ o, c: new THREE.Vector3(kant * (dun / 2 - 0.01), c.y, c.z), d, as: 1 });
      }
    }
    // alle vier de wielen in één mesh: hoogte = wieldiameter, breedte = spoor, lengte = wielbasis + wiel
    for (const o of meshes) {
      const bb = bbox(o), s = new THREE.Vector3(), c = new THREE.Vector3(); bb.getSize(s); bb.getCenter(c);
      if (Math.abs(s.y / 2 - rBand) > 0.12 || s.x < 1.2 || s.x > 2.1 || Math.abs(s.z - s.y - WB) > 0.3 || Math.abs(c.x) > 0.2 || Math.abs(c.y - s.y / 2) > 0.12) continue;
      for (const kx of [-1, 1]) for (const kz of [-1, 1]) kandidaten.push({ o, c: new THREE.Vector3(kx * (s.x / 2 - 0.01), c.y, c.z + kz * (s.z - s.y) / 2), d: s.y, as: 2 });
    }
    // clusteren op kant en lengtepositie
    for (const k of kandidaten) {
      let g = groepen.find(g => Math.sign(g.center.x) === Math.sign(k.c.x) && Math.abs(g.center.z - k.c.z) < 0.4);
      if (!g) { g = { center: k.c.clone(), tireR: k.d / 2, leden: [], links: k.c.x < 0, as: k.as || 0 }; groepen.push(g); }
      g.leden.push(k.o);
      if (k.d / 2 > g.tireR) { g.tireR = k.d / 2; g.center.copy(k.c); g.as = k.as || 0; }
    }
    groepen = kiesRechthoek(groepen, WB);
    if (groepen.length !== 4) groepen = wielenUitVertices(wrap, auto, rBand, WB);
    const zs = groepen.map(g => g.center.z), zmid = (Math.min(...zs) + Math.max(...zs)) / 2;
    groepen.forEach(g => { g.voor = g.center.z < zmid; });
  }
  // originele velg verbergen: alles in de wielgroep dat kleiner is dan de band of "binnenkant" heet
  const verberg = m.verbergen || null;
  for (const g of groepen) {
    for (const o of g.leden) {
      const bb = bbox(o), s = new THREE.Vector3(); bb.getSize(s);
      const d = Math.max(s.y, s.z);
      const naam = (o.name || '') + ' ' + (o.parent && o.parent !== g.node && o.parent.name || '');
      const weg = verberg ? verberg.some(v => (o.name || '').includes(v)) : (d < g.tireR * 2 * 0.93 || BINNENNAAM.test(naam));
      o.userData.velgdeel = weg;           // kleiner dan de band of 'binnenkant': de originele velg
      o.visible = false;                   // het nieuwe wiel (velg én band) vervangt het originele wiel volledig
    }
    // band blijft; als band en velg één mesh zijn, dekt onze schijf de velg af
  }
  // Opruimronde: elk los onderdeel dat (bijna) volledig binnen het wielvolume ligt, hoort bij het originele
  // wiel (velg, remschijf, remklauw, naafdop, wielbouten) en zou anders door onze spaken zichtbaar blijven.
  // Grote delen (wielkast, spatbord, carrosserie) blijven staan.
  if (!m.wielen) {
    for (const o of meshes) {
      if (!o.visible) continue;
      const bb = bbox(o), s = new THREE.Vector3(), c = new THREE.Vector3(); bb.getSize(s); bb.getCenter(c);
      const d = Math.max(s.y, s.z);
      if (Math.abs(c.x) < 0.35 || d > 1.0 || s.x > 0.6) continue;
      for (const g of groepen) {
        if (Math.sign(c.x) !== Math.sign(g.center.x)) continue;
        const binnen = Math.hypot(c.y - g.center.y, c.z - g.center.z) < g.tireR * 0.55 &&
          Math.abs(c.x - g.center.x) < 0.3 && d < g.tireR * 2 * 1.08;
        if (binnen) { o.visible = false; o.userData.velgdeel = true; g.leden.push(o); break; }
      }
    }
  }
  return groepen;
}

// Uit de gevonden wielgroepen de vier kiezen die samen een rechthoek vormen (twee assen, links en rechts even ver)
function kiesRechthoek(groepen, WB) {
  const L = groepen.filter(g => g.center.x < 0), R = groepen.filter(g => g.center.x > 0);
  let best = null, bestScore = Infinity;
  for (const l1 of L) for (const l2 of L) for (const r1 of R) for (const r2 of R) {
    if (l1 === l2 || r1 === r2) continue;
    if (l1.center.z > l2.center.z) continue;                                   // l1 vóór l2
    const wb = l2.center.z - l1.center.z;
    if (Math.abs(wb - WB) > 0.35) continue;                                    // wielbasis volgens de wagenlijst
    const score = Math.abs(r1.center.z - l1.center.z) + Math.abs(r2.center.z - l2.center.z) +
      Math.abs(Math.abs(l1.center.x) - Math.abs(r1.center.x)) + Math.abs(Math.abs(l2.center.x) - Math.abs(r2.center.x)) +
      Math.abs(l1.tireR - r1.tireR) * 4 + Math.abs(l2.tireR - r2.tireR) * 4 + Math.abs(l1.tireR - l2.tireR) * 2 +
      Math.abs(wb - WB) + (l1.as + l2.as + r1.as + r2.as) * 0.05;             // echte wielmeshes gaan voor
    if (score < 0.6 && score < bestScore) { bestScore = score; best = [l1, r1, l2, r2]; }
  }
  return best || [];
}

// Terugval als de wielen geen eigen meshes zijn: contactpunten van de banden op de grond → assen en spoor;
// klopt dat niet met de wielbasis, dan de maten uit de wagenlijst rond het midden van de wagen
function wielenUitVertices(wrap, auto, r, WB) {
  const b = bbox(wrap), pts = [], v = new THREE.Vector3();
  wrap.traverse(o => {
    if (!o.isMesh || !o.visible || !o.geometry.attributes.position) return;
    const p = o.geometry.attributes.position, stap = Math.max(1, Math.floor(p.count / 30000));
    for (let i = 0; i < p.count; i += stap) { v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld); if (v.y < b.min.y + 0.04 && Math.abs(v.x) > 0.45) pts.push([v.x, v.z]); }
  });
  let z1 = b.min.z + 0.8, z2 = b.max.z - 0.8, x = (b.max.x - b.min.x) / 2 - 0.09;
  if (pts.length >= 20) {
    for (let it = 0; it < 15; it++) {                                          // 1D k-means op de lengte-as
      const P = pts.filter(p => Math.abs(p[1] - z1) <= Math.abs(p[1] - z2)), Q = pts.filter(p => Math.abs(p[1] - z1) > Math.abs(p[1] - z2));
      if (P.length) z1 = P.reduce((s, p) => s + p[1], 0) / P.length;
      if (Q.length) z2 = Q.reduce((s, p) => s + p[1], 0) / Q.length;
    }
    const xs = pts.map(p => Math.abs(p[0])).sort((a, c) => c - a);
    const xv = xs[Math.floor(xs.length * 0.02)] - 0.02;
    const half = (b.max.x - b.min.x) / 2;
    x = (xv > half - 0.3 && xv < half - 0.04) ? xv : half - 0.16;               // spiegels steken ± 10 cm uit
  }
  if (Math.abs(z2 - z1 - WB) > 0.3) { const zc = (b.min.z + b.max.z) / 2 + 0.05; z1 = zc - WB / 2; z2 = zc + WB / 2; }
  const groepen = [];
  for (const z of [z1, z2]) for (const kant of [-1, 1]) groepen.push({ center: new THREE.Vector3(kant * x, r, z), tireR: r, leden: [], links: kant < 0, as: 0, geschat: true });
  return groepen;
}

function vindLak(wrap, m, wagenWielen) {
  const mats = new Map();
  wrap.traverse(o => {
    if (!o.isMesh || !o.visible) return;
    const lijst = Array.isArray(o.material) ? o.material : [o.material];
    for (const mat of lijst) {
      if (!mat) continue;
      const naam = (mat.name || '') + ' ' + (o.name || '');
      const bb = bbox(o), s = new THREE.Vector3(); bb.getSize(s);
      const opp = s.x * s.y + s.y * s.z + s.x * s.z;
      const e = mats.get(mat) || { mat, opp: 0, naam };
      e.opp += opp;
      mats.set(mat, e);
    }
  });
  const alles = [...mats.values()].filter(e => !/glass|glas|window|ruit|windshield|tire|tyre|reifen|rubber|chrome|cromado|espelho|mirror|freio|brake|rotor|disco|rim|wheel|light|lamp|interior|innen|seat|leather|plastic|black|trim|grill|steel|metal/i.test(e.naam) && !(e.mat.transparent && e.mat.opacity < 0.9));
  const naamHit = alles.filter(e => /body|paint|carpaint|lack|\blak\b|carro\b|exterior|karosserie|shell|kuzov|primary|color|colour|farbe|chassis|vehicle/i.test(e.naam));
  let gekozen = (m.carrosserie ? [...mats.values()].filter(e => e.naam.includes(m.carrosserie)) : null) || (naamHit.length ? naamHit : alles.sort((a, b) => b.opp - a.opp).slice(0, 1));
  // model met één materiaal voor alles (witte "klei"): elke carrosserie-mesh krijgt een eigen lakmateriaal, wielen niet
  if (!gekozen.length || mats.size <= 2) {
    const wielMeshes = new Set(); (wagenWielen || []).forEach(g => (g.leden || []).forEach(o => wielMeshes.add(o)));
    const rubber = new THREE.MeshStandardMaterial({ color: 0x141517, roughness: 0.85, side: THREE.DoubleSide });
    wielMeshes.forEach(o => { if (o.visible) o.material = rubber; });     // banden in klei-modellen donker
    const lak = new THREE.MeshPhysicalMaterial({ color: 0x8b8f92, metalness: 0.25, roughness: 0.38, clearcoat: 1, clearcoatRoughness: 0.08, side: THREE.DoubleSide });   // "klei"-model: standaard Nardo-grijs
    wrap.traverse(o => {
      if (!o.isMesh || !o.visible || wielMeshes.has(o)) return;
      const s = new THREE.Vector3(); bbox(o).getSize(s);
      if (Math.max(s.x, s.y, s.z) < 0.25) return;                     // kleine onderdelen (logo's, sensoren) laten staan
      const mt = Array.isArray(o.material) ? o.material[0] : o.material;
      if (mt && mt.transparent && mt.opacity < 0.9) return;           // glas
      o.material = lak;
    });
    gekozen = [{ mat: lak }];
  }
  return gekozen.map(e => { e.mat.userData.origKleur = e.mat.color.clone(); return e.mat; });
}


// Lak van de wagen zetten (kleur) of terug naar origineel (null)
export function zetLak(wagen, kleur) {
  if (!wagen) return;
  for (const mat of wagen.lakMats) {
    if (kleur) { mat.color.set(kleur); if (mat.map) { mat.userData.origMap = mat.userData.origMap || mat.map; mat.map = null; } mat.metalness = 0.25; mat.roughness = 0.38; if ('clearcoat' in mat) { mat.clearcoat = 1; mat.clearcoatRoughness = 0.08; } }
    else { mat.color.copy(mat.userData.origKleur); if (mat.userData.origMap) mat.map = mat.userData.origMap; }
    mat.needsUpdate = true;
  }
}
