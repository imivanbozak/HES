/**
 * pogledi.js — crtanje kataloga, filtera i kosarice.
 *
 * Funkcije vracaju NIZ ZNAKOVA, ne DOM cvorove, a akcije se vezu preko
 * `data-akcija` atributa koje hvata jedan delegirani slusac. Isti obrazac kao
 * u ../split: pri ovoj kolicini podataka razlikovno osvjezavanje ne bi
 * zaradilo svoju slozenost, a jedan slusac ne moze zaostati za sadrzajem
 * koji je nacrtan poslije njega.
 */

import { formatCijene } from "./katalog.js";
import { brojDana, iznosStavke } from "./kosarica.js";

/**
 * Putanja do medija, uvijek od korijena.
 *
 * Preglednik relativan `src` razrjesuje prema adresi DOKUMENTA, ne prema
 * adresi skripte. Iste ove kartice crtaju se i na /webshop (korijen) i na
 * /proizvodi/<ime> (mapa dublje), pa bi relativna putanja na stranici
 * proizvoda trazila /proizvodi/assets/... i vratila 404 — a 404 na slici je
 * prazan okvir bez ijedne poruke.
 *
 * Manifest assets/mediji.json nosi putanje videa bez vodece kose crte, pa
 * prolaze kroz istu funkciju.
 */
const medij = (put) => (put.startsWith("/") ? put : `/${put}`);

