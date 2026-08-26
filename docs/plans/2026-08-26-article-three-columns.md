# Article three columns Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the eight long-form pages a three-column centred shell with the title and details on the left, the contact on the right, a scroll-driven hierarchy between them, and a portrait diagram in every guide that never scrolls sideways.

**Architecture:** The article wrap widens to 90rem and becomes a three-column grid with equal rails, so the reading column is genuinely centred and its 38rem measure is untouched. The article's head moves inside the grid, which is what removes the dead space at the top. A small module fades the rails between a bright and a quiet state using `IntersectionObserver` sentinels, following `nav.js`. Seven portrait diagrams replace the breakout-and-scroll approach entirely, which lets four CSS rules be deleted.

**Tech Stack:** Plain ES modules, hand-authored SVG, `node --test`, CSS custom properties. No framework, no bundler for page code.

**Spec:** `docs/specs/2026-08-26-article-three-columns-design.md`

## Global Constraints

- UK English. **No em dashes anywhere**, neither `—` nor `&mdash;`, in copy, titles, meta descriptions or comments. Sole exception: the `/* ---- filename — description ---- */` banner at the top of a source file.
- Copy inside `p` and `li` is written unescaped and may carry only `a`, `em`, `strong` and `abbr`, each closed, with no stray `&`. `findUnescapedCopy` in `tools/build.js` enforces it.
- Escaped fields (`h2` text, table cells, standfirst, headline, close and action lines) use literal `’` and `“ ”`, never entities.
- `<title>` maximum 60 characters; meta description 150 to 155. The build fails outside those bounds.
- Every Picsel figure is read from `pricing.js` and gated on `SHOW_PRICING`. Market figures are never gated.
- A small count in a sentence is a word, not a digit. Use `countWord` from `tools/templates/words.js`.
- No real place names in copy.
- **No horizontal scroll at any width, on anything.** This is the constraint that shapes the diagrams.
- **The reading measure stays 38rem and the body stays 18px.** Line length was measured at 61 characters and is not to be changed by this work.
- `prefers-reduced-motion` must be honoured by anything that moves.
- Diagram brief: 680 unit wide portrait viewBox, no text below 24 units, colours from tokens with hardcoded fallbacks, `role="img"` plus `<title>` and a `<desc>` that reads the content out as prose.
- Commit messages: `[Area] lowercase summary`, a body explaining why, ending with `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`.
- Run `npm run check` before every commit. It currently reports three unused classes, `.guide__stat`, `.post__figure` and `.post__figure--pair`, all deliberate. A fourth means something is wrong.

## File structure

| File | Responsibility |
| --- | --- |
| `tokens.css` | Modify. Article wrap max, rail min and max. |
| `article.css` | Modify. Three-column grid, the head inside it, rail states, and the deletion of the figure breakout. |
| `tools/partials/article-rail.js` | Modify. Split into a left rail (title, date, reading time, contents) and a right rail (contact). Export `readingMinutes`. |
| `tools/partials/article-rail.test.js` | Modify. Cover the split and the reading time. |
| `tools/pages/blog.js` | Modify. Shell: head into the grid, two rails. |
| `tools/pages/guides.js` | Modify. Same, plus a `figure` block per guide. |
| `article-rails.js` | Create, repo root beside the other page scripts. The fade. |
| `assets/diagrams/*.svg` | Create five, redraw two. |

---

### Task 1: Reading time, and splitting the rail in two

**Files:**
- Modify: `tools/partials/article-rail.js`
- Modify: `tools/partials/article-rail.test.js`

**Interfaces:**
- Consumes: `articleWordCount`, `railVariant`, `sectionSlugs`, all already in that file.
- Produces: `readingMinutes(sections) => number`, `renderArticleRailLeft({ prefix, sections, headline, date, longDate })`, `renderArticleRailRight({ prefix })`. Task 3 calls all three. `renderArticleRail` is deleted; nothing outside this file may still call it after Task 3.

