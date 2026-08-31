#!/usr/bin/env node
/*
 * bridge-excat-to-dashboard.js
 * Convert the real excat Magento catalog (catalog-bedbathntable-sg/) into the
 * site-analysis-dashboard skill's artifact schema, so the dashboard's Templates,
 * Blocks and Integrations sections populate with real screenshots.
 *
 * Writes into the skill catalog folder (CF):
 *   - block-catalog.json  (variants[] with base/key/instances/pagesFound/repFile/samples/topLabel)
 *   - blocks/<repFile>    (copied representative screenshots)
 *   - layouts.json        (templates[] families with estPop/urls/shot)
 *   - shots/<file> + shots.json  (per-template full-page screenshots)
 * Usage: node bridge-excat-to-dashboard.js <CF> <excatCatalog>
 */
const fs = require('fs');
const path = require('path');

const CF = process.argv[2];
const SG = process.argv[3];
if (!CF || !SG) { console.error('usage: node bridge-excat-to-dashboard.js <CF> <excatCatalog>'); process.exit(1); }

const blocksDir = path.join(CF, 'blocks'); fs.mkdirSync(blocksDir, { recursive: true });
const shotsDir = path.join(CF, 'shots'); fs.mkdirSync(shotsDir, { recursive: true });

// ---- map excat baseBlock -> skill BASE_ORDER buckets ----
// skill BASE_ORDER: cards, media, table, form, iframe-embed, breadcrumbs, hero, list, text, unknown
const BASE_MAP = {
  header: 'nav', footer: 'nav',            // globals (kept, shown under their own if present)
  hero: 'hero', cards: 'cards', carousel: 'media', columns: 'media',
  video: 'media', embed: 'iframe-embed', form: 'form', tabs: 'list',
  table: 'table', breadcrumbs: 'breadcrumbs', search: 'form', unknown: 'unknown',
};

const excat = JSON.parse(fs.readFileSync(path.join(SG, 'block-catalog.json')))['analysis-block-catalog'].blockVariants;

