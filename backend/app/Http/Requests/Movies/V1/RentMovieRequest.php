<?php

namespace App\Http\Requests\Movies\V1;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class RentMovieRequest extends FormRequest
{
    /**
     * Tentukan apakah pengguna diotorisasi untuk melakukan sewa film.
     * Hak akses login divalidasi oleh middleware auth:sanctum pada rute.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Sanitasi kode voucher sebelum validasi (trim, uppercase, buang karakter tak aman).
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('voucher_code') && is_string($this->input('voucher_code'))) {
            $cleaned = strtoupper(trim((string) $this->input('voucher_code')));
            $this->merge([
                'voucher_code' => $cleaned !== '' ? $cleaned : null,
            ]);
        }
    }

    /**
     * Aturan validasi payload inisiasi sewa film digital.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'voucher_code' => ['nullable', 'string', 'max:50', 'alpha_dash'],
        ];
    }

    /**
     * Dapatkan nama atribut kustom untuk pesan validasi.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'voucher_code' => 'kode kupon diskon',
        ];
    }

    /**
     * Dapatkan pesan error kustom untuk validasi.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'voucher_code.alpha_dash' => 'Format kode kupon diskon hanya boleh berisi karakter alfanumerik, tanda hubung (-), dan garis bawah (_).',
            'voucher_code.max' => 'Panjang kode kupon diskon maksimal 50 karakter.',
        ];
    }

    /**
     * Helper untuk mengambil kode voucher yang sudah disanitasi.
     */
    public function voucherCode(): ?string
    {
        $code = $this->validated('voucher_code');

        return ! empty($code) ? (string) $code : null;
    }
}
