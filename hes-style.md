---
source_files:
  - HES/hes-brand-context.md
  - HES/hes-content.md
  - HES/hes-structure.md
purpose: Visual style direction for the HES website redesign. Style only — no copy, no IA, no markup.
---

## Brand summary

HES is a working trade company, not a tech brand: an authorised Loxone partner running industrial electrical installations in Germany (its primary, largest activity) alongside turnkey finishing works, residential electrical installations and Loxone smart-home sales/installation in Croatia, plus tool rental (hes-brand-context.md §3, §3.4). The only positioning HES has authored is *"realna cijena i dalje može značiti visoku kvalitetu"* — a fair price can still mean high quality (hes-content.md §7) — and its only external trust signal is the Loxone authorised-partner status; there are no testimonials, certificates, case studies or reference projects to draw on (hes-brand-context.md §9, hes-content.md §0.2). The style must read as **specification-led and quietly credentialed**, never as a consumer-retail or startup brand, and must carry a genuinely long, information-dense single page (hes-structure.md §2.1) without losing that restraint.

## Typography

**Primary — headings & hero: IBM Plex Sans Condensed**
Category: sans-serif (grotesk), condensed cut. Source: Google Fonts (IBM Plex family, open source, also on Adobe Fonts). Fallback stack: `"IBM Plex Sans Condensed", "Arial Narrow", Arial, sans-serif`.
Rationale: IBM Plex was designed by IBM specifically to read as engineered and enterprise-credible rather than decorative — the opposite profile from a "trendy-startup" geometric sans (Poppins, Circular). Its condensed cut sets Croatian compound headlines (*"Industrijske elektroinstalacije"*, *"Završni radovi u građevini po principu ključ u ruke"*, hes-content.md §`industrial`, §`finishing-works`) at full weight without wrapping awkwardly or shrinking below a confident size — a real requirement given the landing page's single H1 has to "carry the whole business" in one line (hes-content.md, `hero` hierarchy note). Full Latin Extended coverage handles Croatian diacritics (č, ć, š, ž, đ) and German umlauts natively, which matters for a genuinely bilingual DE/HR business (hes-brand-context.md §2).

**Supporting 1 — body: IBM Plex Sans**
Category: sans-serif (grotesk). Source: Google Fonts. Fallback stack: `"IBM Plex Sans", "Segoe UI", Roboto, Helvetica, Arial, sans-serif`.
Rationale: same superfamily as the heading face, so pairing is a weight/width relationship rather than a stylistic clash — appropriate for a site whose tone is described directly as "grounded, competent, plain" (hes-content.md §0.3) rather than editorial. It holds up at length: the landing page carries full paragraph copy in formal *vi* for five different audiences (buyers, homeowners, tradespeople, candidates) in one scroll, and Plex Sans's open apertures and even rhythm keep that legible at body size across a long page.

**Supporting 2 — accents, UI, labels, prices, buttons: IBM Plex Mono**
Category: monospace. Source: Google Fonts. Fallback stack: `"IBM Plex Mono", "SF Mono", Consolas, monospace`.
Rationale: hes-content.md's own visual system is built on fact rows (label/value pairs — `industrial` block 3, `rental-intro` fact table), rank labels (`01 — Primarna djelatnost`), tabular price lists (75 SKUs across `family-listing` and `rental-listing`), and a stated preference for tables reading "as specification rather than marketing" (hes-content.md, `industrial` visual note 2). A monospace pulled from the same IBM Plex superfamily gives every price, SKU, fact-row label and rank number a tabular, spec-sheet register that reinforces that intent typographically, not just structurally — and doubles as the natural face for the price-emphasis pattern used nine times across the site (hes-content.md §0.3).

No serif is used anywhere in the system. A serif would read as editorial, legal, or heritage-luxury — none of which matches a trade contractor whose only stated proposition is price-for-quality, not prestige.

## Color direction

Built directly on the client-supplied hex values; nothing here replaces them, only extends and adjusts.

### Base palette (adjusted)

