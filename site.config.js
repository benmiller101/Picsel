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

  /* Where Picsel works. Used for the honest local mention and areaServed in
     the Organization schema. Note this describes PICSEL, not every client —
     Julie Miller Art is in the Scottish Borders (see projects.js). */
  areaServed: 'Cornwall',

  /* One sentence describing the studio, used in the Organization schema and
     nowhere else yet. It deliberately matches the opening line of the homepage
     almost word for word: the GEO rules ask for entity consistency, and a
     business whose schema describes it differently from its own front page is
     giving two answers to the same question. */
  description:
    'Picsel is a web design and automation studio in Cornwall, building websites and doing ' +
    'search work for local trades and small businesses.',

  /* Real profiles only. Populating this with invented or empty profiles would
     put a broken sameAs into the schema, which is worse than omitting it. */
  socialProfiles: [],

  /* ---- The enquiry form ---------------------------------------------------
     There is no server here — the site is static files on a CDN — so the form
     posts to Web3Forms, which receives the submission and emails it on.

     The access key below is not a secret and is not treated as one. Web3Forms
     works by putting it in the form markup, so it is readable by anyone who
     views source on /contact/ no matter where this file keeps it. What it
     grants is the ability to send a message to Ben's inbox, which is what the
     form is for. The thing it must never become is a key that does anything
     else, so nothing but this form should ever use it. */
  form: {
    endpoint: 'https://api.web3forms.com/submit',
    accessKey: 'ba5982cf-dca9-4465-897f-2dd37870301e',
    accessKeyIsPlaceholder: false,
    /* The subject line of the email that lands in Ben's inbox. Named for the
       site rather than for the sender, so enquiries are filterable. */
    subject: 'New enquiry from the Picsel website',
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
     and the word costs one item in a bar that has room for it. */
  nav: [
    { label: 'Home', href: '/' },
    { label: 'Work', href: '/work/' },
    { label: 'Get in touch', href: '/contact/', accent: true },
  ],
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
