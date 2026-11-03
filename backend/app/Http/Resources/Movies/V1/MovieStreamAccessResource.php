<?php

namespace App\Http\Resources\Movies\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MovieStreamAccessResource extends JsonResource
{
    /**
     * Disable default wrapping.
     *
     * @var string|null
     */
    public static $wrap = null;

    /**
     * Transform the resource into an array matching contracts/movies.contract.json -> getStreamAccess.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'playback_url' => (string) ($this['playback_url'] ?? ''),
            'preview_iframe_url' => (string) ($this['preview_iframe_url'] ?? ''),
            'signed_token' => (string) ($this['signed_token'] ?? ''),
            'rental_expires_at' => $this['rental_expires_at'] ?? null,
            'remaining_seconds' => (int) ($this['remaining_seconds'] ?? 0),
        ];
    }
}
