/* ============================================================================
   submit-lead.js - shared handler for EVERY form on the site
   ----------------------------------------------------------------------------
   WHAT WENT WRONG BEFORE (Dixit, 11/08/2026)

   This file was written for one form: the Memory Catcher franchise landing
   page. Five things now post to it - franchise enquiry, Memory Catcher
   enquiry, contact, slot reservation, and the community sign-up that appears
   on 25 pages. Only the community one identified itself, via `subscribeOnly`.

   The other four did not, so:

     * every submission emailed as "New Memory Catcher franchise enquiry",
       whatever it actually was
     * the body rendered a FIXED list of franchise fields, so anything a
       different form collected simply was not in the email
     * `notes` was never rendered at all. The contact form puts the customer's
       whole message in `notes`. The slot form puts the baby's name there. The
       Memory Catcher enquiry puts the entire enquiry detail there. All three
       were written into a field nothing read, then discarded.
     * forms smuggled their identity into string prefixes ("CONTACT FORM. ")
       and stuffed placeholders into fields they never collect, so Ashley
       received franchise enquiries from people in the town of "contact form"
     * the Meta CAPI Lead event fired for everything at a flat value of 3445 -
       the franchise Founders Pricing - telling Meta a contact form message was
       worth GBP 3,445 and skewing value-based optimisation

   HOW IT WORKS NOW

   1. A `formType` on the payload selects an entry in the FORMS registry, which
      owns the label, the subject line, the CAPI config and the target table.
      Nothing is inferred from prose any more.
   2. The email renders EVERY field submitted, not a fixed list. A new form can
      be added without its data going missing, which is the failure this whole
      rewrite exists to prevent.
   3. The submission is written to Supabase BEFORE the email is attempted, so a
      Mandrill outage costs a notification, not a lead.

   Env vars required (set in Netlify UI, never hard-coded):
     SUPABASE_URL               - project URL
     SUPABASE_SERVICE_ROLE_KEY  - server-side insert, bypasses RLS. NEVER ship
                                  this to the browser.
     META_PIXEL_ID              - same dataset as the keepsake page
     META_CAPI_ACCESS_TOKEN     - Meta Conversions API token
     META_TEST_EVENT_CODE       - optional, for Events Manager test mode
     MANDRILL_API_KEY           - transactional email
     EMAIL_FROM                 - e.g. hello@thebespokefoilcompany.co.uk
     LEAD_NOTIFY_TO             - where enquiries land (Ashley)
     EMAIL_BCC                  - optional

   Supabase, CAPI and email are all best-effort and independently caught.
   Capturing the lead always wins.
   ========================================================================== */

const crypto = require('crypto');
const { queueEmail } = require('./_shared/queue-email');
const { LIFECYCLE, dedupe } = require('./_shared/lifecycle');

const sha256 = (v) =>
  crypto.createHash('sha256').update(String(v).trim().toLowerCase()).digest('hex');

const escapeHtml = (s) =>
  String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

const fullName = (l) =>
  [l.fname, l.lname].filter(Boolean).join(' ').trim() || l.name || 'no name given';

/* ---------- form registry ------------------------------------------------
   One entry per form. Adding a form means adding a row here and sending the
   matching `formType` - nothing else in this file needs to change.

   `capi: null` means no Meta Lead event at all for that form.
   `value: null` means fire the Lead event but send NO value. That is
   deliberate and not laziness: Meta optimises towards value, and an invented
   number for a general enquiry is worse than no number. Ryan, 11/08.
   ------------------------------------------------------------------------ */
