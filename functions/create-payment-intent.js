/**
 * create-payment-intent.js
 * Bespoke Foil Company - Keepsake kit checkout
 *
 * Mirrors the bfc-addons pattern. The browser sends ONLY a SKU (which kit).
 * This function is the single source of truth for price: it looks the kit up
 * in the trusted catalogue below, adds postage, and creates the PaymentIntent
 * server-side. Client-sent totals are never trusted.
 *
 * Env vars (set in Netlify, REDEPLOY after any change):
 *   STRIPE_SECRET_KEY   - sk_test_... then sk_live_...
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/* Memory Catcher affiliate codes are re-validated HERE, against Supabase, at
   payment time. The browser's earlier validate-affiliate-code result is display
   only and is never trusted - same principle the add-ons checkout already uses
   for Stripe promotion codes. */
const { lookupAffiliateCode } = require('./validate-affiliate-code');

/* ---- TRUSTED CATALOGUE (server-side source of truth) ----
   Prices in pence. Verified against the Wix product export:
   base 34.95, surcharges of 15.00 and 25.00 giving 49.95 and 59.95. */
const CATALOGUE = {
  'BFC-KIT-FOIL':   { name: 'Foil Print Kit',       amount: 3495 },
  'BFC-KIT-FRAMED': { name: 'Framed Foil Print Kit', amount: 4995 },
  'BFC-KIT-PREM':   { name: 'Premium Kit',           amount: 5995 },
};

/* ---- TEST SKU ----------------------------------------------------------
   A £1 order that runs the whole real path - live keys, real card, webhook,
   ShipStation, confirmation email, Trustpilot invitation - so checkout can be
   proven end to end without putting £50 through a personal card each time.

   Deliberately NOT a discount code. A percentage code attaches to the REAL
   products, so if it leaks, real kits sell for a pound. This is a separate
   product nobody is browsing: if the SKU leaks, someone buys a thing that does
   not exist, and the order is obvious in ShipStation.

   FOUR CONTROLS, any one of which shuts it off:
     1. TEST_SKU_ENABLED must be exactly 'true' in the Netlify env. Not set =
        the SKU behaves like any unknown SKU and 400s. Turning it off is a
        dashboard toggle, NO DEPLOY - which matters, because the moment you
        need it off is the moment you cannot wait for a build.
     2. TEST_SKU_EXPIRES is a hard backstop for when someone forgets step 1.
     3. Quantity forced to 1.
     4. Every use is logged, so a stray charge shows up in the function log.

   Remove this block and the two lines in priceOrder() to delete it entirely. */
const TEST_SKU = 'BFC-KIT-TEST';
const TEST_SKU_EXPIRES = '2026-09-30';            // hard stop, whatever the env says

function testSkuLive() {
  if (process.env.TEST_SKU_ENABLED !== 'true') return false;
  if (new Date() > new Date(TEST_SKU_EXPIRES + 'T23:59:59Z')) {
    console.warn(`[test-sku] TEST_SKU_ENABLED is set but the SKU expired on ${TEST_SKU_EXPIRES}. Refusing.`);
    return false;
  }
  return true;
}

/* ---- POSTAGE ----
   Royal Mail next working day: flat £4.95 on a single kit.
   FREE on 2 or more kits (Ryan, 20/07/2026) - this drives the
   "Add a second kit and get FREE postage" message in the cart.

   NOTE: this is deliberately a QUANTITY rule, not the old £75 value
   threshold. Under the value rule 2x Foil Print Kit came to £69.90 and
   would still have been charged postage, making the on-page promise
   false. Quantity is the only rule that holds for every combination.
   The £75 threshold is retained below as a secondary trigger so a single
   high-value order is not worse off. */
const KIT_POSTAGE = 495;               // £4.95 in pence
const FREE_POSTAGE_THRESHOLD = 7500;   // £75.00 in pence
const FREE_POSTAGE_QTY = 2;            // 2+ kits ship free
const MAX_QTY = 10;                    // sanity cap per order

const CURRENCY = 'gbp';

