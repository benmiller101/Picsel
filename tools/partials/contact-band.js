/* ---- contact-band.js — the closing band on every page ---------------------
   The plan asks for this at the foot of the homepage, the work index and every
   project page, so that contact is never more than one obvious click away.
   That is the whole reason it is a partial: repeated markup is repeated
   maintenance, and the one thing on this site that must never rot is the phone
   number.

   Both routes are offered on purpose. The audience is trades and small
   businesses, often reading between jobs — some will ring, some would rather
   type and get on with their day. Contact details come from site.config.js, so
   the number here is the same number in the footer and in the schema. */

import { SITE } from '../../site.config.js';
import { escapeHtml } from '../templates/page.js';

/**
 * @param {object} [options]
 * @param {string} [options.heading]  Override the heading for a specific page.
 * @param {string} [options.body]     Override the sentence under it.
 */
export function renderContactBand({
  heading = 'Thinking about a site?',
  body = 'Tell us what your business does and what you want the site to do, and we&rsquo;ll tell you what&rsquo;s involved. Plain English, and no obligation.',
} = {}) {
  return `    <section class="contact-band" aria-labelledby="contact-band-heading">
      <div class="wrap contact-band__inner">
        <div class="contact-band__words">
          <h2 class="contact-band__heading" id="contact-band-heading">${heading}</h2>
          <p class="contact-band__body">${body}</p>
        </div>

        <div class="contact-band__actions">
          <a class="btn btn--primary" href="/contact/#enquiry">Get in touch</a>
          <!-- Written out in full rather than hidden behind "call us": on a
               phone it dials, and on a desktop it is the number itself, which
               is what someone with a landline in their hand needs to see. -->
          <a class="contact-band__phone" href="${escapeHtml(SITE.contact.phoneHref)}">
            ${escapeHtml(SITE.contact.phoneDisplay)}
          </a>
        </div>
      </div>
    </section>`;
}
