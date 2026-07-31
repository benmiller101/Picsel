/* ---- page.js — the shared page shell --------------------------------------
   Plain static HTML has no built-in way to share a <head> or a nav between
   pages: you either copy them into every file and watch the copies drift, or
   you generate the files from one template. This is that template.

   The output is ordinary HTML written to disk. Nothing here runs in the
   visitor's browser — by the time a page is served, the nav, the copy and the
   meta tags are already in the file. That is what keeps the promise that no
   content depends on JavaScript to appear. The build runs on Ben's machine,
   not on the visitor's.

   Every page on the site is rendered through renderPage(). If a tag belongs on
   every page, it belongs here — adding it once means it cannot be forgotten on
   page nine. */

import { SITE, absoluteUrl } from '../../site.config.js';
import { renderSchema } from './schema.js';

/* Page copy is written by hand, but it still passes through here on its way
   into an HTML attribute. An unescaped apostrophe or ampersand in a meta
   description silently truncates the tag; an unescaped angle bracket can break
   the document outright. Cheap to apply, so it is applied everywhere. */
function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ---- Nav ------------------------------------------------------------------
   Rendered as real markup, with the current page marked using aria-current so
   a screen reader announces "current page" rather than leaving a listener to
   infer it from a colour they cannot see.

   The prototype nav.js this replaced built its markup in JavaScript. That was
   fine for a page of visual experiments and wrong for a real site: it made the
   navigation invisible to anything that does not run scripts. */
function renderNav(currentPath) {
  const items = SITE.nav
    .map((item) => {
      /* Compared normalised, so '/work' and '/work/' are recognised as the
         same page rather than quietly failing to highlight. */
      const isCurrent = normalisePath(item.href) === normalisePath(currentPath);

      /* The accent item used to be excluded here, because a separate 'Contact'
         link pointed at the same page and marking both would have announced the
         current page twice. That second link is gone, so excluding it now just
         means someone on the contact page is told nothing at all about where
         they are. Every item that matches is marked. */
      const current = isCurrent ? ' aria-current="page"' : '';
      const accent = item.accent ? ' site-nav__link--accent' : '';

      return `        <li><a class="site-nav__link${accent}" href="${escapeHtml(item.href)}"${current}>${escapeHtml(item.label)}</a></li>`;
    })
    .join('\n');

  /* The home link is a round badge with a single P, set in the same face as
     the nav labels rather than the pixel display face. The wordmark used to sit
     here and it was the only thing in the bar in a different typeface, which
     read as two designs sharing a strip. The pixel face is not gone, it is
     rationed harder: it now appears on the hero and on project titles, where it
     has room to be the signature rather than a mismatch.

     The letter is decorative — a screen reader announcing "P" tells nobody
     anything — so it is hidden and the link carries its own label. */
  return `    <nav class="site-nav" aria-label="Main">
      <a class="site-nav__brand" href="/" aria-label="${escapeHtml(SITE.name)}, home">
        <span class="site-nav__badge" aria-hidden="true">${escapeHtml(SITE.name.charAt(0))}</span>
      </a>
      <ul class="site-nav__list">
${items}
      </ul>
    </nav>`;
}

/* Trailing slashes, casing and fragments are the three ways the same URL gets
   written differently. Normalising all of them means path comparisons behave —
   '/contact/#enquiry' and '/contact' are the same page and must be recognised
   as one, or the nav highlights nothing on the page it is sitting on. */
function normalisePath(path = '/') {
  const withoutFragment = String(path).split('#')[0].split('?')[0];
  const trimmed = withoutFragment.toLowerCase().replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
}

/* ---- Head -----------------------------------------------------------------
   Title, description, canonical, Open Graph and Twitter cards, plus the font
   links. Every page gets the full set; none of it is optional.

   Canonical matters more than it looks: it tells search engines which address
   is the real one for this page, so the same content reachable at two URLs is
   not read as two competing pages. */
