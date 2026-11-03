/**
 * PUBLIC API GATEWAY — DOMAIN MOVIES
 */

export type {
  MovieSummary,
  MovieDetail,
  MovieFilterParams,
  AgeRating,
  AccessModel,
  AccessStatus,
  CastMember,
  CastItem,
  MovieRentalPayload,
  MovieRentalResponse,
  MovieStreamAccess,
} from './types';

export { useMoviesQuery, fetchMovies, MOVIES_QUERY_KEY } from './api/useMoviesQuery';
export {
  useMovieDetailQuery,
  fetchMovieDetail,
  MOVIE_DETAIL_QUERY_KEY,
} from './api/useMovieDetailQuery';
export {
  useRentMovieMutation,
  rentMovie,
  type RentMovieVariables,
} from './api/useRentMovieMutation';
export {
  useMovieStreamQuery,
  fetchMovieStreamAccess,
  MOVIE_STREAM_QUERY_KEY,
} from './api/useMovieStreamQuery';

export {
  useMovieRentalCountdown,
  type UseMovieRentalCountdownOptions,
  type MovieRentalCountdownState,
  useMovieWatchPlayer,
  type UseMovieWatchPlayerOptions,
  type MovieWatchPlayerState,
  type MovieWatchPlayerControls,
  type UseMovieWatchPlayerReturn,
} from './hooks';

export { MovieCard } from './components/MovieCard';
export { EmptyMoviesState, type EmptyMoviesStateProps } from './components/EmptyMoviesState';
export { MovieHeroBackdrop, type MovieHeroBackdropProps } from './components/MovieHeroBackdrop';
export { MovieHeroBanner, type MovieHeroBannerProps } from './components/MovieHeroBanner';
export {
  MovieHighlightsSection,
  MovieLooksFilmSection,
  type MovieHighlightsSectionProps,
} from './components/MovieHighlightsSection';
export {
  MovieCastCrewSection,
  type MovieCastCrewSectionProps,
} from './components/MovieCastCrewSection';
export { MovieSynopsisCard, type MovieSynopsisCardProps } from './components/MovieSynopsisCard';
export { MovieRentalModal, type MovieRentalModalProps } from './components/MovieRentalModal';
export { MovieWatchPlayer, type MovieWatchPlayerProps } from './components/MovieWatchPlayer';
export { formatMovieDuration } from './utils/formatters';
export { MOCK_MOVIES, MOCK_MOVIE_DETAILS } from './mocks/fixtures';
export { moviesHandlers } from './mocks';
export { mockUserRentalsState } from './mocks/handlers';
