# Article layout and components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the eight long-form pages a real composition (a right rail beside the reading column), fix the type and the CTA gap, and add the three components the articles could not express: a price table, a list, and one sourced number at display size.

**Architecture:** The article shell gains a two-column grid at `min-width: 64rem`. Sections move into a body column and a new `.{prefix}__rail` sits beside them, carrying a sticky contents list on articles over 700 words and a contact card on the rest. Everything else is data: the price table reuses the existing table renderer, the breakdown reuses the existing list renderer, and the stat is a small new pair of selectors. No new build step, no new dependency.

**Tech Stack:** Plain ES modules, `node --test`, hand-written CSS with custom properties. No framework, no bundler beyond esbuild for asset minification.

**Spec:** `docs/specs/2026-08-25-article-layout-design.md`

## Global Constraints

- UK English. No em dashes anywhere in copy, titles, meta descriptions or the rendered page. Neither the character nor `&mdash;`.
- Copy strings inside `p` and `li` are written unescaped and may carry only `a`, `em`, `strong` and `abbr`. Every tag closed. `findUnescapedCopy` in `tools/build.js` fails the build otherwise.
- Escaped fields (`h2`, table cells, standfirst, close and action lines) must use literal `’` and `“ ”`, never entities, because `escapeHtml` would print the entity as text.
- `<title>` maximum 60 characters, enforced by the build. Meta description 150 to 155, enforced.
- Every Picsel figure must be read from `pricing.js` and gated on `SHOW_PRICING`. Market and competitor figures are not gated. See `site.config.js:12-35`.
- A number appears in a post only if a stranger could check it (`tools/pages/blog.js:14-25`).
- No real place names in any copy. `findLocationClaims` fails the build.
- Run `npm run check` (build, tests, then `tools/check.js`) before every commit.
- Commit messages: `[Area] lowercase summary`, body explaining why, ending with the `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>` trailer.

## Correction to the spec

The spec said `tools/partials/article-sections.js` needed no change. That was wrong and this plan supersedes it: a contents list needs anchor targets, and the `h2`s carry no `id` today. Task 1 adds them, and exports the slug function so the rail and the headings cannot disagree.

## File structure

| File | Responsibility |
| --- | --- |
| `tools/partials/article-sections.js` | Modify. Emit `id` on each `h2`; export `sectionSlug` and `sectionSlugs`. |
| `tools/partials/article-sections.test.js` | Create. Unit tests for slugging and collisions. |
| `tools/partials/article-rail.js` | Create. The rail: variant choice, contents list, contact card. No page-level wrapper, following `plan-cards.js`. |
| `tools/partials/article-rail.test.js` | Create. Unit tests for the variant threshold and markup. |
| `tools/partials/plan-table.js` | Create. Builds a `{ table }` block from `PLANS`/`BUILD_FEE`, or `null` when pricing is hidden. |
| `tools/partials/plan-table.test.js` | Create. Unit tests, including the hidden case. |
| `client-results.js` | Create. The dated, checkable client figures. Root, beside `pricing.js` and `reviews.js`. |
| `tools/pages/blog.js` | Modify. Shell, rail, price table, list conversion, stat, headline, last section. |
| `tools/pages/guides.js` | Modify. Shell, rail, and the two ungated hardcoded price paragraphs. |
| `tokens.css` | Modify. Three article-scoped tokens. |
| `article.css` | Modify. Grid shell, rail, stat, type, and the header comment that currently forbids a sidebar. |
| `site.css` | Modify. `.contact-band` margin. |

---

### Task 1: Anchor ids on article headings

**Files:**
- Modify: `tools/partials/article-sections.js`
- Test: `tools/partials/article-sections.test.js` (create)

**Interfaces:**
- Consumes: nothing.
- Produces: `sectionSlug(h2: string) => string` and `sectionSlugs(sections: {h2: string}[]) => string[]`, both exported. Task 2 and Task 3 rely on `sectionSlugs` returning one slug per section, in document order, already de-duplicated.

- [ ] **Step 1: Write the failing test**

Create `tools/partials/article-sections.test.js`:

```js
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
  assert.equal(sectionSlug('What pages does a plumber’s website actually need?'),
    'what-pages-does-a-plumbers-website-actually-need');
});

test('curly quotes and a question mark do not leave trailing hyphens', () => {
  assert.equal(sectionSlug('How do you show up for “emergency plumber” searches?'),
    'how-do-you-show-up-for-emergency-plumber-searches');
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
```

- [ ] **Step 2: Run the test and watch it fail**

Run: `node --test tools/partials/article-sections.test.js`
Expected: FAIL. `sectionSlug` and `sectionSlugs` are not exported, so the import throws `SyntaxError: The requested module './article-sections.js' does not provide an export named 'sectionSlug'`.

- [ ] **Step 3: Add the slug functions**

In `tools/partials/article-sections.js`, directly above `renderArticleSections`, add:

```js
/* ---- Heading anchors ------------------------------------------------------
   The contents rail links to these and the h2s carry them, and the two are
   generated in different files. So the slug is computed in exactly one place
   and both readers call it, the same rule PLUMBER_Q follows for the questions
   themselves. A rail whose links scroll nowhere is the kind of break that no
   test notices and every reader does.

   The curly apostrophe is deleted rather than replaced, so "plumber’s" gives
   "plumbers" and not "plumber-s". Everything else that is not a letter or a
   digit collapses to a single hyphen, and the trailing hyphen a question mark
   would otherwise leave is trimmed. */
export function sectionSlug(h2) {
  return String(h2)
    .toLowerCase()
    .replace(/[’'ʼ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/* One slug per section, in document order, de-duplicated.

   Two sections on one page can legitimately share a heading, and two elements
   cannot share an id. The second occurrence gets a numeric suffix rather than
   the two silently colliding, which would send both rail links to whichever
   one the browser found first. */
export function sectionSlugs(sections) {
  const seen = new Map();
  return sections.map((section) => {
    const base = sectionSlug(section.h2);
    const count = (seen.get(base) || 0) + 1;
    seen.set(base, count);
    return count === 1 ? base : `${base}-${count}`;
  });
}
```

- [ ] **Step 4: Emit the id on each heading**

Still in `tools/partials/article-sections.js`, inside `renderArticleSections`, compute the slugs once and use the index. Replace the `return sections.map((section) => {` opening and the `<h2>` line.

Before:

```js
export function renderArticleSections(sections, prefix) {
  return sections
    .map((section) => {
```

After:

```js
export function renderArticleSections(sections, prefix) {
  const slugs = sectionSlugs(sections);

  return sections
    .map((section, index) => {
```

Before:

```js
      return `        <section class="${prefix}__section">
          <h2>${escapeHtml(section.h2)}</h2>
```

After:

```js
      return `        <section class="${prefix}__section">
          <h2 id="${escapeHtml(slugs[index])}">${escapeHtml(section.h2)}</h2>
```

- [ ] **Step 5: Run the test and watch it pass**

Run: `node --test tools/partials/article-sections.test.js`
Expected: PASS, 6 tests.

- [ ] **Step 6: Confirm nothing else broke**

Run: `npm run check`
Expected: 29 pages built, all tests pass, `tools/check.js` reports only the pre-existing `.post__figure` / `.post__list` notice. No new errors.

