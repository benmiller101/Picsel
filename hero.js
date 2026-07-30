/* ===========================================================================
 * PICSEL — dark hero: lava-lamp gradient blobs + glitching pixel wordmark
 * ---------------------------------------------------------------------------
 * Two layers on near-black, one requestAnimationFrame loop:
 *
 *   1. Blobs. Each is a closed SVG path whose radius around a circle is
 *      deformed by 3D simplex noise — two dimensions walk around the circle,
 *      the third is TIME. Sampling the angle on an actual circle in noise space
 *      (cos, sin) rather than as a 1D sweep is what makes the loop seamless:
 *      there is no join to hide because the sample path is closed. That, plus a
 *      goo filter, is what reads as liquid rather than as a wobbling circle.
 *
 *   2. Wordmark. Real text, one span per letter, and the glitch swaps
 *      individual letters to a different pixel font for a few dozen
 *      milliseconds. Fonts that aren't actually loaded are dropped from the
 *      rotation, so a missing Adobe embed degrades to "fewer fonts in the
 *      cycle" instead of flashing Times New Roman.
 *
 * Structured as one factory, createPicselHero(root) -> { destroy }, so the same
 * file drops into React unchanged. See the note at the bottom.
 * ======================================================================== */

/* ===========================  TUNABLES  =================================== */

const BLOBS = {
  COUNT: 2,           // the reference is two, held either side of the wordmark
  COUNT_SMALL: 2,

  /* --- shape: metaballs, not a wobbly circle ---------------------------
   * Each blob is a CLUSTER of round lobes that slowly orbit their own centre,
   * all drawn into one goo-filtered group so they melt into a single silhouette
   * with concave necks between them. That necking is the whole look, and it is
   * something a single noise-deformed outline cannot do at any setting: deform
   * one circle hard enough to pinch and it self-intersects instead.
   *
   * The noise still earns its place — it deforms each lobe slightly so the
   * silhouette breathes rather than looking like rigid circles sliding around.
   */
  LOBES: [2, 3],        // per blob, randomised in this range
  LOBE_RADIUS: 0.10,    // as a fraction of the viewport's SHORT side
  LOBE_RADIUS_VARIANCE: 0.018,  // tight — see SPREAD_RATIO

  // How far a lobe sits from the cluster centre, as a multiple of ITS OWN
  // radius. Proportional, not absolute, and that's the fix for round blobs:
  // with a fixed spread, a lobe that rolled a large radius simply swallows its
  // neighbours and the cluster comes out as a featureless circle. Tying the two
  // together guarantees a neck at every size.
  //   < 0.7  lobes fuse into one round mass
  //   ~1.0   distinct lobes with a clean neck  <- the reference
  //   > 1.4  the goo can't bridge them and they separate into islands
  LOBE_SPREAD_RATIO: 1.0,

  ORBIT_SPEED: 0.15,    // how fast lobes swing around the cluster

  /* --- morph ---
   * Three independent noise channels, which is what gives "lots of different
   * shapes" rather than one shape wobbling:
   *   PULSE_SPREAD  the cluster opens and closes — the big one. As it breathes
   *                 the same blob goes round mass -> peanut -> nearly-separate
   *                 islands and back.
   *   PULSE_RADIUS  each lobe swells and shrinks independently, so the cluster
   *                 goes lopsided and rebalances.
   *   MORPH         the outline of each lobe deforms.
   * All three run at different rates per lobe, so they rarely line up and the
   * silhouette keeps arriving somewhere new.
   */
  // Low frequency and low amplitude. NOISE_SCALE is what controls lumpiness:
  // it's how many wavelengths of noise fit around one lobe, so at 1.5 you get
  // several bumps per lobe and the outline reads as knobbly. Under 1 there is
  // barely one wave around the whole lobe, which is a smooth ovoid lean rather
  // than lumps. The dramatic shape change comes from PULSE_* below, which are
  // smooth by construction.
  MORPH: 0.13,
  MORPH_SPEED: 0.28,
  NOISE_SCALE: 0.8,
  PULSE_RADIUS: 0.30,
  // Ceiling matters here: peak spread is LOBE_SPREAD_RATIO * (1 + this), and
  // once lobe centres exceed roughly 2.5x their radius the goo can no longer
  // bridge them and the blob breaks into separate islands. At 0.45 it necks
  // down to a thread and recovers; past ~0.6 it will come apart.
  PULSE_SPREAD: 0.45,
  PULSE_SPEED: 0.22,

  POINTS: 64,         // samples per lobe outline, smoothed into cubic beziers.
  POINTS_SMALL: 44,   // Raised: the magnet tendril needs resolution to stay
                      // smooth when it's stretched.

  // --- drift ---
  // Small, because the blobs have assigned zones either side of the wordmark
  // and must not wander across it.
  DRIFT: 0.05,
  DRIFT_SPEED: 0.05,  // lissajous rate. Deliberately slow — lava lamp, not
                      // lava flow.

  // Where each blob lives, as viewport fractions. The centre is deliberately
  // left empty for the wordmark.
  HOMES: [[0.19, 0.52], [0.81, 0.48], [0.5, 0.16], [0.5, 0.84]],

  // Narrow viewports: stacked above and below the wordmark instead of beside
  // it. Side-by-side has nowhere to go on a phone — the blobs would either
  // overlap the type or be squeezed to nothing.
  HOMES_STACKED: [[0.52, 0.17], [0.46, 0.85], [0.2, 0.5], [0.8, 0.5]],
  STACK_BELOW: 760,   // px viewport width at which it switches
  RADIUS_STACKED: 0.15, // lobe radius on narrow screens, as a fraction of the
                        // short side — bigger, since there's more room
                        // vertically once they're stacked

  // --- goo ---
  // Blurs the blob layer until neighbours bleed together, then slams the alpha
  // back to a hard edge. Overlapping blobs merge and neck like real lava-lamp
  // blobs instead of just crossing over.
  GOO: true,
  GOO_BLUR: 20,       // in viewport px. This is what bridges neighbouring
                      // lobes — too low and they stay separate circles, too
                      // high and the cluster rounds off into one ball.
  // Edge hardness. The transition width is roughly GOO_BLUR / GOO_SHARPEN, so
  // at 20/45 the alpha ramp is under half a pixel — a vector-hard edge.
  // THRESHOLD must move with it to keep THRESHOLD/SHARPEN at ~0.43, which is
  // where the cut sits; change one alone and the whole silhouette fattens or
  // shrinks.
  GOO_SHARPEN: 45,
  GOO_THRESHOLD: 19,

  // --- colour: mesh gradient ---
  // How far the colour field is blurred INSIDE the silhouette. This can be
  // heavy without costing edge sharpness, because the shape comes from a mask
  // and the colour is painted behind it — the blur never touches the outline.
  // Enough to melt the spots into one another, but no more. Over-blurring is
  // what greys the mesh out: blur mixes hues from opposite sides of the colour
  // wheel toward their average, so a bold five-colour field turns into one
  // muddy tone. Raise MESH_SPREAD instead if the transitions look too abrupt.
  MESH_BLUR: 19,
  // Colour spots are their own thing, NOT one-per-lobe. Tying them to lobes
  // caps the mesh at two or three colours and pins them to the lobe centres, so
  // the blob reads as one flat colour with a hotspot. Free-floating spots that
  // orbit the cluster independently give a field that keeps re-mixing.
  MESH_SPOTS: 6,      // one per palette colour, plus one repeat, so every hue
                      // in the gradient actually appears on the blob
  MESH_SPOT: 0.55,    // spot radius, as a fraction of the cluster's extent.
                      // Tighter than the spread, so each colour keeps a core
                      // where it is undiluted — that core is what stays bold.
  MESH_SPREAD: 0.8,   // how far spots sit from the cluster centre, as a
                      // fraction of extent. Near 0 they stack in the middle and
                      // average into one colour; near 1 they sit under the rim
                      // and the centre goes flat.
  MESH_SWIRL: 0.09,   // how fast the spots rotate around the cluster

  // --- colour ---
  COLOR_HOLD: [5, 11],   // seconds a blob keeps a gradient before drifting to
                         // the next, randomised per blob
  COLOR_LERP: 0.22,      // per-second approach rate toward the new gradient
};

/* ---- the pixel grid -----------------------------------------------------
 * The blobs are not smooth shapes with a pixelate effect laid over them. They
 * are DRAWN at a low resolution and scaled up — the hero's own small display.
 *
 * The difference is in the movement, and it is the whole point. Pixelate a
 * smoothly-moving shape and the shape still moves smoothly underneath: the
 * blocks along its edge shimmer and crawl, which reads as a filter. Draw it on
 * a fixed grid and an edge block does not move at all until the shape crosses a
 * whole cell boundary, then it flips in one step. The motion becomes chunky and
 * deliberate. That only happens if the grid is fixed to the screen and the
 * drawing is genuinely sampled onto it, which is what this does.
 *
 * Everything is rendered into canvases CELL times smaller than the stage and
 * scaled back up with nearest-neighbour, so one source pixel becomes one block
 * of one flat colour. Cheap, too: a 1440-wide screen is 180 x 100 pixels of
 * actual drawing, which is why the per-pixel compositing below costs nothing.
 */
const PIXEL = {
  // Block size in CSS pixels. Fixed size rather than a fixed number of blocks
  // across, so the grain reads the same on a phone as on a desktop instead of
  // getting finer as the screen gets smaller.
  CELL: 8,

  // Alpha at which a blurred cell counts as inside the blob, 0-255. Derived
  // from the goo constants rather than picked: the SVG version this replaced
  // mapped alpha through (a * GOO_SHARPEN - GOO_THRESHOLD), so its edge sat
  // where that crosses a half — which is (0.5 + 19) / 45, about 0.43. Keeping
  // the same cut keeps the silhouette that was tuned there, and the hard yes/no
  // is what the grid needs anyway.
  ALPHA_CUT: Math.round(((0.5 + 19) / 45) * 255),
};

// Sourced from colour-palette.txt (the same six gradients the mesh-wheel page
// uses). Edit here rather than re-reading that file: this page is a plain
// static file and fetch() is blocked on file://, so the palette is inlined
// deliberately.
/* Grouped into FAMILIES, and blob i only ever draws from family i.
 *
 * This matters more than it looks. With one flat list, the colour breathing
 * picks any gradient for any blob, and within a minute or two both blobs have
 * wandered into the same corner of the palette — two purple blobs, no contrast,
 * nothing like the reference. Keeping each blob inside its own family means the
 * cool/warm pairing survives however long the page is left running.
 *
 * Add a family to give a third blob its own identity. */
