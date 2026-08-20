# The prompt for the picsel.co.uk repo

Section 17b. HQ can now count calls and enquiries on picsel.co.uk, but nothing is reporting them
yet. This is the prompt to paste into Claude Code **in the picsel.co.uk repository**, not this one.

Before you paste it: open HQ → Settings → Data → **Your own website**, press "Give it a key" if
there isn't one, expand "The key for picsel.co.uk" and copy the 32 characters. Paste them over
`PASTE_THE_KEY_FROM_HQ` in the prompt below. If you paste the prompt with the placeholder still in
it, the beacons still arrive — they land in HQ's "reporting a key nobody holds" panel, which is
exactly what that panel is for.

---

## Copy from here

Add call and enquiry tracking to this site. It reports to Picsel HQ, which already has the endpoint
built and waiting — nothing needs building on the receiving end.

**What to send**

A `POST` to `https://hq.picsel.co.uk/api/hit`, with two query parameters and **no request body**:

- `k` — the site key: `PASTE_THE_KEY_FROM_HQ`
- `t` — either `call` or `form`, and nothing else. The endpoint rejects any other value.

Send it with `navigator.sendBeacon`. Not `fetch`, and this matters: a phone tap fires as the page is
being handed to the dialler, and a `fetch` in flight when the page goes away is a fetch that gets
cancelled. Send no body at all — a JSON body sets a `Content-Type` that makes the request non-simple,
which means the browser has to complete a CORS preflight first, and there is no page left to complete
it. With no body there is no preflight.

Ignore the response. There isn't one worth reading: the endpoint answers `204` whether the key was
right or wrong, on purpose, because telling the page which keys are real would tell anybody who asks.

**When to send `call`**

A click or tap on any link whose `href` starts with `tel:`. Use one delegated listener on the
document rather than binding each link, so links rendered later are covered without anybody
remembering to wire them up.

Two taps a second apart are two genuine taps. Do not debounce, de-duplicate, or add an idempotency
key — collapsing them would be inventing a rule about how often a person is allowed to change their
mind, and HQ deliberately has no such rule.

**When to send `form`**

Only when a contact form submission has actually **succeeded** — after the request to whatever
handles the form comes back OK. Not on submit, not on validation passing, not on the button being
pressed. A counted enquiry that never reached anybody is worse than an uncounted one, because it
makes a broken form look like a working one.

**What NOT to send, and this is the important half**

