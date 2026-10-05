# AVD Velgen · "Bekijk op je auto"

Sjabloon voor avdvelgen.be: op de productpagina van een velg kiest de klant zijn wagen en ziet de velg eronder. Drie weergaven:

1. **Modelauto (2D)**: schematische auto op ware verhoudingen (wielbasis, bandhoogte, velgmaat), in `avd-velg-op-auto.js`. Werkt op elke productpagina zonder extra bestanden.
2. **Foto van je eigen auto**: de klant uploadt een zijaanzicht, sleept twee cirkels over zijn wielen. De foto verlaat de browser niet.
3. **3D op een echte auto**: `demo/3d/` laadt een 3D-model van een echte wagen (three.js), haalt de originele velgen weg en zet de velg uit de productfoto erop. Draaien, kleur, remklauwen, velgmaat 17 tot 21".

De velg zelf wordt in alle drie de gevallen automatisch uit de bestaande productfoto's van de winkel gehaald: het script kiest de meest frontale foto, trekt het velgvlak recht, maakt de witte achtergrond en de gaten tussen de spaken doorzichtig. Er hoeft dus niets per velg getekend te worden.

## Bestanden

| Bestand | Wat |
|---|---|
| `avd-velg-op-auto.js` | De plug-in (2D + fotomodus + knop op de productpagina). Eén bestand, geen afhankelijkheden. |
| `demo/index.html` | Nagebouwde productpagina met dezelfde HTML-klassen als avdvelgen.be, negen echte velgen uit de winkel. |
| `demo/3d/index.html` | 3D-weergave. Laadt three.js van jsDelivr en `ferrari-458.glb`. |
| `demo/velgen/` | Productfoto's van de winkel voor de demo. |
| `serve.mjs` | `node serve.mjs` → http://localhost:8190/demo/ |
| `test/autos.html` | Alle 2D-carrosserieën naast elkaar (`?ids=…&inch=…`). |

## Inbouwen op avdvelgen.be

Op de productpagina, onder de bestaande scripts:

```html
<script>
  window.AVD_VELG_OP_AUTO = { url3d: '/velg-3d/' };   // url3d weglaten = geen 3D-knop
</script>
<script src="/js/avd-velg-op-auto.js" defer></script>
```

Het script leest zelf `h1`, de `.data-li` technische gegevens (Maat, Breedte, Steek, Naafgat), `.shop-product-price-gross .val` en de `img.product-image` foto's, en zet de knop onder `.sell-box-form`. "Set van 4 in winkelwagen" vult `#productPageQuantity` in en klikt de bestaande `.btn-cart`.

Wil je per velg een betere frontale foto gebruiken, zet dan ergens op de pagina `<div data-avd-vooraanzicht="/media/…/velg-front.png"></div>`.

Andere instellingen: `setAantal` (standaard 4), `extraAutos` (zelfde vorm als de lijst in het script: merk, model, carrosserie, lengte, wielbasis, hoogte, originele band, steek, naafgat), `onInWinkelwagen(product, aantal, auto)`.

Eigen wagens: de lijst in het script bevat 31 populaire modellen met steek en naafgat; het formulier "Zoek je velgen" op de site heeft de volledige database (`/model-search` geeft JSON terug). Die kan in een tweede stap gekoppeld worden zodat de gekozen wagen uit de zoekbalk meteen in de weergave staat.

## Stand van zaken 3D (28 september 2026)

Alle 31 wagens uit de lijst hebben een echt 3D-model in `demo/3d/modellen/` (samen 54 MB, 0,5 tot 8 MB per wagen). Overzicht van alle zijaanzichten: `test/shots/alle-zij-3.png` (gemaakt door de 3D-pagina zelf, zie `window.__laadAuto` en `/shot` in `serve.mjs`).

