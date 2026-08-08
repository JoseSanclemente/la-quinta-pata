import { createClient } from "@supabase/supabase-js";
import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from "astro:env/client";
import type { Circle, NewCircle } from "./types";

/**
 * Browser client. Named `db` for continuity with the original app — but the
 * CDN-global clash is gone now that supabase-js is a real dependency.
 */
export const db = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

const MEDIA_BUCKET = "media";

/** Upload a file to the public `media` bucket and return its public URL. */
export async function uploadMedia(file: File): Promise<string> {
  const path = `${Date.now()}-${file.name}`;
  const { error } = await db.storage.from(MEDIA_BUCKET).upload(path, file);
  if (error) throw error;
  const { data } = db.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Insert a circle and return the stored row. */
export async function insertCircle(circle: NewCircle): Promise<Circle> {
  const { data, error } = await db.from("circles").insert(circle).select().single();
  if (error) throw error;
  return data as Circle;
}
