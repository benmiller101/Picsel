# Picsel site audit, 20 August 2026

A full pass over the site: what it ships, what search engines see, what a
visitor actually reads, and what is left in the repo that nothing uses.

Everything below was measured against the current `work-ring` branch, built
locally and viewed at 1440px in Chrome. Where a number appears, it came from a
command, not an estimate.

The short version: the build is disciplined, the security posture is thought
through, and the SEO groundwork is better than most agency sites. Three things
are hurting it. The site ships 106 KB of gzipped text per page and roughly 60%
of that is source comments. The fixed nav pill covers copy on every long page.
And the homepage spends two full screens before it says what Picsel sells.

---

## 1. Speed and payload

### Nothing is minified, and the comments are enormous

The comments in this codebase are unusually good. They explain decisions rather
than restating the code. They should stay in the source. They should not be
downloaded by a plumber on a 4G connection.

Measured on the homepage, counting every same-origin CSS and JS file it loads:

| | raw | gzipped |
|---|---|---|
| as shipped today | 300 KB | 106 KB |
| with comments stripped | 138 KB | 42 KB |

That is 64 KB off the wire per page, and it is the single largest win available.
Per-file comment share:

| file | size | comments |
|---|---|---|
| `tokens.css` | 15.6 KB | 85% |
| `base.css` | 15.7 KB | 73% |
| `site.css` | 57.3 KB | 67% |
| `hero.js` | 81.6 KB | 63% |
| `page-blob.js` | 27.5 KB | 59% |

The built HTML has the same problem: 185 KB of HTML comments across 28 pages,
27% of the total.

There is no minification step anywhere. `tools/build.js` writes the templates
out verbatim.

### The critical path waits on two font providers

Every page opens six same-origin stylesheets plus two third-party ones: Adobe
Typekit for the wordmark faces and Google Fonts for Lexend and Pixelify Sans.
Both block rendering. The homepage's LCP is the wordmark, so the measured load
time waits on the Typekit stylesheet, the second sheet it imports from
`p.typekit.net`, and then the font file.

The preconnects are already there and correctly reasoned. They reduce the cost
of the round trip; they do not remove it.

### `hero.js` is 81 KB for decoration

It is the largest file on the site and it drives a canvas that sits behind the
wordmark. Stripping comments takes it to about 30 KB. Beyond that, it only runs
above the fold on one page, and it could be loaded after first paint rather than
as a module in the head.

---

## 2. SEO

### The sitemap lies about every page, every day

`sitemap.xml` sets `lastmod` from the build date. Run the build with no content
change and all 26 URLs move to today:

```
-    <lastmod>2026-08-19</lastmod>
+    <lastmod>2026-08-20</lastmod>
```

Every URL, every deploy. Google treats a `lastmod` that always says "today" as
noise and stops reading it. Worse, it hides the pages that genuinely did change.

Fix: derive each page's `lastmod` from the last commit that touched its source,
via `git log -1 --format=%cs -- <file>`. Falls back to the build date when git
is unavailable.

### The homepage buries its own pitch

Load `/` and the first screen is the wordmark, "Design Studio", and the word
SCROLL. The second screen is empty dot field. The first sentence a visitor reads
is roughly two viewport heights down.

The `<title>`, meta description and h1 are all correct and well written. Nobody
reads them on the page. For a site whose job is turning a Google click into a
phone call, a full-screen splash before the offer is expensive.

### What is already right

Worth stating plainly, because it is unusual:

- `robots.txt` names 22 AI and search crawlers individually with a
  `Content-Signal` line. Genuinely ahead of the field.
- `llms.txt` is present and current.
- Organization and WebSite schema on all 28 pages, generated rather than typed.
- Exactly one `h1` per page across all 28. No exceptions.
- Alt text on all 69 images. Width and height on 63 of them, so nothing jumps.
- 404 handling returns a real page with a 404 status, not a homepage with a 200.
- No em dashes in any rendered copy, title or meta description. Checked with
  comments and scripts stripped out first.

---

## 3. Security

### No response headers at all

There is no `_headers` file. Cloudflare serves the site with no CSP, no
`X-Content-Type-Options`, no `Referrer-Policy`, no `Permissions-Policy` and no
HSTS. The site loads scripts from `static.cloudflareinsights.com` and stylesheets
from two font CDNs, none of them constrained by anything.

This is the one real gap. It is also a single file to fix.

Proposed `_headers`:

