# AVD Velgen – 3D Velgen Simulator

Interactieve 3D-configurator voor [avdvelgen.be](https://avdvelgen.be): de bezoeker kiest een
velgdesign, maat, afwerking, band en remklauwkleur, bekijkt het resultaat in 3D en vraagt met
één klik een offerte aan.

Volledig statisch (HTML + CSS + JavaScript, Three.js lokaal meegeleverd), dus geen build-stap,
geen server en geen externe afhankelijkheden nodig.

## Functies

- **Velgmodus** en **automodus**: bekijk de velg los of gemonteerd op een sedan, SUV, hatchback of coupé
  in 7 carrosseriekleuren. De wielkasten worden exact rond het gekozen wiel gesneden en er wordt per
  rebuild precies één velg per wielkast geplaatst (geen dubbele of zwevende velgen).
- 10 procedureel opgebouwde velgdesigns, genoemd naar en geïnspireerd op de Carbonado-collectie
  (Master, Rebellion, Beast, Crazy, Anomaly, Retro, Prestige, Rich, Shine, Concave)
- Diameter 15"–22", breedte 6.5J–11J, steekmaat (5x108 … 5x120), instelbare concaviteit
- 11 afwerkingen met Carbonado-kleurcodes (BG, DMB, A, GR, S, HS, CH, …)
- Lip- en spaakafwerking met code: Front Polished (FP), Lip Polished (LP), zwarte lip; de samenvatting toont de
  gecombineerde code, bv. **BFP** = Black Front Polished
- Band aan/uit met profielkeuze en automatisch berekende bandmaat (bv. 245/35 R19)
- Remschijf en remklauw in 6 kleuren
- Drie achtergronden, auto-rotatie, slepen/zoomen
- **Offerte aanvragen** (opent e-mail naar info@aluvelgen-avd.be met volledige configuratie, met kopieerbare
  tekst als terugval), **link delen** (configuratie zit in de URL), **afbeelding opslaan** (PNG)
- Contactblok met adres, telefoon, e-mail en openingsuren van AVD AluVelgen Detailing
- Responsief: werkt op desktop, tablet en smartphone

## Lokaal bekijken

Open `index.html` via een lokale webserver (ES-modules laden niet via `file://`):

```bash
python3 -m http.server 8000
# daarna: http://localhost:8000
```

## Op avdvelgen.be plaatsen

1. Zet de volledige map (`index.html`, `css/`, `js/`, `assets/`, `vendor/`) op de webserver,
   bv. onder `https://avdvelgen.be/simulator/`.
2. Link ernaar vanuit het menu, of sluit de simulator in op een bestaande pagina:

```html
<iframe src="https://avdvelgen.be/simulator/" title="3D Velgen Simulator"
        style="width:100%;height:80vh;border:0;border-radius:12px" allow="fullscreen"></iframe>
```

GitHub Pages werkt ook: zet Pages aan op deze branch en de simulator staat meteen online.

## Aanpassen aan de huisstijl

Alle instellingen staan in `js/config.js`:

| Wat | Waar |
|---|---|
| Bedrijfsnaam, adres, telefoon, e-mailadres voor offertes, openingsuren, merknaam, tekst op de naafdop | `SHOP` |
| Velgdesigns (aantal spaken, breedte, lipdiepte, concaviteit) | `DESIGNS` |
| Afwerkingen/kleuren van de velg | `FINISHES` |
| Remklauwkleuren | `CALIPER_COLORS` |
| Beschikbare maten, steekmaten en bandprofielen | `DIAMETERS`, `WIDTHS`, `PCDS`, `PROFILES` |
| Auto's (afmetingen, silhouet, wielposities) en carrosseriekleuren | `CARS`, `CAR_COLORS` |
| Standaardconfiguratie bij het openen | `DEFAULT_STATE` |

- Logo: vervang `assets/logo.svg` en `assets/favicon.svg` door het echte AVD Velgen-logo.
- Huisstijlkleur: pas `--accent` aan bovenaan `css/style.css`.

## Technisch

- `js/wheel.js` bouwt velg, band en remmen op uit parameters (geen 3D-bestanden nodig).
- `js/car.js` bouwt de carrosserie: zijprofiel met uitgesneden wielkasten, getinte kooi, dakpaneel,
  verlichting en details. De wielposities komen uit dezelfde maten als de wielkasten.
- `js/app.js` beheert scène, belichting (PBR met omgevingsreflecties), UI en acties.
- `vendor/three/` bevat Three.js r160 (MIT-licentie, zie `vendor/three/LICENSE`).

## Bekende beperkingen

- De velgdesigns zijn benaderingen; ze zijn niet de exacte Carbonado-geometrie.
- De bedrijfsgegevens komen uit openbare bronnen (zoekresultaten); controleer e-mailadres en telefoonnummer.

## Mogelijke uitbreidingen

- Echte velgmodellen (glTF) uit de catalogus laden in plaats van procedurele designs
- Echte automodellen (glTF) per merk/model
- Offerteformulier dat rechtstreeks naar een CRM of e-mailservice post
