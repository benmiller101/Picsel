/* ---- worker.js — the two addresses on this site that are not files --------
   Everything on picsel.co.uk is a static file: Cloudflare takes what is in
   the repo, puts it on its edge, and hands it out. That is what wrangler.jsonc
   describes and it is still true for every page.

   Two addresses are not files. /card is the QR code on the business cards,
   which has to count the scan and send the person on, and /card-stats reads
   those counts back. Neither can be a file, because a file cannot do
   anything.

   This is the smallest possible way to allow that. Cloudflare only runs this
   script when a request matches no file at all, so every page, stylesheet,
   screenshot and font on the site is served exactly as it was before, without
   this code being involved. Only the two named paths below are handled here.
   Everything else is handed straight back to the static files, which includes
   the real 404 page for a typo'd address.

   WHY THIS FILE MUST NOT BE PUBLISHED AS AN ASSET. card.js contains the
   Picsel HQ address, and the reason the scan counting happens on a server at
   all is that the address never reaches a browser. Served as a file it would
   be readable by anybody.

   This used to depend on .assetsignore naming worker.js and functions/ by
   hand. It no longer does. The assets directory is dist/, which tools/build.js
   writes from nothing on every run and fills only with files the built pages
   reference. This file is not one of them and cannot become one: it is never
   linked from a page, so the collector in tools/assets.js has no way to reach
   it. Wrangler bundles it into the Worker separately, which is how it runs.

   The rule that keeps that true: nothing in dist/ is authored, and nothing
   gets in by being added to a list. If a file needs to be on the web, a page
   has to ask for it. */

import { onCardRequest } from './functions/card.js';
import { onCardStatsRequest } from './functions/card-stats.js';

export default {
  /**
   * @param {Request} request
   * @param {object} env Bindings: ASSETS, CARD_SCANS, and the two secrets.
   * @param {{waitUntil: (p: Promise<unknown>) => void}} ctx
   * @returns {Promise<Response>|Response}
   */
  fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);

    /* Both spellings, with and without the trailing slash. The site's
       auto-trailing-slash rule only applies to paths that match a real
       directory, and these two match nothing on disk, so a person who types
       or prints /card/ would otherwise get the 404 page. A wrong slash on a
       printed card is not a mistake worth having. */
    switch (pathname) {
      case '/card':
      case '/card/':
        return onCardRequest(request, env, ctx);

      case '/card-stats':
      case '/card-stats/':
        return onCardStatsRequest(request, env);

      default:
        return env.ASSETS.fetch(request);
    }
  },
};
