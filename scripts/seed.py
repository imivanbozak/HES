#!/usr/bin/env python3
"""
seed.py — gradi katalog iz izvorne dokumentacije.

Izlazi:
  supabase/seed.sql        za bazu
  assets/katalog.json      staticka zamjena kad Supabase nije podesen
  data/defekti-izvoza.md   popis poznatih gresaka u izvozu, za klijenta

Izvori i zasto bas oni:

  context.md              Jedino mjesto s WP ID-em, SKU-om, stanjem, markom i
                          RFQ zastavicom. To je sirovi ispis iz WooCommerce
                          administracije, u tab-odvojenim blokovima od sest
                          redaka po artiklu.
  hes-content.md §4       Dvorazinsko stablo kategorija. Izvoz ima samo ravan
                          popis kategorija po artiklu i ne kaze koja je od
                          njih nadredena, pa se hijerarhija cita odavde.

Pravilo koje se ne krsi: cetiri poznata defekta izvoza (§8.10) prenose se
DOSLOVNO, nikad se tiho ne ispravljaju. Zapisuju se u data/defekti-izvoza.md
da ih klijent potvrdi. Jedina iznimka je "ggrađevinske" u proznom tekstu, koji
ionako nije podatak nego novonapisana recenica.

Pokretanje:  python scripts/seed.py
"""

import io
import json
import os
import re
import sys

for tok in (sys.stdout, sys.stderr):
    if hasattr(tok, "reconfigure"):
        tok.reconfigure(encoding="utf-8", errors="replace")

KORIJEN = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ----------------------------------------------------------------------
# Slugovi
# ----------------------------------------------------------------------
PRESLOVI = str.maketrans({
    "č": "c", "ć": "c", "š": "s", "ž": "z", "đ": "d",
    "Č": "c", "Ć": "c", "Š": "s", "Ž": "z", "Đ": "d",
    "ä": "a", "ö": "o", "ü": "u", "ß": "ss",
})


def slug(tekst):
    osnova = tekst.strip().lower().translate(PRESLOVI)
    osnova = re.sub(r"[^a-z0-9]+", "-", osnova)
    return osnova.strip("-")


# ----------------------------------------------------------------------
# Stablo kategorija — iz hes-content.md
# ----------------------------------------------------------------------
def procitaj_stablo():
    """{ime obitelji: [imena podskupina]} za Loxone, plus ravne za najam.

    Tablica u hes-content.md §category-nav je jedini zapis hijerarhije. Izvoz
    zna samo da artikl pripada u "Detektori pokreta i prisutnosti, Loxone,
    Senzori" — ne i da je "Senzori" nadreden.
    """
    put = os.path.join(KORIJEN, "hes-content.md")
    tekst = io.open(put, encoding="utf-8").read()

    odsjek = re.search(
        r"### `category-nav`.*?\n\| Skupina \| Podskupine \|\n\|[^\n]*\n(.*?)\n\n",
        tekst, re.S)
    if not odsjek:
        sys.exit("GRESKA: stablo kategorija nije nadeno u hes-content.md")

    stablo = {}
    for red in odsjek.group(1).strip().splitlines():
        celije = [c.strip() for c in red.strip().strip("|").split("|")]
        if len(celije) < 2:
            continue
        obitelj = celije[0].strip("`")
        pod = [p.strip().strip("`") for p in celije[1].split(",") if p.strip()]
        stablo[obitelj] = pod
    return stablo


# Najam ima cetiri kategorije bez podrazine; redoslijed je iz
# hes-brand-context.md §5.1, po broju artikala.
KATEGORIJE_NAJMA = [
    "Ljestve i skele",
    "Rezanje i brušenje",
    "Bušenje i odvijanje",
    "Usisavači i otprašivanje",
]

# Kategorije koje su zapravo oznaka vrste, ne kategorija proizvoda.
NADREDENE = {"Loxone", "Najam alata"}


# ----------------------------------------------------------------------
# Sirovi izvoz — context.md
# ----------------------------------------------------------------------
def u_cente(zapis):
    """'655,61 €' ili '50,00 €/Day' -> (65561, 'kom'|'dan').

    Novac je cijelo vrijeme u centima. Decimalni zarez je hrvatski format iz
    izvora i prenosi se doslovno u prikaz, ali izracun nikad ne dira float.
    """
    po_danu = "/Day" in zapis
    broj = re.search(r"([\d.]+),(\d{2})", zapis)
    if not broj:
        return None, None
    cijeli = broj.group(1).replace(".", "")
    return int(cijeli) * 100 + int(broj.group(2)), ("dan" if po_danu else "kom")


