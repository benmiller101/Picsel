/* Unit tests for unpriced meta descriptions.

   The SHOW_PRICING flag swaps priced and unpriced versions of several page
   descriptions. An unpriced description is a string literal that is only built
   into the site when the flag is false, so the build's own description-length
   check never sees it. This test runs the regex that extracts them from source
   and asserts the ceiling: no unpriced description can exceed 155 characters.

   The hole this guards: if a copy edit over-lengths an unpriced description
   without testing the blackout build, the ceiling error will break the
   `SHOW_PRICING = false` build at the worst possible moment, when somebody is
   trying to pull prices off the site in a hurry. This test catches it
   immediately, every time the source changes. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const DESCRIPTION_CEILING = 155;

/* Returns an array of unpriced description strings extracted from a file.
   The regex matches `description: SHOW_PRICING ? ... : (string)` ternaries
   and captures the unpriced branch (everything after the colon). */
function extractUnpricedDescriptions(filePath) {
  const src = readFileSync(filePath, 'utf8');
  const descriptions = [];

  /* Try single-quoted descriptions first. */
  const singleQuoteRe = /description:\s*\n?\s*SHOW_PRICING\s*\n?\s*\?[\s\S]*?\n\s*:\s*((?:'[^']*'(?:\s*\+\s*)?\n?\s*)+),/g;
  let m;
  while ((m = singleQuoteRe.exec(src))) {
    const literal = m[1].replace(/'\s*\+\s*\n?\s*'/g, '').replace(/'/g, '');
    descriptions.push(literal);
  }

  /* Then try double-quoted descriptions. */
  const doubleQuoteRe = /description:\s*\n?\s*SHOW_PRICING\s*\n?\s*\?[\s\S]*?\n\s*:\s*((?:"[^"]*"(?:\s*\+\s*)?\n?\s*)+),/g;
  while ((m = doubleQuoteRe.exec(src))) {
    const literal = m[1].replace(/"\s*\+\s*\n?\s*"/g, '').replace(/"/g, '');
    descriptions.push(literal);
  }

  return descriptions;
}

/* Files in tools/pages/ that carry description ternaries. */
const PAGE_FILES = [
  'tools/pages/home.js',
  'tools/pages/services.js',
  'tools/pages/blog.js',
  'tools/pages/not-found.js',
];

test('unpriced descriptions do not exceed the ceiling (155 chars)', () => {
  const allDescriptions = [];
  const violations = [];

  for (const filePath of PAGE_FILES) {
    const descriptions = extractUnpricedDescriptions(filePath);
    for (const desc of descriptions) {
      allDescriptions.push({ filePath, desc, length: desc.length });
      if (desc.length > DESCRIPTION_CEILING) {
        violations.push(
          `${filePath}: ${desc.length}/${DESCRIPTION_CEILING} chars: "${desc.substring(0, 50)}..."`
        );
      }
    }
  }

  /* Assert that at least one description was found. A regex that matches
     nothing is silent, and a silent test is worse than no test. */
  assert(
    allDescriptions.length > 0,
    `No unpriced descriptions found. Checked: ${PAGE_FILES.join(', ')}`
  );

  /* Assert the expected number was found. If a page file is deleted or
     refactored, this count will drop and the test will flag it. Found:
     home.js (1), services.js (4), blog.js (1), not-found.js (1) = 7
     services.js also has the index page description (1), so total = 8. */
  assert.equal(
    allDescriptions.length,
    8,
    `Expected 8 unpriced descriptions, found ${allDescriptions.length}`
  );

  /* Assert none exceed the ceiling. */
  assert.equal(
    violations.length,
    0,
    violations.length > 0
      ? `Unpriced descriptions exceeded 155 chars:\n${violations.join('\n')}`
      : ''
  );
});
