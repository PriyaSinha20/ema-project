/* Build the Virgin Atlantic (en-IN) EDS migration handover as a .docx */
const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, BorderStyle,
  AlignmentType, ShadingType, ImageRun,
} = require('docx');

const CAT = '/backups/PriyaSinha20/ema-project/repo/catalog/catalog';

// Minimal dependency-free JPEG dimension reader (reads SOFn markers).
function jpegSize(buf) {
  let off = 2; // skip SOI
  while (off < buf.length) {
    if (buf[off] !== 0xff) { off += 1; continue; }
    const marker = buf[off + 1];
    // SOF0..SOF3, SOF5..SOF7, SOF9..SOF11, SOF13..SOF15 carry dimensions
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

// Build an embedded, caption-labelled image scaled to fit within maxW x maxH (px).
function image(path, caption, maxW = 620, maxH = 560) {
  const out = [];
  try {
    const data = fs.readFileSync(path);
    const { width, height } = jpegSize(data);
    const scale = Math.min(maxW / width, maxH / height, 1);
    const w = Math.round(width * scale);
    const h = Math.round(height * scale);
    out.push(new Paragraph({
      spacing: { before: 60, after: 20 },
      children: [new ImageRun({ type: 'jpg', data, transformation: { width: w, height: h } })],
    }));
    if (caption) {
      out.push(new Paragraph({
        spacing: { after: 140 },
        children: [new TextRun({ text: caption, italics: true, size: 16, color: '5A5A6A' })],
      }));
    }
  } catch (e) {
    out.push(new Paragraph({
      spacing: { after: 120 },
      children: [new TextRun({ text: `[screenshot unavailable: ${caption || path}]`, italics: true, size: 16, color: 'B0203C' })],
    }));
  }
  return out;
}

const VA_RED = 'CC0033';
const INK = '1A1A2E';
const BAND = 'F5F5F8';
const HEADROW = '1A1A2E';

// ---- helpers ---------------------------------------------------------------
function h1(text) {
  return new Paragraph({
    spacing: { before: 320, after: 140 },
    border: { bottom: { color: VA_RED, size: 18, style: BorderStyle.SINGLE, space: 4 } },
    children: [new TextRun({ text, bold: true, size: 30, color: INK })],
  });
}
function h2(text) {
  return new Paragraph({
    spacing: { before: 200, after: 80 },
    children: [new TextRun({ text, bold: true, size: 24, color: VA_RED })],
  });
}
function para(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 100 },
    children: [new TextRun({ text, size: 21, ...opts })],
  });
}
function bullet(text) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 40 },
    children: [new TextRun({ text, size: 21 })],
  });
}
function cell(content, { header = false, bg, bold = false, align } = {}) {
  const runs = Array.isArray(content) ? content : [content];
  return new TableCell({
    shading: bg ? { type: ShadingType.CLEAR, fill: bg, color: 'auto' } : undefined,
    margins: { top: 60, bottom: 60, left: 90, right: 90 },
    children: [new Paragraph({
      alignment: align,
      children: runs.map((t) =>
        new TextRun({ text: String(t), size: 18, bold: header || bold, color: header ? 'FFFFFF' : INK })),
    })],
  });
}
function table(headers, rows, widths) {
  const border = { style: BorderStyle.SINGLE, size: 4, color: 'E2E2EA' };
  const borders = { top: border, bottom: border, left: border, right: border,
    insideHorizontal: border, insideVertical: border };
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((htext) => cell(htext, { header: true, bg: HEADROW })),
  });
  const bodyRows = rows.map((r, i) =>
    new TableRow({
      children: r.map((c) => {
        const bg = i % 2 === 1 ? BAND : undefined;
        if (c && typeof c === 'object' && !Array.isArray(c)) {
          return cell(c.text, { bg: c.bg || bg, bold: c.bold, align: c.align });
        }
        return cell(c, { bg });
      }),
    }));
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: widths,
    borders,
    rows: [headerRow, ...bodyRows],
  });
}
function spacer() { return new Paragraph({ spacing: { after: 120 }, children: [] }); }

