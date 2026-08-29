import { useCallback, useEffect, useRef, useState } from "react";
import { db } from "@/lib/supabase.client";
import AddMemoryForm from "@/components/map/AddMemoryForm";
import IntroPopup from "@/components/map/IntroPopup";
import MapChair from "@/components/map/MapChair";
import MapDetail from "@/components/map/MapDetail";
import MapHint from "@/components/map/MapHint";
import MapTooltip from "@/components/map/MapTooltip";
import chairUrl from "@/assets/chair/pink_chair.webp";
import logoUrl from "@/assets/logo.webp";
import palmTreeUrl from "@/assets/palm_tree.webp";
import treeUrl from "@/assets/map_assets/10_arbol.webp";
import tree2Url from "@/assets/map_assets/11_arbol_2.webp";
import busUrl from "@/assets/map_assets/bus.webp";
import busRightUrl from "@/assets/map_assets/bus_right.webp";
import boxesUrl from "@/assets/boxes.webp";
import chiguiroUrl from "@/assets/map_assets/chiguiro.webp";
import cartUrl from "@/assets/map_assets/11_carrito.webp";
import iceCartUrl from "@/assets/map_assets/17_carritohelados.webp";
import frailejonUrl from "@/assets/map_assets/frailejones.webp";

const DECORATIONS = [
  { src: palmTreeUrl.src, x: 22, y: 64, w: "clamp(7rem, 6vw, 18rem)" },
  { src: treeUrl.src, x: 71, y: 38, w: "clamp(7rem, 6vw, 18rem)" },
  { src: palmTreeUrl.src, x: 20, y: 20, w: "clamp(5.5rem, 5vw, 14rem)" },
  { src: treeUrl.src, x: 70, y: 12, w: "clamp(5.5rem, 5vw, 14rem)" },
  { src: palmTreeUrl.src, x: 40, y: 85, w: "clamp(6rem, 5.5vw, 16rem)" },
  { src: treeUrl.src, x: 15, y: 90, w: "clamp(5.5rem, 5vw, 14rem)" },
  { src: palmTreeUrl.src, x: 82, y: 70, w: "clamp(6rem, 5.5vw, 16rem)" },
  { src: treeUrl.src, x: 55, y: 8, w: "clamp(5.5rem, 5vw, 14rem)" },
  { src: tree2Url.src, x: 65, y: 60, w: "clamp(6rem, 5.5vw, 16rem)" },
  { src: tree2Url.src, x: 22, y: 45, w: "clamp(5.5rem, 5vw, 14rem)" },
  { src: tree2Url.src, x: 95, y: 90, w: "clamp(5.5rem, 5vw, 14rem)" },
  { src: frailejonUrl.src, x: 1, y: 7.5, w: "clamp(5rem, 5vw, 15rem)" },
  { src: frailejonUrl.src, x: 31.5, y: 2.8, w: "clamp(5rem, 5vw, 15rem)" },
  { src: frailejonUrl.src, x: 72, y: 0.5, w: "clamp(5rem, 5vw, 15rem)" },
  { src: frailejonUrl.src, x: 94, y: 11, w: "clamp(5rem, 5vw, 15rem)" },
  { src: busRightUrl.src, x: 0, y: 20.5, w: "clamp(7rem, 12.5vw, 22rem)" },
  { src: busUrl.src, x: 90, y: 76, w: "clamp(7rem, 12.5vw, 22rem)" },
  { src: cartUrl.src, x: 84.5, y: 33.5, w: "clamp(3.75rem, 5vw, 13rem)" },
  { src: cartUrl.src, x: 21, y: 26, w: "clamp(3.75rem, 5vw, 13rem)" },
  { src: cartUrl.src, x: 1, y: 61.5, w: "clamp(3.75rem, 5vw, 13rem)" },
  { src: iceCartUrl.src, x: 68.5, y: 19.5, w: "clamp(3.75rem, 5vw, 13rem)" },
  { src: iceCartUrl.src, x: 84.5, y: 55.5, w: "clamp(3.75rem, 5vw, 13rem)" },
  { src: iceCartUrl.src, x: 12.5, y: 77.5, w: "clamp(3.75rem, 5vw, 13rem)" },
  { src: boxesUrl.src, x: 36, y: 59, w: "clamp(2.75rem, 3.75vw, 10rem)" },
  { src: boxesUrl.src, x: 90, y: 91.5, w: "clamp(2.75rem, 3.75vw, 10rem)" },
  { src: chiguiroUrl.src, x: 87.5, y: 23, w: "clamp(1.75rem, 2.25vw, 6rem)" },
  { src: chiguiroUrl.src, x: 8, y: 57, w: "clamp(1.75rem, 2.25vw, 6rem)" },
] as const;
import type { Chair } from "@/lib/types";

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

  const [circles, setCircles] = useState<Chair[]>([]);
  const [visibleIds, setVisibleIds] = useState<string[]>([]);
  const [tooltipCircle, setTooltipCircle] = useState<Chair | null>(null);
  const [detailCircle, setDetailCircle] = useState<Chair | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [introOpen, setIntroOpen] = useState(true);
  const [mapSrc, setMapSrc] = useState(MAP_SRC);
  const [ready, setReady] = useState(false);
  const [hasPanned, setHasPanned] = useState(false);

  const pos = useRef({ x: 0, y: 0 });
  const start = useRef({ x: 0, y: 0 });
  const origin = useRef({ x: 0, y: 0 });
  const pan = useRef({ panning: false, moved: false });
  const dropped = useRef(new Set<string>());
  const circlesRef = useRef(circles);
  const mountedAt = useRef(Date.now());
  const rafPending = useRef(false);
  const didCenter = useRef(false);

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
    (c: Pick<Chair, "x" | "y">) => {
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
      if ((e.target as Element | null)?.closest("#tooltip")) return;
      if (e.type === "mousedown") e.preventDefault();
      pan.current.panning = true;
      pan.current.moved = false;
      viewport.classList.add("dragging");
      const p = point(e);
      start.current = { x: p.clientX, y: p.clientY };
      origin.current = { ...pos.current };
    };

    const move = (e: MouseEvent | TouchEvent) => {
      if (!pan.current.panning) return;
      if ("buttons" in e && e.buttons === 0) {
        up();
        return;
      }
      if (!pan.current.moved) {
        pan.current.moved = true;
        setTooltipCircle(null);
        setHasPanned(true);
      }
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
    window.addEventListener("blur", up);

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
      window.removeEventListener("blur", up);
    };
  }, [applyTransform, clamp, scheduleVisible, updateVisible]);

  useEffect(() => {
    const channel = db
      .channel("chairs-changes")
      .on<Chair>(
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

    const fetchAll = () => {
      const startedAt = Date.now();
      db.from("memories")
        .select("*")
        .then(({ data, error }) => {
          if (error) return;
          const rows = (data ?? []) as Chair[];
          const fetched = new Set(rows.map((c) => c.id));
          setCircles((prev) => [
            ...rows,
            ...prev.filter(
              (c) =>
                !fetched.has(c.id) &&
                new Date(c.created_at).getTime() >= startedAt,
            ),
          ]);
        });
    };

    fetchAll();
    const refetchWhenVisible = () => {
      if (document.visibilityState === "visible") fetchAll();
    };
    document.addEventListener("visibilitychange", refetchWhenVisible);

    return () => {
      document.removeEventListener("visibilitychange", refetchWhenVisible);
      db.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    updateVisible();
  }, [circles, updateVisible]);

  const closeIntro = useCallback(() => {
    setIntroOpen(false);
  }, []);

  useEffect(() => {
    const image = imageRef.current;
    if (!image?.complete) return;
    if (image.naturalWidth === 0) setMapSrc(FALLBACK_SRC);
    finishLoading();
  }, [finishLoading]);

  useEffect(() => {
    if (didCenter.current || !circles.length || pan.current.moved) return;
    didCenter.current = true;
    const x = circles.reduce((sum, c) => sum + c.x, 0) / circles.length;
    const y = circles.reduce((sum, c) => sum + c.y, 0) / circles.length;
    centerOnCircle({ x, y });
  }, [circles, centerOnCircle]);

  const onCreated = useCallback(
    (chair: Chair) => {
      setCircles((prev) =>
        prev.some((c) => c.id === chair.id) ? prev : [...prev, chair],
      );
      centerOnCircle(chair);
    },
    [centerOnCircle],
  );

  const byId = new Map(circles.map((c) => [c.id, c]));
  const blocked = detailOpen || introOpen || sidebarOpen;

  return (
    <>
      <div
        id="viewport"
        ref={viewportRef}
        className="fixed inset-0 overflow-hidden"
        inert={blocked}
        onClick={() => {
          if (!pan.current.moved) {
            setDetailOpen(false);
            setTooltipCircle(null);
          }
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
              if (!didCenter.current && !pan.current.moved)
                centerOnCircle({ x: 50, y: 50 });
              clamp();
              applyTransform();
              updateVisible();
              finishLoading();
            }}
          />
          {DECORATIONS.map((d, i) => (
            <img
              key={i}
              src={d.src}
              alt=""
              data-decoration
              draggable={false}
              className="pointer-events-none absolute h-auto origin-top-left select-none xl:scale-180"
              style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.w }}
            />
          ))}
          <div id="circles-layer" className="absolute inset-0">
            {visibleIds.map((id) => {
              const circle = byId.get(id);
              return circle ? (
                <MapChair
                  key={id}
                  circle={circle}
                  dropped={dropped.current}
                  onSelect={(c) => setTooltipCircle(c)}
                />
              ) : null;
            })}
          </div>
          <MapTooltip
            circle={tooltipCircle}
            onShowMore={(c) => {
              setDetailCircle(c);
              setDetailOpen(true);
              setTooltipCircle(null);
            }}
            onReported={(id) => {
              setCircles((prev) => prev.filter((c) => c.id !== id));
              setTooltipCircle(null);
            }}
          />
        </div>
      </div>

      <div id="map-loader" className={ready ? "done" : undefined} role="status">
        <img
          src={chairUrl.src}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="loader-chair select-none"
        />
        <p>Desdoblando el mapa</p>
      </div>

      <MapHint
        count={circles.length}
        visible={ready && !hasPanned && !blocked}
      />

      <a
        href="/"
        aria-label="Volver al inicio"
        inert={blocked}
        className="fixed top-4 left-1/2 z-20 -translate-x-1/2"
      >
        <img
          src={logoUrl.src}
          alt="La Quinta Pata"
          draggable={false}
          className="h-24 w-auto scale-100 transition-transform duration-200 select-none hover:scale-105 md:h-32"
        />
      </a>

      <div
        className="fixed bottom-2 left-1/2 z-20 flex -translate-x-1/2 items-center md:bottom-4"
        inert={blocked}
      >
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Crear memoria"
          className="group relative flex h-34 w-34 scale-100 cursor-pointer items-center justify-center transition-transform duration-200 hover:scale-105 md:h-40 md:w-40"
        >
          <svg
            viewBox="0 0 100 100"
            aria-hidden="true"
            className="fill-secondary group-hover:fill-secondary-hover absolute inset-0 h-full w-full transition-transform duration-200 group-hover:rotate-12"
          >
            <path d="M50,2 56.9,33.4 83.9,16.1 66.6,43.1 98,50 66.6,56.9 83.9,83.9 56.9,66.6 50,98 43.1,66.6 16.1,83.9 33.4,56.9 2,50 33.4,43.1 16.1,16.1 43.1,33.4Z" />
          </svg>
          <div
            aria-hidden="true"
            className="relative h-15 w-15 bg-white md:h-18 md:w-18"
            style={{
              WebkitMask: `url(${chairUrl.src}) center / contain no-repeat`,
              mask: `url(${chairUrl.src}) center / contain no-repeat`,
            }}
          />
        </button>
      </div>

      <AddMemoryForm
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onCreated={onCreated}
        existingChairsRef={circlesRef}
      />

      <MapDetail
        circle={detailCircle}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onReported={(id) =>
          setCircles((prev) => prev.filter((c) => c.id !== id))
        }
      />

      <IntroPopup open={introOpen} onClose={closeIntro} />
    </>
  );
}
