# Supabase

Stranica koristi bazu **HES dashboarda** (`../HES-Dash`). Shema, edge funkcija za e-poštu
i upute za postavljanje žive ondje:

- shema: `../HES-Dash/supabase/migrations/202609170001_webshop.sql`
- e-pošta: `../HES-Dash/supabase/functions/posalji-upit`
- testovi baze: `../HES-Dash/supabase/tests/webshop_testovi.sql`
- koraci: `../HES-Dash/README.md`, odjeljak **Web shop**

Upiti, rezervacije najma i artikli (cijena, stanje, vidljivost) uređuju se u dashboardu na
`/upiti`, `/najam` i `/artikli`.

Stranica radi i bez baze. Dok je `js/konfiguracija.js` prazna, katalog se čita iz
`assets/katalog.json`, a obrazac šalje preko `mailto:`.

## Što ostaje ovdje

- `seed.sql` generira `python scripts/seed.py`. Služi za prvo punjenje kataloga u praznoj
  bazi. Pri ponovnom pokretanju osvježava nazive i kategorije, ali **ne dira cijene, stanje ni
  količine**.
- Prije generiranja stranica povucite cijene iz baze:

  ```sh
  npm run povuci     # baza -> assets/katalog.json
  npm run stranice   # meta opisi stranica proizvoda s novim cijenama
  ```

## Provjera iz naredbenog retka

```sh
curl -s https://<ref>.supabase.co/rest/v1/rpc/posalji_upit \
  -H "apikey: <anon>" -H "Authorization: Bearer <anon>" -H "Content-Type: application/json" \
  -d '{"podaci":{"vrsta":"najam","ime":"Test","email":"<vasa adresa>","jezik":"hr",
       "stavke":[{"id":"1210","kolicina":1,"od":"2026-10-01","do":"2026-10-03"}]}}'
```

Očekivano: `{"ok": true, "id": "..."}`, upit se vidi na `/upiti` u dashboardu, a stižu dva maila.
Isti poziv ponovljen za iste datume vraća `{"ok": false, "zauzeto": ["1210"], ...}`.
