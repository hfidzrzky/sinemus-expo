import React, { useState, useMemo } from 'react';
import {
  Tag,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Archive,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useAdminVouchersQuery,
  useDeleteVoucherMutation,
  useToggleVoucherStatusMutation,
  useRestoreVoucherMutation,
  VoucherQuotaProgress,
  AdminConfirmModal,
  type AdminVoucherItem,
  type VoucherStatus,
} from '@/features/admin';

export interface AdminVouchersPageProps {
  onNavigate?: (path: string) => void;
}

export function AdminVouchersPage({ onNavigate }: AdminVouchersPageProps): React.JSX.Element {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPromoType, setSelectedPromoType] = useState<
    'all' | 'voucher_code' | 'direct_discount'
  >('all');
  const [selectedStatus, setSelectedStatus] = useState<VoucherStatus>('all');
  const [selectedTarget, setSelectedTarget] = useState<'all' | 'tickets_only' | 'vod_only'>('all');

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [voucherToDelete, setVoucherToDelete] = useState<AdminVoucherItem | null>(null);

  // Global queries untuk menghitung KPI summary cards secara akurat
  const { data: allVouchers = [] } = useAdminVouchersQuery();
  const { data: archivedVouchers = [] } = useAdminVouchersQuery({ status: 'archived' });

  // TanStack Query dengan Server-Side Filters untuk data tabel
  const {
    data: vouchers = [],
    isLoading,
    isError,
    refetch,
  } = useAdminVouchersQuery({
    status: selectedStatus,
    promo_type: selectedPromoType,
    search: searchTerm.trim() || undefined,
  });

  const deleteMutation = useDeleteVoucherMutation();
  const toggleStatusMutation = useToggleVoucherStatusMutation();
  const restoreMutation = useRestoreVoucherMutation();

  // Hitung metrik KPI ringkasan eksekutif
  const summary = useMemo(() => {
    const total = allVouchers.length;
    const active = allVouchers.filter((v) => {
      if (!v.is_active) return false;
      const status = v.status ?? 'active';
      return status === 'active';
    }).length;
    const exhausted = allVouchers.filter((v) => {
      const used = v.used_quota ?? v.quota_used ?? 0;
      const totalQ = v.quota ?? v.quota_total ?? 0;
      return totalQ > 0 && used >= totalQ;
    }).length;
    const archived = archivedVouchers.length;

    return { total, active, exhausted, archived };
  }, [allVouchers, archivedVouchers]);

  const handleOpenCreate = () => {
    if (onNavigate) {
      onNavigate('/admin/vouchers/new');
    }
  };

  const handleOpenEdit = (voucher: AdminVoucherItem) => {
    if (onNavigate) {
      onNavigate(`/admin/vouchers/${voucher.id}/edit`);
    }
  };

  const handleDelete = (voucher: AdminVoucherItem) => {
    setVoucherToDelete(voucher);
  };

  const handleConfirmDelete = async () => {
    if (!voucherToDelete) return;

    try {
      setDeletingId(voucherToDelete.id);
      const res = await deleteMutation.mutateAsync(voucherToDelete.id);

      if (res.data.mode === 'archived') {
        toast.success(
          `Promo "${voucherToDelete.code}" ditiadakan dari daftar utama dan dipindahkan ke Arsip.`
        );
      } else {
        toast.success(`Promo "${voucherToDelete.code}" berhasil dihapus permanen.`);
      }
      setVoucherToDelete(null);
    } catch {
      toast.error('Gagal menghapus voucher promo.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (voucher: AdminVoucherItem) => {
    try {
      setTogglingId(voucher.id);
      await toggleStatusMutation.mutateAsync(voucher.id);
      const nextStatusText = !voucher.is_active ? 'diaktifkan' : 'dinonaktifkan';
      toast.success(`Promo "${voucher.code}" berhasil ${nextStatusText}.`);
    } catch {
      toast.error('Gagal memperbarui status aktif voucher.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleRestore = async (voucher: AdminVoucherItem) => {
    try {
      setRestoringId(voucher.id);
      await restoreMutation.mutateAsync(voucher.id);
      toast.success(`Promo "${voucher.code}" berhasil dipulihkan dari arsip.`);
    } catch {
      toast.error('Gagal memulihkan voucher.');
    } finally {
      setRestoringId(null);
    }
  };

  // Client-side additional target item filter
  const filteredVouchers = useMemo(() => {
    return vouchers.filter((v) => {
      const target =
        v.target_item ??
        (v.item_type === 'ticket'
          ? 'tickets_only'
          : v.item_type === 'movie_rental'
            ? 'vod_only'
            : 'all');
      if (selectedTarget !== 'all' && target !== selectedTarget) {
        return false;
      }
      return true;
    });
  }, [vouchers, selectedTarget]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-extrabold tracking-tight text-white sm:text-2xl">
            Manajemen Voucher & Kupon Promo
          </h1>
          <p className="mt-1 text-xs text-neutral-400">
            Kelola kode diskon persentase, potongan nominal, direct discount katalog bioskop, dan
            sewa film VoD.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#0066FF] px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF] active:scale-[0.98] sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Buat Voucher Baru</span>
        </button>
      </div>

      {/* KPI Summary Cards (Executive Overview) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {/* Total Promo */}
        <div className="rounded-2xl border border-neutral-800 bg-[#0B0E14] p-3.5 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-neutral-400">Total Promo</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-800 text-neutral-300">
              <Tag className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="font-display text-xl font-extrabold text-white sm:text-2xl">
              {summary.total}
            </span>
            <span className="text-[10px] text-neutral-500">Kupon & Diskon</span>
          </div>
        </div>

        {/* Promo Aktif */}
        <div className="rounded-2xl border border-neutral-800 bg-[#0B0E14] p-3.5 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-neutral-400">Promo Aktif</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="font-display text-xl font-extrabold text-emerald-400 sm:text-2xl">
              {summary.active}
            </span>
            <span className="text-[10px] text-neutral-500">Dapat Digunakan</span>
          </div>
        </div>

        {/* Kuota Penuh */}
        <div className="rounded-2xl border border-neutral-800 bg-[#0B0E14] p-3.5 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-neutral-400">Kuota Penuh</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
              <AlertCircle className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="font-display text-xl font-extrabold text-amber-400 sm:text-2xl">
              {summary.exhausted}
            </span>
            <span className="text-[10px] text-neutral-500">Batas Tercapai</span>
          </div>
        </div>

        {/* Diarsipkan */}
        <div className="rounded-2xl border border-neutral-800 bg-[#0B0E14] p-3.5 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-neutral-400">Diarsipkan</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
              <Archive className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="font-display text-xl font-extrabold text-blue-400 sm:text-2xl">
              {summary.archived}
            </span>
            <span className="text-[10px] text-neutral-500">Nonaktif / Arsip</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar (Single Unified Row) */}
      <div className="flex flex-col gap-3 rounded-2xl border border-neutral-800 bg-[#0B0E14] p-3 text-xs sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari kode atau nama promosi..."
            className="w-full rounded-xl border border-neutral-800 bg-[#0D111A] py-2 pl-9 pr-9 text-xs text-white placeholder-neutral-500 focus:border-[#0066FF] focus:outline-none"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-neutral-400 hover:bg-neutral-800 hover:text-white"
              title="Bersihkan pencarian"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Promo Type */}
          <select
            value={selectedPromoType}
            onChange={(e) => setSelectedPromoType(e.target.value as typeof selectedPromoType)}
            className="w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3 py-2 text-xs text-neutral-300 focus:border-[#0066FF] focus:outline-none sm:w-auto"
          >
            <option value="all">Semua Tipe Promo</option>
            <option value="voucher_code">Voucher Kupon</option>
            <option value="direct_discount">Diskon Langsung</option>
          </select>

          {/* Target Item */}
          <select
            value={selectedTarget}
            onChange={(e) =>
              setSelectedTarget(e.target.value as 'all' | 'tickets_only' | 'vod_only')
            }
            className="w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3 py-2 text-xs text-neutral-300 focus:border-[#0066FF] focus:outline-none sm:w-auto"
          >
            <option value="all">Semua Target Item</option>
            <option value="tickets_only">Hanya Tiket</option>
            <option value="vod_only">Hanya VoD</option>
          </select>

          {/* Status */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as VoucherStatus)}
            className="w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3 py-2 text-xs text-neutral-300 focus:border-[#0066FF] focus:outline-none sm:w-auto"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="scheduled">Mendatang</option>
            <option value="expired">Kedaluwarsa</option>
            <option value="exhausted">Kuota Habis</option>
            <option value="inactive">Nonaktif</option>
            <option value="archived">Diarsipkan</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-[#0B0E14]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-left text-xs">
            <thead className="border-b border-neutral-800 bg-[#0D111A] text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              <tr>
                <th className="whitespace-nowrap px-5 py-4">Kode & Nama Promo</th>
                <th className="whitespace-nowrap px-3.5 py-4">Tipe Promo</th>
                <th className="whitespace-nowrap px-3.5 py-4">Tipe Potongan</th>
                <th className="whitespace-nowrap px-3.5 py-4">Min. Pembelian</th>
                <th className="min-w-[140px] whitespace-nowrap px-3.5 py-4">Kuota Terpakai</th>
                <th className="whitespace-nowrap px-3.5 py-4">Target Item</th>
                <th className="whitespace-nowrap px-3.5 py-4">Periode Aktif</th>
                <th className="whitespace-nowrap px-3.5 py-4 text-center">Status & Switch</th>
                <th className="whitespace-nowrap px-5 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
              {isLoading && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-neutral-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                      <span className="text-xs">Memuat inventaris voucher promo...</span>
                    </div>
                  </td>
                </tr>
              )}

              {isError && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-rose-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="h-6 w-6" />
                      <span className="text-xs font-semibold">Gagal memuat voucher</span>
                      <button
                        type="button"
                        onClick={() => refetch()}
                        className="mt-1 rounded-lg bg-neutral-800 px-3 py-1 text-xs text-white transition hover:bg-neutral-700"
                      >
                        Coba Lagi
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading && !isError && filteredVouchers.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center text-neutral-500">
                    <Tag className="mx-auto mb-2 h-10 w-10 text-neutral-600" />
                    <p className="text-sm font-bold text-neutral-400">
                      Tidak ada voucher ditemukan
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {selectedStatus === 'archived'
                        ? 'Tidak ada voucher promo yang berada di dalam arsip.'
                        : 'Belum ada voucher yang cocok dengan filter pencarian.'}
                    </p>
                  </td>
                </tr>
              )}

              {!isLoading &&
                !isError &&
                filteredVouchers.map((voucher) => {
                  const usedQuota = voucher.used_quota ?? voucher.quota_used ?? 0;
                  const totalQuota = voucher.quota ?? voucher.quota_total ?? 0;
                  const minPurchase = voucher.min_transaction_amount ?? voucher.min_purchase ?? 0;
                  const maxDiscount = voucher.max_discount_amount ?? voucher.max_discount;
                  const discountValue = voucher.discount_value ?? 0;
                  const targetItem =
                    voucher.target_item ??
                    (voucher.item_type === 'ticket'
                      ? 'tickets_only'
                      : voucher.item_type === 'movie_rental'
                        ? 'vod_only'
                        : 'all');

                  const status = voucher.status ?? (voucher.is_active ? 'active' : 'inactive');

                  // Format dates
                  const validFromStr = voucher.valid_from
                    ? new Date(voucher.valid_from).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                      })
                    : '-';
                  const validUntilStr = voucher.valid_until
                    ? new Date(voucher.valid_until).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '-';

                  const hasDistinctName =
                    Boolean(voucher.name) &&
                    voucher.name?.trim().toLowerCase() !== voucher.code.trim().toLowerCase();

                  return (
                    <tr
                      key={voucher.id}
                      className="border-b border-neutral-800/60 transition-colors last:border-b-0 hover:bg-neutral-900/40"
                    >
                      {/* Kode & Nama Promo */}
                      <td className="px-5 py-3.5 align-middle">
                        {(voucher.promo_type ?? 'voucher_code') === 'direct_discount' ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-white">
                              {voucher.name || 'Diskon Coret Katalog'}
                            </span>
                          </div>
                        ) : hasDistinctName ? (
                          <div className="flex flex-col gap-0.5">
                            <span
                              className="max-w-[190px] truncate text-xs font-semibold text-white"
                              title={voucher.name || ''}
                            >
                              {voucher.name}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="inline-flex items-center gap-1 rounded border border-neutral-800 bg-neutral-900 px-1.5 py-0.5 font-mono text-[10px] font-medium text-blue-400">
                                <Tag className="h-2.5 w-2.5" />
                                {voucher.code}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1.5 rounded-md border border-neutral-800 bg-neutral-900 px-2 py-1 font-mono text-xs font-bold tracking-wider text-white">
                              <Tag className="h-3 w-3 text-blue-400" />
                              {voucher.code}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Tipe Promo */}
                      <td className="whitespace-nowrap px-3.5 py-3.5 align-middle">
                        {(voucher.promo_type ?? 'voucher_code') === 'direct_discount' ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/20 bg-sky-950/40 px-2.5 py-0.5 text-[10px] font-semibold text-sky-400">
                            <Sparkles className="h-2.5 w-2.5" />
                            <span>Diskon Langsung</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/20 bg-blue-950/40 px-2.5 py-0.5 text-[10px] font-semibold text-blue-400">
                            <Tag className="h-2.5 w-2.5" />
                            <span>Kupon Voucher</span>
                          </span>
                        )}
                      </td>

                      {/* Tipe Potongan */}
                      <td className="whitespace-nowrap px-3.5 py-3.5 align-middle">
                        {voucher.discount_type === 'percentage' ? (
                          <div className="inline-flex items-center gap-1.5 font-mono">
                            <span className="rounded-full border border-emerald-500/20 bg-emerald-950/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                              Diskon
                            </span>
                            <span className="text-xs font-semibold text-white">
                              {discountValue}%
                            </span>
                            {maxDiscount != null && (
                              <span className="text-[10px] text-neutral-500">
                                (Maks Rp {Number(maxDiscount).toLocaleString('id-ID')})
                              </span>
                            )}
                          </div>
                        ) : voucher.discount_type === 'slashed_price' ? (
                          <div className="inline-flex items-center gap-1.5 font-mono">
                            <span className="rounded-full border border-rose-500/20 bg-rose-950/40 px-2 py-0.5 text-[10px] font-semibold text-rose-400">
                              Coret
                            </span>
                            <span className="text-xs font-semibold text-white">
                              Potong Rp {Number(discountValue).toLocaleString('id-ID')}
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 font-mono">
                            <span className="rounded-full border border-blue-500/20 bg-blue-950/40 px-2 py-0.5 text-[10px] font-semibold text-blue-400">
                              Potongan
                            </span>
                            <span className="text-xs font-semibold text-white">
                              Rp {Number(discountValue).toLocaleString('id-ID')}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Min. Pembelian */}
                      <td className="whitespace-nowrap px-3.5 py-3.5 align-middle font-mono text-xs">
                        {voucher.promo_type === 'direct_discount' ? (
                          <span className="text-neutral-500">Tanpa Syarat</span>
                        ) : (
                          <span className="text-neutral-300">
                            Rp {Number(minPurchase).toLocaleString('id-ID')}
                          </span>
                        )}
                      </td>

                      {/* Kuota Terpakai */}
                      <td className="whitespace-nowrap px-3.5 py-3.5 align-middle">
                        {voucher.promo_type === 'direct_discount' ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/20 bg-blue-950/30 px-2.5 py-0.5 font-mono text-[10px] font-medium text-blue-400">
                            ∞ Tanpa Batas
                          </span>
                        ) : (
                          <VoucherQuotaProgress usedQuota={usedQuota} totalQuota={totalQuota} />
                        )}
                      </td>

                      {/* Target Item (Horizontal Inline) */}
                      <td className="whitespace-nowrap px-3.5 py-3.5 align-middle">
                        {voucher.event_id ? (
                          <div className="inline-flex items-center gap-1.5">
                            <span className="rounded-full border border-amber-500/20 bg-amber-950/40 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                              Event Khusus
                            </span>
                            {voucher.event_title && (
                              <span
                                className="max-w-[130px] truncate text-xs font-medium text-neutral-300"
                                title={voucher.event_title}
                              >
                                {voucher.event_title}
                              </span>
                            )}
                          </div>
                        ) : voucher.movie_id ? (
                          <div className="inline-flex items-center gap-1.5">
                            <span className="rounded-full border border-sky-500/20 bg-sky-950/40 px-2 py-0.5 text-[10px] font-semibold text-sky-400">
                              Film Khusus
                            </span>
                            {voucher.movie_title && (
                              <span
                                className="max-w-[130px] truncate text-xs font-medium text-neutral-300"
                                title={voucher.movie_title}
                              >
                                {voucher.movie_title}
                              </span>
                            )}
                          </div>
                        ) : targetItem === 'tickets_only' ? (
                          <span className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-950/40 px-2.5 py-0.5 text-[10px] font-semibold text-blue-400">
                            Semua Tiket
                          </span>
                        ) : targetItem === 'vod_only' ? (
                          <span className="inline-flex items-center rounded-full border border-purple-500/20 bg-purple-950/40 px-2.5 py-0.5 text-[10px] font-semibold text-purple-400">
                            Semua VoD
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-neutral-800 bg-neutral-900 px-2.5 py-0.5 text-[10px] font-semibold text-neutral-400">
                            Semua Item
                          </span>
                        )}
                      </td>

                      {/* Periode Aktif */}
                      <td className="whitespace-nowrap px-3.5 py-3.5 align-middle">
                        <div className="inline-flex items-center gap-1.5 font-mono text-[11px] text-neutral-400">
                          <Calendar className="h-3 w-3 flex-shrink-0 text-neutral-500" />
                          <span>
                            {validFromStr} – {validUntilStr}
                          </span>
                        </div>
                      </td>

                      {/* Status & Inline Switch Toggle */}
                      <td className="whitespace-nowrap px-3.5 py-3.5 text-center align-middle">
                        <div className="inline-flex items-center justify-center gap-2">
                          {status === 'archived' ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/20 bg-blue-950/40 px-2.5 py-0.5 text-[10px] font-semibold text-blue-400">
                              <Archive className="h-2.5 w-2.5" />
                              <span>DIARSIPKAN</span>
                            </span>
                          ) : status === 'inactive' ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-neutral-800 bg-neutral-900 px-2.5 py-0.5 text-[10px] font-semibold text-neutral-400">
                              <XCircle className="h-2.5 w-2.5 text-neutral-500" />
                              <span>NONAKTIF</span>
                            </span>
                          ) : status === 'scheduled' ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/20 bg-sky-950/40 px-2.5 py-0.5 text-[10px] font-semibold text-sky-400">
                              <Clock className="h-2.5 w-2.5" />
                              <span>MENDATANG</span>
                            </span>
                          ) : status === 'expired' ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/20 bg-rose-950/40 px-2.5 py-0.5 text-[10px] font-semibold text-rose-400">
                              <XCircle className="h-2.5 w-2.5 text-rose-400" />
                              <span>KEDALUWARSA</span>
                            </span>
                          ) : status === 'exhausted' ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-950/40 px-2.5 py-0.5 text-[10px] font-semibold text-amber-400">
                              <AlertCircle className="h-2.5 w-2.5 text-amber-400" />
                              <span>KUOTA HABIS</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                              <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />
                              <span>AKTIF</span>
                            </span>
                          )}

                          {/* Tactile Quick Toggle Switch (Non-archived only) */}
                          {status !== 'archived' && (
                            <button
                              type="button"
                              role="switch"
                              aria-checked={voucher.is_active}
                              disabled={togglingId === voucher.id}
                              onClick={() => handleToggleStatus(voucher)}
                              className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full border border-neutral-700 transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF] ${
                                voucher.is_active ? 'bg-emerald-500' : 'bg-neutral-800'
                              } ${togglingId === voucher.id ? 'cursor-wait opacity-50' : ''}`}
                              title={
                                voucher.is_active
                                  ? 'Klik untuk menonaktifkan promo'
                                  : 'Klik untuk mengaktifkan promo'
                              }
                            >
                              <span
                                className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                                  voucher.is_active ? 'translate-x-3.5' : 'translate-x-0.5'
                                }`}
                              />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Aksi */}
                      <td className="whitespace-nowrap px-5 py-3.5 text-right align-middle">
                        {status === 'archived' ? (
                          <button
                            type="button"
                            onClick={() => handleRestore(voucher)}
                            disabled={restoringId === voucher.id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/15 px-2.5 py-1 text-xs font-semibold text-blue-300 transition hover:bg-blue-500/25 active:scale-95 disabled:opacity-50"
                            title="Pulihkan Voucher dari Arsip"
                          >
                            <RotateCcw className="h-3 w-3 text-blue-400" />
                            <span>Pulihkan</span>
                          </button>
                        ) : (
                          <div className="inline-flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(voucher)}
                              className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-neutral-800 hover:text-white active:scale-95"
                              title="Edit Voucher"
                            >
                              <Edit2 className="h-3.5 w-3.5 text-neutral-300" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(voucher)}
                              disabled={deletingId === voucher.id}
                              className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-neutral-800 hover:text-rose-400 active:scale-95 disabled:opacity-50"
                              title="Hapus / Tiadakan Voucher"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Table Footer Meta */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-neutral-800 bg-[#0D111A] px-6 py-3.5 sm:flex-row">
          <div className="text-xs text-neutral-400">
            Menampilkan{' '}
            <strong className="font-semibold text-white">{filteredVouchers.length}</strong> promo
            voucher
          </div>
        </div>
      </div>

      {/* Modal Popup Konfirmasi Hapus Voucher */}
      <AdminConfirmModal
        isOpen={Boolean(voucherToDelete)}
        title="Hapus / Tiadakan Promo Voucher?"
        description={
          <div className="space-y-2 text-xs text-neutral-300">
            <p>
              Apakah Anda yakin ingin menghapus promo{' '}
              <strong className="text-white">
                {voucherToDelete?.name
                  ? `"${voucherToDelete.name}" (${voucherToDelete.code})`
                  : `"${voucherToDelete?.code}"`}
              </strong>
              ?
            </p>
            {voucherToDelete &&
            (voucherToDelete.used_quota ?? voucherToDelete.quota_used ?? 0) > 0 ? (
              <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-2 text-amber-300">
                ⚠️ Promo ini telah memiliki riwayat pemakaian. Promo akan ditiadakan dari daftar
                utama dan dipindahkan ke <strong>Arsip</strong> agar rekam jejak keuangan tetap
                aman.
              </p>
            ) : (
              <p className="rounded-lg border border-neutral-700 bg-neutral-900 p-2 text-neutral-400">
                Promo ini belum pernah digunakan dan akan dihapus secara permanen dari sistem.
              </p>
            )}
          </div>
        }
        confirmLabel="Ya, Lanjutkan"
        cancelLabel="Batal"
        isLoading={deleteMutation.isPending}
        variant="danger"
        onConfirm={handleConfirmDelete}
        onClose={() => setVoucherToDelete(null)}
      />
    </div>
  );
}
