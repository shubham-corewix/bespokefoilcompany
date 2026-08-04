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
 *      ZENDESK_SUBDOMAIN, ZENDESK_EMAIL, ZENDESK_API_TOKEN
 */

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

    return json(200, { ok: true, reference: row.reference, ticketId });
  } catch (err) {
    console.error('upload-portal-complete failed:', err.message);
    return json(500, { error: 'Your files uploaded but we could not finish. Please contact us quoting ' + reference });
  }
};
