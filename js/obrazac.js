/**
 * obrazac.js — slanje obrasca upita.
 *
 * Tri razine, i svaka radi bez one iznad sebe:
 *
 *   bez JS-a      obrazac ide na mailto: i otvara postanski program.
 *   bez baze      isto, ali sa sazetkom kosarice iznad polja i njezinim
 *                 sadrzajem u skrivenom polju — da upit iz ladice ne stigne
 *                 kao prazna poruka.
 *   s bazom       vlastita provjera polja, pa posalji_upit() s kosaricom i
 *                 jezikom, i jedno od cetiri stanja: salje se, poslano,
 *                 zauzeto, greska.
 *
 * Provjera je vlastita, a ne nativna: oblacici preglednika govore jezikom
 * preglednika, ne stranice, i nestaju prije nego ih se procita. Poruke su iz
 * hes-content.md (kontakt, blok 3).
 *
 * Opis posla je obavezan kad je kosarica prazna: upit bez poruke i bez
 * ijednog artikla ne kaze nista. S kosaricom opis moze izostati.
 */

import { imaOblak, EPOSTA } from "./konfiguracija.js";
import { posaljiUpit } from "./oblak.js";
import * as kosarica from "./kosarica.js";
import * as zauzetost from "./zauzetost.js";
import { t, mnozina, formatCijene, formatDatuma, JEZIK } from "./jezik.js";
import { otvori as otvoriLadicu } from "./ladica.js";
import { esc } from "./pogledi.js";

const sBrojem = (broj) => `${broj} ${mnozina("mnozina.artikl", broj)}`;

