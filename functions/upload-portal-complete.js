/**
 * upload-portal-complete.js
 * Phase 2 of the upload portal submit.
 *
 * Called by the browser once every file has landed in Storage. Verifies the
 * objects actually exist, flips the row to complete, mints long-lived signed
 * DOWNLOAD links and raises the Zendesk ticket carrying those links.
 *
 * Links not attachments, deliberately: Zendesk caps a single attachment at
 * 50MB and states it cannot be raised, so a phone video could never attach.
 * Linking is Zendesk's own documented answer for oversized files, and it
 * matches how BFC already works today.
 *
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *      ZENDESK_SUBDOMAIN, ZENDESK_EMAIL, ZENDESK_API_TOKEN,
 *      MANDRILL_API_KEY, EMAIL_FROM,
 *      MANDRILL_UPLOAD_TEMPLATE (optional, defaults below),
 *      WHATSAPP_AUTH_CODE (optional, falls back to the briefed literal),
 *      SHIPSTATION_API_KEY, SHIPSTATION_API_SECRET (same values as the kit checkout),
 *      UPLOAD_NOTIFY_TO (optional, defaults to hello@thebespokefoilcompany.co.uk)
 */

const { queueEmail } = require('./_shared/queue-email');
const { sendEmail } = require('./_shared/send-email');
const { LIFECYCLE, dedupe } = require('./_shared/lifecycle');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'upload-portal';

const ZD_SUBDOMAIN = process.env.ZENDESK_SUBDOMAIN;
const ZD_EMAIL = process.env.ZENDESK_EMAIL;
const ZD_TOKEN = process.env.ZENDESK_API_TOKEN;

/* Signed download links must outlive the ticket's working life. 90 days
   matches the retention window; once files are purged the link 404s, which is
   correct - by then the originals are in the local archive. */
const LINK_TTL_SECONDS = 90 * 24 * 60 * 60;

/* Zendesk custom field "WhatsApp" (Customer WhatsApp number), created by
   Ashley 12/04/2025. Numeric id, taken from the field's admin URL. Overridable
   by env so a sandbox with a different field id does not need a code change.
   Field type is Text, so the value must be a string. */
const ZD_WHATSAPP_FIELD_ID = Number(process.env.ZENDESK_WHATSAPP_FIELD_ID || 4751824796959);

/* Populate the WhatsApp field for EVERY submission, or only when the customer
   actually chose WhatsApp for their proof?
     'always'     - the number is the number; an agent can message anyone.
     'proof-only' - only when proofChannel === 'WhatsApp'.
   Set to 'proof-only' if any Zendesk trigger starts a WhatsApp flow simply
   because this field is non-empty, otherwise customers who chose Email would
   get messaged on WhatsApp without asking. */
const ZD_WHATSAPP_MODE = process.env.ZENDESK_WHATSAPP_MODE || 'proof-only';

/* ---------------------------------------------------------------------------
   POST-TICKET AUTOMATION (Dixit's brief, 12/08/2026)
   Thank-you email, then the WhatsApp welcome. Both run only once the Zendesk
   ticket exists - the WhatsApp endpoint takes the ticket id, and Ryan's call
   (12/08) is that the email follows the same rule rather than going out on its
   own when Zendesk is down.
   --------------------------------------------------------------------------- */

const MANDRILL_KEY = process.env.MANDRILL_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'hello@thebespokefoilcompany.co.uk';

/* Mandrill's `template_name` takes the template SLUG, not the display name
   shown in the dashboard. "Upload Portal - Thank you" slugifies to the default
   below. Env-overridable because a wrong slug is a silent no-email: Mandrill
   answers Unknown_Template, this file logs it, and nothing reaches the
   customer. Being able to correct it in the Netlify dashboard makes that a
   two-minute fix instead of a redeploy. */
const MANDRILL_UPLOAD_TEMPLATE = process.env.MANDRILL_UPLOAD_TEMPLATE || 'upload-portal-thank-you';

