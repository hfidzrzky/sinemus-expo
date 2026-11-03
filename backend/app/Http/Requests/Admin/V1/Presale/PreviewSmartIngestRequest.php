<?php

namespace App\Http\Requests\Admin\V1\Presale;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class PreviewSmartIngestRequest extends FormRequest
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
            'file' => ['required', 'file', 'mimes:pdf,zip', 'max:25600'], // Max 25MB
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
            'file.required' => 'Berkas Master PDF atau arsip ZIP tiket bioskop wajib diunggah.',
            'file.file' => 'Berkas yang diunggah tidak valid.',
            'file.mimes' => 'Format berkas harus berupa PDF atau ZIP.',
            'file.max' => 'Ukuran berkas maksimal 25 MB.',
        ];
    }
}
