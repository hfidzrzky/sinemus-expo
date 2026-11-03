<?php

namespace App\Http\Controllers\Checkout\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Checkout\V1\MidtransWebhookRequest;
use App\Services\Checkout\MidtransWebhookDispatcherService;
use Illuminate\Http\JsonResponse;

class MidtransWebhookController extends Controller
{
    public function __construct(
        protected MidtransWebhookDispatcherService $dispatcherService
    ) {}

    /**
     * Menangani webhook callback notifikasi dari Midtrans Payment Gateway secara idempoten.
     */
    public function handle(MidtransWebhookRequest $request): JsonResponse
    {
        $result = $this->dispatcherService->handleWebhook($request->validated());

        return response()->json([
            'success' => true,
            'message' => $result['message'] ?? 'Notifikasi pembayaran berhasil diproses.',
            'server_time' => now()->toIso8601String(),
        ], 200);
    }
}