/* WhatsApp welcome automation.

   The auth code is a shared secret travelling in a query string. Env-first
   (Dixit, 12/08) so it can be rotated in the Netlify dashboard without a
   redeploy, with the briefed literal as a fallback so the automation keeps
   working if the variable has not been set yet - a missing env var must not
   silently stop customers being messaged.

   Be clear about what this does and does not buy: the fallback means the
   secret is STILL in the repo, so this gives rotation, not secrecy. Removing
   the literal is the step that actually takes it out of source, and that
   should only happen once WHATSAPP_AUTH_CODE is confirmed set in Netlify -
   otherwise the automation stops dead. The warning below makes it obvious
   which of the two is in use. */
const WA_ENDPOINT = 'https://api.thebespokefoilcompany.co.uk/wa_i/handleWelcomeTicket.php';
const WA_AUTH_CODE_FALLBACK = '*end*user*';
const WA_AUTH_CODE = process.env.WHATSAPP_AUTH_CODE || WA_AUTH_CODE_FALLBACK;

/* Netlify gives a synchronous function 10 seconds total, and this handler has
   already spent some of it verifying objects and signing links. Both new calls
   are capped so a third party that hangs cannot burn the remaining budget and
   turn a successful upload into a 500 the customer sees. */
const AUTOMATION_TIMEOUT_MS = 4000;

const SLOT_LABELS = {
  print_sheet_1_path: 'Print sheet 1',
  print_sheet_2_path: 'Print sheet 2',
  social_photo_path: 'Social photo',
  social_video_path: 'Social video',
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify(body),
  };
}

async function sb(path, { method = 'GET', body, prefer } = {}) {
  const headers = {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
  };
  if (prefer) headers.Prefer = prefer;
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase ${method} ${path} -> ${res.status}: ${text}`);
  try { return text ? JSON.parse(text) : null; } catch { return null; }
}

/* Confirm the object is really in the bucket before we tell Ashley it is.
   Without this a browser that failed mid-upload could still mark the
   submission complete and she would open a dead link. */
async function objectExists(path) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/info/${BUCKET}/${path}`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  return res.ok;
}

async function signedDownload(path) {
  const res = await sb(`/storage/v1/object/sign/${BUCKET}/${path}`, {
    method: 'POST',
    body: { expiresIn: LINK_TTL_SECONDS },
  });
  return `${SUPABASE_URL}/storage/v1${res.signedURL || res.signedUrl}`;
}

/* Zendesk wants custom_fields as [{ id, value }] with a numeric id. The field
   is Text type, so send the E.164 string. If the WhatsApp integration ever
   wants it without the leading plus, strip it here - one place, not four. */
function whatsappField(row) {
  if (!ZD_WHATSAPP_FIELD_ID) return undefined;
  if (ZD_WHATSAPP_MODE === 'proof-only' && row.proof_channel !== 'WhatsApp') return undefined;
  if (!row.phone_e164) return undefined;
  return [{ id: ZD_WHATSAPP_FIELD_ID, value: row.phone_e164 }];
}

