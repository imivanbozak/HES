/**
 * stranice.mjs — generira proizvodi/<ime>.html za svih 59 Loxone artikala
 * i alati/<ime>.html za 16 alata iz najma.
 *
 * Pokretanje:  node scripts/stranice.mjs
 *              node scripts/stranice.mjs --provjeri   (samo javi, ne pisi)
 *
 * ZASTO GENERATOR, A NE 59 RUCNIH DATOTEKA
 * ----------------------------------------
 * Od 362 retka predloska, oko 180 je zaglavlje, izbornik, mobilni izbornik i
 * podnozje — isti na svakoj stranici. Da to stoji 59 puta, prva promjena u
 * izborniku bi trazila 59 jednakih izmjena, a jedna promasena bi bila stranica
 * s drugacijim izbornikom koju nitko ne bi primijetio dok je ne otvori.
 *
 * Isti razlog zasto vec postoje seed.py, proizvodi.mjs i slike.mjs: statican
 * izlaz, ali se ne pise rukom.
 *
 * IZVORI
 * ------
 *   assets/katalog.json        naziv, kategorije            (cijena i stanje NE
 *                              — njih js/proizvod.js crta u pregledniku, pa
 *                              prepisana cijena ovdje ne bi bila drugi izvor
 *                              nego drugi odgovor)
 *   data/proizvodi-tekst.mjs   opis, znacajke, tehnicki podaci, kataloski broj
 *   js/adrese.js               ime datoteke po artiklu
 *
 * APSOLUTNE PUTANJE
 * -----------------
 * Predlozak je stajao u korijenu pa su mu putanje bile relativne ("css/app.css").
 * Ove stranice stoje u /proizvodi/, gdje bi se ista putanja razrijesila u
 * /proizvodi/css/app.css i vratila 404. Zato sve ide s vodecom kosom crtom.
 * Isti je razlog za zahvat u js/pogledi.js — slike se grade u JS-u i preglednik
 * ih razrjesuje prema adresi dokumenta, ne prema adresi skripte.
 */
