#!/usr/bin/env node
/* write-full-integrations.js — (re)write integrations.json with the full curated
 * list AFTER compute-data.js has run (compute-data overwrites it from crawl hits).
 * Usage: node write-full-integrations.js <CF> <grandTotalPages>
 */
const fs = require('fs');
const path = require('path');
const CF = process.argv[2];
const N = parseInt(process.argv[3] || '6756', 10);
let detected = {};
try { detected = JSON.parse(fs.readFileSync(path.join(CF, 'integrations.json'))); } catch (e) { detected = { integrations: [] }; }
const hitOf = (name) => { const d = (detected.integrations || []).find((i) => i.name === name); return d ? d.hits : 0; };

const FULL = [
  { name: 'Adobe Commerce (Magento 2)', hits: N, type: 'Platform / backend', complexity: 'Complex', purpose: 'E-commerce platform (catalog, cart, checkout, customer accounts)' },
  { name: 'Magento PageBuilder', hits: N, type: 'CMS / content', complexity: 'Medium', purpose: 'Drag-and-drop content authoring (home, category, CMS, blog)' },
  { name: 'Fastly CDN', hits: N, type: 'Platform / caching', complexity: 'Medium', purpose: 'Edge caching / CDN in front of Magento' },
  { name: 'Google Tag Manager', hits: hitOf('Google Tag Manager') || 624, type: 'Analytics / tags', complexity: 'Medium', purpose: 'Tag management / analytics container' },
  { name: 'Google Analytics', hits: hitOf('Google Analytics') || 236, type: 'Analytics', complexity: 'Medium', purpose: 'Web analytics' },
  { name: 'Afterpay', hits: N, type: 'Payment (BNPL)', complexity: 'Complex', purpose: 'Buy-now-pay-later at PDP, cart & checkout (mini-cart integration)' },
  { name: 'PayPal', hits: N, type: 'Payment gateway', complexity: 'Complex', purpose: 'Checkout payment / billing agreements' },
  { name: 'Google reCAPTCHA', hits: N, type: 'Security / forms', complexity: 'Simple', purpose: 'Bot protection on login / registration / forms' },
  { name: 'Dotdigital', hits: N, type: 'Email / marketing automation', complexity: 'Medium', purpose: 'Newsletter & email capture' },
  { name: 'Google Maps/static', hits: hitOf('Google Maps/static') || 139, type: 'API / embed', complexity: 'Medium', purpose: 'Store locator maps & static assets' },
  { name: 'CDN/jQuery libs', hits: hitOf('CDN/jQuery libs') || 432, type: 'Front-end libs', complexity: 'Simple', purpose: 'Front-end libraries via CDN' },
  { name: 'Vimeo', hits: 335, type: 'Embed', complexity: 'Simple', purpose: 'Embedded video player' },
  { name: 'Facebook Pixel/SDK', hits: hitOf('Facebook Pixel/SDK') || 9, type: 'Pixel / social', complexity: 'Simple', purpose: 'Meta advertising pixel & social' },
  { name: 'Adobe Edge Delivery RUM', hits: N, type: 'Measurement', complexity: 'Simple', purpose: 'Real-user monitoring (rum.hlx.page) — EDS measurement pilot' },
  { name: 'Social embeds (Instagram, Pinterest, TikTok)', hits: N, type: 'Embed / link', complexity: 'Simple', purpose: 'Social profile links & embeds (footer)' },
  { name: 'Wishlist / customer sections', hits: N, type: 'Commerce feature', complexity: 'Medium', purpose: 'Saved items, account sections, mini-cart' },
];
fs.writeFileSync(path.join(CF, 'integrations.json'), JSON.stringify({
  integrations: FULL, globals: detected.globals || [], iframeHosts: detected.iframeHosts || [],
}, null, 1));
console.log('integrations.json rewritten with', FULL.length, 'services');
