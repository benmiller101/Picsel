# SEO additions — report

## Task 1: real 404 page
- Added `tools/pages/not-found.js` exporting `NOT_FOUND_PAGE`, registered it in the `PAGES` list in `tools/build.js`.
- `page.path` is `/404.html`. `tools/build.js`'s `outPath` logic now checks for a `.html`-suffixed path and writes it as a bare file at the repo root instead of `<path>/index.html`; every other page is unaffected.
- `wrangler.jsonc`'s `assets.not_found_handling` changed from `"none"` to `"404-page"`, which is what makes Cloudflare actually serve `/404.html` (with a 404 status) for any unmatched route. It was set to `"none"` before this change, so the page would have built correctly but never been served.
- Excluded from `sitemap.xml` and `llms.txt` via `excludeFromSitemap: true`, and carries `<meta name="robots" content="noindex, follow" />`, both following the `/contact/sent/` precedent exactly.
- Content: plain statement that the page isn't there, the phone number as the primary action, then real links to `/work/`, `/prices/`, `/guides/`, `/contact/`. No joke, no "Oops!".

## Task 2: FAQ on /prices
- Added a `FAQS` array and `FAQ_SECTION` to `tools/pages/prices.js`, rendered with the same `.faq__grid` / `.faq__item` / `.faq__q` / `.faq__a` classes the homepage FAQ already uses (no new CSS needed), and an `FAQPage` schema node added to `PRICES_PAGE.schemaExtra` in the same shape guides.js uses (`mainEntity` of `Question`/`acceptedAnswer` pairs) — no second schema pattern invented.
- Heading levels: the section is `<h2>` (matching every other top-level band on the page — plans, commitments, founding offer, extras, contact band are all `h2`), each question is `<h3>`, matching the nesting the homepage FAQ and the guides' "While you are here" blocks already use.
- Five questions shipped, each answer traceable to an existing fact in the repo:
  1. Who owns the domain? — from `GUARANTEE.keepEverything` ("you keep... the domain").
  2. How long until the site is live? — from `PLANS[0].summary` ("live within a week").
  3. What's not included? — from `PLANS[*].excludes`.
  4. What if the site doesn't bring me any work? — from `GUARANTEE.promise` and `GUARANTEE.monthlyNotRefundable`.
  5. Will you build a site for a competitor of mine? — from `SITE.exclusivity`, paraphrased in plain text (no `<strong>`) since schema answer text should be plain, and reworded so the build's `per patch` phrase-plus-`Growth` check isn't relied on; "Growth" is named directly in the answer regardless.

### Questions left out
- **"What happens if I stop paying?"** — no answer exists anywhere in the repo for what happens to a monthly Online/Managed/Growth subscriber who stops paying (hosting, domain, takedown policy). The only place this question appears is as a generic "questions worth asking any studio" prompt in the `how-much-a-trades-website-costs` guide, aimed at competitors, not an answer about Picsel's own policy.
- **"Can I move to another plan?"** — no upgrade/downgrade policy is written down anywhere. Inventing one for a money page felt worse than leaving the gap.

Both should go on Ben's list of things to actually decide and write down, not guessed at here.

## Task 3: enquiry source field
- Added a `SOURCES` array and a new optional `<select>` (`id="enquiry-source"`, `name="source"`) to the enquiry form in `tools/pages/contact.js`, positioned after "What do you need?" and before "What's the job?".
- Options: Prefer not to say (default, empty value), Google search, "Asked ChatGPT, Gemini or another AI assistant", Someone recommended you, "Facebook, Instagram or TikTok" (the studio's real profiles), Something else.
- No `required` attribute — deliberately optional, per the instruction that a required field costs enquiries.
- Label uses a real `for`/`id` pair (`enquiry-source`), and the select shares the `.field__input .field__select` classes every other control uses, so it inherits the same visible focus ring from `contact.css` automatically — no new CSS needed.
- The form has no JavaScript field allowlist: `contact.js` (site root) builds its payload from `new FormData(form)`, so the new field is submitted both with and without JavaScript, confirmed by checking the field sits inside `<form id="enquiry-form">...</form>` in the built HTML.

## Verify
- `npm run build`: **19 pages, 0 errors** (was 18 before this work).
- `/404.html` exists at the repo root; absent from `sitemap.xml` (still 17 URLs, unchanged) and `llms.txt`.
- `/prices/index.html` contains an `FAQPage` schema block.
- `/contact/index.html` contains the `enquiry-source` select with its label, inside the form element.
- Checked the rendered HTML directly (build output is static, so this is equivalent to loading with JavaScript disabled): the 404 page, the FAQ section and the new select are all present in the raw markup with no script required.

## Concerns
- None outstanding for these three tasks. The two FAQ questions left out are the only known gap, and they need a real business decision from Ben before they can be answered honestly.
