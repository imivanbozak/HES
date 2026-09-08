---
source_context: HES/hes-brand-context.md
source_structure: HES/hes-structure.md (v2 — landing-page architecture, rental merged into the webshop)
date_generated: 2026-08-02
date_revised: 2026-08-02
revision: v2 — rewritten for the landing-page architecture. Supersedes the v1 eleven-page copy document.
purpose: Implementation-ready page copy for the HES website redesign. Croatian customer-facing strings, English scaffolding.
scope: 2 URLs, 22 sections. Copy + per-section visual/layout recommendations + hierarchy and tone notes.
---

## 0. How to read this document

Structural scaffolding, rationale and notes are in **English**. Everything inside a **Copy** block is **Croatian** and is the string that ships — Croatian is the only language in which content actually exists (§8.11).

Conventions used throughout:

- `[missing from context — §N]` — the section needs a fact the source does not contain. It is never filled with a plausible sentence. All markers are collected in §5 at the end of this file.
- `> Blocked: §4.N — …` — a decision already inventoried in the structure file materially shapes the copy written here. Known and accepted; not a question.
- `[data defect — §8.10]` — a known export defect, carried as-is. **Bracketed notes are editorial and are not part of the published string.**
- Register: formal **vi** everywhere except the `jobs` section, which uses the informal **ti**, mirroring the client's own ad ("sve te naučimo").
- Every price, item name, brand, count and contact string is reproduced character for character from the source, including Croatian decimal formatting and the € position: `10,00 €`, `655,61 €`, `12,07 €`.

### 0.1 What this site is

**One landing page carrying the whole business, one Loxone page carrying the service and the shop.** Two URLs.

| URL | Sections | What it holds |
| --- | --- | --- |
| `/` | 10 | Hero, line selector, delivery scope, the three ranked business lines, a tool rental teaser, recruitment with both roles and the offer, contact with the enquiry form |
| `/webshop` | 12 | Shop hero and selector, then two separated halves: Loxone (service + 59-SKU catalogue) and Najam alata (16-item day-rate catalogue), closing on one shared enquiry |

**The consequence for copy is the single most important thing in this document: everything on `/` competes with everything else on `/`.** In the superseded eleven-page version, each business line had a page to itself and could repeat the delivery-process claim, restate the contact details and close with its own CTA. On one page those repetitions are visible as repetition. Three rules follow, and every section below obeys them:

1. **The process chain — "od projektiranja, montaže pa do puštanja u rad" — is stated once**, in `scope-strip`. It is not restated inside `industrial` or `residential-electrical`, though both lines are covered by it.
2. **The full contact details appear once**, in `contact`. Line sections carry a short inline CTA that scrolls there, not a repeated contact block.
3. **Each line section carries only what distinguishes it**: the industrial line its deliverable and market restriction, the finishing line its seven-item works list and the turnkey model, the residential line its specialism claim.

### 0.2 Photography: everything image-dependent is contingent

**The source contains no photography, no art direction, no logo files and no project imagery (§9).** Every recommendation below that depends on an image is therefore **contingent on a photo shoot the client has not yet commissioned**. Where no photo exists, each of those sections is written so it also works as a type-and-colour composition with no image at all; that fallback is named in the section's visual note. Alt text is supplied for the shot the section wants, so it is ready the day the images arrive.

**A landing page needs fewer photographs than eleven pages did, but it needs them to be better.** With ten sections on one scroll, weak or generic imagery is compared against its neighbours in a single glance — there is no page break to hide behind. Minimum shot list:

1. **Industrial electrical cabinet, wired, open door** — the single most important shot on the site. Carries `hero` and `industrial`.
2. **Cabinet detail** — terminal rail, labelled conductors, close crop. Carries `scope-strip` and `industrial`.
3. **Two or three finishing-works shots** — a finished Knauf wall, laid ceramic tiling or flooring, a fitted decorative moulding or window sill. Carries `finishing-works`.
4. **Residential electrical work in progress** — a distribution board or first-fix wiring in a home. Carries `residential-electrical`.
5. **A Loxone installation in a finished interior** — a Touch button on a wall, or lighting in a lived-in room. Carries `loxone-teaser` on `/` and the Loxone half of `/webshop`.
6. **Loxone product shots on a neutral background** — Miniserver plus one item per family, ten shots minimum. Carries `family-listing`.
7. **Rental tools on a neutral background** — sixteen product shots, one per catalogue item. Carries `rental-listing` on `/webshop`; one representative shot also carries `rental-teaser` on `/`.
8. **One or two work-site / crew shots in Germany** — vehicle, workshop, team at work. Carries `jobs`; also the only humanising imagery the site would have.

Until items 1–8 exist, ship the type-led fallbacks. Do not substitute stock photography of unrelated electrical work — the site has no reference projects, testimonials or certificates (§9), so an obviously generic image is the fastest way to lose the only credibility the site has.

### 0.3 The visual system, defined once

A landing page is not a short site — it is a long page, and long pages fail in one specific way: the visitor loses track of where they are and how much is left. The system below is built around that risk. Everything is buildable in standard HTML/CSS with light JS. No WebGL, no 3D, no video.

| Pattern | Definition | Where it is reused |
| --- | --- | --- |
| **Hero treatment** | Full-width block, left-aligned type, image or flat field behind at low contrast, one primary and one secondary CTA. Only **two** on the whole site. | `hero` on `/`, `hero-shop` on `/webshop` |
| **Section rhythm** | Alternating background fields — dark, light, dark — with the field change marking every top-level section boundary on `/`. The single most important pattern on a one-page site: it is what makes ten sections read as ten things. | Every section on `/` |
| **Divider language** | One angled divider, shallow (2–3°), always the same angle and direction. Used only where the *audience* changes, never merely where the subject does — otherwise it fires nine times on one page and stops meaning anything. | `/` at two points — before `jobs`, before `contact`; `/webshop` at two — before `loxone-catalog-intro`, before `rental-intro` |
| **Reveal pattern** | On-scroll reveal: 12–16 px rise + fade, 300–400 ms, staggered 60 ms across siblings, fires once. `prefers-reduced-motion` disables it. | Every list, grid and table body |
| **Price emphasis** | Price set in the same weight and size everywhere, with a soft accent glow behind the figure only. Never on names, never on body copy. | `rental-teaser`, `jobs` (hourly rate), `loxone-teaser`, `loxone-catalog-intro`, `family-listing`, `rental-intro`, `rental-listing` |
| **Card grid** | Equal-height cards, one border weight, one radius, hover = 1 px lift + border brightening. | `service-lines`, `finishing-works`, `jobs` |
| **Scroll-spy nav** | Sticky header; the active nav item updates as sections pass a threshold. Anchor targets carry a scroll offset equal to header height so a section's eyebrow is never hidden under the header. **Mandatory, not decorative** — it is the only orientation a one-page site has. | `/` only |
| **Progressive disclosure** | Dense inventory collapsed behind tabs or an expander, defaulting to the summary view. Used on `/` only, and only for `jobs`' two role specifications side by side. The 16 rental rows that once needed tabs here now live on `/webshop`, where nothing competes for the space and they are shown in full. | `jobs` |
| **Sticky split-screen** | Media column pinned, content column scrolls. Expensive; used **twice on the whole site** — `industrial` and `loxone-system-scope`. | Those two sections only |
| **Grain / texture** | A single very low-opacity grain layer applied to dark fields only, site-wide, never per-section. | All dark sections |

Tone across the system: **grounded, competent, plain — a working trade company, not a tech brand.** The only positioning the client authored is `realna cijena i dalje može značiti visoku kvalitetu` (§7). No superlatives, no promises of speed, safety, efficiency, energy optimisation or "comprehensive support in one place" — those claims exist only in the legacy text and are marked do-not-reuse.

---

## 1. Global copy — main navigation (§3.1)

**Copy — nav labels, in order**

| # | Label as it appears | Points to |
| --- | --- | --- |
| 1 | `HES` (wordmark) | `/` (top of page) |
| 2 | `Usluge` | `/#usluge` |
| 2a | `Industrijske elektroinstalacije` | `/#industrijske-elektroinstalacije` |
| 2b | `Završni radovi` | `/#zavrsni-radovi` |
| 2c | `Kućne elektroinstalacije` | `/#kucne-elektroinstalacije` |
| 3 | `Loxone smart home` | `/webshop` |
| 4 | `Najam alata` | `/webshop#najam-alata` |
| 5 | `Zaposlenje` | `/#zaposlenje` |
| 6 | `Kontakt` | `/#kontakt` |

**Copy — nav microcopy**

- Dropdown eyebrow above items 2a–2c: `Tri kategorije usluga`
- Mobile menu trigger, open state: `Izbornik` / closed state: `Zatvori`
- Header phone CTA, desktop, right of item 6: `00385 99 205 7845`
- Language switcher, attachment point after item 6 (§3.3): `HR`
  - `[missing from context — §9: which language versions launch, and which content exists in each]`

**Build note, mandatory (§3.1).** From `/webshop` every landing-page anchor must resolve to `/#anchor`, not `#anchor`. On `/`, item 2's dropdown and items 5–6 scroll in-page; items 3 and 4 both navigate to `/webshop`, at different anchors. On `/webshop` those two scroll in-page. Scroll-spy runs on **both** pages, and on `/webshop` it must switch the active item between *Loxone smart home* and *Najam alata* as the two halves pass — otherwise two nav items read as active at once.

**Visual / layout**

1. **Sticky header, one line, wordmark left, nav right, phone last, with scroll-spy (§0.3)** — on a one-page site the header is the only permanent orientation the visitor has; the active-state marker tells them where they are in a scroll that has no page breaks.
2. **Items 3 and 4 marked with a small outbound indicator that items 2a–2c, 5 and 6 do not carry** — four nav items scroll and two navigate; without a visual difference the visitor learns the nav is unpredictable, which is worse than either behaviour alone. The two share a destination but keep separate labels, because a tradesman searches for `Najam alata`, not for the container it sits in.
3. **Anchor scroll offset equal to header height, applied to every anchor target on both pages** — the single most common one-page build defect is a section's eyebrow disappearing under the sticky header; it makes every nav click feel slightly broken. It matters more for `/webshop#najam-alata`, which lands mid-page from a cold navigation.

**Hierarchy and tone**

Wordmark is a link, not a heading. Nav labels are `label`. The dropdown eyebrow is `eyebrow`. Labels are nouns, no verbs, no marketing ("Naše usluge" → `Usluge`): a trade audience scans nav for the job name, not for the brand's voice.

---

## 2. Global copy — footer (§3.2)

**Copy**

*Block 1 — identity*

- Wordmark: `HES`
- Legal name line: `Hranj electrical services d.o.o.`
- Partner status line: `Ovlašteni partneri firme Loxone`

*Block 2 — Kontakt*

- Heading: `Kontakt`
- `E-pošta: alen.hranj@hes.hr`
- `Telefon: 00385 99 205 7845`
- `[missing from context — §9: address, registered seat, OIB, working hours, service radius]`

*Block 3 — Usluge*

- Heading: `Usluge`
- `Industrijske elektroinstalacije` → `/#industrijske-elektroinstalacije`
- `Završni radovi` → `/#zavrsni-radovi`
- `Kućne elektroinstalacije` → `/#kucne-elektroinstalacije`
- `Loxone smart home` → `/webshop`

*Block 4 — Ostalo*

- Heading: `Ostalo`
- `Najam alata` → `/webshop#najam-alata`
- `Zaposlenje` → `/#zaposlenje`
- `Kontakt` → `/#kontakt`

*Block 5 — legal row*

- Copyright: `© [tekuća godina] Hranj electrical services d.o.o.`
- Language switcher, text-level mirror of the header control (§3.3): `HR`

> Blocked: §4.6 — Waldner is named as a partner in §2 but the relationship is never explained, so only Loxone appears in the partner status line.

**Visual / layout**

