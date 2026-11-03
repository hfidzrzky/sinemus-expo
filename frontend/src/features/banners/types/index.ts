/**
 * Banner Feature Types
 * Sinkron 100% dengan contracts/banners.contract.json
 */

export type BannerDisplayMode =
  'spotlight' | 'rich_content' | 'image_only' | 'movie_spotlight' | 'sorotan';
export type BannerLinkType = 'movie' | 'event' | 'voucher' | 'url';

export interface BannerItem {
  id: number;
  title: string | null;
  subtitle: string | null;
  badge_text: string | null;
  age_rating?: string | null;
  genre?: string | null;
  release_year?: number | null;
  duration_minutes?: number | null;
  image_url: string;
  display_mode: BannerDisplayMode;
  link_type: BannerLinkType;
  movie_slug?: string | null;
  event_slug?: string | null;
  target_url?: string | null;
  button_text?: string | null;
  order_priority: number;
}