// ---- content ---------------------------------------------------------------
const children = [];

// Cover
children.push(new Paragraph({
  spacing: { after: 40 },
  children: [new TextRun({ text: 'EDS MIGRATION — SCOPE & ANALYSIS HANDOVER', bold: true, size: 18, color: VA_RED })],
}));
children.push(new Paragraph({
  spacing: { after: 40 },
  children: [new TextRun({ text: 'Virgin Atlantic (en-IN)', bold: true, size: 48, color: INK })],
}));
children.push(para('Content-layer migration assessment for Adobe Edge Delivery Services', { italics: true, color: '5A5A6A', size: 22 }));
children.push(spacer());
children.push(table(
  ['Field', 'Value'],
  [
    ['Site analysed', 'https://www.virginatlantic.com/en-IN'],
    ['Analysis date', '2026-08-25'],
    ['Pages discovered', '446 (444 analysed — 99.6% coverage)'],
    ['Locale', 'en-IN'],
    ['Templates', '12'],
    ['Block variants', '27'],
  ],
  [3000, 6360],
));

// 1. Executive Summary
children.push(h1('1. Executive Summary'));
children.push(para('A full crawl and structural analysis of the India locale of virginatlantic.com was completed to scope an Adobe Edge Delivery Services (EDS) migration.'));
children.push(bullet('446 pages discovered via the site XML sitemap (hreflang alternates).'));
children.push(bullet('444 pages successfully analysed — 99.6% coverage (2 pages failed to render).'));
children.push(bullet('12 unique page templates identified.'));
children.push(bullet('27 reusable block variants catalogued.'));
children.push(bullet('1 locale in scope (en-IN).'));
children.push(spacer());
children.push(new Paragraph({
  shading: { type: ShadingType.CLEAR, fill: 'FFF6F8', color: 'auto' },
  border: { left: { color: VA_RED, size: 18, style: BorderStyle.SINGLE, space: 6 } },
  spacing: { after: 120 },
  children: [
    new TextRun({ text: 'Key constraint: ', bold: true, color: VA_RED, size: 21 }),
    new TextRun({ text: 'The passenger site is a JavaScript-heavy, application-driven site behind Akamai bot protection. The booking engine, check-in, flight status, seat maps and account areas run on separate application subdomains (flights., flywith., vaabrowse.virginatlantic.com) and are OUT OF SCOPE for content migration — they are transactional applications, not authored content. The 446 pages in this report are the migratable marketing/content layer.', size: 21 }),
  ],
}));

// 2. Templates Inventory
children.push(h1('2. Templates Inventory'));
children.push(table(
  ['#', 'Template', 'Complexity', 'Reasoning', 'Reference URL'],
  [
    ['1', 'marketing-landing', 'High', 'Section-hub landing: hero, promo cards, alternating image+text rows, icon-link row. Some regions render client-side.', '/en-IN, /en-IN/corporate'],
    ['2', 'rich-text-article', 'Low', 'Hero banner + breadcrumb + long-form rich text. Standardized.', '/en-IN/policies/air-carrier-access-act'],
    ['3', 'editorial-travel-guide', 'Medium', 'Byline/read-time, hero, alternating story sections, inline CTA, related-inspiration teaser.', '/en-IN/inspiration/africa/cape-town-travel-guide'],
    ['4', 'client-rendered-content', 'High', 'Main content rendered client-side; static capture shows only header/footer shell.', '/en-IN/contact-us/payment-options'],
    ['5', 'accordion-content', 'Medium', 'Hero + intro + expand/collapse accordion sections + contact block.', '/en-IN/corporate/engineering'],
    ['6', 'news-listing', 'Medium', 'Hero + CTAs + dated card grid + "See all" pagination.', '/en-IN/travel-news'],
    ['7', 'promo-feature', 'Medium', 'Campaign/reward layout: hero, media-rich sections, CTA blocks.', '/en-IN/experience/football-world-cup-2026'],
    ['8', 'reference-document', 'Low', 'Hero + short reference text/links. Sparse.', '/en-IN/corporate/annual-reports'],
    ['9', 'inspiration-hub', 'Medium', 'Inspiration index: hero + card grid to guides.', '/en-IN/inspiration/south-korea'],
    ['10', 'destination-detail', 'Medium', 'Where-we-fly leaf: hero, destination overview, booking prompts.', '/en-IN/where-we-fly/caribbean/tobago'],
    ['11', 'itinerary-guide', 'Medium', 'Stepped/day-by-day editorial content.', '/en-IN/where-we-fly/.../los-angeles-itinerary'],
    ['12', 'manage-booking-app', 'High', 'Application/tool page driven by embedded booking app; minimal static markup.', '/en-IN/manage-booking'],
  ],
  [500, 1900, 1200, 3560, 2200],
));

