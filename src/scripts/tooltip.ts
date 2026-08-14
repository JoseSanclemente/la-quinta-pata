import { tooltip, tooltipBody, viewport } from "@/scripts/dom";
import { pan } from "@/scripts/state";
import type { Circle } from "@/lib/types";

export function showTooltip(c: Circle) {
  tooltipBody.innerHTML = "";
  if (c.media_type === "image" || c.media_type === "video") {
    const spinner = document.createElement("div");
    spinner.className = "tooltip-spinner";
    tooltipBody.appendChild(spinner);

    const isImage = c.media_type === "image";
    const el = document.createElement(isImage ? "img" : "video") as
      | HTMLImageElement
      | HTMLVideoElement;
    el.className = "loading";
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
  tooltip.style.left = c.x + "%";
  tooltip.style.top = c.y + "%";
  tooltip.style.transform = "translate(-50%, calc(-100% - 18px))";
  tooltip.classList.remove("hidden");
}

export function initTooltip() {
  viewport.addEventListener("click", () => {
    if (pan.moved) return;
    tooltip.classList.add("hidden");
  });
}
