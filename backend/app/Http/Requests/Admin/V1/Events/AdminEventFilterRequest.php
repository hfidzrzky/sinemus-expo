<?php

namespace App\Http\Requests\Admin\V1\Events;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class AdminEventFilterRequest extends FormRequest
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
     * Dapatkan aturan validasi untuk filter daftar event admin.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'search' => ['sometimes', 'nullable', 'string', 'max:100'],
            'event_type' => ['sometimes', 'nullable', 'string', 'in:all,regular,presale_cinema'],
            'type' => ['sometimes', 'nullable', 'string', 'in:all,regular,presale_cinema'],
            'status' => ['sometimes', 'nullable', 'string', 'in:all,published,live,draft'],
            'city' => ['sometimes', 'nullable', 'string', 'max:100'],
            'page' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
