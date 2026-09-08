---
source_context: HES/hes-brand-context.md
date_generated: 2026-08-02
date_revised: 2026-08-02
revision: v2 — landing-page architecture. Supersedes the v1 eleven-page multipage tree.
purpose: Information architecture for the HES website redesign — pages, sections and their order only. No copy, no visual design, no markup.
scope: One landing page + one webshop page (Loxone service, Loxone catalogue, tool rental catalogue). Single primary language version.
---

## 0. Reading this document

Every section below is traceable to `HES/hes-brand-context.md`; the § references point back to it. Where the source has no data, no section was created — the gap is recorded in **§4 Blocked decisions** instead. Croatian source terms are kept verbatim in quotes.

URL paths are written in Croatian because Croatian is the only language in which content actually exists (§8.11 leaves the HR/DE/EN scope undecided). The tree itself is language-neutral; see §3 for the switch point.

### 0.1 What changed in v2, and why

v1 of this document defined an eleven-page multipage tree: a homepage, a services hub, four service line pages, two catalogue pages, a recruitment page, a contact page and three legal pages. **That is superseded.** The client's decision is a **landing page**: the business lines, the tool rental catalogue, the recruitment offer and the contact endpoint are all **sections of `/`**, not pages.

One thing stays off the landing page:

- **The webshop** — everything with inventory and prices. The Loxone service line, the 59-SKU Loxone catalogue **and the 16-item tool rental catalogue** merge into **one page at `/webshop`**.

**Total: 2 URLs.** Nothing from v1 is deleted as content — every v1 section is folded into a landing-page section or a webshop section. §5 carries the full v1 → v2 mapping so nothing can be lost in the move.

**Revision within v2.** An earlier draft of this document kept the tool rental catalogue as a landing-page section and gave Loxone a page of its own at `/loxone`. The client has moved rental into the shop. The consequences are recorded throughout: `/loxone` becomes `/webshop`, the landing page keeps rental only as a teaser, and the shop page now carries two unrelated inventories under one roof — see §2.2 and §4.20.

---

## 1. Sitemap

| Page name | URL path | Purpose | Primary audience | Priority |
| --- | --- | --- | --- | --- |
| Landing | `/` | Carry the whole business — three ranked lines, recruitment and the contact endpoint — in one scrollable page, and hand off to the webshop. | All — mixed entry point | Primary |
| Webshop — Loxone i najam alata | `/webshop` | Sell Loxone system design, sale and installation off the authorised-partner status; list the 59 Loxone SKUs by product family with prices; **and** list the 16 rental tools by category with day rates. Everything the company sells or hires by the unit. | Buyers decided on Loxone (§5.2); homes and business premises, Croatia (§3.3); tradespeople and self-builders, Croatia (§3.4, §5.1) | Primary |

**Justification of the split.** The source ranks the business explicitly — "glavna i primarna djelatnost" is industrial electrical installations in Germany (§3.1), finishing works plus residential electrical installations in Croatia are second (§3.2), Loxone sale and installation is third (§3.3), and tool rental sits outside the stated three-category hierarchy (§3.4, §8.1). The split is **not** by rank. It is by **what the visitor is doing**: reading about a service they will commission, or browsing priced units they will order.

**The landing page holds everything that is read.** Three service lines the source describes in prose — one deliverable and a process for the industrial line, a seven-item works list for finishing, a single service for residential electrical — plus the recruitment offer and the contact endpoint. None of those has inventory, none needs filtering, and each is short enough to be complete in a section.

**The webshop holds everything that is browsed.** 59 Loxone SKUs across ten families with a 54× price spread (§5.2) and 16 rental tools across four categories (§5.1) are both browsing tasks: they need category navigation, grouped listings, per-item actions and, if §4.2 resolves transactional, per-item pages. Putting either inside a landing-page section would truncate the catalogue or bury the service lines beneath it.

**Why Loxone's service content goes to the shop rather than staying on the landing page.** Loxone is the one business line whose service and whose inventory are the same offer — HES sells the components *and* installs them (§3.3, §4). Splitting them puts the partner credential on one page and the price list on another, which is exactly the defect the v1 tree had: two pages cross-referencing each other in both directions (v1 `catalog-entry` and v1 `catalog-installation-link`). The credential has to sit adjacent to the prices it licenses, so the service content travels with the catalogue.

**Tool rental has no service content to travel with it.** The source says one thing about it — "HES se bavi najmom alata" (§3.4) — and then gives sixteen priced rows. It is pure inventory, which is why it moves cleanly and why the landing page keeps only a teaser.

**Recruitment loses its page but not its treatment.** It addresses a second audience with its own conversion action, running permanently (§2, §6), so on the landing page it gets a full section with both roles, the six offer items and its own application step — and a top-level nav anchor, so a candidate never has to scroll the services to reach it.

There is deliberately **no "O nama" section**: the source supplies no founding year, history, team, references, certificates or guarantees (§9), and the only existing "O nama" text is marked outdated and not for reuse (§7). See §4.

---

## 2. Per-page section breakdown

### 2.1 Landing — `/`

**Primary CTA of the page:** contact enquiry (email / phone, §2).
**Section count:** 10. Every section is an anchor target; §3.1 nav links to them directly.

