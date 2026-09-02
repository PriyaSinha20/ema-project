/* Build a Bed Bath N' Table AU vs SG comparison handover as a .docx */
const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
} = require('docx');

const GREEN = '1F3D2F';
const ACCENT = '2E6B4F';
const INK = '1A1A2E';
const BAND = 'F1F5F2';
const HEADROW = '1F3D2F';
const SAME = 'EAF3EC';   // commonality highlight
const DIFF = 'FBF0E6';   // variation highlight

function h1(text) {
  return new Paragraph({ spacing: { before: 320, after: 140 },
    border: { bottom: { color: ACCENT, size: 18, style: BorderStyle.SINGLE, space: 4 } },
    children: [new TextRun({ text, bold: true, size: 30, color: INK })] });
}
function h2(text) { return new Paragraph({ spacing: { before: 200, after: 80 }, children: [new TextRun({ text, bold: true, size: 24, color: ACCENT })] }); }
function para(text, opts = {}) { return new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text, size: 21, ...opts })] }); }
function bullet(text) { return new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text, size: 21 })] }); }
function cell(content, { header = false, bg, bold = false } = {}) {
  const runs = Array.isArray(content) ? content : [content];
  return new TableCell({
    shading: bg ? { type: ShadingType.CLEAR, fill: bg, color: 'auto' } : undefined,
    margins: { top: 60, bottom: 60, left: 90, right: 90 },
    children: [new Paragraph({ children: runs.map((t) => new TextRun({ text: String(t), size: 18, bold: header || bold, color: header ? 'FFFFFF' : INK })) })],
  });
}
function table(headers, rows, widths) {
  const b = { style: BorderStyle.SINGLE, size: 4, color: 'E2E2EA' };
  const borders = { top: b, bottom: b, left: b, right: b, insideHorizontal: b, insideVertical: b };
  const headerRow = new TableRow({ tableHeader: true, children: headers.map((h) => cell(h, { header: true, bg: HEADROW })) });
  const bodyRows = rows.map((r, i) => new TableRow({
    children: r.map((c) => {
      const bg = i % 2 === 1 ? BAND : undefined;
      if (c && typeof c === 'object' && !Array.isArray(c)) return cell(c.text, { bg: c.bg || bg, bold: c.bold });
      return cell(c, { bg });
    }),
  }));
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: widths, borders, rows: [headerRow, ...bodyRows] });
}
function spacer() { return new Paragraph({ spacing: { after: 120 }, children: [] }); }

const children = [];

// Cover
children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: 'EDS MIGRATION — COMPARATIVE ANALYSIS', bold: true, size: 18, color: ACCENT })] }));
children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: "Bed Bath N' Table — Australia vs Singapore", bold: true, size: 40, color: GREEN })] }));
children.push(para('Commonalities and variations across the two storefronts', { italics: true, color: '5A5A6A', size: 22 }));
children.push(spacer());
children.push(para('This document compares the migration scope of the two Bed Bath N’ Table storefronts analysed — the Australian flagship (bedbathntable.com.au) and the Singapore site (bedbathntable.com.sg) — to highlight what can be reused across both and where they diverge.', {}));