* 25 wagens: wielen automatisch herkend als losse meshes, originele velg verborgen, AVD-velg erop.
* 6 wagens met wielen versmolten in de carrosserie (Kuga, C-Klasse, Corsa, Clio, Corolla, Tiguan): wielpositie geschat uit de contactpunten op de grond en de wielbasis uit de wagenlijst, eigen band getekend. Ziet er goed uit, staat als "(geschat)" in de controle.
* Vervangers omdat er geen exact CC-BY-model is: Focus Mk3 2012, Kuga 2010, C-Klasse W205, GLC 2020, A3 als S3, A-Klasse als A45, Mazda 3 sedan, 208 als e-208. Staat per model als `opmerking` in `tools/modellen.json` en wordt in de 3D-pagina getoond.
* Mini: eerste keuze was een rally-uitvoering, vervangen door "Mini Cooper S Facelift" (Mona x Supercars).
* Modellen met één wit materiaal (Q5, F40, 208, Passat, Corsa, Clio, A-Klasse) krijgen automatisch een lakmateriaal op de carrosserie ("klei"-weergave), de kleurkeuze werkt daar dus ook.

Bij het toevoegen van een nieuwe wagen: regel in `tools/maak-manifest.mjs` (id + Sketchfab-uid), `node tools/maak-manifest.mjs`, zip in `tools/download/`, `node tools/haal-modellen.mjs <id>`, en de wagen zelf in de lijst `AUTOS` van `avd-velg-op-auto.js` (lengte, wielbasis, hoogte, band, steek, naafgat: die maten sturen de schaal en de wielherkenning).

## Echte auto's in 3D: de gekozen route (Sketchfab CC-BY)

`tools/modellen.json` koppelt elk wagen-id aan een Sketchfab-model met naamsvermelding. Modellen binnenhalen:

```bash
node tools/haal-modellen.mjs --lijst
```

Open per wagen de link (ingelogd op sketchfab.com), klik **Download 3D model → glTF** en bewaar de zip in `tools/download/`. Daarna:

```bash
node tools/haal-modellen.mjs
```

Het script herkent elke zip aan de bron-URL in het archief, pakt uit, vereenvoudigt (meshopt), zet texturen om naar WebP 2048 en schrijft een Draco-glb naar `demo/3d/modellen/<id>.glb`. De 3D-pagina normaliseert elk model zelf (lengte langs Z, wielen op de grond, schaal op de echte lengte uit de wagenlijst), herkent de vier wielen automatisch (ronde meshes opzij en onderaan) en verbergt de originele velg. Klopt de herkenning niet, zet dan in `modellen.json` bij dat model `wielen: {fl, fr, rl, rr}` met de nodenamen en eventueel `verbergen`, `velgstraal`, `draai` (180 als de wagen achterstevoren staat; de knop "Wagen staat achterstevoren" in de demo onthoudt dat ook in de browser).

Wat ALCAR echt gebruikt (gemeten op 3dkonfigurator.alcar.be): de nauwkeurige 3D is een ingebedde iframe van **3DTuning** (`alcar.3dtuning.com/embed/<auto>?key=…&default-disks=<velg>`); daarnaast een 2D-terugval met zeven canvaslagen (carrosserie achter, schaduw, band en velg voor, band en velg achter, carrosserie voor) uit vooraf gerenderde afbeeldingen met vaste pixelposities per wagen. Alternatief met dezelfde fotorealistische uitstraling en eigen velgfoto's: de Wheel-Size Wheel Configurator API (EVOX-foto's, ± 4.000 wagens, 1.570 dollar per jaar). Beide zijn afgewezen ten voordele van eigen 3D.

## Andere routes die bekeken zijn

De demo draait op de Ferrari 458 uit de voorbeelden van three.js (model door vicent091036; het Sketchfab-origineel is intussen offline, dus de licentie is niet meer na te kijken). Voor de winkel moet elke wagen een gelicentieerd model zijn. Opties, van goedkoop naar volledig:

