/* ---- about.js — /about -----------------------------------------------------
   The page every other page on this site could point to and never did, because
   it needed a fact only Ben could give: how long he has actually been doing
   this. Two years is short, and CLAUDE.md's standing rule is that credibility
   here comes from the work, not from a claim about tenure. So the page opens
   with the number rather than working around it, and the reason it is a good
   number rather than an awkward one is the sentence straight after it: Picsel
   exists because Ben built one company's site as their creative director and
   saw what a website could actually do.

   THAT COMPANY IS LANORA HOUSE, which is also one of the five projects in
   /work/. This page used to carry a second sentence spelling out that Ben is
   still a director there. Ben removed it, and that is his call to make about
   his own company.

   Worth knowing if it comes up again: the sentence existed because the plan
   file flags Lanora House as the project needing the most care, since the
   relationship is not arm's length the way the other four are. The founding
   story here still names Lanora House as the company whose site Ben built as
   its creative director, so the connection is on the page; what is gone is the
   present-tense directorship.

   Follows the shape of privacy.js and contact.js: breadcrumbs declared once,
   a plain page-head, then the guide__ classes from article.css for the body,
   because this is long-form reading in the same sense a guide is. */

import { renderBreadcrumbs } from '../partials/breadcrumbs.js';
import { renderArticleSections } from '../partials/article-sections.js';
import { renderContactBand } from '../partials/contact-band.js';
import { breadcrumbs } from '../templates/schema.js';

/* Declared once, ahead of HEAD below and ABOUT_PAGE.schemaExtra, so the
   visible trail and the JSON-LD cannot describe two different pages. */
const ABOUT_TRAIL = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about/' },
];

/* srcset widths match assets/brand/ben-laptop-{480,960,1440}.webp, written by
   tools/convert-photo.js. width/height are the largest file's own dimensions,
   so the browser reserves the right box before any variant has arrived and
   nothing below the photo jumps while the page loads. Not loading="lazy":
   this sits in the page head, above the fold on every screen size. */
const PHOTO = `        <figure class="about-head__photo">
          <img
            src="/assets/brand/ben-laptop-960.webp"
            srcset="/assets/brand/ben-laptop-480.webp 480w, /assets/brand/ben-laptop-960.webp 960w, /assets/brand/ben-laptop-1440.webp 1440w"
            sizes="(min-width: 64rem) 25rem, 92vw"
            alt="Ben Miller working at his laptop"
            width="1440"
            height="958"
            decoding="async"
          />
        </figure>`;

const HEAD = `${renderBreadcrumbs(ABOUT_TRAIL)}

    <section class="section about-head">
      <div class="wrap page-head">
        <div class="page-head__text">
          <p class="eyebrow">About</p>
          <h1>Ben Miller runs Picsel</h1>
        </div>

${PHOTO}
      </div>
    </section>`;

/* ---- The body --------------------------------------------------------------
   Two sections, each written to stand alone (CLAUDEseo's atomic-section rule):
   an assistant or a reader who lands on either one with nothing above it still
   gets a complete answer, which is why the Lanora House fact and the "about two
   years" fact both appear more than once rather than being stated once and
   assumed. */
const SECTIONS = [
  {
    h2: 'Where Picsel came from',
    paragraphs: [
      'Ben was creative director at Lanora House when he built the company&rsquo;s own website. ' +
        'Seeing what it could do, actually getting the business found online, is what convinced ' +
        'him to start Picsel and do the same for other tradespeople.',
      'You can see that site in <a href="/work/lanora-house/">our work</a>.',
    ],
  },
  {
    h2: 'How a job runs, from first message to live',
    paragraphs: [
      'Send the first message and we get on a call. That call goes through your business ' +
        'properly: what you do, who your customers are, and what the site needs to do for you.',
      'You&rsquo;ll usually come away with a short list of things to send over: photos, copy ' +
        'if you have it, whatever you&rsquo;ve got. We do our own research too, then build a ' +
        'first draft and show it to you.',
      'You ask for changes until you&rsquo;re happy, then the site goes live. In most cases the ' +
        'build fee is paid before work starts, and the monthly cost only starts once the site is ' +
        'live. Full pricing is on the <a href="/prices/">prices page</a>.',
    ],
  },
];

const MAIN = `    <article class="section guide">
      <div class="wrap guide__inner">
        <p class="guide__answer">
          Ben Miller has been building websites for about two years. Before that he was creative
          director at Lanora House, and building their site himself is what led him to start
          Picsel.
        </p>

${renderArticleSections(SECTIONS, 'guide')}
      </div>
    </article>`;

export const ABOUT_PAGE = {
  path: '/about/',
  schemaExtra: [
    breadcrumbs(ABOUT_TRAIL),
  ],
  title: 'About Ben Miller, who runs Picsel',
  description:
    'Ben Miller has built websites for about two years, since his time as creative director at ' +
    'Lanora House. That is why he started Picsel, and how a job runs.',
  styles: ['/about.css', '/article.css'],
  content: [HEAD, MAIN, renderContactBand({
    heading: 'Thinking about a site?',
    body: 'Tell us what your business does and what you want the site to do, and we&rsquo;ll ' +
      'tell you what&rsquo;s involved. Plain English, and no obligation.',
  })].join('\n\n'),
};
