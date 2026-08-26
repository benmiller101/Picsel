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

import { SITE, SHOW_PRICING, absoluteUrl } from '../../site.config.js';
import { PLANS, BUILD_FEE, money } from '../../pricing.js';
import { escapeHtml } from '../templates/page.js';
import { breadcrumbs } from '../templates/schema.js';
import { renderArticleSections } from '../partials/article-sections.js';
import {
  renderArticleRailLeft,
  renderArticleRailRight,
  renderArticleSentinelTop,
  renderArticleSentinelEnd,
  ARTICLE_RAILS_SCRIPT,
} from '../partials/article-rail.js';
import { renderContactBand } from '../partials/contact-band.js';
import { renderBreadcrumbs } from '../partials/breadcrumbs.js';
import { PAGE_BLOB, PAGE_BLOB_SCRIPT } from '../partials/page-blob.js';
import { countWord } from '../templates/words.js';

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
/* The index lists every guide, trade pages included, so that a spoke is never
   an orphan reachable only from the hub.

   ITS META DESCRIPTION COUNTS THEM, AND THE COUNT IS NOW DERIVED. It used to
   say "five questions" as a literal, with a build check to catch the day that
   stopped being true. The check fired on the first trade page, exactly as
   intended, and then the fix was going to be somebody typing a new number that
   would go stale again at the next page. So the sentence counts the list
   instead. A number nobody types is a number nobody has to remember.

   Written as a word rather than a digit because it is prose, and "Plain
   answers to 6 questions" reads like a spreadsheet. countWord and its list of
   words live in ../templates/words.js, shared with the rest of the site. */

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
        blocks: [
          { figure: { svg: 'trades-site-priority.svg', prefix: 'wa' } },
          {
            p:
              'Most people who land on your site are on a phone, standing in the room that ' +
              'needs doing, and they want to ring you. If they have to scroll to find the ' +
              'number, some of them ring the next firm instead. Put it at the top, make it a ' +
              'link that dials, and put it in the footer as well for anyone who has read the ' +
              'whole page.',
          },
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
        'We build exactly this as a five page site, written for you, for ' +
        `${money(BUILD_FEE)} to build and ${money(ONLINE.monthly)} a month to run.`,
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
        `Ours are on the page instead of in a quote: ${money(BUILD_FEE)} to build, the same ` +
        `on every plan, then from ${money(ONLINE.monthly)} a month, with everything each plan ` +
        'covers written down.',
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
        'The schema, the listings and the monthly content this needs are the Growth plan, ' +
        `at ${money(GROWTH.openingMonthly)} a month for the first ${GROWTH.openingMonths} ` +
        `months and ${money(GROWTH.monthly)} after.`,
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
        `${money(GROWTH.openingMonthly)} a month for the first ${GROWTH.openingMonths} months ` +
        `and ${money(GROWTH.monthly)} after, if you would rather it was somebody else\'s job.`,
    },
    action: {
      href: '/services/search-and-ai-visibility/',
      line: 'Asking at the right moment, every time, is the part most businesses drop.',
      cta: 'See search and AI visibility',
    },
  },
];

/* ---- The cost hub, and the per trade pages that hang off it ---------------
   /guides/how-much-a-trades-website-costs/ answers the broad question. Five
   per trade pages are coming: plumber, electrician, roofer, builder,
   scaffolder. Left to themselves they would compete with it and with each
   other for the same searches, Google would pick one more or less at random,
   and the broad page would lose the authority it already has.

   So the broad page is the hub and the trade pages are spokes. The hub links
   down to every spoke, and every spoke links back up, in body copy rather
   than only in the nav, which is what CLAUDEseo section 4 asks for. Neither
   direction is written by hand: both are generated from TRADE_COST_PAGES
   below, so a page and its two links arrive together or not at all.

   THE LIST IS EMPTY AND THE SITE IS CORRECT WITH IT EMPTY. Nothing here
   renders a heading with no list under it, and nothing links to a page that
   has not been built. Adding one entry adds the page, its sitemap line, its
   card on /guides/, its link from the hub and its link back. Removing the
   entry removes all six. */

/* The slug of the hub, written once. Both the hub section and the backlink on
   every spoke read it, so the two cannot end up pointing at different pages. */
const COST_HUB_SLUG = 'how-much-a-trades-website-costs';
const COST_HUB_PATH = `/guides/${COST_HUB_SLUG}/`;

