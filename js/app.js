// ============================================================
//  AVD Velgen – 3D Velgen Simulator – scène en UI
// ============================================================
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { SHOP, DIAMETERS, WIDTHS, PROFILES, DESIGNS, FINISHES, LIP_FINISHES, CALIPER_COLORS, BACKGROUNDS, DEFAULT_STATE } from './config.js';
import { buildRim, buildTyre, buildBrake, tyreSize, drawDesignIcon } from './wheel.js';

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
    else if (v !== '' && !isNaN(Number(v))) out[k] = Number(v);
    else out[k] = v;
  }
  return out;
}
function writeHash() {
  const p = new URLSearchParams();
  for (const k of Object.keys(DEFAULT_STATE)) if (state[k] !== null && state[k] !== undefined) p.set(k, state[k]);
  history.replaceState(null, '', '#' + p.toString());
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

const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 20);
camera.position.set(0.55, 0.18, 1.05);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 0.55;
controls.maxDistance = 2.4;
controls.maxPolarAngle = Math.PI * 0.62;
controls.autoRotateSpeed = 1.2;
controls.enablePan = false;

const key = new THREE.DirectionalLight(0xffffff, 1.6);
key.position.set(1.5, 2.2, 2.0);
scene.add(key);
const rim = new THREE.DirectionalLight(0xdfe8ff, 0.8);
rim.position.set(-2, 1, -1.5);
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
scene.add(shadow);

const wheel = new THREE.Group();
scene.add(wheel);

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

// ---------- opbouw ----------
let rimGroup, tyreMesh, brakeGroup;

function rebuild() {
  for (const m of [rimGroup, tyreMesh, brakeGroup]) {
    if (!m) continue;
    m.traverse((o) => o.geometry && o.geometry.dispose());
    wheel.remove(m);
  }
  const design = byId(DESIGNS, state.design);
  const finish = byId(FINISHES, state.finish);
  const concave = state.concave ?? design.concave;

  const base = physical(finish, { side: THREE.DoubleSide });
  let lipMat = base, faceMat = base;
  if (state.lip === 'polished') lipMat = physical(POLISHED, { side: THREE.DoubleSide });
  if (state.lip === 'black') lipMat = physical(BLACK_LIP, { side: THREE.DoubleSide });
  if (state.lip === 'diamond') { lipMat = physical(POLISHED, { side: THREE.DoubleSide }); faceMat = physical(POLISHED); }
  if (state.lip === 'same' && finish.id === 'chrome') lipMat = physical(finish, { side: THREE.DoubleSide });

  rimGroup = buildRim({
    diameter: state.diameter, width: state.width, design, concave,
    faceMat, sideMat: base, lipMat, hubMat: base, capMat: mats.cap, nutMat: mats.nut,
  });
  wheel.add(rimGroup);

  mats.caliper.color.set(byId(CALIPER_COLORS, state.caliper).color);
  brakeGroup = buildBrake({ hubFront: rimGroup.userData.hubFront, discMat: mats.disc, caliperMat: mats.caliper, hatMat: mats.hat });
  wheel.add(brakeGroup);

  let floorR = rimGroup.userData.R + 0.015;
  tyreMesh = null;
  if (state.tyre) {
    tyreMesh = buildTyre({ diameter: state.diameter, width: state.width, profile: state.profile, mat: mats.tyre });
    wheel.add(tyreMesh);
    floorR = tyreMesh.userData.Ro;
  }
  // wiel op de vloer, gecentreerd op zijn breedte
  const W = rimGroup.userData.W;
  wheel.position.set(0, floorR, W / 2);
  shadow.position.set(0, 0.001, 0);
  shadow.scale.set(floorR * 3.2, floorR * 2.2, 1);
  controls.target.set(0, floorR * 0.95, 0);

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
    const c = document.createElement('canvas'); c.width = c.height = 96;
    drawDesignIcon(c, d);
    b.appendChild(c);
    const s = document.createElement('span'); s.textContent = d.name; b.appendChild(s);
    b.addEventListener('click', () => { state.design = d.id; state.concave = null; syncConcave(); rebuild(); renderDesigns(); });
    host.appendChild(b);
  }
}

function renderSelect(sel, values, current, fmt, onChange) {
  const el = $(sel); el.innerHTML = '';
  for (const v of values) {
    const o = document.createElement('option'); o.value = v; o.textContent = fmt(v); if (v === current) o.selected = true; el.appendChild(o);
  }
  el.onchange = () => onChange(Number(el.value));
}

function renderSwatches(sel, list, current, onPick, key = 'color') {
  const host = $(sel); host.innerHTML = '';
  for (const f of list) {
    const sw = f[key] ? `<i class="sw" style="--c:${f[key]}"></i>` : '';
    host.appendChild(chip(f.name, f.id === current, () => { onPick(f.id); renderSwatches(sel, list, f.id, onPick, key); }, sw));
  }
}

