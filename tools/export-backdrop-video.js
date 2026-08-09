/* ---- export-backdrop-video.js — the backdrop as a looping clip -------------
   Run with `npm run backdrop:video`. Records eight seconds of the site's dot
   field moving, as MP4s in the four shapes social platforms use, in
   assets/backdrop/video/.

   Its sibling tools/export-backdrop.js freezes ONE INSTANT of the field for
   print. This one records it in motion for a post. Both import dot-field.js, so
   both are the field the site actually runs, not a lookalike: a post and the
   website are meant to read as one thing, and that only works if the texture is
   literally the same one.

   ONE COMMAND
     npm run backdrop:video                 every shape, both loudnesses
     npm run backdrop:video -- reel-9x16    just one

   FLAGS
     --seconds=8   how long the loop is before it comes round again
     --fps=30      frames per second. 30 is not a compromise: the live field
                   updates on alternate frames at 60, so 30 distinct pictures a
                   second is all there ever are.
     --time=37     which region of the field to sample, as in the stills
                   exporter.
     --seed=50657  a different field entirely rather than a different region.
     --alpha=0.1   override the loudness for a one-off render. Without it every
                   shape is written twice — see LOUDNESS below.
     --q=20        H.264 quantiser. Higher is a smaller file and a coarser
                   picture; see QUANTIZER below before changing it.
     --gop=0       seconds between key frames. 0 means every frame is one, which
                   is the default and not an arbitrary one: see KEYFRAME_SECONDS.

   HOW THE LOOP CLOSES, in one paragraph. The live field is a plane of 3D noise
   with time as the third axis, and it never repeats. So the time axis is walked
   round a CIRCLE instead of along a line, which needs a fourth dimension and is
   the same trick the seamless tile uses on its two space axes. See loopLevels.

   WHO DOES WHAT. Node works out every dot's shade, using the site's own code.
   Chrome draws the circles and encodes them, because it has an H.264 encoder
   and Node does not. Node then wraps the encoded frames in an MP4 container.

   WHY THE ENCODING IS DONE FRAME BY FRAME AND NOT RECORDED. The obvious way to
   get video out of a canvas is MediaRecorder: point it at the canvas, animate
   for eight seconds, keep what comes out. That was tried first and it is not
   sound, because it records in REAL TIME — every frame is timestamped as it
   arrives and anything the encoder cannot keep up with is silently dropped. On
   the three phone shapes it kept up. On the 16:9, whose frame carries 14,651
   dots, it did not: of 240 frames submitted, 14 survived, and the file came out
   three seconds long instead of eight. Nothing warns you; you get a real MP4
   that is simply wrong, and it is wrong by a different amount on a slower
   machine or a busier one.

   WebCodecs has no clock in it. Frames are handed to the encoder one at a time
   with the timestamp they are meant to have, and it takes however long it takes.
   Every frame arrives, the duration is exact by construction, and the same
   command produces the same file on any machine. */

