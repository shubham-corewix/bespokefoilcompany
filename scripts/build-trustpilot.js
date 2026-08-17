#!/usr/bin/env node
/* =============================================================================
   TRUSTPILOT FOOTER BADGE + FIGURE SYNC

   Two jobs, both driven by the two constants in shared/trustpilot.js:

   1. Swap the hand-built footer badge for the official TrustBox (Mini), keeping
      the real figures as the widget's no-JS fallback.
   2. Write SCORE and COUNT into the RAW HTML everywhere they appear, and fail
      the build if anything is out of step.

   WHY THE FALLBACK MATTERS
   The TrustBox renders in an iframe. AI crawlers - GPTBot, ClaudeBot,
   PerplexityBot - do not execute JavaScript at all, so to them the widget is an
   empty div. Trustpilot's own boilerplate puts a bare `<a>Trustpilot</a>` inside
   the container as a fallback; the widget replaces the container's contents once
   it loads. Putting the real score in that slot means a human sees the verified
   widget and a crawler still reads "TrustScore 4.9 - 72 reviews". Nothing is
   lost by swapping.

   WHY THIS SCRIPT EXISTS RATHER THAN A HAND EDIT
   shared/trustpilot.js fills [data-tp-score] and [data-tp-count] at RUNTIME.
   That keeps browsers correct and Googlebot correct, but it is invisible to
   every AI crawler. The moment the two numbers change, the visible page updates
   and the raw HTML silently goes stale for exactly the crawlers that matter.
   Writing them at build time closes that gap.

   THREE CORRECTIONS TO TRUSTPILOT'S GENERATED SNIPPET
   - `data-theme="dark"` added. It was absent, and the attribute defaults to
     light: a black wordmark and black meta text. The footer is #000. It would
     have rendered black on black and looked broken.
   - `data-locale` en-US -> en-GB. UK business, UK profile.
   - Fallback link www.trustpilot.com -> uk.trustpilot.com, matching the PROFILE
     constant shared/trustpilot.js already uses.
   ============================================================================= */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SOURCE = path.join(ROOT, 'shared', 'trustpilot.js');

/* ---- read the single source of truth ---- */
const js = fs.readFileSync(SOURCE, 'utf8');
const grab = (name) => {
  const m = js.match(new RegExp(`var\\s+${name}\\s*=\\s*'([^']*)'`));
  if (!m) {
    console.error(`build-trustpilot: could not read ${name} from shared/trustpilot.js`);
    process.exit(1);
  }
  return m[1];
};
const SCORE = grab('SCORE');
const ETSY_SCORE = grab('ETSY_SCORE');
const ETSY_COUNT = grab('ETSY_COUNT');
const ETSY_SINCE = grab('ETSY_SINCE');
const COUNT = grab('COUNT');
const PROFILE = 'https://uk.trustpilot.com/review/thebespokefoilcompany.co.uk';

/* ---- the widget, with the fallback carrying the real figures ---- */
const TEMPLATE_ID = '53aa8807dec7e10d38f59f32';   // Mini
const BUSINESSUNIT_ID = '5fec7f5644198b00014a524a';
const TOKEN = '39d85b3a-b3ee-4772-ad2c-a59b046a1b1e';

/* ---- SIZE. The two numbers most likely to need another nudge. ----

   WIDTH is doing more work than it looks. TrustBox iframes CENTRE their content
   in whatever width they are given, so any slack between the box and the content
   shows up as a left offset. `data-style-width="100%"` gave it a whole column of
   slack; `max-width: fit-content` on the container did not fix it, because the
   iframe's own width is a percentage and resolves against the container it is
   supposed to be sizing. A definite pixel width removes the slack outright.

   Lower WIDTH to move it left. Lower HEIGHT to shrink the block. If the content
   clips, go back up - the true minimum is on the Preview page of this TrustBox
   in the Trustpilot account. */
const WIDTH = '200px';
const HEIGHT = '100px';

