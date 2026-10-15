/* Build the Bed Bath N' Table (AU) EDS migration handover as a .docx with embedded screenshots (all 102 block variants) */
const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun,
  Table, TableRow, TableCell, WidthType, BorderStyle,
  ShadingType, ImageRun,
} = require('docx');

const BBNT_GREEN = '1F3D2F';
const BBNT_ACCENT = '2E6B4F';
const INK = '1A1A2E';
const BAND = 'F1F5F2';
const HEADROW = '1F3D2F';
const CAT = '/backups/PriyaSinha20/ema-project/repo/catalog';

function jpegSize(buf) {
  let off = 2;
  while (off < buf.length) {
    if (buf[off] !== 0xff) { off += 1; continue; }
    const marker = buf[off + 1];
    if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7)
      || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf)) {
      return { height: buf.readUInt16BE(off + 5), width: buf.readUInt16BE(off + 7) };
    }
    off += 2 + buf.readUInt16BE(off + 2);
  }
  return { width: 1440, height: 900 };
}
function image(path, caption, maxW = 540, maxH = 720) {
  const out = [];
  try {
    const data = fs.readFileSync(path);
    const { width, height } = jpegSize(data);
    const scale = Math.min(maxW / width, maxH / height, 1);
    out.push(new Paragraph({ spacing: { before: 60, after: 20 },
      children: [new ImageRun({ type: 'jpg', data, transformation: { width: Math.round(width * scale), height: Math.round(height * scale) } })] }));
    if (caption) out.push(new Paragraph({ spacing: { after: 140 }, children: [new TextRun({ text: caption, italics: true, size: 16, color: '5A5A6A' })] }));
  } catch (e) {
    out.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: `[screenshot unavailable: ${caption || path}]`, italics: true, size: 16, color: 'B0203C' })] }));
  }
  return out;
}
function h1(text) {
  return new Paragraph({ spacing: { before: 320, after: 140 },
    border: { bottom: { color: BBNT_ACCENT, size: 18, style: BorderStyle.SINGLE, space: 4 } },
    children: [new TextRun({ text, bold: true, size: 30, color: INK })] });
}
function h2(text) { return new Paragraph({ spacing: { before: 200, after: 80 }, children: [new TextRun({ text, bold: true, size: 24, color: BBNT_ACCENT })] }); }
function para(text, opts = {}) { return new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text, size: 21, ...opts })] }); }
function bullet(text) { return new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text, size: 21 })] }); }
function cell(content, { header = false, bg, bold = false, align } = {}) {
  const runs = Array.isArray(content) ? content : [content];
  return new TableCell({
    shading: bg ? { type: ShadingType.CLEAR, fill: bg, color: 'auto' } : undefined,
    margins: { top: 60, bottom: 60, left: 90, right: 90 },
    children: [new Paragraph({ alignment: align, children: runs.map((t) => new TextRun({ text: String(t), size: 18, bold: header || bold, color: header ? 'FFFFFF' : INK })) })],
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
children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: 'EDS MIGRATION — SCOPE & ANALYSIS HANDOVER', bold: true, size: 18, color: BBNT_ACCENT })] }));
children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: "Bed Bath N' Table (Australia)", bold: true, size: 44, color: BBNT_GREEN })] }));
children.push(para('Content-layer migration assessment for Adobe Edge Delivery Services', { italics: true, color: '5A5A6A', size: 22 }));
children.push(spacer());
children.push(table(['Field', 'Value'], [
  ['Site analysed', 'https://www.bedbathntable.com.au/'],
  ['Analysis date', '2026-08-27'],
  ['URLs in sitemap', '2,860 (2,033 products · 531 categories · 60 CMS · 253 pages) — representative 77-page sample analysed'],
  ['Locale', 'en (Australia)'],
  ['Functional templates', '7'],
  ['Block variants', '102 (all screenshotted)'],
  ['Platform detected', 'Adobe Commerce (Magento 2) + PageBuilder, Fastly CDN, AB Tasty'],
], [3000, 6360]));

