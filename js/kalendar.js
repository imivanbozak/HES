/**
 * kalendar.js — odabir razdoblja najma.
 *
 * Zamjenjuje dva <input type="date"> u ladici. Nativno polje ne zna zasiviti
 * pojedine dane, a upravo to najam treba: alat vecinom postoji u jednom
 * primjerku, pa posjetitelj mora vidjeti koji su dani vec uzeti PRIJE nego
 * posalje upit, a ne tek u poruci "zauzeto" poslije njega.
 *
 * Dva klika: dan preuzimanja, pa dan povrata. Dan povrata ne ulazi u broj
 * dana (js/kosarica.js, brojDana) i ne zauzima alat, pa se smije vratiti
 * upravo na dan kad ga netko drugi preuzima. Zato zauzet dan smije biti dan
 * povrata, ali ne i dan unutar raspona.
 *
 * Nativni <dialog> sa showModal(), kao ladica i postavke: Esc, zamka fokusa i
 * pozadina dolaze besplatno. Otvara se IZNAD ladice, koja je i sama modalna —
 * preglednik ih slaze u gornji sloj redom otvaranja.
 *
 * Tipkovnica: strelice po danima i tjednima, PageUp/PageDown po mjesecima,
 * Home/End na pocetak i kraj tjedna, Enter ili razmak bira. Fokus nosi jedan
 * dan (tabindex 0), ostali su -1: jedan Tab ulazi u mrezu, drugi izlazi.
 * Nedostupni dani su `aria-disabled`, ne `disabled`, da strelice mogu preko
 * njih — inace bi zauzet tjedan presjekao kretanje po mjesecu.
 */

import { t, JEZIK, mnozina, formatDatuma } from "./jezik.js";
import { danasnjiDatum, pomakni } from "./zauzetost.js";

const NAJDULJE = 366; // isto ogranicenje kao u shema.sql

let dijalog = null;
let naslovEl = null;
let sadrzaj = null;
let stanje = null;
let brojMjeseci = 1;

const esc = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* ------------------------------------------------------------------ */
/* Datumi                                                              */
/* ------------------------------------------------------------------ */
const uDatum = (iso) => {
  const [g, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(g, m - 1, d));
};

function pomakniMjesec(mjesec, za) {
  const [g, m] = mjesec.split("-").map(Number);
  return new Date(Date.UTC(g, m - 1 + za, 1)).toISOString().slice(0, 7);
}

const razlikaDana = (od, doo) => Math.round((uDatum(doo) - uDatum(od)) / 86400000);

let oblici = null;
function oblik() {
  if (oblici) return oblici;
  const zona = { timeZone: "UTC" };
  oblici = {
    mjesec: new Intl.DateTimeFormat(JEZIK, { month: "long", year: "numeric", ...zona }),
    dan: new Intl.DateTimeFormat(JEZIK, { weekday: "long", day: "numeric", month: "long", year: "numeric", ...zona }),
    kratko: new Intl.DateTimeFormat(JEZIK, { weekday: "short", ...zona }),
    dugo: new Intl.DateTimeFormat(JEZIK, { weekday: "long", ...zona }),
  };
  return oblici;
}

/* ------------------------------------------------------------------ */
/* Pravila odabira                                                     */
/* ------------------------------------------------------------------ */
/**
 * Najkasniji dopusten dan povrata za zadani pocetak: prvi zauzeti dan
 * nakon pocetka (vraca se tog jutra), ili godina dana ako takvog nema.
 */
function granicaZa(pocetak) {
  for (let i = 1; i <= NAJDULJE; i += 1) {
    const dan = pomakni(pocetak, i);
    if (stanje.danPun(dan)) return dan;
  }
  return pomakni(pocetak, NAJDULJE);
}

const biraSePocetak = () => !stanje.pocetak || Boolean(stanje.kraj);

function odabirljiv(dan) {
  const danas = danasnjiDatum();
  if (dan < danas) return false;
  const kaoPocetak = dan <= pomakni(danas, 365) && !stanje.danPun(dan);
  if (biraSePocetak() || dan <= stanje.pocetak) return kaoPocetak;
  return dan <= stanje.granica;
}

