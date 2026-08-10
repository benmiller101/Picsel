/* ---- blog.js — /blog and the posts ----------------------------------------
   The studio's own voice, which is the one thing the guides are built not to
   be.

   THE LINE BETWEEN THIS FILE AND guides.js. A guide answers the question a
   customer asks, neutrally, in about fifty words an assistant can lift. It
   takes no side, because nobody quotes a sales pitch. A post is dated, it is
   first person, and it has an argument in it.

   The test, when you are deciding where something goes: if a post would be
   quoted by an assistant as a neutral answer to a question, it should have
   been a guide. Write it there instead and link to it from here.

   WHAT A POST MAY CLAIM. llms.txt tells every reader and every assistant that
   this studio "makes no claims about client numbers, years in business or
   awards" and that anything stated "can be checked against the live sites".
   That applies here more than anywhere, because this is the one section
   written to persuade. A number goes in a post only if a stranger could check
   it: a review count on a public listing, a price on /prices, a site on /work.

   Search figures were considered for the first post and left out. The one
   client with Search Console has no data before June 2026, so there is no
   before and after to show, and the average position over that window is page
   three. There was no way to state it that was both flattering and true, so it
   is not stated. */

import { PLANS, money } from '../../pricing.js';
import { escapeHtml } from '../templates/page.js';
import { breadcrumbs, blogPosting, blogNode } from '../templates/schema.js';
import { renderArticleSections } from '../partials/article-sections.js';
import { renderContactBand } from '../partials/contact-band.js';
import { renderBreadcrumbs } from '../partials/breadcrumbs.js';
import { PAGE_BLOB, PAGE_BLOB_SCRIPT } from '../partials/page-blob.js';

/* Read rather than retyped, so a post can never quote a price the prices page
   does not. Same reason guides.js does it. */
const ONLINE = PLANS[0];
const MANAGED = PLANS[1];
const GROWTH = PLANS[2];

/* "9 August 2026" from "2026-08-09". Midday UTC rather than midnight so a
   machine an hour behind does not render the day before, and the formatter is
   pinned to UTC as well: without the timeZone the midday instant is printed in
   whatever zone the build machine sits in, and a machine at UTC+13 renders the
   day after instead. Both halves are needed; one on its own only moves which
   direction the date is wrong in. */
const LONG_DATE = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

function longDate(iso) {
  return LONG_DATE.format(new Date(`${iso}T12:00:00Z`));
}

/* FIELD REFERENCE
     slug        URL segment under /blog/. Permanent.
     date        ISO. Drives both the visible byline and datePublished.
     headline    The h1. The argument, stated.
     title       <title>. 60 characters max, enforced by the build.
     description Meta description. Aim for 150 to 155 characters. The build
                  fails over 155 and warns under 150, because going long wastes
                  characters nobody reads while going short is sometimes the
                  honest length for the page.
     standfirst  The opening paragraph, set larger. One sentence if possible.
     sections    h2 plus paragraphs; a section may carry a list. Paragraph and
                  list copy is written into the page WITHOUT escaping, so it may
                  carry a, em, strong and abbr and nothing else. The build
                  enforces that: any other tag, any stray "<", and any tag left
                  unclosed fails the build rather than reaching a browser.
     close       The single link out, at the end, phrased as a fact.
     action      The one thing to do before the reader has scrolled, under the
                 standfirst. Always points at /contact/#enquiry: a post has no
                 service page of its own to reinforce, so it goes straight at
                 the enquiry form instead. */
