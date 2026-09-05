#!/usr/bin/env node
/*
 * build-blocks-combined-xlsx.js — combine multiple sections' Human Review
 * "Blocks & Variations" into ONE workbook: a Summary sheet + one sheet per section,
 * each with the full column set and embedded screenshots.
 * Usage: node build-blocks-combined-xlsx.js <out.xlsx> <label>=<catalogFolder> [<label>=<CF> ...]
 */
const path = require('path');
const fs = require('fs');
const ExcelJS = require('/tmp/xlsxtest/node_modules/exceljs');

const OUT = process.argv[2];
const specs = process.argv.slice(3).map((a) => { const i = a.indexOf('='); return { label: a.slice(0, i), cf: a.slice(i + 1) }; });
if (!OUT || !specs.length) { console.error('usage: build-blocks-combined-xlsx.js <out.xlsx> <label>=<CF> ...'); process.exit(1); }

const BASE_LABEL = { nav: 'Header / Footer', 'iframe-embed': 'Embed', media: 'Media', cards: 'Cards', list: 'List / Tabs', form: 'Form', breadcrumbs: 'Breadcrumbs', hero: 'Hero', table: 'Table', unknown: 'Unknown / Custom', text: 'Text' };
const FAMILY_CORE = { hero: 'Hero', cards: 'Cards', media: 'Media / Carousel', list: 'Tabs / List', table: 'Table', 'iframe-embed': 'Embed', form: 'Form', breadcrumbs: 'Breadcrumbs', nav: 'Header / Footer', unknown: '' };
const BASE_ORDER = ['nav', 'hero', 'breadcrumbs', 'cards', 'media', 'list', 'table', 'form', 'iframe-embed', 'text', 'unknown'];
const typeOf = (b) => (b === 'unknown' ? 'Custom' : 'Core');
const complexityOf = (b) => (b === 'unknown' ? 'Complex' : (['form', 'hero', 'media', 'nav'].includes(b) ? 'Medium' : 'Simple'));
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function jpegSize(buf) { let o = 2; while (o < buf.length) { if (buf[o] !== 0xff) { o += 1; continue; } const m = buf[o + 1]; if ((m >= 0xc0 && m <= 0xc3) || (m >= 0xc5 && m <= 0xc7) || (m >= 0xc9 && m <= 0xcb) || (m >= 0xcd && m <= 0xcf)) return { h: buf.readUInt16BE(o + 5), w: buf.readUInt16BE(o + 7) }; o += 2 + buf.readUInt16BE(o + 2); } return { w: 300, h: 200 }; }

const COLS = [
  { header: 'Include', key: 'incl', width: 9 }, { header: 'Row type', key: 'rtype', width: 12 },
  { header: 'Block name', key: 'name', width: 30 }, { header: 'Internal ID', key: 'iid', width: 16 },
  { header: 'Variations', key: 'vars', width: 11 }, { header: 'Build complexity', key: 'cx', width: 16 },
  { header: 'Type', key: 'type', width: 10 }, { header: 'Core block type', key: 'core', width: 18 },
  { header: 'Tags', key: 'tags', width: 22 }, { header: 'Notes', key: 'notes', width: 40 },
  { header: 'Screenshot', key: 'img', width: 46 }, { header: 'Source URL', key: 'url', width: 66 },
];
const IMG_COL0 = COLS.findIndex((c) => c.key === 'img');
const CX_FILL = { Simple: 'FFE3F5E8', Medium: 'FFFBEFDC', Complex: 'FFFBE3E1' };
const CX_FONT = { Simple: 'FF1C7A3E', Medium: 'FFA9701A', Complex: 'FFC0140A' };
const MAIN_FILL = 'FFF4F2F8';

const wb = new ExcelJS.Workbook();
wb.creator = 'Site Analysis Dashboard';

// ---------- THEMES sheet (page templates across all sections, with screenshots) ----------
const themes = wb.addWorksheet('Themes', { views: [{ state: 'frozen', ySplit: 1 }] });
themes.columns = [
  { header: 'Section', key: 'sec', width: 16 }, { header: 'Template (theme)', key: 'name', width: 26 },
  { header: 'Complexity', key: 'cx', width: 13 }, { header: 'Est. pages', key: 'est', width: 11 },
  { header: 'Rendered', key: 'rend', width: 10 }, { header: 'Description', key: 'desc', width: 60 },
  { header: 'Screenshot', key: 'img', width: 44 }, { header: 'Sample URL', key: 'url', width: 66 },
];
const THEME_IMG_COL0 = 6; // 0-based index of "Screenshot"
{ const h = themes.getRow(1); h.font = { bold: true, color: { argb: 'FFFFFFFF' } }; h.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1A1A' } }; h.height = 22; h.alignment = { vertical: 'middle' }; }

// ---------- URL sheet (full URL coverage across all sections) ----------
const urlws = wb.addWorksheet('URL', { views: [{ state: 'frozen', ySplit: 1 }] });
urlws.columns = [
  { header: 'Section', key: 'sec', width: 16 }, { header: 'URL group', key: 'grp', width: 40 },
  { header: 'Path', key: 'path', width: 70 }, { header: 'Full URL', key: 'full', width: 80 },
  { header: 'Status', key: 'st', width: 9 },
];
{ const h = urlws.getRow(1); h.font = { bold: true, color: { argb: 'FFFFFFFF' } }; h.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1A1A' } }; h.height = 22; h.alignment = { vertical: 'middle' }; }
let urlRow = 1;

// summary sheet
const sum = wb.addWorksheet('Summary', { views: [{ state: 'frozen', ySplit: 1 }] });
sum.columns = [
  { header: 'Section', key: 's', width: 24 }, { header: 'Main blocks', key: 'm', width: 14 },
  { header: 'Variations', key: 'v', width: 12 }, { header: 'Total rows', key: 't', width: 12 },
  { header: 'Screenshots', key: 'i', width: 13 }, { header: 'Base types', key: 'b', width: 40 },
];
const sh = sum.getRow(1); sh.font = { bold: true, color: { argb: 'FFFFFFFF' } }; sh.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1A1A' } }; sh.height = 22;

function styleCx(cell, cx) { cell.value = cx; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CX_FILL[cx] } }; cell.font = { bold: true, color: { argb: CX_FONT[cx] } }; cell.alignment = { horizontal: 'center', vertical: 'middle' }; }

