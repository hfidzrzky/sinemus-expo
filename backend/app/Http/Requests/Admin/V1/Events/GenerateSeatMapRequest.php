<?php

namespace App\Http\Requests\Admin\V1\Events;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class GenerateSeatMapRequest extends FormRequest
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
     * Dapatkan aturan validasi untuk generator denah kursi interaktif.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'rows' => ['required', 'integer', 'min:1', 'max:26'],
            'columns' => ['required', 'integer', 'min:1', 'max:50'],
            'vip_seats' => ['sometimes', 'nullable', 'array'],
            'vip_seats.*' => ['required', 'string', 'max:10'],
            'disabled_seats' => ['sometimes', 'nullable', 'array'],
            'disabled_seats.*' => ['required', 'string', 'max:10'],
            'aisle_seats' => ['sometimes', 'nullable', 'array'],
            'aisle_seats.*' => ['required', 'string', 'max:10'],
        ];
    }
}