/* Where 100px comes from, so the next person does not guess again.

   Measured off a screenshot using the payment chips as a scale anchor - they are
   a known 26px in CSS and rendered at ~55px, so that screenshot was ~2.1x. The
   widget content ran logo-top to score-baseline over ~180 screenshot pixels,
   which is ~86px real, plus the iframe's own padding. 100px fits it without
   leaving dead space beneath.

   The disclaimer line is OFF (data-review-disclaimer="false") on Ryan's
   instruction 07/08 - it was clipping at 110px and he did not want it. It is a
   toggle in Trustpilot's own TrustBox designer, not a hack; his generated
   snippet simply had it ticked. */

const widget = (score, count) => `<div class="foot-tp">
          <!-- Official TrustBox (Mini). Everything inside the container is the
               no-JS fallback - the widget replaces it once tp.widget.bootstrap
               loads. The real figures live there on purpose: AI crawlers never
               run the widget, so this is what they read. Kept in sync by
               scripts/build-trustpilot.js from shared/trustpilot.js. -->
          <div class="trustpilot-widget" data-locale="en-GB" data-template-id="${TEMPLATE_ID}" data-businessunit-id="${BUSINESSUNIT_ID}" data-style-height="${HEIGHT}" data-style-width="${WIDTH}" data-theme="dark" data-token="${TOKEN}" data-review-disclaimer="false">
            <a href="${PROFILE}" target="_blank" rel="noopener">
              <img class="tp-stars" src="/assets/tp-stars-5.svg" alt="Trustpilot 5 stars">
              <span class="tp-meta">TrustScore <span data-tp-score>${score}</span> &middot; <span data-tp-count>${count}</span> reviews on Trustpilot</span>
            </a>
          </div>
          <!-- Etsy sits directly beneath the TrustBox so the two read as one
               block of proof: a verified rating from one platform, and volume
               from another. 2,224 is a far bigger number than 72 and does real
               work here, at the point someone is deciding.

               Unlinked, deliberately, for the same reason as the announce bar:
               a clickable Etsy link in the footer of every page routes traffic
               off the site, where the margin is whole, to a marketplace that
               takes a cut and owns the customer. The claim earns trust here;
               the link would spend it. The Organization schema's sameAs already
               connects the two for machines. -->
          <p class="foot-etsy"><span data-etsy-score>${ETSY_SCORE}</span> / 5 from <span data-etsy-count>${ETSY_COUNT}</span> reviews on Etsy</p>
        </div>`;

/* The bootstrap.

   Loaded unconditionally, on Ryan's instruction 07/08/2026, so the verified
   badge shows to every visitor rather than only to those who have accepted the
   cookie banner.

   The trade-off he is accepting knowingly, recorded here so it does not get
   rediscovered as a surprise: third-party embeds that load before consent are a
   UK GDPR / ePrivacy exposure, and Trustpilot widgets are specifically cited in
   that context. The consent plumbing still exists - window.bfcConsent and the
   bfc:consent event - so re-gating this is a small change if the position ever
   shifts. See GO-LIVE-RUNBOOK.md, open decisions.

   Still at the end of <body> rather than in <head> as Trustpilot instructs: it
   is async either way and the badge is always below the fold, so this blocks
   nothing. */
const BOOTSTRAP = '<script type="text/javascript" src="https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js" async data-tp-bootstrap><\/script>';

/* ---- rewrite ---- */
const OLD_BADGE = /<div class="foot-tp">\s*<img class="tp-stars"[^>]*>\s*<span class="tp-meta">[\s\S]*?<\/span>\s*<\/div>/;
/* Matches the block through EITHER shape: the original, which ended
   `</div></div>`, and the current one, which ends `</p></div>` because the Etsy
   line now sits after the widget. Adding that <p> broke the old pattern - the
   build could no longer find its own output, so a re-run left the previous
   markup in place and then failed its own verification. */
