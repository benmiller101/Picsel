import { SHOW_PRICING } from './site.config.js';

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
     location  string   Where the CLIENT is. A fact about them, not about
                        Picsel, which works UK-wide and names no place of its
                        own anywhere on this site. It appears in the eyebrow on
                        that client's page and nowhere else: it came off the
                        work cards when five towns in one grid started reading
                        as a claim about where the studio is.
     featured  boolean  Shows in the homepage "Selected work" grid. The /work
                        page lists every project regardless.
     tags      string[] What Picsel actually did. See the caution below.
     blurb     string   One to three plain sentences from Picsel's point of
                        view about the build. British English, no jargon.
     alt       string   Screenshot alt text, per the SEO rules.
     related   string   One or two sentences, specific to this job, each
                        carrying a contextual link: one to the guide the job
                        actually demonstrates, one to the plan it was built on.
                        Written raw (not escaped) so the <a> renders, per
                        CLAUDEseo.md section 3 on body-copy internal links. May
                        carry only a, em, strong and abbr, each one closed.
     plan      string   The `id` of the plan in pricing.js this build runs on,
                        or null where it is not one of the three. It is not a
                        new claim: every one of these was already stated in
                        that project's own `related` sentence, which links to
                        /prices/#online or /prices/#growth in words a reader
                        can see. This field is the same fact in a form a page
                        can read, added so /prices can show what its own prices
                        have actually bought without a template parsing an
                        anchor out of a sentence. If the two ever disagree, the
                        `related` copy is the one a client has read and this is
                        the one to correct.
     mockup    object   OPTIONAL. Present only on the three projects Ben has a
                        hand-made device mockup for. { alt, width, height } —
                        width and height are the real pixel size of that
                        project's assets/work/<slug>/mockup.webp, which
                        tools/convert-photo.js prints when it writes the file
                        and which the <img> tag needs so the browser reserves
                        the right space before the file itself arrives. When
                        present, the project page shows the flat desktop
                        screenshot as its opening image exactly as every other
                        project does, and shows this mockup a second time,
                        lower down, as a supporting image that breaks up the
                        body copy rather than repeating the opening shot (an
                        earlier version of this page dropped the opening
                        screenshot on these three projects on the reasoning
                        that the mockup already contained that view; Ben's own
                        reason for commissioning the mockups was to support
                        the text, not replace the screenshot, so both now
                        appear). ogImage and the schema's image still point at
                        the baked assets/work/<slug>/mockup-og.webp rather
                        than the transparent mockup.webp — see
                        tools/pages/project.js. A project with no `mockup`
                        field renders exactly as it did before this field
                        existed.

   TWO STANDING CAUTIONS
     `tags` is a public claim about work performed, so it says only what Ben has
     confirmed Picsel actually delivered — not what is guessable from looking at
     the live site. He confirmed SEO on A Nevitt Construction and Lanora House;
     the other three are the build alone. Do not add 'SEO' or 'Google Profile'
     to a project on inference.

     `blurb` text below is a factual first draft written from what each live
     site says about itself — deliberately describing the build, never claiming
     an outcome (traffic, enquiries, rankings) that has not been measured. Ben
     is expected to reword these in his own voice.

   THE ORDER OF THIS LIST IS THE ORDER OF THE GRID, and it is now sorted by
   sector and by what the job involved rather than by geography. It used to run
   as four Cornwall businesses with the Scottish one fourth, which is a
   perfectly good order for a Cornwall studio and the wrong one for a studio
   that works anywhere.

   Nevitt leads because it is the fullest trade build on the list, a
   construction firm with the search work included, and it is the closest thing
   here to what the site is now selling. Wolf Pine follows it for the same
   reason and takes it further: a tree surgeon with the build, the search work
   and the Google Profile, which is every service this site sells on one job.

   Julie Miller Art used to sit second, on the argument that a visitor in
   Newcastle seeing the Scottish Borders early draws their own conclusion about
   whether distance matters. Ben moved it to fifth in August 2026 when Wolf
   Pine arrived. The grid now leads with the two fullest trade builds, which is
   what the site sells, and the distance argument is made further down instead
   of in the second card. If the portfolio ever stops being Cornwall-heavy at
   the top, this is the decision to revisit. */