def procitaj_izvoz():
    put = os.path.join(KORIJEN, "context.md")
    redovi = io.open(put, encoding="utf-8").read().splitlines()

    artikli = []
    for i, red in enumerate(redovi):
        if not red.startswith("ID: "):
            continue

        # Blok je sest redaka; ID je drugi. Trazi se po ID-u a ne po
        # redoslijedu jer izvoz ima tri prazna reda gdje je administracija
        # bila paginirana.
        oznaka = re.match(r"ID:\s*(\d+)", red)
        if not oznaka:
            continue

        ime_red = redovi[i - 1] if i > 0 else ""
        podaci_red = redovi[i + 1] if i + 1 < len(redovi) else ""
        marka_red = redovi[i + 3] if i + 3 < len(redovi) else ""

        # Redak s imenom ima tri polja: "Select <naziv>", <SKU>, <naziv>.
        # SKU je SREDNJE polje, ne zadnje. Na toj razlici visi jedan od cetiri
        # dokumentirana defekta izvoza: BOSCH GWS 12V-76 nosi SKU "gws-18v",
        # sto se vidi samo ako se cita pravi stupac.
        ime_dijelovi = ime_red.split("\t")
        naziv = ime_dijelovi[0].removeprefix("Select ").strip()
        sku = ime_dijelovi[1].strip() if len(ime_dijelovi) > 2 else ""

        polja = podaci_red.split("\t")
        if len(polja) < 4:
            continue
        stanje = polja[1].strip()
        cijena_zapis = polja[2].strip()
        kategorije = [k.strip() for k in polja[3].split(",") if k.strip()]

        marka_polja = marka_red.split("\t")
        marka = marka_polja[0].strip() if marka_polja else ""
        rfq = marka_polja[1].strip() if len(marka_polja) > 1 else ""

        cente, osnova = u_cente(cijena_zapis)
        if cente is None:
            continue

        artikli.append({
            "id": oznaka.group(1),
            "naziv": naziv,
            "sku": sku if sku and sku not in ("–", "—") else None,
            # "—No brands" znaci da marku nema. Izvoz mijesa en i em crticu,
            # pa se provjeravaju obje — inace niz "—No brands" prode kao da
            # je ime marke i pojavi se u filteru po markama.
            "marka": None if (not marka or marka[0] in "–—" or "No brands" in marka) else marka,
            "cijena_cents": cente,
            "osnova": osnova,
            "na_stanju": stanje.lower().startswith("in stock"),
            "kategorije": kategorije,
            "rfq": rfq == "Y",
        })

    return artikli


# ----------------------------------------------------------------------
# Poznati defekti izvoza (§8.10) — prenose se, ne ispravljaju
# ----------------------------------------------------------------------
DEFEKTI = [
    ("Dali extension – 64 uređaja", "webshop / family-listing",
     "Nema marku, dok je svaki drugi Loxone redak ima."),
    ("Presence Sensor Air Senzor pristunosti", "webshop / family-listing",
     "„pristunosti” je pogrešno napisano „prisutnosti”."),
    ("BOSCH GWS 12V-76", "najam-alata / rental-listing",
     "Nosi SKU „gws-18v”, koji ne odgovara nazivu proizvoda."),
    ("Bosch Professional 12 V System", "najam-alata / rental-listing",
     "Naziv serije, a ne proizvoda; označen oznakom „gbh”."),
]


def zapisi_defekte(artikli):
    imena = {a["naziv"] for a in artikli}
    redovi = [
        "# Poznati defekti izvoza kataloga",
        "",
        "Ova četiri zapisa dolaze takva iz WooCommerce izvoza i **prenose se",
        "doslovno** — `hes-content.md` §8.10 izričito traži da se ne ispravljaju",
        "tiho, jer bi tiha izmjena značila da se podatak razlikuje od klijentovog",
        "sustava a nitko ne zna zašto.",
        "",
        "Molimo klijenta da potvrdi kako s njima postupiti.",
        "",
        "| Artikl | Gdje se vidi | Što nije u redu | Postoji u izvozu |",
        "| --- | --- | --- | --- |",
    ]
    for naziv, gdje, opis in DEFEKTI:
        nadeno = "da" if naziv in imena else "**NE — provjeriti**"
        redovi.append(f"| `{naziv}` | {gdje} | {opis} | {nadeno} |")

    redovi += [
        "",
        "Peti slučaj, `ggrađevinske` u proznom tekstu izvora, **jest** ispravljen",
        "u `građevinske`: to nije podatak nego rečenica koja se ionako iznova piše.",
        "",
        "Otvoreno i dalje: je li 16 + 59 artikala cijeli katalog ili izvadak",
        "(`hes-structure.md` §4.3). O tome ovisi trebaju li liste stranicanje i",
        "pretraživanje.",
        "",
    ]

    put = os.path.join(KORIJEN, "data", "defekti-izvoza.md")
    os.makedirs(os.path.dirname(put), exist_ok=True)
    io.open(put, "w", encoding="utf-8").write("\n".join(redovi))
    return sum(1 for naziv, _, _ in DEFEKTI if naziv in imena)


