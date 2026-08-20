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
   only appears in the homepage band.

   `rating` is out of five and every one of them is five, which is not a
   flattering coincidence: the profile's average is 5.0 across every review on
   it. It is a field rather than a constant because the first four-star review
   must show four stars, and a hard-coded five would show five and be a lie
   printed on the homepage. If one ever arrives, change the number here and the
   card follows.

   `subject` is the line under the name on the card: which business the person
   is from, or what the job was. It replaced the date, which used to sit there
   and was the wrong fact to lead with. "4 August 2026" tells a reader nothing
   about whether this review is relevant to them; "AJC Removals, removals and
   clearance" tells a removals firm they are reading about someone like
   themselves. Dates are still here and still sort the list, they are just not
   the thing on the card.

   Null subject means the card carries the name alone, which is correct for a
   private individual who left a first name and nothing else.

   DO NOT INVENT ONE TO TIDY THE LAYOUT. Three of these are real named people
   and this is a public page: a made-up job title under a real customer's name
   is a fabricated fact about somebody who did not agree to it, on the one
   section of the site whose entire worth is that a reader can go and check it.
   The cards line up because reviews.css reserves the row whether or not there
   is anything in it, which is a layout problem with a layout answer. Do not invent one.

   And do not repeat the name in it. "AJC Removals" over "AJC Removals,
   removals and clearance" is the same words twice on a card two lines tall;
   the subject's whole job is to add the fact the name does not carry.

   ---- CHECK BEFORE THE NEXT DEPLOY ------------------------------------------
   The bottom three came off the Google profile on 20 August 2026 and their
   text is exactly as posted. Two things about them are NOT verified:

     1. The dates are derived from Google's "3 days ago" and "a week ago", so
        they are within a day or two rather than exact. Nothing displays them,
        so the only thing they affect is the order of the cards.
     2. Google's own count says five reviews and only three were readable;
        "More reviews (2)" would not load. Whether the four above it are the
        older two plus two that Google is filtering, or something else, is
        worth Ben checking, because the section says out loud that every quote
        on it is on that profile word for word. */

export const REVIEWS = [
  {
    id: 'brenna-nevitt',
    rating: 5,
    subject: 'Custom eBay listing tool',
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
    rating: 5,
    subject: 'Lanora House, house clearance',
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
    rating: 5,
    subject: 'Artist portfolio',
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
    rating: 5,
    subject: null,
    author: 'Zoe',
    text:
      "Can't recommend Ben enough! Really happy with how my website turned out. I'd definitely " +
      'recommend him to anyone looking for a website in Edinburgh or surrounding areas!',
    date: '2026-08-09',
    source: 'google',
    service: 'websites-for-tradespeople',
    project: null,
  },
  {
    id: 'ajc-removals',
    rating: 5,
    author: 'AJC Removals',
    subject: 'Removals and clearance',
    text:
      'Really happy with the design of the website. Ben made it super quick to get it up and ' +
      'running and constantly checks in with us to see if we want anything updating. Really ' +
      'responsive to any messages ect.100% recommend',
    date: '2026-08-17',
    source: 'google',
    service: 'websites-for-tradespeople',
    project: 'ajc-removals',
  },
  {
    id: 'david-sanderson',
    rating: 5,
    author: 'David Sanderson',
    subject: null,
    text:
      'Really happy with the work from Picsel Design Studio - professional, quick to respond, and ' +
      'delivered exactly what we needed. Would definitely recommend.',
    date: '2026-08-13',
    source: 'google',
    service: 'websites-for-tradespeople',
    project: null,
  },
  {
    id: 'kyle-graham',
    rating: 5,
    author: 'Kyle Graham',
    subject: null,
    text:
      'Really great service, very efficient and cost effective. Website looks amazing! Would ' +
      'highly recommend',
    date: '2026-08-13',
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
