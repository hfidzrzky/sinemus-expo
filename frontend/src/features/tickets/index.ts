/**
 * PUBLIC API GATEWAY — DOMAIN TICKETS & ACCESS
 * Seluruh impor lintas domain wajib melalui gateway ini.
 */

export type {
  TicketItem,
  TicketDetail,
  MyFilmRentalItem,
  TicketFilterStatus,
  EventType,
  TicketPaymentStatus,
  TicketCheckinStatus,
  CinemaFulfillmentStatus,
  CinemaTicketData,
} from './types';

export { useMyTicketsQuery, fetchMyTickets, MY_TICKETS_QUERY_KEY } from './api/useMyTicketsQuery';

export {
  useTicketDetailQuery,
  fetchTicketDetail,
  TICKET_DETAIL_QUERY_KEY,
} from './api/useTicketDetailQuery';

export { useMyFilmsQuery, fetchMyFilms, MY_FILMS_QUERY_KEY } from './api/useMyFilmsQuery';
export { useDownloadTicketPdf } from './hooks/useDownloadTicketPdf';
export {
  useTicketsAndFilmsCount,
  type TicketsAndFilmsCount,
} from './hooks/useTicketsAndFilmsCount';

export { TicketCard, type TicketCardProps } from './components/TicketCard';
export { RegularTicketCard, type RegularTicketCardProps } from './components/RegularTicketCard';
export {
  TicketHighBrightnessModal,
  type TicketHighBrightnessModalProps,
} from './components/TicketHighBrightnessModal';
export {
  RegularTicketQrModal,
  type RegularTicketQrModalProps,
} from './components/RegularTicketQrModal';
export {
  PendingPaymentBanner,
  type PendingPaymentBannerProps,
} from './components/PendingPaymentBanner';
export { FilmRentalCard, type FilmRentalCardProps } from './components/FilmRentalCard';

export { mockTicketItems, mockTicketDetails, mockFilmRentals, ticketsHandlers } from './mocks';
