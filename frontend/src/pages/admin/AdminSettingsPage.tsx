import React, { useState } from 'react';
import { Settings, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import {
  useAdminSettingsQuery,
  useUpdateBusinessPoliciesMutation,
  useUpdatePublicContactMutation,
  useUpdateEmergencyControlsMutation,
  SettingsSubNav,
  SettingsBusinessTab,
  SettingsSupportTab,
  SettingsEmergencyTab,
  type SettingsActiveTab,
  type BusinessPoliciesConfig,
  type PublicContactConfig,
  type EmergencyControlsConfig,
} from '@/features/admin';

export interface AdminSettingsPageProps {
  onNavigate?: (path: string) => void;
}

export function AdminSettingsPage(_props: AdminSettingsPageProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<SettingsActiveTab>('business');

  const { data: settingsData, isLoading, isError, error, refetch } = useAdminSettingsQuery();

  const updateBusinessMutation = useUpdateBusinessPoliciesMutation();
  const updateContactMutation = useUpdatePublicContactMutation();
  const updateEmergencyMutation = useUpdateEmergencyControlsMutation();

  const handleSaveBusiness = async (payload: BusinessPoliciesConfig) => {
    await updateBusinessMutation.mutateAsync(payload);
  };

  const handleSaveContact = async (payload: PublicContactConfig) => {
    await updateContactMutation.mutateAsync(payload);
  };

  const handleSaveEmergency = async (payload: EmergencyControlsConfig) => {
    await updateEmergencyMutation.mutateAsync(payload);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#0066FF]" />
        <p className="text-xs font-semibold text-neutral-400">
          Memuat konfigurasi sistem Sinemus...
        </p>
      </div>
    );
  }

  if (isError || !settingsData) {
    return (
      <div className="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-red-500/20 bg-red-950/10 p-8 text-center">
        <AlertTriangle className="h-10 w-10 text-red-400" />
        <h2 className="mt-3 text-sm font-bold text-white">Gagal Memuat Pengaturan Sistem</h2>
        <p className="mt-1 max-w-md text-xs text-neutral-400">
          {error?.message || 'Terjadi kesalahan saat berkomunikasi dengan server backend.'}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-neutral-800 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-neutral-700 active:scale-95"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Coba Muat Ulang</span>
        </button>
      </div>
    );
  }

  const isMaintenanceActive = settingsData.emergency_controls.is_maintenance_mode;

  return (
    <div className="animate-in fade-in space-y-6 duration-200">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl font-extrabold tracking-tight text-white sm:text-2xl">
              Pengaturan Sistem & Tata Kelola
            </h1>
            {isMaintenanceActive && (
              <span className="animate-pulse rounded-full border border-red-500/40 bg-red-500/20 px-2.5 py-0.5 text-[10px] font-bold text-red-400">
                Maintenance Mode
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-neutral-400">
            Pusat kendali kebijakan tiket war, durasi sewa film VoD, saluran bantuan WhatsApp, dan
            proteksi darurat.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <Settings className="h-4 w-4 text-neutral-500" />
          <span>
            Versi: <strong className="text-white">{settingsData.audit_meta.app_version}</strong>
          </span>
        </div>
      </div>

      {/* 3 Tab Navigation Buttons */}
      <SettingsSubNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isMaintenanceActive={isMaintenanceActive}
      />

      {/* Active Tab Content */}
      <div className="pt-2">
        {activeTab === 'business' && (
          <SettingsBusinessTab
            initialData={settingsData.business_policies}
            onSave={handleSaveBusiness}
            isSaving={updateBusinessMutation.isPending}
          />
        )}

        {activeTab === 'support' && (
          <SettingsSupportTab
            initialData={settingsData.public_contact}
            onSave={handleSaveContact}
            isSaving={updateContactMutation.isPending}
          />
        )}

        {activeTab === 'emergency' && (
          <SettingsEmergencyTab
            initialData={settingsData.emergency_controls}
            auditMeta={settingsData.audit_meta}
            onSave={handleSaveEmergency}
            isSaving={updateEmergencyMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}