/* The sentence that carries a spoke's link back to the hub, and the heading it
   sits under. One sentence, written once, printed on every trade page.

   IT IS A PLACEHOLDER AND THE BUILD REFUSES TO SHIP IT. Ben writes the copy on
   this site; inventing a sentence here and letting it go live would put words
   in his mouth on five pages at once. While TRADE_COST_PAGES is empty this
   costs nothing and the build passes. The moment a trade page is added, the
   build stops and asks for the sentence. See assertHubBacklinkWritten.

   The sentence may carry an <a>, like any other guide paragraph. If it does
   not carry one pointing at the hub, the build rejects it too: a backlink
   section with no backlink in it is the failure this whole structure exists
   to prevent, and it would be invisible on the page. */
const HUB_BACKLINK_TODO = 'TODO: write the sentence that links back to the cost guide.';

const HUB_BACKLINK = {
  h2: 'TODO: write the heading for the link back to the cost guide.',
  paragraph: HUB_BACKLINK_TODO,
};

/* FIELD REFERENCE for TRADE_COST_PAGES.

   The first three are what the hub section prints. The rest are the ordinary
   guide fields, because a trade page IS a guide: it is rendered by renderGuide
   like the five above, so it gets the same answer block, the same FAQPage
   schema, the same breadcrumbs and the same sitemap entry with no extra
   wiring.

     slug      URL segment under /guides/. Permanent once published.
     trade     The trade, capitalised as it would be written in a sentence.
               Printed as the link text in the hub section.
     summary   One line, printed under the link in the hub section. A sentence,
               not a teaser: somebody reading only the hub should get something
               from it.

     question  The H1 and the schema question, asked the way a customer asks it.
     title     <title>, 60 characters max, enforced by the build.
     description  The meta description, 155 characters max, enforced.
     answer    First paragraph and schema answer, about 50 words, quotable on
               its own.
     sections  The body. See the FIELD REFERENCE above GUIDES.
     also      Follow-up question and answer pairs for the FAQPage node.
     plan      Which plan the page points at, and the sentence that does it.
     action    The one thing to do, shown under the answer.

   The backlink to the hub is NOT a field. It is appended to sections by
   toGuide below, so it cannot be forgotten on a page and cannot drift from
   page to page. */
