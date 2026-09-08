/**
 * pokret.js — otkrivanje pri skrolanju, stepenasti ulaz i raspad teksta.
 *
 * Sve je rucno: IntersectionObserver + requestAnimationFrame. Nijedna
 * biblioteka za animaciju, kao ni u ../split ni u ../imi-portfolio-netlify.
 *
 * Vazno pravilo: pocetna stanja se postavljaju IZ JAVASCRIPTA, ne u CSS-u.
 * Da `opacity: 0` stoji u stylesheetu, sadrzaj bi ostao trajno nevidljiv
 * svakome kome se modul ne ucita. Ovako je bez JS-a sve odmah vidljivo, a
 * `prefers-reduced-motion` samo znaci da se ovdje nista i ne dogodi.
 */

const smanjenPokret = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Trajanja iz tokena, da CSS i JS ne odu svaki na svoju stranu. */
function token(ime, zamjena) {
  const vrijednost = getComputedStyle(document.documentElement)
    .getPropertyValue(ime)
    .trim();
  return vrijednost || zamjena;
}

/* ------------------------------------------------------------------ */
/* Otkrivanje                                                          */
/* ------------------------------------------------------------------ */
/**
 * 12–16 px podizanja i pojavljivanje, 300–400 ms, jednom pa gotovo.
 * hes-content.md §0.3 — isti obrazac za svaki popis, mrezu i tijelo tablice.
 */
export function pokreniOtkrivanje(korijen = document) {
  if (smanjenPokret) return;

  const trajanje = token("--otkrivanje", "340ms");
  const krivulja = token("--krivulja", "cubic-bezier(0.22, 1, 0.36, 1)");
  const korak = parseInt(token("--otkrivanje-korak", "60ms"), 10) || 60;

  const pojedinacni = [...korijen.querySelectorAll("[data-otkrij]")];
  const skupine = [...korijen.querySelectorAll("[data-stepenica]")];

  const pripremi = (element, kasnjenje = 0) => {
    element.dataset.otkrivaSe = "";
    element.style.opacity = "0";
    element.style.transform = "translateY(14px)";
    element.style.transition = `opacity ${trajanje} ${krivulja}, transform ${trajanje} ${krivulja}`;
    if (kasnjenje) element.style.transitionDelay = `${kasnjenje}ms`;
  };

  /*
   * Inline stilovi se BRISU kad ulazna animacija zavrsi.
   *
   * Ovo nije uredivanje za urednost nego ispravak: `element.style.transform`
   * je inline, a inline nadjacava svako pravilo iz stylesheeta. Dok je stajao,
   * svaka otkrivena kartica je zauvijek imala `transform: none` i nijedan
   * `:hover { transform }` iz CSS-a nije radio — a kartice djelatnosti,
   * poslova, skupina, alata, pozicija i ponude sve su unutar `data-stepenica`.
   * Iz istog razloga nije radio ni pomaknuti ritam `.rad:nth-child(even)`.
   *
   * Ciscenje je idempotentno i vezano na `transitionend`, uz mjerac vremena
   * kao zastitu: ako se prijelaz nikad ne pokrene (element je sakriven, tab je
   * u pozadini), stilovi bi inace ostali zauvijek.
   */
  const ocisti = (element) => {
    if (!("otkrivaSe" in element.dataset)) return;
    delete element.dataset.otkrivaSe;
    element.style.removeProperty("opacity");
    element.style.removeProperty("transform");
    element.style.removeProperty("transition");
    element.style.removeProperty("transition-delay");
  };

  const otkrij = (element) => {
    element.style.opacity = "1";
    element.style.transform = "none";

    element.addEventListener("transitionend", () => ocisti(element), { once: true });
    const kasnjenje = parseFloat(element.style.transitionDelay) || 0;
    setTimeout(() => ocisti(element), parseFloat(trajanje) + kasnjenje + 120);
  };

  const promatrac = new IntersectionObserver(
    (unosi) => {
      for (const unos of unosi) {
        if (!unos.isIntersecting) continue;
        const cilj = unos.target;
        if (cilj.hasAttribute("data-stepenica")) {
          [...cilj.children].forEach(otkrij);
        } else {
          otkrij(cilj);
        }
        promatrac.unobserve(cilj);
      }
    },
    /*
     * `threshold` je 0, ne 0.08, i to je ispravak a ne ugadanje.
     *
     * Prag je OMJER PROMATRANOG ELEMENTA, pa za element visi od prozora
     * najveci dostizni omjer iznosi `visina prozora / visina elementa`. Mreza
     * od 59 kartica je 6000-12000 px visoka, sto taj strop spusta na
     * 0.06-0.15 — cesto ispod praga. Promatrac tada nikad ne javi presjek,
     * `otkrij` se nikad ne pozove i svih 59 kartica ostane na `opacity: 0`.
     * Tablica to nije pokazivala jer je redak visok 60 px, a kartica 380.
     *
     * Uz `rootMargin` koji dno vec skracuje za 6 %, prag 0 znaci "gornji rub
     * je presao 94 % visine prozora" — za elemente normalne visine to je
     * nekoliko piksela skrola ranije nego prije, a za visoke je razlika
     * izmedu ispravnog rada i praznog zaslona.
     */
    { threshold: 0, rootMargin: "0px 0px -6% 0px" }
  );

  for (const element of pojedinacni) {
    pripremi(element);
    promatrac.observe(element);
  }

  /*
   * Kod tablica i dugih popisa otkrivanje ide po TIJELU, ne po retku:
   * 59 redaka koji ulaze jedan za drugim pretvore se u sum, a ne u pokret.
   * Zato skupina prima jedan promatrac, a djeca samo razmaknuta kasnjenja.
   */
  for (const skupina of skupine) {
    const djeca = [...skupina.children];
    const razmak = djeca.length > 12 ? 0 : korak;
    djeca.forEach((dijete, i) => pripremi(dijete, i * razmak));
    promatrac.observe(skupina);
  }
}

