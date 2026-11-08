export interface Env {
  DB: D1Database;
  API_KEY?: string;
  ENVIRONMENT?: string;
}

export interface UrlRecord {
  slug: string;
  target_url: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
  created_at: number;
  created_by: string;
}

export interface ShortenRequest {
  url: string;
  custom_slug?: string;
  title?: string;
  description?: string;
  image_url?: string;
}

export interface ShortenResponse {
  success: boolean;
  slug: string;
  short_url: string;
  target_url: string;
  metadata: {
    title: string | null;
    description: string | null;
    image_url: string | null;
  };
}

export interface ExtractedMetadata {
  title: string | null;
  description: string | null;
  image_url: string | null;
}
