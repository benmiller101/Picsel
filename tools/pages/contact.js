/* ---- contact.js — /contact and /contact/sent ------------------------------
   The page the whole site points at. Every contact band, both nav routes and
   the footer lead here, so this is where an enquiry either happens or is lost.

   Two ways to make contact, and the order matters. The audience is trades and
   small businesses, mostly on a phone, often between jobs — a good number of
   them will ring and never look at a form. So the phone number comes FIRST in
   the markup, which means first on a phone screen, and the form sits after it
   for the people who would rather type at nine in the evening.

   There is no server behind this site. The form posts to Web3Forms, which
   receives it and emails it on; contact.js in the site root upgrades that to an
   inline send so nobody is thrown off the page. With JavaScript off the same
   form still submits as an ordinary HTML post and lands on /contact/sent/. */

import { SITE, SHOW_PRICING, absoluteUrl } from '../../site.config.js';
import { escapeHtml } from '../templates/page.js';
import { breadcrumbs } from '../templates/schema.js';
import { renderBreadcrumbs } from '../partials/breadcrumbs.js';
import { PAGE_BLOB, PAGE_BLOB_SCRIPT } from '../partials/page-blob.js';

/* Declared once, ahead of HEAD below and CONTACT_PAGE.schemaExtra, so the
   visible trail and the JSON-LD cannot describe two different pages. */
const CONTACT_TRAIL = [
  { name: 'Home', path: '/' },
  { name: 'Contact', path: '/contact/' },
];

/* ---- The direct details ---------------------------------------------------
   A real definition list: each of these is a label and its value, which is
   exactly what a <dl> is for. A stack of divs would look identical and tell
   someone listening to the page nothing about which line belongs to which.

   Every value comes from site.config.js. The phone number on this page is the
   same string as the one in the footer, the contact band and — from Section 9 —
   the schema, because there is only one copy of it anywhere. */
const DIRECT = `        <div class="contact-direct">
          <h2 class="visually-hidden">How to reach us</h2>

          <dl class="contact-direct__list">
            <div class="contact-direct__row">
              <dt class="eyebrow">Ring</dt>
              <dd>
                <a class="contact-direct__phone" href="${escapeHtml(SITE.contact.phoneHref)}">${escapeHtml(SITE.contact.phoneDisplay)}</a>
                <p class="contact-direct__note">
                  If we don&rsquo;t pick up we&rsquo;re on a job. Leave a message and we&rsquo;ll ring you back.
                </p>
              </dd>
            </div>

            <div class="contact-direct__row">
              <dt class="eyebrow">Email</dt>
              <dd>
                <a class="contact-direct__email" href="mailto:${escapeHtml(SITE.contact.email)}">${escapeHtml(SITE.contact.email)}</a>
              </dd>
            </div>

            <!-- This row used to name the county and the nearest town. The
                 question a customer is actually asking under a heading like
                 that is not where the office is, it is whether being three
                 hundred miles away is a problem, so the row answers that
                 instead. Nothing here names a place. The studio works anywhere
                 and is about to move, and a town buried in a contact page is
                 the last place anyone would think to check.

                 The old wording is deliberately not quoted here either: an
                 HTML comment ships to the browser, so a place name in one is
                 still a place name on the page, and the build check in
                 tools/build.js counts it. -->
            <div class="contact-direct__row">
              <dt class="eyebrow">Where we work</dt>
              <dd>
                <p class="contact-direct__note">
                  Anywhere in the UK. The whole job is done by phone and email wherever you are,
                  including <a href="/work/julie-miller-art/">a portfolio built four hundred
                  miles away</a> in the Scottish Borders.
                </p>
              </dd>
            </div>
          </dl>
        </div>`;

/* ---- The enquiry select ---------------------------------------------------
   The plan's four options, written the way the person filling the form would
   say them rather than the way a services page lists them. Someone who wants to
   be found on Google does not think of it as "SEO & GEO" — that is our word for
   it, and a form is a bad place to make someone translate.

   The `value` keeps the short internal word, so the email that arrives is
   scannable; the label is what the visitor reads. */
const NEEDS = [
  { value: 'Website', label: 'A new website' },
  { value: 'Search', label: 'Getting found on Google' },
  { value: 'Automation', label: 'A tool to save me time' },
  { value: 'Other', label: 'Something else' },
];

const NEED_OPTIONS = NEEDS.map(
  ({ value, label }) => `                <option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`,
).join('\n');

/* ---- Where the enquiry came from ------------------------------------------
   The measurement rules ask for this because an AI-driven enquiry does not
   look like one. Someone asks an assistant for a website studio, hears the
   name, and types it into the address bar later that evening. That arrives in
   the analytics as direct traffic, indistinguishable from someone who already
   knew the name, so asking is the only way to find out it happened at all.

   Optional, and deliberately not `required`: a field nobody has to fill in
   costs nothing, and a required one on an enquiry form costs enquiries. The
   AI option is named the way someone would actually say it, not "LLM" or
   "generative AI". */
