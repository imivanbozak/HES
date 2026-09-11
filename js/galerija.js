/**
 * galerija.js — galerija radova (/galerija): filtri, stupci i svjetlo.
 *
 * Podaci su u assets/galerija.json, koji gradi scripts/galerija.mjs iz mapa
 * s fotografijama. Filtri su dvije razine, kao na /webshop: usluga, pa
 * projekt unutar nje. Stanje stoji u adresi (?usluga=zavrsni&projekt=...),
 * pa se filtrirana galerija moze poslati kao poveznica.
 *
 * STUPCI, a ne CSS `columns`. `columns` puni stupac po stupac, pa bi druga
 * fotografija projekta zavrsila na dnu prvog stupca, daleko od prve. Ovdje
 * svaka fotografija ide u trenutno najkraci stupac, pa se cita lijevo-desno,
 * red po red. Visina se zna unaprijed iz manifesta, pa raspored ne ceka
 * ucitavanje slika i ne skace.
 *
 * SVJETLO je nativni <dialog> kao ladica i postavke: Esc, zamka fokusa i
 * pozadina dolaze besplatno. Strelice lijevo-desno, Home/End, povlacenje
 * prstom, i preducitavanje susjednih fotografija u formatu i sirini koje je
 * preglednik vec izabrao za trenutnu — ne naslijepo.
 */

import { t, mnozina, lokalno } from "./jezik.js";

const MANIFEST = "/assets/galerija.json";
const VELICINE_MREZE = "(max-width: 599px) 92vw, (max-width: 1023px) 46vw, 31vw";
const PORETAK_USLUGA = ["industrijske", "zavrsni", "kucne", "loxone"];

const esc = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Rasporedi slike u `broj` stupaca, svaku u trenutno najkraci.
 *
 * Kod jednakih visina pobjeduje lijevi stupac, pa prvi red ide redom
 * lijevo-desno. Visina je omjer visina/sirina — dovoljno za usporedbu, jer
 * su svi stupci jednako siroki. Cista funkcija; provjerava je
 * scripts/provjere.mjs.
 */
export function rasporedi(slike, broj) {
  const stupci = Array.from({ length: Math.max(1, broj) }, () => ({ visina: 0, slike: [] }));
  for (const slika of slike) {
    let najkraci = stupci[0];
    for (const stupac of stupci) if (stupac.visina < najkraci.visina) najkraci = stupac;
    najkraci.slike.push(slika);
    najkraci.visina += slika.visina / slika.sirina;
  }
  return stupci.map((stupac) => stupac.slike);
}

const skup = (slika, format) =>
  slika.sirine.map((s) => `/assets/galerija/${slika.id}-${s}.${format} ${s}w`).join(", ");

function slikaHtml(slika, { velicine, alt, ucitavanje = "lazy" }) {
  const najveca = slika.sirine[slika.sirine.length - 1];
  const visina = Math.round((slika.visina / slika.sirina) * najveca);
  return `
    <picture>
      <source type="image/avif" srcset="${skup(slika, "avif")}" sizes="${velicine}">
      <img src="/assets/galerija/${slika.id}-${najveca}.webp" srcset="${skup(slika, "webp")}" sizes="${velicine}"
           alt="${esc(alt)}" width="${najveca}" height="${visina}" loading="${ucitavanje}" decoding="async">
    </picture>`;
}

