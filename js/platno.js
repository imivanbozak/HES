/**
 * platno.js — valno polje u pozadini.
 *
 * Odjek slike assets/images/wavefield-bgg.png, ali crtan uzivo: mreza tocaka
 * koju valja sum, koja se zagrijava oko pokazivaca i pusti val na klik.
 * Stoji fiksno iza sadrzaja, a sadrzajni stupac je uzi od prozora pa polje
 * izlazi van njega s obje strane.
 *
 * Cijena je namjerno drzana niskom, jer ovo radi cijelo vrijeme:
 *   - sum je odvojiv (zaseban po stupcu i po retku), pa nema nijedne
 *     trigonometrijske funkcije po tocki nego samo po stupcu i po retku,
 *   - najvise 30 slicica u sekundi; ovo nije igra i 60 se ne primijeti,
 *   - omjer piksela ogranicen na 2, jer na 3x ne dobiva nista vidljivo,
 *   - kad kartica nije u prvom planu, petlja se zaustavlja.
 *
 * Bez JS-a, uz ugasen pokret ili na uskom ekranu polja jednostavno nema —
 * pozadina tada ostaje ravna ploha i stranica izgleda posve normalno.
 */

const RAZMAK = 26;          // razmak mreze u CSS pikselima
const SLICICA_MS = 1000 / 30;
const MAX_OMJER = 2;
const TRAJANJE_VALA = 900;  // ms
const BRZINA_VALA = 230;    // px/s

/** "#1B9179" -> [27, 145, 121] */
function uRgb(boja) {
  const cisto = boja.trim();
  if (cisto.startsWith("#")) {
    const h = cisto.slice(1);
    const pun = h.length === 3 ? h.split("").map((z) => z + z).join("") : h;
    return [0, 2, 4].map((i) => parseInt(pun.slice(i, i + 2), 16));
  }
  const brojevi = cisto.match(/[\d.]+/g);
  return brojevi ? brojevi.slice(0, 3).map(Number) : [27, 145, 121];
}

