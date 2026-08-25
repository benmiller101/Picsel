/* ---- privacy.js — /privacy --------------------------------------------------
   Written to be short, because the truth is short: one form, one company that
   relays it, one inbox, one font host, no cookies, no tracking beyond a
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
   Cloudflare hosts the site and counts the visits, Adobe serves the wordmark
   faces, and Google runs the tag that counts visits a second time. Each one
   gets the reader's IP address, three of them before the page has finished
   painting. A policy that named some of them was describing a different site
   from the one the reader was on.

   WHY GOOGLE IS NAMED HAS CHANGED, AND THE PAGE HAD NOT CAUGHT UP. It used to
   be named as a font host, because Lexend and Pixelify Sans were fetched from
   fonts.googleapis.com. Both faces are Open Font Licence, both now come off
   this origin, and tools/fetch-fonts.js is what moved them. So the sentence
   saying the lettering comes from Adobe AND Google outlived the request it was
   describing: it stayed on the page for weeks naming a company the reader's
   browser no longer spoke to for that reason. Google belongs on this page for
   analytics and the tag manager instead, which is where it is now.

   The Adobe half of that sentence stays, and self-hosting is not the way out
   of it: the licence for those faces forbids it, and instructions-picsel-site.md
   says so in as many words. Check the built pages, not this comment, before
   trusting either half again.

   The cookie claim is re-checked against reality rather than carried over on
   trust, because a new third party on the page is exactly the kind of change
   that quietly falsifies it. Every response from use.typekit.net and
   p.typekit.net, stylesheets and font files both, and every response from
   www.googletagmanager.com, which now means gtm.js, gtag.js and the ns.html
   frame, comes back with no Set-Cookie header at all. So "nothing sets a
   cookie" is still exactly true and stays, stated as covering the other
   companies rather than only Picsel's own code.

   RE-RUN THAT CHECK BEFORE ADDING ANY HOST, and note that for Google it is
   only half the check. GA4 writes its cookie from JavaScript, not from a
   Set-Cookie header, so a clean response proves nothing on its own. The other
   half is the consent default and client_storage in tools/templates/page.js,
   described below.

   Follows the shape of contact.js, the page whose form this policy describes:
   the same breadcrumbs pattern, the same reliance on site.config.js for every
   fact that could otherwise drift out of sync with the page it is describing.

   THE ANALYTICS WORDING IS DELIBERATE, AND IT HAS CHANGED ONCE ALREADY. It
   used to describe what counting a visit *would* involve, because the
   Cloudflare token was a placeholder and nothing was being counted. Both
   counters are live now and the section says so outright.

   The cookie claim survives Google Analytics only because of how the tag is
   configured in tools/templates/page.js: consent mode denies every storage
   type before the config call runs, and the config sets client_storage to
   none, so no _ga cookie is ever written. THAT CONFIGURATION IS WHAT THIS
   PAGE IS PROMISING. Anyone who removes those lines, or pastes the plain
   three-line snippet from the GA4 setup screen over the top of them, breaks a
   published privacy policy and lands the site the wrong side of PECR at the
   same time. The wording here names the storage decision instead of hiding
   behind a bare "no cookies", so a reader who knows what GA4 normally does
   has something to check rather than a claim to disbelieve. */

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
      /* This used to promise deletion within 12 months, a number nobody had
         decided. Ben's answer was that enquiries stay in the inbox while there
         is a reason to keep them and go when somebody asks, so that is what it
         says now.

         Less tidy than a number and considerably more useful, because it stays
         true without anybody doing yearly housekeeping. A published deletion
         deadline that nobody keeps is a broken promise sitting on the one page
         whose entire job is being true. */
      'Your enquiry stays in Ben&rsquo;s inbox while there&rsquo;s a reason to keep it: while ' +
        'we&rsquo;re talking, while the job is on, and after it in case you come back. Ask us to ' +
        'delete it and we will.',
    ],
  },
  {
    h2: 'Where the lettering comes from',
    paragraphs: [
      'Nearly all of it comes off our own server. The lettering in the Picsel logo ' +
        'doesn&rsquo;t. That&rsquo;s served by Adobe, so opening any page here sends your IP ' +
        'address to Adobe before the words appear, whether or not you get as far as the form. ' +
        'It&rsquo;s the same request your browser makes to any site that uses hosted fonts, ' +
        'and Adobe doesn&rsquo;t set a cookie doing it or send us anything that would tell us ' +
        'who you are.',
      'The reading type used to come from Google the same way. It doesn&rsquo;t now: those ' +
        'files sit on this server, so that request has gone. We can&rsquo;t do the same with ' +
        'the Adobe faces, because the licence for them doesn&rsquo;t allow it. If you&rsquo;d ' +
        'rather Adobe didn&rsquo;t see you, a browser extension that blocks third-party fonts ' +
        'will stop the request. The site still reads fine without them.',
    ],
  },
  {
    h2: 'No cookies, so no banner',
    paragraphs: [
      'Nothing on this site sets a cookie: not us, not Cloudflare, not Adobe and not Google. ' +
        'That&rsquo;s the plain reason there&rsquo;s no banner, because there&rsquo;s nothing ' +
        'to accept.',
      /* The claim above is only true because of how the tag is configured, so
         the sentence that follows has to say so. A reader who knows what GA4
         normally does will not believe a bare "no cookies" on a page that also
         admits to running it. */
      'Two things count visits here. Cloudflare Web Analytics works without cookies by ' +
        'design. Google Analytics normally doesn&rsquo;t, so we&rsquo;ve set it up to store ' +
        'nothing on your device: no cookie, nothing kept between one visit and the next. It ' +
        'costs us the ability to tell a returning visitor from a new one. We&rsquo;d rather ' +
        'lose that than put a banner in front of you. Google still sees your IP address when ' +
        'the tag loads, and the tag reaches the page through Google Tag Manager, which is the ' +
        'same company and stores nothing on your device either.',
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
          banner asking you to accept anything. Three things do leave your browser. Every page
          fetches the logo lettering from Adobe, which means Adobe sees your IP address.
          Visits are counted by Cloudflare and by Google Analytics, both set up to
          store nothing on your device. And an enquiry reaches Ben&rsquo;s inbox through
          Web3Forms, the company that relays the form. Nobody else reads it, we never sell it
          or pass it on, and you can ask for a copy or ask us to delete it whenever you like.
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
