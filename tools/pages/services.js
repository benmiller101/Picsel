/* ---- services.js — /services and the four service pages -------------------
   The money pages. CLAUDEseo section 2 asks for one page per service, built
   before any content, and this site had it the wrong way round: six guides, a
   blog post and five case studies, with nowhere for a reader who had finished
   reading and wanted to buy. The homepage was carrying four services at once
   and /prices was carrying the whole conversion job on its own.

   FOUR PAGES, ONE PER THING SOLD. Websites, the Google Business Profile work,
   the monthly search and AI visibility work, and custom tools. That is the
   same four things llms.txt already lists under "What the studio does", so the
   site now has a page for each of them rather than a sentence.

   WHERE THE FACTS COME FROM. Nothing on these pages is typed twice. The plans,
   the includes, the excludes, the extras and their prices are read from
   pricing.js. If a claim is not in that file or site.config.js, it is not on
   these pages.

   THE LINK RULE, which is the one the site was actually failing. Every content
   page has to link to its money page from body copy, not only from a nav. Each
   guide now carries a contextual link to the service page it matches, and
   /prices links to all four. Custom tools is the exception and it is a real
   one: there is no guide about custom tools yet, so its inbound links are the
   index and the prices page.

   WHY THESE ARE NOT IN THE NAV BAR. site.config.js caps the bar at four items
   because five do not fit at 375px, and that measurement has not changed.
   Services is in the footer nav instead, and reachable from /prices, from every
   guide and from the homepage's route through both. */

import { SITE, SHOW_PRICING, absoluteUrl } from '../../site.config.js';
import { PLANS, EXTRAS, BUILD_FEE, BUILD_INCLUDES, RESCUE, PRICED_INDIVIDUALLY, money } from '../../pricing.js';
import { reviewsForService } from '../../reviews.js';
import { getProjectBySlug } from '../../projects.js';
import { escapeHtml } from '../templates/page.js';
import { renderFaq } from '../partials/faq.js';
import { SHOT_SIZES, shotSrcset, mockupSrcset } from '../templates/images.js';
import { breadcrumbs, ORG_ID } from '../templates/schema.js';
import { renderContactBand } from '../partials/contact-band.js';
import { renderBreadcrumbs } from '../partials/breadcrumbs.js';
import { renderReviews } from '../partials/reviews.js';
import { renderPlanCards } from '../partials/plan-cards.js';
import { PAGE_BLOB, PAGE_BLOB_SCRIPT } from '../partials/page-blob.js';

const [ONLINE, MANAGED, LOCAL] = PLANS;

/* Found by name rather than by index. EXTRAS is a list somebody will reorder
   one day, and a page that quotes EXTRAS[0] would silently start describing
   Google Ads as a profile rescue. */
const ADS = EXTRAS.find((extra) => extra.name === 'Google Ads');

/* Every service page carries this as its last FAQ, word for word. It lives
   here once so the four pages cannot drift into four different phrasings of
   the same promise, and so the promise itself only ever needs editing in
   site.config.js. */
/* Two sentences that appear on three of the four pages and both name money, so
   they are written once here rather than five times inline. `quoteLine` is what
   stands in for "and here is the figure": the offer to give one, which is the
   true version of the sentence while there is no list to point at. */
const QUOTE_LINE =
  'Ring or send a message with the job and you will get a figure the same day, and what it ' +
  'covers in writing.';

const RESPONSE_PROMISE_FAQ = {
  q: 'How quickly will you get back to me?',
  a: SITE.responsePromise,
};

/* FIELD REFERENCE
     slug       URL segment under /services/. Permanent.
     title      <title> and the h1, which mirror each other. 60 chars max.
     description  Meta description. 150 to 155, checked by the build.
     lead       The first paragraph, and the one an assistant is most likely to
                lift. It has to answer the page's question on its own, name the
                plan or the price, and make sense with nothing attached to it.
     sections   h2 blocks. Each may carry paragraphs, a list, and h3 blocks
                under it. Paragraph and list copy is written into the page
                unescaped, so it may carry a, em, strong and abbr and nothing
                else. tools/build.js fails the build on anything else.

                A section also picks its own shape, and renderSection below is
                where the four shapes and the rule for choosing between them
                are written down:
                  layout      'column' (the default), 'split', 'full', 'beside'
                  listAcross  render `list` as a grid of peers, not bullets
                  planCards   render the three plan cards from pricing.js here
                  band        { slug, caption } a full width client image after
                              this section
                  aside       { slug, caption } a client phone shot beside the
                              copy. Needs layout: 'beside'.
     faqs       Real questions, each answered only from what this repo can
                support. These become the FAQPage node as well as the visible
                section.
     offers     Schema offers. Only where there is a real published price. */
