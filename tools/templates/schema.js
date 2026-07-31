/* ---- schema.js — the JSON-LD every page carries ---------------------------
   Structured data is the machine-readable version of what the page already
   says in words. Search engines and AI assistants both read it, and Picsel
   sells SEO, so its own site has to model the thing it sells.

   The rule that governs everything below: SCHEMA NEVER CLAIMS ANYTHING THE
   PAGE DOES NOT. Every value here is read from site.config.js or projects.js,
   which are the same two files the visible copy is built from. Invented
   ratings, made-up opening hours and fictional addresses are the standard way
   this markup goes wrong, and they are the exact class of claim the plan's
   Positioning Boundaries already forbid.

   Rendered into <head> by page.js on every page, so it cannot be forgotten on
   page nine. */

import { SITE, absoluteUrl } from '../../site.config.js';

/* Stable identifiers, so the Organization is described once and everything
   else points at it. Without @id, each page would restate the whole business
   and a crawler would have to guess whether nine descriptions are nine
   businesses or one. */
export const ORG_ID = `${SITE.origin}/#organization`;
export const SITE_ID = `${SITE.origin}/#website`;

/* ---- The studio ----------------------------------------------------------
   Organization, deliberately NOT LocalBusiness or ProfessionalService.

   Both of those are physical-premises types: their whole point is an address
   and opening hours that put a pin on a map. Picsel has neither yet, and
   inventing a street address to satisfy a schema type would be exactly the
   fabrication this file exists to avoid. Organization says what is true today
   — a business, in Cornwall, reachable on this number.

   Upgrade to ProfessionalService in Section 15, when the Google Business
   Profile exists and there is a real address and a real service area to
   declare. */
function organization() {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SITE.name,
    legalName: SITE.legalName,
    url: absoluteUrl('/'),
    description: SITE.description,

    /* Named as a place rather than a postal address: it is where the work is
       done from and where the clients are, which is the true and useful
       version of the claim. */
    areaServed: {
      '@type': 'AdministrativeArea',
      name: SITE.areaServed,
    },

    /* The same number and address the footer shows on every page, read from
       the same constant. Entity consistency is a GEO requirement, and the way
       to guarantee it is to have one copy of the fact. */
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      telephone: SITE.contact.phoneHref.replace(/^tel:/, ''),
      email: SITE.contact.email,
      areaServed: 'GB',
      availableLanguage: 'English',
    },

    /* sameAs is omitted rather than empty. socialProfiles is deliberately an
       empty list in site.config.js — Picsel has no public profiles yet — and
       an empty sameAs array tells a crawler the business has been checked and
       has none, which is a different and less useful claim than saying
       nothing. Populate site.config.js and this appears on its own. */
    ...(SITE.socialProfiles.length ? { sameAs: SITE.socialProfiles } : {}),
  };
}

/* ---- The site itself ------------------------------------------------------
   One WebSite node, published by the Organization above. This is what lets a
   crawler treat all nine pages as one property rather than nine loose
   documents. */
function website() {
  return {
    '@type': 'WebSite',
    '@id': SITE_ID,
    url: absoluteUrl('/'),
    name: SITE.name,
    description: SITE.description,
    publisher: { '@id': ORG_ID },
    inLanguage: 'en-GB',
  };
}

/* ---- This page ------------------------------------------------------------
   The per-page node. `type` lets a page declare something more specific than
   WebPage where that is true — ContactPage for /contact/, CollectionPage for
   the work index — because those types tell a crawler what the page is FOR,
   not merely that it exists. */
function webPage({ path, title, description, type = 'WebPage', ogImage, about }) {
  const canonical = absoluteUrl(path);

  return {
    '@type': type,
    '@id': `${canonical}#webpage`,
    url: canonical,
    name: title,
    description,
    isPartOf: { '@id': SITE_ID },
    /* What the page is ABOUT, which is not always the studio. The homepage and
       the contact page are about Picsel; a project page is about the client's
       site, and pointing it at the Organization instead would attach that
       client's page to Picsel's own description and area served. That matters
       most on the Julie Miller Art page, where the studio's "in Cornwall" would
       be the only Cornwall claim anywhere near a Scottish Borders project. */
    about: about || { '@id': ORG_ID },
    inLanguage: 'en-GB',
    ...(ogImage ? { primaryImageOfPage: { '@type': 'ImageObject', url: absoluteUrl(ogImage) } } : {}),
  };
}

/* ---- Breadcrumbs ----------------------------------------------------------
   Only where there is a real hierarchy to describe: a project page genuinely
   sits under /work/, which genuinely sits under the homepage. The homepage
   gets none, because a breadcrumb trail of one item describes nothing.

   Not in the plan's checklist, and included because it is ordinary SEO
   infrastructure rather than an extra: Google renders these in the result
   itself, so a project page shows its place in the site instead of a bare URL. */
export function breadcrumbs(trail) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

/**
 * The JSON-LD block for one page, as a ready-to-inject <script> tag.
 *
 * @param {object}   page
 * @param {string}   page.path
 * @param {string}   page.title
 * @param {string}   page.description
 * @param {string}  [page.schemaType]   More specific than WebPage where true.
 * @param {object[]}[page.schemaExtra]  Extra nodes, e.g. the client's WebSite.
 * @param {string}  [page.ogImage]
 * @returns {string}
 */
export function renderSchema(page) {
  const graph = [
    organization(),
    website(),
    webPage({
      path: page.path,
      title: page.title,
      description: page.description,
      type: page.schemaType,
      ogImage: page.ogImage,
      about: page.schemaAbout,
    }),
    ...(page.schemaExtra || []),
  ];

  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2);

  /* Escaping that matters: a literal "</script>" anywhere inside the JSON —
     in a blurb, a name, a URL — would close this tag early and dump the rest
     of the data into the page as markup. Escaping the angle bracket as <
     is still valid JSON and still parses identically, and it makes that
     impossible regardless of what any future blurb contains. */
  const safe = json.replace(/</g, '\\u003c');

  return `  <script type="application/ld+json">\n${safe}\n  </script>`;
}
