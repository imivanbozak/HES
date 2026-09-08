/**
 * proizvodi-tekst.mjs — proza za stranice proizvoda.
 *
 * Ovdje stoji sve sto katalog ne zna: opis, znacajke, tehnicki podaci i
 * kataloski broj. Cijena, stanje, galerija i kosarica NE stoje ovdje — njih
 * puni js/proizvod.js iz assets/katalog.json u trenutku prikaza, pa prepisana
 * cijena u ovoj datoteci ne bi bila drugi izvor nego drugi odgovor.
 *
 * IZVOR
 * -----
 * LOXONE-PROIZVODI.md u korijenu, preuzet sa shop.loxone.com i uparen s
 * katalogom po kataloskom broju. Nista ovdje nije izmisljeno; sve se moze
 * provjeriti u toj datoteci ili na stranici proizvoda navedenoj u njoj.
 *
 * PRIJEVOD
 * --------
 * Loxoneov engleski tekst je reklamni. hes-style.md zabranjuje jezik koristi,
 * superlative i tvrdnje o brzini, sigurnosti i ustedi, pa se pri prijevodu
 * izbacuju: "ultimate tool", "brilliant sound", "impresses with", "perfect",
 * "absolutely maintenance-free", "up to 80% less cabling effort", "high
 * delay-free transmission speed" i slicno. Ostaje ono sto se da provjeriti —
 * brojevi, sucelja, dimenzije, namjena.
 *
 * Imperijalne mjere se izostavljaju (stranica je hrvatska), decimalni zarez
 * i znak × se koriste dosljedno.
 *
 * PRAZNINE
 * --------
 * Loxone za 16 artikala ne objavljuje popis znacajki. Kod njih `znacajke`
 * ostaje prazan niz i generator preskace cijeli blok — ne popunjava ga
 * izmisljenim recenicama.
 *
 * `znak` je oznaka suradnje ispod cijene: "apple-home", "airplay", "dali-2"
 * ili null. Nosi je samo 7 artikala kod kojih je Loxone stvarno prikazuje.
 */
