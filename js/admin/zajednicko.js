/**
 * zajednicko.js — sitnice koje dijele ekrani admin panela.
 *
 * Namjerno bez DOM-a i mreze pri uvozu: scripts/provjere.mjs ga uvozi u
 * Nodeu i provjerava pretvorbu cijena i raspored traka. `obavijest` dira
 * dokument tek kad se pozove; `izvrsiAkcijuRezervacije` dobiva vezu kao
 * argument umjesto da je uvozi.
 *
 * Admin je samo hrvatski, pa se ovdje oblikuje izricito s "hr".
 */

import { formatDatuma } from "../jezik.js";

export const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const VRSTE = {
  industrijske: "Industrijske elektroinstalacije",
  zavrsni: "Završni građevinski radovi",
  kucne: "Kućne elektroinstalacije",
  loxone: "Loxone — prodaja i instalacija",
  najam: "Najam alata",
  zaposlenje: "Zaposlenje",
};

export const STATUS_UPITA = { novo: "Novo", u_obradi: "U obradi", zatvoreno: "Zatvoreno" };

export const STATUS_REZERVACIJE = {
  na_cekanju: "Na čekanju",
  potvrdjeno: "Potvrđeno",
  odbijeno: "Odbijeno",
  otkazano: "Otkazano",
};