// 1. Executive summary
children.push(h1('1. Executive Summary'));
children.push(para("Bed Bath N' Table Australia is the brand's flagship Adobe Commerce (Magento 2) storefront on Fastly CDN, with 2,860 URLs in categorized sitemaps. All were recorded for counts; a representative 77-page sample was analysed (100% success) covering every template type."));
children.push(bullet('2,860 sitemap URLs: 2,033 products, 531 categories, 60 CMS, 253 pages (incl. ~170 store-locator).'));
children.push(bullet('7 functional page templates — including a dedicated store-locator template not present on the SG site.'));
children.push(bullet('102 reusable block variants catalogued (22 form, 19 carousel, 15 columns, 12 hero) — all screenshotted.'));
children.push(bullet('AB Tasty experimentation + Google Maps + richer payments (Afterpay/PayPal/Zip/Apple Pay/Google Pay) are AU-specific.'));
children.push(bullet('Homepage loads Adobe Edge Delivery RUM (rum.hlx.page) — an EDS measurement pilot appears to be in place.'));
children.push(spacer());
children.push(new Paragraph({
  shading: { type: ShadingType.CLEAR, fill: 'EAF3EC', color: 'auto' },
  border: { left: { color: BBNT_ACCENT, size: 18, style: BorderStyle.SINGLE, space: 6 } },
  spacing: { after: 120 },
  children: [
    new TextRun({ text: 'Key insight: ', bold: true, color: BBNT_ACCENT, size: 21 }),
    new TextRun({ text: 'Migration economics are inverted from a content site — the huge PDP volume (2,033) plus ~170 uniform store-locator pages are the EASY, data-driven bulk-automated part. Effort concentrates in merchandised home/campaign pages, PLP facet configuration, commerce integrations (5 payment methods), and the AB Tasty experimentation layer. Estimates assume the Adobe Commerce backend is retained for transactions.', size: 21 }),
  ],
}));

// 2. Templates
children.push(h1('2. Templates Inventory'));
children.push(table(['#', 'Template', 'Complexity', 'Reasoning', 'Reference URL'], [
  ['1', 'product-detail (PDP)', 'High', 'Gallery + zoom, title/brand, price w/ strike-through + stock, variant selector, feature icons, cross-sell, size-guide accordion.', '/dalia-glass-vase-round-26133001'],
  ['2', 'product-listing (PLP)', 'High', 'Faceted filters (Category/Size/Price/Colour), grid w/ badges + swatches, sort, Load More.', '/bed/bed-linen/pillowcases'],
  ['3', 'category-landing', 'Medium', 'Hero + subcategory tile grid + "Shop By Collection".', '/bed, /table, /outdoor'],
  ['4', 'homepage', 'High', 'Merchandised PageBuilder: promo heroes, tiles, campaign banners, carousels.', '/'],
  ['5', 'store-locator', 'Medium', 'Store detail: address, Get Directions, phone, opening hours, map, "Search Other Stores".', '/locator/bed-bath-n-table-ballarat'],
  ['6', 'blog / content', 'Medium', 'Blog index + long-form articles (hero, image+text, product callouts, share).', '/blog, /blog/mulberry-silk'],
  ['7', 'CMS / static & guides', 'Low–Med', 'Delivery/returns, about, policies, size guides, competitions, how-to guides.', '/delivery-returns, /bath-size-guide'],
], [450, 1900, 1100, 3700, 2110]));

// Template screenshots
children.push(h2('Template screenshots'));
const tplShots = [
  ['homepage', 'www_bedbathntable_com_au--7922bfe5'],
  ['category-landing', 'www_bedbathntable_com_au_bed--2f04d61f'],
  ['product-detail (PDP)', 'www_bedbathntable_com_au_dalia-glass-vase-round-26133001--d33a3a79'],
  ['product-listing (PLP)', 'www_bedbathntable_com_au_bath_towel_pink--692c9151'],
  ['store-locator', 'www_bedbathntable_com_au_locator_bed-bath-n-table-ballarat--98cf48c5'],
  ['blog / content', 'www_bedbathntable_com_au_blog_mulberry-silk--913f3bb2'],
  ['CMS / static', 'www_bedbathntable_com_au_delivery-returns--d15f43ff'],
];
for (const [name, slug] of tplShots) {
  children.push(new Paragraph({ spacing: { before: 120, after: 20 }, children: [new TextRun({ text: name, bold: true, size: 20, color: INK })] }));
  image(`${CAT}/.pages/${slug}/full-page.jpg`, `Template: ${name} — representative page`, 540, 760).forEach((p) => children.push(p));
}

