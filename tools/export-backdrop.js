/* ---- export-backdrop.js — the backdrop as a still image -------------------
   Run with `npm run backdrop`. Freezes one instant of the site's dot field into
   print-resolution PNGs in assets/backdrop/, for use as a background behind
   documents, slides and printed sheets.

   THE POINT IS THAT IT IS THE SAME FIELD. The constants and the quantising
   maths come from dot-field.js, the same module backdrop.js runs live behind
   every page, so a document made from these images matches the website today
   and still matches it after the next time somebody tunes the dots. Nothing
   about the texture is re-typed here.

   ONE COMMAND
     npm run backdrop                  write every preset, both loudnesses
     npm run backdrop -- a4-portrait   just one preset
     npm run backdrop -- --montage     also write tile-montage.png, four copies
                                       of the tile butted together, for checking
                                       the seam by eye

   FLAGS
     --time=37     which instant of the flowing field to freeze. Any number is
                   as valid as any other; change it if you want a different
                   arrangement of the same texture.
     --seed=50657  a different field entirely rather than a different moment.
     --alpha=0.1   override the loudness for a one-off render. Without it every
                   preset is written twice, at the site's own value and at the
                   louder one — see LOUDNESS below.

   WHY A HEADLESS BROWSER. Only to rasterise. Every dot's position and shade is
   worked out here in Node by the site's own code; Chrome is handed a finished
   list of circles and asked for a PNG, because drawing several thousand
   antialiased circles is exactly what a canvas is for and writing a PNG encoder
   by hand to avoid a dependency the repo already has would be silly. */

import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

import { makeNoise3D } from '../noise.js';
import { makeNoise4D } from '../noise-4d.js';
import {
  DOTS,
  FIELD_BG,
  BUCKETS,
  quantise,
  levelRadius,
  levelFills,
} from '../dot-field.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'assets', 'backdrop');

/* ---- Loudness -------------------------------------------------------------
   On a screen the dots run at 10% alpha over near-black, which is a texture you
   sense more than see, and that restraint is right for a web page you are
   trying to read over. Printed, or sat behind body text in a document, 10% of a
   pale grey on near-black very nearly disappears: inkjets and office lasers
   both crush the bottom of that range.

   So every preset is written twice and you pick. The plain file is the site
   exactly; the -bold file is the same instant of the same field with the shades
   pushed up, for anything that will be printed. */
const LOUDNESS = [
  { suffix: '', alpha: DOTS.MAX_ALPHA },
  { suffix: '-bold', alpha: 0.16 },
];

/* ---- The presets ----------------------------------------------------------
   Each is a pixel size and the factor it is drawn at. Dividing one by the other
   gives the LOGICAL size, and it is the logical size the 12px dot pitch applies
   to — which is what makes an A4 page carry the same texture at the same
   apparent scale as a browser window, rather than the same texture shrunk to a
   sixteenth by the print resolution.

   scale 3.125 is 300dpi over CSS's 96dpi, so the two A4 presets are true 300dpi
   A4. The slide is 4K at scale 2, so its logical size is 1920x1080: the field
   on it is pixel-for-pixel the arrangement a desktop visitor sees. */
const PRESETS = [
  { name: 'a4-portrait', width: 2480, height: 3508, scale: 3.125 },
  { name: 'a4-landscape', width: 3508, height: 2480, scale: 3.125 },
  { name: 'slide-16x9', width: 3840, height: 2160, scale: 2 },

  /* The repeating tile, and the one preset whose size is not free. It has to be
     a whole number of dot pitches (1200 / 12 = 100 dots) or the grid itself
     would jump at the join, and it wants to be as large as tolerable because
     the noise has to come back round to its starting value within the tile: at
     the site's zoom a 1200px square holds about four features of the pattern.
     Any smaller and the repeat reads as a repeat. See torusLevels below for how
     the wrap is done. */
  { name: 'tile', width: 3600, height: 3600, scale: 3, tile: true },
];

/* Chrome is already on the machine. Same lookup as capture-shots.js, and for
   the same reason: `npm install` should not have to fetch 150MB of Chromium. */
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
      '  PUPPETEER_EXECUTABLE_PATH="/path/to/chrome" npm run backdrop\n' +
      `Looked in:\n  ${CHROME_PATHS.join('\n  ')}`,
  );
}

/* ---- Seamless noise -------------------------------------------------------
   noise.js is 3D simplex. It does not repeat — that is rather the point of it
   for a page you scroll down forever. A tile has to repeat, in both directions,
   exactly, so the tile is walked round two closed circles in a 4D field
   instead. See noise-4d.js for why that closes the loop and why four dimensions
   rather than a torus in three. The walk itself is torusLevels below.
*/

