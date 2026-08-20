import { memo, useState } from "react";
import type { CSSProperties } from "react";
import chairUrl from "@/assets/chair/pink_chair.webp";
import type { Circle } from "@/lib/types";

type Props = {
  circle: Circle;
  dropped: Set<string>;
  onSelect: (circle: Circle) => void;
  onHover: (circle: Circle | null) => void;
};

function hashId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash += id.charCodeAt(i) * (i + 1);
  return hash;
}

function MapCircle({ circle, dropped, onSelect, onHover }: Props) {
  const [dropping, setDropping] = useState(() => {
    if (dropped.has(circle.id)) return false;
    dropped.add(circle.id);
    return true;
  });

  return (
    <div
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
      onMouseEnter={() => onHover(circle)}
      onMouseLeave={() => onHover(null)}
      onAnimationEnd={() => setDropping(false)}
    />
  );
}

export default memo(MapCircle);
