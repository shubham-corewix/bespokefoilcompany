# BFC GO-LIVE RUNBOOK

**Status: cutover imminent.** Of the eight blockers, six are closed - B1 closed
11/08 (audit run, all redirects in `_redirects`). B1b must still run while the
Wix site is alive; B2, B6 and B7 are open and listed below. **New 11/08: B2b -
the franchise-bios Supabase migration (`supabase/franchise-bios.sql`) must be
run before deploy or the new dynamic bio system fails visibly.**

Single source of truth for the cutover. Everything is split by **owner**, so
Ryan can work through his own items without handing Dixit anything until the
whole package is ready to go in one piece.

Last updated 07/08/2026. Narrative history of every change is in
`BFC-WEBSITE-THREAD.md`.

---

## The one-line version

The site is functionally complete and the build chain is green, but it would
currently ship a 39-URL sitemap, 404 every franchise region and blog post, drop
enquiries from three forms on the floor, and break every order confirmation
email the day the Wix account closes.

None of that is hard to fix. All of it is invisible until it is live.

---

## Blockers

Ordered by cost of getting it wrong, not by effort.

### B1. Old URLs will 404 the moment DNS moves — **CLOSED 11/08**

Dixit ran the audit (`MIGRATION-LINK-AUDIT.md`): 160 old pages crawled against
37 routed pages. All 8 unrouted URLs from Section 1 plus the Section 2 targets
(`/video-guide`, `/blog/tags/*`, `/category`, and a `/product-page/*` catch-all
covering all 13 retired Wix store URLs) now 301 in `_redirects`. Judgement
calls, overridable: `/vacancies` and `/vacancy/*` -> `/franchise` (people
looking to join the team get shown the Memory Catcher opportunity); `/linktree`,
`/challenges`, `/memory-test`, `/home-old` -> `/`.

Sections 3 (lost inbound internal links) and 4 (lost anchor text) are SEO
recovery work for Mark, not go-live blockers - the report is the input for his
internal-linking pass. Dixit agrees (11/08) and also notes most Section-2
product URLs were Wix-only add-on SKUs with no new equivalent - true, but they
still 301 via the catch-all rather than being ignored, which costs nothing and
keeps any external backlinks.

**11/08 decisions on the three missing pages Dixit listed:**
- `/vacancies` and `/vacancy/*` - NOT being rebuilt (Ryan). 301s stay so the
  URLs keep their equity; target is `/franchise` as the live "work with BFC"
  route. One-line change if a real careers page ever lands.
- `/linktree` - IS being rebuilt, priority, content pending from Ryan. Temporary
  301 to home so it never 404s; swaps to a 200 rewrite when the page ships.

**KNOWN GAP in the audit's coverage - action before DNS moves.** The crawler
seeds from the OLD site's `sitemap.xml` only (it does not follow links), so any
page Google indexed that Wix left out of its sitemap is invisible to it. Two
were found by hand in Google's index within minutes: `/personalised-foil-print-gifts`
and `/members` - neither appeared in the audit, neither had a rule, both now
301. `/product-page/family-tree-print-personalised` was also absent from the
audit but was already caught by the `/product-page/*` catch-all.

**The complete list comes from Search Console -> Pages -> indexed URLs on the
OLD property, exported and diffed against the audit.** The audit script's own
error path recommends exactly this. Cheap, and the only way to know how many
more there are.

<details><summary>Original blocker text</summary>
The only irreversible item on this list. Every old URL without a redirect throws
away its backlinks permanently, and the comparison becomes impossible once the
old site is gone.
</details>

```bash
node scripts/migration-link-audit.js
```

Needs Node 18+ and outbound access to the live old site. See
`HOW-TO-RUN-THE-LINK-AUDIT.md`. Section 1 of the report is a paste-ready
`_redirects` block. Section 3 answers Mark's "has all the internal linking been
added?" with numbers.

**Run while the old site is still up.**

### B1b. Blog FAQs and Final Thoughts were lost in migration — **OWNER: RYAN, TODAY**

Also irreversible once the Wix account closes.

On Wix, "FAQs" and "Final Thoughts" are `<h2>` headings **inside the post body**,
not structured fields. The migration correctly cut them out of the body and then
never populated the new template's structured `faqs[]` and `final_thoughts`
fields. So the body stops early, the FAQ accordion renders empty, and Final
Thoughts does not appear at all.

Confirmed on `why-every-parent-needs-a-baby-footprint-keepsake`: the live post
has four Q&As and three closing paragraphs the new site does not show. Every
post follows the same shape, so assume all 15.

This also costs FAQPage rich results, one of the few still available.

```bash
node scripts/recover-blog-faqs.js
```

