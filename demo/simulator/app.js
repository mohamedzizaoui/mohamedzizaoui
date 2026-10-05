// Velgensimulator: echte 3D-velgen in de studio en op een echte wagen.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { maakWiel, AFWERKINGEN } from '../3d/velg3d.js';
import { VELGEN, KLAUWEN, LAKKEN } from '../3d/ontwerpen.js';
import { maakStudioOmgeving } from '../3d/studio.js';
import { laadAuto, zetLak } from '../3d/auto3d.js';

const A = window.AVDVelgOpAuto;
const AUTOS = A.autos;
const MANIFEST = (await (await fetch('../../tools/modellen.json')).json()).modellen;
const $ = (id) => document.getElementById(id);
const euro = (n) => n.toLocaleString('nl-BE', { style: 'currency', currency: 'EUR' });

/* -------- toestand uit de URL -------- */
const q = new URLSearchParams(location.search);
const st = {
  weergave: q.get('weergave') === 'auto' ? 'auto' : 'studio',
  autoId: q.get('auto') || localStorage.getItem('avdv:auto3d') || 'volkswagen-golf-8-2020',
  velgIdx: 0, inch: 0, afw: '', klauwIdx: 0, lakIdx: 0
};
if (!MANIFEST[st.autoId]) st.autoId = 'volkswagen-golf-8-2020';
const velgParam = (q.get('velg') || '').toLowerCase();
st.velgIdx = Math.max(0, VELGEN.findIndex(v => v.id === velgParam || (velgParam && (v.merk + ' ' + v.naam).toLowerCase().includes(velgParam))));
if (/^\d+$/.test(velgParam)) st.velgIdx = Math.min(VELGEN.length - 1, +velgParam);
const velg0 = VELGEN[st.velgIdx];
st.inch = velg0.maten.includes(+q.get('inch')) ? +q.get('inch') : velg0.maten.includes(19) ? 19 : velg0.maten[Math.floor(velg0.maten.length / 2)];
st.afw = velg0.keuzes.includes(q.get('afw')) ? q.get('afw') : velg0.afwerking;
st.klauwIdx = Math.min(KLAUWEN.length - 1, +(q.get('klauw') || 0));
st.lakIdx = Math.min(LAKKEN.length - 1, +(q.get('lak') || 0));

const autoMetId = (id) => AUTOS.find(a => a.id === id) || { id, merk: '', model: id, L: 4500, WB: 2650, H: 1400, band: '225/45R17', steek: '5x112', naafgat: 66.5 };
const velg = () => VELGEN[st.velgIdx];
const auto = () => autoMetId(st.autoId);
const bandVoorstel = () => { const orig = A.leesBand(auto().band) || A.leesBand('225/45R17'); return { orig, nieuw: A.bandVoorstel(orig, st.inch, velg().breedte) }; };

/* -------- renderer en scène -------- */
const canvas = $('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0x000000, 0);          // de achtergrond komt van de pagina (verloop)

const scene = new THREE.Scene();
scene.environment = maakStudioOmgeving(renderer);

const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 80);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI / 2 - 0.01;
controls.autoRotateSpeed = 0.7;
controls.addEventListener('start', () => zetDraaien(false));

const zon = new THREE.DirectionalLight(0xffffff, 1.5);
zon.position.set(3, 6, 2.5);
zon.castShadow = true;
zon.shadow.mapSize.set(2048, 2048);
zon.shadow.bias = -0.0004;
zon.shadow.normalBias = 0.01;
scene.add(zon);
scene.add(new THREE.HemisphereLight(0xffffff, 0xb9bec6, 0.35));

