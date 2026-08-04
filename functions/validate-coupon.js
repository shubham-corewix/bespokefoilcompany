// netlify/functions/validate-coupon.js
// Validates a coupon code against Stripe Promotion Codes so codes can be
// created, expired or deactivated from the Stripe dashboard with no deploy.
//
// Setup (Stripe dashboard > Products > Coupons):
//   1. Create a Coupon (e.g. 20% off, currency GBP if amount-based)
//   2. Add a Promotion Code to it (e.g. EXTRA20), tick "active"
//
// Returns { valid, code, percentOff, amountOff, label } - display only.
// The authoritative application happens in create-payment-intent.js,
// which re-validates the code at payment time.

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  let code = '';
  try { code = String(JSON.parse(event.body || '{}').code || '').trim().toUpperCase(); }
  catch { return { statusCode: 400, body: 'Invalid JSON' }; }
  if (!code || code.length > 40) return json({ valid: false });

  try {
    const promo = (await stripe.promotionCodes.list({ code, active: true, limit: 1 })).data[0];
    if (!promo || !promo.coupon || !promo.coupon.valid) return json({ valid: false });
    const c = promo.coupon;
    // Amount-based coupons must be GBP to apply here
    if (c.amount_off && c.currency !== 'gbp') return json({ valid: false });
    return json({
      valid: true,
      code,
      percentOff: c.percent_off || 0,
      amountOff: c.amount_off || 0, // pence
      label: c.percent_off ? c.percent_off + '% off' : '\u00A3' + (c.amount_off / 100).toFixed(2) + ' off'
    });
  } catch (err) {
    console.error('Coupon lookup failed:', err.message);
    return json({ valid: false });
  }
};

const json = (body) => ({
  statusCode: 200,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
});
