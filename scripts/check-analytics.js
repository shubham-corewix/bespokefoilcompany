#!/usr/bin/env node
/* =============================================================================
   check-analytics.js

   Fails the build if any page is missing the analytics tag.

   WHY THIS EXISTS
   BFC left Wix, so there is no CMS backend reporting traffic any more. GA is the
   only source of truth for how people find and use the site, and a page that
   silently ships without the tag is invisible for as long as nobody notices.
   A written rule in the README gets forgotten; a failing build does not.

   Run as part of the Netlify build command alongside the sitemap generator and
   the internal link checker.
   ============================================================================= */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TAG = '/shared/analytics.js';

/* Pages that legitimately have no analytics. Add with a reason, never silently. */
const EXEMPT = new Set([
  'snag-tool.html',        // internal QA tool, excluded from discovery
  'component-library.html' // internal reference, not a public page
]);

/* ---- Apple Pay mark: buttons only, and only real ones ----
   home.html shipped a `<button class="pay-btn apple">` carrying the Apple Pay
   glyph that was wired to the ordinary checkout trigger. Tapping the Apple mark
   opened the drawer, not the Apple Pay sheet. That misleads the customer and
   misuses the mark - Apple's Marketing Guidelines allow the Apple Pay button
   only to initiate an Apple Pay transaction. Removed 11/08.

   A genuine Apple Pay button is rendered by Stripe's Express Checkout Element
   inside the drawer; nothing in this repo should draw one by hand. The payment
   chip row (`assets/pay/applePay.svg` among visa/master/amex) is a different
   thing - a list of accepted methods, which is allowed and stays.

   Same shape as the Etsy logo guard in build-trustpilot.js. */
{
  const problems = [];
  for (const f of fs.readdirSync(ROOT).filter((x) => x.endsWith('.html'))) {
    const html = fs.readFileSync(path.join(ROOT, f), 'utf8');
    /* Strip comments first - the comment explaining this rule must not trip it. */
    const live = html.replace(/<!--[\s\S]*?-->/g, '');
    for (const m of live.matchAll(/<button[^>]*>/g)) {
      const tag = m[0];
      if (/\bapple\b/i.test(tag) || /apple[ -]?pay/i.test(tag)) {
        problems.push(`${f}: ${tag.slice(0, 80)} - a hand-drawn Apple Pay button. Real Apple Pay comes from Stripe's Express Checkout Element; using the mark on anything else misleads the customer and breaches Apple's Marketing Guidelines`);
      }
    }
  }
  if (problems.length) {
    console.error('check-analytics: FAILED');
    for (const p of problems) console.error('  - ' + p);
    process.exit(1);
  }
}

