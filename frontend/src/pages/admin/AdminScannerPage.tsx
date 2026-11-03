import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft, Keyboard, Camera, ShieldCheck, Film } from 'lucide-react';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import {
  useCameraScanner,
  useValidateTicketQrMutation,
  useAdminEventsQuery,
  ADMIN_EVENTS_QUERY_KEY,
  ScannerViewport,
  ScannerLiveStats,
  ScannerResultCard,
  type ScannerScanResult,
  type ScheduleOption,
} from '@/features/admin';

export interface AdminScannerPageProps {
  onNavigate: (path: string) => void;
}

export function AdminScannerPage({ onNavigate }: AdminScannerPageProps): React.JSX.Element {
  const queryClient = useQueryClient();
  const [scanResult, setScanResult] = useState<ScannerScanResult | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [isManualInputOpen, setIsManualInputOpen] = useState(false);
  const [userSelectedScheduleId, setUserSelectedScheduleId] = useState<number | null>(null);
  const [optimisticIncrement, setOptimisticIncrement] = useState(0);

  // Ambil data event screening reguler dari database
  const { data: regularEvents = [], isLoading: isLoadingEvents } = useAdminEventsQuery({
    event_type: 'regular',
  });

  // Filter hanya event reguler (presale tidak didukung untuk QR scanner gate)
  const scheduleOptions: ScheduleOption[] = useMemo(() => {
    const list: ScheduleOption[] = [];
    const filteredEvents = regularEvents.filter((e) => e.event_type === 'regular');

    for (const event of filteredEvents) {
      if (Array.isArray(event.schedules) && event.schedules.length > 0) {
        for (const schedule of event.schedules) {
          list.push({
            id: schedule.id,
            eventTitle: event.title,
            studioName: schedule.studio_name || 'Studio Utama',
            venueName: event.venue_name,
            showTime: schedule.show_time,
            checkedInCount: schedule.checked_in_count ?? 0,
            totalCapacity: schedule.total_seats ?? 0,
          });
        }
      } else {
        // Fallback jika event reguler belum memiliki schedule terperinci
        list.push({
          id: event.id,
          eventTitle: event.title,
          studioName: 'Studio Utama',
          venueName: event.venue_name,
          checkedInCount: 0,
          totalCapacity: event.total_capacity ?? 0,
        });
      }
    }
    return list;
  }, [regularEvents]);

  const activeSchedule = useMemo(() => {
    if (userSelectedScheduleId !== null) {
      const found = scheduleOptions.find((s) => s.id === userSelectedScheduleId);
      if (found) return found;
    }
    return scheduleOptions[0] ?? null;
  }, [scheduleOptions, userSelectedScheduleId]);

  const validateMutation = useValidateTicketQrMutation();
  const playBeepRef = React.useRef<(type: 'success' | 'duplicate' | 'error') => void>(() => {});

  const handleValidateHash = useCallback(
    async (hash: string) => {
      const trimmed = hash.trim();
      if (!trimmed) return;

      try {
        const ticket = await validateMutation.mutateAsync({
          qr_hash: trimmed,
          device_info: `Scanner Mobile Gate (${navigator.userAgent.slice(0, 30)})`,
        });

        // Sukses check-in
        setOptimisticIncrement((prev) => prev + 1);
        setScanResult({
          status: 'success',
          message: 'Tiket valid! Penonton berhasil check-in ke venue.',
          ticket,
          rawHash: trimmed,
          timestamp: new Date().toISOString(),
        });
        playBeepRef.current('success');

        // Sinkronisasi ulang data event & schedule dari backend database
        void queryClient.invalidateQueries({ queryKey: ADMIN_EVENTS_QUERY_KEY });
      } catch (err: unknown) {
        if (axios.isAxiosError(err) && err.response) {
          const status = err.response.status;
          const msg = (err.response.data as { message?: string })?.message;

          if (status === 409) {
            // Double Check-In
            setScanResult({
              status: 'duplicate',
              message:
                msg ||
                'PERINGATAN: Tiket ini SUDAH DIGUNAKAN sebelumnya! Verifikasi identitas penonton.',
              rawHash: trimmed,
              timestamp: new Date().toISOString(),
            });
            playBeepRef.current('duplicate');
            return;
          }

          if (status === 422) {
            // Tiket presale, unpaid, atau expired session
            setScanResult({
              status: 'invalid',
              message:
                msg || 'Tiket tidak memenuhi syarat check-in (khusus sesi penayangan reguler).',
              rawHash: trimmed,
              timestamp: new Date().toISOString(),
            });
            playBeepRef.current('error');
            return;
          }

          if (status === 400 || status === 404) {
            setScanResult({
              status: 'invalid',
              message:
                msg || 'QR Code tidak dikenali atau bukan merupakan tiket resmi Sinemus Indonesia.',
              rawHash: trimmed,
              timestamp: new Date().toISOString(),
            });
            playBeepRef.current('error');
            return;
          }
        }

        // Generic error
        setScanResult({
          status: 'invalid',
          message: 'Gagal memvalidasi tiket. Periksa koneksi internet staf.',
          rawHash: trimmed,
          timestamp: new Date().toISOString(),
        });
        playBeepRef.current('error');
      }
    },
    [validateMutation, queryClient]
  );

  const scanner = useCameraScanner({
    viewportElementId: 'gatekeeper-qr-viewport',
    onScan: handleValidateHash,
    cooldownMs: 2500,
  });

  useEffect(() => {
    playBeepRef.current = scanner.playBeep;
  }, [scanner.playBeep]);

  // Auto-start camera saat halaman dibuka
  useEffect(() => {
    void scanner.startScanner();
    return () => {
      void scanner.stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    void handleValidateHash(manualCode);
    setManualCode('');
    setIsManualInputOpen(false);
  };

  const handleResetScan = () => {
    setScanResult(null);
  };

  const currentCheckedIn = (activeSchedule?.checkedInCount ?? 0) + optimisticIncrement;
  const currentTotalSeats = activeSchedule?.totalCapacity ?? 0;

  return (
    <div className="mx-auto flex min-h-[90vh] max-w-md flex-col justify-between space-y-4 pb-8">
      {/* Top Bar Header */}
      <div className="space-y-3">
        <div className="-mx-4 -mt-4 flex items-center justify-between border-b border-neutral-800 bg-neutral-950 px-4 py-3 sm:mx-0 sm:mt-0 sm:rounded-2xl sm:border">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('/admin/dashboard')}
              className="rounded-xl border border-neutral-800 bg-neutral-900 p-2 text-neutral-400 transition hover:bg-neutral-800 hover:text-white"
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
                <span className="rounded border border-neutral-800 bg-neutral-900 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-neutral-400">
                  Reguler
                </span>
              </div>
              <p className="text-[10px] text-neutral-400">
                {activeSchedule?.venueName
                  ? `${activeSchedule.venueName} • ${activeSchedule.studioName || 'Studio'}`
                  : 'Pintu Masuk Screening Reguler'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsManualInputOpen(!isManualInputOpen)}
              className={`flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-[11px] font-medium transition ${
                isManualInputOpen
                  ? 'border-neutral-700 bg-neutral-800 text-white'
                  : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white'
              }`}
              title="Input Manual Kode Tiket"
            >
              <Keyboard className="h-3.5 w-3.5 text-neutral-400" />
              <span>Manual</span>
            </button>
          </div>
        </div>

        {/* Live Attendance Stats (Tersinkron dengan Database Sesi Reguler) */}
        {!isLoadingEvents && activeSchedule ? (
          <ScannerLiveStats
            eventTitle={activeSchedule.eventTitle}
            checkedInCount={currentCheckedIn}
            totalCapacity={currentTotalSeats}
            studioName={activeSchedule.studioName}
            venueName={activeSchedule.venueName}
            showTime={activeSchedule.showTime}
            scheduleOptions={scheduleOptions}
            selectedScheduleId={activeSchedule.id}
            onSelectSchedule={(id) => {
              setUserSelectedScheduleId(id);
              setOptimisticIncrement(0);
            }}
          />
        ) : !isLoadingEvents && scheduleOptions.length === 0 ? (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 text-center">
            <Film className="mx-auto mb-2 h-5 w-5 text-neutral-400" />
            <p className="text-xs font-medium text-white">Tidak Ada Jadwal Reguler Aktif</p>
            <p className="mt-1 text-[11px] text-neutral-400">
              Pemindaian tiket gerbang masuk hanya berlaku untuk sesi penayangan reguler.
            </p>
          </div>
        ) : (
          <div className="h-24 w-full animate-pulse rounded-2xl border border-neutral-800 bg-neutral-900/40" />
        )}

        {/* Result Card or Camera Viewport */}
        {scanResult ? (
          <div className="space-y-3">
            <ScannerResultCard result={scanResult} onReset={handleResetScan} />
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleResetScan}
                className="flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800 px-5 py-2 text-xs font-medium text-white transition hover:bg-neutral-700"
              >
                <Camera className="h-3.5 w-3.5 text-neutral-400" />
                <span>Pindai Tiket Berikutnya</span>
              </button>
            </div>
          </div>
        ) : (
          <ScannerViewport
            viewportElementId="gatekeeper-qr-viewport"
            isScanning={scanner.isScanning}
            isCooldown={scanner.isCooldown}
            cameraError={scanner.cameraError}
            hasTorch={scanner.hasTorch}
            isTorchOn={scanner.isTorchOn}
            canSwitchCamera={scanner.availableCameras.length > 1}
            onToggleTorch={() => void scanner.toggleTorch()}
            onSwitchCamera={() => void scanner.switchCamera()}
            onStartScanner={() => void scanner.startScanner()}
          />
        )}

        {/* Manual Code Input Collapsible */}
        {isManualInputOpen && (
          <form
            onSubmit={handleManualSubmit}
            className="space-y-3 rounded-2xl border border-neutral-800 bg-neutral-950 p-4 transition-all"
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
                className="flex-1 rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2 font-mono text-xs uppercase text-white placeholder-neutral-500 transition focus:border-neutral-600 focus:outline-none"
              />
              <button
                type="submit"
                disabled={validateMutation.isPending || !manualCode.trim()}
                className="rounded-xl bg-white px-4 py-2 text-xs font-medium text-black transition hover:bg-neutral-200 disabled:opacity-40"
              >
                Verifikasi
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Production Venue Security Footer */}
      <div className="flex items-center justify-center gap-1.5 py-2 text-[10px] text-neutral-400">
        <ShieldCheck className="h-3.5 w-3.5 text-neutral-400" />
        <span>Sistem Verifikasi E-Tiket Sinemus · Mode Screening Reguler</span>
      </div>
    </div>
  );
}
