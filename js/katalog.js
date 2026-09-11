/**
 * katalog.js — dohvat i normalizacija kataloga.
 *
 * Dva izvora, isti oblik na izlazu:
 *   - Supabase, kad je podesen u konfiguracija.js
 *   - assets/katalog.json, kad nije
 *
 * Drugi nije "demo nacin" nego ravnopravan put: 75 artikala je 40 kB JSON-a,
 * a stranica bez baze radi jednako, samo se cjenik mijenja ponovnim
 * pokretanjem scripts/seed.py umjesto SQL-om.
 */

// `imaOblak` zivi u konfiguraciji, ne u oblak.js — oblak.js ga i sam odande
// uvozi i nikad ga nije izvozio dalje. Dok je ovdje stajalo "./oblak.js",
// modul je pucao na uvozu jos prije prve linije koda i katalog se nije crtao.
import { imaOblak } from "./konfiguracija.js";
import { povuciArtikle, povuciKategorije } from "./oblak.js";

let ucitano = null;

function normaliziraj(artikl, mediji) {
  return {
    id: String(artikl.id),
    vrsta: artikl.vrsta,
    naziv: artikl.naziv,
    sku: artikl.sku ?? null,
    marka: artikl.marka ?? null,
    cijenaCents: Number(artikl.cijena_cents ?? artikl.cijenaCents ?? 0),
    osnova: artikl.osnova,
    naStanju: Boolean(artikl.na_stanju ?? artikl.naStanju ?? true),
    // Skriveni artikl ostaje u katalogu da njegova stranica i stare kosarice
    // i dalje znaju sto je, ali ga popisi preskacu (zaVrstu, brojevi).
    aktivan: artikl.aktivan !== false,
    kolicina: Number(artikl.kolicina ?? 1),
    slika: artikl.slika ?? null,
    // Fotografije i video ne dolaze iz kataloga nego iz vlastitog manifesta —
    // vidi ucitajMedije() nize.
    mediji: mediji?.[String(artikl.id)] ?? null,
    kategorije: artikl.kategorije ?? [],
  };
}

function normalizirajKategoriju(kategorija) {
  return {
    id: kategorija.id,
    vrsta: kategorija.vrsta,
    roditeljId: kategorija.roditelj_id ?? kategorija.roditeljId ?? null,
    redoslijed: Number(kategorija.redoslijed ?? 0),
    naziv: {
      hr: kategorija.naziv_hr ?? kategorija.naziv ?? kategorija.id,
      de: kategorija.naziv_de ?? null,
      en: kategorija.naziv_en ?? null,
    },
  };
}

async function izDatoteke() {
  const odgovor = await fetch("/assets/katalog.json", { cache: "no-cache" });
  if (!odgovor.ok) throw new Error(`katalog.json: HTTP ${odgovor.status}`);
  return odgovor.json();
}

/**
 * Manifest medija — assets/mediji.json, gradi ga scripts/proizvodi.mjs.
 *
 * Odvojen je od kataloga jer katalog generira scripts/seed.py iz izvoza, a
 * izvoz nema nijednu sliku: svih 59 artikala ima `slika: null` i ponovno
 * pokretanje seed skripte bi svaku rucno upisanu putanju pregazilo.
 *
 * Pada tiho. Katalog bez slika je i dalje katalog s cijenama — praznu
 * stranicu zbog jedne datoteke koja nedostaje nitko ne bi opravdao.
 */
async function ucitajMedije() {
  try {
    const odgovor = await fetch("/assets/mediji.json", { cache: "no-cache" });
    if (!odgovor.ok) throw new Error(`HTTP ${odgovor.status}`);
    return (await odgovor.json()).proizvodi ?? null;
  } catch (greska) {
    console.warn("[katalog] mediji.json nije ucitan, kartice idu bez slika", greska);
    return null;
  }
}

/**
 * Ucitaj katalog jednom po posjetu.
 *
 * Ako je oblak podesen ali padne, tiho se pada natrag na datoteku: posjetitelj
 * radije vidi jucerasnji cjenik nego praznu stranicu, a cjenik se ionako
 * mijenja rijetko.
 */
export async function ucitajKatalog() {
  if (ucitano) return ucitano;

  let sirovo = null;
  const medijiObecanje = ucitajMedije();

  if (imaOblak()) {
    const [artikli, kategorije] = await Promise.all([povuciArtikle(), povuciKategorije()]);
    if (artikli.ok && kategorije.ok) {
      sirovo = { artikli: artikli.podaci, kategorije: kategorije.podaci };
    } else {
      console.warn("[katalog] oblak nije odgovorio, koristi se assets/katalog.json");
    }
  }

  if (!sirovo) sirovo = await izDatoteke();

  const mediji = await medijiObecanje;
  const artikli = sirovo.artikli.map((artikl) => normaliziraj(artikl, mediji));
  const kategorije = sirovo.kategorije.map(normalizirajKategoriju);

  // Indeksi se racunaju jednom: filtriranje ih poslije samo cita.
  const poId = new Map(kategorije.map((k) => [k.id, k]));
  const djeca = new Map();
  for (const kategorija of kategorije) {
    if (!kategorija.roditeljId) continue;
    if (!djeca.has(kategorija.roditeljId)) djeca.set(kategorija.roditeljId, []);
    djeca.get(kategorija.roditeljId).push(kategorija);
  }

  const brojPoKategoriji = new Map();
  for (const artikl of artikli) {
    if (!artikl.aktivan) continue;
    for (const kategorijaId of artikl.kategorije) {
      brojPoKategoriji.set(kategorijaId, (brojPoKategoriji.get(kategorijaId) ?? 0) + 1);
    }
  }

  ucitano = {
    artikli,
    kategorije,
    poId,
    djeca,
    brojPoKategoriji,

    /** Vidljivi artikli jedne vrste — 'loxone' ili 'alat'. */
    zaVrstu(vrsta) {
      return artikli.filter((a) => a.vrsta === vrsta && a.aktivan);
    },

    /** Nadredene kategorije jedne vrste, u zadanom redoslijedu. */
    obitelji(vrsta) {
      return kategorije
        .filter((k) => k.vrsta === vrsta && !k.roditeljId)
        .sort((a, b) => a.redoslijed - b.redoslijed);
    },

    podskupine(roditeljId) {
      return (djeca.get(roditeljId) ?? []).slice().sort((a, b) => a.redoslijed - b.redoslijed);
    },

    /** Marke koje se stvarno pojavljuju, bez praznih. */
    marke(vrsta) {
      const skup = new Set();
      for (const artikl of artikli) {
        if (artikl.vrsta === vrsta && artikl.marka && artikl.aktivan) skup.add(artikl.marka);
      }
      return [...skup].sort((a, b) => a.localeCompare(b, "hr"));
    },

    /** Najniza i najvisa cijena skupa artikala, za natpise raspona. */
    raspon(popis) {
      if (!popis.length) return null;
      const cijene = popis.map((a) => a.cijenaCents);
      return { od: Math.min(...cijene), do: Math.max(...cijene) };
    },
  };

  return ucitano;
}
