/* ---- prices.js — /prices --------------------------------------------------
   The money page. Every figure comes from pricing.js and nothing on this page
   is typed, so the site and the price card cannot drift apart.

   THE ORDER OF THIS PAGE IS THE ARGUMENT, and it is worth understanding before
   moving a section.

     1. THE BUILD FEE, ALONE, FIRST. One number, before a plan is named. Lead
        with the plans instead and a reader compares three build fees that do
        not exist, then reads the cheap plan as the cheap build. Stating one
        fixed fee removes a decision from the sale rather than adding one.
     2. THE RESCUE, at £89, framed as the way in for somebody who is not ready
        to buy a website. It comes off the build fee later, which turns a one
        off job into a deposit.
     3. THE PLANS, as a ladder, with the try-Growth offer attached underneath
        by renderPlanCards. That offer is the most commercially important
        sentence on the page and it is why it is not in a footer.
     4. PROOF. Three sites these plans have built, at addresses a reader can
        open in another tab. This is the page where somebody decides whether to
        believe the numbers, and three live sites settle it faster than copy.
     5. THE ANNUAL OPTION, then what Growth commits to, then the four questions
        this audience will not ask on a call.
     6. THE EXTRAS LAST, and quiet. The hourly rate has to be published,
        because charging by the hour without naming the rate is how a small
        bill becomes an argument. It must not sit near Growth: an advertised
        hourly rate invites a reader to price a monthly plan by the hour, which
        is an argument with a spreadsheet that does not know what the monthly
        work is.

   WHY THERE ARE PRICES ON THE SITE AT ALL. The social bios have always led
   with "from £15 a month" while the site named no number, which is a
   contradiction anyone can find in one tab switch.

   VOICE. "We", like every other page. It was drafted in the first person
   singular and changed back, because the studio voice is the one the other ten
   pages use and a money page that suddenly speaks as one man reads as a
   different business from the one the reader has just been through. The blog
   is the deliberate exception: a signed column is allowed to say "I". */

import { SITE, absoluteUrl } from '../../site.config.js';
import {
  PLANS,
  EXTRAS,
  GUARANTEE,
  BUILD_FEE,
  BUILD_LINE,
  BUILD_WHAT,
  RESCUE,
  ANNUAL,
  PAUSE,
  LEAVING,
  OWNERSHIP,
  money,
} from '../../pricing.js';
import { PROJECTS } from '../../projects.js';
import { escapeHtml } from '../templates/page.js';
import { renderFaq } from '../partials/faq.js';
import { SHOT_SIZES, shotSrcset } from '../templates/images.js';
import { breadcrumbs, ORG_ID } from '../templates/schema.js';
import { renderBreadcrumbs } from '../partials/breadcrumbs.js';
import { renderContactBand } from '../partials/contact-band.js';
import { renderPlanCards, renderGrowthCommitments } from '../partials/plan-cards.js';
import { PAGE_BLOB, PAGE_BLOB_SCRIPT } from '../partials/page-blob.js';

/* Declared once, ahead of everything below that reads it, so the visible nav
   and the JSON-LD in PRICES_PAGE.schemaExtra cannot end up naming a different
   trail for the one page on the site that most needs the two to agree. */
const PRICES_TRAIL = [
  { name: 'Home', path: '/' },
  { name: 'Prices', path: '/prices/' },
];

/* ---- A. The build fee -----------------------------------------------------
   The first thing on the page, and it has to land in about two seconds.

   IT WAS THREE PARAGRAPHS AND IT IS NOW A NUMBER AND FOUR LINES. The old
   version buried £299 in a sentence set at body size and then explained it
   twice underneath, which is the wrong shape for a page most of this audience
   opens on a phone with a job on. The figure is now display size and the one
   accent-coloured thing above the fold, and everything that was prose is four
   points a reader can take in without reading them in order.

   THE FOUR SERVICE LINKS THAT USED TO BE HERE moved to the foot of the page,
   as DETAIL_LINE. They are worth keeping, because a page that names four
   services and links none of them is a dead end, but they were a fourth
   paragraph in a header that already had too many. Somebody who wants to know
   what the money buys in detail wants it after the prices, not instead of
   them. */