- [ ] **Step 7: Commit**

```bash
git add tools/partials/article-sections.js tools/partials/article-sections.test.js
git commit -F- <<'MSG'
[Articles] every heading gets an anchor, and one function decides its name

The contents rail about to land links to these headings, and the rail and the
headings are generated in different files. So the slug is computed once and
both call it. A rail whose links scroll nowhere is the kind of break no test
notices and every reader does.

Two sections on one page may legitimately share a heading and two elements may
not share an id, so the second gets a suffix rather than both links landing on
whichever the browser found first.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
```

---

### Task 2: The rail partial

**Files:**
- Create: `tools/partials/article-rail.js`
- Test: `tools/partials/article-rail.test.js`

**Interfaces:**
- Consumes: `sectionSlugs` from Task 1. `SITE` from `../../site.config.js`.
- Produces: `RAIL_CONTENTS_THRESHOLD` (number), `articleWordCount(sections) => number`, `railVariant(wordCount) => 'contents' | 'contact'`, and `renderArticleRail({ prefix, sections }) => string`. Task 3 calls only `renderArticleRail`.

- [ ] **Step 1: Write the failing test**

Create `tools/partials/article-rail.test.js`:

```js
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
```

- [ ] **Step 2: Run the test and watch it fail**

Run: `node --test tools/partials/article-rail.test.js`
Expected: FAIL. `Cannot find module './article-rail.js'`.

- [ ] **Step 3: Write the partial**

Create `tools/partials/article-rail.js`:

```js
/* ---- article-rail.js — the column beside a guide or a post ----------------
   The articles were the only page type on the site with no composition: a
   608px column of text pinned left with 632px of nothing beside it, which
   reads as a broken template rather than restraint. This is what goes in that
   space.

   TWO OCCUPANTS, CHOSEN BY LENGTH, AND THE LENGTH IS COUNTED RATHER THAN
   DECLARED. A contents list is worth the column on an article you have to
   scroll five times to read. On a two screen guide it lists seven headings the
   reader can already see and never scrolls far enough to earn the position it
   is holding, so those get a contact card instead.

   Measured on the built pages on 25 August 2026: two articles at 1,020 and
   1,107 words, six between 422 and 479. The threshold sits in the gap with
   room on both sides, and it is read off the section data at build time so a
   guide that grows past it gains a contents list without anybody remembering
   to turn one on. That is the whole reason this is a function and not a field
   on each page.

   NO PAGE-LEVEL WRAPPER, the same contract plan-cards.js keeps: this is
   dropped inside an existing .__inner, so a <section> or a .wrap of its own
   would nest a wrap inside a wrap and double the gutter. */

import { SITE } from '../../site.config.js';
import { escapeHtml } from '../templates/page.js';
import { sectionSlugs } from './article-sections.js';

/* Between 479 and 1,020, the two numbers it has to separate. Written as a
   named export so the test can assert it still sits in that gap rather than
   hardcoding the same figure twice. */
export const RAIL_CONTENTS_THRESHOLD = 700;

/* Words in the body, which is what decides whether a contents list is worth
   the column. Counts every string a reader actually reads: paragraphs, list
   items and table cells, across both the `blocks` shape and the older
   `paragraphs`/`list` one, because six of the eight articles still use the
   latter and would otherwise count as empty. */
export function articleWordCount(sections) {
  const strings = [];

  for (const section of sections) {
    for (const block of section.blocks || []) {
      if (block.p) strings.push(block.p);
      if (block.list) strings.push(...block.list);
      if (block.orderedList) strings.push(...block.orderedList);
      if (block.table) {
        strings.push(...block.table.head, ...block.table.rows.flat());
      }
    }
    strings.push(...(section.paragraphs || []));
    strings.push(...(section.list || []));
  }

  return strings
    .join(' ')
    .replace(/<[^>]+>/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function railVariant(wordCount) {
  return wordCount >= RAIL_CONTENTS_THRESHOLD ? 'contents' : 'contact';
}

/* A real <nav> with a name, not a styled list. A reader on a screen reader
   gets it in the landmarks list and can jump to it, which is most of why a
   contents list is worth having at all. */
function renderContents(prefix, sections) {
  const slugs = sectionSlugs(sections);

  const items = sections
    .map(
      (section, index) =>
        `          <li><a href="#${escapeHtml(slugs[index])}">${escapeHtml(section.h2)}</a></li>`,
    )
    .join('\n');

  return `      <nav class="${prefix}__rail-contents" aria-label="On this page">
        <p class="${prefix}__rail-label">On this page</p>
        <ol class="${prefix}__rail-list">
${items}
        </ol>
      </nav>`;
}

/* The short articles' occupant. The phone number first because that is what
   this audience actually does, the response promise underneath it because it
   is the one thing that makes an email feel worth sending, and both read from
   site.config.js so the rail cannot promise something the contact page does
   not. */
function renderContactCard(prefix) {
  return `      <div class="${prefix}__rail-card">
        <p class="${prefix}__rail-label">Talk to a person</p>
        <p class="${prefix}__rail-phone">
          <a href="${escapeHtml(SITE.contact.phoneHref)}">${escapeHtml(SITE.contact.phoneDisplay)}</a>
        </p>
        <p class="${prefix}__rail-promise">${escapeHtml(SITE.responsePromise)}</p>
        <a class="${prefix}__rail-link" href="/contact/#enquiry">Send an enquiry</a>
      </div>`;
}

/**
 * The rail beside an article.
 *
 * @param {object} options
 * @param {string} options.prefix    'guide' or 'post'.
 * @param {object[]} options.sections The same array passed to renderArticleSections.
 * @returns {string} Markup for one <aside>, with no page-level wrapper.
 */
export function renderArticleRail({ prefix, sections }) {
  const variant = railVariant(articleWordCount(sections));

  const body = variant === 'contents'
    ? renderContents(prefix, sections)
    : renderContactCard(prefix);

  return `    <aside class="${prefix}__rail ${prefix}__rail--${variant}">
${body}
    </aside>`;
}
```

- [ ] **Step 4: Run the test and watch it pass**

Run: `node --test tools/partials/article-rail.test.js`
Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add tools/partials/article-rail.js tools/partials/article-rail.test.js
git commit -F- <<'MSG'
[Articles] the rail, and the word count that decides what goes in it

Two occupants. A contents list is worth a column on an article you scroll five
times to read; on a two screen guide it indexes headings the reader can already
see and never moves far enough to earn the space. So the long ones get contents
and the short ones get the phone number.

The choice is counted off the section data rather than declared per page, so a
guide that grows past the threshold gains a contents list without anybody
remembering to switch one on. Measured on the built pages: two articles at
1,020 and 1,107 words, six between 422 and 479, and the threshold sits in that
gap with room on both sides.

The count reads the legacy paragraphs shape as well as blocks, because six of
the eight articles still use it and would otherwise count as empty and all get
the wrong rail.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
```

---

### Task 3: Wire the rail into both article shells

**Files:**
- Modify: `tools/pages/blog.js` (the `renderPost` content template)
- Modify: `tools/pages/guides.js` (the `renderGuide` content template, around `guides.js:1127`)

**Interfaces:**
- Consumes: `renderArticleRail` from Task 2.
- Produces: the markup contract Task 4 styles. Exactly: `<div class="{prefix}__cols">` containing `<div class="{prefix}__col">` (all the sections) then the rail `<aside>`.

- [ ] **Step 1: Import the rail in `tools/pages/blog.js`**

Add beside the other partial imports:

```js
import { renderArticleRail } from '../partials/article-rail.js';
```

- [ ] **Step 2: Wrap the sections and add the rail in `renderPost`**

In `tools/pages/blog.js`, in the `content` template inside `renderPost`.

Before:

```js
${action}

