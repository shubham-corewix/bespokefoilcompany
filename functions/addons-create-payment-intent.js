// netlify/functions/create-payment-intent.js
// Creates a Stripe PaymentIntent. Totals, options and personalisation are
// ALWAYS validated and recalculated here against the trusted catalogue -
// the client only sends SKUs, quantities and the customer's choices.
//
// Env vars: STRIPE_SECRET_KEY

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const CARD_FOIL = ['Black Card | Gold Foil','Black Card | Rose Gold Foil','Black Card | Silver Foil','White Card | Gold Foil','White Card | Rose Gold Foil','White Card | Silver Foil'];
const FRAME = ['Ash','Black','Oak','Walnut','White'];
const NAME_POSITION = ['Bottom','Top'];
const NAME_FONT = ['Cursive','Modern'];

// Mirrors the Wix catalogue export (catalog_products.csv) and index.html.
const CATALOGUE = {
  'PM-PRINT': { name:'Perfect Match Print - Extra Print', amount:995 },
  'PM-FRAME': { name:'Perfect Match Frame - Extra Framed Print', amount:1995 },
  'CK-PRINT': { name:'Custom Keepsake - Extra Print', amount:1495,
    options:{ cardFoil:CARD_FOIL },
    fields:{ personalisation:{ max:200, required:true } } },
  'CK-FRAME': { name:'Custom Keepsake - Extra Framed Print', amount:2495,
    options:{ cardFoil:CARD_FOIL, frame:FRAME },
    fields:{ personalisation:{ max:500, required:true } } },
  'TK-A5': { name:'Treasured Keepsake - A5 Framed Print', amount:1995,
    options:{ cardFoil:CARD_FOIL, frame:FRAME, handFoot:['Hand','Foot'],
              namePosition:NAME_POSITION, nameFont:NAME_FONT },
    fields:{ notes:{ max:500 } } },
  'HK-A3': { name:'Heritage Keepsake - A3 Framed Print', amount:3495,
    options:{ cardFoil:CARD_FOIL, frame:FRAME },
    fields:{ notes:{ max:500 } } },
  'MK-KEY': { name:'Miniature Keepsake - Keyring', amount:1495,
    options:{ keyringFoil:['Gold','Silver','Rose Gold','Gun Metal'], handFoot:['Foot','Hand'] },
    fields:{ name:{ max:10 } } },
  'POST-EXP': { name:'Express Tracked Postage', amount:395, maxQty:1 },
  'POST-STD': { name:'2nd Class Postage',        amount:295, maxQty:1 }
};