const SOURCES = [
  { value: '', label: 'Prefer not to say' },
  { value: 'Google', label: 'Google search' },
  { value: 'AI assistant', label: 'Asked ChatGPT, Gemini or another AI assistant' },
  { value: 'Recommendation', label: 'Someone recommended you' },
  { value: 'Social media', label: 'Facebook, Instagram or TikTok' },
  { value: 'Other', label: 'Something else' },
];

const SOURCE_OPTIONS = SOURCES.map(
  ({ value, label }) =>
    `                <option value="${escapeHtml(value)}"${value === '' ? ' selected' : ''}>${escapeHtml(label)}</option>`,
).join('\n');

/* ---- The form -------------------------------------------------------------
   Ordinary HTML, working on its own before a line of script runs: a real
   action, a real method, real <label>s and native `required` validation. The
   browser's own validation messages are used rather than a hand-rolled set —
   they are translated, they are announced by screen readers, and they appear on
   the field that is actually wrong.

   `redirect` is the no-JavaScript path: without it a plain post lands on
   Web3Forms' own branded confirmation page, which is a jarring place to send
   someone from a site like this. With JavaScript, contact.js strips that field
   back out and sends the form in the background instead. */
function renderForm() {
  return `        <section class="enquiry" id="enquiry" aria-labelledby="enquiry-heading">
          <h2 class="enquiry__heading" id="enquiry-heading">Or send us the details</h2>
          <p class="enquiry__lede">
            Tell us what your business does and what you want the site to do. We&rsquo;ll come back
            with what&rsquo;s involved and what it would cost.${
              SHOW_PRICING
                ? ' If you&rsquo;d rather see the numbers first, they&rsquo;re on the <a href="/prices/">prices page</a>.'
                : ''
            }
          </p>

          <form class="enquiry-form"
                id="enquiry-form"
                action="${escapeHtml(SITE.form.endpoint)}"
                method="POST">
            <input type="hidden" name="access_key" value="${escapeHtml(SITE.form.accessKey)}" />
            <input type="hidden" name="subject" value="${escapeHtml(SITE.form.subject)}" />
            <input type="hidden" name="from_name" value="${escapeHtml(SITE.name)} website" />
            <input type="hidden" name="redirect" value="${escapeHtml(absoluteUrl('/contact/sent/'))}" />

            <!-- The honeypot. A field no person can see, so anything that fills
                 it in is a script; Web3Forms rejects the submission when this
                 checkbox arrives ticked. Hidden off-screen rather than with
                 display:none, taken out of the tab order, and hidden from
                 assistive technology, so nobody using a keyboard or a screen
                 reader can trip it by accident. -->
            <label class="enquiry-form__botcheck" aria-hidden="true">
              Leave this box unticked
              <input type="checkbox" name="botcheck" tabindex="-1" autocomplete="off" />
            </label>

            <div class="field">
              <label class="field__label" for="enquiry-name">Your name</label>
              <input class="field__input"
                     id="enquiry-name"
                     name="name"
                     type="text"
                     autocomplete="name"
                     required />
            </div>

            <div class="field">
              <label class="field__label" for="enquiry-email">Email</label>
              <input class="field__input"
                     id="enquiry-email"
                     name="email"
                     type="email"
                     autocomplete="email"
                     required />
            </div>

            <div class="field">
              <label class="field__label" for="enquiry-phone">
                Phone <span class="field__optional">optional</span>
              </label>
              <!-- type="tel" so a phone shows the number keypad. inputmode is
                   belt and braces for the browsers that ignore it. -->
              <input class="field__input"
                     id="enquiry-phone"
                     name="phone"
                     type="tel"
                     inputmode="tel"
                     autocomplete="tel"
                     aria-describedby="enquiry-phone-hint" />
              <p class="field__hint" id="enquiry-phone-hint">Worth adding if you&rsquo;d rather we rang you.</p>
            </div>

            <div class="field">
              <label class="field__label" for="enquiry-need">What do you need?</label>
              <select class="field__input field__select" id="enquiry-need" name="need" required>
                <!-- An empty value, plus required on the select, is what makes
                     the browser treat this prompt as "nothing chosen yet"
                     rather than as an answer. -->
                <option value="" selected disabled>Choose one</option>
${NEED_OPTIONS}
              </select>
            </div>

            <div class="field">
              <label class="field__label" for="enquiry-source">
                How did you hear about us? <span class="field__optional">optional</span>
              </label>
              <select class="field__input field__select" id="enquiry-source" name="source">
${SOURCE_OPTIONS}
              </select>
            </div>

            <div class="field">
              <label class="field__label" for="enquiry-message">What&rsquo;s the job?</label>
              <textarea class="field__input field__textarea"
                        id="enquiry-message"
                        name="message"
                        rows="6"
                        aria-describedby="enquiry-message-hint"
                        required></textarea>
              <!-- Deliberately not repeating the instruction above the form.
                   It said what to write; saying it again under the box is the
                   same sentence twice on one screen. -->
              <p class="field__hint" id="enquiry-message-hint">A couple of lines is plenty.</p>
            </div>

            <div class="enquiry-form__foot">
              <button class="btn btn--primary" type="submit">Send enquiry</button>
              <p class="enquiry-form__privacy">
                We use these details to reply to you and nothing else.
              </p>
            </div>

            <!-- Where the inline result appears once JavaScript takes the send
                 over. role="status" announces it without interrupting whatever
                 a screen reader is in the middle of saying; tabindex lets the
                 script move focus here, since resetting the form throws focus
                 back to the top of the document otherwise. -->
            <p class="enquiry-form__status" id="enquiry-status" role="status" aria-live="polite" tabindex="-1"></p>
          </form>
        </section>`;
}

