import React, { useState, useMemo } from 'react';
import { Calendar, Clock, MapPin, Film, Search, X, CheckCircle2 } from 'lucide-react';
import type { ScannerSessionItem, ScannerGateStatus } from '../../types';

export interface GateSessionPickerProps {
  sessions: ScannerSessionItem[];
  selectedSessionId: number | null;
  onSelectSession: (session: ScannerSessionItem) => void;
  isOpenAsModal?: boolean;
  onCloseModal?: () => void;
  isLoading?: boolean;
  serverTime?: string;
}

interface GroupedSessions {
  dateLabel: string;
  events: {
    eventTitle: string;
    eventId: number;
    posterUrl: string | null;
    venueName: string;
    city: string;
    cinemaPartner?: string | null;
    schedules: ScannerSessionItem[];
  }[];
}

const isSessionToday = (showTime: string, refDateStr?: string): boolean => {
  try {
    const show = new Date(showTime);
    const ref = refDateStr ? new Date(refDateStr) : new Date();
    const showDateKey = show.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
    const refDateKey = ref.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
    return showDateKey === refDateKey;
  } catch {
    return false;
  }
};

const formatWibTime = (isoString: string): string => {
  try {
    const d = new Date(isoString);
    return (
      d.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      }) + ' WIB'
    );
  } catch {
    return isoString;
  }
};

const formatWibDate = (isoString: string): string => {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
};

const getStatusBadge = (status: ScannerGateStatus) => {
  switch (status) {
    case 'open_now':
      return {
        bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        dot: 'bg-emerald-400',
        label: 'BUKA PINTU',
      };
    case 'closing_soon':
      return {
        bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        dot: 'bg-amber-400',
        label: 'TUTUP SEGERA',
      };
    case 'upcoming':
    default:
      return {
        bg: 'bg-neutral-800 text-neutral-400 border-neutral-700',
        dot: 'bg-neutral-500',
        label: 'SEGERA',
      };
  }
};

