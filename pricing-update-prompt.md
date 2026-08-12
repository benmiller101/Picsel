# Prompt: update picsel.co.uk to the new pricing

Paste everything below the line into Claude Code, running in the `picsel` repo.

---

Read `CLAUDE.md` first and follow it in full, including the never-do list and the writing rules. This task changes prices and adds a page. It does not change the design, the palette, the nav structure, the animation or the component system. No redesign, no new dependencies.

## What this is

Picsel's prices changed on 12 August 2026. The site either has no prices page or has an old one. This task publishes the current card and removes every stale number from the repo.

The full internal reference is `pricing-master.md` and the client facing copy is `pricing-document-copy.md`. **`pricing-document-copy.md` is the source of truth for wording.** If anything below disagrees with it, that file wins. Nothing marked internal in `pricing-master.md` goes on the site.

## 1. Kill the old numbers first

Before writing anything new, grep the whole repo, including components, meta descriptions, JSON-LD, alt text and any hardcoded copy, for these and remove or replace every one:

`£99` · `£149` · `£119` · `£89 build` · `£45 per change` · `£60 an hour` · `plus ad spend` · `plus your ad budget`

`£89` on its own is still correct for the Google Profile Rescue, so check each instance rather than replacing blindly. `£15` and `£29` are unchanged and stay.

## 2. Build or rebuild `/prices`

Linked from the nav and from the homepage. Structure, in this order:

**A. The build fee, on its own, first.**

One statement before anything else: **£299 to build your website, whichever plan you pick. Then choose how much I do afterwards.**

This is the most important structural decision on the page. Leading with the plans invites a client to compare three build fees that do not exist and to read the cheap plan as the cheap build. Leading with one fixed number removes a decision from the sale.

**B. Google Profile Rescue, £89 one off.**

Framed as "not ready for a website? start here", and state that it comes off the build fee if they take a plan later.

**C. The three plans, as a superset ladder.**

| Plan | Monthly | Term |
|---|---|---|
| Online | £15 | Rolling, cancel any time |
| Managed | £29 | Rolling, cancel any time |
| Growth | £99 for the first 3 months, then £179 | 12 months |

Each plan says "everything in [the plan before], plus…". Contents come from `pricing-document-copy.md` verbatim in substance.

Three things that must appear and are easy to drop:

- Managed's 30 minutes a month is **use it or lose it, it does not roll over**
- Growth's £99 opening rate is presented as a real opening price, not a discount asterisk
- Growth's 12 month term appears next to the price with the reason attached: *because I am turning down every other trade in your patch to do it*

**D. The upgrade offer, directly under the Growth plan.**

> Already on Online or Managed? Try Growth for a month at your current price. If you do not like it I put you straight back, no argument.

This is the single most commercially important sentence on the page. Do not bury it in a footer.

**E. Extras.**

- **Extra changes, £45 an hour, half an hour minimum.** Applies to Online, and to Managed past the included 30 minutes. Note that I always say how long a job will take before starting it, and that most people who pay it twice move up to Managed because it works out cheaper. **Keep this small and visually quiet, and do not place it near the Growth plan.** An advertised hourly rate invites a visitor to price a retainer by the hour, and that is an argument we do not want on the page.
- **Google Ads, £129 a month to manage, minimum £400 a month ad budget.** State plainly that the client pays Google directly from their own card on their own account, so the budget is theirs and visible to them, and Picsel only ever charges the management fee. Give the honest reason for the minimum: below it the ads do not run often enough to work, and I would rather turn the job down than take money for something that will not.
- **Custom apps, £1,200 build then £49 a month, or £149 a month with no build fee on a 12 month term.** Say what the monthly covers: hosting, backups, security updates, fixes and small changes, with larger new features quoted separately.

**F. The annual option.**

Twelve months for the price of ten, on any plan. Online £150, Managed £290, Growth £1,600.

**G. Founding client offer.**

£49 build fee, first five clients only, **on Managed or Growth only**, 12 month term, in exchange for a Google review, a short case study and two introductions.

If the five slots are gone by the time this ships, cut the section rather than leaving it up. A dead scarcity offer is worse than none.

**H. The straight answers block.**