// 3. Blocks
children.push(h1('3. Blocks / Components Catalog'));
children.push(para('102 block variants catalogued and consolidated by content model. E-commerce sites are block-rich; the standouts are 22 form, 20 custom, 19 carousel, 15 columns and 12 hero variants.'));
children.push(table(['Block (base)', 'Variants', 'Complexity', 'Behaviour / Functionality', 'Reference URL'], [
  ['header (global)', '1', 'High', 'Utility bar (Help/E-Gift/Track/Locator), logo, search, Wishlist, Sign In/Join, My Bag, mega-nav.', 'all pages'],
  ['footer (global)', '1', 'Medium', '4-column nav, social, payment logos, "Designed in Australia".', 'all pages'],
  ['form', '22', 'High', 'Search, newsletter, login/account, add-to-cart, filters, contact, store search, competitions; reCAPTCHA.', 'site-wide'],
  ['carousel', '19', 'Medium', 'Product/image/hero carousels, "Style With", collections.', 'home, PDP'],
  ['columns', '15', 'Low–Med', 'PageBuilder multi-column layout rows.', 'home, blog'],
  ['hero', '12', 'Medium', 'Promo/category banners; many merchandising variants.', '/, /bed'],
  ['table', '4', 'Low', 'Size guides, opening hours, spec tables.', 'size guide, locator'],
  ['cards', '2', 'Medium', 'Product/category card grids.', '/sale'],
  ['video', '2', 'Medium', 'Embedded video.', 'blog/campaign'],
  ['embed', '2', 'Medium', 'Google Maps, social embeds.', 'store locator'],
  ['tabs', '1', 'Medium', 'PDP info tabs / accordions.', 'PDP'],
  ['search', '1', 'Medium', 'Product search.', 'site-wide'],
  ['custom / unknown', '20', 'High', 'Composite PageBuilder compositions.', 'content pages'],
], [1600, 850, 1150, 3860, 1800]));

// Full block gallery — all 102 variants
children.push(h2('Block screenshots — all 102 variants'));
children.push(para('Every catalogued block variant is shown below, grouped by base block. Each caption gives the variant identifier and the number of sampled pages it appeared on.', { italics: true, color: '5A5A6A', size: 18 }));
const gallery = JSON.parse(fs.readFileSync(`${CAT}/.block-gallery.json`, 'utf8'));
const baseOrder = ['header', 'footer', 'hero', 'cards', 'carousel', 'tabs', 'columns', 'form', 'table', 'search', 'video', 'embed', 'unknown'];
const byBase = {};
for (const g of gallery) { (byBase[g.base] = byBase[g.base] || []).push(g); }
const orderedBases = [...baseOrder.filter((b) => byBase[b]), ...Object.keys(byBase).filter((b) => !baseOrder.includes(b))];
for (const base of orderedBases) {
  const variants = byBase[base].sort((a, b) => b.pages - a.pages);
  children.push(new Paragraph({ spacing: { before: 180, after: 40 },
    children: [new TextRun({ text: `${base}  (${variants.length} variant${variants.length > 1 ? 's' : ''})`, bold: true, size: 22, color: BBNT_ACCENT })] }));
  for (const v of variants) {
    children.push(new Paragraph({ spacing: { before: 80, after: 10 },
      children: [new TextRun({ text: `${v.name}`, bold: true, size: 18, color: INK }),
        new TextRun({ text: `   — ${v.pages} page${v.pages === 1 ? '' : 's'}`, size: 16, color: '5A5A6A' })] }));
    image(v.shot, null, 500, 360).forEach((p) => children.push(p));
  }
}

