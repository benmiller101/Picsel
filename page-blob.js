/* ===========================================================================
 * PICSEL — the page-head blob
 * ---------------------------------------------------------------------------
 * One small pixel blob, sitting in the empty right-hand column of the /work/
 * and /contact/ page heads. Desktop only, and only where there is genuinely
 * room for it: below 64rem the two heads are a single column and the canvas is
 * display:none, so nothing here ever runs on a phone.
 *
 * It is the hero's blob, told small. Same construction, and deliberately so —
 * the lobes are filled flat white into one picture, that picture is blurred
 * until neighbours bleed together and bridge (the goo), a separate field of
 * colour spots is blurred behind it, and every cell of a fixed grid is then
 * either wholly inside the silhouette or wholly outside it. The hard yes/no is
 * what makes this a low-resolution picture rather than a blurry one: an edge
 * block does not move at all until the shape crosses a whole cell boundary,
 * then it flips in one step.
 *
 * WHY THIS IS NOT hero.js
 * The hero engine is welcome to cost what it costs on the homepage, where the
 * blobs ARE the page. It is not welcome here. Its own notes record the bill:
 * the homepage measured 67 against /work/'s 92 on emulated mobile, and the
 * whole difference was blocking time from the per-frame readback. So this file
 * keeps the drawing technique and drops everything that only earns its place
 * full-screen:
 *
 *   no chromatic aberration  the offset is radial from the centre of the
 *                            SCREEN and grows toward its edges. Inside a 300px
 *                            box there is no lens to imitate.
 *   no magnetic cursor pull  a pointermove listener and a full redraw on a page
 *                            whose job is getting people into the project cards
 *   no scroll scrub          nothing here is pinned
 *   no entrance stretch      it is not arriving from off-screen; it is just
 *                            there, the way a printed mark is
 *
 * What is left is one cluster on a ~50 x 50 grid at 20fps, which is roughly a
 * sixteenth of the hero's per-frame area, and it stops entirely the moment the
 * page head scrolls out of view.
 *
 * Structured as one factory, createPageBlob(root) -> { destroy }, so the same
 * file drops into React unchanged — see the note at the bottom of hero.js.
 * ======================================================================== */

import { makeNoise3D } from './noise.js';
import { BLOB_GRADIENTS } from './palette.js';

/* ===========================  TUNABLES  =================================== */

const BLOB = {
  LOBES: [3, 4],        // per cluster, randomised in this range

  /* As a fraction of the box's SHORT side, so the blob is sized by the slot it
     is given rather than by the viewport.

     There is a ceiling on this and it is worth naming, because overshooting it
     clips the blob against the edge of the canvas rather than degrading
     gracefully. Peak extent is radius * (1 + PULSE_RADIUS) + spread * (1 +
     PULSE_SPREAD), which at these numbers is about 0.43 of the short side —
     comfortably inside the half it has to stay within, with the goo blur's
     reach still to pay for. Raising this much past 0.17 will start to flatten
     the blob against one side at the top of its breath. */
  LOBE_RADIUS: 0.155,
  LOBE_RADIUS_VARIANCE: 0.02,

  // How far a lobe sits from the cluster centre, as a multiple of ITS OWN
  // radius. Proportional, not absolute: with a fixed spread, a lobe that rolled
  // a large radius simply swallows its neighbours and the cluster comes out as
  // a featureless circle. Tying the two together guarantees a neck at any size.
  LOBE_SPREAD_RATIO: 1,

  ORBIT_SPEED: 0.05,    // how fast lobes swing around the cluster

  /* Three independent noise channels, so the silhouette keeps arriving
     somewhere new rather than one shape wobbling: the cluster opens and closes
     (PULSE_SPREAD), each lobe swells and shrinks on its own (PULSE_RADIUS), and
     each outline deforms (MORPH). All at different rates per lobe, so they
     rarely line up. */
  MORPH: 0.13,
  MORPH_SPEED: 0.28,
  NOISE_SCALE: 0.8,
  PULSE_RADIUS: 0.30,
  PULSE_SPREAD: 0.45,
  PULSE_SPEED: 0.22,

  POINTS: 48,           // samples per lobe outline, smoothed into cubic beziers

  /* A slow wander around the centre of the box, as a fraction of the short
     side. Much smaller than the hero's, and for a different reason: the hero's
     blobs have most of a screen to move in, this one has a box it must not
     touch the sides of. Enough to stop it looking pinned, no more. */
  DRIFT: 0.03,
  DRIFT_SPEED: 0.05,

  /* --- goo ---
     Blurs the silhouette until neighbouring lobes bleed together, then the
     alpha cut below slams the edge back to hard. This is what makes a cluster
     of circles read as one melted shape with concave necks.

     A FRACTION of the short side, where the hero states it in viewport pixels.
     That difference is the whole reason this reads right at 300px: the hero's
     20px is about a ninth of its blob's extent, and 20px against a blob a fifth
     the size would round the cluster off into a single ball with no necks at
     all. Stated proportionally, the same look survives whatever width the
     column ends up. */
  GOO_BLUR: 0.034,

  /* --- colour: mesh gradient ---
     Also proportional, and for the same reason. This can be heavy without
     costing edge sharpness, because the shape comes from the mask and the
     colour is painted behind it — the blur never touches the outline. But no
     heavier than it needs: blur mixes hues from opposite sides of the colour
     wheel toward their average, so over-blurring is what greys a bold five
     colour field into one muddy tone. */
  MESH_BLUR: 0.033,
  MESH_SPOTS: 6,        // one per palette colour, plus one repeat, so every hue
                        // in the gradient actually appears on the blob
  MESH_SPOT: 0.55,      // spot radius as a fraction of the cluster's extent.
                        // Tighter than the spread, so each colour keeps a core
                        // where it is undiluted — that core is what stays bold.
  MESH_SPREAD: 0.8,     // how far spots sit from the centre. Near 0 they stack
                        // up and average into one colour; near 1 they sit under
                        // the rim and the middle goes flat.
  MESH_SWIRL: 0.09,     // how fast the spots rotate around the cluster

  COLOR_HOLD: [5, 11],  // seconds before drifting to another gradient
  COLOR_LERP: 0.22,     // per-second approach rate toward the new one
};

