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
import { renderStickyCta } from '../partials/sticky-cta.js';

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
/* ---- The rolling label ----------------------------------------------------
   A label printed twice, one copy directly beneath the other inside a window
   exactly one copy tall. On hover the pair slides up, so the text appears to
   leave through the top while an identical copy arrives from underneath.

   Two copies rather than one word animating up and back, because the point of
   the effect is that the text is REPLACED rather than nudged: with one copy the
   label would vanish and return, and the gap would read as a flicker.

   The second copy is hidden from assistive technology. It is the same word, and
   without that a screen reader announces the link as "Home Home".

   Exported because three templates now build one: the nav here, the work card,
   and the previous/next links on a project page. Copying the markup into each
   would have meant three places to keep in step with the CSS, and the two have
   to agree exactly or the effect silently does nothing at all.

   Whatever wraps this must carry the `roll-trigger` class. That is what the CSS
   hangs the hover and focus states off; this markup on its own does nothing. */
export function rollLabel(label) {
  const text = escapeHtml(label);
  return `<span class="roll"><span class="roll__inner"><span class="roll__line">${text}</span><span class="roll__line" aria-hidden="true">${text}</span></span></span>`;
}

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

      return `        <li><a class="site-nav__link roll-trigger${accent}" href="${escapeHtml(item.href)}"${current}>${rollLabel(item.label)}</a></li>`;
    })
    .join('\n');

  /* Home is now an ordinary item in the list rather than a separate mark, so
     it gets the same current-page treatment and the same hover as everything
     else in the bar. */
  return `    <nav class="site-nav" aria-label="Main">
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
function renderHead({ title, description, path, ogType, ogImage, styles, extraHead, schema }) {
  const canonical = absoluteUrl(path);

  /* Every page gets a share image now. It used to be per-page or nothing, and
     "nothing" meant a link to the homepage posted anywhere rendered as a bare
     grey card with a domain on it. The brand share image is the floor; a page
     with something better to show, which in practice means a project page and
     its screenshot, overrides it. */
  const image = absoluteUrl(ogImage || SITE.ogImage);

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

  <meta property="og:type" content="${escapeHtml(ogType)}" />
  <meta property="og:site_name" content="${escapeHtml(SITE.name)}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${escapeHtml(canonical)}" />
  <meta property="og:locale" content="en_GB" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
  <meta name="twitter:card" content="summary_large_image" />

  <!-- The icon set, from the designer's logo suite. The site served a
       placeholder mark until this landed, which meant the one place the brand
       appears on every tab in a visitor's browser was the only place it was
       missing.

       SVG first: modern browsers take it and one file covers every size. The
       two PNGs are for the ones that do not, and favicon.ico sits at the root
       for the older still. The mask icon is Safari's pinned-tab silhouette,
       which is single-colour by design and takes the accent. -->
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png" />
  <link rel="icon" href="/favicon-16x16.png" sizes="16x16" type="image/png" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#00e1ff" />
  <link rel="manifest" href="/site.webmanifest" />

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

  <!-- The one script on the site allowed to block, and only because of what it
       does in its first line: it marks the document before anything is painted
       so the nav can start off screen. Deferred, it would paint the bar and
       then take it away, and every page load would open with a flinch. A few
       hundred bytes from this same origin. Blocked or missing, no rule that
       hides the nav ever matches and the bar is simply always there. -->
  <script src="/nav.js"></script>

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

  /* The routes that did not fit the top bar. Real links in the markup on every
     page, which is what makes /guides reachable by a crawler and by anyone who
     has scrolled to the bottom looking for more. */
  const links = SITE.footerNav
    .map(
      (item) =>
        `            <li><a class="site-footer__link" href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a></li>`,
    )
    .join('\n');

  return `    <footer class="site-footer">
      <div class="wrap site-footer__inner">
        <div class="site-footer__brand">
          <!-- The designer's horizontal lockup, the on-dark colour version,
               which is the primary. SVG rather than a PNG: it is the one logo
               in the markup and it should be sharp on every screen at a size
               nobody has to pick in advance. Decorative here, because the
               studio name is already in the line underneath it, so it carries
               an empty alt instead of saying "Picsel" to a screen reader twice
               in the same block.

               The width and height are the file's own, and the file was
               re-cropped to get them. It shipped as a 1017 square with the
               horizontal lockup floating in the middle of a lot of nothing,
               which meant a 136px-wide logo reserved a 136px-TALL box and left
               a hundred pixels of gap under it in the footer. The viewBox is
               now the artwork's real bounding box. -->
          <img class="site-footer__logo"
               src="/assets/brand/picsel-lockup-horizontal.svg"
               alt=""
               width="926"
               height="230"
               loading="lazy" />
          <p class="site-footer__contact">
            <a href="${escapeHtml(SITE.contact.phoneHref)}">${escapeHtml(SITE.contact.phoneDisplay)}</a>
            <a href="mailto:${escapeHtml(SITE.contact.email)}">${escapeHtml(SITE.contact.email)}</a>
          </p>
        </div>

        <div class="site-footer__end">
          <nav class="site-footer__nav" aria-label="Footer">
            <ul class="site-footer__list">
