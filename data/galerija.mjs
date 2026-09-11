/**
 * galerija.mjs — opisi projekata u galeriji radova.
 *
 * Fotografije se ne upisuju ovdje, nego slazu u mape (scripts/galerija.mjs):
 *
 *   assets/images/galerija/<usluga>/<projekt>/*.jpg
 *
 * Ovdje stoji samo ono sto mapa ne moze reci: naziv projekta na tri jezika,
 * mjesto i godina, i po zelji opis pojedine fotografije za citace ekrana.
 *
 * Projekt bez unosa ulazi u galeriju s nazivom iz imena mape, ali ga skripta
 * navede: "stan-zagreb-2025" nije naziv koji posjetitelj treba vidjeti.
 *
 * Kljuc je "<usluga>/<ime-mape>". Njemacki bez ß (vidi js/prijevodi.js).
 * Nijedan opis ne smije tvrditi vise nego sto fotografija pokazuje —
 * klijent, rok ili opseg posla upisuju se samo ako ih je klijent potvrdio.
 */

/** Redoslijed usluga u filtrima; isti kljucevi kao vrste upita u obrascu. */
export const USLUGE = ["industrijske", "zavrsni", "kucne", "loxone"];

export const PROJEKTI = {
  // Primjer — zamijeniti stvarnim projektom kad stignu fotografije:
  //
  // "zavrsni/stan-zagreb-2025": {
  //   naziv: { hr: "Stan u Zagrebu", de: "Wohnung in Zagreb", en: "Apartment in Zagreb" },
  //   mjesto: "Zagreb",
  //   godina: 2025,
  //   alt: {
  //     "01.jpg": {
  //       hr: "Kuhinja nakon završnih radova",
  //       de: "Küche nach den Ausbauarbeiten",
  //       en: "Kitchen after the finishing works",
  //     },
  //   },
  // },
};