const PIXEL = {
  /* Block size in CSS pixels, and the same 6 the hero uses on a desktop. It has
     to be: the two are visible on consecutive pages of one site, and a blob
     with a different grain would read as a different mark rather than the same
     one at a different size. */
  CELL: 6,

  /* Alpha at which a blurred cell counts as inside the blob, 0-255. Carried
     over from the hero, where it was derived from the SVG goo filter this
     replaced rather than picked by eye: that mapped alpha through (a * 45 - 19),
     so its edge sat where that crosses a half, which is (0.5 + 19) / 45 or
     about 0.43. Keeping the same cut keeps the silhouette that was tuned there. */
  ALPHA_CUT: Math.round(((0.5 + 19) / 45) * 255),
};

/* Frames per second. The blob is a slow lava lamp on a chunky grid, where 20 is
   indistinguishable from 60 and costs a third as much — and what it costs is
   the expensive kind: two canvas blurs and two getImageData readbacks, and a
   readback is a stall the browser cannot hide.

   0 disables the cap and draws every frame. */
const FPS = 20;

/* Below this the two page heads are a single column with nowhere to put a blob,
   and the CSS hides the canvas. Matches the 64rem the rest of the site splits
   its two-column layouts at — one breakpoint, named once, rather than a second
   number here that could drift away from the stylesheet's. */
const DESKTOP = '(min-width: 64rem)';

/* =========================  small math helpers  ========================== */

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const lerp = (a, b, t) => a + (b - a) * t;
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
const rgbaCss = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

/* ============================  the blob  ================================= */

