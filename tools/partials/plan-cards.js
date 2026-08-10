/* ---- plan-cards.js — the plans, drawn two ways ----------------------------
   Both come from PLANS in pricing.js. Two renderers rather than two copies of
   the numbers: the homepage wants a glance and the prices page wants the whole
   thing, and the fastest way to end up with £15 on one page and £19 on another
   is to let each page write its own.

   THE RAIL (homepage) is three names, three prices and one line each. It is
   there to answer "can I afford this" before someone has scrolled far enough
   to care about what is in each plan, and to send them to the page that says.

   THE CARDS (prices page) carry the name, the price, what is included and what
   is not. Nothing else, and the "nothing else" is the design decision.

   The exclusivity promise and the lead guarantee started inside the Growth
   card, which is where they logically belong and where they looked ridiculous:
   two paragraphs of terms in a third-width column made Growth almost twice the
   height of Online, so the set stopped reading as three comparable options and
   started reading as two plans and an essay. A price table's whole job is
   comparison, and a column that tall breaks it.

   They now sit in their own band under the three cards, rendered by
   renderGrowthCommitments(). Both are still tied to Growth in their own
   wording, and the card carries a line pointing down at them, so nothing has
   been loosened by moving it. The band also gives the refund terms enough room
   to be read, which they were not getting at a third of the width. */

import { PLANS, GUARANTEE, money } from '../../pricing.js';
import { SITE } from '../../site.config.js';
import { escapeHtml } from '../templates/page.js';

/** The compact strip for the homepage. */
export function renderPlanRail() {
  const items = PLANS.map(
    (plan) => `          <li class="plan-rail__item">
            <p class="plan-rail__name">${escapeHtml(plan.name)}</p>
            <p class="plan-rail__price">
              <span class="plan-rail__amount">${money(plan.monthly)}</span> a month
            </p>
            <p class="plan-rail__build">plus ${money(plan.build)} to build</p>
            <p class="plan-rail__summary">${escapeHtml(plan.summary)}</p>
          </li>`,
  ).join('\n\n');

  return `    <section class="section plans" aria-labelledby="plans-heading">
      <div class="wrap">
        <div class="section-head">
          <h2 class="section-head__title" id="plans-heading">What it costs</h2>
          <a class="section-head__link" href="/prices/">See what is in each plan</a>
        </div>

        <ul class="plan-rail">
${items}
        </ul>
      </div>
    </section>`;
}

/* One plan, in full. The includes list opens with the inherited plan where
   there is one, written as a list item rather than as a sentence above the
   list, so "everything in Online" is read as the first thing you get rather
   than as a caption.

   `commitmentsHref` is where the Growth card's pointer goes. It defaults to the
   in-page anchor because /prices renders the commitments band itself, a couple
   of screens below these cards. The websites service page now renders the same
   three cards and does NOT carry that band, so it passes the absolute address
   of the one on /prices instead. Without this the card would ship a link to
   #commitments on a page with no such id, which is the quietest kind of broken:
   nothing errors, the anchor simply does nothing when a reader clicks the one
   line on the card that promises them the terms in full. */
function renderPlanCard(plan, commitmentsHref) {
  const inherited = plan.inherits
    ? `            <li class="plan-card__inherit">Everything in ${escapeHtml(plan.inherits)}</li>\n`
    : '';

  const includes = plan.includes
    .map((line) => `            <li>${escapeHtml(line)}</li>`)
    .join('\n');

  const excludes = plan.excludes.length
    ? `\n          <p class="plan-card__excludes">${plan.excludes.map(escapeHtml).join(' ')}</p>`
    : '';

  /* "Best for" comes straight off Ben's own pricing sheet and it is the line
     that does the most work on the card. The other lines describe the plan;
     this one describes the customer, which is what somebody comparing three
     boxes is actually trying to match themselves against. */
  const bestFor = plan.bestFor
    ? `\n          <p class="plan-card__best"><span>Best for</span> ${escapeHtml(plan.bestFor)}</p>`
    : '';

  /* The pointer to the band below, on the one plan those commitments apply to.
     Rendered from the plan's own flags rather than hand-placed, so it cannot
     end up under a card that is not priced to carry them. */
  const carries =
    plan.exclusive || plan.guarantee
      ? `\n          <p class="plan-card__carries">
            <a href="${escapeHtml(commitmentsHref)}">Also carries the exclusivity promise and the lead guarantee</a>
          </p>`
      : '';

  return `        <article class="plan-card${plan.exclusive ? ' plan-card--lead' : ''}" id="${escapeHtml(plan.id)}">
          <h3 class="plan-card__name">${escapeHtml(plan.name)}</h3>
          <p class="plan-card__summary">${escapeHtml(plan.summary)}</p>

          <p class="plan-card__price">
            <span class="plan-card__amount">${money(plan.monthly)}</span>
            <span class="plan-card__period">a month</span>
          </p>
          <p class="plan-card__build">${money(plan.build)} one off to build it</p>

          <ul class="plan-card__includes">
${inherited}${includes}
          </ul>${excludes}${bestFor}${carries}

          <a class="btn btn--secondary plan-card__cta" href="/contact/#enquiry">Ask about ${escapeHtml(plan.name)}</a>
        </article>`;
}

/**
 * The full set of plan cards. Used by /prices and by the websites service page.
 *
 * @param {object} [options]
 * @param {string} [options.commitmentsHref]  Where the Growth card's pointer to
 *   the exclusivity promise and the lead guarantee goes. Defaults to the
 *   in-page anchor, which is correct on /prices and wrong anywhere else.
 */
export function renderPlanCards({ commitmentsHref = '#commitments' } = {}) {
  return `      <div class="plan-cards">
${PLANS.map((plan) => renderPlanCard(plan, commitmentsHref)).join('\n\n')}
      </div>`;
}

/* ---- What Growth carries --------------------------------------------------
   The two commitments, side by side under the cards, with the room they need.

   Named after the plan in the heading and in both pieces of wording, so this
   band cannot be read as applying to Online or Managed no matter which part of
   it somebody's eye lands on first. The build check in tools/build.js is the
   backstop for that, not the design.

   The refund terms are here in full and not behind a link. A refund offer whose
   conditions live somewhere else is a headline, not an offer. */
export function renderGrowthCommitments() {
  const growth = PLANS.find((plan) => plan.exclusive || plan.guarantee);
  if (!growth) return '';

  return `    <section class="section commitments" id="commitments" aria-labelledby="commitments-heading">
      <div class="wrap">
        <div class="section-head">
          <h2 class="section-head__title" id="commitments-heading">
            What ${escapeHtml(growth.name)} commits us to
          </h2>
          <p class="section-head__note">Both of these apply on ${escapeHtml(growth.name)} only</p>
        </div>

        <div class="commitments__grid">
          <div class="commitment">
            <h3 class="commitment__title">Your competitor cannot hire us</h3>
            <p class="commitment__body">${SITE.exclusivity.full}</p>
          </div>

          <div class="commitment">
            <h3 class="commitment__title">The lead guarantee</h3>
            <p class="commitment__body">${escapeHtml(GUARANTEE.promise)}</p>
${GUARANTEE.terms.map((term) => `            <p class="commitment__terms">${escapeHtml(term)}</p>`).join('\n')}
          </div>
        </div>
      </div>
    </section>`;
}
