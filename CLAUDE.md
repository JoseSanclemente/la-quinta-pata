# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Mandatory frontend design workflow

For every task that creates, changes, reviews, or otherwise affects the user interface,
always use all three skills: `$impeccable`, `$ui-ux-pro-max`, and `$frontend-design`.

- Start with `$impeccable` to establish the appropriate workflow, preserve the existing visual
  world unless a redesign is requested, and complete its bounded visual verification pass.
- Use `$ui-ux-pro-max` to inspect the Astro stack and obtain relevant design-system, UX,
  accessibility, responsive, and interaction guidance before making UI decisions.
- Use `$frontend-design` to develop a subject-specific visual direction, deliberate typography,
  palette, layout, copy, and one justified signature element; avoid generic template aesthetics.

Treat these skills as complementary, not alternatives: apply all of them on every frontend task.
Continue to follow the visual UI checks in this file, including desktop and mobile screenshots.

## What this is

Astro site ("La Quinta Pata"): a digital archive around the Rimax plastic chair, in Spanish.
Three routes, no UI framework:

- `/` (`src/pages/index.astro`) — prerendered marketing landing, composed of
  `src/components/home/` sections (`Hero`, `RimaxIntro`, `Discovery`). Editorial layout of flat
  alternating cream/blue/magenta fields.
- `/quienes-somos` — prerendered placeholder, an empty blue page; content still to be written.
- `/memorias` — the interactive part: a draggable map where any visitor drops colored circles
  containing text, an image, or a video. Circles live in Supabase and stream live to all
  visitors. Static shell plus one vanilla-TS client island (`src/scripts/`).

Only `/memorias` is server-rendered; the other two set `export const prerender = true`.

## Running locally

