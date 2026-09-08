/**
 * potvrda.js — kratkotrajno "dodano u kosaricu" stanje gumba.
 *
 * Do sada je izgled gumba bio izveden iz `kosarica.sadrzi(id)`, pa je kartica
 * jednom dodanog artikla do kraja posjeta pisala "U kosarici". To je tocno, ali
 * je i slijepa ulica: drugi komad se s kataloga nije mogao dodati, a gumb je na
 * klik radio nesto trece od onoga sto pise.
 *
 * Ovdje stoji suprotna odluka. Potvrda traje PET SEKUNDI i onda nestane, a
 * kosarica ostaje kakva jest. Gumb se time vraca u stanje koje govori istinu —
 * "dodajte" — i sljedeci klik doista doda jos jedan komad.
 *
 * Zasto zaseban modul, a ne zastavica na DOM cvoru: popis se precrtava na svaku
 * promjenu kosarice, pa bi klasa upisana u element nestala s prvim sljedecim
 * `innerHTML`. Stanje mora zivjeti izvan prikaza, kao i sama kosarica.
 *
 * Namjerno se NE sprema u localStorage: potvrda je trenutak, ne sadrzaj.
 */

const TRAJANJE = 5000;

/** id artikla -> id tajmera koji ce potvrdu ugasiti. */
const tajmeri = new Map();
const pretplatnici = new Set();

function javi() {
  for (const funkcija of pretplatnici) funkcija();
}

/**
 * Prikazi potvrdu za artikl i pokreni odbrojavanje.
 *
 * Ponovni poziv unutar pet sekundi produzuje potvrdu umjesto da nakupi dva
 * tajmera — inace bi prvi ugasio potvrdu koju je drugi tek upalio.
 */
export function potvrdi(id) {
  const kljuc = String(id);
  const stari = tajmeri.get(kljuc);
  if (stari) clearTimeout(stari);

  tajmeri.set(
    kljuc,
    setTimeout(() => {
      tajmeri.delete(kljuc);
      javi();
    }, TRAJANJE)
  );

  javi();
}

/** Stoji li potvrda za ovaj artikl upravo sada. */
export function jePotvrden(id) {
  return tajmeri.has(String(id));
}

export function naPromjenu(funkcija) {
  pretplatnici.add(funkcija);
  return () => pretplatnici.delete(funkcija);
}