```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self' https://static.cloudflareinsights.com; style-src 'self' https://use.typekit.net https://fonts.googleapis.com; font-src 'self' https://use.typekit.net https://p.typekit.net https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://hq.picsel.co.uk https://api.web3forms.com https://cloudflareinsights.com; form-action https://api.web3forms.com; frame-ancestors 'none'; base-uri 'self'
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=(), interest-cohort=()
```

The homepage carries one inline `<script>` block, so it needs either a hash in
`script-src` or a move into a file. Check that before shipping the CSP, and roll
it out with `Content-Security-Policy-Report-Only` first.

### What is already right

- `.assetsignore` keeps `worker.js`, `functions/`, `tools/`, `site.config.js`,
  `projects.js`, `pricing.js` and every `.md` out of the published assets. The
  reasoning is written down in the file, including why the HQ address in
  `card.js` must never reach a browser.
- The contact form has both a honeypot and a botcheck field.
- No `innerHTML` and no inline event handlers anywhere in shipped JavaScript.
- `card.js` validates the `?b=` batch parameter against `/^v[0-9]{1,3}$/` before
  it becomes a storage key, and filters crawler user agents out of the counts.
- The Web3Forms access key and the Cloudflare beacon token are public
  identifiers by design, and both are documented as such in `site.config.js`.

---

## 4. Design and layout

Findings from a scroll through the homepage at 1440px.

### The nav pill covers the copy underneath it

This is the worst of the design problems because it happens on every page and on
every scroll position. The pill is fixed, centred and opaque, and text passes
behind it.

Caught in the act:

- FAQ: "Do I need to know anything about we\[bsites\]" and "How much does a
  website cost?" both clipped mid-heading.
- Reviews: "We're getting three times \[as many\]" and a review date hidden
  behind the pill.
- The intro paragraph: "get you found on Google and in AI search, and \[keep\]"
  cut mid-sentence.

Three options, in order of preference:

1. Hide the pill on scroll down, show it on scroll up. `nav.js` already tracks
   scroll direction for the entry animation.
2. Give the pill a solid backdrop and add matching `scroll-margin-top` plus top
   padding to every section, so nothing ever sits under it.
3. Move it out of the centre. The overlap only reads as broken because it lands
   in the middle of a line of text.

### The homepage costs two screens before it says anything

Covered under SEO above. The splash is a good piece of craft and it is doing the
wrong job at full size. Suggestion: keep the wordmark and the glitch, cut the
splash to roughly 60vh, and pull the headline and the price up into the first
screen.

### The work ring desyncs during scroll

The pinned ring animates the project name and subtitle separately from the
screenshot. Mid-transition the panel showed "Tree surgery · Website, SEO and
Google Profile" with no name above it, while A Nevitt Construction's screenshot
was still the card on screen. The glitch effect on the name also renders it as
scattered fragments for long enough to read as broken rather than as an effect.

Two fixes: drive the text swap from the same progress value as the card, and
shorten the glitch so the name is legible for most of the transition.

### The ring clips at the right edge

At 1440px the mockup cards run past the viewport: "West Cornwa\[ll\]". The ring's
radius is not accounting for the card width at that breakpoint.

### Untested: mobile

Chrome would not resize below roughly 1500px in this session, so 375px and 768px
were not checked. The CSS is written mobile-first and the breakpoints look
sensible in source, but that is not the same as having looked at it. This needs a
real pass before anything else here ships.

---

## 5. Dead code and the directory

### Done in this pass

**The work grid's shape system.** The last commit replaced the homepage grid with
the pinned 3D ring. That left `tools/partials/work-card.js` cycling five card
shapes that nothing rendered any more, and four span rules in `site.css` that
nothing matched. Removed:

- `SHAPES` and the `variant` option in `work-card.js`, which now has one shape
  and one caller.
- `.work-card--lead`, `--phone`, `--half`, `--banner`, the `.work-grid--index`
  modifier and the `:not()` guard that existed only to keep the two layouts
  apart. The 64rem six-column block went with them.
- `.display--centred` in `base.css` and `--text-display` in `tokens.css`, both
  unreferenced.

Net: 135 lines deleted, 74 added. Build produces the same 28 pages, all 7 tests
pass, and `/work` renders identically.

**The directory.** Every plan, prompt, spec, draft and prototype now lives under
`docs/`:

```
docs/plans/       plan-picsel-site.md, work-ring-port-brief.md, 2 SDD plans
docs/prompts/     CLAUDEseo.md, instructions-picsel-site.md, 2 prompt files
docs/specs/       3 design specs
docs/drafts/      builder-website-cost.md
docs/prototypes/  work-ring-prototype.html
```

