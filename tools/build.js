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
import { HOME_PAGE } from './pages/home.js';
import { WORK_PAGE } from './pages/work.js';
import { PROJECT_PAGES } from './pages/project.js';
import { CONTACT_PAGE, CONTACT_SENT_PAGE } from './pages/contact.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/* Search engines truncate past these, so anything longer is written but never
   read. Treated as hard limits rather than guidance. */
const TITLE_MAX = 60;
const DESCRIPTION_MAX = 155;

/* ---- The page list --------------------------------------------------------
   Every route on the site. The Sitemap Law says a route that exists must be in
   sitemap.xml in the same commit that creates it — generating both from this
   one list is what makes obeying it automatic rather than a thing to remember.

   Project pages are not listed individually: they are generated from
   projects.js, so adding a project adds a route, a page and a sitemap entry
   without this file changing at all. */
const PAGES = [
  HOME_PAGE,
  WORK_PAGE,
  ...PROJECT_PAGES,
  CONTACT_PAGE,
  CONTACT_SENT_PAGE,
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
      `Domain is still the placeholder ${SITE.origin}. Canonical, Open Graph, sitemap and the ` +
        "enquiry form's no-JavaScript redirect will all be wrong until site.config.js is updated. " +
        'Do not deploy to production like this.',
    );
  }

  /* Same class of problem as the placeholder domain, and quieter: the contact
     page builds and validates perfectly with an unset key, and every enquiry is
     rejected by Web3Forms the moment someone tries to send one. Nothing on the
     page can show that, so the build says it on every run. */
  if (SITE.form.accessKeyIsPlaceholder) {
    warnings.push(
      'Web3Forms access key is still a placeholder. The enquiry form on /contact/ will render ' +
        'and validate, but no submission will reach anyone. Paste the real key into site.config.js.',
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
  await writeRobots();

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

/* ---- robots.txt -----------------------------------------------------------
   Generated rather than hand-written for one reason: the Sitemap line needs an
   absolute URL, and a hand-written file would still be pointing at
   picsel.example long after site.config.js was corrected. Same origin, same
   build, so the two can never disagree.

   Everything is allowed. That is a decision, not a default:

   - /contact/sent/ is the only page that should stay out of search, and it
     carries a noindex tag instead of a Disallow. Those are not two ways of
     doing the same thing. Disallow stops a crawler FETCHING the page, which
     means it never reads the noindex — so a page linked from anywhere else can
     still be indexed, listed with no description, and never removed. Letting it
     be crawled is what lets the noindex work.
   - AI crawlers are covered by allowing everything, and Section 10 revisits
     them by name once that decision is made deliberately. */
async function writeRobots() {
  const robots = `# ${SITE.name}. Format reference:
# https://developers.google.com/search/docs/crawling-indexing/robots/intro
# Generated by tools/build.js. Do not edit by hand; edit site.config.js.

User-agent: *
Allow: /

Sitemap: ${absoluteUrl('/sitemap.xml')}
`;

  await writeFile(join(ROOT, 'robots.txt'), robots, 'utf8');
}

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
