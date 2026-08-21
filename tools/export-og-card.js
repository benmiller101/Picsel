/* ---- export-og-card.js — the social share card ----------------------------
   Run with `npm run og`. Renders assets/brand/open-graph-share.png: the 1200 x
   630 picture that Messages, WhatsApp, Slack, Facebook, LinkedIn and X show
   when somebody pastes a picsel.co.uk link.

   WHY THIS IS A SCRIPT. The card that shipped in August 2026 was exported by
   hand from the logo suite and said "Websites for Cornwall's trades". The
   studio sells to tradespeople anywhere in the UK, so that line was wrong on
   every link anybody sent, and nobody could see it from the site itself: a
   share card is the one piece of a site its owner never looks at. Generated
   from the same lockup and the same tokens as the rest of the site, the card
   changes when the copy changes, and it costs one command instead of an
   afternoon in a design tool.

   The picture is only three things: the dot field every page scrolls over, the
   horizontal lockup, and one line of copy. Nothing else earns its place at the
   size a card is actually seen, which on a phone is about the width of a thumb.

   CACHING, AND WHY THE FILENAME CARRIES A VERSION. Every one of those services
   caches the image it scraped, most of them by URL and some of them for weeks.
   Overwriting the file leaves the old card in front of anybody whose app has
   already seen the link. So the output filename changes when the artwork does,
   site.config.js points at the new name, and the scrapers fetch a URL they
   have never seen. */

import { readFile, writeFile, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/* The size every scraper documents and the one they all crop from. Rendered at
   2x and left at 2400 x 1260: the aspect ratio is what the crop rules care
   about, and the extra pixels are what keep the wordmark's pixel edges sharp on
   a phone rather than soft. */
const WIDTH = 1200;
const HEIGHT = 630;
const SCALE = 2;

/* The line under the lockup. It is the only sentence on the card, so it says
   the two things a stranger needs from a pasted link: what the studio does and
   where to find it. */
const TAGLINE = 'Websites for tradespeople across the UK';
const DOMAIN = 'picsel.co.uk';

/* Bumped whenever the artwork changes, for the caching reason at the top. */
const OUT_NAME = 'open-graph-share-uk.png';

const CHROME_PATHS = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
];

function findChrome() {
  const found = CHROME_PATHS.find((path) => existsSync(path));
  if (!found) {
    throw new Error(
      'No Chrome found to render with.\nLooked in:\n  ' + CHROME_PATHS.join('\n  '),
    );
  }
  return found;
}

/* The lockup and the font go in as data URLs rather than as file:// paths. A
   page loaded from a temporary file can reference its neighbours, but the rules
   about which local files a local page may read differ between platforms and
   Chrome versions, and a share card that silently renders with a missing image
   is exactly the kind of failure this script exists to stop. */
async function dataUrl(relativePath, mime) {
  const bytes = await readFile(join(ROOT, relativePath));
  return `data:${mime};base64,${bytes.toString('base64')}`;
}

function cardHtml({ lockup, font }) {
  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8" />
<style>
  @font-face {
    font-family: 'Lexend';
    font-style: normal;
    font-weight: 300;
    src: url(${font}) format('woff2');
  }

  html, body { margin: 0; padding: 0; }

  .card {
    /* --bg, from tokens.css. */
    background-color: #0a0a0a;
    /* The dot field, at the pitch the hero uses scaled up for a picture that
       gets viewed at a third of its size. Cool grey rather than white, so it
       reads as texture and never as noise. */
    background-image: radial-gradient(circle at center, rgba(142, 148, 178, 0.085) 6.5px, transparent 7px);
    background-size: 30px 30px;
    width: ${WIDTH}px;
    height: ${HEIGHT}px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 58px;
  }

  .card__lockup {
    display: block;
    width: 620px;
    height: auto;
  }

  .card__line {
    font-family: 'Lexend', system-ui, sans-serif;
    font-weight: 300;
    font-size: 33px;
    line-height: 1;
    letter-spacing: 0.005em;
    /* --ink-muted. Full white here would compete with the wordmark. */
    color: rgba(255, 255, 255, 0.78);
    margin: 0;
  }

  /* The separator is a middle dot with real space around it, not a dash. */
  .card__sep { color: rgba(255, 255, 255, 0.4); padding: 0 0.5em; }
</style>
</head>
<body>
  <div class="card">
    <img class="card__lockup" src="${lockup}" alt="" />
    <p class="card__line">${TAGLINE}<span class="card__sep">&#183;</span>${DOMAIN}</p>
  </div>
</body>
</html>`;
}

async function main() {
  const [lockup, font] = await Promise.all([
    dataUrl('assets/brand/picsel-lockup-horizontal.svg', 'image/svg+xml'),
    dataUrl('assets/fonts/lexend-latin.woff2', 'font/woff2'),
  ]);

  /* Written into the project root, and removed again below, so that the page
     is served from a real file URL. Chrome refuses web fonts on about:blank. */
  const tempHtml = join(ROOT, '.og-card.tmp.html');
  await writeFile(tempHtml, cardHtml({ lockup, font }), 'utf8');

  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: SCALE });
    await page.goto(pathToFileURL(tempHtml).href, { waitUntil: 'networkidle0' });
    await page.evaluate(() => document.fonts.ready);

    const outPath = join(ROOT, 'assets', 'brand', OUT_NAME);
    await page.screenshot({ path: outPath, type: 'png' });
    console.log(`  WROTE  assets/brand/${OUT_NAME}  ${WIDTH * SCALE} x ${HEIGHT * SCALE}`);
  } finally {
    await browser.close();
    await unlink(tempHtml).catch(() => {});
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
