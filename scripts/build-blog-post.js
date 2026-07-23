#!/usr/bin/env node
/*
 * Blog post builder - reference implementation.
 * ---------------------------------------------
 * Fills post-template.html with one post's data (JSON) to produce a static
 * /post/<slug> page. This is the REFERENCE for how Dixit's CMS should render
 * each post: same tokens, same schema output. Not part of the Netlify build.
 *
 * Usage:  node scripts/build-blog-post.js scripts/blog-example-post.json
 * Writes: post-<slug>.html at repo root.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://www.thebespokefoilcompany.co.uk';

// HTML-escape for text nodes / attribute values.
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function faqsHtml(faqs) {
  if (!faqs || !faqs.length) return '';
  return faqs.map(f => `      <div class="faq-item">
        <button class="faq-q" aria-expanded="false">${esc(f.q)}</button>
        <div class="faq-a"><div class="faq-a-inner"><p>${esc(f.a)}</p></div></div>
      </div>`).join('\n');
}

// Fully-generated JSON (JSON.stringify handles all escaping correctly).
function faqsJsonLd(faqs) {
  if (!faqs || !faqs.length) return '{}';
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a }
    }))
  }, null, 2);
}

function blogPostingJsonLd(d) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: d.title,
    description: d.meta_description || '',
    image: d.og_image,
    datePublished: d.published_iso,
    dateModified: d.modified_iso || d.published_iso,
    author: { '@type': 'Person', name: d.author || 'Ashley Eccleston' },
    publisher: {
      '@type': 'Organization',
      name: 'The Bespoke Foil Company',
      logo: { '@type': 'ImageObject', url: SITE + '/assets/bfc-logo.svg' }
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': SITE + '/post/' + d.slug }
  }, null, 2);
}

function tagsHtml(tags) {
  if (!tags || !tags.length) return '';
  return tags.map(t => `        <a class="post-tag" href="/blog">${esc(t)}</a>`).join('\n');
}

function relatedHtml(rel) {
  if (!rel || !rel.length) return '';
  return rel.map(r => `      <a class="pr-card" href="/post/${esc(r.slug)}">
        <img src="${esc(r.image)}" alt="${esc(r.title)}" width="400" height="267" loading="lazy">
        <div class="pr-card-body">
          <div class="pr-meta">${esc(r.meta || '')}</div>
          <h3>${esc(r.title)}</h3>
        </div>
      </a>`).join('\n');
}

function build(jsonPath) {
  const d = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  let html = fs.readFileSync(path.join(ROOT, 'post-template.html'), 'utf8');

  const map = {
    '{{slug}}': esc(d.slug),
    '{{title}}': esc(d.title),
    '{{seo_title}}': esc(d.seo_title || d.title),
    '{{og_title}}': esc(d.og_title || d.seo_title || d.title),
    '{{meta_description}}': esc(d.meta_description || ''),
    '{{og_description}}': esc(d.og_description || d.meta_description || ''),
    '{{author}}': esc(d.author || 'Ashley Eccleston'),
    '{{author_avatar}}': esc(d.author_avatar || '/assets/mc-ashley-500.webp'),
    '{{published_iso}}': esc(d.published_iso),
    '{{modified_iso}}': esc(d.modified_iso || d.published_iso),
    '{{published_display}}': esc(d.published_display),
    '{{read_time}}': String(d.read_time || 5),
    '{{hero_image}}': esc(d.hero_image),
    '{{og_image}}': esc(d.og_image),
    '{{body}}': d.body_html || '',
    '{{final_thoughts}}': d.final_thoughts_html || '',
    '{{faqs_html}}': faqsHtml(d.faqs),
    '{{faqs_jsonld}}': faqsJsonLd(d.faqs),
    '{{blogposting_jsonld}}': blogPostingJsonLd(d),
    '{{tags_html}}': tagsHtml(d.tags),
    '{{related_html}}': relatedHtml(d.related)
  };

  for (const [k, v] of Object.entries(map)) html = html.split(k).join(v);

  const out = path.join(ROOT, `post-${d.slug}.html`);
  fs.writeFileSync(out, html);
  console.log(`Built ${out}`);
  return out;
}

const arg = process.argv[2];
if (!arg) { console.error('Usage: node scripts/build-blog-post.js <post.json>'); process.exit(1); }
build(arg);
