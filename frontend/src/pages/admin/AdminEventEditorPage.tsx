import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';
import { getFriendlyErrorMessage } from '@/lib/error-formatter';
import {
  useAdminEventDetailQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  EventTabInfo,
  EventTabVenue,
  EventTabSeatMapBuilder,
  EventLivePreviewCard,
  AdminMediaUploadCard,
  useMultiTabForm,
  type CreateEventPayload,
  type CastMember,
  type EventFormTab,
  type EventVenueFormInput,
  type ShowtimeSlotInput,
  type StudioSeatMapConfig,
} from '@/features/admin';

export interface AdminEventEditorPageProps {
  eventId?: number;
  onNavigate: (path: string) => void;
}

const DEFAULT_EVENT_FORM: CreateEventPayload = {
  title: '',
  slug: '',
  description: '',
  synopsis_short: '',
  poster_url: '',
  backdrop_url: '',
  director: '',
  cast: [],
  genre: ['Drama'],
  duration_minutes: 120,
  release_year: new Date().getFullYear(),
  age_rating: '13+',
  cloudflare_teaser_uid: null,
  venue_name: 'Cinema XXI Plaza Senayan',
  venue_address: 'Plaza Senayan Lt. 3, Jl. Asia Afrika No.8, Jakarta Pusat',
  city: 'Jakarta Pusat',
  google_maps_url: '',
  event_type: 'presale_cinema',
  seating_type: 'assigned_seating',
  cinema_partner: 'Cinema XXI',
  presale_start_at: null,
  presale_end_at: null,
  sales_start_at: null,
  sales_end_at: null,
  event_concludes_at: null,
  is_published: true,
  is_featured: false,
  venues: [
    {
      client_uid: 'venue-default-1',
      venue_name: 'Cinema XXI Plaza Senayan',
      city: 'Jakarta Pusat',
      venue_address: 'Plaza Senayan Lt. 3, Jl. Asia Afrika No.8, Jakarta Pusat',
      cinema_partner: 'Cinema XXI',
      google_maps_url: '',
      schedules: [
        {
          client_uid: 'slot-default-1',
          studio_name: 'Studio 1',
          show_time: '2026-11-28T19:30:00+07:00',
          ticket_price: 65000,
          total_seats: 60,
          max_tickets_per_order: 6,
        },
      ],
    },
  ],
  schedules: [
    {
      client_uid: 'slot-default-1',
      studio_name: 'Studio 1',
      show_time: '2026-11-28T19:30:00+07:00',
      ticket_price: 65000,
      total_seats: 60,
      max_tickets_per_order: 6,
    },
  ],
};

interface EventEditorFormProps {
  initialData: CreateEventPayload;
  eventId?: number;
  onNavigate: (path: string) => void;
}

const EVENT_DRAFT_STORAGE_KEY = 'sinemus_admin_event_form_draft';

