/**
 * tema.js — prebacivanje tamne i svijetle teme.
 *
 * Tema je atribut na <html>, ne klasa: `data-theme="tamna" | "svijetla"`.
 * Sve boje se mijenjaju u css/tokens.css, pa ovdje nema nijedne vrijednosti
 * boje — jedina iznimka je <meta name="theme-color">, koji se cita iz vec
 * izracunatog `--ploha-0` da paleta ostane definirana na jednom mjestu.
 *
 * Prvo postavljanje se NE dogada ovdje nego u malenoj skripti u <head>,
 * prije stylesheetova. Da ceka na modul, stranica bi bljesnula krivom temom.
 */

const KLJUC = "hes.tema";
const TEME = ["tamna", "svijetla"];

const pretplatnici = new Set();

/** Tema koju bi korisnik dobio da nista nije spremljeno. */
export function zadanaTema() {
  try {
    // Tamna je lice stranice, ali sustavska preferencija ima prednost:
    // tko je namjerno na svijetlom, ocekuje svijetlo i ovdje.
    return window.matchMedia("(prefers-color-scheme: light)").matches
      ? "svijetla"
      : "tamna";
  } catch {
    return "tamna";
  }
}

export function trenutnaTema() {
  const postavljena = document.documentElement.dataset.theme;
  return TEME.includes(postavljena) ? postavljena : zadanaTema();
}

export function postaviTemu(tema) {
  if (!TEME.includes(tema)) return;
  document.documentElement.dataset.theme = tema;
  try {
    localStorage.setItem(KLJUC, tema);
  } catch {
    // Privatni prozor baca vec na pristup. Tema i dalje radi, samo je ne
    // pamtimo — a to je bolje od pucanja na sljedecoj liniji.
  }
  osvjeziBojuPreglednika();
  for (const javi of pretplatnici) javi(tema);
}

export function obrniTemu() {
  postaviTemu(trenutnaTema() === "tamna" ? "svijetla" : "tamna");
}

export function naPromjenuTeme(funkcija) {
  pretplatnici.add(funkcija);
  return () => pretplatnici.delete(funkcija);
}

/**
 * Boja adresne trake na mobitelu. Cita se iz izracunatog stila umjesto da se
 * prepise ovdje, pa promjena palete u tokens.css ne trazi izmjenu u JS-u.
 */
function osvjeziBojuPreglednika() {
  const oznaka = document.querySelector('meta[name="theme-color"]');
  if (!oznaka) return;
  const boja = getComputedStyle(document.documentElement)
    .getPropertyValue("--ploha-0")
    .trim();
  if (boja) oznaka.setAttribute("content", boja);
}

/**
 * Gumb pokazuje temu u koju vodi, ne onu u kojoj jesi — to je ono sto
 * korisnik od gumba i ocekuje.
 */
export function osvjeziGumbTeme(gumb = document.querySelector("[data-tema-gumb]")) {
  if (!gumb) return;
  const ide_u = trenutnaTema() === "tamna" ? "svijetla" : "tamna";
  gumb.dataset.vodiU = ide_u;
  gumb.setAttribute(
    "aria-label",
    ide_u === "svijetla" ? "Prebaci na svijetlu temu" : "Prebaci na tamnu temu"
  );
  gumb.setAttribute("aria-pressed", String(trenutnaTema() === "svijetla"));
}

export function pokreniTemu() {
  osvjeziBojuPreglednika();
  osvjeziGumbTeme();
  naPromjenuTeme(() => osvjeziGumbTeme());

  // Ako korisnik nikad nije izabrao temu, prati sustav i kad se predomisli
  // usred posjeta. Cim jednom klikne gumb, izbor je njegov i sustav se vise
  // ne slusa.
  try {
    window
      .matchMedia("(prefers-color-scheme: light)")
      .addEventListener("change", (dogadaj) => {
        let spremljena = null;
        try {
          spremljena = localStorage.getItem(KLJUC);
        } catch {
          /* nedostupno spremiste — ponasaj se kao da izbora nema */
        }
        if (spremljena) return;
        document.documentElement.dataset.theme = dogadaj.matches ? "svijetla" : "tamna";
        osvjeziBojuPreglednika();
        osvjeziGumbTeme();
      });
  } catch {
    /* stariji preglednik bez addEventListener na MediaQueryList */
  }
}
