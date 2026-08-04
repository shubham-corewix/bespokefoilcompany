# Affiliate Commission Webhook - wire-up brief

**For:** Dixit | **Date:** 27/07/2026 | **Owner:** Ryan

Two new files:

- `functions/affiliate-commission-webhook.js`
- `supabase/commissions.sql`

No new npm dependencies. `stripe` stays the only one.

---

## Why it is a separate endpoint

It does **not** go inside `functions/stripe-webhook.js`. That function creates the
ShipStation order, and live money flows through it today. If a commission write
fails we need Stripe to retry, and retrying the combined function would risk a
duplicate order. Separate endpoint, separate signing secret, separate blast radius.

---

## Order of operations (do not skip step 1)

1. **Run `supabase/commissions.sql`** in the Supabase SQL editor. It creates
   `franchisees` (if missing) and `commissions`, plus the `commission_totals`
   view and RLS policies, and seeds the two known franchisee rows.
2. **Set the env vars** in Netlify:
   - `STRIPE_WEBHOOK_SECRET_AFFILIATE` - the new endpoint's own `whsec_...`,
     **not** the same value as the kit webhook
   - `SUPABASE_SERVICE_ROLE_KEY` - service role, not anon. This function writes
     money rows. This key must never appear in an edge function or any
     client-side file.
   - `SUPABASE_URL` and `STRIPE_SECRET_KEY` are already set.
3. **Register the endpoint** in Stripe at
   `/.netlify/functions/affiliate-commission-webhook`, subscribed to exactly
   four events:
   `payment_intent.succeeded`, `charge.refunded`,
   `charge.dispute.created`, `charge.dispute.closed`.
4. **Redeploy** (Netlify does not pick up env changes without one).

---

## The commission rule

**20% of the product subtotal. Postage is excluded** - we do not pay commission
on Royal Mail. Everything is integer pence; no float touches a money value.

| Order | Product base | Gross paid | Commission |
|---|---|---|---|
| 1x Foil Kit + postage | £34.95 | £39.90 | £6.99 |
| 2x Foil Kit (free postage) | £69.90 | £69.90 | £13.98 |
| 1x Framed + postage | £49.95 | £54.90 | £9.99 |
| 3x Premium | £179.85 | £179.85 | £35.97 |

`subtotal_pence` comes from `create-payment-intent.js`, which prices server-side
from the trusted catalogue, so it cannot be tampered with from the browser.

## Refunds

Refunds are allocated to **postage first**, then product value. A postage-only
refund therefore claws back nothing, which is right - no commission was paid on
it. Partial refunds reverse pro-rata against the product base. Verified:

| Refund on a £39.90 order | Commission reversed |
|---|---|
| £4.95 (postage only) | £0.00 |
| £10.00 (partial) | £1.01 |
| £39.90 (full) | £6.99 |

## Idempotency - the important bit

`payment_intent_id` is `UNIQUE` on `commissions`, and the insert uses
`on_conflict=payment_intent_id` with `resolution=ignore-duplicates`. Stripe
retries webhooks and can deliver the same event twice even after a 200, so this
constraint is the only thing standing between us and double-paying a
franchisee. Do not remove it.

The handler returns **500 on a failed write on purpose** so Stripe retries with
backoff for up to three days - a commission we failed to record is a franchisee
underpaid. The unique constraint makes those retries safe.

## Unknown slugs

A slug is only credited if it exists in `franchisees` **and** `active is true`.
An unmatched slug logs `COMMISSION UNMATCHED` and returns 200 (retrying will not
make the row appear). Worth a log alert - it means attribution is silently
leaking. Keep the `cleanAffiliate` regex identical across
`create-payment-intent.js`, the `memory-catcher` edge function and this file.

## Testing before go-live

```
stripe listen --forward-to localhost:8888/.netlify/functions/affiliate-commission-webhook
stripe trigger payment_intent.succeeded
```
Then a real test-mode order through `/memory-catcher/ashley-eccleston` and check
the row lands with the right `commission_pence`. Fire the same event twice and
confirm you still have exactly one row.

## Hub dashboard

Read `commission_totals`, not the raw table. It nets off reversals
(`commission_pence - commission_reversed_pence`) so refunded orders do not
inflate the figure. Read it server-side - there is deliberately no anon read
policy on `commissions`.

---

## Two things for Ryan, not Dixit

1. **Add-ons carries no affiliate attribution.** `affiliate_slug` only exists on
   the keepsake checkout. If a customer who came through a Memory Catcher link
   later buys an add-on at proof sign-off, the franchisee earns nothing on it.
   That may well be intentional - flagging it as a decision, not a bug.
2. **The order confirmation email is currently broken** on the kit checkout -
   see the separate note. Unrelated to commission, but same file family.
