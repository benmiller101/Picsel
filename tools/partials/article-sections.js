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
   "<" in front of it fails the build. See findUnescapedCopy in tools/build.js.

   EVERYTHING ELSE HERE IS STRUCTURE, NOT COPY, and that distinction is what
   keeps the rule above honest. A table, a figure or an image is described as
   data and the markup is generated here, so no page writes a "<table>" into a
   copy string and no page needs an exemption from the check. The check reads
   only inside <p> and <li>, so the elements this file emits around them are
   outside its remit by construction rather than by permission.
   ------------------------------------------------------------------------- */

import { escapeHtml } from '../templates/page.js';
import { inlineSvg } from './inline-svg.js';

/* A table of figures, which somebody comparing quotes will read before any
   paragraph on the page.

   scope="col" and scope="row" are not decoration. Without them a screen reader
   reads a grid of numbers with no way to tell which column heading each one
   belongs to, and for a price table that is the difference between useful and
   misleading. The first cell of every row is a th for the same reason. */
function renderTable(table, prefix) {
  const head = table.head
    .map((cell) => `                <th scope="col">${escapeHtml(cell)}</th>`)
    .join('\n');

  const rows = table.rows
    .map((row) => {
      const [first, ...rest] = row;
      const cells = rest
        .map((cell) => `                <td>${escapeHtml(cell)}</td>`)
        .join('\n');
      return [
        '              <tr>',
        `                <th scope="row">${escapeHtml(first)}</th>`,
        cells,
        '              </tr>',
      ].join('\n');
    })
    .join('\n');

  const caption = table.caption
    ? `              <caption>${escapeHtml(table.caption)}</caption>\n`
    : '';

  /* Wrapped in its own scrolling box. A four column price table cannot shrink
     below the width of its longest cell, so on a 375px phone something has to
     give: either the table scrolls inside this div, or the whole page scrolls
     sideways and every other line of the article moves with it. */
  return `          <div class="${prefix}__table-wrap">
            <table class="${prefix}__table">
${caption}              <thead>
                <tr>
${head}
                </tr>
              </thead>
              <tbody>
${rows}
              </tbody>
            </table>
          </div>`;
}

/* One diagram, or one row of pictures.

   NO <figcaption>, and it is a deliberate omission rather than a gap. Each SVG
   carries its own <title> and <desc>, which is what a screen reader reads and
   what the sighted reader can already see drawn into the diagram. A caption
   repeating the title puts the same sentence on the page twice, once for each
   reader, with each one announcing the other.

   NO alt EITHER, on the inline diagrams. alt belongs to <img>. An inline <svg>
   carries role="img" and aria-labelledby pointing at its own title and desc,
   and adding alt to it does nothing at all except look like it works. */
function renderFigure(figure, prefix) {
  if (figure.svg) {
    const svg = inlineSvg(figure.svg, figure.prefix)
      .split('\n')
      .map((line) => `            ${line}`)
      .join('\n');

    return `          <figure class="${prefix}__figure">
${svg}
          </figure>`;
  }

  /* width and height are stated on every picture. They are not the size it
     draws at, which the stylesheet decides. They are the ratio, and the browser
     uses them to reserve the right shape of space before the file arrives.
     Without them the text below jumps down the moment each one loads, which is
     the most irritating thing a page can do to somebody already reading it.

     loading="lazy" because these sit well below the fold. */
  const pictures = figure.images
    .map(
      (image) => `            <img
              src="${escapeHtml(image.src)}"
              alt="${escapeHtml(image.alt)}"
              width="${image.width}"
              height="${image.height}"
              loading="lazy"
              decoding="async" />`,
    )
    .join('\n');

  return `          <figure class="${prefix}__figure ${prefix}__figure--pair">
${pictures}
          </figure>`;
}

function renderList(items, prefix, numbered) {
  const tag = numbered ? 'ol' : 'ul';
  const extra = numbered ? ` ${prefix}__list--numbered` : '';
  const lines = items.map((item) => `            <li>${item}</li>`).join('\n');

  return `          <${tag} class="${prefix}__list${extra}">
${lines}
          </${tag}>`;
}

/* ONE BLOCK, IN THE ORDER THE PAGE PUTS IT.

   A section used to be paragraphs, then optionally a list, and for five guides
   written as one argument top to bottom that was enough. It stops being enough
   the moment a section has a table with a paragraph after it, or a diagram
   that belongs between the second and third paragraph rather than at the end.
   Fixed slots can only render in slot order, so a page like that comes out
   with its own sentences rearranged. That is not a layout problem. That is the
   renderer editing the copy.

   So a section may instead carry `blocks`, rendered strictly in the order
   written. The old fields still work and still mean what they meant, and
   nothing already published had to be touched to add this. */
function renderBlock(block, prefix) {
  if (block.p) return `          <p>${block.p}</p>`;
  if (block.table) return renderTable(block.table, prefix);
  if (block.figure) return renderFigure(block.figure, prefix);
  if (block.list) return renderList(block.list, prefix, false);

  /* Numbered, for the one case a bulleted list gets wrong: a set of questions
     a reader works through and may refer back to. "The third one" only means
     something if the page numbered them. */
  if (block.orderedList) return renderList(block.orderedList, prefix, true);

  throw new Error(
    'article-sections: a block carries none of p, table, figure, list or '
    + `orderedList: ${JSON.stringify(block)}`,
  );
}

/**
 * Render the h2-and-body run of a guide or a post.
 *
 * @param {object[]} sections   Each with an `h2`, and either `blocks` rendered
 *                              in order, or the older `paragraphs` and `list`.
 * @param {string}   prefix     Class prefix, 'guide' or 'post'.
 * @returns {string} Markup for the whole run, sections separated by a blank line.
 */
export function renderArticleSections(sections, prefix) {
  return sections
    .map((section) => {
      let body;

      if (section.blocks) {
        body = section.blocks.map((block) => renderBlock(block, prefix)).join('\n');
      } else {
        const paragraphs = (section.paragraphs || [])
          .map((text) => `          <p>${text}</p>`)
          .join('\n');

        const list = section.list ? renderList(section.list, prefix, false) : '';

        body = [paragraphs, list].filter(Boolean).join('\n');
      }

      return `        <section class="${prefix}__section">
          <h2>${escapeHtml(section.h2)}</h2>
${body}
        </section>`;
    })
    .join('\n\n');
}
