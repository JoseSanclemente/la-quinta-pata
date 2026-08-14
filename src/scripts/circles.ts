import { circlesLayer, map, viewport } from "@/scripts/dom";
import { allCircles, droppedIds, pos, renderedIds } from "@/scripts/state";
import { showTooltip } from "@/scripts/tooltip";
import type { Circle } from "@/lib/types";

const MARGIN = 200;

export function renderCircle(c: Circle) {
  if (renderedIds.has(c.id)) return;
  const el = document.createElement("div");
  el.className = "circle";
  el.dataset.id = c.id;
  el.style.left = c.x + "%";
  el.style.top = c.y + "%";
  el.style.background = c.color;
  el.addEventListener("click", (e) => {
    e.stopPropagation();
    showTooltip(c);
  });
  if (!droppedIds.has(c.id)) {
    droppedIds.add(c.id);
    el.classList.add("dropping");
    el.addEventListener("animationend", () => el.classList.remove("dropping"), { once: true });
  }
  circlesLayer.appendChild(el);
  renderedIds.add(c.id);
}

export function removeCircle(id: string) {
  if (!renderedIds.has(id)) return;
  const el = circlesLayer.querySelector(`[data-id="${id}"]`);
  if (el) el.remove();
  renderedIds.delete(id);
}

function isInView(c: Circle) {
  const mw = map.offsetWidth;
  const mh = map.offsetHeight;
  const sx = pos.x + (c.x / 100) * mw;
  const sy = pos.y + (c.y / 100) * mh;
  return (
    sx >= -MARGIN &&
    sx <= viewport.clientWidth + MARGIN &&
    sy >= -MARGIN &&
    sy <= viewport.clientHeight + MARGIN
  );
}

export function updateVisible() {
  for (const c of allCircles) {
    const visible = isInView(c);
    if (visible && !renderedIds.has(c.id)) renderCircle(c);
    else if (!visible && renderedIds.has(c.id)) removeCircle(c.id);
  }
}

let rafPending = false;
export function scheduleVisible() {
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(() => {
    rafPending = false;
    updateVisible();
  });
}
