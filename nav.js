/* ---- shared switcher between the two concepts ---------------------------
   Injected from JS rather than duplicated into both HTML files, so adding a
   third concept is one line in PAGES and nothing else.

   All three pages sit in the same directory — blocks3d.html is BUILT there from
   three-src/ — so the links are plain relative filenames. No router, no build
   step for the nav itself, and exactly one copy of it: the 3D page pulls this
   very file in at runtime rather than bundling its own. */

const PAGES = [
  { file: 'index.html', label: 'Mesh wheel' },
  { file: 'blocks.html', label: 'Iso blocks' },
  { file: 'blocks3d.html', label: '3D blocks' },
  { file: 'hero.html', label: 'Glitch hero' },
];

(function buildNav() {
  // Last path segment. Empty when served as a directory index ("/" or "/dir/"),
  // in which case the first page is the one being viewed.
  const here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

  const nav = document.createElement('nav');
  nav.className = 'site-nav';
  nav.setAttribute('aria-label', 'Effects');

  PAGES.forEach((page, i) => {
    const a = document.createElement('a');
    a.href = page.file;
    if (page.file.toLowerCase() === here) a.setAttribute('aria-current', 'page');

    const num = document.createElement('span');
    num.className = 'nav-num';
    num.textContent = String(i + 1).padStart(2, '0');

    a.appendChild(num);
    a.appendChild(document.createTextNode(page.label));
    nav.appendChild(a);
  });

  document.body.appendChild(nav);
})();
