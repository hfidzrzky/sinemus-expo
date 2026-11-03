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

export type { PresalePhase, PresaleStatusInfo } from './hooks/usePresaleStatus';
export { usePresaleStatus, calculatePresaleStatus } from './hooks/usePresaleStatus';

export type { PresaleCountdownResult, UsePresaleCountdownProps } from './hooks/usePresaleCountdown';
export { usePresaleCountdown, calculateRemainingTime } from './hooks/usePresaleCountdown';

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
export { ScheduleSelector } from './components/ScheduleSelector';
export { SeatGrid } from './components/SeatGrid';
export { GeneralAdmissionSelector } from './components/GeneralAdmissionSelector';
export { EventDetailDrawer, EventRulesDrawer } from './components/EventDetailDrawer';
export { PresaleNoticeCard } from './components/PresaleNoticeCard';
export type { PresaleNoticeCardProps } from './components/PresaleNoticeCard';
export { PresaleCountdownHero } from './components/PresaleCountdownHero';
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