${sections}

        <aside class="post__close">
```

After:

```js
${action}

        <div class="post__cols">
          <div class="post__col">
${sections}
          </div>

${renderArticleRail({ prefix: 'post', sections: post.sections })}
        </div>

        <aside class="post__close">
```

- [ ] **Step 3: Do the same in `tools/pages/guides.js`**

Add the import:

```js
import { renderArticleRail } from '../partials/article-rail.js';
```

Then find the equivalent run in `renderGuide` where `${sections}` is placed inside `<div class="wrap guide__inner">`, and wrap it identically, substituting the `guide` prefix and the guide's own sections array:

```js
        <div class="guide__cols">
          <div class="guide__col">
${sections}
          </div>

${renderArticleRail({ prefix: 'guide', sections: guide.sections })}
        </div>
```

Note: `renderGuide` builds `sections` from the guide's section array before this point. Pass that same array, not the rendered string.

- [ ] **Step 4: Build and confirm the rail is on every article**

Run:

```bash
npm run build >/dev/null && python - <<'PY'
import io, re, glob
for f in sorted(glob.glob('dist/blog/*/index.html') + glob.glob('dist/guides/*/index.html')):
    s = io.open(f, encoding='utf-8').read()
    if 'post__inner' not in s and 'guide__inner' not in s:
        continue
    variant = 'contents' if 'rail--contents' in s else ('contact' if 'rail--contact' in s else 'NONE')
    print(f'{variant:9} {f}')
PY
```

Expected: every article page listed. `contents` for `dist/guides/builder-website-cost/index.html` and `dist/blog/plumber-website-cost-2026/index.html`. `contact` for the other six. No `NONE`.

- [ ] **Step 5: Confirm the contents links resolve**

Run:

```bash
python - <<'PY'
import io, re
f = 'dist/blog/plumber-website-cost-2026/index.html'
s = io.open(f, encoding='utf-8').read()
targets = set(re.findall(r'<h2 id="([^"]+)"', s))
links = re.findall(r'rail-list.*?</ol>', s, re.S)
hrefs = set(re.findall(r'href="#([^"]+)"', links[0])) if links else set()
print('headings:', len(targets), 'rail links:', len(hrefs))
print('links with no heading:', sorted(hrefs - targets) or 'none')
PY
```

Expected: `headings: 6 rail links: 6`, and `links with no heading: none`.

- [ ] **Step 6: Full check**

Run: `npm run check`
Expected: 29 pages, tests pass, no new `check.js` findings beyond the known `.post__figure` / `.post__list` notice.

- [ ] **Step 7: Commit**

```bash
git add tools/pages/blog.js tools/pages/guides.js dist
git commit -F- <<'MSG'
[Articles] the sections move into a column, and the rail goes beside them

Markup only. Both shells now put the run of sections in a .__col and the rail
next to it in a .__cols wrapper, which is the contract the stylesheet in the
next commit needs. Unstyled, the rail simply renders under the article, which
is also exactly what it does below the breakpoint.

Verified on the built pages: contents on the two long articles, the contact
card on the other six, and every rail link resolving to a heading that exists.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
```

---

### Task 4: The two-column shell, the type, and the rail styling

**Files:**
- Modify: `tokens.css` (the measure block, around line 204-209)
- Modify: `article.css` (header comment at the top; the section rules around 91-101; new rules at the end)

**Interfaces:**
- Consumes: the markup contract from Task 3.
- Produces: nothing other tasks import.

- [ ] **Step 1: Add the three article tokens**

In `tokens.css`, directly after the `--measure: 38rem;` line, add:

```css
  /* ---- The article shell ------------------------------------------------
     The guides and the posts read wider and larger than the rest of the site,
     and these three are why they can without restyling the other 21 pages.

     --article-measure is 40rem rather than the 38rem everything else uses,
     and it moves WITH --article-text rather than instead of it. Measured on
     the rendered page by counting line boxes: the old 38rem at 17px runs at a
     mean of 60 characters a line, which is already inside the 55 to 65 band
     long-form wants. Raising the type to 18px alone would drop that to 57;
     widening to 40rem at the same time holds it at 60. Change one of the two
     and the line length moves. They are a pair.

     --article-rail is the column beside the text. 16rem, which at the 64rem
     breakpoint leaves 40 + 3 + 16 = 59rem inside a 59rem content box with the
     gutters off, and that is the tightest the layout ever gets. */
  --article-measure: 40rem;
  --article-text: 1.125rem;
  --article-rail: 16rem;
```

- [ ] **Step 2: Rewrite the stylesheet header, which currently forbids this**

In `article.css`, replace the third paragraph of the opening comment.

Before:

```
   No columns, no sidebar, no pull quotes, no reading-progress bar. A single
   measure down the middle-left of the page and generous space between
   sections. The restraint is the design.
```

After:

```
   One reading column and one rail beside it, above 64rem. No reading-progress
   bar, no floating share buttons, no related-posts grid.

   THE RAIL IS NEW AND THIS PARAGRAPH USED TO FORBID IT. It said "no columns,
   no sidebar, no pull quotes" and meant it: a single measure and generous
   space, with the restraint as the design. What that produced on a desktop was
   a 608px column pinned to the left with 632px of nothing to the right of it,
   which reads as a broken template rather than as restraint. Restraint is the
   design when there is a design; an empty half screen is not one. So the rail
   went in, and one number at display size with it. The rule that stands is the
   one underneath the old wording: nothing in that column unless it earns the
   space. See article-rail.js for what earns it and how the choice is made.
```

- [ ] **Step 3: Point the article sections at the article measure**

In `article.css`, the rule at roughly line 91. The service sections keep the site measure; only the two article prefixes move.

Before:

```css
.guide__section,
.post__section,
.service__section {
  max-width: var(--measure);
}
```

After:

```css
/* The service sections keep the site measure. Only the two long-form prefixes
   take the wider article one, because only they carry 1,000 words at a time. */
.guide__section,
.post__section {
  max-width: var(--article-measure);
}

.service__section {
  max-width: var(--measure);
}
```

- [ ] **Step 4: Add the shell, the type and the rail**

Append to `article.css`:

```css
/* ---- The two column shell -------------------------------------------------
   Below 64rem this is one column and the rail falls underneath the article,
   which is the right way round: a contents list that renders after the content
   it indexes is worse than no contents list, so on a phone the contents
   variant is hidden rather than moved. The contact card stays, because a phone
   number under an article is useful at any width.

   align-items: start is load-bearing. Without it the rail stretches to the
   height of the article and `position: sticky` inside a full height box has
   nothing to stick against, so the sticky element simply sits at the top and
   never moves. That is the single easiest way to build this and have it
   silently not work. */
.guide__col > * + *,
.post__col > * + * {
  margin-top: var(--space-8);
}

