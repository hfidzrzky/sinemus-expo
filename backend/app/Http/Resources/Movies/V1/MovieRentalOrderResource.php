<?php

namespace App\Http\Resources\Movies\V1;

use App\Models\MovieTransaction;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read MovieTransaction|array<string, mixed> $resource
 */
class MovieRentalOrderResource extends JsonResource
{
    /**
     * Nonaktifkan pembungkus bawaan 'data'.
     *
     * @var string|null
     */
    public static $wrap = null;

    /**
     * Transformasikan data order sewa film digital ke respons standar Midtrans Snap Token.
     * Sinkron 100% dengan contracts/checkout.contract.json#/endpoints/rentMovie.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $data = $this->resource;

        if (is_array($data)) {
            return [
                'order_id' => (string) ($data['order_id'] ?? ''),
                'snap_token' => (string) ($data['snap_token'] ?? ''),
                'movie_title' => (string) ($data['movie_title'] ?? ''),
                'gross_amount' => (float) ($data['gross_amount'] ?? 0),
                'discount_amount' => (float) ($data['discount_amount'] ?? 0),
                'net_amount' => (float) ($data['net_amount'] ?? 0),
                'rental_duration_hours' => (int) ($data['rental_duration_hours'] ?? 48),
            ];
        }

        /** @var MovieTransaction $data */
        $snapshot = $data->snapshot_movie_data ?? [];
        $movieTitle = $snapshot['title'] ?? ($data->movie?->title ?? 'Film Sewa VoD');

        return [
            'order_id' => (string) $data->order_id,
            'snap_token' => (string) ($data->snap_token ?? ''),
            'movie_title' => (string) $movieTitle,
            'gross_amount' => (float) $data->gross_amount,
            'discount_amount' => (float) $data->discount_amount,
            'net_amount' => (float) $data->net_amount,
            'rental_duration_hours' => (int) ($snapshot['rental_duration_hours'] ?? ($data->movie?->rental_duration_hours ?? 48)),
        ];
    }
}
