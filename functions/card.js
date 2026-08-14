/* ---- functions/card.js — the business card QR endpoint --------------------
   The QR code printed on the Picsel cards points at https://picsel.co.uk/card.
   A phone camera shows that address in the preview, the person taps it, and
   this file sends them to the homepage. It also records that the scan
   happened, which is the only way to find out whether handing out cards is
   worth doing.

   The person must never notice any of this. Everything about the order of
   operations below exists to guarantee that: the redirect is built and
   returned first, and the recording is handed to the runtime to finish
   afterwards. If the storage is down, if HQ is down, if the binding was
   deleted, they still land on the homepage at the same speed.

   This is the same rule the contact beacon follows in hq-beacon.js: nothing
   about counting may ever interfere with the thing the visitor came to do. */

/* THE POINT OF THIS ENDPOINT EXISTING.

   The cards are printed. This constant is not. Repointing every card already
   in a wallet at a case study, a booking page or a seasonal campaign is one
   line changed here and a push to main. No reprint, no new QR code, no card
   in somebody's drawer that leads nowhere.

   That is worth more than the counting is. Keep it a single named constant. */
const DESTINATION = 'https://picsel.co.uk/';

/* Where the scan counts land alongside HQ's call and enquiry counts. This
   address is deliberately absent from every file a browser can load. It lives
   here because this file runs on Cloudflare's servers and is never sent to
   anybody. See the note above the HQ call at the bottom. */
const HQ_ENDPOINT = 'https://hq.picsel.co.uk/api/hit';

/* Which print run a card came from, so a future run can be told apart from
   this one. The cards being handed out now are v4. A card with no ?b= on its
   QR is by definition from the run that was printed before anybody thought to
   put one on, which is this one. */
const DEFAULT_BATCH = 'v4';

/* Anything in a URL is a stranger's typing until it has been checked. This
   value becomes part of a storage key, so it is matched against a pattern
   that allows nothing but "v" and up to three digits, and anything else is
   filed under one fixed word rather than being trusted. Without this, a
   thousand junk keys are one bored person with a browser away. */
const BATCH_PATTERN = /^v[0-9]{1,3}$/;
const UNKNOWN_BATCH = 'unknown';

/* Machines that will fetch this URL and are not a person with a card.

   A scan figure padded with crawler hits is worse than no figure at all,
   because it looks plausible enough to say out loud to somebody.

   The link preview bots matter more here than the search engines do. Paste
   the card address into WhatsApp and WhatsApp fetches it to build the preview
   card; without this list that is a scan, and so is every forward of that
   message. The search crawlers will find the URL eventually, but slowly. */
const CRAWLER_MARKERS = [
  'bot',
  'crawler',
  'spider',
  'curl',
  'wget',
  'python-requests',
  'headless',
  'preview',
  'facebookexternalhit',
  'slackbot',
  'whatsapp',
  'telegram',
];

/**
 * Read the print run from the query string, or fall back to a safe value.
 *
 * @param {URL} url The request URL.
 * @returns {string} A batch name that is safe to put in a storage key.
 */
function readBatch(url) {
  const raw = url.searchParams.get('b');

  /* No parameter is the normal case and means this run. A parameter that
     fails the pattern is somebody experimenting, and gets filed where it can
     be seen without pretending to be a real print run. */
  if (raw === null) return DEFAULT_BATCH;
  return BATCH_PATTERN.test(raw) ? raw : UNKNOWN_BATCH;
}

/**
 * Decide whether this request is a machine rather than a person with a phone.
 *
 * Reading the user agent to make this decision is fine. Storing it is not,
 * and nothing below writes it anywhere. The string is looked at, judged, and
 * dropped.
 *
 * @param {Request} request
 * @returns {boolean} True when the scan should not be counted.
 */
function isAutomated(request) {
  /* A camera app opening a link issues a GET. A HEAD is something checking
     the address exists, which is a fair thing to do and not a scan. Anything
     else is not a card being scanned either. */
  if (request.method !== 'GET') return true;

  /* Browsers and messaging apps warm links up before anybody taps them, and
     they say so in these two headers. Sec-Purpose can read "prefetch;prerender"
     rather than exactly "prefetch", so this looks for the word inside it. */
  const purpose = `${request.headers.get('Sec-Purpose') || ''} ${
    request.headers.get('Purpose') || ''
  }`.toLowerCase();
  if (purpose.includes('prefetch')) return true;

  const agent = (request.headers.get('User-Agent') || '').toLowerCase();
  return CRAWLER_MARKERS.some((marker) => agent.includes(marker));
}

