/* ---- breadcrumbs.js — the visible trail -----------------------------------
   Fed the SAME array that schema.js's breadcrumbs() turns into JSON-LD. That
   is the whole design: a trail a reader sees and a trail Google reads that are
   generated from one argument cannot drift apart, and drift is the normal
   failure here. The schema said /work/ and the page said Home for months on
   plenty of sites.

   The last crumb is the current page and is not a link. Linking a page to
   itself gives a reader a control that does nothing. */

import { escapeHtml } from '../templates/page.js';

export function renderBreadcrumbs(trail) {
  const items = trail
    .map((crumb, index) => {
      const isLast = index === trail.length - 1;
      const inner = isLast
        ? `<span aria-current="page">${escapeHtml(crumb.name)}</span>`
        : `<a href="${escapeHtml(crumb.path)}">${escapeHtml(crumb.name)}</a>`;
      return `          <li class="breadcrumbs__item">${inner}</li>`;
    })
    .join('\n');

  return `    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <div class="wrap">
        <ol class="breadcrumbs__list">
${items}
        </ol>
      </div>
    </nav>`;
}
