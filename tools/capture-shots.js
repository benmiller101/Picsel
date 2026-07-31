/* ---- capture-shots.js — the screenshot pipeline ---------------------------
   Run with `npm run shots`. Reads projects.js, opens each client's live site in
   a headless browser at two sizes, and writes optimised images to
   assets/work/<slug>/.

   Why a script and not a folder of hand-taken screenshots: client sites change.
   A hand-captured portfolio quietly rots into a gallery of sites that no longer
   look like that, and nobody notices because nobody re-checks. One command
   re-captures all of them, so refreshing the portfolio costs a minute rather
   than an afternoon — which is the difference between it happening and not.

   These are captures of CLIENT sites for portfolio display. They are not
   Picsel's property; the pipeline exists to show the work, nothing else.

   ONE COMMAND
     npm run shots              re-capture every project
     npm run shots -- <slug>    re-capture just one, e.g. `npm run shots -- lanora-house`
     npm run shots -- --variants-only   redo the downscaled sizes from the images
                                already on disk, without opening a client site

   WHAT IT PRODUCES
     assets/work/<slug>/desktop.webp   1440 x 900, the top of the page
     assets/work/<slug>/mobile.webp    390 x 844, the top of the page
     plus a downscaled copy at each width in VARIANT_WIDTHS, e.g. desktop-640.webp,
     so the markup can offer a browser a size that suits the slot it is filling

   A site that will not load is never fatal: it logs a warning, leaves any
   existing image alone, and carries on to the next one. A broken client server
   must not be able to break Picsel's build. */

import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

import { PROJECTS } from '../projects.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/* The two sizes the site actually shows. Desktop matches the width the design
   is composed at; mobile is a common phone viewport. Both capture the TOP of
   the page rather than the full scroll height — a card wants the site's front
   door, and a full-page capture of a long homepage renders as an unreadable
   sliver once it is scaled into a card. */
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900, scale: 1 },
  { name: 'mobile', width: 390, height: 844, scale: 2 },
];

/* webp at 82 is visually indistinguishable from the original on a screenshot of
   flat web design, at roughly a fifth of the size of a PNG. Page weight is a
   ranking factor and this is the heaviest thing on the site, so it matters. */
const IMAGE_QUALITY = 82;

/* ---- Responsive variants --------------------------------------------------
   The capture above is the full-size original. These are downscaled copies of
   the SAME picture, written alongside it, so the browser can pick a size that
   suits the slot it is filling.

   The reason this matters here more than on most sites: a card in the /work
   grid is about 540px wide on a desktop, and it was being handed the whole
   1440px capture. That is seven times the pixels actually used, on the largest
   image on the page, for an audience the plan describes as phone-first and
   often on a poor signal. It was the single heaviest thing the site did.

   Widths are chosen from the slots that exist, not from a standard ladder:
   640 covers a phone at 2x and a card at 1x, 1024 covers a card at 2x and the
   project page at 1x, and the original covers the project page hero at full
   width. Nothing is upscaled — a variant wider than the original is skipped. */
const VARIANT_WIDTHS = [640, 1024];

/* How long to give a client's server before giving up on it. Generous: some of
   these are small shared hosts that take a moment to wake up, and a false
   failure means a placeholder where a real screenshot should be. */
const NAV_TIMEOUT = 45_000;

/* After the page reports itself loaded, wait at least this long before looking
   at it. Fonts swap in and hero images decode. */
const SETTLE_MS = 1_500;

/* Then keep watching until the picture stops changing. A fixed wait cannot work
   for both a plain brochure site and one that plays a "loading portfolio"
   splash for six seconds — and picking a wait long enough for the slowest site
   would mean staring at every other one for no reason. Instead the page is
   photographed every STABLE_INTERVAL and the shutter only opens once two
   consecutive looks are identical.

   A site with a permanent animation — a rotating carousel, a video header —
   never goes still, so STABLE_MAX_MS is the point at which it gives up waiting
   and captures anyway. */
const STABLE_INTERVAL_MS = 700;
const STABLE_MAX_MS = 20_000;

/* Chrome is already on the machine — Ben's own browser. Using it directly means
   `npm install` does not have to download a second copy of Chromium, which is
   about 150MB and would have to be re-downloaded on every machine and in CI.
   PUPPETEER_EXECUTABLE_PATH overrides, for anywhere Chrome lives somewhere
   unusual. */
