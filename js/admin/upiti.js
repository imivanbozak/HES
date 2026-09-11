/**
 * upiti.js — popis upita i jedan upit.
 *
 * Popis stoji na "otvorenima" (novo + u obradi), jer je to posao koji ceka.
 * Uz svaki upit dvije znacke koje traze paznju:
 *   - "mail nije poslan": upit je u bazi, ali o njemu nitko nije obavijesten
 *     (rubna funkcija ili Resend su pali). Bez ove znacke takav upit bi se
 *     vidio samo slucajno.
 *   - "najam ceka odluku": ima rezervaciju na cekanju kojoj rok jos traje.
 *
 * U jednom upitu odluka o najmu ide po alatu (Potvrdi / Odbij / Otkazi), a
 * kupcu se javlja jednim mailom za sve alate odjednom — "Posalji kupcu
 * odgovor" zove rubnu funkciju tek kad su odluke donesene.
 */

import * as veza from "./veza.js";
import { formatCijene } from "../jezik.js";
import {
  esc,
  vrijeme,
  VRSTE,
  STATUS_UPITA,
  jeAktivna,
  razdobljeTekst,
  rezervacijaHtml,
  izvrsiAkcijuRezervacije,
  greskaBaze,
  greskaHtml,
  obavijest,
  ucitavanjeHtml,
} from "./zajednicko.js";

const FILTRI = [
  ["otvoreni", "Otvoreni", "in.(novo,u_obradi)"],
  ["novo", "Novo", "eq.novo"],
  ["u_obradi", "U obradi", "eq.u_obradi"],
  ["zatvoreno", "Zatvoreno", "eq.zatvoreno"],
  ["svi", "Svi", null],
];

// Filtar prezivi odlazak u upit i povratak na popis.
let filtar = "otvoreni";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* ================================================================== */
/* Popis                                                               */
/* ================================================================== */
export async function popisUpita(korijen) {
  korijen.innerHTML = ucitavanjeHtml;

  const uvjet = FILTRI.find(([kljuc]) => kljuc === filtar)?.[2];
  const [upiti, cekanje] = await Promise.all([
    veza.baza(
      "upiti?select=id,stvoreno,vrsta,ime,email,status,poslano_mailom,procjena_cents,stavke" +
        (uvjet ? `&status=${uvjet}` : "") +
        "&order=stvoreno.desc&limit=300"
    ),
    veza.baza("rezervacije?select=upit_id,status,istice&status=eq.na_cekanju&upit_id=not.is.null"),
  ]);
  if (!upiti.ok) {
    korijen.innerHTML = greskaHtml(upiti.greska);
    return;
  }

  const naCekanju = new Set((cekanje.podaci ?? []).filter((r) => jeAktivna(r)).map((r) => r.upit_id));

  const redak = (u) => {
    const stavke = Array.isArray(u.stavke) ? u.stavke : [];
    const znacke = [];
    if (!u.poslano_mailom) {
      znacke.push(
        '<span class="admin__znacka admin__znacka--upozorenje" title="Upit je upisan, ali e-pošta o njemu nije poslana">mail nije poslan</span>'
      );
    }
    if (naCekanju.has(u.id)) {
      znacke.push('<span class="admin__znacka admin__znacka--na_cekanju">najam čeka odluku</span>');
    }
    return `
      <tr>
        <td class="monr"><a href="#upit=${esc(u.id)}">${esc(vrijeme(u.stvoreno))}</a></td>
        <td><a href="#upit=${esc(u.id)}">${esc(u.ime)}</a><br><span class="jedva">${esc(u.email)}</span></td>
        <td>${esc(VRSTE[u.vrsta] ?? u.vrsta)}</td>
        <td class="monr">${stavke.length || "—"}</td>
        <td class="monr">${stavke.length ? esc(formatCijene(u.procjena_cents ?? 0, "hr")) : "—"}</td>
        <td><span class="admin__znacka admin__znacka--${esc(u.status)}">${esc(STATUS_UPITA[u.status] ?? u.status)}</span> ${znacke.join(" ")}</td>
      </tr>`;
  };

  korijen.innerHTML = `
    <header class="admin__glava">
      <div>
        <p class="oznaka">Obrazac i košarica</p>
        <h1 class="naslov-2">Upiti</h1>
      </div>
      <div class="admin__filtri" role="group" aria-label="Status upita" data-filtri>
        ${FILTRI.map(
          ([kljuc, ime]) =>
            `<button type="button" data-filtar="${kljuc}" aria-pressed="${kljuc === filtar}">${esc(ime)}</button>`
        ).join("")}
      </div>
    </header>
    ${
      upiti.podaci.length
        ? `<div class="admin__omot-tablice">
            <table class="admin__tablica">
              <thead><tr><th>Primljeno</th><th>Kupac</th><th>Vrsta</th><th>Stavke</th><th>Procjena</th><th>Stanje</th></tr></thead>
              <tbody>${upiti.podaci.map(redak).join("")}</tbody>
            </table>
          </div>`
        : '<p class="tiho">Nema upita s ovim statusom.</p>'
    }`;

  korijen.querySelector("[data-filtri]").addEventListener("click", (dogadaj) => {
    const gumb = dogadaj.target.closest("[data-filtar]");
    if (!gumb || gumb.dataset.filtar === filtar) return;
    filtar = gumb.dataset.filtar;
    popisUpita(korijen);
  });
}

