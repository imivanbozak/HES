/**
 * filtri.js — filtriranje i sortiranje kataloga.
 *
 * Isti motor sluzi obje zalihe; razlikuju se samo stablom kategorija i
 * osnovom cijene. Loxone ima 11 skupina s 28 podskupina i raspon cijena 1:54,
 * pa filtriranje mora doci PRIJE popisa artikala; najam ima cetiri kategorije
 * i tu je rail visak, ali motor je isti.
 *
 * Stanje zivi u URL-u (`?skupina=senzori&marka=bosch&sort=cijena-asc`).
 * Zbog toga filtrirani pogled ima svoju adresu koja se moze poslati, tipka
 * "natrag" radi ono sto se od nje ocekuje, a hladan dolazak na takvu adresu
 * odmah nacrta pravi popis. Sve tri stvari izostanu ako stanje zivi samo u
 * memoriji.
 */

import { JEZIK } from "./jezik.js";

const ZADANO = {
  skupina: null,
  podskupina: null,
  marka: null,
  pretraga: null,
  samoNaStanju: false,
  sort: "zadano",
};

/**
 * Kljuc za usporedbu teksta: mala slova, bez dijakritike.
 *
 * Katalog je hrvatski, tipkovnica cesto nije. Tko upise "prosirenja" mora
 * dobiti "Proširenja", inace pretraga radi samo onima koji vec znaju tocan
 * naziv — a njima ne treba. Isto vrijedi za njemacki: "zubehor" nalazi
 * "Zubehör".
 *
 * NFD rastavi č, ć, š, ž i preglase na slovo i kvacicu, pa kvacica otpada.
 * Đ se ne rastavlja (nije slovo s kvacicom nego zasebno slovo) i ide rukom.
 */