const POSTS = [
  {
    slug: 'why-trades-websites-cost-so-much',
    date: '2026-08-09',
    headline: 'Why trades websites cost so much',
    title: 'Why trades websites cost so much | Picsel',
    description:
      'Where the money goes in a three thousand pound website quote, what a trades website ' +
      'actually has to do, and what I charge instead. With one real number.',
    standfirst:
      'A five page website for a plumber does not cost three thousand pounds to make. It ' +
      'costs that to sell, to manage, and to sign off.',
    sections: [
      {
        h2: 'Where three thousand pounds goes',
        paragraphs: [
          'The quote is usually honest and the work behind it is real. It is just that most ' +
            'of it is not work on your website.',
          'There is an account manager whose job is to be the person you ring. There is a ' +
            'discovery workshop, which is a meeting about what you do for a living. There are ' +
            'three rounds of design on a site with five pages on it, because the process was ' +
            'written for clients who have a marketing department to satisfy. And underneath ' +
            'all of it there is an office, the people in it, and the software they run.',
          'It is a process built for a different kind of customer, sold to you at what it ' +
            'costs to run.',
        ],
      },
      {
        h2: 'What a trades website has to do',
        paragraphs: [
          'Not much, and it has to do it properly. Your phone number where a thumb can reach ' +
            'it. The jobs you do, in the words customers actually type. The places you cover. ' +
            'Photographs of your own work rather than a stock photo of somebody else\'s. A few ' +
            'reviews.',
          'That is about a week of work. It is not a quarter of one, and the gap between those ' +
            'two numbers is most of what you are being charged for. There is a longer version ' +
            'of this list in <a href="/guides/what-a-trades-website-needs/">what a trades ' +
            'website needs</a>, written without me trying to sell you anything.',
        ],
      },
      {
        h2: 'What I charge, and what is in it',
        paragraphs: [
          `The smallest plan is ${money(ONLINE.build)} to build and ${money(ONLINE.monthly)} a ` +
            `month. ${MANAGED.name} is ${money(MANAGED.build)} and ${money(MANAGED.monthly)} a ` +
            `month, which adds somebody looking after it so you never touch it. ` +
            `${GROWTH.name} is ${money(GROWTH.build)} and ${money(GROWTH.monthly)} a month, ` +
            'and that one buys active work every month rather than a site sitting still.',
          'The figures matter less than where they are. They are on the website, so you can ' +
            'hold them against anyone else before you pick up the phone. Most of this trade ' +
            'still makes you ring to find out. If you want a straight price for your own job, ' +
            '<a href="/contact/">get in touch</a> and I will give you one on the phone.',
        ],
      },
      {
        h2: 'What that has produced so far',
        paragraphs: [
          'One number worth reporting. Lanora House went from 18 Google reviews to 36 in two ' +
            'months. It stands at 38 today, averaging five stars.',
          'Be clear about which half of the work that is. A website does not collect reviews. ' +
            'Somebody asking, at the right moment, every time, does, and that is the monthly ' +
            'plan rather than the build. The site is where people land once the reviews have ' +
            'done their job.',
          'You can check it, which is the point of quoting it. The reviews are on their Google ' +
            'listing with dates against them.',
        ],
      },
    ],
    close: {
      href: '/prices/',
      line:
        'Every plan is written down, including what it does not cover: ' +
        `${money(ONLINE.build)} to build and ${money(ONLINE.monthly)} a month at the smallest.`,
      cta: 'See the prices',
    },
    action: {
      href: '/contact/#enquiry',
      line: 'The number that matters is the one for your own job, not a range.',
      cta: 'Send an enquiry',
    },
  },
];

