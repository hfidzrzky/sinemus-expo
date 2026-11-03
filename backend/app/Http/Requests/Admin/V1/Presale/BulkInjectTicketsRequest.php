<?php

namespace App\Http\Requests\Admin\V1\Presale;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class BulkInjectTicketsRequest extends FormRequest
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
            'csv_file' => ['required', 'file', 'mimes:csv,txt', 'max:10240'], // Max 10MB
            'assets_zip' => ['nullable', 'file', 'mimes:zip', 'max:51200'],   // Max 50MB
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
    }

    /**
     * Custom message for validation errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'csv_file.required' => 'Berkas manifest CSV pemesanan tiket bioskop wajib diunggah.',
            'csv_file.file' => 'Berkas CSV tidak valid.',
            'csv_file.mimes' => 'Berkas manifest harus berekstensi CSV atau TXT.',
            'csv_file.max' => 'Ukuran berkas CSV maksimal 10 MB.',
            'assets_zip.file' => 'Berkas aset ZIP tidak valid.',
            'assets_zip.mimes' => 'Berkas arsip gambar QR harus berformat ZIP.',
            'assets_zip.max' => 'Ukuran berkas arsip ZIP maksimal 50 MB.',
            'send_notification.boolean' => 'Pilihan kirim notifikasi harus bernilai boolean.',
        ];
    }
}
