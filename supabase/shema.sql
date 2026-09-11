-- ===================================================================
-- shema.sql — baza za HES katalog, upite, najam i administraciju
-- ===================================================================
--
-- Zalijepiti u Supabase SQL Editor i pokrenuti. Zatim seed.sql, pa po
-- zelji testovi.sql (samo na razvojnom projektu).
--
-- Datoteka je namjerno idempotentna (`if not exists`, `or replace`,
-- `drop policy if exists`) pa se moze pokretati iznova bez ciscenja baze —
-- i nad bazom koja jos ima prvu verziju sheme.
--
-- Model u jednoj recenici: dvije zalihe koje nemaju nista zajednicko dijele
-- jednu tablicu, jer dijele i jednu komponentu tablice na stranici. Razlikuje
-- ih stupac `vrsta` i `osnova` cijene — po komadu ili po danu.
--
-- Sigurnosni sazetak:
--   katalog      — svatko smije citati, pisati smije samo admin
--   upiti        — upisuju se ISKLJUCIVO kroz posalji_upit(); citati i
--                  mijenjati ih smije samo admin
--   rezervacije  — isto kao upiti; javno se vidi samo zauzetost
--                  (zauzeti_termini), bez ijednog osobnog podatka
--   admini       — puni se rucno u SQL editoru (upute na dnu datoteke)
--
-- Da anonimni korisnik smije citati `upiti` ili `rezervacije`, mogao bi
-- procitati kontakte i kosarice svih drugih posjetitelja.

-- -------------------------------------------------------------------
-- Kategorije
-- -------------------------------------------------------------------
-- Samodrzeci strani kljuc daje dvorazinsko stablo: 11 Loxone skupina s 28
-- podskupina, i 4 kategorije najma bez podrazine.
create table if not exists public.kategorije (
  id           text primary key,
  vrsta        text not null check (vrsta in ('loxone', 'alat')),
  roditelj_id  text references public.kategorije (id) on delete cascade,
  redoslijed   int  not null default 0,
  naziv_hr     text not null check (char_length(naziv_hr) <= 120),
  naziv_de     text check (char_length(naziv_de) <= 120),
  naziv_en     text check (char_length(naziv_en) <= 120)
);

create index if not exists kategorije_vrsta_idx on public.kategorije (vrsta, redoslijed);

-- -------------------------------------------------------------------
-- Artikli
-- -------------------------------------------------------------------
create table if not exists public.artikli (
  -- WP post ID iz izvoza. Vanjski kljuc koji preživi ponovni uvoz, pa
  -- ponovno punjenje ne razbije poveznice ni košarice u pregledniku.
  id            text primary key,
  vrsta         text not null check (vrsta in ('loxone', 'alat')),

  -- Nazivi se NE prevode: to su imena proizvoda proizvođača.
  naziv         text not null check (char_length(naziv) <= 200),
  sku           text check (char_length(sku) <= 120),
  marka         text check (char_length(marka) <= 80),

  -- Novac je uvijek cijeli broj centi. Nijedan izračun na stranici ne dira
  -- decimalni broj; ../split je isto pravilo i jedini razlog zašto ima testove.
  cijena_cents  int  not null check (cijena_cents >= 0 and cijena_cents <= 100000000),

  -- 'kom' = po komadu (Loxone), 'dan' = po danu (najam). Dvije osnove cijene
  -- na istoj stranici su razlog zašto stupac postoji umjesto da se izvodi.
  osnova        text not null check (osnova in ('kom', 'dan')),

  na_stanju     boolean not null default true,
  slika         text check (char_length(slika) <= 300),
  redoslijed    int not null default 0
);

-- Stupci druge verzije. Dodaju se zasebno da shema prode i nad bazom koja
-- tablicu vec ima — `create table if not exists` postojecu ne dira.
--
-- `kolicina` je broj komada alata koji se mogu unajmiti ISTOVREMENO. Vecina
-- alata postoji u jednom primjerku, pa je zadano 1; nula znaci "trenutno se
-- ne iznajmljuje" (servis, kvar) bez brisanja artikla. Za Loxone se ne
-- koristi — ondje stanje nosi `na_stanju`.
alter table public.artikli add column if not exists
  kolicina int not null default 1 check (kolicina between 0 and 99);

-- Skriveni artikl ostaje u bazi (i u starim upitima), ali ga katalog ne
-- prikazuje. Brisanje bi slomilo stranicu proizvoda i košarice koje ga nose.
alter table public.artikli add column if not exists
  aktivan boolean not null default true;

