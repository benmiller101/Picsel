/* ---- home.js — the homepage ----------------------------------------------
   The hero, one plain statement of what Picsel is, the work, a short note on
   what the studio does, and the contact band.

   The order is deliberate and it is not the usual one. A visitor who has been
   sent here by a tradesperson wants to know two things: is this real, and does
   it look any good. So the WORK comes before the services list. What Picsel
   sells is visible in five real sites; describing the services first would be
   asking someone to read a list before they have any reason to care.

   Kept in its own file rather than inline in build.js because the page content
   is content — it deserves to be somewhere you would think to look for it,
   next to the other pages, rather than nested inside a build script. */

import { FEATURED_PROJECTS } from '../../projects.js';
import { REVIEWS } from '../../reviews.js';
import { SITE, SHOW_PRICING } from '../../site.config.js';
import { PLANS, BUILD_FEE, money } from '../../pricing.js';
import { escapeHtml } from '../templates/page.js';
import { renderWorkRing } from '../partials/work-ring.js';
import { renderPlanRail } from '../partials/plan-cards.js';
import { renderFaq } from '../partials/faq.js';
import { renderReviews } from '../partials/reviews.js';
import { renderContactBand } from '../partials/contact-band.js';
import { SERVICES_BLOB, PAGE_BLOB_SCRIPT } from '../partials/page-blob.js';

/* The cheapest monthly figure on the site, read from the plan data rather than
   typed. It appears in the opening statement, in the questions and on /prices,
   and three hand-written copies of a price is how a site ends up quoting a
   number the business stopped charging months ago. */
const FROM_MONTHLY = money(PLANS[0].monthly);

/* The half-sentence that names a price, and what stands in its place while
   SHOW_PRICING is off. "Live in days" was always the second half of the line;
   with the number gone it carries the whole thing, which is fine, because
   speed is the other thing this audience is actually choosing on. */
const PRICE_LINE = SHOW_PRICING
  ? `${money(BUILD_FEE)} to build, then from ${FROM_MONTHLY} a month. Live in days.`
  : 'Live in days.';

/* ---- The hero -------------------------------------------------------------
   Three layers over near-black: the drawn dot texture, the blobs on their pixel
   grid, and the wordmark. hero.js animates all of it; with JavaScript off this
   is still a complete, readable screen — the wordmark is real text sitting in
   the markup, not something a script assembles. */
const HERO = `    <section class="hero" id="hero">
      <!-- The pinned screen. The section around it is taller, and that extra
           height is the distance the reverse intro is scrubbed over. -->
      <div class="hero__stage">
        <!-- No dot layer here any more. The hero used to draw its own; the
             site-wide backdrop canvas now runs behind every page, this one
             included, and the hero sits in front of it. One texture, drawn
             once, continuous from the hero to the footer. -->

        <!-- Layer 1: lava-lamp blobs, drawn by hero.js on a low-resolution
             pixel grid — a canvas one eighth of the screen's size, scaled back
             up with hard edges, so the blobs are displayed at a small
             resolution rather than smoothed and then pixelated. See BLOBS and
             PIXEL in its config block. -->
        <canvas id="blobs" class="hero-blobs" aria-hidden="true"></canvas>

        <!-- Layer 2: the wordmark, and the page's one h1. The letters are
             split into spans so the glitch can re-font them individually,
             which would make a screen reader spell the word out letter by
             letter, so the spans are hidden from it and the real heading text
             is carried by the visually-hidden line above them. Seen: a pixel
             wordmark. Heard: "Picsel, websites for tradesmen anywhere in the
             UK", the page's actual subject rather than just its name. The line
             named a price until the pricing model went back on the bench; see
             SHOW_PRICING in site.config.js. -->
        <h1 class="hero-mark">
          <span class="visually-hidden">Picsel: websites for tradesmen anywhere in the UK</span>
          <span class="wordmark" id="wordmark" aria-hidden="true">PICSEL</span>
          <span class="tagline" id="tagline" aria-hidden="true">Design Studio</span>
        </h1>

        <p class="hero__cue" aria-hidden="true">Scroll</p>
      </div>
    </section>`;

/* ---- The opening statement ------------------------------------------------
   The first words after the hero, and the site's actual headline: the wordmark
   above it is a mark, not a sentence. Three short lines that say what is sold,
   what is unusual about it and what it costs, in that order, because that is
   the order someone decides in.

   Every line is meant to survive being lifted out on its own. An assistant
   answering "who builds cheap websites for tradesmen" will quote one sentence,
   not a paragraph, so no sentence here needs the one before it to make sense.

   It used to open with "Picsel is a web design and automation studio in
   Cornwall". That was the single most quotable location claim on the site, and
   it is now the wrong one: the studio moves to Edinburgh inside three months
   and the market was never the county anyway. Nothing replaces it. A business
   that works anywhere does not need to say where it is, and saying "UK-wide"
   twice in three lines would be protesting. */
