#!/usr/bin/env node
/* =============================================================================
   MIGRATION LINK AUDIT

   Answers one question without anybody reading a page by hand:

     "Does the new site preserve what the old site's internal linking was doing?"

   WHY THIS IS NOT check-internal-links.js
   That script proves every link on the NEW site resolves. It cannot know what
   the OLD site had. A migration can pass it with flying colours while having
   quietly dropped half the internal link graph and 404'd every backlink to a
   renamed page. Two different questions.

   THE ACTUAL RISK, IN ORDER OF COST
   1. Renamed slugs with no 301. The new site deliberately renamed pages -
      /faq not /faqs, /blog not /stories-inspiration, /franchise not
      /memory-catcher-franchise. Every old URL without a redirect is a dead page
      AND every backlink pointing at it is thrown away. This is the expensive one
      and it is permanent once the old site is gone.
   2. Pages that lost inbound internal links. Internal links are how crawl budget
      and authority move around a site. A page that had 14 inbound links and now
      has 2 will quietly slide.
   3. Anchor text that did not carry over. Anchor text is how you tell Google
      what a page is about. "Foil Fusion Technology" pointing at the tech page is
      worth more than "learn more".

   HOW IT RUNS
     node scripts/migration-link-audit.js
     node scripts/migration-link-audit.js --old https://old.example.com

   Needs outbound network access to the live old site, so run it locally or in
   CI - not inside a sandbox with a domain allowlist.

   OLD site: crawled from its sitemap.xml, real hrefs read from the markup.
   NEW site: read straight off disk, plus _redirects for the route map. No
   guessing at slugs from link text, which is the thing that makes this a manual
   job otherwise.
   ============================================================================= */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OLD = (process.argv.includes('--old')
  ? process.argv[process.argv.indexOf('--old') + 1]
  : 'https://www.thebespokefoilcompany.co.uk').replace(/\/$/, '');
