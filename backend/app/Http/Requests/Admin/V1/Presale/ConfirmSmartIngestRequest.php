<?php

namespace App\Http\Requests\Admin\V1\Presale;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ConfirmSmartIngestRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'approved_items' => ['required', 'array', 'min:1'],
            'approved_items.*.transaction_id' => ['required', 'integer', 'exists:event_transactions,id'],
            'approved_items.*.detected_booking_code' => ['required', 'string', 'max:100'],
            'approved_items.*.detected_passcode' => ['required', 'string', 'max:50'],
            'approved_items.*.r2_qr_path' => ['required', 'string', 'max:500'],
            'approved_items.*.notes' => ['nullable', 'string', 'max:1000'],
            'send_notification' => ['nullable', 'boolean'],
        ];
    }

    /**
     * Prepare inputs for validation.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('send_notification')) {
            $this->merge([
                'send_notification' => filter_var($this->input('send_notification'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? true,
            ]);
        }

        if (is_array($this->input('approved_items'))) {
            $normalizedItems = array_map(function ($item) {
                if (! is_array($item)) {
                    return $item;
                }

                return [
                    'transaction_id' => $item['transaction_id'] ?? null,
                    'detected_booking_code' => $item['detected_booking_code'] ?? ($item['cinema_booking_code'] ?? null),
                    'detected_passcode' => $item['detected_passcode'] ?? ($item['cinema_passcode'] ?? null),
                    'r2_qr_path' => $item['r2_qr_path'] ?? ($item['cinema_qr_image_path'] ?? null),
                    'notes' => $item['notes'] ?? null,
                ];
            }, $this->input('approved_items'));

            $this->merge(['approved_items' => $normalizedItems]);
        }
    }

    /**
     * Custom message for validation errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'approved_items.required' => 'Daftar tiket yang disetujui wajib dikirimkan.',
            'approved_items.array' => 'Format daftar tiket harus berupa array.',
            'approved_items.min' => 'Minimal 1 tiket harus disetujui untuk diproses.',
            'approved_items.*.transaction_id.required' => 'ID transaksi wajib disertakan.',
            'approved_items.*.transaction_id.integer' => 'ID transaksi harus berupa angka integer.',
            'approved_items.*.transaction_id.exists' => 'Transaksi tidak ditemukan dalam sistem.',
            'approved_items.*.detected_booking_code.required' => 'Kode booking bioskop wajib disertakan.',
            'approved_items.*.detected_passcode.required' => 'Passcode cetak bioskop wajib disertakan.',
            'approved_items.*.r2_qr_path.required' => 'Path storage QR R2 sementara wajib disertakan.',
            'send_notification.boolean' => 'Pilihan kirim notifikasi harus bernilai boolean.',
        ];
    }
}
