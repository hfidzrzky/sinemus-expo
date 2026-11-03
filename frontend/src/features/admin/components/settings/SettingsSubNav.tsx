import React from 'react';
import { Sliders, MessageSquare, ShieldAlert } from 'lucide-react';
import type { SettingsActiveTab } from '../../types';

export interface SettingsSubNavProps {
  activeTab: SettingsActiveTab;
  onTabChange: (tab: SettingsActiveTab) => void;
  isMaintenanceActive?: boolean;
}

export function SettingsSubNav({
  activeTab,
  onTabChange,
  isMaintenanceActive = false,
}: SettingsSubNavProps): React.JSX.Element {
  const tabs = [
    {
      id: 'business' as const,
      name: 'Kebijakan Bisnis & Tiket',
      description: 'Seat lock war, durasi sewa VoD, platform fee',
      icon: Sliders,
    },
    {
      id: 'support' as const,
      name: 'Layanan Pengguna & Kontak',
      description: 'Hotline WhatsApp admin, email support, sosmed',
      icon: MessageSquare,
    },
    {
      id: 'emergency' as const,
      name: 'Kontrol Darurat & Keamanan',
      description: 'Mode pemeliharaan, freeze penjualan, audit log',
      icon: ShieldAlert,
      badge: isMaintenanceActive ? 'Aktif' : undefined,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-start rounded-2xl border p-4 text-left transition-all ${
              isActive
                ? 'border-[#0066FF] bg-[#0066FF]/10 text-white'
                : 'border-neutral-800 bg-[#0B0E14] text-neutral-400 hover:border-neutral-700 hover:text-white'
            }`}
          >
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                    isActive ? 'bg-[#0066FF] text-white' : 'bg-neutral-900 text-neutral-400'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-white sm:text-sm">{tab.name}</span>
              </div>

              {tab.badge && (
                <span className="animate-pulse rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400">
                  {tab.badge}
                </span>
              )}
            </div>
            <p className="mt-2 text-[11px] text-neutral-400">{tab.description}</p>
          </button>
        );
      })}
    </div>
  );
}
