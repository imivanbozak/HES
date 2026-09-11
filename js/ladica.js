/**
 * ladica.js — ladica kosarice.
 *
 * Nativni <dialog> s `showModal()`: Esc, zamka fokusa i pozadina dolaze
 * besplatno i rade ispravnije od svake rucne izvedbe. Zakljucavanje skrolanja
 * radi CSS kroz `html:has(dialog[open])`, bez ijednog reda JS-a.
 *
 * Ladica se docrtava pri svakoj promjeni kosarice. Pri ovoj kolicini stavki
 * to je jeftinije od razlikovnog osvjezavanja, ali kontrola u fokusu mora
 * prezivjeti crtanje — inace bi svaki "+" ili potvrda kalendara bacili fokus
 * na pocetak dokumenta.
 *
 * Razdoblje najma bira se u js/kalendar.js, ne u dva polja datuma: nativno
 * polje ne zna zasiviti dane koji su vec zauzeti (js/zauzetost.js). Dva polja
 * su imala i gresku — kraj pomaknut "na sljedeci dan" racunao se preko
 * toISOString() na lokalnoj ponoci, sto je u Hrvatskoj jos prethodni dan u
 * UTC-u, pa je raspon ispadao dug nula dana.
 */

import { ladicaHtml } from "./pogledi.js";
import * as kosarica from "./kosarica.js";
import * as zauzetost from "./zauzetost.js";
import { otvoriKalendar } from "./kalendar.js";
import { t } from "./jezik.js";

let dijalog = null;
let tijelo = null;

function stvori() {
  if (dijalog) return dijalog;

  dijalog = document.createElement("dialog");
  dijalog.className = "ladica prozor";
  dijalog.setAttribute("aria-label", t("kosarica.naslov"));
  // Traka s tri tocke stoji u markupu uvijek, a vidi se tek ispod 1024 px:
  // ondje ladica prestaje biti bocna ploca i postaje prozor nasred ekrana,
  // pa joj treba vrh koji to i kaze. Na desktopu je CSS gasi.
  dijalog.innerHTML = `
    <div class="prozor__traka" data-zivo="crta" aria-hidden="true">
      <span class="prozor__tocka"></span><span class="prozor__tocka"></span><span class="prozor__tocka"></span>
      <span class="prozor__naslov">kosarica.hes</span>
    </div>
    <header class="ladica__vrh">
      <h2 class="naslov-3">${t("kosarica.naslov")}</h2>
      <button class="ikona-gumb" type="button" data-akcija="zatvori" aria-label="${t("kosarica.zatvori")}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </button>
    </header>
    <div class="ladica__tijelo" data-ladica-tijelo></div>`;

  document.body.appendChild(dijalog);
  tijelo = dijalog.querySelector("[data-ladica-tijelo]");

  // Klik na pozadinu zatvara. <dialog> javlja klik na sebi samom kad se
  // pogodi ::backdrop, pa je usporedba mete s dijalogom dovoljna.
  dijalog.addEventListener("click", (dogadaj) => {
    if (dogadaj.target === dijalog) zatvori();
  });

  dijalog.addEventListener("click", naKlik);

  return dijalog;
}

function crtaj() {
  if (!tijelo) return;

  // Zapamti sto je u fokusu i gdje je kursor, pa vrati nakon crtanja.
  const aktivno = document.activeElement;
  const kljucFokusa =
    aktivno && tijelo.contains(aktivno) && aktivno.dataset.akcija
      ? `${aktivno.dataset.akcija}:${aktivno.dataset.artikl ?? ""}`
      : null;

  // Stavke najma ciji je raspon u medjuvremenu zauzet. Baza bi upit ionako
  // odbila; ovako posjetitelj to vidi prije slanja, uz stavku kojoj pripada.
  const stanje = kosarica.pregled();
  const sukobi = new Set(
    stanje.najam
      .filter((s) => !zauzetost.slobodno(s.id, s.odDatuma, s.doDatuma, s.kolicina))
      .map((s) => s.id)
  );

  tijelo.innerHTML = ladicaHtml(stanje, { sukobi });

  if (kljucFokusa) {
    const [akcija, artikl] = kljucFokusa.split(":");
    const vrati = tijelo.querySelector(
      `[data-akcija="${akcija}"]${artikl ? `[data-artikl="${artikl}"]` : ""}`
    );
    vrati?.focus();
  }
}

