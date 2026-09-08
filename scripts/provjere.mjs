/**
 * provjere.mjs — provjere logike koja rukuje novcem i katalogom.
 *
 * Pokretanje:  node scripts/provjere.mjs
 *
 * Testira se samo ono gdje tiha greska kosta: racun kosarice, brojanje dana
 * najma i motor filtera nad stvarnih 75 artikala. Prikaz se ne testira — on
 * se vidi, a ovo se ne vidi.
 *
 * Nema test runnera. Isti pristup kao ../split/test/provjere.js: tri pomocne
 * funkcije i izlazni kod. Nasumicni slucajevi idu kroz generator sa SJEMENOM,
 * pa se pad uvijek moze ponoviti.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const KORIJEN = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

/* ------------------------------------------------------------------ */
/* Preglednicke globalne varijable koje moduli ocekuju                 */
/* ------------------------------------------------------------------ */
const spremiste = new Map();
globalThis.localStorage = {
  getItem: (k) => (spremiste.has(k) ? spremiste.get(k) : null),
  setItem: (k, v) => spremiste.set(k, String(v)),
  removeItem: (k) => spremiste.delete(k),
};
globalThis.location = { search: "", pathname: "/webshop" };
globalThis.history = {
  replaceState(_stanje, _naslov, url) {
    const upit = String(url).split("?")[1] ?? "";
    globalThis.location.search = upit ? `?${upit}` : "";
    globalThis.location.pathname = String(url).split("?")[0];
  },
};

const kosarica = await import("../js/kosarica.js");
const { stvoriFiltre } = await import("../js/filtri.js");

/* ------------------------------------------------------------------ */
/* Pomocno                                                             */
/* ------------------------------------------------------------------ */
let pali = 0;
let prosli = 0;

function naslov(tekst) {
  console.log("\n" + tekst);
  console.log("-".repeat(tekst.length));
}

function tvrdnja(uvjet, opis, detalj = "") {
  if (uvjet) {
    prosli += 1;
    console.log("  OK   " + opis);
  } else {
    pali += 1;
    console.log("  PAD  " + opis + (detalj ? "\n       " + detalj : ""));
  }
}

function jednako(dobiveno, ocekivano, opis) {
  tvrdnja(
    dobiveno === ocekivano,
    opis,
    `dobiveno ${JSON.stringify(dobiveno)}, ocekivano ${JSON.stringify(ocekivano)}`
  );
}

