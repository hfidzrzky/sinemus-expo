import { useQuery, keepPreviousData, type UseQueryResult } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { ApiResponse, PaginatedApiResponse } from '@/types/api';
import type {
  EventSummary,
  EventFilterParams,
  EventsPaginationMeta,
  PaginatedEventsResult,
  EventFormatItem,
} from '../types';

export const EVENTS_QUERY_KEY = ['events', 'list'] as const;
export const EVENT_CITIES_QUERY_KEY = ['events', 'cities'] as const;
export const EVENT_FORMATS_QUERY_KEY = ['events', 'formats'] as const;

export async function fetchEvents(
  params?: EventFilterParams,
  signal?: AbortSignal
): Promise<PaginatedEventsResult> {
  const queryParams: Record<string, string | number> = {};

  if (params?.city && params.city !== 'Semua Kota') {
    queryParams.city = params.city;
  }
  if (params?.event_type && params.event_type !== 'all') {
    queryParams.event_type = params.event_type;
  }
  if (params?.search?.trim()) {
    queryParams.search = params.search.trim();
  }
  if (params?.page) {
    queryParams.page = params.page;
  }

  const response = await apiClient.get<PaginatedApiResponse<EventSummary, EventsPaginationMeta>>(
    '/events',
    {
      params: queryParams,
      signal,
    }
  );

  return {
    events: response.data.data,
    meta: response.data.meta,
  };
}

export function useEventsQuery(
  params?: EventFilterParams,
  enabled = true
): UseQueryResult<PaginatedEventsResult, Error> {
  return useQuery({
    queryKey: [...EVENTS_QUERY_KEY, params],
    queryFn: ({ signal }) => fetchEvents(params, signal),
    enabled,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
    retry: 1,
  });
}

export async function fetchEventCities(): Promise<string[]> {
  const response = await apiClient.get<ApiResponse<string[]>>('/events/cities');
  return response.data.data;
}

export function useEventCitiesQuery(enabled = true): UseQueryResult<string[], Error> {
  return useQuery({
    queryKey: EVENT_CITIES_QUERY_KEY,
    queryFn: fetchEventCities,
    enabled,
    staleTime: 10 * 60 * 1000,
  });
}

export async function fetchEventFormats(): Promise<EventFormatItem[]> {
  const response = await apiClient.get<ApiResponse<EventFormatItem[]>>('/events/formats');
  return response.data.data;
}

export function useEventFormatsQuery(enabled = true): UseQueryResult<EventFormatItem[], Error> {
  return useQuery({
    queryKey: EVENT_FORMATS_QUERY_KEY,
    queryFn: fetchEventFormats,
    enabled,
    staleTime: 10 * 60 * 1000,
  });
}
