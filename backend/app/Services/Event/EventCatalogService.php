<?php

namespace App\Services\Event;

use App\Exceptions\Events\EventNotFoundException;
use App\Models\Event;
use App\Models\EventVenue;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;

class EventCatalogService
{
    /**
     * Pemetaan nama ramah pengguna untuk format acara (event_type).
     *
     * @var array<string, string>
     */
    public const EVENT_TYPE_LABELS = [
        'regular' => 'Screening Komunitas',
    ];

    /**
     * Mengambil daftar event aktif dengan filter kota, tipe format acara, kata kunci pencarian,
     * dan paginasi standar. Menggunakan eager loading terbatas untuk mencegah N+1 query.
     */
    public function getActiveEvents(
        ?string $city = null,
        ?string $eventType = null,
        ?string $search = null,
        int $perPage = 15
    ): LengthAwarePaginator {
        $query = Event::query()
            ->active()
            ->notConcluded()
            ->with([
                'venues',
                'schedules' => function ($q) {
                    $q->active()->orderBy('show_time', 'asc')->with([
                        'venue',
                        'seats' => function ($sq) {
                            $sq->select(['id', 'schedule_id', 'status']);
                        },
                        'seatLocks' => function ($lq) {
                            $lq->active()->select(['id', 'schedule_id', 'seat_id', 'quantity']);
                        },
                    ]);
                },
            ]);

        if (! empty($city)) {
            $query->city($city);
        }

        if (! empty($eventType)) {
            $query->where('event_type', $eventType);
        }

        $cleanSearch = trim((string) $search);
        if ($cleanSearch !== '') {
            $escapedTerm = addcslashes($cleanSearch, '%_\\');
            $searchSanitized = '%'.$escapedTerm.'%';
            $query->where(function ($q) use ($searchSanitized) {
                $q->where('title', 'like', $searchSanitized)
                    ->orWhere('venue_name', 'like', $searchSanitized)
                    ->orWhere('city', 'like', $searchSanitized)
                    ->orWhere('description', 'like', $searchSanitized)
                    ->orWhereHas('venues', function ($vq) use ($searchSanitized) {
                        $vq->where('venue_name', 'like', $searchSanitized)
                            ->orWhere('city', 'like', $searchSanitized)
                            ->orWhere('cinema_partner', 'like', $searchSanitized);
                    });
            });
        }

        return $query->orderBy('is_featured', 'desc')
            ->orderBy('id', 'desc')
            ->paginate($perPage);
    }

    /**
     * Mengambil detail lengkap satu event aktif berdasarkan ID atau slug unik.
     * Melempar ModelNotFoundException (HTTP 404) jika tidak ditemukan atau nonaktif.
     */
    public function getEventByIdOrSlug(string|int $idOrSlug): Event
    {
        $event = Event::query()
            ->active()
            ->with([
                'venues',
                'schedules' => function ($q) {
                    $q->active()->orderBy('show_time', 'asc')->with([
                        'venue',
                        'seats' => function ($sq) {
                            $sq->select(['id', 'schedule_id', 'status', 'seat_type']);
                        },
                        'seatLocks' => function ($lq) {
                            $lq->active()->select(['id', 'schedule_id', 'seat_id', 'quantity']);
                        },
                    ]);
                },
            ])
            ->where(function ($q) use ($idOrSlug) {
                if (is_numeric($idOrSlug)) {
                    $q->where('id', (int) $idOrSlug)->orWhere('slug', (string) $idOrSlug);
                } else {
                    $q->where('slug', (string) $idOrSlug);
                }
            })
            ->first();

        if (! $event) {
            throw new EventNotFoundException;
        }

        return $event;
    }

    /**
     * Mengambil daftar seluruh kota unik yang memiliki event screening aktif secara dinamis.
     *
     * @return array<int, string>
     */
    public function getActiveCities(): array
    {
        return Cache::remember('events:active_cities', 300, function () {
            $eventCities = Event::query()
                ->active()
                ->whereNotNull('city')
                ->where('city', '!=', '')
                ->distinct()
                ->pluck('city')
                ->all();

            $venueCities = EventVenue::query()
                ->whereHas('event', fn ($q) => $q->active())
                ->whereNotNull('city')
                ->where('city', '!=', '')
                ->distinct()
                ->pluck('city')
                ->all();

            $merged = array_unique(array_merge($eventCities, $venueCities));
            sort($merged);

            return array_values($merged);
        });
    }

    /**
     * Mengambil daftar format acara yang sedang aktif di database secara dinamis.
     * Hanya mengembalikan format yang memiliki minimal 1 event aktif.
     *
     * @return array<int, array{value: string, label: string, total_events: int}>
     */
    public function getActiveFormats(): array
    {
        return Cache::remember('events:active_formats', 300, function () {
            $typeCounts = Event::query()
                ->active()
                ->whereNotNull('event_type')
                ->selectRaw('event_type, COUNT(*) as total_events')
                ->groupBy('event_type')
                ->pluck('total_events', 'event_type')
                ->all();

            $formats = [];
            foreach (self::EVENT_TYPE_LABELS as $value => $label) {
                if (isset($typeCounts[$value])) {
                    $formats[] = [
                        'value' => (string) $value,
                        'label' => (string) $label,
                        'total_events' => (int) $typeCounts[$value],
                    ];
                }
            }

            return $formats;
        });
    }
}
