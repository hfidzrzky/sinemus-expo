<?php

namespace App\Http\Requests\Admin\V1\Vouchers;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class AdminVoucherFilterRequest extends FormRequest
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
            'search' => ['nullable', 'string', 'max:50'],
            'status' => ['nullable', 'string', 'in:all,active,expired,exhausted,inactive'],
            'item_type' => ['nullable', 'string', 'in:all,ticket,movie_rental'],
            'discount_type' => ['nullable', 'string', 'in:all,percentage,fixed'],
            'promo_type' => ['nullable', 'string', 'in:all,direct_discount,voucher_code'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