const TRADE_COST_PAGES = [
  {
    slug: 'builder-website-cost',
    trade: 'Builders',
    summary:
      'What a building firm pays, what each price buys, and why the site earns its keep after the quote goes in rather than before.',

    question: "How much does a builder's website cost?",
    title: "How much does a builder's website cost? UK, 2026",
    description:
      'Around £500 to £2,000 as a one off, or £15 to £120 a month. What each price buys a '
      + 'building firm, and why the site matters most after the quote goes in.',

    /* The Article node's image, and the same shot the page opens its closing
       section with. A social card showing the work is worth more than one
       showing a logo. */
    article: { image: '/assets/work/nevitt-construction/desktop.webp' },

    /* The five under "Common questions" are the FAQ, and the H1 is the
       article's headline rather than a sixth question. See renderGuide. */
    faqFromAlso: true,
    alsoHeading: 'Common questions',

    answer:
      'Between £500 and £2,000 as a one off for a small building firm, or £15 to £120 a month '
      + 'if it is built and looked after on a subscription. At the top end an agency will quote '
      + '£3,000 upwards, and for most builders that is money spent on process rather than on the '
      + 'website.',

    intro: [
      'For scale: the architect&rsquo;s drawings on a single extension run £350 to £950, and the '
      + 'extension itself averages £48,000. The website costs about the same as the drawings and '
      + 'it works on every job you quote for, not one.',
    ],

    sections: [
      {
        h2: 'What you are actually paying for',
        blocks: [
          { p: 'Price differences between builders&rsquo; websites come down to four things.' },
          {
            p: '<strong>Who writes it.</strong> A template filled in with your details takes an '
              + 'afternoon. A site written around the jobs you actually do, in the words '
              + 'homeowners search for, takes a few days and is the reason one ranks and the '
              + 'other does not.',
          },
          {
            p: '<strong>Whether anyone did the search work.</strong> &ldquo;Builder&rdquo; is '
              + 'unwinnable. &ldquo;Loft conversion [your town]&rdquo; is not. Someone has to '
              + 'work out which searches you can realistically win before a word is written, and '
              + 'plenty of cheap sites skip it entirely.',
          },
          {
            p: '<strong>Photos.</strong> Your own jobs, shot properly and compressed so the page '
              + 'still loads on a phone in a van. Stock images of somebody else&rsquo;s kitchen '
              + 'do the opposite of what you want.',
          },
          {
            p: '<strong>What happens afterwards.</strong> A site nobody touches for two years '
              + 'slides. Hosting, security, a monthly Google post, changes when your services '
              + 'change. This is the bulk of what a monthly fee buys and it is the part most one '
              + 'off quotes leave out.',
          },
        ],
      },

      {
        h2: 'The going rate, and what sits behind it',
        blocks: [
          {
            table: {
              caption: 'What a small building firm pays, by who builds it',
              head: ['What you buy', 'Typical UK cost'],
              rows: [
                ['Template site you build yourself', '£15 to £30 a month, plus your weekend'],
                ['Freelancer, one off build', '£500 to £1,500'],
                ['Small studio, built and maintained', '£15 to £120 a month, sometimes with a build fee'],
                ['Agency', '£3,000 to £10,000, plus a retainer'],
              ],
            },
          },
          /* Immediately after the table, because it is that table turned into
             comparable first year totals. Before it, it would be a chart of
             numbers the reader has not met yet. */
          { figure: { svg: 'builder-website-cost-comparison.svg', prefix: 'cc' } },
          /* Was five hardcoded figures and no gate, which made this and the
             paragraph further down the only Picsel prices on the site that
             survived SHOW_PRICING going false. Both now read from pricing.js
             and both disappear with everything else. */
          ...(SHOW_PRICING
            ? [{
                p: `Picsel sits in the third row. ${money(BUILD_FEE)} to build, then `
                  + `${money(PLANS[0].monthly)} a month for hosting and security, `
                  + `${money(PLANS[1].monthly)} a month if you want changes made for you, or `
                  + `${money(PLANS[2].openingMonthly)} a month for the first `
                  + `${countWord(PLANS[2].openingMonths)} months and ${money(PLANS[2].monthly)} after that `
                  + 'if you want us actively working on getting you found. Numbers on the '
                  + '<a href="/prices/">prices page</a>.',
              }]
            : [{
                p: 'Picsel sits in the third row. I am rebuilding my plans, so there is no '
                  + 'price list here to hold anyone against. <a href="/contact/">Send me the '
                  + 'details</a> and I will give you a figure for your own job.',
              }]),
        ],
      },

      {
        h2: '“I get all my work from word of mouth”',
        blocks: [
          {
            p: 'Most builders do, and it is the best way to get work there is. A website does '
              + 'not replace it. It stops it leaking.',
          },
          {
            p: 'Here is what actually happens. Someone recommends you to a neighbour. The '
              + 'neighbour has your name and your number and nothing else, and they are about to '
              + 'let a stranger work on their house for three to six months. So they look you '
              + 'up. If they find a Facebook page whose last post was 2023, or a Checkatrade '
              + 'profile that helpfully shows them two other builders on the same screen, the '
              + 'recommendation you earned starts competing with people who did nothing to earn '
              + 'it.',
          },
          { figure: { svg: 'builder-word-of-mouth-flow.svg', prefix: 'wom' } },
          {
            p: 'I ran a house clearance company before I did this. Every job came from word of '
              + 'mouth or from our own website, and the two were not separate things. Word of '
              + 'mouth got us named. The website was what people found when they went and '
              + 'checked.',
          },
          {
            p: 'That is what a builder&rsquo;s website is for. Not leads. Confirmation.',
          },
        ],
      },

      {
        h2: 'What a builder’s site needs that other trades do not',
        blocks: [
          {
            p: '<strong>Previous jobs, in volume.</strong> A homeowner spending £48,000 wants to '
              + 'see twenty jobs, not three. Before and after on the same extension does more '
              + 'work than any paragraph you could write.',
          },
          {
            p: '<strong>How long you have been going.</strong> A firm that has been trading '
              + 'since 1975 should say so in the first screen. It is the single strongest thing '
              + 'a long standing builder owns and it is free.',
          },
          {
            p: '<strong>Separate pages for separate jobs.</strong> Extensions, loft conversions, '
              + 'garage conversions, new builds and renovations are different searches by '
              + 'different people with different budgets. One &ldquo;Services&rdquo; page trying '
              + 'to catch all five catches none.',
          },
          {
            p: '<strong>The awkward questions answered.</strong> How long will it take, what '
              + 'happens if it overruns, do you handle building control, do you use your own '
              + 'trades or subcontract. Every homeowner wants to ask and most are too polite. '
              + 'Answer them on the page and you will spend less time on the phone with people '
              + 'who were never going to book.',
          },
          {
            p: '<strong>Somewhere for the reviews to live.</strong> Copy them onto your own site '
              + 'rather than leaving them on a platform you do not control.',
          },
        ],
      },

      {
        h2: 'What a very cheap site actually costs',
        blocks: [
          {
            p: 'The £99 and free builds usually recover the money somewhere else. Three things '
              + 'worth checking before you sign anything.',
          },
          {
            p: '<strong>Who owns the domain.</strong> If it is registered in their name and you '
              + 'leave, you lose your web address, and any ranking attached to it. Ask to be '
              + 'listed as the registrant. If the answer is complicated, that is the answer.',
          },
          {
            p: '<strong>Whether you can leave.</strong> A twelve month term is reasonable. '
              + 'Automatic renewal you have to give ninety days notice to escape is not.',
          },
          {
            p: '<strong>What a change costs.</strong> Some cheap builds are cheap until you want '
              + 'a phone number updated, and then it is £75 and a fortnight.',
          },
        ],
      },

      {
        h2: 'Questions worth asking before you pay anyone',
        blocks: [
          {
            orderedList: [
              'Will I own the domain name?',
              'What exactly happens if I want to leave, and when?',
              'Which searches are you building this to win?',
              'What does a change cost me after launch?',
              'Can I see a site you built for a builder, live?',
            ],
          },
          {
            p: 'Any of those getting a vague answer tells you more than the price does.',
          },
        ],
      },

      {
        h2: 'If you want it done for you',
        blocks: [
          ...(SHOW_PRICING
            ? [{
                p: `Picsel builds websites for building firms anywhere in the UK. ${money(BUILD_FEE)} to build, `
                  + `then from ${money(PLANS[0].monthly)} a month, and live in days.`,
              }]
            : [{
                p: 'Picsel builds websites for building firms anywhere in the UK. I am rebuilding '
                  + 'my plans, so there is no price list here to hold anyone against. '
                  + '<a href="/contact/">Send me the details</a> and I will give you a figure for '
                  + 'your own job.',
              }]),
          {
            /* Read from site.config.js rather than typed. This was the last
               hardcoded phone number in the source, and a number written into
               a page separately from the one the footer shows is two numbers
               that agree until somebody changes one of them. */
            p: `Call Ben on <a href="${escapeHtml(SITE.contact.phoneHref)}">${escapeHtml(SITE.contact.phoneDisplay)}</a> or `
              + '<a href="/contact/">send a message</a>. Have a look at '
              + '<a href="/work/nevitt-construction/">A Nevitt Construction</a>, a family firm '
              + 'going since 1975.',
          },
          /* The client's own work, beside the link to their page. No Picsel mark
             on either: the diagrams carry it and that is the only place it
             belongs on somebody else's site. Captured by npm run shots. */
          {
            figure: {
              images: [
                {
                  src: '/assets/work/nevitt-construction/desktop.webp',
                  alt: 'The A Nevitt Construction website, built by Picsel, showing their extension and new build work',
                  width: 1440,
                  height: 900,
                },
                {
                  src: '/assets/work/nevitt-construction/mobile.webp',
                  alt: 'The same A Nevitt Construction website on a phone',
                  width: 780,
                  height: 1688,
                },
              ],
            },
          },
          {
            p: 'More on <a href="/guides/how-much-a-trades-website-costs/">what a website costs '
              + 'across the trades</a>, or what is included on the '
              + '<a href="/services/websites-for-tradespeople/">websites for tradespeople</a> '
              + 'page.',
          },
        ],
      },
    ],

    also: [
      {
        q: 'Is a website worth it if I am already busy?',
        a:
          'Being busy is when to build one, because search takes three to six months to do '
          + 'anything. A site built in a quiet month is already too late for that quiet month. '
          + 'The other reason is that a website changes which jobs you get offered rather than '
          + 'only how many. A firm that shows twenty finished extensions gets asked to quote for '
          + 'extensions. A firm with a phone number gets asked for anything.',
      },
      {
        q: 'Should I just use Checkatrade instead?',
        a:
          'If your customers use Checkatrade, it is a reasonable place to be, and plenty of '
          + 'builders get real work from it. Worth knowing what it is though. It puts you in a '
          + 'list next to your competitors, the profile belongs to them and not to you, and it '
          + 'does not publish what it charges, so you cannot compare it against anything until '
          + 'you have rung them. Most builders end up doing both, and the site is the half you '
          + 'own.',
      },
      {
        q: 'What about Wix or Squarespace?',
        a:
          'If you enjoy that sort of thing and have a free weekend, they work, and £20 a month '
          + 'is honest value. Most builders never finish. The site sits at 80% done for a year '
          + 'with placeholder text still on the about page. The question is not whether the tool '
          + 'is any good, it is whether you are going to spend the weekend.',
      },
      {
        q: "How long does a builder's website take to build?",
        a:
          'Days rather than months, if whoever is building it is organised. What holds it up is '
          + 'almost always photos. Have thirty pictures of finished jobs on your phone ready to '
          + 'send and the whole thing moves quickly.',
      },
      {
        q: 'Will it get me to the top of Google?',
        a:
          'Not on its own, and anyone promising that should worry you. A new site takes months '
          + 'before positions move, and it moves in an order: you get seen, then you climb, then '
          + 'you get clicks, then you get calls. Where a website earns its money quickly is the '
          + 'person who already has your name and is checking you out.',
      },
    ],
  },
];

