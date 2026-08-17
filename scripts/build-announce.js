#!/usr/bin/env node
/* =============================================================================
   ANNOUNCE BAR

   Three statements, crossfading, on all 31 pages.

   ALL THREE ARE IN THE HTML AT ONCE. This is the whole point and it is easy to
   get wrong. A ticker that swaps textContent with JavaScript shows a crawler
   exactly one statement - and since no major AI crawler executes JS, the other
   two would be invisible to precisely the audience this is meant to reach.
   Rotating them in CSS means all three are in the raw markup and all three get
   read, while a human sees one at a time.

   No JavaScript at all, so it also works with JS disabled and needs no consent.

   WHY THESE THREE
     Trustpilot   - verified third-party rating
     Etsy volume  - the longevity and volume proof; historically where the sales
                    came from, and 2,000+ is a far bigger number than 72
     Foil Fusion  - the differentiator nobody else can claim, and a strong entity
                    signal to repeat across every page

   COPY RULES BAKED IN
   "Over 2,000" rather than "2,224": stays true as the number grows, so nobody
   has to remember to update it, and it cannot go stale and become an
   unsubstantiated claim.

   NOT "five-star reviews". The live shop shows 4.9 from 2,224 reviews - that is
   an average, and the visible sample includes four-star ones. "Over 2,000
   five-star reviews" would have claimed something the source page contradicts on
   the same screen a visitor could check it on. Corrected 08/08 after reading the
   actual shop page rather than trusting the dashboard screenshot. "on Etsy" is not optional - a review count has to say
   where the reviews are, or it reads as a site-wide claim it cannot support.

   DELIBERATELY NOT LINKED. Making the Etsy claim clickable on every page would
   route traffic from the site, where the margin is whole, to a marketplace that
   takes a cut and owns the customer relationship. The claim earns trust here;
   the link would spend it.
   ============================================================================= */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

/* Etsy figures come from shared/trustpilot.js, the same single source the
   footer reads. They used to be typed into this file AND the footer builder -
   two copies of the same claim, in two scripts, is exactly how a figure ends up
   correct in one place and stale in the other. */
const tp = fs.readFileSync(path.join(ROOT, 'shared', 'trustpilot.js'), 'utf8');
const grab = (name) => {
  const m = tp.match(new RegExp(`var\\s+${name}\\s*=\\s*'([^']*)'`));
  if (!m) { console.error(`build-announce: ${name} not found in shared/trustpilot.js`); process.exit(1); }
  return m[1];
};
const ETSY_SCORE = grab('ETSY_SCORE');
const ETSY_COUNT = grab('ETSY_COUNT');

/* Each entry is [optional image src, text].

   THE TEXT MUST STAY IN ONE ELEMENT. `.announce-item` is a flex container with
   `gap: 8px`, and flexbox turns every run of text between tags into its own
   anonymous flex item. So `Rated <b>Excellent</b> on Trustpilot` became THREE
   flex items, each separated by an 8px gap ON TOP of the ordinary word space -
   which is the double-spacing around the bold words.

   Wrapping the text in a single <span> makes it one flex item, so the gap only
   ever falls between the image and the text, and <b> behaves as normal inline
   markup again. The bold stays. */
const ITEMS = [
  ['/assets/tp-stars-5.svg', 'Rated <b>Excellent</b> on Trustpilot'],
  /* "/ 5" is not padding. "Rated 4.9" alone gives no scale - it could be out of
     10 for all a reader knows.

     The scale is TEXT, not a logo or stars, and that is a legal constraint
     rather than a design preference. Etsy's Trademark Policy: "DON'T use the
     official Etsy logo without our permission" and "DON'T alter, distort, or
     modify the Etsy Marks". Recolouring their orange wordmark to white does
     both at once. The word "Etsy" in plain text is expressly fine.

     Also not reusing tp-stars-5.svg - those are Trustpilot's branded stars, and
     beside an Etsy figure they would imply Trustpilot verified an Etsy rating. */
  [null, `Rated <b>${ETSY_SCORE} / 5</b> from <b>${ETSY_COUNT}</b> reviews on Etsy`],
  [null, 'Our exclusive <b>Foil Fusion Technology&trade;</b>'],
  /* Matches the real logic: SHIP_CUTOFF_HOUR = 12, Mon-Fri, weekend rollover.
     "on a weekday" is not padding - this bar is on every page every day, and
     without it the claim is untrue every Saturday and Sunday. "Dispatch" rather
     than "shipping" so nobody reads it as same-day delivery. */
  [null, 'Order before <b>12pm</b> on a weekday for same-day dispatch'],
];

const bar = () =>
  '<div class="announce">\n' +
  ITEMS.map(([img, text]) =>
    '      <span class="announce-item">'
    + (img ? `<img src="${img}" alt="">` : '')
    + `<span class="announce-text">${text}</span></span>`).join('\n') +
  '\n    </div>';

/* Tolerant of the old single-statement shape and of its own output, so this is
   safe to re-run. */
const ANNOUNCE = /<div class="announce">[\s\S]*?<\/div>\s*(?=<)/;

let touched = 0;
for (const file of fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'))) {
  const p = path.join(ROOT, file);
  let html = fs.readFileSync(p, 'utf8');
  if (!ANNOUNCE.test(html)) continue;
  const next = html.replace(ANNOUNCE, bar() + '\n    ');
  if (next !== html) { fs.writeFileSync(p, next); touched++; }
}

/* ---- verify, do not report ---- */
const problems = [];
for (const file of fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'))) {
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  if (!html.includes('class="announce"')) continue;

  const m = html.match(/<div class="announce">([\s\S]*?)<\/div>/);
  if (!m) { problems.push(`${file}: announce bar unparseable`); continue; }
  const items = m[1].match(/class="announce-item"/g) || [];
  /* every statement must be wrapped, or the flex gap comes back */
  const wrapped = m[1].match(/class="announce-text"/g) || [];
  if (wrapped.length !== ITEMS.length) {
    problems.push(`${file}: ${wrapped.length} wrapped statements, expected ${ITEMS.length} - unwrapped text re-splits into flex items and the double-spacing returns`);
  }
  if (items.length !== ITEMS.length) {
    problems.push(`${file}: ${items.length} statements, expected ${ITEMS.length}`);
  }
  /* Every statement must be readable without running anything.
     Checked against ITEMS itself, not a second hardcoded list. The first version
     duplicated the copy here, so editing a statement broke its own verification
     on all 31 pages and reported the correct output as a failure. */
  for (const [, item] of ITEMS) {
    const text = item.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    const got = m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ');
    if (!got.includes(text)) problems.push(`${file}: "${text}" missing from the raw markup`);
  }
  /* A review count with no platform named is a claim we cannot stand behind. */
  if (/reviews(?!\s+on\s+\w)/.test(m[1].replace(/<[^>]+>/g, ''))) {
    problems.push(`${file}: a review count in the bar does not name its platform`);
  }
}

if (problems.length) {
  console.error('build-announce: FAILED');
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}

console.log(
  `build-announce: ${ITEMS.length} statements on ${touched} page(s). ` +
  `All ${ITEMS.length} in the raw HTML - crawlers read every one, humans see one at a time. No JS.`
);
