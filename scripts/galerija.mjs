/**
 * galerija.mjs — fotografije radova za /galerija.
 *
 * Pokretanje:  node scripts/galerija.mjs           (npm run galerija)
 *              node scripts/galerija.mjs --force   (ponovno gradi i postojece)
 *
 * IZVOR
 *   assets/images/galerija/<usluga>/<projekt>/*.jpg|jpeg|png|webp|tif
 *     usluga  = industrijske | zavrsni | kucne | loxone
 *     projekt = ime mape, npr. "stan-zagreb-2025"
 *   Izvori su van gita kao i ostale originalne fotografije (.gitignore,
 *   assets/images/). Opisi projekata su u data/galerija.mjs.
 *
 * IZLAZ
 *   assets/galerija/<usluga>-<projekt>-<datoteka>-<sirina>.avif|webp
 *   assets/galerija.json   manifest koji cita js/galerija.js
 *
 * Tri stvari koje se iz koda ne vide:
 *
 *  1. Metapodaci se BRISU. Fotografija s mobitela nosi GPS s adrese kupca.
 *     sharp ih po zadanom ne prenosi u izlaz; orijentacija se prije toga
 *     primijeni (`rotate()`), da uspravna fotografija ne ispadne polegnuta.
 *  2. Dimenzije idu u manifest. Raspored u stupce (js/galerija.js) iz njih
 *     zna visinu svake slike prije nego se ucita, pa se mreza ne preslaguje
 *     dok slike stizu.
 *  3. Kad galerija dobije prve fotografije, skripta ukljuci poveznicu
 *     "Galerija" u izborniku rucno pisanih stranica (data-galerija-veza) i
 *     pusti stranicu trazilicama. Dok ih nema, oboje ostaje ugaseno: prazna
 *     galerija bi javno pokazivala da fotografija nema (hes-content.md).
 *     Stranice proizvoda to procitaju iz manifesta — `npm run stranice`.
 *
 * Ime izlaza nosi ime IZVORNE datoteke, ne redni broj. Dodana fotografija
 * tako ne preimenuje sve iza sebe, a provjera "vec postoji" ne zamijeni
 * jednu fotografiju drugom.
 */

import { mkdir, readdir, readFile, writeFile, stat, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import { USLUGE, PROJEKTI } from "../data/galerija.mjs";

const KORIJEN = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const IZVOR = path.join(KORIJEN, "assets", "images", "galerija");
const IZLAZ = path.join(KORIJEN, "assets", "galerija");
const MANIFEST = path.join(KORIJEN, "assets", "galerija.json");
const PRISILNO = process.argv.includes("--force");

const SIRINE = [480, 960, 1600];
const KVALITETA = { avif: 52, webp: 74 };
const NASTAVCI = new Set([".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"]);

/** Rucno pisane stranice s poveznicom na galeriju. Generirane cita stranice.mjs. */
const RUCNE_STRANICE = ["index.html", "webshop.html", "najam-alata.html", "privatnost.html", "galerija.html"];

const BOJA = { zeleno: "\x1b[32m", zuto: "\x1b[33m", sivo: "\x1b[90m", kraj: "\x1b[0m" };

const slug = (tekst) =>
  String(tekst)
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

async function mape(put) {
  try {
    return (await readdir(put, { withFileTypes: true }))
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort((a, b) => a.localeCompare(b, "hr", { numeric: true }));
  } catch {
    return [];
  }
}

async function fotografije(put) {
  return (await readdir(put, { withFileTypes: true }))
    .filter((d) => d.isFile() && NASTAVCI.has(path.extname(d.name).toLowerCase()))
    .map((d) => d.name)
    .sort((a, b) => a.localeCompare(b, "hr", { numeric: true }));
}

function nazivIzMape(ime) {
  const rijeci = ime.replace(/[-_]+/g, " ").trim();
  return rijeci.charAt(0).toUpperCase() + rijeci.slice(1);
}

/**
 * Jedna fotografija u sve sirine i oba formata.
 * Vraca dimenzije NAKON okretanja i sirine koje su stvarno nastale.
 */
async function obradi(izvor, id, napisane) {
  const meta = await sharp(izvor).metadata();
  // EXIF orijentacije 5–8 okrecu sliku za 90°: sirina i visina zamijene mjesta.
  const okrenuta = (meta.orientation ?? 1) >= 5;
  const sirina = okrenuta ? meta.height : meta.width;
  const visina = okrenuta ? meta.width : meta.height;

  // Nikad ne povecavaj. Fotografija uza od najmanje sirine ide u vlastitoj.
  const sirine = SIRINE.filter((s) => s <= sirina);
  if (!sirine.length) sirine.push(sirina);

  const izvorIzmijenjen = (await stat(izvor)).mtimeMs;
  let novih = 0;

  for (const s of sirine) {
    for (const [format, kvaliteta] of Object.entries(KVALITETA)) {
      const ime = `${id}-${s}.${format}`;
      const izlaz = path.join(IZLAZ, ime);
      napisane.add(ime);

      if (!PRISILNO && existsSync(izlaz) && (await stat(izlaz)).mtimeMs >= izvorIzmijenjen) continue;

      const cjevovod = sharp(izvor).rotate().resize({ width: s, withoutEnlargement: true });
      await (format === "avif"
        ? cjevovod.avif({ quality: kvaliteta, effort: 6 })
        : cjevovod.webp({ quality: kvaliteta, effort: 5 })
      ).toFile(izlaz);
      novih += 1;
    }
  }

  return { sirina, visina, sirine, novih };
}

/** Ukljuci ili ugasi poveznicu na galeriju i indeksiranje njezine stranice. */
async function postaviVidljivost(ima) {
  const promijenjene = [];
  for (const ime of RUCNE_STRANICE) {
    const put = path.join(KORIJEN, ime);
    if (!existsSync(put)) continue;
    const html = await readFile(put, "utf8");
    const novo = html
      .replace(/data-galerija-veza( hidden)?/g, ima ? "data-galerija-veza" : "data-galerija-veza hidden")
      .replace(
        /<meta name="robots" content="[^"]*" data-galerija-robots>/,
        `<meta name="robots" content="${ima ? "index, follow" : "noindex"}" data-galerija-robots>`
      );
    if (novo !== html) {
      await writeFile(put, novo, "utf8");
      promijenjene.push(ime);
    }
  }
  return promijenjene;
}

