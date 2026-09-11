/**
 * main.js — ulaz admin panela.
 *
 * Tri ekrana, adresa u hashu:
 *   #upiti          popis upita (zadano)
 *   #upit=<id>      jedan upit — ovu adresu rubna funkcija salje u mailu
 *   #najam          vremenska crta rezervacija
 *   #artikli        cijene, stanje i vidljivost
 *
 * Svaki ekran dobiva SVJEZ spremnik. Slusaci koje ekran veze na njega
 * nestaju zajedno s njim, pa se pri prelasku s ekrana na ekran ne gomilaju.
 *
 * Kartice u traci crta ovaj modul, ne HTML: statican <a href="#upiti"> bez
 * odredista na stranici scripts/provjere.py broji kao mrtvo sidro.
 */

import * as veza from "./veza.js";
import { popisUpita, jedanUpit } from "./upiti.js";
import { vremenskaCrta } from "./najam.js";
import { tablicaArtikala } from "./artikli.js";
import { esc } from "./zajednicko.js";

const KARTICE = [
  ["upiti", "Upiti"],
  ["najam", "Najam"],
  ["artikli", "Artikli"],
];

const el = {
  prijava: document.querySelector("[data-admin-prijava]"),
  greska: document.querySelector("[data-admin-greska]"),
  ekran: document.querySelector("[data-admin-ekran]"),
  kartice: document.querySelector("[data-admin-kartice]"),
  korisnik: document.querySelector("[data-admin-korisnik]"),
  email: document.querySelector("[data-admin-email]"),
  odjava: document.querySelector("[data-admin-odjava]"),
};

function prikaziPrijavu(poruka = "") {
  el.kartice.hidden = true;
  el.korisnik.hidden = true;
  el.ekran.replaceChildren();
  el.prijava.hidden = false;
  el.greska.hidden = !poruka;
  el.greska.textContent = poruka;
  el.prijava.querySelector("input")?.focus();
}

function prikaziAplikaciju() {
  el.prijava.hidden = true;
  el.kartice.hidden = false;
  el.korisnik.hidden = false;
  el.email.textContent = veza.email();
  crtajEkran();
}

function crtajEkran() {
  if (!veza.jePrijavljen() || !el.prijava.hidden) return;

  const [ime, parametar = ""] = (location.hash.slice(1) || "upiti").split("=");
  const kartica = ime === "upit" ? "upiti" : ime;

  for (const poveznica of el.kartice.querySelectorAll("a")) {
    if (poveznica.dataset.kartica === kartica) poveznica.setAttribute("aria-current", "page");
    else poveznica.removeAttribute("aria-current");
  }

  const ekran = document.createElement("div");
  ekran.className = "admin__ekran";
  el.ekran.replaceChildren(ekran);

  if (ime === "upit") jedanUpit(ekran, decodeURIComponent(parametar));
  else if (ime === "najam") vremenskaCrta(ekran);
  else if (ime === "artikli") tablicaArtikala(ekran);
  else popisUpita(ekran);
}

async function prijavi(dogadaj) {
  dogadaj.preventDefault();
  const podaci = new FormData(el.prijava);
  const gumb = el.prijava.querySelector('button[type="submit"]');
  gumb.disabled = true;
  el.greska.hidden = true;

  const ishod = await veza.prijava(String(podaci.get("email") ?? "").trim(), String(podaci.get("lozinka") ?? ""));
  if (!ishod.ok) {
    gumb.disabled = false;
    prikaziPrijavu(ishod.greska);
    return;
  }

  // Prijava uspjela ne znaci admin. Racun koji nije u tablici `admini` ne
  // bi vidio nista (RLS), pa se odmah odjavljuje s jasnim razlogom.
  if (!(await veza.jeAdmin())) {
    await veza.odjava();
    gumb.disabled = false;
    prikaziPrijavu("Ovaj račun nema administratorska prava.");
    return;
  }

  gumb.disabled = false;
  el.prijava.reset();
  prikaziAplikaciju();
}

async function pokreni() {
  if (!veza.imaOblak()) {
    el.ekran.innerHTML = `
      <div class="admin__kartica">
        <h1 class="naslov-3">Baza nije podešena</h1>
        <p>Upišite adresu projekta i anon ključ u <code>js/konfiguracija.js</code>. Koraci su u <code>supabase/README.md</code>.</p>
      </div>`;
    return;
  }

  el.kartice.innerHTML = KARTICE.map(
    ([kljuc, ime]) => `<a href="#${kljuc}" data-kartica="${kljuc}">${esc(ime)}</a>`
  ).join("");

  el.prijava.addEventListener("submit", prijavi);
  el.odjava.addEventListener("click", async () => {
    await veza.odjava();
    prikaziPrijavu();
  });
  window.addEventListener("hashchange", crtajEkran);
  document.addEventListener("admin:odjavljen", () => prikaziPrijavu("Sesija je istekla. Prijavite se ponovno."));

  if (veza.jePrijavljen() && (await veza.jeAdmin())) prikaziAplikaciju();
  else prikaziPrijavu();
}

pokreni();
