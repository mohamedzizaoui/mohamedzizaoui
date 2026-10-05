// ============================================================
//  Procedurele carrosserie – wielkasten worden exact rond het
//  gekozen wiel gesneden, wielposities komen uit dezelfde maten.
// ============================================================
import * as THREE from 'three';

/** Schaalt de z-coördinaat (breedte) van elke vertex met factor f(x, y). */
function sculpt(geom, f) {
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setZ(i, pos.getZ(i) * f(pos.getX(i), pos.getY(i)));
  pos.needsUpdate = true;
  geom.computeBoundingSphere();
}

/**
 * Bouwt een auto (Group) zonder wielen. Retourneert in userData de wielposities
 * (x, y, z, side) zodat de velgen exact in de wielkasten komen.
 *  wheelR : buitenstraal van het wiel incl. band (m) – bepaalt wielkast en hoogte
 */
export function buildCar({ car, wheelR, bodyMat, glassMat, darkMat, lightMat, tailMat, chromeMat }) {
  const g = new THREE.Group();
  const { L, W, g: gc, xf, xr } = car;
  const archY = wheelR;                 // wielcentrum staat op banddiameter/2 boven de grond
  const archR = wheelR + 0.045;         // wielkast iets ruimer dan het wiel

  // --- zijprofiel met wielkasten ---
  const shape = new THREE.Shape();
  const dy = gc - archY;
  const tR = Math.asin(THREE.MathUtils.clamp(dy / archR, -1, 1)); // rechter snijpunt (onder horizon)
  const tL = Math.PI - tR;                                        // linker snijpunt
  const x0 = car.outline[car.outline.length - 1][0];              // achter-onder
  shape.moveTo(x0, gc);
  for (const cx of [xr, xf]) {
    shape.lineTo(cx + archR * Math.cos(tL), gc);
    shape.absarc(cx, archY, archR, tL, tR, true);
  }
  shape.lineTo(car.outline[0][0], car.outline[0][1]);
  shape.splineThru(car.outline.slice(1).map(([x, y]) => new THREE.Vector2(x, y)));
  shape.closePath();

  const bevel = 0.05;
  const body = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, { depth: W - 2 * bevel, bevelEnabled: true, bevelThickness: bevel, bevelSize: 0.045, bevelSegments: 5, curveSegments: 28 }),
    bodyMat,
  );
  body.geometry.translate(0, 0, -(W - 2 * bevel) / 2);
  sculpt(body.geometry, (x, y) => {
    const t = THREE.MathUtils.clamp((Math.abs(x) - (L / 2 - 1.0)) / 1.0, 0, 1);   // neus/kont smaller
    const belt = car.cabin[0][1];
    const v = (y - belt * 0.78) / belt;                                             // flank licht bol
    return (1 - 0.13 * t * t) * (1 - 0.06 * v * v);
  });
  g.add(body);

  // --- kooi (getint glas) + dakpaneel in carrosseriekleur ---
  const cab = new THREE.Shape(car.cabin.map(([x, y]) => new THREE.Vector2(x, y)));
  const cabW = W - 0.24;
  const cabin = new THREE.Mesh(
    new THREE.ExtrudeGeometry(cab, { depth: cabW - 0.06, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 3 }),
    glassMat,
  );
  cabin.geometry.translate(0, -0.02, -(cabW - 0.06) / 2);
  const belt = car.cabin[0][1], roofH = Math.max(car.cabin[1][1], car.cabin[2][1]);
  sculpt(cabin.geometry, (x, y) => {
    const u = THREE.MathUtils.clamp((y - belt) / (roofH - belt), 0, 1);
    const t = THREE.MathUtils.clamp((Math.abs(x) - (L / 2 - 1.0)) / 1.0, 0, 1);
    return (1 - 0.16 * u) * (1 - 0.13 * t * t);
  });
  g.add(cabin);

  const r0 = car.cabin[1], r1 = car.cabin[2];
  const rl = Math.hypot(r1[0] - r0[0], r1[1] - r0[1]);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(rl + 0.12, 0.035, (cabW - 0.16) * 0.86), bodyMat);
  roof.position.set((r0[0] + r1[0]) / 2, (r0[1] + r1[1]) / 2 + 0.01, 0);
  roof.rotation.z = Math.atan2(r1[1] - r0[1], r1[0] - r0[0]);
  g.add(roof);

  // --- onderkant / wielkuipen (donker, zodat je niet door de auto kijkt) ---
  const under = new THREE.Mesh(new THREE.BoxGeometry(L - 0.5, 0.10, W - 0.26), darkMat);
  under.position.set(0, gc + 0.02, 0);
  g.add(under);
  for (const cx of [xr, xf]) {
    for (const s of [-1, 1]) {
      const well = new THREE.Mesh(new THREE.CylinderGeometry(archR - 0.004, archR - 0.004, 0.44, 40, 1, true), darkMat);
      well.rotation.x = Math.PI / 2;
      well.position.set(cx, archY, s * (W / 2 - 0.27));
      g.add(well);
      const back = new THREE.Mesh(new THREE.CircleGeometry(archR - 0.004, 40), darkMat);
      back.position.set(cx, archY, s * (W / 2 - 0.49));
      back.rotation.y = s > 0 ? 0 : Math.PI;
      g.add(back);
    }
  }
  const sill = new THREE.Mesh(new THREE.BoxGeometry((xf - xr) - 2 * archR - 0.05, 0.07, W * 0.985), darkMat);
  sill.position.set((xf + xr) / 2, gc + 0.045, 0);
  g.add(sill);

  // --- details ---
  const front = car.outline[0][0] + 0.17, rear = car.outline[car.outline.length - 1][0] - 0.17;
  const [hlY, hlH] = car.lights.front, [tlY, tlH] = car.lights.rear;
  for (const s of [-1, 1]) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.07, hlH, 0.42), lightMat);
    hl.position.set(front - 0.02, hlY, s * (W / 2 - 0.33));
    g.add(hl);
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.06, tlH, 0.40), tailMat);
    tl.position.set(rear + 0.02, tlY, s * (W / 2 - 0.32));
    g.add(tl);
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.07, 0.20), bodyMat);
    mirror.position.set(car.cabin[0][0] - 0.08, car.cabin[0][1] + 0.05, s * (W / 2 - 0.01));
    g.add(mirror);
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.025, 0.02), chromeMat);
    handle.position.set((car.cabin[0][0] + car.cabin[3][0]) / 2 + 0.3, car.cabin[0][1] - 0.18, s * (W / 2 + 0.005));
    g.add(handle);
  }
  const grille = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.95), darkMat);
  grille.position.set(front + 0.01, car.grilleY, 0);
  g.add(grille);
  const bumper = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.12, W - 0.55), darkMat);
  bumper.position.set(front - 0.03, gc + 0.10, 0);
  g.add(bumper);
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.11, 0.48), chromeMat);
  plate.position.set(rear - 0.01, tlY - 0.2, 0);
  g.add(plate);

  g.userData = {
    wheels: [
      { x: xf, y: archY, z:  (W / 2 - 0.035), side:  1 },
      { x: xf, y: archY, z: -(W / 2 - 0.035), side: -1 },
      { x: xr, y: archY, z:  (W / 2 - 0.035), side:  1 },
      { x: xr, y: archY, z: -(W / 2 - 0.035), side: -1 },
    ],
    L, W,
  };
  return g;
}
