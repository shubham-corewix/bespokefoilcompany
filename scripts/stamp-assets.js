/* =============================================================================
   stamp-assets.js - cache-bust /shared/* from file content, automatically
   -----------------------------------------------------------------------------
   WHY THIS EXISTS

   netlify.toml caches /shared/* hard:

       [[headers]]
         for = "/shared/*"
         Cache-Control = "public, max-age=604800"

   Seven days, no revalidation. A returning visitor keeps whatever copy they
   already have, so a fix to a shared file simply does not reach them for a
   week. The only escape is a changed URL.

   `styles.css` was hand-versioned with ?v=N and the JS was not, so on
   12/08/2026:

     shared/styles.css            ?v=28 on 34 pages, ?v=25 on 3  (inconsistent)
     shared/analytics.js          no version, 40 pages
     shared/trustpilot.js         no version, 31 pages
     shared/community-signup.js   no version, 25 pages
     shared/checkout.js           no version, 2 pages

   Two fixes shipped that day - the coupon field styling in checkout.js and the
   consent banner that was covering buy buttons in analytics.js - and neither
   would have reached a returning visitor. The banner one had been blocking
   checkout.

   Hand-maintained version numbers failed twice: once by versioning the CSS and
   forgetting the JS, once by bumping 34 pages to v=28 and missing 3. So this
   stamps from content instead. Change a shared file and its URL changes; change
   nothing and the URL is stable, so caching still works as intended.

   Runs after the build-* scripts and before the check-* ones, because those
   rewrite HTML and would drop the stamps.
   ============================================================================= */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const SHARED = path.join(ROOT, 'shared');

/* Eight hex characters of SHA-1 over the file's bytes. Long enough that an
   accidental collision between two versions of the same file is not a practical
   concern, short enough to stay readable in a URL. */
function hashOf(file) {
  return crypto.createHash('sha1')
    .update(fs.readFileSync(file))
    .digest('hex')
    .slice(0, 8);
}

function run() {
  if (!fs.existsSync(SHARED)) {
    console.log('stamp-assets: no shared/ directory - nothing to do');
    return;
  }

  const hashes = {};
  for (const f of fs.readdirSync(SHARED)) {
    if (!/\.(js|css)$/.test(f)) continue;
    hashes[f] = hashOf(path.join(SHARED, f));
  }

  const pages = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));
  let touched = 0;
  let refs = 0;
  const missing = new Set();

  for (const page of pages) {
    const p = path.join(ROOT, page);
    const before = fs.readFileSync(p, 'utf8');

    /* Match /shared/<file> with or without an existing ?v=, in src or href.
       The existing query is replaced wholesale rather than appended to, so
       re-running is idempotent and old hand-set versions are cleaned up. */
    const after = before.replace(
      /(["'])\/shared\/([A-Za-z0-9._-]+\.(?:js|css))(\?[^"']*)?\1/g,
      (whole, quote, file) => {
        refs++;
        const h = hashes[file];
        if (!h) { missing.add(file); return whole; }
        return `${quote}/shared/${file}?v=${h}${quote}`;
      }
    );

    if (after !== before) {
      fs.writeFileSync(p, after);
      touched++;
    }
  }

  if (missing.size) {
    console.error('stamp-assets: FAILED');
    for (const f of missing) {
      console.error(`  - pages reference /shared/${f} but no such file exists`);
    }
    process.exit(1);
  }

  const list = Object.keys(hashes).sort().map((f) => `${f}=${hashes[f]}`).join(' ');
  console.log(`stamp-assets: ${refs} reference(s) stamped across ${pages.length} page(s), ${touched} file(s) rewritten.`);
  console.log(`  ${list}`);
}

run();
