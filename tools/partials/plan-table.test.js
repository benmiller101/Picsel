/* Unit tests for the article price table. Run with `npm test`.

   The point of these is the blackout. A table of Picsel's own prices inside an
   article is exactly the kind of thing that gets added once and then survives
   SHOW_PRICING going false, because nobody re-reads the copy that is currently
   hidden. So the hidden case is tested first and hardest. */

import test from 'node:test';
import assert from 'node:assert/strict';

import { buildPlanTable } from './plan-table.js';
import { PLANS, BUILD_FEE, money } from '../../pricing.js';
import { countWord } from '../templates/words.js';

test('with pricing hidden the table does not exist at all', () => {
  assert.equal(buildPlanTable({ showPricing: false }), null);
});

test('with pricing shown there is one row per plan', () => {
  const table = buildPlanTable({ showPricing: true });
  assert.equal(table.rows.length, PLANS.length);
});

test('every figure comes from pricing.js rather than being typed', () => {
  const table = buildPlanTable({ showPricing: true });
  const flat = table.rows.flat().join(' ');
  for (const plan of PLANS) {
    assert.equal(flat.includes(money(plan.monthly)), true,
      `${plan.name} monthly ${money(plan.monthly)} missing from the table`);
  }
});

test('the build fee is stated once, in the caption, not per row', () => {
  /* One build fee for every plan is a structural decision in pricing.js: three
     would invite the reader to compare them and the cheap plan would read as
     the cheap build. A build-fee column would undo that. */
  const table = buildPlanTable({ showPricing: true });
  assert.equal(table.caption.includes(money(BUILD_FEE)), true);
  assert.equal(table.head.some((h) => /build/i.test(h)), false,
    'no per-plan build fee column');
});

test('the opening rate is shown with its term rather than as a bare number', () => {
  const growth = PLANS.find((plan) => plan.openingMonthly);
  const table = buildPlanTable({ showPricing: true });
  const row = table.rows.find((r) => r[0] === growth.name).join(' ');
  assert.equal(row.includes(money(growth.openingMonthly)), true);
  assert.equal(row.includes(money(growth.monthly)), true,
    'the opening rate must never appear without the rate it becomes');
});

test('a month count is spelled as a word, while money stays in digits', () => {
  /* words.js: small counts are words in body copy, digits are for data like a
     price. The Growth row carries both in one cell, so it is the one place the
     two rules meet and the easiest place to get wrong. */
  const growth = PLANS.find((plan) => plan.openingMonthly);
  const row = buildPlanTable({ showPricing: true }).rows.find((r) => r[0] === growth.name).join(' ');
  assert.equal(/\bfor \d+ months\b/.test(row), false, 'month count must not be a digit');
  assert.equal(row.includes(`for ${countWord(growth.openingMonths)} months`), true);
});

test('no cell carries an em dash', () => {
  const table = buildPlanTable({ showPricing: true });
  const all = [table.caption, ...table.head, ...table.rows.flat()].join(' ');
  assert.equal(all.includes('—'), false);
});
