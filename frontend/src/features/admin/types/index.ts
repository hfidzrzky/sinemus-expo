import type {
  EventType,
  SeatingType,
  SeatType,
  SeatStatus,
  EventVenueItem,
} from '@/features/events';
import type { UserRole } from '@/features/auth';

export type { UserRole, EventVenueItem };

// ---------------------------------------------------------------------------
// 1. Dashboard & Analitik Types
// ---------------------------------------------------------------------------
export type DashboardPeriod = 'today' | '7d' | '30d' | 'year' | 'custom';

export type DashboardMetricType = 'revenue' | 'event_tickets' | 'film_tickets';

export interface RevenueTrendDataPoint {
  date: string;
  label: string;
  cinema_ticket_revenue: number;
  vod_rental_revenue: number;
  total_revenue: number;
  cinema_tickets_sold?: number;
  vod_rentals_sold?: number;
}

export interface AdminDashboardStats {
  total_revenue: number;
  formatted_total_revenue: string;
  total_tickets_sold: number;
  active_movies_count: number;
  upcoming_events_count: number;
  presale_pending_count: number;
  average_occupancy_rate: number;
  total_active_vod_rentals: number;
  revenue_trends?: RevenueTrendDataPoint[];
  recent_orders?: AdminOrderItem[];
}

// ---------------------------------------------------------------------------
// 2. Event & Screening Management Types
// ---------------------------------------------------------------------------
export interface AdminScheduleItem {
  id: number;
  event_id: number;
  event_venue_id?: number | null;
  venue?: EventVenueItem | null;
  show_time: string;
  ticket_price: number;
  formatted_ticket_price: string;
  vip_ticket_price?: number | null;
  formatted_vip_ticket_price?: string | null;
  total_seats: number;
  available_seats_count: number;
  booked_seats_count: number;
  locked_seats_count?: number;
  checked_in_count?: number;
  booked_count?: number;
  studio_name?: string;
  max_tickets_per_order?: number;
  is_seat_map_locked?: boolean;
  locked_reason?: string | null;
  paid_seat_codes?: string[];
  seat_map_config?: BackendSeatMapConfig | null;
}

export interface BackendSeatMapConfig {
  rows: number;
  columns: number;
  vip_seats: string[];
  disabled_seats: string[];
  aisle_seats: string[];
  total_capacity?: number;
}

export interface AdminSeatConfig {
  id: number;
  row_label: string;
  seat_number: number;
  seat_code: string;
  status: SeatStatus;
  seat_type: SeatType;
}

export interface CastMember {
  actor: string;
  role?: string | null;
}

export type CastItem = string | CastMember;

export interface AdminEventItem {
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
  release_year?: number | null;
  age_rating?: 'SU' | '13+' | '17+' | '21+';
  cloudflare_teaser_uid: string | null;
  venue_name: string;
  venue_address: string;
  city: string;
  google_maps_url?: string;
  event_type: EventType;
  seating_type: SeatingType;
  cinema_partner?: string;
  target_screening_month?: string;
  presale_start_at?: string | null;
  presale_end_at?: string | null;
  sales_start_at?: string | null;
  sales_end_at?: string | null;
  event_concludes_at?: string | null;
  is_published: boolean;
  is_active?: boolean;
  is_featured: boolean;
  earliest_show_time?: string;
  starting_price?: number;
  formatted_starting_price?: string;
  total_capacity: number;
  total_booked: number;
  total_locked?: number;
  occupancy_rate: number;
  metrics?: {
    total_schedules: number;
    total_seats_capacity: number;
    total_tickets_sold: number;
    total_seats_locked?: number;
    occupancy_percentage: number;
    formatted_occupancy: string;
  };
  venues?: EventVenueItem[];
  schedules: AdminScheduleItem[];
  created_at: string;
}

export type EventFormTab = 'info' | 'venue' | 'schedules' | 'seatmap' | 'fulfillment';

export interface StudioSeatMapConfig {
  rows: number;
  columns: number;
  disabledSeats: string[];
  vipSeats: string[];
  aisleColumns: number[];
  aisleSeats?: string[];
  vipPriceSurcharge?: number;
  totalCapacity: number;
  isLocked?: boolean;
  lockedReason?: string | null;
  paidSeatCodes?: string[];
}

