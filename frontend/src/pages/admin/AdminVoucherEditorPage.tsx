import React, { useState } from 'react';
import {
  ArrowLeft,
  Tag,
  Loader2,
  Save,
  Film,
  Calendar,
  Layers,
  Percent,
  DollarSign,
  Scissors,
  Users,
  UserCheck,
  Sparkles,
  Info,
  Ticket,
  Tv,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useAdminVouchersQuery,
  useCreateVoucherMutation,
  useUpdateVoucherMutation,
  useAdminMoviesQuery,
  useAdminEventsQuery,
  DateTimePicker24,
  type AdminVoucherItem,
  type AdminMovieItem,
  type AdminEventItem,
  type CreateVoucherPayload,
} from '@/features/admin';

export interface AdminVoucherEditorPageProps {
  voucherId?: number;
  onNavigate: (path: string) => void;
}

export type VoucherScopeType = 'all' | 'event' | 'movie' | 'tickets_only' | 'vod_only';

export function AdminVoucherEditorPage({
  voucherId,
  onNavigate,
}: AdminVoucherEditorPageProps): React.JSX.Element {
  const isEditing = Boolean(voucherId);

  const { data: vouchers = [], isLoading: isLoadingVouchers } = useAdminVouchersQuery();
  const { data: movies = [], isLoading: isLoadingMovies } = useAdminMoviesQuery();
  const { data: events = [], isLoading: isLoadingEvents } = useAdminEventsQuery();

  const voucherToEdit = isEditing ? vouchers.find((v) => v.id === voucherId) || null : null;

  return (
    <AdminVoucherEditorForm
      key={voucherToEdit?.id ?? (isEditing ? 'loading' : 'new')}
      voucherToEdit={voucherToEdit}
      isEditing={isEditing}
      isLoadingVoucher={isEditing && isLoadingVouchers && !voucherToEdit}
      movies={movies}
      events={events}
      isLoadingMovies={isLoadingMovies}
      isLoadingEvents={isLoadingEvents}
      onNavigate={onNavigate}
    />
  );
}

interface AdminVoucherEditorFormProps {
  voucherToEdit: AdminVoucherItem | null;
  isEditing: boolean;
  isLoadingVoucher: boolean;
  movies: AdminMovieItem[];
  events: AdminEventItem[];
  isLoadingMovies: boolean;
  isLoadingEvents: boolean;
  onNavigate: (path: string) => void;
}