- [ ] **Step 1: Write the failing tests**

Add to `tools/partials/article-rail.test.js`, keeping the existing tests:

```js
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
```

Update the import at the top of the file to pull in `readingMinutes`, `renderArticleRailLeft` and `renderArticleRailRight`, and drop `renderArticleRail`.

- [ ] **Step 2: Run the tests and watch them fail**

Run: `node --test tools/partials/article-rail.test.js`
Expected: FAIL on the import, because those three names are not exported yet.

- [ ] **Step 3: Add the reading time**

In `tools/partials/article-rail.js`, beside `articleWordCount`:

```js
/* Words a minute. The conventional figure, and precise enough for a label whose
   only job is to set an expectation before somebody commits to reading.

   Rounded up, with a floor of one. A guide of ninety words is a minute's
   reading in every sense that matters, and "0 min read" is the kind of detail
   that makes a reader distrust everything else on the page. */
const WORDS_A_MINUTE = 200;

export function readingMinutes(sections) {
  return Math.max(1, Math.ceil(articleWordCount(sections) / WORDS_A_MINUTE));
}
```

- [ ] **Step 4: Split the rail**

Replace `renderArticleRail` with the two functions. Keep `renderContents` and `renderContactCard` as they are, apart from moving the contents call into the left rail.

```js
/**
 * The left rail: what this page is. Title, when it was written, how long it
 * takes, and on a long article the contents.
 *
 * THE H1 LIVES HERE NOW, and that is the point of this pass. It used to sit
 * above the grid, spanning the reading column with nothing beside it, which is
 * why the top of every article read as a left column against an empty right
 * half however good the rest of the page was.
 */
export function renderArticleRailLeft({ prefix, sections, headline, date, longDate }) {
  const contents = railVariant(articleWordCount(sections)) === 'contents'
    ? `\n${renderContents(prefix, sections)}`
    : '';

  return `    <aside class="${prefix}__rail ${prefix}__rail--left">
      <h1 class="${prefix}__headline">${escapeHtml(headline)}</h1>
      <dl class="${prefix}__meta">
        <dt>Written</dt>
        <dd><time datetime="${escapeHtml(date)}">${escapeHtml(longDate)}</time></dd>
        <dt>Length</dt>
        <dd>${readingMinutes(sections)} min read</dd>
      </dl>${contents}
    </aside>`;
}

/**
 * The right rail: what to do about it. One phone number and the promise that
 * goes with it, and nothing else, for the reason recorded on renderContactCard.
 */
export function renderArticleRailRight({ prefix }) {
  return `    <aside class="${prefix}__rail ${prefix}__rail--right">
${renderContactCard(prefix)}
    </aside>`;
}
```

- [ ] **Step 5: Run the tests and watch them pass**

Run: `node --test tools/partials/article-rail.test.js`
Expected: PASS. The existing tests that called `renderArticleRail` must have been updated in Step 1; if any still reference it, fix the test rather than keeping the old export.

- [ ] **Step 6: Confirm the build breaks, which is expected here**

Run: `npm run build`
Expected: FAIL, because `blog.js` and `guides.js` still import `renderArticleRail`. That is Task 3's job. Do not fix it here and do not add a compatibility shim. Note the failure in your report and continue.

- [ ] **Step 7: Commit**

```bash
git add tools/partials/article-rail.js tools/partials/article-rail.test.js
git commit -F- <<'MSG'
[Articles] the rail becomes two rails, and learns how long the read is

The h1 moves into the left rail, which is the whole point of this pass. It used
to sit above the grid spanning the reading column with nothing beside it, so
the top of every article read as a left column against an empty right half
however well composed the rest of the page was.

Left rail is what the page is: title, date, reading time, and the contents on
an article long enough to need them. Right rail is what to do about it. The
contents move in beside the metadata rather than sitting opposite it, because
they answer the same question.

Reading time is computed from the word count that already decides the rail
variant, so it is not a new number for anybody to maintain. Rounded up with a
floor of one: "0 min read" on a ninety word guide is the kind of detail that
makes a reader distrust the rest of the page.

The build fails after this commit and the next one repairs it. blog.js and
guides.js still import the function this splits. A compatibility shim would
have hidden the two call sites that have to change.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
```

