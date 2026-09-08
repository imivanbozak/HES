/**
 * adrese.js — artikl -> adresa njegove stranice.
 *
 * Jedna tablica koju dijele tri mjesta:
 *
 *   scripts/stranice.mjs   imenuje datoteke koje generira
 *   js/proizvod.js         karusel "Uz ovaj artikl"
 *   js/trgovina.js         kartice u katalogu na /webshop
 *
 * Da tablica stoji na dva mjesta, prva bi promjena imena datoteke ostavila
 * mrtvu poveznicu na drugom — a mrtva poveznica na kartici izgleda isto kao
 * ispravna sve dok se ne klikne.
 *
 * Kljuc je WooCommerce ID iz assets/katalog.json, isti kojim se artikl vodi
 * u kosarici i u data-proizvod atributu na stranici.
 *
 * Vrijednost je ime datoteke bez nastavka. Imena su engleska jer su to i
 * imena artikala kod Loxonea; hrvatski dodaci iz izvoza ("tipkalo", "Senzor
 * pokreta", "Motorni pogon za ventile") se izostavljaju jer u adresi ne nose
 * nista sto ime proizvoda vec ne kaze.
 */
export const ADRESE = new Map([
  /* --- miniserveri -------------------------------------------------- */
  ["1433", "miniserver"],
  ["1438", "miniserver-compact"],
  ["1441", "miniserver-go"],

  /* --- prosirenja --------------------------------------------------- */
  ["1444", "tree-extension"],
  ["1447", "air-base-extension"],
  ["1451", "relay-extension"],
  ["1455", "dimmer-extension"],
  ["1459", "di-extension"],
  ["1463", "1-wire-extension"],
  ["1467", "modbus-extension"],
  ["1470", "dali-extension-64"],
  ["1474", "dali-extension-10"],
  ["1478", "ai-extension"],
  ["1482", "ao-extension"],
  ["1487", "knx-extension"],
  ["1512", "rs485-extension"],

  /* --- osvjetljenje -------------------------------------------------- */
  ["1491", "led-spot-rgbw-tree"],
  ["1497", "led-ceiling-light-rgbw-air"],
  ["1502", "led-strip-rgbw"],
  ["1505", "table-lamp"],
  ["1508", "led-pendulum-slim-rgbw"],

  /* --- upravljanje osvjetljenjem ------------------------------------- */
  ["1684", "rgbw-24v-dimmer-tree"],
  ["1689", "rgbw-24v-dimmer-air"],
  ["1693", "nano-dimmer-air"],
  ["1697", "nano-io-air"],

  /* --- doticajni uredaji i tipkala ----------------------------------- */
  ["1700", "touch-pure-tree-co2"],
  ["1702", "touch-pure-air"],
  ["1706", "touch-pure-for-nano"],
  ["1709", "touch-pure-flex-air"],
  ["1712", "touch-tree"],
  ["1715", "touch-air"],
  ["1718", "nfc-code-touch-tree"],
  ["1722", "nfc-code-touch-air"],
  ["1726", "remote-air"],

  /* --- senzori -------------------------------------------------------- */
  ["1729", "motion-sensor-tree"],
  ["1733", "presence-sensor-tree"],
  ["1737", "presence-sensor-air"],
  ["1740", "room-comfort-sensor-tree"],
  ["1743", "room-comfort-sensor-air"],
  ["1746", "ir-control-air"],

  /* --- aktuatori i pogoni --------------------------------------------- */
  ["1755", "valve-actuator-tree"],
  ["1759", "valve-actuator-air"],
  ["1762", "shading-actuator-air"],

  /* --- audio ----------------------------------------------------------- */
  ["1767", "audio-server"],
  ["1770", "stereo-extension"],
  ["1773", "surface-box-7"],
  ["1776", "surface-box-10"],
  ["1516", "install-speaker-7-passive"],
  ["1520", "install-speaker-7-master"],

  /* --- pametne uticnice ------------------------------------------------ */
  ["1779", "smart-socket-air-type-f"],
  ["1782", "smart-socket-air-type-j"],
  ["1786", "smart-socket-air-type-g"],

  /* --- kabeli i konektori ---------------------------------------------- */
  ["1790", "tree-cable-200m"],
  ["1794", "clamp-tree"],
  ["1797", "turbo-clamp"],
  ["1800", "clamp-tree-nfc-flex-intercom"],

  /* --- dodatni materijali ---------------------------------------------- */
  ["1802", "nfc-smart-cards"],
  ["1805", "nfc-key-fob-set"],
  ["1808", "sd-card-firmware-miniserver-gen-1"],
]);

/** Mapa u kojoj stranice zive. Mijenja se ovdje, ne po pozivima. */
export const MAPA = "/proizvodi";

/**
 * Adresa stranice artikla, ili null ako je artikl nema.
 *
 * Alati (vrsta "alat") nemaju svoju stranicu, pa im ovo vraca null i kartica
 * ostaje bez poveznice umjesto da vodi na 404.
 */
export function adresaProizvoda(artikl) {
  const ime = ADRESE.get(artikl?.id);
  return ime ? `${MAPA}/${ime}` : null;
}
