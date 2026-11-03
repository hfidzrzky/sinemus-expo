<?php

namespace App\Http\Requests\Admin\V1\Events;

use Carbon\Carbon;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEventRequest extends FormRequest
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
     * Dapatkan aturan validasi untuk pembaruan event.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $eventId = (int) $this->route('id');

        return [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'slug' => [
                'sometimes',
                'nullable',
                'string',
                'max:191',
                Rule::unique('events', 'slug')->ignore($eventId),
            ],
            'event_type' => ['sometimes', 'nullable', 'string', 'in:regular'],
            'seating_type' => ['sometimes', 'required', 'string', 'in:assigned_seating,general_admission'],
            'cinema_partner' => ['sometimes', 'nullable', 'string', 'max:100'],
            'target_screening_month' => ['sometimes', 'nullable', 'string', 'max:50'],
            'description' => ['sometimes', 'required', 'string'],
            'synopsis_short' => ['sometimes', 'required', 'string', 'max:255'],
            'venue_name' => ['sometimes', 'required', 'string', 'max:255'],
            'venue_address' => ['sometimes', 'required', 'string'],
            'city' => ['sometimes', 'required', 'string', 'max:100'],
            'director' => ['sometimes', 'required', 'string', 'max:150'],
            'cast' => ['sometimes', 'required', 'array', 'min:1'],
            'cast.*.actor' => ['required', 'string', 'max:150'],
            'cast.*.role' => ['nullable', 'string', 'max:150'],
            'genre' => ['sometimes', 'nullable', 'array'],
            'genre.*' => ['required', 'string', 'max:50'],
            'duration_minutes' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:600'],
            'release_year' => ['sometimes', 'nullable', 'integer', 'min:1900', 'max:2099'],
            'age_rating' => ['sometimes', 'nullable', 'string', 'in:SU,13+,17+,21+'],
            'cloudflare_teaser_uid' => ['sometimes', 'nullable', 'string', 'max:32'],
            'poster' => ['sometimes', 'nullable', 'file', 'image', 'mimes:jpeg,jpg,png,webp', 'max:2048'],
            'poster_url' => ['sometimes', 'nullable', 'string', 'url', 'max:500'],
            'poster_path' => ['sometimes', 'nullable', 'string', 'max:500'],
            'backdrop' => ['sometimes', 'nullable', 'file', 'image', 'mimes:jpeg,jpg,png,webp', 'max:3072'],
            'backdrop_url' => ['sometimes', 'nullable', 'string', 'url', 'max:500'],
            'sales_start_at' => ['sometimes', 'nullable', 'date'],
            'sales_end_at' => ['sometimes', 'nullable', 'date'],
            'event_concludes_at' => ['sometimes', 'nullable', 'date'],
            'venues' => ['sometimes', 'array'],
            'venues.*.id' => ['sometimes', 'nullable', 'integer'],
            'venues.*.venue_name' => ['required_with:venues', 'string', 'max:255'],
            'venues.*.cinema_partner' => ['nullable', 'string', 'max:100'],
            'venues.*.venue_address' => ['required_with:venues', 'string'],
            'venues.*.city' => ['required_with:venues', 'string', 'max:100'],
            'venues.*.google_maps_url' => ['nullable', 'string', 'url', 'max:500'],
            'venues.*.schedules' => ['sometimes', 'array'],
            'venues.*.schedules.*.id' => ['sometimes', 'nullable', 'integer'],
            'venues.*.schedules.*.studio_name' => ['required_with:venues.*.schedules', 'string', 'max:100'],
            'venues.*.schedules.*.show_time' => ['required_with:venues.*.schedules', 'date'],
            'venues.*.schedules.*.ticket_price' => ['required_with:venues.*.schedules', 'numeric', 'min:0'],
            'venues.*.schedules.*.vip_ticket_price' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'venues.*.schedules.*.total_seats' => ['required_with:venues.*.schedules', 'integer', 'min:1'],
            'venues.*.schedules.*.max_tickets_per_order' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'venues.*.schedules.*.seat_map_config' => ['sometimes', 'nullable', 'array'],
            'venues.*.schedules.*.seat_map_config.rows' => ['required_with:venues.*.schedules.*.seat_map_config', 'integer', 'min:1', 'max:26'],
            'venues.*.schedules.*.seat_map_config.columns' => ['required_with:venues.*.schedules.*.seat_map_config', 'integer', 'min:1', 'max:50'],
            'venues.*.schedules.*.seat_map_config.vip_seats' => ['sometimes', 'nullable', 'array'],
            'venues.*.schedules.*.seat_map_config.vip_seats.*' => ['string'],
            'venues.*.schedules.*.seat_map_config.disabled_seats' => ['sometimes', 'nullable', 'array'],
            'venues.*.schedules.*.seat_map_config.disabled_seats.*' => ['string'],
            'venues.*.schedules.*.seat_map_config.aisle_seats' => ['sometimes', 'nullable', 'array'],
            'venues.*.schedules.*.seat_map_config.aisle_seats.*' => ['string'],
            'venues.*.schedules.*.seat_map_config.total_capacity' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'is_active' => ['sometimes', 'boolean'],
            'is_published' => ['sometimes', 'boolean'],
            'is_featured' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * Normalisasi payload sebelum divalidasi.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('venues') && is_string($this->input('venues'))) {
            $decodedVenues = json_decode($this->input('venues'), true);
            if (is_array($decodedVenues)) {
                $this->merge(['venues' => $decodedVenues]);
            }
        }

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
                $this->merge(['cast' => $normalizedCast]);
            }
        }

        if ($this->has('genre') && is_string($this->input('genre'))) {
            $decodedGenre = json_decode($this->input('genre'), true);
            if (is_array($decodedGenre)) {
                $this->merge(['genre' => $decodedGenre]);
            } elseif ($this->input('genre') === '' || $this->input('genre') === 'null') {
                $this->merge(['genre' => []]);
            }
        }

        // Sinkronisasi otomatis dua arah antara venues[0] dan flat fields
        if ($this->has('venues') && is_array($this->input('venues')) && count($this->input('venues')) > 0) {
            $firstVenue = $this->input('venues')[0];
            if (empty($this->input('venue_name')) && ! empty($firstVenue['venue_name'])) {
                $this->merge(['venue_name' => $firstVenue['venue_name']]);
            }
            if (empty($this->input('venue_address')) && ! empty($firstVenue['venue_address'])) {
                $this->merge(['venue_address' => $firstVenue['venue_address']]);
            }
            if (empty($this->input('city')) && ! empty($firstVenue['city'])) {
                $this->merge(['city' => $firstVenue['city']]);
            }
            if (empty($this->input('cinema_partner')) && ! empty($firstVenue['cinema_partner'])) {
                $this->merge(['cinema_partner' => $firstVenue['cinema_partner']]);
            }
        } elseif ((! $this->has('venues') || empty($this->input('venues'))) && ! empty($this->input('venue_name'))) {
            $this->merge([
                'venues' => [
                    [
                        'venue_name' => $this->input('venue_name'),
                        'cinema_partner' => $this->input('cinema_partner'),
                        'venue_address' => $this->input('venue_address') ?? '-',
                        'city' => $this->input('city') ?? 'Jakarta',
                        'google_maps_url' => $this->input('google_maps_url'),
                    ],
                ],
            ]);
        }

        // Normalisasi is_published alias ke is_active
        if ($this->has('is_published') && ! $this->has('is_active')) {
            $val = filter_var($this->input('is_published'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($val !== null) {
                $this->merge(['is_active' => $val]);
            }
        }

        if ($this->has('is_active')) {
            $val = filter_var($this->input('is_active'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($val !== null) {
                $this->merge(['is_active' => $val]);
            }
        }

        if ($this->has('is_featured')) {
            $val = filter_var($this->input('is_featured'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($val !== null) {
                $this->merge(['is_featured' => $val]);
            }
        }

        // Guard: Jika event tidak aktif (draft), tidak boleh menjadi featured
        if ($this->has('is_active') && ! (bool) $this->input('is_active')) {
            $this->merge(['is_featured' => false]);
        }

        // Normalisasi poster_url dan backdrop_url string kosong menjadi null
        if ($this->has('poster_url') && empty(trim((string) $this->input('poster_url')))) {
            $this->merge(['poster_url' => null]);
        }
        if ($this->has('backdrop_url') && empty(trim((string) $this->input('backdrop_url')))) {
            $this->merge(['backdrop_url' => null]);
        }

        if ($this->has('venues') && is_array($this->input('venues'))) {
            $venues = $this->input('venues');
            foreach ($venues as &$v) {
                if (is_array($v) && array_key_exists('google_maps_url', $v) && empty(trim((string) $v['google_maps_url']))) {
                    $v['google_maps_url'] = null;
                }
            }
            $this->merge(['venues' => $venues]);
        }

        // Otomatis tentukan target_screening_month dari jadwal penayangan bioskop jika tidak disertakan secara manual
        if (empty($this->input('target_screening_month'))) {
            $venues = $this->input('venues', []);
            $firstShowTime = $venues[0]['schedules'][0]['show_time'] ?? $this->input('sales_end_at') ?? $this->input('sales_start_at');

            if (! empty($firstShowTime)) {
                try {
                    $date = Carbon::parse($firstShowTime);
                    $months = [
                        1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
                        5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
                        9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember',
                    ];
                    $monthName = $months[$date->month] ?? $date->format('F');
                    $this->merge([
                        'target_screening_month' => "{$monthName} {$date->year}",
                    ]);
                } catch (\Throwable) {
                    // Abaikan jika string tanggal tidak valid
                }
            }
        }
    }

    /**
     * Pesan validasi deskriptif dalam Bahasa Indonesia.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => 'Judul event penayangan wajib diisi.',
            'event_type.required' => 'Format penayangan wajib dipilih.',
            'seating_type.required' => 'Tipe tempat duduk wajib dipilih.',
            'cinema_partner.required_if' => 'Mitra bioskop (Cinema Partner) wajib diisi untuk format presale bioskop.',
            'description.required' => 'Sinopsis lengkap / deskripsi film wajib diisi.',
            'synopsis_short.required' => 'Sinopsis singkat film wajib diisi.',
            'venue_name.required' => 'Nama venue bioskop / lokasi penayangan wajib diisi.',
            'venue_address.required' => 'Alamat lengkap venue penayangan wajib diisi.',
            'city.required' => 'Kota penayangan wajib diisi.',
            'director.required' => 'Nama sutradara film wajib diisi.',
            'cast.required' => 'Daftar pemeran utama film wajib diisi minimal 1 orang.',
            'cast.min' => 'Daftar pemeran utama film wajib diisi minimal 1 orang.',
            'presale_end_at.after_or_equal' => 'Batas akhir penjualan presale harus sama atau setelah waktu pembukaan.',
        ];
    }
}