export interface ShowtimeSlotInput {
  id?: number;
  client_uid?: string;
  studio_name: string;
  show_time: string;
  ticket_price: number;
  vip_ticket_price?: number | null;
  total_seats: number;
  max_tickets_per_order?: number;
  is_seat_map_locked?: boolean;
  locked_reason?: string | null;
  paid_seat_codes?: string[];
  seat_map_config?: BackendSeatMapConfig;
}

export interface EventVenueFormInput {
  id?: number;
  client_uid?: string;
  venue_name: string;
  cinema_partner?: string;
  city: string;
  venue_address: string;
  google_maps_url?: string;
  schedules?: ShowtimeSlotInput[];
}

export interface CreateEventPayload {
  title: string;
  slug?: string;
  description: string;
  synopsis_short: string;
  poster_url: string | null;
  poster_path?: string | null;
  backdrop_url: string | null;
  backdrop_path?: string | null;
  director: string;
  cast: CastItem[];
  genre: string[];
  duration_minutes: number;
  release_year: number;
  age_rating: 'SU' | '13+' | '17+' | '21+';
  cloudflare_teaser_uid?: string | null;
  venue_name: string;
  venue_address: string;
  city: string;
  google_maps_url?: string;
  event_type: EventType;
  seating_type: SeatingType;
  cinema_partner?: string;
  target_screening_month?: string;
  presale_start_at?: string | null;
  presale_end_at?: string | null;
  sales_start_at?: string | null;
  sales_end_at?: string | null;
  event_concludes_at?: string | null;
  is_published?: boolean;
  is_active?: boolean;
  is_featured?: boolean;
  venues?: EventVenueFormInput[];
  schedules?: ShowtimeSlotInput[];
}

export type UpdateEventPayload = Partial<CreateEventPayload>;

export interface CreateSchedulePayload {
  show_time: string;
  ticket_price: number;
  total_seats: number;
  studio_name?: string;
  max_tickets_per_order?: number;
}

export interface GenerateSeatMapPayload {
  rows: number;
  columns: number;
  disabled_seats?: string[];
  vip_seats?: string[];
  aisle_columns?: number[];
}

// ---------------------------------------------------------------------------
// 3. Movie VoD & Entitlement Types
// ---------------------------------------------------------------------------
export interface AdminMovieItem {
  id: number;
  slug: string;
  title: string;
  synopsis: string;
  synopsis_short?: string;
  synopsis_full?: string;
  director: string;
  cast: CastItem[];
  genre: string[];
  release_year: number;
  duration_minutes: number;
  age_rating: 'SU' | '13+' | '17+' | '21+';
  poster_url: string;
  backdrop_url: string;
  look_films?: string[];
  cloudflare_video_uid: string;
  cloudflare_trailer_uid?: string | null;
  stream_status: 'ready' | 'processing' | 'error';
  access_model: 'rental' | 'free';
  rental_price: number;
  formatted_rental_price: string;
  active_rental_duration_hours: number;
  is_published: boolean;
  is_featured: boolean;
  active_rentals_count: number;
  created_at: string;
}

export type MovieFormTab = 'metadata' | 'pricing' | 'media' | 'stream' | 'looks' | 'curation';

export interface CreateMoviePayload {
  title: string;
  slug?: string;
  synopsis: string;
  synopsis_short?: string;
  synopsis_full?: string;
  director: string;
  cast: CastItem[];
  genre: string[];
  release_year: number;
  duration_minutes: number;
  age_rating: 'SU' | '13+' | '17+' | '21+';
  poster_url: string;
  backdrop_url: string;
  look_films?: string[];
  cloudflare_video_uid: string;
  cloudflare_trailer_uid?: string | null;
  access_model: 'rental' | 'free';
  rental_price: number;
  active_rental_duration_hours?: number;
  is_published?: boolean;
  is_featured?: boolean;
}

export type UpdateMoviePayload = Partial<CreateMoviePayload>;

