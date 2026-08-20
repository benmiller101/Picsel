/* ---- social.js — the three accounts, as something you can click -----------
   Picsel is @picseluk on Facebook, Instagram and TikTok. Those URLs have been
   in site.config.js since the schema was written, published as sameAs so a
   search engine could tie the accounts to the site. Nobody reading the site
   could see them.

   WHY INLINE SVG AND NOT AN ICON FONT OR THREE FILES. Three paths, about
   400 bytes each after minification, and they take `currentColor`, so the
   icons pick up the same colour as the link they sit in and change with it on
   hover without a second asset. An icon font would be a request and a flash of
   nothing; three PNGs would be three requests and would not take a colour.

   WHY THE MARKS ARE DRAWN RATHER THAN COPIED FROM A BRAND KIT. Each of these
   is the platform's own glyph and each platform's brand guidelines say it must
   not be recoloured, stretched or redrawn. These are the standard monochrome
   marks at their published proportions, which is the one form all three permit
   in a single flat colour. Nothing here is stretched: every viewBox is square
   and the CSS sizes both axes together. */

import { SITE } from '../../site.config.js';
import { escapeHtml } from '../templates/page.js';

/* Keyed by the `network` field on each entry in SITE.socialProfiles. Adding a
   fourth account means adding its mark here as well, and the render below says
   so out loud rather than silently drawing nothing.

   DRAWN WITH PRIMITIVES WHERE A PRIMITIVE WILL DO. The obvious way to write
   these is to paste the path data from each brand kit, and the first version
   did. Instagram's outline mark alone was 1.4KB of coordinates, and because
   this sits in the footer it is on all 28 pages: three quarters of a kilobyte
   gzipped, per page, of the same three shapes.

   A rounded rect, a circle and a dot say the same thing in 250 bytes, because
   a <rect rx> is a rounded rectangle rather than forty numbers describing one.
   Facebook and TikTok keep their paths: those are letterforms and there is no
   primitive for an f or a note.

   Instagram is stroked and the other two are filled, which is what each mark
   actually is, so both stroke and fill are set to currentColor and the CSS
   only has to set `color` once. */
const SOCIAL_ICONS = {
  facebook:
    '<path d="M16 8a8 8 0 1 0-9.25 7.9v-5.59H4.72V8h2.03V6.24c0-2 1.19-3.11 3.02-3.11.87 0 1.79.16 1.79.16v1.97h-1.01c-.99 0-1.3.62-1.3 1.25V8h2.22l-.36 2.31H9.25v5.59A8 8 0 0 0 16 8Z"/>',

  /* The rounded square, the lens, the flash dot. The whole mark. */
  instagram:
    '<rect x="1.5" y="1.5" width="13" height="13" rx="4" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
    '<circle cx="8" cy="8" r="3.1" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
    '<circle cx="12.1" cy="3.9" r="1"/>',

  tiktok:
    '<path d="M13.6 3.9a3.6 3.6 0 0 1-2.5-1.02A3.6 3.6 0 0 1 10.04.4H7.66v9.7a2.03 2.03 0 1 1-1.45-1.95V5.72a4.45 4.45 0 1 0 3.83 4.4V5.42a5.96 5.96 0 0 0 3.56 1.17V3.9Z"/>',
};

/**
 * The three accounts as a labelled list of icon links.
 *
 * @param {object} [options]
 * @param {string} [options.className]  Block class, so the footer and any
 *   other caller can style the same markup differently without either one
 *   reaching into the other's rules.
 * @param {string} [options.label]      The accessible name of the group.
 */
export function renderSocialLinks({ className = 'social', label = 'Picsel on social media' } = {}) {
  const items = SITE.socialProfiles
    .map((profile) => {
      const icon = SOCIAL_ICONS[profile.network];

      /* A missing mark is a build-time mistake, not something to paper over
         with an empty circle that looks like a broken image on the live site.
         Better to say which one and carry on with the two that do work. */
      if (!icon) {
        console.warn(
          `  WARN   No icon for social network "${profile.network}". Add its mark to ` +
            'SOCIAL_ICONS in tools/partials/social.js, or the link is left out of the footer.',
        );
        return null;
      }

      /* The visible content is a picture, so the name has to be said in text
         somewhere. It is on the link rather than in a <title> inside the SVG,
         because the link is the thing being announced and "Picsel on TikTok,
         link" is the whole useful sentence. The svg is hidden from the reader
         so the same name is not read twice.

         rel="me" is the one piece of markup that says "this account is mine"
         in a form Mastodon and several verifiers actually check. noopener on
         an external target, always. */
      return `            <li class="${className}__item">
              <a class="${className}__link" href="${escapeHtml(profile.href)}"
                 rel="me noopener" target="_blank">
                <svg class="${className}__icon" viewBox="0 0 16 16" width="16" height="16"
                     fill="currentColor" aria-hidden="true" focusable="false">${icon}</svg>
                <span class="visually-hidden">Picsel on ${escapeHtml(profile.name)}, ${escapeHtml(
                  profile.handle,
                )}</span>
              </a>
            </li>`;
    })
    .filter(Boolean);

  if (!items.length) return '';

  return `          <nav class="${className}" aria-label="${escapeHtml(label)}">
            <ul class="${className}__list">
${items.join('\n')}
            </ul>
          </nav>`;
}
