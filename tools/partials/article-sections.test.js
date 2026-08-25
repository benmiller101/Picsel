/* Unit tests for the article heading slugs. Run with `npm test`.

   These exist because the contents rail and the h2 it points at are generated
   in two different files. If they ever disagree the rail renders links that
   scroll nowhere, and nothing else in the build would notice. */

import test from 'node:test';
import assert from 'node:assert/strict';

import { sectionSlug, sectionSlugs, renderArticleSections } from './article-sections.js';

test('a plain heading becomes a lowercase hyphenated slug', () => {
  assert.equal(sectionSlug('What a trades website has to do'), 'what-a-trades-website-has-to-do');
});

test('a curly apostrophe is removed rather than becoming a hyphen', () => {
  assert.equal(sectionSlug('What pages does a plumber' + String.fromCharCode(0x2019) + 's website actually need?'),
    'what-pages-does-a-plumbers-website-actually-need');
});

test('curly quotes and a question mark do not leave trailing hyphens', () => {
  assert.equal(sectionSlug('How do you show up for "emergency plumber" searches?'),
    'how-do-you-show-up-for-emergency-plumber-searches');
});

test('a straight apostrophe is removed, the same as a curly one', () => {
  /* privacy.js has a heading with a straight apostrophe in it, so this is a
     real page' + String.fromCharCode(0x2019) + 's anchor and not a hypothetical. Both quote characters have to
     vanish rather than collapse to a hyphen, or the same heading slugs two
     different ways depending on which apostrophe someone typed. */
  assert.equal(sectionSlug('What we don' + String.fromCharCode(0x0027) + 't do with it'), 'what-we-dont-do-with-it');
  assert.equal(sectionSlug("What we don" + String.fromCharCode(0x0027) + "t do with it"), 'what-we-dont-do-with-it');
});

test('two identical headings on one page get distinct slugs', () => {
  const slugs = sectionSlugs([{ h2: 'What it costs' }, { h2: 'What it costs' }]);
  assert.deepEqual(slugs, ['what-it-costs', 'what-it-costs-2']);
  assert.equal(new Set(slugs).size, 2, 'slugs on one page must be unique');
});

test('the rendered h2 carries the slug the rail will link to', () => {
  const sections = [{ h2: 'Where three thousand pounds goes', paragraphs: ['Copy.'] }];
  const html = renderArticleSections(sections, 'post');
  assert.match(html, /<h2 id="where-three-thousand-pounds-goes">/);
});

test('an id is emitted for every section, in order', () => {
  const sections = [{ h2: 'One', paragraphs: ['a'] }, { h2: 'Two', paragraphs: ['b'] }];
  const html = renderArticleSections(sections, 'guide');
  const ids = [...html.matchAll(/<h2 id="([^"]+)">/g)].map((m) => m[1]);
  assert.deepEqual(ids, ['one', 'two']);
});