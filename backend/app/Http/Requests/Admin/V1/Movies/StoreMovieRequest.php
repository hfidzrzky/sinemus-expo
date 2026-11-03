<?php

namespace App\Http\Requests\Admin\V1\Movies;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreMovieRequest extends FormRequest
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
     * Persiapkan dan sanitasi data form sebelum divalidasi.
     * Mendukung sinkronisasi format frontend React dan kolom database Eloquent.
     */
    protected function prepareForValidation(): void
    {
        $mergeData = [];

        // Normalisasi alias synopsis (frontend synopsis_full -> synopsis)
        if (! $this->filled('synopsis') && $this->filled('synopsis_full')) {
            $mergeData['synopsis'] = (string) $this->input('synopsis_full');
        }

        // Normalisasi alias poster (frontend poster_url -> poster_path)
        if (! $this->filled('poster_path') && $this->filled('poster_url')) {
            $mergeData['poster_path'] = (string) $this->input('poster_url');
        }

        // Normalisasi alias backdrop (frontend backdrop_url -> backdrop_path)
        if (! $this->filled('backdrop_path') && $this->filled('backdrop_url')) {
            $mergeData['backdrop_path'] = (string) $this->input('backdrop_url');
        }

        // Normalisasi alias rental_price -> price
        if (! $this->filled('price') && $this->has('rental_price')) {
            $mergeData['price'] = $this->input('rental_price');
        }

        // Jika access_model adalah 'free', set harga default 0
        if ($this->input('access_model') === 'free' && (! $this->has('price') || $this->input('price') === null)) {
            $mergeData['price'] = 0.00;
        }

        // Normalisasi alias active_rental_duration_hours -> rental_duration_hours
        if (! $this->filled('rental_duration_hours') && $this->has('active_rental_duration_hours')) {
            $mergeData['rental_duration_hours'] = $this->input('active_rental_duration_hours');
        }

        // Normalisasi cast jika berupa array of objects [{actor: '...', role: '...'}, ...] atau string
        if ($this->has('cast')) {
            $rawCast = $this->input('cast');
            if (is_string($rawCast)) {
                $decodedCast = json_decode($rawCast, true);
                if (is_array($decodedCast)) {
                    $rawCast = $decodedCast;
                }
            }

            if (is_array($rawCast)) {
                $normalizedCast = [];
                foreach ($rawCast as $item) {
                    if (is_string($item)) {
                        $actor = trim($item);
                        if ($actor !== '') {
                            $normalizedCast[] = [
                                'actor' => $actor,
                                'role' => null,
                            ];
                        }
                    } elseif (is_array($item)) {
                        $actor = trim((string) ($item['actor'] ?? $item['name'] ?? ''));
                        $roleRaw = $item['role'] ?? $item['character'] ?? null;
                        $role = $roleRaw !== null && trim((string) $roleRaw) !== '' ? trim((string) $roleRaw) : null;
                        if ($actor !== '') {
                            $normalizedCast[] = [
                                'actor' => $actor,
                                'role' => $role,
                            ];
                        }
                    }
                }
                $mergeData['cast'] = $normalizedCast;
            }
        }

        // Sanitasi Cloudflare UIDs menjadi lowercase hex string
        if ($this->filled('cloudflare_video_uid')) {
            $mergeData['cloudflare_video_uid'] = strtolower(trim((string) $this->input('cloudflare_video_uid')));
        }
        if ($this->filled('cloudflare_trailer_uid')) {
            $mergeData['cloudflare_trailer_uid'] = strtolower(trim((string) $this->input('cloudflare_trailer_uid')));
        }

        if (! empty($mergeData)) {
            $this->merge($mergeData);
        }
    }

    /**
     * Dapatkan aturan validasi untuk pembuatan film baru.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['sometimes', 'nullable', 'string', 'max:191', 'unique:movies,slug'],
            'synopsis' => ['required', 'string', 'min:20'],
            'director' => ['required', 'string', 'max:150'],
            'cast' => ['required', 'array', 'min:1'],
            'cast.*.actor' => ['required', 'string', 'max:150'],
            'cast.*.role' => ['nullable', 'string', 'max:150'],
            'genre' => ['required'], // String atau array of string
            'genre.*' => ['sometimes', 'string', 'max:50'],
            'age_rating' => ['required', 'string', 'in:SU,13+,17+,21+'],
            'release_year' => ['required', 'integer', 'min:1900', 'max:2099'],
            'duration_minutes' => ['required', 'integer', 'min:1', 'max:600'],
            'poster_path' => ['required', 'string', 'max:255'],
            'backdrop_path' => ['required', 'string', 'max:255'],
            'look_films' => ['sometimes', 'nullable', 'array'],
            'look_films.*' => ['string'],
            'cloudflare_video_uid' => ['required', 'string', 'size:32', 'regex:/^[a-f0-9]{32}$/i'],
            'cloudflare_trailer_uid' => ['sometimes', 'nullable', 'string', 'size:32', 'regex:/^[a-f0-9]{32}$/i'],
            'access_model' => ['required', 'string', 'in:rental,free'],
            'price' => ['required', 'numeric', $this->input('access_model') === 'rental' ? 'min:1000' : 'min:0'],
            'rental_duration_hours' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:720'],
            'is_published' => ['sometimes', 'boolean'],
            'is_featured' => ['sometimes', 'boolean'],
            'scheduled_publish_at' => ['sometimes', 'nullable', 'date'],
            'scheduled_unpublish_at' => ['sometimes', 'nullable', 'date', 'after:scheduled_publish_at'],
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
            'title.required' => 'Judul film wajib diisi.',
            'title.max' => 'Judul film maksimal 255 karakter.',
            'slug.unique' => 'Slug film sudah digunakan oleh film lain.',
            'slug.max' => 'Slug film maksimal 191 karakter.',
            'synopsis.required' => 'Sinopsis film wajib diisi.',
            'synopsis.min' => 'Sinopsis film minimal 20 karakter.',
            'director.required' => 'Nama sutradara film wajib diisi.',
            'director.max' => 'Nama sutradara film maksimal 150 karakter.',
            'cast.required' => 'Daftar pemeran utama film wajib diisi minimal 1 orang.',
            'cast.min' => 'Daftar pemeran utama film wajib diisi minimal 1 orang.',
            'cast.*.actor.required' => 'Nama pemeran tidak boleh kosong.',
            'genre.required' => 'Genre film wajib dipilih minimal 1 kategori.',
            'age_rating.required' => 'Klasifikasi usia sensor film wajib dipilih.',
            'age_rating.in' => 'Klasifikasi usia film harus salah satu dari: SU, 13+, 17+, atau 21+.',
            'release_year.required' => 'Tahun rilis film wajib diisi.',
            'release_year.min' => 'Tahun rilis film minimal tahun 1900.',
            'release_year.max' => 'Tahun rilis film maksimal tahun 2099.',
            'duration_minutes.required' => 'Durasi film wajib diisi.',
            'duration_minutes.min' => 'Durasi film minimal 1 menit.',
            'duration_minutes.max' => 'Durasi film maksimal 600 menit (10 jam).',
            'poster_path.required' => 'Poster portrait resmi film (2:3) wajib diisi.',
            'backdrop_path.required' => 'Backdrop banner lanskap film (16:9) wajib diisi.',
            'cloudflare_video_uid.required' => 'Cloudflare Stream Video UID (Full Movie) wajib diisi.',
            'cloudflare_video_uid.size' => 'Cloudflare Stream Video UID harus tepat 32 karakter.',
            'cloudflare_video_uid.regex' => 'Format Cloudflare Stream Video UID harus berupa 32 karakter heksadesimal.',
            'cloudflare_trailer_uid.size' => 'Cloudflare Stream Trailer UID harus tepat 32 karakter.',
            'cloudflare_trailer_uid.regex' => 'Format Cloudflare Stream Trailer UID harus berupa 32 karakter heksadesimal.',
            'access_model.required' => 'Model akses tonton film wajib dipilih.',
            'access_model.in' => 'Model akses harus salah satu dari: rental atau free.',
            'price.required' => 'Tarif sewa film wajib diisi.',
            'price.numeric' => 'Tarif sewa film harus berupa angka nominal valid.',
            'price.min' => $this->input('access_model') === 'rental'
                ? 'Tarif sewa film berbayar minimal Rp 1.000.'
                : 'Tarif sewa film tidak boleh bernilai negatif.',
            'rental_duration_hours.min' => 'Durasi sewa minimal 1 jam.',
            'rental_duration_hours.max' => 'Durasi sewa maksimal 720 jam (30 hari).',
            'scheduled_unpublish_at.after' => 'Jadwal berakhir publikasi harus setelah jadwal mulai publikasi.',
        ];
    }
}
