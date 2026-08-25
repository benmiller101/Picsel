# Article layout and the components the articles were missing

**Date:** 2026-08-25
**Status:** approved

## What this is

A design pass on the eight long-form pages: the two posts under `/blog/` and the six
guides under `/guides/`. They all render through `renderArticleSections` and are styled
by `article.css`, and they are the only page type on the site that never got a
composition. The service pages did. That is the whole problem in one sentence.

It also adds the three things the review asked for that the articles have no way to
express today: a price table, a list where a list belongs, and one number at display
size.

## Two things in the brief that are wrong, and one that cannot be built

Recorded here because the fix would otherwise look like an oversight.

**The measure is not too narrow.** The brief asks for 55 to 65 characters per line at a
larger body size. Measured on the rendered page, by counting line boxes rather than
estimating from the em width, the article column already runs at a mean of 60, and 62
to 66 on the paragraphs long enough to fill their lines. So the line length is already
where the brief wants it. What is wrong is the ratio: a 608px column with 632px of
nothing to the right of it reads as cramped even when the line is the right length.
Widening the measure would push it out of the band it is already in. The fix is the
rail, plus the larger body size on its own.

**The gap is three copies of one value, not a large margin.** `--section-y` resolves to
120px on a desktop and is counted three times at that junction: the article's own
`padding-bottom` (`base.css:347`), then `.contact-band`'s `margin-top`, then its
`padding-top` (`site.css:1043`). `.contact-band` is not a `.section`, so it
re-implements the section rhythm instead of inheriting it, and the two stack. Measured
last paragraph to CTA heading: 525px.

**The £3,000 bar cannot be built honestly.** A proportion bar needs a number for the
account manager, the discovery workshop, the three design rounds and the overhead, and
no such split exists anywhere. `blog.js:14-25` says a post may carry a number only if a
stranger could check it, and `llms.txt` repeats it to every assistant that reads the
site. Inventing four percentages to fill a bar is exactly what that rule exists to stop.
So the breakdown becomes a list, which is what it already is in prose.

## The layout

A two-column shell at `min-width: 64rem`: the reading column at the measure, and a
16rem rail to the right of it. Below that breakpoint the rail falls under the article
and the page is what it is today.

**The rail is not a sticky contents list on every page, and this is the one deliberate
departure from the brief.** Word counts, taken from the built pages:

| Article | Words | Rail |
| --- | --- | --- |
| `guides/builder-website-cost` | 1,107 | Sticky contents |
| `blog/plumber-website-cost-2026` | 1,020 | Sticky contents |
| `guides/what-is-geo` | 479 | Contact card |
| `blog/why-trades-websites-cost-so-much` | 471 | Contact card |
| `guides/what-a-trades-website-needs` | 468 | Contact card |
| `guides/how-much-a-trades-website-costs` | 442 | Contact card |
| `guides/google-business-profile-not-showing` | 435 | Contact card |
| `guides/how-to-get-more-google-reviews` | 422 | Contact card |

Six of the eight are under two screens. A sticky contents list on a page you can read
by scrolling twice lists seven headings the reader can already see, and never moves far
enough to justify the position it is holding. On those six the rail carries a standing
contact card instead: the phone number, the response promise from
`SITE.responsePromise`, and one link to the enquiry form. It scrolls with the page like
anything else.

The threshold is a word count on the rendered sections, not a hand-set flag per page,
so a guide that grows past it gets the contents list without anybody remembering to
switch it on.

**A left heading rail is not available, and the reason is arithmetic.** The service
pages' `--split` variant puts the h2 in a 14rem rail. With a 16rem rail on the right as
well the row needs 14 + 38 + 16 rem plus two gaps, which is over 72rem before gutters,
and `--page-max` is 72rem. The two cannot both exist. The right rail is the composition,
and the rhythm gets broken by the components instead. This is worth writing down because
"why not reuse `--split` here" is the obvious question and the answer is not "we forgot".

## Type

Article body copy from 17px to 18px. Measure from 38rem to 40rem, which holds the line
length at about 60 characters while the type gets bigger rather than letting it fall to
57.

Both scoped to the article shell through new tokens, not by moving `--text-base` or
`--measure` themselves. Those two are read by all 29 pages, and the brief is about the
articles. A global change here would restyle the homepage, the service pages and the
project pages as a side effect of a blog note.

## Spacing

`.contact-band` stops carrying `margin-top`, and the article's `padding-bottom` is
removed when a band follows it. Both changes are to the junction, not to `--section-y`,
which is correct everywhere else it is used. Target: about 180px, from 525px.

## The components

**The price table needs no new renderer.** `renderTable` already exists
(`article-sections.js:38-78`), already emits `scope="col"` and `scope="row"`, and is
already styled for both the `guide__` and `post__` prefixes. A price table is a
`{ table }` block whose rows are built from `PLANS` and `BUILD_FEE`, so it cannot quote
a figure the prices page does not. It replaces the paragraph at `blog.js:314-332`, which
currently names £299, £15, £29, £99 and £179 in one sentence and asks the reader to hold
all five.

Gated on `SHOW_PRICING`. The market-rate rows of the existing `PLUMBER_TABLE` are not,
because they are facts about the industry, which is the line `site.config.js:25-27`
draws.

