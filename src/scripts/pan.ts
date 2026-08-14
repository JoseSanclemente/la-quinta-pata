import { map, viewport } from "@/scripts/dom";
import { origin, pan, pos, start } from "@/scripts/state";
import { scheduleVisible } from "@/scripts/circles";
import type { Circle } from "@/lib/types";

export function applyTransform() {
  map.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
}

export function clamp() {
  const vw = viewport.clientWidth;
  const vh = viewport.clientHeight;
  const mw = map.offsetWidth;
  const mh = map.offsetHeight;
  const minX = Math.min(0, vw - mw);
  const minY = Math.min(0, vh - mh);
  pos.x = Math.max(minX, Math.min(0, pos.x));
  pos.y = Math.max(minY, Math.min(0, pos.y));
}

export function centerOnCircle(c: Pick<Circle, "x" | "y">) {
  const mw = map.offsetWidth;
  const mh = map.offsetHeight;
  pos.x = viewport.clientWidth / 2 - (c.x / 100) * mw;
  pos.y = viewport.clientHeight / 2 - (c.y / 100) * mh;
  clamp();
  map.classList.add("smooth");
  applyTransform();
  scheduleVisible();
  map.addEventListener("transitionend", () => map.classList.remove("smooth"), { once: true });
}

function point(e: MouseEvent | TouchEvent) {
  return "touches" in e ? e.touches[0]! : e;
}

function pointerDown(e: MouseEvent | TouchEvent) {
  pan.panning = true;
  pan.moved = false;
  viewport.classList.add("dragging");
  const p = point(e);
  start.x = p.clientX;
  start.y = p.clientY;
  origin.x = pos.x;
  origin.y = pos.y;
}

function pointerMove(e: MouseEvent | TouchEvent) {
  if (!pan.panning) return;
  pan.moved = true;
  const p = point(e);
  pos.x = origin.x + (p.clientX - start.x);
  pos.y = origin.y + (p.clientY - start.y);
  clamp();
  applyTransform();
  scheduleVisible();
}

function pointerUp() {
  pan.panning = false;
  viewport.classList.remove("dragging");
}

export function initPan() {
  viewport.addEventListener("mousedown", pointerDown);
  window.addEventListener("mousemove", pointerMove);
  window.addEventListener("mouseup", pointerUp);
  viewport.addEventListener("touchstart", pointerDown, { passive: true });
  window.addEventListener("touchmove", pointerMove, { passive: true });
  window.addEventListener("touchend", pointerUp);
}