function EventEditorForm({
  initialData,
  eventId,
  onNavigate,
}: EventEditorFormProps): React.JSX.Element {
  const isEditMode = Boolean(eventId);

  // Inisialisasi form: Jika create mode dan ada draf di sessionStorage, pulihkan draf tersebut
  const [formData, setFormData] = useState<CreateEventPayload>(() => {
    if (!isEditMode) {
      try {
        const savedDraft = sessionStorage.getItem(EVENT_DRAFT_STORAGE_KEY);
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft) as CreateEventPayload;
          return { ...initialData, ...parsed };
        }
      } catch {
        // Abaikan jika corrupt
      }
    }
    return initialData;
  });

  // Sinkronkan perubahan form ke sessionStorage saat mode buat baru (create mode)
  useEffect(() => {
    if (!isEditMode) {
      try {
        sessionStorage.setItem(EVENT_DRAFT_STORAGE_KEY, JSON.stringify(formData));
      } catch {
        // Kuota / SSR safe
      }
    }
  }, [formData, isEditMode]);

  // Dynamic Seat Map state per studio key (e.g., "0__Studio 1": { rows: 6, columns: 10, ... })
  const [studioSeatMaps, setStudioSeatMaps] = useState<Record<string, StudioSeatMapConfig>>(() => {
    const initialMaps: Record<string, StudioSeatMapConfig> = {};
    (formData.venues || initialData.venues)?.forEach((v, vIdx) => {
      const uniqueStudios = new Set(
        v.schedules?.map((s) => s.studio_name || 'Studio 1') || ['Studio 1']
      );
      uniqueStudios.forEach((sName) => {
        const schedulesForStudio =
          v.schedules?.filter((s) => (s.studio_name || 'Studio 1') === sName) || [];
        const isStudioLocked = schedulesForStudio.some((s) => s.is_seat_map_locked);
        const lockedSchedule = schedulesForStudio.find((s) => s.is_seat_map_locked);
        const lockedReason = lockedSchedule?.locked_reason || null;
        const allPaidSeatCodes = Array.from(
          new Set(schedulesForStudio.flatMap((s) => s.paid_seat_codes || []))
        );

        const matchingSchedule =
          schedulesForStudio.find((s) => s.seat_map_config) || schedulesForStudio[0];
        const smc = matchingSchedule?.seat_map_config;
        const seatCount = matchingSchedule?.total_seats || smc?.total_capacity || 60;

        if (smc && smc.rows && smc.columns) {
          const loadedAisleSeats = smc.aisle_seats || [];
          const loadedRows = smc.rows;
          const loadedCols = smc.columns;
          const derivedAisleCols: number[] = [];
          for (let c = 1; c <= loadedCols; c++) {
            let isColAisle = true;
            for (let r = 0; r < loadedRows; r++) {
              const code = `${String.fromCharCode(65 + r)}${c}`;
              if (!loadedAisleSeats.includes(code)) {
                isColAisle = false;
                break;
              }
            }
            if (isColAisle) {
              derivedAisleCols.push(c);
            }
          }

          initialMaps[`${vIdx}__${sName}`] = {
            rows: smc.rows,
            columns: smc.columns,
            disabledSeats: smc.disabled_seats || [],
            vipSeats: smc.vip_seats || [],
            aisleColumns: derivedAisleCols,
            aisleSeats: loadedAisleSeats,
            totalCapacity: seatCount > 0 ? seatCount : smc.rows * smc.columns,
            isLocked: isStudioLocked,
            lockedReason,
            paidSeatCodes: allPaidSeatCodes,
          };
        } else {
          initialMaps[`${vIdx}__${sName}`] = {
            rows: 6,
            columns: 10,
            disabledSeats: [],
            vipSeats: [],
            aisleColumns: [],
            aisleSeats: [],
            totalCapacity: seatCount > 0 ? seatCount : 60,
            isLocked: isStudioLocked,
            lockedReason,
            paidSeatCodes: allPaidSeatCodes,
          };
        }
      });
    });
    if (Object.keys(initialMaps).length === 0) {
      initialMaps['0__Studio 1'] = {
        rows: 6,
        columns: 10,
        disabledSeats: [],
        vipSeats: [],
        aisleColumns: [],
        aisleSeats: [],
        totalCapacity: 60,
      };
    }
    return initialMaps;
  });

  const [selectedStudioKey, setSelectedStudioKey] = useState<string>('0__Studio 1');

  // Dynamic Tabs based on seating_type SSOT: General Admission excludes seat map
  const tabs = useMemo<Array<{ id: EventFormTab; label: string }>>(() => {
    if (formData.seating_type === 'general_admission') {
      return [
        { id: 'info', label: '1. Info & Media' },
        { id: 'venue', label: '2. Lokasi & Kuota Penjualan' },
      ];
    }
    return [
      { id: 'info', label: '1. Info & Media' },
      { id: 'venue', label: '2. Lokasi & Jadwal Bioskop' },
      { id: 'seatmap', label: '3. Denah Kursi' },
    ];
  }, [formData.seating_type]);

  const { activeTab, setActiveTab, goToNextTab, goToPreviousTab, hasNext, hasPrevious } =
    useMultiTabForm(tabs, 'info');

  // Guard against staying on seatmap tab if switching to general_admission
  useEffect(() => {
    if (formData.seating_type === 'general_admission' && activeTab === 'seatmap') {
      setActiveTab('venue');
    }
  }, [formData.seating_type, activeTab, setActiveTab]);

  const handleSeatConfigChange = useCallback((studioKey: string, config: StudioSeatMapConfig) => {
    setStudioSeatMaps((prev) => {
      const existing = prev[studioKey];
      if (
        existing &&
        existing.rows === config.rows &&
        existing.columns === config.columns &&
        existing.totalCapacity === config.totalCapacity &&
        existing.vipPriceSurcharge === config.vipPriceSurcharge &&
        existing.vipSeats.length === config.vipSeats.length &&
        (existing.aisleSeats?.length ?? 0) === (config.aisleSeats?.length ?? 0) &&
        existing.aisleColumns.length === config.aisleColumns.length &&
        existing.vipSeats.every((s, i) => s === config.vipSeats[i]) &&
        (existing.aisleSeats || []).every((s, i) => s === (config.aisleSeats || [])[i]) &&
        existing.aisleColumns.every((c, i) => c === config.aisleColumns[i])
      ) {
        return prev;
      }
      return { ...prev, [studioKey]: config };
    });

    const [vIdxStr, ...rest] = studioKey.split('__');
    const targetVIdx = Number(vIdxStr);
    const targetStudioName = rest.join('__') || 'Studio 1';

    setFormData((prev) => {
      if (!prev.venues) return prev;
      let hasChanged = false;
      const updatedVenues = prev.venues.map((v, vIdx) => {
        if (vIdx !== targetVIdx) return v;
        const updatedSchedules = v.schedules?.map((s) => {
          if ((s.studio_name || 'Studio 1') === targetStudioName) {
            if (s.is_seat_map_locked) return s;
            const nextSchedule = { ...s };
            if (s.total_seats !== config.totalCapacity) {
              hasChanged = true;
              nextSchedule.total_seats = config.totalCapacity;
            }

            const hasVipSeats = (config.vipSeats?.length ?? 0) > 0;
            if (hasVipSeats) {
              const calculatedVipPrice =
                (s.ticket_price || 0) + (config.vipPriceSurcharge ?? 20000);
              if (s.vip_ticket_price !== calculatedVipPrice) {
                hasChanged = true;
                nextSchedule.vip_ticket_price = calculatedVipPrice;
              }
            } else {
              // Jika denah tidak memiliki kursi VIP, reset tarif VIP hantu
              if (s.vip_ticket_price !== undefined && s.vip_ticket_price !== null) {
                hasChanged = true;
                nextSchedule.vip_ticket_price = null;
              }
            }
            return nextSchedule;
          }
          return s;
        });
        return { ...v, schedules: updatedSchedules };
      });

      if (!hasChanged) return prev;
      return { ...prev, venues: updatedVenues };
    });
  }, []);

  const handleApplyToAllStudios = useCallback(
    (capacity: number, config: StudioSeatMapConfig) => {
      setStudioSeatMaps((prev) => {
        const nextMaps = { ...prev };
        formData.venues?.forEach((v, vIdx) => {
          const uniqueStudios = new Set(
            v.schedules?.map((s) => s.studio_name || 'Studio 1') || ['Studio 1']
          );
          uniqueStudios.forEach((sName) => {
            const key = `${vIdx}__${sName}`;
            if (nextMaps[key]?.isLocked) return;
            nextMaps[key] = { ...config, totalCapacity: capacity };
          });
        });
        return nextMaps;
      });

      setFormData((prev) => {
        if (!prev.venues) return prev;
        const hasVipSeats = (config.vipSeats?.length ?? 0) > 0;
        const calculatedSurcharge = config.vipPriceSurcharge ?? 20000;
        const updatedVenues = prev.venues.map((v) => ({
          ...v,
          schedules: v.schedules?.map((s) => {
            if (s.is_seat_map_locked) return s;
            return {
              ...s,
              total_seats: capacity,
              vip_ticket_price: hasVipSeats ? (s.ticket_price || 0) + calculatedSurcharge : null,
            };
          }),
        }));
        return { ...prev, venues: updatedVenues };
      });

      toast.success(`Kapasitas denah ${capacity} kursi diterapkan ke studio yang tidak terkunci.`);
    },
    [formData.venues]
  );

  const handleNavigateToStudioSeatMap = useCallback(
    (studioKey: string) => {
      setSelectedStudioKey(studioKey);
      setActiveTab('seatmap');
    },
    [setActiveTab]
  );

  const createMutation = useCreateEventMutation();
  const updateMutation = useUpdateEventMutation(eventId);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleUpdateField = (updates: Partial<CreateEventPayload>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Pre-flight Validation: Tab Info & Media
    if (!formData.title?.trim()) {
      toast.error('Judul event penayangan wajib diisi.');
      setActiveTab('info');
      return;
    }

    if (!formData.director?.trim()) {
      toast.error('Nama sutradara wajib diisi.');
      setActiveTab('info');
      return;
    }

    const validCast: CastMember[] = (formData.cast || [])
      .map((c): CastMember | null => {
        if (typeof c === 'string') {
          const actor = c.trim();
          return actor ? { actor, role: null } : null;
        }
        if (c && typeof c === 'object') {
          const actor = (c.actor || (c as unknown as { name?: string }).name || '').trim();
          const roleRaw = c.role ?? (c as unknown as { character?: string }).character ?? null;
          const role = roleRaw ? String(roleRaw).trim() : null;
          return actor ? { actor, role } : null;
        }
        return null;
      })
      .filter((c): c is CastMember => c !== null);

    if (validCast.length === 0) {
      toast.error('Minimal 1 nama pemeran/cast wajib diisi.');
      setActiveTab('info');
      return;
    }

    if (!formData.synopsis_short?.trim()) {
      toast.error('Sinopsis singkat wajib diisi.');
      setActiveTab('info');
      return;
    }

    if (!formData.description?.trim()) {
      toast.error('Deskripsi lengkap event wajib diisi.');
      setActiveTab('info');
      return;
    }

    const validGenre = formData.genre?.filter((g) => g.trim()) || [];
    if (validGenre.length === 0) {
      toast.error('Pilih minimal 1 genre film penayangan.');
      setActiveTab('info');
      return;
    }

    const durationNum = Number(formData.duration_minutes);
    if (!durationNum || durationNum <= 0 || durationNum > 600) {
      toast.error('Durasi film harus valid antara 1 sampai 600 menit.');
      setActiveTab('info');
      return;
    }

    const releaseYearNum = Number(formData.release_year);
    if (!releaseYearNum || releaseYearNum < 1900 || releaseYearNum > 2099) {
      toast.error('Tahun rilis film harus valid antara 1900 sampai 2099.');
      setActiveTab('info');
      return;
    }

    if (!isEditMode) {
      if (!formData.poster_url?.trim() && !formData.poster_path?.trim()) {
        toast.error('Poster film wajib diunggah.');
        setActiveTab('info');
        return;
      }
      if (!formData.backdrop_url?.trim() && !formData.backdrop_path?.trim()) {
        toast.error('Backdrop / banner film wajib diunggah.');
        setActiveTab('info');
        return;
      }
    }

    if (formData.presale_start_at && formData.presale_end_at) {
      if (
        new Date(formData.presale_end_at).getTime() < new Date(formData.presale_start_at).getTime()
      ) {
        toast.error('Waktu penutupan penjualan tidak boleh mendahului waktu mulai penjualan.');
        setActiveTab('info');
        return;
      }
    }

    if (formData.event_type === 'presale_cinema') {
      if (!formData.presale_start_at) {
        toast.error('Waktu mulai presale wajib ditentukan untuk event Presale.');
        setActiveTab('info');
        return;
      }
      if (!formData.presale_end_at) {
        toast.error('Waktu berakhir presale wajib ditentukan untuk event Presale.');
        setActiveTab('info');
        return;
      }
    }

    if (formData.event_concludes_at && formData.presale_end_at) {
      if (
        new Date(formData.event_concludes_at).getTime() <
        new Date(formData.presale_end_at).getTime()
      ) {
        toast.error('Waktu selesai acara tidak boleh mendahului batas penutupan tiket.');
        setActiveTab('info');
        return;
      }
    }

    // 2. Pre-flight Validation: Tab Venue & Schedules
    const venues = formData.venues || [];
    if (venues.length === 0) {
      toast.error('Minimal 1 lokasi bioskop penayangan wajib ditambahkan.');
      setActiveTab('venue');
      return;
    }

    for (let i = 0; i < venues.length; i++) {
      const v = venues[i];
      const venueLabel = v.venue_name?.trim() || `Bioskop #${i + 1}`;

      if (!v.venue_name?.trim()) {
        toast.error(`Nama lokasi bioskop pada ${venueLabel} wajib diisi.`);
        setActiveTab('venue');
        return;
      }

      if (!v.city?.trim()) {
        toast.error(`Kota penayangan pada ${venueLabel} wajib diisi.`);
        setActiveTab('venue');
        return;
      }

      if (!v.schedules || v.schedules.length === 0) {
        toast.error(`Tambahkan minimal 1 sesi jam tayang pada ${venueLabel}.`);
        setActiveTab('venue');
        return;
      }

      for (let sIdx = 0; sIdx < v.schedules.length; sIdx++) {
        const s = v.schedules[sIdx];
        if (!s.show_time) {
          toast.error(`Waktu sesi tayang #${sIdx + 1} pada ${venueLabel} belum ditentukan.`);
          setActiveTab('venue');
          return;
        }
        const effectiveTicketPrice = Number(
          s.ticket_price ?? (s as unknown as { price?: number }).price
        );
        if (isNaN(effectiveTicketPrice) || effectiveTicketPrice <= 0) {
          toast.error(
            `Harga tiket sesi tayang #${sIdx + 1} pada ${venueLabel} harus lebih dari Rp 0.`
          );
          setActiveTab('venue');
          return;
        }
        if (!s.total_seats || s.total_seats <= 0) {
          toast.error(
            `Kapasitas kursi sesi tayang #${sIdx + 1} pada ${venueLabel} harus lebih dari 0.`
          );
          setActiveTab('venue');
          return;
        }
      }
    }

    const cinemaPartnerMaster = formData.cinema_partner?.trim() || 'Cinema XXI';
    const sanitizedVenues = venues.map((v, vIdx) => ({
      ...v,
      cinema_partner: cinemaPartnerMaster,
      schedules: v.schedules?.map((s) => {
        const studioKey = `${vIdx}__${s.studio_name || 'Studio 1'}`;
        const seatConfig = studioSeatMaps[studioKey];
        const effectiveTicketPrice = Number(
          s.ticket_price ?? (s as unknown as { price?: number }).price ?? 0
        );
        const mappedSchedule = {
          ...s,
          ticket_price: effectiveTicketPrice,
          total_seats: s.total_seats || 60,
        };
        if (formData.seating_type === 'assigned_seating' && seatConfig) {
          return {
            ...mappedSchedule,
            total_seats: seatConfig.totalCapacity || s.total_seats,
            seat_map_config: {
              rows: seatConfig.rows,
              columns: seatConfig.columns,
              vip_seats: seatConfig.vipSeats || [],
              disabled_seats: seatConfig.disabledSeats || [],
              aisle_seats: seatConfig.aisleSeats || [],
              total_capacity: seatConfig.totalCapacity,
            },
          };
        }
        return mappedSchedule;
      }),
    }));

    // Auto-derive target_screening_month dari sesi tayang bioskop pertama atau presale window
    let derivedScreeningMonth = formData.target_screening_month;
    if (formData.event_type === 'presale_cinema') {
      const firstShowTime = sanitizedVenues[0]?.schedules?.[0]?.show_time;
      const refDateStr = firstShowTime || formData.presale_end_at || formData.presale_start_at;
      if (refDateStr) {
        try {
          const d = new Date(refDateStr);
          if (!isNaN(d.getTime())) {
            const monthNames = [
              'Januari',
              'Februari',
              'Maret',
              'April',
              'Mei',
              'Juni',
              'Juli',
              'Agustus',
              'September',
              'Oktober',
              'November',
              'Desember',
            ];
            derivedScreeningMonth = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
          }
        } catch {
          // fallback aman
        }
      }
    }

    const primaryVenue = sanitizedVenues[0];
    const flattenedSchedules = sanitizedVenues.flatMap((v) => v.schedules || []);
    const isPublishedFinal = Boolean(formData.is_published);
    const payloadToSubmit: CreateEventPayload = {
      ...formData,
      cast: validCast,
      genre: validGenre,
      duration_minutes: durationNum,
      release_year: releaseYearNum,
      age_rating: formData.age_rating || '13+',
      venue_name: primaryVenue?.venue_name?.trim() || formData.venue_name || 'Cinema XXI',
      venue_address:
        primaryVenue?.venue_address?.trim() || formData.venue_address || 'Alamat Bioskop',
      city: primaryVenue?.city?.trim() || formData.city || 'Jakarta Pusat',
      is_published: isPublishedFinal,
      is_active: isPublishedFinal,
      is_featured: isPublishedFinal ? Boolean(formData.is_featured) : false,
      cinema_partner: cinemaPartnerMaster,
      target_screening_month: derivedScreeningMonth,
      poster_url: formData.poster_url?.trim() ? formData.poster_url.trim() : null,
      backdrop_url: formData.backdrop_url?.trim() ? formData.backdrop_url.trim() : null,
      venues: sanitizedVenues,
      schedules: flattenedSchedules,
    };

    try {
      if (isEditMode && eventId) {
        await updateMutation.mutateAsync({ id: eventId, data: payloadToSubmit });
        toast.success(`Event "${formData.title}" berhasil diperbarui.`);
      } else {
        await createMutation.mutateAsync(payloadToSubmit);
        try {
          sessionStorage.removeItem(EVENT_DRAFT_STORAGE_KEY);
        } catch {
          // ignore
        }
        toast.success(`Event baru "${formData.title}" berhasil dibuat dan disimpan.`);
      }
      onNavigate('/admin/events');
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.data) {
        const responseData = error.response.data as {
          message?: string;
          error_code?: string;
          errors?: Record<string, string[]>;
        };

        if (
          responseData.error_code === 'SEATMAP_LOCKED' ||
          responseData.message?.toLowerCase().includes('terkunci')
        ) {
          setActiveTab('seatmap');
          toast.error(
            responseData.message ||
              'Denah kursi terkunci karena sudah ada tiket penonton yang lunas.'
          );
          return;
        }

        if (responseData.errors && Object.keys(responseData.errors).length > 0) {
          const firstField = Object.keys(responseData.errors)[0];
          const firstErrorMsg =
            responseData.errors[firstField]?.[0] || 'Data formulir tidak valid.';

          // Auto-switch ke tab yang relevan dengan error
          if (
            firstField.startsWith('venues') ||
            firstField.startsWith('cinema_partner') ||
            firstField.startsWith('target_screening_month')
          ) {
            setActiveTab('venue');
          } else if (firstField.startsWith('seat_map') || firstField.includes('seat')) {
            setActiveTab('seatmap');
          } else {
            setActiveTab('info');
          }

          toast.error(`Validasi gagal (${firstField}): ${firstErrorMsg}`);
          return;
        }

        if (responseData.message) {
          toast.error(responseData.message);
          return;
        }
      }

      toast.error(
        getFriendlyErrorMessage(
          error,
          'Gagal menyimpan event. Periksa kembali kelengkapan formulir.'
        )
      );
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 border-b border-neutral-800 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('/admin/events')}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-800 bg-[#0D111A] text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
            title="Kembali ke Daftar Event"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="font-display text-lg font-extrabold text-white sm:text-xl">
              {isEditMode
                ? `Edit Event: ${formData.title || '#' + eventId}`
                : 'Buat Jadwal Event Baru'}
            </h1>
            <p className="mt-0.5 text-xs text-neutral-400">
              {formData.seating_type === 'general_admission'
                ? 'General Admission Festival & Kuota Screening Manager'
                : 'Multi-Venue Cinema Screening, Studio & Interactive Seatmap Builder'}
            </p>
          </div>
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <button
            type="button"
            onClick={() => onNavigate('/admin/events')}
            className="flex-1 rounded-xl border border-neutral-800 px-4 py-2 text-xs font-semibold text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white sm:flex-none"
          >
            Batal
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#0066FF] px-4 py-2 text-xs font-bold text-white transition-all hover:bg-blue-600 disabled:opacity-50 sm:flex-none"
          >
            <Save className="h-3.5 w-3.5" />
            {isSaving ? 'Menyimpan...' : isEditMode ? 'Simpan Perubahan' : 'Simpan & Terbitkan'}
          </button>
        </div>
      </div>

      {/* Split-Screen 2-Column Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-8">
        {/* Left Form Area (7 Cols) */}
        <div className="space-y-6 lg:col-span-7">
          {/* Tab Navigation Pill Bar */}
          <div className="no-scrollbar flex overflow-x-auto rounded-xl border border-neutral-800 bg-[#0B0E14] p-1 text-xs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 whitespace-nowrap rounded-lg px-3 py-2 font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#0066FF] text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content Panels */}
          <div className="rounded-2xl border border-neutral-800 bg-[#0B0E14] p-4 sm:p-6">
            {activeTab === 'info' && (
              <EventTabInfo formData={formData} onChange={handleUpdateField} />
            )}

            {activeTab === 'venue' && (
              <EventTabVenue
                formData={formData}
                onChange={handleUpdateField}
                studioSeatMaps={studioSeatMaps}
                onNavigateToStudioSeatMap={handleNavigateToStudioSeatMap}
              />
            )}

            {activeTab === 'seatmap' && formData.seating_type === 'assigned_seating' && (
              <EventTabSeatMapBuilder
                venues={formData.venues}
                selectedStudioKey={selectedStudioKey}
                studioConfigs={studioSeatMaps}
                onSelectStudioKey={setSelectedStudioKey}
                onApplyToAllStudios={handleApplyToAllStudios}
                onSeatConfigChange={handleSeatConfigChange}
              />
            )}

            {/* Stepper Navigation Buttons */}
            <div className="mt-8 flex items-center justify-between border-t border-neutral-800/80 pt-4">
              <button
                type="button"
                onClick={goToPreviousTab}
                disabled={!hasPrevious}
                className="rounded-xl border border-neutral-800 px-3 py-1.5 text-xs font-semibold text-neutral-400 hover:text-white disabled:opacity-30"
              >
                ← Sebelumnya
              </button>

              {hasNext ? (
                <button
                  type="button"
                  onClick={goToNextTab}
                  className="rounded-xl bg-neutral-800 px-4 py-1.5 text-xs font-bold text-white hover:bg-neutral-700"
                >
                  Lanjut →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-[#0066FF] px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-600"
                >
                  {isSaving ? 'Menyimpan...' : 'Selesai & Simpan'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Sticky Upload Studio & Preview (5 Cols) */}
        <div className="space-y-5 lg:col-span-5">
          <div className="sticky top-6 space-y-5">
            <AdminMediaUploadCard
              posterUrl={formData.poster_url || null}
              backdropUrl={formData.backdrop_url || null}
              onPosterChange={(url) => setFormData((prev) => ({ ...prev, poster_url: url || '' }))}
              onBackdropChange={(url) =>
                setFormData((prev) => ({ ...prev, backdrop_url: url || '' }))
              }
              assetTypePrefix="event"
            />

            <EventLivePreviewCard formData={formData} />
          </div>
        </div>
      </div>
    </form>
  );
}

export function AdminEventEditorPage({
  eventId,
  onNavigate,
}: AdminEventEditorPageProps): React.JSX.Element {
  const isEditMode = Boolean(eventId);

  const { data: existingEvent, isLoading: isFetchingEvent } = useAdminEventDetailQuery(
    eventId,
    isEditMode
  );

  if (isEditMode && isFetchingEvent) {
    return (
      <div className="py-20 text-center text-xs text-neutral-400">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        Memuat data event...
      </div>
    );
  }

  let initialData: CreateEventPayload = DEFAULT_EVENT_FORM;

  if (existingEvent) {
    const rawSchedules: ShowtimeSlotInput[] = (existingEvent.schedules || []).map((s) => ({
      id: s.id,
      client_uid: `slot-db-${s.id}`,
      studio_name: s.studio_name || 'Studio 1',
      show_time: s.show_time,
      ticket_price: s.ticket_price,
      vip_ticket_price: s.vip_ticket_price ?? null,
      total_seats: s.total_seats,
      max_tickets_per_order: s.max_tickets_per_order,
      seat_map_config: s.seat_map_config ?? undefined,
      is_seat_map_locked: s.is_seat_map_locked,
      locked_reason: s.locked_reason,
      paid_seat_codes: s.paid_seat_codes,
    }));

    const mappedVenues: EventVenueFormInput[] = [];

    if (existingEvent.venues && existingEvent.venues.length > 0) {
      existingEvent.venues.forEach((v) => {
        const matchingSchedules = (existingEvent.schedules || [])
          .filter((s) => s.event_venue_id === v.id)
          .map((s) => ({
            id: s.id,
            client_uid: `slot-db-${s.id}`,
            studio_name: s.studio_name || 'Studio 1',
            show_time: s.show_time,
            ticket_price: s.ticket_price,
            vip_ticket_price: s.vip_ticket_price ?? null,
            total_seats: s.total_seats,
            max_tickets_per_order: s.max_tickets_per_order,
            seat_map_config: s.seat_map_config ?? undefined,
            is_seat_map_locked: s.is_seat_map_locked,
            locked_reason: s.locked_reason,
            paid_seat_codes: s.paid_seat_codes,
          }));

        mappedVenues.push({
          id: v.id,
          client_uid: `venue-db-${v.id}`,
          venue_name: v.venue_name,
          cinema_partner: v.cinema_partner || existingEvent.cinema_partner || 'Cinema XXI',
          city: v.city,
          venue_address: v.venue_address,
          google_maps_url: v.google_maps_url || '',
          schedules:
            matchingSchedules.length > 0
              ? matchingSchedules
              : existingEvent.venues && existingEvent.venues.length === 1
                ? rawSchedules
                : [],
        });
      });
    } else {
      mappedVenues.push({
        client_uid: 'venue-fallback-1',
        venue_name: existingEvent.venue_name || '',
        cinema_partner: existingEvent.cinema_partner || 'Cinema XXI',
        city: existingEvent.city || 'Jakarta Pusat',
        venue_address: existingEvent.venue_address || '',
        google_maps_url: existingEvent.google_maps_url || '',
        schedules: rawSchedules,
      });
    }

    initialData = {
      title: existingEvent.title,
      slug: existingEvent.slug,
      description: existingEvent.description,
      synopsis_short: existingEvent.synopsis_short,
      poster_url: existingEvent.poster_url,
      backdrop_url: existingEvent.backdrop_url,
      director: existingEvent.director,
      cast: existingEvent.cast,
      genre:
        existingEvent.genre && existingEvent.genre.length > 0 ? existingEvent.genre : ['Drama'],
      duration_minutes:
        existingEvent.duration_minutes && existingEvent.duration_minutes > 0
          ? existingEvent.duration_minutes
          : 120,
      release_year:
        existingEvent.release_year && existingEvent.release_year >= 1900
          ? existingEvent.release_year
          : new Date().getFullYear(),
      age_rating: existingEvent.age_rating || '13+',
      cloudflare_teaser_uid: existingEvent.cloudflare_teaser_uid,
      venue_name: existingEvent.venue_name,
      venue_address: existingEvent.venue_address,
      city: existingEvent.city,
      google_maps_url: existingEvent.google_maps_url,
      event_type: existingEvent.event_type,
      seating_type: existingEvent.seating_type,
      cinema_partner: existingEvent.cinema_partner,
      presale_start_at: existingEvent.presale_start_at ?? existingEvent.sales_start_at ?? null,
      presale_end_at: existingEvent.presale_end_at ?? existingEvent.sales_end_at ?? null,
      sales_start_at: existingEvent.sales_start_at ?? existingEvent.presale_start_at ?? null,
      sales_end_at: existingEvent.sales_end_at ?? existingEvent.presale_end_at ?? null,
      event_concludes_at: existingEvent.event_concludes_at ?? null,
      is_published: existingEvent.is_published ?? existingEvent.is_active ?? false,
      is_active: existingEvent.is_active ?? existingEvent.is_published ?? false,
      is_featured: existingEvent.is_featured ?? false,
      venues: mappedVenues,
      schedules: rawSchedules,
    };
  }

  return (
    <EventEditorForm
      key={existingEvent?.id ?? 'create-event'}
      initialData={initialData}
      eventId={eventId}
      onNavigate={onNavigate}
    />
  );
}
