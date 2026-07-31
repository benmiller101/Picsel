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

## Site profile

Single source of truth. If a fact changes, change it here first, then everywhere it appears.

| Field | Value |
|---|---|
| Studio name | Picsel (working name; "Design Studio" tagline in the hero) |
| What it is | Portfolio + lead-gen site for a Cornwall web design and automation studio |
| Audience | Small businesses and trades, mostly Cornwall, mostly **not tech-savvy** — easy nav and an obvious way to make contact are the whole job |
| Positioning | Affordable but effective websites, SEO and GEO, Google Business Profile help, and custom automation tools; one client per trade per town (exclusivity); local and fast |
| Owner / contact | Ben Miller · 07456 809049 (`tel:+447456809049`) · benwmiller101@gmail.com |
| Dedicated studio email | `[DECISION]` use benwmiller101@gmail.com for now, or set up info@ on the Picsel domain |
| Domain | `[DECISION]` not chosen yet (e.g. a picsel… .co.uk / .studio). Register in Picsel's own account |
| Hosting | Cloudflare Pages (same as client builds) |
| Stack | Static multi-page HTML/CSS/JS, built **on top of the existing hero** (`hero.css`/`hero.js`; the prototype `hero.html`, `nav.css` and `nav.js` were deleted in Section 3 when the hero became the homepage). No framework. Pages are generated from one shared template by `tools/build.js` (`npm run build`) so the `<head>`, nav and footer exist once; the output is plain static HTML |
| Repo | Local git repo on `main`. **Pending:** no GitHub remote yet — the `gh` CLI is not installed on this machine, so the remote must be created before Cloudflare Pages can connect (Section 12) |
| Fonts | Adobe Fonts web project `ior4aly` (`argent-pixel-cf`, `gridlite-pe-variable`, `pf-pixelscript`, `pixelify-sans`) + Google `Lexend` (body) and `Pixelify Sans` (fallback pixel face) |
| Contact form | Web3Forms (free, access key in the dashboard) |
| Brand aesthetic | Dark near-black, lava-lamp gradient blobs (hero only), near-invisible dot-grid texture, PICSEL pixel wordmark with a font-glitch |
| Show pricing? | `[DECISION]` the founding offer is £199 build + £39/mo (rising to £299). Deciding whether to state it on the site |
| Featured projects | The five below |

### The five projects (source of truth for `projects.js`)

| Slug | Name | URL | Sector | Location | Featured |
|---|---|---|---|---|---|
| nevitt-construction | A Nevitt Construction — settled, the live site brands itself this; haylebuilders.com is only the domain | https://haylebuilders.com/ | Construction | Hayle, Cornwall | yes |
| lanora-house | Lanora House | https://www.lanorahouse.com/ | House clearance | Hayle, Cornwall | yes |
| ajc-removals | AJC Removals & Clearances | https://ajcremovals.co.uk/ | Removals & clearance | Cornwall | yes |
| julie-miller-art | Julie Miller Art | https://juliemillerart.co.uk/ | Artist portfolio | Scottish Borders | yes |
| house-of-cornwall | House of Cornwall | https://houseofcornwall.live/ | Antiques & auctions | Hayle, Cornwall | yes |

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
- [ ] `[DECISION]` Domain chosen and registered in Picsel's own account
- [ ] `[DECISION]` Studio contact email (Gmail for now vs info@ on the domain)
- [ ] `[DECISION]` Whether to show the founding-offer pricing on the site
- [ ] `[BEN]` **Confirm each of the five clients is happy to be featured.** Blocks Section 6 shipping.
      Worth a specific note on two: Lanora House (Ben is a director) and House of Cornwall, whose own
      site states it is affiliated with Lanora House — two of the five featured projects are
      connected businesses, which is fine to show but should be a conscious choice
- [x] `[BEN]` First project's display name — settled as **A Nevitt Construction** (its own site's
      header and title; `haylebuilders.com` is only the domain)
- [ ] `[BEN]` Reword the five draft blurbs if wanted. Drafts are in `projects.js`, written from what
      each live site says about itself and claiming no outcomes
