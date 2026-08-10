/* ---- site.config.js — site-wide facts, declared once ----------------------
   Everything about Picsel itself lives here: name, contact details, domain,
   nav structure. projects.js is the source of truth for the WORK; this file is
   the source of truth for the STUDIO.

   Why this matters beyond tidiness: the GEO rules require entity consistency —
   the same studio name, phone number and email everywhere on the site and off
   it. Search engines and AI assistants treat an inconsistent phone number as a
   signal that two different businesses might be involved. One constant, read
   everywhere, makes that class of mistake impossible. */

export const SITE = {
  name: 'Picsel',
  tagline: 'Design Studio',

  /* Used in the <title> suffix and the Organization schema. */
  legalName: 'Picsel',

  /* The registered domain. Canonical URLs, Open Graph tags and sitemap.xml all
     derive from this one value, so every page follows it automatically.
     No www: the site is served from the apex, and www redirects to it. */
  origin: 'https://picsel.co.uk',
  originIsPlaceholder: false,

  contact: {
    person: 'Ben Miller',
    /* Displayed form and dialable form kept together so a page can never show
       one number and link another. */
    phoneDisplay: '07456 809049',
    phoneHref: 'tel:+447456809049',
    /* The studio mailbox, on the Picsel domain. A person's name rather than
       info@, because this audience is small local businesses who reply to a
       human. hello@ exists as an alias on the same inbox but is deliberately
       not published: one address on the site, one address in the schema. */
    email: 'ben@picsel.co.uk',
    emailIsPending: false,
  },

  /* Where Picsel works, and the only geography this site is allowed to claim
     about itself.

     It used to say Cornwall. That stopped being true of the business before it
     stopped being true of the client list: Ben is moving to Edinburgh, and a
     county named in a footer, a title and a schema block is a promise the
     studio would have to keep or quietly break. UK-wide is the honest version
     and it is also the wider market.

     Client locations are a different thing entirely and they stay. A case study
     saying a builder works in Hayle is a fact about that builder, and
     projects.js is where those live. This value describes PICSEL. */
  areaServed: 'United Kingdom',

  /* One sentence describing the studio, used in the Organization schema and in
     llms.txt. It deliberately matches the opening line of the homepage almost
     word for word: the GEO rules ask for entity consistency, and a business
     whose schema describes it differently from its own front page is giving two
     answers to the same question. */
  description:
    'Picsel builds websites for tradespeople anywhere in the UK, gets them found on Google ' +
    'and in AI search, and keeps them there.',

  /* ---- The exclusivity promise --------------------------------------------
     Written once, here, because it is the one sentence on this site that is a
     CONTRACTUAL promise rather than a description, and it was wrong in two
     ways when it was loose in the page copy.

     What it said: "One client per trade, per town", with no conditions.

     What is actually true:
       1. The unit is a PATCH, not a town. The contract says a town plus roughly
          eight miles. "Town" is narrower than what is being promised, which
          undersells it and, worse, means the printed words and the signed words
          disagree.
       2. It only applies on GROWTH, where there is active visibility work to
          protect. A £15 Online client is not being promised that Picsel will
          turn away their competitor, and the business decided deliberately not
          to make that promise.

     THE RULE: the promise never appears without the Growth condition attached.
     tools/build.js checks every rendered page for it and fails the build if a
     page prints one without the other, because this is exactly the kind of line
     that gets shortened to fit a space and becomes a claim nobody meant. */
  exclusivity: {
    full:
      '<strong>One trade per patch.</strong> On our Growth plan, if we are working for a plumber ' +
      'in your patch, your town and roughly eight miles around it, we will not take on another ' +
      'plumber there while you are a client. A different trade in the same patch is fine.',
    /* For the places a full paragraph will not fit. Still carries the
       condition, because a short version that drops it is the failure this
       whole block exists to prevent. */
    short: 'One trade per patch on our Growth plan',
  },

  /* Real profiles only. An invented or dead profile in sameAs is worse than no
     sameAs at all. These three are live, and naming them here is what ties the
     accounts and the site together as one entity for a search engine or an
     assistant trying to work out whether they are the same business. */
  socialProfiles: [
    'https://www.facebook.com/picseluk',
    'https://www.instagram.com/picseluk',
    'https://www.tiktok.com/@picseluk',
  ],

  /* The public Google Business Profile, which is where the reviews in
     reviews.js are published. Linked from every reviews section so a reader
     can check the quotes against the source. */
  /* The profile itself, NOT the /review variant of the same short link. Both
     exist and they do opposite jobs. This link is under the testimonials for a
     reader checking the quotes are real, and .../review sends them to a Google
     sign-in page and then a write-a-review box, which is a worse answer to
     "prove it" than offering no link at all. The /review form is the one to
     send a happy client, and it does not belong on the site. */
  reviewsUrl: 'https://g.page/r/CYTJdsdHkyi_EBM',

  /* ---- The enquiry form ---------------------------------------------------
     There is no server here — the site is static files on a CDN — so the form
     posts to Web3Forms, which receives the submission and emails it on.

     The access key below is not a secret and is not treated as one. Web3Forms
     works by putting it in the form markup, so it is readable by anyone who
     views source on /contact/ no matter where this file keeps it. What it
     grants is the ability to send a message to Ben's inbox, which is what the
     form is for. The thing it must never become is a key that does anything
     else, so nothing but this form should ever use it.

     WHERE THE ENQUIRIES LAND IS NOT SET HERE. Web3Forms mails to the address
     registered against the key in their dashboard, and there is no field in the
     form that can override it. So an enquiry arriving at the wrong inbox is
     never a bug in this repo and cannot be fixed from it: change the recipient
     on the key, or issue a key from an account on the right address. */
  form: {
    endpoint: 'https://api.web3forms.com/submit',
    accessKey: '7b487923-0a73-4253-beaa-9bb2090edd55',
    accessKeyIsPlaceholder: false,
    /* The subject line of the email that lands in Ben's inbox. Named for the
       site rather than for the sender, so enquiries are filterable. */
    subject: 'New enquiry from the Picsel website',
  },

  /* The promise, written once. It appears on the contact page and in each
     service page's FAQ, and it is a promise Ben keeps rather than a line that
     converts, which is the only reason it is safe to print. Change it here and
     it changes everywhere; do not soften it in one place. */
  responsePromise: 'Send an enquiry on a weekday and you will hear back the same day.',

  /* Cloudflare Web Analytics. Cookie free, so there is nothing to consent to
     and no banner: that is why it was chosen over GA4, not a happy accident.
     The token is not a secret. It identifies the site, it is visible in the
     page source of every site that uses it, and it grants no access to
     anything. Paste it from Cloudflare, Analytics and Logs, Web Analytics. */
  analytics: {
    cloudflareToken: 'c188a5b33e2f48fe83bab3a27266377d',
    tokenIsPlaceholder: false,
  },

  /* ---- Picsel HQ call and enquiry counting --------------------------------
     hq-beacon.js reports two numbers to HQ: a tap on the phone number, and an
     enquiry that actually arrived. Nothing that identifies anybody, which is
     why it needs no consent banner. See that file for the full list of what is
     deliberately not sent.

     The key is an identifier, not a secret. It travels in a query string from
     the visitor's browser and is readable in the page source of every site
     that reports to HQ, so keeping it out of the repo would buy nothing and
     cost the single-source-of-truth rule everything else here follows.

     UNLIKE the Cloudflare token above, a placeholder here does NOT suppress
     the script, and that difference is deliberate rather than an inconsistency.
     A wrong key still produces a beacon, and HQ collects those in its
     "reporting a key nobody holds" panel, which exists precisely so that a
     wrong key looks different from a beacon that never fired. Suppressing the
     script would throw away the diagnostic. The build still warns. */
  hq: {
    siteKey: '3c83b56ef65096f927cf8bb5fdf0e8b9',
    keyIsPlaceholder: false,
  },

  /* The nav, in order. Rendered as real HTML in every page — never injected by
     JavaScript, because a visitor with JS blocked (or a crawler that does not
     execute it) must still get a working way around the site.
     `accent` marks the one call-to-action styled differently from the rest.

     There was a 'Contact' link here as well as 'Get in touch', pointing at the
     page and at the form on it. In theory they served two different people; in
     practice they read as the same thing twice, which is what Ben said when he
     saw them. One item now, and it opens the top of the contact page rather
     than jumping to the form, because the page leads with the phone number and
     ringing is what most of this audience will do.

     Home is a labelled item rather than a logo. The bar carried a wordmark and
     then a round P badge; both were a mark you had to already know in order to
     read as "go back to the start". The audience here is mostly non-technical,
     and the word costs one item in a bar that has room for it.

     Prices is the fourth item and it earns the space. The social bios lead with
     "from £15 a month" while the site used to name no number at all, which is a
     contradiction anyone can find in one tab switch. A price in the bar is also
     the fastest way to stop wasting the time of someone who was never going to
     spend it.

     Guides is NOT in the bar, and that is a measurement rather than a
     preference. Five items do not fit 375px without either a hamburger or
     shrinking the labels, and hiding a phone-first audience's route to the
     phone number behind a button they have to find first is the worse trade.
     The guides are reached from the footer, the homepage questions and the
     prices page instead, all of them real links in the markup. */
  nav: [
    { label: 'Home', href: '/' },
    { label: 'Work', href: '/work/' },
    { label: 'Prices', href: '/prices/' },
    { label: 'Get in touch', href: '/contact/', accent: true },
  ],

  /* The footer's secondary links: the routes that matter but do not fit in a
     bar sized for a phone. Rendered as a real <nav> on every page. */
  footerNav: [
    /* Services is here rather than in the bar for the same reason Guides is:
       the bar holds four items at 375px and no more, and the four it holds are
       the ones a phone-first audience needs first. The service pages are the
       money pages, so they are also linked from /prices, from every guide that
       matches one, and from the footer on every page of the site. */
    { label: 'Services', href: '/services/' },
    { label: 'Guides', href: '/guides/' },
    { label: 'Blog', href: '/blog/' },
    { label: 'Work', href: '/work/' },
    { label: 'Prices', href: '/prices/' },
    { label: 'Contact', href: '/contact/' },
    { label: 'About', href: '/about/' },
    { label: 'Privacy', href: '/privacy/' },
  ],

  /* The default social preview, used by any page that does not set its own.
     Project pages override it with their own screenshot, because a link to a
     case study should show the site it is about. From the logo suite:
     06-social/open-graph-share-1200x630.png. */
  ogImage: '/assets/brand/open-graph-share.png',
};

/**
 * Absolute URL for a site-relative path — canonical tags, Open Graph and
 * sitemap.xml all require a full URL, not a relative one.
 * Guarantees exactly one slash at the join regardless of how each side is written.
 */
export function absoluteUrl(path = '/') {
  const base = SITE.origin.replace(/\/+$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
}

/**
 * Whether reviewsUrl above is still the unfilled placeholder.
 *
 * Derived from the string rather than kept as a hand-maintained boolean beside
 * it, the way form.accessKeyIsPlaceholder and analytics.tokenIsPlaceholder are.
 * Those two are flags because the real key and the real token are opaque
 * strings with nothing in them to test; a Google Maps place link is not, and
 * the placeholder announces itself. Two consumers now read this — the build
 * warning and the reviews partial, which drops the anchor entirely while it is
 * true — and a flag anyone could forget to flip when pasting the real URL would
 * put those two out of step with each other and with reality. Derived, they
 * cannot disagree.
 */
export const REVIEWS_URL_IS_PLACEHOLDER = SITE.reviewsUrl.includes('REPLACE_WITH_PLACE_ID');
