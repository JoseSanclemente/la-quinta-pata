import { createClient } from "@supabase/supabase-js";
import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from "astro:env/client";
import { SUPABASE_SERVICE_KEY } from "astro:env/server";
import type { Circle } from "@/lib/types";

const db = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY || PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

export async function fetchCircles(): Promise<Circle[]> {
  const { data, error } = await db.from("circles").select("*");
  if (error) {
    console.error("[la-silla] SSR circle fetch failed:", error.message);
    return [];
  }
  return (data ?? []) as Circle[];
}
