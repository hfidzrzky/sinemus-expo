<?php

namespace App\Http\Resources\Admin\V1\Users;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin User
 */
class AdminUserListResource extends JsonResource
{
    /**
     * Disable default data wrapping when resource is transformed.
     *
     * @var string|null
     */
    public static $wrap = null;

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

        return [
            'id' => (int) $this->id,
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
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
