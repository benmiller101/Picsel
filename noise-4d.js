/* ---- noise-4d.js — seeded 4D simplex noise ---------------------------------
   The 3D field in noise.js is what the site runs on. This is its four
   dimensional sibling, and it exists for one reason: making a field REPEAT.

   You get a repeating field out of noise by walking a CLOSED LOOP through a
   higher dimensional one. Going once round a circle brings you back to the noise
   you started from, so the values match by construction rather than by any
   blending or mirroring — which would soften the field and cost it the
   quantised, clustered character that is the whole effect. Each axis that has to
   close needs its own circle, and a circle needs two dimensions.

   Two callers, which is why it lives here rather than inside either of them:
   tools/export-backdrop.js closes the two SPACE axes, to write a tile that can be
   butted against itself; tools/export-backdrop-video.js closes the TIME axis, to
   write a clip whose last frame runs into its first.

   Why not sample a torus embedded in 3D, which would also close two loops:
   a torus whose two radii are forced equal by a square tile is degenerate at its
   centre and the pattern smears badly along one axis. In 4D both circles are the
   same size and neither is distorted.

   Seeded the same way as noise.js — the same mulberry32 shuffle — so a seed means
   the same thing in both and a repeating field is the same texture as the site's,
   not merely a similar one.
*/

export function makeNoise4D(seed) {
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  // The same mulberry32 shuffle as noise.js, so "seed" means the same thing.
  let a = seed >>> 0;
  const rnd = () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const tmp = p[i]; p[i] = p[j]; p[j] = tmp;
  }
  const perm = new Uint8Array(512);
  const permMod32 = new Uint8Array(512);
  for (let i = 0; i < 512; i++) {
    perm[i] = p[i & 255];
    permMod32[i] = perm[i] % 32;
  }

  const GRAD = [
    [0, 1, 1, 1], [0, 1, 1, -1], [0, 1, -1, 1], [0, 1, -1, -1],
    [0, -1, 1, 1], [0, -1, 1, -1], [0, -1, -1, 1], [0, -1, -1, -1],
    [1, 0, 1, 1], [1, 0, 1, -1], [1, 0, -1, 1], [1, 0, -1, -1],
    [-1, 0, 1, 1], [-1, 0, 1, -1], [-1, 0, -1, 1], [-1, 0, -1, -1],
    [1, 1, 0, 1], [1, 1, 0, -1], [1, -1, 0, 1], [1, -1, 0, -1],
    [-1, 1, 0, 1], [-1, 1, 0, -1], [-1, -1, 0, 1], [-1, -1, 0, -1],
    [1, 1, 1, 0], [1, 1, -1, 0], [1, -1, 1, 0], [1, -1, -1, 0],
    [-1, 1, 1, 0], [-1, 1, -1, 0], [-1, -1, 1, 0], [-1, -1, -1, 0],
  ];
  const F4 = (Math.sqrt(5) - 1) / 4;
  const G4 = (5 - Math.sqrt(5)) / 20;

  return function noise4(xin, yin, zin, win) {
    const s = (xin + yin + zin + win) * F4;
    const i = Math.floor(xin + s), j = Math.floor(yin + s);
    const k = Math.floor(zin + s), l = Math.floor(win + s);
    const t = (i + j + k + l) * G4;
    const x0 = xin - (i - t), y0 = yin - (j - t);
    const z0 = zin - (k - t), w0 = win - (l - t);

    /* Which of the 24 orderings of the four coordinates this point falls in,
       found by ranking them against each other. The rank of an axis is how many
       of the others it beats, and the corners of the simplex are then the axes
       taken in that order — rank 3 first, then 2, then 1. */
    let rx = 0, ry = 0, rz = 0, rw = 0;
    if (x0 > y0) rx++; else ry++;
    if (x0 > z0) rx++; else rz++;
    if (x0 > w0) rx++; else rw++;
    if (y0 > z0) ry++; else rz++;
    if (y0 > w0) ry++; else rw++;
    if (z0 > w0) rz++; else rw++;

    const i1 = rx >= 3 ? 1 : 0, j1 = ry >= 3 ? 1 : 0, k1 = rz >= 3 ? 1 : 0, l1 = rw >= 3 ? 1 : 0;
    const i2 = rx >= 2 ? 1 : 0, j2 = ry >= 2 ? 1 : 0, k2 = rz >= 2 ? 1 : 0, l2 = rw >= 2 ? 1 : 0;
    const i3 = rx >= 1 ? 1 : 0, j3 = ry >= 1 ? 1 : 0, k3 = rz >= 1 ? 1 : 0, l3 = rw >= 1 ? 1 : 0;

    const x1 = x0 - i1 + G4, y1 = y0 - j1 + G4, z1 = z0 - k1 + G4, w1 = w0 - l1 + G4;
    const x2 = x0 - i2 + 2 * G4, y2 = y0 - j2 + 2 * G4, z2 = z0 - k2 + 2 * G4, w2 = w0 - l2 + 2 * G4;
    const x3 = x0 - i3 + 3 * G4, y3 = y0 - j3 + 3 * G4, z3 = z0 - k3 + 3 * G4, w3 = w0 - l3 + 3 * G4;
    const x4 = x0 - 1 + 4 * G4, y4 = y0 - 1 + 4 * G4, z4 = z0 - 1 + 4 * G4, w4 = w0 - 1 + 4 * G4;

    const ii = i & 255, jj = j & 255, kk = k & 255, ll = l & 255;
    let n = 0;

    const corner = (gi, x, y, z, w) => {
      let t2 = 0.6 - x * x - y * y - z * z - w * w;
      if (t2 < 0) return 0;
      t2 *= t2;
      const g = GRAD[gi];
      return t2 * t2 * (g[0] * x + g[1] * y + g[2] * z + g[3] * w);
    };

    n += corner(permMod32[ii + perm[jj + perm[kk + perm[ll]]]], x0, y0, z0, w0);
    n += corner(permMod32[ii + i1 + perm[jj + j1 + perm[kk + k1 + perm[ll + l1]]]], x1, y1, z1, w1);
    n += corner(permMod32[ii + i2 + perm[jj + j2 + perm[kk + k2 + perm[ll + l2]]]], x2, y2, z2, w2);
    n += corner(permMod32[ii + i3 + perm[jj + j3 + perm[kk + k3 + perm[ll + l3]]]], x3, y3, z3, w3);
    n += corner(permMod32[ii + 1 + perm[jj + 1 + perm[kk + 1 + perm[ll + 1]]]], x4, y4, z4, w4);

    return 27 * n; // ~[-1, 1]
  };
}