1. **Four columns on desktop collapsing to a stacked accordion on mobile, dark field with the site-wide grain layer** — the footer is where a one-page visitor lands after a long scroll, and columns let them jump back up without scrolling back through everything they already passed.
2. **Partner status line given its own row above the columns, not inside them** — `ovlašteni partneri firme Loxone` is the only verifiable external credential the source contains (§9), so it must not be reduced to a link in a list.
3. **A visible empty slot where the address block belongs, left blank in the build** — makes the missing-data gap structural rather than invisible, so the client sees exactly what is outstanding on the live site.

**Hierarchy and tone**

Column headings are H2 in the footer landmark. Legal name and copyright are `caption`. Partner status is `label`, not a heading — it is a statement of fact, not a section title. Tone is administrative and flat.

---

# PAGE 1 — Landing `/`

**Primary CTA of the page:** contact enquiry (email / phone, §2).
**Audience:** mixed — industrial buyers (Germany), private clients (Croatia), tradespeople, job candidates.
**10 sections.** Anchor slugs are given per section; they map to section IDs per §3.1 of the structure file.

---

### `hero` — Hero
**Page:** `/` · **Anchor:** top of page

**Copy**

*Headline variants (pick one at build):*

- **A —** `Električne instalacije i Loxone smart home sustavi`
- **B —** `Industrijske instalacije u Njemačkoj. Završni radovi, kućne instalacije i Loxone u Hrvatskoj.`
- **C —** `Od projektiranja, montaže pa do puštanja u rad`

*Eyebrow:* `Hranj Electrical Services`

*Subheadline:*
`Specijalizirani smo za električne instalacije i Loxone smarthome sisteme. Industrijske električne instalacije izvodimo u Njemačkoj, a u Hrvatskoj radimo završne građevinske radove, kućne elektroinstalacije te prodaju i montažu Loxone sustava.`

*Market labels (two, side by side):*
- `Njemačka — industrijske električne instalacije`
- `Hrvatska — završni radovi, kućne elektroinstalacije, Loxone`

*Badge:* `Ovlašteni partneri firme Loxone`

*CTAs:*
- Primary: `Pogledajte usluge` → `/#usluge`
- Secondary: `Nazovite 00385 99 205 7845` → `tel:0038599 2057845`

*Alt text:*
`Otvoreni industrijski elektro ormar s ožičenim rednim stezaljkama, u izradi.`
Fallback if no photo exists: no image, no alt text — see visual note 3.

**Visual / layout**

1. **Hero treatment (§0.3) at roughly 85 vh, not full height, left-aligned type over a low-contrast image** — deliberately short of a full screen so the top edge of `service-lines` is visible on load. On a one-page site the hero's job is not to hold attention, it is to prove there is more below; a hero that fills the viewport exactly is the commonest reason one-pagers bounce.
2. **The two market labels rendered as a single horizontal strip directly under the subheadline, divided by a hairline** — the source's own defining fact is that HES is a two-market, multi-line business; showing both markets in one glance is what stops a visitor from concluding they are on the wrong site.
3. **Type-led fallback: no photo, headline set large over a dark field with the grain layer, market strip as the only structural element** — this hero must ship before the photo shoot exists (§0.2), and a flat confident field reads as deliberate where a stock photo reads as filler.

**Hierarchy and tone**

`Hranj Electrical Services` = eyebrow. Headline = **H1** — and on a one-page site this is the **only H1 the site's main page has**, so it must carry the whole business, not one line of it. Subheadline = lead paragraph. Market labels = `label`. Partner status = `badge`. Tone: declarative, no adjectives, no promise. Variant B is the most informative and the recommended default — it answers "what and where" in one line for all three audiences at once, which is exactly what a single entry point for four activities has to do.

---

### `service-lines` — Business line selector
**Page:** `/` · **Anchor:** `#usluge`

**Copy**

*Eyebrow:* `Tri kategorije usluga`

*Headline:* `Odaberite područje rada`

*Subheadline:* `HES usluge dijele se na tri kategorije. Svaka pokriva drugo tržište i drugu vrstu naručitelja. Uz njih se bavimo i najmom profesionalnog alata.`

*Card 1*
- Rank label: `01 — Primarna djelatnost`
- Title: `Industrijske elektroinstalacije`
- Market: `Njemačka`
- Body: `Glavna i primarna djelatnost HES-a. Radimo isključivo industrijska električna rješenja — industrijski elektro ormari za različita trošila i sustave.`
- CTA: `Pogledajte` → `/#industrijske-elektroinstalacije`

*Card 2*
- Rank label: `02 — Druga djelatnost`
- Title: `Završni radovi i kućne elektroinstalacije`
- Market: `Hrvatska`
- Body: `Završne građevinske radove izvodimo po principu ključ u ruke. Uz njih radimo i kućne elektroinstalacije, za koje smo specijalizirani.`
- CTAs (two): `Završni radovi` → `/#zavrsni-radovi` · `Kućne elektroinstalacije` → `/#kucne-elektroinstalacije`

*Card 3*
- Rank label: `03 — Treća djelatnost`
- Title: `Loxone smart home`
- Market: `Hrvatska`
- Body: `Ovlašteni smo partneri firme Loxone. Prodajemo Loxone komponente i izvodimo montažu Loxone sustava na području Hrvatske.`
- CTA: `Loxone smart home i katalog` → `/webshop`

*Secondary row, below the three cards:*
- `Najam alata` — `16 artikala, cijena po danu` — CTA: `Najam alata` → `/#najam-alata`
- `Zaposlenje u Njemačkoj` — `Prijave primamo stalno` — CTA: `Zaposlenje` → `/#zaposlenje`

> Blocked: §4.10 — Loxone is presented both as a stated specialism and as the third-ranked activity; these cards follow the stated rank, while the architecture gives Loxone the site's only sub-page. That tension is noted in the structure file and is the client's to resolve.

**Visual / layout**

1. **Card grid (§0.3), three columns desktop / one column mobile, equal height regardless of body length** — segmentation is the highest-value action on this page, and unequal cards would signal a priority beyond the one the client stated in the rank labels.
2. **A secondary two-item row beneath the three cards, visually lighter — smaller type, no card frame** — rental and recruitment must be reachable from the top of the page without being ranked alongside the three stated categories. **This row is what makes the page navigable:** it means every one of the seven anchors is reachable within the first two screens, so no audience has to scroll through three business lines to find theirs.
3. **Card 3's CTA styled as an outbound link, matching the nav's outbound indicator** — one card navigates and two scroll; consistency with the header is what keeps that from feeling arbitrary.

**Hierarchy and tone**

`Tri kategorije usluga` = eyebrow. `Odaberite područje rada` = **H2**. Card titles = **H3**. Rank labels, market names and secondary-row labels = `label`. Tone: routing, not selling — each body is one sentence of fact so the visitor spends attention on choosing, not reading. Card 2 carries two CTAs because §3.2 treats both services as one category.

---

### `scope-strip` — End-to-end scope statement
**Page:** `/` · **Anchor:** none (not a nav destination)

**Copy**

*Headline:* `Od projektiranja, montaže pa do puštanja u rad`

*Subheadline:* `Nudimo usluge projektiranja, montaže i puštanja u rad svih vrsta električnih instalacija — industrijskih i kućnih.`

*Three steps:*
1. `Projektiranje` — `Izrada projekta električne instalacije.`
2. `Montaža` — `Izvedba i montaža instalacije na objektu.`
3. `Puštanje u rad` — `Puštanje instalacije u rad.`

*Alt text:* `Detalj redne stezaljke s označenim vodičima u elektro ormaru.`

**Visual / layout**

1. **Full-width horizontal strip, three steps in one row connected by a hairline rule, no illustrations, deliberately short — under half a screen** — the claim is a chain, and a single unbroken line states "we do not hand this off" more economically than three icons would. It is kept short because it sits between the selector and the first line section, and anything taller would push `industrial` off the second screen.
2. **Reveal pattern (§0.3), stagger left to right so the three steps arrive in delivery order** — motion carries the sequence meaning, which is the section's whole argument.
3. **No angled divider here** — the divider language (§0.3) is spent on audience changes only, and this section shares its audience with everything above and below it. The background field change alone marks the boundary.

**Hierarchy and tone**

Headline = **H2**, set as the client's own phrase verbatim. Step names = **H3**. Step bodies = `caption`. Tone: procedural and unembellished. Each step is described only by what it is — the source states the scope, never its benefits, and no efficiency or safety claim is added (§7, do-not-reuse).

**Why this section exists here and nowhere else.** In the superseded version this content appeared three times: on the homepage, on the industrial page and on the residential page. On one page that is visible repetition, so the claim is centralised here and the subheadline is widened to name both installation types it covers. `industrial` and `residential-electrical` below do not restate it.

---

### `industrial` — Line 1 · Industrijske elektroinstalacije
**Page:** `/` · **Anchor:** `#industrijske-elektroinstalacije`

**Copy**

*Eyebrow:* `01 — Primarna djelatnost`

*Headline:* `Industrijske elektroinstalacije`

*Subheadline:*
`Glavna i primarna djelatnost HES-a su električne instalacije. Većinu električnih instalacija radimo u Njemačkoj i to isključivo kao industrijska električna rješenja.`

*Block 2 — the deliverable*
- Sub-heading: `Industrijski elektro ormari`
- Body: `Izrađujemo industrijske elektro ormare za različita trošila i sustave — ožičenje i integracija komponenti u ormaru.`
- Items:
  - `Industrijski elektro ormari za različita trošila`
  - `Industrijski elektro ormari za različite sustave`
  - `Ožičenje i integracija komponenti`

*Block 3 — market and customer type*
- Sub-heading: `Tržište i naručitelj`
- Fact rows:
  - `Tržište` — `Njemačka`
  - `Vrsta rješenja` — `Isključivo industrijska`
  - `Naručitelj` — `Industrija`
- Redirect line: `Za kućne elektroinstalacije i završne radove u Hrvatskoj pogledajte odjeljke niže na stranici.`

*Block 4 — capacity cross-link*
- Label: `Za kandidate`
- Body: `Za ovu djelatnost stalno zapošljavamo. Prijave i životopise za rad u Njemačkoj primamo kontinuirano.`
- CTA: `Zaposlenje u Njemačkoj` → `/#zaposlenje`

*Block 5 — inline CTA*
- CTA: `Pošaljite upit za projekt` → `/#kontakt`
- Secondary: `alen.hranj@hes.hr` → `mailto:alen.hranj@hes.hr`

*Alt text:* `Unutrašnjost industrijskog elektro ormara — redne stezaljke, osigurači i ožičenje.`

`[missing from context — §9: no reference projects, client names, project photos or case studies exist; no built example can be shown or named]`

`[missing from context — §9: no definition of who commissions industrial cabinets in Germany — end clients, plant engineering firms or contractors — so the buyer is named only as "industrija"]`

> Blocked: §4.8 — German work is stated as "isključivo" industrial, while another source line offers "kućne i industrijske instalacije" without naming a market. This section stays strictly inside industrial scope.

**Visual / layout**

1. **Sticky split-screen (§0.3) — one of only two on the site: the cabinet image pinned left, blocks 2–5 scrolling past on the right** — this is the primary activity and the longest line section, and pinning one image while the deliverable, the market restriction and the CTA pass it keeps the section feeling like one argument instead of four stacked blocks. Below 1024 px the split collapses to image-then-blocks, sticky disabled.
2. **Block 3's fact rows as a three-row table, label left / value right, hairline rules** — a table reads as specification rather than as marketing, which matches how an industrial buyer qualifies a supplier and does the disqualifying work this section needs before the CTA.
3. **Block 4 rendered as a narrow muted inset, one weight down, no accent colour** — deliberately the quietest thing in the section so a candidate can find it while a buyer skips it on sight.

**Hierarchy and tone**

Eyebrow = `label`. Headline = **H2**. Sub-headings in blocks 2–4 = **H3**. Fact row labels and values = `label`. Tone: **specification-led, formal vi**, written for a German-market industrial buyer qualifying a supplier — nouns, not adjectives. The market restriction is stated plainly: saying what is not done is a credibility signal to this audience and keeps the enquiry queue clean.

