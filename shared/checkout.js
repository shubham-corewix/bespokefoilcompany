/* =============================================================================
   BFC CHECKOUT - shared Stripe checkout drawer

   ONE implementation, used by every page that sells a kit. Extracted verbatim
   from the product page on 03/08/2026; the only changes are that values which
   used to come from that page's own scope (which kit, how many, personalisation,
   affiliate) now arrive through a config object.

   WHY SHARED RATHER THAN COPIED
   Prices live in the markup as data-price attributes and the SKU map lives here.
   Two copies of this file would mean two places for a price to drift, and a
   drift between them is only discovered when somebody is charged the wrong
   amount. One copy, one place to change.

   USAGE
     BFCCheckout.init({
       getKit:  () => ({ kit: 'framed', price: '49.95' }),   // required
       getQty:  () => qty,                                    // required
       setQty:  n  => { qty = n; renderQty(); },              // required, keeps the page in sync
       getPersonalisation: () => ({ mode: 'later' }),         // optional
       getAffiliate:       () => null,                        // optional, Memory Catcher slug
       triggers: ['#checkoutBtn', '#stickyGo'],               // elements that open the drawer
     });

   The drawer markup and its CSS are injected by this file, so a page only needs
   the trigger buttons. Nothing renders until init() is called.

   READ BEFORE EDITING - hard-won, do not undo:
   - Do NOT add a 'shippingaddresschange' handler that calls resolve() with no
     arguments. Stripe's current API rejects re-declaring shipping options at
     click time and throws an IntegrationError that SILENTLY BLOCKS EVERY WALLET
     BUTTON. Apple Pay, Google Pay and Link all fail to render and 'ready'
     reports no available payment methods, with no visible error.
   - Address and payment elements are created lazily in openCardPath(), not up
     front. Mounting them eagerly is what made the drawer open as a wall of
     fields.
   - The publishable key comes from /.netlify/functions/config, never hand-edited
     here, so test and live keys are swapped by environment rather than by edit.
   ============================================================================= */
