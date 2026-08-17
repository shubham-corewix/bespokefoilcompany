#!/usr/bin/env node
/* =============================================================================
   CHECK-FOOTER

   Catches the class of defect that put the wordmark in the bottom-right corner
   of some pages and removed it entirely from others.

   WHAT WENT WRONG, AND WHY NOTHING NOTICED FOR WEEKS

   Every page's footer left three <div>s unclosed - `.foot-top`, `.foot-col` and
   `.foot-right`. Browsers recover from that silently by auto-closing at
   `</footer>`, so nothing broke visibly at first. But it meant `.foot-legal` and
   `.foot-watermark` were parsed as CHILDREN of `.foot-right`, inside
   `.foot-col`, inside `.foot-top` - which is a four-column grid. So the legal
   block and the full-bleed wordmark became items in the fourth column: the
   wordmark's `width: calc(100% + 80px)` measured against a narrow column instead
   of the footer, which is exactly why it appeared small and jammed into the
   bottom-right.

   Separately, four pages - home, blog, franchise and our-kit - had no footer
   tail at all: no `.foot-legal`, no `.foot-watermark`, no `</footer>`. The
   homepage was serving without the company number or VAT ID, which UK companies
   are required to display.

   Neither showed up in any existing check, because every one of them looks at
   content rather than structure.

   WHAT THIS CHECKS
     1. <footer> closes exactly once.
     2. .foot-legal exists and is a DIRECT child of <footer> (nesting depth 0).
     3. .foot-watermark exists and comes AFTER .foot-legal, so the cookie link
        can never end up underneath the wordmark or against the base of the page.
     4. Every <div> inside the footer balances.
   ============================================================================= */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

/* Pages with a deliberately different, compact footer. All are utility or
   standalone pages, not part of the main site chrome. linktree.html is the
   link-in-bio page: a full site footer of ~25 links would bury the four
   buttons the page exists for. It still carries the registered company and VAT
   details in a compact one-line footer - what it skips is the nav and the
   wordmark, not the legal statement. */
const EXEMPT = new Set([
  'keepsake-standalone.html', 'upload-portal-form.html', 'linktree.html',
]);

const problems = [];

/* ---- classed chrome must declare what it would otherwise inherit ----
   shared/styles.css styles the BARE `header` and `footer` elements for the main
   site chrome:

     header { position:absolute; top:44px; z-index:20 }        floats over the hero
     footer { background:var(--ink); color:rgba(255,255,255,.7) }   black block

   Both are correct for the main pages, which use `<header>` and `<footer>` with
   no class. But an element selector applies whatever class you add, so a
   standalone page that classes its chrome to restyle it inherits those anyway.

   The symptoms do not look like cascade problems, which is why they get missed:
   a header lifted out of flow and dropped on top of the content below it, or
   footer text sitting invisibly on a black band nobody asked for. Both reached
   a preview on 11/08, and both times the pattern was copied from a page whose
   override (`position:sticky`, `background:transparent`) looked like styling.

   So: if it carries a class, say where it sits and what colour it is. */
