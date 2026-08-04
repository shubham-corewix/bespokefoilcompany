#!/usr/bin/env node
/**
 * check-internal-links.js - internal link integrity for the BFC static site.
 *
 * Reads _redirects (the single source of truth) to learn every live route,
 * then scans every .html page in the repo for internal hrefs and reports any
 * that do not resolve to a route, a file on disk, or a known 301 source.
 *
 * Usage:  node scripts/check-internal-links.js          (report only)
 *         node scripts/check-internal-links.js --strict (exit 1 on failures,
 *                                                        for CI/Netlify)
 *
 * Runs on Node built-ins only - no dependencies, same as generate-sitemaps.js.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const strict = process.argv.includes('--strict');

// 1) Learn every live route + 301 source from _redirects
const routes = new Set(['/']);
const wildcardRoutes = [];
const redirectSources = new Set();
const redirects = fs.readFileSync(path.join(ROOT, '_redirects'), 'utf8');
for (const line of redirects.split('\n')) {
  const m200 = line.match(/^(\/\S*)\s+\/\S+\.html\s+200/);
  if (m200) {
    if (m200[1].endsWith('/*')) wildcardRoutes.push(m200[1].slice(0, -1));
    else routes.add(m200[1]);
    continue;
  }
  const m301 = line.match(/^(\/\S*)\s+(\/\S*)\s+301/);
  if (m301) redirectSources.add(m301[1]);
}

// 2) Scan every page for internal hrefs
const pages = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));
const problems = [];
let checked = 0;

for (const page of pages) {
  const html = fs.readFileSync(path.join(ROOT, page), 'utf8');
  const hrefs = [...html.matchAll(/href="(\/[^"#?]*)/g)].map(m => m[1]);
  for (let href of hrefs) {
    if (href.length > 1 && href.endsWith('/')) href = href.slice(0, -1);
    checked++;
    // Dynamic links built in JS (e.g. /post/${slug}): validate the static
    // prefix against known CMS/dynamic route families instead of flagging.
    if (href.includes('${')) {
      const prefix = href.slice(0, href.indexOf('${'));
      const DYNAMIC_PREFIXES = ['/post/', '/franchises/', '/franchises-bio/', '/memory-catcher/'];
      if (DYNAMIC_PREFIXES.some(p => prefix === p)) continue;
      problems.push({ page, href, why: 'dynamic link with unknown route prefix' });
      continue;
    }
    if (routes.has(href)) continue;                                  // clean route
    if (wildcardRoutes.some(p => href.startsWith(p))) continue;      // wildcard route (e.g. edge-served)
    if (href.startsWith('/assets/') || href.startsWith('/shared/')) { // static asset
      if (fs.existsSync(path.join(ROOT, href))) continue;
      problems.push({ page, href, why: 'asset missing on disk' });
      continue;
    }
    if (fs.existsSync(path.join(ROOT, href.replace(/^\//, '')))) continue; // direct file
    if (redirectSources.has(href)) {
      problems.push({ page, href, why: 'points at a 301 source - link the destination directly' });
      continue;
    }
    problems.push({ page, href, why: 'no matching route in _redirects' });
  }
}

// 3) Report
console.log(`check-internal-links: ${checked} internal hrefs across ${pages.length} pages`);
if (problems.length === 0) {
  console.log('all internal links resolve.');
} else {
  console.log(`\n${problems.length} problem(s):`);
  for (const p of problems) console.log(`  [${p.why}] ${p.page} -> ${p.href}`);
  if (strict) process.exit(1);
}