const FORMS = {
  franchise: {
    label: 'Memory Catcher Franchise enquiry',
    heading: 'New Memory Catcher Franchise enquiry',
    strapline: 'From the franchise landing page.',
    subject: (l) => `New franchise enquiry - ${fullName(l)}${l.town ? ` (${l.town})` : ''}`,
    table: 'leads',
    capi: { value: 3445, content_name: 'Memory Catcher Franchise', content_category: 'franchise' },
  },
  'mc-enquiry': {
    label: 'Memory Catcher enquiry',
    heading: 'New Memory Catcher enquiry',
    strapline: 'From the Memory Catcher enquiry form.',
    subject: (l) => `New Memory Catcher enquiry - ${fullName(l)}${l.town ? ` (${l.town})` : ''}`,
    table: 'leads',
    /* Same product as the franchise form, so the same value. */
    capi: { value: 3445, content_name: 'Memory Catcher Franchise', content_category: 'franchise' },
  },
  contact: {
    label: 'Contact form',
    heading: 'New contact form message',
    strapline: 'Someone used the contact form on the website.',
    subject: (l) => `New contact form message - ${fullName(l)}`,
    table: 'leads',
    capi: { value: null, content_name: 'Contact form', content_category: 'contact' },
  },
  slot: {
    label: 'Slot reservation',
    heading: 'New slot reservation',
    strapline: 'Reserved through the slot reservation form. Deposit still to be taken.',
    subject: (l) => `New slot reservation - ${fullName(l)}${l.town ? ` (${l.town})` : ''}`,
    table: 'leads',
    capi: { value: null, content_name: 'Slot reservation', content_category: 'slot' },
  },
  community: {
    label: 'Community sign-up',
    heading: 'New community sign-up',
    strapline: 'Someone joined the community list from the website. Not a full enquiry.',
    subject: (l) => `Community sign-up - ${l.email}`,
    /* Its own table, not the shared one. A Supabase trigger fires the welcome
       automation on insert, so this table needs a clean single-purpose shape
       rather than a form_type column it would have to filter on. Dixit,
       11/08. */
    table: 'community_signups',
    /* No Meta Lead event. A newsletter sign-up is not a conversion worth
       optimising towards, and counting it as one drags campaigns towards the
       cheapest possible action. Ryan, 11/08. */
    capi: null,
  },
};

/* Fields the handler owns. Everything else on the payload is customer data and
   gets rendered, so a new form cannot silently lose a field. */
const INTERNAL = new Set([
  'formType', 'subscribeOnly', 'eventId', 'fbp', 'fbc', 'sourceUrl', 'company',
]);

/* Nicer labels for the fields we already know about. Anything not listed here
   still renders, with its key humanised - unknown beats missing. */
const LABELS = {
  fname: 'First name', lname: 'Last name', name: 'Name', email: 'Email',
  mobile: 'Mobile', phone: 'Phone', town: 'Town / city', situation: 'Situation',
  bought: 'Bought from us before', drive: 'Drives', contact: 'Prefers contact by',
  appeal: 'What appeals', anything: 'Anything else', notes: 'Message',
  babyName: "Baby's name", klass: 'Class', message: 'Message',
};

const humanise = (k) =>
  k.replace(/[_-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase());

/* ---------- resolve which form this is ----------------------------------
   Prefers an explicit formType. The fallbacks exist because a browser may
   still be running a cached copy of an older page for a while after deploy,
   and a misrouted lead is better than a dropped one. */
function resolveForm(lead) {
  if (lead.formType && FORMS[lead.formType]) return lead.formType;
  if (lead.subscribeOnly) return 'community';
  const notes = String(lead.notes || '').toUpperCase();
  if (notes.startsWith('CONTACT FORM')) return 'contact';
  if (notes.startsWith('SLOT RESERVATION')) return 'slot';
  if (notes.startsWith('COMMUNITY SIGN-UP')) return 'community';
  return 'franchise';
}

/* ---------- Supabase: persist before anything else can fail -------------- */
async function saveToSupabase(formType, lead, meta) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set - submission NOT persisted');
    return { ok: false, id: null, error: 'supabase env missing' };
  }

  const cfg = FORMS[formType];
  const fields = {};
  for (const [k, v] of Object.entries(lead)) {
    if (INTERNAL.has(k)) continue;
    if (v === '' || v == null) continue;
    fields[k] = v;
  }

  const row = cfg.table === 'community_signups'
    ? {
      email: String(lead.email || '').trim().toLowerCase(),
      source_url: meta.sourceUrl || null,
      client_ip: meta.clientIp || null,
    }
    : {
      form_type: formType,
      name: fullName(lead),
      email: String(lead.email || '').trim().toLowerCase() || null,
      mobile: lead.mobile || lead.phone || null,
      town: lead.town || null,
      fields,
      source_url: meta.sourceUrl || null,
      client_ip: meta.clientIp || null,
      event_id: meta.eventId || null,
    };

  try {
    const res = await fetch(`${url}/rest/v1/${cfg.table}`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        /* merge-duplicates on community_signups: email is unique there, so a
           repeat sign-up updates the row instead of erroring, AND does not
           fire the welcome automation a second time. */
        Prefer: cfg.table === 'community_signups'
          ? 'return=representation,resolution=merge-duplicates'
          : 'return=representation',
      },
      body: JSON.stringify([row]),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      console.error(`Supabase insert failed (${cfg.table}):`, res.status, JSON.stringify(body));
      return { ok: false, id: null, error: String(res.status) };
    }
    const id = Array.isArray(body) && body[0] ? body[0].id : null;
    console.log(`Saved ${formType} submission to ${cfg.table}`, id || '');
    return { ok: true, id, error: null };
  } catch (e) {
    console.error(`Supabase request failed (${cfg.table}):`, e.message);
    return { ok: false, id: null, error: e.message };
  }
}

