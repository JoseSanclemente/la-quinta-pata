import { useEffect, useRef, useState } from "react";
import MapReportButton from "@/components/map/MapReportButton";
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

export default function MapTooltip({ circle, onShowMore, onReported }: Props) {
  const [shown, setShown] = useState<Chair | null>(null);
  const [closing, setClosing] = useState(false);
  const timeoutRef = useRef<number>(undefined);
  const [status, setStatus] = useMediaStatus(shown?.id);

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

  if (!shown) return null;

  const isMedia = shown.media_type === "image" || shown.media_type === "video";
  const mediaClass = status === "ready" ? undefined : "loading";

  return (
    <div
      id="tooltip"
      className="z-40 max-w-[min(520px,calc(100vw-32px))]"
      style={{
        left: `${shown.x}%`,
        top: `${shown.y}%`,
        transform: "translate(calc(-100% + 48px), calc(-100% - 42px))",
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
          <p className="text-navy/85 m-0 text-sm">
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
              className={mediaClass}
              onLoadedData={() => setStatus("ready")}
              onError={() => setStatus("error")}
            />
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
