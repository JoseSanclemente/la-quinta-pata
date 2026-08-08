export type MediaType = "text" | "image" | "video";

/** One row of the `circles` table (see supabase-setup.sql). */
export interface Circle {
  id: string;
  /** 0-100, percent of the map image width. */
  x: number;
  /** 0-100, percent of the map image height. */
  y: number;
  color: string;
  media_type: MediaType;
  media_url: string | null;
  text_content: string | null;
  created_at: string;
}

/** What we send on insert — the DB fills id and created_at. */
export type NewCircle = Omit<Circle, "id" | "created_at">;
