/* Unit tests for the build's copy checks. Run with `npm test`.

   These exist because the checks in build.js are the only thing standing
   between a rewritten sentence and a claim that is not true. A check nobody
   tests is a check that quietly stops firing. */

import test from 'node:test';
import assert from 'node:assert/strict';

import { findLocationClaims } from './build.js';
import { REVIEWS } from '../reviews.js';

const ZOE = REVIEWS.find((review) => review.id === 'zoe');

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

test('a place name inside verbatim review text is forgiven', () => {
  const html = `<blockquote><p>${ZOE.text}</p></blockquote>`;
  assert.deepEqual(findLocationClaims(html, '/test/'), []);
});

test('a place name outside the quote still fails, on a page carrying a review', () => {
  const html =
    `<blockquote><p>${ZOE.text}</p></blockquote>` +
    '<p>Picsel is based in Edinburgh.</p>';
  assert.equal(findLocationClaims(html, '/test/').length > 0, true);
});

test('an altered quote loses its exemption', () => {
  /* One word changed. The strings no longer match, so the place name inside
     is scanned like any other copy. This is the property that stops somebody
     editing a testimonial in a template instead of in reviews.js. */
  const altered = ZOE.text.replace('Really happy', 'Very happy');
  const errors = findLocationClaims(`<blockquote><p>${altered}</p></blockquote>`, '/test/');
  assert.equal(errors.length > 0, true, 'an edited quote must not be exempt');
});

test('a blank review.text does not disable the check for the whole page', () => {
  /* A blank string is an empty needle. split('') does not no-op, it splits the
     haystack between every character, which would turn "Edinburgh" into
     "E d i n b u r g h" across the entire page and hide it from every
     \b-anchored term in CLIENT_TERMS. Pushed onto the real REVIEWS array
     (findLocationClaims reads that import directly, there is no way to hand
     it a substitute) and always removed in `finally`, so a failure here
     cannot leave a blank review behind for another test to trip over. */
  REVIEWS.push({
    id: 'blank-test-fixture',
    author: 'Fixture',
    text: '',
    date: '2026-08-10',
    source: 'google',
    service: null,
    project: null,
  });
  try {
    const errors = findLocationClaims('<p>Picsel is based in Edinburgh.</p>', '/test/');
    assert.equal(errors.length > 0, true, 'a blank review must not forgive a real location claim');
  } finally {
    REVIEWS.pop();
  }
});