async function raiseTicket(row, links) {
  if (!ZD_SUBDOMAIN || !ZD_EMAIL || !ZD_TOKEN) {
    console.warn('Zendesk env vars missing - ticket not raised');
    return null;
  }

  const line = (label, value) => (value ? `${label}: ${value}\n` : '');
  const body =
    `Upload portal submission ${row.reference}\n\n` +
    line('Order number', row.order_number) +
    line('Purchased from', row.purchased_from) +
    line('Name', row.full_name) +
    line('Email', row.email) +
    line('Phone', row.phone_e164) +
    '\nPersonalisation\n' +
    line('Line 1', row.person_line1) +
    line('Line 2', row.person_line2) +
    line('Font', row.font_choice) +
    line('Layout', row.layout_choice) +
    line('Frame', row.frame_choice) +
    line('Card foil', row.card_foil) +
    '\nProof + delivery\n' +
    line('Proof by', row.proof_channel) +
    line('Address', [row.addr1, row.addr2, row.town_city, row.postcode].filter(Boolean).join(', ')) +
    `Social consent: ${row.social_consent ? 'YES - may be shared' : 'No'}\n` +
    '\nFiles (links expire in 90 days)\n' +
    links.map(l => `${l.label}: ${l.url}`).join('\n');

  const res = await fetch(`https://${ZD_SUBDOMAIN}.zendesk.com/api/v2/tickets.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + Buffer.from(`${ZD_EMAIL}/token:${ZD_TOKEN}`).toString('base64'),
    },
    body: JSON.stringify({
      ticket: {
        subject: `Upload portal - ${row.full_name} - order ${row.order_number}`,
        comment: { body },
        requester: { name: row.full_name, email: row.email },
        tags: [
          'upload-portal',
          row.social_consent ? 'social-consent' : 'no-social-consent',
          /* Explicit proof-channel tag. Condition WhatsApp triggers on THIS,
             not on the WhatsApp field being non-empty - a tag says what the
             customer chose, a populated field only says we know their number. */
          row.proof_channel === 'WhatsApp' ? 'proof-whatsapp' : 'proof-email',
        ],
        custom_fields: whatsappField(row),
        external_id: row.reference,
      },
    }),
  });

  if (!res.ok) throw new Error(`Zendesk ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data?.ticket?.id ? String(data.ticket.id) : null;
}

/* fetch with a hard ceiling. Without this a hanging endpoint takes the whole
   function down with it and the customer is told their upload failed when it
   did not. */
async function fetchWithTimeout(url, options = {}, ms = AUTOMATION_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (e) {
    if (e.name === 'AbortError') throw new Error(`timed out after ${ms}ms`);
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

/* Thank-you email via the Mandrill TEMPLATE endpoint.
   Note this is send-template.json, not the send.json used everywhere else in
   this repo - a stored template with a merge variable needs the template
   endpoint, and passing a template name to send.json silently sends nothing.

   Mandrill's failure modes here are unusual and worth stating, because the
   obvious `if (!res.ok)` check misses most of them: a rejected recipient comes
   back as HTTP 200 with a per-recipient status of "rejected" or "invalid" in a
   JSON array, so a hard-bounced or denylisted address looks like success. Both
   shapes are inspected below. */
async function sendThankYouEmail(row) {
  /* bfc-shell when enabled, today's template when not.
     Uses send-template.json already, so the fallback here is the existing
     MANDRILL_UPLOAD_TEMPLATE send rather than inline HTML. Same principle:
     the working path becomes the safety net, not the thing replaced. */

  if (!MANDRILL_KEY) {
    console.warn('MANDRILL_API_KEY not set - thank-you email skipped');
    return { skipped: true };
  }
  if (!row.email) {
    console.warn(`No email on submission ${row.reference} - thank-you email skipped`);
    return { skipped: true };
  }

  /* Customer only, no BCC. One was added on 13/08 because nothing told the
     studio an upload had landed; sendStudioNotification() does that properly
     now, with every field and the file links. Copying head office here as well
     would put two emails in hello@ per upload, the useful one buried under a
     copy of a customer message. Removed at Ryan's request, 14/08. */

  const res = await fetchWithTimeout('https://mandrillapp.com/api/1.0/messages/send-template.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key: MANDRILL_KEY,
      template_name: MANDRILL_UPLOAD_TEMPLATE,
      /* Required by the API even when the template needs no injected blocks.
         Omitting it is an invalid request, not a default. */
      template_content: [],
      message: {
        subject: 'We\u2019ve received your prints',
        from_email: EMAIL_FROM,
        from_name: 'The Bespoke Foil Company',
        to: [{ email: row.email, type: 'to' }],
        /* FNAME as the template expects. merge_language is deliberately NOT
           set: omitting it makes Mandrill use the template's own setting, so
           this works whether the template was built with *|FNAME|* or
           {{FNAME}}. Forcing one here would break the other. */
        global_merge_vars: [{ name: 'FNAME', content: row.full_name || '' }],
        metadata: { reference: row.reference },
      },
    }),
  });

  const text = await res.text().catch(() => '');
  if (!res.ok) {
    /* Unknown_Template lands here. Surface the template name, because that is
       almost always what is wrong and the message alone does not say. */
    throw new Error(`Mandrill ${res.status} (template "${MANDRILL_UPLOAD_TEMPLATE}"): ${text.slice(0, 300)}`);
  }

  let parsed = null;
  try { parsed = JSON.parse(text); } catch { /* fall through to the log below */ }

  if (parsed && parsed.status === 'error') {
    throw new Error(`Mandrill ${parsed.name} (template "${MANDRILL_UPLOAD_TEMPLATE}"): ${parsed.message}`);
  }
  if (Array.isArray(parsed)) {
    const bad = parsed.filter(r => !['sent', 'queued', 'scheduled'].includes(r.status));
    if (bad.length) {
      throw new Error(`Mandrill did not accept the message: ${JSON.stringify(bad).slice(0, 300)}`);
    }
    console.log(`Thank-you email ${parsed[0] && parsed[0].status} for ${row.reference} -> ${row.email}`);
    return { ok: true, status: parsed[0] && parsed[0].status };
  }

  console.log(`Thank-you email sent for ${row.reference} (unrecognised response shape: ${text.slice(0, 120)})`);
  return { ok: true };
}