function priceOrder(sku, qty) {
  if (sku === TEST_SKU) {
    if (!testSkuLive()) throw new Error(`Unknown SKU: ${sku}`);   // same error as any bad SKU
    console.warn('[test-sku] £1 TEST ORDER - this is not a real sale');
    return { item: { name: 'TEST ORDER - do not fulfil', amount: 100 },
             qty: 1, subtotal: 100, postage: 0, total: 100 };
  }
  const item = CATALOGUE[sku];
  if (!item) throw new Error(`Unknown SKU: ${sku}`);
  // Coerce and clamp: never trust a quantity from the browser.
  const q = Math.max(1, Math.min(MAX_QTY, parseInt(qty, 10) || 1));
  const subtotal = item.amount * q;
  const freePostage = q >= FREE_POSTAGE_QTY || subtotal >= FREE_POSTAGE_THRESHOLD;
  const postage = freePostage ? 0 : KIT_POSTAGE;
  return { item, qty: q, subtotal, postage, total: subtotal + postage };
}


/* ---- PERSONALISATION (optional) ----
   Collected on the landing page when the customer chooses "add details now".
   Stripe metadata values are capped at 500 chars and must be strings, so each
   field is trimmed and truncated. Never affects price - display/fulfilment only.
   When mode is 'later' the upload portal collects these instead. */
const PERS_ALLOWED = {
  card:  ['White', 'Black'],
  foil:  ['Gold', 'Silver', 'Rose gold'],
  frame: ['White', 'Black', 'Walnut', 'Oak', 'Ash'],
  font:  ['Modern', 'Cursive'],
};

function cleanPersonalisation(p) {
  if (!p || typeof p !== 'object' || p.mode !== 'now') {
    return { pers_mode: 'later' };
  }
  const pick = (key) => {
    const v = String(p[key] ?? '').trim();
    return PERS_ALLOWED[key].includes(v) ? v : '';
  };
  const free = (key, max) => String(p[key] ?? '').trim().slice(0, max);
  const out = {
    pers_mode: 'now',
    pers_card: pick('card'),
    pers_foil: pick('foil'),
    pers_frame: pick('frame'),
    pers_font: pick('font'),
    pers_name: free('name', 120),
    pers_dob: free('dob', 40),
    pers_time: free('time', 40),
  };
  // Strip empties so Stripe metadata stays tidy
  Object.keys(out).forEach((k) => { if (out[k] === '') delete out[k]; });
  return out;
}

/* Memory Catcher affiliate slug -> commission attribution.
   Kept to a safe charset and length; anything unexpected becomes ''.
   The webhook reads affiliate_slug from metadata to credit the franchisee. */
