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
   pricing.js; the exclusivity promise and the guarantee come from
   site.config.js and pricing.js in their own words, because both are terms
   rather than descriptions. If a claim is not in one of those files, it is not
   on these pages.

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

import { SITE, absoluteUrl } from '../../site.config.js';
import { PLANS, EXTRAS, GUARANTEE, money } from '../../pricing.js';
import { escapeHtml } from '../templates/page.js';
import { breadcrumbs, ORG_ID } from '../templates/schema.js';
import { renderContactBand } from '../partials/contact-band.js';
import { renderBreadcrumbs } from '../partials/breadcrumbs.js';
import { PAGE_BLOB, PAGE_BLOB_SCRIPT } from '../partials/page-blob.js';

const [ONLINE, MANAGED, GROWTH] = PLANS;

/* Found by name rather than by index. EXTRAS is a list somebody will reorder
   one day, and a page that quotes EXTRAS[0] would silently start describing
   Google Ads as a profile rescue. */
const RESCUE = EXTRAS.find((extra) => extra.name === 'Google Profile Rescue');
const ADS = EXTRAS.find((extra) => extra.name === 'Google Ads');
const TOOLS = EXTRAS.find((extra) => extra.name === 'Custom tools');

/* Every service page carries this as its last FAQ, word for word. It lives
   here once so the four pages cannot drift into four different phrasings of
   the same promise, and so the promise itself only ever needs editing in
   site.config.js. */
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
     faqs       Real questions, each answered only from what this repo can
                support. These become the FAQPage node as well as the visible
                section.
     offers     Schema offers. Only where there is a real published price. */
