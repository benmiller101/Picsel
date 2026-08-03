/* ---- project.js — one page per project ------------------------------------
   Five pages from one template and one list. Nothing here is written per
   client: the name, sector, location, blurb, live URL, screenshots and alt
   text all come from projects.js, so adding a sixth project adds a sixth page
   with no new code and no new file.

   The job of the page is narrow. Someone has clicked a card because the
   screenshot looked like the kind of site they want. They are here to decide
   whether to ring Picsel, and the fastest way to convince them is not more
   words about the build — it is the live site itself. So the page is arranged
   around getting them to it: the screenshot big at the top, a short paragraph,
   and a button that opens the real thing. */

import { PROJECTS, getAdjacentProjects } from '../../projects.js';
import { escapeHtml, rollLabel } from '../templates/page.js';
import { SHOT_SIZES, shotSrcset } from '../templates/images.js';
import { ORG_ID, breadcrumbs } from '../templates/schema.js';
import { absoluteUrl } from '../../site.config.js';
import { renderContactBand } from '../partials/contact-band.js';

/* Sizes and srcset both come from templates/images.js, shared with the work
   card so this page and the grid cannot disagree about which files exist.
   Still stated on every <img> so the browser reserves the right space before
   the file lands and nothing below it jumps as the page loads. */

/* The address bar shows the real domain, without the www. It is the one piece
   of chrome that earns its place: it tells the visitor where the button is
   about to take them, before they press it. */
function displayHost(url) {
  return new URL(url).host.replace(/^www\./, '');
}

/* First sentence of the blurb, plus a Picsel clause when there is room for it.
   Derived rather than written separately: a description hand-written next to a
   blurb is a second copy of the same sentence, and the two drift the moment
   one of them is edited. The build enforces the 155 limit, so the conditional
   here is about looking deliberate rather than about passing the check. */
function describe(project) {
  const first = project.blurb.split(/(?<=\.)\s+/)[0];
  const withStudio = `${first} Built by Picsel.`;
  return withStudio.length <= 155 ? withStudio : first;
}

/* ---- The browser frame ----------------------------------------------------
   A bar, three dots and the domain. Deliberately the plainest thing that reads
   as "this is a website": no gloss, no reflection, no frosted panel. Five
   client sites in five palettes are the colour on these pages, and a decorated
   frame competes with the very thing it is framing. */
function renderDesktopShot(project) {
  const size = SHOT_SIZES.desktop;

  return `        <figure class="browser">
          <div class="browser__bar" aria-hidden="true">
            <span class="browser__dots"><i></i><i></i><i></i></span>
            <span class="browser__host">${escapeHtml(displayHost(project.url))}</span>
          </div>
          <!-- The shot runs the full width of the 72rem wrap, less its gutters,
               so on a wide screen the slot really is about 68rem. Below that it
               is very nearly the whole viewport. -->
          <img
            class="browser__shot"
            src="/assets/work/${escapeHtml(project.slug)}/desktop.webp"
            srcset="${escapeHtml(shotSrcset(project.slug, 'desktop'))}"
            sizes="(min-width: 76rem) 68rem, 92vw"
            alt="${escapeHtml(project.alt)}"
            width="${size.width}"
            height="${size.height}"
            fetchpriority="high"
            decoding="async"
          />
        </figure>`;
}

/* The phone shot is not decoration. Most of these clients' customers are on a
   phone, and a portfolio aimed at small businesses should show that the small
   screen was designed rather than left to shrink. */
function renderMobileShot(project) {
  const size = SHOT_SIZES.mobile;

  return `          <figure class="phone">
            <img
              class="phone__shot"
              src="/assets/work/${escapeHtml(project.slug)}/mobile.webp"
              srcset="${escapeHtml(shotSrcset(project.slug, 'mobile'))}"
              sizes="(min-width: 64rem) 18rem, 92vw"
              alt="${escapeHtml(project.alt)}, shown on a phone"
              width="${size.width}"
              height="${size.height}"
              loading="lazy"
              decoding="async"
            />
          </figure>`;
}

/* Tags are a public claim about work performed, so they say only what
   projects.js says, and that file only says what Ben has confirmed.
   The heading is "What we did" rather than "Services", because one is a fact
   about this job and the other is a menu. */
