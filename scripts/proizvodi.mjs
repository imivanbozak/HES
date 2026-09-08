/**
 * proizvodi.mjs — priprema medija za kartice kataloga.
 *
 * Pokretanje:  node scripts/proizvodi.mjs
 *              node scripts/proizvodi.mjs --force   (ponovno gradi i postojece)
 *
 * Ulazi su tri:
 *
 *   assets/Loxone/<Ime proizvoda>/*.jpg   klijentove mape takve kakve jesu:
 *                                         59 mapa, 1-5 fotografija po proizvodu,
 *                                         sve na bijeloj pozadini, sve 3:2
 *   assets/old-products/*.webm            44 videa, sva 1200x800, isti omjer
 *   assets/loxone-trgovina/<id>/*         290 fotografija skinutih sa
 *                                         shop.loxone.com; odakle je dosla koja
 *                                         pise u data/loxone-trgovina.json
 *
 * Izlaz je assets/proizvodi/ (avif + webp u dvije sirine) i assets/mediji.json
 * (manifest koji js/katalog.js pripaja artiklima).
 *
 * Zasto se ne referenciraju originali izravno: imena mapa imaju razmake,
 * tipfelere ("AO Extenssion", "Surface Bo for 10") i nedosljedna velika slova.
 * Netlify razlikuje velika i mala slova, pa bi jedna kriva slova bila tiho
 * slomljena slika na produkciji koju lokalni Windows ne bi pokazao.
 *
 * Videi se NE re-enkodiraju: vec su webm u pravom omjeru i pravoj velicini,
 * 300-600 kB. U manifest ide putanja do originala.
 */

import { mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const KORIJEN = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const IZVOR_SLIKA = path.join(KORIJEN, "assets", "Loxone");
const IZVOR_VIDEA = path.join(KORIJEN, "assets", "old-products");
const IZVOR_TRGOVINE = path.join(KORIJEN, "assets", "loxone-trgovina");
const IZLAZ = path.join(KORIJEN, "assets", "proizvodi");
const MANIFEST = path.join(KORIJEN, "assets", "mediji.json");
const PRISILNO = process.argv.includes("--force");

/*
 * Kartica na najsirem rasporedu stoji na oko 280 px, na mobitelu na punoj
 * sirini stupca. Dvije sirine pokrivaju oboje s rezervom za dvostruku gustocu;
 * treca ne bi nista dodala jer je izvor ionako najvise 903 px.
 */
const SIRINE = [480, 720];
const KVALITETA = { avif: 58, webp: 78 };

/*
 * Koliko se dva otiska smiju razlikovati da se jos racunaju kao ISTA
 * fotografija (od 256 bita, vidi `otisak`).
 *
 * 77 % klijentovih fotografija su iste snimke koje stoje i u Loxoneovoj
 * trgovini, samo drugdje izrezane i ponovno spremljene, pa bi ih galerija bez
 * ovoga pokazivala dvaput zaredom.
 *
 * 10 je izmjereno, ne pogodeno: do 10 su svi parovi ista snimka u drugom
 * rezu (isti kadar, ista poza, druga velicina), a od 11 nadalje pocinju
 * stvarno druge fotografije — druga strana Tree Extensiona, drugi kadar
 * zvucnika. Vise od 10 bi tiho pojelo prave fotografije, manje bi propustilo
 * dvojnike.
 */
const PRAG_ISTE_SLIKE = 10;

/* ================================================================== */
/* Mapiranje                                                           */
/* ================================================================== */
/**
 * Artikl -> mapa sa slikama -> video.
 *
 * Tablica je RUCNA i to je jedina ispravna odluka ovdje. Tri imenovanja se ne
 * poklapaju ni u jednom znaku:
 *
 *   id      1451                        WooCommerce ID iz context.md
 *   mapa    "Relay extension"           kako je klijent nazvao mapu
 *   video   "...-100038-relay-..."      Loxone kataloski broj artikla
 *
 * Nijedan par nema zajednicki kljuc, pa bi automatsko poklapanje po imenu bilo
 * pogadanje koje tiho promasi — a promasaj znaci krivu sliku uz cijenu.
 *
 * `video: null` znaci da proizvod nema video i kartica ce koristiti drugu
 * fotografiju na hover.
 *
 * `slika: "putanja"` zamjenjuje prvu fotografiju datotekom IZVAN mape
 * proizvoda, putanjom relativnom na `assets/`. Klijent naknadno salje bolje
 * snimke pojedinih artikala i spusta ih u `old-products/` umjesto u mapu
 * proizvoda; ovo polje ih uvodi bez premjestanja datoteka, pa se sljedeca
 * posiljka ne mora pogadati gdje je sto zavrsilo. Stara fotografija iz mape
 * tada pada na drugo mjesto i sluzi kao kadar na hover.
 *
 * `pocetna: N` bira KOJU fotografiju iz mape uzeti kao prvu (1-bazirano).
 * Mape su poredane abecedno po imenu datoteke, sto kod vecine proizvoda daje
 * pravu sliku, ali ne kod svih: kod Tree Cablea je prva krupni plan zica na
 * sivoj pozadini umjesto kutije od 200 m koja se zapravo prodaje, a kod Touch
 * Pure for Nano je prva losiji kadar od druge. Bez ovog polja bi se to
 * ispravljalo preimenovanjem klijentovih datoteka, sto bi se izgubilo cim
 * posalje novu mapu.
 *
 * `trgovina` odreduje sto se radi s fotografijama iz assets/loxone-trgovina/:
 *
 *   izostavljeno   Klijentove fotografije ostaju kakve jesu i drze svoja
 *                  mjesta, a iza njih se nadovezuju one iz trgovine kojih
 *                  medu njima jos nema. Kartica se time ne mice — prva i
 *                  druga slika su i dalje one koje su i dosad bile.
 *
 *   "samo"         Klijentova se mapa preskace, galerija je iskljucivo iz
 *                  trgovine. Stoji na 14 artikala kod kojih klijentove
 *                  fotografije pokazuju DRUGU IZVEDBU od one koju stranica
 *                  prodaje. Loxone svaku boju vodi pod svojim kataloskim
 *                  brojem, a naziv, cijena, dostupnost i tehnicki podaci u
 *                  LOXONE-PROIZVODI.md prepisani su s tocno jedne od tih
 *                  stranica — pa fotografija druge izvedbe uz njih nije
 *                  ukras nego kriv podatak o tome sto kupac dobiva.
 *
 *                  Dvanaest ih stranica prodaje u bijelom, a klijent je
 *                  poslao antracit (npr. 100264 Room Comfort Sensor Air
 *                  White uz crne fotografije). Kod dva je obrnuto: Remote Air
 *                  (100140) i Surface Box za 10'' (610159) JESU antracit, a
 *                  medu klijentovim fotografijama je i bijela izvedba — kod
 *                  Surface Boxa cak kao slika kartice. Pravilo je isto,
 *                  vrijedi ono sto stranica prodaje.
 *
 *                  Koja je izvedba prava provjerava se na stranici artikla u
 *                  trgovini, ne na fotografiji: mapa u data/loxone-trgovina.json
 *                  nosi kataloski broj s kojim su prepisani i cijena i podaci.
 *
 *                  Uz "samo" nema smisla ni `pocetna` ni `slika` — oba
 *                  pokazuju na klijentovu mapu koja se ovdje ne cita — pa ih
 *                  provjera potpunosti odbija.
 */
const MAPA = [
  /* --- miniserveri -------------------------------------------------- */
  { id: "1433", mapa: "Miniserver", video: "Miniserver.webm" },
  { id: "1438", mapa: "Miniserver compact", video: "vi-miniserver-compact-overview-100512-01.webm" },
  { id: "1441", mapa: "Miniserver Go", video: null },

  /* --- prosirenja --------------------------------------------------- */
  { id: "1444", mapa: "Tree extension", video: "vi-overview-100218-tree-extension.webm" },
  { id: "1447", mapa: "Air Base", video: "vi-overview-100114-air-base-extension.webm" },
  { id: "1451", mapa: "Relay extension", video: "vi-overview-100038-relay-extension.webm" },
  { id: "1455", mapa: "Dimmer Extension", video: "vi-overview-100029-dimmer-extension.webm" },
  { id: "1459", mapa: "DI Extension", video: "vi-overview-100283-di-extension.webm" },
  { id: "1463", mapa: "1Wire Extension", video: null,
    slika: "old-products/ph-shop-100014-one-wire-extension-01.jpg" },
  { id: "1467", mapa: "Modbus Extension", video: "vi-overview-100124-modbus-extension.webm" },
  // Dali 64 je osnovni artikl (100200) i njegov je video; Dali 10 ga nema.
  { id: "1470", mapa: "Dali Extension", video: "vi-overview-100200-dali-extension.webm" },
  { id: "1474", mapa: "Dali Extension 10", video: null },
  { id: "1478", mapa: "AI Extension", video: "vi-overview-100471-ai-extension.webm" },
  { id: "1482", mapa: "AO Extenssion", video: "vi-overview-100382-ao-extension.webm" },
  { id: "1487", mapa: "KXN Extension", video: "vi-overview-100322-knx-extension.webm" },
  { id: "1512", mapa: "RS485 Extension", video: "vi-overview-100011-rs-485-extension.webm" },

  /* --- osvjetljenje -------------------------------------------------- */
  { id: "1491", mapa: "LED Spot RGBW Tree", video: "vi-overview-100330-led-spot-rgbw-tree-white.webm",
    trgovina: "samo" },
  { id: "1497", mapa: "Led Ceiling Light", video: "vi-overview-100286-ceiling-light-air-white.webm",
    trgovina: "samo" },
  { id: "1502", mapa: "LED Strip RGBW", video: null },
  { id: "1505", mapa: "Table Lamp", video: null, trgovina: "samo" },
  { id: "1508", mapa: "Led Pendulum RGBW", video: null },

  /* --- upravljanje osvjetljenjem ------------------------------------- */
  { id: "1684", mapa: "RBGW Dimmer Tree 24V", video: null },
  { id: "1689", mapa: "RBGW Dimmer Air 24V", video: null },
  { id: "1693", mapa: "Nano Dimmer Air", video: null },
  { id: "1697", mapa: "Nano IO Air", video: null,
    slika: "old-products/PH-Shop-100153-Nano-IO-Air.bf944ac6.jpg" },

  /* --- doticajni uredaji i tipkala ----------------------------------- */
  { id: "1700", mapa: "TouchPureTree", video: "Touch_Pure_CO2_Icons_SignalWhite_Overview.webm" },
  { id: "1702", mapa: "Touch Pure Air", video: null, trgovina: "samo" },
  { id: "1706", mapa: "TouchPureNano", video: null, trgovina: "samo" },
  { id: "1709", mapa: "Touch Pure Flex", video: null, trgovina: "samo" },
  { id: "1712", mapa: "Touch Tree", video: "vi-overview-100221-touch-tree-white.webm" },
  // Datoteka nosi broj 100221 (Touch Tree), ali Touch Air i Touch Tree su
  // fizicki isto tipkalo — razlikuje ih sabirnica, ne kuciste, pa Loxone za
  // oboje koristi istu fotografiju. Dodijeljeno Touch Airu na izricitu uputu;
  // Touch Tree ionako ima video i mirnu sliku ne treba.
  { id: "1715", mapa: "Touch Air", video: null,
    slika: "old-products/PH-Shop-100221-Touch-Weiß.2537ab89.jpg" },
  { id: "1718", mapa: "NFC Code Touch Tree", video: "vi-overview-100483-nfc-code-touch-white.webm",
    trgovina: "samo" },
  { id: "1722", mapa: "NFC Code Touch Air", video: "NFC_Code_Touch_SignalWhite_Overview.webm" },
  { id: "1726", mapa: "Remote Air", video: null, trgovina: "samo" },

  /* --- senzori -------------------------------------------------------- */
  // Dvije mape su se preklapale po imenu; razrijeseno gledanjem fotografija:
  //   "Presence Tree Sensor"  plosnati disk, segmentirana leca  -> Presence Sensor Tree
  //   "SensorPresenceTree"    kupolasta PIR leca                -> Motion Sensor Tree
  { id: "1729", mapa: "SensorPresenceTree", video: "vi-overview-100466-flushmounted-presence-sensor-tree-white.webm",
    trgovina: "samo" },
  { id: "1733", mapa: "Presence Tree Sensor", video: "vi-overview-100422-presence-sensor-tree-white.webm",
    trgovina: "samo" },
  { id: "1737", mapa: "Sensor presence Air", video: "vi-overview-100420-presence-sensor-air-white.webm",
    trgovina: "samo" },
  // Zamjenska fotografija je bila jedina bijela u nizu crnih; sad je cijela
  // galerija bijela i dolazi iz trgovine, pa vise nema sto zamjenjivati.
  { id: "1740", mapa: "ComfortSensorTree1", video: null, trgovina: "samo" },
  // Zamjenska je nosila 100265 — to je ANTRACIT izvedba, a stranica opisuje
  // bijelu (100264). Zato ide van zajedno s ostalim crnim fotografijama.
  { id: "1743", mapa: "Comfort Sensor Air", video: null, trgovina: "samo" },
  { id: "1746", mapa: "IR Control Air", video: null },

  /* --- aktuatori i pogoni --------------------------------------------- */
  { id: "1755", mapa: "Valve aActuator Tree", video: "vi-overview-100602-valve-actuator.webm" },
  { id: "1759", mapa: "Valve Actuator Air", video: "vi-overview-100603-valve-actuator.webm" },
  { id: "1762", mapa: "Shading Actuator Air", video: null },

  /* --- audio ----------------------------------------------------------- */
  { id: "1767", mapa: "Audio Server", video: "vi-overview-100428-audioserver.webm" },
  { id: "1770", mapa: "Stereo Extension", video: "vi-overview-100429-stereo-extension.webm" },
  { id: "1773", mapa: "Surface Box for 7", video: null },
  { id: "1776", mapa: "Surface Bo for 10", video: null, trgovina: "samo" },
  { id: "1516", mapa: "Install Speaker Passive", video: "vi-overview-100497-install-speaker-7-passive.webm" },
  { id: "1520", mapa: "Install Speaker Master", video: "vi-overview-610149-install-speaker-7-master.webm" },

  /* --- pametne uticnice ------------------------------------------------ */
  { id: "1779", mapa: "Smart Socket Air F", video: null,
    slika: "old-products/(c)Loxone_Smart-Socket-Air_09.jpg" },
  { id: "1782", mapa: "Smart Socket Air J", video: null },
  { id: "1786", mapa: "Smart Socket Air G", video: null },

  /* --- kabeli i konektori ---------------------------------------------- */
  // Prva je krupni plan zica na sivoj pozadini; druga je kutija od 200 m,
  // sto je artikl koji se stvarno prodaje.
  { id: "1790", mapa: "Tree Cable 200", video: null, pocetna: 2 },
  { id: "1794", mapa: "Clamp Tree 25", video: null },
  { id: "1797", mapa: "Turbo Clamp 25", video: null },
  { id: "1800", mapa: "Clamp Tree for NFC Flex Intercom 25", video: null },

  /* --- dodatni materijali ---------------------------------------------- */
  { id: "1802", mapa: "Encypted NFC Smart Cards Set", video: null },
  { id: "1805", mapa: "NFC Key Fob Set", video: null },
  { id: "1808", mapa: "SD kartica s firmwareom za miniserver", video: null },
];

/**
 * Mape u assets/Loxone/ koje NISU proizvod.
 *
 * "Videos" je duplikat jednog videa koji vec stoji u old-products; "New folder"
 * je prazan. Bez ovog popisa bi provjera potpunosti javila dva laznja.
 */
const NIJE_PROIZVOD = new Set(["Videos", "New folder"]);

/* ================================================================== */
/* Pomocno                                                             */
/* ================================================================== */
const BOJA = { zeleno: "\x1b[32m", crveno: "\x1b[31m", zuto: "\x1b[33m", sivo: "\x1b[90m", kraj: "\x1b[0m" };

const kb = (bajtova) => (bajtova / 1024).toFixed(0) + " kB";

/** Fotografije jedne mape, poredane po imenu — redoslijed mora biti stabilan. */
async function fotografije(mapa) {
  const datoteke = await readdir(path.join(IZVOR_SLIKA, mapa));
  return datoteke
    .filter((d) => /\.jpe?g$/i.test(d))
    .sort((a, b) => a.localeCompare(b, "en"));
}

/**
 * Fotografije jednog artikla iz Loxoneove trgovine, redom kojim stoje na
 * njegovoj stranici u trgovini.
 *
 * Imena pocinju dvoznamenkastim brojem (`01-`, `02-`) upravo zato da ih obicno
 * sortiranje vrati tim redom: prva je ona koju trgovina drzi kao glavnu.
 * Poredak po imenu datoteke bez toga bi galeriju poslozio po slucaju.
 */
async function fotografijeTrgovine(id) {
  const mapa = path.join(IZVOR_TRGOVINE, id);
  if (!existsSync(mapa)) return [];
  return (await readdir(mapa))
    .filter((d) => /\.(jpe?g|png)$/i.test(d))
    .sort((a, b) => a.localeCompare(b, "en"))
    .map((d) => path.join(mapa, d));
}

/**
 * Otisak fotografije: 16x16 sivih tocaka, bit po tocki prema prosjeku.
 *
 * Isti kadar ponovno spremljen u drugoj velicini i drugoj kvaliteti daje
 * gotovo isti otisak, a to je upravo slucaj koji treba prepoznati — klijent je
 * vecinu svojih fotografija uzeo s iste te stranice u trgovini. Usporedba po
 * velicini datoteke ili po imenu ne bi uhvatila nista: imena su preimenovana,
 * a velicine se razlikuju i po nekoliko puta.
 */
async function otisak(putanja) {
  const { data } = await sharp(putanja)
    .greyscale()
    .resize(16, 16, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const prosjek = data.reduce((zbroj, tocka) => zbroj + tocka, 0) / data.length;
  return Uint8Array.from(data, (tocka) => (tocka > prosjek ? 1 : 0));
}

/** Na koliko se od 256 mjesta dva otiska razilaze. */
function razmak(a, b) {
  let n = 0;
  for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) n += 1;
  return n;
}

/**
 * Kratko ime izvora jednog kadra, onako kako stoji u manifestu.
 *
 * Zasto uopce: izlazne datoteke se zovu po REDNOM BROJU (`1743-2.webp`), a ne
 * po izvoru, i preskacu se ako vec postoje. Cim se u tablici promijeni
 * `pocetna`, `slika` ili `trgovina`, isti redni broj pokazuje na drugu
 * fotografiju — a stara datoteka ostaje i stranica tiho nastavi prikazivati
 * prethodnu sliku. To se i dogodilo pri uvodenju fotografija iz trgovine —
 * artikli kojima se popis pomaknuo dobili su galeriju iz starih datoteka.
 *
 * Manifest zato nosi popis izvora po artiklu, a iduce pokretanje prisilno
 * gradi svaki artikl kojem se popis promijenio.
 */
function oznakaIzvora(izvor, zapis) {
  if (Buffer.isBuffer(izvor)) return `video:${zapis.video}`;
  return path.relative(path.join(KORIJEN, "assets"), izvor).split(path.sep).join("/");
}

/**
 * Jedna fotografija -> avif + webp u obje sirine.
 *
 * Vraca osnovu imena (`1451-1`) koju manifest nosi, ili null ako se nije imalo
 * sto napraviti. Sirine vece od izvora se preskacu: uzorkovanje prema gore
 * samo napuhne datoteku, isto pravilo kao u slike.mjs.
 */
/**
 * Prvi kadar videa, kao buffer u memoriji.
 *
 * Poster za video se NE uzima iz mape s fotografijama. Fotografija i video su
 * dva razlicita snimanja: druga izvedba proizvoda, drugi kut, druga boja
 * kucista. Kartica bi tako prije hovera pokazivala jedno, a na hover skocila
 * na drugo — sto je i prijavljeno kao greska na Miniserveru Compact, NFC Code
 * Touch Airu, RS485-u, Motion Sensoru Tree i Touch Treeju.
 *
 * Prvi kadar videa je isti taj proizvod, u istom kadru u kojem ce se i
 * pokrenuti, pa prijelaz na hover nema skoka. Kadrovi su provjereni: cist
 * proizvod na bijelom, isti 3:2 kao i sve ostalo.
 *
 * Ide preko cjevovoda umjesto preko privremene datoteke — nema sto ostati na
 * disku ako skripta pukne na pola.
 */
function kadarIzVidea(putanjaVidea) {
  return execFileSync(
    "ffmpeg",
    ["-v", "error", "-i", putanjaVidea, "-frames:v", "1", "-f", "image2pipe", "-vcodec", "png", "-"],
    { maxBuffer: 64 * 1024 * 1024 }
  );
}

// `izvor` je putanja do fotografije ILI buffer s kadrom izvucenim iz videa —
// sharp prima oboje, pa oba puta zavrsavaju u istom cjevovodu.
async function pretvori(izvor, osnova, prisilno = PRISILNO) {
  const meta = await sharp(izvor).metadata();
  let bajtovaUkupno = 0;
  let napravljeno = 0;

  /*
   * Koje sirine ova fotografija STVARNO dobiva.
   *
   * Izvori nisu jednaki: dio ih je 903 px, dio 600 px, jedan 814 px. Sharp
   * uz `withoutEnlargement` za 600 px izvor naprosto ne napravi varijantu od
   * 720 px, pa je popis koji se vrati jedini istinit zapis o tome sto postoji
   * na disku. Manifest ga nosi dalje, a `srcset` u kartici se gradi iz njega —
   * bez toga bi 46 kartica pokazivalo `-720.webp` kojeg nema.
   */
  const nastale = [];

  for (const sirina of SIRINE) {
    if (meta.width && sirina > meta.width && sirina !== SIRINE[0]) continue;
    // Ime datoteke nosi TRAZENU sirinu, pa je i popis mora nositi — inace bi
    // se manifest i disk razisli za jedan broj.
    nastale.push(sirina);

    for (const [format, kvaliteta] of Object.entries(KVALITETA)) {
      const izlaznaPutanja = path.join(IZLAZ, `${osnova}-${sirina}.${format}`);
      if (!prisilno && existsSync(izlaznaPutanja)) {
        bajtovaUkupno += (await stat(izlaznaPutanja)).size;
        continue;
      }

      const cjevovod = sharp(izvor).resize({
        width: sirina,
        withoutEnlargement: true,
      });

      const bajtovi = await (format === "avif"
        ? cjevovod.avif({ quality: kvaliteta, effort: 6 })
        : cjevovod.webp({ quality: kvaliteta, effort: 5 })
      ).toBuffer();

      await writeFile(izlaznaPutanja, bajtovi);
      bajtovaUkupno += bajtovi.length;
      napravljeno += 1;
    }
  }

  return { osnova, sirine: nastale, bajtovaUkupno, napravljeno, sirina: meta.width, visina: meta.height };
}

/* ================================================================== */
/* Provjera potpunosti                                                 */
/* ================================================================== */
/**
 * Sve tri strane moraju se poklopiti prije nego se dirne ijedna slika.
 *
 * Skripta koja tiho preskoci nepoznatu mapu je gora od skripte koja padne:
 * proizvod bi zavrsio na stranici bez slike, a to se primijeti tek kad netko
 * otvori bas tu karticu.
 */
async function provjeriPotpunost(katalog) {
  const greske = [];

  const naDisku = (await readdir(IZVOR_SLIKA, { withFileTypes: true }))
    .filter((u) => u.isDirectory() && !NIJE_PROIZVOD.has(u.name))
    .map((u) => u.name);

  const mapirane = new Set(MAPA.map((z) => z.mapa));

  for (const ime of naDisku) {
    if (!mapirane.has(ime)) greske.push(`mapa bez artikla u tablici: assets/Loxone/${ime}`);
  }

  const idevi = new Set(katalog.artikli.filter((a) => a.vrsta === "loxone").map((a) => String(a.id)));

  for (const zapis of MAPA) {
    if (!existsSync(path.join(IZVOR_SLIKA, zapis.mapa))) {
      greske.push(`tablica pokazuje na mapu koje nema: assets/Loxone/${zapis.mapa}`);
    }
    if (!idevi.has(zapis.id)) {
      greske.push(`tablica ima id kojeg nema u katalogu: ${zapis.id} (${zapis.mapa})`);
    }
    if (zapis.video && !existsSync(path.join(IZVOR_VIDEA, zapis.video))) {
      greske.push(`nema videa: assets/old-products/${zapis.video}`);
    }
    // Zamjenska fotografija: krivo prepisano ime (a imena nose i njemacke
    // umlaute i zagrade) inace prode tiho do sharpa.
    if (zapis.slika && !existsSync(path.join(KORIJEN, "assets", zapis.slika))) {
      greske.push(`nema zamjenske fotografije: assets/${zapis.slika}`);
    }
    if (zapis.slika && zapis.video) {
      greske.push(`${zapis.mapa}: 'slika' i 'video' se iskljucuju — poster videa dolazi iz videa`);
    }
    // Bez mape u trgovini bi artikl tiho ostao samo na klijentovim
    // fotografijama, a s "samo" bi ostao bez ijedne.
    const uTrgovini = (await fotografijeTrgovine(zapis.id)).length;
    if (!uTrgovini) {
      greske.push(`nema fotografija iz trgovine: assets/loxone-trgovina/${zapis.id}`);
    }
    if (zapis.trgovina !== undefined && zapis.trgovina !== "samo") {
      greske.push(`${zapis.mapa}: trgovina smije biti samo "samo" ili izostavljena`);
    }
    if (zapis.trgovina === "samo" && (zapis.slika || zapis.pocetna !== undefined)) {
      greske.push(
        `${zapis.mapa}: uz trgovina: "samo" nema ni 'slika' ni 'pocetna' — oboje pokazuje na klijentovu mapu koja se tada ne cita`
      );
    }
    // Indeks izvan raspona bi tiho dao `undefined` i pao tek u sharpu, uz
    // poruku koja ne kaze koji je proizvod kriv.
    if (zapis.pocetna !== undefined && existsSync(path.join(IZVOR_SLIKA, zapis.mapa))) {
      const koliko = (await fotografije(zapis.mapa)).length;
      if (!Number.isInteger(zapis.pocetna) || zapis.pocetna < 1 || zapis.pocetna > koliko) {
        greske.push(
          `pocetna: ${zapis.pocetna} izvan raspona za ${zapis.mapa} (ima ${koliko} fotografija)`
        );
      }
    }
  }

  try {
    execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
  } catch {
    greske.push("ffmpeg nije dostupan, a poster za 28 videa se izvlaci njime");
  }

  if (existsSync(IZVOR_TRGOVINE)) {
    const uTablici = new Set(MAPA.map((z) => z.id));
    for (const ime of await readdir(IZVOR_TRGOVINE)) {
      if (!uTablici.has(ime)) {
        greske.push(`mapa u trgovini bez artikla u tablici: assets/loxone-trgovina/${ime}`);
      }
    }
  } else {
    greske.push("nema mape assets/loxone-trgovina/ — vidi data/loxone-trgovina.json");
  }

  const pokriveni = new Set(MAPA.map((z) => z.id));
  for (const id of idevi) {
    if (!pokriveni.has(id)) {
      const artikl = katalog.artikli.find((a) => String(a.id) === id);
      greske.push(`artikl bez medija: ${id} — ${artikl.naziv}`);
    }
  }

  return greske;
}

/* ================================================================== */
/* Glavno                                                             */
/* ================================================================== */
async function glavno() {
  const katalog = JSON.parse(
    await (await import("node:fs/promises")).readFile(
      path.join(KORIJEN, "assets", "katalog.json"),
      "utf8"
    )
  );

  const greske = await provjeriPotpunost(katalog);
  if (greske.length) {
    console.error(`${BOJA.crveno}Mapiranje nije potpuno — nista nije generirano.${BOJA.kraj}\n`);
    for (const greska of greske) console.error("  " + greska);
    process.exit(1);
  }

  await mkdir(IZLAZ, { recursive: true });

  console.log("Priprema medija proizvoda" + (PRISILNO ? " (ponovno sve)" : ""));
  console.log("");

  /* Prijasnji manifest sluzi samo za jedno: prepoznati kojem se artiklu
     promijenio popis izvora, pa da mu se datoteke ponovno naprave. */
  let prijasnji = {};
  if (existsSync(MANIFEST)) {
    try {
      prijasnji = JSON.parse(await (await import("node:fs/promises")).readFile(MANIFEST, "utf8")).proizvodi ?? {};
    } catch {
      prijasnji = {};
    }
  }

  const manifest = {};
  let varijanti = 0;
  let bajtova = 0;
  let sVideom = 0;
  let sDrugomSlikom = 0;
  let sZamjenom = 0;
  let sSamoTrgovinom = 0;
  let izTrgovine = 0;
  let preskocenihDvojnika = 0;
  let prezidanih = 0;
  const omjeri = new Set();

  for (const zapis of MAPA) {
    const samoTrgovina = zapis.trgovina === "samo";
    const slike = samoTrgovina ? [] : await fotografije(zapis.mapa);
    if (!samoTrgovina && !slike.length) {
      console.error(`  ${BOJA.crveno}PAD${BOJA.kraj}  ${zapis.mapa} — mapa nema nijedan .jpg`);
      process.exit(1);
    }

    /*
     * Jedan uredeni popis izvora za sve slucajeve, pa se dalje sve vrti kroz
     * istu petlju.
     *
     *   s videom   [prvi kadar videa, ...klijentove, ...nove iz trgovine]
     *   bez videa  [zamjenska?, ...klijentove, ...nove iz trgovine]
     *   "samo"     [prvi kadar videa?, ...sve iz trgovine]
     *
     * Prvi element je uvijek slika kartice. Kod proizvoda s videom to je kadar
     * iz samog videa, pa hover nema skoka; ostalo stoji iza njega i sluzi
     * galeriji na stranici proizvoda.
     */
    // `pocetna` je 1-bazirana jer se cita uz imena datoteka (TreeCable2.jpg
    // je druga), pa bi nula ovdje bila zamka.
    const odabrana = (zapis.pocetna ?? 1) - 1;
    const redoslijed = slike.length
      ? [slike[odabrana], ...slike.filter((_, i) => i !== odabrana)]
      : [];
    const izvori = redoslijed.map((ime) => path.join(IZVOR_SLIKA, zapis.mapa, ime));

    if (zapis.video) {
      izvori.unshift(kadarIzVidea(path.join(IZVOR_VIDEA, zapis.video)));
      sVideom += 1;
    } else if (zapis.slika) {
      // Naknadno dostavljena fotografija ide na celo, a dosadasnja prva pada
      // na drugo mjesto i postaje kadar na hover — nijedna se ne gubi.
      izvori.unshift(path.join(KORIJEN, "assets", zapis.slika));
      sZamjenom += 1;
    }

    /*
     * Fotografije iz trgovine idu na kraj, pa kartica ostaje netaknuta:
     * mijenja se samo koliko ih galerija ima ispod prve dvije.
     *
     * Usporeduju se sa SVIME sto je vec u nizu, ukljucujuci kadar izvucen iz
     * videa — Loxone ista snimanja koristi i za video i za fotografije, pa se
     * dvojnik zna pojaviti i tim putem.
     */
    const doNjih = izvori.length;
    const otisciDosadasnjih = await Promise.all(izvori.map(otisak));

    for (const putanjaTrgovine of await fotografijeTrgovine(zapis.id)) {
      const nova = await otisak(putanjaTrgovine);
      if (otisciDosadasnjih.some((stara) => razmak(nova, stara) <= PRAG_ISTE_SLIKE)) {
        preskocenihDvojnika += 1;
      } else {
        izvori.push(putanjaTrgovine);
        // I medu samim fotografijama iz trgovine ima ponavljanja: ista snimka
        // zna stajati i u galeriji i nize u opisu iste stranice.
        otisciDosadasnjih.push(nova);
      }
    }
    izTrgovine += izvori.length - doNjih;
    if (samoTrgovina) sSamoTrgovinom += 1;

    const oznake = izvori.map((izvor) => oznakaIzvora(izvor, zapis));
    const promijenjen =
      JSON.stringify(prijasnji[zapis.id]?.izvori ?? null) !== JSON.stringify(oznake);
    if (promijenjen && prijasnji[zapis.id]) prezidanih += 1;

    const galerija = [];
    for (const [i, izvor] of izvori.entries()) {
      const kadar = await pretvori(izvor, `${zapis.id}-${i + 1}`, PRISILNO || promijenjen);
      varijanti += kadar.napravljeno;
      bajtova += kadar.bajtovaUkupno;
      omjeri.add((kadar.sirina / kadar.visina).toFixed(2));
      galerija.push({ id: kadar.osnova, sirine: kadar.sirine });
    }

    const unos = { slika: galerija[0], galerija, izvori: oznake };

    if (zapis.video) {
      unos.video = `assets/old-products/${zapis.video}`;
    } else if (galerija.length > 1) {
      // Druga slika sluzi hoveru na karticama bez videa. Kartica s videom je
      // ne treba — ondje pokret nosi sam video.
      unos.slika2 = galerija[1];
      sDrugomSlikom += 1;
    }

    manifest[zapis.id] = unos;
  }

  /*
   * Kad se galerija skrati (Touch Pure for Nano je s dvije fotografije pao na
   * jednu), datoteke s visim rednim brojem ostaju lezati u izlazu. Nitko ih
   * vise ne trazi, ali stoje u repozitoriju i citaju se kao da su zive.
   * Izlaznu mapu u cijelosti pravi ova skripta, pa je smije i pociscati.
   */
  const trazene = new Set();
  for (const unos of Object.values(manifest)) {
    for (const kadar of unos.galerija) {
      for (const sirina of kadar.sirine) {
        for (const format of Object.keys(KVALITETA)) trazene.add(`${kadar.id}-${sirina}.${format}`);
      }
    }
  }
  let pociscenih = 0;
  for (const ime of await readdir(IZLAZ)) {
    if (!trazene.has(ime)) {
      await rm(path.join(IZLAZ, ime));
      pociscenih += 1;
    }
  }

  await writeFile(
    MANIFEST,
    JSON.stringify(
      {
        generirano: "scripts/proizvodi.mjs",
        izvor: ["assets/Loxone", "assets/old-products", "assets/loxone-trgovina"],
        sirine: SIRINE,
        proizvodi: manifest,
      },
      null,
      1
    ) + "\n"
  );

  console.log(`  ${BOJA.zeleno}ok${BOJA.kraj}  ${MAPA.length} proizvoda mapirano, 0 nepoznatih mapa`);
  console.log(`      ${sVideom} s videom, ${sDrugomSlikom} s drugom slikom na hover`);
  console.log(`      ${sZamjenom} s naknadno dostavljenom fotografijom`);
  console.log(
    `      ${izTrgovine} novih fotografija iz trgovine, ${preskocenihDvojnika} preskoceno kao dvojnik`
  );
  console.log(
    `      ${sSamoTrgovinom} artikla ide iskljucivo iz trgovine (izvedba koju stranica prodaje)`
  );
  if (pociscenih) {
    console.log(`      ${pociscenih} datoteka izbrisano — galerija ih vise ne trazi`);
  }
  if (prezidanih) {
    console.log(`      ${prezidanih} artikla sa svjezim popisom izvora — njima su datoteke prezidane`);
  }
  console.log(`      ${varijanti} novih varijanti · ${kb(bajtova)} ukupno u assets/proizvodi/`);
  console.log(
    `      omjer izvora: ${[...omjeri].join(", ")}  ${BOJA.sivo}(1.50 = 3:2, isti kao videi)${BOJA.kraj}`
  );
  console.log("");
  console.log("-> assets/proizvodi/");
  console.log("-> assets/mediji.json");
}

glavno().catch((greska) => {
  console.error(greska);
  process.exit(1);
});
