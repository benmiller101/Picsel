/* ---- reviews.js — quoted Google reviews, as a rail ------------------------
   Rendered from reviews.js and never retyped. See that file for why the text
   is verbatim and why there is no Review schema.

   WHAT THIS REPLACED, AND WHY. It was a two-column grid of quotes set at
   --text-xl, which on the homepage meant seven paragraphs of somebody else's
   words in a wall, and Brenna's alone is ninety of them. A visitor who wants
   to read testimonials had to scroll through all of it; a visitor who does not
   had to scroll past all of it. Both of them lost.

   A rail fixes both at once. The section is one card tall whatever the number
   of reviews, so scrolling past it costs a flick. Reading on costs a sideways
   drag, and only the people who want it pay. Adding a fourteenth review does
   not make the page any longer, which is the property that matters: the answer
   to "we have more reviews now" should never be "the homepage gets taller".

   THE CUT-OFF CARD IS THE INTERFACE. The rail runs to the right edge of the
   viewport rather than stopping at the text column, so a card is always
   visibly sliced by the edge of the screen. That is the whole affordance and
   it is why there are no arrows and no dots: a card cut in half says "there is
   more this way" to everybody, in every language, without a control that has
   to be styled, positioned, labelled and kept in sync with the scroll.

   Keyboard is not left out. The rail is a focusable region with an accessible
   name, so Tab lands on it and the arrow keys scroll it, which is browser
   behaviour rather than anything written here. */

import { SITE, REVIEWS_URL_IS_PLACEHOLDER } from '../../site.config.js';
import { escapeHtml } from '../templates/page.js';

/* ---- The star ------------------------------------------------------------
   Drawn on a nine by nine grid and kept in the source AS that grid, because
   the alternative is forty path coordinates that nobody can read, let alone
   adjust. buildPixelPath() turns it into a path once, at build time.

   PIXELS RATHER THAN A SMOOTH STAR, because everything else on this site is
   already made of them: the wordmark, the dot field behind every page, the
   blobs. A rounded five-pointed star here would be the one shape on the site
   that came from somewhere else. */
const STAR_GRID = [
  '....#....',
  '....#....',
  '...###...',
  '#########',
  '.#######.',
  '..#####..',
  '..##.##..',
  '.##...##.',
  '.#.....#.',
];

/* Each run of filled cells becomes one rectangle, so a solid row is four
   commands rather than nine. Runs, not cells, is the difference between a
   240-byte path and a 900-byte one, on a shape that appears five times a card
   and seven cards a page. */
function buildPixelPath(grid) {
  const parts = [];

  grid.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (row[x] !== '#') {
        x += 1;
        continue;
      }
      let end = x;
      while (end < row.length && row[end] === '#') end += 1;
      parts.push(`M${x} ${y}h${end - x}v1h-${end - x}z`);
      x = end;
    }
  });

  return parts.join('');
}

const STAR_PATH = buildPixelPath(STAR_GRID);
const STAR_ID = 'picsel-star';

/* The arrow on the two cycle buttons, drawn on the same nine by nine grid as
   the star and by the same function. A stock chevron glyph next to a pixel
   star would be the one mark in this section that came from a different
   drawing, and the buttons sit two inches from five of those stars.

   One shape, not two: the back button is this arrow flipped in CSS. */
const ARROW_GRID = [
  '..#......',
  '..##.....',
  '..###....',
  '..####...',
  '..#####..',
  '..####...',
  '..###....',
  '..##.....',
  '..#......',
];

const ARROW_PATH = buildPixelPath(ARROW_GRID);
const ARROW_ID = 'picsel-arrow';

/* Below three reviews there is nothing to cycle through worth the controls:
   two cards both on screen at once, and a pair of buttons that move a rail
   which is already showing everything it has. The service and project pages
   that carry one quote never see them. */
const MIN_TO_CYCLE = 3;

/* Asked for by the section rather than by the page, which is the only way
   seven pages get this without seven edits and without one of them being
   forgotten. `defer` is the same promise every enhancement on this site makes:
   it waits for the page to be parsed and never blocks it from appearing, and
   with the file missing or blocked the rail is a scrolling strip and every
   review is still in the HTML. */
const REVIEW_SCRIPT = `
      <script defer src="/reviews-cycle.js"></script>`;

/* Defined once per page and pointed at five times per card. Inline rather than
   a file so the CSP's img-src is not involved and so the stars take
   currentColor, and a <symbol> rather than five copies because five copies is
   seven cards' worth of the same forty rectangles. */
const STAR_SPRITE = `      <svg class="reviews__sprite" aria-hidden="true" focusable="false" width="0" height="0">
        <symbol id="${STAR_ID}" viewBox="0 0 9 9"><path d="${STAR_PATH}" /></symbol>
        <symbol id="${ARROW_ID}" viewBox="0 0 9 9"><path d="${ARROW_PATH}" /></symbol>
      </svg>`;

/**
 * A rating as stars, plus the number in words for anything that cannot see
 * them. Only the earned stars are drawn: five outlines with four filled would
 * need a second shape and a second colour to say the same thing five marks
 * already say by being there.
 */
function renderStars(rating) {
  const stars = Array.from(
    { length: rating },
    () => `<svg class="review__star" viewBox="0 0 9 9" aria-hidden="true" focusable="false"><use href="#${STAR_ID}" /></svg>`,
  ).join('');

  return `                <p class="review__rating">
                  ${stars}
                  <span class="visually-hidden">${rating} out of 5</span>
                </p>`;
}

/**
 * @param {object}   options
 * @param {object[]} options.reviews    Records from reviews.js.
 * @param {string}   options.heading
 * @param {string}   options.headingId  Unique per page, for aria-labelledby.
 */
