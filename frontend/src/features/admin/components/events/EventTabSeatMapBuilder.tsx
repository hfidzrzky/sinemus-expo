import React from 'react';
import { Monitor, Sliders, Film, Lock } from 'lucide-react';
import { useSeatMapEditor } from '../../hooks/useSeatMapEditor';
import type { EventVenueFormInput, StudioSeatMapConfig } from '../../types';

export interface EventTabSeatMapBuilderProps {
  venues?: EventVenueFormInput[];
  selectedStudioKey?: string;
  studioConfigs?: Record<string, StudioSeatMapConfig>;
  onSelectStudioKey?: (studioKey: string) => void;
  onApplyToAllStudios?: (capacity: number, config: StudioSeatMapConfig) => void;
  onSeatConfigChange?: (studioKey: string, config: StudioSeatMapConfig) => void;
}

interface StudioSeatGridEditorProps {
  studioKey: string;
  initialConfig?: StudioSeatMapConfig;
  onSaveConfig?: (config: StudioSeatMapConfig) => void;
  onApplyToAllStudios?: (capacity: number, config: StudioSeatMapConfig) => void;
}

function StudioSeatGridEditor({
  studioKey: _studioKey,
  initialConfig,
  onSaveConfig,
  onApplyToAllStudios,
}: StudioSeatGridEditorProps): React.JSX.Element {
  const isLocked = Boolean(initialConfig?.isLocked);
  const paidSeatCodes = initialConfig?.paidSeatCodes || [];

  const {
    rows,
    setRows,
    columns,
    setColumns,
    disabledSeats,
    vipSeats,
    aisleColumns,
    aisleSeats,
    seatMatrix,
    totalSeats,
    availableSeatsCount,
    standardSeatsCount,
    vipSeatsCount,
    cycleSeatStatus,
    toggleAisleColumn,
    isAisleColumn,
    vipPriceSurcharge,
    setVipPriceSurcharge,
  } = useSeatMapEditor({
    initialRows: initialConfig?.rows ?? 6,
    initialColumns: initialConfig?.columns ?? 10,
    initialDisabledSeats: initialConfig?.disabledSeats ?? [],
    initialVipSeats: initialConfig?.vipSeats ?? [],
    initialAisleColumns: initialConfig?.aisleColumns ?? [],
    initialAisleSeats: initialConfig?.aisleSeats ?? [],
    initialVipPriceSurcharge: initialConfig?.vipPriceSurcharge ?? 20000,
    isLocked,
  });

  // Notify parent on change
  React.useEffect(() => {
    onSaveConfig?.({
      rows,
      columns,
      disabledSeats,
      vipSeats,
      aisleColumns,
      aisleSeats,
      vipPriceSurcharge,
      totalCapacity: availableSeatsCount,
      isLocked: initialConfig?.isLocked,
      lockedReason: initialConfig?.lockedReason,
      paidSeatCodes: initialConfig?.paidSeatCodes,
    });
  }, [
    rows,
    columns,
    disabledSeats,
    vipSeats,
    aisleColumns,
    aisleSeats,
    vipPriceSurcharge,
    availableSeatsCount,
    initialConfig?.isLocked,
    initialConfig?.lockedReason,
    initialConfig?.paidSeatCodes,
    onSaveConfig,
  ]);

  return (
    <div className="space-y-6">
      {/* Locked Studio Seat Map Alert Banner */}
      {isLocked && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent p-4 text-xs">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-500/50 bg-amber-500/20 text-amber-400">
            <Lock className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-300">
                Denah Studio Terkunci (Mode Baca Saja / Read-Only)
              </span>
              <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-400">
                LOCKED
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-neutral-300">
              {initialConfig?.lockedReason
                ? `Konfigurasi denah kursi tidak dapat diubah karena terdapat tiket yang telah lunas: ${initialConfig.lockedReason}.`
                : 'Konfigurasi denah kursi pada sesi studio ini tidak dapat diubah karena telah memiliki transaksi tiket penonton yang lunas (Paid).'}
            </p>
          </div>
        </div>
      )}

      {/* Grid Configuration Controls */}
      <div className="flex flex-wrap items-center gap-6 rounded-xl border border-neutral-800 bg-[#0D111A] p-4 text-xs">
        <div className="flex items-center gap-3">
          <Sliders className="h-4 w-4 text-blue-400" />
          <span className="font-bold text-white">Dimensi Denah:</span>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-neutral-400">Jumlah Baris:</label>
          <input
            type="number"
            min="2"
            max="16"
            disabled={isLocked}
            value={rows}
            onChange={(e) => setRows(Math.min(16, Math.max(2, Number(e.target.value))))}
            className={`w-16 rounded-lg border border-neutral-700 bg-neutral-900 px-2 py-1 text-center font-bold text-white focus:border-blue-500 focus:outline-none ${
              isLocked ? 'cursor-not-allowed opacity-50' : ''
            }`}
          />
          <span className="text-[11px] text-neutral-500">
            (A - {String.fromCharCode(64 + rows)})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-neutral-400">Jumlah Kolom Kursi:</label>
          <input
            type="number"
            min="4"
            max="18"
            disabled={isLocked}
            value={columns}
            onChange={(e) => setColumns(Math.min(18, Math.max(4, Number(e.target.value))))}
            className={`w-16 rounded-lg border border-neutral-700 bg-neutral-900 px-2 py-1 text-center font-bold text-white focus:border-blue-500 focus:outline-none ${
              isLocked ? 'cursor-not-allowed opacity-50' : ''
            }`}
          />
          <span className="text-[11px] text-neutral-500">(1 - {columns})</span>
        </div>

        {onApplyToAllStudios && (
          <button
            type="button"
            disabled={isLocked}
            onClick={() =>
              onApplyToAllStudios(availableSeatsCount, {
                rows,
                columns,
                disabledSeats: [],
                vipSeats,
                aisleColumns,
                aisleSeats,
                vipPriceSurcharge,
                totalCapacity: availableSeatsCount,
              })
            }
            className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${
              isLocked
                ? 'cursor-not-allowed border-neutral-800 bg-neutral-900/50 text-neutral-600'
                : 'border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300'
            }`}
            title={
              isLocked
                ? 'Tidak dapat menerapkan denah dari studio yang terkunci ke studio lain'
                : undefined
            }
          >
            Terapkan Denah Ini ({availableSeatsCount} Kursi) ke Semua Studio
          </button>
        )}

        {/* Legend */}
        <div className="ml-auto flex flex-wrap items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border border-neutral-600 bg-neutral-800" />
            <span className="text-neutral-300">Reguler</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border border-amber-500 bg-amber-500/20" />
            <span className="text-amber-300">VIP</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border border-dashed border-neutral-600 bg-neutral-900/60" />
            <span className="text-neutral-400">Gang / Kosong</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="flex h-3 w-3 items-center justify-center rounded border border-red-500 bg-red-950/80 text-[8px] font-bold text-red-300">
              <Lock className="h-2 w-2 text-red-400" />
            </span>
            <span className="font-semibold text-red-300">Terjual (Paid - Terkunci)</span>
          </div>
        </div>
      </div>

      {/* VIP Surcharge Configuration Banner (Only shown if studio has VIP seats) */}
      {vipSeatsCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/40 bg-amber-500/20 text-sm font-extrabold text-amber-300">
              ⭐
            </div>
            <div>
              <div className="font-bold text-amber-300">
                Pengaturan Selisih Tarif Kursi VIP ({vipSeatsCount} Kursi di Denah)
              </div>
              <div className="text-[11px] text-neutral-400">
                Tambahan harga tiket VIP otomatis diterapkan di atas tarif reguler untuk seluruh
                sesi jam tayang studio ini di Tab 2.
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-neutral-900/90 px-2.5 py-1">
              <span className="font-bold text-neutral-400">+Rp</span>
              <input
                type="text"
                disabled={isLocked}
                value={vipPriceSurcharge.toLocaleString('id-ID')}
                onChange={(e) => {
                  const val = parseInt(e.target.value.replace(/\D/g, ''), 10) || 0;
                  setVipPriceSurcharge(val);
                }}
                className={`w-20 bg-transparent text-center font-bold text-amber-300 focus:outline-none ${
                  isLocked ? 'cursor-not-allowed opacity-60' : ''
                }`}
              />
            </div>
            <div className="flex items-center gap-1">
              {[10000, 15000, 20000, 25000, 50000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  disabled={isLocked}
                  onClick={() => setVipPriceSurcharge(preset)}
                  className={`rounded-md px-2 py-1 text-[11px] font-semibold transition-colors ${
                    isLocked
                      ? 'cursor-not-allowed border border-neutral-800 bg-neutral-900/50 text-neutral-600'
                      : vipPriceSurcharge === preset
                        ? 'bg-amber-500 font-bold text-black shadow-sm'
                        : 'border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                  }`}
                >
                  +{preset / 1000}rb
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Screen Canvas Visual */}
      <div className="admin-canvas-scrollbar overflow-x-auto rounded-2xl border border-neutral-800 bg-[#0B0E14] p-4 shadow-inner sm:p-6">
        <div className="mx-auto flex min-w-max flex-col items-center space-y-6">
          {/* Curved Cinema Screen */}
          <div className="w-full max-w-lg text-center">
            <div className="mx-auto h-2.5 w-full rounded-t-full bg-gradient-to-r from-blue-500/20 via-blue-500 to-blue-500/20 shadow-[0_-4px_16px_rgba(59,130,246,0.6)]" />
            <div className="mt-2.5 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
              <Monitor className="h-3.5 w-3.5 text-blue-400" />
              <span>Layar Bioskop Utama (Screen)</span>
            </div>
          </div>

          {/* Seat Grid & Column Headers */}
          <div className="space-y-1.5 pt-2">
            {/* Top Column Numbers Header */}
            <div className="flex items-center justify-center gap-2">
              <span className="w-6 select-none text-center font-mono text-xs text-transparent sm:w-7" />
              <div className="flex items-center gap-1 sm:gap-1.5">
                {Array.from({ length: columns }).map((_, cIdx) => (
                  <span
                    key={cIdx + 1}
                    className="w-8 select-none text-center font-mono text-[10px] font-semibold text-neutral-500 sm:w-9 sm:text-xs"
                  >
                    {cIdx + 1}
                  </span>
                ))}
              </div>
              <span className="w-6 select-none text-center font-mono text-xs text-transparent sm:w-7" />
            </div>

            {/* Matrix Rows */}
            {seatMatrix.map((row, rIdx) => (
              <div key={rIdx} className="flex items-center justify-center gap-2">
                {/* Row Label Left */}
                <span className="w-6 select-none text-center font-mono text-xs font-bold text-neutral-400 sm:w-7">
                  {row[0]?.rowLabel}
                </span>

                {/* All Cells in this row */}
                <div className="flex items-center gap-1 sm:gap-1.5">
                  {row.map((cell) => {
                    const isPaid = Boolean(cell.seatCode && paidSeatCodes.includes(cell.seatCode));

                    if (isPaid) {
                      return (
                        <div
                          key={cell.gridKey}
                          className="group relative flex h-8 w-8 cursor-not-allowed select-none flex-col items-center justify-center rounded-b-md rounded-t-lg border border-red-500/90 bg-red-950/80 text-[9px] font-black text-red-200 shadow-[0_0_10px_rgba(239,68,68,0.3)] sm:h-9 sm:w-9"
                          title={`Kursi Terjual (Paid): ${cell.seatCode} — Terkunci permanen`}
                        >
                          <span className="leading-none">{cell.seatNumber}</span>
                          <Lock className="mt-0.5 h-2.5 w-2.5 shrink-0 text-red-400" />
                        </div>
                      );
                    }

                    if (cell.type === 'aisle') {
                      return (
                        <button
                          key={cell.gridKey}
                          type="button"
                          disabled={isLocked}
                          onClick={() => cycleSeatStatus(cell.gridKey)}
                          className={`group relative flex h-8 w-8 items-center justify-center rounded-b-md rounded-t-lg border border-dashed border-neutral-700/80 bg-neutral-900/40 text-[10px] font-bold text-neutral-500 sm:h-9 sm:w-9 ${
                            isLocked
                              ? 'cursor-not-allowed opacity-50'
                              : 'transition-all hover:scale-105 hover:border-blue-500 hover:bg-neutral-800/80 hover:text-white'
                          }`}
                          title={
                            isLocked
                              ? `Gang / Kosong Kolom ${cell.gridColumn} (${cell.rowLabel}) — Terkunci`
                              : `Gang / Kosong Kolom ${cell.gridColumn} (${cell.rowLabel}) — Klik untuk pasang Kursi Reguler`
                          }
                        >
                          <span
                            className={`text-[10px] font-bold text-neutral-600 ${
                              !isLocked ? 'transition-colors group-hover:text-blue-400' : ''
                            }`}
                          >
                            +
                          </span>
                        </button>
                      );
                    }

                    if (cell.type === 'vip') {
                      return (
                        <button
                          key={cell.gridKey}
                          type="button"
                          disabled={isLocked}
                          onClick={() => cycleSeatStatus(cell.gridKey)}
                          className={`group relative flex h-8 w-8 items-center justify-center rounded-b-md rounded-t-lg border border-amber-500/80 bg-gradient-to-b from-amber-500/25 to-amber-700/30 text-[10px] font-extrabold text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)] sm:h-9 sm:w-9 ${
                            isLocked
                              ? 'cursor-not-allowed opacity-75'
                              : 'transition-all hover:scale-105 hover:border-amber-400'
                          }`}
                          title={
                            isLocked
                              ? `Kursi VIP ${cell.seatCode} (Kolom Denah ${cell.gridColumn}) — Terkunci`
                              : `Kursi VIP ${cell.seatCode} (Kolom Denah ${cell.gridColumn}) — Klik untuk ubah ke Gang (Kosong)`
                          }
                        >
                          {cell.seatNumber}
                        </button>
                      );
                    }

                    return (
                      <button
                        key={cell.gridKey}
                        type="button"
                        disabled={isLocked}
                        onClick={() => cycleSeatStatus(cell.gridKey)}
                        className={`group relative flex h-8 w-8 items-center justify-center rounded-b-md rounded-t-lg border border-neutral-700 bg-neutral-800/90 text-[10px] font-bold text-neutral-200 shadow-sm sm:h-9 sm:w-9 ${
                          isLocked
                            ? 'cursor-not-allowed opacity-75'
                            : 'transition-all hover:scale-105 hover:border-blue-500 hover:bg-neutral-700 hover:text-white'
                        }`}
                        title={
                          isLocked
                            ? `Kursi Reguler ${cell.seatCode} (Kolom Denah ${cell.gridColumn}) — Terkunci`
                            : `Kursi Reguler ${cell.seatCode} (Kolom Denah ${cell.gridColumn}) — Klik untuk ubah ke VIP`
                        }
                      >
                        {cell.seatNumber}
                      </button>
                    );
                  })}
                </div>

                {/* Row Label Right */}
                <span className="w-6 select-none text-center font-mono text-xs font-bold text-neutral-400 sm:w-7">
                  {row[0]?.rowLabel}
                </span>
              </div>
            ))}

            {/* Quick Aisle Column Controls */}
            <div className="flex flex-col items-center gap-2 pt-5">
              <span className="text-[11px] font-medium text-neutral-400">
                {isLocked
                  ? 'Konfigurasi gang vertikal terkunci karena studio memiliki transaksi tiket berbayar:'
                  : 'Klik tombol nomor kolom di bawah untuk toggle gang vertikal satu kolom penuh:'}
              </span>
              <div className="flex items-center justify-center gap-2">
                <span className="w-6 select-none text-center sm:w-7" />
                <div className="flex items-center gap-1 sm:gap-1.5">
                  {Array.from({ length: columns }).map((_, cIdx) => {
                    const colNum = cIdx + 1;
                    const isAisle = isAisleColumn(colNum);
                    return (
                      <button
                        key={colNum}
                        type="button"
                        disabled={isLocked}
                        onClick={() => toggleAisleColumn(colNum)}
                        className={`h-7 w-8 rounded-md text-[9px] font-bold sm:w-9 ${
                          isLocked
                            ? 'cursor-not-allowed border border-neutral-800 bg-neutral-900/60 text-neutral-600'
                            : isAisle
                              ? 'border border-amber-500/80 bg-amber-500/20 font-extrabold text-amber-300 shadow-sm transition-all'
                              : 'border border-neutral-800 bg-neutral-900 text-neutral-400 transition-all hover:border-neutral-700 hover:text-white'
                        }`}
                        title={
                          isLocked
                            ? `Kolom ${colNum} — Denah Terkunci`
                            : `Toggle gang vertikal kolom ${colNum} (${isAisle ? 'Saat ini Gang. Klik untuk kembalikan jadi Kursi' : 'Klik untuk ubah seluruh kolom jadi Gang'})`
                        }
                      >
                        {isAisle ? 'Gang' : colNum}
                      </button>
                    );
                  })}
                </div>
                <span className="w-6 select-none text-center sm:w-7" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Metrics Banner */}
      <div className="grid grid-cols-2 gap-3 rounded-xl border border-neutral-800 bg-[#0D111A] p-4 text-center sm:grid-cols-4">
        <div>
          <span className="text-[10px] font-bold uppercase text-neutral-500">
            Total Dimensi Grid
          </span>
          <p className="mt-1 text-base font-extrabold text-white">{totalSeats} Sel</p>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase text-blue-400">Kapasitas Tersedia</span>
          <p className="mt-1 text-base font-extrabold text-blue-400">{availableSeatsCount} Kursi</p>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase text-neutral-300">Kursi Reguler</span>
          <p className="mt-1 text-base font-extrabold text-neutral-200">
            {standardSeatsCount} Kursi
          </p>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase text-amber-400">Kursi VIP</span>
          <p className="mt-1 text-base font-extrabold text-amber-300">{vipSeatsCount} Kursi</p>
        </div>
      </div>
    </div>
  );
}

