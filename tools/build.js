/* ---- build.js — turns the templates into plain HTML files -----------------
   Run with `npm run build`. Reads the page list, renders each through the
   shared shell in templates/page.js, and writes finished HTML to disk.

   This is a build step, not a framework. It runs on Ben's machine and its
   output is ordinary static files that Cloudflare Pages serves directly — no
   server, no runtime, nothing for the visitor's browser to execute before the
   page appears. The only thing it buys is that the <head>, the nav and the
   footer exist once in source instead of being copy-pasted into every page and
   drifting apart.

   The checks at the end are the point of doing it this way at all. A human
   cannot reliably keep nine titles unique and under sixty characters; a script
   checks it every single run and refuses to let a duplicate through. */

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SITE, absoluteUrl } from '../site.config.js';
import { renderPage } from './templates/page.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/* Search engines truncate past these, so anything longer is written but never
   read. Treated as hard limits rather than guidance. */
const TITLE_MAX = 60;
const DESCRIPTION_MAX = 155;

/* ---- The page list --------------------------------------------------------
   Every route on the site. The Sitemap Law says a route that exists must be in
   sitemap.xml in the same commit that creates it — generating both from this
   one list is what makes obeying it automatic rather than a thing to remember.

   Project pages are not listed here: they are generated from projects.js in
   Section 6, so adding a project never means editing this file. */
