import { createClient } from "@supabase/supabase-js";
import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from "astro:env/client";
import { SUPABASE_SERVICE_KEY } from "astro:env/server";
import type { Circle } from "./types";

// Server-side client, used for the SSR read on page load. Prefers the service
// key when one is configured; otherwise the public key works, since `circles`
// is world-readable via RLS.
const db = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY || PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

/**
 * Fetch every circle. Fails soft: on error we log and return an empty list so
 * the page still renders and realtime keeps working.
 */
export async function fetchCircles(): Promise<Circle[]> {
  const { data, error } = await db.from("circles").select("*");
  if (error) {
    console.error("[la-silla] SSR circle fetch failed:", error.message);
    return [];
  }
  return (data ?? []) as Circle[];
}
