/**
 * najam.js — vremenska crta rezervacija.
 *
 * Redovi su alati, stupci dani: sest tjedana od ponedjeljka ovog tjedna.
 * Puna traka je potvrdena rezervacija, prugasta ceka odluku. Istekli
 * zahtjevi se ne crtaju — termin vise ne drze (je_aktivna() u bazi).
 *
 * Traka iz upita vodi na upit; odluka se donosi ondje, uz kontakt i poruku
 * kupca. Rucno upisana rezervacija (telefonski upit) nema upit, pa se
 * njome upravlja ovdje, u ploci ispod crte.
 *
 * Obrazac "Nova rezervacija" pise izravno u tablicu. Isti okidac koji cuva
 * upite sa stranice cuva i ovaj unos: termin koji se preklapa baza odbije.
 */

import * as veza from "./veza.js";
import { formatDatuma } from "../jezik.js";
import { danasnjiDatum, pomakni } from "../zauzetost.js";
import {
  esc,
  raspon,
  razdobljeTekst,
  jeAktivna,
  trake,
  STATUS_REZERVACIJE,
  rezervacijaHtml,
  izvrsiAkcijuRezervacije,
  greskaBaze,
  greskaHtml,
  obavijest,
  ucitavanjeHtml,
} from "./zajednicko.js";

const DANA = 42;
const MJESECI = ["sij", "velj", "ožu", "tra", "svi", "lip", "srp", "kol", "ruj", "lis", "stu", "pro"];

const utc = (iso) => new Date(`${iso}T00:00:00Z`);
const razlika = (od, doo) => Math.round((utc(doo) - utc(od)) / 86400000);
const ponedjeljak = (iso) => pomakni(iso, -((utc(iso).getUTCDay() + 6) % 7));

// Prikazano razdoblje prezivi odlazak u upit i povratak.
let pocetak = null;