Writes `blog-faq-recovery.json`. It does **not** write to Supabase - read it
first, then load `faqs` (jsonb) and `final_thoughts` (text) onto the matching
rows.

### B2. Supabase env vars unset, and the edge functions have no fallback — **OWNER: RYAN (Netlify dashboard)**

`franchise-region.js`, `blog-post.js` and `memory-catcher.js` all `return null`
without `SUPABASE_URL` and `SUPABASE_ANON_KEY`. They do **not** read the local
`regions.json` — only `generate-sitemaps.js` does.

Result if unset: the sitemap confidently lists 127 pages that 404. That is the
worst available day-one signal to Google. 112 franchise regions, 15 blog posts.

**Verify by loading `/franchises/wigan` and any blog post after deploy.**

### B2b. Franchise-bios migration — **NEW 11/08 — OWNER: RYAN or DIXIT (Supabase SQL editor)**

Dixit's dynamic bio system (11/08) reads ~19 columns from `franchisees` that
the table does not have - `commissions.sql` created it with only
slug/name/discount_code/email/active. Until `supabase/franchise-bios.sql` is
run:

- `/find-a-memory-catcher` shows "Could not load memory catchers" for everyone
  (both column selects 400)
- `/franchises-bio/ashley-eccleston` renders "Profile coming soon" instead of
  her full bio - and her static page is no longer routed, so this is the only
  version of her page that exists
- bios never join the sitemap (the `slug,updated_at` select 400s; degrades
  gracefully, regions and posts unaffected)

