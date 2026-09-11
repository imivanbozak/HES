/**
 * jezici.mjs — njemacka i engleska inacica stranice.
 *
 * Pokretanje:
 *   node scripts/jezici.mjs               pise de/ i en/          (npm run jezici)
 *   node scripts/jezici.mjs --provjeri    samo javi sto nedostaje, ne pisi nista
 *   node scripts/jezici.mjs --izvuci      dopisi nove recenice u rjecnike (vrijednost null)
 *   node scripts/jezici.mjs --pocisti     uz --izvuci: makni recenice kojih vise nema
 *   node scripts/jezici.mjs --pregled     data/i18n/PREGLED.md — HR | DE | EN, za recenzenta
 *   node scripts/jezici.mjs --djelomicno  pisi i kad prijevoda nedostaje (hrvatski ostaje)
 *
 * KAKO RADI
 * ---------
 * Hrvatske stranice su izvor — rucno pisane i one koje gradi
 * scripts/stranice.mjs. Skripta ih procita, razlozi na recenice (odlomak,
 * naslov, gumb, stavka popisa, natpis...) i svaku zamijeni prijevodom iz
 * data/i18n/<jezik>.json.
 *
 * Kljuc rjecnika je SAM HRVATSKI TEKST, ne ime:
 *   - u HTML-u se nista ne mora rucno oznacavati
 *   - kad se hrvatska recenica promijeni, stari prijevod vise ne pase i
 *     skripta ga javi kao da nedostaje — prijevod ne moze tiho zastarjeti
 *     iza izvora
 *
 * Unutarnji elementi (poveznica, naglasak, ikona) ostaju iz izvora. U kljucu
 * i prijevodu stoje kao <0>…</0> ili <0/>, pa se ikona ne prevodi, a
 * prevoditelj smije pomaknuti poveznicu unutar recenice:
 *   "Slanjem upita prihvaćate obradu podataka prema <0>obavijesti o privatnosti</0>."
 *   "By sending an enquiry you accept the processing of your data as described in our <0>privacy notice</0>."
 *
 * Cijene u tekstu ("655,61 €") postaju {cijena0}, {cijena1}... Prijevod ih
 * nosi kao oznake, a skripta upise iznos u obliku jezika (en: "€655.61").
 * Promjena cijene u adminu tako ne rusi prijevod.
 *
 * Uz tekst se prevode alt, title, aria-label, placeholder i meta opis.
 * Poveznice dobivaju prefiks jezika (/webshop -> /de/webshop), relativne
 * putanje do datoteka postaju apsolutne (assets/... -> /assets/...), jer bi
 * se iz /de/ razrijesile u /de/assets/. Komentari se ne prenose: to su
 * biljeske za razvoj, na hrvatskom.
 *
 * Nedostaje li ijedan prijevod, nista se ne pise (osim uz --djelomicno):
 * napola hrvatska njemacka stranica gora je od nikakve.
 */

import { readFile, writeFile, mkdir, readdir, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseHTML } from "linkedom";

import { putanja, formatCijene } from "../js/jezik.js";

const KORIJEN = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const RJECNICI = path.join(KORIJEN, "data", "i18n");
const JEZICI = ["de", "en"];

const ZASTAVICE = new Set(process.argv.slice(2));
const PROVJERA = ZASTAVICE.has("--provjeri");
const IZVUCI = ZASTAVICE.has("--izvuci");
const POCISTI = ZASTAVICE.has("--pocisti");
const PREGLED = ZASTAVICE.has("--pregled");
const DJELOMICNO = ZASTAVICE.has("--djelomicno");

const BOJA = { zeleno: "\x1b[32m", crveno: "\x1b[31m", zuto: "\x1b[33m", sivo: "\x1b[90m", kraj: "\x1b[0m" };

/** Rucno pisane stranice, plus sve sto stranice.mjs generira. Admin ostaje samo hrvatski. */
const RUCNE = ["index.html", "webshop.html", "najam-alata.html", "privatnost.html", "galerija.html"];
const GENERIRANE_MAPE = ["proizvodi", "alati"];

const PRESKOCI_ELEMENTE = new Set(["script", "style", "svg", "template", "code"]);
const ATRIBUTI = ["alt", "title", "aria-label", "placeholder"];

