# Upload Portal - wire-up brief

**For:** Dixit | **Date:** 28/07/2026 | **Owner:** Ryan

All seven asks are built. No new npm dependencies; `stripe` is still the only one.

**Files**

- `upload-portal-form.html` (modified)
- `functions/upload-portal-submit.js` (new)
- `functions/upload-portal-complete.js` (new)
- `functions/upload-portal-purge.js` (new, scheduled)
- `supabase/upload-portal.sql` (new)
- `_redirects`, `netlify.toml` (two routes, one schedule)

---

## Why files do not go through Netlify Blobs

Blobs was the original plan and it cannot work here. **Netlify Blobs has no browser upload path** - the file has to be accepted by a function and written with `set()`, so every byte still crosses the **6MB function payload cap, which is an AWS Lambda quota and cannot be raised on any plan.** A phone video is routinely 60-100MB.

Reading back is worse: **Blobs has no public URLs**, so serving a file means a function returning it, and the 6MB limit applies to responses too. Ashley would be locked out of files larger than 6MB.

Zendesk has the same wall from the other side: **a single attachment is capped at 50MB and Zendesk states it cannot be increased.** Their own documented answer for larger files is to host elsewhere and link, which is what BFC already does today.

So: **Supabase Storage holds the files, Zendesk holds the workflow, the ticket carries links.**

---

## The two-phase submit

The important property is that **the row is written before any file moves.**

1. Browser POSTs **text fields only** (a few KB) to `/upload-portal-submit`. Server validates, inserts the row with status `pending`, and returns one **signed upload token per attached file**. Each token authorises exactly one object path, so a leaked token cannot write anywhere else in the bucket.
2. Browser PUTs each file **direct to Supabase Storage** via XHR, with a real progress bar. Nothing touches a function.
3. Browser calls `/upload-portal-complete`. Server **verifies each object actually exists**, mints 90-day signed download links, raises the Zendesk ticket and flips the row to `complete`.

If a mum on a shaky connection loses the video at step 2, you still have her name, order number and personalisation. Today a failed submit loses everything and silently redirects to the thank-you page as if it worked. That behaviour is gone: failures now surface an error and keep her on the form.

Chase dropped submissions with the `uploads_incomplete` view (pending for over 2 hours).

---

## Ordered setup

1. **Run `supabase/upload-portal.sql`.** Creates the table, the two working views, RLS, and the private `upload-portal` bucket with a 50MB per-file cap and a MIME allowlist.
2. **Set env vars**, then redeploy (Netlify does not pick up env changes without one):
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` - service role, not anon. Server-side only; it bypasses RLS and must never appear in an edge function or client file.
   - `ZENDESK_SUBDOMAIN`, `ZENDESK_EMAIL`, `ZENDESK_API_TOKEN`
   - `UPLOAD_RETENTION_DAYS` (default 90), `UPLOAD_PURGE_ENABLED` (default false)
3. **Plan check.** The free plan is 1GB of file storage, which will not hold a fortnight at current volume. Pro includes 100GB. If you go Pro, raise the project's global file size limit **and** the bucket's `file_size_limit` together, the global one takes precedence.

---

## The seven asks

**1. Inline error labels per step.** A `<p class="frm-err" role="alert">` is created on demand under each field, with a specific message rather than a generic one ("That should be 10 digits for GB. You have entered 8."). Errors clear as the customer corrects them.

**2. Country dropdown.** GB, IE, US, CA, AU, NZ. Deliberately short: rules I can verify beat a 200-entry list I cannot. Placeholder updates to a real example for the selected country.

**3. Per-country digit validation.** National significant number lengths, trunk zero stripped: GB 9-10, IE 7-9, US/CA 10, AU 9, NZ 8-10. Pasted `+44...` and `0044...` prefixes are stripped automatically, since people paste from their contacts.
**The client and server rule tables must stay identical** - `COUNTRIES` in the form and `PHONE_RULES` in `upload-portal-submit.js`. Change one, change both.

**4. JS validation instead of the `required` attribute.** All 28 `required` attributes are now `data-required`, the form carries `novalidate`, and validation is driven entirely from `data-required`. Radios, checkboxes, selects, files and the phone field each have their own rule. On submit, **every step is validated, not just the visible one**, so nobody slips through via Skip or the back button.

**5. Supabase table.** `upload_submissions`, one row per submission, plus `uploads_awaiting_download` and `uploads_incomplete` for Ashley. Field names map 1:1 to the form.

**6. Storage.** Supabase Storage, not Blobs, for the reasons above.

**7. Retention.** Weekly scheduled purge, Mondays 03:00.

---

## Retention safety

Three rules, in order:

1. **Nothing is purgeable until `downloaded_at` is stamped.** A batch nobody has pulled down can never be deleted, however old. This is the interlock that makes automated deletion safe.
2. **Files are deleted, rows are kept.** The row is ~2KB and holds the order history; only the media is expensive. Status becomes `purged`.
3. **It ships in DRY RUN.** It logs what it would delete and deletes nothing until `UPLOAD_PURGE_ENABLED=true`. Leave it in dry run for a few weeks and read the logs before arming it.

Note that nothing currently sets `downloaded_at` - that hook is Ashley's download step and needs wiring to however she pulls files down. **Until it is set, the purge will correctly never delete anything.** That is the safe failure direction, but it does mean storage grows until it is wired.

---

## Two things worth knowing

**Server validation is the one that counts.** The browser checks are UX. `upload-portal-submit.js` revalidates everything independently, including file type and size, so posting straight at the endpoint gets the same treatment as a typo.

**Zendesk WhatsApp custom field.** Field `4751824796959` ("WhatsApp", Text type, created by Ashley 12/04/2025) is populated with the customer's number in E.164, e.g. `+447700900123`. Overridable with `ZENDESK_WHATSAPP_FIELD_ID` if a sandbox uses a different id.

A `proof-whatsapp` / `proof-email` tag is now also set from the customer's proof choice. **Condition any WhatsApp automation on that tag, not on the WhatsApp field being non-empty.** The tag says what the customer asked for; a populated field only says we know their number. If an existing trigger already fires on the field being non-empty, set `ZENDESK_WHATSAPP_MODE=proof-only` so customers who chose Email are not messaged on WhatsApp without asking.

If the WhatsApp integration wants the number without the leading `+`, strip it in `whatsappField()` - one place, not four.

**Zendesk failure is non-blocking.** If Zendesk is down, the files are already safely in Storage and the row is marked complete. The error is logged and the customer is not asked to resubmit. Worth a log alert on `Zendesk ticket failed` so a silent outage does not become a pile of untracked submissions.
