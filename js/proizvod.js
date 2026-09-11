/**
 * proizvod.js — stranica jednog artikla.
 *
 * Podjela posla je namjerna i vrijedi za svih 59 artikala, ne samo za onaj
 * koji je prvi napravljen:
 *
 *   HTML  nosi PROZU — opis, znacajke, tehnicke podatke. Toga nema ni u
 *         izvozu ni u katalogu, dolazi iz Loxoneove dokumentacije i pise se
 *         rukom po artiklu.
 *   ovdje dolazi sve sto katalog vec zna — cijena, stanje, fotografije, video,
 *         kosarica. Prepisati cijenu u HTML znacilo bi da se za pola godine
 *         razlikuje od one u mrezi, a nitko ne bi znao koja je tocna.
 *
 * Stranica se prepoznaje po `data-proizvod="<id>"` na korijenu sekcije.
 */

import { ucitajKatalog } from "./katalog.js";
import { t, formatCijene, formatDatuma, lokalno } from "./jezik.js";
import { adresaProizvoda } from "./adrese.js";
import { galerijaHtml, karuselHtml, dostupnostHtml } from "./pogledi.js";
import * as zauzetost from "./zauzetost.js";
import * as kosarica from "./kosarica.js";
import * as potvrda from "./potvrda.js";
import { otvori as otvoriLadicu } from "./ladica.js";
import { pokreniVideoNaHover } from "./interakcije.js";

const MAX_KOLICINA = 99;
const KOLIKO_PREPORUKA = 10;

