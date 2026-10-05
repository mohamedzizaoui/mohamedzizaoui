// ============================================================
//  Procedurele velg-, band- en remgeometrie
// ============================================================
import * as THREE from 'three';

const INCH = 0.0254;
export const HUB_R = 0.074;      // naafradius (m)
export const PCD_R = 0.056;      // wielboutcirkel radius (m)

// ---------- hulpfuncties ----------

/**
 * Omtrek van één spaaksegment van punt A naar punt B (in het velgvlak, meters).
 * w0/w1 = halve breedte bij A/B, bend = zijwaartse kromming, ext0/ext1 = verlenging voorbij A/B.
 */
export function spokeOutline(A, B, w0, w1, bend, ext0 = 0.008, ext1 = 0.010, steps = 14) {
  const dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy);
  const d = { x: dx / len, y: dy / len }, n = { x: -d.y, y: d.x };
  const left = [], right = [];
  for (let i = 0; i <= steps; i++) {
    const s = i / steps;
    const along = -ext0 + s * (len + ext0 + ext1);
    const b = bend * len * s * s;
    const cx = A.x + d.x * along + n.x * b;
    const cy = A.y + d.y * along + n.y * b;
    const w = w0 + (w1 - w0) * s;
    left.push({ x: cx + n.x * w, y: cy + n.y * w });
    right.push({ x: cx - n.x * w, y: cy - n.y * w });
  }
  return left.concat(right.reverse());
}

/** Alle spaak-omtrekken van een design, als [{pts, angle}] – ook gebruikt voor 2D-iconen. */
export function designOutlines(design, R, Rh = HUB_R) {
  const out = [];
  const n = design.spokes;
  const rIn = Rh * 0.85, rOut = R - 0.004;
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2;
    if (design.type === 'single') {
      out.push({ angle, pts: spokeOutline({ x: 0, y: rIn }, { x: 0, y: rOut }, design.wHub, design.wLip, design.bend) });
    } else if (design.type === 'cross') {
      const sgn = i % 2 === 0 ? 1 : -1;
      out.push({ angle, pts: spokeOutline({ x: 0, y: rIn }, { x: 0, y: rOut }, design.wHub, design.wLip, design.bend * sgn) });
    } else if (design.type === 'split') {
      for (const s of [-1, 1]) {
        out.push({ angle, pts: spokeOutline({ x: s * design.gapHub, y: rIn }, { x: s * design.gapLip, y: rOut }, design.wHub, design.wLip, 0) });
      }
    } else if (design.type === 'y') {
      const rm = Rh + (R - Rh) * design.fork;
      const half = Math.PI / n;
      out.push({ angle, pts: spokeOutline({ x: 0, y: rIn }, { x: 0, y: rm }, design.wHub, design.wHub * 0.9, 0, 0.008, 0.004) });
      for (const s of [-1, 1]) {
        out.push({ angle, pts: spokeOutline({ x: 0, y: rm - design.wHub * 0.6 }, { x: s * R * Math.sin(half), y: R * Math.cos(half) }, design.wHub * 0.8, design.wLip, 0, 0.004, 0.010) });
      }
    }
  }
  return out;
}

function rotXtoZ(geom) { geom.rotateX(Math.PI / 2); return geom; }

// ---------- velg ----------

/**
 * Bouwt een complete velg (Group). Alle maten in meters; de voorkant ligt op z = 0,
 * de velg loopt naar -z. Wielas = z-as.
 */