// Template screenshots gallery
children.push(h2('Template screenshots'));
const tplShots = [
  ['marketing-landing', 'www_virginatlantic_com_en-IN--075b852c'],
  ['rich-text-article', 'www_virginatlantic_com_en-IN_corporate_business-for-good_resources--46e3ec61'],
  ['editorial-travel-guide', 'www_virginatlantic_com_en-IN_inspiration_africa_cape-town-travel-guide--f5e5c39f'],
  ['accordion-content', 'www_virginatlantic_com_en-IN_corporate_engineering--265758a9'],
  ['news-listing', 'www_virginatlantic_com_en-IN_travel-news--72f16d7a'],
  ['promo-feature', 'www_virginatlantic_com_en-IN_experience_football-world-cup-2026--1bf87776'],
  ['reference-document', 'www_virginatlantic_com_en-IN_corporate_annual-reports--1917e240'],
  ['inspiration-hub', 'www_virginatlantic_com_en-IN_inspiration_south-korea--e4ac8c9d'],
  ['destination-detail', 'www_virginatlantic_com_en-IN_where-we-fly_caribbean_tobago--20f7868e'],
  ['itinerary-guide', 'www_virginatlantic_com_en-IN_where-we-fly_north-america_usa_california_savannah-sachdev-los-angeles-itinerary--93196e30'],
  ['client-rendered-content', 'www_virginatlantic_com_en-IN_contact-us_payment-options--f461e4e6'],
  ['manage-booking-app', 'www_virginatlantic_com_en-IN_manage-booking--d52e41bd'],
];
for (const [name, slug] of tplShots) {
  children.push(new Paragraph({
    spacing: { before: 120, after: 20 },
    children: [new TextRun({ text: name, bold: true, size: 20, color: INK })],
  }));
  image(`${CAT}/.pages/${slug}/full-page.jpg`, `Template: ${name} — representative page`, 560, 720).forEach((p) => children.push(p));
}

// 3. Blocks
children.push(h1('3. Blocks / Components Catalog'));
children.push(para('27 block variants catalogued and consolidated by content model — visual variations are grouped as variants of the same base block rather than as separate blocks.'));
children.push(table(
  ['Block (base)', 'Variants', 'Complexity', 'Behaviour / Functionality', 'Reference URL'],
  [
    ['header (global)', '1', 'Medium', 'Sticky nav: logo, Sign in, "My booking" flyout (Manage booking / Check in / Flight status), hamburger mega-menu.', 'all pages'],
    ['footer (global)', '1', 'Low', '4-column link nav, social icons, legal/Travel-Aware notice.', 'all pages'],
    ['hero', '4', 'Low–Med', 'Page banner: heading over full-bleed image or solid panel; light/dark themes.', '/en-IN'],
    ['cards', '3', 'Medium', 'Card grid — feature/promo/news cards with image, heading, text, CTA. Most-used block: 279 pages.', '/en-IN/travel-news'],
    ['breadcrumbs', '5', 'Low', 'Home > Section > Page trail; light/dark themes.', '/en-IN/corporate/engineering'],
    ['columns', '1', 'Low', 'Multi-column image+text feature rows.', '/en-IN'],
    ['carousel', '1', 'Medium', 'Rotating slides/gallery.', '3 pages'],
    ['tabs', '1', 'Medium', 'Tabbed content switcher.', '1 page'],
    ['table', '1', 'Low', 'Data table (fees/specs).', '1 page'],
    ['form', '1', 'High', 'Interactive form (contact/feedback).', '1 page'],
    ['accordion / expander', '~3', 'Medium', 'Expand/collapse sections.', '/en-IN/corporate/engineering'],
    ['unknown / custom', '8', 'High', 'Composite fragments with no standard EDS equivalent (heading+CTA+list combos, image grids, grid-item React components).', 'various'],
  ],
  [1700, 900, 1200, 3860, 1700],
));
children.push(para('Representative screenshots of the base blocks are shown below (one per block type).', { italics: true, color: '5A5A6A', size: 18 }));

