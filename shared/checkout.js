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

  var DRAWER_HTML = "<div class=\"checkout-drawer\" id=\"checkoutDrawer\" hidden>\n          <div class=\"cd-panel\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"cd-title\">\n            <button class=\"cd-close\" id=\"cdClose\" aria-label=\"Close checkout\">&#10005;</button>\n            <h3 id=\"cd-title\" class=\"cd-title\">Complete your order</h3>\n            <div class=\"cd-summary\" id=\"cdSummary\"></div>\n\n            <!-- Express wallets first (Apple Pay / Google Pay / Link / PayPal /\n               Klarna). Mirrors the add-ons panel: wallets are the headline,\n               the card form is opt-in behind a button so the drawer opens\n               short rather than as a wall of inputs. -->\n            <div id=\"expressBlock\" class=\"cd-express-block\" hidden>\n              <p class=\"cd-express-label\">Express checkout</p>\n              <div id=\"expressCheckoutElement\"></div>\n              <div class=\"cd-or\" id=\"cdOr\"><span>or</span></div>\n            </div>\n\n            <!-- Email sits OUTSIDE the collapsed card block, so it is visible as\n               soon as the drawer opens. Wallets supply their own email, so it\n               is only validated on the card path (see confirm()). Capturing it\n               up front also means a drop-off still leaves a contactable lead. -->\n            <label class=\"cd-label\" for=\"cdEmail\">Email</label>\n            <input class=\"cd-email\" id=\"cdEmail\" type=\"email\" autocomplete=\"email\" placeholder=\"you@example.com\"\n              required>\n\n            <!-- Card fields: mounted only when the customer asks for them -->\n            <div id=\"cardUi\" hidden>\n              <div id=\"addressElement\"></div>\n              <div id=\"paymentElement\"></div>\n              <button class=\"cd-pay\" id=\"cdPay\" disabled><span id=\"cdPayLabel\">Pay</span></button>\n            </div>\n\n            <button class=\"cd-pay\" id=\"cdStartCard\">Or Pay with Card</button>\n            <p class=\"cd-error\" id=\"cdError\" role=\"alert\"></p>\n            <p class=\"cd-secure\"><svg viewBox=\"0 0 24 24\" width=\"12\" height=\"12\">\n                <path d=\"M6 10V7a6 6 0 0 1 12 0v3\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" />\n                <rect x=\"4\" y=\"10\" width=\"16\" height=\"10\" rx=\"2\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" />\n              </svg> Secure checkout powered by Stripe</p>\n          </div>\n        </div>";

  var DRAWER_CSS = ".cd-label{font-size: 12px; color: var(--ink-soft); margin: 0 0 8px; display: block}\n.cd-email{width: 100%; height: 44px; border: 1px solid var(--hairline); border-radius: 10px; padding: 0 14px; font-family: inherit; font-size: 15px; background: var(--white); margin-bottom: 14px;}\n.cd-email:focus{outline: none; border-color: var(--ink)}\n.success-panel{margin-top: 16px; background: var(--white); border: 1px solid var(--hairline); border-radius: var(--r-card); padding: 28px; text-align: center;}\n.success-panel h2{font-family: var(--serif); font-weight: 420; font-size: 24px; margin-bottom: 10px}\n.success-panel p{font-size: 14.5px; line-height: 1.65; color: var(--ink-soft); max-width: 44ch; margin: 0 auto}\n.checkout-drawer{position: fixed; inset: 0; z-index: 200; display: flex; align-items: flex-end; justify-content: center; background: rgba(0, 0, 0, .5); backdrop-filter: blur(2px);}\n.checkout-drawer[hidden]{display: none !important}\n.cd-panel{background: var(--white); width: 100%; max-width: 460px; max-height: 92vh; overflow-y: auto; border-radius: 18px 18px 0 0; padding: 28px 24px calc(28px + env(safe-area-inset-bottom)); position: relative;}\n.cd-close{position: absolute; top: 16px; right: 16px; width: 34px; height: 34px; border: 0; border-radius: 50%; background: var(--porcelain); font-size: 15px; display: grid; place-items: center; color: var(--ink);}\n.cd-title{font-family: var(--serif); font-weight: 420; font-size: 22px; margin-bottom: 6px; padding-right: 36px;}\n.cd-summary{font-size: 14px; color: var(--ink-soft); padding-bottom: 18px; margin-bottom: 18px; border-bottom: 1px solid var(--hairline);}\n.cd-summary .row{display: flex; justify-content: space-between; margin-top: 4px}\n.cd-summary .row.total{color: var(--ink); font-weight: 600; font-size: 15px; margin-top: 10px}\n.cd-line{display: flex; gap: 12px; padding-bottom: 14px; margin-bottom: 12px; border-bottom: 1px solid var(--hairline)}\n.cd-line .thumb{width: 56px; height: 56px; object-fit: cover; border-radius: 8px; flex: none; background: var(--porcelain)}\n.cd-line-info{flex: 1; min-width: 0}\n.cd-line-name{color: var(--ink); font-weight: 500; font-size: 14.5px; line-height: 1.35}\n.cd-line-amt{white-space: nowrap; font-weight: 600; color: var(--ink); font-size: 14.5px}\n.cd-qty{display: inline-flex; align-items: center; margin-top: 8px; border: 1px solid var(--hairline); border-radius: 99px; background: var(--porcelain); overflow: hidden;}\n.cd-qty button{width: 32px; height: 32px; border: 0; background: none; font-size: 16px; line-height: 1; color: var(--ink)}\n.cd-qty button:disabled{opacity: .3}\n.cd-qty span{min-width: 24px; text-align: center; font-weight: 700; font-size: 13px}\n.cd-express-block[hidden]{display: none}\n.cd-express-label{font-size: 11.5px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-faint); margin: 18px 0 10px;}\n.cd-or{text-align: center; margin: 16px 0; font-size: 12px; color: var(--ink-faint); position: relative;}\n.cd-or span{background: var(--white); padding: 0 12px; position: relative; z-index: 1}\n.cd-or::before{content: \"\"; position: absolute; left: 0; right: 0; top: 50%; height: 1px; background: var(--hairline);}\n.cd-pay{width: 100%; height: 52px; margin-top: 20px; background: var(--ink); color: var(--white); border: 0; border-radius: var(--r-btn); font-size: 16px; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 8px;}\n.cd-pay:disabled{opacity: .55}\n.cd-pay .spin{width: 16px; height: 16px; border: 2px solid rgba(255, 255, 255, .4); border-top-color: #fff; border-radius: 50%; animation: cdspin .7s linear infinite;}\n.cd-error{color: #c0392b; font-size: 13px; margin-top: 12px; min-height: 0; text-align: center}\n.cd-secure{display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 11.5px; color: var(--ink-faint); margin-top: 16px;}\n@media (min-width:720px){.checkout-drawer{align-items: center}}\n@media (min-width:720px){.cd-panel{border-radius: 18px; padding: 32px}}";

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
        const _startBtn = document.getElementById('cdStartCard');
        _startBtn.hidden = false;
        _startBtn.disabled = false;
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
          console.log('[keepsake checkout] calling create-payment-intent', { sku: SKU[cfg.getKit().kit], kit: cfg.getKit().kit });
          const res = await fetch('/.netlify/functions/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sku: SKU[cfg.getKit().kit],
              qty: cfg.getQty(),
              // Memory Catcher attribution - null on the plain kit page.
              affiliate: cfg.getAffiliate ? cfg.getAffiliate() : null,
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
            throw new Error('Sorry - checkout could not start. Please refresh and try again.');
          }
        } catch (err) {
          cdError.textContent = err.message.startsWith('Sorry') ? err.message
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
        cdPayBtn.disabled = true;
        const orig = document.getElementById('cdPayLabel').textContent;
        if (!isExpress) cdPayBtn.innerHTML = '<span class="spin"></span>';

        const { error } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: window.location.origin + location.pathname + '?paid=1&amt=' + (window.__lastTotal || 0) + '&sku=' + SKU[cfg.getKit().kit],
            ...(email ? { receipt_email: email } : {}),
          },
        });
        // If we get here, there was an immediate error (otherwise the browser redirects)
        if (error) {
          cdError.textContent = error.message || 'Payment could not be completed.';
          cdPayBtn.disabled = false;
          document.getElementById('cdPayLabel').textContent = orig;
          cdPayBtn.innerHTML = '<span id="cdPayLabel">' + orig + '</span>';
        }
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
      cdPayBtn.addEventListener('click', () => confirm(false));

      /* post-payment confirmation (Stripe redirects back with ?paid=1) */
      if (new URLSearchParams(location.search).get('paid') === '1') {
        const qs = new URLSearchParams(location.search);
        if (typeof fbq === 'function') fbq('track', 'Purchase', {
          content_ids: [qs.get('sku') || 'BFC-KIT'],
          content_type: 'product',
          value: (parseInt(qs.get('amt') || '0', 10)) / 100,
          currency: 'GBP',
          num_items: 1
        }, { eventID: qs.get('payment_intent') || undefined });
        const panel = document.getElementById('successPanel');
        panel.hidden = false;
        document.querySelector('.express').style.display = 'none';
        document.getElementById('kits').style.display = 'none';
        document.querySelector('.buy-label').textContent = 'Order confirmed';
        history.replaceState({}, '', window.location.pathname); // tidy the URL
        setTimeout(() => panel.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
      }
  
  }
})();
