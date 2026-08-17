# BFC Add-ons App - Netlify preview site

A **standalone Netlify site** for testing the redesigned add-ons app on real
devices. Deliberately separate from the main BFC site so nothing here can touch
the live add-ons page.

- Not live. Not indexed. `noindex` in the page, `X-Robots-Tag` on every
  response, and a `robots.txt` that disallows everything.
- Defaults to **Stripe test mode** on any hostname that is not production,
  with a black banner across the top so a preview can never be mistaken for
  the real thing when the link gets shared around.
- The live publishable key only activates on the production hostnames. That
  switch is the single thing that has to change to go live.

---

## Deploy

**The files in this zip sit at the top level, with no wrapping folder. That is
deliberate.** Netlify treats whatever is at the top of the archive as the site
root, so a wrapping folder makes every path one level too deep, `_redirects`
gets ignored, and you get Netlify's own grey "Page not found" instead of the
site. If you ever see that page, this is almost always why.

### Option A - drag and drop (2 minutes, design testing only)

Either:

- Drag **the zip itself** onto [app.netlify.com/drop](https://app.netlify.com/drop), or
- Unzip it into its own folder, then drag **that folder** across.

Both put the files at the site root. What you must not do is unzip and then
drag a folder that contains another folder.

Everything visual works: the two-column grid, the personalisation sheet,
quantities, the keyring deal, the £40 discount, the sticky bar, the cart
drawer, locked mode. Product photos load from the Wix CDN as they do today.

**Checkout will not work.** Drag-and-drop deploys do not run `npm install`, so
the functions cannot load the `stripe` package. This is the right option if you
want to look at the redesign on your phone, which is most of the value.

### Option B - Netlify CLI (5 minutes, everything works)

```bash
cd bfc-addons-preview
npm install
npx netlify deploy --build            # draft URL
npx netlify deploy --build --prod     # the site's main URL
```

Or connect the folder to a Git repo and let Netlify build it. Either way
`npm install` runs, the functions get their dependencies, and checkout works
end to end in test mode.

### If you get a 404

Work down this list.

1. **Is it Netlify's grey "Page not found", or a cream page saying "Nothing
   here"?** The cream one is this site's own 404, which means the deploy is
   fine and only the path is wrong - go to `/`. The grey one means Netlify
   never found the files, which is the nesting problem above.
2. **Open `/` first**, not one of the long paths. The root is a real
   `index.html` file, so it works even if `_redirects` was not picked up.
3. **Check the deploy file list** in Netlify under Deploys → the latest deploy
   → "Preview deploy". `index.html` and `_redirects` should both be at the top
   level. If you see a folder name there instead, redeploy from the zip.
4. **If `/` works but the long paths 404**, `_redirects` did not load. Use
   `/?locked=1` for locked mode in the meantime - the page accepts that as well
   as the `-locked` path.

## Environment variables (Option B only)

Site settings → Environment variables. **Use test credentials.**

| Variable | Value | Needed for |
|---|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_...` | Checkout |
| `STRIPE_WEBHOOK_SECRET_ADDON` | `whsec_...` | Order confirmation |
| `SHIPSTATION_API_KEY` | | Pushing orders |
| `SHIPSTATION_API_SECRET` | | Pushing orders |
| `MANDRILL_API_KEY` | | Order emails |
| `EMAIL_FROM` | | Order emails |
| `META_PIXEL_ID` | | CAPI Purchase |
| `META_CAPI_ACCESS_TOKEN` | | CAPI Purchase |

Two of these are named differently from the old add-ons README, which is wrong
on both counts. It says `STRIPE_WEBHOOK_SECRET` and `META_CAPI_TOKEN`. The code
reads `STRIPE_WEBHOOK_SECRET_ADDON` and `META_CAPI_ACCESS_TOKEN`. The table
above matches the code.

Leave ShipStation, Mandrill and Meta unset if you only want to test payment.
Each one is skipped cleanly when its variables are missing.

### Test key in the page

`index.html` has `STRIPE_PK_TEST = 'pk_test_REPLACE_ME'`. Until you swap
in a real test key the banner reads **payments disabled** and checkout is
blocked outright, which is intentional: no silent fallback to the live key.

Test card: `4242 4242 4242 4242`, any future expiry, any CVC.

---

## URLs once deployed

| | Path |
|---|---|
| Live mode | `/add-ons-exclusive-discount-938476` |
| Locked / browse mode | `/add-ons-exclusive-discount-938476-locked` |
| Follow-up (week later) | `/add-ons-exclusive-discount-938476-followup` |
| With an order ref | `/add-ons-exclusive-discount-938476?order=10456&email=jo@example.com` |

### Follow-up mode

For the retarget message a week after the original ships. On that route:

- **£2.95 2nd class postage is added automatically and cannot be removed.** No
  bin, no stepper, it reads "Included". They can **upgrade** to £3.95 Tracked 24
  from the basket, which *replaces* the £2.95 line rather than adding to it.
  The upsell shows the **difference (+£1.00)**, not £3.95 - showing the full
  price there would read as a second charge on top.
- **Exactly one postage line, ever.** Enforced in the browser and again on the
  server, which rejects a request carrying two rather than guessing which to
  keep. Guessing is how people get charged twice.
- **POST-STD is rejected outright on the normal link.** Postage is free there,
  so a standard-postage line can only be a stale basket or an edited request.
- **Whichever postage line is locked is excluded from the £40 threshold and
  from the 20%.** Carriage should
  not buy someone a discount, and discounting a charge we have imposed is just
  giving margin away. £39.90 of product plus forced postage does *not* unlock
  the discount; £40 of product does.
- The Upgrades section and the postage quick-add in the basket are hidden,
  since postage is already in.
- The copy changes: headline becomes "Anything you missed?", and the page says
  plainly that this is a separate parcel rather than claiming it travels with
  the original.
- Arriving back on the normal link with a follow-up basket in storage unlocks
  the postage line so it can be removed again.

**Enforced server-side, not just in the browser.** `addons-create-payment-intent.js`
puts the postage line back if the request arrives without it, and applies the
same discount rule. One caveat worth stating plainly: the server learns which
link was used from a flag the browser sends, so someone editing the request
could send `followup: false` and dodge the £3.95. The flag can only ever *add*
cost, never remove it, and closing that gap properly would mean signing the
link. Given the exposure is £3.95 on an order that would not otherwise exist, it
is noted rather than fixed.

**Parity is tested.** `totals()` in the page and the arithmetic in the function
have to agree exactly or the browser quotes a figure Stripe refuses. There is a
check that extracts both from source and runs them over the same baskets.

The root `/` also serves the page, in live mode.

These paths match the main site's `_redirects` exactly, because the page reads
`location.pathname` to decide whether it is locked. Change the paths and locked
mode stops triggering.

---

## What to look at

The whole point of putting it on a device.

1. **Two columns on your phone.** Eight products used to be eight full-width
   tiles. Check the tiles are readable at 375px and that the long product names
   are not clamping awkwardly.
2. **The personalisation sheet.** Now a full-screen takeover on phones rather
   than a half-height panel, so the shop is no longer visible behind it. Tap
   Personalise on the A5 Framed Print - three colour choices, with the notes
   box collapsed behind "Add a note (optional)". Then try the Custom Framed
   Print, which is the heavy one: two selects plus a required 500-character
   box. With the keyboard up, check that Add to basket sits directly on the
   keyboard, the product name stays visible at the top, and nothing from the
   shop shows through underneath.
3. **The rotated typography.** Fraunces is now 340/420 rather than 500, so
   headings should look noticeably lighter. Body copy is Instrument Sans, not
   Figtree.
4. **Buttons.** Now 10px corners rather than full pills, matching the site and
   the upload portal. This is the biggest visual change and the one most worth
   a second opinion.
5. **Locked mode.** Browse and open personalisation freely; Add, Cart and
   Checkout should all hand off to the "Almost there!" lightbox, and nothing
   should ever reach the basket.
6. **Apple Pay / Google Pay** (Option B only). Wallet buttons need the preview
   domain registered under Stripe → Settings → Payment method domains, in test
   mode. Without that there is no Apple Pay button, which is almost always the
   answer to "where's Apple Pay gone".

---

## Local preview without deploying

```bash
node preview.js
```

Serves the same routes on `http://localhost:4173`. Useful for layout, no use
for checkout.

---

## Product options and notes

**A5** now asks for **Name position** (Bottom / Top) and **Name font**
(Cursive / Modern), on top of card and foil, frame and hand/foot. Five required
choices; the sheet scrolls.

**A3** carries a note above its choices:

> Your prints stay at their true scale, exactly as on the A4. An A3 frame sets
> them in a wider border, which gives the finished piece more presence.

That is expectation-setting before payment, not fine print. Someone spending
£34.95 on "A3" reasonably assumes bigger prints; they get the same artwork in a
wider mount. Far better said here than in a refund conversation.

**"True scale" rather than "same size"** is deliberate. Both answer the
expectation, but only one says the thing that actually matters: the hand and
footprints are a faithful record of how big they really were. That turns the
limitation into the reason the keepsake is worth having.

Any product can carry one: add `note:'...'` to it in `PRODUCTS`.

### Three files have to agree

Adding an option touches:

1. `PRODUCTS` in `index.html` - what is offered
2. `CATALOGUE` in `addons-create-payment-intent.js` - the **whitelist**. A value
   missing here is rejected at payment with "Invalid option", after the customer
   has filled the form.
3. `FIELD_LABELS` in **both** `index.html` and `addons-stripe-webhook.js`. Both
   fall back to the raw key, so a missing entry silently prints `namePosition`
   on the studio's picking note instead of "Name position".

`options.js` checks all three line up, value for value.

### A note on the test fixtures

Tests used to fill dropdowns by index (`sels[0]`, `sels[1]`), which broke the
moment A5 gained two options. They now call `fillAllSelects()`, which picks the
first real value in every select on the sheet, so adding options does not
require touching the tests.

## Testing checkout for pennies

**Do not hardcode a test code.** Coupons are read live from Stripe Promotion
Codes, so a 98% code is created in the dashboard and works immediately with no
deploy, and can be killed instantly the same way. The string never exists in
this repo or in the page source.

In Stripe: **Products - Coupons - New**, 98% off, then add a Promotion Code.
Set an **expiry** and a **max redemption count**, both of which bound the damage
if the code ever leaks. Something unguessable, not `TEST98`.

### What had to change to make it work

**Stripe will not take less than 30p in GBP.** A 98% code on a £9.95 basket asks
for 20p, and the old code returned "Order total too low after discounts" - which
reads as broken checkout when it is really just arithmetic, and would have wasted
the test run. The coupon is now **capped so the charge lands exactly on the
floor** rather than the payment being rejected. Mirrored on both sides, because a
clamp on one only would mean the browser showing one total and Stripe being asked
for another.

Ordinary coupons are untouched: EXTRA20 never gets near the floor.

| Basket | Charged with 98% off |
|---|---|
| £2.95 | £0.30 |
| £9.95 | £0.30 |
| £34.95 | £0.70 |
| £47.88 | £0.96 |

### Test orders cannot be mistaken for real ones

Any order with **90% or more off** is flagged automatically, wherever it lands:

- `testOrder: yes` in the Stripe PaymentIntent metadata
- ShipStation internal notes open with `*** TEST ORDER - DO NOT PRODUCE OR SHIP ***`
- ShipStation source field reads `TEST ORDER - Memory Catcher Add-ons Page`, so
  it is obvious in the list view without opening the order
- GA4 `purchase` carries `test_order`, so QA runs can be filtered out of revenue

That guard matters more than the code itself. Without it a test order looks
exactly like a real one in ShipStation, and someone presses a keepsake for it.

## The £40 gap filler

The progress bar used to say "you're £11.05 away" and stop there. It now names
the product that closes the gap and offers it on one tap, in the sticky strip
and in the basket nudge.

**It only ever suggests something that actually closes the gap.** Suggesting a
£9.95 print against an £11.05 shortfall would be worse than saying nothing: they
add it, nothing unlocks, and the nudge has lied to them. At a £10.00 gap it
steps up to the £19.95 framed replica for exactly this reason.

Selection order:

1. **One-tap products first.** Anything with required personalisation has to
   open the sheet instead. The Perfect Match print and frame are the only two
   with no required fields, which is also the pair that is quickest to produce
   and carries the best margin - merchandising and mechanics agreeing for once.
2. **Then `boost`**, a data flag on the product rather than a SKU hardcoded in
   the logic, so the merchandising order can change without touching any code.
3. **Then cheapest**, so the ask is as small as it can be.

Postage is never suggested. It is carriage, and in follow-up mode it does not
count towards the threshold anyway.

Where the suggestion needs choices made, the button reads "Choose" and opens
that product's personalisation sheet rather than guessing colours on someone's
behalf. Taps are tracked as `gap_filler_taken` with `one_tap` true or false, so
you can see which path converts.

**Known ceiling:** between a £19.95 and a £24.95 gap, no one-tap product closes
it, so the suggestion falls to the custom framed print. Suggesting *two* Perfect
Match items would keep it in the high-margin pair, but it is a bigger ask and a
bigger build. Worth revisiting once there is data.

## No cookie banner on this page (deliberate)

**The main site's `shared/analytics.js` must never be loaded here.** Its consent
banner is `position:fixed` at `bottom:16px` with `z-index:2147483000`. This page
has a sticky Checkout bar pinned to the bottom at `z-index:50`, so the banner
landed directly on top of the Checkout button and swallowed the tap. It only
closed on Accept or Decline, so anyone who ignored it could not check out at
all. On the main site there is no bottom bar and the banner is harmless; here it
was a total conversion blocker.

This app loads `shared/analytics-addons.js` instead. **The filename differs on
purpose** so a future "sync the shared files" cannot silently reintroduce the
banner, and `shared/analytics.js` is not present in this package.

### Why removing it is still compliant

PECR and UK GDPR require consent to **store** information on a device. The
module sets `analytics_storage: 'denied'` and contains **no code path that can
ever grant it** - no `consent update`, no banner, no `localStorage`, plus
`client_storage:'none'` on the config as belt and braces. GA4 therefore never
writes or reads a cookie, so there is nothing to consent to and nothing to ask
about. Removing the banner is only correct **because** consent is permanently
denied; if anyone ever grants it, the banner obligation returns.

Cookieless pings still send, so every event still arrives and the funnel,
conversion rates and product data all keep working. What is lost is
cross-session identity - returning visitors look new, attribution is modelled.
For "is the £40 nudge working and where do people drop out", that costs almost
nothing.

### If you ever want consented analytics here

Do not reintroduce a floating banner. Put the choice inline in the footer, above
the sticky bar, where it cannot overlay anything.

`checkoutclear.js` fails if **anything** floats above the checkout bar in any
mode, if cookie wording appears on the page, if a consent key is written to
storage, or if the site's banner file reappears in this package.

## Locked mode is switched OFF

`const LOCK_ENABLED = false;` near the top of the script.

The `-locked` URL still resolves and still serves the page, it just behaves
exactly like the live one, so **the link in the WhatsApp flow never has to
change**. Every piece of locked-mode machinery is intact.

**To lock it again: set that one constant to true.** Nothing else needs
touching.

`lockswitch.js` runs the page BOTH ways - as shipped, and with the switch
flipped in memory - so the locked path cannot rot unnoticed while it is unused.
It asserts the two links behave identically today, and that flipping the switch
restores browse mode, the lightbox interception and the intent tracking.

### Telling the two links apart

Behaviour is identical, but the entry point is still recorded, which is the
point of "we can monitor this". Every GA4 event now carries:

- `entry_link` - `standard`, `locked-url` or `followup`
- `lock_enabled` - so historic data stays interpretable if the switch moves
- `app_mode` - how the page actually behaved (all `live` while the switch is off)

So conversion from the pre-proof link can be compared against the standard one
without either behaving differently.

## Measurement

`shared/analytics.js` is **byte-identical to the main site's file**. One
measurement ID (G-L1J1KR2VZZ), one consent banner definition, one place to
change either. Do not fork it.

Consent Mode v2 sets everything to **denied before GA loads**, so no cookie is
written until someone chooses. Events still send as cookieless pings when
declined, so the funnel is measurable either way. The "Cookie settings" link
attaches itself to `.foot-legal`, which this footer has.

### Events

Standard GA4 ecommerce names throughout, so the built-in ecommerce reports work
with no configuration:

`view_item_list` (on load) - `view_item` (personalisation opened) -
`add_to_cart` - `remove_from_cart` - `view_cart` - `begin_checkout` -
`add_payment_info` - `purchase`

Custom, for what GA4 has no name for:

| Event | Answers |
|---|---|
| `discount_unlocked` / `discount_lost` | Does the £40 threshold actually change behaviour? |
| `coupon_applied` / `coupon_rejected` | Is EXTRA20 working, and are people mistyping it? |
| `locked_intent_blocked` | **Pre-proof purchase intent** - someone tried to buy and we stopped them |
| `share_link` | Is the grandparent share being used? |

Every event carries `app_mode` (live / locked / followup) and `order_ref`.

### Three rules baked in

1. **No email, ever.** Google's terms forbid PII and the customer's address is
   sitting in the URL. `order_ref` goes instead: pseudonymous to Google, but it
   lets you look up exactly who filled a basket and never paid.
2. **Measurement can never break checkout.** Every call is wrapped and is a
   silent no-op if gtag is missing, blocked or throws. There is a test that
   deletes gtag and confirms the cart still works.
3. **Discount events are edge-triggered.** They fire once when a discount turns
   on, not on every basket change while it is on, or the conversion rate would
   be meaningless.

`purchase` reads the basket out of storage **before** the success screen clears
it, otherwise it fires with no items. Tested.

Not added: the browser-side Meta Pixel. Purchase already goes to Meta
server-side via CAPI in the webhook, and a browser pixel would need bringing
under the consent banner first.

## Shipping bar

A stone bar directly above the announcement bar, present in production:

> ALL ADD-ON ORDERS INCLUDE FREE 2ND CLASS POSTAGE

Shortened from the snag list to fit one line. It eases to .6rem below 620px and
holds one line from about 355px up, which covers every current phone.

"Dispatched with your original order" moved out of the bar to achieve that. The
fact is still on the page - it is in the lede - and `shipbar.js` asserts that
rather than the bar's exact wording, so it cannot quietly disappear.

**Standard postage is free on everything, by Royal Mail 2nd class**, exactly as
on the main site. The £3.95 Tracked 24 line is a SPEED upgrade, never carriage.
Nobody is ever charged to receive their add-ons at the first upsell point.

Naming the service is deliberate. "Ships free" on its own invites "then why is
there a £3.95 postage product?" - saying 2nd class answers it before it is
asked. The Upgrades section, the product description and the basket upsell all
already frame the £3.95 as speed rather than delivery, so the bar was the only
loose piece.

**It changes in follow-up mode**, where none of that is true any more:

> ALL ADD-ON ORDERS INCLUDE £2.95 2ND CLASS POSTAGE

Deliberately the same shape as the live version, so only the two facts that
actually change are different.

There is a test that reads the bar in all three modes and fails if any of them
claims free postage or a shared parcel after the original has shipped, and that
cross-checks the rest of the visible page for the same claims.

The preview flag sits above it and is now `--bone` rather than `--stone`, so the
two never read as a single bar. Tonal ladder from the top: bone (dev only),
stone (shipping), ink (announcements).

## Announcement bar

The top bar is the **same component as the main site**, ported from
`/shared/styles.css` rather than rebuilt. Two statements instead of the site's
four, so the cycle is 14s rather than 28s, but each statement holds for exactly
the same 7s and fades on the same curve.

- Rated **Excellent** on Trustpilot (with the stars asset)
- Made using our exclusive **Foil Fusion Technology(TM)**

**Both statements are in the raw HTML and rotate in CSS.** That is deliberate
and is spelled out at length in the main site's `scripts/build-announce.js`: a
JavaScript text swap shows a crawler one statement and hides the other. Do not
turn this into a `setInterval`.

Reduced-motion users see the first statement only, no cycling. The second stays
in the markup.

There is a test that compares every property against the site's stylesheet and
fails if the two drift apart.

The preview banner still sits above it on non-production hostnames, restyled in
stone rather than black so it reads as a dev artefact instead of competing with
the announcement bar. It does not render in production at all.

## Footer

Carries the same seven payment methods as the product page (Klarna, Visa,
Mastercard, Apple Pay, Google Pay, Amex, PayPal), the brand line, and the
company formalities in small print.

Two things worth knowing:

- **Klarna's SVG is a transparent wordmark** meant to sit on Klarna Pink. Without
  `.pay-chip img[src*="klarna"]{background:#FFA8CD}` it renders as an empty white
  chip. The main site had exactly this bug in one place and it was found by a
  check rather than by eye, so there is a test for it here.
- **The chips must NOT carry a CSS border.** Six of the seven SVGs already draw
  their own 2px #D9D9D9 rounded-rect outline, so adding one gives every chip a
  visible double stroke. Amex is the exception - it paints a full-bleed blue
  card with no outline - which is why the site leaves the chip bare. There is a
  test that reads the SVGs, counts how many are self-stroked, and fails if the
  chip rule reintroduces a border.

The legal line reads "Registered in England & Wales - Company No. 12941845 -
VAT GB419408687". It deliberately drops the site's leading "(c) 2026" because
the brand line directly above already carries a copyright mark, and two on top of
each other reads like an error. Say the word if you want the year back.

## Mobile hero (overlay)

From the 13 Aug snag list. Below 920px the hero is an **overlay**: the
slideshow goes full-bleed behind the headline and lede, with a scrim between.
That buys back the ~140px the headline used to occupy above the photo, which is
the whole point - it lifts the first product images into the fold.

`display:contents` on `.hero-copy` lifts its children into the grid, so
`.hero-shot` and `.hero-headline` can both sit in cell `1/1` and stack, while
the points and note flow underneath. `.hero-headline` exists purely to keep the
h1 and lede together in that one cell - two separate items there would overlap
rather than flow. On desktop it is an ordinary block and changes nothing.

### The scrim is sized by measurement

Two slides are a white frame on a white wall. **White text on those sits at
1.48:1 with no scrim** - completely unreadable. The gradient reaches 0.74 alpha
where the text lands, which takes the worst case to **9.69:1**. It tapers to
nothing at the top so the photograph still reads.

`mobilehero.js` **resolves the cascade** - every matching rule ordered by
specificity then source position, at real viewport widths - and reports the
value that actually wins. Its previous version only checked the rules existed,
which passed while they were being overridden and did nothing. It also recomputes
the contrast from the winning colour against the brightest slide, so weakening
either the scrim or the text colour fails the test rather than shipping
unreadable copy.

### No point boxes on mobile at all

Snag list, 13 Aug 16:13. The first point's copy was folded into the lede and the
boxes dropped entirely below 920px, with "Extras" pulled up to sit roughly where
the first box used to start.

### Headline

> **One set of prints,**
> **as many keepsakes**
> **as you like**
> *They'll never be this small again*

The previous line was "Your chance to add a few extras". Three problems: "a few"
is an explicit ceiling and nobody reads it and thinks eight; "extras" frames the
products as the thing you decline to be sensible; and "your chance to" is
passive and carried a whiff of the scarcity that was deliberately removed.

The italic coda is the emotional engine of the category, and it is honest
scarcity - about the child, not a deadline. It sits 10px under the headline in
italic Fraunces so the two read as one thought; any more gap and it becomes a
subheading, which is a weaker thing.

Breaks are explicit. Left to wrap, "like" orphans on its own line at most phone
widths.

**The mobile lede is gone**, because the headline now says it. "One set of
prints, as many keepsakes as you like" and "the hard bit's already done, we have
your prints" are the same point, and running both on a small screen is just
repetition. `.lede-wide` survives on desktop, where the three point boxes still
exist to support it.

### Previously: two ledes

That arrangement is superseded. For reference, it was:

- `.lede-wide` (desktop) - "Your little one's prints are already with our
  studio. Anything you add now is posted with your original."
- `.lede-narrow` (mobile) - "**The hard bit's already done** - we have your
  digitally edited hand and footprints, ready to use again"

Repeating a point in the lede would read as a duplicate on desktop, where the
boxes still exist. `display:none` on the hidden one, not `visibility`, so it
leaves the accessibility tree rather than being read out twice. Both follow-up
and locked mode rewrite **both** ledes, or the hidden one resurfaces at another
width still carrying live-mode copy.

The mobile lede is `rgba(255,255,255,.9)`, matching the site's hero body copy.
The bold lead-in inherits rather than taking its own colour, so it is set apart
by weight alone.

### The mobile override block has to sit AFTER the rules it beats

It first shipped placed above them and silently did nothing:
`.hero-points{display:none}` lost to `.hero-points{display:flex}` and
`.hero-headline .lede{color:...}` lost to `.hero .lede{color:var(--ink-soft)}`,
both at equal specificity where source order is the only tie-breaker. The nested
`b` rule at (0,3,0) still won, which is why the bold went white while the rest
of the paragraph stayed dark - a useful signature for this class of bug.

There is a comment at the block marking why it lives where it does. If you add a
base rule below it that the mobile rules need to beat, move the block down past
it.

**Trade-off worth knowing:** "posted with your original" now appears only on
desktop. On mobile nothing states that add-ons travel with the original order.
The one-line fix if you want it back is the Extras sub-heading, currently "Order
replicas of your original copy", which has room.

### Header

Trimmed from 82px to **66px**, and **58px below 480px**. It is the third thing
on the page and pushes everything below it down, so every pixel here is fold.

The cart button came down from 48px to 42px (38px on small phones) with the pip
scaled to match, but it **keeps a 44px tap target** via an invisible
pseudo-element, so nothing became harder to hit. Same trick as the quantity
steppers.

At 320px the logo and cart occupy 222px of 300px, so there is 78px spare even on
the narrowest phone still in use.

### Fold budget

`fold.js` stacks the real CSS values and reports how much product photo lands
above the fold. Mobile `section` padding came down from 54px to 34px, which was
the single biggest thing in the way.

| Device | Product photo visible |
|---|---|
| iPhone SE3 / 13 mini | 214px |
| iPhone 14/15 | 246px |
| Ryan's snag viewport (500x835) | 227px |
| iPhone Pro Max | 332px |

At 390px a tile image is about 157px tall, so the whole first row of product
photography is above the fold with room to spare.

The grid is two-up, so that band shows on both first tiles.

## Hero layout

The photo **stretches to the height of the copy column**, so its top sits level
with the headline and its bottom level with the last point box, at every window
width. That is grid's default `align-items:stretch` plus `aspect-ratio:auto` on
the figure; the slides are absolutely positioned, so the figure has no content
height of its own and simply takes the row.

Centring it, or leaving a fixed aspect ratio, only lines the bottoms up by
coincidence at one particular width.

**The two-column breakpoint is 920px, not 760px, and the number matters.**
Stretching makes the photo's shape an output rather than a setting: the narrower
the window, the taller and thinner the slot. At a 760px window it works out
around 0.58 wide-to-tall, which crops the dad clean out of the family shot and
reduces the frame-corner photo to a strip. At 920px the worst case is 0.72,
which all ten survive - verified against rendered crops at both ratios, not
assumed. Below 920px it stacks, which is the better layout there anyway.

If the copy ever grows (a fourth point, a longer headline), the photo grows with
it and the aspect gets narrower. `heroalign.js` models this and fails below 0.70.

## Hero slideshow

The hero is a **CSS-only crossfade**, no JavaScript, currently running ten
slides at 3s each on a 30s loop. To add or remove photos, edit the `<img class="hero-slide">`
tags inside `<figure class="hero-shot">`. Up to ten are supported and the timing
looks after itself - nothing else needs changing.

**The `:has()` rules use animation longhands, not the `animation` shorthand.**
The shorthand resets `animation-delay`, and those rules are specificity (0,4,0)
against (0,2,0) for the per-position delays - so the shorthand wins, every slide
gets a delay of 0, and all ten fade in and out together. There is a test that
resolves the cascade and asserts each slide keeps its own delay.

Slides are **not** `loading="lazy"`. They sit in the viewport, so it defers
nothing, and a transparent lazy image can stall indefinitely in some browsers.
`fetchpriority="low"` on everything after the first is what keeps them out of
the LCP image's way.

Order alternates someone-in-shot with product-only, and wraps correctly so two
product shots never meet at the loop join. Shuffled within each group; the
unboxing photo is pinned first because it is the LCP image and the right opener
for this page. There is a test that checks the alternation rather than trusting
the shuffle.

Two crops are nudged off centre, keyed off `src` in CSS: 416 (a centred crop
loses the frame entirely) and 024 (the only portrait source, whose landscape
crop clips the prints). Both were checked against rendered crops at each aspect
ratio before committing.

Per new slide:

- keep `class="hero-slide"`
- the first slide keeps `fetchpriority="high"` (it is the LCP image); give every
  later one `fetchpriority="low" loading="lazy"`
- give every slide real alt text, they are not decorative
- keep paths relative, so they work deployed and off the disk

Each slide holds 6s with a 0.6s crossfade. There is one keyframe set per slide
count rather than one clever formula, because CSS cannot calculate keyframe
percentages from a variable. The delays are per-position and count-independent,
so only the duration changes and `:has()` picks the right one.

With one slide it is static. On a browser without `:has()` (pre-2023) it is also
static rather than blank. Reduced motion pins the first slide and never cycles.

There is a test that resolves every keyframe back to seconds and simulates the
whole cycle for 2, 3, 4 and 5 slides, proving exactly one slide is on screen at
every moment with no gap or double-exposure at the loop.

To resize a new photo the same way as the existing one:

```
python3 -c "
from PIL import Image
im = Image.open('YOUR.jpg').convert('RGB')
for w in (800, 1200, 1600):
    h = round(w / (im.size[0]/im.size[1]))
    im.resize((w, h), Image.LANCZOS).save(f'assets/hero-NNN-{w}.webp', 'WEBP', quality=82, method=6)
"
```

Check the crop before committing: the hero is 16:10 stacked on mobile but 4:4.4
portrait beside the copy from 760px, so a landscape photo loses 40% of its width
on desktop.

## Product photography

**Nothing on this page comes from the Wix CDN any more.** All eight product
photos, plus the locked-mode lightbox image, are served from `assets/`. The
`preconnect` to `static.wixstatic.com` is gone with them.

| SKU | File | Shot |
|---|---|---|
| PM-PRINT | `prod-pm-print-*` | Teddy print being lifted |
| PM-FRAME | `prod-pm-frame-*` | Alfie James, ash frame |
| CK-PRINT | `prod-ck-print-*` | Teddy in the foil press |
| CK-FRAME | `prod-ck-frame-*` | Tommy rose gold, white frame |
| MK-KEY | `prod-mk-key-*` | keyring and pouch |
| TK-A5 | `prod-tk-a5-*` | Sophie handprint, charcoal frame |
| HK-A3 | `prod-hk-a3-*` | Teddy gold footprints |
| POST-EXP | `prod-post-exp-*` | packaging in hand (POST-STD reuses it) |

600 and 1000px WebP with a `srcset`; the tile tops out at ~500 CSS px, so 1000
covers 2x. A phone pulls about 145KB across all eight, lazily and below the fold.

### Crops

The tile is `1 / 0.9` and six of the eight photographs are tall portraits, so
each loses roughly 40% of its height. Three needed nudging, chosen by rendering
the alternatives side by side rather than guessing:

- **CK-PRINT `center 85%`** - centred, the crop is nearly all press and window
  with the keepsake cut off at the bottom. 85% brings the print into frame while
  keeping the press arm for context.
- **PM-FRAME `center 45%`** - centred clips the top of the frame.
- **TK-A5 `center 40%`** - same, and 40% keeps a sliver of shelf beneath.

The other five are correct dead centre.

The old `MK-KEY` rule biasing 70% rightwards **has been removed**. It existed
because the previous keyring photo had the BFC logo near the right edge; this
one does not, and leaving it would have cropped the pouch out.

## Images

The hero photo is **bundled in this package** at `assets/hero-566-*.webp` and
referenced with a relative path, so it works whether you deploy it or just open
`index.html` off the disk. Three widths are included (800/1200/1600) with a
`srcset`, so a phone pulls 26KB rather than 75KB. Converted from
`TBFCFinals_566_.jpg` (6609x4406, 13.7MB) at quality 82.

These three files are the only new assets, so merging into the main site means
copying `index.html` plus `assets/hero-566-*.webp`.

The eight **product photos still load from the Wix CDN** (`static.wixstatic.com`),
as they always have. If they ever come up blank, that is Wix hotlink protection
rather than anything in this code - the original README flagged it as a risk.
The fix is to re-host the eight images in `assets/` and swap the URLs in the
`PRODUCTS` array. Product tiles degrade to a plain stone box rather than
collapsing, so the layout holds either way.

Because of that, opening the standalone `index.html` with no `assets/` folder
beside it will show the hero but no product photos. Use the whole folder.

## Known, and not fixed here

- **The order email logo still points at the Wix CDN.**
  `functions/_shared/render-order-email.js` line 73 loads the header image from
  `static.wixstatic.com`. That is one of the open items on the main go-live
  runbook and it is shared code, so it affects add-ons orders too. Not changed
  here because it belongs to the main site fix, not this design pass.
- **Container is 1060px** against the site's 1280px.
- **Header and footer** are still the app's own minimal versions rather than
  the site's.
- **A3 Print + Frame (£19.95)** exists in the Wix catalogue but not in this app.
- **The keyring product photo has an ® baked into the image.** The BFC logo
  near the right edge of `MK-KEY` carries the registered mark. It is a Wix CDN
  JPEG, so it cannot be changed in code - the photo itself needs reshooting or
  re-editing. Everything in the markup is now ™.

---

## Going live, when you get there

This folder is a preview harness, not the shipping artefact. To ship:

1. Copy this folder's `index.html` over `addons/index.html` in the main site
   bundle. It sits at the root here only so the preview deploy works without
   depending on `_redirects`.
2. Nothing else moves. The functions, `_redirects` lines and `netlify.toml`
   entries all already exist on the main site.
3. Confirm the production hostname is in `PROD_HOSTS` in the page, so the live
   publishable key activates and the preview banner disappears.
4. Rewrite `addons/README-original.md`. It still describes the app as a
   standalone site on its own subdomain, which stopped being true when it moved
   inside the main site.

Do not deploy this folder to the production domain.

---

## Contents

```
bfc-addons-preview/
├── README.md                              this file
├── netlify.toml                           functions dir, noindex headers, no-cache
├── _redirects                             the locked/live pretty URLs
├── package.json                           stripe dependency
├── robots.txt                             disallow everything
├── 404.html
├── preview.js                             local server
├── index.html                             the app
└── functions/
    ├── addons-create-payment-intent.js    server-side pricing
    ├── addons-stripe-webhook.js           ShipStation + email + CAPI
    ├── validate-coupon.js
    ├── get-order.js
    ├── order-number.js
    └── _shared/render-order-email.js
```

All six functions are unchanged from the main site bundle.
