/* =============================================================================
   TRUSTPILOT FIGURES - SINGLE SOURCE OF TRUTH

   Edit the two numbers below and every page updates. Nothing else to change.

   WHY THIS FILE EXISTS
   The score and review count were hardcoded into the markup of 46 pages. When
   the count moved from 65 to 72 that was 98 separate edits, and the schema on
   the product page drifted out of step with what the pages actually said -
   which matters, because Google requires structured data to match the visible
   content and a mismatch is a manual-action risk.

   WHY IT IS NOT FULLY AUTOMATIC
   Three ways to pull live figures, and only one of them is free:

     1. Trustpilot's own TrustBox widget. Free, renders live, updates itself
        forever. The catch is it renders THEIR design, not ours. Worth using
        where the exact look does not matter.
     2. Trustpilot Business API. Keeps our design AND updates automatically,
        but it is a paid add-on.
     3. Scraping the public profile at build time. Does not work: Trustpilot
        blocks automated requests with bot detection, and cached search results
        lag by weeks. Tested, rejected.

   So this stays a manual number, but a manual number in ONE place.
   ============================================================================= */
(function () {
  'use strict';

  /* ---- EDIT THESE, NOTHING ELSE ---- */
  var SCORE = '4.9';
  var COUNT = '72';
  var CHECKED = '2026-07-31';   // when these were last verified against Trustpilot

  /* Etsy lives here too, for the same reason Trustpilot does: the figures now
     appear in the announce bar AND the footer, built by two different scripts.
     Held in one place they cannot drift apart. Verified against the live shop
     page 08/08/2026 - 4.9 from 2,224 reviews, 13,054 sales, on Etsy since 2018.

     ETSY_COUNT is written "over 2,000" on purpose. It stays true as the number
     grows, so nobody has to remember to update it and it cannot quietly become
     an unsubstantiated claim. */
  var ETSY_SCORE = '4.9';
  var ETSY_COUNT = 'over 2,000';
  var ETSY_CHECKED = '2026-08-08';
  /* The year matters more than the count. "72 reviews" looks thin next to
     established competitors; "since 2018" tells a reader the 72 is a new
     Trustpilot profile, not a new business. */
  var ETSY_SINCE = '2018';
  /* ----------------------------------- */

  var PROFILE = 'https://uk.trustpilot.com/review/thebespokefoilcompany.co.uk';

  function fill() {
    document.querySelectorAll('[data-tp-score]').forEach(function (el) { el.textContent = SCORE; });
    document.querySelectorAll('[data-tp-count]').forEach(function (el) { el.textContent = COUNT; });
    document.querySelectorAll('[data-etsy-score]').forEach(function (el) { el.textContent = ETSY_SCORE; });
    document.querySelectorAll('[data-etsy-count]').forEach(function (el) { el.textContent = ETSY_COUNT; });
    document.querySelectorAll('[data-etsy-since]').forEach(function (el) { el.textContent = ETSY_SINCE; });

    /* Any JSON-LD aggregateRating on the page is rewritten from the same two
       values, so the schema can never drift from what a visitor is reading. */
    document.querySelectorAll('script[type="application/ld+json"]').forEach(function (node) {
      if (node.textContent.indexOf('aggregateRating') === -1) return;
      try {
        var data = JSON.parse(node.textContent);
        var touched = false;
        (function walk(o) {
          if (!o || typeof o !== 'object') return;
          if (o['@type'] === 'AggregateRating') {
            o.ratingValue = SCORE;
            o.reviewCount = COUNT;
            touched = true;
          }
          Object.keys(o).forEach(function (k) { walk(o[k]); });
        })(data);
        if (touched) node.textContent = JSON.stringify(data);
      } catch (e) { /* malformed JSON-LD, leave it alone */ }
    });
  }

  /* Exposed so the figures can be checked from the console, and so a build
     script can read them if the paid API is ever wired up. */
  window.bfcTrustpilot = { score: SCORE, count: COUNT, checked: CHECKED, profile: PROFILE };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fill);
  } else {
    fill();
  }
})();
