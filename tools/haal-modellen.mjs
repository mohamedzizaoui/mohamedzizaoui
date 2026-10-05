// Zet de Sketchfab-modellen uit tools/modellen.json om naar één compacte Draco-glb per wagen in demo/3d/modellen/.
//
// Twee manieren om aan de modellen te komen:
//
//  A. Handmatig (geen API nodig): log in op sketchfab.com, open per wagen de link uit
//        node tools/haal-modellen.mjs --lijst
//     klik "Download 3D model" → glTF, en zet de zip in tools/download/ (de naam maakt niet uit,
//     het script herkent het model aan de bron-URL in het archief). Daarna:
//        node tools/haal-modellen.mjs
//
//  B. Met API-token (als je account er een heeft onder Settings → Password & API):
//     zet het in tools/sketchfab-token.txt of in $env:SKETCHFAB_TOKEN; het script haalt dan zelf op.
//
//  node tools/haal-modellen.mjs golf tiguan   alleen wagens waarvan het id die woorden bevat
//  node tools/haal-modellen.mjs --opnieuw     bestaande glb's overschrijven
//
// Vereist node 18+; gltf-transform wordt via npx opgehaald (@gltf-transform/cli 4).

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const map = fileURLToPath(new URL('.', import.meta.url));
const wortel = path.resolve(map, '..');
const uit = path.join(wortel, 'demo', '3d', 'modellen');
const werk = path.join(map, 'download');
const manifest = JSON.parse(fs.readFileSync(path.join(map, 'modellen.json'), 'utf8'));

const args = process.argv.slice(2);
const opnieuw = args.includes('--opnieuw');
const filters = args.filter(a => !a.startsWith('--'));
fs.mkdirSync(uit, { recursive: true });
fs.mkdirSync(werk, { recursive: true });

const items = Object.entries(manifest.modellen).filter(([id, m]) => m.sketchfab && (!filters.length || filters.some(f => id.includes(f))));

if (args.includes('--lijst')) {
  console.log('Open elke link, klik "Download 3D model" → glTF en bewaar de zip in ' + werk + '\n');
  for (const [id, m] of items) {
    const klaar = fs.existsSync(path.join(uit, m.bestand));
    console.log((klaar ? '[klaar] ' : '[     ] ') + id.padEnd(42) + m.bron);
  }
  process.exit(0);
}

let token = process.env.SKETCHFAB_TOKEN;
try { token = token || fs.readFileSync(path.join(map, 'sketchfab-token.txt'), 'utf8').trim(); } catch {}

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
function gltfTransform(...a) {
  execFileSync(npx, ['--yes', '@gltf-transform/cli@4', ...a], { stdio: 'inherit', shell: process.platform === 'win32' });
}
function zoekGltf(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { const r = zoekGltf(p); if (r) return r; }
    else if (/\.(gltf|glb)$/i.test(e.name)) return p;
  }
  return null;
}
function uitpakken(zip, dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  // Windows: de bsdtar van Windows zelf (GNU tar uit Git ziet "C:" als een host)
  const tar = process.platform === 'win32' && fs.existsSync('C:\\Windows\\System32\\tar.exe') ? 'C:\\Windows\\System32\\tar.exe' : 'tar';
  execFileSync(tar, ['-xf', zip, '-C', dir], { stdio: 'inherit' });
  return zoekGltf(dir);
}
// Sketchfab zet de bron-URL (met uid) in asset.extras van de glTF
function uidVanGltf(bestand) {
  try {
    if (/\.glb$/i.test(bestand)) {
      const b = fs.readFileSync(bestand); const len = b.readUInt32LE(12);
      const j = JSON.parse(b.subarray(20, 20 + len).toString());
      return ((j.asset && j.asset.extras && j.asset.extras.source) || '').match(/[0-9a-f]{32}/)?.[0] || null;
    }
    const j = JSON.parse(fs.readFileSync(bestand, 'utf8'));
    return ((j.asset && j.asset.extras && j.asset.extras.source) || '').match(/[0-9a-f]{32}/)?.[0] || null;
  } catch { return null; }
}

// 1. gedownloade zips herkennen: aan de bestandsnaam (<wagen-id>.zip) of aan de bron-URL in de glTF
const handmatig = {};   // uid → gltf-pad
const uidVanId = Object.fromEntries(Object.entries(manifest.modellen).filter(([, m]) => m.sketchfab).map(([id, m]) => [id, m.sketchfab]));
for (const f of fs.readdirSync(werk).filter(f => /\.zip$/i.test(f))) {
  const naam = f.replace(/\.zip$/i, '');
  if (filters.length && uidVanId[naam] && !filters.some(x => naam.includes(x))) continue;   // niet nodig voor deze run
  const dir = path.join(werk, 'zip_' + naam);
  let gltf;
  try { gltf = fs.existsSync(dir) ? zoekGltf(dir) : uitpakken(path.join(werk, f), dir); }
  catch (e) { console.warn('Kon ' + f + ' niet uitpakken: ' + e.message); continue; }
  const uid = uidVanId[naam] || (gltf && uidVanGltf(gltf));
  if (uid && gltf) handmatig[uid] = gltf; else console.warn('Kon ' + f + ' niet herkennen (geen wagen-id als naam en geen bron-URL in de glTF).');
}

const verslag = [];
for (const [id, m] of items) {
  const doel = path.join(uit, m.bestand);
  if (fs.existsSync(doel) && !opnieuw) { verslag.push([id, 'bestaat al']); continue; }
  console.log('\n== ' + id + ' · ' + m.titel + ' (' + m.auteur + ', ' + m.licentie + ')');
  try {
    let bron = handmatig[m.sketchfab];
    if (!bron && token) {
      const r = await fetch('https://api.sketchfab.com/v3/models/' + m.sketchfab + '/download', { headers: { Authorization: 'Token ' + token } });
      if (!r.ok) throw new Error('download-API gaf ' + r.status);
      const link = (await r.json()).gltf;
      if (!link) throw new Error('geen glTF-archief beschikbaar');
      console.log('   ophalen: ' + (link.size / 1048576).toFixed(1) + ' MB');
      const zip = path.join(werk, id + '.zip');
      fs.writeFileSync(zip, Buffer.from(await (await fetch(link.url)).arrayBuffer()));
      bron = uitpakken(zip, path.join(werk, 'zip_' + id));
    }
    if (!bron) throw new Error('nog niet gedownload; zie node tools/haal-modellen.mjs --lijst');
    console.log('   optimaliseren…');
    gltfTransform('optimize', bron, doel,
      '--compress', 'draco',
      '--texture-compress', 'webp', '--texture-size', '2048',
      '--simplify', 'true', '--simplify-error', '0.0005',
      '--join', 'false', '--palette', 'false', '--flatten', 'false', '--instance', 'false');   // losse meshes en materiaalnamen bewaren (wielherkenning, lak)
    const mb = (fs.statSync(doel).size / 1048576).toFixed(1);
    console.log('   klaar: ' + m.bestand + ' (' + mb + ' MB)');
    verslag.push([id, mb + ' MB']);
  } catch (e) {
    console.error('   FOUT: ' + e.message);
    verslag.push([id, 'FOUT: ' + e.message.split('\n')[0]]);
  }
}
console.log('\nOverzicht:');
verslag.forEach(([id, s]) => console.log('  ' + id.padEnd(42) + s));