---

### Task 2: The three-column shell

**Files:**
- Modify: `tokens.css`
- Modify: `article.css`

**Interfaces:**
- Consumes: nothing.
- Produces: the class contract Task 3 must emit: `.{prefix}__cols` containing `.{prefix}__rail--left`, then `.{prefix}__col`, then `.{prefix}__rail--right`, in that source order.

- [ ] **Step 1: Widen the article wrap and size the rails**

In `tokens.css`, in the article block added by the previous pass, add two tokens and leave `--article-measure`, `--article-text` and their comments alone:

```css
  /* The article wrap is wider than the site's 72rem because it now carries
     three columns rather than one. 90rem at the widest, and the rails are what
     grow into it: the reading column is fixed at --article-measure, so a wider
     page means more room for the title and the contact, never a longer line.

     THE RAILS STOP AT 20rem AND THAT IS DELIBERATE. Up to about 1400px this
     uses the screen, which is what was asked for. Past that they cap and the
     whole thing centres, because a title six hundred pixels from the paragraph
     it belongs to has stopped being a title and become a second column of
     text. --article-rail-min keeps them wide enough for a headline to break
     sensibly at the breakpoint. */
  --article-page-max: 90rem;
  --article-rail-min: 14rem;
  --article-rail-max: 20rem;
```

`--article-rail` from the previous pass is now unused. Delete it and its sentence, since the rails are a range rather than a fixed width.

- [ ] **Step 2: Replace the two-column grid with three**

In `article.css`, find the `@media (min-width: 64rem)` block containing `.guide__cols, .post__cols` and replace the grid definition:

```css
  .guide__cols,
  .post__cols {
    display: grid;
    grid-template-columns:
      minmax(var(--article-rail-min), var(--article-rail-max))
      minmax(0, var(--article-measure))
      minmax(var(--article-rail-min), var(--article-rail-max));
    column-gap: var(--space-12);
    /* Equal rails are what make the reading column genuinely centred rather
       than merely less left, which was the ask. justify-content centres the
       whole row once the rails hit their cap. */
    justify-content: center;
    align-items: start;
  }
```

`align-items: start` stays load-bearing for the same reason as before: without it the rails stretch and there is nothing for a sticky child to stick against.

- [ ] **Step 3: Let the article wrap be wider than the site's**

Still in `article.css`, outside the media query:

```css
/* The articles are the only pages with three columns, so they are the only
   pages that need more than --page-max. Scoped to the two long-form prefixes
   rather than changing .wrap, which every other page uses. */
.guide__inner,
.post__inner {
  max-width: var(--article-page-max);
}
```

- [ ] **Step 4: Style the two rails and their states**

Replace the previous pass's `.guide__rail, .post__rail` margin rules and add the state styling. Keep every `__rail-label`, `__rail-list`, `__rail-card`, `__rail-phone`, `__rail-promise` rule exactly as it is.