export async function pokreniStranicuProizvoda(korijen) {
  if (!korijen) return;

  const id = korijen.dataset.proizvod;
  const galerijaSpremnik = korijen.querySelector("[data-galerija-nosac]");
  const cijenaSpremnik = korijen.querySelector("[data-cijena]");
  const stanjeSpremnik = korijen.querySelector("[data-stanje]");
  const akcijeSpremnik = korijen.querySelector("[data-akcije]");
  const preporukeSpremnik = document.querySelector("[data-preporuke]");

  let katalog;
  try {
    katalog = await ucitajKatalog();
  } catch (greska) {
    console.error("[proizvod]", greska);
    return;
  }

  const artikl = katalog.artikli.find((a) => a.id === id);
  if (!artikl) {
    console.error(`[proizvod] artikl ${id} nije u katalogu`);
    return;
  }

  /* ---------------------------------------------------------------- */
  /* Podaci iz kataloga                                                */
  /* ---------------------------------------------------------------- */
  if (galerijaSpremnik) galerijaSpremnik.innerHTML = galerijaHtml(artikl);

  if (cijenaSpremnik) {
    cijenaSpremnik.innerHTML = `<span class="cijena cijena--velika">${formatCijene(
      artikl.cijenaCents
    )}</span>`;
  }

  /*
   * Stanje. Za alat iz najma, cim zauzetost stigne iz baze, to je dostupnost
   * ("Slobodno od 18. 9.") i popis vec rezerviranih razdoblja — posjetitelj
   * tako bira datume znajuci sto je uzeto, prije nego otvori kalendar.
   */
  const crtajStanje = () => {
    if (!stanjeSpremnik) return;
    if (!artikl.aktivan) {
      stanjeSpremnik.innerHTML = `<span class="pilula">${t("katalog.nedostupno")}</span>`;
      return;
    }

    const dostupnost = artikl.osnova === "dan" ? dostupnostHtml(artikl.id) : null;
    if (dostupnost) {
      const rasponi = zauzetost.puniRasponi(artikl.id);
      const popis = rasponi
        .map((r) => (r.od === r.zadnji ? formatDatuma(r.od) : `${formatDatuma(r.od)} – ${formatDatuma(r.zadnji)}`))
        .join(", ");
      stanjeSpremnik.innerHTML = `${dostupnost}${
        popis ? `<p class="jedva zauzetost">${t("najam.vec_rezervirano")} <span class="monr">${popis}</span></p>` : ""
      }`;
      return;
    }

    stanjeSpremnik.innerHTML = artikl.naStanju
      ? `<span class="pilula pilula--stanje">${t("katalog.na_stanju")}</span>`
      : `<span class="pilula">${t("katalog.na_upit")}</span>`;
  };

  crtajStanje();
  if (artikl.osnova === "dan" && artikl.aktivan) {
    zauzetost.naPromjenu(crtajStanje);
    zauzetost.ucitaj();
  }

  /* ---------------------------------------------------------------- */
  /* Kolicina i kosarica                                               */
  /* ---------------------------------------------------------------- */
  let kolicina = 1;

  function crtajAkcije() {
    if (!akcijeSpremnik) return;
    // Skriveni artikl se ne moze naruciti. Stranica ostaje (poveznica na nju
    // mozda stoji negdje vani), ali bez gumba koji bi ga stavio u kosaricu.
    if (!artikl.aktivan) {
      akcijeSpremnik.innerHTML = "";
      return;
    }
    const jeDodan = potvrda.jePotvrden(artikl.id);

    akcijeSpremnik.innerHTML = `
      <div class="brojac brojac--veliki">
        <button type="button" data-akcija="manje" aria-label="${t("kosarica.manje")}" ${kolicina <= 1 ? "disabled" : ""}>−</button>
        <span class="monr" data-prikaz-kolicine>${kolicina}</span>
        <button type="button" data-akcija="vise" aria-label="${t("kosarica.vise")}">+</button>
      </div>
      <button class="gumb ${jeDodan ? "gumb--sporedni" : "gumb--glavni"} gumb--siroki" type="button" data-akcija="dodaj">
        ${jeDodan ? t("katalog.dodano") : t("katalog.dodajte")}
      </button>`;
  }

  akcijeSpremnik?.addEventListener("click", (dogadaj) => {
    const meta = dogadaj.target.closest("[data-akcija]");
    if (!meta) return;

    if (meta.dataset.akcija === "manje" || meta.dataset.akcija === "vise") {
      const novo = Math.max(
        1,
        Math.min(kolicina + (meta.dataset.akcija === "vise" ? 1 : -1), MAX_KOLICINA)
      );
      if (novo === kolicina) return;
      kolicina = novo;
      // Samo brojka i stanje gumba: precrtavanje bi maknulo gumb ispod prsta
      // usred niza pritisaka na "+".
      const prikaz = akcijeSpremnik.querySelector("[data-prikaz-kolicine]");
      if (prikaz) prikaz.textContent = String(kolicina);
      const manje = akcijeSpremnik.querySelector('[data-akcija="manje"]');
      if (manje) manje.disabled = kolicina <= 1;
      return;
    }

    if (meta.dataset.akcija === "dodaj") {
      // Kao i u katalogu: gumb uvijek dodaje, a `kosarica.dodaj` sam zbraja
      // kolicinu ako artikl vec stoji unutra.
      if (!kosarica.dodaj(artikl, { kolicina }).ok) return;
      potvrda.potvrdi(artikl.id);
      // Najam bez datuma se ne moze procijeniti, pa se ladica otvara odmah —
      // tu su polja datuma. Isto kao na /najam-alata (js/trgovina.js).
      if (artikl.osnova === "dan") otvoriLadicu();
    }
  });

  kosarica.naPromjenu(crtajAkcije);
  potvrda.naPromjenu(crtajAkcije);
  crtajAkcije();

  /* ---------------------------------------------------------------- */
  /* Galerija                                                          */
  /* ---------------------------------------------------------------- */
  /*
   * Prebacivanje kadra je skrivanje i pokazivanje, ne ponovno crtanje: video
   * koji se precrta gubi mjesto reprodukcije, pa bi povratak s fotografije na
   * video vratio isjecak na pocetak.
   */
  galerijaSpremnik?.addEventListener("click", (dogadaj) => {
    const gumb = dogadaj.target.closest('[data-akcija="kadar"]');
    if (!gumb) return;

    const kljuc = gumb.dataset.vrijednost;
    for (const kadar of galerijaSpremnik.querySelectorAll("[data-kadar]")) {
      kadar.hidden = kadar.dataset.kadar !== kljuc;
    }
    for (const slicica of galerijaSpremnik.querySelectorAll(".galerija__slicica")) {
      const odabrana = slicica === gumb;
      slicica.classList.toggle("je-odabran", odabrana);
      slicica.setAttribute("aria-pressed", String(odabrana));
    }

    // Video se pauzira kad se s njega ode; inace svira u pozadini fotografije
    // koja je upravo dosla na njegovo mjesto.
    const video = galerijaSpremnik.querySelector("[data-galerija-video]");
    if (video && kljuc !== "video") video.pause();
  });

  /*
   * Klik po kadru pauzira i nastavlja.
   *
   * Video vise nema `controls` (klijentov zahtjev), a sam se pokrece svakih
   * deset sekundi. Bez ovoga bi jedini nacin da se zaustavi bio otici na drugi
   * kadar. `data-svira` se brise pri pauzi da ga ciklus u js/interakcije.js
   * moze ponovno pokrenuti kad dode red.
   */
  galerijaSpremnik?.addEventListener("click", (dogadaj) => {
    const video = dogadaj.target.closest("[data-galerija-video]");
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
      delete video.dataset.svira;
    }
  });

  /* ---------------------------------------------------------------- */
  /* Preporuke                                                         */
  /* ---------------------------------------------------------------- */
  /*
   * Redoslijed preporuka: ista podskupina, pa ista skupina, pa ostatak
   * kataloga PO REDU SKUPINA.
   *
   * "Cesto kupljeno zajedno" ovdje ne postoji — nema narudzbi iz kojih bi se
   * to izracunalo, a izmisliti takvu vezu znacilo bi tvrditi nesto sto nitko
   * nije rekao. Ono sto POSTOJI je redoslijed skupina iz hes-content.md §4, i
   * on nije abecedan nego zamisljen: Miniserveri, pa Prosirenja, pa tipkala,
   * pa senzori — redom kojim se sustav i gradi.
   *
   * Zato ostatak ide tim redom, a ne po cijeni. Uz Miniserver (skupina 0) tako
   * dolaze prosirenja (skupina 1), sto je i ono sto se uz njega stvarno
   * ugraduje. Sortiranje po cijeni je davalo stezaljke od 12 € uz jedinicu od
   * 655 € — tehnicki tocan popis koji nikome ne pomaze.
   */
  if (preporukeSpremnik) {
    const podskupine = new Set(
      artikl.kategorije.filter((k) => katalog.poId.get(k)?.roditeljId)
    );
    const skupine = new Set(artikl.kategorije.filter((k) => !katalog.poId.get(k)?.roditeljId));

    const tezina = (drugi) => {
      if (drugi.kategorije.some((k) => podskupine.has(k))) return 0;
      if (drugi.kategorije.some((k) => skupine.has(k))) return 1;
      return 2;
    };

    /** Redoslijed nadredene skupine artikla; sluzi kao druga razina sortiranja. */
    const redSkupine = (drugi) => {
      let najmanji = Infinity;
      for (const kljuc of drugi.kategorije) {
        const kategorija = katalog.poId.get(kljuc);
        if (kategorija && !kategorija.roditeljId) {
          najmanji = Math.min(najmanji, kategorija.redoslijed);
        }
      }
      return najmanji === Infinity ? 99 : najmanji;
    };

    // Treca razina: redoslijed iz kataloga, da popis bude stabilan izmedu
    // ucitavanja umjesto da ovisi o redu kojim je JSON slozen.
    const uKatalogu = new Map(katalog.artikli.map((a, i) => [a.id, i]));

    // Iz iste zalihe: uz Loxone artikl Loxone, uz alat alati. Kupnja po
    // komadu i najam po danu u istom karuselu bili bi dvije ponude u jednoj.
    const preporuke = katalog.artikli
      .filter((a) => a.vrsta === artikl.vrsta && a.id !== artikl.id && a.aktivan)
      .sort(
        (x, y) =>
          tezina(x) - tezina(y) ||
          redSkupine(x) - redSkupine(y) ||
          uKatalogu.get(x.id) - uKatalogu.get(y.id)
      )
      .slice(0, KOLIKO_PREPORUKA);

    const kolicine = new Map();
    const podskupinaZa = (drugi) => {
      for (const kljuc of drugi.kategorije) {
        const kategorija = katalog.poId.get(kljuc);
        if (kategorija?.roditeljId) return lokalno(kategorija.naziv);
      }
      return null;
    };

    const crtajPreporuke = () => {
      preporukeSpremnik.innerHTML = karuselHtml(preporuke, {
        potvrden: (kljuc) => potvrda.jePotvrden(kljuc),
        kolicine,
        podskupinaZa,
        osnova: artikl.osnova === "dan" ? "dan" : "kom",
        // Svih 59 Loxone artikala i 16 alata ima svoju stranicu; tablice su u
        // js/adrese.js. Artikl kojeg u tablici nema dobiva null i kartica
        // ostaje bez poveznice umjesto da vodi na 404.
        veza: adresaProizvoda,
        stanjeZa: artikl.osnova === "dan" ? (drugi) => dostupnostHtml(drugi.id) : null,
      });
      pokreniVideoNaHover(preporukeSpremnik);
      pokreniKarusel(preporukeSpremnik.querySelector("[data-karusel]"));
    };

    // Kartice u karuselu imaju iste `data-akcija` atribute kao one u mrezi,
    // pa ovdje treba isti slusac — trgovina.js na ovoj stranici ne postoji.
    preporukeSpremnik.addEventListener("click", (dogadaj) => {
      const meta = dogadaj.target.closest("[data-akcija]");
      if (!meta) return;
      const { akcija, artikl: kljuc } = meta.dataset;

      if (akcija === "kolicina-manje" || akcija === "kolicina-vise") {
        const sada = kolicine.get(kljuc) ?? 1;
        const novo = Math.max(1, Math.min(sada + (akcija === "kolicina-vise" ? 1 : -1), MAX_KOLICINA));
        if (novo === sada) return;
        kolicine.set(kljuc, novo);
        const prikaz = preporukeSpremnik.querySelector(`[data-kolicina="${CSS.escape(kljuc)}"]`);
        if (prikaz) prikaz.textContent = String(novo);
        const manje = preporukeSpremnik.querySelector(
          `[data-akcija="kolicina-manje"][data-artikl="${CSS.escape(kljuc)}"]`
        );
        if (manje) manje.disabled = novo <= 1;
        return;
      }

      if (akcija === "dodaj") {
        const nadeni = preporuke.find((a) => a.id === kljuc);
        if (!nadeni) return;
        if (kosarica.dodaj(nadeni, { kolicina: kolicine.get(nadeni.id) ?? 1 }).ok) {
          potvrda.potvrdi(nadeni.id);
          if (nadeni.osnova === "dan") otvoriLadicu();
        }
      }
    });

    kosarica.naPromjenu(crtajPreporuke);
    potvrda.naPromjenu(crtajPreporuke);
    if (artikl.osnova === "dan") zauzetost.naPromjenu(crtajPreporuke);
    crtajPreporuke();
  }
}