1. **Hero — `hero`**
   - *Purpose:* State in one screen what HES does and in which markets, so a visitor who arrived from any of four different intents knows they are in the right place.
   - *Content mapping:* Company identity and short brand "HES" (§2); the two markets — Germany for industrial electrical installations, Croatia for finishing works, residential electrical and Loxone (§2); the stated specialisms, electrical installations and Loxone smart-home systems, covering design, assembly and commissioning (§2, §7 "Od projektiranja, montaže pa do puštanja u rad.").
   - *Position:* First, because the source's own defining fact is that HES is a multi-line, two-market business; failing to establish that immediately makes every downstream section look like a mismatch.

2. **Business line selector — `service-lines`**
   - *Purpose:* Let the visitor self-select into one of the three ranked lines before reading anything else, and — on a single page — give them a jump target so they are not forced to scroll past two-thirds of the content that does not concern them.
   - *Content mapping:* The three categories in the source's own order — industrial electrical installations, Germany (§3.1); finishing works and residential electrical installations, Croatia (§3.2); Loxone sale and installation, Croatia (§3.3). Anchors to `#industrijske-elektroinstalacije`, `#zavrsni-radovi`, `#kucne-elektroinstalacije`; links out to `/webshop` and `/webshop#najam-alata`.
   - *Position:* Directly under the hero. With three unrelated audiences on one page, segmentation is the highest-value action available and must precede any depth. **This section does more work in v2 than it did in v1:** on a multipage tree it routed to pages, here it is the only defence against a long scroll.

3. **End-to-end scope statement — `scope-strip`**
   - *Purpose:* Establish that HES covers the full delivery chain rather than a single trade step, which is the one capability claim common to all three lines.
   - *Content mapping:* "projektiranje, montaža, puštanje u rad" for all types of electrical installations (§3.1, §4, §7).
   - *Position:* After segmentation, as the shared proof that applies whichever line the visitor picked. **Stated once here and not repeated inside the line sections** — on a single page the v1 duplication between `process-industrial` and `process-residential` becomes visible repetition, so the claim is centralised.

4. **Line 1 — Industrijske elektroinstalacije — `industrial`**
   - *Purpose:* Sell the main and primary activity: industrial electrical cabinets and installations in Germany, and disqualify the wrong enquiries before they reach the contact form.
   - *Content mapping:* §3.1 — "glavna i primarna djelatnost HES-a su električne instalacije", most work executed in Germany, "isključivo … industrijskim električnim rješenjima"; the deliverable "industrijski elektro ormari za različita trošila, sustave" and wiring and integration of those cabinets (§3.1, §4); market and customer type from the §2 market table, restricted strictly to industrial scope (§8.2); the recruitment cross-link, since "this is the line the recruitment campaign staffs" (§3.1) — anchor to `#zaposlenje`.
   - *Position:* First of the three lines because the source names it "glavna i primarna djelatnost" (§3.1); the page must not reorder the client's stated hierarchy.
   - *Internal block order:* primacy claim → deliverable → market and customer type → capacity cross-link → inline enquiry CTA.

5. **Line 2a — Završni građevinski radovi — `finishing-works`**
   - *Purpose:* Sell turnkey finishing construction works in Croatia, and let a private client find their specific job in a list.
   - *Content mapping:* §3.2 — "od nedavno" active in Croatia, mainly finishing construction works; "po principu ključ u ruke" (§3.2, §7); the seven service items in §4 — Knauf plasterboard walls, ceramic tiling, laminate/parquet and other floors, decorative stone gluing, window sills ("klupčice"), decorative mouldings ("ukrasne lajsne"), assorted repairs within finishing works.
   - *Position:* Second, matching the source's rank order.
   - *Internal block order:* turnkey statement → seven-item works inventory → inline enquiry CTA. The turnkey scope is stated for finishing works only; the source does not extend it to electrical or Loxone work (§8.3), so it stays inside this section's boundary.

6. **Line 2b — Kućne elektroinstalacije — `residential-electrical`**
   - *Purpose:* Sell household electrical installations, a stated specialism, in Croatia.
   - *Content mapping:* §3.2 — "rade i kućne elektro instalacije (specijalizirani su za to)"; §4 household electrical installations; §7 "Specijalizirani smo za električne instalacije".
   - *Position:* Third, kept adjacent to `finishing-works` because §3.2 treats both as a single category serving the same customer type. A renovation client is the natural buyer of both, and on one page that adjacency does the cross-sell that v1 needed a dedicated `related-residential-electrical` section to achieve.
   - *Internal block order:* specialism claim → what the service covers → smart-home extension pointing to `/webshop` → inline enquiry CTA. The process chain is **not** restated here; `scope-strip` carries it.

7. **Line 3 — Loxone smart home — `loxone-teaser`**
   - *Purpose:* Carry the authorised-partner credential — the only verifiable external credential the source contains — and hand off to the Loxone half of `/webshop`.
   - *Content mapping:* §3.3 — third activity arising from authorised Loxone partner status, sale of components and installation in Croatia; "ovlašteni partneri firme Loxone" (§2, §3.3, §7); customer type "domove i poslovne prostore" (§3.3); catalogue scale, 59 items, 12,07 € – 655,61 € (§5.2). Links to `/webshop`.
   - *Position:* Fourth, matching the source's rank order, and mid-page — this is the **only** verifiable external credential the source contains (there are no reviews, ratings, certificates, references or guarantees, §9), so it carries the trust load alone and must not be buried near the footer.
   - *Note:* this section absorbs v1's standalone `loxone-partner` credential band. The credential appears once on the landing page and again on `/webshop`, where it licenses the price list beneath it.

