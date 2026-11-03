import React, { useMemo } from 'react';
import { AlertCircle, MapPin, ExternalLink, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EventVenueItem, ScheduleItem } from '../types';

export interface ScheduleSelectorProps {
  venues?: EventVenueItem[];
  schedules: ScheduleItem[];
  selectedVenueId?: number | null;
  onSelectVenue?: (venueId: number) => void;
  selectedDate?: string | null;
  onSelectDate?: (date: string) => void;
  selectedScheduleId?: number | null;
  onSelectSchedule: (schedule: ScheduleItem) => void;
  className?: string;
}

interface DateSlot {
  dateKey: string;
  dayLabel: string;
  dateLabel: string;
  fullDateStr: string;
}

export const ScheduleSelector: React.FC<ScheduleSelectorProps> = ({
  venues = [],
  schedules = [],
  selectedVenueId = null,
  onSelectVenue,
  selectedDate = null,
  onSelectDate,
  selectedScheduleId = null,
  onSelectSchedule,
  className,
}) => {
  // 1. Ekstraksi dan Konsolidasi Daftar Venue (Multi-Venue SSOT)
  const effectiveVenues = useMemo<EventVenueItem[]>(() => {
    if (venues && venues.length > 0) {
      return venues;
    }
    // Fallback: Ekstraksi unik dari schedules jika prop venues tidak dipass
    const venueMap = new Map<number, EventVenueItem>();
    schedules.forEach((s) => {
      if (s.venue && !venueMap.has(s.venue.id)) {
        venueMap.set(s.venue.id, s.venue);
      }
    });

    if (venueMap.size > 0) {
      return Array.from(venueMap.values());
    }

    // Default Fallback
    return [
      {
        id: 1,
        event_id: 0,
        venue_name: 'Studio Cinema Partner',
        cinema_partner: 'Cinema Partner',
        venue_address: 'Lokasi penayangan resmi',
        city: 'Indonesia',
        google_maps_url: null,
      },
    ];
  }, [venues, schedules]);

  // Venue Aktif Terpilih
  const activeVenueId =
    (selectedVenueId && effectiveVenues.some((v) => v.id === selectedVenueId)
      ? selectedVenueId
      : effectiveVenues[0]?.id) ?? 1;

  const activeVenue = useMemo(
    () => effectiveVenues.find((v) => v.id === activeVenueId) || effectiveVenues[0],
    [effectiveVenues, activeVenueId]
  );

  // 2. Filter Jadwal yang Sesuai dengan Venue Terpilih
  const venueSchedules = useMemo(() => {
    if (effectiveVenues.length <= 1) {
      return schedules;
    }
    const matched = schedules.filter(
      (s) => s.event_venue_id === activeVenueId || s.venue?.id === activeVenueId
    );
    return matched.length > 0 ? matched : schedules;
  }, [schedules, activeVenueId, effectiveVenues.length]);

  // 3. Ekstraksi Tanggal Unik untuk Venue Tersebut (Sorted Ascending)
  const availableDates = useMemo<DateSlot[]>(() => {
    const dateMap = new Map<string, DateSlot>();
    const dayFormatter = new Intl.DateTimeFormat('id-ID', { weekday: 'short' });
    const dayMonthFormatter = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' });
    const fullDateFormatter = new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    venueSchedules.forEach((s) => {
      const datePart = s.show_time.split('T')[0];
      if (!dateMap.has(datePart)) {
        const d = new Date(datePart + 'T00:00:00');
        dateMap.set(datePart, {
          dateKey: datePart,
          dayLabel: dayFormatter.format(d).toUpperCase(),
          dateLabel: dayMonthFormatter.format(d).toUpperCase(),
          fullDateStr: fullDateFormatter.format(d),
        });
      }
    });

    return Array.from(dateMap.values()).sort(
      (a, b) => new Date(a.dateKey).getTime() - new Date(b.dateKey).getTime()
    );
  }, [venueSchedules]);

  // Tanggal Aktif Terpilih
  const activeDateKey =
    (selectedDate && availableDates.some((d) => d.dateKey === selectedDate)
      ? selectedDate
      : availableDates[0]?.dateKey) ?? null;

  // 4. Filter Jadwal yang Sesuai dengan Tanggal Terpilih (Sorted by time)
  const dateSchedules = useMemo(() => {
    if (!activeDateKey) return [];
    return venueSchedules
      .filter((s) => s.show_time.split('T')[0] === activeDateKey)
      .sort((a, b) => new Date(a.show_time).getTime() - new Date(b.show_time).getTime());
  }, [venueSchedules, activeDateKey]);

  // 5. Ekstraksi Studio yang Memiliki Jadwal di Tanggal Ini
  const studiosOnDate = useMemo(() => {
    const map = new Map<string, ScheduleItem[]>();
    dateSchedules.forEach((s) => {
      const stName = s.studio_name || 'Studio 1';
      if (!map.has(stName)) {
        map.set(stName, []);
      }
      map.get(stName)?.push(s);
    });

    return Array.from(map.entries()).map(([studioName, items]) => {
      const basePrice = items[0]?.ticket_price || 0;
      const vipItem = items.find(
        (s) => s.vip_ticket_price !== null && s.vip_ticket_price !== undefined
      );
      return {
        studioName,
        items,
        basePrice,
        vipPrice: vipItem?.vip_ticket_price,
        hasVipPrice: !!vipItem,
      };
    });
  }, [dateSchedules]);

  // Studio Aktif Terpilih di Tanggal Ini (SSOT)
  const activeStudioName = useMemo(() => {
    if (studiosOnDate.length === 0) return null;
    const activeBySchedule = studiosOnDate.find((g) =>
      g.items.some((s) => s.id === selectedScheduleId)
    );
    if (activeBySchedule) {
      return activeBySchedule.studioName;
    }
    return studiosOnDate[0].studioName;
  }, [studiosOnDate, selectedScheduleId]);

  // Jadwal Khusus untuk Studio Aktif Terpilih di Tanggal Ini
  const activeStudioGroup = useMemo(() => {
    return studiosOnDate.find((g) => g.studioName === activeStudioName) || studiosOnDate[0] || null;
  }, [studiosOnDate, activeStudioName]);

  if (!schedules || schedules.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 text-xs text-neutral-400">
        <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
        <span>Belum ada jadwal penayangan yang tersedia untuk event ini.</span>
      </div>
    );
  }

  const formatTimeSlot = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes} WIB`;
    } catch {
      return isoString;
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* 1. LOKASI BIOSKOP / VENUE */}
      <div>
        {effectiveVenues.length > 1 ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Pilih Lokasi Bioskop
              </label>
              <span className="text-[10px] text-neutral-500">
                {effectiveVenues.length} Lokasi Tersedia
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {effectiveVenues.map((v) => {
                const isVenueSelected = v.id === activeVenueId;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      onSelectVenue?.(v.id);
                      const newVenueSchedules = schedules.filter(
                        (s) => s.event_venue_id === v.id || s.venue?.id === v.id
                      );
                      if (newVenueSchedules.length > 0) {
                        const firstDate = newVenueSchedules[0].show_time.split('T')[0];
                        onSelectDate?.(firstDate);
                        onSelectSchedule(newVenueSchedules[0]);
                      }
                    }}
                    className={cn(
                      'group flex items-center justify-between rounded-xl border p-2.5 text-left transition-all',
                      isVenueSelected
                        ? 'border-blue-500 bg-blue-600/15 text-white shadow-sm ring-1 ring-blue-500'
                        : 'border-neutral-800 bg-neutral-900/60 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-900'
                    )}
                  >
                    <div className="min-w-0 pr-2">
                      <span className="block truncate text-xs font-bold text-white">
                        {v.venue_name}
                      </span>
                      <p className="mt-0.5 truncate text-[11px] text-neutral-400">{v.city}</p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      {v.google_maps_url && (
                        <a
                          href={v.google_maps_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="rounded-lg p-1 text-neutral-500 transition-colors hover:text-blue-400"
                          title="Buka di Google Maps"
                          aria-label={`Buka ${v.venue_name} di Google Maps`}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {isVenueSelected && <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          activeVenue && (
            <div className="flex items-center justify-between rounded-xl border border-neutral-800/80 bg-neutral-900/40 px-3 py-2">
              <div className="flex min-w-0 items-center gap-2.5">
                <MapPin className="h-4 w-4 shrink-0 text-blue-400" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-xs font-bold text-white">
                      {activeVenue.venue_name}
                    </span>
                    {activeVenue.cinema_partner && (
                      <span className="py-0.2 rounded bg-neutral-800 px-1.5 text-[9px] font-semibold text-neutral-400">
                        {activeVenue.cinema_partner}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[11px] text-neutral-400">
                    {activeVenue.venue_address || activeVenue.city}
                  </p>
                </div>
              </div>

              {activeVenue.google_maps_url && (
                <a
                  href={activeVenue.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-blue-400 transition hover:text-blue-300"
                  title="Lihat petunjuk arah di Google Maps"
                >
                  <span>Peta</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )
        )}
      </div>

      {/* 2. PILIH TANGGAL (Clean Date Strip) */}
      <div>
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
          Pilih Tanggal
        </label>
        <div className="vercel-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
          {availableDates.map((slot) => {
            const isDateSelected = slot.dateKey === activeDateKey;
            return (
              <button
                key={slot.dateKey}
                type="button"
                onClick={() => {
                  onSelectDate?.(slot.dateKey);
                  const matchingSchedules = venueSchedules.filter(
                    (s) => s.show_time.split('T')[0] === slot.dateKey
                  );
                  if (matchingSchedules.length > 0) {
                    onSelectSchedule(matchingSchedules[0]);
                  }
                }}
                className={cn(
                  'flex shrink-0 flex-col items-center justify-center rounded-xl border px-3.5 py-2 text-xs transition-all',
                  isDateSelected
                    ? 'border-blue-500 bg-blue-600/15 font-bold text-white shadow-sm ring-1 ring-blue-500'
                    : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700 hover:text-white'
                )}
              >
                <span
                  className={cn(
                    'text-[10px] font-bold uppercase tracking-wider',
                    isDateSelected ? 'text-blue-400' : 'text-neutral-500'
                  )}
                >
                  {slot.dayLabel}
                </span>
                <span
                  className={cn(
                    'text-xs',
                    isDateSelected ? 'font-extrabold text-white' : 'font-bold text-neutral-300'
                  )}
                >
                  {slot.dateLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. STUDIO & SHOWTIMES GROUP */}
      <div className="space-y-3 pt-1">
        {/* Studio Switcher Tabs (Hanya jika ada >1 Studio di tanggal ini) */}
        {studiosOnDate.length > 1 && (
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Pilih Studio
            </label>
            <div className="flex flex-wrap gap-2">
              {studiosOnDate.map((st) => {
                const isStudioActive = st.studioName === activeStudioName;
                return (
                  <button
                    key={st.studioName}
                    type="button"
                    onClick={() => {
                      if (st.items.length > 0) {
                        onSelectSchedule(st.items[0]);
                      }
                    }}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all',
                      isStudioActive
                        ? 'border-blue-500 bg-blue-600/15 font-bold text-white shadow-sm ring-1 ring-blue-500'
                        : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700 hover:text-white'
                    )}
                  >
                    <span>{st.studioName}</span>
                    <span
                      className={cn(
                        'text-[10px]',
                        isStudioActive ? 'font-medium text-blue-300' : 'text-neutral-500'
                      )}
                    >
                      Rp {(st.basePrice / 1000).toFixed(0)}k
                    </span>
                    {isStudioActive && <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Studio Active Info Bar (Sleek single-line format) */}
        {activeStudioGroup && (
          <div className="flex items-center justify-between border-b border-neutral-800/60 pb-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">{activeStudioGroup.studioName}</span>
              <span className="py-0.2 rounded bg-neutral-800/80 px-1.5 text-[10px] text-neutral-400">
                2D Reguler
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="font-bold text-neutral-200">
                Rp {activeStudioGroup.basePrice.toLocaleString('id-ID')}
              </span>
              {activeStudioGroup.hasVipPrice && activeStudioGroup.vipPrice && (
                <span className="py-0.2 rounded bg-amber-500/10 px-1.5 text-[10px] font-bold text-amber-300">
                  VIP Rp {activeStudioGroup.vipPrice.toLocaleString('id-ID')}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Showtime Pills Grid (Ultra-clean, centered time pills with consistent active styling) */}
        {activeStudioGroup ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {activeStudioGroup.items.map((schedule) => {
              const isSelected = schedule.id === selectedScheduleId;
              const isSoldOut = schedule.available_seats_count === 0;

              return (
                <button
                  key={schedule.id}
                  type="button"
                  disabled={isSoldOut}
                  onClick={() => onSelectSchedule(schedule)}
                  className={cn(
                    'group flex flex-col items-center justify-center rounded-xl border px-3 py-2 text-center transition-all',
                    isSelected
                      ? 'border-blue-500 bg-blue-600/15 font-bold text-white shadow-sm ring-1 ring-blue-500'
                      : isSoldOut
                        ? 'cursor-not-allowed border-neutral-800/40 bg-neutral-900/20 text-neutral-600 line-through opacity-50'
                        : 'border-neutral-800 bg-neutral-900/60 text-neutral-200 hover:border-neutral-700 hover:bg-neutral-900 hover:text-white'
                  )}
                >
                  <span
                    className={cn(
                      'text-xs',
                      isSelected ? 'font-extrabold text-white' : 'font-semibold text-neutral-200'
                    )}
                  >
                    {formatTimeSlot(schedule.show_time)}
                  </span>
                  <span
                    className={cn(
                      'mt-0.5 text-[10px]',
                      isSelected
                        ? 'font-semibold text-blue-300'
                        : schedule.available_seats_count <= 10
                          ? 'font-semibold text-amber-400'
                          : 'text-neutral-400'
                    )}
                  >
                    {isSoldOut
                      ? 'Habis'
                      : `${schedule.available_seats_count ?? schedule.total_seats} Kursi`}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-neutral-800 p-3 text-center text-xs text-neutral-500">
            Tidak ada jadwal penayangan untuk tanggal yang dipilih.
          </div>
        )}
      </div>
    </div>
  );
};
