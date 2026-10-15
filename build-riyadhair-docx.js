/* Build the Riyadh Air (en) EDS migration handover as a .docx with embedded screenshots */
const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun,
  Table, TableRow, TableCell, WidthType, BorderStyle,
  ShadingType, ImageRun,
} = require('docx');

const RX_PURPLE = '3B1E6E';   // Riyadh Air deep purple
const RX_ACCENT = '5B2A9E';
const INK = '1A1A2E';
const BAND = 'F4F2F8';
const HEADROW = '3B1E6E';
const CAT = '/backups/PriyaSinha20/ema-project/repo/catalog';

// Minimal dependency-free JPEG dimension reader (reads SOFn markers).
function jpegSize(buf) {
  let off = 2;
  while (off < buf.length) {
    if (buf[off] !== 0xff) { off += 1; continue; }
    const marker = buf[off + 1];
    if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7)
      || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf)) {
      const height = buf.readUInt16BE(off + 5);
      const width = buf.readUInt16BE(off + 7);
      return { width, height };
    }
    const len = buf.readUInt16BE(off + 2);
    off += 2 + len;
  }
  return { width: 1440, height: 900 };
}
function image(path, caption, maxW = 560, maxH = 720) {
  const out = [];
  try {
    const data = fs.readFileSync(path);
    const { width, height } = jpegSize(data);
    const scale = Math.min(maxW / width, maxH / height, 1);
    out.push(new Paragraph({
      spacing: { before: 60, after: 20 },
      children: [new ImageRun({ type: 'jpg', data, transformation: { width: Math.round(width * scale), height: Math.round(height * scale) } })],
    }));
    if (caption) {
      out.push(new Paragraph({ spacing: { after: 140 },
        children: [new TextRun({ text: caption, italics: true, size: 16, color: '5A5A6A' })] }));
    }
  } catch (e) {
    out.push(new Paragraph({ spacing: { after: 120 },
      children: [new TextRun({ text: `[screenshot unavailable: ${caption || path}]`, italics: true, size: 16, color: 'B0203C' })] }));
  }
  return out;
}

function h1(text) {
  return new Paragraph({ spacing: { before: 320, after: 140 },
    border: { bottom: { color: RX_ACCENT, size: 18, style: BorderStyle.SINGLE, space: 4 } },
    children: [new TextRun({ text, bold: true, size: 30, color: INK })] });
}
function h2(text) {
  return new Paragraph({ spacing: { before: 200, after: 80 },
    children: [new TextRun({ text, bold: true, size: 24, color: RX_ACCENT })] });
}
function para(text, opts = {}) {
  return new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text, size: 21, ...opts })] });
}
function bullet(text) {
  return new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text, size: 21 })] });
}
function cell(content, { header = false, bg, bold = false, align } = {}) {
  const runs = Array.isArray(content) ? content : [content];
  return new TableCell({
    shading: bg ? { type: ShadingType.CLEAR, fill: bg, color: 'auto' } : undefined,
    margins: { top: 60, bottom: 60, left: 90, right: 90 },
    children: [new Paragraph({ alignment: align,
      children: runs.map((t) => new TextRun({ text: String(t), size: 18, bold: header || bold, color: header ? 'FFFFFF' : INK })) })],
  });
}
function table(headers, rows, widths) {
  const border = { style: BorderStyle.SINGLE, size: 4, color: 'E2E2EA' };
  const borders = { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border };
  const headerRow = new TableRow({ tableHeader: true, children: headers.map((h) => cell(h, { header: true, bg: HEADROW })) });
  const bodyRows = rows.map((r, i) => new TableRow({
    children: r.map((c) => {
      const bg = i % 2 === 1 ? BAND : undefined;
      if (c && typeof c === 'object' && !Array.isArray(c)) return cell(c.text, { bg: c.bg || bg, bold: c.bold, align: c.align });
      return cell(c, { bg });
    }),
  }));
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: widths, borders, rows: [headerRow, ...bodyRows] });
}
function spacer() { return new Paragraph({ spacing: { after: 120 }, children: [] }); }

const children = [];

