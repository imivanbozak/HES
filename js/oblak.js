/**
 * oblak.js — jedini modul koji zna da Supabase postoji.
 *
 * Namjerno bez klijentske biblioteke. Supabase REST je obican PostgREST, a
 * stranici trebaju tocno tri stvari:
 *
 *   1. procitati katalog        GET  /rest/v1/...
 *   2. upisati jedan upit       POST /rest/v1/upiti
 *   3. pozvati slanje e-poste   POST /functions/v1/posalji-upit
 *
 * Sve troje je obican `fetch`. Sluzbeni klijent tezi oko 137 kB i nosi
 * prijave, sesije i realtime — nista od toga ovdje ne postoji, jer je pristup
 * anoniman i bez stanja.
 *
 * Nijedna funkcija ne baca iznimku. Svaka vraca `{ ok: true, podaci }` ili
 * `{ ok: false, mrezna, greska }`. Razlika izmedu mrezne i bazne greske je
 * bitna: mrezna znaci "pokusaj opet", a bazna znaci "ovo nikad nece proci"
 * pa nema smisla ponavljati.
 */

import { SUPABASE, imaOblak } from "./konfiguracija.js";

const zaglavlja = () => ({
  apikey: SUPABASE.anonKljuc,
  Authorization: `Bearer ${SUPABASE.anonKljuc}`,
  "Content-Type": "application/json",
});

function jeMrezna(greska) {
  return /failed to fetch|networkerror|load failed|aborted/i.test(String(greska?.message ?? ""));
}

async function izvrsi(putanja, postavke = {}) {
  if (!imaOblak()) {
    return { ok: false, mrezna: false, greska: new Error("oblak nije podesen") };
  }
  try {
    const odgovor = await fetch(`${SUPABASE.url}${putanja}`, {
      ...postavke,
      headers: { ...zaglavlja(), ...(postavke.headers ?? {}) },
    });

    if (!odgovor.ok) {
      let poruka = `HTTP ${odgovor.status}`;
      try {
        const tijelo = await odgovor.json();
        poruka = tijelo.message ?? tijelo.error ?? poruka;
      } catch {
        /* odgovor bez JSON tijela — ostaje status */
      }
      // 5xx je posluzitelj koji se moze oporaviti; 4xx je zahtjev koji nikad
      // nece proci ovakav kakav jest.
      return {
        ok: false,
        mrezna: odgovor.status >= 500,
        greska: new Error(poruka),
      };
    }

    const tekst = await odgovor.text();
    return { ok: true, podaci: tekst ? JSON.parse(tekst) : null };
  } catch (greska) {
    return { ok: false, mrezna: jeMrezna(greska), greska };
  }
}

/* ------------------------------------------------------------------ */
/* Katalog                                                             */
/* ------------------------------------------------------------------ */
export function povuciKategorije() {
  return izvrsi("/rest/v1/kategorije?select=*&order=vrsta,redoslijed");
}

export function povuciArtikle() {
  // Pogled vec nosi polje kategorija, pa nema spajanja u pregledniku.
  return izvrsi("/rest/v1/artikli_s_kategorijama?select=*&order=redoslijed");
}

/* ------------------------------------------------------------------ */
/* Upiti                                                               */
/* ------------------------------------------------------------------ */
/**
 * Upisuje upit i vraca njegov id.
 *
 * Red se upisuje PRIJE slanja e-poste. Ako slanje padne, upit i dalje
 * postoji u bazi — tvrtka ga moze naci, samo o njemu nije obavijestena.
 * Obrnuti redoslijed bi znacio da pad slanja ujedno znaci i gubitak upita.
 */
export function posaljiUpit(upit) {
  return izvrsi("/rest/v1/upiti", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(upit),
  });
}

/** Trazi od rubne funkcije da posalje e-postu za vec upisani upit. */
export function javiEPostom(idUpita) {
  return izvrsi("/functions/v1/posalji-upit", {
    method: "POST",
    body: JSON.stringify({ id: idUpita }),
  });
}
