/* ---- guides.js — /guides and the guide pages ------------------------------
   The GEO half of the plan, and the half that can actually be won.

   The reasoning is worth writing down because it decides how every word below
   is shaped. National organic search for "websites for tradesmen" is a twelve
   month fight against companies with budgets, and Picsel will not win it this
   year. Assistants are a different market: when someone asks ChatGPT or Gemini
   what a tradesman's website should have on it, the answer is assembled from
   whoever wrote the clearest, most quotable page on the subject, and the
   incumbents mostly wrote sales copy instead.

   So these pages are written to be QUOTED, not to rank:

     1. The question is the H1, in the words someone would actually ask.
     2. The answer is the first thing on the page and fits in about fifty
        words, because that is roughly what gets lifted. It has to be true and
        useful with no other sentence attached to it.
     3. Everything after that is the detail for a human who kept reading.
     4. FAQPage schema, so the question and its answer arrive as a pair rather
        than as a paragraph a machine has to guess the shape of.
     5. One link to the relevant plan, at the end, phrased as a fact. Nobody
        quotes a sales pitch, and a page that reads as one gets skipped by both
        readers.

   THE ANSWER FIELD IS LOAD-BEARING. `answer` is what goes in the schema and
   what an assistant is most likely to repeat, so it is written to be lifted:
   no "as we mentioned above", no "it depends", no sentence that needs the
   heading to make sense. If an edit makes it longer than about fifty words,
   the edit is wrong. */

import { SITE, absoluteUrl } from '../../site.config.js';
import { PLANS, money } from '../../pricing.js';
import { escapeHtml } from '../templates/page.js';
import { breadcrumbs } from '../templates/schema.js';
import { renderArticleSections } from '../partials/article-sections.js';
import { renderContactBand } from '../partials/contact-band.js';
import { renderBreadcrumbs } from '../partials/breadcrumbs.js';
import { PAGE_BLOB, PAGE_BLOB_SCRIPT } from '../partials/page-blob.js';

/* Referenced by the price guide so the figure it quotes is the figure on
   /prices. A guide that says "from £15" while the prices page says £19 is worse
   than a guide that names no number at all. */
const ONLINE = PLANS[0];
const GROWTH = PLANS[2];

/* FIELD REFERENCE
     slug      URL segment under /guides/. Permanent.
     question  The H1, and the question in the schema. Asked the way a customer
               asks it, not the way we would title an article.
     title     <title>. 60 characters max, enforced by the build.
     answer    The first paragraph and the schema answer. ~50 words, quotable
               standing alone.
     sections  The detail. h2 plus paragraphs; a section may carry a list.
               Paragraph and list copy is written into the page WITHOUT
               escaping, so it may carry a, em, strong and abbr and nothing
               else. The build enforces that: any other tag, any stray "<", and
               any tag left unclosed fails the build rather than reaching a
               browser.
     also      Extra question and answer pairs that join the FAQPage node. These
               are the follow-ups an assistant asks next.
     plan      Which plan this guide points at, and the plain sentence that does
               it. One link, at the end, never mid-paragraph.
     action    The one thing to do before the reader has scrolled. Points at
               the same service page this guide already links to from its
               body copy, so the two reinforce one destination rather than
               offering a second. See renderGuide for where it lands. */