/* A trade entry, as an ordinary guide record.

   THE BACKLINK IS ONLY APPENDED IF THE PAGE HAS NOT ALREADY WRITTEN ONE. The
   structure's promise is that every spoke links back to the hub in body copy,
   not that every spoke ends with a section headed the same way. A page whose
   own closing paragraph already sends the reader to the hub has kept the
   promise, and bolting a second link underneath it would be the renderer
   talking over the copy.

   So the appended section is a floor rather than a fixture: it guarantees the
   link exists, and gets out of the way when it already does.

   The check reads the rendered blocks rather than trusting a flag on the
   entry, because a flag is a claim somebody has to remember to keep true and
   this is the fact itself. */
function linksToHub(entry) {
  const strings = (entry.sections || []).flatMap((section) => [
    ...(section.blocks || []).map((block) => block.p || ''),
    ...(section.blocks || []).flatMap((block) => block.list || block.orderedList || []),
    ...(section.paragraphs || []),
    ...(section.list || []),
  ]);

  return strings.some((text) => String(text).includes(`href="${COST_HUB_PATH}"`));
}

function toGuide(entry) {
  if (linksToHub(entry)) return entry;

  return {
    ...entry,
    sections: [
      ...entry.sections,
      { h2: HUB_BACKLINK.h2, paragraphs: [HUB_BACKLINK.paragraph] },
    ],
  };
}

