import { mapImage } from "@/scripts/dom";
import { allCircles } from "@/scripts/state";
import { applyTransform, initPan } from "@/scripts/pan";
import { updateVisible } from "@/scripts/circles";
import { initTooltip } from "@/scripts/tooltip";
import { initSidebar } from "@/scripts/sidebar";
import { initRealtime } from "@/scripts/realtime";
import type { Circle } from "@/lib/types";

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
