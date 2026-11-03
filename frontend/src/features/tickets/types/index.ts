/**
 * Tickets & Access Domain Types
 * Sinkron 100% dengan contracts/tickets.contract.json
 */

export type EventType = 'regular';

export type TicketPaymentStatus = 'pending' | 'paid' | 'expired' | 'failed' | 'cancelled';

export type TicketCheckinStatus = 'pending' | 'checked_in';

export type CinemaFulfillmentStatus =
  'unfulfilled' | 'awaiting_cinema_ticket' | 'fulfilled' | 'cancelled';

export interface CinemaTicketData {
  booking_code: string;
  passcode: string;
  qr_image_url: string | null;
  notes: string | null;
  fulfilled_at?: string | null;
}

export interface TicketItem {
  id: number;
  order_id: string;
  event_type: EventType;
  ticket_code: string | null;
  qr_hash: string | null;
  event_title: string;
  poster_url: string;
  venue_name: string;
  city: string;
  show_time: string; // ISO date-time string
  seat_codes: string[];
  payment_status: TicketPaymentStatus;
  checkin_status?: TicketCheckinStatus;
  fulfillment_status?: CinemaFulfillmentStatus | null;
  cinema_ticket?: CinemaTicketData | null;
  gross_amount?: number | null;
  net_amount?: number | null;
  snap_token?: string | null;
  expires_at?: string | null;
  is_upcoming: boolean;
}

export interface TicketDetail {
  id: number;
  order_id: string;
  event_type: EventType;
  ticket_code: string | null;
  qr_hash: string | null;
  buyer_name: string;
  buyer_phone: string;
  event_title: string;
  poster_url: string;
  venue_name: string;
  venue_address: string;
  city: string;
  show_time: string; // ISO date-time string
  seat_codes: string[];
  paid_amount: number;
  formatted_paid_amount: string;
  paid_at: string; // ISO date-time string
  checkin_status?: TicketCheckinStatus;
  checkin_at?: string | null;
  fulfillment_status?: CinemaFulfillmentStatus | null;
  cinema_ticket?: CinemaTicketData | null;
}

export interface MyFilmRentalItem {
  movie_id: number;
  slug: string;
  title: string;
  poster_url: string;
  genre: string;
  duration_minutes: number;
  rental_expires_at: string; // ISO date-time string
  remaining_seconds: number;
  is_expired: boolean;
}

export type TicketFilterStatus = 'upcoming' | 'past' | 'all' | 'pending';