/* The two checks that keep the placeholder above from ever reaching a page.
   Run at module load, which is build time, so a broken structure is a failed
   build rather than a live page with the word TODO on it.

   Both are silent while there are no trade pages. That is the point: the
   structure ships now, empty and harmless, and starts insisting on copy at
   the exact moment copy would become visible. */
function assertHubBacklinkWritten() {
  /* Only the entries that have not written their own backlink need this copy.
     A list where every page links to the hub in its own words never asks for
     it, which is the correct answer and not a loophole: the thing being
     guarded is the link, and the link is there. */
  if (!TRADE_COST_PAGES.some((entry) => !linksToHub(entry))) return;

  const unwritten = [HUB_BACKLINK.h2, HUB_BACKLINK.paragraph]
    .some((text) => text.startsWith('TODO'));

  if (unwritten) {
    throw new Error(
      'guides.js: TRADE_COST_PAGES has entries but HUB_BACKLINK is still the '
      + 'placeholder. Every trade page prints that heading and sentence, so '
      + 'publishing now would put "TODO" on all of them. Write both in '
      + 'tools/pages/guides.js, then build again.',
    );
  }

  if (!HUB_BACKLINK.paragraph.includes(`href="${COST_HUB_PATH}"`)) {
    throw new Error(
      `guides.js: HUB_BACKLINK.paragraph does not link to ${COST_HUB_PATH}. `
      + 'The section exists to carry that link in body copy; without it the '
      + 'trade pages compete with the hub instead of feeding it. Add an <a> '
      + 'pointing at the hub.',
    );
  }
}