function kljuc(tekst) {
  return String(tekst ?? "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const SORTOVI = {
  zadano: (a, b) => a.redoslijedIzvorni - b.redoslijedIzvorni,
  "cijena-asc": (a, b) => a.cijenaCents - b.cijenaCents,
  "cijena-desc": (a, b) => b.cijenaCents - a.cijenaCents,
  "naziv-asc": (a, b) => a.naziv.localeCompare(b.naziv, JEZIK),
};

export function stvoriFiltre({ katalog, vrsta, naPromjenu }) {
  // Zadani redoslijed iz baze pamti se kao broj, da `sort` moze natrag na
  // njega bez ponovnog dohvata.
  const sviArtikli = katalog
    .zaVrstu(vrsta)
    .map((artikl, i) => ({
      ...artikl,
      redoslijedIzvorni: i,
      /*
       * Kljuc za pretragu se racuna jednom po artiklu, ne po pritisku tipke.
       *
       * U njemu su i imena kategorija. Nazivi artikala su engleski ("Relay
       * extension", "Touch Tree"), a stranica je hrvatska i izbornik nudi
       * hrvatske skupine — tko upise "prosirenja" ocekuje sedamnaest
       * prosirenja, a ne prazan popis zato sto ta rijec ne stoji ni u jednom
       * nazivu proizvoda.
       *
       * Ulaze imena na SVIM jezicima, ne samo na jeziku stranice: posjetitelj
       * njemacke stranice koji zna hrvatski naziv skupine i dalje je nade.
       */
      kljucPretrage: kljuc(
        [
          artikl.naziv,
          artikl.sku ?? "",
          artikl.marka ?? "",
          ...artikl.kategorije.flatMap((id) => Object.values(katalog.poId.get(id)?.naziv ?? {})),
        ].join(" ")
      ),
    }));

  let stanje = { ...ZADANO, ...izUrl() };

  function izUrl() {
    const parametri = new URLSearchParams(location.search);
    const procitaj = (kljuc) => parametri.get(kljuc) || null;
    return {
      skupina: procitaj("skupina"),
      podskupina: procitaj("podskupina"),
      marka: procitaj("marka"),
      pretraga: procitaj("q"),
      samoNaStanju: parametri.get("stanje") === "1",
      sort: SORTOVI[procitaj("sort")] ? procitaj("sort") : "zadano",
    };
  }

  function uUrl() {
    const parametri = new URLSearchParams(location.search);
    const postavi = (kljuc, vrijednost) => {
      if (vrijednost) parametri.set(kljuc, vrijednost);
      else parametri.delete(kljuc);
    };
    postavi("skupina", stanje.skupina);
    postavi("podskupina", stanje.podskupina);
    postavi("marka", stanje.marka);
    postavi("q", stanje.pretraga);
    postavi("stanje", stanje.samoNaStanju ? "1" : null);
    postavi("sort", stanje.sort === "zadano" ? null : stanje.sort);

    const upit = parametri.toString();
    // replaceState, ne pushState: svaki dodir potvrdnog okvira ne treba svoj
    // korak u povijesti, inace "natrag" znaci petnaest klikova unatrag.
    history.replaceState(null, "", upit ? `${location.pathname}?${upit}` : location.pathname);
  }

  function primijeni() {
    let popis = sviArtikli;

    // Podskupina je uza od skupine, pa kad postoji, skupina se ne primjenjuje
    // dvaput.
    if (stanje.podskupina) {
      popis = popis.filter((a) => a.kategorije.includes(stanje.podskupina));
    } else if (stanje.skupina) {
      popis = popis.filter((a) => a.kategorije.includes(stanje.skupina));
    }

    if (stanje.marka) popis = popis.filter((a) => a.marka === stanje.marka);
    if (stanje.samoNaStanju) popis = popis.filter((a) => a.naStanju);

    // Vise rijeci znaci I, ne ILI: "touch tree" mora suziti na jedan artikl,
    // a ne prosiriti na sve sto ima bilo koju od dvije rijeci.
    if (stanje.pretraga) {
      const rijeci = kljuc(stanje.pretraga).split(/\s+/).filter(Boolean);
      if (rijeci.length) {
        popis = popis.filter((a) => rijeci.every((rijec) => a.kljucPretrage.includes(rijec)));
      }
    }

    return popis.slice().sort(SORTOVI[stanje.sort] ?? SORTOVI.zadano);
  }

  function javi() {
    uUrl();
    naPromjenu?.(primijeni(), { ...stanje });
  }

  return {
    get stanje() {
      return { ...stanje };
    },

    /** Svi artikli vrste, prije filtriranja — za brojeve uz kategorije. */
    get svi() {
      return sviArtikli;
    },

    rezultat: primijeni,

    postavi(promjene) {
      const prije = JSON.stringify(stanje);
      stanje = { ...stanje, ...promjene };

      // Odabir nove skupine mora ocistiti podskupinu stare, inace ostane
      // filter koji nijedan artikl ne zadovoljava i popis je prazan bez
      // vidljivog razloga.
      if ("skupina" in promjene && promjene.skupina !== stanje.podskupinaRoditelj) {
        const podskupine = promjene.skupina ? katalog.podskupine(promjene.skupina) : [];
        if (!podskupine.some((p) => p.id === stanje.podskupina)) {
          stanje.podskupina = null;
        }
      }

      // Odabir podskupine podrazumijeva njezinu skupinu.
      if (promjene.podskupina) {
        const podskupina = katalog.poId.get(promjene.podskupina);
        if (podskupina?.roditeljId) stanje.skupina = podskupina.roditeljId;
      }

      if (JSON.stringify(stanje) !== prije) javi();
    },

    ocisti() {
      stanje = { ...ZADANO };
      javi();
    },

    /** Koliko je filtera aktivno — za oznaku "Filtri · 2" na mobitelu. */
    brojAktivnih() {
      let broj = 0;
      if (stanje.skupina || stanje.podskupina) broj += 1;
      if (stanje.marka) broj += 1;
      if (stanje.pretraga) broj += 1;
      if (stanje.samoNaStanju) broj += 1;
      return broj;
    },

    /**
     * Koliko bi artikala ostalo za pojedinu kategoriju, uz ostale filtre.
     *
     * Pretraga se ovdje racuna kao i svaki drugi filtar: brojka uz kategoriju
     * mora reci koliko ce se rezultata stvarno pojaviti ako se na nju klikne.
     * Broj koji ne racuna aktivnu pretragu vodi u praznu mrezu uz natpis "17".
     */
    brojZaKategoriju(kategorijaId) {
      let popis = sviArtikli.filter((a) => a.kategorije.includes(kategorijaId));
      if (stanje.marka) popis = popis.filter((a) => a.marka === stanje.marka);
      if (stanje.samoNaStanju) popis = popis.filter((a) => a.naStanju);
      if (stanje.pretraga) {
        const rijeci = kljuc(stanje.pretraga).split(/\s+/).filter(Boolean);
        popis = popis.filter((a) => rijeci.every((rijec) => a.kljucPretrage.includes(rijec)));
      }
      return popis.length;
    },

    /** Koliko artikala vrste prolazi sve filtre osim kategorije — za "Sve". */
    brojBezKategorije() {
      let popis = sviArtikli;
      if (stanje.marka) popis = popis.filter((a) => a.marka === stanje.marka);
      if (stanje.samoNaStanju) popis = popis.filter((a) => a.naStanju);
      if (stanje.pretraga) {
        const rijeci = kljuc(stanje.pretraga).split(/\s+/).filter(Boolean);
        popis = popis.filter((a) => rijeci.every((rijec) => a.kljucPretrage.includes(rijec)));
      }
      return popis.length;
    },

    javi,
  };
}