const SERVICES = [
  {
    slug: 'websites-for-tradespeople',
    title: 'Websites for tradespeople, live within a week',
    description:
      `A five page website built around your trade, live within a week. From ${money(ONLINE.build)} to build and ${money(ONLINE.monthly)} a month, with hosting and your Google Business Profile included.`,
    indexLine:
      `Five pages written around your trade, live within a week. From ${money(ONLINE.build)} to build and ${money(ONLINE.monthly)} a month.`,
    serviceType: 'Website design and build',
    lead:
      `Websites for tradespeople, five pages, live within a week. Online is ${money(ONLINE.build)} ` +
      `to build and ${money(ONLINE.monthly)} a month, and that covers hosting, security and SSL, ` +
      'and your Google Business Profile set up properly at launch.',
    sections: [
      {
        h2: 'What the site is',
        paragraphs: [
          'Five pages, written around your trade rather than filled into a template. Every plan ' +
            'starts with the same build, so the only thing the price changes is how much of the ' +
            'ongoing work we do afterwards.',
        ],
        list: ONLINE.includes,
        after: [
          'If you want to check that list against what a trades site actually needs, <a ' +
            'href="/guides/what-a-trades-website-needs/">what a tradesperson\'s website needs</a> ' +
            'is the same argument written for someone who has not decided who to buy from yet.',
        ],
      },
      {
        h2: 'The three plans',
        paragraphs: [
          'Online is the site. Managed is the site with someone looking after it. Growth is the ' +
            'site, looked after, with monthly work behind it to get you found. Each one contains ' +
            'the one before it, so nothing is lost by starting at the bottom.',
        ],
        subs: [
          {
            h3: `Online, ${money(ONLINE.monthly)} a month`,
            paragraphs: [
              `${escapeHtml(ONLINE.summary)} ${money(ONLINE.build)} to build. Best for: ` +
                escapeHtml(ONLINE.bestFor.charAt(0).toLowerCase() + ONLINE.bestFor.slice(1)),
            ],
          },
          {
            h3: `Managed, ${money(MANAGED.monthly)} a month`,
            paragraphs: [
              'Everything in Online, plus we make your changes for you up to 30 minutes a month, ' +
                'keep your Google profile active with a monthly post and fresh photos, and send ' +
                `a simple monthly report of your calls and enquiries. ${money(MANAGED.build)} to build.`,
            ],
          },
          {
            h3: `Growth, ${money(GROWTH.monthly)} a month`,
            paragraphs: [
              'Everything in Managed, plus the monthly work that puts you in front of people ' +
                'searching right now: new content targeting the towns and services you want, ' +
                'review generation, consistent directory listings, and the technical and AI ' +
                `search work. ${money(GROWTH.build)} to build, and it is the only plan carrying ` +
                'the lead guarantee. What that work is week to week is set out on <a ' +
                'href="/services/search-and-ai-visibility/">search and AI visibility</a>.',
            ],
          },
        ],
      },
      {
        h2: 'How long it takes',
        paragraphs: [
          'About a week, once we have your logo, your photos and the list of jobs you want on ' +
            'the site. Managed and Growth take the same time to build, because the build itself ' +
            'does not change between plans.',
        ],
      },
      {
        h2: 'What Online does not cover',
        paragraphs: [
          escapeHtml(ONLINE.excludes[0]) +
            ' That is the honest limit of a plan costing less than most hosting bills. If you ' +
            'would rather never touch it, Managed covers the changes and the Google profile ' +
            `upkeep for ${money(MANAGED.monthly)} a month.`,
          'Every figure here, including what each plan leaves out, is on <a ' +
            'href="/prices/">the prices page</a>. If you have been quoted several thousand ' +
            'pounds elsewhere, <a href="/guides/how-much-a-trades-website-costs/">how much a ' +
            'tradesman\'s website should cost</a> explains what that money usually buys.',
        ],
      },
      {
        h2: 'The Google side comes with it',
        paragraphs: [
          'Your Google Business Profile is set up at launch on every plan, because for most ' +
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
          'listed. Managed and Growth take the same time, since the build does not change.',
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
          'means losing what the higher plan covered, so dropping from Growth loses the monthly ' +
          'content, the review generation and the AI search work.',
      },
      RESPONSE_PROMISE_FAQ,
    ],
    offers: PLANS.flatMap((plan) => [
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
    ]),
  },

  {
    slug: 'google-business-profile',
    title: 'Google Business Profile setup and management',
    description:
      `We claim, verify and fill in your Google Business Profile: categories, services, photos and reviews. ${money(89)} one off, or set up at launch with any website.`,
    indexLine:
      `Claimed, verified and filled in properly, with a plan for reviews. ${money(89)} as a one off, or set up at launch with any website.`,
    serviceType: 'Google Business Profile management',
    lead:
      'Your Google Business Profile claimed, verified and filled in properly: categories, ' +
      'services, photos, questions and answers, and a plan to get you more reviews. ' +
      `${money(89)} as a one off. If you take a website later, the ${money(89)} comes off it.`,
    sections: [
      {
        h2: `What the ${money(89)} covers`,
        paragraphs: [RESCUE.body],
        after: [
          'It is the listing that decides whether you appear when somebody searches your trade ' +
            'and a town, or opens Maps and looks at what is near them. For most trades it rings ' +
            'the phone more often than the website does.',
        ],
      },
      {
        h2: 'What comes with a website instead',
        paragraphs: [
          `On Online, ${money(ONLINE.build)} to build and ${money(ONLINE.monthly)} a month, the ` +
            'profile is set up properly at launch as part of the job. On Managed, ' +
            `${money(MANAGED.monthly)} a month, we then keep it active with a monthly post and ` +
            'fresh photos, which is the difference between a listing that exists and one that ' +
            'is working. Both are on the <a href="/services/websites-for-tradespeople/">websites ' +
            'for tradespeople</a> page.',
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
        paragraphs: [
          'Ask every customer in person on the day the job finishes, and hand them a short link ' +
            'straight to your review page. That is the whole method, and <a ' +
            'href="/guides/how-to-get-more-google-reviews/">how to get more Google reviews</a> ' +
            'covers what stops it working. If you would rather it was somebody else\'s job, ' +
            `review generation runs monthly on the Growth plan at ${money(GROWTH.monthly)} a month.`,
        ],
      },
    ],
    faqs: [
      {
        q: 'Does a Google Business Profile cost anything?',
        a:
          `No. The listing is free and always has been. The ${money(89)} pays for the work of ` +
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
        q: `Does the ${money(89)} come off a website?`,
        a:
          'Yes. If you take a website from us afterwards, the ' +
          `${money(89)} comes off it.`,
      },
      {
        q: 'Can you keep the profile updated every month?',
        a:
          `That is Managed, at ${money(MANAGED.build)} to build and ${money(MANAGED.monthly)} a ` +
          'month, which keeps the profile active with a monthly post and fresh photos alongside ' +
          'looking after the website.',
      },
      RESPONSE_PROMISE_FAQ,
    ],
    offers: [
      {
        '@type': 'Offer',
        name: 'Google Profile Rescue',
        price: '89',
        priceCurrency: 'GBP',
      },
    ],
  },

  {
    slug: 'search-and-ai-visibility',
    title: 'Search and AI visibility for tradespeople',
    description:
      `Monthly work to get you found on Google and named by AI assistants. The Growth plan, ${money(GROWTH.monthly)} a month, and your build fee back if it misses five enquiries.`,
    indexLine:
      `Monthly content, reviews, listings and the technical work behind being named in an AI answer. The Growth plan, ${money(GROWTH.monthly)} a month.`,
    serviceType: 'Search engine optimisation and AI search visibility',
    lead:
      'Monthly work to get you found on Google and named when somebody asks an assistant for a ' +
      `tradesperson. It is the Growth plan, ${money(GROWTH.build)} to build and ` +
      `${money(GROWTH.monthly)} a month. It is also the only plan that carries the lead ` +
      'guarantee, which is set out in full below.',
    sections: [
      {
        h2: 'What happens every month',
        paragraphs: [
          'Four things, and they run every month rather than once at launch. Search work stopped ' +
            'being a job you finish some years ago.',
        ],
        list: GROWTH.includes,
      },
      {
        h2: 'The lead guarantee',
        paragraphs: [GUARANTEE.promise, ...GUARANTEE.terms],
      },
      {
        h2: 'One trade per patch',
        paragraphs: [SITE.exclusivity.full],
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
        paragraphs: [
          `Google Ads, ${ADS.price.toLowerCase()}. ` + ADS.body,
        ],
      },
      {
        h2: 'What it sits on top of',
        paragraphs: [
          'None of this works without a site worth sending people to and a Google listing that ' +
            'is filled in. Both are in the plan already: Growth contains Managed, which contains ' +
            'Online. If you only want the site, that is the <a ' +
            'href="/services/websites-for-tradespeople/">websites for tradespeople</a> page, and ' +
            'every figure is on <a href="/prices/">the prices page</a>.',
        ],
      },
    ],
    faqs: [
      {
        q: 'How long before it works?',
        a:
          'The guarantee is measured over four months, which is a fair account of how long this ' +
          'work takes to show. If you need the phone ringing this week, Google Ads is the faster ' +
          `route at ${money(129)} a month plus your ad spend.`,
      },
      {
        q: 'Can you guarantee I will be named by ChatGPT?',
        a:
          'No, and nobody can. What we can do is make sure the facts an assistant finds about ' +
          'you are consistent and easy to quote, which is what decides whether you are in the ' +
          'answer or not.',
      },
      {
        q: 'What if it does not bring me any work?',
        a:
          'On Growth, if the site and your Google Business Profile do not bring you five genuine ' +
          'customer enquiries in four months, the build fee comes back in full. The monthly fee ' +
          'does not, since it pays for work already done, and you keep the site, the domain and ' +
          'the profile.',
      },
      {
        q: 'Will you work for a competitor of mine?',
        a:
          'Not on Growth. If we are already working for a plumber in your town and roughly eight ' +
          'miles around it, we will not take on another plumber there while you are a client. A ' +
          'different trade in the same patch is fine.',
      },
      {
        q: 'Do you take a cut of my ad budget?',
        a:
          'No. Your ad spend goes straight to Google. The Google Ads fee starts at ' +
          `${money(129)} a month and covers the work, nothing else.`,
      },
      RESPONSE_PROMISE_FAQ,
    ],
    offers: [
      {
        '@type': 'Offer',
        name: 'Growth, monthly',
        price: String(GROWTH.monthly),
        priceCurrency: 'GBP',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: String(GROWTH.monthly),
          priceCurrency: 'GBP',
          unitCode: 'MON',
          billingIncrement: 1,
        },
      },
      {
        '@type': 'Offer',
        name: 'Growth, build fee',
        price: String(GROWTH.build),
        priceCurrency: 'GBP',
      },
    ],
  },

  {
    slug: 'custom-tools',
    title: 'Custom tools for trades: quotes, jobs and photos',
    description:
      `Custom software built around how your business already works: quotes, job records, photos and stock. From ${money(1200)} as a one off, or from ${money(89)} a month to run.`,
    indexLine:
      `Job organisation, photo records, inventory and quote builders, automated quotes. From ${money(1200)}, or from ${money(89)} a month.`,
    serviceType: 'Custom business software',
    lead:
      'Custom tools built around how your business already works: the quoting, the job ' +
      `records, the photos, the stock. From ${money(1200)} as a one off, or from ${money(89)} a ` +
      'month. If you spend hours on paperwork, this is the part that gives you your evenings ' +
      'back.',
    sections: [
      {
        h2: 'What we build',
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
        paragraphs: [
          `${TOOLS.price}. The range is wide ` +
            'because a quote builder for one trade and a photo record for a team of six are not ' +
            'the same job, and quoting a single figure for both would mean one of them is wrong.',
        ],
      },
      {
        h2: 'How it sits against the website plans',
        paragraphs: [
          'Separately. Online, Managed and Growth are the website ladder and a tool is not on ' +
            'it, so nothing here changes what you pay for a site. Both prices are on <a ' +
            'href="/prices/#extras">the prices page</a>, and if you want the website first that ' +
            'is <a href="/services/websites-for-tradespeople/">websites for tradespeople</a>.',
        ],
      },
      {
        h2: 'Where to start',
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
          `Either. From ${money(1200)} to build it outright, or from ${money(89)} a month. ` +
          'Which one suits depends on the tool and how much of it we keep running for you.',
      },
      {
        q: 'Is a custom tool part of the website plans?',
        a:
          'No. Online, Managed and Growth cover the website and the search work. A tool is ' +
          'priced on its own, and you can have one without a website from us.',
      },
      {
        q: 'Does the lead guarantee cover a custom tool?',
        a:
          'No. The refund guarantee is a Growth term, and it covers the website and Google ' +
          'Business Profile, not a tool bought on its own. A custom tool is priced and ' +
          `delivered separately, from ${money(1200)}, or from ${money(89)} a month.`,
      },
      {
        q: 'Would you build the same tool for a competitor of mine?',
        a:
          'Only if you are not already a Growth client. While you are on Growth, the one trade ' +
          'per patch promise means we will not take on another business in your trade in your ' +
          'patch at all, whatever they buy from us, a tool included. Bought on its own without ' +
          'Growth, a tool does not carry that protection.',
      },
      {
        q: 'Why is the price a range rather than one figure?',
        a:
          'Because the jobs are not the same size. A quote builder for one trade and a photo ' +
          'record for a team of six take different amounts of work, and quoting one figure for ' +
          'both would mean one of them is wrong.',
      },
      RESPONSE_PROMISE_FAQ,
    ],
    offers: [
      {
        '@type': 'Offer',
        name: 'Custom tool, built outright',
        priceSpecification: {
          '@type': 'PriceSpecification',
          minPrice: '1200',
          priceCurrency: 'GBP',
        },
      },
      {
        '@type': 'Offer',
        name: 'Custom tool, monthly',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          minPrice: '89',
          priceCurrency: 'GBP',
          unitCode: 'MON',
          billingIncrement: 1,
        },
      },
    ],
  },
];

