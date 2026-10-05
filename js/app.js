// ============================================================
//  AVD Velgen – 3D Velgen Simulator – scène en UI
// ============================================================
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { SHOP, DIAMETERS, WIDTHS, PROFILES, PCDS, DESIGNS, FINISHES, LIP_FINISHES, CALIPER_COLORS, BACKGROUNDS, CARS, CAR_COLORS, DEFAULT_STATE } from './config.js';
import { buildRim, buildTyre, buildBrake, tyreSize, drawDesignIcon } from './wheel.js';
import { loadCar, instantiateCar, wheelRotationY } from './car.js';

const $ = (sel) => document.querySelector(sel);
const byId = (list, id) => list.find((x) => x.id === id) || list[0];

// ---------- state ----------
const state = { ...DEFAULT_STATE, ...readHash() };

function readHash() {
  const out = {};
  const p = new URLSearchParams(location.hash.slice(1));
  for (const [k, v] of p) {
    if (!(k in DEFAULT_STATE)) continue;
    if (v === 'true' || v === 'false') out[k] = v === 'true';
    else if (v !== '' && !isNaN(Number(v)) && k !== 'pcd') out[k] = Number(v);
    else out[k] = v;
  }
  return out;
}
function writeHash() {
  const p = new URLSearchParams();
  for (const k of Object.keys(DEFAULT_STATE)) if (state[k] !== null && state[k] !== undefined) p.set(k, state[k]);
  try { history.replaceState(null, '', '#' + p.toString()); } catch { /* ingebed zonder history-toegang */ }
}

// ---------- renderer / scène ----------
const viewer = $('#viewer');
const canvas = $('#scene');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
} catch (e) {
  $('#nogl').hidden = false;
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 60);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.autoRotateSpeed = 1.2;
controls.enablePan = false;

const VIEWS = {
  wheel: { pos: [0.55, 0.18, 1.05], min: 0.55, max: 2.4, polar: Math.PI * 0.62 },
  car:   { pos: [4.6, 1.6, 4.2],    min: 2.4,  max: 13,  polar: Math.PI * 0.49 },
};
function applyView(resetCamera) {
  const v = VIEWS[state.mode] || VIEWS.wheel;
  controls.minDistance = v.min; controls.maxDistance = v.max; controls.maxPolarAngle = v.polar;
  if (resetCamera) camera.position.set(...v.pos);
}

const key = new THREE.DirectionalLight(0xffffff, 1.6);
key.position.set(3, 5, 4);
scene.add(key);
const rim = new THREE.DirectionalLight(0xdfe8ff, 0.8);
rim.position.set(-4, 2.5, -3);
scene.add(rim);
scene.add(new THREE.AmbientLight(0xffffff, 0.15));

// vloerschaduw (zachte radiale gradient)
const shadowTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d');
  const gr = x.createRadialGradient(128, 128, 10, 128, 128, 128);
  gr.addColorStop(0, 'rgba(0,0,0,0.55)'); gr.addColorStop(0.5, 'rgba(0,0,0,0.25)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
shadow.rotation.x = -Math.PI / 2;
shadow.position.y = 0.001;
scene.add(shadow);

// Alles wat per configuratie opnieuw wordt opgebouwd zit in deze ene groep.
// rebuild() leegt hem volledig, zodat er nooit oude of dubbele velgen achterblijven.
const root = new THREE.Group();
scene.add(root);

// ---------- materialen ----------
const mats = {};
function physical(f, extra = {}) {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(f.color), metalness: f.metalness, roughness: f.roughness,
    clearcoat: f.clearcoat ?? 0, clearcoatRoughness: 0.08, envMapIntensity: 1.0, ...extra,
  });
}
const POLISHED = { color: '#e6e8ea', metalness: 1.0, roughness: 0.10 };
const BLACK_LIP = { color: '#0b0b0d', metalness: 0.35, roughness: 0.20, clearcoat: 1 };

