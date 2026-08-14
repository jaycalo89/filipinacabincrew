/* ==========================================================================
   Filipina Cabin Crew — cookie consent

   Google Analytics is NOT in the page markup. It is injected from here, and
   only once the visitor has accepted. That ordering is the whole point: a
   banner that appears after the tag has already set its cookies asks for
   permission that was taken a moment earlier.

   Consequences worth knowing:
   - With JavaScript off, no analytics loads and no banner appears. Nothing is
     set, so there is nothing to consent to.
   - Declining is remembered like accepting. The banner does not reappear on
     the next page or the next visit.
   - The choice can be changed later through any element carrying
     data-cookie-settings (there is one in the footer of every page).
   ========================================================================== */
(function () {
  'use strict';

  var KEY = 'fcc-cookie-consent';
  var GA_ID = 'G-GYLEWQT3B9';
  var ACCEPTED = 'accepted';
  var DECLINED = 'declined';

  /* Private browsing and "block all cookies" both make localStorage throw on
     access rather than return null, so every touch is guarded. If storage is
     unavailable we treat the visitor as undecided: the banner shows, and
     analytics stays off unless they accept in this page view. */
  function read() {
    try { return window.localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function write(value) {
    try { window.localStorage.setItem(KEY, value); } catch (e) { /* not fatal */ }
  }

  var gaLoaded = false;

  function loadAnalytics() {
    if (gaLoaded) return;
    gaLoaded = true;

    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;

    gtag('js', new Date());
    gtag('config', GA_ID);

    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
  }

  /* ----------------------------------------------------------------------
     Banner
     ---------------------------------------------------------------------- */
  var banner = null;

  function build() {
    var el = document.createElement('div');
    el.className = 'cookie-banner';
    // A region rather than a dialog: it does not trap focus or block the page,
    // and announcing it as a dialog would imply both.
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', 'Cookie notice');

    var inner = document.createElement('div');
    inner.className = 'cookie-banner-inner';

    var copy = document.createElement('p');
    copy.className = 'cookie-banner-copy';
    copy.appendChild(document.createTextNode(
      'We use cookies to improve your experience and analyze site traffic. ' +
      'By continuing to use this site you agree to our use of cookies. '
    ));

    // Absolute so the link resolves the same from /career-tips/ pages.
    var link = document.createElement('a');
    link.href = '/privacy.html';
    link.textContent = 'Read our Privacy Policy';
    copy.appendChild(link);
    copy.appendChild(document.createTextNode('.'));

    var actions = document.createElement('div');
    actions.className = 'cookie-actions';

    var accept = document.createElement('button');
    accept.type = 'button';
    accept.className = 'btn btn-gold btn-sm';
    accept.textContent = 'Accept';

    var decline = document.createElement('button');
    decline.type = 'button';
    decline.className = 'btn btn-outline-light btn-sm';
    decline.textContent = 'Decline';

    accept.addEventListener('click', function () { choose(ACCEPTED); });
    decline.addEventListener('click', function () { choose(DECLINED); });

    actions.appendChild(accept);
    actions.appendChild(decline);
    inner.appendChild(copy);
    inner.appendChild(actions);
    el.appendChild(inner);

    return el;
  }

  function show() {
    if (banner) return;
    banner = build();
    document.body.appendChild(banner);
    // Next frame, so the entry transition has a start state to move from.
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () { banner.classList.add('is-in'); });
    });
  }

  function hide() {
    if (!banner) return;
    var el = banner;
    banner = null;
    el.classList.remove('is-in');
    // Match the CSS transition; the timeout is the fallback for when the
    // transition never fires (reduced motion, background tab).
    var done = false;
    var remove = function () {
      if (done) return;
      done = true;
      if (el.parentNode) el.parentNode.removeChild(el);
    };
    el.addEventListener('transitionend', remove);
    window.setTimeout(remove, 500);
  }

  function choose(value) {
    write(value);
    if (value === ACCEPTED) loadAnalytics();
    hide();
  }

  /* ----------------------------------------------------------------------
     Start
     ---------------------------------------------------------------------- */
  var choice = read();

  // A returning visitor who accepted gets analytics immediately — no need to
  // wait for the DOM, and no second banner.
  if (choice === ACCEPTED) loadAnalytics();

  function start() {
    // Let anyone revisit the decision from the footer link.
    var settings = document.querySelectorAll('[data-cookie-settings]');
    Array.prototype.forEach.call(settings, function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        show();
      });
    });

    if (choice !== ACCEPTED && choice !== DECLINED) show();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