const HEAD = `    <section class="section prices-head">
      <div class="wrap page-head">
        <div class="page-head__text">
          <p class="eyebrow">Prices</p>
          <h1>What a website costs</h1>

          <p class="prices-head__fee">
            <span class="prices-head__amount">${money(BUILD_FEE)}</span>
            <span class="prices-head__what">${escapeHtml(BUILD_WHAT)}</span>
          </p>

          <ul class="prices-head__points">
            <li>One build fee, the same on all three plans</li>
            <li>Then from ${money(PLANS[0].monthly)} a month, and you pick how much we do</li>
            <li>Every price here is the price, with no setup fee behind it</li>
            <li>Two of the three you can cancel any time</li>
          </ul>

          <p class="prices-head__note">
            Been quoted more than this elsewhere?
            <a href="/blog/why-trades-websites-cost-so-much/">Where that money usually goes</a>.
          </p>
        </div>

${PAGE_BLOB}
      </div>
    </section>`;

/* The four service pages, at the foot of the page rather than the head. See the
   note above HEAD for why they moved. */
const DETAIL_LINE = `    <section class="section prices-detail">
      <div class="wrap">
        <p class="prices-detail__line">
          What the money actually buys is set out one job at a time:
          <a href="/services/websites-for-tradespeople/">websites for tradespeople</a>,
          <a href="/services/google-business-profile/">Google Business Profile</a> work,
          <a href="/services/search-and-ai-visibility/">search and AI visibility</a>, and
          <a href="/services/custom-tools/">custom tools</a>.
        </p>
      </div>
    </section>`;

/* ---- B. The way in --------------------------------------------------------
   Above the plans on purpose. Somebody who has never had a website is not
   choosing between three of them yet, and the honest first job for most of
   this audience is the free listing they already own and have never claimed. */
const RESCUE_SECTION = `    <section class="section rescue" id="rescue" aria-labelledby="rescue-heading">
      <div class="wrap rescue__inner">
        <div class="rescue__words">
          <h2 id="rescue-heading">${escapeHtml(RESCUE.heading)}</h2>
          <p class="measure">${escapeHtml(RESCUE.body)}</p>
          <p class="measure rescue__credit">${escapeHtml(RESCUE.credit)}</p>
          <p class="measure">
            If yours has gone quiet or never showed up properly, read
            <a href="/guides/google-business-profile-not-showing/">why is my Google Business
            Profile not showing up</a> before you pay anybody to fix it, us included.
          </p>
        </div>

        <p class="rescue__price">
          <span class="rescue__amount">${money(RESCUE.price)}</span>
          <span class="rescue__period">one off</span>
        </p>
      </div>
    </section>`;

/* ---- C and D. The plans, and the try-Growth offer --------------------------
   renderPlanCards draws both. The offer is attached to the cards by the
   partial rather than placed by this page, so the two cannot come adrift. */
const PLAN_SECTION = `    <section class="section plans-full" aria-labelledby="plans-full-heading">
      <div class="wrap">
        <h2 class="visually-hidden" id="plans-full-heading">The three plans</h2>

${renderPlanCards()}
      </div>
    </section>`;

/* ---- Proof ----------------------------------------------------------------
   The only band on this page with pictures in it, and the reason it earns them
   is that this is the page where a reader is deciding whether to believe the
   numbers. A tradesperson who has been quoted four figures by an agency reads
   "£299 to build" as either a bargain or a warning, and no amount of copy
   settles which. Three sites that exist, at addresses they can open in another
   tab, with the plan each one runs on named underneath, settles it in about
   four seconds.

   NOTHING HERE IS A NEW CLAIM. The screenshot, the name and the alt text come
   from projects.js, and the plan comes from the `plan` field, which is the same
   fact each project page already states in the sentence linking back to this
   one. There is no outcome, no traffic figure and no rating attached to any of
   them, because none of those are facts this repo holds.

   THREE, AND THE FIRST THREE IN LIST ORDER. Five is the whole portfolio and
   that page already exists a click away; three is a sample, and it fits a row.
   Taken in PROJECTS order rather than hand-picked, because that order is
   already a deliberate one (see the note at the foot of projects.js) and a
   hand-picked trio here would be a second, invisible editorial decision that
   nobody maintaining this file would know to keep in step. */
const BUILT_ON = PROJECTS.filter((project) => project.plan).slice(0, 3);

