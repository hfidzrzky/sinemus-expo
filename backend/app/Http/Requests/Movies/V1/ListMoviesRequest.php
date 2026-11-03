<?php

namespace App\Http\Requests\Movies\V1;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ListMoviesRequest extends FormRequest
{
    /**
     * Tentukan apakah pengguna memiliki otorisasi untuk membuat permintaan ini.
     * Katalog publik terbuka untuk semua audiens.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Sanitasi parameter kueri sebelum validasi dieksekusi.
     * Mencegah XSS, spasi liar, dan penulisan tipe data yang tidak konsisten.
     */
    protected function prepareForValidation(): void
    {
        $mergeData = [];

        if ($this->has('search') && is_string($this->input('search'))) {
            $cleaned = preg_replace('/<script\b[^>]*>(.*?)<\/script>/is', '', (string) $this->input('search'));
            $mergeData['search'] = trim(strip_tags((string) $cleaned));
        }

        if ($this->has('genre') && is_string($this->input('genre'))) {
            $mergeData['genre'] = trim(strip_tags((string) $this->input('genre')));
        }

        if ($this->has('featured')) {
            $mergeData['featured'] = $this->boolean('featured');
        }

        if (! empty($mergeData)) {
            $this->merge($mergeData);
        }
    }

    /**
     * Dapatkan aturan validasi untuk kueri katalog film publik.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'genre' => ['nullable', 'string', 'max:50'],
            'search' => ['nullable', 'string', 'max:100'],
            'featured' => ['nullable', 'boolean'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ];
    }

    /**
     * Helper untuk mengambil genre yang telah tervalidasi dan disanitasi.
     */
    public function validatedGenre(): ?string
    {
        $genre = $this->validated('genre');

        return ! empty($genre) ? (string) $genre : null;
    }

    /**
     * Helper untuk mengambil kata kunci pencarian yang telah tervalidasi.
     */
    public function validatedSearch(): ?string
    {
        $search = $this->validated('search');

        return ! empty($search) ? (string) $search : null;
    }

    /**
     * Helper untuk memeriksa apakah filter film unggulan aktif.
     */
    public function isFeatured(): ?bool
    {
        return $this->has('featured') ? $this->boolean('featured') : null;
    }

    /**
     * Helper untuk menentukan jumlah item per halaman (default 12 sesuai SSOT kontrak).
     */
    public function perPage(): int
    {
        return (int) $this->validated('per_page', 12);
    }
}
