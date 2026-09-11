/**
 * posalji-upit — e-posta za upite i za odluke o najmu.
 *
 * Dva ulaza, i svaki se sam dokazuje:
 *
 *   1. Database Webhook na INSERT u public.upiti (Supabase ga salje nakon
 *      sto se upis potvrdi). Nosi zaglavlje `x-hes-tajna` jednako tajni
 *      WEBHOOK_TAJNA. Salje dva maila:
 *        - tvrtki: cijeli upit, s kupcem kao reply-to
 *        - kupcu: kopiju onoga sto je poslao, na njegovom jeziku
 *      i postavlja upiti.poslano_mailom = true.
 *
 *   2. Admin panel: POST { akcija: "odluka", upit_id, poruka? } s JWT-om
 *      prijavljenog korisnika. Funkcija provjeri da je korisnik admin, procita
 *      rezervacije upita i posalje kupcu sto je potvrdeno, a sto nije.
 *
 * Zasto odluka ne ide preko webhooka na `rezervacije`: jedan upit moze imati
 * vise alata, a webhook bi za svaki promijenjeni red poslao zaseban mail.
 * Admin panel zove funkciju jednom, kad su sve odluke za upit spremljene.
 *
 * Postavlja se s `--no-verify-jwt` (vidi supabase/README.md). Supabaseova
 * provjera JWT-a pustila bi i anonimni kljuc, koji je javan — pravu provjeru
 * zato radi funkcija sama: tajna za webhook, clanstvo u `admini` za panel.
 *
 * Tajne (supabase secrets set ...):
 *   RESEND_API_KEY   kljuc za Resend
 *   WEBHOOK_TAJNA    dugi nasumicni niz; isti stoji u zaglavlju webhooka
 *   POSILJATELJ      npr. "HES <upiti@hes.hr>" — domena mora biti potvrdena u Resendu
 *   PRIMATELJ        kamo idu upiti (zadano alen.hranj@hes.hr)
 *   ADMIN_ADRESA     adresa admin panela, za poveznicu u mailu tvrtki
 * SUPABASE_URL i SUPABASE_SERVICE_ROLE_KEY postavlja Supabase sam.
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVIS = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const RESEND = Deno.env.get("RESEND_API_KEY") ?? "";
const TAJNA = Deno.env.get("WEBHOOK_TAJNA") ?? "";
const POSILJATELJ = Deno.env.get("POSILJATELJ") ?? "HES <upiti@hes.hr>";
const PRIMATELJ = Deno.env.get("PRIMATELJ") ?? "alen.hranj@hes.hr";
const ADMIN_ADRESA = Deno.env.get("ADMIN_ADRESA") ?? "https://hes.hr/admin/";

const TELEFON = "+385 99 205 7845";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Jezik = "hr" | "de" | "en";

interface Stavka {
  id: string;
  naziv: string;
  kolicina: number;
  cijena_cents: number;
  osnova: "kom" | "dan";
  od_datuma: string | null;
  do_datuma: string | null;
  dana: number | null;
  iznos_cents: number;
}

interface Upit {
  id: string;
  stvoreno: string;
  vrsta: string;
  ime: string;
  email: string;
  telefon: string | null;
  poruka: string | null;
  jezik: Jezik;
  stavke: Stavka[];
  procjena_cents: number | null;
  poslano_mailom: boolean;
}

interface Rezervacija {
  raspon: string;
  kolicina: number;
  status: "na_cekanju" | "potvrdjeno" | "odbijeno" | "otkazano";
  artikli: { naziv: string } | null;
}

/* ------------------------------------------------------------------ */
/* Tekst                                                               */
/* ------------------------------------------------------------------ */
// Njemacki bez ß, iz istog razloga kao na stranici: kupac koji usporedi mail
// i stranicu ne treba vidjeti dva pravopisa.
const VRSTE: Record<string, Record<Jezik, string>> = {
  industrijske: {
    hr: "Industrijske elektroinstalacije",
    de: "Industrielle Elektroinstallationen",
    en: "Industrial electrical installations",
  },
  zavrsni: { hr: "Završni građevinski radovi", de: "Ausbauarbeiten", en: "Finishing construction works" },
  kucne: {
    hr: "Kućne elektroinstalacije",
    de: "Elektroinstallationen für Wohngebäude",
    en: "Residential electrical installations",
  },
  loxone: {
    hr: "Loxone — prodaja i instalacija",
    de: "Loxone — Verkauf und Installation",
    en: "Loxone — sales and installation",
  },
  najam: { hr: "Najam alata", de: "Werkzeugvermietung", en: "Tool rental" },
  zaposlenje: { hr: "Zaposlenje", de: "Bewerbung", en: "Jobs" },
};

