import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 menit
      gcTime: 1000 * 60 * 15, // 15 menit
    },
    mutations: {
      retry: 0,
    },
  },
});
