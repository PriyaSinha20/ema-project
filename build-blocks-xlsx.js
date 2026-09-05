#!/usr/bin/env node
/*
 * build-blocks-xlsx.js — export a dashboard's Human Review "Blocks & Variations"
 * to .xlsx with screenshots embedded, using the SAME data model + columns as the
 * Human Review tab (Include, Row type, Name, Internal ID, Variations, Build
 * complexity, Type, Core block type, Tags, Notes, Source URL, Screenshot).
 *
 * Usage: node build-blocks-xlsx.js <catalogFolder> <outFile.xlsx> [sectionLabel]
 */
const path = require('path');
const fs = require('fs');
const ExcelJS = require('/tmp/xlsxtest/node_modules/exceljs');

const CF = process.argv[2];
const OUT = process.argv[3];
const LABEL = process.argv[4] || path.basename(CF);
if (!CF || !OUT) { console.error('usage: node build-blocks-xlsx.js <CF> <out.xlsx> [label]'); process.exit(1); }

const cat = JSON.parse(fs.readFileSync(path.join(CF, 'block-catalog.json'), 'utf8'));
const variants = cat.variants || [];

// ---- mirror the dashboard's Human Review seed model ----
const BASE_LABEL = { nav: 'Header / Footer', 'iframe-embed': 'Embed', media: 'Media', cards: 'Cards', list: 'List / Tabs', form: 'Form', breadcrumbs: 'Breadcrumbs', hero: 'Hero', table: 'Table', unknown: 'Unknown / Custom', text: 'Text' };
const FAMILY_CORE = { hero: 'Hero', cards: 'Cards', media: 'Media / Carousel', list: 'Tabs / List', table: 'Table', 'iframe-embed': 'Embed', form: 'Form', breadcrumbs: 'Breadcrumbs', nav: 'Header / Footer', unknown: '' };
function typeOf(base) { return base === 'unknown' ? 'Custom' : 'Core'; }
function complexityOf(base) {
  if (base === 'unknown') return 'Complex';
  if (['form', 'hero', 'media', 'nav'].includes(base)) return 'Medium';
  return 'Simple';
}
function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

// group variants by base → one "main" per base family, its variants as child rows
const byBase = {};
for (const v of variants) { (byBase[v.base] = byBase[v.base] || []).push(v); }
const BASE_ORDER = ['nav', 'hero', 'breadcrumbs', 'cards', 'media', 'list', 'table', 'form', 'iframe-embed', 'text', 'unknown'];
const orderedBases = [...BASE_ORDER.filter((b) => byBase[b]), ...Object.keys(byBase).filter((b) => !BASE_ORDER.includes(b))];

// jpeg size reader
function jpegSize(buf) {
  let off = 2;
  while (off < buf.length) {
    if (buf[off] !== 0xff) { off += 1; continue; }
    const m = buf[off + 1];
    if ((m >= 0xc0 && m <= 0xc3) || (m >= 0xc5 && m <= 0xc7) || (m >= 0xc9 && m <= 0xcb) || (m >= 0xcd && m <= 0xcf)) return { h: buf.readUInt16BE(off + 5), w: buf.readUInt16BE(off + 7) };
    off += 2 + buf.readUInt16BE(off + 2);
  }
  return { w: 300, h: 200 };
}

const wb = new ExcelJS.Workbook();
wb.creator = 'Site Analysis Dashboard';
const ws = wb.addWorksheet('Blocks & Variations', { views: [{ state: 'frozen', ySplit: 1 }] });

const COLS = [
  { header: 'Include', key: 'incl', width: 9 },
  { header: 'Row type', key: 'rtype', width: 12 },
  { header: 'Block name', key: 'name', width: 30 },
  { header: 'Internal ID', key: 'iid', width: 16 },
  { header: 'Variations', key: 'vars', width: 11 },
  { header: 'Build complexity', key: 'cx', width: 16 },
  { header: 'Type', key: 'type', width: 10 },
  { header: 'Core block type', key: 'core', width: 18 },
  { header: 'Tags', key: 'tags', width: 22 },
  { header: 'Notes', key: 'notes', width: 40 },
  { header: 'Screenshot', key: 'img', width: 46 },
  { header: 'Source URL', key: 'url', width: 66 },
];
ws.columns = COLS;
const IMG_COL0 = COLS.findIndex((c) => c.key === 'img'); // 0-based col index for anchoring

const hdr = ws.getRow(1);
hdr.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
hdr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1A1A' } };
hdr.alignment = { vertical: 'middle' };
hdr.height = 22;

const CX_FILL = { Simple: 'FFE3F5E8', Medium: 'FFFBEFDC', Complex: 'FFFBE3E1' };
const CX_FONT = { Simple: 'FF1C7A3E', Medium: 'FFA9701A', Complex: 'FFC0140A' };
const MAIN_FILL = 'FFF4F2F8';