let oblikVremena = null;
/** "2026-09-11T14:05:00Z" -> "11. 09. 2026. 16:05", po satu preglednika. */
export function vrijeme(iso) {
  if (!iso) return "";
  oblikVremena ??= new Intl.DateTimeFormat("hr-HR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return oblikVremena.format(new Date(iso));
}

/** Daterange iz PostgREST-a: "[2026-09-12,2026-09-15)" -> { od, doo }. */
export function raspon(zapis) {
  const [od = "", doo = ""] = String(zapis ?? "").replace(/^[[(]|[\])]$/g, "").split(",");
  return { od: od.trim(), doo: doo.trim() };
}

export const razdobljeTekst = (od, doo) =>
  `${formatDatuma(od, {}, "hr")} – ${formatDatuma(doo, { godina: true }, "hr")}`;

/** Isto pravilo kao je_aktivna() u bazi. */
export function jeAktivna(rezervacija, sada = Date.now()) {
  if (rezervacija.status === "potvrdjeno") return true;
  if (rezervacija.status !== "na_cekanju") return false;
  return !rezervacija.istice || new Date(rezervacija.istice).getTime() > sada;
}

/* ------------------------------------------------------------------ */
/* Cijene                                                              */
/* ------------------------------------------------------------------ */
/**
 * Unos cijene -> cijeli broj centi, ili null ako unos nije cijena.
 *
 * Prima "655,61", "655.61", "655,6", "655" i "655,61 €". NE prima tocku za
 * tisucice ("1.234,56"): u polju gdje su i tocka i zarez decimalni znak,
 * "1.234" bi bilo dvosmisleno — 1,23 € ili 1234 €. Bolje odbiti nego pogoditi.
 *
 * Racuna se nad znamenkama, nikad preko parseFloat: 0,1 + 0,2 u cijeni je
 * upravo greska koju cijeli projekt izbjegava.
 */
export function uCente(unos) {
  const cisto = String(unos ?? "").replace(/[\s€]/g, "");
  const dijelovi = cisto.match(/^(\d{1,7})(?:[.,](\d{1,2}))?$/);
  if (!dijelovi) return null;
  return Number(dijelovi[1]) * 100 + Number((dijelovi[2] ?? "0").padEnd(2, "0"));
}

/** Cente -> "655,61" za polje unosa (bez tocke za tisucice, iz istog razloga). */
export const izCenti = (cente) => `${Math.trunc(cente / 100)},${String(Math.abs(cente % 100)).padStart(2, "0")}`;

/* ------------------------------------------------------------------ */
/* Greske baze, ljudskim jezikom                                       */
/* ------------------------------------------------------------------ */
export function greskaBaze(greska) {
  const tekst = String(greska ?? "");
  if (tekst.startsWith("zauzeto:")) return "Termin se preklapa s drugom rezervacijom tog alata.";
  if (tekst.includes("nije za najam")) return "Taj artikl nije za najam.";
  if (tekst.includes("check constraint")) return "Neispravan unos — provjerite datume, količinu i cijenu.";
  if (tekst.includes("row-level security")) return "Nemate prava za ovu radnju.";
  return tekst || "Nešto nije uspjelo.";
}

/* ------------------------------------------------------------------ */
/* Rezervacije                                                         */
/* ------------------------------------------------------------------ */
/**
 * Rasporedi rezervacije jednog alata u trake vremenske crte.
 *
 * Alat s dva komada moze imati dvije rezervacije istog dana; bez traka bi se
 * crtale jedna preko druge i druga bi bila nevidljiva. Svaka rezervacija ide
 * u prvu traku koja je slobodna do njezina pocetka — [od, do), pa ona koja
 * pocinje na dan povrata prethodne staje u istu traku.
 */
export function trake(rezervacije) {
  const krajevi = [];
  return rezervacije
    .slice()
    .sort((a, b) => (a.od < b.od ? -1 : a.od > b.od ? 1 : 0))
    .map((r) => {
      let traka = krajevi.findIndex((kraj) => kraj <= r.od);
      if (traka === -1) {
        traka = krajevi.length;
        krajevi.push(r.doo);
      } else {
        krajevi[traka] = r.doo;
      }
      return { ...r, traka };
    });
}

const NOVI_STATUS = { potvrdi: "potvrdjeno", odbij: "odbijeno", otkazi: "otkazano" };

/** Jedna rezervacija s gumbima za odluku. Isti HTML u upitu i na vremenskoj crti. */
export function rezervacijaHtml(r, sada = Date.now()) {
  const { od, doo } = raspon(r.raspon);
  const naziv = r.artikli?.naziv ?? r.artikl_id;

  let rok = "";
  if (r.status === "na_cekanju") {
    if (!r.istice) rok = "drži termin do odluke";
    else {
      const sati = Math.round((new Date(r.istice).getTime() - sada) / 3600000);
      rok = sati > 0 ? `ističe za ${sati} h` : "rok je istekao — termin se više ne drži";
    }
  }

  const gumbi = [];
  if (r.status !== "potvrdjeno") gumbi.push(["potvrdi", "Potvrdi", "gumb--glavni"]);
  if (r.status === "na_cekanju") gumbi.push(["odbij", "Odbij", "gumb--sporedni"]);
  if (r.status === "potvrdjeno") gumbi.push(["otkazi", "Otkaži", "gumb--sporedni"]);
  // Rezervacija iz upita se ne brise nego odbija ili otkazuje, da upit
  // zadrzi povijest. Brise se samo rucno upisana.
  if (!r.upit_id) gumbi.push(["obrisi", "Obriši", "gumb--tihi"]);

  return `
    <li class="admin__rezervacija" data-rezervacija="${esc(r.id)}">
      <div>
        <strong>${esc(naziv)}</strong><br>
        <span class="monr">${esc(razdobljeTekst(od, doo))}</span> · × ${Number(r.kolicina) || 1}
        ${r.napomena ? `<br><span class="jedva">${esc(r.napomena)}</span>` : ""}
      </div>
      <div class="admin__stanje-rezervacije">
        <span class="admin__znacka admin__znacka--${esc(r.status)}">${esc(STATUS_REZERVACIJE[r.status] ?? r.status)}</span>
        ${rok ? `<br><span class="jedva">${esc(rok)}</span>` : ""}
      </div>
      <div class="admin__akcije">
        ${gumbi
          .map(([akcija, ime, razred]) => `<button class="gumb ${razred}" type="button" data-rez-akcija="${akcija}">${ime}</button>`)
          .join("")}
      </div>
    </li>`;
}

/**
 * Promijeni ili obrisi rezervaciju. Okidac u bazi ponovno provjerava
 * zauzetost, pa potvrda isteklog zahtjeva za termin koji je u medjuvremenu
 * uzet vraca gresku "zauzeto:" — greskaBaze() je prevodi.
 */
export function izvrsiAkcijuRezervacije(veza, id, akcija) {
  if (akcija === "obrisi") return veza.baza(`rezervacije?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
  const status = NOVI_STATUS[akcija];
  if (!status) return Promise.resolve({ ok: false, greska: "nepoznata akcija" });
  return veza.baza(`rezervacije?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", tijelo: { status } });
}

/* ------------------------------------------------------------------ */
/* Obavijest                                                           */
/* ------------------------------------------------------------------ */
let tajmerObavijesti = null;

/** Kratka poruka u kutu ekrana. Greske stoje dulje od potvrda. */
export function obavijest(tekst, vrsta = "uspjeh") {
  const el = document.querySelector("[data-admin-obavijest]");
  if (!el) return;
  el.textContent = tekst;
  el.className = `admin__obavijest admin__obavijest--${vrsta}`;
  el.hidden = false;
  clearTimeout(tajmerObavijesti);
  tajmerObavijesti = setTimeout(() => (el.hidden = true), vrsta === "greska" ? 8000 : 3500);
}

export const ucitavanjeHtml = '<p class="tiho">Učitavanje…</p>';

export const greskaHtml = (greska) =>
  `<div class="admin__kartica"><p class="admin__poruka admin__poruka--greska">${esc(greskaBaze(greska))}</p></div>`;
