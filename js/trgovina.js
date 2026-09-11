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
import { t, formatCijene, lokalno } from "./jezik.js";
import { adresaProizvoda } from "./adrese.js";
import { stvoriFiltre } from "./filtri.js";
import {
  railHtml,
  mrezaHtml,
  trakaKategorijaHtml,
  trakaPodskupinaHtml,
  sortHtml,
  sBrojem,
  esc,
  dostupnostHtml,
} from "./pogledi.js";
import * as kosarica from "./kosarica.js";
import * as zauzetost from "./zauzetost.js";
import * as potvrda from "./potvrda.js";
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

  // Mreza kartica ima kolicinu PRIJE dodavanja u kosaricu; tablica najma nema.
  // Broj zivi ovdje, a ne u kosarici: dok se ne pritisne gumb, kosarica za
  // njega ne zna, inace bi svaki dodir na "+" mijenjao njezin sadrzaj.
  const kolicine = new Map();

  popisSpremnik.innerHTML = `<p class="tiho">${t("katalog.ucitavanje")}</p>`;

  let katalog;
  try {
    katalog = await ucitajKatalog();
  } catch (greska) {
    console.error("[trgovina]", greska);
    popisSpremnik.innerHTML = `
      <div class="prazno">
        <p class="naslov-3">${t("katalog.greska")}</p>
        <p class="tiho">${t("katalog.greska_uputa")}
          <a href="mailto:alen.hranj@hes.hr">alen.hranj@hes.hr</a>.</p>
      </div>`;
    return;
  }

  const filtri = stvoriFiltre({ katalog, vrsta, naPromjenu: crtaj });

  /*
   * Webshop uvijek stoji na jednoj skupini.
   *
   * Kartica "Sve" je maknuta na zahtjev klijenta, pa katalog vise nema stanje
   * "nijedna skupina" — pri dolasku na /webshop zakvaci se prva (Miniserveri).
   * Postavlja se OVDJE, u pogledu, a ne u js/filtri.js: ondje je zadano stanje
   * "bez filtera = svih 59" i na tome vise scripts/provjere.mjs, pa bi promjena
   * u motoru srusila dvije provjere zbog odluke koja je cisto stvar prikaza.
   *
   * Najam ostaje bez zakvacene skupine: ondje rail slijeva ima svoju "Sve".
   */
  const prvaSkupina = vrsta === "loxone" ? katalog.obitelji("loxone")[0]?.id ?? null : null;

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
      if (kategorija?.roditeljId) return lokalno(kategorija.naziv);
    }
    return null;
  };

  function crtaj(popis, stanje) {
    if (vrsta === "loxone") {
      popisSpremnik.innerHTML = mrezaHtml(popis, {
        potvrden: (id) => potvrda.jePotvrden(id),
        kolicine,
        podskupinaZa,
        // Ime i fotografija vode na stranicu artikla; gumbi za kolicinu i
        // kosaricu ostaju izvan poveznice, pa klik na "+" ne odvodi s kataloga.
        // Artikl bez stranice dobiva null i kartica ostaje bez poveznice.
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
      // Ista mreza kartica kao na webshopu. Tablica je ovdje stajala dok alati
      // nisu imali nijednu fotografiju; sada ih imaju svih sesnaest
      // (scripts/proizvodi.mjs), pa nema razloga da cjenik izgleda kao drugi
      // proizvod. Svaki alat ima i svoju stranicu (/alati/<ime>, tablica u
      // js/adrese.js), pa ime i fotografija vode na nju kao i na webshopu.
      popisSpremnik.innerHTML = mrezaHtml(popis, {
        potvrden: (id) => potvrda.jePotvrden(id),
        kolicine,
        podskupinaZa,
        osnova: "dan",
        veza: adresaProizvoda,
        // "Slobodno danas" / "Slobodno od 18. 9." umjesto "Na stanju" cim
        // zauzetost stigne iz baze.
        stanjeZa: (artikl) => dostupnostHtml(artikl.id),
      });

      const railKod = railHtml(katalog, filtri, vrsta);
      if (railSpremnik) railSpremnik.innerHTML = railKod;
      if (listSpremnik) listSpremnik.innerHTML = railKod;
      if (sazetakSpremnik) sazetakSpremnik.innerHTML = sazetakHtml(popis, stanje);

      // Traka kategorija postoji samo u cjeniku i samo na mobitelu (CSS je
      // gasi iznad 900 px). Ista funkcija kao na webshopu, pa se cetiri
      // kategorije alata ponasaju kao jedanaest Loxone skupina.
      if (katTraka) {
        const popisIkona = katTraka.querySelector(".kat-traka__popis");
        const pomak = popisIkona ? popisIkona.scrollLeft : 0;
        katTraka.innerHTML = trakaKategorijaHtml(katalog, filtri, vrsta);
        const novi = katTraka.querySelector(".kat-traka__popis");
        if (novi) novi.scrollLeft = pomak;
      }
    }

    // Otkrivanje se veze na novo tijelo popisa: staro je upravo zamijenjeno,
    // pa bi promatrac s njega gadao cvorove kojih vise nema.
    pokreniOtkrivanje(popisSpremnik);
  }

  function sazetakHtml(popis, stanje) {
    const raspon = katalog.raspon(popis);
    const aktivni = [];

    if (stanje.podskupina) {
      aktivni.push({ kljuc: "podskupina", ime: lokalno(katalog.poId.get(stanje.podskupina)?.naziv) });
    } else if (stanje.skupina) {
      aktivni.push({ kljuc: "skupina", ime: lokalno(katalog.poId.get(stanje.skupina)?.naziv) });
    }
    if (stanje.marka) aktivni.push({ kljuc: "marka", ime: stanje.marka });
    if (stanje.samoNaStanju) aktivni.push({ kljuc: "stanje", ime: t("katalog.na_stanju") });

    const jedinica = vrsta === "alat" ? ` / ${t("katalog.dan_kratko")}` : "";
    const cijena = (c) => formatCijene(c);

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
                    <span class="samo-citac">${t("katalog.ukloni_filtar")}</span>
                  </button>
                </li>`
                )
                .join("")}
            </ul>`
          : ""
      }

      <div class="sazetak__kontrole">
        ${filtarGumbHtml(filtri.brojAktivnih())}
        ${sortHtml(stanje)}
      </div>`;
  }

  /*
   * Gumb "Filtri" — lijevo od "Poredaj" i istog oblika, s ikonom lijevka.
   * Vidi se samo ispod 900 px, gdje rail slijeva nestaje (CSS), a otvara
   * postojeci donji list (js/main.js, `pokreniFiltarList`). Brojac aktivnih
   * filtara crta se ovdje, uz gumb, jer se gumb precrtava sa sazetkom.
   */
  function filtarGumbHtml(broj) {
    return `
      <button class="sort__gumb filtar-gumb" type="button" data-filtar-otvori aria-haspopup="dialog">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 5h18l-7 8.5V19l-4 2v-7.5z"/></svg>
        <span>${t("katalog.filtri")}</span>
        ${broj ? `<span class="filtar-brojac monr"><span class="samo-citac">${t("katalog.aktivnih")}</span> ${broj}</span>` : ""}
      </button>`;
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
        // Pretraga se cisti: skupina i upit su dva nacina da se dode do istog
        // popisa, a zajedno daju presjek koji nitko nije trazio.
        filtri.postavi({ skupina: vrijednost || null, podskupina: null, pretraga: null });
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

        // Gumb uvijek DODAJE. `kosarica.dodaj` sam povecava kolicinu ako
        // artikl vec stoji unutra, pa drugi klik znaci drugi komad — a ne
        // otvaranje ladice, kako je stajalo dok je gumb trajno pisao
        // "U kosarici".
        const ishod = kosarica.dodaj(nadeni, { kolicina: kolicine.get(nadeni.id) ?? 1 });
        if (!ishod.ok) break;
        potvrda.potvrdi(nadeni.id);

        // Najam bez datuma se ne moze procijeniti, pa se ladica otvara
        // odmah — tu su polja datuma i tu se posao dovrsava.
        if (nadeni.osnova === "dan") otvoriLadicu();
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

    /*
     * Pretraga se trazi po CIJELOM katalogu, ne unutar zakvacene skupine.
     * Bez ovoga bi netko tko stoji na Senzorima i upise "miniserver" dobio
     * praznu mrezu — i to bez ijednog vidljivog razloga, jer je skupina koja
     * ga filtrira gore u traci, a ne u polju u koje upisuje.
     *
     * Kad se polje isprazni, skupina se vraca na onu s kojom katalog inace
     * stoji. Prazna traka bez ijedne odabrane skupine bila bi stanje koje
     * korisnik vise ne moze proizvesti klikom.
     */
    trazilica.addEventListener("input", () => {
      clearTimeout(odgoda);
      odgoda = setTimeout(() => {
        const upit = trazilica.value.trim();
        filtri.postavi(
          upit
            ? { pretraga: upit, skupina: null, podskupina: null }
            : { pretraga: null, skupina: prvaSkupina }
        );
      }, 180);
    });

    // Esc prazni polje umjesto da samo makne fokus — inace ostane filtar koji
    // se ne vidi u mrezi nego samo u polju iznad nje.
    trazilica.addEventListener("keydown", (dogadaj) => {
      if (dogadaj.key === "Escape" && trazilica.value) {
        dogadaj.preventDefault();
        trazilica.value = "";
        clearTimeout(odgoda);
        filtri.postavi({ pretraga: null, skupina: prvaSkupina });
      }
    });

    // Hladan dolazak na /webshop?q=touch mora zateci polje popunjeno.
    if (filtri.stanje.pretraga) trazilica.value = filtri.stanje.pretraga;

    // "Ocistite filtre" cisti i pretragu u stanju; polje mora poci za njim.
    document.addEventListener("click", (dogadaj) => {
      if (dogadaj.target.closest('[data-akcija="ocisti"], [data-akcija="skupina"]')) {
        trazilica.value = "";
      }
    });
  }

  // Popis mora znati za promjene koje su se dogodile u ladici, i za istek
  // petosekundne potvrde na gumbu — inace bi kvacica ostala stajati.
  const precrtaj = () => crtaj(filtri.rezultat(), filtri.stanje);
  kosarica.naPromjenu(precrtaj);
  potvrda.naPromjenu(precrtaj);

  if (vrsta === "alat") {
    zauzetost.naPromjenu(precrtaj);
    zauzetost.ucitaj();
  }

  // Tek nakon sto je sve gore definirano: `postavi` odmah zove crtaj().
  if (prvaSkupina && !filtri.stanje.skupina && !filtri.stanje.pretraga) {
    filtri.postavi({ skupina: prvaSkupina });
  } else {
    crtaj(filtri.rezultat(), filtri.stanje);
  }
}