8. **Tool rental teaser — `rental-teaser`**
   - *Purpose:* Keep the fourth activity visible on the page that carries the business, without holding its inventory. It has real revenue but no rank, and a visitor who does not know HES hires tools will never think to open a shop to find out.
   - *Content mapping:* "HES se bavi najmom alata" (§3.4); §5.1 — rental of professional tools, priced per day in EUR, 16 items, range 10,00 € – 50,00 €, the four category names "Ljestve i skele", "Rezanje i brušenje", "Bušenje i odvijanje", "Usisavači i otprašivanje" with counts and ranges, brands Bosch (13), K+K (2), Protube (1). Links to `/webshop#najam-alata`. **The sixteen-row listing itself is not here** — it lives in `rental-listing` on `/webshop`.
   - *Position:* Below the three ranked lines, because the source itself declines to place rental inside the hierarchy (§3.4, §8.1); ranking it higher would invent a priority the client never stated.
   - *Internal block order:* offer and pricing basis → four categories with counts and ranges → link to the shop.
   - *Note:* this is a **discovery** section, not a catalogue section. Its whole function is that "HES rents tools" is not derivable from the three service lines above it, so the fact has to appear on the page every visitor lands on.

9. **Recruitment — `jobs`**
   - *Purpose:* Convert the standing, always-open recruitment call into applications, without diverting buyers.
   - *Content mapping:* §2 — "Continuously accepting applications and CVs for workers in Germany"; §6 — standing call to action, two roles; §6.1 "Električari i pomoćnici" — driving licence category B as a hard requirement, German language an advantage not a condition, work experience and working from drawings and schematics an advantage not a condition; §6.2 "Radnici u radionici" — prior knowledge not required, desirable but not obligatory, the company trains ("sve te naučimo"); §6.3 — the six offer items including the hourly rate 10–15 € depending on prior knowledge; application routes alen.hranj@hes.hr and 00385 99 205 7845 (§2).
   - *Position:* Late on the page, after all four commercial lines. Candidates are a distinct audience who will use the nav anchor or scan to the bottom; buyers should not meet a job ad before they have met the services.
   - *Internal block order:* standing-call statement → role 1 → role 2 → offer grid → application step. The no-experience role follows the skilled one, which widens the funnel rather than diluting the first listing.

10. **Contact — `contact`**
    - *Purpose:* Close the page with the conversion action, and pre-route enquiries by business line so mixed traffic does not arrive as undifferentiated email.
    - *Content mapping:* alen.hranj@hes.hr and 00385 99 205 7845 — the only contact data that exists (§2); domain hes.hr; legal name "Hranj electrical services d.o.o."; routing options drawn from the actual lines — industrial electrical installations (§3.1), finishing construction works (§3.2), residential electrical installations (§3.2), Loxone sale and installation (§3.3), tool rental (§3.4); the client's own positioning line (§7). No address, registered seat, opening hours or service radius are stated anywhere in the source (§9), so none appear.
    - *Position:* Last, as the terminal action after all five entry points have been offered.
    - *Internal block order:* positioning line → two direct channels → enquiry form with line routing.
    - *Note:* v1's `contact-jobs-split` is dropped. On a single page the recruitment section sits immediately above this one, so a candidate redirect here would point at content the visitor just scrolled through.

---

### 2.2 Webshop — Loxone i najam alata — `/webshop`

**Primary CTA of the page:** system enquiry / RFQ, product enquiry and rental availability enquiry. (Whether this page should instead end in a cart and checkout is unresolved — §9, see §4.2.)
**Section count:** 12. The page runs **hero → shop selector → Loxone (service, then catalogue) → rental catalogue → shared enquiry**.

**The organising decision.** This page carries two inventories that share nothing: Loxone components are *bought*, rental tools are *hired*; one is a smart-home system sold to homeowners and businesses, the other is professional equipment hired by tradespeople; one has service content attached, the other has none. They are not interleaved and they are not presented as one catalogue. The page is **two clearly separated halves with a selector at the top**, and the only things they share are the header, the enquiry block and the visual system.

1. **Shop hero — `hero-shop`**
   - *Purpose:* State that this page holds both offers, so a visitor who arrived for tools is not convinced they landed on a smart-home page, and vice versa.
   - *Content mapping:* §3.3 Loxone sale and installation; §3.4 "HES se bavi najmom alata"; §5.2 — 59 items, 12,07 € – 655,61 €; §5.1 — 16 items, 10,00 € – 50,00 € per day.
   - *Position:* First.
   - *Note:* replaces v1/v2-draft `hero-loxone`. The hero can no longer be Loxone-only, because half the page is not Loxone.

2. **Shop selector — `shop-nav`**
   - *Purpose:* Split the two audiences within the first screen, exactly as `service-lines` does on the landing page.
   - *Content mapping:* Two destinations — Loxone (59 items, 10 families, §5.2) and Najam alata (16 items, 4 categories, §5.1). Anchors to `#loxone` and `#najam-alata`.
   - *Position:* Second. With two unrelated inventories on one page, segmentation must precede either of them; without it a tradesman looking for a Bosch angle grinder scrolls through a smart-home system first.
   - *Note:* new section, created by the merge. It has no v1 or v2-draft ancestor.

