/**
 * interakcije.js — dijelovi stranice koji reagiraju na posjetitelja.
 *
 * Sve ovdje slijedi isto pravilo kao js/pokret.js: bez JavaScripta markup
 * ostaje potpun i citljiv, a ovaj modul samo dodaje sloj iznad njega. Nista
 * se ne skriva iza radnje koja se bez JS-a ne moze dogoditi — zato su ovdje
 * provjera uvjeta, napredak obrasca i video na hover, a ne akordeoni koji bi
 * sadrzaj zakljucali.
 *
 * Nema biblioteka, kao ni drugdje u projektu.
 */

const smanjenPokret = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ------------------------------------------------------------------ */
/* Provjera uvjeta na oglasu za posao                                  */
/* ------------------------------------------------------------------ */
/**
 * Kartica pozicije vec kaze "Provjeri ispunjavas li uvjete." — ovo je cini
 * doslovnom: svaki redak uvjeta dobiva kvadratic, a mjerilo ispod kartice
 * pokazuje koliko ih je oznaceno.
 *
 * Kandidat koji misli da nije kvalificiran je jedini citatelj ove sekcije koji
 * odustane prije nego posalje zivotopis. Popis na kojem sam vidi da ispunjava
 * tri od cetiri stavke radi vise od bilo koje recenice iznad njega.
 *
 * Bez JS-a redci ostaju obicna tablica cinjenica, tocno kao prije.
 */
export function pokreniProvjeruUvjeta(korijen = document) {
  const kartice = [...korijen.querySelectorAll("[data-provjera]")];
  if (!kartice.length) return;

  for (const kartica of kartice) {
    const redci = [...kartica.querySelectorAll(".cinjenice > div")];
    const mjerilo = kartica.querySelector("[data-provjera-mjerilo]");
    const ispuna = mjerilo?.querySelector(".mjerilo__ispuna");
    const brojka = mjerilo?.querySelector("[data-provjera-brojka]");
    if (!redci.length || !ispuna) continue;

    const kvadratici = [];

    redci.forEach((redak, i) => {
      const dt = redak.querySelector("dt");
      if (!dt) return;

      const id = `uvjet-${kartica.id || "p"}-${i}`;
      const kvadratic = document.createElement("input");
      kvadratic.type = "checkbox";
      kvadratic.id = id;
      kvadratic.className = "uvjet__kvadratic";

      // <dt> ne moze biti <label> (mijenja semantiku popisa), pa oznaka ide
      // unutra i pokriva tekst koji je ionako vec ondje.
      const oznaka = document.createElement("label");
      oznaka.className = "uvjet__oznaka";
      oznaka.htmlFor = id;
      while (dt.firstChild) oznaka.appendChild(dt.firstChild);

      dt.appendChild(kvadratic);
      dt.appendChild(oznaka);
      redak.classList.add("cinjenice--provjerivo");
      kvadratici.push(kvadratic);
    });

    if (!kvadratici.length) continue;

    const prebroji = () => {
      const oznaceno = kvadratici.filter((k) => k.checked).length;
      ispuna.style.setProperty("--ispuna", String(oznaceno / kvadratici.length));
      if (brojka) brojka.textContent = `${oznaceno} / ${kvadratici.length}`;
      kartica.classList.toggle("kartica--spreman", oznaceno === kvadratici.length);
    };

    kartica.addEventListener("change", (dogadaj) => {
      if (dogadaj.target.classList.contains("uvjet__kvadratic")) prebroji();
    });

    mjerilo.hidden = false;
    prebroji();
  }
}

/* ------------------------------------------------------------------ */
/* Napredak obrasca upita                                              */
/* ------------------------------------------------------------------ */
/**
 * Traka koja se puni kako se popunjavaju obavezna polja.
 *
 * Broje se TRI stvari: ime, e-posta i opis posla. Vrsta upita je uvijek
 * odabrana (prvi cip nosi `checked`), pa bi kao cetvrta stavka samo pomaknula
 * traku na 25 % prije nego posjetitelj isti sto upise. Telefon je izvan
 * racuna jer nije obavezan — traka koja bi ga brojila nikad ne bi dosla do
 * kraja kod obrasca koji je zapravo gotov, i trazilo bi se sto jos fali.
 */