// Block screenshots gallery
children.push(h2('Block screenshots'));
const blockShots = [
  ['header', `${CAT}/.blocks/header-global/screenshots/block-6dd58b428a01.jpg`],
  ['hero', `${CAT}/.blocks/hero-minimal-dark-withimg-1/screenshots/block-23f921a8948a.jpg`],
  ['breadcrumbs', `${CAT}/.blocks/breadcrumbs-minimal-dark-2/screenshots/block-fb7d0f8a7ff8.jpg`],
  ['cards', `${CAT}/.blocks/cards-minimal-dark-withimg-1/screenshots/block-074d7043dda3.jpg`],
  ['columns', `${CAT}/.blocks/columns-minimal-dark/screenshots/block-2dcc7776270b.jpg`],
  ['carousel', `${CAT}/.blocks/carousel-minimal-dark/screenshots/block-ba080b458acc.jpg`],
  ['tabs', `${CAT}/.blocks/tabs-minimal-dark/screenshots/block-e4d87978c1cf.jpg`],
  ['table', `${CAT}/.blocks/table-minimal-dark/screenshots/block-5effb07811c4.jpg`],
  ['form', `${CAT}/.blocks/form-minimal-dark/screenshots/block-e19ae30493cd.jpg`],
  ['footer', `${CAT}/.blocks/footer-global/screenshots/block-26424ca3b7fd.jpg`],
];
for (const [name, path] of blockShots) {
  children.push(new Paragraph({
    spacing: { before: 100, after: 20 },
    children: [new TextRun({ text: name, bold: true, size: 20, color: INK })],
  }));
  image(path, `Block: ${name}`, 560, 420).forEach((p) => children.push(p));
}

// 4. Page counts
children.push(h1('4. Page Counts by Template & Migration Classification'));
children.push(table(
  ['Template', 'Pages', 'Migration Path', 'Rationale'],
  [
    ['marketing-landing', '319', 'Mixed (bulk auto + QA)', 'Structurally uniform but hero/feature regions vary; some render client-side.'],
    ['rich-text-article', '49', 'Automated', 'Standardized rich text.'],
    ['editorial-travel-guide', '21', 'Automated (light manual)', 'Consistent article structure.'],
    ['client-rendered-content', '18', 'Manual', 'Content not in static HTML; must be rebuilt.'],
    ['accordion-content', '15', 'Semi-auto', 'Accordion behaviour needs block wiring.'],
    ['news-listing', '10', 'Semi-auto', 'Dynamic card feed; needs listing logic.'],
    ['promo-feature', '6', 'Semi-auto', 'Campaign composition varies.'],
    ['reference-document', '2', 'Automated', 'Sparse text.'],
    ['inspiration-hub', '1', 'Semi-auto', 'Index/card grid.'],
    ['destination-detail', '1', 'Semi-auto', 'Overview + booking prompt.'],
    ['itinerary-guide', '1', 'Automated', 'Editorial content.'],
    ['manage-booking-app', '1', 'Manual / Exclude', 'Transactional app, not content.'],
    [
      { text: 'Total', bold: true, bg: 'FFF6F8' },
      { text: '444', bold: true, bg: 'FFF6F8' },
      { text: 'Auto 73 (16%)', bold: true, bg: 'FFF6F8' },
      { text: 'Semi-auto 353 (80%) · Manual 19 (4%)', bold: true, bg: 'FFF6F8' },
    ],
  ],
  [2400, 900, 2300, 3660],
));

