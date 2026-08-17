/* =============================================================================
   BFC ANALYTICS + CONSENT
   Loaded from the <head> of every page. See README "Analytics" for the rule.

   WHY THIS IS A SHARED FILE AND NOT AN INLINE SNIPPET
   The site is 50 hand-maintained static pages with no templating. An inline
   gtag block would mean 50 copies of the measurement ID to keep in step. One
   file means one place to change it, and scripts/check-analytics.js can then
   verify every page actually carries the tag.

   WHY CONSENT MODE RATHER THAN A PLAIN GTAG SNIPPET
   A banner that appears AFTER analytics has already fired is decorative. Google
   Consent Mode v2 sets analytics_storage to 'denied' BEFORE the GA library
   loads, so no analytics cookie is written until the visitor agrees. gtag still
   loads and sends cookieless pings, so you keep basic modelled traffic data
   either way, and full measurement once consent is given.
   ============================================================================= */
(function () {
  'use strict';

  var GA_ID = 'G-L1J1KR2VZZ';
  var CLARITY_ID = 'y2mf2erlcy';   // Microsoft Clarity, added 15/08
  var STORE = 'bfc-consent';
  var VERSION = 1;              // bump to re-ask everyone after a policy change

  /* ---------- consent state ---------- */
  function read() {
    try {
      var raw = localStorage.getItem(STORE);
      if (!raw) return null;
      var v = JSON.parse(raw);
      return v && v.version === VERSION ? v : null;
    } catch (e) { return null; }
  }
  function write(granted) {
    try {
      localStorage.setItem(STORE, JSON.stringify({
        version: VERSION, analytics: granted, at: new Date().toISOString()
      }));
    } catch (e) { /* private browsing, fall through */ }
  }

  var saved = read();

  /* ---------- gtag bootstrap ---------- */
  window.dataLayer = window.dataLayer || [];
  /* window.dataLayer explicitly, not the bare global. Google's own snippet
     relies on window properties being global, which holds in a browser but
     breaks under any stricter scope and cannot be tested outside one. */
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  /* Default DENIED. This must run before the GA library loads. */
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    functionality_storage: 'granted',
    security_storage: 'granted',
    wait_for_update: 500
  });

  if (saved && saved.analytics) {
    gtag('consent', 'update', { analytics_storage: 'granted' });
  }

  gtag('js', new Date());
  gtag('config', GA_ID);

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);

  /* ---------- Microsoft Clarity ----------
     Session recording and heatmaps. Lives here rather than pasted into 40 pages
     for the same reason gtag does: one measurement id to keep in step.

     CONSENT. Clarity has its own setting for this, in the dashboard under
     Settings -> Cookie consent. The code below works with EITHER position, so
     the choice stays Ryan's and needs no redeploy:

       OFF            Clarity sets cookies from page load, like the Meta Pixel
                      does today. The banner copy already covers it - "we use
                      cookies to see how the site is used".
       ON             No cookies until consentv2 says granted. A denial is not
                      silence: Clarity drops to no-consent mode, sets nothing,
                      and treats every page view as a new visitor.

     Note this is enforced for us regardless. Since 31 October 2025 Microsoft
     applies consent automatically to EEA, UK and Swiss traffic, which is
     effectively all of ours - so the signal below matters whichever way the
     dashboard toggle is set.

     Worth saying plainly: this is a step beyond a pixel. Clarity replays what a
     visitor did - movement, clicks, scrolling. It masks text input by default,
     so card and address fields are not captured, but it is still a recording of
     a real person using the site. If any tracking here should require consent
     first, this is the one, and turning it on is a dashboard toggle. */
  (function loadClarity() {
    if (window.clarity) return;                       // already on the page
    window.clarity = window.clarity || function () {
      (window.clarity.q = window.clarity.q || []).push(arguments);
    };
    var c = document.createElement('script');
    c.async = true;                                   // never blocks render
    c.src = 'https://www.clarity.ms/tag/' + CLARITY_ID;
    document.head.appendChild(c);

    /* consentv2, not the older consent() call.
       ------------------------------------------------------------------
       Microsoft deprecated the v1 API; v2 is the current one and takes an
       explicit state for each storage type rather than a single "granted".

       It is called on DENY as well as grant. Under v2 a denial is a real
       instruction - Clarity drops to no-consent mode, sets no cookies, and
       treats every page view as a new visitor - so staying silent is not the
       same thing as saying no.

       Since 31 October 2025 Microsoft enforces consent automatically for EEA,
       UK and Swiss traffic, which is effectively all of ours, so this runs
       whatever the dashboard toggle says.

       One banner choice maps to both storage types: the banner asks a single
       question, so answering it means the same for analytics and advertising. */
    function tellClarity(granted) {
      window.clarity('consentv2', {
        ad_Storage: granted ? 'granted' : 'denied',
        analytics_Storage: granted ? 'granted' : 'denied'
      });
    }
    /* Only when a choice has actually been made. No stored decision means the
       visitor has not answered yet, and Clarity's own default handles that. */
    if (saved) tellClarity(!!saved.analytics);
    document.addEventListener('bfc:consent', function (e) {
      if (e && e.detail) tellClarity(!!e.detail.analytics);
    });
  }());

  /* ---------------------------------------------------------------------------
     CONSENT BANNER
     Same pattern as the Twine Growth banner, reskinned to BFC.

     ICO position followed here: declining is exactly as easy as accepting, both
     buttons are the same size and equally visible, nothing is pre-selected, and
     the choice can be changed at any time via the footer link.

     Styles are written inline rather than added to shared/styles.css so the
     banner stays self-contained. It has to work on pages whose CSS may not have
     loaded yet, and it keeps everything in one file for the build check.
     --------------------------------------------------------------------------- */

  var WHITE = '#FFFFFF';
  var INK   = '#000000';
  var LINE  = '#DDD6CE';
  var SOFT  = 'rgba(0,0,0,.68)';
  var FONT  = "'Instrument Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

  var el = null;

  function tell(granted) {
    gtag('consent', 'update', { analytics_storage: granted ? 'granted' : 'denied' });
    document.dispatchEvent(new CustomEvent('bfc:consent', { detail: { analytics: granted } }));
  }

  /* Exposed so the Meta Pixel (currently on /our-kit and /addons) can be brought
     under the same banner later without reworking any of this. NOT under it today. */
  window.bfcConsent = {
    get: function () { var c = read(); return c ? !!c.analytics : null; },
    set: function (granted) { write(granted); tell(granted); },
    open: function () { open(); },
    reset: function () { try { localStorage.removeItem(STORE); } catch (e) {} open(); }
  };

  function close() {
    if (el && el.parentNode) { el.parentNode.removeChild(el); }
    el = null;
  }

  function decide(granted) {
    write(granted);
    tell(granted);
    close();
  }

  function button(label, primary) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.style.cssText =
      'font:500 12.5px ' + FONT + ';cursor:pointer;border-radius:999px;' +
      'padding:8px 18px;line-height:1;white-space:nowrap;flex:1 1 auto;' +
      'transition:opacity .15s ease;' +
      (primary
        ? 'background:' + INK + ';color:' + WHITE + ';border:1px solid ' + INK + ';'
        : 'background:transparent;color:' + INK + ';border:1px solid ' + LINE + ';');
    b.onmouseover = function () { b.style.opacity = '.82'; };
    b.onmouseout  = function () { b.style.opacity = '1'; };
    return b;
  }

  /* Keep the banner clear of any bottom-pinned bar.
     -----------------------------------------------------------------
     our-kit.html, keepsake-standalone.html and franchise.html each pin a
     .sticky buy bar to bottom:0. A banner at bottom:16px lands directly
     on it and intercepts taps meant for Buy now - and because it only
     closes on Accept or Decline, an undecided visitor keeps it there for
     the whole session.

     Measured rather than hardcoded, so it cannot drift out of step when
     that bar's padding or content changes. getBoundingClientRect gives
     the true height even while the bar is translated off-screen, and 0
     when the desktop breakpoint sets display:none - which is the right
     answer for desktop.

     Safe area is added ONLY when there is no bar. The bar's own padding
     is already calc(12px + env(safe-area-inset-bottom)), so its measured
     height includes the inset; adding it again would lift the banner by
     that inset twice. */
  function place() {
    if (!el) { return; }
    var bar = document.querySelector('.sticky');
    var h = bar ? bar.getBoundingClientRect().height : 0;
    el.style.bottom = h > 0
      ? (Math.round(h) + 16) + 'px'
      : 'calc(16px + env(safe-area-inset-bottom))';
  }

  function open() {
    if (el) { return; }

    el = document.createElement('div');
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Cookie choices');
    /* z-index 150, not 2147483000.
       ---------------------------------------------------------------
       The old value put this above EVERY layer on the site, including
       two that matter more than it does: the checkout drawer and the
       nav menu, both at 200. On mobile the drawer's panel is anchored
       to the bottom of the screen, so a banner pinned bottom-left sat
       on top of the payment form and could take taps meant for the pay
       button. 150 clears the site header (20) and the sticky buy bar
       (50) while sitting BELOW anything modal, so an open drawer or
       menu covers it with its own scrim instead of fighting it.

       Vertical position is set by place() below rather than hardcoded,
       and safe-area padding has moved out of the card's own padding and
       into that offset - keeping it here would double up whenever the
       banner is lifted clear of the screen edge. */
    el.style.cssText =
      'position:fixed;left:16px;z-index:150;' +
      'width:calc(100vw - 32px);max-width:340px;background:' + WHITE + ';' +
      'border:1px solid ' + LINE + ';border-radius:14px;padding:14px 16px;' +
      'box-shadow:0 14px 36px rgba(0,0,0,.14);' +
      'font:12.5px/1.5 ' + FONT + ';color:' + SOFT + ';';
    place();

    var p = document.createElement('p');
    p.style.cssText = 'margin:0 0 12px;';
    /* Copy changed 12/08. It previously said "Nothing is stored until you
       choose", which was not true: the Meta Pixel loads on our-kit,
       keepsake-standalone and franchise with no consent gate, so _fbp is
       written the moment the page loads. Ryan's decision was to keep the
       Pixel firing and make the wording accurate rather than gate it.

       This stops asserting something false without advertising the gap.
       If the Pixel is ever brought under the bfc:consent event that
       already exists, the old sentence becomes true again and can come
       back. */
    p.appendChild(document.createTextNode('We use cookies to see how the site is used and to measure our advertising. Choose below, or read our '));
    var a = document.createElement('a');
    a.href = '/privacy-policy';
    a.textContent = 'Privacy Policy';
    a.style.cssText = 'color:' + INK + ';text-decoration:underline;text-underline-offset:3px;';
    p.appendChild(a);
    p.appendChild(document.createTextNode('.'));

    var row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;';

    var yes = button('Accept', true);
    var no  = button('Decline', false);
    yes.onclick = function () { decide(true); };
    no.onclick  = function () { decide(false); };
    row.appendChild(no);
    row.appendChild(yes);

    el.appendChild(p);
    el.appendChild(row);
    document.body.appendChild(el);
    yes.focus();
  }

  /* Escape declines rather than dismissing silently, so there is never a state
     where the banner has gone but no choice has been recorded. */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && el) { decide(false); }
  });

  /* Anything with data-open-consent reopens the choice. The footer link added
     below uses it, and the privacy policy page can too. */
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('[data-open-consent]') : null;
    if (t) { e.preventDefault(); open(); }
  });

  /* Withdrawing consent has to be as easy as giving it, so every page gets a
     way back to this choice. BFC's footer legal bar is `.foot-legal`, on 43 of
     the 50 pages; the fallbacks cover the handful with a different footer. */
  function addFooterLink() {
    var host = document.querySelector('.foot-legal') ||
               document.querySelector('.upf-foot') ||
               document.querySelector('footer');
    if (!host || host.querySelector('[data-open-consent]')) { return; }
    var wrap = document.createElement('p');
    wrap.style.cssText = 'margin:6px 0 0;font-size:inherit;color:inherit;';
    var link = document.createElement('a');
    link.href = '#';
    link.setAttribute('data-open-consent', '');
    link.textContent = 'Cookie settings';
    link.style.cssText = 'color:inherit;text-decoration:underline;text-underline-offset:3px;cursor:pointer;';
    wrap.appendChild(link);
    host.appendChild(wrap);
  }

  function start() {
    addFooterLink();
    if (saved) { return; }   // decision already recorded, head script applied it
    open();
  }

  window.addEventListener('resize', place);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
