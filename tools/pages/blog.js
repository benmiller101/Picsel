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

import { SHOW_PRICING, absoluteUrl } from '../../site.config.js';
import { PROJECTS } from '../../projects.js';
import { PLANS, BUILD_FEE, money } from '../../pricing.js';
import { escapeHtml } from '../templates/page.js';
import { breadcrumbs, blogPosting, blogNode } from '../templates/schema.js';
import { renderArticleSections } from '../partials/article-sections.js';
import { renderArticleRail } from '../partials/article-rail.js';
import { renderContactBand } from '../partials/contact-band.js';
import { renderBreadcrumbs } from '../partials/breadcrumbs.js';
import { countWord } from '../templates/words.js';
import { PAGE_BLOB, PAGE_BLOB_SCRIPT } from '../partials/page-blob.js';
import { buildPlanTable } from '../partials/plan-table.js';

/* Read rather than retyped, so a post can never quote a price the prices page
   does not. Same reason guides.js does it. */
const ONLINE = PLANS[0];

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
/* ---- The plumber cost post's headings -------------------------------------
   THE HOUSE STYLE BANS QUESTION HEADINGS AND THIS PAGE IS THE EXCEPTION, on
   purpose and for one page type only. A cost page is read by somebody who
   arrived having typed the question, and by an assistant looking for the
   question to quote. Every h2 here is therefore the question, and the first
   sentence under it is the answer with no run-up.

   Declared up here rather than inline because four of the six are also the
   FAQPage node, and "the schema questions match the rendered headings word for
   word" is a promise no amount of care survives if the two are typed twice.
   One constant, both readers.

   The curly apostrophe and the curly quotes are literal characters rather than
   entities because these strings are escaped on the way into the h2, the way
   guides.js already writes one. An &rsquo; here would print as &rsquo;. */
const PLUMBER_Q = {
  cost: 'How much does a plumber’s website cost in 2026?',
  diy: 'Is it cheaper to build it yourself?',
  pages: 'What pages does a plumber’s website actually need?',
  gasSafe: 'Where should the Gas Safe logo go?',
  emergency: 'How do you show up for “emergency plumber” searches?',
  running: 'What does it cost to keep a website running?',
};

/* The comparison table. Its own constant because the Picsel row is conditional
   and a five row literal with a spread in the middle of it is unreadable.

   THE LAST COLUMN IS THE HONEST ONE AND IT COST ME THE NEATEST ANSWER. Every
   other route on this table gets a one word answer in it. Mine does not,
   because pricing.js says what happens when a client leaves: the site comes
   down, and the domain, content, photos and reviews go with them. Writing
   "Yes" in my own row would read better and would contradict the terms
   published on /prices, which is the one contradiction this site cannot
   afford. So the row says what the terms say. */
const PLUMBER_TABLE = {
  caption: 'Three year totals, worked from the sources named in this post.',
  head: ['Route', 'Upfront', 'Monthly', 'Three years', 'Yours at the end?'],
  rows: [
    ['Yourself, on Wix Core', '£0', '£16', 'About £600', 'Your content, not the site'],
    ['Freelancer, one off', '£500 to £1,500', 'About £10', '£900 to £1,900', 'Yes'],
    ['Small agency', '£2,000 to £10,000', 'About £30', '£3,100 to £11,100', 'Yes'],
    ['Checkatrade, no website', '£0', '£60 to £150', '£2,160 to £5,400', 'No, nothing'],
    ...(SHOW_PRICING
      ? [[
          'Picsel',
          money(BUILD_FEE),
          `${money(ONLINE.monthly)}`,
          money(BUILD_FEE + ONLINE.monthly * 36),
          'Domain and content, not the template',
        ]]
      : []),
  ],
};

