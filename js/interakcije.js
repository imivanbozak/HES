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
/* Vrsta upita — padajuci izbornik na mobitelu                          */
/* ------------------------------------------------------------------ */
/**
 * Sest cipova vrste upita ispod 600 px stane u cetiri retka usred obrasca,
 * pa se ondje skupljaju iza gumba koji pokazuje sto je odabrano. Popis je
 * padajuci izbornik istog izgleda i ulaza kao onaj u navigaciji. Iznad
 * 600 px gumb je skriven CSS-om i cipovi stoje kao i prije, pa klasa koju
 * ovo postavlja ondje nista ne mijenja.
 *
 * Omot je prije bio `<details>`. Zatvaranje njega se ne da animirati, a
 * izbornik u navigaciji se i otvara i zatvara prijelazom — pa je to sada
 * gumb s `aria-expanded` i klasom `je-otvoren`.
 *
 * Radio gumbi ostaju netaknuti — stanje i dalje vodi `:checked`, a ovo samo
 * prepisuje natpis i otvara i zatvara popis.
 */
export function pokreniVrsteUpita() {
  const omot = document.querySelector("[data-vrste]");
  if (!omot) return;

  const gumb = omot.querySelector("[data-vrste-gumb]");
  const natpis = omot.querySelector("[data-vrste-natpis]");

  const osvjezi = () => {
    const odabran = omot.querySelector(".cip-upita__ulaz:checked");
    if (!odabran || !natpis) return;
    const oznaka = omot.querySelector(`label[for="${odabran.id}"]`);
    if (oznaka) natpis.textContent = oznaka.textContent.trim();
  };

  const otvoren = () => omot.classList.contains("je-otvoren");
  const postavi = (stanje) => {
    omot.classList.toggle("je-otvoren", stanje);
    gumb?.setAttribute("aria-expanded", String(stanje));
  };

  gumb?.addEventListener("click", () => {
    const otvara = !otvoren();
    postavi(otvara);
    // Fokus na odabranu opciju, da tipkovnica nastavi strelicama. Nakon
    // klika ili dodira prsten fokusa se ionako ne crta (:focus-visible).
    if (otvara) omot.querySelector(".cip-upita__ulaz:checked")?.focus({ preventScroll: true });
  });

  omot.addEventListener("change", osvjezi);

  // Klik ili dodir po retku bira i zatvara. Promjena strelicama NE zatvara —
  // inace bi se popis gasio pod tipkovnicom na svakom koraku.
  omot.addEventListener("click", (dogadaj) => {
    if (!otvoren() || !dogadaj.target.closest(".cip-upita")) return;
    postavi(false);
    gumb?.focus({ preventScroll: true });
  });

  document.addEventListener("click", (dogadaj) => {
    if (otvoren() && !omot.contains(dogadaj.target)) postavi(false);
  });
  omot.addEventListener("focusout", (dogadaj) => {
    if (otvoren() && !omot.contains(dogadaj.relatedTarget)) postavi(false);
  });
  document.addEventListener("keydown", (dogadaj) => {
    if (dogadaj.key !== "Escape" || !otvoren()) return;
    postavi(false);
    gumb?.focus();
  });

  osvjezi();
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
/**
 * Pusti kadar i pobrini se da se po zavrsetku vrati na pocetak.
 *
 * Zajednicko hoveru i ciklusu nize, pa se `data-svira` postavlja na jednom
 * mjestu: dva slusaca koja bi svaki za sebe vodila isto stanje razisla bi se
 * prvim sljedecim uredivanjem.
 */
function pustiKadar(video) {
  // Vec svira — pusti ga da dovrsi, ne pipaj po njemu.
  if (video.dataset.svira !== undefined) return;

  if (video.dataset.vracaSe === undefined) {
    video.dataset.vracaSe = "";
    video.addEventListener("ended", () => {
      delete video.dataset.svira;
      video.currentTime = 0;
    });
  }

  video.dataset.svira = "";
  const obecanje = video.play();
  if (obecanje && typeof obecanje.catch === "function") {
    obecanje.catch(() => delete video.dataset.svira);
  }
}

export function pokreniVideoNaHover(korijen = document) {
  const videi = [...korijen.querySelectorAll("video[data-video-hover]")];
  if (!videi.length) return;

  // Uz smanjen pokret se ne pokrece nista: cetiri sekunde pokreta su tocno ono
  // sto ta postavka trazi da izostane. Poster kadar ostaje kao slika.
  if (smanjenPokret) return;

  for (const video of videi) {
    const nosac = video.closest("a, li, article") || video;
    const pokreni = () => pustiKadar(video);

    nosac.addEventListener("mouseenter", pokreni);
    nosac.addEventListener("focusin", pokreni);
  }
}

/* ------------------------------------------------------------------ */
/* Video koji se pokrece sam, u ciklusu                                */
/* ------------------------------------------------------------------ */
/**
 * Kadrovi se izmjenjuju JEDAN PO JEDAN, svakih N milisekundi.
 *
 * Razmak nosi `data-video-ciklus` na spremniku (15000 na naslovnici i
 * webshopu, 10000 na stranici proizvoda). Rotacija, a ne "svi odjednom": na
 * webshopu su u mrezi do 28 kartica s videom, i istovremeno dekodiranje svih
 * zaustavi mobitel na nekoliko sekundi. Ovako u svakom trenutku svira tocno
 * jedan isjecak od cetiri sekunde.
 *
 * Cetiri stvari koje ovo mora izdrzati, i kako:
 *
 *  - Popis se precrtava (filtar, pretraga, kosarica). Zato se videi traze
 *    IZNOVA na svaki otkucaj, a ne jednom pri vezanju: spremnik s atributom
 *    je onaj koji stoji u HTML-u i preživi svako `innerHTML`.
 *  - Kadar izvan vidokruga ne treba svirati. `IntersectionObserver` gasi i
 *    pali sam otkucaj, ne samo reprodukciju.
 *  - Kartica u pozadini preglednika ne treba nista. `document.hidden` se
 *    provjerava u otkucaju — jeftinije od jos jednog slusaca po spremniku.
 *  - Skriveni kadrovi galerije nisu na redu. Video ispod `[hidden]` se
 *    preskace, inace bi galerija svirala kadar koji nitko ne gleda.
 *
 * Hover i dalje radi i ima prednost: `pustiKadar` nece dirati video koji vec
 * svira, pa se ta dva nikad ne sudare.
 */
export function pokreniVideoNaInterval(korijen = document) {
  const spremnici = [...korijen.querySelectorAll("[data-video-ciklus]")];
  if (!spremnici.length) return;

  // Automatski pokrenut video je tocno ono sto `prefers-reduced-motion` trazi
  // da izostane — jos i vise nego hover, koji korisnik barem sam izazove.
  if (smanjenPokret) return;

  for (const spremnik of spremnici) {
    const razmak = Number(spremnik.dataset.videoCiklus) || 15000;
    let na = -1;
    let tajmer = null;

    const otkucaj = () => {
      if (document.hidden) return;
      const videi = [...spremnik.querySelectorAll("video")].filter((v) => !v.closest("[hidden]"));
      if (!videi.length) return;
      na = (na + 1) % videi.length;
      pustiKadar(videi[na]);
    };

    const kreni = () => {
      if (tajmer !== null) return;
      otkucaj();
      tajmer = setInterval(otkucaj, razmak);
    };

    const stani = () => {
      if (tajmer === null) return;
      clearInterval(tajmer);
      tajmer = null;
    };

    new IntersectionObserver(([unos]) => (unos.isIntersecting ? kreni() : stani()), {
      threshold: 0.2,
    }).observe(spremnik);
  }
}
