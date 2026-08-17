/* =============================================================================
   lifecycle.js - what gets sent, to whom, and when
   -----------------------------------------------------------------------------
   One place for every template key and delay, so a timing change is one edit
   rather than four functions to hunt through.

   TWO KINDS OF EMAIL, AND THEY DO NOT WORK THE SAME WAY

   1. TRANSACTIONAL - the order confirmation, the upload thank-you. Sent
      immediately, direct, at the moment the thing happens. These must NOT go
      through the queue: a customer who has just paid should not wait for a
      poller to notice.

   2. LIFECYCLE - the welcome series, the Trustpilot invitation, the re-order
      nudge. Days or weeks later, so they go on the queue and n8n sends them.

   WHAT IS NOT HERE, AND WHY

   The post-despatch chain - Email 5, Trustpilot day 7, re-order day 10, Email 7
   day 14, Trustpilot reminder day 21 - is triggered by a SHIPPING event, not by
   anything this repo sees. ShipStation tells n8n an order has gone out and n8n
   enqueues that chain. The keys are listed under DESPATCH below so both sides
   use the same names.

   In-person (Shopify POS) is the same: n8n's trigger, listed here for the names.
   ============================================================================= */

const LIFECYCLE = {
  /* ---- immediate, direct, never queued ---------------------------------- */
  TRANSACTIONAL: {
    ORDER_CONFIRMATION: 'order-confirmation',       // kit bought online
    ADDONS_CONFIRMATION: 'addons-confirmation',     // add-ons bought after
    UPLOAD_RECEIVED: 'upload-received',             // prints uploaded
  },

  /* ---- queued from triggers that live in THIS repo ----------------------- */

  // Community sign-up, no order. Track A.
  SUBSCRIBER: [
    { key: 'welcome-1', delayDays: 0 },
    { key: 'welcome-2', delayDays: 3 },
    { key: 'welcome-3', delayDays: 6 },
  ],

  /* Online kit buyer. Track B. The same welcome series, but starting AFTER the
     order confirmation has landed so the two do not arrive together. */
  ONLINE_BUYER: [
    { key: 'welcome-1', delayDays: 1 },
    { key: 'welcome-2', delayDays: 4 },
    { key: 'welcome-3', delayDays: 7 },
  ],

  /* Sent alongside the upload thank-you. Teases the add-ons app while the
     order is still open and can still be added to.
     Deliberately +1 day, not immediate: the thank-you and a sales email in the
     same minute reads badly straight after someone has trusted us with a
     keepsake. */
  UPLOAD_FOLLOW: [
    { key: 'addons-teaser', delayDays: 1 },
  ],

  /* ---- n8n's triggers. Listed for the names only ------------------------- */
  DESPATCH: [
    { key: 'print-dispatched', delayDays: 0 },
    { key: 'trustpilot-invite', delayDays: 7 },
    { key: 'reorder-referral', delayDays: 10 },
    { key: 'stay-in-touch', delayDays: 14 },
    { key: 'trustpilot-reminder', delayDays: 21 },
  ],
  IN_PERSON: [
    { key: 'in-person-welcome', delayDays: 0 },
  ],
};

/* Every queued row needs a stable dedupe key. Stripe retries webhooks and
   ShipStation can fire despatch twice; without this a customer gets the same
   email twice and nobody finds out until they say so.
   Built from the template key plus something that does not change on a retry -
   an order reference, not a timestamp. */
function dedupe(templateKey, stableId) {
  return `${templateKey}:${stableId}`;
}

module.exports = { LIFECYCLE, dedupe };
