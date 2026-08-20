# Brief: port the Work ring into the Picsel site

Give this file to Claude Code with the prototype sitting next to it. It is written for an agent that
has the repo open, not for a human to follow by hand.

**Inputs**

- `work-ring-prototype.html` (save it at the repo root before you start)
- the live Picsel repo

**One line to start it off in Claude Code:**

> Read `work-ring-port-brief.md` and port the work ring into the homepage. Follow it exactly, and
> show me the diff before you commit anything.

---

## What you are doing

The homepage currently shows the featured projects as a flat grid. Replace it with a pinned section
where the projects sit on a 3D wheel that turns one project per scroll.

The finished behaviour already exists and is tested. It is in `work-ring-prototype.html`. Open that
file and read all of it before you write anything. **Do not rewrite the animation from scratch.**
The geometry and the scroll maths in there took several rounds of rendering to get right, and the
four traps listed at the bottom of this brief are all things that were wrong at some point and are
now fixed.

Your job is to split that one file into the site's normal shape, wire the markup up to `projects.js`,
and delete the two bits that were only there for the prototype.

---

## Step 0: look before you touch

Report back what you find before making changes:

- the homepage file and where the current work grid markup lives
- the stylesheet layout: is there a `tokens.css`, one stylesheet per page, or one global file
- where scripts live and how the existing `hero.js` and `nav.js` are loaded
- `projects.js`: its exact shape, and whether it holds five or six projects (the live site shows
  six, older notes say five)
- how the hero handles scroll, because the hero is scroll scrubbed and the ring also reads scroll
  position. They must not fight.

If the repo carries `instructions-picsel-site.md` or `plan-picsel-site.md`, read them first. The
never-do list in the instructions file wins over anything in this brief.

## Step 1: the JavaScript

Create a file next to `hero.js`, named to match the repo's convention (likely `work-ring.js`).

Copy the whole IIFE from the prototype's `<script>` block **except** the final section marked
`TUNER (prototype only)`. Delete that block entirely, from `var tuner = document.getElementById('tuner')`
to the end of the `wire(...)` calls, along with the `wire` function itself.

Leave the `cfg` object at the top exactly as it is, comments included. Those are the dials, and Ben
tunes the section by editing them.

Load it with `defer`.

## Step 2: the CSS

Copy the styles from the comment `THE WORK SECTION, PLAIN VERSION` down to the end of the
`prefers-reduced-motion` block. That is everything the section needs.

Do **not** copy:

- the `TOKENS` block: instead map `--bg`, `--ink`, `--ink-dim`, `--line`, `--accent` and
  `--accent-cool` onto the site's existing token names, and delete the prototype's ones
- `.filler` and `.hint` (fake hero, prototype only)
- `.tuner` (prototype only)
- the `body::before` dot grid, if the site already draws it

Keep `html{overflow-x:clip}`. The ring slides off screen to the right and without it you get a
horizontal scrollbar.

## Step 3: the markup

Replace the current grid markup with the `<section class="work" id="work">` block from the
prototype, but **generate the six list items from `projects.js`** rather than hand writing them, so
adding a project stays one entry. That is the existing rule for the Work index and it applies here.

The per project structure must stay exactly this, because both the CSS and the script depend on it:

```html
<li class="project">
  <a class="project__link" href="/work/<slug>/">
    <span class="project__shot"><img src="/assets/work/<slug>/desktop.webp" alt="Screenshot of the <name> website" loading="lazy"></span>
    <span class="project__name"><name></span>
    <span class="project__sector"><sector> · <what we did></span>
    <span class="project__cta">View full project</span>
  </a>
</li>
```

Keep `.work__snaps` and the empty `.work__ring` wrapper. The script fills both.

Update the counter's total (`/ 06` in the prototype) from the project count rather than hardcoding it.

## Step 4: clean up

- delete the old grid CSS if nothing else uses it
- delete the fake hero and fake following section, they were scaffolding
- make sure the section still sits in the same place in the page order, between the intro line and
  the services note

---

## Rules that must survive the port

1. **No content depends on JavaScript.** With JS off, the section renders as a normal grid with all
   six projects, six screenshots and six working links. Test this, do not assume it.
2. **`prefers-reduced-motion` falls back to the grid.** No pin, no spin. The script returns early.
3. **Vanilla only.** No GSAP, no Lenis, no ScrollTrigger, no framework. If you find yourself wanting
   one, the answer is no.
4. **One link per project in the accessibility tree.** The cards on the wheel are decorative copies
   inside an `aria-hidden` container. The real links live in the text column. Do not "fix" this by
   making the cards links too.
5. **Alt text stays** `Screenshot of the <name> website`.
6. **No location anywhere.** Standing rule for this site.

---

## Four traps, already fixed, do not reintroduce

Every one of these was a real bug during the build. If the section looks wrong after your port,
check these first.

1. **Front card looks blown up and overflows the column.** The ring must carry
   `translate3d(var(--ringx),0,var(--ringz))` before its rotations, with `--ringz` set to minus the
   radius and `--ringx` to `-radius * sin(tilt)`. Without the Z the perspective magnifies the front
   card; without the X the tilt drags it off centre.
2. **The wheel turns against the scroll.** `TURN = -1` makes the next project rise from below, which
   is the direction you are scrolling. Flipping the sign anywhere else in the file breaks it.
3. **Cards near the back show mirrored text.** Card angles must be wrapped into the range -180 to
   180, and the tip back towards the camera has to be recalculated every frame from the wheel's
   current angle (`applyCards`). Baking it into a static transform only works for the first card.
4. **The slide in never plays.** There must be no scroll snap marker on the first project. One
   sitting at the section's start grabs the page as it approaches and jumps you straight to the
   pinned state.

Plus one layout gotcha: `.work__panel` needs `margin:0; max-width:none; width:100%` in ring mode. It
carries the site's `.wrap` class, and `margin:0 auto` on a grid item shrinks it to its content and
centres it.

---

## Check before you commit

- **Desktop 1440 wide:** scroll in slowly and watch the slide in, then through all six, then the
  slide out, then scroll all the way back up. It must reverse cleanly.
- **Fast scroll:** flick from the top of the section to the bottom. The wheel should roll through
  every project at about double speed, not jump.
- **Phone width 390:** text on top, wheel below, no blurred card bleeding over the text.
- **Reduced motion:** DevTools, Rendering, emulate `prefers-reduced-motion: reduce`. Expect the grid.
- **JavaScript off:** expect the grid, six links.
- **Keyboard:** tab into the section, the wheel should follow focus. Left and right arrows turn it.
- **The hero still works.** The ring sets `scroll-snap-type` on the root element. If that disturbs
  the hero's scrub, set `cfg.snap = false` and say so in the commit message.
- **A real mid range Android if you can.** Blur is the only expensive thing in here.

## Then

Update `plan-picsel-site.md`, Sections 4 and 5: tick the boxes, write the "What we built" summary in
plain English, and record under "Decisions made" that the featured work is now a pinned 3D ring with
a plain grid fallback.