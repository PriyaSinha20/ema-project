#!/usr/bin/env node
/*
 * bridge-va-section-to-dashboard.js
 * Enrich a Virgin Atlantic section site-analysis dashboard with REAL block, template
 * and integration data from the excat VA catalog — filtered to a given section path.
 * The skill's EDS detector under-reads this Next.js SPA, so we source the real rendered
 * blocks/templates/screenshots from the excat catalog instead.
 *
 * Usage: node bridge-va-section-to-dashboard.js <CF> <excatVACatalog> <sectionPath> [totalPages]
 *   sectionPath e.g. "/en-IN/experience"  (screenshot match uses the trailing segment)
 */
const fs = require('fs');
const path = require('path');

const CF = process.argv[2];
const VA = process.argv[3];
const SECTION = process.argv[4];            // e.g. /en-IN/experience
const TOTAL = parseInt(process.argv[5] || '0', 10);
if (!CF || !VA || !SECTION) { console.error('usage: node bridge-va-section-to-dashboard.js <CF> <excatVACatalog> <sectionPath> [totalPages]'); process.exit(1); }
const SECKEY = SECTION.replace(/^\//, '').replace(/\//g, '_'); // en-IN_experience  → matches slug dirs
const SECSEG = SECTION.split('/').filter(Boolean).pop();       // "experience"

const blocksDir = path.join(CF, 'blocks'); fs.mkdirSync(blocksDir, { recursive: true });
const shotsDir = path.join(CF, 'shots'); fs.mkdirSync(shotsDir, { recursive: true });

const BASE_MAP = {
  header: 'nav', footer: 'nav', hero: 'hero', cards: 'cards', carousel: 'media',
  columns: 'media', video: 'media', embed: 'iframe-embed', form: 'form', tabs: 'list',
  table: 'table', breadcrumbs: 'breadcrumbs', search: 'form', unknown: 'unknown',
};
const SITEWIDE = new Set(['header', 'footer', 'hero', 'breadcrumbs']);

const excat = JSON.parse(fs.readFileSync(path.join(VA, 'block-catalog.json')))['analysis-block-catalog'].blockVariants;
const checklist = JSON.parse(fs.readFileSync(path.join(VA, 'urls-checklist.json')))['analysis-urls-checklist'].pages;
const slugToUrl = {};
for (const [u, p] of Object.entries(checklist)) if (p.slug) slugToUrl[p.slug] = u;
function urlFromShot(rel) { if (!rel) return ''; const m = rel.match(/\.pages\/([^/]+)\//); if (!m) return ''; return slugToUrl[m[1]] || ''; }
// a screenshot belongs to this section if its slug dir contains "<en-IN>_<section>"
function inSection(rel) { return rel && new RegExp('_' + SECSEG + '(_|--)', 'i').test(rel); }

// ---- BLOCKS ----
const variants = [];
let copied = 0;
for (const [key, v] of Object.entries(excat)) {
  const secShots = (v.screenshots || []).filter(inSection);
  const isSitewide = SITEWIDE.has(v.baseBlock);
  if (!secShots.length && !isSitewide) continue;
  const base = BASE_MAP[v.baseBlock] || 'unknown';
  const chosen = secShots[0] || (v.screenshots || [])[0] || '';
  let repFile = '', repUrl = '';
  if (chosen) {
    const src = path.join(VA, chosen);
    if (fs.existsSync(src)) { repFile = `va-${v.blockVariantId.replace(/[^a-z0-9]+/gi, '-')}.jpg`; try { fs.copyFileSync(src, path.join(blocksDir, repFile)); copied++; repUrl = urlFromShot(chosen); } catch (e) { repFile = ''; } }
  }
  if (!repUrl && isSitewide) repUrl = 'https://www.virginatlantic.com' + SECTION;
  const pages = secShots.length || (isSitewide ? (TOTAL || 1) : 1);
  const sampleShots = (secShots.length ? secShots : (v.screenshots || [])).slice(0, 6);
  variants.push({ base, key: `${base}::${v.blockVariantId}`, instances: pages, pagesFound: pages, repFile, repUrl, samples: sampleShots.map((s) => ({ url: urlFromShot(s) || repUrl, file: repFile })), topLabel: v.description || v.blockVariantId });
}
variants.sort((a, b) => (a.base < b.base ? -1 : a.base > b.base ? 1 : b.instances - a.instances));
const byBase = {};
for (const v of variants) { const b = byBase[v.base] || (byBase[v.base] = { base: v.base, variants: 0, instances: 0 }); b.variants += 1; b.instances += v.instances; }
fs.writeFileSync(path.join(CF, 'block-catalog.json'), JSON.stringify({ captured: new Date().toISOString(), totalInstances: variants.reduce((a, v) => a + v.instances, 0), totalVariants: variants.length, baseSummary: Object.values(byBase).sort((a, b) => b.instances - a.instances), variants }, null, 1));
console.log(`block-catalog: ${variants.length} ${SECSEG} variants; screenshots copied ${copied}`);

// ---- TEMPLATES ----
const tpl = JSON.parse(fs.readFileSync(path.join(VA, 'template-catalog.json'))).templates;
const TPL_META = {
  'marketing-landing': { complexity: 'Complex', description: 'Section-hub landing: hero, promo cards, alternating image+text feature rows, icon-link row. Experience sub-section landings (Upper Class, Premium, Economy, food & drink, fleet, upgrades).' },
  'rich-text-article': { complexity: 'Low', description: 'Hero banner + breadcrumb + long-form rich text (policies / small-print / dining detail).' },
  'accordion-content': { complexity: 'Medium', description: 'Hero + intro + expand/collapse accordion sections + contact block.' },
  'promo-feature': { complexity: 'Medium', description: 'Promotional/campaign layout: hero, media-rich sections, CTA blocks (e.g. World Cup 2026).' },
  'client-rendered-content': { complexity: 'Complex', description: 'Page whose main content region is client-rendered (Next.js); static capture shows the shell.' },
  'destination-detail': { complexity: 'Medium', description: 'Detail leaf page with hero and overview content.' },
  'itinerary-guide': { complexity: 'Medium', description: 'Editorial guide leaf page with stepped content.' },
};
const templates = []; const shotManifest = []; let ti = 0;
for (const t of tpl) {
  const secUrls = t.urls.filter((u) => u.includes(SECTION));
  if (!secUrls.length) continue;
  const url0 = secUrls[0];
  const slug = checklist[url0] && checklist[url0].slug;
  const src = slug ? path.join(VA, '.pages', slug, 'full-page.jpg') : '';
  let shotFile = '';
  if (src && fs.existsSync(src)) { shotFile = `t${String(ti).padStart(2, '0')}_${t.name}.jpg`; fs.copyFileSync(src, path.join(shotsDir, shotFile)); }
  const meta = TPL_META[t.name] || { complexity: 'Medium', description: '' };
  templates.push({ signature: t.name, family: t.name, name: t.name, rendered: secUrls.length, estPop: secUrls.length, urls: secUrls.slice(0, 20), sampleUrl: url0, shot: shotFile || '', complexity: meta.complexity, description: meta.description, sections: {}, locales: { 'en-IN': secUrls.length }, blockCountMode: {}, topSections: [] });
  if (shotFile) shotManifest.push({ idx: ti, name: t.name, signature: t.name, estPop: secUrls.length, url: url0, file: shotFile, captured: true });
  ti++;
}
templates.sort((a, b) => b.estPop - a.estPop);
fs.writeFileSync(path.join(CF, 'layouts.json'), JSON.stringify({ captured: new Date().toISOString(), renderedPages: templates.reduce((a, t) => a + t.rendered, 0), distinctSignatures: templates.length, templates }, null, 1));
fs.writeFileSync(path.join(CF, 'shots.json'), JSON.stringify({ captured: new Date().toISOString(), shots: shotManifest }, null, 1));
console.log(`layouts: ${templates.length} ${SECSEG} templates; template shots ${shotManifest.length}`);
