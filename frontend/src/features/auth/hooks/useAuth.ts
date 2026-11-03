import { useContext } from 'react';
import { AuthContext } from '../context/auth-context';

import type { AuthContextValue } from '../types';

/**
 * Hook untuk mengakses AuthContext dari dalam AuthProvider tree.
 *
 * Dipisahkan ke file tersendiri (bukan di AuthContext.tsx) agar
 * React Fast Refresh bekerja dengan benar — Fast Refresh hanya
 * mendukung file yang mengeksport components saja, atau hooks saja,
 * tidak keduanya dalam satu file.
 *
 * @throws Error jika dipanggil di luar AuthProvider
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus digunakan di dalam <AuthProvider>');
  }
  return context;
}
