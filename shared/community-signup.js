/* shared/community-signup.js
 *
 * The "Join our community" email capture that appears in the footer area of
 * 25 pages.
 *
 * WHY THIS FILE EXISTS
 * Until 10/08/2026 the block was on 25 pages and only TWO had any handler at
 * all: franchise.html had a full one, home.html had an alert() stub. On the
 * other 23 the Join button did literally nothing - no request, no message, no
 * error. A visitor typed their email, clicked, and the page sat there.
 *
 * That is worse than a stub, because a stub at least tells you something
 * happened. Twenty-three pages were quietly discarding sign-ups.
 *
 * Dixit flagged "join community" as one unwired form. It was 23.
 *
 * One shared file rather than 25 copies, for the same reason the order number,
 * the Trustpilot figures and the steps gutter all ended up single-sourced this
 * week: every duplicated implementation on this site has eventually drifted.
 *
 * Loaded with `defer`, so it runs after the DOM is parsed and needs no
 * DOMContentLoaded wrapper. Exits quietly on pages without the block.
 */

(function () {
  'use strict';

  var btn = document.getElementById('communityJoin');
  var input = document.getElementById('communityEmail');
  if (!btn || !input) return;                 // page does not carry the block

  /* franchise.html hides the field and reveals this instead. Optional. */
  var done = document.getElementById('communityDone');

  var msg = document.getElementById('communityMsg');
  if (!msg && !done) {
    msg = document.createElement('p');
    msg.id = 'communityMsg';
    msg.className = 'community-msg';
    msg.setAttribute('role', 'status');
    msg.setAttribute('aria-live', 'polite');
    (btn.parentElement || input.parentElement).insertAdjacentElement('afterend', msg);
  }

  function say(text, ok) {
    if (!msg) return;
    msg.textContent = text;
    msg.className = 'community-msg' + (ok === true ? ' is-ok' : ok === false ? ' is-bad' : '');
  }

  function cookie(n) {
    var m = document.cookie.match('(^|;)\\s*' + n + '\\s*=\\s*([^;]+)');
    return m ? m.pop() : '';
  }

  btn.addEventListener('click', async function () {
    var email = (input.value || '').trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      input.focus();
      return say('Please enter a valid email address.', false);
    }

    var was = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Sending...';
    say('');

    /* Shared ID so the browser Pixel event and the server-side CAPI event
       deduplicate rather than counting the same sign-up twice. */
    var eventId = (window.crypto && crypto.randomUUID)
      ? crypto.randomUUID()
      : String(Date.now()) + Math.random().toString(16).slice(2);

    if (typeof fbq === 'function') {
      fbq('track', 'Lead', {
        content_name: 'Community sign-up',
        content_category: 'newsletter'
      }, { eventID: eventId });
    }

    try {
      var r = await fetch('/.netlify/functions/submit-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          /* subscribeOnly tells submit-lead to validate the email alone rather
             than demanding the name, mobile and town a full lead needs. */
          formType: 'community',
          subscribeOnly: true,
          email: email,
          eventId: eventId,
          fbp: cookie('_fbp'),
          fbc: cookie('_fbc'),
          notes: 'COMMUNITY SIGN-UP',
          sourceUrl: location.href
        })
      });
      var d = await r.json().catch(function () { return {}; });
      if (!r.ok || d.ok === false) throw new Error('bad response');

      input.value = '';
      if (done) {
        input.hidden = true;
        btn.hidden = true;
        done.hidden = false;
      } else {
        btn.textContent = 'Joined';
        say('Thanks - you are in. Your welcome code is on its way.', true);
      }
    } catch (e) {
      btn.disabled = false;
      btn.textContent = was;
      say('Could not sign you up just now. Please try again, or email hello@thebespokefoilcompany.co.uk.', false);
    }
  });

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); btn.click(); }
  });
})();
