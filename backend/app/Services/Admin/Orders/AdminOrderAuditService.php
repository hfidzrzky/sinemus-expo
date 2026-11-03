<?php

namespace App\Services\Admin\Orders;

use App\Exceptions\Checkout\OrderNotFoundException;
use App\Jobs\SendTransactionEmailJob;
use App\Models\EventTransaction;
use App\Models\MovieTransaction;
use Carbon\Carbon;
use DomainException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminOrderAuditService
{
    /**
     * Mengambil daftar pesanan terpaginasi lintas domain (Tiket & VoD) dengan filter multi-kriteria.
     *
     * @param  array<string, mixed>  $filters
     */
    public function getPaginatedOrders(array $filters): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 20);
        $page = (int) ($filters['page'] ?? 1);

        $query = $this->getUnifiedOrdersQuery($filters);

        return $query->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);
    }

    /**
     * Mengambil rincian lengkap pesanan (EventTransaction atau MovieTransaction) berdasarkan order_id.
     *
     * @throws OrderNotFoundException
     */
    public function getOrderDetail(string $orderId): EventTransaction|MovieTransaction
    {
        $orderId = trim($orderId);

        // 1. Cek pada domain Tiket Bioskop
        /** @var EventTransaction|null $eventTx */
        $eventTx = EventTransaction::with([
            'user',
            'schedule.event',
            'voucher',
            'fulfilledByAdmin:id,name,email',
            'checkins.scannedBy:id,name,email',
        ])->where('order_id', $orderId)->first();

        if ($eventTx) {
            return $eventTx;
        }

        // 2. Cek pada domain Sewa Film VoD
        /** @var MovieTransaction|null $movieTx */
        $movieTx = MovieTransaction::with([
            'user',
            'movie',
            'voucher',
            'movieAccess',
        ])->where('order_id', $orderId)->first();

        if ($movieTx) {
            return $movieTx;
        }

        throw new OrderNotFoundException("Pesanan dengan Order ID '{$orderId}' tidak ditemukan.");
    }

    /**
     * Mengirim ulang notifikasi email tiket kepada pembeli.
     *
     * @return array<string, mixed>
     *
     * @throws OrderNotFoundException|DomainException
     */
    public function resendTicketNotification(string $orderId, string $channel = 'email'): array
    {
        $orderId = trim($orderId);

        // Jika diawali dengan SNM-VOD, tolak karena film VoD tidak memiliki e-tiket venue
        if (str_starts_with($orderId, 'SNM-VOD')) {
            throw new DomainException('Kirim ulang tiket hanya berlaku untuk transaksi tiket bioskop.');
        }

        /** @var EventTransaction|null $transaction */
        $transaction = EventTransaction::with('user')->where('order_id', $orderId)->first();

        if (! $transaction) {
            // Cek apakah order ini sebenarnya transaksi VoD
            if (MovieTransaction::where('order_id', $orderId)->exists()) {
                throw new DomainException('Kirim ulang tiket hanya berlaku untuk transaksi tiket bioskop.');
            }

            throw new OrderNotFoundException("Pesanan dengan Order ID '{$orderId}' tidak ditemukan.");
        }

        if ($transaction->payment_status !== 'paid') {
            throw new DomainException('Notifikasi tiket hanya dapat dikirim ulang untuk pesanan yang telah lunas.');
        }

        if ($channel === 'whatsapp') {
            throw new DomainException('Kanal pengiriman WhatsApp belum diaktifkan.');
        }

        if ($channel !== 'email') {
            throw new DomainException("Kanal pengiriman '{$channel}' tidak didukung.");
        }

        $recipientEmail = $transaction->user?->email;

        // Dispatch async queue job
        SendTransactionEmailJob::dispatch($transaction->id);

        return [
            'order_id' => $transaction->order_id,
            'recipient_email' => $recipientEmail,
            'channel' => 'email',
            'dispatched_at' => now()->toISOString(),
        ];
    }

    /**
     * Mengekspor riwayat transaksi ke format CSV secara hemat memori (streaming).
     *
     * @param  array<string, mixed>  $filters
     */
    public function exportOrdersCsv(array $filters): StreamedResponse
    {
        return app(AdminOrderExportService::class)->exportOrdersCsv($filters);
    }

    /**
     * Membangun unified query builder untuk menggabungkan event_transactions dan movie_transactions.
     *
     * @param  array<string, mixed>  $filters
     */
    public function getUnifiedOrdersQuery(array $filters): Builder
    {
        $ticketQuery = DB::table('event_transactions')
            ->join('users', 'event_transactions.user_id', '=', 'users.id')
            ->leftJoin('schedules', 'event_transactions.schedule_id', '=', 'schedules.id')
            ->leftJoin('events', 'schedules.event_id', '=', 'events.id')
            ->select([
                'event_transactions.id',
                'event_transactions.order_id',
                DB::raw("'ticket' as order_type"),
                'users.email as user_email',
                'users.name as user_name',
                'users.phone_number as user_phone',
                DB::raw("COALESCE(events.title, 'Tiket Bioskop') as item_title"),
                'events.venue_name as event_venue_name',
                'event_transactions.snapshot_event_data',
                'event_transactions.snapshot_seats',
                'event_transactions.gross_amount',
                'event_transactions.discount_amount',
                'event_transactions.net_amount',
                'event_transactions.payment_status',
                'event_transactions.payment_type',
                'event_transactions.fulfillment_status',
                'event_transactions.paid_at',
                'event_transactions.created_at',
            ]);

        $movieQuery = DB::table('movie_transactions')
            ->join('users', 'movie_transactions.user_id', '=', 'users.id')
            ->leftJoin('movies', 'movie_transactions.movie_id', '=', 'movies.id')
            ->select([
                'movie_transactions.id',
                'movie_transactions.order_id',
                DB::raw("'movie_rental' as order_type"),
                'users.email as user_email',
                'users.name as user_name',
                'users.phone_number as user_phone',
                DB::raw("COALESCE(movies.title, 'Sewa Film VoD') as item_title"),
                DB::raw('NULL as event_venue_name'),
                'movie_transactions.snapshot_movie_data as snapshot_event_data',
                DB::raw('NULL as snapshot_seats'),
                'movie_transactions.gross_amount',
                'movie_transactions.discount_amount',
                'movie_transactions.net_amount',
                'movie_transactions.payment_status',
                'movie_transactions.payment_type',
                DB::raw('NULL as fulfillment_status'),
                'movie_transactions.paid_at',
                'movie_transactions.created_at',
            ]);

        // Filter Status
        if (! empty($filters['status']) && $filters['status'] !== 'all') {
            $ticketQuery->where('event_transactions.payment_status', $filters['status']);
            $movieQuery->where('movie_transactions.payment_status', $filters['status']);
        }

        // Filter Rentang Tanggal Transaksi (start_date)
        if (! empty($filters['start_date'])) {
            $startDate = Carbon::parse($filters['start_date'])->startOfDay()->toDateTimeString();
            $ticketQuery->where('event_transactions.created_at', '>=', $startDate);
            $movieQuery->where('movie_transactions.created_at', '>=', $startDate);
        }

        // Filter Rentang Tanggal Transaksi (end_date)
        if (! empty($filters['end_date'])) {
            $endDate = Carbon::parse($filters['end_date'])->endOfDay()->toDateTimeString();
            $ticketQuery->where('event_transactions.created_at', '<=', $endDate);
            $movieQuery->where('movie_transactions.created_at', '<=', $endDate);
        }

        // Filter Pencarian (Search Kata Kunci)
        if (! empty($filters['search'])) {
            $search = trim($filters['search']);
            $ticketQuery->where(function ($q) use ($search) {
                $q->where('event_transactions.order_id', 'like', "%{$search}%")
                    ->orWhere('event_transactions.ticket_code', 'like', "%{$search}%")
                    ->orWhere('users.name', 'like', "%{$search}%")
                    ->orWhere('users.email', 'like', "%{$search}%")
                    ->orWhere('users.phone_number', 'like', "%{$search}%");
            });

            $movieQuery->where(function ($q) use ($search) {
                $q->where('movie_transactions.order_id', 'like', "%{$search}%")
                    ->orWhere('users.name', 'like', "%{$search}%")
                    ->orWhere('users.email', 'like', "%{$search}%")
                    ->orWhere('users.phone_number', 'like', "%{$search}%");
            });
        }

        $type = $filters['type'] ?? 'all';
        if ($type === 'ticket') {
            return DB::query()->fromSub($ticketQuery, 'orders');
        }

        if ($type === 'movie_rental') {
            return DB::query()->fromSub($movieQuery, 'orders');
        }

        return DB::query()->fromSub($ticketQuery->unionAll($movieQuery), 'orders');
    }
}
