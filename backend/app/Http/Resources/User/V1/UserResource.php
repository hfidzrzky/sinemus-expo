<?php

namespace App\Http\Resources\User\V1;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

/**
 * @property-read User $resource
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string $role
 * @property string|null $avatar_url
 * @property string|null $phone_number
 * @property bool $is_phone_locked
 * @property Carbon|null $birth_date
 * @property bool $is_profile_completed
 * @property Carbon|null $created_at
 *
 * @mixin User
 */
class UserResource extends JsonResource
{
    /**
     * Disable default top-level "data" wrapping when embedded inside response envelope.
     *
     * @var string|null
     */
    public static $wrap = null;

    /**
     * Transform the resource into an array according to contracts/auth.contract.json.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var User $user */
        $user = $this->resource;

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role ?? 'customer',
            'avatar_url' => $user->avatar_url,
            'phone_number' => $user->phone_number,
            'is_phone_locked' => (bool) $user->is_phone_locked,
            'birth_date' => $user->birth_date?->format('Y-m-d'),
            'is_profile_completed' => (bool) $user->is_profile_completed,
            'created_at' => $user->created_at?->toISOString(),
        ];
    }
}