export async function pokreniGaleriju(korijen) {
  const uslugeEl = korijen.querySelector("[data-radovi-usluge]");
  const projektiEl = korijen.querySelector("[data-radovi-projekti]");
  const sazetak = korijen.querySelector("[data-radovi-sazetak]");
  const mreza = korijen.querySelector("[data-radovi-mreza]");
  const svjetlo = document.querySelector("[data-svjetlo]");

  let manifest;
  try {
    const odgovor = await fetch(MANIFEST, { cache: "no-cache" });
    if (!odgovor.ok) throw new Error(`HTTP ${odgovor.status}`);
    manifest = await odgovor.json();
  } catch (greska) {
    console.error("[galerija]", greska);
    mreza.innerHTML = `<p class="tiho">${esc(t("galerija.greska"))}</p>`;
    return;
  }

  const projekti = new Map((manifest.projekti ?? []).map((p) => [p.id, p]));
  const sve = (manifest.slike ?? []).filter((s) => projekti.has(s.projekt));
  if (!sve.length) {
    mreza.innerHTML = `<p class="tiho">${esc(t("galerija.prazno"))}</p>`;
    return;
  }

  // Redni broj unutar projekta, za zamjenski opis "Stan u Zagrebu — 3".
  const brojac = new Map();
  for (const slika of sve) {
    brojac.set(slika.projekt, (brojac.get(slika.projekt) ?? 0) + 1);
    slika.redni = brojac.get(slika.projekt);
  }

  const nazivProjekta = (slika) => lokalno(projekti.get(slika.projekt).naziv);
  const opis = (slika) => lokalno(slika.alt) || `${nazivProjekta(slika)} — ${slika.redni}`;

  /* ---------------------------------------------------------------- */
  /* Stanje u adresi                                                   */
  /* ---------------------------------------------------------------- */
  const parametri = new URLSearchParams(location.search);
  let stanje = { usluga: parametri.get("usluga"), projekt: parametri.get("projekt") };
  if (!PORETAK_USLUGA.includes(stanje.usluga)) stanje.usluga = null;
  if (stanje.projekt && !projekti.has(stanje.projekt)) stanje.projekt = null;
  if (stanje.projekt) stanje.usluga = projekti.get(stanje.projekt).usluga;

  const uAdresu = () => {
    const nova = new URLSearchParams(location.search);
    for (const [kljuc, vrijednost] of Object.entries(stanje)) {
      if (vrijednost) nova.set(kljuc, vrijednost);
      else nova.delete(kljuc);
    }
    const upit = nova.toString();
    history.replaceState(null, "", upit ? `${location.pathname}?${upit}` : location.pathname);
  };

  /* ---------------------------------------------------------------- */
  /* Crtanje                                                           */
  /* ---------------------------------------------------------------- */
  const siroko = window.matchMedia("(min-width: 1024px)");
  const srednje = window.matchMedia("(min-width: 600px)");
  const brojStupaca = () => (siroko.matches ? 3 : srednje.matches ? 2 : 1);
  let stupaca = brojStupaca();
  let prikazane = [];

  const cip = (atribut, vrijednost, ime, broj, odabran) => `
    <button class="radovi__cip" type="button" ${atribut}="${esc(vrijednost)}" aria-pressed="${odabran}">
      ${esc(ime)}${broj === null ? "" : ` <span>${broj}</span>`}
    </button>`;

  function crtaj() {
    const poUsluzi = new Map();
    for (const slika of sve) {
      const usluga = projekti.get(slika.projekt).usluga;
      poUsluzi.set(usluga, (poUsluzi.get(usluga) ?? 0) + 1);
    }

    uslugeEl.innerHTML =
      cip("data-usluga", "", t("galerija.sve"), sve.length, !stanje.usluga) +
      PORETAK_USLUGA.filter((u) => poUsluzi.has(u))
        .map((u) => cip("data-usluga", u, t(`usluga.${u}`), poUsluzi.get(u), stanje.usluga === u))
        .join("");

    // Projekti se nude tek unutar usluge, i samo kad ih ima vise od jednog —
    // jedan cip "Svi projekti" uz jedini projekt ne bira nista.
    const projektiUsluge = stanje.usluga ? [...projekti.values()].filter((p) => p.usluga === stanje.usluga) : [];
    projektiEl.innerHTML =
      projektiUsluge.length > 1
        ? cip("data-projekt", "", t("galerija.svi_projekti"), null, !stanje.projekt) +
          projektiUsluge
            .map((p) =>
              cip("data-projekt", p.id, `${lokalno(p.naziv)}${p.godina ? ` · ${p.godina}` : ""}`, null, stanje.projekt === p.id)
            )
            .join("")
        : "";

    prikazane = sve.filter(
      (s) =>
        (!stanje.usluga || projekti.get(s.projekt).usluga === stanje.usluga) &&
        (!stanje.projekt || s.projekt === stanje.projekt)
    );

    const brojProjekata = new Set(prikazane.map((s) => s.projekt)).size;
    sazetak.textContent =
      `${prikazane.length} ${mnozina("galerija.fotografija", prikazane.length)} · ` +
      `${brojProjekata} ${mnozina("galerija.projekt", brojProjekata)}`;

    crtajMrezu();
    uAdresu();
  }

  function crtajMrezu() {
    const stupci = rasporedi(
      prikazane.map((slika, indeks) => ({ ...slika, indeks })),
      stupaca
    );
    mreza.style.setProperty("--stupaca", String(stupaca));
    mreza.innerHTML = stupci
      .map(
        (stupac) => `
        <div class="radovi-mreza__stupac">
          ${stupac
            .map(
              (slika) => `
            <button class="radovi-mreza__slika" type="button" data-indeks="${slika.indeks}"
                    aria-label="${esc(t("galerija.otvori", { opis: opis(slika) }))}">
              ${slikaHtml(slika, { velicine: VELICINE_MREZE, alt: "", ucitavanje: slika.indeks < 6 ? "eager" : "lazy" })}
              <span class="radovi-mreza__natpis" aria-hidden="true">${esc(nazivProjekta(slika))}</span>
            </button>`
            )
            .join("")}
        </div>`
      )
      .join("");
  }

  const promjenaSirine = () => {
    const novo = brojStupaca();
    if (novo === stupaca) return;
    stupaca = novo;
    crtajMrezu();
  };
  siroko.addEventListener("change", promjenaSirine);
  srednje.addEventListener("change", promjenaSirine);

  uslugeEl.addEventListener("click", (dogadaj) => {
    const gumb = dogadaj.target.closest("[data-usluga]");
    if (!gumb) return;
    stanje = { usluga: gumb.dataset.usluga || null, projekt: null };
    crtaj();
  });

  projektiEl.addEventListener("click", (dogadaj) => {
    const gumb = dogadaj.target.closest("[data-projekt]");
    if (!gumb) return;
    stanje = { ...stanje, projekt: gumb.dataset.projekt || null };
    crtaj();
  });

  mreza.addEventListener("click", (dogadaj) => {
    const gumb = dogadaj.target.closest("[data-indeks]");
    if (gumb) otvori(Number(gumb.dataset.indeks), gumb);
  });

  crtaj();

  /* ---------------------------------------------------------------- */
  /* Svjetlo                                                           */
  /* ---------------------------------------------------------------- */
  if (!svjetlo) return;

  const kadar = svjetlo.querySelector("[data-svjetlo-kadar]");
  const natpis = svjetlo.querySelector("[data-svjetlo-natpis]");
  const brojacEl = svjetlo.querySelector("[data-svjetlo-brojac]");
  const natrag = svjetlo.querySelector('[data-svjetlo-korak="-1"]');
  const naprijed = svjetlo.querySelector('[data-svjetlo-korak="1"]');
  const zatvori = svjetlo.querySelector("[data-svjetlo-zatvori]");

  natrag.setAttribute("aria-label", t("galerija.prethodna"));
  naprijed.setAttribute("aria-label", t("galerija.sljedeca"));
  zatvori.setAttribute("aria-label", t("galerija.zatvori"));

  let trenutna = -1;
  let povratak = null;

  function prikazi(indeks) {
    const novi = Math.max(0, Math.min(indeks, prikazane.length - 1));
    if (novi === trenutna && kadar.childElementCount) return;
    trenutna = novi;

    const slika = prikazane[trenutna];
    const projekt = projekti.get(slika.projekt);
    kadar.innerHTML = slikaHtml(slika, { velicine: "100vw", alt: opis(slika), ucitavanje: "eager" });
    natpis.textContent = [lokalno(projekt.naziv), projekt.mjesto, projekt.godina].filter(Boolean).join(" · ");
    brojacEl.textContent = t("galerija.brojac", { i: trenutna + 1, n: prikazane.length });
    natrag.disabled = trenutna === 0;
    naprijed.disabled = trenutna === prikazane.length - 1;

    // Susjedi se preducitaju u onom formatu i sirini koje je preglednik
    // izabrao za ovu fotografiju — AVIF ili WebP, i sirina prema zaslonu.
    const img = kadar.querySelector("img");
    img.addEventListener(
      "load",
      () => {
        const izabrano = img.currentSrc.match(/-(\d+)\.(avif|webp)$/);
        if (!izabrano) return;
        const [, sirina, format] = izabrano;
        for (const susjed of [prikazane[trenutna - 1], prikazane[trenutna + 1]]) {
          if (!susjed) continue;
          const s = susjed.sirine.includes(Number(sirina)) ? sirina : susjed.sirine[susjed.sirine.length - 1];
          new Image().src = `/assets/galerija/${susjed.id}-${s}.${format}`;
        }
      },
      { once: true }
    );
  }

  function otvori(indeks, gumb) {
    povratak = gumb;
    trenutna = -1;
    prikazi(indeks);
    svjetlo.showModal();
    zatvori.focus();
  }

  svjetlo.addEventListener("close", () => {
    kadar.innerHTML = "";
    trenutna = -1;
    povratak?.focus();
  });

  // Povlacenje prstom. Nakon povlacenja slijedi i `click` — on ne smije
  // zatvoriti svjetlo samo zato sto je prst krenuo s pozadine.
  let dodir = null;
  let upravoPovuceno = false;
  kadar.addEventListener("pointerdown", (dogadaj) => {
    dodir = { x: dogadaj.clientX, y: dogadaj.clientY };
  });
  kadar.addEventListener("pointerup", (dogadaj) => {
    if (!dodir) return;
    const dx = dogadaj.clientX - dodir.x;
    const dy = dogadaj.clientY - dodir.y;
    dodir = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      upravoPovuceno = true;
      prikazi(trenutna + (dx < 0 ? 1 : -1));
    }
  });

  svjetlo.addEventListener("click", (dogadaj) => {
    if (upravoPovuceno) {
      upravoPovuceno = false;
      return;
    }
    const korak = dogadaj.target.closest("[data-svjetlo-korak]");
    if (korak) {
      prikazi(trenutna + Number(korak.dataset.svjetloKorak));
      return;
    }
    // Klik na zatvaranje, na pozadinu dijaloga ili na prazan dio kadra oko
    // fotografije zatvara; klik na samu fotografiju ne.
    if (dogadaj.target.closest("[data-svjetlo-zatvori]") || dogadaj.target === svjetlo || dogadaj.target === kadar) {
      svjetlo.close();
    }
  });

  svjetlo.addEventListener("keydown", (dogadaj) => {
    const koraci = { ArrowLeft: trenutna - 1, ArrowRight: trenutna + 1, Home: 0, End: prikazane.length - 1 };
    if (!(dogadaj.key in koraci)) return;
    dogadaj.preventDefault();
    prikazi(koraci[dogadaj.key]);
  });
}
