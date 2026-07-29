export type MediaType = 'movie' | 'tv';

export interface MediaRef {
  media_type: MediaType;
  media_id: number;
}

export interface ReviewRecord {
  id: number;
  media_type: MediaType;
  media_id: number;
  rating: number;
  comment: string | null;
  created_at: Date;
  updated_at: Date;
}

// Dipakai internal untuk pemeriksaan kepemilikan
export interface ReviewOwnerRecord extends ReviewRecord {
  user_id: number;
}

export interface CreateReviewPayload {
  media_type: MediaType;
  media_id: number;
  rating: number;
  comment: string | null;
}

export interface RatingSummary {
  media_type: MediaType;
  media_id: number;
  average_rating: number | null;
  review_count: number;
}

// Tepat lima field identitas publik (Req 7.2, 7.8)
export interface ReviewListItem {
  username: string;
  rating: number;
  comment: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ReviewListParams extends MediaRef {
  limit: number;
  offset: number;
}

export interface ReviewListResult {
  items: ReviewListItem[];
  total: number;
  limit: number;
  offset: number;
}
