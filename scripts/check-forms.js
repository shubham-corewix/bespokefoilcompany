#!/usr/bin/env node
/* =============================================================================
   CHECK-FORMS

   Every form on this site was broken in one of two ways, and neither showed up
   in any existing check.

   THE LEAK. A <form> with no `method` defaults to GET. With no `action` it
   submits to its own URL. So if the JS handler is missing - or simply fails to
   attach - the browser appends every field to the address bar as a query
   string. That is not merely untidy: it puts names, emails, phone numbers and
   in one case full postal addresses into browser history, into the server
   access log, into the Referer header of the next outbound request, and into
   GA4, whose `page_location` captures the whole URL. Personal data reaching a
   third-party analytics product with no consent and no intent.

   `slot-reservation-form` and `memory-catcher-enquiry` were doing exactly this.

   THE STUB. `contact.html` shipped a handler whose entire body was two alert()
   calls, one of them reading "Design preview". It prevented the default, so it
   never leaked - it just silently discarded every enquiry.

   So this checks BOTH: that a form cannot leak to the URL, and that it actually
   sends somewhere.
   ============================================================================= */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

/* Phrases that mean a handler exists but does nothing real. */
const STUBS = [/Design preview/i, /would be sent here/i, /production wires to/i,
               /coming soon/i, /not yet (?:wired|connected)/i];

/* ---- every lightbox trigger must have its lightbox ----
   `our-kit.html` and `home.html` shipped with the inc-foil and inc-framed
   <dialog> blocks deleted and a single orphan </dialog> left behind after
   </footer>. The triggers stayed, so two of the three "What's included" links
   did nothing: `getElementById('inc-foil')` returned null and showModal() threw
   on a null. Premium worked, which is what made it look like a mystery rather
   than a missing block. keepsake-standalone.html was untouched, which is why
   the identical code worked there.

   Nothing caught it because every existing check looked at forms, links,
   footers or analytics. A trigger pointing at an element that does not exist is
   none of those. Added 11/08 after Ryan found it by clicking.

   Also counts <dialog> against </dialog>: the orphan closing tag is what a
   deletion leaves behind, and it is the cheapest possible tell. */
{
  const problems = [];
  for (const f of fs.readdirSync(ROOT).filter((x) => x.endsWith('.html'))) {
    const html = fs.readFileSync(path.join(ROOT, f), 'utf8');
    const live = html.replace(/<!--[\s\S]*?-->/g, '');

    const opens = (live.match(/<dialog\b/g) || []).length;
    const closes = (live.match(/<\/dialog>/g) || []).length;
    if (opens !== closes) {
      problems.push(`${f}: ${opens} <dialog> vs ${closes} </dialog> - an orphan closing tag usually means a dialog block was deleted and its trigger left behind`);
    }

    for (const m of live.matchAll(/data-inc="([a-z0-9-]+)"/g)) {
      const id = 'inc-' + m[1];
      if (!new RegExp(`<dialog[^>]*id="${id}"`).test(live)) {
        problems.push(`${f}: a "What's included" trigger points at #${id}, which does not exist on the page - the link will do nothing`);
      }
    }
  }
  if (problems.length) {
    console.error('check-forms: FAILED');
    for (const p of problems) console.error('  - ' + p);
    process.exit(1);
  }
}

const problems = [];

