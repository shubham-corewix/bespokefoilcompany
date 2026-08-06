#!/usr/bin/env node
/*
 * BFC discovery-file generator
 * ---------------------------------
 * Single source of truth: _redirects. Every live URL (200 rewrite) AND its
 * sitemap metadata live on the same line:
 *
 *     /path   /path.html   200   # Category | Label | optional note
 *
 * Produces, from that one file:
 *   - sitemap.xml   (SEO: submitted via robots.txt)
 *   - sitemap.html  (customer-facing "having trouble finding something?" page)
 *   - robots.txt    (crawler policy + sitemap reference)
 *   - llms.txt      (agentic-readiness / AI discovery aid)
 *
 * A route only appears in the outputs if it actually resolves, so the sitemap
 * can never list a dead URL. Add a page -> add its one 200 line (with a
 * "# Category | Label" comment) in _redirects. Nothing else to edit.
 *
 * Comment grammar (everything after the first '#' on a 200 line):
 *   "Category | Label"        nice label, filed under Category
 *   "Category | Label | note" note is appended in llms.txt only
 *   "exclude"                 live route kept OUT of all discovery files
 *   (no comment)              label derived from URL, filed under "Other"
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://www.thebespokefoilcompany.co.uk';

// Category display order (also controls sitemap.html / llms.txt section order).
// Any category found in _redirects but not listed here is appended after these.
const CATEGORY_ORDER = [
  'Main', 'Explore', 'Resources', 'Stories', 'Franchise',
  'Franchise Regions', 'Memory Catchers', 'Contact'
];

// Per-category default <priority> for sitemap.xml (0.0-1.0).
const CATEGORY_PRIORITY = {
  'Main': 1.0, 'Explore': 0.6, 'Resources': 0.6, 'Stories': 0.6, 'Franchise': 0.7,
  'Franchise Regions': 0.5, 'Memory Catchers': 0.5, 'Contact': 0.5, 'Other': 0.5
};
// A few routes deserve a nudge above their category default.
const PRIORITY_OVERRIDE = {
  '/': 1.0, '/our-kit': 0.9, '/franchise': 0.8, '/find-a-memory-catcher': 0.7
};

function deriveLabel(url) {
  if (url === '/') return 'Home';
  const seg = url.replace(/\/$/, '').split('/').pop();
  return seg.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function parseRedirects() {
  const txt = fs.readFileSync(path.join(ROOT, '_redirects'), 'utf8');
  const entries = [];
  const util = [];
  for (const raw of txt.split('\n')) {
    if (!raw.trim() || raw.trim().startsWith('#')) continue;

    const hashIdx = raw.indexOf('#');
    const rulePart = (hashIdx === -1 ? raw : raw.slice(0, hashIdx)).trim();
    const comment = (hashIdx === -1 ? '' : raw.slice(hashIdx + 1)).trim();

    const p = rulePart.split(/\s+/);
    if (p.length < 3 || p[2] !== '200') continue;
    const from = p[0];
    if (from.includes('*') || from.includes(':')) continue;

    const commentLC = comment.toLowerCase();

    // "util" / "util | Label": TEMPORARY testing links. Rendered only on the
    // human sitemap.html page, kept OUT of sitemap.xml / robots / llms so they
    // stay non-indexed. Remove the "util" tag (back to "exclude") at go-live.
    if (commentLC === 'util' || commentLC.startsWith('util |') || commentLC.startsWith('util|')) {
      const parts = comment.split('|').map(s => s.trim());
      const label = parts.length >= 2 && parts[1] ? parts[1] : deriveLabel(from);
      util.push({ from, label });
      continue;
    }

    if (commentLC === 'exclude') continue;

    let category = 'Other', label = deriveLabel(from), note = '';
    if (comment) {
      const parts = comment.split('|').map(s => s.trim());
      if (parts.length >= 2) { category = parts[0]; label = parts[1]; }
      else if (parts.length === 1 && parts[0]) { label = parts[0]; }
      if (parts.length >= 3) note = parts.slice(2).join(' | ');
    }

    entries.push({ from, category, label, note });
  }
  entries.util = util;
  return entries;
}

function lastmod(url) {
  const guess = url === '/' ? 'home.html'
    : url.replace(/^\//, '').replace(/\//g, '-') + '.html';
  try { return fs.statSync(path.join(ROOT, guess)).mtime.toISOString().slice(0, 10); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

function priorityFor(url, category) {
  if (PRIORITY_OVERRIDE[url] != null) return PRIORITY_OVERRIDE[url];
  return CATEGORY_PRIORITY[category] != null ? CATEGORY_PRIORITY[category] : 0.5;
}

function build() {
  const entries = parseRedirects();

  const grouped = {};
  for (const e of entries) {
    (grouped[e.category] = grouped[e.category] || []).push(e);
  }
  const catOrder = CATEGORY_ORDER.filter(c => grouped[c]);
  for (const c of Object.keys(grouped)) if (!catOrder.includes(c)) catOrder.push(c);
  for (const c of catOrder) grouped[c].sort((a, b) => a.label.localeCompare(b.label));

  const totalUrls = entries.length;

  // -------- sitemap.xml --------
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const cat of catOrder) {
    for (const e of grouped[cat]) {
      xml += '  <url>\n';
      xml += `    <loc>${SITE}${e.from}</loc>\n`;
      xml += `    <lastmod>${lastmod(e.from)}</lastmod>\n`;
      xml += `    <priority>${priorityFor(e.from, cat).toFixed(1)}</priority>\n`;
      xml += '  </url>\n';
    }
  }
  xml += '</urlset>\n';
  /* sitemap.xml is NO LONGER written here (04/08/2026). It is served at request
     time by netlify/edge-functions/sitemap.js, which merges these static routes
     with the dynamic franchise regions and blog posts held in Supabase.
     Writing a static sitemap.xml as well would leave a real file on a path an
     edge function also claims - the file usually wins, and the sitemap would
     silently list only the static half of the site.
     What IS written is that static half as JSON, for the function to read. */
  fs.writeFileSync(path.join(ROOT, 'sitemap-static.json'), JSON.stringify({
    generated: new Date().toISOString(),
    site: SITE,
    urls: catOrder.flatMap(cat => grouped[cat].map(e => ({
      loc: e.from,
      lastmod: lastmod(e.from),
      priority: Number(priorityFor(e.from, cat).toFixed(1)),
    }))),
  }, null, 1));

  // -------- robots.txt --------
  const robots =