/* ================================================================== */
/* Kljuc: tekst, oznake i cijene                                       */
/* ================================================================== */
// Bjelina bez tvrdog razmaka: U+00A0 izmedu iznosa i € mora prezivjeti.
const BJELINA = /[ \t\n\r\f]+/g;
const CIJENA = /\d{1,3}(?:\.\d{3})*,\d{2}[ \u00a0]?€/g;

/** "1.234,56 €" -> 123456 */
function uCente(zapis) {
  const [cijeli, decimale] = zapis.replace(/[^\d,]/g, "").split(",");
  return Number(cijeli) * 100 + Number(decimale);
}

/** Ima li u nizu nesto za prevesti — slova, a ne samo adresa ili broj. */
function prevodivo(tekst) {
  const bez = tekst.replace(/<\/?\d+\/?>/g, " ").replace(/\{cijena\d+\}/g, " ").trim();
  if (!/\p{L}{2,}/u.test(bez)) return false;
  if (/^[\w.+-]+@[\w-]+(\.[\w-]+)+$/.test(bez)) return false; // e-posta
  if (/^[\w-]+(\.[\w-]+)+$/.test(bez)) return false; // hes.hr, kontakt.hes
  return true;
}

const ima_teksta = (cvor) => /\S/.test(cvor.textContent ?? "");

/**
 * Element -> kljuc.
 *
 * Tekst ide doslovno (bjelina sazeta), cijene postaju {cijenaN}, a svaki
 * element-dijete oznaka: <n>…</n> ako ima tekst, <n/> ako nema (ikona,
 * slika, prijelom). Brojenje je redom u dokumentu, kroz sve razine.
 */
function kljucElementa(element) {
  const djeca = [];
  const cijene = [];

  const obidji = (roditelj) => {
    let niz = "";
    for (const cvor of roditelj.childNodes) {
      if (cvor.nodeType === 3) {
        niz += cvor.textContent.replace(CIJENA, (zapis) => {
          cijene.push(uCente(zapis));
          return `{cijena${cijene.length - 1}}`;
        });
      } else if (cvor.nodeType === 1) {
        const broj = djeca.length;
        djeca.push(cvor);
        niz += ima_teksta(cvor) && !PRESKOCI_ELEMENTE.has(cvor.localName) ? `<${broj}>${obidji(cvor)}</${broj}>` : `<${broj}/>`;
      }
    }
    return niz;
  };

  const kljuc = obidji(element).replace(BJELINA, " ").trim();
  return { kljuc, djeca, cijene };
}

/**
 * Prijevod -> cvorovi, s elementima iz izvora na mjestu oznaka.
 * Oznaka koje nema u izvoru je greska u prijevodu i javlja se glasno.
 */
function izgradi(prijevod, djeca, cijene, dokument, jezik) {
  const umetniCijene = (tekst) =>
    tekst.replace(/\{cijena(\d+)\}/g, (_, n) => {
      if (cijene[Number(n)] === undefined) throw new Error(`prijevod trazi {cijena${n}} koje u izvoru nema`);
      return formatCijene(cijene[Number(n)], jezik);
    });

  const OZNAKA = /<(\d+)\/>|<(\d+)>|<\/(\d+)>/g;
  const stog = [{ cvor: dokument.createDocumentFragment(), broj: null }];
  let zadnji = 0;
  let pogodak;

  const dodajTekst = (tekst) => {
    if (tekst) stog[stog.length - 1].cvor.appendChild(dokument.createTextNode(umetniCijene(tekst)));
  };

  while ((pogodak = OZNAKA.exec(prijevod))) {
    dodajTekst(prijevod.slice(zadnji, pogodak.index));
    zadnji = OZNAKA.lastIndex;

    const [, samostalna, otvara, zatvara] = pogodak;
    if (samostalna !== undefined) {
      const izvor = djeca[Number(samostalna)];
      if (!izvor) throw new Error(`oznaka <${samostalna}/> ne postoji u izvoru`);
      stog[stog.length - 1].cvor.appendChild(izvor.cloneNode(true));
    } else if (otvara !== undefined) {
      const izvor = djeca[Number(otvara)];
      if (!izvor) throw new Error(`oznaka <${otvara}> ne postoji u izvoru`);
      const kopija = izvor.cloneNode(false);
      stog[stog.length - 1].cvor.appendChild(kopija);
      stog.push({ cvor: kopija, broj: otvara });
    } else {
      if (stog[stog.length - 1].broj !== zatvara) throw new Error(`</${zatvara}> zatvara krivu oznaku`);
      stog.pop();
    }
  }
  dodajTekst(prijevod.slice(zadnji));
  if (stog.length !== 1) throw new Error("prijevod ima nezatvorenu oznaku");
  return stog[0].cvor;
}

