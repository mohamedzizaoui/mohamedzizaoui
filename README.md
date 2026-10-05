# AVD Velgen – 3D Velgen Simulator

Interactieve 3D-configurator voor [avdvelgen.be](https://avdvelgen.be): de bezoeker kiest een
velgdesign, maat, afwerking, band en remklauwkleur, bekijkt het resultaat in 3D en vraagt met
één klik een offerte aan.

Volledig statisch (HTML + CSS + JavaScript, Three.js lokaal meegeleverd), dus geen build-stap,
geen server en geen externe afhankelijkheden nodig.

## Functies

- 10 procedureel opgebouwde velgdesigns (5-spaaks, split, multi-spoke, mesh, turbine, deep dish, …)
- Diameter 15"–22", breedte 6.5J–11J, instelbare concaviteit
- 11 afwerkingen (glanzend/mat zwart, gunmetal, zilver, chroom, brons, goud, …)
- Lip- en spaakafwerking: zelfde, gepolijst, diamond cut, zwarte lip
- Band aan/uit met profielkeuze en automatisch berekende bandmaat (bv. 245/35 R19)
- Remschijf en remklauw in 6 kleuren
- Drie achtergronden, auto-rotatie, slepen/zoomen
- **Offerte aanvragen** (opent e-mail met volledige configuratie), **link delen** (configuratie zit in de URL),
  **afbeelding opslaan** (PNG)
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
| Bedrijfsnaam, website, **e-mailadres voor offertes**, tekst op de naafdop | `SHOP` |
| Velgdesigns (aantal spaken, breedte, lipdiepte, concaviteit) | `DESIGNS` |
| Afwerkingen/kleuren van de velg | `FINISHES` |
| Remklauwkleuren | `CALIPER_COLORS` |
| Beschikbare maten en bandprofielen | `DIAMETERS`, `WIDTHS`, `PROFILES` |
| Standaardconfiguratie bij het openen | `DEFAULT_STATE` |

- Logo: vervang `assets/logo.svg` en `assets/favicon.svg` door het echte AVD Velgen-logo.
- Huisstijlkleur: pas `--accent` aan bovenaan `css/style.css`.

## Technisch

- `js/wheel.js` bouwt velg, band en remmen op uit parameters (geen 3D-bestanden nodig).
- `js/app.js` beheert scène, belichting (PBR met omgevingsreflecties), UI en acties.
- `vendor/three/` bevat Three.js r160 (MIT-licentie, zie `vendor/three/LICENSE`).

## Mogelijke uitbreidingen

- Velg tonen op een automodel (vereist 3D-modellen per wagen)
- Echte velgmodellen (glTF) uit de catalogus laden in plaats van procedurele designs
- Offerteformulier dat rechtstreeks naar een CRM of e-mailservice post
