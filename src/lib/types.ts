export type MediaType = "text" | "image" | "video";

export interface Chair {
  id: string;
  x: number;
  y: number;
  color: string;
  media_type: MediaType;
  media_url: string | null;
  text_content: string | null;
  title: string | null;
  author: string | null;
  created_at: string;
}

export type NewChair = Omit<Chair, "id" | "created_at">;
