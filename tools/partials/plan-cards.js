/* ---- plan-cards.js — the plans, drawn two ways ----------------------------
   Both come from PLANS in pricing.js. Two renderers rather than two copies of
   the numbers: the homepage wants a glance and the prices page wants the whole
   thing, and the fastest way to end up with £15 on one page and £19 on another
   is to let each page write its own.

   THE RAIL (homepage) is three names, three prices and one line each, over one
   statement of the build fee. It is there to answer "can I afford this" before
   someone has scrolled far enough to care about what is in each plan, and to
   send them to the page that says.

   THE CARDS (prices page) carry the name, the price, the term, what is
   included and what is not. Nothing else, and the "nothing else" is the design
   decision.

   NEITHER RENDERER PRINTS A BUILD FEE INSIDE A CARD. There is one build fee
   for all three plans. Printing it three times invites the comparison the
   single fee exists to prevent, which is reading the cheap plan as the cheap
   build. It is stated once, above, by whichever page is doing the rendering. */

import { PLANS, BUILD_FEE, BUILD_WHAT, money } from '../../pricing.js';
import { escapeHtml } from '../templates/page.js';
import { countWord } from '../templates/words.js';

/* The price. One figure and "a month" on every plan now that no plan has an
   opening rate. */
function renderPrice(plan, amountClass, periodClass) {
  return `            <span class="${amountClass}">${money(plan.monthly)}</span>
            <span class="${periodClass}">a month</span>`;
}

/** The compact strip for the homepage. */
export function renderPlanRail() {
  const items = PLANS.map(
    (plan) => `          <li class="plan-rail__item">
            <p class="plan-rail__name">${escapeHtml(plan.name)}</p>
            <p class="plan-rail__price">
${renderPrice(plan, 'plan-rail__amount', 'plan-rail__period')}
            </p>
            <p class="plan-rail__summary">${escapeHtml(plan.summary)}</p>
          </li>`,
  ).join('\n\n');

  return `    <section class="section plans" aria-labelledby="plans-heading">
      <div class="wrap">
        <div class="section-head">
          <h2 class="section-head__title" id="plans-heading">What it costs</h2>
          <a class="section-head__link" href="/prices/">See what is in each plan</a>
        </div>

        <!-- The build fee before the plans, on the homepage as on /prices, and
             for the same reason. Three monthly figures with no build fee above
             them is the version where somebody works out the build fee must be
             the difference between them. -->
        <p class="plan-rail__build">
          <strong>${money(BUILD_FEE)} ${escapeHtml(BUILD_WHAT)}.</strong>
          Then choose how much we do afterwards.
        </p>

        <ul class="plan-rail">
${items}
        </ul>
      </div>
    </section>`;
}

/* One plan, in full. The includes list opens with the inherited plan where
   there is one, written as a list item rather than as a sentence above the
   list, so "everything in Online" is read as the first thing you get rather
   than as a caption. */
function renderPlanCard(plan) {
  const inherited = plan.inherits
    ? `            <li class="plan-card__inherit">Everything in ${escapeHtml(plan.inherits)}</li>\n`
    : '';

  const includes = plan.includes
    .map((line) => `            <li>${escapeHtml(line)}</li>`)
    .join('\n');

  const excludes = plan.excludes.length
    ? `\n          <p class="plan-card__excludes">${plan.excludes.map(escapeHtml).join(' ')}</p>`
    : '';

  /* The term, under the price, on every plan. On Local it carries the three
     month minimum, which belongs beside the figure rather than in a footnote. */
  const term = `\n          <p class="plan-card__term">${escapeHtml(plan.term)}</p>`;

  /* Local's limited places, in the same breath as the term. Rendered from the
     plan's own field rather than hand-placed, so it cannot end up under a card
     that is not limited. */
  const places = plan.places
    ? `\n          <p class="plan-card__places">${escapeHtml(countWord(plan.places, { capitalise: true }))} places only</p>`
    : '';

  /* "Best for" comes straight off Ben's own pricing sheet and it is the line
     that does the most work on the card. The other lines describe the plan;
     this one describes the customer, which is what somebody comparing three
     boxes is actually trying to match themselves against. */
  const bestFor = plan.bestFor
    ? `\n          <p class="plan-card__best"><span>Best for</span> ${escapeHtml(plan.bestFor)}</p>`
    : '';

  return `        <article class="plan-card${plan.places ? ' plan-card--lead' : ''}" id="${escapeHtml(plan.id)}">
          <h3 class="plan-card__name">${escapeHtml(plan.name)}</h3>
          <p class="plan-card__summary">${escapeHtml(plan.summary)}</p>

          <p class="plan-card__price">
${renderPrice(plan, 'plan-card__amount', 'plan-card__period')}
          </p>${term}${places}

          <ul class="plan-card__includes">
${inherited}${includes}
          </ul>${excludes}${bestFor}

          <a class="btn btn--secondary plan-card__cta" href="/contact/#enquiry">Ask about ${escapeHtml(plan.name)}</a>
        </article>`;
}

/** The full set of plan cards. */
export function renderPlanCards() {
  return `      <div class="plan-cards">
${PLANS.map(renderPlanCard).join('\n\n')}
      </div>`;
}
