/**
 * ladica.js — ladica kosarice.
 *
 * Nativni <dialog> s `showModal()`: Esc, zamka fokusa i pozadina dolaze
 * besplatno i rade ispravnije od svake rucne izvedbe. Zakljucavanje skrolanja
 * radi CSS kroz `html:has(dialog[open])`, bez ijednog reda JS-a.
 *
 * Ladica se docrtava pri svakoj promjeni kosarice. Pri ovoj kolicini stavki
 * to je jeftinije od razlikovnog osvjezavanja, ali polje datuma u fokusu mora
 * prezivjeti crtanje — inace bi upisivanje datuma izbacilo kursor iz polja na
 * svakoj znamenki.
 */

import { ladicaHtml } from "./pogledi.js";
import * as kosarica from "./kosarica.js";

let dijalog = null;
let tijelo = null;

function stvori() {
  if (dijalog) return dijalog;

  dijalog = document.createElement("dialog");
  dijalog.className = "ladica";
  dijalog.setAttribute("aria-label", "Košarica");
  dijalog.innerHTML = `
    <header class="ladica__vrh">
      <h2 class="naslov-3">Košarica</h2>
      <button class="ikona-gumb" type="button" data-akcija="zatvori" aria-label="Zatvori košaricu">
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
  dijalog.addEventListener("change", naPromjenuPolja);

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

  tijelo.innerHTML = ladicaHtml(kosarica.pregled());

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

function naPromjenuPolja(dogadaj) {
  const polje = dogadaj.target.closest("[data-akcija]");
  if (!polje) return;
  const { akcija, artikl } = polje.dataset;
  if (akcija !== "od" && akcija !== "do") return;

  const stavka = kosarica.pregled().stavke.find((s) => s.id === artikl);
  if (!stavka) return;

  const od = akcija === "od" ? polje.value : stavka.odDatuma;
  let doo = akcija === "do" ? polje.value : stavka.doDatuma;

  // Kraj prije pocetka nema smisla; umjesto poruke o gresci se kraj pomakne
  // na prvi valjani dan. Korisnik vidi ispravan raspon, ne prigovor.
  if (od && doo && doo <= od) {
    const sljedeci = new Date(`${od}T00:00:00`);
    sljedeci.setDate(sljedeci.getDate() + 1);
    doo = sljedeci.toISOString().slice(0, 10);
  }

  kosarica.postaviDatume(artikl, od, doo);
}

export function otvori() {
  stvori();
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

  document.addEventListener("click", (dogadaj) => {
    if (dogadaj.target.closest("[data-kosarica-otvori]")) otvori();
  });
}
