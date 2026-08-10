/* ---- sticky-cta.js — the mobile action bar --------------------------------
   Below 768px only. On a phone the contact band is a long scroll away for most
   of a guide, and the audience reads it between jobs, so the two ways to reach
   Picsel are pinned to the bottom of the screen instead.

   Two things it must not do, both of which are how this pattern usually goes
   wrong: cover the thing it is pointing at, and cover the footer. sticky-cta.js
   in the repo root watches the contact band and the enquiry form and hides the
   bar while either is on screen; site.css gives the footer bottom padding equal
   to the bar's height so the bar never sits over the last line either.

   Ships hidden. Without JavaScript the bar never appears, which is the correct
   fallback here, not a compromise: it is a shortcut to content that already has
   a route on every page (the footer's phone number, the contact-band's "Get in
   touch"), so a visitor who never gets this bar loses a convenience, not a
   destination. */

import { SITE } from '../../site.config.js';
import { escapeHtml } from '../templates/page.js';

export function renderStickyCta() {
  return `  <div class="sticky-cta" data-sticky-cta hidden>
    <a class="sticky-cta__call" href="${escapeHtml(SITE.contact.phoneHref)}">Call ${escapeHtml(SITE.contact.phoneDisplay)}</a>
    <a class="sticky-cta__enquire" href="/contact/#enquiry">Enquire</a>
  </div>`;
}
