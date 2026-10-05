// ============================================================
//  AVD Velgen – 3D Velgen Simulator – configuratie
//  Pas hier de bedrijfsgegevens, kleuren, velgdesigns en auto's aan.
// ============================================================

export const SHOP = {
  name: 'AVD Velgen',
  fullName: 'AVD AluVelgen Detailing',
  url: 'https://avdvelgen.be',
  email: 'info@aluvelgen-avd.be',
  phone: '+32 3 293 58 37',
  mobile: '+32 487 13 36 37',
  address: 'Lindenstraat 298 / Unit B1, 2070 Zwijndrecht',
  hours: 'Ma–Vr 8:30–18:00 · Za 8:30–16:00 · Zo gesloten',
  brand: 'Carbonado',
  capText: 'AVD',
};

// Maten (inch) en steekmaten
export const DIAMETERS = [15, 16, 17, 18, 19, 20, 21, 22];
export const WIDTHS = [6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11];
export const PROFILES = [25, 30, 35, 40, 45, 50, 55];
export const PCDS = ['5x108', '5x112', '5x114.3', '5x118', '5x120'];

// Velgdesigns – procedureel opgebouwd (zie wheel.js), geïnspireerd op de Carbonado-collectie.
//  type   : 'single' | 'split' | 'y' | 'cross'
//  spokes : aantal spaken (bij 'split' en 'y' = aantal groepen)
//  wHub   : halve spaakbreedte bij de naaf (m)
//  wLip   : halve spaakbreedte bij de lip (m)
//  bend   : zijwaartse kromming (0 = recht)
//  lip    : diepte van de lip t.o.v. de voorkant (m)
//  concave: standaard concaviteit (m)
export const DESIGNS = [
  { id: 'master',    name: 'Master',    sub: '5-spaaks',          type: 'single', spokes: 5,  wHub: 0.024, wLip: 0.016, bend: 0,    lip: 0.030, concave: 0.010 },
  { id: 'rebellion', name: 'Rebellion', sub: 'Split 5 concave',   type: 'split',  spokes: 5,  wHub: 0.010, wLip: 0.008, bend: 0,    lip: 0.028, concave: 0.016, gapHub: 0.013, gapLip: 0.024 },
  { id: 'beast',     name: 'Beast',     sub: 'Multi-spoke 10',    type: 'single', spokes: 10, wHub: 0.014, wLip: 0.009, bend: 0,    lip: 0.026, concave: 0.014 },
  { id: 'crazy',     name: 'Crazy',     sub: 'Mesh Y7',           type: 'y',      spokes: 7,  wHub: 0.016, wLip: 0.008, bend: 0,    lip: 0.030, concave: 0.008, fork: 0.5 },
  { id: 'anomaly',   name: 'Anomaly',   sub: 'Turbine 9',         type: 'single', spokes: 9,  wHub: 0.017, wLip: 0.009, bend: 0.28, lip: 0.026, concave: 0.018 },
  { id: 'retro',     name: 'Retro',     sub: 'Deep dish 5',       type: 'single', spokes: 5,  wHub: 0.026, wLip: 0.019, bend: 0,    lip: 0.075, concave: 0.004 },
  { id: 'prestige',  name: 'Prestige',  sub: 'Star 6',            type: 'single', spokes: 6,  wHub: 0.022, wLip: 0.011, bend: 0,    lip: 0.030, concave: 0.016 },
  { id: 'rich',      name: 'Rich',      sub: 'Twin 14',           type: 'single', spokes: 14, wHub: 0.009, wLip: 0.006, bend: 0,    lip: 0.024, concave: 0.012 },
  { id: 'shine',     name: 'Shine',     sub: 'Cross 12',          type: 'cross',  spokes: 12, wHub: 0.010, wLip: 0.007, bend: 0.32, lip: 0.026, concave: 0.010 },
  { id: 'concave',   name: 'Concave',   sub: 'Flat 7 concave',    type: 'single', spokes: 7,  wHub: 0.028, wLip: 0.017, bend: 0,    lip: 0.022, concave: 0.034 },
];

