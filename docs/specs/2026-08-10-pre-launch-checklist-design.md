# Pre-launch checklist: design

**Date:** 10 August 2026
**Status:** approved, ready for an implementation plan

Ben brought a twenty item pre-launch checklist. Six items were already done, one was dropped, and
this design covers the thirteen that remain. Governing documents: `CLAUDE.md` for design,
`CLAUDEseo.md` for search, `instructions-picsel-site.md` for how the work is run.

---

## Audit: the twenty items as they stood

| # | Item | State before this work |
|---|---|---|
| 1 | Custom 404 page | Done, Section 16 |
| 2 | CTA above the fold | Partial. The money pages have one. Guides and blog posts open with prose and nothing to act on |
| 3 | Internal links | Done, Section 16, two in and two out on every page |
| 4 | Thank you page | Done, `/contact/sent` |
| 5 | Breadcrumbs | Half. `BreadcrumbList` schema is present on every deep page. Nothing is visible to a reader |
| 6 | Case studies | Not done. Five project pages carry screenshots and a blurb, not problem, what we did, result |
| 7 | 5 FAQs | Partial. Prices 7, websites 5, search and AI 5, Google Business Profile 4, custom tools 2 |
| 8 | Response time promise | Absent from the whole site |
| 9 | Sticky mobile CTA | Not done |
| 10 | robots.txt | Done, and it names eight AI crawlers deliberately |
| 11 | Unique page titles | Done, enforced by `tools/build.js` |
| 12 | Meta descriptions | Done, enforced by `tools/build.js` |
| 13 | Social share image | Done, `/assets/brand/open-graph-share.png`, project pages use their own screenshot |
| 14 | Maps and directions | **Dropped by Ben.** Picsel has no premises |
| 15 | Real reviews | Not done. Four Google reviews now exist and are supplied |
| 16 | Alt text on images | Done. Every `<img>` in the built output has an `alt` attribute |
| 17 | Local schema | Partial, and deliberately staying that way. See the decision below |
| 18 | Privacy policy page | Not done |
| 19 | Google Analytics | Not done |
| 20 | Team photo | Not done. `ben-laptop.jpg` sits untracked at the repo root, 11.7 MB |

---

## Decisions taken during brainstorming

### The Edinburgh problem

Zoe's review reads "anyone looking for a website in Edinburgh or surrounding areas". The site's
absolute rule is that no place name appears anywhere about Picsel, and `tools/build.js` fails the
build on a breach.

**Decision: reviews are quoted verbatim, including place names, and Picsel's own copy still names
no place.** A review is another person's words about their own experience, not a claim Picsel makes
about itself. Two conditions attached:

1. **Schema item 17 stays as it is.** `Organization` with `areaServed` United Kingdom. No address,
   no map, no `LocalBusiness` node, because Picsel has no premises and a `LocalBusiness` without one
   is a claim it cannot support.
2. **The build exemption is structural, not an allowlist.** See the next section. Adding "Edinburgh"
   to a list of permitted words would let it leak back into Picsel's own copy the first time
   somebody shortens a sentence to fit a card, which is exactly the failure mode the check exists
   to catch.

### Review markup

**No `Review` or `AggregateRating` schema anywhere.** Google's structured data guidelines exclude
reviews about your own business that you collected and display yourself. Marking them up earns no
rich result and risks a manual action. They ship as visible quotes with a link out to the Google
profile, which lets a sceptic verify them in one click, which is worth more than a star in a SERP
that Google would not draw anyway.

### Review text is verbatim

Matthew Pinch's review contains a misspelling and a doubled full stop. **Both ship as written.** A
testimonial that matches the source a reader can check in one click is worth more than a tidy one
that does not.

### Other decisions

- **Response promise: "Send an enquiry on a weekday and you will hear back the same day."** Chosen
  over a 24 hour promise because it is stronger and Ben will keep it.
- **Analytics: Cloudflare Web Analytics, not GA4.** Cookie free, so no consent banner and a privacy
  policy that is short because it is true. The cost is no conversion goals and no audience
  segments. Revisit if and when conversion tracking is actually needed.
- **The photo goes on a new `/about` page**, not just the contact page. It is also the strongest GEO
  move left on the list: AI search rewards a named human with a verifiable identity behind a
  business.
- **Case studies only where a result is real.** Reshape the project pages that have a genuine
  outcome in a client's own words. Leave the rest. A hollow "result" section on three pages would
  teach a reader to distrust the two real ones.

---

## Architecture

### `reviews.js`, a new source of truth

A new file at the repo root, alongside `projects.js` and `pricing.js`, following the same pattern.
One record per review:

```js
{
  id: 'brenna-nevitt',
  author: 'Brenna Nevitt',
  text: '...',            // verbatim, exactly as published on the Google profile
  date: '2026-08-04',
  source: 'google',
  service: '<service slug>',   // which service page it belongs on, or null
  project: '<project slug>',   // which project page it belongs on, or null
}
```

No page template ever types a review's words. This is the same rule `pricing.js` already enforces
for figures, for the same reason: a string typed into a page is a string that goes stale and nobody
notices.

### The structural build exemption

`findLocationClaims(html, path)` in `tools/build.js` currently scans the whole rendered page for
place names. It will instead:

1. Remove from the HTML the exact strings in `REVIEWS[].text`.
2. Scan everything that remains, unchanged.

The exemption is derived from the review data, so it covers precisely the quoted words and nothing
else. Three properties follow, and they are the reason for choosing this over exempting a markup
wrapper:

