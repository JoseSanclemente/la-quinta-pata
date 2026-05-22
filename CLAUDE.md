# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is
Static single-page web app ("Mapa Imaginario" / "La Silla"): a draggable map where any
visitor drops colored circles containing text, an image, or a video. Circles are stored
in Supabase and stream live to all visitors. No build step, no framework, no dependencies
installed locally — Supabase JS comes from a CDN `<script>` in index.html.

## Running locally
- MUST serve over http:// — opening index.html via file:// (double-click) breaks the
  Supabase connection ("file: URLs are treated as unique security origins").
- VS Code Live Server, or `npx serve .` then open the printed http://localhost URL.
- Requires a `config.js` (not committed): copy `config.example.js` to `config.js` and
  fill in the Supabase Project URL + anon public key. Without it the app loads but logs
  "Supabase no configurado" and create/load do nothing.

## Backend setup (Supabase)
- Run `supabase-setup.sql` once in the Supabase SQL Editor. It creates the `circles`
  table, enables RLS with fully-open read+insert policies (public toy — no auth), adds
  the table to the `supabase_realtime` publication, and defines open storage policies.
- Manually create a PUBLIC storage bucket named `media` (uploads land here).
- The anon key is public by design; security relies entirely on the RLS policies.

## Deploy
Netlify, no build (`netlify.toml` just sets `publish = "."`). Drag the folder into
Netlify, or connect a repo for auto-deploy.

## Architecture (app.js, 5 numbered sections)
All logic is in app.js, organized as commented sections:
1. Pan/drag — `pos` translate on `#map`; `clamp()` keeps image on screen; no zoom by
   design. Pointer + touch handlers; `moved` flag distinguishes a drag from a click.
2. `renderCircle(c)` injects a `.circle` div positioned by x/y percent; `loadCircles()`
   fetches all rows on boot.
3. Sidebar form — on submit, uploads file to the `media` bucket (image/video) or takes
   text, picks a RANDOM x/y, inserts the row, then renders + `centerOnCircle()`.
4. `showTooltip(c)` renders the circle's media. Tooltip lives INSIDE `#map` so it pans
   together with its circle; flips side near the right edge.
5. Realtime — subscribes to `circles` INSERT events and calls `renderCircle` on each.

### Key conventions / gotchas
- The Supabase CDN bundle defines a GLOBAL `supabase`; the app's client is named `db`
  (NOT `supabase`) to avoid clobbering it.
- Circle positions are percentages (0–100) of the map image box, not pixels — so they
  stay correct across screen sizes and panning.
- Coordinates assigned randomly on creation; there's no placement UI.
- Real map image goes at `assets/map.png`; index.html currently points at
  `assets/placeholder.svg` and falls back to it on error.

## Language note
README, UI strings, and form status messages are in Spanish. Code comments are English.
