import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import chairUrl from "@/assets/chair/pink_chair.webp";
import { useMediaStatus } from "@/lib/useMediaStatus";
import type { Circle } from "@/lib/types";

const AVATAR_BG_ALPHA = "4d";
const panelClass =
  "space-y-6 rounded-t-2xl md:rounded-t-none md:rounded-l-2xl z-30 w-full max-h-[85vh] md:h-full md:max-h-none md:w-140 md:max-w-[90vw] overflow-y-auto bg-paper p-6 shadow-[0_-4px_20px_rgb(0_0_0/0.4)] md:shadow-[-4px_0_20px_rgb(0_0_0/0.4)]";

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
          className="flex size-11 cursor-pointer items-center justify-center rounded-xl border-none bg-transparent text-2xl leading-none text-navy hover:bg-navy/5 focus-visible:outline-2 focus-visible:outline-navy"
        >
          ×
        </button>
      </div>

      {circle && (
        <>
          <h2 id="detail-panel-title" className="m-0 text-2xl font-bold text-navy">
            {circle.title || "Sin título"}
          </h2>
          {circle.author && (
            <p className="text-sm text-navy/70">
              Memoria escrita por {circle.author}.
            </p>
          )}

          <div className="mt-6 space-y-4">
            {circle.text_content && (
              <p className="m-0 whitespace-pre-wrap text-navy">
                {circle.text_content}
              </p>
            )}
            {isMedia && status === "loading" && <div className="tooltip-spinner" />}
            {isMedia && status === "error" && <p>No se pudo cargar el archivo.</p>}
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

          <div className="mt-6 flex justify-center border-t border-navy/10 pt-6">
            <button
              type="button"
              onClick={() => console.info("Reportar contenido", circle.id)}
              aria-label="Reportar contenido"
              className="flex size-12 cursor-pointer items-center justify-center rounded-lg border-none bg-transparent text-2xl text-navy/70 hover:bg-navy/5 focus-visible:outline-2 focus-visible:outline-navy"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1em"
                height="1em"
                viewBox="0 0 16 16"
              >
                <path d="M0 0h16v16H0z" fill="none" />
                <path
                  fill="currentColor"
                  d="M10.067.87a2.89 2.89 0 0 0-4.134 0l-.622.638l-.89-.011a2.89 2.89 0 0 0-2.924 2.924l.01.89l-.636.622a2.89 2.89 0 0 0 0 4.134l.637.622l-.011.89a2.89 2.89 0 0 0 2.924 2.924l.89-.01l.622.636a2.89 2.89 0 0 0 4.134 0l.622-.637l.89.011a2.89 2.89 0 0 0 2.924-2.924l-.01-.89l.636-.622a2.89 2.89 0 0 0 0-4.134l-.637-.622l.011-.89a2.89 2.89 0 0 0-2.924-2.924l-.89.01zM8 4c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995A.905.905 0 0 1 8 4m.002 6a1 1 0 1 1 0 2a1 1 0 0 1 0-2"
                />
              </svg>
            </button>
          </div>
        </>
      )}
    </aside>
  );
}
