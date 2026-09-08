#!/usr/bin/env python3
"""
provjere.py — provjere koje se ne vide okom, a lome stranicu ako propadnu.

Pokretanje:  python scripts/provjere.py

Svaka provjera ispisuje sto je gledala i zavrsava s OK ili PAD. Skripta vraca
izlazni kod 1 ako je ista pala, pa se moze objesiti na commit ili build.

  1. Pokrivenost pisama — svaki znak koji se na stranici moze pojaviti mora
     postojati u oba woff2. Ovo je razlog zbog kojeg scripts/fontovi.py
     uopce postoji: izvorni rezovi nemaju ć, đ ni tabularne brojke.
  2. Njemacki bez ß — Neue Regrade ga nema i nije ga moguce sloziti iz
     postojecih dijelova, pa se njemacki tekst pise bez njega.
  3. Kontrast — svaki par teksta i plohe u obje teme, po WCAG AA.
"""

import glob
import os
import re
import sys
import unicodedata

# Windows konzola je cp1252 pa bi ispis znaka poput U+2192 srusio skriptu
# prije nego sto stigne javiti sto je nasla.
for tok in (sys.stdout, sys.stderr):
    if hasattr(tok, "reconfigure"):
        tok.reconfigure(encoding="utf-8", errors="replace")

KORIJEN = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

pali = []
prosli = []


def naslov(tekst):
    print("\n" + tekst)
    print("-" * len(tekst))


def tvrdnja(uvjet, opis, detalj=""):
    if uvjet:
        prosli.append(opis)
        print("  OK   " + opis)
    else:
        pali.append(opis)
        print("  PAD  " + opis + (("\n       " + detalj) if detalj else ""))
    return uvjet


# ======================================================================
# 1. + 2.  Pisma
# ======================================================================
# Znakovi koje izvorna pisma nemaju i koji se zato ne koriste. Objasnjenje
# stoji u scripts/fontovi.py (IZBJEGAVAJ); ovdje samo trebamo popis da bismo
# znali razliku izmedu "font je lose izgraden" i "ovo namjerno ne koristimo".
IZBJEGAVAJ = {
    "°": "stupanj — nema ga u Regradeu, stranica nema temperatura",
    "→": "strelica — raspon datuma se pise en-crticom: 12.09. – 15.09.",
    "ß": "eszett — njemacki se pise bez njega, vidi provjeru 2",
}

# Znakovi koji postoje samo u markdown sintaksi izvorne dokumentacije i nikad
# ne dodu na stranicu. Bitno samo dok se provjera oslanja na te dokumente.
MARKDOWN_SINTAKSA = set("`~|\\^<>")


def znakovi_stranice():
    """(skup znakova, je_li_strogo).

    Kad postoji stvarni sadrzaj stranice — rjecnik, katalog, HTML — cita se
    iz njega i provjera je stroga. Dok toga nema, cita se izvorna
    dokumentacija kao gruba gornja granica i provjera je samo najava, jer ti
    dokumenti sadrze i englesku strukturu koja nikad ne dode na stranicu.
    """
    stvarni = []
    for relativna in ("js/i18n.js", "assets/katalog.json",
                      "index.html", "webshop.html", "najam-alata.html"):
        put = os.path.join(KORIJEN, relativna)
        if os.path.exists(put):
            stvarni.append(put)

    # Stranice proizvoda se generiraju pa im se popis ne moze drzati rucno;
    # jedan novi artikl bi inace usao s znakom kojeg font nema, a provjera bi
    # i dalje javljala da je sve u redu.
    stvarni += sorted(glob.glob(os.path.join(KORIJEN, "proizvodi", "*.html")))

    if stvarni:
        izvori, strogo = stvarni, True
    else:
        izvori = [os.path.join(KORIJEN, ime)
                  for ime in ("hes-brand-context.md", "hes-content.md")
                  if os.path.exists(os.path.join(KORIJEN, ime))]
        strogo = False

    skup = set()
    for put in izvori:
        with open(put, encoding="utf-8") as dat:
            skup.update(dat.read())

    skup = {z for z in skup
            if z.isprintable() and not z.isspace() and ord(z) < 0x2200}
    if not strogo:
        skup -= MARKDOWN_SINTAKSA
    return skup, strogo