const GUIDES = [
  {
    slug: 'what-a-trades-website-needs',
    question: "What should a tradesperson's website have on it?",
    title: "What a tradesman's website needs | Picsel",
    description:
      'Your phone number on every page, the jobs you do in the words customers use, the towns you cover, photos of your own work and a few reviews, little else.',
    answer:
      'Your phone number at the top of every page, the jobs you do written in the words ' +
      'customers use, the towns you cover, photos of your own work, and a few reviews. That is ' +
      'most of it. Everything else on a trades website is optional.',
    sections: [
      {
        h2: 'The phone number, where a thumb can reach it',
        paragraphs: [
          'Most people who land on your site are on a phone, standing in the room that needs ' +
            'doing, and they want to ring you. If they have to scroll to find the number, some ' +
            'of them ring the next firm instead. Put it at the top, make it a link that dials, ' +
            'and put it in the footer as well for anyone who has read the whole page.',
        ],
      },
      {
        h2: 'The jobs you do, in their words',
        paragraphs: [
          'Customers do not search for "bespoke domestic solutions". They search for a leaking ' +
            'shower, a flat roof, a rewire, a log burner. Write the list the way they would say ' +
            'it out loud, give each job its own few lines, and you have covered both the person ' +
            'reading and the search engine at the same time.',
          'This is also the single most common thing missing from a trades site. A homepage ' +
            'that says "quality workmanship, fully insured" and never names a job is invisible ' +
            'to someone looking for that job.',
        ],
      },
      {
        h2: 'Photos of your own work, not stock',
        paragraphs: [
          'Six real photographs off your own phone beat forty stock images of somebody else\'s ' +
            'kitchen. People are trying to work out whether you are real and whether your ' +
            'finish is any good, and a stock photo answers neither question. Before and after ' +
            'pairs work hardest.',
        ],
      },
      {
        h2: 'Reviews, where someone will actually read them',
        paragraphs: [
          'A handful of real reviews with the customer\'s first name and their town does more ' +
            'than a page of claims about yourself. Keep them honest and keep them short. If ' +
            'they all read like they were written by the same person, everyone can tell. For ' +
            'how to get more of them without hassling anyone, see <a ' +
            'href="/guides/how-to-get-more-google-reviews/">how to get more Google reviews</a>.',
        ],
      },
      {
        h2: 'The towns you cover',
        paragraphs: [
          'Name them. It is how someone decides whether to bother ringing, and it is what ' +
            'Google uses to work out which searches to show you for. One clear list beats a ' +
            'separate thin page for every village, which is a tactic that stopped working years ' +
            'ago and now reads as spam.',
        ],
      },
      {
        h2: 'What you can leave off',
        paragraphs: [
          'A slider that moves on its own. A blog nobody has posted to since 2021. A quote ' +
            'form with fourteen fields. A live chat box that nobody is behind. Each of these ' +
            'costs you customers, and the last one costs you the most, because an unanswered ' +
            'chat reads as a business that has closed.',
          'The five pages above are what we build, written for you rather than filled into a ' +
            'template: see <a href="/services/websites-for-tradespeople/">websites for ' +
            'tradespeople</a>.',
        ],
      },
    ],
    also: [
      {
        q: 'How many pages does a tradesman website need?',
        a:
          'Five is usually right: a homepage, a page listing the jobs you do, a page of your ' +
          'own photos, a page of reviews, and a contact page. Fewer and there is nothing for ' +
          'Google to match a search against. More and most of them go stale.',
      },
      {
        q: 'Do I need a blog on my website?',
        a:
          'No. A blog helps only if something goes on it regularly, and for most trades that ' +
          'never happens. A page per job you do is worth more than a blog nobody updates.',
      },
    ],
    plan: {
      id: 'online',
      line:
        'We build exactly this as a five page site, written for you, from ' +
        `${money(ONLINE.build)} to build and ${money(ONLINE.monthly)} a month to run.`,
    },
    action: {
      href: '/services/websites-for-tradespeople/',
      line: 'We build sites to exactly this list, not a template with your name dropped in.',
      cta: 'See websites for tradespeople',
    },
  },

  {
    slug: 'google-business-profile-not-showing',
    question: 'Why is my Google Business Profile not showing up?',
    title: 'Why your Google Business Profile is not showing',
    description:
      'Usually one of four things: it is not verified, the category is wrong, your details do not match, or an old duplicate is competing with it. All fixable.',
    answer:
      'Usually one of four things. It is not verified, the main category is wrong, your name ' +
      'address and phone number do not match what is on your website, or there is an older ' +
      'duplicate listing competing with it. All four are fixable, and most of them take a day.',
    sections: [
      {
        h2: 'Check it is actually verified',
        paragraphs: [
          'An unverified profile can exist, look complete, and never appear in the map results. ' +
            'Sign in and look for the verification badge or a prompt to verify. If Google asks ' +
            'for a video verification, do it properly: a continuous clip showing your van, your ' +
            'tools and your paperwork, without cutting.',
        ],
      },
      {
        h2: 'The main category decides almost everything',
        paragraphs: [
          'Google matches searches to your primary category far more strongly than to anything ' +
            'you have typed in your description. A plumber filed under "Handyman" will lose ' +
            'every plumbing search in the town to a plumber filed under "Plumber". Set the ' +
            'primary category to the exact trade, and use the secondary ones for the rest.',
        ],
      },
      {
        h2: 'Your details have to match everywhere',
        paragraphs: [
          'The business name, address and phone number on your profile need to be identical to ' +
            'the ones on your website and in any directory you are listed in. Not similar. ' +
            'Identical, down to whether it says Ltd. Mismatches are read as a sign that the ' +
            'listing might be for a different business, and the listing quietly gets trusted ' +
            'less.',
          'A word on the name itself: adding your keywords to it, so "Smith Plumbing" becomes ' +
            '"Smith Plumbing Heating Boilers Bathrooms", is against Google\'s rules. Google ' +
            'suspends profiles for it, and a competitor can report yours in about a minute. ' +
            'The same consistency matters on the website itself, covered in <a ' +
            'href="/guides/what-a-trades-website-needs/">what a tradesperson\'s website ' +
            'needs</a>.',
        ],
      },
      {
        h2: 'Look for a second listing you forgot about',
        paragraphs: [
          'Old profiles from a previous address, a previous business name, or one Google ' +
            'created on its own are extremely common, and two listings for one business split ' +
            'the trust between them. Search your own name and phone number on Google Maps and ' +
            'see what comes back. Duplicates can be merged or removed.',
        ],
      },
      {
        h2: 'The part nobody tells you about distance',
        paragraphs: [
          'The map results move depending on where the person searching is standing. You are ' +
            'not going to appear for someone twenty miles away as reliably as you do for ' +
            'someone in your own town, and no amount of work changes that. So if you are ' +
            'checking your own ranking from your kitchen, you are seeing your best case, not ' +
            'everyone\'s.',
        ],
      },
      {
        h2: 'Then keep it alive',
        paragraphs: [
          'A profile with photos added this month, reviews being answered and a post now and ' +
            'again outranks an identical one that has not been touched since it was set up. ' +
            'Activity is a signal in its own right. If you would rather hand the whole thing ' +
            'over, that is our <a href="/services/google-business-profile/">Google Business ' +
            'Profile</a> work.',
        ],
      },
    ],
    also: [
      {
        q: 'How long does a Google Business Profile take to show up?',
        a:
          'After verification, usually a few days to a couple of weeks before it settles into ' +
          'the map results. If a month goes by with nothing, assume it is broken and go looking ' +
          'for the reason.',
      },
      {
        q: 'Does a Google Business Profile cost anything?',
        a: 'No. It is free, and anyone charging you to create one is charging for a free thing.',
      },
    ],
    plan: {
      id: 'extras',
      href: '/prices/#extras',
      line:
        'If yours is wrong, unverified or has stopped showing, we do a one off Google Profile ' +
        'Rescue for £89, and it comes off the build fee if you have a site from us afterwards.',
    },
    action: {
      href: '/services/google-business-profile/',
      line: 'None of this is hard, but it is fiddly to get exactly right.',
      cta: 'See our Google Business Profile work',
    },
  },

  {
    slug: 'how-much-a-trades-website-costs',
    question: "How much should a tradesman's website cost?",
    title: "How much a tradesman's website should cost",
    description:
      'About £500 to £2,000 as a one off, or £15 to £120 a month on a subscription. What each price actually buys, what to ask before you pay, and what to avoid.',
    answer:
      'Roughly £500 to £2,000 as a one off for a small trades site, or £15 to £120 a month if ' +
      'it is built and looked after on a subscription. Below that you are usually buying a ' +
      'template nobody will maintain. Above it you are usually paying for an agency\'s office.',
    sections: [
      {
        h2: 'What you are actually paying for',
        paragraphs: [
          'Three separate things get bundled into one number and it is worth pulling them ' +
            'apart. There is the build, which happens once. There is the running of it, which ' +
            'is hosting, the security certificate and keeping the thing online. And there is ' +
            'the work to get you found, which is ongoing or it is nothing.',
          'A cheap quote nearly always means the third one is missing, and sometimes the ' +
            'second. That is fine if you know it. It is not fine if you find out in a year when ' +
            'the site has been offline for a fortnight and nobody noticed. There is a longer ' +
            'account of where the money in a typical agency quote actually goes in <a ' +
            'href="/blog/why-trades-websites-cost-so-much/">why trades websites cost so much</a>.',
        ],
      },
      {
        h2: 'One off, or monthly',
        paragraphs: [
          'A one off payment gets you a site you own outright and are then responsible for. A ' +
            'monthly plan spreads the cost and includes somebody keeping it working. Both are ' +
            'legitimate. What matters is whether you were told clearly which one you were ' +
            'buying.',
          'The thing to watch on a monthly deal is what happens at the end. Ask whether you can ' +
            'leave, what you take with you, and who owns the domain name. If the answer to the ' +
            'last one is not "you", walk away.',
        ],
      },
      {
        h2: 'Questions worth asking before you pay anyone',
        list: [
          'Who owns the domain name, and is it registered in my name?',
          'What happens to the site if I stop paying?',
          'Is the hosting and the security certificate included?',
          'Who do I ring when it breaks, and what does a change cost?',
          'Can I see three sites you have built that are still live?',
        ],
      },
      {
        h2: 'What a very cheap site actually costs',
        paragraphs: [
          'The £150 site is rarely a scam. It is usually real, and it is a template filled in ' +
            'once by somebody who has moved on. It sits there slowly going out of date, the ' +
            'contact form quietly stops sending, and nobody finds out for months. The money was ' +
            'not wasted so much as spent on something that needed a second half.',
          'What the second half looks like when it is included is set out on <a ' +
            'href="/services/websites-for-tradespeople/">websites for tradespeople</a>.',
        ],
      },
    ],
    also: [
      {
        q: 'Is a cheap website worth it for a tradesman?',
        a:
          'Yes, if it is genuinely maintained. A simple five page site that stays online, stays ' +
          'current and is linked to a proper Google listing does the job for most trades. The ' +
          'risk with a cheap site is that nobody is looking after it. The design is rarely what ' +
          'goes wrong.',
      },
      {
        q: 'Should I use Wix or Squarespace instead?',
        a:
          'You can, and for some people it is the right answer. It costs roughly £15 to £25 a ' +
          'month and the work is yours to do: writing it, keeping it current, and setting up ' +
          'the Google side yourself. What you are buying from anyone else is that work, not the ' +
          'software.',
      },
    ],
    plan: {
      id: 'prices',
      href: '/prices/',
      line:
        `Ours are on the page instead of in a quote: ${money(ONLINE.build)} to build and ` +
        `${money(ONLINE.monthly)} a month at the smallest, with everything each plan covers ` +
        'written down.',
    },
    action: {
      href: '/services/websites-for-tradespeople/',
      line: 'The version that includes hosting, the certificate and getting found is one plan.',
      cta: 'See websites for tradespeople',
    },
  },

  {
    slug: 'what-is-geo',
    question: 'What is GEO and why does it matter for trades?',
    title: 'What GEO is, and why it matters for trades',
    description:
      'GEO is getting your business quoted by AI assistants when someone asks one to recommend a tradesperson. It is what SEO is to Google, and why it matters.',
    answer:
      'GEO means getting your business quoted by AI assistants when someone asks one to ' +
      'recommend a tradesperson. It is to assistants what SEO is to Google. It matters because ' +
      'a customer who asks an assistant first never sees a results page at all.',
    sections: [
      {
        h2: 'What changed',
        paragraphs: [
          'Someone who needed a plumber used to type it into Google and pick from a list of ' +
            'links. A growing number now ask an assistant instead, in a full sentence, and get ' +
            'back two or three names with a reason attached. There is no page of ten blue links ' +
            'in that conversation. You are either one of the names or you are not in it.',
        ],
      },
      {
        h2: 'What an assistant needs from your site',
        paragraphs: [
          'An assistant is trying to answer a question, so it favours pages that answer ' +
            'questions. Plain sentences that state facts. Your trade, your towns, your prices ' +
            'if you publish them, your hours, how to reach you. Written so a single sentence ' +
            'can be lifted out and still be true on its own.',
          'It also has to work out whether you are one business or three with similar names. ' +
            'The same name, phone number and address on your site, your Google profile and ' +
            'every directory you appear in. That consistency is boring and it is most of the ' +
            'job. The specific things an assistant looks for on the site itself are the same ' +
            'list in <a href="/guides/what-a-trades-website-needs/">what a tradesperson\'s ' +
            'website needs</a>.',
        ],
      },
      {
        h2: 'What helps, in order',
        list: [
          'Pages that answer a real question in the first line',
          'The same business details everywhere, character for character',
          'A Google Business Profile that is verified, filled in and active',
          'Schema markup, which is the machine-readable version of what your page already says',
          'Reviews, which an assistant reads as evidence',
        ],
      },
      {
        h2: 'What does not help',
        paragraphs: [
          'Stuffing your trade and every town within thirty miles into a paragraph. Assistants ' +
            'are markedly worse than Google was at rewarding that, because summarising punishes ' +
            'filler in a way that keyword matching never did. A page of it gets summarised as ' +
            'nothing.',
          'Nobody can promise you a place in an ' +
            'assistant\'s answer, and anyone who does is guessing. What can be done is making ' +
            'sure that when one goes looking, everything it finds about you agrees with ' +
            'everything else.',
        ],
      },
      {
        h2: 'Why it is worth the trouble now',
        paragraphs: [
          'Search results for anything with money in them are held by companies who have spent ' +
            'a decade and a lot of money getting there. Assistant answers are not, yet. The gap ' +
            'will close. Right now a small firm with clear, well-marked-up pages can be quoted ' +
            'alongside a national one, which has not been true of Google for a long time.',
          'The monthly version of that work, done for you, is <a ' +
            'href="/services/search-and-ai-visibility/">search and AI visibility</a>.',
        ],
      },
    ],
    also: [
      {
        q: 'Is GEO different from SEO?',
        a:
          'It overlaps heavily and the foundations are the same: a fast, clear site with ' +
          'correct details. The difference is what you are optimising for. SEO wants a click ' +
          'from a results page. GEO wants your facts quoted correctly inside an answer where ' +
          'there may be no results page at all.',
      },
      {
        q: 'Should I block AI crawlers from my website?',
        a:
          'Not if you want to be recommended by one. Blocking them keeps you out of the ' +
          'answers. It is a reasonable choice for a publisher whose words are the product, and ' +
          'the wrong one for a tradesperson who wants the phone to ring.',
      },
    ],
    plan: {
      id: 'growth',
      line:
        `The schema, the listings and the monthly content this needs are the Growth plan, at ` +
        `${money(GROWTH.monthly)} a month.`,
    },
    action: {
      href: '/services/search-and-ai-visibility/',
      line: 'Keeping every detail consistent everywhere is ongoing work, done every month rather than once.',
      cta: 'See search and AI visibility',
    },
  },

  {
    slug: 'how-to-get-more-google-reviews',
    question: 'How do I get more Google reviews?',
    title: 'How to get more Google reviews | Picsel',
    description:
      'Ask every customer in person on the day the job finishes, and hand them a short review link. What stops it working, and two things that get you penalised.',
    answer:
      'Ask every customer in person, on the day the job finishes, and give them a short link ' +
      'straight to your review page. There is nothing else to it. The two things that stop it ' +
      'working are leaving it a week and asking by text, and asking everybody at once.',
    sections: [
      {
        h2: 'Get the short link first',
        paragraphs: [
          'Google gives every profile a review link. It is in your Business Profile under the ' +
            'option to ask for reviews, and it opens the review box straight away, skipping the ' +
            'listing page. Save it as a QR code on your phone and put it on your invoice. Asking ' +
            'someone to "find us on Google and leave a review" loses most of them at the ' +
            'finding. If yours has stopped showing up at all, sort that first: see <a ' +
            'href="/guides/google-business-profile-not-showing/">why is my Google Business ' +
            'Profile not showing up</a>.',
        ],
      },
      {
        h2: 'The timing matters more than the wording',
        paragraphs: [
          'The moment is when the job is finished, they are happy with it, and you are standing ' +
            'in front of them. A day later they are back at work and it is gone. Ask then, ' +
            'while your phone is in your hand, and offer to send the link there and then.',
        ],
      },
      {
        h2: 'What to say',
        paragraphs: [
          'Plainly, and without apologising for asking. Something like: "If you are happy with ' +
            'how it has turned out, a review on Google genuinely helps me. Shall I send you the ' +
            'link?" People say yes to that far more often than tradespeople expect, because ' +
            'most customers are pleased and simply have not thought of it.',
        ],
      },
      {
        h2: 'Answer every one of them',
        paragraphs: [
          'Reply to the good ones briefly and the bad ones carefully. A calm, specific reply to ' +
            'a poor review does more good than the review does harm, because the next person ' +
            'reading is judging how you handle a problem. Never argue, and never explain the ' +
            'customer to themselves in public.',
        ],
      },
      {
        h2: 'Two things that will get you in trouble',
        paragraphs: [
          'Do not buy reviews. They are traceable, they arrive in patterns, and Google removes ' +
            'them and sometimes the profile with them.',
          'Do not offer anything in return, not a discount and not a prize draw. Paying for ' +
            'reviews in kind is against Google\'s terms whether or not the review is honest, ' +
            'and a competitor who spots it can report it.',
        ],
      },
      {
        h2: 'A steady trickle beats a burst',
        paragraphs: [
          'Twenty reviews arriving in one week looks exactly like twenty bought reviews. Two or ' +
            'three a month, every month, is both more believable and more useful, because ' +
            'recent reviews carry more weight than old ones. Keeping that trickle going is part ' +
            'of <a href="/services/search-and-ai-visibility/">search and AI visibility</a>.',
        ],
      },
    ],
    also: [
      {
        q: 'How many Google reviews do I need?',
        a:
          'Enough to sit alongside whoever else comes up for your trade in your town, which is ' +
          'usually somewhere between ten and forty. Past that, how recent they are matters more ' +
          'than how many.',
      },
      {
        q: 'Can I remove a bad Google review?',
        a:
          'Only if it breaks Google\'s rules, meaning it is fake, abusive, or not about your ' +
          'business. You can report it, and it may or may not go. An honest bad review cannot ' +
          'be removed, so the reply is your answer to it.',
      },
    ],
    plan: {
      id: 'growth',
      line:
        'Asking for reviews and replying to them is part of the Growth plan, at ' +
        `${money(GROWTH.monthly)} a month, if you would rather it was somebody else\'s job.`,
    },
    action: {
      href: '/services/search-and-ai-visibility/',
      line: 'Asking at the right moment, every time, is the part most businesses drop.',
      cta: 'See search and AI visibility',
    },
  },
];

