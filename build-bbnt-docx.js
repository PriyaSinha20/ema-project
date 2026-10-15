/* Build the Bed Bath N' Table (SG) EDS migration handover as a .docx with embedded screenshots */
const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun,
  Table, TableRow, TableCell, WidthType, BorderStyle,
  ShadingType, ImageRun,
} = require('docx');

const BBNT_GREEN = '1F3D2F';   // deep forest green brand
const BBNT_ACCENT = '2E6B4F';
const BBNT_SALE = 'C21A2B';
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
function image(path, caption, maxW = 560, maxH = 720) {
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
function h2(text) {
  return new Paragraph({ spacing: { before: 200, after: 80 }, children: [new TextRun({ text, bold: true, size: 24, color: BBNT_ACCENT })] });
}
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
children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: "Bed Bath N' Table (Singapore)", bold: true, size: 44, color: BBNT_GREEN })] }));
children.push(para('Content-layer migration assessment for Adobe Edge Delivery Services', { italics: true, color: '5A5A6A', size: 22 }));
children.push(spacer());
children.push(table(['Field', 'Value'], [
  ['Site analysed', 'https://www.bedbathntable.com.sg/'],
  ['Analysis date', '2026-08-25'],
  ['URLs in sitemap', '6,756 (representative 51-page sample analysed across all template types)'],
  ['Locale', 'en (Singapore)'],
  ['Functional templates', '8'],
  ['Block variants', '61'],
  ['Platform detected', 'Adobe Commerce (Magento 2) + PageBuilder, Fastly CDN'],
], [3000, 6360]));

// 1. Executive summary
children.push(h1('1. Executive Summary'));
children.push(para("Bed Bath N' Table Singapore is a large Adobe Commerce (Magento 2) storefront fronted by Fastly CDN, with 6,756 URLs in its sitemap. All 6,756 were recorded for accurate counts; a representative 51-page sample was analysed covering every template type (a full browser crawl of the catalog is unnecessary for scoping — products share one template)."));
children.push(bullet('6,756 sitemap URLs; ~5,165 are product detail pages (PDPs).'));
children.push(bullet('8 functional page templates identified (PDP, PLP, category, home, blog, content).'));
children.push(bullet('61 reusable block variants catalogued (20 form + 13 hero variants stand out).'));
children.push(bullet('Magento PageBuilder is used heavily — content maps reasonably well to EDS blocks.'));
children.push(bullet('The homepage already loads Adobe Edge Delivery RUM (rum.hlx.page) — an EDS measurement pilot appears to be in place.'));
children.push(spacer());
children.push(new Paragraph({
  shading: { type: ShadingType.CLEAR, fill: 'EAF3EC', color: 'auto' },
  border: { left: { color: BBNT_ACCENT, size: 18, style: BorderStyle.SINGLE, space: 6 } },
  spacing: { after: 120 },
  children: [
    new TextRun({ text: 'Key insight: ', bold: true, color: BBNT_ACCENT, size: 21 }),
    new TextRun({ text: 'The migration economics are inverted from a typical content site. The huge PDP volume is the EASY part — one template, data-driven bulk import from the Magento catalog. The effort concentrates in the merchandised home/campaign pages, PLP facet configuration, and commerce integrations (cart, checkout, Afterpay, PayPal). Estimates assume the Adobe Commerce backend is retained for transactions; EDS fronts the content/browse experience.', size: 21 }),
  ],
}));

// 2. Templates
children.push(h1('2. Templates Inventory'));
children.push(para('Magento serves a uniform shell, so structural fingerprinting groups pages loosely; below is the functional template inventory (what matters for migration), confirmed via rendered screenshots.'));
children.push(table(['#', 'Template', 'Complexity', 'Reasoning', 'Reference URL'], [
  ['1', 'product-detail (PDP)', 'High', 'Gallery + zoom + thumbnails, title/brand, price w/ strike-through + stock, variant selector, feature icons, "Style With" cross-sell, designer notes, size-guide accordion.', '/hana-breakfast-bowl-white-22497601'],
  ['2', 'product-listing (PLP)', 'High', 'Faceted filters (Category/Size/Price/Colour), product grid with discount badges + colour swatches, Load More, sorting. Dynamic query-driven.', '/sale'],
  ['3', 'category-landing', 'Medium', 'Hero banner + subcategory tile grid + "Shop By Collection" curated tiles.', '/bed, /bath, /table'],
  ['4', 'homepage', 'High', 'Merchandised PageBuilder layout: promo heroes, category tiles, campaign banners, carousels.', '/'],
  ['5', 'blog-article', 'Medium', 'Long-form editorial: hero, alternating image+text, product callouts, Shop CTA, social share, "More from the blog".', '/blog/mulberry-silk'],
  ['6', 'blog/content-index', 'Medium', 'Blog listing, author, and category index pages.', '/blog, /blog/inspiration'],
  ['7', 'influencer / shop-the-look', 'Medium', 'Curated influencer content linking products.', '/products/influencers/jessiikawilson'],
  ['8', 'CMS/static', 'Low', 'About, Terms, Privacy, Contact, Store Locator (PageBuilder/CMS pages).', '/about-us-type pages'],
], [450, 1900, 1100, 3700, 2110]));

