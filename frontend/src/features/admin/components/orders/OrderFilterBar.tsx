import React from 'react';
import { Search, X, Calendar, Download, RefreshCw, Filter } from 'lucide-react';

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

  const setPresetDate = (days: number | 'all') => {
    if (days === 'all') {
      onStartDateChange('');
      onEndDateChange('');
      return;
    }
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);

    onStartDateChange(start.toISOString().split('T')[0]);
    onEndDateChange(end.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-4 rounded-2xl border border-neutral-800 bg-[#0B0E14] p-4 shadow-xl sm:p-5">
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
          onClick={() => setPresetDate('all')}
          className={`rounded-lg px-2.5 py-1 font-medium transition ${
            startDate === '' && endDate === ''
              ? 'bg-blue-500/20 font-bold text-blue-400'
              : 'text-neutral-400 hover:bg-neutral-800/60 hover:text-white'
          }`}
        >
          Semua Waktu
        </button>
        <button
          type="button"
          onClick={() => setPresetDate(0)}
          className="rounded-lg px-2.5 py-1 font-medium text-neutral-400 transition hover:bg-neutral-800/60 hover:text-white"
        >
          Hari Ini
        </button>
        <button
          type="button"
          onClick={() => setPresetDate(7)}
          className="rounded-lg px-2.5 py-1 font-medium text-neutral-400 transition hover:bg-neutral-800/60 hover:text-white"
        >
          7 Hari Terakhir
        </button>
        <button
          type="button"
          onClick={() => setPresetDate(30)}
          className="rounded-lg px-2.5 py-1 font-medium text-neutral-400 transition hover:bg-neutral-800/60 hover:text-white"
        >
          30 Hari Terakhir
        </button>
      </div>

      {/* Baris 3: Tabs Kategori Produk & Status Settlement */}
      <div className="flex flex-col gap-3 border-t border-neutral-800/60 pt-3 md:flex-row md:items-center md:justify-between">
        {/* Tab Kategori Produk */}
        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-neutral-800/80 bg-[#080B10] p-1">
          <button
            type="button"
            onClick={() => onTypeChange('all')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              selectedType === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Semua Transaksi
          </button>
          <button
            type="button"
            onClick={() => onTypeChange('ticket')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              selectedType === 'ticket'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span>Tiket Bioskop (SNM-TKT)</span>
          </button>
          <button
            type="button"
            onClick={() => onTypeChange('movie_rental')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              selectedType === 'movie_rental'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span>Sewa VoD (SNM-VOD)</span>
          </button>
        </div>

        {/* Status Settlement Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 flex items-center gap-1 text-[11px] text-neutral-500">
            <Filter className="h-3 w-3" />
            <span>Status:</span>
          </span>
          <button
            type="button"
            onClick={() => onStatusChange('all')}
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
              selectedStatus === 'all'
                ? 'bg-neutral-200 text-neutral-900'
                : 'border border-neutral-800 bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white'
            }`}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => onStatusChange('paid')}
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
              selectedStatus === 'paid'
                ? 'bg-emerald-500 text-white'
                : 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
            }`}
          >
            Paid
          </button>
          <button
            type="button"
            onClick={() => onStatusChange('pending')}
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
              selectedStatus === 'pending'
                ? 'bg-amber-500 font-extrabold text-neutral-950 shadow-sm'
                : 'border border-amber-500/20 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
            }`}
          >
            Pending
          </button>
          <button
            type="button"
            onClick={() => onStatusChange('expired')}
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
              selectedStatus === 'expired'
                ? 'bg-neutral-600 text-white'
                : 'border border-neutral-700/60 bg-neutral-800/80 text-neutral-400 hover:bg-neutral-800 hover:text-white'
            }`}
          >
            Expired
          </button>
          <button
            type="button"
            onClick={() => onStatusChange('failed')}
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
              selectedStatus === 'failed'
                ? 'bg-rose-600 text-white'
                : 'border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
            }`}
          >
            Failed
          </button>
        </div>
      </div>
    </div>
  );
}