const POSTS = [
  {
    slug: 'plumber-website-cost-2026',
    date: '2026-08-25',
    headline: 'What a plumber’s website costs in 2026',
    title: 'Plumber website cost 2026: £9 a month to £10,000 | Picsel',
    description:
      'Wix from £9 a month, £500 to £1,500 from a freelancer, £2,000 up from an agency. '
      + 'Worked three year totals for each route, and what you own if you stop.',
    standfirst: SHOW_PRICING
      ? 'A plumber’s website in 2026 runs from £9 a month building it yourself on Wix, '
        + 'through £500 to £1,500 for a one off freelance build, to £2,000 and up from an '
        + `agency. I charge ${money(BUILD_FEE)} to build it, then ${money(ONLINE.monthly)} a month.`
      : 'A plumber’s website in 2026 runs from £9 a month building it yourself on Wix, '
        + 'through £500 to £1,500 for a one off freelance build, to £2,000 and up from an '
        + 'agency. Here is where every one of those figures comes from.',
    sections: [
      {
        h2: PLUMBER_Q.cost,
        blocks: [
          { p: 'Between nothing and ten thousand pounds. The gap is almost entirely about who does the work.' },
          { p: 'Doing it yourself starts lowest. Wix UK is £9 a month on Light, £16 on Core, £25 on Business and £119 on Business Elite, all on annual billing. Pay monthly instead and it costs 16 to 28% more. Squarespace runs £12 to £79 a month: Core is £17 and takes 5% of digital product revenue, Plus is £29 and takes 1%, and physical product sales carry nothing since the 2026 restructure. Both sets of figures are Expertsure’s 2026 pricing guides.' },
          { p: 'Pay somebody and it steps up hard. A UK freelance web designer charges £25 to £120 an hour, or £500 to £1,500 for a basic five page site. A small specialist agency wants £2,000 to £10,000 for a business website. Expertsure’s 2026 website cost guide again.' },
          { p: 'Checkatrade publish their own cost guide, and their numbers are the highest of the lot. Full website design: £495 to £15,000, average £7,747.50. A WordPress build: £400 to £7,000, average £3,700. A one off custom build: £2,500 to £10,000, average £6,250. Those are Checkatrade’s published averages rather than fresh 2026 data: their table was last updated in May 2024.' },
          { table: PLUMBER_TABLE },
          { p: 'The three year column is the build plus thirty six months of running it. Wix Core at £16 a month for three years, plus a domain, is about £600. A freelance build at £500 to £1,500 plus £10 a month hosting and a domain lands between £900 and £1,900. An agency build plus £30 a month for hosting and maintenance comes to £3,100 to £11,100. Checkatrade at £60 to £150 a month is £2,160 to £5,400 over the same three years.' },
          ...(SHOW_PRICING
            ? [{ p: `Mine is ${money(BUILD_FEE)} to build, then ${money(ONLINE.monthly)} a month. `
                 + `Over three years that’s ${money(BUILD_FEE + ONLINE.monthly * 36)}.` }]
            : []),
        ],
      },
      {
        h2: PLUMBER_Q.diy,
        blocks: [
          { p: 'In year one, yes, and by a long way. Expertsure put a realistic do it yourself year at £240 to £360, including a domain and a business email. Nothing else on this page is close.' },
          { p: 'After that it depends what your evenings are worth. Wix gets you a site in a weekend and a finished site in about six. The photographs still have to be taken. The service pages still have to be written. And the words that win an emergency call out aren’t the words a plumber uses talking to another plumber.' },
          { p: 'There’s a second cost that only shows up in year three. Build it on Wix and it stays on Wix. Move later and you rebuild, because the pages don’t travel. That’s the last column of the table, and the one everybody skips.' },
          { p: 'Build it yourself if you’d enjoy it. Plenty of plumbers do. Pay somebody if you’d rather be fixing boilers. The real comparison there is £9 a month against your Saturdays.' },
        ],
      },
      {
        h2: PLUMBER_Q.pages,
        blocks: [
          { p: 'One page for every job you want ringing in, plus one for every town you cover.' },
          { p: 'Boiler repair gets its own page. So does emergency call out. Not bullet points on a services page: whole pages, with their own heading and words. A page per job type is what ranks, because somebody typing &ldquo;boiler not firing up&rdquo; wants a page about boilers not firing up, and the ninth item in a list isn’t one.' },
          { p: 'The rest is short. Who you are, with a photograph of you rather than a stock shot of somebody beside a van. What you charge, or how you charge. Your reviews. Your phone number where a thumb reaches it.' },
          { p: 'That’s five or six pages of real writing, and it’s the half everybody underestimates.' },
        ],
      },
      {
        h2: PLUMBER_Q.gasSafe,
        blocks: [
          { p: 'In the header or the footer, next to your phone number.' },
          { p: 'Write the registration number out as text in the footer of every page, and on your about page as well. Customers check it. The ones who check are about to ring you, so make it a two second job rather than a hunt.' },
          { p: 'Google’s quality raters like seeing it too. A registration number a stranger can look up is exactly the kind of checkable claim their guidelines ask for.' },
          { p: 'It costs nothing. It takes ten minutes. Most plumber sites still bury it on a page nobody opens.' },
        ],
      },
      {
        h2: PLUMBER_Q.emergency,
        blocks: [
          { p: 'One page per town, with the town name in the h1, the title tag and the first paragraph.' },
          { p: '&ldquo;Emergency plumber [your town]&rdquo; is the search that pays. Whoever types it has water coming through a ceiling and will ring the first number that looks local and looks open. Nobody browses.' },
          { p: 'So give every town you cover a page of its own. [your town] goes in the h1, in the title tag and in the first sentence. Once in each. Not stuffed in twelve times, which reads badly and stopped working years ago. Then write normally about the work you do there.' },
          { p: 'BrightLocal’s Local Consumer Review Survey 2026 asked 1,002 consumers in the US: 97% read reviews before choosing a local business, and the share using AI tools to find one went from 6% to 45% in a year. It’s a US survey, so take it as direction rather than gospel. The direction is that more people ask a machine now, and a machine reads your town pages the way a search engine does.' },
        ],
      },
      {
        h2: PLUMBER_Q.running,
        blocks: [
          { p: 'A domain from £8 a year, hosting between £4 and £80 a month for a site this size, and about £50 a year for an SSL certificate if your host doesn’t bundle it. Those are Checkatrade’s figures.' },
          { p: 'Most trades sites sit at the bottom of that range. £4 to £10 a month is normal.' },
          { p: 'Then there’s the running cost nobody counts, which is Checkatrade itself. SwiftLead’s 2026 breakdown puts membership at roughly £60 to £150 a month depending on trade and region. Three years of that is £2,160 to £5,400, and you own nothing at the end. Stop paying and the leads stop the same week.' },
          SHOW_PRICING
            ? { p: `I do it the other way round: <a href="/prices/">${money(BUILD_FEE)} to build, then ${money(ONLINE.monthly)} a month</a>. Stop paying me and the site comes down, but the domain, the content, the photos and the reviews are yours, sent over inside seven days, free. That’s written on the prices page because it’s the thing this trade gets burned on.` }
            : { p: 'Whatever you end up paying, ask what happens if you stop. Who holds the domain, who holds the content, and whether the site comes down or comes with you. A quote that won’t break into those three answers is hiding at least one of them.' },
        ],
      },
    ],
    /* Four of the six headings, word for word from PLUMBER_Q, with the answers
       tightened to the length an assistant will actually read out. The two left
       out are the ones whose answers only make sense with the table or the
       placeholder town in front of you. */
    faqs: [
      {
        q: PLUMBER_Q.cost,
        a: 'Anything from £9 a month doing it yourself on Wix, to £500 to £1,500 for a one off '
          + 'freelance build, to £2,000 to £10,000 from a small agency. Checkatrade’s own cost '
          + 'guide puts a full website design at £495 to £15,000, average £7,747.50, though that '
          + 'table was last updated in May 2024.',
      },
      {
        q: PLUMBER_Q.diy,
        a: 'In year one, yes. A realistic do it yourself year is £240 to £360 including a domain '
          + 'and a business email, on Expertsure’s 2026 figures. The costs that follow are your '
          + 'own time, and the fact that a site built on Wix stays on Wix if you ever move.',
      },
      {
        q: PLUMBER_Q.gasSafe,
        a: 'In the header or the footer, next to your phone number, with the registration number '
          + 'written out as text in the footer of every page and again on your about page. '
          + 'Customers check it, and Google’s quality raters look for exactly that kind of '
          + 'verifiable claim.',
      },
      {
        q: PLUMBER_Q.running,
        a: 'A domain from £8 a year, hosting from £4 to £80 a month for a small site, and about '
          + '£50 a year for an SSL certificate if it is not bundled with the hosting. Those are '
          + 'Checkatrade’s figures. Most trades sites sit at the bottom of the hosting range.',
      },
    ],
    close: SHOW_PRICING
      ? {
          href: '/prices/',
          line:
            'Every plan is written down, including what happens if you leave: '
            + `${money(BUILD_FEE)} to build, then from ${money(ONLINE.monthly)} a month.`,
          cta: 'See the prices',
        }
      : {
          href: '/guides/how-much-a-trades-website-costs/',
          line:
            'The same question answered without me selling you anything, for trades other than '
            + 'plumbing too.',
          cta: 'Read the guide',
        },
    action: {
      href: '/contact/#enquiry',
      line: 'Every figure above is somebody else’s. Yours depends on how many towns you want.',
      cta: 'Send an enquiry',
    },
  },
  {
    slug: 'why-trades-websites-cost-so-much',
    date: '2026-08-09',
    headline: 'Why trades websites cost so much',
    title: 'Why trades websites cost so much | Picsel',
    description: SHOW_PRICING
      ? 'Where the money goes in a three thousand pound website quote, what a trades website ' +
        'actually has to do, and what I charge instead. With one real number.'
      : 'Where the money goes in a three thousand pound website quote, what a trades website ' +
        'actually has to do, and how to tell the two apart. One real number.',
    standfirst:
      'A five page website for a plumber does not cost three thousand pounds to make. It ' +
      'costs that to sell, to manage, and to sign off.',
    sections: [
      {
        h2: 'Where three thousand pounds goes',
        /* Moved from `paragraphs` to `blocks` so the list can sit between the
           two framing sentences. The legacy shape renders its list after every
           paragraph, which would put the closing line above the thing it is
           closing.

           A LIST AND NOT A BAR. A proportion bar needs a number against each of
           these four and no such split exists, here or anywhere. The rule at
           the top of this file is that a post carries a figure only if a
           stranger could check it, and four invented percentages to fill a
           chart is precisely what that is there to stop. */
        blocks: [
          { p: 'The quote is usually honest and the work behind it is real. It is just that most of it is not work on your website.' },
          { list: [
            'An account manager, whose job is to be the person you ring.',
            'A discovery workshop, which is a meeting about what you do for a living.',
            'Three rounds of design, on a site with five pages on it.',
            'An office, the people in it, and the software they run.',
          ] },
          { p: 'The design rounds are the tell. Three of them is a process written for a client with a marketing department to satisfy, and you are being sold it at what it costs to run.' },
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
      /* The section that names my own three plans, and the version that runs
         while SHOW_PRICING is off. Both make the same argument, which is that
         the number matters less than whether anyone will say it out loud. The
         second one has to make it without a price list behind it, so it says
         where the plans have gone rather than pretending there were never
         any. */
      SHOW_PRICING
        ? {
            h2: 'What I charge, and what is in it',
            blocks: [
              { p: `${money(BUILD_FEE)} to build it, whichever plan you pick. Then one of these every month.` },
              { table: buildPlanTable({ showPricing: SHOW_PRICING }) },
              { p: 'One build fee rather than three is deliberate. Three would invite you to compare them, and the moment you do, the cheap plan reads as the cheap build. It is the same build every time.' },
              { p: 'The figures matter less than where they are. They are on the website, so you can hold them against anyone else before you pick up the phone. Most of this trade still makes you ring to find out. If you want a straight price for your own job, <a href="/contact/">get in touch</a> and I will give you one on the phone.' },
            ],
          }
        : {
            h2: 'What to ask before you sign anything',
            paragraphs: [
              'Ask what the build costs and what the running costs, separately. Ask what ' +
                'happens in month two. Ask who owns the domain and who owns the site if you ' +
                'leave. A quote that will not break into those parts is hiding at least one ' +
                'of them.',
              'I am rebuilding my own plans, so there is no price list here to hold anyone ' +
                'against. Ring, or <a href="/contact/">send me the details</a>, and I will give ' +
                'you a figure for your own job broken into those same parts, before you have ' +
                'committed to anything.',
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
    close: SHOW_PRICING
      ? {
          href: '/prices/',
          line:
            'Every plan is written down, including what it does not cover: ' +
            `${money(BUILD_FEE)} to build, then from ${money(ONLINE.monthly)} a month.`,
          cta: 'See the prices',
        }
      : {
          href: '/work/',
          line:
            /* Counted from the list, not typed. This branch only renders while
               SHOW_PRICING is off, which is exactly how a hand-written number
               goes stale unnoticed: nobody re-reads the copy that is currently
               hidden. */
            `That argument is only worth what the work behind it is worth. ${countWord(PROJECTS.length, { capitalise: true })} live sites, ` +
            'each with a note on what it had to do.',
          cta: 'See the sites',
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
        <h1 class="post__headline">${escapeHtml(post.headline)}</h1>
        <p class="post__meta">
          <time datetime="${escapeHtml(post.date)}">${escapeHtml(longDate(post.date))}</time>
        </p>

        <p class="post__standfirst">${escapeHtml(post.standfirst)}</p>

${action}

        <div class="post__cols">
          <div class="post__col">
${sections}

        <aside class="post__close">
          <p>${escapeHtml(post.close.line)}</p>
          <a class="post__close-link" href="${escapeHtml(post.close.href)}">${escapeHtml(post.close.cta)}</a>
        </aside>
          </div>

${renderArticleRail({ prefix: 'post', sections: post.sections })}
        </div>
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
      /* Only the posts that are written as questions carry one, which so far
         means the cost post. The questions come from the same constant the h2s
         are rendered from, so the node cannot quote a question the page does
         not ask. */
      ...(post.faqs
        ? [{
            '@type': 'FAQPage',
            '@id': `${absoluteUrl(`/blog/${post.slug}/`)}#faq`,
            mainEntity: post.faqs.map(({ q, a }) => ({
              '@type': 'Question',
              name: q,
              acceptedAnswer: { '@type': 'Answer', text: a },
            })),
          }]
        : []),
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