// 4. Page counts
children.push(h1('4. Page Counts by Template & Migration Classification'));
children.push(para('Counts scaled to the full 2,860-URL sitemap.'));
children.push(table(['Template', 'Pages', 'Migration Path', 'Rationale'], [
  ['product-detail (PDP)', '2,033', 'Automated (data-driven)', 'Uniform; migrate via catalog/feed export.'],
  ['product-listing + category-landing', '531', 'Semi-auto', 'Category tree + facet config.'],
  ['store-locator', '170', 'Automated (data-driven)', 'Uniform store template from store data feed.'],
  ['blog / content', '67', 'Semi-auto', 'Editorial PageBuilder bodies.'],
  ['CMS / static & guides', '~59', 'Semi-auto / Manual', 'Policies auto; competitions/how-to bespoke.'],
  ['homepage + campaign', '~a few', 'Manual', 'Merchandised, hand-built.'],
  [
    { text: 'Total', bold: true, bg: 'EAF3EC' },
    { text: '2,860', bold: true, bg: 'EAF3EC' },
    { text: 'Automated ~77%', bold: true, bg: 'EAF3EC' },
    { text: 'Semi-auto ~21% · Manual ~2%', bold: true, bg: 'EAF3EC' },
  ],
], [2500, 1100, 2200, 3260]));
children.push(para('Same inverted economics as SG: PDPs + store-locator (both data-driven) are the easy bulk-automated part; merchandised pages, PLP facets and commerce integrations are the effort.', { italics: true, color: '5A5A6A', size: 18 }));

// 5. Integrations
children.push(h1('5. Integrations Analysis'));
children.push(table(['Integration', 'Type', 'Complexity', 'Where used'], [
  ['Adobe Commerce (Magento 2)', 'Platform / backend', 'High', 'Site-wide'],
  ['Magento PageBuilder', 'CMS / content', 'Medium', 'Home, category, CMS, blog'],
  ['Fastly CDN', 'Platform / caching', 'Medium', 'Site-wide'],
  ['AB Tasty (try.abtasty.com)', 'Experimentation / personalization', 'High', 'Site-wide (A/B testing) — AU-specific'],
  ['Google Maps', 'API / embed', 'Medium', 'Store-locator (170 pages)'],
  ['Afterpay / PayPal / Zip / Apple Pay / Google Pay', 'Payment gateways', 'High', 'Cart, checkout, PDP'],
  ['Google reCAPTCHA', 'Security / forms', 'Low', 'Forms'],
  ['Google Tag Manager + gtag', 'Analytics / tags', 'Medium', 'All pages'],
  ['Dotdigital', 'Email / marketing automation', 'Medium', 'Newsletter, email capture'],
  ['Adobe Edge Delivery RUM (rum.hlx.page)', 'Measurement', 'Low', 'Homepage (pilot)'],
  ['Social: Facebook, Pinterest, TikTok, Instagram', 'Pixels / embeds', 'Low', 'Tracking + footer'],
  ['Wishlist / My Bag / customer sections', 'Commerce feature', 'Medium', 'Account, PDP, cart'],
], [3400, 2100, 1300, 2360]));

// 6. Complex use cases
children.push(h1('6. Complex Use Cases & Observations'));
children.push(table(['#', 'Complex behaviour', 'Instances', 'Where', 'Why complex'], [
  ['1', 'Product catalog & variants', '2,033 PDPs', 'product pages', 'SKU/variant, pricing, inventory — data-sourced.'],
  ['2', 'Faceted search / filtering', '531 categories', 'category/sale', 'Dynamic facets + Load More.'],
  ['3', 'Store locator', '170', '/locator/*', 'Map integration, structured store data, hours — AU-specific.'],
  ['4', 'Cart / checkout / payments', 'site-wide', 'cart, checkout', '5 payment methods; transactional.'],
  ['5', 'AB Tasty experimentation', 'site-wide', 'all pages', 'A/B tests + personalization variants may alter content — migration decisions needed.'],
  ['6', 'Customer accounts / wishlist / bag', 'site-wide', 'account, PDP', 'Auth, session, saved state.'],
  ['7', 'PageBuilder compositions', 'home + campaigns', 'merchandised', '20 custom block comps to model.'],
  ['8', 'Competitions & dynamic CMS', 'several', '/spring-refresh-competition etc.', 'Form logic, entry handling.'],
], [450, 2400, 1350, 2100, 2760]));