/* WhatsApp welcome. GET, with the Zendesk ticket id it was raised against.
   encodeURIComponent leaves the briefed auth code byte-for-byte unchanged
   (asterisks are not escaped) while still protecting the URL if the value is
   ever rotated to something that needs escaping. */
async function triggerWhatsAppWelcome(ticketId, reference) {
  if (!process.env.WHATSAPP_AUTH_CODE) {
    console.warn('WHATSAPP_AUTH_CODE not set - using the fallback code from source');
  }
  const url = `${WA_ENDPOINT}?ticket_id=${encodeURIComponent(ticketId)}` +
    `&auth_code=${encodeURIComponent(WA_AUTH_CODE)}`;

  const res = await fetchWithTimeout(url, { method: 'GET' });
  const text = await res.text().catch(() => '');
  if (!res.ok) {
    throw new Error(`WhatsApp API ${res.status} for ticket ${ticketId}: ${text.slice(0, 300)}`);
  }
  console.log(`WhatsApp welcome triggered for ${reference}, ticket ${ticketId}: ${text.slice(0, 200)}`);
  return { ok: true };
}

/* ---------------------------------------------------------------------------
   SHIPSTATION PRODUCTION ORDER (Ryan, 13/08)
   ---------------------------------------------------------------------------
   The old Wix site did this through Zapier: catch hook, Zendesk find user,
   Zendesk create ticket, THEN ShipStation create order, then the email. That
   ShipStation step never made it into this function, so uploads were raising a
   ticket and going no further - nothing appeared in the studio queue.

   It matters beyond the studio. This is the "manual order" whose despatch fires
   Email 5 and, seven days later, the Trustpilot invitation. With no order
   there is no despatch event, so the entire back half of the customer lifecycle
   never runs.

   This is a PRODUCTION order - make the foil print and post it back - not the
   kit order, which ShipStation already holds from the original purchase.

   orderNumber uses the upload reference (UP-XXXXXXXX) rather than the customer's
   original order number, because the kit order already occupies that number and
   two ShipStation orders sharing one number is how a studio ships the wrong
   thing. The original is carried in customField1 and at the top of the notes,
   where the studio actually reads it. orderKey is the row id, so a retry
   updates the same order instead of creating a duplicate.
   --------------------------------------------------------------------------- */

const SHIPSTATION_URL = 'https://ssapi.shipstation.com/orders/createorder';

function ssAuth() {
  const raw = `${process.env.SHIPSTATION_API_KEY}:${process.env.SHIPSTATION_API_SECRET}`;
  return 'Basic ' + Buffer.from(raw).toString('base64');
}

