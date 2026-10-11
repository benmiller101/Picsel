/* Unit tests for pricing.js. Run with `npm test`.

   Placed under tools/ rather than at the repo root: `npm test` runs
   node --test against a glob rooted at tools/ (see the test script in
   package.json), so a pricing.test.js at the repo root would never execute.
   This one is picked up the same way build.test.js and the partials tests
   are. */

import test from 'node:test';
import assert from 'node:assert/strict';

import { PLANS, EXTRAS, ANNUAL, RESCUE, BUILD_FEE, BUILD_INCLUDES } from '../pricing.js';

/* Every string the price data holds, so a test can read the whole card. */
function allText() {
  const strings = [];
  const walk = (value) => {
    if (typeof value === 'string') strings.push(value);
    else if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === 'object') Object.values(value).forEach(walk);
  };
  walk([PLANS, EXTRAS, ANNUAL, RESCUE, BUILD_INCLUDES]);
  return strings.join(' ');
}

test('the October 2026 card: build, plans, rescue and annual figures', () => {
  assert.equal(BUILD_FEE, 499);
  assert.deepEqual(PLANS.map((plan) => [plan.name, plan.monthly]), [
    ['Online', 15],
    ['Managed', 39],
    ['Local', 89],
  ]);
  assert.equal(RESCUE.price, 99);
  assert.deepEqual(ANNUAL.prices.map(({ price }) => price), [150, 390, 890]);
});

test('Local carries its five places and its three month minimum', () => {
  const local = PLANS.find((plan) => plan.id === 'local');
  assert.equal(local.places, 5);
  assert.equal(/three month minimum/i.test(local.term), true);
});

test('no retired product or promise is back in the price data', () => {
  /* Growth, the lead guarantee and the one trade per patch promise came off
     the card in October 2026. tools/build.js checks the rendered pages; this
     checks the data they are rendered from. */
  const text = allText();
  for (const retired of [/\bGrowth\b/, /guarantee/i, /per patch/i, /exclusiv/i, /founding/i]) {
    assert.equal(retired.test(text), false, `price data still mentions ${retired}`);
  }
});

test('Google Ads and custom tools carry no figure', () => {
  for (const name of ['Google Ads', 'Custom tools']) {
    const extra = EXTRAS.find((candidate) => candidate.name === name);
    assert.ok(extra, `${name} is missing from EXTRAS`);
    assert.equal(`${extra.price} ${extra.body}`.includes('£'), false, `${name} names a figure`);
  }
});
