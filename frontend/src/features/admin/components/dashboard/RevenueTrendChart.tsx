import React, { useState } from 'react';
import { TrendingUp, Info, Ticket, Film, Layers } from 'lucide-react';
import type { RevenueTrendDataPoint, DashboardMetricType, DashboardPeriod } from '../../types';

export interface RevenueTrendChartProps {
  trends?: RevenueTrendDataPoint[];
  activeMetric?: DashboardMetricType;
  period?: DashboardPeriod;
  onSelectMetric?: (metric: DashboardMetricType) => void;
}

const DEFAULT_TRENDS: RevenueTrendDataPoint[] = [
  {
    date: '2026-09-24',
    label: 'Kam',
    cinema_ticket_revenue: 12500000,
    vod_rental_revenue: 3200000,
    total_revenue: 15700000,
    cinema_tickets_sold: 192,
    vod_rentals_sold: 48,
  },
  {
    date: '2026-09-25',
    label: 'Jum',
    cinema_ticket_revenue: 18400000,
    vod_rental_revenue: 4100000,
    total_revenue: 22500000,
    cinema_tickets_sold: 283,
    vod_rentals_sold: 62,
  },
  {
    date: '2026-09-26',
    label: 'Sab',
    cinema_ticket_revenue: 34200000,
    vod_rental_revenue: 7800000,
    total_revenue: 42000000,
    cinema_tickets_sold: 526,
    vod_rentals_sold: 118,
  },
  {
    date: '2026-09-27',
    label: 'Min',
    cinema_ticket_revenue: 38900000,
    vod_rental_revenue: 8500000,
    total_revenue: 47400000,
    cinema_tickets_sold: 598,
    vod_rentals_sold: 129,
  },
  {
    date: '2026-09-28',
    label: 'Sen',
    cinema_ticket_revenue: 9400000,
    vod_rental_revenue: 2800000,
    total_revenue: 12200000,
    cinema_tickets_sold: 145,
    vod_rentals_sold: 42,
  },
  {
    date: '2026-09-29',
    label: 'Sel',
    cinema_ticket_revenue: 11200000,
    vod_rental_revenue: 3100000,
    total_revenue: 14300000,
    cinema_tickets_sold: 172,
    vod_rentals_sold: 47,
  },
  {
    date: '2026-09-30',
    label: 'Rab',
    cinema_ticket_revenue: 14400000,
    vod_rental_revenue: 3500000,
    total_revenue: 17900000,
    cinema_tickets_sold: 221,
    vod_rentals_sold: 53,
  },
];

