/* ---- fetch-fonts.js — bring Lexend and Pixelify Sans into the repo --------
   Run with `npm run fonts`. Downloads the two open-licence faces from Google
   Fonts, writes them to assets/fonts/, and generates fonts.css pointing at the
   local copies.

   WHY SELF-HOST THESE TWO. Every page opened a render-blocking stylesheet on
   fonts.googleapis.com, which then asked for the font files from a second
   host, fonts.gstatic.com. Two DNS lookups, two TLS handshakes and two round
   trips before a word of body copy could be painted, for files that are a few
   kilobytes and never change. Served from picsel.co.uk they arrive on the
   connection the browser already has open.

   The wordmark faces are NOT here and must not be. They come from Adobe
   Typekit, whose licence forbids self-hosting, and that stays exactly as it
   is. This is only the two faces that are free to move: Lexend, which carries
   every word of reading copy on the site, and Pixelify Sans, the wordmark's
   licence-independent fallback.

   RUN THIS AGAIN ONLY TO UPDATE A FACE. The build does not: a build that needs
   the network is a build that fails on a bad day for reasons that have nothing
   to do with the site. The woff2 files and the generated fonts.css are
   committed, and that is what ships. */

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FONT_DIR = join(ROOT, 'assets', 'fonts');

/* The same request the pages used to make, with a desktop user agent so
   Google answers in woff2 rather than the older formats it serves to
   browsers that cannot read it. */
const CSS_URL =
  'https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400..700&family=Lexend:wght@300;400;500&display=swap';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/* Google splits each face into a dozen character subsets. This site is in
   English and its client names are English, so latin covers everything on it
   and latin-ext covers a name with an accent in it one day. The rest are
   several more files nobody here will ever download a byte of. */
const SUBSETS = new Set(['latin', 'latin-ext']);

/* The Open Font Licence obliges anyone redistributing these files to carry the
   licence with them, and serving them from picsel.co.uk is redistribution. */
const LICENCES = {
  Lexend: 'https://raw.githubusercontent.com/google/fonts/main/ofl/lexend/OFL.txt',
  'Pixelify Sans': 'https://raw.githubusercontent.com/google/fonts/main/ofl/pixelifysans/OFL.txt',
};

async function get(url, asText = true) {
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${url}`);
  return asText ? response.text() : Buffer.from(await response.arrayBuffer());
}

function slug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const css = await get(CSS_URL);

/* Each block is preceded by a /* subset *\/ comment naming which characters it
   covers, which is the only place that name appears. */
const blocks = [...css.matchAll(/\/\*\s*([a-z-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g)];
if (!blocks.length) throw new Error('Google Fonts returned no @font-face blocks. Has the API changed?');

await mkdir(FONT_DIR, { recursive: true });

const seen = new Map();
const rules = [];
const families = new Set();

for (const [, subset, rule] of blocks) {
  if (!SUBSETS.has(subset)) continue;

  const family = rule.match(/font-family:\s*'([^']+)'/)?.[1];
  const remote = rule.match(/url\((https:\/\/[^)]+\.woff2)\)/)?.[1];
  if (!family || !remote) continue;
  families.add(family);

  /* Lexend is a variable font, so its 300, 400 and 500 rules all point at one
     file. Downloading it three times and writing it three times would give
     the browser three names for one thing and three cache entries. */
  let localName = seen.get(remote);
  if (!localName) {
    localName = `${slug(family)}-${subset}.woff2`;
    seen.set(remote, localName);
    const bytes = await get(remote, false);
    await writeFile(join(FONT_DIR, localName), bytes);
    console.log(`  fetched  ${localName.padEnd(28)} ${(bytes.length / 1024).toFixed(1)} KB`);
  }

  rules.push(
    rule
      .replace(/url\(https:\/\/[^)]+\)/, `url(/assets/fonts/${localName})`)
      .replace(/^@font-face\s*\{\s*/, '@font-face {\n  ')
      .replace(/;\s*/g, ';\n  ')
      .replace(/\s*\}$/, '\n}') + `\n`,
  );
}

for (const [family, url] of Object.entries(LICENCES)) {
  if (!families.has(family)) continue;
  await writeFile(join(FONT_DIR, `${slug(family)}-OFL.txt`), await get(url), 'utf8');
  console.log(`  fetched  ${slug(family)}-OFL.txt`);
}

const header = `/* ---- fonts.css — the two faces this site serves itself --------------------
   GENERATED by tools/fetch-fonts.js. Do not edit by hand; run \`npm run fonts\`.

   Lexend carries every word of reading copy. Pixelify Sans is the wordmark's
   safety net: if Typekit is unreachable the mark renders as a pixel face
   rather than dropping to Courier.

   Both are Open Font Licence, and the licences sit beside the files in
   assets/fonts/. The wordmark's own faces are not here and cannot be: they are
   Adobe Typekit, served by Adobe, and self-hosting them would break the
   licence. That stylesheet stays in the page head.

   font-display: swap on every face, carried over from Google's own CSS. Text
   is readable in a fallback immediately and reflows once the real face lands,
   which is the right trade for body copy that somebody is trying to read. */

`;

await writeFile(join(ROOT, 'fonts.css'), header + rules.join('\n'), 'utf8');
console.log(`\nWrote fonts.css with ${rules.length} @font-face rule(s) across ${seen.size} file(s).`);
