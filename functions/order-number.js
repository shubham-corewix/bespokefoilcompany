// netlify/functions/order-number.js
// Single source of truth for BOTH customer-facing order number formats.
//
//   buildOrderNumber()     ADDON-...  the add-ons app
//                          used by addons-stripe-webhook.js and get-order.js
//   buildKitOrderNumber()  KS-...     the kit checkout
//                          used by stripe-webhook.js and
//                          affiliate-commission-webhook.js
//
// Format confirmed by Ryan 10/08/2026: KS-xxxxxxxx, starting fresh rather than
// continuing the Wix 10xxx sequence.
//
// WHY BOTH LIVE HERE. Until 10/08 the KS- form was written out by hand in THREE
// places - once in stripe-webhook.js and twice in affiliate-commission-webhook.js
// - while this file's own comment said "never build this string anywhere else".
// Nothing was broken, because all three expressions happened to agree. But the
// commission ledger is one of them: if the format ever changed and one of the
// three was missed, franchisees would be paid against order numbers that do not
// exist in ShipStation, and the mismatch would only surface at reconciliation.
//
// Never build either string anywhere else. This time the comment is true.

function buildOrderNumber(paymentIntent) {
  const orderRef = (paymentIntent.metadata && paymentIntent.metadata.orderRef) || '';
  const tail = paymentIntent.id.slice(-8).toUpperCase();
  return 'ADDON-' + (orderRef ? orderRef + '-' : '') + tail;
}

/* The kit checkout. `pi.id` is a Stripe PaymentIntent ID; the last 8 characters
   are from its random suffix. Upper-cased for legibility on an invoice and over
   the phone, which does collapse the alphabet from 62 to 36 - about 2.8e12
   possible numbers. At BFC's volumes a collision is vanishingly unlikely, and
   would not lose an order in any case: the PaymentIntent ID remains the key,
   and this string is only ever a human-facing label. */
function buildKitOrderNumber(paymentIntent) {
  return 'KS-' + paymentIntent.id.slice(-8).toUpperCase();
}

module.exports = { buildOrderNumber, buildKitOrderNumber };