export interface AdminMovieAccessItem {
  id: number;
  user_id: number;
  user_email: string;
  user_name: string;
  movie_id: number;
  movie_title: string;
  rental_expires_at: string;
  access_status: 'active' | 'revoked' | 'expired';
  granted_by_admin_name?: string;
  admin_notes?: string | null;
  created_at: string;
}

export interface GrantMovieAccessPayload {
  user_id: number;
  movie_id: number;
  duration_hours: number;
  admin_notes?: string | null;
}

export interface GrantMovieAccessResponse {
  access_id: number;
  user_email: string;
  movie_title: string;
  rental_expires_at: string;
  access_status: 'active';
}

export interface RevokeMovieAccessPayload {
  revoke_reason: 'refund' | 'violation' | 'system_error' | 'manual_admin';
  admin_notes?: string | null;
}

// ---------------------------------------------------------------------------
// 4. Order & Financial Audit Types
// ---------------------------------------------------------------------------
export interface AdminOrderItem {
  order_id: string;
  order_type: 'ticket' | 'movie_rental';
  user_email: string;
  user_name: string;
  user_phone?: string;
  buyer_name?: string;
  buyer_email?: string;
  item_title: string;
  gross_amount: number;
  discount_amount: number;
  net_amount: number;
  payment_status: 'pending' | 'paid' | 'expired' | 'failed';
  payment_type?: string;
  paid_at: string | null;
  created_at: string;
  seat_codes?: string[];
  venue_name?: string;
  show_time?: string;
  fulfillment_status?: 'unfulfilled' | 'awaiting_cinema_ticket' | 'fulfilled' | 'cancelled';
  cinema_booking_code?: string;
  cinema_passcode?: string;
  cinema_qr_image_path?: string;
}

export interface AdminOrderBuyerSnapshot {
  user_id: number;
  name: string;
  email: string;
  phone_number?: string | null;
  is_phone_locked?: boolean;
  birth_date?: string | null;
}

export interface AdminOrderItemDetailsSnapshot {
  event_id?: number | null;
  event_title?: string;
  venue_name?: string;
  venue_address?: string;
  city?: string;
  cinema_partner?: string | null;
  studio_name?: string;
  show_time?: string | null;
  ticket_code?: string | null;
  ticket_quantity?: number;
  qr_hash?: string | null;
  seats?: string[];
  checkin_status?: string;
  checkin_at?: string | null;
  fulfillment_status?: string;
  cinema_booking_code?: string | null;
  cinema_passcode?: string | null;
  cinema_qr_image_url?: string | null;
  cinema_ticket_notes?: string | null;
  fulfilled_at?: string | null;
  fulfilled_by_admin?: { id: number; name: string; email: string } | null;
  movie_id?: number;
  movie_title?: string;
  duration_minutes?: number | null;
  poster_url?: string | null;
  access_status?: string;
  rental_start_at?: string | null;
  rental_expires_at?: string | null;
}

export interface AdminOrderFinancialsSnapshot {
  gross_amount: number;
  discount_amount: number;
  net_amount: number;
  formatted_gross_amount?: string;
  formatted_discount_amount?: string;
  formatted_net_amount?: string;
  voucher?: {
    id: number;
    code: string;
    discount_type: string;
    discount_value: number;
  } | null;
}

export interface AdminOrderAuditLogsSnapshot {
  payment_gateway?: string;
  payment_type?: string | null;
  snap_token?: string | null;
  checkin_history?: Array<{
    scanned_by: string;
    scanned_at: string;
    device_info?: string | null;
  }>;
}

export interface AdminOrderDetail extends AdminOrderItem {
  user_birth_date?: string | null;
  is_phone_locked?: boolean;
  midtrans_transaction_id?: string;
  voucher_code?: string | null;
  ticket_quantity?: number;
  unit_price?: number;
  checkin_status?: 'checked_in' | 'not_checked_in' | 'pending' | string;
  checkin_time?: string | null;
  cinema_ticket_notes?: string | null;
  access_duration_hours?: number;
  access_status?: 'active' | 'expired' | 'inactive' | string;
  snap_token?: string | null;

