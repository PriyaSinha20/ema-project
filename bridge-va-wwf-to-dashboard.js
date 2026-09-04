#!/usr/bin/env node
/*
 * bridge-va-wwf-to-dashboard.js
 * Enrich the Virgin Atlantic "where-we-fly" site-analysis dashboard with REAL block,
 * template and integration data from the excat VA catalog — filtered to the
 * where-we-fly section — since the skill's EDS detector under-reads this Next.js SPA.
 *
 * Usage: node bridge-va-wwf-to-dashboard.js <CF> <excatVACatalog>
 */
const fs = require('fs');
const path = require('path');

const CF = process.argv[2];
const VA = process.argv[3];
if (!CF || !VA) { console.error('usage: node bridge-va-wwf-to-dashboard.js <CF> <excatVACatalog>'); process.exit(1); }

const blocksDir = path.join(CF, 'blocks'); fs.mkdirSync(blocksDir, { recursive: true });
const shotsDir = path.join(CF, 'shots'); fs.mkdirSync(shotsDir, { recursive: true });

// map excat baseBlock -> skill BASE_ORDER buckets
const BASE_MAP = {
  header: 'nav', footer: 'nav', hero: 'hero', cards: 'cards', carousel: 'media',
  columns: 'media', video: 'media', embed: 'iframe-embed', form: 'form', tabs: 'list',
  table: 'table', breadcrumbs: 'breadcrumbs', search: 'form', unknown: 'unknown',
};