.guide__rail,
.post__rail {
  margin-top: var(--space-8);
}

@media (min-width: 64rem) {
  .guide__cols,
  .post__cols {
    display: grid;
    grid-template-columns: minmax(0, var(--article-measure)) var(--article-rail);
    column-gap: var(--space-12);
    align-items: start;
  }

  .guide__rail,
  .post__rail {
    margin-top: 0;
  }

  /* Sticky, and only for the contents variant. The contact card has nothing to
     follow the reader for.

     top clears the floating nav, which sits over the page rather than in the
     flow. max-height plus its own overflow is what stops a long contents list
     running off the bottom of a short laptop screen with no way to reach the
     last item. */
  .guide__rail--contents,
  .post__rail--contents {
    position: sticky;
    top: calc(var(--nav-height) + var(--space-8));
    max-height: calc(100svh - var(--nav-height) - var(--space-16));
    overflow-y: auto;
  }
}

/* Below the breakpoint the contents list is hidden rather than stacked. See
   the note above: it would otherwise index content the reader has already
   scrolled past to reach it. */
@media (max-width: 63.999rem) {
  .guide__rail--contents,
  .post__rail--contents {
    display: none;
  }
}

/* ---- Long-form body size --------------------------------------------------
   17px is the site's body size and it is right on a page somebody scans. These
   two page types are read rather than scanned, and 18px with the wider measure
   holds the same 60 characters a line at a size that is easier at arm's length
   in a workshop. Scoped to the article prefixes on purpose: --text-base is read
   by all 29 pages. */
.guide__col,
.post__col {
  font-size: var(--article-text);
}

/* ---- The rail's own furniture --------------------------------------------- */
.guide__rail-label,
.post__rail-label {
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--ink-faint);
  margin-bottom: var(--space-4);
}

.guide__rail-list,
.post__rail-list {
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: var(--text-sm);
  line-height: var(--leading-snug);
}

.guide__rail-list li + li,
.post__rail-list li + li {
  margin-top: var(--space-3);
}

.guide__rail-list a,
.post__rail-list a {
  color: var(--ink-muted);
  text-decoration: none;
}

.guide__rail-list a:hover,
.guide__rail-list a:focus-visible,
.post__rail-list a:hover,
.post__rail-list a:focus-visible {
  color: var(--ink);
  text-decoration: underline;
  text-underline-offset: 0.2em;
  text-decoration-color: var(--accent);
}

.guide__rail-card,
.post__rail-card {
  border-top: 1px solid var(--line);
  padding-top: var(--space-4);
}

.guide__rail-phone,
.post__rail-phone {
  font-size: var(--text-xl);
  line-height: var(--leading-snug);
}

.guide__rail-phone a,
.post__rail-phone a {
  color: var(--ink);
  text-decoration: none;
}

.guide__rail-phone a:hover,
.guide__rail-phone a:focus-visible,
.post__rail-phone a:hover,
.post__rail-phone a:focus-visible {
  text-decoration: underline;
  text-underline-offset: 0.2em;
  text-decoration-color: var(--accent);
}

.guide__rail-promise,
.post__rail-promise {
  margin-top: var(--space-3);
  font-size: var(--text-sm);
  color: var(--ink-faint);
}

.guide__rail-link,
.post__rail-link {
  display: inline-block;
  margin-top: var(--space-4);
  font-size: var(--text-sm);
  color: var(--ink);
  text-decoration: underline;
  text-underline-offset: 0.2em;
  text-decoration-color: var(--accent);
  /* A standalone control, so it gets a real tap target rather than the
     line-height of its own text. */
  min-height: 44px;
  line-height: 44px;
}
```

- [ ] **Step 5: Check the tracking token exists**

Run: `grep -n "tracking-wide" tokens.css`
Expected: one definition. If it does not exist, use `--tracking-display` instead in the two `__rail-label` rules and note the substitution in the commit message.

- [ ] **Step 6: Build and measure the line length**

Run `npm run build`, then serve and measure:

```bash
(npx --yes serve dist --listen 4321 >/dev/null 2>&1 &) ; sleep 3
```

Open `http://localhost:4321/blog/plumber-website-cost-2026/` in the browser and run:

```js
const r=document.createRange();
const cpl=el=>{r.selectNodeContents(el);
  const tops=new Set([...r.getClientRects()].map(x=>Math.round(x.top)));
  return Math.round(el.textContent.trim().length/tops.size);};
const ps=[...document.querySelectorAll('.post__section p')].filter(p=>p.textContent.length>200);
JSON.stringify({
  cpl: ps.map(cpl),
  mean: Math.round(ps.map(cpl).reduce((a,b)=>a+b,0)/ps.length),
  fontSize: getComputedStyle(ps[0]).fontSize,
  colWidth: Math.round(document.querySelector('.post__col').getBoundingClientRect().width),
  railWidth: Math.round(document.querySelector('.post__rail').getBoundingClientRect().width),
  deadRight: Math.round(innerWidth - document.querySelector('.post__rail').getBoundingClientRect().right),
})
```

Expected: `fontSize: "18px"`, mean cpl between 55 and 65, `railWidth` 256, and `deadRight` far smaller than the 632 measured before this work.

- [ ] **Step 7: Check the sticky rail actually sticks**

On the same page, scroll down and confirm the contents list stays in view:

```js
scrollTo(0, 1500);
await new Promise(r=>setTimeout(r,200));
const rail=document.querySelector('.post__rail--contents');
JSON.stringify({ top: Math.round(rail.getBoundingClientRect().top),
                 position: getComputedStyle(rail).position });
```

Expected: `position: "sticky"` and a `top` close to the nav offset (around 94), not a large negative number. A large negative number means `align-items: start` was lost and the rail is stretching.

- [ ] **Step 8: Check 1024, the tightest case**

Resize to 1024 wide and confirm no horizontal page scroll:

```js
JSON.stringify({ pageScrollsSideways: document.documentElement.scrollWidth > document.documentElement.clientWidth,
                 col: Math.round(document.querySelector('.post__col').getBoundingClientRect().width),
                 rail: Math.round(document.querySelector('.post__rail').getBoundingClientRect().width) })
```

Expected: `pageScrollsSideways: false`.

- [ ] **Step 9: Check a short article and a phone width**

Load `http://localhost:4321/guides/how-to-get-more-google-reviews/` and confirm the contact card renders beside the text at desktop. Then narrow to 375 and confirm the contents variant is hidden on the long article while the contact card still shows on the short one.

- [ ] **Step 10: Full check and commit**

Run: `npm run check`

```bash
git add tokens.css article.css dist
git commit -F- <<'MSG'
[Articles] the empty half of the page becomes a column

The guides and the posts were the only page type here with no composition: a
608px column pinned left with 632px of nothing beside it. The service pages
solved this months ago and the articles never got it.

The stylesheet header used to forbid exactly this, in as many words, so it has
been rewritten rather than left to contradict the rules underneath it. The rule
that survives is the one the old wording was reaching for: nothing in that
column unless it earns the space.

The measure and the type move together and that is not two changes. Counting
line boxes on the rendered page, 38rem at 17px already runs at 60 characters a
line, which is inside the band long-form wants. Raising the type alone would
drop it to 57. 40rem at 18px holds 60 at a size that is easier to read at arm's
length. Change one without the other and the line length moves.

align-items: start is load-bearing. Without it the rail stretches to the full
height of the article and the sticky contents list has nothing to stick
against, so it sits at the top and never moves.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
```

