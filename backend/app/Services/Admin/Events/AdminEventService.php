<?php

namespace App\Services\Admin\Events;

use App\Models\Banner;
use App\Models\Event;
use App\Models\EventTransaction;
use App\Models\EventVenue;
use App\Models\Schedule;
use App\Models\SeatLock;
use DomainException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AdminEventService
{
    public function __construct(
        protected AdminScheduleSeatService $scheduleSeatService
    ) {}

    /**
     * Mengambil daftar event untuk manajemen admin dengan filter pencarian dan paginasi.
     *
     * @param  array<string, mixed>  $filters
     */
    public function listEvents(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Event::query()
            ->withSum('schedules as total_capacity', 'total_seats')
            ->withSum(['eventTransactions as total_booked' => function ($q) {
                $q->where('payment_status', 'paid');
            }], 'ticket_quantity')
            ->withSum(['seatLocks as total_locked' => function ($q) {
                $q->where('expires_at', '>', now());
            }], 'quantity')
            ->with([
                'venues',
                'schedules' => function ($sq) {
                    $sq->with('venue')
                        ->withSum(['eventTransactions as booked_tickets_count' => function ($tq) {
                            $tq->where('payment_status', 'paid');
                        }], 'ticket_quantity')
                        ->withSum(['seatLocks as locked_seats_count' => function ($lq) {
                            $lq->where('expires_at', '>', now());
                        }], 'quantity');
                },
            ]);

        // Filter pencarian teks bebas (judul, venue, kota)
        if (! empty($filters['search'])) {
            $search = (string) $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('venue_name', 'like', "%{$search}%")
                    ->orWhere('city', 'like', "%{$search}%")
                    ->orWhereHas('venues', function ($vq) use ($search) {
                        $vq->where('venue_name', 'like', "%{$search}%")
                            ->orWhere('city', 'like', "%{$search}%")
                            ->orWhere('cinema_partner', 'like', "%{$search}%");
                    });
            });
        }

        // Filter tipe penayangan (regular / presale_cinema)
        $eventType = $filters['event_type'] ?? $filters['type'] ?? null;
        if (! empty($eventType) && $eventType !== 'all') {
            $query->where('event_type', $eventType);
        }

        // Filter tipe tempat duduk (assigned_seating / general_admission)
        if (! empty($filters['seating_type']) && $filters['seating_type'] !== 'all') {
            $query->where('seating_type', $filters['seating_type']);
        }

        // Filter kota
        if (! empty($filters['city']) && $filters['city'] !== 'all') {
            $query->where('city', $filters['city']);
        }

        // Filter status publikasi (published/live vs draft)
        if (isset($filters['status']) && $filters['status'] !== 'all') {
            $status = (string) $filters['status'];
            if ($status === 'published' || $status === 'live') {
                $query->where('is_active', true);
            } elseif ($status === 'draft') {
                $query->where('is_active', false);
            }
        }

        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }

    /**
     * Mengambil model event tunggal berdasarkan ID beserta jadwal penayangan.
     */
    public function getEventById(int $id): Event
    {
        return Event::query()
            ->with(['venues', 'schedules.venue', 'schedules.seats', 'schedules.eventTransactions'])
            ->findOrFail($id);
    }

    /**
     * Membuat event baru dan mengunggah poster serta backdrop ke storage Cloudflare R2.
     *
     * @param  array<string, mixed>  $data
     */
    public function createEvent(array $data, ?UploadedFile $poster = null, ?UploadedFile $backdrop = null): Event
    {
        return DB::transaction(function () use ($data, $poster, $backdrop) {
            // Generate slug unik jika tidak disertakan
            $slug = ! empty($data['slug']) ? Str::slug($data['slug']) : Str::slug($data['title']);
            $originalSlug = $slug;
            while (Event::where('slug', $slug)->exists()) {
                $slug = "{$originalSlug}-".Str::lower(Str::random(4));
            }
            $data['slug'] = $slug;

            // Upload poster portrait ke R2 atau simpan poster_url langsung
            if ($poster) {
                $posterPath = $poster->store('events/posters', 'r2');
                $data['poster_path'] = $posterPath;
            } elseif (! empty($data['poster_url'])) {
                $data['poster_path'] = $data['poster_url'];
            }

            // Upload backdrop landscape ke R2 atau simpan backdrop_url langsung
            if ($backdrop) {
                $backdropPath = $backdrop->store('events/backdrops', 'r2');
                $data['backdrop_path'] = $backdropPath;
            } elseif (! empty($data['backdrop_url'])) {
                $data['backdrop_path'] = $data['backdrop_url'];
            }

            $venues = $data['venues'] ?? null;
            unset($data['venues'], $data['poster_url'], $data['backdrop_url']);

            $event = Event::create($data);

            if (! empty($venues) && is_array($venues)) {
                foreach ($venues as $venueData) {
                    $schedules = $venueData['schedules'] ?? [];
                    $venueAttributes = Arr::except($venueData, ['schedules', 'client_uid', 'id']);
                    /** @var EventVenue $venue */
                    $venue = $event->venues()->create($venueAttributes);

                    if (! empty($schedules) && is_array($schedules)) {
                        foreach ($schedules as $sched) {
                            $seatMapConfig = $sched['seat_map_config'] ?? null;
                            $schedAttributes = Arr::except($sched, ['id', 'client_uid', 'seat_map_config']);
                            $schedAttributes['event_id'] = $event->id;
                            $schedAttributes['event_venue_id'] = $venue->id;
                            if (empty($schedAttributes['studio_name'])) {
                                $schedAttributes['studio_name'] = 'Studio 1';
                            }
                            /** @var Schedule $createdSched */
                            $createdSched = $event->schedules()->create($schedAttributes);
                            $this->syncScheduleSeats($createdSched, $seatMapConfig, (string) $event->seating_type);
                        }
                    }
                }
            } elseif (! empty($event->venue_name)) {
                $event->venues()->create([
                    'venue_name' => $event->venue_name,
                    'cinema_partner' => $event->cinema_partner,
                    'venue_address' => $event->venue_address ?? '-',
                    'city' => $event->city ?? 'Jakarta',
                ]);
            }

            return $event->fresh(['venues', 'schedules.venue', 'schedules.seats', 'schedules.eventTransactions']);
        });
    }

    /**
     * Memperbarui metadata event dan mengganti file poster/backdrop di R2 jika ada file baru.
     *
     * @param  array<string, mixed>  $data
     */
    public function updateEvent(Event $event, array $data, ?UploadedFile $poster = null, ?UploadedFile $backdrop = null): Event
    {
        return DB::transaction(function () use ($event, $data, $poster, $backdrop) {
            if ($poster) {
                if (! empty($event->poster_path) && Storage::disk('r2')->exists($event->poster_path)) {
                    Storage::disk('r2')->delete($event->poster_path);
                }
                $data['poster_path'] = $poster->store('events/posters', 'r2');
            } elseif (array_key_exists('poster_url', $data)) {
                $data['poster_path'] = ! empty($data['poster_url']) ? $data['poster_url'] : null;
            }

            if ($backdrop) {
                if (! empty($event->backdrop_path) && Storage::disk('r2')->exists($event->backdrop_path)) {
                    Storage::disk('r2')->delete($event->backdrop_path);
                }
                $data['backdrop_path'] = $backdrop->store('events/backdrops', 'r2');
            } elseif (array_key_exists('backdrop_url', $data)) {
                $data['backdrop_path'] = ! empty($data['backdrop_url']) ? $data['backdrop_url'] : null;
            }

            $venues = $data['venues'] ?? null;
            unset($data['venues'], $data['poster_url'], $data['backdrop_url']);

            $event->update($data);

            if (! empty($venues) && is_array($venues)) {
                $retainedVenueIds = [];

                foreach ($venues as $venueData) {
                    $schedules = $venueData['schedules'] ?? null;
                    $venueAttributes = Arr::except($venueData, ['schedules', 'client_uid', 'id', 'event_id']);

                    if (! empty($venueData['id'])) {
                        $venue = $event->venues()->where('id', $venueData['id'])->first();
                        if ($venue) {
                            $venue->update($venueAttributes);
                        } else {
                            $venue = $event->venues()->create($venueAttributes);
                        }
                    } else {
                        $venue = $event->venues()->create($venueAttributes);
                    }

                    $retainedVenueIds[] = $venue->id;

                    // Sinkronisasi schedules untuk venue ini jika disertakan
                    if ($schedules !== null && is_array($schedules)) {
                        $retainedScheduleIds = [];

                        foreach ($schedules as $sched) {
                            $seatMapConfig = $sched['seat_map_config'] ?? null;
                            $schedAttributes = Arr::except($sched, ['client_uid', 'seat_map_config']);
                            $schedAttributes['event_id'] = $event->id;
                            $schedAttributes['event_venue_id'] = $venue->id;
                            if (empty($schedAttributes['studio_name'])) {
                                $schedAttributes['studio_name'] = 'Studio 1';
                            }

                            if (! empty($sched['id'])) {
                                $existingSched = $event->schedules()->where('id', $sched['id'])->first();
                                if ($existingSched) {
                                    $existingSched->update(Arr::except($schedAttributes, ['id', 'event_id']));
                                    $this->syncScheduleSeats($existingSched, $seatMapConfig, (string) $event->seating_type);
                                    $retainedScheduleIds[] = $existingSched->id;

                                    continue;
                                }
                            }

                            /** @var Schedule $newSched */
                            $newSched = $event->schedules()->create(Arr::except($schedAttributes, ['id']));
                            $this->syncScheduleSeats($newSched, $seatMapConfig, (string) $event->seating_type);
                            $retainedScheduleIds[] = $newSched->id;
                        }

                        // Hapus schedule lama pada venue ini yang tidak ada di payload (jika belum ada tiket paid)
                        $staleSchedules = $event->schedules()
                            ->where('event_venue_id', $venue->id)
                            ->whereNotIn('id', $retainedScheduleIds)
                            ->get();

                        foreach ($staleSchedules as $staleSched) {
                            $hasPaidTickets = EventTransaction::where('schedule_id', $staleSched->id)
                                ->where('payment_status', 'paid')
                                ->exists();

                            if (! $hasPaidTickets) {
                                $staleSched->seats()->delete();
                                $staleSched->delete();
                            }
                        }
                    }
                }

                // Hapus venue lama yang tidak diikutsertakan di payload (jika aman)
                $staleVenues = $event->venues()->whereNotIn('id', $retainedVenueIds)->get();
                foreach ($staleVenues as $staleVenue) {
                    $hasPaidTickets = EventTransaction::whereHas('schedule', function ($q) use ($staleVenue) {
                        $q->where('event_venue_id', $staleVenue->id);
                    })->where('payment_status', 'paid')->exists();

                    if (! $hasPaidTickets) {
                        // Hapus schedules dan seats terkait
                        foreach ($staleVenue->schedules as $vs) {
                            $vs->seats()->delete();
                            $vs->delete();
                        }
                        $staleVenue->delete();
                    }
                }
            }

            // Selaraskan data banner terkait jika ada perubahan judul/sinopsis/metadata event
            $this->syncLinkedBanners($event);

            return $event->fresh(['venues', 'schedules.venue', 'schedules.seats', 'schedules.eventTransactions']);
        });
    }

    /**
     * Menyelaraskan data banner beranda (title, sinopsis/subtitle, metadata karya)
     * yang menautkan event ini agar terhindar dari inkonsistensi data atau UX flaw.
     */
    protected function syncLinkedBanners(Event $event): void
    {
        $banners = Banner::where('event_id', $event->id)->get();
        if ($banners->isEmpty()) {
            return;
        }

        $genreString = is_array($event->genre)
            ? implode(', ', array_filter(array_map('trim', $event->genre)))
            : (string) ($event->genre ?? '');

        foreach ($banners as $banner) {
            $isSpotlight = in_array($banner->display_mode, ['spotlight', 'movie_spotlight', 'sorotan'], true);

            $updatePayload = [
                'age_rating' => $event->age_rating,
                'genre' => ! empty($genreString) ? $genreString : null,
                'release_year' => $event->release_year ? (int) $event->release_year : null,
                'duration_minutes' => $event->duration_minutes ? (int) $event->duration_minutes : null,
            ];

            if ($isSpotlight || empty($banner->title)) {
                $updatePayload['title'] = $event->title;
            }

            if ($isSpotlight || empty($banner->subtitle)) {
                if (! empty($event->synopsis_short)) {
                    $updatePayload['subtitle'] = $event->synopsis_short;
                }
            }

            $banner->update($updatePayload);
        }
    }

    /**
     * Sinkronisasi physical seats untuk jadwal penayangan (Assigned Seating).
     * Menerapkan Enterprise Guard: Idempoten untuk update tanpa perubahan denah,
     * dan melempar DomainException eksplisit jika mencoba mengubah denah sesi yang telah memiliki tiket terjual.
     *
     * @param  array<string, mixed>|null  $seatMapConfig
     *
     * @throws DomainException
     */
    private function syncScheduleSeats(Schedule $schedule, ?array $seatMapConfig, string $seatingType): void
    {
        if ($seatingType !== 'assigned_seating') {
            return;
        }

        $hasSeats = $schedule->seats()->exists();
        $paidTransactions = EventTransaction::where('schedule_id', $schedule->id)
            ->where('payment_status', 'paid')
            ->get();
        $hasPaidTickets = $paidTransactions->isNotEmpty();

        // 1. Enterprise Lock Guard: Jika schedule sudah memiliki kursi dan ada tiket terjual (paid)
        if ($hasSeats && $hasPaidTickets) {
            // Jika payload tidak mengirim seatMapConfig, pertahankan denah eksisting tanpa mutasi
            if (empty($seatMapConfig) || empty($seatMapConfig['rows']) || empty($seatMapConfig['columns'])) {
                return;
            }

            // Jika seatMapConfig identik (misal admin menyimpan perubahan umum tanpa mengutak-atik denah studio ini), izinkan (idempotent)
            if ($this->scheduleSeatService->isSeatMapConfigIdentical($schedule, $seatMapConfig)) {
                return;
            }

            // Jika seatMapConfig BERUBAH padahal sudah ada tiket paid: TOLAK EKSPLISIT DENGAN PENJELASAN AKURAT!
            $paidSeatCodes = [];
            foreach ($paidTransactions as $pt) {
                if (! empty($pt->snapshot_seats) && is_array($pt->snapshot_seats)) {
                    $paidSeatCodes = array_merge($paidSeatCodes, $pt->snapshot_seats);
                }
            }
            $paidSeatCodes = array_values(array_unique($paidSeatCodes));
            sort($paidSeatCodes);
            $seatListStr = count($paidSeatCodes) > 0 ? ' (Kursi: '.implode(', ', $paidSeatCodes).')' : '';
            $paidCount = $paidTransactions->count();

            throw new DomainException(
                "Denah kursi {$schedule->studio_name} terkunci dan tidak dapat diubah karena telah memiliki {$paidCount} tiket terjual{$seatListStr}. Silakan batalkan transaksi terkait terlebih dahulu jika ingin merombak denah."
            );
        }

        // 2. Jika belum ada tiket paid:
        // Jika seatMapConfig disediakan dan aman di-generate
        if (! empty($seatMapConfig) && ! empty($seatMapConfig['rows']) && ! empty($seatMapConfig['columns'])) {
            // Cek idempotensi: jika konfigurasi denah identik dengan yang ada di DB, lewati agar zero bottleneck
            if ($hasSeats && $this->scheduleSeatService->isSeatMapConfigIdentical($schedule, $seatMapConfig)) {
                return;
            }

            // Hapus temporary / stale seat locks sebelum regenerasi agar tidak ada orphaned lock
            SeatLock::where('schedule_id', $schedule->id)->delete();

            $this->scheduleSeatService->generateSeatsGrid($schedule, $seatMapConfig);

            return;
        }

        // 3. Jika belum ada denah kursi sama sekali untuk schedule ini, buat default grid (6 baris x 10 kolom = 60 kursi)
        if (! $hasSeats) {
            $this->scheduleSeatService->generateSeatsGrid($schedule, [
                'rows' => 6,
                'columns' => 10,
                'vip_seats' => [],
                'aisle_seats' => [],
                'disabled_seats' => [],
            ]);
        }
    }

    /**
     * Menghapus event secara permanen jika belum ada transaksi tiket lunas.
     * Menjaga integritas finansial dan jejak audit tiket.
     *
     * @throws DomainException
     */
    public function deleteEvent(Event $event): bool
    {
        return DB::transaction(function () use ($event) {
            $hasPaidTickets = EventTransaction::whereHas('schedule', function ($q) use ($event) {
                $q->where('event_id', $event->id);
            })->where('payment_status', 'paid')->exists();

            if ($hasPaidTickets) {
                throw new DomainException('Event tidak dapat dihapus karena telah memiliki transaksi tiket terjual. Silakan ubah status event menjadi Draf jika ingin menutup penjualan.');
            }

            $hasPendingTickets = EventTransaction::whereHas('schedule', function ($q) use ($event) {
                $q->where('event_id', $event->id);
            })->where('payment_status', 'pending')->exists();

            if ($hasPendingTickets) {
                throw new DomainException('Event tidak dapat dihapus karena terdapat transaksi pemesanan tiket yang sedang berlangsung.');
            }

            // Hapus file media di disk R2
            if (! empty($event->poster_path) && Storage::disk('r2')->exists($event->poster_path)) {
                Storage::disk('r2')->delete($event->poster_path);
            }

            if (! empty($event->backdrop_path) && Storage::disk('r2')->exists($event->backdrop_path)) {
                Storage::disk('r2')->delete($event->backdrop_path);
            }

            return (bool) $event->delete();
        });
    }
}
