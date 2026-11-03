<?php

namespace App\Http\Controllers\Tickets\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tickets\V1\GetUserTicketsRequest;
use App\Http\Resources\Tickets\V1\TicketDetailResource;
use App\Http\Resources\Tickets\V1\TicketItemResource;
use App\Models\EventTransaction;
use App\Services\Tickets\TicketPdfService;
use App\Services\Tickets\UserTicketService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
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

    /**
     * Menyajikan berkas binary QR tiket bioskop secara streaming (Anti-ISP Blockage & Anti-IDOR).
     * Terlindungi dengan verifikasi hash_equals terhadap qr_hash tiket atau token Sanctum aktif.
     */
    public function streamQrImage(Request $request, string $orderId): Response
    {
        /** @var EventTransaction|null $transaction */
        $transaction = EventTransaction::where('order_id', $orderId)->first();

        if (! $transaction) {
            abort(404, 'Tiket tidak ditemukan.');
        }

        // Anti-IDOR: Validasi apakah request membawa hash yang valid atau user yang terotentikasi
        $providedHash = (string) $request->query('h', '');
        $isHashValid = ! empty($transaction->qr_hash) && ! empty($providedHash) && hash_equals($transaction->qr_hash, $providedHash);

        $user = $request->user() ?: auth('sanctum')->user();
        $isOwnerAuthenticated = $user && (int) $user->id === (int) $transaction->user_id;

        if (! $isHashValid && ! $isOwnerAuthenticated) {
            abort(403, 'Akses tidak diizinkan. Parameter hash atau autentikasi tidak valid.');
        }

        $path = (string) $transaction->cinema_qr_image_path;
        if (empty($path) || str_contains($path, '..') || str_starts_with($path, '/') || str_starts_with($path, '\\')) {
            abort(404, 'Gambar barcode belum tersedia.');
        }

        $updatedAt = $transaction->updated_at?->timestamp ?? 0;
        $cacheKey = "cinema_ticket_qr_stream_{$transaction->id}_{$updatedAt}";

        /** @var array{binary: string, mime: string}|null $streamData */
        $streamData = Cache::remember($cacheKey, 86400, function () use ($path) {
            $isR2Configured = ! empty(config('filesystems.disks.r2.key')) && ! empty(config('filesystems.disks.r2.bucket'));
            $disks = ($isR2Configured || app()->runningUnitTests())
                ? ['r2', 'public']
                : ['public'];

            $binary = null;
            $mime = 'image/png';

            foreach ($disks as $disk) {
                try {
                    $binary = Storage::disk($disk)->get($path);
                    if (! empty($binary)) {
                        $finfo = new \finfo(FILEINFO_MIME_TYPE);
                        $mime = $finfo->buffer($binary) ?: 'image/png';
                        break;
                    }
                } catch (\Throwable) {
                    // Coba disk berikutnya
                }
            }

            // Self-Healing: Jika path mencatat temp tapi berkas sudah dipromosikan ke permanent
            if (empty($binary)) {
                $filename = basename($path);
                $yearMonth = date('Y/m');
                $altPermanent = "cinema-tickets/permanent/{$yearMonth}/{$filename}";
                foreach ($disks as $disk) {
                    try {
                        $binary = Storage::disk($disk)->get($altPermanent);
                        if (! empty($binary)) {
                            $finfo = new \finfo(FILEINFO_MIME_TYPE);
                            $mime = $finfo->buffer($binary) ?: 'image/png';
                            break;
                        }
                    } catch (\Throwable) {
                        // Coba disk lain
                    }
                }
            }

            if (empty($binary)) {
                return null;
            }

            return [
                'binary' => $binary,
                'mime' => $mime,
            ];
        });

        if (empty($streamData) || empty($streamData['binary'])) {
            Cache::forget($cacheKey);
            abort(404, 'Berkas barcode tidak ditemukan pada penyimpanan server.');
        }

        return response($streamData['binary'], 200, [
            'Content-Type' => $streamData['mime'],
            'Content-Length' => strlen($streamData['binary']),
            'Cache-Control' => 'public, max-age=86400, immutable',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