---

### Task 5: Close the CTA gap

**Files:**
- Modify: `site.css` (the `.contact-band` rule, around line 1043)

**Interfaces:** none.

- [ ] **Step 1: Record the gap before touching it**

With the site served, on `http://localhost:4321/blog/why-trades-websites-cost-so-much/`:

```js
const lastP=[...document.querySelectorAll('.post__section p')].pop();
const h=document.querySelector('.contact-band').querySelector('h2,h3')||document.querySelector('.contact-band').firstElementChild;
Math.round(h.getBoundingClientRect().top - lastP.getBoundingClientRect().bottom)
```

Expected: about 525. Write the number down.

- [ ] **Step 2: Drop the band's duplicated rhythm**

In `site.css`, the `.contact-band` rule.

Before:

```css
.contact-band {
  margin-top: var(--section-y);
  padding-block: var(--section-y);
  border-top: 1px solid var(--line);
}
```

After:

```css
/* THE MARGIN IS GONE AND THAT IS THE FIX, not a tightening of taste.

   .contact-band is not a .section, so it re-implemented the section rhythm
   with its own margin-top rather than inheriting it. The section above it
   already ends with --section-y of padding, and the band then added the same
   value again as margin and a third time as its own padding-top: 360px of
   nothing at a desktop size, measured at 525px from the last paragraph to the
   band's heading once the closing aside was counted too.

   The border-top is what separates the band from the section above it. That
   was always the job the margin looked like it was doing. */
.contact-band {
  padding-block: var(--section-y);
  border-top: 1px solid var(--line);
}
```

- [ ] **Step 3: Rebuild and measure again**

Run `npm run build`, reload the page, and run the same measurement from Step 1.
Expected: roughly 180 to 200, down from 525. If it is still over 300, the article's `padding-bottom` is also contributing more than expected; check `base.css:347` and confirm `.section` is the only source.

- [ ] **Step 4: Check the band on the pages that are not articles**

The band also closes the homepage, the work index and every project page. Load `http://localhost:4321/`, `http://localhost:4321/work/` and one project page, and confirm the band still reads as a separate closing band rather than crowding the section above it. The border plus 120px of its own padding should be doing that work.

- [ ] **Step 5: Full check and commit**

Run: `npm run check`

```bash
git add site.css dist
git commit -F- <<'MSG'
[Layout] the dead half screen above every closing band

525px from the last paragraph of an article to the CTA heading, measured. The
cause was one value counted three times: the section above ends with
--section-y of padding, the band added the same value again as margin, and then
a third time as its own padding-top.

.contact-band is not a .section, so it re-implemented the rhythm instead of
inheriting it, and the two stacked. Removing the margin leaves the border-top
doing the separating, which was always the job the margin looked like it was
doing. About 180px now.

--section-y is untouched. It is correct everywhere else it is used, and this
was never a problem with the value.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
```

---

### Task 6: The price table, and the two ungated price paragraphs

**Files:**
- Create: `tools/partials/plan-table.js`
- Test: `tools/partials/plan-table.test.js`
- Modify: `tools/pages/blog.js` (the "What I charge, and what is in it" section)
- Modify: `tools/pages/guides.js:722-726` and `guides.js:837-838`

**Interfaces:**
- Consumes: `PLANS`, `BUILD_FEE`, `money` from `../../pricing.js`.
- Produces: `buildPlanTable({ showPricing }) => object | null`, returning a `{ caption, head, rows }` shaped for the existing `{ table }` block.

- [ ] **Step 1: Write the failing test**

Create `tools/partials/plan-table.test.js`:

```js
/* Unit tests for the article price table. Run with `npm test`.

   The point of these is the blackout. A table of Picsel's own prices inside an
   article is exactly the kind of thing that gets added once and then survives
   SHOW_PRICING going false, because nobody re-reads the copy that is currently
   hidden. So the hidden case is tested first and hardest. */

import test from 'node:test';
import assert from 'node:assert/strict';

import { buildPlanTable } from './plan-table.js';
import { PLANS, BUILD_FEE, money } from '../../pricing.js';

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

test('no cell carries an em dash', () => {
  const table = buildPlanTable({ showPricing: true });
  const all = [table.caption, ...table.head, ...table.rows.flat()].join(' ');
  assert.equal(all.includes('—'), false);
});
```

- [ ] **Step 2: Run the test and watch it fail**

Run: `node --test tools/partials/plan-table.test.js`
Expected: FAIL. `Cannot find module './plan-table.js'`.

- [ ] **Step 3: Write the partial**

Create `tools/partials/plan-table.js`:

```js
/* ---- plan-table.js — the three plans, as a table, inside an article -------
   An article that names £299, £15, £29, £99 and £179 in one sentence is asking
   the reader to hold five numbers in their head and compare them. That is what
   a table is for, and article-sections.js has had a table renderer with proper
   row and column scopes since the builder guide needed one. So this builds
   data, not markup: a { caption, head, rows } object that drops into a
   `blocks` array as { table: buildPlanTable(...) }.

   NULL WHEN THE PRICES ARE OFF, rather than a table of blanks. The caller
   filters it out of the blocks array, so with SHOW_PRICING false the section
   simply has no table in it. See site.config.js for what that flag covers.

   THE BUILD FEE IS IN THE CAPTION AND NOT IN A COLUMN, and that is the same
   structural decision pricing.js makes: one build fee for every plan, stated
   before the plans are named. A build-fee column would put three identical
   numbers side by side and invite exactly the comparison the single fee exists
   to prevent. */

import { PLANS, BUILD_FEE, BUILD_WHAT, money } from '../../pricing.js';

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
         reads as the price, and the reader finds out otherwise in month four. */
      plan.openingMonthly
        ? `${money(plan.openingMonthly)} for ${plan.openingMonths} months, then ${money(plan.monthly)}`
        : money(plan.monthly),
      plan.summary,
      plan.term,
    ]),
  };
}
```

- [ ] **Step 4: Run the test and watch it pass**

Run: `node --test tools/partials/plan-table.test.js`
Expected: PASS, 6 tests.

If the `term` or `summary` field name is wrong, read `pricing.js` and correct the mapping rather than changing the test: the test asserts behaviour, the field names are facts about that file.

- [ ] **Step 5: Put the table in the post**

In `tools/pages/blog.js`, import it:

```js
import { buildPlanTable } from '../partials/plan-table.js';
```

Then in the `why-trades-websites-cost-so-much` post, the `SHOW_PRICING ? { ... }` section titled "What I charge, and what is in it". Convert that section from `paragraphs` to `blocks`, replacing the single long price sentence with the table. The two sentences after it stay as they are.

```js
      SHOW_PRICING
        ? {
            h2: 'What I charge, and what is in it',
            blocks: [
              { p: `${money(BUILD_FEE)} to build it, whichever plan you pick. Then one of these every month.` },
              { table: buildPlanTable({ showPricing: SHOW_PRICING }) },
              { p: 'One build fee rather than three is deliberate. Three would invite you to compare them, and the moment you do, the cheap plan reads as the cheap build. It is the same build every time.' },
              { p: 'The figures matter less than where they are. They are on the website, so you can hold them against anyone else before you pick up the phone. Most of this trade still makes you ring to find out. If you want a straight price for your own job, <a href="/contact/">get in touch</a> and I will give you one on the phone.' },
            ],
          }
        : {
```

