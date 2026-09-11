-- ===================================================================
-- testovi.sql — pravila najma i prava pristupa
-- ===================================================================
--
-- Pokretati u SQL editoru RAZVOJNOG projekta, nakon shema.sql. Rezultat je
-- tablica na dnu: u svakom retku stupac `ok` mora biti true.
--
-- Testni podaci nose id "test-..." i adrese @primjer.hr. Brisu se na
-- pocetku (ako je prosli prolaz pukao napola) i na kraju.
--
-- Datumi su u 2030. da nijedan test ne ovisi o danasnjem danu.
--
-- Zasto ovoliko pomocnih funkcija: "mora pasti" se ne da provjeriti obicnim
-- upitom, jer greska prekida cijelu skriptu. pg_temp.pada() izvrsi naredbu u
-- vlastitoj podtransakciji i vrati je li pala s ocekivanom porukom.

create temp table if not exists rezultati (
  vrijeme  timestamptz not null default clock_timestamp(),
  opis     text not null,
  ok       boolean not null
);
truncate rezultati;

create or replace function pg_temp.tvrdnja(p_opis text, p_ok boolean)
returns void
language sql
as $$
  insert into rezultati (opis, ok) values (p_opis, coalesce(p_ok, false));
$$;

create or replace function pg_temp.pada(p_naredba text, p_uzorak text)
returns boolean
language plpgsql
as $$
begin
  execute p_naredba;
  return false;
exception when others then
  return sqlerrm like p_uzorak;
end;
$$;

create or replace function pg_temp.prolazi(p_naredba text)
returns boolean
language plpgsql
as $$
begin
  execute p_naredba;
  return true;
exception when others then
  raise notice 'neocekivana greska: %', sqlerrm;
  return false;
end;
$$;

-- -------------------------------------------------------------------
-- Priprema
-- -------------------------------------------------------------------
delete from public.rezervacije where artikl_id like 'test-%';
delete from public.upiti where email like '%@primjer.hr';
delete from public.artikli where id like 'test-%';

insert into public.artikli (id, vrsta, naziv, cijena_cents, osnova, kolicina, redoslijed) values
  ('test-jedan',  'alat',   'Test alat, jedan komad', 1000, 'dan', 1, 9999),
  ('test-dva',    'alat',   'Test alat, dva komada',  1000, 'dan', 2, 9999),
  ('test-loxone', 'loxone', 'Test Loxone',            5000, 'kom', 1, 9999);

-- -------------------------------------------------------------------
-- 1. Jedan komad
-- -------------------------------------------------------------------
select pg_temp.tvrdnja('1.1 prva rezervacija prolazi', pg_temp.prolazi($q$
  insert into public.rezervacije (artikl_id, raspon, status)
  values ('test-jedan', '[2030-01-10,2030-01-15)', 'potvrdjeno')
$q$));

select pg_temp.tvrdnja('1.2 preklapajuca rezervacija pada', pg_temp.pada($q$
  insert into public.rezervacije (artikl_id, raspon, status)
  values ('test-jedan', '[2030-01-14,2030-01-20)', 'potvrdjeno')
$q$, 'zauzeto:test-jedan'));

select pg_temp.tvrdnja('1.3 susjedna prolazi: vraca se i izdaje istog dana (15.)', pg_temp.prolazi($q$
  insert into public.rezervacije (artikl_id, raspon, status)
  values ('test-jedan', '[2030-01-15,2030-01-20)', 'potvrdjeno')
$q$));

-- -------------------------------------------------------------------
-- 2. Zahtjev na cekanju
-- -------------------------------------------------------------------
select pg_temp.tvrdnja('2.1 zahtjev na cekanju se upisuje', pg_temp.prolazi($q$
  insert into public.rezervacije (artikl_id, raspon, status, istice)
  values ('test-jedan', '[2030-02-01,2030-02-05)', 'na_cekanju', now() + interval '48 hours')
$q$));

select pg_temp.tvrdnja('2.2 ... i drzi termin dok mu rok traje', pg_temp.pada($q$
  insert into public.rezervacije (artikl_id, raspon, status)
  values ('test-jedan', '[2030-02-03,2030-02-04)', 'potvrdjeno')
$q$, 'zauzeto:%'));

update public.rezervacije set status = 'odbijeno'
 where artikl_id = 'test-jedan' and raspon = '[2030-02-01,2030-02-05)';

select pg_temp.tvrdnja('2.3 odbijen zahtjev oslobada termin', pg_temp.prolazi($q$
  insert into public.rezervacije (artikl_id, raspon, status)
  values ('test-jedan', '[2030-02-03,2030-02-04)', 'potvrdjeno')
$q$));

select pg_temp.tvrdnja('2.4 istekao zahtjev se upisuje', pg_temp.prolazi($q$
  insert into public.rezervacije (artikl_id, raspon, status, istice)
  values ('test-jedan', '[2030-03-01,2030-03-05)', 'na_cekanju', now() - interval '1 hour')
$q$));

