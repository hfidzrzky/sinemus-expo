<?php

namespace App\Http\Controllers\Booking\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Booking\V1\ReserveSeatsRequest;
use App\Http\Resources\Booking\V1\SeatReservationResource;
use App\Services\Booking\SeatReservationService;
use Illuminate\Http\JsonResponse;

class BookingController extends Controller
{
    /**
     * Mengunci kursi bioskop selama $lockMinutes menit dan membuat draft transaksi.
     */
    public function reserve(ReserveSeatsRequest $request, SeatReservationService $service): JsonResponse
    {
        $result = $service->reserve(
            user: $request->user(),
            scheduleId: (int) $request->validated('schedule_id'),
            seatIds: $request->validated('seat_ids'),
            quantity: $request->validated('quantity') ? (int) $request->validated('quantity') : null,
            voucherCode: $request->validated('voucher_code')
        );

        $lockMinutes = (int) $result['lock_duration_minutes'];

        return response()->json([
            'success' => true,
            'message' => "Kursi berhasil dikunci selama {$lockMinutes} menit.",
            'data' => new SeatReservationResource($result),
            'server_time' => now()->toISOString(),
        ], 201);
    }
}
