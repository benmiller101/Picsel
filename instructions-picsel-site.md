# Picsel: Studio Website Coding Instructions

This file lives in the `picsel` project root alongside `plan-picsel-site.md`.
Attach both at the start of every coding session. Governing design doc: `CLAUDE.md`
(the website design standards) — it outranks these instructions except where this file
records the one intentional brand exception (dark palette + the hero's gradient blobs).

---

## PRIME DIRECTIVE

- Work on **one file at a time**. Multiple simultaneous edits corrupt files.
- Explain what you are doing as you code. Teach, do not just produce.
- When unsure about any framework behaviour, hosting config, schema format, font loading or API
  response: say so and look it up rather than guessing.
- The plan file drives the work. If something worth doing is not in the plan, propose adding it first.

---

## HOW TO EXPLAIN YOUR WORK

Ben has a **design background, not a coding background**.

- Write as if explaining to a smart friend who has never written code.
- Say **what you built**, **what it does** for the visitor or for search, and **why** it was needed.
- Define any technical term immediately in plain words in brackets.
  - e.g. "`prefers-reduced-motion` (a setting some people turn on to reduce animation; we check it
    and calm the hero so the site is comfortable for them)".
- Keep it short, 2 to 4 sentences, real-world analogies where possible.

**Good:** "The background is now one fixed layer that the pages slide over, and it drifts upward
very slowly on its own — like a slow conveyor behind a shop window. That's why it feels alive but
never fights the text you're reading."

**Bad:** "Implemented a fixed-position canvas with a delta-time translate transform on the noise field."

---

## PLAN FILE: AUTO UPDATE REQUIRED

After completing any checklist item or section in `plan-picsel-site.md`, update it **immediately,
without being asked**. Do not say "you can mark this complete." **You do it.**

- Change `[ ]` to `[x]` for everything just finished.
- Update the Progress list at the bottom.
- Add a **"What we built"** plain-English summary under the section (2 to 4 sentences, no jargon).
- Add a **"Decisions made"** note for any choice that affects later sections.
- If a fact changed, update the Site Profile table too.

---

## SITE VARIABLES

Single source of truth for this build. If a value changes, change it here and everywhere it's used,
same session. The plan's Site Profile and this block must never disagree; the plan wins.

