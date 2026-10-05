// Bouwt tools/modellen.json: per wagen-id het gekozen Sketchfab-model met naamsvermelding.
// Draaien: node tools/maak-manifest.mjs   (alleen nodig als de keuze van modellen verandert)
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const map = fileURLToPath(new URL('.', import.meta.url));

// wagen-id (zoals in avd-velg-op-auto.js) → [Sketchfab-uid, opmerking]
const KEUZE = {
  'audi-a3-sportback-8y-2020': ['974f50676c3448f9b46155c18978a26f', 'S3 in plaats van A3, zelfde carrosserie'],
  'audi-a4-avant-b9-2015': ['7ba4f7fa8f32436a9685a8abaa5da302', ''],
  'audi-q5-fy-2017': ['940956e2845e43878a112b2903ee3329', ''],
  'bmw-1-reeks-f40-2019': ['251a944d5b5c4fdb967e09c79b2001c4', 'M135i-uitvoering'],
  'bmw-3-reeks-g20-2019': ['049224d6a9eb40d9b7b7045338a106ef', ''],
  'bmw-3-reeks-f30-2012-2019': ['0c1dee70352640ea9ad7096540695342', ''],
  'bmw-x3-g01-2017': ['5142078aebec406688e19401985050ec', ''],
  'ford-focus-iv-2018': ['0adceae5166e40a58501d8d8e3e9b9a9', 'vorige generatie (Mk3, 2012); Mk4 niet als CC-BY gevonden'],
  'ford-kuga-iii-2019': ['af11acd6199b4f70b801ffd248d7efe6', 'eerste generatie (2010); nieuwere Kuga niet als bruikbaar CC-BY-model gevonden'],
  'hyundai-tucson-nx4-2020': ['574deec95f094e9192b0023d3d4ad607', ''],
  'kia-sportage-nq5-2021': ['98a84407998a4bc6b4dee912b289f15b', ''],
  'mazda-3-bp-2019': ['7e2ef9be2dd74cf4b980d068d272dfff', 'sedan in plaats van hatchback'],
  'mercedes-benz-a-klasse-w177-2018': ['f0ae7b2720ea4f429bcd2f74c132717a', 'A45 AMG-uitvoering'],
  'mercedes-benz-c-klasse-w206-2021': ['19d59344b7554e6ab614a6cc02e7ad0a', 'vorige generatie (W205, 2020); W206 niet als CC-BY gevonden'],
  'mercedes-benz-glc-x254-2022': ['950d36030fe1468aa9033d5edfc9550c', 'vorige generatie (X253, 2020)'],
  'mini-cooper-f56-2014-2024': ['2baca439d2494e02b99596014b49ebd3', 'Cooper S facelift'],
  'nissan-qashqai-j12-2021': ['3c7f36f8e67d43b7b26e901880806503', ''],
  'opel-corsa-f-2019': ['142a797a3ee54daa8f4d00c8559cddbb', ''],
  'peugeot-208-ii-2019': ['a4f8becd0740468ca0c12cf403e4a42e', 'e-208, zelfde carrosserie'],
  'peugeot-308-iii-2021': ['0d9c9c265bec42678bfc269c1a8cebc3', ''],
  'renault-clio-v-2019': ['4c528fefa4154004bbc6305faf71836c', ''],
  'skoda-octavia-combi-iv-2020': ['44bb15f06124464ba6d4ef3a1d3b95a5', ''],
  'tesla-model-3-2017': ['5ef9b845aaf44203b6d04e2c677e444f', ''],
  'tesla-model-y-2020': ['59e2ead369984b1a85c800ff6cf6789d', ''],
  'toyota-corolla-e210-2019': ['6d7d34ee42734d1ab28a6b1f1c5fc4fc', ''],
  'toyota-rav4-xa50-2019': ['de74fe4e98004c92b1103947597d1b53', ''],
  'volkswagen-golf-8-2020': ['e87d7c0f8937481db236529beb5ecab7', 'GTI-uitvoering'],
  'volkswagen-polo-aw-2017': ['bab77902c638427bb85e68b6762a481f', ''],
  'volkswagen-passat-variant-b8-2014-2023': ['41af8da6d8054229ba1f462cd25ba0b4', ''],
  'volkswagen-tiguan-ii-2016-2024': ['fc46a721e21440a2a641750007942a13', ''],
  'volvo-xc60-ii-2017': ['986e54be12664ff59d0748d003883ace', '']
};

const modellen = {};
for (const [id, [uid, opmerking]] of Object.entries(KEUZE)) {
  const m = await (await fetch('https://api.sketchfab.com/v3/models/' + uid)).json();
  modellen[id] = {
    bestand: id + '.glb', sketchfab: uid, titel: m.name,
    auteur: m.user && m.user.displayName, auteurUrl: m.user && m.user.profileUrl,
    licentie: m.license && m.license.label, licentieUrl: m.license && m.license.url,
    bron: m.viewerUrl, vlakken: m.faceCount, ...(opmerking ? { opmerking } : {})
  };
  console.log(id, '|', m.name, '|', m.user && m.user.displayName, '|', m.license && m.license.label, '|', m.faceCount);
  await new Promise(r => setTimeout(r, 200));
}
modellen['demo-ferrari-458'] = {
  bestand: 'ferrari-458.glb', titel: 'Ferrari 458 Italia (three.js-voorbeeld)', auteur: 'vicent091036',
  licentie: 'onbekend, alleen demo', bron: 'https://github.com/mrdoob/three.js/tree/dev/examples/models/gltf',
  wielen: { fl: 'wheel_fl', fr: 'wheel_fr', rl: 'wheel_rl', rr: 'wheel_rr' }, verbergen: ['rim_', 'centre', 'nuts', 'wheel'],
  velgstraal: 0.282, carrosserie: 'body', ruiten: 'glass', remklauw: 'brake'
};

const manifest = {
  _uitleg: 'Per wagen-id uit avd-velg-op-auto.js het Sketchfab-model (CC Attribution: naamsvermelding verplicht, de 3D-pagina toont ze). Optionele velden overschrijven de automatische herkenning: draai (graden om de Y-as), wielen {fl,fr,rl,rr: nodenaam}, verbergen [naamdelen], velgstraal (m), carrosserie, ruiten, remklauw.',
  modellen
};
fs.writeFileSync(map + 'modellen.json', JSON.stringify(manifest, null, 2));
console.log('manifest:', Object.keys(modellen).length, 'wagens →', map + 'modellen.json');
