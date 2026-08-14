export type MediaType = "text" | "image" | "video";

export interface Circle {
  id: string;
  x: number;
  y: number;
  color: string;
  media_type: MediaType;
  media_url: string | null;
  text_content: string | null;
  created_at: string;
}

export type NewCircle = Omit<Circle, "id" | "created_at">;
