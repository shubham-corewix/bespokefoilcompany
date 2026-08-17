# Memory Catcher™ Hub - v1 build brief

**For:** Dixit
**Date:** 11 August 2026
**Owner:** Ryan Eccleston
**Driver:** Camille Ashforth (East Lancashire) is onboarding. She needs a Hub to
log into.

**This does NOT block the website going live.** Ryan's call, 11/08. The site
ships with the login area non-functional, and the Hub follows behind it.

**Read Section 5 first.** Much of this already exists from the July 2026 build -
the dashboard, the data contract, the backfill, the Shopify webhook and the auth
frontend. The job is largely wiring and reconciling, not building from nothing.

---

## 1. What v1 is

Four things, all backed by data that already exists:

| Panel | Source | Notes |
|---|---|---|
| **Training videos** | `/assets/training/` on Netlify | Ryan uploading soon. Read Section 6 first. |
| **Commissions tracker** | `transactions` table | Reuse the existing `commissions.html`. Read Section 4. |
| **Referral tools** | `franchisees.discount_code` | Her code, her affiliate link, a copy button, a QR for print. |
| **Her leads** | `leads` table (new, 11/08) | Filtered to her territory. |

**Explicitly NOT in v1:**

- **Bio editing. Dropped by Ryan, 11/08.** Franchisee landing pages are written
  and optimised in-house, not edited by the franchisee. Content is gathered
  through an onboarding intake form instead - see Section 7.
- Stock and supplies ordering, the network directory, the roadmap. These appear
  on the public `/memory-catcher-hub` marketing page but have no backing data.
  They stay marketing copy for now.

---

## 2. Authentication - Supabase magic link

No passwords. `franchisee-login.html` currently has an email AND password
field; **remove the password field**.

Why magic link:
- nothing to store, hash, reset or leak
- Supabase Auth is already in the stack, no new dependency
- three franchisees today, so the "check your email" step costs nothing
- kills the whole password-reset flow before it has to be built

**Invite-only. No self-serve signup.** An account exists only because Ryan
added an email to that franchisee's row. Supabase Auth must be configured to
disallow public sign-ups, or anyone can create an account and reach the Hub
shell.

### Prerequisite: nobody has an email address yet

`supabase/commissions.sql` seeds franchisees with slug, name and discount code
only. `franchisees.email` is nullable and empty. Magic link matches on email,
so **no one can log in until this is populated**:

```sql
update public.franchisees set email = 'ashley@...'  where slug = 'ashley-eccleston';
update public.franchisees set email = 'salamata@...' where slug = 'salamata-bah';
insert into public.franchisees (slug, name, email, discount_code, active)
values ('camille-ashforth', 'Camille Ashforth', 'camille@...', 'CAMILLE10', true)
on conflict (slug) do nothing;
```

Ryan to supply the three addresses. Camille's discount code needs deciding at
the same time - see the open question in Section 8 about `ASHLEY10` vs
`ASHLEY-WIG`, which is unresolved and will bite here too.

### Row level security

RLS is enabled on `commissions`, `transactions`, `month_status` and
`franchisees`, but there is **no policy letting an authenticated franchisee
read their own rows**. Without one, either everyone sees everything or nobody
sees anything. Policies needed, keyed on the signed-in user's email:

```sql
create policy commissions_own_rows on public.commissions
  for select to authenticated
  using (
    affiliate_slug in (
      select slug from public.franchisees
      where lower(email) = lower(auth.jwt() ->> 'email') and active
    )
  );
```

Same shape for `transactions`, `month_status` and the `leads` rows in her
territory. **Test this with two accounts before it goes near Camille.** A
franchisee seeing another's earnings is the single worst failure this build
can have.

---

## 3. Routing

`/memory-catcher-hub` stays exactly as it is - the public marketing page that
sells the franchise. Do not gate it.

The logged-in area is a new route, e.g. `/hub`, gated. `_redirects` is still
the single source of truth for routing and sitemap metadata, so it gets a
`# exclude` comment - the Hub must never enter `sitemap.xml`.

---

## 4. Commissions - the money rules, already agreed

**These were locked in July 2026 and are not up for rediscussion. An earlier
draft of this brief got them wrong; this section is the correction.**

