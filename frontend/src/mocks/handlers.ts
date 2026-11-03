import { authHandlers } from '@/features/auth';
import { bannersHandlers } from '@/features/banners';
import { eventsHandlers } from '@/features/events';
import { moviesHandlers } from '@/features/movies';
import { checkoutHandlers } from '@/features/checkout';
import { ticketsHandlers } from '@/features/tickets';
import { adminHandlers } from '@/features/admin';

/**
 * Root MSW Request Handlers Aggregator
 * Mengumpulkan seluruh request handlers resmi dari public gateway setiap domain fitur.
 * Mematuhi prinsip Zero-UI Coupling & Feature-Driven Architecture.
 */
export const handlers = [
  ...authHandlers,
  ...bannersHandlers,
  ...eventsHandlers,
  ...moviesHandlers,
  ...checkoutHandlers,
  ...ticketsHandlers,
  ...adminHandlers,
];
