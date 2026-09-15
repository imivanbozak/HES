/**
 * konfiguracija.js — postavke okoline.
 *
 * Prazne vrijednosti su ispravno stanje: stranica tada cita katalog iz
 * assets/katalog.json i uopce ne dodiruje mrezu. Tako se moze razvijati,
 * pregledavati i predati klijentu prije nego baza uopce postoji.
 *
 * Anon kljuc je javan po prirodi — on je identitet preglednika, ne tajna.
 * Ono sto stvarno cuva podatke je RLS u bazi HES dashboarda
 * (../HES-Dash/supabase/migrations/202609170001_webshop.sql): katalog se smije
 * samo citati, a upit samo poslati kroz posalji_upit().
 *
 * Baza je zajednicka s dashboardom, pa ovaj kljuc vidi isti projekt u kojem
 * je evidencija rada. Zato u tom projektu registracija mora biti iskljucena.
 *
 * NIKAD ovdje ne stavljati `service_role` kljuc. On zaobilazi RLS i smije
 * postojati iskljucivo na posluzitelju.
 */

export const SUPABASE = {
  url: "https://klxffstmalmwseuxatlv.supabase.co",
  anonKljuc: "sb_publishable_osoI4q_X-7ZwO36LTTGsEQ_yVabgdC3",
};

export const imaOblak = () => Boolean(SUPABASE.url && SUPABASE.anonKljuc);

/** Adresa primatelja upita — koristi se i za mailto zamjenu. */
export const EPOSTA = "alen.hranj@hes.hr";
export const TELEFON = "00385 99 205 7845";
export const TELEFON_VEZA = "tel:0038599 2057845";