function capTexture(text) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#111'; x.beginPath(); x.arc(128, 128, 128, 0, Math.PI * 2); x.fill();
  x.strokeStyle = '#c8c8c8'; x.lineWidth = 6; x.beginPath(); x.arc(128, 128, 112, 0, Math.PI * 2); x.stroke();
  x.fillStyle = '#ffffff'; x.font = 'bold 92px Inter, Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(text, 128, 134);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
mats.cap = new THREE.MeshStandardMaterial({ map: capTexture(SHOP.capText), metalness: 0.4, roughness: 0.35 });
mats.nut = physical({ color: '#8f9398', metalness: 1, roughness: 0.35 });
mats.tyre = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.92, metalness: 0.0, side: THREE.DoubleSide });
mats.disc = physical({ color: '#6c6f73', metalness: 0.95, roughness: 0.45 });
mats.hat = physical({ color: '#2a2b2e', metalness: 0.8, roughness: 0.6 });
mats.caliper = physical({ color: '#c8102e', metalness: 0.2, roughness: 0.35, clearcoat: 0.8 });
// autolak, glas en details (zelfde opzet als het Three.js car-voorbeeld)
mats.body = new THREE.MeshPhysicalMaterial({ color: 0x7d8187, metalness: 0.9, roughness: 0.45, clearcoat: 1.0, clearcoatRoughness: 0.03 });
mats.glass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0.25, roughness: 0, transmission: 1.0, transparent: true });
mats.details = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1.0, roughness: 0.5 });
const texLoader = new THREE.TextureLoader();
const aoShadows = new Map();
function aoShadow(car) {
  if (!car.shadow) return null;
  if (!aoShadows.has(car.id)) {
    const tex = texLoader.load(car.shadow.file);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(car.shadow.w, car.shadow.h),
      new THREE.MeshBasicMaterial({ map: tex, blending: THREE.MultiplyBlending, toneMapped: false, transparent: true, premultipliedAlpha: true }));
    m.rotation.x = -Math.PI / 2; m.renderOrder = 2; m.position.y = 0.002;
    aoShadows.set(car.id, m);
  }
  return aoShadows.get(car.id);
}

// ---------- opbouw ----------
let perBuild = [];   // geometrieën en materialen van de vorige opbouw
let buildToken = 0;  // voorkomt dat een laat geladen model alsnog wordt toegevoegd
let cameraNeedsReset = true;
function track(obj) {
  obj.traverse((o) => {
    if (o.geometry) perBuild.push(o.geometry);
    const ms = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of ms) if (m && !Object.values(mats).includes(m)) perBuild.push(m);
  });
  return obj;
}