/* FIVE stops, and fully saturated ones.
 *
 * The reference sweeps a wide hue range across a single blob — green through
 * teal and blue to violet on one, yellow through red to magenta and lime on the
 * other — in pure colour. Three mid-saturation stops cannot do that: the spots
 * overlap, average toward their common hue, and the blob comes out as one muted
 * colour with a tint. Wide hue span + full saturation is what reads as bold.
 *
 * Keep these vivid. Anything desaturated here goes grey once blurred, because
 * blurring colours that sit on opposite sides of the wheel averages toward the
 * middle of it. */
const BLOB_GRADIENTS = [
  [ // family 0 — cool: green -> cyan -> blue -> violet -> magenta
    ['#00e676', '#00d4ff', '#3d5afe', '#9c27ff', '#ff29c3'],
    ['#2bff88', '#00c2ff', '#5b6cff', '#b14dff', '#ff4fd8'],
    ['#00ffa3', '#00b0ff', '#4a3dff', '#8b2fff', '#e838ff'],
  ],
  [ // family 1 — warm: yellow -> amber -> red -> pink -> lime
    ['#ffe600', '#ffa000', '#ff2d55', '#ff1493', '#b6e800'],
    ['#fff02e', '#ff8c1a', '#ff1f4b', '#ff3da6', '#c8f03a'],
    ['#ffd600', '#ff7300', '#ff0a3c', '#ff2d95', '#a8e000'],
  ],
];

/* ---- chromatic aberration on the blobs ----------------------------------
 * Real per-channel separation, not a coloured copy underneath: the red channel
 * is offset one way, the blue the other, green stays put, and the three are
 * recombined with screen blending. Where the image is flat the channels realign
 * and the colour is untouched; only edges fringe. Tinted duplicates would wash
 * the whole blob out instead, since red over cyan is white.
 *
 * The offset is RADIAL from the centre of the screen and grows toward the
 * edges, mimicking a real lens — nothing at the optical axis, worst in the
 * corners.
 *
 * On the pixel grid it is measured in WHOLE BLOCKS, because a fringe narrower
 * than one block cannot be drawn: sub-block separation would either vanish or,
 * worse, round unevenly along an edge and read as a rendering fault. So the
 * middle of the frame is clean and the far corners split by exactly one block —
 * the lens idea kept, told in the grid's own units.
 */
const CHROMA = {
  BLOBS: true,
  MIN: 0,          // blocks of separation at dead centre
  MAX_CELLS: 1.4,  // blocks at the far corners, before rounding. 1.4 means the
                   // outer fifth or so of the frame carries a one-block split
                   // and everything inside it is untouched.
  FALLOFF: 2.1,    // exponent on normalised distance. >1 keeps the middle of
                   // the frame clean and concentrates what little there is at
                   // the very edges.
};

/* The blobs' entrance: dragged in from off-page, left and right.
 *
 * The stretch is the point. It's applied on the X axis only, about the blob's
 * own centre, and decays as the blob settles — so the shape arrives elongated,
 * as if it's being pulled through the edge of the frame, and relaxes into its
 * resting form. Ease-out means it's moving fastest at the start, which is
 * exactly when the stretch is greatest; the two reinforce each other.
 */
const BLOB_INTRO = {
  ENABLED: true,
  DURATION: 3.4,   // seconds for one blob to arrive. Long: the deformation is
                   // the point, and it needs time on screen to be read as a
                   // stretch rather than a fast wipe.
  DELAY: 0.8,      // per-blob stagger — the second blob starts this long after
                   // the first, so they arrive one at a time
  // false: the blobs start moving immediately on load, alongside the text
  // rather than after it. DELAY above still staggers them against each other.
  AFTER_TEXT: false,
  EXTRA_DELAY: 0,  // only applies when AFTER_TEXT is true
  FROM: 0.85,      // how far off-screen it starts, in viewport widths beyond
                   // its own side of the frame

  STRETCH_X: 2.3,  // peak horizontal elongation while travelling. 1 = none.

  // Squash vertically by exactly 1/STRETCH_X, so the area under the outline is
  // unchanged and the blob reads as the SAME mass being drawn thin. Without
  // this a 2.3x stretch is also a 2.3x area increase and the blob looks like it
  // swells on the way in, which is what "too big when stretching" was.
  AREA_PRESERVE: true,
  SQUASH_Y: 0.45,  // manual vertical squash, used only when AREA_PRESERVE is off

  EASE: 2.4,       // ease-out exponent on the POSITION

  // How much of the travel holds full deformation before it starts releasing.
  // The release itself is a smoothstep, which lands with ZERO slope.
  //
  // The shape of this curve is the whole game, and both obvious choices are
  // wrong. Decaying it with the position ease makes the entrance look like a
  // plain slide — ease-out is nearly done a third of the way in, so the stretch
  // has gone before the blob is even on screen. But decaying it as (1-p)^k with
  // k < 1, which holds it usefully long, has a derivative that goes to INFINITY
  // as p approaches 1: the last of the stretch vanishes instantly and the blob
  // appears to snap into place. Hold-then-smoothstep keeps it stretched across
  // the visible part of the journey and still arrives with no velocity at all.
  HOLD: 0.2,
};

/* The exit: the entrance played backwards, scrubbed to scroll position.
 *
 * The hero is a tall section with a sticky stage inside it (see hero.css), so
 * the browser pins the stage on screen while that extra height scrolls past.
 * How far through that pinned distance the page has scrolled is a number from 0
 * to 1, and that number drives the intro in reverse: blobs travel back out to
 * the sides, wordmark comes apart and lifts away. Scroll back up and it
 * re-assembles, because nothing here is an animation that was "played" — every
 * frame is drawn from the current scroll position, so it is reversible by
 * construction.
 *
 * The distance itself is NOT configured here. hero.js measures the element, and
 * --hero-scroll in hero.css is the single place it is set — two copies of the
 * same number in two files is how they end up disagreeing.
 */
const SCROLL = {
  ENABLED: true,

  // Per-blob stagger on the way out, in scrub units (0..1). The entrance
  // staggers in seconds; the exit has to stagger in scroll, since that is its
  // clock. Reversed order, so the blob that arrived first leaves last.
  EXIT_STAGGER: 0.14,

  // Shape of the exit against scroll position. Above 1 the blobs hold near
  // home through the early scroll and leave late, which is what spreads the
  // movement across the whole gesture.
  //
  // Measured, not guessed: a blob is off the edge of the screen once it is
  // roughly halfway back to where it started, because it starts most of a
  // viewport beyond the frame. Drive that journey evenly and the blobs are
  // gone by the halfway point of the scroll, leaving the second half of a
  // pinned screen with nothing happening on it — which reads as the page
  // having jammed. At 2.2 they are still nearly home at the halfway mark and
  // only clear the frame in the last third.
  EXIT_CURVE: 2.2,

  // How far past the hero the animation loop keeps running, in viewport
  // heights. Not zero: stopping the instant the last pixel leaves means a
  // one-pixel scroll back up finds a frozen hero for a frame. A fifth of a
  // screen of slack is cheap and makes the boundary unnoticeable.
  PAUSE_SLACK: 0.2,
};

/* ---- dot-grid texture ---------------------------------------------------
 * A halftone of the same kind of noise field the blobs use: a fixed grid of
 * dots whose radius is driven by 3D simplex sampled at (x, y, time), so
 * clusters of larger dots swell and drift through the field.
 *
 * The defaults are set at the near-invisible end on purpose — it should read as
 * texture you notice rather than see. DOT_MAX_ALPHA is the knob to reach for
 * first; everything else changes the character, not the loudness.
 */
const DOTGRID = {
  ENABLED: true,
  LAYER: 'behind',      // 'behind' the blobs (default) or 'overlay' on top of
                        // everything including the wordmark

  SPACING: 11,          // px between dots — tight
  SPACING_SMALL: 14,    // ...on phones: fewer dots, less to draw
  MAX_RADIUS: 4,        // px. Diameter ~73% of the pitch, so the dots nearly
                        // touch, as in the reference.

  TINT: [142, 148, 178], // cool grey, slightly blue
  MAX_ALPHA: 0.2,        // THE LOUDNESS KNOB. Around 0.08 it's a texture you
                         // sense more than see; past ~0.3 the grid starts
                         // competing with the blobs for attention.

  /* Number of discrete shades. THIS IS WHAT MAKES IT FLICKER.
   *
   * With a continuous mapping from noise to alpha, a dot eases between shades
   * and the field reads as a soft gradient. Quantising to a handful of levels
   * means a dot has to JUMP from one shade to the next as the noise drifts past
   * a threshold — which is the posterised, blinking quality of the reference.
   * More levels = smoother and less flicker; 3 or 4 is very stark. */
  LEVELS: 5,
  SIZE_STEP: 0.45,       // how much of the dot's radius also follows the level,
                         // 0 = every dot the same size (purely a shade grid),
                         // 1 = size varies as much as shade does
  ALPHA_MOD: true,       // modulate alpha by the noise as well as size

  NOISE_SCALE: 0.0042,   // pattern zoom, in 1/px. Higher = smaller, busier
                         // clusters; lower = broad slow swells.
  FLOW_SPEED: 0.09,      // how fast the field evolves
  DRIFT: 7,              // px/sec of slow lateral travel across the field, on
                         // top of the evolution
  CONTRAST: 1.6,         // exponent on the noise. >1 pushes more of the field
                         // toward small dots and keeps the big ones sparse,
                         // which is what makes it read as clusters rather than
                         // an even stipple.

  CURSOR_GLOW: false,    // faint brightening around the pointer. Off — the
                         // brief asks for minimal by default.
  CURSOR_RADIUS: 0.22,   // in viewport-short-side units
  CURSOR_GAIN: 1.5,      // peak alpha multiplier under the cursor

  // The texture is a background: updating it on alternate frames halves its
  // cost and is imperceptible at these speeds. 1 = every frame.
  UPDATE_EVERY: 2,
  MAX_DPR: 1.5,          // dots are 2px; past this it's invisible detail
};

