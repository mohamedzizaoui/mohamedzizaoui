// ============================================================
//  Realistische auto's: glTF-modellen laden, originele wielen
//  verbergen en de wielposities bepalen voor onze velgen.
// ============================================================
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const draco = new DRACOLoader();
draco.setDecoderPath('vendor/three/addons/libs/draco/gltf/');
const loader = new GLTFLoader();
loader.setDRACOLoader(draco);

const cache = new Map();   // id -> Promise<{ scene, wheels, bbox }>

/**
 * Laadt een automodel één keer en analyseert het:
 *  - wielknooppunten (positie, straal, kant) via car.wheelNodes
 *  - bounding box van de carrosserie zonder wielen
 */
export function loadCar(car) {
  if (!cache.has(car.id)) {
    cache.set(car.id, new Promise((resolve, reject) => {
      loader.load(car.file, (gltf) => {
        const scene = gltf.scene;
        scene.updateMatrixWorld(true);
        const wheels = [];
        for (const name of car.wheelNodes) {
          const node = scene.getObjectByName(name);
          if (!node) continue;
          const box = new THREE.Box3().setFromObject(node);
          const pos = node.getWorldPosition(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const axle = car.axle || 'x';                       // as waarlangs de wielen staan
          wheels.push({ node, pos, radius: size.y / 2, width: size[axle], side: Math.sign(pos[axle]) || 1 });
          node.visible = false;                               // originele velg + band verbergen
        }
        const bbox = new THREE.Box3().setFromObject(scene);
        resolve({ scene, wheels, bbox, gltf });
      }, undefined, reject);
    }));
  }
  return cache.get(car.id);
}

/**
 * Maakt een instantie van het geladen model met onze materialen en
 * geeft de wielposities terug (in de coördinaten van de teruggegeven groep).
 */
export function instantiateCar(car, loaded, { bodyMat, glassMat, detailsMat }) {
  const g = new THREE.Group();
  const model = loaded.scene.clone(true);
  model.traverse((o) => {
    if (!o.isMesh) return;
    const mname = (o.material && o.material.name) || '';
    if (car.paint.some((p) => o.name === p || mname.startsWith(p))) o.material = bodyMat;
    else if (car.glass.some((p) => o.name === p || mname === p)) o.material = glassMat;
    else if ((car.details || []).some((p) => o.name === p || mname === p)) o.material = detailsMat;
  });
  // model zo verschuiven dat de originele wielen op y = 0 zouden staan
  const wheelY = loaded.wheels[0] ? loaded.wheels[0].pos.y : loaded.bbox.min.y;
  const r0 = loaded.wheels[0] ? loaded.wheels[0].radius : 0.35;
  model.position.y = -(wheelY - r0);
  if (car.rotateY) model.rotation.y = car.rotateY;
  g.add(model);
  g.updateMatrixWorld(true);

  const wheels = loaded.wheels.map((w) => {
    const p = w.pos.clone();
    model.localToWorld(p);
    g.worldToLocal(p);
    return { pos: p, radius: w.radius, side: w.side, width: w.width };
  });
  const size = loaded.bbox.getSize(new THREE.Vector3());
  return { group: g, wheels, model, length: Math.max(size.x, size.z), height: size.y, r0 };
}

/** Rotatie om de y-as zodat onze velg (voorkant = +z) naar buiten wijst. */
export function wheelRotationY(car, side) {
  const axle = car.axle || 'x';
  const base = car.rotateY || 0;
  if (axle === 'x') return base + (side > 0 ? Math.PI / 2 : -Math.PI / 2);
  return base + (side > 0 ? 0 : Math.PI);
}
