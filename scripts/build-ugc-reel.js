#!/usr/bin/env node
/* =============================================================================
   build-ugc-reel.js  -  renders the UGC reel into every page that carries it.

   ONE SOURCE OF TRUTH: data/ugc-reel.json.

   The reel appears on three pages and was hardcoded into each. Adding a clip
   meant editing three files by hand and hoping they stayed identical - they
   would not have. This regenerates all of them from the data file, so adding
   content is: drop the file in assets, add a line to the JSON, run the build.

   ORDER IS SHUFFLED, DETERMINISTICALLY.
   Ryan wants the order to change whenever new content lands, but NOT to churn
   on every unrelated deploy. The seed is derived from the item list itself, so:
     - same items      -> same order, no diff noise
     - add or remove   -> the whole reel reshuffles
   That is exactly the "scatter and rejig when we upload" behaviour, without the
   page changing every time something unrelated is deployed.

   The track is emitted twice. The marquee animates to -50%, so the second copy
   is what makes the loop seamless - without it the reel visibly snaps back.
   ============================================================================= */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'data/ugc-reel.json');

const data = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const { items } = data;
if (!Array.isArray(items) || !items.length) {
  console.error('build-ugc-reel: data/ugc-reel.json has no items');
  process.exit(1);
}

/* ---- PATHS MUST BE ABSOLUTE ----
   The reel appears on pages served at URLs with more than one path segment:

     /product-page/foil-handprint-footprint-kit-baby-keepsake  -> our-kit.html
     /memory-catcher/<slug>                                    -> keepsake-standalone.html

   A relative `assets/videos/x.mp4` resolves against `/product-page/`, giving
   `/product-page/assets/videos/x.mp4` and a 404. Home is served at `/`, so the
   same path resolves correctly there - which is exactly why this looked like a
   product-page-only fault for so long.

   The video entries were written relative and the image entries absolute, so on
   those two pages the photos loaded and every clip and poster 404'd. Normalised
   here rather than only in the data file, so a hand-added relative path cannot
   reintroduce it. The verification pass below fails the build if one slips
   through. */
