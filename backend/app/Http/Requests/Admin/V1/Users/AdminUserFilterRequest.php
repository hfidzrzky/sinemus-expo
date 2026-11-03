<?php

namespace App\Http\Requests\Admin\V1\Users;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class AdminUserFilterRequest extends FormRequest
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
     * Normalisasi payload query string sebelum divalidasi.
     */
    protected function prepareForValidation(): void
    {
        // Mendukung parameter phone_locked ('locked' | 'unlocked') dari frontend filter bar
        if ($this->has('phone_locked') && ! $this->has('is_phone_locked')) {
            $phoneLocked = $this->input('phone_locked');
            if ($phoneLocked === 'locked') {
                $this->merge(['is_phone_locked' => true]);
            } elseif ($phoneLocked === 'unlocked') {
                $this->merge(['is_phone_locked' => false]);
            }
        }

        if ($this->has('is_phone_locked')) {
            $val = filter_var($this->input('is_phone_locked'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($val !== null) {
                $this->merge(['is_phone_locked' => $val]);
            }
        }
    }

    /**
     * Dapatkan aturan validasi untuk filter pengguna admin.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:100'],
            'role' => ['nullable', 'string', 'in:all,customer,super_admin'],
            'phone_locked' => ['nullable', 'string', 'in:all,locked,unlocked'],
            'is_phone_locked' => ['nullable', 'boolean'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
