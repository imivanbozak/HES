/**
 * konfiguracija.js — postavke okoline.
 *
 * Prazne vrijednosti su ispravno stanje: stranica tada cita katalog iz
 * assets/katalog.json i uopce ne dodiruje mrezu. Tako se moze razvijati,
 * pregledavati i predati klijentu prije nego baza uopce postoji.
 *
 * Anon kljuc je javan po prirodi — on je identitet preglednika, ne tajna.
 * Ono sto stvarno cuva podatke je RLS u supabase/shema.sql: katalog se smije
 * samo citati, a tablica upita samo pisati.
 *
 * NIKAD ovdje ne stavljati `service_role` kljuc. On zaobilazi RLS i smije
 * postojati iskljucivo u rubnoj funkciji, na posluzitelju.
 */

export const SUPABASE = {
  url: "sb_publishable_dI5tlXmvebMLwC5NeEQOjw_6saSSaLr",
  anonKljuc: "sb_publishable_dI5tlXmvebMLwC5NeEQOjw_6saSSaLr",
};

export const imaOblak = () => Boolean(SUPABASE.url && SUPABASE.anonKljuc);

/** Adresa primatelja upita — koristi se i za mailto zamjenu. */
export const EPOSTA = "alen.hranj@hes.hr";
export const TELEFON = "00385 99 205 7845";
export const TELEFON_VEZA = "tel:0038599 2057845";
