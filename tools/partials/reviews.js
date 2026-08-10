/* ---- reviews.js — quoted Google reviews -----------------------------------
   Four real reviews, rendered from reviews.js and never retyped. See that
   file for why the text is verbatim and why there is no Review schema.

   The link to the Google profile is the point of the section rather than a
   courtesy. Picsel sells trust to people who have been burned by a previous
   web person, and a quote on a website proves nothing on its own. A quote that
   can be checked in one click proves something. */

import { SITE } from '../../site.config.js';
import { escapeHtml } from '../templates/page.js';

/**
 * @param {object}   options
 * @param {object[]} options.reviews    Records from reviews.js.
 * @param {string}   options.heading
 * @param {string}   options.headingId  Unique per page, for aria-labelledby.
 */
export function renderReviews({ reviews, heading, headingId }) {
  if (!reviews.length) return '';

  const items = reviews
    .map(
      (review) => `          <figure class="review">
            <blockquote class="review__quote">
              <p>${escapeHtml(review.text)}</p>
            </blockquote>
            <figcaption class="review__who">
              ${escapeHtml(review.author)}
              <time class="review__date" datetime="${escapeHtml(review.date)}">${formatDate(review.date)}</time>
            </figcaption>
          </figure>`,
    )
    .join('\n');

  return `    <section class="reviews" aria-labelledby="${escapeHtml(headingId)}">
      <div class="wrap">
        <h2 class="reviews__heading" id="${escapeHtml(headingId)}">${escapeHtml(heading)}</h2>
        <div class="reviews__list">
${items}
        </div>
        <p class="reviews__source">
          Every one of these is on
          <a href="${escapeHtml(SITE.reviewsUrl)}">Picsel's Google profile</a>, word for word.
        </p>
      </div>
    </section>`;
}

/* "4 August 2026". British order, month spelled out, because 04/08 and 08/04
   are the same string to two different readers. */
function formatDate(iso) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