const MOUSE = {
  ENABLED: true,
  ATTRACT: true,      // false = the surface shrinks away from the cursor and
                      // the mass leans off instead of toward

  /* --- magnetic surface pull — the main event ---------------------------
   * Applied PER OUTLINE POINT, not to the blob as a whole. Each point is drawn
   * toward the cursor by an amount that falls off with its own distance from
   * it, so the near edge stretches into a tendril reaching for the pointer
   * while the far side barely notices. That local deformation is what reads as
   * magnetic liquid; translating the whole mass just reads as a blob following
   * the mouse.
   */
  /* The surface bulges OUTWARD on the side facing the cursor.
   *
   * Displacement is along each point's own outward normal, scaled by how
   * squarely it faces the cursor — NOT toward the cursor's position. Moving
   * points toward the cursor is the intuitive version and it deflates the blob:
   * every point on the far side is pulled inward, and with the pointer resting
   * over the blob the whole outline collapses toward it. Bulging along the
   * normal can only ever push the surface out.
   */
  MAGNET: 0.16,       // bulge height at full influence, as a fraction of the
                      // lobe's radius
  MAGNET_RANGE: 0.30, // how close the cursor must get, in viewport-short-side
                      // units, measured centre-to-cursor
  MAGNET_FOCUS: 2.2,  // how tightly the bulge wraps the facing direction.
                      // Higher = a narrower finger, lower = the whole near side
                      // swells.

  // Subtract the mean bulge from every point, so pushing one side out pulls the
  // rest in by the same average amount and the enclosed area stays put. 1 =
  // fully conserved, 0 = the blob simply inflates near the cursor.
  MASS_PRESERVE: 1,
  MAGNET_DAMP: 3.4,   // per-second easing of the effect coming and going, so
                      // it never snaps on when the pointer enters the window

  // Whole-mass lean. Deliberately small now — the surface pull above does the
  // expressive work, and this just stops the blob feeling nailed down.
  STRENGTH: 0.04,
  FALLOFF: 0.85,      // how quickly the lean decays with distance
  DAMP: 1.9,          // per-second approach rate. Lower = laggier, floatier.
};

/* ---- fonts --------------------------------------------------------------
 * PRIMARY is the resting font; ROTATION is what the glitch flashes to.
 *
 * The names here must match what Adobe actually serves — Adobe's CSS name is
 * usually lowercase and hyphenated ("argent-pixel-cf"), not the marketing name.
 * Confirm each in fonts.adobe.com -> Web Projects -> your project. The embed
 * itself lives in the shared <head> in tools/templates/page.js, so it is on
 * every page of the site rather than pasted into each one.
 *
 * Anything in here that isn't really loaded is dropped at startup (see
 * resolveFonts) rather than rendering as a fallback, so wrong names fail
 * quietly and visibly-in-the-console instead of ugly.
 */
const FONTS = {
  // Exact CSS names from https://use.typekit.net/ior4aly.css — Adobe serves
  // lowercase-hyphenated names, NOT the marketing names. "Argent Pixel CF"
  // silently resolves to nothing.
  PRIMARY: 'argent-pixel-cf',
  ROTATION: [
    'argent-pixel-cf',       // Adobe — the resting face, so it never actually
                             // appears in the rotation (see resolveFonts); kept
                             // here so the list documents the full set
    'gridlite-pe-variable',  // Adobe — variable 1..900
    // 'pf-pixelscript',     // in the web project, deliberately out of the
                             // rotation — it's a script face, not a pixel grid,
                             // so it reads as a different word rather than a
                             // glitch. Re-add the line to bring it back.
    'pixelify-sans',         // Adobe's copy
    'Pixelify Sans',         // Google's copy — a distinct family name, and a
                             // slightly different cut, so it earns its place
  ],
  // Resting font used until/unless the Adobe embed is pasted in.
  FALLBACK: `'Pixelify Sans', ui-monospace, 'Courier New', monospace`,

  // Last resort only. With just Pixelify Sans loaded there is nothing to glitch
  // TO — it's already the resting font — so the effect would be invisible.
  // These are always-present system faces with obviously different shapes, used
  // purely so the glitch can be seen and tuned before the Adobe fonts land.
  // Ignored as soon as two or more real pixel fonts resolve.
  STANDIN: ['Courier New', 'Georgia', 'Impact'],
};

/* The build-in. Runs once on load, then hands over to the ambient glitch.
 *
 * The wordmark arrives in RANDOM order and the tagline in READING order — the
 * two halves are meant to feel different: one assembling out of noise, one
 * typing itself out. */
const INTRO = {
  ENABLED: true,
  START_DELAY: 260,        // ms before the first letter lands
  LETTER_STEP: [95, 190],  // ms between wordmark letters, randomised
  GAP: 280,                // ms pause after the wordmark, before the tagline
  TAG_STEP: 52,            // ms between tagline letters — even, not random,
                           // which is what makes it read as typing
  FLASH: [70, 150],        // ms glitch flash as each wordmark letter lands
  TAG_GLITCH: false,       // the tagline is Lexend, not a pixel face — swapping
                           // it to a pixel font on arrival reads as a mistake
                           // rather than an effect
  SETTLE: 40,              // ms after the last letter before the blobs are
                           // released and the ambient glitch starts. This plus
                           // BLOB_INTRO.EXTRA_DELAY is the whole gap between
                           // the text finishing and the blobs moving — near
                           // enough to zero that they overlap.
};

const GLITCH = {
  RATE: [0.8, 2.4],        // seconds between events, randomised in this range
  FLASH: [50, 140],        // ms a letter stays swapped, randomised
  LETTERS_AT_ONCE: [1, 2], // mostly one, occasionally two
  CASCADE_CHANCE: 0.08,    // odds an event is instead a quick run across the
                           // whole word
  CASCADE_STEP: 40,        // ms between letters in a cascade
  RGB_SPLIT: true,         // the chromatic-aberration flourish
  JITTER: 1.4,             // max horizontal kick on a glitching letter, in px
  GLITCH_TAGLINE: false,   // off: the tagline is Lexend now, and a pixel-font
                           // swap on a proportional face just looks broken

  // prefers-reduced-motion: far rarer, no RGB split, no cascades.
  REDUCED_RATE: [4, 9],
};