```css
/* ---- The rails, and their two states --------------------------------------
   Both rails are secondary while the body is being read, and each comes
   forward where it is the most useful thing on the page: the title at the top,
   the contact at the end.

   THE SIZE CHANGE IS A TRANSFORM AND NOT A FONT SIZE. Scaling type would
   re-wrap a headline while somebody is reading past it, which is a worse
   distraction than the effect is worth. transform does not reflow, and the
   origin is the top so the block does not appear to drift.

   The state is set by article-rails.js adding a class. With no JavaScript both
   rails render in their bright state, which is the correct failure: a reader
   with a broken script sees a title and a phone number at full contrast rather
   than a page of dimmed furniture. */
.guide__rail,
.post__rail {
  margin-top: var(--space-8);
  transition:
    opacity var(--dur-base) var(--ease),
    transform var(--dur-base) var(--ease);
  transform-origin: top left;
}

.guide__rail--quiet,
.post__rail--quiet {
  opacity: 0.45;
  transform: scale(0.92);
}

@media (prefers-reduced-motion: reduce) {
  .guide__rail,
  .post__rail {
    transition: none;
  }

  /* The end states still apply. Somebody who asked for less motion still gets
     the hierarchy, they simply do not watch it change. */
}

@media (min-width: 64rem) {
  .guide__rail,
  .post__rail {
    margin-top: 0;
    position: sticky;
    top: calc(var(--nav-height) + var(--space-8));
    max-height: calc(100svh - var(--nav-height) - var(--space-16));
    overflow-y: auto;
  }
}

@media (max-width: 63.999rem) {
  /* Below the breakpoint the contents list is dropped rather than stacked, for
     the reason recorded on the contents renderer: a contents list that appears
     after the content it indexes is worse than none. The rest of the left rail
     is the title, so it stays. */
  .guide__rail-contents,
  .post__rail-contents {
    display: none;
  }
}
```

**Verified for you: `--motion-slow` does not exist.** The repo's motion tokens are `--dur-fast: 140ms`, `--dur-base: 260ms`, `--dur-roll: 700ms` and `--ease`, and every existing transition in the stylesheets is written `var(--dur-*) var(--ease)`. The rule above uses `--dur-base` and `--ease` accordingly. Do not add a new duration token.

- [ ] **Step 5: Move the headline styling into the rail**

The `.post__headline` / `.guide__question` rules currently size an `h1` that sat above the grid at `--text-3xl`. In a 20rem rail that is too large. Add, inside the `min-width: 64rem` block:

```css
  .guide__rail--left .guide__headline,
  .post__rail--left .post__headline {
    font-size: var(--text-2xl);
    line-height: var(--leading-tight);
    max-width: none;
  }
```

Below the breakpoint the headline keeps its full `--text-3xl` size, because there it is back at the top of a single column where it belongs.

- [ ] **Step 6: Style the metadata list**

```css
/* Written and Length, as a definition list because that is what they are: two
   labels and their values. The label is the quiet half. */
.guide__meta,
.post__meta {
  margin: var(--space-6) 0 0;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
}

.guide__meta dt,
.post__meta dt {
  color: var(--ink-faint);
}

.guide__meta dd,
.post__meta dd {
  margin: 0;
  color: var(--ink-muted);
}
```

Note `.post__meta` already exists in this file, styling the old date line under the headline. Replace that rule rather than adding a second one, and delete the `.post__inner > .post__headline + .post__meta` rule, which is about an adjacency that no longer exists.

- [ ] **Step 7: Delete the figure breakout**

The diagrams become portrait in Task 5 and fit the column, so all of this comes out:

- `max-width: none` and `width: min(56rem, ...)` from `.guide__figure, .post__figure`
- the `width: 100%` override added on 26 August inside the media query
- `overflow-x: auto` from `.guide__figure:not(--pair)`
- `min-width: 44rem` from `.guide__figure svg`

Keep the `border` and `border-radius` from the card treatment, and keep the `margin`. Replace the long breakout comment with a short one recording that the diagrams are drawn portrait to fit the reading column, so there is no breakout and no scroll, and pointing at the spec for why.

- [ ] **Step 8: Build and check**

Run: `npm run build`
Expected: still FAILS, because Task 3 has not wired the shells yet. Confirm the failure is only the missing `renderArticleRail` import and nothing new.

- [ ] **Step 9: Commit**

