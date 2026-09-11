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

import { readFileSync, readdirSync } from "node:fs";
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
const jezik = await import("../js/jezik.js");
const zauzetost = await import("../js/zauzetost.js");
const admin = await import("../js/admin/zajednicko.js");
const { rasporedi } = await import("../js/galerija.js");
const { PRIJEVODI } = await import("../js/prijevodi.js");

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
/* 4. Jezici                                                           */
/* ================================================================== */
naslov("4. Jezici — rjecnik, poveznice, cijene i pretraga");

// Svaki jezik mora imati iste kljuceve kao hrvatski. Kljuc koji nedostaje
// pao bi na hrvatski usred njemacke stranice i nitko ga ne bi primijetio.
const kljuceviHr = Object.keys(PRIJEVODI.hr);
for (const oznaka of ["de", "en"]) {
  const nedostaju = kljuceviHr.filter((k) => !(k in PRIJEVODI[oznaka]));
  const visak = Object.keys(PRIJEVODI[oznaka]).filter((k) => !(k in PRIJEVODI.hr));
  tvrdnja(
    !nedostaju.length && !visak.length,
    `${oznaka}: isti kljucevi kao hr`,
    `nedostaju: ${nedostaju.join(", ") || "-"}   visak: ${visak.join(", ") || "-"}`
  );
}

// Intl.PluralRules vraca `other` za svaki broj koji nije posebno naveden, pa
// ga svaki oblik mnozine mora imati.
for (const [oznaka, rjecnik] of Object.entries(PRIJEVODI)) {
  const bezOther = Object.entries(rjecnik)
    .filter(([, v]) => typeof v === "object" && !v.other)
    .map(([k]) => k);
  tvrdnja(!bezOther.length, `${oznaka}: svaki oblik mnozine ima "other"`, bezOther.join(", "));
}

// Neue Regrade nema ß (scripts/provjere.py) i njemacki ga ne smije ni traziti.
const saSs = Object.entries(PRIJEVODI.de)
  .filter(([, v]) => JSON.stringify(v).includes("ß"))
  .map(([k]) => k);
tvrdnja(!saSs.length, "njemacki rjecnik je bez ß", saSs.join(", "));

jednako(jezik.mnozina("mnozina.artikl", 1, "hr"), "artikl", "hr: 1 artikl");
jednako(jezik.mnozina("mnozina.artikl", 3, "hr"), "artikla", "hr: 3 artikla");
jednako(jezik.mnozina("mnozina.artikl", 11, "hr"), "artikala", "hr: 11 artikala");
jednako(jezik.mnozina("mnozina.artikl", 21, "hr"), "artikl", "hr: 21 artikl");
jednako(jezik.mnozina("mnozina.dan", 2, "de"), "Tage", "de: 2 Tage");

jednako(jezik.putanja("/webshop", "hr"), "/webshop", "hrvatski ostaje u korijenu");
jednako(jezik.putanja("/webshop?skupina=senzori", "de"), "/de/webshop?skupina=senzori", "de: prefiks cuva upit");
jednako(jezik.putanja("/", "en"), "/en/", "en: naslovnica");
jednako(jezik.putanja("/#kontakt", "de"), "/de/#kontakt", "de: sidro naslovnice");
jednako(jezik.putanja("/de/webshop", "de"), "/de/webshop", "prefiks se ne dodaje dvaput");
jednako(jezik.putanja("/assets/katalog.json", "de"), "/assets/katalog.json", "datoteke ostaju bez prefiksa");
jednako(jezik.putanja("mailto:alen.hranj@hes.hr", "de"), "mailto:alen.hranj@hes.hr", "mailto prolazi netaknut");

jednako(jezik.formatCijene(65561, "hr"), "655,61 €", "hr: 655,61 € s tvrdim razmakom");
jednako(jezik.formatCijene(123456789, "de"), "1.234.567,89 €", "de: tocke za tisucice");
jednako(jezik.formatCijene(5, "en"), "€0.05", "en: pet centi");
jednako(jezik.formatDatuma("2026-09-14", { godina: true }, "hr"), "14. 9. 2026.", "hr: datum s godinom");
jednako(jezik.formatDatuma("2026-03-29", {}, "de"), "29.3.", "de: datum na dan pomaka sata");

// Pretraga bez dijakritike. "f360" stoji zbog stvarne greske: izraz koji je
// trebao brisati kvacice jednom je brisao znamenke 0, 3 i 6 i slovo f, pa je
// ovaj upit postajao prazan i vracao cijeli cjenik.
globalThis.location.search = "";
const pretraga = stvoriFiltre({ katalog, vrsta: "alat", naPromjenu: () => {} });
pretraga.postavi({ pretraga: "f360" });
jednako(pretraga.rezultat().length, 1, "pretraga 'f360' nalazi tocno PROTUBE-F360");
pretraga.postavi({ pretraga: "brusenje" });
jednako(pretraga.rezultat().length, 6, "'brusenje' bez kvacice nalazi Rezanje i brušenje");

