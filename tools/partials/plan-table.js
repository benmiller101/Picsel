/* ---- plan-table.js — the three plans, as a table, inside an article -------
   An article that names £299, £15, £29, £99 and £179 in one sentence is asking
   the reader to hold five numbers in their head and compare them. That is what
   a table is for, and article-sections.js has had a table renderer with proper
   row and column scopes since the builder guide needed one. So this builds
   data, not markup: a { caption, head, rows } object that drops into a
   `blocks` array as { table: buildPlanTable(...) }.

   NULL WHEN THE PRICES ARE OFF, rather than a table of blanks. Nothing filters
   that null out of a blocks array, and renderBlock would throw if a
   { table: null } block ever reached it, which is correct: the only caller,
   blog.js, gates the whole section that contains this block behind its own
   SHOW_PRICING ternary, so with the prices off that branch, and this table
   inside it, is never built at all. See site.config.js for what that flag
   covers.

   THE BUILD FEE IS IN THE CAPTION AND NOT IN A COLUMN, and that is the same
   structural decision pricing.js makes: one build fee for every plan, stated
   before the plans are named. A build-fee column would put three identical
   numbers side by side and invite exactly the comparison the single fee exists
   to prevent. */

import { PLANS, BUILD_FEE, BUILD_WHAT, money } from '../../pricing.js';
import { countWord } from '../templates/words.js';

/**
 * @param {object}  options
 * @param {boolean} options.showPricing  Pass SHOW_PRICING. False returns null.
 * @returns {{caption: string, head: string[], rows: string[][]}|null}
 */
export function buildPlanTable({ showPricing }) {
  if (!showPricing) return null;

  return {
    caption: `${money(BUILD_FEE)} ${BUILD_WHAT}, then one of these every month.`,
    head: ['Plan', 'A month', 'What the month buys', 'Term'],
    rows: PLANS.map((plan) => [
      plan.name,
      /* Growth opens at a lower rate for its first months. The opening figure
         never appears without the rate it becomes: written as a bare number it
         reads as the price, and the reader finds out otherwise in month four.
         The month count is a word rather than a digit because it is prose, not
         data: words.js's rule is that a small count in body copy is spelled
         out, and only the money itself stays in digits. */
      plan.openingMonthly
        ? `${money(plan.openingMonthly)} for ${countWord(plan.openingMonths)} months, then ${money(plan.monthly)}`
        : money(plan.monthly),
      plan.summary,
      plan.term,
    ]),
  };
}
