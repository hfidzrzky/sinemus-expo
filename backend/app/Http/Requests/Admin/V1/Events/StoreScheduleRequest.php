<?php

namespace App\Http\Requests\Admin\V1\Events;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreScheduleRequest extends FormRequest
{
    /**
     * Tentukan apakah pengguna memiliki otorisasi untuk melakukan request ini.
     * Otorisasi role telah dilindungi oleh middleware 'role:super_admin'.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Dapatkan aturan validasi untuk penambahan sesi jadwal tayang.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'event_venue_id' => ['sometimes', 'nullable', 'integer', 'exists:event_venues,id'],
            'show_time' => ['required', 'date', 'after:now'],
            'ticket_price' => ['required', 'numeric', 'min:0'],
            'total_seats' => ['required', 'integer', 'min:1'],
            'studio_name' => ['sometimes', 'nullable', 'string', 'max:100'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * Normalisasi payload sebelum divalidasi.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('is_active')) {
            $val = filter_var($this->input('is_active'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($val !== null) {
                $this->merge(['is_active' => $val]);
            }
        }
    }
}
