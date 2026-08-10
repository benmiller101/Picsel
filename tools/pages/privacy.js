/* ---- privacy.js — /privacy --------------------------------------------------
   Written to be short, because the truth is short: one form, one company that
   relays it, one inbox, two font hosts, no cookies, no tracking beyond a
   cookie-free visit count. A privacy policy padded out with clauses that do
   not apply to a one-man studio would be a worse page than a shorter,
   accurate one.

   THE OPENING PARAGRAPH IS PART OF THE POLICY, NOT A TRAILER FOR IT. It said
   enquiry details "go straight to Ben, are never sold or shared" while the
   section three screens below said the enquiry travels through Web3Forms and
   may be processed outside the UK. Both cannot be true, and the summary is the
   part most readers actually read, so the page's most-read sentence was its
   least accurate one. That happened because the Web3Forms disclosure was added
   to the body and nobody went back up. Anything added below now has to be
   reflected here, or this paragraph starts lying again.

   THE FOUR THIRD PARTIES ARE ALL NAMED ON PURPOSE. Web3Forms relays the form,
   Cloudflare hosts the site and would count the visits, and every single page
   fetches its typefaces from Adobe and from Google, which hands both of them
   the reader's IP address before the page has finished painting. A policy that
   named the first two and not the second two was describing a different site
   from the one the reader was on. Self-hosting the Adobe faces is not the way
   out of the disclosure: the licence forbids it, and instructions-picsel-site.md
   says so in as many words.

   The cookie claim was re-checked against reality rather than carried over on
   trust, because adding two more third parties to the page is exactly the kind
   of change that quietly falsifies it. Every response from use.typekit.net,
   p.typekit.net, fonts.googleapis.com and fonts.gstatic.com, stylesheets and
   font files both, comes back with no Set-Cookie header at all. So "nothing
   sets a cookie" is still exactly true and stays, now stated as covering the
   other companies too rather than only Picsel's own code. Re-run that check
   before adding any third host.

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
        'use to relay it, and Web3Forms may process it outside the UK. Either way it lands as ' +
        'an email in Ben&rsquo;s inbox, nobody else sees it, and we only use it to reply to ' +
        'you. Want to know exactly where Web3Forms processes it? Ask, and we&rsquo;ll find ' +
        'out for you.',
    ],
  },
  {
    h2: "What we don't do with it",
    paragraphs: [
      'We don&rsquo;t sell your details. The only company that ever touches them is Web3Forms, ' +
        'and it touches them because that&rsquo;s how the message reaches Ben. Nobody buys them ' +
        'from us, nobody is handed them, and there&rsquo;s no mailing list for an enquiry to ' +
        'land you on. It sits in one inbox until we&rsquo;ve answered you.',
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
    h2: 'Where the lettering comes from',
    paragraphs: [
      'The type you&rsquo;re reading is served by Adobe and by Google, not by us, so opening ' +
        'any page here sends your IP address to both of them before the words appear. That ' +
        'happens whether or not you get as far as the form. It&rsquo;s the same request your ' +
        'browser makes to any website that uses hosted fonts, and neither company sets a ' +
        'cookie doing it or sends us anything that would tell us who you are.',
      'We can&rsquo;t avoid it by keeping copies of the files on our own server. The licence ' +
        'for the Adobe typefaces, the ones in the Picsel logo, doesn&rsquo;t allow that. If ' +
        'you&rsquo;d rather they didn&rsquo;t see you, a browser extension that blocks ' +
        'third-party fonts will stop the request. The site still reads fine without them.',
    ],
  },
  {
    h2: 'No cookies, so no banner',
    paragraphs: [
      'Nothing on this site sets a cookie: not us, not Cloudflare, not Adobe and not Google. ' +
        'That&rsquo;s the plain reason there&rsquo;s no banner, because there&rsquo;s nothing ' +
        'to accept. Any counting of visits happens through Cloudflare Web Analytics, which ' +
        'works without cookies and without collecting anything that identifies you personally. ' +
        'The site&rsquo;s hosted on Cloudflare too, so their servers see your IP address the ' +
        'same way Adobe&rsquo;s and Google&rsquo;s do.',
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
          This site doesn&rsquo;t set cookies, so there&rsquo;s nothing to consent to and no
          banner asking you to accept anything. Two things do leave your browser. Every page
          fetches its lettering from Adobe and Google, which means both of them see your IP
          address, and an enquiry reaches Ben&rsquo;s inbox through Web3Forms, the company that
          relays the form. Nobody else reads it, we never sell it or pass it on, and you can
          ask for a copy or ask us to delete it whenever you like.
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
    /* The button now does what the sentence beside it says. It used to open the
       enquiry form, on the one page whose copy tells you there isn't a form. */
    actionHref: `mailto:${SITE.contact.email}`,
    actionLabel: 'Email Ben',
  })].join('\n\n'),
};
