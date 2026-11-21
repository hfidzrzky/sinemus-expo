<?php

namespace App\Http\Requests\Admin\V1\Scanner;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ScannerSessionsFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'scope' => ['nullable', 'string', 'in:all,today,upcoming'],
            'search' => ['nullable', 'string', 'max:100'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'scope.in' => 'Scope sesi harus bernilai all, today, atau upcoming.',
            'search.max' => 'Kata kunci pencarian maksimal 100 karakter.',
        ];
    }
}
