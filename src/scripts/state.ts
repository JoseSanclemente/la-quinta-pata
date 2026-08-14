import type { Circle } from "@/lib/types";

export const pos = { x: 0, y: 0 };
export const start = { x: 0, y: 0 };
export const origin = { x: 0, y: 0 };

export const pan = {
  panning: false,
  moved: false,
};

export const allCircles: Circle[] = [];
export const renderedIds = new Set<string>();
export const droppedIds = new Set<string>();