const BUILT_SECTION = `    <section class="section built-on" aria-labelledby="built-on-heading">
      <div class="wrap">
        <div class="section-head">
          <h2 class="section-head__title" id="built-on-heading">What these plans have built</h2>
          <a class="section-head__link" href="/work/">See all the work</a>
        </div>

        <ul class="built-on__list">
${BUILT_ON.map((project) => {
  const plan = PLANS.find((candidate) => candidate.id === project.plan);
  const size = SHOT_SIZES.desktop;

  return `          <li class="built-on__item">
            <a class="built-on__link" href="/work/${escapeHtml(project.slug)}/">
              <span class="built-on__frame">
                <img
                  class="built-on__shot"
                  src="/assets/work/${escapeHtml(project.slug)}/desktop.webp"
                  srcset="${escapeHtml(shotSrcset(project.slug, 'desktop'))}"
                  sizes="(min-width: 64rem) 21rem, 92vw"
                  alt="${escapeHtml(project.alt)}"
                  width="${size.width}"
                  height="${size.height}"
                  loading="lazy"
                  decoding="async"
                />
              </span>
              <span class="built-on__name">${escapeHtml(project.name)}</span>
            </a>
            <p class="built-on__plan">Built on ${escapeHtml(plan.name)}</p>
          </li>`;
}).join('\n\n')}
        </ul>
      </div>
    </section>`;

/* ---- F. Paying for the year up front --------------------------------------
   Three figures rather than a percentage. "Save 17%" is a sum the reader has
   to do; £150 is a number they can compare to what is in the account. */
const ANNUAL_SECTION = `    <section class="section annual" id="annual" aria-labelledby="annual-heading">
      <div class="wrap annual__inner">
        <div class="annual__words">
          <h2 id="annual-heading">Pay for the year up front</h2>
          <p class="measure">
            ${escapeHtml(ANNUAL.headline)} Paid once, then nothing until the same time next
            year.
          </p>
        </div>

        <dl class="annual__list">
${ANNUAL.prices.map(
  ({ plan, price }) => `          <div class="annual__item">
            <dt class="annual__plan">${escapeHtml(plan)}</dt>
            <dd class="annual__price">${money(price)}</dd>
          </div>`,
).join('\n')}
        </dl>
      </div>
    </section>`;

/* ---- H. The straight answers ----------------------------------------------
   Four questions, and they do more selling than the price table above them.
   This audience has usually been burned before, and these are the fears they
   will not raise on a call. They will just not ring.

   FOUR, AND ONLY FOUR. The operational questions somebody asks after they have
   decided (how long until it is live, what happens if a payment is missed, can
   I move between plans) are answered on
   /services/websites-for-tradespeople/, which is where a reader who has got
   that far already is. Repeating them here would bury the four that matter. */
const FAQS = [
  {
    q: 'Can I pay for the year up front?',
    a:
      `${ANNUAL.headline} ` +
      ANNUAL.prices.map(({ plan, price }) => `${plan} ${money(price)}`).join(', ') +
      '.',
  },
  {
    q: 'Can I pause?',
    a: PAUSE.body,
  },
  {
    q: 'What if I leave?',
    a: LEAVING,
  },
  {
    q: 'Who owns what?',
    a: OWNERSHIP,
  },
];

const FAQ_SECTION = `    <section class="section prices-faq" aria-labelledby="prices-faq-heading">
      <div class="wrap">
${renderFaq({
  faqs: FAQS,
  name: 'prices-faq',
  heading: 'Straight answers',
  headingId: 'prices-faq-heading',
})}
      </div>
    </section>`;

/* ---- E. The extras --------------------------------------------------------
   Last on the page and styled quiet. Read the note at the top of this file for
   why the hourly rate is here rather than up beside the plans, and read the
   one in pricing.js for why it is published at all. */
const EXTRAS_SECTION = `    <section class="section extras" id="extras" aria-labelledby="extras-heading">
      <div class="wrap">
        <div class="section-head">
          <h2 class="section-head__title" id="extras-heading">Other things we do</h2>
        </div>

        <dl class="extras__list">
${EXTRAS.map(
  (extra) => `          <div class="extras__item${extra.quiet ? ' extras__item--quiet' : ''}">
            <dt class="extras__name">${escapeHtml(extra.name)}</dt>
            <dd class="extras__price">${escapeHtml(extra.price)}</dd>
            <dd class="extras__body">${escapeHtml(extra.body)}</dd>
          </div>`,
).join('\n\n')}
        </dl>
      </div>
    </section>`;

