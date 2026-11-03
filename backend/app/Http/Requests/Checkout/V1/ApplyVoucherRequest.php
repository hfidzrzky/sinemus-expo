<?php

namespace App\Http\Requests\Checkout\V1;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ApplyVoucherRequest extends FormRequest
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
            'voucher_code' => ['required', 'string', 'max:50'],
            'gross_amount' => ['required', 'numeric', 'min:0'],
            'item_type' => ['required', 'string', 'in:ticket,movie_rental'],
            'event_id' => ['nullable', 'integer', 'exists:events,id'],
            'movie_id' => ['nullable', 'integer', 'exists:movies,id'],
        ];
    }

    /**
     * Custom attribute names for validation errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'voucher_code' => 'kode voucher',
            'gross_amount' => 'total belanja (gross amount)',
            'item_type' => 'tipe item transaksi',
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
            'voucher_code.required' => 'Kode voucher wajib diisi.',
            'gross_amount.required' => 'Nominal total belanja wajib diisi.',
            'gross_amount.numeric' => 'Nominal total belanja harus berupa angka.',
            'gross_amount.min' => 'Nominal total belanja tidak boleh bernilai negatif.',
            'item_type.required' => 'Tipe item transaksi wajib dipilih.',
            'item_type.in' => 'Tipe item transaksi hanya boleh ticket atau movie_rental.',
        ];
    }
}
