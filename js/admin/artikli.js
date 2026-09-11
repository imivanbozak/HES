/**
 * artikli.js — cijene, stanje i vidljivost.
 *
 * Jedna tablica po zalihi (Loxone po komadu, alati po danu), spremanje po
 * retku. Redak koji je promijenjen, a nije spremljen, nosi crtu s lijeve
 * strane i aktivan gumb; sve ostalo ostaje mirno.
 *
 * Unos mijenja RADNU kopiju i samo svoj redak. Precrtavanje cijele tablice
 * izbacilo bi kursor iz polja na svakoj znamenki, a radna kopija prezivi i
 * prelazak na drugu karticu ili pretragu — nespremljen unos se ne gubi.
 *
 * Cijena se unosi kao "655,61" i pretvara u cente znamenku po znamenku
 * (zajednicko.js, uCente). Unos koji nije cijena ne sprema se uopce.
 *
 * Sto se NE mijenja ovdje: naziv, marka i kategorije. Oni dolaze iz izvoza
 * kroz scripts/seed.py, a stranice proizvoda su po njima generirane.
 */

import * as veza from "./veza.js";
import { esc, uCente, izCenti, vrijeme, greskaBaze, greskaHtml, obavijest, ucitavanjeHtml } from "./zajednicko.js";

const ZALIHE = [
  ["kom", "Loxone"],
  ["dan", "Najam alata"],
];

// Kartica i pretraga preziviju odlazak na drugi ekran.
let osnova = "kom";
let trazi = "";