/* Two shapes to match, chosen explicitly rather than by alternation.

   The ORIGINAL block ended `</div></div>`. The CURRENT one ends `</p></div>`,
   because the Etsy line now sits after the widget. Adding that <p> broke the
   old pattern outright: the build could no longer find its own output, so
   re-running left the previous markup untouched and then failed its own
   verification against it.

   A single regex with `</p>|</div>` alternation is NOT safe here - on a page
   still in the old shape it would scan past the block hunting for a `</p>` and
   swallow half the footer. Check which shape is present, then match that one. */
const badgeBlock = (html) => html.includes('class="foot-etsy"')
  ? /<div class="foot-tp">[\s\S]*?<\/p>\s*<\/div>/
  /* Matches .foot-tp and ITS OWN closing tag, by refusing to cross a nested
     <div>. The previous pattern was `[\s\S]*?</div>\s*</div>`, which was written
     when .foot-tp was followed by a single close. Once the footer gained its
     proper `</div></div></div>` on 10/08, that pattern started matching
     .foot-tp's close PLUS .foot-right's, and the replacement only put one back -
     silently eating a closing div every time the script ran on a page still in
     the old shape. sitemap.html hit this on every build, because it is
     regenerated from a template that still carries the static badge. */
  : /<div class="foot-tp">(?:(?!<div\b)[\s\S])*?<\/div>/;

let swapped = 0, bootstrapped = 0, synced = 0;
const pages = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));

for (const file of pages) {
  const p = path.join(ROOT, file);
  let html = fs.readFileSync(p, 'utf8');
  const before = html;

  /* 1. swap the badge (idempotent - matches the new shape too) */
  const NEW_BADGE = badgeBlock(html);
  if (NEW_BADGE.test(html)) {
    html = html.replace(NEW_BADGE, widget(SCORE, COUNT));
    swapped++;
  } else if (OLD_BADGE.test(html)) {
    html = html.replace(OLD_BADGE, widget(SCORE, COUNT));
    swapped++;
  }

  /* 2. bootstrap script, once, only on pages that actually carry a widget */
  if (html.includes('class="trustpilot-widget"')) {
    /* Replace any previous bootstrap outright - it changed from a bare async
       <script src> to a consent-gated loader, and a stale copy would keep
       loading Trustpilot unconditionally. */
    html = html.replace(/[ \t]*<script[^>]*data-tp-bootstrap[^>]*>[\s\S]*?<\/script>\n?/g, '');
    {
      const close = html.lastIndexOf('</body>');
      if (close === -1) {
        console.error(`build-trustpilot: no </body> in ${file}`);
        process.exit(1);
      }
      html = html.slice(0, close) + BOOTSTRAP + '\n' + html.slice(close);
    }
    bootstrapped++;
  }

  /* 3. write the figures into the RAW html wherever they appear */
  const s = html;
  /* Tag-agnostic: the footer uses <span>, the product hero uses <b>. Matching
     only <span> would have left the hero score unsynced and drifting. */
  html = html
    .replace(/(<(\w+) data-tp-score>)[^<]*(<\/\2>)/g, `$1${SCORE}$3`)
    .replace(/(<(\w+) data-tp-count>)[^<]*(<\/\2>)/g, `$1${COUNT}$3`);
  if (html !== s) synced++;

  if (html !== before) fs.writeFileSync(p, html);
}

/* ---- verify, do not report ---- */
/* ---- Etsy line under the reviews heading ----

   Ryan's read is right: 72 Trustpilot reviews looks thin on its own, and the
   fix is not to hide it but to explain it. A visitor who sees 72 wonders how
   long the business has been going; one who sees "2,000 reviews on Etsy since
   2018" stops wondering.

   Stating "new to Trustpilot" outright, rather than hoping nobody notices,
   turns the weakest number on the page into a demonstration of candour. It also
   pre-empts the thought before the visitor has it, which is the only time that
   argument works.

   A SEPARATE LINE, not inline to the right of the Trustpilot lockup:
     - side by side wraps badly on a phone
     - one claim is linked and verified, the other is not, so they should not
       look like equals
     - text pressed against the Trustpilot brandmark risks reading as though
       Trustpilot vouches for the Etsy figure

   Unlinked, per Ryan and consistent with the footer and the announce bar.  */