/* ---- the consent banner must sit below modal layers ----
   It shipped at z-index 2147483000, which put it above every layer on the
   site including the checkout drawer and the nav menu, both at 200. On mobile
   the drawer's panel is anchored to the bottom of the screen, so a banner
   pinned bottom-left sat on the payment form and could take taps meant for the
   pay button. Three pages also pin a .sticky buy bar at z-index 50, and the
   banner covered the Buy now button on all of them.

   The banner has to clear the header (20) and the sticky bar (50) and sit
   below anything modal (200). Anything outside that window is a regression.
   Found 12/08 after the same collision stopped orders on the add-ons app. */
{
  const js = fs.readFileSync(path.join(ROOT, 'shared', 'analytics.js'), 'utf8');
  const live = js.replace(/\/\*[\s\S]*?\*\//g, '');
  const m = live.match(/z-index:(\d+)/);
  const problems = [];
  if (!m) {
    problems.push('shared/analytics.js: consent banner has no z-index - it will sit wherever the DOM puts it');
  } else {
    const z = Number(m[1]);
    if (z <= 50) problems.push(`shared/analytics.js: consent banner z-index ${z} is at or below the sticky buy bar (50) - it will be hidden behind it`);
    if (z >= 200) problems.push(`shared/analytics.js: consent banner z-index ${z} is at or above the checkout drawer and nav menu (200) - it will cover the payment form`);
  }
  /* And it must not hardcode a bottom offset: three pages pin a bar there, so
     the offset has to be measured. */
  if (/left:16px;bottom:16px/.test(live)) {
    problems.push('shared/analytics.js: consent banner hardcodes bottom:16px - it must measure any .sticky bar instead');
  }
  if (problems.length) {
    console.error('check-analytics: FAILED');
    for (const p of problems) console.error('  - ' + p);
    process.exit(1);
  }
}

/* ---- every /shared/* reference must be cache-busted ----
   netlify.toml caches /shared/* for seven days with no revalidation, so an
   unversioned URL means a fix never reaches anyone who has visited recently.
   That is not theoretical: on 12/08 both the coupon-field styling and the
   consent banner that was covering buy buttons lived in shared JS with no
   version, so neither would have landed for a returning visitor.

   scripts/stamp-assets.js sets these from file content on every build. This
   check exists for the case where a new page is added by hand and the stamper
   has not run, or where someone strips the query thinking it is noise. */
{
  const problems = [];
  for (const f of fs.readdirSync(ROOT).filter((x) => x.endsWith('.html'))) {
    const html = fs.readFileSync(path.join(ROOT, f), 'utf8');
    const live = html.replace(/<!--[\s\S]*?-->/g, '');
    for (const m of live.matchAll(/["']\/shared\/([A-Za-z0-9._-]+\.(?:js|css))(\?[^"']*)?["']/g)) {
      if (!m[2] || !/\?v=/.test(m[2])) {
        problems.push(`${f}: /shared/${m[1]} has no ?v= - it is cached for 7 days, so a fix to it will not reach returning visitors`);
      }
    }
  }
  if (problems.length) {
    console.error('check-analytics: FAILED');
    for (const p of problems.slice(0, 8)) console.error('  - ' + p);
    if (problems.length > 8) console.error(`  ...and ${problems.length - 8} more`);
    process.exit(1);
  }
}

/* ---- every shareable page needs a working og:image ----
   Found live on 13/08: 35 of 40 pages had no og:image, and the four that did
   pointed at keepsake./franchise. subdomains left behind by the migration. A
   404 behind an og:image looks exactly like no og:image, and neither shows up
   in a browser - a social preview only fails where you cannot see it, in
   somebody else's chat.

   Checks the three things that actually break previews: the tag exists, the URL
   is absolute (Facebook and WhatsApp both reject relative ones), and the file
   is really on disk. Templates carrying a {{placeholder}} are filled per-request
   by an edge function and are skipped. */
{
  const SKIP_OG = new Set([
    'component-library.html', 'snag-tool.html', 'gallery-upload.html',
    'memory-catcher-region-map-embed.html', 'post-template.html',
    'franchise-region-template.html', 'franchise-bio-template.html',
  ]);
  const problems = [];
  for (const f of fs.readdirSync(ROOT).filter((x) => x.endsWith('.html'))) {
    if (SKIP_OG.has(f)) continue;
    const html = fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
    const tags = [...html.matchAll(/<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["']/gi)].map((m) => m[1]);
    if (tags.length === 0) { problems.push(`${f}: no og:image - shared links will show no picture`); continue; }
    if (tags.length > 1) { problems.push(`${f}: ${tags.length} og:image tags - the crawler picks one, and not the one you meant`); continue; }
    const u = tags[0];
    if (u.includes('{{')) continue;                       // filled per request
    if (!/^https:\/\/www\.thebespokefoilcompany\.co\.uk\//.test(u)) {
      problems.push(`${f}: og:image is not an absolute www URL (${u}) - Facebook and WhatsApp reject relative and cross-subdomain ones`);
      continue;
    }
    const rel = u.replace('https://www.thebespokefoilcompany.co.uk/', '');
    if (!fs.existsSync(path.join(ROOT, rel))) {
      problems.push(`${f}: og:image ${rel} is not on disk - a 404 here looks identical to having no image`);
    }
  }
  if (problems.length) {
    console.error('check-analytics: FAILED');
    for (const p of problems.slice(0, 10)) console.error('  - ' + p);
    process.exit(1);
  }
}

const pages = fs.readdirSync(ROOT)
  .filter(f => f.endsWith('.html'))
  .sort();

const missing = [];
const headOrder = [];

for (const f of pages) {
  if (EXEMPT.has(f)) continue;
  const src = fs.readFileSync(path.join(ROOT, f), 'utf8');

  if (!src.includes(TAG)) {
    missing.push(f);
    continue;
  }

  /* Consent defaults must be set before anything else can write a cookie, so the
     tag needs to be early in <head>. Warn rather than fail: it still works lower
     down, it is just less safe. */
  const head = src.slice(src.indexOf('<head'), src.indexOf('</head>'));
  /* Measure from the START of the analytics <script> tag, not from the src path
     inside it, or the tag counts itself and every page reports a false positive. */
  const tagStart = head.indexOf(`<script src="${TAG}"`);
  const before = tagStart === -1 ? '' : head.slice(0, tagStart);
  const scriptsBefore = (before.match(/<script/g) || []).length;
  if (scriptsBefore > 0) headOrder.push(`${f} (${scriptsBefore} script(s) before it)`);
}

console.log(`check-analytics: ${pages.length - EXEMPT.size} pages checked`);

if (headOrder.length) {
  console.warn('check-analytics: WARNING, analytics tag is not first in <head> on:');
  headOrder.forEach(f => console.warn(`  - ${f}`));
}

if (missing.length) {
  console.error(`\ncheck-analytics: FAILED, ${missing.length} page(s) missing ${TAG}:`);
  missing.forEach(f => console.error(`  - ${f}`));
  console.error('\nAdd this as the first line inside <head>:');
  console.error(`  <script src="${TAG}"></script>`);
  console.error('If a page should genuinely have no analytics, add it to EXEMPT');
  console.error('in scripts/check-analytics.js with a reason.\n');
  process.exit(1);
}

console.log('check-analytics: all pages carry the analytics tag.');
