/* ---- article-rails.js — which rail is speaking ----------------------------
   Both rails are secondary while the body is being read. Each comes forward
   where it is the most useful thing on the page: the title at the top, the
   contact at the end. article.css owns what "quiet" looks like; this file
   only decides when, by putting one class on whichever rail should fade.

   SENTINELS, NOT A SCROLL HANDLER. Same reason as nav.js: a scroll listener
   runs on every frame to answer a question that changes twice. Two empty
   divs and an IntersectionObserver answer it exactly when it changes, and
   the browser is already doing that work for its own compositing anyway.

   ONE OBSERVER, TWO TARGETS. The top sentinel opening .__col reports when the
   reader has scrolled past the start of the article; the end sentinel closing
   it reports when the end has come into view. Neither callback reads a
   position or a size, and the entry's isIntersecting is the whole answer, which
   is what keeps this off the layout-thrash list nav.js is careful about too.

   THE QUIET CLASS IS ADDED, NOT SHIPPED. Neither rail carries it in the
   static HTML, so a browser that never runs this file, or a request that
   never reaches it, shows both rails bright: a title and a phone number at
   full contrast, rather than a page of furniture dimmed by a half-loaded
   enhancement. That is the correct failure, not a bug to work around.

   BELOW 79rem THIS DOES NOTHING. The rails only exist as rails above that
   width, the same width article.css needs for the three-column layout
   itself; below it they stack into the reading order and there is nothing to
   fade. matchMedia gates the whole file on it, and the listener re-checks on
   change so a window dragged across the breakpoint, or a tablet rotated
   through it, cannot leave a rail stuck mid-fade on a layout that no longer
   has one. Crossing back down disconnects the observer and hands both rails
   back their bright, unclassed default, the same one a page with no script
   would have shown from the start.

   THE CONTENTS HIGHLIGHT LIVES HERE TOO, rather than in a second module,
   because it answers the same question the rest of the file already asks:
   where is the reader. A second IntersectionObserver watches a thin band
   near the top of the viewport, and whichever heading last crossed that band
   is the section marked aria-current="true" on its contents link. That is
   the accessible way to say "you are here" and it doubles as the styling
   hook; article.css does the rest.

   The top and bottom of the article are edge cases a band cannot answer on
   its own, so they reuse the two sentinels already in play rather than
   adding new geometry to read. While the top sentinel is still on screen the
   reader has not reached the first heading yet, so nothing is marked. Once
   the end sentinel comes on screen the reader has reached the bottom of the
   article, and the final heading is marked current even if it never
   actually crossed the band, which happens whenever the page runs out of
   scroll before the last heading reaches it.

   THE HIGHLIGHT USES THE SAME QUERY AS THE FADE. Both the rails and the
   contents list they hold only exist above 79rem, the width the three-column
   layout itself needs (see the comment on that layout in article.css), so
   there is no width at which one is visible and the other is not. A single
   query answers both questions. */

const QUIET_SUFFIX = '--quiet';
const RAILS_QUERY = matchMedia('(min-width: 79rem)');

/* The band a heading has to cross to become the current section. Close to
   the top of the viewport rather than the middle: the reader's eye is near
   the top of the screen when reading, not the centre, and a heading that has
   only just scrolled past there is still the one they are reading. */
const SECTION_BAND_MARGIN = '-5% 0px -60% 0px';

function ready(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn);
  } else {
    fn();
  }
}

