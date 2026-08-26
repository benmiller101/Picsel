/* ---- article-rail.js — the column beside a guide or a post ----------------
   The articles were the only page type on the site with no composition: a
   608px column of text pinned left with 632px of nothing beside it, which
   reads as a broken template rather than restraint. This is what goes in that
   space.

   THE LEFT RAIL ALWAYS CARRIES A CONTENTS LIST NOW. It used to be chosen by
   length, on the reasoning that a contents list on a two screen guide only
   indexes headings the reader can already see, and never earns the column it
   occupies. That reasoning held while the rail existed only to carry the
   contents. It stopped holding once the rail became permanent, earned by the
   title, the date and the reading time on its own: contents cost nothing
   structural on top of that. And article-rails.js now highlights the current
   entry as the reader scrolls, which makes the list a position indicator as
   well as a set of jump links, useful on a short page too. See git history
   for the word count threshold this replaced.

   NO PAGE-LEVEL WRAPPER, the same contract plan-cards.js keeps: this is
   dropped inside an existing .__inner, so a <section> or a .wrap of its own
   would nest a wrap inside a wrap and double the gutter. */

import { SITE } from '../../site.config.js';
import { escapeHtml } from '../templates/page.js';
import { sectionSlugs } from './article-sections.js';

/* Words in the body. Still used for readingMinutes below, even though it no
   longer decides whether the rail carries a contents list. Counts every
   string a reader actually reads: paragraphs, list items and table cells,
   across both the `blocks` shape and the older `paragraphs`/`list` one,
   because six of the eight articles still use the latter and would
   otherwise count as empty. */
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

/* Words a minute. The conventional figure, and precise enough for a label whose
   only job is to set an expectation before somebody commits to reading.

   Rounded up, with a floor of one. A guide of ninety words is a minute's
   reading in every sense that matters, and "0 min read" is the kind of detail
   that makes a reader distrust everything else on the page. */
const WORDS_A_MINUTE = 200;

export function readingMinutes(sections) {
  return Math.max(1, Math.ceil(articleWordCount(sections) / WORDS_A_MINUTE));
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
        <!-- role="list" because list-style: none strips list semantics in Safari
             with VoiceOver, so the ol would otherwise announce as plain text. -->
        <ol class="${prefix}__rail-list" role="list">
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
 * The left rail: what this page is. Title, when it was written, how long it
 * takes, and on a long article the contents.
 *
 * THE H1 LIVES HERE NOW, and that is the point of this pass. It used to sit
 * above the grid, spanning the reading column with nothing beside it, which is
 * why the top of every article read as a left column against an empty right
 * half however good the rest of the page was.
 *
 * date and longDate are optional: a guide is a standing answer that gets
 * edited, and stamping it with a date would either go stale or claim a
 * freshness nobody is maintaining. Only a post is a dated piece of writing, so
 * the Written pair is omitted entirely rather than rendered empty when there
 * is nothing to put in it.
 */
export function renderArticleRailLeft({ prefix, sections, headline, date, longDate }) {
  const contents = `\n${renderContents(prefix, sections)}`;

  /* Length used to sit in this list as a Written/Length pair, and the label
     came out under CLAUDE.md's closing rule: "2 min read" already says what
     it is, a definition list entry does not add anything a plain sentence
     would not. Deleting the dt alone would leave <dl><dd>2 min read</dd></dl>
     on a guide, a value with no term, which is a conformance error and would
     land in the first column of the list's auto 1fr grid. So the reading
     time moves out of the list entirely, onto its own line, on both page
     types. A post still needs the list, because Written is a date on its
     own and a bare date is genuinely ambiguous without a label. A guide has
     no date to pair with anything, so it gets no <dl> at all rather than one
     holding a single orphan value. */
  const written = date && longDate
    ? `\n      <dl class="${prefix}__meta">
        <dt>Written</dt>
        <dd><time datetime="${escapeHtml(date)}">${escapeHtml(longDate)}</time></dd>
      </dl>`
    : '';

  return `    <aside class="${prefix}__rail ${prefix}__rail--left">
      <h1 class="${prefix}__headline">${escapeHtml(headline)}</h1>${written}
      <p class="${prefix}__rail-read">${readingMinutes(sections)} min read</p>${contents}
    </aside>`;
}

/**
 * The right rail: what to do about it. One phone number and the promise that
 * goes with it, and nothing else, for the reason recorded on renderContactCard.
 */
export function renderArticleRailRight({ prefix }) {
  return `    <aside class="${prefix}__rail ${prefix}__rail--right">
${renderContactCard(prefix)}
    </aside>`;
}

/* ---- The trip wires article-rails.js watches -------------------------------
   Empty and aria-hidden, exactly like .nav-sentinel in page.js: nothing to
   see and nothing to say, so nothing for a screen reader to stop at. One
   opens the reading column, one closes it, and article-rails.js asks only
   whether each is still on screen. See article-rails.js for what that
   answers and article.css for the margin-top reset that keeps an empty div
   from adding a gap of its own to the column it sits in. */
export function renderArticleSentinelTop(prefix) {
  return `        <!-- Trip wire: the top of the reading column. -->
        <div class="${prefix}__sentinel ${prefix}__sentinel--top" aria-hidden="true"></div>`;
}

export function renderArticleSentinelEnd(prefix) {
  return `        <!-- Trip wire: the end of the reading column. This must remain the
             true last child of the reading column: the rail fade decides "near
             the end of the article" by watching when this sentinel leaves the
             screen, there is no tunable margin behind it, and anything placed
             after it silently drifts the fade timing. -->
        <div class="${prefix}__sentinel ${prefix}__sentinel--end" aria-hidden="true"></div>`;
}

/* The script that answers what the two trip wires above are for. A module
   purely for consistency with the site's other body scripts; it imports
   nothing itself. Deferred by default, so it never blocks the page. */
export const ARTICLE_RAILS_SCRIPT = '  <script type="module" src="/article-rails.js"></script>';
