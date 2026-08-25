/* ---- client-results.js — the client numbers a post is allowed to quote -----
   Same job as pricing.js, for results instead of money.

   These three figures lived as prose inside one sentence in blog.js, with no
   source of truth and nothing checking them. That was survivable while the
   sentence was buried in the fourth paragraph of the fifth section. It stops
   being survivable the moment one of them is set at display size, which is
   what this file exists for.

   THE DATE IS THE POINT. A review count is true on a day and drifts after it.
   A figure with a date attached can be re-checked by anyone; a figure without
   one can only be believed or doubted. `checked` is rendered nowhere and is
   not decoration: it is the answer to "is this still right", and the answer is
   "it was on this date, go and look".

   WHAT MAY GO IN HERE. The same rule blog.js applies to itself: a number
   belongs here only if a stranger could check it from a public page. A review
   count on a public Google listing qualifies. Anything from an analytics
   dashboard nobody else can open does not, however true it is. */

export const LANORA_REVIEWS = {
  client: 'Lanora House',
  before: 18,
  after: 36,
  months: 2,
  today: 38,
  rating: 'five stars',
  /* Verified 9 August 2026 for the original post, re-read 25 August 2026. */
  checked: '2026-08-25',
};
