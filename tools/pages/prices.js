/* ---- prices.js — /prices --------------------------------------------------
   The page this site did not have, and the reason it needed one: the social
   bios have always led with "from £15 a month" while the site named no number
   anywhere. Anyone comparing the two found the gap in a single tab switch, and
   a studio selling honesty cannot be the one being vague about money.

   Every figure comes from pricing.js. Nothing on this page is typed.

   THE JOB OF THIS PAGE is to let someone rule themselves out. That sounds
   defeatist and it is the opposite: this audience has been quoted four figures
   by an agency and £30 by a man who vanished, and the useful thing a price page
   does is tell them quickly which conversation this is. So the numbers are
   large, near the top, and next to what they do and do not cover.

   TWO CLAIMS ON THIS PAGE ARE PROMISES rather than descriptions, and both are
   Growth-only: the one-trade-per-patch exclusivity and the lead guarantee.
   Neither is written here. They come from SITE.exclusivity and GUARANTEE, and
   they render into their own band under the cards rather than inside the Growth
   card, which is a layout decision with a copy consequence worth knowing about.

   They were in the card. Two paragraphs of terms in a third-width column made
   Growth nearly twice the height of Online, and three cards of wildly different
   heights stop reading as a comparison, which is the only thing a price table
   is for. Moving them out fixed the column and gave the refund terms room to be
   read. What it must never do is loosen them: the band is headed with the plan
   name, both pieces of wording name the plan themselves, and the Growth card
   links down to it. tools/build.js fails the build if any page states the patch
   promise without naming Growth. */

import { PLANS, EXTRAS, FOUNDING_OFFER, GUARANTEE, money } from '../../pricing.js';
import { absoluteUrl } from '../../site.config.js';
import { escapeHtml } from '../templates/page.js';
import { breadcrumbs, ORG_ID } from '../templates/schema.js';
import { renderPlanCards, renderGrowthCommitments } from '../partials/plan-cards.js';
import { renderContactBand } from '../partials/contact-band.js';
import { PAGE_BLOB, PAGE_BLOB_SCRIPT } from '../partials/page-blob.js';

const HEAD = `    <section class="section prices-head">
      <div class="wrap page-head">
        <div class="page-head__text">
          <p class="eyebrow">Prices</p>
          <h1>What a website costs</h1>
          <p class="lede measure">
            Three plans. Each one contains the one before it, so the only question is how much
            of the ongoing work you want us doing. Every price on this page is the price:
            no setup fee hiding behind it, and nothing tied up for years. If you have been
            quoted more than this elsewhere, <a href="/blog/why-trades-websites-cost-so-much/">why
            trades websites cost so much</a> sets out where that money usually goes.
          </p>
        </div>

${PAGE_BLOB}
      </div>
    </section>`;

const PLAN_SECTION = `    <section class="section plans-full" aria-labelledby="plans-full-heading">
      <div class="wrap">
        <h2 class="visually-hidden" id="plans-full-heading">The three plans</h2>

${renderPlanCards()}
      </div>
    </section>`;

/* The founding offer sits under the plans rather than at the top. Someone who
   has not yet decided what a plan costs cannot tell whether a discount on it is
   worth having, and leading with a countdown is how a page reads as pressure. */
const FOUNDING = `    <section class="section founding" aria-labelledby="founding-heading">
      <div class="wrap founding__inner">
        <div class="founding__words">
          <h2 id="founding-heading">The first ${FOUNDING_OFFER.count} clients</h2>
          <p class="measure">
            While the studio is new, the build fee on any plan is ${money(FOUNDING_OFFER.build)}
            instead of ${money(PLANS[0].build)} or ${money(PLANS[2].build)}, on a
            ${escapeHtml(FOUNDING_OFFER.term)} term. The monthly price is the normal one.
          </p>
          <p class="measure">
            It is a straight trade and here is our half of it. In return we ask for three things:
          </p>
          <p class="measure">
            If you think you are one of the five, <a href="/contact/">get in touch</a> and say so.
          </p>
        </div>

        <div class="founding__ask">
          <ul class="founding__list">
${FOUNDING_OFFER.give.map((item) => `            <li>${escapeHtml(item)}</li>`).join('\n')}
          </ul>
          <!-- What happens when the offer runs out, said before anyone has to
               ask. A limited offer with no stated end is not a limited offer,
               it is a price with urgency painted on it. -->
          <p class="founding__after">${escapeHtml(FOUNDING_OFFER.after)}</p>
        </div>
      </div>
    </section>`;

/* Off the ladder on purpose: these are jobs rather than subscriptions, and
   folding them into the three cards would cost every reader a paragraph for the
   benefit of the few who want them. */
