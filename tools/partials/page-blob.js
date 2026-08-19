/* ---- page-blob.js — the blob in a page head -------------------------------
   The markup half of the page-head blob. The drawing half is /page-blob.js in
   the site root; this is only the box it is drawn into.

   Used by /work/ and /contact/, whose heads are both a heading and a short lede
   against the left of the grid with a wide column of nothing beside them. On a
   desktop that emptiness reads as a gap rather than as space, and the blob is
   what the homepage already uses to fill it.

   aria-hidden, and no alt text anywhere: it is decoration and says nothing a
   visitor needs. Announcing "blob" to a screen reader would be noise.

   With JavaScript off, blocked or still loading, this is an empty box that
   collapses to nothing visible. The page head is unaffected either way, which
   is the test any decoration on this site has to pass. */
export const PAGE_BLOB = `        <div class="page-blob" aria-hidden="true">
          <canvas class="page-blob__canvas"></canvas>
        </div>`;

/* The homepage's one, in the empty half of the "What we do" column. Same box
   and the same script finds it; the modifier only changes where it sits and how
   big it is, which is a fact about that column and not about the blob. */
export const SERVICES_BLOB = `          <div class="page-blob page-blob--services" aria-hidden="true">
            <canvas class="page-blob__canvas"></canvas>
          </div>`;

/* The script that draws it. A module, so it can import the noise generator it
   shares with the backdrop and the palette it shares with the hero. Modules are
   deferred by default: it waits for the page to be parsed and never blocks it
   from appearing. */
export const PAGE_BLOB_SCRIPT = '  <script type="module" src="/page-blob.js"></script>';
