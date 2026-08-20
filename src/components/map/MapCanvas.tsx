import { useCallback, useEffect, useRef, useState } from "react";
import { db } from "@/lib/supabase.client";
import CircleForm from "@/components/map/CircleForm";
import MapCircle from "@/components/map/MapCircle";
import MapTooltip from "@/components/map/MapTooltip";
import type { Circle } from "@/lib/types";

const MAP_SRC = "/assets/map-3000.webp";
const FALLBACK_SRC = "/assets/placeholder.svg";
const MARGIN = 200;
const SMOOTH_MS = 500;

export default function MapCanvas({ circles: seed }: { circles: Circle[] }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [circles, setCircles] = useState(seed);
  const [visibleIds, setVisibleIds] = useState<string[]>([]);
  const [selected, setSelected] = useState<Circle | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mapSrc, setMapSrc] = useState(MAP_SRC);

  const pos = useRef({ x: 0, y: 0 });
  const start = useRef({ x: 0, y: 0 });
  const origin = useRef({ x: 0, y: 0 });
  const pan = useRef({ panning: false, moved: false });
  const dropped = useRef(new Set<string>());
  const circlesRef = useRef(circles);
  const rafPending = useRef(false);

  circlesRef.current = circles;

  const applyTransform = useCallback(() => {
    const map = mapRef.current;
    if (map) map.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px)`;
  }, []);

  const clamp = useCallback(() => {
    const map = mapRef.current;
    const viewport = viewportRef.current;
    if (!map || !viewport) return;
    const minX = Math.min(0, viewport.clientWidth - map.offsetWidth);
    const minY = Math.min(0, viewport.clientHeight - map.offsetHeight);
    pos.current.x = Math.max(minX, Math.min(0, pos.current.x));
    pos.current.y = Math.max(minY, Math.min(0, pos.current.y));
  }, []);

  const updateVisible = useCallback(() => {
    const map = mapRef.current;
    const viewport = viewportRef.current;
    if (!map || !viewport) return;
    const mw = map.offsetWidth;
    const mh = map.offsetHeight;
    const maxX = viewport.clientWidth + MARGIN;
    const maxY = viewport.clientHeight + MARGIN;

    const next = circlesRef.current
      .filter((c) => {
        const sx = pos.current.x + (c.x / 100) * mw;
        const sy = pos.current.y + (c.y / 100) * mh;
        return sx >= -MARGIN && sx <= maxX && sy >= -MARGIN && sy <= maxY;
      })
      .map((c) => c.id);

    setVisibleIds((prev) =>
      prev.length === next.length && prev.every((id, i) => id === next[i]) ? prev : next,
    );
  }, []);

  const scheduleVisible = useCallback(() => {
    if (rafPending.current) return;
    rafPending.current = true;
    requestAnimationFrame(() => {
      rafPending.current = false;
      updateVisible();
    });
  }, [updateVisible]);

  const centerOnCircle = useCallback(
    (c: Pick<Circle, "x" | "y">) => {
      const map = mapRef.current;
      const viewport = viewportRef.current;
      if (!map || !viewport) return;
      pos.current.x = viewport.clientWidth / 2 - (c.x / 100) * map.offsetWidth;
      pos.current.y = viewport.clientHeight / 2 - (c.y / 100) * map.offsetHeight;
      clamp();
      map.classList.add("smooth");
      applyTransform();
      scheduleVisible();
      const done = () => map.classList.remove("smooth");
      map.addEventListener("transitionend", done, { once: true });
      window.setTimeout(done, SMOOTH_MS);
    },
    [applyTransform, clamp, scheduleVisible],
  );

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const point = (e: MouseEvent | TouchEvent) => ("touches" in e ? e.touches[0]! : e);

    const down = (e: MouseEvent | TouchEvent) => {
      pan.current.panning = true;
      pan.current.moved = false;
      viewport.classList.add("dragging");
      const p = point(e);
      start.current = { x: p.clientX, y: p.clientY };
      origin.current = { ...pos.current };
    };

    const move = (e: MouseEvent | TouchEvent) => {
      if (!pan.current.panning) return;
      pan.current.moved = true;
      const p = point(e);
      pos.current.x = origin.current.x + (p.clientX - start.current.x);
      pos.current.y = origin.current.y + (p.clientY - start.current.y);
      clamp();
      applyTransform();
      scheduleVisible();
    };

    const up = () => {
      pan.current.panning = false;
      viewport.classList.remove("dragging");
    };

    const resize = () => {
      clamp();
      applyTransform();
      scheduleVisible();
    };

    viewport.addEventListener("mousedown", down);
    viewport.addEventListener("touchstart", down, { passive: true });
    window.addEventListener("mousemove", move);
    window.addEventListener("touchmove", move, { passive: true });
    window.addEventListener("mouseup", up);
    window.addEventListener("touchend", up);
    window.addEventListener("resize", resize);

    applyTransform();
    updateVisible();

    return () => {
      viewport.removeEventListener("mousedown", down);
      viewport.removeEventListener("touchstart", down);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchend", up);
      window.removeEventListener("resize", resize);
    };
  }, [applyTransform, clamp, scheduleVisible, updateVisible]);

  useEffect(() => {
    const channel = db
      .channel("circles-changes")
      .on<Circle>(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "circles" },
        (payload) => {
          setCircles((prev) =>
            prev.some((c) => c.id === payload.new.id) ? prev : [...prev, payload.new],
          );
        },
      )
      .subscribe();

    return () => {
      db.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    updateVisible();
  }, [circles, updateVisible]);

  useEffect(() => {
    const image = imageRef.current;
    if (image?.complete && image.naturalWidth === 0) setMapSrc(FALLBACK_SRC);
  }, []);

  const onCreated = useCallback(
    (circle: Circle) => {
      setCircles((prev) => (prev.some((c) => c.id === circle.id) ? prev : [...prev, circle]));
      centerOnCircle(circle);
    },
    [centerOnCircle],
  );

  const byId = new Map(circles.map((c) => [c.id, c]));

  return (
    <>
      <div
        id="viewport"
        ref={viewportRef}
        className="fixed inset-0 overflow-hidden"
        onClick={() => {
          if (!pan.current.moved) setSelected(null);
        }}
      >
        <div id="map" ref={mapRef} className="absolute top-0 left-0">
          <img
            id="map-image"
            ref={imageRef}
            src={mapSrc}
            width={3000}
            height={3000}
            alt="Mapa de La Quinta Pata"
            draggable={false}
            fetchPriority="high"
            onError={() => setMapSrc(FALLBACK_SRC)}
            onLoad={() => {
              clamp();
              applyTransform();
              updateVisible();
            }}
          />
          <div id="circles-layer" className="absolute inset-0">
            {visibleIds.map((id) => {
              const circle = byId.get(id);
              return circle ? (
                <MapCircle
                  key={id}
                  circle={circle}
                  dropped={dropped.current}
                  onSelect={setSelected}
                />
              ) : null;
            })}
          </div>
          <MapTooltip circle={selected} />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        className="fixed bottom-4 left-1/2 z-20 -translate-x-1/2 cursor-pointer rounded-lg bg-navy px-4 py-2.5 text-base font-semibold text-white shadow-[0_2px_10px_rgb(0_0_0/0.4)] hover:bg-navy-hover"
      >
        + Crear
      </button>

      <CircleForm
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onCreated={onCreated}
      />
    </>
  );
}