// 1. At-a-glance
children.push(h1('1. At-a-Glance Comparison'));
children.push(table(['Dimension', 'Australia (AU)', 'Singapore (SG)', 'Verdict'], [
  ['Platform', 'Adobe Commerce (Magento 2) + PageBuilder', 'Adobe Commerce (Magento 2) + PageBuilder', { text: 'Common', bg: SAME }],
  ['CDN', 'Fastly', 'Fastly', { text: 'Common', bg: SAME }],
  ['Sitemap URLs', '2,860', '6,756', { text: 'Variation (SG larger)', bg: DIFF }],
  ['Product pages (PDP)', '2,033', '~5,165', { text: 'Variation', bg: DIFF }],
  ['Functional templates', '7', '8 (functional)', { text: 'Mostly common', bg: SAME }],
  ['Block variants catalogued', '102', '61', { text: 'Variation (AU richer)', bg: DIFF }],
  ['Sample analysed', '77 pages (0 failed)', '51 pages (27 failed / stale)', { text: 'Variation', bg: DIFF }],
  ['Sitemap quality', 'Clean, categorized (products/categories/cms/pages)', 'Single sitemap, ~35% stale/404', { text: 'Variation', bg: DIFF }],
  ['Store locator', 'Dedicated template (~170 pages)', 'Not present as template', { text: 'Variation (AU only)', bg: DIFF }],
  ['Experimentation', 'AB Tasty (A/B + personalization)', 'Not detected', { text: 'Variation (AU only)', bg: DIFF }],
  ['Payment methods', 'Afterpay, PayPal, Zip, Apple Pay, Google Pay', 'Afterpay, PayPal', { text: 'Variation (AU richer)', bg: DIFF }],
  ['EDS RUM pilot (rum.hlx.page)', 'Present', 'Present', { text: 'Common', bg: SAME }],
], [2400, 2500, 2500, 1860]));

// 2. Commonalities
children.push(h1('2. Commonalities (Reusable Across Both)'));
children.push(para('The two sites share the same brand, platform and design system, so a large share of migration work is reusable.', {}));
children.push(h2('Shared platform & architecture'));
children.push(bullet('Identical stack: Adobe Commerce (Magento 2) with PageBuilder content, fronted by Fastly CDN.'));
children.push(bullet('Same commerce model: catalog-driven PDPs, faceted PLPs, category landings, cart/checkout/wishlist.'));
children.push(bullet('Both already load Adobe Edge Delivery RUM (rum.hlx.page) — an EDS measurement pilot is in place on each.'));
children.push(h2('Shared templates'));
children.push(table(['Template', 'AU', 'SG'], [
  ['commerce-standard (home/category/PLP/PDP shell)', 'Yes (63)', 'Yes (43)'],
  ['product-detail (PDP)', 'Yes', 'Yes'],
  ['product-listing (PLP)', 'Yes', 'Yes'],
  ['category-landing', 'Yes', 'Yes'],
  ['blog / editorial content', 'Yes (4)', 'Yes (2 article + editorial)'],
  ['CMS / static', 'Yes', 'Yes (in content-editorial)'],
], [4600, 2830, 2830]));
children.push(h2('Shared blocks (same base components)'));
children.push(para('Base blocks present on BOTH sites — these can be built once and reused, with per-site design variations:', {}));
children.push(table(['Base block', 'AU variants', 'SG variants'], [
  ['header (global)', '1', '1'],
  ['footer (global)', '1', '1'],
  ['hero', '12', '13'],
  ['form (search/newsletter/cart/filters)', '22', '20'],
  ['carousel', '19', '4'],
  ['columns', '15', '5'],
  ['cards', '2', '1'],
  ['tabs', '1', '5'],
  ['video', '2', '2'],
  ['embed', '2', '2'],
  ['custom / unknown (PageBuilder comps)', '20', '7'],
], [4000, 3130, 3130]));

// 3. Variations
children.push(h1('3. Variations (Site-Specific)'));
children.push(h2('AU-only features'));
children.push(bullet('Store-locator template: ~170 uniform store pages (address, hours, Get Directions, map, "Search Other Stores"). Requires Google Maps integration and a store data feed.'));
children.push(bullet('AB Tasty experimentation layer (A/B testing + personalization) site-wide — adds a migration decision: migrate experiments or rebuild.'));
children.push(bullet('Richer payments: Zip, Apple Pay and Google Pay in addition to Afterpay + PayPal.'));
children.push(bullet('Google Maps API (store locator) and a dedicated table block (4 variants) for store hours / size guides.'));
children.push(bullet('Higher block diversity: 102 variants vs 61 — notably more carousel (19 vs 4) and columns (15 vs 5) variants, reflecting a more heavily merchandised flagship.'));
children.push(h2('SG-only / SG-heavier characteristics'));
children.push(bullet('Larger raw catalog: 6,756 sitemap URLs (~5,165 PDPs) vs 2,860 — but with ~35% stale/404 entries needing a validation crawl.'));
children.push(bullet('More tabs variants (5 vs 1) — PDP info tabs/accordions used more.'));
children.push(bullet('Single un-categorized sitemap (vs AU’s clean products/categories/cms/pages split).'));
children.push(h2('Template-count nuance'));
children.push(para('AU discovery separated store-locator, size-guide and CMS/guide as distinct templates (7 total); SG collapsed content into a broader "content-editorial" group (4 total). Functionally both sites cover the same page types — the difference is granularity, not fundamentally different page kinds.', {}));

