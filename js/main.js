/* ==========================================================================
   Filipina Cabin Crew — shared front-end behaviour
   No frameworks, no dependencies. Everything below degrades gracefully:
   with JavaScript off the pages still read, navigate and submit.
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------------
     FORM ENDPOINTS — set these once the site has a form backend.

     Paste the POST URL of whichever service handles the mail (Mailchimp,
     ConvertKit, Formspree, Netlify Forms, a serverless function...). A
     configured endpoint is always preferred: it is the only route that works
     for a visitor with no mail client set up, and the only one that can store
     a signup rather than mail it.

     While a value is empty the matching form falls back to composing a message
     to CONTACT_EMAIL in the visitor's own mail client. That genuinely reaches
     the inbox on a static host with no backend, but it needs the visitor to
     press send, so it is a stopgap rather than the finished article.

     All three currently post to the same Formspree form, so newsletter
     signups, mentorship applications and contact messages land in one inbox.
     The `subject` field posted alongside them (see SUBJECTS) is what tells
     them apart.
     ---------------------------------------------------------------------- */
  var ENDPOINTS = {
    newsletter: 'https://formspree.io/f/mzepvoev',
    mentorship: 'https://formspree.io/f/mzepvoev',
    contact: 'https://formspree.io/f/mzepvoev'
  };

  var CONTACT_EMAIL = 'filipinacabincrew@outlook.com';

  var SUBJECTS = {
    newsletter: 'Newsletter signup',
    mentorship: 'Mentorship application',
    contact: 'Website enquiry'
  };

  /* What the visitor is told on success. A contact message is not an
     application and should not be confirmed as one. */
  var MESSAGES = {
    newsletter: 'You are on the list — welcome aboard.',
    mentorship: 'Thank you — your application has been sent. We will be in touch by email.',
    contact: 'Thank you — your message has been sent. We will reply by email.'
  };

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('DOMContentLoaded', function () {
    initHeader();
    initMobileNav();
    initSearch();
    initSmoothAnchors();
    initReveal();
    initToTop();
    initCollections();
    initForms();
    initYear();
  });

  /* ======================================================================
     Header: drop a shadow once the page has moved off the top.
     rAF-throttled so the scroll handler never runs more than once a frame.
     ====================================================================== */
  function initHeader() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    var ticking = false;

    function update() {
      header.classList.toggle('is-scrolled', window.pageYOffset > 8);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  /* ======================================================================
     Mobile navigation: a panel that slides in from the right.
     Closes on link click, on the scrim, on the close button and on Escape;
     focus moves into the panel and returns to the toggle afterwards.
     ====================================================================== */
  function initMobileNav() {
    var toggle = document.querySelector('.nav-toggle');
    var panel = document.querySelector('.mobile-panel');
    if (!toggle || !panel) return;

    var scrim = document.querySelector('.nav-scrim');
    var closeBtn = panel.querySelector('.mobile-close');

    function open() {
      document.body.classList.add('nav-open');
      toggle.setAttribute('aria-expanded', 'true');
      panel.removeAttribute('aria-hidden');
      var first = panel.querySelector('a, button');
      if (first) first.focus();
    }
    function close(returnFocus) {
      document.body.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
      panel.setAttribute('aria-hidden', 'true');
      if (returnFocus) toggle.focus();
    }

    toggle.addEventListener('click', function () {
      if (document.body.classList.contains('nav-open')) close(true); else open();
    });
    if (closeBtn) closeBtn.addEventListener('click', function () { close(true); });
    if (scrim) scrim.addEventListener('click', function () { close(false); });

    panel.addEventListener('click', function (e) {
      if (e.target.closest('a')) close(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('nav-open')) close(true);
    });

    // Leaving the mobile breakpoint with the panel open would otherwise strand
    // `overflow:hidden` on the body.
    if (window.matchMedia) {
      var wide = window.matchMedia('(min-width: 1040px)');
      var onChange = function (e) { if (e.matches) close(false); };
      if (wide.addEventListener) wide.addEventListener('change', onChange);
      else if (wide.addListener) wide.addListener(onChange);
    }
  }

  /* ======================================================================
     Search drawer under the header.
     ====================================================================== */
  function initSearch() {
    var btn = document.querySelector('.nav-search-toggle');
    var drawer = document.querySelector('.nav-search');
    if (!btn || !drawer) return;

    btn.addEventListener('click', function () {
      var open = drawer.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        var input = drawer.querySelector('input');
        if (input) input.focus();
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
        drawer.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
        btn.focus();
      }
    });
  }

  /* ======================================================================
     Smooth scrolling for real clicks on same-page anchors.

     Done here rather than with `html{scroll-behavior:smooth}` so that only
     user-initiated jumps animate — programmatic scrolls stay instant.
     ====================================================================== */
  function initSmoothAnchors() {
    document.addEventListener('click', function (e) {
      var link = e.target.closest && e.target.closest('a[href^="#"]');
      if (!link) return;

      var hash = link.getAttribute('href');
      if (!hash || hash === '#' || link.target === '_blank') return;

      var target;
      try { target = document.querySelector(hash); } catch (err) { return; }
      if (!target) return;                       // let the browser handle it

      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });

      if (history.replaceState) history.replaceState(null, '', hash);
      else location.hash = hash;

      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  }

  /* ======================================================================
     Reveal-on-scroll. Elements start hidden only when the observer is
     available and motion is allowed, so nothing can get stuck invisible.
     ====================================================================== */
  function initReveal() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    if (!('IntersectionObserver' in window) || reduceMotion) {
      Array.prototype.forEach.call(items, function (el) { el.classList.add('is-visible'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    Array.prototype.forEach.call(items, function (el) { io.observe(el); });
  }

  /* ======================================================================
     Back-to-top button.
     ====================================================================== */
  function initToTop() {
    var btn = document.querySelector('.to-top');
    if (!btn) return;
    var ticking = false;

    function update() {
      btn.classList.toggle('is-visible', window.pageYOffset > 700);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
    update();
  }

  /* ======================================================================
     Collections: category filtering plus pagination over a card grid.
     Used by the hiring updates and career guide listings.

     Markup contract:
       <div class="filter-bar" data-filter-group="jobs">
         <button data-filter="all">…</button>
       <p data-filter-count="jobs"></p>
       <div data-collection="jobs" data-page-size="6" data-noun="listing">
         <article data-category="asia-pacific">…</article>
       <ul class="pagination" data-pagination="jobs"></ul>

     A card may carry several space-separated categories. With JavaScript off
     every card simply stays visible and no pager is drawn — the page still
     works, it just shows the full list at once.
     ====================================================================== */
  function initCollections() {
    var groups = document.querySelectorAll('[data-collection]');
    if (!groups.length) return;

    Array.prototype.forEach.call(groups, function (container) {
      var name = container.getAttribute('data-collection');
      var pageSize = parseInt(container.getAttribute('data-page-size'), 10) || 0;
      var noun = container.getAttribute('data-noun') || 'result';
      var cards = Array.prototype.slice.call(container.querySelectorAll('[data-category]'));
      var bar = document.querySelector('[data-filter-group="' + name + '"]');
      var counter = document.querySelector('[data-filter-count="' + name + '"]');
      var pager = document.querySelector('[data-pagination="' + name + '"]');

      // Optional controls. A collection that has none of these behaves exactly
      // as it did before — the guide grid on career-tips.html relies on that.
      var searchInput = document.querySelector('[data-collection-search="' + name + '"]');
      var regionSelect = document.querySelector('[data-collection-region="' + name + '"]');
      var sortSelect = document.querySelector('[data-collection-sort="' + name + '"]');
      var totalEl = document.querySelector('[data-collection-total="' + name + '"]');
      var emptyEl = document.querySelector('[data-collection-empty="' + name + '"]');
      var resetEls = document.querySelectorAll('[data-collection-reset="' + name + '"]');

      var filter = 'all';
      var region = 'all';
      var query = '';
      var sort = sortSelect ? sortSelect.value : '';
      var page = 1;

      // Document order is the baseline, and the tiebreaker for every sort, so
      // that equal keys never shuffle between renders.
      cards.forEach(function (card, i) { card._order = i; });

      var RECENT_DAYS = 30;
      var STATUS_RANK = { 'hiring-now': 0, 'closing-soon': 1, 'opening-soon': 2 };

      function postedTime(card) {
        var raw = card.getAttribute('data-posted');
        if (!raw) return NaN;
        var t = Date.parse(raw);
        return isNaN(t) ? NaN : t;
      }

      function isRecent(card) {
        var t = postedTime(card);
        if (isNaN(t)) return false;
        return (Date.now() - t) <= RECENT_DAYS * 24 * 60 * 60 * 1000;
      }

      function inRegion(card) {
        if (region === 'all') return true;
        var cats = (card.getAttribute('data-category') || '').split(/\s+/);
        return cats.indexOf(region) !== -1;
      }

      /* One filter value covers three cases so the same bar can drive both
         collections: "recent" is computed, otherwise the value is matched
         against the card's status (hiring listings) or its category (guides). */
      function inFilter(card) {
        if (filter === 'all') return true;
        if (filter === 'recent') return isRecent(card);
        if ((card.getAttribute('data-status') || '') === filter) return true;
        var cats = (card.getAttribute('data-category') || '').split(/\s+/);
        return cats.indexOf(filter) !== -1;
      }

      function inQuery(card) {
        if (!query) return true;
        var hay = (card.getAttribute('data-search') || '').toLowerCase();
        // Every word must appear, so "korean seoul" narrows rather than widens.
        var words = query.split(/\s+/);
        for (var i = 0; i < words.length; i++) {
          if (words[i] && hay.indexOf(words[i]) === -1) return false;
        }
        return true;
      }

      function matches(card) {
        return inRegion(card) && inFilter(card) && inQuery(card);
      }

      function text(card, attr) {
        return (card.getAttribute(attr) || '').toLowerCase();
      }

      function comparator() {
        if (sort === 'airline') {
          return function (a, b) {
            return text(a, 'data-airline').localeCompare(text(b, 'data-airline')) ||
                   a._order - b._order;
          };
        }
        if (sort === 'region') {
          return function (a, b) {
            return text(a, 'data-region').localeCompare(text(b, 'data-region')) ||
                   text(a, 'data-airline').localeCompare(text(b, 'data-airline')) ||
                   a._order - b._order;
          };
        }
        if (sort === 'status') {
          return function (a, b) {
            var ra = STATUS_RANK[a.getAttribute('data-status')];
            var rb = STATUS_RANK[b.getAttribute('data-status')];
            if (ra === undefined) ra = 99;
            if (rb === undefined) rb = 99;
            return ra - rb ||
                   text(a, 'data-airline').localeCompare(text(b, 'data-airline')) ||
                   a._order - b._order;
          };
        }
        if (sort === 'newest') {
          return function (a, b) {
            var ta = postedTime(a), tb = postedTime(b);
            if (isNaN(ta)) ta = -Infinity;
            if (isNaN(tb)) tb = -Infinity;
            return (tb - ta) || a._order - b._order;
          };
        }
        return null;   // no sort control: leave the authored order alone
      }

      /* Sorting moves the real nodes rather than re-rendering them, so the
         cards keep their event listeners and the DOM stays the source of
         truth for pagination. */
      function applySort() {
        var cmp = comparator();
        if (!cmp) return cards;
        var ordered = cards.slice().sort(cmp);
        var changed = ordered.some(function (card, i) { return container.children[i] !== card; });
        if (changed) {
          var frag = document.createDocumentFragment();
          ordered.forEach(function (card) { frag.appendChild(card); });
          container.appendChild(frag);
        }
        return ordered;
      }

      function regionLabel() {
        if (!regionSelect) return '';
        var opt = regionSelect.options[regionSelect.selectedIndex];
        return opt ? opt.textContent : '';
      }

      function describeTotal(n) {
        var isFiltered = filter !== 'all' || !!query;
        if (region !== 'all') {
          return n + (n === 1 ? ' position in ' : ' positions in ') + regionLabel();
        }
        if (isFiltered) {
          return n === 1 ? '1 position matches' : n + ' positions match';
        }
        return n === 1 ? '1 open position worldwide' : n + ' open positions worldwide';
      }

      function render() {
        var ordered = applySort();
        var visible = ordered.filter(matches);
        var pages = pageSize ? Math.max(1, Math.ceil(visible.length / pageSize)) : 1;
        if (page > pages) page = pages;
        if (page < 1) page = 1;
        var start = pageSize ? (page - 1) * pageSize : 0;
        var end = pageSize ? start + pageSize : visible.length;

        cards.forEach(function (card) {
          var idx = visible.indexOf(card);
          card.classList.toggle('is-hidden', idx === -1 || idx < start || idx >= end);
        });

        if (counter) {
          var plural = visible.length === 1 ? noun : noun + 's';
          if (!visible.length) {
            counter.textContent = 'No ' + noun + 's to show';
          } else if (pages > 1) {
            counter.textContent = 'Showing ' + (start + 1) + '–' + Math.min(end, visible.length) +
              ' of ' + visible.length + ' ' + plural;
          } else {
            counter.textContent = 'Showing all ' + visible.length + ' ' + plural;
          }
        }

        if (totalEl) totalEl.textContent = describeTotal(visible.length);

        if (emptyEl) {
          if (visible.length) emptyEl.setAttribute('hidden', '');
          else emptyEl.removeAttribute('hidden');
        }

        if (bar) {
          Array.prototype.forEach.call(bar.querySelectorAll('[data-filter]'), function (b) {
            var on = b.getAttribute('data-filter') === filter;
            b.classList.toggle('is-active', on);
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
          });
        }

        if (pager) drawPager(pages, visible.length);
      }

      /* Page numbers are windowed: first, last, and the pages either side of
         the current one, with gaps elided. At six per listing page a hundred
         listings would otherwise print seventeen numbered links. */
      function pageWindow(pages) {
        var span = 1;
        var wanted = {};
        wanted[1] = true;
        wanted[pages] = true;
        for (var p = page - span; p <= page + span; p++) {
          if (p >= 1 && p <= pages) wanted[p] = true;
        }
        var list = Object.keys(wanted).map(Number).sort(function (a, b) { return a - b; });

        var out = [];
        var prev = 0;
        list.forEach(function (p) {
          if (prev && p - prev > 1) out.push(null);   // null renders as an ellipsis
          out.push(p);
          prev = p;
        });
        return out;
      }

      function drawPager(pages, visibleCount) {
        pager.innerHTML = '';
        if (!visibleCount || pages < 2) return;

        pager.appendChild(step('Prev', page - 1, page === 1));
        pageWindow(pages).forEach(function (p) {
          if (p === null) {
            var li = document.createElement('li');
            var gap = document.createElement('span');
            gap.className = 'is-gap';
            gap.textContent = '…';
            gap.setAttribute('aria-hidden', 'true');
            li.appendChild(gap);
            pager.appendChild(li);
            return;
          }
          pager.appendChild(step(String(p), p, false, p === page));
        });
        pager.appendChild(step('Next', page + 1, page === pages));
      }

      function step(label, target, disabled, current) {
        var li = document.createElement('li');
        var el = document.createElement(disabled || current ? 'span' : 'a');
        el.textContent = label;
        if (disabled) {
          el.className = 'is-disabled';
          el.setAttribute('aria-disabled', 'true');
        } else if (current) {
          el.className = 'is-current';
          el.setAttribute('aria-current', 'page');
        } else {
          el.href = '#' + name;
          el.addEventListener('click', function (e) {
            e.preventDefault();
            page = target;
            render();
            scrollToTop();
          });
        }
        li.appendChild(el);
        return li;
      }

      function scrollToTop() {
        var anchor = document.getElementById(name) || container;
        anchor.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      }

      if (bar) {
        bar.addEventListener('click', function (e) {
          var btn = e.target.closest('[data-filter]');
          if (!btn) return;
          filter = btn.getAttribute('data-filter');
          page = 1;
          render();
        });
      }

      if (regionSelect) {
        regionSelect.addEventListener('change', function () {
          region = regionSelect.value;
          page = 1;
          render();
        });
      }

      if (sortSelect) {
        sortSelect.addEventListener('change', function () {
          sort = sortSelect.value;
          page = 1;
          render();
        });
      }

      if (searchInput) {
        // Typing filters as you go. The work is a substring test per card, so
        // it stays cheap well past the hundred-listing mark; the small debounce
        // is there to keep the aria-live count from being read out per letter.
        var typingTimer = null;
        var onType = function () {
          var next = searchInput.value.trim().toLowerCase();
          if (next === query) return;
          query = next;
          page = 1;
          render();
        };
        searchInput.addEventListener('input', function () {
          if (typingTimer) clearTimeout(typingTimer);
          typingTimer = setTimeout(onType, 120);
        });
        // A search input's clear button fires "search", not "input", in Safari.
        searchInput.addEventListener('search', onType);
        searchInput.addEventListener('keydown', function (e) {
          if (e.key === 'Escape' && searchInput.value) {
            searchInput.value = '';
            onType();
          }
        });
      }

      Array.prototype.forEach.call(resetEls, function (el) {
        el.addEventListener('click', function () {
          filter = 'all';
          region = 'all';
          query = '';
          if (searchInput) searchInput.value = '';
          if (regionSelect) regionSelect.value = 'all';
          page = 1;
          render();
          if (searchInput) searchInput.focus();
        });
      });

      render();
    });
  }

  /* ======================================================================
     Forms.

     Every form carrying data-form="<key>" is intercepted. If the matching
     endpoint above is still empty we say so plainly instead of faking a
     confirmation — a signup nobody stored is not a signup.
     ====================================================================== */
  function initForms() {
    var forms = document.querySelectorAll('form[data-form]');
    if (!forms.length) return;

    Array.prototype.forEach.call(forms, function (form) {
      var key = form.getAttribute('data-form');
      // The status line lives inside the form on the longer forms and as a
      // sibling under the newsletter cards, so look in both places before
      // falling back to an explicitly targeted element.
      var status = form.querySelector('.form-status') ||
                   (form.parentElement && form.parentElement.querySelector('.form-status')) ||
                   document.querySelector('[data-status-for="' + key + '"]');

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!form.checkValidity()) { form.reportValidity(); return; }

        var endpoint = ENDPOINTS[key];
        if (!endpoint) {
          mailtoFallback(form, key, status);
          return;
        }

        var btn = form.querySelector('button[type="submit"], .btn');
        var label = btn ? btn.textContent : '';
        if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
        say(status, '', 'Sending…');

        // All three form types post to the same Formspree form, and a
        // newsletter signup carries nothing but an address — so without this
        // the inbox cannot tell a signup from an application. _subject is
        // Formspree's reserved field for the notification subject line.
        var payload = new FormData(form);
        payload.append('_subject', SUBJECTS[key] || 'Website enquiry');

        fetch(endpoint, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: payload
        }).then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          form.reset();
          say(status, 'ok', MESSAGES[key] || MESSAGES.contact);
        }).catch(function () {
          say(status, 'err', 'Something went wrong. Please try again in a moment.');
        }).then(function () {
          if (btn) { btn.disabled = false; btn.textContent = label; }
        });
      });
    });

    /* No backend configured: hand the filled-in answers to the visitor's mail
       client addressed to CONTACT_EMAIL. The form is not cleared — if the
       handover fails, or they close the draft, nothing they typed is lost. */
    function mailtoFallback(form, key, status) {
      var data = new FormData(form);
      var lines = [];
      data.forEach(function (value, name) {
        if (name === 'consent') { value = 'yes'; }
        if (!String(value).trim()) return;
        var label = name.charAt(0).toUpperCase() + name.slice(1);
        lines.push(label + ': ' + value);
      });

      var href = 'mailto:' + CONTACT_EMAIL +
        '?subject=' + encodeURIComponent(SUBJECTS[key] || 'Website enquiry') +
        '&body=' + encodeURIComponent(lines.join('\n'));

      // Over-long mailto URLs are silently dropped by some clients, so keep the
      // draft short enough to survive the handover.
      if (href.length > 1800) { href = href.slice(0, 1800); }

      say(status, '', 'Opening your email app…');
      window.location.href = href;

      window.setTimeout(function () {
        say(status, 'ok', 'Your email app should have opened with the message ready — ' +
          'press send to reach us. If nothing happened, email ' + CONTACT_EMAIL + ' directly.');
      }, 900);

      if (window.console) {
        console.warn('[FCC] No endpoint configured for form "' + key +
                     '" — used the mailto fallback. Set ENDPOINTS.' + key +
                     ' in js/main.js for a proper backend.');
      }
    }

    function say(el, kind, message) {
      if (!el) return;
      el.textContent = message;
      el.className = 'form-status' + (kind ? ' is-' + kind : '');
    }
  }

  /* ======================================================================
     Keep the footer copyright range current without a rebuild.
     ====================================================================== */
  function initYear() {
    var els = document.querySelectorAll('[data-year]');
    var year = new Date().getFullYear();
    Array.prototype.forEach.call(els, function (el) { el.textContent = year; });
  }
})();
