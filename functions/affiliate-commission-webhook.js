/**
 * affiliate-commission-webhook.js
 * Bespoke Foil Company - Memory Catcher affiliate commission ledger
 *
 * DELIBERATELY SEPARATE from functions/stripe-webhook.js.
 * Fulfilment is live money: if the commission write fails we want Stripe to
 * retry THIS endpoint without re-firing ShipStation and duplicating an order.
 * Register it as its own webhook endpoint with its own signing secret.
 *
 * Endpoint:  /.netlify/functions/affiliate-commission-webhook
 * Events to subscribe (exactly these four):
 *   payment_intent.succeeded   -> credit commission
 *   charge.refunded            -> reverse pro-rata (handles partial refunds)
 *   charge.dispute.created     -> hold the row (do not pay out while disputed)
 *   charge.dispute.closed      -> reverse if lost, release if won
 *
 * Env vars (Netlify, REDEPLOY after any change):
 *   STRIPE_SECRET_KEY                  sk_live_... / sk_test_...
 *   STRIPE_WEBHOOK_SECRET_AFFILIATE    whsec_... - THIS endpoint's own secret,
 *                                      NOT the same value as the kit webhook
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY          service role, NOT the anon key. This
 *                                      function writes money rows; RLS must
 *                                      block anon writes entirely. This key
 *                                      must never appear in an edge function
 *                                      or any client-side file.
 *
 * Commission rule (Ryan, per /franchise and the Hub):
 *   20% of the PRODUCT SUBTOTAL. Postage is excluded - we don't pay
 *   commission on Royal Mail. Everything is integer pence end to end;
 *   no floats touch a money value.
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { buildKitOrderNumber } = require('./order-number');

const COMMISSION_RATE_BPS = 2000; // 20.00% in basis points - integer maths only
const CURRENCY = 'gbp';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/* ---------------------------------------------------------------------------
   Supabase REST helper. Dependency-free on purpose - the only npm dependency
   in this repo is `stripe` and it stays that way.
--------------------------------------------------------------------------- */
async function sb(path, { method = 'GET', body, prefer } = {}) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase env vars missing (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)');
  }
  const headers = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };
  if (prefer) headers.Prefer = prefer;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase ${method} ${path} -> ${res.status}: ${text}`);
  try { return text ? JSON.parse(text) : null; } catch { return null; }
}

/* Slug shape guard - MUST stay identical to cleanAffiliate() in
   functions/create-payment-intent.js and the regex in the memory-catcher
   edge function. If one of the three changes, change all three. */
function cleanAffiliate(v) {
  const slug = String(v || '').trim().toLowerCase();
  return /^[a-z0-9-]{1,60}$/.test(slug) ? slug : '';
}

/* Only credit a slug that is a real, ACTIVE franchisee. A typo'd or retired
   slug must never silently accrue a balance nobody notices for months. */
async function activeFranchisee(slug) {
  const rows = await sb(
    `franchisees?slug=eq.${encodeURIComponent(slug)}&active=is.true&select=slug,name&limit=1`
  );
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

/* Commissionable base in pence.
   subtotal_pence is written server-side by create-payment-intent from the
   trusted catalogue, so it is safe to rely on. The fallback covers any intent
   created before that field existed: gross received minus postage. */
function commissionableBase(pi) {
  const m = pi.metadata || {};
  const subtotal = parseInt(m.subtotal_pence || '', 10);
  if (Number.isFinite(subtotal) && subtotal > 0) return subtotal;

  const gross = Number.isFinite(pi.amount_received) ? pi.amount_received : (pi.amount || 0);
  const postage = parseInt(m.postage_pence || '0', 10) || 0;
  return Math.max(0, gross - postage);
}

const commissionOn = (basePence) => Math.round((basePence * COMMISSION_RATE_BPS) / 10000);

/* ---------------------------------------------------------------------------
   1. CREDIT - payment_intent.succeeded
--------------------------------------------------------------------------- */
async function creditCommission(pi) {
  const m = pi.metadata || {};

  /* Only keepsake-checkout orders carry affiliate attribution.
     Both values are accepted during parallel running: the unified site emits
     'main-keepsake-landing', the old keepsake deploy still emits
     'keepsake-landing'. An affiliate order placed through either must still
     earn commission. Drop the legacy value once the old deploy is retired.
     Leaving this ungated would credit 20% on ANY future product that happens
     to reuse the affiliate_slug metadata key. */
  // const AFFILIATE_SOURCES = ['main-keepsake-landing', 'keepsake-landing'];
  // if (!AFFILIATE_SOURCES.includes(m.source)) return 'ignored: not a keepsake order';

  const slug = cleanAffiliate(m.affiliate_slug);
  if (!slug) return 'ignored: no affiliate_slug (direct sale)';

  const franchisee = await activeFranchisee(slug);
  if (!franchisee) {
    // Loud, but still a 200 - retrying will not conjure the row into existence.
    console.error(`COMMISSION UNMATCHED: slug "${slug}" not found or inactive. PI ${pi.id}`);
    return `ignored: unknown/inactive slug ${slug}`;
  }

  const base = commissionableBase(pi);
  const commission = commissionOn(base);

  let email = pi.receipt_email || '';
  if (!email && pi.latest_charge) {
    try {
      const charge = await stripe.charges.retrieve(
        typeof pi.latest_charge === 'string' ? pi.latest_charge : pi.latest_charge.id
      );
      email = charge?.billing_details?.email || '';
    } catch (e) {
      console.warn('Could not retrieve charge for email:', e.message);
    }
  }

  /* IDEMPOTENCY. Stripe retries on any non-2xx and can deliver the same event
     more than once even on success. payment_intent_id is UNIQUE in the table
     and we resolve conflicts by ignoring, so a replay can never double-pay.
     This is the single most important line in the file. */
  await sb('commissions?on_conflict=payment_intent_id', {
    method: 'POST',
    prefer: 'resolution=ignore-duplicates,return=minimal',
    body: [{
      payment_intent_id: pi.id,
      affiliate_slug: slug,
      order_number: buildKitOrderNumber(pi), // matches ShipStation
      currency: pi.currency || CURRENCY,
      gross_amount_pence: pi.amount_received || pi.amount || 0,
      commissionable_pence: base,
      commission_rate_bps: COMMISSION_RATE_BPS,
      commission_pence: commission,
      customer_email: email || null,
      sku: m.sku || null,
      quantity: parseInt(m.quantity || '1', 10) || 1,
      status: 'pending',
      paid_at: new Date((pi.created || Math.floor(Date.now() / 1000)) * 1000).toISOString(),
    }],
  });


// --- Hub ledger (transactions) — same money the commissions page reads ---
const amountPaid = Math.round(base) / 100;           // pence -> pounds
const hubCommission = Math.round(commission) / 100;  // pence -> pounds
const occurredOn = new Date((pi.created || Math.floor(Date.now() / 1000)) * 1000)
  .toISOString()
  .slice(0, 10);

const fr = await sb(
  `franchisees?slug=eq.${encodeURIComponent(slug)}&active=is.true&select=id&limit=1`
);
const franchiseeId = Array.isArray(fr) && fr[0]?.id ? fr[0].id : null;

if (franchiseeId) {
  await sb('transactions?on_conflict=source,external_id', {
    method: 'POST',
    prefer: 'resolution=merge-duplicates,return=minimal',
    body: [{
      franchisee_id: franchiseeId,
      stream: 'affiliate',
      source: 'website',
      external_id: pi.id,
      order_name: buildKitOrderNumber(pi),
      occurred_on: occurredOn,
      product: m.product_name || m.sku || 'Kit',
      amount_paid: amountPaid,
      rate: 0.2,
      commission: hubCommission,
    }],
  });

  const month = occurredOn.slice(0, 7);
  await sb('month_status?on_conflict=franchisee_id,month', {
    method: 'POST',
    prefer: 'resolution=ignore-duplicates,return=minimal',
    body: [{ franchisee_id: franchiseeId, month, status: 'pending' }],
  });
} else {
  console.error(`Hub transactions skipped: no franchisee id for slug ${slug}`);
}


  console.log(
    `Commission credited: ${slug} £${(commission / 100).toFixed(2)} ` +
    `on base £${(base / 100).toFixed(2)} (PI ${pi.id})`
  );
  return `credited ${slug} ${commission}p`;
}

/* ---------------------------------------------------------------------------
   2. REVERSE - charge.refunded (full or partial)
   Commission reverses in the same proportion as the refund, measured against
   the COMMISSIONABLE base, not the gross. Refunding postage alone therefore
   claws back nothing, which is correct: no commission was paid on it.
--------------------------------------------------------------------------- */
async function reverseForRefund(charge) {
  const piId = typeof charge.payment_intent === 'string'
    ? charge.payment_intent
    : charge.payment_intent?.id;
  if (!piId) return 'ignored: no payment_intent on charge';

  const rows = await sb(
    `commissions?payment_intent_id=eq.${encodeURIComponent(piId)}&select=*&limit=1`
  );
  if (!Array.isArray(rows) || !rows.length) return 'ignored: no commission row';
  const row = rows[0];

  const refundedPence = charge.amount_refunded || 0;
  const gross = row.gross_amount_pence || 0;
  const base = row.commissionable_pence || 0;
  const postagePart = Math.max(0, gross - base);

  /* Refund is allocated to POSTAGE FIRST, then to product value.
     No commission was ever paid on postage, so refunding a £4.95 postage
     charge must claw back nothing. Only the portion of a refund that eats
     into the £34.95 product value reduces the franchisee's commission. */
  const refundedAgainstBase = Math.max(0, Math.min(base, refundedPence - postagePart));
  const reversed = Math.min(row.commission_pence, commissionOn(refundedAgainstBase));
  const fullyRefunded = gross > 0 && refundedPence >= gross;

  await sb(`commissions?payment_intent_id=eq.${encodeURIComponent(piId)}`, {
    method: 'PATCH',
    prefer: 'return=minimal',
    body: {
      refunded_pence: refundedPence,
      commission_reversed_pence: reversed,
      status: fullyRefunded ? 'reversed' : row.status,
      updated_at: new Date().toISOString(),
    },
  });

  console.log(`Commission reversed: ${row.affiliate_slug} -£${(reversed / 100).toFixed(2)} (PI ${piId})`);
  return `reversed ${reversed}p`;
}

/* ---------------------------------------------------------------------------
   3. DISPUTES - hold on open, resolve on close
--------------------------------------------------------------------------- */
async function handleDispute(dispute, closed) {
  const chargeId = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id;
  if (!chargeId) return 'ignored: no charge on dispute';

  let piId;
  try {
    const charge = await stripe.charges.retrieve(chargeId);
    piId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;
  } catch (e) {
    console.error('Dispute: could not retrieve charge:', e.message);
    throw e; // transient - let Stripe retry
  }
  if (!piId) return 'ignored: charge has no payment_intent';

  const rows = await sb(
    `commissions?payment_intent_id=eq.${encodeURIComponent(piId)}&select=*&limit=1`
  );
  if (!Array.isArray(rows) || !rows.length) return 'ignored: no commission row';
  const row = rows[0];

  let patch;
  if (!closed) {
    patch = { status: 'disputed', updated_at: new Date().toISOString() };
  } else if (dispute.status === 'won') {
    patch = { status: 'pending', updated_at: new Date().toISOString() };
  } else {
    // lost / warning_closed - treat as a full clawback
    patch = {
      status: 'reversed',
      commission_reversed_pence: row.commission_pence,
      updated_at: new Date().toISOString(),
    };
  }

  await sb(`commissions?payment_intent_id=eq.${encodeURIComponent(piId)}`, {
    method: 'PATCH', prefer: 'return=minimal', body: patch,
  });

  console.log(`Dispute ${closed ? 'closed:' + dispute.status : 'opened'} -> ${patch.status} (PI ${piId})`);
  return `dispute -> ${patch.status}`;
}

/* ---------------------------------------------------------------------------
   HANDLER
--------------------------------------------------------------------------- */
exports.handler = async (event) => {
  /* Signature verification needs the RAW body. Netlify base64-encodes the body
     in some configurations; decoding to a Buffer first is what stops the
     intermittent "no signatures found matching the expected signature" that
     bit the add-ons webhook. */
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body || '', 'base64')
    : (event.body || '');

  const sig = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET_AFFILIATE
    );
  } catch (err) {
    console.error('Affiliate webhook signature verification failed:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  try {
    let result;
    switch (stripeEvent.type) {
      case 'payment_intent.succeeded':
        result = await creditCommission(stripeEvent.data.object);
        break;
      case 'charge.refunded':
        result = await reverseForRefund(stripeEvent.data.object);
        break;
      case 'charge.dispute.created':
        result = await handleDispute(stripeEvent.data.object, false);
        break;
      case 'charge.dispute.closed':
        result = await handleDispute(stripeEvent.data.object, true);
        break;
      default:
        return { statusCode: 200, body: 'Ignored' };
    }
    return { statusCode: 200, body: String(result || 'OK') };
  } catch (err) {
    /* 500 on purpose: Stripe will retry with backoff for up to 3 days. A
       commission we failed to write is a franchisee underpaid, so we WANT the
       retry. The unique constraint makes those retries safe. */
    console.error('Affiliate commission webhook failed:', err.message);
    return { statusCode: 500, body: 'Commission write failed' };
  }
};