`CLAUDE.md` stays at the root because the tooling reads it there. `.assetsignore`
now excludes `docs` as one rule instead of listing `*.md` and the prototype
separately, which also means the prototype can never be reached at
`picsel.co.uk/work-ring-prototype.html`.

The repo root went from 56 tracked files to 49.

### Deliberately kept

`.post__figure`, `.post__list`, `.post__table` and `.post__table-wrap` in
`article.css` are unused today. They are the blog's half of selectors whose
`.guide__` twins are live. Deleting them would mean the next blog post with a
table silently loses styling the guides have. They stay.

### Not touched, needs your call

About 50 MB of files sit in the repo root that git ignores and nothing on the
site references:

```
a-nevitt-mockup-nobg.png          9.7 MB
a-nevitt-mockup-2-nobg-flipped.png 5.5 MB
a-nevitt-mockup2-nobg.png         5.5 MB
ajc-mockup-2-nobg.png             5.4 MB
julie-miller-mockup-nobg.png      4.6 MB
group-mockup-nobg.png             4.5 MB
ajc-mockup-nobg.png               3.1 MB
ben-laptop.jpg                   11.8 MB
```

`.gitignore` says these are one-off design-tool exports that no script can
regenerate, and that if one is deleted it is gone for good. `convert-photo.js`
reads them once to write the committed webp copies. I have not deleted them. They
belong in your own storage, not in a working directory, and moving them out is a
decision for you rather than for me.

`assets/backdrop/` is another 70 MB, but that one is exactly regenerable with
`npm run backdrop` and `npm run backdrop:video`, so it can go whenever you like.

### One inconsistency

`house-of-cornwall` and `lanora-house` have no `mockup*.webp` variants. The other
four projects have four each. Either they are missing or those two projects use a
different card treatment on purpose.

---

## The plan

Five phases, ordered by what a visitor feels first.

### Phase 1: stop the bleeding

1. **Fix the nav overlap.** Hide-on-scroll-down in `nav.js`, or solid backdrop
   plus section padding. One afternoon. Affects every page.
2. **Fix `sitemap.xml` `lastmod`.** Read the last commit date per source file in
   `tools/build.js`. Half an hour.
3. **Add `_headers`.** Ship the CSP in report-only first, watch for a week, then
   enforce. Deal with the homepage's inline script before enforcing.
4. **Do the mobile pass.** 375, 768, 1024. Nothing else here ships until this
   has been looked at.

### Phase 2: cut the payload

5. **Add a minify step to `tools/build.js`.** Strip comments and collapse
   whitespace from CSS, JS and HTML on the way out. Sources keep their comments;
   the published files do not. Expect 106 KB down to about 42 KB gzipped per
   page. This is the biggest single win on the list.
6. **Concatenate the always-on CSS.** `tokens.css`, `base.css` and `site.css`
   load on all 28 pages and are always requested together. One file, three
   fewer round trips.
7. **Move `hero.js` off the critical path.** It is decoration behind the
   wordmark. Load it after first paint.
8. **Pick one font provider or self-host what the licence allows.** Typekit's
   licence forbids self-hosting the wordmark faces, so Typekit stays. Lexend and
   Pixelify Sans are open licence and could be self-hosted, which removes the
   Google Fonts stylesheet and two preconnects from the critical path entirely.

### Phase 3: earn the first screen

9. **Cut the splash to about 60vh** and lift the headline, the price and the
   primary CTA above the fold.
10. **Close the gap** between the splash and the intro paragraph. There is
    currently close to a full empty viewport between them.

### Phase 4: finish the ring

11. Drive the name and subtitle from the same scroll progress as the card.
12. Shorten the glitch so the project name is readable through the transition.
13. Fix the right-edge clipping at 1440 and above.

### Phase 5: housekeeping

14. Move the mockup source PNGs and `ben-laptop.jpg` out of the repo directory,
    once you have confirmed where your own copies live.
15. Decide whether `house-of-cornwall` and `lanora-house` need mockup variants.
16. Consider a `check` script that runs the build, the tests, and a scan for
    unreferenced CSS classes and unused tokens, so the next dead-code sweep is
    a command rather than an afternoon.

---

## What changed on disk

Staged, not committed:

```
 .assetsignore                 |  11 ++--
 base.css                      |   9 ----
 site.css                      |  59 ++++-----------
 tokens.css                    |   1 -
 tools/pages/work.js           |   2 +-
 tools/partials/work-card.js   |  61 +++++++-----------
 work/index.html               |  14 ++---
 sitemap.xml                   |  52 +++++++--------
 13 files moved into docs/
```

`npm run build` produces 28 pages and 26 sitemap entries. `npm test` passes 7 of
7.
