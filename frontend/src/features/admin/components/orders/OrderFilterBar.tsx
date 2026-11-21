import React from 'react';
import { Search, X, Calendar, Download, RefreshCw, Filter } from 'lucide-react';

function formatDateYMD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface OrderFilterBarProps {
  selectedType: 'all' | 'ticket' | 'movie_rental';
  onTypeChange: (type: 'all' | 'ticket' | 'movie_rental') => void;
  selectedStatus: 'all' | 'pending' | 'paid' | 'expired' | 'failed';
  onStatusChange: (status: 'all' | 'pending' | 'paid' | 'expired' | 'failed') => void;
  searchTerm: string;
  onSearchChange: (search: string) => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  onResetFilters: () => void;
  onExportCsv: () => void;
  isExporting?: boolean;
  totalOrdersCount: number;
}

export function OrderFilterBar({
  selectedType,
  onTypeChange,
  selectedStatus,
  onStatusChange,
  searchTerm,
  onSearchChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onResetFilters,
  onExportCsv,
  isExporting = false,
  totalOrdersCount,
}: OrderFilterBarProps): React.JSX.Element {
  const hasActiveFilters =
    selectedType !== 'all' ||
    selectedStatus !== 'all' ||
    searchTerm.trim() !== '' ||
    startDate !== '' ||
    endDate !== '';

  const getPresetRange = (days: number): { start: string; end: string } => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    return {
      start: formatDateYMD(start),
      end: formatDateYMD(end),
    };
  };

  const setPresetDate = (days: number | 'all') => {
    if (days === 'all') {
      onStartDateChange('');
      onEndDateChange('');
      return;
    }
    const range = getPresetRange(days);
    onStartDateChange(range.start);
    onEndDateChange(range.end);
  };

  const isPresetActive = (days: number): boolean => {
    const localRange = getPresetRange(days);
    if (startDate === localRange.start && endDate === localRange.end) {
      return true;
    }

    // Fallback pencocokan jika sebelumnya terformat secara ISO/UTC
    const endUtc = new Date();
    const startUtc = new Date();
    startUtc.setDate(endUtc.getDate() - days);
    const startUtcStr = startUtc.toISOString().split('T')[0];
    const endUtcStr = endUtc.toISOString().split('T')[0];
    return startDate === startUtcStr && endDate === endUtcStr;
  };

  const getPresetButtonClass = (isActive: boolean): string =>
    `rounded-lg border px-2.5 py-1 font-medium transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF] ${
      isActive
        ? 'border-[#0066FF]/40 bg-[#0066FF]/15 font-semibold text-blue-400'
        : 'border-transparent text-neutral-400 hover:bg-[#0D111A] hover:text-white'
    }`;

  return (
    <div className="space-y-4 rounded-2xl border border-neutral-800 bg-[#0B0E14] p-4 sm:p-5">
      {/* Baris 1: Pencarian, Date Picker, & Tombol Export */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Input Pencarian */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari Order ID, nama pembeli, email, atau no WA..."
            className="w-full rounded-xl border border-neutral-800 bg-[#0D111A] py-2.5 pl-10 pr-9 text-xs text-white placeholder-neutral-500 outline-none transition-colors focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
              title="Bersihkan pencarian"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Date Range & Export */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tanggal Mulai */}
          <div className="flex items-center gap-1 rounded-xl border border-neutral-800 bg-[#0D111A] px-2.5 py-1.5 text-xs text-neutral-300">
            <Calendar className="h-3.5 w-3.5 text-neutral-500" />
            <span className="text-[10px] text-neutral-500">Dari:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="bg-transparent text-xs text-neutral-200 outline-none [color-scheme:dark]"
            />
          </div>

          {/* Tanggal Akhir */}
          <div className="flex items-center gap-1 rounded-xl border border-neutral-800 bg-[#0D111A] px-2.5 py-1.5 text-xs text-neutral-300">
            <span className="text-[10px] text-neutral-500">Sampai:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="bg-transparent text-xs text-neutral-200 outline-none [color-scheme:dark]"
            />
          </div>

          {/* Tombol Export CSV */}
          <button
            type="button"
            onClick={onExportCsv}
            disabled={isExporting || totalOrdersCount === 0}
            className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-800/80 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:border-neutral-600 hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
            title="Ekspor laporan transaksi terfilter ke file CSV"
          >
            <Download className="h-3.5 w-3.5 text-blue-400" />
            <span>{isExporting ? 'Mengekspor...' : 'Export CSV'}</span>
          </button>

          {/* Reset Filter Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 rounded-xl border border-neutral-800 bg-neutral-900/60 px-2.5 py-2 text-xs font-medium text-neutral-400 hover:text-white"
              title="Reset semua filter ke default"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Baris 2: Preset Waktu Cepat */}
      <div className="flex flex-wrap items-center gap-1.5 border-t border-neutral-800/60 pt-3 text-[11px]">
        <span className="mr-1 text-neutral-500">Rentang Waktu:</span>
        <button
          type="button"
          aria-pressed={startDate === '' && endDate === ''}
          onClick={() => setPresetDate('all')}
          className={getPresetButtonClass(startDate === '' && endDate === '')}
        >
          Semua Waktu
        </button>
        <button
          type="button"
          aria-pressed={isPresetActive(0)}
          onClick={() => setPresetDate(0)}
          className={getPresetButtonClass(isPresetActive(0))}
        >
          Hari Ini
        </button>
        <button
          type="button"
          aria-pressed={isPresetActive(7)}
          onClick={() => setPresetDate(7)}
          className={getPresetButtonClass(isPresetActive(7))}
        >
          7 Hari Terakhir
        </button>
        <button
          type="button"
          aria-pressed={isPresetActive(30)}
          onClick={() => setPresetDate(30)}
          className={getPresetButtonClass(isPresetActive(30))}
        >
          30 Hari Terakhir
        </button>
      </div>

      {/* Baris 3: Tabs Kategori Produk & Status Settlement */}
      <div className="flex flex-col gap-3 border-t border-neutral-800/60 pt-3 md:flex-row md:items-center md:justify-between">
        {/* Tab Kategori Produk */}
        <div
          role="tablist"
          aria-label="Filter kategori transaksi"
          className="flex flex-wrap items-center gap-1 rounded-xl border border-neutral-800 bg-[#0D111A] p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={selectedType === 'all'}
            onClick={() => onTypeChange('all')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF] active:scale-[0.98] ${
              selectedType === 'all'
                ? 'bg-[#0066FF] text-white'
                : 'text-neutral-400 hover:bg-[#131926] hover:text-white'
            }`}
          >
            Semua
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={selectedType === 'ticket'}
            onClick={() => onTypeChange('ticket')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF] active:scale-[0.98] ${
              selectedType === 'ticket'
                ? 'bg-[#0066FF] text-white'
                : 'text-neutral-400 hover:bg-[#131926] hover:text-white'
            }`}
          >
            Event
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={selectedType === 'movie_rental'}
            onClick={() => onTypeChange('movie_rental')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF] active:scale-[0.98] ${
              selectedType === 'movie_rental'
                ? 'bg-[#0066FF] text-white'
                : 'text-neutral-400 hover:bg-[#131926] hover:text-white'
            }`}
          >
            Film
          </button>
        </div>

        {/* Status Settlement Pills (Consistent Midnight Blue Surface + Semantic Status Dot) */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 flex items-center gap-1 text-[11px] text-neutral-500">
            <Filter className="h-3 w-3" />
            <span>Status:</span>
          </span>
          {(
            [
              { value: 'all', label: 'Semua', dotClass: null },
              { value: 'paid', label: 'Paid', dotClass: 'bg-emerald-400' },
              { value: 'pending', label: 'Pending', dotClass: 'bg-amber-400' },
              { value: 'expired', label: 'Expired', dotClass: 'bg-neutral-500' },
              { value: 'failed', label: 'Failed', dotClass: 'bg-rose-400' },
            ] as const
          ).map(({ value, label, dotClass }) => {
            const isActive = selectedStatus === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={isActive}
                onClick={() => onStatusChange(value)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF] active:scale-[0.98] ${
                  isActive
                    ? 'border-[#0066FF]/50 bg-[#0066FF]/15 font-semibold text-white'
                    : 'border-neutral-800 bg-[#0D111A] text-neutral-400 hover:border-neutral-700 hover:bg-[#131926] hover:text-white'
                }`}
              >
                {dotClass && (
                  <span
                    aria-hidden="true"
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`}
                  />
                )}
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
