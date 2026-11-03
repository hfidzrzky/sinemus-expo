<?php

namespace App\Http\Controllers\Admin\V1\Scanner;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\V1\Scanner\ValidateTicketQrRequest;
use App\Http\Resources\Admin\V1\Scanner\TicketValidationResource;
use App\Services\Admin\Scanner\TicketValidationService;
use Illuminate\Http\JsonResponse;

class AdminTicketScannerController extends Controller
{
    public function __construct(
        protected TicketValidationService $ticketValidationService
    ) {}

    /**
     * Memvalidasi hash QR tiket dari kamera mobile scanner dan menandai check-in.
     */
    public function validateQr(ValidateTicketQrRequest $request): JsonResponse
    {
        $staffUser = $request->user();

        $transaction = $this->ticketValidationService->validateAndCheckin(
            $request->validated(),
            $staffUser,
            $request->ip()
        );

        return response()->json([
            'success' => true,
            'message' => 'Tiket valid! Penonton berhasil check-in ke venue.',
            'data' => (new TicketValidationResource($transaction))->resolve($request),
            'server_time' => now()->toISOString(),
        ], 200);
    }
}
