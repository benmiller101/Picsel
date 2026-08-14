/* ---- functions/card-stats.js — reading the card scan numbers back ---------
   Answers JSON at /card-stats?key=… and nothing else. There is no page, no
   chart and no login screen, on purpose: a page is a thing to maintain, a
   thing to style twice a year, and one more thing that can leak a number to
   somebody who should not have it. JSON in a browser tab is enough to read.

   Every figure here is worked out from the scan records at the moment of
   asking. Nothing is stored as a total, so nothing here can disagree with
   what actually happened. See the long note in card.js about why. */

/* Records are written by card.js as scan:<batch>:<date>:<uuid>. Listing by
   this prefix is what makes the whole readout possible in one sweep. */
const KEY_PREFIX = 'scan:';

/* Cloudflare hands back at most 1000 keys per request and a cursor for the
   rest. This asks for the largest page allowed so a year of cards is a
   handful of requests rather than dozens. */
const PAGE_SIZE = 1000;

/**
 * The answer to a request that should not have been made.
 *
 * 404 AND NOT 401. A 401 says "you got the password wrong", which confirms
 * there is something here worth guessing at and invites somebody to keep
 * going. A 404 with nothing in it says there is no such address, which is
 * both more useful to us and true enough from the asker's side.
 *
 * @returns {Response}
 */
function notFound() {
  return new Response(null, {
    status: 404,
    headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
  });
}

/**
 * Compare two strings without letting the time taken reveal how much of the
 * key was right.
 *
 * A plain === stops at the first wrong character, so a determined person can
 * in principle learn a key one character at a time by measuring how long each
 * guess took. Doing the whole comparison every time removes that, and costs
 * nothing on a string this short.
 *
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function matches(a, b) {
  if (a.length !== b.length) return false;

  let difference = 0;
  for (let i = 0; i < a.length; i += 1) {
    // Bitwise XOR: zero when the two characters are identical, non-zero when
    // they differ. OR-ing every result together keeps any difference found.
    difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return difference === 0;
}

/**
 * Walk the whole list of scan records, following Cloudflare's cursor until
 * there is none left.
 *
 * Handling the paging now rather than when it starts mattering: a truncated
 * list does not look broken, it looks like a quiet month. That is the kind of
 * bug that gets believed.
 *
 * @param {object} namespace The CARD_SCANS KV binding.
 * @returns {Promise<Array<{name: string, metadata?: {at?: string}}>>}
 */
async function listAllScans(namespace) {
  const keys = [];
  let cursor;

  for (;;) {
    const page = await namespace.list({
      prefix: KEY_PREFIX,
      limit: PAGE_SIZE,
      cursor,
    });

    keys.push(...page.keys);

    if (page.list_complete) return keys;
    cursor = page.cursor;
  }
}

/**
 * Turn the raw key list into the numbers.
 *
 * The batch and the date are read out of the key itself, and the exact
 * timestamp comes from the metadata card.js attaches at write time, which
 * Cloudflare returns with the list. That is what keeps this to one sweep
 * instead of one fetch per scan.
 *
 * @param {Array<{name: string, metadata?: {at?: string}}>} keys
 */
function summarise(keys) {
  const byBatch = {};
  const byDay = {};
  const timestamps = [];

  for (const key of keys) {
    /* scan:<batch>:<date>:<uuid>. The uuid contains no colons, so a plain
       split is safe and there is nothing to parse. */
    const [, batch, day] = key.name.split(':');
    if (!batch || !day) continue;

    byBatch[batch] = (byBatch[batch] || 0) + 1;
    byDay[day] = (byDay[day] || 0) + 1;

    const at = key.metadata?.at;
    if (typeof at === 'string') timestamps.push(at);
  }

  timestamps.sort();

  return {
    total: keys.length,
    /* Sorted so the output reads in order rather than in whatever order
       Cloudflare happened to return the keys. */
    byBatch: Object.fromEntries(Object.entries(byBatch).sort()),
    byDay: Object.fromEntries(Object.entries(byDay).sort()),
    firstScan: timestamps[0] ?? null,
    lastScan: timestamps[timestamps.length - 1] ?? null,
  };
}

/**
 * Handle a request to /card-stats.
 *
 * @param {Request} request
 * @param {object} env
 * @returns {Promise<Response>}
 */
export async function onCardStatsRequest(request, env) {
  if (request.method !== 'GET') return notFound();

  const expected = env.CARD_STATS_KEY;

  /* No key configured means no key can be right. Without this line an unset
     environment variable would quietly match an empty ?key= and publish the
     numbers to anybody who tried it. */
  if (!expected) return notFound();

  const supplied = new URL(request.url).searchParams.get('key');
  if (!supplied || !matches(supplied, expected)) return notFound();

  /* The binding being missing is a real state, not an error worth a 500. Say
     the truth: no records, therefore no scans. */
  if (!env.CARD_SCANS) {
    return json({ total: 0, byBatch: {}, byDay: {}, firstScan: null, lastScan: null });
  }

  return json(summarise(await listAllScans(env.CARD_SCANS)));
}

/**
 * @param {object} body
 * @returns {Response}
 */
function json(body) {
  /* Two spaces of indentation because the only reader is a person looking at
     a browser tab. no-store so a shared or corporate cache never holds a copy
     of the numbers; noindex so the address cannot end up in a search result
     if it is ever pasted somewhere public by accident. */
  return new Response(`${JSON.stringify(body, null, 2)}\n`, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}
