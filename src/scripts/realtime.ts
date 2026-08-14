import { db } from "@/lib/supabase.client";
import { allCircles } from "@/scripts/state";
import { updateVisible } from "@/scripts/circles";
import type { Circle } from "@/lib/types";

export function initRealtime() {
  const channel = db
    .channel("circles-changes")
    .on<Circle>(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "circles" },
      (payload) => {
        if (allCircles.some((c) => c.id === payload.new.id)) return;
        allCircles.push(payload.new);
        updateVisible();
      },
    )
    .subscribe();

  window.addEventListener("beforeunload", () => {
    db.removeChannel(channel);
  });
}
