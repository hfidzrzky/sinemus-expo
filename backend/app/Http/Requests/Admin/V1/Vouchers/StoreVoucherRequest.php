<?php

namespace App\Http\Requests\Admin\V1\Vouchers;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreVoucherRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepare data before validation: trim & uppercase coupon code and normalize aliases.
     */
    protected function prepareForValidation(): void
    {
        $merges = [];
        $merges['promo_type'] = $this->input('promo_type', 'voucher_code');

        if ($this->has('code') && is_string($this->code)) {
            $merges['code'] = strtoupper(trim($this->code));
        }

        if ($this->input('discount_type') === 'fixed_amount') {
            $merges['discount_type'] = 'fixed';
        }

        if ($this->has('quota') && ! $this->has('quota_total')) {
            $merges['quota_total'] = $this->input('quota');
        }

        if ($this->has('min_transaction_amount') && ! $this->has('min_purchase')) {
            $merges['min_purchase'] = $this->input('min_transaction_amount');
        }

        if ($this->input('promo_type') === 'direct_discount' && ! $this->has('min_purchase') && ! $this->has('min_transaction_amount')) {
            $merges['min_purchase'] = 0.00;
        }

        if ($this->input('promo_type') === 'direct_discount' && ! $this->has('quota') && ! $this->has('quota_total')) {
            $merges['quota_total'] = 999999;
        }

        if ($this->has('max_discount_amount') && ! $this->has('max_discount')) {
            $merges['max_discount'] = $this->input('max_discount_amount');
        }

        if ($this->has('target_item') && ! $this->has('item_type')) {
            $targetItem = $this->input('target_item');
            $merges['item_type'] = match ($targetItem) {
                'tickets_only' => 'ticket',
                'vod_only' => 'movie_rental',
                default => 'all',
            };
        }

        if ($this->filled('event_id')) {
            $merges['item_type'] = 'ticket';
            $merges['movie_id'] = null;
        } elseif ($this->filled('movie_id')) {
            $merges['item_type'] = 'movie_rental';
            $merges['event_id'] = null;
        }

        if (! empty($merges)) {
            $this->merge($merges);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'promo_type' => ['sometimes', 'string', 'in:voucher_code,direct_discount'],
            'name' => ['required_if:promo_type,direct_discount', 'nullable', 'string', 'max:255'],
            'code' => [
                'required_if:promo_type,voucher_code',
                'nullable',
                'string',
                'min:3',
                'max:50',
                'regex:/^[A-Z0-9_-]+$/',
                'unique:vouchers,code',
            ],
            'max_uses_per_user' => ['nullable', 'integer', 'min:1'],
            'discount_type' => ['required', 'string', 'in:percentage,fixed,slashed_price'],
            'discount_value' => [
                'required',
                'numeric',
                'min:1',
                function ($attribute, $value, $fail) {
                    if ($this->input('discount_type') === 'percentage' && $value > 100) {
                        $fail('Nilai diskon persentase tidak boleh melebihi 100%.');
                    }
                },
            ],
            'min_purchase' => ['required', 'numeric', 'min:0'],
            'max_discount' => ['nullable', 'numeric', 'min:1'],
            'item_type' => ['required', 'string', 'in:all,ticket,movie_rental'],
            'event_id' => ['nullable', 'integer', 'exists:events,id'],
            'movie_id' => ['nullable', 'integer', 'exists:movies,id'],
            'quota_total' => ['required', 'integer', 'min:1'],
            'valid_from' => ['required', 'date'],
            'valid_until' => ['required', 'date', 'after:valid_from'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * Custom messages for validation errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required_if' => 'Nama promosi wajib diisi untuk diskon langsung (coret harga).',
            'code.regex' => 'Kode voucher hanya boleh berisi huruf kapital alfanumerik tanpa spasi.',
            'code.unique' => 'Kode voucher ini sudah digunakan, gunakan kode lain.',
            'valid_until.after' => 'Tanggal berakhir voucher harus setelah tanggal mulai berlaku.',
        ];
    }
}
