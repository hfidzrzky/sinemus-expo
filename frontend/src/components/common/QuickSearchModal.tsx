import React, { useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Film,
  Calendar,
  MapPin,
  X,
  ArrowRight,
  Loader2,
  Clock,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebouncedSearch, useRecentSearches } from '@/hooks';
import { useEventsQuery } from '@/features/events';
import { useMoviesQuery, formatMovieDuration } from '@/features/movies';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult?: (type: 'movie' | 'event' | 'venue', slugOrId: string | number) => void;
}

interface SearchItem {
  id: string | number;
  slug: string;
  title: string;
  subtitle: string;
  type: 'movie' | 'event' | 'venue';
  categoryLabel: string;
  badgeText?: string;
  imageUrl?: string;
}

type FilterTab = 'all' | 'event' | 'movie' | 'venue';

export function QuickSearchModal({
  isOpen,
  onClose,
  onSelectResult,
}: QuickSearchModalProps): React.JSX.Element | null {
  const [activeTab, setActiveTab] = React.useState<FilterTab>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  // Riwayat Pencarian Terakhir Pengguna (SSOT LocalStorage, Clean & Private)
  const { recentSearches, addRecentSearch, removeRecentSearch, clearRecentSearches } =
    useRecentSearches(6);

  // Headless Debounced Search Hook (300ms delay, min 2 chars, instant UI responsiveness)
  const {
    inputValue: query,
    debouncedQuery,
    isDebouncing,
    setInputValue: setQuery,
    clearSearch,
    hasQuery,
  } = useDebouncedSearch({ delay: 300, minChars: 2 });

  // Query backend dengan filter pencarian ter-debounce saat modal terbuka
  const eventQueryParams = useMemo(() => {
    return debouncedQuery ? { search: debouncedQuery } : undefined;
  }, [debouncedQuery]);

  const movieQueryParams = useMemo(() => {
    return debouncedQuery ? { search: debouncedQuery } : undefined;
  }, [debouncedQuery]);

  const {
    data: realEventsData,
    isLoading: isEventsLoading,
    isFetching: isEventsFetching,
  } = useEventsQuery(eventQueryParams, isOpen);

  const {
    data: realMovies = [],
    isLoading: isMoviesLoading,
    isFetching: isMoviesFetching,
  } = useMoviesQuery(movieQueryParams, isOpen);

  // 1. Ekstraksi Item Event murni (SSOT konsisten 100% dengan Beranda)
  const eventItems = useMemo<SearchItem[]>(() => {
    const realEvents = realEventsData?.events ?? [];
    return realEvents.map((e) => ({
      id: e.id,
      slug: e.slug,
      title: e.title,
      subtitle: `${e.venue_name} • ${e.city}`,
      type: 'event' as const,
      categoryLabel: 'Event & Screening',
      badgeText: 'Screening',
      imageUrl: e.poster_url,
    }));
  }, [realEventsData?.events]);

  // 2. Ekstraksi Item Movie murni
  const movieItems = useMemo<SearchItem[]>(() => {
    return realMovies.map((m) => {
      const genreText = Array.isArray(m.genre) ? m.genre.join(', ') : m.genre;
      return {
        id: m.id,
        slug: m.slug,
        title: m.title,
        subtitle: `${genreText}${formatMovieDuration(m.duration_minutes) ? ` • ${formatMovieDuration(m.duration_minutes)}` : ''}`,
        type: 'movie' as const,
        categoryLabel: 'Film & VoD',
        badgeText: 'VoD Streaming',
        imageUrl: m.poster_url,
      };
    });
  }, [realMovies]);

  // 3. Ekstraksi Venue unik (Hanya untuk tab Lokasi atau pencarian khusus bioskop/kota)
  const venueItems = useMemo<SearchItem[]>(() => {
    const realEvents = realEventsData?.events ?? [];
    const uniqueVenues = new Map<string, SearchItem>();
    realEvents.forEach((e) => {
      const venueKey = `${e.venue_name}-${e.city}`.toLowerCase();
      if (!uniqueVenues.has(venueKey)) {
        uniqueVenues.set(venueKey, {
          id: `venue-${e.id}`,
          slug: e.slug,
          title: e.venue_name,
          subtitle: `${e.city} • Menayangkan: ${e.title}`,
          type: 'venue' as const,
          categoryLabel: 'Lokasi & Bioskop',
          badgeText: e.cinema_partner || 'Bioskop Partner',
        });
      }
    });
    return Array.from(uniqueVenues.values());
  }, [realEventsData?.events]);

  // Tayangan aktif yang benar-benar tayang (Event Screening + Film VoD)
  const activeCatalogueItems = useMemo<SearchItem[]>(() => {
    return [...eventItems, ...movieItems];
  }, [eventItems, movieItems]);

  const trimmedQuery = query.toLowerCase().trim();

  // Hasil filter berdasarkan activeTab dan query pencarian
  const filteredResults = useMemo<SearchItem[]>(() => {
    const targetDataset: SearchItem[] =
      activeTab === 'event'
        ? eventItems
        : activeTab === 'movie'
          ? movieItems
          : activeTab === 'venue'
            ? venueItems
            : !trimmedQuery
              ? activeCatalogueItems // Tab 'all' sebelum ketik HANYA menampilkan tayangan aktif (tanpa duplikat venue)
              : [...eventItems, ...movieItems, ...venueItems]; // Tab 'all' saat ketik mencari ke seluruh entitas

    if (!trimmedQuery) {
      return targetDataset;
    }

    return targetDataset.filter((item) => {
      return (
        item.title.toLowerCase().includes(trimmedQuery) ||
        item.subtitle.toLowerCase().includes(trimmedQuery) ||
        (item.badgeText && item.badgeText.toLowerCase().includes(trimmedQuery))
      );
    });
  }, [activeTab, eventItems, movieItems, venueItems, activeCatalogueItems, trimmedQuery]);

  // Keyboard shortcut listener (Cmd+K / Ctrl+K & ESC)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus on open
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectItem = (item: SearchItem) => {
    // Simpan ke riwayat pencarian riil (kata kunci ketikan atau judul item yang dipilih)
    if (trimmedQuery) {
      addRecentSearch(trimmedQuery);
    } else {
      addRecentSearch(item.title);
    }

    if (onSelectResult) {
      onSelectResult(item.type, item.slug);
    }
    onClose();
  };

  const isSearchPending = isDebouncing || isEventsFetching || isMoviesFetching;
  const isLoading =
    (isEventsLoading || isMoviesLoading) && !realEventsData && realMovies.length === 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="animate-in fade-in fixed inset-0 z-50 flex items-start justify-center bg-black/80 p-3 pt-12 backdrop-blur-md duration-200 sm:p-6 sm:pt-20"
      onClick={onClose}
    >
      <div
        className="animate-in zoom-in-95 flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-neutral-800/90 bg-[#0B0E14] shadow-2xl duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Search Input Bar */}
        <div className="relative flex shrink-0 items-center border-b border-neutral-800/80 px-4">
          {isSearchPending ? (
            <Loader2 className="h-4.5 w-4.5 shrink-0 animate-spin text-[#0066FF] sm:h-5 sm:w-5" />
          ) : (
            <Search className="h-4.5 w-4.5 shrink-0 text-neutral-400 sm:h-5 sm:w-5" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari judul film, event bioskop, atau lokasi..."
            className="w-full bg-transparent px-3 py-4 text-xs font-medium text-white outline-none placeholder:text-neutral-500 sm:text-sm"
          />
          {hasQuery && (
            <button
              type="button"
              onClick={() => {
                clearSearch();
                inputRef.current?.focus();
              }}
              aria-label="Bersihkan pencarian"
              className="mr-2 rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden select-none items-center rounded border border-neutral-800 bg-neutral-900 px-2 py-0.5 text-[10px] font-medium text-neutral-400 sm:inline-flex">
            ESC
          </kbd>
        </div>

        {/* Filter Tab Pill Buttons */}
        <div className="flex shrink-0 items-center gap-1.5 border-b border-neutral-800/40 bg-[#080B10] px-4 py-2">
          {(
            [
              { id: 'all', label: 'Semua' },
              { id: 'event', label: 'Event Bioskop' },
              { id: 'movie', label: 'Film' },
              { id: 'venue', label: 'Lokasi' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'rounded-lg px-2.5 py-1 text-xs font-medium transition-all',
                activeTab === tab.id
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:bg-neutral-800/40 hover:text-neutral-200'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body Container */}
        <div className="vercel-scrollbar flex-1 overflow-y-auto p-2 sm:p-3">
          {isLoading ? (
            <div className="space-y-2 p-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="flex h-12 animate-pulse items-center gap-3 rounded-xl bg-neutral-900/40 px-3"
                >
                  <div className="h-7 w-7 rounded-lg bg-neutral-800" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-1/3 rounded bg-neutral-800" />
                    <div className="h-2.5 w-1/2 rounded bg-neutral-800/70" />
                  </div>
                </div>
              ))}
            </div>
          ) : !trimmedQuery ? (
            /* TAMPILAN SEBELUM KETIK PENCARIAN (Clean State with Quick Suggestions) */
            <div className="space-y-4 py-2">
              {/* Riwayat Pencarian Terakhir (Hanya tampil jika ada riwayat pencarian riil pengguna) */}
              {recentSearches.length > 0 && (
                <div className="px-2">
                  <div className="flex items-center justify-between pb-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                      <Clock className="h-3.5 w-3.5 text-neutral-500" />
                      <span>Pencarian Terakhir</span>
                    </div>
                    <button
                      type="button"
                      onClick={clearRecentSearches}
                      className="flex items-center gap-1 text-[10px] text-neutral-500 transition-colors hover:text-neutral-300"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Hapus Semua</span>
                    </button>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {recentSearches.map((term) => (
                      <div
                        key={term}
                        className="group inline-flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900/70 py-1 pl-2.5 pr-1.5 text-xs text-neutral-300 transition-colors hover:border-neutral-700 hover:bg-neutral-800 hover:text-white"
                      >
                        <button
                          type="button"
                          onClick={() => setQuery(term)}
                          className="text-left font-medium"
                        >
                          {term}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRecentSearch(term);
                          }}
                          aria-label={`Hapus ${term} dari riwayat`}
                          className="rounded p-0.5 text-neutral-500 transition-colors hover:bg-neutral-700/50 hover:text-neutral-300"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rekomendasi Tayang Saat Ini (Konsisten SSOT dengan Beranda) */}
              <div className="space-y-1">
                <div className="px-2 pb-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                    {activeTab === 'venue' ? 'Bioskop & Venue Partner' : 'Sedang Tayang & Tersedia'}
                  </span>
                </div>
                {filteredResults.length > 0 ? (
                  filteredResults.map((item) => (
                    <SearchRowItem
                      key={`${item.type}-${item.id}`}
                      item={item}
                      onSelect={() => handleSelectItem(item)}
                    />
                  ))
                ) : (
                  <div className="py-6 text-center text-xs text-neutral-500">
                    {activeTab === 'movie'
                      ? 'Belum ada film streaming mandiri aktif.'
                      : 'Belum ada jadwal penayangan aktif.'}
                  </div>
                )}
              </div>
            </div>
          ) : filteredResults.length === 0 ? (
            /* Empty State */
            <div className="py-14 text-center">
              <p className="text-sm font-medium text-neutral-400">
                Tidak ada hasil untuk &ldquo;{query}&rdquo;
              </p>
              <p className="mt-1 text-xs text-neutral-400">
                Coba gunakan kata kunci nama film, bioskop, atau kota lain.
              </p>
            </div>
          ) : (
            /* Search Results */
            <div className="space-y-1">
              {filteredResults.map((item) => (
                <SearchRowItem
                  key={`${item.type}-${item.id}`}
                  item={item}
                  onSelect={() => handleSelectItem(item)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer info semantik */}
        <div className="flex items-center justify-between border-t border-neutral-800/80 bg-[#080B10] px-4 py-2.5 text-[11px] text-neutral-400">
          <div className="flex items-center gap-2">
            <span>Pencarian Sinemus</span>
            <span className="text-neutral-700">•</span>
            <span>
              {!trimmedQuery
                ? `${activeCatalogueItems.length} jadwal screening tersedia`
                : `${filteredResults.length} hasil ditemukan`}
            </span>
          </div>
          <span className="hidden sm:inline">Gunakan panah atau klik untuk memilih</span>
          <span className="inline sm:hidden">Ketuk untuk membuka</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Komponen Baris Hasil Pencarian dengan Styling Bersih dan Non-Jarring
 */
function SearchRowItem({
  item,
  onSelect,
}: {
  item: SearchItem;
  onSelect: () => void;
}): React.JSX.Element {
  const Icon = item.type === 'movie' ? Film : item.type === 'event' ? Calendar : MapPin;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-neutral-900/90"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {/* Thumbnail / Minimal Monochromatic Icon */}
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="h-10 w-7 shrink-0 rounded border border-neutral-800 object-cover shadow-sm"
          />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900/70 text-neutral-400 transition-colors group-hover:text-neutral-200">
            <Icon className="h-4 w-4" />
          </div>
        )}

        {/* Text Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-xs font-semibold text-neutral-100 group-hover:text-white sm:text-sm">
              {item.title}
            </span>
            {item.badgeText && (
              <span className="hidden shrink-0 rounded border border-neutral-800 bg-neutral-900/90 px-1.5 py-0.5 text-[10px] font-medium text-neutral-400 sm:inline-flex">
                {item.badgeText}
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-neutral-400">
            {item.badgeText && (
              <span className="inline-flex shrink-0 rounded border border-neutral-800 bg-neutral-900 px-1.5 py-0.5 text-[9px] font-medium text-neutral-400 sm:hidden">
                {item.badgeText}
              </span>
            )}
            <span className="truncate">{item.subtitle}</span>
          </div>
        </div>
      </div>

      <ArrowRight className="ml-2 h-3.5 w-3.5 shrink-0 text-neutral-700 transition-all group-hover:translate-x-0.5 group-hover:text-neutral-300" />
    </button>
  );
}
