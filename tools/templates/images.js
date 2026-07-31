/* ---- images.js — one description of the screenshot sizes ------------------
   tools/capture-shots.js writes each capture at its full size plus a couple of
   downscaled copies. This is the other half of that arrangement: the markup
   that tells a browser the copies exist and how wide the slot is, so it can
   pick one instead of always taking the biggest.

   It lives in its own module because the work grid and the project pages both
   need it, and the list of widths has to agree with the list the capture script
   writes. Two copies of that list would eventually disagree, and the symptom
   would be a 404 on an image nobody notices because the browser quietly falls
   back to the original. */

/* The size each capture is taken at, from VIEWPORTS in capture-shots.js. */
export const SHOT_SIZES = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 780, height: 1688 },
};

/* Must match VARIANT_WIDTHS in capture-shots.js. Anything at or above the
   original is skipped there, so it is skipped here too — offering a browser a
   width that was never written is how a srcset ends up 404ing. */
const VARIANT_WIDTHS = [640, 1024];

/**
 * The `srcset` for one capture: every variant that exists, plus the original.
 *
 * @param {string} slug  Project slug.
 * @param {'desktop'|'mobile'} shot
 * @returns {string}
 */
export function shotSrcset(slug, shot) {
  const original = SHOT_SIZES[shot].width;
  const widths = [...VARIANT_WIDTHS.filter((w) => w < original), original];

  return widths
    .map((width) => {
      const file = width === original ? `${shot}.webp` : `${shot}-${width}.webp`;
      return `/assets/work/${slug}/${file} ${width}w`;
    })
    .join(', ');
}

/**
 * The `sizes` for a card in the work grid: how wide this card will actually be.
 *
 * Below the tablet breakpoint the grid is one column, so a card is very nearly
 * the full viewport. Above it the grid is six columns inside a 72rem container,
 * and a card spans some of them — so its width is that fraction of the
 * container, and the fraction is exactly the information the browser is missing.
 *
 * These are stated in rem to match the grid, and they are deliberately a small
 * over-estimate: guessing narrow makes the browser fetch an image too small for
 * the slot, which is visible, while guessing wide only costs bytes.
 *
 * @param {number} span  Columns out of six.
 */
export function cardSizes(span) {
  return `(min-width: 48rem) ${Math.round((span / 6) * 72)}rem, 92vw`;
}