// Template screenshots
children.push(h2('Template screenshots'));
const tplShots = [
  ['homepage', 'www_bedbathntable_com_sg--83c95586'],
  ['category-landing', 'www_bedbathntable_com_sg_bed--736ba642'],
  ['product-detail (PDP)', 'www_bedbathntable_com_sg_hana-breakfast-bowl-white-22497601--69c2f8f9'],
  ['product-listing (PLP)', 'www_bedbathntable_com_sg_sale--1325f288'],
  ['blog-article', 'www_bedbathntable_com_sg_blog_mulberry-silk--28f0c363'],
  ['influencer / shop-the-look', 'www_bedbathntable_com_sg_products_influencers_jessiikawilson--1df5ed5b'],
];
for (const [name, slug] of tplShots) {
  children.push(new Paragraph({ spacing: { before: 120, after: 20 }, children: [new TextRun({ text: name, bold: true, size: 20, color: INK })] }));
  image(`${CAT}/.pages/${slug}/full-page.jpg`, `Template: ${name} — representative page`, 540, 760).forEach((p) => children.push(p));
}

// 3. Blocks
children.push(h1('3. Blocks / Components Catalog'));
children.push(para('61 block variants catalogued and consolidated by content model. E-commerce sites are block-rich; the standouts are 20 form variants and 13 hero variants.'));
children.push(table(['Block (base)', 'Variants', 'Complexity', 'Behaviour / Functionality', 'Reference URL'], [
  ['header (global)', '1', 'High', 'Store-locator bar, logo, product search, Sign In/Join, mega-nav (Bed/Bath/Table/Home Décor/Sleepwear/Kids/New/Sale), mini-cart.', 'all pages'],
  ['footer (global)', '1', 'Medium', '4-column link nav, social icons, "Designed in Australia" seal, legal.', 'all pages'],
  ['hero', '13', 'Medium', 'Full-width promo/category banners; many merchandising variants.', '/, /bed'],
  ['form', '20', 'High', 'Search, newsletter, account/login, add-to-cart, filters, contact, store-locator, reCAPTCHA-protected forms.', 'site-wide'],
  ['cards', '1', 'Medium', 'Product/category card grid (image, title, price, badge, swatch).', '/sale'],
  ['carousel', '4', 'Medium', 'Product/image carousels ("Style With", collections).', 'PDP'],
  ['tabs', '5', 'Medium', 'Product info tabs / accordions (details, size guide).', 'PDP'],
  ['columns', '5', 'Low–Med', 'PageBuilder multi-column layout rows.', 'blog, home'],
  ['video', '2', 'Medium', 'Embedded video blocks.', 'blog/campaign'],
  ['embed', '2', 'Medium', 'Third-party embeds (maps, social).', 'store locator'],
  ['custom / unknown', '7', 'High', 'Composite PageBuilder compositions (heading+image+CTA+paragraph combos).', 'content pages'],
], [1600, 850, 1150, 3860, 1800]));

children.push(h2('Block screenshots — all 61 variants'));
children.push(para('Every catalogued block variant is shown below, grouped by base block. Each caption gives the variant identifier and the number of sampled pages it appeared on.', { italics: true, color: '5A5A6A', size: 18 }));

