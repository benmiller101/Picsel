/* ---- reviews-cycle.js — the reviews rail, as a loop -----------------------
   Enhancement only, same promise as work-ring.js. The section is a scrolling
   strip of quotes in the HTML and this file turns it into a wheel of cards
   with two buttons on it. Blocked, broken or still loading, every review is on
   the page and the rail still drags.

   WHAT THIS FIXES. The rail was built on one affordance: a card sliced by the
   right edge of the screen, which says "more this way" without a control to
   style, label or keep in sync. That reasoning holds and it only ever covered
   half the visitors. A trackpad scrolls sideways, a finger drags, the arrow
   keys work once the rail has focus, and a mouse can do none of the three: the
   scrollbar is hidden on purpose, and no wheel moves a strip horizontally. On
   the homepage that left four of seven reviews unreachable by the most common
   pointer there is.

   So: two buttons, and the list loops rather than ending, so neither of them
   is ever dead. Nothing about the rail's composition changes.

   THE BLUR IS THE WORK WHEEL'S BLUR. One card is in focus and every card
   behind it is further out of it, which gives the eye one place to be in a row
   of seven paragraphs that otherwise all shout equally. It follows the cycle:
   the card arriving at the front sharpens as it lands, the one leaving softens
   as it goes.

   TUNING. Every number is in `cfg` with a name, same as work-ring.js. That is
   the whole surface.

   Plain IIFE, no imports, loaded with `defer` by the section itself so that
   every page carrying reviews gets this without a seventh page edit. */
