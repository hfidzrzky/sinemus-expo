import { useState, useEffect } from 'react';

/**
 * Headless Hook generik untuk menunda propagasi pembaruan nilai hingga periode delay berlalu.
 * Bersifat type-safe, efisien, dan membersihkan timer secara otomatis saat unmount atau value berubah.
 *
 * @param value Nilai yang ingin didebounce
 * @param delay Durasi jeda debounce dalam milidetik (default: 350ms)
 * @returns Nilai hasil debounce terkini
 */
export function useDebounce<T>(value: T, delay: number = 350): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