function rebuild() {
  for (const r of perBuild) r.dispose();
  perBuild = [];
  root.clear();
  buildToken++;
  $('#loading').hidden = true;

  const design = byId(DESIGNS, state.design);
  const finish = byId(FINISHES, state.finish);
  const concave = state.concave ?? design.concave;

  const base = physical(finish, { side: THREE.DoubleSide });
  let lipMat = base, faceMat = base;
  if (state.lip === 'polished') lipMat = physical(POLISHED, { side: THREE.DoubleSide });
  if (state.lip === 'black') lipMat = physical(BLACK_LIP, { side: THREE.DoubleSide });
  if (state.lip === 'diamond') { lipMat = physical(POLISHED, { side: THREE.DoubleSide }); faceMat = physical(POLISHED); }

  // één prototype-wiel; in automodus worden er vier klonen van geplaatst
  const proto = new THREE.Group();
  const rimGroup = buildRim({
    diameter: state.diameter, width: state.width, design, concave,
    faceMat, sideMat: base, lipMat, hubMat: base, capMat: mats.cap, nutMat: mats.nut,
  });
  proto.add(rimGroup);
  mats.caliper.color.set(byId(CALIPER_COLORS, state.caliper).color);
  proto.add(buildBrake({ hubFront: rimGroup.userData.hubFront, discMat: mats.disc, caliperMat: mats.caliper, hatMat: mats.hat }));
  let wheelR = rimGroup.userData.R + 0.015;
  if (state.tyre) {
    const tyre = buildTyre({ diameter: state.diameter, width: state.width, profile: state.profile, mat: mats.tyre });
    proto.add(tyre);
    wheelR = tyre.userData.Ro;
  }
  track(proto);
  const W = rimGroup.userData.W;

  if (state.mode === 'car') {
    const car = byId(CARS, state.car);
    mats.body.color.set(byId(CAR_COLORS, state.carColor).color);
    const token = ++buildToken;
    $('#loading').hidden = false;
    loadCar(car).then((loaded) => {
      if (token !== buildToken) return;          // intussen is er een nieuwe configuratie
      $('#loading').hidden = true;
      const inst = instantiateCar(car, loaded, { bodyMat: mats.body, glassMat: mats.glass, detailsMat: mats.details });
      const lift = wheelR - inst.r0;             // auto rust op onze wielen
      inst.group.position.y = lift;
      root.add(inst.group);
      const minWidth = Math.min(...inst.wheels.map((w) => w.width));
      // exact één velg per wielknooppunt, voorkant naar buiten
      for (const w of inst.wheels) {
        const m = proto.clone();
        const axle = car.axle || 'x';
        const p = w.pos.clone();
        p[axle] += w.side * (minWidth / 2 - 0.015);
        m.position.set(p.x, p.y + lift, p.z);
        m.rotation.y = wheelRotationY(car, w.side);
        root.add(m);
      }
      const ao = aoShadow(car);
      if (ao) { root.add(ao); shadow.visible = false; }
      else { shadow.visible = true; shadow.scale.set(inst.length * 1.25, inst.length * 0.9, 1); }
      controls.target.set(0, inst.height * 0.4 + lift, 0);
      VIEWS.car.pos = [inst.length * 0.95, inst.height * 1.1, inst.length * 0.85];
      if (cameraNeedsReset) { applyView(true); cameraNeedsReset = false; }
    }).catch((e) => { console.error(e); $('#loading').textContent = 'Model kon niet geladen worden'; });
  } else {
    proto.position.set(0, wheelR, W / 2);
    root.add(proto);
    shadow.visible = true;
    shadow.scale.set(wheelR * 3.2, wheelR * 2.2, 1);
    controls.target.set(0, wheelR * 0.95, 0);
  }

  updateSummary();
  writeHash();
}

// ---------- UI ----------
function chip(label, active, onClick, extra = '') {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'chip' + (active ? ' active' : '');
  b.innerHTML = extra + `<span>${label}</span>`;
  b.addEventListener('click', onClick);
  return b;
}

function renderDesigns() {
  const host = $('#designs'); host.innerHTML = '';
  for (const d of DESIGNS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'design' + (d.id === state.design ? ' active' : '');
    b.title = d.sub;
    const c = document.createElement('canvas'); c.width = c.height = 96;
    drawDesignIcon(c, d);
    b.appendChild(c);
    const s = document.createElement('span'); s.textContent = d.name; b.appendChild(s);
    const sub = document.createElement('small'); sub.textContent = d.sub; b.appendChild(sub);
    b.addEventListener('click', () => { state.design = d.id; state.concave = null; syncConcave(); rebuild(); renderDesigns(); });
    host.appendChild(b);
  }
}

function renderSelect(sel, values, current, fmt, onChange, numeric = true) {
  const el = $(sel); el.innerHTML = '';
  for (const v of values) {
    const o = document.createElement('option'); o.value = v; o.textContent = fmt(v); if (v === current) o.selected = true; el.appendChild(o);
  }
  el.onchange = () => onChange(numeric ? Number(el.value) : el.value);
}

function renderSwatches(sel, list, current, onPick, key = 'color') {
  const host = $(sel); host.innerHTML = '';
  for (const f of list) {
    const sw = f[key] ? `<i class="sw" style="--c:${f[key]}"></i>` : '';
    host.appendChild(chip(f.name, f.id === current, () => { onPick(f.id); renderSwatches(sel, list, f.id, onPick, key); }, sw));
  }
}

