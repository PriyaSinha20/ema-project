# Virgin Atlantic (en-IN) — EDS Migration Handover Document

**Site analysed:** https://www.virginatlantic.com/en-IN
**Scope:** Content layer (marketing / informational pages), India locale
**Analysis date:** 2026-08-25
**Prepared for:** Edge Delivery Services (EDS) migration planning

---

## 1. Executive Summary

A full crawl and structural analysis of the India locale of virginatlantic.com was completed to scope an Adobe Edge Delivery Services (EDS) migration.

- **446 pages** discovered via the site's XML sitemap (hreflang alternates).
- **444 pages successfully analysed** — 99.6% coverage (2 pages failed to render).
- **12 unique page templates** identified.
- **27 reusable block variants** catalogued.
- **1 locale** in scope (`en-IN`).

**Key constraint:** The passenger site is a JavaScript-heavy, application-driven site behind Akamai bot protection. The booking engine, check-in, flight status, seat maps, and account areas run on separate application subdomains (`flights.`, `flywith.`, `vaabrowse.virginatlantic.com`) and are **out of scope** for content migration — they are transactional applications, not authored content. The 446 pages in this report are the migratable marketing/content layer.

---

## 2. Templates Inventory

| # | Template | Complexity | Reasoning | Reference URL (example) |
|---|----------|-----------|-----------|------------------------|
| 1 | marketing-landing | High | Section-hub landing: hero, promo cards, alternating image+text feature rows, icon-link row. Rich composition; some regions render client-side. | `/en-IN`, `/en-IN/corporate` |
| 2 | rich-text-article | Low | Hero banner + breadcrumb + long-form rich text. Standardized. | `/en-IN/policies/air-carrier-access-act` |
| 3 | editorial-travel-guide | Medium | Byline/read-time, hero, alternating image+text story sections, inline CTA, related-inspiration teaser. | `/en-IN/inspiration/africa/cape-town-travel-guide` |
| 4 | client-rendered-content | High | Main content rendered client-side; static capture shows only header/footer shell. | `/en-IN/contact-us/payment-options` |
| 5 | accordion-content | Medium | Hero + intro + expand/collapse accordion sections + contact block. | `/en-IN/corporate/engineering` |
| 6 | news-listing | Medium | Hero + CTAs + dated card grid + "See all" pagination. | `/en-IN/travel-news` |
| 7 | promo-feature | Medium | Campaign/reward layout: hero, media-rich sections, CTA blocks. | `/en-IN/experience/football-world-cup-2026` |
| 8 | reference-document | Low | Hero + short reference text/links. Sparse. | `/en-IN/corporate/annual-reports` |
| 9 | inspiration-hub | Medium | Inspiration index: hero + card grid to guides. | `/en-IN/inspiration/south-korea` |
| 10 | destination-detail | Medium | Where-we-fly leaf: hero, destination overview, booking prompts. | `/en-IN/where-we-fly/caribbean/tobago` |
| 11 | itinerary-guide | Medium | Stepped/day-by-day editorial content. | `/en-IN/where-we-fly/.../savannah-sachdev-los-angeles-itinerary` |
| 12 | manage-booking-app | High | Application/tool page driven by embedded booking app; minimal static markup. | `/en-IN/manage-booking` |

---

## 3. Blocks / Components Catalog

27 block variants were catalogued and consolidated by content model — visual variations are grouped as variants of the same base block rather than as separate blocks.

