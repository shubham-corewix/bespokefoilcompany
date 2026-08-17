/* =============================================================================
   send-email.js - one place that talks to Mandrill
   -----------------------------------------------------------------------------
   WHY THIS EXISTS

   Four functions send transactional email today, each building its HTML inline:

     stripe-webhook.js          kit order confirmation
     addons-stripe-webhook.js   add-ons order confirmation
     submit-lead.js             lead notifications
     upload-portal-complete.js  upload thank-you + studio notification

   Dixit's step 8 moves them to a shared Mandrill template, `bfc-shell`, with the
   copy held in Supabase (`email_content`) and the branding in `email_config`.
   The template becomes the single place a design change lands, instead of four
   HTML strings drifting apart.

   NOTHING CALLS THIS YET, DELIBERATELY

   Two things this depends on live outside the repo and could not be verified:

     1. the `email_content` / `email_config` schemas - neither table appears in
        supabase/ or anywhere else here
     2. the merge variables `bfc-shell` expects

   Guessing either would mean a query that 400s or a template that renders empty,
   on the live payment path, the day after order confirmations were found broken
   for exactly that kind of reason. So this is built and tested but wired to
   nothing. See CONTRACT below for what is needed to switch it on.

   HOW IT FAILS

   It is designed so that turning it on cannot break sending. Every caller passes
   the HTML it already builds as `fallbackHtml`. If the flag is off, the table is
   missing, the template is unknown, or Mandrill rejects the send, this falls
   back to that HTML and the customer gets exactly the email they get today. The
   new path can only ever be an improvement or a no-op, never an outage.
   ============================================================================= */

/* ---------------------------------------------------------------------------
   CONTRACT - what Dixit needs to confirm before this is wired in
   ---------------------------------------------------------------------------
   1. `email_content` columns. Assumed below:
        key           text primary key   e.g. 'order-confirmation'
        subject       text               may contain handlebars
        heading       text
        body_html     text
        cta_label     text  (nullable)
        cta_url       text  (nullable)
        preheader     text  (nullable)

   2. `email_config` - one row of branding shared by every email. Assumed:
        logo_url, footer_html, address_html, support_email, brand_colour

   3. The merge variables `bfc-shell` expects. Everything in `merge` is passed
      through as `global_merge_vars`, so the names must match the template's
      handlebars placeholders exactly.

   If any of those differ, change ROW_KEYS / buildMergeVars below - nothing else.
   --------------------------------------------------------------------------- */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MANDRILL_KEY = process.env.MANDRILL_API_KEY;
const SHELL_TEMPLATE = process.env.MANDRILL_SHELL_TEMPLATE || 'bfc-shell';

/* Off unless explicitly switched on, so deploying this changes nothing. Set
   EMAIL_SHELL_ENABLED=true in Netlify once the table and template exist. */
const SHELL_ENABLED = String(process.env.EMAIL_SHELL_ENABLED || '').toLowerCase() === 'true';

async function fetchWithTimeout(url, options = {}, ms = 5000) {
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

async function sb(pathAndQuery) {
  const res = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1${pathAndQuery}`, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return JSON.parse(await res.text());
}

/* Read the copy row and the shared branding. Either missing means fall back. */
async function loadShellData(key) {
  if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set');
  const [content] = await sb(`/email_content?key=eq.${encodeURIComponent(key)}&select=*&limit=1`);
  if (!content) throw new Error(`no email_content row for key "${key}"`);
  const [config] = await sb('/email_config?select=*&limit=1');
  return { content, config: config || {} };
}

function buildMergeVars(content, config, merge) {
  /* content and config first, caller's values last - a caller can override a
     stored default, which is what makes per-order values possible at all. */
  const flat = { ...config, ...content, ...merge };
  return Object.entries(flat)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([name, value]) => ({ name, content: value }));
}

/* Mandrill returns HTTP 200 with a per-recipient status of "rejected" for a
   hard bounce or a denylisted address, so res.ok alone is not enough. */
function assertMandrillAccepted(text, res, label) {
  if (!res.ok) throw new Error(`Mandrill ${res.status} (${label}): ${text.slice(0, 200)}`);
  let parsed = null;
  try { parsed = JSON.parse(text); } catch { return; }
  if (parsed && parsed.status === 'error') throw new Error(`Mandrill ${parsed.name}: ${parsed.message}`);
  if (Array.isArray(parsed)) {
    const bad = parsed.filter((r) => !['sent', 'queued', 'scheduled'].includes(r.status));
    if (bad.length) throw new Error(`Mandrill did not accept: ${JSON.stringify(bad).slice(0, 200)}`);
  }
}

/**
 * Send one transactional email.
 *
 * @param {object}   o
 * @param {string}   o.key           row key in email_content, e.g. 'order-confirmation'
 * @param {object[]} o.to            Mandrill recipients: [{ email, type }]
 * @param {string}   o.subject       used when the shell path is off or fails
 * @param {string}   o.fallbackHtml  the HTML the caller builds today - REQUIRED
 * @param {string}   [o.fallbackText]
 * @param {object}   [o.merge]       per-send values for the template
 * @param {string}   [o.fromEmail]
 * @param {string}   [o.fromName]
 * @param {object}   [o.metadata]
 * @returns {Promise<{ok: boolean, via: 'shell'|'inline'}>}
 */
async function sendEmail(o) {
  if (!MANDRILL_KEY) {
    console.warn('MANDRILL_API_KEY not set - email skipped');
    return { ok: false, via: 'none' };
  }
  if (!o.fallbackHtml) throw new Error('sendEmail: fallbackHtml is required - it is what makes this safe');

  const from_email = o.fromEmail || process.env.EMAIL_FROM || 'hello@thebespokefoilcompany.co.uk';
  const from_name = o.fromName || 'The Bespoke Foil Company';

  if (SHELL_ENABLED) {
    try {
      const { content, config } = await loadShellData(o.key);
      const res = await fetchWithTimeout('https://mandrillapp.com/api/1.0/messages/send-template.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: MANDRILL_KEY,
          template_name: SHELL_TEMPLATE,
          template_content: [],          // required by the API even when unused
          message: {
            subject: content.subject || o.subject,
            from_email, from_name,
            to: o.to,
            merge_language: 'handlebars',
            global_merge_vars: buildMergeVars(content, config, o.merge || {}),
            ...(o.metadata ? { metadata: o.metadata } : {}),
          },
        }),
      });
      assertMandrillAccepted(await res.text().catch(() => ''), res, SHELL_TEMPLATE);
      console.log(`[email] sent "${o.key}" via ${SHELL_TEMPLATE}`);
      return { ok: true, via: 'shell' };
    } catch (err) {
      /* Loud, because a silent fallback would hide that the new path is broken
         while everything still appeared to work. */
      console.error(`[email] shell path failed for "${o.key}", falling back to inline HTML:`, err.message);
    }
  }

  const res = await fetchWithTimeout('https://mandrillapp.com/api/1.0/messages/send.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key: MANDRILL_KEY,
      message: {
        subject: o.subject,
        from_email, from_name,
        to: o.to,
        html: o.fallbackHtml,
        ...(o.fallbackText ? { text: o.fallbackText } : {}),
        ...(o.metadata ? { metadata: o.metadata } : {}),
      },
    }),
  });
  assertMandrillAccepted(await res.text().catch(() => ''), res, 'inline');
  return { ok: true, via: 'inline' };
}

module.exports = { sendEmail };
