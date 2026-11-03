<?php

namespace App\Http\Requests\Admin\V1\Cloudflare;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class DirectUploadImageRequest extends FormRequest
{
    /**
     * Otorisasi role telah dilindungi middleware 'role:super_admin'.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Aturan validasi request direct upload Cloudflare Images.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'asset_type' => [
                'sometimes',
                'string',
                'in:event_poster,event_backdrop,movie_poster,movie_backdrop,banner,general,movie_look_film,movie_look_films',
            ],
        ];
    }
}
