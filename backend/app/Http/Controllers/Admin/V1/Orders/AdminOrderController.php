<?php

namespace App\Http\Controllers\Admin\V1\Orders;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\V1\Orders\AdminOrderFilterRequest;
use App\Http\Requests\Admin\V1\Orders\ResendNotificationRequest;
use App\Http\Resources\Admin\V1\Orders\AdminOrderDetailResource;
use App\Http\Resources\Admin\V1\Orders\AdminOrderListResource;
use App\Services\Admin\Orders\AdminOrderAuditService;
use DomainException;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminOrderController extends Controller
{
    public function __construct(
        protected AdminOrderAuditService $orderAuditService
    ) {}

    /**
     * Menampilkan riwayat pesanan (Tiket & VoD) dengan paginasi dan filter audit finansial.
     */
    public function index(AdminOrderFilterRequest $request): JsonResponse
    {
        $orders = $this->orderAuditService->getPaginatedOrders($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Daftar riwayat pesanan berhasil diambil.',
            'data' => AdminOrderListResource::collection($orders->items()),
            'meta' => [
                'current_page' => (int) $orders->currentPage(),
                'from' => $orders->firstItem(),
                'last_page' => (int) $orders->lastPage(),
                'per_page' => (int) $orders->perPage(),
                'to' => $orders->lastItem(),
                'total' => (int) $orders->total(),
            ],
            'server_time' => now()->toISOString(),
        ], 200);
    }

    /**
     * Menampilkan rincian detail audit pesanan untuk Drawer Admin.
     */
    public function show(string $order_id): JsonResponse
    {
        $order = $this->orderAuditService->getOrderDetail($order_id);

        return response()->json([
            'success' => true,
            'message' => 'Detail riwayat pesanan berhasil diambil.',
            'data' => new AdminOrderDetailResource($order),
            'server_time' => now()->toISOString(),
        ], 200);
    }

    /**
     * Mengirim ulang notifikasi email tiket bioskop kepada pembeli.
     */
    public function resend(ResendNotificationRequest $request, string $order_id): JsonResponse
    {
        $channel = (string) $request->input('channel', 'email');

        try {
            $result = $this->orderAuditService->resendTicketNotification($order_id, $channel);

            return response()->json([
                'success' => true,
                'message' => 'Notifikasi tiket berhasil dikirim ulang ke email pembeli.',
                'data' => $result,
                'server_time' => now()->toISOString(),
            ], 200);
        } catch (DomainException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error_code' => 'NOTIFICATION_RESEND_FAILED',
                'server_time' => now()->toISOString(),
            ], 422);
        }
    }

    /**
     * Mengekspor riwayat transaksi ke dalam file CSV terstruktur.
     */
    public function export(AdminOrderFilterRequest $request): StreamedResponse
    {
        return $this->orderAuditService->exportOrdersCsv($request->validated());
    }
}