/* =========================  small math helpers  ========================== */

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const lerp = (a, b, t) => a + (b - a) * t;
// Zero slope at BOTH ends — which is what stops an animation arriving with
// residual velocity and appearing to snap.
const smoothstep = t => t * t * (3 - 2 * t);
const rand = (lo, hi) => lo + Math.random() * (hi - lo);
const randInt = (lo, hi) => Math.floor(rand(lo, hi + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

// Frame-rate independent exponential approach: the fraction to move this frame
// so `rate` is a per-second constant whatever the fps.
const approach = (rate, dt) => 1 - Math.exp(-rate * dt);

const hexToRgb = h => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgbToCss = c => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
// Same, with an opacity — the colour spots fade out through their own hue
// rather than toward another one.
const rgbaCss = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

/* ==========================  simplex noise 3D  ===========================
 * Inlined rather than pulled in as a dependency — it's ~60 lines and this page
 * is meant to run by opening the file. Classic Gustavson/Perlin simplex.
 * Seeded permutation, so the motion is identical every reload.
 */
function makeNoise3D(seed) {
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  // Deterministic shuffle (mulberry32), so no Math.random in the render path.
  let a = seed >>> 0;
  const rnd = () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const tmp = p[i]; p[i] = p[j]; p[j] = tmp;
  }
  const perm = new Uint8Array(512);
  const permMod12 = new Uint8Array(512);
  for (let i = 0; i < 512; i++) {
    perm[i] = p[i & 255];
    permMod12[i] = perm[i] % 12;
  }

  const GRAD = [
    [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
    [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
    [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1],
  ];
  const F3 = 1 / 3, G3 = 1 / 6;

  return function noise3(xin, yin, zin) {
    const s = (xin + yin + zin) * F3;
    const i = Math.floor(xin + s), j = Math.floor(yin + s), k = Math.floor(zin + s);
    const t = (i + j + k) * G3;
    const x0 = xin - (i - t), y0 = yin - (j - t), z0 = zin - (k - t);

    let i1, j1, k1, i2, j2, k2;
    if (x0 >= y0) {
      if (y0 >= z0)      { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
      else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; }
      else               { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
    } else {
      if (y0 < z0)       { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; }
      else if (x0 < z0)  { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; }
      else               { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
    }

    const x1 = x0 - i1 + G3, y1 = y0 - j1 + G3, z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2 * G3, y2 = y0 - j2 + 2 * G3, z2 = z0 - k2 + 2 * G3;
    const x3 = x0 - 1 + 3 * G3, y3 = y0 - 1 + 3 * G3, z3 = z0 - 1 + 3 * G3;

    const ii = i & 255, jj = j & 255, kk = k & 255;
    let n = 0;

    const corner = (gi, x, y, z) => {
      let t2 = 0.6 - x * x - y * y - z * z;
      if (t2 < 0) return 0;
      t2 *= t2;
      const g = GRAD[gi];
      return t2 * t2 * (g[0] * x + g[1] * y + g[2] * z);
    };

    n += corner(permMod12[ii + perm[jj + perm[kk]]], x0, y0, z0);
    n += corner(permMod12[ii + i1 + perm[jj + j1 + perm[kk + k1]]], x1, y1, z1);
    n += corner(permMod12[ii + i2 + perm[jj + j2 + perm[kk + k2]]], x2, y2, z2);
    n += corner(permMod12[ii + 1 + perm[jj + 1 + perm[kk + 1]]], x3, y3, z3);

    return 32 * n; // ~[-1, 1]
  };
}

/* ===========================  the hero  ================================== */

function createPicselHero(root) {
  /* root is the tall section; the stage is the one-screen box sticking to the
     top of the viewport inside it. Everything is drawn into the stage, and the
     gap between their two heights is the distance the scrub runs over. */
  const stage = root.querySelector('.hero__stage') || root;
  const wordmarkEl = root.querySelector('#wordmark');
  const taglineEl = root.querySelector('#tagline');

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isSmall = window.matchMedia('(max-width: 640px), (pointer: coarse)').matches;

  // Fixed seed: the drift and morph are then identical on every reload, which
  // makes "is that a bug or just the noise?" answerable.
  const noise = makeNoise3D(0xC5E1);

  let vw = 0, vh = 0, minDim = 0;
  // Recomputed on resize, so rotating a phone or dragging a window across the
  // breakpoint re-lays-out rather than needing a reload.
  let stacked = false;
  let raf = null, last = null, elapsed = 0;
  let destroyed = false;

  /* ---- the scroll scrub -------------------------------------------------
     scrubRange is the pinned distance in pixels, measured on resize; exit is
     where we currently are along it, 0 (hero at rest) to 1 (fully un-built).
     Reduced motion disables the whole mechanism: exit stays 0 and the hero
     simply scrolls away like any other section. */
  let scrubRange = 0;
  let heroTop = 0;
  let exit = 0;
  const scrubOn = SCROLL.ENABLED && !reduced;

  /* ---- blobs ------------------------------------------------------------ */

  const count = isSmall ? BLOBS.COUNT_SMALL : BLOBS.COUNT;
  const pointCount = isSmall ? BLOBS.POINTS_SMALL : BLOBS.POINTS;

  /* The four surfaces the blobs are built from, all of them CELL times smaller
     than the stage. Three are working surfaces the visitor never sees:

       shape   the lobes, filled flat white, hard-edged and overlapping
       mask    that same picture blurred — the goo. Blurring the lobes as ONE
               image is what lets neighbours bleed into each other and bridge;
               blurring them separately and stacking the results would not
       field   the mesh gradient: a flat backing plus the drifting colour spots
       colour  the field, blurred, which is what melts the spots into each other

     and the last, blobCanvas, is what ends up on the page: for every cell,
     the colour from `colour` wherever `mask` is solid enough to count as inside
     the blob, and nothing anywhere else. The browser scales it up with
     image-rendering: pixelated in hero.css, so one pixel here is one block of
     one flat colour on screen.

     Deliberately NOT scaled by device pixel ratio, unlike the dot-grid canvas.
     A retina screen drawing the blobs at twice the resolution is the one thing
     this must not do — a block is meant to be a block. */
  const blobCanvas = root.querySelector('#blobs');
  const blobCtx = blobCanvas.getContext('2d');
  const shapeCanvas = document.createElement('canvas');
  const shapeCtx = shapeCanvas.getContext('2d');
  const fieldCanvas = document.createElement('canvas');
  const fieldCtx = fieldCanvas.getContext('2d');
  /* willReadFrequently: these two are read back pixel by pixel on every frame.
     The flag tells the browser to keep them in ordinary memory rather than on
     the graphics card, where reading back means stalling until the card
     catches up. */
  const maskCanvas = document.createElement('canvas');
  const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
  const colourCanvas = document.createElement('canvas');
  const colourCtx = colourCanvas.getContext('2d', { willReadFrequently: true });

  /* Grid size in cells, and the per-cell buffers. All allocated once in
     resize() and reused every frame — a 180x100 grid is 72KB of pixel data per
     buffer, and allocating that sixty times a second would keep the garbage
     collector permanently busy for no reason. */
  let cols = 0, rows = 0;
  let outImage = null;
  // The patch of grid the blobs occupy this frame, in cells. Set by drawBlobs,
  // read by compositeBlobs.
  let boxMinX = 0, boxMinY = 0, boxMaxX = -1, boxMaxY = -1;
  /* Per-cell chromatic offset, in cells, packed as one signed byte each. Only
     depends on where a cell sits in the frame, so it is computed on resize and
     never touched again — the alternative is a square root per cell per frame
     to answer a question whose answer never changes. */
  let chromaDX = null, chromaDY = null;

  /* Each blob is a CLUSTER OF LOBES with a COLOUR FIELD behind it — the same
   * two-part construction as before, now described as plain numbers rather than
   * as SVG elements. Nothing here draws anything; drawBlobs() reads these every
   * frame and paints them onto the grid.
   *
   * The split is what lets the edge be hard while the colour is soft. The lobes
   * define the silhouette only, in flat white; the colour is a separate field
   * of overlapping spots that is blurred as heavily as it likes, because the
   * silhouette is decided by the mask and not by the colour.
   *
   * It also gets the mesh gradient moving with the blob for free: the spots
   * orbit the cluster centre, so as the lobes swing and pulse the colours
   * travel and re-blend with them. A single fixed gradient, which is what this
   * replaced long ago, just slid over a shape moving underneath it.
   */
  const blobs = [];
  for (let i = 0; i < count; i++) {
    const family = BLOB_GRADIENTS[i % BLOB_GRADIENTS.length];
    const startStops = family[0];

    const lobeCount = randInt(...BLOBS.LOBES);
    const base = Math.random() * Math.PI * 2;
    const lobes = [];
    for (let l = 0; l < lobeCount; l++) {
      const radius = BLOBS.LOBE_RADIUS + rand(-1, 1) * BLOBS.LOBE_RADIUS_VARIANCE;
      lobes.push({
        radius,
        // Spread evenly around the cluster, then jittered, so lobes don't stack
        // up on one side and leave the blob lopsided. `base` tilts the whole
        // ring, which is what makes some clusters read vertical and some
        // diagonal rather than all sitting the same way up.
        angle: base + (l / lobeCount) * Math.PI * 2 + rand(-0.35, 0.35),
        // EVERY lobe rings the centre — none sits in the middle. A centre lobe
        // fills the gap the outer ones are supposed to pinch away from, and the
        // cluster fuses into one round mass with no necks at all, which is
        // exactly what separates a metaball blob from a circle.
        //
        // Proportional to this lobe's own radius, so a large roll can't swallow
        // its neighbours — see LOBE_SPREAD_RATIO.
        spread: radius * BLOBS.LOBE_SPREAD_RATIO * rand(0.88, 1.1),
        orbit: rand(0.6, 1.4) * (Math.random() < 0.5 ? -1 : 1),
        seed: i * 31.7 + l * 11.3,
        // Separate phases so the three morph channels drift in and out of sync
        // instead of pulsing together.
        pulseR: Math.random() * 100,
        pulseS: Math.random() * 100,
        pulseRate: rand(0.75, 1.35),
      });
    }

    // The mesh itself: colour spots orbiting the cluster, each taking one
    // colour from the palette so every hue in the gradient actually appears on
    // the blob. Spots are their own thing, NOT one per lobe — tying them to
    // lobes caps the mesh at two or three colours and pins them to the lobe
    // centres, so the blob reads as one flat colour with a hotspot.
    const spots = [];
    for (let sIdx = 0; sIdx < BLOBS.MESH_SPOTS; sIdx++) {
      spots.push({
        colorIndex: sIdx % startStops.length,
        angle: (sIdx / BLOBS.MESH_SPOTS) * Math.PI * 2 + rand(-0.5, 0.5),
        // Staggered radii, so the spots don't all sit on one ring and leave the
        // centre a flat disc of the backing colour.
        dist: BLOBS.MESH_SPREAD * rand(0.25, 1),
        swirl: rand(0.55, 1.5) * (Math.random() < 0.5 ? -1 : 1),
        size: BLOBS.MESH_SPOT * rand(0.75, 1.25),
      });
    }

    blobs.push({
      lobes, spots, family,
      rgb: startStops.map(hexToRgb),
      target: startStops.map(hexToRgb),
      nextColorAt: rand(...BLOBS.COLOR_HOLD),
      // Each blob gets its own slice of the noise field and its own lissajous
      // figure, so they never move in sympathy.
      seed: i * 137.5,
      fx: 0.6 + Math.random() * 0.9,
      fy: 0.6 + Math.random() * 0.9,
      px: Math.random() * Math.PI * 2,
      py: Math.random() * Math.PI * 2,
      home: BLOBS.HOMES[i % BLOBS.HOMES.length],
      lean: [0, 0],
    });
  }

  /* Closed Catmull-Rom through the sampled points, traced straight into a
   * canvas path as cubic beziers. A polyline would show facets on a shape this
   * large, and they survive the blur.
   *
   * Traced rather than built as a path string: the string version this replaced
   * had to format sixty-four points to two decimal places per lobe per frame,
   * only for the browser to parse the numbers straight back out again. */
  function traceBlobPath(ctx, points) {
    const n = points.length;
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 0; i < n; i++) {
      const p0 = points[(i - 1 + n) % n];
      const p1 = points[i];
      const p2 = points[(i + 1) % n];
      const p3 = points[(i + 2) % n];
      ctx.bezierCurveTo(
        p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6,
        p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6,
        p2[0], p2[1],
      );
    }
    ctx.closePath();
  }

  /* ---- pointer ---------------------------------------------------------- */

  const pointer = { x: 0.5, y: 0.5, active: false };
  const mouseOn = MOUSE.ENABLED && !isSmall;

  function onPointerMove(e) {
    pointer.x = e.clientX / vw;
    pointer.y = e.clientY / vh;
    pointer.active = true;
  }
  function onPointerLeave() { pointer.active = false; }

  if (mouseOn) {
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('pointerleave', onPointerLeave);
  }

  /* ---- dot grid ---------------------------------------------------------
   * Grid positions are built once per resize and only the radius and alpha are
   * recomputed per frame — at ~16px spacing a 1920x1080 viewport is over 8000
   * dots, so anything per-dot that can be hoisted out of the loop must be.
   *
   * Dots are batched into a few alpha buckets and each bucket drawn as ONE
   * path. Setting fillStyle per dot would mean thousands of style changes and
   * as many string allocations every frame; this way it's a handful.
   */
  const dotCanvas = root.querySelector('#dotgrid');
  const dotCtx = dotCanvas ? dotCanvas.getContext('2d') : null;
  const dotsOn = DOTGRID.ENABLED && !!dotCtx;
  // One bucket per shade — the quantisation and the draw batching are the same
  // thing, so each level is a single path with a single fillStyle.
  const DOT_BUCKETS = Math.max(2, DOTGRID.LEVELS | 0);

  if (dotsOn && DOTGRID.LAYER === 'overlay') dotCanvas.classList.add('is-overlay');

  let dotXs = new Float32Array(0);
  let dotYs = new Float32Array(0);
  let dotDpr = 1;
  let dotFrame = 0;
  // Pre-built fill styles, one per bucket — computed on resize, not per frame.
  let dotFills = [];

  function buildDotGrid() {
    if (!dotsOn) return;

    const spacing = isSmall ? DOTGRID.SPACING_SMALL : DOTGRID.SPACING;
    dotDpr = Math.min(window.devicePixelRatio || 1, DOTGRID.MAX_DPR);
    dotCanvas.width = Math.max(1, Math.round(vw * dotDpr));
    dotCanvas.height = Math.max(1, Math.round(vh * dotDpr));

    const cols = Math.ceil(vw / spacing) + 1;
    const rows = Math.ceil(vh / spacing) + 1;
    dotXs = new Float32Array(cols * rows);
    dotYs = new Float32Array(cols * rows);

    let i = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        dotXs[i] = c * spacing;
        dotYs[i] = r * spacing;
        i++;
      }
    }

    const [tr, tg, tb] = DOTGRID.TINT;
    dotFills = [];
    for (let b = 0; b < DOT_BUCKETS; b++) {
      // Evenly spaced shades from faintest to MAX_ALPHA. A dot is always
      // exactly one of these — never between two.
      const a = DOTGRID.MAX_ALPHA * ((b + 1) / DOT_BUCKETS);
      dotFills.push(`rgba(${tr},${tg},${tb},${a.toFixed(4)})`);
    }
  }

  function drawDots(time) {
    if (!dotsOn) return;
    // Background texture — updating on alternate frames is imperceptible and
    // halves the cost.
    if (DOTGRID.UPDATE_EVERY > 1 && dotFrame++ % DOTGRID.UPDATE_EVERY !== 0) return;

    const ctx = dotCtx;
    ctx.setTransform(dotDpr, 0, 0, dotDpr, 0, 0);
    ctx.clearRect(0, 0, vw, vh);

    // Reduced motion: a static texture rather than no texture.
    const t = reduced ? 0 : time;
    const z = t * DOTGRID.FLOW_SPEED;
    const drift = t * DOTGRID.DRIFT;
    const ns = DOTGRID.NOISE_SCALE;

    const glow = DOTGRID.CURSOR_GLOW && mouseOn && pointer.active && !reduced;
    const gx = pointer.x * vw, gy = pointer.y * vh;
    const gr = DOTGRID.CURSOR_RADIUS * minDim;

    // One path per alpha bucket.
    for (let b = 0; b < DOT_BUCKETS; b++) {
      ctx.fillStyle = dotFills[b];
      ctx.beginPath();
      let drew = false;

      for (let i = 0; i < dotXs.length; i++) {
        const x = dotXs[i], y = dotYs[i];
        // Noise in [-1,1] -> [0,1], then a contrast curve so big dots stay
        // sparse and clustered instead of evenly stippled.
        let n = (noise((x + drift) * ns, y * ns, z) + 1) * 0.5;
        n = Math.pow(n < 0 ? 0 : n > 1 ? 1 : n, DOTGRID.CONTRAST);

        let level = n;
        if (glow) {
          const d = Math.hypot(x - gx, y - gy) / gr;
          level *= 1 + (DOTGRID.CURSOR_GAIN - 1) * Math.exp(-d * d);
        }
        if (level > 1) level = 1;

        // QUANTISE. The dot snaps to one of LEVELS shades — it never sits
        // between two, which is what produces the flicker as the field drifts
        // across a threshold.
        const step = Math.min(DOT_BUCKETS - 1, (level * DOT_BUCKETS) | 0);
        const bucket = DOTGRID.ALPHA_MOD ? step : DOT_BUCKETS - 1;
        if (bucket !== b) continue;

        // Size follows the same quantised step, so it steps rather than eases.
        const q = step / (DOT_BUCKETS - 1);
        const radius = DOTGRID.MAX_RADIUS * (1 - DOTGRID.SIZE_STEP + DOTGRID.SIZE_STEP * q);
        if (radius < 0.12) continue; // below this it's a sub-pixel smudge

        ctx.moveTo(x + radius, y);
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        drew = true;
      }

      if (drew) ctx.fill();
    }
  }

  /* ---- resize ----------------------------------------------------------- */

  function resize() {
    /* Measured off the stage, not the window. The stage is 100svh — the height
       of the screen WITH a phone's address bar showing — while
       window.innerHeight is the height without it. Sizing the canvas to the
       window would then stretch the drawing slightly taller than the box it is
       drawn in, and the dot grid would sit visibly off-square on a phone. */
    vw = stage.clientWidth;
    vh = stage.clientHeight;
    minDim = Math.min(vw, vh);

    resizeGrid();

    /* The pinned distance: how much taller the section is than the stage. That
       is exactly how far the page scrolls while the stage is held on screen,
       and therefore the length of the reverse intro. Under reduced motion
       hero.css sets it to zero and the guard below leaves the hero alone. */
    scrubRange = root.offsetHeight - stage.offsetHeight;
    heroTop = root.offsetTop;
    stacked = vw <= BLOBS.STACK_BELOW;

    buildDotGrid();
  }

  /* Lays out the pixel grid for the current stage size: how many cells fit,
     how big the buffers need to be, and where the chromatic fringe falls. */
  function resizeGrid() {
    const cell = PIXEL.CELL;
    // Rounded UP, so the grid always covers the stage rather than leaving a
    // sliver of bare background down one edge.
    cols = Math.max(1, Math.ceil(vw / cell));
    rows = Math.max(1, Math.ceil(vh / cell));

    for (const c of [blobCanvas, shapeCanvas, fieldCanvas, maskCanvas, colourCanvas]) {
      c.width = cols;
      c.height = rows;
    }

    /* The visible canvas is stretched back to EXACTLY cols x rows whole cells,
       not to the stage width. Stretching it to the stage instead would scale
       cols cells into a slightly narrower box and every block would come out
       7.94 pixels wide — a grid that no longer lines up with anything and
       whose blocks land on fractional pixels. The overhang is under one cell
       and the stage clips it. */
    blobCanvas.style.width = `${cols * cell}px`;
    blobCanvas.style.height = `${rows * cell}px`;

    const cellCount = cols * rows;
    outImage = blobCtx.createImageData(cols, rows);
    chromaDX = new Int8Array(cellCount);
    chromaDY = new Int8Array(cellCount);

    if (!CHROMA.BLOBS) return;

    /* Radial from the centre of the frame, strongest in the corners, rounded
       to whole cells — see CHROMA. Computed once here rather than per frame. */
    const midX = (cols - 1) / 2, midY = (rows - 1) / 2;
    const maxLen = Math.hypot(midX, midY) || 1;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const ox = x - midX, oy = y - midY;
        const len = Math.hypot(ox, oy) || 1;
        const amount = CHROMA.MIN +
          (CHROMA.MAX_CELLS - CHROMA.MIN) * Math.pow(clamp(len / maxLen, 0, 1), CHROMA.FALLOFF);
        const idx = y * cols + x;
        chromaDX[idx] = Math.round((ox / len) * amount);
        chromaDY[idx] = Math.round((oy / len) * amount);
      }
    }
  }
  window.addEventListener('resize', resize);
  resize();

  /* ---- reverse-on-scroll ------------------------------------------------ */

  /* Where the page is along the pinned distance, 0 to 1. Read from
     window.scrollY rather than from the element's position on screen: scrollY
     is a number the browser already has, while asking an element where it is
     forces a fresh layout calculation — sixty times a second, mid-scroll, on
     the one thread that also has to move the page. */
  function readScroll() {
    if (!scrubOn || scrubRange <= 0) return 0;
    return clamp((window.scrollY - heroTop) / scrubRange, 0, 1);
  }

  /* The exit, expressed as a position on the ENTRANCE's own progress line, so
     the two share one piece of drawing code and cannot drift apart in style:
     1 is home, 0 is off-screen where the blob started. Reversing the entrance
     is then literally running its own numbers backwards.
     Returns 1 (home, no effect) whenever the scrub is off.

     Two adjustments make it read correctly:

     - The stagger is REVERSED. The blob that arrived first leaves last, so the
       hero un-builds in the opposite order it was built, the way a reversed
       film runs rather than the way a second identical sequence would.

     - The entrance's ease-out is UNDONE before the scroll drives it. Ease-out
       spends most of its movement in the first fraction of its progress; drive
       it straight from scroll and the blob would sit almost still for half the
       scrub, then bolt off screen at the end. Undoing it puts the scroll in
       charge of the blob's actual position on screen rather than of a curve,
       which is what EXIT_CURVE can then shape deliberately. The smoothstep
       gives the two ends their soft start and stop. */
  function exitProgress(i) {
    if (!scrubOn || exit <= 0) return 1;

    const offset = (count - 1 - i) * SCROLL.EXIT_STAGGER;
    // Guard: enough blobs and a big enough stagger would otherwise leave the
    // last one with no scroll distance left to travel over.
    const span = Math.max(0.25, 1 - (count - 1) * SCROLL.EXIT_STAGGER);
    const s = clamp((exit - offset) / span, 0, 1);

    const travel = 1 - Math.pow(smoothstep(s), SCROLL.EXIT_CURVE);
    return 1 - Math.pow(1 - travel, 1 / BLOB_INTRO.EASE);
  }

  /* One number, published to CSS, that the wordmark and the scroll cue style
     themselves from. Keeping their movement in CSS rather than setting styles
     per element from here means the browser can do it off the main thread, and
     it is one write per frame instead of one per element. */
  function publishExit() {
    document.documentElement.style.setProperty('--hero-exit', exit.toFixed(4));
  }

  /* The loop is stopped once the hero is fully off screen. A hero nobody can
     see, still drawing blobs sixty times a second, is pure battery cost — and
     on a long page that is most of the visit. Scrolling back up restarts it. */
  function heroOnScreen() {
    if (!scrubOn) return true;
    const past = window.scrollY - (heroTop + root.offsetHeight);
    return past < window.innerHeight * SCROLL.PAUSE_SLACK;
  }

  function onScroll() {
    if (destroyed || !scrubOn) return;
    // Restarted from the scroll event rather than from a permanently running
    // frame — the whole point is that nothing runs while the hero is away.
    if (raf === null && heroOnScreen()) start();
  }

  if (scrubOn) window.addEventListener('scroll', onScroll, { passive: true });

  /* ---- blob frame ------------------------------------------------------- */

  const pts = [];
  // Reused across frames and lobes — allocating per frame would churn the GC at
  // 60fps for no reason.
  const bulge = new Float64Array(Math.max(BLOBS.POINTS, BLOBS.POINTS_SMALL));

  // Eased strength of the magnetic pull, and where it's pulling toward. Eased
  // rather than read raw so the effect swells in and relaxes out when the
  // pointer enters or leaves the window instead of popping.
  let magnetAmt = 0;
  let pointerPx = 0, pointerPy = 0;

  /* When the blobs may start arriving, on the animation clock. Null = not yet,
   * and they hold off-screen.
   *
   * Set from the text intro's completion rather than a fixed delay, so the two
   * sequences can't drift apart: the text runs on setTimeout (wall clock) and
   * the blobs on elapsed animation time, and those diverge whenever frames are
   * dropped or the tab is backgrounded. Handing the baton over at the moment
   * the text finishes keeps the order guaranteed either way. */
  let blobIntroAt = BLOB_INTRO.AFTER_TEXT ? null : 0;

  function drawBlobs(time, dt) {
    // Reduced motion: hold the shapes still rather than removing them.
    const t = reduced ? 0 : time;

    const cell = PIXEL.CELL;

    /* Both source surfaces are cleared, then set to draw in STAGE pixels: the
       transform divides every coordinate by the cell size on its way in, so all
       the geometry below can go on thinking in ordinary screen pixels and lands
       on the grid automatically.

       Blur radii are the exception — a canvas filter works in the surface's own
       pixels and ignores the transform, so those are divided by hand. */
    shapeCtx.setTransform(1, 0, 0, 1, 0, 0);
    shapeCtx.clearRect(0, 0, cols, rows);
    shapeCtx.setTransform(1 / cell, 0, 0, 1 / cell, 0, 0);
    shapeCtx.fillStyle = '#fff';

    fieldCtx.setTransform(1, 0, 0, 1, 0, 0);
    fieldCtx.clearRect(0, 0, cols, rows);
    fieldCtx.setTransform(1 / cell, 0, 0, 1 / cell, 0, 0);

    /* The patch of grid the blobs actually occupy this frame, grown as each one
       is placed. The compositing pass below reads and writes only inside it.
       Worth the bookkeeping: the blobs cover a fraction of a wide screen, and
       the alternative is reading back and re-deciding twenty thousand cells
       every frame to answer "still empty?" about most of them. */
    boxMinX = cols; boxMinY = rows; boxMaxX = -1; boxMaxY = -1;

    pointerPx = pointer.x * vw;
    pointerPy = pointer.y * vh;
    const wantMagnet = (mouseOn && pointer.active && !reduced)
      ? MOUSE.MAGNET * (MOUSE.ATTRACT ? 1 : -1)
      : 0;
    magnetAmt += (wantMagnet - magnetAmt) * approach(MOUSE.MAGNET_DAMP, dt);

    // Side by side on wide viewports, stacked above and below on narrow ones.
    const homes = stacked ? BLOBS.HOMES_STACKED : BLOBS.HOMES;

    for (let i = 0; i < blobs.length; i++) {
      const b = blobs[i];
      const home = homes[i % homes.length];
      // Which way the blob is offset from centre decides which edge it enters
      // from — so the stacked layout enters vertically without any extra flag.
      const alongY = stacked;
      const radiusScale = stacked
        ? BLOBS.RADIUS_STACKED / BLOBS.LOBE_RADIUS
        : 1;

      // Slow lissajous wander around the blob's home position.
      const dsp = reduced ? 0 : BLOBS.DRIFT_SPEED;
      const dx = Math.sin(t * dsp * b.fx + b.px) * BLOBS.DRIFT;
      const dy = Math.cos(t * dsp * b.fy + b.py) * BLOBS.DRIFT;

      let cx = (home[0] + dx) * vw;
      let cy = (home[1] + dy) * vh;

      // Pointer lean, eased. Falls off with distance so only nearby blobs
      // respond, and it's always a fraction of the viewport so it reads the
      // same at any size.
      let wantX = 0, wantY = 0;
      if (mouseOn && pointer.active && !reduced) {
        const pxr = pointer.x * vw, pyr = pointer.y * vh;
        const vx = pxr - cx, vy = pyr - cy;
        const dist = Math.hypot(vx, vy) / minDim;
        const pull = Math.exp(-dist / MOUSE.FALLOFF) * MOUSE.STRENGTH * minDim;
        const sign = MOUSE.ATTRACT ? 1 : -1;
        const len = Math.hypot(vx, vy) || 1;
        wantX = (vx / len) * pull * sign;
        wantY = (vy / len) * pull * sign;
      }
      const k = approach(MOUSE.DAMP, dt);
      b.lean[0] += (wantX - b.lean[0]) * k;
      b.lean[1] += (wantY - b.lean[1]) * k;
      cx += b.lean[0];
      cy += b.lean[1];

      // Entrance. Driven off the shared clock rather than a timer, so it is
      // frame-rate independent and cannot drift out of step with the rest.
      // blobIntroAt is set when the text intro finishes; until then it's null
      // and the blobs wait off-screen.
      let stretchX = 1, stretchY = 1;
      if (BLOB_INTRO.ENABLED && !reduced) {
        const since = blobIntroAt === null ? -1 : time - blobIntroAt;
        const pIn = clamp((since - i * BLOB_INTRO.DELAY) / BLOB_INTRO.DURATION, 0, 1);

        /* Whichever has this blob further from home wins. During the intro
           that is the intro; once scrolling starts it is the scrub. Taking the
           minimum rather than switching between them means a visitor who
           scrolls while the hero is still arriving gets one continuous
           movement instead of the blob jumping between two positions. */
        const p = Math.min(pIn, exitProgress(i));
        if (p < 1) {
          const e = 1 - Math.pow(1 - p, BLOB_INTRO.EASE);

          // Hold, then smoothstep to zero — see HOLD. Against raw p, not the
          // eased position.
          const u = clamp((p - BLOB_INTRO.HOLD) / (1 - BLOB_INTRO.HOLD), 0, 1);
          const amt = 1 - smoothstep(u);
          const stretch = 1 + (BLOB_INTRO.STRETCH_X - 1) * amt;

          // Enter along whichever axis the layout uses, and stretch along that
          // same axis — stacked blobs are pulled in from top and bottom, so the
          // elongation has to be vertical or it reads as squashing sideways
          // while travelling down.
          if (alongY) {
            const fromY = (home[1] < 0.5 ? -BLOB_INTRO.FROM : 1 + BLOB_INTRO.FROM) * vh;
            cy = lerp(fromY, cy, e);
            stretchY = stretch;
            stretchX = BLOB_INTRO.AREA_PRESERVE
              ? 1 / stretch
              : 1 - (1 - BLOB_INTRO.SQUASH_Y) * amt;
          } else {
            const fromX = (home[0] < 0.5 ? -BLOB_INTRO.FROM : 1 + BLOB_INTRO.FROM) * vw;
            cx = lerp(fromX, cx, e);
            stretchX = stretch;
            stretchY = BLOB_INTRO.AREA_PRESERVE
              ? 1 / stretch
              : 1 - (1 - BLOB_INTRO.SQUASH_Y) * amt;
          }
        }
      }

      // Each lobe: a circle, slowly orbiting the cluster centre, its outline
      // gently deformed by noise. The noise is sampled ON A CIRCLE in noise
      // space, so the first and last samples agree by construction and there's
      // no seam to hide.
      let extent = 0;
      for (const lobe of b.lobes) {
        const ang = lobe.angle + (reduced ? 0 : t * BLOBS.ORBIT_SPEED * lobe.orbit);

        // Two slow, independent breathing channels. The cluster opening and
        // closing (spread) is what takes the blob through genuinely different
        // silhouettes; the lobes swelling unevenly (radius) stops it settling
        // into a symmetrical shape.
        const pt = t * BLOBS.PULSE_SPEED * lobe.pulseRate;
        const pulseS = 1 + BLOBS.PULSE_SPREAD * noise(lobe.pulseS, 0, pt);
        const pulseR = 1 + BLOBS.PULSE_RADIUS * noise(lobe.pulseR, 7.3, pt);

        // radiusScale grows the blobs on stacked layouts, where there's more
        // room. Spread scales with it so the neck geometry is unchanged.
        const spread = lobe.spread * radiusScale * (reduced ? 1 : pulseS) * minDim;
        const lx = cx + Math.cos(ang) * spread;
        const ly = cy + Math.sin(ang) * spread;
        const R = lobe.radius * radiusScale * (reduced ? 1 : pulseR) * minDim;
        extent = Math.max(extent, spread + R);

        // How hard, and in which direction, the cursor works on THIS lobe.
        // Measured centre-to-cursor, so the whole lobe shares one influence and
        // one facing direction — that's what keeps the bulge a single clean
        // swell rather than a per-point ripple.
        let amp = 0, ux = 0, uy = 0;
        if (Math.abs(magnetAmt) > 0.001) {
          const tox = pointerPx - lx, toy = pointerPy - ly;
          const dc = Math.hypot(tox, toy) || 1;
          const dn = dc / (MOUSE.MAGNET_RANGE * minDim);
          amp = magnetAmt * R * Math.exp(-dn * dn);
          ux = tox / dc; uy = toy / dc;
        }

        const nz = t * BLOBS.MORPH_SPEED + lobe.seed;

        // Pass 1: the outward bulge at each point, and its mean.
        let meanBulge = 0;
        for (let s = 0; s < pointCount; s++) {
          const a = (s / pointCount) * Math.PI * 2;
          // How squarely this point's outward normal faces the cursor.
          const facing = Math.max(0, Math.cos(a) * ux + Math.sin(a) * uy);
          const amount = amp * Math.pow(facing, MOUSE.MAGNET_FOCUS);
          bulge[s] = amount;
          meanBulge += amount;
        }
        meanBulge = (meanBulge / pointCount) * MOUSE.MASS_PRESERVE;

        // Pass 2: place the points. Subtracting the mean is what conserves the
        // enclosed area — the side facing the cursor pushes out and the rest
        // eases in to pay for it, so the blob changes shape without changing
        // size. Without it the blob visibly inflates and deflates.
        pts.length = 0;
        for (let s = 0; s < pointCount; s++) {
          const a = (s / pointCount) * Math.PI * 2;
          const nx = Math.cos(a) * BLOBS.NOISE_SCALE;
          const ny = Math.sin(a) * BLOBS.NOISE_SCALE;
          const r = R * (1 + BLOBS.MORPH * noise(nx + lobe.seed, ny, nz))
                    + bulge[s] - meanBulge;
          // Stretch is applied to each point's offset from the CLUSTER centre,
          // not the lobe's — scaling each lobe about itself would fatten the
          // lobes without pulling them apart, and the cluster would just look
          // bigger rather than elongated.
          const dxp = (lx - cx) + Math.cos(a) * r;
          const dyp = (ly - cy) + Math.sin(a) * r;
          pts.push([cx + dxp * stretchX, cy + dyp * stretchY]);
        }

        /* Straight onto the silhouette surface, in flat white. Every lobe of
           every blob goes into this one picture, which is what lets the blur
           below bridge them into a single melted shape. */
        shapeCtx.beginPath();
        traceBlobPath(shapeCtx, pts);
        shapeCtx.fill();
      }

      // Colour breathing: drift toward a new palette gradient now and then.
      if (!reduced) {
        b.nextColorAt -= dt;
        if (b.nextColorAt <= 0) {
          // Within this blob's OWN family — see BLOB_GRADIENTS. Picking from
          // the whole palette is what let both blobs drift to the same purple.
          b.target = pick(b.family).map(hexToRgb);
          b.nextColorAt = rand(...BLOBS.COLOR_HOLD);
        }
        const ck = approach(BLOBS.COLOR_LERP, dt);
        for (let s = 0; s < b.rgb.length; s++) {
          const tgt = b.target[s % b.target.length];
          for (let c = 0; c < 3; c++) {
            b.rgb[s][c] = lerp(b.rgb[s][c], tgt[c], ck);
          }
        }
      }

      /* The colour field, painted flat here and blurred in one go afterwards.
         A backing square first, sized to the cluster plus the blur's reach, so
         that when the whole field is softened its own outer edge is nowhere
         near the silhouette — otherwise the blob fades toward black at its rim
         instead of ending on a hard edge. */
      const pad = extent * Math.max(1, stretchX) + BLOBS.MESH_BLUR * 3;
      fieldCtx.fillStyle = rgbToCss(b.rgb[1 % b.rgb.length]);
      fieldCtx.fillRect(cx - pad, cy - pad, pad * 2, pad * 2);

      /* This blob's footprint on the grid. One cell of margin covers the
         chromatic offset reading a neighbour just outside the box. */
      const bx0 = Math.floor((cx - pad) / cell) - 1;
      const by0 = Math.floor((cy - pad) / cell) - 1;
      const bx1 = Math.ceil((cx + pad) / cell) + 1;
      const by1 = Math.ceil((cy + pad) / cell) + 1;
      if (bx0 < boxMinX) boxMinX = bx0;
      if (by0 < boxMinY) boxMinY = by0;
      if (bx1 > boxMaxX) boxMaxX = bx1;
      if (by1 > boxMaxY) boxMaxY = by1;

      /* Then the spots. Anchored to the cluster centre and scaled by its
         extent, so the whole colour field travels, grows and shrinks WITH the
         blob — the thing a fixed gradient could never do. They ride the same
         stretch as the silhouette, or the colour would stay a neat circle
         inside an elongated shape. */
      for (const spot of b.spots) {
        const sa = spot.angle + (reduced ? 0 : t * BLOBS.MESH_SWIRL * spot.swirl);
        const sd = spot.dist * extent;
        const sx = cx + Math.cos(sa) * sd * stretchX;
        const sy = cy + Math.sin(sa) * sd * stretchY;
        const sr = Math.max(1, extent * spot.size);
        const rgb = b.rgb[spot.colorIndex];

        const grad = fieldCtx.createRadialGradient(sx, sy, 0, sx, sy, sr);
        /* A near-opaque plateau before the fade, and all three stops the same
           hue. With a straight solid-to-transparent ramp most of a spot is
           semi-transparent, so every colour mixes with every other one and the
           blob drifts to pastel; holding the core solid to 55% gives each hue a
           patch where it is undiluted and confines the blending to the rims.
           Fading toward another hue instead of toward transparent bands
           visibly once blurred. */
        grad.addColorStop(0, rgbaCss(rgb, 1));
        grad.addColorStop(0.55, rgbaCss(rgb, 0.92));
        grad.addColorStop(1, rgbaCss(rgb, 0));
        fieldCtx.fillStyle = grad;
        fieldCtx.beginPath();
        fieldCtx.arc(sx, sy, sr, 0, Math.PI * 2);
        fieldCtx.fill();
      }
    }

    compositeBlobs();
  }

  /* Turns the three working surfaces into the picture on the page.
   *
   * Blurring happens here, once per surface, on the whole image rather than
   * per shape. That matters for the silhouette: the lobes have to be blurred
   * TOGETHER for neighbours to bleed into one another and bridge into a single
   * melted outline. Blur them one at a time and each just gets its own soft
   * edge, and the necks between them never form. */
  function compositeBlobs() {
    const cell = PIXEL.CELL;

    // Whatever was on screen last frame goes, always — the blobs may have moved
    // out of the patch they were in, and a patch-sized write would leave the
    // old picture stranded outside it.
    blobCtx.clearRect(0, 0, cols, rows);

    // Everything off screen: nothing to composite, and no readback to pay for.
    // This is the state the whole hero sits in once the visitor has scrolled
    // past, and it is worth costing nothing.
    const x0 = Math.max(0, boxMinX), y0 = Math.max(0, boxMinY);
    const x1 = Math.min(cols - 1, boxMaxX), y1 = Math.min(rows - 1, boxMaxY);
    if (x1 < x0 || y1 < y0) return;
    const w = x1 - x0 + 1, h = y1 - y0 + 1;

    maskCtx.setTransform(1, 0, 0, 1, 0, 0);
    maskCtx.clearRect(0, 0, cols, rows);
    /* Blurred one patch at a time rather than the whole surface: the blur is
       the most expensive thing here and there is no point softening acres of
       empty grid. Safe to crop, because the patch is already the blob plus
       three times the wider of the two blur radii, so nothing outside it could
       have bled in. */
    maskCtx.filter = `blur(${(BLOBS.GOO_BLUR / cell).toFixed(2)}px)`;
    maskCtx.drawImage(shapeCanvas, x0, y0, w, h, x0, y0, w, h);
    maskCtx.filter = 'none';

    colourCtx.setTransform(1, 0, 0, 1, 0, 0);
    colourCtx.clearRect(0, 0, cols, rows);
    colourCtx.filter = `blur(${(BLOBS.MESH_BLUR / cell).toFixed(2)}px)`;
    colourCtx.drawImage(fieldCanvas, x0, y0, w, h, x0, y0, w, h);
    colourCtx.filter = 'none';

    /* Read back only the patch. Both buffers are indexed in PATCH coordinates
       from here on; outImage stays full-size so the write below can name the
       patch by its real position on the grid. */
    const mask = maskCtx.getImageData(x0, y0, w, h).data;
    const colour = colourCtx.getImageData(x0, y0, w, h).data;
    const out = outImage.data;
    const cut = PIXEL.ALPHA_CUT;

    for (let ly = 0; ly < h; ly++) {
      const gy = y0 + ly;
      for (let lx = 0; lx < w; lx++) {
        const lp = (ly * w + lx) * 4;
        const gp = (gy * cols + x0 + lx) * 4;

        /* The hard yes/no that makes this a pixel display rather than a
           pixelated photograph. A cell is either wholly inside the blob or
           wholly outside it — no half-lit cells along the edge, which is
           exactly what stops the edge shimmering as the shape moves. Nothing
           changes on screen until the shape crosses a whole cell boundary. */
        if (mask[lp + 3] < cut) {
          out[gp + 3] = 0;
          continue;
        }

        /* Chromatic aberration, in whole cells: the red channel is read from a
           cell one way, the blue from a cell the other way, green from where we
           actually are. In the flat middle of a blob the three neighbours are
           the same colour and nothing happens; only where the colour is
           changing — the rims — do the channels disagree and fringe. */
        const dx = chromaDX[gy * cols + x0 + lx], dy = chromaDY[gy * cols + x0 + lx];
        if (dx === 0 && dy === 0) {
          out[gp] = colour[lp];
          out[gp + 1] = colour[lp + 1];
          out[gp + 2] = colour[lp + 2];
        } else {
          // Clamped into the patch: a cell just outside it is transparent
          // anyway, since the patch is the blob plus its blur.
          const rx = clamp(lx + dx, 0, w - 1), ry = clamp(ly + dy, 0, h - 1);
          const bx = clamp(lx - dx, 0, w - 1), by = clamp(ly - dy, 0, h - 1);
          out[gp] = colour[(ry * w + rx) * 4];
          out[gp + 1] = colour[lp + 1];
          out[gp + 2] = colour[(by * w + bx) * 4 + 2];
        }
        out[gp + 3] = 255;
      }
    }

    // Only the patch is written; the rest of the canvas was cleared above.
    blobCtx.putImageData(outImage, 0, 0, x0, y0, w, h);
  }

  /* ---- wordmark + glitch ------------------------------------------------ */

  // One span per letter. Spaces become their own non-glitching spans so the
  // tagline keeps its word gaps.
  function splitLetters(el) {
    const text = el.textContent;
    el.textContent = '';
    const spans = [];
    for (const ch of text) {
      const span = document.createElement('span');
      span.textContent = ch;
      if (ch === ' ') span.style.width = '0.4em';
      el.appendChild(span);
      if (ch !== ' ') spans.push(span);
    }
    return spans;
  }

  // The tagline is always split — the intro reveals it letter by letter whether
  // or not it takes part in the ambient glitch.
  const wordSpans = splitLetters(wordmarkEl);
  const tagSpans = splitLetters(taglineEl);
  const glitchPool = GLITCH.GLITCH_TAGLINE ? wordSpans.concat(tagSpans) : wordSpans.slice();

  const introOn = INTRO.ENABLED && !reduced;
  if (introOn) {
    for (const span of wordSpans) span.classList.add('pending');
    for (const span of tagSpans) span.classList.add('pending');
  }

  let fonts = [];
  let glitchTimer = null;
  const introTimers = [];
  const later = (fn, ms) => introTimers.push(setTimeout(fn, ms));

  /* Keep only fonts the browser has actually loaded.
   *
   * This is the difference between a missing Adobe embed being invisible and
   * being ugly: an unloaded family silently renders as the fallback, so a
   * "glitch" to a font that isn't there just flashes the wrong typeface. */
  /* Is this family REALLY there?
   *
   * Not document.fonts.check() — it answers "would this render?", and for a
   * family the browser has never heard of the answer is yes, because it will
   * quietly substitute a fallback. It returns true for every Adobe font in the
   * rotation whether or not the embed has been pasted in, which is exactly the
   * case this needs to catch.
   *
   * So measure instead: draw a string in a generic family, then in
   * `"Family", generic`. If the family doesn't resolve, the browser falls back
   * to the same generic and the widths match exactly. Three generics, because a
   * pixel font could coincidentally share metrics with one of them. */
  const fontProbe = document.createElement('canvas').getContext('2d');
  function fontAvailable(family) {
    const sample = 'MMMWWWiiillPICSEL0123';
    return ['monospace', 'serif', 'sans-serif'].some(generic => {
      fontProbe.font = `72px ${generic}`;
      const base = fontProbe.measureText(sample).width;
      fontProbe.font = `72px "${family}", ${generic}`;
      return Math.abs(fontProbe.measureText(sample).width - base) > 0.5;
    });
  }

  function resolveFonts() {
    const available = FONTS.ROTATION.filter(fontAvailable);
    const missing = FONTS.ROTATION.filter(f => !available.includes(f));

    if (missing.length) {
      console.warn(
        `[picsel hero] Not loaded, dropped from the glitch rotation: ${missing.join(', ')}.\n` +
        `              Check the Adobe Fonts embed in tools/templates/page.js,\n` +
        `              then match FONTS.ROTATION to the family names Adobe lists\n` +
        `              (usually lowercase-hyphenated, e.g. "argent-pixel-cf").`
      );
    }

    // Resting font: the primary if it's really there, else the fallback stack.
    const primaryLoaded = available.includes(FONTS.PRIMARY);
    document.documentElement.style.setProperty(
      '--font-primary',
      primaryLoaded ? `'${FONTS.PRIMARY}'` : FONTS.FALLBACK
    );

    // Whatever the letters are actually sitting in. Swapping a letter to the
    // font it's already in is a no-op, so the resting font can't be in the
    // rotation.
    const resting = primaryLoaded
      ? FONTS.PRIMARY
      : available.find(f => FONTS.FALLBACK.includes(f)) || null;

    const rotation = available.filter(f => f !== resting);

    // Before the Adobe embed is pasted in, only Pixelify Sans resolves — and
    // it's also the resting font, so the rotation is empty and the glitch would
    // silently do nothing. Stand in generics so the effect is still visible and
    // tunable today. They drop out on their own the moment two or more real
    // pixel fonts resolve.
    if (rotation.length === 0) {
      console.warn(
        `[picsel hero] Only one pixel font resolved (${resting || 'none'}), so the glitch is\n` +
        `              running against generic stand-ins. Paste the Adobe embed to get the\n` +
        `              real rotation — these disappear automatically once 2+ real fonts load.`
      );
      return FONTS.STANDIN.filter(fontAvailable);
    }

    return rotation;
  }

  function flash(span, ms) {
    if (!fonts.length) return;
    span.style.fontFamily = `'${pick(fonts)}'`;
    if (!reduced) {
      if (GLITCH.RGB_SPLIT) span.classList.add('glitching');
      if (GLITCH.JITTER) {
        span.style.transform = `translateX(${rand(-GLITCH.JITTER, GLITCH.JITTER).toFixed(2)}px)`;
      }
    }
    setTimeout(() => {
      if (destroyed) return;
      span.style.fontFamily = '';
      span.style.transform = '';
      span.classList.remove('glitching');
    }, ms);
  }

  function glitchOnce() {
    if (destroyed || !fonts.length) return;

    /* Scrolled past: the wordmark has faded out, so a glitch would be a font
       swap nobody can see. Skipped rather than stopped — the timer keeps
       ticking so the effect is simply there again on the way back up, with no
       restart logic to get wrong. */
    if (exit >= 1) {
      glitchTimer = setTimeout(glitchOnce, rand(...(reduced ? GLITCH.REDUCED_RATE : GLITCH.RATE)) * 1000);
      return;
    }

    if (!reduced && Math.random() < GLITCH.CASCADE_CHANCE) {
      // Occasional run across the whole word.
      wordSpans.forEach((span, i) => {
        setTimeout(() => {
          if (!destroyed) flash(span, rand(...GLITCH.FLASH));
        }, i * GLITCH.CASCADE_STEP);
      });
    } else {
      const n = randInt(...GLITCH.LETTERS_AT_ONCE);
      const pool = glitchPool.slice();
      for (let i = 0; i < n && pool.length; i++) {
        const span = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
        flash(span, rand(...GLITCH.FLASH));
      }
    }

    const range = reduced ? GLITCH.REDUCED_RATE : GLITCH.RATE;
    glitchTimer = setTimeout(glitchOnce, rand(...range) * 1000);
  }

  /* Ask for every candidate BEFORE measuring, then wait.
   *
   * A font declared via @font-face is only fetched when something on the page
   * actually uses it. Nothing uses the glitch fonts until the glitch fires, and
   * nothing uses the resting face until --font-primary is set — so at startup
   * they all measure as unavailable and get dropped, including the primary.
   * That's a chicken-and-egg: not loaded because unused, unused because
   * detected as not loaded. The symptom is a valid Adobe embed where every font
   * is present in document.fonts and the wordmark still sits on the fallback.
   *
   * document.fonts.load() forces the fetch; it resolves with an empty list for
   * families that genuinely don't exist, so bogus names still fail safely.
   */
  function revealAll() {
    for (const span of wordSpans) span.classList.remove('pending');
    for (const span of tagSpans) span.classList.remove('pending');
  }

  // Hands the baton from the text intro to the blobs, then starts the ambient
  // glitch. Called once, whether or not the intro ran.
  function textIntroDone() {
    if (destroyed) return;
    if (blobIntroAt === null) blobIntroAt = elapsed + BLOB_INTRO.EXTRA_DELAY;
    if (!fonts.length) return;
    const range = reduced ? GLITCH.REDUCED_RATE : GLITCH.RATE;
    glitchTimer = setTimeout(glitchOnce, rand(...range) * 1000);
  }

  /* Build-in: wordmark in random order, tagline in reading order. */
  function runIntro(done) {
    let at = INTRO.START_DELAY;

    // Fisher-Yates on a copy — the DOM order is left to right, and shuffling
    // is the whole point of this half.
    const shuffled = wordSpans.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    for (const span of shuffled) {
      const when = at;
      later(() => {
        span.classList.remove('pending');
        if (fonts.length) flash(span, rand(...INTRO.FLASH));
      }, when);
      at += rand(...INTRO.LETTER_STEP);
    }

    at += INTRO.GAP;
    for (const span of tagSpans) {           // DOM order = reading order
      const when = at;
      later(() => {
        span.classList.remove('pending');
        if (INTRO.TAG_GLITCH && fonts.length) flash(span, rand(...INTRO.FLASH));
      }, when);
      at += INTRO.TAG_STEP;
    }

    later(done, at + INTRO.SETTLE);
  }

  const wanted = [...new Set([FONTS.PRIMARY, ...FONTS.ROTATION])];

  // Safety net: if font loading never settles (offline, blocked CDN), the
  // letters would sit at opacity 0 forever. Reveal regardless after 3s.
  // ...and it must release the blobs too, or they'd wait off-screen forever.
  const failsafe = setTimeout(() => {
    if (destroyed) return;
    revealAll();
    if (blobIntroAt === null) blobIntroAt = elapsed;
  }, 3000);
  introTimers.push(failsafe);

  Promise.all(wanted.map(f => document.fonts.load(`24px "${f}"`).catch(() => {})))
    .then(() => document.fonts.ready)
    .then(() => {
      if (destroyed) return;
      clearTimeout(failsafe);
      fonts = resolveFonts();
      if (!fonts.length) {
        console.warn('[picsel hero] Only one pixel font resolved — ambient glitch disabled.');
      }
      // The intro still runs without fonts: it reveals the letters, just
      // without the swap. Skipping it would leave the wordmark invisible.
      if (introOn) runIntro(textIntroDone);
      else { revealAll(); textIntroDone(); }
    });

  /* ---- the loop --------------------------------------------------------- */

  function frame(now) {
    if (last === null) last = now;
    // Clamped so a backgrounded tab doesn't teleport the animation on return.
    const dt = clamp((now - last) / 1000, 0, 0.1);
    last = now;
    elapsed += dt;

    /* Read the scroll first, draw second — one read and one write per frame,
       in that order, so nothing forces the browser to recalculate layout it
       has already done. */
    if (scrubOn) {
      const next = readScroll();
      if (next !== exit) {
        exit = next;
        publishExit();
      }
    }

    // Same clock as the blobs, so the whole hero breathes together.
    drawDots(elapsed);
    drawBlobs(elapsed, dt);

    if (!heroOnScreen()) {
      stop();
      return;
    }
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (destroyed || raf !== null) return;
    // Cleared so the first frame back measures no elapsed time. Without it the
    // gap since the last frame — possibly minutes — arrives as one enormous
    // step and the blobs teleport.
    last = null;
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    if (raf !== null) cancelAnimationFrame(raf);
    raf = null;
    last = null;
  }

  start();

  /* ---- teardown --------------------------------------------------------- */

  return {
    destroy() {
      destroyed = true;
      stop();
      if (glitchTimer !== null) clearTimeout(glitchTimer);
      introTimers.forEach(clearTimeout);
      window.removeEventListener('resize', resize);
      if (scrubOn) window.removeEventListener('scroll', onScroll);
      if (mouseOn) {
        window.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerleave', onPointerLeave);
      }
    },
  };
}

