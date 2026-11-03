/**
 * PUBLIC API GATEWAY — DOMAIN BANNERS
 * Mengikuti aturan AGENTS.md: Hanya diekspor melalui index.ts
 */

export type { BannerItem, BannerDisplayMode, BannerLinkType } from './types';

export { useBannersQuery, fetchBanners, BANNERS_QUERY_KEY } from './api/useBannersQuery';

export { HeroBannerCarousel } from './components/HeroBannerCarousel';
export {
  HeroBannerEmptyState,
  type HeroBannerEmptyStateProps,
} from './components/HeroBannerEmptyState';

export { bannersHandlers } from './mocks';