function renderMode() {
  for (const b of document.querySelectorAll('#modes .seg')) b.classList.toggle('active', b.dataset.mode === state.mode);
  $('#carGroup').hidden = state.mode !== 'car';
}

function syncConcave() {
  const design = byId(DESIGNS, state.design);
  const v = state.concave ?? design.concave;
  $('#concave').value = Math.round(v * 1000);
  $('#concaveVal').textContent = Math.round(v * 1000) + ' mm';
}

function renderAll() {
  renderMode();
  renderDesigns();
  renderSelect('#diameter', DIAMETERS, state.diameter, (v) => `${v}"`, (v) => { state.diameter = v; rebuild(); });
  renderSelect('#width', WIDTHS, state.width, (v) => `${v.toFixed(1)}J`, (v) => { state.width = v; rebuild(); });
  renderSelect('#pcd', PCDS, state.pcd, (v) => v, (v) => { state.pcd = v; updateSummary(); writeHash(); }, false);
  renderSelect('#profile', PROFILES, state.profile, (v) => `${v}`, (v) => { state.profile = v; rebuild(); });
  renderSwatches('#finishes', FINISHES, state.finish, (id) => { state.finish = id; rebuild(); });
  renderSwatches('#lips', LIP_FINISHES, state.lip, (id) => { state.lip = id; rebuild(); });
  renderSwatches('#calipers', CALIPER_COLORS, state.caliper, (id) => { state.caliper = id; rebuild(); });
  renderSwatches('#cars', CARS, state.car, (id) => { state.car = id; cameraNeedsReset = true; rebuild(); });
  renderSwatches('#carColors', CAR_COLORS, state.carColor, (id) => { state.carColor = id; rebuild(); });
  renderSwatches('#bgs', BACKGROUNDS, state.bg, (id) => { state.bg = id; applyBg(); writeHash(); });
  $('#tyre').checked = state.tyre;
  $('#rotate').checked = state.rotate;
  syncConcave();
  applyBg();
  applyView(true);
}

for (const b of document.querySelectorAll('#modes .seg')) {
  b.addEventListener('click', () => { state.mode = b.dataset.mode; renderMode(); cameraNeedsReset = true; applyView(state.mode === 'wheel'); rebuild(); });
}
$('#tyre').addEventListener('change', (e) => { state.tyre = e.target.checked; rebuild(); });
$('#rotate').addEventListener('change', (e) => { state.rotate = e.target.checked; writeHash(); });
$('#concave').addEventListener('input', (e) => { state.concave = Number(e.target.value) / 1000; syncConcave(); });
$('#concave').addEventListener('change', () => rebuild());
$('#reset').addEventListener('click', () => { Object.assign(state, DEFAULT_STATE); cameraNeedsReset = true; renderAll(); rebuild(); });
$('#resetView').addEventListener('click', () => applyView(true));

function applyBg() {
  document.body.dataset.bg = state.bg;
  renderer.toneMappingExposure = state.bg === 'light' ? 1.15 : 1.05;
  shadow.material.opacity = state.bg === 'light' ? 0.9 : 0.6;
}

function finishCode() {
  const f = byId(FINISHES, state.finish), l = byId(LIP_FINISHES, state.lip);
  return f.code + l.code;
}

function summaryText() {
  const d = byId(DESIGNS, state.design), f = byId(FINISHES, state.finish), l = byId(LIP_FINISHES, state.lip), c = byId(CALIPER_COLORS, state.caliper);
  const ts = tyreSize(state.width, state.profile, state.diameter);
  const concave = Math.round((state.concave ?? d.concave) * 1000);
  const lines = [
    `Velg: ${SHOP.brand} ${d.name} (${d.sub})`,
    `Maat: ${state.diameter}" x ${state.width.toFixed(1)}J – steekmaat ${state.pcd}`,
    `Afwerking: ${f.name} ${l.code ? '– ' + l.name : ''} (${finishCode()})`,
    `Concaaf: ${concave} mm`,
    `Band: ${state.tyre ? ts.label : 'geen band'}`,
    `Remklauw: ${c.name}`,
  ];
  if (state.mode === 'car') lines.push(`Getoond op: ${byId(CARS, state.car).name}, ${byId(CAR_COLORS, state.carColor).name}`);
  return lines;
}

