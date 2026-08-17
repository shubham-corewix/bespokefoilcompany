// netlify/functions/validate-affiliate-code.js
//
// Looks a Memory Catcher discount code up in Supabase and returns the
// franchisee it belongs to. Display only - create-payment-intent re-validates
// the code at payment time and never trusts what the browser sends.
//
// WHY THIS EXISTS
// The affiliate box on /memory-catcher/<slug> shows a code with a "Copy Code"
// button. The customer copies it and then has NOWHERE TO PASTE IT - the kit
// checkout had no code field at all. So the whole affiliate offer was a dead
// end: the slug travelled to Stripe for commission, but the code did nothing.
//
// The real use case is offline. Ashley hands a card with a code to a parent at
// a baby class; that parent later lands on the ordinary product page, not on
// Ashley's page. The code is the only thing carrying the attribution, so it has
// to work from anywhere on the site.
//
// WHAT THE CODE DOES, AND DOES NOT, DO
// The offer is a FREE EXTRA COPY of the print - it does NOT change the price.
// That is the single most important property here: a valid code alters
// fulfilment, never the amount charged. There is no discount arithmetic in the
// payment path and therefore no way for a leaked or forged code to under-charge
// an order. The worst a bad code can do is credit the wrong franchisee, which
// is recoverable; under-charging is not.
//
// Table: franchisees (slug, name, discount_code, active) - same one the
// /memory-catcher/<slug> edge function reads.

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  let code = '';
  try {
    code = String(JSON.parse(event.body || '{}').code || '').trim().toUpperCase();
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  // Shape guard before touching the network. Codes are like ASHLEY-WIG.
  if (!/^[A-Z0-9-]{3,40}$/.test(code)) return json({ valid: false });

  const row = await lookup(code);
  if (row) {
    return json({
      valid: true,
      kind: 'affiliate',
      code,
      slug: row.slug,
      name: row.name,
      // Copy is returned by the server so the offer wording lives in one place
      // rather than being repeated in every page's JavaScript.
      offer: 'FREE extra copy of your print',
    });
  }

  /* Not a Memory Catcher code - try a Stripe promotion code before giving up.
     ------------------------------------------------------------------------
     The main site used to accept affiliate codes ONLY, so a discount code
     created in the Stripe dashboard came back "not recognised" here while
     working perfectly on the add-ons app. Two systems behind one input, and
     nothing on screen said which kind of code the field wanted. Ryan asked for
     both to work, 13/08.

     Display only, as with the affiliate branch. create-payment-intent.js
     re-validates and applies the discount at payment time; nothing the browser
     reports is trusted. */
  const promo = await lookupPromo(code);
  if (promo) return json({ valid: true, kind: 'coupon', code, ...promo });

  return json({ valid: false });
};

async function lookupPromo(code) {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.log('[coupon] STRIPE_SECRET_KEY missing - promotion codes cannot be checked');
    return null;
  }
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const p = (await stripe.promotionCodes.list({ code, active: true, limit: 1 })).data[0];
    if (!p || !p.coupon || !p.coupon.valid) return null;
    const c = p.coupon;
    // An amount-based coupon in another currency cannot be applied to a GBP charge.
    if (c.amount_off && c.currency !== 'gbp') return null;
    return {
      percentOff: c.percent_off || 0,
      amountOff: c.amount_off || 0,                 // pence
      offer: c.percent_off
        ? `${c.percent_off}% off your order`
        : `\u00A3${(c.amount_off / 100).toFixed(2)} off your order`,
    };
  } catch (err) {
    console.error('[coupon] Stripe lookup failed:', err.message);
    return null;
  }
}

async function lookup(code) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.log('[affiliate-code] SUPABASE_URL or SUPABASE_ANON_KEY missing');
    return null;
  }
  try {
    const endpoint = `${url}/rest/v1/franchisees`
      + `?discount_code=eq.${encodeURIComponent(code)}`
      + `&active=eq.true`
      + `&select=slug,name,discount_code,active&limit=1`;
    const r = await fetch(endpoint, {
      headers: { apikey: key, authorization: `Bearer ${key}` },
    });
    if (!r.ok) {
      console.error('[affiliate-code] Supabase returned', r.status);
      return null;
    }
    const rows = await r.json();
    return (Array.isArray(rows) && rows[0]) ? rows[0] : null;
  } catch (err) {
    console.error('[affiliate-code] lookup failed:', err.message);
    return null;
  }
}

const json = (body) => ({
  statusCode: 200,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

module.exports.lookupAffiliateCode = lookup;
