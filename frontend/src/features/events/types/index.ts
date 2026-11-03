import type { PaginationMeta } from '@/types/api';

/**
 * Events Feature Types
 * Sinkron 100% dengan contracts/events.contract.json & Spesifikasi Sinemus Screen (Expo Edition)
 */

export type EventType = 'regular' | 'presale_cinema';
export type SeatingType = 'assigned_seating' | 'general_admission';
export type SeatStatus = 'available' | 'locked' | 'booked' | 'disabled';
export type SeatType = 'standard' | 'vip' | 'aisle';
export type AgeRating = 'SU' | '13+' | '17+' | '21+';

export interface EventSummary {
  id: number;
  slug: string;
  title: string;
  poster_url: string;
  backdrop_url?: string;
  venue_name: string;
  city: string;
  earliest_show_time: string;
  starting_price: number;
  formatted_starting_price: string;
  original_starting_price?: number | null;
  formatted_original_starting_price?: string | null;
  event_type?: EventType;
  seating_type?: SeatingType;
  cinema_partner?: string;
  presale_start_at?: string | null;
  presale_end_at?: string | null;
  sales_start_at?: string | null;
  sales_end_at?: string | null;
  event_concludes_at?: string | null;
  remaining_seats_count?: number;
  total_schedules_count?: number;
  is_featured?: boolean;
  genre?: string[];
  duration_minutes?: number;
  release_year?: number;
  age_rating?: AgeRating;
}

export interface EventVenueItem {
  id: number;
  event_id: number;
  venue_name: string;
  cinema_partner?: string | null;
  venue_address: string;
  city: string;
  google_maps_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ScheduleItem {
  id: number;
  event_venue_id?: number | null;
  venue?: EventVenueItem | null;
  show_time: string;
  ticket_price: number;
  formatted_ticket_price: string;
  original_ticket_price?: number | null;
  formatted_original_ticket_price?: string | null;
  vip_ticket_price?: number | null;
  formatted_vip_ticket_price?: string | null;
  available_seats_count: number;
  total_seats: number;
  studio_name?: string;
}

export interface CastMember {
  actor: string;
  role?: string | null;
}

export type CastItem = string | CastMember;

export interface EventDetail {
  id: number;
  slug: string;
  title: string;
  description: string;
  synopsis_short: string;
  poster_url: string;
  backdrop_url: string;
  director: string;
  cast: CastItem[];
  genre?: string[];
  duration_minutes?: number;
  release_year?: number;
  age_rating?: AgeRating;
  cloudflare_teaser_uid: string | null;
  cloudflare_teaser_token?: string | null;
  cloudflare_teaser_iframe_url?: string | null;
  cloudflare_teaser_playback_url?: string | null;
  venue_name: string;
  venue_address: string;
  city: string;
  event_type: EventType;
  seating_type: SeatingType;
  cinema_partner?: string | null;
  presale_start_at?: string | null;
  presale_end_at?: string | null;
  sales_start_at?: string | null;
  sales_end_at?: string | null;
  event_concludes_at?: string | null;
  venues?: EventVenueItem[];
  schedules: ScheduleItem[];
  is_featured?: boolean;
}

export interface SeatItem {
  id: number;
  row_label: string;
  grid_column?: number;
  seat_number: number;
  seat_code: string;
  status: SeatStatus;
  seat_type: SeatType;
}

export interface ScheduleSeatMap {
  schedule_id: number;
  rows: string[];
  cols: number;
  ticket_price: number;
  formatted_ticket_price?: string;
  vip_ticket_price?: number | null;
  formatted_vip_ticket_price?: string | null;
  seats: SeatItem[];
}

export interface EventFilterParams {
  city?: string;
  event_type?: EventType | 'all';
  search?: string;
  page?: number;
}

export interface EventFormatItem {
  value: EventType;
  label: string;
  total_events: number;
}

export interface EventsPaginationMeta extends PaginationMeta {
  available_cities?: string[];
  available_formats?: EventFormatItem[];
}

export interface PaginatedEventsResult {
  events: EventSummary[];
  meta: EventsPaginationMeta;
}
