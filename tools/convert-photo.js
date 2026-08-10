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

   ONE COMMAND, THE ABOUT-PAGE JOB (unchanged since this file was written)
     npm run photo -- ben-laptop.jpg   converts assets/brand/ben-laptop-*.webp

   WHAT IT PRODUCES BY DEFAULT
     assets/brand/<name>-480.webp    CSS 480px wide
     assets/brand/<name>-960.webp    CSS 960px wide
     assets/brand/<name>-1440.webp   CSS 1440px wide
   (<name> is the source filename without its extension.) Naming mirrors
   capture-shots.js's own variants — `<thing>-<width>.webp` — rather than
   inventing a second convention for what is the same idea: a width baked
   into the filename so it is obvious what each file is for.

   A SECOND JOB, ADDED FOR THE PROJECT MOCKUPS
     npm run photo -- a-nevitt-mockup-nobg.png --mockup --out-dir=assets/work/nevitt-construction

   This is a different shape of job — a hand-made device mockup, not a phone
   photo — so it gets a different flag rather than silently reinterpreting the
   default one. `--mockup` does two things at once, because a project mockup
   always needs both halves and there is no case on this site where one is
   wanted without the other:

     1. TRANSPARENT PAGE VARIANTS, named like capture-shots.js's own output —
        <name>.webp (capped at --full-width, default 1440, never upscaled),
        plus <name>-640.webp and <name>-1024.webp (--variant-widths), skipping
        any width the source is not actually wider than. Transparency is kept:
        on the page the site's own near-black background shows through and the
        mockup's drop shadows land on it correctly.

     2. ONE BAKED SOCIAL VARIANT, <name>-og.webp, exactly 1200x630 with no
        transparency left. A transparent PNG shared on social gets composited
        onto WHITE by several clients (Slack, iMessage, older Facebook
        crawlers among them), and a dark brand's drop shadows on a white field
        looks broken rather than dark. So this frame is filled with the site's
        own --bg from tokens.css before the device is drawn into it, not left
        to whatever background the sharing client guesses.

        The device is CONTAIN-fitted into the 1200x630 frame — scaled up to
        the largest size that fits both dimensions, centred, with the frame's
        own background colour showing on whichever pair of edges is left over
        — rather than stretched to fill it or cropped to it. The source
        mockups are close to 4:3 and the OG frame is close to 16:8.4, a
        materially wider ratio, so a fill-and-crop approach would cut real
        content off the top or bottom of a multi-device composition, and a
        stretch would visibly distort the phone and tablet in it. Letterboxed
        in the site's own colour, the device stays true to its own proportions
        and the bars either side simply read as background, because they are
        the same colour as the page the link is describing. */

import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_OUT_DIR = join(ROOT, 'assets', 'brand');

/* The widths a page actually needs a portrait-style photo at: a phone-width
   slot, a tablet/half-column slot, and the largest the site's content column
   ever gets. Not a generic ladder — three sizes chosen to match real srcset
   candidates, the same reasoning VARIANT_WIDTHS in capture-shots.js uses.
   This is the about-page photo's ladder specifically; --mockup uses its own,
   see MOCKUP_FULL_WIDTH and MOCKUP_VARIANT_WIDTHS below. */
const TARGET_WIDTHS = [480, 960, 1440];

/* Starting point per the brief. A face photo at 82 is comfortably clean at
   these widths; if the largest output is still too heavy the fix is to drop
   this and re-run, not to reach for a different tool. */
const DEFAULT_QUALITY = 0.82;

/* The cap on a mockup's own "full size" page variant, and the two smaller
   variants alongside it. Deliberately the same numbers capture-shots.js
   already uses for a project's desktop.webp and its VARIANT_WIDTHS: a mockup
   fills the same slot on the same page that a flat screenshot used to, so it
   should offer a browser the same size ladder that slot already expects,
   rather than inventing a second one that happens to serve the same box. */
const MOCKUP_FULL_WIDTH = 1440;
const MOCKUP_VARIANT_WIDTHS = [640, 1024];

/* Ben's design tool exports the mockup on a canvas much bigger than the
   devices drawn on it — measured across the three sources on disk, the real
   content (the laptop/tablet/phone composition, including its drop shadow)
   fills as little as 44% of the frame's height. Every downstream size in
   MOCKUP_FULL_WIDTH/MOCKUP_VARIANT_WIDTHS is a WIDTH, so that empty margin
   survives resizing untouched: the page reserves a box sized for the whole
   transparent canvas, and the devices sit small and adrift inside it. The
   fix has to happen before any resize, on the untouched source, or every
   later step just inherits the same wasted alpha.

   Threshold 12 (out of 255) rather than "alpha greater than zero": these
   compositions carry a soft drop shadow that fades to almost nothing at its
   outer edge, and a few of those outermost pixels round to 1 or 2 rather
   than a true 0. Trimming at any-non-zero-alpha catches the first row where
   the fade is still imperceptible and turns it into a hard-edged cutoff,
   which reads as a clipped shadow rather than a soft one. 12 sits below
   anything a viewer would call "shadow" and above the sub-1% noise a PNG
   export can leave along a transparent edge, which is what gave the sane,
   reported numbers (a box roughly half to two-thirds of the frame,
   depending on the composition) rather than either extreme. */