const ETSY_NOTE = `<p class="reviews-etsy">We're new to Trustpilot, but not here: rated `
  + `<b data-etsy-score>${ETSY_SCORE}</b> / 5 from <b data-etsy-count>${ETSY_COUNT}</b> reviews on Etsy `
  + `since <span data-etsy-since>${ETSY_SINCE}</span>.</p>`;

/* ---- Etsy alongside the OTHER two Trustpilot statements ----

   Ryan: put it next to every Trustpilot claim, not just the reviews section.
   Three surfaces carry one:

     .tp-jump   hero proof on the product and affiliate pages
     .kb-tp     mid-page line under the testimonial cards, 3 pages
     .reviews-head + .foot-tp + the announce bar, all already done

   THE HERO VERSION IS SHORT ON PURPOSE. A hero proof line is read at a glance,
   and the full "new to Trustpilot, but not to this" argument belongs where
   someone is actually weighing up reviews. Here the work is done by the
   repetition: 4.9 on one platform, 4.9 on another. Two independent sources
   agreeing says more in five words than a sentence would.

   Unlinked throughout, per Ryan. The Trustpilot half stays linked as it was.  */
const HERO_ETSY = `<span class="tp-etsy">Rated <b data-etsy-score>${ETSY_SCORE}</b>/5 `
  + `<b data-etsy-count>${ETSY_COUNT}</b>+ Etsy reviews</span>`;

const KB_ETSY = `<span class="kb-etsy">Also rated <b data-etsy-score>${ETSY_SCORE}</b> / 5 from `
  + `<b data-etsy-count>${ETSY_COUNT}</b> reviews on Etsy since <span data-etsy-since>${ETSY_SINCE}</span>.</span>`;

for (const file of pages) {
  const fp = path.join(ROOT, file);
  let html = fs.readFileSync(fp, 'utf8');
  let before = html;

  /* hero: append inside .tp-jump, after the closing </span> of .tp-line */
  if (html.includes('class="tp-jump"')) {
    html = html.replace(/\s*<span class="tp-etsy">[\s\S]*?<\/span>(?=\s*<\/a>)/, '');
    html = html.replace(/(<a class="tp-jump"[\s\S]*?<\/span>)(\s*)(<\/a>)/,
      `$1\n              ${HERO_ETSY}\n            $3`);
  }

  /* mid-page: append inside the .kb-tp paragraph */
  if (html.includes('class="kb-tp"')) {
    html = html.replace(/\s*<span class="kb-etsy">[\s\S]*?<\/span>(?=\s*<\/p>)/, '');
    html = html.replace(/(<p class="kb-tp">[\s\S]*?<\/a>)(\s*)(<\/p>)/,
      `$1\n      ${KB_ETSY}\n    $3`);
  }

  if (html !== before) fs.writeFileSync(fp, html);
}

const HEAD = /(<div class="reviews-head">[\s\S]*?<\/a>)(\s*)(<\/div>)/;

for (const file of pages) {
  const fp = path.join(ROOT, file);
  let html = fs.readFileSync(fp, 'utf8');
  if (!html.includes('class="reviews-head"')) continue;
  if (html.includes('class="reviews-etsy"')) {
    html = html.replace(/\s*<p class="reviews-etsy">[\s\S]*?<\/p>/, '');
  }
  if (!HEAD.test(html)) {
    console.error(`build-trustpilot: could not parse .reviews-head in ${file}`);
    process.exit(1);
  }
  html = html.replace(HEAD, `$1\n          ${ETSY_NOTE}\n        $3`);
  fs.writeFileSync(fp, html);
}