(function () {
  'use strict';

  var cfg = {
    /* px of blur on the card furthest back in the row, and deliberately a
       fraction of the wheel's 14. These cards are text. The wheel blurs a
       screenshot, which stays a picture of a website at any amount; a quote
       past about 3px is a grey smear, and a row of smears reads as a rendering
       fault rather than as depth. Enough to say "this one first" and no more:
       the neighbouring card is still legible, which is the point of having it
       on screen at all. */
    maxBlur: 2.4,
    /* how far a card at the back fades, 0 to 1 */
    fade: 0.45,
    /* and how far it darkens, which is what stops a blurred card from reading
       as a bright shape in the corner of the eye */
    dim: 0.4,
    /* the curve blur, fade and dim all climb on. Below 1 they move quickly at
       the front of the row and level off behind, so the difference between the
       front card and the one behind it is obvious and the difference between
       the fifth and sixth is not worth paying for. */
    ease: 0.75,
    /* how long one cycle takes, ms */
    stepMs: 520,
    /* how far a drag has to go, as a share of one card, before letting go
       counts as a cycle rather than as a change of mind */
    dragTrigger: 0.18,
  };

  /* Below this there is nothing to cycle: both cards are already on screen and
     the buttons would move a rail that is showing everything it has. Has to
     agree with MIN_TO_CYCLE in tools/partials/reviews.js, which is what
     decides whether the buttons are in the markup at all. */
  var MIN_TO_CYCLE = 3;

  var sections = document.querySelectorAll('.reviews');
  for (var s = 0; s < sections.length; s++) setup(sections[s]);

  function setup(section) {
    var rail = section.querySelector('.reviews__rail');
    var track = section.querySelector('.reviews__track');
    var cycle = section.querySelector('[data-review-cycle]');
    if (!rail || !track || !cycle) return;

    var slides = Array.prototype.slice.call(track.children);
    var N = slides.length;
    if (N < MIN_TO_CYCLE) return;

    var counter = cycle.querySelector('[data-review-count]');
    var live = section.querySelector('[data-review-live]');
    var steps = cycle.querySelectorAll('[data-review-step]');

    var active = 0;
    /* Where each card currently sits, so paint() can tell a card moving one
       slot from a card wrapping round the back. Seeded out of range: the first
       paint places every card without animating it. */
    var slot = slides.map(function () { return NaN; });

    var stepPx = 0;   // one card plus one gap, in px
    var visible = 3;  // how many slots the rail can show at once
    /* Where the card that has just left is parked, in slots. Normally that is
       one slot to the left and off the screen, and on a wide monitor it is
       not: the rail's left inset lines the first card up with the heading, and
       at 2560px that inset is wider than a card, so a card sitting at slot -1
       is still on screen. It is invisible either way, but it fades out in the
       middle of the rail instead of sliding off the side of it. Measured in
       layout() so the outgoing card always leaves the screen. */
    var parkSlot = -1;

    section.classList.add('is-cycling');
    cycle.hidden = false;
    section.style.setProperty('--cycle-ms', cfg.stepMs + 'ms');

    /* The label was written for a strip you drag. It now has buttons and it
       loops, and a keyboard user arriving on it by Tab should be told the
       thing that is true. */
    rail.setAttribute(
      'aria-label',
      N + ' reviews, use the previous and next buttons or the arrow keys',
    );

    /* ---------------------------------------------------------------
       SIZES
       Measured on load and on resize, never while cycling.
    --------------------------------------------------------------- */
    function layout() {
      /* The cards are out of the flow in cycling mode, so the track has no
         height of its own to read. Drop back to the flex row for the length of
         one measurement and the browser gives the answer it already knows: a
         flex row's height is its tallest item, which is exactly the height the
         cards want. No paint happens in between, so nothing flickers. */
      section.classList.remove('is-cycling');
      var gap = parseFloat(window.getComputedStyle(track).columnGap) || 0;
      var height = track.offsetHeight;
      var width = slides[0].offsetWidth;
      section.classList.add('is-cycling');

      track.style.setProperty('--track-h', height + 'px');
      stepPx = width + gap;
      var inset = parseFloat(window.getComputedStyle(rail).paddingInlineStart) || 0;
      parkSlot = Math.min(-1, -(inset + width) / stepPx);
      /* One more than fits, because the card being sliced by the right edge is
         half on screen and has to be painted. */
      visible = Math.max(1, Math.ceil(rail.clientWidth / stepPx));

      paint();
    }

    /* ---------------------------------------------------------------
       PLACING AND PAINTING
       Slots run from -1 to N - 2: one card parked off the left edge,
       the rest of the row to the right. The parked slot is what makes
       the loop seamless in both directions. Cycling forward, the card
       leaving slides off to the left and lands there; cycling back, it
       slides in from there. The only card that ever has to jump is the
       one crossing between the parked slot and the far end of the row,
       and both of those are off screen.
    --------------------------------------------------------------- */
    function slotFor(i) {
      return (((i - active + 1) % N) + N) % N - 1;
    }

    function paint() {
      /* The one card that is properly in focus, and the row behind it is
         measured against however many slots there are to be behind it. */
      var depth = Math.max(1, N - 2);

      for (var i = 0; i < N; i++) {
        var slide = slides[i];
        var d = slotFor(i);
        var was = slot[i];
        /* A card that has moved more than one slot has not moved, it has
           wrapped. Placed with the transition off so it does not fly back
           across the rail through everything else. NaN on the first paint,
           which fails the comparison and places every card silently. */
        var jumped = !(Math.abs(d - was) <= 1);

        if (jumped) slide.classList.add('is-wrapping');
        slide.style.setProperty('--d', String(d < 0 ? parkSlot : d));

        if (jumped) {
          /* Forces the placement to land before the transition comes back, so
             the browser has nothing left to animate about where the card is.
             Everything below is set after the transition is live again, so a
             card arriving by this route fades in where it lands rather than
             appearing there. On most screens the seam is off the edge of the
             rail and none of this shows; on a monitor wide enough to see the
             far end of the row, a fade is the difference between a loop and a
             card popping into existence. */
          void slide.offsetWidth;
          slide.classList.remove('is-wrapping');
        }

        var t = Math.min(Math.max(d, 0), depth) / depth;
        var e = Math.pow(t, cfg.ease);
        var hidden = d < 0 || d > visible;

        slide.style.setProperty('--card-blur', (cfg.maxBlur * e).toFixed(2) + 'px');
        slide.style.setProperty('--card-bright', (1 - cfg.dim * e).toFixed(3));
        slide.style.setProperty('--card-op', hidden ? '0' : (1 - cfg.fade * e).toFixed(3));
        /* A card off the end of the row is invisible and must not be
           clickable, and it stays in the accessibility tree either way. Every
           review is in the HTML and a screen reader should be able to read all
           seven straight through: hiding the ones this file has moved off the
           side would take four of them away from the readers who cannot see
           that they have been moved anywhere. */
        slide.style.pointerEvents = hidden ? 'none' : '';

        slot[i] = d;
      }

      if (counter) counter.textContent = String(active + 1).padStart(2, '0');
    }

    function announce() {
      if (!live) return;
      var name = slides[active].querySelector('.review__author');
      live.textContent =
        'Review ' + (active + 1) + ' of ' + N + (name ? ', ' + name.textContent : '');
    }

    function go(by) {
      active = (((active + by) % N) + N) % N;
      paint();
      announce();
    }

    /* ---------------------------------------------------------------
       THE CONTROLS
    --------------------------------------------------------------- */
    for (var b = 0; b < steps.length; b++) {
      steps[b].addEventListener('click', function (event) {
        go(Number(event.currentTarget.getAttribute('data-review-step')));
      });
    }

    /* The arrow keys used to scroll the rail, which was the browser doing it
       and not this file. Cycling mode has nothing to scroll, so the same two
       keys have to keep meaning the same thing by hand. */
    rail.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowRight') go(1);
      else if (event.key === 'ArrowLeft') go(-1);
      else return;
      event.preventDefault();
    });

    /* ---- The drag ---------------------------------------------------
       The rail no longer scrolls, so the gesture that used to move it has to
       be rebuilt. It follows the finger while it is down rather than waiting
       for it to lift: a carousel that only responds on release feels like a
       button you have to guess the size of.

       Vertical is left alone. Until the pointer has committed to sideways, a
       drag that is mostly up or down is the page being scrolled and this
       hands it straight back. */
    var down = null;

    rail.addEventListener('pointerdown', function (event) {
      if (event.button !== 0 && event.pointerType === 'mouse') return;
      down = { x: event.clientX, y: event.clientY, id: event.pointerId, axis: null };
    });

    rail.addEventListener('pointermove', function (event) {
      if (!down || event.pointerId !== down.id) return;
      var dx = event.clientX - down.x;
      var dy = event.clientY - down.y;

      if (!down.axis) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        down.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (down.axis === 'y') { down = null; return; }
        rail.classList.add('is-dragging');
        rail.setPointerCapture(down.id);
      }

      track.style.setProperty('--drag', dx + 'px');
    });

    function release(event) {
      if (!down || event.pointerId !== down.id) return;
      var dx = down.axis === 'x' ? event.clientX - down.x : 0;
      down = null;
      rail.classList.remove('is-dragging');
      track.style.setProperty('--drag', '0px');

      /* Round rather than clamp to one, so a long flick past two cards moves
         two. Anything short of the trigger snaps back to where it started,
         which is what the round already does. */
      var by = Math.round(-dx / (stepPx * (1 - cfg.dragTrigger)));
      if (by) go(by);
    }

    rail.addEventListener('pointerup', release);
    rail.addEventListener('pointercancel', release);

    /* ---------------------------------------------------------------
       GO
    --------------------------------------------------------------- */
    layout();

    /* The measurement above is of cards set in whatever face the browser had
       at the time, and the display face usually arrives after it. A quote set
       in the fallback is a different number of lines from the same quote set
       in the real one, so the height is taken again when the fonts and the
       rest of the page have landed. */
    window.addEventListener('load', layout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);

    var pending = 0;
    window.addEventListener('resize', function () {
      window.clearTimeout(pending);
      pending = window.setTimeout(layout, 120);
    });
  }
})();
