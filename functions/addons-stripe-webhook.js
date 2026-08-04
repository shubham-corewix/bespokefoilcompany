// netlify/functions/stripe-webhook.js
// Listens for payment_intent.succeeded, then:
//   1. Creates the order in ShipStation (POST /orders/createorder, V1 API)
//   2. Fires a server-side Meta CAPI Purchase event
//
// Env vars required:
//   STRIPE_SECRET_KEY       = sk_live_...
//   STRIPE_WEBHOOK_SECRET_ADDON   = whsec_...   (from the webhook endpoint you create in Stripe)
//   SHIPSTATION_API_KEY     = ...
//   SHIPSTATION_API_SECRET  = ...
//   META_PIXEL_ID           = ...         (optional - CAPI skipped if absent)
//   META_CAPI_TOKEN         = ...         (optional)

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const crypto = require('crypto');
const { buildOrderNumber } = require('./order-number');
const { renderOrderEmailHtml, renderOrderEmailText } = require('./_shared/render-order-email');

exports.handler = async (event) => {
  const sig = event.headers['stripe-signature'];
  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET_ADDON
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return { statusCode: 400, body: 'Invalid signature' };
  }

  if (stripeEvent.type !== 'payment_intent.succeeded') {
    return { statusCode: 200, body: 'Ignored' };
  }

  if(!stripeEvent.data.object.metadata.source || stripeEvent.data.object.metadata.source !== 'main-addons-landing') {
    return { statusCode: 200, body: 'Ignored' };  
  }
  const pi = stripeEvent.data.object;

  // Reassemble chunked lines metadata
  let linesJson = '';
  for (let i = 0; i < 16; i++) {
    if (pi.metadata['lines_' + i]) linesJson += pi.metadata['lines_' + i];
  }
  let items = [];
  try { items = JSON.parse(linesJson || '[]'); } catch { items = []; }




  const formatDatePaid = (unixSeconds) => {
    try {
      return new Date(unixSeconds * 1000).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    } catch {
      return new Date(unixSeconds * 1000).toISOString();
    }
  };

  const titleCase = (s) => String(s || '').replace(/(^|_)([a-z])/g, (_, p1, p2) => (p1 ? ' ' : '') + p2.toUpperCase());

  const detectPaymentMethodLabel = async (paymentIntentId) => {
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
  };

  const sendOrderEmailViaMandrill = async ({ toEmail, subject, html, text, metadata }) => {
    const apiKey = process.env.MANDRILL_API_KEY;
    const fromEmail = process.env.EMAIL_FROM;
    if (!apiKey || !fromEmail) {
      console.log('Mandrill skipped: missing MANDRILL_API_KEY or EMAIL_FROM');
      return { skipped: true, reason: 'missing mandrill env vars' };
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
          to: [{ email: toEmail, type: 'to' }],
          metadata: metadata || {}
        }
      })
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
  };




  const FIELD_LABELS = {
    personalisation: 'Personalisation', notes: 'Notes', name: 'Name',
    cardFoil: 'Card & Foil', frame: 'Frame', handFoot: 'Hand/Foot',
    keyringFoil: 'Keyring & Foil'
  };

  const shipping = pi.shipping || {};
  const addr = shipping.address || {};
  const email = pi.receipt_email || '';
  const phone = (pi.shipping && pi.shipping.phone) || (pi.metadata && pi.metadata.phone) || '';
  const orderRef = pi.metadata.orderRef || '';
  const orderNumber = buildOrderNumber(pi);

  // ---------- 1. ShipStation ----------
  try {
    const auth = Buffer.from(
      process.env.SHIPSTATION_API_KEY + ':' + process.env.SHIPSTATION_API_SECRET
    ).toString('base64');

    const ssOrder = {
      orderNumber,
      orderKey: pi.id, // idempotent: same PaymentIntent never duplicates the order
      orderDate: new Date(pi.created * 1000).toISOString(),
      paymentDate: new Date().toISOString(),
      orderStatus: 'awaiting_shipment',
      customerEmail: email,
      billTo: {
        name: shipping.name || 'Add-on Customer'
      },
      shipTo: {
        name: shipping.name || 'Add-on Customer',
        street1: addr.line1 || '',
        street2: addr.line2 || '',
        city: addr.city || '',
        state: addr.state || '',
        postalCode: addr.postal_code || '',
        country: addr.country || 'GB',
        phone: phone || ''
      },
      items: items.map((it, idx) => ({
        lineItemKey: it.sku + '-' + idx, // separate lines survive even with the same SKU
        sku: it.sku,
        name: it.name,
        quantity: it.qty,
        unitPrice: it.unitAmount / 100,
        options: [
          ...Object.entries(it.options || {}),
          ...Object.entries(it.fields || {})
        ].map(([k, v]) => ({ name: FIELD_LABELS[k] || k, value: String(v) }))
      })),
      amountPaid: pi.amount / 100,
      internalNotes:
        'Add-ons landing page order.' +
        (orderRef ? ' Linked to original order ' + orderRef + '.' : '') +
        (Number(pi.metadata.basketDisc) > 0 ? ' 20% basket discount applied.' : '') +
        (Number(pi.metadata.keyringDisc) > 0 ? ' Keyring 3+ deal applied.' : '') +
        (pi.metadata.couponCode ? ' Coupon ' + pi.metadata.couponCode + ' applied (-\u00A3' + (Number(pi.metadata.couponDisc)/100).toFixed(2) + ').' : ''),
      advancedOptions: { source: 'Memory Catcher Add-ons Page' }
    };

    const res = await fetch('https://ssapi.shipstation.com/orders/createorder', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + auth,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ssOrder)
    });
    if (!res.ok) {
      const text = await res.text();
      console.error('ShipStation error:', res.status, text);
      // Return 500 so Stripe retries the webhook - the orderKey keeps it idempotent
      return { statusCode: 500, body: 'ShipStation failed' };
    }
    console.log('ShipStation order created:', orderNumber);
  } catch (err) {
    console.error('ShipStation exception:', err.message);
    return { statusCode: 500, body: 'ShipStation failed' };
  }

  // ---------- 2. Email ----------
  try {
    const full = await stripe.paymentIntents.retrieve(pi.id);
    if (full && full.metadata && full.metadata.orderEmailSent === '1') {
      console.log('Order email already sent for', orderNumber);
    } else {
      const toEmail = pi.receipt_email || (pi.metadata && pi.metadata.customerEmail) || '';
      if (!toEmail) {
        console.log('No receipt_email on PaymentIntent, skipping email for', orderNumber);
      } else {
        const paymentMethod = await detectPaymentMethodLabel(pi.id);

        const subtotal = Number(pi.metadata.subtotal || 0) / 100;
        const basketDisc = Number(pi.metadata.basketDisc || 0) / 100;
        const keyringDisc = Number(pi.metadata.keyringDisc || 0) / 100;
        const couponDisc = Number(pi.metadata.couponDisc || 0) / 100;
        const discountAmount = basketDisc + keyringDisc + couponDisc;

        const merge = {
          order_ref: orderRef || orderNumber,
          date_paid: formatDatePaid(pi.created),
          payment_method: paymentMethod,
          customer_name: (shipping.name || '').split(' ')[0] || 'there',
          customer_email: toEmail,
          items: items.map(it => ({
            name: it.name,
            qty: it.qty,
            unit_price: it.unitAmount / 100,
            line_total: (it.unitAmount * it.qty) / 100
          })),
          subtotal,
          discount_code: pi.metadata.couponCode || '',
          discount_label: pi.metadata.couponCode ? `${pi.metadata.couponCode}` : '',
          discount_amount: discountAmount || 0,
          postage: 0,
          total: pi.amount / 100
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
          metadata: { payment_intent_id: pi.id, order_number: orderNumber }
        });

        if (result.skipped) {
          console.log('Order email not sent:', result.reason);
        } else {
          await stripe.paymentIntents.update(pi.id, { metadata: { ...full.metadata, orderEmailSent: '1' } });
          console.log('Order confirmation email sent for', orderNumber, 'to', toEmail);
        }
      }
    }
  } catch (err) {
    console.error('Order email failed (non-blocking):', err.message);
  }

  // ---------- 2. Meta CAPI Purchase (best-effort, never blocks) ----------
  if (process.env.META_PIXEL_ID && process.env.META_CAPI_ACCESS_TOKEN) {
    try {
      const hash = v => crypto.createHash('sha256')
        .update(String(v).trim().toLowerCase()).digest('hex');
      await fetch(
        `https://graph.facebook.com/v21.0/${process.env.META_PIXEL_ID}/events?access_token=${process.env.META_CAPI_ACCESS_TOKEN}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: [{
              event_name: 'Purchase',
              event_time: Math.floor(Date.now() / 1000),
              event_id: pi.id, // dedupe key if a browser pixel also fires
              action_source: 'website',
              user_data: {
                em: email ? [hash(email)] : undefined,
                zp: addr.postal_code ? [hash(addr.postal_code)] : undefined,
                country: [hash(addr.country || 'gb')]
              },
              custom_data: {
                currency: 'GBP',
                value: pi.amount / 100,
                content_type: 'product',
                contents: items.map(it => ({
                  id: it.sku, quantity: it.qty, item_price: it.unitAmount / 100
                }))
              }
            }]
          })
        }
      );
      console.log('Meta CAPI Purchase sent for', orderNumber);
    } catch (err) {
      console.error('Meta CAPI failed (non-blocking):', err.message);
    }
  }

  return { statusCode: 200, body: 'OK' };
};