// 7. Estimates
children.push(h1('7. Migration Estimates'));
children.push(para('Content/presentation-layer scope. The commerce engine (cart, checkout, payments, catalog DB) is assumed to remain on Adobe Commerce.'));
children.push(h2('Effort by workstream'));
children.push(table(['Workstream', 'Estimate', 'Notes'], [
  ['Block development (102 variants → ~24–30 EDS blocks + variations)', '22–30 days', 'Heavy: 22 form + 19 carousel + 15 columns + 12 hero'],
  ['Template setup (7 templates incl. store-locator)', '8–11 days', ''],
  ['PDP automation (catalog feed, ~2,033)', '5–8 days', 'Scripted from Magento catalog'],
  ['Store-locator automation (~170, map + data)', '4–6 days', 'Google Maps + store data feed'],
  ['PLP + category (facets, tree, curation)', '8–12 days', ''],
  ['Homepage + campaign/CMS pages', '6–9 days', 'Merchandised, bespoke'],
  ['Blog + content import (~67)', '4–6 days', ''],
  ['Header / footer / mega-nav / search', '5–7 days', ''],
  ['Commerce integrations (cart/checkout/5 payments/search)', '10–16 days', ''],
  ['AB Tasty experimentation strategy + re-wire', '4–6 days', 'Decide migrate vs rebuild'],
  ['Analytics & marketing (GTM/Dotdigital/pixels/RUM)', '3–5 days', ''],
  ['QA & testing (functional, commerce, visual, a11y, PageSpeed)', '12–18 days', ''],
  ['PM / UAT / fixes', '8–12 days', ''],
], [4600, 1800, 3860]));
children.push(h2('Totals'));
children.push(table(['Metric', 'Estimate'], [
  ['Total effort', '~99–146 person-days (≈ 20–29 weeks of work)'],
  ['Recommended team', '2–3 developers + 1 commerce specialist + 1–2 QA + PM'],
  ['Calendar schedule', '~13–19 weeks with the team above'],
  ['Indicative cost', 'At a blended ~$600/day → ≈ $59k–$88k (adjust to your rates)'],
], [3000, 7260]));
children.push(h2('Recommended phasing'));
children.push(bullet('Phase 1 — Blocks + templates + navigation'));
children.push(bullet('Phase 2 — PDP + store-locator bulk automation + PLP/category'));
children.push(bullet('Phase 3 — Home/campaign/blog/CMS'));
children.push(bullet('Phase 4 — Commerce + AB Tasty integrations'));
children.push(bullet('Phase 5 — QA/UAT'));

// 8. Caveats
children.push(h1('8. Caveats & Assumptions'));
children.push(bullet('Analysis used a 77-page representative sample across all template types (full 2,860-page browser crawl is unnecessary for scoping). Coverage is 100% of template types.'));
children.push(bullet('Estimates assume the Adobe Commerce backend is retained for transactions; a full re-platform of cart/checkout/payments is a separate, larger effort.'));
children.push(bullet('AB Tasty adds scope uncertainty — a decision is needed on whether experiments/personalization migrate or are rebuilt.'));
children.push(bullet('Cost figures are indicative and use a placeholder blended day rate; adjust to your actual rates.'));

// 9. Artifacts
children.push(h1('9. Analysis Artifacts'));
children.push(table(['Artifact', 'Description'], [
  ['template-catalog.json', '7 named templates with page assignments and reference URLs'],
  ['block-catalog.json', '102 block variants with usage counts and canonical models'],
  ['summary.json', 'Site metrics and coverage summary'],
  ['urls-all.json / urls-grouped.json', '2,860 discovered URLs, grouped by pattern'],
  ['.pages/{slug}/full-page.jpg', 'Full-page screenshot per analysed page'],
  ['.blocks/{variant}/screenshots/', 'Screenshots per block variant (all 102)'],
], [3400, 6860]));

children.push(new Paragraph({ spacing: { before: 300 },
  border: { top: { color: 'E2E2EA', size: 6, style: BorderStyle.SINGLE, space: 6 } },
  children: [new TextRun({ text: "Bed Bath N' Table (AU) — EDS Migration Handover · Generated 2026-08-27 · Content/presentation-layer scope (Adobe Commerce backend assumed retained for transactions).", italics: true, color: '5A5A6A', size: 16 })] }));

const doc = new Document({
  creator: 'EDS Migration Analysis',
  title: "Bed Bath N' Table (AU) — EDS Migration Handover",
  styles: { default: { document: { run: { font: 'Calibri' } } } },
  sections: [{ properties: { page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } }, children }],
});

Packer.toBuffer(doc).then((buf) => {
  const out = process.argv[2] || 'bedbathntable-au-migration-handover.docx';
  fs.writeFileSync(out, buf);
  console.log('Wrote', out, '(' + buf.length + ' bytes)');
});
