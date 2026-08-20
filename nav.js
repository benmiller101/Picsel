/* ---- nav.js — bringing the nav in on scroll -------------------------------
   The bar is not on screen at the top of a page. It arrives once the page has
   scrolled --nav-reveal (a quarter of a screen). After that it follows the
   direction of travel: gone while you read down the page, back the moment you
   scroll up. site.css owns how it looks doing that; this file only decides
   when, by putting two classes on <html>:

     nav-armed   this script is running, so the CSS may hide the bar
     nav-shown   past the trip wire AND not currently reading downward

   WHY IT HIDES ON THE WAY DOWN. The bar is fixed, centred and solid, so any
   text that scrolls under it is text nobody can read. On a long page that is
   not a rare collision: it was clipping FAQ headings mid-word, hiding a line
   of a review, and cutting the homepage intro paragraph in half. Reading is
   downward and reaching for the nav is upward, so the two never want the same
   pixels at the same time.

   ARMED IS A SEPARATE CLASS FOR A REASON. Every rule that hides the nav is
   behind .nav-armed, so a browser that never gets this file — blocked, offline
   mid-load, a bad deploy — falls back to a nav that is simply always there,
   which is what it was before. The failure mode of decoration is "no
   decoration"; the failure mode of a nav must never be "no nav".

   NOT A MODULE, AND NOT DEFERRED. This is the one script on the site loaded in
   the head and allowed to block, and it is deliberate: the first line has to
   run before the first paint, or the bar paints, then vanishes, and every page
   load opens with a flinch. It is a few hundred bytes from the same origin.

   The rest of it waits for the DOM like anything else. */

(function () {
  var root = document.documentElement;

  /* Before anything is painted. From here the CSS can hide the bar, and the
     work below only decides when to bring it back. */
  root.classList.add('nav-armed');

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  ready(function () {
    var sentinel = document.querySelector('.nav-sentinel');
    var nav = document.querySelector('.site-nav');
    if (!sentinel || !nav) {
      // Nothing to watch. Give the nav back rather than leaving it hidden.
      root.classList.remove('nav-armed');
      return;
    }

    /* Two independent answers, combined into one class. `past` is the trip
       wire, reported by the observer below. `heading` is which way the last
       real scroll went. The bar is only on screen when the page is past the
       wire and the visitor is not reading downward. */
    var past = false;
    var heading = 'up';

    function show() {
      root.classList.toggle('nav-shown', past && heading === 'up');
    }

    /* A page shorter than the trip wire can never scroll past it, and a nav
       that cannot be reached by scrolling is a nav that cannot be reached. It
       happens on the real site: /contact/sent/ is a heading, two lines and a
       phone number, and on a tall desktop window that is barely a screenful.
       So measure, and on a page with nowhere to scroll to, un-arm and leave
       the bar where it has always been.

       Re-checked on resize, because the same page is short on a wide window
       and long on a narrow one, and because the answer changes when a phone's
       address bar slides away. */
    var armed = true;
    function checkScrollable() {
      var reach = document.documentElement.scrollHeight - window.innerHeight;
      var needed = sentinel.offsetHeight;
      var canScrollPast = reach > needed;

      if (canScrollPast === armed) return;
      armed = canScrollPast;
      root.classList.toggle('nav-armed', armed);
    }

    /* IntersectionObserver, not a scroll listener. The browser already knows
       whether the strip at the top of the page is on screen and will say so
       when that changes; asking it sixty times a second during every scroll to
       be told the same answer is work this site does not need to do. */
    var io = new IntersectionObserver(function (entries) {
      // Past the wire is exactly "the strip is no longer visible".
      past = !entries[entries.length - 1].isIntersecting;

      /* Coming back up over the wire from a downward scroll would otherwise
         leave `heading` stale, and the bar would stay hidden for the whole
         way back to the top. At the top there is nothing to hide from. */
      if (!past) heading = 'up';
      show();
    });
    io.observe(sentinel);

    /* Direction DOES need the scroll position, which the observer above cannot
       give. One passive listener that does nothing but store a number, and one
       rAF that does the comparison, so the work per frame is a subtraction and
       at most one classList write.

       The 8px deadband is not tuning for its own sake. Momentum scrolling and
       rubber-banding at the ends of a page both produce single-pixel moves in
       the wrong direction, and without a floor the bar flickers in and out
       while the page is standing still. */
    var lastY = window.scrollY;
    var pending = false;
    var DEADBAND = 8;

    function onScroll() {
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () {
        pending = false;
        var y = window.scrollY;
        var moved = y - lastY;
        if (Math.abs(moved) < DEADBAND) return;
        lastY = y;
        heading = moved > 0 ? 'down' : 'up';
        show();
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    /* A reload partway down a page, or a browser restoring the scroll
       position, both start below the wire. The observer reports that on its
       first callback anyway; this only stops the bar sliding in from off
       screen a frame later, which reads as an animation nobody asked for on a
       page that was already scrolled. */
    past = window.scrollY > sentinel.offsetHeight;
    show();

    checkScrollable();
    window.addEventListener('resize', checkScrollable, { passive: true });
  });
})();
