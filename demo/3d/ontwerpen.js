// De velgen uit de winkel als 3D-ontwerp. Maten in meter, getekend voor 19"; de module schaalt mee met de velgmaat.
// Catalogusgegevens komen van de productpagina's op avdvelgen.be (september 2026).
export const VELGEN = [
  {
    id: 'carbonado-game', merk: 'Carbonado', naam: 'Game BFP', foto: '../velgen/carbonado-game-2.jpg',
    prijs: 191.24, maten: [17, 18, 19, 20], breedte: 8, steek: '5x112', et: 35, naafgat: 66.5,
    afwerking: 'zwart-gepolijst', keuzes: ['zwart-gepolijst', 'zwart-glans', 'gunmetal'],
    ontwerp: { merk: 'Carbonado', stijl: 'spaken', spaken: 5, dubbel: 0.03, bHub: 0.034, bRim: 0.03, kromming: 0.02, zwaai: 0, concaaf: 0.014, diepteVlak: 0.026, naafR: 0.08, dopKleur: '#101113' }
  },
  {
    id: 'carbonado-rebellion', merk: 'Carbonado', naam: 'Rebellion BFP', foto: '../velgen/carbonado-rebellion.jpg',
    prijs: 273.29, maten: [19, 20, 21], breedte: 9.5, steek: '5x112', et: 45, naafgat: 66.5,
    afwerking: 'zwart-gepolijst', keuzes: ['zwart-gepolijst', 'zwart-glans', 'zilver'],
    ontwerp: { merk: 'Carbonado', stijl: 'vensters', vensters: { aantal: 24, r0: 0.66, r1: 0.965, b0: 0.027, b1: 0.042 }, concaaf: 0.0, diepteVlak: 0.022, rVlak: 0.92, naafR: 0.06, dopR: 0.055, dopKleur: '#d7d9dc', dopTekst: '#1a1b1d' }
  },
  {
    id: 'mam-rs4', merk: 'MAM', naam: 'RS4 PFP', foto: '../velgen/mam-rs4.jpg',
    prijs: 189.72, maten: [17, 18, 19, 20], breedte: 7.5, steek: '5x112', et: 35, naafgat: 66.5,
    afwerking: 'grafiet-gepolijst', keuzes: ['grafiet-gepolijst', 'zwart-gepolijst', 'zwart-mat'],
    ontwerp: { merk: 'MAM', stijl: 'spaken', spaken: 10, splits: 0.40, armHoek: 0.30, armBreedte: 0.013, bHub: 0.022, bRim: 0.017, concaaf: 0.022, diepteVlak: 0.022, naafR: 0.072, dopKleur: '#f2b200', dopTekst: '#1a1a1a' }
  },
  {
    id: 'borbet-lx19', merk: 'Borbet', naam: 'LX19 BGRR', foto: '../velgen/borbet-lx19.jpg',
    prijs: 255.60, maten: [18, 19, 20], breedte: 8, steek: '5x114.3', et: 45, naafgat: 72.6,
    afwerking: 'zwart-glans', keuzes: ['zwart-glans', 'zwart-mat', 'zwart-gepolijst'],
    ontwerp: { merk: 'Borbet', stijl: 'spaken', spaken: 5, splits: 0.42, armHoek: 0.24, armBreedte: 0.03, bHub: 0.052, bRim: 0.034, concaaf: 0.02, diepteVlak: 0.026, naafR: 0.08, accent: 'randrood', dopKleur: '#111214' }
  },
  {
    id: 'carmani-14', merk: 'Carmani', naam: '14 Paul HG', foto: '../velgen/carmani-14.png',
    prijs: 189.30, maten: [16, 17, 18], breedte: 7.5, steek: '5x112', et: 35, naafgat: 66.5,
    afwerking: 'gunmetal', keuzes: ['gunmetal', 'zilver', 'zwart-glans'],
    ontwerp: { merk: 'Carmani', stijl: 'spaken', spaken: 5, dubbel: 0.032, bHub: 0.03, bRim: 0.024, concaaf: 0.012, diepteVlak: 0.024, naafR: 0.082, naafGepolijst: false, dopKleur: '#3a3d43' }
  },
  {
    id: 'keskin-kt17', merk: 'Keskin', naam: 'KT17 Hurricane MBFP', foto: '../velgen/keskin-kt17.jpg',
    prijs: 331.54, maten: [19, 20, 21], breedte: 9.5, steek: '5x120', et: 38, naafgat: 74.1,
    afwerking: 'zwart-gepolijst', keuzes: ['zwart-gepolijst', 'zwart-mat', 'zilver'],
    ontwerp: { merk: 'Keskin', stijl: 'spaken', spaken: 15, bHub: 0.021, bRim: 0.018, kromming: 0.055, concaaf: 0.026, diepteVlak: 0.022, naafR: 0.07, dopKleur: '#d7d9dc', dopTekst: '#1a1b1d' }
  },
  {
    id: 'keskin-kt20', merk: 'Keskin', naam: 'KT20 BPRI', foto: '../velgen/keskin-kt20.jpg',
    prijs: 231.61, maten: [18, 19, 20], breedte: 8, steek: '5x112', et: 30, naafgat: 72.6,
    afwerking: 'zwart-mat', keuzes: ['zwart-mat', 'zwart-glans', 'gunmetal'],
    ontwerp: { merk: 'Keskin', stijl: 'spaken', spaken: 10, splits: 0.50, armHoek: 0.18, armBreedte: 0.014, bHub: 0.03, bRim: 0.018, concaaf: 0.018, diepteVlak: 0.022, naafR: 0.07, accent: 'binnenrood', dopKleur: '#d7d9dc', dopTekst: '#1a1b1d' }
  },
  {
    id: 'mam-w4', merk: 'MAM', naam: 'W4 SL', foto: '../velgen/mam-w4.jpg',
    prijs: 168.11, maten: [16, 17, 18], breedte: 7, steek: '4x108', et: 35, naafgat: 63.4,
    afwerking: 'zilver', keuzes: ['zilver', 'zwart-glans', 'zwart-mat'],
    ontwerp: { merk: 'MAM', stijl: 'spaken', spaken: 5, bHub: 0.056, bRim: 0.05, concaaf: 0.01, diepteVlak: 0.026, naafR: 0.085, dopKleur: '#b3121c', dopTekst: '#ffffff' }
  },
  {
    id: 'seventy9-svc', merk: 'seventy9', naam: 'SV-C BG', foto: '../velgen/seventy9.jpg',
    prijs: 202.58, maten: [18, 19, 20], breedte: 8, steek: '5x114.3', et: 40, naafgat: 73.1,
    afwerking: 'zwart-glans', keuzes: ['zwart-glans', 'zwart-mat', 'brons'],
    ontwerp: { merk: '79', stijl: 'spaken', spaken: 10, splits: 0.36, armHoek: 0.20, armBreedte: 0.012, bHub: 0.024, bRim: 0.014, concaaf: 0.03, diepteVlak: 0.022, naafR: 0.07, dopKleur: '#111214' }
  }
];

export const KLAUWEN = [['Standaard', '#4a4d53'], ['Rood', '#c8102e'], ['Geel', '#f0b400'], ['Blauw', '#1d5fd6'], ['Zwart', '#15161a']];
export const LAKKEN = [['Origineel', null], ['Wit', '#eef0f2'], ['Zwart', '#101113'], ['Nardo grijs', '#8b8f92'], ['Zilver', '#b8bdc3'], ['Blauw', '#1f4f9c'], ['Rood', '#a8121e'], ['Donkergroen', '#1e4436'], ['Zandbeige', '#b7a58a']];
