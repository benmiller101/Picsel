/* ---- dot-field.js — what a dot in the backdrop looks like -----------------
   The numbers and the three lines of maths that define the halftone field, in
   a module with no side effects so anything can import them: backdrop.js, which
   runs the field live behind every page, and tools/export-backdrop.js, which
   freezes one instant of it into a print-resolution PNG.

   THIS FILE EXISTS SO THERE IS ONE DEFINITION. The exporter's whole promise is
   that the image on a document is the same texture as the website. A second
   copy of these constants would keep that promise exactly until the first time
   someone tuned MAX_ALPHA and only edited one of them.

   What is NOT here: the animation, the parallax, the grid, the typed arrays and
   the two-pass draw. All of that belongs to backdrop.js because all of it is
   about running the field at 60fps in a browser. A still does none of it. */

export const DOTS = {
  SPACING: 12,          // px between dots — tight
  SPACING_SMALL: 14,    // ...on phones: fewer dots, less to draw
  MAX_RADIUS: 6,        // px. Diameter ~73% of the pitch, so dots nearly touch.

  TINT: [142, 148, 178], // cool grey, slightly blue
  MAX_ALPHA: 0.1,        // THE LOUDNESS KNOB. Around 0.08 it is a texture you
                         // sense more than see; past ~0.3 it starts competing
                         // with the content for attention.

  /* Number of discrete shades. THIS IS WHAT MAKES IT FLICKER. With a
     continuous mapping from noise to alpha a dot eases between shades and the
     field reads as a soft gradient. Quantising to a handful of levels means a
     dot has to JUMP as the noise drifts past a threshold. */
  LEVELS: 5,
  SIZE_STEP: 0.45,       // how much of the radius also follows the level
  ALPHA_MOD: true,       // modulate alpha by the noise as well as size

  NOISE_SCALE: 0.0032,   // pattern zoom, in 1/px
  FLOW_SPEED: 0.09,      // how fast the field evolves in place
  DRIFT: 7,              // px/sec of slow lateral travel across the field
  CONTRAST: 2,         // >1 keeps big dots sparse and clustered

  /* Parallax: how far the field travels compared to the page. 0 pins it to the
     viewport (no parallax at all), 1 makes it scroll exactly with the content
     and so look painted onto the page. 0.3 is a deliberate middle — clearly
     readable as depth, but a third of the content's speed is slow enough that
     it never drags the eye off a paragraph. */
  PARALLAX: 0.1,

  // A background: updating on alternate frames halves the cost and is
  // imperceptible at these speeds. 1 = every frame.
  UPDATE_EVERY: 2,
  MAX_DPR: 1.5,          // dots are ~2px; past this it is invisible detail
};

/* The page background the field is drawn on. Duplicated from --bg in tokens.css
   because a PNG written to disk cannot read a stylesheet, and an image that has
   to be composited onto the right colour by hand in Word is not much use. Kept
   next to the dots so the two are obviously a pair. */
export const FIELD_BG = '#0a0a0a';

export const BUCKETS = Math.max(2, DOTS.LEVELS | 0);

/* Raw noise in [-1,1] to one of BUCKETS shades.

   Two steps and they are both load-bearing. The contrast curve pushes the
   distribution down, which is what keeps the big bright dots sparse and
   clustered instead of evenly stippled across the whole field. The floor of the
   multiply is the QUANTISE: the dot snaps to exactly one shade and never sits
   between two, which is what makes it jump rather than ease when the field
   moves underneath it.

   Takes the noise value rather than the noise function so the caller decides
   how it was sampled. backdrop.js walks a plane of it; the exporter's tile
   walks a torus, to come back round to where it started. */
export function quantise(raw) {
  let n = (raw + 1) * 0.5;
  n = Math.pow(n < 0 ? 0 : n > 1 ? 1 : n, DOTS.CONTRAST);
  return Math.min(BUCKETS - 1, (n * BUCKETS) | 0);
}

/* The radius for a shade. Size follows the same quantised step as the shade, so
   it steps rather than eases — a dot two levels up is both bigger and brighter,
   in one jump. */
export function levelRadius(level, maxRadius = DOTS.MAX_RADIUS) {
  const q = level / (BUCKETS - 1);
  return maxRadius * (1 - DOTS.SIZE_STEP + DOTS.SIZE_STEP * q);
}

/* Every shade's fill string, faintest to loudest, built once. At 17,000 dots a
   frame these would otherwise be thousands of string allocations per draw. */
export function levelFills(maxAlpha = DOTS.MAX_ALPHA) {
  const [r, g, b] = DOTS.TINT;
  const fills = [];
  for (let i = 0; i < BUCKETS; i++) {
    const a = maxAlpha * ((i + 1) / BUCKETS);
    fills.push(`rgba(${r},${g},${b},${a.toFixed(4)})`);
  }
  return fills;
}
