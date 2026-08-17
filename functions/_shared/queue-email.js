/* =============================================================================
   queue-email.js - put an email on the queue
   -----------------------------------------------------------------------------
   Writes one row to email_queue. n8n polls that table and sends via bfc-shell.

   THIS CAN NEVER BREAK ITS CALLER

   Every call site is on a live path - taking a payment, recording an upload,
   capturing a lead. None of them should fail because an email could not be
   scheduled. So this catches everything, logs loudly, and returns a result
   object rather than throwing. The order still completes; the email is the part
   that is missing, and the log line says so.

   It is also OFF unless EMAIL_QUEUE_ENABLED=true, so deploying the call sites
   changes nothing until Dixit switches it on.

   DEDUPE IS NOT OPTIONAL

   Stripe retries webhooks. ShipStation can fire a despatch event more than once.
   Without a dedupe key the customer gets two confirmations and nobody finds out
   until they say so. Every caller must pass something stable - the order
   reference, the upload reference - not a timestamp or a random id.

   Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, EMAIL_QUEUE_ENABLED
   ============================================================================= */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ENABLED = String(process.env.EMAIL_QUEUE_ENABLED || '').toLowerCase() === 'true';

async function fetchWithTimeout(url, options = {}, ms = 4000) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: c.signal });
  } catch (e) {
    if (e.name === 'AbortError') throw new Error(`timed out after ${ms}ms`);
    throw e;
  } finally {
    clearTimeout(t);
  }
}

/**
 * Schedule one email.
 *
 * @param {object} o
 * @param {string} o.templateKey  row key in email_content, e.g. 'order-confirmation'
 * @param {string} o.toEmail
 * @param {string} [o.toName]
 * @param {object} [o.merge]      per-send values for the template
 * @param {number} [o.delayDays]  0 for immediate, 7 for the Trustpilot invite, etc
 * @param {string} o.dedupeKey    stable id - '<templateKey>:<order ref>'
 * @param {string} [o.source]     which trigger queued it, for tracing
 * @returns {Promise<{queued: boolean, reason?: string}>}
 */
async function queueEmail(o) {
  if (!ENABLED) return { queued: false, reason: 'EMAIL_QUEUE_ENABLED not set' };

  try {
    if (!o || !o.templateKey || !o.toEmail) throw new Error('templateKey and toEmail are required');
    if (!o.dedupeKey) throw new Error('dedupeKey is required - without it a webhook retry sends twice');
    if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set');

    const delay = Number(o.delayDays || 0);
    const sendAfter = new Date(Date.now() + delay * 24 * 60 * 60 * 1000).toISOString();

    const res = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/email_queue`, {
      method: 'POST',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        /* merge-duplicates on the unique dedupe_key: a repeat webhook updates
           the existing row instead of erroring or inserting a second one. */
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify({
        template_key: o.templateKey,
        to_email: o.toEmail,
        to_name: o.toName || null,
        merge: o.merge || {},
        send_after: sendAfter,
        dedupe_key: o.dedupeKey,
        source: o.source || null,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Supabase ${res.status}: ${body.slice(0, 200)}`);
    }

    console.log(`[queue] ${o.templateKey} -> ${o.toEmail} in ${delay}d (${o.dedupeKey})`);
    return { queued: true };
  } catch (err) {
    /* Loud, and swallowed. The caller is mid-payment or mid-upload; a missing
       email is bad, a failed order is worse. */
    console.error(`[queue] FAILED to queue ${o && o.templateKey} for ${o && o.toEmail}:`, err.message);
    return { queued: false, reason: err.message };
  }
}

/** Queue several at once - the day 0/7/10/14 chain after a despatch. */
async function queueEmails(list) {
  const out = [];
  for (const item of list) out.push(await queueEmail(item));
  return out;
}

module.exports = { queueEmail, queueEmails };