select pg_temp.tvrdnja('2.5 ... ali termin vise ne drzi', pg_temp.prolazi($q$
  insert into public.rezervacije (artikl_id, raspon, status)
  values ('test-jedan', '[2030-03-02,2030-03-03)', 'potvrdjeno')
$q$));

select pg_temp.tvrdnja('2.6 potvrda isteklog zahtjeva pada ako je termin u medjuvremenu uzet', pg_temp.pada($q$
  update public.rezervacije set status = 'potvrdjeno'
   where artikl_id = 'test-jedan' and raspon = '[2030-03-01,2030-03-05)' and status = 'na_cekanju'
$q$, 'zauzeto:%'));

-- -------------------------------------------------------------------
-- 3. Dva komada — racuna se po danu
-- -------------------------------------------------------------------
select pg_temp.tvrdnja('3.1 dva komada: prva rezervacija', pg_temp.prolazi($q$
  insert into public.rezervacije (artikl_id, raspon, status)
  values ('test-dva', '[2030-05-01,2030-05-03)', 'potvrdjeno')
$q$));

select pg_temp.tvrdnja('3.2 dva komada: druga, bez preklapanja s prvom', pg_temp.prolazi($q$
  insert into public.rezervacije (artikl_id, raspon, status)
  values ('test-dva', '[2030-05-05,2030-05-07)', 'potvrdjeno')
$q$));

-- Preklapa OBJE, ali nijednog dana nisu zauzeta dva komada — mora proci.
-- Brojanje preklapajucih redova bi reklo 2 + 1 > 2 i odbilo je.
select pg_temp.tvrdnja('3.3 raspon preko obje prolazi: nijedan dan nema dva zauzeta komada', pg_temp.prolazi($q$
  insert into public.rezervacije (artikl_id, raspon, status)
  values ('test-dva', '[2030-05-02,2030-05-06)', 'potvrdjeno')
$q$));

select pg_temp.tvrdnja('3.4 treci komad istog dana pada', pg_temp.pada($q$
  insert into public.rezervacije (artikl_id, raspon, status)
  values ('test-dva', '[2030-05-02,2030-05-03)', 'potvrdjeno')
$q$, 'zauzeto:test-dva'));

select pg_temp.tvrdnja('3.5 rezervacija dva komada odjednom na slobodne dane', pg_temp.prolazi($q$
  insert into public.rezervacije (artikl_id, raspon, kolicina, status)
  values ('test-dva', '[2030-06-01,2030-06-03)', 2, 'potvrdjeno')
$q$));

-- -------------------------------------------------------------------
-- 4. Pogresne rezervacije
-- -------------------------------------------------------------------
select pg_temp.tvrdnja('4.1 Loxone artikl se ne moze rezervirati', pg_temp.pada($q$
  insert into public.rezervacije (artikl_id, raspon, status)
  values ('test-loxone', '[2030-01-10,2030-01-12)', 'potvrdjeno')
$q$, '%nije za najam%'));

select pg_temp.tvrdnja('4.2 prazan raspon se ne moze upisati', pg_temp.pada($q$
  insert into public.rezervacije (artikl_id, raspon, status)
  values ('test-jedan', '[2030-07-10,2030-07-10)', 'potvrdjeno')
$q$, '%check constraint%'));

update public.artikli set kolicina = 0 where id = 'test-dva';
select pg_temp.tvrdnja('4.3 alat s kolicinom 0 (servis) se ne izdaje', pg_temp.pada($q$
  insert into public.rezervacije (artikl_id, raspon, status)
  values ('test-dva', '[2030-08-01,2030-08-02)', 'potvrdjeno')
$q$, 'zauzeto:%'));
update public.artikli set kolicina = 2 where id = 'test-dva';

-- -------------------------------------------------------------------
-- 5. posalji_upit()
-- -------------------------------------------------------------------
-- cijena_cents: 1 u ulazu je namjerno: funkcija je mora ignorirati.
select pg_temp.tvrdnja('5.1 upit s najmom slobodnog termina prolazi',
  (public.posalji_upit($j${
    "vrsta": "najam", "ime": "Test Testić", "email": "prvi@primjer.hr", "jezik": "hr",
    "stavke": [{ "id": "test-jedan", "kolicina": 1, "od": "2030-09-01", "do": "2030-09-04", "cijena_cents": 1 }]
  }$j$::jsonb) ->> 'ok')::boolean);

select pg_temp.tvrdnja('5.2 rezervacija iz upita je na cekanju, s rokom od 48 h',
  exists (
    select 1 from public.rezervacije
     where artikl_id = 'test-jedan'
       and raspon = '[2030-09-01,2030-09-04)'
       and status = 'na_cekanju'
       and upit_id is not null
       and istice between now() + interval '47 hours' and now() + interval '49 hours'
  ));

