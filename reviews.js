/* ---- reviews.js — the Google reviews, verbatim -----------------------------
   Same job as projects.js and pricing.js: one place where a fact lives, so no
   page template ever types it.

   VERBATIM IS A HARD RULE HERE, and it is load-bearing rather than principled.
   findLocationClaims() in tools/build.js forgives place names by removing
   these exact strings from the rendered HTML before it scans. Edit a quote in
   a page template instead of here and the strings stop matching, the place
   name is scanned, and the build fails. That is the intended behaviour: the
   only text exempt from the rule is text that came from this file unaltered.

   So Matthew's "unbeliveable" and his doubled full stop stay. A testimonial
   that matches the source a reader can check in one click is worth more than a
   tidy one that does not.

   NO Review OR AggregateRating SCHEMA is generated from this file. Google's
   structured data guidelines exclude reviews about your own business that you
   collected and display yourself: the markup earns no rich result and risks a
   manual action. These render as visible quotes with a link to the profile,
   which is verifiable in a way a star rating in a SERP is not.

   `service` and `project` say which pages a review belongs on. Null means it
   only appears in the homepage band. */

export const REVIEWS = [
  {
    id: 'brenna-nevitt',
    author: 'Brenna Nevitt',
    text:
      'Ben at Picsel built us a custom eBay listing tool for our clearance business in Hayle. ' +
      'Listing stock used to eat a full afternoon, photographing everything then writing up items ' +
      "one at a time. Now it's done in minutes and nothing sits around unlisted. We're getting " +
      'three times as many items live each week and sales have followed. He understood exactly how ' +
      'our business runs and built the tool around it. If your company sells on eBay, get him to ' +
      'build you one.',
    date: '2026-08-04',
    source: 'google',
    service: 'custom-tools',
    project: null,
  },
  {
    id: 'matthew-pinch',
    author: 'Matthew Pinch',
    text:
      'Ben made our website from ok to unbeliveable , we saw increases in work very soon after. I ' +
      'am able to update it when I need to. Ben is very quick to make any changes. Really good ' +
      'value for money..',
    date: '2026-08-04',
    source: 'google',
    service: 'websites-for-tradespeople',
    project: 'lanora-house',
  },
  {
    id: 'julie-miller',
    author: 'Julie Miller',
    text:
      'I had my website designed by Picsel Design Studio, and the process was very straightforward ' +
      'from start to finish. Everything was handled very professionally, done quickly and very ' +
      'competitively priced.',
    date: '2026-08-04',
    source: 'google',
    service: 'websites-for-tradespeople',
    project: 'julie-miller-art',
  },
  {
    id: 'zoe',
    author: 'Zoe',
    text:
      "Can't recommend Ben enough! Really happy with how my website turned out. I'd definitely " +
      'recommend him to anyone looking for a website in Edinburgh or surrounding areas!',
    date: '2026-08-09',
    source: 'google',
    service: 'websites-for-tradespeople',
    project: null,
  },
];

/** Reviews attached to one service slug. */
export function reviewsForService(slug) {
  return REVIEWS.filter((review) => review.service === slug);
}

/** Reviews attached to one project slug. */
export function reviewsForProject(slug) {
  return REVIEWS.filter((review) => review.project === slug);
}
