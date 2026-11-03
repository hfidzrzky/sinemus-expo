import React, { useState } from 'react';
import {
  Wand2,
  FileSpreadsheet,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Armchair,
  Loader2,
  RefreshCw,
  QrCode,
  Edit,
  Film,
  AlertCircle,
  Building2,
  Calendar,
  Lock,
  CalendarRange,
} from 'lucide-react';
import {
  useAdminFulfillmentOrdersQuery,
  useAdminEventsQuery,
  SingleInjectModal,
  SmartFulfillmentDropzoneModal,
  FulfillmentReviewMatrixModal,
  BulkInjectCsvModal,
  type AdminFulfillmentOrder,
  type SmartIngestPreviewResponse,
  type IngestTargetContext,
  type EventVenueItem,
} from '@/features/admin';

export interface AdminPresaleInjectPageProps {
  onNavigate?: (path: string) => void;
  initialEventId?: number;
}

/**
 * Helper untuk format waktu jadwal tayang lokal Indonesia.
 */
function formatShowTime(isoString: string): { dateStr: string; timeStr: string } {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return { dateStr: '-', timeStr: '-' };
    const dateStr = d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const timeStr =
      d.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      }) + ' WIB';
    return { dateStr, timeStr };
  } catch {
    return { dateStr: '-', timeStr: '-' };
  }
}

/**
 * Helper untuk format kunci tanggal (YYYY-MM-DD).
 */
function formatShowDateKey(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  } catch {
    return '';
  }
}

/**
 * Helper untuk label tanggal yang elegan (misal: "Sabtu, 28 Nov 2026").
 */
function formatShowDateLabel(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
}

/**
 * Helper untuk format periode booking window presale.
 */
function formatPresaleWindow(startIso?: string | null, endIso?: string | null): string | null {
  if (!startIso && !endIso) return null;
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return isNaN(d.getTime())
      ? '-'
      : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };
  const startStr = startIso ? formatDate(startIso) : 'Sekarang';
  const endStr = endIso ? formatDate(endIso) : 'Selesai';
  return `Periode Presale: ${startStr} – ${endStr}`;
}

