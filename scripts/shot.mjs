// Screenshot a page of the running dev server, so the UI can be looked at (and
// compared against a design reference) instead of inferred from the markup.
//
//   node scripts/shot.mjs memorias memorias-desktop 1440x900
//   node scripts/shot.mjs . home 390x844
//
// Pass the route WITHOUT a leading slash — Git Bash's MSYS path translation
// rewrites a bare "/memorias" into "C:/Program Files/Git/memorias" before node
// ever sees it. Use "." or "" for the root route.
//
// Output goes to $SHOT_DIR (if set) or ./.screenshots/.

import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { chromium } from "playwright";

const [rawPath = "", nameArg, viewportArg = "1440x900"] = process.argv.slice(2);

const route = "/" + rawPath.replace(/^[./\\]+/, "");

const BASE = process.env.SHOT_BASE ?? "http://localhost:4321";
const outDir = resolve(process.env.SHOT_DIR ?? ".screenshots");
const name = nameArg ?? (route.replace(/\W+/g, "-").replace(/^-|-$/g, "") || "home");
const [width, height] = viewportArg.split("x").map(Number);

if (!Number.isFinite(width) || !Number.isFinite(height)) {
  console.error(`Bad viewport "${viewportArg}" — expected WIDTHxHEIGHT, e.g. 1440x900`);
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });
const out = join(outDir, `${name}.png`);

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width, height },
  deviceScaleFactor: 2,
});

try {
  const res = await page.goto(BASE + route, {
    waitUntil: "networkidle",
    timeout: 30_000,
  });
  if (!res?.ok()) console.warn(`HTTP ${res?.status()} for ${route}`);

  // Plus Jakarta Sans ships as a @fontsource-variable package; shooting before it
  // settles captures fallback metrics and every spacing comparison is off.
  await page.evaluate(() => document.fonts.ready);

  // The map image falls back to placeholder.svg via onerror — wait for whichever
  // one wins so the viewport is not a blank box.
  const mapImage = page.locator("#map-image");
  if (await mapImage.count()) {
    await mapImage
      .evaluate((img) => img.complete || new Promise((r) => img.addEventListener("load", r, { once: true })))
      .catch(() => {});
  }

  // The dev toolbar floats over the bottom-centre of every dev-server page.
  await page.addStyleTag({ content: "astro-dev-toolbar { display: none !important }" });

  await page.screenshot({ path: out, fullPage: true });
  console.log(out);
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
} finally {
  await browser.close();
}