const MOCKUP_TRIM_ALPHA_THRESHOLD = 12;

/* Padding kept around the trimmed box, in the SOURCE image's own pixels
   (these sources run 4000-5000px wide, three to four times the 1440px this
   job ultimately downsamples to). 48px of source padding lands as roughly
   14-16px once the image is scaled down to its delivered width, which is
   enough room for the soft tail of the drop shadow below the 12-alpha cutoff
   to keep fading into the page's own background rather than stopping dead
   at the crop line, without dragging back in the hundreds of pixels of true
   empty margin this trim exists to remove. */
const MOCKUP_TRIM_PADDING = 48;

/* Open Graph's own stated size. Several crawlers will accept other
   dimensions, but 1200x630 is the one guaranteed to render full-size and
   uncropped everywhere that matters, which is the whole point of building a
   bespoke image instead of reusing the transparent one. */
const SOCIAL_WIDTH = 1200;
const SOCIAL_HEIGHT = 630;

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

/* Reads --bg straight out of tokens.css rather than letting a hex value drift
   into this file. tokens.css is the one place a colour is allowed to be
   typed on this site; a script that duplicated #0a0a0a here would be exactly
   the kind of second copy that goes stale the day someone repaints the site
   in tokens.css and never thinks to look in a build tool for the same value. */
async function readBackgroundToken() {
  const css = await readFile(join(ROOT, 'tokens.css'), 'utf8');
  const match = css.match(/--bg:\s*(#[0-9a-fA-F]{3,8})\s*;/);
  if (!match) {
    throw new Error('Could not find --bg in tokens.css — the social variant has no colour to bake in.');
  }
  return match[1];
}

/**
 * Draws `dataUrl` into a transparent canvas at `width` and returns a webp
 * data URL, or null if `width` would upscale the source. Runs inside the
 * page via page.evaluate because that is where the Image and canvas objects
 * this needs actually exist — Node has neither.
 */
async function renderTransparentVariant(page, dataUrl, width, quality) {
  return page.evaluate(
    (src, targetWidth, q) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          if (img.naturalWidth <= targetWidth) {
            resolve({ skipped: true, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight });
            return;
          }
          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = Math.round(img.naturalHeight * (targetWidth / img.naturalWidth));
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
    width,
    quality,
  );
}

/**
 * Crops `dataUrl` down to the bounding box of its non-transparent content
 * (alpha > `threshold`), expanded by `padding` source pixels on every side
 * and clamped to the image's own edges. Returns a lossless PNG data URL —
 * this is an intermediate step feeding every later render in the mockup job,
 * so it must not spend any of the job's one real quality/lossy-compression
 * budget before the final webp encode does. Runs via page.evaluate for the
 * same reason as the other two render functions: Image, canvas and
 * ImageData all live in the page, not in Node.
 */
async function trimTransparentMargins(page, dataUrl, threshold, padding) {
  return page.evaluate(
    (src, alphaThreshold, pad) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const sourceWidth = img.naturalWidth;
          const sourceHeight = img.naturalHeight;
          const canvas = document.createElement('canvas');
          canvas.width = sourceWidth;
          canvas.height = sourceHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);

          const { data } = ctx.getImageData(0, 0, sourceWidth, sourceHeight);
          let minX = sourceWidth;
          let minY = sourceHeight;
          let maxX = -1;
          let maxY = -1;

          for (let y = 0; y < sourceHeight; y++) {
            const rowOffset = y * sourceWidth * 4;
            for (let x = 0; x < sourceWidth; x++) {
              const alpha = data[rowOffset + x * 4 + 3];
              if (alpha <= alphaThreshold) continue;
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }

          /* A source with nothing above the threshold (a blank export, or a
             threshold set wrong) has no box to trim to. Returning the
             source untouched here is safer than cropping to a 0x0 canvas,
             which would just fail the job for a reason unrelated to the
             mockup itself. */
          if (maxX < 0) {
            resolve({
              data: src.split(',')[1],
              width: sourceWidth,
              height: sourceHeight,
              sourceWidth,
              sourceHeight,
            });
            return;
          }

          const cropX = Math.max(0, minX - pad);
          const cropY = Math.max(0, minY - pad);
          const cropRight = Math.min(sourceWidth, maxX + 1 + pad);
          const cropBottom = Math.min(sourceHeight, maxY + 1 + pad);
          const cropWidth = cropRight - cropX;
          const cropHeight = cropBottom - cropY;

          const trimmed = document.createElement('canvas');
          trimmed.width = cropWidth;
          trimmed.height = cropHeight;
          trimmed
            .getContext('2d')
            .drawImage(canvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

          resolve({
            data: trimmed.toDataURL('image/png').split(',')[1],
            width: cropWidth,
            height: cropHeight,
            sourceWidth,
            sourceHeight,
          });
        };
        img.onerror = () => reject(new Error('Image failed to decode'));
        img.src = src;
      }),
    dataUrl,
    threshold,
    padding,
  );
}

