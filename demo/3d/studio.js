// Studio-omgeving voor gepolijst aluminium en lak: softboxen en een lichte vloer, als omgevingskaart (PMREM).
import * as THREE from 'three';

export function maakStudioOmgeving(renderer, opties = {}) {
  const scene = new THREE.Scene();
  const grijs = opties.donker ? 0x1a1b1e : 0x9da0a6;
  scene.background = new THREE.Color(grijs);
  // de ruimte: een grote doos van binnenuit gezien
  const kamer = new THREE.Mesh(new THREE.BoxGeometry(12, 7, 12), new THREE.MeshBasicMaterial({ color: grijs, side: THREE.BackSide }));
  kamer.position.y = 2.5;
  scene.add(kamer);
  // vloer iets lichter, met verloop naar de horizon
  const vloer = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.MeshBasicMaterial({ color: opties.donker ? 0x111214 : 0xc4c7cc }));
  vloer.rotation.x = -Math.PI / 2; vloer.position.y = -0.99;
  scene.add(vloer);
  const box = (b, h, kleur, sterkte, pos, kijk) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(b, h), new THREE.MeshBasicMaterial({ color: kleur, side: THREE.DoubleSide }));
    m.material.color.multiplyScalar(sterkte);
    m.position.set(...pos); m.lookAt(...(kijk || [0, 0, 0]));
    scene.add(m);
  };
  // sleutellicht: brede softbox schuin boven voor
  box(4.5, 2.2, 0xffffff, 6, [1.5, 3.4, 3.2]);
  // invullicht links, koeler en zachter
  box(2.2, 3.2, 0xdfe8ff, 2.2, [-4.2, 1.2, 1.8]);
  // smalle strip rechts voor de glimlijn op de lip
  box(0.5, 4.0, 0xffffff, 8, [4.0, 1.4, -0.6]);
  // zacht toplicht
  box(3, 3, 0xfff4e6, 1.6, [0, 3.45, -1.5]);
  // tegenlicht achter voor de contour van de band
  box(5, 1.2, 0xffffff, 3.5, [0, 2.2, -5.5]);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const tex = pmrem.fromScene(scene, 0.02).texture;
  pmrem.dispose();
  return tex;
}
