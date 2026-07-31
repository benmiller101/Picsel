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

  /* PENDING DECISION — the domain is not registered yet.
     Until it is, canonical URLs, Open Graph tags and sitemap.xml have nothing
     truthful to point at. The build script warns on every run while this is
     still the placeholder, so it cannot quietly ship to production wrong.
     Change this ONE value once the domain exists and every page follows. */
  origin: 'https://picsel.example',
  originIsPlaceholder: true,

  contact: {
    person: 'Ben Miller',
    /* Displayed form and dialable form kept together so a page can never show
       one number and link another. */
    phoneDisplay: '07456 809049',
    phoneHref: 'tel:+447456809049',
    /* PENDING DECISION — Gmail for now, or info@ on the Picsel domain once it
       is registered. Whichever wins, it changes here and nowhere else. */
    email: 'benwmiller101@gmail.com',
    emailIsPending: true,
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

     PENDING MANUAL STEP: the access key is created in the Web3Forms dashboard
     and pasted in below. Until it is, the form renders and validates but every
     submission is rejected by their API, so the build warns on every run the
     same way the placeholder domain does. */
  form: {
    endpoint: 'https://api.web3forms.com/submit',
    accessKey: 'PASTE-WEB3FORMS-ACCESS-KEY-HERE',
    accessKeyIsPlaceholder: true,
    /* The subject line of the email that lands in Ben's inbox. Named for the
       site rather than for the sender, so enquiries are filterable. */
    subject: 'New enquiry from the Picsel website',
  },

  /* The nav, in order. Rendered as real HTML in every page — never injected by
     JavaScript, because a visitor with JS blocked (or a crawler that does not
     execute it) must still get a working way around the site.
     `accent` marks the one call-to-action styled differently from the rest.

     'Contact' and 'Get in touch' are both on the bar on purpose, and they are
     not the same link: Contact opens the page (phone number, email, where
     Picsel is), while Get in touch jumps straight to the enquiry form on it.
     Two nav items pointing at the identical URL would just be clutter; these
     give someone who wants to call and someone who wants to type a route each. */
  nav: [
    { label: 'Work', href: '/work/' },
    { label: 'Contact', href: '/contact/' },
    { label: 'Get in touch', href: '/contact/#enquiry', accent: true },
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