// 5. Integrations
children.push(h1('5. Integrations Analysis'));
children.push(table(
  ['Integration', 'Type', 'Complexity', 'Where used'],
  [
    ['Self-hosted Tag Management (tms.virginatlantic.com/.../Bootstrap.js)', 'Custom code / embed', 'High', 'All pages — loads analytics/marketing tags'],
    ['Analytics data layer (window.digitalData / dataLayer)', 'Custom code', 'Medium', 'All pages'],
    ['Booking engine (flights. / flywith. / vaabrowse.)', 'External app (redirect)', 'High', 'Booking, manage-booking, check-in, flight-status'],
    ['Facebook / Meta', 'Pixel + social', 'Low–Med', 'Homepage, social links'],
    ['Social embeds (Instagram, Twitter/X, Pinterest, YouTube)', 'Embed / link', 'Low', 'Footer, editorial pages'],
    ['Flying Club loyalty (vsflyinghub.com)', 'External app', 'Medium', 'Flying Club section'],
    ['Cross-property links (Cargo, Careers, Virgin Holidays)', 'Link-out', 'Low', 'Footer / corporate'],
    ['Akamai bot protection / CDN', 'Platform', 'Medium', 'Site-wide (impacts crawl/migration tooling)'],
    ['React/Next.js runtime (__NEXT_DATA__)', 'Framework', 'High', 'Client-rendered content pages'],
  ],
  [3600, 2100, 1300, 2260],
));
children.push(para('The self-hosted TMS obscures the exact downstream vendors (Adobe/Google/etc. load dynamically). A runtime network audit during migration is recommended to enumerate the full tag list.', { italics: true, color: '5A5A6A', size: 18 }));

// 6. Complex use cases
children.push(h1('6. Complex Use Cases & Observations'));
children.push(table(
  ['#', 'Complex behaviour', 'Instances', 'Where', 'Why complex'],
  [
    ['1', 'Client-side-rendered content (React/Next)', '~19', 'client-rendered-content, manage-booking', 'Content absent from static HTML; must be re-authored.'],
    ['2', 'Booking / transactional apps', 'subdomains', 'flights/flywith/vaabrowse', 'Out of EDS scope; require integration or link-out.'],
    ['3', '"My booking" flyout + session state', 'all pages', 'Global header', 'Auth-gated actions depend on session.'],
    ['4', 'Dynamic news/advisory listing', '10', 'news-listing', 'Date-sorted feed with pagination.'],
    ['5', 'Interactive blocks (accordion, tabs, carousel, form)', '~21', 'accordion/tabs/carousel/form', 'Require JS behaviour beyond static content.'],
    ['6', '8 custom/unknown block variants', '~36 uses', 'across templates', 'No standard EDS equivalent; bespoke modeling required.'],
    ['7', 'Self-hosted TMS / analytics', 'site-wide', 'All pages', 'Full vendor list hidden behind bootstrap loader.'],
    ['8', 'Bot protection (Akamai)', 'site-wide', 'All pages', 'Throttles/blocks automated import tooling.'],
    ['9', 'Deep multilingual/locale sitemap', '446 / ~19 locales', 'sitemap', 'en-IN content largely shared across locales; multi-locale rollout multiplies effort.'],
  ],
  [500, 2600, 1300, 2200, 2660],
));