/* ================================================================== */
/* Rjecnici                                                            */
/* ================================================================== */
async function ucitajRjecnik(jezik) {
  const put = path.join(RJECNICI, `${jezik}.json`);
  if (!existsSync(put)) return {};
  return JSON.parse(await readFile(put, "utf8"));
}

async function spremiRjecnik(jezik, rjecnik) {
  await mkdir(RJECNICI, { recursive: true });
  await writeFile(path.join(RJECNICI, `${jezik}.json`), `${JSON.stringify(rjecnik, null, 2)}\n`, "utf8");
}

/* ================================================================== */
/* Obrada jedne stranice                                               */
/* ================================================================== */
/**
 * Prolazi dokument i za svaki kljuc zove `prevedi(kljuc) -> prijevod|null`.
 * Isti prolaz sluzi i skupljanju kljuceva (prevedi vraca null) i pisanju.
 */
function obradiDokument(dokument, prevedi, jezik) {
  const zamijeniAtribute = (element) => {
    for (const ime of ATRIBUTI) {
      const vrijednost = element.getAttribute?.(ime);
      if (!vrijednost) continue;
      const cijene = [];
      const kljuc = vrijednost
        .replace(CIJENA, (zapis) => {
          cijene.push(uCente(zapis));
          return `{cijena${cijene.length - 1}}`;
        })
        .replace(BJELINA, " ")
        .trim();
      if (!prevodivo(kljuc)) continue;
      const prijevod = prevedi(kljuc);
      if (prijevod != null) {
        element.setAttribute(ime, prijevod.replace(/\{cijena(\d+)\}/g, (_, n) => formatCijene(cijene[Number(n)], jezik)));
      }
    }
  };

  const obidji = (element) => {
    if (PRESKOCI_ELEMENTE.has(element.localName)) return;
    if (element.getAttribute?.("translate") === "no") return;
    // Jezicna traka: "hr", "de", "en" su oznake, ne rijeci.
    if (element.classList?.contains("jezici")) return;

    zamijeniAtribute(element);

    const imaIzravanTekst = [...element.childNodes].some((c) => c.nodeType === 3 && /\S/.test(c.textContent));
    if (imaIzravanTekst && element.localName !== "html" && element.localName !== "body") {
      const { kljuc, djeca, cijene } = kljucElementa(element);
      if (prevodivo(kljuc)) {
        const prijevod = prevedi(kljuc);
        if (prijevod != null) {
          const novo = izgradi(prijevod, djeca, cijene, dokument, jezik);
          element.replaceChildren(novo);
        }
      }
      // Atributi unutarnjih elemenata (aria-label na poveznici u recenici).
      for (const unutra of element.querySelectorAll("*")) zamijeniAtribute(unutra);
      return;
    }

    for (const dijete of [...element.children]) obidji(dijete);
  };

  obidji(dokument.documentElement);

  const opis = dokument.querySelector('meta[name="description"]');
  if (opis) {
    const cijene = [];
    const kljuc = opis
      .getAttribute("content")
      .replace(CIJENA, (zapis) => {
        cijene.push(uCente(zapis));
        return `{cijena${cijene.length - 1}}`;
      })
      .replace(BJELINA, " ")
      .trim();
    const prijevod = prevodivo(kljuc) ? prevedi(kljuc) : null;
    if (prijevod != null) {
      opis.setAttribute("content", prijevod.replace(/\{cijena(\d+)\}/g, (_, n) => formatCijene(cijene[Number(n)], jezik)));
    }
  }
}