/* ---- The two ways of laying out a field -----------------------------------
   Both return the same thing: for every dot on the lattice, which of the five
   shades it came out as. What differs is only where the noise was sampled.

   planeLevels is the site's own arrangement — a flat slice of the 3D field at
   one moment, with the same lateral drift the live backdrop has. Sampled at
   `time`, which is simply the moment the shutter opened. */
function planeLevels({ cols, rows, spacing, seed, time }) {
  const noise = makeNoise3D(seed);
  const ns = DOTS.NOISE_SCALE;
  const z = time * DOTS.FLOW_SPEED;
  const drift = time * DOTS.DRIFT;

  const levels = new Uint8Array(cols * rows);
  for (let r = 0, i = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++, i++) {
      levels[i] = quantise(noise((c * spacing + drift) * ns, r * spacing * ns, z));
    }
  }
  return levels;
}

/* torusLevels walks the two circles described above. Each axis of the tile maps
   to a full turn, and the circles' radii are set so that going once round
   covers the same distance through the noise as crossing the tile would have
   covered flat — which is what keeps the tile's features the same size as the
   ones on the website, rather than a stretched or crowded version of them. */
function torusLevels({ cols, rows, spacing, seed }) {
  const noise = makeNoise4D(seed);
  const TAU = Math.PI * 2;
  const rx = (cols * spacing * DOTS.NOISE_SCALE) / TAU;
  const ry = (rows * spacing * DOTS.NOISE_SCALE) / TAU;

  const levels = new Uint8Array(cols * rows);
  for (let r = 0, i = 0; r < rows; r++) {
    const v = (r / rows) * TAU;
    const z = ry * Math.cos(v), w = ry * Math.sin(v);
    for (let c = 0; c < cols; c++, i++) {
      const u = (c / cols) * TAU;
      levels[i] = quantise(noise(rx * Math.cos(u), rx * Math.sin(u), z, w));
    }
  }
  return levels;
}

/* ---- One preset -> a list of circles --------------------------------------
   Grouped by shade, because that is how they are drawn: one path per shade
   keeps the whole field to five fills instead of several thousand style
   changes. Coordinates are logical px; the page multiplies by scale. */
function buildPaths(preset, { seed, time }) {
  const spacing = DOTS.SPACING;
  const logicalW = preset.width / preset.scale;
  const logicalH = preset.height / preset.scale;

  /* A tile's lattice must divide its own size exactly or the grid jumps at the
     join, so its dimensions were chosen to. Everything else gets a column and a
     row of overhang, so no dot is clipped in half at an edge that a document
     will show. */
  const cols = preset.tile ? Math.round(logicalW / spacing) : Math.ceil(logicalW / spacing) + 1;
  const rows = preset.tile ? Math.round(logicalH / spacing) : Math.ceil(logicalH / spacing) + 1;

  const levels = preset.tile
    ? torusLevels({ cols, rows, spacing, seed })
    : planeLevels({ cols, rows, spacing, seed, time });

  const paths = Array.from({ length: BUCKETS }, () => []);
  const maxRadius = DOTS.MAX_RADIUS;

  for (let r = 0, i = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++, i++) {
      const level = levels[i];
      const x = c * spacing;
      const y = r * spacing;
      paths[level].push(x, y);

      /* A tile's edge dots stick out past the edge, and the half that is cut
         off has to reappear on the opposite side or the join shows a row of
         half-dots against a row of whole ones. The lattice has no dot AT the
         far edge, so the wrapped copy never lands on top of another one and
         cannot double-darken. */
      if (!preset.tile) continue;
      const wrapX = x < maxRadius ? logicalW : x > logicalW - maxRadius ? -logicalW : 0;
      const wrapY = y < maxRadius ? logicalH : y > logicalH - maxRadius ? -logicalH : 0;
      if (wrapX) paths[level].push(x + wrapX, y);
      if (wrapY) paths[level].push(x, y + wrapY);
      if (wrapX && wrapY) paths[level].push(x + wrapX, y + wrapY);
    }
  }

  return paths;
}

/* ---- Rasterise ------------------------------------------------------------
   Everything above this line is maths; this is the only part that needs a
   browser. The canvas is read back with toDataURL rather than photographed with
   a screenshot, so the file is exactly the pixel size asked for with no
   viewport, no device pixel ratio and no scrollbar in the way. */