  // Domain Snapshot sub-objects (sinkron dengan response Laravel Resource)
  buyer?: AdminOrderBuyerSnapshot;
  item_details?: AdminOrderItemDetailsSnapshot;
  financials?: AdminOrderFinancialsSnapshot;
  audit_logs?: AdminOrderAuditLogsSnapshot;
}

export interface AdminOrdersFilterParams {
  type?: 'all' | 'ticket' | 'movie_rental';
  status?: 'all' | 'pending' | 'paid' | 'expired' | 'failed';
  search?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  per_page?: number;
}

export interface ResendNotificationPayload {
  channel?: 'all' | 'email' | 'whatsapp';
}

export interface ResendNotificationResponse {
  order_id: string;
  channel: string;
  sent_to: {
    email?: string;
    phone?: string;
  };
  sent_at: string;
}

// ---------------------------------------------------------------------------
// 5. Voucher & Promo Code Types
// ---------------------------------------------------------------------------
export type PromoType = 'direct_discount' | 'voucher_code';

export interface AdminVoucherItem {
  id: number;
  promo_type?: PromoType;
  name?: string | null;
  code: string;
  max_uses_per_user?: number | null;
  discount_type: 'percentage' | 'fixed_amount' | 'fixed' | 'slashed_price';
  discount_value: number;
  max_discount_amount?: number | null;
  max_discount?: number | null;
  min_transaction_amount?: number;
  min_purchase?: number;
  target_item?: 'all' | 'tickets_only' | 'vod_only';
  item_type?: 'all' | 'ticket' | 'movie_rental';
  item_type_label?: string;
  scope_type?: 'all' | 'event' | 'movie' | 'tickets_only' | 'vod_only';
  event_id?: number | null;
  event_title?: string | null;
  movie_id?: number | null;
  movie_title?: string | null;
  quota?: number;
  quota_total?: number;
  used_quota?: number;
  quota_used?: number;
  quota_remaining?: number;
  usage_percentage?: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  status?: string;
  formatted_discount?: string;
  formatted_min_purchase?: string;
  formatted_max_discount?: string | null;
}

export interface CreateVoucherPayload {
  code?: string;
  promo_type?: PromoType;
  name?: string | null;
  max_uses_per_user?: number | null;
  discount_type: 'percentage' | 'fixed_amount' | 'slashed_price';
  discount_value: number;
  max_discount_amount?: number | null;
  min_transaction_amount?: number;
  target_item: 'all' | 'tickets_only' | 'vod_only';
  scope_type?: 'all' | 'event' | 'movie' | 'tickets_only' | 'vod_only';
  event_id?: number | null;
  movie_id?: number | null;
  quota?: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
}

export type UpdateVoucherPayload = Partial<CreateVoucherPayload>;

export type AdminBannerDisplayMode =
  'spotlight' | 'rich_content' | 'image_only' | 'movie_spotlight' | 'sorotan';

export interface AdminBannerItem {
  id: number;
  title: string;
  subtitle: string;
  badge_text: string | null;
  age_rating?: string | null;
  genre?: string | null;
  release_year?: number | null;
  duration_minutes?: number | null;
  image_url: string;
  display_mode: AdminBannerDisplayMode;
  link_type: 'event' | 'movie' | 'url';
  target_identifier?: string;
  movie_id?: number | null;
  movie_slug?: string | null;
  movie_title?: string | null;
  event_id?: number | null;
  event_slug?: string | null;
  event_title?: string | null;
  target_url?: string | null;
  button_text: string;
  order_priority: number;
  is_active: boolean;
}

export interface CreateBannerPayload {
  title: string;
  subtitle: string;
  badge_text: string | null;
  age_rating?: string | null;
  genre?: string | null;
  release_year?: number | null;
  duration_minutes?: number | null;
  image_url: string;
  display_mode: AdminBannerDisplayMode;
  link_type: 'event' | 'movie' | 'url';
  target_identifier?: string;
  movie_id?: number | null;
  event_id?: number | null;
  target_url?: string | null;
  button_text: string;
  order_priority: number;
  is_active: boolean;
}

