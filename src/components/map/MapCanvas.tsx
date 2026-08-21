import { useCallback, useEffect, useRef, useState } from "react";
import { db } from "@/lib/supabase.client";
import AddMemoryForm from "@/components/map/AddMemoryForm";
import MapCircle from "@/components/map/MapChair";
import MapDetail from "@/components/map/MapDetail";
import MapTooltip from "@/components/map/MapTooltip";
import type { Circle } from "@/lib/types";

const MAP_SRC = "/assets/map-3000.webp";
const MAP_SRCSET = "/assets/map-1600.webp 1600w, /assets/map-3000.webp 3000w";
const MAP_SIZES = "(width < 48rem) 400px, clamp(1100px, 260vw, 3000px)";
const FALLBACK_SRC = "/assets/placeholder.svg";
const MARGIN = 200;
const SMOOTH_MS = 500;
const LOADER_MIN_MS = 900;

export default function MapCanvas() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [circles, setCircles] = useState<Circle[]>([]);
  const [visibleIds, setVisibleIds] = useState<string[]>([]);
  const [hovered, setHovered] = useState<Circle | null>(null);
  const [detailCircle, setDetailCircle] = useState<Circle | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mapSrc, setMapSrc] = useState(MAP_SRC);
  const [ready, setReady] = useState(false);

  const pos = useRef({ x: 0, y: 0 });
  const start = useRef({ x: 0, y: 0 });
  const origin = useRef({ x: 0, y: 0 });
  const pan = useRef({ panning: false, moved: false });
  const dropped = useRef(new Set<string>());
  const circlesRef = useRef(circles);
  const mountedAt = useRef(Date.now());
  const rafPending = useRef(false);

  circlesRef.current = circles;

  const finishLoading = useCallback(() => {
    const left = LOADER_MIN_MS - (Date.now() - mountedAt.current);
    if (left <= 0) setReady(true);
    else window.setTimeout(() => setReady(true), left);
  }, []);

  const applyTransform = useCallback(() => {
    const map = mapRef.current;
    if (map)
      map.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px)`;
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
      prev.length === next.length && prev.every((id, i) => id === next[i])
        ? prev
        : next,
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
      pos.current.y =
        viewport.clientHeight / 2 - (c.y / 100) * map.offsetHeight;
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

    const point = (e: MouseEvent | TouchEvent) =>
      "touches" in e ? e.touches[0]! : e;

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
        { event: "INSERT", schema: "public", table: "memories" },
        (payload) => {
          setCircles((prev) =>
            prev.some((c) => c.id === payload.new.id)
              ? prev
              : [...prev, payload.new],
          );
        },
      )
      .subscribe();

    db.from("memories")
      .select("*")
      .then(({ data, error }) => {
        if (error) return;
        setCircles((prev) => {
          const known = new Set(prev.map((c) => c.id));
          return [
            ...prev,
            ...((data ?? []) as Circle[]).filter((c) => !known.has(c.id)),
          ];
        });
      });

    return () => {
      db.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    updateVisible();
  }, [circles, updateVisible]);

  useEffect(() => {
    const image = imageRef.current;
    if (!image?.complete) return;
    if (image.naturalWidth === 0) setMapSrc(FALLBACK_SRC);
    finishLoading();
  }, [finishLoading]);

  const onCreated = useCallback(
    (circle: Circle) => {
      setCircles((prev) =>
        prev.some((c) => c.id === circle.id) ? prev : [...prev, circle],
      );
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
        inert={detailOpen}
        onClick={() => {
          if (!pan.current.moved) setDetailOpen(false);
        }}
      >
        <div id="map" ref={mapRef} className="absolute top-0 left-0">
          <img
            id="map-image"
            ref={imageRef}
            src={mapSrc}
            srcSet={mapSrc === MAP_SRC ? MAP_SRCSET : undefined}
            sizes={mapSrc === MAP_SRC ? MAP_SIZES : undefined}
            width={3000}
            height={3000}
            alt="Mapa de La Quinta Pata"
            draggable={false}
            fetchPriority="high"
            onError={() => {
              setMapSrc(FALLBACK_SRC);
              finishLoading();
            }}
            onLoad={() => {
              clamp();
              applyTransform();
              updateVisible();
              finishLoading();
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
                  onHover={setHovered}
                  onSelect={(c) => {
                    setDetailCircle(c);
                    setDetailOpen(true);
                    setHovered(null);
                  }}
                />
              ) : null;
            })}
          </div>
          <MapTooltip circle={hovered} />
        </div>
      </div>

      <div id="map-loader" className={ready ? "done" : undefined} role="status">
        <div className="loader-dots" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <p>Desdoblando el mapa</p>
      </div>

      <a
        href="/"
        aria-label="Volver al inicio"
        inert={detailOpen}
        className="fixed top-4 left-4 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-white shadow-[0_2px_10px_rgb(0_0_0/0.4)] hover:bg-secondary-hover md:h-12 md:w-12"
      >
        <svg aria-hidden="true" className="h-5 w-5 md:h-6 md:w-6">
          <use href="/icons/sprite.svg#icon-back" />
        </svg>
      </a>

      <div
        className="fixed bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 md:bottom-6 md:gap-4"
        inert={detailOpen}
      >
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="flex h-11 w-48 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-brand px-6 text-base font-semibold text-white shadow-[0_2px_10px_rgb(0_0_0/0.4)] hover:bg-brand-hover md:h-14 md:w-64 md:gap-2 md:px-8 md:text-lg"
        >
          <svg aria-hidden="true" className="h-4 w-4 shrink-0 md:h-5 md:w-5">
            <use href="/icons/sprite.svg#icon-add" />
          </svg>
          Crear memoria
        </button>

        <a
          href="https://instagram.com"
          target="_blank"
          rel="noreferrer"
          aria-label="Instagram de La Quinta Pata"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-white shadow-[0_2px_10px_rgb(0_0_0/0.4)] hover:bg-secondary-hover md:h-14 md:w-14"
        >
          <svg aria-hidden="true" className="h-5 w-5 md:h-6 md:w-6">
            <use href="/icons/sprite.svg#icon-instagram" />
          </svg>
        </a>
      </div>

      <AddMemoryForm
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onCreated={onCreated}
      />

      <MapDetail
        circle={detailCircle}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onReported={(id) =>
          setCircles((prev) => prev.filter((c) => c.id !== id))
        }
      />
    </>
  );
}