/**
 * Bakes the social variant: an opaque `SOCIAL_WIDTH`x`SOCIAL_HEIGHT` canvas,
 * filled with `bgHex` first, with the source contain-fitted and centred on
 * top. Filling before drawing is what guarantees no transparency survives —
 * the source's own alpha channel is composited over an opaque fill rather
 * than carried through to the output.
 */
async function renderSocialVariant(page, dataUrl, bgHex, quality) {
  return page.evaluate(
    (src, width, height, bg, q) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = bg;
          ctx.fillRect(0, 0, width, height);

          /* Contain, not cover: scale by whichever axis is the tighter fit so
             the whole device is always inside the frame, then centre it. A
             mockup wider than it is tall relative to the frame is bound by
             height; the opposite case (bound by width) is handled by the
             same formula without a separate branch. */
          const scale = Math.min(width / img.naturalWidth, height / img.naturalHeight);
          const drawWidth = img.naturalWidth * scale;
          const drawHeight = img.naturalHeight * scale;
          const dx = (width - drawWidth) / 2;
          const dy = (height - drawHeight) / 2;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, dx, dy, drawWidth, drawHeight);

          resolve({
            data: canvas.toDataURL('image/webp', q).split(',')[1],
            width,
            height,
          });
        };
        img.onerror = () => reject(new Error('Image failed to decode'));
        img.src = src;
      }),
    dataUrl,
    SOCIAL_WIDTH,
    SOCIAL_HEIGHT,
    bgHex,
    quality,
  );
}

function parseArgs(args) {
  const flags = {};
  for (const arg of args) {
    if (!arg.startsWith('--')) continue;
    const eq = arg.indexOf('=');
    if (eq === -1) flags[arg.slice(2)] = true;
    else flags[arg.slice(2, eq)] = arg.slice(eq + 1);
  }
  return flags;
}

