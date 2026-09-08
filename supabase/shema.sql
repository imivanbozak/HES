-- ===================================================================
-- shema.sql — baza za HES katalog i upite
-- ===================================================================
--
-- Zalijepiti u Supabase SQL Editor i pokrenuti. Zatim seed.sql.
--
-- Datoteka je namjerno idempotentna (`if not exists`, `or replace`,
-- `drop policy if exists`) pa se moze pokretati iznova bez ciscenja baze.
--
-- Model u jednoj recenici: dvije zalihe koje nemaju nista zajedničko dijele
-- jednu tablicu, jer dijele i jednu komponentu tablice na stranici. Razlikuje
-- ih stupac `vrsta` i `osnova` cijene — po komadu ili po danu.
--
-- Sigurnosni sazetak:
--   katalog  — svatko smije citati, nitko ne smije pisati
--   upiti    — svatko smije UPISATI jedan red, NITKO ne smije citati
--
-- Drugi redak je vazniji nego sto izgleda: kad bi anonimni korisnik smio
-- citati `upiti`, mogao bi procitati kontakte i kosarice svih drugih posjetitelja.

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

create index if not exists artikli_vrsta_idx on public.artikli (vrsta, redoslijed);
create index if not exists artikli_marka_idx on public.artikli (marka);

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

  -- Šest opcija usmjeravanja iz obrasca + 'kosarica' kad dolazi iz ladice.
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
  -- i ako se cjenik poslije promijeni.
  stavke        jsonb not null default '[]'::jsonb
                  check (jsonb_typeof(stavke) = 'array'
                         and jsonb_array_length(stavke) <= 60),

  procjena_cents   int check (procjena_cents >= 0 and procjena_cents <= 100000000),
  poslano_mailom   boolean not null default false
);

create index if not exists upiti_stvoreno_idx on public.upiti (stvoreno desc);

-- -------------------------------------------------------------------
-- RLS
-- -------------------------------------------------------------------
alter table public.kategorije        enable row level security;
alter table public.artikli           enable row level security;
alter table public.artikl_kategorije enable row level security;
alter table public.upiti             enable row level security;

-- Katalog: čitanje svima, pisanje nikome. Cjenik se mijenja kroz seed.sql
-- servisnim ključem, nikad iz preglednika.
drop policy if exists kategorije_citaj on public.kategorije;
create policy kategorije_citaj on public.kategorije
  for select to anon, authenticated using (true);

drop policy if exists artikli_citaj on public.artikli;
create policy artikli_citaj on public.artikli
  for select to anon, authenticated using (true);

drop policy if exists artikl_kategorije_citaj on public.artikl_kategorije;
create policy artikl_kategorije_citaj on public.artikl_kategorije
  for select to anon, authenticated using (true);

-- Upiti: samo upis. Nema politike za select, update ni delete, pa ih anonimni
-- korisnik ne može ni čitati ni mijenjati — ni svoje. Sadržaj čita rubna
-- funkcija servisnim ključem, koji RLS zaobilazi.
drop policy if exists upiti_posalji on public.upiti;
create policy upiti_posalji on public.upiti
  for insert to anon, authenticated with check (
    -- `poslano_mailom` postavlja isključivo rubna funkcija nakon što e-pošta
    -- stvarno ode. Da ga klijent smije postaviti, upit koji nije poslan mogao
    -- bi izgledati kao poslan i nikad se ne bi primijetio.
    poslano_mailom = false
  );

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
-- Pogled za listanje
-- -------------------------------------------------------------------
-- Stranica uvijek treba artikl ZAJEDNO s njegovim kategorijama. Bez pogleda
-- bi to bila dva upita i spajanje u pregledniku, na svakom filtriranju.
create or replace view public.artikli_s_kategorijama as
  select
    a.*,
    coalesce(
      (select array_agg(ak.kategorija_id order by ak.kategorija_id)
         from public.artikl_kategorije ak
        where ak.artikl_id = a.id),
      '{}'::text[]
    ) as kategorije
  from public.artikli a;
