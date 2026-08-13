/**
 * stripe-webhook.js
 * Bespoke Foil Company - Keepsake kit checkout
 *
 * Fires on payment_intent.succeeded, verifies the Stripe signature, then
 * pushes the order into ShipStation. Same ShipStation store as bfc-addons.
 *
 * Env vars (Netlify, REDEPLOY after any change):
 *   STRIPE_SECRET_KEY       - sk_test_... / sk_live_...
 *   STRIPE_WEBHOOK_SECRET   - whsec_...  (from the webhook endpoint you create)
 *   SHIPSTATION_API_KEY     - reuse the add-ons value
 *   SHIPSTATION_API_SECRET  - reuse the add-ons value
 *
 * A wrong/missing STRIPE_WEBHOOK_SECRET means payments succeed but orders
 * never reach ShipStation (signature check fails silently). This bit us on
 * add-ons - verify the webhook delivery log shows 200.
 */
const { renderOrderEmailHtml, renderOrderEmailText } = require('./_shared/render-order-email');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { buildKitOrderNumber } = require('./order-number');
const crypto = require('crypto');

/* ---- Meta Conversions API (server-side Purchase, deduped vs browser pixel) ----
   Env: META_PIXEL_ID, META_CAPI_ACCESS_TOKEN, optional META_TEST_EVENT_CODE.
   event_id = PaymentIntent id - identical to the browser Purchase eventID,
   so Meta deduplicates the pair into one conversion.
   Failures here are logged but NEVER fail the webhook - ShipStation wins. */
const sha256 = (v) => crypto.createHash('sha256').update(String(v).trim().toLowerCase()).digest('hex');