export function GateSessionPicker({
  sessions,
  selectedSessionId,
  onSelectSession,
  isOpenAsModal = false,
  onCloseModal,
  isLoading = false,
  serverTime,
}: GateSessionPickerProps): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');

  const todayCount = useMemo(() => {
    return sessions.filter((s) => isSessionToday(s.show_time, serverTime)).length;
  }, [sessions, serverTime]);

  const upcomingCount = useMemo(() => {
    return sessions.filter((s) => !isSessionToday(s.show_time, serverTime)).length;
  }, [sessions, serverTime]);

  // Default ke 'today' jika ada sesi hari ini; jika tidak ada, buka 'all'
  const [selectedScope, setSelectedScope] = useState<'all' | 'today' | 'upcoming'>(() => {
    return todayCount > 0 ? 'today' : 'all';
  });

  // Filter berdasarkan pencarian teks dan scope waktu
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const matchSearch =
        !searchQuery.trim() ||
        s.event_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.studio_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.venue_name.toLowerCase().includes(searchQuery.toLowerCase());

      const isToday = isSessionToday(s.show_time, serverTime);
      const matchScope =
        selectedScope === 'all' ? true : selectedScope === 'today' ? isToday : !isToday;

      return matchSearch && matchScope;
    });
  }, [sessions, searchQuery, selectedScope, serverTime]);

  // Grouping hierarkis: Tanggal -> Event -> Sesi Jadwal (Zero Repetition)
  const groupedData: GroupedSessions[] = useMemo(() => {
    const dateMap = new Map<
      string,
      Map<
        number,
        {
          eventTitle: string;
          posterUrl: string | null;
          venueName: string;
          city: string;
          cinemaPartner?: string | null;
          schedules: ScannerSessionItem[];
        }
      >
    >();

    for (const s of filteredSessions) {
      const dateKey = formatWibDate(s.show_time);
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, new Map());
      }
      const eventMap = dateMap.get(dateKey)!;

      if (!eventMap.has(s.event_id)) {
        eventMap.set(s.event_id, {
          eventTitle: s.event_title,
          posterUrl: s.poster_url,
          venueName: s.venue_name,
          city: s.city,
          cinemaPartner: s.cinema_partner,
          schedules: [],
        });
      }

      eventMap.get(s.event_id)!.schedules.push(s);
    }

    const result: GroupedSessions[] = [];
    dateMap.forEach((eventMap, dateLabel) => {
      const events: GroupedSessions['events'] = [];
      eventMap.forEach((evt, eventId) => {
        // Urutkan jadwal per event berdasarkan jam tayang
        evt.schedules.sort(
          (a, b) => new Date(a.show_time).getTime() - new Date(b.show_time).getTime()
        );
        events.push({
          eventId,
          eventTitle: evt.eventTitle,
          posterUrl: evt.posterUrl,
          venueName: evt.venueName,
          city: evt.city,
          cinemaPartner: evt.cinemaPartner,
          schedules: evt.schedules,
        });
      });
      result.push({ dateLabel, events });
    });

    return result;
  }, [filteredSessions]);

  const content = (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-white">
            Pilih Sesi Gerbang Masuk
          </h2>
          <p className="text-[11px] text-neutral-400">
            Pilih sesi yang dijaga untuk mengaktifkan validasi Strict Gate
          </p>
        </div>
        {isOpenAsModal && onCloseModal && (
          <button
            type="button"
            onClick={onCloseModal}
            className="rounded-lg border border-neutral-800 bg-[#0D111A] p-1.5 text-neutral-400 hover:bg-[#131926] hover:text-white"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Segmented Scope Filter (Semua vs Hari Ini vs Mendatang) */}
      <div className="flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-[#0D111A] p-1">
        <button
          type="button"
          onClick={() => setSelectedScope('all')}
          className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition ${
            selectedScope === 'all'
              ? 'bg-[#0066FF] text-white'
              : 'text-neutral-400 hover:bg-[#131926] hover:text-white'
          }`}
        >
          Semua ({sessions.length})
        </button>
        <button
          type="button"
          onClick={() => setSelectedScope('today')}
          className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition ${
            selectedScope === 'today'
              ? 'bg-[#0066FF] text-white'
              : 'text-neutral-400 hover:bg-[#131926] hover:text-white'
          }`}
        >
          Hari Ini ({todayCount})
        </button>
        <button
          type="button"
          onClick={() => setSelectedScope('upcoming')}
          className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition ${
            selectedScope === 'upcoming'
              ? 'bg-[#0066FF] text-white'
              : 'text-neutral-400 hover:bg-[#131926] hover:text-white'
          }`}
        >
          Mendatang ({upcomingCount})
        </button>
      </div>

      {/* Search Bar */}
      {sessions.length > 3 && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari film, studio, atau venue..."
            className="w-full rounded-xl border border-neutral-800 bg-[#0D111A] py-2 pl-9 pr-3 text-xs text-white placeholder-neutral-500 transition focus:border-[#0066FF] focus:outline-none focus:ring-1 focus:ring-[#0066FF]"
          />
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-28 w-full animate-pulse rounded-2xl border border-neutral-800 bg-[#0D111A]"
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && groupedData.length === 0 && (
        <div className="rounded-2xl border border-neutral-800 bg-[#0D111A] p-6 text-center">
          <Film className="mx-auto mb-2 h-6 w-6 text-neutral-500" />
          <p className="text-xs font-semibold text-white">Tidak Ada Sesi di Kategori Ini</p>
          <p className="mt-1 text-[11px] leading-relaxed text-neutral-400">
            {selectedScope === 'today'
              ? 'Tidak ada screening reguler aktif yang dijadwalkan hari ini.'
              : selectedScope === 'upcoming'
                ? 'Belum ada jadwal screening reguler di hari mendatang.'
                : 'Tidak ada sesi screening yang cocok dengan pencarian.'}
          </p>
          {selectedScope === 'today' && upcomingCount > 0 && (
            <button
              type="button"
              onClick={() => setSelectedScope('upcoming')}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#0066FF] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#0052D4] active:scale-95"
            >
              Lihat Jadwal Mendatang ({upcomingCount})
            </button>
          )}
        </div>
      )}

      {/* Grouped Lists (Date -> Event -> Session Pills) */}
      {!isLoading && (
        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
          {groupedData.map((group) => (
            <div key={group.dateLabel} className="space-y-2">
              {/* Date Header Badge */}
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-400">
                <Calendar className="h-3 w-3 text-neutral-400" />
                <span className="font-semibold text-neutral-300">{group.dateLabel}</span>
              </div>

              {/* Event Cards */}
              <div className="space-y-2.5">
                {group.events.map((evt) => (
                  <div
                    key={evt.eventId}
                    className="overflow-hidden rounded-2xl border border-neutral-800 bg-[#0D111A] p-3.5 transition hover:border-neutral-700"
                  >
                    {/* Event Meta Header (Read Once) */}
                    <div className="flex items-start gap-3 border-b border-neutral-800/80 pb-2.5">
                      {evt.posterUrl ? (
                        <img
                          src={evt.posterUrl}
                          alt={evt.eventTitle}
                          className="h-11 w-8 shrink-0 rounded-md object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-11 w-8 shrink-0 items-center justify-center rounded-md border border-neutral-800 bg-[#0B0E14] text-neutral-500">
                          <Film className="h-4 w-4" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-xs font-semibold text-white">
                          {evt.eventTitle}
                        </h3>
                        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-neutral-400">
                          <MapPin className="h-3 w-3 shrink-0 text-neutral-400" />
                          <span className="truncate">
                            {evt.venueName}
                            {evt.city ? ` · ${evt.city}` : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Sesi Screening Pills Grid */}
                    <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {evt.schedules.map((schedule) => {
                        const isSelected = selectedSessionId === schedule.id;
                        const badge = getStatusBadge(schedule.gate_status);

                        return (
                          <button
                            key={schedule.id}
                            type="button"
                            onClick={() => {
                              onSelectSession(schedule);
                              if (onCloseModal) onCloseModal();
                            }}
                            className={`group relative flex flex-col justify-between rounded-xl border p-2.5 text-left transition active:scale-[0.98] ${
                              isSelected
                                ? 'border-[#0066FF] bg-[#0066FF]/10 shadow-sm'
                                : 'border-neutral-800 bg-[#0B0E14] hover:border-neutral-700 hover:bg-[#131926]'
                            }`}
                          >
                            {/* Top row: Jam & Status */}
                            <div className="flex items-center justify-between gap-1">
                              <div className="flex items-center gap-1 font-mono text-xs font-bold text-white">
                                <Clock className="h-3 w-3 text-neutral-400" />
                                <span>{formatWibTime(schedule.show_time)}</span>
                              </div>
                              <span
                                className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase ${badge.bg}`}
                              >
                                <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                                <span>{badge.label}</span>
                              </span>
                            </div>

                            {/* Middle: Studio & Checkin stats */}
                            <div className="mt-1.5 flex items-center justify-between text-[11px]">
                              <span className="font-medium text-neutral-300">
                                {schedule.studio_name}
                              </span>
                              <span className="font-mono tabular-nums text-neutral-400">
                                <strong className="text-white">{schedule.checked_in_count}</strong>/
                                {schedule.tickets_sold} masuk
                              </span>
                            </div>

                            {/* Selected Indicator */}
                            {isSelected && (
                              <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-[#0066FF]">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Gerbang Terpilih Aktif</span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (isOpenAsModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-4">
        <div className="w-full max-w-lg rounded-t-3xl border border-neutral-800 bg-[#0B0E14] p-4 shadow-2xl sm:rounded-2xl sm:p-5">
          {content}
        </div>
      </div>
    );
  }

  return <div className="rounded-2xl border border-neutral-800 bg-[#0B0E14] p-4">{content}</div>;
}