alter table public.artikli add column if not exists
  azurirano timestamptz not null default now();

create index if not exists artikli_vrsta_idx on public.artikli (vrsta, redoslijed);
create index if not exists artikli_marka_idx on public.artikli (marka);

create or replace function public.oznaci_azurirano()
returns trigger
language plpgsql
as $$
begin
  new.azurirano := now();
  return new;
end;
$$;

drop trigger if exists artikli_azurirano on public.artikli;
create trigger artikli_azurirano
  before update on public.artikli
  for each row execute function public.oznaci_azurirano();

-- Artikl je u izvozu u vise kategorija odjednom (podskupina + skupina).
create table if not exists public.artikl_kategorije (
  artikl_id      text not null references public.artikli (id) on delete cascade,
  kategorija_id  text not null references public.kategorije (id) on delete cascade,
  primary key (artikl_id, kategorija_id)
);

create index if not exists artikl_kategorije_kat_idx
  on public.artikl_kategorije (kategorija_id);

-- -------------------------------------------------------------------
-- Upiti
-- -------------------------------------------------------------------
-- Kupnja je upitna, ne transakcijska: nema plaćanja, nema narudžbe. Red se
-- upisuje PRIJE nego se pošalje e-pošta, pa ako slanje padne, upit nije
-- izgubljen — samo nije javljen.
create table if not exists public.upiti (
  id            uuid primary key default gen_random_uuid(),
  stvoreno      timestamptz not null default now(),

  -- Šest opcija usmjeravanja iz obrasca.
  vrsta         text not null check (char_length(vrsta) <= 60),

  ime           text not null check (char_length(ime) between 2 and 120),
  email         text not null check (
                  char_length(email) between 5 and 160
                  and email like '%_@_%.__%'
                ),
  telefon       text check (char_length(telefon) <= 40),
  poruka        text check (char_length(poruka) <= 4000),
  jezik         text not null default 'hr' check (jezik in ('hr', 'de', 'en')),

  -- Snimka košarice u trenutku slanja: naziv, količina, cijena, a za najam i
  -- raspon datuma. Snima se, a ne referencira, jer ponuda mora ostati čitljiva
  -- i ako se cjenik poslije promijeni. Slaže je posalji_upit() iz baze, ne
  -- preglednik — cijena koju je poslao preglednik bila bi cijena koju je
  -- preglednik htio.
  stavke        jsonb not null default '[]'::jsonb
                  check (jsonb_typeof(stavke) = 'array'
                         and jsonb_array_length(stavke) <= 60),

  procjena_cents   int check (procjena_cents >= 0 and procjena_cents <= 100000000),
  poslano_mailom   boolean not null default false
);

-- Stupci za admin panel.
alter table public.upiti add column if not exists
  status text not null default 'novo' check (status in ('novo', 'u_obradi', 'zatvoreno'));

alter table public.upiti add column if not exists
  napomena_admina text check (char_length(napomena_admina) <= 4000);

create index if not exists upiti_stvoreno_idx on public.upiti (stvoreno desc);

-- -------------------------------------------------------------------
-- Rezervacije najma
-- -------------------------------------------------------------------
-- Jedan red = jedan alat za jedan raspon dana.
--
-- `raspon` je [od, do): pocetak ukljucen, kraj NE. Isto kao brojDana() u
-- js/kosarica.js — 12. do 15. su tri dana, a 15. je slobodan za iduceg, pa
-- se alat moze vratiti i ponovno izdati istog jutra. Daterange u Postgresu
-- se ionako uvijek svodi na taj oblik.
--
-- Zahtjev s web stranice ulazi kao `na_cekanju` i drzi termin 48 sati
-- (`istice`). Tako dvoje ljudi ne dobije isti alat za iste dane, a zaboravljen
-- zahtjev ne blokira alat zauvijek. Potvrda ili odbijanje dolazi iz admin
-- panela. Rucno upisana rezervacija na cekanju bez roka drzi termin do odluke.
create table if not exists public.rezervacije (
  id          uuid primary key default gen_random_uuid(),
  stvoreno    timestamptz not null default now(),

  -- `restrict`: alat s povijescu najma ne smije nestati ispod nje. Za
  -- povlacenje iz ponude postoji `artikli.aktivan`.
  artikl_id   text not null references public.artikli (id) on delete restrict,

  -- Prazno za rezervaciju koju je admin upisao sam (telefonski upit).
  upit_id     uuid references public.upiti (id) on delete cascade,

  raspon      daterange not null check (
                not isempty(raspon)
                and not lower_inf(raspon)
                and not upper_inf(raspon)
                and upper(raspon) - lower(raspon) <= 366
              ),
  kolicina    int  not null default 1 check (kolicina between 1 and 99),
  status      text not null default 'na_cekanju'
                check (status in ('na_cekanju', 'potvrdjeno', 'odbijeno', 'otkazano')),
  istice      timestamptz,
  napomena    text check (char_length(napomena) <= 1000)
);

