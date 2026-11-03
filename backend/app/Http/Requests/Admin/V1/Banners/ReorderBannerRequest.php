<?php

namespace App\Http\Requests\Admin\V1\Banners;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ReorderBannerRequest extends FormRequest
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
     * Normalisasi input: jika klien mengirim format banner_ids [id1, id2, ...],
     * otomatis susun menjadi struktur items [{id: id1, order_priority: 1}, ...].
     */
    protected function prepareForValidation(): void
    {
        $bannerIds = $this->input('banner_ids');
        if (is_array($bannerIds) && ! empty($bannerIds) && ! $this->filled('items')) {
            $items = [];
            foreach ($bannerIds as $index => $id) {
                $items[] = [
                    'id' => (int) $id,
                    'order_priority' => $index + 1,
                ];
            }
            $this->merge(['items' => $items]);
        }
    }

    /**
     * Dapatkan aturan validasi untuk reordering urutan banner.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'banner_ids' => ['sometimes', 'array'],
            'banner_ids.*' => ['integer', 'exists:banners,id'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.id' => ['required', 'integer', 'exists:banners,id'],
            'items.*.order_priority' => ['required', 'integer', 'min:1'],
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
            'items.required' => 'Daftar item urutan banner wajib disertakan.',
            'items.min' => 'Minimal satu item banner harus disertakan untuk pembaruan urutan.',
            'items.*.id.exists' => 'Salah satu ID banner yang dikirim tidak ditemukan di sistem.',
            'items.*.order_priority.min' => 'Prioritas urutan banner harus bernilai minimal 1.',
        ];
    }
}
