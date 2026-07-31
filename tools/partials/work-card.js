/* ---- work-card.js — one project, as a card --------------------------------
   Used by the homepage's Selected Work grid and by /work. Written once here so
   the two can never drift into looking like different components, and so
   adding a project changes nothing but projects.js.

   Every fact on the card comes from the project record. Nothing is written by
   hand into the markup — a name typed into a page is a name that will one day
   disagree with the one in projects.js. */

import { escapeHtml } from '../templates/page.js';

/* The shapes a card can take, cycled through by position in the grid. This is
   what stops the grid being five identical rectangles in a row — the rhythm is
   composed rather than repeated.

   Cycled by index rather than stored per project: a card's size is a fact about
   the LAYOUT, not about the client, and putting it in projects.js would mean
   adding a sixth project could quietly break the fifth one's row.

   `span` is columns of the six-column grid; the cycle adds up to two full rows
   plus a banner, so any number of projects fills tidily.

   The phone shape is not decoration. It is the same client's site at phone
   size, and a portfolio for small businesses — whose customers are overwhelmingly
   on phones — should show that it was thought about. */
const SHAPES = [
  { name: 'lead', span: 4, shot: 'desktop', ratio: '16 / 10' },
  { name: 'phone', span: 2, shot: 'mobile', ratio: '3 / 4' },
  { name: 'half', span: 3, shot: 'desktop', ratio: '16 / 10' },
  { name: 'half', span: 3, shot: 'desktop', ratio: '16 / 10' },
  { name: 'banner', span: 6, shot: 'desktop', ratio: '21 / 9' },
];

/* The index shape: every card the same, in a plain two-up grid.
   /work and the homepage do different jobs and should not look identical.
   The homepage is a showcase — the varied rhythm above is doing persuasion,
   giving one build more room than another. /work is a catalogue: someone has
   come to compare, and comparing is exactly what varied sizes make harder,
   because a bigger card reads as a better project rather than as a layout
   decision. Same card component either way, so the two can never drift into
   looking like different things. */
const INDEX_SHAPE = { name: 'index', span: 3, shot: 'desktop', ratio: '16 / 10' };

/* The captures' real pixel sizes, from tools/capture-shots.js. Stated on every
   <img> so the browser can reserve the right space before the file arrives —
   without it the text below each card jumps down as each screenshot loads,
   which is both unpleasant and a measurable ranking penalty. */
const SHOT_SIZES = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 780, height: 1688 },
};

/**
 * @param {object} project  A record from projects.js.
 * @param {number} index    Position in the grid, which picks the shape.
 * @param {object} [options]
 * @param {boolean} [options.eager]   Skip lazy-loading — for a card that is
 *                                    above the fold on its own page.
 * @param {'showcase'|'index'} [options.variant]  'showcase' cycles the shapes
 *                                    above; 'index' makes every card the same.
 */
export function renderWorkCard(project, index, { eager = false, variant = 'showcase' } = {}) {
  const shape = variant === 'index' ? INDEX_SHAPE : SHAPES[index % SHAPES.length];
  const size = SHOT_SIZES[shape.shot];
  const src = `/assets/work/${project.slug}/${shape.shot}.webp`;

  /* Alt text comes from projects.js, where it is written per project. A
     screenshot with no alt text is invisible to anyone using a screen reader
     and to search engines — and this site sells search work. */
  const alt = escapeHtml(project.alt);

  return `        <article class="work-card work-card--${shape.name}">
          <a class="work-card__link" href="/work/${escapeHtml(project.slug)}/">
            <span class="work-card__frame" style="--card-ratio: ${shape.ratio}">
              <img
                class="work-card__shot"
                src="${escapeHtml(src)}"
                alt="${alt}"
                width="${size.width}"
                height="${size.height}"
                ${eager ? '' : 'loading="lazy" '}decoding="async"
              />
            </span>
            <span class="work-card__meta">
              <h3 class="work-card__name">${escapeHtml(project.name)}</h3>
              <p class="work-card__sector">${escapeHtml(project.sector)} &middot; ${escapeHtml(project.location)}</p>
            </span>
          </a>
        </article>`;
}

/** The whole grid, for a list of projects. */
export function renderWorkGrid(projects, options = {}) {
  const modifier = options.variant === 'index' ? ' work-grid--index' : '';

  return `      <div class="work-grid${modifier}">
${projects.map((project, index) => renderWorkCard(project, index, options)).join('\n')}
      </div>`;
}