export function pokreniPlatno(spremnik) {
  if (!spremnik) return () => {};

  const smanjenPokret = window.matchMedia("(prefers-reduced-motion: reduce)");
  const uskoPlatno = window.matchMedia("(max-width: 767px)");

  let platno = null;
  let ctx = null;
  let petlja = 0;
  let promatracVelicine = null;
  let ziv = false;

  // Stanje mreze
  let sirina = 0;
  let visina = 0;
  let omjer = 1;
  let stupaca = 0;
  let redaka = 0;
  let sx = null;   // predracunati sinusi/kosinusi po stupcu
  let cx = null;
  let sy = null;
  let cy = null;

  let mis = { x: -9999, y: -9999 };
  const valovi = [];
  let boje = { osnovna: [27, 145, 121], sjaj: [63, 199, 194] };

  function ocitajBoje() {
    const stil = getComputedStyle(document.documentElement);
    boje = {
      osnovna: uRgb(stil.getPropertyValue("--hes") || "#1B9179"),
      sjaj: uRgb(stil.getPropertyValue("--sjaj") || "#3FC7C2"),
    };
  }

  function izmjeri() {
    if (!platno) return;
    const okvir = spremnik.getBoundingClientRect();
    omjer = Math.min(window.devicePixelRatio || 1, MAX_OMJER);
    sirina = Math.max(1, Math.round(okvir.width));
    visina = Math.max(1, Math.round(okvir.height));

    platno.width = Math.round(sirina * omjer);
    platno.height = Math.round(visina * omjer);
    platno.style.width = sirina + "px";
    platno.style.height = visina + "px";
    ctx.setTransform(omjer, 0, 0, omjer, 0, 0);

    stupaca = Math.ceil(sirina / RAZMAK) + 1;
    redaka = Math.ceil(visina / RAZMAK) + 1;

    // Odvojivi sum: sve sto ovisi samo o stupcu ili samo o retku racuna se
    // jednom pri promjeni velicine, a ne 3000 puta po slicici.
    sx = new Float32Array(stupaca);
    cx = new Float32Array(stupaca);
    for (let i = 0; i < stupaca; i += 1) {
      const x = (i * RAZMAK) / 260;
      sx[i] = Math.sin(x);
      cx[i] = Math.cos(x * 0.7);
    }
    sy = new Float32Array(redaka);
    cy = new Float32Array(redaka);
    for (let j = 0; j < redaka; j += 1) {
      const y = (j * RAZMAK) / 190;
      sy[j] = Math.sin(y * 0.9);
      cy[j] = Math.cos(y);
    }
  }

  /** Doprinos pokazivaca i valova na tocki. */
  function odziv(x, y, sada) {
    let v = 0;

    const dx = x - mis.x;
    const dy = y - mis.y;
    const udaljenost = Math.sqrt(dx * dx + dy * dy);
    if (udaljenost < 260) {
      // Blagi valoviti rub: savrsen krug oko misa izgleda kao reflektor.
      const kut = Math.atan2(dy, dx);
      const talas =
        1 + 0.18 * Math.sin(kut * 4 + sada * 0.004) + 0.1 * Math.sin(kut * 8 - sada * 0.006);
      const efektivna = udaljenost / Math.max(0.6, talas);
      v += Math.exp(-(efektivna * efektivna) / 9000) * 1.05;
    }

    for (let i = valovi.length - 1; i >= 0; i -= 1) {
      const val = valovi[i];
      const dob = sada - val.rodjen;
      if (dob > TRAJANJE_VALA) {
        valovi.splice(i, 1);
        continue;
      }
      const rx = x - val.x;
      const ry = y - val.y;
      const r = Math.sqrt(rx * rx + ry * ry);
      const polumjer = (dob / 1000) * BRZINA_VALA;
      const razlika = r - polumjer;
      v += Math.exp(-(razlika * razlika) / 300) * (1 - dob / TRAJANJE_VALA) * 1.2;
    }

    return v;
  }

  let zadnjaSlicica = 0;
  function crtaj(sada) {
    petlja = requestAnimationFrame(crtaj);
    if (sada - zadnjaSlicica < SLICICA_MS) return;
    zadnjaSlicica = sada;

    ctx.clearRect(0, 0, sirina, visina);

    const faza1 = sada * 0.00016;
    const faza2 = sada * 0.00011;
    const sinF1 = Math.sin(faza1);
    const cosF1 = Math.cos(faza1);
    const sinF2 = Math.sin(faza2);
    const cosF2 = Math.cos(faza2);

    for (let j = 0; j < redaka; j += 1) {
      const y = j * RAZMAK;
      const sYj = sy[j];
      const cYj = cy[j];

      for (let i = 0; i < stupaca; i += 1) {
        const x = i * RAZMAK;

        // Dva odvojiva sloja suma, spojena u jednu vrijednost 0..1
        const n1 = (sx[i] * sYj + (cx[i] * cosF1 + sx[i] * sinF1) * 0.7 + 1.7) / 3.4;
        const n2 = (cx[i] * cYj + (sx[i] * cosF2 + cx[i] * sinF2) * 0.7 + 1.7) / 3.4;
        let v = (n1 + n2 * 0.6) / 1.6;

        // Gama: tamni dzepovi postaju dublji, pa polje dobije reljef umjesto
        // ravnomjerne kase.
        v = Math.pow(v, 2.3) * 1.15;
        v += odziv(x, y, sada);

        if (v <= 0.06) continue;

        const jacina = Math.min(v, 1.6);
        const vruce = jacina > 0.85;
        const [r, g, b] = vruce ? boje.sjaj : boje.osnovna;
        const polumjer = 0.7 + jacina * 1.5;

        ctx.globalAlpha = Math.min(0.1 + jacina * 0.5, 0.75);
        ctx.fillStyle = `rgb(${r} ${g} ${b})`;
        ctx.beginPath();
        ctx.arc(x, y, polumjer, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  function naMis(dogadaj) {
    const okvir = spremnik.getBoundingClientRect();
    mis = { x: dogadaj.clientX - okvir.left, y: dogadaj.clientY - okvir.top };
  }
  function naOdlazak() {
    mis = { x: -9999, y: -9999 };
  }
  function naKlik(dogadaj) {
    const okvir = spremnik.getBoundingClientRect();
    if (valovi.length > 12) valovi.shift();
    valovi.push({
      x: dogadaj.clientX - okvir.left,
      y: dogadaj.clientY - okvir.top,
      rodjen: performance.now(),
    });
  }
  function naVidljivost() {
    if (document.hidden) zaustavi();
    else if (ziv) pokreni();
  }

  function pokreni() {
    if (petlja) return;
    petlja = requestAnimationFrame(crtaj);
  }
  function zaustavi() {
    if (!petlja) return;
    cancelAnimationFrame(petlja);
    petlja = 0;
  }

  function ukljuci() {
    if (ziv) return;
    ziv = true;

    platno = document.createElement("canvas");
    platno.setAttribute("aria-hidden", "true");
    ctx = platno.getContext("2d", { alpha: true });
    spremnik.appendChild(platno);

    ocitajBoje();
    izmjeri();

    promatracVelicine = new ResizeObserver(izmjeri);
    promatracVelicine.observe(spremnik);

    window.addEventListener("pointermove", naMis, { passive: true });
    window.addEventListener("pointerleave", naOdlazak, { passive: true });
    window.addEventListener("pointerdown", naKlik, { passive: true });
    document.addEventListener("visibilitychange", naVidljivost);

    pokreni();
  }

  function iskljuci() {
    if (!ziv) return;
    ziv = false;
    zaustavi();
    promatracVelicine?.disconnect();
    promatracVelicine = null;
    window.removeEventListener("pointermove", naMis);
    window.removeEventListener("pointerleave", naOdlazak);
    window.removeEventListener("pointerdown", naKlik);
    document.removeEventListener("visibilitychange", naVidljivost);
    platno?.remove();
    platno = null;
    ctx = null;
  }

  function odluci() {
    // Na mobitelu polje ne donosi nista — pokazivaca nema, a bateriju trosi.
    if (smanjenPokret.matches || uskoPlatno.matches) iskljuci();
    else ukljuci();
  }

  odluci();
  smanjenPokret.addEventListener?.("change", odluci);
  uskoPlatno.addEventListener?.("change", odluci);

  // Boje se citaju iz tokena, pa ih promjena teme mora osvjeziti.
  return { osvjeziBoje: ocitajBoje, ugasi: iskljuci };
}