/* ---- The machine-readable version -----------------------------------------
   One Service node per plan, each carrying its own monthly Offer, plus the
   single build fee as an Offer on the page's own node. The build fee is not
   repeated onto each plan for the same reason it is not printed on each card:
   there is one of it.

   Growth's Offer states £179, the rate a client pays from month four onward,
   with the opening rate as a second Offer beside it. Putting £99 in as the
   price would describe a plan that costs that forever, which is not the offer.

   No aggregateRating and no review count. There are none, and the standard way
   this markup goes wrong is inventing them. */
const PLAN_SCHEMA = PLANS.map((plan) => ({
  '@type': 'Service',
  '@id': `${absoluteUrl('/prices/')}#${plan.id}`,
  name: `${plan.name} plan`,
  description: plan.summary,
  provider: { '@id': ORG_ID },
  serviceType: 'Website design and search visibility',
  areaServed: { '@type': 'Country', name: 'United Kingdom' },
  offers: [
    {
      '@type': 'Offer',
      name: `${plan.name}, monthly`,
      price: String(plan.monthly),
      priceCurrency: 'GBP',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: String(plan.monthly),
        priceCurrency: 'GBP',
        unitCode: 'MON',
        billingIncrement: 1,
      },
    },
    ...(plan.openingMonthly
      ? [
          {
            '@type': 'Offer',
            name: `${plan.name}, first ${plan.openingMonths} months`,
            price: String(plan.openingMonthly),
            priceCurrency: 'GBP',
            priceSpecification: {
              '@type': 'UnitPriceSpecification',
              price: String(plan.openingMonthly),
              priceCurrency: 'GBP',
              unitCode: 'MON',
              billingIncrement: 1,
            },
          },
        ]
      : []),
  ],
}));

const PAGE_OFFERS = [
  {
    '@type': 'Offer',
    name: 'Website build fee',
    price: String(BUILD_FEE),
    priceCurrency: 'GBP',
  },
  {
    '@type': 'Offer',
    name: RESCUE.name,
    price: String(RESCUE.price),
    priceCurrency: 'GBP',
  },
];

export const PRICES_PAGE = {
  path: '/prices/',
  title: 'Website prices for tradespeople | Picsel',
  description:
    `${money(BUILD_FEE)} to build, then from ${money(PLANS[0].monthly)} a month. Three plans, what each one covers, and the answers on pausing, leaving and who owns what. No lock-in on two of them.`,
  schemaExtra: [
    {
      '@type': 'Service',
      '@id': `${absoluteUrl('/prices/')}#build`,
      name: 'Website build',
      description: BUILD_LINE,
      provider: { '@id': ORG_ID },
      serviceType: 'Website design and build',
      areaServed: { '@type': 'Country', name: 'United Kingdom' },
      offers: PAGE_OFFERS,
    },
    ...PLAN_SCHEMA,
    {
      '@type': 'FAQPage',
      '@id': `${absoluteUrl('/prices/')}#faq`,
      mainEntity: FAQS.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    },
    breadcrumbs(PRICES_TRAIL),
  ],
  styles: ['/prices.css'],
  extraScripts: PAGE_BLOB_SCRIPT,
  content: [
    renderBreadcrumbs(PRICES_TRAIL),
    HEAD,
    RESCUE_SECTION,
    PLAN_SECTION,
    /* Directly under the cards, which is where the question it answers gets
       asked. Someone who has just read three monthly figures is at their most
       sceptical on this page, and the next thing they meet is three sites
       those figures paid for. */
    BUILT_SECTION,
    ANNUAL_SECTION,
    renderGrowthCommitments(),
    FAQ_SECTION,
    EXTRAS_SECTION,
    DETAIL_LINE,
    renderContactBand({
      heading: 'Not sure which one?',
      body: `Ring and describe the job. We&rsquo;ll tell you which plan fits and, if none of them do, we&rsquo;ll say that too. ${escapeHtml(GUARANTEE.proposal)}`,
    }),
  ].join('\n\n'),
};