const excat = JSON.parse(fs.readFileSync(path.join(VA, 'block-catalog.json')))['analysis-block-catalog'].blockVariants;
const checklist = JSON.parse(fs.readFileSync(path.join(VA, 'urls-checklist.json')))['analysis-urls-checklist'].pages;
const slugToUrl = {};
for (const [u, p] of Object.entries(checklist)) if (p.slug) slugToUrl[p.slug] = u;
function urlFromShot(rel) {
  if (!rel) return '';
  const m = rel.match(/\.pages\/([^/]+)\//);
  if (!m) return '';
  return slugToUrl[m[1]] || '';
}

// ---- BLOCKS: variants present on where-we-fly pages ----
// Include (a) any variant with a where-we-fly screenshot, AND (b) site-wide/global
// blocks (header, footer, hero, breadcrumbs) that appear on every where-we-fly page
// even if their representative screenshot was captured elsewhere.
const SITEWIDE = new Set(['header', 'footer', 'hero', 'breadcrumbs']);
const variants = [];
let copied = 0;
for (const [key, v] of Object.entries(excat)) {
  const wwfShots = (v.screenshots || []).filter((s) => s.includes('where-we-fly'));
  const isSitewide = SITEWIDE.has(v.baseBlock);
  if (!wwfShots.length && !isSitewide) continue; // section-scoped
  const base = BASE_MAP[v.baseBlock] || 'unknown';
  // prefer a where-we-fly screenshot; else fall back to the variant's first screenshot
  const chosenShot = wwfShots[0] || (v.screenshots || [])[0] || '';
  let repFile = '', repUrl = '';
  if (chosenShot) {
    const src = path.join(VA, chosenShot);
    if (fs.existsSync(src)) {
      repFile = `va-${v.blockVariantId.replace(/[^a-z0-9]+/gi, '-')}.jpg`;
      try { fs.copyFileSync(src, path.join(blocksDir, repFile)); copied++; repUrl = urlFromShot(chosenShot); } catch (e) { repFile = ''; }
    }
  }
  // for site-wide blocks with no where-we-fly shot, source URL = the section root
  if (!repUrl && isSitewide) repUrl = 'https://www.virginatlantic.com/en-IN/where-we-fly';
  const wwfPages = wwfShots.length || (isSitewide ? 132 : 1);
  const sampleShots = (wwfShots.length ? wwfShots : (v.screenshots || [])).slice(0, 6);
  variants.push({
    base, key: `${base}::${v.blockVariantId}`,
    instances: wwfPages, pagesFound: wwfPages,
    repFile, repUrl,
    samples: sampleShots.map((s) => ({ url: urlFromShot(s) || repUrl, file: repFile })),
    topLabel: v.description || v.blockVariantId,
  });
}
variants.sort((a, b) => (a.base < b.base ? -1 : a.base > b.base ? 1 : b.instances - a.instances));
const byBase = {};
for (const v of variants) { const b = byBase[v.base] || (byBase[v.base] = { base: v.base, variants: 0, instances: 0 }); b.variants += 1; b.instances += v.instances; }
fs.writeFileSync(path.join(CF, 'block-catalog.json'), JSON.stringify({
  captured: new Date().toISOString(),
  totalInstances: variants.reduce((a, v) => a + v.instances, 0),
  totalVariants: variants.length,
  baseSummary: Object.values(byBase).sort((a, b) => b.instances - a.instances),
  variants,
}, null, 1));
console.log(`block-catalog: ${variants.length} where-we-fly variants; screenshots copied ${copied}`);

// ---- TEMPLATES: excat templates that have where-we-fly URLs, scoped to the section ----
const tpl = JSON.parse(fs.readFileSync(path.join(VA, 'template-catalog.json'))).templates;
const TPL_META = {
  'marketing-landing': { complexity: 'Complex', description: 'Section-hub landing: hero, promo cards, alternating image+text feature rows, icon-link row. Region/country landing pages (Africa, Asia, Caribbean, USA states, etc.) and the where-we-fly root.' },
  'destination-detail': { complexity: 'Medium', description: 'Destination leaf page: hero, destination overview content and booking/flight prompts (e.g. Tobago).' },
  'itinerary-guide': { complexity: 'Medium', description: 'Itinerary / editorial guide leaf page with hero and day-by-day / stepped content (e.g. Los Angeles itinerary).' },
  'accordion-content': { complexity: 'Medium', description: 'Content page with hero, intro and expand/collapse accordion sections.' },
  'client-rendered-content': { complexity: 'Complex', description: 'Airport-guide / content page whose main region is client-rendered (Next.js); static capture shows the shell.' },
  'airport-guide': { complexity: 'Medium', description: 'Airport guide leaf page (terminals, transport, facilities).' },
};
const templates = [];
const shotManifest = [];
let ti = 0;
for (const t of tpl) {
  const wwfUrls = t.urls.filter((u) => u.includes('/where-we-fly'));
  if (!wwfUrls.length) continue;
  const url0 = wwfUrls[0];
  const slug = checklist[url0] && checklist[url0].slug;
  const src = slug ? path.join(VA, '.pages', slug, 'full-page.jpg') : '';
  let shotFile = '';
  if (src && fs.existsSync(src)) { shotFile = `t${String(ti).padStart(2, '0')}_${t.name}.jpg`; fs.copyFileSync(src, path.join(shotsDir, shotFile)); }
  const meta = TPL_META[t.name] || { complexity: 'Medium', description: '' };
  templates.push({
    signature: t.name, family: t.name, name: t.name,
    rendered: wwfUrls.length, estPop: wwfUrls.length,
    urls: wwfUrls.slice(0, 20), sampleUrl: url0,
    shot: shotFile || '', complexity: meta.complexity, description: meta.description,
    sections: {}, locales: { 'en-IN': wwfUrls.length }, blockCountMode: {}, topSections: [],
  });
  if (shotFile) shotManifest.push({ idx: ti, name: t.name, signature: t.name, estPop: wwfUrls.length, url: url0, file: shotFile, captured: true });
  ti++;
}
templates.sort((a, b) => b.estPop - a.estPop);
fs.writeFileSync(path.join(CF, 'layouts.json'), JSON.stringify({
  captured: new Date().toISOString(),
  renderedPages: templates.reduce((a, t) => a + t.rendered, 0),
  distinctSignatures: templates.length, templates,
}, null, 1));
fs.writeFileSync(path.join(CF, 'shots.json'), JSON.stringify({ captured: new Date().toISOString(), shots: shotManifest }, null, 1));
console.log(`layouts: ${templates.length} where-we-fly templates; template shots ${shotManifest.length}`);
