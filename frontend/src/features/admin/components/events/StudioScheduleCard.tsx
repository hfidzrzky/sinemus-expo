import React, { useState } from 'react';
import {
  Film,
  Trash2,
  Clock,
  Plus,
  DollarSign,
  Users,
  LayoutGrid,
  Calendar,
  Zap,
} from 'lucide-react';
import type { ShowtimeSlotInput, StudioSeatMapConfig } from '../../types';
import type { SeatingType } from '@/features/events';

export interface StudioScheduleCardProps {
  studioIndex: number;
  studioName: string;
  defaultPrice: number;
  defaultSeats: number;
  seatingType?: SeatingType;
  schedules: ShowtimeSlotInput[];
  seatMapConfig?: StudioSeatMapConfig;
  canDelete: boolean;
  onUpdateStudio: (updates: {
    studioName?: string;
    defaultPrice?: number;
    defaultSeats?: number;
  }) => void;
  onDeleteStudio: () => void;
  onAddSchedule: (schedule: ShowtimeSlotInput) => void;
  onRemoveSchedule: (scheduleIndex: number) => void;
  onUpdateSchedule?: (scheduleIndex: number, updates: Partial<ShowtimeSlotInput>) => void;
  onApplyDefaultsToAll?: (price: number, seats: number) => void;
  onOpenSeatMap?: () => void;
}

const COMMON_STUDIO_NAMES = ['Studio 1', 'Studio 2', 'Studio 3', 'IMAX', 'Premiere', 'Auditorium'];
const POPULAR_TIME_PRESETS = ['13:00', '15:45', '18:30', '21:15'];
const PRICE_PRESETS = [35000, 50000, 65000, 75000, 100000];
const QUOTA_PRESETS = [50, 100, 150, 200, 300];