export function AdminPresaleInjectPage({
  onNavigate,
  initialEventId,
}: AdminPresaleInjectPageProps): React.JSX.Element {
  // Hanya ambil event bertipe 'presale_cinema' (SSOT dari database, no hardcoded)
  const {
    data: presaleEvents = [],
    isLoading: isLoadingEvents,
    refetch: refetchEvents,
  } = useAdminEventsQuery({
    type: 'presale_cinema',
    per_page: 50,
  });

  // State Seleksi Bertingkat 5-Tier Standar TIX ID (Film -> Venue -> Tanggal -> Studio -> Jam)
  const [selectedEventId, setSelectedEventId] = useState<number | null>(() => {
    if (initialEventId) return initialEventId;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const fromQuery = params.get('eventId');
      if (fromQuery) return Number(fromQuery);
    }
    return null;
  });

  const [selectedVenueId, setSelectedVenueId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedStudio, setSelectedStudio] = useState<string | null>('all');
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);

  // Sinkronisasi saat initialEventId berubah dari navigasi luar (standar React: adjusting state when prop changes)
  const [prevInitialEventId, setPrevInitialEventId] = useState<number | undefined>(initialEventId);
  if (initialEventId !== undefined && initialEventId !== prevInitialEventId) {
    setPrevInitialEventId(initialEventId);
    setSelectedEventId(initialEventId);
    setSelectedVenueId(null);
    setSelectedDate(null);
    setSelectedStudio('all');
    setSelectedScheduleId(null);
  }

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'awaiting' | 'fulfilled'>('all');

  // Modals state
  const [selectedOrderForSingle, setSelectedOrderForSingle] =
    useState<AdminFulfillmentOrder | null>(null);
  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
  const [isSmartDropzoneOpen, setIsSmartDropzoneOpen] = useState(false);
  const [smartPreviewData, setSmartPreviewData] = useState<SmartIngestPreviewResponse | null>(null);
  const [isMatrixModalOpen, setIsMatrixModalOpen] = useState(false);
  const [isBulkCsvModalOpen, setIsBulkCsvModalOpen] = useState(false);

  // Tier 1: Event Presale yang sedang aktif terpilih
  const currentEvent =
    (selectedEventId !== null ? presaleEvents.find((e) => e.id === selectedEventId) : null) ||
    presaleEvents[0] ||
    null;

  // Tier 2: Daftar Venue untuk Event terpilih
  const currentVenues: EventVenueItem[] =
    currentEvent?.venues && currentEvent.venues.length > 0
      ? currentEvent.venues
      : currentEvent
        ? [
            {
              id: 0,
              event_id: currentEvent.id,
              venue_name: currentEvent.venue_name || 'Bioskop Mitra',
              cinema_partner: currentEvent.cinema_partner || null,
              venue_address: currentEvent.venue_address || '-',
              city: currentEvent.city || 'Jakarta',
            },
          ]
        : [];

  const effectiveVenueId =
    (selectedVenueId !== null && currentVenues.some((v) => v.id === selectedVenueId)
      ? selectedVenueId
      : currentVenues[0]?.id) ?? 0;

  const currentVenue =
    currentVenues.find((v) => v.id === effectiveVenueId) || currentVenues[0] || null;

  // Jadwal yang sesuai dengan Venue terpilih
  const venueSchedules = (currentEvent?.schedules || []).filter((s) => {
    if (currentVenues.length <= 1) return true;
    return s.event_venue_id === effectiveVenueId || (!s.event_venue_id && effectiveVenueId === 0);
  });

  // Tier 3: Daftar Tanggal Tayang Unik untuk Venue tersebut
  const availableDates = Array.from(
    new Set(venueSchedules.map((s) => formatShowDateKey(s.show_time)).filter(Boolean))
  ).sort();

  const effectiveDate =
    (selectedDate && availableDates.includes(selectedDate) ? selectedDate : availableDates[0]) ??
    null;

  // Jadwal yang sesuai dengan Tanggal & Venue terpilih
  const dateSchedules = venueSchedules.filter(
    (s) => formatShowDateKey(s.show_time) === effectiveDate
  );

  // Tier 4: Daftar Studio Unik untuk Tanggal & Venue tersebut (Bisa Diklik & Filterable)
  const availableStudios = Array.from(
    new Set(dateSchedules.map((s) => s.studio_name || 'Studio Utama').filter(Boolean))
  ).sort();

  const effectiveStudio =
    selectedStudio && (selectedStudio === 'all' || availableStudios.includes(selectedStudio))
      ? selectedStudio
      : 'all';

  // Jadwal yang difilter berdasarkan Studio (jika studio spesifik dipilih)
  const displayedSchedules =
    effectiveStudio === 'all'
      ? dateSchedules
      : dateSchedules.filter((s) => (s.studio_name || 'Studio Utama') === effectiveStudio);

  // Tier 5: Sesi Jadwal Tayang yang sedang aktif terpilih
  const effectiveScheduleId =
    (selectedScheduleId !== null && displayedSchedules.some((s) => s.id === selectedScheduleId)
      ? selectedScheduleId
      : displayedSchedules[0]?.id) ?? null;

  const currentSchedule =
    displayedSchedules.find((s) => s.id === effectiveScheduleId) || displayedSchedules[0] || null;

  // Pengelompokan Jadwal berdasarkan Studio di Tanggal tersebut
  const studioGroups = displayedSchedules.reduce<Record<string, typeof displayedSchedules>>(
    (acc, sched) => {
      const studio = sched.studio_name || 'Studio Utama';
      if (!acc[studio]) acc[studio] = [];
      acc[studio].push(sched);
      return acc;
    },
    {}
  );

  // Solusi A: Locked Target Context untuk Modal Ingest
  const { dateStr: currentScheduleDateStr, timeStr: currentScheduleTimeStr } = currentSchedule
    ? formatShowTime(currentSchedule.show_time)
    : { dateStr: '-', timeStr: '-' };

  const targetContext: IngestTargetContext | null =
    currentSchedule && currentEvent
      ? {
          eventTitle: currentEvent.title,
          venueName:
            currentSchedule.venue?.venue_name ||
            currentVenue?.venue_name ||
            currentEvent.venue_name,
          studioName: currentSchedule.studio_name || 'Studio 1',
          showTimeStr: `${currentScheduleDateStr} ${currentScheduleTimeStr}`,
        }
      : null;

  // Fulfillment Orders Query (Memanggil GET /admin/schedules/{id}/fulfillment)
  const {
    data: orders = [],
    isLoading: isLoadingOrders,
    isFetching: isFetchingOrders,
    refetch: refetchOrders,
  } = useAdminFulfillmentOrdersQuery(effectiveScheduleId);

  // Filtered orders berdasarkan input pencarian dan filter status
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      searchTerm === '' ||
      o.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.user_phone.includes(searchTerm) ||
      (o.cinema_booking_code &&
        o.cinema_booking_code.toLowerCase().includes(searchTerm.toLowerCase()));

    const isFulfilled = o.fulfillment_status === 'fulfilled';
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'fulfilled' && isFulfilled) ||
      (statusFilter === 'awaiting' && !isFulfilled);

    return matchesSearch && matchesStatus;
  });

  const totalOrders = orders.length;
  const fulfilledCount = orders.filter((o) => o.fulfillment_status === 'fulfilled').length;
  const pendingCount = totalOrders - fulfilledCount;

  const presaleWindowBadge = formatPresaleWindow(
    currentEvent?.presale_start_at,
    currentEvent?.presale_end_at
  );

  const handleOpenSingleInject = (order: AdminFulfillmentOrder) => {
    setSelectedOrderForSingle(order);
    setIsSingleModalOpen(true);
  };

  const handleSmartPreviewSuccess = (preview: SmartIngestPreviewResponse) => {
    setIsSmartDropzoneOpen(false);
    setSmartPreviewData(preview);
    setIsMatrixModalOpen(true);
  };

  const handleRefreshAll = () => {
    void refetchEvents();
    if (effectiveScheduleId) {
      void refetchOrders();
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-extrabold tracking-tight text-white sm:text-2xl">
            Injeksi Tiket Bioskop (Presale Cinema)
          </h1>
          <p className="mt-1 text-xs text-neutral-400">
            Pemenuhan tiket presale cinema partner multi-venue via input manual, upload CSV, atau
            smart ingest PDF/ZIP karcis.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!effectiveScheduleId}
            onClick={() => setIsSmartDropzoneOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0066FF] px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            title={!effectiveScheduleId ? 'Pilih sesi jadwal tayang terlebih dahulu' : ''}
          >
            <Wand2 className="h-4 w-4" />
            <span>Smart Ingest (PDF / ZIP)</span>
          </button>

          <button
            type="button"
            disabled={!effectiveScheduleId}
            onClick={() => setIsBulkCsvModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800 px-3.5 py-2 text-xs font-bold text-neutral-200 transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
            title={!effectiveScheduleId ? 'Pilih sesi jadwal tayang terlebih dahulu' : ''}
          >
            <FileSpreadsheet className="h-4 w-4 text-[#38BDF8]" />
            <span>Upload CSV</span>
          </button>

          <button
            type="button"
            onClick={handleRefreshAll}
            className="rounded-xl border border-neutral-800 bg-[#0B0E14] p-2 text-neutral-400 transition hover:text-white"
            title="Segarkan data event & pesanan"
          >
            <RefreshCw
              className={`h-4 w-4 ${isFetchingOrders || isLoadingEvents ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* 4-Tier Cascading Selector (Standar TIX ID Aggregator) */}
      <div className="space-y-5 rounded-2xl border border-neutral-800 bg-[#0B0E14] p-5 shadow-lg">
        {/* Tier 1: Event Selector & Mini Stats */}
        <div className="flex flex-col gap-4 border-b border-neutral-800/80 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
              <Film className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Tier 1: Pilih Film / Event Presale
                </span>
                <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-blue-400">
                  Presale Cinema
                </span>
                {presaleWindowBadge && (
                  <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-2 py-0.5 text-[9px] font-medium text-amber-300">
                    <CalendarRange className="h-3 w-3" />
                    {presaleWindowBadge}
                  </span>
                )}
              </div>
              <div className="mt-1">
                {isLoadingEvents ? (
                  <div className="flex items-center gap-2 py-1 text-xs text-neutral-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
                    <span>Memuat daftar event presale...</span>
                  </div>
                ) : presaleEvents.length > 0 ? (
                  <select
                    value={currentEvent?.id ?? ''}
                    onChange={(e) => {
                      const newEventId = Number(e.target.value);
                      setSelectedEventId(newEventId);
                      setSelectedVenueId(null);
                      setSelectedDate(null);
                      setSelectedScheduleId(null);
                      if (onNavigate) {
                        onNavigate(`/admin/presale-inject?eventId=${newEventId}`);
                      }
                    }}
                    className="w-full cursor-pointer rounded-lg border border-neutral-800 bg-[#0D111A] px-3 py-1.5 font-display text-sm font-bold text-white transition focus:border-blue-500 focus:outline-none"
                  >
                    {presaleEvents.map((event) => (
                      <option key={event.id} value={event.id} className="bg-neutral-900 text-white">
                        {event.title} • {event.venues?.length || 1} Lokasi Bioskop (
                        {event.cinema_partner || 'Mitra Bioskop'})
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-xs text-neutral-500">
                    Tidak ada event presale bioskop aktif
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Mini Stats Banner */}
          <div className="flex items-center gap-2 self-start lg:self-auto">
            <div className="rounded-xl border border-neutral-800 bg-[#0D111A] px-3.5 py-1.5 text-center">
              <span className="block text-[10px] font-medium text-neutral-400">
                Total Pesanan Sesi
              </span>
              <span className="text-xs font-black text-white">{totalOrders}</span>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3.5 py-1.5 text-center">
              <span className="block text-[10px] font-medium text-amber-400">Belum Diinjeksi</span>
              <span className="text-xs font-black text-amber-400">{pendingCount}</span>
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3.5 py-1.5 text-center">
              <span className="block text-[10px] font-medium text-emerald-400">Terinjeksi</span>
              <span className="text-xs font-black text-emerald-400">{fulfilledCount}</span>
            </div>
          </div>
        </div>

        {/* Tier 2: Lokasi Bioskop / Venue Selector */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-neutral-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Tier 2: Pilih Lokasi Bioskop / Venue
              </span>
            </div>
            <span className="text-[11px] text-neutral-400">
              {currentVenues.length} Lokasi Bioskop Tersedia
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {currentVenues.map((venue) => {
              const isVenueActive = venue.id === effectiveVenueId;
              return (
                <button
                  key={venue.id}
                  type="button"
                  onClick={() => {
                    setSelectedVenueId(venue.id);
                    setSelectedDate(null);
                    setSelectedStudio('all');
                    setSelectedScheduleId(null);
                  }}
                  className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${
                    isVenueActive
                      ? 'border-blue-500 bg-blue-500/10 shadow-sm ring-1 ring-blue-500'
                      : 'border-neutral-800 bg-[#0D111A] hover:border-neutral-700 hover:bg-neutral-800/40'
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition ${
                      isVenueActive ? 'bg-blue-500 text-white' : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-bold text-white">{venue.venue_name}</div>
                    <div className="mt-0.5 flex items-center gap-1 text-[10px] text-neutral-400">
                      <span className="truncate">{venue.city}</span>
                      {venue.cinema_partner && (
                        <>
                          <span>•</span>
                          <span className="text-neutral-500">{venue.cinema_partner}</span>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tier 3: Strip Tanggal Penayangan */}
        {availableDates.length > 0 && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Tier 3: Pilih Tanggal Penayangan
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {availableDates.map((dateKey) => {
                const sampleSched = venueSchedules.find(
                  (s) => formatShowDateKey(s.show_time) === dateKey
                );
                const dateLabel = sampleSched
                  ? formatShowDateLabel(sampleSched.show_time)
                  : dateKey;
                const isDateActive = dateKey === effectiveDate;

                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => {
                      setSelectedDate(dateKey);
                      setSelectedStudio('all');
                      setSelectedScheduleId(null);
                    }}
                    className={`rounded-xl border px-3.5 py-1.5 text-xs font-bold transition ${
                      isDateActive
                        ? 'border-blue-500 bg-blue-500 text-white shadow-sm'
                        : 'border-neutral-800 bg-[#0D111A] text-neutral-300 hover:border-neutral-700 hover:text-white'
                    }`}
                  >
                    {dateLabel}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tier 4: Strip Pilihan Studio (Bisa Diklik & Konsisten) */}
        {availableStudios.length > 0 && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Armchair className="h-3.5 w-3.5 text-neutral-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Tier 4: Pilih Studio Pemutaran
                </span>
              </div>
              <span className="text-[11px] text-neutral-400">
                {availableStudios.length} Studio Terdaftar di Tanggal Ini
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {/* Tombol Semua Studio */}
              <button
                type="button"
                onClick={() => {
                  setSelectedStudio('all');
                  setSelectedScheduleId(null);
                }}
                className={`flex items-center gap-2 rounded-xl border px-3.5 py-1.5 text-xs font-bold transition ${
                  effectiveStudio === 'all'
                    ? 'border-blue-500 bg-blue-500 text-white shadow-sm ring-1 ring-blue-500'
                    : 'border-neutral-800 bg-[#0D111A] text-neutral-300 hover:border-neutral-700 hover:text-white'
                }`}
              >
                <span>Semua Studio</span>
                <span
                  className={`py-0.2 rounded-full px-1.5 text-[10px] font-semibold ${
                    effectiveStudio === 'all'
                      ? 'bg-white/20 text-white'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {dateSchedules.length} Sesi
                </span>
              </button>

              {/* Tombol Tiap Studio (Studio 1, Studio 2, dst) */}
              {availableStudios.map((studioName) => {
                const studioSchedules = dateSchedules.filter(
                  (s) => (s.studio_name || 'Studio Utama') === studioName
                );
                const isStudioActive = effectiveStudio === studioName;

                return (
                  <button
                    key={studioName}
                    type="button"
                    onClick={() => {
                      setSelectedStudio(studioName);
                      const firstSched = studioSchedules[0];
                      if (firstSched) {
                        setSelectedScheduleId(firstSched.id);
                      }
                    }}
                    className={`flex items-center gap-2 rounded-xl border px-3.5 py-1.5 text-xs font-bold transition ${
                      isStudioActive
                        ? 'border-blue-500 bg-blue-500 text-white shadow-sm ring-1 ring-blue-500'
                        : 'border-neutral-800 bg-[#0D111A] text-neutral-300 hover:border-neutral-700 hover:text-white'
                    }`}
                  >
                    <Armchair
                      className={`h-3.5 w-3.5 ${
                        isStudioActive ? 'text-white' : 'text-neutral-400'
                      }`}
                    />
                    <span>{studioName}</span>
                    <span
                      className={`py-0.2 rounded-full px-1.5 text-[10px] font-semibold ${
                        isStudioActive
                          ? 'bg-white/20 text-white'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {studioSchedules.length} Sesi
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tier 5: Jam Tayang & Sesi Aktif Grouping */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-neutral-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Tier 5: Jam Tayang & Sesi Aktif (Anti-Salah Injeksi)
              </span>
            </div>
            {displayedSchedules.length > 0 && (
              <span className="text-[11px] text-neutral-400">
                Tersedia {displayedSchedules.length} Sesi Pemutaran
              </span>
            )}
          </div>

          {Object.keys(studioGroups).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(studioGroups).map(([studioName, schedules]) => (
                <div
                  key={studioName}
                  className="rounded-xl border border-neutral-800/80 bg-[#0D111A]/60 p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Armchair className="h-3.5 w-3.5 text-blue-400" />
                      <span className="font-mono text-xs font-bold text-neutral-200">
                        {studioName}
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-500">
                      {schedules.length} slot jam tayang
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {schedules.map((schedule) => {
                      const isSelected = schedule.id === effectiveScheduleId;
                      const { timeStr } = formatShowTime(schedule.show_time);

                      return (
                        <button
                          key={schedule.id}
                          type="button"
                          onClick={() => setSelectedScheduleId(schedule.id)}
                          className={`group relative flex items-center gap-2 rounded-lg border px-3 py-1.5 text-left transition ${
                            isSelected
                              ? 'border-blue-500 bg-blue-500/20 text-white shadow-sm ring-1 ring-blue-500'
                              : 'border-neutral-800 bg-neutral-900/90 text-neutral-300 hover:border-neutral-700 hover:text-white'
                          }`}
                        >
                          <Clock
                            className={`h-3.5 w-3.5 ${
                              isSelected ? 'text-blue-400' : 'text-neutral-500'
                            }`}
                          />
                          <span className="font-mono text-xs font-bold">{timeStr}</span>
                          <span
                            className={`py-0.2 rounded px-1.5 text-[9px] font-medium ${
                              isSelected
                                ? 'bg-blue-500/30 text-blue-200'
                                : 'bg-neutral-800 text-neutral-400'
                            }`}
                          >
                            {schedule.total_seats} Kursi
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-neutral-800 bg-[#0D111A]/50 p-4 text-center text-xs text-neutral-500">
              {presaleEvents.length === 0
                ? 'Belum ada event presale bioskop aktif di database.'
                : 'Tidak ada sesi jadwal tayang pada studio dan tanggal yang dipilih.'}
            </div>
          )}
        </div>

        {/* Solusi A: Active Session Direct Ingest Banner */}
        {targetContext && (
          <div className="flex flex-col gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 p-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
                <Lock className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-blue-300">
                    Target Sesi Aktif Terkunci:
                  </span>
                  <span className="py-0.2 rounded bg-blue-500/20 px-1.5 font-mono text-[9px] font-bold text-blue-300">
                    ID #{effectiveScheduleId}
                  </span>
                </div>
                <div className="truncate text-xs font-medium text-white">
                  {targetContext.eventTitle} • {targetContext.venueName} •{' '}
                  {targetContext.studioName} ({targetContext.showTimeStr})
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setIsSmartDropzoneOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-blue-500"
              >
                <Wand2 className="h-3.5 w-3.5" />
                <span>Smart Ingest Sesi Ini</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-neutral-800 bg-[#0B0E14] p-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari Order ID, Nama Pemesan, WhatsApp, atau Booking Code..."
            className="w-full rounded-xl border border-neutral-800 bg-[#0D111A] py-2 pl-10 pr-4 text-xs text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-[#0D111A] px-3 py-1.5">
          <Filter className="h-3.5 w-3.5 text-neutral-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'awaiting' | 'fulfilled')}
            className="bg-transparent text-xs text-neutral-300 focus:outline-none"
          >
            <option value="all" className="bg-neutral-900 text-white">
              Semua Status
            </option>
            <option value="awaiting" className="bg-neutral-900 text-white">
              Menunggu Injeksi ({pendingCount})
            </option>
            <option value="fulfilled" className="bg-neutral-900 text-white">
              Terinjeksi ({fulfilledCount})
            </option>
          </select>
        </div>
      </div>

      {/* Main Table: Presale Fulfillment Orders */}
      <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-[#0B0E14] shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-800 bg-[#0D111A] text-neutral-400">
                <th className="px-4 py-3 font-semibold">Order ID</th>
                <th className="px-4 py-3 font-semibold">Penonton</th>
                <th className="px-4 py-3 font-semibold">Kursi</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Status Tiket Bioskop</th>
                <th className="px-4 py-3 font-semibold">Kode Booking Tiket</th>
                <th className="px-4 py-3 font-semibold">Passcode</th>
                <th className="px-4 py-3 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {isLoadingOrders ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-400">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-500" />
                    <p className="mt-2 text-xs">Mengambil data pesanan tiket presale...</p>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-500">
                    <AlertCircle className="mx-auto h-6 w-6 text-neutral-600" />
                    <p className="mt-2 text-xs">
                      {searchTerm
                        ? 'Tidak ada pesanan yang sesuai dengan kata kunci pencarian.'
                        : !effectiveScheduleId
                          ? 'Silakan pilih film dan sesi penayangan bioskop di atas.'
                          : 'Belum ada transaksi tiket paid pada sesi penayangan ini.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isFulfilled = order.fulfillment_status === 'fulfilled';
                  return (
                    <tr key={order.id} className="transition hover:bg-neutral-900/40">
                      <td className="px-4 py-3 font-mono font-bold text-white">{order.order_id}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{order.user_name}</div>
                        <div className="font-mono text-[10px] text-neutral-400">
                          {order.user_phone}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1">
                          <Armchair className="h-3 w-3 text-neutral-400" />
                          <span className="font-mono font-bold text-blue-400">
                            {order.seats.join(', ') || '-'}
                          </span>
                          <span className="text-[10px] text-neutral-500">
                            ({order.ticket_quantity} tiket)
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-neutral-200">
                        Rp {order.net_amount.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3">
                        {isFulfilled ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Terinjeksi</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-400">
                            <Clock className="h-3 w-3" />
                            <span>Menunggu Karcis</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-white">
                        {order.cinema_booking_code || (
                          <span className="font-normal text-neutral-600">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-neutral-300">
                        {order.cinema_passcode || (
                          <span className="font-normal text-neutral-600">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenSingleInject(order)}
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                            isFulfilled
                              ? 'border border-neutral-700 bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                              : 'bg-blue-600 text-white hover:bg-blue-500'
                          }`}
                        >
                          {isFulfilled ? (
                            <>
                              <Edit className="h-3 w-3" />
                              <span>Ubah</span>
                            </>
                          ) : (
                            <>
                              <QrCode className="h-3 w-3" />
                              <span>Injeksi</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals 3 Skema Injeksi */}
      <SingleInjectModal
        order={selectedOrderForSingle}
        isOpen={isSingleModalOpen}
        onClose={() => {
          setIsSingleModalOpen(false);
          setSelectedOrderForSingle(null);
        }}
      />

      {effectiveScheduleId !== null && (
        <>
          <SmartFulfillmentDropzoneModal
            scheduleId={effectiveScheduleId}
            targetContext={targetContext}
            isOpen={isSmartDropzoneOpen}
            onClose={() => setIsSmartDropzoneOpen(false)}
            onPreviewSuccess={handleSmartPreviewSuccess}
          />

          <FulfillmentReviewMatrixModal
            scheduleId={effectiveScheduleId}
            previewData={smartPreviewData}
            isOpen={isMatrixModalOpen}
            onClose={() => {
              setIsMatrixModalOpen(false);
              setSmartPreviewData(null);
            }}
            onConfirmSuccess={() => {
              setIsMatrixModalOpen(false);
              setSmartPreviewData(null);
              void refetchOrders();
            }}
          />

          <BulkInjectCsvModal
            scheduleId={effectiveScheduleId}
            targetContext={targetContext}
            isOpen={isBulkCsvModalOpen}
            onClose={() => setIsBulkCsvModalOpen(false)}
            onSuccess={() => {
              void refetchOrders();
            }}
          />
        </>
      )}
    </div>
  );
}