Nothing that identifies anybody, and nothing at all beyond those two parameters. No cookie, no
`localStorage`, no visitor or session id, no IP (don't try to look one up), no user agent, no page
path, no referrer, no UTM parameters, no timestamp, and nothing the visitor typed — not their name,
not their email, not the message. HQ stores none of it and has no column for any of it.

This is not an oversight to be improved on later. It is what lets this beacon sit outside a cookie
banner honestly and what makes the resulting numbers safe to show a client. Do not add a "just the
page" or "just an anonymous id" parameter, however harmless it looks. If you think something extra
would be useful, say so in your summary instead of adding it.

**How it has to behave**

- No dependencies, no analytics library, no build step changes.
- One small file. Load it on every page, deferred, so it never blocks rendering.
- Never delay or intercept the navigation: the beacon fires and the `tel:` link does what it always
  did. Do not `preventDefault`.
- If `navigator.sendBeacon` is missing, do nothing at all. A lost beacon means one uncounted call,
  which is the right way for a counter to fail.
- Never throw. Wrap the send so a failure cannot take a script error to a visitor trying to ring.
- **Only fire on the real site.** Guard on `location.hostname` being the live domain, so local dev,
  previews and branch deploys don't inflate the count. Getting this wrong presents as a suspiciously
  good month.
- No consent gate needed, because there is nothing to consent to — but do not remove or weaken any
  consent banner that is already there for something else.

**When you're done**

Tell me: which file you added, where it is loaded from, the exact selector the `call` handler
matches, and the exact point in the form flow the `form` beacon fires from. Then tell me how to test
each one — I want to watch the request go out in the network tab and see `204` come back.

## Copy to here

---

## After it's deployed

1. Tap the phone number on the live site from a phone.
2. Open HQ → Overview, scroll to the bottom. The **picsel.co.uk** band appears once a key exists and
   the figure should move within a few seconds of a reload.
3. If nothing arrives, check Settings → Data → "Client sites reporting a key nobody holds". A key
   listed there means the snippet is working and the key is wrong — which is the good failure, and
   the reason that panel exists.
4. If nothing arrives and nothing is listed as unmatched, the beacon isn't firing. Go to the
   Cloudflare log for the HQ Pages project before theorising: Section 17 lost most of a day to four
   plausible hypotheses that were all wrong, and the function's own log named the real cause in one
   line. **An endpoint built to reveal nothing to the outside reveals nothing to you either.**


# Claude Code prompt: card scan tracking
 
Paste everything below the line into Claude Code, run from the **picsel.co.uk site repo**. Have the Picsel HQ repo path to hand, it will ask.
 
---
 
Build scan tracking for physical marketing (business cards first, van livery and flyers later). Two repos are involved: the public site `picsel.co.uk` (redirect endpoint) and Picsel HQ (storage and reporting). Read `claude/picsel-hq-context.md` and `claude/picsel-contact-tracking-spec.md` in the Picsel project before you write anything, and follow the same principles those specs already establish.
 
## Non-negotiables
 
These come straight from the existing HQ principles. Do not relax them.
 
- **Nothing may ever cost a scan.** The redirect must happen even if Supabase is down, the key is wrong, or the write throws. Log failures silently, never block, never surface an error page.
- **No identifiers, ever.** Do not store or forward IP, user agent, referrer, geolocation, a visitor id or a cookie. A row is a timestamp and a label. This is what keeps it outside a cookie banner honestly.
- **Never expose HQ publicly.** The site repo must not contain the string `hq.picsel.co.uk`, and the redirect endpoint writes to Supabase directly, not through HQ.
- **Never commit secrets.** The Supabase service key lives only in the Cloudflare Pages environment.
- **Corrections are new rows.** Never update or delete a scan row.
## Part 1: Supabase
 
Add a migration creating a `scan` table:
 
- `id` bigserial primary key
- `at` timestamptz not null default now()
- `source` text not null, defaults to `'card'`. Values seen so far: `card`, `van`, `flyer`
- `batch` text nullable. Print run label, e.g. `v4`
Enable row level security. No anon policy at all: writes go in with the service key from the Pages Function, reads happen in HQ as the authenticated user. Add an index on `at`.
 
## Part 2: The redirect endpoint (picsel.co.uk repo)
 
Create a Cloudflare Pages Function at `functions/card.js` handling GET on `/card`.
 
Behaviour:
 
1. Read `s` from the query string for source, defaulting to `card`. Read `b` for batch, defaulting to `v4`. Validate both against a strict allowlist regex (`^[a-z0-9-]{1,16}$`) and fall back to the default on anything else, so the endpoint cannot be used to write junk.
2. Fire the insert into Supabase REST with the service key. Wrap the whole thing in try/catch and swallow everything.
3. Return a 302 to `https://picsel.co.uk/`.
Use `context.waitUntil()` for the insert so the redirect is not waiting on the round trip. Set `Cache-Control: no-store` on the response so Cloudflare never serves a cached redirect and eats the count.
 
Environment variables, Pages environment only, both already used by HQ: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`.
 
Also handle `/card` with any other method by returning the same redirect. QR scanners occasionally send HEAD.
 
## Part 3: HQ reporting
 
In Picsel HQ, add a **Marketing** section, or extend the existing growth screen if one fits better. Follow the existing HQ conventions exactly: static HTML/CSS/JS, no framework, no build step, Supabase JS v2 from CDN with the version pinned, phone first, and the dataviz skill governs any chart.
 
Show:
 
- Scans this month, and scans all time
- A daily sparkline for the last 30 days
- A small breakdown by `source`, and by `batch` when more than one exists
- **Scans next to enquiries for the same period**, since the useful number is not scans, it is whether a scan turned into contact
Every figure derived from the table, nothing typed in.
 
## Part 4: Verify before you call it done
 
- Hit `/card` locally with Wrangler and confirm a row lands and the redirect fires
- Break the Supabase URL deliberately and confirm the redirect still fires with no visible error
- Confirm `/card?s=<injection attempt>` writes the default, not the input
- Confirm nothing in the site repo references HQ's hostname
- Confirm the response carries `Cache-Control: no-store`
- Scan the printed QR with a real phone, both iOS and Android if you can, and confirm exactly one row per scan
## Then
 
Update `claude/picsel-hq-context.md` with the new endpoint and table, the same way contact tracking is documented, and note in `claude/business-card-spec.md` that the v4 QR resolves to `https://picsel.co.uk/card`.

3c83b56ef65096f927cf8bb5fdf0e8b9 < this is the key from picselhq