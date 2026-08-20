# Blog section, and the first post

**Date:** 2026-08-09
**Status:** approved, pending one input (see Open input)

## What this is

A `/blog` section alongside the existing `/guides`, and the first post in it, arguing
that most trades websites are priced for the agency rather than the trade.

## Why a blog when /guides already exists

The two are not the same job and the difference has to be written down or they will
collapse into each other within a few months.

**Guides are neutral and evergreen.** They answer the question a customer asks, in
about fifty quotable words, so an assistant repeats them. They carry `FAQPage`
schema. They do not take sides, because nobody quotes a sales pitch.

**The blog is first person, dated, and has a position.** It says what the studio
thinks, which is the thing a guide is specifically built not to do.

The rule, which goes in the file header:

> If a post would be quoted by an assistant as a neutral answer to a question, it
> should have been a guide.

The first post therefore links to `/guides/how-much-a-trades-website-costs/` rather
than restating it. The guide says what the market charges. The post says what the
studio thinks of that.

## The stale blog problem

`/guides/what-a-trades-website-needs/` already contains the line "A page per job you
do is worth more than a blog nobody updates." A blog that stops after two posts
contradicts the site's own published advice, in public, where anyone can find both.

Two things follow. Posts carry visible dates, which is the honest choice and the one
that helps in search, and which is only defensible alongside a real posting rhythm.
And adding a post is one entry in one data file, so the cost of keeping the rhythm is
as low as it can be made.

## Structure

Mirrors `tools/pages/guides.js` exactly, because that pattern already works and a
second pattern for the same kind of page would be two things to maintain.

- `tools/pages/blog.js`, exporting `BLOG_INDEX_PAGE` and `BLOG_PAGES` from a `POSTS`
  array. One entry per post: `slug`, `title`, `headline`, `date`, `standfirst`,
  `sections`, and the closing link.
- Registered in the `PAGES` list in `tools/build.js`, which puts both routes in
  `sitemap.xml` for free.
- Routes: `/blog/` and `/blog/<slug>/`.

## Navigation

`Blog` joins `Guides` in `footerNav`, not in the top bar. This is not a preference:
`site.config.js` records that five items do not fit 375px without a hamburger, and
that hiding a phone-first audience's route to the phone number behind a button is the
worse trade. That reasoning has not changed.

## Schema

Guides emit `FAQPage`. Posts get `BlogPosting` with `headline`, `datePublished`,
`author` and `publisher`; the index gets a `Blog` node listing its posts. This is an
addition to `tools/templates/schema.js`, next to the existing builders.

## Styling

`guides.css` already solves the one problem both sections have: a column of body copy
that is comfortable on a phone at arm's length. It is renamed `article.css` and both
sections load it, plus a short block for the dated index list and the byline.

The rename is cheap because the stylesheet is named once per page module in a
`styles` array, not hand-written into each generated file. Two files change, and the
generated HTML is rebuilt anyway.

## The first post

- **Slug:** `why-trades-websites-cost-so-much`
- **Title:** "Why trades websites cost so much | Picsel"
- **Headline:** "Most trades websites are priced for the agency, not the trade"

Section order, so it reads as an argument rather than a pitch:

1. **Where the money goes.** A £3,000 quote pulled apart: agency overhead, account
   managers, discovery workshops, the design rounds nobody asked for. Described
   plainly and without sneering, because the reader may have paid it.
2. **What a trades site actually has to do.** Kept short, and links to
   `/guides/what-a-trades-website-needs/` rather than repeating it.
3. **What this studio charges and what is in it.** Figures come from `pricing.js`,
   the same source `/prices` uses, so the post cannot drift out of agreement with the
   prices page.
4. **What that has produced so far.** The Lanora House review result.
5. **Close.** One link to `/prices`, phrased as a fact, following the rule the guides
   already use: never mid-paragraph, never a pitch.

## What the post may and may not claim

`llms.txt` already tells readers and assistants that the studio "makes no claims about
client numbers, years in business or awards" and that anything stated "can be checked
against the live sites." The post is held to that.

**May:** the review counts, which are publicly visible on the Google listing and so
checkable by anyone; what each plan includes, which is on `/prices`; the five live
client sites on `/work`.

**May not:**

- **Any search or ranking claim.** Search Console was checked on 9 August 2026. The
  lanorahouse.com property holds data only from 12 June 2026, so no before and after
  exists, and average position over that window is 27.5, which is page three. 246
  clicks and 11,900 impressions are real but a quarter of the clicks are people
  searching the business name. None of this supports a claim that the site ranks, and
  a reader who checks would find page three. Left out entirely.
- **The website causing the reviews.** Doubling a review count is the result of
  review-gathering work, which is what the monthly plan does. The post places it there
  rather than presenting it as an outcome of the build.
- **A testimonial.** Figures are reported as facts. No quote is written in a client's
  voice and no endorsement is implied that was not given.

## Open input

The two review counts and the two months they span. The post states the pair rather
than the word "doubled", because "six to twelve" and "twenty to forty" read very
differently and only one of them is true. Nothing else is blocked on this.

## Checks before it ships

- `npm run build` passes and the title length check accepts the new pages.
- The rendered pages carry no em dashes, per `CLAUDE.md`.
- The `humanizer` skill is run over every word of the post.
- Both routes appear in `sitemap.xml`; `/blog/` appears in the footer of every page.
- Rendered at 375px, 768px and 1440px.
- `llms.txt` gains the blog, so assistants reading it find the section.