| Variable | Value |
|---|---|
| Studio name | Picsel (tagline "Design Studio") |
| Purpose | Portfolio + lead-gen for a Cornwall web design & automation studio |
| Audience | Cornwall small businesses and trades, mostly non-technical |
| Owner / contact | Ben Miller · 07456 809049 (`tel:+447456809049`) · benwmiller101@gmail.com |
| Domain | PENDING `[DECISION]` (register in Picsel's own account) |
| Hosting | Cloudflare Pages |
| Stack | Static multi-page HTML/CSS/JS on the existing hero; no framework |
| Fonts | Adobe web project `ior4aly` (`argent-pixel-cf` resting wordmark; `gridlite-pe-variable`, `pf-pixelscript`, `pixelify-sans` in the glitch) + Google `Lexend` (body) and `Pixelify Sans` (fallback) |
| Contact form | Web3Forms (access key in the host dashboard, not the repo) |
| Accent | one restrained accent from the brand glitch (cyan/magenta), used sparingly |
| Featured projects | five, defined in `projects.js` |

**The never-do list for this site (absolute):**

- No invented testimonials, client counts, years-in-business, awards or stat rows. Five projects is five.
- No purple/blue/pink gradients beyond the hero blobs; no gradient-filled headline words.
- No "Why choose us", no SaaS slogans, no jargon aimed at a non-technical audience.
- No featuring a client site not cleared to feature; no implied endorsement.
- No content that needs JavaScript to appear.

---

## WHAT THIS PROJECT BUILDS

A static portfolio site for Picsel: a dark animated hero, a Work grid, one static page per project
(built from `projects.js`), and a Contact page with a working Web3Forms form. Every visitor gets
plain HTML; the hero blobs, dot-grid and glitch **enhance** but never gate content. Screenshots of
the five live client sites are captured automatically by a script, not by hand.

---

## TECH STACK

- **Static HTML/CSS/JS**, built on the existing `hero.html/.css/.js` and `nav.css/.js`. No Astro,
  no React/Vue/Svelte, no Tailwind/Bootstrap, no animation library — the hero's animation is the
  studio's own vanilla JS and stays that way.
- **Cloudflare Pages**: hosting, per-branch preview deploys, custom domain, HTTPS.
- **Web3Forms** for the contact form (honeypot included).
- **Adobe Fonts** via the `ior4aly` web project `<link>` (already in `hero.html`); do **not** try
  to self-host those files. `Lexend`/`Pixelify Sans` via Google Fonts.
- **Playwright or Puppeteer** (dev-time only) for the screenshot script; Chromium is available.
- **Git + GitHub**; CI on push: build/links/schema sanity.

Content never depends on JavaScript to appear.

---

## CLAUDE CODE PERMISSIONS

Ship `.claude/settings.json` so builds run without prompts (Section 1):

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "defaultMode": "acceptEdits",
    "allow": [
      "Bash(git *)", "Bash(npm *)", "Bash(node *)", "Bash(npx *)",
      "Read(**)", "Edit(**)", "WebFetch(domain:*)"
    ],
    "deny": ["Bash(rm -rf /)", "Bash(rm -rf ~)", "Bash(sudo *)"]
  }
}
```

Never remove the deny rules; never set `bypassPermissions`. "Don't ask again" approvals land in
`.claude/settings.local.json`, which stays out of git.

---

## DESIGN SYSTEM RULES

Follow `CLAUDE.md` in full. Specific to this dark brand:

- Every colour, font, spacing and radius is a custom property in `tokens.css`. Never hardcode outside it.
- **Dark, but not vibe-coded.** Near-black base; the rainbow gradients live **only** in the hero
  blobs and, very sparingly, one accent. Sections, cards and buttons are disciplined near-black; the
  client screenshots supply the colour. This is the one intentional exception to `CLAUDE.md`'s
  purple-gradient ban — execute it with restraint so it still reads as designed.
- **Type for readability.** `argent-pixel-cf` for the logo and the occasional big title only; **all
  reading copy in Lexend** at a comfortable size and line-height. Pixel faces are hard to read at
  length and the audience is non-technical. Meet WCAG AA on the dark background.
- Reuse `nav.css`/`nav.js`. Nav is few, plain items (Work, Contact) plus one accent **"Get in
  touch"** button. The mobile menu must actually work; tap targets ≥ 44px.
- **Site-wide background:** the dot-grid is a fixed layer behind all content that does not scroll
  with the page and drifts slowly upward; near-invisible; delta-time based; calmed under
  reduced-motion. Blobs are hero-only.
- Motion serves the subject: the load-in intro, the scroll-scrubbed reverse hero, the slow drift,
  subtle hovers. Nothing decorative. Respect `prefers-reduced-motion` everywhere.

---

## HERO & SCROLL RULES

- Keep the load-in (glitch in, blobs slide to centre).
- Turn the splash into the first section of a scrolling page: remove `body { overflow: hidden }` and
  the `position: fixed` splash behaviour.
- **Reverse-on-scroll, scrubbed to scroll position:** the intro plays backwards as the first screen
  scrolls (blobs to the sides, wordmark glitches out), over a defined `SCROLL_RANGE`, eased and
  reversible, then releases into normal scroll. Use a pinned/sticky hero.
- Pause the hero loop once scrolled fully past. Under reduced-motion, skip the scrub and just reveal content.

---

## SEO RULES (Picsel sells this — model it)

Per `CLAUDE.md`. Applied to this site:

- **The Sitemap Law:** every route in `sitemap.xml` in the same commit that creates it; the commit
  names both.
- Unique title (`[Page] | Picsel`, ≤60) and unique meta (≤155) per page. One `<h1>` each; no skipped
  heading levels.
- Canonical + Open Graph + Twitter tags on every page; project pages use their desktop screenshot as
  the OG image.
- Schema (JSON-LD): `Organization`/`ProfessionalService` for Picsel site-wide (name, `areaServed`
  Cornwall, contact, `sameAs` any real profiles); a simple `CreativeWork`/`WebSite` reference per
  project linking to the live URL. Validate with the Rich Results Test.
- Descriptive alt text on every screenshot ("Screenshot of the <name> website"); descriptive link
  text (never "click here"). Mention Cornwall naturally where true — **not** on the Julie Miller Art
  page (Scottish Borders).
- Performance budget: Lighthouse SEO 100, performance 90+ per page type; screenshots optimised webp,
  `width`/`height`/`loading="lazy"` except above the fold.

---

## GEO RULES (AI search visibility)

- **Direct answer first:** the homepage's first ~50 words state plainly who Picsel is, what it does
  and where, in liftable sentences.
- **Entity consistency:** same name, phone, email everywhere on-site and off.
- **Machine access:** `robots.txt` allows AI crawlers (GPTBot, ClaudeBot, PerplexityBot and peers);
  optional `llms.txt` summarising Picsel, its services and the work.
- **Question-led** copy where it fits ("How much does a website cost?"), answered plainly first.

---

## CONTENT RULES

### Voice
Confident, creative, plain, local. Picsel is a young studio that makes good-looking sites work hard
for small Cornwall businesses. Warm and human, never jargon, never salesy, never over-promising.
British English throughout. Explain things the way you'd explain them to a busy tradesperson.

### Truthfulness
- Everything must survive Ben reading it aloud to a prospect. No invented reviews, stats, clients or
  outcomes. Picsel is new — let the work carry it.
- Feature client sites respectfully: show and link, don't imply endorsements not given. Confirm each
  client is happy to be featured before shipping their page.
- If pricing goes on the site, state the founding offer plainly and keep it current.

### Project blurbs
Written from Picsel's point of view about each build, one to three plain sentences. The five drafts
in the build brief are the starting point; Ben may reword. Don't pad.

---

## SCREENSHOT PIPELINE

- A dev-time script reads `projects.js` and captures each `url` at desktop (~1440px) and mobile
  (~390px) with headless Chromium, saving optimised webp to `assets/work/<slug>/`.
- Wait for the page to settle before capturing; if a URL is unreachable, write a neat placeholder and
  log a warning — never break the build.
- Expose it as one command (`npm run shots`) and document it so Ben can refresh shots when a client
  site changes or a project is added. These are client sites, not Picsel's IP — capture for portfolio
  display only.

---

## CODE STANDARDS

- Files kebab-case, functions camelCase, constants UPPER_SNAKE_CASE, CSS variables `--kebab-case`.
- Named constants for fixed values (durations, `SCROLL_RANGE`, drift speed, thresholds).
- Comments explain **why**, not what (the existing hero files are a good model — keep that standard).
- `projects.js` is the single source of truth for project data; the Work grid and project pages
  generate from it. Never hand-duplicate project facts across files.
- New code goes where its kind already lives; don't invent a parallel structure. Keep JS minimal and
  vanilla; nothing shipped to the browser that content depends on.

---

## DEPLOYMENT RULES

- Cloudflare Pages connected to the repo; every branch a preview URL; production deploys from main only.
- Web3Forms key and any secrets in the Pages dashboard, never committed.
- Custom domain with HTTPS confirmed before announcing launch; confirm the Adobe Fonts web project
  serves on the production domain.
- Redirects (if the domain had prior content) in a version-controlled redirects file.
- Nothing merges to main without the preview checked in a browser. The plan's launch checklist
  (Sections 12–13) is completed in full.

---

## SECURITY

- Secrets in the host dashboard / `.env` (gitignored); nothing secret committed or served.
- Accounts Ben holds (domain registrar, Cloudflare, Adobe, Web3Forms, Google) live in a password
  manager, never in the repo.
- Form: honeypot minimum; validate and sanitise input; never echo raw input back into HTML.

---

## GIT RULES

Every merge to main deploys. Commit messages:

```
[Section N] short description
```

Good: `[Section 2] add tokens and the fixed drifting background`,
`[Section 6] generate project pages from projects.js`,
`[Section 9] add sitemap, canonical and Organization schema`.

Never: `updates` / `fix` / `wip` / `done` / `changes`.

Commit automatically after each checklist item (`git add -A && git commit -m "[Section N] …"`).
Never committed: `.env`, `node_modules/`, unoptimised screenshot originals, the Web3Forms key.

---

## DO NOT DO

- Do not hardcode any colour, font or spacing outside `tokens.css`.
- Do not add a framework, CSS framework or animation library.
- Do not add JavaScript that content depends on to appear.
- Do not spread purple/blue/pink gradients beyond the hero blobs; no gradient-filled headline words.
- Do not ship a page without its `sitemap.xml` entry in the same commit (the Sitemap Law).
- Do not write two pages with the same title or meta description.
- Do not use "click here"/"read more" as link text; do not skip heading levels or use two `<h1>`s.
- Do not invent testimonials, stats, client counts, awards or outcomes.
- Do not feature a client site that hasn't been cleared to feature.
- Do not self-host the Adobe fonts; use the web-project embed.
- Do not commit secrets or the form key; do not put anything live without the preview checked.
- Do not let the plan file drift: update it in the same session as the work, every time.

---

*Adapted July 2026 from the agency base instructions template for Picsel's own studio site. Travels with plan-picsel-site.md.*
