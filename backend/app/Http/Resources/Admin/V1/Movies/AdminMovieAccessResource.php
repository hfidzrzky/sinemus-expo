<?php

namespace App\Http\Resources\Admin\V1\Movies;

use App\Models\UserMovieAccess;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin UserMovieAccess
 */
class AdminMovieAccessResource extends JsonResource
{
    /**
     * Disable default data wrapping.
     *
     * @var string|null
     */
    public static $wrap = null;

    /**
     * Transform the resource into an array matching admin entitlement contracts.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => (int) $this->id,
            'user_id' => (int) $this->user_id,
            'user_name' => (string) ($this->user?->name ?? 'Pengguna Sinemus'),
            'user_email' => (string) ($this->user?->email ?? '-'),
            'movie_id' => (int) $this->movie_id,
            'movie_title' => (string) ($this->movie?->title ?? '-'),
            'access_status' => (string) $this->access_status,
            'rental_start_at' => $this->rental_start_at?->toIso8601String(),
            'rental_expires_at' => $this->rental_expires_at?->toIso8601String(),
            'revoked_at' => $this->revoked_at?->toIso8601String(),
            'revoke_reason' => (string) ($this->revoke_reason ?? 'none'),
            'admin_notes' => $this->admin_notes ? (string) $this->admin_notes : null,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