const TEKST = {
  hr: {
    pozdrav: "Dobar dan,",
    predmetPotvrde: "HES — zaprimili smo vaš upit",
    uvodPotvrde: "hvala na upitu. Ovo je kopija onoga što ste nam poslali putem stranice hes.hr.",
    najamNapomena: "Termin za alate iz košarice držimo 48 sati. Potvrdu ili odgovor šaljemo e-poštom.",
    ograda: "Iznosi su procjena prema cjeniku. Konačnu ponudu šaljemo e-poštom.",
    vrsta: "Vrsta upita",
    poruka: "Poruka",
    proizvodi: "Proizvodi",
    najam: "Najam alata",
    procjena: "Procjena",
    predmetOdluke: "HES — odgovor na zahtjev za najam",
    uvodOdluke: "odgovor na vaš zahtjev za najam alata:",
    nakonOdluke: `Za sva pitanja odgovorite na ovu poruku ili nas nazovite na ${TELEFON}.`,
    status: {
      potvrdjeno: "potvrđeno",
      odbijeno: "nije moguće",
      otkazano: "otkazano",
      na_cekanju: "još u obradi",
    },
    dan: { one: "dan", few: "dana", other: "dana" },
  },
  de: {
    pozdrav: "Guten Tag,",
    predmetPotvrde: "HES — Ihre Anfrage ist eingegangen",
    uvodPotvrde: "vielen Dank für Ihre Anfrage. Dies ist eine Kopie dessen, was Sie uns über hes.hr gesendet haben.",
    najamNapomena:
      "Den Zeitraum für die Werkzeuge aus Ihrem Warenkorb halten wir 48 Stunden für Sie frei. Bestätigung oder Antwort senden wir per E-Mail.",
    ograda: "Die Beträge sind eine Schätzung auf Basis der Preisliste. Das endgültige Angebot senden wir per E-Mail.",
    vrsta: "Art der Anfrage",
    poruka: "Nachricht",
    proizvodi: "Produkte",
    najam: "Werkzeugvermietung",
    procjena: "Schätzung",
    predmetOdluke: "HES — Antwort auf Ihre Mietanfrage",
    uvodOdluke: "hier ist die Antwort auf Ihre Anfrage zur Werkzeugmiete:",
    nakonOdluke: `Bei Fragen antworten Sie einfach auf diese E-Mail oder rufen Sie uns an: ${TELEFON}.`,
    status: {
      potvrdjeno: "bestätigt",
      odbijeno: "nicht möglich",
      otkazano: "storniert",
      na_cekanju: "noch in Bearbeitung",
    },
    dan: { one: "Tag", other: "Tage" },
  },
  en: {
    pozdrav: "Hello,",
    predmetPotvrde: "HES — we have received your enquiry",
    uvodPotvrde: "thank you for your enquiry. This is a copy of what you sent us via hes.hr.",
    najamNapomena:
      "We are holding the dates for the tools in your cart for 48 hours. We will send the confirmation or our reply by email.",
    ograda: "Amounts are an estimate based on the price list. We send the final quote by email.",
    vrsta: "Type of enquiry",
    poruka: "Message",
    proizvodi: "Products",
    najam: "Tool rental",
    procjena: "Estimate",
    predmetOdluke: "HES — reply to your rental request",
    uvodOdluke: "here is the reply to your tool rental request:",
    nakonOdluke: `If you have any questions, reply to this email or call us on ${TELEFON}.`,
    status: {
      potvrdjeno: "confirmed",
      odbijeno: "not possible",
      otkazano: "cancelled",
      na_cekanju: "still being processed",
    },
    dan: { one: "day", other: "days" },
  },
} as const;