def provjeri_pisma():
    naslov("1. Pokrivenost pisama")
    try:
        from fontTools.ttLib import TTFont
    except ImportError:
        tvrdnja(False, "fontTools je dostupan", "pip install fonttools")
        return

    # Regrade nosi SAV tekst na stranici i mora imati svaki znak.
    #
    # Monr je bio drugo pismo, na natpisima bez dijakritike. Uklonjen je iz
    # css/tokens.css i vise ga nijedna stranica ne ucitava, pa se ni ne
    # provjerava: pokrivenost pisma koje se ne prikazuje nije mjerilo nicega.
    # Datoteka assets/fonts/hes-monr.woff2 namjerno ostaje na disku, zajedno s
    # granom u scripts/fontovi.py koja je gradi — ako se drugo pismo ikad
    # vrati, vraca se bez ponovne izgradnje.
    fontovi = {
        "hes-regrade": os.path.join(KORIJEN, "assets", "fonts", "hes-regrade.woff2"),
    }
    for ime, put in fontovi.items():
        if not os.path.exists(put):
            tvrdnja(False, ime + " postoji", "pokreni: python scripts/fontovi.py")
            return

    trazeni, strogo = znakovi_stranice()
    print("  citano iz {}: {} razlicitih znakova".format(
        "sadrzaja stranice" if strogo else "izvorne dokumentacije (najava)",
        len(trazeni)))

    for ime, put in fontovi.items():
        cmap = TTFont(put).getBestCmap()
        nedostaju = sorted({z for z in trazeni if ord(z) not in cmap})

        # Razdvoji "font je lose izgraden" od "ovo namjerno ne koristimo".
        namjerno = [z for z in nedostaju if z in IZBJEGAVAJ]
        pravi = [z for z in nedostaju if z not in IZBJEGAVAJ]

        opis = "{}: svi znakovi stranice su u fontu".format(ime)
        detalj = ""
        if pravi:
            detalj = "nedostaje {}: {}".format(
                len(pravi),
                ", ".join("U+{:04X} {}".format(ord(z), unicodedata.name(z, "?"))
                          for z in pravi[:12]))
        if strogo:
            tvrdnja(not pravi, opis, detalj)
        elif pravi:
            print("  ??   " + opis + " — jos nije mjerodavno")
            print("       " + detalj)
        else:
            print("  ok   " + opis + " (najava)")

        for z in namjerno:
            print("       namjerno izostavljen: U+{:04X}  {}".format(ord(z), IZBJEGAVAJ[z]))

    # Tabularne brojke: bez njih se 75 cijena u dva stupca ne poravnaju.
    for ime, put in fontovi.items():
        font = TTFont(put)
        cmap = font.getBestCmap()
        hmtx = font["hmtx"]
        sirine = {hmtx[cmap[ord(z)]][0] for z in "0123456789"}
        tvrdnja(len(sirine) == 1,
                "{}: znamenke su tabularne".format(ime),
                "sirine: {}".format(sorted(sirine)))


def provjeri_njemacki_bez_eszetta():
    naslov("2. Njemacki tekst bez ß")
    rjecnik = os.path.join(KORIJEN, "js", "i18n.js")
    if not os.path.exists(rjecnik):
        print("  (preskoceno — js/i18n.js jos ne postoji)")
        return

    with open(rjecnik, encoding="utf-8") as dat:
        sadrzaj = dat.read()

    # Njemacki blok pocinje na `de: {` i traje do sljedeceg jezika.
    poklapanje = re.search(r"\bde:\s*\{(.*?)\n\s*\},\s*\n\s*(en|hr):", sadrzaj, re.S)
    if not poklapanje:
        print("  (preskoceno — njemacki blok jos nije napisan)")
        return

    njemacki = poklapanje.group(1)
    pojave = [red.strip() for red in njemacki.splitlines() if "ß" in red]
    tvrdnja(not pojave,
            "u njemackom rjecniku nema ß",
            "Neue Regrade ga nema. Zamijeni sa 'ss' ili drugom rijecju:\n       "
            + "\n       ".join(pojave[:6]))


# ======================================================================
# 3.  Kontrast
# ======================================================================
def u_linearno(kanal):
    k = kanal / 255
    return k / 12.92 if k <= 0.04045 else ((k + 0.055) / 1.055) ** 2.4


def svjetlina(hex_boja):
    hex_boja = hex_boja.lstrip("#")
    r, g, b = (int(hex_boja[i:i + 2], 16) for i in (0, 2, 4))
    return 0.2126 * u_linearno(r) + 0.7152 * u_linearno(g) + 0.0722 * u_linearno(b)


def omjer(prva, druga):
    a, b = svjetlina(prva), svjetlina(druga)
    if a < b:
        a, b = b, a
    return (a + 0.05) / (b + 0.05)