const studioGroep = new THREE.Group(), autoGroep = new THREE.Group();
scene.add(studioGroep, autoGroep);
// studio: zachte vloerschaduw
const studioVloer = new THREE.Mesh(new THREE.CircleGeometry(4, 64), new THREE.ShadowMaterial({ opacity: 0.32 }));
studioVloer.rotation.x = -Math.PI / 2; studioVloer.receiveShadow = true; studioGroep.add(studioVloer);
// wagen: grotere vloer met schaduw en lichte mist
const autoVloer = new THREE.Mesh(new THREE.CircleGeometry(30, 64), new THREE.ShadowMaterial({ opacity: 0.38 }));
autoVloer.rotation.x = -Math.PI / 2; autoVloer.receiveShadow = true; autoGroep.add(autoVloer);

const loader = new GLTFLoader()
  .setDRACOLoader(new DRACOLoader().setDecoderPath('../../vendor/three/addons/libs/draco/gltf/'))
  .setKTX2Loader(new KTX2Loader().setTranscoderPath('../../vendor/three/addons/libs/basis/').detectSupport(renderer))
  .setMeshoptDecoder(MeshoptDecoder);

let studioWiel = null;        // Group
let wagen = null;             // resultaat van laadAuto
let wagenWielen = [];         // containers per wiel
let laadNr = 0;

function ruimOp(obj) {
  obj.traverse(o => { if (o.isMesh) { o.geometry.dispose(); (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if (m && m.map && m.map.isCanvasTexture === false) m.map.dispose(); if (m) m.dispose(); }); } });
}

/* -------- wielen bouwen -------- */
function wielOpties(extra) {
  const v = velg(), b = bandVoorstel().nieuw;
  return Object.assign({ inch: st.inch, breedteJ: v.breedte, steek: v.steek, naafgat: v.naafgat, afwerking: st.afw, band: { breedte: b.b, profiel: b.p }, klauwKleur: KLAUWEN[st.klauwIdx][1] }, extra);
}

function bouwStudioWiel() {
  if (studioWiel) { studioGroep.remove(studioWiel); ruimOp(studioWiel); }
  studioWiel = maakWiel(velg().ontwerp, wielOpties({ voor: true, achterplaat: false }));
  studioWiel.position.y = studioWiel.userData.Rb;
  studioWiel.rotation.y = 0.0;
  studioGroep.add(studioWiel);
}

function bouwWagenWielen() {
  if (!wagen) return;
  for (const c of wagenWielen) { c.parent && c.parent.remove(c); ruimOp(c); }
  wagenWielen = [];
  for (const w of wagen.wielen) {
    // remklauw achter de as bij de voorwielen, ervoor bij de achterwielen; in wiel-coördinaten hangt dat af van de kant
    const naarAchter = w.links ? 0 : Math.PI;                     // lokale hoek die naar de achterkant van de wagen wijst
    const basis = w.voor ? naarAchter : naarAchter + Math.PI;
    const klauwHoek = basis + (Math.cos(basis) > 0 ? -0.35 : 0.35);
    const wiel = maakWiel(velg().ontwerp, wielOpties({ voor: w.voor, klauwHoek, achterplaat: true, plaatMarge: 0.05 }));
    const c = new THREE.Group();
    c.position.copy(w.center);
    c.rotation.y = w.links ? -Math.PI / 2 : Math.PI / 2;
    c.add(wiel);
    wagen.groep.parent.add(c);
    wagenWielen.push(c);
  }
}

