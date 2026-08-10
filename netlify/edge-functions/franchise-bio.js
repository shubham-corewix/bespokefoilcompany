// netlify/edge-functions/franchise-bio.js
//
// Serves /franchises-bio/<slug> from Supabase at request time.
// Incomplete profiles (no bio_lead / bio_about / bio_offer) show a coming-soon
// panel and only render fields that exist in the database.

const SITE = 'https://www.thebespokefoilcompany.co.uk';

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function asCoverage(v) {
  if (Array.isArray(v)) return v.map((s) => String(s).trim()).filter(Boolean);
  if (v == null || v === '') return [];
  return String(v).split(',').map((s) => s.trim()).filter(Boolean);
}

/* Plain text -> <p> blocks; HTML passes through unchanged. */
function bodyHtml(v) {
  if (!v) return '';
  const t = String(v).trim();
  if (!t) return '';
  if (t.startsWith('<')) return t;
  return t.split(/\n\s*\n/).map((block) => {
    const p = block.trim();
    return p ? `<p>${esc(p)}</p>` : '';
  }).join('\n');
}

function hasText(v) {
  return Boolean(String(v ?? '').trim());
}

async function lookupFranchisee(slug) {
  const url = Netlify.env.get('SUPABASE_URL');
  const key = Netlify.env.get('SUPABASE_ANON_KEY');
  if (!url || !key) {
    console.log('[franchise-bio] SUPABASE_URL or SUPABASE_ANON_KEY missing');
    return null;
  }
  try {
    const res = await fetch(
      `${url}/rest/v1/franchisees?slug=eq.${encodeURIComponent(slug)}&active=eq.true&select=*&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    );
    if (!res.ok) { console.log('[franchise-bio] lookup ->', res.status); return null; }
    const rows = await res.json();
    return rows[0] || null;
  } catch (e) {
    console.log('[franchise-bio] lookup failed:', e.message);
    return null;
  }
}

function socialLinks(f) {
  const links = [];
  if (f.facebook_url) {
    links.push(`<a href="${esc(f.facebook_url)}" target="_blank" rel="noopener" aria-label="Facebook"><svg viewBox="0 0 24 24"><path d="M14 9h3V6h-3c-2 0-3 1-3 3v2H9v3h2v6h3v-6h2.5l.5-3H14v-1.5c0-.6.2-1 .9-1z"/></svg></a>`);
  }
  if (f.instagram_url) {
    links.push(`<a href="${esc(f.instagram_url)}" target="_blank" rel="noopener" aria-label="Instagram"><svg viewBox="0 0 24 24"><path d="M12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zm0 1.8a1.7 1.7 0 110 3.4 1.7 1.7 0 010-3.4zM16.5 7a.9.9 0 100 1.8.9.9 0 000-1.8zM7.5 4.5h9A3 3 0 0119.5 7.5v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9a3 3 0 013-3zm0 1.8a1.2 1.2 0 00-1.2 1.2v9a1.2 1.2 0 001.2 1.2h9a1.2 1.2 0 001.2-1.2v-9a1.2 1.2 0 00-1.2-1.2z"/></svg></a>`);
  }
  if (!links.length) return '';
  return `<div class="bio-social">${links.join('')}</div>`;
}

function contactActions(f) {
  const btns = [];
  if (f.whatsapp) {
    const wa = String(f.whatsapp).replace(/\D/g, '');
    if (wa) {
      btns.push(`<a class="cta dark" href="https://wa.me/${esc(wa)}" target="_blank" rel="noopener">
        <span class="lbl">Send Me a Message</span>
        <span class="sq"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24a8.2 8.2 0 0 1 5.83 2.42 8.19 8.19 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.53.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.41.09-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.42l-.47-.01c-.16 0-.43.06-.65.31-.23.24-.86.84-.86 2.05s.88 2.38 1 2.54c.13.17 1.74 2.65 4.2 3.72.59.25 1.04.4 1.4.52.59.18 1.12.16 1.55.1.47-.07 1.46-.6 1.67-1.18.2-.57.2-1.07.14-1.17-.06-.11-.22-.17-.47-.29Z"/></svg></span>
      </a>`);
    }
  }
  if (f.email) {
    btns.push(`<a class="cta ghost" href="mailto:${esc(f.email)}">
        <span class="lbl">Email Me</span>
        <span class="sq"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4z"/><path d="m4 7 8 6 8-6"/></svg></span>
      </a>`);
  }
  if (!btns.length) return '';
  return `<div class="bio-actions">${btns.join('')}</div>`;
}

const HEART_ICON = `<span class="ic"><svg viewBox="0 0 24 24"><path d="M12 21s-6.5-4.35-9-8.5C1.5 9.5 3 6 6.5 6 9 6 12 9 12 9s3-3 5.5-3C21 6 22.5 9.5 21 12.5 18.5 16.65 12 21 12 21z"/></svg></span>`;
const GIFT_ICON = `<span class="ic"><svg viewBox="0 0 24 24"><path d="M20 12v9H4v-9"/><path d="M2 7h20v5H2z"/><path d="M12 21V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg></span>`;
const PIN_ICON = `<span class="ic"><svg viewBox="0 0 24 24"><path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg></span>`;

function aboutSection(f) {
  const lead = hasText(f.bio_lead) ? `<p class="bio-lead">${esc(f.bio_lead)}</p>` : '';
  const about = bodyHtml(f.bio_about);
  if (!lead && !about) return '';
  return `<section>
        <div class="bio-head">
          ${HEART_ICON}
          <h2>Your Local Baby Memory Catcher</h2>
        </div>
        ${lead}
        ${about}
      </section>`;
}

function offerSection(f) {
  const offer = bodyHtml(f.bio_offer);
  if (!offer) return '';
  return `<section>
        <div class="bio-head">
          ${GIFT_ICON}
          <h2>What I Offer</h2>
        </div>
        ${offer}
      </section>`;
}

function areasSection(f, covering, fullName, region) {
  const tags = covering.map((t) => `<span class="bio-tag">${esc(t)}</span>`).join('\n            ');
  const map = f.map_region_slug ? (
    `<div class="bio-map">
          <iframe src="/memory-catcher-region-map-embed?region=${esc(f.map_region_slug)}"
            title="${esc(fullName + "'s Memory Catcher area - " + region)}" loading="lazy"></iframe>
        </div>`
  ) : '';
  if (!tags && !map) return '';
  const panel = tags ? `<div class="bio-areas-panel">
          <p class="cap"><svg viewBox="0 0 24 24"><path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>I'm your local Memory Catcher covering:</p>
          <div class="bio-tags">
            ${tags}
          </div>
        </div>` : '';
  const foot = (tags && (f.whatsapp || f.email))
    ? `<p>Not sure if I cover your area? Drop me a message and I'll point you in the right direction.</p>`
    : '';
  return `<section>
        <div class="bio-head">
          ${PIN_ICON}
          <h2>Areas I Cover</h2>
        </div>
        ${panel}
        ${foot}
        ${map}
      </section>`;
}

function comingSoonSection(fullName) {
  const who = fullName ? esc(fullName) : 'This Memory Catcher';
  return `<section class="bio-coming-soon">
        <div class="bio-head">
          ${HEART_ICON}
          <h2>Profile coming soon</h2>
        </div>
        <p>${who} is joining The Bespoke Foil Company family. Their full story and session details will be here shortly. In the meantime, you can <a href="/contact">get in touch</a>, browse <a href="/find-a-memory-catcher">other Memory Catchers</a>, or <a href="/product-page/foil-handprint-footprint-kit-baby-keepsake">order a kit</a> to capture prints at home.</p>
      </section>`;
}

function joinSection(f) {
  if (!hasText(f.join_blurb)) return '';
  return `<section class="bio-join">
    <div class="bio-join-inner">
      <div class="bio-join-copy">
        <h2>Interested in joining our Memory Catcher Franchise?</h2>
        <p>${esc(f.join_blurb)}</p>
        <a class="cta" href="/franchise-region">
          <span class="lbl">View Regions</span>
          <span class="sq"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
        </a>
      </div>
      <div class="bio-join-media">
        <img src="/assets/img-458-1000-v2.webp" srcset="/assets/img-458-700-v2.webp 700w, /assets/img-458-1000-v2.webp 1000w" sizes="(min-width:920px) 50vw, 100vw" width="1000" height="714" loading="lazy" alt="Memory Catcher franchise opportunity">
      </div>
    </div>
  </section>`;
}

function buildBioSections(f, covering, fullName, region) {
  const hasAbout = hasText(f.bio_lead) || hasText(f.bio_about);
  const hasOffer = hasText(f.bio_offer);
  const parts = [];

  if (hasAbout) parts.push(aboutSection(f));
  if (hasOffer) parts.push(offerSection(f));
  parts.push(areasSection(f, covering, fullName, region));
  if (!hasAbout && !hasOffer) parts.push(comingSoonSection(fullName));

  return parts.filter(Boolean).join('\n\n      ');
}

export default async (request, context) => {
  const slug = new URL(request.url).pathname.split('/').filter(Boolean).pop() || '';

  if (!/^[a-z0-9-]{1,60}$/.test(slug)) return notFound(context);

  const f = await lookupFranchisee(slug);
  if (!f) return notFound(context);

  const res = await context.next();
  let html = await res.text();

  const fullName = f.full_name || f.name || '';
  const region = f.full_address || f.territory || '';
  const covering = asCoverage(f.covering);
  const canonical = `${SITE}/franchises-bio/${f.slug}`;
  const founderNote = f.founder ? 'founder ' : '';
  const photo = f.photo || '/assets/mc-who-1100.webp';

  const title = f.meta_title ||
    (region
      ? `${fullName}: Baby Memory Catcher in ${region}`
      : `${fullName}: Memory Catcher`);
  const desc = f.meta_description ||
    (region
      ? `Meet ${fullName}, your local baby Memory Catcher in ${region}. Capturing baby hand & footprints for lasting memories.`
      : `Meet ${fullName}, your local Memory Catcher with The Bespoke Foil Company.`);

  const tagline = f.tagline || f.sort_description || '';
  const taglineHtml = tagline
    ? `<p class="bio-tagline">${esc(tagline)}</p>`
    : '';
  const regionHtml = region
    ? `<p class="bio-region">Region: <b>${esc(region)}</b></p>`
    : '';

  const map = {
    slug: esc(f.slug),
    full_name: esc(fullName),
    photo: esc(photo),
    photo_alt: esc(`${fullName}, ${founderNote}Memory Catcher`.replace(/\s+/g, ' ').trim()),
    seo_title: esc(title),
    meta_description: esc(desc),
    tagline_html: taglineHtml,
    region_html: regionHtml,
    social_links: socialLinks(f),
    contact_actions: contactActions(f),
    bio_sections: buildBioSections(f, covering, fullName, region),
    join_section: joinSection(f),
  };

  html = html.replace(/\{\{([a-z_]+)\}\}/g, (_, k) => (k in map ? map[k] : ''));

  html = html.replace('</head>',
    `  <meta property="og:type" content="website">\n` +
    `  <meta property="og:title" content="${esc(title)}">\n` +
    `  <meta property="og:description" content="${esc(desc)}">\n` +
    `  <meta property="og:url" content="${esc(canonical)}">\n` +
    `  <meta property="og:image" content="${esc(photo.startsWith('http') ? photo : SITE + photo)}">\n` +
    `  <meta property="og:site_name" content="The Bespoke Foil Company">\n` +
    `  <meta name="twitter:card" content="summary_large_image">\n` +
    `</head>`);

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=60',
    },
  });
};

async function notFound(context) {
  const nf = await context.rewrite('/404.html');
  return new Response(await nf.text(),
    { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } });
}