export type UpdateBannerPayload = Partial<CreateBannerPayload>;

export interface ReorderBannersPayload {
  items?: Array<{ id: number; order_priority: number }>;
  banner_ids?: number[];
}

// ---------------------------------------------------------------------------
// 7. Users & Access Management Types
// ---------------------------------------------------------------------------
export interface AdminUsersSummary {
  total_users: number;
  super_admin_count: number;
  locked_phone_count: number;
  customer_count: number;
}

export interface AdminUserListItem {
  id: number;
  name: string;
  email: string;
  avatar_url?: string | null;
  role: UserRole;
  phone_number: string | null;
  is_phone_locked: boolean;
  birth_date: string | null;
  age?: number | null;
  is_profile_completed?: boolean;
  paid_ticket_orders_count?: number;
  paid_movie_orders_count?: number;
  total_paid_transactions?: number;
  total_orders_count: number;
  last_login_at?: string | null;
  created_at: string;
}

export interface AdminUserRecentTicket {
  id: number;
  order_id: string;
  event_title: string;
  event_slug?: string;
  ticket_code: string | null;
  ticket_quantity: number;
  gross_amount: number;
  net_amount: number;
  payment_status: 'pending' | 'paid' | 'expired' | 'failed' | string;
  checkin_status: string;
  paid_at: string | null;
  created_at: string;
}

export interface AdminUserRecentMovie {
  id: number;
  order_id: string;
  movie_title: string;
  movie_slug?: string;
  gross_amount: number;
  net_amount: number;
  payment_status: 'pending' | 'paid' | 'expired' | 'failed' | string;
  paid_at: string | null;
  created_at: string;
}

export interface AdminUserActiveMovieAccess {
  id: number;
  movie_id: number;
  movie_title: string;
  movie_slug?: string;
  rental_start_at: string;
  rental_expires_at: string;
  remaining_hours: number;
  access_status: string;
}

export interface AdminUserRecentOrder {
  order_id: string;
  order_type: 'ticket' | 'movie_rental';
  item_title: string;
  net_amount: number;
  payment_status: 'pending' | 'paid' | 'expired' | 'failed' | string;
  created_at: string;
}

export interface AdminUserDetail extends AdminUserListItem {
  google_id_masked?: string | null;
  recent_orders: AdminUserRecentOrder[];
  recent_ticket_transactions: AdminUserRecentTicket[];
  recent_movie_transactions: AdminUserRecentMovie[];
  active_movie_access: AdminUserActiveMovieAccess[];
  updated_at?: string;
}

export interface AdminUsersFilterParams {
  search?: string;
  role?: 'all' | 'customer' | 'super_admin';
  phone_locked?: 'all' | 'locked' | 'unlocked';
  is_phone_locked?: boolean;
  page?: number;
  per_page?: number;
}

export interface UpdateUserRolePayload {
  role: UserRole;
  admin_notes?: string;
}

// ---------------------------------------------------------------------------
// 8. Mobile QR Scanner Types
// ---------------------------------------------------------------------------
export interface TicketValidationPayload {
  qr_hash: string;
  device_info: string;
}

export interface TicketValidationResponse {
  ticket_code: string;
  event_title: string;
  buyer_name: string;
  seating_type: SeatingType;
  ticket_quantity: number;
  seat_codes: string[] | null;
  checkin_status: 'checked_in';
  scanned_at: string;
  venue_name?: string;
  studio_name?: string;
}

export type ScannerResultStatus = 'idle' | 'success' | 'duplicate' | 'wrong_session' | 'invalid';

export interface ScannerScanResult {
  status: ScannerResultStatus;
  message: string;
  ticket?: TicketValidationResponse;
  rawHash?: string;
  timestamp: string;
  duplicateInfo?: {
    scannedAt?: string;
    gatekeeper?: string;
  };
}

// ---------------------------------------------------------------------------
// 9. Presale Ingestion & Fulfillment Types
// ---------------------------------------------------------------------------
export interface IngestTargetContext {
  eventTitle: string;
  venueName: string;
  studioName: string;
  showTimeStr: string;
}