| Block (base) | Variants | Complexity | Behaviour / Functionality | Reference URL |
|--------------|---------:|-----------|---------------------------|---------------|
| header (global) | 1 | Medium | Sticky nav: logo, Sign in, "My booking" flyout (Manage booking / Check in / Flight status), hamburger mega-menu. | all pages |
| footer (global) | 1 | Low | 4-column link nav, social icons, legal/Travel-Aware notice. | all pages |
| hero | 4 | Low–Med | Page banner: heading over full-bleed image or solid panel; light/dark themes. | `/en-IN`, `/en-IN/policies/...` |
| cards | 3 | Medium | Card grid — feature/promo/news cards with image, heading, text, CTA. **Most-used block: 279 pages.** | `/en-IN/travel-news` |
| breadcrumbs | 5 | Low | Home › Section › Page trail; light/dark themes. | `/en-IN/corporate/engineering` |
| columns | 1 | Low | Multi-column image+text feature rows. | `/en-IN` |
| carousel | 1 | Medium | Rotating slides/gallery. | 3 pages |
| tabs | 1 | Medium | Tabbed content switcher. | 1 page |
| table | 1 | Low | Data table (fees/specs). | 1 page |
| form | 1 | High | Interactive form (contact/feedback). | 1 page |
| accordion / expander | ~3 | Medium | Expand/collapse sections. | `/en-IN/corporate/engineering` |
| unknown / custom | 8 | High | Composite fragments with no standard EDS equivalent (heading+CTA+list combos, image grids, `grid-item` React components). | various |

*Screenshots captured for every block variant and full-page images for every page during analysis.*

---

## 4. Page Counts by Template & Migration Classification

| Template | Pages | Migration Path | Rationale |
|----------|------:|----------------|-----------|
| marketing-landing | 319 | Mixed (bulk auto + manual QA) | Structurally uniform but hero/feature regions vary; some render client-side. |
| rich-text-article | 49 | Automated | Standardized rich text. |
| editorial-travel-guide | 21 | Automated (light manual) | Consistent article structure. |
| client-rendered-content | 18 | Manual | Content not in static HTML; must be rebuilt. |
| accordion-content | 15 | Semi-auto | Accordion behaviour needs block wiring. |
| news-listing | 10 | Semi-auto | Dynamic card feed; needs listing logic. |
| promo-feature | 6 | Semi-auto | Campaign composition varies. |
| reference-document | 2 | Automated | Sparse text. |
| inspiration-hub | 1 | Semi-auto | Index/card grid. |
| destination-detail | 1 | Semi-auto | Overview + booking prompt. |
| itinerary-guide | 1 | Automated | Editorial content. |
| manage-booking-app | 1 | Manual / Exclude | Transactional app, not content. |
| **Total** | **444** | | |

**Rollup:** Automated ≈ **73 pages (16%)** · Bulk-with-QA / semi-auto ≈ **353 pages (80%)** · Manual ≈ **19 pages (4%)**.

---

## 5. Integrations Analysis

| Integration | Type | Complexity | Where used |
|-------------|------|-----------|-----------|
| Self-hosted Tag Management (`tms.virginatlantic.com/vaa/ue_bw/Bootstrap.js`) | Custom code / embed | High | All pages — loads analytics/marketing tags |
| Analytics data layer (`window.digitalData` / `dataLayer`) | Custom code | Medium | All pages |
| Booking engine (`flights.` / `flywith.` / `vaabrowse.virginatlantic.com`) | External app (redirect) | High | Booking, manage-booking, check-in, flight-status |
| Facebook / Meta | Pixel + social | Low–Med | Homepage, social links |
| Social embeds (Instagram, Twitter/X, Pinterest, YouTube) | Embed / link | Low | Footer, editorial pages |
| Flying Club loyalty (`vsflyinghub.com`) | External app | Medium | Flying Club section |
| Cross-property links (Cargo, Careers, Virgin Holidays retail) | Link-out | Low | Footer / corporate |
| Akamai bot protection / CDN | Platform | Medium | Site-wide (impacts crawl/migration tooling) |
| React/Next.js runtime (`__NEXT_DATA__`) | Framework | High | Client-rendered content pages |

*Note: the self-hosted TMS obscures the exact downstream vendors (Adobe/Google/etc. are loaded dynamically). A runtime network audit during migration is recommended to enumerate the full tag list.*

---

## 6. Complex Use Cases & Observations

