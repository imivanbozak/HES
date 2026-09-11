/**
 * povuci-katalog.mjs — baza -> assets/katalog.json.
 *
 * Pokretanje:  node scripts/povuci-katalog.mjs   (ili npm run povuci)
 *
 * Kad je baza podesena, ona je izvor cijena i stanja: mijenja ih admin
 * panel, ne seed skripta. assets/katalog.json tada postaje ono sto je dotad
 * bio samo privremeno — rezerva kad baza ne odgovara, i izvor iz kojeg
 * scripts/stranice.mjs pise cijene u meta opise.
 *
 * Zato se pokrece PRIJE `npm run stranice`, inace meta opisi nose staru
 * cijenu.
 *
 * Cita anonimnim kljucem, kao i preglednik: ovdje nista ne treba vise prava
 * od onoga sto ima svaki posjetitelj. Skriveni artikli (`aktivan = false`)
 * se povlace zajedno s ostalima — njihove stranice i dalje postoje, a
 * sakriva ih tek js/katalog.js.
 *
 * scripts/seed.py prepoznaje datoteku po polju `generirano` i nece je
 * pregaziti izvozom.
 */

import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { SUPABASE, imaOblak } from "../js/konfiguracija.js";

const KORIJEN = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const IZLAZ = path.join(KORIJEN, "assets", "katalog.json");

async function dohvati(upit) {
  const odgovor = await fetch(`${SUPABASE.url}/rest/v1/${upit}`, {
    headers: {
      apikey: SUPABASE.anonKljuc,
      Authorization: `Bearer ${SUPABASE.anonKljuc}`,
    },
  });
  if (!odgovor.ok) {
    throw new Error(`${upit.split("?")[0]}: HTTP ${odgovor.status} ${await odgovor.text()}`);
  }
  return odgovor.json();
}

async function glavni() {
  if (!imaOblak()) {
    console.error("js/konfiguracija.js nema adresu ni kljuc baze — nema se odakle povuci.");
    process.exitCode = 1;
    return;
  }

  const [kategorije, artikli] = await Promise.all([
    dohvati(
      "kategorije?select=id,vrsta,roditelj_id,redoslijed,naziv_hr,naziv_de,naziv_en" +
        "&order=vrsta.desc,roditelj_id.nullsfirst,redoslijed"
    ),
    dohvati(
      "artikli_s_kategorijama?select=id,vrsta,naziv,sku,marka,cijena_cents,osnova," +
        "na_stanju,kolicina,aktivan,slika,kategorije&order=redoslijed"
    ),
  ]);

  // Prazan odgovor znaci da baza nije napunjena (seed.sql nije pokrenut) —
  // prepisati njime katalog znacilo bi stranicu bez ijednog artikla.
  if (!artikli.length || !kategorije.length) {
    console.error("Baza je vratila prazan katalog. assets/katalog.json NIJE prepisan.");
    process.exitCode = 1;
    return;
  }

  const sadrzaj = {
    generirano: "scripts/povuci-katalog.mjs",
    izvor: ["supabase"],
    povuceno: new Date().toISOString(),
    kategorije,
    artikli,
  };

  await writeFile(IZLAZ, JSON.stringify(sadrzaj, null, 1), "utf8");

  const skriveni = artikli.filter((a) => a.aktivan === false).length;
  console.log(
    `assets/katalog.json: ${artikli.length} artikala (${skriveni} skrivenih), ${kategorije.length} kategorija`
  );
}

glavni().catch((greska) => {
  console.error(greska);
  process.exitCode = 1;
});
