#!/usr/bin/env python3
"""
fontovi.py — gradi web fontove za HES iz izvornih datoteka na disku.

Zasto ovaj korak uopce postoji: obje licencirane datoteke imaju rupe koje
hrvatski i njemacki tekst pogadaju u svakoj drugoj rijeci.

  Neue Regrade (variable TTF, wght 300-800)  nema  c-acute  C-acute  d-crtano  D-crtano
  Monr         (staticki CFF OTF)            nema  jos i    c-caron  C-caron

Uz to nijedan od njih nema tabularne brojke — sirine znamenki idu od 293 do
674 jedinice — a stranica prikazuje 75 cijena u dvije tablice. Bez izjednacenih
sirina se decimalni zarezi ne poklapaju ni u jednom stupcu.

Skripta radi tri stvari i nista vise:
  1. dogradi znakove koji nedostaju, slaganjem iz dijelova koji vec postoje
     u fontu (osnovno slovo + akcent, odnosno crtica skalirana u precku),
  2. izjednaci sirine znamenki i njihove varijacije po osi tezine,
  3. suzi na stvarno koristene znakove i spremi kao woff2.

Pokretanje:  python scripts/fontovi.py
Provjera:    python scripts/provjere.py
"""

import os
import sys

from fontTools.ttLib import TTFont, newTable
from fontTools.ttLib.tables._g_l_y_f import Glyph, GlyphComponent, GlyphCoordinates
from fontTools.ttLib.tables import ttProgram
from fontTools.ttLib.tables.TupleVariation import TupleVariation
from fontTools.varLib import instancer
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools import subset

KORIJEN = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IZVOR = r"C:/Users/Ivan/Desktop/fontovi"
IZLAZ = os.path.join(KORIJEN, "assets", "fonts")

REGRADE_IN = os.path.join(IZVOR, "Neue-Regrade", "Neue-Regrade-Variable-BF65af35d87b6a7.ttf")
MONR_IN = os.path.join(IZVOR, "Monr", "monr.otf")


# --------------------------------------------------------------------------
# Znakovni skup
# --------------------------------------------------------------------------
# Sve sto tri jezika, imena kategorija i 75 naziva artikala mogu sadrzavati.
# Nabrojano je eksplicitno: subsetter tiho preskoci ono cega u fontu nema, pa
# bi "sva latinica" prikrila upravo rupe zbog kojih ova skripta postoji.
ZNAKOVI = (
    "".join(chr(c) for c in range(0x20, 0x7F))
    + "\u010c\u010d\u0106\u0107\u0110\u0111\u0160\u0161\u017d\u017e"   # hrvatski
    + "\u00c4\u00e4\u00d6\u00f6\u00dc\u00fc\u00df"                     # njemacki
    + "\u00c0\u00c1\u00c2\u00c8\u00c9\u00ca\u00cd\u00d3\u00d4\u00da"
    + "\u00e0\u00e1\u00e2\u00e8\u00e9\u00ea\u00ed\u00f3\u00f4\u00fa"
    + "\u00d1\u00f1\u00c7\u00e7"
    + "\u20ac\u2013\u2014\u2026\u00b7\u00d7\u00b1\u00a7\u00a9"
    + "\u00ab\u00bb\u201e\u201c\u201d\u2018\u2019"
    + "\u00a0\u202f\u2011"
)

# Znakovi koje izvorna pisma nemaju i koji se zato NE koriste na stranici.
# Popis stoji ovdje da bi provjere.py mogao objasniti zasto nesto pada,
# umjesto da netko za pola godine pokusa "popraviti" font.
#
#   U+00B0 stupanj        \u2014 nema ga u Regradeu; stranica nema temperatura
#   U+2192 strelica       \u2014 nema je ni u jednom; raspon datuma se pise
#                           en-crticom ("12.09. \u2013 15.09."), sto je ionako
#                           ispravnija hrvatska tipografija
#   U+00DF eszett         \u2014 nema ga u Regradeu i nije slozivo iz dijelova;
#                           njemacki tekst se pise bez njega
IZBJEGAVAJ = {0x00B0: "stupanj", 0x2192: "strelica udesno", 0x00DF: "eszett"}