/* The half of each `related` note that names the plan a build runs on. It
   disappears with SHOW_PRICING and the guide sentence beside it does not,
   because "this job is the thing that guide describes" is still true when
   there is no price list to point the reader at. Written as a helper so the
   sentences stay in the data where a reader will find them, rather than being
   deleted now and reconstructed from memory later. */
const planNote = (sentence) => (SHOW_PRICING ? ` ${sentence}` : '');

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
    tags: ['Website', 'SEO'],
    plan: 'growth',
    blurb:
      'A site for a family-run building contractor in Hayle, built with SEO, covering ' +
      'everything from single-storey extensions to full design-and-build new homes. The work ' +
      'is organised by service so a homeowner can find the job they have in mind, and the ' +
      'whole of west Cornwall is covered without a page per town.',
    alt: 'Screenshot of the A Nevitt Construction website',
    related:
      'The search side of this build is the same GEO work covered in ' +
      '<a href="/guides/what-is-geo/">what GEO is and why it matters for trades</a>' +
      (SHOW_PRICING
        ? ', and it is included on the <a href="/prices/#growth">Growth plan</a>.'
        : '.'),
    // Chosen over the two unused variants on disk (see mockups/brief.md)
    // because it shows the desktop, tablet and phone together, which is the
    // one thing this portfolio actually needs to demonstrate: the same build
    // working on a phone. Dimensions are mockup.webp's own, as
    // tools/convert-photo.js printed them.
    mockup: {
      alt: 'The A Nevitt Construction website shown together on a laptop, a tablet and a phone',
      width: 1440,
      height: 655,
    },
  },
  {
    slug: 'wolf-pine',
    // The domain is wolfpine.uk, but the logo, the site header and the page
    // title all set it as two words, so that is the name used here.
    name: 'Wolf Pine',
    url: 'https://wolfpine.uk/',
    sector: 'Tree surgery',
    location: 'Hayle, Cornwall',
    featured: true,
    tags: ['Website', 'SEO', 'Google Profile'],
    // Online today. He has said he intends to move to Managed once he is down
    // in Cornwall; this field records what the build runs on now, not what it
    // is expected to run on, and changes on the day the plan actually does.
    plan: 'online',
    blurb:
      'A tree surgeon working out of Hayle, covering west Cornwall from St Ives round to ' +
      'Penzance and Redruth, with the search and Google Profile work included. The hero is ' +
      'his own footage of a fell. It runs a shorter cut on a phone than on a desktop, ' +
      'because a stock photograph of somebody else\'s tree would have said nothing about ' +
      'him. Underneath it the site sets out how quoting works before it asks for anything: ' +
      'every job priced on site, in person, never over the phone.',
    alt: 'Screenshot of the Wolf Pine tree surgery website',
    related:
      'Footage of his own work in the hero, rather than a stock photograph of somebody ' +
      'else\'s tree, is the case <a href="/guides/what-a-trades-website-needs/">what a ' +
      'tradesperson\'s website needs</a> makes for using your own photos.' +
      planNote('This one was built on our <a href="/prices/#online">Online plan</a>.'),
  },
  {
    slug: 'lanora-house',
    name: 'Lanora House',
    url: 'https://www.lanorahouse.com/',
    sector: 'House clearance',
    location: 'Hayle, Cornwall',
    featured: true,
    tags: ['Website', 'SEO'],
    plan: 'growth',
    blurb:
      'A licensed house clearance and cleaning firm working across Cornwall and the South ' +
      'West, with the SEO work included to bring enquiries in. The site sets out the full ' +
      'range, from probate and bereavement clearances through to end-of-tenancy cleans. It ' +
      'also gives proper room to how much of what they clear is kept out of landfill, because ' +
      'that is what makes them different.',
    alt: 'Screenshot of the Lanora House website',
    related:
      'Getting a clearance business found means asking every customer for a review at the ' +
      'right moment, which is exactly what <a href="/guides/how-to-get-more-google-reviews/">how ' +
      'to get more Google reviews</a> sets out.' +
      planNote(
        'That ongoing work is part of the <a href="/prices/#growth">Growth plan</a>.',
      ),
  },
  {
    slug: 'ajc-removals',
    name: 'AJC Removals & Clearances',
    url: 'https://ajcremovals.co.uk/',
    sector: 'Removals & clearance',
    location: 'Cornwall',
    featured: true,
    tags: ['Website'],
    plan: 'online',
    blurb:
      'A removals and clearance company covering Cornwall, Devon and beyond, where the quote ' +
      'request takes seconds, not a long form to fill in. They are plain-spoken about what ' +
      'they do, so the site lists exactly what they move and what they clear, nothing more.',
    alt: 'Screenshot of the AJC Removals & Clearances website',
    related:
      'A quote request that takes seconds only works if the site itself was priced just as ' +
      'plainly, which is the same argument made in ' +
      '<a href="/guides/how-much-a-trades-website-costs/">how much a tradesman\'s website ' +
      'should cost</a>.' +
      planNote('This one was built on our <a href="/prices/#online">Online plan</a>.'),
    // Chosen over the unused second variant on disk (see mockups/brief.md)
    // because it shows the desktop, tablet, laptop and phone together.
    // Dimensions are mockup.webp's own, as tools/convert-photo.js printed
    // them.
    mockup: {
      alt: 'The AJC Removals & Clearances website shown together on a laptop, a tablet and two phones',
      width: 1440,
      height: 583,
    },
  },
  {
    slug: 'julie-miller-art',
    name: 'Julie Miller Art',
    url: 'https://juliemillerart.co.uk/',
    sector: 'Artist portfolio',
    // Scottish Borders, and the only client on this list outside Cornwall: the
    // same build, done at four hundred miles, with nothing about it that needed
    // the client to be nearby. Do not add a Cornwall mention here.
    location: 'Scottish Borders',
    featured: true,
    tags: ['Website'],
    plan: 'online',
    blurb:
      'A portfolio for an illustrator working in mixed media in the Scottish Borders, built ' +
      'four hundred miles from Picsel, where the landscape drives the work. The design stays ' +
      'quiet and gives the pieces space, because on an artist site the work is the interface ' +
      'and anything else is in the way.',
    alt: 'Screenshot of the Julie Miller Art website',
    related:
      'The same idea, that real work beats stock photography, is one of the points in ' +
      '<a href="/guides/what-a-trades-website-needs/">what a tradesperson\'s website needs</a>.' +
      planNote('A site this size sits on our <a href="/prices/#online">Online plan</a>.'),
    // A single monitor rather than a multi-device spread: the gallery grid is
    // the whole point of this site and a wide desktop screen is where it
    // reads best, so that is the one device shown. Dimensions are
    // mockup.webp's own, as tools/convert-photo.js printed them.
    mockup: {
      alt: 'The Julie Miller Art gallery grid shown on a desktop monitor',
      width: 1440,
      height: 1181,
    },
  },
  {
    slug: 'house-of-cornwall',
    name: 'House of Cornwall',
    url: 'https://houseofcornwall.live/',
    sector: 'Antiques & auctions',
    location: 'Hayle, Cornwall',
    featured: true,
    tags: ['Website'],
    plan: 'online',
    blurb:
      'Live clearance auctions broadcast from Hayle every week, selling antiques, retro ' +
      'pieces and curiosities from house clearances, with the next sale up front. The site ' +
      'also explains the format itself, since most visitors will not have come across a ' +
      'live clearance auction before.',
    alt: 'Screenshot of the House of Cornwall website',
    related:
      'A weekly live sale only works if people can find the business between broadcasts, and ' +
      'that depends on the same profile setup covered in ' +
      '<a href="/guides/google-business-profile-not-showing/">why is my Google Business ' +
      'Profile not showing up</a>.' +
      planNote('The site itself runs on our <a href="/prices/#online">Online plan</a>.'),
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
