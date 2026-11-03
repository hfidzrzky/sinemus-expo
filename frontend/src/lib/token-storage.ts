import type { UserRole } from '@/features/auth';

const TOKEN_KEY = 'sinemus_auth_token' as const;
const ROLE_KEY = 'sinemus_user_role' as const;

export const tokenStorage = {
  /**
   * Membaca token Sanctum aktif dari storage.
   * Mengembalikan null jika belum login atau token tidak ada.
   */
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Membaca role pengguna aktif dari storage.
   * Mengembalikan null jika belum login.
   */
  getRole(): UserRole | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ROLE_KEY) as UserRole | null;
  },

  /**
   * Menyimpan token dan role setelah login berhasil.
   * Dipanggil HANYA oleh AuthContext setelah mutasi login sukses.
   */
  set(token: string, role: UserRole): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(ROLE_KEY, role);
  },

  /**
   * Menghapus semua credential dari storage.
   * Dipanggil HANYA oleh AuthContext saat logout atau sesi kedaluwarsa.
   */
  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
  },

  /**
   * Mengecek apakah ada token aktif di storage.
   * Digunakan untuk inisialisasi isAuthenticated state di AuthContext.
   */
  hasToken(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(localStorage.getItem(TOKEN_KEY));
  },
} as const;