3. **Loxone partner status — `partner-status`**
   - *Purpose:* Provide the authorisation credential that separates HES from unauthorised installers, and license the price list that follows.
   - *Content mapping:* "ovlašteni partneri firme Loxone" (§2, §3.3, §7); §3.3 — "treća djelatnost proizlazi iz činjenice da su ovlašteni partneri firme Loxone".
   - *Position:* Third, opening the Loxone half. It is both the credential and the stated origin of the business line, so it must be adjacent to the claim it licenses — and on a page that sells product, it is what makes the price list read as a partner's price list rather than a shop of unknown origin.

4. **What HES does with Loxone — `loxone-offer`**
   - *Purpose:* Separate the two things sold in this half: components and installation.
   - *Content mapping:* §3.3 — sells Loxone components and installs them in Croatia; §4 — sale of Loxone components, installation of Loxone smart-home systems; §7 "Od projektiranja, montaže pa do puštanja u rad."
   - *Position:* Fourth. One column leads down to the Loxone catalogue, the other across to the enquiry.

5. **System components overview — `loxone-system-scope`**
   - *Purpose:* Show the breadth of the system HES can build before the visitor enters the price list.
   - *Content mapping:* The ten product families of §5.2 — Miniservers, Extensions, Touch devices & buttons, Sensors, Lighting & lighting control, Audio, Actuators, Smart sockets, Cables & clamps, Accessories — and the source's Croatian category tree top level ("Miniserveri", "Proširenja", "Doticajni uređaji i tipkala", "Senzori", "Osvjetljenje", "Audio sustavi", "Aktuatori i pogoni", "Pametne utičnice", "Kabeli i konektori", "Dodatni materijali").
   - *Position:* Fifth, as the bridge from service to inventory. The ten family names introduced here are the same ten used by `category-nav` below.

6. **Customer types — `loxone-audience`**
   - *Purpose:* State that the Loxone line serves both private homes and business premises.
   - *Content mapping:* §3.3 customer type — "domove i poslovne prostore". Used as an audience fact only; the legacy "O nama" wording it derives from is marked do-not-reuse (§7).
   - *Position:* Sixth; it broadens the qualified audience just before the Loxone catalogue opens.

7. **Loxone catalogue intro — `loxone-catalog-intro`**
   - *Purpose:* Frame the scale and price span before the visitor starts filtering.
   - *Content mapping:* §5.2 — 59 items, price range 12,07 € – 655,61 €, all sold and installed by HES; authorised partner status (§2).
   - *Position:* Seventh — the seam inside the Loxone half, where service content ends and inventory begins.
   - *Note:* replaces v1 `catalog-intro` and the v2-draft `shop-intro`, which was renamed because "shop intro" now belongs to the page, not to Loxone.

8. **Loxone category navigation — `category-nav`**
   - *Purpose:* Reduce 59 items to a browsable subset.
   - *Content mapping:* The source's two-level Croatian category tree (§5.2): "Miniserveri → Upravljačke jedinice"; "Proširenja → Ulazna / Izlazna / Komunikacijska / Specijalizirana proširenja"; "Doticajni uređaji i tipkala → Touch osnovna serija, Touch pure serija, NFC i sigurnost, Daljinsko upravljanje"; "Senzori → Detektori pokreta i prisutnosti, Senzori klime i kvalitete zraka, Ostali senzori"; "Osvjetljenje → Stropne / Viseće / Stolne svjetljike, LED trake, Led bodovi i spotovi" plus "Upravljanje osvjetljenjem → Upravljači, Regulatori intenziteta"; "Audio sustavi → Zvučnici, Centralne audio jedinice"; "Aktuatori i pogoni → Zasjenjivanje, Ventili"; "Pametne utičnice → Wireless utičnice"; "Kabeli i konektori → Stezaljke, Loxone tree"; "Dodatni materijali → Memorija, NFC sustav".
   - *Position:* Eighth, above the listing. With ten families and a 54× price spread, filtering must precede items.

9. **Loxone family listings — `family-listing`**
   - *Purpose:* Present the Loxone inventory grouped so a visitor can compare within a family.
   - *Content mapping:* The ten families with their item counts and price ranges (§5.2 table) and their items with name, source category and price from Appendix B — Miniservers 3 items 393,62 € – 655,61 €; Extensions 13 items 108,61 € – 573,88 €; Touch devices & buttons 9 items 90,84 € – 302,27 €; Sensors 6 items 90,84 € – 246,70 €; Lighting & lighting control 9 items 78,86 € – 315,52 €; Audio 6 items 127,43 € – 505,52 €; Actuators 3 items 84,74 € – 114,09 €; Smart sockets 3 items 69,90 € – 76,68 €; Cables & clamps 4 items 12,07 € – 346,37 €; Accessories 3 items 12,84 € – 32,75 €.
   - *Position:* Ninth, closing the Loxone half.