async function sendMetaCapi(pi, email) {
  const pixelId = process.env.META_PIXEL_ID;
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  if (!pixelId || !token) { console.warn('CAPI skipped: META_PIXEL_ID / META_CAPI_ACCESS_TOKEN not set'); return; }
  const m = pi.metadata || {};
  const userData = {};
  if (email) userData.em = [sha256(email)];
  if (m.fbp) userData.fbp = m.fbp;
  if (m.fbc) userData.fbc = m.fbc;
  if (m.client_ip) userData.client_ip_address = m.client_ip;
  if (m.client_ua) userData.client_user_agent = m.client_ua;
  if (pi.shipping && pi.shipping.name) {
    const parts = pi.shipping.name.trim().split(/\s+/);
    if (parts[0]) userData.fn = [sha256(parts[0])];
    if (parts.length > 1) userData.ln = [sha256(parts[parts.length - 1])];
  }
  if (pi.shipping?.address?.postal_code) userData.zp = [sha256(pi.shipping.address.postal_code.replace(/\s+/g,''))];

  const payload = {
    data: [{
      event_name: 'Purchase',
      event_time: pi.created,
      event_id: pi.id,
      action_source: 'website',
      event_source_url: m.event_source_url || 'https://keepsake.thebespokefoilcompany.co.uk/',
      user_data: userData,
      custom_data: {
        currency: 'gbp',
        value: pi.amount_received / 100,
        content_ids: [m.sku],
        content_type: 'product',
        num_items: parseInt(m.quantity || '1', 10) || 1,
      },
    }],
  };
  if (process.env.META_TEST_EVENT_CODE) payload.test_event_code = process.env.META_TEST_EVENT_CODE;

  try {
    const res = await fetch(`https://graph.facebook.com/v25.0/${pixelId}/events?access_token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) console.error('CAPI error:', res.status, JSON.stringify(body));
    else console.log('CAPI Purchase sent:', pi.id, 'events_received:', body.events_received);
  } catch (e) {
    console.error('CAPI request failed:', e.message);
  }
}

const SHIPSTATION_URL = 'https://ssapi.shipstation.com/orders/createorder';

function ssAuthHeader() {
  const raw = `${process.env.SHIPSTATION_API_KEY}:${process.env.SHIPSTATION_API_SECRET}`;
  return 'Basic ' + Buffer.from(raw).toString('base64');
}


function formatDatePaid(unixSeconds) {
  try {
    return new Date(unixSeconds * 1000).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return new Date(unixSeconds * 1000).toISOString();
  }
}

function titleCase(s) {
  return String(s || '').replace(/(^|_)([a-z])/g, (_, p1, p2) => (p1 ? ' ' : '') + p2.toUpperCase());
}

async function detectPaymentMethodLabel(paymentIntentId) {
  try {
    const full = await stripe.paymentIntents.retrieve(paymentIntentId, { expand: ['latest_charge'] });
    const ch = full && full.latest_charge;
    const pmd = ch && ch.payment_method_details;
    if (!pmd) return 'Card';

    const type = pmd.type || (Array.isArray(full.payment_method_types) ? full.payment_method_types[0] : '');
    if (type === 'card') {
      const wallet = pmd.card && pmd.card.wallet;
      if (wallet && wallet.type) {
        if (wallet.type === 'apple_pay') return 'Apple Pay';
        if (wallet.type === 'google_pay') return 'Google Pay';
        if (wallet.type === 'link') return 'Link';
        return titleCase(wallet.type);
      }
      return 'Card';
    }
    return titleCase(type) || 'Card';
  } catch {
    return 'Card';
  }
}

async function sendOrderEmailViaMandrill({ toEmail, subject, html, text, metadata }) {
  const apiKey = process.env.MANDRILL_API_KEY;
  const fromEmail = process.env.EMAIL_FROM;
  const bccEmail = (process.env.EMAIL_BCC || 'hello@thebespokefoilcompany.co.uk').trim();

  if (!apiKey || !fromEmail) {
    console.log('Mandrill skipped: missing MANDRILL_API_KEY or EMAIL_FROM');
    return { skipped: true, reason: 'missing mandrill env vars' };
  }

  const recipients = [{ email: toEmail, type: 'to' }];
  if (bccEmail && bccEmail.toLowerCase() !== String(toEmail).toLowerCase()) {
    recipients.push({ email: bccEmail, type: 'bcc' });
  }

  const res = await fetch('https://mandrillapp.com/api/1.0/messages/send.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key: apiKey,
      message: {
        from_email: fromEmail,
        from_name: 'The Bespoke Foil Company',
        subject,
        html,
        text,
        to: recipients,
        metadata: metadata || {},
      },
    }),
  });

  const body = await res.text().catch(() => '');
  if (!res.ok) {
    throw new Error(`Mandrill error ${res.status}: ${body}`);
  }
  // Mandrill returns 200 even for rejected/invalid sends; inspect the result.
  let parsed = [];
  try { parsed = JSON.parse(body); } catch { parsed = []; }
  const first = Array.isArray(parsed) ? parsed[0] : parsed;
  if (first && (first.status === 'rejected' || first.status === 'invalid')) {
    throw new Error(`Mandrill ${first.status}: ${first.reject_reason || 'unknown'}`);
  }
  return { ok: true, status: first && first.status };
}




/* ---- Personalisation summary (from PaymentIntent metadata) ----
   Set on the landing page when the customer chose "add details now".
   If mode is 'later' (or absent) the upload portal collects these instead. */
function personalisationLines(m) {
  if (!m || m.pers_mode !== 'now') return null;
  const rows = [
    ['Card', m.pers_card],
    ['Foil', m.pers_foil],
    ['Frame', m.pers_frame],
    ['Font', m.pers_font],
    ['Name', m.pers_name],
    ['Date of birth', m.pers_dob],
    ['Time of birth', m.pers_time],
  ].filter(([, v]) => v);
  return rows.length ? rows : null;
}

function personalisationNote(m) {
  const rows = personalisationLines(m);
  if (!rows) return 'Personalisation pending via upload portal.';
  return 'PERSONALISATION SUPPLIED AT CHECKOUT - ' +
    rows.map(([k, v]) => `${k}: ${v}`).join(' | ');
}

exports.handler = async (event) => {
  const sig = event.headers['stripe-signature'];
  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  if (stripeEvent.type !== 'payment_intent.succeeded') {
    return { statusCode: 200, body: 'Ignored' }; // only act on successful payment
  }

  if(!stripeEvent.data.object.metadata.source || stripeEvent.data.object.metadata.source !== 'main-keepsake-landing') {
    return { statusCode: 200, body: 'Ignored' };  
  }

  const pi = stripeEvent.data.object;
  const m = pi.metadata || {};
  const ship = pi.shipping || {};

  // Email: receipt_email is set by the client; fall back to the charge's
  // billing details. Modern API versions don't embed charges on the PI,
  // so retrieve latest_charge explicitly.
  let email = pi.receipt_email || '';
  if (!email && pi.latest_charge) {
    try {
      const charge = await stripe.charges.retrieve(pi.latest_charge);
      email = charge?.billing_details?.email || '';
    } catch (e) {
      console.warn('Could not retrieve charge for email fallback:', e.message);
    }
  }
  const addr = ship.address || {};

  /* Build the ShipStation order. Personalisation is NOT collected here -
     the customer completes it later in the upload portal, exactly as today.
     We tag the order so fulfilment knows a portal upload is pending. */
  const order = {
    orderNumber: buildKitOrderNumber(pi),
    orderKey: pi.id, // idempotency: ShipStation dedupes repeat webhooks on this
    orderDate: new Date(pi.created * 1000).toISOString(),
    orderStatus: 'awaiting_shipment',
    customerEmail: email,
    billTo: { name: ship.name || 'Customer' },
    shipTo: {
      name: ship.name || 'Customer',
      street1: addr.line1 || '',
      street2: addr.line2 || '',
      city: addr.city || '',
      state: addr.state || '',
      postalCode: addr.postal_code || '',
      country: addr.country || 'GB',
      phone: ship.phone || '',
    },
    items: [{
      sku: m.sku || 'BFC-KIT',
      name: m.product_name || 'Foil Print Kit',
      quantity: parseInt(m.quantity || '1', 10) || 1,
      // unit_price_pence is written by create-payment-intent; fall back to the
      // subtotal for orders placed before quantity support was added.
      unitPrice: (parseInt(m.unit_price_pence || m.subtotal_pence || '0', 10)) / 100,
    }],
    shippingAmount: (parseInt(m.postage_pence || '0', 10)) / 100,
    amountPaid: pi.amount / 100,
    requestedShippingService: 'Royal Mail Next Working Day',
    /* The free extra copy is prepended to the notes, not tucked into a custom
       field, because customerNotes is what the studio actually reads when
       picking an order. A fulfilment instruction nobody sees is the same as no
       instruction at all. */
    customerNotes: (m.free_extra_copy === 'yes'
      ? '*** FREE EXTRA COPY - include a second print-only copy (Memory Catcher offer) ***\n\n'
      : '') + personalisationNote(m),
    // Memory Catcher attribution: tag the order so commission can be
    // credited to the right franchisee at 20%. affiliate_slug is set by
    // create-payment-intent, either from /memory-catcher/<slug> or from a
    // discount code entered at checkout.
    ...(m.affiliate_slug ? { tagIds: [], customField1: 'mc:' + m.affiliate_slug } : {}),
    ...(m.free_extra_copy === 'yes' ? { customField2: 'FREE EXTRA COPY' } : {}),
    advancedOptions: {
      source: m.affiliate_slug ? ('memory-catcher:' + m.affiliate_slug) : 'main-keepsake-landing'
    },
  };

   // ---------- 1. ShipStation ----------
  // try {
  //   const res = await fetch(SHIPSTATION_URL, {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //       Authorization: ssAuthHeader(),
  //     },
  //     body: JSON.stringify(order),
  //   });
  //   if (!res.ok) {
  //     const text = await res.text();
  //     console.error('ShipStation rejected order:', res.status, text);
  //     return { statusCode: 502, body: 'ShipStation error' };
  //   }
  //   // return { statusCode: 200, body: 'Order created' };
  // } catch (err) {
  //   console.error('ShipStation request failed:', err.message);
  //   return { statusCode: 502, body: 'ShipStation request failed' };
  // }


   // ---------- 2. Email (non-blocking) ----------
   try {
    const full = await stripe.paymentIntents.retrieve(pi.id);
    if (full && full.metadata && full.metadata.orderEmailSent === '1') {
      console.log('Order email already sent for', orderNumber);
    } else {
      const toEmail = email || (m.customerEmail || '');
      if (!toEmail) {
        console.log('No receipt_email on PaymentIntent, skipping email for', orderNumber);
      } else {
        const paymentMethod = await detectPaymentMethodLabel(pi.id);
        const orderQty = parseInt(m.quantity || '1', 10) || 1;
        // unit_price_pence added alongside quantity support; older intents only
        // carry subtotal_pence, which equalled the unit price when qty was always 1.
        const unitPrice = (parseInt(m.unit_price_pence || '0', 10) / 100) || subtotal;
        const merge = {
          order_ref: orderNumber,
          date_paid: formatDatePaid(pi.created),
          payment_method: paymentMethod,
          customer_name: (ship.name || '').split(' ')[0] || 'there',
          customer_email: toEmail,
          items: [{
            name: m.product_name || 'Foil Print Kit',
            qty: orderQty,
            unit_price: unitPrice,
            line_total: unitPrice * orderQty,
          }],
          personalisation: personalisationLines(m),
          subtotal,
          discount_amount: 0,
          postage,
          total: pi.amount / 100,
        };

        console.log('Order email merge payload:', JSON.stringify(merge));

        const html = renderOrderEmailHtml(merge);
        const text = renderOrderEmailText(merge);
        const subject = `Your order is confirmed (#${merge.order_ref})`;

        const result = await sendOrderEmailViaMandrill({
          toEmail,
          subject,
          html,
          text,
          metadata: { payment_intent_id: pi.id, order_number: orderNumber },
        });

        if (result.skipped) {
          console.log('Order email not sent:', result.reason);
        } else {
          await stripe.paymentIntents.update(pi.id, {
            metadata: { ...full.metadata, orderEmailSent: '1' },
          });
          console.log('Order confirmation email sent for', orderNumber, 'to', toEmail);
        }
      }
    }
  } catch (err) {
    console.error('Order email failed (non-blocking):', err.message);
  }
  // ---------- 3. Meta CAPI (best-effort) ----------
  await sendMetaCapi(pi, email);

  return { statusCode: 200, body: 'Order created' };
};