/**
 * Write one record for one scan.
 *
 * ONE KEY PER SCAN, NEVER A RUNNING TOTAL. Two reasons, and the second is the
 * bigger one.
 *
 * Cloudflare KV has no way to add one to a number safely. Reading a total,
 * adding one and writing it back means two scans a second apart can both read
 * the same number and both write the same number, and one of the two people
 * who scanned a card is now invisible. There is no lock available to prevent
 * it.
 *
 * And a stored total is a number nobody can check. A list of individual scans
 * can be recounted, questioned, and split by day or by print run after the
 * fact, including in ways nobody has thought of yet. It matches the rule the
 * rest of Picsel HQ is built on: every number is worked out from the records,
 * never typed in and trusted.
 *
 * WHAT IS NOT STORED, which is the important half: no IP address, no user
 * agent, no referrer, no country, no cookie, no identifier of any kind. The
 * date and the print run are facts about a card. Nothing here is a fact about
 * a person. That is what lets this sit outside a cookie banner honestly, the
 * same way the contact beacon does.
 *
 * @param {object} env The Worker environment, holding the CARD_SCANS binding.
 * @param {string} batch The validated print run.
 */
async function recordScan(env, batch) {
  /* The binding can genuinely be absent: before it is created, or if it is
     ever removed. That is a reason to record nothing, never a reason to fail. */
  if (!env.CARD_SCANS) return;

  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  const at = now.toISOString();

  /* crypto.randomUUID makes every key unique with no coordination, which is
     what removes the lost-write problem entirely: two scans in the same
     millisecond write two different keys and both survive. */
  const key = `scan:${batch}:${day}:${crypto.randomUUID()}`;

  /* The timestamp is written twice on purpose. In the value, because that is
     the record. In the metadata, because Cloudflare hands metadata back when
     it lists keys, so /card-stats can work out the first and last scan from
     one sweep of the list rather than fetching every single record. A year of
     cards is one cheap request instead of thousands. */
  await env.CARD_SCANS.put(key, JSON.stringify({ at }), { metadata: { at } });
}

/**
 * Send the same scan to Picsel HQ, so card scans sit next to the call and
 * enquiry counts instead of in a separate place that has to be remembered.
 *
 * HQ LEARNED t=card ON 14 AUGUST 2026, its Section 17c, a few hours after this
 * file shipped. Until its migration 0026 is pasted into Supabase and HQ is
 * deployed, this request still comes back 4xx and is still swallowed, and the
 * KV records carry the numbers on their own. Nothing here changes either way,
 * which was the point of building it before HQ was ready.
 *
 * @param {object} env The Worker environment, holding PICSEL_SITE_KEY.
 */
async function reportToHq(env) {
  const key = env.PICSEL_SITE_KEY;
  if (!key) return;

  /* No body, for the same reason hq-beacon.js sends none: a body sets a
     content type that turns this into a request needing a preflight. Nothing
     to gain, one more thing to go wrong. */
  await fetch(`${HQ_ENDPOINT}?k=${encodeURIComponent(key)}&t=card`, {
    method: 'POST',
  });
}

/**
 * Handle a request to /card.
 *
 * @param {Request} request
 * @param {object} env
 * @param {{waitUntil: (p: Promise<unknown>) => void}} ctx
 * @returns {Response}
 */
export function onCardRequest(request, env, ctx) {
  const url = new URL(request.url);
  const batch = readBatch(url);

  /* 302 AND NOT 301, and this is the whole difference between a counter that
     works and one that quietly stops.

     A 301 says "this address has moved permanently", and browsers believe it
     and cache it, often forever. The second time somebody scans the same
     card, their phone would skip this endpoint entirely and go straight to
     the homepage. The scan would not be counted, and worse, the DESTINATION
     constant above would stop being able to repoint that card.

     no-store tells every cache in between not to keep this response either.
     noindex keeps the address out of search results if a crawler finds it. */
  const response = new Response(null, {
    status: 302,
    headers: {
      Location: DESTINATION,
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
    },
  });

  if (isAutomated(request)) return response;

  /* waitUntil is the runtime promising to keep this request alive until the
     work finishes, without the person waiting for it. The response above is
     already on its way out; the recording happens behind it.

     Every error is swallowed, separately, so a failure to reach HQ cannot
     take out the KV write and neither can reach the visitor. */
  ctx.waitUntil(
    (async () => {
      try {
        await recordScan(env, batch);
      } catch {
        /* Nothing to recover and nobody to tell. One uncounted scan is the
           right way for a counter to fail. */
      }

      try {
        await reportToHq(env);
      } catch {
        /* Expected until HQ learns the card hit type. See reportToHq. */
      }
    })(),
  );

  return response;
}