/* ================================================================== */
/* Jedan upit                                                          */
/* ================================================================== */
export async function jedanUpit(korijen, id) {
  if (!UUID.test(id)) {
    location.hash = "#upiti";
    return;
  }
  korijen.innerHTML = ucitavanjeHtml;

  let upit = null;
  let rezervacije = [];

  const ucitajUpit = async () => {
    const ishod = await veza.baza(`upiti?id=eq.${id}&select=*`);
    if (!ishod.ok) return ishod;
    upit = ishod.podaci[0] ?? null;
    return ishod;
  };
  const ucitajRezervacije = async () => {
    const ishod = await veza.baza(
      `rezervacije?upit_id=eq.${id}&select=id,raspon,kolicina,status,istice,artikl_id,upit_id,napomena,artikli(naziv)&order=raspon`
    );
    if (ishod.ok) rezervacije = ishod.podaci;
    return ishod;
  };

  const [prvi] = await Promise.all([ucitajUpit(), ucitajRezervacije()]);
  if (!prvi.ok) {
    korijen.innerHTML = greskaHtml(prvi.greska);
    return;
  }
  if (!upit) {
    korijen.innerHTML = `
      <p><a class="admin__natrag" href="#upiti">← Svi upiti</a></p>
      <div class="admin__kartica"><p>Upit ne postoji. Možda je obrisan.</p></div>`;
    return;
  }

  crtaj();

  /* ---------------------------------------------------------------- */
  function crtaj() {
    const stavke = Array.isArray(upit.stavke) ? upit.stavke : [];

    const redakStavke = (s) => {
      const razdoblje =
        s.osnova === "dan" && s.od_datuma && s.do_datuma
          ? `<br><span class="jedva monr">${esc(razdobljeTekst(s.od_datuma, s.do_datuma))} · ${s.dana} d</span>`
          : "";
      return `
        <tr>
          <td>${esc(s.naziv)}${razdoblje}</td>
          <td class="monr">× ${Number(s.kolicina) || 1}</td>
          <td class="monr">${esc(formatCijene(s.iznos_cents ?? 0, "hr"))}</td>
        </tr>`;
    };

    korijen.innerHTML = `
      <p><a class="admin__natrag" href="#upiti">← Svi upiti</a></p>

      <header class="admin__glava">
        <div>
          <p class="oznaka">${esc(VRSTE[upit.vrsta] ?? upit.vrsta)} · ${esc(vrijeme(upit.stvoreno))}</p>
          <h1 class="naslov-2">${esc(upit.ime)}</h1>
        </div>
        <span class="admin__znacka admin__znacka--${esc(upit.status)}">${esc(STATUS_UPITA[upit.status] ?? upit.status)}</span>
      </header>

      <div class="admin__mreza">
        <section class="admin__kartica">
          <h2 class="naslov-3">Kontakt</h2>
          <dl class="admin__podaci">
            <div><dt>E-pošta</dt><dd><a href="mailto:${esc(upit.email)}">${esc(upit.email)}</a></dd></div>
            <div><dt>Telefon</dt><dd>${
              upit.telefon ? `<a href="tel:${esc(upit.telefon.replace(/\s+/g, ""))}">${esc(upit.telefon)}</a>` : "—"
            }</dd></div>
            <div><dt>Jezik stranice</dt><dd>${esc(upit.jezik)}</dd></div>
            <div><dt>Obavijest mailom</dt><dd>${
              upit.poslano_mailom
                ? "poslana"
                : '<span class="admin__znacka admin__znacka--upozorenje">nije poslana</span>'
            }</dd></div>
          </dl>
          ${
            upit.poruka
              ? `<h3 class="oznaka">Poruka</h3><p class="admin__poruka-kupca">${esc(upit.poruka)}</p>`
              : ""
          }
        </section>

        ${
          stavke.length
            ? `<section class="admin__kartica">
                <h2 class="naslov-3">Košarica</h2>
                <table class="admin__tablica admin__tablica--mala">
                  <tbody>${stavke.map(redakStavke).join("")}</tbody>
                </table>
                <p><strong>Procjena: ${esc(formatCijene(upit.procjena_cents ?? 0, "hr"))}</strong><br>
                  <span class="jedva">Cijene su snimljene u trenutku slanja.</span></p>
              </section>`
            : ""
        }

        ${
          rezervacije.length
            ? `<section class="admin__kartica">
                <h2 class="naslov-3">Najam</h2>
                <ul class="admin__rezervacije">${rezervacije.map((r) => rezervacijaHtml(r)).join("")}</ul>
                <p class="polje-obrasca">
                  <label class="polje-obrasca__oznaka" for="poruka-kupcu">Poruka kupcu (neobavezno)</label>
                  <textarea class="polje-obrasca__ulaz" id="poruka-kupcu" rows="3" maxlength="2000" data-poruka-kupcu
                            placeholder="Npr. mjesto i vrijeme preuzimanja"></textarea>
                </p>
                <div class="admin__akcije">
                  <button class="gumb gumb--glavni" type="button" data-posalji-odluku>Pošalji kupcu odgovor</button>
                </div>
                <p class="jedva">Kupac dobiva popis alata s odlukom za svaki, na jeziku na kojem je poslao upit.
                  Promjena statusa sama ne šalje ništa.</p>
              </section>`
            : ""
        }

        <section class="admin__kartica">
          <h2 class="naslov-3">Obrada</h2>
          <p class="polje-obrasca">
            <label class="polje-obrasca__oznaka" for="status-upita">Status</label>
            <select class="polje-obrasca__ulaz" id="status-upita" data-status>
              ${Object.entries(STATUS_UPITA)
                .map(([kljuc, ime]) => `<option value="${kljuc}"${kljuc === upit.status ? " selected" : ""}>${esc(ime)}</option>`)
                .join("")}
            </select>
          </p>
          <p class="polje-obrasca">
            <label class="polje-obrasca__oznaka" for="napomena-upita">Interna napomena</label>
            <textarea class="polje-obrasca__ulaz" id="napomena-upita" rows="4" maxlength="4000" data-napomena>${esc(
              upit.napomena_admina ?? ""
            )}</textarea>
          </p>
          <div class="admin__akcije">
            <button class="gumb gumb--glavni" type="button" data-spremi>Spremi</button>
          </div>
          <hr class="admin__crta">
          <div class="admin__akcije">
            <button class="gumb gumb--tihi admin__opasno" type="button" data-obrisi>Obriši upit</button>
          </div>
          <p class="jedva">Brisanje je trajno i briše i rezervacije iz upita. Namijenjeno je zahtjevima za brisanje
            osobnih podataka; za završen posao koristite status „Zatvoreno”.</p>
        </section>
      </div>`;
  }

  /* ---------------------------------------------------------------- */
  // Jedan slusac na spremniku ekrana: crtaj() mijenja sadrzaj, ali ne i njega.
  korijen.addEventListener("click", async (dogadaj) => {
    const akcijaRezervacije = dogadaj.target.closest("[data-rez-akcija]");
    if (akcijaRezervacije) {
      const idRezervacije = akcijaRezervacije.closest("[data-rezervacija]")?.dataset.rezervacija;
      akcijaRezervacije.disabled = true;
      const ishod = await izvrsiAkcijuRezervacije(veza, idRezervacije, akcijaRezervacije.dataset.rezAkcija);
      if (!ishod.ok) {
        obavijest(greskaBaze(ishod.greska), "greska");
        akcijaRezervacije.disabled = false;
        return;
      }
      // Prva odluka o najmu znaci da je upit u obradi.
      if (upit.status === "novo") {
        const promjena = await veza.baza(`upiti?id=eq.${id}`, { method: "PATCH", tijelo: { status: "u_obradi" } });
        if (promjena.ok) upit.status = "u_obradi";
      }
      await ucitajRezervacije();
      crtaj();
      obavijest("Spremljeno. Kupcu javite gumbom „Pošalji kupcu odgovor”.");
      return;
    }

    if (dogadaj.target.closest("[data-posalji-odluku]")) {
      const gumb = dogadaj.target.closest("[data-posalji-odluku]");
      const poruka = korijen.querySelector("[data-poruka-kupcu]")?.value.trim() ?? "";
      gumb.disabled = true;
      const ishod = await veza.funkcija("posalji-upit", { akcija: "odluka", upit_id: id, poruka });
      gumb.disabled = false;
      if (ishod.ok && ishod.podaci?.ok !== false) {
        obavijest(`Odgovor je poslan na ${upit.email}.`);
      } else {
        obavijest(`Odgovor nije poslan: ${ishod.greska ?? ishod.podaci?.greska ?? "nepoznata greška"}`, "greska");
      }
      return;
    }

    if (dogadaj.target.closest("[data-spremi]")) {
      const status = korijen.querySelector("[data-status]").value;
      const napomena = korijen.querySelector("[data-napomena]").value.trim();
      const ishod = await veza.baza(`upiti?id=eq.${id}`, {
        method: "PATCH",
        tijelo: { status, napomena_admina: napomena || null },
      });
      if (!ishod.ok) {
        obavijest(greskaBaze(ishod.greska), "greska");
        return;
      }
      upit.status = status;
      upit.napomena_admina = napomena;
      crtaj();
      obavijest("Spremljeno.");
      return;
    }

    // Brisanje u dva koraka, bez dijaloga preglednika: prvi klik pita,
    // drugi brise. Klik bilo gdje drugdje vraca gumb u prvo stanje.
    const obrisi = dogadaj.target.closest("[data-obrisi]");
    if (obrisi) {
      if (!obrisi.dataset.potvrda) {
        obrisi.dataset.potvrda = "1";
        obrisi.textContent = "Stvarno obrisati? Klik za potvrdu";
        return;
      }
      const ishod = await veza.baza(`upiti?id=eq.${id}`, { method: "DELETE" });
      if (!ishod.ok) {
        obavijest(greskaBaze(ishod.greska), "greska");
        return;
      }
      obavijest("Upit je obrisan.");
      location.hash = "#upiti";
      return;
    }

    const cekaPotvrdu = korijen.querySelector("[data-obrisi][data-potvrda]");
    if (cekaPotvrdu) {
      delete cekaPotvrdu.dataset.potvrda;
      cekaPotvrdu.textContent = "Obriši upit";
    }
  });
}
