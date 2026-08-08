// ============================================================
//  2. Render circles on the map (with viewport culling)
// ============================================================
// We keep ALL circle rows in `allCircles` but only mount the ones currently in
// view as DOM nodes. `renderedIds` tracks what's mounted; `droppedIds` tracks
// which circles already played their fall animation (first appearance only).
import { circlesLayer, map, viewport } from "./dom";
import { allCircles, droppedIds, pos, renderedIds } from "./state";
import { showTooltip } from "./tooltip";
import type { Circle } from "../lib/types";

const MARGIN = 200; // px buffer so circles mount just before they scroll in

/** Mount a single circle as a DOM node (no-op if already mounted). */
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
  // Play the drop animation only the first time this circle ever appears.
  if (!droppedIds.has(c.id)) {
    droppedIds.add(c.id);
    el.classList.add("dropping");
    el.addEventListener("animationend", () => el.classList.remove("dropping"), { once: true });
  }
  circlesLayer.appendChild(el);
  renderedIds.add(c.id);
}

/** Unmount a circle's DOM node. */
export function removeCircle(id: string) {
  if (!renderedIds.has(id)) return;
  const el = circlesLayer.querySelector(`[data-id="${id}"]`);
  if (el) el.remove();
  renderedIds.delete(id);
}

/** Is the circle's screen position within the viewport (+ buffer)? */
function isInView(c: Circle) {
  const mw = map.offsetWidth;
  const mh = map.offsetHeight;
  const sx = pos.x + (c.x / 100) * mw; // screen x of the circle
  const sy = pos.y + (c.y / 100) * mh;
  return (
    sx >= -MARGIN &&
    sx <= viewport.clientWidth + MARGIN &&
    sy >= -MARGIN &&
    sy <= viewport.clientHeight + MARGIN
  );
}

/** Culling pass: mount circles that entered view, unmount those that left. */
export function updateVisible() {
  for (const c of allCircles) {
    const visible = isInView(c);
    if (visible && !renderedIds.has(c.id)) renderCircle(c);
    else if (!visible && renderedIds.has(c.id)) removeCircle(c.id);
  }
}

// Throttle updateVisible to once per animation frame (called on every pan move).
let rafPending = false;
export function scheduleVisible() {
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(() => {
    rafPending = false;
    updateVisible();
  });
}
