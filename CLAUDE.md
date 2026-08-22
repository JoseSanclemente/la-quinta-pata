# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Frontend design audit workflow

Only when user explicitly says "Do an audit" (or equivalent), run all three skills:
`$impeccable`, `$ui-ux-pro-max`, and `$frontend-design`.

- Start with `$impeccable` to establish the appropriate workflow, preserve the existing visual
  world unless a redesign is requested, and complete its bounded visual verification pass.
- Use `$ui-ux-pro-max` to inspect the Astro stack and obtain relevant design-system, UX,
  accessibility, responsive, and interaction guidance before making UI decisions.
- Use `$frontend-design` to develop a subject-specific visual direction, deliberate typography,
  palette, layout, copy, and one justified signature element; avoid generic template aesthetics.

Treat these skills as complementary, not alternatives when running an audit.
Continue to follow the visual UI checks in this file, including desktop and mobile screenshots,
for regular UI changes outside the audit flow.

## What this is

Astro site ("La Quinta Pata"): a digital archive around the Rimax plastic chair, in Spanish.
Five routes, no UI framework:

- `/` (`src/pages/index.astro`) — prerendered marketing landing, composed of
  `src/components/home/` sections (`Hero`, `RimaxIntro`, `Discovery`, `Memories`, `Closing`).
  Editorial layout of flat alternating cream/blue/magenta fields.
- `/quienes-somos` — prerendered, blue page with the two founders.
- `/politicas-de-privacidad`, `/terminos-y-condiciones` — prerendered legal pages, both built on
  `src/components/LegalPage.astro` (blue shell + `.legal-prose` scoped styles). Copy is a first
  draft written from how the app actually behaves; the contact address is a placeholder.
- `/memorias` — the interactive part: a draggable map where any visitor drops colored chairs
  containing text, an image, a video, or a recorded audio. Rows live in Supabase and stream live
  to all visitors. One React client island (`src/components/map/`), hydrated with `client:load`.

All routes are prerendered (`export const prerender = true`). `/memorias` used to be SSR
so it could pass the circle rows in as a prop, but that put a Netlify cold start plus a Supabase
round trip in front of the first byte and the click felt dead. The island now fetches the rows
itself. `prefetch` is on in `astro.config.mjs` (`prefetchAll`, `hover`), so the HTML is usually
already cached when the CTA is clicked.

## Running locally