const abs = (p) => (typeof p === 'string' && p && !/^(https?:)?\/\//.test(p) && p[0] !== '/')
  ? '/' + p.replace(/^\.\//, '')
  : p;
for (const i of items) {
  i.src = abs(i.src);
  if (i.poster) i.poster = abs(i.poster);
}

/* Seed from the content, so the order is stable until the content changes. */
function seedFrom(list) {
  const s = list.map((i) => i.src).join('|');
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/* mulberry32 - small, fast, and identical across Node versions, which matters:
   Math.random() would reshuffle on every build and fill the diff with noise. */
function rng(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(list) {
  const a = list.slice();
  const r = rng(seedFrom(list));
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;')
  .replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* NOTHING in a tile is fetched on page load.

   `poster` is emitted as `data-poster`, not `poster`. This matters more than it
   looks: `preload="none"` governs video data ONLY. A real `poster` attribute is
   an ordinary image fetch and happens as soon as the element renders, whether or
   not the reel is anywhere near the viewport. With 56 clips that was 865KB of
   posters downloading on every page load for a section most visitors never reach.

   `loading="lazy"` on <video> would also defer the poster natively, but it
   changes preload and autoplay behaviour too, and its interaction with an
   explicit .play() call is not worth the risk when the observer already has to
   exist for the video itself. The observer sets both. */
function tile(item, index) {
  if (item.type === 'video') {
    return '        <div class="ugc-item"><video data-src="' + esc(item.src) +
      '" data-poster="' + esc(item.poster) + '" muted loop playsinline preload="none"></video></div>';
  }
  return '        <div class="ugc-item"><img src="' + esc(item.src) +
    '" loading="lazy" decoding="async" alt="' + esc(item.alt || '') + '"></div>';
}

/* ---- MARQUEE SPEED ----
   The stylesheet hardcodes `animation: ugc-scroll 90s linear infinite`, and the
   animation travels -50% - one full copy of the track. That duration is only
   correct for the item count it was tuned against.

   At 24 items the track was 6,432px, so 90s meant ~71px/s. At 66 items the same
   90s becomes ~197px/s - the reel whips past 2.75x too fast. The duration has to
   scale with the content or every addition silently speeds it up.

   90/24 = 3.75s per item is the original cadence. Emitted as an inline style,
   which beats the stylesheet shorthand on specificity without needing a CSS edit
   in three places (our-kit and keepsake-standalone carry inlined copies).
   `prefers-reduced-motion` still wins: it sets `animation: none`, which clears
   the animation-name, and a duration alone animates nothing. */
const SECONDS_PER_ITEM = 90 / 24;   // set below, once we know what is rendered

/* ---- OPTIONAL RENDER LIMIT ----
   `renderLimit` in data/ugc-reel.json, if set, ships only that many tiles per
   build while keeping the whole library in the pool.

   The reason this is worth having: the marquee moves at ~71px/s. A visitor would
   have to sit on the page for the full 248s cycle to see all 66 tiles, and
   nobody does. So rendering all 66 costs double the DOM and double the <video>
   elements to show the same thing any real visitor actually sees.

   The selection uses the same content-derived seed as the shuffle, so it is
   stable between unrelated deploys and rotates whenever content is added. Over
   a few deploys every clip gets its turn on the page.

   Left unset by default - trimming what visitors see is Ryan's call, not the
   build's. */
const shuffled = shuffle(items);
const limit = Number.isInteger(data.renderLimit) ? data.renderLimit : null;
const ordered = limit && limit > 0 ? shuffled.slice(0, limit) : shuffled;
const track = ordered.map(tile).join('\n');

/* Duration follows what is RENDERED, not the pool - the track is only as wide
   as the tiles actually on the page. */
const scrollSeconds = Math.round(ordered.length * SECONDS_PER_ITEM);

/* Missing assets are fatal. A reel tile pointing at a file that is not there
   renders as a blank box and nobody notices for weeks. */
const missing = ordered
  .flatMap((i) => [i.src, i.poster].filter(Boolean))
  .filter((p) => !fs.existsSync(path.join(ROOT, p.replace(/^\//, ''))));
if (missing.length) {
  console.error('build-ugc-reel: FAILED - assets missing:');
  for (const m of [...new Set(missing)]) console.error('  - ' + m);
  process.exit(1);
}

/* ---- WEIGHT BUDGET ----
   The reel loads fast because every asset was hand-optimised. That only stays
   true if it is enforced: a raw phone clip is 50MB and a straight camera-roll
   photo is 4MB, and either would sail into the JSON unnoticed.

   Tiles render at 248px CSS, so ~500px covers 2x DPR. Budgets are set a little
   above what the current set actually uses, so they catch carelessness without
   failing on a legitimately detailed image.

   Videos WARN rather than fail - a slightly heavy clip is a judgement call, and
   they are lazy-loaded below the fold. Photos and posters FAIL: those are pure
   waste at this render size and there is no reason to ship them. */
const BUDGET = { video: 1400, image: 300, poster: 80 };   // KB
const kb = (p) => fs.statSync(path.join(ROOT, p.replace(/^\//, ''))).size / 1024;

const overFatal = [];
const overWarn = [];
for (const i of ordered) {
  if (i.type === 'video') {
    const w = kb(i.src);
    if (w > BUDGET.video) overWarn.push(`${i.src} is ${w.toFixed(0)}KB (budget ${BUDGET.video}KB)`);
    if (i.poster) {
      const pw = kb(i.poster);
      if (pw > BUDGET.poster) overFatal.push(`${i.poster} is ${pw.toFixed(0)}KB (budget ${BUDGET.poster}KB) - posters display at 248px, resize to ~300px wide`);
    }
  } else {
    const w = kb(i.src);
    if (w > BUDGET.image) overFatal.push(`${i.src} is ${w.toFixed(0)}KB (budget ${BUDGET.image}KB) - tiles display at 248px, 1000px wide is plenty`);
  }
}
if (overWarn.length) {
  console.log('build-ugc-reel: heavier than budget, worth a look:');
  for (const w of overWarn) console.log('  - ' + w);
}
if (overFatal.length) {
  console.error('build-ugc-reel: FAILED - assets over budget:');
  for (const w of overFatal) console.error('  - ' + w);
  console.error('  The reel is below the fold and lazy-loaded, but this is free weight to save.');
  process.exit(1);
}

/* ---- THE POOL ----
   The rendered tiles are a no-JS fallback and a CLS guard. The full pool is
   inlined alongside them and the browser picks a fresh selection on every page
   load.

   Why not just rotate at build time: this is a static site. Any build-time seed,
   time-based or random, only re-evaluates when a deploy runs. Go two months
   without deploying and the same tiles show for two months while the rest of the
   library never appears. Rotation has to happen in the browser or it is not
   rotation.

   Costs nothing to swap: at the point the script runs, every tile carries
   data-src and data-poster and has fetched nothing. Reassigning them is free.

   Both halves of the track get the SAME selection - the marquee animates to
   -50%, so if the two copies differed the loop would visibly jump. */
const poolJson = JSON.stringify(items.map((i) =>
  i.type === 'video' ? ['v', i.src, i.poster] : ['i', i.src, i.alt || '']));

const POOL = '<script type="application/json" data-ugc-pool>' + poolJson
  .replace(/</g, '\\u003c') + '<\/script>';

/* ---- THE OBSERVER ----
   Tiles are NOT observed individually, and this is the important bit.

   The marquee is a compositor-driven `transform` animation. IntersectionObserver
   does not reliably fire for elements moved that way: the compositor holds the
   real position and the main thread keeps a stale one, so intersection is
   computed against where the tile WAS. Documented in Mozilla bug 1419339 and
   fixed in WebKit only in 2024. Animating `left` instead would avoid it, at the
   cost of animating a layout property 60 times a second.

   This was broken from the day the reel shipped. Nobody saw it because `poster`
   was a real attribute, so every tile had an image whether the observer fired or
   not. Deferring the posters removed the mask and the tiles came up empty.

   So: observe the SECTION, which never moves and which IO handles correctly.
   While it is on screen, sweep the tiles on a throttled rAF loop and read their
   real positions with getBoundingClientRect, which forces a style flush and
   therefore always reflects the live animated transform.

   getBoundingClientRect also ignores ancestor clipping, which gets us something
   rootMargin never could: `.ugc-viewport` has `overflow:hidden`, and rootMargin
   only expands the ROOT, not an intermediate clip. Real lead time is only
   possible by doing the geometry directly. */
const OBSERVER = `<script data-ugc-reel>
  /* GENERATED by scripts/build-ugc-reel.js - edit the script, not this. */
  (function () {
    var section = document.querySelector('.ugc');
    var track = section && section.querySelector('.ugc-track');
    if (!track) return;

    /* ---- rotate: fresh selection from the pool on every page load ----
       Nothing has been fetched at this point - every tile carries data-src and
       data-poster - so reassigning them costs no bandwidth. Both halves of the
       track get the same selection, otherwise the -50% marquee loop jumps. */
    var tiles = track.querySelectorAll('.ugc-item');
    var node = document.querySelector('script[data-ugc-pool]');
    if (node && tiles.length) {
      try {
        var pool = JSON.parse(node.textContent);
        var half = tiles.length / 2;
        if (pool.length > half && half === Math.floor(half)) {
          var bag = pool.slice();
          for (var i = bag.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = bag[i]; bag[i] = bag[j]; bag[j] = t;
          }
          var pick = bag.slice(0, half);
          for (var k = 0; k < tiles.length; k++) {
            var it = pick[k % half];
            tiles[k].innerHTML = it[0] === 'v'
              ? '<video data-src="' + it[1] + '" data-poster="' + it[2] +
                '" muted loop playsinline preload="none"></video>'
              : '<img src="' + it[1] + '" loading="lazy" decoding="async" alt="' +
                it[2] + '">';
          }
        }
      } catch (e) { /* keep the tiles the build rendered */ }
    }

    var vids = track.querySelectorAll('.ugc-item video');
    if (!vids.length) return;

    function poster(v) {
      if (v.dataset.poster) { v.poster = v.dataset.poster; delete v.dataset.poster; }
    }

    /* No IntersectionObserver: show every poster rather than a wall of blanks. */
    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(vids, poster);
      return;
    }

    var conn = navigator.connection || {};
    var frugal = conn.saveData === true || /(^|-)2g$/.test(conn.effectiveType || '');
    /* Guarded: if matchMedia is unavailable this would throw and take the whole
       observer with it, leaving every tile a bare coloured box. */
    var narrow = false;
    try { narrow = window.matchMedia('(max-width:600px)').matches; } catch (e) { }
    var cap = narrow ? 4 : 8;

    var POSTER_MARGIN = 600;   // lead time, in px either side of the viewport
    var playing = [];

    function stop(v) {
      var i = playing.indexOf(v);
      if (i > -1) playing.splice(i, 1);
      v.pause();
    }
    function start(v) {
      if (playing.indexOf(v) > -1) return;
      while (playing.length >= cap) stop(playing[0]);
      if (v.dataset.src) { v.src = v.dataset.src; delete v.dataset.src; }
      playing.push(v);
      v.play().catch(function () { });
    }

    /* One sweep: read every rect first, then act. Reading and writing in the
       same pass would thrash layout once per tile. */
    function sweep() {
      var w = window.innerWidth || document.documentElement.clientWidth;
      var rects = [];
      for (var i = 0; i < vids.length; i++) rects.push(vids[i].getBoundingClientRect());
      for (var j = 0; j < vids.length; j++) {
        var r = rects[j], v = vids[j];
        if (r.right > -POSTER_MARGIN && r.left < w + POSTER_MARGIN) poster(v);
        if (frugal) continue;
        if (r.right > 0 && r.left < w && r.bottom > 0) start(v);
        else stop(v);
      }
    }

    /* Throttled rAF. rAF rather than setInterval so it pauses in a background
       tab; throttled because the tiles do not need checking 60 times a second. */
    var live = false, last = 0;
    function frame(now) {
      if (!live) return;
      if (now - last >= 150) { last = now; sweep(); }
      requestAnimationFrame(frame);
    }

    /* The SECTION is static, so IO is reliable here in a way it is not on the
       tiles themselves. */
    new IntersectionObserver(function (entries) {
      var on = entries[0] && entries[0].isIntersecting;
      if (on && !live) { live = true; last = 0; requestAnimationFrame(frame); }
      else if (!on && live) {
        live = false;
        while (playing.length) stop(playing[0]);
      }
    }, { root: null, rootMargin: '200px', threshold: 0 }).observe(section);
  })();
<\/script>`;

/* ---- HEADING AND LEDE ----
   These were hand-written into three pages and were identical in all three,
   which is luck rather than design - the tiles and the observer are generated
   for exactly this reason. Moved into the data file so a copy change is one
   line, not three edits and a diff check.

   The gallery CTA is deliberately NOT touched. `home` has one, the two product
   pages do not, and that difference is intentional. */
const headingText = typeof data.heading === 'string' ? data.heading : null;
const ledeText = typeof data.lede === 'string' ? data.lede : null;

/* `{braces}` in the heading mark a handwritten accent. Escaped FIRST, then the
   braces are converted, so the copy still cannot inject markup - braces are not
   characters esc() touches. The span uses var(--script), which is
   "Nothing You Could Do" and is defined on all three pages. */
const renderHeading = (s) =>
  esc(s).replace(/\{([^}]+)\}/g, '<span class="ugc-accent">$1</span>');

function writeSectionHead(html) {
  const sec = html.indexOf('<section class="ugc">');
  if (sec === -1) return html;
  const stop = html.indexOf('<div class="ugc-viewport"', sec);
  if (stop === -1) return html;
  let head = html.slice(sec, stop);

  /* Test that the PATTERN MATCHED, not that the text changed. A second build
     legitimately produces no change because the copy is already correct - an
     "it did not change" guard would fail every run after the first. The failure
     we actually care about is the tag not being there at all. */
  const H2 = /(<h2[^>]*>)[\s\S]*?(<\/h2>)/;
  const LEDE = /(<p class="lede"[^>]*>)[\s\S]*?(<\/p>)/;

  if (headingText !== null) {
    if (!H2.test(head)) return null;
    head = head.replace(H2, '$1' + renderHeading(headingText) + '$2');
  }
  if (ledeText !== null) {
    if (!LEDE.test(head)) return null;
    head = head.replace(LEDE, '$1' + esc(ledeText) + '$2');
  }
  return html.slice(0, sec) + head + html.slice(stop);
}

/* Rewrite the track in every page that has the section. The surrounding markup -
   heading, lede, and the gallery CTA where it exists - is left alone, so the
   product pages keep their no-CTA variant. */
let touched = 0;
for (const file of fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'))) {
  const p = path.join(ROOT, file);
  let html = fs.readFileSync(p, 'utf8');
  /* Match the opening tag WITHOUT its '>' - the build writes a style attribute
     onto it, so an exact '<div class="ugc-track">' match would find nothing on
     the second run and silently skip the page. */
  const open = html.indexOf('<div class="ugc-track"');
  if (open === -1) continue;
  const openEnd = html.indexOf('>', open) + 1;
  const opener = '<div class="ugc-track" style="animation-duration:' + scrollSeconds + 's">';
  html = html.slice(0, open) + opener + html.slice(openEnd);

  const start = open + opener.length;
  /* find the track's own closing tag by counting */
  let depth = 1, close = -1;
  const re = /<div\b|<\/div>/g;
  re.lastIndex = start;
  let m;
  while ((m = re.exec(html))) {
    depth += m[0] === '</div>' ? -1 : 1;
    if (depth === 0) { close = m.index; break; }
  }
  if (close === -1) { console.error(`build-ugc-reel: could not parse the track in ${file}`); process.exit(1); }
  html = html.slice(0, start) + '\n' + track + '\n' + track + '\n      ' + html.slice(close);

  /* The observer was hand-copied into all three pages. Now that it carries real
     logic - two thresholds, a play cap, a Save-Data path - three copies would
     drift for exactly the reasons the tiles already get generated. */
  const marker = '<script type="application/json" data-ugc-pool>';
  let sOpen = html.indexOf(marker);
  let sClose;
  if (sOpen !== -1) {
    /* pool + observer are written as one block; skip past both */
    sClose = html.indexOf('<\/script>', html.indexOf('<script data-ugc-reel>', sOpen)) + '<\/script>'.length;
  } else {
    /* first run: find the legacy hand-written block by its distinctive line */
    const anchor = html.indexOf("querySelectorAll('.ugc-item video')");
    if (anchor === -1) { console.error(`build-ugc-reel: no reel script in ${file}`); process.exit(1); }
    sOpen = html.lastIndexOf('<script', anchor);
    sClose = html.indexOf('<\/script>', anchor) + '<\/script>'.length;
  }
  html = html.slice(0, sOpen) + POOL + "\n" + OBSERVER + html.slice(sClose);

  const withHead = writeSectionHead(html);
  if (withHead === null) {
    console.error(`build-ugc-reel: FAILED - could not find the h2 or lede in ${file}`);
    process.exit(1);
  }
  html = withHead;

  fs.writeFileSync(p, html);
  touched++;
}

/* ---- verify, do not report ----
   Three bugs have shipped on this project because a replace silently matched
   nothing and the script printed success anyway. Read every page back. */
for (const file of fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'))) {
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  if (!html.includes('<div class="ugc-track"')) continue;
  const problems = [];
  if (!html.includes('animation-duration:' + scrollSeconds + 's')) problems.push('scroll duration not written');
  if (!html.includes('<script data-ugc-reel>')) problems.push('observer not written');
  if (!html.includes('data-ugc-pool')) problems.push('pool not written');
  if (headingText !== null && !html.includes('>' + renderHeading(headingText) + '</h2>')) {
    problems.push('heading not written');
  }
  /* Every reel path must be absolute or it 404s on the two nested-URL pages.
     Scoped to the tile markup and the pool: the observer's own source contains
     `data-src="' + it[1] + '"` as a string literal, which is not a path. */
  const tilesFrom = html.indexOf('<div class="ugc-track"');
  const tilesTo = html.indexOf('<script type="application/json" data-ugc-pool>');
  if (tilesFrom > -1 && tilesTo > tilesFrom) {
    const rel = html.slice(tilesFrom, tilesTo)
      .match(/data-(?:src|poster)="(?!\/|https?:\/\/|\/\/)[^"]*"/g) || [];
    if (rel.length) {
      problems.push(`${rel.length} relative tile path(s), e.g. ${rel[0]} - these 404 at /product-page/<slug>`);
    }
  }
  if (ledeText !== null && !html.includes('>' + esc(ledeText) + '</p>')) {
    problems.push('lede not written');
  }
  const pm = html.match(/<script type="application\/json" data-ugc-pool>(.*?)<\/script>/s);
  if (!pm) problems.push('pool block unparseable');
  else {
    try {
      const p = JSON.parse(pm[1].replace(/\\u003c/g, '<'));
      if (p.length !== items.length) problems.push(`pool has ${p.length} entries, expected ${items.length}`);
    } catch (e) { problems.push('pool is not valid JSON: ' + e.message); }
  }
  if (pm) {
    try {
      const badPool = JSON.parse(pm[1].replace(/\\u003c/g, '<'))
        /* ['v', src, poster] but ['i', src, ALT TEXT] - only index 2 of a video
           entry is a path. Checking e.slice(1) blindly flags alt copy. */
        .flatMap((e) => (e[0] === 'v' ? [e[1], e[2]] : [e[1]]))
        .filter((v) => typeof v === 'string' && v && !/^(\/|https?:\/\/|\/\/)/.test(v));
      if (badPool.length) {
        problems.push(`${badPool.length} relative path(s) in the pool, e.g. ${badPool[0]}`);
      }
    } catch (e) { /* already reported above */ }
  }
  if (html.includes(' poster="')) problems.push('a real poster attribute survived - it will fetch on page load');
  const tiles = (html.match(/class="ugc-item"/g) || []).length;
  if (tiles !== ordered.length * 2) problems.push(`${tiles} tiles, expected ${ordered.length * 2}`);
  if (problems.length) {
    console.error(`build-ugc-reel: FAILED verification on ${file}:`);
    for (const p of problems) console.error('  - ' + p);
    process.exit(1);
  }
}

console.log(
  `build-ugc-reel: ${ordered.length}` +
  (limit ? ` of ${items.length}` : '') + ` items ` +
  `(${ordered.filter((i) => i.type === 'video').length} video, ` +
  `${ordered.filter((i) => i.type === 'image').length} image) ` +
  `written to ${touched} page(s). ` +
  `Scroll ${scrollSeconds}s. Zero bytes fetched until scrolled to. ` +
  `Seed ${seedFrom(items)}.`
);
