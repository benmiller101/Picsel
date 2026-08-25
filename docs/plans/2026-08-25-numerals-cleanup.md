# The numerals cleanup

**Date:** 2026-08-25
**Status:** queued, to run after the article layout branch lands

Ben asked for this as its own change rather than folded into the layout work, because the
decision it needs is editorial: which of these numbers are copy and which are data.

## The rule

`tools/templates/words.js`, in its own words:

> Small counts appear as words in body copy ("five sites are live"), not as digits, because that is
> how the rest of the site reads and how a person would say it aloud. Digits are kept for things that
> are genuinely data: a phone number, a price, a year.

So this is not "replace every digit". It is a per-site judgement: copy gets the word, data keeps the
digit. That distinction is the whole job, and it is why this was not folded into the layout branch.

## The evidence that the word form is the intent

`tools/pages/services.js` contains both forms a few lines apart. Its `description` branch hardcodes

    ...a month for three months then...

while the `indexLine` immediately below interpolates the raw digit. One file, two forms, one of them
already hand-written as a word. The digits are drift, not a decision.

## Inventory

Every remaining site, verified raw (not already passing through `countWord`) at the time of writing.
Line numbers will have moved; **locate by content**.

### Copy, and should become words

| Site | Field | Renders |
| --- | --- | --- |
| `tools/pages/guides.js:475` | body copy, a guide's plan aside | "for the first 3 months" |
| `tools/pages/guides.js:574` | body copy, a guide's plan aside | "for the first 3 months" |
| `tools/pages/services.js:401` | `indexLine`, visible card copy | "for the first 3 months" |
| `tools/pages/services.js:407` | `lead`, visible page copy | "the first 3 months" |
| `tools/partials/plan-cards.js:56` | visible card price line | "a month for the first 3 months" |

### Data, and should keep digits

| Site | Field | Why it stays |
| --- | --- | --- |
| `tools/pages/prices.js:352` | schema.org `Offer.name` | Structured data, read by machines. A crawler comparing offer names wants the numeral. |
| `tools/pages/services.js:570` | schema.org `Offer.name` | Same. |
| `tools/build.js:1016` | `llms.txt` plan list | A machine-readable dump, not prose. Its whole format is data. |

## Things to get right

**Two `countWord` helpers exist and they deliberately differ.** `tools/templates/words.js` runs to ten
and falls back to digits above that. `tools/pages/guides.js` keeps its own, running to twelve, with a
comment explaining that "answers to 6 questions" reads like a spreadsheet and that past twelve a word
stops helping. **Do not merge them.** In `guides.js` use the local one; everywhere else import from
`words.js`.

**The temporal dead zone.** `guides.js` defines its helper at module scope, and the plan asides being
edited live inside array literals evaluated at module load. The helper was already moved above the
`GUIDES` array during the layout branch, so calling it should now be safe, but confirm the definition
still precedes the call site before assuming it.

**No meta description is affected**, which was the main risk: "three" is four characters longer than
"3", and the build enforces 150 to 155 on descriptions. Every site above is body copy, an `indexLine`,
a `lead`, a schema `name`, or `llms.txt`. None is a `description`. Re-check this if the inventory
changes, because a description breaching the cap fails the build.

**`plan-cards.js` is shared.** It renders on `/prices` and on service pages, so one edit there changes
several pages. Check them all rebuild clean.

## Verification

    npm run check
    grep -roh "first [0-9] months\|for [0-9] months" dist --include="*.html" | sort | uniq -c

Expect only the schema-name instances to remain in HTML. `llms.txt` is not HTML so it will not appear
in that grep; check it separately and leave it alone.

Add a test if a cheap one exists. `plan-table.test.js` gained one during the layout branch whose
negative assertion is the part with teeth:

    assert.equal(/\bfor \d+ months\b/.test(row), false, 'month count must not be a digit');

The same shape would work for the plan cards.

## Add the guard, last

Once every site above is settled, add a digit-count-in-copy scan to `tools/check.js`. It already walks
the built pages looking for em dashes, so the machinery is there: flag `\d+ (months?|weeks?|years?|
rounds?|pages?|sites?)` inside `<p>` and `<li>`, with the schema and `llms.txt` outputs excluded.

**It has to go in last.** Added before the cleanup it fails the build on the nine existing instances.

This is worth doing because the same defect appeared three times during the article-layout branch, all
three from prescribed code that interpolated a raw number into a sentence. Two were caught by the
controller and one by a reviewer, which is luck rather than a process. A check makes it arithmetic.