export function buildRim({ diameter, width, design, concave, faceMat, sideMat, lipMat, hubMat, capMat, nutMat }) {
  const g = new THREE.Group();
  const R = (diameter * INCH) / 2;
  const W = width * INCH;
  const lip = design.lip;
  const Rh = HUB_R;

  // --- buitenring / barrel (lathe-profiel: [radius, z]) ---
  const prof = [
    [R + 0.012, -W],
    [R + 0.012, -W + 0.008],
    [R,         -W + 0.013],
    [R,         -0.022],
    [R + 0.015, -0.011],
    [R + 0.015,  0.000],
    [R + 0.006,  0.004],
    [R - 0.006,  0.000],
    [R - 0.011, -lip + 0.004],
    [R - 0.013, -lip],
    [R - 0.013, -W + 0.009],
    [R - 0.001, -W + 0.004],
    [R + 0.012, -W],
  ].map(([r, z]) => new THREE.Vector2(r, z));
  const barrel = new THREE.Mesh(rotXtoZ(new THREE.LatheGeometry(prof, 128)), lipMat);
  g.add(barrel);

  // --- spaken ---
  const depth = 0.026;
  const extrude = { depth, bevelEnabled: true, bevelThickness: 0.0022, bevelSize: 0.0022, bevelSegments: 2, curveSegments: 4 };
  const outlines = designOutlines(design, R, Rh);
  const concaveFn = (r) => {
    const s = THREE.MathUtils.clamp((r - Rh * 0.85) / (R - Rh * 0.85), 0, 1);
    return -concave * Math.pow(1 - s, 1.6);
  };
  for (const { pts, angle } of outlines) {
    const shape = new THREE.Shape(pts.map((p) => new THREE.Vector2(p.x, p.y)));
    const geom = new THREE.ExtrudeGeometry(shape, extrude);
    geom.translate(0, 0, -(depth + extrude.bevelThickness) - lip);
    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      pos.setZ(i, pos.getZ(i) + concaveFn(Math.hypot(x, y)));
    }
    geom.computeVertexNormals();
    geom.rotateZ(angle);
    g.add(new THREE.Mesh(geom, [faceMat, sideMat]));
  }

  // --- naaf ---
  const hubFront = -lip - concave;
  const hubDepth = 0.055;
  const hub = new THREE.Mesh(rotXtoZ(new THREE.CylinderGeometry(Rh, Rh * 0.96, hubDepth, 64)), hubMat);
  hub.position.z = hubFront - hubDepth / 2;
  g.add(hub);

  // naafdop
  const capGeom = rotXtoZ(new THREE.CylinderGeometry(0.031, 0.031, 0.006, 48));
  capGeom.rotateZ(Math.PI / 2); // tekst op de dop rechtop
  const cap = new THREE.Mesh(capGeom, [hubMat, capMat, hubMat]);
  cap.position.z = hubFront + 0.004 - 0.003;
  g.add(cap);
  const capRing = new THREE.Mesh(new THREE.TorusGeometry(0.031, 0.0025, 12, 48), nutMat);
  capRing.position.z = hubFront + 0.004;
  g.add(capRing);

  // wielbouten (5x)
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + Math.PI / 2;
    const nut = new THREE.Mesh(rotXtoZ(new THREE.CylinderGeometry(0.0085, 0.0095, 0.012, 6)), nutMat);
    nut.position.set(Math.cos(a) * PCD_R, Math.sin(a) * PCD_R, hubFront + 0.002);
    g.add(nut);
    const seat = new THREE.Mesh(rotXtoZ(new THREE.CylinderGeometry(0.013, 0.013, 0.004, 24)), sideMat);
    seat.position.set(Math.cos(a) * PCD_R, Math.sin(a) * PCD_R, hubFront - 0.0025);
    g.add(seat);
  }

  g.userData = { R, W, lip, hubFront };
  return g;
}

// ---------- band ----------

/** Bandmaat afleiden uit velgmaat. */
export function tyreSize(width, profile, diameter) {
  const w = Math.round((width * INCH * 1000 + 22) / 10) * 10 + 5;
  return { width: w, profile, diameter, label: `${w}/${profile} R${diameter}` };
}

