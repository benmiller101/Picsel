/* ---- convert-photo.js — one-off photo to webp converter --------------------
   Run with `npm run photo -- <path-to-image>`. Reads a single source image —
   a camera or phone photo, typically several megabytes of JPEG — and writes
   three downscaled webp copies to assets/brand/, so the site never has to
   serve the original.

   This is deliberately the smaller sibling of capture-shots.js, not a new
   pipeline. capture-shots.js already solved the two hard parts of this job:
   finding a Chromium executable on this machine without downloading a second
   copy, and turning an image into a downscaled webp via a canvas. Re-running
   that logic here rather than writing an image library from scratch, or
   reaching for a dependency, keeps the site's tooling to one pattern instead
   of two that happen to do almost the same thing.

   ONE COMMAND
     npm run photo -- ben-laptop.jpg   converts assets/brand/ben-laptop-*.webp

   WHAT IT PRODUCES
     assets/brand/<name>-480.webp    CSS 480px wide
     assets/brand/<name>-960.webp    CSS 960px wide
     assets/brand/<name>-1440.webp   CSS 1440px wide
   (<name> is the source filename without its extension.) Naming mirrors
   capture-shots.js's own variants — `<thing>-<width>.webp` — rather than
   inventing a second convention for what is the same idea: a width baked
   into the filename so it is obvious what each file is for. */

import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'assets', 'brand');

/* The widths a page actually needs a portrait-style photo at: a phone-width
   slot, a tablet/half-column slot, and the largest the site's content column
   ever gets. Not a generic ladder — three sizes chosen to match real srcset
   candidates, the same reasoning VARIANT_WIDTHS in capture-shots.js uses. */
const TARGET_WIDTHS = [480, 960, 1440];

/* Starting point per the brief. A face photo at 82 is comfortably clean at
   these widths; if the largest output is still too heavy the fix is to drop
   this and re-run, not to reach for a different tool. */
const DEFAULT_QUALITY = 0.82;

/* Same list capture-shots.js uses, for the same reason: Chrome is already on
   the machine, so this reuses it instead of asking npm install to fetch a
   ~150MB private copy of Chromium just to run a canvas resize. */
const CHROME_PATHS = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe'),
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);

function findChrome() {
  const found = CHROME_PATHS.find((path) => existsSync(path));
  if (found) return found;

  throw new Error(
    'Could not find Chrome.\n' +
      'Install Google Chrome, or point at it directly:\n' +
      '  PUPPETEER_EXECUTABLE_PATH="/path/to/chrome" npm run photo -- <file>\n' +
      `Looked in:\n  ${CHROME_PATHS.join('\n  ')}`,
  );
}

function mimeFor(path) {
  const ext = extname(path).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  return 'image/jpeg';
}

async function main() {
  const args = process.argv.slice(2);
  const quality = (() => {
    const flag = args.find((arg) => arg.startsWith('--quality='));
    return flag ? Number(flag.slice('--quality='.length)) : DEFAULT_QUALITY;
  })();
  const inputArg = args.find((arg) => !arg.startsWith('--'));

  if (!inputArg) {
    console.error('Usage: npm run photo -- <path-to-image> [--quality=0.82]');
    process.exitCode = 1;
    return;
  }

  const sourcePath = resolve(ROOT, inputArg);
  if (!existsSync(sourcePath)) {
    console.error(`No such file: ${sourcePath}`);
    process.exitCode = 1;
    return;
  }

  const name = basename(sourcePath, extname(sourcePath));
  await mkdir(OUT_DIR, { recursive: true });

  const sourceBuffer = await readFile(sourcePath);
  const dataUrl = `data:${mimeFor(sourcePath)};base64,${sourceBuffer.toString('base64')}`;

  const executablePath = findChrome();
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--hide-scrollbars'],
  });

  try {
    const page = await browser.newPage();

    try {
      for (const targetWidth of TARGET_WIDTHS) {
        const result = await page.evaluate(
          (src, width, q) =>
            new Promise((resolve, reject) => {
              const img = new Image();
              img.onload = () => {
                /* Never upscale. A source narrower than a target width would
                   produce a bigger file with no more real detail in it than
                   the source already has — see capture-shots.js's own
                   VARIANT_WIDTHS for the same rule. */
                if (img.naturalWidth <= width) {
                  resolve({ skipped: true, naturalWidth: img.naturalWidth });
                  return;
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = Math.round(img.naturalHeight * (width / img.naturalWidth));
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve({
                  skipped: false,
                  data: canvas.toDataURL('image/webp', q).split(',')[1],
                  width: canvas.width,
                  height: canvas.height,
                });
              };
              img.onerror = () => reject(new Error('Image failed to decode'));
              img.src = src;
            }),
          dataUrl,
          targetWidth,
          quality,
        );

        if (result.skipped) {
          console.log(
            `  skip   ${targetWidth}px — source is only ${result.naturalWidth}px wide, would upscale`,
          );
          continue;
        }

        const outPath = join(OUT_DIR, `${name}-${targetWidth}.webp`);
        const buffer = Buffer.from(result.data, 'base64');
        await writeFile(outPath, buffer);
        console.log(
          `  wrote  ${basename(outPath).padEnd(28)} ${String(result.width).padStart(4)}x${String(result.height).padEnd(4)} ${(buffer.length / 1024).toFixed(1)}KB`,
        );
      }
    } finally {
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