| Rule | Value |
|---|---|
| In-person session commission | **40%** |
| Online affiliate commission | **20%** |
| Calculated on | the **VAT-inclusive amount actually paid**, after any discount |
| Shipping | free, so there is no shipping component to apportion |
| **Refunds** | **NO clawback. Head office absorbs the refund. A refunded order's commission stands.** |
| Payment terms | within 14 days of the end of each calendar month |

### Refunds: do not build clawback logic

Refunds are rare, and head office takes the hit. A refunded order's commission
is **not** deducted from the franchisee. Refund data is recorded for head-office
monitoring only, so Ryan can see that "rare" stays true as the network grows.
It must never change a commission figure or delete a row.

**This corrects an error in the first draft of this brief**, which read the
absence of refund handling in `transactions` as a bug and proposed reading
`commissions` instead. That would have introduced exactly the clawback the
policy forbids, and quietly under-paid franchisees. The behaviour is correct as
built.

### Which table the Hub reads

**`transactions`.** It is the franchisee-facing ledger, it already has an agreed
data contract, and it is what the existing `commissions.html` dashboard reads.

`commissions` is the accounting and monitoring record - pence integers,
`refunded_pence`, `commission_reversed_pence`, dispute status. Useful to head
office. **Its reversal columns must never reach a franchisee-facing figure.**

The dashboard derives every total from individual transaction rows. There are no
stored totals, by design, so the figures always reconcile.

### The one genuine inconsistency

`affiliate-commission-webhook.js` hardcodes `rate: 0.2` on the `transactions`
write, while `commissions.commission_rate_bps` is configurable per row. That is
fine while every affiliate rate is 20%, but the moment one franchisee is on a
different rate the two records diverge silently. Worth pulling the rate from one
place. Not a v1 blocker.

---

## 5. This is not a from-scratch build

A large part of the Hub already exists from the July 2026 work, and should be
reused rather than rebuilt:

- **`commissions.html`** - the franchisee earnings dashboard, already built,
  already carrying Ashley's real backfilled history (483 transactions,
  all-time £8,073.44, June 2026 £1,705.38)
- **The `EARNINGS_DATA` contract**, which the schema, the API and the dashboard
  already agree on:

  ```
  { franchisee: {name, territory, code},
    months: [ { month:"YYYY-MM", label, paymentStatus, paymentPaidOn?,
                paymentDueBy?, transactions:[...] } ] }   // newest first
  ```
  with `transactions[]` items of `{date, stream, product, amountPaid, rate,
  commission}`.
- **`/api/earnings`** Netlify Function, whose grouping logic was verified to
  reproduce the known figures
- **The Shopify webhook** for in-person sales, attributed by retail location -
  described in July as fully verified against the live store
- **`06-supabase-auth-frontend.html`** - the login page and page-guard snippet

### What has changed since then, and needs reconciling

**The affiliate stream moved off Wix.** July's `04-webhook-wix.js` attributed
affiliate sales from Wix orders. That is superseded: this site now takes payment
through Stripe, and `functions/affiliate-commission-webhook.js` in this repo
writes the affiliate rows into `transactions` directly. The Wix webhook should
be retired, not ported.

**Two versions of the `franchisees` table exist.** July's had `id` as primary
key plus `auth_user_id`, `territory`, `code` and `page_url`. This repo's
`commissions.sql` has `slug` as primary key with `id` merely unique, and **no
`auth_user_id` at all**. Both use `create table if not exists`, so whichever ran
first is what is actually live and neither file necessarily describes it.

**Dixit: run `\d public.franchisees` and tell us what is actually there before
writing any auth code.** `auth_user_id` is how a logged-in user is linked to
their franchisee row, so if it is missing it has to be added:

```sql
alter table public.franchisees
  add column if not exists auth_user_id uuid unique references auth.users(id) on delete set null;
```

### So the remaining question on "all sales" is narrow

Ryan is right that both streams are configured - the Shopify in-person webhook
was built and verified in July. What needs confirming is only whether it is
**deployed and writing into the same Supabase project this website uses**, since
the estate has moved since then. If it is, in-person and affiliate both land in
`transactions` and the tracker is genuinely complete.

---

## 6. Training videos

Ryan's decision: **Netlify assets folder**, `/assets/training/`. Two things he
should know, neither of which blocks the build.