export interface AdminFulfillmentOrder {
  id: number;
  transaction_id: number;
  order_id: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  event_title: string;
  schedule_show_time: string;
  event_venue_id?: number | null;
  venue_name: string;
  studio_name?: string;
  ticket_quantity: number;
  seats: string[];
  gross_amount: number;
  discount_amount: number;
  net_amount: number;
  payment_status: 'paid' | 'pending' | 'expired' | 'failed';
  fulfillment_status: 'unfulfilled' | 'awaiting_cinema_ticket' | 'fulfilled' | 'cancelled';
  cinema_booking_code?: string | null;
  cinema_passcode?: string | null;
  cinema_qr_image_path?: string | null;
  cinema_ticket_notes?: string | null;
  fulfilled_at?: string | null;
  created_at: string;
}

export interface SmartIngestMatchedItem {
  transaction_id: number;
  order_id: string;
  user_name: string;
  seats: string[];
  detected_booking_code: string;
  detected_passcode: string;
  r2_qr_path: string;
  r2_preview_url: string;
  qr_source?: 'original_pdf' | 'generated_fallback';
  match_status: 'exact_match' | 'manual_override';
  notes?: string;
}

export interface SmartIngestUnmatchedItem {
  transaction_id?: number;
  order_id?: string;
  user_name?: string;
  detected_seats: string[];
  detected_booking_code: string;
  detected_passcode?: string;
  r2_qr_path: string;
  r2_preview_url: string;
  qr_source?: 'original_pdf' | 'generated_fallback';
  match_status:
    | 'unmatched_seat'
    | 'rejected_foreign_movie'
    | 'rejected_mismatched_studio'
    | 'rejected_mismatched_time'
    | 'rejected_missing_passcode'
    | 'already_fulfilled'
    | string;
  unmatched_reason?: string;
  can_manual_fulfill?: boolean;
}

export interface SmartIngestPreviewResponse {
  total_detected: number;
  matched_count: number;
  unmatched_count: number;
  matched_items: SmartIngestMatchedItem[];
  unmatched_items: SmartIngestUnmatchedItem[];
}

export interface SmartIngestConfirmPayload {
  approved_items: Array<{
    transaction_id: number;
    detected_booking_code: string;
    detected_passcode: string;
    r2_qr_path: string;
    notes?: string | null;
  }>;
  send_notification: boolean;
}

export interface SmartIngestConfirmResponse {
  fulfilled_count: number;
  dispatched_notifications_count: number;
}

export interface SingleTicketInjectPayload {
  cinema_booking_code: string;
  cinema_passcode: string;
  qr_image?: File | string | null;
  notes?: string;
  send_notification: boolean;
  allow_update?: boolean;
}

export interface SingleTicketInjectResponse {
  order_id: string;
  fulfillment_status: 'fulfilled';
  cinema_booking_code: string;
  cinema_passcode: string;
  qr_image_url: string | null;
  notes: string | null;
  fulfilled_at: string;
}

export interface BulkInjectTicketsPayload {
  csv_file: File;
  assets_zip?: File | null;
  send_notification?: boolean;
}

export interface BulkInjectTicketsResponse {
  job_id: string;
  status: 'processing' | 'completed';
  total_records_queued: number;
}

// ---------------------------------------------------------------------------
// 9. Cloudflare Media Integration Types
// ---------------------------------------------------------------------------
export interface StreamVideoMetadata {
  uid: string;
  status: 'ready' | 'queued' | 'inprogress' | 'error' | string;
  is_ready: boolean;
  duration_seconds: number;
  formatted_duration: string;
  require_signed_urls?: boolean;
  preview_token?: string | null;
  thumbnail_url: string;
  preview_iframe_url: string;
  playback_hls_url?: string;
  meta?: {
    width?: number;
    height?: number;
    size_bytes?: number;
  };
  created_at?: string;
}

export interface VerifyStreamUidPayload {
  uid: string;
}

export interface CloudflareDirectUploadResponse {
  image_id: string;
  upload_url: string;
  delivery_url: string;
}

export * from './settings.types';