import { mkdir, writeFile, readFile, readdir, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { TEKST } from "../data/proizvodi-tekst.mjs";
import { ADRESE, MAPA, ADRESE_ALATA, MAPA_ALATA } from "../js/adrese.js";

const KORIJEN = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const IZLAZ = path.join(KORIJEN, "proizvodi");
const IZLAZ_ALATA = path.join(KORIJEN, "alati");
const SAMO_PROVJERA = process.argv.includes("--provjeri");

/**
 * Poveznica "Galerija" stoji skrivena dok galerija nema nijednu fotografiju
 * — isto pravilo koje scripts/galerija.mjs primjenjuje na rucno pisane
 * stranice. Postavlja se u glavni(), iz assets/galerija.json.
 */
let galerijaSkrivena = " hidden";

const BOJA = { zeleno: "\x1b[32m", crveno: "\x1b[31m", zuto: "\x1b[33m", sivo: "\x1b[90m", kraj: "\x1b[0m" };

/* ================================================================== */
/* Pomocno                                                             */
/* ================================================================== */
const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Eksponenti i indeksi, iz obicnih znamenki.
 *
 * Neue Regrade nema ² ni ₂ (ni ° ni ′ ni ″ — vidi IZBJEGAVAJ u
 * scripts/fontovi.py). Kad bi ti znakovi dosli na stranicu, preglednik bi za
 * taj jedan glif pao na Segoe UI i razlika bi se vidjela unutar iste rijeci:
 * "mm²" s dvojkom iz drugog pisma.
 *
 * Zato tekst nosi "mm^2" i "CO_2", a ovdje se to pretvara u <sup>2</sup> i
 * <sub>2</sub> — obicna znamenka koju font ima, samo podignuta. Ide POSLIJE
 * esc(), inace bi se oznake pobjegle zajedno sa sadrzajem.
 */
const znakovi = (s) => esc(s).replace(/\^2/g, "<sup>2</sup>").replace(/CO_2/g, "CO<sub>2</sub>");

/**
 * Iste oznake za meta opis, gdje HTML ne ide.
 *
 * Unicode ² i ₂ ovdje ne dolaze u obzir: provjera pisama cita cijelu datoteku,
 * pa bi znak u <meta> pao jednako kao znak u tijelu. "mm2" i "CO2" su u
 * jednoj recenici opisa posve citljivi.
 */
const meta_znakovi = (s) => esc(s).replace(/\^2/g, "2").replace(/CO_2/g, "CO2");

/** 65561 -> "655,61" */
const cijena = (centi) =>
  new Intl.NumberFormat("hr-HR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(centi / 100);

/**
 * Naslovi karusela po skupini.
 *
 * Karusel bira artikle iz iste podskupine pa iste skupine (js/proizvod.js),
 * pa naslov mora govoriti o skupini, a ne o artiklu.
 */
const KARUSEL = {
  "miniserveri": ["Miniserveri i proširenja", "Ostale upravljačke jedinice i proširenja koja se ugrađuju uz {n}."],
  "prosirenja": ["Proširenja", "Ostala proširenja i upravljačke jedinice koje se ugrađuju uz {n}."],
  "doticajni-uredaji-i-tipkala": ["Doticajni uređaji i tipkala", "Ostala tipkala i doticajni uređaji iz Loxone ponude."],
  "senzori": ["Senzori", "Ostali senzori koji se ugrađuju u isti sustav."],
  "osvjetljenje": ["Osvjetljenje", "Ostala rasvjetna tijela i upravljanje koje ide uz njih."],
  "upravljanje-osvjetljenjem": ["Upravljanje osvjetljenjem", "Ostali dimeri i upravljači za rasvjetu."],
  "audio-sustavi": ["Audio sustavi", "Ostale audio jedinice, zvučnici i kutije."],
  "aktuatori-i-pogoni": ["Aktuatori i pogoni", "Ostali pogoni i aktuatori za grijanje i zasjenjenje."],
  "pametne-uticnice": ["Pametne utičnice", "Ostale izvedbe pametnih utičnica."],
  "kabeli-i-konektori": ["Kabeli i konektori", "Ostali kabeli, stezaljke i konektori za Loxone sustav."],
  "dodatni-materijali": ["Dodatni materijali", "Ostali dodatni materijali i potrošni dijelovi."],
};

/**
 * Oznake suradnje.
 *
 * Sluzbeni znakovi (Works with Apple Home, AirPlay, DALI-2) su zasticeni
 * znakovi i nisu medu dostavljenim materijalima. Ovo su neutralne oznake koje
 * nose istu cinjenicu bez preslikavanja tudeg znaka — isto rjesenje i isti
 * razlog kao na predlosku. Kad znakovi stignu od klijenta, mijenja se samo
 * ova tablica.
 */
const ZNAKOVI = {
  "apple-home": {
    tekst: "Radi s Apple Home",
    put: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/>',
  },
  "airplay": {
    tekst: "Radi s Apple AirPlay 2",
    put: '<path d="M6 17H4.5A1.5 1.5 0 0 1 3 15.5v-9A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5v9a1.5 1.5 0 0 1-1.5 1.5H18"/><path d="m12 14 4.5 6h-9L12 14z"/>',
  },
  "dali-2": {
    tekst: "DALI-2 certificirano",
    put: '<circle cx="12" cy="12" r="8.5"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  },
};

/* ================================================================== */
/* Dijelovi stranice                                                   */
/* ================================================================== */

/** Zaglavlje dokumenta — jedina promjenjiva stvar su meta podaci i adresa. */
function glava({ naslov, opis, adresa }) {
  return `<!doctype html>
<html lang="hr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(naslov)}</title>
<meta name="description" content="${meta_znakovi(opis)}">
<meta name="theme-color" content="#0A0908">
<link rel="canonical" href="https://hes.hr${adresa}">

<link rel="alternate" hreflang="hr" href="https://hes.hr${adresa}">
<link rel="alternate" hreflang="de" href="https://hes.hr/de${adresa}">
<link rel="alternate" hreflang="en" href="https://hes.hr/en${adresa}">
<link rel="alternate" hreflang="x-default" href="https://hes.hr${adresa}">

<link rel="icon" href="/assets/logo/logo-mark-color.png">

<script>
  (function () {
    var tema = null;
    try { tema = localStorage.getItem("hes.tema"); } catch (e) {}
    if (tema !== "tamna" && tema !== "svijetla") {
      var svijetlo = false;
      try { svijetlo = window.matchMedia("(prefers-color-scheme: light)").matches; } catch (e) {}
      tema = svijetlo ? "svijetla" : "tamna";
    }
    document.documentElement.dataset.theme = tema;
    document.documentElement.classList.add("js-pokret");
  })();
</script>

<link rel="preload" href="/assets/fonts/hes-regrade.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/css/tokens.css">
<link rel="stylesheet" href="/css/app.css">
<link rel="stylesheet" href="/css/sekcije.css">
<link rel="stylesheet" href="/css/trgovina.css">
</head>
`;
}

/** Skeleton za stranice proizvoda. Prati galeriju, podatke i specifikaciju. */
function kosturProizvoda() {
  return `<div class="kostur-stranice" data-kostur data-kostur-tip="proizvod" role="status" aria-live="polite" aria-label="Učitavanje stranice">
  <div class="kostur-stranice__traka" aria-hidden="true">
    <span class="kostur-stranice__znak" data-kostur-oblik></span>
    <span class="kostur-stranice__nav" data-kostur-oblik></span>
    <span class="kostur-stranice__alat" data-kostur-oblik></span>
    <span class="kostur-stranice__alat" data-kostur-oblik></span>
  </div>
  <div class="kostur-stranice__sadrzaj" aria-hidden="true">
    <div class="kostur-predlozak kostur-predlozak--proizvod">
      <div class="kostur-proizvod__galerija">
        <span class="kostur-proizvod__glavni" data-kostur-oblik></span>
        <span class="kostur-proizvod__slicice"><span class="kostur-slicica" data-kostur-oblik></span><span class="kostur-slicica" data-kostur-oblik></span><span class="kostur-slicica" data-kostur-oblik></span><span class="kostur-slicica" data-kostur-oblik></span></span>
      </div>
      <div class="kostur-proizvod__podaci">
        <span class="kostur-redak kostur-redak--kratak" data-kostur-oblik></span>
        <span class="kostur-redak kostur-redak--oznaka" data-kostur-oblik></span>
        <span class="kostur-naslov" data-kostur-oblik></span>
        <span class="kostur-proizvod__cijena" data-kostur-oblik></span>
        <div class="kostur-proizvod__akcije"><span class="kostur-gumb" data-kostur-oblik></span><span class="kostur-gumb" data-kostur-oblik></span></div>
        <span class="kostur-redak kostur-redak--srednji" data-kostur-oblik></span>
        <div class="kostur-proizvod__spec"><span class="kostur-redak" data-kostur-oblik></span><span class="kostur-redak" data-kostur-oblik></span><span class="kostur-redak kostur-redak--kratak" data-kostur-oblik></span></div>
      </div>
    </div>
  </div>
</div>`;
}

/** Zaglavlje stranice i oba izbornika. Isto na svih 59, mijenja se samo jezicna traka. */
function zaglavlje(adresa) {
  return `
<body>
${kosturProizvoda()}
<a class="preskoci" href="#sadrzaj">Preskoči na sadržaj</a>
<div class="platno-pozadina" aria-hidden="true" data-platno></div>

<div class="ljuska">

<header class="zaglavlje">
  <div class="stupac zaglavlje__sadrzaj">
    <a class="znak" href="/" aria-label="HES — početna">
      <img class="znak__svijetli" src="/assets/logo/logo-mark-white.png" alt="Hranj Electrical Services" width="192" height="193">
      <img class="znak__tamni" src="/assets/logo/logo-mark-color.png" alt="Hranj Electrical Services" width="192" height="193">
    </a>

    <ul class="izbornik">
      <li class="izbornik__stavka">
        <!-- S ove stranice svako sidro naslovnice mora biti "/#sidro", nikad
             samo "#sidro" — hes-structure.md §3.1 to zove obaveznim. -->
        <a class="izbornik__veza" href="/#usluge">Usluge <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></a>
        <ul class="izbornik__pod">
          <li><p class="oznaka">Tri kategorije usluga</p></li>
          <li><a href="/#industrijske-elektroinstalacije">Industrijske elektroinstalacije</a></li>
          <li><a href="/#zavrsni-radovi">Završni radovi</a></li>
          <li><a href="/#kucne-elektroinstalacije">Kućne elektroinstalacije</a></li>
        </ul>
      </li>
      <li class="izbornik__stavka">
        <a class="izbornik__veza" href="/webshop">Loxone smart home <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></a>
        <ul class="izbornik__pod izbornik__pod--dvostupacni">
          <li class="izbornik__pod-naslov"><p class="oznaka">Skupine proizvoda</p></li>
          <li><a href="/webshop?skupina=miniserveri">Miniserveri</a></li>
          <li><a href="/webshop?skupina=prosirenja">Proširenja</a></li>
          <li><a href="/webshop?skupina=doticajni-uredaji-i-tipkala">Doticajni uređaji i tipkala</a></li>
          <li><a href="/webshop?skupina=senzori">Senzori</a></li>
          <li><a href="/webshop?skupina=osvjetljenje">Osvjetljenje</a></li>
          <li><a href="/webshop?skupina=upravljanje-osvjetljenjem">Upravljanje osvjetljenjem</a></li>
          <li><a href="/webshop?skupina=audio-sustavi">Audio sustavi</a></li>
          <li><a href="/webshop?skupina=aktuatori-i-pogoni">Aktuatori i pogoni</a></li>
          <li><a href="/webshop?skupina=pametne-uticnice">Pametne utičnice</a></li>
          <li><a href="/webshop?skupina=kabeli-i-konektori">Kabeli i konektori</a></li>
          <li><a href="/webshop?skupina=dodatni-materijali">Dodatni materijali</a></li>
          <li class="izbornik__pod-sve"><a href="/webshop">Cijeli katalog</a></li>
        </ul>
      </li>
      <li class="izbornik__stavka">
        <a class="izbornik__veza" href="/najam-alata">Najam alata <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></a>
        <ul class="izbornik__pod">
          <li class="izbornik__pod-naslov"><p class="oznaka">Kategorije alata</p></li>
          <li><a href="/najam-alata?skupina=ljestve-i-skele">Ljestve i skele</a></li>
          <li><a href="/najam-alata?skupina=rezanje-i-brusenje">Rezanje i brušenje</a></li>
          <li><a href="/najam-alata?skupina=busenje-i-odvijanje">Bušenje i odvijanje</a></li>
          <li><a href="/najam-alata?skupina=usisavaci-i-otprasivanje">Usisavači i otprašivanje</a></li>
          <li class="izbornik__pod-sve"><a href="/najam-alata">Cijeli cjenik</a></li>
        </ul>
      </li>
      <li class="izbornik__stavka" data-galerija-veza${galerijaSkrivena}>
        <a class="izbornik__veza" href="/galerija">Galerija</a>
      </li>
      <li class="izbornik__stavka">
        <a class="izbornik__veza" href="/#zaposlenje">Zaposlenje</a>
      </li>
      <li class="izbornik__stavka">
        <a class="izbornik__veza" href="/#kontakt">Kontakt</a>
      </li>
    </ul>

    <div class="alati-zaglavlja">
      <nav class="jezici staklo" aria-label="Jezik">
        <a href="${adresa}" hreflang="hr" aria-current="true">hr</a>
        <a href="/de${adresa}" hreflang="de">de</a>
        <a href="/en${adresa}" hreflang="en">en</a>
      </nav>
      <button class="ikona-gumb tema-gumb" type="button" data-tema-gumb aria-label="Prebaci temu">
        <svg class="ikona-sunce" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
        <svg class="ikona-mjesec" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
      </button>
      <button class="ikona-gumb kosarica-gumb" type="button" data-kosarica-otvori aria-label="Otvori košaricu">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M3 4h2l2.4 10.4a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.55L21 8H6"/><circle cx="10" cy="20" r="1.2"/><circle cx="18" cy="20" r="1.2"/></svg>
        <span class="kosarica-brojac monr" data-kosarica-brojac hidden>0</span>
      </button>
      <!-- Tema i jezik se ispod 1024 px sklanjaju u dijalog postavki: u traci
           od 64 px uz kosaricu i izbornik za njih nema mjesta, a znak se od
           gnjecenja spljosti. Iznad 1024 px ovaj gumb ne postoji. -->
      <button class="ikona-gumb postavke-gumb" type="button" data-postavke-otvori aria-controls="postavke" aria-label="Otvori postavke">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3.1"/><path d="M19.5 12a7.5 7.5 0 0 0-.13-1.36l2-1.55-1.9-3.3-2.36.95a7.5 7.5 0 0 0-2.36-1.36L14.4 2.9h-3.8l-.35 2.48a7.5 7.5 0 0 0-2.36 1.36L5.53 5.79l-1.9 3.3 2 1.55a7.5 7.5 0 0 0 0 2.72l-2 1.55 1.9 3.3 2.36-.95a7.5 7.5 0 0 0 2.36 1.36l.35 2.48h3.8l.35-2.48a7.5 7.5 0 0 0 2.36-1.36l2.36.95 1.9-3.3-2-1.55c.09-.44.13-.9.13-1.36z"/></svg>
      </button>
      <button class="ikona-gumb otvori-izbornik" type="button" data-izbornik-prekidac aria-expanded="false" aria-controls="mobilni-izbornik" aria-label="Otvori izbornik">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
      </button>
    </div>
  </div>
</header>

<div class="zastor" data-izbornik-zastor hidden></div>
<nav class="mobilni-izbornik" id="mobilni-izbornik" data-mobilni-izbornik hidden aria-label="Glavni izbornik">
  <!-- Skupina ima dvije mete: naziv vodi na stranicu, strelica otvara popis.
       Popis je isti padajuci dio kao u traci na desktopu (js/main.js). -->
  <div class="mob-skupina">
    <div class="mob-skupina__red">
      <a class="mob-skupina__veza" href="/#usluge">Usluge</a>
      <button class="mob-skupina__strelica" type="button" aria-expanded="false" aria-controls="mob-usluge" aria-label="Prikažite usluge"><svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>
    </div>
    <div class="mob-pod" id="mob-usluge">
      <div class="mob-pod__okvir">
        <ul class="mob-pod__popis">
          <li><a href="/#industrijske-elektroinstalacije">Industrijske elektroinstalacije</a></li>
          <li><a href="/#zavrsni-radovi">Završni radovi</a></li>
          <li><a href="/#kucne-elektroinstalacije">Kućne elektroinstalacije</a></li>
        </ul>
      </div>
    </div>
  </div>
  <div class="mob-skupina">
    <div class="mob-skupina__red">
      <a class="mob-skupina__veza" href="/webshop">Loxone smart home</a>
      <button class="mob-skupina__strelica" type="button" aria-expanded="false" aria-controls="mob-loxone" aria-label="Prikažite skupine proizvoda"><svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>
    </div>
    <div class="mob-pod" id="mob-loxone">
      <div class="mob-pod__okvir">
        <ul class="mob-pod__popis mob-pod__popis--dvostupacni">
          <li class="mob-pod__naslov"><p class="oznaka">Skupine proizvoda</p></li>
          <li><a href="/webshop?skupina=miniserveri">Miniserveri</a></li>
          <li><a href="/webshop?skupina=prosirenja">Proširenja</a></li>
          <li><a href="/webshop?skupina=doticajni-uredaji-i-tipkala">Doticajni uređaji i tipkala</a></li>
          <li><a href="/webshop?skupina=senzori">Senzori</a></li>
          <li><a href="/webshop?skupina=osvjetljenje">Osvjetljenje</a></li>
          <li><a href="/webshop?skupina=upravljanje-osvjetljenjem">Upravljanje osvjetljenjem</a></li>
          <li><a href="/webshop?skupina=audio-sustavi">Audio sustavi</a></li>
          <li><a href="/webshop?skupina=aktuatori-i-pogoni">Aktuatori i pogoni</a></li>
          <li><a href="/webshop?skupina=pametne-uticnice">Pametne utičnice</a></li>
          <li><a href="/webshop?skupina=kabeli-i-konektori">Kabeli i konektori</a></li>
          <li><a href="/webshop?skupina=dodatni-materijali">Dodatni materijali</a></li>
        </ul>
      </div>
    </div>
  </div>
  <div class="mob-skupina">
    <div class="mob-skupina__red">
      <a class="mob-skupina__veza" href="/najam-alata">Najam alata</a>
      <button class="mob-skupina__strelica" type="button" aria-expanded="false" aria-controls="mob-najam" aria-label="Prikažite kategorije alata"><svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>
    </div>
    <div class="mob-pod" id="mob-najam">
      <div class="mob-pod__okvir">
        <ul class="mob-pod__popis">
          <li class="mob-pod__naslov"><p class="oznaka">Kategorije alata</p></li>
          <li><a href="/najam-alata?skupina=ljestve-i-skele">Ljestve i skele</a></li>
          <li><a href="/najam-alata?skupina=rezanje-i-brusenje">Rezanje i brušenje</a></li>
          <li><a href="/najam-alata?skupina=busenje-i-odvijanje">Bušenje i odvijanje</a></li>
          <li><a href="/najam-alata?skupina=usisavaci-i-otprasivanje">Usisavači i otprašivanje</a></li>
        </ul>
      </div>
    </div>
  </div>
  <a href="/galerija" data-galerija-veza${galerijaSkrivena}>Galerija</a>
  <a href="/#zaposlenje">Zaposlenje</a>
  <div class="mob-red">
    <a href="/#kontakt">Kontakt</a>
    <a href="tel:0038599 2057845"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.5 3h3l1.5 4-2 1.4a12 12 0 0 0 5.6 5.6L16 12l4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 3.5 5.2 2 2 0 0 1 5.5 3z"/></svg> <span data-i18n="opce.nazovite">Nazovite</span></a>
  </div>
</nav>

<!--
  Postavke. Sadrzaj su ISTE kontrole koje stoje u traci, ne njihova kopija:
  temu i dalje vodi js/tema.js preko delegiranog slusaca, a jezicna traka su
  i ovdje obicne poveznice.
-->
<dialog class="postavke prozor" id="postavke" data-postavke aria-label="Postavke">
  <div class="prozor__traka" data-zivo="crta">
    <span class="prozor__tocka"></span><span class="prozor__tocka"></span><span class="prozor__tocka"></span>
    <span class="prozor__naslov">postavke.hes</span>
    <button class="ikona-gumb ikona-gumb--sitni prozor__zatvori" type="button" data-postavke-zatvori aria-label="Zatvori postavke">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>
    </button>
  </div>
  <div class="postavke__tijelo">
    <div class="postavke__red">
      <span class="oznaka">Tema</span>
      <button class="ikona-gumb tema-gumb" type="button" data-tema-gumb aria-label="Prebaci temu">
        <svg class="ikona-sunce" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
        <svg class="ikona-mjesec" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
      </button>
    </div>
    <div class="postavke__red">
      <span class="oznaka">Jezik</span>
      <nav class="jezici staklo" aria-label="Jezik">
        <a href="${adresa}" hreflang="hr" aria-current="true">hr</a>
        <a href="/de${adresa}" hreflang="de">de</a>
        <a href="/en${adresa}" hreflang="en">en</a>
      </nav>
    </div>
  </div>
</dialog>
`;
}

/** Podnozje. Isto na svih 59 — jezicna traka je preseljena u zaglavlje. */
function podnozje() {
  return `
<footer class="podnozje">
  <div class="stupac">
    <div class="podnozje__stupci">
      <div>
        <h3>Kontakt</h3>
        <ul>
          <li><a href="mailto:alen.hranj@hes.hr">alen.hranj@hes.hr</a></li>
          <li><a class="monr" href="tel:0038599 2057845">00385 99 205 7845</a></li>
        </ul>
      </div>
      <div>
        <h3>Usluge</h3>
        <ul>
          <li><a href="/#industrijske-elektroinstalacije">Industrijske elektroinstalacije</a></li>
          <li><a href="/#zavrsni-radovi">Završni radovi</a></li>
          <li><a href="/#kucne-elektroinstalacije">Kućne elektroinstalacije</a></li>
        </ul>
      </div>
      <div>
        <h3>Ponuda</h3>
        <ul>
          <li><a href="/webshop">Loxone smart home</a></li>
          <li><a href="/najam-alata">Najam alata</a></li>
          <li data-galerija-veza${galerijaSkrivena}><a href="/galerija">Galerija</a></li>
          <li><a href="/#zaposlenje">Zaposlenje</a></li>
        </ul>
      </div>
    </div>
    <div class="podnozje__dno">
      <span>Hranj electrical services d.o.o. · <a href="/privatnost">Privatnost</a></span>
      <!-- Jezicna traka je odavde maknuta: ista stoji u zaglavlju, a na dnu
           duge stranice korisnija je tipka koja vraca na vrh. -->
      <button class="na-vrh" type="button" data-na-vrh>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5"/><path d="m6 11 6-6 6 6"/></svg>
        <span>Na vrh</span>
      </button>
    </div>
  </div>
</footer>

</div><!-- /ljuska -->

<script type="module" src="/js/main.js"></script>
</body>
</html>
`;
}

/* ================================================================== */
/* Tijelo stranice                                                     */
/* ================================================================== */
function tijelo({ artikl, tekst, skupina, podskupina, adresa }) {
  const naziv = artikl.naziv;
  const znak = tekst.znak ? ZNAKOVI[tekst.znak] : null;

  const oznaka = [skupina?.naziv_hr, podskupina?.naziv_hr].filter(Boolean).join(" · ");

  const znacajkeBlok = tekst.znacajke.length
    ? `
        <div data-otkrij>
          <h2 class="naslov-3">Značajke</h2>
          <ul class="popis-znacajki">
${tekst.znacajke.map((z) => `            <li>${znakovi(z)}</li>`).join("\n")}
          </ul>
        </div>
`
    : "";

  // Kataloski broj ide u tehnicke podatke i kad Loxone nista drugo ne objavi,
  // pa ovaj blok nikad nije prazan.
  const cinjenice = [...tekst.tehnicki, { naziv: "Kataloški broj", vrijednost: tekst.broj }];

  const [karuselNaslov, karuselUvod] = KARUSEL[skupina?.id] ?? [
    "Uz ovaj artikl",
    "Ostali Loxone artikli iz iste skupine.",
  ];

  return `
<main id="sadrzaj">

<!-- ================================================================= -->
<!-- product-detail — ${naziv} -->
<!-- ================================================================= -->
<!--
  PODJELA POSLA, ista na svih 59 stranica:

    ovdje    stoji PROZA — opis, znacajke, tehnicki podaci. Toga nema ni u
             izvozu ni u katalogu; dolazi iz LOXONE-PROIZVODI.md, a pise se
             u data/proizvodi-tekst.mjs.
    js/proizvod.js  puni sve sto katalog vec zna — cijenu, stanje, galeriju,
             video, kosaricu, preporuke. Prepisana cijena u HTML-u bi se za
             pola godine razlikovala od one u mrezi i nitko ne bi znao koja
             je tocna.

  Sekcija se prepoznaje po \`data-proizvod="${artikl.id}"\` — to je WooCommerce ID
  iz assets/katalog.json, isti kojim se artikl vodi u katalogu i u kosarici.

  Datoteka je generirana. Ne mijenjati rucno — promjene ide u
  scripts/stranice.mjs ili data/proizvodi-tekst.mjs, pa \`npm run stranice\`.
-->
<section class="polje polje--zbijeno proizvod-stranica" data-proizvod="${artikl.id}">
  <div class="stupac">

    <nav class="mrvice" aria-label="Staza">
      <a href="/webshop">Webshop</a>
      <span aria-hidden="true">/</span>
      <a href="/webshop?skupina=${esc(skupina?.id ?? "")}">${esc(skupina?.naziv_hr ?? "Katalog")}</a>
      <span aria-hidden="true">/</span>
      <span aria-current="page">${esc(naziv)}</span>
    </nav>

    <div class="proizvod-stranica__mreza">

      <!-- Galerija: video + fotografije, crta je js/proizvod.js -->
      <!-- Kadar se pokrece sam svakih 10 s dok je galerija u vidokrugu; ciklus
           vodi js/interakcije.js, a klik po videu ga pauzira. Atribut stoji na
           NOSACU jer njega js/proizvod.js ne zamjenjuje, nego mu puni sadrzaj. -->
      <div class="proizvod-stranica__medij" data-galerija-nosac data-video-ciklus="10000"></div>

      <div class="proizvod-stranica__podaci">
        <p class="oznaka">${esc(oznaka)}</p>
        <h1 class="naslov-2">${esc(naziv)}</h1>
        <p class="jedva monr">Kataloški broj: ${esc(tekst.broj)}</p>

        <div class="proizvod-stranica__cijena">
          <div data-cijena></div>
          <!--
            "bez PDV-a" stoji ovdje jer je taj podatak dostavljen uz artikl —
            LOXONE-PROIZVODI.md nosi cijene bez PDV-a za svih 59 artikala.
            hes-content.md marker 16 / §8.8 zabranjuje TVRDNJU o PDV-u dok je
            izvor ne sadrzi, a ne zabranjuje je kad je sadrzi.
          -->
          <p class="jedva">po komadu · bez PDV-a</p>
        </div>

        <div data-stanje></div>

        <div class="proizvod-stranica__akcije" data-akcije></div>

        <p class="jedva napomena-cijene">
          Cijene su prema cjeniku. Konačnu ponudu šaljemo e-poštom.
        </p>
${
  znak
    ? `
        <!--
          Sluzbeni znak je zasticeni znak i nije medu dostavljenim materijalima.
          Ovo je neutralna oznaka koja nosi istu cinjenicu bez preslikavanja
          tudeg znaka; kad znak stigne od klijenta, mijenja se samo tablica
          ZNAKOVI u scripts/stranice.mjs.
        -->
        <p class="znak-suradnje">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${znak.put}</svg>
          ${esc(znak.tekst)}
        </p>
`
    : ""
}
        <div class="akcije">
          <a class="gumb gumb--tihi van" href="/#kontakt">Zatražite ugradnju</a>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ================================================================= -->
<!-- product-copy — opis, znacajke, tehnicki podaci                     -->
<!-- ================================================================= -->
<section class="polje polje--podignuto polje--zbijeno">
  <div class="stupac">
    <div class="proizvod-opis">

      <div class="proizvod-opis__tekst">
        <h2 class="naslov-3" data-otkrij>Opis</h2>
        <p class="uvod stupac--tekst" data-otkrij>
          ${znakovi(tekst.opis)}
        </p>
      </div>

      <div class="proizvod-opis__stupci">${znacajkeBlok}
        <div data-otkrij>
          <h2 class="naslov-3">Tehnički podaci</h2>
          <dl class="cinjenice">
${cinjenice
  .map(
    (c) => `            <div>
              <dt>${znakovi(c.naziv)}</dt>
              <dd class="monr">${znakovi(c.vrijednost)}</dd>
            </div>`
  )
  .join("\n")}
          </dl>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ================================================================= -->
<!-- product-recommendations — karusel                                  -->
<!-- ================================================================= -->
<section class="polje polje--zbijeno">
  <div class="stupac">
    <header class="zaglavlje-sekcije" data-otkrij>
      <p class="oznaka">Uz ovaj artikl</p>
      <h2 class="naslov-2">${esc(karuselNaslov)}</h2>
      <p class="uvod stupac--tekst">
        ${esc(karuselUvod.replace("{n}", naziv))}
      </p>
    </header>

    <!-- Karusel crta js/proizvod.js istim karticama kao i mreza kataloga. -->
    <div data-preporuke></div>

    <div class="akcije" data-otkrij>
      <a class="gumb gumb--sporedni" href="/webshop">Cijeli katalog</a>
    </div>
  </div>
</section>

</main>
`;
}

/* ================================================================== */
/* Sastavljanje                                                        */
/* ================================================================== */
function stranica({ artikl, tekst, skupina, podskupina, adresa }) {
  // Nekoliko naziva u katalogu vec pocinje s "Loxone" ("Loxone Clamp Tree").
  const puniNaziv = /^loxone\b/i.test(artikl.naziv) ? artikl.naziv : `Loxone ${artikl.naziv}`;

  // Prva recenica opisa. Ako pocinje imenom artikla, ime se skida — u opisu
  // stoji zato sto je ondje prva recenica teksta, ali u meta opisu bi doslo
  // odmah iza istog tog imena i ponovilo ga u istoj recenici. Kad recenica
  // pocinje necim drugim (npr. "DALI je standardizirano..."), ostaje cijela,
  // jer bi rezanje po sablonu odsjeklo subjekt.
  //
  // Recenica zavrsava tockom iza koje slijedi VELIKO slovo. Samo ". " bi
  // rezalo i kratice: "za Miniserver Gen. 1. Zamjenom..." je davalo meta
  // opis koji zavrsava na "Gen.".
  const prva = (tekst.opis.split(/\.\s+(?=[A-ZČĆŠŽĐ])/)[0] || tekst.opis).replace(/\.$/, "").trim();
  const bezImena = prva.replace(
    new RegExp(`^(?:Loxone\\s+)?${artikl.naziv.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+(?:je|su)\\s+`, "i"),
    ""
  );
  const uvodno = bezImena.charAt(0).toUpperCase() + bezImena.slice(1);

  const meta =
    `${puniNaziv}, kataloški broj ${tekst.broj} — ` +
    `${cijena(artikl.cijena_cents)} € po komadu bez PDV-a. ` +
    `${uvodno}. Ovlašteni partneri firme Loxone.`;

  return (
    glava({ naslov: `${puniNaziv} — cijena i specifikacija | HES`, opis: meta, adresa }) +
    zaglavlje(adresa) +
    tijelo({ artikl, tekst, skupina, podskupina, adresa }) +
    podnozje()
  );
}

/* ================================================================== */
/* Stranica alata iz najma                                             */
/* ================================================================== */
/**
 * Isti raspored kao stranica Loxone artikla, ali bez proze.
 *
 * Za alate izvor nosi samo naziv, marku, kategoriju, cijenu po danu, stanje i
 * fotografije — ni opisa ni tehnickih podataka. Umjesto izmisljenog teksta
 * stranica pokazuje tocno to (odluka klijenta). Kad opisi stignu, ovdje se
 * dodaje blok "Opis" kao u `tijelo()`, iz vlastite datoteke u data/.
 *
 * Cijena se ni ovdje ne prepisuje u HTML: crta je js/proizvod.js iz
 * kataloga, iz istog razloga kao kod Loxone stranica.
 */
function tijeloAlata({ artikl, kategorija }) {
  const naziv = artikl.naziv;
  const imeKategorije = kategorija?.naziv_hr ?? "Najam alata";

  const cinjenice = [
    { naziv: "Marka", vrijednost: artikl.marka },
    { naziv: "Kategorija", vrijednost: imeKategorije },
    { naziv: "Obračun najma", vrijednost: "Po danu" },
  ];

  return `
<main id="sadrzaj">

<!-- ================================================================= -->
<!-- rental-detail — ${naziv} -->
<!-- ================================================================= -->
<!--
  Isti obrazac kao proizvodi/*.html: sekcija se prepoznaje po
  \`data-proizvod="${artikl.id}"\`, a js/proizvod.js puni cijenu, stanje,
  galeriju, kosaricu i preporuke. Dodavanje alata u kosaricu odmah otvara
  ladicu, jer se najam bez datuma ne moze procijeniti.

  Datoteka je generirana. Ne mijenjati rucno — promjene idu u
  scripts/stranice.mjs, pa \`npm run stranice\`.
-->
<section class="polje polje--zbijeno proizvod-stranica" data-proizvod="${artikl.id}">
  <div class="stupac">

    <nav class="mrvice" aria-label="Staza">
      <a href="/najam-alata">Najam alata</a>
      <span aria-hidden="true">/</span>
      <a href="/najam-alata?skupina=${esc(kategorija?.id ?? "")}">${esc(imeKategorije)}</a>
      <span aria-hidden="true">/</span>
      <span aria-current="page">${esc(naziv)}</span>
    </nav>

    <div class="proizvod-stranica__mreza">

      <!-- Galerija: fotografije, crta je js/proizvod.js -->
      <div class="proizvod-stranica__medij" data-galerija-nosac></div>

      <div class="proizvod-stranica__podaci">
        <p class="oznaka">${esc(imeKategorije)}</p>
        <h1 class="naslov-2">${esc(naziv)}</h1>
        <p class="jedva monr">Marka: ${esc(artikl.marka)}</p>

        <div class="proizvod-stranica__cijena">
          <div data-cijena></div>
          <!-- Samo "po danu": izvor za alate ne navodi PDV, pa se o njemu
               nista ne tvrdi (hes-content.md, marker 16 / §8.8). -->
          <p class="jedva">po danu</p>
        </div>

        <div data-stanje></div>

        <div class="proizvod-stranica__akcije" data-akcije></div>

        <p class="jedva napomena-cijene">
          Cijene su prema cjeniku. Razdoblje najma birate u košarici, a konačnu ponudu šaljemo e-poštom.
        </p>

        <div class="akcije">
          <a class="gumb gumb--tihi van" href="/#kontakt">Zatražite ponudu</a>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ================================================================= -->
<!-- rental-facts — samo podaci koje izvor nosi                         -->
<!-- ================================================================= -->
<section class="polje polje--podignuto polje--zbijeno">
  <div class="stupac">
    <div class="proizvod-opis proizvod-opis--kratko">
      <div class="proizvod-opis__stupci">
        <div data-otkrij>
          <h2 class="naslov-3">Podaci o najmu</h2>
          <dl class="cinjenice">
${cinjenice
  .map(
    (c) => `            <div>
              <dt>${esc(c.naziv)}</dt>
              <dd>${esc(c.vrijednost)}</dd>
            </div>`
  )
  .join("\n")}
          </dl>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ================================================================= -->
<!-- rental-recommendations — karusel                                   -->
<!-- ================================================================= -->
<section class="polje polje--zbijeno">
  <div class="stupac">
    <header class="zaglavlje-sekcije" data-otkrij>
      <p class="oznaka">Uz ovaj alat</p>
      <h2 class="naslov-2">Ostali alati za najam</h2>
      <p class="uvod stupac--tekst">
        Najprije alati iz iste kategorije, zatim ostatak cjenika. Cijene su po danu.
      </p>
    </header>

    <!-- Karusel crta js/proizvod.js istim karticama kao i cjenik. -->
    <div data-preporuke></div>

    <div class="akcije" data-otkrij>
      <a class="gumb gumb--sporedni" href="/najam-alata">Cijeli cjenik</a>
    </div>
  </div>
</section>

</main>
`;
}

function stranicaAlata({ artikl, kategorija, adresa }) {
  // Svi nazivi alata vec pocinju markom ("Bosch GWS 18V-10", "K+K 235628"),
  // pa je marka u meta opisu ne ponavlja.
  const meta =
    `Najam ${artikl.naziv} po danu: ${cijena(artikl.cijena_cents)} € dnevno. ` +
    `${kategorija?.naziv_hr ?? "Profesionalni alat"} — odaberite datume u košarici i zatražite ponudu.`;

  return (
    glava({ naslov: `Najam ${artikl.naziv} — cijena po danu | HES`, opis: meta, adresa }) +
    zaglavlje(adresa) +
    tijeloAlata({ artikl, kategorija }) +
    podnozje()
  );
}

/* ================================================================== */
/* Pokretanje                                                          */
/* ================================================================== */
async function glavni() {
  const katalog = JSON.parse(await readFile(path.join(KORIJEN, "assets", "katalog.json"), "utf8"));

  const manifestGalerije = path.join(KORIJEN, "assets", "galerija.json");
  if (existsSync(manifestGalerije)) {
    const galerija = JSON.parse(await readFile(manifestGalerije, "utf8"));
    galerijaSkrivena = galerija.slike?.length ? "" : " hidden";
  }
  const kategorije = new Map(katalog.kategorije.map((k) => [k.id, k]));
  const artikli = new Map(katalog.artikli.map((a) => [a.id, a]));

  const greske = [];
  for (const id of ADRESE.keys()) {
    if (!artikli.has(id)) greske.push(`${id}: nema ga u assets/katalog.json`);
    if (!TEKST[id]) greske.push(`${id}: nema teksta u data/proizvodi-tekst.mjs`);
  }
  for (const id of ADRESE_ALATA.keys()) {
    if (!artikli.has(id)) greske.push(`${id}: alata nema u assets/katalog.json`);
  }
  for (const a of katalog.artikli) {
    if (a.vrsta === "loxone" && !ADRESE.has(a.id)) greske.push(`${a.id} (${a.naziv}): nema adresu u js/adrese.js`);
    if (a.vrsta === "alat" && !ADRESE_ALATA.has(a.id)) {
      greske.push(`${a.id} (${a.naziv}): alat nema adresu u js/adrese.js (ADRESE_ALATA)`);
    }
  }
  if (greske.length) {
    for (const g of greske) console.error(`${BOJA.crveno}✗${BOJA.kraj} ${g}`);
    process.exitCode = 1;
    return;
  }

  // Kategorije su poredane: prva je skupina, druga podskupina.
  const skupinaZa = (artikl) =>
    artikl.kategorije.map((k) => kategorije.get(k)).find((k) => k && !k.roditelj_id);
  const podskupinaZa = (artikl) =>
    artikl.kategorije.map((k) => kategorije.get(k)).find((k) => k && k.roditelj_id);

  const loxone = [...ADRESE].map(([id, ime]) => {
    const artikl = artikli.get(id);
    return {
      ime,
      naziv: artikl.naziv,
      html: stranica({
        artikl,
        tekst: TEKST[id],
        skupina: skupinaZa(artikl),
        podskupina: podskupinaZa(artikl),
        adresa: `${MAPA}/${ime}`,
      }),
    };
  });

  const alati = [...ADRESE_ALATA].map(([id, ime]) => {
    const artikl = artikli.get(id);
    return {
      ime,
      naziv: artikl.naziv,
      html: stranicaAlata({ artikl, kategorija: skupinaZa(artikl), adresa: `${MAPA_ALATA}/${ime}` }),
    };
  });

  const brojLoxone = await pisi(IZLAZ, loxone);
  const brojAlata = await pisi(IZLAZ_ALATA, alati);

  console.log(
    `\n${BOJA.zeleno}${brojLoxone}${BOJA.kraj} stranica u ${BOJA.sivo}proizvodi/${BOJA.kraj}, ` +
      `${BOJA.zeleno}${brojAlata}${BOJA.kraj} u ${BOJA.sivo}alati/${BOJA.kraj}`
  );
}

/**
 * Pise stranice jedne mape i brise one koje vise nitko ne generira.
 *
 * Datoteka koja je ostala iza preimenovanog artikla bi se i dalje posluzivala
 * i nitko je ne bi imao odakle primijetiti.
 */
async function pisi(mapa, stranice) {
  const imeMape = path.basename(mapa);
  if (!SAMO_PROVJERA) await mkdir(mapa, { recursive: true });

  const napisane = new Set();
  for (const { ime, naziv, html } of stranice) {
    napisane.add(`${ime}.html`);
    if (SAMO_PROVJERA) {
      console.log(`${BOJA.sivo}·${BOJA.kraj} ${imeMape}/${ime}.html  ${BOJA.sivo}${naziv}${BOJA.kraj}`);
      continue;
    }
    await writeFile(path.join(mapa, `${ime}.html`), html, "utf8");
    console.log(`${BOJA.zeleno}✓${BOJA.kraj} ${imeMape}/${ime}.html  ${BOJA.sivo}${naziv}${BOJA.kraj}`);
  }

  if (!SAMO_PROVJERA && existsSync(mapa)) {
    for (const d of await readdir(mapa)) {
      if (d.endsWith(".html") && !napisane.has(d)) {
        await unlink(path.join(mapa, d));
        console.log(`${BOJA.zuto}−${BOJA.kraj} ${imeMape}/${d}  ${BOJA.sivo}visak, obrisano${BOJA.kraj}`);
      }
    }
  }

  return napisane.size;
}

glavni().catch((greska) => {
  console.error(greska);
  process.exitCode = 1;
});