The `SHOW_PRICING ? ... : ...` branch already replaces this whole section when pricing is off, so `buildPlanTable` can never be reached with a false flag from here. It still takes the flag, because the next caller may not have that guarantee.

- [ ] **Step 6: Fix the two ungated hardcoded price paragraphs in the builder guide**

`tools/pages/guides.js:722-726` currently reads, as a plain string with every figure typed by hand and no `SHOW_PRICING` branch:

> "Picsel sits in the third row. £299 to build, then £15 a month for hosting and security, £29 a month if you want changes made for you, or £99 a month for the first three months and £179 after that if you want us actively working on getting you found. Numbers on the prices page."

Replace that block with a gated pair, reading every figure from `pricing.js`. Note `guides.js` already imports `PLANS, BUILD_FEE, money` at line 32 and simply was not using them here.

```js
            /* Was five hardcoded figures and no gate, which made this and the
               paragraph further down the only Picsel prices on the site that
               survived SHOW_PRICING going false. Both now read from pricing.js
               and both disappear with everything else. */
            ...(SHOW_PRICING
              ? [{
                  p: `Picsel sits in the third row. ${money(BUILD_FEE)} to build, then `
                    + `${money(PLANS[0].monthly)} a month for hosting and security, `
                    + `${money(PLANS[1].monthly)} a month if you want changes made for you, or `
                    + `${money(PLANS[2].openingMonthly)} a month for the first `
                    + `${PLANS[2].openingMonths} months and ${money(PLANS[2].monthly)} after that `
                    + 'if you want us actively working on getting you found. Numbers on the '
                    + '<a href="/prices/">prices page</a>.',
                }]
              : [{
                  p: 'Picsel sits in the third row. I am rebuilding my plans, so there is no '
                    + 'price list here to hold anyone against. <a href="/contact/">Send me the '
                    + 'details</a> and I will give you a figure for your own job.',
                }]),
```

Do the same at `guides.js:837-838`, which reads "Picsel builds websites for building firms anywhere in the UK. £299 to build, then from £15 a month, and live in days." Gate it and derive both figures the same way.

- [ ] **Step 7: Derive the £839 literal**

In `tools/pages/blog.js`, the plumber post's section 1 currently ends with a hardcoded `£839`. Replace it:

```js
          ...(SHOW_PRICING
            ? [{ p: `Mine is ${money(BUILD_FEE)} to build, then ${money(ONLINE.monthly)} a month. `
                 + `Over three years that’s ${money(BUILD_FEE + ONLINE.monthly * 36)}.` }]
            : []),
```

And the same figure in `PLUMBER_TABLE`'s Picsel row:

```js
          money(BUILD_FEE + ONLINE.monthly * 36),
```

- [ ] **Step 8: Prove the blackout works**

```bash
cp site.config.js /tmp/sc.bak
sed -i "s/^export const SHOW_PRICING = true;/export const SHOW_PRICING = false;/" site.config.js
npm run build >/dev/null && python - <<'PY'
import io, re, glob, html
bad = []
for f in glob.glob('dist/**/*.html', recursive=True):
    s = io.open(f, encoding='utf-8').read()
    t = html.unescape(re.sub(r'<[^>]+>', ' ', s))
    for n in ['£299', '£179', '£29 a month', '£15 a month', '£99 a month']:
        if n in t:
            bad.append((f, n))
print('Picsel figures surviving the blackout:', bad or 'none')
print('prices page built:', __import__('os').path.exists('dist/prices/index.html'))
PY
cp /tmp/sc.bak site.config.js && npm run build >/dev/null
```

Expected: `none`, and `prices page built: False`. Before this task the builder guide's two paragraphs would have appeared in that list.

- [ ] **Step 9: Full check and commit**

Run: `npm run check`

```bash
git add tools/partials/plan-table.js tools/partials/plan-table.test.js tools/pages/blog.js tools/pages/guides.js dist
git commit -F- <<'MSG'
[Prices] three plans become a table, and two paragraphs stop dodging the blackout

The post named £299, £15, £29, £99 and £179 in one sentence and asked the
reader to hold all five. That is what a table is for, and article-sections.js
has had one with proper row and column scopes since the builder guide needed
it, so this adds data rather than markup.

The build fee stays in the caption instead of becoming a column. Three
identical numbers side by side would invite exactly the comparison that one
build fee exists to prevent, which is pricing.js's own reasoning.

Then the bug the audit turned up. guides.js had two paragraphs with every
Picsel figure typed by hand and no SHOW_PRICING branch, which made them the
only prices on the site that survived the blackout. The file was already
importing PLANS and BUILD_FEE and simply not using them there. Both now read
from pricing.js and both disappear with everything else.

Also derived the £839 three year total, which shipped as a literal in the last
commit and would have quietly stopped being true at the next repricing.

Proved rather than assumed: built with SHOW_PRICING false and grepped every
page for all five figures. None survive.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
```

---

### Task 7: The £3,000 breakdown becomes a list

**Files:**
- Modify: `tools/pages/blog.js`, the "Where three thousand pounds goes" section

**Interfaces:** none. Uses the existing `{ list }` block.

- [ ] **Step 1: Convert the section from `paragraphs` to `blocks`**

The section currently uses the legacy `paragraphs` field, which can only render its list after every paragraph. The list has to sit between the framing sentences, so the section moves to `blocks`.

Before:

```js
      {
        h2: 'Where three thousand pounds goes',
        paragraphs: [
          'The quote is usually honest and the work behind it is real. It is just that most ' +
            'of it is not work on your website.',
          'There is an account manager whose job is to be the person you ring. There is a ' +
            'discovery workshop, which is a meeting about what you do for a living. There are ' +
            'three rounds of design on a site with five pages on it, because the process was ' +
            'written for clients who have a marketing department to satisfy. And underneath ' +
            'all of it there is an office, the people in it, and the software they run.',
          'It is a process built for a different kind of customer, sold to you at what it ' +
            'costs to run.',
        ],
      },
```

After:

```js
      {
        h2: 'Where three thousand pounds goes',
        /* Moved from `paragraphs` to `blocks` so the list can sit between the
           two framing sentences. The legacy shape renders its list after every
           paragraph, which would put the closing line above the thing it is
           closing.

           A LIST AND NOT A BAR. A proportion bar needs a number against each of
           these four and no such split exists, here or anywhere. The rule at
           the top of this file is that a post carries a figure only if a
           stranger could check it, and four invented percentages to fill a
           chart is precisely what that is there to stop. */
        blocks: [
          { p: 'The quote is usually honest and the work behind it is real. It is just that most of it is not work on your website.' },
          { list: [
            'An account manager, whose job is to be the person you ring.',
            'A discovery workshop, which is a meeting about what you do for a living.',
            'Three rounds of design, on a site with five pages on it.',
            'An office, the people in it, and the software they run.',
          ] },
          { p: 'The design rounds are the tell. Three of them is a process written for a client with a marketing department to satisfy, and you are being sold it at what it costs to run.' },
        ],
      },
```