// Cover
children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: 'EDS MIGRATION — SCOPE & ANALYSIS HANDOVER', bold: true, size: 18, color: RX_ACCENT })] }));
children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: 'Riyadh Air (en)', bold: true, size: 48, color: RX_PURPLE })] }));
children.push(para('Content-layer migration assessment for Adobe Edge Delivery Services', { italics: true, color: '5A5A6A', size: 22 }));
children.push(spacer());
children.push(table(['Field', 'Value'], [
  ['Site analysed', 'https://www.riyadhair.com/en/home'],
  ['Analysis date', '2026-08-25'],
  ['Pages discovered', '260 (260 analysed — 100% coverage, 0 failed)'],
  ['Locale', 'en'],
  ['Templates', '8'],
  ['Block variants', '21'],
  ['Platform detected', 'Next.js SPA + headless Adobe AEM (GraphQL), behind Akamai'],
], [3000, 6360]));

// 1. Executive summary
children.push(h1('1. Executive Summary'));
children.push(para('A full crawl and structural analysis of the Riyadh Air English site was completed to scope an Adobe Edge Delivery Services (EDS) migration.'));
children.push(bullet('260 pages discovered via the on-site /en/sitemap page (Akamai blocks robots.txt & XML sitemap).'));
children.push(bullet('260 pages analysed — 100% coverage, 0 failures.'));
children.push(bullet('8 unique page templates identified.'));
children.push(bullet('21 reusable block variants catalogued.'));
children.push(bullet('1 locale in scope (en), with a few embedded Spanish legal pages.'));
children.push(spacer());
children.push(new Paragraph({
  shading: { type: ShadingType.CLEAR, fill: 'F1ECFA', color: 'auto' },
  border: { left: { color: RX_ACCENT, size: 18, style: BorderStyle.SINGLE, space: 6 } },
  spacing: { after: 120 },
  children: [
    new TextRun({ text: 'Key finding: ', bold: true, color: RX_ACCENT, size: 21 }),
    new TextRun({ text: 'Riyadh Air is a Next.js single-page application backed by headless Adobe AEM (content served via GraphQL), behind Akamai bot protection. Most interior-page content renders client-side, so static captures show mainly the header/hero shell and newsletter footer. This is why 248 of 260 pages fingerprinted into one structural template. The biggest migration cost driver is whether AEM/GraphQL content export access is available — with it, the large content family becomes highly automatable; without it, expect rendered-DOM capture per page.', size: 21 }),
  ],
}));

// 2. Templates Inventory
children.push(h1('2. Templates Inventory'));
children.push(table(['#', 'Template', 'Complexity', 'Reasoning', 'Reference URL'], [
  ['1', 'content-landing', 'High', 'Universal Next.js layout: nav, hero panel w/ sub-links, intro, alternating image+text feature sections + CTAs, newsletter footer. Content hydrated client-side. Spans home, section landings, about-us, experience, sfeer, discover-riyadh, plan-book, media-hub articles.', '/en/home, /en/about-us'],
  ['2', 'feature-detail', 'Medium', 'Feature/detail variant with hero + media-rich body sections.', '/en/experience/chauffeur'],
  ['3', 'help-article', 'Medium', 'Breadcrumb + "Explore all help articles" search box + heading + client-rendered body.', '/en/help/flight-disruption-policy'],
  ['4', 'help-article-rich', 'Medium', 'Help article with richer inline structured media.', '/en/help/in-flight-entertainment-and-wi-fi'],
  ['5', 'legal-terms', 'Low', 'Heading + long-form legal rich text + footer.', '/en/legal/best-offer-guaranteed-terms-conditions'],
  ['6', 'localized-legal', 'Low', 'Spanish-language legal doc inside the English tree.', '/en/conditions-of-carriage-es'],
  ['7', 'manage-booking-tool', 'High', 'Booking-servicing application page (cancel booking); minimal static markup.', '/en/manage/cancel-booking'],
  ['8', 'manage-order-tool', 'High', 'Order-retrieval/servicing application page.', '/en/manage/manage-order'],
], [500, 1900, 1150, 3650, 2110]));

