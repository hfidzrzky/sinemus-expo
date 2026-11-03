<?php

namespace App\Http\Requests\Admin\V1\Settings;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEmergencyControlsRequest extends FormRequest
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
            'is_maintenance_mode' => ['required', 'boolean'],
            'maintenance_message' => ['required', 'string', 'max:1000'],
            'freeze_cinema_ticket_sales' => ['required', 'boolean'],
            'freeze_vod_rentals' => ['required', 'boolean'],
            'emergency_alert_banner' => ['required', 'array'],
            'emergency_alert_banner.is_active' => ['required', 'boolean'],
            'emergency_alert_banner.message' => ['nullable', 'string', 'max:500'],
            'emergency_alert_banner.type' => ['required', 'string', 'in:warning,danger,info'],
        ];
    }
}