for (const file of fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'))) {
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  /* Strip BOTH comment styles BEFORE looking for forms. The first version stripped only
     HTML comments, so it flagged contact.html on the strength of the JS comment
     written to explain that the stub had been REMOVED. Seventh time this week a
     check has matched the note describing the thing it was looking for. */
  const code = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  /* Scan the stripped source. The first version scanned the raw HTML, so a
     comment reading "this page has no <form> at all" was itself detected as a
     form - a check finding the thing it was written to say was absent. */
  const forms = code.match(/<form\b[^>]*>/g);
  if (!forms) continue;

  for (const tag of forms) {
    /* GET is the default. Without an explicit POST, a failed handler puts every
       field in the URL. */
    if (!/\bmethod\s*=\s*["']post["']/i.test(tag)) {
      problems.push(`${file}: <form> has no method="post" - if the JS handler fails, the browser GETs every field into the URL, and from there into logs and GA4`);
    }
  }

  /* A form with no handler at all is either a leak or a black hole. */
  if (!/preventDefault\s*\(/.test(code)) {
    problems.push(`${file}: has a <form> but no preventDefault() anywhere - nothing is intercepting the submit`);
  }

  /* And it has to actually go somewhere. */
  const sends = /fetch\s*\(\s*["'`]\/(?:\.netlify\/functions\/|upload-portal-)/.test(code)
             || /data-endpoint\s*=/.test(code);
  if (!sends) {
    problems.push(`${file}: no submit endpoint found - the form does not post anywhere`);
  }

  for (const re of STUBS) {
    const m = code.match(re);
    if (m) {
      problems.push(`${file}: looks like a placeholder handler ("${m[0]}") - enquiries would be discarded`);
      break;
    }
  }
}

/* ---- SUBMIT-LIKE CONTROLS THAT ARE NOT IN A <form> ----
   The checks above only inspect <form> elements. The community sign-up on the
   home page is a bare <input type="email"> beside a <button> - no form at all -
   and it shipped as an alert() stub that this script walked straight past.
   Dixit found it by reading the page; the guard did not, because it was looking
   for the wrong shape.

   So: any email input paired with a button, outside a form, must have a real
   endpoint somewhere on the page. */
for (const file of fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'))) {
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const code = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  /* strip anything already inside a <form> - those are covered above */
  /* franchisee-login.html is exempt from the SIGN-UP rules: an email field beside
     a button there is a login, not a newsletter capture, so "no endpoint" is not
     the right complaint. Its real problem - that authentication is not built and
     the button says "Login coming soon" - is tracked in GO-LIVE-RUNBOOK.md, not
     hidden behind a build exemption. */
  if (file === 'franchisee-login.html') continue;

  const outside = code.replace(/<form\b[\s\S]*?<\/form>/g, '');
  if (!/<input[^>]+type="email"/.test(outside)) continue;
  if (!/<button/.test(outside)) continue;

  /* The community sign-up is handled by shared/community-signup.js, so the
     fetch lives in that file rather than in the page. Accept either. */
  const sends = /fetch\s*\(\s*["'`]\/(?:\.netlify\/functions\/|upload-portal-)/.test(code)
             || /shared\/community-signup\.js/.test(code);
  if (!sends) {
    problems.push(`${file}: an email input and button sit outside any <form> with no endpoint - a sign-up that goes nowhere`);
  }
  /* And the block must actually be wired, not merely present. */
  if (/id="communityJoin"/.test(html) && !/shared\/community-signup\.js/.test(html)) {
    problems.push(`${file}: carries the community sign-up but not shared/community-signup.js - the Join button will do nothing`);
  }
  for (const re of STUBS) {
    if (re.test(outside)) {
      problems.push(`${file}: placeholder wording beside a form-less email capture - it is a stub`);
      break;
    }
  }
}

if (problems.length) {
  console.error('check-forms: FAILED');
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}

const n = fs.readdirSync(ROOT)
  .filter((f) => f.endsWith('.html') && /<form\b/.test(fs.readFileSync(path.join(ROOT, f), 'utf8'))).length;
console.log(`check-forms: ${n} page(s) with forms - all POST, all intercepted, all reach an endpoint.`);

/* ---- every "What's included" trigger needs its dialog ----
   The handler is `document.getElementById('inc-' + m.dataset.inc).showModal()`.
   If the dialog is missing that is a TypeError on null: the link does nothing,
   no message, nothing in the UI to suggest anything is wrong. our-kit.html and
   home.html both shipped triggers for foil and framed with only inc-premium
   present, so two of the three kits had a dead "What's included" link and the
   third worked - which is exactly the shape of bug that survives testing,
   because whoever checks clicks one and moves on. Found 11/08.

   Also checks <dialog> tags balance. Both pages carried an orphan </dialog>
   after </footer>, which browsers silently discard. */
/* ---- every submit-lead caller must declare its formType ----
   submit-lead.js routes on `formType`: it picks the subject line, the email
   template, the Supabase table and whether a Meta Lead event fires at all.
   A form that does not send one falls through to the franchise branch, which
   is how contact form messages spent months arriving titled "New Memory
   Catcher franchise enquiry" from customers in the town of "contact form".

   The fallback in resolveForm() still catches those, so this is not fatal at
   runtime - which is exactly why it needs a build check. A silent misroute
   that still returns 200 will never be noticed. Found 11/08. */
{
  const problems = [];
  const VALID = ['franchise', 'mc-enquiry', 'contact', 'slot', 'community'];
  const files = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'))
    .map((f) => [f, path.join(ROOT, f)])
    .concat(fs.existsSync(path.join(ROOT, 'shared'))
      ? fs.readdirSync(path.join(ROOT, 'shared')).filter((f) => f.endsWith('.js'))
        .map((f) => ['shared/' + f, path.join(ROOT, 'shared', f)])
      : []);

  for (const [name, fp] of files) {
    const code = fs.readFileSync(fp, 'utf8');
    if (!/functions\/submit-lead/.test(code)) continue;
    const m = code.match(/formType:\s*'([a-z-]+)'/);
    if (!m) {
      problems.push(`${name}: posts to submit-lead but sends no formType - it will be treated as a franchise enquiry`);
    } else if (!VALID.includes(m[1])) {
      problems.push(`${name}: formType '${m[1]}' is not in the FORMS registry in submit-lead.js`);
    }
  }
  if (problems.length) {
    console.error('check-forms: FAILED');
    for (const p of problems) console.error('  - ' + p);
    process.exit(1);
  }
}

/* ---- the burger must actually open something ----
   The nav toggle is copied into all 31 pages rather than living in a shared
   file. home.html - the single most important page on the site - shipped the
   burger markup with NO handler, so the menu button did nothing there while
   working everywhere else. Nothing caught it because the markup was present
   and correct; only the wiring was missing, and a button that does nothing
   throws no error. Found by Ryan, 12/08.

   Checks both directions: markup without a handler, and a handler with no
   markup to act on. Moving this into shared/nav.js would make the guard
   unnecessary - post-launch work. */
{
  const problems = [];
  for (const f of fs.readdirSync(ROOT).filter((x) => x.endsWith('.html'))) {
    const html = fs.readFileSync(path.join(ROOT, f), 'utf8');
    const live = html.replace(/<!--[\s\S]*?-->/g, '');

    const hasBurger = /class="burger"/.test(live);
    const hasMenu = /id="navMenu"/.test(live);
    const wired = /burger\s*\.\s*addEventListener/.test(live);

    if (hasBurger && !wired) {
      problems.push(`${f}: has <button class="burger"> but no click handler - the menu button does nothing`);
    }
    if (hasBurger && !hasMenu) {
      problems.push(`${f}: has a burger but no <nav id="navMenu"> for it to open`);
    }
    if (wired && !hasMenu) {
      problems.push(`${f}: wires the burger but has no <nav id="navMenu"> - the handler will bail silently`);
    }
  }
  if (problems.length) {
    console.error('check-forms: FAILED');
    for (const p of problems) console.error('  - ' + p);
    process.exit(1);
  }
}

/* ---- every serverless function must at least parse ----
   Nothing in this build chain has ever looked at functions/ or
   netlify/edge-functions/. A typo in a handler is invisible until it is
   deployed and a real customer trips it - and these are the files that take
   payments, raise Zendesk tickets and record leads, so "it failed in
   production" means a lost order rather than a broken layout.

   This is a syntax check, not a test: it proves the file parses, not that it
   works. Cheap enough to be worth having anyway. Added 12/08 alongside the
   upload-portal thank-you and WhatsApp automation.

   functions/ are CommonJS (Node) and edge-functions are ESM (Deno), so each
   is checked with the right parser - checking an ESM file as a script reports
   a false failure on its first import. */
{
  const { execFileSync } = require('child_process');
  const problems = [];
  const dirs = [
    ['functions', false],
    [path.join('netlify', 'edge-functions'), true],
  ];

  for (const [rel, isModule] of dirs) {
    const dir = path.join(ROOT, rel);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.js'))) {
      const full = path.join(dir, f);
      const code = fs.readFileSync(full, 'utf8');
      /* Trust the file's own syntax over the folder convention: a CommonJS
         helper that lands in the edge folder should still be checked as one. */
      const esm = /^\s*(import|export)\s/m.test(code) || isModule;
      try {
        if (esm) {
          execFileSync(process.execPath, ['--input-type=module', '--check'],
            { input: code, stdio: ['pipe', 'ignore', 'pipe'] });
        } else {
          execFileSync(process.execPath, ['--check', full], { stdio: ['ignore', 'ignore', 'pipe'] });
        }
      } catch (e) {
        const detail = (e.stderr ? e.stderr.toString() : e.message).split('\n')
          .filter(Boolean).slice(0, 3).join(' | ');
        problems.push(`${rel}/${f}: does not parse as ${esm ? 'ESM' : 'CommonJS'} - ${detail}`);
      }
    }
  }
  if (problems.length) {
    console.error('check-forms: FAILED');
    for (const p of problems) console.error('  - ' + p);
    process.exit(1);
  }
}

{
  const problems = [];
  for (const f of fs.readdirSync(ROOT).filter((x) => x.endsWith('.html'))) {
    const html = fs.readFileSync(path.join(ROOT, f), 'utf8');
    const live = html.replace(/<!--[\s\S]*?-->/g, '');

    const open = (live.match(/<dialog[\s>]/g) || []).length;
    const close = (live.match(/<\/dialog>/g) || []).length;
    if (open !== close) {
      problems.push(`${f}: ${open} <dialog> vs ${close} </dialog> - an unmatched tag the browser will silently discard`);
    }

    for (const m of live.matchAll(/data-inc="([a-z0-9-]+)"/g)) {
      if (!new RegExp(`<dialog[^>]*id="inc-${m[1]}"`).test(live)) {
        problems.push(`${f}: data-inc="${m[1]}" has no <dialog id="inc-${m[1]}"> - that "What's included" link throws on null and does nothing`);
      }
    }
  }
  if (problems.length) {
    console.error('check-forms: FAILED');
    for (const p of problems) console.error('  - ' + p);
    process.exit(1);
  }
}


/* ---- inputs must never compute below 16px ----
   iOS Safari zooms the entire page when a focused input, textarea or select is
   smaller than 16px. On a long mobile form it throws the layout around
   mid-entry; in the bottom-anchored checkout drawer it pushed the panel off
   screen and exposed the page behind it. Reported live on 13/08, and it turned
   out to affect twelve rules across the site including the newsletter sign-up
   on 25 pages and the whole upload portal form.

   Labels, help text and buttons are exempt: only focusable text controls get
   the zoom treatment. */
{
  const problems = [];
  const EXEMPT = new Set(['component-library.html', 'snag-tool.html']);
  const files = ['shared/styles.css']
    .concat(fs.readdirSync(ROOT).filter((f) => f.endsWith('.html') && !EXEMPT.has(f)));

  for (const name of files) {
    const full = path.join(ROOT, name);
    if (!fs.existsSync(full)) continue;
    const css = fs.readFileSync(full, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const m of css.matchAll(/([^{}]*)\{([^}]*)\}/g)) {
      const sel = m[1].trim();
      const low = sel.toLowerCase();
      if (!/input|textarea|select/.test(low) || low.includes('label')) continue;
      const f = m[2].match(/font-size:\s*([\d.]+)(px|rem)/);
      if (!f) continue;
      const px = parseFloat(f[1]) * (f[2] === 'rem' ? 16 : 1);
      if (px < 16) {
        problems.push(`${name}: "${sel.replace(/\s+/g, ' ').slice(0, 44)}" sets ${f[0]} - iOS will zoom the page when it is focused`);
      }
    }
  }

  if (problems.length) {
    console.error('check-forms: FAILED');
    for (const p of problems.slice(0, 10)) console.error('  - ' + p);
    process.exit(1);
  }
}

/* ============================================================================
   THE ADD-ONS APP
   ----------------------------------------------------------------------------
   addons/index.html is a separate Netlify deployment, so every guard above -
   which reads only the repo root - has never touched it. That is the app taking
   the upsell revenue, and it has been checked by hand until now (Ryan, 13/08).

   Checked here rather than in a script of its own so it cannot be forgotten:
   the same command that gates the main site gates this too.

   Only the rules that genuinely apply to a standalone app. It deliberately uses
   RELATIVE asset paths, because it is served both at its own subdomain root and
   under /add-ons-exclusive-discount-938476 on the main site, so the absolute-URL
   rule enforced on main-site pages must NOT be applied here.
   ========================================================================== */
{
  const problems = [];
  const app = path.join(ROOT, 'addons', 'index.html');

  if (!fs.existsSync(app)) {
    problems.push('addons/index.html is missing - three main-site routes rewrite to it');
  } else {
    const html = fs.readFileSync(app, 'utf8');
    const live = html.replace(/<!--[\s\S]*?-->/g, '');

    /* 1. iOS zoom. Same rule as the main site: a focused control under 16px
          makes Safari zoom the page. On a checkout that is a lost sale. */
    for (const m of live.matchAll(/([^{}]*)\{([^}]*)\}/g)) {
      const sel = m[1].trim(); const low = sel.toLowerCase();
      if (!/input|textarea|select/.test(low) || low.includes('label')) continue;
      const f = m[2].match(/font-size:\s*([\d.]+)(px|rem)/);
      if (!f) continue;
      if (parseFloat(f[1]) * (f[2] === 'rem' ? 16 : 1) < 16) {
        problems.push(`addons/index.html: "${sel.replace(/\s+/g, ' ').slice(0, 40)}" sets ${f[0]} - iOS will zoom the page on focus`);
      }
    }

    /* 2. Social preview. Absolute, on www, JPEG, and the file must exist -
          a 404 behind an og:image is indistinguishable from having none. */
    const og = [...live.matchAll(/<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["']/gi)].map((x) => x[1]);
    if (og.length !== 1) {
      problems.push(`addons/index.html: ${og.length} og:image tags - shared links need exactly one`);
    } else {
      if (!/^https:\/\/www\.thebespokefoilcompany\.co\.uk\//.test(og[0])) {
        problems.push(`addons/index.html: og:image must be an absolute www URL, got ${og[0]}`);
      } else {
        const rel = og[0].replace('https://www.thebespokefoilcompany.co.uk/', '');
        if (!fs.existsSync(path.join(ROOT, rel))) {
          problems.push(`addons/index.html: og:image ${rel} is not on disk`);
        }
      }
      if (!/\.jpe?g(\?|$)/i.test(og[0])) {
        problems.push('addons/index.html: og:image should be JPEG - WhatsApp previews do not reliably render WebP');
      }
    }

    /* 3. No hand-drawn Apple Pay button. Real wallet buttons come from
          Stripe's Express Checkout Element; the mark on anything else
          misleads the customer and breaches Apple's guidelines. */
    for (const m of live.matchAll(/<button[^>]*>/g)) {
      if (/\bapple\b/i.test(m[0]) || /apple[ -]?pay/i.test(m[0])) {
        problems.push(`addons/index.html: ${m[0].slice(0, 60)} - a hand-drawn Apple Pay button`);
      }
    }

    /* 4. Relative asset paths must actually resolve inside addons/. Ten
          images and the analytics script 404'd on the live site because the
          app was served at a main-site URL; the fallback rules in _redirects
          fix the serving, but a genuinely missing file is still a bug. */
    const refs = new Set();
    for (const m of live.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
      if (/^\/?assets\//.test(m[1])) refs.add(m[1].replace(/^\//, ''));
    }
    for (const m of live.matchAll(/srcset=["']([^"']+)["']/g)) {
      for (const part of m[1].split(',')) {
        const u = part.trim().split(/\s+/)[0];
        if (/^\/?assets\//.test(u)) refs.add(u.replace(/^\//, ''));
      }
    }
    for (const r of refs) {
      if (!fs.existsSync(path.join(ROOT, 'addons', r))) {
        problems.push(`addons/index.html: references ${r}, which is not in addons/`);
      }
    }

    /* 5. Every endpoint it calls must exist in the root functions directory,
          which is what serves it on the main domain. */
    for (const m of live.matchAll(/\/\.netlify\/functions\/([a-z0-9-]+)/g)) {
      if (!fs.existsSync(path.join(ROOT, 'functions', m[1] + '.js'))) {
        problems.push(`addons/index.html: calls /.netlify/functions/${m[1]}, which does not exist`);
      }
    }
  }

  if (problems.length) {
    console.error('check-forms: FAILED');
    for (const p of problems.slice(0, 10)) console.error('  - ' + p);
    process.exit(1);
  }
  console.log('check-forms: add-ons app checked - inputs, og:image, wallet marks, assets, endpoints.');
}

/* ---- the SKU maps must agree ----
   The browser sends a SKU string and create-payment-intent looks it up in a
   hardcoded CATALOGUE. If the two ever drift, that kit simply cannot be bought:
   the function returns "Unknown SKU" and the drawer shows "checkout could not
   start". Nothing else would catch it, because every other kit still works.
   Added 14/08 during the pre-deploy audit. */
{
  const problems = [];
  const fnSrc = fs.readFileSync(path.join(ROOT, 'functions', 'create-payment-intent.js'), 'utf8');
  const cat = fnSrc.match(/const CATALOGUE\s*=\s*\{[\s\S]*?\n\};/);
  const known = cat ? new Set([...cat[0].matchAll(/'([A-Z0-9-]+)'\s*:/g)].map((m) => m[1])) : new Set();
  if (!known.size) problems.push('create-payment-intent.js: could not read CATALOGUE');

  const senders = ['shared/checkout.js', 'keepsake-standalone.html', 'our-kit.html', 'home.html'];
  for (const f of senders) {
    const p = path.join(ROOT, f);
    if (!fs.existsSync(p)) continue;
    const src = fs.readFileSync(p, 'utf8');
    const map = src.match(/(?:const|var)\s+SKU\s*=\s*\{[^}]*\}/);
    if (!map) continue;
    for (const m of map[0].matchAll(/'(BFC-[A-Z0-9-]+)'/g)) {
      if (!known.has(m[1])) {
        problems.push(`${f}: sends SKU ${m[1]}, which create-payment-intent does not recognise - that kit cannot be bought`);
      }
    }
  }
  if (problems.length) {
    console.error('check-forms: FAILED');
    for (const p of problems) console.error('  - ' + p);
    process.exit(1);
  }
  console.log(`check-forms: SKU maps agree across ${senders.length} sender(s) and the server catalogue.`);
}

/* ---- NOT guarded here: undefined identifiers in functions/ ----
   On 14/08 the live logs showed "orderNumber is not defined" on every order in
   stripe-webhook.js, with a second one, `subtotal`, hidden behind it. Both were
   inside a non-blocking catch, so payments and ShipStation orders were fine and
   the only casualty was the customer's receipt - the failure nobody notices
   from the inside. `node --check` cannot see either: an undefined identifier is
   a runtime error, not a syntax error.

   A static check for this was written and then REMOVED. It flagged `auth`,
   `ssOrder` and `orderNumber` in addons-stripe-webhook.js, all three of which
   are plainly declared with `const` a few lines above their use. Tracking every
   binding form in JavaScript by regex is not something to half-do, and a guard
   that cries wolf is worse than none: it teaches everyone to ignore a red
   build.

   The reliable tool is ESLint's no-undef rule, which needs a dependency in the
   build. Worth adding when the site is not mid-incident. Until then the
   protection is executing each webhook against a stubbed transport, which is
   what actually found both of these. */