/* ------------------------------------------------------------------ */
/* Oblikovanje — ista pravila kao js/jezik.js                          */
/* ------------------------------------------------------------------ */
const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function cijena(cente: number, jezik: Jezik) {
  const cijeli = Math.trunc(cente / 100);
  const decimale = String(Math.abs(cente % 100)).padStart(2, "0");
  const tisucice = (znak: string) => String(cijeli).replace(/\B(?=(\d{3})+(?!\d))/g, znak);
  return jezik === "en" ? `€${tisucice(",")}.${decimale}` : `${tisucice(".")},${decimale} €`;
}

function datum(iso: string | null, jezik: Jezik) {
  const [g, m, d] = String(iso ?? "").split("-").map(Number);
  if (!g || !m || !d) return "";
  if (jezik === "en") {
    return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
      Date.UTC(g, m - 1, d)
    );
  }
  return jezik === "de" ? `${d}.${m}.${g}` : `${d}. ${m}. ${g}.`;
}

function dana(broj: number, jezik: Jezik) {
  const oblici = TEKST[jezik].dan as Record<string, string>;
  return `${broj} ${oblici[new Intl.PluralRules(jezik).select(broj)] ?? oblici.other}`;
}

/** "[2030-09-01,2030-09-04)" -> ["2030-09-01", "2030-09-04"] */
function raspon(zapis: string): [string, string] {
  const [od, doo] = zapis.replace(/^[[(]|[\])]$/g, "").split(",");
  return [od, doo];
}

function jezikUpita(upit: Upit): Jezik {
  return upit.jezik === "de" || upit.jezik === "en" ? upit.jezik : "hr";
}

/* ------------------------------------------------------------------ */
/* Dijelovi maila                                                      */
/* ------------------------------------------------------------------ */
const STIL = {
  tijelo: "font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#201D18;",
  tablica: "border-collapse:collapse;width:100%;max-width:640px;margin:8px 0 16px;",
  celija: "padding:6px 8px;border-bottom:1px solid #E4DFD3;vertical-align:top;text-align:left;",
  desno: "padding:6px 8px;border-bottom:1px solid #E4DFD3;vertical-align:top;text-align:right;white-space:nowrap;",
  naslov: "font-size:13px;text-transform:uppercase;letter-spacing:.04em;color:#6B665D;margin:16px 0 4px;",
  jedva: "font-size:13px;color:#6B665D;",
};

function stavkeHtml(stavke: Stavka[], jezik: Jezik) {
  const t = TEKST[jezik];
  const redak = (s: Stavka) => {
    const razdoblje =
      s.osnova === "dan" && s.od_datuma && s.do_datuma
        ? `<br><span style="${STIL.jedva}">${esc(datum(s.od_datuma, jezik))} – ${esc(
            datum(s.do_datuma, jezik)
          )} · ${esc(dana(s.dana ?? 0, jezik))}</span>`
        : "";
    return `<tr>
      <td style="${STIL.celija}">${esc(s.naziv)}${razdoblje}</td>
      <td style="${STIL.desno}">× ${s.kolicina}</td>
      <td style="${STIL.desno}">${esc(cijena(s.iznos_cents, jezik))}</td>
    </tr>`;
  };

  const skupina = (naslov: string, popis: Stavka[]) =>
    popis.length
      ? `<p style="${STIL.naslov}">${esc(naslov)}</p>
         <table style="${STIL.tablica}">${popis.map(redak).join("")}</table>`
      : "";

  return (
    skupina(t.proizvodi, stavke.filter((s) => s.osnova === "kom")) +
    skupina(t.najam, stavke.filter((s) => s.osnova === "dan"))
  );
}

function stavkeTekst(stavke: Stavka[], jezik: Jezik) {
  return stavke
    .map((s) => {
      const razdoblje =
        s.osnova === "dan" && s.od_datuma && s.do_datuma
          ? `, ${datum(s.od_datuma, jezik)} – ${datum(s.do_datuma, jezik)} (${dana(s.dana ?? 0, jezik)})`
          : "";
      return `- ${s.naziv} × ${s.kolicina}${razdoblje} — ${cijena(s.iznos_cents, jezik)}`;
    })
    .join("\n");
}