/* -------- wagen laden -------- */
async function laadWagen(id) {
  const nr = ++laadNr;
  const laden = $('laden');
  laden.classList.add('aan');
  laden.innerHTML = `<div><div class="ring"></div>3D-model van ${auto().merk} ${auto().model.replace(/\s*\(.*/, '')} laden…<small>${MANIFEST[id] ? MANIFEST[id].titel : ''}</small></div>`;
  if (wagen) { autoGroep.remove(wagen.groep); for (const c of wagenWielen) autoGroep.remove(c); wagen = null; wagenWielen = []; }
  let res;
  try { res = await laadAuto(loader, id, MANIFEST, auto(), '../3d/modellen/', A.leesBand); }
  catch (e) {
    if (nr !== laadNr) return;
    laden.innerHTML = `<div><span class="fout">Het 3D-model van deze wagen kon niet geladen worden.</span><small>${e.message || e}</small></div>`;
    return;
  }
  if (nr !== laadNr) { ruimOp(res.groep); return; }
  wagen = res;
  autoGroep.add(wagen.groep);
  bouwWagenWielen();
  pasLakToe();
  localStorage.setItem('avdv:auto3d', id);
  laden.classList.remove('aan');
  const m = res.manifest;
  $('bron').innerHTML = `3D-model: <a href="${m.bron}" target="_blank" rel="noopener">${m.titel}</a>${m.auteur ? ' · ' + m.auteur : ''} · ${m.licentie || ''}${m.opmerking ? ' · ' + m.opmerking : ''}${res.wielen[0] && res.wielen[0].geschat ? ' · wielpositie geschat' : ''}`;
  zetHoek(huidigeHoek);
}

function pasLakToe() { if (wagen) zetLak(wagen, LAKKEN[st.lakIdx][1]); }

