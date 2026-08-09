/* ---- not-found.js — /404.html ----------------------------------------------
   CLAUDEseo section 2: AI assistants invent URLs and send people to pages that
   do not exist roughly three times more often than Google does. Whoever lands
   here typed a real question into a chat window and got a wrong address back,
   so this is a real visitor rather than a mistake to wave away.

   Cloudflare's asset handling serves this file for any request that matches
   no other route once wrangler.jsonc sets not_found_handling to "404-page", so
   it has to live at the site root as a bare file rather than in its own
   directory. tools/build.js special-cases a page.path ending in .html for
   exactly this page.

   Kept out of sitemap.xml and llms.txt the same way /contact/sent/ is: the
   excludeFromSitemap flag, and a noindex tag so a search engine that reaches
   this file some other way does not list it either. */

import { SITE } from '../../site.config.js';
import { escapeHtml } from '../templates/page.js';

/* The four routes worth sending a lost visitor to, in the order this
   audience decides in: see the work, check the price, read a guide, or ring.
   Reusing the footer's own list markup rather than inventing a second one,
   so this page needs no stylesheet of its own. */
const LINKS = [
  { href: '/work/', label: 'See the work' },
  { href: '/prices/', label: 'Check the prices' },
  { href: '/guides/', label: 'Read a guide' },
  { href: '/contact/', label: 'Send an enquiry' },
];

const LINK_ITEMS = LINKS.map(
  ({ href, label }) =>
    `              <li><a class="site-footer__link" href="${escapeHtml(href)}">${escapeHtml(label)}</a></li>`,
).join('\n');

const CONTENT = `    <section class="section contact-head">
      <div class="wrap page-head__text">
        <p class="eyebrow">Page not found</p>
        <h1>That page isn&rsquo;t here</h1>
        <p class="lede measure">
          The address you followed doesn&rsquo;t match a page on this site. It may have moved,
          or been typed wrong. Ring if that&rsquo;s quicker, or try one of these.
        </p>

        <div class="contact-band__actions">
          <a class="btn btn--primary" href="${escapeHtml(SITE.contact.phoneHref)}">${escapeHtml(SITE.contact.phoneDisplay)}</a>
        </div>

        <nav aria-label="Popular pages">
          <ul class="site-footer__list">
${LINK_ITEMS}
          </ul>
        </nav>
      </div>
    </section>`;

export const NOT_FOUND_PAGE = {
  path: '/404.html',
  title: 'Page not found | Picsel',
  description:
    "This page doesn't exist. See our work, check the prices, read a guide, or ring us direct. Websites and Google visibility for tradespeople across the UK.",
  excludeFromSitemap: true,
  extraHead: '  <meta name="robots" content="noindex, follow" />',
  content: CONTENT,
};