const gallery = JSON.parse(fs.readFileSync(`${CAT}/.block-gallery.json`, 'utf8'));
// Order base groups sensibly: globals first, then by variant count
const baseOrder = ['header', 'footer', 'hero', 'cards', 'carousel', 'tabs', 'columns', 'form', 'video', 'embed', 'unknown'];
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
children.push(para('Counts scaled to the full 6,756-URL sitemap.'));
children.push(table(['Template', 'Pages (approx)', 'Migration Path', 'Rationale'], [
  ['product-detail (PDP)', '5,165', 'Automated (data-driven)', 'Uniform template; migrate via catalog/feed export, not page scraping. Ideal for bulk automation.'],
  ['product-listing + categories', '~1,390', 'Semi-auto', 'Category tree + facet config; grids data-driven but filters/curation need setup.'],
  ['blog (articles + indexes)', '87', 'Semi-auto', 'Editorial import; rich PageBuilder bodies.'],
  ['influencer / shop-the-look', '47', 'Semi-auto', 'Curated product links.'],
  ['catalog/category/view (id dupes)', '17', 'Automated (redirect)', 'Canonical duplicates → redirect rules.'],
  ['homepage + CMS/static', '~50', 'Manual', 'Merchandised/bespoke; hand-build.'],
  [
    { text: 'Total', bold: true, bg: 'EAF3EC' },
    { text: '6,756', bold: true, bg: 'EAF3EC' },
    { text: 'Automated ~77%', bold: true, bg: 'EAF3EC' },
    { text: 'Semi-auto ~22% · Manual ~1%', bold: true, bg: 'EAF3EC' },
  ],
], [2500, 1300, 2200, 3060]));
children.push(para('The huge PDP volume is the easy part (one template, data-driven bulk import from the Magento catalog), while the merchandised home/campaign pages and PLP facet configuration are the effort.', { italics: true, color: '5A5A6A', size: 18 }));

// 5. Integrations
children.push(h1('5. Integrations Analysis'));
children.push(table(['Integration', 'Type', 'Complexity', 'Where used'], [
  ['Adobe Commerce (Magento 2)', 'Platform / backend', 'High', 'Site-wide (catalog, cart, checkout, customer)'],
  ['Magento PageBuilder', 'CMS / content', 'Medium', 'Home, category, CMS, blog'],
  ['Fastly CDN', 'Platform / caching', 'Medium', 'Site-wide (/fastlyCdn/)'],
  ['Afterpay', 'Payment (BNPL)', 'High', 'PDP, cart, checkout (mini-cart integration)'],
  ['PayPal', 'Payment gateway', 'High', 'Cart, checkout (billing agreements)'],
  ['Google reCAPTCHA', 'Security / forms', 'Low', 'Login, registration, forms'],
  ['Google Tag Manager + gtag', 'Analytics / tags', 'Medium', 'All pages'],
  ['Dotdigital', 'Email / marketing automation', 'Medium', 'Newsletter, email capture'],
  ['Adobe Edge Delivery RUM (rum.hlx.page)', 'Measurement', 'Low', 'Homepage (pilot)'],
  ['Social: Facebook, Pinterest, TikTok, Instagram', 'Pixels / embeds', 'Low', 'Tracking + footer'],
  ['Store Locator', 'Feature / embed', 'Medium', 'Store-locator pages'],
  ['Wishlist / customer sections', 'Commerce feature', 'Medium', 'Account, PDP'],
], [3400, 2100, 1300, 2360]));

// 6. Complex use cases
children.push(h1('6. Complex Use Cases & Observations'));
children.push(table(['#', 'Complex behaviour', 'Instances', 'Where', 'Why complex'], [
  ['1', 'Product catalog & variants', '5,165 PDPs', 'product pages', 'Variant/SKU selection, pricing, inventory — needs catalog data source, not page scrape.'],
  ['2', 'Faceted search / filtering', '~1,390 PLPs', 'category/sale pages', 'Dynamic Category/Size/Price/Colour facets + Load More; query-driven.'],
  ['3', 'Cart / checkout / payments', 'site-wide', 'cart, checkout', 'Afterpay + PayPal + reCAPTCHA; transactional — stays on/integrates with commerce backend.'],
  ['4', 'Customer accounts / wishlist', 'site-wide', 'account, PDP', 'Auth, session, saved items.'],
  ['5', 'PageBuilder compositions', 'home + campaigns', 'merchandised pages', 'Bespoke layouts → map to EDS blocks.'],
  ['6', 'Stale sitemap entries (404s)', '27 of 78 sampled (~35%)', 'products + blog', 'Discontinued products/seasonal posts still listed — real URL count is lower; needs validation pass.'],
  ['7', 'Duplicate canonical URLs', '17+', '/catalog/category/view/id/*', 'Same category via slug + id → redirect strategy.'],
  ['8', 'Rich blog editorial', '87', '/blog/*', 'Long-form image+text + product callouts.'],
], [450, 2400, 1350, 2100, 2760]));