| Token | Hex | Source anchor | Adjustment & rationale |
| --- | --- | --- | --- |
| `teal-900` (Deep Teal) | `#1E4A5F` | client anchor, unchanged | Kept as given — used as one of the two dark background fields the alternating section rhythm requires (hes-content.md §0.3 "alternating background fields — dark, light, dark"). |
| `teal-800` (Deep Teal, raised) | `#27586E` | derived from `#1E4A5F` | Lightened ~4% in the same hue/chroma family, not brightened toward saturation. `#1E4A5F` alone sits too close to the near-black neutral (`#0A0908`) to read as a distinct surface when used for cards or hover states *on top of* a dark field — this step exists so `industrial`'s sticky split-screen media panel and dark-field card borders have a visible second dark tone without introducing a new hue. |
| `teal-500` (Muted Teal) | `#3F8880` | client anchor `#3E8F86`, desaturated ~5% | The client flagged some anchors as reading "too dark"; this one is close to correct as-is but reads slightly minty next to the grain texture on dark fields (hes-content.md §0.3 "Grain / texture"). A small desaturation keeps it in the muted family the client asked for while sitting quietly behind it. Used for secondary buttons, hairline rules on dark sections, and the muted "advantages" rows in `jobs`' requirement tables (content.md, `jobs` visual note 3). |
| `pine-600` (Pine Green) | `#1B9179` | client anchor, unchanged | Kept exactly. This is the palette's one "confirming" color — used for the `Na stanju` status pill in `rental-listing` and as the dark end of Gradient 1. Deliberately kept distinct from the cyan accent so "in stock / confirmed" never competes visually with the accent's own job (price emphasis, CTAs). |

None of the three base anchors is the site's most-used color — that role belongs to the neutral ramp below, per the client's rule that the base palette itself stays secondary to typography and whitespace on a genuinely long, dense page (hes-structure.md §2.1, 10 sections; §2.2, 12 sections).

### Accent — cyan, minority use only

| Token | Hex | Role |
| --- | --- | --- |
| `cyan-accent` | `#3FC7C2` | The one color allowed to be brighter than the base family — pulled from the bright end of Gradient 1 (`#2FD9C0`) and pulled back a few points so it reads as a considered highlight, not a neon one. |

Usage rule, enforced structurally, not just stylistically: cyan appears **only** where hes-content.md's own "price emphasis" pattern already appears — the glow behind price figures in `rental-teaser`, `jobs`' hourly rate, `loxone-teaser`, `loxone-catalog-intro`, `family-listing`, `rental-intro`, `rental-listing` (hes-content.md §0.3) — plus the accent glow behind `realna cijena` in `contact` block 1, the outbound-link indicator shared by nav items 3–4 and the two teaser CTAs, and focus/hover states. It never fills a background, a card, or a section field. On the 75-row product/rental tables it appears per-row **on hover only**, matching the source's own instruction that a permanently-glowing figure "would cancel the effect" (hes-content.md, `family-listing` visual note 2) — which is also what keeps it a minority color by construction, not just by discipline.

### Gradients

**Gradient 1 — "Glow" — `#2FD9C0 → #1B9179`**
Same hue relationship as supplied, used exclusively as a soft, blurred glow (never a hard-edged fill) behind: the accent glow treatments listed above, the Loxone wordmark isolation band in `loxone-teaser`/`partner-status`, and the `realna cijena` positioning line in `contact`. Restricting it to glows rather than solid gradient fills is what keeps this pairing — the site's brightest color combination — inside "highlight, not base."

**Gradient 2 — "Depth" — `#1E4A5F → #3E8F86`**
Used as a large-area, low-contrast background wash: the hero's dark field (both `hero` and `hero-shop`), the dark sticky-split media panels in `industrial` and `loxone-system-scope`, and the darkest closing bands before `jobs` and `contact`. This is the gradient doing the atmospheric work that photography would otherwise carry — necessary because the source contains no photography yet and every image-dependent section needs a type-and-color fallback (hes-content.md §0.2). Kept subtle (low contrast between stops, applied at low opacity over the near-black neutral where extra depth is needed) so it reads as considered restraint, not decoration.