The migration is idempotent, adds the columns, seeds Ashley's full bio verbatim
from her old static page, and gives Salamata her real card details (previously
her card temporarily linked to Ashley's bio - that hack is now gone). Camille
is deliberately NOT seeded; adding her to the public finder is Ryan's call.

**Verify: `/franchises-bio/ashley-eccleston` shows her full story, and
`/find-a-memory-catcher` lists Ashley and Salamata with photos and areas.**
`franchise-bio-ashley-eccleston.html` stays in the repo until that verification
passes, then it can be deleted (check-sitemap already flags it as superseded).

### B3. Stale `sitemap.xml` shadowed the edge function — **FIXED 10/08**

`generate-sitemaps.js` stopped writing a static `sitemap.xml` on 04/08, because
an edge function already claims that path and a real file risks winning. But the
file left over from before was never deleted, so it kept shipping in every zip —
**39 URLs against the edge function's 151.**

Deleted, and the generator now refuses to run if one reappears.

### B4. Contact form was a design stub — **FIXED 10/08**

`contact.html` shipped a handler whose whole body was two `alert()` calls, one
reading *"Design preview: your enquiry would be sent here"*. It did call
`preventDefault()`, so unlike the other forms it never leaked — it just silently
discarded every enquiry through the contact page.

Now posts to `submit-lead` with inline status messages. `scripts/check-forms.js`
fails the build if placeholder wording reappears.

### B5. Forms — **ALL FIXED 10/08**

All five forms now POST, intercept the submit, and reach a real endpoint:

    contact.html                -> submit-lead
    franchise.html              -> submit-lead
    memory-catcher-enquiry.html -> submit-lead
    slot-reservation-form.html  -> submit-lead
    upload-portal-form.html     -> upload-portal-submit (Zendesk flow)

**Two of them were leaking personal data**, not merely failing:
`slot-reservation-form` and `memory-catcher-enquiry` had no `action` and no
`method`, so submitting did a native GET to the page's own URL — putting names,
emails and phone numbers into the address bar, browser history, Netlify access
logs and **GA4**, whose `page_location` captures the full query string.

Every form now carries `method="post"` as a fallback for the case where the JS
handler fails to attach. On `upload-portal-form` that fallback has **no action**
deliberately: the real submit is phase one of the two-phase Zendesk upload, and
pointing a native POST at it would send form-encoded data to a JSON endpoint
mid-flow, failing in a way that looks like the customer's files were lost.

**The upload portal is already wired to Zendesk** — `upload-portal-submit`
writes the row and issues signed upload tokens, files go straight to Supabase
Storage, then `upload-portal-complete` raises the ticket with signed download
links. It needs `ZENDESK_SUBDOMAIN`, `ZENDESK_EMAIL`, `ZENDESK_API_TOKEN` and
the Supabase vars set (see B2).

`scripts/check-forms.js` is in the deploy chain and enforces all of it.

### B6. Meta Pixel fires without consent — **OWNER: CLAUDE (code), RYAN (risk call)**

**Related, and now a knowing decision:** the Trustpilot TrustBox was
consent-gated on 06/08 and **un-gated on 07/08 at Ryan's instruction**, so the
verified badge shows to every visitor rather than only to those who accept the
banner. Same class of exposure as the pixel below. The consent plumbing still
exists (`window.bfcConsent`, the `bfc:consent` event), so re-gating is a small
change if the position shifts.


Unconditional `fbq('init')` on `our-kit.html`, `keepsake-standalone.html` and
`franchise.html`. `shared/analytics.js` documents this itself: *"NOT under it
today."* Academic on a Netlify subdomain; a UK GDPR/PECR exposure on the real
domain with real traffic.

The consent plumbing already exists — `window.bfcConsent` and the `bfc:consent`
event — and the TrustBox already uses it. Same pattern applies.

### B7. Wix CDN still load-bearing — **OWNER: CLAUDE (code), RYAN (asset export)**

- **Both** order-email templates use a Wix-hosted logo. When that account closes,
  every order confirmation email ships a broken logo.
- `addons/index.html` has 9 Wix-hosted images plus a preconnect.

Also: while the Wix account is alive, **export the ~2,000 old website reviews.**
Once it closes they are gone permanently.

---

## Checkout: the specific failure mode

Ryan's instinct is right that this is the big one. The precise risk is not that
checkout breaks loudly — it is that **it breaks silently in the worst direction**.

The Stripe webhook does three jobs: creates the ShipStation order, sends the
confirmation email, and carries the order reference that feeds Trustpilot AFS.

If `STRIPE_WEBHOOK_SECRET` is wrong or missing:

- the payment **still succeeds**
- no confirmation email
- no ShipStation order
- no Trustpilot invitation

The customer is charged and hears nothing, and the studio never sees the order.
`shared/checkout.js` logs clearly if the *publishable* key is missing, so a dead
Buy button is obvious. The webhook failing is not.

**Test: one small real payment on the Netlify URL, then confirm all four
downstream effects fired. Refund after.**

**A £1 test SKU exists for exactly this.** It runs the whole real path - live
keys, real card, webhook, ShipStation, confirmation email, Trustpilot invitation
- for a pound, so checkout can be proven repeatedly without £50 a go.

    1. Netlify env: set TEST_SKU_ENABLED = true, redeploy
    2. Visit the product page with ?testsku=1 and buy as normal - £1
    3. Confirm all four downstream effects
    4. **Netlify env: remove TEST_SKU_ENABLED.** No deploy needed to disable

Not a discount code, deliberately: a percentage code attaches to the REAL
products, so a leak sells real kits for a pound. This is a separate product
nobody is browsing. It is off unless the env var is set, hard-expires
**30/09/2026** whatever the env says, forces quantity to 1, names itself
"TEST ORDER - do not fulfil" in ShipStation, and logs on every use.

**Turn it off before go-live.** It is a testing tool, not a feature.

Order numbers are `KS-` + last 8 of the PaymentIntent. No collision with Wix's
`10xxx` sequence, but no continuity either — Trustpilot references change format
overnight. **Open decision for Ryan.**

---

## Environment variables — OWNER: RYAN (Netlify dashboard)

24 in total. Netlify env changes **do not apply to an existing build** — set them
all, then trigger a fresh deploy.

**Checkout and orders (highest risk)**
```
STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_WEBHOOK_SECRET_ADDON
STRIPE_WEBHOOK_SECRET_AFFILIATE
SHIPSTATION_API_KEY
SHIPSTATION_API_SECRET
```

**Email**
```
MANDRILL_API_KEY
EMAIL_FROM
EMAIL_BCC
LEAD_NOTIFY_TO
```

**Dynamic pages (B2)**
```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

**Marketing**
```
META_PIXEL_ID
META_CAPI_ACCESS_TOKEN
META_TEST_EVENT_CODE
```

**Support**
```
ZENDESK_SUBDOMAIN
ZENDESK_EMAIL
ZENDESK_API_TOKEN
ZENDESK_WHATSAPP_FIELD_ID
ZENDESK_WHATSAPP_MODE
```

**Upload portal**
```
UPLOAD_PURGE_ENABLED
UPLOAD_RETENTION_DAYS
```

---

## Cutover sequence

1. **Run the migration link audit** (B1) while the old site is live. Fill the
   redirect gaps. — *Ryan*
2. **Fix B3–B7 in code.** — *Claude*
3. **Set all env vars, then redeploy.** — *Ryan*
4. **Test checkout end to end** with a live card on the Netlify URL. Confirm
   email, ShipStation order, order number match, Trustpilot invitation. Refund.
   — *Ryan*
5. **Check where email DNS lives.** If MX, SPF and DKIM records sit in Wix's DNS,
   moving nameservers can break `hello@thebespokefoilcompany.co.uk`. **Verify
   before, not after.** This is the one that catches people. — *Ryan / Dixit*
6. **Set the primary domain in Netlify** — www or apex, the other 301s. Dashboard
   setting, not in this repo. — *Dixit*
7. **Move DNS.** Low-traffic window. **Keep the Wix account alive at least a
   month.** — *Dixit*
8. **Submit the sitemap in Search Console** — *after* cutover, not before, since
   it lists the new URLs. — *Ryan / Mark*

   **Do NOT use the Change of Address tool.** It is for moving to a *different
   domain*. BFC keeps `thebespokefoilcompany.co.uk` and only changes host and
   some paths, so redirects do the whole job. Using it here would tell Google the
   site had moved somewhere it has not. (Corrected 10/08 — this runbook said the
   opposite.)

---

## First 48 hours

| Watch | Where | Means |
|---|---|---|
| Spike in 404s | Search Console coverage | Redirect map has holes (B1) |
| Payments with no ShipStation order | Stripe + ShipStation | Webhook secret wrong |
| `/franchises/wigan` and a blog post load | Browser | Supabase wired (B2) |
| `/sitemap.xml` shows 150 URLs | Browser | Edge function winning (B3) |
| Order confirmation emails arrive | Inbox | Mandrill + webhook |

---

## Flagged 08/08 — two trademark issues

**1. Using Etsy's marks.** Etsy's Trademark Policy forbids the standalone Etsy
logo on your website without written permission, and forbids altering it — so a
recoloured white wordmark breaches both. The word "Etsy" in plain text is fine,
which is what the site uses. The build fails if an Etsy logo asset is ever
referenced.

If the logo is genuinely wanted, the route is written permission from Etsy, or
whatever official seller badge they currently offer. Not a design decision.

## Flagged 08/08 — trademark symbol mismatch, needs a decision

The Etsy shop's About text says **"Foil Fusion Technology®"**, twice. The
website says **"Foil Fusion Technology™"**, 122 times, and never ®. Same for
Memory Catcher™ — 171 uses, never ®.

These are not interchangeable. ® asserts a *registered* mark, and under
s.95 of the Trade Marks Act 1994 falsely representing a mark as registered is a
criminal offence in the UK. So one of these is wrong:

- **If the mark IS registered** — the website is understating it 122 times and
  should move to ®.
- **If it is NOT registered** — the Etsy listing is making a claim it should not,
  and that copy needs changing.

Not something to guess at. Worth confirming against the IPO register before
go-live, since the site is about to get a lot more visible.

## Affiliate codes — new 08/08, needs testing before go-live

Memory Catcher codes now work at checkout: a valid code credits the franchisee
and flags a free extra copy. **It never changes the price**, so a leaked code
cannot under-charge — the worst case is crediting the wrong Memory Catcher.

Requires `SUPABASE_URL` / `SUPABASE_ANON_KEY` (see B2) — without them the
validator returns "not recognised" for every code and the offer silently stops
working.

Test with the £1 test SKU: `?testsku=1`, enter a real franchisee code, confirm
`affiliate_slug` and `free_extra_copy` land in Stripe metadata and the ShipStation
note reads "FREE EXTRA COPY".

### Affiliate code mismatch - VERIFY BEFORE GO-LIVE (found 11/08)

`validate-affiliate-code.js` looks up `franchisees.discount_code`. Two sources
in this repo disagree about what Ashley's code actually is:

- `supabase/commissions.sql` seeds `discount_code` as **`ASHLEY10`**
  (and Salamata as `SALAMATA10`)
- `our-kit.html` and `keepsake-standalone.html` carry a hardcoded map that
  **displays `ASHLEY-WIG`** on `/memory-catcher/ashley-eccleston` and prefills
  it into the checkout drawer

If the live table holds `ASHLEY10`, every customer arriving on Ashley's
affiliate link is handed a code that comes back "not recognised", and she is
credited nothing. **This may already be fine** - the seed is
`on conflict do nothing`, so the live row may have been edited by hand since.
It has to be checked, not assumed:

    select slug, discount_code from franchisees where active;

Then make the two HTML maps agree with the table. The underlying cause is that
the codes are hardcoded client-side at all; they should come from the same
Supabase table Dixit wired for the bios. **Post-launch consolidation, not a
launch blocker** - but the values must agree before the affiliate path can be
trusted, and the £1 SKU test in this runbook is the place to prove it.

**Not a discrepancy — resolved 08/08.** The two offers differ ON PURPOSE:

- **Website + code:** free extra copy on ALL kits
- **In person:** framed only, so Memory Catchers are pushed toward the
  higher-value sale where their margin is bigger. In-person is their bread and
  butter.

Recorded here because it LOOKS like an inconsistency and someone will otherwise
"fix" it. The code carries no SKU condition, deliberately.

**Worth Ryan's attention though:** the website offer is now MORE generous than
the in-person one. A parent handed a code at a class gets a free extra copy on a
£34.95 print-only order online, but would have to buy framed at £44.95 to get it
in person. The franchisee earns 20% commission on the online sale versus full
margin in person — so the more generous online offer points customers at the
channel that pays the franchisee LESS.

Small, but it cuts against the "in person is better" pitch in the recruitment
booklet. Options: restrict the online free copy to framed too, or leave it and
accept it as a customer-acquisition trade.

## Search Console — set up BEFORE cutover

**GA4 does not configure this.** They are separate products; the GA4 tag on the
site does not create or verify a Search Console property. GA4 *can* be used as a
verification method, but only for a URL-prefix property, and only with Edit
permission on the GA4 property.

**Step 0: check one does not already exist.** The Wix site has ranked for years
and Mark is doing SEO work, so there may well be a verified property with
history on it already. Do not create a duplicate before checking who has access.

**Then, in order:**

1. **Add a Domain property** for `thebespokefoilcompany.co.uk` (no `https://`,
   no `www`). A Domain property covers www, apex, http and https in one, which is
   what makes the www decision safe.
