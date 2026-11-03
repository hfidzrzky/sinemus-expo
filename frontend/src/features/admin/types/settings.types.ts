export interface BusinessPoliciesConfig {
  seat_lock_duration_minutes: number;
  vod_rental_duration_hours: number;
  platform_service_fee: number;
  max_tickets_per_order: number;
  enable_ticket_cancellation: boolean;
}

export interface PublicContactConfig {
  whatsapp_admin_number: string;
  whatsapp_prefill_template: string;
  support_email: string;
  ticket_sender_name: string;
  ticket_sender_email: string;
  social_media: {
    instagram: string;
    tiktok?: string;
    youtube?: string;
  };
  operating_hours: string;
}

export interface EmergencyControlsConfig {
  is_maintenance_mode: boolean;
  maintenance_message: string;
  freeze_cinema_ticket_sales: boolean;
  freeze_vod_rentals: boolean;
  emergency_alert_banner: {
    is_active: boolean;
    message?: string | null;
    type: 'warning' | 'danger' | 'info';
  };
}

export interface SystemSettingsAuditMeta {
  app_version: string;
  server_time: string;
  timezone: string;
  last_updated_at: string | null;
  last_updated_by_name: string | null;
}

export interface SystemSettingsData {
  business_policies: BusinessPoliciesConfig;
  public_contact: PublicContactConfig;
  emergency_controls: EmergencyControlsConfig;
  audit_meta: SystemSettingsAuditMeta;
}

export type SettingsActiveTab = 'business' | 'support' | 'emergency';