**Note on what is absent.** The process chain is not repeated here; `scope-strip` above carries it for both electrical lines. The source states what is built and for what, and never states tolerances, standards, capacities or certifications, so none are implied.

### `finishing-works` — Line 2a · Završni građevinski radovi
**Page:** `/` · **Anchor:** `#zavrsni-radovi`

**Copy**

*Eyebrow:* `02 — Druga djelatnost`

*Headline:* `Završni radovi u građevini po principu ključ u ruke`

*Subheadline:*
`Firma Hranj Electrical Services nudi usluge završnih radova u građevini po principu ključ u ruke. U Hrvatskoj smo aktivni od nedavno.`

*Block 2 — the works inventory*
- Sub-heading: `Radovi koje izvodimo`
- Intro line: `Pronađite svoj posao na popisu i javite nam se s upitom.`
- Items (seven):
  1. `Izrada zidova od knauf gipsnih ploča`
  2. `Postavljanje keramike`
  3. `Postavljanje laminata, parketa i ostalih vrsta podova`
  4. `Ljepljenje ukrasnog kamena`
  5. `Izrada klupčica`
  6. `Ukrasne lajsne`
  7. `Razni popravci u završnim radovima`

*Block 3 — inline CTA*
- CTA: `Zatražite ponudu` → `/#kontakt`
- Secondary: `00385 99 205 7845` → `tel:0038599 2057845`

*Alt text (per card, where photos exist):*
- `Zid od knauf gipsnih ploča prije završne obrade.`
- `Položena keramika u kupaonici.`
- `Položen laminat u dnevnom boravku.`
- `Zid obložen ukrasnim kamenom.`
- `Ugrađena prozorska klupčica.`
- `Montirana ukrasna lajsna uz strop.`
- `Popravak u završnim radovima.`

`[missing from context — §8.3 / §9: the source states "ključ u ruke" for finishing works only and never defines what the turnkey scope includes — materials, coordination, disposal, phases or handover; none of it can be written]`

`[missing from context — §9: no prices, price ranges or units of measure exist for finishing works; this section can list works but cannot indicate cost]`

`[missing from context — §9: no service radius or geographic coverage in Croatia is stated anywhere in the source]`

> Blocked: §4.7 — the scope of "ključ u ruke" is stated only for finishing works and cannot be used as a site-wide proposition or a hero claim, so it stays inside this section's headline.

**Visual / layout**

1. **Card grid (§0.3), seven cards, three columns desktop / two tablet / one mobile, each card a photo plus a job name** — item-matching is how private clients qualify a finishing contractor, and a photo of the finished job does the matching faster than the name alone. This is the only section on the page where imagery is doing conversion work rather than atmosphere.
2. **Text-only fallback: the same grid with the job name set large and no image, cards keeping identical proportions** — the grid must ship before the shoot (§0.2) without collapsing into a bullet list.
3. **`ključ u ruke` set as the accented phrase inside the headline, using the accent colour reserved for prices and CTAs** — it is the client's own verbatim proposition and the only delivery-model claim on the site, so it earns the emphasis treatment. It appears once, in the headline, and is not restated as its own block.
4. **Warmer, brighter background field than `industrial` above** — the section rhythm (§0.3) does double duty here: it marks a section boundary *and* an audience change from a German plant buyer to a Croatian homeowner, without needing a divider.

**Hierarchy and tone**

Eyebrow = `label`. Headline = **H2**. Sub-heading = **H3**. Card titles = **H4** or `label` depending on build depth. Tone: **plain, domestic, formal vi**. Job names are literal, drawn from the client's own list, with no persuasion inside the items — the intro line carries the only instruction. This is the longest concrete inventory the source holds and its value is entirely in being complete and findable.

**Note.** The source prose spelling `ggrađevinske` is a typo (§8.10) and is corrected to `građevinske` here, because the sentence containing it is newly authored.

---

### `residential-electrical` — Line 2b · Kućne elektroinstalacije
**Page:** `/` · **Anchor:** `#kucne-elektroinstalacije`

**Copy**

*Eyebrow:* `02 — Druga djelatnost`

*Headline:* `Kućne elektroinstalacije — specijalizirani smo za njih`

*Subheadline:*
`Radimo kućne elektroinstalacije i za njih smo specijalizirani. Izvodimo ih u Hrvatskoj, za privatne naručitelje.`

*Block 2 — smart-home extension*
- Sub-heading: `Uz elektroinstalaciju možete odmah dobiti i Loxone smart home`
- Body: `Specijalizirani smo za Loxone smarthome sisteme i pružamo usluge za kućne i industrijske instalacije. Ovlašteni smo partneri firme Loxone, prodajemo Loxone komponente i izvodimo njihovu instalaciju.`
- Badge: `Ovlašteni partneri firme Loxone`
- CTA: `Loxone smart home i katalog` → `/webshop`

*Block 3 — inline CTA*
- CTA: `Pošaljite upit` → `/#kontakt`
- Secondary: `00385 99 205 7845` → `tel:0038599 2057845`

*Alt text:* `Razvodna ploča u stambenom objektu tijekom montaže.`

`[missing from context — §9: no itemised service list exists for household electrical installations beyond the service itself, so this section has no inventory equivalent to the seven finishing-works items]`

**Visual / layout**

1. **Deliberately the shortest line section on the page — two blocks, no grid, no image column on desktop** — the source gives this line one service and one specialism claim and nothing else. Padding it to match `finishing-works` would either repeat `scope-strip` or invent content; a visibly shorter section is the honest treatment and costs nothing, because it sits directly under the longest one.
2. **Shares the warmer background field with `finishing-works` above rather than alternating** — the two sections are one business line serving one customer type (§3.2), and a continuous field states that relationship without a sentence. This is the one intentional break in the alternating section rhythm, and it is the reason `related-residential-electrical` is no longer needed as a section.
3. **Block 2 set as a split band, copy left and one Loxone-in-situ photograph right, with the partner badge reused verbatim from the header of the `loxone-teaser` section below** — one credential, one rendering, everywhere it appears.

**Hierarchy and tone**

Eyebrow = `label`, repeating `02` because this is the second half of one category, not a third. Headline = **H2**. Sub-heading = **H3**. Badge = `badge`. Tone: formal vi, plain. `specijalizirani` is carried once in the headline and once in the subheadline and nowhere else — the source states this specialism twice, and a third repetition would be inflation.

**Note on placement.** A house being rewired is the single moment when a smart-home system is cheapest to install, which is why the Loxone cross-link lives here rather than the reverse. The headline states that as an option, not as urgency or a saving: the source contains no pricing, no bundle and no installation-cost claim, so no economic argument is made even though the placement rests on one.

---

### `loxone-teaser` — Line 3 · Loxone smart home
**Page:** `/` · **Anchor:** none in nav — reached via `service-lines`, `residential-electrical` and the header's item 3

**Copy**

*Eyebrow:* `03 — Treća djelatnost`

*Headline variants:*

- **A —** `Ovlašteni partneri firme Loxone`
- **B —** `Loxone smart home — prodaja komponenti i montaža sustava`
- **C —** `Specijalizirani smo za Loxone smarthome sisteme`

*Subheadline:*
`Treća djelatnost proizlazi iz činjenice da smo ovlašteni partneri firme Loxone. Prodajemo Loxone komponente i bavimo se njihovom instalacijom na području Hrvatske — u domovima i poslovnim prostorima.`

*Fact rows:*
- `Katalog` — `59 artikala`
- `Cijene` — `12,07 € – 655,61 €`
- `Skupine proizvoda` — `10`

*Badge:* `Ovlašteni partneri firme Loxone`

*CTA:*
- Primary: `Loxone smart home i katalog` → `/webshop`

*Alt text:* `Loxone stakleno tipkalo i rasvjeta u uređenom stambenom interijeru.`

`[missing from context — §9: no partner level, partner ID, certificate, licence number or date of authorisation exists in the source]`

**Visual / layout**

1. **Full-width dark band with the grain layer, the Loxone wordmark above the headline, generous vertical space, no card and no border** — this section carries two jobs at once: it is the third business line **and** it is the only verifiable external credential the source contains (§9). Isolation on a dark field is what stops the site's entire trust budget from being spent as one card in a row of four. An unframed statement reads as fact; a bordered badge reads as decoration.
2. **Accent glow (§0.3) behind the wordmark and behind the price range, reusing the price-emphasis treatment** — the one place on the page where the emphasis pattern serves credibility as well as commerce, which keeps the system consistent while marking the exception.
3. **The most prominent CTA on the page after the hero's** — this is one of only two outbound handoffs on the landing page, and it must not look like the inline CTAs that merely scroll to `#kontakt`. Size and the outbound indicator do that work.

**Hierarchy and tone**

Eyebrow = `label`. Headline = **H2**. Fact labels = `label`. Badge = `badge`, verbatim client phrase. Tone: credential-first, then plain description. No smart-home benefit language, no automation or energy claims — those exist only in the legacy text (§7, do-not-reuse), and no claim is made about what the partnership implies for quality, because the source explains no partner benefits.

**Recommended headline: variant A.** It leads with the credential rather than the product, which is the only thing on this page a competitor cannot also say. Variant C is the client's own sentence verbatim, including their spelling `smarthome sisteme`, and is the alternative if the client prefers the specialism framing — but that phrase already opens the Loxone half of `/webshop`, so using it here spends it twice.

---

### `rental-teaser` — Tool rental
**Page:** `/` · **Anchor:** `#najam-alata`

**Copy**

*Eyebrow:* `Uz tri kategorije usluga`

*Headline variants:*

- **A —** `Iznajmljujemo profesionalni alat, po danu`
- **B —** `16 artikala u najmu, od 10,00 € do 50,00 € po danu`
- **C —** `Najam alata`

*Subheadline:*
`HES se bavi najmom profesionalnog alata. Cijene su po danu. U ponudi je 16 artikala u četiri kategorije — cijeli cjenik nalazi se u webshopu.`

*Four category labels with counts:*
- `Ljestve i skele` — `3 artikla` — `16,00 € – 50,00 €`
- `Rezanje i brušenje` — `6 artikala` — `16,00 € – 28,00 €`
- `Bušenje i odvijanje` — `6 artikala` — `10,00 € – 33,00 €`
- `Usisavači i otprašivanje` — `1 artikl` — `28,00 €`

*Price line:* `Cijene po danu od 10,00 € do 50,00 €.`

*Brand line:* `Bosch, K+K, Protube.`

*CTA:* `Cjenik najma` → `/webshop#najam-alata`

*Alt text:* `Profesionalni Bosch akumulatorski alat na neutralnoj podlozi.`

> Blocked: §4.1 — the source names three service categories and then names rental as a further activity outside them, so rental sits below all three ranked lines and carries an eyebrow saying so.

**Visual / layout**

1. **Two-column split: category list left, single tool image right — deliberately not the card grid used by `service-lines`** — rental must read as a different kind of thing from the three ranked categories, mirroring the source's own refusal to place it inside the hierarchy.
2. **Price emphasis (§0.3) on the `10,00 € – 50,00 €` range only, not on the four per-category ranges** — one focal figure sets the expectation; four glowing ranges would flatten into noise.
3. **Compact — roughly half the height of any line section above it, no divider before it** — this is a discovery block, not a catalogue. It exists so a visitor who came for electrical work learns that HES also hires tools, and it is sized to that job.
4. **CTA styled as outbound, matching `loxone-teaser` and the nav's indicator** — the landing page has exactly two links that leave it, and both must look the same.

**Hierarchy and tone**

Eyebrow makes the outside-the-hierarchy relationship explicit in words as well as in layout. Headline = **H2**. Category names = `label`, counts and ranges = `caption`. Tone: **price-first and transactional, formal vi**, addressed to tradespeople and self-builders comparing day rates.

**Recommended headline: variant B.** Count and range in the first line is what this audience compares, and it is the only variant that gives a reason to click through rather than merely naming the service.

**Note on what moved.** The sixteen-row listing, the four-category table and the rental terms link are **not** here — they live in `rental-intro` and `rental-listing` on `/webshop`. This section carries only the four category names with their counts and ranges, which is the minimum needed for a renter to judge whether the shop is worth opening.