- [ ] **Step 2: Confirm the list renders and the dead CSS notice shrinks**

Run: `npm run check`
Expected: `check.js` now reports only `.post__figure` as unused. `.post__list` has become live.

- [ ] **Step 3: Read the section back on the page**

Serve and load the post. Confirm the four items read as a list rather than a sentence fragment each, and that the closing paragraph sits below the list rather than above it.

- [ ] **Step 4: Commit**

```bash
git add tools/pages/blog.js dist
git commit -F- <<'MSG'
[Blog] the list stops pretending to be a paragraph

Four things in a row, written as one block of prose because the section was
using the legacy paragraphs field and a list could only have rendered after
every paragraph, which would have put the closing line above the thing it
closes. Moved to blocks so it sits where it belongs.

A list and not a bar, and that is the interesting half. A proportion bar needs
a figure against the account manager, the workshop, the design rounds and the
overhead, and no such split exists. The rule at the top of this file is that a
post carries a number only if a stranger could check it. Four invented
percentages to fill a chart is exactly what that rule is there to stop.

.post__list has been styled and unused since the blog arrived. It is live now,
and check.js says so.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
```

---

### Task 8: The reviews figure, dated, at display size

**Files:**
- Create: `client-results.js` (repo root)
- Modify: `tools/pages/blog.js`, the "What that has produced so far" section
- Modify: `article.css`, the stat rules

**Interfaces:**
- Produces: `LANORA_REVIEWS` object with `{ before, after, months, today, rating, checked, listingNote }`.

- [ ] **Step 1: Write the constant**

Create `client-results.js`:

```js
/* ---- client-results.js — the client numbers a post is allowed to quote -----
   Same job as pricing.js, for results instead of money.

   These three figures lived as prose inside one sentence in blog.js, with no
   source of truth and nothing checking them. That was survivable while the
   sentence was buried in the fourth paragraph of the fifth section. It stops
   being survivable the moment one of them is set at display size, which is
   what this file exists for.

   THE DATE IS THE POINT. A review count is true on a day and drifts after it.
   A figure with a date attached can be re-checked by anyone; a figure without
   one can only be believed or doubted. `checked` is rendered nowhere and is
   not decoration: it is the answer to "is this still right", and the answer is
   "it was on this date, go and look".

   WHAT MAY GO IN HERE. The same rule blog.js applies to itself: a number
   belongs here only if a stranger could check it from a public page. A review
   count on a public Google listing qualifies. Anything from an analytics
   dashboard nobody else can open does not, however true it is. */

export const LANORA_REVIEWS = {
  client: 'Lanora House',
  before: 18,
  after: 36,
  months: 2,
  today: 38,
  rating: 'five stars',
  /* Verified 9 August 2026 for the original post, re-read 25 August 2026. */
  checked: '2026-08-25',
};
```

- [ ] **Step 2: Add the stat markup to the post**

In `tools/pages/blog.js`, import it:

```js
import { LANORA_REVIEWS } from '../../client-results.js';
```

The "What that has produced so far" section moves to `blocks` and leads with the stat. The stat is written as a `p` block carrying `strong`, which is inside the copy tag whitelist, so no renderer change is needed.

```js
      {
        h2: 'What that has produced so far',
        blocks: [
          /* The one number in this post big enough to see from across the
             room, and the only one that has earned it: it is a client's public
             review count, dated in client-results.js and checkable on their
             listing by anybody who doubts it. */
          { p: `<strong class="post__stat">${LANORA_REVIEWS.before} to ${LANORA_REVIEWS.after} Google reviews in ${LANORA_REVIEWS.months} months</strong>` },
          { p: `${LANORA_REVIEWS.client} stands at ${LANORA_REVIEWS.today} today, averaging ${LANORA_REVIEWS.rating}. You can check it, which is the point of quoting it: the reviews are on their Google listing with dates against them.` },
          { p: 'A website does not collect reviews. Somebody asking, at the right moment, every time, does, and that is the monthly plan rather than the build. The site is where people land once the reviews have done their job.' },
        ],
      },
```

Note the third paragraph is the old fourth one with "Be clear about which half of the work that is." removed from the front, per Task 9. If Task 9 runs first, this text will already match.

- [ ] **Step 3: Style the stat**

Append to `article.css`:

```css
/* ---- One number, at display size ------------------------------------------
   Not a stat row. CLAUDE.md bans those and is right to: three giant numbers
   with vague labels under a hero is the single most recognisable thing a
   generated page does. This is one number, it is a client's public review
   count, and the sentence under it tells you where to go and check it.

   A <strong> rather than a <p class>, because copy inside an article may carry
   only a, em, strong and abbr and the build enforces it. That constraint
   picked the element and the element is the right one anyway: it is the
   strongest statement in the section, which is what strong means. */
.post__stat,
.guide__stat {
  display: block;
  font-size: var(--text-2xl);
  font-weight: var(--weight-light);
  line-height: var(--leading-tight);
  letter-spacing: -0.01em;
  color: var(--ink);
  max-width: 18ch;
  margin-bottom: var(--space-4);
}
```

- [ ] **Step 4: Check the copy rule did not reject it**

Run: `npm run check`
Expected: passes. If `findUnescapedCopy` rejects `<strong class="post__stat">`, it is because the check allows the tag but not attributes on it. In that case read `findUnescapedCopy` in `tools/build.js` and, if attributes are genuinely disallowed, style `.post__section strong:first-child` instead and drop the class. Do not loosen the check.

- [ ] **Step 5: Look at it**

Serve and load the post. The number should read as the largest thing in that section without competing with the h1, and the sentence under it should carry the "you can check it" claim.

- [ ] **Step 6: Commit**

```bash
git add client-results.js tools/pages/blog.js article.css dist
git commit -F- <<'MSG'
[Blog] the proof stops being the fourth paragraph of the fifth section

18 to 36 reviews in two months is the strongest thing this post has and it was
buried. It leads the section now, at display size.

The numbers moved out of prose and into client-results.js with the date they
were checked attached. They had no source of truth and nothing validating them,
which was survivable while the sentence was buried and stops being survivable
the moment one of them is set large. A figure with a date can be re-checked by
anyone; a figure without one can only be believed or doubted.

One number, not a row. CLAUDE.md bans the row of giant numbers with vague
labels and is right to. This one is a client's public review count with a
sentence underneath telling you where to go and look.

It is a <strong> rather than a styled paragraph because article copy may carry
only a, em, strong and abbr and the build enforces it. The constraint picked the
element and the element was the right one anyway.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
```

---

### Task 9: The headline, the title, and the section that argues with itself

**Files:**
- Modify: `tools/pages/blog.js`, the `why-trades-websites-cost-so-much` post

**Interfaces:** none.

**Blocked, in part.** The opening rewrite is waiting on a real anecdote from Ben. Do the three changes below and leave the `standfirst` exactly as it is. Do not invent a quote, a client or a scene: `blog.js:14-25` forbids it and the whole post's credibility rests on that rule.

- [ ] **Step 1: Change the headline, and give the title its own shorter version**

The h1 takes the full line. The `<title>` cannot: with " | Picsel" appended it is 64 characters against a build-enforced 60, so it gets a shorter variant that keeps the number.

```js
    headline: 'Why a plumber gets quoted £3,000 for a five page website',
    title: 'Why a five page website is quoted at £3,000 | Picsel',
```

