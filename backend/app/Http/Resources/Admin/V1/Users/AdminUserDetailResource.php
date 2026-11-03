<?php

namespace App\Http\Resources\Admin\V1\Users;

use App\Models\EventTransaction;
use App\Models\MovieTransaction;
use App\Models\User;
use App\Models\UserMovieAccess;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin User
 */
class AdminUserDetailResource extends JsonResource
{
    /**
     * Disable default data wrapping when resource is transformed.
     *
     * @var string|null
     */
    public static $wrap = null;

    /**
     * Mask google_id demi keamanan audit.
     */
    protected function maskGoogleId(?string $googleId): ?string
    {
        if (empty($googleId)) {
            return null;
        }

        $length = strlen($googleId);
        if ($length <= 8) {
            return str_repeat('*', $length);
        }

        return substr($googleId, 0, 4).str_repeat('*', max(4, $length - 8)).substr($googleId, -4);
    }

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $age = null;
        if ($this->birth_date instanceof Carbon) {
            $age = (int) $this->birth_date->age;
        }

        $paidTicketsCount = (int) ($this->paid_ticket_orders_count ?? 0);
        $paidMoviesCount = (int) ($this->paid_movie_orders_count ?? 0);
        $totalPaidTransactions = $paidTicketsCount + $paidMoviesCount;

        // Transform transaksi tiket terbaru
        $recentTickets = $this->whenLoaded('eventTransactions', function () {
            return $this->eventTransactions->map(function (EventTransaction $tx) {
                $eventTitle = $tx->schedule?->event?->title
                    ?? ($tx->snapshot_event_data['event_title'] ?? ($tx->snapshot_event_data['title'] ?? 'Tiket Bioskop'));

                return [
                    'id' => (int) $tx->id,
                    'order_id' => (string) $tx->order_id,
                    'event_title' => $eventTitle,
                    'event_slug' => $tx->schedule?->event?->slug,
                    'ticket_code' => $tx->ticket_code,
                    'ticket_quantity' => (int) $tx->ticket_quantity,
                    'gross_amount' => (float) $tx->gross_amount,
                    'net_amount' => (float) $tx->net_amount,
                    'payment_status' => (string) $tx->payment_status,
                    'checkin_status' => (string) $tx->checkin_status,
                    'paid_at' => $tx->paid_at?->toIso8601String(),
                    'created_at' => $tx->created_at?->toIso8601String(),
                ];
            });
        }, []);

        // Transform transaksi sewa film terbaru
        $recentMovies = $this->whenLoaded('movieTransactions', function () {
            return $this->movieTransactions->map(function (MovieTransaction $tx) {
                $movieTitle = $tx->movie?->title
                    ?? ($tx->snapshot_movie_data['title'] ?? ($tx->snapshot_movie_data['movie_title'] ?? 'Sewa Film VoD'));

                return [
                    'id' => (int) $tx->id,
                    'order_id' => (string) $tx->order_id,
                    'movie_title' => $movieTitle,
                    'movie_slug' => $tx->movie?->slug,
                    'gross_amount' => (float) $tx->gross_amount,
                    'net_amount' => (float) $tx->net_amount,
                    'payment_status' => (string) $tx->payment_status,
                    'paid_at' => $tx->paid_at?->toIso8601String(),
                    'created_at' => $tx->created_at?->toIso8601String(),
                ];
            });
        }, []);

        // Sintesis rekam jejak pesanan terpadu (Unified Recent Orders) untuk kompatibilitas UI
        $unifiedOrders = collect();

        if ($this->relationLoaded('eventTransactions')) {
            foreach ($this->eventTransactions as $tx) {
                $title = $tx->schedule?->event?->title
                    ?? ($tx->snapshot_event_data['event_title'] ?? ($tx->snapshot_event_data['title'] ?? 'Tiket Bioskop'));

                $unifiedOrders->push([
                    'order_id' => (string) $tx->order_id,
                    'order_type' => 'ticket',
                    'item_title' => (string) $title,
                    'net_amount' => (float) $tx->net_amount,
                    'payment_status' => (string) $tx->payment_status,
                    'created_at' => $tx->created_at?->toIso8601String(),
                ]);
            }
        }

        if ($this->relationLoaded('movieTransactions')) {
            foreach ($this->movieTransactions as $tx) {
                $title = $tx->movie?->title
                    ?? ($tx->snapshot_movie_data['title'] ?? ($tx->snapshot_movie_data['movie_title'] ?? 'Sewa Film VoD'));

                $unifiedOrders->push([
                    'order_id' => (string) $tx->order_id,
                    'order_type' => 'movie_rental',
                    'item_title' => (string) $title,
                    'net_amount' => (float) $tx->net_amount,
                    'payment_status' => (string) $tx->payment_status,
                    'created_at' => $tx->created_at?->toIso8601String(),
                ]);
            }
        }

        $recentOrders = $unifiedOrders
            ->sortByDesc('created_at')
            ->values()
            ->all();

        // Transform hak akses sewa film yang aktif
        $activeAccess = $this->whenLoaded('movieAccess', function () {
            $now = now();

            return $this->movieAccess
                ->filter(fn (UserMovieAccess $acc) => $acc->access_status === 'active' && $acc->rental_expires_at > $now)
                ->values()
                ->map(function (UserMovieAccess $acc) use ($now) {
                    $remainingMinutes = max(0, $now->diffInMinutes($acc->rental_expires_at, false));

                    return [
                        'id' => (int) $acc->id,
                        'movie_id' => (int) $acc->movie_id,
                        'movie_title' => $acc->movie?->title,
                        'movie_slug' => $acc->movie?->slug,
                        'rental_start_at' => $acc->rental_start_at?->toIso8601String(),
                        'rental_expires_at' => $acc->rental_expires_at?->toIso8601String(),
                        'remaining_hours' => round($remainingMinutes / 60, 1),
                        'access_status' => (string) $acc->access_status,
                    ];
                });
        }, []);

        return [
            'id' => (int) $this->id,
            'google_id_masked' => $this->maskGoogleId($this->google_id),
            'name' => (string) $this->name,
            'email' => (string) $this->email,
            'avatar_url' => $this->avatar_url,
            'phone_number' => $this->phone_number,
            'is_phone_locked' => (bool) $this->is_phone_locked,
            'birth_date' => $this->birth_date?->format('Y-m-d'),
            'age' => $age,
            'role' => (string) $this->role,
            'is_profile_completed' => (bool) $this->is_profile_completed,
            'paid_ticket_orders_count' => $paidTicketsCount,
            'paid_movie_orders_count' => $paidMoviesCount,
            'total_paid_transactions' => $totalPaidTransactions,
            'total_orders_count' => $totalPaidTransactions,
            'last_login_at' => $this->last_login_at?->toIso8601String(),
            'recent_orders' => $recentOrders,
            'recent_ticket_transactions' => $recentTickets,
            'recent_movie_transactions' => $recentMovies,
            'active_movie_access' => $activeAccess,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
