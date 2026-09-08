/**
 * trgovina.js — stranica kataloga.
 *
 * Isti modul pokrece i /webshop i /najam-alata. Razliku nosi jedan atribut u
 * HTML-u (`data-trgovina="loxone" | "alat"`), jer je sve ostalo doista isto:
 * jedan rail, jedna tablica, jedna kosarica.
 *
 * Filtriranje je na klijentu i to je namjerno. 75 artikala stane u 40 kB;
 * odlazak na posluzitelj po svakom potvrdnom okviru bio bi sporiji, trosio bi
 * mrezu i ne bi radio kad Supabase nije podesen.
 */

import { ucitajKatalog } from "./katalog.js";
import { adresaProizvoda } from "./adrese.js";
import { stvoriFiltre } from "./filtri.js";
import {
  railHtml,
  tablicaHtml,
  mrezaHtml,
  trakaKategorijaHtml,
  trakaPodskupinaHtml,
  sBrojem,
  esc,
} from "./pogledi.js";
import * as kosarica from "./kosarica.js";
import { otvori as otvoriLadicu } from "./ladica.js";
import { pokreniOtkrivanje } from "./pokret.js";
import { pokreniVideoNaHover } from "./interakcije.js";

const MAX_KOLICINA = 99;

export async function pokreniTrgovinu(korijen) {
  if (!korijen) return;

  const vrsta = korijen.dataset.trgovina;
  const railSpremnik = korijen.querySelector("[data-rail]");
  const popisSpremnik = korijen.querySelector("[data-popis]");
  const sazetakSpremnik = korijen.querySelector("[data-sazetak]");
  const katTraka = korijen.querySelector("[data-kat-traka]");
  const podTraka = korijen.querySelector("[data-pod-traka]");
  const trazilica = korijen.querySelector("[data-trazilica]");
  const listSpremnik = document.querySelector("[data-filtar-list]");
  const filtarBrojac = document.querySelector("[data-filtar-brojac]");

  // Mreza kartica ima kolicinu PRIJE dodavanja u kosaricu; tablica najma nema.
  // Broj zivi ovdje, a ne u kosarici: dok se ne pritisne gumb, kosarica za
  // njega ne zna, inace bi svaki dodir na "+" mijenjao njezin sadrzaj.
  const kolicine = new Map();

  popisSpremnik.innerHTML = '<p class="tiho">Učitavanje kataloga…</p>';

  let katalog;
  try {
    katalog = await ucitajKatalog();
  } catch (greska) {
    console.error("[trgovina]", greska);
    popisSpremnik.innerHTML = `
      <div class="prazno">
        <p class="naslov-3">Katalog se trenutno ne može učitati.</p>
        <p class="tiho">Pokušajte osvježiti stranicu ili nam se javite na
          <a href="mailto:alen.hranj@hes.hr">alen.hranj@hes.hr</a>.</p>
      </div>`;
    return;
  }

  const filtri = stvoriFiltre({ katalog, vrsta, naPromjenu: crtaj });

  /**
   * Naziv podskupine artikla — drugi redak kartice.
   *
   * Screenshot na tom mjestu ima "Item No.: 100038". Nas katalog nema Loxone
   * kataloske brojeve (id-evi su WooCommerce, a `sku` je kod vecine Loxone
   * artikala doslovna kopija naziva), pa bi taj redak bio ili prazan ili
   * ponovljeni naslov. Podskupina je stvaran podatak i kaze ono sto broj
   * artikla kupcu ionako ne kaze.
   */
  const podskupinaZa = (artikl) => {
    for (const id of artikl.kategorije) {
      const kategorija = katalog.poId.get(id);
      if (kategorija?.roditeljId) return kategorija.naziv.hr;
    }
    return null;
  };

  function crtaj(popis, stanje) {
    if (vrsta === "loxone") {
      popisSpremnik.innerHTML = mrezaHtml(popis, {
        uKosarici: (id) => kosarica.sadrzi(id),
        kolicine,
        podskupinaZa,
        // Ime i fotografija vode na stranicu artikla; gumbi za kolicinu i
        // kosaricu ostaju izvan poveznice, pa klik na "+" ne odvodi s kataloga.
        // Alati nemaju svoju stranicu i adresaProizvoda im vraca null.
        veza: adresaProizvoda,
      });
      if (katTraka) {
        // Traka skupina klizi vodoravno na uskom ekranu. Precrtavanje je vraca
        // na pocetak, pa bi svaki odabir skupine odgurao odabranu ikonu izvan
        // vidokruga — tocno onu koju je posjetitelj upravo dodirnuo.
        const popisIkona = katTraka.querySelector(".kat-traka__popis");
        const pomak = popisIkona ? popisIkona.scrollLeft : 0;
        katTraka.innerHTML = trakaKategorijaHtml(katalog, filtri, vrsta);
        const novi = katTraka.querySelector(".kat-traka__popis");
        if (novi) novi.scrollLeft = pomak;
      }
      if (podTraka) podTraka.innerHTML = trakaPodskupinaHtml(katalog, filtri, popis);

      // Kadar kartice svira na hover. Vezanje ide na SVJEZE crtanje, jer su
      // prethodni <video> cvorovi upravo zamijenjeni.
      pokreniVideoNaHover(popisSpremnik);
    } else {
      popisSpremnik.innerHTML = tablicaHtml(popis, {
        osnova: vrsta === "alat" ? "dan" : "kom",
        uKosarici: (id) => kosarica.sadrzi(id),
      });

      const railKod = railHtml(katalog, filtri, vrsta);
      if (railSpremnik) railSpremnik.innerHTML = railKod;
      if (listSpremnik) listSpremnik.innerHTML = railKod;
      if (sazetakSpremnik) sazetakSpremnik.innerHTML = sazetakHtml(popis, stanje);
    }

    if (filtarBrojac) {
      const broj = filtri.brojAktivnih();
      filtarBrojac.textContent = broj ? String(broj) : "";
      filtarBrojac.hidden = broj === 0;
    }

    // Otkrivanje se veze na novo tijelo popisa: staro je upravo zamijenjeno,
    // pa bi promatrac s njega gadao cvorove kojih vise nema.
    pokreniOtkrivanje(popisSpremnik);
  }

  function sazetakHtml(popis, stanje) {
    const raspon = katalog.raspon(popis);
    const aktivni = [];

    if (stanje.podskupina) {
      aktivni.push({ kljuc: "podskupina", ime: katalog.poId.get(stanje.podskupina)?.naziv.hr });
    } else if (stanje.skupina) {
      aktivni.push({ kljuc: "skupina", ime: katalog.poId.get(stanje.skupina)?.naziv.hr });
    }
    if (stanje.marka) aktivni.push({ kljuc: "marka", ime: stanje.marka });
    if (stanje.samoNaStanju) aktivni.push({ kljuc: "stanje", ime: "Na stanju" });

    const jedinica = vrsta === "alat" ? " / dan" : "";
    const cijena = (c) => `${Math.trunc(c / 100)},${String(c % 100).padStart(2, "0")} €`;

    return `
      <div class="sazetak__lijevo">
        <span class="oznaka">${sBrojem(popis.length)}</span>
        ${raspon ? `<span class="jedva monr">${cijena(raspon.od)} – ${cijena(raspon.do)}${jedinica}</span>` : ""}
      </div>

      ${
        aktivni.length
          ? `<ul class="cipovi">
              ${aktivni
                .map(
                  (stavka) => `
                <li>
                  <button class="cip" type="button" data-akcija="makni-filtar" data-kljuc="${stavka.kljuc}">
                    ${esc(stavka.ime)}
                    <span aria-hidden="true">×</span>
                    <span class="samo-citac">ukloni filtar</span>
                  </button>
                </li>`
                )
                .join("")}
            </ul>`
          : ""
      }

      <label class="sortiranje">
        <span class="samo-citac">Poredaj</span>
        <select data-akcija="sort">
          <option value="zadano"${stanje.sort === "zadano" ? " selected" : ""}>Zadano</option>
          <option value="cijena-asc"${stanje.sort === "cijena-asc" ? " selected" : ""}>Cijena rastuće</option>
          <option value="cijena-desc"${stanje.sort === "cijena-desc" ? " selected" : ""}>Cijena padajuće</option>
          <option value="naziv-asc"${stanje.sort === "naziv-asc" ? " selected" : ""}>Naziv A–Ž</option>
        </select>
      </label>`;
  }

  /* ---------------------------------------------------------------- */
  /* Dogadaji                                                          */
  /* ---------------------------------------------------------------- */
  // Jedan slusac na dokumentu pokriva i rail na desktopu i isti HTML unutar
  // donjeg lista na mobitelu, bez da se ista veze dvaput.
  /* ---------------------------------------------------------------- */
  /* Padajuci izbornik sortiranja                                      */
  /* ---------------------------------------------------------------- */
  const zatvoriSort = () => {
    const izbornik = korijen.querySelector("[data-sort-izbornik]");
    if (!izbornik) return;
    izbornik.querySelector(".sort__popis")?.setAttribute("hidden", "");
    izbornik.querySelector(".sort__gumb")?.setAttribute("aria-expanded", "false");
  };

  // Klik bilo gdje izvan izbornika ga zatvara. Slusac je u fazi hvatanja da
  // odradi posao i kad se klikne po necemu sto samo sebe precrta.
  document.addEventListener("click", (dogadaj) => {
    if (!dogadaj.target.closest("[data-sort-izbornik]")) zatvoriSort();
  });
  document.addEventListener("keydown", (dogadaj) => {
    if (dogadaj.key !== "Escape") return;
    const otvoren = korijen.querySelector('.sort__gumb[aria-expanded="true"]');
    if (!otvoren) return;
    zatvoriSort();
    otvoren.focus();
  });

  document.addEventListener("click", (dogadaj) => {
    const meta = dogadaj.target.closest("[data-akcija]");
    if (!meta) return;
    // Ladica kosarice ima svoje akcije s istim imenima; ne diramo ih.
    if (meta.closest(".ladica")) return;

    const { akcija, vrijednost, artikl, kljuc } = meta.dataset;

    switch (akcija) {
      case "sort-otvori": {
        const popis = meta.parentElement.querySelector(".sort__popis");
        if (!popis) break;
        const otvara = popis.hidden;
        popis.hidden = !otvara;
        meta.setAttribute("aria-expanded", String(otvara));
        if (otvara) popis.querySelector(".sort__opcija.je-odabran, .sort__opcija")?.focus();
        break;
      }
      case "skupina":
        filtri.postavi({ skupina: vrijednost || null, podskupina: null });
        break;
      case "podskupina":
        // Prazna vrijednost je pilula "Sve" u traci podskupina; ponovni klik
        // na vec odabranu podskupinu je takoder odjavljuje.
        filtri.postavi({
          podskupina:
            !vrijednost || filtri.stanje.podskupina === vrijednost ? null : vrijednost,
        });
        break;
      case "marka":
        filtri.postavi({ marka: filtri.stanje.marka === vrijednost ? null : vrijednost });
        break;
      // Sortiranje na kartici je gumb u vlastitom izborniku; na cjeniku najma
      // je i dalje nativni <select>, koji javlja preko `change` nize.
      case "sort":
        filtri.postavi({ sort: vrijednost });
        break;

      case "ocisti":
        filtri.ocisti();
        break;
      case "makni-filtar":
        filtri.postavi(
          kljuc === "stanje"
            ? { samoNaStanju: false }
            : kljuc === "podskupina"
              ? { podskupina: null }
              : { [kljuc]: null }
        );
        break;
      // Kolicina na kartici mijenja samo broj u mrezi, ne i kosaricu. Zato se
      // ne crta cijeli popis nego se dira jedan cvor: precrtavanje bi maknulo
      // gumb ispod prsta usred niza pritisaka na "+".
      case "kolicina-manje":
      case "kolicina-vise": {
        const sada = kolicine.get(artikl) ?? 1;
        const novo = Math.max(1, Math.min(sada + (akcija === "kolicina-vise" ? 1 : -1), MAX_KOLICINA));
        if (novo === sada) break;
        kolicine.set(artikl, novo);

        const prikaz = popisSpremnik.querySelector(`[data-kolicina="${CSS.escape(artikl)}"]`);
        if (prikaz) prikaz.textContent = String(novo);
        const manje = popisSpremnik.querySelector(
          `[data-akcija="kolicina-manje"][data-artikl="${CSS.escape(artikl)}"]`
        );
        if (manje) manje.disabled = novo <= 1;
        break;
      }

      case "dodaj": {
        const nadeni = filtri.svi.find((a) => a.id === artikl);
        if (!nadeni) break;
        if (kosarica.sadrzi(nadeni.id)) {
          otvoriLadicu();
        } else {
          kosarica.dodaj(nadeni, { kolicina: kolicine.get(nadeni.id) ?? 1 });
          // Najam bez datuma se ne moze procijeniti, pa se ladica otvara
          // odmah — tu su polja datuma i tu se posao dovrsava.
          if (nadeni.osnova === "dan") otvoriLadicu();
          crtaj(filtri.rezultat(), filtri.stanje);
        }
        break;
      }
      default:
        break;
    }
  });

  document.addEventListener("change", (dogadaj) => {
    const meta = dogadaj.target.closest("[data-akcija]");
    if (!meta || meta.closest(".ladica")) return;

    if (meta.dataset.akcija === "stanje") {
      filtri.postavi({ samoNaStanju: meta.checked });
    } else if (meta.dataset.akcija === "sort") {
      filtri.postavi({ sort: meta.value });
    }
  });

  /* ---------------------------------------------------------------- */
  /* Pretraga                                                          */
  /* ---------------------------------------------------------------- */
  /*
   * Polje stoji u HTML-u i NIKAD se ne precrtava. Da je dio onoga sto crtaj()
   * mijenja, fokus i kursor bi ispali iz njega na svakoj tipki — mijenja se
   * samo mreza i dvije trake ispod njega.
   *
   * Odgoda od 180 ms: 59 artikala se filtrira u dijelu milisekunde, ali svaki
   * pritisak tipke inace znaci i jedan replaceState i jedno crtanje mreze od
   * 59 kartica s videima.
   */
  if (trazilica) {
    let odgoda = null;

    trazilica.addEventListener("input", () => {
      clearTimeout(odgoda);
      odgoda = setTimeout(() => {
        const upit = trazilica.value.trim();
        filtri.postavi({ pretraga: upit || null });
      }, 180);
    });

    // Esc prazni polje umjesto da samo makne fokus — inace ostane filtar koji
    // se ne vidi u mrezi nego samo u polju iznad nje.
    trazilica.addEventListener("keydown", (dogadaj) => {
      if (dogadaj.key === "Escape" && trazilica.value) {
        dogadaj.preventDefault();
        trazilica.value = "";
        clearTimeout(odgoda);
        filtri.postavi({ pretraga: null });
      }
    });

    // Hladan dolazak na /webshop?q=touch mora zateci polje popunjeno.
    if (filtri.stanje.pretraga) trazilica.value = filtri.stanje.pretraga;

    // "Ocistite filtre" cisti i pretragu u stanju; polje mora poci za njim.
    document.addEventListener("click", (dogadaj) => {
      if (dogadaj.target.closest('[data-akcija="ocisti"]')) trazilica.value = "";
    });
  }

  // Gumb "Dodaj" mijenja natpis kad artikl ude u kosaricu, pa popis mora
  // znati za promjene koje su se dogodile u ladici.
  kosarica.naPromjenu(() => crtaj(filtri.rezultat(), filtri.stanje));

  crtaj(filtri.rezultat(), filtri.stanje);
}
