/**
 * veza.js — prijava i razgovor s bazom kao administrator.
 *
 * Isti pristup kao js/oblak.js: bez klijentske biblioteke, obican fetch na
 * Supabase Auth (GoTrue) i PostgREST. Razlika je samo u zaglavlju: umjesto
 * anonimnog kljuca ide JWT prijavljenog korisnika, a sto smije odlucuje RLS
 * u supabase/shema.sql (je_admin()), ne ovaj kod.
 *
 * Sesija zivi u sessionStorage, ne u localStorage: zatvaranje kartice
 * odjavljuje. Za racunalo u uredu koje koristi vise ljudi to je ispravnije.
 *
 * Nijedna funkcija ne baca iznimku. Vraca `{ ok: true, podaci }` ili
 * `{ ok: false, greska }`, kao i oblak.js. Istekla sesija javlja se jos i
 * dogadajem "admin:odjavljen", da main.js vrati obrazac za prijavu.
 */

import { SUPABASE, imaOblak } from "../konfiguracija.js";

export { imaOblak };

const KLJUC = "hes.admin.sesija";
let sesija = procitaj();

function procitaj() {
  try {
    return JSON.parse(sessionStorage.getItem(KLJUC));
  } catch {
    return null;
  }
}

function spremi(nova) {
  sesija = nova;
  try {
    if (nova) sessionStorage.setItem(KLJUC, JSON.stringify(nova));
    else sessionStorage.removeItem(KLJUC);
  } catch {
    /* bez spremista sesija traje do osvjezavanja */
  }
}

function odjavljen() {
  spremi(null);
  document.dispatchEvent(new CustomEvent("admin:odjavljen"));
  return { ok: false, odjavljen: true, greska: "Sesija je istekla. Prijavite se ponovno." };
}

/* ------------------------------------------------------------------ */
/* Prijava                                                             */
/* ------------------------------------------------------------------ */
async function auth(putanja, tijelo, token = null) {
  try {
    const odgovor = await fetch(`${SUPABASE.url}/auth/v1/${putanja}`, {
      method: "POST",
      headers: {
        apikey: SUPABASE.anonKljuc,
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(tijelo ?? {}),
    });
    const podaci = await odgovor.json().catch(() => ({}));
    return { ok: odgovor.ok, status: odgovor.status, podaci };
  } catch {
    return { ok: false, status: 0, podaci: {} };
  }
}

const izOdgovora = (podaci) => ({
  access_token: podaci.access_token,
  refresh_token: podaci.refresh_token,
  // Rok se biljezi po satu preglednika u trenutku primitka, ne iz tokena:
  // sat racunala u uredu ne mora se slagati sa satom posluzitelja.
  istice: Date.now() + (Number(podaci.expires_in) || 3600) * 1000,
  email: podaci.user?.email ?? sesija?.email ?? "",
});

export async function prijava(email, lozinka) {
  const { ok, status, podaci } = await auth("token?grant_type=password", { email, password: lozinka });
  if (!ok) {
    if (status === 0) return { ok: false, greska: "Mreža nije dostupna." };
    if (status === 400) return { ok: false, greska: "Pogrešna e-pošta ili lozinka." };
    return { ok: false, greska: podaci.error_description || podaci.msg || `Prijava nije uspjela (HTTP ${status}).` };
  }
  spremi(izOdgovora(podaci));
  return { ok: true };
}

/** Token vrijedi sat vremena; osvjezava se minutu prije isteka. */
async function osvjeziAkoTreba() {
  if (!sesija) return false;
  if (sesija.istice - Date.now() > 60_000) return true;
  const { ok, podaci } = await auth("token?grant_type=refresh_token", { refresh_token: sesija.refresh_token });
  if (!ok) return false;
  spremi(izOdgovora(podaci));
  return true;
}

export async function odjava() {
  if (sesija?.access_token) await auth("logout", {}, sesija.access_token);
  spremi(null);
}

export const jePrijavljen = () => Boolean(sesija?.access_token);
export const email = () => sesija?.email ?? "";

/* ------------------------------------------------------------------ */
/* Baza i funkcije                                                     */
/* ------------------------------------------------------------------ */
async function zahtjev(url, { method = "GET", tijelo, zaglavlja = {} } = {}) {
  if (!(await osvjeziAkoTreba())) return odjavljen();

  try {
    const odgovor = await fetch(url, {
      method,
      headers: {
        apikey: SUPABASE.anonKljuc,
        Authorization: `Bearer ${sesija.access_token}`,
        "Content-Type": "application/json",
        ...zaglavlja,
      },
      body: tijelo === undefined ? undefined : JSON.stringify(tijelo),
    });

    if (odgovor.status === 401) return odjavljen();

    const tekst = await odgovor.text();
    let podaci = null;
    try {
      podaci = tekst ? JSON.parse(tekst) : null;
    } catch {
      podaci = tekst;
    }

    if (!odgovor.ok) {
      return {
        ok: false,
        status: odgovor.status,
        greska: podaci?.message ?? podaci?.greska ?? `HTTP ${odgovor.status}`,
      };
    }
    return { ok: true, podaci };
  } catch {
    return { ok: false, greska: "Mreža nije dostupna." };
  }
}

/** PostgREST: `baza("upiti?select=*")`, `baza("upiti?id=eq.X", { method: "PATCH", tijelo })`. */
export function baza(putanja, postavke) {
  return zahtjev(`${SUPABASE.url}/rest/v1/${putanja}`, postavke);
}

/** Rubna funkcija, s JWT-om admina — ona sama provjeri je li admin. */
export function funkcija(ime, tijelo) {
  return zahtjev(`${SUPABASE.url}/functions/v1/${ime}`, { method: "POST", tijelo });
}

/**
 * Je li prijavljeni korisnik u tablici `admini`.
 *
 * RLS pusta svakog korisnika da vidi samo vlastiti red, pa je prazan odgovor
 * "nije admin", a ne greska.
 */
export async function jeAdmin() {
  const ishod = await baza("admini?select=user_id");
  return ishod.ok && Array.isArray(ishod.podaci) && ishod.podaci.length > 0;
}