function updateSummary() {
  const d = byId(DESIGNS, state.design), f = byId(FINISHES, state.finish), l = byId(LIP_FINISHES, state.lip);
  const ts = tyreSize(state.width, state.profile, state.diameter);
  $('#sumTitle').textContent = `${SHOP.brand} ${d.name} · ${state.diameter}" x ${state.width.toFixed(1)}J · ${state.pcd}`;
  $('#sumFinish').textContent = `${f.name}${l.code ? ' · ' + l.name : ''} · code ${finishCode()}`;
  $('#sumTyre').textContent = state.tyre ? `Aanbevolen bandmaat: ${ts.label}` : 'Zonder band';
}

// acties
$('#quote').addEventListener('click', () => {
  const body = [
    `Beste ${SHOP.fullName},`, '',
    'Ik wil graag een offerte voor de volgende velgconfiguratie:', '',
    ...summaryText(), '',
    `Link naar configuratie: ${location.href}`, '',
    'Mijn wagen (merk / model / bouwjaar): ', 'Mijn naam en telefoonnummer: ', '',
    'Met vriendelijke groeten',
  ].join('\n');
  const subject = `Offerte velgen – ${SHOP.brand} ${byId(DESIGNS, state.design).name} ${state.diameter}"`;
  $('#quoteText').value = `Aan: ${SHOP.email}\nOnderwerp: ${subject}\n\n${body}`;
  $('#quoteBox').hidden = false;
  location.href = `mailto:${SHOP.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});
$('#copyQuote').addEventListener('click', () => copyText($('#quoteText').value, 'Offertetekst gekopieerd'));
$('#closeQuote').addEventListener('click', () => { $('#quoteBox').hidden = true; });

$('#share').addEventListener('click', async () => {
  const url = location.href;
  try {
    if (navigator.share) { await navigator.share({ title: `${SHOP.name} – mijn velg`, url }); return; }
  } catch { /* geannuleerd */ }
  copyText(url, 'Link gekopieerd');
});

async function copyText(text, msg) {
  try { await navigator.clipboard.writeText(text); toast(msg); }
  catch {
    const ta = $('#quoteText'); ta.hidden = false; ta.value = text; ta.focus(); ta.select();
    toast('Selecteer en kopieer de tekst');
  }
}

$('#download').addEventListener('click', () => {
  renderer.render(scene, camera);
  const a = document.createElement('a');
  a.download = `avd-velgen-${state.design}-${state.diameter}inch.png`;
  a.href = renderer.domElement.toDataURL('image/png');
  a.click();
});

$('#togglePanel').addEventListener('click', () => document.body.classList.toggle('panel-collapsed'));

let toastTimer;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
}

// ---------- resize / loop ----------
function resize() {
  const w = viewer.clientWidth, h = viewer.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(viewer);
resize();

const clock = new THREE.Clock();
function loop() {
  requestAnimationFrame(loop);
  const dt = clock.getDelta();
  controls.autoRotate = state.rotate;
  controls.update();
  if (state.rotate && state.mode === 'wheel' && root.children[0]) root.children[0].rotation.z -= dt * 0.35;
  renderer.render(scene, camera);
}

// contact & branding
$('#shopName').textContent = SHOP.name;
$('#shopLink').href = SHOP.url;
$('#cName').textContent = SHOP.fullName;
$('#cAddress').textContent = SHOP.address;
$('#cPhone').textContent = SHOP.phone + (SHOP.mobile ? ' · ' + SHOP.mobile : '');
$('#cEmail').textContent = SHOP.email;
$('#cHours').textContent = SHOP.hours;
$('#brandNote').textContent = `Designs geïnspireerd op de ${SHOP.brand}-collectie`;
$('#carCredit').textContent = CARS.map((c) => c.credit).join(' · ');

renderAll();
rebuild();
loop();
window.__avdSim = { state, rebuild, renderer, scene, camera, controls, root };
