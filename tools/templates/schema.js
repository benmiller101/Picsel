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
   Organization, deliberately NOT LocalBusiness.

   LocalBusiness and ProfessionalService are physical-premises types: their
   whole point is an address and opening hours that put a pin on a map. Picsel
   has neither, and inventing a street address to satisfy a schema type would be
   exactly the fabrication this file exists to avoid.

   That was already true when the studio was in Cornwall. It is the only
   defensible option now that it is not: a LocalBusiness node is a claim to be
   local to somewhere, and there is no somewhere. Organization says what is
   true, which is a UK business reachable on this number.

   The note here used to say "upgrade to ProfessionalService when there is a
   real address to declare". That upgrade is now off the table rather than
   pending. Picsel serves the whole country and has no premises a customer would
   ever visit, so there will not be an address to declare, and a type that
   implies one would be wrong in a new way. */
function organization() {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SITE.name,
    legalName: SITE.legalName,
    url: absoluteUrl('/'),
    description: SITE.description,

    /* Country, not AdministrativeArea. This used to name a county, which told a
       crawler the business was a Cornwall business and was the machine-readable
       half of a claim now removed from every page. The whole country is both
       true and the wider net, and Country is the type that says it without
       implying a premises inside it. */
    areaServed: {
      '@type': 'Country',
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

    /* sameAs: the three live social accounts, from site.config.js. This is the
       tag that tells a search engine the Facebook page, the Instagram account,
       the TikTok account and this site are one business rather than four
       things with similar names, which is the same entity-consistency argument
       the phone number gets.

       Still conditional. If socialProfiles is ever emptied, the key disappears
       rather than rendering as [], because an empty sameAs claims the business
       was checked and has no profiles, which is a different and worse thing to
       say than nothing. */
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

/* ---- The blog -------------------------------------------------------------
   Guides carry FAQPage, because a guide is a question and its answer and that
   is the shape an assistant wants. A post is not that. It is dated, it has an
   argument, and the useful thing to declare about it is when it was written and
   who by.

   Author and publisher are both the Organization rather than a Person node.
   Inventing a Person means inventing the fields that make one worth having, and
   the studio is one man whose name is already on the Organization. */
export function blogPosting({ headline, description, path, datePublished }) {
  return {
    '@type': 'BlogPosting',
    '@id': `${absoluteUrl(path)}#post`,
    headline,
    description,
    datePublished,
    url: absoluteUrl(path),
    mainEntityOfPage: absoluteUrl(path),
    author: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    isPartOf: { '@id': `${absoluteUrl('/blog/')}#blog` },
  };
}

/* The Blog itself, on the index. Each post is referenced by @id rather than
   restated, so a crawler reading both pages sees one post described once. */
export function blogNode(posts) {
  return {
    '@type': 'Blog',
    '@id': `${absoluteUrl('/blog/')}#blog`,
    name: `${SITE.name} blog`,
    url: absoluteUrl('/blog/'),
    publisher: { '@id': ORG_ID },
    blogPost: posts.map((post) => ({
      '@type': 'BlogPosting',
      '@id': `${absoluteUrl(post.path)}#post`,
      headline: post.headline,
      url: absoluteUrl(post.path),
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
