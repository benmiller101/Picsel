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
import { PROJECTS } from '../projects.js';
import { PLANS, money } from '../pricing.js';
import { renderPage } from './templates/page.js';
import { HOME_PAGE } from './pages/home.js';
import { WORK_PAGE } from './pages/work.js';
import { PROJECT_PAGES } from './pages/project.js';
import { PRICES_PAGE } from './pages/prices.js';
import { GUIDES_INDEX_PAGE, GUIDE_PAGES } from './pages/guides.js';
import { BLOG_INDEX_PAGE, BLOG_PAGES } from './pages/blog.js';
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
   without this file changing at all. The guides work the same way, from the
   list in pages/guides.js. */
const PAGES = [
  HOME_PAGE,
  WORK_PAGE,
  ...PROJECT_PAGES,
  PRICES_PAGE,
  GUIDES_INDEX_PAGE,
  ...GUIDE_PAGES,
  BLOG_INDEX_PAGE,
  ...BLOG_PAGES,
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
    const html = renderPage(page);
    errors.push(...findStrayContactDetails(html, page.path));
    errors.push(...findLooseExclusivityClaim(html, page.path));
    errors.push(...findLocationClaims(html, page.path));

    rendered.push({
      page,
      html,
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
  await writeLlmsTxt(rendered);
  await writeWebManifest();

  console.log(
    `\nBuilt ${PAGES.length} page(s), ${listed} in sitemap.xml` +
      `${warnings.length ? `, with ${warnings.length} warning(s)` : ''}.`,
  );
}

/* ---- Entity consistency ---------------------------------------------------
   The GEO rules require one studio name, one phone number and one email
   everywhere, on the site and off it. Search engines and assistants treat an
   inconsistent number as a hint that two different businesses might be
   involved, and the damage is invisible: the page looks fine, and the only
   symptom is that a machine trusts you slightly less.

   Everything already reads from site.config.js, so today this check passes by
   construction. It exists for the day somebody types a number straight into a
   page because it was quicker, which is exactly the kind of edit nobody
   reviews. Cheap to run on every build; impossible to remember otherwise. */
function findStrayContactDetails(html, path) {
  const errors = [];

  const allowedPhones = new Set([
    SITE.contact.phoneDisplay,
    SITE.contact.phoneHref.replace(/^tel:/, ''),
    /* The display number without its space, which is how it appears once
       written into a tel: link's text by some formatters. */
    SITE.contact.phoneDisplay.replace(/\s+/g, ''),
  ]);

  /* UK mobile and landline shapes, spaced or not, plus the +44 form. */
  for (const match of html.matchAll(/\+44\d{9,10}|\b0\d{3,4}\s?\d{6,7}\b/g)) {
    if (!allowedPhones.has(match[0])) {
      errors.push(
        `${path} contains the phone number ${match[0]}, which is not the one in site.config.js ` +
          `(${SITE.contact.phoneDisplay}). One business, one number.`,
      );
    }
  }

  /* Requires a real letter TLD, so the Google Fonts URL's "wght@400..700" is
     not mistaken for an address. */
  for (const match of html.matchAll(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi)) {
    if (match[0].toLowerCase() !== SITE.contact.email.toLowerCase()) {
      errors.push(
        `${path} contains the email ${match[0]}, which is not the one in site.config.js ` +
          `(${SITE.contact.email}).`,
      );
    }
  }

  return errors;
}

/* ---- The exclusivity promise ----------------------------------------------
   One trade per patch is a contractual promise and it applies on the Growth
   plan only. Printed without that condition it becomes a promise the business
   has explicitly decided not to make, to every customer including the £15 one.

   That is not a hypothetical failure. The site carried "One client per trade,
   per town" with no conditions on it for months, in two places, and it was
   wrong in two different ways at once: the contract says a patch rather than a
   town, and it was never offered to everyone.

   The wording lives in SITE.exclusivity so there is one copy of it. This check
   is the other half: a page may not mention the patch promise unless the word
   Growth is on the same page. It catches the specific way this goes wrong,
   which is somebody shortening the sentence to fit a card. */
function findLooseExclusivityClaim(html, path) {
  if (!/per patch/i.test(html)) return [];
  if (/\bGrowth\b/.test(html)) return [];

  return [
    `${path} states the one-trade-per-patch promise without naming the Growth plan. That ` +
      'promise is Growth-only. Use SITE.exclusivity.full or SITE.exclusivity.short, both of ' +
      'which carry the condition.',
  ];
}

/* ---- Location claims ------------------------------------------------------
   Picsel serves the whole UK and names no place of its own. Ben moves to
   Edinburgh within three months, so any county in the copy is a fact with an
   expiry date on it, and the ones that hide in a schema block or a meta
   description are the ones that will still be there in a year.

   The subtlety is that client locations are TRUE and must stay: a case study
   saying a builder works in Hayle is a fact about that builder. So everything
   the project records contribute is removed from the page before the check
   runs, and the terms are hunted in what is left. A place name surviving that
   is a place name being claimed by the studio. */
const CLIENT_TERMS = ['cornwall', 'cornish', 'devon', 'truro', 'falmouth', 'newquay', 'hayle', 'penzance', 'south west'];
const STUDIO_TERMS = ['based in', 'local to', 'near you', 'in your area'];

function findLocationClaims(html, path) {
  /* Every string a project contributes to the page, in both the raw and the
     HTML-escaped form, since the same blurb appears escaped in the body and
     unescaped inside the JSON-LD.

     Two of these are less obvious than they look and both were found by this
     check firing on a page that was correct:

       slug   "house-of-cornwall" is the client's own name in a URL, and it
              appears in every link, every image path and every breadcrumb that
              points at them.
       blurb  Split into sentences as well as taken whole, because the project
              page's meta description is derived from the first sentence rather
              than copied from the blurb entire. */
  let remaining = html;
  for (const project of PROJECTS) {
    /* NOTE the location is NOT in this list on its own, and that is the whole
       subtlety of this check.

       It was, once. AJC's location is the single word "Cornwall", so stripping
       project values blind removed every "Cornwall" from every page of the
       site — including one sitting in a footer comment that shipped on all
       sixteen. The check passed on a page that was wrong, which is worse than
       having no check.

       So the location is only forgiven in the two places it is actually
       rendered: the eyebrow on the client's own page, and the `about` name in
       that page's schema. Anywhere else, a location is a location. */
    /* The eyebrow is built from separately-escaped parts with a literal
       &middot; between them, so the string on the page is
       "Removals &amp; clearance &middot; Cornwall". Escaping that whole
       sentence again would give &amp;amp; and match nothing. The schema's
       `about` name is raw inside the JSON. Both forms, built the way each
       template builds it. */
    const eyebrow = `${escapeForCheck(project.sector)} &middot; ${escapeForCheck(project.location)}`;
    const schemaAbout = `${project.sector} in ${project.location}`;

    const values = [
      project.name,
      eyebrow,
      schemaAbout,
      escapeForCheck(schemaAbout),
      project.sector,
      project.blurb,
      ...project.blurb.split(/(?<=\.)\s+/),
      project.alt,
      project.url,
      project.slug,
    ];

    /* Longest first, and this is not tidiness. Stripping the short values
       first mangles the long ones: removing the location "Cornwall" from the
       page turns the blurb into "...covering , Devon and beyond", which then
       fails to match the blurb it came from, and Devon survives into the
       check as a false positive. Remove the biggest strings while they are
       still intact. */
    for (const value of values.sort((a, b) => String(b).length - String(a).length)) {
      if (!value) continue;
      for (const variant of new Set([value, escapeForCheck(value)])) {
        remaining = remaining.split(variant).join(' ');
      }
    }
  }

  const errors = [];
  for (const term of [...CLIENT_TERMS, ...STUDIO_TERMS]) {
    if (new RegExp(`\\b${term}\\b`, 'i').test(remaining)) {
      errors.push(
        `${path} claims a location for Picsel: "${term}". The studio is UK-wide and names no ` +
          'place of its own. Client locations belong in projects.js and are allowed there.',
      );
    }
  }
  return errors;
}

/* The same escaping page.js applies, duplicated here rather than imported
   because importing it would tie a build check to a template's internals. */
function escapeForCheck(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
   - AI crawlers are named individually and allowed. That is Section 10's
     decision rather than an accident of the wildcard. See AI_CRAWLERS. */
async function writeRobots() {
  /* Naming them is not redundant with the wildcard. A crawler that matches its
     own group ignores the wildcard group completely, so a site that later
     restricts `*` would cut these off without anyone intending it. Listing
     them makes the permission explicit and survives that change.

     The decision itself is easy for this business: Picsel sells being the
     answer when someone asks an assistant instead of searching. Blocking the
     assistants would mean refusing the studio the very thing it sells. */
  const aiGroups = AI_CRAWLERS.map(
    ({ agent, who }) => `# ${who}\nUser-agent: ${agent}\nAllow: /\n`,
  ).join('\n');

  const robots = `# ${SITE.name}. Format reference:
# https://developers.google.com/search/docs/crawling-indexing/robots/intro
# Generated by tools/build.js. Do not edit by hand; edit site.config.js.

User-agent: *
Allow: /

# AI crawlers, named deliberately rather than left to the wildcard above.
# Picsel wants to be the answer an assistant gives, so all of them are allowed.
${aiGroups}
Sitemap: ${absoluteUrl('/sitemap.xml')}
`;

  await writeFile(join(ROOT, 'robots.txt'), robots, 'utf8');
}

/* ---- site.webmanifest -----------------------------------------------------
   Small, and it is what makes the two android-chrome icons in the logo suite
   mean anything: without a manifest naming them they are two files nobody ever
   requests, and a phone saving the site to a home screen falls back to a
   screenshot of the page.

   Generated rather than hand-written so the name and the theme colour cannot
   drift from site.config.js and the meta tag in page.js. display is "browser"
   on purpose: this is a website, not an app pretending to be one, and standalone
   would take away the address bar from someone who never asked for that. */
async function writeWebManifest() {
  const manifest = {
    name: SITE.name,
    short_name: SITE.name,
    description: SITE.description,
    start_url: '/',
    display: 'browser',
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
    icons: [
      { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  };

  await writeFile(join(ROOT, 'site.webmanifest'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

/* ---- llms.txt -------------------------------------------------------------
   A plain-text summary of the site for an assistant that has landed on it and
   wants the shape of the place without parsing nine pages of markup. The
   convention is young and no crawler is obliged to read it, which is exactly
   why it is generated rather than hand-written: it costs nothing per build, and
   a file nobody maintains is worse than no file at all.

   Every fact in it comes from the same constants the pages do, so it cannot
   describe a different business from the one the site describes. That is the
   entity-consistency rule applied to a file no human will ever read. */
async function writeLlmsTxt(rendered) {
  const projectLines = PROJECTS.map(
    (project) =>
      `- [${project.name}](${absoluteUrl(`/work/${project.slug}/`)}): ${project.sector} in ` +
      `${project.location}. Live site: ${project.url}`,
  ).join('\n');

  /* Built from the real page list, so a new route appears here on the build
     that creates it, exactly as it does in sitemap.xml. The confirmation page
     opts out of both for the same reason. */
  const pageLines = rendered
    .filter(({ page }) => !page.excludeFromSitemap)
    .map(({ page }) => `- [${page.title}](${absoluteUrl(page.path)}): ${page.description}`)
    .join('\n');

  const llms = `# ${SITE.name}

> ${SITE.description}

Contact: ${SITE.contact.person}, ${SITE.contact.phoneDisplay}, ${SITE.contact.email}
Area served: ${SITE.areaServed}

${SITE.name} is a new studio. It has built ${PROJECTS.length} live sites, all listed below, and
makes no claims about client numbers, years in business or awards, because it has
none to make. Anything stated here can be checked against the live sites.

## What the studio does

- Websites for tradespeople and small businesses, anywhere in the UK
- Search work, both Google and AI assistants
- Google Business Profile setup and upkeep
- Custom automation tools for repetitive office work
- ${SITE.exclusivity.short}

## What it costs

${PLANS.map(
  (plan) =>
    `- ${plan.name}: ${money(plan.build)} to build, then ${money(plan.monthly)} a month. ${plan.summary}`,
).join('\n')}

Full prices, including what each plan does not cover, are at ${absoluteUrl('/prices/')}.

## Work

${projectLines}

## Pages

${pageLines}
`;

  await writeFile(join(ROOT, 'llms.txt'), llms, 'utf8');
}

/* The assistants and the crawlers that feed them. `who` is spelled out because
   a bare column of user-agent strings is unreadable in six months, and the
   whole point of naming them is that the decision stays legible. */
const AI_CRAWLERS = [
  { agent: 'GPTBot', who: 'OpenAI, training and browsing' },
  { agent: 'OAI-SearchBot', who: 'OpenAI, search index' },
  { agent: 'ChatGPT-User', who: 'OpenAI, fetching a page a user asked about' },
  { agent: 'ClaudeBot', who: 'Anthropic' },
  { agent: 'Claude-User', who: 'Anthropic, fetching a page a user asked about' },
  { agent: 'PerplexityBot', who: 'Perplexity' },
  { agent: 'Google-Extended', who: 'Google, Gemini and AI Overviews' },
  { agent: 'Applebot-Extended', who: 'Apple Intelligence' },
];

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
