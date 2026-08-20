/* ---- faq.js — a set of questions, one open at a time ----------------------
   Used by the homepage, /prices and all four service pages. Those three built
   the same four elements by hand in three files, which is how the prices page
   ended up with an answer set at a different size to the homepage's for a
   fortnight before anybody noticed. One partial, one shape, six pages.

   WHAT THIS REPLACED. A two-column grid with every answer open, which on the
   homepage was five questions and about 130 words of answer that nobody asked
   for. A visitor scanning for "how much does it cost" had to read past four
   answers to find it. Collapsed, the same five questions are five lines and
   the one they came for is one tap.

   NO JAVASCRIPT, AND THAT IS NOT A COMPROMISE. <details> and <summary> are the
   browser's own disclosure widget: they open on click and on Enter and Space,
   they are announced properly, they take focus in the right order, and Chrome
   expands them when a visitor uses Ctrl+F to find text inside a closed one. A
   hand-built accordion has to reimplement every one of those and usually
   reimplements four of them.

   ONE OPEN AT A TIME is the `name` attribute, which is also the browser's,
   added to HTML in 2023: <details> sharing a name behave like radio buttons,
   so opening one closes its siblings with no script involved. In a browser too
   old to know about it, every question still opens and closes and more than
   one can be open at once. That is the correct way for this to degrade, and it
   is why it is worth having rather than 40 lines of event listeners.

   COLLAPSED IS NOT HIDDEN, for the reader that matters most to this site. The
   answers are in the HTML whether or not a question is open, so an assistant
   asked "how much should a tradesman pay for a website" reads all of them, and
   so does the FAQPage schema the pages generate from the same array. Nothing
   about the answers depends on a click. */

import { escapeHtml } from '../templates/page.js';

/* The plus that turns into a cross. Two bars, one rotated, both square-ended,
   because a rounded stroke here would be the one soft corner in a section made
   of hairlines. The rotation is CSS; this is just the shape. */
const TOGGLE_ICON = `<span class="faq__toggle" aria-hidden="true"></span>`;

/**
 * @param {object}   options
 * @param {{q: string, a: string}[]} options.faqs
 * @param {string}   options.name       Groups these questions so that opening
 *   one closes the rest. Must be unique per accordion on a page: two sets
 *   sharing a name would close each other's questions from across the page.
 * @param {string}   options.heading
 * @param {string}   options.headingId  For the section's aria-labelledby.
 * @param {object}   [options.link]     An optional {href, label} opposite the
 *   heading, for a page that has somewhere longer to send people.
 * @param {boolean}  [options.escapeAnswers]  The homepage writes its answers
 *   with entities already in them and the other callers do not. Both need to
 *   end up escaped exactly once.
 */
export function renderFaq({ faqs, name, heading, headingId, link, escapeAnswers = true }) {
  if (!faqs.length) return '';

  const text = (value) => (escapeAnswers ? escapeHtml(value) : value);

  const items = faqs
    .map(
      ({ q, a }) => `            <details class="faq__item" name="${escapeHtml(name)}">
              <summary class="faq__q">
                <span class="faq__q-text">${text(q)}</span>
                ${TOGGLE_ICON}
              </summary>
              <div class="faq__a">
                <p>${text(a)}</p>
              </div>
            </details>`,
    )
    .join('\n');

  /* Under the heading rather than opposite it, because the heading is in its
     own column now and there is a column of space beneath it doing nothing. */
  const aside = link
    ? `\n          <a class="faq__link" href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`
    : '';

  return `        <div class="faq__layout">
          <div class="faq__intro">
            <h2 class="faq__heading" id="${escapeHtml(headingId)}">${escapeHtml(heading)}</h2>${aside}
          </div>

          <div class="faq__list">
${items}
          </div>
        </div>`;
}
