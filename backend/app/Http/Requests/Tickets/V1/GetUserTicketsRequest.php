<?php

namespace App\Http\Requests\Tickets\V1;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class GetUserTicketsRequest extends FormRequest
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
            'status' => ['nullable', 'string', 'in:upcoming,past,all,active,pending'],
            'filter' => ['nullable', 'string', 'in:upcoming,past,all,active,pending'],
        ];
    }

    /**
     * Custom error messages for validation rules.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'status.in' => 'Parameter status hanya boleh: upcoming, past, all, active, atau pending.',
            'filter.in' => 'Parameter filter hanya boleh: upcoming, past, all, active, atau pending.',
        ];
    }
}