// 4. Migration implications
children.push(h1('4. Migration Implications'));
children.push(table(['Aspect', 'Implication'], [
  ['Shared build', 'Build the commerce block library and templates ONCE; both sites reuse ~70–80% of blocks with design-variation theming.'],
  ['Sequencing', 'Do AU first (cleaner sitemap, store-locator + AB Tasty force the harder integrations early), then SG largely reuses the library.'],
  ['SG data hygiene', 'SG needs a URL-validation crawl to strip ~35% stale entries before final counts/import.'],
  ['AU integrations', 'AU adds Google Maps (store locator), AB Tasty, and 3 extra payment methods — scope these as AU-specific.'],
  ['PDP automation', 'Both: PDPs are data-driven and bulk-automatable from the Magento catalog — the largest volume is the least effort.'],
  ['Reuse estimate', 'A combined program is materially cheaper than two standalone migrations due to shared blocks/templates.'],
], [2600, 7660]));

// 5. Effort comparison
children.push(h1('5. Effort & Cost Comparison'));
children.push(table(['Metric', 'Australia (AU)', 'Singapore (SG)'], [
  ['Total effort (standalone)', '~99–146 person-days', '~90–130 person-days'],
  ['Calendar schedule', '~13–19 weeks', '~12–18 weeks'],
  ['Indicative cost (~$600/day)', '≈ $59k–$88k', '≈ $54k–$78k'],
  ['Auto-migratable pages', '~77%', '~77%'],
  ['Key cost drivers', 'Store locator, AB Tasty, 5 payments, 102 blocks', 'Large catalog, stale-URL cleanup, PLP facets'],
], [3200, 3530, 3530]));
children.push(para('Combined-program note: because ~70–80% of blocks and all core commerce templates are shared, running both migrations as one program (shared library, per-site theming and content) is expected to cost significantly less than the sum of the two standalone estimates above.', { italics: true, color: '5A5A6A', size: 18 }));

// 6. Recommendation
children.push(h1('6. Recommendation'));
children.push(bullet('Treat AU and SG as a single multi-site program on a shared EDS block library and template set.'));
children.push(bullet('Build and harden on AU first (it forces store-locator + AB Tasty + full payments), then apply to SG with theming + content.'));
children.push(bullet('Run a URL-validation crawl on SG before import to remove stale sitemap entries.'));
children.push(bullet('Automate PDPs on both via the Magento catalog feed; reserve manual effort for merchandised home/campaign pages.'));
children.push(bullet('Decide early whether AB Tasty experiments migrate or are rebuilt in the EDS experimentation model.'));

children.push(new Paragraph({ spacing: { before: 300 },
  border: { top: { color: 'E2E2EA', size: 6, style: BorderStyle.SINGLE, space: 6 } },
  children: [new TextRun({ text: "Bed Bath N' Table — AU vs SG Comparative Analysis · Generated 2026-08-27 · Green = commonality, amber = variation. Content/presentation-layer scope; Adobe Commerce backend assumed retained.", italics: true, color: '5A5A6A', size: 16 })] }));

const doc = new Document({
  creator: 'EDS Migration Analysis',
  title: "Bed Bath N' Table — AU vs SG Comparison",
  styles: { default: { document: { run: { font: 'Calibri' } } } },
  sections: [{ properties: { page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } }, children }],
});

Packer.toBuffer(doc).then((buf) => {
  const out = process.argv[2] || 'bedbathntable-au-vs-sg-comparison.docx';
  fs.writeFileSync(out, buf);
  console.log('Wrote', out, '(' + buf.length + ' bytes)');
});