10. **Rental intro — `rental-intro`**
    - *Purpose:* Open the second half, state the offer and its pricing basis, and let the visitor jump to the tool type they need.
    - *Content mapping:* §3.4 "HES se bavi najmom alata"; §5.1 — rental of professional tools, priced per day in EUR, 16 items, range 10,00 € – 50,00 €, brands Bosch (13), K+K (2), Protube (1); the four categories "Ljestve i skele" (3 items, 16,00 € – 50,00 €), "Rezanje i brušenje" (6, 16,00 € – 28,00 €), "Bušenje i odvijanje" (6, 10,00 € – 33,00 €), "Usisavači i otprašivanje" (1, 28,00 €); all rows carry the parent category "Najam alata".
    - *Position:* Tenth, opening the rental half at anchor `#najam-alata`. It follows Loxone rather than preceding it because Loxone is a ranked business line (§3.3) and rental is explicitly outside the hierarchy (§3.4, §8.1) — the page order preserves the source's own treatment.
    - *Note:* merges v1 `hero-rental` and v1 `rental-categories`. It is not a hero: this page already has one, and a second full hero mid-page would read as a second site.

11. **Rental item listing — `rental-listing`**
    - *Purpose:* Give the renter name, rate, brand and availability in one row.
    - *Content mapping:* All 16 items from Appendix A with name, category, price/day and brand, grouped by the four source categories; the source states all items are In stock (§5.1). No rental-terms link — the source states no minimum rental period, deposit, VAT treatment or delivery arrangement (§8.8) and asks who supplies rental terms (§9), so no terms are asserted and there is no dedicated page to point to.
    - *Position:* Eleventh, closing the rental half.
    - *Note:* absorbs v1 `rental-terms-link` as a block rather than a section — on a page this long a one-line pointer does not warrant a section of its own.

12. **Shared enquiry block — `shop-enquiry-cta`**
    - *Purpose:* Convert all three intents this page serves — a Loxone system enquiry, a Loxone item enquiry and a rental availability enquiry — into contact.
    - *Content mapping:* §2 contact data; anchor to `/#kontakt`.
    - *Position:* Last, shared by both halves.
    - *Note:* merges v1 `loxone-enquiry-cta`, v1 `catalog-enquiry-cta` and v1 `rental-enquiry-cta`. v1 `catalog-installation-link` stays dropped: it existed to send component browsers to the Loxone service page, which is now the top of this same page, so an in-page return link inside this block replaces it.

---

## 3. Global navigation and footer

### 3.1 Main navigation, in order

| # | Nav item | Points to | Level |
| --- | --- | --- | --- |
| 1 | HES (wordmark) | `/` (top of page) | Top-level |
| 2 | Usluge | `/#usluge` | Top-level, with dropdown |
| 2a | Industrijske elektroinstalacije | `/#industrijske-elektroinstalacije` | Dropdown item |
| 2b | Završni radovi | `/#zavrsni-radovi` | Dropdown item |
| 2c | Kućne elektroinstalacije | `/#kucne-elektroinstalacije` | Dropdown item |
| 3 | Loxone smart home | `/webshop` | Top-level |
| 4 | Najam alata | `/webshop#najam-alata` | Top-level |
| 5 | Zaposlenje | `/#zaposlenje` | Top-level |
| 6 | Kontakt | `/#kontakt` | Top-level, final item |

**Anchor IDs.** On `/`: `#usluge` → `service-lines`, `#industrijske-elektroinstalacije` → `industrial`, `#zavrsni-radovi` → `finishing-works`, `#kucne-elektroinstalacije` → `residential-electrical`, `#najam-alata` → `rental-teaser`, `#zaposlenje` → `jobs`, `#kontakt` → `contact`. On `/webshop`: `#loxone` → `partner-status` (the top of the Loxone half), `#najam-alata` → `rental-intro`. Section IDs are the build's internal names; anchor slugs are the public URL fragments.

**Note the deliberate anchor collision.** `#najam-alata` exists on both pages: on `/` it opens `rental-teaser`, on `/webshop` it opens `rental-intro`. The nav points at the shop's. This is intentional — one concept, one fragment name, two depths — and it means a stale link to `/#najam-alata` still lands somewhere sensible.

**Notes on the order.** Items 2a–2c follow the source's stated ranking (§3.1 → §3.2). Items 3 and 4 point at **the same page** at different anchors: Loxone lands at the top, rental deep-links to the second half. They are kept as two separate nav items rather than one "Webshop" item because the visitor searches for what they want — a Loxone system or a Bosch grinder — not for the container it lives in, and "Webshop" as a label tells a tradesman nothing about whether tools are behind it. Tool rental stays outside "Usluge" because it is not part of the three-category service hierarchy (§3.4, §8.1). "Zaposlenje" is top-level because the recruitment call is permanent (§2) and addresses a second audience. There is no "O nama" nav item — see §4.

**Cross-page behaviour, mandatory.** From `/webshop` and from the three legal pages, every landing-page anchor must resolve to `/#anchor`, not `#anchor`. On `/`, item 2's dropdown and items 5–6 scroll in-page; items 3 and 4 navigate. On `/webshop`, items 3 and 4 scroll in-page. Scroll-spy runs on both `/` and `/webshop`, and on `/webshop` it must set the active nav item to *Loxone smart home* or *Najam alata* depending on which half is in view — otherwise two nav items appear active on one page.

### 3.2 Footer

Built strictly from data that exists:

- **Contact:** alen.hranj@hes.hr; 00385 99 205 7845 (§2).
- **Navigation mirror:** the three landing-page service lines as anchors (§3.1–§3.2), Loxone smart home and Najam alata as links into `/webshop`, Zaposlenje, Kontakt.
- **Partner status line:** "ovlašteni partneri firme Loxone" (§2, §3.3, §7). Waldner is named as a partner in §2 but the relationship is never explained (§8.5), so it is not placed in the footer — see §4.
- **Company identifier:** legal name "Hranj electrical services d.o.o." (§2).

