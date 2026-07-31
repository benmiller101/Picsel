/* ---- projects.js — the single source of truth for Picsel's work -----------
   Every project fact on this site comes from here. The Work grid, the five
   project pages, the sitemap entries and the screenshot pipeline all read this
   file, so a project is added or corrected in exactly one place. Never
   hand-copy a name, URL or sector into a page: if it appears twice, the two
   copies will eventually disagree.

   Adding a project:
     1. Add an entry below (keep `slug` URL-safe and permanent — it becomes the
        page address /work/<slug>, and changing it later breaks inbound links).
     2. Run `npm run shots` to capture its screenshots.
     3. Rebuild the pages. The grid, its page and the sitemap all follow.

   FIELD REFERENCE
     slug      string   URL segment and the assets/work/<slug>/ folder name.
                        kebab-case, permanent.
     name      string   Display name, exactly as the client brands themselves.
     url       string   The live site. Opened in a new tab from the project page.
     sector    string   Short human label shown under the name on cards.
     location  string   Where the client is. Used for the honest local mention;
                        NOT every project is Cornwall (see julie-miller-art).
     featured  boolean  Shows in the homepage "Selected work" grid. The /work
                        page lists every project regardless.
     tags      string[] What Picsel actually did. See the caution below.
     blurb     string   One to three plain sentences from Picsel's point of
                        view about the build. British English, no jargon.
     alt       string   Screenshot alt text, per the SEO rules.

   TWO STANDING CAUTIONS
     `tags` is a public claim about work performed. Every entry currently reads
     ['Website'] because that is the only thing verifiable from the live sites.
     Do not add 'SEO' or 'Google Profile' to a project until Ben confirms that
     is what Picsel actually delivered for that client.

     `blurb` text below is a factual first draft written from what each live
     site says about itself — deliberately describing the build, never claiming
     an outcome (traffic, enquiries, rankings) that has not been measured. Ben
     is expected to reword these in his own voice. */

export const PROJECTS = [
  {
    slug: 'nevitt-construction',
    // The domain is haylebuilders.com, but the site brands itself
    // "A Nevitt Construction" in its own header and title, so that is the name
    // used here — a client is called what they call themselves.
    name: 'A Nevitt Construction',
    url: 'https://haylebuilders.com/',
    sector: 'Construction',
    location: 'Hayle, Cornwall',
    featured: true,
    tags: ['Website'],
    blurb:
      'A site for a family-run building contractor in Hayle, covering everything from ' +
      'single-storey extensions to full design-and-build new homes. The work is organised ' +
      'by service so a homeowner can find the job they have in mind, and the whole of ' +
      'west Cornwall is covered without a page per town.',
    alt: 'Screenshot of the A Nevitt Construction website',
  },
  {
    slug: 'lanora-house',
    name: 'Lanora House',
    url: 'https://www.lanorahouse.com/',
    sector: 'House clearance',
    location: 'Hayle, Cornwall',
    featured: true,
    tags: ['Website'],
    blurb:
      'A licensed house clearance and cleaning firm working across Cornwall and the ' +
      'South West. The site sets out the full range, from probate and bereavement clearances ' +
      'through to end-of-tenancy cleans. It also gives proper room to how much of what they ' +
      'clear is kept out of landfill, because that is what makes them different.',
    alt: 'Screenshot of the Lanora House website',
  },
  {
    slug: 'ajc-removals',
    name: 'AJC Removals & Clearances',
    url: 'https://ajcremovals.co.uk/',
    sector: 'Removals & clearance',
    location: 'Cornwall',
    featured: true,
    tags: ['Website'],
    blurb:
      'A removals and clearance company covering Cornwall, Devon and beyond. They are ' +
      'plain-spoken about what they do, so the site is too: what they move, what they ' +
      'clear, and a quote request that takes seconds rather than a form that puts people off.',
    alt: 'Screenshot of the AJC Removals & Clearances website',
  },
  {
    slug: 'julie-miller-art',
    name: 'Julie Miller Art',
    url: 'https://juliemillerart.co.uk/',
    sector: 'Artist portfolio',
    // Scottish Borders, NOT Cornwall. The SEO rules single this project out:
    // do not add a Cornwall mention to this page. It would be untrue.
    location: 'Scottish Borders',
    featured: true,
    tags: ['Website'],
    blurb:
      'A portfolio for an illustrator working in mixed media in the Scottish Borders, ' +
      'where the landscape drives the work. The design stays quiet and gives the pieces ' +
      'space, because on an artist site the work is the interface and anything else is in the way.',
    alt: 'Screenshot of the Julie Miller Art website',
  },
  {
    slug: 'house-of-cornwall',
    name: 'House of Cornwall',
    url: 'https://houseofcornwall.live/',
    sector: 'Antiques & auctions',
    location: 'Hayle, Cornwall',
    featured: true,
    tags: ['Website'],
    blurb:
      'Live clearance auctions broadcast from Hayle every week, selling antiques, retro ' +
      'pieces and curiosities that come out of real house clearances. The site had to make ' +
      'the next live sale the most obvious thing on the page, and explain a format most ' +
      'visitors will not have come across before.',
    alt: 'Screenshot of the House of Cornwall website',
  },
];

/* Convenience views. Defined here rather than re-filtered in every page script
   so "featured" means one thing across the whole site. */

/** Projects shown in the homepage "Selected work" grid, in file order. */
export const FEATURED_PROJECTS = PROJECTS.filter((project) => project.featured);

/** Look up a single project by its slug. Returns undefined if there is no match. */
export function getProjectBySlug(slug) {
  return PROJECTS.find((project) => project.slug === slug);
}

/**
 * The previous and next project relative to `slug`, wrapping at both ends so
 * the prev/next links on a project page are never dead. Returns null for both
 * when there is only one project, since prev/next would just point at itself.
 */
export function getAdjacentProjects(slug) {
  const index = PROJECTS.findIndex((project) => project.slug === slug);
  if (index === -1 || PROJECTS.length < 2) return { previous: null, next: null };

  const lastIndex = PROJECTS.length - 1;
  return {
    previous: PROJECTS[index === 0 ? lastIndex : index - 1],
    next: PROJECTS[index === lastIndex ? 0 : index + 1],
  };
}