// 7. Estimates
children.push(h1('7. Migration Estimates'));
children.push(para('Estimates cover the content/storefront presentation layer. The commerce engine (cart, checkout, payments, catalog DB) is assumed to remain on Adobe Commerce — EDS fronts the content/browse experience while transactions stay on Magento.'));
children.push(h2('Effort by workstream'));
children.push(table(['Workstream', 'Estimate', 'Notes'], [
  ['Block development (61 variants → ~18–22 EDS blocks + variations)', '18–25 days', 'Heavy: 20 form + 13 hero variants, carousels, tabs'],
  ['Template setup (8 functional templates)', '8–10 days', 'PDP, PLP, category, home, blog, content'],
  ['PDP automation (catalog-feed import, ~5,165)', '6–10 days', 'Scripted from Magento catalog/API — the big win'],
  ['PLP + category setup (facets, tree, curation)', '8–12 days', 'Data-driven grids + filter config'],
  ['Homepage + campaign/CMS pages', '6–9 days', 'Merchandised, bespoke'],
  ['Blog + influencer content import (~134)', '5–8 days', 'Editorial PageBuilder bodies'],
  ['Header / footer / mega-nav / search', '5–7 days', 'Commerce nav + mini-cart'],
  ['Commerce integrations (cart/checkout/Afterpay/PayPal/search)', '8–14 days', 'Front-end integration to Magento'],
  ['Analytics & marketing (GTM/Dotdigital/pixels/RUM)', '3–5 days', ''],
  ['URL validation + redirects (404s, canonical dupes)', '3–5 days', '~35% stale-URL signal needs a crawl-verify pass'],
  ['QA & testing (functional, commerce, visual, a11y, PageSpeed)', '12–16 days', 'Commerce QA is heavier'],
  ['PM / UAT / fixes', '8–10 days', ''],
], [4600, 1800, 3860]));
children.push(h2('Totals'));
children.push(table(['Metric', 'Estimate'], [
  ['Total effort', '~90–130 person-days (≈ 18–26 weeks of work)'],
  ['Recommended team', '2–3 developers + 1 commerce specialist + 1–2 QA + PM'],
  ['Calendar schedule', '~12–18 weeks with the team above'],
  ['Indicative cost', 'At a blended ~$600/day → ≈ $54k–$78k (adjust to your rates)'],
], [3000, 7260]));
children.push(h2('Recommended phasing'));
children.push(bullet('Phase 1 — Blocks + templates + navigation'));
children.push(bullet('Phase 2 — PDP bulk automation + PLP/category'));
children.push(bullet('Phase 3 — Home/campaign/blog/content'));
children.push(bullet('Phase 4 — Commerce integrations'));
children.push(bullet('Phase 5 — QA/UAT + redirects'));

// 8. Caveats
children.push(h1('8. Caveats & Assumptions'));
children.push(bullet('6,756 URLs come from the sitemap; the sample showed ~35% stale/404 entries (discontinued products, seasonal posts), so the true live page count is meaningfully lower — a URL-validation crawl is recommended before final counts.'));
children.push(bullet('Analysis used a 51-page representative sample across all template types (full-catalog browser analysis was intentionally skipped as unnecessary for scoping). Coverage is 100% of template types.'));
children.push(bullet('Estimates assume the Adobe Commerce backend is retained for transactions; a full re-platform of cart/checkout/payments would be a separate, larger effort.'));
children.push(bullet('Cost figures are indicative and use a placeholder blended day rate; adjust to your actual rates.'));

// 9. Artifacts
children.push(h1('9. Analysis Artifacts'));
children.push(table(['Artifact', 'Description'], [
  ['template-catalog.json', 'Named templates with page assignments and reference URLs'],
  ['block-catalog.json', '61 block variants with usage counts and canonical models'],
  ['summary.json', 'Site metrics and coverage summary'],
  ['urls-all.json / urls-grouped.json', '6,756 discovered URLs, grouped by pattern'],
  ['.pages/{slug}/full-page.jpg', 'Full-page screenshot per analysed page'],
  ['.blocks/{variant}/screenshots/', 'Screenshots per block variant'],
], [3400, 6860]));

children.push(new Paragraph({ spacing: { before: 300 },
  border: { top: { color: 'E2E2EA', size: 6, style: BorderStyle.SINGLE, space: 6 } },
  children: [new TextRun({ text: "Bed Bath N' Table (SG) — EDS Migration Handover · Generated 2026-08-25 · Content/presentation-layer scope (Adobe Commerce backend assumed retained for transactions).", italics: true, color: '5A5A6A', size: 16 })] }));

const doc = new Document({
  creator: 'EDS Migration Analysis',
  title: "Bed Bath N' Table (SG) — EDS Migration Handover",
  styles: { default: { document: { run: { font: 'Calibri' } } } },
  sections: [{ properties: { page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } }, children }],
});

Packer.toBuffer(doc).then((buf) => {
  const out = process.argv[2] || 'bedbathntable-sg-migration-handover.docx';
  fs.writeFileSync(out, buf);
  console.log('Wrote', out, '(' + buf.length + ' bytes)');
});
