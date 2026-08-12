/* ---- pricing.js — the single source of truth for what Picsel charges ------
   SOURCE: the 12 August 2026 price card. Every figure below is from it.

   Same job as projects.js, for money instead of work. The prices page, the
   plan schema, the service pages and the homepage all read this file, so a
   price exists in exactly one place.

   That matters more here than anywhere else on the site. A price written into
   a page, a proposal and a social bio separately is three numbers that agree
   until the day one of them is edited, and the one nobody updates is the one a
   customer quotes back at you.

   WHAT CHANGED ON 12 AUGUST 2026, and why the shape of this file changed with
   it. The old card had a build fee per plan: £99 on Online, £149 on Managed
   and Growth. There is now ONE build fee for every plan, and that is a
   structural decision rather than a repricing. Three build fees invite a
   reader to compare them, and the moment they do, the cheap plan reads as the
   cheap build. One number, stated before the plans are named, takes that
   decision off the table. BUILD_FEE is therefore a top-level export and not a
   field on a plan, so no page can accidentally imply otherwise.

   THE ORDER IS A LADDER, NOT A MENU. Each plan contains the one before it
   whole. `inherits` says so in the data rather than leaving it to the copy,
   because "everything in Online, plus" is a promise that has to survive
   somebody editing the Online list.

   THREE THINGS IN HERE THAT ARE EASY TO DROP AND MUST NOT BE
     Managed's 30 minutes is use it or lose it. It does not roll over, and a
       client who believes they are banking six hours a year has been misled by
       an omission rather than by a sentence.
     Growth's £99 is an opening rate, not a discount. It is what the first
       three months cost. Written as a discount it becomes an asterisk nobody
       trusts.
     Growth's twelve month term never appears without its reason attached. The
       reason is that a patch is being held empty, and a term with no reason
       reads as a trap.

   TWO THINGS THAT ARE NOT DECORATION
     `exclusive`  Only Growth carries the one-trade-per-patch promise, and only
                  Growth is priced to. See SITE.exclusivity in site.config.js
                  for why, and for the build check that enforces it.
     `guarantee`  Only Growth carries the refund. It is a real commercial
                  commitment with real terms, so the wording here is the
                  wording, and it is not to be tightened to fit a card. */

/* Formatted here rather than in the templates, so £15 is written the same way
   on every surface that shows it. Whole pounds throughout: nothing on this
   list has pence, and "£15.00" reads like a utility bill. Thousands get their
   comma from toLocaleString, which is what turns 1200 into £1,200. */
export function money(pounds) {
  return `£${pounds.toLocaleString('en-GB')}`;
}

/* ---- The build fee --------------------------------------------------------
   One number, every plan. Read the note at the top of this file before moving
   it onto a plan: it is deliberately not a per-plan field. */
export const BUILD_FEE = 299;

/* The sentence the prices page opens on, before a single plan is named. It is
   the whole reason the page is ordered the way it is, so it lives with the
   number rather than in the template. */
export const BUILD_LINE =
  `${money(BUILD_FEE)} to build your website, whichever plan you pick. ` +
  'Then choose how much I do afterwards.';

