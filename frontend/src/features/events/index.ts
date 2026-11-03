/**
 * PUBLIC API GATEWAY — DOMAIN EVENTS
 */

export type {
  EventType,
  SeatingType,
  SeatStatus,
  SeatType,
  EventSummary,
  EventVenueItem,
  ScheduleItem,
  EventDetail,
  SeatItem,
  ScheduleSeatMap,
  EventFilterParams,
  EventFormatItem,
  EventsPaginationMeta,
  PaginatedEventsResult,
} from './types';

export type { EventSalesPhase, EventSalesStatusInfo } from './hooks/useEventSalesStatus';
export { useEventSalesStatus, calculateEventSalesStatus } from './hooks/useEventSalesStatus';

export type { CalendarEventParams } from './utils/calendar';
export {
  generateGoogleCalendarUrl,
  generateIcsFileContent,
  downloadIcsFile,
  formatUtcDateTime,
} from './utils/calendar';

export {
  useEventsQuery,
  fetchEvents,
  EVENTS_QUERY_KEY,
  useEventCitiesQuery,
  fetchEventCities,
  EVENT_CITIES_QUERY_KEY,
  useEventFormatsQuery,
  fetchEventFormats,
  EVENT_FORMATS_QUERY_KEY,
} from './api/useEventsQuery';

export {
  useEventDetailQuery,
  fetchEventDetail,
  EVENT_DETAIL_QUERY_KEY,
} from './api/useEventDetailQuery';

export {
  useScheduleSeatsQuery,
  fetchScheduleSeats,
  SCHEDULE_SEATS_QUERY_KEY,
} from './api/useScheduleSeatsQuery';

export { EventCard } from './components/EventCard';
export { EmptyEventsState, type EmptyEventsStateProps } from './components/EmptyEventsState';
export { ScheduleSelector } from './components/ScheduleSelector';
export { SeatGrid } from './components/SeatGrid';
export { GeneralAdmissionSelector } from './components/GeneralAdmissionSelector';
export { EventDetailDrawer, EventRulesDrawer } from './components/EventDetailDrawer';

export { AddToCalendarDropdown } from './components/AddToCalendarDropdown';
export type { CalendarEventTarget } from './components/AddToCalendarDropdown';

export { MOCK_EVENTS, MOCK_EVENT_DETAILS, generateMockSeatMap } from './mocks/fixtures';
export { eventsHandlers } from './mocks';

export {
  formatMovieDuration,
  normalizeCastMember,
  formatCastSummary,
  type NormalizedCastMember,
} from './utils/formatters';
