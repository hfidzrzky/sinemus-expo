import { useQuery, useMutation, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';
import type {
  SystemSettingsData,
  BusinessPoliciesConfig,
  PublicContactConfig,
  EmergencyControlsConfig,
} from '../types';

export const ADMIN_SETTINGS_QUERY_KEY = ['admin', 'settings'] as const;
export const PUBLIC_SETTINGS_QUERY_KEY = ['public', 'settings'] as const;

export async function fetchAdminSettings(): Promise<SystemSettingsData> {
  const response = await apiClient.get<ApiResponse<SystemSettingsData>>('/admin/settings');
  return response.data.data;
}

export function useAdminSettingsQuery(): UseQueryResult<SystemSettingsData, Error> {
  return useQuery({
    queryKey: ADMIN_SETTINGS_QUERY_KEY,
    queryFn: fetchAdminSettings,
    staleTime: 60 * 1000,
    retry: 1,
  });
}

export function useUpdateBusinessPoliciesMutation() {
  const queryClient = useQueryClient();

  return useMutation<BusinessPoliciesConfig, Error, BusinessPoliciesConfig>({
    mutationFn: async (payload) => {
      const response = await apiClient.put<ApiResponse<BusinessPoliciesConfig>>(
        '/admin/settings/business-policies',
        payload
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_SETTINGS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: PUBLIC_SETTINGS_QUERY_KEY });
    },
  });
}

export function useUpdatePublicContactMutation() {
  const queryClient = useQueryClient();

  return useMutation<PublicContactConfig, Error, PublicContactConfig>({
    mutationFn: async (payload) => {
      const response = await apiClient.put<ApiResponse<PublicContactConfig>>(
        '/admin/settings/public-contact',
        payload
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_SETTINGS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: PUBLIC_SETTINGS_QUERY_KEY });
    },
  });
}

export function useUpdateEmergencyControlsMutation() {
  const queryClient = useQueryClient();

  return useMutation<EmergencyControlsConfig, Error, EmergencyControlsConfig>({
    mutationFn: async (payload) => {
      const response = await apiClient.put<ApiResponse<EmergencyControlsConfig>>(
        '/admin/settings/emergency-controls',
        payload
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_SETTINGS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: PUBLIC_SETTINGS_QUERY_KEY });
    },
  });
}

export interface PublicSettingsData {
  public_contact: {
    whatsapp_admin_number: string;
    whatsapp_prefill_template: string;
    support_email: string;
    social_media: {
      instagram?: string;
      tiktok?: string;
      youtube?: string;
    };
    operating_hours: string;
  };
  emergency_controls: {
    is_maintenance_mode: boolean;
    maintenance_message: string;
    freeze_cinema_ticket_sales: boolean;
    freeze_vod_rentals: boolean;
    emergency_alert_banner: {
      is_active: boolean;
      message: string | null;
      type: 'warning' | 'danger' | 'info';
    };
  };
  business_policies: {
    seat_lock_duration_minutes: number;
    vod_rental_duration_hours: number;
    platform_service_fee: number;
    max_tickets_per_order: number;
  };
  server_time: string;
}

export async function fetchPublicSettings(): Promise<PublicSettingsData> {
  const response = await apiClient.get<ApiResponse<PublicSettingsData>>('/public/settings');
  return response.data.data;
}

export function usePublicSettingsQuery(): UseQueryResult<PublicSettingsData, Error> {
  return useQuery({
    queryKey: PUBLIC_SETTINGS_QUERY_KEY,
    queryFn: fetchPublicSettings,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
