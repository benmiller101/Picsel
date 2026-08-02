/* ---- palette.js — the blob gradients --------------------------------------
   The colours the blobs are painted with, shared by the homepage hero and by
   the small blob in the /work/ and /contact/ page heads.

   In its own module for the same reason noise.js is: two files need it, and a
   second copy is a set of hex values that can drift apart without anyone
   noticing until the two blobs on two pages are visibly different colours.

   Sourced from colour-palette.txt (the same six gradients the mesh-wheel page
   uses). Edit here rather than re-reading that file: this is a plain static
   site and fetch() is blocked on file://, so the palette is inlined
   deliberately.

   Grouped into FAMILIES, and the hero's blob i only ever draws from family i.

   That matters more than it looks. With one flat list, the colour breathing
   picks any gradient for any blob, and within a minute or two both blobs have
   wandered into the same corner of the palette — two purple blobs, no contrast,
   nothing like the reference. Keeping each blob inside its own family means the
   cool/warm pairing survives however long the page is left running.

   Add a family to give a third blob its own identity.

   FIVE stops, and fully saturated ones.

   The reference sweeps a wide hue range across a single blob — green through
   teal and blue to violet on one, yellow through red to magenta and lime on the
   other — in pure colour. Three mid-saturation stops cannot do that: the spots
   overlap, average toward their common hue, and the blob comes out as one muted
   colour with a tint. Wide hue span + full saturation is what reads as bold.

   Keep these vivid. Anything desaturated here goes grey once blurred, because
   blurring colours that sit on opposite sides of the wheel averages toward the
   middle of it. */
export const BLOB_GRADIENTS = [
  [ // family 0 — cool: green -> cyan -> blue -> violet -> magenta
    ['#00e676', '#00d4ff', '#3d5afe', '#9c27ff', '#ff29c3'],
    ['#2bff88', '#00c2ff', '#5b6cff', '#b14dff', '#ff4fd8'],
    ['#00ffa3', '#00b0ff', '#4a3dff', '#8b2fff', '#e838ff'],
  ],
  [ // family 1 — warm: yellow -> amber -> red -> pink -> lime
    ['#ffe600', '#ffa000', '#ff2d55', '#ff1493', '#b6e800'],
    ['#fff02e', '#ff8c1a', '#ff1f4b', '#ff3da6', '#c8f03a'],
    ['#ffd600', '#ff7300', '#ff0a3c', '#ff2d95', '#a8e000'],
  ],
];