function odaberi(dan) {
  if (biraSePocetak() || dan <= stanje.pocetak) {
    stanje.pocetak = dan;
    stanje.kraj = null;
    stanje.granica = granicaZa(dan);
  } else {
    stanje.kraj = dan;
  }
  stanje.fokus = dan;
  crtaj({ fokusiraj: true });
}

/* ------------------------------------------------------------------ */
/* Crtanje                                                             */
/* ------------------------------------------------------------------ */
function danHtml(iso, broj) {
  const danas = danasnjiDatum();
  const pun = iso >= danas && stanje.danPun(iso);
  const rub = iso === stanje.pocetak || iso === stanje.kraj;
  const uRasponu = stanje.pocetak && stanje.kraj && iso > stanje.pocetak && iso < stanje.kraj;

  const razredi = ["kalendar__dan"];
  if (pun) razredi.push("kalendar__dan--zauzet");
  if (uRasponu) razredi.push("kalendar__dan--u-rasponu");
  if (rub) razredi.push("kalendar__dan--rub");
  if (iso === danas) razredi.push("kalendar__dan--danas");

  const opis = `${oblik().dan.format(uDatum(iso))}${pun ? `, ${t("kalendar.zauzeto")}` : ""}`;

  return `<button type="button" class="${razredi.join(" ")}" data-dan="${iso}"
            tabindex="${iso === stanje.fokus ? 0 : -1}" aria-label="${esc(opis)}"
            ${rub || uRasponu ? 'aria-pressed="true"' : 'aria-pressed="false"'}
            ${odabirljiv(iso) ? "" : 'aria-disabled="true"'}>${broj}</button>`;
}

function mjesecHtml(mjesec) {
  const [g, m] = mjesec.split("-").map(Number);
  const prvi = new Date(Date.UTC(g, m - 1, 1));
  const brojDanaMjeseca = new Date(Date.UTC(g, m, 0)).getUTCDate();
  const pomak = (prvi.getUTCDay() + 6) % 7; // tjedan pocinje ponedjeljkom

  const celije = Array.from({ length: pomak }, () => "<td></td>");
  for (let d = 1; d <= brojDanaMjeseca; d += 1) {
    celije.push(`<td>${danHtml(`${mjesec}-${String(d).padStart(2, "0")}`, d)}</td>`);
  }
  while (celije.length % 7) celije.push("<td></td>");

  const redovi = [];
  for (let i = 0; i < celije.length; i += 7) redovi.push(`<tr>${celije.slice(i, i + 7).join("")}</tr>`);

  // 1. 1. 2024. je ponedjeljak — izvor imena dana u tjednu za svaki jezik.
  const dani = Array.from({ length: 7 }, (_, i) => new Date(Date.UTC(2024, 0, 1 + i)));

  return `
    <table class="kalendar__mjesec">
      <caption>${esc(oblik().mjesec.format(prvi))}</caption>
      <thead><tr>${dani
        .map((d) => `<th scope="col" abbr="${esc(oblik().dugo.format(d))}">${esc(oblik().kratko.format(d))}</th>`)
        .join("")}</tr></thead>
      <tbody>${redovi.join("")}</tbody>
    </table>`;
}

function sazetakHtml() {
  if (!stanje.pocetak) return "";
  const pocetak = `${t("kalendar.preuzimanje")} <strong class="monr">${esc(formatDatuma(stanje.pocetak))}</strong>`;
  if (!stanje.kraj) return pocetak;
  const dana = razlikaDana(stanje.pocetak, stanje.kraj);
  return `${pocetak} · ${t("kalendar.povrat")} <strong class="monr">${esc(
    formatDatuma(stanje.kraj, { godina: true })
  )}</strong> · ${dana} ${mnozina("mnozina.dan", dana)}`;
}

