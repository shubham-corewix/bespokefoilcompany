# Merge changelog - keepsake landing page
**Date:** 20 July 2026
**Base:** Dixit's `keepsake.thebespokefoilcompany.co.uk-main`
**Merged in:** personalisation block from the BFC site-migration build

Dixit's build was used as the base. Nothing in the checkout, webhook,
email or Meta stack was rewritten - all of it is his work, preserved.

**Dixit - start here.** The functional change you need to know about is
section 1 (personalisation now flows through to Stripe metadata, ShipStation
and the confirmation email). Section 4 is the deploy checklist. Everything
else is copy, styling and assets. Two things were removed from your
`index.html` that you will want to be aware of: 15 debug beacons pointing at
`127.0.0.1:7575`, and the `&reg;` on Foil Fusion (see section 2).

---

## 1. Personalisation added and wired end to end

Previously the landing page collected no personalisation; everything was
deferred to the upload portal. Ryan's decision (20/07) is to offer it at
checkout as an OPTIONAL step, defaulting to "add later".

### Front end (`index.html`)
- Ported the personalisation block: card colour, foil colour, frame colour,
  font, name, date of birth, time of birth.
- Defaults to "I'll add them later / I'm buying as a gift" so the cold-traffic
  path is unchanged. Fields only expand if the customer opts in.
- Frame colour auto-hides on the Foil Print Kit (no frame in that kit).
- New `personalisationPayload()` returns `{mode:'later'}` or the full object,
  and is sent in the `create-payment-intent` request body.

### Server (`functions/create-payment-intent.js`)
- Accepts an optional `personalisation` object.
- `cleanPersonalisation()` validates against an allow-list and truncates free
  text (name 120, dob/time 40 chars). Anything not on the allow-list is dropped.
- Flattened onto PaymentIntent metadata as `pers_*` keys.
- **Price is untouched by any of this** - the trusted catalogue remains the sole
  source of truth. Personalisation is display/fulfilment data only.

### Server (`functions/stripe-webhook.js`)
- `personalisationNote()` replaces the hardcoded ShipStation `customerNotes`.
  Still says "Personalisation pending via upload portal." when mode is 'later';
  otherwise lists the supplied values.
- Personalisation rows passed into the order-confirmation email payload.

### Server (`functions/render-order-email.js`)
- New "Your personalisation" block in the HTML email and the plaintext version.
  Renders only when values exist. All values HTML-escaped.

**Allow-list values** (must stay in sync with the `data-val` attributes):
- card: White, Black
- foil: Gold, Silver, Rose gold
- frame: White, Black, Walnut, Oak, Ash
- font: Modern, Cursive

---

## 2. Fixes applied

| Issue | Action |
|---|---|
| 15 debug beacons POSTing to `127.0.0.1:7575` | Removed, with their `#region agent log` wrappers |
| Foil Fusion marked `&reg;` (registration not confirmed) | Changed to `&trade;` throughout |
| Logo SVG had offset viewBox + leftover Illustrator artboard (841.89x595.28) | Replaced with clean tight-cropped export from the migration build |
| FAQ and kit note said "nothing to decide today" | Reworded - personalisation is now optional at checkout, so the copy no longer contradicts the UI |

---

## 3. Deliberately NOT changed

- Stripe checkout drawer, Express Checkout / Payment / Address Elements
- `create-payment-intent` pricing, postage rules, trusted catalogue
- Webhook signature verification, ShipStation payload, Mandrill send
- Meta Pixel events and CAPI dedup via `event_id` = PaymentIntent ID
- `noindex` + canonical to the Wix product page

---

## 4. Still outstanding before ads run

**Nothing in this list is a missing file.** No secrets have ever been in this
repo, in Dixit's original or in this merged build - they live in the Netlify
dashboard, attached to the site. Verified: the merged build references exactly
the same eleven environment variables as Dixit's original, unchanged.

### Environment variables (Netlify dashboard, not code)

`STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
`SHIPSTATION_API_KEY`, `SHIPSTATION_API_SECRET`, `MANDRILL_API_KEY`,
`EMAIL_FROM`, `EMAIL_BCC` (optional), `META_PIXEL_ID`,
`META_CAPI_ACCESS_TOKEN`, `META_TEST_EVENT_CODE` (optional).

If these are already set on the keepsake Netlify site they persist across
deploys - uploading new code does NOT clear them. "Redeploy after setting"
means the reverse: if you CHANGE a value, functions will not pick it up until
the site is redeployed.

Note `META_PIXEL_ID` is also hardcoded in the page as `1115044330715742`
(line 27). That is fine - Pixel IDs are public by design. Only the CAPI token
is secret.

**Two questions for Dixit that determine whether this is 5 minutes or an hour:**
1. Are the env vars already set on the keepsake Netlify site?
2. Has the Stripe webhook endpoint been created for this site?

`STRIPE_WEBHOOK_SECRET` is the one value that genuinely cannot be carried over
from anywhere - Stripe generates it when the webhook endpoint is created, and
it is unique to that endpoint.

### Remaining tasks

- Register the Payment Method Domain in Stripe, or Apple Pay and Google Pay
  will not render. Note the express wallets live INSIDE the checkout drawer,
  not on the product page - that is by design, not a fault.
- Confirm the webhook delivery log returns 200. A wrong `STRIPE_WEBHOOK_SECRET`
  means payments succeed but orders never reach ShipStation - this happened
  on add-ons.
- Deploy must be git or CLI, not drag-and-drop, or the functions will 404.
- End-to-end test in Stripe test mode with personalisation both ON and OFF,
  confirming values land in ShipStation `customerNotes` and the confirmation
  email.
- Clean version of the "That Never Fades" band image - the current one has
  text baked into the photo (Dixit's note, not yet actioned).

### Withdrawn from this list

Dixit's README said full-res photography was still needed because the images
were "cropped from a page screenshot". That was carried into an earlier draft
of this changelog without checking. It has since been verified as no longer
true and is withdrawn - see section 8.

---

## 5. Product gallery - frame options image (added 20/07)

- New `assets/gallery-14.webp` - the four-frame-colour product shot.
- Inserted at **slide position 6** in the gallery carousel.
  Note the running order is: 1 gallery-01, 2 the video, 3 gallery-02,
  4 gallery-03, 5 gallery-04, **6 gallery-14**, 7 gallery-05 onwards.
  Slide position and filename number deliberately do not match, because
  the video occupies slot 2. Filename is -14 simply as the next free number.
- Optimised to match the existing gallery spec exactly: 1200x1200, RGB,
  WebP quality 78 / method 6, 78 KB (existing files range 30-103 KB).
  Source supplied at 1400x1400 and already square, so no crop was needed.
- `loading="lazy"` applied, consistent with every slide except the first.
- Descriptive alt text added rather than the generic
  "Foil hand and footprint keepsake" used on the other slides.
- No JS change needed - the carousel derives `realCount` from the DOM,
  so the loop clone and prev/next wrap adjusted automatically.

---

## 6. Mobile spacing pass (20/07)

**Lightbox ("What's included") - now fits one screen on mobile**
- `.inc-photo img` aspect-ratio changed from `1/1.1` (portrait) to `16/10`
  (landscape) below 720px. This pulls the text block up so the full
  "Not included" line and the CTA are visible without scrolling.
- Desktop is unchanged - a `min-width:720px` rule restores `1/1.1`, since the
  two-column layout has the height to carry a taller crop.
- Extra rule for handsets under 700px tall (iPhone SE): 16/9 photo plus
  tighter body padding and list gap.
- Verified fitting with no scroll on iPhone 15 Pro, Pixel 7 and iPhone 14 Plus,
  across all three kit lightboxes. On the 667px-tall SE the card still scrolls
  by roughly 80-130px - the text block is 559px there, so the photo is no
  longer the constraint. Fixing that would mean cutting copy or shrinking type
  below a comfortable reading size, so it was left alone deliberately.

**Hero eyebrow**
- "OVER 10,000 KITS SOLD SINCE 2017": margin-bottom 22px -> 11px (50% cut,
  as requested) and letter-spacing eased from .22em to .18em.
- Net effect: the product gallery sits ~11px higher on mobile, comfortably
  within the first screen.

---

## 7. Primary CTA restyled (20/07)

`.card-btn` (the "Buy now" button) was transparent with a 1px black border.
That styling was correct when it sat *underneath* an Apple Pay button as the
secondary option, but the Apple Pay button is no longer on the product page -
express wallets render inside the checkout drawer instead. Left as-is, the only
CTA on the page was a near-white button on a porcelain (#F6F6F4) background.

Now solid black, white text, weight 600, with a soft shadow for lift.
Added `:hover` (#1a1a1a) and `:focus-visible` states, neither of which existed.

Contrast is 21:1 (WCAG AAA). Only one element uses `.card-btn`, so there is no
knock-on elsewhere - and the sticky mobile bar (`.sticky .go`) and drawer pay
button (`.cd-pay`) were already solid black, so this brings the main CTA into
line with them rather than introducing a new treatment.

---

## 8. Image quality verified (20/07)

Dixit's README listed "full-res photography from Ashley" as outstanding, on the
grounds that the images were cropped from a page screenshot. Ryan challenged
this, so it was measured rather than assumed.

**Method.** `gallery-14.webp` was used as a known-good control - it was built
in this session from Ryan's supplied 1400x1400 original, so its behaviour
through the WebP pipeline is known. Every other gallery and step image was
compared against it for high-frequency (fine detail) energy. Images upscaled
from a screenshot show a hard frequency cliff where the original resolution
ran out; genuine full-res images do not.

**Result.** Every image sits in a normal band against the control, 73% to 157%,
with several carrying MORE real detail than the control. No frequency cliffs.
Dimensions are consistent throughout: gallery 1200x1200, steps 880x1100,
file sizes 28-103 KB. The assets are sound.

**One apparent outlier.** `step-2.webp` reads at 31% of control. Inspected
directly: that is shallow depth of field in the original photograph, not a
resolution problem. Deliberately soft shot. Nothing to fix.

**Caveat.** This measures the files as they stand in this build. It confirms
they are genuine full-resolution assets; it cannot confirm they are the FINAL
shots Ashley wants used. That remains a judgement call for Ryan and Ashley.

The "full-res photography" item has been removed from section 4.

---

## 9. Lightbox close button - blue on Safari (20/07)

The "What's included" lightbox close glyph rendered blue on Apple devices.

**Cause.** The global reset at the top of the stylesheet was
`button{font-family:inherit;cursor:pointer}` - it set the font but never a
colour, so `<button>` fell back to the user-agent default. On Chrome that
resolves to black, which is why it looked correct in testing, but Safari and
iOS use the system blue instead. `.inc-close` had no `color` of its own to
override it.

**Fix.** Two changes:
- `.inc-close` now sets `color:var(--ink)` explicitly, plus
  `-webkit-text-fill-color` which Safari honours ahead of `color` on form
  controls.
- The global button reset now carries `color:var(--ink)` too, so no other
  button can inherit UA blue on Apple devices.

Checked for regressions: buttons that are deliberately white-on-black
(`#checkoutBtn`, `#stickyGo`, `#cdPay`) declare their own `color` and are
unaffected. Glyph now measures RGB (23,23,23) with no blue dominance across
all three kit lightboxes.

