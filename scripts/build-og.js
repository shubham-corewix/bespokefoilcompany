/* =============================================================================
   build-og.js - point every page's social preview at its own hero
   -----------------------------------------------------------------------------
   WHY

   On 13/08, hours after go-live, Ryan shared a link on WhatsApp and no image
   appeared. Three separate faults, all silent:

     * 35 of 40 pages had no og:image tag at all
     * the four that did pointed at keepsake.thebespokefoilcompany.co.uk and
       franchise.thebespokefoilcompany.co.uk - subdomains from before the
       migration. A 404 behind an og:image reads exactly like no og:image
     * the one remaining was .webp, which WhatsApp's link preview does not
       reliably render

   None of it shows up in a browser. A social preview only fails where you
   cannot see it: in somebody else's chat.

   HOW

   The crops are generated ahead of time and committed as files, NOT made
   during the build. Resizing needs an image library, and adding sharp to the
   Netlify build for a job that changes only when the photography changes would
   be a dependency earning nothing. Regenerate with the snippet in
   scripts/README.md when a hero changes.

   This script only writes tags, so it stays dependency-free:

     og:image           absolute, https, www - Facebook and WhatsApp both
                        reject relative URLs and neither tells you why
     og:image:width     1200
     og:image:height    630   - supplying both stops the first share rendering
                                without an image while the crawler fetches it
     og:image:type      image/jpeg
     twitter:card       summary_large_image

   Pages with no OG image are internal tools, and they are listed rather than
   inferred so a new page cannot slip through untagged.
   ============================================================================= */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OG_DIR = path.join(ROOT, 'assets', 'og');
const BASE = 'https://www.thebespokefoilcompany.co.uk';

/* Internal tools and fragments. No one shares these, and a preview image for
   the snag tool would be odd. Anything NOT listed here must have an image. */
const NO_OG = new Set([
  'component-library.html', 'snag-tool.html', 'gallery-upload.html',
  'memory-catcher-region-map-embed.html', 'post-template.html',
  'franchise-region-template.html', 'franchise-bio-template.html',
]);

const TAGS = [
  ['og:image', null],
  ['og:image:secure_url', null],
  ['og:image:width', '1200'],
  ['og:image:height', '630'],
  ['og:image:type', 'image/jpeg'],
];

function stripExisting(html) {
  /* Remove any og:image family tag and the twitter:image, so a stale absolute
     URL on an old subdomain cannot survive alongside the new one. Two og:image
     tags is not an error - the crawler simply picks one, and it will not be
     the one you meant. */
  return html
    .replace(/[ \t]*<meta[^>]+property=["']og:image(?::[a-z_]+)?["'][^>]*>\s*\n?/gi, '')
    .replace(/[ \t]*<meta[^>]+name=["']twitter:image["'][^>]*>\s*\n?/gi, '');
}

function run() {
  const pages = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));
  const problems = [];
  let written = 0;

  for (const page of pages) {
    const file = path.join(ROOT, page);
    let html = fs.readFileSync(file, 'utf8');

    if (NO_OG.has(page)) continue;

    const img = `assets/og/${page.replace(/\.html$/, '')}.jpg`;
    if (!fs.existsSync(path.join(ROOT, img))) {
      problems.push(`${page}: no ${img} - regenerate the OG crops (see scripts/README.md)`);
      continue;
    }

    const url = `${BASE}/${img}`;
    const block = TAGS
      .map(([prop, val]) => `  <meta property="${prop}" content="${val === null ? url : val}">`)
      .join('\n')
      + `\n  <meta name="twitter:card" content="summary_large_image">`
      + `\n  <meta name="twitter:image" content="${url}">`;

    const before = html;
    html = stripExisting(html);

    /* Sit them immediately after the title, where the other social tags live,
       rather than at the end of head - crawlers read a limited prefix of the
       document and a tag below a large inline stylesheet can be missed. */
    const m = html.match(/<\/title>\s*\n?/i);
    if (!m) {
      problems.push(`${page}: no <title> to anchor the OG block to`);
      continue;
    }
    const at = m.index + m[0].length;
    html = html.slice(0, at) + block + '\n' + html.slice(at);

    /* twitter:card may already exist further down; keep only the one just
       written so the two cannot disagree. */
    const first = html.indexOf('<meta name="twitter:card"');
    html = html.slice(0, first + 1)
      + html.slice(first + 1).replace(/[ \t]*<meta[^>]+name=["']twitter:card["'][^>]*>\s*\n?/gi, '');

    if (html !== before) { fs.writeFileSync(file, html); written++; }
  }

  if (problems.length) {
    console.error('build-og: FAILED');
    for (const p of problems) console.error('  - ' + p);
    process.exit(1);
  }
  console.log(`build-og: ${written} page(s) tagged, ${NO_OG.size} internal page(s) skipped. 1200x630 JPEG, absolute https.`);
}

run();
