import React, { useState } from 'react';
import { Film, RefreshCw, Plus, Calendar } from 'lucide-react';
import {
  useDashboardStatsQuery,
  useAdminOrdersQuery,
  DashboardKpiCards,
  PendingFulfillmentKpiCard,
  RevenueTrendChart,
  RecentOrdersWidget,
  type DashboardPeriod,
  type DashboardMetricType,
  type AdminDashboardStats,
  type AdminOrderItem,
} from '@/features/admin';

export interface AdminDashboardPageProps {
  onNavigate: (path: string) => void;
}

const EMPTY_STATS: AdminDashboardStats = {
  total_revenue: 0,
  formatted_total_revenue: 'Rp 0',
  total_tickets_sold: 0,
  active_movies_count: 0,
  upcoming_events_count: 0,
  presale_pending_count: 0,
  average_occupancy_rate: 0,
  total_active_vod_rentals: 0,
  revenue_trends: [],
};

const PERIOD_OPTIONS: Array<{ label: string; value: DashboardPeriod }> = [
  { label: 'Hari Ini', value: 'today' },
  { label: '7 Hari', value: '7d' },
  { label: '30 Hari', value: '30d' },
  { label: 'Tahun Ini', value: 'year' },
];

function calculatePresetDates(period: DashboardPeriod): { start: string; end: string } {
  const end = new Date();
  const start = new Date();

  if (period === 'today') {
    const todayStr = end.toISOString().split('T')[0];
    return { start: todayStr, end: todayStr };
  }
  if (period === '7d') {
    start.setDate(end.getDate() - 7);
  } else if (period === '30d') {
    start.setDate(end.getDate() - 30);
  } else if (period === 'year') {
    start.setFullYear(end.getFullYear(), 0, 1);
  }

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

export function AdminDashboardPage({ onNavigate }: AdminDashboardPageProps): React.JSX.Element {
  const initialDates = calculatePresetDates('7d');
  const [selectedPeriod, setSelectedPeriod] = useState<DashboardPeriod>('7d');
  const [startDate, setStartDate] = useState<string>(initialDates.start);
  const [endDate, setEndDate] = useState<string>(initialDates.end);
  const [activeMetric, setActiveMetric] = useState<DashboardMetricType>('revenue');

  const {
    data: stats,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useDashboardStatsQuery({
    period: selectedPeriod,
    startDate,
    endDate,
  });

  const currentStats = stats || EMPTY_STATS;

  const { data: recentOrdersData, isLoading: isLoadingOrders } = useAdminOrdersQuery({
    per_page: 5,
  });

  const handlePeriodChange = (period: DashboardPeriod) => {
    setSelectedPeriod(period);
    if (period !== 'custom') {
      const dates = calculatePresetDates(period);
      setStartDate(dates.start);
      setEndDate(dates.end);
    }
  };

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    setSelectedPeriod('custom');
  };

  const handleEndDateChange = (val: string) => {
    setEndDate(val);
    setSelectedPeriod('custom');
  };

  return (
    <div className="space-y-5 sm:space-y-8">
      {/* Top Header & Quick Action Buttons */}
      <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-lg font-extrabold tracking-tight text-white sm:text-2xl">
            Executive Control Dashboard
          </h1>
          <p className="mt-0.5 text-[11px] text-neutral-400 sm:mt-1 sm:text-xs">
            Pusat analitik ringkasan omzet penjualan tiket bioskop, sewa film VoD, dan okupansi
            studio.
          </p>
        </div>

        {/* Quick Actions Bar */}
        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-1 sm:flex-wrap sm:gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900/60 px-3 py-1.5 text-xs font-semibold text-neutral-300 transition-all hover:bg-neutral-800 hover:text-white disabled:opacity-50 sm:py-2"
            title="Refresh Data"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin text-neutral-400' : ''}`}
            />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('/admin/events/new')}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#0066FF] px-3.5 py-1.5 text-xs font-bold text-white transition-all hover:bg-blue-600 sm:py-2"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Event Baru</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('/admin/movies/new')}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#0066FF] px-3.5 py-1.5 text-xs font-bold text-white transition-all hover:bg-blue-600 sm:py-2"
          >
            <Film className="h-3.5 w-3.5" />
            <span>Tambah Film</span>
          </button>
        </div>
      </div>

      {/* Global Date Filter Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-neutral-800 bg-[#0B0E14] p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-3.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-[#0066FF]">
            <Calendar className="h-4 w-4" />
          </div>
          <span className="text-xs font-bold text-white">Filter Tanggal & Periode</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tanggal Mulai & Tanggal Akhir Picker */}
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex items-center gap-1 rounded-xl border border-neutral-800 bg-[#0D111A] px-2.5 py-1.5 text-xs text-neutral-300">
              <Calendar className="h-3.5 w-3.5 text-neutral-500" />
              <span className="text-[10px] text-neutral-500">Dari:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="bg-transparent text-xs text-neutral-200 outline-none [color-scheme:dark]"
              />
            </div>

            <div className="flex items-center gap-1 rounded-xl border border-neutral-800 bg-[#0D111A] px-2.5 py-1.5 text-xs text-neutral-300">
              <span className="text-[10px] text-neutral-500">Sampai:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
                className="bg-transparent text-xs text-neutral-200 outline-none [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handlePeriodChange(opt.value)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  selectedPeriod === opt.value
                    ? 'bg-[#0066FF] text-white'
                    : 'border border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700 hover:bg-neutral-800 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Notice */}
      {isError && (
        <div className="flex items-center justify-between rounded-xl border border-red-500/30 bg-red-950/20 p-3.5 text-xs text-red-300 sm:p-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-400" />
            <span>Gagal menyinkronkan data analitik server. Menampilkan data fallback lokal.</span>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="font-bold underline hover:text-white"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Main Grid: Left 2 Cols (3 KPI Cards + Chart), Right 1 Col (Pending Injection + Operational Panel) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-8">
        {/* Left 2 Cols: 3 KPI Cards aligned with Chart below */}
        <div className="space-y-5 sm:space-y-6 lg:col-span-2">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-2xl border border-neutral-800 bg-[#0B0E14] p-3.5 sm:h-28 sm:p-5"
                />
              ))}
            </div>
          ) : (
            <DashboardKpiCards
              stats={currentStats}
              activeMetric={activeMetric}
              onSelectMetric={setActiveMetric}
            />
          )}

          <RevenueTrendChart
            trends={currentStats.revenue_trends}
            activeMetric={activeMetric}
            period={selectedPeriod}
            onSelectMetric={setActiveMetric}
          />
        </div>

        {/* Right 1 Col: Pending Injeksi Card + Operasional & Gatekeeper Action Panel */}
        <div className="space-y-5 sm:space-y-6">
          {isLoading ? (
            <div className="h-24 animate-pulse rounded-2xl border border-neutral-800 bg-[#0B0E14] p-3.5 sm:h-28 sm:p-5" />
          ) : (
            <PendingFulfillmentKpiCard
              pendingCount={currentStats.presale_pending_count}
              onNavigate={onNavigate}
            />
          )}

          <div className="rounded-2xl border border-neutral-800 bg-[#0B0E14] p-4 sm:p-5">
            <h3 className="font-display text-sm font-extrabold text-white">
              Operasional & Gatekeeper
            </h3>
            <p className="mt-1 text-xs text-neutral-400">
              Akses cepat kontrol lapangan venue dan smart fulfillment presale bioskop.
            </p>

            <div className="mt-4 space-y-2.5">
              <button
                type="button"
                onClick={() => onNavigate('/admin/presale-inject')}
                className="flex w-full items-center justify-between rounded-xl border border-neutral-800 bg-[#0D111A] p-3 text-left transition-all hover:border-neutral-700 hover:bg-neutral-800/40"
              >
                <div>
                  <h4 className="text-xs font-bold text-white">Smart Ingest Tiket</h4>
                  <p className="text-[10px] text-neutral-400">Injeksi PDF / ZIP batch karcis</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('/admin/movie-access')}
                className="flex w-full items-center justify-between rounded-xl border border-neutral-800 bg-[#0D111A] p-3 text-left transition-all hover:border-neutral-700 hover:bg-neutral-800/40"
              >
                <div>
                  <h4 className="text-xs font-bold text-white">Entitlement VoD</h4>
                  <p className="text-[10px] text-neutral-400">Beri akses tonton manual</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Widget */}
      <div>
        <RecentOrdersWidget
          orders={
            (recentOrdersData?.orders as AdminOrderItem[] | undefined) ??
            (stats?.recent_orders as AdminOrderItem[] | undefined) ??
            []
          }
          isLoading={isLoadingOrders}
          onNavigate={onNavigate}
        />
      </div>
    </div>
  );
}
