#!/usr/bin/env node
/* =============================================================================
   BFC SEO / STRUCTURED DATA GENERATOR

   Three jobs, all driven off _redirects so nothing can drift from routing:

     1. rel=canonical on every page that has a public 200 route
     2. Product schema on the product page (and its affiliate twin)
     3. Organization schema on home, with sameAs

   WHY CANONICALS COME FIRST
   25 of 38 pages had none, home included. That is not a cosmetic gap: the only
   structured data on the site was sitting on keepsake-standalone.html, which
   canonicals itself to the product page. The schema was on the one page telling
   crawlers to index a different URL. Canonicals and schema have to be generated
   from the same source or that keeps happening.

   NO AggregateRating. DELIBERATE.
   Ryan's call, 06/08. Google's guidance is not to aggregate ratings from other
   websites, and the 4.9/72 originates on Trustpilot rather than being collected
   here. The reviews ARE displayed on the page, which is the mitigating factor,
   but "grey area" is not a good enough reason to put a rating in structured
   data. The Product entity, offers and brand are entirely clean and carry real
   weight with AI answer engines on their own.

   If that decision is ever revisited, add aggregateRating here and read the
   figures from shared/trustpilot.js - do NOT hardcode them.
   ============================================================================= */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://www.thebespokefoilcompany.co.uk';

/* ---- routes: the single source of truth ---- */
const routes = new Map();                       // file -> public path
for (const line of fs.readFileSync(path.join(ROOT, '_redirects'), 'utf8').split('\n')) {
  const p = line.split('#')[0].trim().split(/\s+/);
  if (p.length < 3 || p[2] !== '200') continue;
  if (p[0].includes('*') || p[0].includes(':')) continue;
  const file = p[1].replace(/^\//, '');
  if (!routes.has(file)) routes.set(file, p[0]);   // first wins: the canonical one
}

/* Pages with a route but which must not be indexed or canonicalised - internal
   tools, embeds and form fragments. They are excluded from the sitemap already;
   giving them a canonical would invite indexing. */
const NOINDEX = new Set([
  'component-library.html', 'snag-tool.html', 'franchise-region.html',
  'memory-catcher-region-map-embed.html', 'upload-portal-form.html',
  'slot-reservation-form.html', 'gallery-upload.html', 'sitemap.html',
]);

/* ---- Product schema ----
   One product, described once, written to both pages that show it. `url` is the
   canonical address, NOT /our-kit - that is a 301 and pointing schema at a
   redirect is how the old block ended up contradicting its own page. */
const PRODUCT_URL = SITE + '/product-page/foil-handprint-footprint-kit-baby-keepsake';

const product = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Foil Hand & Footprint Kit',
  description: 'Everything you need to capture tiny handprints, footprints and '
    + 'milestones. Baby-safe inkless wipes, reactive paper, and a personalised foil '
    + 'keepsake crafted with Foil Fusion Technology\u2122.',
  image: SITE + '/assets/og-image.jpg',
  url: PRODUCT_URL,
  brand: { '@type': 'Brand', name: 'The Bespoke Foil Company' },
  offers: {
    '@type': 'AggregateOffer',
    priceCurrency: 'GBP',
    lowPrice: '34.95',
    highPrice: '59.95',
    availability: 'https://schema.org/InStock',
    url: PRODUCT_URL,
  },
};

/* ---- Organization schema ----
   sameAs is the policy-safe way to attach off-site reputation to the brand. It
   claims no rating and asks for no stars; it tells search engines and answer
   engines that this site and those profiles are one entity, so a 4.9 found on
   Trustpilot is understood to be about THIS company. */
const organization = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': SITE + '/#organization',
  name: 'The Bespoke Foil Company',
  legalName: 'The Bespoke Foil Company Ltd',
  url: SITE + '/',
  logo: SITE + '/assets/og-image.jpg',
  description: 'Family-run British maker of baby foil handprint and footprint '
    + 'keepsake kits, and home of the Memory Catcher\u2122 Franchise.',
  foundingDate: '2017',
  areaServed: 'GB',
  /* Taken from the live site's own footer on 07/08 rather than guessed. A
     company number, VAT ID and real address are what separate a verifiable
     business entity from a name in a JSON blob, and they matter more to answer
     engines than to Google. */
  taxID: 'GB419408687',
  vatID: 'GB419408687',
  identifier: { '@type': 'PropertyValue', name: 'Company number', value: '12941845' },
  address: {
    '@type': 'PostalAddress',
    streetAddress: '2nd Floor, Pier House, Wallgate',
    addressLocality: 'Wigan',
    postalCode: 'WN3 4AL',
    addressCountry: 'GB',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    telephone: '+44 7506 998934',
    email: 'hello@thebespokefoilcompany.co.uk',
    areaServed: 'GB',
    availableLanguage: 'English',
  },
  sameAs: [
    'https://uk.trustpilot.com/review/thebespokefoilcompany.co.uk',
    'https://www.instagram.com/thebespokefoilco/',
    'https://www.facebook.com/TheBespokeFoilCompany',
    'https://www.youtube.com/@bespokefoilcompany',
    /* The Etsy shop is the single biggest piece of off-site reputation:
       4.9 from 2,224 reviews and 13,054 sales since 2018. sameAs is what
       tells search and answer engines that shop and this site are one
       entity, so that history counts towards the brand instead of
       floating unattached. Verified live 08/08/2026. */
    'https://www.etsy.com/shop/BespokeFoilCompany',
  ],
};

const SCHEMA_PAGES = {
  'our-kit.html': product,
  'keepsake-standalone.html': product,
  'home.html': organization,
};

