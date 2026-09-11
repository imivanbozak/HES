/**
 * zauzetost.js — koji su dani alata vec zauzeti.
 *
 * Izvor je zauzeti_termini() u bazi: samo rasponi i kolicine, bez ijednog
 * osobnog podatka. Povlaci se JEDNOM za sve alate (16 alata, nekoliko redova)
 * i drzi u memoriji; iznova tek kad netko javi da se nesto moglo promijeniti
 * — na primjer odgovor "zauzeto" na poslani upit.
 *
 * Ovo je SAVJET posjetitelju, ne odluka. Odluku donosi okidac u bazi pod
 * zakljucanim redom artikla (supabase/shema.sql, provjeri_zauzetost). Zato
 * greska ovdje nikad ne postaje zabrana: bez baze, ili kad dohvat padne, sve
 * je "slobodno" i upit se salje kao i prije — baza ce reci ako nije.
 *
 * Pravilo je isto kao u bazi i provjerava ga scripts/provjere.mjs:
 *   - raspon je [od, do): dan povrata nije zauzet, pa se alat vraca i ponovno
 *     izdaje istog dana
 *   - broji se PO DANU: alat s dva komada ima slobodan komad svaki dan u
 *     kojem nisu uzeta oba, koliko god se rezervacija preklapalo s rasponom
 *
 * Datumi su nizovi "YYYY-MM-DD". Usporeduju se kao nizovi (leksikografski
 * poredak je ovdje isto sto i kalendarski) i pomicu u UTC-u, da kalendarski
 * dan ne ovisi o vremenskoj zoni preglednika.
 */

import { imaOblak } from "./konfiguracija.js";
import { zauzetiTermini } from "./oblak.js";

/** artiklId -> [{ od, doo, kolicina }] */
let rezervacije = new Map();
/** artiklId -> broj komada koji se mogu izdati istovremeno */
let kapaciteti = new Map();
let ucitano = false;
let dohvat = null;

const pretplatnici = new Set();

/* ------------------------------------------------------------------ */
/* Datumi                                                              */
/* ------------------------------------------------------------------ */
const dvije = (broj) => String(broj).padStart(2, "0");

/** Danasnji datum po satu posjetitelja — "danas" je njegov, ne UTC-ov. */
export function danasnjiDatum() {
  const sada = new Date();
  return `${sada.getFullYear()}-${dvije(sada.getMonth() + 1)}-${dvije(sada.getDate())}`;
}

/** "2026-09-12" + n dana. */
export function pomakni(iso, dana) {
  const [g, m, d] = iso.split("-").map(Number);
  const datum = new Date(Date.UTC(g, m - 1, d + dana));
  return datum.toISOString().slice(0, 10);
}

export const sljedeci = (iso) => pomakni(iso, 1);

/* ------------------------------------------------------------------ */
/* Stanje                                                              */
/* ------------------------------------------------------------------ */
/**
 * Povuci zauzetost iz baze. Drugi poziv vraca isti dohvat, osim uz
 * `{ iznova: true }`.
 */
export function ucitaj({ iznova = false } = {}) {
  if (!imaOblak()) return Promise.resolve(false);
  if (dohvat && !iznova) return dohvat;

  dohvat = zauzetiTermini().then((ishod) => {
    if (!ishod.ok) {
      console.warn("[zauzetost] nije ucitana, kalendar pokazuje sve dane slobodnima", ishod.greska);
      dohvat = null;
      return false;
    }
    postavi(ishod.podaci ?? []);
    return true;
  });
  return dohvat;
}

/**
 * Postavi zauzetost iz redova oblika zauzeti_termini().
 * Izvezeno i zato da je scripts/provjere.mjs moze napuniti bez mreze.
 */
export function postavi(redovi) {
  rezervacije = new Map();
  kapaciteti = new Map();
  for (const red of redovi) {
    const id = String(red.artikl_id);
    if (!rezervacije.has(id)) rezervacije.set(id, []);
    rezervacije.get(id).push({
      od: String(red.od_datuma).slice(0, 10),
      doo: String(red.do_datuma).slice(0, 10),
      kolicina: Number(red.kolicina) || 1,
    });
    kapaciteti.set(id, Number(red.kapacitet ?? 1));
  }
  ucitano = true;
  for (const javi of pretplatnici) javi();
}

/** Je li zauzetost stigla iz baze. Dok nije, prikaz pada na "Na stanju". */
export const jeUcitano = () => ucitano;

/** Ceka li se jos na bazu — za natpis "Ucitavanje zauzetosti…" u kalendaru. */
export const ceka = () => imaOblak() && !ucitano;

export function naPromjenu(funkcija) {
  pretplatnici.add(funkcija);
  return () => pretplatnici.delete(funkcija);
}

/* ------------------------------------------------------------------ */
/* Pitanja                                                             */
/* ------------------------------------------------------------------ */
function zauzetoNaDan(artiklId, dan) {
  let zbroj = 0;
  for (const r of rezervacije.get(artiklId) ?? []) {
    if (r.od <= dan && dan < r.doo) zbroj += r.kolicina;
  }
  return zbroj;
}

/**
 * Bi li jos `kolicina` komada tog dana preslo kapacitet.
 *
 * Kapacitet se zna samo za alate koji imaju rezervacije (vraca ga
 * zauzeti_termini uz svaki red). Alat bez rezervacija nema ni zauzetih dana,
 * pa mu kapacitet ovdje ne treba.
 */
export function danPun(artiklId, dan, kolicina = 1) {
  const id = String(artiklId);
  if (!rezervacije.has(id)) return false;
  return zauzetoNaDan(id, dan) + kolicina > (kapaciteti.get(id) ?? 1);
}

/** Moze li se `kolicina` komada unajmiti od `od` do `doo` (dan povrata iskljucen). */
export function slobodno(artiklId, od, doo, kolicina = 1) {
  if (!od || !doo || doo <= od) return true;
  for (let dan = od; dan < doo; dan = sljedeci(dan)) {
    if (danPun(artiklId, dan, kolicina)) return false;
  }
  return true;
}

/** Prvi dan od `pocetka` kad je slobodan barem jedan komad; null ako ga nema u godini dana. */
export function slobodnoOd(artiklId, pocetak = danasnjiDatum()) {
  let dan = pocetak;
  for (let i = 0; i <= 366; i += 1) {
    if (!danPun(artiklId, dan)) return dan;
    dan = sljedeci(dan);
  }
  return null;
}

/**
 * Puni dani spojeni u raspone — za popis "Vec rezervirano: 20. – 22. 9."
 * `zadnji` je zadnji PUN dan, ne dan povrata.
 */
export function puniRasponi(artiklId, { kolicina = 1, od = danasnjiDatum(), dana = 180 } = {}) {
  const rasponi = [];
  let dan = od;
  for (let i = 0; i < dana; i += 1) {
    if (danPun(artiklId, dan, kolicina)) {
      const zadnji = rasponi[rasponi.length - 1];
      if (zadnji && sljedeci(zadnji.zadnji) === dan) zadnji.zadnji = dan;
      else rasponi.push({ od: dan, zadnji: dan });
    }
    dan = sljedeci(dan);
  }
  return rasponi;
}
