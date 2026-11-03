<?php

namespace App\Services\Tickets;

use App\Exceptions\Tickets\TicketNotFoundException;
use App\Models\EventTransaction;
use App\Services\Admin\Settings\SystemSettingService;
use Illuminate\Support\Collection;

class UserTicketService
{
    protected SystemSettingService $settingService;

    public function __construct(?SystemSettingService $settingService = null)
    {
        $this->settingService = $settingService ?? app(SystemSettingService::class);
    }

    /**
     * Mengambil seluruh tiket screening fisik milik pengguna berdasarkan filter status.
     * Filter yang didukung: 'upcoming', 'active', 'past', 'all', 'pending'.
     *
     * @return Collection<int, EventTransaction>
     */
    public function getUserTickets(int $userId, string $filter = 'active'): Collection
    {
        $normalizedFilter = strtolower(trim($filter));

        // Transaksi aktif yang sedang menunggu penyelesaian pembayaran
        if ($normalizedFilter === 'pending') {
            $lockDuration = $this->settingService->getSeatLockDurationMinutes();

            return EventTransaction::with(['schedule.event', 'user'])
                ->where('user_id', $userId)
                ->where('payment_status', 'pending')
                ->where('created_at', '>=', now()->subMinutes($lockDuration))
                ->orderByDesc('id')
                ->get();
        }

        $query = EventTransaction::with(['schedule.event', 'user'])
            ->where('user_id', $userId)
            ->where('payment_status', 'paid');

        if ($normalizedFilter === 'active' || $normalizedFilter === 'upcoming') {
            $query->where('checkin_status', '!=', 'checked_in')
                ->whereHas('schedule', function ($sq) {
                    $sq->where('show_time', '>=', now());
                });

            return $query->get()
                ->sortBy(fn ($t) => $t->schedule?->show_time?->timestamp ?? $t->created_at?->timestamp ?? 0)
                ->values();
        }

        if ($normalizedFilter === 'past') {
            $query->where(function ($q) {
                $q->where('checkin_status', 'checked_in')
                    ->orWhereHas('schedule', function ($sq) {
                        $sq->where('show_time', '<', now());
                    });
            });

            return $query->get()
                ->sortByDesc(fn ($t) => $t->schedule?->show_time?->timestamp ?? $t->created_at?->timestamp ?? 0)
                ->values();
        }

        // Default 'all': seluruh tiket lunas milik pengguna, diurutkan dari transaksi terbaru
        return $query->orderByDesc('id')->get();
    }

    /**
     * Mengambil detail lengkap tiket pengguna berdasarkan ticket_code atau order_id.
     * Perlindungan Anti-IDOR: Wajib difilter berdasarkan user_id pemilik token autentikasi.
     *
     * @throws TicketNotFoundException
     */
    public function getTicketByCode(int $userId, string $ticketCode): EventTransaction
    {
        $transaction = EventTransaction::with(['schedule.event', 'user'])
            ->where('user_id', $userId)
            ->where('payment_status', 'paid')
            ->where(function ($q) use ($ticketCode) {
                $q->where('ticket_code', $ticketCode)
                    ->orWhere('order_id', $ticketCode);
            })
            ->first();

        if (! $transaction) {
            throw new TicketNotFoundException("Tiket dengan kode '{$ticketCode}' tidak ditemukan atau Anda tidak memiliki akses ke tiket ini.");
        }

        return $transaction;
    }
}