(function () {
  'use strict';

  var DRAWER_HTML = "<div class=\"checkout-drawer\" id=\"checkoutDrawer\" hidden>\n          <div class=\"cd-panel\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"cd-title\">\n            <button class=\"cd-close\" id=\"cdClose\" aria-label=\"Close checkout\">&#10005;</button>\n            <h3 id=\"cd-title\" class=\"cd-title\">Complete your order</h3>\n            <div class=\"cd-summary\" id=\"cdSummary\"></div>\n\n            <!-- Express wallets first (Apple Pay / Google Pay / Link / PayPal /\n               Klarna). Mirrors the add-ons panel: wallets are the headline,\n               the card form is opt-in behind a button so the drawer opens\n               short rather than as a wall of inputs. -->\n            <div id=\"expressBlock\" class=\"cd-express-block\" hidden>\n              <p class=\"cd-express-label\">Express checkout</p>\n              <div id=\"expressCheckoutElement\"></div>\n              <div class=\"cd-or\" id=\"cdOr\"><span>or</span></div>\n            </div>\n\n            <!-- Email sits OUTSIDE the collapsed card block, so it is visible as\n               soon as the drawer opens. Wallets supply their own email, so it\n               is only validated on the card path (see confirm()). Capturing it\n               up front also means a drop-off still leaves a contactable lead. -->\n            <label class=\"cd-label\" for=\"cdEmail\">Email</label>\n            <input class=\"cd-email\" id=\"cdEmail\" type=\"email\" autocomplete=\"email\" placeholder=\"you@example.com\"\n              required>\n\n            <!-- Discount code. Collapsed behind a link: an always-visible\n               discount box sends people off hunting for a code they do not\n               have, which is a known abandonment path. Sits BELOW email and\n               ABOVE the card block, never in the wallet area - wallet payers\n               skip everything under the wallet buttons, and they are exactly\n               the customers likely to be holding a card from a class. -->\n            <button type=\"button\" class=\"cd-codetoggle\" id=\"cdCodeToggle\">Have a code?</button>\n            <div class=\"cd-codewrap\" id=\"cdCodeWrap\" hidden>\n              <label class=\"cd-label\" for=\"cdCode\">Have a code?</label>\n              <div class=\"cd-coderow\">\n                <input class=\"cd-code\" id=\"cdCode\" type=\"text\" autocomplete=\"off\" spellcheck=\"false\"\n                  placeholder=\"\">\n                <button type=\"button\" class=\"cd-codeapply\" id=\"cdCodeApply\">Apply</button>\n              </div>\n              <p class=\"cd-codemsg\" id=\"cdCodeMsg\" role=\"status\"></p>\n            </div>\n\n            <!-- Card fields: mounted only when the customer asks for them -->\n            <div id=\"cardUi\" hidden>\n              <div id=\"addressElement\"></div>\n              <div id=\"paymentElement\"></div>\n              <button class=\"cd-pay\" id=\"cdPay\" disabled><span id=\"cdPayLabel\">Pay</span></button>\n            </div>\n\n            <button class=\"cd-pay\" id=\"cdStartCard\">Or Pay with Card</button>\n            <p class=\"cd-error\" id=\"cdError\" role=\"alert\"></p>\n            <p class=\"cd-secure\"><svg viewBox=\"0 0 24 24\" width=\"12\" height=\"12\">\n                <path d=\"M6 10V7a6 6 0 0 1 12 0v3\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" />\n                <rect x=\"4\" y=\"10\" width=\"16\" height=\"10\" rx=\"2\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" />\n              </svg> Secure checkout powered by Stripe</p>\n          </div>\n        </div>";

  var DRAWER_CSS = ".cd-label{font-size: 12px; color: var(--ink-soft); margin: 0 0 8px; display: block}\n.cd-email{width: 100%; height: 44px; border: 1px solid var(--hairline); border-radius: 10px; padding: 0 14px; font-family: inherit; font-size: 16px; background: var(--white); margin-bottom: 14px;}\n.cd-email:focus{outline: none; border-color: var(--ink)}\n.success-panel{margin-top: 16px; background: var(--white); border: 1px solid var(--hairline); border-radius: var(--r-card); padding: 28px; text-align: center;}\n.success-panel h2{font-family: var(--serif); font-weight: 420; font-size: 24px; margin-bottom: 10px}\n.success-panel p{font-size: 14.5px; line-height: 1.65; color: var(--ink-soft); max-width: 44ch; margin: 0 auto}\n.checkout-drawer{position: fixed; inset: 0; z-index: 200; display: flex; align-items: flex-end; justify-content: center; background: rgba(0, 0, 0, .5); backdrop-filter: blur(2px);}\n.checkout-drawer[hidden]{display: none !important}\n.cd-panel{background: var(--white); width: 100%; max-width: 460px; max-height: 92vh; overflow-y: auto; border-radius: 18px 18px 0 0; padding: 28px 24px calc(28px + env(safe-area-inset-bottom)); position: relative;}\n.cd-close{position: absolute; top: 16px; right: 16px; width: 34px; height: 34px; border: 0; border-radius: 50%; background: var(--porcelain); font-size: 15px; display: grid; place-items: center; color: var(--ink);}\n.cd-title{font-family: var(--serif); font-weight: 420; font-size: 22px; margin-bottom: 6px; padding-right: 36px;}\n.cd-summary{font-size: 14px; color: var(--ink-soft); padding-bottom: 18px; margin-bottom: 18px; border-bottom: 1px solid var(--hairline);}\n.cd-summary .row{display: flex; justify-content: space-between; margin-top: 4px}\n.cd-summary .row.total{color: var(--ink); font-weight: 600; font-size: 15px; margin-top: 10px}\n.cd-line{display: flex; gap: 12px; padding-bottom: 14px; margin-bottom: 12px; border-bottom: 1px solid var(--hairline)}\n.cd-line .thumb{width: 56px; height: 56px; object-fit: cover; border-radius: 8px; flex: none; background: var(--porcelain)}\n.cd-line-info{flex: 1; min-width: 0}\n.cd-line-name{color: var(--ink); font-weight: 500; font-size: 14.5px; line-height: 1.35}\n.cd-line-amt{white-space: nowrap; font-weight: 600; color: var(--ink); font-size: 14.5px}\n.cd-qty{display: inline-flex; align-items: center; margin-top: 8px; border: 1px solid var(--hairline); border-radius: 99px; background: var(--porcelain); overflow: hidden;}\n.cd-qty button{width: 32px; height: 32px; border: 0; background: none; font-size: 16px; line-height: 1; color: var(--ink)}\n.cd-qty button:disabled{opacity: .3}\n.cd-qty span{min-width: 24px; text-align: center; font-weight: 700; font-size: 13px}\n.cd-express-block[hidden]{display: none}\n.cd-express-label{font-size: 11.5px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-faint); margin: 18px 0 10px;}\n.cd-or{text-align: center; margin: 16px 0; font-size: 12px; color: var(--ink-faint); position: relative;}\n.cd-or span{background: var(--white); padding: 0 12px; position: relative; z-index: 1}\n.cd-or::before{content: \"\"; position: absolute; left: 0; right: 0; top: 50%; height: 1px; background: var(--hairline);}\n.cd-pay{width: 100%; height: 52px; margin-top: 20px; background: var(--ink); color: var(--white); border: 0; border-radius: var(--r-btn); font-size: 16px; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 8px;}\n.cd-pay:disabled{opacity: .55}\n.cd-pay .spin{width: 16px; height: 16px; border: 2px solid rgba(255, 255, 255, .4); border-top-color: #fff; border-radius: 50%; animation: cdspin .7s linear infinite;}\n.cd-error{color: #c0392b; font-size: 13px; margin-top: 12px; min-height: 0; text-align: center}\n.cd-secure{display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 11.5px; color: var(--ink-faint); margin-top: 16px;}\n/* 16px on both inputs, not 15: iOS Safari zooms the whole page when a\n   focused input computes below 16px, which on a bottom-anchored drawer\n   pushes the panel off screen and exposes the page behind it. The add-ons\n   app fixed the same thing the same way. Do not reduce these. */\n.cd-codetoggle{background: none; border: 0; padding: 4px 0; margin: 2px 0 0; font: inherit; font-size: 13px; color: var(--ink-soft); text-decoration: underline; text-underline-offset: 3px; cursor: pointer}\n.cd-codetoggle:hover{color: var(--ink)}\n.cd-codewrap{margin-top: 12px}\n.cd-codewrap[hidden]{display: none}\n.cd-coderow{display: flex; gap: 8px; align-items: stretch; margin-bottom: 4px}\n.cd-code{flex: 1 1 auto; min-width: 9rem; text-transform: uppercase; width: 100%; height: 44px; border: 1px solid var(--hairline); border-radius: 10px; padding: 0 14px; font-family: inherit; font-size: 16px; background: var(--white)}\n.cd-code:focus{outline: none; border-color: var(--ink)}\n.cd-codeapply{flex: 0 0 auto; padding: 0 18px; height: 44px; border: 1px solid var(--ink); background: var(--white); color: var(--ink); border-radius: 10px; font-family: inherit; font-size: 14px; font-weight: 500; cursor: pointer; white-space: nowrap}\n.cd-codeapply:hover:not([disabled]){background: var(--ink); color: var(--white)}\n.cd-codeapply[disabled]{opacity: .5; cursor: default}\n.cd-codemsg{font-size: 13px; margin: 6px 0 0; min-height: 1.2em}\n.cd-codemsg.is-ok{color: #3E8E6B}\n.cd-codemsg.is-bad{color: var(--ink-soft)}\n@media (min-width:720px){.checkout-drawer{align-items: center}}\n@media (min-width:720px){.cd-panel{border-radius: 18px; padding: 32px}}";

  var booted = false;

  function mount() {
    if (booted) return;
    booted = true;
    var st = document.createElement('style');
    st.textContent = DRAWER_CSS;
    document.head.appendChild(st);
    var host = document.createElement('div');
    host.innerHTML = DRAWER_HTML;
    while (host.firstChild) document.body.appendChild(host.firstChild);
  }

  window.BFCCheckout = {
    init: function (cfg) {
      if (!cfg || typeof cfg.getKit !== 'function' || typeof cfg.getQty !== 'function') {
        console.error('[BFCCheckout] init needs at least getKit() and getQty()');
        return;
      }
      if (typeof cfg.setQty !== 'function') cfg.setQty = function () { };
      mount();
      start(cfg);
    }
  };

  function start(cfg) {

      /* ---------- Stripe checkout (bfc-addons pattern) ----------
         SKU map: the browser sends only the SKU; the Netlify function is the
         single source of truth for price + postage. */
      const SKU = { foil: 'BFC-KIT-FOIL', framed: 'BFC-KIT-FRAMED', premium: 'BFC-KIT-PREM' };

      /* ---- Memory Catcher code ----
         window.__mcCode is the ONLY thing sent to the server, and the server
         re-validates it against Supabase at payment time. Nothing here is
         trusted: this exists to tell the customer whether the code worked
         BEFORE they pay, not to decide anything.

         A valid code never changes the price - it credits the franchisee and
         flags a free extra copy for fulfilment. So there is no total to
         recalculate here, which is why this block is as small as it is. */
      window.__mcCode = null; window.__couponCode = null;
      (function mcCode() {
        const toggle = document.getElementById('cdCodeToggle');
        const wrap = document.getElementById('cdCodeWrap');
        const input = document.getElementById('cdCode');
        const apply = document.getElementById('cdCodeApply');
        const msg = document.getElementById('cdCodeMsg');
        if (!toggle || !wrap || !input || !apply || !msg) return;

        /* Arriving from /memory-catcher/<slug>? Prefill and open, so the
           customer never has to copy their own franchisee's code back in. */
        const pre = (typeof MEMORY_CATCHER !== 'undefined' && MEMORY_CATCHER && MEMORY_CATCHER.code)
          ? MEMORY_CATCHER.code : '';
        if (pre) {
          input.value = pre;
          wrap.hidden = false;
          toggle.hidden = true;
          /* Set the state too, not just the field.
             ----------------------------------------------------------------
             This used to fill the input and stop there, so a customer who
             arrived from a Memory Catcher link, saw their code sitting in the
             box and paid WITHOUT pressing Apply sent no code at all - losing
             the free extra copy the page had just promised them, and the
             franchisee's credit with it. Nobody presses Apply on a field that
             already looks filled in.

             Not re-validated here: the code came from MEMORY_CATCHER, which the
             edge function rendered from the franchisees table, and
             create-payment-intent re-validates it server-side before honouring
             it. Found 14/08 in the pre-deploy audit. */
          window.__mcCode = pre;
          window.__couponCode = null;
          msg.className = 'cd-codemsg is-ok';
          msg.textContent = 'FREE extra copy of your print'
            + (typeof MEMORY_CATCHER !== 'undefined' && MEMORY_CATCHER && MEMORY_CATCHER.name
                ? ' - thanks to ' + MEMORY_CATCHER.name + '.' : '.');
        }

        toggle.addEventListener('click', function () {
          wrap.hidden = false; toggle.hidden = true; input.focus();
        });

        apply.addEventListener('click', async function () {
          const code = (input.value || '').trim().toUpperCase();
          if (!code) { msg.textContent = ''; window.__mcCode = null; window.__couponCode = null; return; }
          apply.disabled = true;
          msg.className = 'cd-codemsg';
          msg.textContent = 'Checking...';
          try {
            const r = await fetch('/.netlify/functions/validate-affiliate-code', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code })
            });
            const d = await r.json();
            if (d && d.valid && d.kind === 'coupon') {
            /* A Stripe promotion code, not a Memory Catcher one. Held separately
               because the two do different things: one takes money off, the
               other credits a franchisee and adds a free extra copy. Sending a
               coupon in the affiliate field would credit nobody and discount
               nothing. */
            window.__couponCode = d.code;
            window.__mcCode = null;
            msg.className = 'cd-codemsg is-ok';
            msg.textContent = d.offer + '.';
            await refreshForCode();
          } else if (d && d.valid) {
              window.__mcCode = d.code;
              msg.className = 'cd-codemsg is-ok';
              msg.textContent = d.offer + ' - thanks to ' + d.name + '.';
              await refreshForCode();
            } else {
              window.__mcCode = null; window.__couponCode = null;
              msg.className = 'cd-codemsg is-bad';
              msg.textContent = "That code wasn't recognised. You can still order as normal.";
            }
          } catch (e) {
            /* Network failure must not block the sale. Clear the code and let
               the order through at full price rather than trapping someone
               behind a validator that happens to be down. */
            window.__mcCode = null; window.__couponCode = null;
            msg.className = 'cd-codemsg is-bad';
            msg.textContent = "Couldn't check that code just now. You can still order as normal.";
          }
          apply.disabled = false;
        });

        input.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') { e.preventDefault(); apply.click(); }
        });
      })();

      /* ?testsku=1 swaps in the £1 test SKU so the whole real checkout can be
         proven end to end without a £50 charge each time. Harmless on its own:
         the SERVER refuses this SKU unless TEST_SKU_ENABLED=true is set in the
         Netlify env, so adding the parameter to a live page does nothing.
         Nothing in the UI links to it. */
      const TEST_MODE = new URLSearchParams(location.search).get('testsku') === '1';
      const skuFor = (kit) => TEST_MODE ? 'BFC-KIT-TEST' : SKU[kit];
      if (TEST_MODE) console.warn('[checkout] ?testsku=1 - using the £1 test SKU');

      // PUBLISHABLE key only (safe in browser). Dixit swaps test -> live at deploy.
      /* Stripe publishable key is served from Netlify env (STRIPE_PUBLISHABLE_KEY)
         via /.netlify/functions/config - never hand-edited in this file, so
         redeploys can't wipe it. */
      let stripe = null;
      const stripeReady = fetch('/.netlify/functions/config')
        .then(r => r.json())
        .then(cfg => {
          if (!cfg.publishableKey) {
            console.error('[keepsake checkout] STRIPE_PUBLISHABLE_KEY env var is not set in Netlify (or was set without a redeploy). Checkout cannot start.');
            return false;
          }
          stripe = Stripe(cfg.publishableKey);
          console.log('[keepsake checkout] stripe.js initialised, key prefix:', cfg.publishableKey.slice(0, 8));
          return true;
        })
        .catch(err => {
          console.error('[keepsake checkout] could not load config function:', err);
          return false;
        });

      const drawer = document.getElementById('checkoutDrawer');
      const cdPayBtn = document.getElementById('cdPay');
      const cdError = document.getElementById('cdError');
      const cdSummary = document.getElementById('cdSummary');
      let elements, paymentElement, expressElement, addressElement, activeClientSecret = null;
      let cardPathOpen = false;

      function money(p) { return '\u00A3' + (p / 100).toFixed(2); }

      /* Applying a code has to rebuild the PaymentIntent.
         -----------------------------------------------------------------
         create-payment-intent runs ONCE, when the drawer opens. A code entered
         afterwards was never sent, so the server priced the order without it:
         the customer saw "98% off your order" in green and was charged the full
         amount anyway. Found live, 13/08.

         openCheckout() is already written to be safe to re-run - it unmounts the
         Elements and starts again, which is exactly what a changed amount needs,
         since Elements are bound to one PaymentIntent. The code field keeps its
         value because the drawer markup is injected only on first open.

         Affiliate codes too. They do not change the price, but they carry the
         attribution that credits a Memory Catcher, and that was being dropped
         the same way. */
      async function refreshForCode() {
        try {
          await openCheckout();
        } catch (e) {
          console.error('[checkout] could not re-price after applying a code:', e);
        }
      }

      async function openCheckout() {
        console.log('[keepsake checkout] openCheckout: start');
        cdError.textContent = '';
        drawer.hidden = false;
        document.body.style.overflow = 'hidden';
        cdPayBtn.disabled = true;

        // Reset the progressive card path. The drawer can be reopened after a close
        // (or after changing quantity), and a fresh PaymentIntent means the old
        // Elements are stale - unmount and start from wallets again.
        cardPathOpen = false;
        /* Clear the previous intent BEFORE asking for a new one.
           ------------------------------------------------------------------
           openCheckout re-runs on a quantity change and on applying a code. If
           the new PaymentIntent call fails, the function returns early - and
           these two used to keep their old values, leaving "Or Pay with Card"
           visible and enabled with a live secret for the PREVIOUS amount. A
           customer told "20% off your order", then shown an error, could still
           pay the full price against the stale intent. Nulling them here means
           a failure leaves the drawer honestly unusable instead of quietly
           wrong. Found 14/08. */
        activeClientSecret = null;
        elements = null;
        const _startBtn = document.getElementById('cdStartCard');
        _startBtn.hidden = false;
        _startBtn.disabled = false;
        /* Reset the LABEL too. openCardPath swaps it to "Loading secure
           payment..." while it mounts; without this, reopening the drawer
           brought the button back still wearing that label, which reads as a
           permanently loading, unclickable button. It also poisoned the catch
           block there, which captures the current text as "original" and
           restores it - so once wrong, it stayed wrong. Ryan, 13/08. */
        _startBtn.textContent = START_CARD_LABEL;
        document.getElementById('cardUi').hidden = true;
        document.getElementById('expressBlock').hidden = true;
        try { if (addressElement) addressElement.unmount(); } catch (e) { }
        try { if (paymentElement) paymentElement.unmount(); } catch (e) { }
        try { if (expressElement) expressElement.unmount(); } catch (e) { }
        addressElement = paymentElement = expressElement = null;
        document.getElementById('addressElement').innerHTML = '';
        document.getElementById('paymentElement').innerHTML = '';
        document.getElementById('expressCheckoutElement').innerHTML = '';
        const ok = await stripeReady;
        console.log('[keepsake checkout] stripeReady:', { ok, hasStripe: !!stripe });
        if (!ok || !stripe) {
          cdError.textContent = 'Checkout is not configured yet (Stripe key missing). Please try again shortly.';
          return;
        }

        // 1. Ask the server for a PaymentIntent for the selected kit
        let data;
        try {
          console.log('[keepsake checkout] calling create-payment-intent', { sku: skuFor(cfg.getKit().kit), kit: cfg.getKit().kit });
          const res = await fetch('/.netlify/functions/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sku: skuFor(cfg.getKit().kit),
              qty: cfg.getQty(),
              // Memory Catcher attribution - null on the plain kit page.
              affiliate: cfg.getAffiliate ? cfg.getAffiliate() : null,
              affiliateCode: window.__mcCode || null,
            couponCode: window.__couponCode || null,
              personalisation: cfg.getPersonalisation ? cfg.getPersonalisation() : { mode: 'later' },
              fbp: (document.cookie.match(/_fbp=([^;]+)/) || [])[1] || null,
              fbc: (document.cookie.match(/_fbc=([^;]+)/) || [])[1] || null,
              page: location.href,
            }),
          });
          const raw = await res.text();
          console.log('[keepsake checkout] payment-intent response', { status: res.status, ok: res.ok, bodyPreview: raw.slice(0, 500) });
          try { data = JSON.parse(raw); } catch (_) { data = null; }
          if (!res.ok || !data || !data.clientSecret) {
            console.error('[keepsake checkout] payment function failed',
              'status:', res.status,
              res.status === 404 ? '-> function not deployed: check Netlify Functions tab; deploy needs npm install + CLI/git (not drag-and-drop)' :
                res.status >= 500 ? '-> function crashed: check STRIPE_SECRET_KEY env var (redeploy after setting) and function logs' :
                  '', 'body:', raw.slice(0, 300));
            /* Prefer the server's own wording when it gave one. An expired
               discount code returns a 400 saying exactly that, and telling the
               customer "checkout could not start" instead sends them to refresh
               a page that will fail again the same way. */
            throw new Error((data && data.error) || 'Sorry - checkout could not start. Please refresh and try again.');
          }
        } catch (err) {
          cdError.textContent = err.message && err.message !== 'Failed to fetch' ? err.message
            : 'Sorry - checkout could not start. Please check your connection and try again.';
          console.error('[keepsake checkout] openCheckout catch', err);
          if (!err.message.startsWith('Sorry')) console.error('[keepsake checkout]', err);
          return;
        }
        activeClientSecret = data.clientSecret;
        console.log('[keepsake checkout] payment intent created OK, breakdown:', data.breakdown);

        // Order summary
        const b = data.breakdown;
        window.__lastTotal = b.total;
        if (typeof fbq === 'function') fbq('track', 'InitiateCheckout', {
          content_ids: [SKU[cfg.getKit().kit]],
          content_type: 'product',
          value: b.total / 100,
          currency: 'GBP',
          num_items: cfg.getQty()
        });
        renderCdSummary(b);
        document.getElementById('cdPayLabel').textContent = 'Pay ' + money(b.total);

        // 2. Build Elements against this client secret
        const appearance = {
          theme: 'stripe',
          variables: {
            colorPrimary: '#000000', colorText: '#000000', colorBackground: '#FFFFFF',
            fontFamily: 'Instrument Sans, system-ui, sans-serif', borderRadius: '10px',
          },
        };
        try {
          console.log('[keepsake checkout] creating Elements with clientSecret');
          elements = stripe.elements({ clientSecret: activeClientSecret, appearance });

          // Express Checkout = Apple Pay / Google Pay / Link (wallets need the
          // Payment Method Domain registered in Stripe - see the Dixit brief).
          console.log('[keepsake checkout] creating expressCheckout');
          expressElement = elements.create('expressCheckout', {
            buttonHeight: 50,
            emailRequired: true,
            shippingAddressRequired: true,
            allowedShippingCountries: ['GB'],
            shippingRates: [{
              id: 'rm-next',
              displayName: 'Royal Mail next working day',
              amount: b.postage,
            }],
          });
          expressElement.mount('#expressCheckoutElement');
          // NOTE (matches the add-ons build): do NOT add a 'shippingaddresschange'
          // handler that calls resolve() with no arguments. Stripe's current API
          // rejects re-declaring shipping options at click time and throws an
          // IntegrationError that SILENTLY BLOCKS EVERY WALLET BUTTON - Apple Pay,
          // Google Pay and Link all fail to render, and 'ready' reports no available
          // payment methods. All shipping options are declared once above.
          expressElement.on('confirm', () => confirm(true));
          expressElement.on('ready', (e) => {
            // Wallets are the headline. Only reveal the express block if this device
            // actually has one; otherwise the card path is the only route and the
            // button should say so rather than offering an "instead".
            const hasWallets = !!(e && e.availablePaymentMethods);
            document.getElementById('expressBlock').hidden = !hasWallets;
            document.getElementById('cdStartCard').textContent =
              hasWallets ? 'Or Pay with Card' : 'Continue to payment';
          });

          // NOTE: address + payment elements are created lazily in openCardPath(),
          // not here. Mounting them up front is what made the drawer open as a wall
          // of fields. See the add-ons panel for the same progressive pattern.
          console.log('[keepsake checkout] express mounted; card path deferred');
        } catch (mountErr) {
          console.error('[keepsake checkout] Elements create/mount threw', mountErr);
          cdError.textContent = 'Checkout UI failed to load. Please refresh and try again.';
          return;
        }
      }

      /* Drawer line item, modelled on the add-ons cart summary. Changing quantity
         here re-requests a PaymentIntent, because the server is the price authority
         and the existing intent is for the old amount. */
      /* Max per order. Lives here so the drawer stepper and any page stepper
         cannot disagree; a page can override it via cfg.maxQty. */
      const MAX_QTY = cfg.maxQty || 10;

      /* Kit display names live here rather than on the page, so both pages
         label the drawer identically. */
      const KIT_NAMES = { foil: 'Foil Print Kit', framed: 'Framed Foil Print Kit', premium: 'Premium Kit' };
      const KIT_THUMB = {
        foil: '/assets/gallery-01.webp',
        framed: '/assets/gallery-02.webp',
        premium: '/assets/gallery-03.webp',
      };
      function renderCdSummary(b) {
        cdSummary.innerHTML =
          `<div class="cd-line">` +
          `<img class="thumb" src="${KIT_THUMB[cfg.getKit().kit]}" alt="">` +
          `<div class="cd-line-info">` +
          `<div class="cd-line-name">${KIT_NAMES[cfg.getKit().kit]}</div>` +
          `<div class="cd-qty" role="group" aria-label="Quantity">` +
          `<button type="button" id="cdQtyMinus" aria-label="Decrease quantity"${cfg.getQty() <= 1 ? ' disabled' : ''}>&minus;</button>` +
          `<span id="cdQtyVal">${cfg.getQty()}</span>` +
          `<button type="button" id="cdQtyPlus" aria-label="Increase quantity"${cfg.getQty() >= MAX_QTY ? ' disabled' : ''}>+</button>` +
          `</div>` +
          `</div>` +
          `<div class="cd-line-amt">${money(b.subtotal)}</div>` +
          `</div>` +
          `<div class="row"><span>Postage (Royal Mail next working day)</span><span>${b.postage === 0 ? 'Free' : money(b.postage)}</span></div>` +
          /* Only rendered when a discount actually applied. b.discount comes back
             from create-payment-intent AFTER it re-validates the code with
             Stripe, so what is shown here is what will be charged. */
          (b.discount ? `<div class="row"><span>Discount${b.coupon ? ' (' + b.coupon + ')' : ''}</span><span>&minus;${money(b.discount)}</span></div>` : '') +
          `<div class="row total"><span>Total</span><span>${money(b.total)}</span></div>`;

        const minus = document.getElementById('cdQtyMinus');
        const plus = document.getElementById('cdQtyPlus');
        if (minus) minus.addEventListener('click', () => changeQtyInDrawer(cfg.getQty() - 1));
        if (plus) plus.addEventListener('click', () => changeQtyInDrawer(cfg.getQty() + 1));
      }

      async function changeQtyInDrawer(n) {
        const next = Math.max(1, Math.min(MAX_QTY, n));
        if (next === cfg.getQty()) return;
        cfg.setQty(next);                 // keeps the landing page in sync
        await openCheckout();         // fresh PaymentIntent for the new total
      }

      /* ---------- card path (progressive disclosure) ----------
         Mounts the address + payment elements only when the customer chooses to pay
         by card. Keeps the drawer short on open: summary, wallets, one button. */
      async function openCardPath() {
        if (cardPathOpen) return;
        const startBtn = document.getElementById('cdStartCard');
        if (!elements || !activeClientSecret) {
          cdError.textContent = 'Checkout is still loading - please close and reopen, or refresh the page.';
          return;
        }
        startBtn.disabled = true;
        const original = startBtn.textContent;
        startBtn.textContent = 'Loading secure payment\u2026';
        try {
          // Shipping address (wallets collect their own). Address Element in shipping
          // mode auto-attaches to the PaymentIntent on confirm - this is what puts
          // the address into ShipStation.
          addressElement = elements.create('address', { mode: 'shipping', allowedCountries: ['GB'] });
          addressElement.mount('#addressElement');

          // Accordion (Stripe's default) rather than tabs: tabs render PayPal, card
          // and Klarna as equal-weight blocks, which is what made PayPal dominate.
          paymentElement = elements.create('payment');
          paymentElement.mount('#paymentElement');
          paymentElement.on('ready', () => { cdPayBtn.disabled = false; });
          /* Stripe's fields are in an iframe, so the input listener above cannot
             see them. Clearing on change means our message goes as soon as the
             customer touches the field it was complaining about. */
          paymentElement.on('change', () => { cdError.textContent = ''; });
          addressElement.on('change', () => { cdError.textContent = ''; });
          paymentElement.on('loaderror', (e) => {
            console.error('[keepsake checkout] payment element loaderror', e);
          });

          cardPathOpen = true;
          startBtn.hidden = true;
          document.getElementById('cardUi').hidden = false;
          // Email is now above this block and may already be filled, so do not pull
          // focus backwards. Only focus it if it is still empty.
          const _em = document.getElementById('cdEmail');
          if (!_em.value.trim()) _em.focus({ preventScroll: true });
        } catch (err) {
          console.error('[keepsake checkout] card path mount failed', err);
          startBtn.disabled = false;
          startBtn.textContent = original;
          cdError.textContent = 'Checkout is unavailable right now. Please try again in a moment.';
        }
      }
      document.getElementById('cdStartCard').addEventListener('click', openCardPath);

      const START_CARD_LABEL = (document.getElementById('cdStartCard') || {}).textContent || 'Or Pay with Card';
      const PAY_LABEL = (document.getElementById('cdPayLabel') || {}).textContent || 'Pay';

      async function confirm(isExpress) {
        cdError.textContent = '';
        console.log('[keepsake checkout] confirm clicked', { hasElements: !!elements, hasClientSecret: !!activeClientSecret, hasPaymentElement: !!paymentElement });
        if (!elements || !activeClientSecret) {
          cdError.textContent = 'Checkout is still loading - please close and reopen, or refresh the page.';
          console.error('[keepsake checkout] confirm blocked: Stripe elements were never created (payment function likely failed - see earlier error above)');
          return;
        }
        // Wallets (Apple Pay / Google Pay / Link / PayPal) supply their own email,
        // and on the express path the card-path email field is not even mounted,
        // so only validate it when the customer is paying by card.
        const email = document.getElementById('cdEmail').value.trim();
        if (!isExpress) {
          if (!/.+@.+\..+/.test(email)) {
            cdError.textContent = 'Please enter an email for your order confirmation.';
            document.getElementById('cdEmail').focus();
            return;
          }
        }
        setPayBusy(true);

        /* try/finally, and the button state handled in one place.
           ------------------------------------------------------------------
           The old version did `cdPayBtn.innerHTML = '<span class="spin">'`,
           which DESTROYS #cdPayLabel, and then on the error path called
           getElementById('cdPayLabel').textContent on the element it had just
           removed. That throws, so the two lines after it never ran and the
           button stayed disabled with a spinner until the page was reloaded.
           Pressing Pay with a field incomplete bricked the checkout. Found by
           Ryan on the live site, 13/08.

           There was also no try/finally, so any throw from confirmPayment - a
           dropped connection is enough - left the button dead the same way.
           A pay button that cannot recover is worse than one that never
           worked, because the customer has already committed. */
        try {
          const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
              return_url: window.location.origin + location.pathname + '?paid=1&amt=' + (window.__lastTotal || 0) + '&sku=' + skuFor(cfg.getKit().kit),
              ...(email ? { receipt_email: email } : {}),
            },
          });
          // Reaching here means an immediate error; otherwise the browser has redirected.
          if (error) cdError.textContent = error.message || 'Payment could not be completed.';
        } catch (err) {
          console.error('[keepsake checkout] confirmPayment threw', err);
          cdError.textContent = 'Something went wrong taking the payment. Please try again.';
        } finally {
          setPayBusy(false);
        }
      }

      /* Keeps #cdPayLabel in the DOM in both states, so nothing later reads a
         node that has been replaced. */
      let payLabelWhenBusy = null;
      function setPayBusy(busy) {
        /* Capture the CURRENT label, not one captured at init. openCheckout sets
           it to "Pay GBP 54.90"; restoring a constant grabbed when the module
           loaded reverted it to a bare "Pay" after any failed attempt, dropping
           the amount at the exact moment the customer is deciding whether to
           try again. Found 14/08. */
        if (busy) {
          const cur = document.getElementById('cdPayLabel');
          payLabelWhenBusy = cur ? cur.textContent : PAY_LABEL;
        }
        const label = payLabelWhenBusy || PAY_LABEL;
        cdPayBtn.disabled = busy;
        cdPayBtn.innerHTML = busy
          ? '<span class="spin" aria-hidden="true"></span><span id="cdPayLabel" hidden></span>'
          : '<span id="cdPayLabel"></span>';
        document.getElementById('cdPayLabel').textContent = label;
      }

      function closeCheckout() {
        drawer.hidden = true;
        document.body.style.overflow = '';
        if (paymentElement) { paymentElement.destroy(); paymentElement = null; }
        if (expressElement) { expressElement.destroy(); expressElement = null; }
        if (addressElement) { addressElement.destroy(); addressElement = null; }
        elements = null;
        activeClientSecret = null;
        cdPayBtn.disabled = true;
      }

      /* Triggers come from config: the product page has #checkoutBtn and
         #stickyGo, the home page has #expressPay and #cardPay. Hard-coding
         either set would throw on the other page and halt the whole module,
         so every trigger is optional and missing ones are simply skipped. */
      (cfg.triggers || []).forEach(function (sel) {
        var el = document.querySelector(sel);
        if (!el) { console.warn('[BFCCheckout] trigger not found, skipped:', sel); return; }
        el.addEventListener('click', function (e) { e.preventDefault(); openCheckout(); });
      });
      document.getElementById('cdClose').addEventListener('click', closeCheckout);
      drawer.addEventListener('click', e => { if (e.target === drawer) closeCheckout(); });
      /* Clear the error as soon as the customer acts on it.
         ------------------------------------------------------------------
         cdError was only ever cleared at the START of the next confirm(), so
         "Please enter an email for your order confirmation." sat there after
         the email had been typed, and "Please provide your full name." stayed
         put once the name was filled. The message outlived the problem, which
         makes a form feel broken even when it is fine. Ryan, 13/08. */
      (function clearErrorOnFix() {
        const em = document.getElementById('cdEmail');
        if (em) em.addEventListener('input', () => { cdError.textContent = ''; });
      })();

      cdPayBtn.addEventListener('click', () => confirm(false));

      /* post-payment confirmation (Stripe redirects back with ?paid=1) */
      if (new URLSearchParams(location.search).get('paid') === '1') {
        /* Post-payment confirmation.
           ------------------------------------------------------------------
           Every line here used to assume the page provided #successPanel,
           .buy-label and #kits. home.html has none of them, so
           `panel.hidden = false` threw on null and NOTHING after it ran: a
           customer who bought from the homepage came back from Stripe to an
           ordinary page with ?paid=1 in the address bar and no acknowledgement
           at all. The likely next move is to pay again. Found 14/08 while the
           site was live.

           The module now owns its own confirmation rather than depending on
           each page to supply one, and every page-specific tidy-up is
           optional. A page that provides #successPanel still gets its own
           wording; a page that does not gets an injected one. */
        const qs = new URLSearchParams(location.search);
        if (typeof fbq === 'function') fbq('track', 'Purchase', {
          content_ids: [qs.get('sku') || 'BFC-KIT'],
          content_type: 'product',
          value: (parseInt(qs.get('amt') || '0', 10)) / 100,
          currency: 'GBP',
          num_items: 1
        }, { eventID: qs.get('payment_intent') || undefined });

        let panel = document.getElementById('successPanel');
        if (!panel) {
          panel = document.createElement('div');
          panel.className = 'success-panel';
          panel.id = 'successPanel';
          panel.innerHTML =
            '<h2>Thank you - your kit is on its way</h2>' +
            '<p>Your order is confirmed and a receipt is on its way to your inbox. ' +
            'Your kit ships by Royal Mail next working day, and your upload portal ' +
            'link arrives with it - ready for when you have captured those tiny prints.</p>';
          /* Placement, in order of preference:
               1. top of <main> - the natural content start
               2. directly after <header> - home.html has no <main>, and its
                  first body child is the nav overlay, so inserting at the top
                  of body would put the confirmation above the header
               3. top of body, as a last resort
             .success-panel is styled in DRAWER_CSS above, which this module
             injects, so it looks right on a page that has never defined it. */
          const main = document.querySelector('main');
          const header = document.querySelector('header');
          if (main) {
            main.insertBefore(panel, main.firstChild);
          } else if (header && header.parentNode) {
            header.parentNode.insertBefore(panel, header.nextSibling);
          } else {
            document.body.insertBefore(panel, document.body.firstChild);
          }
          panel.style.margin = '20px auto';
          panel.style.maxWidth = '720px';
        }
        panel.hidden = false;

        // Page-specific tidy-up, all optional.
        const _ex = document.querySelector('.express'); if (_ex) _ex.style.display = 'none';
        const _kits = document.getElementById('kits'); if (_kits) _kits.style.display = 'none';
        const _lab = document.querySelector('.buy-label'); if (_lab) _lab.textContent = 'Order confirmed';

        history.replaceState({}, '', window.location.pathname); // tidy the URL
        setTimeout(() => panel.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
      }
  
  }
})();
