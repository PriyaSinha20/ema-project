# Riyadh Air (en) — EDS Migration Handover Document

**Site analysed:** https://www.riyadhair.com/en/home
**Scope:** Content layer (marketing / informational pages), English site
**Analysis date:** 2026-08-25
**Platform detected:** Next.js SPA + headless Adobe AEM (GraphQL), behind Akamai
**Prepared for:** Adobe Edge Delivery Services (EDS) migration planning

---

## 1. Executive Summary

A full crawl and structural analysis of the Riyadh Air English site was completed to scope an Adobe Edge Delivery Services (EDS) migration.

- **260 pages** discovered via the on-site `/en/sitemap` page (Akamai blocks robots.txt & XML sitemap).
- **260 pages analysed** — 100% coverage, 0 failures.
- **8 unique page templates** identified.
- **21 reusable block variants** catalogued.
- **1 locale** in scope (`en`), with a few embedded Spanish legal pages.

**Key finding:** Riyadh Air is a **Next.js single-page application backed by headless Adobe AEM (content served via GraphQL)**, behind Akamai bot protection. Most interior-page content renders client-side, so static captures show mainly the header/hero shell and newsletter footer. This is why 248 of 260 pages fingerprinted into one structural template. The biggest migration cost driver is whether **AEM/GraphQL content export access** is available — with it, the large content family becomes highly automatable; without it, expect rendered-DOM capture per page.

---

## 2. Templates Inventory

| # | Template | Complexity | Reasoning | Reference URL (example) |
|---|----------|-----------|-----------|------------------------|
| 1 | content-landing | High | Universal Next.js layout: nav, hero panel with sub-links, intro, alternating image+text feature sections + CTAs, newsletter footer. Content hydrated client-side. Spans home, section landings, about-us, experience, sfeer, discover-riyadh, plan-book, media-hub articles. | `/en/home`, `/en/about-us` |
| 2 | feature-detail | Medium | Feature/detail variant with hero + media-rich body sections. | `/en/experience/chauffeur` |
| 3 | help-article | Medium | Breadcrumb + "Explore all help articles" search box + heading + client-rendered body. | `/en/help/flight-disruption-policy` |
| 4 | help-article-rich | Medium | Help article with richer inline structured media. | `/en/help/in-flight-entertainment-and-wi-fi` |
| 5 | legal-terms | Low | Heading + long-form legal rich text + footer. | `/en/legal/best-offer-guaranteed-terms-conditions` |
| 6 | localized-legal | Low | Spanish-language legal doc inside the English tree. | `/en/conditions-of-carriage-es` |
| 7 | manage-booking-tool | High | Booking-servicing application page (cancel booking); minimal static markup. | `/en/manage/cancel-booking` |
| 8 | manage-order-tool | High | Order-retrieval/servicing application page. | `/en/manage/manage-order` |

---

## 3. Blocks / Components Catalog

21 block variants catalogued and consolidated by content model — visual variations grouped as variants of the same base block.

| Block (base) | Variants | Complexity | Behaviour / Functionality | Reference URL |
|--------------|---------:|-----------|---------------------------|---------------|
| header (global) | 1 | Medium | Sticky nav: logo, primary menu (Plan & book, Manage, Experience, Discover Riyadh, Sfeer, About us, Help), language switcher, account, hamburger. | all pages |
| footer (global) | 1 | Medium | Newsletter subscribe with consent checkbox + 4-column link nav + social icons + "A PIF Company" + legal row. | all pages |
| hero | 6 | Low–Med | Page banner: title, sub-links, branded imagery; light/dark, with/without image. Dominant block: 244 pages. | `/en/home` |
| cards | 1 | Medium | Card grid (feature/section cards with image + heading + CTA). | `/en/home` |
| columns | 1 | Low | Alternating image+text feature rows. | `/en/home` |
| search | 2 | Medium | Help-centre "Search for anything" box with submit. | `/en/help/flight-disruption-policy` |
| custom / unknown | 9 | High | Composite hydrated fragments — heading+image+CTA+paragraph combos, multi-heading/image/CTA grids, styled text. No standard EDS equivalent. | across content pages |

*Screenshots captured for every block variant and full-page images for every page during analysis.*

---

## 4. Page Counts by Template & Migration Classification

| Template | Pages | Migration Path | Rationale |
|----------|------:|----------------|-----------|
| content-landing | 248 | Manual-heavy (content via AEM/GraphQL) | Identical shells; actual content client-rendered from AEM. Bulk-scriptable only with API access. |
| feature-detail | 4 | Semi-auto | Media-rich composition. |
| help-article | 3 | Semi-auto | Search + client-rendered body. |
| help-article-rich | 1 | Semi-auto | Richer inline media. |
| legal-terms | 1 | Automated | Static rich text. |
| localized-legal | 1 | Automated | Static rich text (ES). |
| manage-booking-tool | 1 | Manual / Exclude | Transactional app. |
| manage-order-tool | 1 | Manual / Exclude | Transactional app. |
| **Total** | **260** | | |

**Rollup:** Automated ≈ **2 pages** · Content-via-CMS / semi-auto ≈ **256 pages** · Manual/exclude ≈ **2 pages**.

*Note: because the site is already an AEM-backed headless app, the ~136 media-hub articles and other content pages are highly templatised. With AEM/GraphQL export access the 248-page family becomes largely automatable (one importer, many records); without it, each requires rendered-DOM capture (manual-heavy). This single decision swings the estimate substantially.*