/* The text is wrapped rather than sitting loose in the inner, because the blob
   beside it makes the inner a two-column grid on a desktop — without the
   wrapper the eyebrow, the heading and the lede would each become a grid item
   and lay themselves out in a row. */
const HEAD = `${renderBreadcrumbs(CONTACT_TRAIL)}

    <section class="section contact-head">
      <div class="wrap page-head">
        <div class="page-head__text">
          <p class="eyebrow">Contact</p>
          <h1>Get in touch with Picsel</h1>
          <p class="lede measure">
            Ring, email, or fill the form in, whichever suits. You&rsquo;ll get
            ${escapeHtml(SITE.contact.person.split(' ')[0])} either way.
            ${escapeHtml(SITE.responsePromise)}
          </p>
        </div>

${PAGE_BLOB}
      </div>
    </section>`;

const MAIN = `    <div class="section contact-main">
      <div class="wrap contact-main__inner">
${DIRECT}

${renderForm()}
      </div>
    </div>`;

export const CONTACT_PAGE = {
  path: '/contact/',
  /* ContactPage is one of the few page types a crawler acts on: it is how the
     phone number on this page gets associated with the business rather than
     read as another number in a paragraph. */
  schemaType: 'ContactPage',
  schemaExtra: [
    breadcrumbs(CONTACT_TRAIL),
  ],
  title: 'Contact Picsel: websites for tradespeople',
  description:
    `Ring Picsel on ${SITE.contact.phoneDisplay}, email ${SITE.contact.email}, or send an enquiry. Websites and Google visibility for tradespeople anywhere in the UK, no middleman.`,
  styles: ['/contact.css'],
  /* Enhancement only. With this file missing or blocked the form is still a
     working HTML form — it just posts the ordinary way and lands on
     /contact/sent/ instead of answering in place. */
  /* type="module" rather than a plain deferred script, because contact.js now
     imports reportEnquiry from hq-beacon.js and an import in a classic script
     is a syntax error rather than a quiet no-op. Modules are deferred by
     default, so this still never blocks the page appearing. */
  extraScripts: `  <script type="module" src="/contact.js"></script>\n${PAGE_BLOB_SCRIPT}`,
  content: [HEAD, MAIN].join('\n\n'),
};

/* ---- /contact/sent --------------------------------------------------------
   Where a no-JavaScript submission lands. Anyone with scripts running gets the
   inline message and never sees this page.

   It is deliberately kept out of sitemap.xml and marked noindex. THE SITEMAP
   LAW says every route that exists is listed, and this is the second and last
   exception on the site: a confirmation page has nothing to offer someone
   arriving from a search result, and indexing it would put "Enquiry sent" in
   front of people who have not sent one. The opt-out is a named property on the
   page rather than a rule in the build, so it is visible here in the file where
   the decision was made. */
export const CONTACT_SENT_PAGE = {
  path: '/contact/sent/',
  title: 'Enquiry sent | Picsel',
  description:
    'Your enquiry has reached Picsel. We will come back to you, or ring us if that is quicker.',
  excludeFromSitemap: true,
  /* The 150 character floor is waived here, and the two lines above are the
     argument for it. The floor protects the search snippet, this page is
     noindex and out of the sitemap, and the only way to reach it is to send
     the form. There is no snippet to lose control of, so the warning could
     never be acted on and padding this sentence would only add words nobody
     reads to a page nobody searches for. */
  descriptionFloorWaived: true,
  extraHead: '  <meta name="robots" content="noindex, follow" />',
  styles: ['/contact.css'],
  /* The same text column as the head above, without the two-column grid around
     it: there is no blob on this page. Someone who has just sent an enquiry is
     one step from leaving, and a decoration is not what that screen needs. */
  content: `    <section class="section contact-head">
      <div class="wrap page-head__text">
        <p class="eyebrow">Thanks</p>
        <h1>That&rsquo;s arrived</h1>
        <p class="lede measure">
          We&rsquo;ve got your enquiry and we&rsquo;ll come back to you. If it&rsquo;s quicker to talk,
          the number&rsquo;s here.
        </p>

        <!-- The number is its own target rather than a link inside the sentence
             above. Set inline it measured 23px tall, well under the 44px tap
             minimum, on the one page where ringing is the only thing left to
             do — and an inline link cannot be padded to size without shoving
             its own line of text apart. -->
        <div class="contact-sent__actions">
          <a class="contact-sent__phone" href="${escapeHtml(SITE.contact.phoneHref)}">${escapeHtml(SITE.contact.phoneDisplay)}</a>
          <a class="btn btn--secondary" href="/work/">Have a look at the work</a>
        </div>
      </div>
    </section>`,
};