async function glavno() {
  await mkdir(IZLAZ, { recursive: true });

  const projekti = [];
  const slike = [];
  const napisane = new Set();
  const upozorenja = [];
  let novih = 0;

  for (const usluga of await mape(IZVOR)) {
    if (!USLUGE.includes(usluga)) {
      upozorenja.push(`mapa "${usluga}" nije usluga (${USLUGE.join(", ")}) — preskocena`);
      continue;
    }

    for (const mapa of await mape(path.join(IZVOR, usluga))) {
      const projektId = `${usluga}/${slug(mapa)}`;
      const opis = PROJEKTI[projektId];
      const popis = await fotografije(path.join(IZVOR, usluga, mapa));
      if (!popis.length) continue;
      if (!opis) upozorenja.push(`${projektId}: nema opisa u data/galerija.mjs — naziv je ime mape`);

      projekti.push({
        id: projektId,
        usluga,
        naziv: opis?.naziv ?? { hr: nazivIzMape(mapa) },
        mjesto: opis?.mjesto ?? null,
        godina: opis?.godina ?? null,
      });

      for (const datoteka of popis) {
        const id = `${usluga}-${slug(mapa)}-${slug(path.parse(datoteka).name)}`;
        const rezultat = await obradi(path.join(IZVOR, usluga, mapa, datoteka), id, napisane);
        novih += rezultat.novih;
        slike.push({
          id,
          projekt: projektId,
          sirina: rezultat.sirina,
          visina: rezultat.visina,
          sirine: rezultat.sirine,
          alt: opis?.alt?.[datoteka] ?? null,
        });
        console.log(
          `  ${BOJA.zeleno}ok${BOJA.kraj}  ${id.padEnd(48)} ${String(rezultat.sirina).padStart(5)}x${rezultat.visina}` +
            `${rezultat.novih ? "" : `  ${BOJA.sivo}(postoji)${BOJA.kraj}`}`
        );
      }
    }
  }

  // Visak: izlaz ciji je izvor maknut ili preimenovan. Posluzivao bi se i
  // dalje, a nitko ne bi imao odakle primijetiti.
  for (const datoteka of await readdir(IZLAZ)) {
    if (!napisane.has(datoteka)) {
      await unlink(path.join(IZLAZ, datoteka));
      console.log(`  ${BOJA.zuto}−${BOJA.kraj}  ${datoteka}  ${BOJA.sivo}visak, obrisano${BOJA.kraj}`);
    }
  }

  await writeFile(
    MANIFEST,
    JSON.stringify({ generirano: "scripts/galerija.mjs", sirine: SIRINE, projekti, slike }, null, 1),
    "utf8"
  );

  const promijenjene = await postaviVidljivost(slike.length > 0);

  console.log("");
  console.log(`${slike.length} fotografija u ${projekti.length} projekata · ${novih} novih datoteka`);
  if (!existsSync(IZVOR)) {
    console.log(`${BOJA.sivo}Nema mape assets/images/galerija/ — galerija je prazna i poveznica skrivena.${BOJA.kraj}`);
  }
  for (const ime of promijenjene) {
    console.log(`${BOJA.zuto}!${BOJA.kraj}  ${ime}: poveznica na galeriju ${slike.length ? "ukljucena" : "skrivena"}`);
  }
  if (promijenjene.length) console.log(`${BOJA.sivo}Pokrenite npm run stranice da i stranice proizvoda prate.${BOJA.kraj}`);
  for (const poruka of upozorenja) console.log(`${BOJA.zuto}upozorenje${BOJA.kraj}  ${poruka}`);
}

glavno().catch((greska) => {
  console.error(greska);
  process.exitCode = 1;
});
