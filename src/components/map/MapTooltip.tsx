import { useEffect, useRef, useState } from "react";
import type { Circle } from "@/lib/types";

const EXIT_MS = 150;

export default function MapTooltip({ circle }: { circle: Circle | null }) {
  const [shown, setShown] = useState<Circle | null>(null);
  const [closing, setClosing] = useState(false);
  const timeoutRef = useRef<number>(undefined);

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

  return (
    <div
      id="tooltip"
      className="pointer-events-none z-40 max-w-[min(520px,calc(100vw-32px))]"
      style={{
        left: `${shown.x}%`,
        top: `${shown.y}%`,
        transform: "translate(calc(-100% + 48px), calc(-100% - 42px))",
      }}
    >
      <div
        key={shown.id}
        className={`tooltip-bubble ${closing ? "tooltip-shrink" : "tooltip-grow"}`}
      >
        <div
          id="tooltip-content"
          className="relative max-h-[70vh] overflow-auto p-11"
        >
          <p className="m-0 mb-1 text-sm text-navy/85">
            Memoria de {shown.author || "anónimo"}:
          </p>
          <p className="m-0 font-bold text-navy">
            {shown.title || "Sin título"}
          </p>
        </div>
      </div>
    </div>
  );
}