- [ ] **Step 2: Check both lengths before building**

Run:

```bash
node -e "
const h='Why a plumber gets quoted £3,000 for a five page website';
const t='Why a five page website is quoted at £3,000 | Picsel';
console.log('headline', h.length, '| title', t.length, t.length<=60?'OK':'TOO LONG');
"
```

Expected: `title 52 | OK`.

- [ ] **Step 3: Cut the self-argument**

In the "What that has produced so far" section, the paragraph beginning "Be clear about which half of the work that is." loses that opening sentence. The caveat it introduces is real and stays as the rest of the paragraph.

Before:

```
'Be clear about which half of the work that is. A website does not collect reviews. Somebody asking, at the right moment, every time, does, and that is the monthly plan rather than the build. The site is where people land once the reviews have done their job.'
```

After:

```
'A website does not collect reviews. Somebody asking, at the right moment, every time, does, and that is the monthly plan rather than the build. The site is where people land once the reviews have done their job.'
```

- [ ] **Step 4: Check the blog index and the description still agree**

The headline appears on `/blog/` as the link text and in the `BlogPosting` schema. Run `npm run build` and confirm:

```bash
python - <<'PY'
import io, re, json, html
s = io.open('dist/blog/index.html', encoding='utf-8').read()
print('index links:', re.findall(r'post-index__title">\s*<a href="([^"]+)">([^<]+)</a>', s))
p = io.open('dist/blog/why-trades-websites-cost-so-much/index.html', encoding='utf-8').read()
g = json.loads(re.search(r'application/ld\+json">(.*?)</script>', p, re.S).group(1).replace('\\u003c','<'))
bp = [n for n in g['@graph'] if n.get('@type')=='BlogPosting'][0]
print('schema headline:', bp['headline'])
print('h1:', re.search(r'<h1 class="post__headline">(.*?)</h1>', p, re.S).group(1).strip())
print('title:', re.search(r'<title>(.*?)</title>', p).group(1))
PY
```

Expected: the index link, the schema headline and the h1 all carry the new headline. The `<title>` carries the shorter variant. The slug is unchanged, so no redirect is needed and no link anywhere breaks.

- [ ] **Step 5: Run the humanizer pass over the changed copy**

Invoke the `humanizer` skill and read every sentence changed in Tasks 6 to 9 back against it. Scan the rendered page for em dashes rather than the source:

```bash
grep -rl $'—\|&mdash;' dist --include="*.html" || echo "no em dashes"
```

- [ ] **Step 6: Full check and commit**

Run: `npm run check`

```bash
git add tools/pages/blog.js dist
git commit -F- <<'MSG'
[Blog] the headline says the number, and the section stops arguing with itself

"Why trades websites cost so much" was true of every post anyone has written on
the subject. The h1 now says what the post is actually about: why a plumber
gets quoted £3,000 for five pages.

The title tag could not take it. With the site suffix it runs to 64 characters
against a build-enforced 60, so it carries a shorter version with the number
still in it. Headline and title are separate fields for exactly this.

And "Be clear about which half of the work that is" is me arguing with myself
in the middle of my own article. The caveat after it is real and stays. The
throat-clearing in front of it does not.

The slug is untouched, so nothing linking to this post breaks.

The opening is deliberately unchanged. It wants a real quote or a real moment
and I do not have one, and the rule at the top of this file is that a post
carries only what a stranger could check.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
```

---

### Task 10: The verification sweep

**Files:** none modified unless something fails.

- [ ] **Step 1: Full check**

Run: `npm run check`
Expected: 29 pages, all tests pass. `check.js` should now report only `.post__figure` as unused, down from four selectors at the start of this work.

- [ ] **Step 2: The blackout, once more, on the finished site**

Repeat the SHOW_PRICING script from Task 6 Step 8. Expected: no Picsel figure survives, no `/prices/` link is emitted, `dist/prices/index.html` is absent, and the rail still renders on every article.

- [ ] **Step 3: All four widths**

Serve, and at 375, 768, 1024 and 1440 confirm on one long article and one short one:

```js
JSON.stringify({
  w: innerWidth,
  pageScrollsSideways: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  railVisible: !!document.querySelector('.post__rail, .guide__rail')?.offsetParent,
  tapTargets: [...document.querySelectorAll('.post__rail-link, .guide__rail-link, .post__close-link')]
    .map(a => Math.round(a.getBoundingClientRect().height)),
})
```

Expected: `pageScrollsSideways: false` at every width. Tap targets at least 44. On the long article at 375 the rail is hidden, which is the contents variant behaving as designed.

- [ ] **Step 4: Keyboard and focus**

Tab through a long article. The rail's contents links must take focus in document order with a visible focus ring, and following one must move the caret to the heading it names.

- [ ] **Step 5: Re-measure the two numbers this work exists to change**

Line length on a long article, expecting 55 to 65. CTA gap, expecting roughly 180. Both scripts are in Task 4 Step 6 and Task 5 Step 1.

- [ ] **Step 6: Read the whole thing**

Load both posts and all six guides at 1440 and at 375 and read them. The rail must not look empty on the six short pages, and the six sections of a guide must no longer read as six identical stacked units. If the contact card looks thin, that is the risk the spec named, and the fix is content in the card rather than more padding.

- [ ] **Step 7: Apply Chanel's rule**

Per `CLAUDE.md` section 9.5, find one thing on the finished article page that is not earning its place and remove it.

- [ ] **Step 8: Update the spec's status and commit**

Change `**Status:** awaiting approval` to `**Status:** built` in `docs/specs/2026-08-25-article-layout-design.md`, and add one line under it noting that `article-sections.js` did need changing after all, contrary to the spec's file list.

```bash
git add docs/specs/2026-08-25-article-layout-design.md dist
git commit -F- <<'MSG'
[Docs] the article layout spec, marked built

One correction recorded rather than quietly left wrong: the spec said
article-sections.js needed no change. It did. A contents rail needs anchors and
the headings carried no ids, so the slug function landed there and both readers
call it.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
```

---

## Self-review

**Spec coverage.** Left-pinned column: Tasks 2 to 4. Measure and type: Task 4. CTA gap: Task 5. Identical sections: Tasks 4, 6, 7 and 8 between them. Price table: Task 6. £3,000 breakdown: Task 7. Reviews stat and the dated constant: Task 8. Headline and self-argument: Task 9. The two guide price bugs and the £839 literal: Task 6. The screenshot is deliberately out of scope per the spec. The opening is blocked on Ben and is called out in Task 9.

**Placeholders.** None. Every code step carries the code. The two "if this fails, do that" branches in Task 4 Step 5 and Task 8 Step 4 name the specific fallback rather than saying "handle it".

**Type consistency.** `sectionSlugs` is defined in Task 1 and consumed in Task 2 with the same signature. `renderArticleRail({ prefix, sections })` is defined in Task 2 and called with exactly those two keys in Task 3. `buildPlanTable({ showPricing })` is defined in Task 6 and called there only. `LANORA_REVIEWS` field names in Task 8 match between the constant and its use.

**Known ordering dependency.** Task 8 Step 2 and Task 9 Step 3 both touch the same paragraph. Task 9 assumes Task 8 has already restructured that section into `blocks`. Run them in order.