/* ================================================================== */
/* 5. Zauzetost najma                                                  */
/* ================================================================== */
/*
 * Ista pravila koja okidac provjeri_zauzetost primjenjuje u bazi
 * (supabase/testovi.sql, odjeljci 1-3). Preglednik i baza moraju se slagati:
 * kalendar koji pusti raspon koji baza odbije salje posjetitelja u poruku
 * "zauzeto" bez razloga koji je mogao vidjeti.
 */
naslov("5. Zauzetost najma — isto pravilo kao u bazi");

zauzetost.postavi([
  { artikl_id: "jedan", od_datuma: "2030-01-10", do_datuma: "2030-01-15", kolicina: 1, kapacitet: 1 },
  { artikl_id: "dva", od_datuma: "2030-05-01", do_datuma: "2030-05-03", kolicina: 1, kapacitet: 2 },
  { artikl_id: "dva", od_datuma: "2030-05-05", do_datuma: "2030-05-07", kolicina: 1, kapacitet: 2 },
]);

tvrdnja(!zauzetost.slobodno("jedan", "2030-01-14", "2030-01-20"), "preklapanje s rezervacijom je zauzeto");
tvrdnja(zauzetost.slobodno("jedan", "2030-01-15", "2030-01-20"), "dan povrata je slobodan za iduceg (15.)");
tvrdnja(zauzetost.slobodno("jedan", "2030-01-05", "2030-01-10"), "raspon koji zavrsava na dan preuzimanja je slobodan");
tvrdnja(
  zauzetost.slobodno("dva", "2030-05-02", "2030-05-06"),
  "dva komada: raspon preko obje rezervacije prolazi, nijedan dan nije pun"
);
tvrdnja(!zauzetost.slobodno("dva", "2030-05-02", "2030-05-03", 2), "dva komada odjednom na dan kad je jedan uzet");
tvrdnja(zauzetost.slobodno("bez-rezervacija", "2030-01-01", "2030-01-05"), "alat bez rezervacija je slobodan");
jednako(zauzetost.danPun("jedan", "2030-01-14"), true, "zadnji dan rezervacije je pun");
jednako(zauzetost.danPun("jedan", "2030-01-15"), false, "dan povrata nije pun");
jednako(zauzetost.slobodnoOd("jedan", "2030-01-12"), "2030-01-15", "slobodno od dana povrata");
jednako(
  JSON.stringify(zauzetost.puniRasponi("jedan", { od: "2030-01-01", dana: 60 })),
  JSON.stringify([{ od: "2030-01-10", zadnji: "2030-01-14" }]),
  "puni dani spojeni u jedan raspon, do zadnjeg punog dana"
);
jednako(zauzetost.pomakni("2028-02-28", 1), "2028-02-29", "pomak kroz prijestupni dan");
jednako(zauzetost.pomakni("2026-03-28", 1), "2026-03-29", "pomak preko promjene sata");
jednako(zauzetost.pomakni("2026-12-31", 1), "2027-01-01", "pomak preko kraja godine");

/* ================================================================== */
/* 6. Admin panel                                                      */
/* ================================================================== */
/*
 * Cijena koju admin upise ide ravno u cjenik. Pogresno procitan zarez tu
 * nije kozmeticka greska nego cijena deset puta manja.
 */
naslov("6. Admin — unos cijene i vremenska crta");

jednako(admin.uCente("655,61"), 65561, "cijena sa zarezom");
jednako(admin.uCente("655.61"), 65561, "cijena s tockom");
jednako(admin.uCente("655,6"), 65560, "jedna decimala su desetice centi");
jednako(admin.uCente("12"), 1200, "cijena bez decimala");
jednako(admin.uCente(" 50,00 € "), 5000, "razmaci i znak eura se ignoriraju");
jednako(admin.uCente("0,1"), 10, "0,1 je deset centi — bez decimalnog racuna");
jednako(admin.uCente("1.234,56"), null, "tocka za tisucice se odbija, ne pogada");
jednako(admin.uCente("12,345"), null, "tri decimale se odbijaju");
jednako(admin.uCente("abc"), null, "tekst nije cijena");
jednako(admin.uCente(""), null, "prazno polje nije cijena");
jednako(admin.izCenti(65561), "655,61", "cente natrag u polje");
jednako(admin.izCenti(5), "0,05", "pet centi u polju");
for (const cente of [0, 1, 99, 100, 65561, 100000000]) {
  tvrdnja(admin.uCente(admin.izCenti(cente)) === cente, `${cente} centi prezivi put polje -> baza`);
}

jednako(
  JSON.stringify(admin.raspon("[2026-09-12,2026-09-15)")),
  JSON.stringify({ od: "2026-09-12", doo: "2026-09-15" }),
  "daterange iz baze"
);

