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
   form still submits as an ordinary HTML post and lands on /contact/sent/.

   THE FORM IS ONE FORM IN THREE FIELDSETS, AND THAT IS THE WHOLE TRICK. Six
   fields in one column is a wall, and a wall is where somebody reading this
   between jobs stops. So enquiry-steps.js shows one fieldset at a time: what
   you need, then the job, then how to reach you. It is the same shape of
   enhancement as the inline send. Nothing is added to the markup for it and
   nothing is taken away — the script hides two of the three fieldsets and
   unhides the controls that move between them, and if it never runs, all
   three are on screen at once and the form is the plain HTML form it always
   was. There is still one <form>, one action and one POST. */

import { SITE, absoluteUrl } from '../../site.config.js';
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

/* ---- Step one: what do you need? ------------------------------------------
   The four options, written the way the person filling the form would say them
   rather than the way a services page lists them. Someone who wants to be
   found on Google does not think of it as "SEO & GEO" — that is our word for
   it, and a form is a bad place to make someone translate.

   The `value` keeps the short internal word, so the email that arrives is
   scannable; the label is what the visitor reads.

   Radios, not buttons, and that is not a detail. Restyled as cards they look
   like the four big tappable things the step wants, while the browser keeps
   doing the work: arrow keys move between them, `required` on the group is
   real validation, and the answer is in the POST without a line of script. A
   row of <button>s would mean hand-rolling all three, and would leave anyone
   without JavaScript with no way to answer the first question at all.

   Each one carries a second line. The four labels alone read as a taxonomy of
   our services; the notes are there to let somebody recognise their own
   situation in one of them rather than work out which word we would use. */
const NEEDS = [
  {
    value: 'Website',
    label: 'A new website',
    note: 'Built from scratch, or replacing one that&rsquo;s letting you down.',
    /* The tailored second step. Asking "what&rsquo;s the job?" of someone who
       has just said they want to be found on Google gets you "I want to be
       found on Google" back. Asking what they want to be found for gets you
       something worth quoting from. */
    prompt: 'What does your business do, and what should the site do for it?',
    hint: 'A couple of lines is plenty. A link to your current site helps if you have one.',
  },
  {
    value: 'Search',
    label: 'Getting found on Google',
    note: 'Maps, search results, and what AI assistants say about you.',
    prompt: 'What do you want to be found for, and where?',
    hint: 'The jobs you want more of, and the towns you cover.',
  },
  {
    value: 'Automation',
    label: 'A tool to save me time',
    note: 'Quotes, bookings, paperwork: whatever you do by hand every week.',
    prompt: 'What keeps eating your time?',
    hint: 'How you do it now is the useful part, however clunky.',
  },
  {
    value: 'Other',
    label: 'Something else',
    note: 'Not sure which of these it is. Tell us anyway.',
    prompt: 'What&rsquo;s on your mind?',
    hint: 'A couple of lines is plenty.',
  },
];

/* What step two says before anybody has answered step one, and what it says
   for good with JavaScript off. Every tailored variant above ships hidden and
   is revealed by enquiry-steps.js; this one ships visible, so the field is
   never unlabelled. */
const NEED_FALLBACK = {
  prompt: 'What&rsquo;s the job?',
  hint: 'A couple of lines is plenty.',
};

const NEED_CARDS = NEEDS.map(
  ({ value, label, note }, index) => `                <label class="enquiry-option">
                  <input class="enquiry-option__input"
                         type="radio"
                         id="enquiry-need-${index + 1}"
                         name="need"
                         value="${escapeHtml(value)}"
                         required />
                  <span class="enquiry-option__body">
                    <span class="enquiry-option__label">${escapeHtml(label)}</span>
                    <span class="enquiry-option__note">${note}</span>
                  </span>
                </label>`,
).join('\n');

/* One <span> per answer, all but the fallback shipped hidden. The script
   swaps which is visible; it never writes the words itself, so the copy lives
   here beside the option it belongs to rather than in a string table in a
   different file. */
const NEED_PROMPTS = [
  `                <span class="enquiry-prompt" data-need="">${NEED_FALLBACK.prompt}</span>`,
  ...NEEDS.map(
    ({ value, prompt }) =>
      `                <span class="enquiry-prompt" data-need="${escapeHtml(value)}" hidden>${prompt}</span>`,
  ),
].join('\n');