function renderPost(post) {
  const sections = renderArticleSections(post.sections, 'post');

  /* Same reasoning as the guides: one link, under the standfirst, so a reader
     has something to act on before the first scroll. See renderGuide in
     guides.js for the fuller version of this comment. */
  const action = `        <p class="post__action">${escapeHtml(post.action.line)} <a class="post__action-link" href="${escapeHtml(post.action.href)}">${escapeHtml(post.action.cta)}</a>.</p>`;

  /* One array, fed to the visible nav below and to the JSON-LD in
     schemaExtra, so the two accounts of this page's place in the site
     cannot disagree. */
  const trail = [
    { name: 'Home', path: '/' },
    { name: 'Blog', path: '/blog/' },
    { name: post.headline, path: `/blog/${post.slug}/` },
  ];

  const content = `${renderBreadcrumbs(trail)}

    <article class="section post">
      <div class="wrap post__inner">
        <p class="eyebrow"><a class="post__back" href="/blog/">Blog</a></p>
        <h1 class="post__headline">${escapeHtml(post.headline)}</h1>
        <p class="post__meta">
          <time datetime="${escapeHtml(post.date)}">${escapeHtml(longDate(post.date))}</time>
        </p>

        <p class="post__standfirst">${escapeHtml(post.standfirst)}</p>

${action}

${sections}

        <aside class="post__close">
          <p>${escapeHtml(post.close.line)}</p>
          <a class="post__close-link" href="${escapeHtml(post.close.href)}">${escapeHtml(post.close.cta)}</a>
        </aside>
      </div>
    </article>`;

  return {
    path: `/blog/${post.slug}/`,
    title: post.title,
    description: post.description,
    styles: ['/article.css'],
    /* The one page type on the site that is not a website page. Every other
       route is a standing page of the studio's; a post is a dated piece of
       writing, and og:type is where a share card is told which it has got. */
    ogType: 'article',
    schemaExtra: [
      blogPosting({
        headline: post.headline,
        description: post.description,
        path: `/blog/${post.slug}/`,
        datePublished: post.date,
      }),
      breadcrumbs(trail),
    ],
    content: [
      content,
      renderContactBand({
        heading: 'Want a straight price?',
        body: 'Ring and describe the job. We&rsquo;ll tell you what&rsquo;s involved and what it would cost, in plain English, with no obligation.',
      }),
    ].join('\n\n'),
  };
}

export const BLOG_PAGES = POSTS.map(renderPost);

/* ---- The index ------------------------------------------------------------
   Newest first, with the date visible. A blog that hides its dates is usually
   hiding how long it has been since the last one, and the fix for that is to
   post rather than to hide the evidence. */
const INDEX_LIST = `      <ul class="post-index">
${POSTS.map(
  (post) => `        <li class="post-index__item">
          <p class="post-index__date">
            <time datetime="${escapeHtml(post.date)}">${escapeHtml(longDate(post.date))}</time>
          </p>
          <h2 class="post-index__title">
            <a href="/blog/${escapeHtml(post.slug)}/">${escapeHtml(post.headline)}</a>
          </h2>
          <p class="post-index__standfirst">${escapeHtml(post.standfirst)}</p>
        </li>`,
).join('\n\n')}
      </ul>`;

/* Declared once, ahead of the page object, so the visible trail prepended to
   content below and the JSON-LD in schemaExtra read from the same array. */
const BLOG_INDEX_TRAIL = [
  { name: 'Home', path: '/' },
  { name: 'Blog', path: '/blog/' },
];

export const BLOG_INDEX_PAGE = {
  path: '/blog/',
  title: 'Blog: websites for tradespeople | Picsel',
  description:
    'What I think about websites for tradespeople, what they cost and why they cost it. ' +
    'Opinions rather than answers here. The answers are all in the guides.',
  styles: ['/article.css'],
  schemaType: 'CollectionPage',
  schemaExtra: [
    blogNode(POSTS.map((post) => ({ headline: post.headline, path: `/blog/${post.slug}/` }))),
    breadcrumbs(BLOG_INDEX_TRAIL),
  ],
  extraScripts: PAGE_BLOB_SCRIPT,
  content: [
    renderBreadcrumbs(BLOG_INDEX_TRAIL),
    `    <section class="section blog-head">
      <div class="wrap page-head">
        <div class="page-head__text">
          <p class="eyebrow">Blog</p>
          <h1>Blog: websites for tradespeople</h1>
          <p class="lede measure">
            Opinions, with my name on them. The answers that take no side live in
            <a href="/guides/">the guides</a>. This is the part where I say what I
            think about the way this trade sells websites.
          </p>
        </div>

${PAGE_BLOB}
      </div>
    </section>`,
    `    <section class="section blog-list" aria-labelledby="blog-list-heading">
      <div class="wrap">
        <h2 class="visually-hidden" id="blog-list-heading">All posts</h2>

${INDEX_LIST}
      </div>
    </section>`,
    renderContactBand(),
  ].join('\n\n'),
};