export async function vremenskaCrta(korijen) {
  pocetak ??= ponedjeljak(danasnjiDatum());

  let alati = [];
  let rezervacije = [];
  let otvorenaRucna = null;

  korijen.addEventListener("click", naKlik);
  korijen.addEventListener("submit", naNovu);

  await ucitaj();

  /* ---------------------------------------------------------------- */
  async function ucitaj() {
    korijen.innerHTML = ucitavanjeHtml;
    const kraj = pomakni(pocetak, DANA);
    const prozor = encodeURIComponent(`[${pocetak},${kraj})`);

    const [a, r] = await Promise.all([
      veza.baza("artikli?select=id,naziv,kolicina,aktivan&osnova=eq.dan&order=redoslijed"),
      veza.baza(
        "rezervacije?select=id,artikl_id,upit_id,raspon,kolicina,status,istice,napomena,upiti(ime)" +
          `&status=in.(na_cekanju,potvrdjeno)&raspon=ov.${prozor}`
      ),
    ]);
    if (!a.ok || !r.ok) {
      korijen.innerHTML = greskaHtml(a.greska ?? r.greska);
      return;
    }

    alati = a.podaci;
    rezervacije = r.podaci.filter((x) => jeAktivna(x)).map((x) => ({ ...x, ...raspon(x.raspon) }));
    crtaj();
  }

  /* ---------------------------------------------------------------- */
  function crtaj() {
    const kraj = pomakni(pocetak, DANA);
    const danas = danasnjiDatum();
    const dani = Array.from({ length: DANA }, (_, i) => pomakni(pocetak, i));
    const stupacDanas = danas >= pocetak && danas < kraj ? razlika(pocetak, danas) + 1 : null;

    const zaglavlje = dani
      .map((dan, i) => {
        const datum = utc(dan);
        const tjedan = datum.getUTCDay();
        const razredi = ["vt__dan"];
        if (tjedan === 0 || tjedan === 6) razredi.push("vt__dan--vikend");
        if (dan === danas) razredi.push("vt__dan--danas");
        const mjesec = i === 0 || datum.getUTCDate() === 1 ? `<span class="vt__mjesec">${MJESECI[datum.getUTCMonth()]}</span>` : "";
        return `<div class="${razredi.join(" ")}" title="${esc(formatDatuma(dan, { godina: true }, "hr"))}">${mjesec}${datum.getUTCDate()}</div>`;
      })
      .join("");

    const redovi = alati
      .map((alat) => {
        const svoje = trake(rezervacije.filter((r) => r.artikl_id === alat.id));
        const brojTraka = Math.max(1, ...svoje.map((r) => r.traka + 1));

        const trakeHtml = svoje
          .map((r) => {
            const s = r.od < pocetak ? pocetak : r.od;
            const e = r.doo > kraj ? kraj : r.doo;
            const stupci = `${razlika(pocetak, s) + 1} / ${razlika(pocetak, e) + 1}`;
            const ime = r.upiti?.ime ?? r.napomena ?? "Ručni unos";
            const opis = `${ime} · ${razdobljeTekst(r.od, r.doo)} · ${STATUS_REZERVACIJE[r.status]}${
              r.kolicina > 1 ? ` · × ${r.kolicina}` : ""
            }`;
            const stil = `grid-column: ${stupci}; grid-row: ${r.traka + 1}`;
            return r.upit_id
              ? `<a class="vt__traka vt__traka--${esc(r.status)}" href="#upit=${esc(r.upit_id)}" style="${stil}" title="${esc(opis)}">${esc(ime)}</a>`
              : `<button class="vt__traka vt__traka--${esc(r.status)}" type="button" data-rucna="${esc(r.id)}" style="${stil}" title="${esc(opis)}">${esc(ime)}</button>`;
          })
          .join("");

        return `
          <div class="vt__alat">
            <span>${esc(alat.naziv)}</span>
            <span class="jedva">${alat.aktivan ? `${alat.kolicina} kom` : "skriven"}</span>
          </div>
          <div class="vt__staza">
            ${stupacDanas ? `<span class="vt__danas" style="grid-column: ${stupacDanas}; grid-row: 1 / span ${brojTraka}"></span>` : ""}
            ${trakeHtml}
          </div>`;
      })
      .join("");

    const rucna = otvorenaRucna ? rezervacije.find((r) => r.id === otvorenaRucna) : null;
    const nazivAlata = (id) => alati.find((a) => a.id === id)?.naziv ?? id;

    korijen.innerHTML = `
      <header class="admin__glava">
        <div>
          <p class="oznaka">Najam alata</p>
          <h1 class="naslov-2">Vremenska crta</h1>
        </div>
        <div class="admin__filtri" role="group" aria-label="Razdoblje">
          <button type="button" data-pomak="-7">← Tjedan</button>
          <button type="button" data-pomak="danas">Danas</button>
          <button type="button" data-pomak="7">Tjedan →</button>
        </div>
      </header>

      <p class="jedva">
        ${esc(razdobljeTekst(pocetak, kraj))}. Puna traka je potvrđena rezervacija, prugasta čeka odluku
        (48 sati od upita). Klik na traku iz upita otvara upit.
      </p>

      <div class="vt">
        <div class="vt__mreza" style="--dana: ${DANA}">
          <div class="vt__kut">Alat</div>
          <div class="vt__dani">${zaglavlje}</div>
          ${redovi || '<div class="vt__alat">Nema alata za najam.</div><div></div>'}
        </div>
      </div>

      ${
        rucna
          ? `<section class="admin__kartica">
              <h2 class="naslov-3">Ručna rezervacija</h2>
              <ul class="admin__rezervacije">${rezervacijaHtml({ ...rucna, artikli: { naziv: nazivAlata(rucna.artikl_id) } })}</ul>
            </section>`
          : ""
      }

      <form class="admin__kartica admin__nova" data-nova>
        <h2 class="naslov-3">Nova rezervacija</h2>
        <p class="jedva">Za najam dogovoren telefonom ili uživo. Vrijedi isto pravilo zauzetosti kao za upite sa stranice.</p>
        <div class="admin__polja">
          <p class="polje-obrasca">
            <label class="polje-obrasca__oznaka" for="nova-alat">Alat</label>
            <select class="polje-obrasca__ulaz" id="nova-alat" name="artikl" required>
              ${alati
                .filter((a) => a.aktivan)
                .map((a) => `<option value="${esc(a.id)}">${esc(a.naziv)}</option>`)
                .join("")}
            </select>
          </p>
          <p class="polje-obrasca">
            <label class="polje-obrasca__oznaka" for="nova-od">Preuzimanje</label>
            <input class="polje-obrasca__ulaz" type="date" id="nova-od" name="od" required>
          </p>
          <p class="polje-obrasca">
            <label class="polje-obrasca__oznaka" for="nova-do">Povrat</label>
            <input class="polje-obrasca__ulaz" type="date" id="nova-do" name="do" required>
          </p>
          <p class="polje-obrasca">
            <label class="polje-obrasca__oznaka" for="nova-kolicina">Komada</label>
            <input class="polje-obrasca__ulaz" type="number" id="nova-kolicina" name="kolicina" min="1" max="99" value="1" required>
          </p>
          <p class="polje-obrasca">
            <label class="polje-obrasca__oznaka" for="nova-status">Status</label>
            <select class="polje-obrasca__ulaz" id="nova-status" name="status">
              <option value="potvrdjeno">Potvrđeno</option>
              <option value="na_cekanju">Na čekanju (drži termin do odluke)</option>
            </select>
          </p>
          <p class="polje-obrasca admin__polje--siroko">
            <label class="polje-obrasca__oznaka" for="nova-napomena">Napomena — kupac, telefon</label>
            <input class="polje-obrasca__ulaz" type="text" id="nova-napomena" name="napomena" maxlength="1000">
          </p>
        </div>
        <div class="admin__akcije">
          <button class="gumb gumb--glavni" type="submit">Dodaj rezervaciju</button>
        </div>
      </form>`;
  }

  /* ---------------------------------------------------------------- */
  async function naKlik(dogadaj) {
    const pomak = dogadaj.target.closest("[data-pomak]")?.dataset.pomak;
    if (pomak) {
      pocetak = pomak === "danas" ? ponedjeljak(danasnjiDatum()) : pomakni(pocetak, Number(pomak));
      otvorenaRucna = null;
      await ucitaj();
      return;
    }

    const rucna = dogadaj.target.closest("[data-rucna]");
    if (rucna) {
      otvorenaRucna = otvorenaRucna === rucna.dataset.rucna ? null : rucna.dataset.rucna;
      crtaj();
      return;
    }

    const akcija = dogadaj.target.closest("[data-rez-akcija]");
    if (akcija) {
      const id = akcija.closest("[data-rezervacija]")?.dataset.rezervacija;
      akcija.disabled = true;
      const ishod = await izvrsiAkcijuRezervacije(veza, id, akcija.dataset.rezAkcija);
      if (!ishod.ok) {
        obavijest(greskaBaze(ishod.greska), "greska");
        akcija.disabled = false;
        return;
      }
      obavijest("Spremljeno.");
      if (akcija.dataset.rezAkcija === "obrisi") otvorenaRucna = null;
      await ucitaj();
    }
  }

  async function naNovu(dogadaj) {
    if (!dogadaj.target.matches("[data-nova]")) return;
    dogadaj.preventDefault();

    const podaci = new FormData(dogadaj.target);
    const od = String(podaci.get("od") ?? "");
    const doo = String(podaci.get("do") ?? "");
    if (!od || !doo || doo <= od) {
      obavijest("Dan povrata mora biti nakon dana preuzimanja.", "greska");
      return;
    }

    const ishod = await veza.baza("rezervacije", {
      method: "POST",
      zaglavlja: { Prefer: "return=minimal" },
      tijelo: {
        artikl_id: String(podaci.get("artikl")),
        raspon: `[${od},${doo})`,
        kolicina: Math.max(1, Math.min(99, Number(podaci.get("kolicina")) || 1)),
        status: String(podaci.get("status")),
        napomena: String(podaci.get("napomena") ?? "").trim() || null,
      },
    });

    if (!ishod.ok) {
      obavijest(greskaBaze(ishod.greska), "greska");
      return;
    }
    obavijest("Rezervacija je dodana.");
    // Crta skoci na tjedan nove rezervacije, da se vidi gdje je sjela.
    if (od < pocetak || od >= pomakni(pocetak, DANA)) pocetak = ponedjeljak(od);
    await ucitaj();
  }
}