Not in the footer, because the source does not contain them: postal address, registered seat, OIB, opening hours, service radius, social profiles (§9).

### 3.3 Language switcher attachment point

The source flags multilingual intent as undecided: the export carries Croatian, German and English columns but no translations exist (§8.11), and which languages launch is an open question (§9). Consequently this document defines **one tree in one primary language**, not three parallel trees.

The switch point attaches at the **end of the header, after nav item 6 (Kontakt)**, and mirrors into the footer as a text-level control. Everything below the switch — the page set, the section order, the section IDs in §2 — is language-independent and is reused unchanged by any additional language version; only slugs and content would be translated.

**The landing-page architecture makes this cheaper than v1 did.** Adding a language duplicates 2 URLs, not 13. Against that, it removes the option of serving the German industrial audience a separate market-level entry without either duplicating the whole landing page or splitting the line back out into its own page (§4.11, §4.12).

---

## 4. Blocked decisions

Structural decisions that cannot be made from the source. None of these are resolved by guessing. Items marked **[v2]** are new or materially changed by the landing-page architecture.

1. **Tool rental's rank in the business hierarchy** (§8.1, §3.4). The source names three categories, then names rental as a further activity outside them, while the legacy text sells it as a service (§7). *Consequence:* rental keeps a top-level nav item but sits below all three ranked lines on `/` and below the Loxone half on `/webshop`. Its true position is unset. **[v2]** The stakes are now low: rental's order can be changed by moving one teaser and one half-page, not by reshaping the sitemap.

2. **Is the shop transactional or catalogue-plus-enquiry?** (§9; the export carries an RFQ flag but no stated intent.) *Consequence:* `/webshop` is structured as two listings ending in a shared enquiry CTA. **[v2] This is the single most urgent open decision on the project, and moving rental into the shop has raised its cost.** The client's word for this page is "webshop", which points at transactional — but if it is a true shop the tree gains a branch that does not exist in §1: **59 Loxone product pages plus 16 rental item pages**, cart, checkout, order confirmation, and for rental a date-based availability step, plus the pricing basis in item 15. That would take the site from 5 URLs to roughly 80. It would also split the page: a shop of that size cannot keep the Loxone service content above the listings, so `partner-status` through `loxone-audience` would move back to a service page in front of the shop. **Nothing below `loxone-catalog-intro` can be designed until this is answered.**

3. **Catalog completeness** (§8.9). It is unclear whether 16 rental and 59 Loxone items are the full catalogs or an excerpt, and §9 asks whether to migrate in full, extend or reduce. *Consequence:* whether `family-listing` and `rental-listing` need pagination, search and multi-facet filtering cannot be decided. **[v2]** Both listings now live on one page, so a materially larger catalogue on either side forces a split into two shop pages.

4. **Missing address, registered seat, OIB, working hours, service radius** (§9). *Consequence:* the `contact` section has no location block, no map, no hours; local search targeting for the Croatian lines has no geographic anchor. **[v2]** A one-page site has exactly one shot at local SEO, so the missing geographic anchor costs more here than it did across eleven pages.

5. **[Removed from scope.]** The three legal pages (`/impressum`, `/uvjeti-najma`, `/politika-privatnosti`) are no longer part of the site. Any content that referenced them (the rental terms link in `rental-listing`, the privacy consent line in `contact`) needs its own resolution now that there is no dedicated page to point to.

6. **Waldner's role** (§8.5, §2). Named as a partner, but the partnership, its products and its business line are never explained; it appears only in the legacy text as an automation credibility claim. *Consequence:* no partner section beyond Loxone anywhere in the tree, and Waldner is excluded from the landing page and the footer.

7. **Scope of "ključ u ruke"** (§8.3). Stated only for finishing works; unknown whether it covers electrical and Loxone work. *Consequence:* turnkey appears only inside `finishing-works` and cannot be used as a site-wide proposition or a hero claim.

8. **Germany: industrial only, or residential too?** (§8.2). German work is "isključivo" industrial, yet another line offers "kućne i industrijske instalacije" without naming a market. *Consequence:* `industrial` is restricted to industrial scope and no German-market residential content exists. If residential work is also done in Germany, a block is missing from that section.

9. **Mechanical assembly ("mehaničke montaže")** (§8.4). Appears only in the outdated legacy text. *Consequence:* it appears in no service inventory and no section. If still offered, it needs a place among the line sections.

10. **Loxone as specialism vs. Loxone as the smallest activity** (§8.6). It is presented both as a stated specialism and as the third-ranked activity. *Consequence:* **[v2] partly forced by the architecture.** Loxone occupies the first and larger half of the site's only other page, which weights it above the two Croatian service lines regardless of the stated rank. The `loxone-teaser` section on `/` follows the stated rank in position, but the page behind it does not. If the client disagrees, the alternative is to give a second line its own page — which starts unwinding the landing-page decision.

11. **Language versions at launch** (§8.11, §9). *Consequence:* a single-language tree is defined with a marked switch point (§3.3). **[v2]** If Germany is served with German-language content, a landing page cannot easily give the German industrial line a market-level entry of its own; either the whole page is duplicated per language, or that line is split back out into a page. See §3.3.

