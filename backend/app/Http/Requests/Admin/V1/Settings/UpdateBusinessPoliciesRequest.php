<?php

namespace App\Http\Requests\Admin\V1\Settings;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBusinessPoliciesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'seat_lock_duration_minutes' => ['required', 'integer', 'min:5', 'max:60'],
            'vod_rental_duration_hours' => ['required', 'integer', 'min:12', 'max:168'],
            'platform_service_fee' => ['required', 'numeric', 'min:0', 'max:100000'],
            'max_tickets_per_order' => ['required', 'integer', 'min:1', 'max:20'],
            'enable_ticket_cancellation' => ['required', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'seat_lock_duration_minutes.min' => 'Durasi kunci kursi minimal 5 menit.',
            'seat_lock_duration_minutes.max' => 'Durasi kunci kursi maksimal 60 menit.',
            'vod_rental_duration_hours.min' => 'Durasi sewa film VoD minimal 12 jam.',
            'vod_rental_duration_hours.max' => 'Durasi sewa film VoD maksimal 168 jam (7 hari).',
            'platform_service_fee.min' => 'Biaya layanan platform tidak boleh bernilai negatif.',
            'max_tickets_per_order.min' => 'Batas maksimal tiket per pesanan minimal 1 tiket.',
            'max_tickets_per_order.max' => 'Batas maksimal tiket per pesanan maksimal 20 tiket.',
        ];
    }
}
