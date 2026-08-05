/* ---- pricing.js — the single source of truth for what Picsel charges ------
   SOURCE: picsel-pricing.pdf (4 August 2026), in
   Desktop/Graphic Design/Design Studio/Pricing. Every plan name, build fee and
   monthly figure below is taken from it and matches it exactly. The wording is
   the PDF's own wherever the PDF had a better line than the site did, which was
   most of them: "who is the best [trade] near me" and "gives you your evenings
   back" are Ben's, and they are worth more than anything written for him.

   THREE PLACES THIS FILE DELIBERATELY DIVERGES FROM THAT PDF. All three are
   later decisions, and the PDF is the document that needs updating, not this:

     1. EXCLUSIVITY. The PDF lists "one trade per area" as an unconditional
        promise made to every client, and defines the area as your town. The
        decision since is that it is a PATCH, being a town plus roughly eight
        miles, and that full exclusivity is offered on GROWTH only, where there
        is active visibility work to protect. A £15 Online client is not being
        promised that Picsel will turn away their competitor. See
        SITE.exclusivity in site.config.js, and the build check that enforces
        it. **Anyone still handing out the PDF is promising something wider
        than the site now offers.**
     2. THE MONTHLY FEE IS NOT REFUNDABLE. The PDF's guarantee says the build
        fee comes back and does not say what happens to the monthly. Stated
        plainly here, because a refund term a customer has to infer is a
        complaint waiting to happen.
     3. GOOGLE ADS. Not in the PDF at all. It is on the site because the brief
        for this rebuild specified it, at £129 a month plus ad spend. Confirm
        the figure before anyone quotes it.

   Same job as projects.js, for money instead of work. The prices page, the
   plan schema and the homepage's answer to "how much does it cost" all read
   this file, so a price exists in exactly one place.

   That matters more here than anywhere else on the site. A price written into
   a page, a proposal and a social bio separately is three numbers that agree
   until the day one of them is edited, and the one nobody updates is the one a
   customer quotes back at you.

   WHY THERE ARE PRICES ON THE SITE AT ALL. There deliberately were not. The
   old rule in home.js said prices stay off the site and get quoted in the
   conversation. That rule is now reversed, and the reason is not a change of
   heart about pricing pages: the social bios already lead with "from £15 a
   month", so the site saying nothing was not discretion, it was a
   contradiction anyone could find in one tab switch.

   THE ORDER IS A LADDER, NOT A MENU. Each plan contains the one before it
   whole. `inherits` says so in the data rather than leaving it to the copy,
   because "everything in Online, plus" is a promise that has to survive
   somebody editing the Online list.

   TWO THINGS THAT ARE NOT DECORATION
     `exclusive`  Only Growth carries the one-trade-per-patch promise, and only
                  Growth is priced to. See SITE.exclusivity in site.config.js
                  for why, and for the build check that enforces it.
     `guarantee`  Only Growth carries the refund. It is a real commercial
                  commitment with real terms, so the wording here is the
                  wording, and it is not to be tightened to fit a card. */

/* Formatted here rather than in the templates, so £15 is written the same way
   on every surface that shows it. Whole pounds throughout: nothing on this
   list has pence, and "£15.00" reads like a utility bill. */
export function money(pounds) {
  return `£${pounds.toLocaleString('en-GB')}`;
}