function omot(sadrzaj: string) {
  return `<!doctype html><html><body style="${STIL.tijelo}">${sadrzaj}
    <p style="${STIL.jedva}">Hranj Electrical Services d.o.o.<br>${esc(PRIMATELJ)} · ${TELEFON}</p>
  </body></html>`;
}

/* ------------------------------------------------------------------ */
/* Tri maila                                                           */
/* ------------------------------------------------------------------ */
function mailTvrtki(upit: Upit) {
  const vrsta = VRSTE[upit.vrsta]?.hr ?? upit.vrsta;
  const imaNajma = upit.stavke.some((s) => s.osnova === "dan");
  const poveznica = `${ADMIN_ADRESA}#upit=${upit.id}`;

  const kontakt = [
    ["Ime", upit.ime],
    ["E-pošta", upit.email],
    ["Telefon", upit.telefon ?? "—"],
    ["Vrsta upita", vrsta],
    ["Jezik stranice", upit.jezik],
  ];

  const html = omot(`
    <p><strong>Novi upit s hes.hr</strong></p>
    <table style="${STIL.tablica}">
      ${kontakt
        .map(([k, v]) => `<tr><td style="${STIL.celija}width:140px;">${esc(k)}</td><td style="${STIL.celija}">${esc(v)}</td></tr>`)
        .join("")}
    </table>
    ${upit.poruka ? `<p style="${STIL.naslov}">Poruka</p><p style="white-space:pre-wrap;">${esc(upit.poruka)}</p>` : ""}
    ${stavkeHtml(upit.stavke, "hr")}
    ${upit.stavke.length ? `<p><strong>Procjena: ${esc(cijena(upit.procjena_cents ?? 0, "hr"))}</strong></p>` : ""}
    ${
      imaNajma
        ? `<p>Rezervacije najma su <strong>na čekanju 48 sati</strong>. Potvrdite ih ili odbijte u admin panelu:<br>
           <a href="${esc(poveznica)}">${esc(poveznica)}</a></p>`
        : ""
    }
    <p style="${STIL.jedva}">Odgovor na ovu poruku ide izravno kupcu.</p>`);

  const text = [
    "Novi upit s hes.hr",
    "",
    ...kontakt.map(([k, v]) => `${k}: ${v}`),
    "",
    upit.poruka ? `Poruka:\n${upit.poruka}\n` : "",
    upit.stavke.length ? `${stavkeTekst(upit.stavke, "hr")}\nProcjena: ${cijena(upit.procjena_cents ?? 0, "hr")}\n` : "",
    imaNajma ? `Rezervacije najma su na čekanju 48 sati. Admin panel: ${poveznica}` : "",
  ].join("\n");

  return {
    to: PRIMATELJ,
    reply_to: upit.email,
    subject: `Novi upit — ${vrsta} — ${upit.ime}`,
    html,
    text,
  };
}

function mailKupcu(upit: Upit) {
  const jezik = jezikUpita(upit);
  const t = TEKST[jezik];
  const vrsta = VRSTE[upit.vrsta]?.[jezik] ?? upit.vrsta;
  const imaNajma = upit.stavke.some((s) => s.osnova === "dan");

  const html = omot(`
    <p>${esc(t.pozdrav)}</p>
    <p>${esc(t.uvodPotvrde)}</p>
    <p style="${STIL.naslov}">${esc(t.vrsta)}</p>
    <p>${esc(vrsta)}</p>
    ${upit.poruka ? `<p style="${STIL.naslov}">${esc(t.poruka)}</p><p style="white-space:pre-wrap;">${esc(upit.poruka)}</p>` : ""}
    ${stavkeHtml(upit.stavke, jezik)}
    ${upit.stavke.length ? `<p><strong>${esc(t.procjena)}: ${esc(cijena(upit.procjena_cents ?? 0, jezik))}</strong><br>
       <span style="${STIL.jedva}">${esc(t.ograda)}</span></p>` : ""}
    ${imaNajma ? `<p>${esc(t.najamNapomena)}</p>` : ""}`);

  const text = [
    t.pozdrav,
    "",
    t.uvodPotvrde,
    "",
    `${t.vrsta}: ${vrsta}`,
    upit.poruka ? `\n${t.poruka}:\n${upit.poruka}` : "",
    upit.stavke.length
      ? `\n${stavkeTekst(upit.stavke, jezik)}\n${t.procjena}: ${cijena(upit.procjena_cents ?? 0, jezik)}\n${t.ograda}`
      : "",
    imaNajma ? `\n${t.najamNapomena}` : "",
  ].join("\n");

  return { to: upit.email, reply_to: PRIMATELJ, subject: t.predmetPotvrde, html, text };
}

