<?php

namespace App\Http\Requests\Admin\V1\Cloudflare;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class VerifyStreamUidRequest extends FormRequest
{
    /**
     * Tentukan apakah pengguna memiliki otorisasi.
     * Route dilindungi oleh middleware auth:sanctum dan role:super_admin.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Aturan validasi ketat untuk mencegah SSRF dan injeksi karakter ilegal.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'uid' => [
                'required',
                'string',
                'size:32',
                'regex:/^[a-f0-9]{32}$/i',
            ],
        ];
    }

    /**
     * Pesan validasi ramah pengguna dalam Bahasa Indonesia.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'uid.required' => 'Cloudflare Stream UID wajib diisi.',
            'uid.size' => 'Cloudflare Stream UID harus terdiri tepat dari 32 karakter.',
            'uid.regex' => 'Format Cloudflare Stream UID tidak valid (hanya karakter heksadesimal 0-9 dan a-f yang diperbolehkan).',
        ];
    }
}
