/* ---- article-sections.js — the body of a guide or a post ------------------
   Both long-form sections of the site are built the same way: a run of h2
   blocks, each carrying paragraphs and sometimes a list. guides.js and blog.js
   had a copy of that loop each, identical apart from the class prefix, which
   is two places to fix a markup bug and one of them will be missed.

   The prefix is the only thing that differs, so it is the only argument. The
   sheet that styles the output lists both prefixes in every selector, so the
   two sections look the same on purpose; this keeps the markup the same on
   purpose too.

   PARAGRAPHS AND LIST ITEMS ARE NOT ESCAPED. That is deliberate and it is
   checked. A sentence is sometimes written with a contextual <a> in it, and
   escaping the string would print the link as text instead of making one. Every
   string that reaches here is studio copy written in this repo, never user
   input. The build enforces the narrow rule that makes it safe: copy may carry
   a, em, strong and abbr, every tag must be closed, and anything else with a
   "<" in front of it fails the build. See findUnescapedCopy in tools/build.js. */

import { escapeHtml } from '../templates/page.js';

/**
 * Render the h2-and-body run of a guide or a post.
 *
 * @param {object[]} sections   Each with an `h2`, and `paragraphs` and/or `list`.
 * @param {string}   prefix     Class prefix, 'guide' or 'post'.
 * @returns {string} Markup for the whole run, sections separated by a blank line.
 */
export function renderArticleSections(sections, prefix) {
  return sections
    .map((section) => {
      const paragraphs = (section.paragraphs || [])
        .map((text) => `          <p>${text}</p>`)
        .join('\n');

      const list = section.list
        ? `          <ul class="${prefix}__list">\n${section.list
            .map((item) => `            <li>${item}</li>`)
            .join('\n')}\n          </ul>`
        : '';

      return `        <section class="${prefix}__section">
          <h2>${escapeHtml(section.h2)}</h2>
${[paragraphs, list].filter(Boolean).join('\n')}
        </section>`;
    })
    .join('\n\n');
}