let r = 1, imgN = 0, missing = 0, mainN = 0, varN = 0;

function putImg(repFile, rowIdx) {
  if (!repFile) { missing += 1; return 40; }
  const p = path.join(CF, 'blocks', repFile);
  if (!fs.existsSync(p)) { missing += 1; return 40; }
  const buf = fs.readFileSync(p);
  const { w, h } = jpegSize(buf);
  const scale = Math.min(300 / w, 150 / h, 1);
  const dw = Math.round(w * scale), dh = Math.round(h * scale);
  const id = wb.addImage({ buffer: buf, extension: 'jpeg' });
  ws.addImage(id, { tl: { col: IMG_COL0 + 0.1, row: rowIdx - 1 + 0.1 }, ext: { width: dw, height: dh } });
  imgN += 1;
  return Math.max(40, dh * 0.78 + 8);
}
function styleCx(cell, cx) {
  cell.value = cx;
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CX_FILL[cx] } };
  cell.font = { bold: true, color: { argb: CX_FONT[cx] } };
  cell.alignment = { horizontal: 'center', vertical: 'middle' };
}

for (const base of orderedBases) {
  const vs = byBase[base].slice().sort((a, b) => b.instances - a.instances);
  const fam = BASE_LABEL[base] || base;
  const cx = complexityOf(base);
  const type = typeOf(base);
  // ---- MAIN row (one per base family) ----
  r += 1; mainN += 1;
  const rep = vs[0];
  const main = ws.getRow(r);
  main.getCell('incl').value = 'Yes';
  main.getCell('rtype').value = 'Main block';
  main.getCell('name').value = fam;
  main.getCell('iid').value = 'BLK-' + slug(fam).toUpperCase();
  main.getCell('vars').value = vs.length;
  styleCx(main.getCell('cx'), cx);
  main.getCell('type').value = type;
  main.getCell('core').value = FAMILY_CORE[base] || '';
  main.getCell('tags').value = [slug(fam), type.toLowerCase()].join(', ');
  main.getCell('notes').value = `${vs.length} variant${vs.length !== 1 ? 's' : ''} · ${vs.reduce((a, v) => a + (v.instances || 0), 0)} instances in section`;
  main.getCell('url').value = rep.repUrl ? { text: rep.repUrl, hyperlink: rep.repUrl } : '';
  main.getCell('url').font = { color: { argb: 'FF0563C1' }, underline: true };
  ['incl', 'rtype', 'name', 'iid', 'type', 'core', 'tags', 'notes', 'url', 'vars'].forEach((k) => { main.getCell(k).alignment = { vertical: 'middle', wrapText: true }; });
  main.getCell('vars').alignment = { horizontal: 'center', vertical: 'middle' };
  main.getCell('name').font = { bold: true };
  ['incl', 'rtype', 'name', 'iid', 'vars', 'type', 'core', 'tags', 'notes'].forEach((k) => { main.getCell(k).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: MAIN_FILL } }; });
  main.height = putImg(rep.repFile, r);

  // ---- VARIATION rows (each variant under the family) ----
  for (const v of vs) {
    r += 1; varN += 1;
    const vid = (v.key.split('::')[1]) || v.key;
    const row = ws.getRow(r);
    row.getCell('incl').value = 'Yes';
    row.getCell('rtype').value = '↳ Variation';
    row.getCell('name').value = vid;
    row.getCell('iid').value = '';
    row.getCell('vars').value = '';
    styleCx(row.getCell('cx'), cx);
    row.getCell('type').value = type;
    row.getCell('core').value = '';
    row.getCell('tags').value = '';
    row.getCell('notes').value = v.topLabel || '';
    const urlCell = row.getCell('url');
    urlCell.value = v.repUrl ? { text: v.repUrl, hyperlink: v.repUrl } : '';
    urlCell.font = { color: { argb: 'FF0563C1' }, underline: true };
    ['incl', 'rtype', 'name', 'type', 'notes', 'url'].forEach((k) => { row.getCell(k).alignment = { vertical: 'middle', wrapText: true }; });
    row.getCell('name').font = { italic: true };
    // pages appended into Notes since Human Review shows it as instances
    if (v.pagesFound) row.getCell('notes').value = (v.topLabel ? v.topLabel + ' · ' : '') + v.pagesFound + ' page' + (v.pagesFound === 1 ? '' : 's');
    row.height = putImg(v.repFile, r);
  }
}

ws.autoFilter = { from: 'A1', to: 'L1' };

wb.xlsx.writeFile(OUT).then(() => {
  console.log(`wrote ${OUT}: ${mainN} main blocks + ${varN} variations = ${mainN + varN} rows, ${imgN} screenshots embedded, ${missing} missing`);
});