def procitaj_tokene():
    """Izvuci doslovne hex vrijednosti iz tokens.css, po temi.

    Namjerno se citaju iz datoteke a ne prepisuju ovamo: provjera koja ima
    vlastitu kopiju paleta prestaje biti provjera cim netko dirne CSS.
    Izvedenice kroz color-mix() se preskacu — one nose rubove i pranja, ne
    tekst, pa AA za njih nije mjerodavan.
    """
    put = os.path.join(KORIJEN, "css", "tokens.css")
    with open(put, encoding="utf-8") as dat:
        css = dat.read()

    teme = {}
    for ime, uzorak in (("tamna", r":root\s*\{(.*?)\n\}"),
                        ("svijetla", r':root\[data-theme="svijetla"\]\s*\{(.*?)\n\}')):
        blok = re.search(uzorak, css, re.S).group(1)
        doslovne = dict(re.findall(r"(--[a-z0-9-]+):\s*(#[0-9A-Fa-f]{6})\s*;", blok))
        # Aliasi tipa `--hes-tekst: var(--hes);` — bez razrjesavanja bi
        # ispali iz provjere upravo u temi u kojoj su alias, sto je tiha rupa.
        aliasi = dict(re.findall(r"(--[a-z0-9-]+):\s*var\((--[a-z0-9-]+)\)\s*;", blok))
        teme[ime] = (doslovne, aliasi)

    # Svijetla tema redefinira samo dio; ostalo naslijedi iz tamne.
    razrijeseno = {}
    for ime in ("tamna", "svijetla"):
        doslovne, aliasi = teme[ime]
        paleta = dict(teme["tamna"][0]) if ime == "svijetla" else {}
        paleta.update(doslovne)
        for kljuc, cilj in list(teme["tamna"][1].items()) + list(aliasi.items()):
            if kljuc not in doslovne and cilj in paleta:
                paleta[kljuc] = paleta[cilj]
        razrijeseno[ime] = paleta
    return razrijeseno


# (tekst, ploha, najmanji omjer, opis)
# 4.5 za tekst normalne velicine, 3.0 za krupan (>=24px ili >=19px bold)
PAROVI = [
    ("--tekst", "--ploha-0", 4.5, "tijelo na stranici"),
    ("--tekst", "--ploha-1", 4.5, "tijelo na podignutom polju"),
    ("--tekst", "--ploha-2", 4.5, "tijelo na kartici"),
    ("--tekst", "--ploha-3", 4.5, "tijelo na hoveru kartice"),
    # Tealna ploha ostaje tamna u obje teme pa ima vlastite tokene za tekst.
    ("--tekst-na-tealu", "--ploha-teal", 4.5, "tijelo na tealnom polju"),
    ("--tekst-na-tealu", "--ploha-teal-2", 4.5, "tijelo na svjetlijem tealu"),
    ("--tekst-2-na-tealu", "--ploha-teal", 4.5, "sekundarno na tealu"),
    ("--hes-na-tealu", "--ploha-teal", 3.0, "naglasak na tealu (krupno)"),
    ("--tekst-2", "--ploha-0", 4.5, "sekundarni tekst"),
    ("--tekst-2", "--ploha-2", 4.5, "sekundarni tekst na kartici"),
    ("--tekst-3", "--ploha-0", 4.5, "prigusen tekst"),
    ("--tekst-3", "--ploha-2", 4.5, "prigusen tekst na kartici"),
    ("--tekst-4", "--ploha-0", 4.5, "natpisi i mjerne jedinice"),
    ("--tekst-4", "--ploha-1", 4.5, "natpisi na podignutom polju"),
    ("--hes-tekst", "--ploha-0", 4.5, "naglasak kao tekst"),
    ("--hes-tekst", "--ploha-1", 4.5, "naglasak kao tekst na polju"),
    ("--hes-tekst", "--ploha-2", 4.5, "naglasak kao tekst na kartici"),
    ("--hes-na-plohi", "--hes-ploha", 4.5, "tekst na gumbu naglaska"),
    ("--na-stanju", "--ploha-2", 3.0, "oznaka Na stanju"),
    ("--opasnost", "--ploha-0", 4.5, "poruka greske"),
    ("--opasnost", "--ploha-2", 4.5, "greska u obrascu"),
    ("--sjaj", "--ploha-0", 3.0, "isticanje cijene (krupno)"),
]


