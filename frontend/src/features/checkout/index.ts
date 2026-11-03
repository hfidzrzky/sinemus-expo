/**
 * PUBLIC API GATEWAY — DOMAIN CHECKOUT & PAYMENT
 * Seluruh impor lintas domain wajib melalui gateway ini.
 */

export type {
  ReserveSeatsPayload,
  ReserveSeatsResponseData,
  ApplyVoucherPayload,
  ApplyVoucherResponseData,
  RentMoviePayload,
  RentMovieResponseData,
  PaymentStage,
  PaymentStatus,
  PaymentStatusResponseData,
  MidtransSnapResult,
  MidtransSnapCallbacks,
} from './types';

export {
  useReserveSeatsMutation,
  reserveSeats,
  type ReserveSeatsResult,
} from './api/useReserveSeatsMutation';

export { useApplyVoucherMutation, applyVoucher } from './api/useApplyVoucherMutation';

export {
  usePaymentStatusQuery,
  fetchPaymentStatus,
  PAYMENT_STATUS_QUERY_KEY,
} from './api/usePaymentStatusQuery';

export { useSyncOrderMutation, syncOrder, type SyncOrderPayload } from './api/useSyncOrderMutation';
export {
  useCancelOrderMutation,
  cancelOrder,
  type CancelOrderPayload,
} from './api/useCancelOrderMutation';

export {
  useCountdownTimer,
  type UseCountdownTimerOptions,
  type CountdownTimerState,
} from './hooks/useCountdownTimer';

export {
  useSnapPayment,
  type UseSnapPaymentOptions,
  type UseSnapPaymentReturn,
} from './hooks/useSnapPayment';

export {
  useEventCheckoutSession,
  type UseEventCheckoutSessionProps,
  type UseEventCheckoutSessionReturn,
} from './hooks/useEventCheckoutSession';

export { EventCheckoutModal, type EventCheckoutModalProps } from './components/EventCheckoutModal';

export {
  mockVouchersList,
  mockReservationFixture,
  mockVoucherAppliedFixture,
  mockRentMovieFixture,
  mockPaymentStatusFixture,
  checkoutHandlers,
} from './mocks';
