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

/* ---- ABSOLUTE LINKS TO OUR OWN DOMAIN ----
   The check above only looks at relative hrefs, so an <a> pointing at
   https://www.thebespokefoilcompany.co.uk/... sails past it - it looks external.
   That is exactly how the region map shipped a Register Interest button that
   404'd: the href was absolute to the LIVE WIX site, where /memory-catcher-enquiry
   does not exist. Every one of these is either a dead end today or a link that
   walks a visitor off this site onto the old one.

   Canonicals, schema, og: tags and social share URLs must stay absolute. */
/* ---- RELATIVE ASSET PATHS ----
   A relative src resolves against the CURRENT page URL, so `assets/x.webp` is
   /assets/x.webp on /franchise but /product-page/assets/x.webp on
   /product-page/<slug> - a 404. That is exactly how the UGC reel videos broke:
   the images used absolute paths and loaded, the videos used relative ones and
   did not, and the difference was invisible until someone opened the product
   page. An absolute path cannot care where the page is served. */
const relAssets = [];
for (const file of fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'))) {
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const hits = (html.split('="assets/').length - 1)
             + (html.match(/,\s*assets\//g) || []).length;
  if (hits) relAssets.push(`${file}: ${hits} relative asset path(s)`);
}
if (relAssets.length) {
  console.error('check-internal-links: FAILED - relative asset paths found:');
  for (const r of relAssets) console.error('  - ' + r);
  console.error('  These resolve against the page URL and 404 on any nested route. Use /assets/...');
  process.exit(1);
}

const SITE = 'https://www.thebespokefoilcompany.co.uk';

/* ---- BARE APEX URLs ----
   www is the primary domain (Ryan, 10/08/2026); the apex 301s to it. Every
   canonical, og:url, schema @id, sitemap entry and robots line must therefore
   say www.

   A canonical pointing at the apex while the sitemap says www - or the reverse -
   is one of the most common migration mistakes there is: Google follows the 301,
   finds a canonical that disagrees with the URL it was given, and the signals
   split across two hosts for weeks. Cheap to prevent, tedious to unpick. */
const apexUrls = [];
const APEX = /https:\/\/thebespokefoilcompany\.co\.uk/g;
for (const file of fs.readdirSync(ROOT)) {
  if (!/\.(html|txt|json|xml)$/.test(file)) continue;
  const body = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const hits = (body.match(APEX) || []).length;
  if (hits) apexUrls.push(`${file}: ${hits} bare apex URL(s)`);
}
if (apexUrls.length) {
  console.error('check-internal-links: FAILED - URLs on the apex domain, which 301s to www:');
  for (const a of apexUrls) console.error('  - ' + a);
  console.error('  Use https://www.thebespokefoilcompany.co.uk so canonicals and the sitemap agree.');
  process.exit(1);
}

const ALLOWED = ['rel="canonical"', 'data-bfc-schema', '"@id"', '"url"', '"logo"',
                 '"image"', 'og:', 'sharer.php', 'twitter.com/intent',
                 'linkedin.com/sharing', 'privacy-policy'];
const absolute = [];
for (const file of fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'))) {
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const re = new RegExp('href="' + SITE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(/[^"]*)?"', 'g');
  let m;
  while ((m = re.exec(html))) {
    const ctx = html.slice(Math.max(0, m.index - 200), m.index + 80);
    if (ALLOWED.some((k) => ctx.includes(k)) || file === 'privacy-policy.html') continue;
    absolute.push(`${file}: ${m[0]}`);
  }
}
if (absolute.length) {
  console.error('check-internal-links: FAILED - internal links written as absolute URLs to the live domain:');
  for (const a of absolute) console.error('  - ' + a);
  console.error('  These point at the OLD site. Use a relative path so they resolve wherever the page is served.');
  process.exit(1);
}

console.log(`check-internal-links: ${checked} internal hrefs across ${pages.length} pages`);
if (problems.length === 0) {
  console.log('all internal links resolve.');
} else {
  console.log(`\n${problems.length} problem(s):`);
  for (const p of problems) console.log(`  [${p.why}] ${p.page} -> ${p.href}`);
  if (strict) process.exit(1);
}

/* ---- anchors that point nowhere ----
   This script resolves every internal href, but `href="#"` is a legal
   same-page anchor, so a CTA wired to nothing sails straight through it.
   home.html shipped "Learn about our work with Tommy's" as href="#" - a
   prominent homepage call to action that did nothing, on the charity section.

   Placeholders that JavaScript fills in later are legitimate and must NOT be
   flagged: memory-catcher-region-map.html sets `cardMore.href` from the
   selected region. So an anchor is excused when its id is assigned a href
   somewhere in the same file, or when it is plainly a scripted control. */
{
  const problems = [];
  for (const file of fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'))) {
    const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
    const live = html.replace(/<!--[\s\S]*?-->/g, '');

    for (const m of live.matchAll(/<a\b[^>]*\shref="#"[^>]*>([\s\S]*?)<\/a>/g)) {
      const tag = m[0].slice(0, m[0].indexOf('>') + 1);
      if (/aria-controls|data-[a-z]|role="button"/.test(tag)) continue;

      const id = (tag.match(/\sid="([^"]+)"/) || [])[1];
      if (id) {
        const assigns = new RegExp(
          `getElementById\\(['"\`]${id}['"\`]\\)\\s*\\.href\\s*=|#${id}['"\`]\\s*\\)\\s*\\.href\\s*=`
        );
        if (assigns.test(live)) continue;          // JS supplies the real href
      }

      const text = m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (!text) continue;                          // icon-only toggles
      problems.push(`${file}: <a href="#"> reading "${text.slice(0, 50)}" goes nowhere - give it a real target or wire it up`);
    }
  }
  /* ---- a noindex page must never appear in sitemap.xml ----
     /franchisee-login carried <meta robots="noindex"> while a full category
     comment in _redirects put it into sitemap.xml. Google reports that as an
     error: the sitemap asks it to index a page that forbids indexing. Found on
     the live site 13/08 by Mark's audit.

     The `util` tag is the right answer - listed on the human sitemap page for
     franchisees, kept out of sitemap.xml, robots and llms.txt. This catches the
     next one. */
  {
    const staticPath = path.join(ROOT, 'sitemap-static.json');
    if (fs.existsSync(staticPath)) {
      const parsed = JSON.parse(fs.readFileSync(staticPath, 'utf8'));
      const rows = Array.isArray(parsed) ? parsed : (parsed.urls || []);
      for (const r of rows) {
        const loc = typeof r === 'string' ? r : r.loc;
        if (!loc) continue;
        const f = path.join(ROOT, loc.replace(/^\//, '').replace(/\/$/, '') + '.html');
        if (!fs.existsSync(f)) continue;
        const html = fs.readFileSync(f, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
        if (/<meta[^>]+name=["']robots["'][^>]+noindex/i.test(html)) {
          problems.push(`${loc} is in sitemap.xml but the page is noindex - use the "util" tag in _redirects rather than a category comment`);
        }
      }
    }
  }

  if (problems.length) {
    console.error('check-internal-links: FAILED');
    for (const p of problems) console.error('  - ' + p);
    process.exit(1);
  }
}


/* ---- the region template must not hardcode per-region values ----
   franchise-region-template.html is filled by the franchise-region edge
   function from {{placeholders}}. Four values in the sidebar were hardcoded
   instead: Franchise Potential said "Either", Founders Price said the default
   price, and the status said "This region is available" with a Register Your
   Interest button - on EVERY region page, including taken ones.

   The finder card next to it read the real values, so the two contradicted each
   other on any region that was not a plain available one. Ryan spotted it on
   bolton-wigan, 16/08.

   These are the strings that were wrong. If one reappears, something has been
   pasted back in over a placeholder. */
{
  const problems = [];
  const f = path.join(ROOT, 'franchise-region-template.html');
  if (fs.existsSync(f)) {
    const html = fs.readFileSync(f, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
    const banned = [
      ['This region is available', 'status is per region - use {{status_text}}'],
      ['Become a Memory Catcher in {{region}}', 'the hero must not invite applications to a taken region - use {{hero_heading}}'],
      ['>Register Your Interest<', 'the CTA changes when a region is taken - use {{cta_label}}'],
      ['<p class="val">Either</p>', 'franchise potential is per region - use {{potential}}'],
      ['<p class="val">&pound;3,445</p>', 'price is per region - use {{buy_in}}'],
    ];
    for (const [needle, why] of banned) {
      if (html.includes(needle)) {
        problems.push(`franchise-region-template.html: hardcodes "${needle}" - ${why}`);
      }
    }
    for (const ph of ['{{status_class}}', '{{status_text}}', '{{cta_href}}', '{{cta_label}}', '{{potential}}', '{{buy_in}}', '{{hero_heading}}']) {
      if (!html.includes(ph)) problems.push(`franchise-region-template.html: ${ph} is missing`);
    }
  }
  if (problems.length) {
    console.error('check-internal-links: FAILED');
    for (const p of problems) console.error('  - ' + p);
    process.exit(1);
  }
}