const PAGES = [
  {
    path: '/',
    title: 'Picsel — web design and automation in Cornwall',
    description:
      'Picsel is a web design and automation studio in Cornwall, building affordable, effective websites for local trades and small businesses.',
    /* Opts the page out of the gap base.css reserves under the floating nav:
       the hero is a full-screen composition that starts at the very top and
       deliberately runs behind the nav. */
    bodyClass: 'page-hero',
    /* Only this page loads the hero's styling and its animation. The contact
       page has no blobs to draw and should not pay for the code that draws
       them. */
    styles: ['/hero.css'],
    /* defer: the script waits for the page to be parsed and never blocks it
       from appearing. Everything it does is decoration — with the file
       missing, blocked or still loading, the homepage is a complete, readable
       page. */
    extraScripts: '  <script src="/hero.js" defer></script>',
    content: `    <section class="hero" id="hero">
      <!-- The pinned screen. The section around it is taller, and that extra
           height is the distance the reverse intro is scrubbed over. -->
      <div class="hero__stage">
        <!-- Layer 0: dot-grid texture. A halftone of a flowing noise field,
             kept near-invisible. Distinct from the site-wide dot backdrop in
             base.css: this one is drawn, drifts with the blobs and belongs to
             the hero; that one is fixed behind every page. -->
        <canvas id="dotgrid" class="hero-dots" aria-hidden="true"></canvas>

        <!-- Layer 1: lava-lamp blobs, drawn by hero.js on a low-resolution
             pixel grid — a canvas one eighth of the screen's size, scaled back
             up with hard edges, so the blobs are displayed at a small
             resolution rather than smoothed and then pixelated. See BLOBS and
             PIXEL in its config block. -->
        <canvas id="blobs" class="hero-blobs" aria-hidden="true"></canvas>

        <!-- Layer 2: the wordmark, and the page's one h1. The letters are
             split into spans so the glitch can re-font them individually,
             which would make a screen reader spell the word out letter by
             letter — so the spans are hidden from it and the real heading text
             is carried by the visually-hidden line above them. Seen: a pixel
             wordmark. Heard: "Picsel — Design Studio". -->
        <h1 class="hero-mark">
          <span class="visually-hidden">Picsel — Design Studio</span>
          <span class="wordmark" id="wordmark" aria-hidden="true">PICSEL</span>
          <span class="tagline" id="tagline" aria-hidden="true">Design Studio</span>
        </h1>

        <p class="hero__cue" aria-hidden="true">Scroll</p>
      </div>
    </section>

    <div class="wrap section">
      <!-- The first thing after the hero, and deliberately plain: who Picsel
           is, what it does and where, in the first breath. Section 4 builds
           the rest of the homepage around this. -->
      <p class="lede">
        Picsel is a web design and automation studio in Cornwall. We build affordable,
        effective websites for local trades and small businesses — and the search work and
        custom tools that keep them earning.
      </p>
    </div>`,
  },
  {
    path: '/shell-check/',
    title: 'Shell check | Picsel',
    description:
      'Internal build check showing the shared page shell and the design system: type scale, colour, buttons and the drifting backdrop. Not linked from the site.',
    /* Kept out of sitemap.xml — it is a build artefact, not a page for
       visitors. Omitting it from the sitemap is not enough on its own though:
       a page is still reachable and indexable if anything ever links to it,
       so it carries an explicit noindex as well.
       TEMPORARY — delete this page once the homepage exists in Section 4. */
    excludeFromSitemap: true,
    /* The layout below is inline rather than in a stylesheet because this page
       is temporary and nothing else uses it — a proof-sheet.css that gets
       deleted in two sections would be a file for the sake of a rule. Every
       value still comes from tokens.css. */
    extraHead: `  <meta name="robots" content="noindex, nofollow" />
  <style>
    .proof {
      display: grid;
      gap: var(--space-12);
      margin-top: var(--space-16);
      padding-top: var(--space-12);
      border-top: 1px solid var(--line);
    }
    /* Two columns from tablet up, so the page is not one centred stack — the
       layout being checked has to be a real one. */
    @media (min-width: 48rem) {
      .proof { grid-template-columns: 2fr 1fr; align-items: start; }
      .proof__block:first-child { grid-row: span 2; }
    }
    .proof__block > * + * { margin-top: var(--space-4); }
    .proof__block h2 { margin-bottom: var(--space-2); }
    .proof__block p { max-width: var(--measure); }
    .proof__caption { font-size: var(--text-sm); color: var(--ink-faint); }
    .proof__actions { display: flex; flex-wrap: wrap; gap: var(--space-3); }
    .proof__swatches {
      display: grid;
      gap: var(--space-3);
      margin: 0;
      padding: 0;
      list-style: none;
      font-size: var(--text-sm);
      color: var(--ink-faint);
    }
    .proof__swatches li { display: flex; align-items: center; gap: var(--space-3); }
    .proof__swatch {
      width: 2.5rem;
      height: 2.5rem;
      border: 1px solid var(--line);
      border-radius: var(--radius-sm);
    }
  </style>`,
    /* A proof sheet rather than a blank page: every part of the design system
       shown at once, so a look at this one page says whether the type scale,
       the palette, the buttons and the backdrop are right. Deleted along with
       the page itself once the homepage exists in Section 4. */
    content: `    <div class="wrap section">
      <p class="eyebrow">Internal build check</p>
      <h1 class="display">Picsel</h1>
      <p class="lede">
        This page is not part of the site. It exists so the shared shell and the design
        system can be looked at in one place: the nav above, the footer below, the type
        scale, the one accent colour, and the dot field drifting behind all of it.
      </p>

      <div class="proof">
        <section class="proof__block">
          <h2>Type scale</h2>
          <p>
            Headings are Lexend. The pixel face is reserved for the wordmark and the
            occasional big title, because it is genuinely hard to read at length.
          </p>
          <h3>A third-level heading</h3>
          <p>
            Body copy sits at 17 pixels with generous line spacing. Light text on a dark
            background bleeds slightly into it, and the extra room between lines is what
            keeps a paragraph comfortable rather than dense. This paragraph is capped at a
            reading width so the eye can find the start of the next line without hunting
            for it.
          </p>
          <p class="proof__caption">Caption and metadata sit here, one step quieter.</p>
        </section>

        <section class="proof__block">
          <h2>Actions</h2>
          <p>
            Two button styles and no more. The accent is the cyan already thrown by the
            wordmark&rsquo;s glitch, and it marks one thing per screen.
          </p>
          <p class="proof__actions">
            <a class="btn btn--primary" href="/contact/#enquiry">Get in touch</a>
            <a class="btn btn--secondary" href="/work/">See the work</a>
          </p>
        </section>

        <section class="proof__block">
          <h2>Colour</h2>
          <ul class="proof__swatches">
            <li><span class="proof__swatch" style="background: var(--bg)"></span>Page</li>
            <li><span class="proof__swatch" style="background: var(--bg-raised)"></span>Raised</li>
            <li><span class="proof__swatch" style="background: var(--ink)"></span>Ink</li>
            <li><span class="proof__swatch" style="background: var(--accent)"></span>Accent</li>
          </ul>
        </section>
      </div>
    </div>`,
  },
];

