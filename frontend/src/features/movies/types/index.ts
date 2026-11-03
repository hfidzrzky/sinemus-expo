/**
 * Movies Feature Types
 * Sinkron 100% dengan contracts/movies.contract.json & contracts/checkout.contract.json
 */

export type AgeRating = 'SU' | '13+' | '17+' | '21+';
export type AccessModel = 'rental' | 'free';
export type AccessStatus = 'locked' | 'active' | 'expired';

export interface MovieSummary {
  id: number;
  slug: string;
  title: string;
  synopsis_short: string;
  poster_url: string;
  genre: string;
  duration_minutes: number;
  price: number;
  formatted_price?: string;
  original_price?: number;
  is_featured: boolean;
  release_year: number;
  age_rating?: AgeRating;
  access_model?: AccessModel;
}

export interface CastMember {
  actor: string;
  role?: string | null;
  photo_url?: string | null;
}

export type CastItem = string | CastMember;

export interface MovieDetail {
  id: number;
  slug: string;
  title: string;
  synopsis: string;
  synopsis_short?: string;
  poster_url: string;
  backdrop_url: string;
  director: string;
  cast: CastItem[];
  genre: string;
  duration_minutes: number;
  price: number;
  formatted_price?: string;
  original_price?: number;
  rental_duration_hours: number;
  access_model: AccessModel;
  cloudflare_trailer_uid: string | null;
  access_status: AccessStatus;
  rental_expires_at: string | null;
  cloudflare_video_uid: string | null;
  look_films?: string[];
  age_rating?: AgeRating;
  release_year?: number;
  is_featured?: boolean;
  original_title?: string | null;
  tagline?: string | null;
  rating?: number | null;
}

export interface MovieFilterParams {
  genre?: string;
  search?: string;
  featured?: boolean;
  page?: number;
  per_page?: number;
}

export interface MovieRentalPayload {
  voucher_code?: string;
}

export interface MovieRentalResponse {
  order_id: string;
  snap_token: string;
  movie_title: string;
  gross_amount: number;
  discount_amount: number;
  net_amount: number;
  rental_duration_hours: number;
}

export interface MovieStreamAccess {
  playback_url: string;
  preview_iframe_url: string;
  signed_token: string;
  rental_expires_at: string | null;
  remaining_seconds: number;
  server_time?: string;
}
