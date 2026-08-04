/**
 * upload-portal-purge.js
 * Scheduled weekly. Deletes Storage objects past the retention window.
 *
 * THREE SAFETY RULES, in order of importance:
 *   1. Only submissions with `downloaded_at` set are ever eligible. A batch
 *      nobody has pulled down cannot be deleted, however old it is. This is
 *      the interlock that makes automated deletion safe rather than alarming.
 *   2. Files are deleted, ROWS ARE KEPT. The row is ~2KB and holds the order
 *      history; the media is the expensive part. Status becomes 'purged'.
 *   3. Dry run by default. Set UPLOAD_PURGE_ENABLED=true to actually delete.
 *      Run it a few weeks in dry run and read the logs before arming it.
 *
 * Schedule is set in netlify.toml. Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 * UPLOAD_RETENTION_DAYS (default 90), UPLOAD_PURGE_ENABLED (default false).
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'upload-portal';

const RETENTION_DAYS = parseInt(process.env.UPLOAD_RETENTION_DAYS || '90', 10);
const ARMED = String(process.env.UPLOAD_PURGE_ENABLED || '').toLowerCase() === 'true';
const BATCH = 200;

const PATH_COLUMNS = [
  'print_sheet_1_path', 'print_sheet_2_path',
  'social_photo_path', 'social_video_path',
];

async function sb(path, { method = 'GET', body, prefer } = {}) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase ${method} ${path} -> ${res.status}: ${text}`);
  try { return text ? JSON.parse(text) : null; } catch { return null; }
}

exports.handler = async () => {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('purge: Supabase env vars missing');
    return { statusCode: 500, body: 'Not configured' };
  }

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 86400000).toISOString();
  console.log(
    `purge: retention ${RETENTION_DAYS}d, cutoff ${cutoff}, ` +
    `mode ${ARMED ? 'ARMED (will delete)' : 'DRY RUN (no deletions)'}`
  );

  try {
    /* Eligibility, all four conditions required:
       downloaded (interlock) + downloaded before cutoff + not already purged
       + status complete. */
    const rows = await sb(
      '/rest/v1/upload_submissions' +
      '?select=id,reference,downloaded_at,' + PATH_COLUMNS.join(',') +
      '&status=eq.complete' +
      '&files_purged_at=is.null' +
      '&downloaded_at=not.is.null' +
      `&downloaded_at=lt.${encodeURIComponent(cutoff)}` +
      `&order=downloaded_at.asc&limit=${BATCH}`
    );

    if (!Array.isArray(rows) || !rows.length) {
      console.log('purge: nothing eligible');
      return { statusCode: 200, body: 'Nothing to purge' };
    }

    const objects = [];
    for (const r of rows) {
      for (const col of PATH_COLUMNS) if (r[col]) objects.push(r[col]);
    }

    console.log(`purge: ${rows.length} submissions, ${objects.length} objects eligible`);

    if (!ARMED) {
      console.log('purge: DRY RUN - would delete:\n  ' + objects.join('\n  '));
      return { statusCode: 200, body: `Dry run: ${objects.length} objects would be deleted` };
    }

    // Storage delete accepts a batch of prefixes in one call.
    await sb(`/storage/v1/object/${BUCKET}`, {
      method: 'DELETE',
      body: { prefixes: objects },
    });

    const now = new Date().toISOString();
    for (const r of rows) {
      await sb(`/rest/v1/upload_submissions?id=eq.${encodeURIComponent(r.id)}`, {
        method: 'PATCH',
        prefer: 'return=minimal',
        body: { status: 'purged', files_purged_at: now },
      });
    }

    console.log(`purge: deleted ${objects.length} objects across ${rows.length} submissions`);
    return { statusCode: 200, body: `Purged ${objects.length} objects` };
  } catch (err) {
    console.error('purge failed:', err.message);
    return { statusCode: 500, body: 'Purge failed' };
  }
};
