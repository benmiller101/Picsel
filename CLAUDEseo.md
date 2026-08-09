# CLAUDE.md — SEO & AEO Build Standards

This file governs the search side of every website you build in this project. It sits alongside
the design standards file. Design decides whether the site looks human-made; this file decides
whether anyone ever finds it.

Two audiences now read every page: Google's crawler and the AI assistants (ChatGPT, Google AI
Overviews and AI Mode, Perplexity, Gemini, Copilot). They are not separate jobs. Roughly 76% of
AI-cited pages were already ranking in Google's top 10, so traditional SEO is the foundation.
But the AI layer has its own rules, and they are in here too.

Everything in this file must be done **during the build**. If it can't be completed before
handover, it belongs in the client's ongoing checklist instead, not here.

---

## 0. The one rule that matters most

Every page must answer one specific question for one specific person, completely, in a way a
machine can extract without needing the rest of the page. If you can't state in a sentence which
search a page exists to win, the page isn't ready to build.

Specificity beats volume in both channels. AI chooses specific fiction over vague truth, so
vague copy loses even when it's accurate. Name the towns, the prices, the timescales, the
services. Never write "the local area" or "competitive rates."

---

## 1. Before you write any page

Do this first. Report the findings back before building.

1. Confirm the primary service, the secondary services, and the exact service area (name the
   towns and postcodes, don't accept "the Midlands").
2. Google the main service plus the main town. Record what's actually there: is there an AI
   overview, a map pack, what page types rank. That's the intent, and you match it or you lose.
3. Ask ChatGPT and Google AI Mode a buying question in the client's category and area
   ("who does scaffolding in Derby", "best builder near me for an extension"). Record which
   competitors get named. That's the real competitive set, and it's usually not the one the
   client assumes.
4. Produce 10 to 15 target keywords. Each must pass all three:
   - **Business potential:** does ranking for this produce an enquiry, or just a visitor?
   - **Intent:** does the current top 10 match the page type you intend to build?
   - **Difficulty:** are there low-authority sites in the top 10? If yes, it's winnable.
5. Apply the AI filter. If an AI overview already fully answers the query, that keyword is a
   **mention target**, not a click target. Build for being named in the answer, not for the click.
6. Identify the money pages: the URLs whose job is to convert. These get built and optimised
   first, before any blog or guide content.
7. Map one topic cluster supporting the main money page. Do not scatter across five topics.

**Do not skip to building because the client "just wants a simple site."** Ten minutes of this
determines whether the whole build earns anything.

---

## 2. Site structure

- Money pages exist before content pages. Service pages, area pages, pricing or quote page,
  contact. Content that has nowhere to convert is wasted traffic.
- **One page per service.** Never one "Services" page trying to rank for five things.
- One page per priority location, and each must have genuinely different content. Near-duplicate
  town pages with the name swapped are worse than not having them.
- URLs: short, lowercase, hyphenated, keyword included, no dates, no CMS-generated strings.
  `/services/scaffolding-hire/`, `/areas/derby/`. Never `/page-id-4471`.
- Every page reachable within three clicks of the homepage.
- Generate `sitemap.xml`.
- Build a real 404 page with navigation and a call to action. AI assistants invent URLs and send
  users to pages that don't exist roughly three times more often than Google does. That 404 is a
  real visitor, so don't waste them.

---

## 3. On-page requirements, every page, no exceptions

Run this on each page before you consider it finished.

- **Title tag** under 60 characters, keyword front-loaded. Benefit-driven on money pages.
- **Exactly one H1**, mirroring the title tag.
- **Heading hierarchy that is actually correct.** H2 for main sections, H3 nested under them.
  Never skip a level, never use a heading for styling. AI chunks content at heading boundaries,
  so a broken hierarchy breaks extraction.
- **Meta description** 150 to 160 characters, written like ad copy, keyword included. It isn't a
  ranking factor, it decides the click.
- Target keyword appears naturally within the first 100 words.
- **Contextual internal links in the body copy**, not just the nav. Minimum two in and two out
  per page, and every content page links to its money page. This has the best effort-to-value
  ratio of anything in this file and it is the step most often skipped. Do not skip it.
- Image filenames descriptive. Never `IMG_4471.jpg`.
- Alt text on every meaningful image, written as if describing it to someone who can't see it.
  Not keyword stuffing, not "image of image".
- All images compressed, served as WebP, with correct dimensions.
- Call to action above the fold and repeated at the bottom.
- Phone number visible on every page, click-to-call on mobile.

---

## 4. How to write the copy

These four principles serve human readers and machine extraction at the same time. Apply them to
every page with real copy on it.

**BLUF — bottom line up front.** Open every section with the answer, then give context. Humans
scan in an F-pattern and language models weight the beginning and end of a passage more heavily
than the middle. A key point buried three paragraphs in gets missed by both.

- Bad: "Over the past few years, scaffolding regulations have evolved considerably..."
- Good: "Scaffolding for a two-storey extension typically costs £900 to £1,400 for a four-week hire."

**Atomic sections.** Every section must stand alone. Take any H2, read it with nothing around it,
and check it still makes sense. AI systems chunk pages into pieces and you cannot control where
the cuts fall, so meaning has to survive being isolated. If a section depends on context from
three paragraphs earlier, rewrite it.

**Entity-rich writing.** Name things. Specific brands, products, places, materials, standards,
numbers. "We cover Derby, Nottingham and Burton upon Trent" rather than "we cover the local
area." "TG20:21 compliant" rather than "fully compliant." Entities and their relationships are
how models understand text.

**Simple and declarative.** Short sentences, one idea each, subject-verb-object. If a sentence
needs two reads, split it. This is not dumbing down, it's making the content parsable.

Additional copy rules:

- Length is set by what the topic needs, not by a target. Over half of AI-cited pages are under
  1,000 words. Correlation between word count and being cited is effectively zero. Do not pad.
- Every page needs at least one thing a competitor cannot copy: real job photos, a real number,
  the owner's actual opinion, a named case study, a specific local detail.
- Cover the full topic. If the ranking pages cover process, cost and timescales, cover all three.
  Half a topic loses to a complete one.
- Apply the project's human-copy rules. Nothing may read as AI-generated.

---

## 5. Formats that get cited

Around 44% of pages AI cites are listicles and comparison content, because those formats help it
build consensus. Build at least three of these into every site:

- **FAQ section on money pages.** Real customer questions, one direct answer each, question as a
  heading. This is the highest-value structure for AI extraction on a small business site.
- **A pricing page with actual ranges.** "How much does X cost" is the most searched question in
  trades and most competitors dodge it. Include real numbers, explain what moves the price.
- **A process page.** Step by step, what happens from enquiry to completed job.
- **Comparison content** where it genuinely fits (composite vs timber, tower hire vs full scaffold).
- **A calculator or estimator tool** where the client's service allows it. Tool queries still get
  clicks because AI can't do the task for the user, and they attract links naturally.

---

## 6. Local SEO — non-negotiable for trades

- Google Business Profile claimed, verified, and **every field completed**: categories, services,
  service area, hours, description, attributes. Minimum 10 real photos.
- NAP (name, address, phone) identical on the site and on GBP, character for character, including
  formatting. Any mismatch is a signal problem.
- NAP in the site footer.
- Embedded map on the contact page.
- `LocalBusiness` schema matching the GBP details exactly.
- Core citations: Bing Places, Apple Business Connect, Yell, Facebook, plus the relevant trade
  directory.
- Hand the client a review request method (link, QR code, or text template) at handover.

---

## 7. Technical

**AI crawler access — check this on every build, it takes five minutes.**

- Read `robots.txt`. Look for and remove any `Disallow` targeting `GPTBot`, `OAI-SearchBot`,
  `ChatGPT-User`, `ClaudeBot`, `Google-Extended`, `PerplexityBot`. Around 1 in 17 sites blocks
  these without knowing, usually inherited from a template.
- If the site is behind Cloudflare, check the AI bot blocking setting. It is enabled by default in
  some configurations and will silently remove the client from ChatGPT entirely.
- Report explicitly whether crawlers were blocked and what you changed. Never assume it's fine.

**JavaScript rendering.** Gemini and Copilot render JavaScript. ChatGPT's crawler does not. Load
the site with JavaScript disabled: if the content disappears, ChatGPT sees an empty shell. Use
static output or server-side rendering. For these builds, prefer static HTML where possible.

**Speed.** Core Web Vitals passing on mobile. During real-time AI retrieval a slow page can be
dropped before it's even scored, so speed matters more here than in traditional search.

**Everything else:**

- HTTPS enforced, single canonical version (www vs non-www redirect set).
- Semantic HTML. Clean structure is what makes chunking work.
- Schema: `LocalBusiness`, `Service`, `FAQPage`, `Organization` where relevant. Evidence that
  schema directly improves AI citation is mixed, but it costs nothing and helps traditional search.
- No broken internal links, no orphan pages, no duplicate titles or meta descriptions.
- Favicon, OG image, social preview tags.
- Forms tested end to end. Confirmation received, spam protection on.

Skip `llms.txt`. No major provider officially supports it yet. Don't spend time on it.

---

## 8. Measurement, configured before launch

- Google Search Console verified, sitemap submitted.
- Analytics installed and confirmed firing.
- **AI traffic channel configured**, matching on: `chatgpt.com`, `chat.openai.com`, `perplexity`,
  `gemini.google.com`, `copilot.microsoft.com`, `claude.ai`.
- Conversion tracking on form submissions and click-to-call.
- **"How did you hear about us?" field on the enquiry form, with an AI assistant option.** Most
  AI-driven enquiries arrive as direct traffic because the user hears the name in a chat answer
  and types it into the browser later. Asking is the only reliable way to catch them.

---

## 9. Baseline before handover

Capture these on day one so progress is provable in three months.

- Current position for the top three target keywords.
- Screenshots of ChatGPT, Google AI Mode and Perplexity answering a buying question in the
  client's category and area, showing whether the client is named and who is named instead.
- Starting GBP review count and average rating.
- Search Console starting state.

Save all of it to the client folder.

---

## 10. Always check your work when done

Do a real verification pass before calling the build finished. Do not stop when the code runs.

1. **Crawl the site** (Screaming Frog, free to 500 URLs, or equivalent). Fix everything it flags:
   broken links, missing titles, duplicate metas, missing alt text, redirect chains.
2. **Run the checklist below.** Every item must be YES.
3. **Read your own copy out loud.** Does it sound like any trade website anywhere? Rewrite it with
   specifics until it could only be this business.
4. **Take one H2 section at random and read it in isolation.** Does it still make sense? If not,
   the atomic content rule isn't being followed and other sections will fail too.
5. **Load the site with JavaScript disabled** and confirm the content is still there.
6. **Report back**: what you checked, what you found, what you changed, and anything you couldn't
   do that needs to go on the client's ongoing list.

### Pre-launch checklist (every item must be YES)

- [ ] Is there a money page for every service, built before any content pages?
- [ ] Does every page have exactly one H1 matching its title tag?
- [ ] Is the heading hierarchy correct with no skipped levels?
- [ ] Does every page have contextual internal links in the body copy, in and out?
- [ ] Does every section pass the read-it-in-isolation test?
- [ ] Does every page open its sections with the answer rather than a windup?
- [ ] Are the towns, prices, timescales and services named specifically, with no vague filler?
- [ ] Is there an FAQ section on the money pages?
- [ ] Is there a pricing page with real ranges?
- [ ] Has robots.txt been read and confirmed clear of AI crawler blocks?
- [ ] Has Cloudflare's AI bot setting been checked, if applicable?
- [ ] Does content still render with JavaScript disabled?
- [ ] Does every image have descriptive alt text and a real filename?
- [ ] Is NAP identical between the site and GBP?
- [ ] Is LocalBusiness schema present and accurate?
- [ ] Is Search Console verified and the sitemap submitted?
- [ ] Is the AI traffic channel configured?
- [ ] Is "how did you hear about us?" on the enquiry form?
- [ ] Have the baseline screenshots been captured and saved?

---

## 11. Process summary

Research intent → confirm the target keywords pass business potential, intent and difficulty →
build money pages first → build one cluster around them → write with BLUF, atomic sections,
entity-rich specifics → apply the on-page pass to every page → local SEO → technical, including
the AI crawler check → measurement and baseline → verify (§10) → report.

Nothing here produces results in 30 days. The order in which things move is: impressions, then
positions, then clicks, then enquiries. Build the foundation properly and say so honestly.
