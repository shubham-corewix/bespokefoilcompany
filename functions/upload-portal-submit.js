/**
 * upload-portal-submit.js
 * Phase 1 of the upload portal submit.
 *
 * Receives ONLY the text fields (a few KB) and returns a signed upload token
 * per file the customer actually attached. The browser then uploads each file
 * DIRECTLY to Supabase Storage.
 *
 * Why it is split in two phases:
 *   - Netlify functions cap request payloads at 6MB and it cannot be raised
 *     (AWS Lambda quota). A phone video is routinely 60-100MB, so the file can
 *     never travel through here.
 *   - Writing the row FIRST means a dropped upload still leaves us the
 *     customer's name, order number and personalisation. Today a failed submit
 *     loses everything. Chase these via the uploads_incomplete view.
 *
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'upload-portal';

/* Slots the form may send. Anything else in the payload is ignored. */
const FILE_SLOTS = {
  printSheet1: 'print_sheet_1_path',
  printSheet2: 'print_sheet_2_path',
  socialPhoto: 'social_photo_path',
  socialVideo: 'social_video_path',
};

const EXT_BY_TYPE = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
  'image/heic': 'heic', 'image/heif': 'heif',
  'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm',
};

/* Must mirror the table's allowed_mime_types and the bucket policy. */
const ALLOWED_TYPES = Object.keys(EXT_BY_TYPE);
const MAX_BYTES = 50 * 1024 * 1024; // keep in step with bucket file_size_limit

/* Per-country national significant number lengths, leading zero stripped.
   MUST match COUNTRIES in upload-portal-form.html - the browser check is for
   UX, this one is the check that actually counts. Never trust the client. */
const PHONE_RULES = {
  GB: { dial: '+44', min: 9,  max: 10 },
  IE: { dial: '+353', min: 7, max: 9  },
  US: { dial: '+1',  min: 10, max: 10 },
  CA: { dial: '+1',  min: 10, max: 10 },
  AU: { dial: '+61', min: 9,  max: 9  },
  NZ: { dial: '+64', min: 8,  max: 10 },
};

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify(body),
  };
}

async function sb(path, { method = 'GET', body, prefer, raw } = {}) {
  const headers = {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
  };
  if (!raw) headers['Content-Type'] = 'application/json';
  if (prefer) headers.Prefer = prefer;

  const res = await fetch(`${SUPABASE_URL}${path}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase ${method} ${path} -> ${res.status}: ${text}`);
  try { return text ? JSON.parse(text) : null; } catch { return null; }
}

const str = (v, max) => String(v == null ? '' : v).trim().slice(0, max);

