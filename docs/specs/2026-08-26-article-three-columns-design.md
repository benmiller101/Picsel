# Three columns, a scroll-driven hierarchy, and seven diagrams

**Date:** 2026-08-26
**Status:** approved
**Supersedes parts of:** `docs/specs/2026-08-25-article-layout-design.md`

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
- The left rail carries the title, the date, the reading time and, on a long article, the contents.
- The right rail carries the contact card.
- Both rails are visually secondary while the body is being read, and each comes forward at the end
  of the page where it is the most useful thing on screen.
- Every guide gains a diagram, and every diagram is drawn portrait so that it fits without
  scrolling at any width.

## The layout

```
grid-template-columns:
  minmax(14rem, 20rem)                /* left  */
  minmax(0, var(--article-measure))    /* 38rem */
  minmax(14rem, 20rem);                /* right */
column-gap: var(--space-12);
justify-content: center;
```

inside an article wrap of 90rem rather than the site's 72rem.

**The rails are equal, which is what makes the reading column genuinely centred** rather than
merely less left. That was the ask, and it is the reason this is not the asymmetric shape of the
reference that inspired it.

**They cap at 20rem.** Ben asked not to be afraid of the screen width, and up to about 1400px this
uses it. Past that the rails stop growing and the whole thing centres, because a title 600px from
the paragraph it belongs to has stopped being a title and become a separate column of text.

**The measure does not move.** 38rem at 18px was measured at 61 characters a line, and it is the one
number in this design that has already been argued about twice. Everything else adapts around it.

Below 64rem this collapses to one column in document order: title block, body, contact. The contents
list is dropped on a phone rather than stacked, for the same reason as before, which is that a
contents list rendered after the content it indexes is worse than no contents list.

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
   naming one business.
5. **how-to-get-more-google-reviews**: when to ask, against a job's timeline, because the guide says
   timing matters more than wording.
6. **builder-website-cost**, redrawn: the four cost routes as portrait rows rather than a wide bar
   chart. Same figures, same sources.
7. **builder-website-cost**, redrawn: the word of mouth flow, portrait.

## What this does not change

The reading measure, the 18px type, the 61 character line, the price table, the lists, the display
stat, the heading anchors, the `scroll-margin-top`, the copy, and the blackout gating. All of that
stands from the first pass.

## Risks

The rails are the whole design now, so a thin rail is a worse problem than it was. The left rail has
a title, a date and a reading time, which is enough; the right rail has a phone number and a promise,
which was already judged thin once. If it still looks thin against a 20rem column, the answer is
content, not padding.

Seven diagrams is the largest single piece of authoring in this project so far, and a diagram that
encodes nothing true is worse than no diagram. Each one has to be checkable against its guide's own
copy, and the two redraws must carry exactly the figures the originals did.

The fade is the first scroll-driven visual state on this site beyond the navigation. If it reads as
an effect rather than as hierarchy, it has failed, and the test is whether a reader notices the page
is doing something. They should not.
