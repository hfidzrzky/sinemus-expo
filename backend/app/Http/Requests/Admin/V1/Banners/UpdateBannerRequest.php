<?php

namespace App\Http\Requests\Admin\V1\Banners;

use App\Models\Event;
use App\Models\Movie;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateBannerRequest extends FormRequest
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
     * Normalisasi payload sebelum divalidasi.
     */
    protected function prepareForValidation(): void
    {
        // Normalisasi boolean string 'true'/'false'/'1'/'0'
        if ($this->has('is_active')) {
            $val = filter_var($this->input('is_active'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($val !== null) {
                $this->merge(['is_active' => $val]);
            }
        }

        // Trim string inputs
        $stringFields = ['title', 'subtitle', 'badge_text', 'age_rating', 'genre', 'button_text', 'target_url', 'image_url'];
        $sanitized = [];
        foreach ($stringFields as $field) {
            if ($this->has($field) && is_string($this->input($field))) {
                $trimmed = trim($this->input($field));
                $sanitized[$field] = $trimmed === '' ? null : $trimmed;
            }
        }
        if ($this->has('release_year') && $this->input('release_year') !== '') {
            $sanitized['release_year'] = (int) $this->input('release_year');
        }
        if ($this->has('duration_minutes') && $this->input('duration_minutes') !== '') {
            $sanitized['duration_minutes'] = (int) $this->input('duration_minutes');
        }

        // Mode Sorotan: Auto-fill dari database Movie / Event jika field judul, badge, deskripsi kosong
        $displayMode = $this->input('display_mode');
        $isSpotlight = in_array($displayMode, ['spotlight', 'movie_spotlight', 'sorotan'], true);
        if ($isSpotlight) {
            $sanitized['badge_text'] = null;
            $linkType = $this->input('link_type');
            if ($linkType === 'movie' && $this->filled('movie_id')) {
                $movie = Movie::find($this->input('movie_id'));
                if ($movie) {
                    $sanitized['title'] = $sanitized['title'] ?? $movie->title;
                    $sanitized['subtitle'] = $sanitized['subtitle'] ?? ($movie->synopsis_short ?? $movie->synopsis);
                    $sanitized['age_rating'] = $sanitized['age_rating'] ?? $movie->age_rating;
                    $sanitized['genre'] = $sanitized['genre'] ?? (is_array($movie->genre) ? implode(', ', $movie->genre) : $movie->genre);
                    $sanitized['release_year'] = $sanitized['release_year'] ?? ($movie->release_year ? (int) $movie->release_year : null);
                    $sanitized['duration_minutes'] = $sanitized['duration_minutes'] ?? ($movie->duration_minutes ? (int) $movie->duration_minutes : null);
                }
            } elseif ($linkType === 'event' && $this->filled('event_id')) {
                $event = Event::find($this->input('event_id'));
                if ($event) {
                    $sanitized['title'] = $sanitized['title'] ?? $event->title;
                    $sanitized['subtitle'] = $sanitized['subtitle'] ?? ($event->synopsis_short ?: 'Tiket Screening Terbatas');
                    $sanitized['age_rating'] = $sanitized['age_rating'] ?? $event->age_rating;
                    $sanitized['genre'] = $sanitized['genre'] ?? (is_array($event->genre) ? implode(', ', $event->genre) : $event->genre);
                    $sanitized['release_year'] = $sanitized['release_year'] ?? ($event->release_year ? (int) $event->release_year : null);
                    $sanitized['duration_minutes'] = $sanitized['duration_minutes'] ?? ($event->duration_minutes ? (int) $event->duration_minutes : null);
                }
            }
        }

        if (! empty($sanitized)) {
            $this->merge($sanitized);
        }
    }

    /**
     * Dapatkan aturan validasi untuk memperbarui banner.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $isSpotlight = in_array($this->input('display_mode'), ['spotlight', 'movie_spotlight', 'sorotan'], true);

        return [
            'display_mode' => ['required', 'string', 'in:spotlight,rich_content,image_only,movie_spotlight,sorotan'],
            'image' => ['nullable', 'file', 'image', 'mimes:jpeg,jpg,png,webp', 'max:3072'],
            'image_url' => ['nullable', 'string', 'max:1000'],
            'title' => [$isSpotlight ? 'nullable' : 'required_unless:display_mode,image_only', 'nullable', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:500'],
            'badge_text' => ['nullable', 'string', 'max:50'],
            'age_rating' => ['nullable', 'string', 'max:20'],
            'genre' => ['nullable', 'string', 'max:100'],
            'release_year' => ['nullable', 'integer', 'min:1900', 'max:2100'],
            'duration_minutes' => ['nullable', 'integer', 'min:1', 'max:1000'],
            'button_text' => ['nullable', 'string', 'max:50'],
            'link_type' => ['required', 'string', $isSpotlight ? 'in:movie,event' : 'in:movie,event,voucher,url'],
            'movie_id' => ['required_if:link_type,movie', 'nullable', 'integer', 'exists:movies,id'],
            'event_id' => ['required_if:link_type,event', 'nullable', 'integer', 'exists:events,id'],
            'target_url' => ['required_if:link_type,url', 'nullable', 'url', 'max:255'],
            'order_priority' => ['sometimes', 'integer', 'min:1'],
            'start_at' => ['nullable', 'date'],
            'end_at' => ['nullable', 'date', 'after_or_equal:start_at'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * Custom validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required_unless' => 'Judul banner wajib diisi jika mode tampilan bukan Image Only.',
            'title.required_if' => 'Judul banner wajib diisi jika mode tampilan adalah Rich Content atau Sorotan.',
            'movie_id.required_if' => 'Film target wajib dipilih jika tipe link adalah Movie.',
            'event_id.required_if' => 'Event target wajib dipilih jika tipe link adalah Event.',
            'target_url.required_if' => 'URL target wajib diisi jika tipe link adalah URL.',
            'image.max' => 'Ukuran file gambar banner tidak boleh melebihi 3MB.',
            'end_at.after_or_equal' => 'Tanggal selesai tayang tidak boleh lebih awal dari tanggal mulai tayang.',
        ];
    }
}