// reverse map: page slug -> source URL (from the excat checklist)
const checklistAll = JSON.parse(fs.readFileSync(path.join(SG, 'urls-checklist.json')))['analysis-urls-checklist'].pages;
const slugToUrl = {};
for (const [u, p] of Object.entries(checklistAll)) if (p.slug) slugToUrl[p.slug] = u;
// recover a source URL from an excat screenshot path like ".pages/<slug>/blocks/x.jpg"
function urlFromShot(rel) {
  if (!rel) return '';
  const m = rel.match(/\.pages\/([^/]+)\//);
  if (!m) return '';
  const slug = m[1];
  if (slug === '_global') return 'https://www.bedbathntable.com.sg/'; // header/footer are site-wide
  return slugToUrl[slug] || '';
}

const variants = [];
let copied = 0, missing = 0;
for (const [key, v] of Object.entries(excat)) {
  const base = BASE_MAP[v.baseBlock] || 'unknown';
  // representative screenshot (first available) + its source URL
  let repFile = '';
  let repUrl = '';
  const shots = v.screenshots || [];
  for (const rel of shots) {
    const src = path.join(SG, rel);
    if (fs.existsSync(src)) {
      repFile = `excat-${v.blockVariantId.replace(/[^a-z0-9]+/gi, '-')}.jpg`;
      try { fs.copyFileSync(src, path.join(blocksDir, repFile)); copied++; repUrl = urlFromShot(rel); } catch (e) { repFile = ''; }
      break;
    }
  }
  if (!repFile) missing++;
  const samples = shots.slice(0, 6).map((rel) => ({ url: urlFromShot(rel), file: repFile }));
  variants.push({
    base,
    key: `${base}::${v.blockVariantId}`,
    instances: v.pagesFound || 1,
    pagesFound: v.pagesFound || 1,
    repFile,
    repUrl,
    samples,
    topLabel: v.description || v.blockVariantId,
  });
}
variants.sort((a, b) => (a.base < b.base ? -1 : a.base > b.base ? 1 : b.instances - a.instances));

const byBase = {};
for (const v of variants) { const b = byBase[v.base] || (byBase[v.base] = { base: v.base, variants: 0, instances: 0 }); b.variants += 1; b.instances += v.instances; }
const baseSummary = Object.values(byBase).sort((a, b) => b.instances - a.instances);

fs.writeFileSync(path.join(CF, 'block-catalog.json'), JSON.stringify({
  captured: new Date().toISOString(),
  totalInstances: variants.reduce((a, v) => a + v.instances, 0),
  totalVariants: variants.length,
  baseSummary, variants,
}, null, 1));
console.log(`block-catalog: ${variants.length} variants across ${baseSummary.length} base types; screenshots copied ${copied}, missing ${missing}`);

// ---- templates -> layouts.json + shots ----
const tpl = JSON.parse(fs.readFileSync(path.join(SG, 'template-catalog.json'))).templates;
const checklist = JSON.parse(fs.readFileSync(path.join(SG, 'urls-checklist.json')))['analysis-urls-checklist'].pages;
// full site page count for estPop weighting
const totalPages = tpl.reduce((a, t) => a + t.urls.length, 0);
const grandTotal = 6756; // full sitemap population

// per-template complexity (matches the excat migration-handover assessment)
// Vocabulary matches the dashboard's existing badge classes: Simple / Medium / Complex
const TPL_COMPLEXITY = {
  'commerce-standard': 'Complex',
  'product-detail': 'Complex',
  'content-editorial': 'Medium',
  'blog-article': 'Medium',
};
const TPL_DESC = {
  'commerce-standard': 'Dominant Magento shell — home, category landing, product listing (faceted filters + grid) and product detail (gallery, price, variants, cross-sell). Shared header/search/mega-nav + footer.',
  'product-detail': 'Product detail page: image gallery with zoom, title/brand, price with strike-through + stock, variant selector, feature icons, cross-sell, size-guide accordion.',
  'content-editorial': 'Mixed content/editorial and listing pages (blog index/author, seasonal landing, influencer shop-the-look) sharing the standard shell.',
  'blog-article': 'Long-form editorial article: hero, alternating image+text sections, product callouts, share, and related-post teasers.',
};

const templates = [];
const shotManifest = [];
let ti = 0;
for (const t of tpl) {
  const url0 = t.urls[0];
  const slug = checklist[url0] && checklist[url0].slug;
  const src = slug ? path.join(SG, '.pages', slug, 'full-page.jpg') : '';
  let shotFile = '';
  if (src && fs.existsSync(src)) {
    shotFile = `t${String(ti).padStart(2, '0')}_${t.name}.jpg`;
    fs.copyFileSync(src, path.join(shotsDir, shotFile));
  }
  // scale estimated population proportionally to full sitemap
  const estPop = Math.round((t.urls.length / totalPages) * grandTotal);
  templates.push({
    signature: t.name,
    family: t.name,
    name: t.name,
    rendered: t.urls.length,
    estPop,
    urls: t.urls.slice(0, 20),
    sampleUrl: url0,
    shot: shotFile ? shotFile : '',
    complexity: TPL_COMPLEXITY[t.name] || 'Medium',
    description: TPL_DESC[t.name] || '',
    sections: {},
    locales: { root: t.urls.length },
    blockCountMode: {},
    topSections: [],
  });
  if (shotFile) shotManifest.push({ idx: ti, name: t.name, signature: t.name, estPop, url: url0, file: shotFile, captured: true });
  ti++;
}

const layouts = {
  captured: new Date().toISOString(),
  renderedPages: totalPages,
  distinctSignatures: templates.length,
  templates,
};
fs.writeFileSync(path.join(CF, 'layouts.json'), JSON.stringify(layouts, null, 1));
fs.writeFileSync(path.join(CF, 'shots.json'), JSON.stringify({ captured: new Date().toISOString(), shots: shotManifest }, null, 1));
console.log(`layouts: ${templates.length} templates; template shots ${shotManifest.length}`);

// ---- full integrations list (from the excat migration analysis of this Magento storefront) ----
// merge auto-detected hits (from crawl) with the known platform/commerce integrations.
let detected = {};
try { detected = JSON.parse(fs.readFileSync(path.join(CF, 'integrations.json'))); } catch (e) { detected = { integrations: [] }; }
const hitOf = (name) => { const d = (detected.integrations || []).find((i) => i.name === name); return d ? d.hits : 0; };

const FULL_INTEGRATIONS = [
  { name: 'Adobe Commerce (Magento 2)', hits: totalPages, type: 'Platform / backend', complexity: 'Complex', purpose: 'E-commerce platform (catalog, cart, checkout, customer accounts)' },
  { name: 'Magento PageBuilder', hits: totalPages, type: 'CMS / content', complexity: 'Medium', purpose: 'Drag-and-drop content authoring (home, category, CMS, blog)' },
  { name: 'Fastly CDN', hits: totalPages, type: 'Platform / caching', complexity: 'Medium', purpose: 'Edge caching / CDN in front of Magento' },
  { name: 'Google Tag Manager', hits: hitOf('Google Tag Manager') || 624, type: 'Analytics / tags', complexity: 'Medium', purpose: 'Tag management / analytics container' },
  { name: 'Google Analytics', hits: hitOf('Google Analytics') || 236, type: 'Analytics', complexity: 'Medium', purpose: 'Web analytics' },
  { name: 'Afterpay', hits: 0, type: 'Payment (BNPL)', complexity: 'Complex', purpose: 'Buy-now-pay-later at PDP, cart & checkout (mini-cart integration)' },
  { name: 'PayPal', hits: 0, type: 'Payment gateway', complexity: 'Complex', purpose: 'Checkout payment / billing agreements' },
  { name: 'Google reCAPTCHA', hits: 0, type: 'Security / forms', complexity: 'Simple', purpose: 'Bot protection on login / registration / forms' },
  { name: 'Dotdigital', hits: 0, type: 'Email / marketing automation', complexity: 'Medium', purpose: 'Newsletter & email capture' },
  { name: 'Google Maps/static', hits: hitOf('Google Maps/static') || 139, type: 'API / embed', complexity: 'Medium', purpose: 'Store locator maps & static assets' },
  { name: 'CDN/jQuery libs', hits: hitOf('CDN/jQuery libs') || 432, type: 'Front-end libs', complexity: 'Simple', purpose: 'Front-end libraries via CDN' },
  { name: 'Vimeo', hits: 335, type: 'Embed', complexity: 'Simple', purpose: 'Embedded video player' },
  { name: 'Facebook Pixel/SDK', hits: hitOf('Facebook Pixel/SDK') || 9, type: 'Pixel / social', complexity: 'Simple', purpose: 'Meta advertising pixel & social' },
  { name: 'Adobe Edge Delivery RUM', hits: totalPages, type: 'Measurement', complexity: 'Simple', purpose: 'Real-user monitoring (rum.hlx.page) — EDS measurement pilot' },
  { name: 'Social embeds (Instagram, Pinterest, TikTok)', hits: totalPages, type: 'Embed / link', complexity: 'Simple', purpose: 'Social profile links & embeds (footer)' },
  { name: 'Wishlist / customer sections', hits: totalPages, type: 'Commerce feature', complexity: 'Medium', purpose: 'Saved items, account sections, mini-cart' },
];
fs.writeFileSync(path.join(CF, 'integrations.json'), JSON.stringify({
  integrations: FULL_INTEGRATIONS,
  globals: detected.globals || [],
  iframeHosts: detected.iframeHosts || [],
}, null, 1));
console.log(`integrations: ${FULL_INTEGRATIONS.length} services written`);