---

### `jobs` — Recruitment
**Page:** `/` · **Anchor:** `#zaposlenje`

> **Register flag:** this is the **only section written in the informal `ti`**, mirroring the client's own job ad ("sve te naučimo", §6.2, §7). Everything else on the site uses the formal `vi`. §9 explicitly leaves the site-wide register undecided — the client must confirm whether the informal address is recruitment-only, as written here, or site-wide. **On a landing page this switch happens mid-scroll rather than across a page boundary, which makes confirming it more urgent than it was in the eleven-page version.**

**Copy**

*Eyebrow:* `Zaposlenje`

*Headline variants:*

- **A —** `Tražimo djelatnike za rad u Njemačkoj`
- **B —** `Prijave primamo stalno — rad u Njemačkoj`
- **C —** `Radi s nama u Njemačkoj`

*Subheadline:*
`Prijave i životopise za rad u Njemačkoj primamo kontinuirano. Otvorene su dvije pozicije: Električari i pomoćnici te Radnici u radionici. Radi se o industrijskim električnim instalacijama, glavnoj djelatnosti HES-a.`

*Labels:*
- `Mjesto rada: Njemačka`
- `Prijave: stalno otvorene`

*Highlight:* `Satnica 10–15 €`

*Block 2 — Role 1*
- Role label: `Pozicija 01`
- Sub-heading: `Električari i pomoćnici`
- Intro line: `Provjeri ispunjavaš li uvjete.`

| Uvjet | Status |
| --- | --- |
| `Vozačka dozvola, B kategorija` | `Uvjet` |
| `Znanje njemačkog jezika` | `Prednost, ali nije uvjet` |
| `Radno iskustvo` | `Prednost, ali nije uvjet` |
| `Rad po nacrtima i shemama` | `Prednost, ali nije uvjet` |

*Block 3 — Role 2*
- Role label: `Pozicija 02`
- Sub-heading: `Radnici u radionici`
- Intro line: `Predznanje nije potrebno.`

| Uvjet | Status |
| --- | --- |
| `Predznanje` | `Nije potrebno` |
| `Iskustvo` | `Poželjno je, ali nije obavezno` |

- Body: `Predznanje nije potrebno. Poželjno je, ali nije obavezno — sve te naučimo.`

*Block 4 — what the company offers*
- Eyebrow: `Naša ponuda`
- Sub-heading: `Što nudimo za sve pozicije`

| Ponuda | Detalj |
| --- | --- |
| `Satnica 10–15 €` | `Ovisno o predznanju` |
| `Vlastita soba` | `Komforan smještaj` |
| `Plaćen smještaj` | `Organiziran i osiguran` |
| `Moderna vozila` | `Udobna i opremljena` |
| `Alat i oprema` | `Osiguran alat i odjeća` |
| `Izvrstan tim` | `Prijateljska atmosfera` |

*Block 5 — application step*
- Sub-heading: `Pošalji životopis`
- Body: `Pošalji životopis e-poštom ili nazovi. Prijave primamo kontinuirano, pa se možeš javiti u bilo kojem trenutku.`
- Channel 1: `E-pošta` — `alen.hranj@hes.hr` — CTA: `Pošalji životopis` → `mailto:alen.hranj@hes.hr`
- Channel 2: `Telefon` — `00385 99 205 7845` — CTA: `Nazovi 00385 99 205 7845` → `tel:0038599 2057845`

*Alt text:* `Radionica u kojoj se sastavljaju industrijski elektro ormari.`

`[missing from context — §9: what an application should contain, whether a form is required, where applications are routed and whether a reply is promised are all unanswered; no instructions beyond the two channels may be written]`

> Blocked: §4.14 — recruitment application destination and mechanism are undecided; email and phone are the only routes that exist. With the enquiry form now sitting in the adjacent `contact` section, one form with a `Zaposlenje` routing option is the obvious consolidation — but where those submissions go is still unanswered.
> Blocked: §4.17 — the offer block rests entirely on §6.3 including the 10–15 € hourly rate; if those figures are not publishable this section loses its decisive content.

**Visual / layout**

1. **Angled divider (§0.3) above the section, plus a full background-field change to the darkest field on the page** — this is the sharpest audience switch on the site, from buyers to candidates, happening mid-scroll with no page boundary to signal it. The divider and the field change together are what stop a buyer reading a job ad as an offer to them.
2. **Progressive disclosure (§0.3): the two roles as side-by-side cards on desktop, stacked and both expanded on mobile** — the two requirement tables sit in one screen so a candidate can compare them by scanning one column, which is the section's whole job.
3. **In role 1, the one hard requirement marked in the accent colour and the three advantages muted** — a candidate self-assesses in seconds only if "must have" and "nice to have" are distinguishable without reading.
4. **Price emphasis (§0.3) on `Satnica 10–15 €`, appearing twice — once in the section header, once in the offer grid** — for cross-border manual work the rate is the decisive figure, and it is the one number on this page allowed to repeat.

**Hierarchy and tone**

Eyebrow = `label`. Headline = **H2**. Sub-headings in blocks 2–5 = **H3**. Role names, offer titles and channel labels are the client's own wording verbatim. Tone: **informal `ti`**, direct, no corporate framing. `sve te naučimo` is set on its own line at a larger size than the surrounding body — it is the client's own sentence and the single line most likely to convert a candidate who assumed they were unqualified, which is the audience block 3 exists to capture.

**Recommended headline: variant A** — the client's own headline verbatim. Variant C is the most `ti`-consistent and is the alternative if the client wants the informal register carried into the heading itself.

---

### `contact` — Contact
**Page:** `/` · **Anchor:** `#kontakt`

**Copy**

*Block 1 — positioning*
- Headline: `Realna cijena i dalje može značiti visoku kvalitetu`
- Body: `Kontaktirajte nas i uvjerite se da realna cijena i dalje može značiti visoku kvalitetu.`

*Block 2 — direct channels*
- Sub-heading variants: **A —** `Recite nam što trebate` · **B —** `Javite nam se` · **C —** `Kontaktirajte nas`
- Intro: `Dostupni smo e-poštom i telefonom.`
- Channel 1: `E-pošta` — `alen.hranj@hes.hr` — CTA: `alen.hranj@hes.hr` → `mailto:alen.hranj@hes.hr`
- Channel 2: `Telefon` — `00385 99 205 7845` — CTA: `Nazovite 00385 99 205 7845` → `tel:0038599 2057845`
- Company identifier: `Hranj electrical services d.o.o.` · `hes.hr`

*Block 3 — enquiry form*
- Sub-heading: `Pošaljite upit`
- Intro: `Odaberite o čemu se radi kako bismo upit odmah usmjerili na pravo mjesto.`

| Polje | Oznaka | Placeholder / opcije |
| --- | --- | --- |
| Enquiry type | `Vrsta upita` | see options below |
| Name | `Ime i prezime` | `Ime i prezime` |
| Email | `E-pošta` | `vasa@adresa.hr` |
| Phone | `Telefon` | `Broj telefona` |
| Message | `Opis posla ili upita` | `Ukratko opišite posao ili upit` |

- Enquiry type options:
  1. `Industrijske elektroinstalacije`
  2. `Završni građevinski radovi`
  3. `Kućne elektroinstalacije`
  4. `Loxone — prodaja i instalacija`
  5. `Najam alata`
  6. `Zaposlenje`
- Submit button: `Pošaljite upit`
- Helper microcopy: `Možete nas i nazvati na 00385 99 205 7845.`
- Validation microcopy:
  - Required field: `Ovo polje je obavezno.`
  - Invalid email: `Provjerite adresu e-pošte.`
  - Success state: `Upit je poslan.`
  - Error state: `Upit nije poslan. Pokušajte ponovno ili nam se javite na alen.hranj@hes.hr.`
- Privacy consent line: `[missing from context — §9: no privacy policy exists, so the consent line cannot be written; the form is not launchable until the client supplies privacy-policy content]`

`[missing from context — §9: address, registered seat, OIB, working hours and service radius do not exist in the source; no location block, map or opening-hours table can be built]`

`[missing from context — §9: where enquiries are routed and whether a reply is promised are unanswered; no confirmation message can promise a response]`

`[missing from context — §9: no response time, availability or service commitment exists anywhere in the source]`

> Blocked: §4.4 — no address, registered seat, OIB, working hours or service radius exist, so this section has no location block, no map and no hours.

**Visual / layout**

1. **Angled divider (§0.3) above the section, the third and last on the page, and a return to the dark closing field with the grain layer** — closes the audience sequence and signals the page has ended, which a one-pager must do explicitly or the footer reads as another section.
2. **Block 1 as a single centred line of large type, no quotation marks, accent glow behind `realna cijena`** — this is the only positioning the client authored; unframed it reads as the company speaking rather than as a testimonial the source does not have (§9). It opens the section rather than closing a service block, because on a landing page it is the last thing read before the visitor decides to make contact.
3. **Blocks 2 and 3 side by side on desktop — channels left at heading scale, form right — stacking to channels-then-form on mobile** — a phone-first trade audience gets the number without scrolling past a form, and the form is still on the same screen for anyone who prefers to write. There is deliberately **no map placeholder and no "coming soon" location card**: an empty frame advertises the missing data to every visitor.
4. **Enquiry type as six visible radio chips above the form, not a dropdown** — routing is the block's purpose, and a closed dropdown hides the fact that the company does six different things from the one visitor most likely to be unsure which they need.

**Hierarchy and tone**

Block 1 headline = **H2**. Block 2 and 3 sub-headings = **H3**. Channel labels and field labels = `label`. Helper, validation and company identifier = `caption`. Tone: formal vi, direct invitation. No availability, response-time or coverage claims anywhere — the source contains none.

**Recommended sub-heading for block 2: variant A.** It asks for the visitor's problem rather than announcing the company's availability, which suits a single endpoint serving six different enquiry types.

**Note on what was dropped.** The superseded version had a `contact-jobs-split` section redirecting candidates away from the sales queue. It is retired: `jobs` now sits immediately above this section, so a redirect would point at content the visitor has just scrolled through. The `Zaposlenje` option in the form's routing list handles the stragglers.

# PAGE 2 — Webshop · Loxone i najam alata `/webshop`

**Primary CTA of the page:** system enquiry / RFQ, product enquiry and rental availability enquiry.
**Audience:** buyers decided on Loxone (§5.2); homes and business premises, Croatia (§3.3); tradespeople and self-builders, Croatia (§3.4, §5.1). Register: formal vi.
**12 sections**, running **hero → shop selector → Loxone half (service, then catalogue) → rental half → shared enquiry**.

**The copy problem this page has, stated once.** It carries two inventories that share nothing. Loxone components are **bought**, per unit, by homeowners and businesses commissioning a system. Rental tools are **hired**, per day, by tradespeople who need a grinder on Thursday. The source gives Loxone a service story, a partner credential and ten product families; it gives rental one sentence and sixteen priced rows. Nothing in the source connects them.

So the copy does not pretend they are one offer. There is **no unifying proposition, no "sve na jednom mjestu", no shared category system** — the legacy text's "sveobuhvatna tehnička podrška na jednom mjestu" is exactly the claim marked do-not-reuse (§7), and inventing it here to justify the merge would be the single most tempting fabrication in this document. Instead the page states plainly at the top that it holds two things, lets the visitor pick one, and keeps the halves apart.

> Blocked: §4.2 — **the most urgent open decision on the project, and merging rental in has raised its cost.** The client's word for this page is "webshop", which points at a transactional build. The source supports neither: it carries an RFQ flag but no stated intent, and no VAT, delivery, stock or minimum-period basis (§8.8). Everything below is therefore written **enquiry-based, not "add to cart"**. If it is a true shop, this page needs re-planning: 59 Loxone product pages **plus 16 rental item pages**, cart, checkout, confirmation, and a date-based availability step for rental — roughly 80 URLs, and a cart that would have to hold a purchase and a hire at once, which is not a normal commerce pattern.
> Blocked: §4.3 — it is unclear whether these 59 and 16 items are the full catalogues or an excerpt, so no "cijela ponuda" claim is made anywhere on the page.
> Blocked: §4.15 — the two halves price on different bases, per unit and per day, roughly two screens apart, and neither can state what the figure includes. The layout has to carry that distinction because the copy cannot.
> Blocked: §4.16 — the export defects listed in §8.10 are carried as-is and marked inline; neither listing can be built from the export until the dataset is cleaned.
> Blocked: §4.20 — the page itself is a container the source never describes. "Webshop" is the client's word, not HES's copy; the nav avoids naming it by pointing two familiar labels at one URL.