const tag = (obj) =>
  '<script type="application/ld+json" data-bfc-schema>\n'
  + JSON.stringify(obj, null, 1).replace(/</g, '\\u003c')
  + '\n</script>';

const CANON = /<link rel="canonical"[^>]*>/;
const SCHEMA = /<script type="application\/ld\+json" data-bfc-schema>[\s\S]*?<\/script>/;

let canonicals = 0, schemas = 0;

for (const file of fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'))) {
  const p = path.join(ROOT, file);
  let html = fs.readFileSync(p, 'utf8');
  const before = html;

  /* ---- 1. canonical ---- */
  const route = routes.get(file);
  if (route && !NOINDEX.has(file)) {
    const href = SITE + (route === '/' ? '/' : route);
    const link = `<link rel="canonical" href="${href}">`;
    if (CANON.test(html)) {
      html = html.replace(CANON, link);
    } else {
      /* after <title> if there is one, else straight after <head> */
      const t = html.indexOf('</title>');
      const at = t > -1 ? t + '</title>'.length : html.indexOf('>', html.indexOf('<head')) + 1;
      html = html.slice(0, at) + '\n  ' + link + html.slice(at);
    }
    canonicals++;
  }

  /* ---- 2/3. schema ---- */
  const obj = SCHEMA_PAGES[file];
  if (obj) {
    /* Strip ANY legacy ld+json on a page we manage before writing ours.
       Without this the affiliate page ended up with two Product blocks - the new
       clean one plus the original, still carrying aggregateRating and a url
       pointing at the /our-kit redirect. Two contradictory Products on one page
       is worse than the problem this script was written to fix.
       Template placeholders ({{...}}) are left alone - post-template.html fills
       those per post. */
    html = html.replace(
      /[ \t]*<script type="application\/ld\+json"(?![^>]*data-bfc-schema)[^>]*>([\s\S]*?)<\/script>\n?/g,
      (m, body) => (body.includes('{{') ? m : '')
    );

    const block = tag(obj);
    if (SCHEMA.test(html)) {
      html = html.replace(SCHEMA, block);
    } else {
      const close = html.indexOf('</head>');
      if (close === -1) { console.error(`build-seo: no </head> in ${file}`); process.exit(1); }
      html = html.slice(0, close) + '  ' + block + '\n' + html.slice(close);
    }
    schemas++;
  }

  if (html !== before) fs.writeFileSync(p, html);
}

/* ---- verify, do not report ---- */
const problems = [];
for (const file of fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'))) {
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const route = routes.get(file);
  const canons = html.match(/<link rel="canonical"[^>]*>/g) || [];

  if (route && !NOINDEX.has(file)) {
    if (canons.length !== 1) {
      problems.push(`${file}: ${canons.length} canonical tags, expected exactly 1`);
    } else {
      const href = canons[0].match(/href="([^"]*)"/)[1];
      const want = SITE + (route === '/' ? '/' : route);
      if (href !== want) problems.push(`${file}: canonical ${href}, expected ${want}`);
      /* a canonical must not point at something _redirects 301s away */
      for (const line of fs.readFileSync(path.join(ROOT, '_redirects'), 'utf8').split('\n')) {
        const q = line.split('#')[0].trim().split(/\s+/);
        if (q.length >= 3 && q[2] === '301' && SITE + q[0] === href) {
          problems.push(`${file}: canonical points at ${q[0]}, which _redirects 301s to ${q[1]}`);
        }
      }
    }
  }

  const obj = SCHEMA_PAGES[file];
  if (obj) {
    /* Check the WHOLE PAGE, not just our own block. The first version of this
       verified only the block it had written and passed while a second, stale
       Product schema sat further up the same page. */
    const all = html.match(/<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/g) || [];
    if (all.length !== 1) {
      problems.push(`${file}: ${all.length} ld+json blocks, expected exactly 1`);
    }
    if (/aggregateRating/.test(html)) {
      problems.push(`${file}: aggregateRating appears somewhere on the page - removed deliberately on 06/08, see the header of this script`);
    }
    if (html.includes(`"url": "${SITE}/our-kit"`)) {
      problems.push(`${file}: schema url points at /our-kit, which _redirects 301s away`);
    }

    const m = html.match(/<script type="application\/ld\+json" data-bfc-schema>([\s\S]*?)<\/script>/);
    if (!m) { problems.push(`${file}: schema block missing`); continue; }
    let parsed;
    try { parsed = JSON.parse(m[1].replace(/\\u003c/g, '<')); }
    catch (e) { problems.push(`${file}: schema is not valid JSON - ${e.message}`); continue; }

    if (parsed['@type'] !== obj['@type']) problems.push(`${file}: schema @type is ${parsed['@type']}`);
    /* schema url must be the page's own canonical, never a redirect */
    if (parsed['@type'] === 'Product' && parsed.url !== PRODUCT_URL) {
      problems.push(`${file}: product url is ${parsed.url}, expected the canonical ${PRODUCT_URL}`);
    }
    if (parsed['@type'] === 'Organization' && !(parsed.sameAs || []).some((u) => u.includes('trustpilot'))) {
      problems.push(`${file}: Organization sameAs has no Trustpilot profile - that is the whole point of it`);
    }
  }
}

if (problems.length) {
  console.error('build-seo: FAILED');
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}

console.log(
  `build-seo: ${canonicals} canonical(s) from _redirects, ${schemas} schema block(s) `
  + `(Product x2, Organization x1). No aggregateRating - deliberate.`
);