// Template screenshots
children.push(h2('Template screenshots'));
const tplShots = [
  ['content-landing', 'www_riyadhair_com_en_about-us--e5e34d22'],
  ['feature-detail', 'www_riyadhair_com_en_experience_chauffeur--02595f1c'],
  ['help-article', 'www_riyadhair_com_en_help_flight-disruption-policy--9fe65248'],
  ['help-article-rich', 'www_riyadhair_com_en_help_in-flight-entertainment-and-wi-fi--7e08d499'],
  ['legal-terms', 'www_riyadhair_com_en_legal_best-offer-guaranteed-terms-conditions--7b2bdb51'],
  ['localized-legal', 'www_riyadhair_com_en_conditions-of-carriage-es--62c09133'],
  ['manage-booking-tool', 'www_riyadhair_com_en_manage_cancel-booking--460e079a'],
  ['manage-order-tool', 'www_riyadhair_com_en_manage_manage-order--086ca38c'],
];
for (const [name, slug] of tplShots) {
  children.push(new Paragraph({ spacing: { before: 120, after: 20 }, children: [new TextRun({ text: name, bold: true, size: 20, color: INK })] }));
  image(`${CAT}/.pages/${slug}/full-page.jpg`, `Template: ${name} — representative page`, 560, 720).forEach((p) => children.push(p));
}

// 3. Blocks
children.push(h1('3. Blocks / Components Catalog'));
children.push(para('21 block variants catalogued and consolidated by content model — visual variations grouped as variants of the same base block.'));
children.push(table(['Block (base)', 'Variants', 'Complexity', 'Behaviour / Functionality', 'Reference URL'], [
  ['header (global)', '1', 'Medium', 'Sticky nav: logo, primary menu (Plan & book, Manage, Experience, Discover Riyadh, Sfeer, About us, Help), language switcher, account, hamburger.', 'all pages'],
  ['footer (global)', '1', 'Medium', 'Newsletter subscribe with consent checkbox + 4-column link nav + social icons + "A PIF Company" + legal row.', 'all pages'],
  ['hero', '6', 'Low–Med', 'Page banner: title, sub-links, branded imagery; light/dark, with/without image. Dominant block: 244 pages.', '/en/home'],
  ['cards', '1', 'Medium', 'Card grid (feature/section cards with image + heading + CTA).', '/en/home'],
  ['columns', '1', 'Low', 'Alternating image+text feature rows.', '/en/home'],
  ['search', '2', 'Medium', 'Help-centre "Search for anything" box with submit.', '/en/help/flight-disruption-policy'],
  ['custom / unknown', '9', 'High', 'Composite hydrated fragments — heading+image+CTA+paragraph combos, multi-heading/image/CTA grids, styled text. No standard EDS equivalent.', 'across content pages'],
], [1700, 900, 1200, 3860, 1700]));

children.push(h2('Block screenshots'));
const blockShots = [
  ['header', `${CAT}/.blocks/header-global/screenshots/block-6dd58b428a01.jpg`],
  ['hero', `${CAT}/.blocks/hero-minimal-dark-withimg/screenshots/block-cab5a10fac24.jpg`],
  ['cards', `${CAT}/.blocks/cards-minimal-dark-withimg/screenshots/block-40e8f83f46a8.jpg`],
  ['columns', `${CAT}/.blocks/columns-minimal-dark-withimg/screenshots/block-31f5bb27aca6.jpg`],
  ['search', `${CAT}/.blocks/search-minimal-dark/screenshots/block-820aead38541.jpg`],
  ['footer', `${CAT}/.blocks/footer-global/screenshots/block-26424ca3b7fd.jpg`],
];
for (const [name, path] of blockShots) {
  children.push(new Paragraph({ spacing: { before: 100, after: 20 }, children: [new TextRun({ text: name, bold: true, size: 20, color: INK })] }));
  image(path, `Block: ${name}`, 560, 420).forEach((p) => children.push(p));
}

