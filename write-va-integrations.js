#!/usr/bin/env node
/* write-va-integrations.js — full integrations list for the Virgin Atlantic where-we-fly
 * dashboard (from the earlier VA en-IN analysis). Run AFTER compute-data.js. */
const fs = require('fs');
const path = require('path');
const CF = process.argv[2];
const N = parseInt(process.argv[3] || '132', 10);
let detected = {};
try { detected = JSON.parse(fs.readFileSync(path.join(CF, 'integrations.json'))); } catch (e) { detected = {}; }
const FULL = [
  { name: 'Next.js (React) runtime / hydration', hits: N, type: 'Framework', complexity: 'Complex', purpose: 'Client-side rendering — page content hydrates from __NEXT_DATA__' },
  { name: 'Akamai bot protection / CDN', hits: N, type: 'Platform / security', complexity: 'Medium', purpose: 'Edge CDN + bot mitigation (blocks robots.txt / naive crawlers)' },
  { name: 'Self-hosted Tag Management (tms.virginatlantic.com)', hits: N, type: 'Custom code / embed', complexity: 'Complex', purpose: 'Bootstrap.js loads analytics/marketing tags dynamically' },
  { name: 'Analytics data layer (window.digitalData / dataLayer)', hits: N, type: 'Analytics', complexity: 'Medium', purpose: 'Structured analytics data layer on every page' },
  { name: 'Booking / flight-search engine (flights.virginatlantic.com)', hits: 0, type: 'External app', complexity: 'Complex', purpose: 'Fare search & booking flow (linked from destination pages)' },
  { name: 'Airport-guide content service', hits: 0, type: 'API / content', complexity: 'Medium', purpose: 'Airport-guide leaf pages (client-rendered content)' },
  { name: 'Adobe (DTM/Launch/Target signals)', hits: 0, type: 'Analytics / personalization', complexity: 'Medium', purpose: 'Adobe marketing stack referenced via TMS' },
  { name: 'Social embeds (Instagram, X, Facebook, YouTube, Pinterest)', hits: N, type: 'Embed / link', complexity: 'Simple', purpose: 'Social profile links & share (footer)' },
  { name: 'Media / image CDN', hits: N, type: 'Asset delivery', complexity: 'Simple', purpose: 'Optimised destination imagery' },
];
fs.writeFileSync(path.join(CF, 'integrations.json'), JSON.stringify({
  integrations: FULL, globals: detected.globals || [], iframeHosts: detected.iframeHosts || [],
}, null, 1));
console.log('integrations.json:', FULL.length, 'services');
