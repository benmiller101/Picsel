/* ---- hq-beacon.js — counting calls and enquiries for Picsel HQ ------------
   Two numbers, sent to https://hq.picsel.co.uk/api/hit: somebody tapped the
   phone number, and somebody's enquiry actually arrived. Nothing else.

   WHAT IS DELIBERATELY NOT SENT, because it is the whole point of the design:
   no cookie, no localStorage, no visitor or session id, no IP, no user agent,
   no page path, no referrer, no UTM tags, no timestamp, and nothing anybody
   typed into the form. HQ has no column for any of it.

   That absence is not an oversight waiting to be improved on. It is what lets
   this sit outside a cookie banner honestly, and what makes the resulting
   numbers safe to put in front of a client. A "just the page" parameter would
   look harmless and would cost both of those things.

   WHY sendBeacon AND NOT fetch. A phone tap fires as the page is being handed
   to the dialler. A fetch in flight when the page goes away is a fetch the
   browser cancels, so the call that was definitely made is the call that never
   gets counted. sendBeacon is queued by the browser and survives the page.

   WHY NO BODY. A JSON body sets a Content-Type that makes the request
   non-simple, which means a CORS preflight has to complete first. There is no
   page left to complete it. Everything travels in the query string instead.

   The endpoint answers 204 whether the key is right or wrong, on purpose:
   telling the page which keys are real would tell anybody who asked. So there
   is nothing to read back, and nothing here reads it. */

const ENDPOINT = 'https://hq.picsel.co.uk/api/hit';

/* Read from the script tag the shell renders, which gets them from
   site.config.js. The key is not a secret, it is an identifier, and it is
   visible in the page source of every site that reports to HQ. It lives in the
   config anyway because this repo keeps one copy of a fact. */
const tag = document.querySelector('script[data-hq-key]');
const KEY = tag?.dataset.hqKey || '';
const LIVE_HOST = tag?.dataset.hqHost || '';

/* Only the real site counts. Local dev, preview URLs and branch deploys all
   run this same file, and a counter that includes them presents as a
   suspiciously good month rather than as an obvious bug. */
const isLive = LIVE_HOST !== '' && location.hostname === LIVE_HOST;

/**
 * Send one hit. Never throws: a visitor trying to ring must not meet a script
 * error on the way to the dialler.
 *
 * @param {'call'|'form'} type The endpoint rejects anything else.
 */
function report(type) {
  /* No sendBeacon means one uncounted call, which is the right way for a
     counter to fail. Doing it a worse way instead is not an improvement. */
  if (!isLive || !KEY || !navigator.sendBeacon) return;

  try {
    navigator.sendBeacon(`${ENDPOINT}?k=${encodeURIComponent(KEY)}&t=${type}`);
  } catch {
    /* Swallowed on purpose. There is no recovery worth attempting and no
       message worth showing: the visitor is mid-tap. */
  }
}

/* One delegated listener rather than one per link, so a tel: link rendered by
   any page, now or later, is covered without anybody remembering to wire it
   up. The site has phone links in the footer, the contact band, the contact
   page and the mobile action bar.

   Capture phase, because a tap on a tel: link starts a navigation and a
   listener that waits its turn in the bubble phase may not get one.

   Nothing here calls preventDefault. The beacon goes out and the link does
   exactly what it always did. */
document.addEventListener(
  'click',
  (event) => {
    /* closest, not event.target: the tap usually lands on text inside the
       anchor rather than on the anchor itself. */
    const link = event.target?.closest?.('a[href^="tel:"]');
    if (link) report('call');
  },
  true,
);

/**
 * Called by contact.js once an enquiry has genuinely arrived, never on submit
 * and never on validation passing. A counted enquiry that reached nobody is
 * worse than an uncounted one, because it makes a broken form look like a
 * working one.
 *
 * Two taps a second apart are two real taps, and two enquiries are two real
 * enquiries. Nothing here debounces or de-duplicates: that would be inventing
 * a rule about how often somebody is allowed to change their mind.
 */
export function reportEnquiry() {
  report('form');
}