function renderHead({ title, description, path, ogImage, styles, extraHead, schema }) {
  const canonical = absoluteUrl(path);
  const image = ogImage ? absoluteUrl(ogImage) : null;

  const imageTags = image
    ? `
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
  <meta name="twitter:card" content="summary_large_image" />`
    : `
  <meta name="twitter:card" content="summary" />`;

  return `  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />

  <!-- The site is dark-only. color-scheme tells the browser so, which makes it
       render scrollbars, form fields and other built-in controls dark to match
       instead of dropping bright white boxes into the page. theme-color tints
       the browser's own chrome on mobile, so the bar above the page is the
       same near-black rather than a hard white edge. -->
  <meta name="color-scheme" content="dark" />
  <meta name="theme-color" content="#0a0a0a" />

  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${escapeHtml(canonical)}" />

  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="${escapeHtml(SITE.name)}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${escapeHtml(canonical)}" />
  <meta property="og:locale" content="en_GB" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />${imageTags}

  <!-- The icon. Declaring it is also what stops the browser asking for
       /favicon.ico and getting a 404 on every page, which was the only error in
       the console anywhere on this site. SVG so one file covers every size. -->
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

  <!-- Adobe Fonts, web project ior4aly: argent-pixel-cf (the resting wordmark)
       plus the three faces the glitch rotates through. Served by Adobe while
       the Creative Cloud subscription is live — never self-hosted, per licence.

       These preconnects are not decoration. The wordmark is the homepage's
       largest contentful paint, so the whole measured load time waits on this
       stylesheet, the second sheet it imports from p.typekit.net, and then the
       font file itself. Opening the sockets while the HTML is still parsing
       takes the DNS lookup and TLS handshake off that critical path.
       use.typekit.net appears twice on purpose: it serves both the stylesheet,
       which is fetched without CORS, and the font files, which fonts always
       fetch with it. The two use separate connections, so both are warmed. -->
  <link rel="preconnect" href="https://use.typekit.net" />
  <link rel="preconnect" href="https://use.typekit.net" crossorigin />
  <link rel="preconnect" href="https://p.typekit.net" />
  <link rel="stylesheet" href="https://use.typekit.net/ior4aly.css" />

  <!-- Lexend carries every word of reading copy on the site. Pixelify Sans is
       the licence-independent safety net for the wordmark: if Typekit is
       unreachable the mark still renders as a pixel face instead of dropping
       to Courier. preconnect opens the connection early so the text is not
       waiting on a handshake. -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400..700&family=Lexend:wght@300;400&display=swap"
        rel="stylesheet" />

  <!-- Order matters: tokens defines the vocabulary, base uses it, the page
       sheet overrides. Swapping them silently breaks the cascade. -->
  <link rel="stylesheet" href="/tokens.css" />
  <link rel="stylesheet" href="/base.css" />
  <link rel="stylesheet" href="/site.css" />${styles
    .map((href) => `\n  <link rel="stylesheet" href="${escapeHtml(href)}" />`)
    .join('')}${extraHead ? `\n${extraHead}` : ''}

  <!-- Structured data: the machine-readable version of what this page already
       says in words. Rendered here rather than per page so that no page can be
       built without it. See templates/schema.js. -->
${schema}`;
}

/* ---- Footer ---------------------------------------------------------------
   Carries the phone number on every page. The audience is trades and small
   businesses, often on a phone — contact should never be more than one obvious
   tap away, wherever someone has got to. */
function renderFooter() {
  const year = FOOTER_YEAR;

  return `    <footer class="site-footer">
      <div class="wrap site-footer__inner">
        <p class="site-footer__contact">
          <a href="${escapeHtml(SITE.contact.phoneHref)}">${escapeHtml(SITE.contact.phoneDisplay)}</a>
          <a href="mailto:${escapeHtml(SITE.contact.email)}">${escapeHtml(SITE.contact.email)}</a>
        </p>
        <p class="site-footer__meta">
          ${escapeHtml(SITE.name)}. Web design and automation in ${escapeHtml(SITE.areaServed)}.
          &copy; ${year}
        </p>
      </div>
    </footer>`;
}

/* Stamped once when the build module loads rather than per page, so a build
   running across midnight cannot produce two different years in one output. */
const FOOTER_YEAR = new Date().getFullYear();

/**
 * Render a complete HTML document.
 *
 * @param {object}  page
 * @param {string}  page.title        Full <title>. Convention: "[Page] | Picsel", 60 chars max.
 * @param {string}  page.description  Meta description, 155 chars max.
 * @param {string}  page.path         Site-relative path, e.g. '/work/'. Drives canonical and nav highlighting.
 * @param {string}  page.content      The page body markup, dropped inside <main>.
 * @param {string} [page.bodyClass]   Extra class on <body> for page-specific styling.
 * @param {string} [page.ogImage]     Site-relative image path for social previews.
 * @param {string[]} [page.styles]    Page-specific stylesheets, loaded after site.css.
 *                                    Only the pages that need a sheet load it — hero.css
 *                                    is 8KB of blob and glitch styling that the contact
 *                                    page has no use for.
 * @param {string} [page.extraHead]   Additional head markup, e.g. a robots tag.
 * @param {string} [page.schemaType]  A more specific schema.org type than WebPage.
 * @param {object[]} [page.schemaExtra] Extra JSON-LD nodes for this page's @graph.
 * @param {string} [page.extraScripts] Script tags for the end of <body>. Enhancement only.
 * @returns {string} A complete HTML document.
 */
export function renderPage(page) {
  const {
    title,
    description,
    path,
    content,
    bodyClass = '',
    ogImage = null,
    styles = [],
    extraHead = '',
    extraScripts = '',
  } = page;

  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
${renderHead({ title, description, path, ogImage, styles, extraHead, schema: renderSchema(page) })}
</head>
<body${bodyClass ? ` class="${escapeHtml(bodyClass)}"` : ''}>
  <a class="skip-link" href="#main">Skip to content</a>

  <!-- The site-wide dot field: a fixed sheet behind every page, drawn by
       backdrop.js and parallaxing at a third of the scroll speed. Decoration
       with no meaning to convey, so it is hidden from assistive technology.
       If the script never runs, base.css's CSS dot layer shows through
       instead and the page still has its texture. -->
  <canvas class="backdrop" aria-hidden="true"></canvas>

${renderNav(path)}

  <main id="main" tabindex="-1">
${content}
  </main>

${renderFooter()}

  <!-- type="module" so it can import the shared noise generator. Modules are
       deferred by default, so this never blocks the page from appearing. -->
  <script type="module" src="/backdrop.js"></script>
${extraScripts ? `${extraScripts}\n` : ''}</body>
</html>
`;
}

export { escapeHtml, normalisePath };