- A CSS class cannot widen it. Wrapping other copy in the review markup exempts nothing.
- A rewritten sentence cannot hide behind it. Only byte-identical quoted text is skipped.
- If someone edits a quote in a page template rather than in `reviews.js`, the strings stop
  matching, the quoted place name is scanned, and the build fails loudly.

Client locations that already appear on project pages (Hayle, Scottish Borders) are unaffected. They
are facts about clients and the existing check already permits them.

### Rendering

A `tools/partials/reviews.js` partial, in the same shape as `contact-band.js` and `work-card.js`.
Consumed by the homepage, the service pages and the project pages. Each page asks for the reviews
that belong to it; no page hardcodes a list.

### Breadcrumbs

Visible breadcrumbs render from the **same** `breadcrumbs()` call in `tools/templates/schema.js`
that already produces the `BreadcrumbList` JSON-LD. One function returns both the schema node and
the markup, so the trail a reader sees and the trail Google reads cannot disagree.

### Sticky mobile CTA

Below 768px only. A bar pinned to the bottom of the viewport with two targets, Call and Enquire,
both at least 44px. It hides itself when the contact band or the enquiry form is in the viewport,
via `IntersectionObserver`, so it never covers the thing it is pointing at. It is progressive
enhancement: no content depends on it, and it is absent under no-JS.

### The photo pipeline

`ben-laptop.jpg` is 11.7 MB. A small script converts it to webp at three widths using the Chromium
that `tools/capture-shots.js` already drives through `puppeteer-core`, so no new dependency enters
the project. Output goes to `assets/brand/`. The original stays untracked and out of git, the same
way unoptimised screenshot originals already do.

### New routes

| Route | Job |
|---|---|
| `/about` | Who Ben is, how he works, the photo. Feeds `Organization` schema a founder and an image |
| `/privacy` | What the form does, what the analytics count, what is kept, how to ask for it back |

Both go into `sitemap.xml` in the same commit that creates them, per the Sitemap Law.

---

## Order of work

1. **Config and data.** `site.config.js` gains the response promise and the Cloudflare token.
   `reviews.js` is created.
2. **The build check.** Change `findLocationClaims()` to strip review text first. Do this before any
   review renders, so the first page that prints one is already covered.
3. **Shared components.** Breadcrumbs, the sticky mobile CTA, the reviews partial.
4. **New pages.** `/about` and `/privacy`, plus their sitemap entries and the analytics script.
5. **Per page content.** FAQ top ups on Google Business Profile and custom tools, the case study
   reshape, above-the-fold CTAs on guides and blog posts.

---

## Inputs still needed from Ben

These block specific items, not the whole build. Everything else proceeds while they are pending.

- **The reviewer to client mapping.** Zoe does not appear in `projects.js`. Brenna Nevitt matches
  Nevitt Construction by name, but her review describes an eBay tool for a clearance business in
  Hayle, which sounds like different work. Matthew Pinch cannot be placed at all. Without this, the
  reviews cannot be attached to the right service and project pages. They can still render on the
  homepage.
- **The Cloudflare Web Analytics site token.** Cloudflare dashboard, Analytics and Logs, Web
  Analytics, the `token` value in the JS snippet. Blocks item 19 only.
- **Facts for `/about`.** How long Ben has been building sites, what he did before, why he started
  Picsel, and how he works with a client from first message to live site. Blocks item 20 only.

---

## Appendix: the four reviews, verbatim

Recorded here so nothing is retyped from memory when `reviews.js` is written. Reproduce these
byte for byte, including Matthew's misspelling and doubled full stop. The structural build
exemption depends on the strings matching exactly.

**Zoe**, 5 stars, 9 August 2026:

> Can't recommend Ben enough! Really happy with how my website turned out. I'd definitely recommend
> him to anyone looking for a website in Edinburgh or surrounding areas!

**Julie Miller**, 5 stars, 4 August 2026:

> I had my website designed by Picsel Design Studio, and the process was very straightforward from
> start to finish. Everything was handled very professionally, done quickly and very competitively
> priced.

**Brenna Nevitt**, 5 stars, 4 August 2026:

> Ben at Picsel built us a custom eBay listing tool for our clearance business in Hayle. Listing
> stock used to eat a full afternoon, photographing everything then writing up items one at a time.
> Now it's done in minutes and nothing sits around unlisted. We're getting three times as many items
> live each week and sales have followed. He understood exactly how our business runs and built the
> tool around it. If your company sells on eBay, get him to build you one.

**Matthew Pinch**, 5 stars, 4 August 2026:

> Ben made our website from ok to unbeliveable , we saw increases in work very soon after. I am able
> to update it when I need to. Ben is very quick to make any changes. Really good value for money..

Two of these carry outcomes, and they are the first real outcomes this site has been allowed to
print: Brenna's "three times as many items live each week and sales have followed" and Matthew's
"we saw increases in work very soon after". Both are the client's own words about their own
business, which is why they clear the no-invented-outcomes rule. Picsel still never states either
figure in its own voice.

The dates are taken from the relative timestamps on the profile as read on 10 August 2026 ("20
hours ago" and "6 days ago"). Confirm them against the profile before publishing if exact dates
matter.

---

## Out of scope

- Maps and directions. Dropped: no premises.
- `LocalBusiness` schema. Same reason.
- A cookie consent banner. Nothing being set needs consent.
- A `/reviews` page. Four reviews spread across the pages they are about beat one thin page with no
  search demand behind it.
- Conversion tracking. Follows from the Cloudflare over GA4 decision. Revisit when there is a
  conversion volume worth measuring.