- pnpm only — `packageManager` pins it and there is no npm lockfile. `pnpm install`, then
  `pnpm dev` (<http://localhost:4321>). `pnpm build`, `pnpm check`.
- `allowBuilds` in `pnpm-workspace.yaml` allows `esbuild` and `sharp` to run their install
  scripts; pnpm blocks postinstall by default and the build fails without them. (pnpm 11 no
  longer reads the `pnpm` field in `package.json` — settings live in `pnpm-workspace.yaml`.)
- `.npmrc` sets `node-linker=hoisted`. Don't remove it: with pnpm's default symlinked layout
  the Netlify adapter's function bundling dies on Windows with
  `EPERM: operation not permitted, symlink ...\.pnpm\...`.
- Requires a `.env` (gitignored): copy `.env.example` and fill it in. `PUBLIC_SUPABASE_URL`
  and `PUBLIC_SUPABASE_ANON_KEY` are required — the build fails without them.
  `SUPABASE_SERVICE_KEY` is optional; when empty, the SSR read falls back to the public key.
- Env vars are declared in `astro.config.mjs` under `env.schema` and imported from
  `astro:env/client` / `astro:env/server` — not `import.meta.env`.

## Visual UI checks (do this for any UI change)

Never ship or describe a UI change from the markup alone — screenshot it and look at it.
When the user supplies a design reference, put the shot and the reference side by side and
name the concrete deltas (spacing, weight, color, alignment) before editing again.

`scripts/shot.mjs` drives headless chromium against the running dev server:

```bash
pnpm dev
node scripts/shot.mjs memorias memorias 1440x900
node scripts/shot.mjs . home-mobile 390x844
```

Leave `pnpm dev` running — HMR means no restart per shot. `.` or an empty string is the root
route. Args: `route name viewport`. Output lands in `.screenshots/` (gitignored) unless `SHOT_DIR`
overrides it; `SHOT_BASE` overrides the origin. Then `Read` the PNG — the Read tool renders
images visually.

- **Pass the route WITHOUT a leading slash.** Under Git Bash, MSYS path translation rewrites
  `/memorias` into `C:/Program Files/Git/memorias` before node sees the argument.
- The script waits on `document.fonts.ready` (Plus Jakarta Sans is a `@fontsource-variable`
  package — an early shot captures fallback metrics and every spacing judgement is wrong),
  waits for `#map-image`, and hides `astro-dev-toolbar`, which otherwise floats over the
  bottom-centre of every dev page.
- After a `playwright` version bump, run `pnpm exec playwright install chromium` — each
  release pins its own browser build and launch fails with `Executable doesn't exist at ...`.
- Circle x/y is RANDOM on creation (`sidebar.ts`), so `/memorias` shots are not pixel-stable.
  Compare the empty map, or seed fixed rows first.

## Backend setup (Supabase)

- Run `supabase-setup.sql` once in the Supabase SQL Editor. It creates the `circles` table,
  enables RLS with fully-open read+insert policies (public toy — no auth), adds the table to
  the `supabase_realtime` publication, and defines open storage policies.
- Manually create a PUBLIC storage bucket named `media` (uploads land here).
- The public key is public by design; security relies entirely on the RLS policies.

## Deploy

Netlify via `@astrojs/netlify`. `netlify.toml` sets `pnpm run build` + `publish = "dist"`;
the adapter emits the SSR function. The three env vars must be set in the Netlify UI.

## Architecture

`output: "server"`. `src/pages/index.astro` is the hero landing page;
the map lives at `src/pages/memorias.astro` (`/memorias`), which reads all circles server-side
(`src/lib/supabase.server.ts`) and serializes them into a `<script type="application/json"
id="circles-data">`. The island parses that on boot instead of fetching — no client
round-trip, and no race between the initial load and the first realtime INSERT.

The island lives in `src/scripts/`, split along the 5 sections the prototype used:

1. `pan.ts` — `pos` translate on `#map`; `clamp()` keeps the image on screen; no zoom by
   design. Pan is origin-capture (`origin` = `pos` at pointerdown), not delta accumulation.
   Mouse + touch handlers; the `moved` flag distinguishes a drag from a click.
2. `circles.ts` — `renderCircle(c)` injects a `.circle` div positioned by x/y percent.
   Viewport culling: all rows live in `allCircles`, but only those within `MARGIN` px of the
   viewport are mounted. `scheduleVisible()` throttles the culling pass to one per frame.
3. `sidebar.ts` — on submit, uploads the file to the `media` bucket (image/video) or takes
   text, picks a RANDOM x/y, inserts the row, then pushes it and calls `centerOnCircle()`.
4. `tooltip.ts` — `showTooltip(c)` renders the circle's media behind a spinner. The tooltip
   lives INSIDE `#map` so it pans together with its circle, always centered above it.
5. `realtime.ts` — subscribes to `circles` INSERT events, dedupes against `allCircles`, and
   calls `updateVisible()`.

`main.ts` seeds state and calls the `init*` functions. `dom.ts` holds every element lookup;
`state.ts` holds shared mutable state (`pos`, `pan`, `allCircles`, `renderedIds`,
`droppedIds`).

### Key conventions / gotchas

- **No comments. At all.** Not in `.astro`, `.ts`, `.css`, `.sql`, `.mjs` — no explanatory
  blocks, no section headers, no trailing notes, no commented-out code. Name things well and
  let the code stand alone. Anything that genuinely needs prose belongs in this file. When
  touching a file that still has old comments, delete them. Only exception: functional
  directives the toolchain reads, like `// @ts-check` in `astro.config.mjs`.
- **Absolute imports only.** `tsconfig.json` maps `@/*` to `./src/*`; every import inside
  `src/` goes through it — `@/components/SiteHeader.astro`, `@/assets/hero.webp`,
  `@/lib/supabase.server`. Never `../` or `./` across directories. (`src/pages/*.astro` and
  parts of `src/scripts/` still carry relative imports from before the alias landed; convert
  them as you touch them.)
- `state.ts` exports containers (objects, arrays, sets), never reassigned primitives — module
  bindings are read-only for importers, so `pan.moved` works where `let moved` would not.
- Circle positions are percentages (0–100) of the map image box, not pixels — so they stay
  correct across screen sizes and panning.
- Coordinates assigned randomly on creation; there's no placement UI.
- `droppedIds` makes the drop animation play only on a circle's first ever mount, so culling
  does not replay it.
- **Layout system: `page-grid`.** Every section's content sits in a `page-grid` layer —
  12 columns on `lg`, 8 on `md`, 4 below, plus the shared gutter and `--content-max`. It is an
  `@utility` in `global.css`, driven by the `--gutter` / `--grid-gap` / `--content-max` custom
  properties on `:root` (they change per breakpoint, so they can't be `@theme` tokens).
  `page-gutter` is the escape hatch for things that need the margin but not the columns.
  Sections stay full-bleed (backgrounds, color bands); only the inner layer is
  gridded. Collage pieces are placed horizontally by column and freely in the vertical
  (`absolute top-[x%]` inside a `relative h-full` cell) — desordenado, but on the grid.
- **Place cells with `col-start-*` + `col-end-*`, never `col-span-*`.** `col-span-N` compiles to
  the `grid-column` shorthand, which wipes any `col-start` from a lower breakpoint; the piece
  then auto-places into phantom columns.
- `GridOverlay.astro` paints the columns for debugging. Mounted from `Layout.astro` under
  `import.meta.env.DEV` only. Toggle with the `g` key (state persists in `localStorage`) or load
  any page with `?grid`. `node scripts/shot.mjs "?grid" grid-desktop 1440x900` captures it.
  It uses `[display:none] md:[display:block]` rather than `hidden md:block` because the global
  `.hidden` rule is `!important` and would win.
- **Carruseles infinitos (`Memories.astro`)**: CSS puro, cero JS. La pista (`.marquee-track`)
  contiene la lista de tarjetas **duplicada** y `@keyframes marquee` la desplaza `-50%`; para que
  el salto sea invisible la separación va en `mr-*` por tarjeta, **nunca en `gap`** (con `gap` el
  `-50%` queda desfasado medio hueco). Velocidad y sentido salen de los tokens `--animate-marquee`
  / `--animate-marquee-reverse` del `@theme`. Pausa al hover con
  `group` + `group-hover:[animation-play-state:paused]`, y `prefers-reduced-motion` apaga la
  animación en `global.css`.
- Las imágenes dentro de un carrusel llevan `loading="eager"`: quedan fuera del viewport
  horizontal, así que en lazy no cargan nunca y `scripts/shot.mjs` se cuelga esperando
  `img.complete`. Por lo mismo el script hace la captura con `animations: "disabled"` — si no,
  Playwright espera a que termine una animación infinita.
- Tailwind is used for the static markup (sidebar, form, buttons). Anything JS creates or
  toggles stays in `src/styles/global.css`: `.circle`, `.tooltip-spinner`, `#tooltip::after`,
  `#sidebar.open`, `.swatch:has(input:checked)`, the keyframes, and `#map-image { max-width:
none }` (preflight would otherwise cap it and break the pan extent).
- Palette lives in the `@theme` block of `global.css` as `--color-*` tokens, which Tailwind
  turns into `bg-navy`, `text-brand`, etc.
- Real map image goes at `public/assets/map.png`; `MapViewport.astro` falls back to
  `placeholder.svg` via `onerror`.

## Language note

README, UI strings, page copy, and form status messages are in Spanish. Identifiers stay in
English. (No comments in either language — see conventions above.)
