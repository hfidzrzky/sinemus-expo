import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'sinemus_recent_searches';
const MAX_RECENT_SEARCHES = 6;

export interface UseRecentSearchesReturn {
  /** Daftar riwayat kata kunci pencarian terkini (diurutkan dari yang terbaru) */
  recentSearches: string[];
  /** Menambahkan kata kunci baru ke dalam riwayat pencarian */
  addRecentSearch: (term: string) => void;
  /** Menghapus satu kata kunci spesifik dari riwayat */
  removeRecentSearch: (term: string) => void;
  /** Menghapus seluruh riwayat pencarian */
  clearRecentSearches: () => void;
}

/**
 * Headless Hook untuk Manajemen Riwayat Pencarian Terakhir (Recent Searches).
 * Menggunakan localStorage secara aman (try-catch guard, deduplikasi, batas maksimal item).
 */
export function useRecentSearches(maxItems: number = MAX_RECENT_SEARCHES): UseRecentSearchesReturn {
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed.slice(0, maxItems) : [];
    } catch {
      return [];
    }
  });

  // Sinkronisasi state lokal ke localStorage setiap kali ada perubahan
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recentSearches));
    } catch {
      // Menangani kemungkinan quota exceeded / private mode error secara aman
    }
  }, [recentSearches]);

  const addRecentSearch = useCallback(
    (term: string) => {
      const cleaned = term.trim();
      if (!cleaned || cleaned.length < 2) return;

      setRecentSearches((prev) => {
        // Hilangkan duplikasi kata kunci yang sama (case-insensitive)
        const filtered = prev.filter((item) => item.toLowerCase() !== cleaned.toLowerCase());
        // Sisipkan kata kunci baru di posisi pertama (terbaru)
        return [cleaned, ...filtered].slice(0, maxItems);
      });
    },
    [maxItems]
  );

  const removeRecentSearch = useCallback((term: string) => {
    setRecentSearches((prev) =>
      prev.filter((item) => item.toLowerCase() !== term.toLowerCase().trim())
    );
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Safe fallback
      }
    }
  }, []);

  return {
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
  };
}
