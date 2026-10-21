# Filipina Cabin Crew

**Live site:** [filipinacabincrew.com](https://filipinacabincrew.com)

**Where Aviation Connects Us** is an independent aviation community platform for current
and aspiring cabin crew of all nationalities, established 2016. This repo is the full
rebuild of the site, which I designed, built and maintain.

## Highlights

- **13 pages**: homepage, filterable and paginated hiring updates, career guides,
  mentorship applications, community hub, and legal pages
- **Hand-rolled build tooling** in Python: a string-aware CSS minifier plus pinned
  terser for JS, with cache-busting versions on every asset
- **Privacy by design**: Google Analytics loads only after the visitor accepts the
  cookie notice, and fonts and images are self-hosted
- **Performance**: responsive WebP/JPEG images via `<picture>` and `srcset`, explicit
  dimensions for zero layout shift, preloaded hero, `font-display: optional`
- **Accessibility**: skip link, visible focus, semantic landmarks, labelled forms with
  live status regions, keyboard-operable menu, `prefers-reduced-motion` support
- **SEO**: Organization schema, sitemap, robots.txt, Open Graph card, web manifest
- **Forms** through Formspree and a beehiiv newsletter embed, with no backend to run

## Stack

Static HTML, CSS and vanilla JavaScript; Python build scripts; GitHub Pages with a
custom domain. Built with AI-assisted development (Claude Code) on Ubuntu/WSL. I
directed the architecture, reviewed and tested the output, and handle content,
deployment and ongoing fixes.

---

## Structure

```
index.html              Homepage — hero, stats, hiring, guides, mentorship, community
hiring-updates.html     Filterable, paginated listings with an alerts sidebar
career-tips.html        Featured guide, filterable guide grid, five guides inline
career-tips/            Standalone long-form guides (one page each)
  open-day-guide.html     How To Ace A Cabin Crew Open Day
  grooming-standards.html Cabin Crew Grooming and Presentation Standards
  after-interview.html    What Happens After Your Cabin Crew Interview
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
js/cookie-consent.js    Consent banner; injects GA4 only after the visitor accepts
js/cookie-consent.min.js Minified build output — referenced by every page
tools/build.py          Regenerates all three .min files
tools/make-icons.py     Regenerates favicons + og-image.jpg from images/fcc-logo.png
package.json            Pins the JS minifier (terser) used by tools/build.py

fonts/                  Self-hosted Inter + Oswald (variable, woff2, subset)
images/                 Logo, hero and card imagery in JPEG + WebP at two or three widths
og-image.jpg            1200x630 social sharing card
favicon.ico, favicon-16x16.png, favicon-32x32.png, apple-touch-icon.png
site.webmanifest, robots.txt, sitemap.xml
```

## Editing

After changing `css/style.css`, `js/main.js` or `js/cookie-consent.js`, rebuild the
minified files:

```bash
python tools/build.py
```

CSS is minified in-process by that script. JS is minified by
[terser](https://terser.org), pinned in `package.json`. The build finds it in
`node_modules`, then on `PATH`, then falls back to `npx --yes terser@<pinned>`,
which fetches it on first use — so a fresh clone can build without an install
step as long as `node` and `npx` are present. If none of those work the build
stops with an error rather than quietly substituting a different minifier.

**Then bump the cache-busting version.** Every page references the built files
as `style.min.css?v=YYYYMMDD`, `main.min.js?v=YYYYMMDD` and
`cookie-consent.min.js?v=YYYYMMDD`. If the contents
change but the `?v=` value does not, anyone who has already visited keeps the
old file from their browser cache and never sees the change:

```bash
# from the repo root, replacing the old value with a new one
sed -i 's/?v=20260815b"/?v=20260816"/g' *.html career-tips/*.html
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

## Configuration

1. **Forms.** The mentorship and contact forms post to one Formspree form, set in
   `ENDPOINTS` in `js/main.js`. Each submission carries `_subject` (Formspree's
   reserved subject-line field) so messages can be told apart in the inbox. Blank an
   entry and that form falls back to composing an email to
   `filipinacabincrew@outlook.com` in the visitor's mail client. Rebuild after changes.
2. **Newsletter.** Signups use a beehiiv embed on `index.html` and `community.html`.
3. **Social links.** Facebook, TikTok, Instagram and YouTube appear in the footer icon
   row, the footer "Connect" column, the `#follow` section of `community.html`, and the
   `sameAs` block of the Organization schema on `index.html`. Update all four if a
   handle changes.
4. **Analytics, behind consent.** Google Analytics 4 is *not* in the markup.
   `js/cookie-consent.js` injects it only after the visitor accepts. Decline and the
   script is never requested. The choice is stored in `localStorage` under
   `fcc-cookie-consent` and can be changed from the Cookie Settings link in every
   footer. Load any future third-party tag from the same place so it can't fire
   before consent.
5. **Hiring listings** are maintained by hand. Keep the note that the site is not a
   recruiter; it protects visitors from placement-fee scams.
6. **Search.** The header search posts to Google, scoped to the site domain.

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

- Fonts, images, CSS and JS are all same-origin. The third-party requests are the
  beehiiv newsletter embed (on the two pages that show it) and Google Analytics, which
  is only requested after the visitor accepts the cookie notice.
- The homepage hero is preloaded in the head as WebP with a JPEG fallback; every other
  image is `loading="lazy"` with explicit `width`/`height` to keep layout shift at zero.
- Photography is served as WebP with JPEG fallbacks at two or three widths via
  `<picture>` + `srcset`; total image weight for the site is under 3 MB.
- CSS is minified by `tools/build.py`; JS is minified by terser (see Editing).

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

Hosted on GitHub Pages with the custom domain set in `CNAME`. Every push to `main`
publishes. GitHub Pages serves `404.html` for missing pages automatically. The site
also runs unchanged on any static host (Netlify, Cloudflare Pages, nginx, Apache).