// 4. Page counts
children.push(h1('4. Page Counts by Template & Migration Classification'));
children.push(table(['Template', 'Pages', 'Migration Path', 'Rationale'], [
  ['content-landing', '248', 'Manual-heavy (content via AEM/GraphQL)', 'Identical shells; actual content client-rendered from AEM. Bulk-scriptable only with API access.'],
  ['feature-detail', '4', 'Semi-auto', 'Media-rich composition.'],
  ['help-article', '3', 'Semi-auto', 'Search + client-rendered body.'],
  ['help-article-rich', '1', 'Semi-auto', 'Richer inline media.'],
  ['legal-terms', '1', 'Automated', 'Static rich text.'],
  ['localized-legal', '1', 'Automated', 'Static rich text (ES).'],
  ['manage-booking-tool', '1', 'Manual / Exclude', 'Transactional app.'],
  ['manage-order-tool', '1', 'Manual / Exclude', 'Transactional app.'],
  [
    { text: 'Total', bold: true, bg: 'F1ECFA' },
    { text: '260', bold: true, bg: 'F1ECFA' },
    { text: 'Automated 2', bold: true, bg: 'F1ECFA' },
    { text: 'Content-via-CMS/semi-auto 256 · Manual 2', bold: true, bg: 'F1ECFA' },
  ],
], [2400, 900, 2500, 3460]));
children.push(para('Note: because the site is already an AEM-backed headless app, the ~136 media-hub articles and other content pages are highly templatised. With AEM/GraphQL export access the 248-page family becomes largely automatable (one importer, many records); without it, each requires rendered-DOM capture (manual-heavy). This single decision swings the estimate substantially.', { italics: true, color: '5A5A6A', size: 18 }));

// 5. Integrations
children.push(h1('5. Integrations Analysis'));
children.push(table(['Integration', 'Type', 'Complexity', 'Where used'], [
  ['Adobe Experience Manager (headless + GraphQL)', 'API / CMS backend', 'High', 'Site-wide (__env__.aem_host / graphql_api, assets.adobedtm.com)'],
  ['Adobe DTM / Launch (tag manager + analytics)', 'Custom code / embed', 'Medium', 'All pages'],
  ['Google Tag Manager + gtag / dataLayer', 'Embed', 'Medium', 'All pages (GTM-TB3GRWRT)'],
  ['OneTrust cookie consent', 'Embed / plugin', 'Low', 'All pages (cdn.cookielaw.org)'],
  ['Media CDN (media.riyadhair.com)', 'Asset delivery', 'Low', 'All pages (images/video)'],
  ['Booking / order engine', 'External app', 'High', '/en/manage/*, plan-book booking flow'],
  ['Social embeds (Instagram, X, Facebook, YouTube, Threads, TikTok, LinkedIn, Snapchat)', 'Embed / link', 'Low', 'Footer'],
  ['Akamai bot protection / CDN', 'Platform', 'Medium', 'Site-wide (blocks robots.txt & XML sitemap)'],
  ['Next.js runtime / hydration', 'Framework', 'High', 'All content pages'],
], [3500, 2100, 1300, 2360]));

// 6. Complex use cases
children.push(h1('6. Complex Use Cases & Observations'));
children.push(table(['#', 'Complex behaviour', 'Instances', 'Where', 'Why complex'], [
  ['1', 'Client-side-rendered content (Next.js hydration)', '~256', 'content-landing, help, feature', 'Content absent from delivered HTML; source from AEM/GraphQL or rendered DOM.'],
  ['2', 'Headless AEM + GraphQL backend', 'site-wide', 'all content', 'Content model in AEM; path depends on export/API access.'],
  ['3', 'Transactional apps (manage booking/order, plan-book)', '~3+ areas', '/en/manage/*, plan-book', 'Out of EDS content scope; integration or link-out.'],
  ['4', 'Help-centre search', '~36', '/en/help/*', 'Dynamic search/index behaviour to reproduce.'],
  ['5', 'Bot protection (Akamai)', 'site-wide', 'all pages', 'Blocks robots.txt/XML sitemap; import tooling needs browser context + throttling.'],
  ['6', '9 custom/unknown block compositions', '~10 uses (pattern repeats)', 'content pages', 'Bespoke hydrated fragments; require content modeling.'],
  ['7', 'Bilingual content in EN tree (-es pages)', '~5', 'legal/conditions/fare pages', 'Locale handling within a single tree.'],
  ['8', 'Large press-release archive', '136', '/en/media-hub/*', 'Volume; ideal for automation if CMS export available.'],
], [500, 2500, 1250, 2200, 2810]));