```bash
git add tokens.css article.css
git commit -F- <<'MSG'
[Articles] three columns, and the figure breakout comes out

The wrap goes to 90rem because it carries three columns now, and the rails are
what grow into the extra width. The reading column stays at --article-measure,
so a wider page never means a longer line. Equal rails are what make that
column genuinely centred rather than merely less left, which was the ask.

The rails cap at 20rem. Up to about 1400px this uses the screen, which is what
was wanted, and past that it centres, because a title six hundred pixels from
its paragraph has stopped being a title.

The quiet state is opacity and a transform, never a font size. Scaling type
would re-wrap a headline while somebody reads past it, which is a worse
distraction than the effect is worth. With no JavaScript both rails stay
bright, which is the right failure: a title and a phone number at full
contrast, not a page of dimmed furniture.

And the figure breakout is deleted, all four rules of it. It existed because a
900 unit landscape chart could not fit a 38rem column, and the diagrams are
being redrawn portrait so they can. No breakout, no readability floor, no
overflow, no horizontal scroll.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
```

---

### Task 3: Wire both shells

**Files:**
- Modify: `tools/pages/blog.js`
- Modify: `tools/pages/guides.js`

**Interfaces:**
- Consumes: `renderArticleRailLeft`, `renderArticleRailRight` from Task 1; the class contract from Task 2.
- Produces: markup Task 4's script queries.

- [ ] **Step 1: Rewrite the post shell**

In `tools/pages/blog.js`, change the import from `renderArticleRail` to the two new names. Then replace the `renderPost` content template so the head is inside the grid. The `h1` and the date come out of the centre column entirely, because the left rail renders them now.

```js
  const content = `${renderBreadcrumbs(trail)}

    <article class="section post">
      <div class="wrap post__inner">
        <div class="post__cols">
${renderArticleRailLeft({
    prefix: 'post',
    sections: post.sections,
    headline: post.headline,
    date: post.date,
    longDate: longDate(post.date),
  })}

          <div class="post__col">
        <p class="post__standfirst">${escapeHtml(post.standfirst)}</p>

${action}

${sections}

        <aside class="post__close">
          <p>${escapeHtml(post.close.line)}</p>
          <a class="post__close-link" href="${escapeHtml(post.close.href)}">${escapeHtml(post.close.cta)}</a>
        </aside>
          </div>

${renderArticleRailRight({ prefix: 'post' })}
        </div>
      </div>
    </article>`;
```

- [ ] **Step 2: Rewrite the guide shell**

Same shape in `tools/pages/guides.js`. The guide's `h1` is `guide.question` and it moves into the left rail as the headline. `${intro}`, `${action}`, `${sections}`, `${also}`, `${trades}` and `${plan}` all go inside `.guide__col`, and `<p class="guide__answer">` stays at the top of that column.

Pass `headline: guide.question`.

**Verified for you: guides carry no date of any kind.** Only the two posts have a `date`, and that is correct rather than an omission: a guide is a standing answer that gets edited, and stamping it with a date would either go stale or claim a freshness nobody is maintaining. A post is a dated piece of writing and says so.

So the date is optional in the left rail, and the guides show only the reading time. Make `date` and `longDate` optional parameters in `renderArticleRailLeft`, omitting the whole `Written` pair when they are absent rather than rendering an empty `dd`. Add this test in Task 1 Step 1 alongside the others:

```js
test('a guide with no date shows the reading time and no empty Written row', () => {
  /* Guides carry no date on purpose: a standing answer that gets edited would
     either go stale or claim a freshness nobody maintains. Only the posts are
     dated pieces of writing. */
  const html = renderArticleRailLeft({ prefix: 'guide', sections: SHORT, headline: 'What is GEO?' });
  assert.match(html, /min read/);
  assert.equal(html.includes('Written'), false);
  assert.equal(/<dd>\s*<\/dd>/.test(html), false, 'no empty definition value');
});
```

- [ ] **Step 3: Build and confirm every article has three columns**