for (const { label, cf } of specs) {
  const cat = JSON.parse(fs.readFileSync(path.join(cf, 'block-catalog.json'), 'utf8'));
  const variants = cat.variants || [];
  const byBase = {}; for (const v of variants) (byBase[v.base] = byBase[v.base] || []).push(v);
  const bases = [...BASE_ORDER.filter((b) => byBase[b]), ...Object.keys(byBase).filter((b) => !BASE_ORDER.includes(b))];
  const ws = wb.addWorksheet(label.slice(0, 31), { views: [{ state: 'frozen', ySplit: 1 }] });
  ws.columns = COLS;
  const hdr = ws.getRow(1); hdr.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }; hdr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1A1A' } }; hdr.alignment = { vertical: 'middle' }; hdr.height = 22;

  let r = 1, imgN = 0, mainN = 0, varN = 0;
  const putImg = (repFile, rowIdx) => {
    if (!repFile) return 40; const p = path.join(cf, 'blocks', repFile); if (!fs.existsSync(p)) return 40;
    const buf = fs.readFileSync(p); const { w, h } = jpegSize(buf); const scale = Math.min(300 / w, 150 / h, 1);
    const dw = Math.round(w * scale), dh = Math.round(h * scale);
    const id = wb.addImage({ buffer: buf, extension: 'jpeg' });
    ws.addImage(id, { tl: { col: IMG_COL0 + 0.1, row: rowIdx - 1 + 0.1 }, ext: { width: dw, height: dh } });
    imgN += 1; return Math.max(40, dh * 0.78 + 8);
  };

  for (const base of bases) {
    const vs = byBase[base].slice().sort((a, b) => b.instances - a.instances);
    const fam = BASE_LABEL[base] || base, cx = complexityOf(base), type = typeOf(base), rep = vs[0];
    r += 1; mainN += 1;
    const main = ws.getRow(r);
    main.getCell('incl').value = 'Yes'; main.getCell('rtype').value = 'Main block';
    main.getCell('name').value = fam; main.getCell('name').font = { bold: true };
    main.getCell('iid').value = 'BLK-' + slug(fam).toUpperCase(); main.getCell('vars').value = vs.length;
    styleCx(main.getCell('cx'), cx); main.getCell('type').value = type; main.getCell('core').value = FAMILY_CORE[base] || '';
    main.getCell('tags').value = [slug(fam), type.toLowerCase()].join(', ');
    main.getCell('notes').value = `${vs.length} variant${vs.length !== 1 ? 's' : ''} · ${vs.reduce((a, v) => a + (v.instances || 0), 0)} instances in section`;
    main.getCell('url').value = rep.repUrl ? { text: rep.repUrl, hyperlink: rep.repUrl } : '';
    main.getCell('url').font = { color: { argb: 'FF0563C1' }, underline: true };
    ['incl', 'rtype', 'name', 'iid', 'vars', 'type', 'core', 'tags', 'notes', 'url'].forEach((k) => { main.getCell(k).alignment = { vertical: 'middle', wrapText: true }; });
    main.getCell('vars').alignment = { horizontal: 'center', vertical: 'middle' };
    ['incl', 'rtype', 'name', 'iid', 'vars', 'type', 'core', 'tags', 'notes'].forEach((k) => { main.getCell(k).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: MAIN_FILL } }; });
    main.height = putImg(rep.repFile, r);
    for (const v of vs) {
      r += 1; varN += 1;
      const vid = (v.key.split('::')[1]) || v.key; const row = ws.getRow(r);
      row.getCell('incl').value = 'Yes'; row.getCell('rtype').value = '↳ Variation';
      row.getCell('name').value = vid; row.getCell('name').font = { italic: true };
      styleCx(row.getCell('cx'), cx); row.getCell('type').value = type;
      row.getCell('notes').value = (v.topLabel ? v.topLabel + (v.pagesFound ? ' · ' : '') : '') + (v.pagesFound ? v.pagesFound + ' page' + (v.pagesFound === 1 ? '' : 's') : '');
      const u = row.getCell('url'); u.value = v.repUrl ? { text: v.repUrl, hyperlink: v.repUrl } : ''; u.font = { color: { argb: 'FF0563C1' }, underline: true };
      ['incl', 'rtype', 'name', 'type', 'notes', 'url'].forEach((k) => { row.getCell(k).alignment = { vertical: 'middle', wrapText: true }; });
      row.height = putImg(v.repFile, r);
    }
  }
  ws.autoFilter = { from: 'A1', to: 'L1' };

  // ---- THEMES: page templates for this section ----
  let themeN = 0;
  try {
    const layouts = JSON.parse(fs.readFileSync(path.join(cf, 'layouts.json'), 'utf8'));
    const CXF = { Simple: 'FFE3F5E8', Medium: 'FFFBEFDC', Complex: 'FFFBE3E1', Low: 'FFE3F5E8', High: 'FFFBE3E1' };
    const CXT = { Simple: 'FF1C7A3E', Medium: 'FFA9701A', Complex: 'FFC0140A', Low: 'FF1C7A3E', High: 'FFC0140A' };
    for (const t of (layouts.templates || [])) {
      const tr = themes.addRow({ sec: label, name: t.name, est: t.estPop, rend: t.rendered, desc: t.description || '', url: t.sampleUrl ? { text: t.sampleUrl, hyperlink: t.sampleUrl } : '' });
      const rowIdx = tr.number;
      const cxc = themes.getCell(`C${rowIdx}`); const cxv = t.complexity || 'Medium';
      cxc.value = cxv; cxc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CXF[cxv] || 'FFFBEFDC' } }; cxc.font = { bold: true, color: { argb: CXT[cxv] || 'FFA9701A' } }; cxc.alignment = { horizontal: 'center', vertical: 'middle' };
      themes.getCell(`H${rowIdx}`).font = { color: { argb: 'FF0563C1' }, underline: true };
      themes.getCell(`F${rowIdx}`).alignment = { vertical: 'middle', wrapText: true };
      themes.getCell(`A${rowIdx}`).alignment = { vertical: 'middle' };
      themes.getCell(`B${rowIdx}`).font = { bold: true };
      // embed the template full-page shot (from shots/)
      let rowH = 40;
      if (t.shot) { const p = path.join(cf, 'shots', t.shot);
        if (fs.existsSync(p)) { const buf = fs.readFileSync(p); const { w, h } = jpegSize(buf); const scale = Math.min(280 / w, 220 / h, 1); const dw = Math.round(w * scale), dh = Math.round(h * scale); const id = wb.addImage({ buffer: buf, extension: 'jpeg' }); themes.addImage(id, { tl: { col: THEME_IMG_COL0 + 0.1, row: rowIdx - 1 + 0.1 }, ext: { width: dw, height: dh } }); rowH = Math.max(40, dh * 0.78 + 8); } }
      tr.height = rowH; themeN += 1;
    }
  } catch (e) { console.error('  (no layouts for ' + label + ')'); }

  // ---- URL: full coverage for this section ----
  let urlN = 0;
  try {
    const all = JSON.parse(fs.readFileSync(path.join(cf, 'urls-all.json'), 'utf8'))['analysis-urls-all'];
    const origin = 'https://www.virginatlantic.com';
    // build path->group map from url-groups.json
    const groups = JSON.parse(fs.readFileSync(path.join(cf, 'url-groups.json'), 'utf8'));
    const pathToGroup = {};
    for (const g of groups) for (const p of (g.urls || [])) pathToGroup[p] = g.group;
    for (const u of (all.urls || [])) {
      const full = u.url; const p = full.replace(origin, '');
      urlRow += 1;
      urlws.addRow({ sec: label, grp: pathToGroup[p] || '', path: p, full: { text: full, hyperlink: full }, st: u.status || 200 });
      urlws.getCell(`D${urlRow}`).font = { color: { argb: 'FF0563C1' }, underline: true };
      const stc = urlws.getCell(`E${urlRow}`); const ok = (u.status || 200) < 400;
      stc.alignment = { horizontal: 'center' }; stc.font = { bold: true, color: { argb: ok ? 'FF1C7A3E' : 'FFC0140A' } };
      urlN += 1;
    }
  } catch (e) { console.error('  (no urls for ' + label + ')'); }

  // summary row
  sum.addRow({ s: label, m: mainN, v: varN, t: mainN + varN, i: imgN, b: bases.map((b) => (BASE_LABEL[b] || b) + '(' + byBase[b].length + ')').join(', ') });
  console.log(`  ${label}: ${mainN} mains + ${varN} variations, ${imgN} block shots | ${themeN} themes | ${urlN} urls`);
}
themes.autoFilter = { from: 'A1', to: 'H1' };
urlws.autoFilter = { from: 'A1', to: 'E1' };
sum.autoFilter = { from: 'A1', to: 'F1' };

wb.xlsx.writeFile(OUT).then(() => console.log('wrote', OUT));