/** Sve sto dolazi iz baze ide kroz ovo prije nego dotakne innerHTML. */
export function esc(vrijednost) {
  return String(vrijednost ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const mnozinaArtikala = (broj) => {
  // Hrvatski ima tri oblika; Intl.PluralRules ih zna, ali za tri fiksna
  // niza je izravna tablica citljivija od jos jedne ovisnosti.
  const zadnja = broj % 10;
  const zadnje2 = broj % 100;
  if (zadnja === 1 && zadnje2 !== 11) return "artikl";
  if (zadnja >= 2 && zadnja <= 4 && (zadnje2 < 12 || zadnje2 > 14)) return "artikla";
  return "artikala";
};

export const sBrojem = (broj) => `${broj} ${mnozinaArtikala(broj)}`;

const mnozinaDana = (broj) => {
  const zadnja = broj % 10;
  const zadnje2 = broj % 100;
  if (zadnja === 1 && zadnje2 !== 11) return "dan";
  if (zadnja >= 2 && zadnja <= 4 && (zadnje2 < 12 || zadnje2 > 14)) return "dana";
  return "dana";
};

/* ================================================================== */
/* Rail s kategorijama                                                 */
/* ================================================================== */
/**
 * Ljepljivi rail na desktopu, sadrzaj donjeg lista na mobitelu — isti HTML.
 *
 * Podskupine se otvaraju KLIKOM, ne prijelazom misa. Otvaranje na hover je
 * neupotrebljivo na dodirniku, nevidljivo tipkovnici i nestabilno na
 * touchpadu; jedan klik radi svugdje.
 */
export function railHtml(katalog, filtri, vrsta) {
  const stanje = filtri.stanje;
  const obitelji = katalog.obitelji(vrsta);
  const marke = katalog.marke(vrsta);
  const ukupno = filtri.svi.length;

  const stavkaObitelji = (obitelj) => {
    const podskupine = katalog.podskupine(obitelj.id);
    const broj = filtri.brojZaKategoriju(obitelj.id);
    const odabrana = stanje.skupina === obitelj.id;
    const otvorena = odabrana && podskupine.length > 0;

    return `
      <li class="rail__stavka">
        <button class="rail__gumb${odabrana ? " je-odabran" : ""}"
                type="button"
                data-akcija="skupina"
                data-vrijednost="${esc(obitelj.id)}"
                aria-pressed="${odabrana}"
                ${podskupine.length ? `aria-expanded="${otvorena}"` : ""}>
          <span class="rail__ime">${esc(obitelj.naziv.hr)}</span>
          <span class="rail__broj monr">${broj}</span>
        </button>
        ${
          podskupine.length
            ? `<ul class="rail__pod"${otvorena ? "" : " hidden"}>
                ${podskupine
                  .map((pod) => {
                    const podBroj = filtri.brojZaKategoriju(pod.id);
                    const podOdabrana = stanje.podskupina === pod.id;
                    return `
                      <li>
                        <button class="rail__gumb rail__gumb--pod${podOdabrana ? " je-odabran" : ""}"
                                type="button"
                                data-akcija="podskupina"
                                data-vrijednost="${esc(pod.id)}"
                                aria-pressed="${podOdabrana}">
                          <span class="rail__ime">${esc(pod.naziv.hr)}</span>
                          <span class="rail__broj monr">${podBroj}</span>
                        </button>
                      </li>`;
                  })
                  .join("")}
              </ul>`
            : ""
        }
      </li>`;
  };

  return `
    <div class="rail__skupina">
      <p class="oznaka">Skupine</p>
      <ul class="rail__popis">
        <li class="rail__stavka">
          <button class="rail__gumb${!stanje.skupina ? " je-odabran" : ""}"
                  type="button" data-akcija="skupina" data-vrijednost=""
                  aria-pressed="${!stanje.skupina}">
            <span class="rail__ime">Sve</span>
            <span class="rail__broj monr">${ukupno}</span>
          </button>
        </li>
        ${obitelji.map(stavkaObitelji).join("")}
      </ul>
    </div>

    ${
      marke.length > 1
        ? `<div class="rail__skupina">
            <p class="oznaka">Marka</p>
            <ul class="rail__popis">
              ${marke
                .map(
                  (marka) => `
                <li>
                  <button class="rail__gumb${stanje.marka === marka ? " je-odabran" : ""}"
                          type="button" data-akcija="marka" data-vrijednost="${esc(marka)}"
                          aria-pressed="${stanje.marka === marka}">
                    <span class="rail__ime monr">${esc(marka)}</span>
                  </button>
                </li>`
                )
                .join("")}
            </ul>
          </div>`
        : ""
    }

    <div class="rail__skupina">
      <label class="rail__prekidac">
        <input type="checkbox" data-akcija="stanje" ${stanje.samoNaStanju ? "checked" : ""}>
        <span>Samo na stanju</span>
      </label>
    </div>

    <button class="gumb gumb--tihi rail__ocisti" type="button" data-akcija="ocisti"
            ${filtri.brojAktivnih() ? "" : "disabled"}>
      Očistite filtre
    </button>`;
}

/* ================================================================== */
/* Trake kataloga — ikone skupina i pilule podskupina                  */
/* ================================================================== */
/**
 * Ikone jedanaest Loxone skupina.
 *
 * Crtane u istom kljucu kao ikone u zaglavlju: 24x24, samo potez, bez ispune,
 * `stroke-width` 1.7. Zbog toga se citaju kao dio istog sustava a ne kao
 * skinuti set — a i jedina im je duznost razlikovati jedanaest redaka na prvi
 * pogled, ne prikazati proizvod.
 *
 * Kljucevi su `id` kategorije iz kataloga. Skupina koje ovdje nema dobiva
 * `zadana` — nista se ne lomi ako se stablo prosiri prije nego se nacrta ikona.
 */
const IKONE = {
  // Kutija na DIN letvi s tri prikljucka — jedinica koja upravlja svime.
  miniserveri: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 6v12M3 10h4M17 10h4M17 14h4"/>',
  // Modul koji se dodaje uz miniserver: ista kutija plus znak vise.
  prosirenja: '<rect x="3" y="7" width="12" height="10" rx="2"/><path d="M18 9v6M15 12h6"/>',
  // Prst na plohi tipkala.
  "doticajni-uredaji-i-tipkala": '<rect x="4" y="3" width="16" height="18" rx="3"/><circle cx="12" cy="9" r="1.6"/><path d="M12 13v5"/>',
  // Val koji senzor hvata.
  senzori: '<circle cx="12" cy="12" r="2"/><path d="M7.5 7.5a6.4 6.4 0 0 0 0 9M16.5 7.5a6.4 6.4 0 0 1 0 9M4.5 4.5a10.6 10.6 0 0 0 0 15M19.5 4.5a10.6 10.6 0 0 1 0 15"/>',
  // Zarulja.
  osvjetljenje: '<path d="M9 17h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9V17h7v-3.1A6 6 0 0 0 12 3z"/>',
  // Klizac prigusivaca.
  "upravljanje-osvjetljenjem": '<path d="M4 8h10M18 8h2M4 16h4M12 16h8"/><circle cx="16" cy="8" r="2"/><circle cx="10" cy="16" r="2"/>',
  // Zvucnik.
  "audio-sustavi": '<path d="M5 9h3l4.5-3.5v13L8 15H5z"/><path d="M16 9.5a3.5 3.5 0 0 1 0 5M18.5 7a7 7 0 0 1 0 10"/>',
  // Motor s osovinom — pogon rolete ili ventila.
  "aktuatori-i-pogoni": '<rect x="3" y="8" width="11" height="8" rx="2"/><path d="M14 12h4M18 9v6M20.5 10.5v3"/>',
  // Uticnica.
  "pametne-uticnice": '<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="9" cy="11" r="1.2"/><circle cx="15" cy="11" r="1.2"/><path d="M8 16h8"/>',
  // Kabel s konektorom.
  "kabeli-i-konektori": '<path d="M4 16c4 0 4-8 8-8s4 8 8 8"/><rect x="2" y="14" width="4" height="4" rx="1"/><rect x="18" y="14" width="4" height="4" rx="1"/>',
  // Kutija sitnog materijala.
  "dodatni-materijali": '<path d="M3 8l9-4 9 4v8l-9 4-9-4z"/><path d="M3 8l9 4 9-4M12 12v8"/>',

  /* --- najam alata -------------------------------------------------- */
  // Iste ikone kakve nose kartice kategorija na naslovnici (index.html,
  // `.alat__ikona`), da se ista cetiri pojma prepoznaju na obje stranice.
  // Ljestve.
  "ljestve-i-skele": '<path d="M7 3v18M17 3v18M7 7h10M7 12h10M7 17h10"/>',
  // Brusni disk.
  "rezanje-i-brusenje": '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 5V3M12 21v-2M5 12H3M21 12h-2"/>',
  // Busilica.
  "busenje-i-odvijanje": '<path d="M4 7h9v6H4z"/><path d="M13 9h4l3 3-3 3h-4"/><path d="M6 13v7"/>',
  // Usisavac s crijevom.
  "usisavaci-i-otprasivanje": '<path d="M5 20v-6a6 6 0 0 1 12 0v2"/><path d="M17 16h3v4h-5"/><circle cx="8" cy="20" r="1.6"/>',

  zadana: '<circle cx="12" cy="12" r="8"/>',
};

const ikonaHtml = (id) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
        stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IKONE[id] ?? IKONE.zadana}</svg>`;

/**
 * Vodoravni red skupina s ikonama — prva razina navigacije kataloga.
 *
 * Zamjenjuje ljepljivi rail sa strane. Rail je bio okomit popis imena; ovdje
 * jedanaest skupina stane u jedan red iznad mreze, pa se cijela sirina stupca
 * moze dati proizvodima. Na uskom ekranu red klizi vodoravno umjesto da se
 * lomi u cetiri reda ikona.
 */
export function trakaKategorijaHtml(katalog, filtri, vrsta) {
  const stanje = filtri.stanje;
  const obitelji = katalog.obitelji(vrsta);

  const stavka = (id, ime, broj, odabrana) => `
    <li>
      <button class="kat${odabrana ? " je-odabran" : ""}"
              type="button" data-akcija="skupina" data-vrijednost="${esc(id)}"
              aria-pressed="${odabrana}">
        <span class="kat__ikona">${ikonaHtml(id || "zadana")}</span>
        <span class="kat__ime">${esc(ime)}</span>
        <span class="kat__broj monr">${broj}</span>
      </button>
    </li>`;

  /*
   * "Sve" postoji samo u cjeniku najma. Webshop stoji na TOCNO jednoj od
   * jedanaest skupina (js/trgovina.js zakvaci prvu pri dolasku), pa bi
   * dvanaesta kartica koja iskljucuje sve ostale ondje bila stanje kojeg
   * traka inace nikad nema. Najam ju zadrzava jer njegov rail slijeva ima
   * svoju "Sve" i to dvoje mora govoriti isto.
   *
   * Iznimka je pretraga: dok ona traje nijedna skupina nije odabrana, jer se
   * trazi po cijelom katalogu.
   */
  const sveSkupine = vrsta !== "loxone" ? stavka("", "Sve", filtri.brojBezKategorije(), !stanje.skupina) : "";

  return `
    <ul class="kat-traka__popis">
      ${sveSkupine}
      ${obitelji
        .map((obitelj) =>
          stavka(
            obitelj.id,
            obitelj.naziv.hr,
            filtri.brojZaKategoriju(obitelj.id),
            stanje.skupina === obitelj.id
          )
        )
        .join("")}
    </ul>`;
}

/**
 * Druga traka: pilule podskupina odabrane skupine, sazetak i sortiranje.
 *
 * Podskupine se pojavljuju tek kad je skupina odabrana. Svih 28 odjednom bilo
 * bi losije kazalo od 11 skupina koje zamjenjuju, a i nijedan artikl ne
 * pripada dvjema skupinama pa bi vecina pilula uvijek pokazivala nulu.
 *
 * Kad skupina nije odabrana, traka ostaje na mjestu s brojem rezultata i
 * sortiranjem — mreza ispod ne poskoci pri svakom odabiru.
 */
const SORTOVI_NATPISI = [
  ["zadano", "Zadano"],
  ["cijena-asc", "Cijena rastuće"],
  ["cijena-desc", "Cijena padajuće"],
  ["naziv-asc", "Naziv A–Ž"],
];

/**
 * Padajuci izbornik sortiranja.
 *
 * Nije `<select>`. Nativni birac se ne da oblikovati — panel s opcijama crta
 * operativni sustav, pa bi na jednoj stranici stajala dva razlicita padajuca
 * izbornika: ovaj sivi sistemski i onaj iz navigacije. Ovdje je gumb plus
 * popis, u istom kljucu kao `.izbornik__pod` u zaglavlju.
 *
 * Otvara se KLIKOM, ne prijelazom misa — isti razlog zbog kojeg se tako
 * otvaraju i podskupine: hover je neupotrebljiv na dodirniku, nevidljiv
 * tipkovnici i nestabilan na touchpadu.
 *
 * Nativna dostupnost se ne gubi: gumb nosi `aria-expanded`, popis je
 * `role="listbox"`, a svaka opcija `role="option"` s `aria-selected`.
 */
export function sortHtml(stanje) {
  const aktivni = SORTOVI_NATPISI.find(([kljucSorta]) => kljucSorta === stanje.sort);
  const natpis = !aktivni || aktivni[0] === "zadano" ? "Poredaj" : aktivni[1];

  return `
    <div class="sort" data-sort-izbornik>
      <button class="sort__gumb" type="button" data-akcija="sort-otvori"
              aria-expanded="false" aria-haspopup="listbox">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
             stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h10M4 17h5"/></svg>
        <span>${esc(natpis)}</span>
      </button>

      <ul class="sort__popis" role="listbox" aria-label="Poredaj artikle" hidden>
        ${SORTOVI_NATPISI.map(
          ([kljucSorta, ime]) => `
          <li role="option" aria-selected="${stanje.sort === kljucSorta}">
            <button class="sort__opcija${stanje.sort === kljucSorta ? " je-odabran" : ""}"
                    type="button" data-akcija="sort" data-vrijednost="${kljucSorta}">
              ${esc(ime)}
            </button>
          </li>`
        ).join("")}
      </ul>
    </div>`;
}

export function trakaPodskupinaHtml(katalog, filtri, popis) {
  const stanje = filtri.stanje;
  const podskupine = stanje.skupina ? katalog.podskupine(stanje.skupina) : [];

  const pilula = (id, ime, broj, odabrana) => `
    <li>
      <button class="pod-cip${odabrana ? " je-odabran" : ""}"
              type="button" data-akcija="podskupina" data-vrijednost="${esc(id)}"
              aria-pressed="${odabrana}">
        ${esc(ime)} <span class="pod-cip__broj monr">${broj}</span>
      </button>
    </li>`;

  return `
    ${
      podskupine.length
        ? `<ul class="pod-traka__popis">
            ${pilula("", "Sve", filtri.brojZaKategoriju(stanje.skupina), !stanje.podskupina)}
            ${podskupine
              .map((pod) =>
                pilula(
                  pod.id,
                  pod.naziv.hr,
                  filtri.brojZaKategoriju(pod.id),
                  stanje.podskupina === pod.id
                )
              )
              .join("")}
          </ul>`
        : `<p class="pod-traka__sazetak oznaka">${sBrojem(popis.length)}</p>`
    }

    ${sortHtml(stanje)}`;
}

/* ================================================================== */
/* Mreza kartica                                                       */
/* ================================================================== */
/**
 * Kadar kartice — video, dvije slike ili jedna.
 *
 * Tri stanja, jedan omjer. Izvori su namjerno pregledani prije nego je ovo
 * napisano: sve fotografije i svih 44 videa su 3:2 na bijeloj pozadini, pa
 * kadar nikad ne mijenja visinu i mreza se ne trese pri ucitavanju.
 *
 * `preload="none"` je uvjet, ne stednja: 28 videa po ~350 kB je 10 MB koji bi
 * krenuli u trenutku crtanja stranice. Poster je prva fotografija proizvoda,
 * pa kartica prije hovera izgleda tocno kao i svaka druga.
 */
const VELICINE = "(max-width: 520px) 46vw, (max-width: 900px) 30vw, 300px";

/**
 * Sirine se citaju iz manifesta, ne pretpostavljaju.
 *
 * Izvorne fotografije nisu jednake: dio ih je 903 px, dio 600 px. Za 600 px
 * izvor varijanta od 720 px ne postoji jer se slike ne uzorkuju prema gore, pa
 * `srcset` koji je slijepo trazi vodi na 404 — i to na 46 od 87 kadrova.
 * scripts/proizvodi.mjs zato uz svaku sliku zapise sto je stvarno napravio.
 */
function kadarHtml(artikl, adresa = null) {
  const mediji = artikl.mediji;
  const opis = esc(artikl.naziv);

  // Kadar vodi na stranicu proizvoda kad ona postoji. Poveznica obuhvaca samo
  // sliku, nikad brzu akciju ispod nje — gumb unutar <a> bi na svaki dodir
  // odveo na drugu stranicu umjesto da doda u kosaricu.
  const omot = (sadrzaj) =>
    adresa
      ? `<a class="proizvod__kadar proizvod__kadar--veza" href="${esc(adresa)}" tabindex="-1" aria-hidden="true">${sadrzaj}</a>`
      : `<div class="proizvod__kadar">${sadrzaj}</div>`;

  if (!mediji?.slika) {
    return '<div class="proizvod__kadar proizvod__kadar--prazan" aria-hidden="true"></div>';
  }

  const najveca = (unos) => unos.sirine[unos.sirine.length - 1];
  const skup = (unos, format) =>
    unos.sirine.map((s) => `/assets/proizvodi/${unos.id}-${s}.${format} ${s}w`).join(", ");

  const slika = (unos, razred) => `
    <picture class="${razred}">
      <source type="image/avif" srcset="${skup(unos, "avif")}" sizes="${VELICINE}">
      <img src="/assets/proizvodi/${unos.id}-${najveca(unos)}.webp"
           srcset="${skup(unos, "webp")}" sizes="${VELICINE}"
           alt="${opis}" width="720" height="480" loading="lazy" decoding="async">
    </picture>`;

  if (mediji.video) {
    return omot(`
      <video class="proizvod__video" data-video-hover
             poster="/assets/proizvodi/${mediji.slika.id}-${najveca(mediji.slika)}.webp"
             width="1200" height="800"
             muted playsinline preload="none" disablepictureinpicture
             aria-label="${opis}">
        <source src="${esc(medij(mediji.video))}" type="video/webm">
      </video>`);
  }

  return omot(`
    ${slika(mediji.slika, "proizvod__slika")}
    ${mediji.slika2 ? slika(mediji.slika2, "proizvod__slika proizvod__slika--druga") : ""}`);
}

/*
 * Natpis ispod cijene na kartici. Screenshot na tom mjestu ima "excl. VAT".
 *
 * Izvoz kataloga ne navodi ni PDV, ni uvjete dostave, ni je li ugradnja u
 * cijeni (hes-content.md, marker 16 / §8.8), pa u mrezi stoji samo ono sto
 * izvor doista kaze: cijena je po komadu, a kod alata po danu. Stranice
 * proizvoda idu dalje od toga jer za svih 59 artikala postoji podatak iz
 * Loxoneova kataloga (LOXONE-PROIZVODI.md) — vidi `proizvodi/*.html`.
 *
 * Osnova dolazi izvana (`postavke.osnova`) jer istu karticu crtaju i katalog
 * po komadu i cjenik najma po danu.
 */

/**
 * Jedna kartica proizvoda.
 *
 * Izdvojena iz `mrezaHtml` da je moze koristiti i karusel preporuka na
 * stranici proizvoda. Kartica u mrezi i kartica u karuselu moraju biti
 * DOSLOVNO ista stvar — dvije izvedbe bi se razisle prvom sljedecom izmjenom,
 * a razlika bi se citala kao da preporuke nisu pravi proizvodi.
 *
 * `veza` je adresa stranice proizvoda ili null. Kad postoji, naziv postaje
 * poveznica; brza akcija ostaje gumb i ne smije zavrsiti unutar nje, inace
 * dodavanje u kosaricu odvede na drugu stranicu.
 *
 * Kolicina zivi IZVAN kosarice, u `kolicine` mapi koju drzi pozivatelj. Broj
 * na kartici je namjera, ne stanje narudzbe: dok se ne pritisne gumb, kosarica
 * za njega ne zna. Suprotno bi znacilo da svaki dodir na "+" mijenja sadrzaj
 * kosarice, a brojac u zaglavlju bi rastao bez ijednog dodavanja.
 *
 * `potvrden` NIJE "je li artikl u kosarici" nego "je li upravo dodan": vidi
 * js/potvrda.js. Gumb se zato nakon pet sekundi vrati u stanje koje poziva na
 * dodavanje, a ne ostane trajno zakljucan u "U kosarici".
 */
export function karticaHtml(artikl, { potvrden, kolicine, podskupinaZa, osnova = "kom", veza = null }) {
  const jeDodan = potvrden(artikl.id);
  const kolicina = kolicine.get(artikl.id) ?? 1;
  const podskupina = podskupinaZa(artikl);
  const adresa = veza?.(artikl) ?? null;

  const ime = adresa
    ? `<a class="proizvod__veza" href="${esc(adresa)}">${esc(artikl.naziv)}</a>`
    : esc(artikl.naziv);

  return `
    <li class="proizvod" data-artikl="${esc(artikl.id)}">
      ${kadarHtml(artikl, adresa)}

      <div class="proizvod__tijelo">
        <h3 class="proizvod__ime">${ime}</h3>
        ${podskupina ? `<p class="proizvod__vrsta">${esc(podskupina)}</p>` : ""}

        <p class="proizvod__cijena">
          <span class="cijena">${formatCijene(artikl.cijenaCents)}</span>
          <span class="cijena__osnova">${osnova === "dan" ? "po danu" : "po komadu"}</span>
        </p>

        <div class="proizvod__akcije">
          <div class="brojac">
            <button type="button" data-akcija="kolicina-manje" data-artikl="${esc(artikl.id)}"
                    aria-label="Manje ${esc(artikl.naziv)}" ${kolicina <= 1 ? "disabled" : ""}>−</button>
            <span class="monr" data-kolicina="${esc(artikl.id)}">${kolicina}</span>
            <button type="button" data-akcija="kolicina-vise" data-artikl="${esc(artikl.id)}"
                    aria-label="Više ${esc(artikl.naziv)}">+</button>
          </div>

          <button class="u-kosaricu${jeDodan ? " je-u-kosarici" : ""}" type="button"
                  data-akcija="dodaj" data-artikl="${esc(artikl.id)}"
                  aria-label="${jeDodan ? "Dodano u košaricu" : `Dodajte ${esc(artikl.naziv)} u košaricu`}">
            ${
              jeDodan
                ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5"/></svg>'
                : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4h2l2.4 10.4a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.55L21 8H6"/><circle cx="10" cy="20" r="1.2"/><circle cx="18" cy="20" r="1.2"/></svg>'
            }
          </button>
        </div>

        <p class="proizvod__stanje">
          ${
            artikl.naStanju
              ? '<span class="pilula pilula--stanje">Na stanju</span>'
              : '<span class="pilula">Na upit</span>'
          }
        </p>
      </div>
    </li>`;
}

/**
 * Mreza proizvodnih kartica — Loxone katalog I cjenik najma.
 *
 * Do sada je cjenik crtala zasebna `tablicaHtml`, jer alati nisu imali
 * nijednu fotografiju i mreza praznih kadrova bi bila tablica s vise
 * praznine. Otkako ih imaju svih sesnaest (scripts/proizvodi.mjs), tablica
 * je obrisana i obje zalihe idu kroz istu komponentu — sto hes-style.md §5 i
 * trazi. Jedina razlika je `osnova`, koja mijenja natpis ispod cijene.
 */
export function mrezaHtml(popis, postavke) {
  if (!popis.length) {
    return `
      <div class="prazno">
        <p class="naslov-3">Nema artikala za odabrane filtre.</p>
        <button class="gumb gumb--sporedni" type="button" data-akcija="ocisti">Očistite filtre</button>
      </div>`;
  }

  return `<ul class="mreza-proizvoda" data-stepenica>${popis
    .map((artikl) => karticaHtml(artikl, postavke))
    .join("")}</ul>`;
}

/**
 * Karusel preporuka — dno stranice proizvoda.
 *
 * Vodoravna staza s hvatanjem (`scroll-snap`) umjesto mreze: preporuke su
 * dodatak, ne katalog, i ne smiju zauzeti visinu kao da jesu. Strelice su
 * dopuna kotacicu i povlacenju, ne jedini nacin — zato staza ostaje obican
 * element koji klizi i bez JS-a.
 */
export function karuselHtml(popis, postavke) {
  if (!popis.length) return "";

  return `
    <div class="karusel" data-karusel>
      <ul class="karusel__staza" data-karusel-staza>
        ${popis.map((artikl) => karticaHtml(artikl, postavke)).join("")}
      </ul>
    </div>`;
}

/* ================================================================== */
/* Stranica proizvoda                                                  */
/* ================================================================== */
/**
 * Galerija: veliki kadar plus traka slicica.
 *
 * Video, kad postoji, stoji PRVI. Kontrole su maknute na zahtjev klijenta i
 * s njima `loop`: kadar se sada pokrece SAM, svakih deset sekundi dok je
 * galerija u vidokrugu (`data-video-ciklus` na nosacu, js/interakcije.js), a
 * klik po kadru ga pauzira i nastavlja. Traka s kontrolama je preko isjecka
 * od cetiri sekunde bila veca od onoga sto pokazuje.
 *
 * `galerija` iz manifesta nosi SVE fotografije mape, ne samo dvije koje treba
 * kartica — zato je scripts/proizvodi.mjs i pretvara sve.
 */
export function galerijaHtml(artikl) {
  const mediji = artikl.mediji;
  if (!mediji?.galerija?.length) {
    return '<div class="galerija__glavni proizvod__kadar--prazan" aria-hidden="true"></div>';
  }

  const opis = esc(artikl.naziv);
  const najveca = (unos) => unos.sirine[unos.sirine.length - 1];
  const skup = (unos, format) =>
    unos.sirine.map((s) => `/assets/proizvodi/${unos.id}-${s}.${format} ${s}w`).join(", ");
  const velicine = "(max-width: 900px) 92vw, 560px";

  const kadrovi = [];
  if (mediji.video) {
    kadrovi.push({
      vrsta: "video",
      kljuc: "video",
      poster: `/assets/proizvodi/${mediji.slika.id}-${najveca(mediji.slika)}.webp`,
    });
  }
  for (const unos of mediji.galerija) kadrovi.push({ vrsta: "slika", kljuc: unos.id, unos });

  const veliki = (kadar, i) =>
    kadar.vrsta === "video"
      ? `<div class="galerija__kadar" data-kadar="${esc(kadar.kljuc)}"${i ? " hidden" : ""}>
           <video class="galerija__video" data-galerija-video
                  poster="${esc(kadar.poster)}" width="1200" height="800"
                  muted playsinline preload="none"
                  aria-label="${opis} — videoprikaz">
             <source src="${esc(medij(mediji.video))}" type="video/webm">
           </video>
         </div>`
      : `<div class="galerija__kadar" data-kadar="${esc(kadar.kljuc)}"${i ? " hidden" : ""}>
           <picture>
             <source type="image/avif" srcset="${skup(kadar.unos, "avif")}" sizes="${velicine}">
             <img src="/assets/proizvodi/${kadar.unos.id}-${najveca(kadar.unos)}.webp"
                  srcset="${skup(kadar.unos, "webp")}" sizes="${velicine}"
                  alt="${opis}" width="720" height="480"
                  ${i ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async">
           </picture>
         </div>`;

  const slicica = (kadar, i) => `
    <li>
      <button class="galerija__slicica${i === 0 ? " je-odabran" : ""}" type="button"
              data-akcija="kadar" data-vrijednost="${esc(kadar.kljuc)}"
              aria-label="Prikaz ${i + 1} od ${kadrovi.length}" aria-pressed="${i === 0}">
        ${
          kadar.vrsta === "video"
            ? `<img src="${esc(kadar.poster)}" alt="" width="120" height="80" loading="lazy" decoding="async">
               <span class="galerija__znak" aria-hidden="true">
                 <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg>
               </span>`
            : `<img src="/assets/proizvodi/${kadar.unos.id}-480.webp" alt=""
                    width="120" height="80" loading="lazy" decoding="async">`
        }
      </button>
    </li>`;

  return `
    <div class="galerija" data-galerija>
      <div class="galerija__glavni">${kadrovi.map(veliki).join("")}</div>
      ${
        kadrovi.length > 1
          ? `<ul class="galerija__traka">${kadrovi.map(slicica).join("")}</ul>`
          : ""
      }
    </div>`;
}

/* ================================================================== */
/* Ladica kosarice                                                     */
/* ================================================================== */
/**
 * Dvije skupine, dva zbroja, nikad jedan iznos.
 *
 * Kupnja po komadu i najam po danu nisu ista vrsta obveze, pa se ni ne
 * zbrajaju u jedan broj koji bi izgledao kao ukupna cijena narudzbe koju
 * stranica ionako ne prima.
 */
export function ladicaHtml(stanje) {
  if (stanje.prazna) {
    return `
      <div class="ladica__prazno">
        <p class="naslov-3">Košarica je prazna.</p>
        <p class="tiho">Dodajte artikle iz Loxone kataloga ili najma alata pa zatražite ponudu.</p>
        <div class="akcije">
          <a class="gumb gumb--sporedni" href="/webshop">Loxone katalog</a>
          <a class="gumb gumb--sporedni" href="/najam-alata">Najam alata</a>
        </div>
      </div>`;
  }

  /**
   * Slicica proizvoda u kosarici.
   *
   * Mediji se u stavku kosarice SNIMAJU pri dodavanju, ne dohvacaju pri
   * crtanju. Ladica se otvara i na naslovnici, gdje katalog nikad nije ucitan
   * — da se slika trazila iz manifesta, kosarica bi ondje bila bez slika ili
   * bi zbog nje trebalo povuci cijeli katalog. Isti razlog iz kojeg se snima i
   * cijena: kosarica mora ostati citljiva sama za sebe.
   *
   * Najam alata nema nijednu fotografiju, pa stavke najma ostaju bez okvira
   * umjesto da dobiju 16 praznih kvadrata.
   */
  const slicica = (stavka) => {
    const slika = stavka.mediji?.slika;
    if (!slika) return "";
    const sirina = slika.sirine[0];
    return `
      <div class="ladica__slika">
        <picture>
          <source type="image/avif" srcset="/assets/proizvodi/${slika.id}-${sirina}.avif">
          <img src="/assets/proizvodi/${slika.id}-${sirina}.webp" alt=""
               width="120" height="80" loading="lazy" decoding="async">
        </picture>
      </div>`;
  };

  const redakProizvoda = (stavka) => `
    <li class="ladica__stavka${stavka.mediji?.slika ? " ladica__stavka--sa-slikom" : ""}"
        data-stavka="${esc(stavka.id)}">
      ${slicica(stavka)}
      <div class="ladica__podaci">
        <div class="ladica__glava">
          <span class="ladica__ime">${esc(stavka.naziv)}</span>
          <button class="ikona-gumb ikona-gumb--sitni" type="button"
                  data-akcija="makni" data-artikl="${esc(stavka.id)}"
                  aria-label="Ukloni ${esc(stavka.naziv)}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>
        <div class="ladica__red">
          <div class="brojac">
            <button type="button" data-akcija="manje" data-artikl="${esc(stavka.id)}" aria-label="Manje">−</button>
            <span class="monr">${stavka.kolicina}</span>
            <button type="button" data-akcija="vise" data-artikl="${esc(stavka.id)}" aria-label="Više">+</button>
          </div>
          <span class="cijena">${formatCijene(iznosStavke(stavka))}</span>
        </div>
      </div>
    </li>`;

  const redakNajma = (stavka) => {
    const dana = brojDana(stavka.odDatuma, stavka.doDatuma);
    return `
      <li class="ladica__stavka" data-stavka="${esc(stavka.id)}">
        <div class="ladica__glava">
          <span class="ladica__ime">${esc(stavka.naziv)}</span>
          <button class="ikona-gumb ikona-gumb--sitni" type="button"
                  data-akcija="makni" data-artikl="${esc(stavka.id)}"
                  aria-label="Ukloni ${esc(stavka.naziv)}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>
        <p class="jedva monr">${formatCijene(stavka.cijenaCents)} / dan</p>
        <div class="ladica__datumi">
          <label>
            <span class="oznaka">Od</span>
            <input type="date" data-akcija="od" data-artikl="${esc(stavka.id)}"
                   value="${esc(stavka.odDatuma ?? "")}">
          </label>
          <label>
            <span class="oznaka">Do</span>
            <input type="date" data-akcija="do" data-artikl="${esc(stavka.id)}"
                   value="${esc(stavka.doDatuma ?? "")}"
                   ${stavka.odDatuma ? `min="${esc(stavka.odDatuma)}"` : ""}>
          </label>
        </div>
        <div class="ladica__red">
          <div class="brojac">
            <button type="button" data-akcija="manje" data-artikl="${esc(stavka.id)}" aria-label="Manje">−</button>
            <span class="monr">${stavka.kolicina}</span>
            <button type="button" data-akcija="vise" data-artikl="${esc(stavka.id)}" aria-label="Više">+</button>
          </div>
          ${
            dana
              ? `<span class="ladica__dana jedva monr">${dana} ${mnozinaDana(dana)}</span>
                 <span class="cijena">${formatCijene(iznosStavke(stavka))}</span>`
              : '<span class="ladica__upozorenje">Odaberite datume</span>'
          }
        </div>
      </li>`;
  };

  const skupina = (naslov, natpis, popis, ukupno, crtaj) =>
    popis.length
      ? `<section class="ladica__skupina">
          <header class="ladica__zaglavlje">
            <p class="oznaka">${naslov}</p>
            <p class="jedva">${natpis}</p>
          </header>
          <ul class="ladica__popis">${popis.map(crtaj).join("")}</ul>
          <p class="ladica__zbroj">
            <span class="oznaka">Ukupno</span>
            <span class="cijena cijena--istaknuta">${formatCijene(ukupno)}</span>
          </p>
        </section>`
      : "";

  return `
    ${skupina("Proizvodi", "Loxone · cijena po komadu", stanje.proizvodi, stanje.ukupnoProizvodi, redakProizvoda)}
    ${skupina("Najam alata", "cijena po danu", stanje.najam, stanje.ukupnoNajam, redakNajma)}

    <!--
      Ograda koja se ne smije maknuti: izvor ne sadrzi ni PDV, ni dostavu, ni
      najkraci rok najma (hes-content.md, markeri 16 i 18), pa se ovdje ne
      tvrdi sto je u iznos ukljuceno.
    -->
    <p class="ladica__ograda tiho">
      Procjena na temelju cjenika. Konačnu ponudu šaljemo e-poštom.
    </p>

    ${
      stanje.nepotpuneStavke.length
        ? `<p class="ladica__upozorenje">
            Za ${sBrojem(stanje.nepotpuneStavke.length)} u najmu nedostaju datumi.
          </p>`
        : ""
    }

    <div class="ladica__dno">
      <button class="gumb gumb--glavni" type="button" data-akcija="ponuda"
              ${stanje.nepotpuneStavke.length ? "disabled" : ""}>
        Zatražite ponudu
      </button>
      <button class="gumb gumb--tihi" type="button" data-akcija="isprazni">Ispraznite košaricu</button>
    </div>`;
}