```bash
npm run build >/dev/null && python - <<'PY'
import io, re, glob
for f in sorted(glob.glob('dist/blog/*/index.html') + glob.glob('dist/guides/*/index.html')):
    s = io.open(f, encoding='utf-8').read()
    if '__cols' not in s: continue
    left = '__rail--left' in s
    right = '__rail--right' in s
    h1_in_rail = bool(re.search(r'__rail--left.*?<h1', s, re.S))
    order = [m.group(1) for m in re.finditer(r'class="(?:guide|post)__(rail--left|col|rail--right)"', s)]
    print(f'{"ok " if left and right and h1_in_rail else "BAD"} {f.split("dist/")[-1]:52} order={order[:3]}')
PY
```

Expected: every article `ok`, and `order` reading `['rail--left', 'col', 'rail--right']` on each. Source order matters: it is the tab order and the mobile stacking order.

- [ ] **Step 4: Confirm no duplicate h1 and no orphan date**

```bash
python - <<'PY'
import io, re, glob
for f in sorted(glob.glob('dist/blog/*/index.html') + glob.glob('dist/guides/*/index.html')):
    s = io.open(f, encoding='utf-8').read()
    n = len(re.findall(r'<h1', s))
    print(f'{f.split("dist/")[-1]:52} h1s={n} {"" if n == 1 else "<<< WRONG"}')
PY
```

Expected: exactly one `h1` per page.

- [ ] **Step 5: Full check and commit**

Run: `npm run check`. Expected: passes, three unused classes as before.

```bash
git add tools/pages/blog.js tools/pages/guides.js dist
git commit -F- <<'MSG'
[Articles] the head of the article moves inside the grid

This is the commit that fixes the original complaint. The h1, the date and the
reading time now render in the left rail and the standfirst opens the reading
column, so from the first pixel of an article there is something in all three
columns. Before this there was a stretch of every page where the right half was
empty by construction, however well composed the part below it was.

Source order is left rail, column, right rail, which is both the tab order and
the order it stacks in on a phone: what this is, then the thing itself, then
what to do about it.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
```

---

### Task 4: The fade

**Files:**
- Create: `article-rails.js` (repo root, beside `nav.js` and `sticky-cta.js`)
- Modify: `tools/templates/page.js` or the article page objects, to load it

- [ ] **Step 1: Read how the existing scripts are loaded and gated**

Read `nav.js` for the sentinel pattern and `sticky-cta.js` for how a body script is loaded. Read how `extraScripts` is passed in `tools/templates/page.js`. Report which mechanism you are using before writing the script.

- [ ] **Step 2: Write the script**

Create `article-rails.js`:

```js
/* ---- article-rails.js — which rail is speaking ----------------------------
   Both rails are secondary while the body is being read. Each comes forward
   where it is the most useful thing on the page: the title at the top, the
   contact at the end.

   SENTINELS, NOT A SCROLL HANDLER. Same reason as nav.js: a scroll listener
   runs on every frame to answer a question that changes twice. Two empty divs
   and an IntersectionObserver answer it when it actually changes.

   The quiet class is added rather than removed, so a page whose script never
   runs shows both rails bright. That is the correct failure: a title and a
   phone number at full contrast, rather than a page of furniture dimmed by a
   half-loaded enhancement. */

const QUIET = '--quiet';

function setUp() {
  const cols = document.querySelector('.guide__cols, .post__cols');
  if (!cols) return;

  const prefix = cols.className.includes('guide__') ? 'guide' : 'post';
  const left = cols.querySelector(`.${prefix}__rail--left`);
  const right = cols.querySelector(`.${prefix}__rail--right`);
  if (!left || !right) return;

  const quiet = (el, on) => el.classList.toggle(`${el.classList[0]}${QUIET}`, on);

  /* The top sentinel sits at the very start of the column and the end one at
     the very end, so "at the top" and "near the end" are answered by the
     content itself rather than by a pixel threshold that would need tuning per
     page length. */
  const observe = (target, onChange) => new IntersectionObserver(
    ([entry]) => onChange(entry.isIntersecting),
    { rootMargin: `-${cols.offsetTop > 0 ? 0 : 0}px 0px -60% 0px` },
  ).observe(target);

  // Fill in per the sentinel elements you add in Step 3.
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setUp);
} else {
  setUp();
}
```