// Afwerkingen van de velg (MeshPhysicalMaterial-parameters) met Carbonado-kleurcode
export const FINISHES = [
  { id: 'bg',   code: 'BG',  name: 'Black Glossy',     color: '#0b0b0d', metalness: 0.35, roughness: 0.18, clearcoat: 1.0 },
  { id: 'dmb',  code: 'DMB', name: 'Deep Matt Black',  color: '#141416', metalness: 0.25, roughness: 0.80, clearcoat: 0.0 },
  { id: 'a',    code: 'A',   name: 'Anthracite',       color: '#4a4f58', metalness: 0.90, roughness: 0.32, clearcoat: 0.3 },
  { id: 'gr',   code: 'GR',  name: 'Graphite',         color: '#2f3339', metalness: 0.85, roughness: 0.40, clearcoat: 0.3 },
  { id: 's',    code: 'S',   name: 'Silver',           color: '#c7c9cc', metalness: 0.92, roughness: 0.30, clearcoat: 0.2 },
  { id: 'hs',   code: 'HS',  name: 'Hyper Silver',     color: '#aeb3bb', metalness: 1.00, roughness: 0.18, clearcoat: 0.5 },
  { id: 'ch',   code: 'CH',  name: 'Chrome',           color: '#ffffff', metalness: 1.00, roughness: 0.05, clearcoat: 0.0 },
  { id: 'br',   code: 'BR',  name: 'Bronze',           color: '#8c6a3c', metalness: 0.95, roughness: 0.32, clearcoat: 0.3 },
  { id: 'gd',   code: 'GD',  name: 'Gold',             color: '#c9a24a', metalness: 1.00, roughness: 0.25, clearcoat: 0.3 },
  { id: 'w',    code: 'W',   name: 'White',            color: '#f1f1f1', metalness: 0.10, roughness: 0.30, clearcoat: 1.0 },
  { id: 'rd',   code: 'RD',  name: 'Candy Red',        color: '#9c1020', metalness: 0.40, roughness: 0.20, clearcoat: 1.0 },
];

// Afwerking van lip / spaakvlak (Carbonado-codes: FP = Front Polished, LP = Lip Polished)
export const LIP_FINISHES = [
  { id: 'same',     code: '',   name: 'Volledig in kleur' },
  { id: 'diamond',  code: 'FP', name: 'Front Polished' },
  { id: 'polished', code: 'LP', name: 'Lip Polished' },
  { id: 'black',    code: 'BL', name: 'Zwarte lip' },
];

export const CALIPER_COLORS = [
  { id: 'red',    name: 'Rood',    color: '#c8102e' },
  { id: 'yellow', name: 'Geel',    color: '#e8b400' },
  { id: 'blue',   name: 'Blauw',   color: '#1f4fd1' },
  { id: 'black',  name: 'Zwart',   color: '#161616' },
  { id: 'silver', name: 'Zilver',  color: '#9a9ea3' },
  { id: 'green',  name: 'Groen',   color: '#1f8f4a' },
];

export const BACKGROUNDS = [
  { id: 'dark',  name: 'Studio donker' },
  { id: 'light', name: 'Studio licht' },
  { id: 'room',  name: 'Showroom' },
];

// Auto's: realistische glTF-modellen (zie car.js en README voor licenties).
//  file       : pad naar het .glb-bestand
//  wheelNodes : namen van de vier wielknooppunten in het model (worden verborgen)
//  axle       : as waarlangs de wielen naast elkaar staan ('x' = auto ligt langs z)
//  paint      : mesh- of materiaalnamen die de carrosseriekleur krijgen
//  glass      : mesh- of materiaalnamen die het glasmateriaal krijgen
//  details    : mesh- of materiaalnamen die het detailmateriaal krijgen
//  shadow     : optionele AO-schaduwtextuur onder de auto
export const CARS = [
  { id: 'ferrari', name: 'Ferrari 458 Italia', file: 'demo/3d/modellen/ferrari-458.glb', axle: 'x',
    wheelNodes: ['wheel_fl', 'wheel_fr', 'wheel_rl', 'wheel_rr'],
    paint: ['body'], glass: ['glass'], details: ['trim'],
    shadow: { file: 'assets/models/ferrari_ao.png', w: 0.655 * 4, h: 1.3 * 4 },
    credit: 'Ferrari 458 Italia door vicent091036 via de Three.js-voorbeelden (alleen demo)' },
];

export const CAR_COLORS = [
  { id: 'black',  name: 'Zwart',        color: '#0d0e10' },
  { id: 'white',  name: 'Wit',          color: '#eef0f2' },
  { id: 'grey',   name: 'Nardo grijs',  color: '#7d8187' },
  { id: 'silver', name: 'Zilver',       color: '#c2c6cb' },
  { id: 'blue',   name: 'Donkerblauw',  color: '#17305e' },
  { id: 'red',    name: 'Rood',         color: '#a3131f' },
  { id: 'green',  name: 'British green',color: '#1d4a35' },
];

export const DEFAULT_STATE = {
  mode: 'wheel',      // 'wheel' | 'car'
  design: 'rebellion',
  diameter: 19,
  width: 8.5,
  concave: null,      // null = standaard van het design
  finish: 'bg',
  lip: 'diamond',
  pcd: '5x112',
  tyre: true,
  profile: 35,
  caliper: 'red',
  car: 'ferrari',
  carColor: 'grey',
  bg: 'dark',
  rotate: true,
};
