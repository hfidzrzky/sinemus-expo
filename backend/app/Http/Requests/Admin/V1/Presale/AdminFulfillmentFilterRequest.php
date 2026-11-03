<?php

namespace App\Http\Requests\Admin\V1\Presale;

use Illuminate\Foundation\Http\FormRequest;

class AdminFulfillmentFilterRequest extends FormRequest
{
    /**
     * Tentukan apakah pengguna diizinkan membuat permintaan ini.
     * Guard otorisasi utama ditangani oleh middleware Sanctum & Role Super Admin.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Aturan validasi untuk filter pesanan pemenuhan tiket presale.
     *
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'status' => ['nullable', 'string', 'in:all,awaiting,fulfilled'],
            'search' => ['nullable', 'string', 'max:100'],
        ];
    }

    /**
     * Nilai default sanitasi input.
     */
    public function validatedWithDefaults(): array
    {
        $validated = $this->validated();

        return [
            'status' => $validated['status'] ?? 'all',
            'search' => isset($validated['search']) ? trim((string) $validated['search']) : null,
        ];
    }
}