---

## 10. Footer expanded (20/07)

Ryan's call: the footer should carry proper company formalities and a contact
route, so the page reads as a real business to cold paid traffic.

**Added, in three columns (3 across desktop, 2 tablet, 1 mobile):**
- Contact - WhatsApp and email, plus Facebook/Instagram icons
- Find us - registered address and opening hours
- Secure payment - payment method chips and a Trustpilot lockup

**Phone replaced with WhatsApp.** The old `tel:` link is gone. Now
`https://wa.me/447506998934` (UK number in international format, no leading
zero, no plus), opening in a new tab. Ashley is more responsive on WhatsApp
than by phone. There is no longer any `tel:` link on the page.

**Payment marks and Trustpilot are real HTML**, not a screenshot - reusing the
existing SVGs in `assets/pay/` and `assets/tp-*.svg` that were already on the
page above the fold. Payment marks sit on white rounded chips so the brand
colours read correctly against the black footer; the Trustpilot wordmark is
inverted to white, and the green star block is left untouched, which is what
Trustpilot's brand guidelines require. The whole lockup links to the BFC
Trustpilot profile.

Company number and VAT ID moved into a separate `.f-legal` strip below a
divider, so the legal detail is present without competing with the contact
information.

**Social URLs confirmed by Ryan (20/07)** and now live in the markup:
- Facebook: `https://www.facebook.com/TheBespokeFoilCompany`
- Instagram: `https://www.instagram.com/thebespokefoilco/`