const POSTAGE_STD  = 'POST-STD';
const POSTAGE_SKU  = 'POST-EXP';
const POSTAGE_SKUS = [POSTAGE_STD, POSTAGE_SKU];
const DISCOUNT_THRESHOLD = 4000; // £40
const DISCOUNT_RATE = 0.20;
const KEYRING_SKU = 'MK-KEY';
const KEYRING_DEAL_QTY = 3;
const KEYRING_DEAL_RATE = 0.20;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  let payload;
  try { payload = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, body: 'Invalid JSON' }; }

  const lines = Array.isArray(payload.lines) ? payload.lines : [];
  if (!lines.length || lines.length > 40) return { statusCode: 400, body: 'Invalid cart' };

  /* Follow-up orders (the week-later "anything you missed?" link) ship on their
     own, so postage is mandatory. Enforced HERE, not just in the browser - the
     UI stops someone removing the line, but only the server decides what gets
     charged. If the client omits it, we put it back.
     Note this can only ADD cost, never remove it. */
  const FOLLOWUP = payload.followup === true;
  if (FOLLOWUP) {
    /* Exactly one postage line, always. £2.95 2nd class unless they upgraded to
       £3.95 Tracked 24, and never both - two lots of carriage on one parcel
       would be an overcharge, and this is the only place that can guarantee it. */
    const express = lines.some(l => l && l.sku === POSTAGE_SKU);
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i] && lines[i].sku === POSTAGE_STD && express) lines.splice(i, 1);
    }
    if (!lines.some(l => l && POSTAGE_SKUS.indexOf(l.sku) > -1)) {
      lines.push({ sku: POSTAGE_STD, qty: 1, options: {}, fields: {} });
    }
  }

  let subtotal = 0, keyringSub = 0, keyringQty = 0;
  const validated = [];

  for (const line of lines) {
    const product = CATALOGUE[line.sku];
    if (!product) return { statusCode: 400, body: 'Unknown item' };

    let qty = Math.max(1, parseInt(line.qty, 10) || 0);
    qty = Math.min(product.maxQty || 20, qty);

    // Validate dropdown options against allowed values
    const options = {};
    for (const [key, allowed] of Object.entries(product.options || {})) {
      const v = line.options && line.options[key];
      if (!allowed.includes(v)) return { statusCode: 400, body: 'Invalid option for ' + line.sku };
      options[key] = v;
    }

    // Validate personalisation fields (required + length caps from Wix)
    const fields = {};
    for (const [key, spec] of Object.entries(product.fields || {})) {
      const raw = line.fields && line.fields[key];
      const v = typeof raw === 'string' ? raw.trim().slice(0, spec.max) : '';
      if (spec.required && !v) return { statusCode: 400, body: 'Missing personalisation for ' + line.sku };
      if (v) fields[key] = v;
    }

    subtotal += product.amount * qty;
    if (line.sku === KEYRING_SKU) { keyringSub += product.amount * qty; keyringQty += qty; }
    validated.push({ sku: line.sku, name: product.name, qty, unitAmount: product.amount, options, fields });
  }

  /* One postage line per parcel, whichever service. Rejected rather than
     silently collapsed: two postage lines means the browser sent something we
     do not understand, and guessing which to keep is how people get overcharged. */
  const postageLines = validated.filter(v => POSTAGE_SKUS.indexOf(v.sku) > -1);
  if (postageLines.length > 1) return { statusCode: 400, body: 'Duplicate postage line' };

  /* Standard postage only exists on follow-up parcels. On the normal link
     postage is free, so a POST-STD line there is either a stale basket or
     someone editing the request. Either way it must not be charged. */
  if (!FOLLOWUP && validated.some(v => v.sku === POSTAGE_STD)) {
    return { statusCode: 400, body: 'Standard postage is not chargeable on this order' };
  }

  const keyringDisc = keyringQty >= KEYRING_DEAL_QTY ? Math.round(keyringSub * KEYRING_DEAL_RATE) : 0;
  const afterKeyring = subtotal - keyringDisc;

  /* Mandatory postage is carriage, not a purchase: it neither counts towards
     the £40 threshold nor attracts the 20%. Mirrors totals() in index.html -
     if you change one, change the other or the browser will quote a figure
     Stripe refuses. */
  const forcedPostage = FOLLOWUP
    ? validated.filter(v => POSTAGE_SKUS.indexOf(v.sku) > -1).reduce((n, v) => n + v.unitAmount * v.qty, 0)
    : 0;
  const discountable = afterKeyring - forcedPostage;
  const basketDisc = discountable >= DISCOUNT_THRESHOLD ? Math.round(discountable * DISCOUNT_RATE) : 0;
  const afterBasket = afterKeyring - basketDisc;

  // Coupon: re-validated here against Stripe at payment time - the client's
  // earlier validate-coupon result is display-only and never trusted.
  let couponDisc = 0, couponCode = '';
  const requestedCode = String(payload.couponCode || '').trim().toUpperCase();
  if (requestedCode) {
    try {
      const promo = (await stripe.promotionCodes.list({ code: requestedCode, active: true, limit: 1 })).data[0];
      if (promo && promo.coupon && promo.coupon.valid &&
          !(promo.coupon.amount_off && promo.coupon.currency !== 'gbp')) {
        couponCode = requestedCode;
        couponDisc = promo.coupon.percent_off
          ? Math.round(afterBasket * promo.coupon.percent_off / 100)
          : Math.min(promo.coupon.amount_off, afterBasket);
      } else {
        return { statusCode: 400, body: 'Coupon code is no longer valid' };
      }
    } catch (err) {
      console.error('Coupon revalidation failed:', err.message);
      return { statusCode: 400, body: 'Coupon code is no longer valid' };
    }
  }

  /* Stripe will not take less than 30p in GBP. Cap the coupon so the charge
     lands exactly on the floor rather than rejecting the payment: a big enough
     discount used to return "Order total too low after discounts", which reads
     as broken checkout when it is really just arithmetic. The customer still
     gets the largest discount that can actually be charged. */
  if (couponDisc > 0 && afterBasket - couponDisc < 30) {
    couponDisc = Math.max(0, afterBasket - 30);
  }

  const total = afterBasket - couponDisc;
  // Nothing left to do if the basket itself is under the floor.
  if (total < 30) return { statusCode: 400, body: 'Order total too low after discounts' };

  /* A near-total discount is a test, not a sale. Flag it loudly so nobody
     presses a real keepsake for it and so it can be filtered out of reporting. */
  const isTestOrder = couponDisc > 0 && afterBasket > 0 && (couponDisc / afterBasket) >= 0.9;

  // Stripe metadata is capped at 500 chars per value; chunk the lines JSON.
  const linesJson = JSON.stringify(validated);
  if (linesJson.length > 16 * 480) return { statusCode: 400, body: 'Cart too large' };
  const metadata = {
    source: 'main-addons-landing',
    orderRef: String(payload.orderRef || '').slice(0, 50),
    phone: String(payload.phone || '').slice(0, 40),
    subtotal: String(subtotal),
    followup: FOLLOWUP ? 'yes' : 'no',
    keyringDisc: String(keyringDisc),
    basketDisc: String(basketDisc),
    couponCode: couponCode,
    couponDisc: String(couponDisc),
    testOrder: isTestOrder ? 'yes' : 'no'
  };
  for (let i = 0; i * 480 < linesJson.length; i++) {
    metadata['lines_' + i] = linesJson.slice(i * 480, (i + 1) * 480);
  }

  try {
    const intent = await stripe.paymentIntents.create({
      amount: total,
      currency: 'gbp',
      automatic_payment_methods: { enabled: true },
      receipt_email: payload.email || undefined,
      description: 'Memory Catcher Add-ons' + (payload.orderRef ? ` (order ${payload.orderRef})` : ''),
      metadata
    });
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientSecret: intent.client_secret })
    };
  } catch (err) {
    console.error('Stripe error:', err.message);
    return { statusCode: 500, body: 'Payment setup failed' };
  }
};
