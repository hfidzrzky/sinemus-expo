import React from 'react';
import { CinemaMaintenanceScreen } from './CinemaMaintenanceScreen';

export interface MaintenanceScreenModalProps {
  isOpen: boolean;
  message?: string;
  serverTime?: string;
  whatsappContact?: string;
  onRefresh?: () => void;
}

export function MaintenanceScreenModal({
  isOpen,
  message,
  serverTime,
  whatsappContact,
  onRefresh,
}: MaintenanceScreenModalProps): React.JSX.Element | null {
  if (!isOpen) return null;

  return (
    <CinemaMaintenanceScreen
      message={message}
      serverTime={serverTime}
      publicContact={
        whatsappContact
          ? {
              whatsapp_admin_number: whatsappContact,
              whatsapp_prefill_template: '',
              support_email: '',
              social_media: {},
              operating_hours: '',
            }
          : undefined
      }
      onRefresh={onRefresh}
    />
  );
}