/** Poveznice, putanje, jezik dokumenta, kanonska adresa, jezicna traka. */
function prilagodiAdrese(dokument, jezik) {
  dokument.documentElement.setAttribute("lang", jezik);

  const DATOTEKA = /^(assets|css|js)\//;
  const apsolutno = (vrijednost) => (DATOTEKA.test(vrijednost) ? `/${vrijednost}` : vrijednost);

  for (const element of dokument.querySelectorAll("[href], [src], [poster], [srcset], [action]")) {
    for (const ime of ["href", "src", "poster", "action"]) {
      const vrijednost = element.getAttribute(ime);
      if (vrijednost == null) continue;
      if (ime === "href" && element.localName === "link" && element.getAttribute("rel") === "alternate") continue;
      if (ime === "href" && element.localName === "link" && element.getAttribute("rel") === "canonical") {
        element.setAttribute("href", vrijednost.replace(/^https:\/\/hes\.hr\//, `https://hes.hr/${jezik}/`));
        continue;
      }
      let nova = apsolutno(vrijednost);
      // Stranice dobivaju prefiks jezika; datoteke, sidra, mailto i tel ne.
      if (ime === "href" && element.localName === "a") nova = putanja(nova, jezik);
      if (nova !== vrijednost) element.setAttribute(ime, nova);
    }
    const skup = element.getAttribute("srcset");
    if (skup) {
      element.setAttribute(
        "srcset",
        skup
          .split(",")
          .map((dio) => dio.trim().replace(/^(\S+)/, (put) => apsolutno(put)))
          .join(", ")
      );
    }
  }

  for (const traka of dokument.querySelectorAll(".jezici")) {
    for (const veza of traka.querySelectorAll("a[hreflang]")) {
      // Poveznice u traci su vec apsolutne za svaki jezik — ne diraju se,
      // samo se premjesta oznaka trenutnog.
      if (veza.getAttribute("hreflang") === jezik) veza.setAttribute("aria-current", "true");
      else veza.removeAttribute("aria-current");
    }
  }

  // Komentari su biljeske za razvoj, na hrvatskom. Na prevedenu stranicu ne idu.
  const setac = dokument.createTreeWalker(dokument.documentElement, 128 /* NodeFilter.SHOW_COMMENT */);
  const komentari = [];
  while (setac.nextNode()) komentari.push(setac.currentNode);
  for (const komentar of komentari) komentar.remove();
}

/* ================================================================== */
/* Pokretanje                                                          */
/* ================================================================== */
async function izvori() {
  const popis = [];
  for (const ime of RUCNE) if (existsSync(path.join(KORIJEN, ime))) popis.push(ime);
  for (const mapa of GENERIRANE_MAPE) {
    const put = path.join(KORIJEN, mapa);
    if (!existsSync(put)) continue;
    for (const ime of (await readdir(put)).sort()) if (ime.endsWith(".html")) popis.push(`${mapa}/${ime}`);
  }
  return popis;
}

async function glavni() {
  const stranice = await izvori();
  const html = new Map();
  for (const ime of stranice) html.set(ime, await readFile(path.join(KORIJEN, ime), "utf8"));

  // 1. Skupi sve kljuceve, redom pojavljivanja.
  const kljucevi = new Map(); // kljuc -> prva stranica
  for (const [ime, sadrzaj] of html) {
    const { document } = parseHTML(sadrzaj);
    obradiDokument(
      document,
      (kljuc) => {
        if (!kljucevi.has(kljuc)) kljucevi.set(kljuc, ime);
        return null;
      },
      "hr"
    );
  }

  const rjecnici = Object.fromEntries(await Promise.all(JEZICI.map(async (j) => [j, await ucitajRjecnik(j)])));

  // 2. Rjecnici: sto nedostaje, sto je visak.
  let nedostajeUkupno = 0;
  for (const jezik of JEZICI) {
    const rjecnik = rjecnici[jezik];
    const nedostaje = [...kljucevi.keys()].filter((k) => rjecnik[k] == null);
    const visak = Object.keys(rjecnik).filter((k) => !kljucevi.has(k));
    nedostajeUkupno += nedostaje.length;

    console.log(
      `${jezik}: ${kljucevi.size - nedostaje.length}/${kljucevi.size} prevedeno` +
        (nedostaje.length ? `, ${BOJA.zuto}${nedostaje.length} nedostaje${BOJA.kraj}` : "") +
        (visak.length ? `, ${BOJA.sivo}${visak.length} visak${BOJA.kraj}` : "")
    );

    if (IZVUCI) {
      const novi = {};
      for (const [k, v] of Object.entries(rjecnik)) if (!POCISTI || kljucevi.has(k)) novi[k] = v;
      for (const k of nedostaje) if (!(k in novi)) novi[k] = null;
      await spremiRjecnik(jezik, novi);
    }
  }

  if (PREGLED) {
    const celija = (s) => String(s ?? "—").replace(/\|/g, "\\|").replace(/\n/g, " ");
    const redovi = [
      "# Pregled prijevoda",
      "",
      "Generirano: `node scripts/jezici.mjs --pregled`. Ne uređivati ovdje — ispravci idu u `data/i18n/de.json` i `en.json`.",
      "",
      "Oznake `<0>…</0>` i `<0/>` su poveznice, naglasci i ikone iz izvora; `{cijena0}` je iznos koji skripta upisuje sama.",
      "",
      "| Stranica | HR | DE | EN |",
      "| --- | --- | --- | --- |",
      ...[...kljucevi].map(
        ([k, ime]) => `| ${celija(ime)} | ${celija(k)} | ${celija(rjecnici.de[k])} | ${celija(rjecnici.en[k])} |`
      ),
      "",
    ];
    await writeFile(path.join(RJECNICI, "PREGLED.md"), redovi.join("\n"), "utf8");
    console.log(`${BOJA.sivo}-> data/i18n/PREGLED.md${BOJA.kraj}`);
  }

  if (PROVJERA || IZVUCI || PREGLED) {
    if (PROVJERA && nedostajeUkupno) process.exitCode = 1;
    return;
  }

  if (nedostajeUkupno && !DJELOMICNO) {
    console.error(
      `${BOJA.crveno}✗${BOJA.kraj} prijevoda nedostaje — nista nije napisano. ` +
        "Dopunite data/i18n/*.json (--izvuci dodaje prazna mjesta) ili pokrenite s --djelomicno."
    );
    process.exitCode = 1;
    return;
  }

  // 3. Pisi.
  const greske = [];
  for (const jezik of JEZICI) {
    const rjecnik = rjecnici[jezik];
    const napisane = new Set();

    for (const [ime, sadrzaj] of html) {
      const { document } = parseHTML(sadrzaj);
      try {
        obradiDokument(document, (kljuc) => rjecnik[kljuc] ?? null, jezik);
      } catch (greska) {
        greske.push(`${jezik}/${ime}: ${greska.message}`);
        continue;
      }
      prilagodiAdrese(document, jezik);

      const izlaz = path.join(KORIJEN, jezik, ime);
      await mkdir(path.dirname(izlaz), { recursive: true });
      await writeFile(izlaz, `${document.toString()}\n`, "utf8");
      napisane.add(ime.replaceAll("\\", "/"));
    }

    // Visak: prijevod stranice koje vise nema u izvoru.
    for (const mapa of ["", ...GENERIRANE_MAPE]) {
      const put = path.join(KORIJEN, jezik, mapa);
      if (!existsSync(put)) continue;
      for (const d of await readdir(put)) {
        const ime = mapa ? `${mapa}/${d}` : d;
        if (d.endsWith(".html") && !napisane.has(ime)) {
          await unlink(path.join(put, d));
          console.log(`${BOJA.zuto}−${BOJA.kraj} ${jezik}/${ime}  ${BOJA.sivo}visak, obrisano${BOJA.kraj}`);
        }
      }
    }

    console.log(`${BOJA.zeleno}✓${BOJA.kraj} ${jezik}/: ${napisane.size} stranica`);
  }

  if (greske.length) {
    for (const g of greske) console.error(`${BOJA.crveno}✗${BOJA.kraj} ${g}`);
    process.exitCode = 1;
  }
}

glavni().catch((greska) => {
  console.error(greska);
  process.exitCode = 1;
});
