/* Unit tests for the build's copy checks. Run with `npm test`.

   These exist because the checks in build.js are the only thing standing
   between a rewritten sentence and a claim that is not true. A check nobody
   tests is a check that quietly stops firing. */

import test from 'node:test';
import assert from 'node:assert/strict';

import { findLocationClaims } from './build.js';

test('a place name in Picsel copy fails the check', () => {
  const html = '<p>A web studio based in Edinburgh, working across the UK.</p>';
  const errors = findLocationClaims(html, '/test/');
  assert.equal(errors.length > 0, true, 'Edinburgh in studio copy should be an error');
});

test('Scotland in Picsel copy fails the check', () => {
  const errors = findLocationClaims('<p>We cover Scotland.</p>', '/test/');
  assert.equal(errors.length > 0, true, 'Scotland in studio copy should be an error');
});

test('clean copy passes', () => {
  const errors = findLocationClaims('<p>Websites for tradespeople across the UK.</p>', '/test/');
  assert.deepEqual(errors, []);
});