export function pokreniNapredakObrasca(korijen = document) {
  const obrazac = korijen.querySelector("[data-napredak-obrasca]");
  if (!obrazac) return;

  const mjerilo = obrazac.querySelector("[data-obrazac-mjerilo]");
  const ispuna = mjerilo?.querySelector(".mjerilo__ispuna");
  const natpis = mjerilo?.querySelector("[data-obrazac-natpis]");
  if (!ispuna) return;

  const polja = [...obrazac.querySelectorAll("[data-broji-se]")];
  if (!polja.length) return;

  const popunjeno = (polje) => {
    if (polje.type === "email") return polje.checkValidity() && polje.value.trim() !== "";
    return polje.value.trim() !== "";
  };

  const azuriraj = () => {
    const gotovo = polja.filter(popunjeno).length;
    const omjer = gotovo / polja.length;
    ispuna.style.setProperty("--ispuna", String(omjer));
    if (natpis) {
      natpis.textContent = omjer === 1 ? "Spremno za slanje" : `${gotovo} / ${polja.length}`;
    }
    mjerilo.classList.toggle("mjerilo--gotovo", omjer === 1);
  };

  obrazac.addEventListener("input", azuriraj);
  obrazac.addEventListener("change", azuriraj);

  mjerilo.hidden = false;
  azuriraj();
}

/* ------------------------------------------------------------------ */
/* Video koji se pokrece na hover                                      */
/* ------------------------------------------------------------------ */
/**
 * Kadar kartice krene svirati kad pokazivac dode na nju, i — jednom pokrenut —
 * odsvira do kraja bez obzira na to je li pokazivac jos ondje.
 *
 * To "do kraja" je cijela poanta i jedini razlog zasto ovo nije `onmouseover
 * play / onmouseout pause`. Isjecak traje 4 s; da staje na izlazak
 * pokazivaca, posjetitelj koji prijede preko mreze kartica vidio bi pola
 * sekunde pokreta i zamrznut kadar nasred radnje. Ovako se ili ne pokrene, ili
 * se odigra.
 *
 * Sitnice koje se lako promase, sve tri su ovdje:
 *  - `muted` mora stajati u markupu: preglednik odbija programski `play()` na
 *    videu sa zvukom bez korisnikove geste, a hover to nije. `play()` svejedno
 *    vraca promise koji zna puknuti (stedni nacin rada, jos neucitan izvor),
 *    pa se hvata i tiho ignorira — kartica tada ostaje na poster kadru.
 *  - po zavrsetku se vraca na pocetak, da sljedeci hover krene iznova a ne
 *    stoji na zadnjem kadru.
 *  - `focusin` uz `mouseenter`: kartica je poveznica i do nje se stize i
 *    tabulatorom, pa isti kadar dobiva i tko ne koristi mis.
 */
export function pokreniVideoNaHover(korijen = document) {
  const videi = [...korijen.querySelectorAll("video[data-video-hover]")];
  if (!videi.length) return;

  // Uz smanjen pokret se ne pokrece nista: cetiri sekunde pokreta su tocno ono
  // sto ta postavka trazi da izostane. Poster kadar ostaje kao slika.
  if (smanjenPokret) return;

  for (const video of videi) {
    const nosac = video.closest("a, li, article") || video;

    const pokreni = () => {
      // Vec svira — pusti ga da dovrsi, ne pipaj po njemu.
      if (video.dataset.svira !== undefined) return;
      video.dataset.svira = "";
      const obecanje = video.play();
      if (obecanje && typeof obecanje.catch === "function") {
        obecanje.catch(() => delete video.dataset.svira);
      }
    };

    video.addEventListener("ended", () => {
      delete video.dataset.svira;
      video.currentTime = 0;
    });

    nosac.addEventListener("mouseenter", pokreni);
    nosac.addEventListener("focusin", pokreni);
  }
}