/** Generator s sjemenom (mulberry32) — pad se uvijek moze ponoviti. */
function slucajni(sjeme) {
  return function () {
    sjeme = (sjeme + 0x6d2b79f5) | 0;
    let t = Math.imul(sjeme ^ (sjeme >>> 15), 1 | sjeme);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const katalogJson = JSON.parse(
  readFileSync(path.join(KORIJEN, "assets", "katalog.json"), "utf8")
);

/* ================================================================== */
/* 1. Brojanje dana najma                                              */
/* ================================================================== */
naslov("1. Dani najma — brojanje je ISKLJUCIVO");

jednako(kosarica.brojDana("2026-09-12", "2026-09-15"), 3, "12.09. do 15.09. je 3 dana");
jednako(kosarica.brojDana("2026-09-12", "2026-09-13"), 1, "susjedni dani su 1 dan");
jednako(kosarica.brojDana("2026-09-12", "2026-09-12"), 0, "isti dan nije najam");
jednako(kosarica.brojDana("2026-09-15", "2026-09-12"), 0, "obrnut raspon je 0, ne negativan");
jednako(kosarica.brojDana(null, "2026-09-15"), 0, "bez pocetnog datuma je 0");
jednako(kosarica.brojDana("2026-09-12", "smece"), 0, "neispravan datum je 0");

// Prijelaz mjeseca i prijestupna godina: naivno oduzimanje brojeva u datumu
// bi ovdje palo, a racunanje preko milisekundi ne.
jednako(kosarica.brojDana("2026-09-28", "2026-10-03"), 5, "raspon preko kraja mjeseca");
jednako(kosarica.brojDana("2028-02-27", "2028-03-01"), 3, "prijestupni veljaca");

/* ================================================================== */
/* 2. Racun kosarice                                                   */
/* ================================================================== */
naslov("2. Racun kosarice — sve u cijelim centima");

kosarica.isprazni();

const miniserver = {
  id: "1000", naziv: "Miniserver", sku: null, marka: "Loxone",
  cijenaCents: 65561, osnova: "kom",
};
const tipkalo = {
  id: "1001", naziv: "Touch Tree tipkalo", sku: null, marka: "Loxone",
  cijenaCents: 9084, osnova: "kom",
};
const brusilica = {
  id: "2000", naziv: "Bosch GWS 18V-10", sku: null, marka: "Bosch",
  cijenaCents: 2200, osnova: "dan",
};

kosarica.dodaj(miniserver);
kosarica.dodaj(tipkalo, { kolicina: 2 });
jednako(kosarica.pregled().ukupnoProizvodi, 65561 + 9084 * 2, "zbroj proizvoda po komadu");
jednako(kosarica.pregled().broj, 3, "brojac gleda kolicine, ne retke");

kosarica.dodaj(miniserver);
jednako(kosarica.pregled().stavke.length, 2, "ponovno dodavanje ne stvara drugi redak");
jednako(kosarica.pregled().stavke.find((s) => s.id === "1000").kolicina, 2, "nego povecava kolicinu");

kosarica.dodaj(brusilica);
jednako(kosarica.pregled().ukupnoNajam, 0, "najam bez datuma jos nema iznos");
jednako(kosarica.pregled().nepotpuneStavke.length, 1, "najam bez datuma je prijavljen kao nepotpun");

kosarica.postaviDatume("2000", "2026-09-12", "2026-09-15");
jednako(kosarica.pregled().ukupnoNajam, 2200 * 3, "najam = cijena x kolicina x dani");
jednako(kosarica.pregled().nepotpuneStavke.length, 0, "s datumima vise nije nepotpun");

// Dvije skupine se NIKAD ne spajaju u jedan prikazani iznos: kupnja i najam
// nisu ista vrsta obveze.
const stanje = kosarica.pregled();
tvrdnja(
  stanje.ukupnoProizvodi !== stanje.ukupno && stanje.ukupnoNajam !== stanje.ukupno,
  "kupnja i najam imaju odvojene zbrojeve"
);
jednako(stanje.ukupno, stanje.ukupnoProizvodi + stanje.ukupnoNajam, "zbirni iznos postoji za e-postu");

kosarica.postaviKolicinu("1001", 0);
jednako(kosarica.pregled().stavke.length, 2, "kolicina 0 uklanja stavku");

const snimka = kosarica.snimka();
tvrdnja(
  snimka.every((s) => Number.isInteger(s.iznos_cents)),
  "snimka za e-postu ima iznose u cijelim centima"
);
jednako(snimka.find((s) => s.id === "2000").dana, 3, "snimka nosi izracunat broj dana");

/* ------------------------------------------------------------------ */
/* Nasumicne kosarice — nijedan iznos ne smije postati decimalan       */
/* ------------------------------------------------------------------ */
const SJEME = 20260906;
const nasumicno = slucajni(SJEME);
let sveCijelo = true;
let rucniZbrojTocan = true;

for (let krug = 0; krug < 500; krug += 1) {
  kosarica.isprazni();
  const koliko = 1 + Math.floor(nasumicno() * 8);
  let ocekivano = 0;

  for (let i = 0; i < koliko; i += 1) {
    const poDanu = nasumicno() < 0.4;
    const cijena = 1 + Math.floor(nasumicno() * 70000);
    const kolicina = 1 + Math.floor(nasumicno() * 5);
    const dana = poDanu ? 1 + Math.floor(nasumicno() * 30) : 0;

    const artikl = {
      id: `t${krug}-${i}`,
      naziv: `Test ${i}`,
      cijenaCents: cijena,
      osnova: poDanu ? "dan" : "kom",
    };

    if (poDanu) {
      const od = new Date(Date.UTC(2026, 8, 1));
      const doo = new Date(Date.UTC(2026, 8, 1 + dana));
      kosarica.dodaj(artikl, {
        kolicina,
        odDatuma: od.toISOString().slice(0, 10),
        doDatuma: doo.toISOString().slice(0, 10),
      });
      ocekivano += cijena * kolicina * dana;
    } else {
      kosarica.dodaj(artikl, { kolicina });
      ocekivano += cijena * kolicina;
    }
  }

  const zbroj = kosarica.pregled().ukupno;
  if (!Number.isInteger(zbroj)) sveCijelo = false;
  if (zbroj !== ocekivano) rucniZbrojTocan = false;
}

tvrdnja(sveCijelo, `500 nasumicnih kosarica: nijedan zbroj nije decimalan (sjeme ${SJEME})`);
tvrdnja(rucniZbrojTocan, `500 nasumicnih kosarica: zbroj se poklapa s rucnim (sjeme ${SJEME})`);
kosarica.isprazni();

/* ================================================================== */
/* 3. Motor filtera nad stvarnih 75 artikala                           */
/* ================================================================== */
naslov("3. Filtri nad stvarnim katalogom");

// Minimalan katalog kakav ocekuje stvoriFiltre(); ista logika kao katalog.js,
// ali bez fetcha.
const artikli = katalogJson.artikli.map((a) => ({
  id: String(a.id),
  vrsta: a.vrsta,
  naziv: a.naziv,
  sku: a.sku,
  marka: a.marka,
  cijenaCents: a.cijena_cents ?? a.cijenaCents,
  osnova: a.osnova,
  naStanju: a.na_stanju ?? a.naStanju ?? true,
  kategorije: a.kategorije ?? [],
}));
const kategorije = katalogJson.kategorije.map((k) => ({
  id: k.id,
  vrsta: k.vrsta,
  roditeljId: k.roditelj_id ?? null,
  redoslijed: k.redoslijed ?? 0,
  naziv: { hr: k.naziv_hr },
}));

const katalog = {
  poId: new Map(kategorije.map((k) => [k.id, k])),
  zaVrstu: (vrsta) => artikli.filter((a) => a.vrsta === vrsta),
  podskupine: (roditeljId) => kategorije.filter((k) => k.roditeljId === roditeljId),
  marke: (vrsta) =>
    [...new Set(artikli.filter((a) => a.vrsta === vrsta && a.marka).map((a) => a.marka))].sort(),
};

const idKategorije = (ime) => kategorije.find((k) => k.naziv.hr === ime).id;

globalThis.location.search = "";
const filtri = stvoriFiltre({ katalog, vrsta: "loxone", naPromjenu: () => {} });

jednako(filtri.rezultat().length, 59, "bez filtera: svih 59 Loxone artikala");

filtri.postavi({ skupina: idKategorije("Senzori") });
jednako(filtri.rezultat().length, 6, "skupina Senzori ima 6 artikala");

filtri.postavi({ podskupina: idKategorije("Detektori pokreta i prisutnosti") });
jednako(filtri.rezultat().length, 3, "podskupina Detektori pokreta ima 3 artikla");

// Odabir druge skupine mora ocistiti podskupinu prethodne, inace ostane
// filter koji nijedan artikl ne zadovoljava i popis je prazan bez razloga.
filtri.postavi({ skupina: idKategorije("Miniserveri") });
jednako(filtri.stanje.podskupina, null, "promjena skupine cisti podskupinu");
jednako(filtri.rezultat().length, 3, "skupina Miniserveri ima 3 artikla");

filtri.postavi({ sort: "cijena-asc" });
const rastuce = filtri.rezultat();
jednako(rastuce[0].cijenaCents, 39362, "sortirano rastuce: najjeftiniji Miniserver");
jednako(rastuce[rastuce.length - 1].cijenaCents, 65561, "sortirano rastuce: najskuplji zadnji");

filtri.postavi({ sort: "cijena-desc" });
jednako(filtri.rezultat()[0].cijenaCents, 65561, "sortirano padajuce okrece redoslijed");

filtri.ocisti();
jednako(filtri.rezultat().length, 59, "ciscenje vraca sve artikle");
jednako(filtri.brojAktivnih(), 0, "nakon ciscenja nema aktivnih filtera");

// Stanje mora zavrsiti u URL-u: bez toga se filtrirani pogled ne moze
// podijeliti, a tipka "natrag" ne radi nista.
filtri.postavi({ skupina: idKategorije("Audio sustavi"), marka: "Loxone" });
tvrdnja(
  globalThis.location.search.includes("skupina=audio-sustavi") &&
    globalThis.location.search.includes("marka=Loxone"),
  "stanje filtera zapisano je u URL",
  globalThis.location.search
);

// Hladan dolazak na filtriranu adresu mora nacrtati isti popis.
globalThis.location.search = "?skupina=senzori&sort=cijena-desc";
const izUrla = stvoriFiltre({ katalog, vrsta: "loxone", naPromjenu: () => {} });
jednako(izUrla.rezultat().length, 6, "filtri procitani iz URL-a daju isti popis");
jednako(izUrla.stanje.sort, "cijena-desc", "sortiranje se cita iz URL-a");

// Najam: cetiri kategorije, cijene po danu.
globalThis.location.search = "";
const najam = stvoriFiltre({ katalog, vrsta: "alat", naPromjenu: () => {} });
jednako(najam.rezultat().length, 16, "najam ima 16 artikala");

const ocekivaneKategorije = {
  "Ljestve i skele": 3,
  "Rezanje i brušenje": 6,
  "Bušenje i odvijanje": 6,
  "Usisavači i otprašivanje": 1,
};
for (const [ime, broj] of Object.entries(ocekivaneKategorije)) {
  najam.postavi({ skupina: idKategorije(ime) });
  jednako(najam.rezultat().length, broj, `kategorija ${ime} ima ${broj}`);
}

najam.ocisti();
najam.postavi({ marka: "Bosch" });
jednako(najam.rezultat().length, 13, "marka Bosch ima 13 artikala u najmu");

// Artikl bez marke ne smije se pojaviti ni pod jednom markom.
globalThis.location.search = "";
const loxoneMarke = stvoriFiltre({ katalog, vrsta: "loxone", naPromjenu: () => {} });
loxoneMarke.postavi({ marka: "Loxone" });
jednako(loxoneMarke.rezultat().length, 58, "58 Loxone artikala ima marku; jedan je bez nje");

/* ================================================================== */
naslov("Rezultat");
console.log(`  proslo: ${prosli}   palo: ${pali}`);
if (pali) {
  console.log("\n  neke provjere nisu prosle");
  process.exit(1);
}
console.log("  sve provjere prolaze");
