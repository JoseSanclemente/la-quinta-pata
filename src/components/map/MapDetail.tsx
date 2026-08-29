import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import chairUrl from "@/assets/chair/pink_chair.webp";
import MapReportButton from "@/components/map/MapReportButton";
import VoicePlayer from "@/components/map/VoicePlayer";
import { useMediaStatus } from "@/lib/useMediaStatus";
import type { Chair } from "@/lib/types";

const AVATAR_BG_ALPHA = "4d";
const panelClass =
  "space-y-6 rounded-t-2xl md:rounded-t-none md:rounded-l-2xl z-30 w-full max-h-[85vh] md:h-full md:max-h-none md:w-140 md:max-w-[90vw] min-w-[min(28rem,100vw)] overflow-y-auto bg-paper p-6 shadow-[0_-4px_20px_rgb(0_0_0/0.4)] md:shadow-[-4px_0_20px_rgb(0_0_0/0.4)]";

type Props = {
  circle: Chair | null;
  open: boolean;
  onClose: () => void;
  onReported: (id: string) => void;
};

export default function MapDetail({
  circle,
  open,
  onClose,
  onReported,
}: Props) {
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

  const isMedia =
    circle?.media_type === "image" || circle?.media_type === "video";
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
          className="text-navy hover:bg-navy/5 focus-visible:outline-navy flex size-11 cursor-pointer items-center justify-center rounded-xl border-none bg-transparent text-2xl leading-none focus-visible:outline-2"
        >
          ×
        </button>
      </div>

      {circle && (
        <>
          <div className="space-y-1">
            <h2
              id="detail-panel-title"
              className="text-navy text-2xl font-bold"
            >
              {circle.title || "Sin título"}
            </h2>
            <p className="text-navy/70 text-sm">
              Memoria escrita por {circle.author || "anónimo"}.
            </p>
          </div>

          <div className="mt-6 space-y-10">
            {circle.text_content && (
              <p className="text-navy whitespace-pre-wrap">
                {circle.text_content}
              </p>
            )}
            {isMedia && status === "loading" && (
              <div className="tooltip-spinner" />
            )}
            {isMedia && status === "error" && (
              <p>No se pudo cargar el archivo.</p>
            )}
            {circle.media_type === "image" && (
              <img
                key={circle.id}
                src={circle.media_url ?? ""}
                alt={circle.title || "Imagen de la memoria"}
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
            {circle.media_type === "audio" && circle.media_url && (
              <VoicePlayer key={circle.id} src={circle.media_url} />
            )}
          </div>

          <div className="flex h-40 items-center justify-center">
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
          </div>

          <div className="border-navy/10 mt-6 flex justify-center border-t pt-6">
            <MapReportButton
              circleId={circle.id}
              onReported={(id) => {
                onReported(id);
                onClose();
              }}
            />
          </div>
        </>
      )}
    </aside>
  );
}