assertHubBacklinkWritten();

/* The hub section, printed at the foot of the broad cost guide.

   RETURNS NOTHING AT ALL WHEN THERE ARE NO TRADE PAGES, which is the whole
   requirement. An empty heading tells a reader a section is missing and tells
   a crawler the page is thin, and both are true only because the markup said
   so. */
function renderTradeCostHub() {
  if (!TRADE_COST_PAGES.length) return '';

  /* One newline, named because a bare escape inside a join() reads as a typo
     next to the template literals above it. */
  const ROW_SEPARATOR = String.fromCharCode(10);

  /* A description list, not a bulleted one. Each row is a term and its
     description, which is exactly what a trade and its summary are, and it
     avoids putting a <span> inside an <li>: findUnescapedCopy in build.js
     allows only a, em, strong and abbr in there, because everything inside a
     list item on this site is normally unescaped studio copy. That rule is
     worth more than this markup, so this markup moved. */
  const rows = TRADE_COST_PAGES.map(
    ({ slug, trade, summary }) => `            <dt class="guide__trade">
              <a href="/guides/${escapeHtml(slug)}/">${escapeHtml(trade)}</a>
            </dt>
            <dd class="guide__trade-summary">${escapeHtml(summary)}</dd>`,
  ).join(ROW_SEPARATOR);

  return `        <section class="guide__section guide__trades">
          <h2>What it costs for your trade</h2>
          <dl class="guide__trade-list">
${rows}
          </dl>
        </section>

`;
}

/* ---- One guide, as a page -------------------------------------------------
   The answer is rendered into its own block above everything else and styled to
   look like the answer, because it is: the whole page is a question and this is
   the reply. */
