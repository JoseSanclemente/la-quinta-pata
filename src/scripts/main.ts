// Island entry point: wires the map together and seeds it with the SSR data.
import { mapImage } from "./dom";
import { allCircles } from "./state";
import { applyTransform, initPan } from "./pan";
import { updateVisible } from "./circles";
import { initTooltip } from "./tooltip";
import { initSidebar } from "./sidebar";
import { initRealtime } from "./realtime";
import type { Circle } from "../lib/types";

/**
 * Circles rendered into the page server-side (see pages/index.astro). Seeding
 * from the payload instead of fetching means no client round-trip on boot, and
 * no race between the initial load and the first realtime INSERT.
 */
function seedFromPayload(): Circle[] {
  const node = document.getElementById("circles-data");
  if (!node?.textContent) return [];
  try {
    return JSON.parse(node.textContent) as Circle[];
  } catch (err) {
    console.error("[la-silla] could not parse the SSR circle payload:", err);
    return [];
  }
}

/**
 * Fall back to the placeholder when there's no real map at /assets/map.png.
 * The image may already have failed by the time this module runs, so check the
 * finished-but-broken state too instead of only listening for `error`.
 */
function initMapImageFallback() {
  const fallback = () => {
    mapImage.src = "/assets/placeholder.svg";
  };
  if (mapImage.complete) {
    if (mapImage.naturalWidth === 0) fallback();
  } else {
    mapImage.addEventListener("error", fallback, { once: true });
  }
}

initMapImageFallback();

allCircles.push(...seedFromPayload());

initPan();
initTooltip();
initSidebar();
initRealtime();

applyTransform();
updateVisible();
