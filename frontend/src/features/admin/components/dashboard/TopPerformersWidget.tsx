import React, { useState } from 'react';
import { Film, Ticket, Layers, TrendingUp, TrendingDown, Crown, Sparkles } from 'lucide-react';
import type { TopPerformerItem } from '../../types';

export type TopPerformersFilterType = 'all' | 'event' | 'movie';

export interface TopPerformersWidgetProps {
  performers?: TopPerformerItem[];
  isLoading?: boolean;
}

export function TopPerformersWidget({
  performers = [],
  isLoading = false,
}: TopPerformersWidgetProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TopPerformersFilterType>('all');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const handleImageError = (key: string) => {
    setFailedImages((prev) => ({ ...prev, [key]: true }));
  };

  const filteredPerformers = performers.filter((item) => {
    if (activeTab === 'all') return true;
    return item.type === activeTab;
  });

  return (
    <div className="flex h-full flex-col rounded-2xl border border-neutral-800 bg-[#0B0E14] p-4 sm:p-5">
      {/* Header & Segmented Tabs */}
      <div className="flex flex-col gap-3 border-b border-neutral-800/80 pb-3 sm:pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
              <Crown className="h-3.5 w-3.5" />
            </span>
            <h3 className="font-display text-sm font-extrabold tracking-tight text-white sm:text-base">
              Top Performing Titles & Events
            </h3>
          </div>
          <p className="mt-1 text-[11px] text-neutral-400 sm:text-xs">
            Peringkat omzet tertinggi tiket event bioskop & sewa film VoD.
          </p>
        </div>

        {/* View Options: Semua / Event Saja / Film Saja (Konsisten dengan Tren Omzet) */}
        <div className="flex flex-wrap items-center gap-1.5 self-start">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-[#0066FF] text-white shadow-sm'
                : 'border border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:bg-neutral-800 hover:text-white'
            }`}
          >
            <Layers className="h-3 w-3" />
            <span>Semua</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('event')}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
              activeTab === 'event'
                ? 'bg-[#0066FF] text-white shadow-sm'
                : 'border border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:bg-neutral-800 hover:text-white'
            }`}
          >
            <Ticket className="h-3 w-3" />
            <span>Event</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('movie')}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
              activeTab === 'movie'
                ? 'bg-[#0066FF] text-white shadow-sm'
                : 'border border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:bg-neutral-800 hover:text-white'
            }`}
          >
            <Film className="h-3 w-3" />
            <span>Film</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="mt-3.5 flex-1 space-y-2.5 sm:mt-4 sm:space-y-3">
        {isLoading ? (
          // Shimmer Loading Skeleton
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((index) => (
              <div
                key={index}
                className="flex animate-pulse items-center gap-3 rounded-xl border border-neutral-800/60 bg-neutral-900/30 p-2.5 sm:p-3"
              >
                <div className="h-6 w-6 shrink-0 rounded-md bg-neutral-800" />
                <div className="h-14 w-10 shrink-0 rounded-lg bg-neutral-800 sm:h-16 sm:w-11" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-3/4 rounded bg-neutral-800" />
                  <div className="h-2.5 w-1/2 rounded bg-neutral-800/70" />
                </div>
                <div className="h-4 w-16 rounded bg-neutral-800" />
              </div>
            ))}
          </div>
        ) : filteredPerformers.length === 0 ? (
          // Clean Empty State
          <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900/60 text-neutral-500">
              <Sparkles className="h-6 w-6" />
            </div>
            <h4 className="mt-3 text-xs font-bold text-neutral-200 sm:text-sm">
              Belum ada data penjualan pada periode ini
            </h4>
            <p className="mt-1 max-w-[220px] text-[11px] text-neutral-500">
              Transaksi yang lunas dalam rentang tanggal terpilih akan terdaftar di sini secara
              otomatis.
            </p>
          </div>
        ) : (
          // List Item Leaderboard
          filteredPerformers.slice(0, 5).map((item, index) => {
            const rank = index + 1;
            const isRank1 = rank === 1;
            const imageKey = `${item.type}-${item.id}`;
            const isImageFailed = Boolean(failedImages[imageKey]) || !item.poster_url;

            return (
              <div
                key={`${item.type}-${item.id}`}
                className={`group relative flex items-center gap-2.5 rounded-xl border p-2 transition-all sm:gap-3 sm:p-2.5 ${
                  isRank1
                    ? 'border-amber-500/30 bg-amber-950/10 hover:border-amber-500/50 hover:bg-amber-950/20'
                    : 'border-neutral-800/80 bg-neutral-900/20 hover:border-neutral-700 hover:bg-neutral-900/50'
                }`}
              >
                {/* Rank Badge */}
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-black sm:h-7 sm:w-7 ${
                    isRank1
                      ? 'border border-amber-500/40 bg-amber-500/20 text-amber-300 shadow-sm'
                      : rank === 2
                        ? 'border border-neutral-600 bg-neutral-800 text-neutral-200'
                        : rank === 3
                          ? 'border border-amber-700/50 bg-amber-900/30 text-amber-500'
                          : 'border border-neutral-800 bg-neutral-900/80 text-neutral-400'
                  }`}
                >
                  #{rank}
                </div>

                {/* Poster Thumbnail (Aspect Ratio 2:3) */}
                <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900 sm:h-16 sm:w-11">
                  {!isImageFailed ? (
                    <img
                      src={item.poster_url as string}
                      alt={item.title}
                      onError={() => handleImageError(imageKey)}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-neutral-600">
                      {item.type === 'movie' ? (
                        <Film className="h-4 w-4" />
                      ) : (
                        <Ticket className="h-4 w-4" />
                      )}
                    </div>
                  )}
                </div>

                {/* Metadata & Progress */}
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-xs font-bold text-white transition-colors group-hover:text-neutral-100 sm:text-sm">
                    {item.title}
                  </h4>

                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-neutral-400 sm:text-[11px]">
                    <span
                      className={`inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[9px] font-bold ${
                        item.type === 'movie'
                          ? 'border border-blue-500/20 bg-blue-500/10 text-blue-400'
                          : 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                      }`}
                    >
                      {item.type === 'movie' ? 'Film' : 'Event'}
                    </span>
                    <span className="text-neutral-600">•</span>
                    <span className="font-medium text-neutral-300">
                      {item.total_sales_count.toLocaleString('id-ID')}{' '}
                      {item.type === 'movie' ? 'Sewa' : 'Tiket'}
                    </span>

                    {/* Studio Occupancy for Events */}
                    {item.type === 'event' && item.occupancy_rate !== null && (
                      <>
                        <span className="text-neutral-600">•</span>
                        <div className="hidden items-center gap-1 sm:flex">
                          <span>Okupansi:</span>
                          <div className="h-1.5 w-10 overflow-hidden rounded-full bg-neutral-800 sm:w-12">
                            <div
                              className="h-full rounded-full bg-emerald-500"
                              style={{
                                width: `${Math.min(100, Math.max(0, item.occupancy_rate))}%`,
                              }}
                            />
                          </div>
                          <span className="font-semibold text-emerald-400">
                            {item.occupancy_rate}%
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Financial Metric & Growth */}
                <div className="shrink-0 text-right">
                  <div className="font-display text-xs font-black text-white sm:text-sm">
                    {item.formatted_net_revenue}
                  </div>
                  <div className="mt-0.5 flex items-center justify-end gap-0.5 text-[9px] sm:text-[10px]">
                    {item.growth_percentage > 0 ? (
                      <span className="flex items-center gap-0.5 font-bold text-emerald-400">
                        <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        <span>+{item.growth_percentage}%</span>
                      </span>
                    ) : item.growth_percentage < 0 ? (
                      <span className="flex items-center gap-0.5 font-bold text-red-400">
                        <TrendingDown className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        <span>{item.growth_percentage}%</span>
                      </span>
                    ) : (
                      <span className="font-medium text-neutral-500">0%</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