function AdminVoucherEditorForm({
  voucherToEdit,
  isEditing,
  isLoadingVoucher,
  movies,
  events,
  isLoadingMovies,
  isLoadingEvents,
  onNavigate,
}: AdminVoucherEditorFormProps): React.JSX.Element {
  // Tab Modul Promosi: 'voucher_code' (Kupon Voucher) vs 'direct_discount' (Diskon Langsung Coret Harga)
  const [promoType, setPromoType] = useState<'voucher_code' | 'direct_discount'>(() => {
    if (!voucherToEdit) return 'voucher_code';
    if (
      voucherToEdit.promo_type === 'direct_discount' ||
      voucherToEdit.discount_type === 'slashed_price'
    ) {
      return 'direct_discount';
    }
    return 'voucher_code';
  });

  // Nama Promosi (Opsional)
  const [name, setName] = useState(voucherToEdit?.name ?? '');

  // Kode Voucher
  const [code, setCode] = useState(() => {
    if (voucherToEdit?.code) return voucherToEdit.code;
    return '';
  });

  // Tipe Potongan: percentage, fixed_amount, slashed_price
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed_amount' | 'slashed_price'>(
    () => {
      if (!voucherToEdit) return 'percentage';
      if (voucherToEdit.discount_type === 'slashed_price') return 'slashed_price';
      return voucherToEdit.discount_type === 'fixed'
        ? 'fixed_amount'
        : (voucherToEdit.discount_type as 'percentage' | 'fixed_amount' | 'slashed_price');
    }
  );

  const [discountValue, setDiscountValue] = useState<number>(() => {
    if (!voucherToEdit) return 20;
    return voucherToEdit.discount_value ?? 20;
  });

  // Opsi Minimal Belanja Transaksi (Toggle on/off)
  const [isMinTransactionEnabled, setIsMinTransactionEnabled] = useState<boolean>(() => {
    if (!voucherToEdit) return true;
    const minVal = voucherToEdit.min_transaction_amount ?? voucherToEdit.min_purchase;
    return minVal != null && Number(minVal) > 0;
  });
  const [minTransactionAmount, setMinTransactionAmount] = useState<number>(() => {
    if (!voucherToEdit) return 20000;
    return voucherToEdit.min_transaction_amount ?? voucherToEdit.min_purchase ?? 20000;
  });

  // Opsi Maksimal Diskon (Toggle on/off - Status Opsional)
  const [isMaxDiscountEnabled, setIsMaxDiscountEnabled] = useState<boolean>(() => {
    if (!voucherToEdit) return false;
    const maxVal = voucherToEdit.max_discount_amount ?? voucherToEdit.max_discount;
    return maxVal != null && Number(maxVal) > 0;
  });
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<string>(() => {
    if (!voucherToEdit) return '';
    const maxVal = voucherToEdit.max_discount_amount ?? voucherToEdit.max_discount;
    return maxVal != null && Number(maxVal) > 0 ? String(maxVal) : '';
  });

  // Opsi Kuota Pemakaian Keseluruhan (Toggle on/off)
  const [isQuotaEnabled, setIsQuotaEnabled] = useState<boolean>(() => {
    if (!voucherToEdit) return true;
    const q = voucherToEdit.quota ?? voucherToEdit.quota_total;
    return q != null && q > 0 && q < 999999;
  });
  const [quota, setQuota] = useState<number>(() => {
    if (!voucherToEdit) return 100;
    return voucherToEdit.quota ?? voucherToEdit.quota_total ?? 100;
  });

  // Opsi Kuota Pemakaian Per Pengguna (Toggle on/off)
  const [isUserLimitEnabled, setIsUserLimitEnabled] = useState<boolean>(() => {
    return Boolean(voucherToEdit?.max_uses_per_user && voucherToEdit.max_uses_per_user > 0);
  });
  const [maxUsesPerUser, setMaxUsesPerUser] = useState<number>(() => {
    return voucherToEdit?.max_uses_per_user ?? 1;
  });

  // Cakupan Target Voucher
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

  // Periode Validitas
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

  const createMutation = useCreateVoucherMutation();
  const updateMutation = useUpdateVoucherMutation();

  // Helper when changing Tab
  const handleTabChange = (tab: 'voucher_code' | 'direct_discount') => {
    setPromoType(tab);
    if (tab === 'direct_discount') {
      // In Tab Diskon Langsung, default to slashed_price or percentage
      if (discountType === 'fixed_amount') {
        setDiscountType('slashed_price');
      }
    } else {
      // In Tab Kupon Voucher, default to percentage or fixed_amount
      if (discountType === 'slashed_price') {
        setDiscountType('percentage');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (promoType === 'direct_discount' && !name.trim()) {
      toast.error('Nama promosi wajib diisi untuk diskon langsung (coret harga).');
      return;
    }

    const finalCode =
      promoType === 'direct_discount'
        ? code.trim().toUpperCase() || 'CORET' + Date.now().toString(36).toUpperCase()
        : code.trim().toUpperCase();

    if (promoType === 'voucher_code' && !finalCode) {
      toast.error('Kode promo voucher wajib diisi.');
      return;
    }

    if (discountType === 'percentage' && (discountValue <= 0 || discountValue > 100)) {
      toast.error('Nilai diskon persentase harus antara 1% sampai 100%.');
      return;
    }

    if (
      (discountType === 'fixed_amount' || discountType === 'slashed_price') &&
      discountValue <= 0
    ) {
      toast.error(
        discountType === 'slashed_price'
          ? 'Harga tiket promo (coret harga) harus lebih besar dari 0.'
          : 'Nominal potongan diskon harus lebih besar dari 0.'
      );
      return;
    }

    if (scopeType === 'event' && !selectedEventId) {
      toast.error('Silakan pilih salah satu Event Bioskop tujuan voucher.');
      return;
    }

    if (scopeType === 'movie' && !selectedMovieId) {
      toast.error('Silakan pilih salah satu Film VoD tujuan voucher.');
      return;
    }

    const targetItemValue =
      scopeType === 'event' || scopeType === 'tickets_only'
        ? 'tickets_only'
        : scopeType === 'movie' || scopeType === 'vod_only'
          ? 'vod_only'
          : 'all';

    // Per aturan:
    // Tab Diskon Langsung: Hapus Maksimal Diskon (null)
    // Tab Kupon Voucher: Maksimal Diskon opsional (aktif jika isMaxDiscountEnabled dan ada isinya)
    const computedMaxDiscount =
      promoType === 'direct_discount'
        ? null
        : isMaxDiscountEnabled && maxDiscountAmount.trim() !== ''
          ? Number(maxDiscountAmount)
          : null;

    const computedMinTransaction = isMinTransactionEnabled ? Number(minTransactionAmount) : 0;
    const computedQuota = isQuotaEnabled ? Number(quota) : 999999;
    const computedUserLimit = isUserLimitEnabled ? Number(maxUsesPerUser) : null;

    const payload: CreateVoucherPayload = {
      code: finalCode,
      promo_type: promoType,
      name: name.trim() ? name.trim() : null,
      max_uses_per_user: computedUserLimit,
      discount_type: discountType,
      discount_value: Number(discountValue),
      max_discount_amount: computedMaxDiscount,
      min_transaction_amount: computedMinTransaction,
      target_item: targetItemValue,
      scope_type: scopeType,
      event_id: scopeType === 'event' && selectedEventId ? Number(selectedEventId) : null,
      movie_id: scopeType === 'movie' && selectedMovieId ? Number(selectedMovieId) : null,
      quota: computedQuota,
      valid_from: new Date(validFrom).toISOString(),
      valid_until: new Date(validUntil).toISOString(),
      is_active: isActive,
    };

    try {
      if (isEditing && voucherToEdit) {
        await updateMutation.mutateAsync({ id: voucherToEdit.id, payload });
        toast.success(`Voucher ${payload.code} berhasil diperbarui.`);
      } else {
        await createMutation.mutateAsync(payload);
        toast.success(`Voucher ${payload.code} berhasil diterbitkan.`);
      }
      onNavigate('/admin/vouchers');
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Gagal menyimpan voucher. Pastikan kode unik dan data valid.';
      toast.error('Gagal Menyimpan Voucher', { description: msg });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  // Selected items from the left form inputs
  const selectedEvent = events.find((e) => e.id === Number(selectedEventId));
  const selectedMovie = movies.find((m) => m.id === Number(selectedMovieId));

  // State for choosing which actual item to simulate when scope is broad ('all', 'tickets_only', 'vod_only')
  const [simulationEventId, setSimulationEventId] = useState<number | ''>(() => {
    return events[0]?.id ?? '';
  });
  const [simulationMovieId, setSimulationMovieId] = useState<number | ''>(() => {
    return movies[0]?.id ?? '';
  });
  const [simulationScopeTab, setSimulationScopeTab] = useState<'event' | 'movie'>('event');

  // Determine base price of products for discount preview calculation
  const getEventPrice = (ev?: AdminEventItem | null): number => {
    if (!ev) return 0;
    if (ev.starting_price && ev.starting_price > 0) return ev.starting_price;
    const schedulePrice = ev.schedules?.[0]?.ticket_price;
    if (schedulePrice && schedulePrice > 0) return schedulePrice;
    return 0;
  };

  const getMoviePrice = (mov?: AdminMovieItem | null): number => {
    if (!mov) return 0;
    if (mov.rental_price && mov.rental_price > 0) return mov.rental_price;
    return 0;
  };

  // Determine which product is active in the preview based strictly on left inputs
  interface ActiveProductPreview {
    type: 'event' | 'movie';
    title: string;
    subtitle?: string;
    price: number;
    isFromDirectSelection: boolean;
  }

  let activeProduct: ActiveProductPreview | null = null;

  if (scopeType === 'event') {
    if (selectedEvent) {
      activeProduct = {
        type: 'event',
        title: selectedEvent.title,
        subtitle: selectedEvent.city ? `Kota ${selectedEvent.city}` : selectedEvent.venue_name,
        price: getEventPrice(selectedEvent),
        isFromDirectSelection: true,
      };
    }
  } else if (scopeType === 'movie') {
    if (selectedMovie) {
      activeProduct = {
        type: 'movie',
        title: selectedMovie.title,
        subtitle: selectedMovie.release_year ? `Tahun ${selectedMovie.release_year}` : undefined,
        price: getMoviePrice(selectedMovie),
        isFromDirectSelection: true,
      };
    }
  } else if (scopeType === 'tickets_only') {
    const ev = events.find((e) => e.id === Number(simulationEventId)) || events[0];
    if (ev) {
      activeProduct = {
        type: 'event',
        title: ev.title,
        subtitle: ev.city ? `Kota ${ev.city}` : ev.venue_name,
        price: getEventPrice(ev),
        isFromDirectSelection: false,
      };
    }
  } else if (scopeType === 'vod_only') {
    const mov = movies.find((m) => m.id === Number(simulationMovieId)) || movies[0];
    if (mov) {
      activeProduct = {
        type: 'movie',
        title: mov.title,
        subtitle: mov.release_year ? `Tahun ${mov.release_year}` : undefined,
        price: getMoviePrice(mov),
        isFromDirectSelection: false,
      };
    }
  } else {
    // scopeType === 'all'
    if (simulationScopeTab === 'event') {
      const ev = events.find((e) => e.id === Number(simulationEventId)) || events[0];
      if (ev) {
        activeProduct = {
          type: 'event',
          title: ev.title,
          subtitle: ev.city ? `Kota ${ev.city}` : ev.venue_name,
          price: getEventPrice(ev),
          isFromDirectSelection: false,
        };
      }
    } else {
      const mov = movies.find((m) => m.id === Number(simulationMovieId)) || movies[0];
      if (mov) {
        activeProduct = {
          type: 'movie',
          title: mov.title,
          subtitle: mov.release_year ? `Tahun ${mov.release_year}` : undefined,
          price: getMoviePrice(mov),
          isFromDirectSelection: false,
        };
      }
    }
  }

  // Calculate discount deduction and final price strictly based on inputs
  let calculatedDeduction = 0;
  let finalCalculatedPrice = activeProduct?.price || 0;
  let discountPercentageEffective = 0;

  if (activeProduct && activeProduct.price > 0) {
    const original = activeProduct.price;

    if (promoType === 'direct_discount') {
      if (discountType === 'slashed_price') {
        const cutNominal = Math.max(0, Number(discountValue) || 0);
        calculatedDeduction = Math.min(original, cutNominal);
        finalCalculatedPrice = Math.max(0, original - calculatedDeduction);
        discountPercentageEffective =
          original > 0 ? Math.round((calculatedDeduction / original) * 100) : 0;
      } else {
        // discountType === 'percentage'
        const pct = Math.min(100, Math.max(0, Number(discountValue) || 0));
        calculatedDeduction = Math.round((original * pct) / 100);
        finalCalculatedPrice = Math.max(0, original - calculatedDeduction);
        discountPercentageEffective = pct;
      }
    } else {
      // promoType === 'voucher_code'
      if (discountType === 'percentage') {
        const pct = Math.min(100, Math.max(0, Number(discountValue) || 0));
        let rawDeduction = Math.round((original * pct) / 100);
        if (isMaxDiscountEnabled && maxDiscountAmount && Number(maxDiscountAmount) > 0) {
          rawDeduction = Math.min(rawDeduction, Number(maxDiscountAmount));
        }
        calculatedDeduction = rawDeduction;
        finalCalculatedPrice = Math.max(0, original - calculatedDeduction);
        discountPercentageEffective =
          original > 0 ? Math.round((calculatedDeduction / original) * 100) : pct;
      } else {
        // discountType === 'fixed_amount'
        let rawDeduction = Math.max(0, Number(discountValue) || 0);
        if (isMaxDiscountEnabled && maxDiscountAmount && Number(maxDiscountAmount) > 0) {
          rawDeduction = Math.min(rawDeduction, Number(maxDiscountAmount));
        }
        calculatedDeduction = Math.min(rawDeduction, original);
        finalCalculatedPrice = Math.max(0, original - calculatedDeduction);
        discountPercentageEffective =
          original > 0 ? Math.round((calculatedDeduction / original) * 100) : 0;
      }
    }
  }

  if (isLoadingVoucher) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Halaman & Navigasi */}
      <div className="flex flex-col gap-4 border-b border-neutral-800 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('/admin/vouchers')}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-800 bg-[#0B0E14] text-neutral-400 transition hover:bg-neutral-800 hover:text-white"
            title="Kembali ke Daftar Voucher"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="font-display text-xl font-extrabold text-white sm:text-2xl">
              {isEditing
                ? `Edit: ${name || voucherToEdit?.code || 'Voucher'}`
                : promoType === 'direct_discount'
                  ? 'Buat Diskon Langsung (Coret Harga)'
                  : 'Buat Kupon Voucher Promo'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate('/admin/vouchers')}
            disabled={isPending}
            className="rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-xs font-semibold text-neutral-300 transition hover:bg-neutral-700 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            form="voucher-editor-form"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0066FF] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-blue-600 disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{isEditing ? 'Simpan Perubahan' : 'Terbitkan Promosi'}</span>
          </button>
        </div>
      </div>

      {/* Tab Navigasi Utama: Kupon Voucher vs Diskon Langsung */}
      <div className="flex flex-col gap-2 rounded-2xl border border-neutral-800 bg-[#0B0E14] p-2 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => handleTabChange('voucher_code')}
          className={`flex flex-1 items-center justify-center gap-2.5 rounded-xl px-4 py-3 text-xs font-bold transition ${
            promoType === 'voucher_code'
              ? 'bg-blue-600 text-white'
              : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
          }`}
        >
          <Tag className="h-4 w-4 shrink-0" />
          <div className="text-left">
            <span className="block font-bold">1. Tab Kupon Voucher (Voucher Code)</span>
            <span
              className={`block text-[10px] font-normal ${promoType === 'voucher_code' ? 'text-blue-100' : 'text-neutral-500'}`}
            >
              Potongan dengan kode promo yang dimasukkan pengguna saat checkout
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('direct_discount')}
          className={`flex flex-1 items-center justify-center gap-2.5 rounded-xl px-4 py-3 text-xs font-bold transition ${
            promoType === 'direct_discount'
              ? 'bg-blue-600 text-white'
              : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
          }`}
        >
          <Scissors className="h-4 w-4 shrink-0" />
          <div className="text-left">
            <span className="block font-bold">2. Tab Diskon Langsung (Coret Harga)</span>
            <span
              className={`block text-[10px] font-normal ${promoType === 'direct_discount' ? 'text-blue-100' : 'text-neutral-500'}`}
            >
              Harga dicoret langsung di katalog event & film tanpa perlu input kode
            </span>
          </div>
        </button>
      </div>

      {/* Grid: 2 Kolom di Desktop (Formulir & Kartu Ringkasan Preview), 1 Kolom di Mobile */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Formulir Pengaturan Voucher (7 Kolom) */}
        <div className="lg:col-span-7">
          <form
            id="voucher-editor-form"
            onSubmit={handleSubmit}
            className="space-y-6 rounded-2xl border border-neutral-800 bg-[#0B0E14] p-5 sm:p-6"
          >
            {/* Field Nama Promosi (Wajib jika Diskon Langsung / Coret Harga, Opsional jika Kupon Voucher) */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-neutral-300">
                  Nama Promosi{' '}
                  {promoType === 'direct_discount' ? (
                    <span className="text-rose-500">*</span>
                  ) : (
                    <span className="text-[11px] font-medium text-neutral-500">(Opsional)</span>
                  )}
                </label>
              </div>
              <input
                type="text"
                required={promoType === 'direct_discount'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={
                  promoType === 'direct_discount'
                    ? 'Contoh: Promo Spesial Wuthering Waves, Flash Sale Lebaran'
                    : 'Contoh: Diskon Kemerdekaan, Promo Weekend Seru, Flash Sale Bioskop'
                }
                className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 outline-none transition focus:border-blue-500"
              />
              <span className="mt-1 block text-[11px] text-neutral-500">
                {promoType === 'direct_discount'
                  ? 'Nama promosi wajib diisi sebagai identitas diskon di katalog dan tabel manajemen.'
                  : 'Nama internal promosi untuk memudahkan identifikasi di tabel manajemen voucher.'}
              </span>
            </div>

            {/* Kode Voucher (Hanya untuk Tab Kupon Voucher, tidak untuk Coret Harga) */}
            {promoType === 'voucher_code' && (
              <div>
                <label className="block text-xs font-semibold text-neutral-300">
                  Kode Promo Voucher <span className="text-rose-500">*</span>
                </label>
                <div className="relative mt-1.5">
                  <Tag className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="CONTOH: PREMIERE20"
                    className="w-full rounded-xl border border-neutral-800 bg-[#0D111A] py-2.5 pl-10 pr-3.5 font-mono text-xs font-bold uppercase tracking-wider text-white placeholder-neutral-600 outline-none transition focus:border-blue-500"
                  />
                </div>
                <span className="mt-1 block text-[11px] text-neutral-500">
                  Kode unik yang akan diketik penonton di halaman checkout.
                </span>
              </div>
            )}

            {/* Skema Diskon & Tipe Potongan */}
            <div className="space-y-4 rounded-xl border border-neutral-800/80 bg-[#080B10] p-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                Skema & Nilai Diskon
              </label>

              <div>
                <label className="block text-xs font-semibold text-neutral-300">
                  Tipe Potongan
                </label>
                <div
                  className={`mt-1.5 grid grid-cols-1 gap-2.5 ${promoType === 'direct_discount' ? 'sm:grid-cols-2' : 'sm:grid-cols-2'}`}
                >
                  {/* Pilihan Persentase % */}
                  <button
                    type="button"
                    onClick={() => setDiscountType('percentage')}
                    className={`flex items-center gap-2 rounded-xl border p-3 text-left transition ${
                      discountType === 'percentage'
                        ? 'border-blue-500 bg-blue-500/10 text-white'
                        : 'border-neutral-800 bg-[#0D111A] text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Percent className="h-4 w-4 shrink-0 text-blue-400" />
                    <div>
                      <span className="block text-xs font-bold text-blue-400">Persentase (%)</span>
                      <span className="block text-[10px] text-neutral-400">
                        {promoType === 'direct_discount'
                          ? 'Potong persen dari harga normal'
                          : 'Potongan persen total transaksi'}
                      </span>
                    </div>
                  </button>

                  {/* Jika Tab Kupon Voucher: Tampilkan Nominal Tetap (Rp) */}
                  {promoType === 'voucher_code' && (
                    <button
                      type="button"
                      onClick={() => setDiscountType('fixed_amount')}
                      className={`flex items-center gap-2 rounded-xl border p-3 text-left transition ${
                        discountType === 'fixed_amount'
                          ? 'border-emerald-500 bg-emerald-500/10 text-white'
                          : 'border-neutral-800 bg-[#0D111A] text-neutral-400 hover:text-white'
                      }`}
                    >
                      <DollarSign className="h-4 w-4 shrink-0 text-emerald-400" />
                      <div>
                        <span className="block text-xs font-bold text-emerald-400">
                          Nominal Tetap (Rp)
                        </span>
                        <span className="block text-[10px] text-neutral-400">
                          Potongan nominal uang langsung
                        </span>
                      </div>
                    </button>
                  )}

                  {/* Jika Tab Diskon Langsung: Tampilkan Coret Harga (Rp) */}
                  {promoType === 'direct_discount' && (
                    <button
                      type="button"
                      onClick={() => setDiscountType('slashed_price')}
                      className={`flex items-center gap-2 rounded-xl border p-3 text-left transition ${
                        discountType === 'slashed_price'
                          ? 'border-rose-500 bg-rose-500/10 text-white'
                          : 'border-neutral-800 bg-[#0D111A] text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Scissors className="h-4 w-4 shrink-0 text-rose-400" />
                      <div>
                        <span className="block text-xs font-bold text-rose-400">
                          Coret Harga Langsung (Rp)
                        </span>
                        <span className="block text-[10px] text-neutral-400">
                          Potongan nominal dari harga normal
                        </span>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {/* Besaran Potongan / Harga Coret */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300">
                  {discountType === 'percentage'
                    ? 'Besaran Diskon (%)'
                    : discountType === 'slashed_price'
                      ? 'Besaran Potongan Harga (Rp)'
                      : 'Besaran Potongan Nominal Tetap (Rp)'}
                  <span className="text-rose-500"> *</span>
                </label>

                {discountType === 'percentage' ? (
                  <div className="relative mt-1.5">
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
                        if (num > 100) return;
                        setDiscountValue(num);
                      }}
                      className="w-full rounded-xl border border-neutral-800 bg-[#0D111A] py-2.5 pl-3.5 pr-8 text-xs text-white outline-none transition focus:border-blue-500"
                    />
                    <span className="pointer-events-none absolute right-3.5 top-2.5 text-xs font-bold text-blue-400">
                      %
                    </span>
                  </div>
                ) : (
                  <div className="relative mt-1.5">
                    <span className="pointer-events-none absolute left-3.5 top-2.5 text-xs font-bold text-neutral-500">
                      Rp
                    </span>
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
                        setDiscountValue(num);
                      }}
                      className="w-full rounded-xl border border-neutral-800 bg-[#0D111A] py-2.5 pl-9 pr-3.5 text-xs text-white outline-none transition focus:border-blue-500"
                    />
                  </div>
                )}

                {discountType === 'percentage' ? (
                  <span className="mt-1 block text-[11px] text-neutral-500">
                    Masukkan persentase diskon potongan harga dari 1% hingga 100%.
                  </span>
                ) : (
                  <span className="mt-1 block text-[11px] text-rose-400/90">
                    🏷️ Harga asli tiket/film akan dipotong sebesar Rp{' '}
                    {Number(discountValue || 0).toLocaleString('id-ID')} (contoh: harga Rp 100.000
                    menjadi Rp{' '}
                    {Math.max(0, 100000 - Number(discountValue || 0)).toLocaleString('id-ID')}).
                  </span>
                )}
              </div>

              {/* TAB 1: OPSI DISKON & BELANJA (Minimal Belanja & Maksimal Diskon dengan Button Opsi) */}
              {promoType === 'voucher_code' && (
                <div className="space-y-4 border-t border-neutral-800/80 pt-4">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                      Opsi Diskon & Batasan Belanja
                    </span>
                  </div>

                  {/* 1. Button Opsi Minimal Belanja Transaksi */}
                  <div className="rounded-xl border border-neutral-800 bg-[#0D111A]/80 p-3.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-white">
                          Minimal Belanja Transaksi
                        </span>
                        <span className="block text-[11px] text-neutral-400">
                          {isMinTransactionEnabled
                            ? 'Voucher hanya berlaku jika total belanja mencapai batas minimal.'
                            : 'Nonaktif: Voucher dapat dipakai tanpa batasan minimal belanja.'}
                        </span>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isMinTransactionEnabled}
                        onClick={() => setIsMinTransactionEnabled(!isMinTransactionEnabled)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          isMinTransactionEnabled ? 'bg-blue-600' : 'bg-neutral-800'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            isMinTransactionEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {isMinTransactionEnabled && (
                      <div className="mt-3 border-t border-neutral-800/80 pt-3">
                        <label className="block text-[11px] font-medium text-neutral-300">
                          Nominal Minimal Belanja (Rp) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={minTransactionAmount === 0 ? '' : minTransactionAmount}
                          placeholder="0"
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const clean = e.target.value
                              .replace(/\D/g, '')
                              .replace(/^0+(?=\d)/, '');
                            setMinTransactionAmount(clean === '' ? 0 : Number(clean));
                          }}
                          className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-[#080B10] px-3 py-2 text-xs text-white outline-none transition focus:border-blue-500"
                        />
                      </div>
                    )}
                  </div>

                  {/* 2. Button Opsi Maksimal Diskon (Berlaku untuk Persentase dan Nominal Tetap - Status Opsional) */}
                  <div className="rounded-xl border border-neutral-800 bg-[#0D111A]/80 p-3.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-white">Maksimal Diskon</span>
                          <span className="py-0.2 rounded bg-neutral-800 px-1.5 text-[10px] text-neutral-400">
                            Opsional
                          </span>
                        </div>
                        <span className="block text-[11px] text-neutral-400">
                          {isMaxDiscountEnabled
                            ? 'Membatasi nilai rupiah potongan tertinggi yang bisa didapat penonton.'
                            : 'Nonaktif: Tanpa batas maksimal diskon (potongan penuh).'}
                        </span>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isMaxDiscountEnabled}
                        onClick={() => setIsMaxDiscountEnabled(!isMaxDiscountEnabled)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          isMaxDiscountEnabled ? 'bg-blue-600' : 'bg-neutral-800'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            isMaxDiscountEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {isMaxDiscountEnabled && (
                      <div className="mt-3 border-t border-neutral-800/80 pt-3">
                        <label className="block text-[11px] font-medium text-neutral-300">
                          Batas Maksimal Diskon (Rp){' '}
                          <span className="font-normal text-neutral-500">(Opsional)</span>
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={maxDiscountAmount}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const clean = e.target.value
                              .replace(/\D/g, '')
                              .replace(/^0+(?=\d)/, '');
                            setMaxDiscountAmount(clean);
                          }}
                          placeholder="Contoh: 15000 (Kosongkan jika tanpa batas)"
                          className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-[#080B10] px-3 py-2 text-xs text-white placeholder-neutral-600 outline-none transition focus:border-blue-500"
                        />
                        <span className="mt-1 block text-[10px] text-neutral-500">
                          {discountType === 'percentage'
                            ? 'Jika hasil persen melebihi nominal ini, penonton hanya akan mendapat potongan sebesar batas ini.'
                            : 'Batas proteksi potongan nominal tetap.'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: CATATAN ATURAN MAKSIMAL DISKON DIHAPUS PADA TAB DISKON LANGSUNG */}
              {promoType === 'direct_discount' && (
                <div className="rounded-xl border border-neutral-800/60 bg-neutral-900/40 p-3 text-[11px] text-neutral-400">
                  <div className="flex items-center gap-1.5 font-semibold text-neutral-300">
                    <Info className="h-3.5 w-3.5 text-blue-400" />
                    <span>Ketentuan Tab Diskon Langsung</span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-neutral-400">
                    Pada tab diskon langsung (coret harga), batasan maksimal diskon ditiadakan.
                    Harga tiket event atau sewa film langsung dipotong sesuai persentase atau
                    nominal coret yang ditentukan.
                  </p>
                </div>
              )}
            </div>

            {/* Cakupan Target Voucher (Khusus Film/Event) */}
            <div className="space-y-4 rounded-xl border border-neutral-800/80 bg-[#080B10] p-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Cakupan Pemakaian Promosi
                </label>
                <span className="mt-0.5 block text-[11px] text-neutral-400">
                  Pilih item yang berhak menerima promosi ini.
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
                <button
                  type="button"
                  onClick={() => {
                    setScopeType('all');
                    setSelectedEventId('');
                    setSelectedMovieId('');
                  }}
                  className={`flex flex-col items-start gap-1 rounded-xl border p-2.5 text-left transition ${
                    scopeType === 'all'
                      ? 'border-blue-500 bg-blue-500/10 text-white'
                      : 'border-neutral-800 bg-[#0D111A] text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <Layers className="h-3.5 w-3.5 text-blue-400" />
                    <span>Semua Item</span>
                  </div>
                  <span className="text-[10px] text-neutral-400">Tiket & Semua Sewa VoD</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setScopeType('event');
                    setSelectedMovieId('');
                  }}
                  className={`flex flex-col items-start gap-1 rounded-xl border p-2.5 text-left transition ${
                    scopeType === 'event'
                      ? 'border-amber-500 bg-amber-500/10 text-white'
                      : 'border-neutral-800 bg-[#0D111A] text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <Calendar className="h-3.5 w-3.5 text-amber-400" />
                    <span>Event Khusus</span>
                  </div>
                  <span className="text-[10px] text-neutral-400">Hanya untuk 1 event terpilih</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setScopeType('movie');
                    setSelectedEventId('');
                  }}
                  className={`flex flex-col items-start gap-1 rounded-xl border p-2.5 text-left transition ${
                    scopeType === 'movie'
                      ? 'border-sky-500 bg-sky-500/10 text-white'
                      : 'border-neutral-800 bg-[#0D111A] text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <Film className="h-3.5 w-3.5 text-sky-400" />
                    <span>Film Khusus</span>
                  </div>
                  <span className="text-[10px] text-neutral-400">Hanya untuk 1 film terpilih</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setScopeType('tickets_only');
                    setSelectedEventId('');
                    setSelectedMovieId('');
                  }}
                  className={`flex flex-col items-start gap-1 rounded-xl border p-2.5 text-left transition ${
                    scopeType === 'tickets_only'
                      ? 'border-blue-500 bg-blue-500/10 text-white'
                      : 'border-neutral-800 bg-[#0D111A] text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <Ticket className="h-3.5 w-3.5 text-blue-400" />
                    <span>Semua Tiket Bioskop</span>
                  </div>
                  <span className="text-[10px] text-neutral-400">Hanya seluruh tiket event</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setScopeType('vod_only');
                    setSelectedEventId('');
                    setSelectedMovieId('');
                  }}
                  className={`flex flex-col items-start gap-1 rounded-xl border p-2.5 text-left transition ${
                    scopeType === 'vod_only'
                      ? 'border-purple-500 bg-purple-500/10 text-white'
                      : 'border-neutral-800 bg-[#0D111A] text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <Tv className="h-3.5 w-3.5 text-purple-400" />
                    <span>Semua Sewa VoD</span>
                  </div>
                  <span className="text-[10px] text-neutral-400">Hanya seluruh sewa VoD</span>
                </button>
              </div>

              {/* Dropdown Pemilihan Event Khusus */}
              {scopeType === 'event' && (
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-neutral-300">
                    Pilih Event Bioskop yang Berlaku <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={selectedEventId}
                    onChange={(e) =>
                      setSelectedEventId(e.target.value ? Number(e.target.value) : '')
                    }
                    className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3.5 py-2.5 text-xs text-white outline-none transition focus:border-blue-500"
                  >
                    <option value="">-- Pilih Event Bioskop Terdaftar --</option>
                    {isLoadingEvents ? (
                      <option disabled>Memuat daftar event...</option>
                    ) : (
                      events.map((ev) => (
                        <option key={ev.id} value={ev.id}>
                          {ev.title} {ev.city ? `(${ev.city})` : ''} - Harga Tiket: Rp{' '}
                          {getEventPrice(ev).toLocaleString('id-ID')}
                        </option>
                      ))
                    )}
                  </select>
                  <span className="mt-1 block text-[11px] text-amber-400/90">
                    🎬 Promosi ini hanya dapat diterapkan untuk event screening di atas.
                  </span>
                </div>
              )}

              {/* Dropdown Pemilihan Film Khusus */}
              {scopeType === 'movie' && (
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-neutral-300">
                    Pilih Film VoD yang Berlaku <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={selectedMovieId}
                    onChange={(e) =>
                      setSelectedMovieId(e.target.value ? Number(e.target.value) : '')
                    }
                    className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3.5 py-2.5 text-xs text-white outline-none transition focus:border-blue-500"
                  >
                    <option value="">-- Pilih Film Digital VoD Terdaftar --</option>
                    {isLoadingMovies ? (
                      <option disabled>Memuat daftar film...</option>
                    ) : (
                      movies.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title} {m.release_year ? `(${m.release_year})` : ''} - Harga Sewa: Rp{' '}
                          {getMoviePrice(m).toLocaleString('id-ID')}
                        </option>
                      ))
                    )}
                  </select>
                  <span className="mt-1 block text-[11px] text-sky-400/90">
                    🍿 Promosi ini hanya dapat diterapkan saat penonton menyewa film di atas.
                  </span>
                </div>
              )}
            </div>

            {/* PENGATURAN KUOTA PEMAKAIAN (Button Opsi Kuota Total & Kuota Per User) */}
            <div className="space-y-4 rounded-xl border border-neutral-800/80 bg-[#080B10] p-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                Pengaturan Kuota Pemakaian
              </label>

              {/* 1. Button Opsi Kuota Pemakaian Keseluruhan */}
              <div className="rounded-xl border border-neutral-800 bg-[#0D111A]/80 p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 shrink-0 text-blue-400" />
                    <div>
                      <span className="text-xs font-semibold text-white">
                        Total Kuota Pemakaian
                      </span>
                      <span className="block text-[11px] text-neutral-400">
                        {isQuotaEnabled
                          ? 'Membatasi total klaim voucher secara keseluruhan.'
                          : 'Nonaktif: Kuota tidak terbatas (unlimited).'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isQuotaEnabled}
                    onClick={() => setIsQuotaEnabled(!isQuotaEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isQuotaEnabled ? 'bg-blue-600' : 'bg-neutral-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isQuotaEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {isQuotaEnabled && (
                  <div className="mt-3 border-t border-neutral-800/80 pt-3">
                    <label className="block text-[11px] font-medium text-neutral-300">
                      Batas Total Kuota (Penggunaan) <span className="text-rose-500">*</span>
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
                      className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-[#080B10] px-3 py-2 text-xs text-white outline-none transition focus:border-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* 2. Button Opsi Kuota Pemakaian Per Pengguna */}
              <div className="rounded-xl border border-neutral-800 bg-[#0D111A]/80 p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 shrink-0 text-emerald-400" />
                    <div>
                      <span className="text-xs font-semibold text-white">
                        Maksimal Kuota Voucher Per Pengguna
                      </span>
                      <span className="block text-[11px] text-neutral-400">
                        {isUserLimitEnabled
                          ? 'Pengguna yang telah mencapai batas tidak dapat menukar voucher ini lagi.'
                          : 'Nonaktif: Pengguna dapat memakai voucher berkali-kali.'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isUserLimitEnabled}
                    onClick={() => setIsUserLimitEnabled(!isUserLimitEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isUserLimitEnabled ? 'bg-emerald-600' : 'bg-neutral-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isUserLimitEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {isUserLimitEnabled && (
                  <div className="mt-3 border-t border-neutral-800/80 pt-3">
                    <label className="block text-[11px] font-medium text-neutral-300">
                      Maksimal Penggunaan Per Akun (Kali) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      placeholder="0"
                      value={maxUsesPerUser === 0 ? '' : maxUsesPerUser}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
                        setMaxUsesPerUser(clean === '' ? 0 : Number(clean));
                      }}
                      className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-[#080B10] px-3 py-2 text-xs text-white outline-none transition focus:border-emerald-500"
                    />
                    <span className="mt-1 block text-[10px] text-neutral-400">
                      Ketika user sudah pernah memakai voucher sebanyak {maxUsesPerUser} kali,
                      sistem akan menolak klaim berikutnya.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Masa Berlaku: Start & End */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DateTimePicker24
                label="Mulai Berlaku"
                required
                value={validFrom}
                defaultTime="00:00"
                onChange={(val) => setValidFrom(val || '')}
                helperText="Promosi aktif mulai tanggal & jam ini."
              />

              <DateTimePicker24
                label="Berakhir (Kedaluwarsa)"
                required
                value={validUntil}
                defaultTime="23:59"
                minDate={validFrom ? validFrom.slice(0, 10) : undefined}
                onChange={(val) => setValidUntil(val || '')}
                helperText="Promosi kedaluwarsa setelah tanggal & jam ini."
              />
            </div>

            {/* Status Aktif */}
            <div className="flex items-center gap-3 border-t border-neutral-800 pt-2">
              <input
                type="checkbox"
                id="is_active_toggle_page"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="is_active_toggle_page"
                className="cursor-pointer text-xs font-semibold text-neutral-200"
              >
                Aktifkan promosi ini segera setelah disimpan
              </label>
            </div>
          </form>
        </div>

        {/* Kolom Kanan: Preview & Simulasi Real-Time (5 Kolom) */}
        <div className="lg:col-span-5">
          <div className="sticky top-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-blue-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                  {promoType === 'direct_discount'
                    ? 'Preview Diskon Langsung'
                    : 'Preview Kupon Voucher'}
                </h2>
              </div>
            </div>

            {/* 1. KARTU RINGKASAN KONFIGURASI PROMOSI (Tersinkronisasi 100% dengan border sebelah kiri) */}
            <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-[#0B0E14] p-5">
              <div className="flex items-start justify-between">
                <div>
                  <span
                    className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      promoType === 'direct_discount'
                        ? 'bg-rose-500/10 text-rose-400'
                        : 'bg-blue-500/10 text-blue-400'
                    }`}
                  >
                    {promoType === 'direct_discount'
                      ? 'Diskon Langsung (Coret Harga)'
                      : 'Kupon Voucher'}
                  </span>
                  {promoType === 'direct_discount' ? (
                    <div className="mt-2 text-base font-bold text-white">
                      {name ? name : 'Diskon Coret Katalog'}
                    </div>
                  ) : (
                    <>
                      <div className="mt-2 font-mono text-xl font-extrabold tracking-wider text-white">
                        {code ? code.toUpperCase() : 'KODE PROMO'}
                      </div>
                      {name ? (
                        <div className="mt-0.5 text-xs font-medium text-neutral-300">{name}</div>
                      ) : (
                        <div className="mt-0.5 text-xs italic text-neutral-500">
                          (Tanpa Nama Promosi)
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="text-right">
                  <div
                    className={`text-lg font-black ${
                      promoType === 'direct_discount' ? 'text-rose-400' : 'text-blue-400'
                    }`}
                  >
                    {discountType === 'percentage'
                      ? `${discountValue}% OFF`
                      : discountType === 'slashed_price'
                        ? `Rp ${Number(discountValue).toLocaleString('id-ID')}`
                        : `Rp ${Number(discountValue).toLocaleString('id-ID')}`}
                  </div>
                  {promoType === 'voucher_code' &&
                    isMaxDiscountEnabled &&
                    maxDiscountAmount &&
                    Number(maxDiscountAmount) > 0 && (
                      <div className="text-[10px] text-neutral-400">
                        Maks. Rp {Number(maxDiscountAmount).toLocaleString('id-ID')}
                      </div>
                    )}
                  {discountType === 'slashed_price' && (
                    <div className="text-[10px] text-neutral-400">Potongan Coret Harga</div>
                  )}
                </div>
              </div>

              {/* Rincian Aturan Sinkron */}
              <div className="mt-4 space-y-2 border-t border-neutral-800/80 pt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400">Cakupan Promosi:</span>
                  <span className="max-w-[200px] truncate text-right font-semibold text-neutral-200">
                    {scopeType === 'event'
                      ? selectedEvent
                        ? selectedEvent.title
                        : 'Event Belum Dipilih'
                      : scopeType === 'movie'
                        ? selectedMovie
                          ? selectedMovie.title
                          : 'Film Belum Dipilih'
                        : scopeType === 'tickets_only'
                          ? 'Semua Tiket Event Bioskop'
                          : scopeType === 'vod_only'
                            ? 'Semua Sewa Film VoD'
                            : 'Semua Produk (Tiket & Film)'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400">Min. Belanja Transaksi:</span>
                  <span className="font-semibold text-neutral-200">
                    {isMinTransactionEnabled
                      ? `Rp ${Number(minTransactionAmount).toLocaleString('id-ID')}`
                      : 'Tanpa Minimal Belanja'}
                  </span>
                </div>

                {/* Maksimal Diskon hanya pada Tab Kupon Voucher */}
                {promoType === 'voucher_code' && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400">Maksimal Diskon:</span>
                    <span className="font-semibold text-neutral-200">
                      {isMaxDiscountEnabled && maxDiscountAmount && Number(maxDiscountAmount) > 0
                        ? `Rp ${Number(maxDiscountAmount).toLocaleString('id-ID')}`
                        : 'Tanpa Batas Maksimal'}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400">Total Kuota:</span>
                  <span className="font-semibold text-neutral-200">
                    {isQuotaEnabled ? `${quota} Penggunaan` : 'Tidak Terbatas (Unlimited)'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400">Batas Kuota Pengguna:</span>
                  <span className="font-semibold text-neutral-200">
                    {isUserLimitEnabled ? `${maxUsesPerUser}x per akun` : 'Tidak Dibatasi'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400">Masa Berlaku:</span>
                  <span className="text-[11px] font-medium text-neutral-300">
                    {new Date(validFrom).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                    })}{' '}
                    -{' '}
                    {new Date(validUntil).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mt-4 flex items-center justify-between border-t border-dashed border-neutral-800 pt-3">
                <span className="text-[11px] text-neutral-500">Status Promosi:</span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-neutral-500'}`}
                  />
                  {isActive ? 'Aktif' : 'Non-aktif'}
                </span>
              </div>
            </div>

            {/* 2. KARTU PREVIEW POTONGAN & HARGA AKHIR PRODUK (LIVE DARI DATA PRODUK ASLI) */}
            <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-[#0B0E14] p-5">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div className="flex items-center gap-2">
                  {activeProduct?.type === 'movie' ? (
                    <Film className="h-4 w-4 text-sky-400" />
                  ) : (
                    <Calendar className="h-4 w-4 text-amber-400" />
                  )}
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                    {promoType === 'direct_discount'
                      ? 'Preview Harga Coret Produk'
                      : 'Preview Potongan Harga Produk'}
                  </h3>
                </div>
              </div>

              {/* Scope Selectors when scope is broad */}
              {scopeType === 'all' && (
                <div className="mt-3.5 space-y-2 border-b border-neutral-800/80 pb-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400">Produk yang Disimulasi:</span>
                    <div className="flex items-center gap-1 rounded-lg bg-neutral-900 p-0.5">
                      <button
                        type="button"
                        onClick={() => setSimulationScopeTab('event')}
                        className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                          simulationScopeTab === 'event'
                            ? 'bg-blue-600 text-white'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        Tiket Event
                      </button>
                      <button
                        type="button"
                        onClick={() => setSimulationScopeTab('movie')}
                        className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                          simulationScopeTab === 'movie'
                            ? 'bg-blue-600 text-white'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        Film VoD
                      </button>
                    </div>
                  </div>

                  {simulationScopeTab === 'event' ? (
                    <div>
                      <label className="mb-1 block text-[11px] text-neutral-400">
                        Pilih Event untuk Simulasi:
                      </label>
                      <select
                        value={simulationEventId || events[0]?.id || ''}
                        onChange={(e) => setSimulationEventId(Number(e.target.value))}
                        className="w-full rounded-lg border border-neutral-800 bg-[#080B10] px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                      >
                        {events.map((ev) => (
                          <option key={ev.id} value={ev.id}>
                            {ev.title} (Rp {getEventPrice(ev).toLocaleString('id-ID')})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="mb-1 block text-[11px] text-neutral-400">
                        Pilih Film untuk Simulasi:
                      </label>
                      <select
                        value={simulationMovieId || movies[0]?.id || ''}
                        onChange={(e) => setSimulationMovieId(Number(e.target.value))}
                        className="w-full rounded-lg border border-neutral-800 bg-[#080B10] px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                      >
                        {movies.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.title} (Rp {getMoviePrice(m).toLocaleString('id-ID')})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {scopeType === 'tickets_only' && (
                <div className="mt-3.5 border-b border-neutral-800/80 pb-3">
                  <label className="mb-1 block text-[11px] text-neutral-400">
                    Pilih Event untuk Simulasi:
                  </label>
                  <select
                    value={simulationEventId || events[0]?.id || ''}
                    onChange={(e) => setSimulationEventId(Number(e.target.value))}
                    className="w-full rounded-lg border border-neutral-800 bg-[#080B10] px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                  >
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title} (Rp {getEventPrice(ev).toLocaleString('id-ID')})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {scopeType === 'vod_only' && (
                <div className="mt-3.5 border-b border-neutral-800/80 pb-3">
                  <label className="mb-1 block text-[11px] text-neutral-400">
                    Pilih Film untuk Simulasi:
                  </label>
                  <select
                    value={simulationMovieId || movies[0]?.id || ''}
                    onChange={(e) => setSimulationMovieId(Number(e.target.value))}
                    className="w-full rounded-lg border border-neutral-800 bg-[#080B10] px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                  >
                    {movies.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title} (Rp {getMoviePrice(m).toLocaleString('id-ID')})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Jika Scope adalah spesifik event atau movie tapi belum dipilih di formulir */}
              {scopeType === 'event' && !selectedEvent ? (
                <div className="mt-4 rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 p-4 text-center">
                  <Calendar className="mx-auto mb-2 h-6 w-6 text-amber-400" />
                  <p className="text-xs font-semibold text-amber-300">Belum Ada Event Terpilih</p>
                  <p className="mt-1 text-[11px] text-neutral-400">
                    Silakan pilih Event Bioskop pada bagian{' '}
                    <strong>&quot;Cakupan Pemakaian Promosi&quot;</strong> di formulir sebelah kiri
                    untuk melihat simulasi perhitungan harga tiket riil.
                  </p>
                </div>
              ) : scopeType === 'movie' && !selectedMovie ? (
                <div className="mt-4 rounded-xl border border-dashed border-sky-500/30 bg-sky-500/5 p-4 text-center">
                  <Film className="mx-auto mb-2 h-6 w-6 text-sky-400" />
                  <p className="text-xs font-semibold text-sky-300">Belum Ada Film Terpilih</p>
                  <p className="mt-1 text-[11px] text-neutral-400">
                    Silakan pilih Film VoD pada bagian{' '}
                    <strong>&quot;Cakupan Pemakaian Promosi&quot;</strong> di formulir sebelah kiri
                    untuk melihat simulasi perhitungan harga sewa riil.
                  </p>
                </div>
              ) : activeProduct ? (
                /* Produk Terpilih & Perhitungan Riil */
                <div className="mt-3.5 space-y-3">
                  <div>
                    <div className="text-[11px] font-medium text-neutral-400">
                      {activeProduct.type === 'event' ? 'Tiket Event Bioskop' : 'Sewa Film VoD'}:
                    </div>
                    <div className="truncate text-sm font-bold text-white">
                      {activeProduct.title}
                    </div>
                    {activeProduct.subtitle && (
                      <div className="text-[11px] text-neutral-400">{activeProduct.subtitle}</div>
                    )}
                  </div>

                  {/* Mode Tampilan Tab 2: Diskon Langsung (Coret Harga) */}
                  {promoType === 'direct_discount' ? (
                    <div className="space-y-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5">
                      <div className="flex items-baseline gap-3">
                        <span className="text-sm font-semibold text-neutral-500 line-through decoration-rose-500 decoration-2">
                          Rp {activeProduct.price.toLocaleString('id-ID')}
                        </span>
                        <span className="font-display text-2xl font-black text-rose-400">
                          Rp {finalCalculatedPrice.toLocaleString('id-ID')}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-400">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>
                          Hemat Rp {calculatedDeduction.toLocaleString('id-ID')}{' '}
                          {discountPercentageEffective > 0 &&
                            `(${discountPercentageEffective}% OFF)`}
                        </span>
                      </div>

                      <p className="border-t border-neutral-800/80 pt-2 text-[11px] leading-relaxed text-neutral-400">
                        Harga coret di atas akan langsung aktif di katalog tanpa penonton perlu
                        menukar kode voucher.
                      </p>
                    </div>
                  ) : (
                    /* Mode Tampilan Tab 1: Kupon Voucher (Simulasi Checkout) */
                    <div className="space-y-2 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5 text-xs">
                      <div className="flex items-center justify-between text-neutral-300">
                        <span className="text-neutral-400">Harga Asli Produk:</span>
                        <span className="font-medium">
                          Rp {activeProduct.price.toLocaleString('id-ID')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between font-semibold text-emerald-400">
                        <span>Potongan Diskon Voucher:</span>
                        <span>- Rp {calculatedDeduction.toLocaleString('id-ID')}</span>
                      </div>

                      {isMaxDiscountEnabled &&
                        maxDiscountAmount &&
                        Number(maxDiscountAmount) > 0 &&
                        discountType === 'percentage' &&
                        Math.round((activeProduct.price * Number(discountValue)) / 100) >
                          Number(maxDiscountAmount) && (
                          <div className="text-[10px] italic text-amber-400/90">
                            *Potongan dibatasi maksimal diskon Rp{' '}
                            {Number(maxDiscountAmount).toLocaleString('id-ID')}
                          </div>
                        )}

                      <div className="flex items-center justify-between border-t border-neutral-800/80 pt-2 font-bold text-white">
                        <span>Harga Akhir Bayar:</span>
                        <span className="text-base font-extrabold text-blue-400">
                          Rp {finalCalculatedPrice.toLocaleString('id-ID')}
                        </span>
                      </div>

                      {isMinTransactionEnabled &&
                        Number(minTransactionAmount) > 0 &&
                        activeProduct.price < Number(minTransactionAmount) && (
                          <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-[11px] text-amber-300">
                            Perhatian: Harga produk ini (Rp{' '}
                            {activeProduct.price.toLocaleString('id-ID')}) belum mencapai syarat
                            minimal belanja (Rp{' '}
                            {Number(minTransactionAmount).toLocaleString('id-ID')}).
                          </div>
                        )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-4 py-4 text-center text-xs text-neutral-500">
                  Tidak ada data produk yang tersedia untuk simulasi.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
