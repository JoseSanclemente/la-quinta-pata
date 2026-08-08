// ============================================================
//  5. Realtime — show circles others create, live
// ============================================================
import { db } from "../lib/supabase.client";
import { allCircles } from "./state";
import { updateVisible } from "./circles";
import type { Circle } from "../lib/types";

export function initRealtime() {
  const channel = db
    .channel("circles-changes")
    .on<Circle>(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "circles" },
      (payload) => {
        if (allCircles.some((c) => c.id === payload.new.id)) return; // dedupe own insert
        allCircles.push(payload.new);
        updateVisible(); // mounts (+ animates) only if currently in view
      },
    )
    .subscribe();

  window.addEventListener("beforeunload", () => {
    db.removeChannel(channel);
  });
}
