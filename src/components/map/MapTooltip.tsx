import { useEffect, useRef, useState } from "react";
import MapReportButton from "@/components/map/MapReportButton";
import VoicePlayer from "@/components/map/VoicePlayer";
import { useMediaStatus } from "@/lib/useMediaStatus";
import type { Chair } from "@/lib/types";

const EXIT_MS = 150;
const TRUNCATE_WORDS = 25;

function truncate(text: string) {
  const words = text.trim().split(/\s+/);
  if (words.length <= TRUNCATE_WORDS) return text;
  return `${words.slice(0, TRUNCATE_WORDS).join(" ")}…`;
}

type Props = {
  circle: Chair | null;
  onShowMore: (circle: Chair) => void;
  onReported: (id: string) => void;
};

const EDGE_MARGIN = 16;

export default function MapTooltip({ circle, onShowMore, onReported }: Props) {
  const [shown, setShown] = useState<Chair | null>(null);
  const [closing, setClosing] = useState(false);
  const timeoutRef = useRef<number>(undefined);
  const [status, setStatus] = useMediaStatus(shown?.id);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [edgeOffset, setEdgeOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    window.clearTimeout(timeoutRef.current);
    if (circle) {
      setShown(circle);
      setClosing(false);
    } else if (shown) {
      setClosing(true);
      timeoutRef.current = window.setTimeout(() => setShown(null), EXIT_MS);
    }
    return () => window.clearTimeout(timeoutRef.current);
  }, [circle]);

  useEffect(() => {
    setEdgeOffset({ x: 0, y: 0 });
    const el = tooltipRef.current;
    if (!shown || !el) return;
    const rect = el.getBoundingClientRect();
    let x = 0;
    let y = 0;
    if (rect.left < EDGE_MARGIN) x = EDGE_MARGIN - rect.left;
    else if (rect.right > window.innerWidth - EDGE_MARGIN)
      x = window.innerWidth - EDGE_MARGIN - rect.right;
    if (rect.top < EDGE_MARGIN) y = EDGE_MARGIN - rect.top;
    else if (rect.bottom > window.innerHeight - EDGE_MARGIN)
      y = window.innerHeight - EDGE_MARGIN - rect.bottom;
    if (x || y) setEdgeOffset({ x, y });
  }, [shown, status]);

  if (!shown) return null;

  const isMedia = shown.media_type === "image" || shown.media_type === "video";
  const mediaClass = status === "ready" ? undefined : "loading";

  return (
    <div
      id="tooltip"
      ref={tooltipRef}
      className="z-40 w-[min(520px,calc(100vw-32px))]"
      style={{
        left: `${shown.x}%`,
        top: `${shown.y}%`,
        transform: `translate(calc(-100% + 48px + ${edgeOffset.x}px), calc(-100% - 42px + ${edgeOffset.y}px))`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        key={shown.id}
        className={`tooltip-bubble ${closing ? "tooltip-shrink" : "tooltip-grow"}`}
      >
        <div
          id="tooltip-content"
          className="relative max-h-[70vh] space-y-5 overflow-auto p-11"
        >
          <p className="text-navy/85 text-sm">
            Memoria de {shown.author || "anónimo"}:
          </p>

          {isMedia && status === "loading" && (
            <div className="tooltip-spinner" />
          )}
          {isMedia && status === "error" && (
            <p className="m-0">No se pudo cargar el archivo.</p>
          )}
          {shown.media_type === "image" && (
            <img
              key={shown.id}
              src={shown.media_url ?? ""}
              alt={shown.title || "Imagen de la memoria"}
              decoding="async"
              className={mediaClass}
              onLoad={() => setStatus("ready")}
              onError={() => setStatus("error")}
            />
          )}
          {shown.media_type === "video" && (
            <video
              key={shown.id}
              src={shown.media_url ?? ""}
              controls
              preload="metadata"
              className={mediaClass}
              onLoadedMetadata={() => setStatus("ready")}
              onError={() => setStatus("error")}
            />
          )}
          {shown.media_type === "audio" && shown.media_url && (
            <VoicePlayer key={shown.id} src={shown.media_url} />
          )}

          <p className="text-navy font-bold">{shown.title || "Sin título"}</p>

          {shown.text_content && (
            <p className="text-navy whitespace-pre-wrap">
              {truncate(shown.text_content)}
            </p>
          )}

          <button
            type="button"
            onClick={() => onShowMore(shown)}
            className="text-secondary hover:text-secondary-hover cursor-pointer border-none bg-transparent p-0 text-sm font-semibold underline"
          >
            Mostrar más
          </button>

          <div className="flex justify-end">
            <MapReportButton circleId={shown.id} onReported={onReported} />
          </div>
        </div>
      </div>
    </div>
  );
}