/* ------------------------------------------------------------------ */
/* Raspad teksta                                                       */
/* ------------------------------------------------------------------ */
const GLITCH = "!<>-_\\/[]{}=+*^?#01x$&";

/**
 * Znak po znak iz nasumicnog skupa u pravi tekst.
 *
 * Dva detalja koja se lako promase:
 *  - jos neprikazani znakovi se ispisuju s `opacity: 0`, ne izostavljaju —
 *    inace se sirina naslova mijenja tijekom animacije i redak poskakuje,
 *  - na kraju se vraca `textContent`, pa u DOM-u ne ostaje hrpa <span>-ova
 *    koje bi citac ekrana morao prezalogajiti.
 */
export function raspad(element, tekst, gotovo) {
  const red = [];
  for (let i = 0; i < tekst.length; i += 1) {
    const pocetak = Math.floor(Math.random() * 8);
    red.push({
      u: tekst[i],
      pocetak,
      kraj: pocetak + Math.floor(Math.random() * 10) + 5,
      znak: null,
    });
  }

  let kadar = 0;
  const korak = () => {
    let izlaz = "";
    let zavrseno = 0;

    for (const stavka of red) {
      if (kadar >= stavka.kraj) {
        zavrseno += 1;
        izlaz += stavka.u;
      } else if (kadar >= stavka.pocetak) {
        if (!stavka.znak || Math.random() < 0.18) {
          stavka.znak = GLITCH[Math.floor(Math.random() * GLITCH.length)];
        }
        izlaz += `<span style="color:var(--sjaj);opacity:.85">${stavka.znak}</span>`;
      } else {
        izlaz += `<span style="opacity:0">${stavka.u}</span>`;
      }
    }

    element.innerHTML = izlaz;
    if (zavrseno === red.length) {
      element.textContent = tekst;
      gotovo?.();
      return;
    }
    kadar += 1;
    requestAnimationFrame(korak);
  };

  korak();
}

export function pokreniRaspad(korijen = document) {
  const mete = [...korijen.querySelectorAll("[data-raspad]")];
  if (!mete.length) return;

  if (smanjenPokret) {
    // Bez pokreta naslov je i dalje naslov — samo se ispise odmah.
    return;
  }

  const promatrac = new IntersectionObserver(
    (unosi) => {
      for (const unos of unosi) {
        if (!unos.isIntersecting) continue;
        const meta = unos.target;
        promatrac.unobserve(meta);
        raspad(meta, meta.dataset.izvorniTekst ?? meta.textContent.trim());
      }
    },
    { threshold: 0.4 }
  );

  for (const meta of mete) {
    // Zapamti izvorni tekst prije prve animacije: promjena jezika ponovno
    // pokrece efekt i mora krenuti od pravog niza, ne od pola raspada.
    meta.dataset.izvorniTekst = meta.textContent.trim();
    promatrac.observe(meta);
  }
}

