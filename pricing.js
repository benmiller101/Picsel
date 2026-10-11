/* ---- pricing.js — the single source of truth for what Picsel charges ------
   SOURCE: the October 2026 price card. Every figure below is from it.

   Same job as projects.js, for money instead of work. The prices page, the
   plan schema, the service pages and the homepage all read this file, so a
   price exists in exactly one place.

   That matters more here than anywhere else on the site. A price written into
   a page, a proposal and a social bio separately is three numbers that agree
   until the day one of them is edited, and the one nobody updates is the one a
   customer quotes back at you.

   ONE BUILD FEE FOR EVERY PLAN, a decision carried over from the August card.
   Three build fees invite a reader to compare them, and the moment they do,
   the cheap plan reads as the cheap build. One number, stated before the plans
   are named, takes that decision off the table. BUILD_FEE is therefore a
   top-level export and not a field on a plan, so no page can accidentally
   imply otherwise.

   THE ORDER IS A LADDER, NOT A MENU. Each plan contains the one before it
   whole. `inherits` says so in the data rather than leaving it to the copy,
   because "everything in Online, plus" is a promise that has to survive
   somebody editing the Online list.

   WHAT THE OCTOBER CARD TOOK OUT, so nobody adds it back from an old page:
   the Growth plan and its twelve month term, the lead guarantee, the one trade
   per patch promise, and published prices for Google Ads and custom tools.
   Local replaced Growth. tools/build.js fails the build if a rendered page
   names any of them again.

   TWO THINGS IN HERE THAT ARE EASY TO DROP AND MUST NOT BE
     Managed's 30 minutes is use it or lose it. It does not roll over, and a
       client who believes they are banking six hours a year has been misled by
       an omission rather than by a sentence.
     Local's five places and three month minimum are printed on the card, next
       to the price. A minimum term found in the small print reads as a trap. */

/* Formatted here rather than in the templates, so £15 is written the same way
   on every surface that shows it. Whole pounds throughout: nothing on this
   list has pence, and "£15.00" reads like a utility bill. Thousands get their
   comma from toLocaleString, which is what turns 1500 into £1,500. */
export function money(pounds) {
  return `£${pounds.toLocaleString('en-GB')}`;
}

/* ---- The build fee --------------------------------------------------------
   One number, every plan. Read the note at the top of this file before moving
   it onto a plan: it is deliberately not a per-plan field. */
export const BUILD_FEE = 499;

/* What the prices page opens on, before a single plan is named. Split in two
   because the page sets the figure at display size and the words beside it,
   while llms.txt and the JSON-LD want one sentence. Composing the sentence
   from the parts is what stops the two drifting. */
export const BUILD_WHAT = 'to build your website, whichever plan you pick';

export const BUILD_LINE = `${money(BUILD_FEE)} ${BUILD_WHAT}. Then choose how much we do afterwards.`;

/* What the build fee buys. Before October these lived on the Online card,
   which made the cheapest plan look like the one that came with a website.
   They belong to the build, which every plan starts from. */
export const BUILD_INCLUDES = [
  'A homepage plus up to five pages',
  'Your Google Business Profile set up and pointed at the site',
  'Search and AI search setup',
  'A contact form',
  'A pack of review cards',
];

export const PLANS = [
  {
    id: 'online',
    name: 'Online',
    /* The one-line answer to "what is this one for", in the words the customer
       would use rather than the words a plan comparison table would. */
    summary: 'Your website kept online, secure and working. Set and forget.',
    monthly: 15,
    term: 'Rolling, thirty days notice',
    inherits: null,
    includes: [
      'Hosting, SSL and security updates',
      'Uptime monitoring, so we know if the site goes down before you do',
      'Your contact form kept working',
      'Your domain kept pointing at the site',
    ],
    /* The line that does the most work on a card. The others describe the
       plan; this one describes the customer, which is what somebody comparing
       three boxes is actually trying to match themselves against. */
    bestFor:
      'You want a proper website for less than most hosting bills, and you are happy to leave it be.',
    /* Stated as plainly as the includes. A plan whose limits are in the small
       print is how someone ends up feeling sold to three months later. */
    excludes: ['No changes included. Changes are charged by the hour when you want them.'],
  },
  {
    id: 'managed',
    name: 'Managed',
    summary: 'Everything in Online, looked after, so you never have to touch it.',
    monthly: 39,
    term: 'Rolling, thirty days notice',
    inherits: 'Online',
    includes: [
      /* The non-rollover is inside the same sentence as the allowance, not a
         footnote under it. A reader who takes only the first half of this line
         has still been told the truth. */
      'Thirty minutes of changes a month, made for you. Use it or lose it, it does not roll over',
      'One Google profile post a month, with fresh photos',
      'A one page report every month: enquiries, phone taps, profile views and reviews',
    ],
    bestFor: 'You want your website looked after so you never have to think about it.',
    excludes: [],
  },
  {
    id: 'local',
    name: 'Local',
    summary: 'Everything in Managed, plus weekly work on your Google profile and your reviews.',
    monthly: 89,
    /* Both of these print on the card beside the price. See the note at the
       top of the file. */
    term: 'Three month minimum, then rolling on thirty days notice',
    places: 5,
    inherits: 'Managed',
    includes: [
      'A Google profile post every week',
      'Every Google review replied to within a week',
      'Review cards topped up when you run low',
      'An AI visibility check every quarter, with one page properly refreshed',
    ],
    bestFor: 'You want your Google profile and your reviews worked on every week, not just kept tidy.',
    excludes: [],
  },
];