function cleanAffiliate(v){
  const slug = String(v || '').trim().toLowerCase();
  return /^[a-z0-9-]{1,60}$/.test(slug) ? slug : '';
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const { sku, qty, personalisation, affiliate, affiliateCode, couponCode, fbp, fbc, page } = JSON.parse(event.body || '{}');
    const clientIp = event.headers['x-nf-client-connection-ip']
      || (event.headers['x-forwarded-for'] || '').split(',')[0].trim() || '';
    const clientUa = (event.headers['user-agent'] || '').slice(0, 480);
    if (!sku) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing sku' }) };
    }

    const { item, qty: quantity, subtotal, postage, total } = priceOrder(sku, qty);

    /* ---- AFFILIATE CODE ----
       A valid code does TWO things: credits the franchisee, and flags a free
       extra copy for fulfilment. It does NOT change `total`.

       That is deliberate and it is the whole safety argument. Because no code
       path can alter the amount, a leaked, guessed or forged code cannot
       under-charge an order. The worst outcome is crediting the wrong Memory
       Catcher, which is visible in Stripe and recoverable. Under-charging is
       neither. This is why the offer stayed "free extra copy" rather than
       becoming a percentage discount.

       An unrecognised code is ignored silently rather than rejected - the
       customer has already paid attention to the basket; failing their order at
       the last step over a mistyped code would cost far more than the offer is
       worth. The UI tells them whether it applied before they reach this point. */
    let affiliateSlug = cleanAffiliate(affiliate);
    let freeExtraCopy = false;
    const rawCode = String(affiliateCode || '').trim().toUpperCase();
    if (rawCode && /^[A-Z0-9-]{3,40}$/.test(rawCode)) {
      const row = await lookupAffiliateCode(rawCode);
      if (row && row.slug) {
        affiliateSlug = cleanAffiliate(row.slug) || affiliateSlug;
        freeExtraCopy = true;
        console.log(`[affiliate] code ${rawCode} -> ${affiliateSlug}, free extra copy`);
      } else {
        console.log(`[affiliate] code ${rawCode} not recognised - order proceeds at full price, no credit`);
      }
    }

    /* ---- Stripe promotion code -------------------------------------------
     Added 13/08. The main site accepted Memory Catcher affiliate codes only,
     so a discount code created in the Stripe dashboard was rejected here while
     working on the add-ons app.

     Re-validated against Stripe at payment time and applied HERE, never from
     the browser's earlier answer - same rule the affiliate code already
     follows. A discount the client can name is a discount the client can
     invent.

     Applied to the product subtotal, not to postage. Postage is already free
     at 2+ kits or GBP 75, so discounting it as well would stack two offers
     that were never designed to combine. */
  let couponDisc = 0;
  let appliedCoupon = '';
  const rawCoupon = String(couponCode || '').trim().toUpperCase();
  if (rawCoupon && rawCoupon !== rawCode) {
    try {
      const promo = (await stripe.promotionCodes.list({
        code: rawCoupon, active: true, limit: 1,
      })).data[0];
      if (promo && promo.coupon && promo.coupon.valid
          && !(promo.coupon.amount_off && promo.coupon.currency !== 'gbp')) {
        couponDisc = promo.coupon.percent_off
          ? Math.round(subtotal * promo.coupon.percent_off / 100)
          : Math.min(promo.coupon.amount_off, subtotal);
        appliedCoupon = rawCoupon;
      } else {
        /* Fail the payment rather than silently charging full price. A
           customer who typed a code and then sees the full amount taken has a
           worse experience than one told the code expired. */
        return { statusCode: 400, headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'That code is no longer valid. Remove it and try again.' }) };
      }
    } catch (err) {
      console.error('[coupon] revalidation failed:', err.message);
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'That code could not be checked just now. Remove it and try again.' }) };
    }
  }

  /* Stripe will not take less than 30p in GBP. Cap the discount so the charge
     lands exactly on the floor instead of being rejected: a large enough
     discount would otherwise fail with an error that reads as broken checkout
     when it is really just arithmetic. Same handling as the add-ons app. */
  if (couponDisc > 0 && total - couponDisc < 30) {
    couponDisc = Math.max(0, total - 30);
  }
  const chargeable = total - couponDisc;
  if (couponDisc > 0) {
    console.log(`[coupon] ${appliedCoupon} -> -${couponDisc}p, charging ${chargeable}p`);
  }

  const intent = await stripe.paymentIntents.create({
      amount: chargeable,
      currency: CURRENCY,
      /* Surface every method enabled in the Stripe dashboard
         (cards, Apple Pay, Google Pay, Link, Klarna, PayPal)
         without hard-coding a list. Wallets still require the
         Payment Method Domain to be registered - see the brief. */
      automatic_payment_methods: { enabled: true },
      metadata: {
        ...cleanPersonalisation(personalisation),
        sku,
        product_name: item.name,
        quantity: String(quantity),
        ...(affiliateSlug ? { affiliate_slug: affiliateSlug } : {}),
        ...(freeExtraCopy ? { free_extra_copy: 'yes', affiliate_code: rawCode } : {}),
        unit_price_pence: String(item.amount),
        subtotal_pence: String(subtotal),
        postage_pence: String(postage),
      ...(couponDisc ? { coupon_code: appliedCoupon, coupon_discount_pence: String(couponDisc) } : {}),
        /* attribution signals for the server-side Meta CAPI event (webhook) */
        fbp: fbp || '',
        fbc: fbc || '',
        client_ip: clientIp,
        client_ua: clientUa,
        event_source_url: (page || '').slice(0, 480),
        source: 'main-keepsake-landing',
      },
      description: `${quantity}x ${item.name} - keepsake.thebespokefoilcompany.co.uk`,
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientSecret: intent.client_secret,
        amount: chargeable,
        breakdown: { subtotal, postage, discount: couponDisc, coupon: appliedCoupon, total: chargeable, gross: total },
      }),
    };
  } catch (err) {
    console.error('create-payment-intent error:', err.message);
    return { statusCode: 400, body: JSON.stringify({ error: err.message }) };
  }
};