function renderGuide(guide) {
  const nl = String.fromCharCode(10);
  const sections = renderArticleSections(guide.sections, 'guide');

  /* The one thing to do before the reader has scrolled. It sits under the
     answer rather than above the h1, because Task 6's breadcrumb already owns
     the top of the page, and it carries a single link rather than a card:
     the sticky mobile bar from Task 7 already carries Call, so a second
     button here would be the third phone route on the same small screen. */
  /* Optional, since August 2026. The five original guides each carry one, and
     a page written elsewhere as finished copy may not: this one closes with
     its own section that does the same job in its own words. An action line
     invented to fill the slot would be a sentence nobody wrote. */
  const action = guide.action
    ? `        <p class="guide__action">${escapeHtml(guide.action.line)} <a class="guide__action-link" href="${escapeHtml(guide.action.href)}">${escapeHtml(guide.action.cta)}</a>.</p>`
    : '';

  /* Lead paragraphs between the answer and the first h2. The answer field is
     the one that has to stand alone in a schema block and get lifted whole, so
     it is kept to about fifty words. A page whose opening runs to two
     paragraphs puts the second here rather than making the first too long to
     quote. */
  /* Carries its own trailing gap when there is one, and is otherwise the empty
     string, so a guide without an intro renders exactly as it did before this
     field existed. The five published guides are byte for byte unchanged. */
  const intro = guide.intro
    ? `${guide.intro.map((text) => `        <p class="guide__intro">${text}</p>`).join(nl)}${nl}${nl}`
    : '';

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
          <h2>${escapeHtml(guide.alsoHeading || 'While you are here')}</h2>
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
  /* Every one of these asides names a Picsel figure, so the whole block goes
     while SHOW_PRICING is off rather than being reworded into a price-free
     version of itself. The guide loses nothing it needed: the action line
     further up already points at the service page that does the work, and an
     aside whose only job was "and here is what that costs" has no job left.

     The `plan` data stays in the guide records above so this comes back
     whole. */
  const plan = SHOW_PRICING && guide.plan
    ? `        <aside class="guide__plan">
          <p>${escapeHtml(guide.plan.line)}</p>
          <a class="guide__plan-link" href="${escapeHtml(guide.plan.href || `/prices/#${guide.plan.id}`)}">See what that includes</a>
        </aside>`
    : '';

  /* The hub section, and only on the hub. It sits after the follow-up
     questions and before the plan aside: past the point where the broad
     question has been answered, and still above the one link that sells.

     Every other guide gets an empty string, and so does the hub while the
     trade list is empty. The section carries its own trailing blank line when
     it renders, so an empty hub adds not one character to any page: the five
     existing guides build byte for byte as they did before this was written,
     which keeps a structural change out of the diff of five files it did not
     change. */
  const trades = guide.slug === COST_HUB_SLUG ? renderTradeCostHub() : '';

  const content = `${renderBreadcrumbs(trail)}

    <article class="section guide">
      <div class="wrap guide__inner">
        <div class="guide__cols">
${renderArticleRailLeft({
    prefix: 'guide',
    sections: guide.sections,
    headline: guide.question,
  })}

          <div class="guide__col">
${renderArticleSentinelTop('guide')}
        <p class="guide__answer">${escapeHtml(guide.answer)}</p>

${intro}${action}

${sections}

${also}

${trades}${plan}
${renderArticleSentinelEnd('guide')}
          </div>

${renderArticleRailRight({ prefix: 'guide' })}
        </div>
      </div>
    </article>`;

  return {
    path: `/guides/${guide.slug}/`,
    title: guide.title,
    description: guide.description,
    styles: ['/article.css'],
    extraScripts: ARTICLE_RAILS_SCRIPT,
    schemaExtra: [
      /* An Article node only where a guide asks for one. The five original
         guides are a question and its answer and nothing else, and describing
         those as an Article says less about them than FAQPage already does.
         A page long enough to have a headline, a body and a subject is an
         Article, and saying so is what lets it be understood as one thing
         rather than as a bag of questions. */
      ...(guide.article
        ? [{
          '@type': 'Article',
          '@id': `${absoluteUrl(`/guides/${guide.slug}/`)}#article`,
          headline: guide.question,
          description: guide.description,
          articleSection: 'Guides',
          inLanguage: 'en-GB',
          mainEntityOfPage: { '@type': 'WebPage', '@id': absoluteUrl(`/guides/${guide.slug}/`) },
          ...(guide.article.image ? { image: absoluteUrl(guide.article.image) } : {}),
        }]
        : []),
      {
        '@type': 'FAQPage',
        '@id': `${absoluteUrl(`/guides/${guide.slug}/`)}#faq`,
        /* Normally the page's own question leads the list, because on a
           guide the H1 IS a question and its answer is the first paragraph.
           A guide carrying `faqFromAlso` says otherwise: its H1 is the
           article's headline and the questions it wants indexed are the ones
           written under the follow-ups heading. Describing the headline as a
           sixth FAQ entry there would put a question in the schema that the
           page does not present as one. */
        mainEntity: (guide.faqFromAlso
          ? guide.also
          : [{ q: guide.question, a: guide.answer }, ...guide.also]
        ).map(({ q, a }) => ({
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

/* The five written guides, then the trade pages, in one list. Everything
   downstream reads this rather than GUIDES: the page list in build.js, the
   sitemap that is written from it, the /guides/ index and the ItemList
   schema on it. That is what makes a new trade page and its sitemap entry
   arrive in the same commit without anybody remembering to do it, which is
   the Sitemap Law working by construction instead of by discipline. */
const ALL_GUIDES = [...GUIDES, ...TRADE_COST_PAGES.map(toGuide)];

export const GUIDE_PAGES = ALL_GUIDES.map(renderGuide);

/* ---- The index ------------------------------------------------------------
   Each card carries the question and the answer in full rather than a teaser.
   A list of headlines is a page an assistant learns nothing from, and a
   visitor who gets their answer here and leaves satisfied is a better outcome
   than one who clicks through to get it. */
const INDEX_LIST = `      <ul class="guide-index">
${ALL_GUIDES.map(
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

const INDEX_DESCRIPTION =
  `Plain answers to ${countWord(ALL_GUIDES.length)} questions tradespeople actually ask about `
  + 'websites, Google Business Profiles, reviews and what any of it should cost. No sales pitch.';

export const GUIDES_INDEX_PAGE = {
  path: '/guides/',
  title: 'Guides for tradespeople | Picsel',
  description: INDEX_DESCRIPTION,
  styles: ['/article.css'],
  schemaType: 'CollectionPage',
  schemaExtra: [
    {
      '@type': 'ItemList',
      name: 'Guides for tradespeople',
      numberOfItems: ALL_GUIDES.length,
      itemListElement: ALL_GUIDES.map((guide, index) => ({
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
