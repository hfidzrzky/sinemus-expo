<?php

namespace App\Http\Requests\Admin\V1\Dashboard;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class GetDashboardStatsRequest extends FormRequest
{
    /**
     * Tentukan apakah pengguna memiliki otorisasi untuk melakukan request ini.
     * Otorisasi role super_admin telah dilindungi oleh middleware 'role:super_admin'.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Dapatkan aturan validasi untuk query parameter request dashboard stats.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'refresh' => ['sometimes', 'boolean'],
            'period' => ['sometimes', 'string', 'in:today,7d,30d,year,custom'],
            'start_date' => ['sometimes', 'date'],
            'end_date' => ['sometimes', 'date', 'after_or_equal:start_date'],
        ];
    }

    /**
     * Normalisasi nilai boolean dari query string URL sebelum divalidasi.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('refresh')) {
            $val = filter_var($this->query('refresh'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($val !== null) {
                $this->merge(['refresh' => $val]);
            }
        }
    }
}
