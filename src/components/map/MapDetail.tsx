import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import chairUrl from "@/assets/chair/pink_chair.webp";
import { useMediaStatus } from "@/lib/useMediaStatus";
import type { Circle } from "@/lib/types";

const AVATAR_BG_ALPHA = "4d";
const panelClass =
  "rounded-t-2xl md:rounded-t-none md:rounded-l-2xl z-30 w-full max-h-[85vh] md:h-full md:max-h-none md:w-140 md:max-w-[90vw] overflow-y-auto bg-paper p-6 shadow-[0_-4px_20px_rgb(0_0_0/0.4)] md:shadow-[-4px_0_20px_rgb(0_0_0/0.4)]";

type Props = {
  circle: Circle | null;
  open: boolean;
  onClose: () => void;
};

export default function MapDetail({ circle, open, onClose }: Props) {
  const [status, setStatus] = useMediaStatus(circle?.id);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      closeRef.current?.focus();
    } else {
      previousFocusRef.current?.focus();
    }
  }, [open]);

  if (!circle) return null;

  const isMedia = circle.media_type === "image" || circle.media_type === "video";
  const mediaClass = status === "ready" ? undefined : "loading";

  return (
    <aside
      id="detail-panel"
      className={open ? `open ${panelClass}` : panelClass}
      role="dialog"
      aria-modal={open}
      aria-labelledby="detail-panel-title"
      inert={!open}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div className="flex items-center justify-end">
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="flex size-11 cursor-pointer items-center justify-center rounded-xl border-none bg-transparent text-2xl leading-none text-navy"
        >
          ×
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div
          className="flex size-32 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${circle.color}${AVATAR_BG_ALPHA}` }}
        >
          <span
            className="chair size-24"
            style={
              {
                "--c": circle.color,
                "--chair-src": `url(${chairUrl.src})`,
              } as CSSProperties
            }
          />
        </div>
        <div>
          <h2
            id="detail-panel-title"
            className={circle.title ? "m-0 mb-1 font-bold text-navy" : "sr-only"}
          >
            {circle.title || "Detalle de la memoria"}
          </h2>
          {circle.author && <p className="m-0 text-sm text-navy/70">{circle.author}</p>}
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {circle.text_content && (
          <p className="m-0 whitespace-pre-wrap text-navy">{circle.text_content}</p>
        )}
        {isMedia && status === "loading" && <div className="tooltip-spinner" />}
        {isMedia && status === "error" && <p>No se pudo cargar el archivo.</p>}
        {circle.media_type === "image" && (
          <img
            key={circle.id}
            src={circle.media_url ?? ""}
            alt=""
            className={mediaClass}
            onLoad={() => setStatus("ready")}
            onError={() => setStatus("error")}
          />
        )}
        {circle.media_type === "video" && (
          <video
            key={circle.id}
            src={circle.media_url ?? ""}
            controls
            className={mediaClass}
            onLoadedData={() => setStatus("ready")}
            onError={() => setStatus("error")}
          />
        )}
      </div>
    </aside>
  );
}