const problems = [];
for (const file of pages) {
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const hasWidget = html.includes('class="trustpilot-widget"');

  if (hasWidget) {
    if (!html.includes('data-theme="dark"')) {
      problems.push(`${file}: widget has no data-theme="dark" - the footer is #000 and the default light theme renders black on black`);
    }
    if (html.includes('data-locale="en-US"')) {
      problems.push(`${file}: widget locale is en-US on a UK profile`);
    }
    if (html.includes('data-review-disclaimer="true"')) {
      problems.push(`${file}: review disclaimer is back on - it clips at this height and was turned off deliberately on 07/08`);
    }
    if (!html.includes('data-tp-bootstrap')) {
      problems.push(`${file}: widget present but the bootstrap script is missing, so it will never render`);
    }
    /* The reviews section carries the Etsy line too - it is the whole reason
       72 Trustpilot reviews reads as reassuring rather than thin. */
    if (html.includes('class="tp-jump"') && !html.includes('class="tp-etsy"')) {
      problems.push(`${file}: the hero Trustpilot line has no Etsy figure beside it`);
    }
    /* The two halves are separated by a real element, not punctuation - the
       middot used to live inside the Etsy span, which meant zero space between
       the two figures (whitespace between flex items is collapsed) and they
       read as one run-on line. Ryan, 11/08. */
    /* The divider must take its colour from the text. our-kit's hero is light,
       keepsake-standalone's is dark; a fixed colour is invisible on one of
       them, and invisibly so - it just looks like the spacing is wrong. */
    if (html.includes('class="tp-sep"') && !/\.tp-sep\{[^}]*background:\s*currentColor/.test(html)) {
      problems.push(`${file}: .tp-sep uses a fixed colour - it must be currentColor, or it disappears against one of the two hero backgrounds`);
    }
    if (html.includes('class="tp-jump"') && !html.includes('class="tp-sep"')) {
      problems.push(`${file}: the hero proof line has no .tp-sep divider, so the Trustpilot and Etsy figures will run together`);
    }
    if (html.includes('class="kb-tp"') && !html.includes('class="kb-etsy"')) {
      problems.push(`${file}: the mid-page Trustpilot line has no Etsy figure beside it`);
    }
    if (html.includes('class="reviews-head"') && !html.includes('class="reviews-etsy"')) {
      problems.push(`${file}: the reviews section has no Etsy line to back up the 72`);
    }
    if (!html.includes('class="foot-etsy"')) {
      problems.push(`${file}: the Etsy line is missing from the footer proof block`);
    }
    /* Any explicit scale passes - "/ 5" or "out of 5". The point is that a bare
       "4.9" says nothing about what it is out of. */
    if (!/data-etsy-score>[^<]*<\/span>\s*(?:\/\s*5|out of 5)/.test(html)) {
      problems.push(`${file}: the Etsy figure has no scale - "4.9" alone does not say out of what`);
    }
    /* Etsy's Trademark Policy forbids using their logo without written
       permission, and forbids altering it. A recoloured wordmark does both. */
    if (/etsy[-_]?logo[^"']*\.svg/i.test(html)) {
      problems.push(`${file}: an Etsy logo asset is referenced - their Trademark Policy forbids the standalone logo without written permission, and forbids recolouring it`);
    }
    if (!/<(\w+) data-tp-score>[^<]+<\/\1>/.test(html)) {
      problems.push(`${file}: widget has no text fallback - AI crawlers would read nothing`);
    }
  }

  for (const [attr, want] of [['data-tp-score', SCORE], ['data-tp-count', COUNT]]) {
    const found = [...html.matchAll(new RegExp(`<(\\w+) ${attr}>([^<]*)</\\1>`, 'g'))].map((m) => m[2]);
    const wrong = found.filter((v) => v !== want);
    if (wrong.length) problems.push(`${file}: ${attr} raw value ${wrong[0]} does not match ${want}`);
  }
}

if (problems.length) {
  console.error('build-trustpilot: FAILED');
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}

console.log(
  `build-trustpilot: TrustScore ${SCORE} / ${COUNT} reviews written into ${synced} page(s). ` +
  `Official TrustBox on ${swapped}, bootstrap on ${bootstrapped}. ` +
  `Figures are in the raw HTML, so crawlers that never run the widget still read them.`
);
