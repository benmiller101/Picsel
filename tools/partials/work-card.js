/* ---- work-card.js — one project, as a card --------------------------------
   Used by /work, the catalogue of every build. The homepage shows its projects
   through the pinned ring in partials/work-ring.js instead, so this component
   has one caller and one shape. Adding a project still changes nothing but
   projects.js.

   Every fact on the card comes from the project record. Nothing is written by
   hand into the markup — a name typed into a page is a name that will one day
   disagree with the one in projects.js. */

import { escapeHtml, rollLabel } from '../templates/page.js';
import { SHOT_SIZES, shotSrcset, cardSizes } from '../templates/images.js';

/* One shape, used by every card. /work is a catalogue: someone has come to
   compare builds, and comparing is what varied card sizes make harder, because
   a bigger card reads as a better project rather than as a layout decision.

   The homepage used to cycle five different spans through this same component.
   It no longer renders cards at all — the pinned 3D ring in partials/work-ring.js
   replaced it in August 2026 — so the cycle and its four span rules in site.css
   went with it rather than sitting here unreachable.

   `span` is columns of the grid, and templates/images.js reads it to work out
   the `sizes` attribute. Kept as a field rather than inlined because that is
   the one place the number has to agree with the CSS. */
const CARD_SHAPE = { span: 3, shot: 'desktop', ratio: '16 / 10' };

/* The captures' real pixel sizes now live in templates/images.js, next to the
   variant widths they have to agree with. They are still stated on every <img>
   for the same reason as before: without them the text below each card jumps
   down as each screenshot loads, which is both unpleasant and a measurable
   ranking penalty. */

/* What the card says under the name, and it used to be the client's town.
   Five cards reading "Hayle, Cornwall" made the grid look like a county
   directory, which was the honest description of the business when it was one
   and is a misreading of it now. The town is a fact about the CLIENT, so it
   stayed where facts about clients belong: on that client's own page, in the
   eyebrow above their name.

   What replaces it is the more useful sort under the name anyway. Someone
   scanning this grid is looking for their own trade and for whether the job
   included the search work, and now both are on the card.

   Read from `tags`, which projects.js only fills in with work Ben has
   confirmed. Nothing here infers. */
function workDone(project) {
  if (!project.tags?.length) return 'Website';
  if (project.tags.length === 1) return project.tags[0];
  return `${project.tags.slice(0, -1).join(', ')} and ${project.tags.at(-1)}`;
}

/**
 * @param {object} project  A record from projects.js.
 * @param {object} [options]
 * @param {boolean} [options.eager]   Skip lazy-loading — for a card that is
 *                                    above the fold on its own page. The first
 *                                    such card also gets fetchpriority="high",
 *                                    because it is the one the browser should
 *                                    fetch before anything else on the page.
 * @param {boolean} [options.first]   True for the highest-priority card.
 */
export function renderWorkCard(project, { eager = false, first = false } = {}) {
  const shape = CARD_SHAPE;
  const size = SHOT_SIZES[shape.shot];
  const src = `/assets/work/${project.slug}/${shape.shot}.webp`;

  /* Alt text comes from projects.js, where it is written per project. A
     screenshot with no alt text is invisible to anyone using a screen reader
     and to search engines — and this site sells search work. */
  const alt = escapeHtml(project.alt);

  return `        <article class="work-card">
          <a class="work-card__link roll-trigger" href="/work/${escapeHtml(project.slug)}/">
            <span class="work-card__frame" style="--card-ratio: ${shape.ratio}">
              <img
                class="work-card__shot"
                src="${escapeHtml(src)}"
                srcset="${escapeHtml(shotSrcset(project.slug, shape.shot))}"
                sizes="${escapeHtml(cardSizes(shape.span))}"
                alt="${alt}"
                width="${size.width}"
                height="${size.height}"
                ${eager ? '' : 'loading="lazy" '}${first ? 'fetchpriority="high" ' : ''}decoding="async"
              />
            </span>
            <span class="work-card__meta">
              <h3 class="work-card__name">${rollLabel(project.name)}</h3>
              <p class="work-card__sector">${escapeHtml(project.sector)} &middot; ${escapeHtml(workDone(project))}</p>
            </span>
          </a>
        </article>`;
}

/**
 * The whole grid, for a list of projects.
 *
 * @param {object[]} projects
 * @param {object}  [options]
 * @param {number}  [options.eagerCount]  How many cards are above the fold on
 *   this page, and therefore must NOT be lazy-loaded. Defaults to none.
 *
 *   This matters more than it looks. Lazy-loading an image that is already on
 *   screen is the standard way to make a page measurably slower: the browser
 *   holds the request back, then discovers it needs it after all, and the
 *   largest thing on the page paints late. Which cards are above the fold is a
 *   fact about the PAGE, not about the card, so the page says how many.
 *
 *   The homepage passes nothing on purpose. Its grid sits below a full-screen
 *   hero, so every card there genuinely is off screen and lazy is correct.
 */
export function renderWorkGrid(projects, options = {}) {
  const eagerCount = options.eagerCount ?? 0;

  return `      <div class="work-grid">
${projects
  .map((project, index) =>
    renderWorkCard(project, {
      ...options,
      eager: index < eagerCount,
      first: index === 0 && eagerCount > 0,
    }),
  )
  .join('\n')}
      </div>`;
}
