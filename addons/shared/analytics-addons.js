/* =============================================================================
   BFC ADD-ONS: ANALYTICS, NO CONSENT BANNER

   THIS IS A DELIBERATE FORK OF THE MAIN SITE'S shared/analytics.js.
   Do NOT replace it with that file, and do NOT "sync shared files" over it.
   The filename differs from the site's on purpose so that cannot happen by
   accident. If you are here to add a banner back, read the next paragraph
   first.

   WHY THERE IS NO BANNER HERE
   The site's banner is position:fixed at bottom:16px with z-index 2147483000.
   This page has a sticky checkout bar pinned to the bottom at z-index 50, so
   the banner landed directly on top of the Checkout button and swallowed every
   tap. It only closed on Accept or Decline, so anyone who ignored it could not
   check out at all. On the main site there is no bottom bar and the banner is
   harmless; here it was a total conversion blocker.

   WHY REMOVING IT IS STILL COMPLIANT
   PECR and UK GDPR require consent to STORE information on, or read it from, a
   device. Consent Mode v2 below sets analytics_storage to 'denied' and there is
   no code path anywhere in this file that can ever set it to 'granted'. GA4
   therefore never writes a cookie and never reads one, so there is nothing to
   consent to and nothing to ask about. Nothing is written to localStorage
   either - the consent store the site version keeps is gone with the banner.

   WHAT IS LOST
   Cookieless pings still send, so every event we fire still arrives and the
   funnel, conversion rates and product-level data all keep working. What goes
   is cross-session identity: returning visitors look like new ones and
   attribution is modelled rather than observed. For "is the £40 nudge working
   and where do people drop out" that costs almost nothing.

   IF YOU EVER WANT CONSENTED ANALYTICS ON THIS PAGE
   Do not reintroduce a floating banner. Put the choice inline in the footer,
   above the sticky bar, where it cannot overlay anything. There is a test
   (checkoutclear.js) that fails the build if anything renders above the
   checkout bar.
   ============================================================================= */
(function () {
  'use strict';

  var GA_ID = 'G-L1J1KR2VZZ';

  window.dataLayer = window.dataLayer || [];
  /* window.dataLayer explicitly, not the bare global - Google's own snippet
     relies on window properties being global, which breaks under stricter
     scope and cannot be tested outside a browser. */
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  /* Denied, permanently. There is no 'update' call in this file and no UI that
     could trigger one. This is what makes the missing banner correct rather
     than merely convenient - do not add a way to grant these. */
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    functionality_storage: 'granted',
    security_storage: 'granted'
  });

  gtag('js', new Date());
  /* client_storage:'none' belt-and-braces: even if a future Consent Mode change
     altered the defaults, gtag is told outright not to use device storage. */
  gtag('config', GA_ID, { client_storage: 'none', anonymize_ip: true });

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);
})();
