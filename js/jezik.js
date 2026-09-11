/**
 * jezik.js — jezik stranice i sve sto iz njega slijedi u pregledniku.
 *
 * Jezik se ne bira ovdje nego adresom. /de/... i /en/... su zasebne staticke
 * stranice (scripts/jezici.mjs) i svaka nosi svoj `<html lang>`. Modul ga
 * procita jednom i iz njega izvodi tekst, poveznice, cijene i datume koje
 * crta JavaScript — ono do cega staticki prijevod HTML-a ne moze doci.
 *
 * Mora raditi i u Nodeu. scripts/provjere.mjs i scripts/stranice.mjs uvoze
 * module koji uvoze ovaj, a ondje `document` ne postoji; jezik je tada
 * hrvatski, jezik izvora. Zato svaka funkcija prima i izricit jezik.
 */

import { PRIJEVODI } from "./prijevodi.js";

export const JEZICI = ["hr", "de", "en"];
export const IZVORNI = "hr";

function procitajJezik() {
  if (typeof document === "undefined") return IZVORNI;
  const oznaka = String(document.documentElement.lang || "").slice(0, 2).toLowerCase();
  return JEZICI.includes(oznaka) ? oznaka : IZVORNI;
}

export const JEZIK = procitajJezik();

/* ------------------------------------------------------------------ */
/* Tekst                                                               */
/* ------------------------------------------------------------------ */
/**
 * Prijevod po kljucu, sa zamjenama `{ime}`.
 *
 * Kljuc kojeg u jeziku nema pada na hrvatski, a kljuc kojeg nema ni ondje
 * vraca sam sebe. Oboje se vidi na stranici umjesto da tiho nestane, a
 * provjera pariteta u scripts/provjere.mjs ga lovi i prije toga.
 */
export function t(kljuc, zamjene = {}, jezik = JEZIK) {
  const tekst = PRIJEVODI[jezik]?.[kljuc] ?? PRIJEVODI[IZVORNI][kljuc] ?? kljuc;
  if (typeof tekst !== "string") return kljuc;
  return tekst.replace(/\{(\w+)\}/g, (cijelo, ime) => (ime in zamjene ? String(zamjene[ime]) : cijelo));
}

const pravilaMnozine = new Map();

/**
 * Oblik rijeci uz broj — "1 artikl", "2 artikla", "5 artikala".
 *
 * Hrvatski ima tri oblika, njemacki i engleski dva. Koji se bira zna
 * Intl.PluralRules; rjecnik nosi same oblike pod njegovim imenima
 * (`one`, `few`, `other`).
 */
export function mnozina(kljuc, broj, jezik = JEZIK) {
  const oblici = PRIJEVODI[jezik]?.[kljuc] ?? PRIJEVODI[IZVORNI][kljuc];
  if (!oblici || typeof oblici !== "object") return kljuc;
  if (!pravilaMnozine.has(jezik)) pravilaMnozine.set(jezik, new Intl.PluralRules(jezik));
  return oblici[pravilaMnozine.get(jezik).select(broj)] ?? oblici.other;
}

/** Naziv iz baze u obliku `{ hr, de, en }` — prijevod ako postoji, inace izvor. */
export function lokalno(nazivi, jezik = JEZIK) {
  return nazivi?.[jezik] || nazivi?.[IZVORNI] || "";
}

/* ------------------------------------------------------------------ */
/* Poveznice                                                           */
/* ------------------------------------------------------------------ */
/**
 * Adresa stranice na jeziku posjetitelja.
 *
 *   "/webshop"   -> "/de/webshop"
 *   "/#kontakt"  -> "/de/#kontakt"
 *   "/"          -> "/de/"
 *
 * Hrvatski stoji u korijenu i ostaje bez prefiksa. Datoteke (/assets, /css,
 * /js) postoje samo jednom pa ni na drugim jezicima ne dobivaju prefiks, a
 * mailto:, tel: i vanjske adrese prolaze netaknute.
 */
const DATOTEKE = /^\/(assets|css|js)\//;

export function putanja(put, jezik = JEZIK) {
  if (jezik === IZVORNI || typeof put !== "string") return put;
  if (!put.startsWith("/") || put.startsWith("//") || DATOTEKE.test(put)) return put;
  if (put === `/${jezik}` || put.startsWith(`/${jezik}/`)) return put;
  return `/${jezik}${put}`;
}

/* ------------------------------------------------------------------ */
/* Novac i datumi                                                      */
/* ------------------------------------------------------------------ */
const tisucice = (broj, znak) => String(broj).replace(/\B(?=(\d{3})+(?!\d))/g, znak);

/**
 * Cijena u centima -> "1.234,56 €" (hr, de) ili "€1,234.56" (en).
 *
 * Racuna se nad cijelim brojem centi, nikad nad decimalnim brojem — isto
 * pravilo kao u js/kosarica.js. Razmak ispred znaka eura je tvrdi, da se
 * iznos ne prelomi izmedu broja i valute.
 */
export function formatCijene(cente, jezik = JEZIK) {
  const cijeli = Math.trunc(cente / 100);
  const decimale = String(Math.abs(cente % 100)).padStart(2, "0");
  if (jezik === "en") return `€${tisucice(cijeli, ",")}.${decimale}`;
  return `${tisucice(cijeli, ".")},${decimale}\u00a0€`;
}

/**
 * Datum "2026-09-14" -> "14. 9." (hr), "14.9." (de), "14 Sept" (en), s
 * godinom na zahtjev.
 *
 * Datum najma je kalendarski dan, ne trenutak, pa ne smije proci kroz
 * vremensku zonu preglednika: ponoc po zagrebackom vremenu je u UTC-u jos
 * prethodni dan.
 */
export function formatDatuma(iso, { godina = false } = {}, jezik = JEZIK) {
  const [g, m, d] = String(iso ?? "").split("-").map(Number);
  if (!g || !m || !d) return "";
  if (jezik === "en") {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      ...(godina ? { year: "numeric" } : {}),
      timeZone: "UTC",
    }).format(Date.UTC(g, m - 1, d));
  }
  if (jezik === "de") return godina ? `${d}.${m}.${g}` : `${d}.${m}.`;
  return godina ? `${d}. ${m}. ${g}.` : `${d}. ${m}.`;
}