/* ---- One section --------------------------------------------------------
   h2, then paragraphs, then a list, then any h3 blocks under it, then the
   paragraphs that belong after the list. Headings never skip a level: an h3
   only ever exists inside one of these, and nothing here renders an h4.

   The class prefix is `service` rather than `guide`, and tools/build.js knows
   about it: the unescaped-copy whitelist runs on any section whose class ends
   __section in the guide, post or service families, so paragraphs here are
   held to the same four tags as a guide's. */
function renderSection(section) {
  const parts = [];

  for (const text of section.paragraphs || []) {
    parts.push(`          <p>${text}</p>`);
  }

  if (section.list) {
    parts.push(
      `          <ul class="service__list">\n${section.list
        .map((item) => `            <li>${item}</li>`)
        .join('\n')}\n          </ul>`,
    );
  }

  for (const text of section.after || []) {
    parts.push(`          <p>${text}</p>`);
  }

  for (const sub of section.subs || []) {
    parts.push(`          <h3>${escapeHtml(sub.h3)}</h3>`);
    for (const text of sub.paragraphs) {
      parts.push(`          <p>${text}</p>`);
    }
  }

  return `        <section class="service__section">
          <h2>${escapeHtml(section.h2)}</h2>
${parts.join('\n')}
        </section>`;
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

  const faqs = `        <section class="service__faq" aria-labelledby="${escapeHtml(service.slug)}-faq">
          <h2 id="${escapeHtml(service.slug)}-faq">Questions people ask first</h2>

          <div class="faq__grid">
${service.faqs
  .map(
    ({ q, a }) => `            <div class="faq__item">
              <h3 class="faq__q">${escapeHtml(q)}</h3>
              <p class="faq__a">${escapeHtml(a)}</p>
            </div>`,
  )
  .join('\n\n')}
          </div>
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
    styles: ['/article.css'],
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
    content: [
      content,
      renderContactBand({
        heading: 'Ready to get on with it?',
        body: 'Ring and describe what you do and what you want it to bring you. We&rsquo;ll tell you which of these fits and what it would cost, in plain English.',
      }),
    ].join('\n\n'),
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
  description:
    `Four things we do and what each costs: websites from ${money(ONLINE.monthly)} a month, Google Business Profiles, the monthly search and AI work, and custom tools for paperwork.`,
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
            tools for the paperwork. Every price is on the site, and the whole ladder is on
            <a href="/prices/">the prices page</a>.
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
