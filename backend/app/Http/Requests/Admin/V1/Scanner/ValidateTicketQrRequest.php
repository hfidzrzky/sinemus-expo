<?php

namespace App\Http\Requests\Admin\V1\Scanner;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ValidateTicketQrRequest extends FormRequest
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
            'qr_hash' => ['required', 'string', 'max:255'],
            'device_info' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * Custom message for validation errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'qr_hash.required' => 'Hash QR tiket wajib dikirimkan.',
            'qr_hash.string' => 'Hash QR tiket harus berupa teks valid.',
            'qr_hash.max' => 'Hash QR tiket maksimal 255 karakter.',
            'device_info.string' => 'Informasi perangkat harus berupa teks valid.',
            'device_info.max' => 'Informasi perangkat maksimal 255 karakter.',
        ];
    }
}
