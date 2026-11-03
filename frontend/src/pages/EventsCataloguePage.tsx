import React, { useMemo, useState } from 'react';
import { Search, MapPin, SlidersHorizontal, AlertCircle, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebouncedSearch } from '@/hooks';
import { EventCard, useEventsQuery, type EventSummary, type EventType } from '@/features/events';

interface EventsCataloguePageProps {
  onNavigate?: (path: string) => void;
}

export const EventsCataloguePage: React.FC<EventsCataloguePageProps> = ({ onNavigate }) => {
  const [selectedCity, setSelectedCity] = useState<string>('Semua Kota');
  const [selectedFormat, setSelectedFormat] = useState<EventType | 'all'>('all');

  // Headless Debounced Search Hook (350ms delay, min 2 chars, instant UI responsiveness)
  const { inputValue, debouncedQuery, isDebouncing, setInputValue, clearSearch, hasQuery } =
    useDebouncedSearch({ delay: 350, minChars: 2 });

  const { data, isLoading, isFetching } = useEventsQuery({
    city: selectedCity,
    event_type: selectedFormat,
    search: debouncedQuery,
  });

  const events = data?.events ?? [];

  // Dinamis: Ambil daftar kota aktif dari meta.available_cities response API
  const cities = useMemo(() => {
    const apiCities = data?.meta?.available_cities ?? [];
    return ['Semua Kota', ...apiCities];
  }, [data?.meta?.available_cities]);

  // Dinamis: Ambil format acara aktif dari meta.available_formats response API
  const formatTabs = useMemo(() => {
    const apiFormats = data?.meta?.available_formats ?? [];
    return [
      { label: 'Semua Format', value: 'all' as const },
      ...apiFormats.map((f) => ({
        label: f.label,
        value: f.value as EventType | 'all',
      })),
    ];
  }, [data?.meta?.available_formats]);

  const handleSelectEvent = (event: EventSummary) => {
    onNavigate?.(`/event/${event.slug}`);
  };

  const hasActiveFilters = selectedCity !== 'Semua Kota' || selectedFormat !== 'all' || hasQuery;

  const handleResetFilters = () => {
    setSelectedCity('Semua Kota');
    setSelectedFormat('all');
    clearSearch();
  };

  const isSearchPending = isDebouncing || (isFetching && !isLoading);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      {/* 1. Page Header */}
      <div className="space-y-3">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Jadwal Screening & Event Bioskop
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-neutral-400 sm:text-base">
          Temukan pemutaran film indie di bioskop komunitas, auditorium kampus, dan jaringan bioskop
          komersial dengan pengalaman kurasi terbaik.
        </p>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
        {/* Search Input */}
        <div className="relative">
          {isSearchPending ? (
            <Loader2 className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#0066FF]" />
          ) : (
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          )}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Cari judul film, bioskop, atau lokasi penayangan..."
            className="w-full rounded-xl border border-neutral-800 bg-neutral-900 py-2.5 pl-10 pr-10 text-xs text-white outline-none transition-colors placeholder:text-neutral-500 focus:border-[#0066FF] sm:text-sm"
          />
          {hasQuery && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Bersihkan pencarian"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* City Filter Pills */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-400">
            <MapPin className="h-3.5 w-3.5 text-neutral-500" />
            <span>Filter Kota:</span>
          </div>
          <div className="vercel-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
            {cities.map((city) => {
              const isSelected = selectedCity === city;
              return (
                <button
                  key={city}
                  type="button"
                  onClick={() => setSelectedCity(city)}
                  className={cn(
                    'shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-150',
                    isSelected
                      ? 'border-[#0066FF] bg-[#0066FF] text-white'
                      : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700 hover:text-white'
                  )}
                >
                  {city}
                </button>
              );
            })}
          </div>
        </div>

        {/* Format Filter Tabs */}
        <div className="space-y-2 border-t border-neutral-900 pt-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-400">
            <SlidersHorizontal className="h-3.5 w-3.5 text-neutral-500" />
            <span>Format Acara:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {formatTabs.map((tab) => {
              const isSelected = selectedFormat === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setSelectedFormat(tab.value)}
                  className={cn(
                    'inline-flex items-center rounded-lg border px-3.5 py-1.5 text-xs font-medium transition-all duration-150',
                    isSelected
                      ? 'border-white bg-neutral-100 font-bold text-neutral-950'
                      : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700 hover:text-white'
                  )}
                >
                  <span>{tab.label}</span>
                </button>
              );
            })}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="ml-auto text-xs font-medium text-[#0066FF] hover:underline"
              >
                Reset Semua Filter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Event Cards Grid */}
      <div>
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-[220px] animate-pulse rounded-2xl border border-neutral-800 bg-neutral-900"
              />
            ))}
          </div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onSelect={handleSelectEvent}
                className="w-full"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-950 p-8 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 text-neutral-500">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Tidak ada jadwal ditemukan</h3>
              <p className="mx-auto max-w-sm text-xs text-neutral-400">
                Coba sesuaikan filter kota, format penayangan, atau kata kunci pencarian Anda.
              </p>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-neutral-800"
              >
                Reset Filter
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
