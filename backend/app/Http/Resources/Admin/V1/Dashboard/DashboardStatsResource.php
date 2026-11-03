<?php

namespace App\Http\Resources\Admin\V1\Dashboard;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DashboardStatsResource extends JsonResource
{
    /**
     * Disable default data wrapping when resource is transformed.
     *
     * @var string|null
     */
    public static $wrap = null;

    /**
     * Transform the resource into an array matching contracts/admin.contract.json.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $stats = $this->resource;

        return [
            // Kontrak SSOT Wajib (contracts/admin.contract.json - getDashboardStats)
            'total_revenue' => (float) ($stats['total_revenue'] ?? 0.0),
            'formatted_total_revenue' => (string) ($stats['formatted_total_revenue'] ?? 'Rp 0'),
            'total_tickets_sold' => (int) ($stats['total_tickets_sold'] ?? 0),
            'active_movies_count' => (int) ($stats['active_movies_count'] ?? 0),
            'upcoming_events_count' => (int) ($stats['upcoming_events_count'] ?? 0),

            // Rincian Eksekutif Tambahan (docs/05-Admin-Studio/01-Overview-and-Navigation.md)
            'gross_revenue' => (float) ($stats['gross_revenue'] ?? 0.0),
            'formatted_gross_revenue' => (string) ($stats['formatted_gross_revenue'] ?? 'Rp 0'),
            'net_revenue' => (float) ($stats['net_revenue'] ?? 0.0),
            'formatted_net_revenue' => (string) ($stats['formatted_net_revenue'] ?? 'Rp 0'),
            'total_discount' => (float) ($stats['total_discount'] ?? 0.0),
            'formatted_total_discount' => (string) ($stats['formatted_total_discount'] ?? 'Rp 0'),
            'breakdown' => $stats['breakdown'] ?? [],
            'active_vod_rentals' => (int) ($stats['active_vod_rentals'] ?? 0),
            'presale_fulfillment_alert' => $stats['presale_fulfillment_alert'] ?? [
                'pending_count' => 0,
                'has_pending' => false,
                'message' => 'Semua pesanan presale telah terpenuhi.',
            ],
            'average_seat_occupancy' => $stats['average_seat_occupancy'] ?? [
                'total_capacity' => 0,
                'sold_count' => 0,
                'occupancy_percentage' => 0.0,
                'formatted_percentage' => '0%',
            ],
            'presale_pending_count' => (int) ($stats['presale_fulfillment_alert']['pending_count'] ?? 0),
            'total_active_vod_rentals' => (int) ($stats['active_vod_rentals'] ?? 0),
            'average_occupancy_rate' => (float) ($stats['average_seat_occupancy']['occupancy_percentage'] ?? 0.0),
            'recent_orders' => $stats['recent_orders'] ?? [],
            'revenue_trends' => $stats['revenue_trends'] ?? [],
            'top_performers' => $stats['top_performers'] ?? [],
        ];
    }
}
