// netlify/functions/order-number.js
// Single source of truth for the customer-facing order number.
// Used by BOTH stripe-webhook.js (when creating the ShipStation order)
// and get-order.js (when the confirmation page looks it up), so the
// number a customer copies into WhatsApp is GUARANTEED to match the
// order in ShipStation. Never build this string anywhere else.

function buildOrderNumber(paymentIntent) {
  const orderRef = (paymentIntent.metadata && paymentIntent.metadata.orderRef) || '';
  const tail = paymentIntent.id.slice(-8).toUpperCase();
  return 'ADDON-' + (orderRef ? orderRef + '-' : '') + tail;
}

function buildKitOrderNumber(paymentIntent) {
  const tail = paymentIntent.id.slice(-8).toUpperCase();
  return 'KS-' + tail;
}

module.exports = { buildOrderNumber, buildKitOrderNumber };