export const PLANS = [
  {
    id: 'online',
    name: 'Online',
    /* The one-line answer to "what is this one for", in the words the customer
       would use rather than the words a plan comparison table would. */
    summary:
      'A smart, professional website built for your trade, live within a week. Set and forget: ' +
      'it just works.',
    monthly: 15,
    term: 'Rolling, cancel any time',
    inherits: null,
    includes: [
      'A five page website built around your trade',
      'Hosting, security and SSL, all handled',
      'Your Google Business Profile set up properly at launch',
    ],
    /* The line that does the most work on a card. The others describe the
       plan; this one describes the customer, which is what somebody comparing
       three boxes is actually trying to match themselves against. */
    bestFor:
      'You have no site, or a poor one, and want a proper one for less than most hosting bills.',
    /* Stated as plainly as the includes. A plan whose limits are in the small
       print is how someone ends up feeling sold to three months later. */
    excludes: ['No ongoing edits. Changes are charged by the hour when you want them.'],
    exclusive: false,
    guarantee: false,
  },
  {
    id: 'managed',
    name: 'Managed',
    summary: 'Everything in Online, looked after, so you never have to touch it.',
    monthly: 29,
    term: 'Rolling, cancel any time',
    inherits: 'Online',
    includes: [
      /* The non-rollover is inside the same sentence as the allowance, not a
         footnote under it. A reader who takes only the first half of this line
         has still been told the truth. */
      'Thirty minutes of changes a month, made by me. Use it or lose it, it does not roll over',
      'Your Google profile kept active with a monthly post and fresh photos',
      'A simple monthly report showing your calls and enquiries',
    ],
    bestFor: 'You want your website looked after so you never have to think about it.',
    excludes: [],
    exclusive: false,
    guarantee: false,
  },
  {
    id: 'growth',
    name: 'Growth',
    summary:
      'Everything in Managed, plus active work every month to put you in front of people who are ' +
      'searching right now.',
    monthly: 179,
    /* The opening rate. NOT a discount and not to be written as one: it is
       what the first three months cost, stated as a price, because a price a
       reader can plan around beats a saving they have to trust. */
    openingMonthly: 99,
    openingMonths: 3,
    term: '12 months',
    /* The term never ships without this. See the note at the top of the file. */
    termReason: 'because I am turning down every other trade in your patch to do it',
    inherits: 'Managed',
    includes: [
      'New content every month targeting the towns and services you want to win',
      'Active review generation, to build your reputation',
      'Your details listed consistently across the directories that count',
      /* The card this came from writes it as who is the best "[trade]" near
         me. The bracket is right in a document a human fills in and wrong on a
         live page, where an unreplaced placeholder reads as a site nobody
         finished, so a real trade stands in for it. */
      'The technical and AI search work that gets you named when someone asks their phone ' +
        'for the best electrician near them',
    ],
    bestFor: 'You want more of the right jobs and you are ready to grow.',
    excludes: [],
    exclusive: true,
    guarantee: true,
  },
];

/* ---- The upgrade offer ----------------------------------------------------
   The most commercially important sentence on the price page, and the one most
   likely to end up in a footer because it is short. It goes directly under
   Growth, where the person it is aimed at is already standing.

   Why it works: the objection to Growth is never the work, it is committing to
   the number before seeing whether the work lands. This removes the commitment
   and leaves the trial. */
export const UPGRADE_OFFER =
  'Already on Online or Managed? Try Growth for a month at your current price. If you do not ' +
  'like it I put you straight back, no argument.';

/* ---- Paying for the year up front -----------------------------------------
   Twelve months for the price of ten, on any plan. The three figures are
   written out rather than derived, because Growth's first year contains three
   months at the opening rate and would not survive being multiplied by ten. */
export const ANNUAL = {
  headline: 'Twelve months for the price of ten, on any plan.',
  prices: [
    { plan: 'Online', price: 150 },
    { plan: 'Managed', price: 290 },
    { plan: 'Growth', price: 1600 },
  ],
};

/* ---- The winter pause -----------------------------------------------------
   Small, cheap, and it answers a fear rather than selling anything: trade goes
   quiet, the money looks like the thing to cut, and the site comes down. £5
   for a month holds it. */
export const PAUSE = {
  price: 5,
  body:
    'One month a year at £5 to hold everything in place. Trades go quiet in winter and I would ' +
    'rather hold your site than lose you.',
};

/* ---- What happens if you leave, and who owns what -------------------------
   Two answers written out in full because this audience has usually been
   burned before, and neither of them is a question they will raise on a call.
   They will just not ring. */
export const LEAVING =
  'You own your domain, your content, your photos and your reviews. The site comes down and I ' +
  'send you everything in a format anyone can use, free, within seven days. No exit fee, ' +
  'nothing held hostage.';

export const OWNERSHIP =
  `You own the domain, the content and your Google profile. I own the template system the site ` +
  `is built on, which is how the build is ${money(BUILD_FEE)} rather than ${money(1500)}.`;

/* ---- Google Profile Rescue ------------------------------------------------
   Its own export rather than an item in EXTRAS, because it is not an extra on
   the price page any more: it is the way in for somebody who is not ready to
   buy a website, and it sits directly under the build fee.

   The fee coming off the build later is the half that makes it work. It turns
   a one-off job into a deposit. */
export const RESCUE = {
  name: 'Google Profile Rescue',
  price: 89,
  heading: 'Not ready for a website? Start here',
  body:
    'I claim, verify and fully sort your Google Business Profile: categories, services, photos, ' +
    'questions and answers, and a plan to get you more reviews. This is what shows up when ' +
    'someone searches for you on Google and Maps.',
  credit: `If you take a plan later, the ${money(89)} comes off your build fee.`,
};

