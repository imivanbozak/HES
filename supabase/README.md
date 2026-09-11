# Supabase: postavljanje

Stranica radi i bez baze. Dok je `js/konfiguracija.js` prazna, katalog se čita iz
`assets/katalog.json`, a obrazac šalje preko `mailto:`. Ovdje je redoslijed koraka
kojim se uključuju baza, najam s rezervacijama, e-pošta i admin panel.

Svaki korak se radi jednom. Koraci 1–3 i 6–7 se ponavljaju za razvojni projekt, ako postoji.

## 1. Projekt

Na [supabase.com](https://supabase.com) otvorite novi projekt. **Regija: Central EU (Frankfurt).**
O regiji ovisi i tekst u `privatnost.html` (podaci ostaju u EU-u).

## 2. Shema i katalog

U **SQL Editoru**, redom:

1. `supabase/shema.sql`
2. `supabase/seed.sql` (generira ga `python scripts/seed.py`)
3. samo na razvojnom projektu: `supabase/testovi.sql`. Rezultat je tablica u kojoj svaki redak mora imati `ok = true`.

Obje datoteke smiju se pokretati iznova. `seed.sql` pri ponovnom pokretanju osvježava
nazive i kategorije, ali **ne dira cijene, stanje ni količine**: njih od prvog upisa vodi admin panel.

## 3. Prvi admin

1. **Authentication → Users → Add user**: e-pošta i lozinka, uključiti *Auto Confirm User*.
2. **Authentication → Sign In / Providers**: isključiti *Allow new users to sign up*.
3. U SQL Editoru:

   ```sql
   insert into public.admini (user_id)
   select id from auth.users where email = 'alen.hranj@hes.hr';
   ```

Samo korisnik koji stoji u `admini` vidi upite i smije mijenjati katalog. Sama prijava ne daje nikakva prava.

## 4. Stranica

U **Project Settings → API** su *Project URL* i *anon public* ključ. Upisuju se u `js/konfiguracija.js`:

```js
export const SUPABASE = {
  url: "https://<ref>.supabase.co",
  anonKljuc: "<anon public>",
};
```

Anon ključ je javan po prirodi. **`service_role` ključ nikad ne ide u taj file**:
on zaobilazi RLS i smije postojati samo u rubnoj funkciji.

## 5. E-pošta (Resend)

1. Otvorite račun na [resend.com](https://resend.com). Besplatni plan: 3 000 mailova mjesečno, 100 dnevno.
2. **Domains → Add domain → `hes.hr`**. Resend pokaže DNS zapise (SPF i DKIM, TXT i MX na poddomeni).
   Upisuju se kod pružatelja DNS-a za hes.hr. Dok domena nije potvrđena, Resend šalje samo na
   adresu vlasnika računa.
3. **API Keys → Create**, s dozvolom *Sending access*.

## 6. Rubna funkcija

Treba [Supabase CLI](https://supabase.com/docs/guides/cli).

```sh
supabase login
supabase link --project-ref <ref>

supabase secrets set \
  RESEND_API_KEY=<kljuc iz Resenda> \
  WEBHOOK_TAJNA=<dugi nasumicni niz, npr. openssl rand -hex 32> \
  POSILJATELJ="HES <upiti@hes.hr>" \
  PRIMATELJ=alen.hranj@hes.hr \
  ADMIN_ADRESA=https://hes.hr/admin/

supabase functions deploy posalji-upit --no-verify-jwt
```

Zašto `--no-verify-jwt`: Supabaseova provjera pustila bi svaki valjan JWT, a među njima je i
javni anon ključ. Funkcija se zato štiti sama: webhook mora nositi `WEBHOOK_TAJNA`, a poziv iz
admin panela mora doći od korisnika koji stoji u tablici `admini`.

## 7. Webhook za nove upite

**Database → Webhooks → Create a new hook**:

| Polje | Vrijednost |
| --- | --- |
| Name | `upiti-mail` |
| Table | `public.upiti` |
| Events | samo **Insert** |
| Type | HTTP Request |
| Method | POST |
| URL | `https://<ref>.supabase.co/functions/v1/posalji-upit` |
| HTTP Headers | `Content-Type: application/json`, `x-hes-tajna: <WEBHOOK_TAJNA>` |

Webhook se šalje tek kad je upis potvrđen. Funkcija tada pročita upit i pošalje dva maila:
tvrtki (odgovor ide izravno kupcu) i kupcu (kopija na njegovom jeziku). Na kraju postavi
`poslano_mailom = true`. Ako se webhook ponovi, taj stupac sprječava drugi mail.

Upit kojem je `poslano_mailom` i dalje `false` je upisan, ali o njemu nitko nije obaviješten.
Admin panel ga zato ističe.

## 8. Provjera

Upit s alatom, poslan anonimnim ključem, kao što ga šalje stranica:

```sh
curl -s https://<ref>.supabase.co/rest/v1/rpc/posalji_upit \
  -H "apikey: <anon>" -H "Authorization: Bearer <anon>" -H "Content-Type: application/json" \
  -d '{"podaci":{"vrsta":"najam","ime":"Test","email":"<vasa adresa>","jezik":"hr",
       "stavke":[{"id":"1210","kolicina":1,"od":"2026-10-01","do":"2026-10-03"}]}}'
```

Očekivano:

- odgovor `{"ok": true, "id": "..."}`
- red u `upiti` i u `rezervacije` (status `na_cekanju`)
- dva maila u Resend → Logs
- isti poziv ponovljen za iste datume vraća `{"ok": false, "zauzeto": ["1210"], ...}`

Probni upit se poslije briše u Table Editoru. Rezervacija se briše zajedno s njim.

## 9. Katalog iz baze

Kad cijene počne voditi admin panel, prije svakog generiranja stranica:

```sh
npm run povuci     # baza -> assets/katalog.json
npm run stranice   # meta opisi stranica proizvoda s novim cijenama
```

Nakon `npm run povuci`, `python scripts/seed.py` više ne prepisuje `assets/katalog.json`
(osim s `--prepisi`).
