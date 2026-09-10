/**
 * main.js — jedina ulazna tocka za sve tri stranice.
 *
 * Sve se vezuje delegiranim slusacima na dokumentu, ne po jedan po elementu:
 * dijelovi stranice se docrtavaju kasnije (tablica kataloga, rail, ladica
 * kosarice), pa slusac vezan pri ucitavanju ne bi znao za njih.
 *
 * Moduli kataloga se ucitavaju tek ako stranica ima katalog. Naslovnica tako
 * ne placa ni bajt za trgovinu.
 */

import { pokreniTemu, obrniTemu, naPromjenuTeme } from "./tema.js";
import {
  pokreniOtkrivanje,
  pokreniRaspad,
  pokreniSpy,
  pokreniParalaksu,
  pokreniSkrolTraku,
  pokreniZivot,
} from "./pokret.js";
import {
  pokreniProvjeruUvjeta,
  pokreniNapredakObrasca,
  pokreniVrsteUpita,
  pokreniVideoNaHover,
  pokreniVideoNaInterval,
} from "./interakcije.js";
import { pokreniPlatno } from "./platno.js";
import { pokreniZaglavlje } from "./zaglavlje.js";

const KOSTUR_NAJMANJE_MS = 420;
const kosturPocetak = performance.now();

function kadaSeUcitaProzor() {
  if (document.readyState === "complete") return Promise.resolve();
  return new Promise((rijesi) => window.addEventListener("load", rijesi, { once: true }));
}

function sakrijKostur() {
  const kostur = document.querySelector("[data-kostur]");
  const proteklo = performance.now() - kosturPocetak;
  const cekanje = Math.max(0, KOSTUR_NAJMANJE_MS - proteklo);

  window.setTimeout(() => {
    document.documentElement.classList.add("stranica-spremna");
    if (!kostur) return;

    kostur.addEventListener("transitionend", () => kostur.remove(), { once: true });
    window.setTimeout(() => kostur.remove(), 800);
  }, cekanje);
}

/* ------------------------------------------------------------------ */
/* Mobilni izbornik                                                    */
/* ------------------------------------------------------------------ */
function pokreniMobilniIzbornik() {
  const prekidac = document.querySelector("[data-izbornik-prekidac]");
  const izbornik = document.querySelector("[data-mobilni-izbornik]");
  const zastor = document.querySelector("[data-izbornik-zastor]");
  if (!prekidac || !izbornik) return;

  const postavi = (otvoren) => {
    izbornik.hidden = !otvoren;
    if (zastor) zastor.hidden = !otvoren;
    prekidac.setAttribute("aria-expanded", String(otvoren));
    prekidac.setAttribute("aria-label", otvoren ? "Zatvori izbornik" : "Otvori izbornik");
  };

  prekidac.addEventListener("click", () => postavi(izbornik.hidden));
  zastor?.addEventListener("click", () => postavi(false));

  // Klik na vezu vodi na sidro — izbornik se mora sam maknuti, inace pokrije
  // sekciju do koje je upravo doveo.
  izbornik.addEventListener("click", (dogadaj) => {
    if (dogadaj.target.closest("a")) postavi(false);
  });

  document.addEventListener("keydown", (dogadaj) => {
    if (dogadaj.key === "Escape" && !izbornik.hidden) {
      postavi(false);
      prekidac.focus();
    }
  });
}

/* ------------------------------------------------------------------ */
/* Dijalog postavki                                                    */
/* ------------------------------------------------------------------ */
/*
 * Tema i jezik na mobitelu. Isti obrazac kao list s filtrima nize:
 * `showModal()`, klik na pozadinu zatvara, Esc dolazi od <dialog>-a.
 *
 * Klik na gumb teme NE zatvara dijalog — promjena teme se vidi iza njega, pa
 * bi zatvaranje sakrilo upravo ono zbog cega je korisnik gumb i pritisnuo.
 * Klik na jezik zatvara sam po sebi, jer vodi na drugu adresu.
 */
function pokreniPostavke() {
  const dijalog = document.querySelector("[data-postavke]");
  if (!dijalog) return;

  document.addEventListener("click", (dogadaj) => {
    if (dogadaj.target.closest("[data-postavke-otvori]")) {
      if (!dijalog.open) dijalog.showModal();
    } else if (dogadaj.target.closest("[data-postavke-zatvori]")) {
      dijalog.close();
    }
  });

  dijalog.addEventListener("click", (dogadaj) => {
    if (dogadaj.target === dijalog) dijalog.close();
  });
}