---

### `hero-shop` — Shop hero
**Page:** `/webshop`

**Copy**

*Headline variants:*

- **A —** `Loxone komponente i najam profesionalnog alata`
- **B —** `Sve što prodajemo i iznajmljujemo, s cijenama`
- **C —** `Loxone katalog i cjenik najma alata`

*Eyebrow:* `Webshop`

*Subheadline:*
`Na ovoj stranici nalaze se dvije ponude: Loxone komponente koje prodajemo i ugrađujemo, te profesionalni alat koji iznajmljujemo po danu.`

*Two fact blocks, side by side:*
- `Loxone` — `59 artikala` — `12,07 € – 655,61 €` — `10 skupina proizvoda`
- `Najam alata` — `16 artikala` — `10,00 € – 50,00 € po danu` — `4 kategorije`

*CTAs:*
- Primary: `Loxone katalog` → `#loxone`
- Secondary: `Najam alata` → `#najam-alata`

*Alt text:* `Loxone Miniserver i profesionalni akumulatorski alat na neutralnoj podlozi.`

**Visual / layout**

1. **Hero treatment (§0.3), the second and last on the site, at roughly 60 vh — shorter than the landing hero and shorter than a single-subject hero would be** — this hero's only job is to say "two things live here, pick one". Height spent on atmosphere here is height stolen from the selector directly beneath it.
2. **The two fact blocks set as a true 50/50 split with a hairline between them, identical internal structure, neither given more weight** — the page must not imply that Loxone is the real offer and rental an afterthought, or a tradesman who followed `Najam alata` from the nav will assume they landed wrong. Equal geometry does what no sentence can.
3. **Type-led fallback: no image, the two fact blocks as the entire hero over a dark field with the grain layer** — this is the hero most likely to ship without photography, since it needs a shot that credibly shows *both* inventories (§0.2), which is the hardest item on the shot list.

**Hierarchy and tone**

