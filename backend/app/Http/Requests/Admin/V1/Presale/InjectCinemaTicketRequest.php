<?php

namespace App\Http\Requests\Admin\V1\Presale;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class InjectCinemaTicketRequest extends FormRequest
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
            'cinema_booking_code' => ['required', 'string', 'max:100'],
            'cinema_passcode' => ['required', 'string', 'max:50'],
            'qr_image' => ['nullable', 'file', 'mimes:png,jpg,jpeg', 'max:5120'], // Max 5MB
            'notes' => ['nullable', 'string', 'max:1000'],
            'send_notification' => ['nullable', 'boolean'],
            'allow_update' => ['nullable', 'boolean'],
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

        if ($this->has('allow_update')) {
            $this->merge([
                'allow_update' => filter_var($this->input('allow_update'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? false,
            ]);
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
            'cinema_booking_code.required' => 'Kode booking bioskop wajib diisi.',
            'cinema_booking_code.string' => 'Kode booking bioskop harus berupa teks valid.',
            'cinema_booking_code.max' => 'Kode booking bioskop maksimal 100 karakter.',
            'cinema_passcode.required' => 'Passcode / PIN cetak bioskop wajib diisi.',
            'cinema_passcode.string' => 'Passcode / PIN cetak bioskop harus berupa teks valid.',
            'cinema_passcode.max' => 'Passcode / PIN cetak bioskop maksimal 50 karakter.',
            'qr_image.file' => 'Berkas QR code harus berupa file yang valid.',
            'qr_image.mimes' => 'Format berkas QR code harus berupa PNG, JPG, atau JPEG.',
            'qr_image.max' => 'Ukuran berkas QR code maksimal 5 MB.',
            'notes.string' => 'Catatan penonton harus berupa teks valid.',
            'notes.max' => 'Catatan penonton maksimal 1000 karakter.',
            'send_notification.boolean' => 'Pilihan kirim notifikasi harus bernilai boolean.',
            'allow_update.boolean' => 'Pilihan pembaruan data tiket harus bernilai boolean.',
        ];
    }
}
