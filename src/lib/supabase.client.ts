import { createClient } from "@supabase/supabase-js";
import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from "astro:env/client";
import type { Circle, NewCircle } from "@/lib/types";

export const db = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

const MEDIA_BUCKET = "media";

export async function uploadMedia(file: File): Promise<string> {
  const path = `${Date.now()}-${file.name}`;
  const { error } = await db.storage.from(MEDIA_BUCKET).upload(path, file);
  if (error) throw error;
  const { data } = db.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function insertCircle(circle: NewCircle): Promise<Circle> {
  const { data, error } = await db.from("circles").insert(circle).select().single();
  if (error) throw error;
  return data as Circle;
}