const INTRO = `    <section class="section intro">
      <div class="wrap intro__inner">
        <p class="eyebrow">Websites for trades</p>
        <p class="lede intro__statement">
          Websites and Google visibility for tradespeople. ${SITE.exclusivity.short}, so we
          never work for your competitor. ${PRICE_LINE}
        </p>
        <!-- The first thing on the site anybody can act on, and until August
             2026 there was nothing to act on until the very bottom of the
             page. The nav's button does not count: it is hidden at the top of
             a page and only comes back on the way up, so somebody reading down
             has no way to reach it without going backwards.

             Same two routes as the closing band, and deliberately the same
             pair everywhere: some of this audience will ring, some would
             rather type. The number is written out because on a phone it dials
             and on a desktop it is the thing a person with a landline needs to
             be able to read. -->
        <p class="intro__actions">
          <a class="btn btn--primary" href="/contact/#enquiry">Get in touch</a>
          <a class="intro__phone" href="${escapeHtml(SITE.contact.phoneHref)}">${escapeHtml(
            SITE.contact.phoneDisplay,
          )}</a>
        </p>

        <!-- "No jargon, no lock-in, no agency retainer" was one sentence with
             three beats in it. Three is the length a machine reaches for when
             it is padding, and a reader clocks the rhythm before the content.
             Two of them, then a full stop, then the third as its own sentence.

             "No lock-in" was also true and stopped being true on 12 August
             2026, when Growth went onto a twelve month term. The claim is now
             scoped to the two plans it still covers rather than dropped: a
             rolling contract is the thing this audience has been burned on and
             it is worth saying, but only about the plans that have one. -->
        <p class="intro__support measure">
          We build fast, honest websites for tradespeople anywhere in the UK, get you found on
          Google and in AI search, and keep you there. No jargon, and two of the three plans you
          can cancel any time. You are not signing an agency retainer.
        </p>
      </div>
    </section>`;

/* ---- The work ------------------------------------------------------------
   The screenshots carry all the colour on this page. Everything around them is
   near-black on purpose: every client site brings its own palette, and half a
   dozen of them at once will fight anything else trying to be colourful.

   This was a flat grid until August 2026 and is now a pinned 3D ring that
   turns one project per scroll. What it is in the HTML has not changed: six
   links, six screenshots, six names. The ring is a layer work-ring.js adds on
   top of that and takes away again for anybody who has asked for less motion.
   The markup lives in partials/work-ring.js, generated from projects.js. */
const WORK = renderWorkRing(FEATURED_PROJECTS);

/* ---- What Picsel does -----------------------------------------------------
   A plain list, not a sales section. Each line says what the thing is and what
   it gets you, in the words the audience would use — "the free listing that
   decides whether you show up in the map results", not "GBP optimisation".

   The exclusivity note is last because it is the only genuinely unusual thing
   here, and because it is a promise rather than a service. */
const SERVICES = `    <section class="section services" aria-labelledby="services-heading">
      <div class="wrap services__inner">
        <div class="services__intro">
          <h2 id="services-heading">What we do</h2>
          <p class="measure">
            Four things, and they lean on each other. A site nobody can find is no use, and
            being easy to find is no use if the site puts people off when they get there.
          </p>
          <!-- The intro is two short paragraphs against a column that runs the
               height of four services, so most of it is empty. On a desktop
               that reads as a gap rather than as space. Same blob the page
               heads on /work and /contact use, for the same reason. Desktop
               only: below 64rem the section is one column and there is no
               emptiness to fill. -->
${SERVICES_BLOB}
        </div>

        <dl class="services__list">
          <div class="services__item">
            <dt>Websites</dt>
            <dd>
              Quick on a bad signal and easy to read on a small screen. That is where most of
              your customers will see it.
            </dd>
          </div>
          <div class="services__item">
            <dt>Search, and AI answers</dt>
            <dd>
              Being found on Google for the jobs and the towns that bring you work. And, more
              and more, being the answer when someone asks an AI assistant instead.
            </dd>
          </div>
          <div class="services__item">
            <dt>Google Business Profile</dt>
            <dd>
              The free listing that decides whether you appear in the map results. Easy to
              set up once and then never touch again. We keep yours current.
            </dd>
          </div>
          <div class="services__item">
            <dt>Custom tools</dt>
            <dd>
              Small pieces of software for whatever you retype every week: quotes, booking
              confirmations. Built around how you already work, not the other way round.
            </dd>
          </div>
        </dl>

        <!-- The full form of the promise, from site.config.js, which is the
             only place it is written. The old version named the town as the
             unit and attached no plan to it, and was wrong on both counts: the
             contract says a patch, and the promise is made on Growth only. The
             old wording is described rather than quoted, because a comment
             ships to the browser and a loose promise in one is still a loose
             promise on the page. Read SITE.exclusivity before touching a word
             of this. -->
        <p class="services__exclusive measure">
          ${SITE.exclusivity.full} You are not paying us to help your competitor catch up.
        </p>
      </div>
    </section>`;

