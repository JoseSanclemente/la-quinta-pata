import type { Chair } from "@/lib/types";

const BORDER_MARGIN = 9;
const MIN_GAP = 10;
const PLACEMENT_ATTEMPTS = 120;
const CHAIR_PX = 100;

type Box = { x1: number; y1: number; x2: number; y2: number };

function decorationBoxes(): Box[] {
  const map = document.getElementById("map");
  if (!map) return [];
  const bounds = map.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return [];
  return [...map.querySelectorAll<HTMLElement>("[data-decoration]")].map(
    (element) => {
      const rect = element.getBoundingClientRect();
      return {
        x1: ((rect.left - bounds.left) / bounds.width) * 100,
        y1: ((rect.top - bounds.top) / bounds.height) * 100,
        x2: ((rect.right - bounds.left) / bounds.width) * 100,
        y2: ((rect.bottom - bounds.top) / bounds.height) * 100,
      };
    },
  );
}

function chairHalfSize() {
  const map = document.getElementById("map");
  const width = map?.getBoundingClientRect().width || 0;
  const height = map?.getBoundingClientRect().height || 0;
  return {
    x: width ? (CHAIR_PX / 2 / width) * 100 : 0,
    y: height ? (CHAIR_PX / 2 / height) * 100 : 0,
  };
}

export function pickPosition(existing: Chair[]) {
  const boxes = decorationBoxes();
  const half = chairHalfSize();
  const hits = (x: number, y: number) =>
    boxes.some(
      (box) =>
        x + half.x > box.x1 &&
        x - half.x < box.x2 &&
        y + half.y > box.y1 &&
        y - half.y < box.y2,
    );

  let best = { x: 50, y: 50 };
  let bestMinDist = -1;
  let bestFree: { x: number; y: number } | null = null;
  let bestFreeMinDist = -1;

  for (let i = 0; i < PLACEMENT_ATTEMPTS; i++) {
    const x = Math.round(
      Math.random() * (100 - 2 * BORDER_MARGIN) + BORDER_MARGIN,
    );
    const y = Math.round(
      Math.random() * (100 - 2 * BORDER_MARGIN) + BORDER_MARGIN,
    );
    const free = !hits(x, y);
    const minDist = existing.reduce(
      (min, c) => Math.min(min, Math.hypot(c.x - x, c.y - y)),
      Infinity,
    );

    if (free && minDist >= MIN_GAP) return { x, y };
    if (free && minDist > bestFreeMinDist) {
      bestFreeMinDist = minDist;
      bestFree = { x, y };
    }
    if (minDist > bestMinDist) {
      bestMinDist = minDist;
      best = { x, y };
    }
  }

  return bestFree ?? best;
}
