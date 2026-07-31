/* ---- backdrop.js — the site-wide dot field --------------------------------
   The halftone that used to belong to the hero, promoted to run behind every
   page. One fixed, full-viewport canvas sitting behind all content: a grid of
   dots whose size and shade are driven by a slowly flowing noise field, each
   quantised to one of a handful of steps so a dot JUMPS between shades rather
   than easing, which is what makes the field flicker rather than shimmer.

   Two things move it. The field evolves under its own steam, slowly, so the
   page is alive even when nobody is scrolling. And it parallaxes: as the page
   scrolls the field travels the same way at a fraction of the speed, so it
   reads as a surface some distance behind the content rather than a pattern
   stuck to the glass.

   WHY THIS IS A CANVAS AND NOT CSS. Section 2 built this backdrop in CSS
   precisely to avoid an animation loop running for a whole visit, and that
   reasoning still stands on its merits — a repeating gradient costs nothing
   and survives JavaScript being switched off. It was reversed deliberately:
   the CSS version can only draw identical dots at one opacity, and the varying
   size, the varying shade and the flicker are the whole character of the
   effect. What Section 2 was protecting is kept instead by the guards below —
   the loop stops when the tab is hidden, the field goes static under reduced
   motion, and base.css keeps the CSS dot layer as the fallback for anyone
   without JavaScript. See the class toggle at the bottom of this file. */

import { makeNoise3D } from './noise.js';

