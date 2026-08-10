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

import { SITE, absoluteUrl, REVIEWS_URL_IS_PLACEHOLDER } from '../site.config.js';
import { PROJECTS } from '../projects.js';
import { REVIEWS } from '../reviews.js';
import { PLANS, money } from '../pricing.js';
import { renderPage } from './templates/page.js';
import { HOME_PAGE } from './pages/home.js';
import { WORK_PAGE } from './pages/work.js';
import { PROJECT_PAGES } from './pages/project.js';
import { PRICES_PAGE } from './pages/prices.js';
import { SERVICES_INDEX_PAGE, SERVICE_PAGES } from './pages/services.js';
import { GUIDES_INDEX_PAGE, GUIDE_PAGES } from './pages/guides.js';
import { BLOG_INDEX_PAGE, BLOG_PAGES } from './pages/blog.js';
import { CONTACT_PAGE, CONTACT_SENT_PAGE } from './pages/contact.js';
import { ABOUT_PAGE } from './pages/about.js';
import { PRIVACY_PAGE } from './pages/privacy.js';
import { NOT_FOUND_PAGE } from './pages/not-found.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/* Search engines truncate past these, so anything longer is written but never
   read. Treated as hard limits rather than guidance.

   The description has a floor as well as a ceiling, and the floor is the one
   that gets broken. A short description is not truncated, it is REPLACED:
   Google decides the tag is not worth showing and writes its own snippet out
   of the page, which is how a page ends up in the results described by a
   sentence nobody chose.

   The floor warns where the ceiling errors, and that asymmetry is a decision
   rather than a half-finished check. Going over the maximum wastes characters
   that were written and will never be read, and the fix is always to cut. A
   short description is a judgement: fifteen of the eighteen pages here are
   under 150 today, several of them because the honest sentence about that page
   is simply shorter than 150 characters, and padding a description to clear a
   number produces exactly the filler the snippet is meant to avoid. So the
   build says so on every run and leaves the writing to a person.

   A page can waive the floor with `descriptionFloorWaived`, and exactly one
   does. The floor exists because Google replaces a short description with its
   own snippet in the search results, so the cost of being under it is losing
   control of how the page is described to someone deciding whether to click.
   /contact/sent/ is a thank-you page that nobody should ever reach from a
   search result: it is noindex, it is only arrived at by submitting a form,
   and there is no click to lose. A warning that can never be acted on is a
   warning that teaches people to ignore the warnings, which is the real cost
   of leaving it in. Waiving is a claim about the page, not a way to skip the
   writing, so it needs a reason each time. */
