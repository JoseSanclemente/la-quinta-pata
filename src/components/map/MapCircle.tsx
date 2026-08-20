import { memo, useState } from "react";
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
      className={dropping ? "circle dropping" : "circle"}
      style={{ left: `${circle.x}%`, top: `${circle.y}%`, background: circle.color }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(circle);
      }}
      onAnimationEnd={() => setDropping(false)}
    />
  );
}

export default memo(MapCircle);
