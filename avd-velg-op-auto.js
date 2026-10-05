/*!
 * AVD Velgen · "Bekijk op je auto"
 * Plug-in voor de productpagina: de klant kiest zijn wagen en ziet de gekozen velg eronder.
 * Eén bestand, geen afhankelijkheden. Op avdvelgen.be leest het script zelf de productgegevens
 * (titel, Maat, Breedte, Steek, Naafgat, prijs en foto's) en plaatst het een knop onder de winkelwagenknop.
 *
 * Instellen (optioneel), vóór dit script:
 *   window.AVD_VELG_OP_AUTO = { setAantal: 4, extraAutos: [...], onInWinkelwagen: fn }
 */
(function () {
  'use strict';
  if (window.AVDVelgOpAuto) return;

  var CFG = Object.assign({
    autoMount: true,           // knop automatisch op de productpagina plaatsen
    setAantal: 4,              // aantal velgen in een set
    email: 'info@avdvelgen.be',
    extraAutos: [],            // eigen wagens toevoegen, zelfde vorm als AUTOS hieronder
    url3d: null,               // pagina met de 3D-weergave (krijgt ?velg=…&inch=… mee); leeg = geen 3D-knop
    onInWinkelwagen: null      // eigen afhandeling; standaard wordt de bestaande winkelwagenknop gebruikt
  }, window.AVD_VELG_OP_AUTO || {});

  /* ------------------------------------------------------------------ *
   *  Gegevens
   * ------------------------------------------------------------------ */

  // Verhoudingen per carrosserie (fracties van de hoogte H of wielbasis WB)
  var VORMEN = {
    hatch:    { belt: .66,  hood: .52, nose: .38, sill: .15, cowl: .235, rake: 1.55, fo: .205 },
    sedan:    { belt: .645, hood: .50, nose: .37, sill: .15, cowl: .27,  rake: 1.8,  fo: .175 },
    estate:   { belt: .65,  hood: .51, nose: .37, sill: .15, cowl: .26,  rake: 1.75, fo: .185 },
    suv:      { belt: .66,  hood: .56, nose: .42, sill: .19, cowl: .23,  rake: 1.4,  fo: .195 },
    suvcoupe: { belt: .64,  hood: .53, nose: .40, sill: .18, cowl: .23,  rake: 1.6,  fo: .19 },
    fastback: { belt: .64,  hood: .47, nose: .36, sill: .15, cowl: .22,  rake: 2.0,  fo: .18 },
    mini:     { belt: .66,  hood: .56, nose: .42, sill: .16, cowl: .25,  rake: 1.35, fo: .18 }
  };

  var CARROSSERIE = {
    hatch: 'Hatchback', sedan: 'Sedan', estate: 'Break', suv: 'SUV',
    suvcoupe: 'SUV-coupé', fastback: 'Fastback', mini: 'Compact'
  };

  // [merk, model, carrosserie, lengte, wielbasis, hoogte (mm), originele band, steek, naafgat]
  // Indicatieve fabrieksgegevens. Uitbreiden kan via window.AVD_VELG_OP_AUTO.extraAutos.
  var AUTOS = [
    ['Audi', 'A3 Sportback (8Y, 2020-)', 'hatch', 4343, 2636, 1449, '225/45R17', '5x112', 57.1],
    ['Audi', 'A4 Avant (B9, 2015-)', 'estate', 4762, 2820, 1435, '225/50R17', '5x112', 66.5],
    ['Audi', 'Q5 (FY, 2017-)', 'suv', 4682, 2819, 1662, '235/60R18', '5x112', 66.5],
    ['BMW', '1 Reeks (F40, 2019-)', 'hatch', 4319, 2670, 1434, '225/45R17', '5x112', 66.5],
    ['BMW', '3 Reeks (G20, 2019-)', 'sedan', 4709, 2851, 1442, '225/50R17', '5x112', 66.5],
    ['BMW', '3 Reeks (F30, 2012-2019)', 'sedan', 4624, 2810, 1429, '225/50R17', '5x120', 72.6],
    ['BMW', 'X3 (G01, 2017-)', 'suv', 4708, 2864, 1676, '225/60R18', '5x112', 66.5],
    ['Ford', 'Focus (IV, 2018-)', 'hatch', 4378, 2700, 1452, '215/50R17', '5x108', 63.4],
    ['Ford', 'Kuga (III, 2019-)', 'suv', 4614, 2710, 1666, '225/60R18', '5x108', 63.4],
    ['Hyundai', 'Tucson (NX4, 2020-)', 'suv', 4500, 2680, 1650, '235/55R19', '5x114.3', 67.1],
    ['Kia', 'Sportage (NQ5, 2021-)', 'suv', 4515, 2680, 1645, '235/55R19', '5x114.3', 67.1],
    ['Mazda', '3 (BP, 2019-)', 'hatch', 4460, 2725, 1435, '215/45R18', '5x114.3', 67.1],
    ['Mercedes-Benz', 'A-Klasse (W177, 2018-)', 'hatch', 4419, 2729, 1440, '205/55R17', '5x112', 66.6],
    ['Mercedes-Benz', 'C-Klasse (W206, 2021-)', 'sedan', 4751, 2865, 1438, '225/50R17', '5x112', 66.6],
    ['Mercedes-Benz', 'GLC (X254, 2022-)', 'suv', 4716, 2888, 1640, '235/55R19', '5x112', 66.6],
    ['Mini', 'Cooper (F56, 2014-2024)', 'mini', 3821, 2495, 1414, '195/55R16', '5x112', 66.5],
    ['Nissan', 'Qashqai (J12, 2021-)', 'suv', 4425, 2665, 1625, '215/60R17', '5x114.3', 66.1],
    ['Opel', 'Corsa (F, 2019-)', 'hatch', 4060, 2538, 1435, '195/55R16', '4x108', 65.1],
    ['Peugeot', '208 (II, 2019-)', 'hatch', 4055, 2540, 1430, '195/55R16', '4x108', 65.1],
    ['Peugeot', '308 (III, 2021-)', 'hatch', 4367, 2675, 1441, '225/40R18', '5x108', 65.1],
    ['Renault', 'Clio (V, 2019-)', 'hatch', 4050, 2583, 1440, '195/55R16', '4x100', 60.1],
    ['Skoda', 'Octavia Combi (IV, 2020-)', 'estate', 4689, 2686, 1468, '225/45R17', '5x112', 57.1],
    ['Tesla', 'Model 3 (2017-)', 'fastback', 4720, 2875, 1441, '235/45R18', '5x114.3', 64.1],
    ['Tesla', 'Model Y (2020-)', 'suvcoupe', 4751, 2890, 1624, '255/45R19', '5x114.3', 64.1],
    ['Toyota', 'Corolla (E210, 2019-)', 'hatch', 4370, 2640, 1435, '225/45R17', '5x114.3', 60.1],
    ['Toyota', 'RAV4 (XA50, 2019-)', 'suv', 4600, 2690, 1685, '225/60R18', '5x114.3', 60.1],
    ['Volkswagen', 'Golf 8 (2020-)', 'hatch', 4284, 2636, 1456, '225/45R17', '5x112', 57.1],
    ['Volkswagen', 'Polo (AW, 2017-)', 'hatch', 4053, 2552, 1461, '205/55R16', '5x100', 57.1],
    ['Volkswagen', 'Passat Variant (B8, 2014-2023)', 'estate', 4767, 2791, 1477, '215/55R17', '5x112', 57.1],
    ['Volkswagen', 'Tiguan (II, 2016-2024)', 'suv', 4486, 2681, 1673, '235/55R18', '5x112', 57.1],
    ['Volvo', 'XC60 (II, 2017-)', 'suv', 4708, 2865, 1658, '235/55R19', '5x108', 63.4]
  ].concat(CFG.extraAutos || []).map(function (r) {
    return { id: slug(r[0] + '-' + r[1]), merk: r[0], model: r[1], type: r[2], L: r[3], WB: r[4], H: r[5], band: r[6], steek: r[7], naafgat: r[8] };
  });

  // Algemene carrosserie als het model niet in de lijst staat
  var ALGEMEEN = [
    { id: 'alg-hatch', merk: 'Ander model', model: 'Hatchback', type: 'hatch', L: 4300, WB: 2640, H: 1460, band: '225/45R17' },
    { id: 'alg-sedan', merk: 'Ander model', model: 'Sedan', type: 'sedan', L: 4720, WB: 2850, H: 1440, band: '225/50R17' },
    { id: 'alg-estate', merk: 'Ander model', model: 'Break', type: 'estate', L: 4720, WB: 2780, H: 1470, band: '225/50R17' },
    { id: 'alg-suv', merk: 'Ander model', model: 'SUV', type: 'suv', L: 4600, WB: 2720, H: 1660, band: '235/55R18' }
  ];

  var LAKKEN = [
    { id: 'wit', naam: 'Wit', kleur: '#eef0f2' },
    { id: 'zwart', naam: 'Zwart', kleur: '#17181b' },
    { id: 'nardo', naam: 'Nardo grijs', kleur: '#8b8f92' },
    { id: 'zilver', naam: 'Zilver', kleur: '#b8bdc3' },
    { id: 'blauw', naam: 'Blauw', kleur: '#1f4f9c' },
    { id: 'rood', naam: 'Rood', kleur: '#a8121e' },
    { id: 'groen', naam: 'Donkergroen', kleur: '#1e4436' },
    { id: 'zand', naam: 'Zandbeige', kleur: '#b7a58a' }
  ];

  var REMKLAUWEN = [
    { id: 'grijs', naam: 'Standaard', kleur: '#55595f' },
    { id: 'rood', naam: 'Rood', kleur: '#c8102e' },
    { id: 'geel', naam: 'Geel', kleur: '#f0b400' },
    { id: 'blauw', naam: 'Blauw', kleur: '#1d5fd6' }
  ];

  /* ------------------------------------------------------------------ *
   *  Hulpfuncties
   * ------------------------------------------------------------------ */

  function slug(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function n(v) { return Math.round(v * 10) / 10; }
  function P(x, h) { return n(x) + ' ' + n(-h); }          // punt: x vooruit, h hoogte boven de grond
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function euro(v) { return '€ ' + v.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function normSteek(s) { return s ? String(s).replace(/\s/g, '').replace(',', '.').toLowerCase() : ''; }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem('avdv:' + k); localStorage.setItem('avdv:' + k, v); } catch (e) { return null; } }

  function leesBand(s) {
    var m = /(\d{3})\/(\d{2})\s*Z?R?\s*(\d{2})/i.exec(s || '');
    if (!m) return null;
    var b = +m[1], p = +m[2], r = +m[3];
    return { b: b, p: p, r: r, od: r * 25.4 + 2 * b * p / 100, txt: b + '/' + p + ' R' + r };
  }

  // Band voor de nieuwe velg met (bijna) dezelfde buitendiameter als de originele band
  function bandVoorstel(orig, inch, breedteJ) {
    var doel = breedteJ ? breedteJ * 25.4 + 25 : orig.b;
    var maten = [185, 195, 205, 215, 225, 235, 245, 255, 265, 275, 285, 295];
    var b = maten.reduce(function (a, c) { return Math.abs(c - doel) < Math.abs(a - doel) ? c : a; });
    var p = clamp(Math.round(((orig.od - inch * 25.4) / 2) / b * 100 / 5) * 5, 20, 70);
    var od = inch * 25.4 + 2 * b * p / 100;
    return { b: b, p: p, r: inch, od: od, txt: b + '/' + p + ' R' + inch, verschil: (od - orig.od) / orig.od * 100 };
  }

  /* ------------------------------------------------------------------ *
   *  Productgegevens van de pagina lezen
   * ------------------------------------------------------------------ */

  function leesProductVanPagina() {
    var specs = {};
    document.querySelectorAll('.data-li').forEach(function (li) {
      var t = li.querySelector('.data-li-title');
      if (!t) return;
      specs[t.textContent.replace(':', '').trim().toLowerCase()] = li.textContent.replace(t.textContent, '').trim();
    });
    if (!specs.maat) return null;
    var h1 = document.querySelector('h1');
    var titel = h1 ? h1.textContent.trim() : 'Velg';
    var fotos = [];
    document.querySelectorAll('img.product-image').forEach(function (img) {
      var s = img.getAttribute('src');
      if (s && fotos.indexOf(s) < 0) fotos.push(s);
    });
    var prijsEl = document.querySelector('.shop-product-price-gross .val');
    var prijs = prijsEl ? parseFloat(prijsEl.textContent.replace(/[^\d,]/g, '').replace(',', '.')) : null;
    var voor = document.querySelector('[data-avd-vooraanzicht]');
    return {
      naam: titel.replace(/^Aluvelgen\s+\d+[`'"’´]?\s+\S+\s+/i, '') || titel,
      titel: titel,
      inch: parseFloat(specs.maat),
      breedte: parseFloat(String(specs.breedte || '').replace(',', '.')) || null,
      steek: normSteek(specs.steek),
      naafgat: parseFloat(String(specs.naafgat || '').replace(',', '.')) || null,
      et: specs.et || null,
      kleur: specs.kleur || '',
      fotos: fotos,
      vooraanzicht: voor ? voor.getAttribute('data-avd-vooraanzicht') : null,
      prijs: isFinite(prijs) ? prijs : null
    };
  }

  /* ------------------------------------------------------------------ *
   *  Velgfoto omzetten naar een recht vooraanzicht met transparante achtergrond
   * ------------------------------------------------------------------ */

  var velgCache = {};

  function laadBeeld(src) {
    return new Promise(function (ok, fout) {
      var i = new Image();
      i.decoding = 'async';
      i.onload = function () { ok(i); };
      i.onerror = fout;
      i.src = src;
    });
  }

  // Masker van alles wat geen witte achtergrond is, op kleine schaal
  function analyseer(img, S) {
    var k = S / Math.max(img.naturalWidth, img.naturalHeight);
    var w = Math.round(img.naturalWidth * k), h = Math.round(img.naturalHeight * k);
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(img, 0, 0, w, h);
    var d = x.getImageData(0, 0, w, h).data;  // gooit een fout als de foto van een ander domein komt
    var m = new Uint8Array(w * h), minX = w, maxX = -1, minY = h, maxY = -1;
    for (var i = 0; i < w * h; i++) {
      var r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2], a = d[i * 4 + 3];
      var mn = Math.min(r, g, b), mx = Math.max(r, g, b);
      if (a > 40 && !(mn > 232 && mx - mn < 18)) {
        m[i] = 1;
        var X = i % w, Y = (i / w) | 0;
        if (X < minX) minX = X; if (X > maxX) maxX = X;
        if (Y < minY) minY = Y; if (Y > maxY) maxY = Y;
      }
    }
    return { k: k, w: w, h: h, m: m, minX: minX, maxX: maxX, minY: minY, maxY: maxY };
  }

  // Zoek het velgvlak (ellips) in de foto. Productfoto's staan meestal licht gedraaid,
  // met de velgrand zichtbaar aan één kant; het vlak zelf raakt dan de andere kant.
  function velgVlak(A) {
    var w = A.w, m = A.m, bw = A.maxX - A.minX + 1;
    var sx = 0, cnt = 0;
    for (var y = A.minY; y <= A.minY + 2; y++) for (var x = A.minX; x <= A.maxX; x++) if (m[y * w + x]) { sx += x; cnt++; }
    var topX = cnt ? sx / cnt : (A.minX + A.maxX) / 2;
    var midX = (A.minX + A.maxX) / 2;
    var rechts = topX >= midX;
    // hoogte van het midden: rijen waar het vlak de buitenkant raakt
    var sy = 0, ny = 0;
    for (y = A.minY; y <= A.maxY; y++) {
      var rand = rechts ? A.maxX : A.minX;
      if (m[y * w + rand] || m[y * w + rand + (rechts ? -1 : 1)]) { sy += y; ny++; }
    }
    var cy = ny ? sy / ny : (A.minY + A.maxY) / 2;
    var b = cy - A.minY;
    var frontaal = Math.abs(topX - midX) < bw * 0.015;
    if (frontaal || !(b > 0)) {
      var r = bw / 2;
      return { cx: midX + 0.5, cy: A.minY + r, a: r, b: r, frontaal: true };
    }
    var a = b * 0.93;  // gemeten op de AVD-productfoto's: vlakbreedte ≈ 0,93 × hoogte
    return { cx: rechts ? A.maxX + 1 - a : A.minX + a, cy: cy, a: a, b: b, frontaal: false };
  }

  function kiesFoto(analyses) {
    var best = null, bestScore = Infinity;
    analyses.forEach(function (x) {
      if (!x || !x.A) return;
      var A = x.A, S = Math.max(A.w, A.h);
      var bw = A.maxX - A.minX + 1, bh = A.maxY - A.minY + 1;
      var hoeken = A.m[0] + A.m[A.w - 1] + A.m[A.w * (A.h - 1)] + A.m[A.w * A.h - 1];
      if (hoeken > 0 || bw < S * 0.6 || bh / bw < 0.93 || bh / bw > 1.08) return; // detailfoto of schuin van boven
      var v = velgVlak(A);
      var score = (v.frontaal ? 0 : 1) + x.i * 0.01;
      if (score < bestScore) { bestScore = score; best = { img: x.img, A: A, v: v }; }
    });
    return best;
  }

  function maakVelg(bronnen) {
    var sleutel = bronnen.join('|');
    if (velgCache[sleutel]) return velgCache[sleutel];
    var p = Promise.all(bronnen.slice(0, 6).map(function (src, i) {
      return laadBeeld(src).then(function (img) {
        try { return { img: img, i: i, A: analyseer(img, 300) }; }
        catch (e) { return { img: img, i: i, besmet: true }; }
      }, function () { return null; });
    })).then(function (lijst) {
      var gekozen = kiesFoto(lijst);
      if (!gekozen) {
        var eerste = lijst.filter(Boolean)[0];
        if (!eerste) throw new Error('Geen foto');
        return { href: eerste.img.src, terugval: true };
      }
      return { href: knipVelg(gekozen), terugval: false, frontaal: gekozen.v.frontaal };
    });
    velgCache[sleutel] = p;
    return p;
  }

  // Knip het velgvlak uit, trek het recht tot een cirkel en maak de witte achtergrond doorzichtig
  function knipVelg(g) {
    var O = 512, k = g.A.k, v = g.v;
    var c = document.createElement('canvas');
    c.width = c.height = O;
    var x = c.getContext('2d', { willReadFrequently: true });
    x.imageSmoothingQuality = 'high';
    x.drawImage(g.img, (v.cx - v.a) / k, (v.cy - v.b) / k, 2 * v.a / k, 2 * v.b / k, 0, 0, O, O);
    var id = x.getImageData(0, 0, O, O), d = id.data, N = O * O;
    var R = O / 2, wit = new Uint8Array(N);
    for (var i = 0; i < N; i++) {
      var r = d[i * 4], gg = d[i * 4 + 1], b = d[i * 4 + 2];
      var mn = Math.min(r, gg, b), mx = Math.max(r, gg, b);
      if (d[i * 4 + 3] < 40 || (mn >= 232 && mx - mn <= 20)) wit[i] = 1;
    }
    // Verbonden witte vlakken: weg als ze de buitenrand raken of groot en helder zijn (achtergrond tussen de spaken).
    // Kleine glimlichten op gepolijste spaken blijven staan.
    var label = new Int32Array(N), stapel = new Int32Array(N), weg = [0], nr = 0;
    for (i = 0; i < N; i++) {
      if (!wit[i] || label[i]) continue;
      nr++;
      var top = 0, opp = 0, som = 0, raakt = false;
      stapel[top++] = i; label[i] = nr;
      while (top) {
        var p = stapel[--top], px = p % O, py = (p / O) | 0;
        opp++;
        som += Math.min(d[p * 4], d[p * 4 + 1], d[p * 4 + 2]);
        if (!raakt && Math.hypot(px + .5 - R, py + .5 - R) > R * 0.9) raakt = true;
        if (px > 0 && wit[p - 1] && !label[p - 1]) { label[p - 1] = nr; stapel[top++] = p - 1; }
        if (px < O - 1 && wit[p + 1] && !label[p + 1]) { label[p + 1] = nr; stapel[top++] = p + 1; }
        if (py > 0 && wit[p - O] && !label[p - O]) { label[p - O] = nr; stapel[top++] = p - O; }
        if (py < O - 1 && wit[p + O] && !label[p + O]) { label[p + O] = nr; stapel[top++] = p + O; }
      }
      weg[nr] = raakt || (opp > N * 0.0012 && som / opp >= 243) ? 1 : 0;
    }
    for (i = 0; i < N; i++) {
      var X = i % O, Y = (i / O) | 0;
      var dist = Math.hypot(X + .5 - R, Y + .5 - R);
      var alpha = d[i * 4 + 3];
      if (label[i] && weg[label[i]]) alpha = 0;
      else if (alpha > 0) {
        // zachte rand naast weggehaalde pixels
        var buur = (X > 0 && label[i - 1] && weg[label[i - 1]]) || (X < O - 1 && label[i + 1] && weg[label[i + 1]]) ||
                   (Y > 0 && label[i - O] && weg[label[i - O]]) || (Y < O - 1 && label[i + O] && weg[label[i + O]]);
        if (buur) {
          var mn2 = Math.min(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]);
          alpha = Math.round(alpha * clamp((252 - mn2) / 40, 0.35, 1));
        }
      }
      if (dist > R - 2) alpha = Math.round(alpha * clamp(R - dist, 0, 2) / 2);
      d[i * 4 + 3] = alpha;
    }
    x.putImageData(id, 0, 0);
    return c.toDataURL('image/png');
  }

  /* ------------------------------------------------------------------ *
   *  Tekenen: auto in zijaanzicht (maten in mm, auto kijkt naar links)
   * ------------------------------------------------------------------ */

  function geometrie(auto) {
    var S = VORMEN[auto.type] || VORMEN.hatch;
    var L = auto.L, WB = auto.WB, H = auto.H;
    var FO = Math.round(L * S.fo), fA = FO, rA = FO + WB, RO = L - rA;
    var belt = H * S.belt, hood = H * S.hood, nose = H * S.nose, sill = H * S.sill, Hh = H - 10;
    var cowlX = fA + WB * S.cowl;
    var rfX = cowlX + (Hh - 30 - belt) * S.rake;
    return { S: S, L: L, WB: WB, H: H, fA: fA, rA: rA, RO: RO, belt: belt, hood: hood, nose: nose, sill: sill, Hh: Hh, cowlX: cowlX, rfX: rfX };
  }

  function achterkant(g, t) {
    var L = g.L, rA = g.rA, RO = g.RO, WB = g.WB, belt = g.belt, Hh = g.Hh, sill = g.sill, rfX = g.rfX;
    var re, rh, c = [], dlo;
    function dak(x, h) {
      var dx = x - rfX;
      c.push('C ' + P(rfX + dx * 0.35, Hh + 6) + ' ' + P(x - dx * 0.3, Hh + 6) + ' ' + P(x, h));
    }
    var bumperHatch = 'C ' + P(L - 4, sill + 220) + ' ' + P(L, sill + 90) + ' ' + P(L - 60, sill + 30);
    if (t === 'hatch' || t === 'mini') {
      re = rA + RO * (t === 'mini' ? 0.62 : 0.42); rh = Hh - 30;
      dak(re, rh);
      c.push('L ' + P(re + 45, Hh - 42));
      c.push('C ' + P(re + 120, Hh - 120) + ' ' + P(L - 80, belt + 260) + ' ' + P(L - 52, belt + 170));
      c.push('C ' + P(L - 28, belt + 80) + ' ' + P(L - 5, belt - 10) + ' ' + P(L - 5, belt - 120));
      c.push(bumperHatch);
      dlo = { C: [re - (t === 'mini' ? 90 : 120), Hh - 75], D: [rA + RO * (t === 'mini' ? 0.36 : 0.2), belt + 65], kromC: [60, 0], kromD: [0, 90] };
    } else if (t === 'sedan' || t === 'fastback') {
      var fb = t === 'fastback';
      re = fb ? rA - WB * 0.28 : rA - WB * 0.12; rh = Hh - (fb ? 25 : 40);
      var deckX = fb ? L - 270 : L - RO * 0.5;
      dak(re, rh);
      c.push('C ' + P(re + (fb ? 420 : 280), Hh - (fb ? 60 : 70)) + ' ' + P(deckX - (fb ? 220 : 260), belt + (fb ? 230 : 190)) + ' ' + P(deckX, belt + (fb ? 170 : 150)));
      c.push('C ' + P(deckX + (fb ? 110 : 200), belt + (fb ? 162 : 142)) + ' ' + P(L - 110, belt + 140) + ' ' + P(L - 38, belt + 116));
      c.push('C ' + P(L - 10, belt + 70) + ' ' + P(L, belt - 40) + ' ' + P(L - 5, belt - 140));
      c.push('C ' + P(L, sill + 200) + ' ' + P(L, sill + 90) + ' ' + P(L - 60, sill + 30));
      dlo = fb ? { C: [re + 150, Hh - 95], D: [rA + 150, belt + 70], kromC: [230, -10], kromD: [-10, 160] }
               : { C: [re - 40, Hh - 78], D: [rA + 60, belt + 60], kromC: [250, -20], kromD: [-20, 200] };
    } else if (t === 'suvcoupe') {
      re = rA - WB * 0.05; rh = Hh - 35;
      dak(re, rh);
      c.push('C ' + P(re + 350, Hh - 75) + ' ' + P(L - 250, belt + 230) + ' ' + P(L - 140, belt + 175));
      c.push('C ' + P(L - 80, belt + 162) + ' ' + P(L - 42, belt + 140) + ' ' + P(L - 30, belt + 110));
      c.push('C ' + P(L - 12, belt + 40) + ' ' + P(L - 5, belt - 60) + ' ' + P(L - 5, belt - 170));
      c.push(bumperHatch);
      dlo = { C: [re + 130, Hh - 100], D: [rA + 210, belt + 60], kromC: [160, -10], kromD: [-10, 140] };
    } else { // estate, suv
      var suv = t === 'suv';
      re = L - (suv ? 210 : 190); rh = Hh - (suv ? 40 : 50);
      dak(re, rh);
      c.push('C ' + P(L - 120, Hh - 60) + ' ' + P(L - (suv ? 60 : 70), belt + (suv ? 220 : 240)) + ' ' + P(L - (suv ? 45 : 50), belt + (suv ? 130 : 150)));
      c.push('C ' + P(L - 18, belt + 50) + ' ' + P(L - 5, belt - 40) + ' ' + P(L - 5, belt - (suv ? 170 : 130)));
      c.push(bumperHatch);
      dlo = { C: [L - (suv ? 340 : 330), Hh - 82], D: [L - (suv ? 280 : 260), belt + 62], kromC: [40, 0], kromD: [0, 80] };
    }
    return { cmds: c.join(' '), dlo: dlo, re: re };
  }

  function wielBinnenkant(r, velg, remkleur, id) {
    // donkere velgbinnenkant, remschijf, remklauw en de velg zelf
    var a1 = -38 * Math.PI / 180, a2 = 28 * Math.PI / 180, r1 = r * 0.5, r2 = r * 0.86;
    var klauw = 'M ' + n(r2 * Math.cos(a1)) + ' ' + n(r2 * Math.sin(a1)) + ' A ' + n(r2) + ' ' + n(r2) + ' 0 0 1 ' + n(r2 * Math.cos(a2)) + ' ' + n(r2 * Math.sin(a2)) +
      ' L ' + n(r1 * Math.cos(a2)) + ' ' + n(r1 * Math.sin(a2)) + ' A ' + n(r1) + ' ' + n(r1) + ' 0 0 0 ' + n(r1 * Math.cos(a1)) + ' ' + n(r1 * Math.sin(a1)) + ' Z';
    var s = '<circle r="' + n(r) + '" fill="#0b0c0e"/>' +
      '<circle r="' + n(r * 0.8) + '" fill="url(#' + id + 'disc)"/>' +
      '<circle r="' + n(r * 0.62) + '" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="' + n(r * 0.012) + '"/>' +
      '<circle r="' + n(r * 0.34) + '" fill="#3a3d42"/>' +
      '<path class="avdv-klauw" d="' + klauw + '" fill="' + remkleur + '" stroke="' + remkleur + '" stroke-width="' + n(r * 0.05) + '" stroke-linejoin="round"/>' +
      '<path d="' + klauw + '" fill="url(#' + id + 'klauwglans)" pointer-events="none"/>';
    if (velg && velg.href) {
      s += '<image href="' + velg.href + '" x="' + n(-r) + '" y="' + n(-r) + '" width="' + n(2 * r) + '" height="' + n(2 * r) + '"' +
        (velg.terugval ? ' preserveAspectRatio="xMidYMid slice" clip-path="url(#' + id + 'velgclip)" style="mix-blend-mode:multiply"' : ' preserveAspectRatio="none"') + '/>';
    } else {
      // tijdelijke velg terwijl de foto verwerkt wordt
      s += '<circle r="' + n(r * 0.95) + '" fill="none" stroke="#9aa0a7" stroke-width="' + n(r * 0.08) + '"/>';
      for (var i = 0; i < 5; i++) {
        var hoek = i * 72 * Math.PI / 180;
        s += '<line x1="0" y1="0" x2="' + n(Math.cos(hoek) * r * 0.92) + '" y2="' + n(Math.sin(hoek) * r * 0.92) + '" stroke="#9aa0a7" stroke-width="' + n(r * 0.16) + '" stroke-linecap="round"/>';
      }
      s += '<circle r="' + n(r * 0.2) + '" fill="#9aa0a7"/>';
    }
    s += '<circle r="' + n(r) + '" fill="url(#' + id + 'velgschaduw)" pointer-events="none"/>';
    return s;
  }

  function gedeeldeDefs(id) {
    return '<radialGradient id="' + id + 'disc"><stop offset=".4" stop-color="#8e9399"/><stop offset=".85" stop-color="#b3b8be"/><stop offset="1" stop-color="#6c7177"/></radialGradient>' +
      '<linearGradient id="' + id + 'klauwglans" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient>' +
      '<radialGradient id="' + id + 'velgschaduw"><stop offset=".82" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient>' +
      '<clipPath id="' + id + 'velgclip" clipPathUnits="objectBoundingBox"><circle cx=".5" cy=".5" r=".5"/></clipPath>';
  }

  function tekenAuto(auto, opt) {
    var id = 'avdv-';
    var g = geometrie(auto);
    var L = g.L, H = g.H, fA = g.fA, rA = g.rA, belt = g.belt, hood = g.hood, nose = g.nose, sill = g.sill, Hh = g.Hh, cowlX = g.cowlX, rfX = g.rfX;
    var orig = leesBand(auto.band) || leesBand('225/45R17');
    var Rs = orig.od / 2;                              // originele bandstraal
    var Rn = (opt.band ? opt.band.od : orig.od) / 2;   // nieuwe bandstraal
    var velgR = opt.inch ? opt.inch * 25.4 / 2 + 16 : Rs * 0.72;
    var archR = Rs + 38;
    var dy = (opt.verlaging || 0) - (Rn - Rs);         // carrosserie zakt bij verlaging, stijgt bij grotere band
    var dx = Math.sqrt(Math.max(0, archR * archR - (sill - Rs) * (sill - Rs)));
    var ach = achterkant(g, auto.type);
    var lak = opt.lak;

    // Carrosserie-omtrek
    var body = 'M ' + P(85, sill - 10) +
      ' C ' + P(28, sill + 10) + ' ' + P(0, nose - 150) + ' ' + P(0, nose) +
      ' C ' + P(0, nose + 110) + ' ' + P(22, hood - 32) + ' ' + P(95, hood) +
      ' C ' + P(420, hood + 48) + ' ' + P(cowlX - 360, belt + 6) + ' ' + P(cowlX, belt + 25) +
      ' L ' + P(rfX, Hh - 30) + ' ' + ach.cmds +
      ' L ' + P(rA + dx, sill) + ' A ' + n(archR) + ' ' + n(archR) + ' 0 1 0 ' + P(rA - dx, sill) +
      ' L ' + P(fA + dx, sill) + ' A ' + n(archR) + ' ' + n(archR) + ' 0 1 0 ' + P(fA - dx, sill) + ' Z';

    function wielkast(ax) {
      return '<path d="M ' + P(ax + dx, sill) + ' A ' + n(archR) + ' ' + n(archR) + ' 0 1 0 ' + P(ax - dx, sill) + ' Z" fill="url(#' + id + 'kast)"/>';
    }

    // Ruiten
    var A = [cowlX + 75, belt + 20], B = [rfX + 38, Hh - 72], C = ach.dlo.C, D = ach.dlo.D;
    var dlo = 'M ' + P(A[0], A[1]) + ' L ' + P(B[0], B[1]) +
      ' C ' + P(B[0] + (C[0] - B[0]) * 0.35, Hh - 48) + ' ' + P(C[0] - (C[0] - B[0]) * 0.3, Hh - 48) + ' ' + P(C[0], C[1]) +
      ' C ' + P(C[0] + ach.dlo.kromC[0], C[1] + ach.dlo.kromC[1]) + ' ' + P(D[0] + ach.dlo.kromD[0], D[1] + ach.dlo.kromD[1]) + ' ' + P(D[0], D[1]) + ' Z';
    var xb = Math.max(fA + g.WB * 0.6, rfX + 140);
    var xq = D[0] - (D[0] - xb) * 0.2;
    var xfd = cowlX + 45;
    var xrd = rA - archR * 0.25;
    var hrd = Rs + Math.sqrt(Math.max(0, archR * archR - Math.pow(xrd - rA, 2))) + 12;
    var suvLook = auto.type === 'suv' || auto.type === 'suvcoupe';

    // Koplamp, achterlicht, spiegel
    var kop = 'M ' + P(22, hood - 60) + ' C ' + P(110, hood - 24) + ' ' + P(250, hood - 8) + ' ' + P(345, hood - 18) +
      ' L ' + P(318, hood - 78) + ' C ' + P(215, hood - 92) + ' ' + P(95, hood - 110) + ' ' + P(12, hood - 128) + ' Z';
    var achterlicht = 'M ' + P(L - 2, belt + 55) + ' C ' + P(L - 70, belt + 98) + ' ' + P(L - 210, belt + 84) + ' ' + P(L - 340, belt + 42) +
      ' L ' + P(L - 330, belt - 18) + ' C ' + P(L - 210, belt - 6) + ' ' + P(L - 70, belt - 26) + ' ' + P(L - 2, belt - 70) + ' Z';
    var spiegel = 'M ' + P(cowlX + 30, belt + 38) + ' C ' + P(cowlX + 18, belt + 125) + ' ' + P(cowlX + 120, belt + 178) + ' ' + P(cowlX + 232, belt + 166) +
      ' C ' + P(cowlX + 285, belt + 160) + ' ' + P(cowlX + 275, belt + 62) + ' ' + P(cowlX + 222, belt + 42) + ' Z';
    var off = function (h) { return n(clamp(1 - h / H, 0, 1)); };

    var vbW = 5600, vbH = 2500, vbX = L / 2 - vbW / 2, vbY = -(vbH - 280);
    var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + n(vbX) + ' ' + vbY + ' ' + vbW + ' ' + vbH + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="' + esc(opt.label) + '">' +
      '<defs>' + gedeeldeDefs(id) +
      '<linearGradient id="' + id + 'wand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6f7f9"/><stop offset=".72" stop-color="#e3e6ea"/><stop offset=".78" stop-color="#d5d9de"/><stop offset="1" stop-color="#c4c9cf"/></linearGradient>' +
      '<radialGradient id="' + id + 'spot" cx=".5" cy=".42" r=".6"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="' + id + 'glans" gradientUnits="userSpaceOnUse" x1="0" y1="' + n(-H) + '" x2="0" y2="0">' +
        '<stop offset="0" stop-color="#fff" stop-opacity=".22"/>' +
        '<stop offset="' + off(belt + 10) + '" stop-color="#fff" stop-opacity=".05"/>' +
        '<stop offset="' + off(belt - 40) + '" stop-color="#fff" stop-opacity=".30"/>' +
        '<stop offset="' + off(belt - 110) + '" stop-color="#fff" stop-opacity=".04"/>' +
        '<stop offset="' + off(sill + 260) + '" stop-color="#000" stop-opacity=".06"/>' +
        '<stop offset="1" stop-color="#000" stop-opacity=".42"/></linearGradient>' +
      '<linearGradient id="' + id + 'lengte" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".16"/><stop offset=".18" stop-color="#000" stop-opacity="0"/><stop offset=".85" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".2"/></linearGradient>' +
      '<linearGradient id="' + id + 'ruit" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a4654"/><stop offset=".55" stop-color="#1a222b"/><stop offset="1" stop-color="#0d1217"/></linearGradient>' +
      '<linearGradient id="' + id + 'kop" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f8fc"/><stop offset=".6" stop-color="#b9c4cf"/><stop offset="1" stop-color="#6d7a87"/></linearGradient>' +
      '<linearGradient id="' + id + 'rood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2343f"/><stop offset=".6" stop-color="#9c0f1a"/><stop offset="1" stop-color="#5e0710"/></linearGradient>' +
      '<radialGradient id="' + id + 'kast" cx=".5" cy=".7" r=".7"><stop offset="0" stop-color="#050506"/><stop offset="1" stop-color="#1c1d20"/></radialGradient>' +
      '<radialGradient id="' + id + 'band"><stop offset=".6" stop-color="#1d1e20"/><stop offset=".93" stop-color="#141517"/><stop offset="1" stop-color="#08090a"/></radialGradient>' +
      '<filter id="' + id + 'blur" x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="38"/></filter>' +
      '<filter id="' + id + 'blur2" x="-50%" y="-300%" width="200%" height="700%"><feGaussianBlur stdDeviation="12"/></filter>' +
      '<clipPath id="' + id + 'body"><path d="' + body + '"/></clipPath>' +
      '<clipPath id="' + id + 'dlo"><path d="' + dlo + '"/></clipPath>' +
      '</defs>' +
      // studio
      '<rect x="' + n(vbX - 50) + '" y="' + (vbY - 50) + '" width="' + (vbW + 100) + '" height="' + (vbH + 100) + '" fill="url(#' + id + 'wand)"/>' +
      '<ellipse cx="' + n(L / 2) + '" cy="' + n(-H * 0.55) + '" rx="' + n(vbW * 0.42) + '" ry="' + n(vbH * 0.5) + '" fill="url(#' + id + 'spot)"/>' +
      // schaduw
      '<ellipse cx="' + n(L / 2) + '" cy="6" rx="' + n(L * 0.54) + '" ry="70" fill="#000" opacity=".32" filter="url(#' + id + 'blur)"/>' +
      '<ellipse cx="' + n(fA) + '" cy="0" rx="' + n(Rn * 0.95) + '" ry="22" fill="#000" opacity=".55" filter="url(#' + id + 'blur2)"/>' +
      '<ellipse cx="' + n(rA) + '" cy="0" rx="' + n(Rn * 0.95) + '" ry="22" fill="#000" opacity=".55" filter="url(#' + id + 'blur2)"/>' +
      // wielkasten
      '<g transform="translate(0 ' + n(dy) + ')">' + wielkast(fA) + wielkast(rA) + '</g>';

    // wielen
    [fA, rA].forEach(function (ax) {
      s += '<g transform="translate(' + n(ax) + ' ' + n(-Rn) + ')">' +
        '<circle r="' + n(Rn) + '" fill="url(#' + id + 'band)"/>' +
        '<circle r="' + n((Rn + velgR) / 2) + '" fill="none" stroke="#2a2b2e" stroke-opacity=".55" stroke-width="' + n((Rn - velgR) * 0.35) + '"/>' +
        '<circle r="' + n(velgR + 5) + '" fill="none" stroke="#050505" stroke-width="10"/>' +
        wielBinnenkant(velgR, opt.velg, opt.remklauw, id) +
        '</g>';
    });

    // carrosserie
    s += '<g transform="translate(0 ' + n(dy) + ')">' +
      '<path class="avdv-lak" d="' + body + '" fill="' + lak + '"/>' +
      '<g clip-path="url(#' + id + 'body)">' +
        '<rect x="-10" y="' + n(-H - 20) + '" width="' + (L + 20) + '" height="' + (H + 40) + '" fill="url(#' + id + 'glans)"/>' +
        '<rect x="-10" y="' + n(-H - 20) + '" width="' + (L + 20) + '" height="' + (H + 40) + '" fill="url(#' + id + 'lengte)"/>' +
        // schouderlijn
        '<path d="M ' + P(fA + archR * 0.5, belt - 78) + ' C ' + P(fA + g.WB * 0.4, belt - 70) + ' ' + P(rA, belt - 58) + ' ' + P(L - 60, belt - 40) + '" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="7"/>' +
        '<path d="M ' + P(fA + archR * 0.5, belt - 92) + ' C ' + P(fA + g.WB * 0.4, belt - 84) + ' ' + P(rA, belt - 72) + ' ' + P(L - 60, belt - 54) + '" fill="none" stroke="#000" stroke-opacity=".12" stroke-width="16"/>' +
        // dorpel en wielkastranden
        '<rect x="0" y="' + n(-(sill + (suvLook ? 95 : 48))) + '" width="' + L + '" height="' + (suvLook ? 95 : 48) + '" fill="#101113" opacity="' + (suvLook ? '.92' : '.55') + '"/>' +
        (suvLook
          ? '<circle cx="' + n(fA) + '" cy="' + n(-Rs) + '" r="' + n(archR + 34) + '" fill="none" stroke="#141517" stroke-width="72"/><circle cx="' + n(rA) + '" cy="' + n(-Rs) + '" r="' + n(archR + 34) + '" fill="none" stroke="#141517" stroke-width="72"/>'
          : '<circle cx="' + n(fA) + '" cy="' + n(-Rs) + '" r="' + n(archR + 7) + '" fill="none" stroke="#000" stroke-opacity=".32" stroke-width="16"/><circle cx="' + n(rA) + '" cy="' + n(-Rs) + '" r="' + n(archR + 7) + '" fill="none" stroke="#000" stroke-opacity=".32" stroke-width="16"/>') +
        // deurnaden
        '<g fill="none" stroke="#000" stroke-opacity=".38" stroke-width="5">' +
          '<path d="M ' + P(xfd, belt + 12) + ' C ' + P(xfd - 12, belt - 200) + ' ' + P(xfd - 10, sill + 200) + ' ' + P(xfd + 5, sill + 12) + '"/>' +
          '<path d="M ' + P(xb, belt + 12) + ' L ' + P(xb - 6, sill + 12) + '"/>' +
          '<path d="M ' + P(xrd, belt + 12) + ' C ' + P(xrd + 6, belt - 150) + ' ' + P(xrd - 4, hrd + 120) + ' ' + P(xrd - 16, hrd) + '"/>' +
        '</g>' +
        // deurgrepen
        '<rect x="' + n(xb - 330) + '" y="' + n(-(belt - 72)) + '" width="150" height="30" rx="14" fill="#000" fill-opacity=".28"/>' +
        '<rect x="' + n(xrd - 290) + '" y="' + n(-(belt - 66)) + '" width="150" height="30" rx="14" fill="#000" fill-opacity=".28"/>' +
        // lichten en bumper
        '<path d="' + kop + '" fill="url(#' + id + 'kop)" stroke="#1b1e22" stroke-width="7"/>' +
        '<path d="M ' + P(40, hood - 70) + ' C ' + P(130, hood - 44) + ' ' + P(240, hood - 32) + ' ' + P(320, hood - 38) + '" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round"/>' +
        '<path d="' + achterlicht + '" fill="url(#' + id + 'rood)" stroke="#2a0508" stroke-width="6"/>' +
        '<path d="M ' + P(0, sill + 70) + ' C ' + P(60, sill + 72) + ' ' + P(150, sill + 90) + ' ' + P(190, sill + 150) + ' L ' + P(170, sill + 250) + ' C ' + P(110, sill + 238) + ' ' + P(40, sill + 232) + ' ' + P(0, sill + 236) + ' Z" fill="#111214" opacity=".85"/>' +
        '<rect x="' + (L - 150) + '" y="' + n(-(sill + 150)) + '" width="120" height="26" rx="10" fill="#8e0f18"/>' +
      '</g>' +
      // ruiten
      '<path d="' + dlo + '" fill="url(#' + id + 'ruit)" stroke="#0a0b0c" stroke-width="16" stroke-linejoin="round"/>' +
      '<g clip-path="url(#' + id + 'dlo)">' +
        '<path d="M ' + P(B[0] + 60, Hh) + ' L ' + P(B[0] + 520, Hh) + ' L ' + P(A[0] + 700, belt) + ' L ' + P(A[0] + 240, belt) + ' Z" fill="#fff" opacity=".09"/>' +
        '<path d="M ' + P(xb + 380, Hh) + ' L ' + P(xb + 560, Hh) + ' L ' + P(xb + 330, belt) + ' L ' + P(xb + 150, belt) + ' Z" fill="#fff" opacity=".07"/>' +
        '<path d="M ' + P(xb - 50, belt) + ' L ' + P(xb + 48, belt) + ' L ' + P(xb + 20, Hh) + ' L ' + P(xb - 80, Hh) + ' Z" fill="#0c0d0f"/>' +
        '<path d="M ' + P(xq, belt) + ' L ' + P(xq + 26, belt) + ' L ' + P(xq + 44, Hh) + ' L ' + P(xq + 18, Hh) + ' Z" fill="#0c0d0f"/>' +
      '</g>' +
      '<path class="avdv-lak" d="' + spiegel + '" fill="' + lak + '"/>' +
      '<path d="' + spiegel + '" fill="url(#' + id + 'glans)" opacity=".8"/>' +
      '<path d="M ' + P(cowlX + 30, belt + 38) + ' C ' + P(cowlX + 40, belt + 70) + ' ' + P(cowlX + 150, belt + 72) + ' ' + P(cowlX + 222, belt + 42) + ' Z" fill="#111" opacity=".85"/>' +
      '</g></svg>';
    return s;
  }

  function tekenFoto(foto, wielen, opt) {
    var id = 'avdv-';
    var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + foto.w + ' ' + foto.h + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="' + esc(opt.label) + '">' +
      '<defs>' + gedeeldeDefs(id) + '</defs>' +
      '<rect width="' + foto.w + '" height="' + foto.h + '" fill="#111"/>' +
      '<image href="' + foto.href + '" width="' + foto.w + '" height="' + foto.h + '"/>';
    wielen.forEach(function (w, i) {
      s += '<g class="avdv-wiel" data-i="' + i + '" tabindex="0" role="button" aria-label="' + (i ? 'Achterwiel' : 'Voorwiel') + ': sleep of gebruik de pijltjestoetsen" transform="translate(' + n(w.x) + ' ' + n(w.y) + ') scale(' + opt.persp + ' 1)">' +
        wielBinnenkant(opt.r, opt.velg, opt.remklauw, id) +
        '<circle class="avdv-wielrand" r="' + n(opt.r + 6) + '" fill="none" stroke="#419afe" stroke-width="' + n(Math.max(3, opt.r * 0.03)) + '" stroke-dasharray="' + n(opt.r * 0.12) + ' ' + n(opt.r * 0.08) + '"/>' +
        '</g>';
    });
    return s + '</svg>';
  }

  /* ------------------------------------------------------------------ *
   *  Venster
   * ------------------------------------------------------------------ */

  var CSS = [
    '.avdv-knop{display:flex;align-items:center;gap:14px;width:100%;margin:14px 0 0;padding:12px 16px;background:#fff;border:2px solid #419afe;border-radius:6px;color:#2c292d;font:600 15px/1.25 "Open Sans",sans-serif;text-align:left;cursor:pointer;transition:background .2s,box-shadow .2s}',
    '.avdv-knop:hover{background:#f0f7ff;box-shadow:0 4px 14px rgba(65,154,254,.22)}',
    '.avdv-knop:focus-visible{outline:3px solid #1c6fd1;outline-offset:2px}',
    '.avdv-knop svg{flex:none;width:46px;height:26px;color:#419afe}',
    '.avdv-knop small{display:block;font-weight:400;font-size:12.5px;color:#5d5960;margin-top:2px}',
    'dialog.avdv{padding:0;border:0;border-radius:14px;width:min(1180px,calc(100vw - 32px));max-width:none;max-height:calc(100dvh - 32px);color:#2c292d;background:#fff;font:14px/1.5 "Open Sans",sans-serif;box-shadow:0 30px 80px rgba(0,0,0,.45);overflow:hidden}',
    'dialog.avdv::backdrop{background:rgba(20,18,22,.72)}',
    'dialog.avdv[open]{display:flex;flex-direction:column;animation:avdv-in .22s ease-out}',
    '@keyframes avdv-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}',
    '.avdv *{box-sizing:border-box}',
    '.avdv-kop{display:flex;align-items:center;gap:16px;padding:14px 20px;background:#2c292d;color:#fff}',
    '.avdv-kop .avdv-accolade{font:300 40px/1 "Roboto Slab",serif;color:#419afe;margin-top:-6px}',
    '.avdv-kop p{margin:0;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#b9b5bb}',
    '.avdv-kop h2{margin:0;font:700 19px/1.25 "Roboto Slab",serif;color:#fff}',
    '.avdv-sluit{margin-left:auto;display:grid;place-items:center;width:44px;height:44px;border:0;border-radius:50%;background:rgba(255,255,255,.08);color:#fff;cursor:pointer}',
    '.avdv-sluit:hover{background:rgba(255,255,255,.18)}',
    '.avdv-sluit:focus-visible,.avdv button:focus-visible,.avdv select:focus-visible,.avdv input:focus-visible+span,.avdv-wiel:focus-visible{outline:3px solid #419afe;outline-offset:2px}',
    '.avdv-lijf{display:grid;grid-template-columns:minmax(0,1fr) 340px;min-height:0;flex:1}',
    '.avdv-links{padding:18px 18px 16px 20px;display:flex;flex-direction:column;gap:10px;min-width:0}',
    '.avdv-modus{display:inline-flex;align-self:flex-start;padding:4px;border-radius:999px;background:#eef0f3}',
    '.avdv-modus button{min-height:36px;padding:0 16px;border:0;border-radius:999px;background:none;color:#4a464d;font:600 13px "Open Sans",sans-serif;cursor:pointer}',
    '.avdv-modus button[aria-pressed="true"]{background:#fff;color:#2c292d;box-shadow:0 1px 4px rgba(0,0,0,.14)}',
    '.avdv-podium{position:relative;border-radius:10px;overflow:hidden;background:#e3e6ea;aspect-ratio:56/25;touch-action:none}',
    '.avdv-podium>svg{display:block;width:100%;height:100%;animation:avdv-fade .3s ease-out}',
    '@keyframes avdv-fade{from{opacity:.4}to{opacity:1}}',
    '.avdv-lak{transition:fill .35s ease}',
    '.avdv-wiel{cursor:grab;outline:none}.avdv-wiel:active{cursor:grabbing}',
    '.avdv-wiel .avdv-wielrand{opacity:.85}',
    '.avdv-podium[data-bewaren] .avdv-wielrand{display:none}',
    '.avdv-label{position:absolute;left:12px;bottom:10px;padding:4px 10px;border-radius:6px;background:rgba(255,255,255,.86);font-size:12.5px;color:#2c292d;pointer-events:none}',
    '.avdv-drop{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:20px;text-align:center;background:repeating-linear-gradient(135deg,#f4f5f7 0 14px,#eef0f3 14px 28px);border:2px dashed #b9c0c8;border-radius:10px}',
    '.avdv-drop.is-over{border-color:#419afe;background:#eef6ff}',
    '.avdv-drop strong{font:700 17px "Roboto Slab",serif}',
    '.avdv-drop p{margin:0;max-width:420px;color:#5d5960;font-size:13px}',
    '.avdv-uitleg{margin:0;color:#5d5960;font-size:12.5px}',
    '.avdv-paneel{border-left:1px solid #e6e8eb;background:#fafbfc;overflow:auto;padding:16px 20px 20px;display:flex;flex-direction:column;gap:16px}',
    '.avdv fieldset{border:0;margin:0;padding:0;min-width:0}',
    '.avdv legend,.avdv-titel{padding:0;margin:0 0 8px;font:700 13px "Roboto Slab",serif;color:#2c292d;text-transform:uppercase;letter-spacing:.04em}',
    '.avdv-veld{display:block;margin-bottom:8px}',
    '.avdv-veld span{display:block;font-size:12px;color:#5d5960;margin-bottom:3px}',
    '.avdv select{width:100%;min-height:44px;padding:0 36px 0 12px;border:1px solid #cfd4da;border-radius:6px;background:#fff url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%278%27%3E%3Cpath d=%27M1 1l5 5 5-5%27 fill=%27none%27 stroke=%27%232c292d%27 stroke-width=%272%27/%3E%3C/svg%3E") no-repeat right 12px center;-webkit-appearance:none;appearance:none;font:14px "Open Sans",sans-serif;color:#2c292d}',
    '.avdv-stalen{display:flex;flex-wrap:wrap;gap:8px}',
    '.avdv-staal{position:relative}',
    '.avdv-staal input{position:absolute;opacity:0;width:1px;height:1px}',
    '.avdv-staal span{display:block;width:36px;height:36px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px #c9ced4,inset 0 -6px 10px rgba(0,0,0,.18),inset 0 5px 8px rgba(255,255,255,.28);cursor:pointer}',
    '.avdv-staal input:checked+span{box-shadow:0 0 0 2px #419afe,inset 0 -6px 10px rgba(0,0,0,.18),inset 0 5px 8px rgba(255,255,255,.28)}',
    '.avdv-staal input:focus-visible+span{outline:3px solid #1c6fd1;outline-offset:3px}',
    '.avdv-gekozen{font-weight:400;text-transform:none;letter-spacing:0;color:#5d5960;font-family:"Open Sans",sans-serif}',
    '.avdv-seg{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;border:1px solid #cfd4da;border-radius:6px;overflow:hidden;background:#fff}',
    '.avdv-seg label{position:relative}',
    '.avdv-seg input{position:absolute;opacity:0;width:1px;height:1px}',
    '.avdv-seg span{display:grid;place-items:center;min-height:40px;font-size:13px;cursor:pointer;border-left:1px solid #e3e6ea}',
    '.avdv-seg label:first-child span{border-left:0}',
    '.avdv-seg input:checked+span{background:#419afe;color:#fff;font-weight:600}',
    '.avdv-seg input:focus-visible+span{outline:3px solid #1c6fd1;outline-offset:-3px}',
    '.avdv-schuif{display:block;margin-bottom:10px}',
    '.avdv-schuif span{display:flex;justify-content:space-between;font-size:12px;color:#5d5960}',
    '.avdv-schuif input{width:100%;accent-color:#419afe;min-height:28px}',
    '.avdv-past{border-radius:8px;background:#fff;border:1px solid #e3e6ea;padding:12px 14px}',
    '.avdv-past ul{list-style:none;margin:0;padding:0;display:grid;gap:7px}',
    '.avdv-past li{display:grid;grid-template-columns:20px 1fr;gap:8px;font-size:13px;line-height:1.4}',
    '.avdv-past b{font-weight:600}',
    '.avdv-i{display:grid;place-items:center;width:20px;height:20px;border-radius:50%;font:700 12px/1 "Open Sans",sans-serif;color:#fff}',
    '.avdv-ok{background:#1f8a4c}.avdv-let{background:#c77700}.avdv-nee{background:#c62828}.avdv-info{background:#8a8f96}',
    '.avdv-klein{margin:8px 0 0;font-size:12px;color:#6b676e}',
    '.avdv-klein a{color:#1c6fd1}',
    '.avdv-voet{margin-top:auto;display:grid;gap:8px;padding-top:4px}',
    '.avdv-prijs{display:flex;justify-content:space-between;align-items:baseline;font-size:13px;color:#5d5960}',
    '.avdv-prijs strong{font:700 22px "Roboto Slab",serif;color:#419afe}',
    '.avdv-cta{display:flex;align-items:center;justify-content:center;gap:10px;min-height:48px;border:0;border-radius:6px;background:#419afe;color:#fff;font:700 14px "Open Sans",sans-serif;text-transform:uppercase;letter-spacing:.03em;cursor:pointer;transition:background .2s}',
    '.avdv-cta:hover{background:#1f86f5}',
    '.avdv-tweede{min-height:42px;border:1px solid #cfd4da;border-radius:6px;background:#fff;color:#2c292d;font:600 13px "Open Sans",sans-serif;cursor:pointer}',
    '.avdv-tweede:hover{border-color:#419afe}',
    '.avdv-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}',
    '[hidden]{display:none!important}',
    '@media (max-width:900px){',
    ' dialog.avdv{width:100vw;max-height:100dvh;height:100dvh;border-radius:0}',
    ' .avdv-lijf{grid-template-columns:1fr;overflow:auto}',
    ' .avdv-links{padding:12px 16px 0}',
    ' .avdv-podium{aspect-ratio:16/9}',
    ' .avdv-paneel{border-left:0;overflow:visible;padding:12px 16px 16px}',
    ' .avdv-voet{position:sticky;bottom:0;background:#fafbfc;margin:0 -16px -16px;padding:10px 16px 14px;border-top:1px solid #e6e8eb}',
    ' .avdv-kop{padding:10px 12px 10px 16px}',
    ' .avdv-kop h2{font-size:16px}',
    '}',
    '@media (prefers-reduced-motion:reduce){dialog.avdv[open],.avdv-podium>svg{animation:none}.avdv-lak{transition:none}}'
  ].join('\n');

  var AUTO_ICOON = '<svg viewBox="0 0 46 26" aria-hidden="true"><path d="M3 18.5c0-2.6 1.2-4 3.6-4.6l6.2-1.6 5.6-5.2c1.2-1.1 2.6-1.6 4.2-1.6h8.2c1.6 0 3 .6 4.1 1.7l4.3 4.6c2.2.6 3.8 2.4 3.8 4.8v1.9H3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="19.5" r="4.2" fill="#fff" stroke="currentColor" stroke-width="2"/><circle cx="35" cy="19.5" r="4.2" fill="#fff" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="19.5" r="1.4" fill="currentColor"/><circle cx="35" cy="19.5" r="1.4" fill="currentColor"/></svg>';

  var st = {
    product: null, velg: null, autoId: null,
    lak: store('lak') || 'wit', remklauw: store('remklauw') || 'grijs', verlaging: 0,
    modus: 'model', foto: null, wielen: null, wielR: 0, persp: 1
  };
  var dlg, el = {};

  function alleAutos() { return AUTOS.concat(ALGEMEEN); }
  function autoMetId(id) { return alleAutos().filter(function (a) { return a.id === id; })[0]; }
  function merken() { var m = []; AUTOS.forEach(function (a) { if (m.indexOf(a.merk) < 0) m.push(a.merk); }); return m.sort(); }
  function lakKleur() { return (LAKKEN.filter(function (l) { return l.id === st.lak; })[0] || LAKKEN[0]).kleur; }
  function klauwKleur() { return (REMKLAUWEN.filter(function (l) { return l.id === st.remklauw; })[0] || REMKLAUWEN[0]).kleur; }

  function stalen(naam, lijst, gekozen) {
    return lijst.map(function (x) {
      return '<label class="avdv-staal" title="' + esc(x.naam) + '"><input type="radio" name="' + naam + '" value="' + x.id + '"' + (x.id === gekozen ? ' checked' : '') + '>' +
        '<span style="background:' + x.kleur + '"></span><span class="avdv-sr">' + esc(x.naam) + '</span></label>';
    }).join('');
  }

  function bouwVenster() {
    if (!document.getElementById('avdv-css')) {
      var css = document.createElement('style');
      css.id = 'avdv-css';
      css.textContent = CSS;
      document.head.appendChild(css);
    }
    dlg = document.createElement('dialog');
    dlg.className = 'avdv';
    dlg.setAttribute('aria-labelledby', 'avdv-titel');
    dlg.innerHTML =
      '<header class="avdv-kop"><span class="avdv-accolade" aria-hidden="true">{</span><div><p>Bekijk op je auto</p><h2 id="avdv-titel"></h2></div>' +
      '<button type="button" class="avdv-sluit" aria-label="Sluiten"><svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M2 2l14 14M16 2L2 16" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></button></header>' +
      '<div class="avdv-lijf">' +
        '<section class="avdv-links" aria-label="Voorbeeld">' +
          '<div class="avdv-modus" role="group" aria-label="Weergave"><button type="button" data-modus="model" aria-pressed="true">Modelauto</button><button type="button" data-modus="foto" aria-pressed="false">Foto van je eigen auto</button></div>' +
          '<div class="avdv-podium"></div>' +
          '<p class="avdv-uitleg"></p>' +
        '</section>' +
        '<aside class="avdv-paneel" aria-label="Instellingen">' +
          '<fieldset class="avdv-autokeuze"><legend>Jouw auto</legend>' +
            '<label class="avdv-veld"><span>Merk</span><select class="avdv-merk"></select></label>' +
            '<label class="avdv-veld"><span>Model</span><select class="avdv-model"></select></label>' +
          '</fieldset>' +
          '<fieldset class="avdv-fotoknoppen" hidden><legend>Wielen plaatsen</legend>' +
            '<label class="avdv-schuif"><span>Grootte <output class="avdv-r-uit"></output></span><input type="range" class="avdv-r" min="20" max="400" step="1"></label>' +
            '<label class="avdv-schuif"><span>Perspectief <output class="avdv-p-uit"></output></span><input type="range" class="avdv-p" min="0.6" max="1" step="0.01"></label>' +
            '<button type="button" class="avdv-tweede avdv-andere-foto" style="width:100%">Andere foto kiezen</button>' +
          '</fieldset>' +
          '<fieldset class="avdv-lakkeuze"><legend>Kleur <span class="avdv-gekozen avdv-lak-naam"></span></legend><div class="avdv-stalen">' + stalen('avdv-lak', LAKKEN, st.lak) + '</div></fieldset>' +
          '<fieldset class="avdv-verlagingkeuze"><legend>Verlaging</legend><div class="avdv-seg">' +
            [0, 30, 50].map(function (v) { return '<label><input type="radio" name="avdv-verl" value="' + v + '"' + (v === 0 ? ' checked' : '') + '><span>' + (v ? '−' + v + ' mm' : 'Standaard') + '</span></label>'; }).join('') +
          '</div></fieldset>' +
          '<fieldset><legend>Remklauwen <span class="avdv-gekozen avdv-klauw-naam"></span></legend><div class="avdv-stalen">' + stalen('avdv-klauw', REMKLAUWEN, st.remklauw) + '</div></fieldset>' +
          '<div class="avdv-past" aria-live="polite"></div>' +
          '<div class="avdv-voet">' +
            '<div class="avdv-prijs" hidden><span>Set van ' + CFG.setAantal + ' velgen</span><strong></strong></div>' +
            '<button type="button" class="avdv-cta"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.4 11h11l2-8H6.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="9" cy="19.5" r="1.6" fill="currentColor"/><circle cx="17" cy="19.5" r="1.6" fill="currentColor"/></svg><span>Set van ' + CFG.setAantal + ' in winkelwagen</span></button>' +
            '<button type="button" class="avdv-tweede avdv-bewaar">Afbeelding bewaren</button>' +
            (CFG.url3d ? '<a class="avdv-tweede avdv-3d" style="display:grid;place-items:center;text-decoration:none" href="' + esc(CFG.url3d) + '">Bekijk in 3D op een echte auto</a>' : '') +
          '</div>' +
        '</aside>' +
      '</div>' +
      '<input type="file" accept="image/*" class="avdv-bestand" hidden>';
    document.body.appendChild(dlg);

    ['titel', 'podium', 'uitleg', 'merk', 'model', 'past', 'prijs', 'bestand', 'r', 'p', 'r-uit', 'p-uit', 'lak-naam', 'klauw-naam', 'fotoknoppen', 'autokeuze', 'lakkeuze', 'verlagingkeuze']
      .forEach(function (k) { el[k] = k === 'titel' ? dlg.querySelector('#avdv-titel') : dlg.querySelector('.avdv-' + k); });

    el.merk.innerHTML = merken().map(function (m) { return '<option>' + esc(m) + '</option>'; }).join('') + '<option value="__ander">Ander merk of model…</option>';

    dlg.querySelector('.avdv-sluit').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    el.merk.addEventListener('change', function () { vulModellen(); kiesAuto(el.model.value); });
    el.model.addEventListener('change', function () { kiesAuto(el.model.value); });
    dlg.addEventListener('change', function (e) {
      var t = e.target;
      if (t.name === 'avdv-lak') { st.lak = t.value; store('lak', t.value); zetLak(); }
      if (t.name === 'avdv-klauw') { st.remklauw = t.value; store('remklauw', t.value); teken(); }
      if (t.name === 'avdv-verl') { st.verlaging = +t.value; teken(); }
    });
    dlg.querySelectorAll('.avdv-modus button').forEach(function (b) {
      b.addEventListener('click', function () { zetModus(b.getAttribute('data-modus')); });
    });
    el.bestand.addEventListener('change', function () { if (el.bestand.files[0]) leesFoto(el.bestand.files[0]); el.bestand.value = ''; });
    dlg.querySelector('.avdv-andere-foto').addEventListener('click', function () { el.bestand.click(); });
    el.r.addEventListener('input', function () { st.wielR = +el.r.value; teken(); });
    el.p.addEventListener('input', function () { st.persp = +el.p.value; teken(); });
    dlg.querySelector('.avdv-cta').addEventListener('click', inWinkelwagen);
    dlg.querySelector('.avdv-bewaar').addEventListener('click', bewaar);
    koppelSlepen();
  }

  function vulModellen() {
    var merk = el.merk.value, lijst = merk === '__ander' ? ALGEMEEN : AUTOS.filter(function (a) { return a.merk === merk; });
    var steek = st.product && st.product.steek;
    el.model.innerHTML = lijst.map(function (a) {
      var past = steek && a.steek && a.steek === steek;
      return '<option value="' + a.id + '">' + esc(a.model) + (past ? '  ✓ past' : '') + '</option>';
    }).join('');
  }

  function kiesAuto(id) {
    var a = autoMetId(id);
    if (!a) return;
    st.autoId = a.id;
    store('auto', a.id);
    var link3d = dlg.querySelector('.avdv-3d');
    if (link3d) link3d.href = link3d.href.replace(/([?&])auto=[^&]*/, '$1auto=' + encodeURIComponent(a.id));
    el.merk.value = a.merk === 'Ander model' ? '__ander' : a.merk;
    if (!el.model.querySelector('option[value="' + a.id + '"]')) vulModellen();
    el.model.value = a.id;
    teken();
  }

  function standaardAuto() {
    var bewaard = autoMetId(store('auto'));
    if (bewaard) return bewaard;
    var steek = st.product && st.product.steek;
    var voorkeur = ['volkswagen-golf-8-2020', 'bmw-3-reeks-g20-2019', 'toyota-rav4-xa50-2019', 'volvo-xc60-ii-2017', 'peugeot-208-ii-2019', 'renault-clio-v-2019', 'volkswagen-polo-aw-2017', 'bmw-3-reeks-f30-2012-2019'];
    for (var i = 0; i < voorkeur.length; i++) {
      var a = autoMetId(voorkeur[i]);
      if (a && a.steek === steek) return a;
    }
    return AUTOS.filter(function (a) { return a.steek === steek; })[0] || autoMetId('volkswagen-golf-8-2020') || AUTOS[0];
  }

  function zetLak() {
    var k = lakKleur();
    el['lak-naam'].textContent = '· ' + (LAKKEN.filter(function (l) { return l.id === st.lak; })[0] || {}).naam;
    el.podium.querySelectorAll('.avdv-lak').forEach(function (p) { p.setAttribute('fill', k); });
  }

  function zetModus(m) {
    st.modus = m;
    dlg.querySelectorAll('.avdv-modus button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-modus') === m)); });
    var foto = m === 'foto';
    el.autokeuze.hidden = false;
    el.lakkeuze.hidden = foto;
    el.verlagingkeuze.hidden = foto;
    el.fotoknoppen.hidden = !foto || !st.foto;
    teken();
  }

  function leesFoto(bestand) {
    if (!/^image\//.test(bestand.type)) return;
    var url = URL.createObjectURL(bestand);
    laadBeeld(url).then(function (img) {
      // verkleinen tot max 1600 px zodat bewaren en slepen vlot blijven; de foto verlaat de browser niet
      var k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
      var c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      st.foto = { href: c.toDataURL('image/jpeg', 0.9), w: c.width, h: c.height };
      st.wielR = Math.round(c.width * 0.075);
      st.persp = 1;
      st.wielen = [{ x: c.width * 0.22, y: c.height * 0.68 }, { x: c.width * 0.78, y: c.height * 0.68 }];
      el.r.max = Math.round(c.width * 0.2);
      el.fotoknoppen.hidden = false;
      teken();
    });
  }

  function fitInfo(auto) {
    var p = st.product, rijen = [];
    function rij(klasse, teken_, html) { rijen.push('<li><span class="avdv-i ' + klasse + '" aria-hidden="true">' + teken_ + '</span><span>' + html + '</span></li>'); }
    var orig = leesBand(auto.band);
    if (auto.steek) {
      if (p.steek && p.steek === auto.steek) rij('avdv-ok', '✓', '<b>Steek ' + esc(p.steek) + '</b> past op je ' + esc(auto.merk + ' ' + auto.model.replace(/\s*\(.*/, '')));
      else if (p.steek) rij('avdv-nee', '✕', '<b>Steek ' + esc(p.steek) + '</b> past niet: je wagen heeft ' + esc(auto.steek) + '. Dit beeld is alleen ter illustratie.');
      if (p.naafgat && auto.naafgat) {
        if (p.naafgat > auto.naafgat + 0.05) rij('avdv-let', '!', '<b>Naafgat ' + p.naafgat + '</b>: centreerringen ' + p.naafgat + ' → ' + auto.naafgat + ' nodig');
        else if (p.naafgat < auto.naafgat - 0.05) rij('avdv-nee', '✕', '<b>Naafgat ' + p.naafgat + '</b> is kleiner dan de naaf van je wagen (' + auto.naafgat + ')');
        else rij('avdv-ok', '✓', '<b>Naafgat ' + p.naafgat + '</b> past zonder ringen');
      }
    } else {
      rij('avdv-info', 'i', 'Algemeen model. Kies je wagen via <b>Zoek je velgen</b> om de steek te controleren.');
    }
    if (orig && p.inch) {
      var v = bandVoorstel(orig, p.inch, p.breedte);
      var ok = Math.abs(v.verschil) <= 2;
      rij(ok ? 'avdv-ok' : 'avdv-let', ok ? '✓' : '!', 'Band bijvoorbeeld <b>' + v.txt + '</b> (origineel ' + orig.txt + ', omtrek ' + (v.verschil >= 0 ? '+' : '') + v.verschil.toFixed(1).replace('.', ',') + '%)');
      if (p.inch < orig.r) rij('avdv-let', '!', 'Kleiner dan de originele ' + orig.r + '": controleer of de velg over je remmen past.');
    }
    return '<p class="avdv-titel">Past deze velg?</p><ul>' + rijen.join('') + '</ul>' +
      '<p class="avdv-klein">Indicatief. ET en keuring bekijken we graag samen: <a href="mailto:' + CFG.email + '?subject=' + encodeURIComponent('Past ' + (p.titel || p.naam) + ' op mijn ' + auto.merk + ' ' + auto.model + '?') + '">vraag het ons</a>.</p>';
  }

  function teken() {
    if (!dlg || !st.product) return;
    var p = st.product, auto = autoMetId(st.autoId) || standaardAuto();
    var label = p.naam + ' ' + p.inch + '" op ' + (auto.merk === 'Ander model' ? 'een ' + auto.model.toLowerCase() : auto.merk + ' ' + auto.model.replace(/\s*\(.*/, ''));
    el['klauw-naam'].textContent = '· ' + (REMKLAUWEN.filter(function (l) { return l.id === st.remklauw; })[0] || {}).naam;
    el['lak-naam'].textContent = '· ' + (LAKKEN.filter(function (l) { return l.id === st.lak; })[0] || {}).naam;
    el.past.innerHTML = fitInfo(auto);

    if (st.modus === 'foto') {
      el.fotoknoppen.hidden = !st.foto;
      if (!st.foto) {
        el.podium.innerHTML = '<div class="avdv-drop"><strong>Upload een foto van de zijkant van je auto</strong>' +
          '<p>Liefst recht van opzij, beide wielen in beeld. Je foto blijft op je eigen toestel en wordt nergens opgeslagen.</p>' +
          '<button type="button" class="avdv-cta avdv-kies-foto" style="padding:0 22px">Foto kiezen</button></div>';
        el.podium.querySelector('.avdv-kies-foto').addEventListener('click', function () { el.bestand.click(); });
        var drop = el.podium.querySelector('.avdv-drop');
        drop.addEventListener('dragover', function (e) { e.preventDefault(); drop.classList.add('is-over'); });
        drop.addEventListener('dragleave', function () { drop.classList.remove('is-over'); });
        drop.addEventListener('drop', function (e) { e.preventDefault(); if (e.dataTransfer.files[0]) leesFoto(e.dataTransfer.files[0]); });
        el.uitleg.textContent = 'Tip: fotografeer op kniehoogte, zo lijkt het resultaat het meest echt.';
        return;
      }
      el.r.value = st.wielR; el.p.value = st.persp;
      el['r-uit'].textContent = st.wielR + ' px';
      el['p-uit'].textContent = Math.round(st.persp * 100) + '%';
      var focus = document.activeElement && document.activeElement.classList && document.activeElement.classList.contains('avdv-wiel') ? document.activeElement.getAttribute('data-i') : null;
      el.podium.innerHTML = tekenFoto(st.foto, st.wielen, { r: st.wielR, persp: st.persp, velg: st.velg, remklauw: klauwKleur(), label: label });
      if (focus !== null) { var f = el.podium.querySelector('.avdv-wiel[data-i="' + focus + '"]'); if (f) f.focus(); }
      el.uitleg.textContent = 'Sleep de cirkels over je wielen en pas de grootte aan tot de oude velg bedekt is.';
      return;
    }

    var orig = leesBand(auto.band);
    var band = orig && p.inch ? bandVoorstel(orig, p.inch, p.breedte) : null;
    el.podium.innerHTML = tekenAuto(auto, {
      lak: lakKleur(), remklauw: klauwKleur(), verlaging: st.verlaging, velg: st.velg,
      inch: p.inch, band: band, label: label
    }) + '<span class="avdv-label">' + esc(label) + '</span>';
    el.uitleg.textContent = 'Schematische ' + (CARROSSERIE[auto.type] || 'auto').toLowerCase() + ' op ware verhoudingen: wielbasis, bandhoogte en velgmaat kloppen, de lijnen van de carrosserie zijn vereenvoudigd.';
  }

  function koppelSlepen() {
    var sleep = null;
    function punt(e, svg) {
      var pt = svg.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      return pt.matrixTransform(svg.getScreenCTM().inverse());
    }
    el.podium.addEventListener('pointerdown', function (e) {
      var g = e.target.closest && e.target.closest('.avdv-wiel');
      if (!g) return;
      var svg = g.ownerSVGElement, i = +g.getAttribute('data-i'), p0 = punt(e, svg);
      sleep = { i: i, svg: svg, g: g, dx: st.wielen[i].x - p0.x, dy: st.wielen[i].y - p0.y };
      g.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    el.podium.addEventListener('pointermove', function (e) {
      if (!sleep) return;
      var p = punt(e, sleep.svg), w = st.wielen[sleep.i];
      w.x = clamp(p.x + sleep.dx, 0, st.foto.w); w.y = clamp(p.y + sleep.dy, 0, st.foto.h);
      sleep.g.setAttribute('transform', 'translate(' + n(w.x) + ' ' + n(w.y) + ') scale(' + st.persp + ' 1)');
    });
    ['pointerup', 'pointercancel'].forEach(function (t) { el.podium.addEventListener(t, function () { sleep = null; }); });
    el.podium.addEventListener('keydown', function (e) {
      var g = e.target.closest && e.target.closest('.avdv-wiel');
      if (!g) return;
      var stap = e.shiftKey ? 20 : 4, w = st.wielen[+g.getAttribute('data-i')];
      var d = { ArrowLeft: [-stap, 0], ArrowRight: [stap, 0], ArrowUp: [0, -stap], ArrowDown: [0, stap] }[e.key];
      if (!d) return;
      e.preventDefault();
      w.x = clamp(w.x + d[0], 0, st.foto.w); w.y = clamp(w.y + d[1], 0, st.foto.h);
      g.setAttribute('transform', 'translate(' + n(w.x) + ' ' + n(w.y) + ') scale(' + st.persp + ' 1)');
    });
  }

  function inWinkelwagen() {
    if (typeof CFG.onInWinkelwagen === 'function') { CFG.onInWinkelwagen(st.product, CFG.setAantal, autoMetId(st.autoId)); dlg.close(); return; }
    var knop = document.querySelector('.btn-cart');
    var aantal = document.getElementById('productPageQuantity');
    if (aantal) {
      aantal.value = CFG.setAantal;
      aantal.dispatchEvent(new Event('input', { bubbles: true }));
      aantal.dispatchEvent(new Event('change', { bubbles: true }));
    }
    dlg.close();
    if (knop) knop.click();
  }

  function bewaar() {
    var svg = el.podium.querySelector('svg');
    if (!svg) return;
    el.podium.setAttribute('data-bewaren', '');
    var kloon = svg.cloneNode(true);
    kloon.querySelectorAll('.avdv-wielrand').forEach(function (x) { x.remove(); });
    el.podium.removeAttribute('data-bewaren');
    var vb = svg.viewBox.baseVal, B = 1600, Hh = Math.round(B * vb.height / vb.width);
    kloon.setAttribute('width', B); kloon.setAttribute('height', Hh);
    var url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(kloon)], { type: 'image/svg+xml' }));
    laadBeeld(url).then(function (img) {
      var c = document.createElement('canvas');
      c.width = B; c.height = Hh;
      var x = c.getContext('2d');
      x.drawImage(img, 0, 0, B, Hh);
      x.font = '600 22px "Open Sans", sans-serif';
      x.fillStyle = 'rgba(44,41,45,.75)';
      x.fillText('avdvelgen.be · ' + st.product.naam + ' ' + st.product.inch + '"', 24, Hh - 24);
      URL.revokeObjectURL(url);
      c.toBlob(function (blob) {
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'avd-' + slug(st.product.naam + '-' + st.product.inch) + '-op-' + slug((autoMetId(st.autoId) || {}).model || 'auto') + '.png';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
      }, 'image/png');
    });
  }

  function open(product) {
    if (product) st.product = product;
    if (!st.product) st.product = leesProductVanPagina();
    if (!st.product) return;
    if (!dlg) bouwVenster();
    var p = st.product;
    el.titel.textContent = p.naam + ' · ' + p.inch + '"' + (p.breedte ? ' × ' + String(p.breedte).replace('.', ',') + 'J' : '');
    if (p.prijs) { el.prijs.hidden = false; el.prijs.querySelector('strong').textContent = euro(p.prijs * CFG.setAantal); }
    else el.prijs.hidden = true;
    var link3d = dlg.querySelector('.avdv-3d');
    if (!st.autoId) st.autoId = standaardAuto().id;
    if (link3d) link3d.href = CFG.url3d + (CFG.url3d.indexOf('?') < 0 ? '?' : '&') + 'velg=' + encodeURIComponent(p.id != null ? p.id : p.naam) + '&inch=' + p.inch + '&auto=' + encodeURIComponent(st.autoId);
    var a = autoMetId(st.autoId);
    el.merk.value = a.merk === 'Ander model' ? '__ander' : a.merk;
    vulModellen();
    el.model.value = a.id;
    st.velg = null;
    var bronnen = p.vooraanzicht ? [p.vooraanzicht].concat(p.fotos || []) : (p.fotos || []);
    teken();
    if (!dlg.open) dlg.showModal();
    var voor = p;
    maakVelg(bronnen).then(function (v) { if (st.product === voor) { st.velg = v; teken(); } }, function () {});
  }

  function plaatsKnop() {
    var product = leesProductVanPagina();
    if (!product || document.querySelector('.avdv-knop')) return;
    st.product = product;
    if (!document.getElementById('avdv-css')) {
      var css = document.createElement('style');
      css.id = 'avdv-css'; css.textContent = CSS;
      document.head.appendChild(css);
    }
    var knop = document.createElement('button');
    knop.type = 'button';
    knop.className = 'avdv-knop';
    knop.innerHTML = AUTO_ICOON + '<span>Bekijk deze velg op je auto<small>Kies je wagen en zie meteen hoe het eruitziet</small></span>';
    knop.addEventListener('click', function () { open(); });
    var anker = document.querySelector('.sell-box-form') || document.querySelector('.btn-cart');
    if (anker) anker.parentNode.insertBefore(knop, anker.nextSibling);
    else if (document.querySelector('h1')) document.querySelector('h1').insertAdjacentElement('afterend', knop);
    // velg alvast voorbereiden zodat het venster meteen klaar is
    var bronnen = product.vooraanzicht ? [product.vooraanzicht].concat(product.fotos) : product.fotos;
    if ('requestIdleCallback' in window) requestIdleCallback(function () { maakVelg(bronnen); });
  }

  window.AVDVelgOpAuto = { open: open, autos: AUTOS, plaatsKnop: plaatsKnop, maakVelg: maakVelg, tekenAuto: tekenAuto, bandVoorstel: bandVoorstel, leesBand: leesBand };

  if (CFG.autoMount) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', plaatsKnop);
    else plaatsKnop();
  }
})();
