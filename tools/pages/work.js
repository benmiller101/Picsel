/* ---- work.js — /work, the full index --------------------------------------
   Every project, not only the featured ones. The homepage shows a selection
   and is doing persuasion; this page is the catalogue, and its job is to let
   someone scan the lot and pick the one closest to their own trade.

   It reads PROJECTS rather than FEATURED_PROJECTS, so a project that is
   deliberately kept off the homepage still has a home here and still has a
   page. Adding one is a single entry in projects.js: the grid, this page's
   copy, the project page and the sitemap all follow. */

import { PROJECTS } from '../../projects.js';
import { absoluteUrl } from '../../site.config.js';
import { breadcrumbs } from '../templates/schema.js';
import { renderWorkGrid } from '../partials/work-card.js';
import { renderContactBand } from '../partials/contact-band.js';

/* Written from the data, not typed out. "Five" is a fact that will stop being
   true the day a sixth project is added, and a number hand-written into copy
   is a number nobody remembers to update — it just quietly becomes a lie on a
   page whose whole argument is that the work is real. */
const COUNT_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const count = PROJECTS.length;
const countWord = COUNT_WORDS[count] || String(count);

/* Cornwall is named because it is true of most of the list and it is what
   someone local is looking for — but the sentence is built from the data
   rather than asserting it, because Julie Miller Art is in the Scottish
   Borders and a blanket "all in Cornwall" would be false. */
const cornwallCount = PROJECTS.filter((p) => /cornwall/i.test(p.location)).length;
const elsewhere = count - cornwallCount;

const INTRO = `    <section class="section work-intro">
      <div class="wrap work-intro__inner">
        <p class="eyebrow">Work</p>
        <h1 class="work-intro__title">Every site we have built</h1>
        <p class="lede measure">
          ${countWord.charAt(0).toUpperCase() + countWord.slice(1)} live sites${
            elsewhere > 0
              ? `, ${cornwallCount === 1 ? 'one' : COUNT_WORDS[cornwallCount] || cornwallCount} of them in Cornwall`
              : ', all of them in Cornwall'
          }. Each one links straight out to the real site, so you can judge it
          the way a customer would rather than take our word for it.
        </p>
      </div>
    </section>`;

const GRID = `    <section class="section work" aria-labelledby="work-heading">
      <div class="wrap">
        <h2 class="visually-hidden" id="work-heading">Projects</h2>

${renderWorkGrid(PROJECTS, { variant: 'index' })}
      </div>
    </section>`;

export const WORK_PAGE = {
  path: '/work/',
  /* CollectionPage rather than WebPage: this page's job is to list other
     pages, and saying so is more useful to a crawler than saying it exists.
     The ItemList names them in the order they appear, which is the order the
     data is in. */
  schemaType: 'CollectionPage',
  schemaExtra: [
    {
      '@type': 'ItemList',
      name: 'Websites built by Picsel',
      numberOfItems: PROJECTS.length,
      itemListElement: PROJECTS.map((project, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: project.name,
        url: absoluteUrl(`/work/${project.slug}/`),
      })),
    },
    breadcrumbs([
      { name: 'Home', path: '/' },
      { name: 'Work', path: '/work/' },
    ]),
  ],
  title: 'Work: websites Picsel has built in Cornwall',
  description:
    `The ${countWord} sites Picsel has built for trades and small businesses, mostly in Cornwall. Every one links out to the live site.`,
  content: [INTRO, GRID, renderContactBand({
    heading: 'Want one of these?',
    body: 'Tell us what your business does and what you want the site to do, and we&rsquo;ll tell you what&rsquo;s involved. Plain English, and no obligation.',
  })].join('\n\n'),
};