---

## 5. Integrations Analysis

| Integration | Type | Complexity | Where used |
|-------------|------|-----------|-----------|
| Adobe Experience Manager (headless + GraphQL) | API / CMS backend | High | Site-wide (`__env__.aem_host` / `graphql_api`, `assets.adobedtm.com`) |
| Adobe DTM / Launch (tag manager + analytics) | Custom code / embed | Medium | All pages |
| Google Tag Manager + gtag / dataLayer | Embed | Medium | All pages (GTM-TB3GRWRT) |
| OneTrust cookie consent | Embed / plugin | Low | All pages (`cdn.cookielaw.org`) |
| Media CDN (`media.riyadhair.com`) | Asset delivery | Low | All pages (images/video) |
| Booking / order engine | External app | High | `/en/manage/*`, plan-book booking flow |
| Social embeds (Instagram, X, Facebook, YouTube, Threads, TikTok, LinkedIn, Snapchat) | Embed / link | Low | Footer |
| Akamai bot protection / CDN | Platform | Medium | Site-wide (blocks robots.txt & XML sitemap) |
| Next.js runtime / hydration | Framework | High | All content pages |

---

## 6. Complex Use Cases & Observations

| # | Complex behaviour | Instances | Where | Why complex |
|---|-------------------|----------:|-------|-------------|
| 1 | Client-side-rendered content (Next.js hydration) | ~256 | content-landing, help, feature | Content absent from delivered HTML; source from AEM/GraphQL or rendered DOM. |
| 2 | Headless AEM + GraphQL backend | site-wide | all content | Content model in AEM; path depends on export/API access. |
| 3 | Transactional apps (manage booking/order, plan-book) | ~3+ areas | `/en/manage/*`, plan-book | Out of EDS content scope; integration or link-out. |
| 4 | Help-centre search | ~36 | `/en/help/*` | Dynamic search/index behaviour to reproduce. |
| 5 | Bot protection (Akamai) | site-wide | all pages | Blocks robots.txt/XML sitemap; import tooling needs browser context + throttling. |
| 6 | 9 custom/unknown block compositions | ~10 uses (pattern repeats) | content pages | Bespoke hydrated fragments; require content modeling. |
| 7 | Bilingual content in EN tree (`-es` pages) | ~5 | legal/conditions/fare pages | Locale handling within a single tree. |
| 8 | Large press-release archive | 136 | `/en/media-hub/*` | Volume; ideal for automation if CMS export available. |

---

## 7. Migration Estimates

Estimates cover the **English content site** (260 pages, 8 templates, 21 blocks). Excludes the booking/order transactional apps.

### Effort by workstream

| Workstream | Estimate | Notes |
|-----------|---------|-------|
| Block development (21 variants → ~8–10 EDS blocks + variations) | 8–12 days | Incl. 9 custom compositions, search, newsletter |
| Template setup (8 templates) | 4–5 days | content-landing dominates |
| Content import — with AEM/GraphQL export | 4–6 days | Scripted bulk import of 248-page family + 136 articles |
| Content import — without API (rendered-DOM capture) | +10–16 days | Contingency if no CMS access |
| Header / footer / navigation (global) | 3–4 days | Mega-nav + newsletter footer |
| Help-centre search | 2–4 days | Index + search behaviour |
| Integrations & analytics re-wire (AEM/GTM/DTM/OneTrust) | 4–6 days | + runtime audit |
| QA & testing (functional, visual, a11y, PageSpeed) | 6–8 days | Target Lighthouse 100 |
| PM / UAT / fixes | 4–6 days | |

### Totals by scenario

| Scenario | Total effort | Schedule | Indicative cost (~$600/day) |
|----------|-------------|----------|------------------------------|
| With AEM/GraphQL content export (recommended) | ~35–51 person-days | ~7–9 weeks | ≈ $21k–$31k |
| Without API (DOM capture) | ~45–67 person-days | ~9–12 weeks | ≈ $27k–$40k |

### Team & phasing

- Recommended team: 2 developers + 1 QA + PM (part-time).
- Phase 1 — Blocks + templates + global navigation
- Phase 2 — Content import (API-driven if possible)
- Phase 3 — Help search + integrations
- Phase 4 — QA / UAT

---

## 8. Caveats & Assumptions

- Akamai protection blocks robots.txt and the XML sitemap; URLs were harvested from the on-site `/en/sitemap` page (260 URLs, high confidence). Page rendering succeeded via a real browser (100% analysed).
- Content is client-rendered from headless AEM; the biggest cost driver is whether CMS/GraphQL export access is available.
- Manage booking / order and the booking flow are transactional applications and are excluded from the content-migration counts and estimates.
- Cost figures are indicative and use a placeholder blended day rate; adjust to your actual rates.

---

## 9. Analysis Artifacts

| Artifact | Description |
|----------|-------------|
| `template-catalog.json` | 8 named templates with page assignments and reference URLs |
| `block-catalog.json` | 21 block variants with usage counts and canonical models |
| `summary.json` | Site metrics and coverage summary |
| `urls-all.json` / `urls-grouped.json` | 260 discovered URLs, grouped by directory pattern |
| `.pages/{slug}/full-page.jpg` | Full-page screenshot per analysed page |
| `.blocks/{variant}/screenshots/` | Screenshots per block variant |

---

*End of handover document.*