export const PLANS = [
  {
    id: 'online',
    name: 'Online',
    /* The one-line answer to "what is this one for", in the words the customer
       would use rather than the words a plan comparison table would. */
    summary:
      'A smart, professional website built for your trade, live within a week. Set and forget: ' +
      'it just works.',
    build: 99,
    monthly: 15,
    inherits: null,
    includes: [
      'A five page website built around your trade',
      'Hosting, security and SSL, all handled',
      'Your Google Business Profile set up properly at launch',
    ],
    /* Straight from the PDF, and the most useful line on each card. Someone
       scanning three plans is asking "which one is me", and this answers it in
       their own situation rather than in ours. */
    bestFor:
      'You have no site, or a poor one, and want a proper one for less than most hosting bills.',
    /* Stated as plainly as the includes. A plan whose limits are in the small
       print is how someone ends up feeling sold to three months later. */
    excludes: ['No ongoing edits. Changes are quoted when you want them.'],
    exclusive: false,
    guarantee: false,
  },
  {
    id: 'managed',
    name: 'Managed',
    summary: 'Everything in Online, looked after, so you never have to touch it.',
    build: 149,
    monthly: 29,
    inherits: 'Online',
    includes: [
      'We make your changes for you, up to 30 minutes a month',
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
    build: 149,
    monthly: 119,
    inherits: 'Managed',
    includes: [
      'New content every month targeting the towns and services you want to win',
      'Active review generation, to build your reputation',
      'Your details listed consistently across the directories that count',
      /* The PDF writes this as who is the best "[trade]" near me. The bracket
         is right in a document a human fills in and wrong on a live page,
         where an unreplaced placeholder reads as a site nobody finished, so a
         real trade stands in for it. */
      'The technical and AI search work that gets you named when someone asks their phone ' +
        'for the best electrician near them',
    ],
    bestFor: 'You want more of the right jobs and you are ready to grow.',
    excludes: [],
    exclusive: true,
    guarantee: true,
  },
];

/* ---- The lead guarantee ---------------------------------------------------
   Growth only. Written out here in full because every word of it is a term:
   what has to happen, how many, by when, and what comes back. "Genuine
   customer enquiries" is doing real work in that sentence, and shortening it
   to "5 leads in 4 months" would change what is being promised.

   The second and third lines are not hedging. The build fee is refundable and
   the monthly fee is not, and someone reading a price page is entitled to know
   which before they ring rather than after. */
export const GUARANTEE = {
  promise:
    'If the website and Google Business Profile we build do not bring you at least five genuine ' +
    'customer enquiries in the first four months, we refund your build fee in full.',

  /* Named rather than a bare array, and that is a bug fix rather than a style
     preference. A page elsewhere quoted `terms[1]` to close with "full terms
     are in your proposal"; adding the keep-everything line at the top shifted
     every index by one, and the page silently started closing on the sentence
     about the monthly fee being non-refundable instead. Positions in a list of
     legal terms are exactly the wrong thing to address by number. */
  keepEverything: 'You keep everything either way: the site, the domain and the Google profile.',
  monthlyNotRefundable: 'The monthly fee is not refundable. It pays for work already done.',
  proposal: 'Full terms are set out in your proposal before you sign anything.',
};

/* The terms in the order they are shown, built from the named fields above so
   the two can never disagree about what the terms are. */
GUARANTEE.terms = [
  GUARANTEE.keepEverything,
  GUARANTEE.monthlyNotRefundable,
  GUARANTEE.proposal,
];

/* ---- Everything that is not a plan ----------------------------------------
   Kept off the ladder on purpose. These are jobs, not subscriptions, and
   folding them into the three cards would make each card a paragraph longer
   for the benefit of the minority who want them. */
export const EXTRAS = [
  {
    name: 'Google Profile Rescue',
    price: `${money(89)} one off`,
    body:
      'We claim, verify and fully sort your Google Business Profile: categories, services, ' +
      'photos, questions and answers, and a plan to get you more reviews. This is what shows up ' +
      'when someone searches for you on Google and Maps. If you take a website later, the £89 ' +
      'comes off it.',
  },
  {
    name: 'Google Ads',
    price: `From ${money(129)} a month, plus your ad spend`,
    body:
      'For when you want the phone to ring this week rather than this quarter. Your ad budget ' +
      'goes straight to Google and we never take a cut of it.',
  },
  {
    name: 'Custom tools',
    price: `From ${money(1200)}, or from ${money(89)} a month`,
    body:
      'Tools built around how your business actually works: job organisation, photo records, ' +
      'inventory and quote builders, automated quotes. If you spend hours on paperwork, this ' +
      'gives you your evenings back.',
  },
];

/* ---- The founding offer ---------------------------------------------------
   A real, countable, expiring offer rather than a permanent "special price",
   which is just a price. The trade is stated in both directions: what the
   client saves and what Picsel gets for it. Nobody has to guess what the catch
   is, because the catch is written down.

   `remaining` is not tracked in code and deliberately so. A counter that says
   "3 left" and is not wired to anything real is the fake-urgency pattern this
   whole site avoids, and a hand-edited number would be wrong within a week. */
export const FOUNDING_OFFER = {
  count: 5,
  build: 49,
  term: '12 month',
  give: [
    'A Google review once the site is live',
    'A short case study we can put on this page',
    'Two introductions to other tradespeople',
  ],
  /* The expiry, in the PDF's own words. It is the honest half of a limited
     offer: what happens when it runs out, said before anyone asks. */
  after: 'Once the five spots are gone, standard build fees apply.',
};