2. **Verify by DNS TXT.** That is the *only* method Domain properties accept.
   Add the TXT record at whoever holds DNS today.
3. **Do it now, not at cutover.** New properties take a few days before data
   appears, so verifying on the day means flying blind exactly when the 404 spike
   would be visible. Verifying early also banks a baseline of the Wix site to
   compare against.
4. **Link GA4 to Search Console** (GA4 → Admin → Product links). Separate step;
   it surfaces Search Console reports inside GA4.
5. **After cutover**, submit `https://www.thebespokefoilcompany.co.uk/sitemap.xml`.
6. **Bing Webmaster Tools** can import the verified property straight from
   Search Console rather than repeating the whole process.

**The trap, given DNS is about to move.** DNS-based verification breaks if the
record disappears. If nameservers move to a new provider, **the Search Console
TXT record has to be recreated there along with MX, SPF and DKIM** — or
verification lapses in the middle of the migration, which is the one week it
actually matters. Put it on the same checklist as the mail records.

## Utility pages in the sitemap — decide before go-live

`/franchisee-login` is now listed as **Utilities | Memory Catcher hub login**
(added 10/08 at Ryan's request, explicitly provisional).

**The mechanism is currently all-or-nothing.** A route either carries a category
comment in `_redirects` and appears in `sitemap.xml`, `sitemap.html` AND
`llms.txt`, or it is marked `# exclude` and appears in none of them. There is no
way to say "list it on the human sitemap page but keep it out of the XML".

That matters, because those three files have different audiences:

- `sitemap.html` — humans looking for a page. A login belongs here.
- `sitemap.xml` — pages you are asking Google to index. A login has no search
  value beyond its own brand name.
- `llms.txt` — what an answer engine reads to describe the business. A sign-in
  page is noise.

**Still excluded, and candidates for the same decision:**

    /snag-tool                        internal QA tool
    /component-library                internal reference
    /add-ons-locked                   deliberately unlisted commercial page
    /add-ons-exclusive-discount-...   same
    /memory-catcher-region-map-embed  iframe target, not a page
    /sitemap                          the sitemap page itself
    /franchises/*, /post/*            templates; real URLs are generated
    /memory-catcher/*                 affiliate pages, canonicalised to the product page

The internal tools should stay out. The add-ons pages are a commercial call.

If granular control is wanted, the cleanest change is a fourth comment field —
e.g. `# Utilities | Label | note | html-only` — so a route can appear on the
human sitemap without entering `sitemap.xml` or `llms.txt`. Not built; say the
word.

## From Dixit, 10/08 — status

**1. "Four forms have no backend."** Three of the four — slot reservation,
Memory Catcher enquiry, contact — were fixed earlier on 10/08 and post to
`submit-lead`. **Dixit was reviewing a build from before that zip.** Send him the
current one before he starts, or he will re-fix work already done.

**2. "Join community" — he was right, and it was worse than one form.** The block
sits on **25 pages**. Only two had any handler: `franchise.html` had a full one,
`home.html` an `alert()` stub. On the other **23 the Join button did literally
nothing** — no request, no message, no error.

Now one shared `shared/community-signup.js` on all 25, built from the
`franchise.html` implementation (Meta CAPI event ID, fbp/fbc cookies,
`subscribeOnly`). The build fails if a page carries the block without the script.

**3. "`submit-lead.js` exists but is not routed."** It is routed.
`netlify.toml` declares `[functions] directory = "functions"`, so it serves at
`/.netlify/functions/submit-lead`. Nothing to do.

**4. Separate Supabase table per form — recommend against.** See below.

**4b. Slot deposit — Dixit is right, and this is still Ryan's decision.**
The form captures the lead but takes no payment. Nothing is broken and nothing
is over-promised: the page now reads "Secure your place with a £10 deposit,
**taken when we confirm your slot**", the button says "Reserve my slot", and the
success message says the deposit follows. But it has been an open decision since
this morning and Dixit is about to build something, so it needs an answer or he
will invent a third payment path.

  **A. Stripe Payment Link — zero code, available today.** Create a £10 link in
  the Stripe dashboard. The confirmation email and success message carry it.
  Reconciliation is the customer's email on the Stripe payment. No new payment
  code, no webhook changes, no launch-day risk. The link between form and payment
  is manual — which it already is, since Ryan confirms slots by hand.

  **B. `BFC-SLOT-DEPOSIT` SKU through the existing checkout — post-launch.** Add
  a £10 SKU to `create-payment-intent` and drive the drawer already built for the
  kit. Reuses tested plumbing rather than adding a second payment path, and the
  webhook, emails and ShipStation logic all come free. Roughly half a day, and it
  touches the payment path — which is why it should not happen on go-live day.

  **C. A separate Stripe flow — no.** More work than B with no benefit, and a
  third payment path to maintain.

  **Recommend A now, B once checkout has been proven live.** A unblocks Dixit
  today at zero risk; B then becomes considered work rather than a scramble.
  If B is chosen, the page copy reverts: "Secure your place with a £10 deposit"
  and the button returns to "Pay £10 booking deposit".

**5. `/gallery-upload` is a UI shell.** Confirmed: no `<form>`, one file input,
no `fetch`. Real work, not a launch blocker.

**6. `GALLERY-AUTOMATION-SPEC.md` is a spec, not code.** Confirmed — 215 lines
describing a pipeline nothing implements. A feature project.

### Lead storage — one table, not four

Dixit is right that email-only is fragile: a lead that lives in an inbox can be
filtered, deleted or missed. Writing to Supabase as well is the right call.

**But four tables is the wrong shape.** One `leads` table with a `source` column
and a `jsonb` payload gives:

- "all leads this month" as one query rather than a four-way UNION
- a fifth form as a new row value, not a migration
- one place to add consent, IP and UTM columns instead of four

Four near-identical tables is four sets of RLS policies to keep in step, and the
first time they drift nobody notices until a report is wrong.

### Also found, needs Ryan's call

**`/franchisee-login` is a placeholder.** Its own copy says *"Authentication will
be wired up to the Hub — no credentials are checked or stored yet"*, and the
button reads **"Login coming soon"**.

It was added to the sitemap on 10/08 as "Memory Catcher hub login" — so it is now
publicly discoverable. A prospective franchisee searching for the hub login would
land on a page that cannot log them in.

**Recommend pulling it from the sitemap until auth exists** (one comment change
in `_redirects`). Left in for now because Ryan asked for it explicitly.

## Trustpilot invitations - NOTHING SENDS THEM (found 11/08)

Checked while writing up the £1 test, because the test says "confirm the
Trustpilot invitation fired". **There is no Trustpilot code anywhere in the new
stack.** `shared/trustpilot.js` is display figures only. No function calls
Trustpilot, and no AFS address appears in the repo.

The only route AFS could take is a BCC on the order confirmation:

    const bccEmail = (process.env.EMAIL_BCC || 'hello@thebespokefoilcompany.co.uk')

**RYAN'S DECISION, 11/08: do NOT wire AFS to that BCC.** That email goes out
when the customer buys the KIT, which is the wrong moment entirely. Kits are
bought as gifts, and often not used until the baby arrives months later, so an
invitation sent then asks the customer to review something they have not
received and may not have opened. That is the most likely explanation for the
2.3% conversion noted below.

**The correct trigger is the despatch of the finished foil print and any
add-ons, plus 7 days**, from ShipStation - so the customer reviews the product
they actually received, at the point they have it in their hands.

### What this means at go-live

- **`EMAIL_BCC` must NOT be the Trustpilot AFS address.** Set it to
  `hello@thebespokefoilcompany.co.uk` or a studio address. On the £1 test,
  confirm an invitation does **not** arrive.
- **Review invitations are therefore OFF from cutover** until the ShipStation
  trigger is built. That is a deliberate pause, not a gap left by accident, and
  it should be short - see the brief below.
- Whatever is firing the current 176 invitations per 28 days is on the Wix
  side and will stop when Wix does. Worth knowing exactly what it is before the
  account closes, so it can be switched off cleanly rather than left running.

That matters more than it looks. Invitations are currently running at 176 in 28
days, from Wix. Nobody would notice them stopping for weeks, and by then the
orders that should have been invited are long gone - they cannot be invited
retrospectively.

**Before go-live, decide and verify:**
- What is `EMAIL_BCC` actually set to in Netlify?
- If the intent is AFS, it must be the AFS address from the Trustpilot
  dashboard, and `hello@` then loses its copy of every order email - so consider
  whether the studio still needs that copy by another route.
- Confirm on the £1 test that an invitation actually arrives, not just that the
  email did.

### The build: ShipStation-triggered, 7 days after the final despatch

This is already specified. `BFC-WHATSAPP-SHIPPING-TRUSTPILOT-BRIEF.md`
(28/07/2026, in Ryan's Drive) covers the whole thing: SHIP_NOTIFY webhook ->
Netlify Function -> Supabase queue -> scheduled function -> Trustpilot
Invitations API. Decision 1 in that brief recommended finished-keepsake-despatch
only; **Ryan has now settled it that way, with a flat 7-day delay** rather than
the per-service 5/6/8 days originally suggested.

**Three things to settle that the brief left open or did not cover:**

1. **How ShipStation separates the two despatches.** BFC ships twice: the kit
   out, and the finished print back. The trigger must fire on the second only.
   Either scope the webhook to a separate ShipStation **store** for the studio
   despatch (cleanest - the handler filters on `store_id` and never sees kit
   shipments), or branch on **SKU** using `includeShipmentItems=true`. Which is
   right depends on how the studio creates the return despatch today. Ryan or
   Dixit to confirm.

2. **Add-ons are a separate order, and can ship later.** NEW - the brief did not
   cover this. Ryan's requirement is the final print *and any add-ons*. The
   add-ons app takes its own payment (`STRIPE_WEBHOOK_SECRET_ADDON`) and creates
   its own ShipStation order, linked to the original only by the `?order=`
   reference it is opened with (`addons/index.html`, ORDER_REF). If an add-on
   parcel goes out after the print, a 7-day timer started on the print despatch
   can fire before the add-ons land.

   **Fix: a rolling timer.** Any further despatch matched to the same parent
   order pushes `send_after` to that despatch + 7 days. One update statement,
   and it makes the rule "7 days after the LAST thing we sent you" - which is
   what Ryan actually described. Requires the add-on ShipStation order to carry
   the parent order reference; **Dixit to confirm it does**, since that app is a
   separate deployment and its webhook is not in this repo.

3. **One invitation per experience.** Trustpilot's guidelines allow one
   invitation per customer experience. So AFS-by-BCC and the ShipStation trigger
   must never both be live, on any order. The `review_invitations` table in the
   brief enforces this with a unique constraint on `order_number` - which is
   the right place for it, not in application logic.

**Still open from the brief, unchanged:** Ashley's in-person sessions do not
pass through ShipStation at all, so automating the postal side alone leaves
those customers uninvited. Trustpilot operate an "invite all customers or none"
principle, so that needs a parallel route (QR on the leave-behind card, or a
periodic bulk upload) rather than being left.

Also note the AFS reference format changes to `KS-xxxxxxxx` (see the order
number decision), so anything in Trustpilot expecting a numeric reference needs
checking at the same time.

## Inline wallet button on the home page - SCOPED, NOT BUILT (11/08)

Ryan wants a real Apple Pay / Google Pay button in the home page hero, tapping
straight through to the wallet sheet. Right call - the previous one was a
painted button that opened the drawer. This is what building it honestly takes.

**Why it is not a five-minute job.** The drawer creates Elements from a
`clientSecret`, which only exists after `create-payment-intent` has run. That is
fine for a drawer opened by a click. It cannot work on page load without
minting a PaymentIntent for every visitor.

The correct pattern is Stripe's **deferred intent mode**:

    elements = stripe.elements({ mode:'payment', amount, currency:'gbp' })
    ece.on('confirm', async () => {
      await elements.submit();
      const { clientSecret } = await createPaymentIntent(...);
      await stripe.confirmPayment({ elements, clientSecret, confirmParams });
    });
    // and elements.update({ amount }) whenever the kit selection changes

**Three things that make it payment-path work, not UI work:**

1. **It puts prices in the browser.** `create-payment-intent` is deliberately
   the single source of truth: catalogue, `KIT_POSTAGE` 495, free postage at
   2+ kits or £75+. A deferred element needs the total client-side BEFORE the
   server has priced anything, so those rules get a second copy in JS. They will
   fail loudly rather than mischarge - Stripe rejects a confirm where the intent
   amount and the elements amount disagree - but that means the wallet button
   breaks silently for customers the next time a price changes and nobody
   updates the JS.
2. **Free postage and the shipping landmine.** A fixed `shippingRates` entry
   shows £4.95 even when the customer picks 2 kits in the wallet sheet. Fixing
   that properly needs a `shippingaddresschange` handler - which
   `shared/checkout.js` documents, from experience, as the thing that silently
   blocks EVERY wallet button when it is wrong.
3. **It cannot be tested from here.** Apple Pay needs a real Apple device,
   Safari, a real card, and the **Payment Method Domain registered in Stripe for
   the host being tested**. That registration is still open on this list. Until
   it is done the element renders nothing at all - no button, no error - which
   is exactly what happened on the keepsake page in July.

**Recommendation: build it immediately AFTER the £1 SKU test proves the webhook,
not before.** That test is already on the cutover list and requires the domain
registration anyway, so sequencing it that way makes the wallet button testable
the moment it exists rather than shipping unverified onto the highest-value
surface. Roughly half a day, same reasoning as the slot-deposit SKU.

**Meanwhile the current behaviour is honest, not broken.** "Buy now" opens the
drawer, and the drawer shows the REAL Express Checkout Element - Apple Pay,
Google Pay, Link - as the first thing in it, revealed only on devices that
actually have a wallet. One extra tap, no painted marks. The note under the
button now says "Apple Pay, Google Pay & card" so the availability is signalled.

**Needed from Ryan before this can be built and proven:**
- Payment Method Domain registered in Stripe for `www.thebespokefoilcompany.co.uk`
  (and the Netlify host, if testing there first)
- An Apple device to test on, and a Google Pay device or Chrome profile

## Open decisions for Ryan

- ~~**Order number continuity**~~ — **decided 10/08: `KS-xxxxxxxx`, starting
  fresh.** No code change needed; that is already what ships. Two operational
  consequences worth knowing:
  - **Trustpilot AFS references change format.** The dashboard currently shows
    Wix-style numbers (10414, 10420). New invitations will carry `KS-xxxxxxxx`.
    If AFS is configured to expect a numeric reference, check it.
  - **Old orders stay findable only in Wix.** A customer quoting 10420 is a Wix
    order; anything `KS-` is the new system. Worth telling whoever answers the
    inbox.
- ~~**www or apex**~~ — **decided 10/08: `www` is primary**, apex 301s to it.

  Nothing to change in the repo: every canonical, `og:url`, schema `@id`,
  `robots.txt` and `llms.txt` entry already says www, and the sitemap edge
  function hardcodes it rather than echoing the request host, so it stays www
  even if something reaches the apex. The build now fails on any bare apex URL.

  **Three things this DOES change, none of them in the code:**

  1. **Stripe Payment Method Domain — register `www.thebespokefoilcompany.co.uk`.**
     Apple Pay and Google Pay only appear in the Express Checkout Element on a
     domain registered and verified in Stripe. Register the wrong host and the
     wallets simply do not render — no error, no console warning, just a
     checkout that looks like it never offered Apple Pay. **This exact thing
     already happened once on the keepsake page in July.** Highest-value ten
     minutes on this list.
  2. **Search Console — create a Domain property, not a URL-prefix one.** A
     Domain property covers www, apex, http and https together, so coverage data
     is complete regardless of which host a link uses.
  3. **Netlify — set www as the primary domain** so the apex 301s rather than
     serving duplicate content. Dashboard setting, not in this repo.
- **Meta Pixel** — gate behind consent, or accept the risk knowingly.
- **Third-party embeds before consent.** The TrustBox is now un-gated by
  choice (07/08). Worth a single decision covering the pixel and the
  TrustBox together, rather than treating them separately.
- **Trustpilot AFS timing.** Invitations are firing (176 in 28 days) but
  converting at ~2.3%. The likely cause is timing: a request sent from the order
  confirmation reaches the customer before they have even posted their prints
  back. The moment worth asking is when the finished keepsake lands.
- **Review platform.** Etsy's 2,224 reviews cannot be imported into Trustpilot —
  no major platform accepts imports. REVIEWS.io does, with reviewer verification.
  A real strategic decision, not a technical one.

---

## Already done and verified

Not blockers — recorded so nothing gets re-litigated.

- Build chain green: 150 sitemap URLs, 1,457 internal links resolve, 36 pages
  carry analytics
- Canonicals on 27 pages, generated from `_redirects`; build fails if one points
  at a 301
- Product schema on the product page, **no aggregateRating** (deliberate — Ryan's
  call 06/08); build fails if it reappears
- Organization schema on home with real company number, VAT and address, and
  `sameAs` to Trustpilot, Instagram, Facebook, YouTube
- `llms.txt` carries the rating line, read from `shared/trustpilot.js`
- UGC reel: 66-clip pool, 32 rendered per page, rotated in-browser, zero bytes
  fetched until scrolled to
- Official TrustBox in the footer, consent-gated, with a crawlable text fallback
- Payment chips white, Klarna `#FFA8CD`, Amex untouched
- All four build scripts idempotent and self-verifying
