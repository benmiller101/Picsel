/* ---- check.js — the things a build cannot fail on but should tell you ------
   Run with `npm run check`, which builds, runs the tests, then runs this.

   build.js already refuses to write a site with a missing h1, a stray phone
   number or an unescaped apostrophe in it. Those are errors: the page is
   wrong and shipping it would be worse than not shipping. What is here is the
   other kind of problem, the kind where the site works perfectly and the repo
   is quietly rotting: a class nothing uses any more, a token nobody reads, an
   em dash that got into the copy.

   None of it fails the build. It prints, and a person decides. A rule that
   fails a build for tidiness is a rule people learn to work around.

   WHY THIS EXISTS. The August 2026 audit found the homepage's old card grid
   still in site.css three commits after the ring replaced it, four span rules
   matching nothing. Nothing was broken and nothing would have found it. This
   is that search, as a command. */

import { readFile, readdir } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

/* Anything a class name or a token could be mentioned in: the built pages, the
   stylesheets, and every script that might write one at runtime. dist/ rather
   than the sources for the HTML, because dist/ is the set of pages that
   actually exist. */
async function readAll(dir, test, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'docs') continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await readAll(path, test, out);
    else if (test(entry.name)) out.push(path);
  }
  return out;
}

const cssFiles = (await readdir(ROOT, { withFileTypes: true }))
  .filter((e) => e.isFile() && e.name.endsWith('.css') && e.name !== 'fonts.css')
  .map((e) => join(ROOT, e.name));

const htmlFiles = await readAll(DIST, (name) => name.endsWith('.html'));
const jsFiles = [
  ...(await readdir(ROOT, { withFileTypes: true }))
    .filter((e) => e.isFile() && e.name.endsWith('.js'))
    .map((e) => join(ROOT, e.name)),
  ...(await readAll(join(ROOT, 'tools'), (name) => name.endsWith('.js'))),
];

const read = (path) => readFile(path, 'utf8');
const haystack = (await Promise.all([...htmlFiles, ...jsFiles].map(read))).join('\n');
const stylesheets = await Promise.all(cssFiles.map(async (path) => [path, await read(path)]));

const findings = [];

/* ---- 1. Class names no page and no script ever writes -------------------- */

for (const [path, css] of stylesheets) {
  const rules = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const classes = new Set([...rules.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]));
  const dead = [...classes].filter((name) => !haystack.includes(name)).sort();
  if (dead.length) {
    findings.push({
      what: `${relative(ROOT, path).split(sep).join('/')}: ${dead.length} class name(s) nothing uses`,
      detail: dead.map((name) => `.${name}`).join(', '),
    });
  }
}

/* ---- 2. Tokens nothing reads --------------------------------------------- */

const tokens = await read(join(ROOT, 'tokens.css'));
const defined = new Set(
  [...tokens.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]),
);
const allCss = stylesheets.map(([, css]) => css).join('\n');
const unread = [...defined].filter((name) => !`${allCss}${haystack}`.includes(`var(${name}`)).sort();
if (unread.length) {
  findings.push({
    what: `tokens.css: ${unread.length} token(s) nothing reads`,
    detail: unread.join(', '),
  });
}

/* ---- 3. Em dashes in the rendered copy ----------------------------------- */

/* CLAUDE.md bans them in visible copy, page titles and meta descriptions, and
   allows them everywhere else, which is most of this repo: the comments are
   full of them and should be. So the pages are stripped of their comments,
   their scripts and their styles first, and what is left is what a person
   reads. Checking the source instead would flag several hundred false hits and
   the rule would be ignored inside a week. */
const dashHits = [];
for (const path of htmlFiles) {
  const copy = (await read(path))
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '');
  for (const match of copy.matchAll(/.{0,40}[—–].{0,40}/g)) {
    dashHits.push(`${relative(DIST, path).split(sep).join('/')}: ...${match[0].replace(/\s+/g, ' ').trim()}...`);
  }
}
if (dashHits.length) {
  findings.push({
    what: `${dashHits.length} em or en dash(es) in rendered copy`,
    detail: dashHits.slice(0, 10).join('\n           '),
  });
}

/* ---- Say what was found -------------------------------------------------- */

console.log(
  `\nChecked ${cssFiles.length} stylesheet(s), ${defined.size} token(s) and ${htmlFiles.length} built page(s).`,
);

if (!findings.length) {
  console.log('Nothing unused, nothing unread, no em dashes in the copy.\n');
} else {
  for (const { what, detail } of findings) {
    console.log(`\n  ${what}`);
    console.log(`           ${detail}`);
  }
  console.log('\nNone of the above fails the build. Decide each one.\n');
}
