#!/usr/bin/env python3
"""
loxone-trgovina.py — skida fotografije proizvoda s Loxoneove trgovine.

Izlaz:
  assets/loxone-trgovina/<HES id>/NN-<ime>.jpg   290 fotografija za 59 artikala

Izvor je data/loxone-trgovina.json: za svaki artikl pise njegova stranica u
trgovini, mapa iz koje su fotografije uzete i puni URL svake datoteke. Taj je
popis sastavljen jednom, citanjem stranica trgovine, i drzi se u repozitoriju
kao zapis o tome odakle je sto doslo.

Zasto skripta uopce postoji kad su fotografije vec u repozitoriju: bez nje se
mapa ne bi mogla obnoviti ako se izgubi, a URL-ovi bi bili mrtav popis. Ovako
je `assets/loxone-trgovina/` u svakom trenutku provjerljiv prema izvoru.

Preskace ono sto vec ima, pa se moze pokrenuti i samo za popunjavanje rupa.
Za ponovno skidanje svega ide `--force`.

Redoslijed u imenu (`01-`, `02-`) je redoslijed galerije na stranici u
trgovini: prva je ona koju trgovina drzi kao glavnu. Taj poredak nosi
scripts/proizvodi.mjs dalje u galeriju na stranici proizvoda, pa se imena ne
smiju preimenovati.

Pokretanje:  python scripts/loxone-trgovina.py
             python scripts/loxone-trgovina.py --force
"""

import concurrent.futures
import json
import os
import sys
import urllib.request

KORIJEN = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POPIS = os.path.join(KORIJEN, "data", "loxone-trgovina.json")
IZLAZ = os.path.join(KORIJEN, "assets", "loxone-trgovina")
PRISILNO = "--force" in sys.argv

# pim.loxone.com posluzuje slike i bez zaglavlja, ali s njima se ponasa kao
# prema pregledniku koji dolazi sa stranice trgovine.
ZAGLAVLJA = {
    "User-Agent": "Mozilla/5.0",
    "Referer": "https://shop.loxone.com/",
}

# Vise od desetak istovremenih skidanja ne ubrzava nista, a pim zna prekinuti
# vezu; 290 datoteka ovako prode u pola minute.
USPOREDNIH = 12


def skini(zadatak):
    url, cilj = zadatak
    if not PRISILNO and os.path.exists(cilj) and os.path.getsize(cilj) > 0:
        return ("vec", cilj, os.path.getsize(cilj))
    try:
        with urllib.request.urlopen(
            urllib.request.Request(url, headers=ZAGLAVLJA), timeout=60
        ) as odgovor:
            podaci = odgovor.read()
    except Exception as greska:
        return ("greska", cilj, f"{greska} :: {url}")

    # Tek kad je citavo tijelo u ruci — polovicna datoteka na disku bi se pri
    # iducem pokretanju preskocila kao gotova.
    with open(cilj, "wb") as datoteka:
        datoteka.write(podaci)
    return ("ok", cilj, len(podaci))


def glavno():
    with open(POPIS, encoding="utf-8") as datoteka:
        popis = json.load(datoteka)

    zadaci = []
    for pid, artikl in popis["proizvodi"].items():
        mapa = os.path.join(IZLAZ, pid)
        os.makedirs(mapa, exist_ok=True)
        for stavka in artikl["datoteke"]:
            zadaci.append((stavka["url"], os.path.join(mapa, stavka["ime"])))

    with concurrent.futures.ThreadPoolExecutor(max_workers=USPOREDNIH) as izvrsitelj:
        ishodi = list(izvrsitelj.map(skini, zadaci))

    skinuto = sum(1 for stanje, _, _ in ishodi if stanje == "ok")
    postojalo = sum(1 for stanje, _, _ in ishodi if stanje == "vec")
    palo = [(cilj, poruka) for stanje, cilj, poruka in ishodi if stanje == "greska"]
    bajtova = sum(velicina for stanje, _, velicina in ishodi if stanje != "greska")

    print(f"Fotografije s shop.loxone.com{' (ponovno sve)' if PRISILNO else ''}")
    print("")
    print(
        f"  {len(popis['proizvodi'])} artikala · {skinuto} skinuto, "
        f"{postojalo} vec bilo · {bajtova / 1048576:.1f} MB"
    )

    for cilj, poruka in palo:
        print(f"  PAD  {os.path.relpath(cilj, KORIJEN)}  {poruka}")

    print("")
    print("-> assets/loxone-trgovina/")

    # Nepotpuna mapa je gora od prazne: scripts/proizvodi.mjs bi galeriju
    # sastavio od onoga sto zatekne i nista ne bi prijavio.
    if palo:
        sys.exit(1)


if __name__ == "__main__":
    glavno()
