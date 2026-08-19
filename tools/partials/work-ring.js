/* ---- work-ring.js — the homepage Work section, as markup ------------------
   The six featured projects as a plain list of links, plus the two empty
   containers work-ring.js fills in with the wheel. Written once here for the
   same reason the work card is: adding a project is one entry in projects.js
   and nothing else.

   WHY THIS IS NOT work-card.js. The two look similar and do different jobs.
   The card is a self-contained tile, sized by its position in a grid, and it
   is what /work is built from. This is a row in a list that the wheel reads:
   the script walks `.project`, lifts the `src` off each screenshot to build
   the card that flies round the ring, and shows exactly one text block at a
   time. Its class names are load bearing in both work-ring.css and
   work-ring.js, so they are not free to drift. Merging the two would mean one
   component answering to two sets of structural constraints, which is how
   both end up compromised.

   /work keeps the grid and the card partial, untouched.

   THE STRUCTURE BELOW IS A CONTRACT. `.project`, `.project__link`,
   `.project__shot`, `.project__name`, `.project__sector` and `.project__cta`
   are each selected by name in the stylesheet, the script, or both. Rename one
   here and the section breaks quietly. */

import { escapeHtml, rollLabel } from '../templates/page.js';
import { SHOT_SIZES, shotSrcset, cardSizes } from '../templates/images.js';

/* Same rule as the work card, and deliberately the same function: what the job
   actually included, read from `tags`, which projects.js only fills in with
   work Ben has confirmed. Nothing here infers. */
function workDone(project) {
  if (!project.tags?.length) return 'Website';
  if (project.tags.length === 1) return project.tags[0];
  return `${project.tags.slice(0, -1).join(', ')} and ${project.tags.at(-1)}`;
}

/**
 * One project, as a list item.
 *
 * @param {object} project  A record from projects.js.
 */
function renderRingItem(project) {
  const size = SHOT_SIZES.desktop;

  return `          <li class="project">
            <a class="project__link roll-trigger" href="/work/${escapeHtml(project.slug)}/">
              <span class="project__shot"><img
                src="/assets/work/${escapeHtml(project.slug)}/desktop.webp"
                srcset="${escapeHtml(shotSrcset(project.slug, 'desktop'))}"
                sizes="${escapeHtml(cardSizes(3))}"
                alt="${escapeHtml(project.alt)}"
                width="${size.width}"
                height="${size.height}"
                loading="lazy" decoding="async"
              /></span>
              <span class="project__name">${escapeHtml(project.name)}</span>
              <span class="project__sector">${escapeHtml(project.sector)} &middot; ${escapeHtml(workDone(project))}</span>
              <span class="project__cta">${rollLabel('View full project')}</span>
            </a>
          </li>`;
}

/**
 * The whole section.
 *
 * @param {object[]} projects  The featured projects, in the order they appear.
 * @returns {string}
 */
export function renderWorkRing(projects) {
  /* Two digits because the counter reads "01 / 06" and a bare "1 / 6" in a
     letter-spaced label looks like a typo. Read from the list rather than
     typed, so a seventh project does not leave the page claiming there are
     six. */
  const total = String(projects.length).padStart(2, '0');

  return `    <section class="work" id="work" aria-labelledby="work-heading">
      <!-- Filled by work-ring.js with one invisible marker per project after
           the first, for the browser to snap to. Empty and harmless without
           the script. -->
      <div class="work__snaps" aria-hidden="true"></div>

      <div class="work__stage">
        <div class="work__panel wrap">
          <!-- "Recent work", not "Selected work". Every build is on this page,
               so there is no selection happening. "Selected" would imply a
               larger body of work being curated down, which is a claim a studio
               this new should not be making. The day this stops showing all of
               them, this heading is the thing to revisit.

               The prototype had a small "Recent work" label sitting above a
               large "Work". Two lines where the smaller one said more than the
               heading it was introducing, and the heading lost a word it had
               had since the grid. One line now. -->
          <h2 class="work__title" id="work-heading">Recent work</h2>
          <!-- Decoration in the plain grid, where all six are on screen and
               there is no position to be in. The stylesheet hides it until the
               ring turns on. -->
          <p class="work__counter" aria-hidden="true"><span data-count>01</span> / ${total}</p>

          <ul class="work__list">
${projects.map(renderRingItem).join('\n')}
          </ul>

          <p class="work__more"><a class="section-head__link" href="/work/">See every project</a></p>
        </div>

        <!-- The wheel. Built by the script from the screenshots above and
             hidden from assistive technology: every card on it is a copy of a
             link that is already in the list, and announcing all six twice is
             worse than not announcing them at all. -->
        <div class="work__ring" aria-hidden="true">
          <div class="ring__slide"><div class="ring"></div></div>
        </div>
      </div>
    </section>`;
}
