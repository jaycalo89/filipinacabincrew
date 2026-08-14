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
tools/build.py          Regenerates both .min files
tools/make-icons.py     Regenerates favicons + og-image.jpg from images/fcc-logo.png
package.json            Pins the JS minifier (terser) used by tools/build.py

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

CSS is minified in-process by that script. JS is minified by
[terser](https://terser.org), pinned in `package.json`. The build finds it in
`node_modules`, then on `PATH`, then falls back to `npx --yes terser@<pinned>`,
which fetches it on first use — so a fresh clone can build without an install
step as long as `node` and `npx` are present. If none of those work the build
stops with an error rather than quietly substituting a different minifier.

**Then bump the cache-busting version.** Every page references the built files
as `style.min.css?v=YYYYMMDD` and `main.min.js?v=YYYYMMDD`. If the contents
change but the `?v=` value does not, anyone who has already visited keeps the
old file from their browser cache and never sees the change:

```bash
# from the repo root, replacing the old value with a new one
sed -i 's/?v=20260814c"/?v=20260815"/g' *.html career-tips/*.html
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

## Before going live — the short checklist

1. **Form endpoints — live.** All three keys in `ENDPOINTS` (`newsletter`,
   `mentorship`, `contact`) post to the same Formspree form. Because they share one
   endpoint, each submission also carries `_subject` — Formspree's reserved field for
   the notification subject line — so a bare newsletter signup can still be told apart
   from a mentorship application in the inbox. To move a form elsewhere, change its
   entry and rebuild. Blank an entry and that form falls back to composing a message to
   `filipinacabincrew@outlook.com` in the visitor's own mail client, which reaches the
   inbox but needs them to press send.
2. **Social links — live.** Facebook, TikTok, Instagram and YouTube are wired into the
   footer icon row, the footer "Connect" column and the `#follow` section of
   `community.html` on every page, all opening in a new tab. They are also declared in
   the `sameAs` block of the Organization schema on `index.html`. If a handle changes,
   update it in all three places plus that schema.
3. **Analytics — live.** Google Analytics 4 (`G-GYLEWQT3B9`) is installed and firing on
   all twelve pages. Note that it sets cookies on arrival, before the visitor has agreed
   to anything: for EU/UK visitors that needs a consent banner gating the gtag snippet,
   which this site does not yet have. The cookies section of `privacy.html` names Google
   and links their opt-out.
4. **Hiring listings.** The eight listings on `hiring-updates.html` and the three on the
   homepage are examples of the format, written from publicly known requirements. Replace
   them with your own verified updates before launch — and keep the note that the site is
   not a recruiter, which is what keeps visitors safe from placement-fee scams.
5. **Legal pages.** `privacy.html` and `terms.html` are written to match the site exactly
   as built. Add your governing jurisdiction to the final section of `terms.html` and
   have both reviewed locally.
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

Upload the whole directory to any static host (Netlify, Cloudflare Pages, GitHub Pages,
Vercel, or plain nginx/Apache). No server-side runtime is needed. Point the host's
404 handler at `404.html`, and serve everything over HTTPS.