Note the Instagram handle is `thebespokefoilco`, NOT `thebespokefoilcompany` -
it differs from the Facebook handle and from the domain. Worth remembering for
any future build. The placeholder TODO comments have been removed; there are no
unverified links left in the footer.

---

## 11. Footer refinements (20/07)

Five changes from Ryan's review of the footer build.

**Privacy policy and T&Cs links removed.** Only the domain link remains in
`.f-links`. Note both are still reachable on the main site; they are simply not
surfaced on this standalone paid-traffic page.

**Company number and VAT ID now on one line**, pipe-separated:
`Company No. 12941845 | VAT ID: GB419408687`. The registered-in-England line
sits above it.

**Trustpilot star restored to green - this was my error.** The previous build
applied `filter:brightness(0) invert(1)` to the whole brandmark to turn the
wordmark white, which also flipped the green star (#00B67A) to pink. Trustpilot
brand guidelines require the star keep its green.

Fixed properly by creating `assets/tp-brandmark-white.svg`, a variant of the
supplied SVG with only the `.st0` wordmark fill changed from #191919 to #FFFFFF.
The `.st1` (#00B67A) and `.st2` (#005128) star fills are untouched. The CSS
filter has been removed entirely. The original `tp-brandmark.svg` is unchanged
and still used elsewhere on light backgrounds.

Verified by pixel sampling: brandmark now renders 690 white px (wordmark) plus
391 green px (star); the separate star strip is 8136 green px.

**Payment marks - now copied verbatim from the migration footer.**

First attempt was wrong. I sized the marks with `max-width`/`max-height` and
added a CSS border, which left a white margin around each logo inside the chip -
the "white box" effect Ryan flagged twice.

The cause: each SVG in `assets/pay/` is 64x42 and already contains its own white
card AND a 1px inset border (visible as `data-bbox="1 1 62 40"` in the source).
No CSS border is needed or wanted; the artwork just has to fill the chip edge to
edge. Constraining it with max-width exposed the chip's own background as a
margin.

Now matches `shared/styles.css .foot-pay .pay-chip` from the migration build
exactly: 39x26, `border-radius:5px`, `overflow:hidden`, no CSS border, and the
img at `width:100%;height:100%;object-fit:cover`. Gap 6px -> 8px to match.

Verified by rendering the migration footer and the merged footer side by side at
3x and sampling chip edges: both read 179 at the top edge and 158 at the left,
i.e. identical edge treatment.

**Facebook icon re-centred.** Measured via `getBBox()`: the Facebook path is
drawn centred on (13,13) within its 24x24 viewBox rather than (12,12), so it
sat 1px low and right inside the circle. Instagram measured a true (12,12) and
was left alone. Corrected with a -0.7px translate scoped to the Facebook anchor
only.

---

## 12. Quantity + free postage on 2+ kits (20/07)

Ryan's decision: add a quantity stepper and a single commercial message -
"Add a second kit and get FREE postage - Perfect for gifting". No shipping
upsell (the add-ons Tracked 24 upsell is deliberately NOT ported).

### THE IMPORTANT BIT - the postage rule changed

The old rule was a VALUE threshold: free postage over £75. Under that rule
2x Foil Print Kit = £69.90 and would still have been charged postage, making
the on-page promise FALSE for the cheapest kit.

The rule is now QUANTITY-based: **2 or more kits ship free**, whatever the kit.
The £75 value threshold is retained as a secondary trigger so a single
high-value order is never worse off.

Dixit - if you change `FREE_POSTAGE_QTY` in create-payment-intent.js you must
also change `FREE_POST_QTY` in index.html, or the page will promise something
the server does not honour.

### Server (`functions/create-payment-intent.js`)
- `priceOrder(sku)` -> `priceOrder(sku, qty)`.
- Quantity is coerced and clamped server-side: `Math.max(1, Math.min(10, ...))`.
  Verified against qty of 0, -5, "2", 999, null, undefined, "abc" and 1.9 -
  all clamp safely. The browser is never trusted.
- Metadata gains `quantity` and `unit_price_pence`. `subtotal_pence` is now the
  LINE total (unit x qty), not the unit price.
- PaymentIntent description now reads e.g. "2x Framed Foil Print Kit".

### Webhook (`functions/stripe-webhook.js`)
- ShipStation line item: `quantity` was hardcoded to 1, now reads metadata.
  `unitPrice` reads `unit_price_pence`, falling back to `subtotal_pence` so
  orders placed before this change still render correctly.
- Confirmation email: same fix, `qty` and `line_total` now reflect quantity.
- Meta CAPI Purchase gains `num_items`.

### Front end (`index.html`)
- Quantity stepper above the buy button, 1-10, with disabled states at both ends.
- Progress card modelled on the add-ons "unlock" nudge: tan fill advances to
  100% and the card switches to "FREE postage unlocked" at qty 2, at which
  point the Add button hides.
- Buy button and sticky bar BOTH show the real order total including postage,
  so they can never disagree.
- InitiateCheckout `num_items` now sends the real quantity.

### Verified
Client display and server charge cross-checked for all three kits at qty 1-4:
12 of 12 combinations match exactly. Two JS bugs were caught and fixed during
testing - a temporal dead zone error where the initial `renderQty()` ran before
`SHIP_CUTOFF_HOUR` was declared, and the sticky bar showing unit price rather
than order total.

### NOT done
A full add-ons-style cart (line items, multiple products, coupons) was scoped
and deliberately not built. The keepsake backend passes a single SKU through
Stripe metadata as flat fields; supporting a true multi-product cart needs a
line-items array and a rewrite of the metadata contract, the ShipStation
payload and the email renderer. That is a Dixit-led piece of work, not a
restyle. This change gets the AOV benefit of multi-buy without touching that
architecture.

---

## 13. Checkout drawer rebuilt on the add-ons pattern (20/07)

Ryan: the drawer opened as a wall of fields and PayPal dominated. Rebuilt to
match the add-ons panel (`addons.thebespokefoilcompany.co.uk`).

### Progressive disclosure
Previously address + payment elements mounted on open. Now only the Express
Checkout Element mounts; the card form is created lazily in `openCardPath()`
when the customer clicks the button. Drawer opens ~30% shorter (1090px vs
1554px at 390px wide, 2x).

Flow on open: summary with thumbnail and quantity stepper, then EXPRESS
CHECKOUT with wallet buttons, then "or", then one button.

### PayPal no longer dominates
`elements.create('payment', { layout:'tabs' })` rendered PayPal, card and
Klarna as equal-weight tabs. Removed the layout key so Stripe uses its default
ACCORDION, which collapses methods into a list with card expanded first. Same
fix the add-ons build already had.

### Wallet-aware button label
`expressCheckout` 'ready' now reveals the express block only if the device
actually has a wallet. With wallets the button reads "Pay by card instead";
without, "Continue to payment" and no empty express section. Verified both
paths with a stubbed Stripe.

### Summary card
Now mirrors the add-ons cart line: 56x56 thumbnail, product name, inline
quantity stepper, line amount. Changing quantity IN the drawer calls
`changeQtyInDrawer()`, which re-requests a PaymentIntent (the server is the
price authority and the old intent is for the old amount) and syncs the
landing-page stepper.

### Bugs caught during this work
- `confirm()` validated the email field on BOTH paths. On the express path
  that field is not mounted, so wallet payments would have been blocked by a
  validation error on an invisible input. Now only validated for card.
- `receipt_email` could be sent as an empty string on the express path; now
  omitted entirely when blank so Stripe falls back to the wallet's email.
- `cardPathOpen` was declared after first use (temporal dead zone); hoisted.
- Reopening the drawer left stale Elements mounted. `openCheckout()` now
  unmounts and resets to the wallet-first state.

### Not ported from add-ons
Coupon codes, the £40/20% basket discount, the Tracked 24 shipping upsell, and
the Contact Details Element. The first three are add-ons-specific commercial
mechanics; the email field remains a plain input rather than Stripe's
contactDetails element to keep the change contained.

---

## 14. Email surfaced on drawer open (21/07)

Ryan wanted express checkout available immediately, with the email visible at
that stage rather than only after clicking through to the card form.

**Change.** The email input moved OUT of the collapsed `#cardUi` block and now
sits directly after the "or" divider, so it is visible the moment the drawer
opens. Button relabelled "Or Pay with Card" (was "Pay by card instead"); the
no-wallet fallback still reads "Continue to payment".

Everything else is unchanged - only the express element mounts on open, and
the address + payment elements are still created lazily on click.

**Why this is safe.** `confirm()` already validated email only on the card
path, because wallets supply their own. That logic did not need changing:
- express + blank email -> proceeds, `receipt_email` omitted, wallet's email used
- express + typed email -> proceeds, typed email passed as `receipt_email`
- card + blank email -> blocked with a validation message
All three verified against a stubbed Stripe.

**One fix needed.** `openCardPath()` focused the email field after revealing
the card form. With the field now above that block, this pulled focus
backwards to an input the customer had likely already filled. It is now only
focused if still empty.

**Commercial note.** Capturing email before payment means a drop-off at the
card stage still leaves a contactable lead. Worth considering for abandoned
basket recovery, though nothing currently reads that value unless the payment
completes.

**Drawer height on open:** 1174px at 390px wide (2x), vs 1554px with the card
form expanded.

---

## 15. Buy button shows product price only (21/07)

Ryan: the landing-page CTA was showing product + postage. Postage should only
appear at the point of payment.

**Changed.** The buy button and the mobile sticky bar now show the SUBTOTAL
(unit x qty). Previously both showed the full total including the £4.95
postage, which meant the CTA read £54.90 while the kit card directly above it
read £49.95 - an unexplained discrepancy on a cold-traffic page.

The CTA now matches the kit card price exactly at every quantity. Verified
across all three kits at qty 1-3: 9 of 9 correct.

**Postage is still disclosed, just later.** The checkout drawer breaks it out
in full before anything is charged:
  Framed Foil Print Kit  £49.95
  Postage (Royal Mail next working day)  £4.95
  Total  £54.90
and the pay button reads "Pay £54.90". The FAQ also states there is a small
postage charge on the initial kit, so nothing is hidden.

**Server unchanged.** `priceOrder()` still returns subtotal, postage and total,
and remains the price authority. This is purely which number the page displays
before checkout opens.

**Note on the postage nudge.** It still works off the total internally, so
"Add a second kit and get FREE postage" and the switch to "FREE postage
unlocked" at qty 2 are unaffected.

---

## 16. Wallet buttons not rendering - IntegrationError (21/07)

Ryan reported the drawer opening with no Apple Pay / Google Pay, just the email
field and a button.

**The button label was the diagnostic.** It read "Continue to payment", which
is the no-wallet fallback set in the expressCheckout 'ready' handler. So
`availablePaymentMethods` was coming back falsy - Stripe was reporting no
wallets rather than the block being mis-laid-out.

**Cause.** The build had:

    expressElement.on('shippingaddresschange', (e) => e.resolve());

The add-ons build has NO such handler, and carries an explicit warning:
Stripe's current API rejects re-declaring shipping options at click time and
throws an IntegrationError that silently blocks EVERY wallet button. Nothing
appears in the UI; 'ready' simply reports no available payment methods.

This is the same trap the add-ons build already hit and documented. It was
invisible in local testing because a stubbed Stripe never throws it.

**Fix.** Handler removed, and the create() options aligned with the add-ons
build, which was missing three settings:

    buttonHeight: 50,
    emailRequired: true,
    shippingAddressRequired: true,
    allowedShippingCountries: ['GB'],     <- absence can also suppress wallets
    shippingRates: [...]

`allowedShippingCountries` in particular: without it Stripe cannot confirm the
merchant ships to the customer's country and may decline to render the wallet.

Shipping options are now declared ONCE at create(). The amount stays correct
across quantity changes because a fresh PaymentIntent is requested each time -
verified that the shipping rate is £4.95 at qty 1 and £0 at qty 2.

**Still required before wallets appear on the live site:** the Stripe Payment
Method Domain must be registered for keepsake.thebespokefoilcompany.co.uk.
That is separate from this fix and remains on Dixit's list. Both must be in
place - the code fix alone will not make Apple Pay appear if the domain is
unregistered.

---

## 17. wallet-test.html - diagnostic page (21/07)

Added `wallet-test.html` at the site root. Standalone page that answers one
question: will Stripe render wallet buttons on THIS device, and if not, why.

Uses the SAME expressCheckout options as the real drawer (buttonHeight,
emailRequired, shippingAddressRequired, allowedShippingCountries, shippingRates),
so a pass here means the drawer will behave identically. Nothing is charged -
it creates a PaymentIntent and mounts the element, but never confirms.

Checks, in order: publishable key present, key mode (live vs test),
create-payment-intent succeeds, HTTPS, browser-level Apple Pay support, and
finally Stripe's own `availablePaymentMethods`.

Distinguishes the failure modes rather than just saying "no wallets":
- no publishable key -> env var missing, needs setting + redeploy
- create-payment-intent fails -> usually missing STRIPE_SECRET_KEY, or the
  site was drag-and-dropped so node_modules (the stripe package) is absent
- element loaderror -> IntegrationError, options rejected by Stripe
- ready fires with no methods -> Payment Method Domain not registered, or no
  card saved in this browser

`noindex, nofollow` and not linked from anywhere. Safe to leave in place; can
be deleted once wallets are confirmed working.

NOTE: functions/config.js sends `Cache-Control: public, max-age=300`, so after
changing STRIPE_PUBLISHABLE_KEY the old value can persist for up to 5 minutes.
The diagnostic fetches config with `cache: 'no-store'` to avoid this, but the
main page does not - allow 5 minutes or hard-refresh after a key change.

---

## 18. Memory Catcher affiliate variant (22/07)

Rebuilt the affiliate box from the July screenshot onto the CURRENT keepsake
checkout (the old one sat on the retired our-kit base). This turns the page
into a CMS-ready template for franchisee variants at /memory-catcher/<slug>.

### The box
Stone panel + circular photo bleeding off the left, "Exclusive offer from
<name>", the FREE-extra-copy offer, and a split code / Copy Code pill. Sits at
the top of the buy column, above "Choose your kit", matching the screenshot.
Copy-to-clipboard with an execCommand fallback; shows "Copied" for 1.6s.

### CMS-ready - Dixit swaps ONE object per franchisee
```
const MEMORY_CATCHER = {
  name: 'Ashley',              // shown in the heading + alt text
  slug: 'ashley',              // URL /memory-catcher/ashley AND attribution key
  code: 'ASHLEY-WIG',          // the discount code the customer copies
  photo: 'assets/mc-ashley.webp'
};
```
Set MEMORY_CATCHER = null on the plain kit page and the box removes itself at
load, so index.html and every affiliate variant share one file.

IMPORTANT distinction: `slug` and `code` are different on purpose.
- slug = 'ashley'  -> the URL and the commission attribution key
- code = 'ASHLEY-WIG' -> the customer-facing discount code
Do not conflate them. The slug goes to Stripe; the code is what fulfils the
free-extra-copy offer and must exist as a real discount in Shopify/Wix.

### Attribution wired end to end
- Client sends `affiliate: MEMORY_CATCHER.slug` to create-payment-intent (null
  on the plain page).
- Server sanitises via cleanAffiliate() - lowercase, `^[a-z0-9-]{1,60}$`,
  anything else becomes '' (tested against spaces, injection, overlong input).
- Written to Stripe metadata as `affiliate_slug`.
- Webhook surfaces it: ShipStation `advancedOptions.source` =
  'memory-catcher:ashley' and `customField1` = 'mc:ashley'; Meta CAPI unchanged
  but the slug is available.

DIXIT - confirm which field the commission dashboard reads. The slug is in
Stripe metadata (`affiliate_slug`), ShipStation source, and customField1. Point
the dashboard at whichever is cleanest; the data is in all three.

### Photo
`assets/mc-ashley.webp` - Ashley's headshot, cropped to face/shoulders for the
circular avatar (the source was a wide shot), 400x400 WebP q82. Swap per
franchisee as `mc-<slug>.webp`.

### SEO
The affiliate variants keep `noindex, nofollow` with canonical to the main
product page - do NOT let 20+ near-duplicate pages compete in search. (Inherited
from the base; confirm it stays on each variant.)

### NOT yet done
- The `ASHLEY-WIG` discount code must exist as a real discount in Shopify/Wix
  for the free-extra-copy offer to fulfil. The page just copies the string.
- This build IS the Ashley variant. To make the plain kit page, set
  MEMORY_CATCHER = null. Dixit decides whether these are one file with a CMS
  swap or separate deployed files per franchisee.

---

## 18a. Affiliate box - boxed-in refinement (22/07)

Ryan wanted the box closer to the reference: the stone photo panel as a
SEPARATE rounded tile floating inside the box, with the porcelain background
visible all around it, rather than the stone bleeding to the box edges.

Changed: `.mc-affiliate` now has even 20px padding all round and `border-radius:
18px` (dropped `overflow:hidden`). `.mc-photo-wrap` is now a fixed 132x132
rounded tile (`border-radius:14px`), centred vertically, instead of a
full-height panel bleeding to the left edge. Mobile tile 104x104.

Verified by pixel sampling: the box corners and the gap around the stone tile
now read porcelain (246,246,244), confirming the tile floats inside rather than
touching the edges. No overflow at any width; photo loads on all three.

---

## 18b. Affiliate box - one connected bordered unit (22/07)

Ryan's refinement: both tiles connected as a single unit, one grey stroke
wrapping the whole thing, off-white fill for contrast, rounded corners - not
two separate floating tiles with a gap.

`.mc-affiliate` is now the single bordered container (1px hairline,
border-radius 16px, porcelain fill, overflow:hidden so the stone tile sits
flush into the rounded corners). The stone `.mc-photo-wrap` runs the full
height of the unit and carries a hairline on its right edge as the seam between
photo and text. `.mc-body` lost its own border/background - it is just the
padded text area inside the shared container now.

Verified: the stone tile spans the full unit height (rows 2-391 of 396) flush
top and bottom, the outer border reads darker than the fill (222 vs 246), and
the seam between tiles has no porcelain gap. Connected on mobile too; no
overflow at any width.

---

## 19. Dynamic franchisee layer - front-end contract built (22/07)

Dixit confirmed the architecture: edge-injected data into one template, Supabase
lookup, committed photos, affiliate_slug as commission source of truth, 404 on
unknown slug. Built the front-end half so his job is just wiring Supabase.

- index.html: MEMORY_CATCHER now reads an injected '__MC_DATA__' token, parsed
  if present, else falls back to the Ashley example so static preview still
  renders. Verified a different franchisee (Salamata) injects and round-trips
  cleanly - name, code, photo, and the slug that reaches checkout all correct.
- netlify/edge-functions/memory-catcher.js: reference edge function. Reads the
  slug, guards its shape (same charset as the payment-intent sanitiser), looks
  it up in Supabase (dependency-free REST, active rows only), injects the JSON,
  404s on unknown/inactive. Supabase call stubbed with an ashley-only fallback
  until env vars are set.
- 404.html: branded, noindex, CTA to the kit product page.
- netlify.toml: [[edge_functions]] route /memory-catcher/:slug.

Injection uses a double-JSON.stringify so the token becomes a safe JS string
literal that the page's own JSON.parse turns back into the object - no
HTML-escaping surprises. Tested in Node and in the browser.

Dixit still owns: the Supabase table + RLS + env vars, one mc-<slug>.webp per
franchisee, pointing the dashboard at affiliate_slug, and confirming token
replacement on a live deploy (local preview uses the fallback).