/* ===========================  bootstrap  ================================= */

const heroRoot = document.getElementById('hero');
if (heroRoot) window.picselHero = createPicselHero(heroRoot);

/* ===========================================================================
 * WRAPPING THIS AS A REACT COMPONENT
 * ---------------------------------------------------------------------------
 * createPicselHero(root) owns no globals and returns a destroy(), so it maps
 * onto an effect directly. Move the markup from hero.html into JSX, keep
 * hero.css as-is, delete the bootstrap block above, and:
 *
 *   import { useEffect, useRef } from 'react'
 *   import { createPicselHero } from './hero'
 *   import './hero.css'
 *
 *   export default function PicselHero() {
 *     const ref = useRef(null)
 *     useEffect(() => {
 *       const hero = createPicselHero(ref.current)
 *       return () => hero.destroy()      // StrictMode double-mounts; destroy()
 *     }, [])                             // makes that harmless
 *     return (
 *       <section className="hero" ref={ref}>
 *         ...the same markup, className instead of class...
 *       </section>
 *     )
 *   }
 *
 * Two things to carry over that aren't in the JSX: the Adobe Fonts <link> and
 * the Google Fonts <link> belong in index.html's <head> (or via your head
 * manager) — they are document-level, not component-level. And splitLetters
 * mutates textContent, so let this own the letters rather than rendering the
 * spans in JSX, or React and the glitch will fight over the same nodes.
 * ======================================================================== */