def kodne_tocke():
    return sorted({ord(z) for z in ZNAKOVI})


# --------------------------------------------------------------------------
# Zajednicki alat
# --------------------------------------------------------------------------
def tinta_na_visini(font, ime_glifa, y, koraka=24):
    """x-rasponi u kojima glif ima tintu na visini y.

    Sluzi za pronalazak okomite haste u  d  i  D : precka mora presjeci hastu,
    a njezin polozaj se razlikuje medu fontovima — u Monru su  d  i  D  isti
    unikamerni oblik. Racunanje iz obrisa je pouzdanije od upisane konstante
    koja bi tiho promasila cim se izvorna datoteka zamijeni.
    """
    skup = font.getGlyphSet()
    pero = DecomposingRecordingPen(skup)
    skup[ime_glifa].draw(pero)

    obrisi, tekuci = [], []

    def kubna(p0, p1, p2, p3, n=koraka):
        izlaz = []
        for i in range(1, n + 1):
            t = i / n
            izlaz.append(tuple(
                (1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b
                + 3 * (1 - t) * t * t * c + t ** 3 * d
                for a, b, c, d in zip(p0, p1, p2, p3)))
        return izlaz

    def kvadratna(p0, p1, p2, n=max(2, koraka // 2)):
        izlaz = []
        for i in range(1, n + 1):
            t = i / n
            izlaz.append(tuple(
                (1 - t) ** 2 * a + 2 * (1 - t) * t * b + t * t * c
                for a, b, c in zip(p0, p1, p2)))
        return izlaz

    for op, arg in pero.value:
        if op == "moveTo":
            if tekuci:
                obrisi.append(tekuci)
            tekuci = [arg[0]]
        elif op == "lineTo":
            tekuci.append(arg[0])
        elif op == "curveTo":
            tekuci.extend(kubna(tekuci[-1], *arg))
        elif op == "qCurveTo":
            tocke = list(arg)
            if tocke[-1] is None or not tekuci:
                continue
            p = tekuci[-1]
            for i in range(len(tocke) - 1):
                kontrola = tocke[i]
                if i + 1 == len(tocke) - 1:
                    sljedeca = tocke[i + 1]
                else:
                    sljedeca = tuple((a + b) / 2 for a, b in zip(tocke[i], tocke[i + 1]))
                tekuci.extend(kvadratna(p, kontrola, sljedeca))
                p = sljedeca
        elif op == "closePath" and tekuci:
            obrisi.append(tekuci)
            tekuci = []
    if tekuci:
        obrisi.append(tekuci)

    presjeci = []
    for obris in obrisi:
        for i in range(len(obris)):
            x1, y1 = obris[i]
            x2, y2 = obris[(i + 1) % len(obris)]
            if (y1 <= y < y2) or (y2 <= y < y1):
                presjeci.append(x1 + (y - y1) * (x2 - x1) / (y2 - y1))
    presjeci.sort()
    return [(presjeci[i], presjeci[i + 1]) for i in range(0, len(presjeci) - 1, 2)]


def sredina(glif):
    return (glif.xMin + glif.xMax) / 2


def upisi_u_cmap(font, kodna, ime):
    for podtablica in font["cmap"].tables:
        if podtablica.isUnicode():
            podtablica.cmap[kodna] = ime


def razred_u_gdef(font, ime, razred=1):
    if "GDEF" not in font:
        return
    tablica = font["GDEF"].table
    if getattr(tablica, "GlyphClassDef", None):
        tablica.GlyphClassDef.classDefs[ime] = razred


# --------------------------------------------------------------------------
# Tabularne znamenke
# --------------------------------------------------------------------------
def tabularne_znamenke(font, varijabilan):
    """Izjednaci sirine svih deset znamenki na najsiru i centriraj obrise.

    Kod varijabilnog fonta nije dovoljno prepisati hmtx: sirina se po osi
    tezine mijenja kroz phantom tocke u gvaru. Ako se i one ne izjednace,
    brojke se poklapaju na 300 a razilaze na 800 — sto je gore od pocetnog
    stanja, jer izgleda kao greska a ne kao svojstvo pisma.
    """
    cmap = font.getBestCmap()
    glyf = font["glyf"]
    hmtx = font["hmtx"]
    imena = [cmap[ord(z)] for z in "0123456789"]

    cilj = max(hmtx[ime][0] for ime in imena)
    najsira = max(imena, key=lambda ime: hmtx[ime][0])

    for ime in imena:
        glif = glyf[ime]
        glif.recalcBounds(glyf)
        sirina_obrisa = glif.xMax - glif.xMin
        novi_lsb = round((cilj - sirina_obrisa) / 2)
        pomak = novi_lsb - glif.xMin
        if pomak and glif.numberOfContours > 0:
            glif.coordinates.translate((pomak, 0))
            glif.recalcBounds(glyf)
        hmtx[ime] = (cilj, glif.xMin)

    if not varijabilan:
        return cilj

    gvar = font["gvar"]
    uzorci = {tuple(sorted(z.axes.items())): z
              for z in gvar.variations.get(najsira, [])}
    for ime in imena:
        if ime == najsira:
            continue
        for zapis in gvar.variations.get(ime, []):
            kljuc = tuple(sorted(zapis.axes.items()))
            if kljuc not in uzorci:
                continue
            uzor = uzorci[kljuc].coordinates
            # phantom tocke na kraju: [-4] lijeva, [-3] desna (= napredovanje)
            zapis.coordinates[-4] = uzor[-4]
            zapis.coordinates[-3] = uzor[-3]
    return cilj


# --------------------------------------------------------------------------
# Neue Regrade — varijabilni TTF, novi znakovi kao slozeni glifovi
# --------------------------------------------------------------------------
def dodaj_slozeni(font, ime, dijelovi, napredovanje, uzor_gvar):
    """Slozeni glif iz niza (ime_dijela, dx, dy, skala_x, skala_y).

    gvar se prepisuje s uzora iste strukture. Bez toga bi novi glif ostao
    zaledjen na tezini 300 dok mu se osnovno slovo deblja do 800.
    """
    glyf = font["glyf"]
    glif = Glyph()
    glif.numberOfContours = -1
    glif.components = []
    for ime_dijela, dx, dy, sx, sy in dijelovi:
        dio = GlyphComponent()
        dio.glyphName = ime_dijela
        dio.x = int(round(dx))
        dio.y = int(round(dy))
        dio.flags = 0
        if (sx, sy) != (1.0, 1.0):
            dio.transform = [[sx, 0.0], [0.0, sy]]
        glif.components.append(dio)

    glyf.glyphs[ime] = glif
    font.setGlyphOrder(font.getGlyphOrder() + [ime])
    glyf.glyphOrder = font.getGlyphOrder()
    glif.recalcBounds(glyf)
    font["hmtx"][ime] = (napredovanje, glif.xMin)

    if "gvar" in font and uzor_gvar:
        novi = []
        for zapis in font["gvar"].variations.get(uzor_gvar, []):
            koord = [(0, 0)] * len(glif.components) + list(zapis.coordinates[-4:])
            novi.append(TupleVariation(dict(zapis.axes), koord))
        if novi:
            font["gvar"].variations[ime] = novi


def gradi_regrade():
    print("Neue Regrade")
    font = TTFont(REGRADE_IN)

    # Os 'ital' ide 0-12 umjesto uobicajenih 0-1, pa bi je preglednik na
    # `font-style: italic` postavio na 1 i dobio gotovo uspravno pismo.
    # Dizajn koristi tezinu, ne nagib, pa se os prikiva na 0 i mice.
    font = instancer.instantiateVariableFont(font, {"ital": 0}, inplace=True)
    print("   os 'ital' prikovana na 0, ostaje wght 300-800")

    glyf = font["glyf"]
    hmtx = font["hmtx"]

    sredina_akuta = sredina(glyf["acute"])

    # Font akcent ne centrira nego ga naginje udesno. Odmak se cita iz
    # postojecih parova umjesto da se pogada: mala slova iz o/oacute,
    # velika iz O/Oacute.
    def odmak_akuta(osnovno, s_akutom):
        dio = next(k for k in glyf[s_akutom].components if k.glyphName == "acute")
        return (dio.x + sredina_akuta) - sredina(glyf[osnovno])

    odmak_malo = odmak_akuta("o", "oacute")
    odmak_veliko = odmak_akuta("O", "Oacute")

    x_cacute = sredina(glyf["c"]) + odmak_malo - sredina_akuta
    x_cacute_veliko = sredina(glyf["C"]) + odmak_veliko - sredina_akuta

    dodaj_slozeni(font, "cacute",
                  [("c", 0, 0, 1.0, 1.0), ("acute", x_cacute, -160, 1.0, 1.0)],
                  hmtx["c"][0], "ccaron")
    dodaj_slozeni(font, "Cacute",
                  [("C", 0, 0, 1.0, 1.0), ("acute", x_cacute_veliko, 0, 1.0, 1.0)],
                  hmtx["C"][0], "Ccaron")
    print("   cacute  akcent x={:.0f} y=-160  (odmak iz oacute: {:+.0f})".format(
        x_cacute, odmak_malo))
    print("   Cacute  akcent x={:.0f} y=0     (odmak iz Oacute: {:+.0f})".format(
        x_cacute_veliko, odmak_veliko))

    # Precka za d / D. Gradi se iz 'hyphen' skaliranog po sirini, a ne kao
    # nacrtani pravokutnik: crtica ima vlastite gvar delte pa se precka
    # zadeblja zajedno s ostatkom pisma.
    crtica = glyf["hyphen"]
    debljina = crtica.yMax - crtica.yMin

    def geometrija_precke(osnovno, visina_presjeka, prekoracenje):
        potezi = tinta_na_visini(font, osnovno, visina_presjeka)
        x0, x1 = potezi[0]                     # lijeva hasta; kod  d  i jedina
        sirina = (x1 - x0) + 2 * prekoracenje
        sx = sirina / (crtica.xMax - crtica.xMin)
        dx = (x0 - prekoracenje) - crtica.xMin * sx
        return sx, dx, x0, x1

    # d: precka sjece uzlazni potez iznad x-visine (x-visina 500, verzal 700)
    sx_d, dx_d, d_x0, d_x1 = geometrija_precke("d", 600, 53)
    y_d = 570
    dodaj_slozeni(font, "dcroat",
                  [("d", 0, 0, 1.0, 1.0),
                   ("hyphen", dx_d, y_d - crtica.yMin, sx_d, 1.0)],
                  hmtx["d"][0], "d")
    print("   dcroat  hasta {:.0f}-{:.0f}, precka {} jedinica na y={}".format(
        d_x0, d_x1, debljina, y_d))

    # D: precka sjece lijevu hastu na pola verzalne visine
    sx_D, dx_D, D_x0, D_x1 = geometrija_precke("D", 350, 57)
    y_D = 350 - debljina // 2
    dodaj_slozeni(font, "Dcroat",
                  [("D", 0, 0, 1.0, 1.0),
                   ("hyphen", dx_D, y_D - crtica.yMin, sx_D, 1.0)],
                  hmtx["D"][0], "D")
    print("   Dcroat  hasta {:.0f}-{:.0f}, precka {} jedinica na y={}".format(
        D_x0, D_x1, debljina, y_D))

    # Trotocje. Regrade ga nema, a `text-overflow: ellipsis` ga umece sam cim
    # se dugacak naziv artikla skrati u uskoj ladici kosarice — bez njega bi
    # se na tom jednom znaku promijenio rez pisma. Slaganje iz tri tocke je
    # upravo ono sto trotocje i jest.
    napredovanje_tocke = hmtx["period"][0]
    dodaj_slozeni(font, "ellipsis",
                  [("period", 0, 0, 1.0, 1.0),
                   ("period", napredovanje_tocke, 0, 1.0, 1.0),
                   ("period", napredovanje_tocke * 2, 0, 1.0, 1.0)],
                  napredovanje_tocke * 3, "period")
    print("   ellipsis  tri tocke, korak {} jedinica".format(napredovanje_tocke))

    for kodna, ime in ((0x0107, "cacute"), (0x0106, "Cacute"),
                       (0x0111, "dcroat"), (0x0110, "Dcroat"),
                       (0x2026, "ellipsis")):
        upisi_u_cmap(font, kodna, ime)
        razred_u_gdef(font, ime)

    sirina = tabularne_znamenke(font, varijabilan=True)
    print("   znamenke izjednacene na {} jedinica, phantom delte prepisane".format(sirina))
    return font


# --------------------------------------------------------------------------
# Monr — staticki CFF; pretvara se u glyf pa se znakovi grade kao obicni glifovi
# --------------------------------------------------------------------------
def cff_u_glyf(font, dopusteno_odstupanje=0.6):
    """CFF (kubne krivulje) -> glyf (kvadratne).

    Novi znakovi se grade spajanjem obrisa, a to je u glyfu izravno dok bi u
    CFF-u znacilo rucno sastavljanje charstringova. Na velicinama na kojima se
    Monr koristi — verzalni natpisi od 11 do 13 px — razlika kubne i kvadratne
    aproksimacije nije vidljiva.
    """
    redoslijed = font.getGlyphOrder()
    skup = font.getGlyphSet()

    glyf = newTable("glyf")
    glyf.glyphOrder = redoslijed
    glyf.glyphs = {}
    for ime in redoslijed:
        pero = TTGlyphPen(skup)
        skup[ime].draw(Cu2QuPen(pero, dopusteno_odstupanje, reverse_direction=True))
        glyf.glyphs[ime] = pero.glyph()

    font["glyf"] = glyf
    font["loca"] = newTable("loca")

    # TTGlyphPen ne racuna okvire; ostatak skripte ih cita odmah (centriranje
    # akcenta, trazenje haste), pa se racunaju sada a ne pri spremanju.
    for ime in redoslijed:
        glyf.glyphs[ime].recalcBounds(glyf)

    maxp = font["maxp"]
    maxp.tableVersion = 0x00010000
    for polje, vrijednost in (("maxZones", 1), ("maxTwilightPoints", 0),
                              ("maxStorage", 0), ("maxFunctionDefs", 0),
                              ("maxInstructionDefs", 0), ("maxStackElements", 0),
                              ("maxSizeOfInstructions", 0),
                              ("maxComponentElements", 0), ("maxComponentDepth", 0)):
        setattr(maxp, polje, vrijednost)

    font["head"].indexToLocFormat = 0
    font["post"].formatType = 3.0
    font.sfntVersion = "\x00\x01\x00\x00"

    # AAT tablice (morx/feat/kern u Apple formatu) nemaju smisla bez CFF-a i
    # preglednici ih ionako ignoriraju.
    for suvisna in ("CFF ", "VORG", "morx", "feat", "FFTM", "kern"):
        if suvisna in font:
            del font[suvisna]
    return font


def obrisi_u_dijelovima(glyf, ime_glifa):
    """Razlozi glif na (tocke, zastavice) po obrisu."""
    glif = glyf[ime_glifa]
    if glif.numberOfContours <= 0:
        return []
    koordinate, krajevi, _ = glif.getCoordinates(glyf)
    zastavice = list(glif.flags)
    dijelovi, pocetak = [], 0
    for kraj in krajevi:
        dijelovi.append((list(koordinate[pocetak:kraj + 1]),
                         zastavice[pocetak:kraj + 1]))
        pocetak = kraj + 1
    return dijelovi


def akcent_iz(glyf, ime_glifa, prag):
    """Obrisi iznad praga + njihov okvir.

    Monr nema zasebne glifove akcenata — ni 'acute' ni 'caron' — pa se akcent
    vadi iz gotovog slova (aacute, scaron) odbacivanjem osnovnog oblika ispod
    praga.
    """
    gornji = [(tocke, zastavice) for tocke, zastavice in obrisi_u_dijelovima(glyf, ime_glifa)
              if tocke and min(t[1] for t in tocke) >= prag]
    if not gornji:
        return [], None
    sve = [t for tocke, _ in gornji for t in tocke]
    okvir = (min(t[0] for t in sve), min(t[1] for t in sve),
             max(t[0] for t in sve), max(t[1] for t in sve))
    return gornji, okvir


def sastavi_glif(font, ime, osnovno, dodatni_obrisi, dx, dy, napredovanje):
    """Novi obicni glif: obrisi osnovnog slova + pomaknuti obrisi ukrasa."""
    glyf = font["glyf"]
    tocke, zastavice, krajevi = [], [], []

    for obris_tocke, obris_zastavice in obrisi_u_dijelovima(glyf, osnovno):
        tocke.extend(obris_tocke)
        zastavice.extend(obris_zastavice)
        krajevi.append(len(tocke) - 1)

    for obris_tocke, obris_zastavice in dodatni_obrisi:
        tocke.extend((x + dx, y + dy) for x, y in obris_tocke)
        zastavice.extend(obris_zastavice)
        krajevi.append(len(tocke) - 1)

    glif = Glyph()
    glif.numberOfContours = len(krajevi)
    glif.coordinates = GlyphCoordinates(
        [(int(round(x)), int(round(y))) for x, y in tocke])
    glif.flags = bytearray(zastavice)
    glif.endPtsOfContours = krajevi
    glif.program = ttProgram.Program()
    glif.program.fromBytecode(b"")

    glyf.glyphs[ime] = glif
    font.setGlyphOrder(font.getGlyphOrder() + [ime])
    glyf.glyphOrder = font.getGlyphOrder()
    glif.recalcBounds(glyf)
    font["hmtx"][ime] = (napredovanje, glif.xMin)


def gradi_monr():
    print("\nMonr")
    font = TTFont(MONR_IN)
    cff_u_glyf(font)
    print("   CFF pretvoren u glyf")

    glyf = font["glyf"]
    hmtx = font["hmtx"]

    akut, okvir_akuta = akcent_iz(glyf, "aacute", 730)
    karon, okvir_karona = akcent_iz(glyf, "scaron", 730)
    if not akut or not karon:
        sys.exit("   GRESKA: akcent se ne da izdvojiti iz aacute / scaron")

    def postavi_akcent(ime, osnovno, obrisi, okvir, izvorno_slovo):
        """Ukras nad novo slovo ide istim odmakom koji font vec koristi."""
        sredina_ukrasa = (okvir[0] + okvir[2]) / 2
        odmak = sredina_ukrasa - sredina(glyf[izvorno_slovo])
        dx = (sredina(glyf[osnovno]) + odmak) - sredina_ukrasa
        sastavi_glif(font, ime, osnovno, obrisi, dx, 0, hmtx[osnovno][0])

    # Monr je unikamerno pismo: 'c' i 'C' su isti oblik s istim metrikama.
    # Svejedno se grade zasebni glifovi kako bi cmap ostao doslovan.
    postavi_akcent("cacute", "c", akut, okvir_akuta, "a")
    postavi_akcent("Cacute", "C", akut, okvir_akuta, "a")
    postavi_akcent("ccaron", "c", karon, okvir_karona, "s")
    postavi_akcent("Ccaron", "C", karon, okvir_karona, "s")
    print("   cacute, Cacute, ccaron, Ccaron slozeni iz aacute / scaron")

    # Precka za d / D. Monr je vrlo tezak i unikameran — d i D su isti oblik —
    # pa precka ide preko lijevog poteza, na pola visine, kao kod  D .
    crtica = glyf["hyphen"]
    obrisi_crtice = obrisi_u_dijelovima(glyf, "hyphen")

    for ime, osnovno in (("dcroat", "d"), ("Dcroat", "D")):
        potezi = tinta_na_visini(font, osnovno, 350)
        x0, x1 = potezi[0]
        prekoracenje = 45
        cilj_sirina = (x1 - x0) + 2 * prekoracenje
        sx = cilj_sirina / (crtica.xMax - crtica.xMin)
        skalirani = [([(x * sx, y) for x, y in tocke], zastavice)
                     for tocke, zastavice in obrisi_crtice]
        dx = (x0 - prekoracenje) - crtica.xMin * sx
        sastavi_glif(font, ime, osnovno, skalirani, dx, 0, hmtx[osnovno][0])
        print("   {}  potez {:.0f}-{:.0f}, precka siroka {:.0f} jedinica".format(
            ime, x0, x1, cilj_sirina))

    for kodna, ime in ((0x0107, "cacute"), (0x0106, "Cacute"),
                       (0x010D, "ccaron"), (0x010C, "Ccaron"),
                       (0x0111, "dcroat"), (0x0110, "Dcroat")):
        upisi_u_cmap(font, kodna, ime)

    sirina = tabularne_znamenke(font, varijabilan=False)
    print("   znamenke izjednacene na {} jedinica".format(sirina))
    return font


# --------------------------------------------------------------------------
def normaliziraj_gvar(font):
    """gvar.variations pretvori u obican rjecnik s unosom za svaki glif.

    fontTools ga cita lijeno, a subsetter ocekuje kljuc za svaki zadrzani glif
    — ukljucujuci .notdef, koji varijacije nikad nema. Bez ovoga suzavanje
    pukne s KeyError cim se u font doda ijedan novi glif.
    """
    if "gvar" not in font:
        return
    gvar = font["gvar"]
    postojece = dict(gvar.variations)
    gvar.variations = {ime: postojece.get(ime, []) for ime in font.getGlyphOrder()}


def suzi(font, ime_obitelji):
    normaliziraj_gvar(font)
    opcije = subset.Options()
    opcije.layout_features = ["*"]
    opcije.name_IDs = ["*"]
    opcije.name_legacy = True
    opcije.notdef_outline = True
    opcije.recalc_bounds = True
    opcije.drop_tables += ["DSIG"]
    rezac = subset.Subsetter(options=opcije)
    rezac.populate(unicodes=kodne_tocke())
    rezac.subset(font)

    for zapis in font["name"].names:
        if zapis.nameID in (1, 4, 16):
            zapis.string = ime_obitelji
        elif zapis.nameID == 6:
            zapis.string = ime_obitelji.replace(" ", "")
    return font


def spremi(font, putanja):
    os.makedirs(os.path.dirname(putanja), exist_ok=True)
    font.flavor = "woff2"
    font.save(putanja)
    return os.path.getsize(putanja)


def glavno():
    for putanja in (REGRADE_IN, MONR_IN):
        if not os.path.exists(putanja):
            sys.exit("GRESKA: izvorni font nije na ocekivanom mjestu: " + putanja)

    regrade = suzi(gradi_regrade(), "HES Regrade")
    velicina = spremi(regrade, os.path.join(IZLAZ, "hes-regrade.woff2"))
    print("\n-> assets/fonts/hes-regrade.woff2   {:.1f} kB   varijabilan, wght 300-800".format(
        velicina / 1024))

    monr = suzi(gradi_monr(), "HES Monr")
    velicina = spremi(monr, os.path.join(IZLAZ, "hes-monr.woff2"))
    print("-> assets/fonts/hes-monr.woff2      {:.1f} kB   staticki".format(velicina / 1024))


if __name__ == "__main__":
    glavno()