**This skeleton is deliberately incomplete and you are expected to finish it.** The sentinel approach, the class-adding direction and the no-JavaScript failure mode are the requirements. How the two observers are wired is yours, with these rules:

- The left rail is quiet whenever the reader is past the top of the article.
- The right rail is quiet until the reader is near the end of the article, then bright.
- Both quiet in between.
- No layout thrash: do not read geometry in the observer callback.
- `matchMedia('(prefers-reduced-motion: reduce)')` must not disable the states, only the transition, which the CSS already handles. Do not branch on it in the script.
- The script must do nothing at all below 64rem, where there are no rails to fade. Guard with `matchMedia('(min-width: 64rem)')` and re-evaluate on change.

- [ ] **Step 3: Add the sentinels**

Two empty `div`s with `aria-hidden="true"`, one at the start of `.{prefix}__col` and one at the end, following the `nav-sentinel` precedent in `tools/templates/page.js`. Add them in `blog.js` and `guides.js`, and give them a comment saying they are trip wires with nothing to see, as the existing one does.

- [ ] **Step 4: Verify the states change**

```bash
cat > /tmp/verify-fade.mjs <<'EOF'
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
const require = createRequire('C:/Users/benwm/Desktop/Desktop/Coding Projects/Picsel/package.json');
const puppeteer = require('puppeteer-core');
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
 process.env.LOCALAPPDATA + '/Google/Chrome/Application/chrome.exe'].find(p=>p&&existsSync(p));
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900 });
await p.goto('http://localhost:3000/guides/builder-website-cost/', { waitUntil: 'load' });
const read = () => p.evaluate(() => {
  const l = document.querySelector('[class*="__rail--left"]');
  const r = document.querySelector('[class*="__rail--right"]');
  const o = e => Math.round(parseFloat(getComputedStyle(e).opacity) * 100) / 100;
  return { leftOpacity: o(l), rightOpacity: o(r) };
});
console.log('at top   ', await read());
await p.evaluate(() => window.scrollTo({ top: document.body.scrollHeight / 2, behavior: 'instant' }));
await new Promise(r => setTimeout(r, 900));
console.log('mid      ', await read());
await p.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
await new Promise(r => setTimeout(r, 900));
console.log('at end   ', await read());
await b.close();
EOF
node /tmp/verify-fade.mjs
```

Expected: at the top the left rail is 1 and the right is dimmed; mid-article both dimmed; at the end the right is 1 and the left dimmed. **Note the 900ms waits: the transition is `--dur-base`, 260ms, and sampling too early reads a mid-transition value.** Smooth scrolling plus a transition has produced three false readings on this project already, so wait rather than trusting a single sample.

- [ ] **Step 5: Commit**

Message: `[Articles] the rails take turns being the loud one`. Body: the sentinel reasoning, the class-adding direction and why the no-JavaScript state is both bright.

---

### Task 5: The seven diagrams

**Files:**
- Create: five new SVGs in `assets/diagrams/`
- Rewrite: `builder-website-cost-comparison.svg`, `builder-word-of-mouth-flow.svg`
- Modify: `tools/pages/guides.js` to add a `figure` block to the five guides that have none

**Do these one guide at a time, and commit each separately.** Seven diagrams in one commit is a review nobody can do properly.

For each, the process is the same:

- [ ] **Step A: Read the guide's own copy first.** The diagram has to encode what that guide actually says. Quote in your report the sentences it is drawn from.
- [ ] **Step B: Author the SVG** to the brief: 680 unit wide portrait viewBox, no text below 24 units, `role="img"`, `aria-labelledby` pointing at a `<title>` and a `<desc>`, colours as `var(--token, #fallback)`, opaque `--bg` backplate. Follow `assets/diagrams/builder-website-cost-comparison.svg` for the conventions.
- [ ] **Step C: The `<desc>` must read the whole thing out as prose**, including every number, so a screen reader gets the content and not a label.
- [ ] **Step D: Add the `figure` block** to that guide's section data, placed where the copy makes it land beside the point it illustrates, not at the end.
- [ ] **Step E: Verify no scroll and legible type** at 375, 768 and 1440:

```bash
# per diagram, after building
node -e "
const {execSync}=require('child_process');
" # use the puppeteer pattern from Task 4, asserting for each .guide__figure:
  #   scrollWidth <= clientWidth + 1   (no horizontal scroll)
  #   the rendered height of the smallest <text> is >= 11px at 375
```

- [ ] **Step F: Commit** that guide's diagram alone.

The seven, with their subjects fixed by the spec:

1. `what-a-trades-website-needs`: the six things, as a phone-shaped wireframe in the priority order the guide argues.
2. `google-business-profile-not-showing`: a decision flow through the four gates, ending at the distance point.
3. `how-much-a-trades-website-costs`: what the money buys, split build, hosting, monthly work, showing what a cheap site leaves out. **Not** a cost range chart.
4. `what-is-geo`: the same question asked twice, results page against assistant answer.
5. `how-to-get-more-google-reviews`: when to ask, against a job timeline.
6. `builder-website-cost-comparison.svg` redrawn portrait: the four routes as rows. **Every figure must match the original exactly**: template £180 to £360, freelancer £500 to £1,500, small studio £180 to £1,750, agency £3,000 to £10,000 plus a retainer. Diff the old and new `<desc>` to prove no number moved.
7. `builder-word-of-mouth-flow.svg` redrawn portrait: same flow, same labels.

---

### Task 6: The sweep

- [ ] **Step 1:** `npm run check` clean, three unused classes and no more.
- [ ] **Step 2:** Build with `SHOW_PRICING = false`, run the whole-token money matcher from the previous plan, confirm nothing new survives. Restore and rebuild.
- [ ] **Step 3:** All four widths on all eight articles plus `/privacy` and `/about`: no horizontal scroll anywhere, on the page or in any figure; tap targets at least 44px; line length 55 to 70 above 768.
- [ ] **Step 4:** Keyboard: tab order is left rail, body, right rail. Contents links still land clear of the nav.
- [ ] **Step 5:** `prefers-reduced-motion`: the states apply, the transition does not.
- [ ] **Step 6:** Read all eight articles at 1440 and 375. The rails must not read as an effect.
- [ ] **Step 7:** Chanel's rule again on the new composition.
- [ ] **Step 8:** Mark the spec built, recording anything that shipped differently.

## Self-review

**Spec coverage.** Three columns and centring: Task 2. Head inside the grid: Tasks 1 and 3. Left rail contents: Task 1. Fade: Task 4. Portrait diagrams and the breakout deletion: Tasks 2 and 5. Reading time: Task 1.

**Placeholders.** Task 4 Step 2 hands over a deliberately unfinished skeleton with its requirements stated, which is a judgement task rather than transcription, and it says so. Task 5 Step E gives the assertions rather than a finished script, for the same reason. Everything else carries its code.

**Type consistency.** `readingMinutes`, `renderArticleRailLeft` and `renderArticleRailRight` are defined in Task 1 and called with those exact signatures in Task 3. The class contract in Task 2 matches the markup in Task 3 and the queries in Task 4.

**Known risk.** Task 1 leaves the build broken until Task 3. That is deliberate and stated in its commit message, and it is the alternative to a compatibility shim that would have hidden the two call sites that must change. Anybody bisecting through this range should expect it.