`Webshop` = eyebrow. Headline = **H1** (page's only H1). Fact block titles = **H3**; counts, ranges and category counts = `label`. Tone: formal vi, inventory-declarative. The subheadline names both offers in one sentence and makes no attempt to connect them — "dvije ponude" is the honest framing and the only one the source supports.

**Recommended headline: variant A.** It names both inventories in the visitor's own words. Variant B is shorter but implies a completeness claim the source cannot support (§4.3); variant C is accurate but reads as a document title rather than a page.

---

### `shop-nav` — Shop selector
**Page:** `/webshop`

**Copy**

*Headline:* `Odaberite ponudu`

*Card 1*
- Title: `Loxone smart home`
- Body: `Prodaja i ugradnja Loxone komponenti. Ovlašteni smo partneri firme Loxone.`
- Meta: `59 artikala · 10 skupina · 12,07 € – 655,61 €`
- Badge: `Ovlašteni partneri firme Loxone`
- CTA: `Loxone katalog` → `#loxone`

*Card 2*
- Title: `Najam alata`
- Body: `Najam profesionalnog alata. Cijene su po danu, svi artikli su na stanju.`
- Meta: `16 artikala · 4 kategorije · 10,00 € – 50,00 € po danu`
- CTA: `Cjenik najma` → `#najam-alata`

**Visual / layout**

1. **Two equal cards, card grid (§0.3), filling the screen directly under the hero** — with two unrelated inventories on one page, segmentation must precede either of them, exactly as `service-lines` works on the landing page. Without it, a tradesman scrolls through a smart-home system before reaching a grinder.
2. **Card 1 carries the partner badge, card 2 carries the `na stanju` fact instead** — each card leads with the strongest thing its half actually has. Giving card 2 a fabricated equivalent would be invention; giving it nothing would make the halves look unequal.
3. **Both cards sticky-collapse into a two-item segmented control pinned under the header once the visitor scrolls past them** — on a page this long the selector has to stay reachable, and a pinned two-state control also solves the scroll-spy problem in §3.1: whichever half is in view is the one shown active.

**Hierarchy and tone**

Headline = **H2**. Card titles = **H3**. Meta lines = `label`. Badge = `badge`. Tone: routing, formal vi, one sentence of fact per card. This section is the answer to the page's structural problem — it does not argue that the two offers belong together, it simply lets the visitor leave one behind.

**Note.** New section with no ancestor in any earlier version of this document. It exists only because the two inventories now share a page.

---

### `partner-status` — Partner status · opens the Loxone half
**Page:** `/webshop` · **Anchor:** `#loxone`

**Copy**

*Eyebrow:* `Ovlaštenje`

*Headline:* `Ovlašteni partneri firme Loxone`

*Body:* `Ova djelatnost proizlazi iz činjenice da smo ovlašteni partneri firme Loxone. Kao ovlašteni partner prodajemo Loxone komponente i izvodimo njihovu instalaciju.`

*Alt text:* `Loxone logotip.`

`[missing from context — §9: no partner level, partner ID, certificate, licence number or date of authorisation exists in the source]`

**Visual / layout**

1. **The isolated credential band reused verbatim from the `loxone-teaser` section on `/`** — the same fact rendered identically on both pages; two treatments of one credential would make the site's only external proof look inconsistent.
2. **Opens the Loxone half with a full background-field change, marking the boundary the selector just promised** — this is the first of the page's two halves, and the field change is what makes `shop-nav`'s two cards feel like they led somewhere.

**Hierarchy and tone**

`Ovlaštenje` = eyebrow. Headline = **H2**, client's verbatim phrase. Tone: flat statement. The body explains the origin of the business line, which the source does state, and stops there — no claim about training, support, warranty or preferential pricing, none of which the source contains.

**Why this section matters more on a merged page.** It is what makes the 59-row price list further down read as a partner's price list rather than a shop of unknown origin — the one thing the source can actually refute about an unfamiliar seller. It carries no weight over the rental half, and is not allowed to: HES's Loxone authorisation says nothing about its tools.

---

### `loxone-offer` — What HES does with Loxone
**Page:** `/webshop`

**Copy**

*Eyebrow:* `Dvije usluge`

*Headline:* `Prodaja komponenti i instalacija sustava`

*Subheadline:* `Kod nas možete kupiti Loxone komponente, naručiti instalaciju sustava ili oboje.`

*Column 1*
- Title: `Prodaja Loxone komponenti`
- Body: `Prodajemo Loxone komponente iz kataloga. Katalog s cijenama nalazi se niže na ovoj stranici.`
- CTA: `Pogledajte katalog` → `#loxone-katalog`

*Column 2*
- Title: `Instalacija Loxone sustava`
- Body: `Izvodimo instalaciju Loxone smart home sustava — od projektiranja, montaže pa do puštanja u rad.`
- CTA: `Pošaljite upit` → `/#kontakt`

**Visual / layout**

1. **Two equal columns divided by a single vertical rule, no cards** — the section's job is to separate two things that are usually conflated, and one rule states the separation more clearly than two boxes competing for weight.
2. **Reveal pattern (§0.3) firing on both columns simultaneously rather than staggered** — the two offers are equal in rank, and a stagger would imply an order the source does not state.

**Hierarchy and tone**

`Dvije usluge` = eyebrow. Headline = **H2**. Column titles = **H3**. Tone: formal vi, clarifying. Both columns are written to the same length and flatness — any asymmetry would be a recommendation the client never made.

**Note.** On the merged page this section is effectively the page's own table of contents: one column routes down to the shop, the other across to the enquiry. That is why column 1's body names the catalogue's location on the page explicitly.

---

### `loxone-system-scope` — System components overview
**Page:** `/webshop`

**Copy**

*Eyebrow:* `Opseg sustava`

*Headline:* `Što sve ulazi u Loxone sustav`

*Subheadline:* `Loxone katalog koji prodajemo i ugrađujemo obuhvaća deset skupina proizvoda.`

*The ten families (source Croatian top-level names, in source order):*
1. `Miniserveri`
2. `Proširenja`
3. `Doticajni uređaji i tipkala`
4. `Senzori`
5. `Osvjetljenje`
6. `Audio sustavi`
7. `Aktuatori i pogoni`
8. `Pametne utičnice`
9. `Kabeli i konektori`
10. `Dodatni materijali`

*Note under the list:* `Upravljanje osvjetljenjem — upravljači i regulatori intenziteta — vodi se uz skupinu Osvjetljenje.`

*CTA:* `Pogledajte cijeli katalog` → `#loxone-katalog`

*Alt text:* `Loxone Miniserver ugrađen u razvodni ormarić.`

**Visual / layout**

1. **Sticky split-screen (§0.3) — the second and last on the site: a pinned Miniserver image left, the ten families scrolling past right, each highlighting as it enters view** — this is the bridge from service to inventory, and holding the controller steady while ten component groups pass it is a literal picture of a system built around one central unit. Below 1024 px the split collapses to image-then-list, sticky disabled.
2. **Family names as a numbered vertical list, no icons, no product images per family** — ten icons would need ten commissioned assets the client does not have (§0.2), and the names are the actual navigational content of the catalogue below.

**Hierarchy and tone**

`Opseg sustava` = eyebrow. Headline = **H2**. Family names = `label`, reproduced exactly as the source's Croatian top-level category names. Note = `caption`. Tone: inventory-descriptive with no per-family blurbs — the source contains no descriptions of what any family does, and writing them would be invention across ten claims at once.

**Note.** The ten names introduced here are the same ten used by `category-nav` below, in the same order. That repetition is deliberate on a merged page: the visitor learns the catalogue's structure before meeting it, which is what lets `category-nav` be a control rather than an explanation.

---

### `loxone-audience` — Customer types
**Page:** `/webshop`

**Copy**

*Eyebrow:* `Za koga radimo`

*Headline:* `Domovi i poslovni prostori`

*Body:* `Loxone sustave prodajemo i ugrađujemo u domove i poslovne prostore.`

**Visual / layout**

1. **Two-word split band — one half labelled `Domovi`, the other `Poslovni prostori`, divided by the site's angled divider rotated to vertical** — reuses the divider language in a new orientation instead of introducing a new device, and states the two audiences in one glance.
2. **No imagery, minimal height** — the section broadens the qualified audience just before the Loxone catalogue opens; anything larger would delay the seam.

**Hierarchy and tone**

`Za koga radimo` = eyebrow. Headline = **H2**. Tone: formal vi, one sentence. The phrase `domove i poslovne prostore` is used as an audience fact only; the legacy "O nama" wording it derives from is marked do-not-reuse (§7), and none of its automation or energy claims travel with it.

---

### `loxone-catalog-intro` — Loxone catalogue intro
**Page:** `/webshop` · **Anchor:** `#loxone-katalog`

**Copy**

*Eyebrow:* `Katalog`

*Headline:* `59 Loxone artikala, od 12,07 € do 655,61 €`

*Subheadline:* `Ovlašteni smo partneri firme Loxone. Sve artikle iz kataloga prodajemo i ugrađujemo. Cijene su po komadu.`

*Fact rows:*
- `Broj artikala` — `59`
- `Raspon cijena` — `12,07 € – 655,61 €`
- `Skupine proizvoda` — `10`

*Badge:* `Ovlašteni partneri firme Loxone`

*CTA:* `Pošaljite upit o proizvodu` → `/#kontakt`

`[missing from context — §8.8 / §9: VAT treatment, delivery terms, stock status and whether prices include installation are unstated for Loxone items]`

**Visual / layout**

1. **Angled divider (§0.3) — one of two on this page** — the seam inside the Loxone half: everything above sells the capability, everything below sells the parts. It earns a divider because the visitor's mode changes from reading to browsing. The page's other divider opens the rental half.
2. **Compact three-fact band, no image, price emphasis (§0.3) on the range in the headline only** — a 59-SKU list without a stated span forces the visitor to scroll to learn what they are looking at; three numbers remove that scroll. The fact row repeating the range is not emphasised — one focal price per screen.
3. **The partner badge repeated here, its third and last appearance on this page** — it makes the price list legible as a partner's, and the seam is the moment it stops being background and starts being an argument. It does not reappear over the rental half.

**Hierarchy and tone**

`Katalog` = eyebrow. Headline = **H2**. Fact labels = `label`. Badge = `badge`. Tone: numeric and neutral. The count and the span are the only two facts the source supplies about the catalogue as a whole, and both are stated exactly.

---

### `category-nav` — Loxone category navigation
**Page:** `/webshop`

**Copy**

*Headline:* `Pregled po skupinama`

*Subheadline:* `Odaberite skupinu proizvoda.`

*Two-level category tree, exactly as in the source:*

| Skupina | Podskupine |
| --- | --- |
| `Miniserveri` | `Upravljačke jedinice` |
| `Proširenja` | `Ulazna proširenja`, `Izlazna proširenja`, `Komunikacijska proširenja`, `Specijalizirana proširenja` |
| `Doticajni uređaji i tipkala` | `Touch osnovna serija`, `Touch pure serija`, `NFC i sigurnost`, `Daljinsko upravljanje` |
| `Senzori` | `Detektori pokreta i prisutnosti`, `Senzori klime i kvalitete zraka`, `Ostali senzori` |
| `Osvjetljenje` | `Stropne svjetljike`, `Viseće svjetljike`, `Stolne svjetljike`, `LED trake`, `Led bodovi i spotovi` |
| `Upravljanje osvjetljenjem` | `Upravljači`, `Regulatori intenziteta` |
| `Audio sustavi` | `Zvučnici`, `Centralne audio jedinice` |
| `Aktuatori i pogoni` | `Zasjenjivanje`, `Ventili` |
| `Pametne utičnice` | `Wireless utičnice` |
| `Kabeli i konektori` | `Stezaljke`, `Loxone tree` |
| `Dodatni materijali` | `Memorija`, `NFC sustav` |

*Microcopy:* `Podskupine su preuzete iz Loxone kataloga.`

**Visual / layout**

1. **Sticky category rail on desktop, pinned left for the Loxone listing only and released at the rental half; horizontal scrolling chip row pinned under the header on mobile** — with ten families and a 54× price spread, filtering must precede items. The release point matters: a Loxone family rail still pinned beside a Bosch grinder would read as a filter that has stopped working.
2. **Sub-categories revealed on hover/tap under their parent rather than shown all at once** — twenty-five sub-category names visible simultaneously would be a worse index than the ten-item one it replaces.

**Hierarchy and tone**

Headline = **H2**. Family names = `label`, sub-categories = `caption`. Every name reproduced exactly as the source spells it, including `svjetljike` and `Led bodovi i spotovi`. Tone: none — this is navigation, and the copy's only job is to match the labels used in the listing below it.

---

### `family-listing` — Loxone family listings
**Page:** `/webshop`

**Copy**

*Headline:* `Artikli po skupinama`

*Microcopy above the tables:* `Za upit o pojedinom artiklu javite se e-poštom ili telefonom.`

---

**`Miniserveri` — 3 artikla · 393,62 € – 655,61 €**

Framing line: `Upravljačke jedinice Loxone sustava.`

| Naziv | Kategorija | Cijena |
| --- | --- | --- |
| Miniserver | Miniserveri, Upravljačke jedinice | 655,61 € |
| Miniserver Compact | Miniserveri, Upravljačke jedinice | 495,00 € |
| Miniserver Go | Miniserveri, Upravljačke jedinice | 393,62 € |

---

**`Proširenja` — 13 artikala · 108,61 € – 573,88 €**

Framing line: `Ulazna, izlazna, komunikacijska i specijalizirana proširenja.`

| Naziv | Kategorija | Cijena |
| --- | --- | --- |
| KNX extension | Specijalizirana proširenja | 573,88 € |
| Dali extension – 64 uređaja `[data defect — §8.10: brand missing on this row while every other Loxone row carries one]` | Proširenja, Specijalizirana proširenja | 554,45 € |
| Relay extension | Izlazna proširenja, Proširenja | 337,57 € |
| DI extension | Proširenja, Ulazna proširenja | 284,60 € |
| Dimmer extension | Izlazna proširenja, Proširenja | 284,60 € |
| AO extension | Proširenja, Specijalizirana proširenja | 270,96 € |
| Modbus extension | Proširenja, Specijalizirana proširenja | 250,11 € |
| AI extension | Proširenja, Ulazna proširenja | 203,22 € |
| Dali extension – 10 uređaja | Proširenja, Specijalizirana proširenja | 200,00 € |
| RS485 extension | Proširenja, Specijalizirana proširenja | 185,42 € |
| 1-wire extension | Proširenja, Specijalizirana proširenja | 185,42 € |
| AIR base extension | Komunikacijska proširenja, Proširenja | 108,61 € |
| Tree extension | Komunikacijska proširenja, Proširenja | 108,61 € |

---

**`Doticajni uređaji i tipkala` — 9 artikala · 90,84 € – 302,27 €**

Framing line: `Touch osnovna serija, Touch pure serija, NFC i sigurnost, daljinsko upravljanje.`

| Naziv | Kategorija | Cijena |
| --- | --- | --- |
| NFC Code Touch Air | Doticajni uređaji i tipkala, NFC i sigurnost | 302,27 € |
| NFC Code Touch Tree | Doticajni uređaji i tipkala, NFC i sigurnost | 302,27 € |
| Touch Pure Tree CO2 stakleno tipkalo | Doticajni uređaji i tipkala, Touch pure serija | 233,62 € |
| Touch Pure Flex Air | Doticajni uređaji i tipkala, Touch pure serija | 219,00 € |
| Touch Pure for Nano tipkalo | Doticajni uređaji i tipkala, Touch pure serija | 219,00 € |
| Touch Pure Air stakleno tipkalo | Doticajni uređaji i tipkala, Touch pure serija | 192,76 € |
| Touch Air tipkalo | Doticajni uređaji i tipkala, Touch osnovna serija | 117,17 € |
| Remote Air | Daljinsko upravljanje, Doticajni uređaji i tipkala | 109,00 € |
| Touch Tree tipkalo | Doticajni uređaji i tipkala, Touch osnovna serija | 90,84 € |

---

**`Senzori` — 6 artikala · 90,84 € – 246,70 €**

Framing line: `Detektori pokreta i prisutnosti, senzori klime i kvalitete zraka, ostali senzori.`

| Naziv | Kategorija | Cijena |
| --- | --- | --- |
| Room Comfort Sensor Tree | Senzori, Senzori klime i kvalitete zraka | 246,70 € |
| IR Control Air | Ostali senzori, Senzori | 117,17 € |
| Presence Sensor Air Senzor pristunosti `[data defect — §8.10: "pristunosti" misspells "prisutnosti"; carried as-is, not silently corrected]` | Detektori pokreta i prisutnosti, Senzori | 109,60 € |
| Motion Sensor Tree Senzor pokreta | Detektori pokreta i prisutnosti, Senzori | 108,32 € |
| Presence Sensor Tree Senzor prisutnosti | Detektori pokreta i prisutnosti, Senzori | 98,07 € |
| Room Comfort Sensor Air | Senzori, Senzori klime i kvalitete zraka | 90,84 € |

---

**`Osvjetljenje` i `Upravljanje osvjetljenjem` — 9 artikala · 78,86 € – 315,52 €**

Framing line: `Stropne, viseće i stolne svjetljike, LED trake, led bodovi i spotovi te upravljači i regulatori intenziteta.`

| Naziv | Kategorija | Cijena |
| --- | --- | --- |
| LED Ceiling Light RGBW Air | Osvjetljenje, Stropne svjetljike | 315,52 € |
| LED Pendulum Slim RGBW PWM | Osvjetljenje, Viseće svjetljike | 249,97 € |
| Table lamp | Osvjetljenje, Stolne svjetljike | 199,00 € |
| LED strip RGBW | LED trake, Osvjetljenje | 135,72 € |
| Nano Dimmer Air | Regulatori intenziteta, Upravljanje osvjetljenjem | 121,10 € |
| Nano IO Air | Upravljači, Upravljanje osvjetljenjem | 119,00 € |
| RGBW 24V Dimmer Air | Regulatori intenziteta, Upravljanje osvjetljenjem | 92,03 € |
| LED spot RGBW Tree | Led bodovi i spotovi, Osvjetljenje | 85,27 € |
| RGBW 24V Dimmer Tree | Regulatori intenziteta, Upravljanje osvjetljenjem | 78,86 € |

---

**`Audio sustavi` — 6 artikala · 127,43 € – 505,52 €**

Framing line: `Centralne audio jedinice i zvučnici.`

| Naziv | Kategorija | Cijena |
| --- | --- | --- |
| Audio Server | Audio sustavi, Centralne audio jedinice | 505,52 € |
| Install Speaker 7 Master | Audio sustavi, Zvučnici | 299,00 € |
| Stereo Extension | Audio sustavi, Centralne audio jedinice | 252,75 € |
| Surface Box For 10 – Nadogradna kutija za zvučnik | Audio sustavi, Zvučnici | 150,00 € |
| Surface Box For 7 – Nadogradna kutija za zvučnik | Audio sustavi, Zvučnici | 130,00 € |
| Install speaker 7 passive | Audio sustavi, Zvučnici | 127,43 € |

---

**`Aktuatori i pogoni` — 3 artikla · 84,74 € – 114,09 €**

Framing line: `Zasjenjivanje i motorni pogoni za ventile.`

| Naziv | Kategorija | Cijena |
| --- | --- | --- |
| Loxone Shading Actuator Air | Aktuatori i pogoni, Zasjenjivanje | 114,09 € |
| Valve Actuator Air – Motorni pogon za ventile | Aktuatori i pogoni, Ventili | 100,90 € |
| Valve Actuator Tree – Motorni pogon za ventile | Aktuatori i pogoni, Ventili | 84,74 € |

---

**`Pametne utičnice` — 3 artikla · 69,90 € – 76,68 €**

Framing line: `Wireless utičnice.`

| Naziv | Kategorija | Cijena |
| --- | --- | --- |
| Smart Socket Air Type F | Pametne utičnice, Wireless utičnice | 76,68 € |
| Smart Socket Air Type G | Pametne utičnice, Wireless utičnice | 69,90 € |
| Smart Socket Air Type J | Pametne utičnice, Wireless utičnice | 69,90 € |

---

**`Kabeli i konektori` — 4 artikla · 12,07 € – 346,37 €**

Framing line: `Loxone tree kabel i stezaljke.`

| Naziv | Kategorija | Cijena |
| --- | --- | --- |
| Tree Cable (200m) | Kabeli i konektori, Loxone tree | 346,37 € |
| Clamp Tree for NFC / Flex / Intercom (25) | Kabeli i konektori, Stezaljke | 17,25 € |
| Turbo Clamp (25) | Kabeli i konektori, Stezaljke | 12,07 € |
| Loxone Clamp Tree (25) | Kabeli i konektori, Stezaljke | 12,07 € |

---

**`Dodatni materijali` — 3 artikla · 12,84 € – 32,75 €**

Framing line: `Memorija i NFC sustav.`

| Naziv | Kategorija | Cijena |
| --- | --- | --- |
| NFC Key Fob Set (10) | Dodatni materijali, NFC sustav | 32,75 € |
| Encrypted NFC Smart Cards Set (10) | Dodatni materijali, NFC sustav | 32,75 € |
| SD kartica s FirmWareom za Miniserver Gen.1 | Dodatni materijali, Memorija | 12,84 € |

---

*Per-item action label (all 59 rows):* `Upit`

`[missing from context — §5.2 / §9: the source contains no per-item descriptions, specifications, images or stock status for any Loxone article; no SKU-level copy can be written]`

**Visual / layout**

1. **Ten family sections, each opening with a sticky sub-header carrying the family name, item count and price range** — the counts and ranges are the only framing content the source supplies, and pinning them keeps the visitor oriented through a 59-row scroll.
2. **Price emphasis (§0.3) on the price column only, applied per row on hover rather than permanently** — 59 permanently glowing figures would cancel the effect; on-hover keeps the treatment consistent while remaining readable at density.
3. **Reveal pattern (§0.3) applied per table body, not per row** — 59 individually staggered rows would make the page feel slow; one reveal per family keeps motion proportional to the content.
4. **Alternating row shading and a right-aligned price column, one table style shared with `rental-listing` below** — the two inventories sit on one page and must read as one system, even though they are two offers.
5. **A price-basis label in the table header — `Cijena` here, `Cijena/dan` in the rental tables — set in the same position and weight in both** — the source states no VAT, delivery or inclusion basis (§8.8, §4.15), so the one distinction the copy *can* make is per-unit versus per-day. It has to be visible at the header, because a visitor scrolling between two priced tables two screens apart will otherwise compare 655,61 € against 50,00 € as if they meant the same thing.

**Hierarchy and tone**

Section headline = **H2**. Family names = **H3**. Framing lines = `caption`. Table headers = `label`. Tone: **catalogue-neutral**. Framing copy exists only at page and family level and describes nothing beyond the sub-categories the source names; no marketing blurb is written for any individual SKU, because the source contains no per-item content and 59 invented sentences would be the largest fabrication risk in this document.

---

### `rental-intro` — Rental intro · opens the rental half
**Page:** `/webshop` · **Anchor:** `#najam-alata`

**Copy**

*Eyebrow:* `Druga ponuda`

*Headline variants:*

- **A —** `Najam profesionalnog alata, cijena po danu`
- **B —** `16 artikala u najmu, od 10,00 € do 50,00 € po danu`
- **C —** `Najam alata`

*Subheadline:*
`HES se bavi najmom profesionalnog alata. Cijene su po danu. U ponudi je 16 artikala u četiri kategorije.`

*Fact rows:*
- `Broj artikala` — `16`
- `Cijena` — `Po danu, od 10,00 € do 50,00 €`
- `Kategorije` — `4`
- `Marke` — `Bosch (13), K+K (2), Protube (1)`

*Category table:*

| Kategorija | Broj artikala | Cijena po danu |
| --- | --- | --- |
| `Ljestve i skele` | 3 | 16,00 € – 50,00 € |
| `Rezanje i brušenje` | 6 | 16,00 € – 28,00 € |
| `Bušenje i odvijanje` | 6 | 10,00 € – 33,00 € |
| `Usisavači i otprašivanje` | 1 | 28,00 € |

*Microcopy:* `Svi artikli vode se pod kategorijom Najam alata.`

*Alt text:* `Profesionalni alat pripremljen za najam na neutralnoj podlozi.`

`[missing from context — §8.8 / §9: minimum rental period, deposit, VAT treatment, delivery, pick-up and return arrangements are stated nowhere in the source and cannot be summarised here]`

**Visual / layout**

1. **Angled divider (§0.3) — the second and last on this page — plus a full background-field change back to the field used by `partner-status`** — this is the page's real boundary, sharper than the seam inside the Loxone half. A visitor arriving here from the nav's `Najam alata` deep-link lands directly on it, so it has to look like the top of something, not the middle of a page.
2. **Fact rows as the same three-row specification table used on `/` in `industrial`** — one "here are the parameters" component reused across unlike sections.
3. **Four category rows spanning the full width, each linking to its group below — not a sticky rail** — four categories over sixteen items do not earn the space a persistent rail costs, and the Loxone rail has just been released above; re-pinning a different rail immediately would read as the same control changing its mind.
4. **Price emphasis (§0.3) on `10,00 € – 50,00 €` in the fact rows, with `po danu` set at the same size as the figure rather than as a shrunken suffix** — this is the one place where the per-day basis has to survive being compared against per-unit Loxone prices two screens up (§4.15), and shrinking the unit is how price displays usually lose that distinction.

**Hierarchy and tone**

`Druga ponuda` = eyebrow, doing in one word the job of stating that the visitor has crossed into the second half. Headline = **H2**. Fact labels and category names = `label`. Microcopy = `caption`. Tone: **price-first and transactional, formal vi**, addressed to tradespeople and self-builders. There is no attempt to relate this offer to Loxone above it, because the source relates them nowhere.

**Recommended headline: variant B** — count and range in the first line is exactly what this audience is comparing.

**Note.** This is not a hero. The page already has one, and a second full-height hero mid-page would read as a second site. It merges the earlier `hero-rental` and `rental-categories` sections.

---

### `rental-listing` — Rental item listing
**Page:** `/webshop`

**Copy**

*Headline:* `Cjenik najma`

*Subheadline:* `Cijene su po danu. Svi artikli su na stanju.`

---

**`Ljestve i skele` — 3 artikla · 16,00 € – 50,00 €**

| Naziv | Kategorija | Cijena/dan | Marka | Stanje |
| --- | --- | --- | --- | --- |
| PROTUBE-F360 | Ljestve i skele | 50,00 € | Protube | Na stanju |
| K+K 235628 | Ljestve i skele | 20,00 € | K+K | Na stanju |
| K+K 235636 | Ljestve i skele | 16,00 € | K+K | Na stanju |

---

**`Rezanje i brušenje` — 6 artikala · 16,00 € – 28,00 €**

| Naziv | Kategorija | Cijena/dan | Marka | Stanje |
| --- | --- | --- | --- | --- |
| Bosch GTS 10 J Professional | Rezanje i brušenje | 28,00 € | Bosch | Na stanju |
| Bosch GEX 18V-125 | Rezanje i brušenje | 23,00 € | Bosch | Na stanju |
| Bosch GWS 18V-10 | Rezanje i brušenje | 22,00 € | Bosch | Na stanju |
| Bosch GKS 12V-26 | Rezanje i brušenje | 18,00 € | Bosch | Na stanju |
| BOSCH GWS 12V-76 `[data defect — §8.10: this row carries SKU "gws-18v", which does not match the product name; carried as-is]` | Rezanje i brušenje | 18,00 € | Bosch | Na stanju |
| Bosch GRO 12V-35 | Rezanje i brušenje | 16,00 € | Bosch | Na stanju |

---

**`Bušenje i odvijanje` — 6 artikala · 10,00 € – 33,00 €**

| Naziv | Kategorija | Cijena/dan | Marka | Stanje |
| --- | --- | --- | --- | --- |
| Bosch GDS 18V-450 HC | Bušenje i odvijanje | 33,00 € | Bosch | Na stanju |
| Bosch Professional 12 V System `[data defect — §8.10: this is a range name, not a product, and is tagged "gbh"; carried as-is]` | Bušenje i odvijanje | 26,00 € | Bosch | Na stanju |
| Bosch GDR 12V-110 | Bušenje i odvijanje | 18,00 € | Bosch | Na stanju |
| Bosch GSR 18V-55 | Bušenje i odvijanje | 16,00 € | Bosch | Na stanju |
| Bosch-GSR-12V-15-FC | Bušenje i odvijanje | 16,00 € | Bosch | Na stanju |
| Bosch MA 55 – Nastavak magazina za izvijače | Bušenje i odvijanje | 10,00 € | Bosch | Na stanju |

---

**`Usisavači i otprašivanje` — 1 artikl · 28,00 €**

| Naziv | Kategorija | Cijena/dan | Marka | Stanje |
| --- | --- | --- | --- | --- |
| Bosch GAS 12-25 PL | Usisavači i otprašivanje | 28,00 € | Bosch | Na stanju |

---

*Per-item action label (all 16 rows):* `Provjerite dostupnost`

*Alt text (per row, where photos exist):* `[naziv artikla] — profesionalni alat u najmu.`

`[missing from context — §5.1 / §9: the source contains no per-item descriptions, specifications, accessories or images for any rental article; no item-level copy can be written]`

`[missing from context — §9: no rental terms exist and there is no dedicated page for them (legal pages removed from scope); minimum period, deposit, VAT and delivery are unstated, so no terms can be asserted anywhere in this listing]`

**Visual / layout**

1. **Same table style as `family-listing` above — alternating rows, right-aligned price column, one shared component** — the page's two inventories must read as one system even though they are two offers.
2. **All four categories shown in full, stacked, with no tabs** — the opposite of the treatment this listing had when it lived on the landing page. There, tabs existed to stop sixteen rows crowding out the recruitment and contact sections; here the visitor arrived specifically to browse tools and nothing below competes for the space, so hiding three of four categories behind clicks would be pure friction.
3. **`Na stanju` rendered as a small status pill rather than plain text** — availability is the source's one stated fact about condition and the second thing a renter checks after the rate; a pill makes it scannable down a column.
4. **Price emphasis (§0.3) applied per row on hover, matching the Loxone listing** — reused, not re-described.

**Hierarchy and tone**

Headline = **H2**. Category names = **H3**. Table headers = `label`. Tone: catalogue-neutral, identical to the Loxone listing. No item descriptions, no recommendations, no "best for" copy — the source contains none, and sixteen invented blurbs would carry the same fabrication risk as fifty-nine.

---

### `shop-enquiry-cta` — Shared enquiry block
**Page:** `/webshop`

**Copy**

*Headline variants:*

- **A —** `Pošaljite upit`
- **B —** `Recite nam što vas zanima`
- **C —** `Kontaktirajte nas`

*Subheadline:* `Za sve tri vrste upita javite se e-poštom ili telefonom.`

*Three routes:*
- `Za Loxone sustav` — `Projektiramo, montiramo i puštamo sustav u rad. Recite nam o kakvom se objektu radi.` — CTA: `Pošaljite upit` → `/#kontakt`
- `Za Loxone artikl` — `Navedite naziv artikla i količinu.` — CTA: `alen.hranj@hes.hr` → `mailto:alen.hranj@hes.hr`
- `Za najam alata` — `Navedite koji alat trebate i za koje dane.` — CTA: `Provjerite dostupnost` → `/#kontakt`

*Return links:*
- `Natrag na Loxone` → `#loxone`
- `Natrag na najam alata` → `#najam-alata`

*Tertiary CTA:* `00385 99 205 7845` → `tel:0038599 2057845`

`[missing from context — §9: no response time, availability or service commitment exists in the source, so no route can state when a reply arrives]`

> Blocked: §4.2 — the page ends in an enquiry, not a cart. If the client confirms a transactional shop, this block is replaced by a basket — one that would have to hold a purchase and a hire at the same time, which is not a normal commerce pattern and needs its own decision.
> Blocked: §4.14 — the landing page's enquiry form already carries `Najam alata` and `Loxone — prodaja i instalacija` as routing options, so all three routes here resolve to the same form. Whether those submissions are separated on arrival is unanswered.

**Visual / layout**

1. **Dark closing band with the grain layer, split into three labelled routes rather than one CTA with fallbacks** — this block closes a page serving three distinct intents; a single generic CTA would serve none of them, and the route labels do the pre-qualifying the landing page's form would otherwise have to do alone.
2. **The rental route visually grouped apart from the two Loxone routes — a hairline gap, not a third equal column** — two of the three intents are Loxone; presenting the split as even would misrepresent the page.
3. **Two small return links rather than one** — this replaces the retired `catalog-installation-link`. A visitor who scrolled the whole page needs to get back to whichever half they came from, and on a page with two halves a single "back to top" strands half of them.

**Hierarchy and tone**

Headline = **H2**. Route labels = `label`. Tone: formal vi, transactional. Variant A is recommended: with three routes named directly beneath it, the headline's job is to be short and unambiguous, not to characterise the intents — the labels already do that.

---

# 4. Visual Key

One table per page. Effects marked *(reused)* are defined once in §0.3 and are not new work.

### Global

| section id | proposed effect | purpose |
| --- | --- | --- |
| nav | Sticky header with scroll-spy, running on both pages *(reused)* | The only permanent orientation a site of two long pages has |
| nav | Outbound indicator on items 3 and 4 only | Four items scroll, two navigate; without a marker the nav feels unpredictable |
| nav | Anchor scroll offset equal to header height, both pages | Prevents eyebrows hiding under the header — worst on the `/webshop#najam-alata` cold landing |
| footer | Four columns → mobile accordion, dark field + grain *(reused)* | Lets a visitor who scrolled to the bottom jump back without re-scrolling |
| footer | Partner status line on its own row above the columns | Protects the only external credential from becoming a link in a list |
| footer | Visible empty slot where the address block belongs | Makes the missing-data gap structural and visible on the live site |

### Page 1 — `/`

| section id | proposed effect | purpose |
| --- | --- | --- |
| hero | Hero treatment at ~85 vh, not full height *(reused)* | Proves there is more below; a viewport-exact hero is why one-pagers bounce |
| hero | Two-market label strip under the subheadline | Establishes the two-market fact that stops "wrong site" bounces |
| hero | Type-led fallback on dark field + grain | Ships before the photo shoot without resorting to stock imagery |
| service-lines | Card grid, three equal-height columns *(reused)* | Segmentation without implying an unstated priority |
| service-lines | Lighter secondary row for rental + recruitment | Puts all seven anchors within two screens; the page's main navigability device |
| service-lines | Card 3 CTA styled as outbound, matching the nav | Keeps the navigating cards from feeling arbitrary |
| scope-strip | Three steps on one connected hairline rule, under half a screen | States the chain economically without pushing `industrial` off screen two |
| scope-strip | Reveal stagger in delivery order *(reused)* | Motion carries the sequence meaning |
| scope-strip | No divider — field change only | Divider budget is spent on audience changes, not subject changes |
| industrial | Sticky split-screen — 1 of only 2 on the site | Keeps the longest line section reading as one argument, not four blocks |
| industrial | Three-row fact table with hairline rules | Reads as specification; does the disqualifying work before the CTA |
| industrial | Muted narrow inset for the recruitment cross-link | Findable by candidates, skippable on sight by buyers |
| finishing-works | Card grid, seven photo + name cards *(reused)* | Item-matching is the qualifying behaviour for this line |
| finishing-works | Text-only fallback keeping card proportions | Ships pre-shoot without collapsing into a bullet list |
| finishing-works | `ključ u ruke` accented inside the headline | The only delivery-model claim earns the emphasis treatment, once |
| finishing-works | Warmer background field marking the audience change | Section rhythm does the work a divider would otherwise cost |
| residential-electrical | Deliberately the shortest section — two blocks, no grid | Honest treatment of a line the source describes in one service |
| residential-electrical | Shares the field with `finishing-works` above | States "one business line, two services"; retires the v1 cross-sell section |
| residential-electrical | Split band with the partner badge reused *(reused)* | One credential, one rendering, everywhere |
| loxone-teaser | Full-width dark band, wordmark above headline, unframed | Carries the site's entire trust budget; a card would spend it as one of four |
| loxone-teaser | Accent glow behind wordmark and price range *(reused)* | Emphasis system serving credibility as well as commerce |
| loxone-teaser | The page's most prominent CTA after the hero's | One of two outbound handoffs; must not look like an inline scroll CTA |
| rental-teaser | Two-column split, category list left, image right | Reads as a different kind of thing from the three ranked categories |
| rental-teaser | Price emphasis on the range only *(reused)* | One focal figure; four glowing ranges would flatten into noise |
| rental-teaser | Compact — half the height of any line section, no divider | A discovery block, not a catalogue; sized to that job |
| rental-teaser | Outbound CTA matching `loxone-teaser` | The page's two exits must look identical |
| jobs | Angled divider + darkest field on the page *(reused)* | 1 of 2 on the page: the sharpest audience switch, happening mid-scroll |
| jobs | Two roles side by side, both expanded on mobile *(reused)* | Lets a candidate compare roles by scanning one column |
| jobs | Hard requirement in accent, advantages muted | Self-assessment in seconds without reading every row |
| jobs | Price emphasis on the rate, twice *(reused)* | The one number on the page allowed to repeat |
| contact | Angled divider + dark closing field *(reused)* | 2 of 2; signals the page has ended so the footer is not read as a section |
| contact | Positioning line centred, unquoted, accent glow *(reused)* | The company speaking, not a testimonial the source lacks |
| contact | Channels left at heading scale, form right | Phone-first audience gets the number without scrolling past a form |
| contact | Six visible radio chips instead of a dropdown | Routing is the point; a dropdown hides that six things exist |

### Page 2 — `/webshop`

| section id | proposed effect | purpose |
| --- | --- | --- |
| hero-shop | Hero treatment at ~60 vh *(reused)* | Its only job is "two things live here"; height here is stolen from the selector |
| hero-shop | True 50/50 fact blocks, neither weighted | Stops a tradesman concluding they landed on a smart-home page |
| hero-shop | Type-led fallback, fact blocks as the whole hero | The hardest shot on the list — one image credibly showing both inventories |
| shop-nav | Two equal cards filling the screen under the hero *(reused)* | Segmentation must precede two unrelated inventories |
| shop-nav | Card 1 carries the partner badge, card 2 carries `na stanju` | Each half leads with the strongest thing it actually has |
| shop-nav | Collapses to a pinned two-state segmented control on scroll | Keeps the selector reachable and solves the two-active-nav-items problem |
| partner-status | Credential band reused from `/` *(reused)* | Two renderings of one credential would look inconsistent |
| partner-status | Opens the Loxone half with a full field change | Makes the selector's two cards feel like they led somewhere |
| loxone-offer | Two equal columns divided by one vertical rule | Separates two conflated things without box competition |
| loxone-offer | Reveal firing on both columns simultaneously *(reused)* | A stagger would imply a rank the source does not state |
| loxone-system-scope | Sticky split-screen — 2 of only 2 on the site *(reused)* | A pinned controller with ten groups passing it pictures the system |
| loxone-system-scope | Numbered family list, no per-family icons | Ten icons would need ten assets the client does not have |
| loxone-audience | Split band using the divider rotated vertical *(reused)* | Reuses the divider language instead of inventing a device |
| loxone-audience | No imagery, minimal height | Broadens the audience without delaying the seam |
| loxone-catalog-intro | Angled divider — 1 of 2 on this page *(reused)* | The seam inside the Loxone half: reading mode → browsing mode |
| loxone-catalog-intro | Three-fact band, price emphasis in the headline only *(reused)* | Removes the scroll needed to learn what a 59-SKU list contains |
| loxone-catalog-intro | Partner badge repeated, third and last time | Makes the price list legible as a partner's, at the moment it matters |
| category-nav | Sticky rail released at the rental half | A Loxone family rail beside a Bosch grinder reads as a broken filter |
| category-nav | Sub-categories revealed on hover/tap | 25 simultaneous names would be a worse index than the 10 it replaces |
| family-listing | Sticky family sub-header with count and range | The only framing content the source supplies, kept in view |
| family-listing | Price emphasis per row on hover *(reused)* | 59 permanent glows would cancel the effect |
| family-listing | Reveal per table body, not per row *(reused)* | Motion proportional to content volume |
| family-listing | Table style shared with `rental-listing` *(reused)* | Two inventories on one page must read as one system |
| family-listing | Price-basis label in the table header — `Cijena` vs `Cijena/dan` | The one distinction the copy can make when §8.8 blocks every other qualifier |
| rental-intro | Angled divider — 2 of 2 — plus a full field change *(reused)* | The page's real boundary; a deep-link lands here and must look like a top |
| rental-intro | Fact table reused from `industrial` on `/` *(reused)* | One "here are the parameters" component across unlike sections |
| rental-intro | Four full-width category rows, no sticky rail | Four categories do not earn a rail, and the Loxone rail just released |
| rental-intro | `po danu` set at the same size as the figure | Stops the per-day basis being lost against per-unit prices two screens up |
| rental-listing | Table style shared with `family-listing` *(reused)* | One system across both inventories |
| rental-listing | All four categories in full, no tabs | Opposite of the landing-page treatment: nothing below competes for space |
| rental-listing | `Na stanju` as a status pill | The second thing a renter checks after the rate, made scannable |
| rental-listing | Price emphasis per row on hover *(reused)* | Matches the Loxone listing exactly |
| shop-enquiry-cta | Dark closing band split into three labelled routes | Three intents; one generic CTA would serve none of them |
| shop-enquiry-cta | Rental route grouped apart by a hairline gap | Two of three intents are Loxone; an even split would misrepresent the page |
| shop-enquiry-cta | Two return links, not one | Replaces the retired v1 `catalog-installation-link`; one link strands half the page |

---

# 5. Missing data — every `[missing from context]` marker in this file

20 markers. Each is a request for client input; none has been filled with a plausible sentence.

| # | Page | Section | What is missing | Source ref |
| --- | --- | --- | --- | --- |
| 1 | Global | nav | Which language versions launch and which content exists in each | §9 |
| 2 | Global | footer | Address, registered seat, OIB, working hours, service radius | §9 |
| 3 | `/` | industrial | Reference projects, client names, project photos, case studies | §9 |
| 4 | `/` | industrial | Who commissions industrial cabinets in Germany | §9 |
| 5 | `/` | finishing-works | What the "ključ u ruke" scope actually includes | §8.3, §9 |
| 6 | `/` | finishing-works | Prices, price ranges or units of measure for finishing works | §9 |
| 7 | `/` | finishing-works | Service radius / geographic coverage in Croatia | §9 |
| 8 | `/` | residential-electrical | An itemised service list for household electrical installations | §9 |
| 9 | `/` | loxone-teaser | Partner level, partner ID, certificate, licence, date of authorisation | §9 |
| 10 | `/` | jobs | What an application should contain, whether a form is needed, routing, reply | §9 |
| 11 | `/` | contact | Privacy consent line — no privacy policy exists to link to | §9 |
| 12 | `/` | contact | Address, registered seat, OIB, working hours, service radius | §9 |
| 13 | `/` | contact | Where enquiries are routed and whether a reply is promised | §9 |
| 14 | `/` | contact | Response time, availability or any service commitment | §9 |
| 15 | `/webshop` | partner-status | Partner level, partner ID, certificate, licence, date of authorisation | §9 |
| 16 | `/webshop` | loxone-catalog-intro | VAT treatment, delivery terms, stock status, installation inclusion | §8.8, §9 |
| 17 | `/webshop` | family-listing | Per-item descriptions, specifications, images, stock status (59 SKUs) | §5.2, §9 |
| 18 | `/webshop` | rental-intro | Minimum rental period, deposit, VAT, delivery, pick-up location | §8.8, §9 |
| 19 | `/webshop` | rental-listing | Per-item descriptions, specifications, accessories, images (16 items) | §5.1, §9 |
| 20 | `/webshop` | shop-enquiry-cta | Response time — no route can state when a reply arrives | §9 |
| — | Site-wide | §0.2 | All photography — no images of any kind exist in the source | §9 |

**Launch blockers.** Markers 11 and 13 block the enquiry form in `contact` — the site's only form. Marker 18 blocks any rental-terms claim in `rental-listing`.

Moving rental into the shop has **concentrated** these rather than reduced them: `/webshop` now holds six of the twenty, including both price-basis gaps. That page shows a visitor two catalogues, on two different pricing bases, and cannot state what either figure includes.

**Known export defects carried as-is (§8.10), never silently corrected:**

| Row | Location | Defect |
| --- | --- | --- |
| `Dali extension – 64 uređaja` | `/webshop` → family-listing | Brand missing while every other Loxone row carries one |
| `Presence Sensor Air Senzor pristunosti` | `/webshop` → family-listing | "pristunosti" misspells "prisutnosti" |
| `BOSCH GWS 12V-76` | `/webshop` → rental-listing | Carries SKU "gws-18v", which does not match the product name |
| `Bosch Professional 12 V System` | `/webshop` → rental-listing | A range name, not a product; tagged "gbh" |
| `ggrađevinske` | source prose only | Corrected to `građevinske` in newly authored copy, since that sentence is written here |