/* Best effort: record whether the email went out, on the row already saved.
   Never throws - this is bookkeeping, not the lead. */
async function markEmailStatus(formType, id, status, detail) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const cfg = FORMS[formType];
  if (!url || !key || !id || cfg.table !== 'leads') return;
  try {
    await fetch(`${url}/rest/v1/leads?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ email_status: status, email_error: detail || null }),
    });
  } catch (e) {
    console.error('Could not record email status:', e.message);
  }
}

/* ---------- Meta Conversions API: server-side Lead ---------- */
async function sendMetaCapi(formType, lead, meta) {
  const cfg = FORMS[formType];
  if (!cfg.capi) {
    console.log(`CAPI skipped for ${formType} - not a conversion event by design`);
    return;
  }

  const pixelId = process.env.META_PIXEL_ID;
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  if (!pixelId || !token) {
    console.warn('CAPI skipped: META_PIXEL_ID / META_CAPI_ACCESS_TOKEN not set');
    return;
  }

  const userData = {};
  if (lead.email) userData.em = [sha256(lead.email)];
  // The form sends E.164 (dial code + national number, e.g. +447700900123).
  // Strip everything but digits before hashing.
  const rawPhone = lead.mobile || lead.phone;
  if (rawPhone) {
    const digits = String(rawPhone).replace(/[^\d]/g, '');
    if (digits.length >= 7) userData.ph = [sha256(digits)];
  }
  if (lead.fname) userData.fn = [sha256(lead.fname)];
  if (lead.lname) userData.ln = [sha256(lead.lname)];
  if (meta.fbp) userData.fbp = meta.fbp;
  if (meta.fbc) userData.fbc = meta.fbc;
  if (meta.clientIp) userData.client_ip_address = meta.clientIp;
  if (meta.clientUa) userData.client_user_agent = meta.clientUa;

  const custom = {
    currency: 'GBP',
    content_name: cfg.capi.content_name,
    content_category: cfg.capi.content_category,
  };
  /* Omit `value` entirely rather than sending 0. A zero value still enters
     value-based bidding as a real datapoint worth nothing; an absent one does
     not. They are not the same signal. */
  if (cfg.capi.value != null) custom.value = cfg.capi.value;

  const payload = {
    data: [{
      event_name: 'Lead',
      event_time: Math.floor(Date.now() / 1000),
      event_id: meta.eventId,                 // matches the browser pixel eventID
      action_source: 'website',
      event_source_url: meta.sourceUrl || 'https://www.thebespokefoilcompany.co.uk/',
      user_data: userData,
      custom_data: custom,
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
    else console.log(`CAPI Lead sent for ${formType}`, cfg.capi.value != null ? `value ${cfg.capi.value}` : 'no value');
  } catch (e) {
    console.error('CAPI request failed:', e.message);
  }
}

/* ---------- Mandrill: notify Ashley ---------- */
async function sendEmail(formType, lead, meta) {
  const key = process.env.MANDRILL_API_KEY;
  const to = process.env.LEAD_NOTIFY_TO;
  const from = process.env.EMAIL_FROM;
  if (!key || !to || !from) {
    console.warn('Email skipped: MANDRILL_API_KEY / LEAD_NOTIFY_TO / EMAIL_FROM not set');
    return { ok: false, error: 'email env missing' };
  }

  const cfg = FORMS[formType];

  const row = (label, value) =>
    `<tr><td style="padding:6px 12px 6px 0;color:#666;font:14px system-ui;vertical-align:top;white-space:nowrap">${escapeHtml(label)}</td>` +
    `<td style="padding:6px 0;font:14px system-ui"><strong>${escapeHtml(value)}</strong></td></tr>`;

  /* Render EVERY submitted field, in a sensible order: the known ones in the
     order they are asked for, then anything else the form happened to send.
     This is the point of the rewrite - a field nobody thought about still
     reaches Ashley rather than vanishing. */
  const ORDER = ['fname', 'lname', 'name', 'town', 'klass', 'email', 'mobile', 'phone',
    'situation', 'bought', 'drive', 'contact', 'appeal', 'babyName', 'notes',
    'message', 'anything'];

  const entries = Object.entries(lead)
    .filter(([k, v]) => !INTERNAL.has(k) && v !== '' && v != null)
    .map(([k, v]) => [k, Array.isArray(v) ? v.join(', ') : String(v)]);

  entries.sort((a, b) => {
    const ia = ORDER.indexOf(a[0]); const ib = ORDER.indexOf(b[0]);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });

  const rows = entries.map(([k, v]) => row(LABELS[k] || humanise(k), v)).join('\n        ');

  const html = `
    <div style="font:15px system-ui;color:#111;max-width:600px">
      <h2 style="font:600 18px system-ui;margin:0 0 4px">${escapeHtml(cfg.heading)}</h2>
      <p style="color:#666;margin:0 0 18px">${escapeHtml(cfg.strapline)}</p>
      <table style="border-collapse:collapse;width:100%">
        ${rows}
      </table>
      <p style="color:#999;font:12px system-ui;margin:20px 0 0;border-top:1px solid #eee;padding-top:12px">
        Form: ${escapeHtml(cfg.label)}${meta.sourceUrl ? ` &middot; Submitted from ${escapeHtml(meta.sourceUrl)}` : ''}
      </p>
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
          from_name: 'The Bespoke Foil Company',
          subject: cfg.subject(lead),
          html,
          to: recipients,
          headers: lead.email ? { 'Reply-To': lead.email } : undefined,
        },
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error('Mandrill error:', res.status, detail);
      return { ok: false, error: `${res.status} ${detail}`.slice(0, 300) };
    }
    console.log(`Lead email sent for ${formType}:`, lead.email);
    return { ok: true, error: null };
  } catch (e) {
    console.error('Mandrill request failed:', e.message);
    return { ok: false, error: e.message };
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

  const formType = resolveForm(lead);

  /* Validation is per form now. The old rule demanded fname, email, mobile AND
     town from everything, which is why the contact form invented a town of
     "contact form" and a mobile of "not given" to get past it. Ask each form
     only for what it actually collects. */
  if (formType === 'community') {
    if (!lead.email) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Missing email' }) };
    }
  } else if (formType === 'contact') {
    if (!lead.fname || !lead.email) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Missing required fields' }) };
    }
  } else if (!lead.fname || !lead.email || !lead.mobile) {
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

  /* Persist FIRST. If Mandrill is down the lead is still on record, which is
     the entire reason this step exists. A Supabase failure is logged loudly
     but does not stop the email, because one surviving copy beats none. */
  const saved = await saveToSupabase(formType, lead, meta);

  const [, emailResult] = await Promise.all([
    sendMetaCapi(formType, lead, meta).catch((e) => console.error('CAPI threw:', e.message)),
    sendEmail(formType, lead, meta).catch((e) => ({ ok: false, error: e.message })),
  ]);

  if (saved.ok && saved.id && emailResult) {
    await markEmailStatus(formType, saved.id, emailResult.ok ? 'sent' : 'failed', emailResult.error);
  }

  /* The customer sees success as long as the submission is held somewhere.
     Only a total failure of BOTH storage and email is worth telling them
     about, because that is the one case where retrying actually helps. */
  const captured = saved.ok || (emailResult && emailResult.ok);
  if (!captured) {
    console.error('LEAD LOST - neither Supabase nor Mandrill accepted it:', JSON.stringify(lead).slice(0, 500));
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Could not save your message. Please try again or email us directly.' }),
    };
  }

  /* Subscriber welcome series - community sign-ups ONLY.
     ------------------------------------------------------------------------
     Deliberately not every lead. A franchise enquiry, a contact message and a
     slot reservation all get a human reply; dropping a three-part welcome
     series on someone who asked a direct question is how a brand starts feeling
     automated. Only the community sign-up is someone asking to hear from us.

     Dedupe is keyed on the email, so signing up twice from two different pages
     does not queue the series twice. */
  if (formType === 'community' && lead && lead.email) {
    try {
      const first = lead.firstName || lead.first_name || '';
      for (const step of LIFECYCLE.SUBSCRIBER) {
        await queueEmail({
          templateKey: step.key,
          toEmail: lead.email,
          toName: first,
          merge: { customer_name: first || 'there' },
          delayDays: step.delayDays,
          dedupeKey: dedupe(step.key, lead.email.toLowerCase()),
          source: 'submit-lead:community',
        });
      }
    } catch (e) {
      console.error('Subscriber series not queued:', e.message);
    }
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: true, eventId: meta.eventId }),
  };
};