const CHROME_PATHS = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe'),
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);

function findChrome() {
  const found = CHROME_PATHS.find((path) => existsSync(path));
  if (found) return found;

  throw new Error(
    'Could not find Chrome.\n' +
      'Install Google Chrome, or point at it directly:\n' +
      '  PUPPETEER_EXECUTABLE_PATH="/path/to/chrome" npm run shots\n' +
      `Looked in:\n  ${CHROME_PATHS.join('\n  ')}`,
  );
}

/* A neat placeholder for a site that would not load, drawn as SVG so it is a
   couple of hundred bytes and stays sharp at any size. It says plainly that the
   screenshot is missing rather than pretending to be the site — a stretched
   grey box that looks like a failed image is worse than an honest one.

   Colours are the site's own tokens, written out here because an SVG file on
   disk cannot read tokens.css. If the palette changes, these change with it. */
function placeholderSvg(project, viewport) {
  const label = `${project.name} — screenshot pending`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${viewport.width}" height="${viewport.height}" viewBox="0 0 ${viewport.width} ${viewport.height}" role="img" aria-label="${escapeXml(label)}">
  <rect width="100%" height="100%" fill="#131313"/>
  <rect x="0.5" y="0.5" width="${viewport.width - 1}" height="${viewport.height - 1}" fill="none" stroke="rgba(255,255,255,0.12)"/>
  <text x="50%" y="50%" fill="rgba(255,255,255,0.52)" font-family="Lexend, system-ui, sans-serif" font-size="${Math.round(viewport.width / 34)}" text-anchor="middle" dominant-baseline="middle">${escapeXml(label)}</text>
</svg>
`;
}

/* Renders that SVG to a webp of exactly the size a real capture would be, using
   the browser that is already open. */
async function renderPlaceholder(browser, project, viewport) {
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: viewport.width, height: viewport.height, deviceScaleFactor: 1 });
    await page.setContent(
      `<body style="margin:0">${placeholderSvg(project, viewport)}</body>`,
      { waitUntil: 'domcontentloaded' },
    );
    return await page.screenshot({ type: 'webp', quality: IMAGE_QUALITY, fullPage: false });
  } finally {
    await page.close();
  }
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function captureProject(browser, project, warnings) {
  const outDir = join(ROOT, 'assets', 'work', project.slug);
  await mkdir(outDir, { recursive: true });

  for (const viewport of VIEWPORTS) {
    const outPath = join(outDir, `${viewport.name}.webp`);
    const page = await browser.newPage();

    try {
      await page.setViewport({
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: viewport.scale,
        isMobile: viewport.name === 'mobile',
        hasTouch: viewport.name === 'mobile',
      });

      /* Identify honestly rather than pretending to be a person browsing. These
         are Picsel's own clients and the captures are of their own sites, so
         there is nothing to hide, and a truthful agent string means a site
         owner reading their logs can see exactly what this was. */
      await page.setUserAgent(
        'Mozilla/5.0 (compatible; PicselPortfolioBot/1.0; +portfolio screenshot; contact benwmiller101@gmail.com)',
      );

      await openPage(page, project.url);

      // Fonts specifically, on top of the settle wait — a capture taken during
      // a font swap shows the fallback face, which misrepresents the design.
      await page.evaluate(() => document.fonts && document.fonts.ready);
      await new Promise((r) => setTimeout(r, SETTLE_MS));

      /* Cookie banners. Nearly every site has one and it covers exactly the
         part of the page a portfolio card shows.

         The banner is HIDDEN, not accepted. Clicking "accept all" would be
         agreeing to tracking on someone else's behalf, which is not a script's
         call to make even on a client's own site — and it is not needed, since
         all that is wanted is a clean picture. Hiding the overlay changes
         nothing about the page underneath and consents to nothing. */
      await hideCookieBanner(page);
      await waitForStable(page);

      const buffer = await page.screenshot({
        type: 'webp',
        quality: IMAGE_QUALITY,
        // The visible screen only, not the whole scroll height — see VIEWPORTS.
        fullPage: false,
      });

      await writeFile(outPath, buffer);
      console.log(`  shot   ${project.slug.padEnd(22)} ${viewport.name.padEnd(8)} ${(buffer.length / 1024).toFixed(0)}KB`);
    } catch (error) {
      /* Never fatal. A client's server being slow or down today must not stop
         Picsel rebuilding its own site, and it must not silently replace a good
         screenshot from last week with a placeholder either. */
      const kept = await fileExists(outPath);
      warnings.push(
        `${project.slug} (${viewport.name}): ${project.url} — ${error.message.split('\n')[0]}` +
          (kept ? ' [kept the existing image]' : ' [wrote a placeholder]'),
      );

      /* The placeholder is written as a webp under the SAME name a real capture
         would have used. The alternative — writing a .svg alongside — would
         make every page that shows a screenshot ask which of two files exists,
         and get it wrong on the day a capture starts working again. One name,
         always present. */
      if (!kept) {
        await writeFile(outPath, await renderPlaceholder(browser, project, viewport));
      }
    } finally {
      await page.close();
    }
  }
}

/* Opens a URL, preferring a fully-settled page but never insisting on one.
 *
 * networkidle2 — "no more than two connections busy for half a second" — is the
 * right target, because 'load' fires before lazy-loaded images have decoded and
 * captures a page with holes in it. But plenty of ordinary sites never reach
 * network idle at all: a live chat widget, an analytics heartbeat or an open
 * websocket keeps a connection alive forever, and the wait then fails on a page
 * that has actually been sitting there finished for thirty seconds.
 *
 * So it is a preference, not a condition. If idle never arrives, the page is
 * used as it stands — and waitForStable() below is what then decides whether it
 * is really ready, by looking at it rather than at its network. */
async function openPage(page, url) {
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: NAV_TIMEOUT });
    return;
  } catch (error) {
    if (!/timeout/i.test(error.message)) throw error;
  }

  /* Did anything actually arrive? A page with content is fine to photograph; a
     blank one means the navigation genuinely failed, and that is a real error
     for the caller to turn into a warning and a placeholder. */
  const hasContent = await page
    .evaluate(() => !!document.body && document.body.innerText.trim().length > 0)
    .catch(() => false);

  if (!hasContent) {
    throw new Error(`No content after ${NAV_TIMEOUT / 1000}s`);
  }
}

/* Waits until the page stops changing, by photographing it repeatedly and
   comparing. Cheap, low-quality frames — this is a "has anything moved?"
   question, not a picture anyone will see. */
async function waitForStable(page) {
  const { createHash } = await import('node:crypto');
  const look = async () => {
    const shot = await page.screenshot({ type: 'jpeg', quality: 20, fullPage: false });
    return createHash('sha1').update(shot).digest('hex');
  };

  let previous = await look();
  const deadline = Date.now() + STABLE_MAX_MS;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, STABLE_INTERVAL_MS));
    const current = await look();
    if (current === previous) return true;
    previous = current;
  }

  // Still moving. Captured anyway — a site with a permanent animation has no
  // still moment to wait for, and one frame of it is a fair picture of it.
  return false;
}

/* Hides consent overlays so they are not the subject of the screenshot.
   Nothing is clicked and no preference is recorded — the banner is simply not
   drawn, and the page beneath it is captured as it already is.

   Matched by the container ids and classes the common consent tools use. An
   overlay this does not recognise is left alone and appears in the picture,
   which is a visibly wrong screenshot rather than a silently wrong one. */
async function hideCookieBanner(page) {
  try {
    await page.evaluate(() => {
      const CONTAINERS = [
        '#onetrust-consent-sdk',
        '#CybotCookiebotDialog',
        '.cky-consent-container',
        '.cc-window',
        '#cookie-notice',
        '#cookie-law-info-bar',
        '.cookie-banner',
        '.cookie-consent',
        '[aria-label*="cookie" i][role="dialog"]',
      ];
      for (const selector of CONTAINERS) {
        for (const el of document.querySelectorAll(selector)) {
          el.style.setProperty('display', 'none', 'important');
        }
      }

      /* Consent tools often lock scrolling and dim the page while the banner is
         up. Hiding the banner alone would leave the whole screenshot greyed
         out, so the dimming is lifted too. */
      for (const el of [document.documentElement, document.body]) {
        el.style.setProperty('overflow', 'auto', 'important');
        el.style.removeProperty('filter');
      }
    });

    // A moment for the page to reflow into the space the banner was using.
    await new Promise((r) => setTimeout(r, 300));
  } catch {
    // A banner inside a cross-origin iframe cannot be reached, and that is fine.
  }
}

async function main() {
  /* `npm run shots -- <slug>` re-captures one project. Useful when a single
     client redesigns and there is no reason to hammer the other four. */
  /* --variants-only regenerates the downscaled sizes from the images already on
     disk, without opening a single client site. That is what you want after
     changing VARIANT_WIDTHS: the pictures have not changed, only the sizes
     wanted from them. */
  const args = process.argv.slice(2);
  const variantsOnly = args.includes('--variants-only');
  const onlySlug = args.find((arg) => !arg.startsWith('--'));
  const targets = onlySlug
    ? PROJECTS.filter((project) => project.slug === onlySlug)
    : PROJECTS;

  if (!targets.length) {
    console.error(
      `No project with slug "${onlySlug}". Known slugs:\n  ${PROJECTS.map((p) => p.slug).join('\n  ')}`,
    );
    process.exitCode = 1;
    return;
  }

  const executablePath = findChrome();
  const warnings = [];

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--hide-scrollbars', '--disable-features=IsolateOrigins,site-per-process'],
  });

  try {
    // One site at a time. These are small client servers, and firing five
    // concurrent headless browsers at them is rude for no gain.
    for (const project of targets) {
      if (!variantsOnly) await captureProject(browser, project, warnings);
      /* Always, even when the capture above failed: the variants are made from
         whatever image is on disk, so they match what the site will serve. */
      await writeVariants(browser, project, warnings);
    }
  } finally {
    await browser.close();
  }

  if (warnings.length) {
    console.warn('');
    for (const warning of warnings) console.warn(`  WARN   ${warning}`);
  }

  console.log(
    `\nCaptured ${targets.length} project(s)` +
      `${warnings.length ? ` with ${warnings.length} warning(s)` : ''}.`,
  );
}

/* ---- Making the variants --------------------------------------------------
   Deliberately a separate pass over the files ON DISK rather than something
   done to the buffer inside captureProject. Two reasons, and both are about
   not producing a half-built set:

   1. A capture that fails keeps last week's good screenshot. If variants were
      made from the capture buffer, that project would end up with a current
      original and no variants, and every srcset pointing at it would 404.
      Reading from disk means the variants always match whatever image the
      site is actually going to serve, however it got there.
   2. It can be re-run on its own. Changing VARIANT_WIDTHS should not mean
      photographing five client sites again.

   The downscaling is done by the browser that is already open: the image is
   drawn into a canvas at the target width and read back out as webp. It is not
   a general image library and does not need to be — one bilinear downscale of
   a screenshot is exactly what a canvas is good at. */
async function writeVariants(browser, project, warnings) {
  const outDir = join(ROOT, 'assets', 'work', project.slug);
  const page = await browser.newPage();

  try {
    for (const viewport of VIEWPORTS) {
      const source = join(outDir, `${viewport.name}.webp`);
      if (!(await fileExists(source))) continue;

      const dataUrl = `data:image/webp;base64,${(await readFile(source)).toString('base64')}`;

      for (const width of VARIANT_WIDTHS) {
        const result = await page.evaluate(
          (src, targetWidth, quality) =>
            new Promise((resolve) => {
              const img = new Image();
              img.onload = () => {
                /* Never upscale. A 640-wide variant of a 390-wide phone capture
                   would be a bigger file carrying no more detail. */
                if (img.naturalWidth <= targetWidth) return resolve(null);

                const canvas = document.createElement('canvas');
                canvas.width = targetWidth;
                canvas.height = Math.round(img.naturalHeight * (targetWidth / img.naturalWidth));
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve({
                  data: canvas.toDataURL('image/webp', quality).split(',')[1],
                  height: canvas.height,
                });
              };
              img.onerror = () => resolve(null);
              img.src = src;
            }),
          dataUrl,
          width,
          IMAGE_QUALITY / 100,
        );

        if (!result) continue;

        const outPath = join(outDir, `${viewport.name}-${width}.webp`);
        const buffer = Buffer.from(result.data, 'base64');
        await writeFile(outPath, buffer);
        console.log(
          `  size   ${project.slug.padEnd(22)} ${`${viewport.name}-${width}`.padEnd(14)} ` +
            `${(buffer.length / 1024).toFixed(0)}KB`,
        );
      }
    }
  } catch (error) {
    warnings.push(`${project.slug}: could not write responsive variants — ${error.message}`);
  } finally {
    await page.close();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
