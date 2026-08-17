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
     'snag-tool.html',              // internal QA tool, excluded from discovery
     'component-library.html',      // internal reference, not a public page
     'memory-catcher-404.html',     // legacy keepsake 404 shell, noindex test page
     'memory-catcher.html',         // legacy affiliate template copy, noindex
     'wallet-test.html',            // Stripe wallet diagnostic, not a public page
   ]);
   
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