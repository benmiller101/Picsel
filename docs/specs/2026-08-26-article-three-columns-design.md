# Three columns, a scroll-driven hierarchy, and seven diagrams

**Date:** 2026-08-26
**Status:** built
**Supersedes parts of:** `docs/specs/2026-08-25-article-layout-design.md`

## Corrections made during the build

Recorded here rather than left for someone to discover, because in each case this document
said something the code does not do. `tokens.css` documents at length what happens when a
number in one place is silently contradicted by a number in another; this section exists so
that this document is not the place where that happens.

**The measure moved to 42rem, not 38rem.** This spec called 38rem "the one number that has
already been argued about twice" and said it does not move. The owner asked for a larger
column anyway, was shown what it would cost in line length, and chose it: 42rem at 18px
measures 67 characters a line, not the 61 this spec defends. The reasoning that held the
measure at 38rem in the first pass no longer applies to this one.

**The rails cap at 24rem, not 20rem.** Part of the same request: use more of the screen. The
ratio the rails scale at is unchanged, only the cap moved, from 14 to 20rem to 14 to 24rem.

**The article wrap is 102rem, not 90rem.** Same request again: the wrap widened to match the
wider rails, on the same reasoning `tokens.css` now carries for `--article-page-max`.

**Three columns start at 79rem, not 64rem.** At 64rem the grid starved the reading column: the
two rails, capped at their own maximum, claimed their width first and left the column at
208px, 21 characters a line, on a 1024px viewport, exactly the failure `--article-measure-min`
exists to stop. The shipped breakpoint is derived rather than chosen: the reading column's
floor, plus two rails at their own floor, plus two column gaps, plus 32px of slack to cover a
classic (non-overlay) scrollbar on Windows and Linux Chrome, which the `width` media feature
counts against a viewport the grid never actually gets. See `article.css` for the full
arithmetic.

**Every article gets a contents list, not only the ones over the length this spec implied.**
The owner asked for it on every article, and the reasoning that limited it to long articles
had already been invalidated by the rail becoming permanent: a contents list used to be the
rail's only reason to exist on a short guide, so a two-screen guide was not judged to need one.
Once the rail carries a title, a date and a reading time regardless, the list costs nothing
structural on top of that. See `article-rail.js` for the full reasoning and git history for the
threshold this replaced.

**The `what-is-geo` diagram does not show an assistant naming one business, because the guide
does not say that.** This spec's own drawing brief, below, describes the diagram as "an
assistant naming one business." The guide's copy says an assistant returns "two or three
names," and the diagram was drawn to match the guide rather than this spec: it shows three
short rows, one of them highlighted as the reader's own business, not one. This document was
wrong; the diagram and the guide agree with each other, and this correction is here so a future
reader trusts them over the sentence below that they contradict.

**The full-bleed figure rejection, under "A note on what was considered and rejected" below,
still holds and is recorded accurately.** A figure promoted to a grid child so it could span all
three columns full bleed was considered and rejected because the rails are sticky and occupy the
full vertical extent of the page, so a full-bleed figure collides with them regardless of where
it sits in the document. That reasoning was not overtaken by anything that shipped: the portrait
diagrams did not solve the collision, they removed the reason to want the full-bleed layout at
all, which is what the text below already says.

## What this is

The second pass on the eight long-form pages. The first pass gave them a two-column shell with a
rail beside the body, and previewing it turned up three things it got wrong or left undone.

**It fixed the body of the article and not the head.** The `h1`, the standfirst and the action line
sit outside the grid, so they span the reading column with nothing beside them. The top of every
article still reads as a left column against an empty right half, which was the original complaint.

**The rail is too quiet to register.** On the six short guides it carries a contact card that is not
sticky, so it scrolls away and a reader who starts at the top never sees it do anything.

**The diagrams overlapped it.** `.guide__figure` breaks out to 56rem on purpose, and that breakout
assumed empty space to the right of the reading column. The rail took that space. Patched on 26
August by holding the figure to the column, which stopped the overlap and introduced a horizontal
scroll on the diagrams, which is not wanted.

## What changes

The reading column keeps its width and its line length. Everything around it moves.

- Three columns, centred, in a wider article wrap.
- The left rail carries the title, the date, the reading time and the contents, on every article
  regardless of length. See Corrections above.
- The right rail carries the contact card.
- Both rails are visually secondary while the body is being read, and each comes forward at the end
  of the page where it is the most useful thing on screen.
- Every guide gains a diagram, and every diagram is drawn portrait so that it fits without
  scrolling at any width.

## The layout

```
grid-template-columns:
  minmax(14rem, 24rem)                /* left  */
  minmax(0, var(--article-measure))    /* 42rem */
  minmax(14rem, 24rem);                /* right */
column-gap: var(--space-12);
justify-content: center;
```

inside an article wrap of 102rem rather than the site's 72rem. See Corrections above: the rails,
the measure and the wrap all moved from the figures first drafted here.

**The rails are equal, which is what makes the reading column genuinely centred** rather than
merely less left. That was the ask, and it is the reason this is not the asymmetric shape of the
reference that inspired it.

**They cap at 24rem.** Ben asked not to be afraid of the screen width, and up to about 1400px this
uses it. Past that the rails stop growing and the whole thing centres, because a title 600px from
the paragraph it belongs to has stopped being a title and become a separate column of text.

**The measure is 42rem, widened from the 38rem this section originally set out to defend.** At
18px that measures 67 characters a line. The owner asked for a larger column, was shown the cost
in line length, and chose it anyway: see Corrections above. Everything else adapts around it.

