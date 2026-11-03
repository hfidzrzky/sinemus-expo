import React from 'react';
import { toast } from 'sonner';
import { HeroBannerCarousel, useBannersQuery, type BannerItem } from '@/features/banners';
import { NetflixRowSlider } from '@/components/common';
import { EventCard, EmptyEventsState, useEventsQuery, type EventSummary } from '@/features/events';
import { MovieCard, useMoviesQuery, EmptyMoviesState, type MovieSummary } from '@/features/movies';

interface HomePageProps {
  onNavigate?: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { data: banners = [], isLoading: isBannersLoading } = useBannersQuery();
  const { data: eventsData, isLoading: isEventsLoading } = useEventsQuery();
  const events = eventsData?.events ?? [];
  const { data: movies = [], isLoading: isMoviesLoading } = useMoviesQuery();

  const handleSelectBanner = (banner: BannerItem) => {
    if (banner.link_type === 'event' && banner.event_slug) {
      onNavigate?.(`/event/${banner.event_slug}`);
      toast.info(`Membuka screening: ${banner.title}`);
    } else if (banner.link_type === 'movie' && banner.movie_slug) {
      onNavigate?.(`/film/${banner.movie_slug}`);
      toast.info(`Membuka film: ${banner.title}`);
    } else if (banner.target_url) {
      onNavigate?.(banner.target_url);
    } else {
      onNavigate?.('/events');
    }
  };

  const handleSelectEvent = (event: EventSummary) => {
    onNavigate?.(`/event/${event.slug}`);
    toast.info(`Membuka booking studio: ${event.title}`);
  };

  const handleSelectMovie = (movie: MovieSummary) => {
    onNavigate?.(`/film/${movie.slug}`);
    toast.info(`Membuka detail film: ${movie.title}`);
  };

  return (
    <div className="pb-16">
      {/* SECTION 1: HERO BANNER CAROUSEL (Full-Width Layar Penuh) */}
      <section className="relative w-full">
        <HeroBannerCarousel
          banners={banners}
          isLoading={isBannersLoading}
          onSelectBanner={handleSelectBanner}
          onNavigate={onNavigate}
        />
      </section>

      {/* SECTION 2: FILM PILIHAN / VOD STREAMING */}
      <section className="mt-6 w-full px-4 sm:mt-8 sm:px-6 md:pl-16 md:pr-6 lg:mt-10 lg:pl-20 lg:pr-8">
        {isMoviesLoading ? (
          <NetflixRowSlider
            title="Streaming Film"
            actionText="Lihat Semua Film"
            onActionClick={() => onNavigate?.('/movies')}
            gapClassName="gap-2.5 sm:gap-3.5"
          >
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="w-[130px] shrink-0 sm:w-[155px] md:w-[170px] lg:w-[185px]">
                <div className="aspect-[2/3] w-full animate-pulse rounded-xl bg-neutral-900" />
              </div>
            ))}
          </NetflixRowSlider>
        ) : movies.length > 0 ? (
          <NetflixRowSlider
            title="Streaming Film"
            actionText="Lihat Semua Film"
            onActionClick={() => onNavigate?.('/movies')}
            gapClassName="gap-2.5 sm:gap-3.5"
          >
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} onSelect={handleSelectMovie} />
            ))}
          </NetflixRowSlider>
        ) : (
          <EmptyMoviesState onExploreEvents={() => onNavigate?.('/events')} />
        )}
      </section>

      {/* SECTION 3: EVENT SCREENING (16:9 Cinema Pass Cards) */}
      <section className="mt-10 w-full px-4 sm:mt-14 sm:px-6 md:pl-16 md:pr-6 lg:mt-16 lg:pl-20 lg:pr-8">
        {isEventsLoading ? (
          <NetflixRowSlider
            title="Event Screening"
            actionText="Lihat Semua Jadwal"
            onActionClick={() => onNavigate?.('/events')}
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-[190px] w-[320px] shrink-0 animate-pulse rounded-2xl border border-neutral-800/80 bg-neutral-900/40 sm:w-[380px]"
              />
            ))}
          </NetflixRowSlider>
        ) : events.length > 0 ? (
          <NetflixRowSlider
            title="Event Screening"
            actionText="Lihat Semua Jadwal"
            onActionClick={() => onNavigate?.('/events')}
          >
            {events.map((event) => (
              <EventCard key={event.id} event={event} onSelect={handleSelectEvent} />
            ))}
          </NetflixRowSlider>
        ) : (
          <EmptyEventsState onExploreMovies={() => onNavigate?.('/movies')} />
        )}
      </section>
    </div>
  );
};

export default HomePage;
