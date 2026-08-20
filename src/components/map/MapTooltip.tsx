import { useEffect, useState } from "react";
import type { Circle } from "@/lib/types";

type Status = "loading" | "ready" | "error";

export default function MapTooltip({ circle }: { circle: Circle | null }) {
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => setStatus("loading"), [circle]);

  if (!circle) return null;

  const isMedia = circle.media_type === "image" || circle.media_type === "video";
  const mediaClass = status === "ready" ? undefined : "loading";

  return (
    <div
      id="tooltip"
      className="z-40 max-w-[320px] rounded-[10px] bg-white p-3.5 shadow-[0_4px_16px_rgb(0_0_0/0.18)]"
      style={{
        left: `${circle.x}%`,
        top: `${circle.y}%`,
        transform: "translate(-50%, calc(-100% - 18px))",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div id="tooltip-content" className="max-h-[70vh] overflow-auto">
        {circle.title && <p className="m-0 mb-1 font-bold text-navy">{circle.title}</p>}
        {circle.author && <p className="m-0 mb-2 text-sm text-navy/70">{circle.author}</p>}
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
        {circle.media_type === "text" && <p>{circle.text_content || ""}</p>}
      </div>
    </div>
  );
}
