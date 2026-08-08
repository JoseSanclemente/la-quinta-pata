// ============================================================
//  4. Tooltip — show a circle's media
// ============================================================
import { tooltip, tooltipBody, viewport } from "./dom";
import { pan } from "./state";
import type { Circle } from "../lib/types";

export function showTooltip(c: Circle) {
  tooltipBody.innerHTML = "";
  if (c.media_type === "image" || c.media_type === "video") {
    // Remote media — show a spinner until it loads (or errors), then reveal it.
    const spinner = document.createElement("div");
    spinner.className = "tooltip-spinner";
    tooltipBody.appendChild(spinner);

    const isImage = c.media_type === "image";
    const el = document.createElement(isImage ? "img" : "video") as
      | HTMLImageElement
      | HTMLVideoElement;
    el.className = "loading"; // hidden via CSS until ready
    el.src = c.media_url ?? "";
    if (!isImage) (el as HTMLVideoElement).controls = true;
    const reveal = () => {
      spinner.remove();
      el.classList.remove("loading");
    };
    el.addEventListener(isImage ? "load" : "loadeddata", reveal, { once: true });
    el.addEventListener("error", () => spinner.remove(), { once: true });
    tooltipBody.appendChild(el);
  } else {
    const p = document.createElement("p");
    p.textContent = c.text_content || "";
    tooltipBody.appendChild(p);
  }
  // Anchor to the circle's own position (same % space circles use), so the
  // tooltip lives inside the map and pans together with its circle.
  tooltip.style.left = c.x + "%";
  tooltip.style.top = c.y + "%";
  // Always sit centered above the circle, with the speech-bubble peak pointing down at it.
  tooltip.style.transform = "translate(-50%, calc(-100% - 18px))";
  tooltip.classList.remove("hidden");
}

export function initTooltip() {
  // Click on empty map closes the tooltip — but ignore the click that ends a pan-drag.
  viewport.addEventListener("click", () => {
    if (pan.moved) return;
    tooltip.classList.add("hidden");
  });
}
