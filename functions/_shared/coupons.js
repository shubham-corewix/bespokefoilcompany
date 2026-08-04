// netlify/functions/_shared/coupons.js
// Single source of truth for discount codes and the discount maths.
// The underscore folder stops Netlify treating this as an endpoint.
//
// STACK_COUPON:
//   false (default) = best-of: the customer gets the coupon OR the £40
//     basket discount, whichever saves more, never both.
//   true = coupon applies ON TOP of the basket discount (a £54.90 cart
//     with EXTRA20 would pay £35.14 - 36% off overall).
// If you change this, change the matching constant in index.html too.

const STACK_COUPON = false;

const COUPONS = {
  EXTRA20: { percentOff: 20 } // WhatsApp decliner recovery code
};

const DISCOUNT_THRESHOLD = 4000; // £40 in pence
const DISCOUNT_RATE = 0.20;
const KEYRING_SKU = 'MK-KEY';
const KEYRING_DEAL_QTY = 3;
const KEYRING_DEAL_RATE = 0.20;

function lookupCoupon(raw) {
  const code = String(raw || '').trim().toUpperCase();
  return COUPONS[code] ? { code, percentOff: COUPONS[code].percentOff } : null;
}

// subtotal/keyring figures in, all discounts out. Mirrored in index.html.
function computeDiscounts({ subtotal, keyringSub, keyringQty, coupon }) {
  const keyringDisc = keyringQty >= KEYRING_DEAL_QTY
    ? Math.round(keyringSub * KEYRING_DEAL_RATE) : 0;
  const afterKeyring = subtotal - keyringDisc;

  const basketEligible = afterKeyring >= DISCOUNT_THRESHOLD
    ? Math.round(afterKeyring * DISCOUNT_RATE) : 0;
  const couponEligible = coupon
    ? Math.round(afterKeyring * (coupon.percentOff / 100)) : 0;

  let basketDisc = 0, couponDisc = 0;
  if (STACK_COUPON) {
    basketDisc = basketEligible;
    couponDisc = coupon
      ? Math.round((afterKeyring - basketDisc) * (coupon.percentOff / 100)) : 0;
  } else if (couponEligible > basketEligible) {
    couponDisc = couponEligible;
  } else {
    basketDisc = basketEligible;
  }

  return {
    keyringDisc, basketDisc, couponDisc, afterKeyring,
    total: afterKeyring - basketDisc - couponDisc
  };
}

module.exports = {
  STACK_COUPON, COUPONS, lookupCoupon, computeDiscounts,
  DISCOUNT_THRESHOLD, DISCOUNT_RATE, KEYRING_SKU, KEYRING_DEAL_QTY, KEYRING_DEAL_RATE
};
