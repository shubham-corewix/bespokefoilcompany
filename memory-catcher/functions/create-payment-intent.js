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

/* ---- TRUSTED CATALOGUE (server-side source of truth) ----
   Prices in pence. Verified against the Wix product export:
   base 34.95, surcharges of 15.00 and 25.00 giving 49.95 and 59.95. */
const CATALOGUE = {
  'BFC-KIT-FOIL':   { name: 'Foil Print Kit',       amount: 3495 },
  'BFC-KIT-FRAMED': { name: 'Framed Foil Print Kit', amount: 4995 },
  'BFC-KIT-PREM':   { name: 'Premium Kit',           amount: 5995 },
};

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
    const { sku, qty, personalisation, affiliate, fbp, fbc, page } = JSON.parse(event.body || '{}');
    const clientIp = event.headers['x-nf-client-connection-ip']
      || (event.headers['x-forwarded-for'] || '').split(',')[0].trim() || '';
    const clientUa = (event.headers['user-agent'] || '').slice(0, 480);
    if (!sku) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing sku' }) };
    }

    const { item, qty: quantity, subtotal, postage, total } = priceOrder(sku, qty);

    const intent = await stripe.paymentIntents.create({
      amount: total,
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
        ...(cleanAffiliate(affiliate) ? { affiliate_slug: cleanAffiliate(affiliate) } : {}),
        unit_price_pence: String(item.amount),
        subtotal_pence: String(subtotal),
        postage_pence: String(postage),
        /* attribution signals for the server-side Meta CAPI event (webhook) */
        fbp: fbp || '',
        fbc: fbc || '',
        client_ip: clientIp,
        client_ua: clientUa,
        event_source_url: (page || '').slice(0, 480),
        source: 'keepsake-landing',
      },
      description: `${quantity}x ${item.name} - keepsake.thebespokefoilcompany.co.uk`,
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientSecret: intent.client_secret,
        amount: total,
        breakdown: { subtotal, postage, total },
      }),
    };
  } catch (err) {
    console.error('create-payment-intent error:', err.message);
    return { statusCode: 400, body: JSON.stringify({ error: err.message }) };
  }
};
