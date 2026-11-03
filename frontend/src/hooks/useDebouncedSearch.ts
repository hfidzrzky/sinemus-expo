import { useState, useCallback, useMemo } from 'react';
import { useDebounce } from './useDebounce';

export interface UseDebouncedSearchOptions {
  /** Nilai awal input pencarian */
  initialValue?: string;
  /** Jeda debounce dalam milidetik (default: 350ms) */
  delay?: number;
  /** Panjang karakter minimal untuk memicu pencarian server (default: 2) */
  minChars?: number;
}

export interface UseDebouncedSearchResult {
  /** Nilai string mentah yang terikat langsung ke input UI (responsif instan) */
  inputValue: string;
  /** Nilai string ter-debounce yang siap dikirimkan ke server/API */
  debouncedQuery: string;
  /** Flag penanda apakah pengguna sedang mengetik dan timer debounce sedang aktif */
  isDebouncing: boolean;
  /** Fungsi pembaruan nilai input */
  setInputValue: (val: string) => void;
  /** Fungsi reset pencarian seketika tanpa jeda debounce */
  clearSearch: () => void;
  /** Flag penanda apakah terdapat teks pada input pencarian */
  hasQuery: boolean;
}

/**
 * Headless Hook Pencarian Ter-debounce Produksi (SOLID & Single Responsibility).
 * Memisahkan state input visual (cepat) dengan pemanggilan server query (terjadwal).
 */
export function useDebouncedSearch(
  options: UseDebouncedSearchOptions = {}
): UseDebouncedSearchResult {
  const { initialValue = '', delay = 350, minChars = 2 } = options;

  const [inputValue, setInputValue] = useState<string>(initialValue);
  const rawDebounced = useDebounce<string>(inputValue, delay);

  // Normalisasi query:
  // 1. Jika kosong: langsung jadikan '' agar reset katalog seketika.
  // 2. Jika < minChars: kembalikan '' agar tidak membebani server dengan query 1-huruf.
  // 3. Jika >= minChars: kirimkan string yang sudah di-trim.
  const debouncedQuery = useMemo(() => {
    const trimmed = rawDebounced.trim();
    if (!trimmed) return '';
    return trimmed.length >= minChars ? trimmed : '';
  }, [rawDebounced, minChars]);

  // isDebouncing aktif jika nilai input berbeda dengan nilai debounced yang berlaku
  const isDebouncing = useMemo(() => {
    const trimmedInput = inputValue.trim();
    // Jika input kosong dan query kosong, tidak sedang debouncing
    if (!trimmedInput && !debouncedQuery) return false;
    return trimmedInput !== debouncedQuery;
  }, [inputValue, debouncedQuery]);

  const clearSearch = useCallback(() => {
    setInputValue('');
  }, []);

  return {
    inputValue,
    debouncedQuery,
    isDebouncing,
    setInputValue,
    clearSearch,
    hasQuery: Boolean(inputValue.trim()),
  };
}