### Neutral ramp

Anchored on the client's two supplied values, expanded into a working scale for text, backgrounds, borders and surfaces at different weights:

| Token | Hex | Use |
| --- | --- | --- |
| `ink-950` | `#0A0908` | Client anchor, unchanged. The darkest background field — reserved for the two sections the source itself calls out as needing the darkest field on the page: `jobs` and `contact` (hes-content.md, visual key). Also body text color on all light backgrounds. |
| `ink-900` | `#14120F` | Surface one step up from true black — dark-field card backgrounds, footer background. |
| `ink-800` | `#201D18` | Elevated dark surface — hover state for dark cards, dark-field table row alternation. |
| `ink-700` | `#33302A` | Borders and hairline rules on dark fields; muted/secondary text on dark backgrounds. |
| `ink-500` | `#6B665D` | Secondary/muted body text on light backgrounds — captions, helper microcopy, fact-row values. |
| `sand-200` | `#E4DFD3` | Borders, hairlines and card edges on light fields. |
| `sand-100` | `#EDE9DE` | The second, "warmer" light background field — used where hes-content.md explicitly asks for a warmer/brighter field to mark an audience change without a divider (`finishing-works` and `residential-electrical`, shared field, visual notes). |
| `sand-50` | `#F4F1EA` | Client anchor, unchanged. The primary light background field and default page background. |
| `sand-25` | `#FAF8F3` | Lightest step — card and form-field surfaces sitting on top of `sand-50`, where a card needs to lift without a border. |

This gives the alternating section rhythm two genuinely distinct dark tones (`ink-950` true-black-adjacent vs. `teal-900` deep-teal) and two distinct light tones (`sand-50` neutral vs. `sand-100` warm), which is what hes-content.md's section rhythm needs to mark boundaries and audience changes across ten-plus sections without relying on dividers for every transition (hes-content.md §0.3, "Divider language" — reserved for audience changes only, fired at most twice per page).

## Visual tone & mood

1. **Specification-led, not persuasive.** hes-content.md states this directly: fact rows read "as specification rather than marketing" (`industrial` visual note 2), and the tone across the whole system is "grounded, competent, plain — a working trade company, not a tech brand" (§0.3). The visual language should favor tables, labeled fact-pairs and monospace figures over icons, illustrations or benefit-style callouts.
2. **Quietly credentialed, not trust-signal-heavy.** The Loxone authorised-partner line is the only verifiable external credential the source contains — there are no testimonials, certificates, case studies, references or guarantees (hes-brand-context.md §9; hes-content.md, `loxone-teaser` visual note 1 calls this "the site's entire trust budget"). The style should isolate that one credential (unframed, generous space, no card) rather than manufacture a trust-signal *pattern* (logo walls, star ratings, quote carousels) the content has nothing to fill.
3. **Two-market, two-register pragmatism.** The business is explicitly split between an industrial German market and a residential/tradesperson Croatian market (hes-brand-context.md §2), and the copy itself shifts from formal *vi* everywhere to informal *ti* only in the `jobs` section, mirroring the client's own recruitment ad (hes-content.md, `jobs` register flag). The visual system should not need a separate "mode" for this — same type scale, same colors — the register shift is carried by copy alone, not by décor.
4. **Dense, but self-orienting.** Two URLs, 22 sections, a 59-SKU catalogue and a 16-item rental list (hes-structure.md §2.2) — a page that could easily lose the visitor without scroll-spy nav, alternating field rhythm and sparingly-used angled dividers (twice per page maximum, hes-content.md §0.3). Visual weight should go toward orientation devices, not toward decorating individual sections.
5. **Trade-first, not consumer-retail.** No per-item marketing copy exists or should be invented for any of the 75 catalogue/rental SKUs (hes-content.md, `family-listing` and `rental-listing` hierarchy notes: "59/16 invented blurbs would carry the... largest fabrication risk"). Product listings should look like a supplier's price sheet — name, category, price, stock — not an e-commerce merchandising grid.
6. **Restrained, no borrowed superlatives.** The legacy "O nama" text's claims — energy optimisation, long-term efficiency and safety, "comprehensive technical support in one place" — are explicitly marked do-not-reuse (hes-brand-context.md §7; hes-content.md §0.3). The only claim the design gets to lean on is the one the client actually wrote: a fair price can still mean high quality. Visual restraint (flat fields, plain numerals, no badges implying certifications that don't exist) protects that claim from looking oversold.

