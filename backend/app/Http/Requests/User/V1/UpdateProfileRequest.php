<?php

namespace App\Http\Requests\User\V1;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Normalisasi nomor telepon sebelum proses validasi dilakukan.
     * Standarisasi format: awalan +628xx dan 628xx dikonversi menjadi format baku 08xx.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('phone_number') && is_string($this->phone_number)) {
            $phone = trim($this->phone_number);
            if (str_starts_with($phone, '+628')) {
                $phone = '08'.substr($phone, 4);
            } elseif (str_starts_with($phone, '628')) {
                $phone = '08'.substr($phone, 3);
            }
            $this->merge(['phone_number' => $phone]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $userId = $this->user()?->id;

        return [
            'name' => ['sometimes', 'nullable', 'string', 'min:2', 'max:100'],
            'birth_date' => ['sometimes', 'nullable', 'date', 'before:today'],
            'phone_number' => [
                'sometimes',
                'nullable',
                'string',
                'regex:/^08[0-9]{8,12}$/',
                Rule::unique('users', 'phone_number')->ignore($userId),
            ],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.min' => 'Nama lengkap minimal 2 karakter.',
            'name.max' => 'Nama lengkap maksimal 100 karakter.',
            'birth_date.date' => 'Format tanggal lahir tidak valid.',
            'birth_date.before' => 'Tanggal lahir harus sebelum hari ini.',
            'phone_number.regex' => 'Format nomor WhatsApp tidak valid. Gunakan format nomor seluler Indonesia (08xx / +628xx, 10-14 digit).',
            'phone_number.unique' => 'Nomor WhatsApp ini sudah terdaftar pada akun lain.',
        ];
    }
}