function reference() {
  // Short, unambiguous, human-readable over the phone: no O/0/I/1.
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 8; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `UP-${out}`;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('Supabase env vars missing');
    return json(500, { error: 'Server not configured' });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'Malformed request' });
  }

  /* ---- Server-side validation. The browser validation is UX only; this is
     the one that decides. A bad actor posting straight at this endpoint gets
     the same treatment as a typo. ---------------------------------------- */
  const errors = {};

  const fullName = str(payload.fullName, 120);
  if (!fullName) errors.fullName = 'Please enter your full name.';

  const email = str(payload.email, 200);
  if (!EMAIL_RE.test(email)) errors.email = 'Please enter a valid email address.';

  const country = str(payload.phoneCountry, 2).toUpperCase() || 'GB';
  const rule = PHONE_RULES[country];
  if (!rule) errors.phone = 'Please choose a country for your phone number.';

  /* Same normalisation as the browser: strip the dial code if pasted, then
     the trunk zero. Must stay in step with phoneDigits() in the form. */
  let digits = str(payload.phone, 32).replace(/\D/g, '');
  if (rule) {
    const cc = rule.dial.replace('+', '');
    digits = digits.replace(/^00/, ''); // 0044... international prefix
    if (digits.startsWith(cc)) {
      const rest = digits.slice(cc.length).replace(/^0+/, '');
      if (rest.length >= rule.min && rest.length <= rule.max) digits = rest;
    }
  }
  digits = digits.replace(/^0+/, '');
  if (rule && (digits.length < rule.min || digits.length > rule.max)) {
    errors.phone = rule.min === rule.max
      ? `A ${country} number should be ${rule.min} digits.`
      : `A ${country} number should be ${rule.min} to ${rule.max} digits.`;
  }

  const orderNumber = str(payload.orderNumber, 60);
  if (!orderNumber) errors.orderNumber = 'Please enter your order number.';

  if (Object.keys(errors).length) return json(422, { error: 'Validation failed', errors });

  /* ---- Which files are we expecting? -------------------------------------
     The browser declares each file's type and size up front so we can reject
     an oversized video BEFORE the customer waits through an upload that was
     always going to fail at the bucket. ------------------------------------ */
  const declared = Array.isArray(payload.files) ? payload.files : [];
  const uploads = [];
  const paths = {};
  const ref = reference();

  for (const f of declared) {
    const slot = str(f && f.slot, 40);
    if (!FILE_SLOTS[slot]) continue;

    const type = str(f.type, 100).toLowerCase();
    const size = Number(f.size) || 0;

    if (!ALLOWED_TYPES.includes(type)) {
      return json(422, {
        error: 'Validation failed',
        errors: { [slot]: 'That file type is not supported. Please use a photo or video from your phone.' },
      });
    }
    if (size > MAX_BYTES) {
      return json(422, {
        error: 'Validation failed',
        errors: { [slot]: `That file is ${(size / 1048576).toFixed(0)}MB. The limit is ${MAX_BYTES / 1048576}MB - please send a shorter video.` },
      });
    }

    const path = `${new Date().toISOString().slice(0, 7)}/${ref}/${slot}.${EXT_BY_TYPE[type]}`;
    paths[FILE_SLOTS[slot]] = path;
    uploads.push({ slot, path });
  }

  if (!paths.print_sheet_1_path && !paths.print_sheet_2_path) {
    return json(422, {
      error: 'Validation failed',
      errors: { printSheet1: 'Please upload at least one print sheet.' },
    });
  }

  try {
    /* ---- Row first, files second. ---- */
    const rows = await sb('/rest/v1/upload_submissions', {
      method: 'POST',
      prefer: 'return=representation',
      body: [{
        reference: ref,
        full_name: fullName,
        email,
        phone_country: country,
        phone_dial_code: rule.dial,
        phone_national: digits,
        phone_e164: `${rule.dial}${digits}`,
        purchased_from: str(payload.purchasedFrom, 120) || null,
        order_number: orderNumber,
        person_line1: str(payload.personLine1, 120) || null,
        person_line2: str(payload.personLine2, 120) || null,
        font_choice: str(payload.font, 60) || null,
        layout_choice: str(payload.layout, 60) || null,
        frame_choice: str(payload.frame, 60) || null,
        card_foil: str(payload.cardFoil, 60) || null,
        proof_channel: str(payload.proofChannel, 60) || null,
        social_consent: payload.socialConsent === true || payload.socialConsent === 'on',
        addr1: str(payload.addr1, 200) || null,
        addr2: str(payload.addr2, 200) || null,
        town_city: str(payload.townCity, 120) || null,
        postcode: str(payload.postcode, 20) || null,
        user_agent: str(event.headers['user-agent'], 300) || null,
        status: 'pending',
        ...paths,
      }],
    });

    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) throw new Error('Insert returned no row');

    /* ---- Mint one signed upload token per file. Each token authorises
       exactly one object path, so a leaked token cannot write anywhere else
       in the bucket. ---------------------------------------------------- */
    const signed = [];
    for (const u of uploads) {
      const res = await sb(
        `/storage/v1/object/upload/sign/${BUCKET}/${u.path}`,
        { method: 'POST', body: {} }
      );
      // res.url looks like /object/upload/sign/<bucket>/<path>?token=...
      signed.push({
        slot: u.slot,
        uploadUrl: `${SUPABASE_URL}/storage/v1${res.url.replace(/^\/storage\/v1/, '')}`,
      });
    }

    return json(200, { id: row.id, reference: ref, uploads: signed });
  } catch (err) {
    console.error('upload-portal-submit failed:', err.message);
    return json(500, { error: 'Sorry, something went wrong saving your details. Please try again.' });
  }
};