${links}
            </ul>
          </nav>
          <!-- No place name. This line named a county, and because it is the
               footer it did so on every page of the site at once, which made it
               the most repeated location claim in the markup and the one least
               likely to be re-read by anybody. What it says now is true
               wherever the studio is. -->
          <p class="site-footer__meta">
            ${escapeHtml(SITE.name)}. Websites for tradespeople, anywhere in the UK.
            &copy; ${year}
          </p>
        </div>
      </div>
    </footer>`;
}

/* Stamped once when the build module loads rather than per page, so a build
   running across midnight cannot produce two different years in one output. */
const FOOTER_YEAR = new Date().getFullYear();

/* Cloudflare Web Analytics. `defer` so it never competes with the page
   appearing, and nothing on the page depends on it loading at all.

   Not rendered while the token is a placeholder. A beacon pointing at no
   property is a request every visitor pays for and nobody reads. */
function renderAnalytics() {
  if (SITE.analytics.tokenIsPlaceholder) return '';
  return (
    '  <script defer src="https://static.cloudflareinsights.com/beacon.min.js" ' +
    `data-cf-beacon='{"token": "${escapeHtml(SITE.analytics.cloudflareToken)}"}'></script>\n`
  );
}

/**
 * Render a complete HTML document.
 *
 * @param {object}  page
 * @param {string}  page.title        Full <title>. Convention: "[Page] | Picsel", 60 chars max.
 * @param {string}  page.description  Meta description, 155 chars max.
 * @param {string}  page.path         Site-relative path, e.g. '/work/'. Drives canonical and nav highlighting.
 * @param {string}  page.content      The page body markup, dropped inside <main>.
 * @param {string} [page.bodyClass]   Extra class on <body> for page-specific styling.
 * @param {string} [page.ogType]      Open Graph type. 'website' unless the page is something
 *                                    else, which so far means a blog post, where it is 'article'.
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
    ogType = 'website',
    ogImage = null,
    styles = [],
    extraHead = '',
    extraScripts = '',
  } = page;

  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
${renderHead({ title, description, path, ogType, ogImage, styles, extraHead, schema: renderSchema(page) })}
</head>
<body${bodyClass ? ` class="${escapeHtml(bodyClass)}"` : ''}>
  <a class="skip-link" href="#main">Skip to content</a>

  <!-- The site-wide dot field: a fixed sheet behind every page, drawn by
       backdrop.js and parallaxing at a third of the scroll speed. Decoration
       with no meaning to convey, so it is hidden from assistive technology.
       If the script never runs, base.css's CSS dot layer shows through
       instead and the page still has its texture. -->
  <canvas class="backdrop" aria-hidden="true"></canvas>

  <!-- The trip wire for the nav: an empty strip down the top of the page, as
       tall as --nav-reveal. nav.js watches whether it is still on screen and
       brings the bar in when it is not. Nothing to see and nothing to say, so
       it is hidden from assistive technology. -->
  <div class="nav-sentinel" aria-hidden="true"></div>

${renderNav(path)}

  <main id="main" tabindex="-1">
${content}
  </main>

${renderFooter()}

${renderStickyCta()}

  <!-- type="module" so it can import the shared noise generator. Modules are
       deferred by default, so this never blocks the page from appearing. -->
  <script type="module" src="/backdrop.js"></script>
  <!-- Enhancement only: the bar above ships with the hidden attribute set,
       and this is what takes it off. type="module" purely for consistency
       with the other body scripts here; it imports nothing itself. -->
  <script type="module" src="/sticky-cta.js"></script>
  <!-- Counts phone taps and arrived enquiries for Picsel HQ, and nothing else:
       no cookie, no id, no page, no referrer. The key and the live hostname are
       attributes rather than constants in the file so that site.config.js stays
       the one place either fact is written.

       The hostname is what stops local dev and preview deploys inflating the
       count, and it is passed rather than hardcoded so it cannot disagree with
       SITE.origin. -->
  <script type="module" src="/hq-beacon.js"
          data-hq-key="${escapeHtml(SITE.hq.siteKey)}"
          data-hq-host="${escapeHtml(new URL(SITE.origin).hostname)}"></script>
${renderAnalytics()}${extraScripts ? `${extraScripts}\n` : ''}</body>
</html>
`;
}

export { escapeHtml, normalisePath };
