import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AuthContext } from './auth-context';

import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  User,
  GoogleAuthResponseData,
  UpdateProfilePayload,
  AuthContextValue,
} from '../types';
import { useCurrentUserQuery, CURRENT_USER_QUERY_KEY } from '../api/useCurrentUserQuery';
import { useGoogleAuthMutation } from '../api/useGoogleAuthMutation';
import { useUpdateProfileMutation } from '../api/useUpdateProfileMutation';
import { useLogoutMutation } from '../api/useLogoutMutation';
import { tokenStorage } from '@/lib/token-storage';
import { getFriendlyErrorMessage } from '@/lib/error-formatter';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
  // isAuthenticated adalah SATU-SATUNYA sumber kebenaran apakah user sedang login.
  // Diinisialisasi dari tokenStorage agar state tetap valid setelah page refresh.
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => tokenStorage.hasToken());

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPhoneCompletionModalOpen, setIsPhoneCompletionModalOpen] = useState(false);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);

  const queryClient = useQueryClient();

  // Query aktif hanya ketika isAuthenticated = true.
  // Tidak ada localStorage check di dalam hook ini — satu-satunya sumber: isAuthenticated state.
  const { data: currentUser, isLoading: isUserLoading } = useCurrentUserQuery(isAuthenticated);

  const googleAuthMutation = useGoogleAuthMutation();
  const updateProfileMutation = useUpdateProfileMutation();
  const logoutMutation = useLogoutMutation();

  // Auto-prompt phone completion jika profil belum lengkap setelah data user tersedia
  useEffect(() => {
    if (!currentUser) return;
    const needsCompletion = !currentUser.phone_number || !currentUser.is_profile_completed;
    if (needsCompletion) {
      // setTimeout(0) memastikan modal muncul setelah render cycle selesai
      const timer = setTimeout(() => setIsPhoneCompletionModalOpen(true), 0);
      return () => clearTimeout(timer);
    }
  }, [currentUser]);

  // Session Expired Listener: Dipicu oleh api-client saat menerima HTTP 401 (misal: token 30 hari berakhir)
  useEffect(() => {
    const handleSessionExpired = () => {
      setIsAuthenticated(false);
      queryClient.removeQueries({ queryKey: CURRENT_USER_QUERY_KEY });
      setIsProfileDrawerOpen(false);
      setIsPhoneCompletionModalOpen(false);
      toast.info('Sesi Masuk Berakhir', {
        description: 'Masa aktif sesi akun Anda telah berakhir (30 hari). Silakan masuk kembali.',
      });
    };

    window.addEventListener('sinemus:auth:session-expired', handleSessionExpired);
    return () => window.removeEventListener('sinemus:auth:session-expired', handleSessionExpired);
  }, [queryClient]);

  // ---------------------------------------------------------------------------
  // Modal / Drawer handlers
  // ---------------------------------------------------------------------------

  const openAuthModal = useCallback(() => {
    // Dilarang membuka modal login jika pengguna sudah login atau sesi masih aktif
    if (tokenStorage.hasToken() || (isAuthenticated && Boolean(currentUser))) {
      return;
    }
    setIsAuthModalOpen(true);
  }, [isAuthenticated, currentUser]);

  const closeAuthModal = useCallback(() => setIsAuthModalOpen(false), []);
  const openPhoneCompletionModal = useCallback(() => setIsPhoneCompletionModalOpen(true), []);
  const closePhoneCompletionModal = useCallback(() => setIsPhoneCompletionModalOpen(false), []);
  const openProfileDrawer = useCallback(() => setIsProfileDrawerOpen(true), []);
  const closeProfileDrawer = useCallback(() => setIsProfileDrawerOpen(false), []);

  // ---------------------------------------------------------------------------
  // loginWithGoogleToken
  //
  // Dipanggil oleh useGoogleIdentityServices setelah menerima credential dari GIS.
  // Orkestrasi penuh: fetch → persist → inject cache → enable query → feedback UI.
  // ---------------------------------------------------------------------------

  const loginWithGoogleToken = useCallback(
    async (
      idToken: string,
      onVerified?: (data: GoogleAuthResponseData) => Promise<void> | void
    ): Promise<GoogleAuthResponseData> => {
      try {
        // Step 1: Kirim ID Token ke backend, terima Sanctum token + data user
        const data = await googleAuthMutation.mutateAsync({ id_token: idToken });

        // Step 2: Berikan kesempatan caller untuk menjalankan callback transisi visual (misal: UI success animation)
        if (onVerified) {
          await onVerified(data);
        }

        // Step 3: Persist token ke localStorage via tokenStorage (satu titik akses)
        tokenStorage.set(data.token, data.user.role);

        // Step 4: Inject data user langsung ke TanStack Query cache SEBELUM
        //         mengaktifkan query. Ini memastikan currentUser tersedia INSTAN
        //         saat isAuthenticated di-set true, tanpa perlu roundtrip jaringan tambahan.
        queryClient.setQueryData<User>(CURRENT_USER_QUERY_KEY, data.user);

        // Step 5: Aktifkan query — di-render ulang dengan currentUser sudah tersedia
        setIsAuthenticated(true);

        // Step 6: Tutup modal auth
        closeAuthModal();

        // Step 7: Tampilkan feedback UX yang kontekstual
        if (data.is_new_user || !data.user.phone_number || !data.user.is_profile_completed) {
          toast.info('Selamat datang di Sinemus!', {
            description:
              'Silakan lengkapi No. WhatsApp Anda untuk verifikasi identitas e-tiket bioskop.',
          });
          setIsPhoneCompletionModalOpen(true);
        } else {
          toast.success(`Selamat datang kembali, ${data.user.name}! 🎬`);
        }

        return data;
      } catch (err) {
        // Format error menjadi pesan ramah pengguna yang aman untuk produksi
        const friendlyMessage = getFriendlyErrorMessage(
          err,
          'Proses masuk dengan Google tidak dapat diselesaikan. Silakan coba kembali.'
        );
        toast.error('Gagal Masuk', { description: friendlyMessage });
        throw err;
      }
    },
    [googleAuthMutation, closeAuthModal, queryClient]
  );

  // ---------------------------------------------------------------------------
  // updateProfile
  //
  // Memperbarui profil pengguna (No. WhatsApp & Tanggal Lahir).
  // Mengunci nomor WhatsApp jika diisi untuk pertama kalinya.
  // ---------------------------------------------------------------------------

  const updateProfile = useCallback(
    async (payload: UpdateProfilePayload): Promise<User> => {
      try {
        const updatedUser = await updateProfileMutation.mutateAsync(payload);
        // Cache sudah diupdate di useUpdateProfileMutation.onSuccess
        if (updatedUser.is_phone_locked) {
          toast.success('Profil & No. WhatsApp Berhasil Disimpan', {
            description: 'Nomor WhatsApp Anda kini telah terkunci secara permanen.',
          });
        } else {
          toast.success('Profil berhasil diperbarui.');
        }
        closePhoneCompletionModal();
        return updatedUser;
      } catch (err) {
        // Format error menjadi pesan ramah pengguna yang aman untuk produksi
        const friendlyMessage = getFriendlyErrorMessage(
          err,
          'Gagal memperbarui data profil. Silakan coba beberapa saat lagi.'
        );
        toast.error('Gagal Memperbarui Profil', { description: friendlyMessage });
        throw err;
      }
    },
    [updateProfileMutation, closePhoneCompletionModal]
  );

  // ---------------------------------------------------------------------------
  // logout
  //
  // Sinkron: cleanup lokal dilakukan segera, tidak menunggu respons backend.
  // Backend request dilakukan fire-and-forget via logoutMutation.
  // ---------------------------------------------------------------------------

  const logout = useCallback(() => {
    // 1. Simpan token yang sedang aktif sebelum dibersihkan dari storage
    const currentToken = tokenStorage.getToken();

    // 2. Bersihkan semua state lokal secara sinkron demi respon UI instan (0ms latency)
    tokenStorage.clear();
    setIsAuthenticated(false);
    queryClient.removeQueries({ queryKey: CURRENT_USER_QUERY_KEY });
    setIsProfileDrawerOpen(false);
    setIsPhoneCompletionModalOpen(false);

    // 3. Fire-and-forget: revocasi token di backend dengan membawa token aktif
    logoutMutation.mutate(currentToken || undefined);

    toast.success('Berhasil keluar dari sesi akun.');
  }, [logoutMutation, queryClient]);

  // ---------------------------------------------------------------------------
  // Context value
  //
  // token diekspos sebagai getter dari tokenStorage agar konsumen context
  // yang membutuhkan raw token (misal: SSE stream headers) dapat mengaksesnya.
  // ---------------------------------------------------------------------------

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser: currentUser ?? null,
      token: tokenStorage.getToken(),
      // isAuthenticated hanya true jika KEDUANYA ada: token DAN user data di cache.
      // Ini mencegah state "auth flash" saat token ada tapi user belum di-fetch.
      isAuthenticated: isAuthenticated && Boolean(currentUser),
      isLoading: isUserLoading || googleAuthMutation.isPending || logoutMutation.isPending,
      // Guard Invariant (Pure Derived State): Modal login dilarang terbuka jika user sudah login atau sesi masih ada di storage
      isAuthModalOpen:
        isAuthModalOpen && !tokenStorage.hasToken() && !(isAuthenticated && Boolean(currentUser)),
      isPhoneCompletionModalOpen,
      isProfileDrawerOpen,
      openAuthModal,
      closeAuthModal,
      openPhoneCompletionModal,
      closePhoneCompletionModal,
      openProfileDrawer,
      closeProfileDrawer,
      loginWithGoogleToken,
      updateProfile,
      logout,
    }),
    [
      currentUser,
      isAuthenticated,
      isUserLoading,
      googleAuthMutation.isPending,
      logoutMutation.isPending,
      isAuthModalOpen,
      isPhoneCompletionModalOpen,
      isProfileDrawerOpen,
      openAuthModal,
      closeAuthModal,
      openPhoneCompletionModal,
      closePhoneCompletionModal,
      openProfileDrawer,
      closeProfileDrawer,
      loginWithGoogleToken,
      updateProfile,
      logout,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// useAuth hook dipindahkan ke hooks/useAuth.ts
// agar file ini hanya mengeksport component (AuthProvider)
// dan React Fast Refresh bekerja dengan benar.
