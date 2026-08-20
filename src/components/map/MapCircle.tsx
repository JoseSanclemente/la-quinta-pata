import { memo, useState } from "react";
import type { CSSProperties } from "react";
import chairUrl from "@/assets/chair/pink_chair.webp";
import type { Circle } from "@/lib/types";

type Props = {
  circle: Circle;
  dropped: Set<string>;
  onSelect: (circle: Circle) => void;
};

function MapCircle({ circle, dropped, onSelect }: Props) {
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

export default memo(MapCircle);