export function createPageBlob(root) {
  const canvas = root.querySelector('canvas');
  if (!canvas) return { destroy() {} };

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const desktop = window.matchMedia(DESKTOP);

  // Fixed seed, so the drift and morph are identical on every reload and "is
  // that a bug or just the noise?" is an answerable question.
  const noise = makeNoise3D(0x9A3F);

  /* The four surfaces, all of them CELL times smaller than the box. Three are
     working surfaces nobody sees:

       shape   the lobes, filled flat white, hard-edged and overlapping
       mask    that same picture blurred — the goo. Blurring the lobes as ONE
               image is what lets neighbours bleed into each other and bridge;
               blurring them separately and stacking the results would not
       field   the mesh gradient: a flat backing plus the drifting colour spots
       colour  the field, blurred, which melts the spots into one another

     and the visible canvas gets, for every cell, the colour from `colour`
     wherever `mask` is solid enough to count as inside the blob. The browser
     scales it up with image-rendering: pixelated, so one pixel here is one
     block of one flat colour on screen.

     Deliberately NOT scaled by device pixel ratio. A retina screen drawing this
     at twice the resolution is the one thing it must not do: a block is meant
     to be a block. */
  const ctx = canvas.getContext('2d');
  const shapeCanvas = document.createElement('canvas');
  const shapeCtx = shapeCanvas.getContext('2d');
  const fieldCanvas = document.createElement('canvas');
  const fieldCtx = fieldCanvas.getContext('2d');
  /* willReadFrequently: these two are read back pixel by pixel every frame. The
     flag asks the browser to keep them in ordinary memory rather than on the
     graphics card, where reading back means stalling until the card catches up. */
  const maskCanvas = document.createElement('canvas');
  const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
  const colourCanvas = document.createElement('canvas');
  const colourCtx = colourCanvas.getContext('2d', { willReadFrequently: true });

  let boxW = 0, boxH = 0, minDim = 0;
  let cols = 0, rows = 0;
  let outImage = null;
  let raf = null, last = null, elapsed = 0;
  let destroyed = false;
  let visible = false;

  /* ---- the cluster ------------------------------------------------------ */

  /* One family per load, at random, so a visit gets either the cool blob or the
     warm one. Within the load it stays in that family: the colour breathing
     below picks a new gradient every few seconds, and letting it cross families
     would walk the blob from green to yellow and back, which reads as the
     colour being broken rather than as it drifting. */
  const family = pick(BLOB_GRADIENTS);
  const startStops = pick(family);

  const lobes = [];
  const lobeCount = randInt(...BLOB.LOBES);
  const base = Math.random() * Math.PI * 2;
  for (let l = 0; l < lobeCount; l++) {
    const radius = BLOB.LOBE_RADIUS + rand(-1, 1) * BLOB.LOBE_RADIUS_VARIANCE;
    lobes.push({
      radius,
      // Spread evenly around the cluster, then jittered, so the lobes don't
      // stack up on one side and leave it lopsided. `base` tilts the whole
      // ring, which is what stops every reload producing the same pose.
      angle: base + (l / lobeCount) * Math.PI * 2 + rand(-0.35, 0.35),
      // EVERY lobe rings the centre — none sits in the middle. A centre lobe
      // fills the gap the outer ones are supposed to pinch away from, and the
      // cluster fuses into one round mass with no necks at all, which is
      // exactly what separates a metaball blob from a circle.
      spread: radius * BLOB.LOBE_SPREAD_RATIO * rand(0.88, 1.1),
      orbit: rand(0.6, 1.4) * (Math.random() < 0.5 ? -1 : 1),
      seed: l * 11.3,
      // Separate phases, so the three morph channels drift in and out of sync
      // instead of pulsing together.
      pulseR: Math.random() * 100,
      pulseS: Math.random() * 100,
      pulseRate: rand(0.75, 1.35),
    });
  }

  /* The mesh: colour spots orbiting the cluster, each taking one colour from
     the palette so every hue in the gradient actually appears. Spots are their
     own thing, NOT one per lobe — tying them to lobes caps the mesh at three
     colours and pins them to the lobe centres, so the blob reads as one flat
     colour with a hotspot. */
  const spots = [];
  for (let s = 0; s < BLOB.MESH_SPOTS; s++) {
    spots.push({
      colorIndex: s % startStops.length,
      angle: (s / BLOB.MESH_SPOTS) * Math.PI * 2 + rand(-0.5, 0.5),
      // Staggered radii, so the spots don't all sit on one ring and leave the
      // centre a flat disc of the backing colour.
      dist: BLOB.MESH_SPREAD * rand(0.25, 1),
      swirl: rand(0.55, 1.5) * (Math.random() < 0.5 ? -1 : 1),
      size: BLOB.MESH_SPOT * rand(0.75, 1.25),
    });
  }

  let rgb = startStops.map(hexToRgb);
  let target = startStops.map(hexToRgb);
  let nextColorAt = rand(...BLOB.COLOR_HOLD);

  // Its own lissajous figure, so the wander never repeats on a short cycle.
  const fx = 0.6 + Math.random() * 0.9;
  const fy = 0.6 + Math.random() * 0.9;
  const px = Math.random() * Math.PI * 2;
  const py = Math.random() * Math.PI * 2;

  /* ---- geometry --------------------------------------------------------- */

  /* Closed Catmull-Rom through the sampled points, traced straight into the
     canvas path as cubic beziers. A polyline would show facets, and they
     survive the blur. */
  function traceBlobPath(c, points) {
    const n = points.length;
    c.moveTo(points[0][0], points[0][1]);
    for (let i = 0; i < n; i++) {
      const p0 = points[(i - 1 + n) % n];
      const p1 = points[i];
      const p2 = points[(i + 1) % n];
      const p3 = points[(i + 2) % n];
      c.bezierCurveTo(
        p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6,
        p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6,
        p2[0], p2[1],
      );
    }
    c.closePath();
  }

  /* ---- size ------------------------------------------------------------- */

  function measure() {
    boxW = root.clientWidth;
    boxH = root.clientHeight;
    minDim = Math.min(boxW, boxH);
    if (minDim <= 0) return false;

    // Rounded UP, so the grid always covers the box rather than leaving a
    // sliver of bare background down one edge.
    cols = Math.max(1, Math.ceil(boxW / PIXEL.CELL));
    rows = Math.max(1, Math.ceil(boxH / PIXEL.CELL));

    for (const c of [canvas, shapeCanvas, fieldCanvas, maskCanvas, colourCanvas]) {
      c.width = cols;
      c.height = rows;
    }

    /* Stretched back to EXACTLY cols x rows whole cells, not to the box width.
       Stretching it to the box instead would scale cols cells into a slightly
       narrower space and every block would come out 5.94 pixels wide — a grid
       that lines up with nothing and whose blocks land on fractional pixels.
       The overhang is under one cell and the box clips it. */
    canvas.style.width = `${cols * PIXEL.CELL}px`;
    canvas.style.height = `${rows * PIXEL.CELL}px`;

    outImage = ctx.createImageData(cols, rows);
    return true;
  }

  /* ---- the frame -------------------------------------------------------- */

  const pts = [];

  function draw(time, dt) {
    // Reduced motion: hold the shape still rather than removing it.
    const t = reduced ? 0 : time;
    const cell = PIXEL.CELL;

    /* Both source surfaces are cleared, then set to draw in BOX pixels: the
       transform divides every coordinate by the cell size on its way in, so the
       geometry below can go on thinking in ordinary screen pixels and lands on
       the grid automatically. Blur radii are the exception — a canvas filter
       works in the surface's own pixels and ignores the transform, so those are
       divided by hand. */
    shapeCtx.setTransform(1, 0, 0, 1, 0, 0);
    shapeCtx.clearRect(0, 0, cols, rows);
    shapeCtx.setTransform(1 / cell, 0, 0, 1 / cell, 0, 0);
    shapeCtx.fillStyle = '#fff';

    fieldCtx.setTransform(1, 0, 0, 1, 0, 0);
    fieldCtx.clearRect(0, 0, cols, rows);
    fieldCtx.setTransform(1 / cell, 0, 0, 1 / cell, 0, 0);

    // Slow lissajous wander around the centre of the box.
    const dsp = reduced ? 0 : BLOB.DRIFT_SPEED;
    const cx = boxW / 2 + Math.sin(t * dsp * fx + px) * BLOB.DRIFT * minDim;
    const cy = boxH / 2 + Math.cos(t * dsp * fy + py) * BLOB.DRIFT * minDim;

    // Each lobe: a circle, slowly orbiting the cluster centre, its outline
    // gently deformed by noise. The noise is sampled ON A CIRCLE in noise
    // space, so the first and last samples agree by construction and there is
    // no seam to hide.
    let extent = 0;
    for (const lobe of lobes) {
      const ang = lobe.angle + (reduced ? 0 : t * BLOB.ORBIT_SPEED * lobe.orbit);

      // Two slow, independent breathing channels. The cluster opening and
      // closing takes the blob through genuinely different silhouettes; the
      // lobes swelling unevenly stops it settling into a symmetrical shape.
      const pt = t * BLOB.PULSE_SPEED * lobe.pulseRate;
      const pulseS = 1 + BLOB.PULSE_SPREAD * noise(lobe.pulseS, 0, pt);
      const pulseR = 1 + BLOB.PULSE_RADIUS * noise(lobe.pulseR, 7.3, pt);

      const spread = lobe.spread * (reduced ? 1 : pulseS) * minDim;
      const lx = cx + Math.cos(ang) * spread;
      const ly = cy + Math.sin(ang) * spread;
      const R = lobe.radius * (reduced ? 1 : pulseR) * minDim;
      extent = Math.max(extent, spread + R);

      const nz = t * BLOB.MORPH_SPEED + lobe.seed;

      pts.length = 0;
      for (let s = 0; s < BLOB.POINTS; s++) {
        const a = (s / BLOB.POINTS) * Math.PI * 2;
        const nx = Math.cos(a) * BLOB.NOISE_SCALE;
        const ny = Math.sin(a) * BLOB.NOISE_SCALE;
        const r = R * (1 + BLOB.MORPH * noise(nx + lobe.seed, ny, nz));
        pts.push([lx + Math.cos(a) * r, ly + Math.sin(a) * r]);
      }

      /* Straight onto the silhouette surface, in flat white. Every lobe goes
         into this one picture, which is what lets the blur below bridge them
         into a single melted shape. */
      shapeCtx.beginPath();
      traceBlobPath(shapeCtx, pts);
      shapeCtx.fill();
    }

    // Colour breathing: drift toward another gradient in the same family now
    // and then, so the blob is never quite the colour it was a minute ago.
    if (!reduced) {
      nextColorAt -= dt;
      if (nextColorAt <= 0) {
        target = pick(family).map(hexToRgb);
        nextColorAt = rand(...BLOB.COLOR_HOLD);
      }
      const ck = approach(BLOB.COLOR_LERP, dt);
      for (let s = 0; s < rgb.length; s++) {
        const tgt = target[s % target.length];
        for (let c = 0; c < 3; c++) rgb[s][c] = lerp(rgb[s][c], tgt[c], ck);
      }
    }

    /* The colour field, painted flat here and blurred in one go afterwards. A
       backing square first, sized to the cluster plus the blur's reach, so that
       when the field is softened its own outer edge is nowhere near the
       silhouette — otherwise the blob fades toward black at its rim instead of
       ending on a hard edge. */
    const meshBlur = BLOB.MESH_BLUR * minDim;
    const pad = extent + meshBlur * 3;
    fieldCtx.fillStyle = rgbToCss(rgb[1 % rgb.length]);
    fieldCtx.fillRect(cx - pad, cy - pad, pad * 2, pad * 2);

    /* Then the spots. Anchored to the cluster centre and scaled by its extent,
       so the whole colour field travels, grows and shrinks WITH the blob — the
       thing a fixed gradient could never do. */
    for (const spot of spots) {
      const sa = spot.angle + (reduced ? 0 : t * BLOB.MESH_SWIRL * spot.swirl);
      const sd = spot.dist * extent;
      const sx = cx + Math.cos(sa) * sd;
      const sy = cy + Math.sin(sa) * sd;
      const sr = Math.max(1, extent * spot.size);
      const c = rgb[spot.colorIndex];

      const grad = fieldCtx.createRadialGradient(sx, sy, 0, sx, sy, sr);
      /* A near-opaque plateau before the fade, and all three stops the same
         hue. With a straight solid-to-transparent ramp most of a spot is
         semi-transparent, so every colour mixes with every other one and the
         blob drifts to pastel; holding the core solid to 55% gives each hue a
         patch where it is undiluted and confines the blending to the rims. */
      grad.addColorStop(0, rgbaCss(c, 1));
      grad.addColorStop(0.55, rgbaCss(c, 0.92));
      grad.addColorStop(1, rgbaCss(c, 0));
      fieldCtx.fillStyle = grad;
      fieldCtx.beginPath();
      fieldCtx.arc(sx, sy, sr, 0, Math.PI * 2);
      fieldCtx.fill();
    }

    composite(meshBlur);
  }

  /* Turns the three working surfaces into the picture on the page.
   *
   * Blurring happens here, once per surface, on the whole image rather than per
   * shape. That matters for the silhouette: the lobes have to be blurred
   * TOGETHER for neighbours to bleed into one another and bridge into a single
   * melted outline. Blur them one at a time and each just gets its own soft
   * edge, and the necks between them never form.
   *
   * The hero crops this to the patch the blobs occupy, because most of a
   * 240 x 150 grid is empty and reading it back to ask "still empty?" is the
   * single biggest cost on that page. Here the blob fills most of a 50 x 50
   * grid, so the bookkeeping would cost more than it saved. */
  function composite(meshBlur) {
    const cell = PIXEL.CELL;

    maskCtx.setTransform(1, 0, 0, 1, 0, 0);
    maskCtx.clearRect(0, 0, cols, rows);
    maskCtx.filter = `blur(${((BLOB.GOO_BLUR * minDim) / cell).toFixed(2)}px)`;
    maskCtx.drawImage(shapeCanvas, 0, 0);
    maskCtx.filter = 'none';

    colourCtx.setTransform(1, 0, 0, 1, 0, 0);
    colourCtx.clearRect(0, 0, cols, rows);
    colourCtx.filter = `blur(${(meshBlur / cell).toFixed(2)}px)`;
    colourCtx.drawImage(fieldCanvas, 0, 0);
    colourCtx.filter = 'none';

    const mask = maskCtx.getImageData(0, 0, cols, rows).data;
    const colour = colourCtx.getImageData(0, 0, cols, rows).data;
    const out = outImage.data;
    const cut = PIXEL.ALPHA_CUT;

    for (let i = 0; i < cols * rows; i++) {
      const p = i * 4;
      /* The hard yes/no that makes this a pixel display rather than a
         pixelated photograph. A cell is either wholly inside the blob or wholly
         outside it — no half-lit cells along the edge, which is exactly what
         stops the edge shimmering as the shape moves. */
      if (mask[p + 3] < cut) {
        out[p + 3] = 0;
        continue;
      }
      out[p] = colour[p];
      out[p + 1] = colour[p + 1];
      out[p + 2] = colour[p + 2];
      out[p + 3] = 255;
    }

    ctx.putImageData(outImage, 0, 0);
  }

  /* ---- the loop --------------------------------------------------------- */

  /* Accumulated between throttled redraws rather than dropped. Every speed in
     this file is either a per-second rate through approach() or a multiply by
     dt, so handing draw() the accumulated time makes a 20fps redraw land in
     exactly the same place a 60fps one would. Dropping the skipped time instead
     would silently third every speed here. */
  let acc = 0;
  const interval = FPS > 0 ? 1 / FPS : 0;

  function frame(now) {
    if (last === null) last = now;
    // Clamped, so a backgrounded tab doesn't teleport the animation on return.
    const dt = clamp((now - last) / 1000, 0, 0.1);
    last = now;
    elapsed += dt;
    acc += dt;

    if (acc >= interval) {
      draw(elapsed, acc);
      acc = 0;
    }
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (destroyed || raf !== null || reduced) return;
    // Cleared so the first frame back measures no elapsed time. Without it the
    // gap since the last frame — possibly minutes — arrives as one enormous
    // step and the blob lurches.
    last = null;
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    if (raf !== null) cancelAnimationFrame(raf);
    raf = null;
    last = null;
  }

  /* ---- when it runs ----------------------------------------------------- */

  /* Three things have to be true: the viewport is wide enough for the blob to
     have a column of its own, the page head is on screen, and the visitor has
     not asked for reduced motion. Anything else and the loop is not running —
     which, on /contact/, is most of the visit, because the head scrolls away
     the moment someone starts filling the form in. */
  function sync() {
    if (destroyed) return;

    if (!desktop.matches) {
      stop();
      return;
    }

    // The canvas is display:none below the breakpoint, so it has no size to
    // measure until the media query passes. Sized here rather than on load for
    // exactly that reason.
    if (cols === 0 && !measure()) return;

    if (reduced) {
      // One frame, held. The shape is part of the composition; only its
      // movement was objected to.
      draw(0, 0);
      return;
    }

    if (visible) start();
    else stop();
  }

  const io = new IntersectionObserver(entries => {
    visible = entries[entries.length - 1].isIntersecting;
    sync();
  });
  io.observe(root);

  /* The column is a fraction of the viewport, so it changes size as the window
     does. ResizeObserver rather than a window resize listener: it fires on the
     element's own size, which also covers the box changing because the text
     beside it reflowed to a different number of lines. */
  const ro = new ResizeObserver(() => {
    if (destroyed || !desktop.matches) return;
    if (root.clientWidth === boxW && root.clientHeight === boxH) return;
    if (measure()) {
      // Redraw immediately: the buffers were just reallocated and the canvas is
      // blank until the next frame, which under reduced motion never comes.
      draw(elapsed, 0);
    }
  });
  ro.observe(root);

  const onMedia = () => sync();
  desktop.addEventListener('change', onMedia);

  sync();

  return {
    destroy() {
      destroyed = true;
      stop();
      io.disconnect();
      ro.disconnect();
      desktop.removeEventListener('change', onMedia);
    },
  };
}

/* ===========================  bootstrap  ================================= */

for (const el of document.querySelectorAll('.page-blob')) {
  createPageBlob(el);
}
