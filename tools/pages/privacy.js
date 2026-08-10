/* ---- privacy.js — /privacy --------------------------------------------------
   Written to be short, because the truth is short: one form, one third party
   that relays it, one inbox, no cookies, no tracking beyond a cookie-free
   visit count. A privacy policy padded out with clauses that do not apply to
   a one-man studio would be a worse page than a shorter, accurate one.

   Follows the shape of contact.js, the page whose form this policy describes:
   the same breadcrumbs pattern, the same reliance on site.config.js for every
   fact that could otherwise drift out of sync with the page it is describing.

   THE ANALYTICS WORDING IS DELIBERATE. SITE.analytics.tokenIsPlaceholder is
   still true at the time this page is written, so the Cloudflare beacon does
   not render and no visit is currently being counted. The paragraph below is
   worded so it stays true either way: it describes what counting a visit
   would involve rather than asserting that one is happening right now. When
   the real token is pasted in, nothing here needs to change. */

import { SITE } from '../../site.config.js';
import { escapeHtml } from '../templates/page.js';
import { breadcrumbs } from '../templates/schema.js';
import { renderBreadcrumbs } from '../partials/breadcrumbs.js';
import { renderArticleSections } from '../partials/article-sections.js';
import { renderContactBand } from '../partials/contact-band.js';
import { PAGE_BLOB, PAGE_BLOB_SCRIPT } from '../partials/page-blob.js';

/* Declared once, ahead of the schema block below, so the visible trail and
   the JSON-LD cannot describe two different pages. */
const PRIVACY_TRAIL = [
  { name: 'Home', path: '/' },
  { name: 'Privacy', path: '/privacy/' },
];

/* Reuses the 'guide' class prefix rather than inventing a fourth one. article.css
   already styles .guide__section, .guide__inner and .guide__question for
   exactly this shape of page: a heading, an opening answer set off with the
   accent rule, and a run of h2 sections underneath. A privacy policy is
   long-form reading in the same sense a guide is, so it gets the same sheet
   instead of a new stylesheet built to say the same thing again. */
const SECTIONS = [
  {
    h2: 'If you send us an enquiry',
    paragraphs: [
      'The form on our <a href="/contact/">contact page</a> asks for your name, your email ' +
        'address, your phone number if you want to give it, what you need help with, how you ' +
        'heard about us if you say, and your message. It goes through Web3Forms, a company we ' +
        'use to relay it, and lands as an email in Ben&rsquo;s inbox. Nobody else sees it, and ' +
        'we only use it to reply to you.',
    ],
  },
  {
    h2: "What we don't do with it",
    paragraphs: [
      'We don&rsquo;t sell your details or hand them to anyone else, and there&rsquo;s no ' +
        'mailing list for an enquiry to land you on. It sits in one inbox until we&rsquo;ve ' +
        'answered you.',
    ],
  },
  {
    h2: 'How long we keep it',
    paragraphs: [
      'If an enquiry doesn&rsquo;t turn into a job, we delete it within 12 months. If it does, ' +
        'we keep what we need for as long as we&rsquo;re working together, then delete it once ' +
        'the job&rsquo;s finished.',
    ],
  },
  {
    h2: 'No cookies, so no banner',
    paragraphs: [
      'Nothing on this site sets a cookie, which is the plain reason there&rsquo;s no banner: ' +
        'there&rsquo;s nothing to accept. Any counting of visits happens through Cloudflare Web ' +
        'Analytics, which works without cookies and without collecting anything that identifies ' +
        'you personally. The site&rsquo;s hosted on Cloudflare too.',
    ],
  },
  {
    h2: 'Ask for a copy, or ask us to delete it',
    paragraphs: [
      `Email <a href="mailto:${escapeHtml(SITE.contact.email)}">${escapeHtml(SITE.contact.email)}</a> ` +
        'and ask, any time. We&rsquo;ll tell you what we hold, send you a copy of it, or delete ' +
        'it, whichever you&rsquo;d rather.',
    ],
  },
];

/* The text is wrapped rather than sitting loose in the inner, for the same
   reason contact.js wraps its own: the blob beside it makes the inner a
   two-column grid on a desktop, and without the wrapper the eyebrow and the
   heading would each become a grid item and lay themselves out in a row. */
const HEAD = `${renderBreadcrumbs(PRIVACY_TRAIL)}

    <section class="section contact-head">
      <div class="wrap page-head">
        <div class="page-head__text">
          <p class="eyebrow">Privacy</p>
          <h1>What happens to your details</h1>
        </div>

${PAGE_BLOB}
      </div>
    </section>`;

const MAIN = `    <article class="section guide">
      <div class="wrap guide__inner">
        <p class="guide__answer">
          This site doesn&rsquo;t use cookies, so there&rsquo;s nothing to consent to and no
          banner asking you to accept anything. If you send an enquiry, your details go
          straight to Ben, are never sold or shared, and you can ask for a copy of them or
          ask us to delete them at any time.
        </p>

${renderArticleSections(SECTIONS, 'guide')}
      </div>
    </article>`;

export const PRIVACY_PAGE = {
  path: '/privacy/',
  schemaExtra: [
    breadcrumbs(PRIVACY_TRAIL),
  ],
  title: 'What happens to your details | Picsel',
  description:
    'What Picsel does with your enquiry details: what the form collects, where it goes, how long we keep it, and how to get a copy or ask us to delete them.',
  styles: ['/contact.css', '/article.css'],
  extraScripts: PAGE_BLOB_SCRIPT,
  content: [HEAD, MAIN, renderContactBand({
    heading: 'Question about your details?',
    body: 'Email us and we&rsquo;ll answer directly. There&rsquo;s no form to fill in for this one.',
  })].join('\n\n'),
};