async function build() {
  const warnings = [];
  const errors = [];

  /* The domain is still a placeholder, which means every canonical tag, Open
     Graph URL and sitemap entry currently points somewhere that does not
     exist. Harmless locally and actively damaging in production, so it warns
     on every run until the real domain is set in site.config.js. */
  if (SITE.originIsPlaceholder) {
    warnings.push(
      `Domain is still the placeholder ${SITE.origin}. Canonical, Open Graph and sitemap URLs ` +
        'will be wrong until site.config.js is updated. Do not deploy to production like this.',
    );
  }

  const seenTitles = new Map();
  const seenDescriptions = new Map();
  const rendered = [];

  for (const page of PAGES) {
    /* Duplicate titles and descriptions make two pages compete for the same
       search result, and neither wins. Checked rather than trusted. */
    if (seenTitles.has(page.title)) {
      errors.push(`Duplicate title "${page.title}" on ${page.path} and ${seenTitles.get(page.title)}`);
    }
    seenTitles.set(page.title, page.path);

    if (seenDescriptions.has(page.description)) {
      errors.push(
        `Duplicate meta description on ${page.path} and ${seenDescriptions.get(page.description)}`,
      );
    }
    seenDescriptions.set(page.description, page.path);

    if (page.title.length > TITLE_MAX) {
      errors.push(`Title too long on ${page.path}: ${page.title.length}/${TITLE_MAX} chars`);
    }
    if (page.description.length > DESCRIPTION_MAX) {
      errors.push(
        `Meta description too long on ${page.path}: ${page.description.length}/${DESCRIPTION_MAX} chars`,
      );
    }

    /* One <h1> per page, no more and no fewer. It is the page's single
       statement of what it is, and search engines and screen readers both
       lean on it. */
    const headingCount = (page.content.match(/<h1[\s>]/g) || []).length;
    if (headingCount !== 1) {
      errors.push(`${page.path} has ${headingCount} <h1> elements — every page needs exactly one`);
    }

    /* Rendered now but deliberately NOT written yet — see below. */
    rendered.push({
      page,
      html: renderPage(page),
      /* '/work/' becomes 'work/index.html', so the address stays clean rather
         than ending in a visible .html. */
      outPath: join(ROOT, page.path.replace(/^\/+/, ''), 'index.html'),
    });
  }

  for (const warning of warnings) console.warn(`  WARN   ${warning}`);

  /* Every page is validated before any page is written. Validating and writing
     in the same pass would leave a half-built site on disk whenever a check
     failed — the good pages updated, the broken one written anyway, and the
     dev server happily serving the result. Nothing is written unless all of it
     is sound. */
  if (errors.length) {
    for (const error of errors) console.error(`  ERROR  ${error}`);
    /* A non-zero exit stops a broken build from being deployed, and will fail
       CI once that is wired up. Warnings do not stop the build; errors do. */
    process.exitCode = 1;
    console.error(`\nBuild failed with ${errors.length} error(s). Nothing was written.`);
    return;
  }

  for (const { page, html, outPath } of rendered) {
    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, html, 'utf8');
    console.log(`  built  ${page.path.padEnd(20)} -> ${page.path.replace(/^\/+/, '')}index.html`);
  }

  const listed = await writeSitemap(rendered);

  console.log(
    `\nBuilt ${PAGES.length} page(s), ${listed} in sitemap.xml` +
      `${warnings.length ? `, with ${warnings.length} warning(s)` : ''}.`,
  );
}

/* ---- sitemap.xml ----------------------------------------------------------
   THE SITEMAP LAW: every route that exists is in sitemap.xml in the same commit
   that creates it. The reliable way to obey a law like that is to make it
   impossible to break — the sitemap is written from the same list the pages
   are, on every build, so a route cannot exist without being listed. There is
   no separate file to remember to update, because remembering is exactly what
   fails.

   Opting out is deliberate and rare: the shell-check proof sheet is a build
   artefact, not a page for visitors, and carries a noindex tag as well. */
async function writeSitemap(rendered) {
  const entries = rendered.filter(({ page }) => !page.excludeFromSitemap);

  /* lastmod is the build date rather than a per-page one. Faking a precise
     modification date per page — which nothing here tracks — would be telling
     search engines something untrue about content that has not changed.
     Date only, no time: this is a build stamp, not a timestamp. */
  const lastmod = new Date().toISOString().slice(0, 10);

  const urls = entries
    .map(
      ({ page }) => `  <url>
    <loc>${absoluteUrl(page.path)}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`,
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

  await writeFile(join(ROOT, 'sitemap.xml'), xml, 'utf8');
  return entries.length;
}

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