function naKlik(dogadaj) {
  const meta = dogadaj.target.closest("[data-akcija]");
  if (!meta) return;

  const { akcija, artikl } = meta.dataset;
  const stavka = artikl ? kosarica.pregled().stavke.find((s) => s.id === artikl) : null;

  switch (akcija) {
    case "zatvori":
      zatvori();
      break;
    case "makni":
      kosarica.makni(artikl);
      break;
    case "vise":
      if (stavka) kosarica.postaviKolicinu(artikl, stavka.kolicina + 1);
      break;
    case "manje":
      if (stavka) kosarica.postaviKolicinu(artikl, stavka.kolicina - 1);
      break;
    case "isprazni":
      kosarica.isprazni();
      break;
    case "kalendar":
      if (stavka) otvoriZaStavku(stavka);
      break;
    case "ponuda":
      zatvori();
      // Obrazac upita zivi u sekciji kontakta na naslovnici. Iz kataloga se
      // do njega ide navigacijom, jer je to jedini obrazac na stranici i
      // drugi primjerak bi znacio dva mjesta koja se moraju odrzavati.
      document.dispatchEvent(new CustomEvent("hes:zatrazi-ponudu"));
      break;
    default:
      break;
  }
}

/**
 * Kalendar za jednu stavku najma.
 *
 * Dan je "pun" za kolicinu KOJA JE U KOSARICI: dva komada alata s dva
 * primjerka ne stanu na dan kad je jedan vec uzet, iako bi jedan stao.
 * Kalendar se otvara odmah; ako zauzetost jos stize, dani se zasive cim
 * stigne.
 */
function otvoriZaStavku(stavka) {
  const danPun = (dan) => zauzetost.danPun(stavka.id, dan, stavka.kolicina);
  const kalendar = otvoriKalendar({
    naslov: stavka.naziv,
    od: stavka.odDatuma,
    doo: stavka.doDatuma,
    danPun,
    ceka: zauzetost.ceka(),
    naPotvrdu: (od, doo) => kosarica.postaviDatume(stavka.id, od, doo),
    vratiFokus: () =>
      tijelo?.querySelector(`[data-akcija="kalendar"][data-artikl="${CSS.escape(stavka.id)}"]`)?.focus(),
  });
  zauzetost.ucitaj().then(() => kalendar.osvjezi({ ceka: false }));
}

export function otvori() {
  stvori();
  // Zauzetost treba samo ako u kosarici ima najma; poziv je jeftin i
  // predmemoriran, a crtanje se ponovi kad stigne (pokreniLadicu).
  if (kosarica.pregled().najam.length) zauzetost.ucitaj();
  crtaj();
  if (!dijalog.open) dijalog.showModal();
}

export function zatvori() {
  if (dijalog?.open) dijalog.close();
}

/** Brojac u zaglavlju. Skriven kad je kosarica prazna. */
function osvjeziBrojac(stanje) {
  for (const oznaka of document.querySelectorAll("[data-kosarica-brojac]")) {
    oznaka.textContent = String(stanje.broj);
    oznaka.hidden = stanje.broj === 0;
  }
}

export function pokreniLadicu() {
  osvjeziBrojac(kosarica.pregled());

  kosarica.naPromjenu((stanje) => {
    osvjeziBrojac(stanje);
    if (dijalog?.open) crtaj();
  });

  zauzetost.naPromjenu(() => {
    if (dijalog?.open) crtaj();
  });

  // Baza je odbila upit jer je nesto u medjuvremenu zauzeto — podaci u
  // pregledniku su stari, pa se povlace iznova i ladica pokaze sto.
  document.addEventListener("hes:zauzeto", () => zauzetost.ucitaj({ iznova: true }));

  document.addEventListener("click", (dogadaj) => {
    if (dogadaj.target.closest("[data-kosarica-otvori]")) otvori();
  });
}
