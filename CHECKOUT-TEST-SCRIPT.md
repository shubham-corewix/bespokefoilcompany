# Checkout test script - shared module

For Dixit. Run before this goes live. The checkout was extracted into
`shared/checkout.js` on 03/08/2026 so the home page and the product page run the
**same** implementation.

I verified the module in a headless DOM: it injects, wires, and calls
`create-payment-intent` with the correct SKU, quantity, affiliate and
personalisation on both pages. **I could not test an actual payment.** No card
was taken, no wallet rendered, no webhook fired. Everything below needs a real
browser with Stripe test keys.

---

## Setup

1. `STRIPE_PUBLISHABLE_KEY` (test) set on the deploy. The key is served from
   `/.netlify/functions/config` - never hand-edited into the file.
2. Stripe test card `4242 4242 4242 4242`, any future expiry, any CVC.
3. Watch the browser console throughout. The module logs every step with a
   `[keepsake checkout]` prefix.

---

## 1. Product page - the regression test

**This mattered most: it worked before the change and must still work.**

`/product-page/foil-handprint-footprint-kit-baby-keepsake`

- [ ] Buy button opens the drawer
- [ ] Sticky bar button opens the drawer
- [ ] Summary shows the right kit name, price and postage line
- [ ] Change kit, reopen - summary and SKU follow
- [ ] Change quantity on the page, open drawer - drawer shows the same number
- [ ] Change quantity **inside** the drawer - the page stepper follows
- [ ] Wallets appear on a device that has them (Apple Pay on Safari/iOS)
- [ ] "Or Pay with Card" reveals address + card fields
- [ ] Test card completes and returns to **the product page**, not the home page
- [ ] Personalisation choices reach Stripe metadata
- [ ] Order appears in ShipStation with the delivery address

## 2. Affiliate page

`/memory-catcher/ashley-eccleston` (needs `SUPABASE_URL` and `SUPABASE_ANON_KEY`
set, or it 404s - see the open item in the thread log)

- [ ] Drawer opens
- [ ] `affiliate_slug` reaches Stripe metadata
- [ ] Commission webhook credits the right Memory Catcher at 20%

## 3. Home page - the new path

`/`

- [ ] Scroll to "Order Your Foil Hand & Footprint Kit"
- [ ] Both buttons open the drawer (they used to fire an `alert`)
- [ ] Summary matches the selected kit
- [ ] Quantity +/- inside the drawer works (this page has no page-level stepper)
- [ ] `personalisation` posts as `{mode:'later'}` - correct, colours are chosen
      at upload
- [ ] `affiliate` posts as `null`
- [ ] Test card completes and returns to **the home page**
- [ ] Meta `Purchase` event fires once, not twice

## 4. Cross-checks

- [ ] Same kit, same quantity, both pages - identical amount charged
- [ ] Drawer closes on the X, on backdrop click, and on Escape
- [ ] Open drawer, close, reopen - no stale Stripe elements, no double-mount
- [ ] Mobile: drawer is usable and the keyboard does not cover the pay button

---

## If wallets do not render

Read the comment block at the top of `shared/checkout.js` first. There is a
known trap: adding a `shippingaddresschange` handler that calls `resolve()` with
no arguments throws an `IntegrationError` that **silently blocks every wallet
button** - Apple Pay, Google Pay and Link all fail with no visible error. Do not
reintroduce it.

Otherwise check the Payment Method Domain is registered in Stripe for this
domain. Wallets will not render on an unregistered domain.

## Known duplication

About 32 drawer CSS rules are still inline on the product page and are now also
injected by the module. The rules are identical, so it is cosmetic. Left in
place to keep this diff readable; worth removing once the checkout is proven.
