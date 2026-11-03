import React, { useState } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  Sparkles,
  CircleDashed,
  ShieldAlert,
  ArrowRight,
  Clock,
  AlertCircle,
  Armchair,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useAdminEventsQuery,
  useDeleteEventMutation,
  EventVenueCell,
  type AdminEventItem,
} from '@/features/admin';
import { formatMovieDuration } from '@/features/events';

export interface AdminEventsPageProps {
  onNavigate: (path: string) => void;
}

export function AdminEventsPage({ onNavigate }: AdminEventsPageProps): React.JSX.Element {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeatingType, setSelectedSeatingType] = useState<
    'all' | 'assigned_seating' | 'general_admission'
  >('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [deletingEvent, setDeletingEvent] = useState<AdminEventItem | null>(null);
  const [protectedEvent, setProtectedEvent] = useState<AdminEventItem | null>(null);

  const { data: events = [], isLoading } = useAdminEventsQuery({
    search: searchTerm,
    seating_type: selectedSeatingType,
    status: selectedStatus,
  });

  const deleteMutation = useDeleteEventMutation();

  const handleDeleteConfirm = async () => {
    if (!deletingEvent) return;

    try {
      await deleteMutation.mutateAsync(deletingEvent.id);
      toast.success(`Event "${deletingEvent.title}" berhasil dihapus.`);
      setDeletingEvent(null);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      const errorMessage =
        axiosError?.response?.data?.message ||
        'Gagal menghapus event. Pastikan belum ada transaksi tiket lunas.';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-extrabold tracking-tight text-white sm:text-2xl">
            Manajemen Event & Screening
          </h1>
          <p className="mt-1 text-xs text-neutral-400">
            Jadwal penayangan screening, konfigurasi studio seat map, dan kapasitas tiket.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('/admin/events/new')}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#0066FF] px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-blue-600 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Buat Event Baru
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-neutral-800 bg-[#0B0E14] p-3 text-xs sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan judul event, bioskop, atau kota..."
            className="w-full rounded-xl border border-neutral-800 bg-[#0D111A] py-2 pl-9 pr-4 text-xs text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          {/* Seating Type Filter Tabs */}
          <div className="flex w-full overflow-x-auto rounded-xl border border-neutral-800 bg-[#0D111A] p-1 sm:w-auto">
            <button
              type="button"
              onClick={() => setSelectedSeatingType('all')}
              className={`flex-1 rounded-lg px-3 py-1.5 font-bold transition-colors sm:flex-none ${
                selectedSeatingType === 'all'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Semua Tipe
            </button>
            <button
              type="button"
              onClick={() => setSelectedSeatingType('assigned_seating')}
              className={`flex-1 rounded-lg px-3 py-1.5 font-bold transition-colors sm:flex-none ${
                selectedSeatingType === 'assigned_seating'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Pilih Kursi
            </button>
            <button
              type="button"
              onClick={() => setSelectedSeatingType('general_admission')}
              className={`flex-1 rounded-lg px-3 py-1.5 font-bold transition-colors sm:flex-none ${
                selectedSeatingType === 'general_admission'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Bebas Duduk
            </button>
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as typeof selectedStatus)}
            className="w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3 py-2 text-xs text-neutral-300 focus:border-blue-500 focus:outline-none sm:w-auto"
          >
            <option value="all">Semua Status</option>
            <option value="published">Dipublikasikan (Live)</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Events Table Card */}
      <div className="rounded-2xl border border-neutral-800 bg-[#0B0E14]">
        <div className="overflow-x-auto md:overflow-visible">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="rounded-t-2xl border-b border-neutral-800 bg-[#0D111A] text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              <tr>
                <th className="rounded-tl-2xl px-6 py-4">Poster & Judul Event</th>
                <th className="px-4 py-4">Tipe Penayangan</th>
                <th className="px-4 py-4">Venue & Kota</th>
                <th className="px-4 py-4">Okupansi Kursi</th>
                <th className="px-4 py-4">Status</th>
                <th className="rounded-tr-2xl px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80 text-neutral-300">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-neutral-500">
                    Memuat katalog event admin...
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-neutral-500">
                    Tidak ada event yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                events.map((event, index) => {
                  const booked = event.total_booked ?? event.metrics?.total_tickets_sold ?? 0;
                  const capacity = event.total_capacity ?? event.metrics?.total_seats_capacity ?? 1;
                  const locked = event.total_locked ?? event.metrics?.total_seats_locked ?? 0;
                  const rawRate =
                    typeof event.occupancy_rate === 'number'
                      ? event.occupancy_rate
                      : typeof event.metrics?.occupancy_percentage === 'number'
                        ? event.metrics.occupancy_percentage
                        : capacity > 0
                          ? Number(((booked / capacity) * 100).toFixed(1))
                          : 0;
                  const formattedRate = rawRate % 1 === 0 ? rawRate.toFixed(0) : rawRate.toFixed(1);
                  const isPublished = event.is_published ?? event.is_active ?? false;
                  const openUpward =
                    index > 0 && (index >= events.length - 2 || events.length <= 4);

                  return (
                    <tr key={event.id} className="transition-colors hover:bg-neutral-900/40">
                      {/* Title & Poster */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={event.poster_url}
                            alt={event.title}
                            className="h-16 w-11 flex-shrink-0 rounded-lg border border-neutral-800 object-cover"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="line-clamp-1 font-display text-sm font-extrabold text-white">
                                {event.title}
                              </h4>
                              {event.is_featured && (
                                <span className="inline-flex items-center gap-0.5 rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-400">
                                  <Sparkles className="h-2.5 w-2.5" />
                                  Pilihan
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-[11px] text-neutral-400">
                              Sutradara: {event.director || '-'}
                            </p>

                            {/* Film Specifications Row: [ 13+ ] • 2024 • 2j 15m • Drama, Sejarah */}
                            {(event.age_rating ||
                              event.release_year ||
                              event.duration_minutes ||
                              (event.genre && event.genre.length > 0)) && (
                              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-neutral-400">
                                {event.age_rating && (
                                  <span className="py-0.2 rounded border border-neutral-700 bg-neutral-900 px-1.5 font-mono text-[9px] font-bold text-neutral-200">
                                    {event.age_rating}
                                  </span>
                                )}
                                {event.release_year && (
                                  <>
                                    {event.age_rating && (
                                      <span className="text-neutral-600">•</span>
                                    )}
                                    <span className="font-semibold text-neutral-300">
                                      {event.release_year}
                                    </span>
                                  </>
                                )}
                                {event.duration_minutes ? (
                                  <>
                                    {(event.age_rating || event.release_year) && (
                                      <span className="text-neutral-600">•</span>
                                    )}
                                    <span className="font-medium text-neutral-300">
                                      {formatMovieDuration(event.duration_minutes)}
                                    </span>
                                  </>
                                ) : null}
                                {event.genre && event.genre.length > 0 && (
                                  <>
                                    {(event.age_rating ||
                                      event.release_year ||
                                      event.duration_minutes) && (
                                      <span className="text-neutral-600">•</span>
                                    )}
                                    <span className="max-w-[160px] truncate font-medium text-neutral-300">
                                      {Array.isArray(event.genre)
                                        ? event.genre.slice(0, 2).join(', ')
                                        : event.genre}
                                    </span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Seating Type Badge (Kursi vs Non-Kursi) */}
                      <td className="px-4 py-4">
                        {event.seating_type === 'general_admission' ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-400">
                            <Users className="h-3 w-3" />
                            Bebas Duduk
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-blue-400">
                            <Armchair className="h-3 w-3" />
                            Pilih Kursi
                          </span>
                        )}
                        <span className="mt-1 block text-[10px] text-neutral-500">
                          {event.schedules?.length || 0} Sesi Pemutaran
                        </span>
                      </td>

                      {/* Venue & City */}
                      <td className="px-4 py-4">
                        <EventVenueCell event={event} openUpward={true} />
                      </td>

                      {/* Occupancy Rate Bar */}
                      <td className="px-4 py-4">
                        <div className="group/occ relative">
                          <div className="mb-1 flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white">{formattedRate}%</span>
                              {locked > 0 && (
                                <span
                                  title={`${locked} kursi sedang dalam proses checkout antrean`}
                                  className="inline-flex items-center rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-amber-400"
                                >
                                  +{locked} kunci
                                </span>
                              )}
                            </div>
                            <span className="text-neutral-500">
                              {booked}/{capacity} Kursi
                            </span>
                          </div>
                          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-neutral-800">
                            <div
                              className={`h-full rounded-full transition-all ${
                                rawRate > 80 ? 'bg-emerald-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${Math.min(rawRate, 100)}%` }}
                            />
                          </div>

                          {/* Minimalist Responsive Hover Tooltip Breakdown per Sesi Jadwal */}
                          {event.schedules && event.schedules.length > 0 && (
                            <div
                              className={`pointer-events-none absolute left-0 z-50 w-56 rounded-xl border border-neutral-800/80 bg-[#0D111A]/95 p-2 shadow-2xl backdrop-blur-md transition-all duration-200 ${
                                openUpward
                                  ? 'bottom-full mb-2 origin-bottom'
                                  : 'top-full mt-2 origin-top'
                              } scale-95 opacity-0 group-hover/occ:scale-100 group-hover/occ:opacity-100`}
                            >
                              {/* Indicator Arrow */}
                              <div
                                className={`absolute left-6 h-2 w-2 rotate-45 bg-[#0D111A] ${
                                  openUpward
                                    ? '-bottom-1 border-b border-r border-neutral-800/80'
                                    : '-top-1 border-l border-t border-neutral-800/80'
                                }`}
                              />

                              {/* Minimalist Header */}
                              <div className="mb-1.5 flex items-center justify-between border-b border-neutral-800/60 pb-1 text-[9px] uppercase tracking-wider text-neutral-400">
                                <span className="font-semibold">Rincian Sesi</span>
                                <span className="font-mono text-neutral-500">
                                  {event.schedules.length} Sesi
                                </span>
                              </div>

                              {/* Compact Schedules List */}
                              <div className="max-h-40 space-y-1 overflow-y-auto pr-0.5">
                                {event.schedules.map((sch) => {
                                  const schBooked = sch.booked_seats_count ?? sch.booked_count ?? 0;
                                  const schCap = sch.total_seats || 1;
                                  const schRate =
                                    schCap > 0 ? Math.round((schBooked / schCap) * 100) : 0;
                                  const schTime = sch.show_time
                                    ? new Date(sch.show_time).toLocaleTimeString('id-ID', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })
                                    : '-';

                                  return (
                                    <div
                                      key={sch.id}
                                      className="flex items-center justify-between rounded-lg bg-neutral-900/60 px-2 py-1 text-[10px]"
                                    >
                                      <div className="flex min-w-0 items-center gap-1.5 pr-2">
                                        <span
                                          className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${
                                            schRate > 50
                                              ? 'bg-emerald-500'
                                              : schBooked > 0
                                                ? 'bg-blue-500'
                                                : 'bg-neutral-600'
                                          }`}
                                        />
                                        <span className="truncate font-medium text-neutral-300">
                                          {sch.studio_name || 'Studio'}
                                        </span>
                                        <span className="flex-shrink-0 text-[9px] text-neutral-500">
                                          {schTime}
                                        </span>
                                      </div>
                                      <span className="flex-shrink-0 font-mono text-[9px] text-neutral-400">
                                        {schBooked}/{schCap}{' '}
                                        <span
                                          className={
                                            schRate > 50
                                              ? 'font-bold text-emerald-400'
                                              : schBooked > 0
                                                ? 'font-medium text-neutral-300'
                                                : 'text-neutral-500'
                                          }
                                        >
                                          ({schRate}%)
                                        </span>
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status & Lifecycle Window */}
                      <td className="px-4 py-4">
                        {(() => {
                          const now = Date.now();
                          const salesEnd = event.sales_end_at;
                          const salesStart = event.sales_start_at;
                          const concludesAt = event.event_concludes_at;
                          const displayEndDate = concludesAt || salesEnd;

                          const salesEndTime = salesEnd ? new Date(salesEnd).getTime() : null;
                          const salesStartTime = salesStart ? new Date(salesStart).getTime() : null;
                          const concludesTime = concludesAt
                            ? new Date(concludesAt).getTime()
                            : null;

                          const isSalesUpcoming = salesStartTime && now < salesStartTime;
                          const isSalesEnded = salesEndTime && now > salesEndTime;
                          const isConcluded = concludesTime ? now > concludesTime : isSalesEnded;

                          const formatDateShort = (isoStr: string) => {
                            try {
                              const d = new Date(isoStr);
                              return new Intl.DateTimeFormat('id-ID', {
                                timeZone: 'Asia/Jakarta',
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              }).format(d);
                            } catch {
                              return isoStr;
                            }
                          };

                          if (!isPublished) {
                            return (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 rounded-full bg-neutral-800 px-2.5 py-0.5 text-[10px] font-bold text-neutral-400">
                                  <CircleDashed className="h-3 w-3" />
                                  Draft Manual
                                </span>
                                <span className="block text-[10px] text-neutral-500">
                                  Tidak aktif di publik
                                </span>
                              </div>
                            );
                          }

                          if (isConcluded) {
                            return (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-bold text-rose-400">
                                  <AlertCircle className="h-3 w-3" />
                                  Selesai (Auto-Draft)
                                </span>
                                {concludesAt && (
                                  <span className="block text-[10px] text-neutral-500">
                                    Selesai: {formatDateShort(concludesAt)} WIB
                                  </span>
                                )}
                              </div>
                            );
                          }

                          if (isSalesEnded) {
                            return (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-400">
                                  <Clock className="h-3 w-3" />
                                  Tiket Ditutup
                                </span>
                                {concludesAt ? (
                                  <span className="block text-[10px] text-neutral-400">
                                    Acara s/d {formatDateShort(concludesAt)} WIB
                                  </span>
                                ) : (
                                  <span className="block text-[10px] text-neutral-400">
                                    Menjelang Tayang
                                  </span>
                                )}
                              </div>
                            );
                          }

                          if (isSalesUpcoming) {
                            return (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold text-blue-400">
                                  <Clock className="h-3 w-3" />
                                  Mendatang
                                </span>
                                {salesStart && (
                                  <span className="block text-[10px] text-neutral-500">
                                    Buka: {formatDateShort(salesStart)} WIB
                                  </span>
                                )}
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                                <CheckCircle2 className="h-3 w-3" />
                                Live Aktif
                              </span>
                              {displayEndDate && (
                                <span className="block text-[10px] text-neutral-400">
                                  s/d {formatDateShort(displayEndDate)} WIB
                                </span>
                              )}
                              {salesEnd && concludesAt && salesEnd !== concludesAt && (
                                <span className="block text-[9px] text-neutral-500">
                                  Tiket: s/d {formatDateShort(salesEnd)} WIB
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => onNavigate(`/admin/events/${event.id}/edit`)}
                            className="rounded-lg border border-neutral-800 bg-[#0D111A] p-2 text-neutral-300 transition-colors hover:border-neutral-700 hover:text-white"
                            title="Edit Event & Denah"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>

                          {/* Delete Button */}
                          {booked > 0 ? (
                            <button
                              type="button"
                              onClick={() => setProtectedEvent(event)}
                              className="rounded-lg border border-neutral-800 bg-[#0D111A] p-2 text-neutral-500 transition-colors hover:border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-400"
                              title={`Event memiliki ${booked} tiket terjual (Dilindungi). Klik untuk info & opsi draf.`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeletingEvent(event)}
                              className="rounded-lg border border-neutral-800 bg-[#0D111A] p-2 text-neutral-500 transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                              title="Hapus Event"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal (Aman: 0 Tiket Terjual) */}
      {deletingEvent && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-[#0B0E14] p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-white">
                  Hapus Event Penayangan?
                </h3>
                <p className="text-[11px] text-neutral-400">
                  Tindakan ini permanen dan tidak dapat dibatalkan
                </p>
              </div>
            </div>

            {/* Event Summary Card */}
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-neutral-800/80 bg-[#0D111A] p-3">
              <img
                src={deletingEvent.poster_url}
                alt={deletingEvent.title}
                className="h-16 w-11 flex-shrink-0 rounded-lg border border-neutral-800 object-cover"
              />
              <div className="min-w-0 flex-1 space-y-1 text-xs">
                <h4 className="line-clamp-1 font-bold text-white">{deletingEvent.title}</h4>
                <p className="truncate text-[11px] text-neutral-400">
                  {deletingEvent.venues && deletingEvent.venues.length > 1
                    ? `${deletingEvent.venues[0].venue_name} (+${deletingEvent.venues.length - 1} bioskop lain)`
                    : `${deletingEvent.venue_name}, ${deletingEvent.city}`}
                </p>
                <div className="flex items-center gap-2 pt-0.5 text-[10px] text-neutral-400">
                  <span>{deletingEvent.schedules?.length || 0} Sesi Jadwal</span>
                  <span>•</span>
                  <span className="font-semibold text-emerald-400">
                    0 Tiket Terjual (Aman Dihapus)
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-4 text-xs text-neutral-400">
              Seluruh sesi penayangan, denah kursi, dan berkas poster di storage Cloudflare akan
              dihapus bersih dari sistem.
            </p>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingEvent(null)}
                disabled={deleteMutation.isPending}
                className="rounded-xl border border-neutral-800 px-4 py-2 text-xs font-semibold text-neutral-400 hover:bg-neutral-800 hover:text-white"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Menghapus...' : 'Ya, Hapus Permanen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Protected Event Modal (Dilindungi: Ada Tiket Terjual) */}
      {protectedEvent && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-amber-500/30 bg-[#0B0E14] p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-white">
                  Event Dilindungi dari Penghapusan
                </h3>
                <p className="text-[11px] text-amber-400/80">
                  Proteksi hak penonton & audit finansial
                </p>
              </div>
            </div>

            {/* Event Summary Card */}
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-neutral-800 bg-[#0D111A] p-3">
              <img
                src={protectedEvent.poster_url}
                alt={protectedEvent.title}
                className="h-16 w-11 flex-shrink-0 rounded-lg border border-neutral-800 object-cover"
              />
              <div className="min-w-0 flex-1 space-y-1 text-xs">
                <h4 className="line-clamp-1 font-bold text-white">{protectedEvent.title}</h4>
                <p className="truncate text-[11px] text-neutral-400">
                  {protectedEvent.venues && protectedEvent.venues.length > 1
                    ? `${protectedEvent.venues[0].venue_name} (+${protectedEvent.venues.length - 1} bioskop lain)`
                    : `${protectedEvent.venue_name}, ${protectedEvent.city}`}
                </p>
                <div className="flex items-center gap-2 pt-0.5 text-[10px]">
                  <span className="rounded bg-amber-500/20 px-1.5 py-0.5 font-bold text-amber-400">
                    {protectedEvent.total_booked ?? protectedEvent.metrics?.total_tickets_sold ?? 0}{' '}
                    Tiket Terjual
                  </span>
                  <span className="text-neutral-500">
                    {protectedEvent.occupancy_rate ??
                      protectedEvent.metrics?.occupancy_percentage ??
                      0}
                    % Terisi
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-neutral-800/80 bg-neutral-900/50 p-3.5 text-xs text-neutral-300">
              <p className="font-semibold text-white">Mengapa tidak dapat dihapus?</p>
              <p className="mt-1 text-[11px] leading-relaxed text-neutral-400">
                Event ini memiliki transaksi tiket penonton yang sah. Menghapus event akan merusak
                riwayat tiket, e-tiket penonton, dan verifikasi QR scanner di bioskop.
              </p>
              <div className="mt-2.5 rounded-lg border border-blue-500/20 bg-blue-500/10 p-2 text-[11px] text-blue-300">
                💡 <strong>Solusi:</strong> Jika ingin menutup penjualan, ubah status publikasi
                menjadi <strong>Draf</strong>.
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setProtectedEvent(null)}
                className="rounded-xl border border-neutral-800 px-3.5 py-2 text-xs font-semibold text-neutral-400 hover:bg-neutral-800 hover:text-white"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = protectedEvent.id;
                  setProtectedEvent(null);
                  onNavigate(`/admin/events/${id}/edit`);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500"
              >
                <span>Edit ke Status Draf</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