import { mkdir, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';
import {
  Output,
  Mp4OutputFormat,
  BufferTarget,
  EncodedVideoPacketSource,
  EncodedPacket,
} from 'mediabunny';

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
const OUT_DIR = join(ROOT, 'assets', 'backdrop', 'video');

/* ---- Loudness -------------------------------------------------------------
   Same pair as the stills, for a related reason. There it was that inkjets
   crush the bottom of the range; here it is that every platform re-encodes what
   you upload, and 10% of a pale grey on near-black is the first thing an
   encoder decides you will not miss. The plain file is the site exactly; the
   -bold file is the same field with the shades pushed up, for anything that has
   to survive being squeezed through a feed. */
const LOUDNESS = [
  { suffix: '', alpha: DOTS.MAX_ALPHA },
  { suffix: '-bold', alpha: 0.16 },
];

/* ---- The shapes -----------------------------------------------------------
   Pixels, and the factor they are drawn at. Dividing one by the other gives the
   LOGICAL size, and the logical size is what the dot pitch applies to.

   Each scale is chosen so the logical size is roughly the screen the format is
   actually watched on: a reel is watched on a phone, so it is drawn at phone
   size and enlarged, and the dots come out the size a phone visitor to the site
   sees them. Drawn at scale 1 instead, a reel would carry 90 columns of dots
   into a 390px-wide phone viewport — a fine grain no viewer would connect to
   the website, and the first thing compression would smear.

   Note what is NOT decided here: the spacing. That comes from the site's own
   rule in dot-field.js, that a viewport of 640 or under gets SPACING_SMALL. The
   three phone shapes fall under it and the 16:9 does not, which is exactly the
   split the site itself makes. */
const PRESETS = [
  { name: 'reel-9x16', width: 1080, height: 1920, scale: 2.5 },
  { name: 'square-1x1', width: 1080, height: 1080, scale: 2 },
  { name: 'portrait-4x5', width: 1080, height: 1350, scale: 2.5 },
  { name: 'wide-16x9', width: 1920, height: 1080, scale: 1 },
];

/* ---- A fixed quantiser, not a bitrate target ------------------------------
   Aiming at a bitrate means the encoder adjusts quality as it goes to hit the
   number. Over 240 frames that adjustment is a slow ramp: neighbouring frames
   are indistinguishable, but the last frame is measurably softer than the
   first, and the loop's join is the one place in the clip where those two sit
   next to each other. Measured, the join came out as a bigger step than any of
   the 239 ordinary ones, in a loop whose CONTENT step there is among the
   smallest. That is a pulse once every eight seconds, forever, in a backdrop.

   Fixing the quantiser instead means every frame is coded to the same standard
   and the file lands wherever it lands. 20 is high quality without being
   wasteful; the dots are faint and quantising is exactly what would smear them
   into the background. */
const QUANTIZER = 20;

/* Preferred first. High profile handles 1080x1920 at level 4.0 with 8160 of the
   8192 macroblocks it allows, which fits — just. Baseline is the fallback for a
   build that will not do High. */
const CODECS = ['avc1.640028', 'avc1.42E01E'];

/* ---- Every frame a key frame ----------------------------------------------
   Ordinarily you would send one key frame every couple of seconds and let the
   frames in between describe only what changed. That is the right trade for
   video that plays once. It is the wrong one here, for a reason that showed up
   in the measurements rather than in theory.

   A predicted frame drifts: it is built on the one before, quantised, and by
   the end of a group it is measurably not the picture that went in. Frame zero,
   being a key frame, is exact. So the loop's join — last frame back to first —
   carried a step sixty times the size of an ordinary one, not because the
   FIELD jumped there but because the picture quality did. Every two seconds
   there was a smaller version of the same pop, at each key frame.

   Coding every frame independently removes both. Nothing drifts because nothing
   is predicted, every frame is the same quality as every other, and the join is
   a step like any other. It costs roughly four times the file size, on clips
   that are a few megabytes, which is nothing next to a visible pulse every two
   seconds in a backdrop whose entire job is to sit still and be unnoticed. */
const KEYFRAME_SECONDS = 0;

/* Chrome is already on the machine. Same lookup as the other two tools, and for
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
      '  PUPPETEER_EXECUTABLE_PATH="/path/to/chrome" npm run backdrop:video\n' +
      `Looked in:\n  ${CHROME_PATHS.join('\n  ')}`,
  );
}

/* ---- The loop, and the one thing it cannot keep ---------------------------
   Every frame's worth of dot shades, packed one byte per dot, frames end to end.

   THE PLANE STAYS FLAT AND TIME GOES ROUND. On the site the field is a slice of
   3D noise at (x, y, t): the plane is the picture and t walks forward forever,
   which is right for a page you scroll down forever and useless for something
   that has to play round. So t is walked round a circle instead. A circle needs
   two dimensions, hence the 4D field — the same reasoning as the seamless tile
   in export-backdrop.js, applied to the time axis rather than the space ones.

   The radius is set from the CIRCUMFERENCE, not the other way round: going once
   round has to cover exactly the distance the site's own t covers in `seconds`,
   which is FLOW_SPEED x seconds. That is what makes the field evolve at the
   site's rate rather than a sped-up one. It also means the loop can only ever
   show as much of the field as the site shows in eight seconds, and that the
   back half of the loop is heading home rather than pressing on. Both are what
   looping IS, not a shortcoming of this particular method.

   The circle's centre is offset by `time`, so --time means what it means in the
   stills exporter: which part of the field you are looking at.

   WHAT IS MISSING, deliberately. The live field also drifts sideways at 7px/s.
   A drift only closes if the noise repeats horizontally at exactly the distance
   travelled, which over eight seconds is 56px — a fifth of one feature of this
   pattern. Making it repeat that tightly would be a different texture, not this
   one seen briefly. So the clip evolves in place and does not slide. The
   evolution is the dominant motion and it is untouched. */
function loopLevels({ cols, rows, spacing, seed, time, frames, seconds }) {
  const noise = makeNoise4D(seed);
  const ns = DOTS.NOISE_SCALE;
  const TAU = Math.PI * 2;
  const radius = (DOTS.FLOW_SPEED * seconds) / TAU;
  const centre = time * DOTS.FLOW_SPEED;

  const perFrame = cols * rows;
  const levels = new Uint8Array(frames * perFrame);

  for (let f = 0; f < frames; f++) {
    const angle = (f / frames) * TAU;
    const z = centre + radius * Math.cos(angle);
    const w = radius * Math.sin(angle);
    const base = f * perFrame;

    for (let r = 0, i = 0; r < rows; r++) {
      const y = r * spacing * ns;
      for (let c = 0; c < cols; c++, i++) {
        levels[base + i] = quantise(noise(c * spacing * ns, y, z, w));
      }
    }
  }

  return levels;
}

/* ---- Proof that it closes -------------------------------------------------
   "It loops" is a checkable claim, so it is checked on every run rather than
   eyeballed once. A dot's shade changing from one frame to the next is the
   whole visible motion of this field, so the fraction of dots that change is a
   fair measure of how big a step a frame is.

   Reported as a RANK rather than a ratio. Individual steps vary a good deal —
   the biggest ordinary step in an eight second loop is twenty times the
   smallest — so "the join is 1.4x the average step" reads as a fault when it is
   nothing of the sort. Where the join falls among the ordinary steps answers
   the actual question: an open loop would sit past every one of them, and
   anything inside the pack is a step like any other and invisible. */
function loopStep(levels, frames, perFrame) {
  const changed = (a, b) => {
    let n = 0;
    for (let i = 0; i < perFrame; i++) if (levels[a + i] !== levels[b + i]) n++;
    return n / perFrame;
  };

  const steps = [];
  for (let f = 1; f < frames; f++) steps.push(changed((f - 1) * perFrame, f * perFrame));
  const join = changed((frames - 1) * perFrame, 0);
  steps.sort((a, b) => a - b);

  return {
    join,
    median: steps[steps.length >> 1],
    biggest: steps[steps.length - 1],
    rank: steps.filter((step) => step < join).length / steps.length,
  };
}

/* ---- Draw and encode ------------------------------------------------------
   The browser half. Draws all `frames` frames onto one canvas and pushes each
   through a VideoEncoder, returning the encoded frames for Node to put in a
   container.

   No clock anywhere in here. Each frame carries the timestamp it is MEANT to
   have, worked out from its index, so a machine that encodes at half speed
   produces the same eight second file as one that encodes at double. See the
   note at the top of this file for what that replaced and why.

   The bytes come back as one base64 string with a separate index of lengths,
   rather than as an array of arrays. Several hundred small transfers across the
   browser boundary cost more than the encoding does. */
async function encode(page, spec) {
  return page.evaluate(async (spec) => {
    const canvas = document.createElement('canvas');
    canvas.width = spec.width;
    canvas.height = spec.height;
    const ctx = canvas.getContext('2d', { alpha: false });

    const bytes = Uint8Array.from(atob(spec.levels), (ch) => ch.charCodeAt(0));
    const perFrame = spec.cols * spec.rows;

    function drawFrame(f) {
      const base = f * perFrame;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = spec.bg;
      ctx.fillRect(0, 0, spec.width, spec.height);
      ctx.setTransform(spec.scale, 0, 0, spec.scale, 0, 0);

      /* One path per shade, the same as the live backdrop and for the same
         reason: a handful of fills instead of several thousand style changes. */
      for (let b = 0; b < spec.radii.length; b++) {
        const radius = spec.radii[b];
        if (radius < 0.12) continue; // below this it is a sub-pixel smudge

        ctx.fillStyle = spec.fills[b];
        ctx.beginPath();
        let drew = false;

        for (let i = 0; i < perFrame; i++) {
          if (bytes[base + i] !== b) continue;
          const x = (i % spec.cols) * spec.spacing;
          const y = ((i / spec.cols) | 0) * spec.spacing;
          ctx.moveTo(x + radius, y);
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          drew = true;
        }

        if (drew) ctx.fill();
      }
    }

    const parts = [];
    const index = [];
    let decoderConfig = null;
    let failure = null;

    const encoder = new VideoEncoder({
      output: (chunk, metadata) => {
        if (metadata?.decoderConfig && !decoderConfig) {
          const config = metadata.decoderConfig;
          const description = config.description
            ? new Uint8Array(
                config.description.buffer ?? config.description,
                config.description.byteOffset ?? 0,
                config.description.byteLength,
              )
            : null;
          decoderConfig = {
            codec: config.codec,
            codedWidth: config.codedWidth,
            codedHeight: config.codedHeight,
            description: description ? [...description] : null,
          };
        }
        const data = new Uint8Array(chunk.byteLength);
        chunk.copyTo(data);
        parts.push(data);
        index.push({
          length: data.length,
          timestamp: chunk.timestamp,
          duration: chunk.duration,
          type: chunk.type,
        });
      },
      error: (error) => { failure = error.message; },
    });

    encoder.configure({
      codec: spec.codec,
      width: spec.width,
      height: spec.height,
      framerate: spec.fps,
      // See the note on QUANTIZER: same quality on every frame, so the loop's
      // join is not the seam between the best frame and the worst.
      bitrateMode: 'quantizer',
      /* Quality, not latency. Nothing is waiting on these frames, so the
         encoder may look as far ahead as it likes. */
      latencyMode: 'quality',
      // AVCC, which is what an MP4 wants, and which carries a decoder config.
      avc: { format: 'avc' },
    });

    const frameMicros = 1_000_000 / spec.fps;
    for (let f = 0; f < spec.frames && !failure; f++) {
      drawFrame(f);
      const frame = new VideoFrame(canvas, {
        timestamp: Math.round(f * frameMicros),
        duration: Math.round(frameMicros),
      });
      encoder.encode(frame, {
        keyFrame: f % spec.keyframeEvery === 0,
        avc: { quantizer: spec.quantizer },
      });
      frame.close();

      /* Let the encoder drain if it falls behind. Not for timing — there is no
         timing — but so a long clip does not hold every frame in memory at
         once. */
      while (encoder.encodeQueueSize > 8 && !failure) {
        await new Promise((go) => setTimeout(go, 1));
      }
    }

    if (!failure) await encoder.flush();
    encoder.close();
    if (failure) return { failure };

    const total = parts.reduce((sum, part) => sum + part.length, 0);
    const joined = new Uint8Array(total);
    let at = 0;
    for (const part of parts) { joined.set(part, at); at += part.length; }

    /* Chunked, because a single String.fromCharCode over several million bytes
       overflows the argument list. */
    let binary = '';
    for (let i = 0; i < joined.length; i += 0x8000) {
      binary += String.fromCharCode.apply(null, joined.subarray(i, i + 0x8000));
    }

    return { data: btoa(binary), index, decoderConfig };
  }, spec);
}

/* ---- Container ------------------------------------------------------------
   The encoded frames are H.264 and nothing more; an MP4 is the box structure
   around them that says how big the picture is, how fast it runs and where each
   frame starts. mediabunny writes that, in Node, from the frames the browser
   handed back.

   fastStart: 'in-memory' puts the index at the FRONT of the file rather than
   the end. It costs a second pass over a few megabytes and it means a player
   can start the clip from the first bytes it receives, which is what a social
   platform's uploader and preview both expect. */
async function mux({ chunks, decoderConfig, fps }) {
  const output = new Output({
    format: new Mp4OutputFormat({ fastStart: 'in-memory' }),
    target: new BufferTarget(),
  });

  const source = new EncodedVideoPacketSource('avc');
  output.addVideoTrack(source, { frameRate: fps });
  await output.start();

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    await source.add(
      new EncodedPacket(
        chunk.data,
        chunk.type,
        chunk.timestamp / 1_000_000,
        chunk.duration / 1_000_000,
      ),
      // The decoder config belongs with the first packet, per mediabunny.
      i === 0 ? { decoderConfig } : undefined,
    );
  }

  await output.finalize();
  return Buffer.from(output.target.buffer);
}

