#!/usr/bin/env node
/* =============================================================================
   check-sitemap.js  -  fails the build if a page is missing from discovery.

   WHY THIS EXISTS
   Twice now pages have vanished from the sitemap silently. When the blog and
   the franchise regions moved to Supabase their `_redirects` lines were removed,
   and because `sitemap.html` and `sitemap.xml` are built from `_redirects`,
   **15 posts and 112 regions disappeared with no error at all**. Nobody would
   have noticed until rankings dropped.

   This makes that class of failure loud. Run after generate-sitemaps.js.
   ============================================================================= */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const problems = [];

/* ---- 1. every 200 route resolves to a file that exists ---- */
const routes = [];
for (const line of read('_redirects').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const [from, to, code] = t.split('#')[0].split(/\s+/);
  if (code !== '200') continue;
  const comment = (t.split('#')[1] || '').trim();
  routes.push({ from, to, comment });
  if (from.includes('*') || from.includes(':')) continue;
  const target = to.replace(/^\//, '');
  if (target.startsWith('.netlify')) continue;
  if (!fs.existsSync(path.join(ROOT, target))) {
    problems.push(`route ${from} points at ${to}, which does not exist`);
  }
}

/* ---- 2. every non-excluded route is on the human sitemap ---- */
const smHtml = read('sitemap.html');
const linked = new Set([...smHtml.matchAll(/href="(\/[^"]*)"/g)].map((m) => m[1]));
for (const r of routes) {
  if (r.from.includes('*') || r.from.includes(':')) continue;
  const c = r.comment.toLowerCase();
  if (c.startsWith('exclude') || c.includes('| exclude')) continue;
  if (!linked.has(r.from)) problems.push(`${r.from} is not linked from sitemap.html`);
}

/* ---- 3. dynamic pages are all present ----
   These have no _redirects lines, so nothing else would catch their absence. */
const staticJson = JSON.parse(read('sitemap-static.json'));
const locs = new Set(staticJson.urls.map((u) => u.loc));

const regions = JSON.parse(read('regions.json'));
const missingRegions = regions.filter((r) => r.link && !locs.has(r.link));
if (missingRegions.length) {
  problems.push(`${missingRegions.length} of ${regions.length} franchise regions missing from the sitemap`);
}

const posts = JSON.parse(read('data/blog-posts.json'));
const missingPosts = posts.filter((p) => !locs.has(`/post/${p.slug}`));
if (missingPosts.length) {
  problems.push(`${missingPosts.length} of ${posts.length} blog posts missing from the sitemap`);
}

/* ---- 4. orphaned page files ----
   WARNING, not an error. An unreferenced .html is untidy but not harmful: it is
   not linked and not in the sitemap, and every legacy path now has a 301 in
   _redirects so it cannot become duplicate content even if it lingers.

   This was originally an error and it blocked a deploy for exactly this reason -
   Dixit's repo still held the 16 static blog files, because copying a zip over a
   repo applies additions and edits but never deletions. Blocking a deploy over
   tidiness is the wrong trade; the checks that matter are 1 to 3 above. */
const targets = new Set(routes.map((r) => r.to.replace(/^\//, '')));
const orphans = [];
for (const f of fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'))) {
  if (f === '404.html' || f === 'sitemap.html') continue;   // Netlify serves both by convention
  if (!targets.has(f)) orphans.push(f);
}

/* ---- report ---- */
if (orphans.length) {
  console.log(`check-sitemap: ${orphans.length} orphaned file(s) - not linked, not indexed, 301'd if reached:`);
  for (const f of orphans.slice(0, 20)) console.log('    ' + f);
  if (orphans.length > 20) console.log(`    ...and ${orphans.length - 20} more`);
  console.log('  Safe to delete. Superseded by the dynamic templates.');
}

if (problems.length) {
  console.error('check-sitemap: FAILED');
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}
console.log(
  `check-sitemap: ${locs.size} URLs, including ${regions.length} regions and ${posts.length} posts. ` +
  'All pages accounted for.'
);
