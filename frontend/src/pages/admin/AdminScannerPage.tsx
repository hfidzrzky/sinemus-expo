import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ArrowLeft, Keyboard, ShieldCheck, Film, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import {
  useCameraScanner,
  useValidateTicketQrMutation,
  useScannerSessionsQuery,
  SCANNER_SESSIONS_QUERY_KEY,
  ScannerViewport,
  ScannerLiveStats,
  ScannerResultCard,
  GateSessionPicker,
  ScannerRecentLogs,
  type ScannerScanResult,
  type ScannerSessionItem,
  type ScannerRecentCheckinItem,
  type WrongSessionInfo,
  type DuplicateCheckinInfo,
} from '@/features/admin';

export interface AdminScannerPageProps {
  onNavigate: (path: string) => void;
}

export function AdminScannerPage({ onNavigate }: AdminScannerPageProps): React.JSX.Element {
  const queryClient = useQueryClient();
  const [scanResult, setScanResult] = useState<ScannerScanResult | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [isManualInputOpen, setIsManualInputOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [isSessionPickerOpen, setIsSessionPickerOpen] = useState(false);
  const [recentLogs, setRecentLogs] = useState<ScannerRecentCheckinItem[]>([]);

  // 1. Ambil data sesi screening operasional resmi dari SSOT scanner endpoint
  const {
    data: sessionsData,
    isLoading: isLoadingSessions,
    refetch: refetchSessions,
    isRefetching,
  } = useScannerSessionsQuery({
    scope: 'all',
  });

  const sessions = useMemo(() => sessionsData?.sessions ?? [], [sessionsData]);

  // Otomatis pilih sesi berstatus open_now, closing_soon, atau sesi terdekat jika belum ada pilihan manual
  const activeSession: ScannerSessionItem | null = useMemo(() => {
    if (selectedSessionId !== null) {
      const found = sessions.find((s) => s.id === selectedSessionId);
      if (found) return found;
    }
    const openNowSession = sessions.find((s) => s.gate_status === 'open_now');
    if (openNowSession) return openNowSession;

    const closingSoonSession = sessions.find((s) => s.gate_status === 'closing_soon');
    if (closingSoonSession) return closingSoonSession;

    return sessions[0] ?? null;
  }, [sessions, selectedSessionId]);

  const validateMutation = useValidateTicketQrMutation();
  const playBeepRef = useRef<(type: 'success' | 'duplicate' | 'error') => void>(() => {});

  const scanner = useCameraScanner({
    viewportElementId: 'gatekeeper-qr-viewport',
    onScan: (hash) => void handleValidateHash(hash),
    cooldownMs: 2000,
  });

  useEffect(() => {
    playBeepRef.current = scanner.playBeep;
  }, [scanner.playBeep]);

  // Auto-start camera saat halaman pertama kali dibuka
  useEffect(() => {
    void scanner.startScanner();
    return () => {
      void scanner.stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleResetScan = useCallback(() => {
    setScanResult(null);
    scanner.resumeDecoding();
  }, [scanner]);

  const handleValidateHash = useCallback(
    async (hash: string) => {
      const trimmed = hash.trim();
      if (!trimmed) return;

      // Jeda decoding kamera selama memproses atau menampilkan hasil
      scanner.pauseDecoding();

      try {
        const res = await validateMutation.mutateAsync({
          qr_hash: trimmed,
          schedule_id: activeSession?.id ?? null,
          strict_schedule: true,
          device_info: `Scanner Mobile Gate (${navigator.userAgent.slice(0, 30)})`,
        });

        const ticket = res;
        const serverTimestamp = res._server_time;

        // Sukses check-in
        setScanResult({
          status: 'success',
          message: 'Tiket valid! Penonton berhasil check-in ke venue.',
          ticket,
          rawHash: trimmed,
          timestamp: serverTimestamp,
        });
        playBeepRef.current('success');

        // Catat ke riwayat log masuk gerbang
        setRecentLogs((prev) => [
          {
            id: `${ticket.ticket_code}-${Date.now()}`,
            ticket_code: ticket.ticket_code,
            buyer_name: ticket.buyer_name,
            seat_codes: ticket.seat_codes,
            ticket_quantity: ticket.ticket_quantity,
            scanned_at: ticket.scanned_at,
            studio_name: ticket.studio_name,
          },
          ...prev.slice(0, 4), // Simpan maksimal 5 log terakhir
        ]);

        // Optimistic update pada session aktif di TanStack cache jika ada schedule_stats
        if (ticket.schedule_stats && activeSession) {
          queryClient.setQueryData(
            [...SCANNER_SESSIONS_QUERY_KEY, { scope: 'all' }],
            (old: { sessions: ScannerSessionItem[]; serverTime: string } | undefined) => {
              if (!old) return old;
              return {
                ...old,
                sessions: old.sessions.map((s) => {
                  if (s.id === activeSession.id) {
                    return {
                      ...s,
                      checked_in_count: ticket.schedule_stats!.checked_in_count,
                      tickets_sold: ticket.schedule_stats!.tickets_sold,
                      pending_checkin_count: ticket.schedule_stats!.pending_checkin_count,
                    };
                  }
                  return s;
                }),
              };
            }
          );
        }

        // Sinkronisasi ulang query session
        void queryClient.invalidateQueries({ queryKey: SCANNER_SESSIONS_QUERY_KEY });
      } catch (err: unknown) {
        if (axios.isAxiosError(err) && err.response) {
          const status = err.response.status;
          const resData = err.response.data as {
            message?: string;
            error_code?: string;
            errors?: Record<string, unknown>;
            server_time?: string;
          };
          const msg = resData?.message;
          const errCode = resData?.error_code;
          const errors = resData?.errors;
          const serverTime = resData?.server_time || new Date().toISOString();

          // Strict Gate: Sesi Berbeda (422 WRONG_SCHEDULE_SESSION)
          if (status === 422 && errCode === 'WRONG_SCHEDULE_SESSION') {
            setScanResult({
              status: 'wrong_session',
              message:
                msg ||
                'Tiket terdaftar untuk sesi atau studio yang berbeda. Mohon arahkan penonton.',
              rawHash: trimmed,
              timestamp: serverTime,
              wrongSessionInfo: errors as unknown as WrongSessionInfo,
            });
            playBeepRef.current('error');
            return;
          }

          // Double Check-in (409)
          if (status === 409) {
            setScanResult({
              status: 'duplicate',
              message:
                msg ||
                'PERINGATAN: Tiket ini SUDAH DIGUNAKAN sebelumnya! Verifikasi identitas penonton.',
              rawHash: trimmed,
              timestamp: serverTime,
              duplicateInfo: errors as unknown as DuplicateCheckinInfo,
            });
            playBeepRef.current('duplicate');
            return;
          }

          // Tiket Tidak Valid / Belum Dibayar / Belum Buka (422)
          if (status === 422) {
            setScanResult({
              status: 'invalid',
              message:
                msg ||
                'Tiket tidak memenuhi syarat check-in (periksa status pembayaran atau jam buka pintu).',
              rawHash: trimmed,
              timestamp: serverTime,
            });
            playBeepRef.current('error');
            return;
          }

          // QR Code Tidak Terdaftar (400 atau 404)
          if (status === 400 || status === 404) {
            setScanResult({
              status: 'invalid',
              message:
                msg || 'QR Code tidak dikenali atau bukan merupakan tiket resmi Sinemus Indonesia.',
              rawHash: trimmed,
              timestamp: serverTime,
            });
            playBeepRef.current('error');
            return;
          }
        }

        // Generic Network Error
        setScanResult({
          status: 'invalid',
          message: 'Gagal memvalidasi tiket. Periksa koneksi internet perangkat scanner.',
          rawHash: trimmed,
          timestamp: new Date().toISOString(),
        });
        playBeepRef.current('error');
      }
    },
    [activeSession, validateMutation, scanner, queryClient]
  );

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    void handleValidateHash(manualCode);
    setManualCode('');
    setIsManualInputOpen(false);
  };

  return (
    <div className="mx-auto flex min-h-[90vh] max-w-md flex-col justify-between space-y-4 pb-8">
      {/* Top Bar Navigation */}
      <div className="space-y-3">
        <div className="-mx-4 -mt-4 flex items-center justify-between border-b border-neutral-800 bg-[#0B0E14] px-4 py-3 sm:mx-0 sm:mt-0 sm:rounded-2xl sm:border">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('/admin/dashboard')}
              className="rounded-xl border border-neutral-800 bg-[#0D111A] p-2 text-neutral-400 transition hover:bg-[#131926] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF] active:scale-95"
              aria-label="Kembali ke Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <h1 className="text-xs font-semibold uppercase tracking-wider text-white">
                  Gate Scanner
                </h1>
                <span className="rounded border border-neutral-800 bg-[#0D111A] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-neutral-400">
                  Reguler
                </span>
              </div>
              <p className="text-[10px] text-neutral-400">
                {activeSession
                  ? `${activeSession.venue_name} • ${activeSession.studio_name}`
                  : 'Pintu Masuk Screening Reguler'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => void refetchSessions()}
              disabled={isRefetching}
              className="flex items-center gap-1 rounded-xl border border-neutral-800 bg-[#0D111A] p-2 text-neutral-400 transition hover:bg-[#131926] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF] active:scale-95 disabled:opacity-50"
              title="Sinkronisasi Ulang Data Sesi"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => setIsManualInputOpen(!isManualInputOpen)}
              aria-pressed={isManualInputOpen}
              className={`flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-[11px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF] active:scale-95 ${
                isManualInputOpen
                  ? 'border-[#0066FF]/50 bg-[#0066FF]/15 text-blue-400'
                  : 'border-neutral-800 bg-[#0D111A] text-neutral-400 hover:bg-[#131926] hover:text-white'
              }`}
              title="Input Manual Kode Tiket"
            >
              <Keyboard className="h-3.5 w-3.5" />
              <span>Manual</span>
            </button>
          </div>
        </div>

        {/* Live Attendance Stats Header (Tanpa Dropdown Overload) */}
        {!isLoadingSessions && activeSession ? (
          <ScannerLiveStats
            eventTitle={activeSession.event_title}
            checkedInCount={activeSession.checked_in_count}
            ticketsSold={activeSession.tickets_sold}
            totalCapacity={activeSession.total_seats}
            studioName={activeSession.studio_name}
            venueName={activeSession.venue_name}
            showTime={activeSession.show_time}
            gateStatus={activeSession.gate_status}
            isStrictGate={true}
            onOpenSessionPicker={() => setIsSessionPickerOpen(true)}
          />
        ) : !isLoadingSessions && sessions.length === 0 ? (
          <div className="rounded-2xl border border-neutral-800 bg-[#0B0E14] p-5 text-center">
            <Film className="mx-auto mb-2 h-6 w-6 text-neutral-500" />
            <p className="text-xs font-semibold text-white">Tidak Ada Sesi Operasional Aktif</p>
            <p className="mt-1 text-[11px] text-neutral-400">
              Belum ada jadwal penayangan reguler aktif di sistem. Pastikan event dan jadwal telah
              diaktifkan.
            </p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => void refetchSessions()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-[#0D111A] px-3 py-1.5 text-xs text-neutral-300 transition hover:bg-[#131926] hover:text-white active:scale-95"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Periksa Jadwal</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/admin/events')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0066FF] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#0052D4] active:scale-95"
              >
                <span>Kelola Event</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="h-28 w-full animate-pulse rounded-2xl border border-neutral-800 bg-[#0B0E14]" />
        )}

        {/* Viewport Kamera QR (Persisten: Tidak Di-unmount untuk kecepatan instan) */}
        <div className="relative">
          <ScannerViewport
            viewportElementId="gatekeeper-qr-viewport"
            isScanning={scanner.isScanning}
            isCooldown={scanner.isCooldown || scanResult !== null}
            cameraError={scanner.cameraError}
            hasTorch={scanner.hasTorch}
            isTorchOn={scanner.isTorchOn}
            canSwitchCamera={scanner.availableCameras.length > 1}
            onToggleTorch={() => void scanner.toggleTorch()}
            onSwitchCamera={() => void scanner.switchCamera()}
            onStartScanner={() => void scanner.startScanner()}
          />

          {/* Interactive Result Card Overlay Di Atas Kamera */}
          {scanResult && (
            <div className="animate-in fade-in zoom-in-95 absolute inset-0 z-30 flex items-center justify-center p-3 duration-150">
              <ScannerResultCard
                result={scanResult}
                onReset={handleResetScan}
                autoDismissMs={2500}
              />
            </div>
          )}
        </div>

        {/* Riwayat Scan Terakhir Pada Sesi Ini */}
        <ScannerRecentLogs logs={recentLogs} />

        {/* Manual Code Input Collapsible */}
        {isManualInputOpen && (
          <form
            onSubmit={handleManualSubmit}
            className="space-y-3 rounded-2xl border border-neutral-800 bg-[#0B0E14] p-4 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-medium text-white">
                <Keyboard className="h-3.5 w-3.5 text-neutral-400" />
                Input Manual Kode Tiket
              </span>
              <span className="font-mono text-[10px] text-neutral-400">SNM-TKT-XXXX</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="Contoh: SNM-TKT-849201-B8B9"
                className="flex-1 rounded-xl border border-neutral-800 bg-[#0D111A] px-3.5 py-2 font-mono text-xs uppercase text-white placeholder-neutral-500 transition focus:border-[#0066FF] focus:outline-none focus:ring-1 focus:ring-[#0066FF]"
              />
              <button
                type="submit"
                disabled={validateMutation.isPending || !manualCode.trim()}
                className="rounded-xl bg-[#0066FF] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#0052D4] active:scale-95 disabled:opacity-40"
              >
                Verifikasi
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Structured Gate Session Picker Modal / Drawer */}
      {isSessionPickerOpen && (
        <GateSessionPicker
          sessions={sessions}
          selectedSessionId={activeSession?.id ?? null}
          onSelectSession={(session) => {
            setSelectedSessionId(session.id);
            setIsSessionPickerOpen(false);
          }}
          isOpenAsModal={true}
          onCloseModal={() => setIsSessionPickerOpen(false)}
          isLoading={isLoadingSessions}
          serverTime={sessionsData?.serverTime}
        />
      )}

      {/* Production Venue Security Footer */}
      <div className="flex items-center justify-center gap-1.5 py-2 text-[10px] text-neutral-400">
        <ShieldCheck className="h-3.5 w-3.5 text-neutral-400" />
        <span>Sistem Verifikasi E-Tiket Sinemus · Mode Strict Gate Reguler</span>
      </div>
    </div>
  );
}