12. **One brand for all three lines, or separate treatment for the German industrial audience?** (§9). *Consequence:* **[v2] effectively decided by the architecture, not by the client.** A single landing page carrying all four activities forces one brand and one entry point. If the German industrial audience needs separate treatment, the landing page cannot deliver it and the tree changes again. This should be confirmed with the client rather than left implicit.

13. **All company, trust and proof content** — founding year, history, team size, ownership, reference projects, client names, project photos, case studies, testimonials, certificates, licences, guarantees, warranty terms and response times (§9). None of it exists in the source, and the only "O nama" text is marked outdated and do-not-reuse (§7). *Consequence:* **no "O nama" section and no references, testimonials, certificates or guarantees anywhere in §2 or §3.** For a trade business selling industrial installations in a foreign market, this is a structural deficiency, not a stylistic one: the entire trust layer rests on the single line "ovlašteni partneri firme Loxone" (§2). **[v2]** A landing page is where a proof section would normally sit, between the lines and the contact block — the slot is architecturally obvious and empty, and the content to fill it is **requested as client input**.

14. **Recruitment application destination and mechanism** (§9). Whether recruitment needs its own application form and where applications should go is unanswered. *Consequence:* the application step inside `jobs` is defined as email and phone only. **[v2]** With the enquiry form now in the adjacent `contact` section, the case for one form with a "Zaposlenje" routing option is stronger — but where those submissions go is still unanswered.

15. **Pricing basis** (§8.8). VAT treatment, minimum rental period, deposits and delivery are unstated; rental is per day and Loxone per unit. *Consequence:* prices can show a figure but cannot state what it includes, which weakens every price-led block and blocks any checkout design (see item 2). **[v2]** Both pricing bases now sit on one page, one per day and one per unit, roughly two screens apart and with no qualifier on either. The page must make the difference obvious in layout, because the copy cannot state it.

16. **Export data defects** (§8.10). "Dali extension – 64 uređaja" has no brand while every other Loxone row does; "BOSCH GWS 12V-76" carries SKU "gws-18v"; "Bosch Professional 12 V System" is a range name rather than a product, tagged "gbh"; "Presence Sensor Air Senzor pristunosti" misspells "prisutnosti"; the source prose contains "ggrađevinske". *Consequence:* `family-listing` and `rental-listing` cannot be built from the export as-is — brand filtering and per-item identity require a cleaned dataset first.

17. **Whether the German offer and rates are current and publishable as stated** (§9). *Consequence:* the offer block inside `jobs` is built entirely on §6.3, including the 10–15 € hourly rate. If the figures are not publishable, the section loses its decisive content.

18. **Audience definition per business line** (§9) — who commissions industrial cabinets in Germany, who buys finishing works in Croatia. *Consequence:* the line sections are structured around deliverables because no audience segmentation data exists.

19. **[v2] Landing-page length and progressive disclosure.** Ten sections carrying three business lines, a rental teaser and a full recruitment offer is still a long page. *Consequence:* whether `jobs`' two role specifications are shown in full on load or behind expanders is a design decision this document does not make — but it cannot be deferred past the first build, because it determines whether `service-lines` anchors land where the visitor expects. Moving the sixteen rental rows off the page has already removed the worst of this.

20. **[v2] Two unrelated inventories on one page.** `/webshop` carries Loxone components sold per unit to homeowners and businesses, and professional tools hired per day by tradespeople. *Consequence:* the page is built as two separated halves with a selector, which works — but it is a container the source never describes, and three things follow that the client must decide. **(a)** The page has no name the source authorises; "webshop" is the client's word, not HES's copy, and the nav avoids the problem by pointing two familiar labels at one URL (§3.1). **(b)** If §4.2 resolves transactional, a single cart holding a purchase and a hire is not a normal commerce pattern and would need separate flows. **(c)** SEO: one URL now competes for both "loxone hrvatska" and "najam alata", which is weaker than two pages would be for either term. None of this blocks the build; all of it is worth confirming before it hardens.

---

## 5. v1 → v2 section mapping

Every section from the superseded eleven-page tree, and where its content now lives. **No content is dropped**; four sections are retired because a one-page architecture makes them redundant, and their reason is given.