/* ---- Everything that is not a plan ----------------------------------------
   Kept off the ladder on purpose. These are jobs, not subscriptions, and
   folding them into the three cards would make each card a paragraph longer
   for the benefit of the minority who want them.

   THE HOURLY RATE IS FIRST IN THIS LIST AND QUIET ON THE PAGE, and the two
   facts are related. It has to be published, because charging by the hour
   without saying the rate is how a small bill becomes an argument. It must not
   be prominent, and it must not sit near Growth, because an advertised hourly
   rate invites a reader to price a monthly plan by the hour and decide it is
   expensive. That is an argument with a spreadsheet, and the spreadsheet does
   not know what the monthly work is. */
export const EXTRAS = [
  {
    name: 'Extra changes',
    price: `${money(45)} an hour, half an hour minimum`,
    /* Rendered without the accent the other two get. It is published because
       it has to be and it is not being sold, and an hourly rate set as loud as
       a product price is an invitation to price Managed by the hour. */
    quiet: true,
    body:
      'On Online, and on Managed once the included thirty minutes is used. I always tell you ' +
      'how long a job will take before I start it, so nothing arrives as a surprise. Most ' +
      'people who pay it twice move up to Managed, because it works out cheaper.',
  },
  {
    name: 'Google Ads',
    price: `${money(129)} a month to manage, minimum ${money(400)} a month ad budget`,
    body:
      'For when you need the phone ringing this week and cannot wait a quarter for the search ' +
      'work to take. You pay Google directly, from your own card on your own account, so the ' +
      `budget is yours and you can see every penny of it. I only ever charge the ${money(129)}. ` +
      `The ${money(400)} minimum is not a sales floor: below it the ads do not run often enough ` +
      'to work, and I would rather turn the job down than take money for something that will not.',
  },
  {
    name: 'Custom apps',
    price: `${money(1200)} to build then ${money(49)} a month, or ${money(149)} a month with no build fee on a 12 month term`,
    body:
      'Software built around how your business actually works: job organisation, photo records, ' +
      'inventory and quote builders, automated quotes. The monthly covers hosting, backups, ' +
      'security updates, fixes and small changes. Larger new features are quoted separately.',
  },
];

/* ---- The lead guarantee ---------------------------------------------------
   Growth only. Written out here in full because every word of it is a term:
   what has to happen, how many, by when, and what comes back. "Genuine
   customer enquiries" is doing real work in that sentence, and shortening it
   to "5 leads in 4 months" would change what is being promised.

   THE PAYOUT IS A CHOICE, not a refund, and the two options are not the same
   size on purpose. Cash is £149 and credit is the whole £299, because credit
   costs the studio time rather than money and is worth more to a client who is
   staying. Somebody who is leaving takes the cash.

   THE TERM RELEASE IS THE NEW SENTENCE AND IT IS THE POINT. A twelve month
   term plus a guarantee, with no statement of what happens when the guarantee
   pays out, is a client trapped in the plan that just failed them. Read on its
   own it is the most persuasive line on the page, which is a side effect
   rather than the reason it is there.

   Deliberately NOT using "guaranteed" as an adjective anywhere. It is on the
   never-do list, and the noun does the job without the puff. */
export const GUARANTEE = {
  cash: 149,
  credit: BUILD_FEE,
  enquiries: 5,
  months: 4,

  promise:
    'If the website and Google Business Profile do not bring you at least five genuine customer ' +
    `enquiries in the first four months, you choose: ${money(149)} of the build fee back in ` +
    `cash, or the full ${money(BUILD_FEE)} as credit against your monthly fee.`,

  /* Named rather than a bare array, and that is a bug fix rather than a style
     preference. A page elsewhere quoted `terms[1]` to close with "full terms
     are in your proposal"; adding a line at the top shifted every index by
     one, and the page silently started closing on a different sentence.
     Positions in a list of legal terms are exactly the wrong thing to address
     by number. */
  annualPayers: `If you paid for the year up front, the ${money(149)} comes in cash, since there is nothing left to credit.`,
  termRelease:
    'A guarantee payout ends your twelve month term on thirty days notice. I am not going to ' +
    'hold you to a year if I have not delivered.',
  keepEverything: 'You keep everything either way: the site, the domain and the Google profile.',
  monthlyNotRefundable:
    'The monthly fee is not refundable. It only ever covers months already worked.',
  proposal: 'Full terms are set out in your proposal before you sign anything.',
};

/* The terms in the order they are shown, built from the named fields above so
   the two can never disagree about what the terms are. */
GUARANTEE.terms = [
  GUARANTEE.annualPayers,
  GUARANTEE.termRelease,
  GUARANTEE.keepEverything,
  GUARANTEE.monthlyNotRefundable,
  GUARANTEE.proposal,
];