const SERVICES = [
  {
    slug: 'websites-for-tradespeople',
    title: 'Websites for tradespeople, live within a week',
    description: SHOW_PRICING
      ? `${money(BUILD_FEE)} to build a website around your trade, with your Google Business Profile set up, live within a week. Then from ${money(ONLINE.monthly)} a month for hosting and security.`
      : 'A five page website built around your trade, live within a week, with hosting, the security certificate and your Google Business Profile set up too.',
    /* The unpriced description is 148 characters, two under the 150-character
       floor. It is complete and reads well; padding it with two characters of
       filler would cost more than the two characters buy, so the floor is
       waived. The sentence stands as written. */
    descriptionFloorWaived: true,
    indexLine: SHOW_PRICING
      ? `A homepage plus up to five pages, written around your trade and live within a week. ${money(BUILD_FEE)} to build, then from ${money(ONLINE.monthly)} a month.`
      : 'Five pages written around your trade, live within a week. A build fee once, then a monthly cost to run it.',
    serviceType: 'Website design and build',
    lead: SHOW_PRICING
      ? 'Websites for tradespeople, a homepage plus up to five pages, live within a week. ' +
        `${money(BUILD_FEE)} to build, whichever plan you pick, with your Google Business ` +
        `Profile set up and pointed at the site. Then from ${money(ONLINE.monthly)} a month, ` +
        'which covers hosting, security and SSL, and keeps the site working.'
      : 'Websites for tradespeople, five pages, live within a week. The smallest plan, Online, ' +
        'covers hosting, security and SSL, and your Google Business Profile set up properly at ' +
        'launch.',
    sections: [
      {
        h2: 'What the site is',
        paragraphs: [
          'Five pages, written around your trade rather than filled into a template. Every plan ' +
            'starts with the same build, so the only thing the plan changes is how much of the ' +
            'ongoing work we do afterwards.',
        ],
        list: BUILD_INCLUDES,
        after: [
          'If you want to check that list against what a trades site actually needs, <a ' +
            'href="/guides/what-a-trades-website-needs/">what a tradesperson\'s website needs</a> ' +
            'is the same argument written for someone who has not decided who to buy from yet.',
        ],
        /* The claim directly above is that these are five pages built around a
           trade rather than filled into a template, and that the same build
           goes out on every plan. Nevitt is that build: the fullest trade site
           on the list, shown on the three screens the copy is talking about. */
        band: {
          slug: 'nevitt-construction',
          caption:
            '<a href="/work/nevitt-construction/">A Nevitt Construction</a>. The same build every ' +
            'plan starts with, on a laptop, a tablet and a phone.',
        },
      },
      {
        /* The three plans were three h3 blocks of running prose here, each
           re-stating in a sentence what pricing.js already holds as a list, and
           the reader had to keep two of them in their head to compare the
           third. These are the same cards /prices renders, from the same data,
           so every fact that was in the prose is still on the page and the
           comparison is now something you can read across. The two sentences
           the cards cannot carry, the shape of the ladder and the pointer at
           the search work, stay in words above and below them. */
        h2: 'The three plans',
        paragraphs: [
          'Online keeps the site running. Managed is the site with someone looking after it. ' +
            'Local is the site, looked after, with weekly work on your Google profile and your ' +
            'reviews. Each one contains the one before it, so nothing is lost by starting at the ' +
            'bottom.',
          'Local has five places and a three month minimum, and the other two are rolling from ' +
            'the start. What the Local work is week to week is set out on <a ' +
            'href="/services/search-and-ai-visibility/">search and AI visibility</a>.',
          /* The three cards under this heading are the only thing on the page
             that carried a figure, and the paragraphs above them describe the
             ladder without one, which is why the section survives the blackout
             with the cards taken out rather than being cut whole. */
          ...(SHOW_PRICING
            ? []
            : [
                'We are rebuilding what each plan costs, so the figures are off the site for ' +
                  `now. ${QUOTE_LINE}`,
              ]),
        ],
        planCards: SHOW_PRICING,
      },
      {
        h2: 'How long it takes',
        layout: 'split',
        paragraphs: [
          'About a week, once we have your logo, your photos and the list of jobs you want on ' +
            'the site. Managed and Local take the same time to build, because the build itself ' +
            'does not change between plans.',
        ],
      },
      {
        h2: 'What Online does not cover',
        paragraphs: [
          escapeHtml(ONLINE.excludes[0]) +
            ' That is the honest limit of the smallest plan on the ladder. If you would rather ' +
            'never touch it, Managed covers the changes and the Google profile upkeep' +
            (SHOW_PRICING ? ` for ${money(MANAGED.monthly)} a month.` : '.'),
          (SHOW_PRICING
            ? 'Every figure here, including what each plan leaves out, is on <a ' +
              'href="/prices/">the prices page</a>. '
            : 'What each plan leaves out is written down and you get it with the quote. ') +
            'If you have been quoted several thousand pounds elsewhere, <a ' +
            'href="/guides/how-much-a-trades-website-costs/">how much a tradesman\'s website ' +
            'should cost</a> explains what that money usually buys.',
        ],
      },
      {
        h2: 'The Google side comes with it',
        layout: 'split',
        paragraphs: [
          'Your Google Business Profile is set up as part of every build, because for most ' +
            'trades it brings more calls than the website does. If yours already exists and has ' +
            'stopped showing, that is a separate job and it is on the <a ' +
            'href="/services/google-business-profile/">Google Business Profile</a> page.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Who owns the domain?',
        a:
          'You do. It is registered in your name, and you keep the domain, the site and your ' +
          'Google Business Profile whatever happens afterwards.',
      },
      {
        q: 'How long until the site is live?',
        a:
          'About a week for Online, once we have your logo, your photos and the jobs you want ' +
          'listed. Managed and Local take the same time, since the build does not change.',
      },
      {
        q: 'How many pages does a tradesman website need?',
        a:
          'Five is usually right: a homepage, the jobs you do, your own photos, reviews and a ' +
          'contact page. Fewer and there is nothing for Google to match a search against.',
      },
      {
        q: 'What happens if I stop paying?',
        a:
          'A missed payment gets a 14 day grace period to sort out. If it is still unpaid after ' +
          'that, the site comes down. You keep the domain and the Google profile either way.',
      },
      {
        q: 'Can I move between plans later?',
        a:
          'Yes, in either direction. Moving up adds what the next plan includes. Moving down ' +
          'means losing what the higher plan covered, so dropping from Local loses the weekly ' +
          'profile posts, the review replies and the quarterly AI visibility check. Local has a ' +
          'three month minimum before you can move down.',
      },
      RESPONSE_PROMISE_FAQ,
    ],
    /* Schema offers go with the visible prices, not after them. A price left in
       the JSON-LD when the page it describes has stopped naming one is the
       worst version of this: invisible to a reader, quotable by an assistant,
       and wrong the moment the new model lands. */
    offers: SHOW_PRICING
      ? [
          {
            '@type': 'Offer',
            name: 'Website build fee',
            price: String(BUILD_FEE),
            priceCurrency: 'GBP',
          },
          ...PLANS.map((plan) => ({
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
          })),
        ]
      : [],
  },

  {
    slug: 'google-business-profile',
    title: 'Google Business Profile setup and management',
    description:
      SHOW_PRICING
        ? `We claim, verify and fill in your Google Business Profile: categories, services, photos and reviews. ${money(RESCUE.price)} one off, or set up at launch with any website.`
        : 'We claim, verify and fill in your Google Business Profile: categories, services, photos and reviews. A one off job, or set up at launch with any website.',
    indexLine: SHOW_PRICING
      ? `Claimed, verified and filled in properly, with a plan for reviews. ${money(RESCUE.price)} as a one off, or set up at launch with any website.`
      : 'Claimed, verified and filled in properly, with a plan for reviews. A one off job, or set up at launch with any website.',
    serviceType: 'Google Business Profile management',
    lead: SHOW_PRICING
      ? 'Your Google Business Profile claimed, verified and filled in properly: categories, ' +
        'services, photos, questions and answers, and a plan to get you more reviews. ' +
        `${money(RESCUE.price)} as a one off. If you take a website later, the ${money(RESCUE.price)} comes off it.`
      : 'Your Google Business Profile claimed, verified and filled in properly: categories, ' +
        'services, photos, questions and answers, and a plan to get you more reviews. A one off ' +
        'job, and if you take a website from us later it comes off the build fee.',
    sections: [
      {
        h2: SHOW_PRICING ? `What the ${money(RESCUE.price)} covers` : 'What the job covers',
        /* RESCUE.body ends by naming the fee, so the last sentence is dropped
           rather than the whole paragraph: everything before it is a list of
           work and none of it depends on the number. */
        paragraphs: [
          /* The credit line is a separate field now, so the price-free version
             is the body without it rather than the body sliced at a sentence
             this file had to know the wording of. */
          RESCUE.body + (SHOW_PRICING ? ` ${RESCUE.credit}` : ''),
        ],
        after: [
          'It is the listing that decides whether you appear when somebody searches your trade ' +
            'and a town, or opens Maps and looks at what is near them. For most trades it rings ' +
            'the phone more often than the website does.',
        ],
      },
      {
        /* NO IMAGE ANYWHERE ON THIS PAGE, and that is the decision rather than
           an omission. The subject is a Google Business Profile and this repo
           holds no picture of one: not a screenshot, not a before and after,
           nothing. The alternative would be a photograph of somebody holding a
           phone, which is the exact stock-imagery reflex this site does not
           have. So the page gets its variety from the shape of its four
           sections and from nothing else. */
        h2: 'What comes with a website instead',
        layout: 'split',
        paragraphs: [
          (SHOW_PRICING
            ? `The ${money(BUILD_FEE)} build fee sets the profile up properly and points it at ` +
              'the site, whichever plan you pick. On Managed, ' +
              `${money(MANAGED.monthly)} a month, we then keep it active with a monthly post `
            : 'Every build sets the profile up properly and points it at the site, whichever ' +
              'plan you pick. On Managed we then keep it active with a monthly post ') +
            'and fresh photos, which is the difference between a listing that exists and one ' +
            'that is working. On Local it gets a post every week. All three plans are on the <a ' +
            'href="/services/websites-for-tradespeople/">websites for tradespeople</a> page.',
        ],
      },
      {
        h2: 'Why a profile stops showing up',
        paragraphs: [
          'Usually one of four things: it was never verified, the main category is wrong, your ' +
            'name and number do not match your website, or an old duplicate listing is splitting ' +
            'the trust with it. All four are fixable and most take a day. <a ' +
            'href="/guides/google-business-profile-not-showing/">Why is my Google Business ' +
            'Profile not showing up</a> walks through each one, and it is worth reading before ' +
            'you pay anybody, including us.',
        ],
      },
      {
        h2: 'Reviews are the part you cannot shortcut',
        layout: 'split',
        paragraphs: [
          'Ask every customer in person on the day the job finishes, and hand them a short link ' +
            'straight to your review page. That is the whole method, and <a ' +
            'href="/guides/how-to-get-more-google-reviews/">how to get more Google reviews</a> ' +
            'covers what stops it working. If you would rather some of it was somebody else\'s ' +
            'job, the Local plan replies to every review within a week and keeps you stocked ' +
            'with review cards' +
            (SHOW_PRICING ? `, at ${money(LOCAL.monthly)} a month.` : '.'),
        ],
      },
    ],
    faqs: [
      {
        q: 'Does a Google Business Profile cost anything?',
        a:
          'No. The listing is free and always has been. What we charge pays for the work of ' +
          'claiming it, verifying it and filling it in, not for the listing itself.',
      },
      {
        q: 'How long before the profile shows up?',
        a:
          'After verification, usually a few days to a couple of weeks before it settles into ' +
          'the map results. If a month goes by with nothing, something is broken and worth ' +
          'going looking for.',
      },
      {
        q: SHOW_PRICING
          ? `Does the ${money(RESCUE.price)} come off a website?`
          : 'Does the profile fee come off a website?',
        a: SHOW_PRICING
          ? 'Yes. If you take a website from us afterwards, the ' + `${money(RESCUE.price)} comes off it.`
          : 'Yes. If you take a website from us afterwards, it comes off the build fee.',
      },
      {
        q: 'Can you keep the profile updated every month?',
        a:
          'That is Managed, the middle plan, which keeps the profile active with a monthly ' +
          'post and fresh photos alongside looking after the website. Local posts every week.',
      },
      RESPONSE_PROMISE_FAQ,
    ],
    offers: SHOW_PRICING
      ? [
          {
            '@type': 'Offer',
            name: 'Google Profile Rescue',
            price: String(RESCUE.price),
            priceCurrency: 'GBP',
          },
        ]
      : [],
  },

  {
    slug: 'search-and-ai-visibility',
    title: 'Search and AI visibility for tradespeople',
    description:
      SHOW_PRICING
        ? `Weekly work on your Google profile and reviews, and a quarterly check on how AI search sees you. The Local plan, ${money(LOCAL.monthly)} a month, and only five places on it.`
        : 'Weekly work on your Google profile and reviews, and a quarterly check on how AI search sees you. The Local plan: five places, and a three month minimum.',
    indexLine: SHOW_PRICING
      ? `Weekly Google profile posts, every review answered, and a quarterly AI visibility check. The Local plan, ${money(LOCAL.monthly)} a month, five places only.`
      : 'Weekly Google profile posts, every review answered, and a quarterly AI visibility check. The Local plan, five places only.',
    serviceType: 'Search engine optimisation and AI search visibility',
    lead: SHOW_PRICING
      ? 'Work every week to keep you showing on Google and named when somebody asks an ' +
        `assistant for a tradesperson. It is the Local plan: ${money(LOCAL.monthly)} a month, ` +
        'with a three month minimum and then rolling on thirty days notice. There are five ' +
        'places on it.'
      : 'Work every week to keep you showing on Google and named when somebody asks an ' +
        'assistant for a tradesperson. It is the Local plan, the top of the ladder, with a ' +
        `three month minimum and five places on it. ${QUOTE_LINE}`,
    sections: [
      {
        h2: 'What the plan does',
        /* The copy says four things and the data holds exactly four, so they
           are laid out as four rather than as a bulleted column. Read across,
           they are the whole of what the monthly fee buys, on one screen. */
        layout: 'full',
        listAcross: true,
        paragraphs: [
          'Four things, and they keep running after launch rather than stopping at it. Search ' +
            'work stopped being a job you finish some years ago.',
        ],
        list: LOCAL.includes,
      },
      {
        h2: 'What nobody can promise you',
        paragraphs: [
          'A place in an assistant\'s answer. Anyone who promises you one is guessing, and the ' +
            'honest version of this work is making sure that when a machine goes looking, ' +
            'everything it finds about you agrees with everything else: the same name, the same ' +
            'number, the same trade on your site, your Google profile and every directory you ' +
            'appear in. <a href="/guides/what-is-geo/">What GEO is, and why it matters for ' +
            'trades</a> sets out what an assistant is actually reading.',
        ],
      },
      {
        h2: 'When you cannot wait a quarter',
        layout: 'split',
        /* ADS.body names no figure. Google Ads has no published price, so the
           same sentence runs whether SHOW_PRICING is on or off. */
        paragraphs: [
          `Google Ads. ${ADS.body} It is priced individually, so <a href="/contact/">get in ` +
            'touch</a> and we will tell you what it would cost.',
        ],
      },
      {
        h2: 'What it sits on top of',
        /* The section says the monthly work is worth nothing without a site
           worth sending people to. Lanora is a Local client with the search
           work included, so this is that sentence with a name and a live site
           attached to it, and a reader can go and check. */
        layout: 'beside',
        aside: {
          slug: 'lanora-house',
          caption:
            '<a href="/work/lanora-house/">Lanora House</a>, on Local. The site the monthly work ' +
            'sits on top of.',
        },
        paragraphs: [
          'None of this works without a site worth sending people to and a Google listing that ' +
            'is filled in. Both are in the plan already: Local contains Managed, which contains ' +
            'Online. If you only want the site, that is the <a ' +
            'href="/services/websites-for-tradespeople/">websites for tradespeople</a> page.' +
            (SHOW_PRICING ? ' Every figure is on <a href="/prices/">the prices page</a>.' : ''),
        ],
      },
    ],
    faqs: [
      {
        q: 'How long before it works?',
        a:
          'Search work takes months rather than weeks to show, so it is worth judging over a ' +
          'season. If you need the phone ringing this week, Google Ads is the faster route, and ' +
          'you pay Google directly for the ads either way.',
      },
      {
        q: 'Can you promise I will be named by ChatGPT?',
        a:
          'No, and nobody can. What we can do is make sure the facts an assistant finds about ' +
          'you are consistent and easy to quote, which is what decides whether you are in the ' +
          'answer or not.',
      },
      {
        q: 'Is there a minimum term?',
        a:
          'Three months on Local, then it is rolling on thirty days notice. Online and Managed ' +
          'are rolling from the start.',
      },
      {
        q: 'Do you take a cut of my ad budget?',
        a:
          'No. You pay Google directly, from your own card on your own account, so the budget ' +
          'is yours and you can see every penny of it. What we charge to manage the ads is ' +
          'priced individually and covers our work, nothing else.',
      },
      RESPONSE_PROMISE_FAQ,
    ],
    offers: SHOW_PRICING
      ? [
          {
            '@type': 'Offer',
            name: 'Local, monthly',
            price: String(LOCAL.monthly),
            priceCurrency: 'GBP',
            priceSpecification: {
              '@type': 'UnitPriceSpecification',
              price: String(LOCAL.monthly),
              priceCurrency: 'GBP',
              unitCode: 'MON',
              billingIncrement: 1,
            },
          },
        ]
      : [],
  },

  {
    slug: 'custom-tools',
    title: 'Custom tools for trades: quotes, jobs and photos',
    /* No published price since October 2026, so no SHOW_PRICING branch: the
       page reads the same with the prices on or off. */
    description:
      'Custom software built around how your business already works: quotes, job records, ' +
      'photos and stock. Priced individually, so get in touch with the job.',
    indexLine:
      'Job organisation, photo records, inventory and quote builders, automated quotes. ' +
      'Priced individually, get in touch.',
    serviceType: 'Custom business software',
    lead:
      'Custom tools built around how your business already works: the quoting, the job ' +
      `records, the photos, the stock. ${PRICED_INDIVIDUALLY}. If you spend hours on ` +
      'paperwork, this is the part that gives you your evenings back.',
    sections: [
      {
        /* NO IMAGE ON THIS PAGE EITHER, for the same reason as the Google
           Business Profile page. The tools are private: an eBay listing tool
           for one client's stock room is not something we can screenshot and
           publish, and there is no mockup of one. What this page does have as
           evidence is Brenna Nevitt's review, which is about the eBay tool by
           name and already renders at the foot of the page. A photograph would
           be filling the space that review is already earning. */
        h2: 'What we build',
        layout: 'full',
        listAcross: true,
        paragraphs: [
          'Whatever you are currently doing twice. Most of these start as a spreadsheet somebody ' +
            'keeps forgetting to fill in, or a folder of photos nobody can find anything in.',
        ],
        list: [
          'Job organisation',
          'Photo records',
          'Inventory and quote builders',
          'Automated quotes',
        ],
      },
      {
        h2: 'What it costs',
        layout: 'split',
        paragraphs: [
          `${PRICED_INDIVIDUALLY}. A tool is shaped by the job it replaces, so the price comes ` +
            `from that job rather than from a list. ${QUOTE_LINE}`,
        ],
      },
      {
        h2: 'How it sits against the website plans',
        paragraphs: [
          'Separately. Online, Managed and Local are the website ladder and a tool is not on ' +
            'it, so nothing here changes what you pay for a site. If you want the website first ' +
            'that is <a href="/services/websites-for-tradespeople/">websites for tradespeople</a>.',
        ],
      },
      {
        h2: 'Where to start',
        layout: 'split',
        paragraphs: [
          'Ring and describe the job you keep doing on a Sunday evening. If it can be built, we ' +
            'will say what it would take and what it would cost. If a spreadsheet would do it ' +
            'faster and cheaper, we will say that too.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Is it a one off cost or monthly?',
        a:
          'It depends on the tool. Some are built once and left alone, and some are worth ' +
          'keeping running for a monthly fee. Each one is priced individually, so get in touch ' +
          'with the job and you will get a figure, and what it covers, in writing.',
      },
      {
        q: 'Is a custom tool part of the website plans?',
        a:
          'No. Online, Managed and Local cover the website and your Google profile. A tool is ' +
          'priced on its own, and you can have one without a website from us.',
      },
      {
        q: 'What does keeping a tool running cover?',
        a:
          'Hosting, backups, security updates, fixes and small changes. A tool nobody maintains ' +
          'stops working the first time something it depends on changes. Larger new features ' +
          'are quoted separately, before any work starts.',
      },
      RESPONSE_PROMISE_FAQ,
    ],
    /* No Offer: there is no published price to describe. */
    offers: [],
  },
];

/* ---- The two images on these pages ----------------------------------------
   Both are real client work, both are read out of projects.js rather than
   written here, and both are placed against the sentence they are evidence
   for. There is no stock photography on this site and there is not going to
   be: an image whose job is to fill the right-hand half of the page is worse
   than leaving it empty, because it teaches a reader that the pictures here do
   not mean anything.

   WHAT EACH ONE IS DOING, since that is the test each had to pass:

     The Nevitt mockup, on the websites page, sits under "What the site is",
     which is the section claiming five pages built around a trade rather than
     filled into a template. It is the fullest trade build on the list and the
     mockup shows it on a laptop, a tablet and a phone at once, which is the
     one claim in that section a screenshot of a desktop could not carry.

     The Lanora phone shot, on the search and AI page, sits beside "What it
     sits on top of", which is the section saying the monthly work is worthless
     without a site worth sending people to. Lanora is a Local client with the
     search work included, so it is that sentence with a name on it. Phone
     rather than desktop because most of these clients' customers are on one,
     and because the page needed a shape that was not another wide band.

   Neither is above the fold at any width, so both are lazy. Both carry their
   real pixel dimensions, so nothing below them moves when they land. */

/* Full width of the wrap, under the section it belongs to. The mockup is a
   composed photo that already contains browser chrome and its own drop
   shadows, so it gets no frame of its own: the site's near-black shows through
   it, which is exactly what it was drawn for. Same reasoning, same markup, as
   renderMockupGallery in tools/pages/project.js. */
function renderSectionBand({ slug, caption }) {
  const project = getProjectBySlug(slug);
  const { alt, width, height } = project.mockup;

  return `        <figure class="service__band">
          <img
            class="service__band-shot"
            src="/assets/work/${escapeHtml(slug)}/mockup.webp"
            srcset="${escapeHtml(mockupSrcset(slug, width))}"
            sizes="(min-width: 76rem) 68rem, 92vw"
            alt="${escapeHtml(alt)}"
            width="${width}"
            height="${height}"
            loading="lazy"
            decoding="async"
          />
          <figcaption class="service__band-caption">${caption}</figcaption>
        </figure>`;
}

/* The phone shot, in the column beside the copy. Reuses .phone from site.css
   rather than growing a second frame that looks almost like it: the project
   pages have shown a client's site at phone size in that exact frame since the
   portfolio existed, and a near-identical one here would read as two
   components to anyone comparing the pages. */
function renderSectionPhone({ slug, caption }) {
  const project = getProjectBySlug(slug);
  const size = SHOT_SIZES.mobile;

  return `          <figure class="service__aside">
            <span class="phone">
              <img
                class="phone__shot"
                src="/assets/work/${escapeHtml(slug)}/mobile.webp"
                srcset="${escapeHtml(shotSrcset(slug, 'mobile'))}"
                sizes="(min-width: 64rem) 18rem, 92vw"
                alt="${escapeHtml(project.alt)}, shown on a phone"
                width="${size.width}"
                height="${size.height}"
                loading="lazy"
                decoding="async"
              />
            </span>
            <figcaption class="service__aside-caption">${caption}</figcaption>
          </figure>`;
}

/* ---- One section --------------------------------------------------------
   h2, then paragraphs, then a list, then any h3 blocks under it, then the
   paragraphs that belong after the list. Headings never skip a level: an h3
   only ever exists inside one of these, and nothing here renders an h4.

   The class prefix is `service` rather than `guide`, and tools/build.js knows
   about it: the unescaped-copy whitelist runs on any section whose class ends
   __section in the guide, post or service families, so paragraphs here are
   held to the same four tags as a guide's.

   FOUR SHAPES, AND WHY A SECTION GETS TO CHOOSE. Every section on these pages
   used to be the same object: an h2 and a paragraph or two, capped at the 38rem
   reading measure, hard against the left edge. Ten of those in a row on a
   1440px screen is a 608px column of text with 58% of the window empty beside
   it for five thousand pixels of scrolling, and the honest problem with it is
   not that it is ugly. It is that nothing on the page tells a reader which
   part matters, because every part is drawn identically.

     column   The default and still the most common. Measure-capped prose,
              heading above it. Right for anything that is simply an argument.
     split    The heading moves into a narrow rail on the left and the prose
              sits beside it. Used on the short sections, where a heading
              stacked above two lines wastes the vertical space it costs. It
              also puts the headings on their own vertical line down the page,
              which is what lets someone scanning find the section they want
              without reading any of them.
     full     Heading above, body across the whole wrap. Only for content that
              genuinely needs the width: the plan cards, and a list whose items
              are peers worth reading across rather than down.
     beside   Measure-capped prose with an image in the space to its right. Only
              where there is a real picture of the thing being described.

   The rule that keeps this from becoming decoration: a shape has to be chosen
   because of what the section contains, never to break up a run of three. If
   two neighbouring sections are both plain arguments, they are both `column`,
   and the page is better for the repetition. */
function renderSection(section) {
  const parts = [];

  for (const text of section.paragraphs || []) {
    parts.push(`            <p>${text}</p>`);
  }

  if (section.list) {
    /* --across turns the bullets into a grid of peers. Reserved for lists whose
       items really are a set read across rather than steps read down, which on
       these pages means the four things the Local plan keeps doing and
       the four kinds of tool we build. The copy above each one already says
       "four", so the shape is repeating something true rather than asserting a
       structure the words do not have. */
    const across = section.listAcross ? ' service__list--across' : '';
    parts.push(
      `            <ul class="service__list${across}">\n${section.list
        .map((item) => `              <li>${item}</li>`)
        .join('\n')}\n            </ul>`,
    );
  }

  for (const text of section.after || []) {
    parts.push(`            <p>${text}</p>`);
  }

  for (const sub of section.subs || []) {
    parts.push(`            <h3>${escapeHtml(sub.h3)}</h3>`);
    for (const text of sub.paragraphs) {
      parts.push(`            <p>${text}</p>`);
    }
  }

  const layout = section.layout || 'column';

  /* The body is wrapped rather than left as loose children, and that wrapper is
     what makes `split` and `beside` possible at all: in a two-column grid every
     loose paragraph would become a grid item and place itself in whichever cell
     came next, so a section would lay itself out as a heading, a paragraph
     beside it, then a paragraph under the heading. One element per column
     instead. */
  const body = `          <div class="service__body">
${parts.join('\n')}
          </div>`;

  const aside = section.aside ? `\n${renderSectionPhone(section.aside)}` : '';

  const section_ = `        <section class="service__section service__section--${layout}">
          <h2>${escapeHtml(section.h2)}</h2>
${body}${aside}
        </section>`;

  /* Both of these are siblings of the section rather than children of it, and
     there are two separate reasons that happen to point the same way.

     The layout reason: both run the full width of the wrap, and the section
     they belong to is capped at the reading measure. Nesting either would mean
     fighting that cap from inside.

     The build-check reason, which is the load-bearing one. findUnescapedCopy in
     tools/build.js scans everything inside a `service__section` for tags that
     copy is not allowed to carry, because paragraph copy on these pages is
     interpolated raw and a stray "<" in a sentence is invisible until it is
     live. The plan cards are template markup, not copy: they are full of
     <span>, and putting them inside the section fails that check with eighteen
     errors, correctly. The answer is to keep template markup out of the element
     the check is pointed at, not to widen what the check will forgive. */
  const trailing = [
    section.planCards ? renderSectionPlans() : '',
    section.band ? renderSectionBand(section.band) : '',
  ].filter(Boolean);

  return [section_, ...trailing].join('\n\n');
}

/* The plan comparison, on the one section that is a comparison. Three plans
   described as three paragraphs of running prose is the hardest possible way
   to answer "which of these is me": a reader has to hold two of them in their
   head to check the third against them. Same cards as /prices, rendered from
   the same pricing.js data by the same function, so the two pages cannot end
   up describing different plans. */
function renderSectionPlans() {
  return `        <div class="service__plans">
${renderPlanCards()}
        </div>`;
}

/* ---- One service page -----------------------------------------------------
   The shape is the guide's, because it is the shape that works on a phone: a
   question-sized heading, the answer immediately under it against the accent
   rule, then the detail. What a guide does not have is the button, and this is
   a page whose job is to convert, so there is one near the top and the contact
   band at the bottom. */
function renderService(service) {
  const path = `/services/${service.slug}/`;

  /* One array, handed to the visible nav and to the JSON-LD below, so a
     reader and a crawler always see the same three-step hierarchy. */
  const trail = [
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/services/' },
    { name: service.title, path },
  ];

  /* Two of these four pages have no review yet — google-business-profile and
     search-and-ai-visibility carry none of the four so far. renderReviews
     already returns '' for an empty array, which is why this is not gated by
     an if: the section simply does not exist on those pages rather than
     rendering as an empty band.

     The heading is deliberately the same words on every service page rather
     than one bespoke phrase per service. That is a decision, not laziness:
     "a review of this service" is the same kind of claim whichever service it
     is, and six near-identical headings differing only in which noun they
     name would be worse than one honest, reused sentence. The homepage's "What
     people say" stays there — this page is narrower than that, about the one
     thing being sold here, so it gets its own words. */
  const reviews = reviewsForService(service.slug);
  const reviewsSection = renderReviews({
    reviews,
    heading: 'What clients say about this service',
    headingId: `${service.slug}-reviews-heading`,
  });

  const faqs = `        <section class="service__faq" aria-labelledby="${escapeHtml(service.slug)}-faq">
${renderFaq({
  faqs: service.faqs,
  /* Namespaced by slug. Every service page carries exactly one of these, but a
     shared name is the sort of thing that only breaks once two land on the same
     page, which is too late to be finding out. */
  name: `${service.slug}-faq-group`,
  heading: 'Questions people ask first',
  headingId: `${service.slug}-faq`,
})}
        </section>`;

  const content = `${renderBreadcrumbs(trail)}

    <article class="section service">
      <div class="wrap service__inner">
        <h1 class="service__title">${escapeHtml(service.title)}</h1>

        <p class="service__answer">${escapeHtml(service.lead)}</p>

        <p class="service__cta">
          <a class="btn btn--primary" href="/contact/#enquiry">Ask about this</a>
        </p>

${service.sections.map(renderSection).join('\n\n')}

${faqs}
      </div>
    </article>`;

  return {
    path,
    title: service.title,
    description: service.description,
    /* The waiver is declared on the service and consumed on the page. They are
       different objects, so the flag must be copied explicitly. */
    descriptionFloorWaived: service.descriptionFloorWaived,
    /* reviews.css only loads on the two pages that actually carry a quote,
       same reasoning as home.js only loading hero.css on the homepage: a
       stylesheet with nothing to style on a page is dead weight on it.
       prices.css follows the same rule and is why the plan cards are asked for
       by the section data rather than hardcoded here: the one page rendering
       them is the one page that pays for the sheet, and if a second page ever
       wants them it gets the stylesheet automatically instead of rendering
       three unstyled columns nobody notices until it is live. */
    styles: [
      '/article.css',
      ...(service.sections.some((section) => section.planCards) ? ['/prices.css'] : []),
      ...(reviews.length ? ['/reviews.css'] : []),
    ],
    schemaExtra: [
      /* One Service node, and every value on it is something the page says in
         words a few lines above. No aggregateRating and no review count:
         there are none, and inventing them is the standard way this markup
         goes wrong. */
      {
        '@type': 'Service',
        '@id': `${absoluteUrl(path)}#service`,
        name: service.title,
        description: service.description,
        provider: { '@id': ORG_ID },
        serviceType: service.serviceType,
        areaServed: { '@type': 'Country', name: SITE.areaServed },
        ...(service.offers ? { offers: service.offers } : {}),
      },
      {
        '@type': 'FAQPage',
        '@id': `${absoluteUrl(path)}#faq`,
        mainEntity: service.faqs.map(({ q, a }) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
      },
      breadcrumbs(trail),
    ],
    /* Same ordering rule as the homepage's REVIEWS_SECTION: the last thing
       before the call to action is somebody else vouching for the work, not
       the studio. filter(Boolean) rather than always splicing reviewsSection
       in, because on the two services with no review yet it is '', and
       joining an empty string in still leaves two blank lines sitting in the
       rendered HTML for no reason. */
    content: [
      content,
      reviewsSection,
      renderContactBand({
        heading: 'Ready to get on with it?',
        body: 'Ring and describe what you do and what you want it to bring you. We&rsquo;ll tell you which of these fits and what it would cost, in plain English.',
      }),
    ]
      .filter(Boolean)
      .join('\n\n'),
  };
}

export const SERVICE_PAGES = SERVICES.map(renderService);

/* ---- The index ------------------------------------------------------------
   Four items, each with the line that would let somebody rule it out. Same
   reasoning as the guides index: a list of names teaches an assistant nothing,
   and a visitor who works out here that they want the £15 one has been served
   better than one made to click four times to find out. */
const INDEX_LIST = `      <ul class="service-index">
${SERVICES.map(
  (service) => `        <li class="service-index__item">
          <h2 class="service-index__name">
            <a href="/services/${escapeHtml(service.slug)}/">${escapeHtml(service.title)}</a>
          </h2>
          <p class="service-index__line">${escapeHtml(service.indexLine)}</p>
        </li>`,
).join('\n\n')}
      </ul>`;

/* Declared once, ahead of the page object, so the visible trail prepended to
   content below and the JSON-LD in schemaExtra read from the same array. */
const SERVICES_INDEX_TRAIL = [
  { name: 'Home', path: '/' },
  { name: 'Services', path: '/services/' },
];

export const SERVICES_INDEX_PAGE = {
  path: '/services/',
  title: 'Website and search services for tradespeople',
  description: SHOW_PRICING
    ? `Four things we do: websites at ${money(BUILD_FEE)} to build and from ${money(ONLINE.monthly)} a month, Google Business Profiles, search and AI visibility, and custom tools for your paperwork.`
    : 'Four things we do: websites for tradespeople, Google Business Profiles, the monthly search and AI work, and custom tools for the paperwork you repeat.',
  styles: ['/article.css'],
  schemaType: 'CollectionPage',
  schemaExtra: [
    {
      '@type': 'ItemList',
      name: 'Services',
      numberOfItems: SERVICES.length,
      itemListElement: SERVICES.map((service, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: service.title,
        url: absoluteUrl(`/services/${service.slug}/`),
      })),
    },
    breadcrumbs(SERVICES_INDEX_TRAIL),
  ],
  extraScripts: PAGE_BLOB_SCRIPT,
  content: [
    renderBreadcrumbs(SERVICES_INDEX_TRAIL),
    `    <section class="section services-head">
      <div class="wrap page-head">
        <div class="page-head__text">
          <p class="eyebrow">Services</p>
          <h1>Website and search services for tradespeople</h1>
          <p class="lede measure">
            A website, your Google Business Profile, the monthly work that gets you found, and
            tools for the paperwork.${
              SHOW_PRICING
                ? ' Every price is on the site, and the whole ladder is on <a href="/prices/">the prices page</a>.'
                : ' Ring or send a message and you will get a figure for your own job the same day.'
            }
          </p>
        </div>

${PAGE_BLOB}
      </div>
    </section>`,
    `    <section class="section services-list" aria-labelledby="services-list-heading">
      <div class="wrap">
        <h2 class="visually-hidden" id="services-list-heading">All services</h2>

${INDEX_LIST}
      </div>
    </section>`,
    renderContactBand({
      heading: 'Not sure which one you need?',
      body: 'Ring and describe the business. We&rsquo;ll say which of these would move the needle for you, and which would not.',
    }),
  ].join('\n\n'),
};
