# Picsel: Studio Website Build Plan
## Prepared July 2026

> This is Picsel's **own** site: a portfolio of the websites Ben has built, and the studio's
> main way of winning work. It is not a client trades site, so the local-SEO/town-page machinery
> of the client template does not apply. The conventions do: work through sections in order, each
> has a priority, tick boxes and add "What we built" notes as you go.
> Items marked `[BEN]` need something from Ben. `[DECISION]` needs a choice before coding starts.
> `[MANUAL]` is a dashboard, DNS or account step outside the codebase.
> Do not start a new section until the previous one's buildable work is tested and committed.
> **The standing start rule:** `[BEN]` and `[DECISION]` items never block the AI. Do everything
> you can, mark the human items pending (say exactly what's needed), and move to the next section
> whose requirements are met. Governing design doc: `CLAUDE.md` (the website design standards) —
> read it first; this plan never overrides its hard bans except the one intentional brand choice
> noted below (dark palette + the hero's gradient blobs).

---

## How to use this plan

- Tell the AI: **"Let's work on Section 2."** One section at a time.
- After each section: open the preview in a browser, check it, commit to git.
- **The AI updates this file automatically** — ticks boxes, fills "What we built" and "Decisions made."
- Attach `instructions-picsel-site.md` at the start of every coding session, alongside this file.

---

## Repositioning, August 2026

**Read this before any section below.** Picsel stopped being a Cornwall business and became a
UK-wide one. Ben relocates to Edinburgh within three months. Cornwall is now where the first
clients happen to be, not the market, and several decisions recorded further down this plan were
made under the old assumption and are no longer in force.

What changed, and what it supersedes:

| Now | Was | Where the old version is recorded |
|---|---|---|
| Service area is the UK. No place name appears anywhere about Picsel: not in copy, titles, meta descriptions, alt text or schema | "A web design and automation studio in Cornwall", in the homepage opening line, three page titles, the footer of every page and `areaServed` | Sections 4, 10, 12 |
| Prices are published on `/prices`, from `pricing.js` | "Prices stay off the site. No price, range or from-£ anywhere" | Sections 10 and 12, and the `[DECISION]` log |
| **One trade per patch, on the Growth plan.** A patch is a town plus roughly eight miles | "One client per trade, per town", stated with no conditions and no plan attached | Sections 4 and 12 |
| `areaServed` is `Country: United Kingdom` | `AdministrativeArea: Cornwall` | Section 9 |
| `sameAs` carries the three live social profiles | Omitted, because there were none | Section 9 |
| A `/guides` section of question-first pages is the main GEO play | GEO was four FAQ answers on the homepage | Section 10 |

Three of these were not merely out of date, they were **wrong as written**:

1. **The exclusivity promise was wrong twice.** The contract defines the unit as a patch, not a
   town, so the site was promising less than the contract gives. And full exclusivity is offered on
   Growth only, where there is active visibility work to protect, so the site was promising it to
   every customer including a £15 Online one. The wording now lives in `SITE.exclusivity` and
   `tools/build.js` fails the build if any page prints it without naming Growth.
2. **The no-prices decision had already broken.** The social bios lead with "from £15 a month". A
   site naming no number at all was not discretion, it was a contradiction anyone could find in one
   tab switch.
3. **The location claims outlived their truth on a known date.** A county in a footer that renders
   on every page is the single most repeated claim on a site and the last one anybody re-reads.

Two checks in `tools/build.js` now enforce the first and third of those on every build, because
both are the kind of thing that gets quietly reintroduced by somebody shortening a sentence to fit
a card.

---

## Site profile

Single source of truth. If a fact changes, change it here first, then everywhere it appears.

| Field | Value |
|---|---|
| Studio name | Picsel (working name; "Design Studio" tagline in the hero) |
| What it is | Portfolio + lead-gen site for a UK-wide web design and automation studio. **Was "a Cornwall studio" until August 2026** — see Repositioning below |
| Audience | Tradespeople and small businesses anywhere in the UK, mostly **not tech-savvy**, often burned by a previous web person. Easy nav and an obvious way to make contact are the whole job |
| Positioning | Websites and Google visibility for tradespeople, from £15 a month, live in days. SEO and GEO, Google Business Profile help, and custom automation tools. **One trade per patch, on the Growth plan only** (see Exclusivity below) |
| Service area | **The United Kingdom. No town, county or region is named anywhere on the site, in any title, meta description, alt text or schema block.** Ben relocates to Edinburgh within three months of August 2026, so any place name in the copy is a fact with an expiry date. Enforced by a check in `tools/build.js` |
| Exclusivity | **One trade per patch, on the Growth plan.** A patch is a town plus roughly eight miles. Written once in `SITE.exclusivity`; the build fails if a page prints it without naming Growth |
| Owner / contact | Ben Miller · 07456 809049 (`tel:+447456809049`) · benwmiller101@gmail.com |
| Dedicated studio email | **ben@picsel.co.uk**, on the Picsel domain. `hello@` is an alias on the same inbox, deliberately unpublished: one address on the site, one in the schema |
| Domain | **picsel.co.uk**, registered and live. Served from the apex; www redirects to it |
| Hosting | Cloudflare, as an **assets-only Worker** (`wrangler.jsonc`) rather than Pages. No code runs on request; a push to `main` deploys |
| Stack | Static multi-page HTML/CSS/JS, built **on top of the existing hero** (`hero.css`/`hero.js`; the prototype `hero.html`, `nav.css` and `nav.js` were deleted in Section 3 when the hero became the homepage). No framework. Pages are generated from one shared template by `tools/build.js` (`npm run build`) so the `<head>`, nav and footer exist once; the output is plain static HTML |
| Repo | `github.com/benmiller101/Picsel`, on `main`. Cloudflare deploys on every push |
| Fonts | Adobe Fonts web project `ior4aly` (`argent-pixel-cf`, `gridlite-pe-variable`, `pf-pixelscript`, `pixelify-sans`) + Google `Lexend` (body) and `Pixelify Sans` (fallback pixel face) |
| Contact form | Web3Forms (free, access key in the dashboard) |
| Brand aesthetic | Dark near-black, lava-lamp gradient blobs (hero only), near-invisible dot-grid texture, PICSEL pixel wordmark with a font-glitch |
| Show pricing? | **Yes, published on /prices. Reversed August 2026.** It was settled as "no" and overturned for one reason: the social bios lead with "from £15 a month", so a site naming no number was not discretion, it was a public contradiction. Three plans plus add-ons, all read from `pricing.js` |
| Featured projects | The five below |

### The five projects (source of truth for `projects.js`)

| Slug | Name | URL | Sector | Location | Featured |
|---|---|---|---|---|---|
| nevitt-construction | A Nevitt Construction — settled, the live site brands itself this; haylebuilders.com is only the domain | https://haylebuilders.com/ | Construction | Hayle, Cornwall | yes |
| julie-miller-art | Julie Miller Art | https://juliemillerart.co.uk/ | Artist portfolio | Scottish Borders | yes |
| lanora-house | Lanora House | https://www.lanorahouse.com/ | House clearance | Hayle, Cornwall | yes |
| ajc-removals | AJC Removals & Clearances | https://ajcremovals.co.uk/ | Removals & clearance | Cornwall | yes |
| house-of-cornwall | House of Cornwall | https://houseofcornwall.live/ | Antiques & auctions | Hayle, Cornwall | yes |

**The order of this table is the order of the grid, and it changed in August 2026.** It used to run
four Cornwall businesses with the Scottish one fourth, which was the right order for a Cornwall
studio. Julie Miller Art is now second: it is several hundred miles from every other client, and
having it high in the grid demonstrates that distance is not a problem instead of asserting it in
copy. The Location column stays as it is. These are facts about the CLIENTS, they are true, and
they appear on each client's own page. Only Picsel is forbidden a location.

Blurbs are drafted in the build brief and are editable by Ben. `work` tags default to `['Website']`;
add `'SEO'` / `'Google Profile'` per project where that's what Picsel actually did.

---

## Positioning boundaries: what the site never says

Picsel is a brand-new studio. Credibility comes from the work shown, not from inflated claims.

- **No invented social proof.** No fake testimonials, client counts, years-in-business, awards or
  stat rows. Only claim numbers that are real (e.g. don't say "50+ sites" — there are five).
- **Feature client sites respectfully.** Show the work and link out; do not imply a testimonial or
  endorsement that hasn't been given. `[BEN]` give a quick nod that each client is happy to be
  featured (Lanora House especially, where Ben is a director; and Julie Miller Art).
- **Contain the brand gradients.** Dark palette and the hero's rainbow blobs are the one
  intentional exception to `CLAUDE.md`'s purple-gradient ban. Do **not** spread
  purple/blue/pink gradients across sections, buttons, cards or headline words elsewhere. The rest
  is disciplined near-black; the client screenshots supply the colour.
- **Plain English only.** The audience is non-technical trades. No jargon, no SaaS slogans, no
  "Transform your X", no "Why choose us" section (all banned in `CLAUDE.md`).
- **Pricing, if shown, is honest.** If the founding offer goes on the site, state it plainly and
  keep it current; never bait-and-switch.

---

## Page structure (sitemap)

| Page | URL | Job of the page |
|---|---|---|
| Home | / | The hero, one plain line on what Picsel does, a selected-work grid, a short services note, a strong contact band |
| Work | /work | Every project as a card (screenshot, name, sector) linking to its page |
| Project page (one per project) | /work/<slug> | Explore one build: screenshots, a bit written about it, a big "Visit the live site" button, prev/next, contact band |
| Contact | /contact | Big click-to-call, email, and the Web3Forms form |
| About / Services (optional) | section on / or /about | Plain-English what Picsel offers and how the local/exclusive model works |

> **THE SITEMAP LAW** (from `CLAUDE.md`): every route that exists is in `sitemap.xml` in the same
> commit that creates it. Re-verified at Sections 8 and 11.

---

## What we need before work starts

### Required now
- [x] `[DECISION]` Domain chosen and registered — **picsel.co.uk**
- [x] `[DECISION]` Studio contact email — **ben@picsel.co.uk** on the domain
- [x] ~~`[DECISION]` Whether to show the founding-offer pricing — **no.**~~ **Reversed August 2026.**
      Prices are published on `/prices`, read from `pricing.js`. The original decision was overturned
      because the social bios already led with "from £15 a month", so the site naming no number was
      not discretion, it was a contradiction. See Repositioning at the top of this plan
- [x] `[BEN]` **Confirm each of the five clients is happy to be featured** — all five cleared,
      August 2026, including Lanora House (Ben is a director) and House of Cornwall, which states an
      affiliation with Lanora House on its own site. Two of the five being connected businesses is a
      conscious choice, not an oversight
- [x] `[BEN]` First project's display name — settled as **A Nevitt Construction** (its own site's
      header and title; `haylebuilders.com` is only the domain)
- [ ] `[BEN]` Reword the five draft blurbs if wanted. Drafts are in `projects.js`, written from what
      each live site says about itself and claiming no outcomes
- [x] `[BEN]` **Confirm the `tags` per project** — done. A Nevitt Construction and Lanora House carry
      `['Website', 'SEO']`; the other three are the build alone. No project claims Google Profile work
- [x] `[BEN]` Project list supplied (names, URLs, sectors) — done

### Required before launch
- [x] `[MANUAL]` Web3Forms access key in `SITE.form.accessKey`, with `accessKeyIsPlaceholder: false`.
      A second key was tried in August 2026 and reverted; the site is on the original
      `7b487923…`. Both delivered to Ben's old Gmail rather than the studio address
- [ ] `[MANUAL]` **Point the enquiries at ben@picsel.co.uk.** They currently arrive at
      benwmiller101@gmail.com, because Web3Forms mails to the address registered against the key and
      nothing in this repo can change that. Fix it in the Web3Forms dashboard, then send one test
- [ ] `[MANUAL]` Adobe Fonts web project confirmed serving on the production domain. `ior4aly.css`
      returns 200, but Adobe gates by domain allowlist: load picsel.co.uk and confirm the pixel faces
      render rather than the fallbacks

---

# Phase 1: Build

## Section 1: Setup, structure and content model
**Priority: CRITICAL | Effort: 2 hours**

- [x] Confirm the repo (the existing `picsel` directory) and make a first commit of this plan and
      `instructions-picsel-site.md`
- [x] Add `.claude/settings.json` with the agency permission rules (spec in the instructions file)
- [x] Create `projects.js` as the single source of truth, pre-filled with the five projects
      (schema in the build brief). Everything project-related reads from this file
- [x] Decide the shared page shell: which parts of `nav.css`/`nav.js` and the hero carry across all
      pages, and where a shared `<head>` partial and base stylesheet live

**What we built:**

The site now has a spine. `projects.js` holds the five real projects and is the only place their
facts live, so the Work grid, each project page, the sitemap and the screenshot script all read from
one list and can never contradict each other. `site.config.js` does the same job for Picsel itself —
the phone number and email are written once and appear everywhere from there. A small build step
takes a single page template and writes finished, plain HTML files, which is what lets every page
share one `<head>` and one nav without nine copies drifting apart. That build runs on Ben's machine,
never in a visitor's browser, so every word of the site is in the file before it is served.

The shell was checked in a real browser rather than assumed to work, and three things were wrong:
content sat behind the floating nav, the footer stranded itself halfway down short pages, and the
footer's phone and email links were 26 pixels tall — well under the 44-pixel minimum a thumb needs.
All three are fixed and re-measured at 375, 768, 1024 and 1440 pixels wide, with no sideways
scrolling at any size and a clean console.

**Decisions made:**

- **A small build step, not hand-written pages.** Plain HTML has no way to share a `<head>` or a nav.
  The alternative was copying both into every page, which always drifts. `tools/build.js` renders
  pages from one template; the output is ordinary static files with no framework and no runtime.
- **The build refuses to write a broken site.** It checks every page before writing any of them:
  titles unique and ≤60 characters, descriptions unique and ≤155, exactly one `<h1>`. If a check
  fails, nothing is written at all. Verified by deliberately breaking a page.
- **The nav is real HTML, replacing `nav.js`.** The prototype `nav.js` was a switcher between four
  experiment pages that built itself in JavaScript — which would have made the site's navigation
  invisible to anything not running scripts, breaking the plan's own rule. `nav.css`'s pill styling
  carries over into `site.css`; `nav.css`/`nav.js` remain only because `hero.html` still links them
  and are deleted in Section 3.
- **`tokens.css` is deliberately minimal.** It holds only the two colours already in `hero.css` plus
  a small spacing scale — enough for the shell, nothing invented ahead of Section 2's design work.
- **Generated HTML is committed.** Cloudflare Pages can then serve the repo directly with no build
  configuration to get wrong, and Ben can see exactly what ships. Easily reversed later.
- **`A Nevitt Construction` over `Hayle Builders`.** Settles a `[DECISION]`: the live site brands
  itself A Nevitt Construction in its own header and title. `haylebuilders.com` is only the domain.
- **Project blurbs are factual drafts, and tags claim nothing.** Every `tags` array reads
  `['Website']` only, because that is all that is verifiable from the live sites — `SEO` and
  `Google Profile` stay off until Ben confirms per client. Blurbs describe each build and
  deliberately claim no traffic, ranking or enquiry outcome.

**Done when:** `projects.js` holds the five real projects and a blank page renders with the shared nav and base styles. ✅

---

## Section 2: Design system and site-wide background
**Priority: CRITICAL | Effort: half a day**

- [x] `tokens.css`: near-black background, ink, one restrained accent (from the brand glitch
      cyan/magenta), spacing and radii as custom properties. No hardcoded values elsewhere
- [x] Typography: `argent-pixel-cf` pixel face for the logo and the occasional big title, used with
      restraint; **all reading copy in Lexend** at a comfortable size and line-height. High contrast, WCAG AA
- [x] Reuse `nav.css`/`nav.js` (light-on-dark default suits the dark site); add the nav items
      (Work, Contact) and a distinct **"Get in touch"** accent button; make the mobile menu work
      — *shipped without a hamburger; see the decision below*
- [x] **Persistent parallax background:** promote the dot-grid texture to a fixed, site-wide layer
      behind all content that does **not** scroll with the page and **slowly drifts upward** on its
      own. Near-invisible, delta-time based, reduced-motion aware
- [x] Shared `<head>` partial: per-page title/meta slots, canonical, Open Graph, the Adobe + Google
      font links

**What we built:**

The site now has a proper vocabulary. Six colours, two typefaces and one spacing rhythm are written
down once in `tokens.css`, and every page reads them from there — which is why the pages will keep
looking related to each other as more of them get built. The reading copy is Lexend at a comfortable
size with generous line spacing; the pixel face is kept for the wordmark and the occasional big
title only, because it is genuinely hard work over a paragraph and the people this site is for are
busy.

Behind everything there is now one fixed sheet of very faint dots that the pages slide over. It
doesn't scroll with the content and it drifts slowly upward on its own — like a slow conveyor behind
a shop window — so the page feels alive without anything moving that your eye has to follow. It is
drawn by the browser rather than by code, so it costs nothing, keeps working with JavaScript
switched off, and stops moving entirely for anyone who has asked their computer to reduce animation.

The nav gained the real routes and a single cyan "Get in touch" button, and the whole thing was
measured in a browser rather than assumed: at 375 pixels wide the bar is 298 pixels, so nothing is
clipped and nothing is hidden. Every piece of text was contrast-checked against the near-black —
the dimmest thing on the page measures 5.7:1, where the accessibility floor is 4.5:1 — every link
and button clears the 44-pixel tap minimum, and there is no sideways scrolling at any width.

**Decisions made:**

- **The accent is the glitch's cyan, `#00e1ff`, and only the cyan.** The wordmark already throws a
  red/cyan split; the accent is lifted straight out of it rather than invented. Cyan and not its
  magenta twin for a plain accessibility reason: cyan on near-black measures 12.5:1, the magenta
  measures about 4:1 and fails as text. The magenta stays inside the hero's aberration, where it is
  a one-pixel edge rather than something anyone reads. The accent marks **one thing per screen** —
  the primary button and the focus ring. It is never a background, never a gradient, never a
  headline word.
- **No hamburger menu — this is a deliberate departure from the checklist above.** The bar holds
  four things and all four fit at 375px with 77px to spare (measured, not estimated). Hiding a
  phone-first, mostly non-technical audience's route to contact behind a button they have to find
  first would be worse for them than a slightly tighter bar. It would also have meant either a
  JavaScript-dependent menu — which breaks the rule that nothing needed is behind JavaScript — or a
  checkbox hack. Revisit only if a fifth nav item is ever added.
- **`Contact` and `Get in touch` are not the same link.** Two nav items pointing at one URL is
  clutter. Contact opens the page (phone, email, where Picsel is); Get in touch jumps to the enquiry
  form on it at `/contact/#enquiry`. One route for someone who wants to call, one for someone who
  wants to type. Section 8 must give the form the `id="enquiry"` this depends on.
- **The backdrop is CSS, not a second canvas — a departure from "delta-time based" in the
  checklist.** The plan assumed a JavaScript animation like the hero's. A repeating gradient moved
  by transform does the same job with no animation loop running for the whole visit, no battery
  cost, and it still works with JavaScript off. CSS animations are already time-based rather than
  frame-based, so the reason delta-time was specified is satisfied anyway. It moves by transform
  and not by shifting the background position, because transforms are handled by the graphics card
  where repositioning a background repaints the whole screen sixty times a second.
  > **Superseded in Section 4** at Ben's request: the hero's canvas dot-field now runs site-wide
  > with a scroll parallax, and this CSS layer has been demoted to the JavaScript-off fallback. The
  > reasoning above is why the fallback was kept rather than deleted. See Section 4's decisions.
- **The page colour lives on `<html>`, not `<body>`.** Non-obvious but load-bearing: the root
  element's background is what paints the browser canvas, which leaves the layer behind `<body>`
  free for the backdrop. Put it on `<body>` and the dots are covered and never seen.
- **Headings are Lexend, not the pixel face.** The pixel face is opt-in via a `.display` class. A
  page of pixel headings would look like a brand and read like a puzzle; rationing it is what keeps
  it a signature.
- **The proof sheet at `/shell-check/`** now shows the whole system on one page — type scale,
  palette, buttons, backdrop — so the design can be judged at a glance. Still `noindex`, still out
  of the sitemap, still deleted in Section 4.

**Done when:** every page shares the nav, tokens, fonts and the drifting dark background, and Lighthouse performance on a blank page is 95+. ✅ *(Lighthouse not yet run — no CLI installed; the full audit is Section 11. Verified by hand instead: no console errors, no layout shift, no blocking JavaScript, one composited animation.)*

---

## Section 3: Hero and scroll behaviour
**Priority: CRITICAL | Effort: half a day**

- [x] Keep the load-in intro (wordmark glitches in, blobs slide from the sides to centre)
- [x] Convert the hero from a fixed full-screen splash into the **first section of a scrolling
      homepage** (remove the `body { overflow: hidden }` lock and `position: fixed` splash behaviour)
- [x] **Reverse-on-scroll:** as the visitor scrolls the first screen, play the intro in reverse,
      **scrubbed to scroll position** — blobs travel back to the sides, wordmark glitches/fades out —
      then release into normal scrolling. Pinned hero over a defined `SCROLL_RANGE`, eased and reversible
      — *shipped as a sticky element measured in CSS rather than a JS constant; see the decision below*
- [x] Blobs are hero-only; only the dark + drifting dot-grid carries through the rest of the site
- [x] `prefers-reduced-motion`: skip the scrub (show hero, then content) and calm the background
- [x] Pause the hero animation loop once scrolled fully past (perf/battery)
- [x] **Blobs drawn on a pixel grid** — added mid-section at Ben's request: the blobs are rendered
      at low resolution on a fixed 8px grid rather than smoothed, so their movement steps block by
      block. Blobs only; the dot field and the wordmark are untouched

**What we built:**

The splash is now the top of a real page. It used to be a fixed screen with the page's scrolling
switched off — fine for a one-screen experiment, useless as the front of a site. The hero is now a
tall section with a screen-sized panel that sticks to the top of the window: the panel holds still
while the page slides past behind it, and how far you have slid is what plays the opening backwards.
Blobs travel back out to the sides, the PICSEL wordmark comes apart into its red and cyan halves and
lifts away, and then the page releases into ordinary scrolling with the faint drifting dots behind
it. Scroll back up and it all re-assembles, because nothing is being "played" — every frame is drawn
from where the page currently is, so it follows the scroll wheel in both directions.

This also made the homepage exist. `/` is now a real route with the hero, the one plain sentence
about what Picsel is, and the footer; Section 4 builds the rest of the page around it. Because a new
route appeared, `sitemap.xml` now generates from the same page list the pages themselves come from —
so a route can no longer exist without being listed, which is the Sitemap Law obeyed by machinery
rather than by memory. The three prototype files that were only propping up the old experiment page
(`hero.html`, `nav.css`, `nav.js`) are deleted.

The blobs are now shown on a low-resolution grid — the hero's own small display. They are not smooth
shapes with a pixel effect over the top: the whole picture is drawn eight times smaller and stretched
back up with hard edges, so a block of colour is genuinely one drawn dot. The difference is in the
movement. A pixel effect laid over a smooth shape leaves the shape sliding smoothly underneath, and
the blocks along its edge shimmer and crawl; drawn on a fixed grid, a block does not budge until the
blob crosses a whole cell, then it flips in one step. At a normal frame only five to eight blocks out
of about thirteen hundred change, which is what makes the movement read as chunky and deliberate
rather than as a filter.

Checked in a browser rather than assumed: the intro plays and settles, the wordmark splits and fades
on scroll, scrolling away and back rebuilds the blobs, the page hands off cleanly to the copy and
footer below, there are no errors in the console, and at 375 pixels wide the nav still fits on one
line with 77 pixels to spare and nothing scrolls sideways.

**Decisions made:**

- **The hero is pinned by the browser, not by JavaScript.** A sticky element inside a taller section
  does the pinning natively, so the hero stays put even while JavaScript is busy and the layout is
  correct before a single line of script runs. The alternative — positioning the hero from scroll
  events — is the standard way these effects judder.
- **The scroll distance is set once, in CSS.** `--hero-scroll` in `hero.css` is the only place the
  length of the reverse intro is written; `hero.js` measures the element instead of holding its own
  copy of the number. The plan called for a `SCROLL_RANGE` constant in the script, which would have
  been the same number written in two files — and two copies of a number are two numbers that will
  eventually disagree.
- **The exit holds, then releases.** Driving the reverse evenly against scroll looked wrong: the
  blobs start most of a screen beyond the edge, so an even journey has them gone by the halfway
  point and the rest of the pinned screen has nothing happening on it, which reads as the page
  having jammed. They now sit near home through the early scroll and clear the frame in the last
  third. The wordmark leaves earlier, by about 70% through, so the end of the gesture is the blobs
  alone travelling out.
- **The wordmark leaves by breaking apart, not by fading.** The red/cyan split the glitch already
  flashes is simply held open and widened as you scroll, so the exit is made of the brand's own
  fault rather than a generic fade. It is one CSS variable published per frame, which the browser
  can then apply without any per-element JavaScript.
- **The h1 is the hero, and it is readable aloud.** The wordmark is chopped into one span per letter
  so the glitch can re-font them individually — which would make a screen reader spell "P-I-C-S-E-L"
  out. The letters are hidden from assistive technology and the heading carries an ordinary hidden
  line of text, so the page is seen as a pixel wordmark and heard as "Picsel — Design Studio".
- **A one-word scroll cue.** The hero fills the screen and nothing else says the site continues
  below it. For a mostly non-technical, phone-first audience that is worth one quiet word, and it
  fades out as soon as any scrolling starts.
- **Under reduced motion the extra scroll distance disappears entirely.** Skipping only the
  animation would have left a screen of pinned scrolling where nothing happens. The hero becomes an
  ordinary full-height section instead, and the page below arrives a screen sooner.
- **The animation loop stops when the hero is off screen and restarts on the way back up.** On a
  long page most of a visit is spent past the hero, and a loop redrawing blobs nobody can see is
  pure battery cost.
- **The blobs moved from SVG shapes to a drawn low-resolution picture.** A pixel effect over the
  existing shapes would have looked pixelated while still moving smoothly, which is the thing Ben
  specifically did not want. Drawing them small and scaling up is the only way the movement itself
  lands on the grid. All the shape and motion work is untouched — the same lobes, the same noise,
  the same entrance and scroll scrub — it is only the last step, putting them on screen, that
  changed. Two things did not survive: the blur-based "goo" filter and the mask that went with it
  are now the grid's own hard yes-or-no, and the blob edge fringing was rebuilt (below).
- **8 pixel blocks, fixed size rather than a fixed number across.** So the grain reads the same on a
  phone as on a desktop. It does mean a blob on a phone is built from fewer blocks, since the blob
  itself is smaller — which is exactly what a real small display would do, and it looks right.
- **One flat colour per block, and no palette reduction or dithering.** The gradient still sweeps
  smoothly across the blob; it is the blocks that are hard. Banding it down to a handful of colours
  would have been more retro and would have thrown away the brand's own gradient.
- **The lens fringing is now measured in whole blocks.** A colour fringe thinner than one block
  cannot be drawn, and rounding it unevenly along an edge reads as a fault rather than an effect. So
  the middle of the frame is clean and the far corners split by exactly one block — the same idea in
  the grid's units.
- **Only the patch of grid the blobs occupy is recomputed each frame.** The compositing decides each
  block individually, and on a wide screen most blocks are empty every frame. Restricting the work
  to the blobs' own footprint took a frame from 4.3 to 2.7 milliseconds against a 16.7 budget. Worth
  re-measuring on a real phone in Section 11 — that is where the margin is thinnest.

**Done when:** the hero plays in on load, un-builds smoothly and reversibly as you scroll, and hands off to normal page scroll with the background drifting behind. ✅

---

## Section 4: Homepage
**Priority: CRITICAL | Effort: half a day**

- [x] Below the hero: one plain sentence on what Picsel does (no slogan)
- [x] **Selected work** grid (the `featured` projects from `projects.js`): screenshot, name, sector,
      linking to each project page. Let the screenshots carry the colour
- [x] Short, plain services note: websites, SEO & GEO, Google Business Profile help, custom
      automation tools — and the one-client-per-trade-per-town idea in a sentence. No "Why choose us"
- [x] `[DECISION]` Founding-offer pricing block — **decided against.** Nothing is built for it and
      nothing is stubbed; the page reads as finished without it
- [x] Closing **contact band**: a line, a big "Get in touch" button, the phone number

**What we built:**

The homepage is now a whole page rather than a hero with a footer under it. Past the hero it says in
one sentence who Picsel is, where it is and what it does, then shows the five sites, then explains
the four services in the words a builder would use, then asks for the call. That order is
deliberate and it is not the usual one: the work comes before the services list, because someone
sent here by a tradesperson wants to know whether the sites are any good before they will read a
list of what is on offer.

The work grid is the page's one piece of real composition. Five identical rectangles in a row is
the thing that makes a portfolio look generated, so the cards cycle through four shapes — a wide
lead, a phone-shaped one, two halves and a full-width banner. The phone shape is not decoration: it
is the same client's site at phone size, which is where nearly all of their customers will actually
see it. Everything around the screenshots is near-black on purpose, because five client sites in
five different palettes will fight anything else trying to be colourful.

Two partials were pulled out rather than written inline. The card is shared with `/work` in Section
5, so the two grids cannot drift into looking like different components, and the contact band is
shared with every project page in Section 6, so the phone number can never rot in one place and not
another. Every fact on a card comes from `projects.js` — nothing is typed into markup.

Checked in a real browser at 375, 768, 1024 and 1440: no sideways scrolling at any width, no
interactive element under the 44-pixel tap minimum at any width, and no console errors. Every
screenshot declares its true pixel size, verified against the files rather than assumed, so no text
jumps down the page as the images arrive.

**Decisions made:**

- **Card shape is a fact about the layout, not about the client.** The shapes cycle by position in
  the grid rather than being stored per project. Putting a size in `projects.js` would mean adding a
  sixth project could quietly break the fifth one's row, and it would be recording a layout decision
  in the content file. The cycle adds up to two full rows plus a banner, so any number of projects
  fills tidily.
- **Real `width` and `height` on every screenshot, taken from the capture script's own sizes.**
  Without them the text under each card jumps down as each image loads. Verified in the browser:
  all five images' declared sizes match the files exactly.
- **The intro is written to be lifted whole.** The first sentence after the hero names the studio,
  the county and the work in one plain line, so an assistant answering "who builds websites in
  Cornwall" can quote it and still be accurate. This is Section 10's first-50-words test satisfied
  early, because retrofitting it later would have meant rewriting the opening.
- **No pricing block, and no placeholder for one.** Built that way while the decision was open. A
  greyed-out "pricing coming soon" would have been worse than nothing on a site whose whole pitch is
  that it is finished and real. *Superseded later in August 2026: the homepage now carries a price
  rail of the three plans under the services list, and `/prices` carries the rest. The reasoning
  above is why there was never a placeholder to remove.*
- **The blob grid moved from 8px blocks to 12px**, at Ben's request mid-section. Bigger blocks mean
  a coarser picture: the hero now draws 120 x 67 pixels on a 1440 screen instead of 180 x 100, so
  the grain is more obviously a choice and the per-frame cost went down rather than up. The number
  lives in one place (`PIXEL.CELL` in `hero.js`) and the canvas sizes itself from it.
- **The scroll cue got a halo of the page's own background.** Found in the review pass, not
  predicted: at 375px the blobs stack vertically and the lower one settles exactly where the cue
  sits, leaving pale grey text on bright yellow. Two soft shadows in `--bg` keep the word legible
  over any blob colour and stay invisible against the near-black everywhere else, which a solid
  plate behind the text would not.
- **`/shell-check/` is deleted, as Section 2 said it would be.** It was scaffolding for judging the
  design system before there were real pages to judge. The homepage is now the proof sheet.
- **The hero's dot texture became the whole site's, and it parallaxes.** Asked for by Ben after the
  page was built. The hero used to draw its own halftone — dots varying in size and shade, flowing
  on a noise field — while the rest of the site had a plainer CSS version: uniform dots at one
  opacity. Two textures for one site, and the join was at the bottom of the hero, which is the most
  visible place a join could be. Now there is one fixed canvas behind every page, and the hero sits
  in front of it. It moves up at 30% of the scroll speed, so it reads as a surface some way behind
  the content rather than a pattern stuck to the glass.
  - **It reverses Section 2's decision, and the reasoning there was sound**, so what that decision
    was protecting is kept by other means: the CSS layer stays as the fallback and shows whenever
    the canvas cannot run — JavaScript off, blocked, or a browser that refuses a canvas context to
    defeat fingerprinting. It is visible by default and hidden only once the canvas is confirmed
    running, so a script failure can never leave a blank page. Verified with JavaScript disabled:
    the dots still paint. The loop also stops when the tab is hidden, and under reduced motion the
    field is drawn once and never animates or parallaxes at all.
  - **The parallax is measured, not eyeballed.** Direction is the thing that is easy to get
    backwards — the background must travel the same way as the content, just slower — and a
    screenshot cannot tell you which way a texture moved. A test scrolls the page 600px with the
    field's own evolution frozen, then cross-correlates the canvas before and after: it recovers
    exactly −180px, i.e. up, at the intended 0.3 gearing. I had it inverted on the first attempt
    and this is what caught it.
  - **The noise was being sampled five times per dot.** Drawing has to be grouped by shade — one
    path per shade keeps the field to a handful of fills instead of thousands of style changes —
    but the obvious way to write that recomputes each dot's shade once per shade and discards four
    fifths of the work. Shades are now worked out in one pass into a byte per dot, and the drawing
    is five cheap passes over that. 7.4ms per draw to 3.9ms on a 1440x900 viewport, measured both
    sides.
  - **The hero stage lost its opaque background.** It was `var(--bg)`, which was correct when the
    hero drew its own dots on top of it and is now exactly what would mask the shared field —
    the texture would have stopped dead at the bottom of the hero. The page colour is on `<html>`
    anyway, so there was nothing to restate.
  - **The noise generator moved to its own module.** The blobs and the backdrop both need it, and
    they now live in different files. One shared `noise.js` rather than two copies of sixty lines
    of identical maths that could drift apart. Both scripts became ES modules to import it.
  - **Contrast was re-checked, because the texture now sits behind reading copy** rather than
    behind an empty hero. Over the brightest possible dot the body text measures 8.5:1 and the
    faintest label text 5.2:1, against a 4.5:1 floor — so the field can run at full strength
    without touching legibility. `DOTS.MAX_ALPHA` in `backdrop.js` is the one knob if it ever
    wants toning down.

**Done when:** the homepage tells a non-technical visitor what Picsel is, shows the work, and makes contact obvious, with no placeholder text. ✅

---

## Section 5: Work index
**Priority: HIGH | Effort: 2 hours**

- [x] `/work`: every project from `projects.js` as a card (desktop screenshot, name, sector label),
      generated from the data so adding a project is one entry
- [x] Clear hover/focus states (cards must look clickable); links go to `/work/<slug>`
- [x] Contact band at the foot

**What we built:**

`/work` is the catalogue: every project, not only the ones the homepage features. It reads the full
list rather than the featured one, so a build that is deliberately kept off the front page still has
a home here and still gets its own page.

It deliberately does not look like the homepage grid. The homepage composes — one build gets a wide
card, another a phone-shaped one — because that section is doing persuasion. This page is for
someone who has come to compare, and varied sizes actively get in the way of comparing: a bigger
card reads as a better project rather than as a layout decision. So every card here is the same
size in a plain two-up grid. It is the same card component either way, which is the point of it
being a partial — the two can look different without being able to drift apart.

The page's own copy is written from the data. The count of sites is taken at build time, not typed,
because the day a sixth project is added a hand-written number becomes a lie on a page whose entire
argument is that the work is real.

*Changed August 2026:* the sentence used to read "five live sites, four of them in Cornwall", with
the county count derived from the data for exactly the same reason. The derivation was careful and
it is gone anyway. A studio that no longer describes itself by county should not be sorting its own
portfolio into local and not-local, which is that description wearing a different hat. The count of
sites stays; the count of counties does not.

Checked in a browser at 375, 768, 1024 and 1440: no sideways scrolling, no tap target under 44
pixels, one `<h1>`, a clean console, and all five links matching their slugs in `projects.js`.

**Decisions made:**

- **Hover and focus were measured, not eyeballed.** Both are states a screenshot cannot show, and
  "cards must look clickable" is a checkbox that is easy to tick without checking. Compared
  computed styles at rest, on hover and on real keyboard focus: hover brightens the frame hairline
  from 12% to 22% white and scales the screenshot 2%; keyboard focus adds the 2px cyan outline on
  top of that. Both confirmed to change something visible.
- **Focus was tested with the Tab key, not `.focus()`.** `:focus-visible` deliberately does not
  match a programmatic focus call, so testing it that way would have reported a passing focus ring
  on a page that had none for a real keyboard user.
- **The `<h1>` is the page title, and the grid's heading is hidden.** A visible "Projects" heading
  above a grid of projects says nothing the grid does not; removing it entirely would leave the
  section unlabelled for a screen reader. So it is there and hidden, which is the case
  `visually-hidden` exists for.
- **The five card links 404 until Section 6.** Expected and in plan order — Section 6 generates the
  project pages from the same list. Flagged here so it is not mistaken for a defect in the
  meantime.

**Done when:** all five projects show as cards and every card opens the right project page. ⏳ *(Cards and links done and verified; the pages they open are Section 6.)*

---

## Section 6: Project pages
**Priority: CRITICAL | Effort: half a day**

- [x] One **static HTML page per project** (own URL, title, meta) generated from `projects.js` + a
      shared template
- [x] Layout: project name (pixel display, restrained), sector label, the desktop screenshot as the
      page hero, the blurb in Lexend, the small "what we did" tags, a **prominent "Visit the live
      site" button** opening the client `url` in a new tab (`rel="noopener"`), the mobile screenshot
      alongside, previous/next project links, and the contact band
- [x] Calm dark framing so the screenshot carries the colour; simple device/browser frame, no glassmorphism

**What we built:**

Five pages from one template and one list. Nothing is written per client — name, sector, location,
blurb, live URL, screenshots and alt text all come from `projects.js` — so a sixth project adds a
sixth page, a sixth route and a sixth sitemap entry without a line of new code. `tools/build.js` no
longer names project pages individually; it spreads the generated list.

The page has a narrow job. Someone clicked a card because a screenshot looked like the kind of site
they want, and they are deciding whether to ring. The fastest way to convince them is not more words
about the build — it is the live site. So the page is arranged to get them there: the screenshot
large at the top in a plain browser frame, one paragraph, and the button.

The browser frame shows the real domain without the `www.`, which is the one piece of chrome that
earns its place: it tells the visitor where the button is about to take them before they press it.
The phone shot sits beside the words at a deliberately narrower column, because most of these
clients' customers are on a phone and a portfolio for small businesses should show the small screen
was designed rather than left to shrink.

Audited across all five pages rather than spot-checked: one `<h1>` each, unique titles and
descriptions within their limits, both screenshots carrying non-identical alt text, the live-site
link on every page carrying `target="_blank"` with `rel="noopener noreferrer"` and pointing at the
right client URL, and the Open Graph image set to that project's own desktop capture. No sideways
scrolling and no tap target under 44 pixels at 375, 768, 1024 or 1440.

**Decisions made:**

- **The pixel face carries the project name, and this is the one page where it carries a whole
  heading.** Section 2 rationed it to the wordmark and the occasional title precisely so it would
  still mean something here. Capped smaller than the `/work` heading: pixel letterforms at a large
  size start reading as a logo rather than a title.
- **The meta description is derived from the blurb, not written beside it.** A description
  hand-written next to a blurb is a second copy of the same sentence, and the two drift the moment
  one is edited. It takes the blurb's first sentence and appends "Built by Picsel." only when that
  still fits inside 155 characters — which it does on three of the five.
- **The two screenshots do not share alt text.** Both come from one `alt` field in `projects.js`,
  so the phone shot appends ", shown on a phone". Two images with identical alt text on one page
  tells a screen-reader user there are two of the same picture.
- **`rel="noopener noreferrer"` on the live-site links, not just `noopener`.** The plan asked for
  `noopener`, which stops the opened page reaching back into this one. `noreferrer` also stops
  Picsel's URL being handed to the client's analytics — these are live client sites, and quietly
  appearing in their referrer logs is not something a portfolio needs to do.
- **Prev/next carry the project's name, not just a direction.** A link that says only "Next" tells
  someone skimming, and anyone using a screen reader, nothing about where it goes. The pair wraps
  around the list so neither link is ever dead.
- **Tags say only what `projects.js` says**, which is `Website` and nothing else on all five. The
  heading is "What we did" rather than "Services": one is a fact about this job, the other is a
  menu. They are outlined rather than filled, because a row of solid badges is the pill-clutter
  `CLAUDE.md` bans.
- **The Julie Miller Art page never says Cornwall**, verified rather than assumed. It is the one
  project in the Scottish Borders, and Section 9's local-signal rule exists so the site does not
  claim a place that is not true of the work.

**Done when:** each of the five projects has its own page passing a read-aloud check, with a working live-site link and prev/next. ✅ *(All five clients cleared to feature, August 2026.)*

---

## Section 7: Screenshot pipeline
**Priority: HIGH | Effort: 2 hours**

> **Taken out of order, before Section 4.** The homepage's Selected Work grid is built around these
> screenshots, and building that grid twice — once around placeholders and again around the real
> images — is wasted work. Section 7 only ever depended on Section 1, so nothing was jumped.

- [x] A repeatable script (`npm run shots`) that reads `projects.js` and **auto-captures** each live
      `url` at desktop (~1440px) and mobile (~390px) with a headless browser (Playwright/Puppeteer)
      — *Puppeteer, driving the Chrome already on the machine; see the decision below*
- [x] Save to `assets/work/<slug>/desktop.webp` and `mobile.webp`, optimised; real `alt` text
      ("Screenshot of the <name> website") — alt text already lives in `projects.js`
- [x] Unreachable URL → neat placeholder + a logged warning, never a broken build
- [x] Document the one command so Ben can refresh shots when a client site changes or a project is added

**What we built:**

One command, `npm run shots`, now opens all five client sites in a headless browser — a real Chrome
with no window — and photographs each one at desktop and phone size. The pictures land in
`assets/work/<slug>/` as webp, which is about a fifth of the size of an ordinary screenshot for the
same quality, and the whole set of ten comes to roughly a megabyte. `npm run shots -- lanora-house`
re-does a single client when only one of them has changed.

This exists because client sites change and hand-taken screenshots quietly rot. A portfolio full of
sites that no longer look like that is worse than no portfolio, and nobody notices because nobody
re-checks. Refreshing every shot is now a minute rather than an afternoon, which is the difference
between it happening and not.

Two of the five needed the script to be cleverer than "wait a few seconds". Julie Miller Art plays a
"loading portfolio" animation on arrival, and the first attempt photographed the loading screen. AJC
Removals never goes quiet — something on the page keeps a connection open permanently, so waiting
for the network to settle waited forever on a page that had finished long before. Both are handled
by watching the page instead: it is photographed every second or so until two looks come out
identical, and only then is the real picture taken.

**Decisions made:**

- **Puppeteer driving the Chrome already installed, rather than its own copy.** The usual setup
  downloads a private 150MB browser on every machine and in CI. Ben has Chrome; the script finds it
  in the standard places and uses it, so installing the project stays small. `PUPPETEER_EXECUTABLE_PATH`
  overrides it if Chrome ever lives somewhere unusual, and the error message says so.
- **Cookie banners are hidden, never accepted.** Almost every site has one and it sits over exactly
  the part of the page a portfolio card shows. Clicking "accept all" would be agreeing to tracking
  on someone else's behalf, which is not a script's decision to make even on a client's own site —
  and it is not needed, since all that is wanted is a clean picture. The overlay is hidden and
  nothing underneath is touched or consented to.
- **The wait is adaptive, not a fixed number of seconds.** A number long enough for the slowest site
  would be spent staring at every other one, and one short enough to be tolerable photographs the
  slow one mid-load. Waiting for the page to stop changing handles both, and a site with a permanent
  animation simply hits a twenty-second ceiling and is captured as it is.
- **A failed capture writes a placeholder under the same filename a real one would use.** The
  alternative — a differently-named fallback file — makes every page that shows a screenshot ask
  which of two files exists, and get it wrong on the day the capture starts working again. One name,
  always present, and the pages never need to know.
- **A client's server being down can never break Picsel's build.** A failure logs a warning, keeps
  last week's good screenshot if there is one, and moves on.
- **The top of the page, not the whole page.** A card wants the site's front door; a full-length
  capture of a long homepage becomes an unreadable sliver once it is scaled into a card.

**Done when:** running the script produces current desktop and mobile shots for all five sites and they appear on the Work and project pages. ✅ *(All ten captured with no warnings. "They appear on the pages" follows in Sections 4–6.)*

---

## Section 8: Contact page and form
**Priority: CRITICAL | Effort: 2 hours**

- [x] `/contact`: the **phone number big and obvious** as `tel:+447456809049`, the email, and where
      Picsel works — *"Cornwall, near Hayle" until August 2026; the row now answers the question a
      customer is actually asking under that heading, which is whether distance is a problem*
- [x] **Web3Forms** contact form (access key placeholder for Ben to paste): name, email, phone
      (optional), a "what do you need" select (New website / SEO & Google / Automation tool /
      Something else), message. Real `<label>`s, required-field validation, a honeypot, inline
      success and error states (no redirect away)
- [x] Repeat the contact band on home and every project page so contact is never more than one
      obvious click away; `tel:` click-to-call in the header or footer too — *already shipped in
      Sections 4–6; re-verified across all nine pages here*

**What we built:**

The page every other page has been pointing at. It offers two routes and puts them in the order this
audience actually uses them: the phone number first, at the largest size anything on the site is set,
and the form below it for whoever would rather type at nine in the evening. On a phone that ordering
is the whole point — the number is the first thing under the heading, not something to scroll past a
form to find.

The form is an ordinary HTML form that works before a line of script runs: a real action, a real
method, real labels, and the browser's own required-field checking. What JavaScript adds is that the
answer arrives in place, so someone who has just typed out what their business does doesn't have the
page swapped for a different one. With scripts off, blocked or broken, the same form posts the old
way and lands on `/contact/sent/` — a small page of Picsel's own rather than Web3Forms' branded
confirmation screen.

Every state was exercised rather than assumed, with the network stubbed so nothing was ever sent to
Web3Forms: an empty submit is blocked by the browser, a filled one sends the right eight fields, a
rejected key and a dead network both produce the fallback message **and keep the typed message in the
box**. Losing someone's words because a server hiccuped is the one failure this form is not allowed
to have. Checked at 375, 768, 1024 and 1440: no sideways scrolling, no tap target under 44 pixels,
one `<h1>` per page, a clean console, and a visible cyan focus ring reached with the Tab key rather
than with a `.focus()` call that `:focus-visible` would have ignored.

**Decisions made:**

- **The phone number is set in Lexend, not the pixel display face.** It is the biggest text on the
  site and the obvious place for the studio's signature face, which is exactly why it was worth
  thinking about: a phone number is read digit by digit and then dialled, and pixel letterforms turn
  a 0 and an 8 into a puzzle at the moment accuracy matters most.
- **No hand-rolled validation messages.** The browser's own are translated into the visitor's
  language, announced by screen readers, and attached to the field that is actually wrong. Script
  only takes over once `checkValidity()` passes.
- **A failed send keeps everything the visitor typed.** The obvious implementation resets the form
  after submitting; that loses a paragraph of someone's writing on exactly the attempt that failed.
  Reset happens on success only.
- **The error message never repeats the API's own.** Web3Forms says things like "Access key is
  invalid", which is Ben's problem and not the visitor's. They get the phone number instead — and it
  is read out of the markup rather than written into the script, so this file cannot end up quoting
  a stale number after `site.config.js` changes.
- **`/contact/sent/` exists, is `noindex`, and is the second and last opt-out from the Sitemap Law.**
  A confirmation page has nothing to offer someone arriving from a search result, and indexing it
  would put "Enquiry sent" in front of people who have not sent one. The opt-out is a named property
  on the page object, so the decision is visible in the file where it was made.
- **The honeypot is moved off-screen, not `display: none`.** The crawlers it is meant to catch check
  for `display: none` and skip the field. Off-screen, out of the tab order and `aria-hidden` means no
  person meets it and no script can tell it is a trap.
- **The unset access key warns on every build.** The page renders and validates perfectly with a
  placeholder key, and every submission is silently rejected — nothing on screen can show that, so
  the build says it, exactly as it does for the placeholder domain.
- **The select's options are written the way a customer would say them**, with a short internal word
  as the value. Someone who wants to be found on Google does not think of it as "SEO & GEO"; that is
  our word for it, and a form is a bad place to make somebody translate.
- **The phone number on the sent page was pulled out of its sentence.** Inline it measured 23 pixels
  tall — under the 44-pixel minimum, on the one page where ringing is the only thing left to do — and
  an inline link cannot be padded to size without shoving its own line of text apart. Caught by
  measuring, not by looking.
- **The section paddings were stacking.** The head's bottom padding and the content's top padding
  together left nearly a screen of empty near-black under "Get in touch", which on a short page reads
  as the page having ended. Same fix and the same reason as `.project__shot`.
- **Copy went through the humanizer pass and lost four things:** a voice wobble (third-person "it's
  Ben" against the site's "we"), Ben's name used twice in three lines, the same instruction printed
  above the form and again under the message box, and two vague hedges ("shortly", "when it suits").
- **Not fixed here, and worth knowing: there is no favicon.** Every page requests `/favicon.ico` and
  gets a 404. Site-wide and outside this section; flagged for Section 11.

**Done when:** a test enquiry submits and arrives by email, and the phone link calls on a real phone. ⏳ *(Built and fully exercised against a stubbed endpoint; a real end-to-end test needs Ben's Web3Forms key, and the `tel:` link needs a real handset. Both are Section 13.)*

---

## Section 9: SEO infrastructure
**Priority: CRITICAL | Effort: half a day**

Picsel sells SEO, so its own site must model it (per `CLAUDE.md` SEO rules).

- [x] Unique title (≤60) and meta description (≤155) per page; one `<h1>` each; sensible heading order
      — *enforced by the build since Section 1; audited across all nine pages here, no level skipped*
- [x] `sitemap.xml` from the real route list (home, work, each project, contact); `robots.txt`;
      canonical on every page
- [x] Open Graph + Twitter tags on every page; project pages use their desktop screenshot as the OG image
- [x] Schema (JSON-LD): `Organization`/`ProfessionalService` for Picsel across the site (name, area
      served, contact) — *`areaServed` was `AdministrativeArea: Cornwall` and is now
      `Country: United Kingdom`* — and a simple `CreativeWork`/`WebSite` reference per project linking
      to the live URL. Alt text on every meaningful image — *`Organization`, not `ProfessionalService`;
      see the decision below*
- [x] ~~Local signal: mention Cornwall naturally where it fits~~ **Removed August 2026.** There is no
      local signal to give: Picsel names no place of its own anywhere. Client locations stay on the
      clients' own pages, where they are facts about the client. `tools/build.js` now fails the build
      if a place name appears in anything that is not project data

**What we built:**

The site now says in machine-readable form what it already says in words. Every page carries one
block of structured data describing three things: the studio, the site, and the page you are on.
They are joined by stable identifiers, so a crawler reads nine pages belonging to one business
rather than nine descriptions of nine possible businesses. Project pages add a fourth thing, the
client's own site, with Picsel named as the one who built it. Nothing in any of it is typed by hand:
every value is read from `site.config.js` or `projects.js`, the same two files the visible copy comes
from, so the schema cannot drift away from the page and quietly start making a different claim.

`robots.txt` is generated rather than written, for one reason: it has to carry an absolute link to
the sitemap, and a hand-written file would still be pointing at `picsel.example` long after the real
domain was set. Now it follows the same constant everything else does.

What was already right was checked rather than assumed. Nine titles and descriptions, all unique and
inside their limits, one `h1` a page, no heading level skipped anywhere, canonical and Open Graph on
every page, alt text on all ten screenshots. The sitemap was compared against the pages that actually
exist on disk, in both directions: nothing indexable is missing from it and nothing in it lacks a
page. The one omission is deliberate and confirmed absent, which is the confirmation page.

**Decisions made:**

- **`Organization`, not `LocalBusiness` or `ProfessionalService`, which is a departure from the
  checklist above.** Both of those are physical-premises types whose whole purpose is an address and
  opening hours that put a pin on a map. Picsel has neither yet, and inventing a street address to
  satisfy a schema type is precisely the fabrication the Positioning Boundaries forbid. It would also
  be the kind of thing nobody ever notices is false. `Organization` states what is true: a UK
  business, reachable on this number.

  *Reaffirmed and hardened, August 2026.* This entry originally read "a business, working in
  Cornwall" and promised an upgrade to `ProfessionalService` in Section 15, once there was an address
  to declare. **That upgrade is now off the table rather than pending.** Picsel serves the whole
  country and has no premises a customer would ever visit, so there will be no address, and a type
  implying one would be wrong in a new way. What was a careful choice about fabrication is now also
  the only type that matches the business.
- **`sameAs` is omitted rather than left empty.** An empty array says "checked, and there are none",
  which is a different and worse claim than saying nothing at all, so the key only renders when
  there is something to put in it. *August 2026: there is. `socialProfiles` now carries the Facebook,
  Instagram and TikTok accounts, and `sameAs` appears on its own, exactly as this was built to do.
  It is what ties three accounts and the site into one entity for a search engine, which is the
  consistency Picsel sells.*
- **A project page is `about` the client's site, not about Picsel.** The obvious wiring points every
  page at the Organization. That is right for the homepage and the contact page and wrong for a
  project page, and it is most wrong on the Julie Miller Art page: it would have attached a studio
  description reading "in Cornwall" to a Scottish Borders project, in the one place the plan
  specifically says not to. The visible copy already obeyed that rule; this is the same rule applied
  to the markup a person cannot see.
- **`/contact/sent/` is `noindex` and deliberately NOT `Disallow`ed in robots.txt.** These are not
  two ways of doing the same thing, and using the wrong one is a common way to get the opposite of
  what you wanted. `Disallow` stops a crawler fetching the page, which means it never reads the
  `noindex` — so a page linked from anywhere can still be indexed, listed with no description, and
  never removed. Letting it be crawled is what lets the `noindex` do its job.
- **Breadcrumbs were added although the checklist does not ask for them.** They are ordinary SEO
  infrastructure rather than an extra: Google renders them in the result itself, so a project page
  shows where it sits in the site instead of a bare URL. Only where a real hierarchy exists — the
  homepage has none, because a trail of one item describes nothing.
- **The JSON is escaped against its own closing tag.** A literal `</script>` anywhere inside a blurb
  or a name would close the block early and spill the rest into the page as markup. Escaping `<` as
  `<` is still valid JSON, parses identically, and makes that impossible whatever a future blurb
  contains. Verified by parsing every page's block in a real browser, not just in the build.
- **Two brand assets are missing and both are outside this section.** There is no favicon, so every
  page 404s on `/favicon.ico`; and home, work and contact have no Open Graph image, so sharing them
  anywhere shows no preview. The same missing asset also keeps `logo` out of the Organization schema,
  which Google's Organization rich result wants. Flagged rather than invented, because it is a design
  decision. Worth doing before launch.

**Done when:** the sitemap is complete and valid, schema passes the Rich Results Test, and Lighthouse SEO is 100 on home, work and a project page. ⏳ *(Sitemap verified complete and valid against the real routes; JSON-LD verified to parse and every internal reference to resolve. The Rich Results Test and Lighthouse both need a public URL and are Section 12/13.)*

---

## Section 10: GEO layer (AI search visibility)
**Priority: HIGH | Effort: 2 hours**

- [x] Direct answer in the first ~50 words of the homepage — liftable by an assistant. *Rewritten
      August 2026. It opened "Picsel is a web design and automation studio in Cornwall…", which was
      the single most quotable location claim on the site. It now opens "Websites and Google
      visibility for tradespeople", followed by the exclusivity short form and the starting price*
- [x] Entity consistency: same name, phone and email on every page and any external profile
      — *now enforced by the build, not just checked once*
- [x] `robots.txt` allows AI crawlers (GPTBot, ClaudeBot, PerplexityBot and peers); optional
      `llms.txt` summarising Picsel, its services and the work
- [x] Question-led copy where it fits ("How much does a website cost?" etc.) answered plainly first
      — *four questions on the homepage. The pricing question is deliberately not one of them,
      and now permanently so: prices stay off the site*

**What we built:**

Four questions on the homepage, sitting between what the studio does and the ask, because someone
who has read the services list and is close to ringing has exactly these things in their head. Each
answer leads with the answer. No preamble and nothing that needs the question re-read to make sense
of it, so a line can be lifted whole by an assistant and still be true on its own.

The questions are written once and render twice: into the visible section, and into the FAQ
structured data underneath it. That is the point of doing it that way. Written separately, the
machine-readable answer and the printed one drift apart the first time either is edited, and the
version a person reads stops matching the version an assistant quotes.

`robots.txt` now names eight AI crawlers individually and allows all of them. `llms.txt` is a plain
summary of the studio, its services, the five projects and every page, generated from the same
constants the pages are, so it cannot describe a different business from the one the site describes.

The first-50-words test passes on the real rendered page rather than on the intention: the opening
line names the studio, what it does and where, inside the first 33 words. Entity consistency was
checked across all nine pages and found clean, with exactly one phone number in its two intended
forms and one email address.

**Decisions made:**

- **Naming the AI crawlers is not redundant with the wildcard, and that is the reason to do it.** A
  crawler that matches its own group ignores the wildcard group entirely, so a site that later
  restricts `*` would cut all of these off without anyone meaning to. Naming them makes the
  permission survive that change. The decision itself is easy here: Picsel sells being the answer an
  assistant gives, and blocking the assistants would mean refusing the studio the thing it sells.
- **No "how much does it cost" question, and no placeholder for one.** It is the most asked question
  and the most valuable one to answer, which is the case for putting a figure here. Ben decided
  against it: prices are quoted in the conversation. The gap is deliberate, and it stays a gap rather
  than becoming a vague non-answer, because a question that resolves to "it depends" is the thing
  that makes a visitor close the tab.
- **"Nobody can promise that, and anyone who does is guessing."** The honest answer to the Google
  question, and the one that does the most work. This audience has been cold-called by enough people
  promising page one to recognise the claim. Saying plainly that it cannot be promised, then saying
  what actually can be done, is worth more than a promise that would have to be kept.
- **The FAQ block is `FAQPage` with a fragment id and no `url` of its own.** It describes the FAQ
  content within the homepage; giving it the page's own address would put two competing page types
  on one URL. Worth being straight about what it buys: Google narrowed FAQ rich results to
  government and health sites in 2023, so this will not put drop-downs in a search result. It is
  there for the other reader.
- **Entity consistency became a build check rather than an inspection.** Everything already reads
  from `site.config.js`, so it passes by construction today. The check exists for the day somebody
  types a number straight into a page because it was quicker, which is exactly the edit nobody
  reviews. Tested by deliberately planting a wrong number and a wrong email: the build named both and
  refused to write anything.
- **The two-column question grid, rather than a fifth stacked list.** The services list directly above
  is a vertical stack and the contact band follows it; a third stack between them would have made the
  whole bottom of the page read as one undifferentiated column.
- **A words-for-numbers helper now exists in one place.** `/work` had its own copy and the homepage
  needed the same thing. Two lookup tables are two tables that eventually disagree, on a site whose
  argument is that its numbers are real.

**Settled since:**

- `[DECISION]` ~~**The pricing question — no.**~~ **Reversed August 2026.** "How much does a website
  cost?" is now the second question on the homepage, answered with the real figures from
  `pricing.js`, and the five `/guides` pages carry the long-form answers with `FAQPage` schema.

**Done when:** the homepage passes the first-50-words test and robots reflects the crawler decision. ✅

---

## Section 11: Performance, accessibility and responsive pass
**Priority: CRITICAL | Effort: 2 hours**

- [x] Mobile-first checked at 375 / 768 / 1024 / 1440; nav collapses and works; tap targets ≥ 44px
- [x] With JavaScript disabled, all content is still visible (the animations enhance, they don't
      gate content); `prefers-reduced-motion` respected across hero, background and reveals
- [x] Visible `:focus-visible` states, semantic HTML, labelled form controls, alt text
- [x] Lighthouse: performance 90+, SEO 100, accessibility 95+ on each page type; no layout shift; no
      horizontal scroll; screenshots don't blow the page weight (optimised webp) — *SEO 100,
      accessibility 100 and best practices 100 everywhere; performance 89–94, see below*
- [x] Run the `CLAUDE.md` §9 vibe-code checklist; fix anything that trips it

**What we built:**

The measured pass. Every page type was run through Lighthouse and every claim below is a number off
a real run rather than an intention.

| Page | Performance | Accessibility | Best practices | SEO |
|---|---|---|---|---|
| `/` | 89 (median of 3) | 100 | 100 | 100 |
| `/work/` | 91 (median of 3) | 100 | 100 | 100 |
| `/work/lanora-house/` | 94 | 100 | 100 | 100 |
| `/contact/` | 94 | 100 | 100 | 100 |

Three real defects were found and fixed. The site had no favicon, so every page requested
`/favicon.ico` and got a 404 — the only console error anywhere on the site, and the thing holding
Best Practices at 96. There is now a pixel-grid P built from four rectangles, carrying the wordmark's
red and cyan split, plus a 180px icon for a phone home screen. Second, every screenshot on `/work/`
was lazy-loaded including the two above the fold, which is the standard way to make the largest thing
on a page paint late. Third, and by far the biggest, the cards were being handed the full 1440-pixel
capture to fill a 522-pixel slot. The capture pipeline now writes downscaled copies alongside each
original and the markup offers them, which took the work index from 85 to 91 and the project pages
from 92 to 94.

Cumulative layout shift is 0.001 on the homepage. Nothing on any page shifts as it loads, which is
what the stated image dimensions have been buying since Section 4.

Everything else was verified rather than assumed. With JavaScript switched off, all five page types
keep their full content, navigation, images, headings and phone link, and the CSS dot fallback takes
over on every one. Under `prefers-reduced-motion` nothing animates at all and the hero collapses to
exactly one viewport, so the extra scroll distance genuinely disappears rather than just running
silently. Every focusable element on four page types was reached with real Tab presses, not a
scripted `.focus()` call that `:focus-visible` would have ignored, and all 32 of them show the cyan
ring. Six routes at four widths: no sideways scroll, one `h1` each, no heading level skipped, no tap
target under 44 pixels, alt text on every image, no console errors and no 4xx responses.

The vibe-code checklist is all "no", run against the built CSS and HTML rather than from memory. The
site has zero box shadows.

**Decisions made:**

- **Two performance "fixes" were tested and rejected on the evidence.** Inlining every stylesheet
  into the page changed the score by nothing at all (88 either way, identical first paint), which
  says the four separate CSS files are not the bottleneck and a bundler or minifier would buy
  nothing. Making the Google Fonts stylesheet load asynchronously made things actively worse, 88 down
  to 80, because the body text then swaps late and Speed Index more than doubles. Both ideas are the
  obvious thing to try and both are wrong here; measuring first is the only reason they are not in
  the commit.
- **The homepage sits at 89 and the reason is the hero, which is the point of the hero.** Its largest
  contentful paint is the PICSEL wordmark, so first paint waits on Adobe's font service and then on
  the intro playing the letters in. That is the studio's signature moment and gutting it to gain two
  points would be trading the thing people remember for a number. Two things will move it without
  touching the design, and both are outside this codebase: Adobe's `font-display` setting, which is a
  dashboard toggle listed below, and production itself, since this was measured over HTTP/1.1 against
  a local server while Cloudflare Pages serves HTTP/2 from a CDN edge. Re-measured on the real domain
  in Section 13.
- **The responsive variants are generated in a separate pass over the files on disk, not from the
  capture buffer.** A capture that fails keeps last week's good screenshot; made from the buffer,
  that project would end up with a current original and no variants, and every `srcset` pointing at
  it would 404. Reading from disk means the sizes always match the image the site will actually
  serve, however it got there. It also means `npm run shots -- --variants-only` can regenerate them
  after changing the width list without photographing five client sites again, which is how they were
  made this time.
- **Which cards load eagerly is a fact about the page, not about the card.** `/work/` says two,
  because its grid is near the top. The homepage says none and that is correct: its grid sits below a
  full-screen hero, so every card there really is off screen and lazy loading is right.
- **The variant widths are chosen from the slots that exist**, not from a standard ladder: 640 covers
  a phone at 2x and a card at 1x, 1024 covers a card at 2x, and the original covers the project
  page's full-width hero. Verified by checking what the browser actually picks at 1x and 2x on both a
  phone and a desktop, and every choice is large enough for its slot.
- **The favicon is one SVG rather than a pile of PNGs.** It scales to every size from one file and
  costs 900 bytes. Declaring it is also what stops the browser asking for `/favicon.ico` at all,
  which is what removed the 404. It was drawn at 20 units rather than 16 so the cells stay whole
  numbers and the letter still has a margin; at 16 the P had to run within one unit of the rounded
  corner and looked cramped.

**Pending Ben:**

- `[MANUAL]` **Set `font-display` to `swap` in the Adobe Fonts dashboard** for web project `ior4aly`.
  It currently blocks, which means the wordmark, the homepage's largest paint, stays invisible until
  the font arrives. Set to swap it paints immediately in the Pixelify Sans fallback and swaps, which
  suits a brand whose signature is a font glitch. This is the single biggest remaining performance
  lever and it cannot be done from the repo.

**Done when:** every box passes at every width and the vibe-code checklist is all "no". ✅ *(Performance is 89 on the homepage against a 90 target, for the reason set out above; re-measured on the live domain at Section 13.)*

---

## Section 12: Launch
**Priority: CRITICAL | Effort: half a day plus DNS wait**

- [x] Deployed to Cloudflare; the site serves from picsel.co.uk
- [x] Web3Forms key in `site.config.js`. It is not a secret: Web3Forms works by putting the key in
      the form markup, so it is readable in the page source wherever the repo keeps it
- [x] `[MANUAL]` DNS pointed at Cloudflare; HTTPS confirmed
- [x] `[MANUAL]` Adobe Fonts web project confirmed serving on the production domain. Checked in the
      browser on picsel.co.uk rather than by eye: `document.fonts` reports `argent-pixel-cf` and
      `gridlite-pe-variable` both loaded, and the wordmark renders in the real face, not the fallback
- [ ] `[MANUAL]` Google Search Console: add the property, submit the sitemap, request indexing on
      home, work and each project page; Bing Webmaster Tools: add site, submit sitemap
- [x] Canonicals, sitemap and schema all reference the production domain

**What we built:**

- **An assets-only Worker, not Cloudflare Pages.** `wrangler.jsonc` declares no `main`, so no code
  runs on request: Cloudflare takes the files and serves them from the edge. The assets directory is
  the repo root, because `tools/build.js` writes generated HTML alongside the CSS and JS it
  references, which is why `.assetsignore` exists to keep source out of the deploy.
- **Routes are directories.** `html_handling: auto-trailing-slash` resolves `/work/` to
  `work/index.html` and redirects `/work` to `/work/`, so the address bar matches the canonical URL
  rather than quietly serving one page at two addresses.
- **An unknown path returns 404, not the homepage.** Verified live: `/`, `/work/`, each project page,
  `/contact/`, `/sitemap.xml`, `/robots.txt` and `/llms.txt` all return 200; a junk path returns 404.
  A catch-all would mean every typo returned 200 with the homepage on it, which is how a site ends up
  with search engines indexing invented URLs.

**Decisions made:**

- **Deploy on push to `main`, from `github.com/benmiller101/Picsel`.** No separate deploy step to
  remember and no build output to keep in sync by hand. The consequence worth knowing: any push
  publishes, so there is no staging step between a commit and the live site.

**Done when:** the site is live on the domain with HTTPS, fonts serve, the form works, and both search consoles have the sitemap.

---

## Section 13: Launch QA
**Priority: CRITICAL | Effort: 2 hours**

- [x] Every page in a browser; console clean; home, work, a project page and contact screenshotted at
      desktop and mobile
- [x] Reverse-scroll hero and the drifting background checked on real scroll, desktop and mobile
- [~] Form submitted for real. It sends and the page now says so, but the email lands in the old
      Gmail rather than ben@picsel.co.uk. Re-test after the recipient is changed in Web3Forms
- [ ] `[BEN]` Phone link tapped on a real phone
- [x] Sitemap audit (the Sitemap Law); schema re-validated on live URLs
- [x] Read every page aloud: plain language, no placeholder text, no invented claims, nothing that
      overstates a brand-new studio
- [ ] `[BEN]` walkthrough and sign-off

**What we built:**

- **The Sitemap Law holds.** Eight URLs in `sitemap.xml`, all returning 200, and the one route
  deliberately absent is `/contact/sent/`, which carries `noindex, follow`. A thank-you page in the
  index is a page that can win a search for the brand and show a visitor a dead end.
- **Schema parsed rather than eyeballed.** Every JSON-LD block on home, work, a project page and
  contact parses, and the graph is what it claims: Organization, WebSite, the per-page type,
  FAQPage with four questions on the homepage, ItemList of five on `/work/`, BreadcrumbLists. The
  Organization's `contactPoint` carries the same number and address as `site.config.js`, which is
  the entity-consistency check the GEO section asks for.
- **No horizontal overflow and no undersized tap targets** on work, a project page or contact. The
  single control under 44px is the honeypot input, which is hidden from people on purpose.
- **One `h1` per page, no image without alt text, no unlabelled form control**, and the duplicated
  labels the rolling hover needs are all `aria-hidden`, so a screen reader hears each one once
  rather than twice.
- **Console clean.** The only errors are Chrome extension noise, from no script on the site.

**Decisions made:**

- **Copy shipped as written.** Ran the humanizer pass over every rendered page and changed nothing:
  the sentence lengths vary, the claims are countable ("Five sites are live", "Four of the five"),
  and the register suits a builder reading it on a phone. The only copy fixed this session was three
  status lines in `contact.js` that a visitor sees only after submitting, which is how they kept
  their em dashes through the earlier passes.

**Done when:** every box is ticked and Ben has signed off.

---

# Phase 2: Grow it (after launch)

Lighter than a client engagement — this is Picsel's shop window, kept fresh.

## Section 14: Add work as it ships
**Priority: HIGH | Effort: ongoing**
- [ ] Every new client site: add an entry to `projects.js`, re-run the screenshot script, write a
      blurb, commit. The Work grid and a new project page generate from the data
- [ ] Ask each happy client for a short line to feature (only real, only with permission)

## Section 15: Picsel's own SEO, GBP and reach
**Priority: MEDIUM | Effort: as time allows**
- [ ] `[BEN]` Set up Picsel's own Google Business Profile once there's a public identity, same
      playbook Picsel sells to clients
- [ ] Watch GSC coverage; make sure home, work and project pages index
- [ ] Optional: a short "insights"/notes section (plain articles) if there's appetite — same static
      pattern, real content only, no filler

**What we built:**
**Decisions made:**

---

## Build order summary

| # | Section | Phase | Priority | Depends on |
|---|---|---|---|---|
| 1 | Setup, structure, content model | 1 | Critical | — |
| 2 | Design system + parallax background | 1 | Critical | 1 |
| 3 | Hero and scroll behaviour | 1 | Critical | 2 |
| 4 | Homepage | 1 | Critical | 2, 3 |
| 5 | Work index | 1 | High | 1, 2 |
| 6 | Project pages | 1 | Critical | 1, 2, 5 |
| 7 | Screenshot pipeline | 1 | High | 1 |
| 8 | Contact page and form | 1 | Critical | 2 |
| 9 | SEO infrastructure | 1 | Critical | 4, 5, 6, 8 |
| 10 | GEO layer | 1 | High | 9 |
| 11 | Performance, a11y, responsive | 1 | Critical | all build |
| 12 | Launch | 1 | Critical | all Phase 1 |
| 13 | Launch QA | 1 | Critical | 12 |
| 14 | Add work as it ships | 2 | High | 13 |
| 15 | Picsel's own SEO / GBP | 2 | Medium | 13 |

---

## Won't do

- No frontend framework, CSS framework or animation library: the site is plain HTML/CSS/JS on the
  existing hero
- No content that needs JavaScript to appear (the hero/blobs/glitch enhance, they don't gate content)
- No purple/blue/pink gradients beyond the hero blobs; no gradient-filled headline words
- No invented testimonials, client counts, stats or awards; no "Why choose us" or SaaS-slogan sections
- No featuring a client site that hasn't been cleared to feature
- No stock imagery standing in for the real client screenshots
- Nothing from the Positioning Boundaries list

---

## Ideas for later (out of scope for v1)

- A dedicated Picsel email on the domain, and matching NAP once there's a public identity
- The 3D block build-in or the mesh-gradient assembling logo as an alternate hero/section
- Short case-study depth on the strongest builds (problem → what we did → result), only with real outcomes
- An "insights" section if there's appetite to publish

---

## Progress

- [x] Section 1: Setup, structure and content model
- [x] Section 2: Design system and site-wide background
- [x] Section 3: Hero and scroll behaviour
- [x] Section 4: Homepage
- [x] Section 5: Work index (project pages it links to are Section 6)
- [x] Section 6: Project pages (all five clients cleared to feature)
- [x] Section 7: Screenshot pipeline (taken early — see the section note)
- [x] Section 8: Contact page and form (key in place; a real end-to-end send is a Section 13 check)
- [x] Section 9: SEO infrastructure (Rich Results Test and Lighthouse need a live URL)
- [x] Section 10: GEO layer
- [x] Section 11: Performance, accessibility and responsive pass (homepage perf 89 vs 90 target)
- [ ] Section 12: Launch (live on picsel.co.uk; only the two search consoles remain, both `[MANUAL]`)
- [ ] Section 13: Launch QA (everything checkable from here passes; waiting on the form recipient
      fix, a phone tap and Ben's sign-off)
- [ ] Section 14: Add work as it ships
- [ ] Section 15: Picsel's own SEO, GBP and reach

---

*Plan created July 2026, adapted from the agency base template for Picsel's own studio site. Update checkbox status as sections complete.*