export function RevenueTrendChart({
  trends = DEFAULT_TRENDS,
  activeMetric = 'revenue',
  period = '7d',
  onSelectMetric,
}: RevenueTrendChartProps): React.JSX.Element {
  const [activeItem, setActiveItem] = useState<RevenueTrendDataPoint | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'event' | 'film'>('all');

  const rawData = trends && trends.length > 0 ? trends : DEFAULT_TRENDS;

  // Normalized data with fallback counts if not populated
  const data = rawData.map((d) => ({
    ...d,
    cinema_tickets_sold:
      d.cinema_tickets_sold ?? Math.max(1, Math.round(d.cinema_ticket_revenue / 65000)),
    vod_rentals_sold: d.vod_rentals_sold ?? Math.max(1, Math.round(d.vod_rental_revenue / 65000)),
  }));

  const periodLabelMap: Record<DashboardPeriod, string> = {
    today: 'Hari Ini (Per Sesi)',
    '7d': '7 Hari Terakhir',
    '30d': '30 Hari Terakhir',
    year: 'Tahun Ini (Per Bulan)',
    custom: 'Periode Kustom',
  };

  // Determine chart mode
  // If activeMetric is 'event_tickets', force or default view to event
  // If activeMetric is 'film_tickets', force or default view to film
  const effectiveFilter =
    activeMetric === 'event_tickets'
      ? 'event'
      : activeMetric === 'film_tickets'
        ? 'film'
        : categoryFilter;

  // Header Title & Subtitle based on metric and filter
  let chartTitle = 'Tren Omzet Konsolidasi';
  let chartDescription = `Komparasi omzet penjualan tiket bioskop vs penyewaan film digital VoD (${periodLabelMap[period]}).`;

  if (
    activeMetric === 'event_tickets' ||
    (activeMetric === 'revenue' && effectiveFilter === 'event')
  ) {
    chartTitle =
      activeMetric === 'event_tickets'
        ? 'Tren Tiket Event Terjual'
        : 'Tren Omzet Tiket Event Bioskop';
    chartDescription = `Perkembangan penjualan tiket bioskop partner Sinemus (${periodLabelMap[period]}).`;
  } else if (
    activeMetric === 'film_tickets' ||
    (activeMetric === 'revenue' && effectiveFilter === 'film')
  ) {
    chartTitle =
      activeMetric === 'film_tickets'
        ? 'Tren Tiket Film Terjual (VoD)'
        : 'Tren Omzet Sewa Film VoD Digital';
    chartDescription = `Perkembangan sewa hak tonton streaming film berbayar (${periodLabelMap[period]}).`;
  }

  // Calculations for heights & values
  const isTicketCountMode = activeMetric === 'event_tickets' || activeMetric === 'film_tickets';

  let maxValue = 1;

  if (isTicketCountMode) {
    if (activeMetric === 'event_tickets') {
      maxValue = Math.max(...data.map((d) => d.cinema_tickets_sold), 10);
    } else {
      maxValue = Math.max(...data.map((d) => d.vod_rentals_sold), 10);
    }
  } else {
    // Revenue mode
    if (effectiveFilter === 'event') {
      maxValue = Math.max(...data.map((d) => d.cinema_ticket_revenue), 1000000);
    } else if (effectiveFilter === 'film') {
      maxValue = Math.max(...data.map((d) => d.vod_rental_revenue), 1000000);
    } else {
      maxValue = Math.max(...data.map((d) => d.total_revenue), 1000000);
    }
  }

  const totalCinemaRevenue = data.reduce((acc, d) => acc + d.cinema_ticket_revenue, 0);
  const totalVodRevenue = data.reduce((acc, d) => acc + d.vod_rental_revenue, 0);
  const grandTotalRevenue = totalCinemaRevenue + totalVodRevenue;

  const totalCinemaTickets = data.reduce((acc, d) => acc + d.cinema_tickets_sold, 0);
  const totalVodTickets = data.reduce((acc, d) => acc + d.vod_rentals_sold, 0);

  const cinemaPercentage =
    grandTotalRevenue > 0 ? Math.round((totalCinemaRevenue / grandTotalRevenue) * 100) : 0;
  const vodPercentage = grandTotalRevenue > 0 ? 100 - cinemaPercentage : 0;

  const handleFilterClick = (filter: 'all' | 'event' | 'film') => {
    setCategoryFilter(filter);
    if (filter === 'all' && onSelectMetric) {
      onSelectMetric('revenue');
    } else if (filter === 'event' && activeMetric === 'film_tickets' && onSelectMetric) {
      onSelectMetric('event_tickets');
    } else if (filter === 'film' && activeMetric === 'event_tickets' && onSelectMetric) {
      onSelectMetric('film_tickets');
    }
  };

  return (
    <div className="rounded-2xl border border-neutral-800 bg-[#0B0E14] p-3.5 sm:p-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-3 border-b border-neutral-800/80 pb-4 sm:flex-row sm:items-center sm:justify-between sm:pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-sm font-extrabold text-white sm:text-base">
              {chartTitle}
            </h2>
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-400 sm:text-[10px]">
              <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              +24.1%
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-neutral-400 sm:mt-1 sm:text-xs">
            {chartDescription}
          </p>
        </div>

        {/* View Options: Semua / Event Saja / Film Saja */}
        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-center">
          <button
            type="button"
            onClick={() => handleFilterClick('all')}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
              effectiveFilter === 'all' && activeMetric === 'revenue'
                ? 'bg-[#0066FF] text-white'
                : 'border border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:bg-neutral-800 hover:text-white'
            }`}
          >
            <Layers className="h-3 w-3" />
            <span>Semua</span>
          </button>

          <button
            type="button"
            onClick={() => handleFilterClick('event')}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
              effectiveFilter === 'event'
                ? 'bg-[#0066FF] text-white'
                : 'border border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:bg-neutral-800 hover:text-white'
            }`}
          >
            <Ticket className="h-3 w-3" />
            <span>Event</span>
          </button>

          <button
            type="button"
            onClick={() => handleFilterClick('film')}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
              effectiveFilter === 'film'
                ? 'bg-[#38BDF8] font-bold text-neutral-950'
                : 'border border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:bg-neutral-800 hover:text-white'
            }`}
          >
            <Film className="h-3 w-3" />
            <span>Film</span>
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] sm:text-xs">
        <div className="flex items-center gap-4">
          {(effectiveFilter === 'all' || effectiveFilter === 'event') && (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="h-2.5 w-2.5 rounded-sm bg-[#0066FF] sm:h-3 sm:w-3" />
              <span className="font-medium text-neutral-300">
                Tiket Event{' '}
                {effectiveFilter === 'all' && !isTicketCountMode && `(${cinemaPercentage}%)`}
              </span>
            </div>
          )}

          {(effectiveFilter === 'all' || effectiveFilter === 'film') && (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="h-2.5 w-2.5 rounded-sm bg-[#38BDF8] sm:h-3 sm:w-3" />
              <span className="font-medium text-neutral-300">
                Tiket Film (VoD){' '}
                {effectiveFilter === 'all' && !isTicketCountMode && `(${vodPercentage}%)`}
              </span>
            </div>
          )}
        </div>

        <span className="text-[10px] text-neutral-500">
          Mode:{' '}
          <strong className="text-neutral-300">
            {activeMetric === 'revenue'
              ? 'Nilai Rupiah (Omzet)'
              : activeMetric === 'event_tickets'
                ? 'Jumlah Tiket Event'
                : 'Jumlah Tiket Film'}
          </strong>
        </span>
      </div>

      {/* Chart Canvas Area */}
      <div className="mt-4 sm:mt-6">
        <div className="relative flex h-48 items-end gap-1.5 pb-2 pt-6 sm:h-56 sm:gap-6">
          {/* Background grid lines */}
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between opacity-15">
            <div className="w-full border-b border-dashed border-neutral-500" />
            <div className="w-full border-b border-dashed border-neutral-500" />
            <div className="w-full border-b border-dashed border-neutral-500" />
            <div className="w-full border-b border-dashed border-neutral-500" />
          </div>

          {/* Bars */}
          {data.map((item) => {
            const isHovered = activeItem?.date === item.date;

            let cinemaVal = 0;
            let vodVal = 0;
            let totalBarVal: number;

            if (isTicketCountMode) {
              if (activeMetric === 'event_tickets') {
                cinemaVal = item.cinema_tickets_sold;
                totalBarVal = cinemaVal;
              } else {
                vodVal = item.vod_rentals_sold;
                totalBarVal = vodVal;
              }
            } else {
              // Revenue Mode
              if (effectiveFilter === 'all') {
                cinemaVal = item.cinema_ticket_revenue;
                vodVal = item.vod_rental_revenue;
                totalBarVal = item.total_revenue;
              } else if (effectiveFilter === 'event') {
                cinemaVal = item.cinema_ticket_revenue;
                totalBarVal = cinemaVal;
              } else {
                vodVal = item.vod_rental_revenue;
                totalBarVal = vodVal;
              }
            }

            const barHeightPercent = Math.min(
              100,
              Math.max(4, Math.round((totalBarVal / maxValue) * 100))
            );

            const cinemaSegmentPercent = totalBarVal > 0 ? (cinemaVal / totalBarVal) * 100 : 0;
            const vodSegmentPercent = totalBarVal > 0 ? (vodVal / totalBarVal) * 100 : 0;

            return (
              <div
                key={item.date}
                className="group relative flex h-full flex-1 cursor-pointer flex-col items-center justify-end"
                onMouseEnter={() => setActiveItem(item)}
                onMouseLeave={() => setActiveItem(null)}
              >
                {/* Tooltip on hover */}
                {isHovered && (
                  <div className="animate-in fade-in zoom-in-95 absolute -top-16 z-20 whitespace-nowrap rounded-xl border border-neutral-700 bg-[#0F141F] px-2.5 py-1 text-center shadow-xl sm:px-3 sm:py-1.5">
                    <p className="text-[10px] font-bold text-white sm:text-[11px]">
                      {item.label} ({item.date})
                    </p>
                    <div className="mt-0.5 flex items-center justify-center gap-2 text-[9px] sm:gap-3 sm:text-[10px]">
                      {isTicketCountMode ? (
                        activeMetric === 'event_tickets' ? (
                          <span className="font-semibold text-blue-400">
                            {item.cinema_tickets_sold} Tiket Terjual
                          </span>
                        ) : (
                          <span className="font-semibold text-[#38BDF8]">
                            {item.vod_rentals_sold} Akses Film Terjual
                          </span>
                        )
                      ) : (
                        <>
                          {(effectiveFilter === 'all' || effectiveFilter === 'event') && (
                            <span className="text-blue-400">
                              Tiket: Rp{' '}
                              {(item.cinema_ticket_revenue / 1000).toLocaleString('id-ID')}k
                            </span>
                          )}
                          {(effectiveFilter === 'all' || effectiveFilter === 'film') && (
                            <span className="text-[#38BDF8]">
                              VoD: Rp {(item.vod_rental_revenue / 1000).toLocaleString('id-ID')}k
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Stacked or Single Bar */}
                <div
                  className={`flex w-full max-w-[28px] flex-col justify-end overflow-hidden rounded-t-md transition-all duration-200 sm:max-w-[40px] sm:rounded-t-lg ${
                    isHovered ? 'scale-105 brightness-110' : 'opacity-90'
                  }`}
                  style={{ height: `${barHeightPercent}%` }}
                >
                  {/* VoD segment */}
                  {vodVal > 0 && (
                    <div
                      className="w-full bg-[#38BDF8] transition-all"
                      style={{ height: `${vodSegmentPercent}%` }}
                    />
                  )}
                  {/* Cinema segment */}
                  {cinemaVal > 0 && (
                    <div
                      className="w-full bg-[#0066FF] transition-all"
                      style={{ height: `${cinemaSegmentPercent}%` }}
                    />
                  )}
                </div>

                {/* X-axis label */}
                <span className="mt-1.5 text-[10px] font-semibold text-neutral-400 transition-colors group-hover:text-white sm:mt-2 sm:text-[11px]">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer info breakdown */}
        <div className="mt-3.5 flex flex-col gap-2 rounded-xl border border-neutral-800/80 bg-[#0D111A] p-2.5 text-[11px] sm:mt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:p-3 sm:text-xs">
          <div className="flex items-center gap-1.5 text-neutral-400 sm:gap-2">
            <Info className="h-3.5 w-3.5 text-blue-400 sm:h-4 sm:w-4" />
            <span>
              {isTicketCountMode ? (
                activeMetric === 'event_tickets' ? (
                  <>
                    Total Tiket Event Terjual ({periodLabelMap[period]}):{' '}
                    <strong className="text-white">
                      {totalCinemaTickets.toLocaleString('id-ID')} Tiket
                    </strong>
                  </>
                ) : (
                  <>
                    Total Tiket Film Terjual ({periodLabelMap[period]}):{' '}
                    <strong className="text-white">
                      {totalVodTickets.toLocaleString('id-ID')} Akses
                    </strong>
                  </>
                )
              ) : (
                <>
                  Total Omzet ({periodLabelMap[period]}):{' '}
                  <strong className="text-white">
                    Rp{' '}
                    {(effectiveFilter === 'event'
                      ? totalCinemaRevenue
                      : effectiveFilter === 'film'
                        ? totalVodRevenue
                        : grandTotalRevenue
                    ).toLocaleString('id-ID')}
                  </strong>
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[10px] text-neutral-400 sm:gap-4 sm:text-[11px]">
            <span>
              Tiket Event:{' '}
              <strong className="text-blue-400">
                {isTicketCountMode
                  ? `${totalCinemaTickets} Tiket`
                  : `Rp ${totalCinemaRevenue.toLocaleString('id-ID')}`}
              </strong>
            </span>
            <span>
              Film VoD:{' '}
              <strong className="text-sky-400">
                {isTicketCountMode
                  ? `${totalVodTickets} Akses`
                  : `Rp ${totalVodRevenue.toLocaleString('id-ID')}`}
              </strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
