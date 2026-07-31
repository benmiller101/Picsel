/* ---- words.js — numbers written the way the site writes them --------------
   Small counts appear as words in body copy ("five sites are live"), not as
   digits, because that is how the rest of the site reads and how a person
   would say it aloud. Digits are kept for things that are genuinely data: a
   phone number, a price, a year.

   This lives in one place because two pages needed the same list and each had
   started keeping its own. Two copies of a lookup table are two tables that
   will eventually disagree. */

const COUNT_WORDS = [
  'no', 'one', 'two', 'three', 'four', 'five',
  'six', 'seven', 'eight', 'nine', 'ten',
];

/**
 * @param {number} n
 * @param {object} [options]
 * @param {boolean} [options.capitalise] For the start of a sentence.
 * @returns {string} The number as a word up to ten, then as digits.
 */
export function countWord(n, { capitalise = false } = {}) {
  const word = COUNT_WORDS[n] ?? String(n);
  return capitalise ? word.charAt(0).toUpperCase() + word.slice(1) : word;
}