# ----------------------------------------------------------------------
# Slaganje
# ----------------------------------------------------------------------
def slozi():
    stablo = procitaj_stablo()
    artikli = procitaj_izvoz()

    obitelji = list(stablo.keys())
    pod_u_obitelj = {}
    for obitelj, podskupine in stablo.items():
        for pod in podskupine:
            pod_u_obitelj[pod] = obitelj

    kategorije = []
    veze = []

    for redoslijed, obitelj in enumerate(obitelji):
        kategorije.append({
            "id": slug(obitelj), "vrsta": "loxone", "roditelj_id": None,
            "redoslijed": redoslijed, "naziv_hr": obitelj,
        })
        for j, pod in enumerate(stablo[obitelj]):
            kategorije.append({
                "id": slug(pod), "vrsta": "loxone", "roditelj_id": slug(obitelj),
                "redoslijed": j, "naziv_hr": pod,
            })

    for redoslijed, ime in enumerate(KATEGORIJE_NAJMA):
        kategorije.append({
            "id": slug(ime), "vrsta": "alat", "roditelj_id": None,
            "redoslijed": redoslijed, "naziv_hr": ime,
        })

    poznate = {k["id"] for k in kategorije}
    nepoznate = set()

    izlaz = []
    for artikl in artikli:
        vrsta = "alat" if artikl["osnova"] == "dan" else "loxone"

        pripadnosti = []
        for ime in artikl["kategorije"]:
            if ime in NADREDENE:
                continue
            kljuc = slug(ime)
            if kljuc in poznate:
                pripadnosti.append(kljuc)
                # Ako je artikl naveden samo uz podskupinu, dodaj i obitelj:
                # filter po obitelji inace ne bi nasao dio vlastitih artikala.
                obitelj = pod_u_obitelj.get(ime)
                if obitelj and slug(obitelj) not in pripadnosti:
                    pripadnosti.append(slug(obitelj))
            else:
                nepoznate.add(ime)

        for kljuc in dict.fromkeys(pripadnosti):
            veze.append((artikl["id"], kljuc))

        izlaz.append({
            "id": artikl["id"],
            "vrsta": vrsta,
            "naziv": artikl["naziv"],
            "sku": artikl["sku"],
            "marka": artikl["marka"],
            "cijena_cents": artikl["cijena_cents"],
            "osnova": artikl["osnova"],
            "na_stanju": artikl["na_stanju"],
            "slika": None,
            "kategorije": list(dict.fromkeys(pripadnosti)),
        })

    return kategorije, izlaz, veze, sorted(nepoznate)


# ----------------------------------------------------------------------
# Ispis
# ----------------------------------------------------------------------
def sql_niz(vrijednost):
    if vrijednost is None:
        return "null"
    if isinstance(vrijednost, bool):
        return "true" if vrijednost else "false"
    if isinstance(vrijednost, int):
        return str(vrijednost)
    return "'" + str(vrijednost).replace("'", "''") + "'"


