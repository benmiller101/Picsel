/* Unit tests for the gated-copy pattern in pricing.js. Run with `npm test`.

   Placed under tools/ rather than at the repo root: `npm test` runs
   node --test against a glob rooted at tools/ (see the test script in
   package.json), so a pricing.test.js at the repo root would never execute.
   This one is picked up the same way build.test.js and the partials tests
   are. */

import test from 'node:test';
import assert from 'node:assert/strict';

import { PLANS, EXTRAS, RESCUE, GUARANTEE } from '../pricing.js';

test('every NoPrice variant is genuinely price free', () => {
  /* The blackout switch depends on these strings. A hand-written unpriced
     variant that still names a figure defeats the whole mechanism, and this
     branch found four ungated figures the hard way before anyone wrote this. */
  let examined = 0;

  const walk = (obj, path = '') => {
    for (const [key, value] of Object.entries(obj)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        walk(value, `${path}${key}.`);
      } else if (typeof value === 'string' && /NoPrice$/.test(key)) {
        examined += 1;
        assert.equal(value.includes('£'), false, `${path}${key} still names a figure: ${value}`);
      }
    }
  };

  for (const plan of PLANS) walk(plan, 'PLANS[].');
  for (const extra of EXTRAS) walk(extra, 'EXTRAS[].');
  walk(RESCUE, 'RESCUE.');
  walk(GUARANTEE, 'GUARANTEE.');

  assert.ok(examined > 0, 'no NoPrice field was found to examine, so this test proves nothing');
});