Below 79rem this collapses to one column in document order: title block, body, contact. The
breakpoint is not 64rem, the width the layout above would suggest: see Corrections above for why
it is derived from the column and rail floors rather than chosen by eye. The contents list is
dropped on a phone rather than stacked, for the same reason as before, which is that a contents
list rendered after the content it indexes is worse than no contents list.

## The head moves inside the grid

This is the part that fixes the original complaint.

The `h1`, the date and the reading time move into the left rail. The standfirst and the action line
stay in the centre column, above the sections. So from the first pixel of the article there is
something in all three columns, and there is no longer a stretch of page where the right half is
empty by construction.

Reading time is computed from the same word count that already decides the rail variant, in
`article-rail.js`. It is not a new number to maintain.

## The hierarchy swap

Continuous, driven by scroll position, in three read positions:

| Where the reader is | Left rail | Right rail |
| --- | --- | --- |
| Top of the article | Bright, full size | Quiet |
| Reading the body | Quiet | Quiet |
| End of the article | Quiet | Bright |

The rails interpolate between a bright state and a quiet state: lower contrast text and a small
reduction in size. The body copy never changes, because it is the thing being read.

**Implemented with `IntersectionObserver` sentinels, not a scroll listener.** `nav.js` already uses a
sentinel to decide when the navigation comes in, so the pattern is established here and the reasons
are the same: a scroll handler runs on every frame to answer a question that changes twice.

**Nothing that changes size may cause reflow.** The size change is a `transform: scale` with the
origin at the top of the block, so the column's layout is untouched and the text does not re-wrap
mid-scroll. Animating `font-size` would re-wrap a headline while somebody is reading past it.

**`prefers-reduced-motion` gets the end states with no interpolation.** A reader who has asked for
less motion still sees the title prominent at the top and the contact prominent at the end. They do
not see it move. This is a real fallback rather than a disabled feature.

## The diagrams

Seven, drawn portrait. Five are new, and the builder guide's two existing landscape charts are
redrawn to match.

**Why portrait, and why the existing two have to be redrawn.** The instruction is no horizontal
scroll. A 900 unit wide landscape chart in a 343px phone column either scrolls or renders its axis
labels at six pixels. Neither is acceptable, and no amount of layout fixes it, because the constraint
is the shape of the drawing. Drawn portrait, the same information fits a narrow column at a legible
size. The cost is that the builder guide loses the wide bar chart it has today and gains a portrait
version of the same data.

**This also removes the breakout entirely.** A portrait diagram that fits 343px certainly fits the
608px reading column, so `.guide__figure` no longer needs `max-width: none`, the 56rem width, the
44rem readability floor, or `overflow-x: auto`. Four rules and their comments come out. The
horizontal scroll goes with them.

**A note on what was considered and rejected.** Promoting figures to direct grid children so they
could span all three columns full bleed was the obvious answer to the overlap, and it does not work:
the rails stay visible while the reader scrolls, so they occupy the full vertical extent of the page
and a full bleed figure collides with them exactly as it does today. Sticky rails and full bleed
figures cannot both exist. Portrait diagrams make the question moot.

**The drawing brief.** A 680 unit wide viewBox, portrait, with no text below 24 units. At a 343px
column that is a 0.5 scale and 12 pixel type; at 608px it is 0.89 and 21 pixel type. Colours from
the token set with hardcoded fallbacks, `role="img"` with a `<title>` and a `<desc>` that reads the
whole content out as prose, and the `picsel.co.uk` mark only on diagrams that are Picsel's own
argument rather than a neutral explanation.

The seven, each encoding something true from the guide it sits in:

1. **what-a-trades-website-needs**: the six things it names, as a phone-shaped wireframe with the
   regions labelled in the priority order the guide argues for.
2. **google-business-profile-not-showing**: a decision flow through the guide's four gates, ending at
   the distance point it says nobody tells you about.
3. **how-much-a-trades-website-costs**: what the money buys, split into build, hosting and monthly
   work, showing which part a cheap site leaves out. Deliberately not another cost range chart, since
   the builder guide has one and two would read as a template.
4. **what-is-geo**: the same question asked twice, a results page of ten links against an assistant
   returning two or three names. See Corrections above: this brief originally said "naming one
   business," which is not what the guide argues, and the diagram was drawn to match the guide.
5. **how-to-get-more-google-reviews**: when to ask, against a job's timeline, because the guide says
   timing matters more than wording.
6. **builder-website-cost**, redrawn: the four cost routes as portrait rows rather than a wide bar
   chart. Same figures, same sources.
7. **builder-website-cost**, redrawn: the word of mouth flow, portrait.

## What this does not change

The 18px type, the price table, the lists, the display stat, the heading anchors, the
`scroll-margin-top`, the copy, and the blackout gating. All of that stands from the first pass.
The reading measure is not in this list any more: see Corrections above, it moved from 38rem to
42rem during the build, so it is not something this pass left untouched.

## Risks

The rails are the whole design now, so a thin rail is a worse problem than it was. The left rail has
a title, a date and a reading time, which is enough; the right rail has a phone number and a promise,
which was already judged thin once. If it still looks thin against a 24rem column, the answer is
content, not padding.

Seven diagrams is the largest single piece of authoring in this project so far, and a diagram that
encodes nothing true is worse than no diagram. Each one has to be checkable against its guide's own
copy, and the two redraws must carry exactly the figures the originals did.

The fade is the first scroll-driven visual state on this site beyond the navigation. If it reads as
an effect rather than as hierarchy, it has failed, and the test is whether a reader notices the page
is doing something. They should not.
