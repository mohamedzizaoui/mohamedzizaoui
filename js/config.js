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

// Auto's (procedurele carrosserie, zie car.js). Maten in meters, x = lengte-as (voor = +x),
// y = hoogte, z = breedte. outline = bovenomtrek van voor-onder naar achter-onder;
// cabin = polygoon van de kooi (sluit op de gordellijn); roof = dakpaneel van..tot (x);
// xf/xr = wielcentra; g = bodemvrijheid.
export const CARS = [
  { id: 'sedan', name: 'Sedan', L: 4.80, W: 1.86, g: 0.17, xf: 1.45, xr: -1.40,
    outline: [[2.25,0.17],[2.40,0.30],[2.42,0.55],[2.36,0.74],[1.75,0.80],[0.95,0.90],[-1.55,0.94],[-2.20,0.96],[-2.38,0.85],[-2.42,0.55],[-2.35,0.30],[-2.25,0.17]],
    cabin: [[0.95,0.90],[0.30,1.40],[-0.75,1.44],[-1.55,0.94]], roof: [0.30,-0.75],
    lights: { front: [0.66, 0.10], rear: [0.84, 0.08] }, grilleY: 0.48 },
  { id: 'suv', name: 'SUV', L: 4.70, W: 1.93, g: 0.26, xf: 1.38, xr: -1.42,
    outline: [[2.15,0.26],[2.30,0.42],[2.35,0.72],[2.28,0.98],[1.60,1.05],[0.90,1.10],[-2.10,1.12],[-2.30,1.05],[-2.35,0.72],[-2.30,0.42],[-2.15,0.26]],
    cabin: [[0.90,1.10],[0.35,1.68],[-1.60,1.74],[-2.10,1.12]], roof: [0.35,-1.60],
    lights: { front: [0.88, 0.11], rear: [1.00, 0.10] }, grilleY: 0.62 },
  { id: 'hatch', name: 'Hatchback', L: 4.30, W: 1.80, g: 0.16, xf: 1.30, xr: -1.30,
    outline: [[2.00,0.16],[2.13,0.30],[2.15,0.58],[2.08,0.78],[1.45,0.84],[0.80,0.92],[-1.85,0.95],[-2.10,0.90],[-2.15,0.55],[-2.08,0.30],[-2.00,0.16]],
    cabin: [[0.80,0.92],[0.20,1.44],[-1.20,1.48],[-1.95,0.95]], roof: [0.20,-1.20],
    lights: { front: [0.70, 0.10], rear: [0.84, 0.08] }, grilleY: 0.46 },
  { id: 'coupe', name: 'Coupé', L: 4.65, W: 1.92, g: 0.12, xf: 1.42, xr: -1.38,
    outline: [[2.20,0.12],[2.32,0.25],[2.33,0.50],[2.25,0.66],[1.50,0.74],[0.85,0.84],[-1.30,0.88],[-2.10,0.92],[-2.30,0.80],[-2.33,0.50],[-2.25,0.25],[-2.20,0.12]],
    cabin: [[0.85,0.84],[0.05,1.28],[-0.70,1.30],[-1.70,0.90]], roof: [0.05,-0.70],
    lights: { front: [0.58, 0.09], rear: [0.80, 0.07] }, grilleY: 0.40 },
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
  car: 'sedan',
  carColor: 'grey',
  bg: 'dark',
  rotate: true,
};