function renderTags(project) {
  if (!project.tags?.length) return '';

  const items = project.tags
    .map((tag) => `              <li class="tag">${escapeHtml(tag)}</li>`)
    .join('\n');

  return `            <div class="project__tags">
              <h2 class="project__tags-title">What we did</h2>
              <ul class="tag-list">
${items}
              </ul>
            </div>`;
}

/* Previous and next wrap around the list, so neither link is ever dead. The
   labels carry the project NAME rather than saying "Previous" and "Next" on
   their own: a link that only says "Next" tells a screen-reader user, and
   anyone skimming, nothing about where it goes. */
function renderAdjacent(slug) {
  const { previous, next } = getAdjacentProjects(slug);
  if (!previous && !next) return '';

  const link = (project, direction, label) => {
    if (!project) return '';
    return `        <a class="project-nav__link project-nav__link--${direction} roll-trigger" href="/work/${escapeHtml(project.slug)}/">
          <span class="project-nav__direction">${label}</span>
          <span class="project-nav__name">${rollLabel(project.name)}</span>
        </a>`;
  };

  return `    <nav class="section project-nav" aria-label="More projects">
      <div class="wrap project-nav__inner">
${link(previous, 'previous', 'Previous project')}
${link(next, 'next', 'Next project')}
      </div>
    </nav>`;
}

function renderProject(project) {
  const host = displayHost(project.url);

  const content = `    <article class="project">
      <header class="section project__head">
        <div class="wrap">
          <p class="eyebrow">${escapeHtml(project.sector)} &middot; ${escapeHtml(project.location)}</p>
          <h1 class="display project__name">${escapeHtml(project.name)}</h1>
        </div>
      </header>

      <div class="section project__shot">
        <div class="wrap">
${renderDesktopShot(project)}
        </div>
      </div>

      <div class="section project__body">
        <div class="wrap project__body-inner">
          <div class="project__words">
            <p class="lede">${escapeHtml(project.blurb)}</p>

${renderTags(project)}

            <!-- The point of the page. target=_blank because sending someone
                 away from the portfolio to a client site is a one-way trip
                 otherwise; rel=noopener because a page opened this way can
                 otherwise reach back into the one that opened it. -->
            <a class="btn btn--primary project__visit"
               href="${escapeHtml(project.url)}"
               target="_blank"
               rel="noopener noreferrer">
              Visit the live site
            </a>
            <p class="project__host">Opens ${escapeHtml(host)} in a new tab</p>
          </div>

${renderMobileShot(project)}
        </div>
      </div>
    </article>

${renderAdjacent(project.slug)}`;

  return {
    path: `/work/${project.slug}/`,
    title: `${project.name} | Picsel`,
    description: describe(project),
    /* This page is about the client's site, not about Picsel. */
    schemaAbout: { '@id': `${project.url}#website` },
    /* This page is a page ABOUT a piece of work, so the extra node describes
       the client's site rather than this one. `creator` is the only claim it
       makes about Picsel, and it is a true one: Picsel built it. There is no
       rating, no award and no outcome, because none of those are facts we
       hold. */
    schemaExtra: [
      {
        '@type': 'WebSite',
        '@id': `${project.url}#website`,
        url: project.url,
        name: project.name,
        description: project.blurb,
        creator: { '@id': ORG_ID },
        image: absoluteUrl(`/assets/work/${project.slug}/desktop.webp`),
        /* The client's own sector and place, from projects.js. Note this is
           the CLIENT's location, which is not always Cornwall — Julie Miller
           Art is in the Scottish Borders, and saying otherwise here would be
           the same lie in machine-readable form. */
        about: {
          '@type': 'Thing',
          name: `${project.sector} in ${project.location}`,
        },
      },
      breadcrumbs([
        { name: 'Home', path: '/' },
        { name: 'Work', path: '/work/' },
        { name: project.name, path: `/work/${project.slug}/` },
      ]),
    ],
    /* The desktop screenshot is the social preview. A link to a project page
       shared anywhere should show the site it is about, not a generic card. */
    ogImage: `/assets/work/${project.slug}/desktop.webp`,
    content: [content, renderContactBand({
      heading: 'Want something like this?',
      body: 'Tell us what your business does and what you want the site to do, and we&rsquo;ll tell you what&rsquo;s involved. Plain English, and no obligation.',
    })].join('\n\n'),
  };
}

/** One page per project, in list order. */
export const PROJECT_PAGES = PROJECTS.map(renderProject);