create index if not exists rezervacije_artikl_idx on public.rezervacije (artikl_id);
create index if not exists rezervacije_raspon_idx on public.rezervacije using gist (raspon);
create index if not exists rezervacije_upit_idx on public.rezervacije (upit_id);

/**
 * Zauzima li rezervacija alat.
 *
 * Potvrdena uvijek. Na cekanju dok joj rok nije istekao. Odbijena i otkazana
 * nikad — njihov red ostaje samo kao povijest.
 */
create or replace function public.je_aktivna(p_status text, p_istice timestamptz)
returns boolean
language sql
stable
as $$
  select p_status = 'potvrdjeno'
      or (p_status = 'na_cekanju' and (p_istice is null or p_istice > now()));
$$;

/**
 * Najveci broj komada alata zauzet u bilo kojem danu raspona.
 *
 * Racuna se PO DANU, ne po preklapajucim redovima. Alat s dva komada i
 * rezervacijama 1.–3. i 5.–7. ima slobodan komad za 2.–6.: nijednog dana nisu
 * zauzeta oba. Zbroj preklapajucih redova bi rekao 2 i odbio zahtjev.
 *
 * `p_izuzmi` je rezervacija koja se upravo mijenja — ne smije se brojati
 * sama sa sobom.
 */
create or replace function public.najvise_zauzeto(
  p_artikl  text,
  p_raspon  daterange,
  p_izuzmi  uuid default null
)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(max(zbroj), 0)::int
    from (
      select sum(r.kolicina) as zbroj
        from generate_series(0, upper(p_raspon) - lower(p_raspon) - 1) as d(i)
        join public.rezervacije r
          on r.raspon @> (lower(p_raspon) + d.i)
       where r.artikl_id = p_artikl
         and (p_izuzmi is null or r.id <> p_izuzmi)
         and public.je_aktivna(r.status, r.istice)
       group by d.i
    ) po_danu;
$$;

/**
 * Cuvar od dvostruke rezervacije. Ovo je ODLUKA; sve provjere prije nje
 * (u pregledniku, u posalji_upit) su samo savjet posjetitelju.
 *
 * Red artikla se zakljucava (`for update`). Dva istovremena zahtjeva za isti
 * alat ovdje cekaju jedan drugoga — bez zakljucavanja bi oba procitala
 * "slobodno" i oba se upisala.
 */
create or replace function public.provjeri_zauzetost()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  kapacitet  int;
  osnova_artikla text;
begin
  if not public.je_aktivna(new.status, new.istice) then
    return new;
  end if;

  select a.kolicina, a.osnova
    into kapacitet, osnova_artikla
    from public.artikli a
   where a.id = new.artikl_id
     for update;

  if osnova_artikla is distinct from 'dan' then
    raise exception 'artikl % nije za najam', new.artikl_id;
  end if;

  if public.najvise_zauzeto(new.artikl_id, new.raspon, new.id) + new.kolicina > kapacitet then
    -- Poruka pocinje s "zauzeto:" i nosi id artikla. Po tome je prepoznaju
    -- posalji_upit() i admin panel.
    raise exception 'zauzeto:%', new.artikl_id using detail = new.raspon::text;
  end if;

  return new;
end;
$$;

drop trigger if exists rezervacije_zauzetost on public.rezervacije;
create trigger rezervacije_zauzetost
  before insert or update of artikl_id, raspon, kolicina, status, istice
  on public.rezervacije
  for each row execute function public.provjeri_zauzetost();

-- -------------------------------------------------------------------
-- Administratori
-- -------------------------------------------------------------------
-- Prijava ide kroz Supabase Auth (e-posta i lozinka). Biti prijavljen NIJE
-- dovoljno: admin je samo korisnik koji stoji u ovoj tablici. Tako slucajno
-- ukljucena registracija ne otvara nikome upite.
create table if not exists public.admini (
  user_id   uuid primary key references auth.users (id) on delete cascade,
  stvoreno  timestamptz not null default now()
);