/* ------------------------------------------------------------------ */
/* Scroll-spy                                                          */
/* ------------------------------------------------------------------ */
/**
 * Oznacava aktivnu stavku izbornika. Na jednostranicnom rasporedu je to
 * jedina trajna orijentacija koju posjetitelj ima — hes-content.md §0.3
 * to izricito zove obaveznim, ne ukrasnim.
 */
export function pokreniSpy() {
  const veze = [...document.querySelectorAll("[data-spy]")];
  if (!veze.length) return;

  const sekcije = veze
    .map((veza) => ({ veza, sekcija: document.getElementById(veza.dataset.spy) }))
    .filter((par) => par.sekcija);
  if (!sekcije.length) return;

  let aktivna = null;
  const postavi = (veza) => {
    if (aktivna === veza) return;
    for (const { veza: v } of sekcije) v.removeAttribute("aria-current");
    if (veza) veza.setAttribute("aria-current", "true");
    aktivna = veza;
  };

  const promatrac = new IntersectionObserver(
    (unosi) => {
      // Najvise vidljiva sekcija pobjeduje; bez toga dvije stavke znaju
      // istovremeno stajati aktivne na granici.
      const vidljive = unosi
        .filter((u) => u.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (!vidljive.length) return;
      const par = sekcije.find((p) => p.sekcija === vidljive[0].target);
      if (par) postavi(par.veza);
    },
    {
      // Traka kroz sredinu prozora: sekcija je "aktivna" kad je stvarno pred
      // ocima, a ne cim joj rub udje u prikaz.
      rootMargin: "-45% 0px -45% 0px",
      threshold: [0, 0.25, 0.5, 1],
    }
  );

  for (const { sekcija } of sekcije) promatrac.observe(sekcija);
}

/* ------------------------------------------------------------------ */
/* Paralaksa                                                           */
/* ------------------------------------------------------------------ */
/**
 * Sitan pomak pozadinske teksture dok sekcija prolazi kroz prozor —
 * translateY, nikad `background-attachment: fixed` (nepouzdano na mobilnom
 * Safariju, a i tuklo bi se s postojecim <img>-slojevima teksture).
 *
 * Iskljucuje se pod `smanjenPokret` tako da se slusac uopce ne zakaci — bez
 * pomaka nema ni cega za pospremiti, za razliku od otkrivanja.
 */
export function pokreniParalaksu() {
  if (smanjenPokret) return;

  const slike = [...document.querySelectorAll(".tekstura--paralaksa img")];
  if (!slike.length) return;

  /*
   * Zadani raspon je 72 px, ne 24 kao prije. Na sekciji visokoj oko 700 px
   * pomak od 24 px iznosi 3 % njezine visine — mjera na kojoj se paralaksa
   * tehnicki dogada, ali je nitko ne vidi. Pojedina tekstura ga moze
   * nadglasati s `data-paralaksa` na `.tekstura` omotacu.
   *
   * Uz pomak ide i sitno smanjenje mjerila: slika je najveca kad sekcija ulazi
   * u prozor i sjedne na 1 kad joj je sredina na sredini ekrana. Sam translate
   * na plohi bez ostrog motiva se cita kao klizanje; translate + scale se cita
   * kao dubina, sto je ono zbog cega paralaksa uopce stoji.
   */
  const ZADANI_RASPON = 72; // px, najveci pomak u oba smjera
  let tiket = null;

  const azuriraj = () => {
    tiket = null;
    for (const img of slike) {
      const omotac = img.closest(".tekstura");
      const sekcija = omotac?.parentElement;
      if (!sekcija) continue;
      const raspon = Number(omotac.dataset.paralaksa) || ZADANI_RASPON;
      const okvir = sekcija.getBoundingClientRect();
      const sredina = okvir.top + okvir.height / 2;
      // 0 kad je sredina sekcije u sredini prozora; -1..1 dok prolazi kroz njega.
      const napredak = (window.innerHeight / 2 - sredina) / (window.innerHeight / 2 + okvir.height / 2);
      const omjer = Math.max(-1, Math.min(1, napredak));
      const t = omjer * raspon;
      const mjerilo = 1 + Math.abs(omjer) * 0.04;
      img.style.transform = `translateY(${t.toFixed(1)}px) scale(${mjerilo.toFixed(3)})`;
    }
  };
  const naZahtjev = () => {
    if (tiket === null) tiket = requestAnimationFrame(azuriraj);
  };

  window.addEventListener("scroll", naZahtjev, { passive: true });
  window.addEventListener("resize", naZahtjev, { passive: true });
  azuriraj();
}

/* ------------------------------------------------------------------ */
/* Ambijentalni pokret                                                 */
/* ------------------------------------------------------------------ */
/**
 * Sitne animacije koje se okidaju u razmacima — stranica dobiva puls umjesto
 * da miruje dok se ne skrola.
 *
 * Zasto ne `animation: infinite` u CSS-u, sto bi bilo krace: dvadesetak
 * elemenata u trajnoj petlji drzi isto toliko slojeva za slaganje do kraja
 * posjeta, i — vaznije — oko prestane primjecivati pokret koji nikad ne
 * prestane. Ovako se u svakom trenutku animira TOCNO JEDAN element, pa se
 * svaki put procita.
 *
 * Tri stvari koje ovo mora postovati, i sve tri su ovdje:
 *  - izvan prikaza se ne animira nista (IntersectionObserver drzi popis
 *    vidljivih, mjerac preskace elemente kojih na njemu nema),
 *  - u pozadinskoj kartici mjerac stoji (`visibilitychange`), inace bi se
 *    tijekom pola sata u drugom tabu okinuo osamsto puta,
 *  - klasa se skida na `animationend`, s mjeracem kao zastitom — bez toga bi
 *    element koji se sakrije usred animacije zauvijek ostao s klasom.
 */
export function pokreniZivot(korijen = document) {
  if (smanjenPokret) return;

  const mete = [...korijen.querySelectorAll("[data-zivo]")];
  if (!mete.length) return;

  const RAZMAK = 2600; // ms izmedu dva okidanja
  const NAJDULJE = 1600; // ms, najdulja od animacija u app.css

  const vidljive = new Set();
  const promatrac = new IntersectionObserver(
    (unosi) => {
      for (const unos of unosi) {
        if (unos.isIntersecting) vidljive.add(unos.target);
        else vidljive.delete(unos.target);
      }
    },
    { threshold: 0.35 }
  );
  for (const meta of mete) promatrac.observe(meta);

  let sljedeci = 0;
  let mjerac = null;

  const okini = () => {
    // Krug kroz sve mete, ali preskace one koje se trenutno ne vide. Redoslijed
    // je redoslijed u dokumentu, pa se pokret siri stranicom odozgo prema dolje
    // umjesto da skace nasumicno.
    for (let i = 0; i < mete.length; i += 1) {
      const meta = mete[(sljedeci + i) % mete.length];
      if (!vidljive.has(meta)) continue;

      sljedeci = (sljedeci + i + 1) % mete.length;
      const klasa = `zivo--${meta.dataset.zivo || "iskra"}`;
      // Ako je prethodni krug ostavio klasu, prvo je skini — inace se
      // animacija ne pokrene ponovno.
      meta.classList.remove(klasa);
      void meta.offsetWidth; // prisili preracun, da restart primi
      meta.classList.add(klasa);

      const ocisti = () => meta.classList.remove(klasa);
      meta.addEventListener("animationend", ocisti, { once: true });
      setTimeout(ocisti, NAJDULJE + 200);
      return;
    }
  };

  const pokreni = () => {
    if (mjerac !== null) return;
    mjerac = setInterval(okini, RAZMAK);
  };
  const zaustavi = () => {
    if (mjerac === null) return;
    clearInterval(mjerac);
    mjerac = null;
  };

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) zaustavi();
    else pokreni();
  });

  if (!document.hidden) pokreni();
}

/* ------------------------------------------------------------------ */
/* Traka napretka skrolanja                                            */
/* ------------------------------------------------------------------ */
/**
 * Sirina ispune izravno prati postotak skrolane stranice. Ovo NIJE
 * animacija nego ocitanje stanja (kao i sam scrollbar), pa ne provjerava
 * `smanjenPokret` — ostaje aktivna i uz smanjen pokret.
 */
export function pokreniSkrolTraku() {
  const ispuna = document.querySelector("[data-skrol-ispuna]");
  if (!ispuna) return;

  let tiket = null;
  const azuriraj = () => {
    tiket = null;
    const visina = document.documentElement.scrollHeight - window.innerHeight;
    const postotak = visina > 0 ? (window.scrollY / visina) * 100 : 0;
    ispuna.style.width = `${Math.min(100, Math.max(0, postotak)).toFixed(1)}%`;
  };
  const naZahtjev = () => {
    if (tiket === null) tiket = requestAnimationFrame(azuriraj);
  };

  window.addEventListener("scroll", naZahtjev, { passive: true });
  window.addEventListener("resize", naZahtjev, { passive: true });
  azuriraj();
}
