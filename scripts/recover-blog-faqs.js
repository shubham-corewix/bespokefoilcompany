#!/usr/bin/env node
/* =============================================================================
   RECOVER FAQs AND FINAL THOUGHTS FROM THE LIVE WIX BLOG

   WHAT WENT WRONG
   On Wix, "FAQs" and "Final Thoughts" are not structured fields - they are just
   `<h2>` headings inside the post body, with `<h3>` questions beneath. The new
   template has proper structured fields for both (`faqs[]` feeding an accordion
   AND FAQPage schema, plus `final_thoughts`), which is the better design.

   The migration cut those sections OUT of the body - correctly - and then never
   populated the structured fields. So the content is simply gone: the body stops
   early, the FAQ accordion is empty, and Final Thoughts does not render at all.

   Verified on why-every-parent-needs-a-baby-footprint-keepsake, where the live
   post carries four Q&As and three closing paragraphs that the new site does not
   show. Every post on this blog follows the same shape, so assume all 15.

   WHAT THIS DOES
   Fetches each live post, finds the FAQs and Final Thoughts sections in the
   body, and writes `blog-faq-recovery.json` - one object per slug, ready to load
   into the Supabase `posts` table.

   It does NOT write to Supabase. Deliberately: this is a content restore on live
   rows, so a human should read the output before it goes anywhere near the
   database.

     node scripts/recover-blog-faqs.js
     node scripts/recover-blog-faqs.js --old https://www.thebespokefoilcompany.co.uk

   Needs Node 18+ and outbound access to the live site. Run it BEFORE the Wix
   account closes - after that the content is unrecoverable.
   ============================================================================= */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OLD = (process.argv.includes('--old')
  ? process.argv[process.argv.indexOf('--old') + 1]
  : 'https://www.thebespokefoilcompany.co.uk').replace(/\/$/, '');
const OUT = path.join(ROOT, 'blog-faq-recovery.json');
const DELAY_MS = 300;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* Wix wraps everything in divs, so work from the heading tags rather than trying
   to understand the layout. Strip tags to text but keep paragraph breaks. */
const stripTags = (html) => html
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<\/(p|div|li)>/gi, '\n')
  .replace(/<li[^>]*>/gi, '- ')
  .replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&#39;|&rsquo;|&#8217;/g, "'")
  .replace(/&quot;|&ldquo;|&rdquo;/g, '"')
  .replace(/&hellip;/g, '...')
  .replace(/\n{3,}/g, '\n\n')
  .split('\n').map((l) => l.trim()).filter(Boolean).join('\n');

/* Everything from a heading whose text matches `label`, up to the next heading
   of the same or higher level. */
function sectionAfter(html, label, level = 2) {
  const re = new RegExp(
    `<h${level}[^>]*>\\s*(?:<[^>]+>\\s*)*${label}\\s*(?:</[^>]+>\\s*)*</h${level}>`, 'i');
  const m = re.exec(html);
  if (!m) return null;
  const rest = html.slice(m.index + m[0].length);
  const stop = new RegExp(`<h[1-${level}][^>]*>`, 'i').exec(rest);
  return stop ? rest.slice(0, stop.index) : rest;
}

function extractFaqs(html) {
  const block = sectionAfter(html, 'FAQ[s\u2019\']?', 2);
  if (!block) return [];
  const out = [];
  const q = /<h3[^>]*>([\s\S]*?)<\/h3>/gi;
  let m, prev = null;
  while ((m = q.exec(block))) {
    if (prev) out.push({ q: prev.q, at: prev.at, end: m.index });
    prev = { q: stripTags(m[1]), at: q.lastIndex };
  }
  if (prev) out.push({ q: prev.q, at: prev.at, end: block.length });
  return out
    .map((x) => ({ q: x.q, a: stripTags(block.slice(x.at, x.end)) }))
    .filter((x) => x.q && x.a);
}

(async () => {
  const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'blog-posts.json'), 'utf8'));
  const posts = Array.isArray(index) ? index : (index.posts || index.items || []);
  const results = [];
  let i = 0;

  for (const post of posts) {
    i++;
    const slug = post.slug;
    process.stderr.write(`\r${i}/${posts.length} ${slug.slice(0, 40).padEnd(40)}`);
    try {
      const r = await fetch(`${OLD}/post/${slug}`);
      if (!r.ok) { results.push({ slug, error: `HTTP ${r.status}` }); await sleep(DELAY_MS); continue; }
      const html = await r.text();

      const faqs = extractFaqs(html);
      const ftBlock = sectionAfter(html, 'Final Thoughts', 2);
      const final_thoughts = ftBlock
        ? stripTags(ftBlock).split('\n').filter(Boolean)
            .map((para) => `<p>${para}</p>`).join('\n')
        : '';

      results.push({ slug, faqs, final_thoughts,
                     faq_count: faqs.length,
                     final_thoughts_words: final_thoughts ? stripTags(final_thoughts).split(/\s+/).length : 0 });
    } catch (e) {
      results.push({ slug, error: e.message });
    }
    await sleep(DELAY_MS);
  }
  process.stderr.write('\n');

  fs.writeFileSync(OUT, JSON.stringify(results, null, 1));

  const withFaqs = results.filter((r) => r.faq_count > 0);
  const withFt = results.filter((r) => r.final_thoughts_words > 0);
  const failed = results.filter((r) => r.error);
  const empty = results.filter((r) => !r.error && !r.faq_count && !r.final_thoughts_words);

  console.log(`recover-blog-faqs: ${results.length} post(s) checked against ${OLD}`);
  console.log(`  ${withFaqs.length} with FAQs (${withFaqs.reduce((n, r) => n + r.faq_count, 0)} Q&As total)`);
  console.log(`  ${withFt.length} with Final Thoughts`);
  if (empty.length) console.log(`  ${empty.length} with neither - check by hand: ${empty.map((r) => r.slug).join(', ')}`);
  if (failed.length) {
    console.log(`  ${failed.length} FAILED:`);
    for (const f of failed) console.log(`    ${f.slug} - ${f.error}`);
  }
  console.log(`\n  written to blog-faq-recovery.json`);
  console.log(`  READ IT before loading. Each entry maps to the Supabase posts row:`);
  console.log(`    faqs            -> jsonb  [{q, a}, ...]`);
  console.log(`    final_thoughts  -> text   (HTML paragraphs)`);
})();
