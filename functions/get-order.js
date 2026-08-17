// netlify/functions/get-order.js
// Called by the confirmation page with a PaymentIntent ID. Verifies the
// payment actually succeeded (so a shared/bookmarked success URL can't
// fake a confirmation) and returns the canonical order number - built
// with the SAME helper the ADD-ONS webhook uses, so it always matches
// ShipStation. Note this returns the ADDON- format: this endpoint serves the
// add-ons app only. The kit confirmation uses buildKitOrderNumber() via
// stripe-webhook.js. Wiring the kit pages here would show customers an order
// number that does not exist in ShipStation.
//
// Env: STRIPE_SECRET_KEY

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { buildOrderNumber } = require('./order-number');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  let pi_id = '';
  try { pi_id = String(JSON.parse(event.body || '{}').paymentIntent || '').trim(); }
  catch { return json(400, { ok: false }); }

  // Basic shape check before hitting Stripe
  if (!/^pi_[A-Za-z0-9]+$/.test(pi_id)) return json(400, { ok: false, reason: 'bad_id' });

  try {
    const pi = await stripe.paymentIntents.retrieve(pi_id);
    if (!pi) return json(404, { ok: false, reason: 'not_found' });

    // Only confirm a genuinely successful payment.
    if (pi.status !== 'succeeded') {
      return json(200, { ok: false, reason: 'not_succeeded', status: pi.status });
    }

    return json(200, {
      ok: true,
      orderNumber: buildOrderNumber(pi),
      amount: pi.amount,           // pence, for optional display
      email: pi.receipt_email || ''
    });
  } catch (err) {
    console.error('get-order lookup failed:', err.message);
    return json(500, { ok: false, reason: 'error' });
  }
};

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
});