const NEED_HINTS = [
  `                <span class="enquiry-prompt" data-need="">${NEED_FALLBACK.hint}</span>`,
  ...NEEDS.map(
    ({ value, hint }) =>
      `                <span class="enquiry-prompt" data-need="${escapeHtml(value)}" hidden>${hint}</span>`,
  ),
].join('\n');

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
            <!-- Three questions, not three screens. The form only splits into
                 steps when enquiry-steps.js runs, so a lede that promised
                 screens would be describing something half the sentence's
                 readers cannot see. Three questions is true either way.

                 THE LINK TO /prices/ THAT USED TO END THIS SENTENCE HAS GONE,
                 AND IT SHOULD NOT COME BACK. It was a way off the page, sat
                 one line above the first question, on the one page whose only
                 job is getting the form filled in. Anyone who wants the
                 numbers before enquiring has already passed Prices in the nav
                 and in the footer; anyone who has got this far is here to
                 send something. -->
            Answer three questions and we&rsquo;ll come back with what&rsquo;s involved and what
            it would cost.
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

            <!-- The progress trail, and the way back to anything already
                 answered. Shipped hidden: without enquiry-steps.js there are
                 no steps to be part of the way through, so a trail claiming
                 otherwise would be furniture that lies. A real <ol>, because
                 three numbered stages in a fixed order is a list, and each
                 stage is a <button> rather than an anchor because it changes
                 what is on screen instead of going anywhere. -->
            <ol class="enquiry-steps" id="enquiry-steps" hidden>
              <li class="enquiry-steps__item">
                <button class="enquiry-steps__step" type="button" data-goto="1" disabled>
                  <span class="enquiry-steps__num" aria-hidden="true">1</span>
                  <span class="enquiry-steps__name">What you need</span>
                </button>
              </li>
              <li class="enquiry-steps__item">
                <button class="enquiry-steps__step" type="button" data-goto="2" disabled>
                  <span class="enquiry-steps__num" aria-hidden="true">2</span>
                  <span class="enquiry-steps__name">The job</span>
                </button>
              </li>
              <li class="enquiry-steps__item">
                <button class="enquiry-steps__step" type="button" data-goto="3" disabled>
                  <span class="enquiry-steps__num" aria-hidden="true">3</span>
                  <span class="enquiry-steps__name">Your details</span>
                </button>
              </li>
            </ol>

            <!-- ONE FORM, THREE FIELDSETS. Not three forms, and not three
                 pages. The send stays a single POST, so nothing about the
                 inline send below has to know that stepping exists, and with
                 JavaScript off all three fieldsets are simply on screen at
                 once and the page behaves exactly as it did before any of
                 this was added. A fieldset with a legend is also already the
                 markup for "these fields belong to one question", which is
                 what a step is. -->
            <fieldset class="enquiry-step" data-step="1">
              <legend class="enquiry-step__legend" tabindex="-1">
                <span class="visually-hidden">Step 1 of 3. </span>What do you need?
              </legend>

              <div class="enquiry-options">
${NEED_CARDS}
              </div>

              <div class="enquiry-step__foot">
                <button class="btn btn--secondary" type="button" data-next hidden>Continue</button>
              </div>
            </fieldset>

            <fieldset class="enquiry-step" data-step="2">
              <legend class="enquiry-step__legend" tabindex="-1">
                <span class="visually-hidden">Step 2 of 3. </span>Tell us about the job
              </legend>

              <div class="field">
                <!-- Five labels in one, four of them hidden. The script shows
                     the one matching step 1; the empty data-need is the
                     fallback, and it is the visible one in the markup so the
                     field is never unlabelled. -->
                <label class="field__label" for="enquiry-message">
${NEED_PROMPTS}
                </label>
                <!-- Deliberately NOT required. The message is the field most
                     likely to make somebody reading this in a van decide it
                     can wait until later, and later never comes. A name, an
                     email and "a new website" is already an enquiry worth
                     ringing back. -->
                <textarea class="field__input field__textarea"
                          id="enquiry-message"
                          name="message"
                          rows="6"
                          aria-describedby="enquiry-message-hint"></textarea>
                <p class="field__hint" id="enquiry-message-hint">
${NEED_HINTS}
                </p>
              </div>

              <div class="enquiry-step__foot">
                <button class="enquiry-back" type="button" data-back hidden>Back</button>
                <!-- One button, two labels. Empty box and it offers to skip;
                     start typing and it becomes Continue. A separate Skip
                     button beside a Continue button that did the same thing
                     would be two controls for one action. -->
                <button class="btn btn--secondary" type="button" data-next data-empty-label="Skip this" hidden>Continue</button>
              </div>
            </fieldset>

            <fieldset class="enquiry-step" data-step="3">
              <legend class="enquiry-step__legend" tabindex="-1">
                <span class="visually-hidden">Step 3 of 3. </span>How do we reach you?
              </legend>

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
                <label class="field__label" for="enquiry-source">
                  How did you hear about us? <span class="field__optional">optional</span>
                </label>
                <select class="field__input field__select" id="enquiry-source" name="source">
${SOURCE_OPTIONS}
                </select>
              </div>

              <div class="enquiry-step__foot">
                <button class="enquiry-back" type="button" data-back hidden>Back</button>
                <button class="btn btn--primary" type="submit">Send enquiry</button>
              </div>

              <p class="enquiry-form__privacy">
                We use these details to reply to you and nothing else.
              </p>
            </fieldset>

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
