<?php

namespace App\Http\Requests\Admin\V1\Movies;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class AdminMovieFilterRequest extends FormRequest
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
        $mergeData = [];

        if ($this->has('search')) {
            $search = trim((string) $this->input('search'));
            $mergeData['search'] = $search !== '' ? $search : null;
        }

        if ($this->has('genre')) {
            $genre = trim((string) $this->input('genre'));
            $mergeData['genre'] = $genre !== '' ? $genre : null;
        }

        if ($this->has('is_published')) {
            $raw = $this->input('is_published');
            if ($raw === 'all' || $raw === '' || $raw === null) {
                $mergeData['is_published'] = null;
            } elseif ($raw === 'true' || $raw === '1' || $raw === 1 || $raw === true) {
                $mergeData['is_published'] = true;
            } elseif ($raw === 'false' || $raw === '0' || $raw === 0 || $raw === false) {
                $mergeData['is_published'] = false;
            }
        }

        if (! empty($mergeData)) {
            $this->merge($mergeData);
        }
    }

    /**
     * Dapatkan aturan validasi untuk filter daftar film admin.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'search' => ['sometimes', 'nullable', 'string', 'max:100'],
            'genre' => ['sometimes', 'nullable', 'string', 'max:50'],
            'is_published' => ['sometimes', 'nullable', 'boolean'],
            'page' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:100'],
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
            'search.max' => 'Kata kunci pencarian tidak boleh melebihi 100 karakter.',
            'genre.max' => 'Filter genre tidak boleh melebihi 50 karakter.',
            'is_published.boolean' => 'Format status publikasi harus bernilai boolean (true/false).',
            'page.integer' => 'Nomor halaman harus berupa bilangan bulat.',
            'page.min' => 'Nomor halaman minimal bernilai 1.',
            'per_page.integer' => 'Jumlah item per halaman harus berupa bilangan bulat.',
            'per_page.min' => 'Jumlah item per halaman minimal 1.',
            'per_page.max' => 'Jumlah item per halaman maksimal 100.',
        ];
    }
}
