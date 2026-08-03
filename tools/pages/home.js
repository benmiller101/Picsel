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

import { FEATURED_PROJECTS, PROJECTS } from '../../projects.js';
import { SITE } from '../../site.config.js';
import { countWord } from '../templates/words.js';
import { renderWorkGrid } from '../partials/work-card.js';
import { renderContactBand } from '../partials/contact-band.js';

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
             letter — so the spans are hidden from it and the real heading text
             is carried by the visually-hidden line above them. Seen: a pixel
             wordmark. Heard: "Picsel — Design Studio". -->
        <h1 class="hero-mark">
          <span class="visually-hidden">Picsel, Design Studio</span>
          <span class="wordmark" id="wordmark" aria-hidden="true">PICSEL</span>
          <span class="tagline" id="tagline" aria-hidden="true">Design Studio</span>
        </h1>

        <p class="hero__cue" aria-hidden="true">Scroll</p>
      </div>
    </section>`;

/* ---- The opening statement ------------------------------------------------
   Deliberately the first words after the hero, and deliberately plain. Who,
   what, where, in one sentence that could be lifted whole and still be true and
   useful — which is exactly what an AI assistant answering "who builds websites
   in Cornwall" will do with it. No slogan, no promise, nothing that needs a
   second sentence to make sense of. */
const INTRO = `    <section class="section intro">
      <div class="wrap intro__inner">
        <p class="eyebrow">Cornwall</p>
        <p class="lede intro__statement">
          Picsel is a web design and automation studio in Cornwall. We build websites for
          local trades and small businesses, and do the search work that gets them found.
          Priced for a small business, not an agency retainer.
        </p>
        <p class="intro__aside">
          Five sites are live. They are all below, and each one links straight out to the
          real thing. Not a mock-up.
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

        <p class="services__exclusive measure">
          <strong>One client per trade, per town.</strong> If we build for a builder in Hayle,
          we won&rsquo;t take on another one. You&rsquo;re not paying us to help your competitor
          catch up.
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

   What is NOT here matters as much. There is no "how much does it cost"
   question, and that is settled rather than pending: Ben decided prices stay
   off the site, so they are quoted in the conversation instead. Do not add a
   price, a range or a "from £" to this section or anywhere else. */
const CORNWALL_COUNT = PROJECTS.filter((p) => /cornwall/i.test(p.location)).length;
const ELSEWHERE_COUNT = PROJECTS.length - CORNWALL_COUNT;

const QUESTIONS = [
  {
    q: 'Do I need to know anything about websites?',
    a:
      'No. Tell us what your business does and what you want someone to do when they land on ' +
      'the site, and we deal with the rest of it. You will not be sent a list of technical ' +
      'decisions to make.',
  },
  {
    q: 'Do you only work in Cornwall?',
    /* Counted from the project list rather than typed, for the same reason the
       /work page counts its own. The day the mix changes, a hand-written
       "four of the five" becomes a lie on a page whose argument is that the
       work is real and checkable. */
    a:
      `Most of our work is here, but no. ${countWord(CORNWALL_COUNT, { capitalise: true })} of the ` +
      `${countWord(PROJECTS.length)} sites on this page are for Cornish businesses and ` +
      `${ELSEWHERE_COUNT === 1 ? 'one is' : `${countWord(ELSEWHERE_COUNT)} are`} further afield. ` +
      'Where you are only matters for the search side, because you are competing with the ' +
      'other firms in your own towns. The site itself is built the same wherever you are.',
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

export const HOME_PAGE = {
  path: '/',
  /* The same four questions, machine-readable, generated from the array above.

     Worth being clear about what this does and does not buy: Google narrowed
     FAQ rich results in 2023 to government and health sites, so this will not
     put a row of drop-downs in the search result. It is here for the other
     reader. An assistant asked "can a Cornwall web designer get me to the top
     of Google" can lift the answer with the question attached, which is the
     whole point of this section of the plan. */
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
  title: 'Picsel: web design and automation in Cornwall',
  /* Kept in step with the opening line on the page itself. A description that
     promises one thing and a page that says another is the sort of mismatch
     that costs a click and is never noticed, because nobody re-reads their own
     meta tags. */
  description:
    'Picsel is a web design and automation studio in Cornwall. Websites and search work for local trades and small businesses, priced for a small business.',
  /* Opts the page out of the gap base.css reserves under the floating nav: the
     hero is a full-screen composition that starts at the very top and
     deliberately runs behind the nav. */
  bodyClass: 'page-hero',
  /* Only this page loads the hero's styling and its animation. The contact page
     has no blobs to draw and should not pay for the code that draws them. */
  styles: ['/hero.css'],
  /* A module, so it can import the noise generator it shares with the site-wide
     backdrop. Modules are deferred by default: the script waits for the page to
     be parsed and never blocks it from appearing. Everything it does is
     decoration — with the file missing, blocked or still loading, the homepage
     is a complete, readable page. */
  extraScripts: '  <script type="module" src="/hero.js"></script>',
  /* The questions sit between what we do and the ask. Someone who has read the
     services list and is close to ringing has exactly these four things in
     their head, and answering them is the last thing standing between reading
     and dialling. */
  content: [HERO, INTRO, WORK, SERVICES, FAQ, renderContactBand()].join('\n\n'),
};
