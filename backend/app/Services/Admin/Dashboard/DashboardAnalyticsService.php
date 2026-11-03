<?php

namespace App\Services\Admin\Dashboard;

use App\Models\Event;
use App\Models\EventTransaction;
use App\Models\Movie;
use App\Models\MovieTransaction;
use App\Models\Schedule;
use App\Models\UserMovieAccess;
use Illuminate\Support\Carbon;
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
        if ($startDateParam) {
            $startDate = Carbon::parse($startDateParam)->startOfDay();
            $endDate = $endDateParam ? Carbon::parse($endDateParam)->endOfDay() : now()->endOfDay();
        } else {
            $startDate = match ($period) {
                'today' => now()->startOfDay(),
                '30d' => now()->subDays(30)->startOfDay(),
                'year' => now()->startOfYear(),
                default => now()->subDays(7)->startOfDay(),
            };
            $endDate = now()->endOfDay();
        }

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
            ->map(function (EventTransaction $tx) {
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
            ->map(function (MovieTransaction $tx) {
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
     * Memformat angka ke representasi mata uang Rupiah standar.
     */
    protected function formatRupiah(float|int $amount): string
    {
        return 'Rp '.number_format((float) $amount, 0, ',', '.');
    }
}
