# Backdrop video export

**Date:** 2026-08-09
**Status:** approved

## What this is

A second exporter next to `tools/export-backdrop.js`, writing the site's halftone
dot field as short looping MP4s for social posts. Run with `npm run backdrop:video`.

The stills exporter froze one instant of the field. This one records eight seconds
of it moving, in the four aspect ratios social platforms actually use.

## Why it has to be the same field

Same reason `dot-field.js` exists. A video that is merely a similar texture is
worth nothing: the point of putting the backdrop behind a caption is that the post
and the website are visibly one thing. Constants, quantising, contrast, tint and
spacing all come from `dot-field.js`. Nothing about the texture is re-typed.

## Making the loop close

The live field is a plane of 3D simplex noise with time as the third axis. It never
repeats, which is right for a page you scroll forever and useless for a clip that
has to play round.

Same fix the seamless tile uses: walk a closed circle instead of a straight line.
For the tile it was the two space axes that closed; here the plane stays flat and
it is the time axis that goes round, so the circle lives in the two extra
dimensions of a 4D field.

The circle's circumference is set to `FLOW_SPEED × seconds`, so travelling once
round covers exactly as much noise as the site covers in eight seconds. The rate of
change is therefore the site's rate of change, not a sped-up or slowed one. The
circle's centre is offset along one axis by `time × FLOW_SPEED`, so `--time` means
the same thing it means in the stills exporter: which region of the field you are
looking at.

A loop can only ever show as much variety as its own length. Going round a circle
means the back half heads home rather than pressing on. That is inherent to
looping, and it is the price of no visible jump.

### What the loop cannot keep

The site's field also drifts sideways at 7px/s. A lateral drift only closes if the
noise repeats horizontally at exactly the distance travelled, 56px over eight
seconds, far smaller than one feature of the pattern (~310px). Making it repeat at
that pitch would be a different texture.

So the clip evolves in place and does not slide. Everything else about the motion
is the site's, and the evolution is the dominant part of it. Recorded here so that
nobody later reads the missing drift as a bug.

## Presets

Each format is drawn at the logical size the format is actually watched at, so the
dots come out the size a viewer is used to seeing them rather than a fine grain
that compression will mush.

| name | pixels | scale | logical | spacing |
|---|---|---|---|---|
| `reel-9x16` | 1080x1920 | 2.5 | 432x768 | 14 |
| `square-1x1` | 1080x1080 | 2 | 540x540 | 14 |
| `portrait-4x5` | 1080x1350 | 2.5 | 432x540 | 14 |
| `wide-16x9` | 1920x1080 | 1 | 1920x1080 | 12 |

Spacing is not chosen here. It comes from the site's own rule in `dot-field.js`:
logical width at or under 640 gets `SPACING_SMALL`. The three phone formats land
under it and the 16:9 does not, which is exactly the split the site makes.

## Loudness

Every preset is written twice, mirroring the stills. The plain file is the site's
own `MAX_ALPHA`; the `-bold` file raises it, because social platforms re-encode
everything and 10% of a pale grey on near-black is the first thing an encoder
throws away.

## Frame rate and quality

30fps, which is not a compromise: the live field updates on alternate frames at 60,
so 30 distinct pictures a second is all there ever are.

**Every frame is a key frame, at a fixed quantiser of 20.** Neither is the usual
choice and both were forced by measurement rather than picked up front. See "What
went wrong" below.

## How the pixels get out

Chrome draws each frame on a canvas and encodes it through **WebCodecs**
(`avc1.640028`), one frame at a time, with the timestamp that frame is meant to
have. Node then wraps the encoded frames in an MP4 with **mediabunny**, a new
dev-only dependency.

WebCodecs needs a secure context and a page built with `setContent` has no origin,
so the exporter writes a one-line HTML file to the temp directory, opens it over
`file://` (which Chrome treats as secure) and deletes it afterwards.

Rejected: PNG frames plus ffmpeg (not installed), and `MediaRecorder`, which was
built first and then abandoned.

## What went wrong, and why the design changed

The first build used `MediaRecorder` pointed at the canvas. Three faults came out
of testing, in order, each one only visible because the previous had been fixed.

1. **Short clips came out empty.** `stop()` does not flush what the encoder is
   still holding, it discards it. Fixed by waiting for the encoder to go quiet.
2. **The 16:9 clip was silently wrong.** `MediaRecorder` records in real time and
   drops whatever the encoder cannot keep up with. Of 240 frames submitted at
   1920×1080, **14 survived**, and the file was three seconds long instead of
   eight. The three phone shapes kept up, so the fault looked like a preset
   problem rather than an approach problem. Enabling the GPU did not help; nor did
   lowering the bitrate, nor a coarser dot grid.

   This is what moved the design to WebCodecs. It has no clock in it: frames are
   encoded at whatever speed the machine manages and carry the timestamps they were
   given, so the duration is exact by construction and the same command produces
   the same file everywhere.
3. **The loop still had a visible pulse at the join, twice over.** Both faults were
   in the coding, not the field.
   - Predicted frames drift from what went in, while frame 0, a key frame, is
     exact. The join therefore stepped ~60× an ordinary step. Fixed by coding every
     frame independently, which costs roughly 4× the file size.
   - Aiming at a bitrate makes the encoder ramp quality across the clip, so the
     last frame was softer than the first. Fixed by fixing the quantiser instead.

## Checking it

Two checks, both run every time rather than eyeballed once.

- **The loop closes.** The fraction of dots that change between frames measures how
  big a step a frame is. The join is reported as its RANK among the 239 ordinary
  steps, because individual steps vary twentyfold and a ratio reads as a fault when
  it is not one. An open loop would rank past every step; all four shapes rank
  between 33% and 59%.
- **No frame is lost.** The encoder must return exactly as many frames as it was
  given, or the run fails. Under `MediaRecorder` this could not be promised;
  here it is arithmetic.

### Division of labour

As in the stills exporter: Node does every bit of the maths, Chrome only draws and
encodes. All 240 frames' worth of dot levels are computed in Node, packed one byte
per dot, and handed to the page as a single base64 string before encoding starts,
so several hundred small transfers across the browser boundary never happen. The
encoded frames come back the same way, as one string with an index of lengths.

## Files

- `noise-4d.js` (new, repo root next to `noise.js`): `makeNoise4D`, lifted out of
  `export-backdrop.js`, which currently owns it privately. Two callers now, so it
  moves out for the same reason `dot-field.js` was split off.
- `tools/export-backdrop-video.js` (new): the exporter.
- `tools/export-backdrop.js`: imports `makeNoise4D` instead of defining it.
- `package.json`: the `backdrop:video` script, and `mediabunny` as a devDependency.
- `.assetsignore`: `noise-4d.js` added, since no page loads it.
- `.gitignore`: the existing `assets/backdrop/` note updated to mention the clips.
- Output to `assets/backdrop/video/`, which `.gitignore` already covers via
  `assets/backdrop/`. Regenerable in one command, and nothing on the site links to
  it.

## Flags

Mirroring the stills exporter, so the two commands behave alike.

```
npm run backdrop:video                 every preset, both loudnesses
npm run backdrop:video -- reel-9x16    just one
  --seconds=8   loop length
  --fps=30      frames per second
  --time=37     which region of the field
  --seed=50657  a different field entirely
  --alpha=0.16  one render per preset at this loudness, named plainly
  --q=20        H.264 quantiser, if a file needs to be smaller
```