/* -------- camera -------- */
const HOEKEN = {
  studio: [['voor', 'Vooraanzicht'], ['schuin', 'Schuin'], ['detail', 'Detail']],
  auto: [['zij', 'Zijkant'], ['voor34', 'Driekwart voor'], ['achter34', 'Driekwart achter'], ['wiel', 'Wiel']]
};
let huidigeHoek = st.weergave === 'auto' ? 'zij' : 'schuin';
function zetHoek(h, zacht) {
  huidigeHoek = h;
  let p, doel;
  if (st.weergave === 'studio') {
    const Rb = studioWiel ? studioWiel.userData.Rb : 0.33;
    doel = new THREE.Vector3(0, Rb, 0);
    p = { voor: [0.05, Rb * 1.05, 2.0], schuin: [1.25, Rb * 1.6, 1.45], detail: [0.55, Rb * 1.35, 0.8] }[h] || [1.25, Rb * 1.6, 1.45];
  } else {
    const L = wagen ? wagen.L : 4.5, f = L / 4.5;
    doel = new THREE.Vector3(0, 0.55, 0);
    p = { zij: [7.6 * f, 1.0, 0.15], voor34: [5.4 * f, 1.6, -5.0 * f], achter34: [5.4 * f, 1.6, 5.3 * f], wiel: [3.0, 0.5, 0] }[h] || [7.6 * f, 1.0, 0.15];
    if (h === 'wiel' && wagen && wagen.wielen.length) {
      const w = wagen.wielen.find(w => !w.links && w.voor) || wagen.wielen[0];
      doel = w.center.clone(); p = [w.center.x + 2.3, w.center.y + 0.15, w.center.z - 0.6];
    }
  }
  controls.target.copy(doel);
  camera.position.set(...p);
  controls.update();
  zetDraaien(false);
  document.querySelectorAll('#hoeken [data-hoek]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.hoek === h)));
}
function zetDraaien(aan) {
  controls.autoRotate = aan;
  const b = $('draai'); if (b) b.setAttribute('aria-pressed', String(aan));
}
function vulHoeken() {
  $('hoeken').innerHTML = HOEKEN[st.weergave].map(([k, t]) => `<button type="button" data-hoek="${k}" aria-pressed="${k === huidigeHoek}">${t}</button>`).join('') + '<button type="button" id="draai" aria-pressed="false">Draaien</button>';
  document.querySelectorAll('#hoeken [data-hoek]').forEach(b => b.addEventListener('click', () => zetHoek(b.dataset.hoek)));
  $('draai').addEventListener('click', () => zetDraaien(!controls.autoRotate));
}

/* -------- weergave wisselen -------- */
function zetWeergave(w) {
  st.weergave = w;
  studioGroep.visible = w === 'studio';
  autoGroep.visible = w === 'auto';
  zon.shadow.camera.left = zon.shadow.camera.bottom = w === 'auto' ? -4.5 : -1;
  zon.shadow.camera.right = zon.shadow.camera.top = w === 'auto' ? 4.5 : 1;
  zon.shadow.camera.updateProjectionMatrix();
  controls.minDistance = w === 'auto' ? 1.6 : 0.5;
  controls.maxDistance = w === 'auto' ? 14 : 4;
  document.querySelectorAll('.segment [data-weergave]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.weergave === w)));
  $('stap-lak').style.display = w === 'auto' ? '' : 'none';
  $('laden').classList.toggle('aan', w === 'auto' && !wagen);
  $('bron').style.display = w === 'auto' ? '' : 'none';
  huidigeHoek = w === 'auto' ? (['zij', 'voor34', 'achter34', 'wiel'].includes(huidigeHoek) ? huidigeHoek : 'zij') : (['voor', 'schuin', 'detail'].includes(huidigeHoek) ? huidigeHoek : 'schuin');
  vulHoeken();
  zetHoek(huidigeHoek);
  if (w === 'auto' && !wagen) laadWagen(st.autoId);
  if (w === 'studio') zetDraaien(true);
  schrijfUrl();
}

/* -------- paneel -------- */
const merkEl = $('merk'), modelEl = $('model');
const merken = [...new Set(AUTOS.map(a => a.merk))].sort((a, b) => a.localeCompare(b, 'nl'));
merkEl.innerHTML = merken.map(m => `<option>${m}</option>`).join('');
function vulModellen() {
  modelEl.innerHTML = AUTOS.filter(a => a.merk === merkEl.value).map(a => `<option value="${a.id}"${MANIFEST[a.id] ? '' : ' disabled'}>${a.model}${MANIFEST[a.id] ? '' : ' (nog geen 3D-model)'}</option>`).join('');
}
function vulWagenFeit() {
  const a = auto();
  $('wagen-nu').textContent = `${a.merk} ${a.model.replace(/\s*\(.*/, '')}`;
  $('wagen-feit').innerHTML = `<span>Steek <b>${a.steek}</b></span><span>Naafgat <b>${a.naafgat} mm</b></span><span>Originele band <b>${a.band}</b></span>`;
}

function vulVelgen() {
  const a = auto();
  $('velgen').innerHTML = VELGEN.map((v, i) => {
    const past = v.steek === a.steek;
    return `<label class="velg"><input type="radio" name="velg" value="${i}"${i === st.velgIdx ? ' checked' : ''}><span class="kaart"><span class="past${past ? '' : ' niet'}">${past ? 'past' : v.steek}</span><img src="${v.foto}" alt=""><span class="merk">${v.merk}</span><span class="naam">${v.naam}</span><span class="prijs">${euro(v.prijs)} per velg</span></span></label>`;
  }).join('');
}
function vulMaten() {
  const v = velg();
  if (!v.maten.includes(st.inch)) st.inch = v.maten.includes(19) ? 19 : v.maten[Math.floor(v.maten.length / 2)];
  $('maten').innerHTML = v.maten.map(m => `<label class="pil"><input type="radio" name="inch" value="${m}"${m === st.inch ? ' checked' : ''}><span>${m}"</span></label>`).join('');
}
const stalenHtml = (naam, lijst, gekozen, kleurVan, titelVan) => lijst.map((l, i) => `<label class="staal" title="${titelVan(l)}"><input type="radio" name="${naam}" value="${i}"${i === gekozen ? ' checked' : ''}><span class="bol${kleurVan(l) ? '' : ' regenboog'}" style="${kleurVan(l) ? 'background:' + kleurVan(l) : ''}"></span><span class="sr">${titelVan(l)}</span></label>`).join('');
const AFW_KLEUR = { 'zwart-gepolijst': 'linear-gradient(135deg,#e6e8eb 0 48%,#0a0b0d 52%)', 'zwart-glans': '#0a0b0d', 'zwart-mat': '#2a2b2e', 'grafiet-gepolijst': 'linear-gradient(135deg,#e6e8eb 0 48%,#3b3f45 52%)', 'grafiet-glans': '#44484f', 'gunmetal': '#4b4f56', 'zilver': '#c3c6ca', 'hyperzilver': '#9ea2a8', 'brons': '#8a6b42', 'wit': '#f2f3f4', 'chroom': 'linear-gradient(135deg,#fff,#aab0b8 50%,#f4f6f8)' };
function vulAfwerkingen() {
  const v = velg();
  if (!v.keuzes.includes(st.afw)) st.afw = v.afwerking;
  $('afwerkingen').innerHTML = stalenHtml('afw', v.keuzes, v.keuzes.indexOf(st.afw), k => AFW_KLEUR[k] || '#888', k => AFWERKINGEN[k].naam);
  $('afw-nu').textContent = AFWERKINGEN[st.afw].naam;
}
function vulKlauwen() { $('klauwen').innerHTML = stalenHtml('klauw', KLAUWEN, st.klauwIdx, l => l[1], l => l[0]); $('klauw-nu').textContent = KLAUWEN[st.klauwIdx][0]; }
function vulLakken() { $('lakken').innerHTML = stalenHtml('lak', LAKKEN, st.lakIdx, l => l[1], l => l[0]); $('lak-nu').textContent = LAKKEN[st.lakIdx][0]; }

function vulSamenvatting() {
  const v = velg(), a = auto(), { orig, nieuw } = bandVoorstel();
  $('velg-nu').textContent = `${v.merk} ${v.naam}`;
  $('maat-nu').textContent = `${st.inch}" × ${v.breedte}J`;
  $('band-tekst').textContent = `Band bij deze maat: ${nieuw.txt} (origineel ${orig.txt}, ${nieuw.verschil >= 0 ? '+' : ''}${nieuw.verschil.toFixed(1)} % omtrek).`;
  $('s-velg').textContent = `${v.merk} ${v.naam} · ${AFWERKINGEN[st.afw].naam}`;
  $('s-maat').textContent = `${st.inch}" × ${v.breedte}J`;
  $('s-steek').textContent = `${v.steek} · ET${v.et} · ${v.naafgat} mm`;
  $('s-band').textContent = nieuw.txt;
  $('s-prijs').textContent = euro(v.prijs * 4);
  $('s-stuk').textContent = `${euro(v.prijs)} per velg`;
  const w = [];
  if (v.steek !== a.steek) w.push(`Deze velg heeft steek ${v.steek}; jouw ${a.merk} ${a.model.replace(/\s*\(.*/, '')} heeft ${a.steek}. Hij past niet zonder adapter.`);
  else if (v.naafgat < a.naafgat) w.push(`Naafgat ${v.naafgat} mm is kleiner dan de naaf van de wagen (${a.naafgat} mm).`);
  else if (v.naafgat > a.naafgat + 0.2) w.push(`Centreerring nodig: ${v.naafgat} → ${a.naafgat} mm.`);
  if (st.inch - orig.r >= 3) w.push(`${st.inch - orig.r} inch groter dan origineel: laat de vrije ruimte in de wielkast nakijken.`);
  if (Math.abs(nieuw.verschil) > 2.5) w.push(`De bandomtrek wijkt ${nieuw.verschil.toFixed(1)} % af; de snelheidsmeter kan afwijken.`);
  $('waarschuwing').textContent = w.join(' ');
}

function schrijfUrl() {
  const p = new URLSearchParams({ weergave: st.weergave, auto: st.autoId, velg: velg().id, inch: st.inch, afw: st.afw, klauw: st.klauwIdx, lak: st.lakIdx });
  history.replaceState(null, '', '?' + p);
}
function alles() { vulSamenvatting(); schrijfUrl(); }
function herbouw() { bouwStudioWiel(); bouwWagenWielen(); alles(); }

/* -------- gebeurtenissen -------- */
merkEl.addEventListener('change', () => { vulModellen(); st.autoId = modelEl.value; naWagenKeuze(); });
modelEl.addEventListener('change', () => { st.autoId = modelEl.value; naWagenKeuze(); });
function naWagenKeuze() {
  vulWagenFeit(); vulVelgen(); alles();
  if (st.weergave === 'auto') laadWagen(st.autoId); else { wagen && (autoGroep.remove(wagen.groep), wagenWielen.forEach(c => autoGroep.remove(c)), wagen = null, wagenWielen = []); }
}
document.addEventListener('change', (e) => {
  const t = e.target;
  if (t.name === 'velg') { st.velgIdx = +t.value; vulMaten(); vulAfwerkingen(); herbouw(); }
  if (t.name === 'inch') { st.inch = +t.value; herbouw(); }
  if (t.name === 'afw') { st.afw = velg().keuzes[+t.value]; $('afw-nu').textContent = AFWERKINGEN[st.afw].naam; herbouw(); }
  if (t.name === 'klauw') { st.klauwIdx = +t.value; $('klauw-nu').textContent = KLAUWEN[st.klauwIdx][0]; herbouw(); }
  if (t.name === 'lak') { st.lakIdx = +t.value; $('lak-nu').textContent = LAKKEN[st.lakIdx][0]; pasLakToe(); alles(); }
});
document.querySelectorAll('.segment [data-weergave]').forEach(b => b.addEventListener('click', () => zetWeergave(b.dataset.weergave)));
$('winkelwagen').addEventListener('click', () => {
  const v = velg();
  const cfg = window.AVD_VELG_OP_AUTO || {};
  if (typeof cfg.onInWinkelwagen === 'function') cfg.onInWinkelwagen({ naam: `${v.merk} ${v.naam} ${st.inch}"`, prijs: v.prijs, velg: v, inch: st.inch, afwerking: st.afw }, 4, auto());
  toast(`4 × ${v.merk} ${v.naam} ${st.inch}" toegevoegd · ${euro(v.prijs * 4)}`);
});
$('bewaar').addEventListener('click', () => {
  renderer.render(scene, camera);
  const a = document.createElement('a');
  a.href = renderer.domElement.toDataURL('image/png');
  a.download = `avd-${velg().id}-${st.inch}-${st.weergave === 'auto' ? st.autoId : 'studio'}.png`;
  a.click();
  toast('Afbeelding bewaard');
});
$('deel').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(location.href); toast('Link gekopieerd'); }
  catch { toast('Kopiëren lukte niet; kopieer de adresbalk.'); }
});
let toastTimer;
function toast(tekst) { const t = $('toast'); t.textContent = tekst; t.classList.add('aan'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('aan'), 2600); }

/* -------- maat en lus -------- */
function maat() {
  const r = canvas.parentElement.getBoundingClientRect();
  renderer.setSize(r.width, r.height, false);
  camera.aspect = r.width / r.height;
  camera.updateProjectionMatrix();
}
new ResizeObserver(maat).observe(canvas.parentElement);
maat();

/* -------- start -------- */
const a0 = auto();
merkEl.value = a0.merk; vulModellen(); modelEl.value = st.autoId;
vulWagenFeit(); vulVelgen(); vulMaten(); vulAfwerkingen(); vulKlauwen(); vulLakken();
bouwStudioWiel();
zetWeergave(st.weergave);
alles();
renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });

// voor controle vanuit tests
window.__sim = { st, scene, camera, renderer, controls, laadWagen, zetWeergave, zetHoek, wagen: () => wagen, studioWiel: () => studioWiel, klaar: () => !!(st.weergave === 'studio' ? studioWiel : wagen) };