| v1 page | v1 section | v2 location |
| --- | --- | --- |
| `/` | `hero` | `/` → `hero` |
| `/` | `service-lines` | `/` → `service-lines` |
| `/` | `scope-strip` | `/` → `scope-strip` |
| `/` | `loxone-partner` | `/` → `loxone-teaser` (absorbed) |
| `/` | `rental-teaser` | `/` → `rental-teaser` (unchanged in role: still a teaser) |
| `/` | `jobs-teaser` | `/` → `jobs` (absorbed into the full section) |
| `/` | `contact-cta` | `/` → `contact` |
| `/usluge` | `hub-intro` | **Retired** — a hub page's orienting section has no function when the categories are visible on the same page. Its content ("tri kategorije") moves into `service-lines`. |
| `/usluge` | `line-industrial` | `/` → `industrial` |
| `/usluge` | `line-croatia-construction-electrical` | `/` → `finishing-works` + `residential-electrical` |
| `/usluge` | `line-loxone` | `/` → `loxone-teaser` |
| `/usluge` | `rental-entry` | `/` → `rental-teaser` |
| `/usluge` | `hub-contact-cta` | `/` → `contact` |
| `/usluge/industrijske-elektroinstalacije` | `hero-industrial` | `/` → `industrial`, block 1 |
| `/usluge/industrijske-elektroinstalacije` | `industrial-cabinets` | `/` → `industrial`, block 2 |
| `/usluge/industrijske-elektroinstalacije` | `process-industrial` | `/` → `scope-strip` (centralised; see §2.1.3) |
| `/usluge/industrijske-elektroinstalacije` | `market-industrial` | `/` → `industrial`, block 3 |
| `/usluge/industrijske-elektroinstalacije` | `industrial-staffing-link` | `/` → `industrial`, block 4 |
| `/usluge/industrijske-elektroinstalacije` | `industrial-enquiry-cta` | `/` → `industrial`, block 5 (inline CTA) |
| `/usluge/zavrsni-radovi` | `hero-finishing` | `/` → `finishing-works`, block 1 |
| `/usluge/zavrsni-radovi` | `finishing-works-list` | `/` → `finishing-works`, block 2 |
| `/usluge/zavrsni-radovi` | `turnkey-scope` | `/` → `finishing-works`, block 1 (merged into the turnkey statement) |
| `/usluge/zavrsni-radovi` | `value-positioning` | `/` → `contact`, block 1 |
| `/usluge/zavrsni-radovi` | `related-residential-electrical` | **Retired** — replaced by section adjacency; `residential-electrical` follows immediately. |
| `/usluge/zavrsni-radovi` | `finishing-enquiry-cta` | `/` → `finishing-works`, block 3 (inline CTA) |
| `/usluge/kucne-elektroinstalacije` | `hero-residential-electrical` | `/` → `residential-electrical`, block 1 |
| `/usluge/kucne-elektroinstalacije` | `process-residential` | `/` → `scope-strip` (centralised) |
| `/usluge/kucne-elektroinstalacije` | `loxone-upsell` | `/` → `residential-electrical`, block 2 |
| `/usluge/kucne-elektroinstalacije` | `residential-enquiry-cta` | `/` → `residential-electrical`, block 3 (inline CTA) |
| `/usluge/loxone-smart-home` | `hero-loxone` | `/webshop` → `hero-shop` (widened to cover both inventories) |
| `/usluge/loxone-smart-home` | `partner-status` | `/webshop` → `partner-status` |
| `/usluge/loxone-smart-home` | `loxone-offer` | `/webshop` → `loxone-offer` |
| `/usluge/loxone-smart-home` | `loxone-system-scope` | `/webshop` → `loxone-system-scope` |
| `/usluge/loxone-smart-home` | `loxone-audience` | `/webshop` → `loxone-audience` |
| `/usluge/loxone-smart-home` | `catalog-entry` | **Retired** — a cross-page handoff to a page that is now the same page. Absorbed into `loxone-catalog-intro`. |
| `/usluge/loxone-smart-home` | `loxone-enquiry-cta` | `/webshop` → `shop-enquiry-cta` (merged) |
| `/loxone-katalog` | `catalog-intro` | `/webshop` → `loxone-catalog-intro` |
| `/loxone-katalog` | `category-nav` | `/webshop` → `category-nav` |
| `/loxone-katalog` | `family-listing` | `/webshop` → `family-listing` |
| `/loxone-katalog` | `catalog-installation-link` | **Retired** — pointed at the Loxone service page, now the top of the same page. Replaced by an in-page return link inside `shop-enquiry-cta`. |
| `/loxone-katalog` | `catalog-enquiry-cta` | `/webshop` → `shop-enquiry-cta` (merged) |
| `/najam-alata` | `hero-rental` | `/webshop` → `rental-intro` |
| `/najam-alata` | `rental-categories` | `/webshop` → `rental-intro` (merged) |
| `/najam-alata` | `rental-listing` | `/webshop` → `rental-listing` |
| `/najam-alata` | `rental-terms-link` | `/webshop` → `rental-listing`, terms block |
| `/najam-alata` | `rental-enquiry-cta` | `/webshop` → `shop-enquiry-cta` (merged) |
| `/zaposlenje` | `hero-jobs` | `/` → `jobs`, block 1 |
| `/zaposlenje` | `role-electricians` | `/` → `jobs`, block 2 |
| `/zaposlenje` | `role-workshop` | `/` → `jobs`, block 3 |
| `/zaposlenje` | `offer-grid` | `/` → `jobs`, block 4 |
| `/zaposlenje` | `apply` | `/` → `jobs`, block 5 |
| `/kontakt` | `contact-details` | `/` → `contact`, block 2 |
| `/kontakt` | `enquiry-form` | `/` → `contact`, block 3 |
| `/kontakt` | `contact-jobs-split` | **Retired** — `jobs` sits immediately above `contact`; a redirect would point at content just scrolled through. |

**Totals:** 57 v1 sections → 22 v2 sections across 2 URLs — 10 on `/`, 12 on `/webshop`. 4 sections retired for redundancy, 2 centralised into `scope-strip`, 3 enquiry CTAs merged into one `shop-enquiry-cta`, 1 new section created by the merge (`shop-nav`), the remainder folded in as internal blocks.

**One section has no v1 ancestor:** `shop-nav` on `/webshop`. It exists only because two unrelated inventories now share a page and the visitor has to be able to pick one within the first screen.
