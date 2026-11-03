<?php

namespace App\Services\Admin\Dashboard;

use App\Models\Event;
use App\Models\EventTransaction;
use App\Models\Movie;
use App\Models\MovieTransaction;
use App\Models\Schedule;
use App\Models\UserMovieAccess;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class DashboardAnalyticsService
{
    /**
     * Cache key untuk statistik dashboard admin.
     */
    public const CACHE_KEY = 'admin:dashboard:stats';

    /**
     * Durasi cache statistik dalam detik (10 menit).
     */
    public const CACHE_TTL_SECONDS = 600;

    /**
     * Mengambil seluruh statistik ringkasan eksekutif dan KPI dashboard admin.
     *
     * @param  bool  $fresh  Paksa bypass cache dan hitung ulang dari database.
     * @param  string  $period  Periode analitik ('today', '7d', '30d', 'year').
     * @return array<string, mixed>
     */
    public function getDashboardStats(
        bool $fresh = false,
        string $period = '7d',
        ?string $startDateParam = null,
        ?string $endDateParam = null
    ): array {
        $cacheKey = ($startDateParam || $endDateParam)
            ? self::CACHE_KEY.":{$period}:{$startDateParam}:{$endDateParam}"
            : self::CACHE_KEY.":{$period}";

        if ($fresh) {
            Cache::forget($cacheKey);
            $this->clearDashboardCache();
        }

        return Cache::remember($cacheKey, self::CACHE_TTL_SECONDS, function () use ($period, $startDateParam, $endDateParam) {
            return $this->computeStats($period, $startDateParam, $endDateParam);
        });
    }

    /**
     * Menghapus cache dashboard admin untuk semua periode.
     */
    public function clearDashboardCache(): void
    {
        Cache::forget(self::CACHE_KEY);
        Cache::forget(self::CACHE_KEY.':today');
        Cache::forget(self::CACHE_KEY.':7d');
        Cache::forget(self::CACHE_KEY.':30d');
        Cache::forget(self::CACHE_KEY.':year');
    }

    /**
     * Melakukan komputasi agregasi statistik dari database berdasarkan periode.
     *
     * @return array<string, mixed>
     */
    protected function computeStats(
        string $period = '7d',
        ?string $startDateParam = null,
        ?string $endDateParam = null
    ): array {
        ['startDate' => $startDate, 'endDate' => $endDate] = $this->resolvePeriodDates($period, $startDateParam, $endDateParam);

        // 1. Agregasi Pendapatan Tiket Bioskop (Event Transactions)
        $eventStats = EventTransaction::query()
            ->where('payment_status', 'paid')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('
                COALESCE(SUM(gross_amount), 0) as gross_total,
                COALESCE(SUM(discount_amount), 0) as discount_total,
                COALESCE(SUM(net_amount), 0) as net_total,
                COALESCE(SUM(ticket_quantity), 0) as tickets_total
            ')
            ->first();

        $eventGross = (float) ($eventStats->gross_total ?? 0);
        $eventDiscount = (float) ($eventStats->discount_total ?? 0);
        $eventNet = (float) ($eventStats->net_total ?? 0);
        $totalTicketsSold = (int) ($eventStats->tickets_total ?? 0);

        // 2. Agregasi Pendapatan Sewa VoD (Movie Transactions)
        $movieStats = MovieTransaction::query()
            ->where('payment_status', 'paid')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('
                COALESCE(SUM(gross_amount), 0) as gross_total,
                COALESCE(SUM(discount_amount), 0) as discount_total,
                COALESCE(SUM(net_amount), 0) as net_total
            ')
            ->first();

        $movieGross = (float) ($movieStats->gross_total ?? 0);
        $movieDiscount = (float) ($movieStats->discount_total ?? 0);
        $movieNet = (float) ($movieStats->net_total ?? 0);

        // 3. Omzet Konsolidasi (Tiket + VoD)
        $grossRevenue = $eventGross + $movieGross;
        $totalDiscount = $eventDiscount + $movieDiscount;
        $netRevenue = $eventNet + $movieNet;
        $totalRevenue = $netRevenue;

        // 4. Katalog & Operasional
        $activeMoviesCount = Movie::published()->count();

        $upcomingEventsCount = Event::query()
            ->where('is_active', true)
            ->where(function ($query) {
                $query->whereHas('schedules', function ($scheduleQuery) {
                    $scheduleQuery->where('show_time', '>=', now());
                })->orDoesntHave('schedules');
            })
            ->count();

        $activeVodRentalsCount = UserMovieAccess::active()->count();

        // 5. Presale Fulfillment Alert: Tiket bioskop yang menunggu injeksi tiket
        $pendingPresaleCount = EventTransaction::query()
            ->where('payment_status', 'paid')
            ->where('fulfillment_status', 'awaiting_cinema_ticket')
            ->count();

        // 6. Okupansi Rata-Rata Kursi
        $totalSeatsCapacity = (int) Schedule::query()
            ->where('is_active', true)
            ->sum('total_seats');

        $averageOccupancyPercentage = $totalSeatsCapacity > 0
            ? round(($totalTicketsSold / $totalSeatsCapacity) * 100, 2)
            : 0.0;

        // 7. 5 Transaksi Terakhir (Event & VoD)
        $recentTransactions = $this->getRecentTransactions(5);

        return [
            // Kontrak SSOT Wajib (contracts/admin.contract.json)
            'total_revenue' => $totalRevenue,
            'formatted_total_revenue' => $this->formatRupiah($totalRevenue),
            'total_tickets_sold' => $totalTicketsSold,
            'active_movies_count' => $activeMoviesCount,
            'upcoming_events_count' => $upcomingEventsCount,

            // Rincian Eksekutif Tambahan (docs/05-Admin-Studio/01-Overview-and-Navigation.md)
            'gross_revenue' => $grossRevenue,
            'formatted_gross_revenue' => $this->formatRupiah($grossRevenue),
            'net_revenue' => $netRevenue,
            'formatted_net_revenue' => $this->formatRupiah($netRevenue),
            'total_discount' => $totalDiscount,
            'formatted_total_discount' => $this->formatRupiah($totalDiscount),
            'breakdown' => [
                'tickets' => [
                    'gross_revenue' => $eventGross,
                    'formatted_gross_revenue' => $this->formatRupiah($eventGross),
                    'net_revenue' => $eventNet,
                    'formatted_net_revenue' => $this->formatRupiah($eventNet),
                    'discount_amount' => $eventDiscount,
                    'formatted_discount_amount' => $this->formatRupiah($eventDiscount),
                    'tickets_sold' => $totalTicketsSold,
                ],
                'vod' => [
                    'gross_revenue' => $movieGross,
                    'formatted_gross_revenue' => $this->formatRupiah($movieGross),
                    'net_revenue' => $movieNet,
                    'formatted_net_revenue' => $this->formatRupiah($movieNet),
                    'discount_amount' => $movieDiscount,
                    'formatted_discount_amount' => $this->formatRupiah($movieDiscount),
                    'active_rentals' => $activeVodRentalsCount,
                ],
            ],
            'active_vod_rentals' => $activeVodRentalsCount,
            'presale_fulfillment_alert' => [
                'pending_count' => $pendingPresaleCount,
                'has_pending' => $pendingPresaleCount > 0,
                'message' => $pendingPresaleCount > 0
                    ? "{$pendingPresaleCount} pesanan presale menunggu injeksi tiket bioskop."
                    : 'Semua pesanan presale telah terpenuhi.',
            ],
            'average_seat_occupancy' => [
                'total_capacity' => $totalSeatsCapacity,
                'sold_count' => $totalTicketsSold,
                'occupancy_percentage' => $averageOccupancyPercentage,
                'formatted_percentage' => $averageOccupancyPercentage.'%',
            ],
            'top_performers' => $this->getTopPerformers($period, 5, $startDateParam, $endDateParam),
            'recent_orders' => $recentTransactions,
            'revenue_trends' => $this->computeRevenueTrends($period),
        ];
    }

    /**
     * Menghasilkan data point tren omzet dan kuantitas tiket untuk grafik analitik.
     *
     * @return array<int, array<string, mixed>>
     */
    protected function computeRevenueTrends(string $period): array
    {
        $trends = [];

        if ($period === 'today') {
            $hours = [10, 13, 16, 19, 22];
            foreach ($hours as $hour) {
                $timeStart = now()->startOfDay()->addHours($hour - 3);
                $timeEnd = now()->startOfDay()->addHours($hour);

                $eventTxs = EventTransaction::query()
                    ->where('payment_status', 'paid')
                    ->whereBetween('created_at', [$timeStart, $timeEnd])
                    ->selectRaw('COALESCE(SUM(net_amount), 0) as rev, COALESCE(SUM(ticket_quantity), 0) as qty')
                    ->first();

                $movieTxs = MovieTransaction::query()
                    ->where('payment_status', 'paid')
                    ->whereBetween('created_at', [$timeStart, $timeEnd])
                    ->selectRaw('COALESCE(SUM(net_amount), 0) as rev, COUNT(*) as qty')
                    ->first();

                $eRev = (float) ($eventTxs->rev ?? 0);
                $mRev = (float) ($movieTxs->rev ?? 0);
                $eQty = (int) ($eventTxs->qty ?? 0);
                $mQty = (int) ($movieTxs->qty ?? 0);

                $label = sprintf('%02d:00', $hour);
                $trends[] = [
                    'date' => now()->format('Y-m-d').' '.$label,
                    'label' => $label,
                    'cinema_ticket_revenue' => $eRev,
                    'vod_rental_revenue' => $mRev,
                    'total_revenue' => $eRev + $mRev,
                    'cinema_tickets_sold' => $eQty,
                    'vod_rentals_sold' => $mQty,
                ];
            }

            return $trends;
        }

        if ($period === '30d') {
            for ($week = 4; $week >= 1; $week--) {
                $start = now()->subDays($week * 7)->startOfDay();
                $end = now()->subDays(($week - 1) * 7)->endOfDay();

                $eventTxs = EventTransaction::query()
                    ->where('payment_status', 'paid')
                    ->whereBetween('created_at', [$start, $end])
                    ->selectRaw('COALESCE(SUM(net_amount), 0) as rev, COALESCE(SUM(ticket_quantity), 0) as qty')
                    ->first();

                $movieTxs = MovieTransaction::query()
                    ->where('payment_status', 'paid')
                    ->whereBetween('created_at', [$start, $end])
                    ->selectRaw('COALESCE(SUM(net_amount), 0) as rev, COUNT(*) as qty')
                    ->first();

                $eRev = (float) ($eventTxs->rev ?? 0);
                $mRev = (float) ($movieTxs->rev ?? 0);
                $eQty = (int) ($eventTxs->qty ?? 0);
                $mQty = (int) ($movieTxs->qty ?? 0);

                $weekNum = 5 - $week;
                $trends[] = [
                    'date' => $start->format('Y-m-d'),
                    'label' => "Minggu {$weekNum}",
                    'cinema_ticket_revenue' => $eRev,
                    'vod_rental_revenue' => $mRev,
                    'total_revenue' => $eRev + $mRev,
                    'cinema_tickets_sold' => $eQty,
                    'vod_rentals_sold' => $mQty,
                ];
            }

            return $trends;
        }

        if ($period === 'year') {
            $monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
            $currentMonth = (int) now()->format('n');

            for ($m = 1; $m <= $currentMonth; $m++) {
                $start = now()->setMonth($m)->startOfMonth();
                $end = now()->setMonth($m)->endOfMonth();

                $eventTxs = EventTransaction::query()
                    ->where('payment_status', 'paid')
                    ->whereBetween('created_at', [$start, $end])
                    ->selectRaw('COALESCE(SUM(net_amount), 0) as rev, COALESCE(SUM(ticket_quantity), 0) as qty')
                    ->first();

                $movieTxs = MovieTransaction::query()
                    ->where('payment_status', 'paid')
                    ->whereBetween('created_at', [$start, $end])
                    ->selectRaw('COALESCE(SUM(net_amount), 0) as rev, COUNT(*) as qty')
                    ->first();

                $eRev = (float) ($eventTxs->rev ?? 0);
                $mRev = (float) ($movieTxs->rev ?? 0);
                $eQty = (int) ($eventTxs->qty ?? 0);
                $mQty = (int) ($movieTxs->qty ?? 0);

                $trends[] = [
                    'date' => $start->format('Y-m'),
                    'label' => $monthNames[$m - 1] ?? (string) $m,
                    'cinema_ticket_revenue' => $eRev,
                    'vod_rental_revenue' => $mRev,
                    'total_revenue' => $eRev + $mRev,
                    'cinema_tickets_sold' => $eQty,
                    'vod_rentals_sold' => $mQty,
                ];
            }

            return $trends;
        }

        // Default '7d'
        $dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $start = $date->copy()->startOfDay();
            $end = $date->copy()->endOfDay();

            $eventTxs = EventTransaction::query()
                ->where('payment_status', 'paid')
                ->whereBetween('created_at', [$start, $end])
                ->selectRaw('COALESCE(SUM(net_amount), 0) as rev, COALESCE(SUM(ticket_quantity), 0) as qty')
                ->first();

            $movieTxs = MovieTransaction::query()
                ->where('payment_status', 'paid')
                ->whereBetween('created_at', [$start, $end])
                ->selectRaw('COALESCE(SUM(net_amount), 0) as rev, COUNT(*) as qty')
                ->first();

            $eRev = (float) ($eventTxs->rev ?? 0);
            $mRev = (float) ($movieTxs->rev ?? 0);
            $eQty = (int) ($eventTxs->qty ?? 0);
            $mQty = (int) ($movieTxs->qty ?? 0);

            $dayOfWeek = (int) $date->format('w');
            $trends[] = [
                'date' => $date->format('Y-m-d'),
                'label' => $dayNames[$dayOfWeek] ?? $date->format('D'),
                'cinema_ticket_revenue' => $eRev,
                'vod_rental_revenue' => $mRev,
                'total_revenue' => $eRev + $mRev,
                'cinema_tickets_sold' => $eQty,
                'vod_rentals_sold' => $mQty,
            ];
        }

        return $trends;
    }

    /**
     * Mengambil daftar transaksi terbaru lintas domain (Tiket & VoD).
     *
     * @return array<int, array<string, mixed>>
     */
    protected function getRecentTransactions(int $limit = 5): array
    {
        $eventOrders = EventTransaction::query()
            ->with(['user:id,name,email,phone_number', 'schedule.event:id,title,venue_name'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($tx) {
                /** @var EventTransaction $tx */
                return [
                    'id' => $tx->id,
                    'order_id' => $tx->order_id,
                    'order_type' => 'ticket',
                    'user_name' => $tx->user->name ?? 'Guest',
                    'user_email' => $tx->user->email ?? '-',
                    'user_phone' => $tx->user->phone_number ?? null,
                    'buyer_name' => $tx->user->name ?? 'Guest',
                    'buyer_email' => $tx->user->email ?? '-',
                    'item_title' => $tx->schedule?->event?->title ?? ($tx->snapshot_event_data['title'] ?? 'Tiket Bioskop'),
                    'venue_name' => $tx->schedule?->event?->venue_name ?? ($tx->snapshot_event_data['venue_name'] ?? null),
                    'gross_amount' => (float) $tx->gross_amount,
                    'discount_amount' => (float) $tx->discount_amount,
                    'net_amount' => (float) $tx->net_amount,
                    'formatted_net_amount' => $this->formatRupiah((float) $tx->net_amount),
                    'payment_status' => $tx->payment_status,
                    'payment_type' => $tx->payment_type ?? null,
                    'fulfillment_status' => $tx->fulfillment_status,
                    'paid_at' => $tx->paid_at?->toISOString(),
                    'created_at' => $tx->created_at?->toISOString(),
                ];
            });

        $movieOrders = MovieTransaction::query()
            ->with(['user:id,name,email,phone_number', 'movie:id,title'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($tx) {
                /** @var MovieTransaction $tx */
                return [
                    'id' => $tx->id,
                    'order_id' => $tx->order_id,
                    'order_type' => 'movie_rental',
                    'user_name' => $tx->user->name ?? 'Guest',
                    'user_email' => $tx->user->email ?? '-',
                    'user_phone' => $tx->user->phone_number ?? null,
                    'buyer_name' => $tx->user->name ?? 'Guest',
                    'buyer_email' => $tx->user->email ?? '-',
                    'item_title' => $tx->movie?->title ?? ($tx->snapshot_movie_data['title'] ?? 'Sewa Film VoD'),
                    'venue_name' => null,
                    'gross_amount' => (float) $tx->gross_amount,
                    'discount_amount' => (float) $tx->discount_amount,
                    'net_amount' => (float) $tx->net_amount,
                    'formatted_net_amount' => $this->formatRupiah((float) $tx->net_amount),
                    'payment_status' => $tx->payment_status,
                    'payment_type' => $tx->payment_type ?? null,
                    'fulfillment_status' => 'completed',
                    'paid_at' => $tx->paid_at?->toISOString(),
                    'created_at' => $tx->created_at?->toISOString(),
                ];
            });

        return $eventOrders->concat($movieOrders)
            ->sortByDesc('created_at')
            ->values()
            ->take($limit)
            ->all();
    }

    /**
     * Mengambil daftar judul film dan event bioskop dengan performa penjualan tertinggi (Leaderboard).
     *
     * @param  string  $period  Periode analitik ('today', '7d', '30d', 'year').
     * @param  int  $limit  Jumlah judul/event teratas yang diambil.
     * @param  string|null  $startDateParam  Tanggal mulai kustom (Y-m-d).
     * @param  string|null  $endDateParam  Tanggal akhir kustom (Y-m-d).
     * @return array<int, array<string, mixed>>
     */
    public function getTopPerformers(
        string $period = '7d',
        int $limit = 5,
        ?string $startDateParam = null,
        ?string $endDateParam = null
    ): array {
        [
            'startDate' => $startDate,
            'endDate' => $endDate,
            'prevStartDate' => $prevStartDate,
            'prevEndDate' => $prevEndDate,
        ] = $this->resolvePeriodDates($period, $startDateParam, $endDateParam);

        $mappedMovies = $this->getMovieTopPerformers($startDate, $endDate, $prevStartDate, $prevEndDate);
        $mappedEvents = $this->getEventTopPerformers($startDate, $endDate, $prevStartDate, $prevEndDate);

        return $mappedMovies
            ->concat($mappedEvents)
            ->sortByDesc(fn ($item) => [$item['net_revenue'], $item['total_sales_count']])
            ->values()
            ->take($limit)
            ->all();
    }

    /**
     * Mengambil daftar film VoD teratas berdasarkan omzet dan penjualan.
     *
     * @return Collection<int, array<string, mixed>>
     */
    protected function getMovieTopPerformers(
        Carbon $startDate,
        Carbon $endDate,
        Carbon $prevStartDate,
        Carbon $prevEndDate
    ): Collection {
        $moviePerformers = MovieTransaction::query()
            ->where('payment_status', 'paid')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('
                movie_id,
                COALESCE(SUM(gross_amount), 0) as gross_revenue,
                COALESCE(SUM(net_amount), 0) as net_revenue,
                COUNT(*) as total_sales_count
            ')
            ->groupBy('movie_id')
            ->with(['movie:id,title,poster_path'])
            ->get();

        $movieIds = $moviePerformers->pluck('movie_id')->filter()->all();

        $moviePrevRevenues = empty($movieIds) ? collect() : MovieTransaction::query()
            ->where('payment_status', 'paid')
            ->whereBetween('created_at', [$prevStartDate, $prevEndDate])
            ->whereIn('movie_id', $movieIds)
            ->selectRaw('movie_id, COALESCE(SUM(net_amount), 0) as prev_net')
            ->groupBy('movie_id')
            ->pluck('prev_net', 'movie_id');

        return $moviePerformers->map(function ($item) use ($moviePrevRevenues) {
            $gross = (float) $item->gross_revenue;
            $net = (float) $item->net_revenue;
            $prevNet = (float) ($moviePrevRevenues[$item->movie_id] ?? 0.0);
            $growthPercentage = $this->calculateGrowthPercentage($net, $prevNet);

            return [
                'id' => (int) $item->movie_id,
                'title' => (string) ($item->movie?->title ?? 'Film VoD'),
                'type' => 'movie',
                'poster_url' => $item->movie?->poster_url,
                'total_sales_count' => (int) $item->total_sales_count,
                'occupancy_rate' => null,
                'gross_revenue' => $gross,
                'net_revenue' => $net,
                'formatted_net_revenue' => $this->formatRupiah($net),
                'growth_percentage' => $growthPercentage,
            ];
        });
    }

    /**
     * Mengambil daftar event bioskop teratas berdasarkan omzet, okupansi, dan kuantitas tiket.
     *
     * @return Collection<int, array<string, mixed>>
     */
    protected function getEventTopPerformers(
        Carbon $startDate,
        Carbon $endDate,
        Carbon $prevStartDate,
        Carbon $prevEndDate
    ): Collection {
        $eventPerformers = EventTransaction::query()
            ->join('schedules', 'event_transactions.schedule_id', '=', 'schedules.id')
            ->join('events', 'schedules.event_id', '=', 'events.id')
            ->where('event_transactions.payment_status', 'paid')
            ->whereBetween('event_transactions.created_at', [$startDate, $endDate])
            ->selectRaw('
                events.id as event_id,
                events.title as event_title,
                events.poster_path as event_poster_path,
                COALESCE(SUM(event_transactions.gross_amount), 0) as gross_revenue,
                COALESCE(SUM(event_transactions.net_amount), 0) as net_revenue,
                COALESCE(SUM(event_transactions.ticket_quantity), 0) as total_sales_count
            ')
            ->groupBy('events.id', 'events.title', 'events.poster_path')
            ->get();

        $eventIds = $eventPerformers->pluck('event_id')->filter()->all();

        $eventsById = empty($eventIds) ? collect() : Event::whereIn('id', $eventIds)->get()->keyBy('id');

        $schedulesCapacity = empty($eventIds) ? collect() : Schedule::query()
            ->whereIn('event_id', $eventIds)
            ->where('is_active', true)
            ->selectRaw('event_id, COALESCE(SUM(total_seats), 0) as total_capacity')
            ->groupBy('event_id')
            ->pluck('total_capacity', 'event_id');

        $eventPrevRevenues = empty($eventIds) ? collect() : EventTransaction::query()
            ->join('schedules', 'event_transactions.schedule_id', '=', 'schedules.id')
            ->where('event_transactions.payment_status', 'paid')
            ->whereBetween('event_transactions.created_at', [$prevStartDate, $prevEndDate])
            ->whereIn('schedules.event_id', $eventIds)
            ->selectRaw('schedules.event_id, COALESCE(SUM(event_transactions.net_amount), 0) as prev_net')
            ->groupBy('schedules.event_id')
            ->pluck('prev_net', 'event_id');

        return $eventPerformers->map(function ($item) use ($eventsById, $schedulesCapacity, $eventPrevRevenues) {
            $eventId = (int) $item->event_id;
            $gross = (float) $item->gross_revenue;
            $net = (float) $item->net_revenue;
            $salesCount = (int) $item->total_sales_count;
            $capacity = (int) ($schedulesCapacity[$eventId] ?? 0);

            $occupancyRate = $capacity > 0
                ? round(($salesCount / $capacity) * 100, 1)
                : 0.0;

            $prevNet = (float) ($eventPrevRevenues[$eventId] ?? 0.0);
            $growthPercentage = $this->calculateGrowthPercentage($net, $prevNet);

            /** @var Event|null $eventModel */
            $eventModel = $eventsById->get($eventId);
            $posterUrl = $eventModel?->poster_url;

            return [
                'id' => $eventId,
                'title' => (string) ($eventModel?->title ?? $item->event_title ?? 'Event Bioskop'),
                'type' => 'event',
                'poster_url' => $posterUrl,
                'total_sales_count' => $salesCount,
                'occupancy_rate' => $occupancyRate,
                'gross_revenue' => $gross,
                'net_revenue' => $net,
                'formatted_net_revenue' => $this->formatRupiah($net),
                'growth_percentage' => $growthPercentage,
            ];
        });
    }

    /**
     * Menyelesaikan rentang tanggal saat ini dan periode pembanding sebelumnya.
     *
     * @return array{startDate: Carbon, endDate: Carbon, prevStartDate: Carbon, prevEndDate: Carbon}
     */
    protected function resolvePeriodDates(
        string $period = '7d',
        ?string $startDateParam = null,
        ?string $endDateParam = null
    ): array {
        if ($startDateParam) {
            $startDate = Carbon::parse($startDateParam)->startOfDay();
            $endDate = $endDateParam ? Carbon::parse($endDateParam)->endOfDay() : now()->endOfDay();
            $diffDays = max(1, (int) $startDate->diffInDays($endDate));
            $prevStartDate = $startDate->copy()->subDays($diffDays + 1)->startOfDay();
            $prevEndDate = $startDate->copy()->subSecond();
        } else {
            $startDate = match ($period) {
                'today' => now()->startOfDay(),
                '30d' => now()->subDays(30)->startOfDay(),
                'year' => now()->startOfYear(),
                default => now()->subDays(7)->startOfDay(),
            };
            $endDate = now()->endOfDay();

            $prevStartDate = match ($period) {
                'today' => now()->subDay()->startOfDay(),
                '30d' => now()->subDays(60)->startOfDay(),
                'year' => now()->subYear()->startOfYear(),
                default => now()->subDays(14)->startOfDay(),
            };
            $prevEndDate = match ($period) {
                'today' => now()->subDay()->endOfDay(),
                '30d' => now()->subDays(31)->endOfDay(),
                'year' => now()->subYear()->endOfYear(),
                default => now()->subDays(8)->endOfDay(),
            };
        }

        return [
            'startDate' => $startDate,
            'endDate' => $endDate,
            'prevStartDate' => $prevStartDate,
            'prevEndDate' => $prevEndDate,
        ];
    }

    /**
     * Menghitung persentase pertumbuhan pendapatan dibandingkan periode sebelumnya.
     */
    protected function calculateGrowthPercentage(float $currentNet, float $previousNet): float
    {
        if ($previousNet > 0) {
            return round((($currentNet - $previousNet) / $previousNet) * 100, 1);
        }

        return $currentNet > 0 ? 100.0 : 0.0;
    }

    /**
     * Memformat angka ke representasi mata uang Rupiah standar.
     */
    protected function formatRupiah(float|int $amount): string
    {
        return 'Rp '.number_format((float) $amount, 0, ',', '.');
    }
}