export function renderReviews({ reviews, heading, headingId }) {
  if (!reviews.length) return '';

  /* Newest first. The dates are not on the cards, so this is the only place
     they do any work, and it is the right order: the most recent thing anybody
     said about the studio is the one a reader should meet first. */
  const ordered = [...reviews].sort((a, b) => b.date.localeCompare(a.date));

  const cards = ordered
    .map((review) => {
      /* ALWAYS RENDERED, even with nothing in it. Three of these people left a
         name and no business, and the row has to exist on their cards too or
         their name sits a line lower than everybody else's and the bottom of
         the rail looks broken. reviews.css gives the empty one its height.

         The alternative was inventing a job title for a real customer, which
         is not a layout fix, it is a fabricated fact about a named person on a
         public page. See the note in reviews.js. */
      const subject = review.subject
        ? escapeHtml(review.subject)
        : '';

      return `            <li class="reviews__slide">
              <figure class="review">
${renderStars(review.rating)}
                <blockquote class="review__quote">
                  <p>&ldquo;${escapeHtml(review.text)}&rdquo;</p>
                </blockquote>
                <figcaption class="review__who">
                  <cite class="review__author">${escapeHtml(review.author)}</cite>
                  <span class="review__subject">${subject}</span>
                </figcaption>
              </figure>
            </li>`;
    })
    .join('\n');

  /* The region's name says what it is AND how it works, because "Reviews,
     region" tells somebody arriving on it by Tab nothing about the fact that
     it moves sideways. The count is in there too: knowing there are seven
     before you start arrowing through them is the thing a sighted visitor
     gets for free from the cards running off the edge of the screen. */
  const railLabel = `${ordered.length} reviews, scroll sideways to read them`;

  /* The one link out to where these are published, and the section needs it
     more now than it did as plain quotes: seven five-star ratings with nothing
     pointing at a source is a claim rather than evidence. Picsel sells trust to
     people who have been burned by a previous web person, and a rating on your
     own website proves nothing. A rating that can be checked in one click
     proves something.

     It replaced a full sentence under the rail, "Every one of these is on
     Picsel's Google profile, word for word", which said the same thing at
     twenty times the length and in the one place nobody looks. Opposite the
     heading is the site's existing home for a link like this: it is where
     "Longer answers in the guides" sits over the questions and "See every
     project" over the work.

     SUPPRESSED WHILE THE URL IS A PLACEHOLDER, rather than shipped and landing
     on a Google Maps error. The audience for this link is the sceptic, and the
     sceptic is the one reader guaranteed to click it: sending them to an error
     page reads as a fabricated quote covered by a broken link, which is worse
     than offering no link at all. The build warns until the real URL is in. */
  const profileLink = REVIEWS_URL_IS_PLACEHOLDER
    ? ''
    : `
            <a class="section-head__link" href="${escapeHtml(SITE.reviewsUrl)}">Read them on Google</a>`;

  /* ---- The two buttons -------------------------------------------------
     THE CUT-OFF CARD WAS NOT ENOUGH, and the section is better for admitting
     it. A sliced card does say "there is more this way", and on a trackpad or
     a phone that is all anybody needs. On a mouse it is a strip you can see
     more of and cannot reach: no wheel does anything sideways, the scrollbar
     is hidden because a light one on a near-black page reads as a fault, and
     the drag that works on glass does not work on a desktop pointer. Seven
     reviews, four of them unreachable without a keyboard.

     So the buttons are the fix for the case the affordance never covered, and
     nothing else about the rail changes: the first card still lines up with
     the heading, and a card is still sliced by the right edge of the screen.

     RENDERED HIDDEN AND UNHIDDEN BY THE SCRIPT. Without reviews-cycle.js the
     rail is a plain scrolling strip and these two would be dead controls
     sitting under the heading, which is worse than no controls. They appear
     when the thing they drive exists.

     The counter reads "01 / 07" for the same reason the work wheel's does: a
     reader who has cycled twice should be able to see how much is left
     without counting cards. aria-hidden because the buttons carry their own
     names and the live region below announces the position in words. */
  const controls =
    ordered.length >= MIN_TO_CYCLE
      ? `
            <div class="reviews__cycle" data-review-cycle hidden>
              <p class="reviews__counter" aria-hidden="true"><span data-review-count>01</span> / ${String(ordered.length).padStart(2, '0')}</p>
              <button class="reviews__step reviews__step--back" type="button" data-review-step="-1" aria-label="Previous review">
                <svg class="reviews__arrow" viewBox="0 0 9 9" aria-hidden="true" focusable="false"><use href="#${ARROW_ID}" /></svg>
              </button>
              <button class="reviews__step" type="button" data-review-step="1" aria-label="Next review">
                <svg class="reviews__arrow" viewBox="0 0 9 9" aria-hidden="true" focusable="false"><use href="#${ARROW_ID}" /></svg>
              </button>
            </div>`
      : '';

  return `    <section class="reviews" aria-labelledby="${escapeHtml(headingId)}">
${STAR_SPRITE}

      <div class="wrap">
        <div class="section-head reviews__head">
          <h2 class="section-head__title" id="${escapeHtml(headingId)}">${escapeHtml(heading)}</h2>
          <div class="reviews__tools">${controls}${profileLink}
          </div>
        </div>
      </div>

      <div class="reviews__rail" tabindex="0" role="group" aria-label="${escapeHtml(railLabel)}">
        <ul class="reviews__track">
${cards}
        </ul>
      </div>

      <!-- Empty until the script cycles a card in. A screen reader gets the
           position and the name in words, because the counter beside the
           buttons is a picture of that fact and the cards themselves are all
           still in the page whichever one is on top. -->
      <p class="visually-hidden" aria-live="polite" data-review-live></p>
${REVIEW_SCRIPT}
    </section>`;
}