const rasporedeno = admin.trake([
  { id: "a", od: "2030-05-01", doo: "2030-05-03" },
  { id: "b", od: "2030-05-02", doo: "2030-05-06" },
  { id: "c", od: "2030-05-03", doo: "2030-05-05" },
]);
jednako(
  rasporedeno.map((r) => `${r.id}${r.traka}`).join(" "),
  "a0 b1 c0",
  "preklapajuce idu u zasebne trake; ona od dana povrata u oslobodenu"
);

jednako(
  admin.jeAktivna({ status: "na_cekanju", istice: new Date(Date.now() - 1000).toISOString() }),
  false,
  "istekao zahtjev ne drzi termin"
);
jednako(admin.jeAktivna({ status: "na_cekanju", istice: null }), true, "rucni zahtjev bez roka drzi termin");
jednako(admin.jeAktivna({ status: "otkazano" }), false, "otkazana rezervacija ne drzi termin");

/* ================================================================== */
/* 7. Galerija                                                         */
/* ================================================================== */
/*
 * Raspored u stupce mora citati lijevo-desno: prvi red ide redom kroz
 * stupce, a iduca slika uvijek u trenutno najkraci. Da ide stupac po
 * stupac, druga fotografija projekta zavrsila bi na dnu prvog stupca.
 */
naslov("7. Galerija — raspored u stupce");

const polozena = (id) => ({ id, sirina: 3, visina: 2 });
const uspravna = (id) => ({ id, sirina: 2, visina: 3 });
const imena = (stupci) => JSON.stringify(stupci.map((stupac) => stupac.map((s) => s.id)));

jednako(
  imena(rasporedi([polozena("a"), polozena("b"), polozena("c")], 3)),
  JSON.stringify([["a"], ["b"], ["c"]]),
  "jednake visine: prvi red ide lijevo-desno"
);
jednako(
  imena(rasporedi([polozena("a"), uspravna("b"), polozena("c"), polozena("d")], 2)),
  JSON.stringify([["a", "c", "d"], ["b"]]),
  "iduca slika ide u najkraci stupac, ne u sljedeci po redu"
);
jednako(
  imena(rasporedi([polozena("a"), polozena("b")], 1)),
  JSON.stringify([["a", "b"]]),
  "jedan stupac zadrzava redoslijed"
);
jednako(imena(rasporedi([], 3)), JSON.stringify([[], [], []]), "prazna galerija daje prazne stupce");

/* ================================================================== */
/* 8. Spremnost za objavu                                              */
/* ================================================================== */
/*
 * Nacrt smije nositi oznake podataka koji jos nisu stigli — [NEDOSTAJE: ...]
 * i [PROVJERITI: ...] u privatnost.html. Objava ne smije: stranica bi
 * javno pisala da joj fali OIB.
 *
 * Obicno pokretanje ih samo nabroji, da `npm run provjeri` ostane koristan
 * dok se ceka klijent. `--objava` (npm run provjeri:objava) od njih napravi pad.
 */
naslov("8. Oznake [NEDOSTAJE] i [PROVJERITI]");

const OBJAVA = process.argv.includes("--objava");
const PRESKOCI = new Set(["node_modules", ".git", ".firecrawl", "assets", "provjere", "scripts", "supabase", "data", "css", "js"]);

function htmlDatoteke(mapa) {
  const popis = [];
  for (const unos of readdirSync(mapa, { withFileTypes: true })) {
    const put = path.join(mapa, unos.name);
    if (unos.isDirectory()) {
      if (!PRESKOCI.has(unos.name)) popis.push(...htmlDatoteke(put));
    } else if (unos.name.endsWith(".html")) {
      popis.push(put);
    }
  }
  return popis;
}

let oznaka = 0;
for (const datoteka of htmlDatoteke(KORIJEN)) {
  const nadene = readFileSync(datoteka, "utf8").match(/\[(NEDOSTAJE|PROVJERITI)[^\]]*\]/g) ?? [];
  if (!nadene.length) continue;
  oznaka += nadene.length;
  const ime = path.relative(KORIJEN, datoteka).replaceAll("\\", "/");
  if (OBJAVA) {
    tvrdnja(false, `${ime}: ${nadene.length} oznaka`, nadene.join("\n       "));
  } else {
    console.log(`  UPOZ ${ime}: ${nadene.length} oznaka (objava pada dok ih ima)`);
  }
}
if (!oznaka) tvrdnja(true, "nijedna stranica nema oznaku podatka koji nedostaje");

/* ================================================================== */
naslov("Rezultat");
console.log(`  proslo: ${prosli}   palo: ${pali}`);
if (pali) {
  console.log("\n  neke provjere nisu prosle");
  process.exit(1);
}
console.log("  sve provjere prolaze");
