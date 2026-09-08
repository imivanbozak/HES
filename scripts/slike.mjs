/**
 * slike.mjs — priprema slika za web.
 *
 * Izvorne datoteke u assets/images/ su zajedno oko 146 MB; circuit-real.jpg
 * je sam 30 MB. Nijedna ne smije doci na stranicu takva. Ova skripta iz njih
 * radi AVIF i WebP u nekoliko sirina i zapisuje ih u assets/img/.
 *
 * Pokretanje:  node scripts/slike.mjs
 *              node scripts/slike.mjs --force   (ponovno gradi i postojece)
 *
 * Izlazna imena su predvidiva — <ime>-<sirina>.avif / .webp — pa se u HTML-u
 * pise rucno, bez manifesta.
 */

import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const KORIJEN = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const IZVOR = path.join(KORIJEN, "assets", "images");
const IZLAZ = path.join(KORIJEN, "assets", "img");
const PRISILNO = process.argv.includes("--force");

/*
 * Sto se s cime radi.
 *
 * `sirine`   — koje varijante nastaju. Nema smisla raditi 2560 za teksturu
 *              koja stoji na 300 px.
 * `kvaliteta`— pozadinske teksture podnose puno jacu kompresiju od heroja,
 *              jer preko njih ionako ide maska i tekst.
 * `svrha`    — samo za ispis, da se vidi zasto je nesto ovdje.
 */
const POSAO = {
  "web_hero_section": {
    sirine: [960, 1440, 1920, 2560],
    kvaliteta: { avif: 52, webp: 74 },
    svrha: "hero na naslovnici, ultraSiroko polje",
  },
  "hero_mobile": {
    sirine: [640, 960],
    kvaliteta: { avif: 52, webp: 74 },
    svrha: "hero na mobitelu, uspravni kadar",
  },
  "industrial_image_floating": {
    sirine: [720, 1080, 1440],
    kvaliteta: { avif: 55, webp: 76 },
    svrha: "rastavljeni ormar; industrial i hero desno",
  },
  "industrial_image": {
    sirine: [480, 720, 1080, 1440],
    kvaliteta: { avif: 55, webp: 76 },
    svrha: "zatvoreni ormar, ljepljivi split",
  },
  "wavefield-bgg": {
    sirine: [1280, 1920],
    kvaliteta: { avif: 42, webp: 66 },
    svrha: "valno polje, tamna tema — zamjena za platno kad je pokret ugasen",
  },
  "wavefield-bgg-light": {
    sirine: [1280, 1920],
    kvaliteta: { avif: 42, webp: 66 },
    svrha: "valno polje, svijetla tema",
  },
  "circuit-bg-dark": {
    sirine: [960, 1600],
    kvaliteta: { avif: 40, webp: 64 },
    svrha: "tekstura tragova, tamna polja",
  },
  "circuit-bg": {
    sirine: [960, 1600],
    kvaliteta: { avif: 40, webp: 64 },
    svrha: "tekstura tragova, svijetla polja",
  },
  "interupted-elec-bg": {
    sirine: [480, 720, 1280, 1920],
    kvaliteta: { avif: 42, webp: 66 },
    svrha: "pojas s izbojima, iza loxone-teasera",
  },
  "distrupted-bg-ultrawide": {
    sirine: [1600, 2400],
    kvaliteta: { avif: 40, webp: 64 },
    svrha: "tanak pojas, prijelaz prema zaposlenju",
  },
  "techno-bg2": {
    sirine: [480, 720, 1280, 1920],
    kvaliteta: { avif: 42, webp: 66 },
    svrha: "cesticno polje, hero webshopa",
  },

  /*
   * Loxone komponente na PROZIRNOJ podlozi (izvor ima alfu, provjereno).
   * Zato ide bez ikakvog tona odozgo: polozena na tamno tirkizno polje otoka
   * daje kadar koji nijedna od postojecih tekstura ne moze — stvarne uredaje
   * koje ta sekcija prodaje, a ne apstraktni sum.
   */
  "loxone": {
    sirine: [640, 1000],
    kvaliteta: { avif: 50, webp: 74 },
    svrha: "komponente na prozirnom, pozadina Loxone otoka",
  },

  /* --- teksture sekcija -------------------------------------------- */
  // Jedina prava fotografija u kompletu i jedina koja doista prikazuje
  // predmet posla. Zato ide na sekciju usluga, ne u ukras.
  "circuit-real2": {
    sirine: [480, 720, 960, 1600],
    kvaliteta: { avif: 44, webp: 68 },
    svrha: "makro tiskane plocice — tekstura sekcije usluga",
  },
  "futuristic-bg2": {
    sirine: [480, 720, 1280, 1920],
    kvaliteta: { avif: 40, webp: 64 },
    svrha: "cesticni teren u tirkiznoj — tekstura najma i kataloga",
  },
  "techno-bg3": {
    sirine: [480, 720, 1280],
    kvaliteta: { avif: 40, webp: 64 },
    svrha: "cesticni teren u zelenoj — tekstura zavrsnih radova",
  },
  "distrupted-bg": {
    sirine: [1280],
    kvaliteta: { avif: 40, webp: 64 },
    svrha: "valne niti — tekstura kontakta",
  },
  "futuristic-bg": {
    sirine: [480, 720, 1280],
    kvaliteta: { avif: 40, webp: 64 },
    svrha: "cesticne niti — tekstura partnerskog pojasa",
  },
  /* --- placeholder fotografije za kartice --------------------------- */
  // Kartice Loxone skupina i kategorija najma trebaju DESET razlicitih
  // slika, a katalog ih nema (svaki artikl ima `slika: null`). Do prave
  // fotografije stoje ove: iste su obitelji motiva kao teksture, ali u
  // sirinama kartice, pa se zamjena svodi na jedan <picture> blok.
  "circuit-real3": {
    sirine: [480, 720],
    kvaliteta: { avif: 55, webp: 76 },
    svrha: "placeholder kartice — makro plocice, drugi kadar",
  },
  "circuit-real4": {
    sirine: [480, 720],
    kvaliteta: { avif: 55, webp: 76 },
    svrha: "placeholder kartice — makro plocice, treci kadar",
  },
  "techno-bg": {
    sirine: [480, 720],
    kvaliteta: { avif: 55, webp: 76 },
    svrha: "placeholder kartice — cesticno polje",
  },
  "futuristic-bg3": {
    sirine: [480, 720],
    kvaliteta: { avif: 55, webp: 76 },
    svrha: "placeholder kartice — cesticne niti",
  },
};