export function StudioScheduleCard({
  studioIndex,
  studioName,
  defaultPrice,
  defaultSeats,
  seatingType = 'assigned_seating',
  schedules,
  seatMapConfig,
  canDelete,
  onUpdateStudio,
  onDeleteStudio,
  onAddSchedule,
  onRemoveSchedule,
  onUpdateSchedule,
  onApplyDefaultsToAll,
  onOpenSeatMap,
}: StudioScheduleCardProps): React.JSX.Element {
  const isGeneralAdmission = seatingType === 'general_admission';
  const hasVipSeats = !isGeneralAdmission && (seatMapConfig?.vipSeats?.length ?? 0) > 0;
  const vipSurcharge = seatMapConfig?.vipPriceSurcharge ?? 20000;
  const vipCount = seatMapConfig?.vipSeats?.length ?? 0;

  // Smooth string state for inputs so users can backspace and edit freely without caret jumps or lag
  const [priceInput, setPriceInput] = useState<string>(() => String(defaultPrice || 65000));
  const [seatsInput, setSeatsInput] = useState<string>(() => String(defaultSeats || 100));

  // Sync state cleanly when props change during render without triggering cascading effect renders
  const [prevDefaultPrice, setPrevDefaultPrice] = useState(defaultPrice);
  if (defaultPrice !== prevDefaultPrice) {
    setPrevDefaultPrice(defaultPrice);
    if (defaultPrice !== undefined && defaultPrice !== null) {
      setPriceInput(String(defaultPrice));
    }
  }

  const [prevDefaultSeats, setPrevDefaultSeats] = useState(defaultSeats);
  if (defaultSeats !== prevDefaultSeats) {
    setPrevDefaultSeats(defaultSeats);
    if (defaultSeats !== undefined && defaultSeats !== null) {
      setSeatsInput(String(defaultSeats));
    }
  }

  // Quick add showtime state
  const [selectedDate, setSelectedDate] = useState(() => {
    if (schedules.length > 0 && schedules[0].show_time) {
      return schedules[0].show_time.split('T')[0];
    }
    const today = new Date();
    today.setDate(today.getDate() + 7);
    return today.toISOString().split('T')[0];
  });

  const [inputTime, setInputTime] = useState('19:30');

  const handlePriceChange = (valStr: string) => {
    setPriceInput(valStr);
    const numeric = parseInt(valStr.replace(/\D/g, ''), 10);
    if (!isNaN(numeric) && numeric >= 0) {
      onUpdateStudio({ defaultPrice: numeric });
    }
  };

  const handleSeatsChange = (valStr: string) => {
    setSeatsInput(valStr);
    const numeric = parseInt(valStr.replace(/\D/g, ''), 10);
    if (!isNaN(numeric) && numeric > 0) {
      onUpdateStudio({ defaultSeats: numeric });
    }
  };

  const handleSelectPricePreset = (preset: number) => {
    setPriceInput(String(preset));
    onUpdateStudio({ defaultPrice: preset });
  };

  const handleSelectSeatsPreset = (preset: number) => {
    setSeatsInput(String(preset));
    onUpdateStudio({ defaultSeats: preset });
  };

  const handleStepSeats = (delta: number) => {
    const current = parseInt(seatsInput.replace(/\D/g, ''), 10) || 100;
    const nextVal = Math.max(1, current + delta);
    setSeatsInput(String(nextVal));
    onUpdateStudio({ defaultSeats: nextVal });
  };

  const handleApplyDefaultsToAllSchedules = () => {
    const numPrice = parseInt(priceInput.replace(/\D/g, ''), 10) || defaultPrice || 65000;
    const numSeats = parseInt(seatsInput.replace(/\D/g, ''), 10) || defaultSeats || 100;
    onApplyDefaultsToAll?.(numPrice, numSeats);
  };

  const handleAddSlot = (timeToAdd = inputTime) => {
    if (!selectedDate || !timeToAdd) return;

    const dateTimeStr = `${selectedDate}T${timeToAdd}:00+07:00`;
    const numPrice = parseInt(priceInput.replace(/\D/g, ''), 10) || defaultPrice || 65000;
    const numSeats = isGeneralAdmission
      ? parseInt(seatsInput.replace(/\D/g, ''), 10) || defaultSeats || 100
      : seatMapConfig?.totalCapacity || defaultSeats || 60;

    const newSlot: ShowtimeSlotInput = {
      client_uid: `slot-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      studio_name: studioName || `Studio ${studioIndex + 1}`,
      show_time: dateTimeStr,
      ticket_price: numPrice,
      vip_ticket_price: hasVipSeats ? numPrice + vipSurcharge : undefined,
      total_seats: numSeats,
      max_tickets_per_order: 6,
    };

    onAddSchedule(newSlot);
  };

  return (
    <div className="rounded-xl border border-neutral-800/90 bg-[#0A0D14] p-4 transition-all">
      {/* Studio Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800/70 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400">
            <Film className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={studioName}
                onChange={(e) => onUpdateStudio({ studioName: e.target.value })}
                placeholder={`Studio ${studioIndex + 1}`}
                className="w-36 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs font-bold text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none"
              />
              <span className="text-[11px] text-neutral-500">({schedules.length} Jam Tayang)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Studio Name Pills */}
          <div className="hidden items-center gap-1 sm:flex">
            {COMMON_STUDIO_NAMES.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onUpdateStudio({ studioName: preset })}
                className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                  studioName === preset
                    ? 'bg-blue-600 text-white'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          {canDelete && (
            <button
              type="button"
              onClick={onDeleteStudio}
              className="rounded-lg p-1 text-neutral-500 hover:bg-red-500/10 hover:text-red-400"
              title="Hapus Studio Ini"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Studio Default Settings & Presets */}
      <div className="mt-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Default Ticket Price */}
        <div className="flex flex-col justify-between rounded-xl border border-neutral-800 bg-[#0E121B] p-3.5">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 flex-shrink-0 text-emerald-400" />
                <label className="text-[11px] font-bold text-neutral-300">
                  Tarif Tiket Acuan Studio
                </label>
              </div>
              <span className="text-[10px] text-neutral-500">Rupiah (IDR)</span>
            </div>

            <div className={`mt-2 ${hasVipSeats ? 'grid grid-cols-1 gap-2 sm:grid-cols-2' : ''}`}>
              <div className="flex items-center gap-2 rounded-lg border border-neutral-700/80 bg-neutral-900 px-3 py-1.5 focus-within:border-blue-500">
                <span className="text-xs font-bold text-neutral-400">Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={priceInput}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  placeholder="65000"
                  className="w-full bg-transparent text-sm font-extrabold text-white focus:outline-none"
                />
              </div>

              {hasVipSeats && (
                <div
                  className="flex items-center justify-between rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5"
                  title={`Dihitung otomatis: Reguler + Selisih VIP (Rp ${vipSurcharge.toLocaleString('id-ID')}) dari Tab 3`}
                >
                  <span className="text-xs font-bold text-amber-300">VIP ⭐</span>
                  <span className="text-sm font-extrabold text-amber-300">
                    Rp{' '}
                    {(
                      (parseInt(priceInput.replace(/\D/g, ''), 10) || defaultPrice || 65000) +
                      vipSurcharge
                    ).toLocaleString('id-ID')}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Price Preset Chips */}
            <div className="mt-2.5 flex flex-wrap items-center gap-1">
              <span className="mr-1 text-[10px] text-neutral-500">Preset:</span>
              {PRICE_PRESETS.map((p) => {
                const label = `${p / 1000}rb`;
                const isSelected = Number(priceInput) === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleSelectPricePreset(p)}
                    className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold transition-colors ${
                      isSelected
                        ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300'
                        : 'border-neutral-800 bg-neutral-900/90 text-neutral-400 hover:border-neutral-700 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {hasVipSeats ? (
            <div className="mt-3 flex items-center justify-between border-t border-neutral-800/80 pt-2 text-[10px]">
              <span className="text-neutral-400">
                Denah Memiliki <strong className="text-amber-300">{vipCount} Kursi VIP</strong>
              </span>
              <span className="font-semibold text-amber-400">
                +Rp {vipSurcharge.toLocaleString('id-ID')} (Diatur di Tab 3)
              </span>
            </div>
          ) : (
            <p className="mt-3 border-t border-neutral-800/80 pt-2 text-[10px] text-neutral-500">
              Tarif standar acuan saat menambah sesi jam tayang baru di studio ini.
            </p>
          )}
        </div>

        {/* Capacity / Seating Context Block */}
        {isGeneralAdmission ? (
          /* General Admission: Smooth Quota Input & Steppers */
          <div className="flex flex-col justify-between rounded-xl border border-neutral-800 bg-[#0E121B] p-3.5">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 flex-shrink-0 text-blue-400" />
                  <label className="text-[11px] font-bold text-neutral-300">
                    Kuota Penjualan Tiket <span className="text-blue-400">*GA</span>
                  </label>
                </div>
                <span className="text-[10px] text-neutral-500">Kapasitas Sesi</span>
              </div>

              <div className="mt-2 flex items-center justify-between rounded-lg border border-neutral-700/80 bg-neutral-900 px-2 py-1 focus-within:border-blue-500">
                <button
                  type="button"
                  onClick={() => handleStepSeats(-25)}
                  className="flex h-7 w-7 items-center justify-center rounded-md bg-neutral-800 text-xs font-bold text-neutral-300 transition-colors hover:bg-neutral-700 hover:text-white"
                  title="Kurangi 25 tiket"
                >
                  -25
                </button>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={seatsInput}
                    onChange={(e) => handleSeatsChange(e.target.value)}
                    placeholder="100"
                    className="w-16 bg-transparent text-center text-sm font-extrabold text-white focus:outline-none"
                  />
                  <span className="text-xs font-semibold text-neutral-400">Tiket</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleStepSeats(25)}
                  className="flex h-7 w-7 items-center justify-center rounded-md bg-neutral-800 text-xs font-bold text-neutral-300 transition-colors hover:bg-neutral-700 hover:text-white"
                  title="Tambah 25 tiket"
                >
                  +25
                </button>
              </div>

              {/* Quick Quota Preset Chips */}
              <div className="mt-2.5 flex flex-wrap items-center gap-1">
                <span className="mr-1 text-[10px] text-neutral-500">Preset:</span>
                {QUOTA_PRESETS.map((q) => {
                  const isSelected = Number(seatsInput) === q;
                  return (
                    <button
                      key={q}
                      type="button"
                      onClick={() => handleSelectSeatsPreset(q)}
                      className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold transition-colors ${
                        isSelected
                          ? 'border-blue-500/60 bg-blue-500/20 text-blue-300'
                          : 'border-neutral-800 bg-neutral-900/90 text-neutral-400 hover:border-neutral-700 hover:text-white'
                      }`}
                    >
                      {q}
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="mt-3 border-t border-neutral-800/80 pt-2 text-[10px] text-neutral-500">
              Kapasitas kuota penonton bebas tanpa nomor denah (General Admission).
            </p>
          </div>
        ) : (
          /* Assigned Seating: Dynamic Seat Map Indication */
          <div className="flex flex-col justify-between rounded-xl border border-neutral-800/80 bg-[#0E121B] p-3.5">
            <div>
              <div className="flex items-start gap-2.5">
                <LayoutGrid className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-400" />
                <div className="flex-1">
                  <span className="block text-[11px] font-bold text-neutral-300">
                    Kapasitas Kursi Bioskop
                  </span>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="text-base font-extrabold text-white">
                      {seatMapConfig
                        ? `${seatMapConfig.totalCapacity} Kursi`
                        : `${defaultSeats || 60} Kursi`}
                    </span>
                    {seatMapConfig ? (
                      <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-400">
                        Denah {seatMapConfig.rows} Baris × {seatMapConfig.columns} Kolom
                      </span>
                    ) : (
                      <span className="rounded bg-neutral-800 px-2 py-0.5 text-[10px] font-medium text-neutral-400">
                        Denah Standar (6×10)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {onOpenSeatMap && (
              <button
                type="button"
                onClick={onOpenSeatMap}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 py-1.5 text-xs font-semibold text-blue-400 transition-colors hover:bg-blue-500/20 hover:text-blue-300"
                title="Buka Denah Kursi Studio Ini di Tab 3"
              >
                <span>Atur Denah di Tab 3</span>
                <span aria-hidden="true">&rarr;</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Sync Button: Apply Defaults to all existing showtimes in this studio */}
      {schedules.length > 0 && onApplyDefaultsToAll && (
        <div className="mt-2.5 flex items-center justify-end">
          <button
            type="button"
            onClick={handleApplyDefaultsToAllSchedules}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800/90 px-3 py-1.5 text-xs font-bold text-neutral-300 transition-colors hover:border-blue-500/60 hover:bg-blue-600/10 hover:text-blue-400"
            title="Sinkronkan tarif dan kuota acuan di atas ke seluruh jam tayang yang sudah terdaftar di studio ini"
          >
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span>Terapkan Tarif & Kuota Acuan ke Semua ({schedules.length}) Sesi Jam Tayang</span>
          </button>
        </div>
      )}

      {/* Quick Showtime Adder Section */}
      <div className="mt-3.5 rounded-xl border border-neutral-800/80 bg-[#0E121B]/70 p-3.5">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2.5">
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-wider text-neutral-400">
                Tanggal Tayang
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-1 rounded-lg border border-neutral-700 bg-neutral-900 px-2.5 py-1 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold uppercase tracking-wider text-neutral-400">
                Pukul (WIB)
              </label>
              <input
                type="time"
                value={inputTime}
                onChange={(e) => setInputTime(e.target.value)}
                className="mt-1 rounded-lg border border-neutral-700 bg-neutral-900 px-2.5 py-1 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => handleAddSlot()}
                disabled={!selectedDate || !inputTime}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah Jam
              </button>
            </div>
          </div>

          {/* Quick presets for common showtimes */}
          <div className="flex flex-wrap items-center gap-1 pt-1 sm:pt-0">
            <span className="mr-1 text-[10px] text-neutral-500">Slot Cepat:</span>
            {POPULAR_TIME_PRESETS.map((timePreset) => (
              <button
                key={timePreset}
                type="button"
                onClick={() => handleAddSlot(timePreset)}
                className="rounded-md border border-neutral-700/80 bg-neutral-800/80 px-2 py-1 font-mono text-[10px] text-neutral-300 transition-colors hover:border-blue-500 hover:text-white"
                title={`Tambah jam ${timePreset} pada tanggal terpilih`}
              >
                +{timePreset}
              </button>
            ))}
          </div>
        </div>

        {/* Showtime List: Inline Editable Session Rows */}
        <div className="mt-4">
          <div className="flex items-center justify-between border-b border-neutral-800/60 pb-2 text-[11px] font-bold text-neutral-400">
            <span>Sesi Jam Tayang Terdaftar:</span>
            <span className="text-neutral-500">{schedules.length} Sesi Terjadwal</span>
          </div>

          {schedules.length === 0 ? (
            <div className="mt-3 rounded-lg border border-dashed border-neutral-800 py-4 text-center text-xs text-neutral-500">
              Belum ada jam tayang untuk studio ini. Klik slot cepat atau tambah jam di atas.
            </div>
          ) : (
            <div className="mt-3 space-y-2.5">
              {schedules.map((schedule, sIdx) => {
                const dateObj = new Date(schedule.show_time);
                const timeStr = dateObj
                  .toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                  .replace('.', ':');
                const dateStr = dateObj.toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });

                return (
                  <div
                    key={schedule.client_uid || schedule.id || sIdx}
                    className="flex flex-col gap-3 rounded-xl border border-neutral-800 bg-[#090C13] p-2.5 transition-colors hover:border-neutral-700 sm:flex-row sm:items-center sm:justify-between"
                  >
                    {/* Left: Time and Date badge */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs font-bold text-blue-400">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{timeStr} WIB</span>
                      </div>
                      <div className="flex items-center gap-1 rounded-lg border border-neutral-800 bg-neutral-900 px-2 py-1 text-xs font-semibold text-neutral-300">
                        <Calendar className="h-3 w-3 text-neutral-500" />
                        <span>{dateStr}</span>
                      </div>
                    </div>

                    {/* Right: Inline Controls for Price, VIP Price, Quota, and Delete */}
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      {/* Inline Reguler Price Editor */}
                      <div
                        className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-2 py-1"
                        title="Ubah tarif tiket reguler sesi ini"
                      >
                        <span className="text-[10px] font-bold text-neutral-400">Reg: Rp</span>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={schedule.ticket_price}
                          onChange={(e) => {
                            const newPrice = Math.max(0, Number(e.target.value) || 0);
                            onUpdateSchedule?.(sIdx, {
                              ticket_price: newPrice,
                              ...(hasVipSeats &&
                              (!schedule.vip_ticket_price ||
                                schedule.vip_ticket_price === schedule.ticket_price + vipSurcharge)
                                ? { vip_ticket_price: newPrice + vipSurcharge }
                                : {}),
                            });
                          }}
                          className="w-20 bg-transparent text-xs font-bold text-white focus:outline-none"
                        />
                      </div>

                      {/* Inline VIP Price Editor */}
                      {hasVipSeats && (
                        <div
                          className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2 py-1"
                          title="Ubah tarif tiket VIP khusus sesi ini"
                        >
                          <span className="text-[10px] font-bold text-amber-300">VIP ⭐: Rp</span>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={
                              schedule.vip_ticket_price ?? schedule.ticket_price + vipSurcharge
                            }
                            onChange={(e) =>
                              onUpdateSchedule?.(sIdx, {
                                vip_ticket_price: Math.max(0, Number(e.target.value) || 0),
                              })
                            }
                            className="w-20 bg-transparent text-xs font-bold text-amber-300 focus:outline-none"
                          />
                        </div>
                      )}

                      {/* General Admission: Inline Quota Editor */}
                      {isGeneralAdmission ? (
                        <div
                          className="flex items-center gap-1 rounded-lg border border-neutral-800 bg-neutral-900 px-1.5 py-0.5"
                          title="Ubah kuota tiket khusus sesi ini"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateSchedule?.(sIdx, {
                                total_seats: Math.max(1, (schedule.total_seats || 1) - 10),
                              })
                            }
                            className="flex h-5 w-5 items-center justify-center rounded bg-neutral-800 text-xs font-bold text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white"
                            title="Kurangi 10 tiket"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            max="5000"
                            value={schedule.total_seats}
                            onChange={(e) =>
                              onUpdateSchedule?.(sIdx, {
                                total_seats: Math.max(1, Number(e.target.value) || 1),
                              })
                            }
                            className="w-14 bg-transparent text-center text-xs font-bold text-white focus:outline-none"
                          />
                          <span className="pr-1 text-[10px] font-medium text-neutral-400">
                            Tiket
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateSchedule?.(sIdx, {
                                total_seats: (schedule.total_seats || 0) + 10,
                              })
                            }
                            className="flex h-5 w-5 items-center justify-center rounded bg-neutral-800 text-xs font-bold text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white"
                            title="Tambah 10 tiket"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 rounded-lg border border-neutral-800/80 bg-neutral-900/60 px-2 py-1 text-[11px] text-neutral-300">
                          <LayoutGrid className="h-3 w-3 text-blue-400" />
                          <span>
                            {seatMapConfig?.totalCapacity || schedule.total_seats || 60} Kursi
                          </span>
                        </div>
                      )}

                      {/* Delete Session */}
                      <button
                        type="button"
                        onClick={() => onRemoveSchedule(sIdx)}
                        className="rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                        title="Hapus Jam Tayang Ini"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
