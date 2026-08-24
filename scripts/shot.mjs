import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { chromium } from "playwright";

const [rawPath = "", nameArg, viewportArg = "1440x900"] = process.argv.slice(2);

const route = "/" + rawPath.replace(/^[./\\]+/, "");

const BASE = process.env.SHOT_BASE ?? "http://localhost:4321";
const outDir = resolve(process.env.SHOT_DIR ?? ".screenshots");
const name =
  nameArg ?? (route.replace(/\W+/g, "-").replace(/^-|-$/g, "") || "home");
const [width, height] = viewportArg.split("x").map(Number);

if (!Number.isFinite(width) || !Number.isFinite(height)) {
  console.error(
    `Bad viewport "${viewportArg}" — expected WIDTHxHEIGHT, e.g. 1440x900`,
  );
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });
const out = join(outDir, `${name}.png`);

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width, height },
  deviceScaleFactor: 2,
  reducedMotion: "reduce",
});

try {
  const res = await page.goto(BASE + route, {
    waitUntil: "networkidle",
    timeout: 30_000,
  });
  if (!res?.ok()) console.warn(`HTTP ${res?.status()} for ${route}`);

  await page.evaluate(() => document.fonts.ready);

  const mapImage = page.locator("#map-image");
  if (await mapImage.count()) {
    await mapImage
      .evaluate(
        (img) =>
          img.complete ||
          new Promise((r) => img.addEventListener("load", r, { once: true })),
      )
      .catch(() => {});
  }

  await page.evaluate(async () => {
    const step = window.innerHeight;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
    await Promise.all(
      [...document.images]
        .filter((img) => !img.complete)
        .map(
          (img) =>
            new Promise((r) => img.addEventListener("load", r, { once: true })),
        ),
    );
  });

  await page.addStyleTag({
    content: "astro-dev-toolbar { display: none !important }",
  });

  await page.screenshot({ path: out, fullPage: true, animations: "disabled" });
  console.log(out);
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
} finally {
  await browser.close();
}