export const TEKST = {

  /* ================================================================== */
  /* Miniserveri                                                         */
  /* ================================================================== */
  "1433": {
    broj: "100335",
    opis: "Loxone Miniserver je središnja jedinica za automatizaciju privatnih domova, poslovnih prostora i namjenskih primjena. Kao upravljačka jedinica za automatizaciju doma i zgrade, s nizom sučelja na samom uređaju, pokriva većinu zadaća u pogledu sigurnosti, udobnosti i energetske učinkovitosti.",
    znacajke: [
      "8 digitalnih ulaza",
      "4 analogna ulaza",
      "8 digitalnih relejnih izlaza, beznaponskih",
      "Loxone Link: do 30 proširenja",
      "Loxone Tree: do 50 Tree uređaja",
      "LAN sučelje",
    ],
    tehnicki: [
      { naziv: "Napon napajanja", vrijednost: "19,2 – 30 V DC" },
      { naziv: "Dimenzije (D×Š×V)", vrijednost: "157 × 88 × 57 mm" },
      { naziv: "Širina u ormariću", vrijednost: "9 modula" },
    ],
    znak: "apple-home",
  },

  "1438": {
    broj: "100512",
    opis: "Miniserver Compact je izvedba miniservera u manjem kućištu, namijenjena manjim razvodnim ormarićima. Air, Tree i Tree Turbo tehnologija ugrađene su u uređaj, a uz njih i softver Audioservera.",
    znacajke: [
      "4 digitalna ulaza",
      "2 digitalna relejna izlaza, beznaponska",
      "Loxone Link, softverski prebaciv na Tree: do 30 proširenja ili 50 Tree uređaja",
      "Loxone Tree: do 50 Tree uređaja",
      "Loxone Tree Turbo: do 10 Tree Turbo uređaja",
      "Loxone Air: do 128 Air uređaja",
    ],
    tehnicki: [
      { naziv: "Dimenzije (D×Š×V)", vrijednost: "106,4 × 88 × 59 mm" },
      { naziv: "Širina u ormariću", vrijednost: "6 modula" },
      { naziv: "Obavezni dodatak", vrijednost: "SMA antena 868 MHz — Air sučelje radi samo s priključenom antenom" },
    ],
    znak: "apple-home",
  },

  "1441": {
    broj: "100336",
    opis: "Miniserver Go upravlja i automatizira funkcije u objektu bez razvodnog ormarića i bez dodatnog ožičenja, pa se koristi kod naknadne ugradnje i obnove. Primjenjuje se u privatnim domovima, poslovnim prostorima i namjenskim primjenama.",
    znacajke: [
      "Loxone Air: do 128 Air uređaja",
      "Loxone Link: do 30 proširenja",
    ],
    tehnicki: [
      { naziv: "Napon napajanja", vrijednost: "4,4 – 5,25 V DC, priloženo micro USB napajanje" },
      { naziv: "Dimenzije (D×Š×V)", vrijednost: "90 × 90 × 20 mm" },
    ],
    znak: "apple-home",
  },

  /* ================================================================== */
  /* Proširenja                                                          */
  /* ================================================================== */
  "1444": {
    broj: "100218",
    opis: "Tree proširenje širi miniserver i omogućuje uključivanje uređaja opremljenih Loxone Tree tehnologijom.",
    znacajke: [
      "Dva Tree priključka za do 50 uređaja po grani",
      "Linijska, zvjezdasta i razgranata topologija ožičenja",
      "Mogućnost ažuriranja",
      "Ugrađena dijagnostička funkcija",
      "Šifrirana komunikacija",
    ],
    tehnicki: [
      { naziv: "Napon napajanja", vrijednost: "9 – 28 V DC" },
      { naziv: "Dimenzije (D×Š×V)", vrijednost: "88 × 35,4 × 57 mm" },
      { naziv: "Širina u ormariću", vrijednost: "2 modula" },
    ],
    znak: null,
  },

  "1447": {
    broj: "100114",
    opis: "Air base proširenje širi miniserver i omogućuje uključivanje uređaja opremljenih Loxone Air bežičnom tehnologijom.",
    znacajke: [
      "Veza s do 128 Air uređaja",
      "SMA priključak s štapnom antenom 1,8 dBi",
      "Šifrirana komunikacija",
      "Mesh topologija: svaki Air uređaj trajno spojen na napajanje proširuje domet",
      "Mogućnost ažuriranja",
      "Za naknadnu ugradnju bez dodatnog ožičenja",
    ],
    tehnicki: [
      { naziv: "Napon napajanja", vrijednost: "9 – 28 V DC" },
      { naziv: "Dimenzije (D×Š×V)", vrijednost: "88 × 35,4 × 57 mm" },
      { naziv: "Širina u ormariću", vrijednost: "2 modula" },
    ],
    znak: null,
  },

  "1451": {
    broj: "100038",
    opis: "Relejno proširenje daje 14 izlaza s beznaponskim relejima. Uz miniserver služi za upravljanje zasjenjenjem, osvjetljenjem, grijanjem, alarmnim sustavima i drugim trošilima.",
    znacajke: [],
    tehnicki: [
      { naziv: "Napon napajanja", vrijednost: "18 – 28 V DC" },
      { naziv: "Izlazi", vrijednost: "14 digitalnih relejnih izlaza, beznaponskih" },
      { naziv: "Opteretivost kontakta", vrijednost: "250 V AC 16 A pri cos fi = 1 (IEC) · maks. 30 V DC 16 A" },
      { naziv: "Ukupno opterećenje proširenja", vrijednost: "maks. 48 A (IEC)" },
      { naziv: "Dimenzije (D×Š×V)", vrijednost: "158 × 88 × 59 mm" },
    ],
    znak: null,
  },

  "1455": {
    broj: "100029",
    opis: "Dimer proširenje daje 4 izlaza za prigušivanje mrežnih rasvjetnih tijela.",
    znacajke: [
      "4 prigušiva izlaza",
      "8 digitalnih ulaza",
      "Za omska, kapacitivna i induktivna trošila",
    ],
    tehnicki: [
      { naziv: "Napon napajanja", vrijednost: "18 – 28 V DC" },
      { naziv: "Dimenzije (D×Š×V)", vrijednost: "158 × 88 × 59 mm" },
    ],
    znak: null,
  },

  "1459": {
    broj: "100283",
    opis: "DI proširenje daje 20 digitalnih ulaza.",
    znacajke: [
      "Za sklopke, tipkala i druge senzore",
      "Može se koristiti i kao brojilo frekvencije za signale do 250 Hz",
    ],
    tehnicki: [
      { naziv: "Napon napajanja", vrijednost: "9 – 28 V DC" },
      { naziv: "Dimenzije (D×Š×V)", vrijednost: "88 × 35,4 × 57 mm" },
      { naziv: "Širina u ormariću", vrijednost: "2 modula" },
    ],
    znak: null,
  },

  "1463": {
    broj: "100014",
    opis: "1-Wire proširenje omogućuje uključivanje 1-Wire senzora, primjerice temperaturnih senzora ili iButton čitača.",
    znacajke: [
      "Za do 20 senzora ili 1 iButton čitač",
      "Za neograničen broj iButton ključeva",
    ],
    tehnicki: [
      { naziv: "Napon napajanja", vrijednost: "9 – 28 V DC" },
      { naziv: "Dimenzije (D×Š×V)", vrijednost: "88 × 35,4 × 57 mm" },
      { naziv: "Širina u ormariću", vrijednost: "2 modula" },
    ],
    znak: null,
  },

  "1467": {
    broj: "100124",
    opis: "Modbus proširenje omogućuje uključivanje uređaja s Modbus RTU sučeljem, primjerice plinskih, električnih, vodenih i energetskih brojila. Time se prikupljaju podaci o potrošnji za upravljanje energijom.",
    znacajke: [
      "Najviše 32 uređaja, ukupno najviše 253 senzora",
      "Podesiva brzina prijenosa i paritet",
      "Tipovi podataka: 16 i 32 bita",
      "Ciklus očitanja do 1 s (0,1 s)",
    ],
    tehnicki: [
      { naziv: "Napon napajanja", vrijednost: "9 – 28 V DC" },
      { naziv: "Dimenzije (D×Š×V)", vrijednost: "88 × 35,4 × 57 mm" },
      { naziv: "Širina u ormariću", vrijednost: "2 modula" },
    ],
    znak: null,
  },

  "1470": {
    broj: "100200",
    opis: "DALI je standardizirano žično sučelje za rasvjetu koje podržava velik broj proizvođača i rasvjetnih tijela. DALI proširenje uključuje takve proizvode u Loxone sustav i upravlja s do 64 DALI uređaja.",
    znacajke: [
      "Do 64 DALI uređaja u 16 grupa",
      "Duljina voda do 300 m",
      "Podržava DALI tipove uređaja 0 – 8",
      "Podržava DALI-2 tipove instanci 1 – 4",
      "Ugrađeno DALI napajanje, isključivo",
      "DALI-2 certificirano",
      "Podržava DALI broadcast način rada",
    ],
    tehnicki: [
      { naziv: "Napon napajanja", vrijednost: "12 – 28 V DC" },
    ],
    znak: null,
  },

  "1474": {
    broj: "100623",
    opis: "DALI je standardizirano žično sučelje za rasvjetu koje podržava velik broj proizvođača i rasvjetnih tijela. Ova izvedba DALI proširenja upravlja s do 10 DALI uređaja.",
    znacajke: [
      "Do 10 DALI uređaja u 16 grupa",
      "Duljina voda do 300 m",
      "Podržava DALI tipove uređaja 0 – 8",
      "Podržava DALI-2 tipove instanci 1 – 4",
      "Ugrađeno isključivo napajanje",
      "Potpuna konfiguracija u Loxone Configu",
      "DALI-2 certificirano",
      "Podržava DALI broadcast način rada",
    ],
    tehnicki: [
      { naziv: "DALI uređaji", vrijednost: "maks. 10 uređaja u 16 grupa" },
      { naziv: "Duljina sabirnice", vrijednost: "maks. 300 m pri 1,5 mm^2" },
      { naziv: "Topologija sabirnice", vrijednost: "linijska, zvjezdasta, razgranata" },
      { naziv: "Napon sabirnice", vrijednost: "visoki 16 V, niski 0 V (tip.)" },
      { naziv: "Napajanje sabirnice", vrijednost: "zajamčeno 240 mA, maks. 250 mA" },
    ],
    znak: "dali-2",
  },

  "1478": {
    broj: "100471",
    opis: "AI proširenje ima 4 ulaza za analogne naponske signale, primjerice 0 – 10 V ili digitalne, te 4 analogna ulaza za strujne signale 0/4 – 20 mA.",
    znacajke: [
      "Namijenjeno primjeni u industrijskim projektima",
      "4 naponska signala, diferencijalna: ulaz 0 – 15 V",
      "4 strujna signala, pasivna: ulaz 0/4 – 20 mA",
      "Za očitanje analognih senzora svih vrsta",
    ],
    tehnicki: [
      { naziv: "Dimenzije (D×Š×V)", vrijednost: "88 × 35,4 × 57 mm" },
      { naziv: "Širina u ormariću", vrijednost: "2 modula" },
    ],
    znak: null,
  },

  "1482": {
    broj: "100382",
    opis: "AO proširenje daje 4 analogna izlaza 0 – 10 V za prijenos analognih upravljačkih signala. Koristi se za upravljanje grijalicama, elektroničkim prigušnicama, pumpama i sličnim trošilima.",
    znacajke: [
      "Trenutna struja izlaza: maks. 20 mA",
      "Trajna struja izlaza: maks. 10 mA",
      "Razlučivost: 0,1 V",
    ],
    tehnicki: [
      { naziv: "Napon napajanja", vrijednost: "14 – 28 V DC" },
      { naziv: "Dimenzije (D×Š×V)", vrijednost: "88 × 35,4 × 57 mm" },
      { naziv: "Širina u ormariću", vrijednost: "2 modula" },
      { naziv: "Napomena", vrijednost: "Riječ je o upravljačkom signalu; analogni izlaz smije se opteretiti s najviše 20 mA." },
    ],
    znak: null,
  },

  "1487": {
    broj: "100322",
    opis: "KNX proširenje omogućuje uključivanje uređaja s KNX sučeljem.",
    znacajke: [
      "Za do 500 KNX grupnih adresa",
      "Šalje i prima grupne adrese različitih tipova podataka",
      "Duljina voda do KNX napajanja: maks. 350 m",
      "Duljina voda do prvog KNX uređaja: maks. 700 m",
      "Ukupna duljina KNX sabirnice: maks. 1000 m",
    ],
    tehnicki: [
      { naziv: "Napon napajanja", vrijednost: "10 – 28 V DC" },
      { naziv: "Dimenzije (D×Š×V)", vrijednost: "88 × 35,4 × 57 mm" },
      { naziv: "Širina u ormariću", vrijednost: "2 modula" },
      { naziv: "Napomena", vrijednost: "KNX sabirnica traži vlastito KNX/EIB napajanje." },
    ],
    znak: null,
  },

  "1512": {
    broj: "100011",
    opis: "RS485 proširenje omogućuje uključivanje uređaja s RS485 sučeljem, primjerice klimatizacijskih i ventilacijskih sustava te sustava kontrole pristupa otiskom prsta.",
    znacajke: [
      "Za najviše 32 uređaja",
      "Duljina voda do 1200 m",
      "Podesiva brzina prijenosa i paritet",
    ],
    tehnicki: [
      { naziv: "Napon napajanja", vrijednost: "9 – 28 V DC" },
      { naziv: "Dimenzije (D×Š×V)", vrijednost: "88 × 35,4 × 57 mm" },
      { naziv: "Širina u ormariću", vrijednost: "2 modula" },
    ],
    znak: null,
  },

  /* ================================================================== */
  /* Osvjetljenje                                                        */
  /* ================================================================== */
  "1491": {
    broj: "100330",
    opis: "LED spot RGBW Tree je ugradbeni spot koji spaja svjetlo u boji i toplo bijelo svjetlo. Upravljanje i prigušivanje idu izravno preko Tree sučelja.",
    znacajke: [
      "Usmjereno toplo bijelo svjetlo",
      "Difuzno svjetlo u boji",
      "Spotovi se vode pojedinačno ili u grupama",
      "Dijagnostika ožičenja pri ugradnji",
    ],
    tehnicki: [
      { naziv: "Napon napajanja", vrijednost: "21,6 – 25,2 V DC" },
      { naziv: "Kut snopa", vrijednost: "RGBW 120 stupnjeva, toplo bijelo 38 stupnjeva" },
      { naziv: "Temperatura boje", vrijednost: "tip. 3000 K (toplo bijelo)" },
      { naziv: "Svjetlosni tok", vrijednost: "tip. 525 lm (toplo bijelo)" },
      { naziv: "Vanjski promjer okvira", vrijednost: "86 mm" },
      { naziv: "Dubina ugradnje", vrijednost: "40 mm" },
      { naziv: "Promjer otvora", vrijednost: "68 – 72 mm" },
    ],
    znak: null,
  },

  "1497": {
    broj: "100286",
    opis: "LED stropna svjetiljka RGBW Air spaja svjetlo u boji i toplo bijelo svjetlo, a ima ugrađen detektor pokreta i senzor osvijetljenosti. Upravljanje i prigušivanje idu izravno preko Air sučelja.",
    znacajke: [
      "Homogena svjetleća površina",
      "Ugradnja pomoću osigurača od pada i magneta",
      "Jedna svjetiljka pokriva do 20 m^2 — za urede, spremišta, kupaonice i sanitarne prostorije",
    ],
    tehnicki: [
      { naziv: "Napon napajanja", vrijednost: "220 – 240 V AC, 50 Hz" },
      { naziv: "Kut detekcije, vodoravno", vrijednost: "360 stupnjeva" },
      { naziv: "Kut detekcije, okomito", vrijednost: "110 stupnjeva" },
      { naziv: "Temperatura boje", vrijednost: "tip. 3000 K (toplo bijelo)" },
      { naziv: "Svjetlosni tok", vrijednost: "tip. 1350 lm (toplo bijelo)" },
      { naziv: "Dimenzije (promjer × visina)", vrijednost: "297 × 52 mm" },
    ],
    znak: null,
  },

  "1502": {
    broj: "200098",
    opis: "RGBW LED traka za rasvjetu i svjetlosne naglaske u prostoru. Isporučuje se u duljini od 5 metara.",
    znacajke: [
      "300 LED čipova na 5 metara",
      "Ljepljiva traka s donje strane za pričvršćivanje",
      "Vodljivi putovi izvedeni za otpornost na presavijanje i odvod topline",
      "Skraćuje se na svakih 6 LED-ova, odnosno svakih 10 cm",
    ],
    tehnicki: [
      { naziv: "Napon napajanja", vrijednost: "24 V DC" },
      { naziv: "Kut snopa", vrijednost: "120 stupnjeva" },
      { naziv: "Temperatura boje", vrijednost: "toplo bijelo 3300 K ± 200 K" },
      { naziv: "Duljina", vrijednost: "5 m" },
      { naziv: "Stupanj zaštite", vrijednost: "IP20" },
    ],
    znak: null,
  },

  "1505": {
    broj: "100550",
    opis: "Stolna svjetiljka Air daje prigušivo toplo bijelo svjetlo, a napaja se preko USB-C priključka i ugrađene punjive baterije.",
    znacajke: [
      "Toplo bijelo svjetlo",
      "Konfigurabilni RGB prsten na vrhu",
      "Uključuje se u svjetlosne ugođaje",
      "3 kapacitivna tipkala sa slobodno dodijeljenom funkcijom",
      "Baterija od 10.000 mAh za višednevni rad",
    ],
    tehnicki: [
      { naziv: "Napon napajanja", vrijednost: "5 V DC preko USB-C" },
      { naziv: "Kapacitet baterije", vrijednost: "10.000 mAh" },
      { naziv: "Kut snopa", vrijednost: "170 stupnjeva" },
      { naziv: "Temperatura boje", vrijednost: "tip. 3000 K" },
      { naziv: "Svjetlosni tok", vrijednost: "tip. 230 lm (spojen USB, puna baterija)" },
      { naziv: "Dimenzije (promjer × visina)", vrijednost: "100 × 320 mm" },
    ],
    znak: null,
  },

  "1508": {
    broj: "100274",
    opis: "LED viseća svjetiljka Pendulum Slim RGBW spaja svjetlo u boji i toplo bijelo svjetlo. Za upravljanje i prigušivanje potreban je PWM dimer, primjerice Loxone RGBW 24 V dimer.",
    znacajke: [
      "Svjetlo u boji i toplo bijelo svjetlo u jednom tijelu",
      "Prigušivanje preko PWM dimera",
    ],
    tehnicki: [
      { naziv: "Napon napajanja", vrijednost: "21,6 – 25,2 V DC" },
      { naziv: "Kut snopa", vrijednost: "RGB 120 stupnjeva, toplo bijelo 38 stupnjeva" },
      { naziv: "Temperatura boje", vrijednost: "tip. 3000 K (toplo bijelo)" },
      { naziv: "Svjetlosni tok", vrijednost: "tip. 975 lm (toplo bijelo)" },
      { naziv: "Dimenzije svjetiljke (duljina × promjer)", vrijednost: "300 × 60 mm" },
      { naziv: "Dimenzije baldahina (duljina × promjer)", vrijednost: "60 × 80 mm" },
    ],
    znak: null,
  },

  /* ================================================================== */
  /* Upravljanje osvjetljenjem                                           */
  /* ================================================================== */
  "1684": {
    broj: "100239",
    opis: "RGBW 24 V dimer Tree ima 4 PWM izlaza za prigušivanje niskonaponskih LED rasvjetnih tijela.",
    znacajke: [
      "4 PWM izlaza",
      "Za RGB ili RGBW upravljanje bojom svjetla, ili kao zasebni kanali s 50 W po kanalu pri 24 V DC",
      "Duljina voda do LED-a: maks. 30 m",
    ],
    tehnicki: [
      { naziv: "Napon napajanja", vrijednost: "12 – 28 V DC" },
      { naziv: "Izlazi", vrijednost: "4 PWM izlaza, maks. 2,1 A po kanalu" },
      { naziv: "Snaga", vrijednost: "100 W pri 12 V · 200 W pri 24 V" },
      { naziv: "Duljina voda do LED-a", vrijednost: "maks. 30 m" },
    ],
    znak: null,
  },

  "1689": {
    broj: "100125",
    opis: "RGBW 24 V dimer Air ima 4 PWM izlaza za prigušivanje niskonaponskih LED rasvjetnih tijela, a povezuje se bežično preko Loxone Air sučelja.",
    znacajke: [
      "4 PWM izlaza",
      "Za RGB ili RGBW upravljanje bojom svjetla, ili kao zasebni kanali s 50 W po kanalu pri 24 V DC",
      "Duljina voda do LED-a: maks. 30 m",
    ],
    tehnicki: [
      { naziv: "Napon napajanja", vrijednost: "12 – 28 V DC" },
      { naziv: "Izlazi", vrijednost: "4 PWM izlaza, maks. 2,1 A po kanalu" },
      { naziv: "Snaga", vrijednost: "100 W pri 12 V · 200 W pri 24 V" },
      { naziv: "Duljina voda do LED-a", vrijednost: "maks. 30 m" },
    ],
    znak: null,
  },

  "1693": {
    broj: "100212",
    opis: "Nano dimer Air ima jedan izlaz za prigušivanje mrežnih rasvjetnih tijela i ugrađuje se u podžbuknu ili šupljinsku kutiju.",
    znacajke: [
      "Za naknadnu ugradnju rasvjete bez novog ožičenja",
      "Fazni dimer s rezanjem prednjeg i stražnjeg boka, jedan kanal",
      "Tipkalo Touch ili Touch Pure za Nano dodaje se utaknuto",
    ],
    tehnicki: [
      { naziv: "Napon napajanja", vrijednost: "220 – 240 V AC, 50/60 Hz" },
      { naziv: "Izlazi", vrijednost: "jedan kanal, fazni dimer s rezanjem prednjeg i stražnjeg boka" },
      { naziv: "Dimenzije pakiranja (D×Š×V)", vrijednost: "95 × 88 × 33 mm" },
    ],
    znak: null,
  },

  "1697": {
    broj: "100153",
    opis: "Nano IO Air ima 2 relejna izlaza i 6 digitalnih ulaza i ugrađuje se u podžbuknu ili šupljinsku kutiju. Koristi se za naknadno uključivanje zasjenjenja, osvjetljenja i drugih trošila.",
    znacajke: [
      "2 relejna izlaza i 6 digitalnih ulaza",
      "Za ugradnju u podžbuknu kutiju",
      "Tipkalo Touch, Touch Pure ili NFC Code Touch za Nano dodaje se utaknuto",
    ],
    tehnicki: [
      { naziv: "Napon napajanja", vrijednost: "110 – 230 V AC, 50/60 Hz ili 20 – 26 V DC" },
      { naziv: "Dimenzije (D×Š×V)", vrijednost: "53 × 52 × 29 mm" },
    ],
    znak: null,
  },

  /* ================================================================== */
  /* Doticajni uređaji i tipkala                                         */
  /* ================================================================== */
  "1700": {
    broj: "100517",
    opis: "Touch Pure Tree CO2 ima pet dodirnih polja na staklenoj prednjoj strani za upravljanje osnovnim funkcijama u prostoriji. Dodir tipke potvrđuje se zvučnim klikom. Ugrađeni senzor mjeri temperaturu, relativnu vlagu i udio CO_2. Orijentacijsko svjetlo označava uređaj u mraku.",
    znacajke: [],
    tehnicki: [
      { naziv: "Napon napajanja", vrijednost: "9 – 30 V DC" },
      { naziv: "Preporučena visina montaže", vrijednost: "135 cm" },
      { naziv: "Dimenzije (D×Š×V)", vrijednost: "90 × 90 × 16 mm" },
    ],
    znak: null,
  },

  "1702": {
    broj: "100463",
    opis: "Touch Pure Air ima pet dodirnih polja na staklenoj prednjoj strani za upravljanje osnovnim funkcijama u prostoriji. Dodir tipke potvrđuje se zvučnim klikom.",
    znacajke: [
      "Upravlja osvjetljenjem, zasjenjenjem, audiom i drugim funkcijama",
      "Ugrađeni senzor temperature i vlage za regulaciju klime u prostoriji",
      "Ugrađeno orijentacijsko svjetlo",
      "Povezivanje preko Loxone Air sučelja",
    ],
    tehnicki: [
      { naziv: "Napon napajanja", vrijednost: "6 – 30 V DC ili 2 × 1,5 V AAA baterije" },
      { naziv: "Trajanje baterije", vrijednost: "do 2 godine" },
      { naziv: "Preporučena visina montaže", vrijednost: "135 cm" },
      { naziv: "Dimenzije (D×Š×V)", vrijednost: "90 × 90 × 16 mm" },
    ],
    znak: null,
  },

  "1706": {
    broj: "100661",
    opis: "Touch Pure za Nano je modul koji se utakne u Nano IO Air ili Nano Dimmer Air. Ima pet dodirnih polja na staklenoj prednjoj strani za upravljanje osnovnim funkcijama u prostoriji. Dodir tipke potvrđuje se zvučnim klikom, a orijentacijsko svjetlo označava uređaj u mraku.",
    znacajke: [],
    tehnicki: [
      { naziv: "Napajanje", vrijednost: "preko Nano IO Air ili Nano Dimmer Air" },
      { naziv: "Preporučena visina montaže", vrijednost: "135 cm" },
      { naziv: "Dimenzije (D×Š×V)", vrijednost: "90 × 90 × 23 mm" },
    ],
    znak: null,
  },

  "1709": {
    broj: "100675",
    opis: "Touch Pure Flex ima do 12 dodirnih polja čiji se raspored i funkcija određuju pri narudžbi. Izbornici, vrijednosti, tekst i stanja prikazuju se na ugrađenom LED matričnom zaslonu uz tri statusne LED diode. Ugrađeni senzor mjeri temperaturu i relativnu vlagu, a ugrađena rasvjeta omogućuje rukovanje pri slabom svjetlu.",
    znacajke: [],
    tehnicki: [
      { naziv: "Preporučena visina montaže", vrijednost: "135 cm" },
      { naziv: "Dimenzije (D×Š×V)", vrijednost: "90 × 90 × 16 mm" },
      { naziv: "Napomena", vrijednost: "Uređaj se izrađuje po narudžbi, pa se ne može zamijeniti ni vratiti. Rok isporuke je oko dva tjedna od narudžbe." },
    ],
    znak: null,
  },

  "1712": {
    broj: "100221",
    opis: "Touch Tree ima pet dodirnih polja za upravljanje osnovnim funkcijama u prostoriji. Dodir tipke potvrđuje se zvučnim klikom. Ugrađeni senzor mjeri temperaturu i relativnu vlagu.",
    znacajke: [],
    tehnicki: [
      { naziv: "Preporučena visina montaže", vrijednost: "135 cm" },
      { naziv: "Dimenzije (D×Š×V)", vrijednost: "80 × 80 × 10 mm" },
    ],
    znak: null,
  },

  "1715": {
    broj: "100155",
    opis: "Touch Air ima pet dodirnih polja za upravljanje osnovnim funkcijama u prostoriji. Dodir tipke potvrđuje se zvučnim klikom. Ugrađeni senzor mjeri temperaturu i relativnu vlagu.",
    znacajke: [],
    tehnicki: [
      { naziv: "Napajanje", vrijednost: "baterija CR2450" },
      { naziv: "Preporučena visina montaže", vrijednost: "135 cm" },
      { naziv: "Dimenzije (D×Š×V)", vrijednost: "80 × 80 × 10 mm" },
    ],
    znak: null,
  },

  "1718": {
    broj: "100481",
    opis: "NFC Code Touch Tree je uređaj za kontrolu pristupa s NFC čitačem i osvijetljenom brojčanom tipkovnicom na staklenoj prednjoj strani.",
    znacajke: [
      "S Loxone Intercomom čini cjelinu za kontrolu pristupa",
      "Upravljanje korisnicima, i na više lokacija",
      "Primjenjuje se i za evidenciju radnog vremena, ormariće, obračun i zapisivanje događaja",
    ],
    tehnicki: [
      { naziv: "Napon napajanja", vrijednost: "9 – 28 V DC" },
      { naziv: "Načini identifikacije", vrijednost: "NFC, brojčani kod" },
      { naziv: "Preporučena visina montaže", vrijednost: "135 cm" },
      { naziv: "Dimenzije (D×Š×V)", vrijednost: "90 × 90 × 16 mm" },
    ],
    znak: null,
  },

  "1722": {
    broj: "100483",
    opis: "NFC Code Touch Air je uređaj za kontrolu pristupa s NFC čitačem i osvijetljenom brojčanom tipkovnicom na staklenoj prednjoj strani, povezan bežično preko Loxone Air sučelja.",
    znacajke: [
      "S Loxone Intercomom čini cjelinu za kontrolu pristupa",
      "Upravljanje korisnicima na svim lokacijama",
      "Primjenjuje se i za evidenciju radnog vremena, ormariće, obračun i zapisivanje događaja",
    ],
    tehnicki: [
      { naziv: "Napon napajanja", vrijednost: "9 – 28 V DC ili 2 × 1,5 V AAA baterije" },
      { naziv: "Načini identifikacije", vrijednost: "NFC, brojčani kod" },
      { naziv: "Preporučena visina montaže", vrijednost: "135 cm" },
      { naziv: "Dimenzije (D×Š×V)", vrijednost: "90 × 90 × 16 mm" },
    ],
    znak: null,
  },

  "1726": {
    broj: "100624",
    opis: "Remote Air je bežični daljinski upravljač za audio, zasjenjenje i osvjetljenje. Tipke se konfiguriraju u aplikaciji.",
    znacajke: [
      "Postavljanje kroz aplikaciju",
      "Za audio, zasjenjenje i osvjetljenje",
      "Zasebne tipke za upravljanje audiom",
      "Tipke sa slobodno dodijeljenom funkcijom",
      "Haptička povratna informacija",
      "Funkcija napuštanja prostorije",
    ],
    tehnicki: [],
    znak: null,
  },

  /* ================================================================== */
  /* Senzori                                                             */
  /* ================================================================== */
  "1729": {
    broj: "100466",
    opis: "Senzor pokreta Tree ugrađuje se u strop i služi za detekciju prisutnosti, pokreta i osvijetljenosti.",
    znacajke: [
      "Detekcija prisutnosti, pokreta i osvijetljenosti",
      "Podloga za automatizaciju osnovnih funkcija u prostoriji",
      "Oblikom odgovara Loxone LED spotovima, pa se u stropu vidi kao isti element",
    ],
    tehnicki: [
      { naziv: "Napon napajanja", vrijednost: "9 – 30 V DC" },
      { naziv: "Preporučena visina montaže", vrijednost: "2,5 – 3,5 m" },
      { naziv: "Kut detekcije, vodoravno", vrijednost: "360 stupnjeva" },
      { naziv: "Kut detekcije, okomito", vrijednost: "110 stupnjeva" },
      { naziv: "Vanjski promjer okvira", vrijednost: "86 mm" },
      { naziv: "Dubina ugradnje", vrijednost: "40 mm" },
      { naziv: "Promjer otvora", vrijednost: "68 – 72 mm" },
    ],
    znak: null,
  },

  "1733": {
    broj: "100422",
    opis: "Senzor prisutnosti Tree služi za detekciju prisutnosti, pokreta i osvijetljenosti i podloga je za automatizaciju osnovnih funkcija u prostoriji.",
    znacajke: [],
    tehnicki: [
      { naziv: "Napon napajanja", vrijednost: "6 – 30 V DC" },
      { naziv: "Preporučena visina montaže", vrijednost: "2,5 – 3,5 m" },
      { naziv: "Kut detekcije, vodoravno", vrijednost: "360 stupnjeva" },
      { naziv: "Kut detekcije, okomito", vrijednost: "110 stupnjeva" },
      { naziv: "Dimenzije (promjer × visina)", vrijednost: "98 × 29,8 mm" },
    ],
    znak: null,
  },

  "1737": {
    broj: "100420",
    opis: "Senzor prisutnosti Air služi za detekciju prisutnosti, pokreta i osvijetljenosti i podloga je za automatizaciju osnovnih funkcija u prostoriji.",
    znacajke: [
      "Detekcija prisutnosti i pokreta",
      "Automatizacija osvjetljenja, grijanja, audia i drugih funkcija",
      "Može se koristiti kao alarmni detektor",
      "Slobodan smještaj zahvaljujući Loxone Air sučelju",
    ],
    tehnicki: [
      { naziv: "Napon napajanja", vrijednost: "9 – 30 V DC ili 2 × 1,5 V AA baterije" },
      { naziv: "Preporučena visina montaže", vrijednost: "2,5 – 3,5 m" },
      { naziv: "Kut detekcije, vodoravno", vrijednost: "360 stupnjeva" },
      { naziv: "Kut detekcije, okomito", vrijednost: "110 stupnjeva" },
      { naziv: "Dimenzije (promjer × visina)", vrijednost: "98 × 29,8 mm" },
    ],
    znak: null,
  },

  "1740": {
    broj: "100276",
    opis: "Senzor klime Tree mjeri temperaturu i vlagu te udio CO_2 kao pokazatelj kvalitete zraka u prostoriji.",
    znacajke: [],
    tehnicki: [
      { naziv: "Napon napajanja", vrijednost: "9 – 28 V DC" },
      { naziv: "Mjerno područje temperature", vrijednost: "−40 do 120 stupnjeva Celzija, odstupanje ± 0,5" },
      { naziv: "Mjerno područje vlage", vrijednost: "0 – 100 % r. v., ± 2 % (bez kondenzacije)" },
      { naziv: "Mjerno područje CO_2", vrijednost: "400 – 10.000 ppm, ± (30 ppm + 3 %), NDIR senzor" },
      { naziv: "Dimenzije s okvirom (D×Š×V)", vrijednost: "80 × 80 × 17,4 mm" },
    ],
    znak: null,
  },

  "1743": {
    broj: "100264",
    opis: "Senzor klime Air mjeri temperaturu i vlagu u prostoriji, a povezuje se bežično preko Loxone Air sučelja.",
    znacajke: [],
    tehnicki: [
      { naziv: "Napon napajanja", vrijednost: "9 – 28 V DC ili 2 × 1,5 V AAA baterije" },
      { naziv: "Mjerno područje temperature", vrijednost: "−40 do 125 stupnjeva Celzija, odstupanje ± 0,5" },
      { naziv: "Mjerno područje vlage", vrijednost: "0 – 100 % r. v., ± 2 % (bez kondenzacije)" },
      { naziv: "Dimenzije s okvirom (D×Š×V)", vrijednost: "80 × 80 × 17,4 mm" },
      { naziv: "Dimenzije samostojeće (D×Š×V)", vrijednost: "55,8 × 55,8 × 32,9 mm" },
    ],
    znak: null,
  },

  "1746": {
    broj: "100141",
    opis: "IR Control Air omogućuje uključivanje uređaja s infracrvenim sučeljem, primjerice televizora, AV prijamnika, projektora i klimatizacijskih uređaja.",
    znacajke: [],
    tehnicki: [
      { naziv: "Napon napajanja", vrijednost: "5 V DC preko micro USB priključka" },
      { naziv: "Dimenzije (D×Š×V)", vrijednost: "90 × 49 × 14 mm" },
    ],
    znak: null,
  },

  /* ================================================================== */
  /* Aktuatori i pogoni                                                  */
  /* ================================================================== */
  "1755": {
    broj: "100602",
    opis: "Motorni pogon za ventile Tree postavlja se na ventile podnog grijanja i radijatora. Standardni adapterski prstenovi omogućuju primjenu na velikom broju ventila.",
    znacajke: [
      "Povezivanje preko Loxone Tree sučelja",
      "Ispitan na više od 500.000 zatvaranja",
      "Tiho radi",
      "Niska potrošnja u pripravnosti",
      "Tipkalo sa slobodno dodijeljenom funkcijom",
    ],
    tehnicki: [
      { naziv: "Napon napajanja", vrijednost: "11 – 30 V DC" },
      { naziv: "Sila potiska", vrijednost: "150 N" },
      { naziv: "Hod", vrijednost: "5,0 mm" },
      { naziv: "Dimenzije s adapterom (D×Š×V)", vrijednost: "45 × 47,5 × 76,5 mm" },
      { naziv: "Dimenzije bez adaptera (D×Š×V)", vrijednost: "45 × 47,5 × 70 mm" },
    ],
    znak: null,
  },

  "1759": {
    broj: "100603",
    opis: "Motorni pogon za ventile Air postavlja se na ventile podnog grijanja i radijatora, a povezuje se bežično. Standardni adapterski prstenovi omogućuju primjenu na velikom broju ventila.",
    znacajke: [
      "Povezivanje preko Loxone Air sučelja",
      "Ispitan na više od 500.000 zatvaranja",
      "Tiho radi",
      "Niska potrošnja u pripravnosti",
      "Tipkalo sa slobodno dodijeljenom funkcijom",
      "Ugrađeni senzor temperature",
    ],
    tehnicki: [
      { naziv: "Napon napajanja", vrijednost: "11 – 30 V DC ili 2 × 1,5 V AA baterije" },
      { naziv: "Sila potiska", vrijednost: "100 N na bateriji, 150 N na 24 V" },
      { naziv: "Hod", vrijednost: "5,0 mm" },
      { naziv: "Dimenzije s adapterom (D×Š×V)", vrijednost: "45 × 47,5 × 76,5 mm" },
      { naziv: "Dimenzije bez adaptera (D×Š×V)", vrijednost: "45 × 47,5 × 70 mm" },
    ],
    znak: null,
  },

  "1762": {
    broj: "100290",
    opis: "Shading Actuator Air je bežični aktuator za mrežni napon. Na dva relejna izlaza priključuju se pogoni zasjenjenja, ali i druga trošila poput rasvjetnih krugova, ventilatora ili pumpi.",
    znacajke: [
      "Automatsko prepoznavanje krajnjih položaja",
      "Standardni Hirschmann konektor",
      "Povezivanje preko Loxone Air sučelja",
      "Releji od 5 A za rasvjetne krugove, pogone, ventilatore ili pumpe",
      "IP54 zaštita, i za vanjsku primjenu",
    ],
    tehnicki: [
      { naziv: "Napon napajanja", vrijednost: "110 – 230 V AC, 50/60 Hz" },
      { naziv: "Izlazi", vrijednost: "2 releja po 5 A pri cos fi = 1, ukupno opterećenje maks. 5 A" },
      { naziv: "Konektori", vrijednost: "Hirschmann STAK 3, STAS 3" },
      { naziv: "Stupanj zaštite", vrijednost: "IP54" },
      { naziv: "Dimenzije (D×Š×V)", vrijednost: "129,1 × 32,5 × 26,8 mm" },
    ],
    znak: null,
  },

  /* ================================================================== */
  /* Audio sustavi                                                       */
  /* ================================================================== */
  "1767": {
    broj: "100428",
    opis: "Audioserver je središnja audio jedinica sustava. U kućištu od 9 modula spaja procesorsku jedinicu i 4 pojačala.",
    znacajke: [
      "4 izlaza pojačala za ožičene zvučnike",
      "Proširuje se Stereo proširenjima i dodatnim Audioserverima",
      "Omogućuje višesobne audio zone",
      "Zasebna glazba u svakoj prostoriji",
      "Konfigurira se u Loxone Configu",
      "Podržava AirPlay 2, uz iOS 11.4 ili noviji",
    ],
    tehnicki: [
      { naziv: "Napon napajanja", vrijednost: "18 – 26 V DC" },
      { naziv: "Dimenzije (D×Š×V)", vrijednost: "157 × 88 × 57 mm" },
      { naziv: "Širina u ormariću", vrijednost: "9 modula" },
    ],
    znak: "airplay",
  },

  "1770": {
    broj: "100429",
    opis: "Stereo proširenje dodaje Audioserveru dva izlaza pojačala.",
    znacajke: [
      "Dva dodatna izlaza pojačala za ožičene zvučnike",
      "Omogućuje višesobne audio zone",
      "Zasebna glazba u svakoj prostoriji",
      "1 × SPDIF izlaz, digitalni električni, frekvencija uzorkovanja 48 kHz",
      "Podržava AirPlay 2, uz iOS 11.4 ili noviji",
    ],
    tehnicki: [
      { naziv: "Napon napajanja", vrijednost: "18 – 26 V DC" },
      { naziv: "Montaža", vrijednost: "okomito na DIN letvu, uz razmak za prozračivanje između uređaja" },
    ],
    znak: "airplay",
  },

  "1773": {
    broj: "610158",
    opis: "Nadogradna kutija za zvučnik Install Speaker 7 koristi se ondje gdje ugradnja u strop ili zid nije moguća, pa nisu potrebni građevinski zahvati. Odgovara izvedbama Install Speaker 7 Master, Client i Passive.",
    znacajke: [
      "Nadogradna montaža na strop i zid za zvučnik od 7 inča",
      "Bas refleksni otvor",
      "PG uvodnica za kabel",
      "Izolacijski materijal za smanjenje rezonancija",
      "Čvrsto vijčana rešetka bez vibracija",
    ],
    tehnicki: [
      { naziv: "Dimenzije (Š×V×D)", vrijednost: "400 × 400 × 120 mm" },
    ],
    znak: null,
  },

  "1776": {
    broj: "610159",
    opis: "Nadogradna kutija za zvučnik Install Speaker 10 koristi se ondje gdje ugradnja u strop ili zid nije moguća, pa nisu potrebni građevinski zahvati. Odgovara izvedbama Install Speaker 10 Master, Client i Passive.",
    znacajke: [
      "Nadogradna montaža na strop i zid za zvučnik od 10 inča",
      "Bas refleksni otvor",
      "PG uvodnica za ulaz i izlaz kabela, primjerice za Client ožičenje",
      "Izolacijski materijal za smanjenje rezonancija ugrađen u kućište",
      "Čvrsto vijčana rešetka bez vibracija",
    ],
    tehnicki: [
      { naziv: "Dimenzije (Š×V×D)", vrijednost: "500 × 500 × 140 mm" },
    ],
    znak: null,
  },

  "1516": {
    broj: "100497",
    opis: "Install Speaker 7 Passive je pasivni ugradbeni zvučnik razvijen za rad s Loxone Audioserverom. Koaksijalna izvedba daje ujednačenu razdiobu zvuka po prostoriji.",
    znacajke: [
      "Koaksijalni sustav za ujednačenu i široku razdiobu zvuka",
      "Jednodijelno kućište s manje akustički smetajućih rubova i većom površinom membrane",
      "Za unutarnje i zaštićene vanjske prostore",
      "Preporuka je jedan zvučnik na 15 m^2 prostora",
    ],
    tehnicki: [
      { naziv: "Vrsta zvučnika", vrijednost: "dvosmjerni" },
      { naziv: "Dubina ugradnje", vrijednost: "93 mm" },
      { naziv: "Promjer otvora", vrijednost: "203 mm" },
      { naziv: "Maks. debljina ploče", vrijednost: "36 mm" },
    ],
    znak: null,
  },

  "1520": {
    broj: "610149",
    opis: "Install Speaker 7 Master spaja se izravno na Audioserver ili Miniserver Compact preko Tree Turbo sučelja i prosljeđuje audio signal nizu od najviše 20 Client zvučnika.",
    znacajke: [
      "Funkcije poput pretvorbe teksta u govor, zvona, alarma i glasovnih obavijesti",
      "Reprodukcija glazbe preko Bluetootha",
      "Duljina voda do 150 m po Tree Turbo vezi",
      "Za unutarnje i zaštićene vanjske prostore",
    ],
    tehnicki: [
      { naziv: "Vrsta zvučnika", vrijednost: "dvosmjerni aktivni zvučnik" },
      { naziv: "Dubina ugradnje", vrijednost: "93 mm" },
      { naziv: "Promjer otvora", vrijednost: "203 mm" },
      { naziv: "Maks. debljina ploče", vrijednost: "36 mm" },
    ],
    znak: "airplay",
  },

  /* ================================================================== */
  /* Pametne utičnice                                                    */
  /* ================================================================== */
  "1779": {
    broj: "100115",
    opis: "Smart Socket Air je bežična sklopiva utičnica s mjerenjem temperature, snage i energije. Izvedba tipa F odgovara utičnicama sa zaštitnim kontaktom (schuko).",
    znacajke: [
      "Za očitanje i mjerenje potrošnje trošila",
      "Automatsko uključivanje i isključivanje trošila prema prisutnosti, vremenu ili nadzoru opterećenja",
      "Daljinsko upravljanje trošilima",
      "Ugrađeni senzor temperature",
      "Ugrađeno tipkalo sa slobodno dodijeljenom funkcijom",
      "Trobojne LED diode",
      "Povezivanje preko Loxone Air sučelja",
    ],
    tehnicki: [
      { naziv: "Napon napajanja", vrijednost: "110 – 230 V AC, 50/60 Hz" },
      { naziv: "Izlaz", vrijednost: "utičnica sa zaštitnim kontaktom, jednopolno sklapana bistabilnim relejem" },
      { naziv: "Ukupno opterećenje", vrijednost: "maks. 13 A (tip F)" },
      { naziv: "Mjerno područje temperature", vrijednost: "−40 do 125 stupnjeva Celzija, odstupanje ± 0,5" },
      { naziv: "Mjerno područje snage", vrijednost: "0 – 4 kW" },
      { naziv: "Dimenzije bez utikača (D×Š×V)", vrijednost: "106 × 53,8 × 29,5 mm" },
    ],
    znak: null,
  },

  "1782": {
    broj: "100119",
    opis: "Smart Socket Air je bežična sklopiva utičnica s mjerenjem temperature, snage i energije. Izvedba tipa J odgovara švicarskom standardu utičnica.",
    znacajke: [
      "Za očitanje i mjerenje potrošnje trošila",
      "Automatsko uključivanje i isključivanje trošila prema prisutnosti, vremenu ili nadzoru opterećenja",
      "Daljinsko upravljanje trošilima",
      "Ugrađeni senzor temperature",
      "Ugrađeno tipkalo sa slobodno dodijeljenom funkcijom",
      "Trobojne LED diode",
      "Povezivanje preko Loxone Air sučelja",
    ],
    tehnicki: [
      { naziv: "Napon napajanja", vrijednost: "110 – 230 V AC, 50/60 Hz" },
      { naziv: "Izlaz", vrijednost: "utičnica sa zaštitnim kontaktom, jednopolno sklapana bistabilnim relejem" },
      { naziv: "Ukupno opterećenje", vrijednost: "maks. 10 A (tip J)" },
      { naziv: "Mjerno područje temperature", vrijednost: "−40 do 125 stupnjeva Celzija, odstupanje ± 0,5" },
      { naziv: "Mjerno područje snage", vrijednost: "0 – 4 kW" },
      { naziv: "Dimenzije bez utikača (D×Š×V)", vrijednost: "106 × 53,8 × 29,5 mm" },
    ],
    znak: null,
  },

  "1786": {
    broj: "100121",
    opis: "Smart Socket Air je bežična sklopiva utičnica s mjerenjem temperature, snage i energije. Izvedba tipa G odgovara britanskom standardu utičnica.",
    znacajke: [
      "Za očitanje i mjerenje potrošnje trošila",
      "Automatsko uključivanje i isključivanje trošila prema prisutnosti, vremenu ili nadzoru opterećenja",
      "Daljinsko upravljanje trošilima",
      "Ugrađeni senzor temperature",
      "Ugrađeno tipkalo sa slobodno dodijeljenom funkcijom",
      "Trobojne LED diode",
      "Povezivanje preko Loxone Air sučelja",
    ],
    tehnicki: [
      { naziv: "Napon napajanja", vrijednost: "110 – 230 V AC, 50/60 Hz" },
      { naziv: "Izlaz", vrijednost: "utičnica sa zaštitnim kontaktom, jednopolno sklapana bistabilnim relejem" },
      { naziv: "Ukupno opterećenje", vrijednost: "maks. 13 A (tip G)" },
      { naziv: "Mjerno područje temperature", vrijednost: "−40 do 125 stupnjeva Celzija, odstupanje ± 0,5" },
      { naziv: "Mjerno područje snage", vrijednost: "0 – 4 kW" },
      { naziv: "Dimenzije bez utikača (D×Š×V)", vrijednost: "106 × 53,8 × 29,5 mm" },
    ],
    znak: null,
  },

  /* ================================================================== */
  /* Kabeli i konektori                                                  */
  /* ================================================================== */
  "1790": {
    broj: "100637",
    opis: "Tree kabel sadrži parice za istosmjerno napajanje i podatkovne vodove Tree uređaja. Uz njih nosi i paricu presjeka 1,5 mm^2 za napajanje uređaja veće snage.",
    znacajke: [
      "Za sve Tree proizvode",
      "Kartonska kutija s namotom koja sprečava uvijanje",
      "Precizno označavanje boja",
      "Metarska oznaka po duljini",
    ],
    tehnicki: [
      { naziv: "Duljina u pakiranju", vrijednost: "200 m" },
      { naziv: "Vanjski promjer", vrijednost: "7,5 mm" },
      { naziv: "Podatkovni vodovi (Tree)", vrijednost: "2 žice promjera 0,8 mm (0,5 mm^2 / AWG21), puni bakreni vodič, upredena parica, boje: zelena i zeleno-bijela" },
      { naziv: "Vodovi za uređaje male snage", vrijednost: "2 žice promjera 0,8 mm (0,5 mm^2 / AWG21), puni bakreni vodič, upredena parica, boje: narančasta i narančasto-bijela" },
      { naziv: "Vodovi za uređaje veće snage", vrijednost: "2 × 1,5 mm^2 / AWG16, fino užeti bakreni vodič, 28 žica promjera 0,245 mm, boje: narančasta i bijelo-narančasta" },
      { naziv: "Certifikat", vrijednost: "CPR razred Eca" },
    ],
    znak: null,
  },

  "1794": {
    broj: "200358",
    opis: "Zamjenske stezaljke za Loxone Tree s PUSH IN tehnikom spajanja i priključkom 2 × 4 vodiča. Pakiranje sadrži 25 komada.",
    znacajke: [],
    tehnicki: [
      { naziv: "Priključak", vrijednost: "2 × 4 vodiča" },
      { naziv: "Nazivni napon i struja", vrijednost: "150 V / 7 A" },
      { naziv: "Udarni napon", vrijednost: "1300 V AC / 1 min" },
      { naziv: "Presjek vodiča", vrijednost: "0,25 – 0,8 mm^2 / AWG23 – 18" },
      { naziv: "Duljina skidanja izolacije", vrijednost: "5 mm" },
      { naziv: "Temperaturno područje", vrijednost: "−40 do 105 stupnjeva Celzija" },
      { naziv: "Pakiranje", vrijednost: "25 komada" },
    ],
    znak: null,
  },

  "1797": {
    broj: "200406",
    opis: "Zamjenske stezaljke za Loxone Tree Turbo s PUSH IN tehnikom spajanja i priključkom 2 × 4 vodiča. Pakiranje sadrži 25 komada.",
    znacajke: [],
    tehnicki: [
      { naziv: "Priključak", vrijednost: "2 × 4 vodiča" },
      { naziv: "Nazivni napon i struja", vrijednost: "150 V / 7 A" },
      { naziv: "Udarni napon", vrijednost: "1300 V AC / 1 min" },
      { naziv: "Presjek vodiča", vrijednost: "0,25 – 0,8 mm^2 / AWG23 – 18" },
      { naziv: "Duljina skidanja izolacije", vrijednost: "5 mm" },
      { naziv: "Temperaturno područje", vrijednost: "−40 do 105 stupnjeva Celzija" },
      { naziv: "Pakiranje", vrijednost: "25 komada" },
    ],
    znak: null,
  },

  "1800": {
    broj: "000567",
    opis: "Zamjenske stezaljke za Loxone Tree s PUSH IN tehnikom spajanja i priključkom 2 × 2 vodiča, za NFC Code Touch, Touch Pure Flex i Intercom. Pakiranje sadrži 25 komada.",
    znacajke: [],
    tehnicki: [
      { naziv: "Priključak", vrijednost: "2 × 2 vodiča" },
      { naziv: "Nazivni napon i struja", vrijednost: "150 V / 7 A" },
      { naziv: "Udarni napon", vrijednost: "1300 V AC / 1 min" },
      { naziv: "Presjek vodiča", vrijednost: "0,25 – 0,8 mm^2 / AWG23 – 18" },
      { naziv: "Duljina skidanja izolacije", vrijednost: "5 mm" },
      { naziv: "Temperaturno područje", vrijednost: "−40 do 105 stupnjeva Celzija" },
      { naziv: "Odgovara uređajima", vrijednost: "NFC Code Touch, Touch Pure Flex (Tree i Air), Intercom" },
      { naziv: "Pakiranje", vrijednost: "25 komada" },
    ],
    znak: null,
  },

  /* ================================================================== */
  /* Dodatni materijali                                                  */
  /* ================================================================== */
  "1802": {
    broj: "200446",
    opis: "Šifrirane NFC kartice za kontrolu pristupa preko NFC Code Toucha. Komplet sadrži 10 kartica.",
    znacajke: [
      "Šifrirani prijenos podataka",
      "Pojedinačna dodjela prava pristupa",
      "Format kartice za novčanik",
      "Svaki pristup se bilježi i može se pratiti pojedinačno",
      "Kartice se personaliziraju i vode u Loxone Configu",
      "Uz NFC Code Touch omogućuju dvofaktorsku autentifikaciju za osjetljive prostore",
    ],
    tehnicki: [
      { naziv: "Čipset", vrijednost: "NXP MIFARE DESFire EV3 2K" },
      { naziv: "Pakiranje", vrijednost: "10 kartica" },
    ],
    znak: null,
  },

  "1805": {
    broj: "200318",
    opis: "NFC privjesci za kontrolu pristupa preko NFC Code Toucha. Komplet sadrži 10 privjesaka.",
    znacajke: [],
    tehnicki: [
      { naziv: "Čipset", vrijednost: "NXP MIFARE DESFire EV3 2K" },
      { naziv: "Domet", vrijednost: "1 – 20 mm" },
      { naziv: "Frekvencija", vrijednost: "13,56 MHz, šifrirano" },
      { naziv: "Norme", vrijednost: "ISO/IEC 14443, ISO/IEC 7816" },
      { naziv: "Šifriranje", vrijednost: "16 ili 32-bitni CRC, Common Criteria EAL4+, nasumično generiranje ključa, DES do 168 bita i AES 128 bita" },
      { naziv: "Kapacitet pohrane", vrijednost: "2048 bajtova" },
      { naziv: "Materijal", vrijednost: "PC/ABS" },
      { naziv: "Dimenzije (D×Š×V)", vrijednost: "30 × 30 × 6 mm" },
      { naziv: "Pakiranje", vrijednost: "10 privjesaka" },
    ],
    znak: null,
  },

  "1808": {
    broj: "100008",
    opis: "SD kartica s firmwareom za Miniserver Gen. 1. Zamjenom kartice miniserver dobiva najnoviji firmware i bez mrežne veze.",
    znacajke: [
      "8 GB, uključen SD adapter",
      "Ažuriranje miniservera i bez mrežne veze",
    ],
    tehnicki: [
      { naziv: "Kapacitet", vrijednost: "8 GB" },
      { naziv: "Sadržaj pakiranja", vrijednost: "microSD kartica i SD adapter" },
    ],
    znak: null,
  },
};