async function render(page, { width, height, scale, bg, fills, radii, paths }) {
  const dataUrl = await page.evaluate(
    async (spec) => {
      const canvas = document.createElement('canvas');
      canvas.width = spec.width;
      canvas.height = spec.height;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = spec.bg;
      ctx.fillRect(0, 0, spec.width, spec.height);

      ctx.setTransform(spec.scale, 0, 0, spec.scale, 0, 0);
      for (let b = 0; b < spec.paths.length; b++) {
        const radius = spec.radii[b];
        const points = spec.paths[b];
        if (radius < 0.12 || !points.length) continue;
        ctx.fillStyle = spec.fills[b];
        ctx.beginPath();
        for (let i = 0; i < points.length; i += 2) {
          ctx.moveTo(points[i] + radius, points[i + 1]);
          ctx.arc(points[i], points[i + 1], radius, 0, Math.PI * 2);
        }
        ctx.fill();
      }

      return canvas.toDataURL('image/png');
    },
    { width, height, scale, bg, fills, radii, paths },
  );

  return Buffer.from(dataUrl.split(',')[1], 'base64');
}

/* Four copies of the tile butted together at quarter size. The only way to
   check a seamless tile is to look at one: if the wrap is wrong there is a
   visible cross through the middle of this image. */
async function renderMontage(page, tilePng) {
  const dataUrl = await page.evaluate(async (base64) => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();

    const cell = image.width / 2; // quarter area, so the montage stays viewable
    const canvas = document.createElement('canvas');
    canvas.width = cell * 2;
    canvas.height = cell * 2;
    const ctx = canvas.getContext('2d');
    for (let y = 0; y < 2; y++) {
      for (let x = 0; x < 2; x++) ctx.drawImage(image, x * cell, y * cell, cell, cell);
    }
    return canvas.toDataURL('image/png');
  }, tilePng.toString('base64'));

  return Buffer.from(dataUrl.split(',')[1], 'base64');
}

function flagValue(args, name, fallback) {
  const hit = args.find((arg) => arg.startsWith(`--${name}=`));
  if (!hit) return fallback;
  const value = Number(hit.slice(name.length + 3));
  return Number.isFinite(value) ? value : fallback;
}

async function main() {
  const args = process.argv.slice(2);
  const montage = args.includes('--montage');
  /* 37 rather than 0. At the very origin of a simplex field the value is pinned
     to zero and the pattern around it is unusually regular, which is the one
     instant of this field that does not look like the others. */
  const time = flagValue(args, 'time', 37);
  const seed = flagValue(args, 'seed', 0xC5E1);
  const alpha = flagValue(args, 'alpha', null);
  const only = args.find((arg) => !arg.startsWith('--'));

  const targets = only ? PRESETS.filter((preset) => preset.name === only) : PRESETS;
  if (!targets.length) {
    console.error(`No preset "${only}". Known:\n  ${PRESETS.map((p) => p.name).join('\n  ')}`);
    process.exitCode = 1;
    return;
  }

  // One override means one render per preset, at that loudness, named plainly.
  const loudness = alpha === null ? LOUDNESS : [{ suffix: '', alpha }];
  const radii = Array.from({ length: BUCKETS }, (_, b) => levelRadius(b));

  await mkdir(OUT_DIR, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: true,
    args: ['--hide-scrollbars'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent('<!doctype html><meta charset="utf-8"><title>backdrop</title>');

    for (const preset of targets) {
      // The geometry does not depend on the loudness, so it is built once and
      // rendered at each. The two files are then the same instant of the same
      // field, which is the only way comparing them tells you anything.
      const paths = buildPaths(preset, { seed, time });

      for (const { suffix, alpha: maxAlpha } of loudness) {
        const png = await render(page, {
          width: preset.width,
          height: preset.height,
          scale: preset.scale,
          bg: FIELD_BG,
          fills: levelFills(maxAlpha),
          radii,
          paths,
        });

        const file = join(OUT_DIR, `${preset.name}${suffix}.png`);
        await writeFile(file, png);
        console.log(
          `${preset.name}${suffix}.png  ${preset.width}x${preset.height}  ` +
            `alpha ${maxAlpha}  ${(png.length / 1024).toFixed(0)}KB`,
        );

        if (montage && preset.tile && !suffix) {
          const file = join(OUT_DIR, 'tile-montage.png');
          await writeFile(file, await renderMontage(page, png));
          console.log('tile-montage.png  four copies, for checking the seam');
        }
      }
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