| # | Complex behaviour | Instances | Where | Why complex |
|---|-------------------|----------:|-------|-------------|
| 1 | Client-side-rendered content (React/Next) | ~19 pages | client-rendered-content, manage-booking | Content absent from static HTML; must be re-authored. |
| 2 | Booking / transactional apps | Whole subdomains | flights/flywith/vaabrowse | Out of EDS scope; require integration or link-out. |
| 3 | "My booking" flyout + session state | All pages (header) | Global header | Auth-gated actions depend on session. |
| 4 | Dynamic news/advisory listing | 10 pages | news-listing | Date-sorted feed with pagination. |
| 5 | Interactive blocks (accordion, tabs, carousel, form) | ~21 pages | accordion/tabs/carousel/form | Require JS behaviour beyond static content. |
| 6 | 8 custom/unknown block variants | ~36 page-uses | across templates | No standard EDS equivalent; bespoke modeling required. |
| 7 | Self-hosted TMS / analytics | Site-wide | All pages | Full vendor list hidden behind bootstrap loader. |
| 8 | Bot protection (Akamai) | Site-wide | All pages | Throttles/blocks automated import tooling. |
| 9 | Deep multilingual/locale sitemap | 446 en-IN of ~19 locales | sitemap | en-IN content largely shared with other locales; multi-locale rollout multiplies effort. |

---

## 7. Migration Estimates

Estimates cover the **en-IN content layer only** (446 pages, 12 templates, 27 blocks). Excludes the booking engine and other transactional apps.

### Effort by workstream

| Workstream | Estimate | Notes |
|-----------|---------|-------|
| Block development (27 variants → ~12–15 EDS blocks + variations) | 12–16 days | Incl. 8 custom + interactive (form/tabs/carousel/accordion) |
| Template setup (12 templates) | 5–7 days | Auto-block rules, section styling |
| Automated import (~73 clean pages) | 2–3 days | Scripted bulk import |
| Bulk-with-QA import (~353 pages) | 8–12 days | Import + per-page correction |
| Manual migration (~19 client-rendered/app pages) | 4–6 days | Re-authoring |
| Header / footer / navigation (global) | 3–5 days | Mega-menu + "My booking" flyout |
| Integrations & analytics re-implementation | 4–6 days | TMS/data-layer/tag re-wire + runtime audit |
| QA & testing (functional, visual, accessibility, PageSpeed) | 8–10 days | Target Lighthouse 100 |
| Project mgmt / UAT / fixes | 5–7 days | |

### Totals

| Metric | Estimate |
|--------|---------|
| Total effort | ~**51–72 person-days** (≈ 10–14 weeks of work) |
| Recommended team | 2 developers + 1 QA + PM (part-time) |
| Calendar schedule | ~**8–10 weeks** with the team above |
| Indicative cost | At a blended ~$600/day → **≈ $30k–$43k** (adjust to your rates) |

### Recommended phasing

1. Blocks + templates + global navigation
2. Automated + bulk import of the ~419 content pages
3. Manual rebuild of the 19 dynamic pages + integrations
4. QA / UAT

---

## 8. Caveats & Assumptions

- The site sits behind **bot protection**; a small number of rapid requests were throttled during discovery. Final page coverage was still 99.6%.
- The 63 non-fatal errors logged during the run were mostly transient navigation/redirect retries on a JS-heavy site — they did not reduce final coverage.
- **Booking, check-in, flight-status and account** flows are separate applications and are **not** included in the content-migration counts or estimates above.
- Cost figures are indicative and use a placeholder blended day rate; adjust to your actual rates.

---

## 9. Analysis Artifacts

The following artifacts were produced during analysis and are available for reference:

| Artifact | Description |
|----------|-------------|
| `template-catalog.json` | 12 named templates with page assignments and reference URLs |
| `block-catalog.json` | 27 block variants with usage counts and canonical models |
| `summary.json` | Site metrics and coverage summary |
| `urls-all.json` / `urls-grouped.json` | 446 discovered URLs, grouped by directory pattern |
| `.pages/{slug}/full-page.jpg` | Full-page screenshot per analysed page |
| `.blocks/{variant}/screenshots/` | Screenshots per block variant |

---

*End of handover document.*
