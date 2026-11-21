<?php

namespace App\Http\Controllers\Tickets\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tickets\V1\GetUserTicketsRequest;
use App\Http\Resources\Tickets\V1\TicketDetailResource;
use App\Http\Resources\Tickets\V1\TicketItemResource;
use App\Services\Tickets\TicketPdfService;
use App\Services\Tickets\UserTicketService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TicketController extends Controller
{
    /**
     * Menampilkan daftar tiket screening fisik milik pengguna (mendukung filter upcoming, past, all).
     */
    public function index(GetUserTicketsRequest $request, UserTicketService $ticketService): JsonResponse
    {
        $userId = (int) $request->user()->id;
        $filter = (string) ($request->validated('status') ?? $request->validated('filter') ?? 'active');

        $tickets = $ticketService->getUserTickets($userId, $filter);

        return response()->json([
            'success' => true,
            'message' => 'Daftar tiket penonton berhasil diambil.',
            'data' => TicketItemResource::collection($tickets),
            'server_time' => now()->toISOString(),
        ], 200);
    }

    /**
     * Menampilkan detail lengkap e-tiket penonton beserta hash QR code (Anti-IDOR).
     */
    public function show(Request $request, string $code, UserTicketService $ticketService): JsonResponse
    {
        $userId = (int) $request->user()->id;

        $ticket = $ticketService->getTicketByCode($userId, $code);

        return response()->json([
            'success' => true,
            'message' => 'Detail e-tiket penonton berhasil diambil.',
            'data' => new TicketDetailResource($ticket),
            'server_time' => now()->toISOString(),
        ], 200);
    }

    /**
     * Mengunduh e-tiket atau bukti reservasi resmi dalam format PDF terproteksi (Anti-IDOR).
     */
    public function downloadPdf(Request $request, string $orderId, TicketPdfService $pdfService): Response
    {
        $userId = (int) $request->user()->id;

        $pdfData = $pdfService->generateTicketPdf($userId, $orderId);

        return response($pdfData['content'], 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$pdfData['filename'].'"',
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, no-cache, no-store, must-revalidate',
        ]);
    }
}
