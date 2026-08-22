import { memo, useState } from "react";
import type { CSSProperties } from "react";
import chairUrl from "@/assets/chair/pink_chair.webp";
import type { Chair } from "@/lib/types";

type Props = {
  circle: Chair;
  dropped: Set<string>;
  onSelect: (circle: Chair) => void;
};

function hashId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash += id.charCodeAt(i) * (i + 1);
  return hash;
}

function MapChair({ circle, dropped, onSelect }: Props) {
  const [dropping, setDropping] = useState(() => {
    if (dropped.has(circle.id)) return false;
    dropped.add(circle.id);
    return true;
  });

  return (
    <button
      type="button"
      aria-label={
        circle.title || `Memoria de ${circle.author || "anónimo"}`
      }
      className={dropping ? "circle dropping chair" : "circle chair"}
      style={
        {
          left: `${circle.x}%`,
          top: `${circle.y}%`,
          "--c": circle.color,
          "--chair-src": `url(${chairUrl.src})`,
          "--rot": hashId(circle.id) % 2 === 0 ? "-90deg" : "0deg",
          "--flip": hashId(circle.id) % 3 === 0 ? -1 : 1,
        } as CSSProperties
      }
      onClick={(e) => {
        e.stopPropagation();
        onSelect(circle);
      }}
      onAnimationEnd={() => setDropping(false)}
    />
  );
}

export default memo(MapChair);