Four questions, answered plainly, near the bottom. This block does more selling than the price table, because the audience has usually been burned before and these are the fears they will not raise on a call.

- *Can I pay for the year up front?* Twelve months for the price of ten. Online £150, Managed £290, Growth £1,600.
- *Can I pause?* One month a year at £5 to hold everything in place. Trades go quiet in winter and I would rather hold your site than lose you.
- *What if I leave?* You own your domain, your content, your photos and your reviews. The site comes down and I send you everything in a format anyone can use, free, within seven days. No exit fee, nothing held hostage.
- *Who owns what?* You own the domain, the content and your Google profile. I own the template system the site is built on, which is how the build is £299 rather than £1,500.

**I. The two promises.**

**Exclusivity, Growth only.** One trade per patch, meaning their town and roughly 8 miles around it. A different trade in the same patch is fine. Add that the patch is held for as long as they are on Growth and frees up 30 days after they stop. **Never print this promise without the Growth condition attached**, in any position on any page.

**The lead guarantee, Growth only.** If the website and Google Business Profile do not bring at least 5 genuine enquiries in the first 4 months, they choose: £149 of the build fee back in cash, or the full £299 as credit against the monthly fee. Annual payers get the £149 in cash, since there is nothing left to credit.

Then the sentence that matters most, and it is new:

> A guarantee payout ends your twelve month term on thirty days notice. I am not going to hold you to a year if I have not delivered.

Add one line that full terms are in the proposal, and that the monthly fee is not refundable because it only ever covers months already worked.

Do not use "guaranteed" as an adjective anywhere on the site. It is on the never-do list.

## 3. Tone

Plain, direct, first person singular, the way the rest of the site reads. This is one person talking to a tradesperson, not a company describing its packages.

Follow `writing-rules-human-copy.md` and `writing-rules-banned-list.md`. In particular: no "unlock", no "elevate", no "transform your business", no "packages tailored to your needs", no "get started today", no exclamation marks, no stock reassurance.

The prices are the cheapest credible ones in the market, so the page does not need to sell hard. State the numbers plainly and let them do the work. Confident and boring beats enthusiastic.

## 4. Technical

- Add `Offer` schema for each plan under the existing `ProfessionalService` or `Organization` markup, with `priceCurrency: "GBP"`. Do not invent aggregate ratings or review counts.
- Every price appears in the markup as text, not in an image and not injected by JavaScript. The page must render fully with JS disabled.
- Put the price values in a single data file or constants block that the page maps over, rather than hardcoding numbers into markup in several places. Prices will change again and next time it should be one edit.
- Mobile first. Most of this audience is reading it on a phone on a job, so the three plans stack rather than shrinking into an unreadable table.
- Link to `/prices` from the nav, the homepage, and the footer.

## 5. Sweep the rest of the site

- The homepage and any hero or CTA mentioning price now reads **£299 to build and from £15 a month**.
- Bios and taglines saying "from £15 a month" are still correct and stay as they are.
- Anywhere exclusivity is mentioned outside the prices page, check the Growth condition is attached.
- Update `plan-picsel-site.md` and the SITE VARIABLES block in `instructions-picsel-site.md` to the 12 August 2026 card.

## 6. Out of scope, deliberately

Do not build a quote calculator or a plan picker. The prices are fixed and a calculator that always returns £299 is a price list with extra steps. A three question plan recommender may be added later as a separate task, sitting under the price table rather than instead of it.

Do not put anything about custom backends, bookings or bespoke software on the site beyond the custom apps line in section E. That pricing exists internally but is not live.

## 7. Check before you finish

- Every number on `/prices` matches `pricing-document-copy.md` exactly
- Grep for `£99`, `£149`, `£119`, `£45 per change`, `£60 an hour` returns nothing outside changelogs
- The Growth 12 month term and the guarantee's release of that term both appear
- The exclusivity promise never appears without the Growth condition, anywhere in the repo
- The Managed non-rollover line is present
- The ads section says the client pays Google directly
- The hourly rate is present but not prominent, and not adjacent to the Growth plan
- Prices render with JavaScript disabled
- Schema validates and there is no orphaned or invented markup
- Lighthouse performance stays 95+ and nothing regressed on mobile
- The contact route is obvious from the prices page without scrolling back up
