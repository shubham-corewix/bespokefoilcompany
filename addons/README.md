# BFC Add-ons Landing Page

Static, fast upsell page for post-purchase add-ons. No Wix, no frameworks.
Stripe Payment Element on-page (no redirect), orders pushed straight into
ShipStation via webhook, Meta CAPI Purchase fired server-side.

## Architecture

```
Customer -> index.html (Netlify CDN, static)
         -> create-payment-intent (Netlify function, computes total server-side)
         -> Stripe Payment Element (on-page, no redirect)
Stripe   -> stripe-webhook (Netlify function)
         -> ShipStation /orders/createorder
         -> Meta CAPI Purchase event
```

## Setup

1. **Deploy to Netlify** - drag the folder in or connect a repo.
   Suggested subdomain: `addons.thebespokefoilcompany.co.uk`.

2. **Environment variables** (Site settings > Environment variables):
   - `STRIPE_SECRET_KEY` - sk_live_...
   - `STRIPE_WEBHOOK_SECRET` - see step 4
   - `SHIPSTATION_API_KEY` / `SHIPSTATION_API_SECRET` - ShipStation
     Settings > Account > API Settings (V1 keys)
   - `META_PIXEL_ID` / `META_CAPI_TOKEN` - optional, from Events Manager

3. **index.html** - replace `pk_live_REPLACE_ME` with the Stripe
   publishable key.

4. **Coupon codes (e.g. EXTRA20 for the WhatsApp recovery flow)** -
   managed entirely in the Stripe dashboard, no deploys needed:
   - Stripe > Products > Coupons > Create coupon (e.g. 20% off, forever)
   - On the coupon, add a Promotion Code with the exact text EXTRA20
   - Toggle it active/inactive or set an expiry there at any time
   Stacking order (deliberate): keyring 3+ deal, then the £40/20%
   basket discount, then the coupon on what's left. So EXTRA20 on a
   £54.90 basket = £54.90 - £10.98 - £8.78 = £35.14 (~36% off,
   ~49% on keyring-heavy baskets). If the coupon should instead
   REPLACE the basket 20%, that's a small change in both totals()
   (index.html) and create-payment-intent.js - say the word.
   Limitation worth knowing: because payments use PaymentIntents
   rather than Stripe Checkout, Stripe does NOT count redemptions,
   so "max 100 uses" style caps won't self-enforce. Expiry dates and
   the active toggle work fine.

5. **Express checkout (Apple Pay / Google Pay / Link / PayPal / Klarna
   / Amazon Pay)** - wallet buttons appear at the top of the checkout
   panel automatically, but three things gate what customers actually
   see:
   - **Apple Pay + Link require domain registration**: Stripe
     dashboard > Settings > Payment method domains > add
     addons.thebespokefoilcompany.co.uk (register in sandbox AND live
     mode). Without this, no Apple Pay button - the most common
     "where's Apple Pay?" cause.
   - **PayPal / Klarna / Amazon Pay** must be enabled under Settings >
     Payment methods. Google Pay and Link work out of the box on
     supported browsers.
   - **HTTPS is mandatory** (Netlify provides this; wallet buttons
     will never show on http:// or netlify deploy previews opened
     over odd schemes).
   Buttons only render on devices/browsers that support them - test
   Apple Pay on an iPhone with a card in Wallet, Google Pay in Chrome
   with a saved card. Shipping address is collected inside the wallet
   sheet (GB only), so wallet payers skip the address form entirely.
   Postage note: delivery shows as a zero-cost "rate" in the wallet
   sheet because postage is sold as a product line, not a shipping
   rate - the label switches to "Tracked 24" when the upgrade is in
   the basket.

6. **Stripe webhook** - Dashboard > Developers > Webhooks > Add endpoint:
   - URL: `https://addons.thebespokefoilcompany.co.uk/.netlify/functions/stripe-webhook`
   - Event: `payment_intent.succeeded`
   - Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

7. **Images** - product photos now load directly from Wix's CDN
   (static.wixstatic.com URLs taken from the catalogue export), so
   nothing to upload except `hero.jpg` (session photo) in the root.
   Verify one product image renders in a browser before launch; if Wix
   ever blocks hotlinking, re-host the nine images and swap the URLs in
   the PRODUCTS array. Optional speed win: append Wix transforms
   (`/v1/fill/w_720,h_648,q_85/img.jpg`) to serve resized versions.

8. **Link from the upload tool / order emails** with the order reference:
   `https://addons.thebespokefoilcompany.co.uk/?order=10456&email=jo@example.com`
   The order ref lands in ShipStation's internal notes and the order
   number (`ADDON-10456-XXXXXXXX`) so the studio can match it to the
   original keepsake.

## Before going live - confirm these

- [ ] All nine products and prices are now verified against the Wix
      catalogue export (catalog_products.csv) - no placeholders remain.
- [ ] **Discount stacking decision**: the keyring 3+ deal (20% off
      keyrings) is applied first, and the £40 threshold is then checked
      against the discounted subtotal. So 3 keyrings alone (£44.85 ->
      £35.88) do NOT also trigger the basket 20%. If Wix currently
      stacks both, change the order in totals() (index.html) and the
      matching block in create-payment-intent.js.
- [ ] The catalogue also contains "Upgrade to A3 Print + Frame"
      (£19.95) and a duplicate "Upgrade to tracked postage" (£2.95)
      that are NOT in the Upsell App, plus an obvious test product
      ("-- -- Foil Hand & Footprint Kit"). All three were excluded.
      A3 upgrade could be worth adding to Upgrades - say the word.
- [ ] Decide whether add-on revenue also gets written back into Wix for
      the single source of truth, or reconciled from Stripe monthly.
- [ ] Test in Stripe test mode first (pk_test / sk_test keys + test
      webhook secret).
- [ ] VAT: Stripe receipts are not VAT invoices. If customers need VAT
      invoices, enable Stripe Invoicing or handle in accounting.

## Security notes

- Prices are recalculated server-side from the SKU list; the browser
  only sends SKUs and quantities.
- Webhook signatures are verified before anything is created.
- `orderKey` = PaymentIntent ID, so Stripe webhook retries can never
  create duplicate ShipStation orders.


---

## Locked (browse-only) vs live mode - two URLs, one file

The page runs in two modes from the **same file**, so every future edit
stays in sync automatically:

- **Locked / browse mode** - the URL path ends in `-locked` (or carries
  `?locked=1`). Customers get this link *while their proof is being
  made*. They can browse everything and open the personalisation
  options to see what's possible, but every Add / Checkout / Cart tap
  opens the "Almost there!" lightbox explaining add-ons unlock once
  they approve their proof. A "Share this Link with Family" bar lets
  them pass the (locked) link to grandparents to browse too. Stripe is
  never loaded in this mode.
- **Live / unlocked mode** - the plain URL, no flag. Full checkout as
  normal. This is the link sent *with the approved proof*.

Routing is handled by `_redirects` (Netlify): both the `-locked` and
the plain paths serve `/index.html`, and the JavaScript decides the
mode from the URL. Nothing else to configure. The two links to use:

- Browse (pre-proof): `https://addons.thebespokefoilcompany.co.uk/add-ons-exclusive-discount-938476-locked`
- Live (with proof):  `https://addons.thebespokefoilcompany.co.uk/add-ons-exclusive-discount-938476`

(Adjust the exact paths in `_redirects` to match whatever slugs you
want to expose.)
