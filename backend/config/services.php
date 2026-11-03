<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Google, Midtrans, Mailgun, Postmark, AWS, and more. This file provides
    | the de facto location for this type of information, allowing packages
    | to have a conventional file to locate the various service credentials.
    |
    */

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect_uri' => env('GOOGLE_REDIRECT_URI'),
    ],

    'midtrans' => [
        'server_key' => env('MIDTRANS_SERVER_KEY'),
        'client_key' => env('MIDTRANS_CLIENT_KEY'),
        'is_production' => (bool) env('MIDTRANS_IS_PRODUCTION', false),
    ],

    'cloudflare' => [
        'account_id' => env('CLOUDFLARE_STREAM_ACCOUNT_ID'),
        'stream_api_token' => env('CLOUDFLARE_STREAM_API_TOKEN'),
        'stream_key_id' => env('CLOUDFLARE_STREAM_KEY_ID'),
        'stream_pem_key' => env('CLOUDFLARE_STREAM_PEM_KEY'),
        'images_account_hash' => env('CLOUDFLARE_IMAGES_ACCOUNT_HASH'),
        'images_api_token' => env('CLOUDFLARE_IMAGES_API_TOKEN') ?: env('CLOUDFLARE_STREAM_API_TOKEN'),
    ],

];