- [ ] `[BEN]` **Confirm the `tags` per project.** All five currently read `['Website']` only, since
      that is all that is verifiable from the outside. Add `'SEO'` / `'Google Profile'` only where
      Picsel actually did that work — these are public claims
- [x] `[BEN]` Project list supplied (names, URLs, sectors) — done

### Required before launch
- [ ] `[MANUAL]` Web3Forms access key created and pasted into the form
- [ ] `[MANUAL]` Adobe Fonts web project confirmed serving on the production domain

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
- [ ] `[DECISION]` Founding-offer pricing block if Ben wants it on the site — **pending Ben.**
      Nothing is built for it and nothing is stubbed; the page reads as finished without it. If it
      goes in, it sits between the services list and the contact band
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
- **No pricing block, and no placeholder for one.** The founding-offer decision is Ben's and still
  open. A greyed-out "pricing coming soon" would be worse than nothing on a site whose whole pitch
  is that it is finished and real.
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

**Done when:** the homepage tells a non-technical visitor what Picsel is, shows the work, and makes contact obvious, with no placeholder text. ✅ *(Pricing block pending Ben's decision; the page is complete without it.)*

---

## Section 5: Work index
**Priority: HIGH | Effort: 2 hours**

- [ ] `/work`: every project from `projects.js` as a card (desktop screenshot, name, sector label),
      generated from the data so adding a project is one entry
- [ ] Clear hover/focus states (cards must look clickable); links go to `/work/<slug>`
- [ ] Contact band at the foot

**What we built:**
**Decisions made:**

**Done when:** all five projects show as cards and every card opens the right project page.

---

## Section 6: Project pages
**Priority: CRITICAL | Effort: half a day**

- [ ] One **static HTML page per project** (own URL, title, meta) generated from `projects.js` + a
      shared template
- [ ] Layout: project name (pixel display, restrained), sector label, the desktop screenshot as the
      page hero, the blurb in Lexend, the small "what we did" tags, a **prominent "Visit the live
      site" button** opening the client `url` in a new tab (`rel="noopener"`), the mobile screenshot
      alongside, previous/next project links, and the contact band
- [ ] Calm dark framing so the screenshot carries the colour; simple device/browser frame, no glassmorphism

**What we built:**
**Decisions made:**

**Done when:** each of the five projects has its own page passing a read-aloud check, with a working live-site link and prev/next.

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

- [ ] `/contact`: the **phone number big and obvious** as `tel:+447456809049`, the email, and that
      Picsel is Cornwall-based
- [ ] **Web3Forms** contact form (access key placeholder for Ben to paste): name, email, phone
      (optional), a "what do you need" select (New website / SEO & Google / Automation tool /
      Something else), message. Real `<label>`s, required-field validation, a honeypot, inline
      success and error states (no redirect away)
- [ ] Repeat the contact band on home and every project page so contact is never more than one
      obvious click away; `tel:` click-to-call in the header or footer too

**What we built:**
**Decisions made:**

**Done when:** a test enquiry submits and arrives by email, and the phone link calls on a real phone.

---

## Section 9: SEO infrastructure
**Priority: CRITICAL | Effort: half a day**

Picsel sells SEO, so its own site must model it (per `CLAUDE.md` SEO rules).

- [ ] Unique title (≤60) and meta description (≤155) per page; one `<h1>` each; sensible heading order
- [ ] `sitemap.xml` from the real route list (home, work, each project, contact); `robots.txt`;
      canonical on every page
- [ ] Open Graph + Twitter tags on every page; project pages use their desktop screenshot as the OG image
- [ ] Schema (JSON-LD): `Organization`/`ProfessionalService` for Picsel across the site (name, area
      served Cornwall, contact), and a simple `CreativeWork`/`WebSite` reference per project linking
      to the live URL. Alt text on every meaningful image
- [ ] Local signal: mention Cornwall naturally where it fits (not on the Julie Miller page — that
      client is in the Scottish Borders)

**What we built:**
**Decisions made:**

**Done when:** the sitemap is complete and valid, schema passes the Rich Results Test, and Lighthouse SEO is 100 on home, work and a project page.

---

## Section 10: GEO layer (AI search visibility)
**Priority: HIGH | Effort: 2 hours**

- [ ] Direct answer in the first ~50 words of the homepage: "Picsel is a web design and automation
      studio in Cornwall building affordable, effective websites for local trades and small
      businesses…" — liftable by an assistant
- [ ] Entity consistency: same name, phone and email on every page and any external profile
- [ ] `robots.txt` allows AI crawlers (GPTBot, ClaudeBot, PerplexityBot and peers); optional
      `llms.txt` summarising Picsel, its services and the work
- [ ] Question-led copy where it fits ("How much does a website cost?" etc.) answered plainly first

**What we built:**
**Decisions made:**

**Done when:** the homepage passes the first-50-words test and robots reflects the crawler decision.

---

## Section 11: Performance, accessibility and responsive pass
**Priority: CRITICAL | Effort: 2 hours**

- [ ] Mobile-first checked at 375 / 768 / 1024 / 1440; nav collapses and works; tap targets ≥ 44px
- [ ] With JavaScript disabled, all content is still visible (the animations enhance, they don't
      gate content); `prefers-reduced-motion` respected across hero, background and reveals
- [ ] Visible `:focus-visible` states, semantic HTML, labelled form controls, alt text
- [ ] Lighthouse: performance 90+, SEO 100, accessibility 95+ on each page type; no layout shift; no
      horizontal scroll; screenshots don't blow the page weight (optimised webp)
- [ ] Run the `CLAUDE.md` §9 vibe-code checklist; fix anything that trips it

**What we built:**
**Decisions made:**

**Done when:** every box passes at every width and the vibe-code checklist is all "no".

---

## Section 12: Launch
**Priority: CRITICAL | Effort: half a day plus DNS wait**

- [ ] Deploy to Cloudflare Pages; confirm the preview on the pages.dev URL
- [ ] `[MANUAL]` Web3Forms key and any secrets set in the dashboard, not the repo
- [ ] `[MANUAL]` Point the chosen domain's DNS at Cloudflare Pages; confirm HTTPS
- [ ] `[MANUAL]` Confirm the Adobe Fonts web project serves on the production domain
- [ ] `[MANUAL]` Google Search Console: add the property, submit the sitemap, request indexing on
      home, work and each project page; Bing Webmaster Tools: add site, submit sitemap
- [ ] Canonicals, sitemap and schema all reference the production domain

**What we built:**
**Decisions made:**

**Done when:** the site is live on the domain with HTTPS, fonts serve, the form works, and both search consoles have the sitemap.

---

## Section 13: Launch QA
**Priority: CRITICAL | Effort: 2 hours**

- [ ] Every page in a browser; console clean; screenshot home, work, a project page and contact at
      desktop and mobile
- [ ] Reverse-scroll hero and the drifting background checked on real scroll and on mobile
- [ ] Form submitted for real (email arrives); phone link tapped on a real phone
- [ ] Sitemap audit (the Sitemap Law); schema re-validated on live URLs
- [ ] Read every page aloud: plain language, no placeholder text, no invented claims, nothing that
      overstates a brand-new studio
- [ ] `[BEN]` walkthrough and sign-off

**What we built:**
**Decisions made:**

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
- [x] Section 4: Homepage (pricing block still pending Ben's decision)
- [ ] Section 5: Work index
- [ ] Section 6: Project pages
- [x] Section 7: Screenshot pipeline (taken early — see the section note)
- [ ] Section 8: Contact page and form
- [ ] Section 9: SEO infrastructure
- [ ] Section 10: GEO layer
- [ ] Section 11: Performance, accessibility and responsive pass
- [ ] Section 12: Launch
- [ ] Section 13: Launch QA
- [ ] Section 14: Add work as it ships
- [ ] Section 15: Picsel's own SEO, GBP and reach

---

*Plan created July 2026, adapted from the agency base template for Picsel's own studio site. Update checkbox status as sections complete.*