export function EventTabSeatMapBuilder({
  venues,
  selectedStudioKey,
  studioConfigs,
  onSelectStudioKey,
  onApplyToAllStudios,
  onSeatConfigChange,
}: EventTabSeatMapBuilderProps): React.JSX.Element {
  // Collect all unique venue + studio pairs
  const studioTargets = React.useMemo(() => {
    if (!venues || venues.length === 0) return [];
    const list: Array<{ key: string; label: string; venueName: string; studioName: string }> = [];

    venues.forEach((v, vIdx) => {
      const vName = v.venue_name || `Bioskop #${vIdx + 1}`;
      const uniqueStudios = new Set<string>();

      v.schedules?.forEach((s) => {
        const sName = s.studio_name || 'Studio 1';
        if (!uniqueStudios.has(sName)) {
          uniqueStudios.add(sName);
          list.push({
            key: `${vIdx}__${sName}`,
            label: `${vName} — ${sName}`,
            venueName: vName,
            studioName: sName,
          });
        }
      });

      if (uniqueStudios.size === 0) {
        list.push({
          key: `${vIdx}__Studio 1`,
          label: `${vName} — Studio 1`,
          venueName: vName,
          studioName: 'Studio 1',
        });
      }
    });

    return list;
  }, [venues]);

  const activeStudioKey =
    selectedStudioKey && studioTargets.some((t) => t.key === selectedStudioKey)
      ? selectedStudioKey
      : studioTargets[0]?.key || '0__Studio 1';

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-sm font-bold text-white">
          Interactive Seat Map Studio (Generator Denah Kursi Bioskop)
        </h3>
        <p className="mt-1 text-xs text-neutral-400">
          Konfigurasi baris dan kolom denah fisik auditorium bioskop. Kapasitas kursi yang dapat
          dijual akan dihitung secara presisi dari denah ini.
        </p>
      </div>

      {/* Target Studio Selector Bar */}
      {studioTargets.length > 0 && (
        <div className="rounded-xl border border-neutral-800 bg-[#0D111A] p-3.5">
          <div className="flex items-center gap-2">
            <Film className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-bold text-white">Target Studio Denah:</span>
          </div>

          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {studioTargets.map((target) => {
              const isTargetLocked = Boolean(studioConfigs?.[target.key]?.isLocked);
              return (
                <button
                  key={target.key}
                  type="button"
                  onClick={() => onSelectStudioKey?.(target.key)}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                    activeStudioKey === target.key
                      ? 'bg-blue-600 text-white shadow-sm'
                      : isTargetLocked
                        ? 'border border-amber-500/30 bg-neutral-900 text-neutral-300 hover:border-amber-500/60 hover:text-white'
                        : 'bg-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {isTargetLocked && <Lock className="h-3 w-3 shrink-0 text-amber-400" />}
                  <span>{target.label}</span>
                  {isTargetLocked && (
                    <span className="rounded bg-amber-500/20 px-1 py-0.5 text-[9px] font-extrabold text-amber-400">
                      Terkunci
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Render the Isolated, Keyed Seat Grid Editor for the Active Studio */}
      <StudioSeatGridEditor
        key={activeStudioKey}
        studioKey={activeStudioKey}
        initialConfig={studioConfigs?.[activeStudioKey]}
        onSaveConfig={(cfg) => onSeatConfigChange?.(activeStudioKey, cfg)}
        onApplyToAllStudios={onApplyToAllStudios}
      />
    </div>
  );
}
