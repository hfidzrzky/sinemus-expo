import React, { useState } from 'react';
import { MapPin, Plus, Trash2, ChevronDown, ChevronUp, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import type {
  CreateEventPayload,
  EventVenueFormInput,
  ShowtimeSlotInput,
  StudioSeatMapConfig,
} from '../../types';
import { StudioScheduleCard } from './StudioScheduleCard';

export interface EventTabVenueProps {
  formData: CreateEventPayload;
  onChange: (updates: Partial<CreateEventPayload>) => void;
  studioSeatMaps?: Record<string, StudioSeatMapConfig>;
  onNavigateToStudioSeatMap?: (studioKey: string) => void;
}

const POPULAR_CITIES = [
  'Jakarta Pusat',
  'Jakarta Selatan',
  'Jakarta Barat',
  'Jakarta Timur',
  'Jakarta Utara',
  'Bandung',
  'Surabaya',
  'Yogyakarta',
  'Semarang',
  'Denpasar',
  'Medan',
  'Makassar',
];

export function EventTabVenue({
  formData,
  onChange,
  studioSeatMaps,
  onNavigateToStudioSeatMap,
}: EventTabVenueProps): React.JSX.Element {
  const venues: EventVenueFormInput[] =
    formData.venues && formData.venues.length > 0
      ? formData.venues
      : [
          {
            client_uid: 'venue-default-1',
            venue_name: formData.venue_name || '',
            city: formData.city || 'Jakarta Pusat',
            venue_address: formData.venue_address || '',
            cinema_partner: formData.cinema_partner || 'Cinema XXI',
            google_maps_url: formData.google_maps_url || '',
            schedules: formData.schedules || [],
          },
        ];

  // Accordion open/close state per venue index
  const [openVenueIndex, setOpenVenueIndex] = useState<number>(0);

  // Local state to track studio list per venue (so studios with 0 schedules don't disappear)
  const [venueStudios, setVenueStudios] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {};
    venues.forEach((v, vIdx) => {
      const vKey = v.client_uid || String(vIdx);
      const names = Array.from(
        new Set((v.schedules || []).map((s) => s.studio_name || 'Studio 1'))
      );
      initial[vKey] = names.length > 0 ? names : ['Studio 1'];
    });
    return initial;
  });

  // Sync update to parent formData
  const handleUpdateVenues = (updatedVenues: EventVenueFormInput[]) => {
    // Also keep flat backward-compatible fields in sync with the first venue
    const firstVenue = updatedVenues[0];
    const allSchedules: ShowtimeSlotInput[] = [];
    updatedVenues.forEach((v) => {
      if (v.schedules) {
        allSchedules.push(...v.schedules);
      }
    });

    onChange({
      venues: updatedVenues,
      venue_name: firstVenue?.venue_name || '',
      city: firstVenue?.city || 'Jakarta Pusat',
      venue_address: firstVenue?.venue_address || '',
      cinema_partner: firstVenue?.cinema_partner || formData.cinema_partner,
      google_maps_url: firstVenue?.google_maps_url || '',
      schedules: allSchedules,
    });
  };

  const handleUpdateSingleVenue = (index: number, fieldUpdates: Partial<EventVenueFormInput>) => {
    const nextVenues = [...venues];
    nextVenues[index] = { ...nextVenues[index], ...fieldUpdates };
    handleUpdateVenues(nextVenues);
  };

  const handleAddVenue = () => {
    const newIndex = venues.length;
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    const dateStr = defaultDate.toISOString().split('T')[0];

    const newUid = `venue-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newVenue: EventVenueFormInput = {
      client_uid: newUid,
      venue_name: '',
      city: 'Jakarta Pusat',
      venue_address: '',
      cinema_partner: formData.cinema_partner || 'Cinema XXI',
      google_maps_url: '',
      schedules: [
        {
          client_uid: `slot-${Date.now()}-1`,
          studio_name: 'Studio 1',
          show_time: `${dateStr}T19:30:00+07:00`,
          ticket_price: 65000,
          total_seats: 60,
          max_tickets_per_order: 6,
        },
      ],
    };

    setVenueStudios((prev) => ({
      ...prev,
      [newUid]: ['Studio 1'],
    }));

    handleUpdateVenues([...venues, newVenue]);
    setOpenVenueIndex(newIndex);
  };

  const handleRemoveVenue = (indexToRemove: number) => {
    if (venues.length <= 1) return;
    const nextVenues = venues.filter((_, idx) => idx !== indexToRemove);
    handleUpdateVenues(nextVenues);
    setOpenVenueIndex(Math.max(0, indexToRemove - 1));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-display text-sm font-bold text-white">
            Lokasi Bioskop & Jadwal Pemutaran (Multi-Venue Hub)
          </h3>
          <p className="mt-1 text-xs text-neutral-400">
            Daftarkan lokasi bioskop penayangan, studio auditorium, dan atur jam tayang secara
            terstruktur tanpa ambiguitas.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddVenue}
          className="inline-flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-600/10 px-3 py-1.5 text-xs font-bold text-blue-400 transition-colors hover:bg-blue-600/20"
        >
          <Plus className="h-3.5 w-3.5" />
          Tambah Lokasi Bioskop
        </button>
      </div>

      {/* Venues Stack */}
      <div className="space-y-4">
        {venues.map((venue, vIdx) => {
          const isOpen = openVenueIndex === vIdx;
          const venueSchedules = venue.schedules || [];
          const vKey = venue.client_uid || String(vIdx);

          // Ambil daftar studio terdaftar di bioskop ini (SSOT)
          const existingScheduleStudioNames = Array.from(
            new Set(venueSchedules.map((s) => s.studio_name || 'Studio 1'))
          );
          const currentTrackedStudios = venueStudios[vKey] || existingScheduleStudioNames;
          const finalStudioNames = Array.from(
            new Set([...currentTrackedStudios, ...existingScheduleStudioNames])
          );
          const activeStudioNames = finalStudioNames.length > 0 ? finalStudioNames : ['Studio 1'];

          const studioEntries = activeStudioNames.map((sName) => {
            const sItems = venueSchedules.filter((s) => (s.studio_name || 'Studio 1') === sName);
            return [sName, sItems] as [string, ShowtimeSlotInput[]];
          });

          return (
            <div
              key={venue.client_uid || venue.id || vIdx}
              className="overflow-hidden rounded-2xl border border-neutral-800 bg-[#0B0E14] transition-all"
            >
              {/* Venue Card Accordion Header */}
              <div
                className="flex cursor-pointer items-center justify-between border-b border-neutral-800/80 bg-[#0E121B] px-4 py-3 sm:px-5"
                onClick={() => setOpenVenueIndex(isOpen ? -1 : vIdx)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">
                        {venue.venue_name || `Lokasi Bioskop #${vIdx + 1}`}
                      </span>
                      <span className="rounded bg-neutral-800 px-2 py-0.5 text-[10px] text-neutral-400">
                        {venue.city || 'Kota Belum Dipilih'}
                      </span>
                      {venue.cinema_partner && (
                        <span className="hidden rounded bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-400 sm:inline-block">
                          {venue.cinema_partner}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-[11px] text-neutral-500">
                      {studioEntries.length} Studio • {venueSchedules.length} Sesi Jam Tayang
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {venues.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveVenue(vIdx);
                      }}
                      className="rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                      title="Hapus Lokasi Bioskop Ini"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}

                  <div className="rounded-lg p-1 text-neutral-400">
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </div>
              </div>

              {/* Venue Card Content (Expanded) */}
              {isOpen && (
                <div className="space-y-6 p-4 sm:p-6">
                  {/* Venue Metadata Inputs */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300">
                        Nama Tempat / Bioskop <span className="text-red-400">*</span>
                      </label>
                      <div className="relative mt-1.5">
                        <input
                          type="text"
                          required
                          value={venue.venue_name}
                          onChange={(e) =>
                            handleUpdateSingleVenue(vIdx, { venue_name: e.target.value })
                          }
                          placeholder="Contoh: Cinema XXI Plaza Senayan"
                          className="w-full rounded-xl border border-neutral-800 bg-[#0D111A] py-2 pl-9 pr-3.5 text-xs text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none"
                        />
                        <MapPin className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-500" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300">
                        Kota Penayangan <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        list={`cities-list-${vIdx}`}
                        required
                        value={venue.city}
                        onChange={(e) => handleUpdateSingleVenue(vIdx, { city: e.target.value })}
                        placeholder="Pilih atau ketik kota"
                        className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none"
                      />
                      <datalist id={`cities-list-${vIdx}`}>
                        {POPULAR_CITIES.map((c) => (
                          <option key={c} value={c} />
                        ))}
                      </datalist>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-neutral-300">
                        Tautan Google Maps
                      </label>
                      <input
                        type="url"
                        value={venue.google_maps_url || ''}
                        onChange={(e) =>
                          handleUpdateSingleVenue(vIdx, { google_maps_url: e.target.value })
                        }
                        placeholder="https://maps.google.com/?q=..."
                        className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-neutral-300">
                        Alamat Lengkap Bioskop <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={venue.venue_address}
                        onChange={(e) =>
                          handleUpdateSingleVenue(vIdx, { venue_address: e.target.value })
                        }
                        placeholder="Contoh: Plaza Senayan Lt. 3, Jl. Asia Afrika No.8, Gelora, Tanah Abang, Jakarta Pusat"
                        className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Sub-Section: Studio & Jam Tayang for This Venue */}
                  <div className="border-t border-neutral-800/80 pt-5">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                          Daftar Studio & Jam Tayang di {venue.venue_name || 'Bioskop Ini'}
                        </h4>
                        <p className="mt-0.5 text-[11px] text-neutral-400">
                          Setiap studio memiliki kapasitas dan tarif default untuk memudahkan input
                          jam tayang.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const currentStudios =
                            venueStudios[vKey] ||
                            Array.from(
                              new Set(venueSchedules.map((s) => s.studio_name || 'Studio 1'))
                            );
                          const newStudioName = `Studio ${currentStudios.length + 1}`;
                          setVenueStudios((prev) => ({
                            ...prev,
                            [vKey]: [...currentStudios, newStudioName],
                          }));
                          toast.success(
                            `${newStudioName} berhasil ditambahkan. Silakan atur jam tayang di studio ini.`
                          );
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-neutral-700 bg-neutral-800 px-2.5 py-1 text-[11px] font-bold text-white transition-colors hover:border-blue-500 hover:bg-neutral-700"
                      >
                        <Plus className="h-3 w-3" />
                        Tambah Studio Baru
                      </button>
                    </div>

                    {/* Studios Stack */}
                    <div className="space-y-4">
                      {studioEntries.map(([sName, sItems], stdIdx) => {
                        const firstItem = sItems[0];
                        const defaultPrice = firstItem?.ticket_price || 65000;
                        const studioKey = `${vIdx}__${sName}`;
                        const seatMapConfig = studioSeatMaps?.[studioKey];
                        const isGeneralAdmission = formData.seating_type === 'general_admission';
                        const defaultSeats = isGeneralAdmission
                          ? (firstItem?.total_seats ?? 100)
                          : seatMapConfig?.totalCapacity || firstItem?.total_seats || 60;

                        return (
                          <StudioScheduleCard
                            key={sName + stdIdx}
                            studioIndex={stdIdx}
                            studioName={sName}
                            defaultPrice={defaultPrice}
                            defaultSeats={defaultSeats}
                            seatingType={formData.seating_type}
                            schedules={sItems}
                            seatMapConfig={seatMapConfig}
                            canDelete={activeStudioNames.length > 1}
                            onOpenSeatMap={() => onNavigateToStudioSeatMap?.(studioKey)}
                            onUpdateStudio={(updates) => {
                              const targetName = updates.studioName || sName;
                              if (updates.studioName && updates.studioName !== sName) {
                                setVenueStudios((prev) => ({
                                  ...prev,
                                  [vKey]: (prev[vKey] || activeStudioNames).map((name) =>
                                    name === sName ? targetName : name
                                  ),
                                }));
                              }
                              const updatedScheds = venueSchedules.map((s) => {
                                if (s.studio_name === sName) {
                                  return {
                                    ...s,
                                    studio_name: targetName,
                                    ticket_price: updates.defaultPrice ?? s.ticket_price,
                                    total_seats: updates.defaultSeats ?? s.total_seats,
                                  };
                                }
                                return s;
                              });
                              handleUpdateSingleVenue(vIdx, { schedules: updatedScheds });
                            }}
                            onUpdateSchedule={(targetIdx, schedUpdates) => {
                              const targetItem = sItems[targetIdx];
                              const nextScheds = venueSchedules.map((s) => {
                                if (s === targetItem) {
                                  return { ...s, ...schedUpdates };
                                }
                                return s;
                              });
                              handleUpdateSingleVenue(vIdx, { schedules: nextScheds });
                            }}
                            onApplyDefaultsToAll={(appliedPrice, appliedSeats) => {
                              const vipSurcharge = seatMapConfig?.vipPriceSurcharge ?? 20000;
                              const hasVip =
                                !isGeneralAdmission && (seatMapConfig?.vipSeats?.length ?? 0) > 0;
                              const appliedVipPrice = hasVip
                                ? appliedPrice + vipSurcharge
                                : undefined;

                              const updatedScheds = venueSchedules.map((s) => {
                                if (s.studio_name === sName) {
                                  return {
                                    ...s,
                                    ticket_price: appliedPrice,
                                    ...(hasVip ? { vip_ticket_price: appliedVipPrice } : {}),
                                    total_seats: isGeneralAdmission ? appliedSeats : s.total_seats,
                                  };
                                }
                                return s;
                              });
                              handleUpdateSingleVenue(vIdx, { schedules: updatedScheds });
                              toast.success(
                                `Tarif dan kuota berhasil diterapkan ke seluruh sesi jam tayang.`
                              );
                            }}
                            onDeleteStudio={() => {
                              // 1. Hapus dari tracking nama studio
                              setVenueStudios((prev) => ({
                                ...prev,
                                [vKey]: (prev[vKey] || activeStudioNames).filter(
                                  (name) => name !== sName
                                ),
                              }));
                              // 2. Bersihkan jadwal yang ada di studio ini
                              const remaining = venueSchedules.filter(
                                (s) => s.studio_name !== sName
                              );
                              handleUpdateSingleVenue(vIdx, { schedules: remaining });
                              toast.info(`${sName} berhasil dihapus dari bioskop ini.`);
                            }}
                            onAddSchedule={(newSched) => {
                              handleUpdateSingleVenue(vIdx, {
                                schedules: [...venueSchedules, newSched],
                              });
                            }}
                            onRemoveSchedule={(targetIdx) => {
                              // Find corresponding index in venueSchedules
                              const targetItem = sItems[targetIdx];
                              const nextScheds = venueSchedules.filter((s) => s !== targetItem);
                              handleUpdateSingleVenue(vIdx, { schedules: nextScheds });
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Button to Add More Venues */}
      <button
        type="button"
        onClick={handleAddVenue}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-neutral-800 bg-[#0B0E14]/50 py-3.5 text-xs font-bold text-neutral-400 transition-colors hover:border-blue-500/50 hover:bg-blue-600/5 hover:text-blue-400"
      >
        <Plus className="h-4 w-4" />
        Tambah Lokasi Bioskop / Venue Baru
      </button>
    </div>
  );
}