/* ---- Common questions -----------------------------------------------------
   Written as questions because that is how people ask them, out loud and into
   a search box, and increasingly into an assistant that will answer on our
   behalf. The answer to each one leads with the answer. No preamble, nothing
   that needs the question re-read to make sense of it, so a line can be lifted
   whole and still be true.

   ONE SOURCE. This array renders the visible section AND the FAQ structured
   data below it. The alternative is writing each answer twice and letting the
   two drift, which ends with a machine-readable answer that contradicts the
   page it sits on.

   THE PRICE QUESTION IS NOW ANSWERED, and that is a reversal. The rule here
   used to be that prices stay off the site and get quoted in the conversation.
   It was overturned for one reason: the social bios lead with "from £15 a
   month", so a site that named no number was not being discreet, it was
   disagreeing with itself in public. The number comes from pricing.js and the
   answer links to the page that carries the rest. */
const QUESTIONS = [
  {
    q: 'Do I need to know anything about websites?',
    a:
      'No. Tell us what your business does and what you want someone to do when they land on ' +
      'the site, and we deal with the rest of it. You will not be sent a list of technical ' +
      'decisions to make.',
  },
  {
    q: 'How much does a website cost?',
    /* Leads with the number when there is one to lead with. Someone asking this
       wants the figure, not a paragraph about how it depends, and an assistant
       quoting the answer will take the first sentence.

       The question stays on the page while SHOW_PRICING is off. Deleting it
       would not stop anyone asking, it would only mean the answer they find is
       whatever they guess, and "ring and ask" is a worse answer than a number
       but a much better one than silence. */
    a: SHOW_PRICING
      ? `${money(BUILD_FEE)} to build it, whichever plan you pick, and then from ` +
        `${FROM_MONTHLY} a month, which covers the hosting, the security and the Google ` +
        'listing. Two larger plans add monthly changes and active search work. Every price is ' +
        'on the prices page, including what each one does not cover.'
      : 'There is no price list on the site at the moment. Ring or send a message with what ' +
        'you need and you will get a figure the same day, and what it covers in writing.',
  },
  {
    q: 'Where do you work?',
    a:
      'Anywhere in the UK. The site is built the same wherever you are, and the whole job is ' +
      'done over the phone and by email either way. Where you are only matters for the search ' +
      'side, because there you are competing with the other firms in your own towns.',
  },
  {
    q: 'Can you get me to the top of Google?',
    /* The honest answer, and the one that does the most work. A studio that
       promises a position is either guessing or lying, and this audience has
       been called by enough of them to know it. Saying so plainly is worth
       more than a claim we would have to keep. */
    a:
      'Nobody can promise that, and anyone who does is guessing. What we can do is make sure ' +
      'Google can read your site, that it says plainly what you do and which towns you cover, ' +
      'and that your Google Business Profile is filled in properly. That is what decides ' +
      'whether you turn up in the map results.',
  },
  {
    q: 'Who will I be dealing with?',
    a:
      `${SITE.contact.person}, who builds the sites and answers the phone. There is no account ` +
      'manager and nobody to be passed on to.',
  },
];

/* Collapsed, one open at a time, in partials/faq.js. It was a two-column grid
   with all five answers showing, which put about 130 words in front of somebody
   who arrived at this section with one question. */
const FAQ = `    <section class="section faq" aria-labelledby="faq-heading">
      <div class="wrap">
${renderFaq({
  faqs: QUESTIONS,
  name: 'home-faq',
  heading: 'Common questions',
  headingId: 'faq-heading',
  /* The only route to /guides from the homepage, and it sits with this heading
     rather than in the nav because the guides are the long answers to exactly
     these questions. Someone who has read four short answers and wants a fifth
     is the person they are written for. */
  link: { href: '/guides/', label: 'Longer answers in the guides' },
  /* These answers are written with entities already in them, unlike the other
     two callers', so they are safe and must not be escaped a second time. */
  escapeAnswers: false,
})}
      </div>
    </section>`;