const TITLE_MAX = 60;
const DESCRIPTION_MIN = 150;
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
  /* The money pages, before the content pages, which is the order CLAUDEseo
     section 2 asks for and the order this list should read in. */
  SERVICES_INDEX_PAGE,
  ...SERVICE_PAGES,
  PRICES_PAGE,
  GUIDES_INDEX_PAGE,
  ...GUIDE_PAGES,
  BLOG_INDEX_PAGE,
  ...BLOG_PAGES,
  CONTACT_PAGE,
  CONTACT_SENT_PAGE,
  ABOUT_PAGE,
  PRIVACY_PAGE,
  NOT_FOUND_PAGE,
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

  /* Same shape of quiet failure as the form key: the script tag renders, the
     pages look right, and no visit is ever counted. */
  if (SITE.analytics.tokenIsPlaceholder) {
    warnings.push(
      'Cloudflare Web Analytics token is still a placeholder, so no visits are being counted. ' +
        'Paste the real token into site.config.js. The script is not rendered until you do.',
    );
  }

  /* Deliberately worded differently from the warning above, because the
     behaviour is deliberately different. The analytics beacon is suppressed
     while its token is fake; this one still fires. A wrong key produces a hit
     that HQ files under "reporting a key nobody holds", which is how a wrong
     key is told apart from a beacon that never fired at all. Suppressing it
     would remove the only signal that says which of those two happened. */
  if (SITE.hq.keyIsPlaceholder) {
    warnings.push(
      'Picsel HQ site key is still a placeholder, so calls and enquiries are being counted ' +
        "against a key nobody holds. The beacon still fires, on purpose: that is what HQ's " +
        'unmatched-key panel is for. Paste the real key from HQ, Settings, Data, into site.config.js.',
    );
  }

  /* Not the quiet failure the two above are, and the wording says so: the
     reviews partial reads the same constant and renders the sentence without
     an anchor while this is true, so nobody lands on a Google Maps error. What
     is missing is the proof, which is the whole point of the section, so this
     stays a warning on every build until the real link is pasted in. */
  if (REVIEWS_URL_IS_PLACEHOLDER) {
    warnings.push(
      'The Google profile link is still a placeholder, so every reviews section names the ' +
        'source in words but cannot link to it. Paste the share link from Picsel\'s Google ' +
        'Business Profile into site.config.js.',
    );
  }

  const seenTitles = new Map();
  const seenDescriptions = new Map();
  const shortDescriptions = [];
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
    if (page.description.length < DESCRIPTION_MIN && !page.descriptionFloorWaived) {
      shortDescriptions.push(`${page.path} (${page.description.length})`);
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
    errors.push(...findUnescapedCopy(html, page.path));

    rendered.push({
      page,
      html,
      /* '/work/' becomes 'work/index.html', so the address stays clean rather
         than ending in a visible .html. The one exception is a page whose own
         path already names a file — currently only /404.html, which has to
         land at the repo root as a bare file for Cloudflare's asset handling
         to find it, not inside a 404.html/ directory. */
      outPath: page.path.endsWith('.html')
        ? join(ROOT, page.path.replace(/^\/+/, ''))
        : join(ROOT, page.path.replace(/^\/+/, ''), 'index.html'),
    });
  }

  /* One warning rather than one per page. Fifteen identical lines would be
     scrolled past; a single line with the count in it can be read. */
  if (shortDescriptions.length) {
    warnings.push(
      `${shortDescriptions.length} meta description(s) under the ${DESCRIPTION_MIN} character ` +
        'floor, which is where Google starts writing its own snippet instead of using yours: ' +
        `${shortDescriptions.join(', ')}. Lengthen them only if there is something true left to ` +
        'say. Padding is worse than a short description.',
    );
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
    const relativeOut = page.path.endsWith('.html')
      ? page.path.replace(/^\/+/, '')
      : `${page.path.replace(/^\/+/, '')}index.html`;
    console.log(`  built  ${page.path.padEnd(20)} -> ${relativeOut}`);
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
/* Cornwall and its neighbours, because that is where the clients are and
   where the studio used to claim to be.

   Edinburgh and Scotland were added in August 2026 and they are the more
   important half of this list now. Ben relocates to Edinburgh, which makes it
   the place name most likely to be typed into a sentence by somebody who
   forgets the rule, and until this line existed the check would have let it
   through in a heading, a title or a schema block without a word. The Scottish
   Borders is Julie Miller's location and is forgiven the same way every other
   client location is: by being stripped as a project value, not by being
   absent from this list. */
const CLIENT_TERMS = [
  'cornwall', 'cornish', 'devon', 'truro', 'falmouth', 'newquay', 'hayle',
  'penzance', 'south west', 'edinburgh', 'scotland', 'scottish',
];
const STUDIO_TERMS = ['based in', 'local to', 'near you', 'in your area'];

export function findLocationClaims(html, path) {
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

  /* Reviews first, because they are the longest strings on the page and the
     loop below depends on removing big strings while they are intact.

     THIS IS THE ONLY EXEMPTION TO THE NO-PLACE-NAME RULE, and it is derived
     from the data rather than from the markup. A reviewer said what they said:
     Zoe named Edinburgh, Brenna named Hayle, and neither is a claim Picsel
     makes about itself. Quoting them is honest; paraphrasing them to dodge a
     build check would not be.

     Why the exact text and not a wrapper element. A rule that skipped anything
     inside <blockquote class="review"> would exempt whatever a template put
     there, which is a hole shaped exactly like the mistake this check exists
     to catch. Matching the strings in reviews.js means the exemption covers
     those words and nothing else: a rewritten sentence stops matching, and a
     quote edited in a template instead of in the data file fails the build. */
  for (const review of [...REVIEWS].sort((a, b) => b.text.length - a.text.length)) {
    /* A blank or whitespace-only review.text is not a review to forgive, it is
       an empty needle. String.split('') does not no-op on an empty string, it
       splits the haystack between every character, so remaining would turn
       "Edinburgh" into "E d i n b u r g h" across the WHOLE page and every
       \b-anchored term below would silently stop matching, on every page, not
       just the one with the blank review. Skipping it here is the same
       decision the project loop below makes for the same reason. */
    if (!review.text || !review.text.trim()) continue;
    for (const variant of new Set([review.text, escapeForCheck(review.text)])) {
      remaining = remaining.split(variant).join(' ');
    }
  }

  for (const project of PROJECTS) {
    /* NOTE the location is NOT in this list on its own, and that is the whole
       subtlety of this check.

       It was, once. AJC's location is the single word "Cornwall", so stripping
       project values blind removed every "Cornwall" from every page of the
       site — including one sitting in a footer comment that shipped on all
       sixteen. The check passed on a page that was wrong, which is worse than
       having no check.

       So the location is only forgiven in the places it is actually
       rendered: the eyebrow on the client's own page, the `about` name in
       that page's schema, and (since August 2026) the sentence on the
       contact page that names Julie Miller by way of answering "where do
       you work". Anywhere else, a location is a location. */
    /* The eyebrow is built from separately-escaped parts with a literal
       &middot; between them, so the string on the page is
       "Removals &amp; clearance &middot; Cornwall". Escaping that whole
       sentence again would give &amp;amp; and match nothing. The schema's
       `about` name is raw inside the JSON. Both forms, built the way each
       template builds it. */
    const eyebrow = `${escapeForCheck(project.sector)} &middot; ${escapeForCheck(project.location)}`;
    const schemaAbout = `${project.sector} in ${project.location}`;

    /* tools/pages/contact.js answers "where do you work" partly by pointing
       at Julie Miller: proof that four hundred miles is not a problem,
       rather than a sentence asserting it. That paragraph is bespoke prose,
       not a template stamped out per project like the eyebrow is, so there
       is no way to reconstruct its exact wording here. What can be
       reconstructed, scoped through this project's own location the same
       way schemaAbout is, is the fragment that names the place: "in the
       Scottish Borders" for Julie Miller, "in the Hayle, Cornwall" (which
       matches nothing) for everyone else. Adding the term "scottish" to
       CLIENT_TERMS in August 2026 made this page fail the build the moment
       the term list did its job; this is the fix, not a reason to weaken
       the list. */
    const contactMention = `in the ${project.location}`;

    const values = [
      project.name,
      eyebrow,
      schemaAbout,
      escapeForCheck(schemaAbout),
      contactMention,
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

/* ---- Unescaped copy inside a paragraph or a list item ---------------------
   guides.js, blog.js and services.js render body paragraphs and list items WITHOUT
   HTML-escaping them, on purpose: a sentence is sometimes hand-written with a
   contextual <a> link inside it, and escaping the whole string would turn that
   link into visible text instead of a link. Every one of those strings is
   studio copy written in this repo, never user input, so there is no injection
   risk.

   The hazard it trades away is narrower but real: the day somebody types
   "Bloggs & Sons" or "sites <a year old" into a paragraph, nothing escapes it,
   and the browser reads the stray character as the start of an entity or a
   tag. Both are silent at build time and visible only in a browser, which is
   exactly the kind of mistake this file exists to catch instead.

   THE RULE THAT USED TO BE HERE DID NOT WORK. It allowed any "<" followed by a
   letter, on the reasoning that a letter means a tag. It does not. a, b, i, p,
   s and u are tag names AND ordinary English words, so "useful for sites <a
   year old" and "anything <b that and you are fine" both sailed through and
   both broke the page. The "a < b" case the old comment claimed to catch was
   precisely the case it missed.

   So the rule is now a whitelist rather than a shape test. Copy may carry
   exactly four tags, all of them inline and all of them meaningful:

     a       a contextual link, which is the whole reason the copy is raw
     em      emphasis
     strong  strong emphasis
     abbr    an abbreviation with its expansion

   Anything else is an error, whether it is a real tag name or an English word
   with an angle bracket in front of it. Every "<" must open a complete,
   well-formed tag from that list, and every tag must be closed inside the same
   element, so an unclosed <a> that would otherwise swallow the rest of the
   document fails the build instead.

   TWO SCOPES, and the difference is deliberate. The ampersand rule cannot be
   wrong in escaped output, so it costs nothing and runs over every paragraph
   and list item on the page. The tag rule is stricter than the shell's own
   markup, which legitimately puts a <span> in a nav item and a <time> in a
   post's byline, so it runs only where copy is interpolated raw: inside a
   guide or a post section. Widening either to the whole document would start
   flagging attribute values and JSON-LD, which are correct to contain raw
   characters that would never land here. */
const COPY_TAGS = new Set(['a', 'em', 'strong', 'abbr']);

function findUnescapedCopy(html, path) {
  const errors = [];

  /* Both element regexes look ahead for whitespace or a closing bracket after
     the tag name. Without it "<li" matches the start of every <link> in the
     head and "<p" matches <picture>, and the check spends its time reading
     markup it was never pointed at. */
  const ALL_ELEMENTS = /<(p|li)(?=[\s>])[^>]*>([\s\S]*?)<\/\1>/g;
  const COPY_SECTIONS = /<section class="(?:guide|post|service)__section[^"]*">([\s\S]*?)<\/section>/g;

  for (const [, tag, inner] of html.matchAll(ALL_ELEMENTS)) {
    for (const stray of inner.matchAll(/&(?!(?:[a-zA-Z][a-zA-Z0-9]*|#[0-9]+|#x[0-9a-fA-F]+);)/g)) {
      errors.push(
        `${path} has a stray "&" inside a <${tag}> element, near "${excerpt(inner, stray.index)}". ` +
          'It is not the start of a valid HTML entity, which means it was written into copy ' +
          'that is never escaped. Write it as &amp; or reword the sentence.',
      );
    }
  }

  for (const [, section] of html.matchAll(COPY_SECTIONS)) {
    for (const [, tag, inner] of section.matchAll(ALL_ELEMENTS)) {
      for (const fault of findMarkupFaults(inner)) {
        errors.push(
          `${path} has broken markup inside a <${tag}> element, near ` +
            `"${excerpt(inner, fault.index)}": ${fault.reason}. Paragraph and list copy is ` +
            'written into the page unescaped, so it may carry only <a>, <em>, <strong> and ' +
            '<abbr>, each one closed. Write the "<" as &lt; or reword the sentence.',
        );
      }
    }
  }

  return errors;
}

/* Walks one element's content and reports every "<" that is not a complete,
   whitelisted, balanced tag. Written as a scan rather than a regex because
   balance is the half that catches the worst case: `<a href="/prices/">the
   prices page` is a perfectly well-formed opening tag, and left unclosed it
   turns the rest of the document into a link. */
function findMarkupFaults(inner) {
  const faults = [];
  const open = [];

  let cursor = 0;
  while (cursor < inner.length) {
    const at = inner.indexOf('<', cursor);
    if (at === -1) break;

    const rest = inner.slice(at);

    const comment = /^<!--[\s\S]*?-->/.exec(rest);
    if (comment) {
      cursor = at + comment[0].length;
      continue;
    }

    const tag = /^<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:\s[^<>]*)?)(\/?)>/.exec(rest);
    if (!tag) {
      faults.push({ index: at, reason: 'the "<" does not open a complete tag' });
      cursor = at + 1;
      continue;
    }

    const [whole, closing, rawName, , selfClosing] = tag;
    const name = rawName.toLowerCase();

    if (!COPY_TAGS.has(name)) {
      faults.push({ index: at, reason: `<${name}> is not a tag copy may carry` });
    } else if (closing) {
      const expected = open.pop();
      if (!expected) {
        faults.push({ index: at, reason: `</${name}> closes a tag that was never opened` });
      } else if (expected.name !== name) {
        faults.push({
          index: at,
          reason: `</${name}> closes nothing, the tag still open here is <${expected.name}>`,
        });
      }
    } else if (!selfClosing) {
      /* The position is kept with the name so an unclosed tag is reported
         where it was opened rather than at the end of the element. */
      open.push({ name, index: at });
    }

    cursor = at + whole.length;
  }

  for (const { name, index } of open) {
    faults.push({ index, reason: `<${name}> is never closed` });
  }

  return faults;
}

/* A few characters either side of the match, so the error names the actual
   sentence rather than just its address in a string nobody will count into. */
function excerpt(text, index) {
  return text.slice(Math.max(0, index - 20), index + 20).replace(/\s+/g, ' ').trim();
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
