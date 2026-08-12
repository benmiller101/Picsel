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
import { PLANS, money } from '../../pricing.js';
import { renderWorkGrid } from '../partials/work-card.js';
import { renderPlanRail } from '../partials/plan-cards.js';
import { renderReviews } from '../partials/reviews.js';
import { renderContactBand } from '../partials/contact-band.js';

/* The cheapest monthly figure on the site, read from the plan data rather than
   typed. It appears in the opening statement, in the questions and on /prices,
   and three hand-written copies of a price is how a site ends up quoting a
   number the business stopped charging months ago. */
const FROM_MONTHLY = money(PLANS[0].monthly);

/* The half-sentence that names a price, and what stands in its place while
   SHOW_PRICING is off. "Live in days" was always the second half of the line;
   with the number gone it carries the whole thing, which is fine, because
   speed is the other thing this audience is actually choosing on. */
const PRICE_LINE = SHOW_PRICING ? `From ${FROM_MONTHLY} a month, live in days.` : 'Live in days.';

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
        <!-- "No jargon, no lock-in, no agency retainer" was one sentence with
             three beats in it. Three is the length a machine reaches for when
             it is padding, and a reader clocks the rhythm before the content.
             Two of them, then a full stop, then the third as its own sentence. -->
        <p class="intro__support measure">
          We build fast, honest websites for tradespeople anywhere in the UK, get you found on
          Google and in AI search, and keep you there. No jargon and no lock-in. You are not
          signing an agency retainer.
        </p>
      </div>
    </section>`;

/* ---- Selected work --------------------------------------------------------
   The screenshots carry all the colour on this page. Everything around them is
   near-black on purpose: five client sites in five different palettes will
   fight anything else that is trying to be colourful. */
const WORK = `    <section class="section work" aria-labelledby="work-heading">
      <div class="wrap">
        <div class="section-head">
          <!-- "Recent work", not "Selected work". There are five builds and all
               five are on this page, so there is no selection happening —
               "selected" would imply a larger body of work being curated down,
               which is a claim a studio this new should not be making. -->
          <h2 class="section-head__title" id="work-heading">Recent work</h2>
          <a class="section-head__link" href="/work/">See every project</a>
        </div>

${renderWorkGrid(FEATURED_PROJECTS)}
      </div>
    </section>`;

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
      ? `Builds start at ${money(PLANS[0].build)} and the site is then ${FROM_MONTHLY} a month, ` +
        'which covers the hosting, the security and the Google listing. Two larger plans add ' +
        'monthly edits and active search work. Every price is on the prices page, including ' +
        'what each one does not cover.'
      : 'We are rebuilding the plans, so there is no price list on the site at the moment. ' +
        'Ring or send a message with what you need and you will get a figure the same day, ' +
        'and what it covers in writing.',
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

/* Two across on a wide screen rather than one long column: the services list
   directly above is already a vertical stack, and repeating that shape twice in
   a row makes the bottom of the page read as one undifferentiated list. */
const FAQ = `    <section class="section faq" aria-labelledby="faq-heading">
      <div class="wrap">
        <div class="section-head">
          <h2 class="section-head__title" id="faq-heading">Common questions</h2>
          <!-- The only route to /guides from the homepage, and it sits here
               rather than in the nav because the guides are the long answers to
               exactly these questions. Someone who has read four short answers
               and wants a fifth is the person they are written for. -->
          <a class="section-head__link" href="/guides/">Longer answers in the guides</a>
        </div>

        <div class="faq__grid">
${QUESTIONS.map(
  ({ q, a }) => `          <div class="faq__item">
            <h3 class="faq__q">${q}</h3>
            <p class="faq__a">${a}</p>
          </div>`,
).join('\n\n')}
        </div>
      </div>
    </section>`;

/* ---- What people say -------------------------------------------------------
   Immediately above the contact band on purpose: the last thing a reader sees
   before the call to action is someone else vouching for the work, not the
   studio describing itself. All four reviews appear here rather than a
   curated subset — with only four, choosing three would look like the fourth
   was hidden for a reason, and four is not enough to need trimming for length.

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
  styles: ['/hero.css', '/reviews.css'],
  /* A module, so it can import the noise generator it shares with the site-wide
     backdrop. Modules are deferred by default: the script waits for the page to
     be parsed and never blocks it from appearing. Everything it does is
     decoration — with the file missing, blocked or still loading, the homepage
     is a complete, readable page. */
  extraScripts: '  <script type="module" src="/hero.js"></script>',
  /* The order is what someone decides in. Proof, then what we do, then what it
     costs, then the four things still in their head, then other people saying
     the same thing, then the phone number.

     Price goes after the services list and before the questions on purpose. Put
     it any earlier and it is a number with nothing attached to it; put it any
     later and someone who was only ever going to ask "how much" has already
     left. The reviews go last of the content sections, immediately before the
     contact band, so the final impression before the call to action is proof
     rather than another claim from the studio itself. */
  content: [
    HERO,
    INTRO,
    WORK,
    SERVICES,
    ...(SHOW_PRICING ? [renderPlanRail()] : []),
    FAQ,
    REVIEWS_SECTION,
    renderContactBand(),
  ].join('\n\n'),
};
