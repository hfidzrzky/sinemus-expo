import React, { useState } from 'react';
import { X, Tag, Loader2, Film, Calendar, Scissors } from 'lucide-react';
import { toast } from 'sonner';
import {
  useCreateVoucherMutation,
  useUpdateVoucherMutation,
  useAdminMoviesQuery,
  useAdminEventsQuery,
} from '../../api';
import { DateTimePicker24 } from '../common';
import type { AdminVoucherItem, CreateVoucherPayload, PromoType } from '../../types';

export interface VoucherFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  voucherToEdit?: AdminVoucherItem | null;
}

interface VoucherFormModalContentProps {
  onClose: () => void;
  voucherToEdit?: AdminVoucherItem | null;
}

export type VoucherScopeType = 'all' | 'event' | 'movie' | 'tickets_only' | 'vod_only';

function VoucherFormModalContent({
  onClose,
  voucherToEdit,
}: VoucherFormModalContentProps): React.JSX.Element {
  const isEditing = Boolean(voucherToEdit);

  const { data: movies = [], isLoading: _isLoadingMovies } = useAdminMoviesQuery();
  const { data: events = [], isLoading: _isLoadingEvents } = useAdminEventsQuery();

  const [promoType, setPromoType] = useState<PromoType>(
    voucherToEdit?.promo_type ?? 'voucher_code'
  );
  const [name, setName] = useState(voucherToEdit?.name ?? '');
  const [code, setCode] = useState(voucherToEdit ? voucherToEdit.code : '');
  const [maxUsesPerUser, setMaxUsesPerUser] = useState<number>(
    voucherToEdit?.max_uses_per_user ?? 1
  );
  const [isUserLimitEnabled, setIsUserLimitEnabled] = useState<boolean>(
    Boolean(voucherToEdit?.max_uses_per_user)
  );
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed_amount' | 'slashed_price'>(
    () => {
      if (!voucherToEdit) return 'percentage';
      if (voucherToEdit.discount_type === 'slashed_price') return 'slashed_price';
      return voucherToEdit.discount_type === 'fixed' ||
        voucherToEdit.discount_type === 'fixed_amount'
        ? 'fixed_amount'
        : (voucherToEdit.discount_type as 'percentage' | 'fixed_amount' | 'slashed_price');
    }
  );
  const [discountValue, setDiscountValue] = useState<number>(
    voucherToEdit ? (voucherToEdit.discount_value ?? 20) : 20
  );
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<string>(() => {
    if (!voucherToEdit) return '20000';
    const maxVal = voucherToEdit.max_discount_amount ?? voucherToEdit.max_discount;
    return maxVal != null ? String(maxVal) : '';
  });
  const [minTransactionAmount, setMinTransactionAmount] = useState<number>(() => {
    if (!voucherToEdit) return 20000;
    return voucherToEdit.min_transaction_amount ?? voucherToEdit.min_purchase ?? 20000;
  });

  const [scopeType, setScopeType] = useState<VoucherScopeType>(() => {
    if (!voucherToEdit) return 'all';
    if (voucherToEdit.event_id) return 'event';
    if (voucherToEdit.movie_id) return 'movie';
    if (voucherToEdit.target_item === 'tickets_only' || voucherToEdit.item_type === 'ticket') {
      return 'tickets_only';
    }
    if (voucherToEdit.target_item === 'vod_only' || voucherToEdit.item_type === 'movie_rental') {
      return 'vod_only';
    }
    return 'all';
  });

  const [selectedEventId, setSelectedEventId] = useState<number | ''>(() => {
    return voucherToEdit && voucherToEdit.event_id ? voucherToEdit.event_id : '';
  });

  const [selectedMovieId, setSelectedMovieId] = useState<number | ''>(() => {
    return voucherToEdit && voucherToEdit.movie_id ? voucherToEdit.movie_id : '';
  });

  const [quota, setQuota] = useState<number>(() => {
    if (!voucherToEdit) return 100;
    return voucherToEdit.quota ?? voucherToEdit.quota_total ?? 100;
  });

  const [validFrom, setValidFrom] = useState(() => {
    if (voucherToEdit && voucherToEdit.valid_from) {
      return voucherToEdit.valid_from.substring(0, 16);
    }
    return new Date().toISOString().substring(0, 16);
  });

  const [validUntil, setValidUntil] = useState(() => {
    if (voucherToEdit && voucherToEdit.valid_until) {
      return voucherToEdit.valid_until.substring(0, 16);
    }
    const inOneMonth = new Date();
    inOneMonth.setMonth(inOneMonth.getMonth() + 1);
    return inOneMonth.toISOString().substring(0, 16);
  });

  const [isActive, setIsActive] = useState(voucherToEdit ? voucherToEdit.is_active : true);

  const handleSelectPromoType = (type: PromoType) => {
    setPromoType(type);
    if (type === 'direct_discount') {
      if (scopeType !== 'event' && scopeType !== 'movie') {
        setScopeType('event');
      }
      if (discountType === 'fixed_amount') {
        setDiscountType('slashed_price');
      }
    } else {
      if (discountType === 'slashed_price') {
        setDiscountType('fixed_amount');
      }
    }
  };

  const createMutation = useCreateVoucherMutation();
  const updateMutation = useUpdateVoucherMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanCode = code
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9_-]/g, '');

    if (promoType === 'voucher_code' && !cleanCode) {
      toast.error('Kode voucher harus diisi untuk tipe kupon promo.');
      return;
    }

    if (promoType === 'direct_discount' && !name.trim()) {
      toast.error('Nama promosi wajib diisi untuk diskon langsung.');
      return;
    }

    if (discountValue <= 0) {
      toast.error('Nilai diskon harus lebih dari 0.');
      return;
    }

    if (discountType === 'percentage' && discountValue > 100) {
      toast.error('Diskon persentase tidak boleh lebih dari 100%.');
      return;
    }

    if (promoType === 'voucher_code' && quota <= 0) {
      toast.error('Total kuota voucher harus lebih dari 0.');
      return;
    }

    if (scopeType === 'event' && !selectedEventId) {
      toast.error('Silakan pilih Event Bioskop target untuk voucher khusus ini.');
      return;
    }

    if (scopeType === 'movie' && !selectedMovieId) {
      toast.error('Silakan pilih Film VoD target untuk voucher khusus ini.');
      return;
    }

    const targetItemValue =
      scopeType === 'movie' || scopeType === 'vod_only'
        ? 'vod_only'
        : scopeType === 'event' || scopeType === 'tickets_only'
          ? 'tickets_only'
          : 'all';

    const payload: CreateVoucherPayload = {
      promo_type: promoType,
      code: promoType === 'voucher_code' ? cleanCode || undefined : cleanCode || undefined,
      name: name.trim() ? name.trim() : null,
      max_uses_per_user: isUserLimitEnabled ? Number(maxUsesPerUser) : null,
      discount_type: discountType,
      discount_value: Number(discountValue),
      max_discount_amount:
        discountType !== 'slashed_price' && maxDiscountAmount.trim() !== ''
          ? Number(maxDiscountAmount)
          : null,
      min_transaction_amount:
        promoType === 'direct_discount' ? 0 : Number(minTransactionAmount) || 0,
      target_item: targetItemValue,
      scope_type: scopeType,
      event_id: scopeType === 'event' ? Number(selectedEventId) : null,
      movie_id: scopeType === 'movie' ? Number(selectedMovieId) : null,
      quota: promoType === 'direct_discount' ? 999999 : Number(quota),
      valid_from: new Date(validFrom).toISOString(),
      valid_until: new Date(validUntil).toISOString(),
      is_active: isActive,
    };

    const displayName = payload.name || cleanCode || 'Promo';

    try {
      if (isEditing && voucherToEdit) {
        await updateMutation.mutateAsync({ id: voucherToEdit.id, payload });
        toast.success(`Promo ${displayName} berhasil diperbarui.`);
      } else {
        await createMutation.mutateAsync(payload);
        toast.success(`Promo ${displayName} berhasil diterbitkan.`);
      }
      onClose();
    } catch {
      toast.error('Gagal menyimpan promo. Silakan periksa kembali formulir.');
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-neutral-800 bg-[#0B0E14] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 bg-[#0D111A] px-6 py-4">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-blue-400" />
            <h2 className="font-display text-base font-bold text-white">
              {isEditing ? `Edit Voucher: ${voucherToEdit?.code}` : 'Buat Voucher Promo Baru'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="max-h-[82vh] space-y-4 overflow-y-auto p-6">
          {/* Tipe Promosi */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300">
              Tipe Promosi <span className="text-rose-400">*</span>
            </label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSelectPromoType('voucher_code')}
                className={`flex items-center gap-2 rounded-xl border p-2.5 text-left transition ${
                  promoType === 'voucher_code'
                    ? 'border-blue-500 bg-blue-500/10 text-white'
                    : 'border-neutral-800 bg-[#0D111A] text-neutral-400 hover:text-white'
                }`}
              >
                <Tag className="h-4 w-4 shrink-0 text-blue-400" />
                <div>
                  <span className="block text-xs font-bold text-blue-400">Kupon Voucher</span>
                  <span className="block text-[10px] text-neutral-400">
                    Klaim via kode checkout
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPromoType('direct_discount')}
                className={`flex items-center gap-2 rounded-xl border p-2.5 text-left transition ${
                  promoType === 'direct_discount'
                    ? 'border-emerald-500 bg-emerald-500/10 text-white'
                    : 'border-neutral-800 bg-[#0D111A] text-neutral-400 hover:text-white'
                }`}
              >
                <Scissors className="h-4 w-4 shrink-0 text-emerald-400" />
                <div>
                  <span className="block text-xs font-bold text-emerald-400">Diskon Langsung</span>
                  <span className="block text-[10px] text-neutral-400">Coret harga otomatis</span>
                </div>
              </button>
            </div>
          </div>

          {/* Nama Promosi */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300">
              Nama Promosi{' '}
              {promoType === 'direct_discount' ? (
                <span className="text-rose-400">*</span>
              ) : (
                <span className="text-[11px] font-normal text-neutral-500">(Opsional)</span>
              )}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                promoType === 'direct_discount'
                  ? 'Contoh: Flash Sale Lebaran, Diskon Spesial Tiket'
                  : 'Contoh: Kupon Nobar Seru, Promo Pengguna Baru'
              }
              className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-blue-500"
            />
          </div>

          {/* Kode Promo Voucher (Hanya untuk Kupon Voucher) */}
          {promoType === 'voucher_code' && (
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-neutral-300">
                  Kode Promo Voucher <span className="text-rose-400">*</span>
                </label>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      const prefix = 'PROMO';
                      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
                      setCode(`${prefix}${randomSuffix}`);
                    }}
                    className="text-[11px] font-semibold text-blue-400 hover:text-blue-300"
                  >
                    Acak Kode
                  </button>
                )}
              </div>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
                placeholder="Contoh: CDSINDIE50, NOBARSERU"
                className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3.5 py-2.5 font-mono text-sm font-bold uppercase tracking-wider text-white placeholder-neutral-500 outline-none focus:border-blue-500"
              />
              <span className="mt-1 block text-[11px] text-neutral-500">
                Hanya huruf kapital dan angka tanpa spasi.
              </span>
            </div>
          )}

          {/* Cakupan Target Voucher (Scope) */}
          <div className="rounded-xl border border-neutral-800/80 bg-[#090C12] p-3.5">
            <label className="block text-xs font-bold text-blue-400">
              {promoType === 'direct_discount'
                ? 'Target Item Diskon Langsung *'
                : 'Cakupan Pembatasan Voucher *'}
            </label>
            <p className="mt-0.5 text-[11px] text-neutral-400">
              {promoType === 'direct_discount'
                ? 'Pilih Event Bioskop atau Film VoD sasaran diskon langsung.'
                : 'Pilih apakah voucher berlaku umum atau khusus film/event tertentu saja.'}
            </p>

            <select
              value={scopeType}
              onChange={(e) => {
                const newScope = e.target.value as VoucherScopeType;
                setScopeType(newScope);
                if (newScope !== 'event') setSelectedEventId('');
                if (newScope !== 'movie') setSelectedMovieId('');
              }}
              className="mt-2 w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3 py-2 text-xs font-medium text-white outline-none focus:border-blue-500"
            >
              {promoType === 'direct_discount' ? (
                <>
                  <option value="event">Khusus Event Bioskop Tertentu (Pilih Event)</option>
                  <option value="movie">Khusus Film VoD Tertentu (Pilih Film)</option>
                </>
              ) : (
                <>
                  <option value="all">Semua Transaksi (Tiket Bioskop & Sewa VoD)</option>
                  <option value="event">Khusus Event Bioskop Tertentu (Pilih Event)</option>
                  <option value="movie">Khusus Film VoD Tertentu (Pilih Film)</option>
                  <option value="tickets_only">Semua Tiket Bioskop (Kategori Tiket)</option>
                  <option value="vod_only">Semua Sewa Film (Kategori VoD)</option>
                </>
              )}
            </select>

            {/* Dropdown Pemilihan Event Tertentu */}
            {scopeType === 'event' && (
              <div className="mt-3 border-t border-neutral-800/80 pt-3">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    Pilih Event Bioskop Sasaran <span className="text-rose-400">*</span>
                  </span>
                </label>
                <select
                  required
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value ? Number(e.target.value) : '')}
                  className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                >
                  <option value="">-- Pilih Event Bioskop Target --</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} {ev.city ? `(${ev.city})` : ''}
                    </option>
                  ))}
                </select>
                <span className="mt-1 block text-[10px] text-neutral-500">
                  {promoType === 'direct_discount'
                    ? 'Diskon langsung otomatis diterapkan saat penonton memesan tiket pada event ini.'
                    : 'Voucher hanya dapat digunakan saat penonton memesan tiket pada event ini.'}
                </span>
              </div>
            )}

            {/* Dropdown Pemilihan Film Tertentu */}
            {scopeType === 'movie' && (
              <div className="mt-3 border-t border-neutral-800/80 pt-3">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-purple-300">
                  <Film className="h-3.5 w-3.5" />
                  <span>
                    Pilih Film VoD Sasaran <span className="text-rose-400">*</span>
                  </span>
                </label>
                <select
                  required
                  value={selectedMovieId}
                  onChange={(e) => setSelectedMovieId(e.target.value ? Number(e.target.value) : '')}
                  className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                >
                  <option value="">-- Pilih Film VoD Target --</option>
                  {movies.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({m.release_year})
                    </option>
                  ))}
                </select>
                <span className="mt-1 block text-[10px] text-neutral-500">
                  {promoType === 'direct_discount'
                    ? 'Diskon langsung otomatis diterapkan saat penonton menyewa film digital ini.'
                    : 'Voucher hanya dapat digunakan saat penonton menyewa film digital ini.'}
                </span>
              </div>
            )}
          </div>

          {/* Tipe Diskon & Nilai */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-neutral-300">Tipe Potongan</label>
              <select
                value={discountType}
                onChange={(e) =>
                  setDiscountType(e.target.value as 'percentage' | 'fixed_amount' | 'slashed_price')
                }
                className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3 py-2.5 text-xs text-white outline-none focus:border-blue-500"
              >
                {promoType === 'direct_discount' ? (
                  <>
                    <option value="percentage">Persentase (%)</option>
                    <option value="slashed_price">Coret Harga Langsung (Rp)</option>
                  </>
                ) : (
                  <>
                    <option value="percentage">Persentase (%)</option>
                    <option value="fixed_amount">Potongan Tetap (Rp)</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300">
                {discountType === 'percentage'
                  ? 'Besaran Diskon (%)'
                  : discountType === 'slashed_price'
                    ? 'Nominal Potongan Coret (Rp)'
                    : 'Nominal Potongan (Rp)'}{' '}
                <span className="text-rose-400">*</span>
              </label>
              <div className="relative mt-1.5 flex items-center">
                {discountType !== 'percentage' && (
                  <span className="pointer-events-none absolute left-3 text-xs font-bold text-neutral-400">
                    Rp
                  </span>
                )}
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="0"
                  value={discountValue === 0 ? '' : discountValue}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
                    const num = clean === '' ? 0 : Number(clean);
                    if (discountType === 'percentage' && num > 100) return;
                    setDiscountValue(num);
                  }}
                  className={`w-full rounded-xl border border-neutral-800 bg-[#0D111A] py-2.5 text-xs font-bold text-white outline-none focus:border-blue-500 ${
                    discountType === 'percentage' ? 'pl-3.5 pr-8' : 'pl-9 pr-3.5'
                  }`}
                />
                {discountType === 'percentage' && (
                  <span className="pointer-events-none absolute right-3 text-xs font-bold text-neutral-400">
                    %
                  </span>
                )}
              </div>
              {discountType === 'slashed_price' ? (
                <span className="mt-1 block text-[10px] text-neutral-400">
                  Potongan nominal dari harga normal (cth: input 20.000 memotong harga 100.000
                  menjadi 80.000).
                </span>
              ) : discountType === 'percentage' ? (
                <span className="mt-1 block text-[10px] text-neutral-400">
                  Besaran persentase potongan harga (maksimal 100%).
                </span>
              ) : null}
            </div>
          </div>

          {/* Batas Maks Diskon (Jika Persen) & Min Transaksi */}
          <div
            className={`grid grid-cols-1 gap-3 ${
              discountType === 'percentage' && promoType === 'voucher_code'
                ? 'sm:grid-cols-2'
                : 'sm:grid-cols-1'
            }`}
          >
            {discountType === 'percentage' && (
              <div>
                <label className="block text-xs font-semibold text-neutral-300">
                  Maks. Diskon (Rp) <span className="font-normal text-neutral-500">(Opsional)</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={maxDiscountAmount}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
                    setMaxDiscountAmount(clean);
                  }}
                  placeholder="Contoh: 15000 (Opsional)"
                  className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3.5 py-2.5 text-xs text-white outline-none focus:border-blue-500"
                />
              </div>
            )}

            {promoType === 'voucher_code' && (
              <div>
                <label className="block text-xs font-semibold text-neutral-300">
                  Min. Pembelian (Rp)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={minTransactionAmount === 0 ? '' : minTransactionAmount}
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
                    setMinTransactionAmount(clean === '' ? 0 : Number(clean));
                  }}
                  className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3.5 py-2.5 text-xs text-white outline-none focus:border-blue-500"
                />
              </div>
            )}
          </div>

          {/* Kuota Total & Batas Per User (Hanya untuk Kupon Voucher) */}
          {promoType === 'voucher_code' && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-neutral-300">
                  Total Kuota Penggunaan
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="0"
                  value={quota === 0 ? '' : quota}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
                    setQuota(clean === '' ? 0 : Number(clean));
                  }}
                  className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3.5 py-2.5 text-xs text-white outline-none focus:border-blue-500"
                />
                <span className="mt-1 block text-[10px] text-neutral-500">
                  Batas jumlah penonton yang dapat menukar voucher ini.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300">
                  Maks. Kuota Per Pengguna{' '}
                  <span className="font-normal text-neutral-500">(Opsional)</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="1 (Opsional)"
                  value={maxUsesPerUser === 0 ? '' : maxUsesPerUser}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
                    const num = clean === '' ? 0 : Number(clean);
                    setMaxUsesPerUser(num);
                    setIsUserLimitEnabled(num > 0);
                  }}
                  className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3.5 py-2.5 text-xs text-white outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Masa Berlaku: Start & End (Format 24 Jam WIB) */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DateTimePicker24
              label="Mulai Berlaku"
              required
              value={validFrom}
              defaultTime="00:00"
              onChange={(val) => setValidFrom(val || '')}
              helperText="Voucher aktif mulai tanggal & jam ini."
            />

            <DateTimePicker24
              label="Berakhir (Kedaluwarsa)"
              required
              value={validUntil}
              defaultTime="23:59"
              minDate={validFrom ? validFrom.slice(0, 10) : undefined}
              onChange={(val) => setValidUntil(val || '')}
              helperText="Voucher kedaluwarsa setelah tanggal & jam ini."
            />
          </div>

          {/* Status Aktif Switch */}
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="is_active_toggle"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="is_active_toggle" className="text-xs font-medium text-neutral-300">
              Aktifkan voucher ini segera setelah disimpan
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 border-t border-neutral-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-xs font-semibold text-neutral-300 transition hover:bg-neutral-700 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0066FF] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-600 disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{isEditing ? 'Simpan Perubahan' : 'Terbitkan Voucher'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function VoucherFormModal(props: VoucherFormModalProps): React.JSX.Element | null {
  if (!props.isOpen) return null;
  return <VoucherFormModalContent key={props.voucherToEdit?.id ?? 'new'} {...props} />;
}
