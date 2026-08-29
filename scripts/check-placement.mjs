import { chromium } from "playwright";

const BASE = process.env.SHOT_BASE ?? "http://localhost:4321";
const SAMPLES = 400;

const browser = await chromium.launch();
let failed = false;

for (const [width, height] of [
  [1440, 900],
  [390, 844],
]) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.addInitScript(() =>
    localStorage.setItem("quinta-pata-intro-seen", "1"),
  );
  await page.goto(BASE + "/memorias", { waitUntil: "networkidle" });
  await page
    .locator("#map-image")
    .evaluate(
      (img) =>
        img.complete ||
        new Promise((r) => img.addEventListener("load", r, { once: true })),
    );

  const result = await page.evaluate(async (samples) => {
    const { pickPosition } = await import("/src/lib/pickPosition.ts");
    const map = document.getElementById("map");
    const bounds = map.getBoundingClientRect();
    const boxes = [...map.querySelectorAll("[data-decoration]")].map((el) => {
      const r = el.getBoundingClientRect();
      return {
        x1: ((r.left - bounds.left) / bounds.width) * 100,
        y1: ((r.top - bounds.top) / bounds.height) * 100,
        x2: ((r.right - bounds.left) / bounds.width) * 100,
        y2: ((r.bottom - bounds.top) / bounds.height) * 100,
      };
    });
    const halfX = (50 / bounds.width) * 100;
    const halfY = (50 / bounds.height) * 100;
    const existing = [];
    let overlaps = 0;
    for (let i = 0; i < samples; i++) {
      const p = pickPosition(existing);
      if (
        boxes.some(
          (b) =>
            p.x + halfX > b.x1 &&
            p.x - halfX < b.x2 &&
            p.y + halfY > b.y1 &&
            p.y - halfY < b.y2,
        )
      )
        overlaps++;
      existing.push({ x: p.x, y: p.y });
    }
    return { decorations: boxes.length, overlaps };
  }, SAMPLES);

  const label = `${width}x${height}`;
  if (result.overlaps > 0) {
    failed = true;
    console.error(
      `${label}: ${result.overlaps}/${SAMPLES} chairs land on a decoration`,
    );
  } else {
    console.log(
      `${label}: ${SAMPLES} chairs, 0 overlaps against ${result.decorations} decorations`,
    );
  }
  await page.close();
}

await browser.close();
if (failed) process.exitCode = 1;
