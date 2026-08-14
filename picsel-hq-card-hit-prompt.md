# Prompt for the Picsel HQ repo: accept a `card` hit

Paste everything below the line into Claude Code, run from the **Picsel HQ repo**, not this one.

Why it is needed: `picsel.co.uk/card` is the address the QR code on the business cards points at.
It went live on 14 August 2026. Every scan already sends a `POST` to
`https://hq.picsel.co.uk/api/hit?k=<site key>&t=card`, and the endpoint rejects it, because `t`
only accepts `call` and `form`. The site swallows the rejection and keeps its own count in
Cloudflare KV, so nothing is broken and no scan is lost. But HQ shows nothing until this is done.

The scans HQ has missed in the meantime are gone. `/card-stats` on the site has them if the gap
ever matters.

---

## Copy from here

Add `card` as a third hit type. `/api/hit` currently accepts `t=call` and `t=form` and rejects
everything else. It needs to accept `t=card` on the same terms, so scans of the business card QR
code land next to the call and enquiry counts.

**Read first:** `claude/picsel-hq-context.md` and `claude/picsel-contact-tracking-spec.md`. Follow
the principles already in them rather than inventing new ones for this.

### What is already sending

The site does this, and it is deployed:

- `POST https://hq.picsel.co.uk/api/hit?k=<site key>&t=card`
- No request body. Nothing else in the query string.
- Sent from a Cloudflare Worker on the server side, not from a browser, so there is no CORS
  preflight to worry about and no `Origin` to check.
- The response is ignored. Nothing on the site reads it or retries.

Do not ask the site to change what it sends. It is printed on cards that are already in circulation
behind a redirect that must never fail, and the whole point of building it before HQ was ready is
that HQ can catch up on its own.

### What to change

1. Add `card` to whatever validates `t`. One value in one list, matched exactly, same as the
   other two. It is not a prefix match and not a regex: `cards`, `Card` and `card?` are all
   rejections.
2. Store it exactly the way `call` and `form` are stored. Same table, same columns, same key
   lookup, same "unknown key" handling. If a `call` from an unrecognised key goes to the panel for
   keys nobody holds, a `card` from an unrecognised key goes there too.
3. Show it wherever `call` and `form` are shown. It is a third count, not a new screen. If there
   is a per-site row with two numbers on it, it now has three.
4. Label it in plain words. "Card scans" reads better to Ben in six months than "card hits", and
   the thing being counted is somebody scanning a business card.

### What not to do

- **Do not add anything to what gets stored.** No IP, no user agent, no referrer, no country, no
  visitor id, no source, no batch. The site deliberately does not send them and HQ has no column
  for them. This is what keeps the whole arrangement outside a cookie banner honestly. If you think
  something extra would be useful, say so in your summary rather than adding it.
- **Do not add a print run field.** The site tracks which print run a card came from in its own
  storage, because that is a fact about a piece of card rather than about a business. HQ counts
  scans. Splitting them by run is `/card-stats` on the site, and duplicating it here means two
  places that can disagree.
- **Do not backfill.** The scans that arrived before this change were rejected and not written
  down. Inventing rows for them would put a number in HQ that nothing can check, which is the one
  thing HQ is built not to do.
- **Do not change what the endpoint returns.** It answers `204` whether the key is real or not, on
  purpose, because telling a caller which keys work tells anybody who asks. A `card` hit answers
  the same way.

### When you are done

Tell Ben, in plain words:

- That HQ now counts card scans and where they appear.
- Anything you would have added and did not, and why it was worth mentioning.

Then check it against a real request:

```
curl -X POST "https://hq.picsel.co.uk/api/hit?k=<the picsel.co.uk site key>&t=card"
```

A `204` and a count that went up by one. Then `curl` the same URL with `t=cards` and confirm
nothing was written.
