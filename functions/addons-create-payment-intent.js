// netlify/functions/create-payment-intent.js
// Creates a Stripe PaymentIntent. Totals, options and personalisation are
// ALWAYS validated and recalculated here against the trusted catalogue -
// the client only sends SKUs, quantities and the customer's choices.
//
// Env vars: STRIPE_SECRET_KEY

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const CARD_FOIL = ['Black Card | Gold Foil','Black Card | Rose Gold Foil','Black Card | Silver Foil','White Card | Gold Foil','White Card | Silver Foil'];
const FRAME = ['Ash','Black','Oak','Walnut','White'];

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
    options:{ cardFoil:CARD_FOIL, frame:FRAME, handFoot:['Hand','Foot'] },
    fields:{ notes:{ max:500 } } },
  'HK-A3': { name:'Heritage Keepsake - A3 Framed Print', amount:3495,
    options:{ cardFoil:CARD_FOIL, frame:FRAME },
    fields:{ notes:{ max:500 } } },
  'MK-KEY': { name:'Miniature Keepsake - Keyring', amount:1495,
    options:{ keyringFoil:['Gold','Silver','Rose Gold','Gun Metal'], handFoot:['Foot','Hand'] },
    fields:{ name:{ max:10 } } },
  'POST-EXP': { name:'Express Tracked Postage', amount:395, maxQty:1 }
};

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

  // Postage upgrade: collapse to a single unit however it arrives
  const postageLines = validated.filter(v => v.sku === 'POST-EXP');
  if (postageLines.length > 1) return { statusCode: 400, body: 'Duplicate postage upgrade' };

  const keyringDisc = keyringQty >= KEYRING_DEAL_QTY ? Math.round(keyringSub * KEYRING_DEAL_RATE) : 0;
  const afterKeyring = subtotal - keyringDisc;
  const basketDisc = afterKeyring >= DISCOUNT_THRESHOLD ? Math.round(afterKeyring * DISCOUNT_RATE) : 0;
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

  const total = afterBasket - couponDisc;
  // Stripe's minimum charge is 30p GBP
  if (total < 30) return { statusCode: 400, body: 'Order total too low after discounts' };

  // Stripe metadata is capped at 500 chars per value; chunk the lines JSON.
  const linesJson = JSON.stringify(validated);
  if (linesJson.length > 16 * 480) return { statusCode: 400, body: 'Cart too large' };
  const metadata = {
    source: 'main-addons-landing',
    orderRef: String(payload.orderRef || '').slice(0, 50),
    phone: String(payload.phone || '').slice(0, 40),
    subtotal: String(subtotal),
    keyringDisc: String(keyringDisc),
    basketDisc: String(basketDisc),
    couponCode: couponCode,
    couponDisc: String(couponDisc)
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