## Layout & spacing principles

- **Long-scroll, section-rhythm architecture.** `/` carries 10 sections and `/webshop` carries 12 (hes-structure.md §2.1–2.2) in one continuous scroll each, so the primary spacing device is the alternating background-field change marking every top-level section boundary (hes-content.md §0.3) — not card borders or heavy rules. Vertical rhythm between sections should be generous and consistent; rhythm *within* a section can compress for dense content (tables, fact rows).
- **Density follows content type, not a single grid.** The three business-line sections and the two catalogue listings carry genuinely different information densities — `residential-electrical` is deliberately the shortest section on the page (two blocks, no grid; hes-content.md visual note), while `family-listing` runs ten sticky sub-headed tables across 59 rows. The system needs a spacing scale that can go from generous (hero, teasers) to tight-but-legible (tabular listings) without feeling like two different sites — held together by the same type scale and color tokens throughout.
- **Two sticky split-screens, used nowhere else.** `industrial` and `loxone-system-scope` are explicitly the only two sections on the whole site using a pinned-media/scrolling-content layout (hes-content.md §0.3, "Sticky split-screen... used twice on the whole site"). This pattern should stay visually rare enough that its two uses still feel deliberate, not like a default component reused everywhere.
- **Angled dividers as a scarce resource.** One shallow angled divider (2–3°), fired only at audience changes — twice on `/` (before `jobs`, before `contact`), twice on `/webshop` (before `loxone-catalog-intro`, before `rental-intro`) — never at a mere subject or background-field change (hes-content.md §0.3). Layout should mark most boundaries with the field-color change alone, reserving the divider for the four moments the audience itself actually changes.
- **Tables over cards for anything priced.** Both catalogues (75 items combined) and both fact-row patterns (`industrial`'s market table, `rental-intro`'s specification table) should be built as label/value or column tables with hairline rules and right-aligned prices — reused as one shared component across unlike sections (hes-content.md, `rental-intro` visual note 2), which also keeps the per-unit vs. per-day price bases visually distinguishable via a shared header label (`Cijena` vs. `Cijena/dan`) rather than through invented copy the source can't support (§4.15).
- **Grain restricted to dark fields, applied once as a site-wide layer.** Not per-section — a single very-low-opacity grain texture applies uniformly to every dark field (hes-content.md §0.3), reinforcing that the two dark tones (`ink-950`, `teal-900`) are variations within one system rather than separate treatments.

## Imagery/iconography direction

- **Photography over illustration, when it exists — but none exists yet.** hes-content.md is explicit that the source contains no photography, art direction, logo files or project imagery at all (§0.2), and every image-dependent section is written to also work as a type-and-color composition with zero images. The style must therefore lead with the type and color system defined above as the actual, shippable design — photography is an enhancement layered on top later, not a dependency.
- **When photography does arrive, documentary and unstaged, never stock.** The shot list is explicit and concrete (wired cabinet interiors, terminal rails, finished Knauf walls, a Loxone Touch button in a lived-in room, Bosch tools on neutral backgrounds, a workshop in Germany — hes-content.md §0.2) — real jobsite and product photography, not generic stock imagery of unrelated electrical work, which the source itself flags as the fastest way to lose the site's only credibility (§0.2).
- **Icons: none, by the source's own instruction.** hes-content.md explicitly rules out icons for the process-chain steps (`scope-strip`) and the ten Loxone product families (`loxone-system-scope`) because "ten icons would need ten commissioned assets the client does not have" (visual note). Where a marker is needed (status, rank, category), use typographic devices — numerals, monospace labels, the status pill for `Na stanju` — instead of an icon set the brand has no visual language for yet.
- **Product photography, when commissioned, on neutral backgrounds only.** Both catalogues need one shot per SKU (or per representative item at minimum) on a plain neutral ground — consistent with a supplier's spec-sheet catalogue, not a lifestyle merchandising shoot (hes-content.md §0.2, items 6–7).

