<?php

namespace App\Http\Requests\Admin\V1\Movies;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class RevokeMovieAccessRequest extends FormRequest
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
     * Persiapkan dan sanitasi data sebelum divalidasi.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('admin_notes')) {
            $notes = trim((string) $this->input('admin_notes'));
            $this->merge([
                'admin_notes' => $notes !== '' ? $notes : null,
            ]);
        }
    }

    /**
     * Dapatkan aturan validasi untuk pencabutan hak akses sewa film admin.
     * Sinkron 100% dengan endpoint revokeMovieAccess di contracts/admin.contract.json.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'revoke_reason' => ['required', 'string', 'in:refund,violation,system_error,manual_admin'],
            'admin_notes' => ['sometimes', 'nullable', 'string', 'max:255'],
        ];
    }

    /**
     * Pesan validasi deskriptif dalam Bahasa Indonesia.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'revoke_reason.required' => 'Alasan pencabutan hak sewa (revoke_reason) wajib dipilih.',
            'revoke_reason.in' => 'Alasan pencabutan harus salah satu dari: refund, violation, system_error, atau manual_admin.',
            'admin_notes.max' => 'Catatan admin tidak boleh melebihi 255 karakter.',
        ];
    }
}