/* ---- Paying for the year up front -----------------------------------------
   Twelve months for the price of ten, on any plan. Written out rather than
   derived, so the figures on the page are the figures on the card even if
   somebody one day rounds one of them. */
export const ANNUAL = {
  headline: 'Twelve months for the price of ten, on any plan.',
  prices: [
    { plan: 'Online', price: 150 },
    { plan: 'Managed', price: 390 },
    { plan: 'Local', price: 890 },
  ],
};

/* ---- The winter pause -----------------------------------------------------
   Small, cheap, and it answers a fear rather than selling anything: trade goes
   quiet, the money looks like the thing to cut, and the site comes down. £5
   for a month holds it. */
export const PAUSE = {
  price: 5,
  body:
    'One month a year at £5 to hold everything in place. Trades go quiet in winter and we would ' +
    'rather hold your site than lose you.',
};

/* ---- What happens if you leave, and who owns what -------------------------
   Two answers written out in full because this audience has usually been
   burned before, and neither of them is a question they will raise on a call.
   They will just not ring. */
export const LEAVING =
  'You own your domain, your content, your photos and your reviews. The site comes down and we ' +
  'send you everything in a format anyone can use, free, within seven days. No exit fee, ' +
  'nothing held hostage.';

export const OWNERSHIP =
  `You own the domain, the content and your Google profile. We own the template system the ` +
  `site is built on, which is how the build is ${money(BUILD_FEE)} rather than ${money(1500)}.`;

/* The sentence that closes the prices page. It used to live on the guarantee
   object, which no longer exists, and it was never about the guarantee: every
   job gets its terms in writing before anything is signed. */
export const PROPOSAL_LINE = 'Full terms are set out in your proposal before you sign anything.';

/* ---- Google Profile Rescue ------------------------------------------------
   Its own export rather than an item in EXTRAS, because it is not an extra on
   the price page: it is the way in for somebody who is not ready to buy a
   website, and it sits directly under the build fee.

   The fee coming off the build later is the half that makes it work. It turns
   a one-off job into a deposit. */
export const RESCUE = {
  name: 'Google Profile Rescue',
  price: 99,
  heading: 'Not ready for a website? Start here',
  body:
    'We claim, verify and fully sort your Google Business Profile: categories, services, ' +
    'photos, questions and answers, and a plan to get you more reviews. This is what shows up ' +
    'when someone searches for you on Google and Maps.',
  credit: `If you have a website built by us later, the ${money(99)} comes off the build fee.`,
};

/* What stands in for a figure on the two services that are no longer sold off
   a price list. One wording, so the prices page and the service pages say it
   the same way. */
export const PRICED_INDIVIDUALLY = 'Priced individually, get in touch';

/* ---- Everything that is not a plan ----------------------------------------
   Kept off the ladder on purpose. These are jobs, not subscriptions, and
   folding them into the three cards would make each card a paragraph longer
   for the benefit of the minority who want them.

   THE HOURLY RATE IS FIRST IN THIS LIST AND QUIET ON THE PAGE, and the two
   facts are related. It has to be published, because charging by the hour
   without saying the rate is how a small bill becomes an argument. It must not
   be prominent, because an advertised hourly rate invites a reader to price a
   monthly plan by the hour and decide it is expensive. */
export const EXTRAS = [
  {
    name: 'Changes outside a plan',
    price: `${money(55)} an hour, half an hour minimum`,
    /* Rendered without the accent the others get. It is published because it
       has to be and it is not being sold, and an hourly rate set as loud as a
       product price is an invitation to price Managed by the hour. */
    quiet: true,
    body:
      'On Online, and on Managed or Local once the month\'s thirty minutes is used. We always ' +
      'tell you how long a job will take before we start it, so nothing arrives as a surprise. ' +
      'Most people who pay it twice move up to Managed, because it works out cheaper.',
  },
  {
    name: 'Extra pages',
    /* `amount` and `offer` put this in the prices page's JSON-LD, from the
       same figure the visible line prints. */
    amount: 59,
    offer: 'Extra page, added at build time',
    price: `${money(59)} a page, added while the site is built`,
    body:
      'For when five pages is not enough room for everything you do. Tell us at the start and ' +
      'they go in with the build.',
  },
  {
    name: 'Brand design',
    amount: 395,
    offer: 'Brand design, with a website',
    price: `${money(395)} with a website`,
    body:
      'A logo, a colour palette, fonts, a short set of guidelines and a business card, done ' +
      'alongside your site so the two match from day one.',
  },
  {
    name: 'Pause',
    price: `${money(PAUSE.price)} a month, one month a year`,
    body: 'Everything stays in place while work is quiet, and picks up again when you come back.',
  },
  {
    name: 'Referral credit',
    price: `${money(50)} off your next invoice`,
    body: 'Send another business our way. When they sign up, £50 comes off your next invoice.',
  },
  {
    name: 'Google Ads',
    price: PRICED_INDIVIDUALLY,
    body:
      'For when you need the phone ringing this week and cannot wait a quarter for the search ' +
      'work to take. You pay Google directly, from your own card on your own account, so the ' +
      'budget is yours and you can see every penny of it. We tell you what we charge to manage ' +
      'it, and what Google needs as a minimum budget for the ads to run properly, before you ' +
      'commit to anything.',
  },
  {
    name: 'Custom tools',
    price: PRICED_INDIVIDUALLY,
    body:
      'Software built around how your business actually works: job organisation, photo records, ' +
      'inventory and quote builders, automated quotes. Every tool is different, so we price it ' +
      'from the job it replaces.',
  },
];