export async function tablicaArtikala(korijen) {
  korijen.innerHTML = ucitavanjeHtml;

  const ishod = await veza.baza(
    "artikli?select=id,vrsta,naziv,marka,cijena_cents,osnova,na_stanju,kolicina,aktivan,azurirano&order=redoslijed"
  );
  if (!ishod.ok) {
    korijen.innerHTML = greskaHtml(ishod.greska);
    return;
  }

  const spremljeno = new Map(ishod.podaci.map((a) => [a.id, { ...a }]));
  const radno = new Map(ishod.podaci.map((a) => [a.id, { ...a, cijena: izCenti(a.cijena_cents), poruka: "" }]));

  korijen.innerHTML = `
    <header class="admin__glava">
      <div>
        <p class="oznaka">Katalog</p>
        <h1 class="naslov-2">Artikli</h1>
      </div>
      <div class="admin__filtri" role="group" aria-label="Zaliha" data-zalihe>
        ${ZALIHE.map(
          ([kljuc, ime]) => `<button type="button" data-osnova="${kljuc}" aria-pressed="${kljuc === osnova}">${esc(ime)}</button>`
        ).join("")}
      </div>
    </header>

    <p class="jedva">
      Cijena, stanje i vidljivost u katalogu i košarici mijenjaju se čim se spreme. Cijena u opisu stranice
      za tražilice osvježava se tek s <code>npm run povuci</code> i <code>npm run stranice</code>.
      Skriven artikl nestaje iz kataloga, ali njegova stranica ostaje, bez gumba za košaricu.
    </p>

    <p class="polje-obrasca admin__trazi">
      <label class="polje-obrasca__oznaka" for="trazi-artikl">Traži</label>
      <input class="polje-obrasca__ulaz" type="search" id="trazi-artikl" data-trazi value="${esc(trazi)}" autocomplete="off">
    </p>

    <div class="admin__omot-tablice">
      <table class="admin__tablica">
        <thead>
          <tr><th>Artikl</th><th>Cijena</th><th data-stupac-stanja></th><th>Vidljiv</th><th><span class="samo-citac">Spremanje</span></th></tr>
        </thead>
        <tbody data-redovi></tbody>
      </table>
    </div>`;

  const tijelo = korijen.querySelector("[data-redovi]");
  const stupacStanja = korijen.querySelector("[data-stupac-stanja]");

  /** Sto se u retku razlikuje od spremljenog, u obliku za PATCH. */
  function promjene(id) {
    const r = radno.get(id);
    const s = spremljeno.get(id);
    const p = {};
    const cente = uCente(r.cijena);
    if (cente !== s.cijena_cents) p.cijena_cents = cente;
    if (r.na_stanju !== s.na_stanju) p.na_stanju = r.na_stanju;
    if (Number(r.kolicina) !== s.kolicina) p.kolicina = Number(r.kolicina);
    if (r.aktivan !== s.aktivan) p.aktivan = r.aktivan;
    return p;
  }

  function redak(a) {
    const promijenjen = Object.keys(promjene(a.id)).length > 0;
    const neispravnaCijena = uCente(a.cijena) === null;

    const stanje =
      a.osnova === "dan"
        ? `<input class="polje-obrasca__ulaz monr admin__broj" type="number" min="0" max="99" data-polje="kolicina"
                  value="${Number(a.kolicina)}" aria-label="Komada za najam: ${esc(a.naziv)}">`
        : `<label class="admin__kvacica"><input type="checkbox" data-polje="na_stanju"${a.na_stanju ? " checked" : ""}> na stanju</label>`;

    return `
      <tr data-artikl="${esc(a.id)}"${promijenjen ? ' class="admin__redak--promijenjen"' : ""}>
        <td>${esc(a.naziv)}${a.marka ? `<br><span class="jedva">${esc(a.marka)}</span>` : ""}</td>
        <td>
          <span class="admin__cijena">
            <input class="polje-obrasca__ulaz monr" inputmode="decimal" data-polje="cijena" value="${esc(a.cijena)}"
                   aria-label="Cijena: ${esc(a.naziv)}"${neispravnaCijena ? ' aria-invalid="true"' : ""}>
            <span class="jedva">€ / ${a.osnova === "dan" ? "dan" : "kom"}</span>
          </span>
        </td>
        <td>${stanje}</td>
        <td><input type="checkbox" data-polje="aktivan"${a.aktivan ? " checked" : ""} aria-label="Vidljiv u katalogu: ${esc(a.naziv)}"></td>
        <td class="admin__spremi">
          <button class="gumb gumb--sporedni" type="button" data-spremi${promijenjen && !neispravnaCijena ? "" : " disabled"}>Spremi</button>
          <span class="jedva" data-stanje-retka>${esc(neispravnaCijena ? "Cijena npr. 655,61" : a.poruka)}</span>
        </td>
      </tr>`;
  }

  function crtajRedove() {
    stupacStanja.textContent = osnova === "dan" ? "Komada" : "Stanje";
    const upit = trazi.trim().toLowerCase();
    const popis = [...radno.values()].filter(
      (a) =>
        a.osnova === osnova &&
        (!upit || a.naziv.toLowerCase().includes(upit) || (a.marka ?? "").toLowerCase().includes(upit))
    );
    tijelo.innerHTML = popis.length
      ? popis.map(redak).join("")
      : '<tr><td colspan="5" class="tiho">Nema artikala.</td></tr>';
  }

  crtajRedove();

  /* ---------------------------------------------------------------- */
  korijen.querySelector("[data-zalihe]").addEventListener("click", (dogadaj) => {
    const gumb = dogadaj.target.closest("[data-osnova]");
    if (!gumb) return;
    osnova = gumb.dataset.osnova;
    for (const drugi of korijen.querySelectorAll("[data-osnova]")) {
      drugi.setAttribute("aria-pressed", String(drugi === gumb));
    }
    crtajRedove();
  });

  korijen.querySelector("[data-trazi]").addEventListener("input", (dogadaj) => {
    trazi = dogadaj.target.value;
    crtajRedove();
  });

  const azuriraj = (dogadaj) => {
    const polje = dogadaj.target.closest("[data-polje]");
    if (!polje) return;
    const tr = polje.closest("[data-artikl]");
    const a = radno.get(tr.dataset.artikl);

    a[polje.dataset.polje] = polje.type === "checkbox" ? polje.checked : polje.value;
    a.poruka = "";

    const neispravna = uCente(a.cijena) === null;
    const promijenjen = Object.keys(promjene(a.id)).length > 0;
    tr.classList.toggle("admin__redak--promijenjen", promijenjen);
    tr.querySelector("[data-spremi]").disabled = neispravna || !promijenjen;

    const cijena = tr.querySelector('[data-polje="cijena"]');
    if (neispravna) cijena.setAttribute("aria-invalid", "true");
    else cijena.removeAttribute("aria-invalid");
    tr.querySelector("[data-stanje-retka]").textContent = neispravna ? "Cijena npr. 655,61" : "";
  };
  tijelo.addEventListener("input", azuriraj);
  tijelo.addEventListener("change", azuriraj);

  tijelo.addEventListener("click", async (dogadaj) => {
    const gumb = dogadaj.target.closest("[data-spremi]");
    if (!gumb) return;
    const tr = gumb.closest("[data-artikl]");
    const id = tr.dataset.artikl;
    const p = promjene(id);
    if (!Object.keys(p).length || p.cijena_cents === null) return;

    gumb.disabled = true;
    const ishod = await veza.baza(`artikli?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      tijelo: p,
      zaglavlja: { Prefer: "return=representation" },
    });

    // RLS bez prava ne vraca gresku nego nula redaka — i to je neuspjeh.
    if (!ishod.ok || !ishod.podaci?.length) {
      obavijest(greskaBaze(ishod.greska ?? "Nije spremljeno — provjerite prava."), "greska");
      gumb.disabled = false;
      return;
    }

    const novi = ishod.podaci[0];
    spremljeno.set(id, { ...novi });
    radno.set(id, { ...novi, cijena: izCenti(novi.cijena_cents), poruka: `spremljeno ${vrijeme(novi.azurirano).slice(-5)}` });
    tr.outerHTML = redak(radno.get(id));
    obavijest(`${novi.naziv}: spremljeno.`);
  });
}
