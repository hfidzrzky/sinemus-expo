<?php

namespace App\Http\Requests\Admin\V1\Movies;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class GrantMovieAccessRequest extends FormRequest
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
     * Persiapkan dan sanitasi input sebelum divalidasi.
     */
    protected function prepareForValidation(): void
    {
        $mergeData = [];

        if ($this->has('duration_hours')) {
            $duration = $this->input('duration_hours');
            $mergeData['duration_hours'] = ($duration !== null && $duration !== '') ? (int) $duration : 48;
        } else {
            $mergeData['duration_hours'] = 48;
        }

        if ($this->has('admin_notes')) {
            $notes = trim((string) $this->input('admin_notes'));
            $mergeData['admin_notes'] = $notes !== '' ? $notes : null;
        }

        if (! empty($mergeData)) {
            $this->merge($mergeData);
        }
    }

    /**
     * Dapatkan aturan validasi untuk pemberian hak akses sewa film admin.
     * Sinkron 100% dengan endpoint grantMovieAccess di contracts/admin.contract.json.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'movie_id' => ['required', 'integer', 'exists:movies,id'],
            'duration_hours' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:720'],
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
            'user_id.required' => 'ID pengguna (user_id) wajib disertakan.',
            'user_id.integer' => 'ID pengguna harus berupa bilangan bulat.',
            'user_id.exists' => 'Pengguna dengan ID yang dipilih tidak terdaftar di sistem.',
            'movie_id.required' => 'ID film (movie_id) wajib disertakan.',
            'movie_id.integer' => 'ID film harus berupa bilangan bulat.',
            'movie_id.exists' => 'Film dengan ID yang dipilih tidak ditemukan dalam katalog.',
            'duration_hours.integer' => 'Durasi hak akses harus berupa bilangan bulat (jam).',
            'duration_hours.min' => 'Durasi hak akses minimal 1 jam.',
            'duration_hours.max' => 'Durasi hak akses maksimal 720 jam (30 hari).',
            'admin_notes.max' => 'Catatan admin tidak boleh melebihi 255 karakter.',
        ];
    }
}
