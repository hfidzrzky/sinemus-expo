import React, { useMemo, useState } from 'react';
import { Search, X, Loader2, RotateCcw } from 'lucide-react';
import { useDebouncedSearch } from '@/hooks';
import { useMoviesQuery, MovieCard, EmptyMoviesState, type MovieSummary } from '@/features/movies';

export interface MoviesCataloguePageProps {
  onNavigate?: (path: string) => void;
}

const DEFAULT_GENRES = [
  'Semua Genre',
  'Drama',
  'Horor',
  'Dokumenter',
  'Misteri',
  'Komedi',
  'Romansa',
  'Aksi',
  'Petualangan',
  'Animasi',
  'Religi',
  'Sejarah',
];

export const MoviesCataloguePage: React.FC<MoviesCataloguePageProps> = ({ onNavigate }) => {
  const [selectedGenre, setSelectedGenre] = useState<string>('Semua Genre');

  // Headless Debounced Search Hook (350ms delay, min 2 chars, responsif)
  const { inputValue, debouncedQuery, isDebouncing, setInputValue, clearSearch, hasQuery } =
    useDebouncedSearch({ delay: 350, minChars: 2 });

  const queryParams = useMemo(() => {
    return {
      search: debouncedQuery || undefined,
      genre: selectedGenre !== 'Semua Genre' ? selectedGenre : undefined,
    };
  }, [debouncedQuery, selectedGenre]);

  const { data: movies = [], isLoading, isFetching } = useMoviesQuery(queryParams);

  // Kumpulkan genre unik secara dinamis jika ada genre baru di database
  const genres = useMemo(() => {
    const dynamicGenres = new Set<string>();
    movies.forEach((m) => {
      if (m.genre) {
        m.genre.split(',').forEach((g) => {
          const trimmed = g.trim();
          if (trimmed) dynamicGenres.add(trimmed);
        });
      }
    });
    const combined = [
      'Semua Genre',
      ...Array.from(new Set([...DEFAULT_GENRES.slice(1), ...dynamicGenres])),
    ];
    return combined;
  }, [movies]);

  const handleSelectMovie = (movie: MovieSummary) => {
    onNavigate?.(`/film/${movie.slug}`);
  };

  const hasActiveFilters = selectedGenre !== 'Semua Genre' || hasQuery;

  const handleResetFilters = () => {
    setSelectedGenre('Semua Genre');
    clearSearch();
  };

  const isSearchPending = isDebouncing || (isFetching && !isLoading);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      {/* 1. Page Header */}
      <div className="space-y-3">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Katalog Film Streaming
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-neutral-400 sm:text-base">
          Streaming film independen resmi, kurasi festival, dan rilis orisinal sinema Indonesia
          dengan akses instan 48 jam beresolusi tinggi.
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
            placeholder="Cari judul film, sutradara, atau genre..."
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

        {/* Genre Filter Chips */}
        <div className="scrollbar-thin scrollbar-thumb-neutral-800 flex items-center gap-2 overflow-x-auto pb-1 pt-1">
          {genres.map((genre) => {
            const isSelected = selectedGenre === genre;
            return (
              <button
                key={genre}
                type="button"
                onClick={() => setSelectedGenre(genre)}
                className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-[#0066FF] text-white shadow-sm'
                    : 'border border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                }`}
              >
                {genre}
              </button>
            );
          })}
        </div>

        {/* Active Filter Indicator */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between border-t border-neutral-800/80 pt-3 text-xs text-neutral-400">
            <span>
              Menampilkan filter:{' '}
              <strong className="text-white">
                {[
                  selectedGenre !== 'Semua Genre' ? `Genre: ${selectedGenre}` : null,
                  hasQuery ? `Pencarian: "${debouncedQuery}"` : null,
                ]
                  .filter(Boolean)
                  .join(' • ')}
              </strong>
            </span>
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex items-center gap-1 font-semibold text-blue-400 hover:underline"
            >
              <RotateCcw className="h-3 w-3" />
              Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* 3. Movie Grid or States */}
      {isLoading ? (
        /* Skeleton Grid Loading */
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, idx) => (
            <div key={idx} className="space-y-2">
              <div className="aspect-[2/3] w-full animate-pulse rounded-xl bg-neutral-900" />
              <div className="h-3.5 w-3/4 animate-pulse rounded bg-neutral-900" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-neutral-900/60" />
            </div>
          ))}
        </div>
      ) : movies.length > 0 ? (
        /* Real Movies Grid */
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onSelect={handleSelectMovie}
              showPrice={true}
              showTitle={true}
              className="w-full"
            />
          ))}
        </div>
      ) : hasActiveFilters ? (
        /* Empty State for Filter/Search */
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-neutral-800/80 bg-neutral-950 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-400">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="mt-4 font-display text-base font-bold text-white">
            Tidak ada film yang sesuai
          </h3>
          <p className="mt-1 max-w-sm text-xs text-neutral-400">
            Tidak ditemukan film yang cocok dengan filter atau kata kunci pencarian Anda.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="mt-5 rounded-xl bg-neutral-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-neutral-800"
          >
            Reset Semua Filter
          </button>
        </div>
      ) : (
        /* Clean Empty State when Catalog is genuinely empty */
        <EmptyMoviesState showSectionHeader={false} />
      )}
    </div>
  );
};

export default MoviesCataloguePage;
