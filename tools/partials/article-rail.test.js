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
  readingMinutes,
  renderArticleRailLeft,
  renderArticleRailRight,
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
  const html = renderArticleRailLeft({
    prefix: 'post', sections: LONG,
    headline: 'H', date: '2026-08-09', longDate: '9 August 2026',
  });
  assert.match(html, /href="#how-much-does-it-cost"/);
  assert.match(html, /href="#is-it-cheaper-yourself"/);
});

test('the contents rail is a nav with an accessible name', () => {
  const html = renderArticleRailLeft({
    prefix: 'post', sections: LONG,
    headline: 'H', date: '2026-08-09', longDate: '9 August 2026',
  });
  assert.match(html, /<nav class="post__rail-contents" aria-label="On this page">/);
});

test('a short article gets the phone number rather than a contents list', () => {
  const left = renderArticleRailLeft({
    prefix: 'guide', sections: SHORT,
    headline: 'H', date: '2026-08-09', longDate: '9 August 2026',
  });
  const right = renderArticleRailRight({ prefix: 'guide' });
  assert.equal(left.includes('rail-contents'), false, 'no contents list on a short article');
  assert.match(right, /tel:/);
});

test('reading time rounds up and never reads as zero minutes', () => {
  /* 200 words a minute is the conventional figure and it is close enough for a
     label whose only job is to set an expectation. What matters more is the
     floor: a 90 word guide must not announce "0 min read". */
  assert.equal(readingMinutes([{ h2: 'X', paragraphs: ['word '.repeat(400)] }]), 2);
  assert.equal(readingMinutes([{ h2: 'X', paragraphs: ['word '.repeat(90)] }]), 1);
  assert.equal(readingMinutes([{ h2: 'X', paragraphs: ['one'] }]), 1);
});

test('the left rail carries the headline, the date and the reading time', () => {
  const html = renderArticleRailLeft({
    prefix: 'guide', sections: SHORT,
    headline: 'What is GEO?', date: '2026-08-09', longDate: '9 August 2026',
  });
  assert.match(html, /What is GEO\?/);
  assert.match(html, /<time datetime="2026-08-09">9 August 2026<\/time>/);
  assert.match(html, /min read/);
});

test('the left rail carries the contents only on a long article', () => {
  const long = renderArticleRailLeft({
    prefix: 'post', sections: LONG, headline: 'H', date: '2026-08-09', longDate: '9 August 2026',
  });
  const short = renderArticleRailLeft({
    prefix: 'post', sections: SHORT, headline: 'H', date: '2026-08-09', longDate: '9 August 2026',
  });
  assert.match(long, /rail-contents/);
  assert.equal(short.includes('rail-contents'), false);
});

test('the right rail is the contact card and nothing else', () => {
  const html = renderArticleRailRight({ prefix: 'guide' });
  assert.match(html, /tel:/);
  assert.equal(html.includes('rail-contents'), false);
  assert.equal(html.includes('<h1'), false);
});

test('neither rail brings a page level wrapper', () => {
  for (const html of [
    renderArticleRailLeft({ prefix: 'post', sections: LONG, headline: 'H', date: '2026-08-09', longDate: '9 August 2026' }),
    renderArticleRailRight({ prefix: 'post' }),
  ]) {
    assert.equal(html.includes('class="wrap'), false);
    assert.equal(html.includes('<section'), false);
  }
});

test('a guide with no date shows the reading time and no empty Written row', () => {
  /* Guides carry no date on purpose: a standing answer that gets edited would
     either go stale or claim a freshness nobody maintains. Only the posts are
     dated pieces of writing. */
  const html = renderArticleRailLeft({ prefix: 'guide', sections: SHORT, headline: 'What is GEO?' });
  assert.match(html, /min read/);
  assert.equal(html.includes('Written'), false);
  assert.equal(/<dd>\s*<\/dd>/.test(html), false, 'no empty definition value');
});