create or replace function public.je_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admini where user_id = auth.uid());
$$;

-- -------------------------------------------------------------------
-- RLS
-- -------------------------------------------------------------------
alter table public.kategorije        enable row level security;
alter table public.artikli           enable row level security;
alter table public.artikl_kategorije enable row level security;
alter table public.upiti             enable row level security;
alter table public.rezervacije       enable row level security;
alter table public.admini            enable row level security;

-- Katalog: čitanje svima, uključujući skrivene artikle — `aktivan` nije
-- tajna, a scripts/povuci-katalog.mjs mora povući i njih da stranice
-- proizvoda ostanu cijele. Skrivene ne prikazuje js/katalog.js.
drop policy if exists kategorije_citaj on public.kategorije;
create policy kategorije_citaj on public.kategorije
  for select to anon, authenticated using (true);

drop policy if exists artikli_citaj on public.artikli;
create policy artikli_citaj on public.artikli
  for select to anon, authenticated using (true);

drop policy if exists artikl_kategorije_citaj on public.artikl_kategorije;
create policy artikl_kategorije_citaj on public.artikl_kategorije
  for select to anon, authenticated using (true);

-- Katalog: pisanje samo adminu.
drop policy if exists kategorije_admin on public.kategorije;
create policy kategorije_admin on public.kategorije
  for all to authenticated using (public.je_admin()) with check (public.je_admin());

drop policy if exists artikli_admin on public.artikli;
create policy artikli_admin on public.artikli
  for all to authenticated using (public.je_admin()) with check (public.je_admin());

drop policy if exists artikl_kategorije_admin on public.artikl_kategorije;
create policy artikl_kategorije_admin on public.artikl_kategorije
  for all to authenticated using (public.je_admin()) with check (public.je_admin());

-- Upiti i rezervacije: samo admin, i to za sve. Anonimni korisnik nema
-- NIJEDNU politiku, pa ne može ni čitati ni pisati — upis ide kroz
-- posalji_upit(), koja radi s pravima vlasnika.
--
-- Prva verzija sheme dopuštala je anonimni INSERT u `upiti`. Ta politika se
-- ovdje briše: izravan upis bi zaobišao provjeru zauzetosti i snimku cijena
-- iz baze.
drop policy if exists upiti_posalji on public.upiti;

drop policy if exists upiti_admin on public.upiti;
create policy upiti_admin on public.upiti
  for all to authenticated using (public.je_admin()) with check (public.je_admin());

drop policy if exists rezervacije_admin on public.rezervacije;
create policy rezervacije_admin on public.rezervacije
  for all to authenticated using (public.je_admin()) with check (public.je_admin());

-- Admin vidi samo sebe, i to samo da sucelje zna je li prijava ujedno i
-- admin. Nitko ne smije dodati sam sebe.
drop policy if exists admini_sebe on public.admini;
create policy admini_sebe on public.admini
  for select to authenticated using (user_id = auth.uid());

-- -------------------------------------------------------------------
-- Granice
-- -------------------------------------------------------------------
-- RLS štiti TKO smije pisati, ne KOLIKO. Bez ovoga jedan skript može napuniti
-- tablicu u noći. Ista pouka kao u ../split/supabase/shema.sql.
create or replace function public.ogranici_upite()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  nedavnih int;
begin
  -- Najviše 40 upita u sat vremena, ukupno. Za tvrtku koja ih dobiva
  -- nekoliko dnevno to je gornja granica koju stvarni promet ne dodiruje,
  -- a automat je pogodi odmah.
  select count(*) into nedavnih
    from public.upiti
   where stvoreno > now() - interval '1 hour';

  if nedavnih >= 40 then
    raise exception 'previse upita u kratkom razdoblju';
  end if;

  return new;
end;
$$;

drop trigger if exists upiti_granica on public.upiti;
create trigger upiti_granica
  before insert on public.upiti
  for each row execute function public.ogranici_upite();

