<?php

namespace App\Http\Controllers\Movies\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Movies\V1\RentMovieRequest;
use App\Http\Resources\Movies\V1\MovieRentalOrderResource;
use App\Services\Movies\MovieRentalOrderService;
use Illuminate\Http\JsonResponse;

class MovieRentalOrderController extends Controller
{
    /**
     * Menginisiasi pesanan sewa film digital VoD dan menerbitkan Midtrans Snap Token.
     * POST /api/v1/movies/{id}/rent
     */
    public function rent(RentMovieRequest $request, int $id, MovieRentalOrderService $orderService): JsonResponse
    {
        $user = $request->user();
        $order = $orderService->createRentalOrder(
            user: $user,
            movieId: $id,
            voucherCode: $request->voucherCode()
        );

        return response()->json([
            'success' => true,
            'message' => 'Pesanan sewa film berhasil diinisiasi.',
            'data' => new MovieRentalOrderResource($order),
            'server_time' => now()->toISOString(),
        ], 201);
    }
}
