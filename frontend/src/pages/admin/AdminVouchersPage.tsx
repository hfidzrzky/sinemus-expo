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
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useAdminVouchersQuery,
  useDeleteVoucherMutation,
  VoucherQuotaProgress,
  AdminConfirmModal,
  type AdminVoucherItem,
} from '@/features/admin';

export interface AdminVouchersPageProps {
  onNavigate?: (path: string) => void;
}

export function AdminVouchersPage({ onNavigate }: AdminVouchersPageProps): React.JSX.Element {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPromoType, setSelectedPromoType] = useState<
    'all' | 'voucher_code' | 'direct_discount'
  >('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'exhausted' | 'inactive'>(
    'all'
  );
  const [selectedTarget, setSelectedTarget] = useState<'all' | 'tickets_only' | 'vod_only'>('all');

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [voucherToDelete, setVoucherToDelete] = useState<AdminVoucherItem | null>(null);

  const { data: vouchers = [], isLoading, isError, refetch } = useAdminVouchersQuery();
  const deleteMutation = useDeleteVoucherMutation();

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
      await deleteMutation.mutateAsync(voucherToDelete.id);
      toast.success(`Promo ${voucherToDelete.code} berhasil dihapus.`);
      setVoucherToDelete(null);
    } catch {
      toast.error('Gagal menghapus voucher.');
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered vouchers list
  const filteredVouchers = useMemo(() => {
    return vouchers.filter((v) => {
      // Search code and name
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const codeMatches = v.code.toLowerCase().includes(query);
        const nameMatches = v.name ? v.name.toLowerCase().includes(query) : false;
        if (!codeMatches && !nameMatches) {
          return false;
        }
      }

      // Promo type filter
      const promoType = v.promo_type ?? 'voucher_code';
      if (selectedPromoType !== 'all' && promoType !== selectedPromoType) {
        return false;
      }

      // Target filter
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

      const usedQuota = v.used_quota ?? v.quota_used ?? 0;
      const totalQuota = v.quota ?? v.quota_total ?? 0;

      // Status filter
      if (selectedStatus === 'active') {
        return v.is_active && (totalQuota === 0 || usedQuota < totalQuota);
      }
      if (selectedStatus === 'exhausted') {
        return totalQuota > 0 && usedQuota >= totalQuota;
      }
      if (selectedStatus === 'inactive') {
        return !v.is_active;
      }

      return true;
    });
  }, [vouchers, searchTerm, selectedPromoType, selectedStatus, selectedTarget]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-extrabold tracking-tight text-white sm:text-2xl">
            Manajemen Voucher & Kupon Promo
          </h1>
          <p className="mt-1 text-xs text-neutral-400">
            Kelola kode diskon persentase dan potongan nominal untuk tiket bioskop serta sewa film
            VoD.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 self-start rounded-xl bg-[#0066FF] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-600 sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Buat Voucher Baru</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-neutral-800 bg-[#0B0E14] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari kode atau nama promosi..."
            className="w-full rounded-xl border border-neutral-800 bg-[#0D111A] py-2.5 pl-10 pr-4 text-xs text-white placeholder-neutral-500 outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Promo Type Filter Pills */}
          <div className="flex items-center gap-1 rounded-xl border border-neutral-800/80 bg-[#080B10] p-1">
            <button
              type="button"
              onClick={() => setSelectedPromoType('all')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                selectedPromoType === 'all'
                  ? 'bg-neutral-200 text-neutral-900'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Semua Tipe
            </button>
            <button
              type="button"
              onClick={() => setSelectedPromoType('voucher_code')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                selectedPromoType === 'voucher_code'
                  ? 'bg-blue-600 text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Voucher Kupon
            </button>
            <button
              type="button"
              onClick={() => setSelectedPromoType('direct_discount')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                selectedPromoType === 'direct_discount'
                  ? 'bg-emerald-600 text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Diskon Langsung
            </button>
          </div>

          {/* Target Item Filter */}
          <select
            value={selectedTarget}
            onChange={(e) =>
              setSelectedTarget(e.target.value as 'all' | 'tickets_only' | 'vod_only')
            }
            className="rounded-xl border border-neutral-800 bg-[#0D111A] px-3 py-2 text-xs text-neutral-300 outline-none focus:border-blue-500"
          >
            <option value="all">Semua Target Item</option>
            <option value="tickets_only">Hanya Tiket</option>
            <option value="vod_only">Hanya VoD</option>
          </select>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1 rounded-xl border border-neutral-800/80 bg-[#080B10] p-1">
            <button
              type="button"
              onClick={() => setSelectedStatus('all')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                selectedStatus === 'all'
                  ? 'bg-neutral-200 text-neutral-900'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus('active')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                selectedStatus === 'active'
                  ? 'bg-emerald-500 text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Aktif
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus('exhausted')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                selectedStatus === 'exhausted'
                  ? 'bg-amber-500 font-extrabold text-neutral-950'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Habis
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus('inactive')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                selectedStatus === 'inactive'
                  ? 'bg-neutral-700 text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Nonaktif
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-[#0B0E14]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left text-xs">
            <thead className="border-b border-neutral-800 bg-[#0D111A] text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              <tr>
                <th className="px-6 py-4">Kode & Nama Promo</th>
                <th className="px-4 py-4">Tipe Promo</th>
                <th className="px-4 py-4">Tipe Potongan</th>
                <th className="px-4 py-4">Min. Pembelian</th>
                <th className="w-48 px-4 py-4">Kuota Terpakai</th>
                <th className="px-4 py-4">Target Item</th>
                <th className="px-4 py-4">Periode Aktif</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80 text-neutral-300">
              {isLoading && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-neutral-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                      <span className="text-xs">Memuat inventaris voucher...</span>
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
                        className="mt-1 rounded-lg bg-neutral-800 px-3 py-1 text-xs text-white hover:bg-neutral-700"
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
                      Belum ada voucher yang cocok dengan filter pencarian.
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
                  const isExhausted = totalQuota > 0 && usedQuota >= totalQuota;

                  return (
                    <tr key={voucher.id} className="transition hover:bg-neutral-900/40">
                      {/* Kode & Nama Promo */}
                      <td className="px-6 py-4">
                        {(voucher.promo_type ?? 'voucher_code') === 'direct_discount' ? (
                          <div>
                            <span className="block text-xs font-bold text-white">
                              {voucher.name || 'Diskon Coret Katalog'}
                            </span>
                          </div>
                        ) : voucher.name ? (
                          <div>
                            <span className="block text-xs font-bold text-white">
                              {voucher.name}
                            </span>
                            <div className="mt-0.5 flex items-center gap-1.5">
                              <Tag className="h-3 w-3 text-neutral-500" />
                              <span className="font-mono text-[11px] text-neutral-400">
                                {voucher.code}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Tag className="h-3.5 w-3.5 text-blue-400" />
                            <span className="font-mono text-xs font-bold tracking-wider text-white">
                              {voucher.code}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Tipe Promo */}
                      <td className="px-4 py-4">
                        {(voucher.promo_type ?? 'voucher_code') === 'direct_discount' ? (
                          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                            Diskon Langsung
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-400">
                            Kupon Voucher
                          </span>
                        )}
                      </td>

                      {/* Tipe Potongan */}
                      <td className="px-4 py-4">
                        {voucher.discount_type === 'percentage' ? (
                          <div>
                            <strong className="text-white">Diskon {discountValue}%</strong>
                            {maxDiscount != null && (
                              <span className="block text-[10px] text-neutral-500">
                                Maks Rp {Number(maxDiscount).toLocaleString('id-ID')}
                              </span>
                            )}
                          </div>
                        ) : voucher.discount_type === 'slashed_price' ? (
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-bold text-rose-400">
                                Coret Harga
                              </span>
                              <strong className="text-white">
                                Potong Rp {Number(discountValue).toLocaleString('id-ID')}
                              </strong>
                            </div>
                            <span className="block text-[10px] text-neutral-500">
                              Potongan langsung
                            </span>
                          </div>
                        ) : (
                          <strong className="text-emerald-400">
                            Potongan Rp {Number(discountValue).toLocaleString('id-ID')}
                          </strong>
                        )}
                      </td>

                      {/* Min. Transaksi */}
                      <td className="px-4 py-4 font-mono text-neutral-300">
                        {voucher.promo_type === 'direct_discount' ? (
                          <span className="text-xs text-neutral-500">Tanpa Syarat</span>
                        ) : (
                          `Rp ${Number(minPurchase).toLocaleString('id-ID')}`
                        )}
                      </td>

                      {/* Kuota Terpakai */}
                      <td className="px-4 py-4">
                        {voucher.promo_type === 'direct_discount' ? (
                          <span className="text-xs font-semibold text-emerald-400">
                            Tanpa Batas
                          </span>
                        ) : (
                          <VoucherQuotaProgress usedQuota={usedQuota} totalQuota={totalQuota} />
                        )}
                      </td>

                      {/* Target Item */}
                      <td className="px-4 py-4">
                        {voucher.event_id ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex w-fit items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                              Event Khusus
                            </span>
                            {voucher.event_title && (
                              <span
                                className="max-w-[140px] truncate text-[11px] text-neutral-300"
                                title={voucher.event_title}
                              >
                                {voucher.event_title}
                              </span>
                            )}
                          </div>
                        ) : voucher.movie_id ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex w-fit items-center gap-1 rounded-md bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold text-sky-400">
                              Film Khusus
                            </span>
                            {voucher.movie_title && (
                              <span
                                className="max-w-[140px] truncate text-[11px] text-neutral-300"
                                title={voucher.movie_title}
                              >
                                {voucher.movie_title}
                              </span>
                            )}
                          </div>
                        ) : targetItem === 'tickets_only' ? (
                          <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-400">
                            Semua Tiket
                          </span>
                        ) : targetItem === 'vod_only' ? (
                          <span className="rounded-md bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-400">
                            Semua VoD
                          </span>
                        ) : (
                          <span className="rounded-md bg-neutral-800 px-2 py-0.5 text-[10px] font-bold text-neutral-300">
                            Semua Item
                          </span>
                        )}
                      </td>

                      {/* Periode */}
                      <td className="px-4 py-4 text-[11px] text-neutral-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-neutral-500" />
                          <span>
                            {voucher.valid_from
                              ? new Date(voucher.valid_from).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                })
                              : '-'}{' '}
                            -{' '}
                            {voucher.valid_until
                              ? new Date(voucher.valid_until).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : '-'}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        {!voucher.is_active ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-neutral-800 px-2.5 py-0.5 text-[10px] font-bold text-neutral-400">
                            <XCircle className="h-3 w-3" />
                            <span>NONAKTIF</span>
                          </span>
                        ) : isExhausted ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-400">
                            <AlertCircle className="h-3 w-3" />
                            <span>KUOTA PENUH</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>AKTIF</span>
                          </span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(voucher)}
                            className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-neutral-800 hover:text-white"
                            title="Edit Voucher"
                          >
                            <Edit2 className="h-3.5 w-3.5 text-blue-400" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(voucher)}
                            disabled={deletingId === voucher.id}
                            className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-neutral-800 hover:text-rose-400"
                            title="Hapus Voucher"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Popup Konfirmasi Hapus Voucher (Revisi 7) */}
      <AdminConfirmModal
        isOpen={Boolean(voucherToDelete)}
        title="Hapus Promo Voucher?"
        description={
          <p>
            Apakah Anda yakin ingin menghapus promo{' '}
            <strong className="text-white">
              {voucherToDelete?.name
                ? `"${voucherToDelete.name}" (${voucherToDelete.code})`
                : `"${voucherToDelete?.code}"`}
            </strong>
            ? Kode promo ini tidak akan dapat digunakan lagi untuk pemotongan harga tiket bioskop
            maupun sewa film.
          </p>
        }
        confirmLabel="Ya, Hapus Promo"
        cancelLabel="Batal"
        isLoading={deleteMutation.isPending}
        variant="danger"
        onConfirm={handleConfirmDelete}
        onClose={() => setVoucherToDelete(null)}
      />
    </div>
  );
}
