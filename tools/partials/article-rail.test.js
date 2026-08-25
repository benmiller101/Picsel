/* Unit tests for the article rail. Run with `npm test`.

   The variant is chosen from a word count rather than a flag on each page, so
   the thing worth testing is the threshold: a guide that grows past it should
   gain a contents list without anybody remembering to switch one on, and a
   short one must never get a contents list of headings the reader can already
   see. */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  RAIL_CONTENTS_THRESHOLD,
  articleWordCount,
  railVariant,
  renderArticleRail,
} from './article-rail.js';

const LONG = [
  { h2: 'How much does it cost?', blocks: [{ p: 'word '.repeat(800) }] },
  { h2: 'Is it cheaper yourself?', blocks: [{ p: 'word '.repeat(400) }] },
];

const SHORT = [
  { h2: 'The phone number', paragraphs: ['A short answer.'] },
  { h2: 'The towns you cover', paragraphs: ['Another short answer.'] },
];

test('the word count reads paragraphs, list items and table cells', () => {
  const sections = [{
    h2: 'Heading here',
    blocks: [
      { p: 'one two three' },
      { list: ['four five'] },
      { table: { head: ['six'], rows: [['seven', 'eight']] } },
    ],
  }];
  assert.equal(articleWordCount(sections), 8);
});

test('the legacy paragraphs field is counted too', () => {
  assert.equal(articleWordCount([{ h2: 'X', paragraphs: ['one two', 'three'] }]), 3);
});

test('a long article gets the contents variant', () => {
  assert.equal(railVariant(articleWordCount(LONG)), 'contents');
});

test('a short article gets the contact variant', () => {
  assert.equal(railVariant(articleWordCount(SHORT)), 'contact');
});

test('the threshold sits between the shortest long article and the longest short one', () => {
  /* Measured on the built pages on 25 August 2026: the two long articles are
     1,020 and 1,107 words, and the longest of the other six is 479. The
     threshold has to separate those two groups with room on both sides, or a
     small edit to a guide flips its layout. */
  assert.equal(railVariant(479), 'contact');
  assert.equal(railVariant(1020), 'contents');
  assert.equal(RAIL_CONTENTS_THRESHOLD > 479, true);
  assert.equal(RAIL_CONTENTS_THRESHOLD < 1020, true);
});

test('the contents rail links to the same slugs the headings carry', () => {
  const html = renderArticleRail({ prefix: 'post', sections: LONG });
  assert.match(html, /href="#how-much-does-it-cost"/);
  assert.match(html, /href="#is-it-cheaper-yourself"/);
});

test('the contents rail is a nav with an accessible name', () => {
  const html = renderArticleRail({ prefix: 'post', sections: LONG });
  assert.match(html, /<nav class="post__rail-contents" aria-label="On this page">/);
});

test('a short article gets the phone number rather than a contents list', () => {
  const html = renderArticleRail({ prefix: 'guide', sections: SHORT });
  assert.equal(html.includes('rail-contents'), false, 'no contents list on a short article');
  assert.match(html, /tel:/);
});

test('the rail carries no page-level wrapper', () => {
  /* Same contract as plan-cards.js: the rail is dropped inside an existing
     .__inner, so bringing its own <section> or .wrap would nest a wrap in a
     wrap and double the gutter. */
  const html = renderArticleRail({ prefix: 'post', sections: LONG });
  assert.equal(html.includes('class="wrap'), false);
  assert.equal(html.includes('<section'), false);
});