const CHROME = [
  ['header', /(^|[;{]\s*)position\s*:/,
    "position - it inherits 'header { position:absolute; top:44px }' and will overlap the content below it"],
  ['footer', /(^|[;{]\s*)background[-a-z]*\s*:/,
    "background - it inherits 'footer { background:var(--ink) }' and its text will sit on an unexpected black band"],
];

for (const file of fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'))) {
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  /* Strip CSS comments first: the comment explaining a rule must not satisfy it.
     That exact false positive has bitten this repo repeatedly. */
  const css = html.replace(/\/\*[\s\S]*?\*\//g, '');

  for (const [tag, needed, why] of CHROME) {
    const re = new RegExp('<' + tag + '[^>]*\\sclass="([^"]+)"', 'g');
    for (const m of html.matchAll(re)) {
      const cls = m[1].trim().split(/\s+/)[0];
      const esc = cls.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const block = css.match(new RegExp('\\.' + esc + '\\s*\\{[^}]*\\}'));
      if (!block) {
        problems.push(`${file}: <${tag} class="${cls}"> has no .${cls} rule - it inherits the site ${tag}'s styling wholesale`);
      } else if (!needed.test(block[0])) {
        problems.push(`${file}: .${cls} does not declare ${why}`);
      }
    }
  }
}

for (const file of fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'))) {
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  if (!html.includes('<footer')) continue;
  if (EXEMPT.has(file)) continue;

  if ((html.match(/<\/footer>/g) || []).length !== 1) {
    problems.push(`${file}: footer is not closed exactly once - the tail is truncated`);
    continue;
  }

  const foot = html.slice(html.indexOf('<footer'), html.indexOf('</footer>'));

  for (const [cls, label] of [['foot-legal', 'legal block'], ['foot-watermark', 'wordmark']]) {
    if (!foot.includes(`class="${cls}"`)) {
      problems.push(`${file}: .${cls} missing - no ${label} in the footer`);
    }
  }
  if (!foot.includes('Company No.')) {
    problems.push(`${file}: no company number in the footer - UK companies must display it`);
  }

  const legalAt = foot.indexOf('<div class="foot-legal">');
  if (legalAt > -1) {
    let depth = 0;
    for (const m of foot.slice(0, legalAt).matchAll(/<div\b[^>]*>|<\/div>/g)) {
      depth += m[0].startsWith('</') ? -1 : 1;
    }
    if (depth !== 0) {
      problems.push(
        `${file}: .foot-legal is nested ${depth} level(s) deep, should be a direct child of <footer>. `
        + `Unclosed divs put it inside the 4-column grid, which is what pushed the wordmark into the corner.`);
    }
  }

  const wmAt = foot.indexOf('foot-watermark');
  if (legalAt > -1 && wmAt > -1 && wmAt < legalAt) {
    problems.push(`${file}: the wordmark comes BEFORE the legal block - the cookie link will sit under it`);
  }

  let bal = 0;
  for (const m of foot.matchAll(/<div\b[^>]*>|<\/div>/g)) bal += m[0].startsWith('</') ? -1 : 1;
  if (bal !== 0) {
    problems.push(`${file}: footer has ${bal} unclosed <div>(s) - the browser will absorb what follows into the grid`);
  }
}

/* ---- standalone pages must define every shared component they use ----
   keepsake-standalone.html does not load shared/styles.css - all its CSS is
   inline, deliberately, because it is also served on its own subdomain. Any
   shared component copied into it therefore has to bring its CSS along.

   The Choose Your Kit button under the comparison table was copied in without
   the .cta component, leaving only a margin rule. With no display:inline-flex
   the label stacked above the arrow square, and with no fill:none the arrow
   path rendered as a solid black triangle inside a default browser button.

   It survived because /memory-catcher/<slug> serves THIS page, not
   our-kit.html, where the same markup is fine. Checking the obvious file found
   nothing wrong. Found 13/08. */
for (const f of fs.readdirSync(ROOT).filter((x) => x.endsWith('.html'))) {
  const html = fs.readFileSync(path.join(ROOT, f), 'utf8');
  if (/<link[^>]+shared\/styles\.css/.test(html)) continue;   // inherits it, fine
  const css = html.replace(/<!--[\s\S]*?-->/g, '');
  if (!/class="[^"]*\bcta\b/.test(css)) continue;

  if (!/(?<![-\w.])\.cta\s*\{[^}]*display\s*:/.test(css)) {
    problems.push(`${f}: uses .cta but does not load shared/styles.css and has no local .cta rule setting display - the label will stack above the arrow`);
  }
  if (!/\.cta\s+\.sq\s+svg\s*\{[^}]*fill\s*:\s*none/.test(css)) {
    problems.push(`${f}: uses .cta but has no local '.cta .sq svg { fill: none }' - the arrow will render as a solid triangle`);
  }
}

if (problems.length) {
  console.error('check-footer: FAILED');
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}

const n = fs.readdirSync(ROOT)
  .filter((f) => f.endsWith('.html') && !EXEMPT.has(f)
    && fs.readFileSync(path.join(ROOT, f), 'utf8').includes('<footer')).length;
console.log(`check-footer: ${n} footers checked - all close cleanly, legal block and wordmark are direct children, wordmark last. Classed headers and footers all declare their own position and background.`);

/* ---- heading tags must open and close at the same level ----
   On 14/08 a bulk change moved footer headings from h4 to h3 to close a
   Lighthouse "skipped heading level" warning. It replaced `<h4>` and `</h4>`,
   but one heading carried a class - `<h4 class="f-h4-gap">` - so only the
   closing tag matched. That left `<h4 class="...">Opening hours</h3>` on the
   affiliate page: malformed HTML that browsers silently recover from, so
   nothing looked wrong and no other check would have caught it.

   Cheap to verify, and the failure mode is invisible, which is exactly the
   combination worth guarding. */
{
  const problems = [];
  for (const f of fs.readdirSync(ROOT).filter((x) => x.endsWith('.html'))) {
    const html = fs.readFileSync(path.join(ROOT, f), 'utf8');
    for (const m of html.matchAll(/<h([1-6])\b[^>]*>(?:(?!<\/h[1-6]>)[\s\S])*?<\/h([1-6])>/g)) {
      if (m[1] !== m[2]) {
        problems.push(`${f}: heading opens <h${m[1]}> and closes </h${m[2]}> - "${m[0].slice(0, 60).replace(/\s+/g, ' ')}"`);
      }
    }
  }
  if (problems.length) {
    console.error('check-footer: FAILED');
    for (const p of problems) console.error('  - ' + p);
    process.exit(1);
  }
  console.log('check-footer: all heading tags open and close at the same level.');
}