ready(function () {
  const cols = document.querySelector('.guide__cols, .post__cols');
  if (!cols) return;

  const prefix = cols.classList.contains('guide__cols') ? 'guide' : 'post';
  const left = cols.querySelector(`.${prefix}__rail--left`);
  const right = cols.querySelector(`.${prefix}__rail--right`);
  const top = cols.querySelector(`.${prefix}__sentinel--top`);
  const end = cols.querySelector(`.${prefix}__sentinel--end`);

  // Nothing to watch or nothing to fade. Leave both rails as the markup shipped them.
  if (!left || !right || !top || !end) return;

  const quietClass = `${prefix}__rail${QUIET_SUFFIX}`;

  /* The contents links and the headings they point at, paired up by index.
     A short article with no contents list has an empty pair of arrays and
     the section observer below simply has nothing to watch. */
  const links = Array.from(left.querySelectorAll(`.${prefix}__rail-list a`));
  const headings = links.map((link) => document.getElementById(link.getAttribute('href').slice(1)));

  let observer = null;
  let sectionObserver = null;
  let highlightOn = false;

  // Which heading last crossed the band. -1 is "none yet", the top-of-article state.
  let sectionIndex = -1;
  let atTop = true;
  let atEnd = false;

  /* The single source of truth for which link, if any, carries
     aria-current. Reading it from three separate booleans rather than
     three separate DOM writes keeps the top and end overrides and the band
     result from fighting each other: whichever sentinel fired last is not
     what decides, this function's priority order is.

     highlightOn is the guard rather than a width check: enable() and
     enableHighlight() are called together from sync(), but enableHighlight()
     can still no-op on an article with no contents list, and this function
     has to stay safe to call from the sentinel callbacks regardless. */
  function applyCurrent() {
    if (!highlightOn) return;

    let current = -1;
    if (atEnd && headings.length) current = headings.length - 1;
    else if (!atTop) current = sectionIndex;

    links.forEach((link, index) => {
      if (index === current) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }

  /* A single callback fires for whichever sentinel actually changed, so the
     two rails are told apart by which target crossed rather than by two
     separate observers repeating the same wiring. */
  function onIntersect(entries) {
    entries.forEach((entry) => {
      if (entry.target === top) {
        // Past the top the instant the sentinel leaves the viewport.
        left.classList.toggle(quietClass, !entry.isIntersecting);
        atTop = entry.isIntersecting;
        applyCurrent();
      } else if (entry.target === end) {
        // Bright only once the end of the article has actually come into view.
        right.classList.toggle(quietClass, !entry.isIntersecting);
        atEnd = entry.isIntersecting;
        applyCurrent();
      }
    });
  }

  /* A heading crossing the band sets the current section and nothing unsets
     it, so the highlight does not go blank in the gap between one heading
     leaving the band and the next one reaching it: it stays on the section
     the reader is still inside. Scrolling back up works the same way,
     because a heading re-entering the band from below fires isIntersecting
     true again exactly the same as it did scrolling down past it. */
  function onSectionIntersect(entries) {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const index = headings.indexOf(entry.target);
      if (index !== -1) sectionIndex = index;
    });
    applyCurrent();
  }

  function enable() {
    if (observer) return;
    observer = new IntersectionObserver(onIntersect);
    observer.observe(top);
    observer.observe(end);
  }

  function disable() {
    if (!observer) return;
    observer.disconnect();
    observer = null;
    // No rails to dim below the breakpoint: back to the no-script default.
    left.classList.remove(quietClass);
    right.classList.remove(quietClass);
    atTop = true;
    atEnd = false;
    disableHighlight();
  }

  function enableHighlight() {
    if (sectionObserver || !headings.length) return;
    highlightOn = true;
    sectionObserver = new IntersectionObserver(onSectionIntersect, {
      rootMargin: SECTION_BAND_MARGIN,
    });
    headings.forEach((heading) => {
      if (heading) sectionObserver.observe(heading);
    });
    applyCurrent();
  }

  function disableHighlight() {
    if (sectionObserver) {
      sectionObserver.disconnect();
      sectionObserver = null;
    }
    sectionIndex = -1;
    // highlightOn goes false first so the loop below clears every link
    // rather than applyCurrent recomputing a "current" that no longer counts.
    highlightOn = false;
    links.forEach((link) => link.removeAttribute('aria-current'));
  }

  function sync() {
    if (RAILS_QUERY.matches) {
      enable();
      enableHighlight();
    } else {
      // disable() also tears down the highlight, since neither has anything
      // to watch once the rails are gone.
      disable();
    }
  }

  sync();
  RAILS_QUERY.addEventListener('change', sync);
});