function crtaj({ fokusiraj = false } = {}) {
  if (!sadrzaj || !stanje) return;

  const danasMjesec = danasnjiDatum().slice(0, 7);
  const mjeseci = Array.from({ length: brojMjeseci }, (_, i) => pomakniMjesec(stanje.mjesec, i));
  const uputa = stanje.ceka
    ? t("kalendar.ucitavanje")
    : biraSePocetak()
      ? t("kalendar.odaberite_pocetak")
      : t("kalendar.odaberite_kraj");

  sadrzaj.innerHTML = `
    <div class="kalendar__glava">
      <button class="ikona-gumb ikona-gumb--sitni" type="button" data-kal="natrag"
              aria-label="${esc(t("kalendar.prethodni"))}" ${stanje.mjesec <= danasMjesec ? "disabled" : ""}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg>
      </button>
      <p class="kalendar__uputa" aria-live="polite">${esc(uputa)}</p>
      <button class="ikona-gumb ikona-gumb--sitni" type="button" data-kal="naprijed"
              aria-label="${esc(t("kalendar.sljedeci"))}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>
      </button>
    </div>

    <div class="kalendar__mjeseci" style="--broj-mjeseci: ${brojMjeseci}">${mjeseci.map(mjesecHtml).join("")}</div>

    <div class="kalendar__dno">
      <p class="kalendar__sazetak">${sazetakHtml()}</p>
      <p class="kalendar__legenda"><span class="kalendar__uzorak" aria-hidden="true"></span>${esc(
        t("kalendar.legenda_zauzeto")
      )}</p>
      <div class="kalendar__gumbi">
        <button class="gumb gumb--tihi" type="button" data-kal="ponisti" ${stanje.pocetak ? "" : "disabled"}>${esc(
          t("kalendar.ponisti")
        )}</button>
        <button class="gumb gumb--glavni" type="button" data-kal="potvrdi" ${
          stanje.pocetak && stanje.kraj ? "" : "disabled"
        }>${esc(t("kalendar.potvrdi"))}</button>
      </div>
    </div>`;

  if (fokusiraj) sadrzaj.querySelector(`[data-dan="${stanje.fokus}"]`)?.focus();
}

/** Pomakni fokus na dan i, ako je izvan prikazanih mjeseci, i prikaz za njim. */
function premjestiFokus(dan) {
  const danas = danasnjiDatum();
  if (dan < danas) dan = danas;
  const mjesec = dan.slice(0, 7);
  const zadnjiPrikazan = pomakniMjesec(stanje.mjesec, brojMjeseci - 1);
  if (mjesec < stanje.mjesec) stanje.mjesec = mjesec;
  else if (mjesec > zadnjiPrikazan) stanje.mjesec = pomakniMjesec(mjesec, -(brojMjeseci - 1));
  stanje.fokus = dan;
  crtaj({ fokusiraj: true });
}

/* ------------------------------------------------------------------ */
/* Dijalog                                                             */
/* ------------------------------------------------------------------ */
function stvori() {
  if (dijalog) return;

  dijalog = document.createElement("dialog");
  dijalog.className = "kalendar prozor";
  dijalog.setAttribute("aria-labelledby", "kalendar-naslov");
  dijalog.innerHTML = `
    <div class="prozor__traka" data-zivo="crta">
      <span class="prozor__tocka"></span><span class="prozor__tocka"></span><span class="prozor__tocka"></span>
      <span class="prozor__naslov">najam.hes</span>
      <button class="ikona-gumb ikona-gumb--sitni prozor__zatvori" type="button" data-kal="zatvori"
              aria-label="${esc(t("kalendar.zatvori"))}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>
      </button>
    </div>
    <div class="kalendar__tijelo">
      <h2 class="naslov-3" id="kalendar-naslov"></h2>
      <div data-kal-sadrzaj></div>
    </div>`;
  document.body.appendChild(dijalog);

  naslovEl = dijalog.querySelector("#kalendar-naslov");
  sadrzaj = dijalog.querySelector("[data-kal-sadrzaj]");

  dijalog.addEventListener("click", (dogadaj) => {
    if (dogadaj.target === dijalog) {
      dijalog.close();
      return;
    }

    const dan = dogadaj.target.closest("[data-dan]");
    if (dan) {
      if (dan.getAttribute("aria-disabled") !== "true") odaberi(dan.dataset.dan);
      return;
    }

    const akcija = dogadaj.target.closest("[data-kal]")?.dataset.kal;
    switch (akcija) {
      case "natrag":
        stanje.mjesec = pomakniMjesec(stanje.mjesec, -1);
        crtaj();
        break;
      case "naprijed":
        stanje.mjesec = pomakniMjesec(stanje.mjesec, 1);
        crtaj();
        break;
      case "ponisti":
        stanje.pocetak = null;
        stanje.kraj = null;
        stanje.granica = null;
        crtaj();
        break;
      case "potvrdi":
        if (stanje.pocetak && stanje.kraj) {
          stanje.naPotvrdu(stanje.pocetak, stanje.kraj);
          dijalog.close();
        }
        break;
      case "zatvori":
        dijalog.close();
        break;
      default:
        break;
    }
  });

  dijalog.addEventListener("keydown", (dogadaj) => {
    const dan = dogadaj.target.closest?.("[data-dan]");
    if (!dan) return;
    const sada = dan.dataset.dan;
    const danUTjednu = (uDatum(sada).getUTCDay() + 6) % 7;
    const pomaci = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
      Home: -danUTjednu,
      End: 6 - danUTjednu,
    };

    let novi = null;
    if (dogadaj.key in pomaci) {
      novi = pomakni(sada, pomaci[dogadaj.key]);
    } else if (dogadaj.key === "PageUp" || dogadaj.key === "PageDown") {
      const [g, m, d] = sada.split("-").map(Number);
      const za = dogadaj.key === "PageUp" ? -1 : 1;
      // Isti dan u susjednom mjesecu, ili zadnji dan mjeseca ako ga nema (31. -> 30.).
      const zadnji = new Date(Date.UTC(g, m - 1 + za + 1, 0)).getUTCDate();
      novi = new Date(Date.UTC(g, m - 1 + za, Math.min(d, zadnji))).toISOString().slice(0, 10);
    }
    if (!novi) return;

    dogadaj.preventDefault();
    premjestiFokus(novi);
  });

  dijalog.addEventListener("close", () => {
    const vrati = stanje?.vratiFokus;
    stanje = null;
    vrati?.();
  });
}

