/* ---- work-ring.js — the homepage Work section's 3D wheel ------------------
   Enhancement only, and that word is load bearing. The section is a plain
   grid of six links in the HTML and this file turns it into a pinned wheel
   that advances one project per scroll. Blocked, broken or still loading, the
   work is all still there and every link still works. Nothing here is allowed
   to become the only way to reach a project.

   The geometry was modelled in Blender before it was written: cards mounted
   around a ring on a horizontal axle, the front one square to the camera, the
   rest receding above and below. Four things in here look like they could be
   simplified and cannot. They are marked TRAP where they sit.

   Vanilla, no library, per the build rules. Loaded with `defer` from the
   homepage only.

   TUNING. Every number lives in `cfg` below with a name. That is the whole
   surface: change a value there, reload, and the section is different. There
   are no magic numbers further down. */
(function(){
  'use strict';

  /* ================================================================
     THE DIALS
     Every fixed value lives here with a name, nothing magic further
     down. This is the section's tuning surface: edit a number, reload.
  ================================================================ */
  var cfg = {
    tilt        : -19,    // degrees. how far round the side of the wheel we stand
    billboard   : 0.45,   // 0 = cards sit flat on the ring (your Blender file), 1 = always face you
    radiusRatio : 1.18,   // wheel radius as a multiple of card height
    cardRatio   : 0.72,   // card width as a share of the 3D column
    cardPhone   : 0.98,   // and on a phone, as a share of the whole screen
    persp       : 1500,   // px. smaller = more dramatic 3D
    stepMs      : 620,    // how long one turn takes
    stepVh      : 0.85,   // how much scrolling moves you on one project (share of screen height)
    entryVh     : 0.65,   // how much scrolling the slide in takes
    exitVh      : 0.80,   // how much scrolling the slide out takes
    maxBlur     : 14,     // px of blur on the card furthest round the back
    maxBlurPhone: 26,     // and on a phone, where cards pass behind the text
    fade        : 0.35,   // how far a card at the back fades out, 0 to 1
    fadePhone   : 0.72,   // and on a phone, for the same reason as the blur
    exitDir     : 1,      // 1 slides the WHEEL out to the right, -1 to the left
    panelExitDir: -1,     // and the text goes the other way: -1 left, 1 right
    snap        : true    // land on whole projects rather than between them
  };

  /* The name's build-in, which is the hero's glitch doing a second job.
     Letters land in random order, each one flashing to a different pixel face
     with the chromatic split and a small horizontal kick as it arrives.

     START_DELAY waits out the crossfade in work-ring.css: the outgoing name
     fades and lifts for 200ms before the incoming one is allowed to start, and
     letters landing under the old name would read as a fault. */
  var NAME_GLITCH = {
    ENABLED     : true,
    START_DELAY : 200,      // ms, matches the .is-active transition delay
    STEP        : [24, 62], // ms between letters, randomised
    FLASH       : [60, 150],// ms a letter stays swapped as it lands
    JITTER      : 1.4       // px, max horizontal kick on a landing letter
  };

  /* The faces the flash swaps to, and the list is hero.js's FONTS.ROTATION
     minus the resting face, which is where the reasoning for each of them
     lives. Kept as its own copy rather than shared because work-ring.js is a
     plain script with nothing to import from: hero.js is a module and its list
     is inside its own closure.

     Each swap is written WITH the normal stack behind it, so a face the browser
     never loaded falls back to argent-pixel-cf and the letter simply does not
     change. That is the failure hero.js needs a font-measuring step to avoid:
     set bare, an absent face drops the letter to the default proportional font
     and one letter of the word turns into a different typeface entirely. */
  var GLITCH_FONTS = ['gridlite-pe-variable', 'pixelify-sans', 'Pixelify Sans'];

  var CARD_ASPECT = 16 / 10;

  /* -1 means the next project rises up from below and the one you have just
     seen rolls up and over the back, which is the way your scroll is going.
     Flip it to 1 and the wheel turns the other way. */
  var TURN = -1;

  var section = document.getElementById('work');

  /* Only the homepage loads this file, but a script that throws the moment it
     lands on a page without its section is a script that will one day throw in
     somebody's console and be blamed for something else. */
  if (!section) return;

  var panel   = section.querySelector('.work__panel');
  var ringBox = section.querySelector('.work__ring');
  var slide   = section.querySelector('.ring__slide');
  var ring    = section.querySelector('.ring');
  var snaps   = section.querySelector('.work__snaps');
  var counter = section.querySelector('[data-count]');
  var items   = Array.prototype.slice.call(section.querySelectorAll('.project'));
  var links   = items.map(function(li){ return li.querySelector('.project__link'); });
  var names   = items.map(function(li){ return li.querySelector('.project__name'); });
  var N       = items.length;
  var STEP_DEG = 360 / N;

  /* Anybody who has asked for less motion keeps the plain grid.
     No pinning, no wheel, nothing that moves on its own. */
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches) return;

  /* ---------------------------------------------------------------
     BUILD THE WHEEL
     The cards are copies of the screenshots that are already in the
     HTML. They are marked hidden from screen readers because the real
     links in the text column are the ones that carry meaning.
  --------------------------------------------------------------- */
  /* a holding colour per card, so a card still looks like a card in the
     half second before its screenshot arrives */
  var TINTS = ['#b8482e','#2f3a26','#2a2a72','#16181c','#e9e5dd','#1b2233'];

  var faces = [];
  var cards = [];
  items.forEach(function(li, n){
    var src  = li.querySelector('img').getAttribute('src');
    var card = document.createElement('div');
    var face = document.createElement('div');
    var img  = document.createElement('img');
    card.className = 'card';
    face.className = 'card__face';
    face.style.background = TINTS[n % TINTS.length];
    img.src = src; img.alt = ''; img.setAttribute('draggable','false');
    face.appendChild(img); card.appendChild(face); ring.appendChild(card);
    cards.push(card); faces.push(face);
  });

  /* One invisible marker per project for the browser to snap to, but none on
     the first one: a snap point right at the section's start would grab the
     page as you approach and you would never see the ring slide in. */
  for (var s = 1; s < N; s++) snaps.appendChild(document.createElement('i'));
  var markers = Array.prototype.slice.call(snaps.children);

  section.classList.add('is-ring');

  /* ---------------------------------------------------------------
     SIZES
     Recalculated on load and on resize only, never while scrolling.
  --------------------------------------------------------------- */
  var vh = 0, stepPx = 0, entryPx = 0, exitPx = 0, radius = 0;

  /* Matches the 900px breakpoint in work-ring.css, and it has to: below it the
     stylesheet puts the wheel above the text instead of beside it, and the blur
     and fade here are what keep the name readable in that arrangement. Change
     one and change the other. */
  var phone = false;

  function layout(){
    vh = window.innerHeight;
    phone = window.innerWidth <= 900;
    stepPx  = vh * cfg.stepVh;
    entryPx = vh * cfg.entryVh;
    exitPx  = vh * cfg.exitVh;

    /* the section is tall enough for: one screen of pinning, one step
       of scroll per project after the first, then the slide out */
    section.style.height = (vh + (N - 1) * stepPx + exitPx) + 'px';

    var colW = ringBox.clientWidth || window.innerWidth;
    var cardW = Math.min(colW * cfg.cardRatio, 760);

    /* Phones measure against the whole screen rather than the column, because
       below 900px there is no column: the wheel is stacked under the text and
       has the full width to itself. Nearly all of it, at that. A screenshot of
       a website shown at two thirds of a phone's width is too small to read
       anything in, which is the one job it has. The radius follows from the
       card height, so the whole wheel grows with it. */
    if (phone) cardW = Math.min(window.innerWidth * cfg.cardPhone, 560);
    var cardH = cardW / CARD_ASPECT;
    radius = cardH * cfg.radiusRatio;

    ringBox.style.setProperty('--persp', cfg.persp + 'px');
    ring.style.setProperty('--tilt', cfg.tilt + 'deg');
    /* TRAP 1. These two are why the front card sits at true size, dead centre.
       --ringz pushes the whole wheel back by exactly its own radius so the
       front card lands back on the origin instead of being magnified by the
       perspective; --ringx cancels the sideways drag the tilt puts on it. The
       CSS applies them before the rotations, which is the only order that
       works. Remove either and the front card looks blown up or off centre. */
    ring.style.setProperty('--ringz', (-radius) + 'px');
    ring.style.setProperty('--ringx', (-radius * Math.sin(cfg.tilt * Math.PI / 180)).toFixed(1) + 'px');
    section.style.setProperty('--card-w', cardW + 'px');
    section.style.setProperty('--card-h', cardH + 'px');
    section.style.setProperty('--step-ms', cfg.stepMs + 'ms');

    placeCards();
    /* Depth is normally set once per turn. Resizing can cross the breakpoint
       without a turn happening, and without this the phone layout would keep
       the desktop's blur until the next scroll. */
    paint(Math.round(shown));
    markers.forEach(function(m, i){ m.style.top = ((i + 1) * stepPx) + 'px'; });
    document.documentElement.style.scrollSnapType = cfg.snap ? 'y proximity' : 'none';
    onScroll();
    spin();
  }

  /* Where each card sits around the wheel, in degrees, wrapped so that
     "a bit further round" is always measured the short way. */
  var place = [];
  /* TRAP 3, first half. Angles must be wrapped into -180..180 before they are
     used. An unwrapped angle past 180 tips a card past the point where you are
     looking at the back of it and its screenshot renders mirrored. */
  function wrap(deg){ return ((deg + 180) % 360 + 360) % 360 - 180; }

  function placeCards(){
    for (var i = 0; i < N; i++) place[i] = wrap(TURN * i * STEP_DEG);
    applyCards(-TURN * shown * STEP_DEG);
  }

  /* Each card is rotated round the wheel, pushed out to the rim, then tipped
     back towards you by a share of however far round it currently is. The card
     at the front is always dead square to you; the ones behind lean away. */
  /* TRAP 3, second half. The tip back has to be recalculated here on every
     frame from the wheel's CURRENT angle, because how far round a card is
     changes as the wheel turns. Baking it into a static transform set once
     looks correct for the front card and mirrors the ones behind it. */
  function applyCards(ringAngle){
    for (var i = 0; i < N; i++){
      var facing = wrap(place[i] + ringAngle);         // where this card looks right now
      cards[i].style.transform =
        'rotateX(' + place[i] + 'deg) translateZ(' + radius + 'px) ' +
        'rotateX(' + (-facing * cfg.billboard).toFixed(2) + 'deg)';
    }
  }

  /* ---------------------------------------------------------------
     DEPTH
     Called once at the start of each turn, not every frame. The browser
     eases blur and brightness to the new values on its own, which is
     the cheap way to do it.
  --------------------------------------------------------------- */
  var half = Math.floor(N / 2);
  function paint(front){
    /* Phones push both further. The text sits under the wheel at that width
       with nothing behind it, so a card passing through is the only thing that
       could make the name hard to read. It is dealt with by pushing the card
       back rather than by laying a panel over the picture. */
    var maxBlur = phone ? cfg.maxBlurPhone : cfg.maxBlur;
    var fade    = phone ? cfg.fadePhone    : cfg.fade;

    for (var i = 0; i < N; i++){
      var d = ((i - front) % N + N) % N;
      if (d > N / 2) d = N - d;                 // how many places back, 0 to 3
      var t = d / half;                          // 0 at the front, 1 at the very back
      var e = Math.pow(t, 0.75);                 // blur climbs quickly then levels off
      var blur   = maxBlur * e;
      var bright = 1 - 0.82 * e;
      var op     = (d >= half) ? 0 : (1 - fade * e);
      faces[i].style.filter  = 'blur(' + blur.toFixed(2) + 'px) brightness(' + bright.toFixed(3) + ')';
      faces[i].style.opacity = op.toFixed(3);
    }
  }

  /* ---------------------------------------------------------------
     THE NAME'S BUILD-IN
     Each name is split into one span per letter at startup, then the
     letters land in random order every time that project comes to the
     front. Same idea as the hero wordmark: the word assembles out of
     noise rather than fading in.
  --------------------------------------------------------------- */

  /* Whatever the stylesheet says the display face is, read once rather than
     written here, so the swap fonts always fall back to the real resting face
     and this file never has to know its name. */
  var restingStack = names.length
    ? window.getComputedStyle(names[0]).fontFamily
    : 'monospace';

  function rand(a, b){ return a + Math.random() * (b - a); }
  function pick(list){ return list[Math.floor(Math.random() * list.length)]; }

  /* One span per letter, and every word wrapped in one more span.

     THE WORD WRAPPER IS NOT DECORATION. A letter span is an inline-block, and
     the browser is free to break a line between any two of them, so a name split
     naively wraps mid-word: "AJC Removal / s & Clearances". Wrapping each word
     in a nowrap box puts the only break opportunities back where they belong,
     at the spaces between words.

     The spaces themselves stay as real text nodes. They are what the browser
     breaks ON, and a row of inline-blocks with nothing between them offers it
     nowhere to break at all. */
  function splitLetters(el){
    var text = el.textContent;
    var out = [];
    var word = null;
    el.textContent = '';

    for (var i = 0; i < text.length; i++){
      var ch = text.charAt(i);

      if (ch === ' '){
        el.appendChild(document.createTextNode(' '));
        word = null;
        continue;
      }

      if (!word){
        word = document.createElement('span');
        word.className = 'word';
        el.appendChild(word);
      }

      var span = document.createElement('span');
      span.className = 'letter';
      span.textContent = ch;
      word.appendChild(span);
      out.push(span);
    }
    return out;
  }

  var letters = names.map(splitLetters);
  var buildTimers = [];

  function clearBuild(){
    for (var i = 0; i < buildTimers.length; i++) clearTimeout(buildTimers[i]);
    buildTimers.length = 0;
  }

  function land(span){
    span.classList.remove('is-waiting');
    span.style.fontFamily = "'" + pick(GLITCH_FONTS) + "', " + restingStack;
    span.style.transform =
      'translateX(' + rand(-NAME_GLITCH.JITTER, NAME_GLITCH.JITTER).toFixed(2) + 'px)';
    span.classList.add('is-glitching');
    buildTimers.push(setTimeout(function(){
      span.style.fontFamily = '';
      span.style.transform = '';
      span.classList.remove('is-glitching');
    }, rand(NAME_GLITCH.FLASH[0], NAME_GLITCH.FLASH[1])));
  }

  /* The build waits for the section to arrive. setActive(0) runs at startup to
     put the first project in the DOM's active state, and without this the word
     would assemble itself several screens below the fold and be finished before
     anybody scrolled to it. */
  var armed = false;

  function resetLetters(){
    for (var n = 0; n < letters.length; n++){
      for (var k = 0; k < letters[n].length; k++){
        var span = letters[n][k];
        span.style.fontFamily = '';
        span.style.transform = '';
        span.classList.remove('is-glitching', 'is-waiting');
      }
    }
  }

  function buildIn(i){
    if (!NAME_GLITCH.ENABLED || !armed) return;
    clearBuild();

    /* Every name back to its resting state first, not just this one. A turn can
       interrupt a build still running on the name being replaced, and a letter
       left mid-flash is a letter stuck in the wrong font. */
    resetLetters();

    var queue = letters[i].slice();
    for (var q = queue.length - 1; q > 0; q--){        // shuffle, so the word
      var r = Math.floor(Math.random() * (q + 1));     // assembles out of order
      var tmp = queue[q]; queue[q] = queue[r]; queue[r] = tmp;
    }

    var t = NAME_GLITCH.START_DELAY;
    queue.forEach(function(span){
      span.classList.add('is-waiting');
      t += rand(NAME_GLITCH.STEP[0], NAME_GLITCH.STEP[1]);
      buildTimers.push(setTimeout(function(){ land(span); }, t));
    });
  }

  function setActive(i){
    items.forEach(function(li, j){ li.classList.toggle('is-active', j === i); });
    counter.textContent = ('0' + (i + 1)).slice(-2);
    buildIn(i);
  }

  /* ---------------------------------------------------------------
     THE TURN
     shown is where the wheel actually is. target is where the scroll
     position says it should be. We always travel a whole project at a
     time, so the wheel is never left resting between two states, and
     if you scroll fast it rolls through them rather than jumping.
  --------------------------------------------------------------- */
  var shown = 0, target = 0, from = 0, to = 0, t0 = 0, turning = false, dur = 620;

  function easeInOutCubic(p){ return p < 0.5 ? 4*p*p*p : 1 - Math.pow(-2*p + 2, 3) / 2; }

  function spin(){
    var angle = -TURN * shown * STEP_DEG;
    ring.style.setProperty('--spin', angle.toFixed(3) + 'deg');
    applyCards(angle);
  }

  function startTurn(){
    var here = Math.round(shown);
    var dir  = target > here ? 1 : -1;
    from = shown;
    to   = here + dir;
    /* if you have scrolled several projects ahead the wheel still visits
       every one, just faster, so it catches up instead of dragging behind */
    dur  = Math.abs(target - here) > 1 ? cfg.stepMs * 0.5 : cfg.stepMs;
    section.style.setProperty('--step-ms', Math.round(dur) + 'ms');
    t0   = performance.now();
    turning = true;
    paint(to);        // the browser eases blur and dim over the same time as the turn
    setActive(to);
  }

  function frame(now){
    if (turning){
      var p = Math.min(1, (now - t0) / dur);
      shown = from + (to - from) * easeInOutCubic(p);
      spin();
      if (p === 1){
        shown = to; turning = false;
        if (to !== target) startTurn();     // keep rolling if the scroll ran ahead
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ---------------------------------------------------------------
     SCROLL
     Reads the section's position and works out three things: how far
     through the slide in we are, which project we should be on, and
     how far through the slide out we are.
  --------------------------------------------------------------- */
  function clamp(v, a, b){ return v < a ? a : (v > b ? b : v); }

  function onScroll(){
    var rect = section.getBoundingClientRect();
    var y = -rect.top;                                   // how far into the section we are

    var entry = clamp(1 - rect.top / entryPx, 0, 1);     // 0 off to the right, 1 settled
    var exit  = clamp((y - (N - 1) * stepPx) / exitPx, 0, 1);

    var offRight = window.innerWidth * 0.8;
    var slideX = (1 - entry) * offRight + exit * offRight * 1.2 * cfg.exitDir;
    slide.style.setProperty('--slide-x', slideX.toFixed(1) + 'px');

    panel.style.setProperty('--panel-o', (entry * (1 - exit)).toFixed(3));
    panel.style.setProperty('--panel-y', ((1 - entry) * 28).toFixed(1) + 'px');
    /* The text and its button leave to the LEFT while the wheel leaves to the
       right. They came in from opposite sides and they go out the same way, so
       the section opens and closes on the same gesture rather than sliding off
       together like one slab. */
    panel.style.setProperty('--panel-x', (exit * offRight * cfg.panelExitDir).toFixed(1) + 'px');

    /* Settled: build the name that is on screen. Leaving: disarm, so coming
       back to the section plays it again rather than showing a word that is
       already assembled. */
    if (entry >= 1 && !armed){
      armed = true;
      buildIn(clamp(Math.round(y / stepPx), 0, N - 1));
    } else if (entry < 1 && armed){
      armed = false;
      clearBuild();
      resetLetters();
    }

    var want = clamp(Math.round(y / stepPx), 0, N - 1);
    if (want !== target){
      target = want;
      if (!turning) startTurn();
    }
  }

  var ticking = false;
  window.addEventListener('scroll', function(){
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function(){ onScroll(); ticking = false; });
  }, {passive:true});

  window.addEventListener('resize', layout);

  /* ---------------------------------------------------------------
     KEYBOARD
     Left and right arrows turn the wheel while the section owns the
     screen. Up and down are left alone so normal scrolling still works.
     Tabbing to a hidden project scrolls the page to it, so a keyboard
     user never lands on something they cannot see.
  --------------------------------------------------------------- */
  function goTo(i){
    i = clamp(i, 0, N - 1);
    var top = section.getBoundingClientRect().top + window.scrollY + i * stepPx;
    window.scrollTo({top: top, behavior: 'smooth'});
  }

  document.addEventListener('keydown', function(e){
    var rect = section.getBoundingClientRect();
    var pinned = rect.top <= 1 && rect.bottom > vh;
    if (!pinned) return;
    if (e.key === 'ArrowRight'){ e.preventDefault(); goTo(target + 1); }
    if (e.key === 'ArrowLeft'){  e.preventDefault(); goTo(target - 1); }
  });

  links.forEach(function(a, i){
    a.addEventListener('focus', function(){
      if (i !== target) goTo(i);
    });
  });

  /* ---------------------------------------------------------------
     GO
  --------------------------------------------------------------- */
  setActive(0);
  paint(0);
  layout();

})();