export function buildTyre({ diameter, width, profile, mat }) {
  const R = (diameter * INCH) / 2;
  const W = width * INCH;
  const ts = tyreSize(width, profile, diameter);
  const h = (ts.width * profile) / 100 / 1000;        // zijwandhoogte (m)
  const half = ts.width / 2 / 1000;                    // halve bandbreedte (m)
  const yc = -W / 2;
  const Ro = R + h;
  const front = [
    [R + 0.004, 0.000],
    [R + 0.013, 0.006],
    [R + h * 0.35, yc + half * 0.96],
    [R + h * 0.80, yc + half * 0.90],
    [Ro - 0.004, yc + half * 0.76],
    [Ro,         yc + half * 0.70],
  ];
  // loopvlak met groeven
  const tread = [];
  const tA = yc + half * 0.70, tB = yc - half * 0.70;
  const grooves = 4;
  for (let i = 1; i <= grooves; i++) {
    const gz = tA + ((tB - tA) * i) / (grooves + 1);
    tread.push([Ro, gz + 0.0035], [Ro - 0.006, gz + 0.0025], [Ro - 0.006, gz - 0.0025], [Ro, gz - 0.0035]);
  }
  const back = front.slice().reverse().map(([r, z]) => [r, 2 * yc - z]);
  const inner = [[R + 0.004, -W], [R + 0.004, 0.000]];
  const prof = [...front, ...tread, ...back, ...inner].map(([r, z]) => new THREE.Vector2(r, z));
  const mesh = new THREE.Mesh(rotXtoZ(new THREE.LatheGeometry(prof, 160)), mat);
  mesh.userData = { Ro, size: ts };
  return mesh;
}

// ---------- remmen ----------

export function buildBrake({ hubFront, discMat, caliperMat, hatMat }) {
  const g = new THREE.Group();
  const z = hubFront - 0.075;
  const disc = new THREE.Mesh(rotXtoZ(new THREE.CylinderGeometry(0.168, 0.168, 0.026, 96)), discMat);
  disc.position.z = z;
  g.add(disc);
  const hat = new THREE.Mesh(rotXtoZ(new THREE.CylinderGeometry(0.085, 0.085, 0.034, 64)), hatMat);
  hat.position.z = z + 0.004;
  g.add(hat);
  // koelgleuven (ringen)
  const slot = new THREE.Mesh(new THREE.TorusGeometry(0.128, 0.0015, 6, 96), hatMat);
  slot.position.z = z + 0.0135;
  g.add(slot);
  // remklauw: gebogen segment dat over de schijf valt
  const cal = new THREE.Group();
  const arc = 0.62;
  const body = new THREE.Mesh(new THREE.TorusGeometry(0.146, 0.027, 10, 28, arc), caliperMat);
  body.scale.z = 1.6;
  cal.add(body);
  const bridge = new THREE.Mesh(new THREE.TorusGeometry(0.160, 0.012, 8, 28, arc * 0.9), caliperMat);
  bridge.rotation.z = arc * 0.05;
  cal.add(bridge);
  cal.position.z = z;
  cal.rotation.z = THREE.MathUtils.degToRad(104) - arc / 2;
  g.add(cal);
  return g;
}

// ---------- 2D icoon van een design ----------

export function drawDesignIcon(canvas, design) {
  const ctx = canvas.getContext('2d');
  const s = canvas.width;
  const R = 0.24, c = s / 2, k = (s * 0.46) / R;
  ctx.clearRect(0, 0, s, s);
  ctx.save();
  ctx.translate(c, c);
  ctx.scale(k, -k);
  ctx.lineWidth = 0.012;
  ctx.strokeStyle = 'currentColor';
  ctx.fillStyle = 'currentColor';
  ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, R - 0.02, 0, Math.PI * 2); ctx.stroke();
  for (const { pts, angle } of designOutlines(design, R - 0.012)) {
    ctx.save();
    ctx.rotate(angle);
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.beginPath(); ctx.arc(0, 0, HUB_R * 0.95, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