/**
 * Otvori kalendar.
 *
 *   naslov      ime alata, stoji iznad mreze
 *   od, doo     vec odabrano razdoblje, ako ga ima
 *   danPun      (dan) => je li dan vec zauzet za trazenu kolicinu
 *   ceka        zauzetost se jos ucitava
 *   naPotvrdu   (od, doo) => spremi odabir
 *   vratiFokus  () => gdje fokus ide nakon zatvaranja; ladica se u
 *               medjuvremenu precrta, pa gumb koji je otvorio kalendar vise
 *               nije isti cvor
 *
 * Vraca `osvjezi({ ceka })` — poziva se kad zauzetost stigne.
 */
export function otvoriKalendar({ naslov, od = null, doo = null, danPun = () => false, ceka = false, naPotvrdu, vratiFokus }) {
  stvori();
  brojMjeseci = window.matchMedia("(min-width: 640px)").matches ? 2 : 1;

  const danas = danasnjiDatum();
  stanje = { pocetak: null, kraj: null, granica: null, danPun, ceka, naPotvrdu, vratiFokus };
  prihvatiOdabir(od, doo, danas);

  stanje.fokus = stanje.pocetak ?? danas;
  stanje.mjesec = stanje.fokus.slice(0, 7);

  naslovEl.textContent = naslov;
  crtaj();
  if (!dijalog.open) dijalog.showModal();
  sadrzaj.querySelector(`[data-dan="${stanje.fokus}"]`)?.focus();

  return {
    osvjezi({ ceka: jos = false } = {}) {
      if (!stanje) return;
      stanje.ceka = jos;
      // Odabir koji je vrijedio dok zauzetost nije stigla mozda vise ne vrijedi.
      prihvatiOdabir(stanje.pocetak, stanje.kraj, danasnjiDatum());
      crtaj();
    },
  };
}

/**
 * Prihvati postojeci odabir samo ako i dalje vrijedi: pocetak nije u
 * proslosti ni zauzet, a kraj ne prelazi prvi zauzeti dan nakon pocetka.
 * Inace se odbacuje — bolje prazan kalendar nego raspon koji baza odbije.
 */
function prihvatiOdabir(od, doo, danas) {
  if (!od || od < danas || stanje.danPun(od)) {
    stanje.pocetak = null;
    stanje.kraj = null;
    stanje.granica = null;
    return;
  }
  stanje.pocetak = od;
  stanje.granica = granicaZa(od);
  stanje.kraj = doo && doo > od && doo <= stanje.granica ? doo : null;
}
