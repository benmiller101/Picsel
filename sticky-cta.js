/* ---- sticky-cta.js — showing and hiding the mobile action bar -------------
   The bar itself ships in the HTML with the `hidden` attribute (see
   tools/partials/sticky-cta.js), so a browser that never runs this file, or
   runs it after the visitor has already started reading, simply never shows
   it. Everything below only decides when a mobile visitor sees it.

   MOBILE ONLY, AND CHECKED ONCE AT LOAD. This site's audience reads on a
   phone between jobs; on a desktop the contact band is never more than a
   section away, so the bar has no job to do there and is left hidden. The
   check happens before anything else runs, so a desktop load never wires up
   an observer it does not need. */

const DESKTOP_QUERY = matchMedia('(min-width: 768px)');

/* Class the CSS transitions off screen. Kept as a class rather than toggling
   `hidden` a second time so the bar can slide away and back with the
   transition site.css defines, instead of vanishing and reappearing instantly
   the way the `hidden` attribute would. */
const AWAY_CLASS = 'sticky-cta--away';

/* Set on <html> only once this script has confirmed the bar is actually
   going to exist on this page view — never unconditionally. site.css reads
   this, the same way it reads nav.js's nav-armed, to gate the footer's extra
   bottom padding: that padding exists purely to keep the footer's last line
   clear of the bar, and reserving it when there is no bar to clear (script
   blocked, script broken, viewport decided desktop at load) would leave an
   empty gap under the footer with nothing on the page to explain it. */
const ARMED_CLASS = 'sticky-cta-armed';

function ready(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn);
  } else {
    fn();
  }
}

ready(function () {
  const bar = document.querySelector('[data-sticky-cta]');

  // Nothing to show, or nothing worth showing it on. Leave the `hidden`
  // attribute exactly as the markup shipped it.
  if (!bar || DESKTOP_QUERY.matches) return;

  bar.hidden = false;
  document.documentElement.classList.add(ARMED_CLASS);

  /* The bar must never sit on top of the thing it is offering a shortcut to.
     .contact-band is the closing section most pages end on; #enquiry is the
     form on /contact/ itself, which has no contact-band of its own. A page
     can have either, both, or (a couple of legal pages) neither, so this
     queries for whichever exist rather than assuming one.

     IntersectionObserver, not a scroll listener, for the same reason nav.js
     uses one: the browser already knows when these elements cross the
     viewport and will say so, so nothing here has to ask on every scroll
     frame to be told the same answer most of the time. */
  const watched = document.querySelectorAll('.contact-band, #enquiry');

  if (watched.length) {
    /* A single callback fires for every observed element whose intersection
       state changed, not for all of them, so "is either on screen" has to be
       tracked across calls rather than read off one entries array. A Set of
       the currently-intersecting targets does that: the bar stays away for
       as long as the set is non-empty, however many watched elements are on
       screen at once. */
    const onScreen = new Set();

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) onScreen.add(entry.target);
        else onScreen.delete(entry.target);
      });
      const away = onScreen.size > 0;
      bar.classList.toggle(AWAY_CLASS, away);

      /* The away state moves the bar off screen with a transform, and a
         transform alone does not take an element out of tab order: without
         this, a keyboard user reaches two links that are still focusable but
         sitting below the bottom edge of the viewport, and sees at most a
         sliver of the focus ring where the bar has not quite cleared the
         screen. `inert` is what a transform cannot do on its own — it drops
         the bar's contents out of tab order and off the accessibility tree
         while it is away, and restores both the moment the bar is back,
         which keeps "visually hidden" and "reachable by keyboard" from ever
         disagreeing with each other. */
      bar.inert = away;
    });

    watched.forEach((el) => observer.observe(el));
  }

  /* A phone can be rotated or a browser window dragged wide enough to cross
     768px without a reload. Re-hiding here, the same way the bar started
     hidden, is what stops it being stuck on screen over a desktop layout it
     was never designed to sit over. The reverse crossing (desktop to mobile)
     is not handled: this script already decided at load that the visit is a
     desktop one and did not observe anything, so there is nothing live to
     resume, matching how the rest of the site treats its viewport as decided
     once per load rather than watched continuously. */
  DESKTOP_QUERY.addEventListener('change', (event) => {
    if (event.matches) {
      bar.hidden = true;
      // No bar, no reason to keep telling the footer to clear one.
      document.documentElement.classList.remove(ARMED_CLASS);
    }
  });
});
