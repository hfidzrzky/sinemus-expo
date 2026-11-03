import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './useAuth';

// ---------------------------------------------------------------------------
// Global type augmentation untuk Google Identity Services SDK
// ---------------------------------------------------------------------------
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GisInitializeConfig) => void;
          renderButton: (parent: HTMLElement, options: GisButtonOptions) => void;
          prompt: () => void;
          cancel: () => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

interface GisInitializeConfig {
  client_id: string;
  callback: (response: { credential?: string }) => void;
  auto_select?: boolean;
  use_fedcm_for_prompt?: boolean;
  itp_support?: boolean;
}

interface GisButtonOptions {
  type?: 'standard' | 'icon';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  logo_alignment?: 'left' | 'center';
  width?: string | number;
}

export type AuthStatus = 'idle' | 'verifying' | 'success' | 'error';

interface UseGoogleIdentityServicesOptions {
  isOpen: boolean;
  onSuccess?: () => void;
}

export interface UseGoogleIdentityServicesReturn {
  googleBtnContainerRef: React.RefObject<HTMLDivElement>;
  isGisLoaded: boolean;
  isClientIdConfigured: boolean;
  authStatus: AuthStatus;
  isSlowConnection: boolean;
  authErrorMessage: string | null;
  resetAuthState: () => void;
}

let gisInitialized = false;

export function useGoogleIdentityServices({
  isOpen,
  onSuccess,
}: UseGoogleIdentityServicesOptions): UseGoogleIdentityServicesReturn {
  const { loginWithGoogleToken } = useAuth();
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  const isRenderingRef = useRef<boolean>(false);

  const [authStatus, setAuthStatus] = useState<AuthStatus>('idle');
  const [isSlowConnection, setIsSlowConnection] = useState<boolean>(false);
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);

  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSlowTimer = useCallback(() => {
    if (slowTimerRef.current) {
      clearTimeout(slowTimerRef.current);
      slowTimerRef.current = null;
    }
  }, []);

  const resetAuthState = useCallback(() => {
    clearSlowTimer();
    setAuthStatus('idle');
    setIsSlowConnection(false);
    setAuthErrorMessage(null);
  }, [clearSlowTimer]);

  // Ref pattern: callback selalu up-to-date tanpa memicu re-initialize GIS.
  // Penting: GIS initialize() hanya boleh dipanggil sekali, tapi callback-nya
  // harus selalu menggunakan versi terbaru dari loginWithGoogleToken & onSuccess.
  const loginRef = useRef(loginWithGoogleToken);
  const onSuccessRef = useRef(onSuccess);

  useEffect(() => {
    loginRef.current = loginWithGoogleToken;
    onSuccessRef.current = onSuccess;
  }, [loginWithGoogleToken, onSuccess]);

  // Inisialisasi & render GIS button saat modal dibuka dalam kondisi idle
  useEffect(() => {
    if (!isOpen || authStatus !== 'idle') return;

    const gisApi = typeof window !== 'undefined' ? window.google?.accounts?.id : undefined;
    const container = googleBtnContainerRef.current;

    if (!gisApi || !googleClientId || !container) return;

    // Guard: cegah render concurrent (misal saat rapid open/close)
    if (isRenderingRef.current) return;

    try {
      isRenderingRef.current = true;

      // Initialize GIS SATU KALI per siklus hidup aplikasi
      if (!gisInitialized) {
        gisApi.initialize({
          client_id: googleClientId,

          // FedCM: browser native credential picker — menggantikan popup flow.
          // Chrome 108+ akan menggunakan FedCM; browser lain graceful fallback.
          use_fedcm_for_prompt: true,

          // Nonaktifkan auto-select agar tidak ada prompt tersembunyi
          auto_select: false,

          callback: async (response) => {
            if (!response.credential) return;

            try {
              setAuthStatus('verifying');
              setAuthErrorMessage(null);
              setIsSlowConnection(false);

              // Aktifkan timer koneksi lambat (> 3 detik) untuk memberi tahu pengguna
              clearSlowTimer();
              slowTimerRef.current = setTimeout(() => {
                setIsSlowConnection(true);
              }, 3000);

              // Eksekusi login dengan Google token + trigger hook onVerified untuk visual feedback
              await loginRef.current(response.credential, async () => {
                clearSlowTimer();
                setIsSlowConnection(false);
                setAuthStatus('success');

                // Beri jeda 500ms agar pengguna melihat transisi sukses ("Berhasil Masuk!")
                await new Promise((resolve) => setTimeout(resolve, 500));
              });

              resetAuthState();
              onSuccessRef.current?.();
            } catch (err: unknown) {
              clearSlowTimer();
              setIsSlowConnection(false);
              setAuthStatus('error');
              const message =
                err instanceof Error
                  ? err.message
                  : 'Proses masuk dengan Google tidak dapat diselesaikan. Silakan coba kembali.';
              setAuthErrorMessage(message);
            }
          },
        });
        gisInitialized = true;
      }

      // Render button HANYA jika container benar-benar kosong.
      // Cek ini mencegah double-render dari React StrictMode atau
      // re-open modal yang cepat.
      if (container.childElementCount === 0) {
        gisApi.renderButton(container, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width: 320,
        });
      }
    } catch (err) {
      console.warn('[GIS] Gagal memuat Google Sign-In button:', err);
    } finally {
      isRenderingRef.current = false;
    }
  }, [isOpen, authStatus, googleClientId, clearSlowTimer, resetAuthState]);

  // Bersihkan GIS state & timer saat modal ditutup atau unmount
  useEffect(() => {
    if (!isOpen) {
      window.google?.accounts?.id?.cancel?.();
      return;
    }

    return () => {
      clearSlowTimer();
      window.google?.accounts?.id?.cancel?.();
    };
  }, [isOpen, clearSlowTimer]);

  const isGisLoaded = typeof window !== 'undefined' && Boolean(window.google?.accounts?.id);
  const isClientIdConfigured = Boolean(googleClientId);

  return {
    googleBtnContainerRef,
    isGisLoaded,
    isClientIdConfigured,
    authStatus,
    isSlowConnection,
    authErrorMessage,
    resetAuthState,
  };
}
