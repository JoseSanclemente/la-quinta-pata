import type { Circle } from "../lib/types";

/**
 * Shared mutable island state. Exported as containers (objects / arrays / sets)
 * rather than reassigned primitives, so every module sees the same values.
 */

/** Current map translate, in px. */
export const pos = { x: 0, y: 0 };
/** Pointer position when the drag started. */
export const start = { x: 0, y: 0 };
/** `pos` when the drag started — pan is origin-capture, not delta accumulation. */
export const origin = { x: 0, y: 0 };

export const pan = {
  /** A pointer is currently down on the map. */
  panning: false,
  /** The pointer actually moved — used to ignore the click that ends a drag. */
  moved: false,
};

/** Every known circle row. Only the ones in view are mounted as DOM nodes. */
export const allCircles: Circle[] = [];
/** Ids currently mounted in the DOM. */
export const renderedIds = new Set<string>();
/** Ids that already played their drop animation (first appearance only). */
export const droppedIds = new Set<string>();