- pnpm only — `packageManager` pins it and there is no npm lockfile. `pnpm install`, then
  `pnpm dev` (<http://localhost:4321>). `pnpm build`, `pnpm check`.
- `allowBuilds` in `pnpm-workspace.yaml` allows `esbuild` and `sharp` to run their install
  scripts; pnpm blocks postinstall by default and the build fails without them. (pnpm 11 no
  longer reads the `pnpm` field in `package.json` — settings live in `pnpm-workspace.yaml`.)
- `nodeLinker: hoisted` in `pnpm-workspace.yaml` is load-bearing. Under pnpm's default
  symlinked layout the Netlify adapter's function bundling dies on Windows with
  `EPERM: operation not permitted, symlink ...\.pnpm\...`. This setting used to live in
  `.npmrc` as `node-linker=hoisted`; **pnpm 11 no longer reads it from there** and silently
  falls back to the symlinked layout, so a `pnpm add` re-links everything and the next
  `pnpm build` fails. Verify with `pnpm config get node-linker` — it must print `hoisted`,
  not `undefined`.
- Requires a `.env` (gitignored): copy `.env.example` and fill it in. `PUBLIC_SUPABASE_URL`
  and `PUBLIC_SUPABASE_ANON_KEY` are required — the build fails without them.
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
- The script waits on `document.fonts.ready` (Nunito is a `@fontsource-variable`
  package — an early shot captures fallback metrics and every spacing judgement is wrong),
  waits for `#map-image`, and hides `astro-dev-toolbar`, which otherwise floats over the
  bottom-centre of every dev page.
- After a `playwright` version bump, run `pnpm exec playwright install chromium` — each
  release pins its own browser build and launch fails with `Executable doesn't exist at ...`.
- Circle x/y is RANDOM on creation (`sidebar.ts`), so `/memorias` shots are not pixel-stable.
  Compare the empty map, or seed fixed rows first.

## Backend setup (Supabase)

- Run `supabase-setup.sql` once in the Supabase SQL Editor. It creates the `memories` table,
  enables RLS with fully-open read+insert policies (public toy — no auth), adds the table to
  the `supabase_realtime` publication, and defines open storage policies.
- Manually create a PUBLIC storage bucket named `media` (uploads land here).
- The public key is public by design; security relies entirely on the RLS policies.

## Deploy

Netlify via `@astrojs/netlify`. `netlify.toml` sets `pnpm run build` + `publish = "dist"`;
the adapter emits the SSR function. The three env vars must be set in the Netlify UI.

## Architecture

`output: "server"`, but every route is prerendered today. `src/pages/index.astro` is the hero
landing page; the map lives at `src/pages/memorias.astro` (`/memorias`), which renders the
island and nothing else. The island subscribes to realtime FIRST and only then runs the
`select("*")`, so an INSERT landing mid-fetch is not lost; both paths dedupe by id.

The island is React, in `src/components/map/`:

1. `MapCanvas.tsx` — the only island, and the only `client:load` on the page. Owns the pan,
   the culling, the circle list, the realtime subscription, and which circle the tooltip
   shows. Pan is origin-capture (`origin` = `pos` at pointerdown), not delta accumulation;
   `clamp()` keeps the image on screen; no zoom by design. It also re-clamps on `resize`,
   because `#map-image` is sized in `vw`.
2. `MapChair.tsx` — one `.circle` **button** positioned by x/y percent. `memo`'d, since panning
   re-renders the parent constantly. It must stay a `<button>`: it is the only way to reach a
   memory by keyboard, and its `aria-label` is the memory's accessible name.
3. `MapTooltip.tsx` — the circle's media behind a spinner, with `loading` / `ready` / `error`
   states. It renders INSIDE `#map` so it pans together with its circle, always centered
   above it.
4. `AddMemoryForm.tsx` — the sidebar drawer. On submit it uploads to the `media` bucket
   (image/video/audio) or takes text, picks x/y via `pickPosition()`, inserts the row, and hands
   the new circle back to `MapCanvas`, which calls `centerOnCircle()`.
5. `MapHint.tsx` — the one-line chip over the map. Shows until the visitor first pans; its copy
   depends on whether the archive is empty.

`MapCanvas` centers the initial view once — on the centroid of the loaded circles, or on the map
middle if none have arrived yet (`didCenter`). Without it the map opened on its empty top-left
corner and first-time visitors saw nothing.

**Rows are fetched on mount and on `visibilitychange`, not on a timer.** Realtime already covers
the open tab; a poll on top of it re-`select`ed the whole table every 15s per tab forever. The
refetch replaces the list rather than appending, so reported rows disappear — it only keeps local
rows whose `created_at` is newer than the moment the query started, which is what protects an
INSERT that lands mid-fetch.

**Modals are native `<dialog>` + `showModal()`** (`src/lib/useModalDialog.ts`), used by
`IntroPopup` and the report popup. That is what gives them the focus trap, Escape, top-layer
escape from `#map`'s transform, and an inert background for free — all of which were missing when
they were plain divs. A `<dialog>` paints an opaque UA background, so any panel with its own
artwork needs `border-none bg-transparent` and a `backdrop:` colour.
The two sliding drawers (`#sidebar`, `#detail-panel`) stay CSS-driven because they animate on
exit; they are made modal instead by the `blocked` flag in `MapCanvas`, which puts `inert` on the
viewport, the logo and the create button whenever any of the three is open.

**The pan must stay imperative.** `pos`, `origin`, `start` and the `panning` / `moved` flags
live in `useRef`, and the pointermove handler writes `map.style.transform` directly. Putting
the position in `useState` fires a React render per pointer event and the drag turns to glue.
React state is only for what changes rarely: the circle list, the visible-id list (recomputed
in a `requestAnimationFrame`, and only `setState`-ed when the list actually differs), the
selected circle, and whether the drawer is open.

Culling: every row lives in the `circles` state, but only those within `MARGIN` px of the
viewport are mounted. `droppedIds` is a `useRef<Set>` so the drop animation plays on a
circle's first ever mount and never replays when culling remounts it.

### Key conventions / gotchas

- **No comments. At all.** Not in `.astro`, `.ts`, `.tsx`, `.css`, `.sql`, `.mjs` — no explanatory
  blocks, no section headers, no trailing notes, no commented-out code. Name things well and
  let the code stand alone. Anything that genuinely needs prose belongs in this file. When
  touching a file that still has old comments, delete them. Only exception: functional
  directives the toolchain reads, like `// @ts-check` in `astro.config.mjs`.
- **Absolute imports only.** `tsconfig.json` maps `@/*` to `./src/*`; every import inside
  `src/` goes through it — `@/components/SiteHeader.astro`, `@/assets/hero.webp`,
  `@/lib/supabase.server`. Never `../` or `./` across directories. (Some `src/pages/*.astro`
  still carry relative imports from before the alias landed; convert them as you touch them.)
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
- **Never re-disable zoom.** `#viewport` is `touch-action: pinch-zoom`, not `none`, and the
  viewport meta carries no `maximum-scale` / `user-scalable=no`. One finger pans the map, two
  fingers are the browser's. The old combination was a WCAG 1.4.4 failure.
- `/api/report` hides a memory and emails a notice with no auth, so it is capped at 5 calls per
  `clientAddress` per hour. The counter is an in-process `Map`: it resets on cold start and is
  per-instance, which is enough to stop a script but not a distributed flood. Move it to a
  Supabase table if that ever matters.
- The island keeps the DOM ids the vanilla version used — `#viewport`, `#map`, `#map-image`,
  `#circles-layer`, `#tooltip`, `#tooltip-content`, `#sidebar` — because `global.css` and
  `scripts/shot.mjs` both select on them. Renaming one silently breaks the styling or the
  screenshot script, neither of which typechecks.
- Tailwind is used for the static markup (sidebar, form, buttons). Anything React creates or
  toggles stays in `src/styles/global.css`: `.circle`, `.tooltip-spinner`, `#tooltip::after`,
  `#sidebar.open`, `.swatch:has(input:checked)`, the keyframes, and `#map-image { max-width:
none }` (preflight would otherwise cap it and break the pan extent).
- Palette lives in the `@theme` block of `global.css` as `--color-*` tokens, which Tailwind
  turns into `bg-navy`, `text-brand`, etc.
- The tooltip bubble (`map-tooltip.css`, `.tooltip-bubble`) is `#f2f2f2`, a neutral gray with no
  `--color-*` token — deliberate, not a gap. It reads as a paper card against colored map fields;
  the warm `--color-neutral` would blend into them instead of standing apart.
- **Map image pipeline.** The master is `src/assets/map.webp` — 5000x5000 WebP **lossless**
  (`VP8L`), 36.5 MB. It is gitignored on purpose: shipping it would make Netlify clone 36 MB per
  build. Derivatives are generated once, offline, and committed:

  ```bash
  node scripts/map-derivatives.mjs 1600 3000   # -> public/assets/map-{1600,3000}.webp, q78
  ```

  Both are served through a `srcSet` on `#map-image`. `sizes` starts with `(width < 48rem) 400px`
  — a deliberate lie: the real CSS width is `clamp(1100px, ...)`, so an honest `sizes` makes every
  2x/3x phone ask for the 3000 file. The 400px hint pins phones to `map-1600.webp` (100 KB,
  ~10 MB decode instead of ~36 MB); the map is panned, not inspected, so the softness is free.
  The `onError` fallback to `placeholder.svg` must clear `srcSet`/`sizes` or the browser ignores
  it. Lossy q78 is visually indistinguishable from the
  master at 1:1 (the paper grain survives) and is ~110x smaller. Keep the master out of the repo;
  regenerate the derivative after any edit to it.

- The map renders at `width: clamp(1100px, 260vw, 3000px)` (`global.css`, `#map-image`), not at its
  natural 3000 px. At 1:1 on a 390 px phone the map is 7.7 screens wide and unreadable; the clamp
  keeps the pan extent at roughly 2-3 screens on every viewport. Circle coordinates are percentages,
  so they follow the scale for free. Decode memory stays ~34 MB regardless of display size.
- `MapViewport` falls back to `placeholder.svg` via `onerror`.
- `#map-loader` is the ink-field loading screen: three circle-palette dots and one line of copy,
  rendered by `MapCanvas` and killed by the `.done` class once `#map-image` fires `load` (or
  `error`), but never before `LOADER_MIN_MS` (900 ms) since mount — a cached map otherwise makes
  the overlay flash on and off. It ships inside the prerendered HTML, so it paints before
  hydration. If the image is
  already cached at hydration no `load` event fires, which is why the mount effect also checks
  `image.complete`.

## Language note

README, UI strings, page copy, and form status messages are in Spanish. Identifiers stay in
English. (No comments in either language — see conventions above.)