/* ------------------------------------------------------------------ */
/* Karusel                                                             */
/* ------------------------------------------------------------------ */
/**
 * Strelice su DOPUNA klizanju, ne zamjena za njega.
 *
 * Staza je obican element koji klizi kotacicem, povlacenjem i tipkovnicom i
 * bez ijednog reda ovog koda. Strelice se dodaju tek ovdje, i samo kad ima
 * sto pomicati — na sirokom ekranu gdje sve kartice stanu, dva gumba koja ne
 * rade nista su gori od nijednog.
 */
function pokreniKarusel(karusel) {
  if (!karusel) return;
  const staza = karusel.querySelector("[data-karusel-staza]");
  if (!staza) return;

  const natrag = document.createElement("button");
  const naprijed = document.createElement("button");
  for (const [gumb, smjer, natpis] of [
    [natrag, -1, t("proizvod.prethodni")],
    [naprijed, 1, t("proizvod.sljedeci")],
  ]) {
    gumb.type = "button";
    gumb.className = `karusel__strelica karusel__strelica--${smjer < 0 ? "natrag" : "naprijed"}`;
    gumb.setAttribute("aria-label", natpis);
    gumb.innerHTML =
      smjer < 0
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>';
    gumb.addEventListener("click", () => {
      // Pomak je sirina jedne kartice: "jedan zaslon" preskoci artikle preko
      // kojih se posjetitelj nikad nije ni prosao.
      const kartica = staza.querySelector(".proizvod");
      const korak = kartica ? kartica.getBoundingClientRect().width + 16 : 260;
      staza.scrollBy({ left: korak * smjer, behavior: "smooth" });
    });
    karusel.appendChild(gumb);
  }

  const osvjezi = () => {
    const kraj = staza.scrollWidth - staza.clientWidth;
    const imaSto = kraj > 4;
    karusel.classList.toggle("karusel--klizi", imaSto);
    natrag.disabled = !imaSto || staza.scrollLeft <= 2;
    naprijed.disabled = !imaSto || staza.scrollLeft >= kraj - 2;
  };

  staza.addEventListener("scroll", osvjezi, { passive: true });
  window.addEventListener("resize", osvjezi, { passive: true });
  osvjezi();
}