def zapisi_sql(kategorije, artikli, veze):
    redovi = [
        "-- seed.sql — GENERIRANO. Ne uređivati ručno.",
        "-- Izvor: context.md (izvoz) + hes-content.md (stablo kategorija).",
        "-- Ponovna izgradnja: python scripts/seed.py",
        "--",
        "-- Pokretati NAKON shema.sql. Idempotentno je: ponovno pokretanje",
        "-- osvježava vrijednosti umjesto da padne na duplikatu.",
        "",
        "begin;",
        "",
        "-- Kategorije prije artikala; podskupine referenciraju obitelj.",
        "insert into kategorije (id, vrsta, roditelj_id, redoslijed, naziv_hr) values",
    ]

    # Obitelji prvo, pa podskupine: strani kljuc na roditelja mora zateci red.
    poredane = [k for k in kategorije if k["roditelj_id"] is None]
    poredane += [k for k in kategorije if k["roditelj_id"] is not None]

    stavke = [
        "  ({}, {}, {}, {}, {})".format(
            sql_niz(k["id"]), sql_niz(k["vrsta"]), sql_niz(k["roditelj_id"]),
            k["redoslijed"], sql_niz(k["naziv_hr"]))
        for k in poredane
    ]
    redovi.append(",\n".join(stavke))
    redovi += [
        "on conflict (id) do update set",
        "  vrsta = excluded.vrsta,",
        "  roditelj_id = excluded.roditelj_id,",
        "  redoslijed = excluded.redoslijed,",
        "  naziv_hr = excluded.naziv_hr;",
        "",
        "insert into artikli (id, vrsta, naziv, sku, marka, cijena_cents, osnova, na_stanju, slika, redoslijed) values",
    ]

    stavke = []
    for i, a in enumerate(artikli):
        stavke.append(
            "  ({}, {}, {}, {}, {}, {}, {}, {}, {}, {})".format(
                sql_niz(a["id"]), sql_niz(a["vrsta"]), sql_niz(a["naziv"]),
                sql_niz(a["sku"]), sql_niz(a["marka"]), a["cijena_cents"],
                sql_niz(a["osnova"]), sql_niz(a["na_stanju"]), sql_niz(a["slika"]), i)
        )
    redovi.append(",\n".join(stavke))
    redovi += [
        "on conflict (id) do update set",
        "  vrsta = excluded.vrsta,",
        "  naziv = excluded.naziv,",
        "  sku = excluded.sku,",
        "  marka = excluded.marka,",
        "  cijena_cents = excluded.cijena_cents,",
        "  osnova = excluded.osnova,",
        "  na_stanju = excluded.na_stanju,",
        "  redoslijed = excluded.redoslijed;",
        "",
        "-- Veze se brišu i pišu iznova: artikl je mogao promijeniti kategoriju,",
        "-- a upsert sam po sebi ne bi maknuo staru vezu.",
        "delete from artikl_kategorije;",
        "insert into artikl_kategorije (artikl_id, kategorija_id) values",
    ]
    redovi.append(",\n".join(
        "  ({}, {})".format(sql_niz(a), sql_niz(k)) for a, k in veze))
    redovi += ["on conflict do nothing;", "", "commit;", ""]

    put = os.path.join(KORIJEN, "supabase", "seed.sql")
    os.makedirs(os.path.dirname(put), exist_ok=True)
    io.open(put, "w", encoding="utf-8").write("\n".join(redovi))


def zapisi_json(kategorije, artikli):
    put = os.path.join(KORIJEN, "assets", "katalog.json")
    os.makedirs(os.path.dirname(put), exist_ok=True)
    sadrzaj = {
        "generirano": "scripts/seed.py",
        "izvor": ["context.md", "hes-content.md"],
        "kategorije": kategorije,
        "artikli": artikli,
    }
    io.open(put, "w", encoding="utf-8").write(
        json.dumps(sadrzaj, ensure_ascii=False, indent=1))


def glavno():
    kategorije, artikli, veze, nepoznate = slozi()

    zapisi_sql(kategorije, artikli, veze)
    zapisi_json(kategorije, artikli)
    nadeno_defekata = zapisi_defekte(artikli)

    loxone = [a for a in artikli if a["vrsta"] == "loxone"]
    alat = [a for a in artikli if a["vrsta"] == "alat"]
    obitelji = [k for k in kategorije if k["roditelj_id"] is None]
    podskupine = [k for k in kategorije if k["roditelj_id"] is not None]

    print("Katalog")
    print(f"  artikli        {len(artikli):3d}   loxone {len(loxone)}, alat {len(alat)}")
    print(f"  kategorije     {len(kategorije):3d}   {len(obitelji)} nadređenih, {len(podskupine)} podskupina")
    print(f"  veze           {len(veze):3d}")
    print(f"  bez marke      {sum(1 for a in artikli if not a['marka']):3d}")
    print(f"  bez kategorije {sum(1 for a in artikli if not a['kategorije']):3d}")
    print(f"  defekti izvoza {nadeno_defekata:3d}   od {len(DEFEKTI)} očekivanih")

    if nepoznate:
        print("\n  UPOZORENJE — kategorije iz izvoza kojih nema u stablu:")
        for ime in nepoznate:
            print(f"    {ime}")

    print("\n-> supabase/seed.sql")
    print("-> assets/katalog.json")
    print("-> data/defekti-izvoza.md")


if __name__ == "__main__":
    glavno()