-- -------------------------------------------------------------------
-- Slanje upita — jedini javni put upisa
-- -------------------------------------------------------------------
/**
 * Prima ono sto je posjetitelj upisao i sto je u kosarici, a vraca
 *   { ok: true,  id }                              upit je upisan
 *   { ok: false, zauzeto: [...], nedostupno: [...] }  nista nije upisano
 *
 * Ulaz:
 *   { vrsta, ime, email, telefon, poruka, jezik, web,
 *     stavke: [{ id, kolicina, od, do }] }
 *
 * `web` je skriveno polje obrasca. Covjek ga ne vidi i ostavlja prazno;
 * automat popunjava sva polja. Popunjeno znaci automat — odgovor je "ok" da
 * ne nauci sto ga je odalo, ali se nista ne upisuje.
 *
 * Cijene, nazive i osnovu cita iz baze. Iz preglednika uzima samo id,
 * kolicinu i datume; sve ostalo sto je poslao se ignorira.
 *
 * Dva prolaza: prvi provjerava sve stavke i skupi SVE zauzete, da
 * posjetitelj u jednom odgovoru sazna za svaki alat koji treba promijeniti.
 * Drugi pise. Trigger na rezervacijama provjerava ponovno pod zakljucanim
 * redom artikla — ako je netko u medjuvremenu uzeo termin, cijeli upit se
 * ponistava i vraca kao zauzet.
 */