/* ------------------------------------------------------------------ */
/* Povratak na vrh                                                     */
/* ------------------------------------------------------------------ */
/*
 * `scroll-behavior: smooth` stoji na <html> (app.css, odjeljak 1) i vec ga
 * gasi `prefers-reduced-motion`, pa ovdje nema sto provjeravati — dovoljno je
 * ne navoditi `behavior` i pustiti da vrijedi ono sto pise u CSS-u.
 */
function pokreniPovratakNaVrh() {
  document.addEventListener("click", (dogadaj) => {
    if (!dogadaj.target.closest("[data-na-vrh]")) return;
    window.scrollTo({ top: 0 });
  });
}

/* ------------------------------------------------------------------ */
/* Mobilni list s filtrima                                             */
/* ------------------------------------------------------------------ */
function pokreniFiltarList(katalogSekcija) {
  const dijalog = document.querySelector("[data-filtar-dijalog]");
  const traka = document.querySelector("[data-filtar-traka]");
  if (!dijalog || !traka || !katalogSekcija) return;

  document.addEventListener("click", (dogadaj) => {
    if (dogadaj.target.closest("[data-filtar-otvori]")) {
      if (!dijalog.open) dijalog.showModal();
    } else if (dogadaj.target.closest("[data-filtar-zatvori]")) {
      dijalog.close();
    }
  });

  dijalog.addEventListener("click", (dogadaj) => {
    if (dogadaj.target === dijalog) dijalog.close();
  });

  // Traka se pojavljuje samo dok je katalog u vidokrugu. Da stalno stoji,
  // pokrivala bi podnozje i hero bez ijednog razloga.
  const promatrac = new IntersectionObserver(
    ([unos]) => {
      traka.hidden = !unos.isIntersecting;
    },
    { rootMargin: "-20% 0px -10% 0px" }
  );
  promatrac.observe(katalogSekcija);
}

/* ------------------------------------------------------------------ */
/* Pokretanje                                                          */
/* ------------------------------------------------------------------ */
async function pokreni() {
  pokreniTemu();
  pokreniZaglavlje();
  pokreniMobilniIzbornik();
  pokreniPostavke();
  pokreniPovratakNaVrh();
  pokreniSpy();
  pokreniOtkrivanje();
  pokreniRaspad();
  pokreniParalaksu();
  pokreniSkrolTraku();
  pokreniZivot();

  // Interaktivni dijelovi naslovnice. Svaka funkcija sama provjeri postoji li
  // njezin dio stranice, pa webshop i najam alata ne placu nista za njih.
  pokreniProvjeruUvjeta();
  pokreniNapredakObrasca();
  pokreniVrsteUpita();
  pokreniVideoNaHover();
  pokreniVideoNaInterval();

  const platno = pokreniPlatno(document.querySelector("[data-platno]"));
  naPromjenuTeme(() => platno.osvjeziBoje?.());

  document.addEventListener("click", (dogadaj) => {
    if (dogadaj.target.closest("[data-tema-gumb]")) obrniTemu();
  });

  // Kosarica postoji na svakoj stranici — brojac u zaglavlju mora biti tocan
  // i na naslovnici, gdje kataloga nema.
  const { pokreniLadicu } = await import("./ladica.js");
  pokreniLadicu();

  const katalogSekcija = document.querySelector("[data-trgovina]");
  if (katalogSekcija) {
    const { pokreniTrgovinu } = await import("./trgovina.js");
    await pokreniTrgovinu(katalogSekcija);
    pokreniFiltarList(katalogSekcija);
  }

  // Stranica jednog artikla. Ucitava se samo ondje gdje postoji, kao i
  // trgovina — naslovnica ne placa ni bajt ni za jedno ni za drugo.
  const proizvodSekcija = document.querySelector("[data-proizvod]");
  if (proizvodSekcija) {
    const { pokreniStranicuProizvoda } = await import("./proizvod.js");
    await pokreniStranicuProizvoda(proizvodSekcija);
  }

  // Iz ladice se trazi ponuda: obrazac zivi u sekciji kontakta na naslovnici,
  // pa se s kataloga do njega ide navigacijom. Jedan obrazac, jedno mjesto.
  document.addEventListener("hes:zatrazi-ponudu", () => {
    const obrazac = document.querySelector("[data-obrazac-upita]");
    if (obrazac) {
      obrazac.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      location.href = "/#kontakt";
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    pokreni()
      .then(kadaSeUcitaProzor)
      .catch((greska) => console.error("[main]", greska))
      .finally(sakrijKostur);
  }, { once: true });
} else {
  pokreni()
    .then(kadaSeUcitaProzor)
    .catch((greska) => console.error("[main]", greska))
    .finally(sakrijKostur);
}