select pg_temp.tvrdnja('5.3 procjena je iz baze: 3 dana x 10,00 EUR, ne cijena iz preglednika',
  exists (select 1 from public.upiti where email = 'prvi@primjer.hr' and procjena_cents = 3000));

select pg_temp.tvrdnja('5.4 drugi upit za isti termin vraca zauzeto',
  (public.posalji_upit($j${
    "vrsta": "najam", "ime": "Drugi Test", "email": "drugi@primjer.hr",
    "stavke": [{ "id": "test-jedan", "kolicina": 1, "od": "2030-09-03", "do": "2030-09-05" }]
  }$j$::jsonb) -> 'zauzeto') ? 'test-jedan');

select pg_temp.tvrdnja('5.5 ... i ne upisuje nista',
  not exists (select 1 from public.upiti where email = 'drugi@primjer.hr'));

select pg_temp.tvrdnja('5.6 skriveni artikl se vraca kao nedostupan',
  (select (public.posalji_upit($j${
     "vrsta": "loxone", "ime": "Treci Test", "email": "treci@primjer.hr",
     "stavke": [{ "id": "nepostojeci-artikl", "kolicina": 1 }]
   }$j$::jsonb) -> 'nedostupno') ? 'nepostojeci-artikl'));

select pg_temp.tvrdnja('5.7 zamka za automate: odgovor je ok',
  (public.posalji_upit($j${
    "vrsta": "najam", "ime": "Automat", "email": "automat@primjer.hr", "web": "http://spam.example",
    "stavke": []
  }$j$::jsonb) ->> 'ok')::boolean);

select pg_temp.tvrdnja('5.8 ... ali nista nije upisano',
  not exists (select 1 from public.upiti where email = 'automat@primjer.hr'));

select pg_temp.tvrdnja('5.9 nepoznata vrsta upita pada', pg_temp.pada($q$
  select public.posalji_upit('{"vrsta": "x", "ime": "Test", "email": "x@primjer.hr", "stavke": []}')
$q$, '%nepoznata vrsta%'));

select pg_temp.tvrdnja('5.10 najam u proslosti pada', pg_temp.pada($q$
  select public.posalji_upit('{"vrsta": "najam", "ime": "Test", "email": "x@primjer.hr",
    "stavke": [{"id": "test-dva", "od": "2020-01-01", "do": "2020-01-03"}]}')
$q$, '%izvan dopustenog%'));

-- -------------------------------------------------------------------
-- 6. Anonimni posjetitelj
-- -------------------------------------------------------------------
-- Vrijednosti se biljeze u postavke sesije pa se provjeravaju tek nakon
-- povratka u vlastitu ulogu: anon ne smije pisati ni u tablicu rezultata.
set role anon;

select set_config('test.anon_upiti', (select count(*) from public.upiti)::text, false);
select set_config('test.anon_rezervacije', (select count(*) from public.rezervacije)::text, false);
select set_config('test.anon_zauzetost', (select count(*) from public.zauzeti_termini('test-jedan'))::text, false);

do $$
begin
  insert into public.upiti (vrsta, ime, email) values ('najam', 'Anon', 'anon@primjer.hr');
  perform set_config('test.anon_upis', 'proslo', false);
exception when others then
  perform set_config('test.anon_upis', sqlerrm, false);
end $$;

do $$
begin
  insert into public.rezervacije (artikl_id, raspon, status)
  values ('test-dva', '[2031-01-01,2031-01-02)', 'potvrdjeno');
  perform set_config('test.anon_rezervacija', 'proslo', false);
exception when others then
  perform set_config('test.anon_rezervacija', sqlerrm, false);
end $$;

update public.artikli set cijena_cents = 1 where id = 'test-jedan';

reset role;

select pg_temp.tvrdnja('6.1 anon ne vidi nijedan upit', current_setting('test.anon_upiti') = '0');
select pg_temp.tvrdnja('6.2 anon ne vidi nijednu rezervaciju', current_setting('test.anon_rezervacije') = '0');
select pg_temp.tvrdnja('6.3 anon vidi zauzetost alata', current_setting('test.anon_zauzetost')::int > 0);
select pg_temp.tvrdnja('6.4 anon ne moze izravno upisati upit', current_setting('test.anon_upis') like '%row-level security%');
select pg_temp.tvrdnja('6.5 anon ne moze izravno upisati rezervaciju', current_setting('test.anon_rezervacija') like '%row-level security%');
select pg_temp.tvrdnja('6.6 anon ne moze promijeniti cijenu',
  (select cijena_cents from public.artikli where id = 'test-jedan') = 1000);

-- -------------------------------------------------------------------
-- Ciscenje i rezultat
-- -------------------------------------------------------------------
delete from public.rezervacije where artikl_id like 'test-%';
delete from public.upiti where email like '%@primjer.hr';
delete from public.artikli where id like 'test-%';

select opis, ok from rezultati order by vrijeme;