function mailOdluke(upit: Upit, rezervacije: Rezervacija[], porukaAdmina: string) {
  const jezik = jezikUpita(upit);
  const t = TEKST[jezik];

  const redci = rezervacije.map((r) => {
    const [od, doo] = raspon(r.raspon);
    return {
      naziv: r.artikli?.naziv ?? "—",
      razdoblje: `${datum(od, jezik)} – ${datum(doo, jezik)}`,
      kolicina: r.kolicina,
      status: t.status[r.status] ?? r.status,
      potvrdeno: r.status === "potvrdjeno",
    };
  });

  const html = omot(`
    <p>${esc(t.pozdrav)}</p>
    <p>${esc(t.uvodOdluke)}</p>
    <table style="${STIL.tablica}">
      ${redci
        .map(
          (r) => `<tr>
        <td style="${STIL.celija}">${esc(r.naziv)}<br><span style="${STIL.jedva}">${esc(r.razdoblje)} · × ${r.kolicina}</span></td>
        <td style="${STIL.desno}"><strong style="color:${r.potvrdeno ? "#12695A" : "#C0272C"};">${esc(r.status)}</strong></td>
      </tr>`
        )
        .join("")}
    </table>
    ${porukaAdmina ? `<p style="white-space:pre-wrap;">${esc(porukaAdmina)}</p>` : ""}
    <p>${esc(t.nakonOdluke)}</p>`);

  const text = [
    t.pozdrav,
    "",
    t.uvodOdluke,
    "",
    ...redci.map((r) => `- ${r.naziv}, ${r.razdoblje}, × ${r.kolicina}: ${r.status}`),
    porukaAdmina ? `\n${porukaAdmina}` : "",
    "",
    t.nakonOdluke,
  ].join("\n");

  return { to: upit.email, reply_to: PRIMATELJ, subject: t.predmetOdluke, html, text };
}