**They will be publicly reachable.** Netlify serves `/assets/**` to anyone with
the URL. Gating the Hub page gates the *page*, not the file. Anyone given a
direct link can watch the franchise training without paying £3,445, and can
share it. If that is acceptable for v1, fine - but it is a decision, not an
oversight. Supabase Storage with signed URLs is the fix and is maybe half a
day's extra work, so the migration path is short if the position changes.

**Keep them out of the zips.** The exchange zip is already ~69MB. A training
library will add hundreds of megabytes and make every round trip between Ryan
and Dixit unworkable. Deploy `/assets/training/` directly to Netlify once, and
add it to `.gitignore` / exclude it from the packaging so it is not carried
back and forth.

Build the panel to read a simple manifest so adding a video is a data change,
not a code change:

```json
[{ "id": "01-getting-started", "title": "Getting started",
   "duration": "8:24", "src": "/assets/training/01-getting-started.mp4",
   "poster": "/assets/training/01-getting-started.webp" }]
```

**Reuse the fixed video pattern from `our-story.html` (11/08).** The click
handler there mounts a `<video>` inside the element it is bound to, so every
click on the native controls bubbled up and remounted a fresh autoplaying
video - pause looked like a restart. The fix is `arm()` / `disarm()`: the
listener comes off the moment the video exists. Do not reimplement this from
scratch.

---

## 7. Onboarding intake form

Replaces bio editing. Gathers what is needed to write a franchisee's landing
page in-house.

Build it as another entry in the FORMS registry in `functions/submit-lead.js`
(added 11/08) - `formType: 'onboarding'`. That gets storage, notification and
per-form validation for free, and the guard in `check-forms.js` will enforce
that it declares itself.

Fields should map onto the bio columns added in `supabase/franchise-bios.sql`
so the content lands where the public bio system already reads it:
`full_name`, `full_address`, `covering[]`, `sort_description`, `tagline`,
`bio_lead`, `bio_about`, `bio_offer`, `whatsapp`, `facebook_url`,
`instagram_url`, plus a photo upload.

Not public. Gate it behind the Hub, or issue a one-time link per franchisee.

---

## 8. Open items before build starts

- [ ] **Ryan:** email addresses for Ashley, Salamata and Camille
- [ ] **Ryan:** Camille's discount code
- [ ] **Dixit:** is the July Shopify in-person webhook deployed and writing to
      the SAME Supabase project this site uses? (Section 5)
- [ ] **Dixit:** `\d public.franchisees` - which version of the table is live,
      and does it have `auth_user_id`?
- [ ] **Dixit:** the `ASHLEY10` vs `ASHLEY-WIG` mismatch is still unresolved.
      `commissions.sql` seeds `ASHLEY10`; `our-kit.html` and
      `keepsake-standalone.html` show customers `ASHLEY-WIG`. Run
      `select slug, discount_code from franchisees where active;` and make the
      code match the table. This affects the Hub, because the referral panel
      shows her the code she is telling customers to use.
- [ ] **Dixit:** retire the superseded Wix affiliate webhook

---

## 9. Build sequence

1. **Auth shell.** Magic link, invite-only, RLS policies, two test accounts,
   prove account A cannot see account B's rows. Nothing else until this is
   proven.
2. **Commissions panel.** Once Section 5 is answered.
3. **Referral tools.** Smallest panel, entirely existing data.
4. **Training videos.** Once Ryan has uploaded and the manifest exists.
5. **Leads panel.**
6. **Onboarding intake form.**

Ryan wants something demonstrable early, so steps 1 and 3 together make a
credible first demo: she logs in, sees her name, her code and her link.

---

## 10. Acceptance criteria

- [ ] A franchisee can log in with a magic link and no password exists anywhere
- [ ] Account A cannot read account B's commissions, leads or payouts -
      **verified with two real accounts, not assumed from the policy text**
- [ ] Signing out invalidates the session
- [ ] A refunded order leaves the franchisee's commission UNCHANGED (no clawback)
- [ ] The commission total on screen reconciles to the same figure Ryan pays
- [ ] `/memory-catcher-hub` is still public and still sells the franchise
- [ ] The Hub route is excluded from `sitemap.xml`
- [ ] Training videos pause and resume rather than restarting
- [ ] The full build chain passes