const EXTRAS_SECTION = `    <section class="section extras" id="extras" aria-labelledby="extras-heading">
      <div class="wrap">
        <div class="section-head">
          <h2 class="section-head__title" id="extras-heading">Other things we do</h2>
        </div>

        <p class="extras__note">
          If your Google Business Profile has gone quiet or never showed up properly, read
          <a href="/guides/google-business-profile-not-showing/">why is my Google Business
          Profile not showing up</a> before you pay anyone to fix it.
        </p>

        <dl class="extras__list">
${EXTRAS.map(
  (extra) => `          <div class="extras__item">
            <dt class="extras__name">${escapeHtml(extra.name)}</dt>
            <dd class="extras__price">${escapeHtml(extra.price)}</dd>
            <dd class="extras__body">${escapeHtml(extra.body)}</dd>
          </div>`,
).join('\n\n')}
        </dl>
      </div>
    </section>`;

/* ---- Questions before you pay ----------------------------------------------
   CLAUDEseo section 5 calls an FAQ on the money page the highest-value
   structure for AI extraction on a small business site, and /prices did not
   have one while every guide did. These are the questions a tradesperson
   actually asks before paying, not a generic template list, and every answer
   is a fact already established elsewhere in this file or in pricing.js: the
   plan data, the guarantee, the exclusivity promise. Nothing here is a new
   claim.

   Two real questions were left out on purpose: what happens to the site if a
   client stops paying, and whether someone can move between plans later.
   Neither has an answer written down anywhere in the repo, and guessing one
   for a money page is worse than leaving the gap visible. */
const FAQS = [
  {
    q: 'Who owns the domain?',
    a: 'You do. The domain is registered in your name, and you keep it, the site and your ' +
      'Google Business Profile whatever happens afterwards.',
  },
  {
    q: 'How long until the site is live?',
    a: "About a week for Online, once we have your logo, your photos and the jobs you want " +
      "listed. Managed and Growth take just as long to build, since the build itself doesn't " +
      "change.",
  },
  {
    q: "What's not included?",
    a: "On Online, ongoing edits aren't included. Changes are quoted when you want them. " +
      'Managed and Growth both cover minor edits and monthly work as part of the price, set out ' +
      'above.',
  },
  {
    q: "What if the site doesn't bring me any work?",
    a: "On Growth, if the site and your Google Business Profile don't bring you five genuine " +
      'customer enquiries in four months, we refund the build fee in full. The monthly fee ' +
      "doesn't come back, since it pays for work already done. Either way, you keep the site, " +
      'the domain and the profile.',
  },
  {
    q: 'Will you build a site for a competitor of mine?',
    a: "Not on Growth. If we're already working for a tradesperson in your town and about " +
      "eight miles around it, we won't take on a direct competitor there while you're a client. " +
      'A different trade in the same patch is fine.',
  },
];

const FAQ_SECTION = `    <section class="section prices-faq" aria-labelledby="prices-faq-heading">
      <div class="wrap">
        <div class="section-head">
          <h2 class="section-head__title" id="prices-faq-heading">Questions before you pay</h2>
        </div>

        <div class="faq__grid">
${FAQS.map(
  ({ q, a }) => `          <div class="faq__item">
            <h3 class="faq__q">${escapeHtml(q)}</h3>
            <p class="faq__a">${escapeHtml(a)}</p>
          </div>`,
).join('\n\n')}
        </div>
      </div>
    </section>`;

/* ---- The machine-readable version -----------------------------------------
   One Service node per plan, each with the monthly Offer on it. The build fee
   is a second Offer rather than being folded into the monthly figure, because
   £15 a month and £99 once are two different prices and a schema that averaged
   them into one number would be describing a plan nobody sells.

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
    {
      '@type': 'Offer',
      name: `${plan.name}, build fee`,
      price: String(plan.build),
      priceCurrency: 'GBP',
    },
  ],
}));

export const PRICES_PAGE = {
  path: '/prices/',
  title: 'Website prices for tradespeople | Picsel',
  description:
    `Three plans, from ${money(PLANS[0].monthly)} a month with a ${money(PLANS[0].build)} build fee. What each one covers, what it does not, and the add-ons. No retainer, no lock-in, and a Growth refund.`,
  schemaExtra: [
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
    breadcrumbs([
      { name: 'Home', path: '/' },
      { name: 'Prices', path: '/prices/' },
    ]),
  ],
  styles: ['/prices.css'],
  extraScripts: PAGE_BLOB_SCRIPT,
  content: [
    HEAD,
    PLAN_SECTION,
    renderGrowthCommitments(),
    FOUNDING,
    EXTRAS_SECTION,
    FAQ_SECTION,
    renderContactBand({
      heading: 'Not sure which one?',
      body: `Ring and describe the job. We&rsquo;ll tell you which plan fits and, if none of them do, we&rsquo;ll say that too. ${escapeHtml(GUARANTEE.proposal)}`,
    }),
  ].join('\n\n'),
};
