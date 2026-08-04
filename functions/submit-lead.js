/* ============================================================================
   submit-lead.js - Memory Catcher franchise landing page
   ----------------------------------------------------------------------------
   1. Receives the franchise enquiry form submission.
   2. Sends a server-side Meta CAPI "Lead" event, deduplicated against the
      browser pixel via a shared event_id.
   3. Emails the enquiry to Ashley via Mandrill.

   Env vars required (set in Netlify UI, never hard-coded):
     META_PIXEL_ID              - same dataset as the keepsake page
     META_CAPI_ACCESS_TOKEN     - Meta Conversions API token
     META_TEST_EVENT_CODE       - optional, for Events Manager test mode
     MANDRILL_API_KEY           - transactional email
     EMAIL_FROM                 - e.g. hello@thebespokefoilcompany.co.uk
     LEAD_NOTIFY_TO             - where enquiries land (Ashley)
     EMAIL_BCC                  - optional

   CAPI/email failures are logged but never fail the request - capturing the
   lead always wins.
   ========================================================================== */

const crypto = require('crypto');

const sha256 = (v) =>
  crypto.createHash('sha256').update(String(v).trim().toLowerCase()).digest('hex');

const escapeHtml = (s) =>
  String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

/* ---------- Meta Conversions API: server-side Lead ---------- */
async function sendMetaCapi(lead, meta) {
  const pixelId = process.env.META_PIXEL_ID;
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  if (!pixelId || !token) {
    console.warn('CAPI skipped: META_PIXEL_ID / META_CAPI_ACCESS_TOKEN not set');
    return;
  }

  const userData = {};
  if (lead.email) userData.em = [sha256(lead.email)];
  if (lead.mobile) {
    // The form sends E.164 (dial code + national number, e.g. +447700900123).
    // Strip to digits for Meta hashing. Fallback rules cover direct API callers
    // that may still pass a UK national format (07... or a bare 7...).
    let phone = String(lead.mobile).replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) phone = '44' + phone.slice(1);
    else if (phone.startsWith('7') && phone.length === 10) phone = '44' + phone;
    userData.ph = [sha256(phone)];
  }
  if (lead.fname) userData.fn = [sha256(lead.fname)];
  if (lead.lname) userData.ln = [sha256(lead.lname)];
  if (lead.town) userData.ct = [sha256(String(lead.town).replace(/\s+/g, ''))];
  userData.country = [sha256('gb')];
  if (meta.fbp) userData.fbp = meta.fbp;
  if (meta.fbc) userData.fbc = meta.fbc;
  if (meta.clientIp) userData.client_ip_address = meta.clientIp;
  if (meta.clientUa) userData.client_user_agent = meta.clientUa;

  const payload = {
    data: [{
      event_name: 'Lead',
      event_time: Math.floor(Date.now() / 1000),
      event_id: meta.eventId,                 // matches the browser pixel eventID
      action_source: 'website',
      event_source_url: meta.sourceUrl || 'https://franchise.thebespokefoilcompany.co.uk/',
      user_data: userData,
      custom_data: lead.subscribeOnly ? {
        currency: 'GBP',
        value: 0,
        content_name: 'Memory Catcher Franchise - newsletter',
        content_category: 'franchise-subscribe',
      } : {
        currency: 'GBP',
        value: 3445,                          // founders setup value
        content_name: 'Memory Catcher Franchise',
        content_category: 'franchise',
      },
    }],
  };
  if (process.env.META_TEST_EVENT_CODE) payload.test_event_code = process.env.META_TEST_EVENT_CODE;

  try {
    const res = await fetch(
      `https://graph.facebook.com/v25.0/${pixelId}/events?access_token=${token}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
    );
    const body = await res.json().catch(() => ({}));
    if (!res.ok) console.error('CAPI error:', res.status, JSON.stringify(body));
    else console.log('CAPI Lead sent:', meta.eventId, 'events_received:', body.events_received);
  } catch (e) {
    console.error('CAPI request failed:', e.message);
  }
}

/* ---------- Mandrill: notify Ashley ---------- */
async function sendEmail(lead) {
  const key = process.env.MANDRILL_API_KEY;
  const to = process.env.LEAD_NOTIFY_TO;
  const from = process.env.EMAIL_FROM;
  if (!key || !to || !from) {
    console.warn('Email skipped: MANDRILL_API_KEY / LEAD_NOTIFY_TO / EMAIL_FROM not set');
    return;
  }

  const row = (label, value) =>
    `<tr><td style="padding:6px 12px 6px 0;color:#666;font:14px system-ui">${escapeHtml(label)}</td>` +
    `<td style="padding:6px 0;font:14px system-ui"><strong>${escapeHtml(value || '-')}</strong></td></tr>`;

  const isSubscribe = !!lead.subscribeOnly;

  const html = isSubscribe ? `
    <div style="font:15px system-ui;color:#111;max-width:560px">
      <h2 style="font:600 18px system-ui;margin:0 0 4px">New "keep me posted" signup</h2>
      <p style="color:#666;margin:0 0 18px">Someone on the franchise landing page asked to stay in the know. Not a full enquiry - add them to the Memory Catcher franchise mailing list.</p>
      <p style="font:15px system-ui"><strong>${escapeHtml(lead.email)}</strong></p>
    </div>` : `
    <div style="font:15px system-ui;color:#111;max-width:560px">
      <h2 style="font:600 18px system-ui;margin:0 0 4px">New Memory Catcher franchise enquiry</h2>
      <p style="color:#666;margin:0 0 18px">From the franchise landing page.</p>
      <table style="border-collapse:collapse;width:100%">
        ${row('Name', [lead.fname, lead.lname].filter(Boolean).join(' '))}
        ${row('Town / city', lead.town)}
        ${row('Email', lead.email)}
        ${row('Mobile', lead.mobile)}
        ${row('Situation', lead.situation)}
        ${row('Bought from us before', lead.bought)}
        ${row('Drives', lead.drive)}
        ${row('Prefers contact by', lead.contact)}
        ${row('What appeals', (lead.appeal || []).join(', '))}
      </table>
      ${lead.anything ? `<p style="margin:18px 0 0"><em>"${escapeHtml(lead.anything)}"</em></p>` : ''}
    </div>`;

  const recipients = [{ email: to, type: 'to' }];
  if (process.env.EMAIL_BCC) recipients.push({ email: process.env.EMAIL_BCC, type: 'bcc' });

  try {
    const res = await fetch('https://mandrillapp.com/api/1.0/messages/send.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key,
        message: {
          from_email: from,
          from_name: 'Memory Catcher Franchise',
          subject: isSubscribe
            ? `Keep me posted signup - ${lead.email}`
            : `New franchise enquiry - ${lead.fname || ''} ${lead.lname || ''} (${lead.town || ''})`.trim(),
          html,
          to: recipients,
          headers: lead.email ? { 'Reply-To': lead.email } : undefined,
        },
      }),
    });
    if (!res.ok) console.error('Mandrill error:', res.status, await res.text().catch(() => ''));
    else console.log('Lead email sent for', lead.email);
  } catch (e) {
    console.error('Mandrill request failed:', e.message);
  }
}

/* ---------- handler ---------- */
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let lead;
  try {
    lead = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Bad JSON' }) };
  }

  // Honeypot: silently accept and discard obvious bots
  if (lead.company) {
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  }

  if (lead.subscribeOnly) {
    if (!lead.email) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Missing email' }) };
    }
  } else if (!lead.fname || !lead.email || !lead.mobile || !lead.town) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Missing required fields' }) };
  }

  const headers = event.headers || {};
  const meta = {
    eventId: lead.eventId || crypto.randomUUID(),
    fbp: lead.fbp,
    fbc: lead.fbc,
    clientIp: headers['x-nf-client-connection-ip'] || headers['client-ip'] || (headers['x-forwarded-for'] || '').split(',')[0].trim(),
    clientUa: headers['user-agent'],
    sourceUrl: lead.sourceUrl,
  };

  // Both are best-effort; never block the lead being captured.
  await Promise.allSettled([sendMetaCapi(lead, meta), sendEmail(lead)]);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: true, eventId: meta.eventId }),
  };
};