## Do / Don't

- **Do** isolate the Loxone partner credential as an unframed, standalone statement (dark band, generous space, no card, no border) — it is the only external trust signal the source has, and framing it as one card among several would spend the site's entire trust budget as decoration (hes-content.md, `loxone-teaser` visual note 1).
- **Do** keep the industrial/German-facing line (`industrial`) built as tables and fact-pairs in a specification register, distinct from the plainer, more descriptive prose treatment given to the Croatian residential lines — the source itself writes these in different registers for different qualifying audiences (hes-content.md, `industrial` vs. `finishing-works`/`residential-electrical` hierarchy notes).
- **Don't** add benefit language, superlatives, or claims of speed, safety, efficiency, or energy optimisation anywhere in the visual or copy treatment — these all come from the legacy "O nama" text, which is explicitly marked outdated and do-not-reuse (hes-brand-context.md §7, hes-content.md §0.3).
- **Don't** invent per-item marketing copy, descriptions, or "recommended for" framing for any of the 75 catalogue/rental SKUs — the source supplies name, category and price only, and nothing else exists to style around (hes-content.md, `family-listing` and `rental-listing`).
- **Don't** let the cyan accent become a background fill, a card color, or anything covering more than a glow/hover/small-badge area — per the client's explicit rule that it is a highlight, not a base, and per the source's own instruction that permanent glows on 59+ rows "would cancel the effect."
- **Don't** give Waldner equal visual billing with Loxone as a partner logo or credential — the Waldner relationship is named but never explained anywhere in the source, and is explicitly excluded from the footer and landing page pending clarification (hes-brand-context.md §8.5; hes-structure.md §4.6).

## Conflicts & Assumptions

- **Loxone's stated rank vs. its architectural weight.** hes-brand-context.md ranks Loxone third of three categories (§3.3), but hes-structure.md gives it roughly half of the site's only other page — more visual real estate than either Croatian line gets (§4.10, explicitly flagged as an unresolved tension the client must confirm). This style document resolves it only for surface treatment: the `service-lines` card for Loxone on `/` stays equal-weight with its siblings (matching stated rank), while the Loxone half of `/webshop` is allowed to be visually substantial (matching its actual content depth) — the same color and type system carries both without implying a re-ranking. The underlying IA tension is not this document's to resolve.
- **No photography exists yet — assumed as the default shipping state.** Every visual recommendation above that depends on an image names a type-and-color fallback per hes-content.md §0.2, and this document treats that fallback as the real, initial design rather than a placeholder — because there is currently no commissioned shoot to schedule around.
- **Site-wide register (formal *vi* vs. `jobs`' informal *ti*) is unconfirmed by the client** (hes-content.md, `jobs` register flag; hes-structure.md §4.17 notes it's still open). Assumption made here: this is a copy-only decision. The visual system (type, color, spacing) does not change between registers — only the words do — so this style document applies unchanged regardless of how that question resolves.
- **No brand-authored dark/light "theme" exists — the alternating fields are one static system, not a togglable mode.** hes-content.md's section rhythm calls for alternating dark/light *sections within a single design* (§0.3), not a user-facing light/dark theme switch. The neutral ramp above is built to serve both kinds of field within that one system; this document does not address a separate accessibility-driven dark-mode toggle, since nothing in the three source files asks for one.
- **Waldner is named as a partner but never explained** (hes-brand-context.md §2, §8.5) — carried through from the source files as an open item, not resolved here. No visual treatment is proposed for it beyond the exclusion already decided in hes-structure.md §4.6.
