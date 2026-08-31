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

const variants = [];
let copied = 0, missing = 0;
for (const [key, v] of Object.entries(excat)) {
  const base = BASE_MAP[v.baseBlock] || 'unknown';
  // representative screenshot (first available)
  let repFile = '';
  const shots = v.screenshots || [];
  for (const rel of shots) {
    const src = path.join(SG, rel);
    if (fs.existsSync(src)) {
      repFile = `excat-${v.blockVariantId.replace(/[^a-z0-9]+/gi, '-')}.jpg`;
      try { fs.copyFileSync(src, path.join(blocksDir, repFile)); copied++; } catch (e) { repFile = ''; }
      break;
    }
  }
  if (!repFile) missing++;
  const samples = shots.slice(0, 6).map((rel) => ({ url: '', file: repFile }));
  variants.push({
    base,
    key: `${base}::${v.blockVariantId}`,
    instances: v.pagesFound || 1,
    pagesFound: v.pagesFound || 1,
    repFile,
    repUrl: '',
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
