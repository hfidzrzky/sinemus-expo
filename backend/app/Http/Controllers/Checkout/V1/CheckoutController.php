<?php

namespace App\Http\Controllers\Checkout\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Checkout\V1\ApplyVoucherRequest;
use App\Http\Resources\Checkout\V1\OrderStatusResource;
use App\Http\Resources\Checkout\V1\VoucherResource;
use App\Services\Checkout\OrderStatusService;
use App\Services\Checkout\VoucherService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CheckoutController extends Controller
{
    /**
     * Memvalidasi kupon promo dan menghitung potongan harga.
     */
    public function applyVoucher(ApplyVoucherRequest $request, VoucherService $voucherService): JsonResponse
    {
        $itemType = (string) $request->validated('item_type');
        $targetId = $itemType === 'ticket'
            ? $request->validated('event_id')
            : $request->validated('movie_id');

        $result = $voucherService->applyVoucher(
            code: (string) $request->validated('voucher_code'),
            grossAmount: (float) $request->validated('gross_amount'),
            itemType: $itemType,
            targetId: $targetId !== null ? (int) $targetId : null
        );

        return response()->json([
            'success' => true,
            'message' => 'Voucher promo berhasil diterapkan.',
            'data' => new VoucherResource($result),
            'server_time' => now()->toISOString(),
        ], 200);
    }

    /**
     * Polling status pembayaran pesanan (Anti-IDOR).
     */
    public function orderStatus(Request $request, string $order_id, OrderStatusService $statusService): JsonResponse
    {
        $result = $statusService->getOrderStatus(
            user: $request->user(),
            orderId: $order_id
        );

        return response()->json([
            'success' => true,
            'message' => 'Status pesanan berhasil diambil.',
            'data' => new OrderStatusResource($result),
            'server_time' => now()->toISOString(),
        ], 200);
    }

    /**
     * Memverifikasi dan menyinkronkan status pembayaran secara aktif dengan Midtrans.
     * ZERO CLIENT TRUST: Request body diabaikan sepenuhnya, verifikasi 100% Server-to-Server.
     */
    public function syncOrder(Request $request, string $order_id, OrderStatusService $statusService): JsonResponse
    {
        $result = $statusService->getOrderStatus(
            user: $request->user(),
            orderId: $order_id
        );

        return response()->json([
            'success' => true,
            'message' => 'Status pembayaran berhasil disinkronkan.',
            'data' => new OrderStatusResource($result),
            'server_time' => now()->toISOString(),
        ], 200);
    }

    /**
     * Membatalkan pesanan yang belum lunas dan membebaskan alokasi kursi (Anti-IDOR).
     */
    public function cancelOrder(Request $request, string $order_id, OrderStatusService $statusService): JsonResponse
    {
        try {
            $result = $statusService->cancelOrder(
                user: $request->user(),
                orderId: $order_id
            );

            return response()->json([
                'success' => true,
                'message' => 'Pesanan berhasil dibatalkan dan alokasi kursi telah dibebaskan.',
                'data' => new OrderStatusResource($result),
                'server_time' => now()->toISOString(),
            ], 200);
        } catch (\DomainException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'server_time' => now()->toISOString(),
            ], 422);
        }
    }
}