create or replace function public.posalji_upit(podaci jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  ulaz        jsonb := coalesce(podaci -> 'stavke', '[]'::jsonb);
  stavka      jsonb;
  a           public.artikli%rowtype;
  kol         int;
  od          date;
  doo         date;
  iznos       bigint;
  procjena    bigint := 0;
  snimka      jsonb := '[]'::jsonb;
  zauzeti     text[] := '{}';
  nedostupni  text[] := '{}';
  novi_id     uuid;
begin
  if coalesce(podaci ->> 'web', '') <> '' then
    return jsonb_build_object('ok', true);
  end if;

  if jsonb_typeof(ulaz) <> 'array' or jsonb_array_length(ulaz) > 60 then
    raise exception 'neispravne stavke';
  end if;

  if coalesce(podaci ->> 'vrsta', '') not in
       ('industrijske', 'zavrsni', 'kucne', 'loxone', 'najam', 'zaposlenje') then
    raise exception 'nepoznata vrsta upita';
  end if;

  -- Prvi prolaz: provjeri i snimi, ne pisi.
  for stavka in select * from jsonb_array_elements(ulaz) loop
    select * into a from public.artikli where id = stavka ->> 'id';
    if not found or not a.aktivan then
      nedostupni := nedostupni || coalesce(stavka ->> 'id', '?');
      continue;
    end if;

    kol := coalesce((stavka ->> 'kolicina')::int, 1);
    if kol < 1 or kol > 99 then
      raise exception 'neispravna kolicina';
    end if;

    if a.osnova = 'dan' then
      od  := (stavka ->> 'od')::date;
      doo := (stavka ->> 'do')::date;
      if od is null or doo is null or doo <= od then
        raise exception 'neispravan raspon najma';
      end if;
      if od < current_date or od > current_date + 365 or doo - od > 366 then
        raise exception 'raspon najma izvan dopustenog';
      end if;
      if public.najvise_zauzeto(a.id, daterange(od, doo)) + kol > a.kolicina then
        zauzeti := zauzeti || a.id;
      end if;
      iznos := a.cijena_cents::bigint * kol * (doo - od);
    else
      od := null;
      doo := null;
      iznos := a.cijena_cents::bigint * kol;
    end if;

    procjena := procjena + iznos;
    snimka := snimka || jsonb_build_array(jsonb_build_object(
      'id', a.id,
      'naziv', a.naziv,
      'sku', a.sku,
      'marka', a.marka,
      'kolicina', kol,
      'cijena_cents', a.cijena_cents,
      'osnova', a.osnova,
      'od_datuma', od,
      'do_datuma', doo,
      'dana', case when a.osnova = 'dan' then doo - od end,
      'iznos_cents', iznos
    ));
  end loop;

  if cardinality(zauzeti) > 0 or cardinality(nedostupni) > 0 then
    return jsonb_build_object(
      'ok', false,
      'zauzeto', to_jsonb(zauzeti),
      'nedostupno', to_jsonb(nedostupni)
    );
  end if;

  -- Drugi prolaz: pisi. Blok s iznimkom je zasebna podtransakcija, pa pad
  -- rezervacije ponistava i vec upisan upit.
  begin
    insert into public.upiti
      (vrsta, ime, email, telefon, poruka, jezik, stavke, procjena_cents)
    values (
      podaci ->> 'vrsta',
      trim(podaci ->> 'ime'),
      lower(trim(podaci ->> 'email')),
      nullif(trim(coalesce(podaci ->> 'telefon', '')), ''),
      nullif(trim(coalesce(podaci ->> 'poruka', '')), ''),
      coalesce(podaci ->> 'jezik', 'hr'),
      snimka,
      least(procjena, 100000000)
    )
    returning id into novi_id;

    insert into public.rezervacije (artikl_id, upit_id, raspon, kolicina, status, istice)
    select s ->> 'id',
           novi_id,
           daterange((s ->> 'od_datuma')::date, (s ->> 'do_datuma')::date),
           (s ->> 'kolicina')::int,
           'na_cekanju',
           now() + interval '48 hours'
      from jsonb_array_elements(snimka) as s
     where s ->> 'osnova' = 'dan';
  exception when raise_exception then
    if sqlerrm like 'zauzeto:%' then
      return jsonb_build_object(
        'ok', false,
        'zauzeto', jsonb_build_array(substr(sqlerrm, 9)),
        'nedostupno', '[]'::jsonb
      );
    end if;
    raise;
  end;

  return jsonb_build_object('ok', true, 'id', novi_id);
end;
$$;

-- -------------------------------------------------------------------
-- Zauzetost — javno, bez osobnih podataka
-- -------------------------------------------------------------------
/**
 * Aktivne rezervacije za idućih 180 dana: samo alat, raspon i količina.
 * Iz ovoga kalendar na stranici zna koje dane treba zasiviti.
 *
 * Bez argumenta vraća sve alate odjednom, za oznake "Slobodno danas" na
 * cjeniku — jedan poziv umjesto šesnaest.
 */
create or replace function public.zauzeti_termini(p_artikl_id text default null)
returns table (artikl_id text, od_datuma date, do_datuma date, kolicina int, kapacitet int)
language sql
stable
security definer
set search_path = public
as $$
  select r.artikl_id, lower(r.raspon), upper(r.raspon), r.kolicina, a.kolicina
    from public.rezervacije r
    join public.artikli a on a.id = r.artikl_id
   where (p_artikl_id is null or r.artikl_id = p_artikl_id)
     and public.je_aktivna(r.status, r.istice)
     and upper(r.raspon) > current_date
     and lower(r.raspon) < current_date + 180
   order by r.artikl_id, lower(r.raspon);
$$;

-- Pomocne funkcije ne trebaju biti javno pozivljive; javne su samo dvije.
revoke execute on function public.najvise_zauzeto(text, daterange, uuid) from public, anon, authenticated;
grant  execute on function public.posalji_upit(jsonb) to anon, authenticated;
grant  execute on function public.zauzeti_termini(text) to anon, authenticated;

-- -------------------------------------------------------------------
-- Pogled za listanje
-- -------------------------------------------------------------------
-- Stranica uvijek treba artikl ZAJEDNO s njegovim kategorijama. Bez pogleda
-- bi to bila dva upita i spajanje u pregledniku, na svakom filtriranju.
--
-- Brise se i stvara iznova jer `a.*` sada nosi nove stupce, a
-- `create or replace view` ne dopusta da se stupci umetnu ispred postojecih.
-- `security_invoker`: pogled postuje RLS onoga tko ga cita, a ne vlasnika.
drop view if exists public.artikli_s_kategorijama;
create view public.artikli_s_kategorijama
  with (security_invoker = true)
as
  select
    a.*,
    coalesce(
      (select array_agg(ak.kategorija_id order by ak.kategorija_id)
         from public.artikl_kategorije ak
        where ak.artikl_id = a.id),
      '{}'::text[]
    ) as kategorije
  from public.artikli a;

-- -------------------------------------------------------------------
-- Prvi admin
-- -------------------------------------------------------------------
-- Ne radi se ovdje nego rucno, jednom, jer trazi lozinku koja ne smije
-- zavrsiti u repozitoriju:
--
--   1. Authentication > Users > Add user: e-posta i lozinka, "Auto Confirm".
--   2. Authentication > Sign In / Providers: iskljuciti "Allow new users to
--      sign up". Registracija ionako ne daje prava, ali nema razloga da
--      bude otvorena.
--   3. U SQL editoru:
--        insert into public.admini (user_id)
--        select id from auth.users where email = 'alen.hranj@hes.hr';
