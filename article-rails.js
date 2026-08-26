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

   BELOW 64rem THIS DOES NOTHING. The rails only exist as rails above that
   width; below it they stack into the reading order and there is nothing to
   fade. matchMedia gates the whole file on it, and the listener re-checks on
   change so a window dragged across the breakpoint, or a tablet rotated
   through it, cannot leave a rail stuck mid-fade on a layout that no longer
   has one. Crossing back down disconnects the observer and hands both rails
   back their bright, unclassed default, the same one a page with no script
   would have shown from the start. */

const QUIET_SUFFIX = '--quiet';
const WIDE_QUERY = matchMedia('(min-width: 64rem)');

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

  let observer = null;

  /* A single callback fires for whichever sentinel actually changed, so the
     two rails are told apart by which target crossed rather than by two
     separate observers repeating the same wiring. */
  function onIntersect(entries) {
    entries.forEach((entry) => {
      if (entry.target === top) {
        // Past the top the instant the sentinel leaves the viewport.
        left.classList.toggle(quietClass, !entry.isIntersecting);
      } else if (entry.target === end) {
        // Bright only once the end of the article has actually come into view.
        right.classList.toggle(quietClass, !entry.isIntersecting);
      }
    });
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
  }

  function sync() {
    if (WIDE_QUERY.matches) enable();
    else disable();
  }

  sync();
  WIDE_QUERY.addEventListener('change', sync);
});