/* ---- One guide, as a page -------------------------------------------------
   The answer is rendered into its own block above everything else and styled to
   look like the answer, because it is: the whole page is a question and this is
   the reply. */
function renderGuide(guide) {
  const sections = renderArticleSections(guide.sections, 'guide');

  /* The one thing to do before the reader has scrolled. It sits under the
     answer rather than above the h1, because Task 6's breadcrumb already owns
     the top of the page, and it carries a single link rather than a card:
     the sticky mobile bar from Task 7 already carries Call, so a second
     button here would be the third phone route on the same small screen. */
  const action = `        <p class="guide__action">${escapeHtml(guide.action.line)} <a class="guide__action-link" href="${escapeHtml(guide.action.href)}">${escapeHtml(guide.action.cta)}</a>.</p>`;

  /* One array, fed to the visible nav below and to the JSON-LD in
     schemaExtra, so the two accounts of this page's place in the site
     cannot disagree. */
  const trail = [
    { name: 'Home', path: '/' },
    { name: 'Guides', path: '/guides/' },
    { name: guide.question, path: `/guides/${guide.slug}/` },
  ];

  /* The follow-up questions, visible as well as in the schema. Same rule as the
     homepage FAQ: writing them twice is how the machine-readable answer ends up
     contradicting the page it sits on. */
  const also = guide.also.length
    ? `        <section class="guide__section guide__also">
          <h2>While you are here</h2>
${guide.also
  .map(
    ({ q, a }) => `          <div class="guide__qa">
            <h3>${escapeHtml(q)}</h3>
            <p>${escapeHtml(a)}</p>
          </div>`,
  )
  .join('\n\n')}
        </section>`
    : '';

  /* One link, at the end, stated as a fact rather than sold. A guide that turns
     into a pitch halfway down gets closed by the human and skipped by the
     assistant, which loses both readers to save one sentence. */
  const plan = `        <aside class="guide__plan">
          <p>${escapeHtml(guide.plan.line)}</p>
          <a class="guide__plan-link" href="${escapeHtml(guide.plan.href || `/prices/#${guide.plan.id}`)}">See what that includes</a>
        </aside>`;

  const content = `${renderBreadcrumbs(trail)}

    <article class="section guide">
      <div class="wrap guide__inner">
        <h1 class="guide__question">${escapeHtml(guide.question)}</h1>

        <p class="guide__answer">${escapeHtml(guide.answer)}</p>

${action}

${sections}

${also}

${plan}
      </div>
    </article>`;

  return {
    path: `/guides/${guide.slug}/`,
    title: guide.title,
    description: guide.description,
    styles: ['/article.css'],
    schemaExtra: [
      {
        '@type': 'FAQPage',
        '@id': `${absoluteUrl(`/guides/${guide.slug}/`)}#faq`,
        mainEntity: [
          { q: guide.question, a: guide.answer },
          ...guide.also,
        ].map(({ q, a }) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
      },
      breadcrumbs(trail),
    ],
    content: [content, renderContactBand({
      heading: 'Want this done for you?',
      body: 'Ring and describe the job. We&rsquo;ll tell you what&rsquo;s involved and what it would cost, in plain English, with no obligation.',
    })].join('\n\n'),
  };
}