// 7. Migration estimates
children.push(h1('7. Migration Estimates'));
children.push(para('Estimates cover the English content site (260 pages, 8 templates, 21 blocks). Excludes the booking/order transactional apps.'));
children.push(h2('Effort by workstream'));
children.push(table(['Workstream', 'Estimate', 'Notes'], [
  ['Block development (21 variants → ~8–10 EDS blocks + variations)', '8–12 days', 'Incl. 9 custom compositions, search, newsletter'],
  ['Template setup (8 templates)', '4–5 days', 'content-landing dominates'],
  ['Content import — with AEM/GraphQL export', '4–6 days', 'Scripted bulk import of 248-page family + 136 articles'],
  ['Content import — without API (rendered-DOM capture)', '+10–16 days', 'Contingency if no CMS access'],
  ['Header / footer / navigation (global)', '3–4 days', 'Mega-nav + newsletter footer'],
  ['Help-centre search', '2–4 days', 'Index + search behaviour'],
  ['Integrations & analytics re-wire (AEM/GTM/DTM/OneTrust)', '4–6 days', '+ runtime audit'],
  ['QA & testing (functional, visual, a11y, PageSpeed)', '6–8 days', 'Target Lighthouse 100'],
  ['PM / UAT / fixes', '4–6 days', ''],
], [4600, 1800, 3860]));
children.push(h2('Totals by scenario'));
children.push(table(['Scenario', 'Total effort', 'Schedule', 'Indicative cost (~$600/day)'], [
  ['With AEM/GraphQL content export (recommended)', '~35–51 person-days', '~7–9 weeks', '≈ $21k–$31k'],
  ['Without API (DOM capture)', '~45–67 person-days', '~9–12 weeks', '≈ $27k–$40k'],
], [3600, 2200, 2000, 2460]));
children.push(h2('Team & phasing'));
children.push(bullet('Recommended team: 2 developers + 1 QA + PM (part-time).'));
children.push(bullet('Phase 1 — Blocks + templates + global navigation'));
children.push(bullet('Phase 2 — Content import (API-driven if possible)'));
children.push(bullet('Phase 3 — Help search + integrations'));
children.push(bullet('Phase 4 — QA / UAT'));

// 8. Caveats
children.push(h1('8. Caveats & Assumptions'));
children.push(bullet('Akamai protection blocks robots.txt and the XML sitemap; URLs were harvested from the on-site /en/sitemap page (260 URLs, high confidence). Page rendering succeeded via a real browser (100% analysed).'));
children.push(bullet('Content is client-rendered from headless AEM; the biggest cost driver is whether CMS/GraphQL export access is available.'));
children.push(bullet('Manage booking / order and the booking flow are transactional applications and are excluded from the content-migration counts and estimates.'));
children.push(bullet('Cost figures are indicative and use a placeholder blended day rate; adjust to your actual rates.'));

// 9. Artifacts
children.push(h1('9. Analysis Artifacts'));
children.push(table(['Artifact', 'Description'], [
  ['template-catalog.json', '8 named templates with page assignments and reference URLs'],
  ['block-catalog.json', '21 block variants with usage counts and canonical models'],
  ['summary.json', 'Site metrics and coverage summary'],
  ['urls-all.json / urls-grouped.json', '260 discovered URLs, grouped by directory pattern'],
  ['.pages/{slug}/full-page.jpg', 'Full-page screenshot per analysed page'],
  ['.blocks/{variant}/screenshots/', 'Screenshots per block variant'],
], [3400, 6860]));

children.push(new Paragraph({ spacing: { before: 300 },
  border: { top: { color: 'E2E2EA', size: 6, style: BorderStyle.SINGLE, space: 6 } },
  children: [new TextRun({ text: 'Riyadh Air (en) — EDS Migration Handover · Generated 2026-08-25 · Content-layer scope only (excludes transactional booking/order applications).', italics: true, color: '5A5A6A', size: 16 })] }));

const doc = new Document({
  creator: 'EDS Migration Analysis',
  title: 'Riyadh Air (en) — EDS Migration Handover',
  styles: { default: { document: { run: { font: 'Calibri' } } } },
  sections: [{ properties: { page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } }, children }],
});

Packer.toBuffer(doc).then((buf) => {
  const out = process.argv[2] || 'riyadhair-en-migration-handover.docx';
  fs.writeFileSync(out, buf);
  console.log('Wrote', out, '(' + buf.length + ' bytes)');
});
