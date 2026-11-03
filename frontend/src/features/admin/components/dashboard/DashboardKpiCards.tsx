import React from 'react';
import { TrendingUp, Ticket, Film, BarChart2 } from 'lucide-react';
import type { AdminDashboardStats, DashboardMetricType } from '../../types';

export interface DashboardKpiCardsProps {
  stats: AdminDashboardStats;
  onNavigate?: (path: string) => void;
  activeMetric?: DashboardMetricType;
  onSelectMetric?: (metric: DashboardMetricType) => void;
}

export function DashboardKpiCards({
  stats,
  activeMetric = 'revenue',
  onSelectMetric,
}: DashboardKpiCardsProps): React.JSX.Element {
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-4">
      {/* 1. Gross Revenue Card */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelectMetric?.('revenue')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelectMetric?.('revenue');
          }
        }}
        className={`group relative cursor-pointer overflow-hidden rounded-2xl border p-3.5 transition-all sm:p-5 ${
          activeMetric === 'revenue'
            ? 'border-[#0066FF] bg-blue-950/20'
            : 'border-neutral-800 bg-[#0B0E14] hover:border-neutral-700 hover:bg-neutral-900/40'
        }`}
        title="Klik untuk melihat grafik total omzet"
      >
        <div className="flex items-center justify-between">
          <span className="truncate text-[11px] font-semibold text-neutral-400 sm:text-xs">
            Total Omzet
          </span>
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border sm:h-9 sm:w-9 sm:rounded-xl ${
              activeMetric === 'revenue'
                ? 'border-[#0066FF]/40 bg-[#0066FF]/20 text-[#38BDF8]'
                : 'border-neutral-800 bg-neutral-900 text-emerald-400'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
        </div>
        <div className="mt-2 sm:mt-3">
          <h3 className="truncate font-display text-base font-black text-white sm:text-2xl">
            {stats.formatted_total_revenue}
          </h3>
          <div className="mt-1 flex items-center justify-between">
            <p className="flex items-center gap-1 text-[10px] text-emerald-400 sm:text-[11px]">
              <span className="font-semibold">+18.4%</span>
              <span className="hidden text-neutral-500 sm:inline">vs periode lalu</span>
            </p>
            {activeMetric === 'revenue' ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#0066FF]/20 px-1.5 py-0.5 text-[9px] font-bold text-[#38BDF8]">
                <BarChart2 className="h-2.5 w-2.5" />
                <span>Grafik Aktif</span>
              </span>
            ) : (
              <span className="hidden text-[9px] text-neutral-500 group-hover:text-neutral-400 sm:inline">
                Lihat grafik
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Tickets Sold Card */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelectMetric?.('event_tickets')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelectMetric?.('event_tickets');
          }
        }}
        className={`group relative cursor-pointer overflow-hidden rounded-2xl border p-3.5 transition-all sm:p-5 ${
          activeMetric === 'event_tickets'
            ? 'border-[#0066FF] bg-blue-950/20'
            : 'border-neutral-800 bg-[#0B0E14] hover:border-neutral-700 hover:bg-neutral-900/40'
        }`}
        title="Klik untuk melihat grafik tiket event terjual"
      >
        <div className="flex items-center justify-between">
          <span className="truncate text-[11px] font-semibold text-neutral-400 sm:text-xs">
            Tiket Event Terjual
          </span>
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border sm:h-9 sm:w-9 sm:rounded-xl ${
              activeMetric === 'event_tickets'
                ? 'border-[#0066FF]/40 bg-[#0066FF]/20 text-[#38BDF8]'
                : 'border-neutral-800 bg-neutral-900 text-blue-400'
            }`}
          >
            <Ticket className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
        </div>
        <div className="mt-2 sm:mt-3">
          <h3 className="truncate font-display text-base font-black text-white sm:text-2xl">
            {(stats.total_tickets_sold ?? 0).toLocaleString('id-ID')} Tiket
          </h3>
          <div className="mt-1 flex items-center justify-between">
            <p className="truncate text-[10px] text-neutral-400 sm:text-[11px]">
              Okupansi:{' '}
              <strong className="text-white">{stats.average_occupancy_rate ?? 74}%</strong>
            </p>
            {activeMetric === 'event_tickets' ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#0066FF]/20 px-1.5 py-0.5 text-[9px] font-bold text-[#38BDF8]">
                <BarChart2 className="h-2.5 w-2.5" />
                <span>Grafik Aktif</span>
              </span>
            ) : (
              <span className="hidden text-[9px] text-neutral-500 group-hover:text-neutral-400 sm:inline">
                Lihat grafik
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Active VoD Rentals Card */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelectMetric?.('film_tickets')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelectMetric?.('film_tickets');
          }
        }}
        className={`group relative cursor-pointer overflow-hidden rounded-2xl border p-3.5 transition-all sm:p-5 ${
          activeMetric === 'film_tickets'
            ? 'border-[#0066FF] bg-blue-950/20'
            : 'border-neutral-800 bg-[#0B0E14] hover:border-neutral-700 hover:bg-neutral-900/40'
        }`}
        title="Klik untuk melihat grafik tiket film terjual"
      >
        <div className="flex items-center justify-between">
          <span className="truncate text-[11px] font-semibold text-neutral-400 sm:text-xs">
            Tiket Film Terjual
          </span>
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border sm:h-9 sm:w-9 sm:rounded-xl ${
              activeMetric === 'film_tickets'
                ? 'border-[#0066FF]/40 bg-[#0066FF]/20 text-[#38BDF8]'
                : 'border-neutral-800 bg-neutral-900 text-neutral-300'
            }`}
          >
            <Film className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
        </div>
        <div className="mt-2 sm:mt-3">
          <h3 className="truncate font-display text-base font-black text-white sm:text-2xl">
            {(stats.total_active_vod_rentals ?? 0).toLocaleString('id-ID')} Tiket
          </h3>
          <div className="mt-1 flex items-center justify-between">
            <p className="truncate text-[10px] text-neutral-400 sm:text-[11px]">
              Dari <strong className="text-white">{stats.active_movies_count ?? 2} Film</strong>
            </p>
            {activeMetric === 'film_tickets' ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#0066FF]/20 px-1.5 py-0.5 text-[9px] font-bold text-[#38BDF8]">
                <BarChart2 className="h-2.5 w-2.5" />
                <span>Grafik Aktif</span>
              </span>
            ) : (
              <span className="hidden text-[9px] text-neutral-500 group-hover:text-neutral-400 sm:inline">
                Lihat grafik
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
