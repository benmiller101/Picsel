/* ---- inline-svg.js — a diagram, put into the page rather than linked -------
   Reads an SVG out of assets/diagrams and returns it ready to drop into a
   page, with every id inside it renamed so two diagrams on one page cannot
   collide.

   WHY INLINE AND NOT <img src>. Three reasons and each one is load-bearing:

     1. The diagrams carry their own <title> and <desc>, which is how a screen
        reader gets the whole chart read out as a sentence. Inside an <img>
        that markup is unreachable: the browser treats the file as a picture
        and the only thing a reader gets is the alt attribute, which cannot
        hold four sentences of description without being absurd.
     2. They are painted with CSS custom properties. A var() inside an <img>
        resolves against nothing, because the file is a separate document with
        no access to the page's tokens, so every colour would silently drop to
        its fallback.
     3. Two fewer requests on a page that already loads two screenshots.

   WHY THE IDS HAVE TO BE RENAMED. The flow diagram defines <marker id="arw">
   and points its arrowheads at url(#arw). Ids are global to the document once
   inlined, so a second diagram, or any other part of the page, defining "arw"
   would leave the browser resolving one of them for both. Whichever it picks
   is a coin toss and the loser's arrowheads disappear. The same is true of
   aria-labelledby: two diagrams both claiming "title" would have one of them
   read out under the other's name.

   So every id gets the diagram's own prefix, and every reference to it is
   rewritten in the same pass. Nothing else in the file is touched: the paths,
   the numbers, the wording and the colours are exactly as drawn. */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIAGRAMS = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'assets', 'diagrams');

/**
 * Read a diagram and namespace its ids.
 *
 * @param {string} file    Filename inside assets/diagrams, with extension.
 * @param {string} prefix  Short, unique per diagram on a page. Becomes "prefix-id".
 * @returns {string} The SVG markup, ready to inline.
 */
export function inlineSvg(file, prefix) {
  const raw = readFileSync(join(DIAGRAMS, file), 'utf8').trim();

  /* Collect the ids the file actually defines, rather than rewriting anything
     that looks like one. A value inside url(#...) that was never defined here
     is a reference to something else on the page and renaming it would break
     the very thing this function exists to protect. */
  const defined = new Set([...raw.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  if (!defined.size) return raw;

  const renamed = (id) => `${prefix}-${id}`;

  let out = raw;

  for (const id of defined) {
    /* Escaped because an id is author-controlled and a stray "." or "(" in one
       would otherwise be read as regex syntax and match the wrong thing. */
    const safe = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // The definition itself.
    out = out.replace(new RegExp(`(\\sid=")${safe}(")`, 'g'), `$1${renamed(id)}$2`);

    // url(#id) in fill, stroke, marker-end, clip-path and friends.
    out = out.replace(new RegExp(`url\\(#${safe}\\)`, 'g'), `url(#${renamed(id)})`);

    // href="#id", for <use> and links.
    out = out.replace(new RegExp(`((?:xlink:)?href=")#${safe}(")`, 'g'), `$1#${renamed(id)}$2`);
  }

  /* aria-labelledby holds a space-separated list, so it is rewritten as a list
     rather than by string replacement: "ccTitle ccDesc" has to become two
     renamed ids and not one mangled string. Only ids this file defines are
     touched, for the reason given above. */
  out = out.replace(/aria-labelledby="([^"]+)"/g, (whole, list) => {
    const ids = list.split(/\s+/).filter(Boolean)
      .map((id) => (defined.has(id) ? renamed(id) : id));
    return `aria-labelledby="${ids.join(' ')}"`;
  });

  return out;
}