`# The Bespoke Foil Company - robots.txt
# Generated by scripts/generate-sitemaps.js - do not edit by hand.

User-agent: *
Allow: /

Sitemap: ${SITE}/sitemap.xml

# AI discovery aid (not a directive, just a pointer):
# ${SITE}/llms.txt
`;
  fs.writeFileSync(path.join(ROOT, 'robots.txt'), robots);

  // -------- llms.txt --------
  let llms = `# The Bespoke Foil Company\n\n`;
  llms += `> Family-run British maker of baby foil handprint and footprint keepsake kits, `;
  llms += `and home of the Memory Catcher\u2122 Franchise - an in-person baby keepsake experience. `;
  llms += `Kits are posted to families, prints are captured at home, and returned as finished foil keepsakes.\n\n`;
  for (const cat of catOrder) {
    llms += `## ${cat}\n`;
    for (const e of grouped[cat]) {
      const note = e.note ? `: ${e.note}` : '';
      llms += `- [${e.label}](${SITE}${e.from})${note}\n`;
    }
    llms += `\n`;
  }
  fs.writeFileSync(path.join(ROOT, 'llms.txt'), llms);

  // -------- sitemap.html (customer page) --------
  const cssVer = 'v=10';
  let sections = '';
  for (const cat of catOrder) {
    sections += `      <div class="sm-group">\n`;
    sections += `        <h2>${cat}</h2>\n        <ul>\n`;
    for (const e of grouped[cat]) {
      sections += `          <li><a href="${e.from}">${e.label}</a></li>\n`;
    }
    sections += `        </ul>\n      </div>\n`;
  }
  const template = fs.readFileSync(path.join(__dirname, 'sitemap-template.html'), 'utf8');

  // Utility Pages: TEMPORARY testing section (sitemap.html only). Not in xml/robots/llms.
  const util = entries.util || [];
  if (util.length) {
    util.sort((a, b) => a.label.localeCompare(b.label));
    sections += `      <div class="sm-group sm-group--util">\n`;
    sections += `        <h2>Utility Pages <span class="sm-util-tag">testing</span></h2>\n        <ul>\n`;
    for (const e of util) {
      sections += `          <li><a href="${e.from}">${e.label}</a></li>\n`;
    }
    sections += `        </ul>\n      </div>\n`;
  }

  const html = template
    .replace(/__CSS_VER__/g, cssVer)
    .replace('__SECTIONS__', sections.trimEnd());
  fs.writeFileSync(path.join(ROOT, 'sitemap.html'), html);

  // -------- report --------
  console.log(`Generated from ${totalUrls} live route(s) in _redirects:`);
  console.log('  - sitemap.xml\n  - sitemap.html\n  - robots.txt\n  - llms.txt');
  for (const cat of catOrder) console.log(`    ${cat}: ${grouped[cat].length}`);
}

build();