/* ---- What people say -------------------------------------------------------
   Directly above the price, which is the whole reason it is where it is: see
   the note on `content` at the bottom of this file. Somebody about to read a
   number should have just read seven people saying it was worth paying.

   Every review appears here rather than a curated subset. Picking the best
   five of seven is the point at which a testimonial section stops being
   evidence and starts being marketing, and the rail costs nothing to show all
   of them: it is one card tall whatever the count.

   The heading names no place, in keeping with the rest of the page: what is
   true of these clients is not a claim about where Picsel is based. */
const REVIEWS_SECTION = renderReviews({
  reviews: REVIEWS,
  heading: 'What people say',
  headingId: 'reviews-heading',
});

export const HOME_PAGE = {
  path: '/',
  /* The same questions, machine-readable, generated from the array above.

     Worth being clear about what this does and does not buy: Google narrowed
     FAQ rich results in 2023 to government and health sites, so this will not
     put a row of drop-downs in the search result. It is here for the other
     reader. An assistant asked "how much should a tradesman pay for a website"
     can lift the answer with the question attached, which is the whole point of
     this section of the plan, and the reason /guides exists at all. */
  schemaExtra: [
    {
      '@type': 'FAQPage',
      /* A fragment id, and deliberately no `url`. This describes the FAQ
         content WITHIN the homepage; giving it the page's own URL would put
         two competing page types on one address. */
      '@id': `${SITE.origin}/#faq`,
      mainEntity: QUESTIONS.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    },
  ],
  /* Written for the search someone actually types. "Websites for tradesmen" is
     the phrase, and it is the first thing in the title rather than the studio
     name, because nobody is searching for Picsel yet. */
  title: SHOW_PRICING
    ? 'Websites for tradesmen, from £15 a month | Picsel'
    : 'Websites for tradesmen across the UK | Picsel',
  /* Kept in step with the opening lines on the page itself. A description that
     promises one thing and a page that says another is the sort of mismatch
     that costs a click and is never noticed, because nobody re-reads their own
     meta tags. */
  description: SHOW_PRICING
    ? 'We build fast, honest websites for tradespeople anywhere in the UK, get found on Google and in AI search, and stay there. From £15 a month, live in days.'
    : 'We build fast, honest websites for tradespeople anywhere in the UK, get you found on Google and in AI search, and keep you there. Live in days, not months.',
  /* Opts the page out of the gap base.css reserves under the floating nav: the
     hero is a full-screen composition that starts at the very top and
     deliberately runs behind the nav. */
  bodyClass: 'page-hero',
  /* Only this page loads the hero's styling and its animation. The contact page
     has no blobs to draw and should not pay for the code that draws them. */
  styles: ['/hero.css', '/work-ring.css', '/reviews.css'],
  /* Two enhancements, neither of which the page needs to be readable.

     hero.js is a module so it can import the noise generator it shares with the
     site-wide backdrop. work-ring.js imports nothing and is a plain IIFE, so it
     takes `defer` instead. Both amount to the same promise: the script waits for
     the page to be parsed and never blocks it from appearing.

     With either file missing, blocked or still loading, the homepage is
     complete and readable. The hero is a still composition and the work section
     is a grid of six links. */
  extraScripts: `  <script type="module" src="/hero.js"></script>
  <script defer src="/work-ring.js"></script>
${PAGE_BLOB_SCRIPT}`,
  /* The order is what someone decides in. The work, what we do, other people
     saying it was worth it, what it costs, the questions still in their head,
     then the phone number.

     THE REVIEWS MOVED ABOVE THE PRICE on 20 August 2026, and it is the one
     ordering decision on this page worth arguing about.

     They used to sit last, immediately before the contact band, so the final
     thing a reader met was proof rather than another claim from the studio.
     That reasoning was sound and it was answering the wrong question. Nobody
     reaches the bottom of a page undecided about whether the work is any good;
     they reach the price undecided about whether it is worth it, and that is
     four sections earlier. A number lands differently depending on what was in
     front of it, and "seven people said this was worth paying for" is a better
     thing to have just read than a list of services.

     Price still comes after the services list, for the reason it always did:
     any earlier and it is a number with nothing attached to it. The questions
     are last now, which suits them, because a question is the thing somebody
     has after they have seen the number rather than before. */
  content: [
    HERO,
    INTRO,
    WORK,
    SERVICES,
    REVIEWS_SECTION,
    ...(SHOW_PRICING ? [renderPlanRail()] : []),
    FAQ,
    renderContactBand(),
  ].join('\n\n'),
};
