/* ---- nav.js — bringing the nav in on scroll -------------------------------
   The bar is not on screen at the top of a page. It arrives once the page has
   scrolled --nav-reveal (a quarter of a screen) and stays until you come back
   to the top. site.css owns how it looks doing that; this file only decides
   when, by putting two classes on <html>:

     nav-armed   this script is running, so the CSS may hide the bar
     nav-shown   the page is scrolled past the trip wire

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

    function show(on) {
      root.classList.toggle('nav-shown', on);
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
      show(!entries[entries.length - 1].isIntersecting);
    });
    io.observe(sentinel);

    /* A reload partway down a page, or a browser restoring the scroll
       position, both start below the wire. The observer reports that on its
       first callback anyway; this only stops the bar sliding in from off
       screen a frame later, which reads as an animation nobody asked for on a
       page that was already scrolled. */
    show(window.scrollY > sentinel.offsetHeight);

    checkScrollable();
    window.addEventListener('resize', checkScrollable, { passive: true });
  });
})();
