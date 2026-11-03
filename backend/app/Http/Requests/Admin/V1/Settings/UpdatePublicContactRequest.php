<?php

namespace App\Http\Requests\Admin\V1\Settings;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePublicContactRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'whatsapp_admin_number' => [
                'required',
                'string',
                'regex:/^(08|\+628|628)[0-9]{8,13}$/',
            ],
            'whatsapp_prefill_template' => ['required', 'string', 'max:500'],
            'support_email' => ['required', 'email:rfc,dns', 'max:255'],
            'ticket_sender_name' => ['required', 'string', 'max:100'],
            'ticket_sender_email' => ['required', 'email:rfc,dns', 'max:255'],
            'social_media' => ['required', 'array'],
            'social_media.instagram' => ['required', 'url', 'max:255'],
            'social_media.tiktok' => ['nullable', 'url', 'max:255'],
            'social_media.youtube' => ['nullable', 'url', 'max:255'],
            'operating_hours' => ['required', 'string', 'max:100'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'whatsapp_admin_number.regex' => 'Format nomor WhatsApp tidak valid. Gunakan format Indonesia (misal: 081234567890 atau 6281234567890).',
            'support_email.email' => 'Format email layanan pelanggan tidak valid.',
            'ticket_sender_email.email' => 'Format email pengirim tiket tidak valid.',
            'social_media.instagram.url' => 'Format tautan Instagram harus berupa URL yang valid.',
        ];
    }
}