export function pokreniObrazac() {
  const obrazac = document.querySelector("[data-obrazac-upita]");
  if (!obrazac) return;

  const sazetak = obrazac.querySelector("[data-obrazac-kosarica]");
  const skriveno = obrazac.querySelector("[data-obrazac-kosarica-tekst]");
  const stanje = obrazac.querySelector("[data-obrazac-stanje]");
  const gumb = obrazac.querySelector('button[type="submit"]');

  /* ---------------------------------------------------------------- */
  /* Kosarica iznad polja                                              */
  /* ---------------------------------------------------------------- */
  const crtajKosaricu = () => {
    const pregled = kosarica.pregled();

    if (sazetak) {
      sazetak.hidden = pregled.prazna;
      sazetak.innerHTML = pregled.prazna
        ? ""
        : `<span>${esc(t("obrazac.kosarica", { n: sBrojem(pregled.stavke.length) }))}</span>
           <button class="gumb gumb--tihi" type="button" data-obrazac-ladica>${esc(t("obrazac.otvori_kosaricu"))}</button>`;
    }

    // Tekst za mailto. Cita ga tvrtka, pa je uvijek hrvatski.
    if (skriveno) skriveno.value = pregled.prazna ? "" : kosaricaKaoTekst(pregled);
  };

  obrazac.addEventListener("click", (dogadaj) => {
    if (dogadaj.target.closest("[data-obrazac-ladica]")) otvoriLadicu();
  });

  kosarica.naPromjenu(crtajKosaricu);
  crtajKosaricu();

  if (!imaOblak()) return;

  /* ---------------------------------------------------------------- */
  /* Slanje preko baze                                                 */
  /* ---------------------------------------------------------------- */
  obrazac.noValidate = true;

  // Zauzetost za alate iz kosarice, da se sukob vidi prije slanja.
  if (kosarica.pregled().najam.length) zauzetost.ucitaj();

  const polje = (ime) => obrazac.elements.namedItem(ime);

  obrazac.addEventListener("input", (dogadaj) => {
    if (dogadaj.target.getAttribute("aria-invalid") === "true") ocistiGresku(dogadaj.target);
  });

  obrazac.addEventListener("submit", async (dogadaj) => {
    dogadaj.preventDefault();
    if (gumb?.getAttribute("aria-busy") === "true") return;

    const pregled = kosarica.pregled();
    const greske = provjeri(pregled);
    if (greske.length) {
      prikaziStanje("greska", `<strong>${esc(t("obrazac.provjerite"))}</strong>`);
      greske[0].focus();
      return;
    }

    if (pregled.nepotpuneStavke.length) {
      prikaziStanje(
        "greska",
        `<strong>${esc(t("obrazac.nedostaju_datumi"))}</strong>
         <button class="gumb gumb--sporedni" type="button" data-obrazac-ladica>${esc(t("obrazac.otvori_kosaricu"))}</button>`
      );
      return;
    }

    // Isto pravilo koje ce baza provjeriti. Ovdje je samo da posjetitelj ne
    // ceka odgovor koji se vec zna; stvarnu odluku donosi baza.
    const sukobi = pregled.najam.filter(
      (s) => !zauzetost.slobodno(s.id, s.odDatuma, s.doDatuma, s.kolicina)
    );
    if (sukobi.length) {
      prikaziOdbijeno({ zauzeto: sukobi.map((s) => s.id) }, pregled);
      return;
    }

    postaviSlanje(true);

    const ishod = await posaljiUpit({
      vrsta: obrazac.querySelector('[name="vrsta"]:checked')?.value ?? "industrijske",
      ime: polje("ime").value.trim(),
      email: polje("email").value.trim(),
      telefon: polje("telefon")?.value.trim() ?? "",
      poruka: polje("poruka")?.value.trim() ?? "",
      jezik: JEZIK,
      web: polje("web")?.value ?? "",
      stavke: pregled.stavke.map((s) => ({
        id: s.id,
        kolicina: s.kolicina,
        od: s.odDatuma,
        do: s.doDatuma,
      })),
    });

    postaviSlanje(false);

    if (ishod.ok && ishod.podaci?.ok) {
      const imaNajma = pregled.najam.length > 0;
      prikaziStanje(
        "uspjeh",
        `<strong>${esc(t("obrazac.poslano"))}</strong>
         ${imaNajma ? `<span>${esc(t("obrazac.poslano_najam"))}</span>` : ""}`
      );
      obrazac.reset();
      kosarica.isprazni();
      // Traka napretka slusa `input`; reset ga ne okida.
      obrazac.dispatchEvent(new Event("input", { bubbles: true }));
      return;
    }

    if (ishod.ok && ishod.podaci) {
      prikaziOdbijeno(ishod.podaci, pregled);
      return;
    }

    console.error("[obrazac]", ishod.greska);
    prikaziStanje(
      "greska",
      `<strong>${t("obrazac.greska", {
        email: `<a href="mailto:${esc(EPOSTA)}">${esc(EPOSTA)}</a>`,
      })}</strong>`
    );
  });

  /* ---------------------------------------------------------------- */
  /* Pomocno                                                           */
  /* ---------------------------------------------------------------- */
  function provjeri(pregled) {
    const greske = [];
    const ime = polje("ime");
    const email = polje("email");
    const poruka = polje("poruka");

    for (const ulaz of [ime, email, poruka]) if (ulaz) ocistiGresku(ulaz);

    if (ime.value.trim().length < 2) {
      oznaciGresku(ime, t("obrazac.obavezno"));
      greske.push(ime);
    }
    if (!email.value.trim()) {
      oznaciGresku(email, t("obrazac.obavezno"));
      greske.push(email);
    } else if (!email.checkValidity()) {
      oznaciGresku(email, t("obrazac.email"));
      greske.push(email);
    }
    if (poruka && pregled.prazna && !poruka.value.trim()) {
      oznaciGresku(poruka, t("obrazac.poruka"));
      greske.push(poruka);
    }
    return greske;
  }

  function oznaciGresku(ulaz, poruka) {
    const id = `${ulaz.id}-greska`;
    let natpis = document.getElementById(id);
    if (!natpis) {
      natpis = document.createElement("span");
      natpis.id = id;
      natpis.className = "polje-obrasca__greska";
      ulaz.insertAdjacentElement("afterend", natpis);
    }
    natpis.textContent = poruka;
    ulaz.setAttribute("aria-invalid", "true");
    ulaz.setAttribute("aria-describedby", id);
  }

  function ocistiGresku(ulaz) {
    document.getElementById(`${ulaz.id}-greska`)?.remove();
    ulaz.removeAttribute("aria-invalid");
    ulaz.removeAttribute("aria-describedby");
  }

  function postaviSlanje(salje) {
    if (!gumb) return;
    if (salje) {
      gumb.dataset.natpis = gumb.textContent;
      gumb.textContent = t("obrazac.salje");
      gumb.setAttribute("aria-busy", "true");
    } else {
      gumb.textContent = gumb.dataset.natpis ?? gumb.textContent;
      gumb.removeAttribute("aria-busy");
    }
  }

  function prikaziStanje(vrsta, html) {
    if (!stanje) return;
    stanje.className = `obrazac__stanje obrazac__stanje--${vrsta}`;
    stanje.innerHTML = html;
    stanje.hidden = false;
  }

  /**
   * Baza je odbila upit: neki alat je u tom razdoblju vec zauzet, ili artikl
   * vise nije u ponudi. Imena se citaju iz kosarice, jer baza vraca samo id.
   * Nista nije upisano, pa posjetitelj moze ispraviti i poslati ponovno.
   */
  function prikaziOdbijeno(odgovor, pregled) {
    const ime = (id) => pregled.stavke.find((s) => s.id === id)?.naziv ?? id;
    const dijelovi = [];
    if (odgovor.zauzeto?.length) {
      dijelovi.push(esc(t("obrazac.zauzeto", { popis: odgovor.zauzeto.map(ime).join(", ") })));
    }
    if (odgovor.nedostupno?.length) {
      dijelovi.push(esc(t("obrazac.nedostupno", { popis: odgovor.nedostupno.map(ime).join(", ") })));
    }
    prikaziStanje(
      "greska",
      `<strong>${dijelovi.join("<br>")}</strong>
       <button class="gumb gumb--sporedni" type="button" data-obrazac-ladica>${esc(t("obrazac.otvori_kosaricu"))}</button>`
    );
    document.dispatchEvent(
      new CustomEvent("hes:zauzeto", { detail: { zauzeto: odgovor.zauzeto ?? [] } })
    );
  }
}

/**
 * Kosarica kao obican tekst, za tijelo maila kad nema baze.
 *
 * Isti podaci koje bi posalji_upit() snimio, samo procitani iz preglednika —
 * zato i stoji "procjena".
 */
function kosaricaKaoTekst(pregled) {
  const redak = (s) => {
    const razdoblje =
      s.osnova === "dan" && s.odDatuma && s.doDatuma
        ? `, ${formatDatuma(s.odDatuma, {}, "hr")} – ${formatDatuma(s.doDatuma, { godina: true }, "hr")}`
        : "";
    return `- ${s.naziv} × ${s.kolicina}${razdoblje}`;
  };

  const dijelovi = [];
  if (pregled.proizvodi.length) {
    dijelovi.push(`${t("kosarica.proizvodi", {}, "hr")}:`, ...pregled.proizvodi.map(redak));
  }
  if (pregled.najam.length) {
    dijelovi.push(`${t("kosarica.najam_alata", {}, "hr")}:`, ...pregled.najam.map(redak));
  }
  dijelovi.push(`Procjena: ${formatCijene(pregled.ukupno, "hr")}`);
  return dijelovi.join("\n");
}