// 7. Migration estimates
children.push(h1('7. Migration Estimates'));
children.push(para('Estimates cover the en-IN content layer only (446 pages, 12 templates, 27 blocks). Excludes the booking engine and other transactional apps.'));
children.push(h2('Effort by workstream'));
children.push(table(
  ['Workstream', 'Estimate', 'Notes'],
  [
    ['Block development (27 variants → ~12–15 EDS blocks + variations)', '12–16 days', 'Incl. 8 custom + interactive (form/tabs/carousel/accordion)'],
    ['Template setup (12 templates)', '5–7 days', 'Auto-block rules, section styling'],
    ['Automated import (~73 clean pages)', '2–3 days', 'Scripted bulk import'],
    ['Bulk-with-QA import (~353 pages)', '8–12 days', 'Import + per-page correction'],
    ['Manual migration (~19 client-rendered/app pages)', '4–6 days', 'Re-authoring'],
    ['Header / footer / navigation (global)', '3–5 days', 'Mega-menu + "My booking" flyout'],
    ['Integrations & analytics re-implementation', '4–6 days', 'TMS/data-layer/tag re-wire + runtime audit'],
    ['QA & testing (functional, visual, a11y, PageSpeed)', '8–10 days', 'Target Lighthouse 100'],
    ['Project mgmt / UAT / fixes', '5–7 days', ''],
  ],
  [4600, 1800, 3860],
));
children.push(h2('Totals'));
children.push(table(
  ['Metric', 'Estimate'],
  [
    ['Total effort', '~51–72 person-days (≈ 10–14 weeks of work)'],
    ['Recommended team', '2 developers + 1 QA + PM (part-time)'],
    ['Calendar schedule', '~8–10 weeks with the team above'],
    ['Indicative cost', 'At a blended ~$600/day → ≈ $30k–$43k (adjust to your rates)'],
  ],
  [3000, 7260],
));
children.push(h2('Recommended phasing'));
children.push(bullet('Phase 1 — Blocks + templates + global navigation'));
children.push(bullet('Phase 2 — Automated + bulk import of the ~419 content pages'));
children.push(bullet('Phase 3 — Manual rebuild of the 19 dynamic pages + integrations'));
children.push(bullet('Phase 4 — QA / UAT'));

// 8. Caveats
children.push(h1('8. Caveats & Assumptions'));
children.push(bullet('The site sits behind bot protection; a small number of rapid requests were throttled during discovery. Final page coverage was still 99.6%.'));
children.push(bullet('The 63 non-fatal errors logged during the run were mostly transient navigation/redirect retries on a JS-heavy site — they did not reduce final coverage.'));
children.push(bullet('Booking, check-in, flight-status and account flows are separate applications and are NOT included in the content-migration counts or estimates above.'));
children.push(bullet('Cost figures are indicative and use a placeholder blended day rate; adjust to your actual rates.'));

// 9. Artifacts
children.push(h1('9. Analysis Artifacts'));
children.push(table(
  ['Artifact', 'Description'],
  [
    ['template-catalog.json', '12 named templates with page assignments and reference URLs'],
    ['block-catalog.json', '27 block variants with usage counts and canonical models'],
    ['summary.json', 'Site metrics and coverage summary'],
    ['urls-all.json / urls-grouped.json', '446 discovered URLs, grouped by directory pattern'],
    ['.pages/{slug}/full-page.jpg', 'Full-page screenshot per analysed page'],
    ['.blocks/{variant}/screenshots/', 'Screenshots per block variant'],
  ],
  [3400, 6860],
));

children.push(new Paragraph({
  spacing: { before: 300 },
  border: { top: { color: 'E2E2EA', size: 6, style: BorderStyle.SINGLE, space: 6 } },
  children: [new TextRun({ text: 'Virgin Atlantic (en-IN) — EDS Migration Handover · Generated 2026-08-25 · Content-layer scope only (excludes transactional booking applications).', italics: true, color: '5A5A6A', size: 16 })],
}));

// ---- build -----------------------------------------------------------------
const doc = new Document({
  creator: 'EDS Migration Analysis',
  title: 'Virgin Atlantic (en-IN) — EDS Migration Handover',
  styles: { default: { document: { run: { font: 'Calibri' } } } },
  sections: [{
    properties: { page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
    children,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  const out = process.argv[2] || 'virginatlantic-en-IN-migration-handover.docx';
  fs.writeFileSync(out, buf);
  console.log('Wrote', out, '(' + buf.length + ' bytes)');
});
