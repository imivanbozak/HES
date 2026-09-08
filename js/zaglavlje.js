/**
 * zaglavlje.js — traka se suzava pri skrolanju prema dolje, vraca prema gore.
 *
 * Cijeli modul je jedan boolean: je li traka zbijena ili nije. Sve ostalo —
 * visina, sirina stupca, staklena ploha, mjera znaka — stoji u CSS-u pod
 * `.zaglavlje--zbijeno`, pa se izgled mijenja bez ijedne inline vrijednosti.
 *
 * Tri odluke koje se ne vide iz koda:
 *
 *  1. `scroll` se ne obraduje odmah nego u sljedecem kadru. Slusac koji na
 *     svaki dogadaj cita `scrollY` i dira klasu radi to i po 100 puta u
 *     sekundi, i to je najcesci razlog zasto ovakve trake "zapinju".
 *  2. Postoji PRAG od 6 px. Bez njega trackpad koji vraca po dva piksela
 *     gore-dolje trepce traku na svakom trzaju.
 *  3. Traka se zbija tek ispod 80 px, ali se otvara na svaki skrol prema
 *     gore. Namjerno nesimetricno: sadrzaj se skriva nerado, a vraca odmah.
 */

const PRAG = 6;
const POCETAK = 80;

export function pokreniZaglavlje(zaglavlje = document.querySelector(".zaglavlje")) {
  if (!zaglavlje) return;

  // Ugasen pokret znaci da traka stoji. Ne skacemo ni na zbijeno stanje:
  // promjena visine je tu jednako neugodna kao i prijelaz do nje.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let zadnji = window.scrollY;
  let zbijeno = false;
  let ceka = false;

  const procijeni = () => {
    ceka = false;
    const sada = window.scrollY;
    const pomak = sada - zadnji;

    if (Math.abs(pomak) < PRAG) return;
    zadnji = sada;

    // Vrh stranice uvijek znaci puna traka, bez obzira na smjer: kad se
    // dode natrag gore, zaglavlje mora izgledati kao pri ucitavanju.
    const treba = sada > POCETAK && pomak > 0;
    if (treba === zbijeno) return;

    zbijeno = treba;
    zaglavlje.classList.toggle("zaglavlje--zbijeno", zbijeno);
  };

  window.addEventListener(
    "scroll",
    () => {
      if (ceka) return;
      ceka = true;
      requestAnimationFrame(procijeni);
    },
    { passive: true }
  );
}