function syncConcave() {
  const design = byId(DESIGNS, state.design);
  const v = state.concave ?? design.concave;
  $('#concave').value = Math.round(v * 1000);
  $('#concaveVal').textContent = Math.round(v * 1000) + ' mm';
}

function renderAll() {
  renderDesigns();
  renderSelect('#diameter', DIAMETERS, state.diameter, (v) => `${v}"`, (v) => { state.diameter = v; rebuild(); });
  renderSelect('#width', WIDTHS, state.width, (v) => `${v.toFixed(1)}J`, (v) => { state.width = v; rebuild(); });
  renderSelect('#profile', PROFILES, state.profile, (v) => `${v}`, (v) => { state.profile = v; rebuild(); });
  renderSwatches('#finishes', FINISHES, state.finish, (id) => { state.finish = id; rebuild(); });
  renderSwatches('#lips', LIP_FINISHES, state.lip, (id) => { state.lip = id; rebuild(); });
  renderSwatches('#calipers', CALIPER_COLORS, state.caliper, (id) => { state.caliper = id; rebuild(); });
  renderSwatches('#bgs', BACKGROUNDS, state.bg, (id) => { state.bg = id; applyBg(); writeHash(); });
  $('#tyre').checked = state.tyre;
  $('#rotate').checked = state.rotate;
  syncConcave();
  applyBg();
}

$('#tyre').addEventListener('change', (e) => { state.tyre = e.target.checked; rebuild(); });
$('#rotate').addEventListener('change', (e) => { state.rotate = e.target.checked; writeHash(); });
$('#concave').addEventListener('input', (e) => { state.concave = Number(e.target.value) / 1000; syncConcave(); });
$('#concave').addEventListener('change', () => rebuild());
$('#reset').addEventListener('click', () => { Object.assign(state, DEFAULT_STATE); camera.position.set(0.55, 0.18, 1.05); renderAll(); rebuild(); });
$('#resetView').addEventListener('click', () => { camera.position.set(0.55, 0.18, 1.05); });

function applyBg() {
  document.body.dataset.bg = state.bg;
  renderer.toneMappingExposure = state.bg === 'light' ? 1.15 : 1.05;
  shadow.material.opacity = state.bg === 'light' ? 0.9 : 0.6;
}

function summaryText() {
  const d = byId(DESIGNS, state.design), f = byId(FINISHES, state.finish), l = byId(LIP_FINISHES, state.lip), c = byId(CALIPER_COLORS, state.caliper);
  const ts = tyreSize(state.width, state.profile, state.diameter);
  const concave = Math.round((state.concave ?? d.concave) * 1000);
  return [
    `Design: ${d.name}`,
    `Maat: ${state.diameter}" x ${state.width.toFixed(1)}J`,
    `Afwerking: ${f.name} – ${l.name}`,
    `Concaaf: ${concave} mm`,
    `Band: ${state.tyre ? ts.label : 'geen band'}`,
    `Remklauw: ${c.name}`,
  ];
}

function updateSummary() {
  const d = byId(DESIGNS, state.design), f = byId(FINISHES, state.finish), l = byId(LIP_FINISHES, state.lip);
  const ts = tyreSize(state.width, state.profile, state.diameter);
  $('#sumTitle').textContent = `${d.name} · ${state.diameter}" x ${state.width.toFixed(1)}J`;
  $('#sumFinish').textContent = `${f.name} · ${l.name}`;
  $('#sumTyre').textContent = state.tyre ? `Aanbevolen bandmaat: ${ts.label}` : 'Zonder band';
}

// acties
$('#quote').addEventListener('click', () => {
  const body = [
    'Beste AVD Velgen,', '',
    'Ik wil graag een offerte voor de volgende velgconfiguratie:', '',
    ...summaryText(), '',
    `Link naar configuratie: ${location.href}`, '',
    'Mijn wagen (merk / model / bouwjaar): ', 'Mijn naam en telefoonnummer: ', '',
    'Met vriendelijke groeten',
  ].join('\n');
  location.href = `mailto:${SHOP.email}?subject=${encodeURIComponent('Offerte velgen – ' + summaryText()[0].replace('Design: ', ''))}&body=${encodeURIComponent(body)}`;
});

$('#share').addEventListener('click', async () => {
  const url = location.href;
  try {
    if (navigator.share) { await navigator.share({ title: `${SHOP.name} – mijn velg`, url }); return; }
    await navigator.clipboard.writeText(url);
    toast('Link gekopieerd');
  } catch { prompt('Kopieer deze link:', url); }
});

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
  if (state.rotate) wheel.rotation.z -= dt * 0.35;   // wiel draait zachtjes om zijn as
  renderer.render(scene, camera);
}

$('#shopName').textContent = SHOP.name;
$('#shopLink').href = SHOP.url;
renderAll();
rebuild();
loop();
window.__avdSim = { state, rebuild, renderer, scene, camera, controls };