async function createProductionOrder(row, ticketId) {
  if (!process.env.SHIPSTATION_API_KEY || !process.env.SHIPSTATION_API_SECRET) {
    console.warn('SHIPSTATION_API_KEY / SHIPSTATION_API_SECRET not set - production order skipped');
    return { skipped: true };
  }

  const notes = [
    `ORIGINAL ORDER: ${row.order_number || 'not given'}`,
    `Upload reference: ${row.reference}`,
    ticketId ? `Zendesk ticket: ${ticketId}` : null,
    row.purchased_from ? `Purchased from: ${row.purchased_from}` : null,
    '',
    row.person_line1 ? `Line 1: ${row.person_line1}` : null,
    row.person_line2 ? `Line 2: ${row.person_line2}` : null,
    row.font_choice ? `Font: ${row.font_choice}` : null,
    row.layout_choice ? `Layout: ${row.layout_choice}` : null,
    row.frame_choice ? `Frame: ${row.frame_choice}` : null,
    row.card_foil ? `Card / foil: ${row.card_foil}` : null,
    '',
    `Proof by: ${row.proof_channel || 'not given'}`,
    `Social consent: ${row.social_consent ? 'YES' : 'no'}`,
  ].filter((l) => l !== null).join('\n');

  const order = {
    orderNumber: row.reference,
    orderKey: row.id,                      // idempotent: a retry updates, never duplicates
    orderDate: new Date().toISOString(),
    orderStatus: 'awaiting_shipment',
    customerEmail: row.email,
    billTo: { name: row.full_name || 'Customer' },
    shipTo: {
      name: row.full_name || 'Customer',
      street1: row.addr1 || '',
      street2: row.addr2 || '',
      city: row.town_city || '',
      postalCode: row.postcode || '',
      country: 'GB',
      phone: row.phone_e164 || '',
    },
    items: [{
      sku: 'BFC-PRINT-PRODUCTION',
      name: `Finished foil print${row.frame_choice ? ` - ${row.frame_choice}` : ''}`,
      quantity: 1,
      /* Zero, deliberately: the customer paid for this when they bought the
         kit. A price here would double-count the order in ShipStation's
         reporting. */
      unitPrice: 0,
    }],
    customField1: row.order_number || '',
    customField2: row.proof_channel || '',
    customerNotes: notes,
  };

  const res = await fetchWithTimeout(SHIPSTATION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: ssAuth() },
    body: JSON.stringify(order),
  }, 6000);

  const text = await res.text().catch(() => '');
  if (!res.ok) {
    throw new Error(`ShipStation ${res.status} for ${row.reference}: ${text.slice(0, 300)}`);
  }
  console.log(`ShipStation production order created for ${row.reference}`);
  return { ok: true };
}

/* ---------------------------------------------------------------------------
   STUDIO NOTIFICATION (Ryan, 14/08)
   ---------------------------------------------------------------------------
   The old Wix site emailed hello@ a full table of every submitted field the
   moment someone used the upload portal. That never got ported, so the only
   signal an upload had happened was the Zendesk ticket.

   Note this is NOT the same as the BCC added on 13/08. That copies head office
   on the CUSTOMER's thank-you, which says "we have received your prints" and
   carries none of the detail - no order number, no personalisation, no file
   links. Useful as proof the customer was written to, useless for doing the
   work. This is the one Ashley actually reads.

   Field order follows the old Wix email deliberately, so anyone used to it
   finds things in the same place.

   The file links are Supabase signed URLs with a 90 day expiry, matching
   LINK_TTL_SECONDS above. They will still open when the email is read weeks
   later, and they die at roughly the point the retention sweep removes the
   files anyway.
   --------------------------------------------------------------------------- */

/* This file had no escaping helper: everything it built previously was plain
   text for Zendesk or a Mandrill template. The notification below writes raw
   HTML from customer-supplied values, so it needs one. A name containing an
   apostrophe or an angle bracket would otherwise break the table or inject
   markup into an internal inbox. */