function flagValue(args, name, fallback) {
  const hit = args.find((arg) => arg.startsWith(`--${name}=`));
  if (!hit) return fallback;
  const value = Number(hit.slice(name.length + 3));
  return Number.isFinite(value) ? value : fallback;
}

async function main() {
  const args = process.argv.slice(2);
  const seconds = flagValue(args, 'seconds', 8);
  const fps = Math.round(flagValue(args, 'fps', 30));
  /* 37 rather than 0, as in the stills exporter: at the very origin of a simplex
     field the value is pinned to zero and the pattern around it is unusually
     regular, which is the one region of this field that does not look like the
     others. */
  const time = flagValue(args, 'time', 37);
  const seed = flagValue(args, 'seed', 0xC5E1);
  const alpha = flagValue(args, 'alpha', null);
  const quantizer = Math.round(flagValue(args, 'q', QUANTIZER));
  const gop = flagValue(args, 'gop', KEYFRAME_SECONDS);
  const only = args.find((arg) => !arg.startsWith('--'));

  const targets = only ? PRESETS.filter((preset) => preset.name === only) : PRESETS;
  if (!targets.length) {
    console.error(`No preset "${only}". Known:\n  ${PRESETS.map((p) => p.name).join('\n  ')}`);
    process.exitCode = 1;
    return;
  }

  const frames = Math.round(seconds * fps);
  // One override means one render per shape, at that loudness, named plainly.
  const loudness = alpha === null ? LOUDNESS : [{ suffix: '', alpha }];
  const radii = Array.from({ length: BUCKETS }, (_, b) => levelRadius(b));

  await mkdir(OUT_DIR, { recursive: true });

  /* WebCodecs is only handed to a secure context, and a page built with
     setContent is not one — it has no origin. A file on disk is, so the page is
     a real (empty) file that Chrome opens and this deletes on the way out. */
  const stage = join(tmpdir(), `picsel-backdrop-video-${process.pid}.html`);
  await writeFile(stage, '<!doctype html><meta charset="utf-8"><title>backdrop video</title>');

  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: true,
    args: ['--hide-scrollbars'],
    /* One call to the page covers a whole clip: every frame drawn and encoded.
       The default ceiling is three minutes, which the 16:9 pair can reach on a
       slow machine, and a timeout there loses the run. */
    protocolTimeout: 900_000,
  });

  try {
    const page = await browser.newPage();
    page.on('pageerror', (error) => console.error(`  page error: ${error.message}`));
    await page.goto(pathToFileURL(stage).href);

    const codec = await page.evaluate(async (candidates) => {
      if (typeof VideoEncoder === 'undefined') return null;
      for (const candidate of candidates) {
        const support = await VideoEncoder.isConfigSupported({
          codec: candidate, width: 1920, height: 1080, framerate: 30, bitrateMode: 'quantizer',
        });
        if (support.supported) return candidate;
      }
      return null;
    }, CODECS);

    if (!codec) {
      throw new Error(
        'This Chrome cannot encode H.264 through WebCodecs.\n' +
          `Tried:\n  ${CODECS.join('\n  ')}\n` +
          'Chrome 94 and later can. Update it, or point at a newer one with ' +
          'PUPPETEER_EXECUTABLE_PATH.',
      );
    }

    for (const preset of targets) {
      const logicalW = preset.width / preset.scale;
      const logicalH = preset.height / preset.scale;
      // The site's own rule, not a second opinion about it.
      const spacing = logicalW <= 640 ? DOTS.SPACING_SMALL : DOTS.SPACING;
      /* A column and a row of overhang, so the field runs off the right and
         bottom edges the way it runs off the edge of a browser window, rather
         than stopping a few pixels short of them. */
      const cols = Math.ceil(logicalW / spacing) + 1;
      const rows = Math.ceil(logicalH / spacing) + 1;

      /* The field does not depend on the loudness, so it is computed once and
         encoded at each. The two files are then the same eight seconds of the
         same field, which is the only way comparing them tells you anything. */
      const levels = loopLevels({ cols, rows, spacing, seed, time, frames, seconds });
      const step = loopStep(levels, frames, cols * rows);
      const packed = Buffer.from(levels).toString('base64');

      const pct = (value) => `${(value * 100).toFixed(2)}%`;
      console.log(
        `${preset.name}  ${preset.width}x${preset.height}  ${cols}x${rows} dots at ${spacing}px\n` +
          `  loop join: ${pct(step.join)} of dots change, bigger than ` +
          `${(step.rank * 100).toFixed(0)}% of ordinary steps ` +
          `(median ${pct(step.median)}, biggest ${pct(step.biggest)})`,
      );

      for (const { suffix, alpha: maxAlpha } of loudness) {
        const started = Date.now();
        const result = await encode(page, {
          width: preset.width,
          height: preset.height,
          scale: preset.scale,
          cols,
          rows,
          spacing,
          frames,
          fps,
          bg: FIELD_BG,
          fills: levelFills(maxAlpha),
          radii,
          levels: packed,
          codec,
          keyframeEvery: Math.max(1, Math.round(fps * gop)),
          quantizer,
        });

        if (result.failure) throw new Error(`Encoder gave up: ${result.failure}`);

        /* Every frame handed in must come back out. With a real-time recorder
           this could not be promised and was not true; here it is arithmetic,
           so it is asserted rather than hoped for. */
        if (result.index.length !== frames) {
          throw new Error(
            `Encoder returned ${result.index.length} frames, expected ${frames}.`,
          );
        }

        const bytes = Buffer.from(result.data, 'base64');
        let at = 0;
        const chunks = result.index.map((entry) => {
          const data = new Uint8Array(bytes.buffer, bytes.byteOffset + at, entry.length);
          at += entry.length;
          return { ...entry, data };
        });

        const config = result.decoderConfig;
        const mp4 = await mux({
          chunks,
          fps,
          decoderConfig: {
            codec: config.codec,
            codedWidth: config.codedWidth,
            codedHeight: config.codedHeight,
            description: config.description ? new Uint8Array(config.description) : undefined,
          },
        });

        const file = join(OUT_DIR, `${preset.name}${suffix}.mp4`);
        await writeFile(file, mp4);
        console.log(
          `  ${preset.name}${suffix}.mp4  alpha ${maxAlpha}  ` +
            `${(mp4.length / 1024 / 1024).toFixed(1)}MB  ` +
            `${frames} frames, ${(frames / fps).toFixed(2)}s  ` +
            `encoded in ${((Date.now() - started) / 1000).toFixed(1)}s`,
        );
      }
    }
  } finally {
    await browser.close();
    await rm(stage, { force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