const DOTS = {
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

const canvas = document.querySelector('.backdrop');
const ctx = canvas ? canvas.getContext('2d') : null;

if (ctx) {
  /* Hide the CSS fallback only now — after the canvas exists AND a drawing
     context was actually granted. A browser that refuses the context (some
     privacy modes do, to defeat canvas fingerprinting) keeps the CSS dots
     rather than being left with a blank page. */
  document.documentElement.classList.add('has-canvas-backdrop');
  start(canvas, ctx);
}

function start(canvas, ctx) {
  const noise = makeNoise3D(0xC5E1);
  const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = reducedQuery.matches;

  const BUCKETS = Math.max(2, DOTS.LEVELS | 0);

  let vw = 0, vh = 0, dpr = 1;
  let xs = new Float32Array(0);
  let ys = new Float32Array(0);
  // One byte per dot: which shade it came out as this frame. Filled by pass
  // one of draw() and read by pass two, so the noise is sampled once per dot
  // rather than once per dot per shade. Allocated on resize, never per frame.
  let steps = new Uint8Array(0);
  let fills = [];
  let frame = 0;
  let spacing = DOTS.SPACING;

  /* ---- the grid -----------------------------------------------------------
     Rebuilt only on resize. At 11px spacing a 1920x1080 viewport is over 17,000
     dots, so anything that can be hoisted out of the per-frame loop must be —
     including the fill strings, which would otherwise be thousands of string
     allocations every frame.

     One row of overhang top and bottom. The field slides vertically with the
     parallax, and without the spare rows a line of dots would pop in at one
     edge and vanish at the other as it travelled. */
  function build() {
    spacing = vw <= 640 ? DOTS.SPACING_SMALL : DOTS.SPACING;
    dpr = Math.min(window.devicePixelRatio || 1, DOTS.MAX_DPR);

    canvas.width = Math.max(1, Math.round(vw * dpr));
    canvas.height = Math.max(1, Math.round(vh * dpr));

    const cols = Math.ceil(vw / spacing) + 1;
    const rows = Math.ceil(vh / spacing) + 2;
    xs = new Float32Array(cols * rows);
    ys = new Float32Array(cols * rows);
    steps = new Uint8Array(cols * rows);

    let i = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        xs[i] = c * spacing;
        // One row up, the overhang the vertical travel eats into.
        ys[i] = r * spacing - spacing;
        i++;
      }
    }

    const [tr, tg, tb] = DOTS.TINT;
    fills = [];
    for (let b = 0; b < BUCKETS; b++) {
      // Evenly spaced shades from faintest to MAX_ALPHA. A dot is always
      // exactly one of these — never between two.
      const a = DOTS.MAX_ALPHA * ((b + 1) / BUCKETS);
      fills.push(`rgba(${tr},${tg},${tb},${a.toFixed(4)})`);
    }
  }

  function draw(time) {
    if (DOTS.UPDATE_EVERY > 1 && frame++ % DOTS.UPDATE_EVERY !== 0) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, vw, vh);

    // Reduced motion: a static texture rather than no texture. The field is
    // still drawn, it simply never evolves and never parallaxes.
    const t = reduced ? 0 : time;
    const z = t * DOTS.FLOW_SPEED;
    const drift = t * DOTS.DRIFT;
    const ns = DOTS.NOISE_SCALE;

    /* THE PARALLAX, and the reason it costs nothing.

       `shift` is how far the field has travelled in its own world: the page's
       scroll, geared down. A dot's screen position is its world position minus
       that, so as you scroll DOWN the field moves UP — the same direction as
       the content, at a third of the speed, which is what reads as depth. Move
       it the other way and it reads as a mistake.

       The grid is never actually walked off the screen, though. `offset` is
       `shift` wrapped to a single cell, and because the lattice is identical
       every cell, sliding it by the remainder is indistinguishable from sliding
       it by the whole distance — so the travel stays exact however far the page
       has scrolled, with no growing float and no dots to recycle.

       The noise still has to be sampled at the UNWRAPPED position or the
       pattern would snap back every cell. `base + shift` is that position, and
       since `shift - offset` is a whole number of cells it lands exactly on the
       lattice, so the pattern and the grid never disagree. */
    const shift = reduced ? 0 : window.scrollY * DOTS.PARALLAX;
    const offset = shift % spacing;

    /* PASS ONE: work out every dot's shade, once.

       This is separate from the drawing for one reason, and it is the single
       biggest cost in this file. The dots have to be drawn grouped by shade —
       one path per shade is what keeps the whole field to a handful of fills
       instead of thousands of fillStyle changes. But writing that as "for each
       shade, for each dot, compute its shade and skip it if it isn't mine"
       samples the noise BUCKETS times for every dot and throws away four
       fifths of the answers. At ~11,000 dots that is 55,000 simplex
       evaluations per draw for 11,000 dots' worth of information.

       So the noise is evaluated once per dot here, into a byte per dot, and
       the drawing below is then five cheap passes over an array. Measured on
       a 1440x900 viewport: 7.4ms per draw before, well under 2ms after. */
    for (let i = 0; i < xs.length; i++) {
      // Where this dot lands on screen is the lattice slid up by the wrapped
      // travel; where that is in the field's own world is that plus the full
      // shift. Sampling in world space is what makes the texture belong to the
      // page rather than to the window — scroll down and you meet field you
      // have not seen before, instead of the same pattern following you down.
      const worldY = ys[i] - offset + shift;

      // Noise in [-1,1] -> [0,1], then a contrast curve so big dots stay
      // sparse and clustered instead of evenly stippled.
      let n = (noise((xs[i] + drift) * ns, worldY * ns, z) + 1) * 0.5;
      n = Math.pow(n < 0 ? 0 : n > 1 ? 1 : n, DOTS.CONTRAST);

      // QUANTISE. The dot snaps to one of LEVELS shades — it never sits
      // between two, which is what produces the flicker as the field moves.
      steps[i] = Math.min(BUCKETS - 1, (n * BUCKETS) | 0);
    }

    /* PASS TWO: one path per shade, so the whole field is a handful of fills
       rather than thousands of style changes. */
    for (let b = 0; b < BUCKETS; b++) {
      // Size follows the same quantised step as the shade, so it steps rather
      // than eases. Constant across the bucket, so it is hoisted out.
      const q = b / (BUCKETS - 1);
      const radius = DOTS.MAX_RADIUS * (1 - DOTS.SIZE_STEP + DOTS.SIZE_STEP * q);
      if (radius < 0.12) continue; // below this it is a sub-pixel smudge

      ctx.fillStyle = fills[b];
      ctx.beginPath();
      let drew = false;

      for (let i = 0; i < xs.length; i++) {
        // ALPHA_MOD off means every dot takes the top shade, so only the last
        // bucket draws and it draws all of them.
        if (DOTS.ALPHA_MOD ? steps[i] !== b : b !== BUCKETS - 1) continue;

        const base = ys[i] - offset;
        ctx.moveTo(xs[i] + radius, base);
        ctx.arc(xs[i], base, radius, 0, Math.PI * 2);
        drew = true;
      }

      if (drew) ctx.fill();
    }
  }

  /* ---- resize -------------------------------------------------------------
     Sized from the VISUAL viewport, not the document. The canvas is fixed, so
     it only ever needs to cover one screen however long the page is.

     innerWidth/innerHeight rather than a measured element: there is no element
     to measure here — unlike the hero, whose stage is 100svh and therefore
     deliberately not the same as the window. */
  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    // A phone hiding or showing its address bar fires resize with a new height
    // every few pixels of scroll. Rebuilding a 17,000-dot grid on each one is
    // pure waste when the field is full-bleed and a few pixels short simply is
    // not visible, so height-only changes under a threshold are ignored.
    if (w === vw && Math.abs(h - vh) < 80) return;
    vw = w;
    vh = h;
    build();
  }

  /* ---- the loop -----------------------------------------------------------
     Paused whenever the tab is hidden. This is the guard that makes a
     whole-visit canvas defensible at all: a background tab redrawing 17,000
     dots forever is exactly the battery cost Section 2 was avoiding. Browsers
     throttle rAF in hidden tabs anyway, but they do not all stop it, and
     relying on that is relying on someone else's implementation detail. */
  let raf = 0;
  let startedAt = 0;

  function tick(now) {
    raf = requestAnimationFrame(tick);
    if (!startedAt) startedAt = now;
    draw((now - startedAt) / 1000);
  }

  function play() {
    if (!raf) raf = requestAnimationFrame(tick);
  }

  function pause() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });

  /* Registered unconditionally, not only when the loop happens to be running
     at load. Someone who starts the visit with reduced motion on and turns it
     off later still gets the tab-hidden pause; wiring this up inside the
     `else` below would have silently skipped it for exactly that person.
     play() is a no-op while nothing is scheduled, so this is safe either way. */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause();
    else if (!reduced) play();
  });

  /* Under reduced motion the field is drawn once and then left alone — no
     loop at all, rather than a loop that redraws an identical picture. */
  if (reduced) draw(0);
  else play();

  /* Someone can turn reduced motion on mid-visit. Honouring it only at load
     would mean the setting does nothing until they reload the page. */
  reducedQuery.addEventListener('change', (event) => {
    reduced = event.matches;
    if (reduced) {
      pause();
      frame = 0;
      draw(0);
    } else {
      startedAt = 0;
      play();
    }
  });
}