def provjeri_kontrast():
    naslov("3. Kontrast (WCAG AA)")
    teme = procitaj_tokene()

    for tema in ("tamna", "svijetla"):
        print("  {}:".format(tema))
        paleta = teme[tema]
        for tekst_token, ploha_token, prag, opis in PAROVI:
            if tekst_token not in paleta or ploha_token not in paleta:
                continue
            izmjereno = omjer(paleta[tekst_token], paleta[ploha_token])
            tvrdnja(izmjereno >= prag,
                    "  {:<34s} {:.2f}:1  (min {:.1f})".format(opis, izmjereno, prag),
                    "{} {} na {} {}".format(tekst_token, paleta[tekst_token],
                                            ploha_token, paleta[ploha_token]))


# ======================================================================
# ======================================================================
# 4.  Sidra
# ======================================================================
STRANICE = {
    "index.html": "/",
    "webshop.html": "/webshop",
    "najam-alata.html": "/najam-alata",
}

# Stranica proizvoda ima 59 i generira ih scripts/stranice.mjs, pa se popis
# gradi iz mape umjesto da se prepisuje. Rucni popis bi zaostao vec kod prvog
# novog artikla, a zaostali popis izgleda isto kao provjera koja prolazi.
for _put in sorted(glob.glob(os.path.join(KORIJEN, "proizvodi", "*.html"))):
    _ime = os.path.relpath(_put, KORIJEN).replace(os.sep, "/")
    STRANICE[_ime] = "/" + _ime[:-len(".html")]


def provjeri_sidra():
    """Svako sidro mora imati odrediste, a sidra naslovnice moraju biti '/#x'.

    hes-structure.md §3.1 ovo zove build-critical, i s razlogom: s /webshop
    poveznica '#kontakt' ne vodi nikamo jer na toj stranici nema tog odjeljka.
    Greska je tiha — klik naprosto ne ucini nista — pa je se lako previdi sve
    dok je netko ne prijavi.
    """
    naslov("4. Sidra")

    idevi = {}
    sadrzaj = {}
    for datoteka in STRANICE:
        put = os.path.join(KORIJEN, datoteka)
        if not os.path.exists(put):
            continue
        with open(put, encoding="utf-8") as dat:
            html = dat.read()
        sadrzaj[datoteka] = html
        idevi[datoteka] = set(re.findall(r'\sid="([^"]+)"', html))

    if not sadrzaj:
        print("  (preskoceno — stranice jos ne postoje)")
        return

    idevi_naslovnice = idevi.get("index.html", set())

    for datoteka, html in sadrzaj.items():
        # Sidra unutar iste stranice
        lokalna = set(re.findall(r'\shref="#([^"]+)"', html))
        nepostojeca = sorted(lokalna - idevi[datoteka])
        tvrdnja(not nepostojeca,
                f"{datoteka}: sva sidra unutar stranice postoje",
                "nema odredista: " + ", ".join("#" + s for s in nepostojeca))

        # Sidra na naslovnicu
        prema_naslovnici = set(re.findall(r'\shref="/#([^"]+)"', html))
        nepostojeca = sorted(prema_naslovnici - idevi_naslovnice)
        tvrdnja(not nepostojeca,
                f"{datoteka}: sva sidra prema naslovnici postoje",
                "nema odredista na index.html: " + ", ".join("/#" + s for s in nepostojeca))

    # Odjeljci kataloga NE smiju koristiti golo '#sidro' za odjeljke koji
    # postoje samo na naslovnici — to je tocno greska koju dokumentacija
    # izdvaja kao najcescu.
    samo_na_naslovnici = idevi_naslovnice - set().union(
        *[idevi[d] for d in sadrzaj if d != "index.html"] or [set()])
    for datoteka, html in sadrzaj.items():
        if datoteka == "index.html":
            continue
        lokalna = set(re.findall(r'\shref="#([^"]+)"', html))
        pogresna = sorted(lokalna & samo_na_naslovnici)
        tvrdnja(not pogresna,
                f"{datoteka}: nema golih sidara na odjeljke naslovnice",
                "treba '/#x' umjesto '#x': " + ", ".join("#" + s for s in pogresna))


def glavno():
    provjeri_pisma()
    provjeri_njemacki_bez_eszetta()
    provjeri_kontrast()
    provjeri_sidra()

    print("\n" + "=" * 60)
    print("proslo: {}   palo: {}".format(len(prosli), len(pali)))
    if pali:
        print("\nPALO:")
        for opis in pali:
            print("  - " + opis.strip())
        sys.exit(1)
    print("sve provjere prolaze")


if __name__ == "__main__":
    glavno()