| Optie | Kost | Wat je krijgt |
|---|---|---|
| **Sketchfab, CC Attribution** | gratis, naamsvermelding | Downloadbare glTF's van echte modellen, bv. Tesla Model 3 (684k vlakken, CC-BY), BMW E46 Touring, Audi A4 B8 Allroad. Kwaliteit wisselt, veel modellen zijn NonCommercial en dus niet bruikbaar. Per model controleren, en zwaar: vaak 500k+ vlakken, dus eerst vereenvoudigen (gltf-transform / Blender decimate) tot ± 100k. |
| **Hum3D / 3DModels.org, Squir** | ± 100 tot 450 dollar per model, eenmalig | Nauwkeurige modellen van vrijwel elke recente wagen, met losse wielnodes. Squir verkoopt ook bundels (30 gemengde modellen 899 dollar). Editorial/commerciële licentie per model nakijken; voor een configurator is de "commercial" variant nodig. |
| **ALCAR 3D Wielconfigurator** | via ALCAR Benelux (dealerportaal) | Kant-en-klare 3D-configurator met meer dan 1.400 wagens, maar alleen voor ALCAR-merken (AEZ, Dezent, Dotz, Enzo). Voor Carbonado, Keskin, MAM, Borbet, Carmani, seventy9 dus niet bruikbaar. |
| **Velonity / DF Automotive** | eigen platform | Meer dan 1.100 wagens en 10.000 velgen, niet als los product te licentiëren. Laat wel zien wat de norm is. |

Aanbeveling: start met de tien wagens die het vaakst via "Zoek je velgen" gezocht worden, koop die bij Hum3D (± 2.000 tot 4.000 euro eenmalig), vereenvoudig ze tot ± 100k vlakken en bewaar ze als Draco-glb (2 tot 4 MB per wagen). De 3D-pagina hoeft daarvoor niet te veranderen: per model volstaat een klein bestandje met de namen van de wielnodes, de velgstraal en de camerastandpunten.

Wat er wel per model ingesteld moet worden (nu hard gecodeerd voor de Ferrari in `demo/3d/index.html`): welke nodes de velgen zijn (`rim_fl`…), de straal van de velgrand (0,282 m) en de richting van de as.

## Technisch

* Velgvrijstelling: masker op kleine schaal → bepaalt of de foto frontaal of licht gedraaid is (positie van het hoogste punt) → knipt de ellips van het velgvlak en trekt die recht naar een cirkel → witte vlakken die de rand raken of groot en helder zijn worden doorzichtig, kleine glimlichten op gepolijste spaken blijven. Resultaat als PNG-data-URL, gecachet per product.
* Foto's moeten van hetzelfde domein komen of `Access-Control-Allow-Origin` meegeven, anders is het canvas "tainted" en valt het script terug op de gewone foto in een cirkel.
* Toegankelijk: `<dialog>`, focus zichtbaar, wielen in de fotomodus ook met de pijltjestoetsen te verschuiven, kleurstalen als radioknoppen met naam.
* Getest in Chromium; `dialog.showModal`, `aspect-ratio` en `dvh` vragen een browser van 2022 of later.

## Velgensimulator (5 oktober 2026)

Nieuwe 3D-aanpak in `demo/simulator/`: de velgen zijn echte 3D-modellen (spaken, lip, naaf met boutgaten
volgens de steek, naafdop, band met profiel, remschijf en remklauw), opgebouwd uit een ontwerp per velg in
`demo/3d/ontwerpen.js` door `demo/3d/velg3d.js`. De productfoto wordt niet meer op een schijf geplakt.

* Studio: de velg op een draaiplateau met studio-belichting (`demo/3d/studio.js`), vooraanzicht, schuin, detail.
* Op je wagen: dezelfde 31 wagens als voorheen; het originele wiel (velg én band) wordt verborgen en vervangen door
  het nieuwe wiel in de gekozen maat, met band volgens `bandVoorstel` (zelfde omtrek als origineel). Wagenlader
  zonder DOM in `demo/3d/auto3d.js`.
* Instellingen: wagen, velg (met "past"/steek-badge), maat per velg, afwerking per velg, remklauw, lak van de wagen.
  Samenvatting met steek/ET/naafgat, bandvoorstel, waarschuwingen (steek, naafgat, +3 inch, omtrek) en prijs voor
  een set van 4; knoppen voor winkelwagen, afbeelding bewaren en link kopiëren (alle keuzes staan in de URL).
* Controlepagina: `test/velgen.html` (alle negen velgen naast elkaar, `?velg=i&hoek=…&afw=…`).

Open: http://localhost:8190/demo/simulator/ (na `node serve.mjs`).
