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

  /* Real profiles only. Populating this with invented or empty profiles would
     put a broken sameAs into the schema, which is worse than omitting it. */
  socialProfiles: [],

  /* The nav, in order. Rendered as real HTML in every page — never injected by
     JavaScript, because a visitor with JS blocked (or a crawler that does not
     execute it) must still get a working way around the site.
     `accent` marks the one call-to-action styled differently from the rest. */
  nav: [
    { label: 'Work', href: '/work/' },
    { label: 'Contact', href: '/contact/' },
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
