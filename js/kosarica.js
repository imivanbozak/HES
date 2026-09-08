/**
 * kosarica.js — stanje kosarice.
 *
 * Kosarica drzi dvije vrste stavki koje nemaju nista zajednicko: Loxone
 * komponente koje se KUPUJU po komadu i alat koji se UNAJMLJUJE po danu.
 * hes-structure.md §4.20 upozorava da je jedna kosarica za oboje neuobicajen
 * obrazac — zato se ovdje nikad ne zbrajaju u jedan iznos, nego se drze kao
 * dvije skupine s dva zbroja, sve do e-poste.
 *
 * Novac je uvijek CIJELI BROJ CENTI. Nijedan izracun ne dira decimalni broj.
 * To je pravilo iz ../split i jedini razlog zasto ta aplikacija ima testove:
 * tiha greska u zaokruzivanju kosta novac i nitko je ne primijeti.
 *
 * Cijena je i dalje samo procjena. Izvor ne sadrzi ni PDV, ni dostavu, ni
 * najkraci rok najma (hes-content.md, markeri 16 i 18), pa nijedan tekst ovdje
 * ne tvrdi sto je u cijenu ukljuceno.
 */

const KLJUC = "hes.kosarica.v1";
const MAX_STAVKI = 60;      // ista granica kao u shema.sql
const MAX_KOLICINA = 99;

const pretplatnici = new Set();
let stavke = ucitaj();

/* ------------------------------------------------------------------ */
/* Spremiste                                                           */
/* ------------------------------------------------------------------ */
function ucitaj() {
  try {
    const zapis = localStorage.getItem(KLJUC);
    if (!zapis) return [];
    const procitano = JSON.parse(zapis);
    return Array.isArray(procitano) ? procitano.filter(jeValjana) : [];
  } catch {
    // Privatni prozor baca vec na pristup. Kosarica tada radi u memoriji.
    return [];
  }
}

function spremi() {
  try {
    localStorage.setItem(KLJUC, JSON.stringify(stavke));
  } catch {
    /* bez spremista kosarica zivi do osvjezavanja stranice */
  }
  for (const javi of pretplatnici) javi(pregled());
}

function jeValjana(stavka) {
  return (
    stavka &&
    typeof stavka.id === "string" &&
    Number.isInteger(stavka.cijenaCents) &&
    Number.isInteger(stavka.kolicina) &&
    stavka.kolicina > 0
  );
}

/* ------------------------------------------------------------------ */
/* Datumi najma                                                        */
/* ------------------------------------------------------------------ */
/**
 * Broj dana najma izmedu dva datuma, ISKLJUCIVO.
 *
 * 12.09. -> 15.09. je TRI dana, ne cetiri. Tako se najam alata i inace
 * obracunava, a sucelje uvijek ispise "3 dana" pa nema dvojbe. Ovo je jedini
 * ispravan odgovor na to pitanje u cijelom projektu i pokriven je testom.
 */
export function brojDana(odDatuma, doDatuma) {
  if (!odDatuma || !doDatuma) return 0;
  const od = new Date(`${odDatuma}T00:00:00`);
  const doo = new Date(`${doDatuma}T00:00:00`);
  if (Number.isNaN(od.getTime()) || Number.isNaN(doo.getTime())) return 0;
  const dana = Math.round((doo - od) / 86400000);
  return dana > 0 ? dana : 0;
}

/** Iznos jedne stavke u centima. */
export function iznosStavke(stavka) {
  if (stavka.osnova === "dan") {
    const dana = brojDana(stavka.odDatuma, stavka.doDatuma);
    return stavka.cijenaCents * stavka.kolicina * dana;
  }
  return stavka.cijenaCents * stavka.kolicina;
}