// space-like.jpg se namjerno NE obraduje: modra je, ne tirkizna, i ne prikazuje
// nista sto ova tvrtka radi. circuit-real.jpg je isti motiv kao circuit-real2
// uz 30 MB vise, pa u punoj sirini stoji samo jedan; -3 i -4 su dodani kasnije
// ISKLJUCIVO u sirinama kartice, gdje je potrebna razlicitost kadra a ne
// rezolucija.

const BOJA = { zeleno: "\x1b[32m", zuto: "\x1b[33m", sivo: "\x1b[90m", kraj: "\x1b[0m" };

function kb(bajtova) {
  return (bajtova / 1024).toFixed(0) + " kB";
}

async function nadiIzvor(ime) {
  const datoteke = await readdir(IZVOR);
  return datoteke.find((d) => path.parse(d).name === ime);
}

async function obradi(ime, postavke) {
  const datoteka = await nadiIzvor(ime);
  if (!datoteka) {
    console.log(`  ${BOJA.zuto}preskoceno${BOJA.kraj}  ${ime} — nema izvorne datoteke`);
    return { preskoceno: 1 };
  }

  const put = path.join(IZVOR, datoteka);
  const izvorna = await stat(put);
  const slika = sharp(put, { limitInputPixels: false });
  const meta = await slika.metadata();

  let napravljeno = 0;
  let ukupno = 0;

  for (const sirina of postavke.sirine) {
    // Nikad ne povecavaj: uzorkovanje prema gore samo napuhne datoteku.
    if (meta.width && sirina > meta.width) continue;

    for (const [format, kvaliteta] of Object.entries(postavke.kvaliteta)) {
      const izlaznaPutanja = path.join(IZLAZ, `${ime}-${sirina}.${format}`);
      if (!PRISILNO && existsSync(izlaznaPutanja)) {
        ukupno += (await stat(izlaznaPutanja)).size;
        continue;
      }

      const cjevovod = sharp(put, { limitInputPixels: false }).resize({
        width: sirina,
        withoutEnlargement: true,
      });

      const spremnik =
        format === "avif"
          ? cjevovod.avif({ quality: kvaliteta, effort: 6 })
          : cjevovod.webp({ quality: kvaliteta, effort: 5 });

      const bajtovi = await spremnik.toBuffer();
      await writeFile(izlaznaPutanja, bajtovi);
      ukupno += bajtovi.length;
      napravljeno += 1;
    }
  }

  // Izvjestava se najveca sirina koja je STVARNO nastala, ne najveca
  // trazena: izvori su mahom oko 1670 px pa se veci koraci preskacu, a
  // redak koji o tome ne vodi racuna javlja "0 kB" i djeluje kao kvar.
  const nastale = postavke.sirine.filter((s) => existsSync(path.join(IZLAZ, `${ime}-${s}.avif`)));
  const najveci = nastale[nastale.length - 1];
  const referentnaVel = najveci ? (await stat(path.join(IZLAZ, `${ime}-${najveci}.avif`))).size : 0;
  const izvorno = meta.width ? `${meta.width}x${meta.height}` : "?";

  console.log(
    `  ${BOJA.zeleno}ok${BOJA.kraj}  ${ime.padEnd(26)} ${izvorno.padStart(9)} ` +
      `${kb(izvorna.size).padStart(8)} -> ${kb(referentnaVel).padStart(7)} avif @${najveci}px` +
      `   ${BOJA.sivo}${postavke.svrha}${BOJA.kraj}`
  );

  return { napravljeno, ukupno, izvorno: izvorna.size };
}

async function glavno() {
  await mkdir(IZLAZ, { recursive: true });

  console.log("Priprema slika" + (PRISILNO ? " (ponovno sve)" : ""));
  console.log("");

  let izvornoUkupno = 0;
  let izlazUkupno = 0;
  let varijanti = 0;

  for (const [ime, postavke] of Object.entries(POSAO)) {
    const rezultat = await obradi(ime, postavke);
    izvornoUkupno += rezultat.izvorno ?? 0;
    izlazUkupno += rezultat.ukupno ?? 0;
    varijanti += rezultat.napravljeno ?? 0;
  }

  console.log("");
  console.log(
    `${varijanti} novih varijanti · izvorno ${kb(izvornoUkupno)} · isporucuje se ${kb(izlazUkupno)} ukupno`
  );
  console.log(`${BOJA.sivo}Ne obraduju se: circuit-real.jpg (isti motiv kao -real2) i space-like.jpg (modra).${BOJA.kraj}`);
}

glavno().catch((greska) => {
  console.error(greska);
  process.exit(1);
});