export const GUIDE_PAGES = GUIDES.map(renderGuide);

/* ---- The index ------------------------------------------------------------
   Each card carries the question and the answer in full rather than a teaser.
   A list of headlines is a page an assistant learns nothing from, and a
   visitor who gets their answer here and leaves satisfied is a better outcome
   than one who clicks through to get it. */
const INDEX_LIST = `      <ul class="guide-index">
${GUIDES.map(
  (guide) => `        <li class="guide-index__item">
          <h2 class="guide-index__q">
            <a href="/guides/${escapeHtml(guide.slug)}/">${escapeHtml(guide.question)}</a>
          </h2>
          <p class="guide-index__a">${escapeHtml(guide.answer)}</p>
        </li>`,
).join('\n\n')}
      </ul>`;

/* Declared once, ahead of the page object, so the visible trail prepended to
   content below and the JSON-LD in schemaExtra read from the same array. */
const GUIDES_INDEX_TRAIL = [
  { name: 'Home', path: '/' },
  { name: 'Guides', path: '/guides/' },
];

export const GUIDES_INDEX_PAGE = {
  path: '/guides/',
  title: 'Guides for tradespeople | Picsel',
  description:
    'Plain answers to five questions tradespeople actually ask about websites, Google Business Profiles, reviews and what any of it should cost. No sales pitch.',
  styles: ['/article.css'],
  schemaType: 'CollectionPage',
  schemaExtra: [
    {
      '@type': 'ItemList',
      name: 'Guides for tradespeople',
      numberOfItems: GUIDES.length,
      itemListElement: GUIDES.map((guide, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: guide.question,
        url: absoluteUrl(`/guides/${guide.slug}/`),
      })),
    },
    breadcrumbs(GUIDES_INDEX_TRAIL),
  ],
  extraScripts: PAGE_BLOB_SCRIPT,
  content: [
    renderBreadcrumbs(GUIDES_INDEX_TRAIL),
    `    <section class="section guides-head">
      <div class="wrap page-head">
        <div class="page-head__text">
          <p class="eyebrow">Guides</p>
          <h1>Questions tradespeople ask us</h1>
          <p class="lede measure">
            The answers we would give you on the phone, written down. Nothing here is gated,
            and none of it needs you to buy anything from ${escapeHtml(SITE.name)} to be useful.
            The opinions, rather than the plain answers, live in <a href="/blog/">the blog</a>.
          </p>
        </div>

${PAGE_BLOB}
      </div>
    </section>`,
    `    <section class="section guides-list" aria-labelledby="guides-list-heading">
      <div class="wrap">
        <h2 class="visually-hidden" id="guides-list-heading">All guides</h2>

${INDEX_LIST}
      </div>
    </section>`,
    renderContactBand(),
  ].join('\n\n'),
};