const DELAY_MS = 250;          // be polite to the live site
const OUT = path.join(ROOT, 'MIGRATION-LINK-AUDIT.md');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- the new site's route map, from _redirects ---------- */
function newRoutes() {
  const live = new Map();      // public path -> file (200 rewrites)
  const moved = new Map();     // old path -> new path (301/302)
  for (const line of fs.readFileSync(path.join(ROOT, '_redirects'), 'utf8').split('\n')) {
    const p = line.split('#')[0].trim().split(/\s+/);
    if (p.length < 3) continue;
    if (p[2] === '200') live.set(p[0], p[1].replace(/^\//, ''));
    else if (p[2].startsWith('30')) moved.set(p[0], p[1]);
  }
  return { live, moved };
}

/* A path is "reachable" if it is a live route, redirects to one, or matches a
   wildcard rule. Wildcards matter - 112 franchise regions are served that way. */
function reachable(p, { live, moved }) {
  if (live.has(p) || moved.has(p)) return true;
  for (const key of [...live.keys(), ...moved.keys()]) {
    if (key.endsWith('/*') && p.startsWith(key.slice(0, -1))) return true;
  }
  return false;
}

/* ---------- link extraction ---------- */
const A_TAG = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

function extractLinks(html, base) {
  const out = [];
  let m;
  while ((m = A_TAG.exec(html))) {
    let href = m[1].trim();
    const anchor = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (/^(mailto:|tel:|javascript:|#)/i.test(href)) continue;
    try {
      const u = new URL(href, base);
      if (u.hostname.replace(/^www\./, '') !== new URL(base).hostname.replace(/^www\./, '')) continue;
      out.push({ path: u.pathname.replace(/\/$/, '') || '/', anchor });
    } catch (e) { /* malformed href, skip */ }
  }
  return out;
}

/* ---------- crawl the old site ---------- */
async function crawlOld() {
  const urls = new Set();
  const tried = [];
  for (const sm of ['/sitemap.xml', '/sitemap-index.xml', '/pages-sitemap.xml']) {
    try {
      const r = await fetch(OLD + sm);
      if (!r.ok) { tried.push(`${sm} -> HTTP ${r.status}`); continue; }
      const xml = await r.text();
      const before = urls.size;
      for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
        const u = m[1].trim();
        if (u.endsWith('.xml')) {                     // sitemap index
          try {
            const rr = await fetch(u);
            if (!rr.ok) { tried.push(`${u} -> HTTP ${rr.status}`); continue; }
            const inner = await rr.text();
            for (const mm of inner.matchAll(/<loc>([^<]+)<\/loc>/g)) urls.add(mm[1].trim());
          } catch (e) { tried.push(`${u} -> ${e.message}`); }
        } else urls.add(u);
      }
      tried.push(`${sm} -> ${urls.size - before} URL(s)`);
    } catch (e) {
      /* Report the real reason. Swallowing this made a proxy block, a TLS
         failure and a genuinely absent sitemap all look identical, which is
         the least useful thing an error can do. */
      tried.push(`${sm} -> ${e.message}${e.cause ? ' (' + e.cause.message + ')' : ''}`);
    }
  }
  if (!urls.size) {
    console.error(`\nNo URLs found at ${OLD}. What was tried:`);
    for (const t of tried) console.error('  ' + t);
    console.error('\nIf those say ECONNREFUSED or ENOTFOUND, the machine running this');
    console.error('cannot reach the site - check you are not behind a proxy or VPN.');
    console.error('If they say HTTP 403, the site is blocking an unknown user agent.');
    console.error('Otherwise export the URL list from Search Console and pass it another way.');
    process.exit(1);
  }

  const pages = new Map();     // path -> { links: [{path, anchor}], title }
  let i = 0;
  for (const u of urls) {
    i++;
    process.stderr.write(`\rcrawling ${i}/${urls.size} `);
    try {
      const r = await fetch(u);
      if (!r.ok) { pages.set(new URL(u).pathname, { links: [], title: `HTTP ${r.status}` }); continue; }
      const html = await r.text();
      const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [, ''])[1].trim();
      pages.set(new URL(u).pathname.replace(/\/$/, '') || '/', { links: extractLinks(html, u), title });
    } catch (e) {
      pages.set(new URL(u).pathname, { links: [], title: `FETCH FAILED: ${e.message}` });
    }
    await sleep(DELAY_MS);
  }
  process.stderr.write('\n');
  return pages;
}

/* ---------- read the new site off disk ---------- */
function readNew(routes) {
  const fileToPath = new Map();
  for (const [p, f] of routes.live) if (!fileToPath.has(f)) fileToPath.set(f, p);

  const pages = new Map();
  for (const file of fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'))) {
    const p = fileToPath.get(file);
    if (!p) continue;                                  // no public route, not indexed
    const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
    pages.set(p, { links: extractLinks(html, 'https://x' + p), file });
  }
  return pages;
}

/* ---------- inbound link counts ---------- */
function inbound(pages) {
  const counts = new Map();
  const anchors = new Map();
  for (const [from, page] of pages) {
    for (const l of page.links) {
      if (l.path === from) continue;                   // ignore self-links
      counts.set(l.path, (counts.get(l.path) || 0) + 1);
      if (l.anchor) {
        if (!anchors.has(l.path)) anchors.set(l.path, new Set());
        anchors.get(l.path).add(l.anchor.toLowerCase());
      }
    }
  }
  return { counts, anchors };
}

(async () => {
  const routes = newRoutes();
  const oldPages = await crawlOld();
  const newPages = readNew(routes);
  const o = inbound(oldPages);
  const n = inbound(newPages);

  /* 1. old URLs with nowhere to land */
  const dead = [...oldPages.keys()].filter((p) => !reachable(p, routes)).sort();

  /* 2. link targets the old site used that the new site cannot serve */
  const oldTargets = new Set([...o.counts.keys()]);
  const deadTargets = [...oldTargets].filter((p) => !reachable(p, routes)).sort();

  /* 3. pages that lost inbound internal links */
  const lost = [];
  for (const [p, was] of o.counts) {
    if (!reachable(p, routes)) continue;
    const now = n.counts.get(routes.moved.get(p) || p) || 0;
    if (now < was) lost.push({ path: p, was, now, delta: now - was });
  }
  lost.sort((a, b) => a.delta - b.delta);

  /* 4. anchor text that did not carry over */
  const anchorLoss = [];
  for (const [p, set] of o.anchors) {
    if (!reachable(p, routes)) continue;
    const now = n.anchors.get(routes.moved.get(p) || p) || new Set();
    const missing = [...set].filter((a) => !now.has(a) && a.length > 3);
    if (missing.length) anchorLoss.push({ path: p, missing });
  }

  const L = [];
  L.push(`# Migration link audit`);
  L.push(``);
  L.push(`Old site: ${OLD} - ${oldPages.size} pages crawled`);
  L.push(`New site: ${newPages.size} routed pages read from disk`);
  L.push(`Generated ${new Date().toISOString().slice(0, 10)}`);
  L.push(``);

  L.push(`## 1. Old URLs with no route or redirect (${dead.length})`);
  L.push(``);
  L.push(`These 404 the moment the DNS moves. Every backlink pointing at them is`);
  L.push(`thrown away, and unlike the other sections this is not recoverable later.`);
  L.push(``);
  if (!dead.length) L.push(`None. Every old URL resolves.`);
  else {
    L.push('```');
    L.push(`# paste into _redirects, then replace TODO with the real target`);
    for (const p of dead) L.push(`${p.padEnd(48)} TODO   301`);
    L.push('```');
    L.push(``);
    for (const p of dead) L.push(`- \`${p}\` - ${oldPages.get(p)?.title || ''}`);
  }
  L.push(``);

  L.push(`## 2. Internal link targets the new site cannot serve (${deadTargets.length})`);
  L.push(``);
  if (!deadTargets.length) L.push(`None.`);
  else for (const p of deadTargets) L.push(`- \`${p}\` - had ${o.counts.get(p)} inbound link(s) on the old site`);
  L.push(``);

  L.push(`## 3. Pages that lost inbound internal links (${lost.length})`);
  L.push(``);
  L.push(`Internal links move crawl budget and authority. A page that drops from`);
  L.push(`14 inbound links to 2 will quietly slide, and nothing will flag it.`);
  L.push(``);
  if (!lost.length) L.push(`None - every page has at least as many inbound links as before.`);
  else {
    L.push(`| Page | Old | New | Change |`);
    L.push(`|---|---|---|---|`);
    for (const r of lost) L.push(`| \`${r.path}\` | ${r.was} | ${r.now} | ${r.delta} |`);
  }
  L.push(``);

  L.push(`## 4. Anchor text that did not carry over (${anchorLoss.length} pages)`);
  L.push(``);
  L.push(`Anchor text is how you tell Google what a page is about. Losing`);
  L.push(`"Foil Fusion Technology" in favour of "learn more" is a real downgrade.`);
  L.push(``);
  if (!anchorLoss.length) L.push(`None.`);
  else for (const a of anchorLoss.slice(0, 40)) {
    L.push(`- \`${a.path}\``);
    for (const m of a.missing.slice(0, 6)) L.push(`  - "${m}"`);
  }
  L.push(``);

  fs.writeFileSync(OUT, L.join('\n'));

  console.log(`migration-link-audit: ${oldPages.size} old pages, ${newPages.size} new pages.`);
  console.log(`  ${dead.length} old URL(s) with nowhere to land`);
  console.log(`  ${deadTargets.length} internal link target(s) the new site cannot serve`);
  console.log(`  ${lost.length} page(s) with fewer inbound internal links`);
  console.log(`  ${anchorLoss.length} page(s) missing anchor text`);
  console.log(`  report written to MIGRATION-LINK-AUDIT.md`);

  /* Non-zero only for section 1 - the irreversible one. The rest are judgement
     calls a human should read, not a reason to block a deploy. */
  if (dead.length) process.exit(1);
})();