/* ------------------------------------------------------------------ */
/* Vanjski svijet                                                      */
/* ------------------------------------------------------------------ */
function odgovor(tijelo: unknown, status = 200) {
  return new Response(JSON.stringify(tijelo), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

async function baza(putanja: string, postavke: RequestInit = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${putanja}`, {
    ...postavke,
    headers: {
      apikey: SERVIS,
      Authorization: `Bearer ${SERVIS}`,
      "Content-Type": "application/json",
      ...(postavke.headers ?? {}),
    },
  });
  if (!r.ok) throw new Error(`baza ${putanja.split("?")[0]}: ${r.status} ${await r.text()}`);
  const tekst = await r.text();
  return tekst ? JSON.parse(tekst) : null;
}

async function posalji(mail: { to: string; reply_to?: string; subject: string; html: string; text: string }) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: POSILJATELJ, ...mail }),
  });
  if (!r.ok) throw new Error(`resend: ${r.status} ${await r.text()}`);
}

/** Usporedba bez ranog izlaska, da trajanje ne oda koliko je znakova pogodeno. */
function jednako(a: string, b: string) {
  if (a.length !== b.length) return false;
  let razlika = 0;
  for (let i = 0; i < a.length; i++) razlika |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return razlika === 0;
}

async function jeAdmin(zahtjev: Request) {
  const token = (zahtjev.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return false;

  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SERVIS, Authorization: `Bearer ${token}` },
  });
  if (!r.ok) return false;
  const korisnik = await r.json();
  if (!korisnik?.id || !UUID.test(korisnik.id)) return false;

  const redovi = await baza(`admini?user_id=eq.${korisnik.id}&select=user_id`);
  return Array.isArray(redovi) && redovi.length > 0;
}

/* ------------------------------------------------------------------ */
/* Obrada                                                              */
/* ------------------------------------------------------------------ */
async function naNoviUpit(id: string) {
  // Red se cita iznova umjesto da se vjeruje tijelu webhooka: tako isti kod
  // radi i kad se webhook ponovi, a `poslano_mailom` sprjecava dvostruki mail.
  const [upit] = (await baza(`upiti?id=eq.${id}&select=*`)) as Upit[];
  if (!upit) return odgovor({ ok: false, greska: "upit ne postoji" }, 404);
  if (upit.poslano_mailom) return odgovor({ ok: true, vecPoslano: true });

  await posalji(mailTvrtki(upit));
  await baza(`upiti?id=eq.${id}`, {
    method: "PATCH",
    body: JSON.stringify({ poslano_mailom: true }),
  });

  // Kopija kupcu nije kriticna: tvrtka je upit dobila, a kupac je na
  // stranici vec vidio da je poslan. Pad se biljezi, ali ne vraca kao greska
  // — inace bi webhook ponavljao i tvrtki slao isti upit iznova.
  try {
    await posalji(mailKupcu(upit));
  } catch (greska) {
    console.error("[posalji-upit] kopija kupcu nije poslana", greska);
  }

  return odgovor({ ok: true });
}

async function naOdluku(id: string, porukaAdmina: string) {
  const [upit] = (await baza(`upiti?id=eq.${id}&select=*`)) as Upit[];
  if (!upit) return odgovor({ ok: false, greska: "upit ne postoji" }, 404);

  const rezervacije = (await baza(
    `rezervacije?upit_id=eq.${id}&select=raspon,kolicina,status,artikli(naziv)&order=raspon`
  )) as Rezervacija[];
  if (!rezervacije.length) return odgovor({ ok: false, greska: "upit nema rezervacija" }, 400);

  await posalji(mailOdluke(upit, rezervacije, porukaAdmina.slice(0, 2000)));
  return odgovor({ ok: true });
}

Deno.serve(async (zahtjev) => {
  if (zahtjev.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (zahtjev.method !== "POST") return odgovor({ ok: false, greska: "samo POST" }, 405);
  if (!RESEND || !SERVIS || !SUPABASE_URL) {
    return odgovor({ ok: false, greska: "funkcija nije podesena (tajne)" }, 500);
  }

  let tijelo: Record<string, unknown>;
  try {
    tijelo = await zahtjev.json();
  } catch {
    return odgovor({ ok: false, greska: "tijelo nije JSON" }, 400);
  }

  try {
    // 1. Webhook. Bez postavljene tajne ovaj ulaz ne postoji.
    if (TAJNA && jednako(zahtjev.headers.get("x-hes-tajna") ?? "", TAJNA)) {
      const zapis = tijelo.record as { id?: string } | undefined;
      if (tijelo.type === "INSERT" && tijelo.table === "upiti" && zapis?.id && UUID.test(zapis.id)) {
        return await naNoviUpit(zapis.id);
      }
      return odgovor({ ok: true, preskoceno: true });
    }

    // 2. Admin panel.
    if (tijelo.akcija === "odluka") {
      const id = String(tijelo.upit_id ?? "");
      if (!UUID.test(id)) return odgovor({ ok: false, greska: "neispravan upit_id" }, 400);
      if (!(await jeAdmin(zahtjev))) return odgovor({ ok: false, greska: "nije admin" }, 403);
      return await naOdluku(id, String(tijelo.poruka ?? ""));
    }

    return odgovor({ ok: false, greska: "nepoznat zahtjev" }, 400);
  } catch (greska) {
    console.error("[posalji-upit]", greska);
    return odgovor({ ok: false, greska: String((greska as Error)?.message ?? greska) }, 500);
  }
});
