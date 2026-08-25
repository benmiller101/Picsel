/* ---- article-rail.js — the column beside a guide or a post ----------------
   The articles were the only page type on the site with no composition: a
   608px column of text pinned left with 632px of nothing beside it, which
   reads as a broken template rather than restraint. This is what goes in that
   space.

   TWO OCCUPANTS, CHOSEN BY LENGTH, AND THE LENGTH IS COUNTED RATHER THAN
   DECLARED. A contents list is worth the column on an article you have to
   scroll five times to read. On a two screen guide it lists seven headings the
   reader can already see and never scrolls far enough to earn the position it
   is holding, so those get a contact card instead.

   Measured on the built pages on 25 August 2026: two articles at 1,020 and
   1,107 words, six between 422 and 479. The threshold sits in the gap with
   room on both sides, and it is read off the section data at build time so a
   guide that grows past it gains a contents list without anybody remembering
   to turn one on. That is the whole reason this is a function and not a field
   on each page.

   NO PAGE-LEVEL WRAPPER, the same contract plan-cards.js keeps: this is
   dropped inside an existing .__inner, so a <section> or a .wrap of its own
   would nest a wrap inside a wrap and double the gutter. */

import { SITE } from '../../site.config.js';
import { escapeHtml } from '../templates/page.js';
import { sectionSlugs } from './article-sections.js';

/* Between 479 and 1,020, the two numbers it has to separate. Written as a
   named export so the test can assert it still sits in that gap rather than
   hardcoding the same figure twice. */
export const RAIL_CONTENTS_THRESHOLD = 700;

/* Words in the body, which is what decides whether a contents list is worth
   the column. Counts every string a reader actually reads: paragraphs, list
   items and table cells, across both the `blocks` shape and the older
   `paragraphs`/`list` one, because six of the eight articles still use the
   latter and would otherwise count as empty. */
export function articleWordCount(sections) {
  const strings = [];

  for (const section of sections) {
    for (const block of section.blocks || []) {
      if (block.p) strings.push(block.p);
      if (block.list) strings.push(...block.list);
      if (block.orderedList) strings.push(...block.orderedList);
      if (block.table) {
        strings.push(...block.table.head, ...block.table.rows.flat());
      }
    }
    strings.push(...(section.paragraphs || []));
    strings.push(...(section.list || []));
  }

  return strings
    .join(' ')
    .replace(/<[^>]+>/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function railVariant(wordCount) {
  return wordCount >= RAIL_CONTENTS_THRESHOLD ? 'contents' : 'contact';
}

/* A real <nav> with a name, not a styled list. A reader on a screen reader
   gets it in the landmarks list and can jump to it, which is most of why a
   contents list is worth having at all. */
function renderContents(prefix, sections) {
  const slugs = sectionSlugs(sections);

  const items = sections
    .map(
      (section, index) =>
        `          <li><a href="#${escapeHtml(slugs[index])}">${escapeHtml(section.h2)}</a></li>`,
    )
    .join('\n');

  return `      <nav class="${prefix}__rail-contents" aria-label="On this page">
        <p class="${prefix}__rail-label">On this page</p>
        <ol class="${prefix}__rail-list">
${items}
        </ol>
      </nav>`;
}

/* The short articles' occupant. The phone number first because that is what
   this audience actually does, the response promise underneath it because it
   is the one thing that makes an email feel worth sending, and both read from
   site.config.js so the rail cannot promise something the contact page does
   not. The card is deliberately only these two things: an enquiry link would be
   the third prompt to the same destination on a page that already opens with one
   and closes with another, so it does not earn this column. */
function renderContactCard(prefix) {
  return `      <div class="${prefix}__rail-card">
        <p class="${prefix}__rail-label">Talk to a person</p>
        <p class="${prefix}__rail-phone">
          <a href="${escapeHtml(SITE.contact.phoneHref)}">${escapeHtml(SITE.contact.phoneDisplay)}</a>
        </p>
        <p class="${prefix}__rail-promise">${escapeHtml(SITE.responsePromise)}</p>
      </div>`;
}

/**
 * The rail beside an article.
 *
 * @param {object} options
 * @param {string} options.prefix    'guide' or 'post'.
 * @param {object[]} options.sections The same array passed to renderArticleSections.
 * @returns {string} Markup for one <aside>, with no page-level wrapper.
 */
export function renderArticleRail({ prefix, sections }) {
  const variant = railVariant(articleWordCount(sections));

  const body = variant === 'contents'
    ? renderContents(prefix, sections)
    : renderContactCard(prefix);

  return `    <aside class="${prefix}__rail ${prefix}__rail--${variant}">
${body}
    </aside>`;
}
