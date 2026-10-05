// ============================================================
//  AVD Velgen – 3D Velgen Simulator – configuratie
//  Pas hier de bedrijfsgegevens, kleuren en velgdesigns aan.
// ============================================================

export const SHOP = {
  name: 'AVD Velgen',
  url: 'https://avdvelgen.be',
  // TODO: vervang door het echte e-mailadres van AVD Velgen
  email: 'info@avdvelgen.be',
  phone: '',
  // Tekst op de naafdop (max. 4 tekens leesbaar)
  capText: 'AVD',
};

// Maten (inch)
export const DIAMETERS = [15, 16, 17, 18, 19, 20, 21, 22];
export const WIDTHS = [6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11];
export const PROFILES = [25, 30, 35, 40, 45, 50, 55];

// Velgdesigns – geometrie wordt procedureel opgebouwd (zie wheel.js)
//  type   : 'single' | 'split' | 'y' | 'cross'
//  spokes : aantal spaken (bij 'split' en 'y' = aantal groepen)
//  wHub   : halve spaakbreedte bij de naaf (m)
//  wLip   : halve spaakbreedte bij de lip (m)
//  bend   : zijwaartse kromming (0 = recht)
//  lip    : diepte van de lip t.o.v. de voorkant (m)
//  concave: standaard concaviteit (m)
//  gap    : (split) halve afstand tussen de twee spaken
//  fork   : (y) positie van de splitsing (0..1 van naaf naar lip)
export const DESIGNS = [
  { id: 'monza5',   name: 'Monza 5',       type: 'single', spokes: 5,  wHub: 0.024, wLip: 0.016, bend: 0,     lip: 0.030, concave: 0.010 },
  { id: 'split5',   name: 'Split 5',       type: 'split',  spokes: 5,  wHub: 0.010, wLip: 0.008, bend: 0,     lip: 0.028, concave: 0.012, gapHub: 0.013, gapLip: 0.024 },
  { id: 'multi10',  name: 'Multi 10',      type: 'single', spokes: 10, wHub: 0.014, wLip: 0.009, bend: 0,     lip: 0.026, concave: 0.014 },
  { id: 'mesh7',    name: 'Mesh Y7',       type: 'y',      spokes: 7,  wHub: 0.016, wLip: 0.008, bend: 0,     lip: 0.030, concave: 0.008, fork: 0.5 },
  { id: 'turbine9', name: 'Turbine 9',     type: 'single', spokes: 9,  wHub: 0.017, wLip: 0.009, bend: 0.28,  lip: 0.026, concave: 0.018 },
  { id: 'dish5',    name: 'Deep Dish 5',   type: 'single', spokes: 5,  wHub: 0.026, wLip: 0.019, bend: 0,     lip: 0.075, concave: 0.004 },
  { id: 'star6',    name: 'Star 6',        type: 'single', spokes: 6,  wHub: 0.022, wLip: 0.011, bend: 0,     lip: 0.030, concave: 0.016 },
  { id: 'twin14',   name: 'Twin 14',       type: 'single', spokes: 14, wHub: 0.009, wLip: 0.006, bend: 0,     lip: 0.024, concave: 0.012 },
  { id: 'cross12',  name: 'Cross 12',      type: 'cross',  spokes: 12, wHub: 0.010, wLip: 0.007, bend: 0.32,  lip: 0.026, concave: 0.010 },
  { id: 'flat7',    name: 'Flat 7 Concave',type: 'single', spokes: 7,  wHub: 0.028, wLip: 0.017, bend: 0,     lip: 0.022, concave: 0.034 },
];

// Afwerkingen van de velg (MeshPhysicalMaterial-parameters)
export const FINISHES = [
  { id: 'glossblack',  name: 'Glanzend zwart',  color: '#0b0b0d', metalness: 0.35, roughness: 0.18, clearcoat: 1.0 },
  { id: 'matblack',    name: 'Mat zwart',       color: '#141416', metalness: 0.25, roughness: 0.80, clearcoat: 0.0 },
  { id: 'gunmetal',    name: 'Gunmetal',        color: '#4a4f58', metalness: 0.90, roughness: 0.32, clearcoat: 0.3 },
  { id: 'silver',      name: 'Zilver',          color: '#c7c9cc', metalness: 0.92, roughness: 0.30, clearcoat: 0.2 },
  { id: 'hypersilver', name: 'Hyper silver',    color: '#aeb3bb', metalness: 1.00, roughness: 0.18, clearcoat: 0.5 },
  { id: 'chrome',      name: 'Chroom',          color: '#ffffff', metalness: 1.00, roughness: 0.05, clearcoat: 0.0 },
  { id: 'bronze',      name: 'Brons',           color: '#8c6a3c', metalness: 0.95, roughness: 0.32, clearcoat: 0.3 },
  { id: 'gold',        name: 'Goud',            color: '#c9a24a', metalness: 1.00, roughness: 0.25, clearcoat: 0.3 },
  { id: 'white',       name: 'Wit',             color: '#f1f1f1', metalness: 0.10, roughness: 0.30, clearcoat: 1.0 },
  { id: 'red',         name: 'Candy rood',      color: '#9c1020', metalness: 0.40, roughness: 0.20, clearcoat: 1.0 },
  { id: 'blue',        name: 'Nachtblauw',      color: '#1b3270', metalness: 0.40, roughness: 0.22, clearcoat: 1.0 },
];

// Afwerking van lip / spaakvlak
export const LIP_FINISHES = [
  { id: 'same',     name: 'Zelfde als velg' },
  { id: 'polished', name: 'Gepolijste lip' },
  { id: 'diamond',  name: 'Diamond cut' },
  { id: 'black',    name: 'Zwarte lip' },
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

export const DEFAULT_STATE = {
  design: 'monza5',
  diameter: 19,
  width: 8.5,
  concave: null,      // null = standaard van het design
  finish: 'glossblack',
  lip: 'diamond',
  tyre: true,
  profile: 35,
  caliper: 'red',
  bg: 'dark',
  rotate: true,
};
