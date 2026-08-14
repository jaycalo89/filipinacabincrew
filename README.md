# Filipina Cabin Crew

**Where Aviation Connects Us** — an independent aviation community platform for current
and aspiring cabin crew of all nationalities. Established 2016.

Pure static HTML, CSS and JavaScript. No frameworks, no build step required to view the
site, no third-party requests at runtime.

---

## Structure

```
index.html              Homepage — hero, stats, hiring, guides, mentorship, community
hiring-updates.html     Filterable, paginated listings with an alerts sidebar
career-tips.html        Featured guide, filterable guide grid, seven full guides in page
mentorship.html         How it works, benefits, application form, FAQ
about.html              Story, mission, independence statement, photography credits
community.html          Newsletter, social channels, house rules, contact form
privacy.html            Privacy policy
terms.html              Terms of use
404.html                Not-found page

css/style.css           Source stylesheet (edit this one)
css/style.min.css       Minified build output — referenced by every page
js/main.js              Source script (edit this one)
js/main.min.js          Minified build output — referenced by every page
tools/build.py          Regenerates both .min files
tools/make-icons.py     Regenerates favicons + og-image.jpg from images/fcc-logo.png

fonts/                  Self-hosted Inter + Oswald (variable, woff2, subset)
images/                 Logo, hero and card imagery in JPEG + WebP at two or three widths
og-image.jpg            1200x630 social sharing card
favicon.ico, favicon-16x16.png, favicon-32x32.png, apple-touch-icon.png
site.webmanifest, robots.txt, sitemap.xml
```

## Editing

After changing `css/style.css` or `js/main.js`, rebuild the minified files:

```bash
python tools/build.py
```

If you replace `images/fcc-logo.png`, regenerate everything derived from it:

```bash
python tools/make-icons.py
```

That rewrites the favicons, the apple-touch icon, the PWA icon and `og-image.jpg`.
The logo's own `width`/`height` attributes in the HTML must then match the new
file's pixel dimensions (they are currently `627x625`) — CSS sizes the mark by
height, so those attributes exist purely to reserve the right box and prevent
layout shift.

The pages load the `.min` versions with a `?v=` cache-busting query. Bump that value
(a find-and-replace for `v=20260813` across the HTML files) whenever you deploy changed
CSS or JS so returning visitors are not served a stale cached copy.

## Before going live — the short checklist

1. **Form endpoints.** Open `js/main.js` and fill in `ENDPOINTS.newsletter` and
   `ENDPOINTS.mentorship` with the POST URL of your mail or form provider (Mailchimp,
   ConvertKit, Formspree, Netlify Forms, a serverless function — anything that accepts a
   `POST` of form data). Until a value is set, that form refuses to submit and tells the
   visitor it is not live yet rather than faking a confirmation. Rebuild afterwards.
2. **Social links.** In `community.html`, replace the four `href="#"` values in the
   `#follow` section with your real profile URLs, and do the same for the footer social
   icons across the pages.
3. **Analytics.** Every page carries a commented-out Google Analytics 4 snippet. Replace
   `G-XXXXXXXXXX` with your measurement ID and uncomment it to enable.
4. **Hiring listings.** The eight listings on `hiring-updates.html` and the three on the
   homepage are examples of the format, written from publicly known requirements. Replace
   them with your own verified updates before launch — and keep the note that the site is
   not a recruiter, which is what keeps visitors safe from placement-fee scams.
5. **Legal pages.** `privacy.html` and `terms.html` are written to match the site exactly
   as built. Each contains an HTML comment listing what to confirm; add your jurisdiction
   and have them reviewed locally.
6. **Search.** The header search posts to Google scoped to the site domain. It only
   returns results once the site is indexed.

## Design system

| Token | Value | Used for |
| --- | --- | --- |
| Navy | `#1B2A6B` | Headers, authority, dark panels |
| Deep navy | `#111C4C` | Footer, hero scrim |
| Medium blue | `#4A6FA5` | Secondary text, icons |
| Light blue | `#A8C4E0` | Rules, bullets, quiet accents |
| Gold | `#D4A017` | Accents, CTAs, highlights |
| Light grey | `#F8F9FA` | Alternating section backgrounds |

Display type is Oswald (uppercase, condensed); body copy is Inter. Both are self-hosted
variable fonts loaded with `font-display: optional`, so text never flashes invisible and
never reflows.

## Performance notes

- Fonts and all assets are same-origin; the pages make no third-party requests.
- The homepage hero is preloaded in the head as WebP with a JPEG fallback; every other
  image is `loading="lazy"` with explicit `width`/`height` to keep layout shift at zero.
- Photography is served as WebP with JPEG fallbacks at two or three widths via
  `<picture>` + `srcset`; total image weight for the site is under 3 MB.
- CSS and JS are minified by `tools/build.py`.

## Accessibility

Skip link, visible focus rings, semantic landmarks, `aria-current` on the active nav
item, labelled form fields, live regions on form status messages, keyboard-operable
mobile menu (Escape closes, focus returns to the toggle), and full
`prefers-reduced-motion` support.

## Photography

All photographs come from Wikimedia Commons and are used under CC0, CC BY or CC BY-SA
licences. Full per-image attribution is published on `about.html`; keep that section in
place if you keep the images.

## Deployment

Upload the whole directory to any static host (Netlify, Cloudflare Pages, GitHub Pages,
Vercel, or plain nginx/Apache). No server-side runtime is needed. Point the host's
404 handler at `404.html`, and serve everything over HTTPS.