function escapeHtml(v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

const UPLOAD_NOTIFY_TO = process.env.UPLOAD_NOTIFY_TO || 'hello@thebespokefoilcompany.co.uk';

async function sendStudioNotification(row, links, ticketId) {
  if (!MANDRILL_KEY) {
    console.warn('MANDRILL_API_KEY not set - studio notification skipped');
    return { skipped: true };
  }

  const linkFor = (label) => {
    const hit = links.find((l) => l.label === label);
    return hit ? `<a href="${escapeHtml(hit.url)}">${escapeHtml(hit.url)}</a>` : '';
  };

  const rows = [
    ['Full Name', escapeHtml(row.full_name)],
    ['Email', row.email ? `<a href="mailto:${escapeHtml(row.email)}">${escapeHtml(row.email)}</a>` : ''],
    ['Phone Number', escapeHtml(row.phone_e164)],
    ['Order Number', escapeHtml(row.order_number)],
    ['Purchased From', escapeHtml(row.purchased_from)],
    ['Receiving Proof', escapeHtml(row.proof_channel)],
    ['Line 1 (e.g. Full Name)', escapeHtml(row.person_line1)],
    ['Line 2 (e.g. Date of Birth)', escapeHtml(row.person_line2)],
    ['Font', escapeHtml(row.font_choice)],
    ['Layout', escapeHtml(row.layout_choice)],
    ['Card & Foil Colour', escapeHtml(row.card_foil)],
    ['Frame Colour', escapeHtml(row.frame_choice)],
    ['File Upload 1', linkFor('Print sheet 1')],
    ['File Upload 2', linkFor('Print sheet 2')],
    ['Photo URL', linkFor('Social photo')],
    ['Video URL', linkFor('Social video')],
    ['Social consent', row.social_consent ? 'YES' : 'no'],
    ['Address Line 1', escapeHtml(row.addr1)],
    ['Address Line 2', escapeHtml(row.addr2)],
    ['Town / City', escapeHtml(row.town_city)],
    ['Postcode', escapeHtml(row.postcode)],
    ['Upload reference', escapeHtml(row.reference)],
    ['Zendesk ticket', ticketId ? escapeHtml(String(ticketId)) : 'not raised'],
  ];

  const body = rows.map(([k, v], i) => (
    `<tr style="background:${i % 2 ? '#FFFFFF' : '#F6F6F4'}">` +
    `<td style="padding:10px 14px;font:600 13px system-ui;color:#000;width:200px;` +
    `border-bottom:1px solid #E6E4E0;vertical-align:top">${k}</td>` +
    `<td style="padding:10px 14px;font:13px system-ui;color:#111;` +
    `border-bottom:1px solid #E6E4E0;word-break:break-word">${v || '&mdash;'}</td></tr>`
  )).join('');

  const html =
    `<div style="background:#F6F6F4;padding:24px">` +
    `<div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #E6E4E0;border-radius:10px;overflow:hidden">` +
    `<h1 style="font:600 20px system-ui;color:#000;margin:0;padding:22px 20px 18px;text-align:center">Upload Portal Submission</h1>` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${body}</table>` +
    `<p style="font:12px system-ui;color:#5A5650;margin:0;padding:16px 20px;border-top:1px solid #E6E4E0">` +
    `File links expire 90 days after upload. The finished-print order is in ShipStation as ` +
    `${escapeHtml(row.reference)}.</p>` +
    `</div></div>`;

  try {
    const res = await fetchWithTimeout('https://mandrillapp.com/api/1.0/messages/send.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: MANDRILL_KEY,
        message: {
          from_email: EMAIL_FROM,
          from_name: 'Bespoke Foil Company',
          subject: `Upload Portal Submission - ${row.full_name || 'no name'}`
            + (row.order_number ? ` (${row.order_number})` : ''),
          html,
          to: [{ email: UPLOAD_NOTIFY_TO, type: 'to' }],
          // Reply goes to the customer, so the studio can just hit reply.
          headers: row.email ? { 'Reply-To': row.email } : undefined,
        },
      }),
    });
    const text = await res.text().catch(() => '');
    if (!res.ok) throw new Error(`Mandrill ${res.status}: ${text.slice(0, 200)}`);
    console.log(`Studio notification sent for ${row.reference} -> ${UPLOAD_NOTIFY_TO}`);
    return { ok: true };
  } catch (e) {
    throw new Error(`studio notification failed: ${e.message}`);
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  let payload;
  try { payload = JSON.parse(event.body || '{}'); }
  catch { return json(400, { error: 'Malformed request' }); }

  const id = String(payload.id || '').trim();
  const reference = String(payload.reference || '').trim();
  if (!id || !reference) return json(400, { error: 'Missing submission reference' });

  try {
    const rows = await sb(
      `/rest/v1/upload_submissions?id=eq.${encodeURIComponent(id)}` +
      `&reference=eq.${encodeURIComponent(reference)}&select=*&limit=1`
    );
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) return json(404, { error: 'Submission not found' });

    /* Idempotent: a double-tap or a retried request must not raise a second
       ticket for the same submission. */
    if (row.status === 'complete') {
      return json(200, { ok: true, reference: row.reference, alreadyComplete: true });
    }

    const links = [];
    const missing = [];
    for (const [column, label] of Object.entries(SLOT_LABELS)) {
      const path = row[column];
      if (!path) continue;
      if (await objectExists(path)) {
        links.push({ label, url: await signedDownload(path) });
      } else {
        missing.push(label);
      }
    }

    if (!links.length) {
      return json(422, { error: 'No files were received. Please try uploading again.' });
    }
    if (missing.length) {
      // Partial: raise the ticket with what did land, and flag the gap loudly
      // rather than silently losing it.
      links.push({ label: 'NOT RECEIVED', url: missing.join(', ') });
      console.error(`Partial upload ${reference}: missing ${missing.join(', ')}`);
    }

    let ticketId = null;
    try {
      ticketId = await raiseTicket(row, links);
    } catch (e) {
      // The files are safely in Storage and the row is complete. A Zendesk
      // outage must not lose the submission or make the customer resubmit.
      console.error('Zendesk ticket failed (non-blocking):', e.message);
    }

    await sb(`/rest/v1/upload_submissions?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      prefer: 'return=minimal',
      body: {
        status: 'complete',
        completed_at: new Date().toISOString(),
        zendesk_ticket_id: ticketId,
      },
    });

    /* Post-ticket automation, in the briefed order: ticket, then email, then
       WhatsApp.

       Deliberately AFTER the PATCH above. The row is already marked complete
       with its ticket id, so if either call below hangs or the function is cut
       short, the submission stays correctly recorded and the customer is never
       asked to upload again. Running them before the PATCH would risk leaving
       a finished submission stuck at "pending", which invites a resubmit and a
       duplicate ticket. The idempotency guard at the top of this handler means
       a retry returns early, so neither call can fire twice for one
       submission.

       Each is caught separately: a Mandrill outage must not stop the WhatsApp
       trigger, and neither can turn a successful upload into an error the
       customer sees. */
    /* Production order first, matching the old Zapier sequence: ticket,
       ShipStation, then the email. Caught separately so a ShipStation outage
       cannot stop the customer's confirmation, and vice versa. */
    try {
      await createProductionOrder(row, ticketId);
    } catch (e) {
      console.error(`ShipStation production order FAILED for ${reference}:`, e.message);
    }

    /* Studio notification. Sent regardless of whether Zendesk raised a ticket:
       if the ticket failed, this email is the ONLY record that an upload
       happened, which is exactly when it matters most. */
    try {
      await sendStudioNotification(row, links, ticketId);
    } catch (e) {
      console.error(`Studio notification FAILED for ${reference}:`, e.message);
    }

    if (ticketId) {
      try {
        await sendThankYouEmail(row);
      } catch (e) {
        console.error(`Thank-you email failed (non-blocking) for ${reference}:`, e.message);
      }
      try {
        await triggerWhatsAppWelcome(ticketId, reference);
      } catch (e) {
        console.error(`WhatsApp automation failed (non-blocking) for ${reference}:`, e.message);
      }
    } else {
      /* No ticket means Zendesk failed or its env vars are missing. Ryan's
         call (12/08): skip both rather than send a thank-you for work that
         has not reached the studio queue. The customer's files are safe and
         the row is complete; this line is the trail that says why they heard
         nothing. */
      console.warn(`No Zendesk ticket for ${reference} - thank-you email and WhatsApp automation skipped by design`);
    }

    /* Add-ons teaser onto the queue.
       ----------------------------------------------------------------------
       +1 day, not immediate. She has just handed over her baby's handprints; a
       sales email in the same minute as the thank-you reads badly, and the
       order stays open long enough for tomorrow to still be useful.

       Gated on a ticket, matching the thank-you: no ticket means something went
       wrong upstream and we should not be selling into that.

       Dedupe on the upload reference, which survives a retry. */
    if (ticketId && row.email) {
      try {
        for (const step of LIFECYCLE.UPLOAD_FOLLOW) {
          await queueEmail({
            templateKey: step.key,
            toEmail: row.email,
            toName: row.full_name || '',
            merge: {
              customer_name: (row.full_name || '').split(' ')[0] || 'there',
              order_ref: row.order_number || '',
              upload_ref: row.reference,
            },
            delayDays: step.delayDays,
            dedupeKey: dedupe(step.key, row.reference),
            source: 'upload-portal-complete',
          });
        }
      } catch (e) {
        console.error(`Add-ons teaser not queued for ${row.reference}:`, e.message);
      }
    }

    return json(200, { ok: true, reference: row.reference, ticketId });
  } catch (err) {
    console.error('upload-portal-complete failed:', err.message);
    return json(500, { error: 'Your files uploaded but we could not finish. Please contact us quoting ' + reference });
  }
};