async function main() {
  const args = process.argv.slice(2);
  const flags = parseArgs(args);
  const inputArg = args.find((arg) => !arg.startsWith('--'));

  if (!inputArg) {
    console.error(
      'Usage:\n' +
        '  npm run photo -- <path-to-image> [--quality=0.82]\n' +
        '  npm run photo -- <path-to-mockup.png> --mockup --out-dir=assets/work/<slug> ' +
        '[--name=mockup] [--full-width=1440] [--variant-widths=640,1024]',
    );
    process.exitCode = 1;
    return;
  }

  const sourcePath = resolve(ROOT, inputArg);
  if (!existsSync(sourcePath)) {
    console.error(`No such file: ${sourcePath}`);
    process.exitCode = 1;
    return;
  }

  const quality = flags.quality ? Number(flags.quality) : DEFAULT_QUALITY;
  const isMockup = Boolean(flags.mockup);
  const name = typeof flags.name === 'string' ? flags.name : basename(sourcePath, extname(sourcePath));
  const outDir = flags['out-dir'] ? resolve(ROOT, flags['out-dir']) : DEFAULT_OUT_DIR;

  await mkdir(outDir, { recursive: true });

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
      if (isMockup) {
        await runMockupJob(page, dataUrl, outDir, name, flags, quality);
      } else {
        await runPhotoJob(page, dataUrl, outDir, name, quality);
      }
    } finally {
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

/* The original job, byte-for-byte the same behaviour it has always had:
   every width in TARGET_WIDTHS, always suffixed, written to assets/brand/. */
async function runPhotoJob(page, dataUrl, outDir, name, quality) {
  for (const targetWidth of TARGET_WIDTHS) {
    const result = await renderTransparentVariant(page, dataUrl, targetWidth, quality);

    if (result.skipped) {
      console.log(
        `  skip   ${targetWidth}px — source is only ${result.naturalWidth}px wide, would upscale`,
      );
      continue;
    }

    const outPath = join(outDir, `${name}-${targetWidth}.webp`);
    const buffer = Buffer.from(result.data, 'base64');
    await writeFile(outPath, buffer);
    console.log(
      `  wrote  ${basename(outPath).padEnd(28)} ${String(result.width).padStart(4)}x${String(result.height).padEnd(4)} ${(buffer.length / 1024).toFixed(1)}KB`,
    );
  }
}

/* The project-mockup job: transparent page variants named like
   capture-shots.js's own output, plus one baked, opaque social variant. */
async function runMockupJob(page, dataUrl, outDir, name, flags, quality) {
  const fullWidth = flags['full-width'] ? Number(flags['full-width']) : MOCKUP_FULL_WIDTH;
  const variantWidths = flags['variant-widths']
    ? flags['variant-widths'].split(',').map(Number)
    : MOCKUP_VARIANT_WIDTHS;

  /* Trim first, on the untouched source, and feed every render below off the
     result. Doing this once here rather than inside each render function
     means the "full" page variant, the smaller page variants and the social
     bake all agree on exactly the same content box — there is one crop, not
     three attempts at the same measurement that could disagree at the edges. */
  const trimmed = await trimTransparentMargins(page, dataUrl, MOCKUP_TRIM_ALPHA_THRESHOLD, MOCKUP_TRIM_PADDING);
  console.log(
    `  trim   ${trimmed.width}x${trimmed.height} content box, from a ${trimmed.sourceWidth}x${trimmed.sourceHeight} source ` +
      `(threshold ${MOCKUP_TRIM_ALPHA_THRESHOLD}, ${MOCKUP_TRIM_PADDING}px padding)`,
  );
  dataUrl = `data:image/png;base64,${trimmed.data}`;

  /* The "full" file has no width suffix, exactly like desktop.webp and
     mobile.webp already in this directory — a browser reading this folder
     should not have to learn a second naming rule for the third image in it. */
  const full = await renderTransparentVariant(page, dataUrl, fullWidth, quality);
  const fullOut = join(outDir, `${name}.webp`);
  const fullBuffer = full.skipped
    ? Buffer.from((await pageOriginalDataUrl(page, dataUrl)).split(',')[1], 'base64')
    : Buffer.from(full.data, 'base64');
  const fullDims = full.skipped
    ? { width: full.naturalWidth, height: full.naturalHeight }
    : { width: full.width, height: full.height };
  await writeFile(fullOut, fullBuffer);
  console.log(
    `  wrote  ${basename(fullOut).padEnd(28)} ${String(fullDims.width).padStart(4)}x${String(fullDims.height).padEnd(4)} ${(fullBuffer.length / 1024).toFixed(1)}KB` +
      (full.skipped ? ' (source narrower than full-width, used as-is)' : ''),
  );

  for (const width of variantWidths) {
    if (width >= fullDims.width) {
      console.log(`  skip   ${width}px — not narrower than the full variant (${fullDims.width}px)`);
      continue;
    }
    const result = await renderTransparentVariant(page, dataUrl, width, quality);
    if (result.skipped) continue; // Cannot happen once width < fullDims.width, guarded above anyway.

    const outPath = join(outDir, `${name}-${width}.webp`);
    const buffer = Buffer.from(result.data, 'base64');
    await writeFile(outPath, buffer);
    console.log(
      `  wrote  ${basename(outPath).padEnd(28)} ${String(result.width).padStart(4)}x${String(result.height).padEnd(4)} ${(buffer.length / 1024).toFixed(1)}KB`,
    );
  }

  const bgHex = await readBackgroundToken();
  const social = await renderSocialVariant(page, dataUrl, bgHex, quality);
  const socialOut = join(outDir, `${name}-og.webp`);
  const socialBuffer = Buffer.from(social.data, 'base64');
  await writeFile(socialOut, socialBuffer);
  console.log(
    `  wrote  ${basename(socialOut).padEnd(28)} ${String(social.width).padStart(4)}x${String(social.height).padEnd(4)} ${(socialBuffer.length / 1024).toFixed(1)}KB  (bg ${bgHex}, baked)`,
  );
}

/* Only called when the source is already narrower than the requested full
   width — re-encodes it as webp at its own native size rather than upscaling
   it, the same "never upscale" rule renderTransparentVariant applies above. */
async function pageOriginalDataUrl(page, dataUrl) {
  return page.evaluate(
    (src) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          canvas.getContext('2d').drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/webp', 0.82));
        };
        img.onerror = () => reject(new Error('Image failed to decode'));
        img.src = src;
      }),
    dataUrl,
  );
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