/* ------------------------------------------------------------------ */
/* Javno stanje                                                        */
/* ------------------------------------------------------------------ */
export function pregled() {
  const proizvodi = stavke.filter((s) => s.osnova === "kom");
  const najam = stavke.filter((s) => s.osnova === "dan");

  const zbroj = (popis) => popis.reduce((suma, s) => suma + iznosStavke(s), 0);

  return {
    stavke: stavke.slice(),
    proizvodi,
    najam,
    ukupnoProizvodi: zbroj(proizvodi),
    ukupnoNajam: zbroj(najam),
    // Zbirni iznos postoji samo za tijelo e-poste; sucelje ga ne prikazuje
    // kao jedan broj, jer kupnja i najam nisu ista vrsta obveze.
    ukupno: zbroj(stavke),
    broj: stavke.reduce((suma, s) => suma + s.kolicina, 0),
    prazna: stavke.length === 0,
    /** Najam bez datuma se ne moze ni procijeniti ni poslati. */
    nepotpuneStavke: najam.filter((s) => brojDana(s.odDatuma, s.doDatuma) < 1),
  };
}

export function naPromjenu(funkcija) {
  pretplatnici.add(funkcija);
  return () => pretplatnici.delete(funkcija);
}

/* ------------------------------------------------------------------ */
/* Izmjene                                                             */
/* ------------------------------------------------------------------ */
export function dodaj(artikl, dodatno = {}) {
  if (stavke.length >= MAX_STAVKI) return { ok: false, razlog: "puna" };

  const postojeca = stavke.find((s) => s.id === artikl.id);
  if (postojeca) {
    postojeca.kolicina = Math.min(postojeca.kolicina + (dodatno.kolicina ?? 1), MAX_KOLICINA);
  } else {
    stavke.push({
      id: artikl.id,
      naziv: artikl.naziv,
      sku: artikl.sku ?? null,
      marka: artikl.marka ?? null,
      cijenaCents: artikl.cijenaCents,
      osnova: artikl.osnova,
      // Slicica se snima uz stavku, kao i cijena. Ladica se otvara i na
      // naslovnici gdje katalog nikad nije ucitan; da se slika trazila iz
      // manifesta, ondje bi kosarica bila bez slika. Zapis je sitan
      // ({ id, sirine }) i stare kosarice bez njega i dalje rade.
      mediji: artikl.mediji ?? null,
      kolicina: Math.min(dodatno.kolicina ?? 1, MAX_KOLICINA),
      odDatuma: dodatno.odDatuma ?? null,
      doDatuma: dodatno.doDatuma ?? null,
    });
  }
  spremi();
  return { ok: true };
}

export function postaviKolicinu(id, kolicina) {
  const stavka = stavke.find((s) => s.id === id);
  if (!stavka) return;
  const broj = Math.max(0, Math.min(Math.trunc(kolicina), MAX_KOLICINA));
  if (broj === 0) return makni(id);
  stavka.kolicina = broj;
  spremi();
}

export function postaviDatume(id, odDatuma, doDatuma) {
  const stavka = stavke.find((s) => s.id === id);
  if (!stavka) return;
  stavka.odDatuma = odDatuma || null;
  stavka.doDatuma = doDatuma || null;
  spremi();
}

export function makni(id) {
  stavke = stavke.filter((s) => s.id !== id);
  spremi();
}

export function isprazni() {
  stavke = [];
  spremi();
}

export function sadrzi(id) {
  return stavke.some((s) => s.id === id);
}

/**
 * Snimka za e-postu i za `upiti.stavke`.
 *
 * Snima se, a ne referencira: ponuda mora ostati citljiva i nakon sto se
 * cjenik promijeni. Iznosi su izracunati u trenutku slanja.
 */
export function snimka() {
  return stavke.map((s) => ({
    id: s.id,
    naziv: s.naziv,
    sku: s.sku,
    marka: s.marka,
    kolicina: s.kolicina,
    cijena_cents: s.cijenaCents,
    osnova: s.osnova,
    od_datuma: s.odDatuma,
    do_datuma: s.doDatuma,
    dana: s.osnova === "dan" ? brojDana(s.odDatuma, s.doDatuma) : null,
    iznos_cents: iznosStavke(s),
  }));
}