**The £3,000 breakdown becomes a `list` block.** Already supported, already styled, and
currently reported as dead CSS by `npm run check` because no post has used
`.post__list` yet. Converting that section from the legacy `paragraphs` field to `blocks`
is required so the list can sit between its two framing paragraphs rather than after
both.

**The reviews stat becomes one number at display size.** Two things to note before it
ships.

`article.css:7` states as a principle that the articles have "no columns, no sidebar, no
pull quotes". This design breaks two of the three. That is a decision, not an oversight,
and the comment gets rewritten to say what the rule is now rather than being left to
contradict the stylesheet underneath it.

And 18, 36 and 38 appear nowhere in the codebase except as prose inside one sentence at
`blog.js:350-351`. There is no source of truth for them and no check that they are still
true. Putting one of them at display size raises the cost of it going stale, so they move
into a constant with the date they were verified attached, the way `pricing.js` carries
its price-card date. A number nobody can date is a number nobody can re-check.

**No listing screenshot this round.** There is no screenshot of a Google Business Profile
anywhere in the repo, for Lanora House or anyone else. Rather than capture a third party's
live page unsupervised, the stat callout ships without an image and the existing outbound
link does the proving. `.post__figure` also has no SVG or image-pair styling and no
readability floor, so a figure in a post would render unstyled today; that gap is
recorded here and left for the commit that actually needs it.

## Copy, on post one only

Layout, type, spacing and the components apply to all eight articles. Copy changes apply
to `why-trades-websites-cost-so-much` alone, and anything spotted elsewhere gets reported
rather than rewritten. The six guides are deliberately written neutral so that an
assistant will quote them, per `blog.js:4-12`, and giving them hooks would work against
the job they were built for.

Three changes:

**The headline.** "Why a plumber gets quoted £3,000 for a five page website" in the h1.
The `<title>` cannot carry it: with " | Picsel" appended it is 64 characters against a
build-enforced limit of 60. Headline and title are separate fields for exactly this
reason, so the title gets a shorter variant with the number still in it.

**The last section stops arguing with itself.** "Be clear about which half of the work
that is" goes. The caveat it introduces is real and stays, as one line rather than a
paragraph of self-correction.

**The opening is pending.** The brief asks it to open on a real quote or a real moment.
Both would have to be invented, and the rule quoted above forbids it, so the opening is
held until Ben supplies the actual anecdote. Everything else in this spec is independent
of it.

## Bugs found while auditing, fixed in the same work

Not scope creep. All three are in the files this design already opens.

`guides.js:722-726` and `guides.js:837-838` hardcode Picsel's prices as string literals
and are not gated on `SHOW_PRICING`. They are the only Picsel figures on the site that
survive the blackout, which makes them a live violation of the rule in `site.config.js`.
They get read from `pricing.js` and gated like everything else.

`blog.js:161-163` states £839 as a literal. It is `BUILD_FEE` plus thirty six months of
the Online monthly and should be derived, or it silently stops being true at the next
repricing. Introduced in the previous commit; fixing it here.

## Files touched

- `article.css`: the shell grid, the rail, the stat, the spacing junction, and the header comment that currently forbids what this adds
- `tokens.css`: two article-scoped tokens
- `site.css`: the `.contact-band` margin
- `tools/partials/article-sections.js`: no change expected, but confirm rather than assume
- `tools/pages/blog.js`: rail data, price table, list conversion, stat, headline, last section
- `tools/pages/guides.js`: rail data, the two ungated price paragraphs
- `tools/partials/`: a new partial for the rail, following `plan-cards.js` in taking no page-level wrapper with it
- A new `client-results.js` at the repo root for the dated review figures. Not `pricing.js`, which is about what Picsel charges, and not `projects.js`, which is read by the work pages and would pull review counts into pages that deliberately do not show them

## How this gets verified

`npm run check` passes, which covers the title and description limits, the copy tag
whitelist, dead CSS and em dashes.

A second build with `SHOW_PRICING = false`, confirming no Picsel figure survives in the
new price table, the rail, or the guides' two repaired paragraphs, and that no link
points at `/prices/` while it is not built. This is the check the last commit's price
work would have failed without it.

Line length re-measured on the rendered page, expecting about 60 at the new size, and the
CTA gap re-measured, expecting about 180px.

All four widths from `CLAUDE.md`: 375, 768, 1024 and 1440. The 1024 case matters most,
because it is where the rail first appears and has the least room.

The rail read aloud at 375px, where it sits under the article: a contents list that
renders after the content it indexes is worse than no contents list, so on a phone the
contents variant is dropped rather than moved.

`prefers-reduced-motion` is not implicated by `position: sticky`, which is not motion,
but the sticky element gets a `max-height` and its own scroll so a long contents list
cannot exceed the viewport on a short laptop screen.

## Risks

The rail is empty-looking on the six short pages if the contact card is thin. It has to
carry enough to justify the column, without becoming a second CTA competing with the
band at the foot of the page.

Changing the measure and the body size changes every line break on eight pages at once.
Nothing depends on a specific break, but the two hand-tuned `max-width` values in
`article.css` (`24ch` on the headings, `30ch` on the h1) were set against the old size
and want re-checking.

The word-count threshold that picks the rail variant is computed from the section data at
build time. If it is computed from the wrong field it will silently pick the wrong rail,
so it needs asserting in a test rather than eyeballing on two pages.
