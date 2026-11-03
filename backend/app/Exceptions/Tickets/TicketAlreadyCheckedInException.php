<?php

namespace App\Exceptions\Tickets;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TicketAlreadyCheckedInException extends Exception
{
    protected ?string $scannedAt;

    protected ?string $scannedByName;

    /**
     * Create a new exception instance.
     */
    public function __construct(
        string $message = 'Tiket ini SUDAH DIGUNAKAN sebelumnya (Double Check-in terdeteksi).',
        ?string $scannedAt = null,
        ?string $scannedByName = null,
        int $code = 409,
        ?Exception $previous = null
    ) {
        $this->scannedAt = $scannedAt;
        $this->scannedByName = $scannedByName;

        parent::__construct($message, $code, $previous);
    }

    public function getScannedAt(): ?string
    {
        return $this->scannedAt;
    }

    public function getScannedByName(): ?string
    {
        return $this->scannedByName;
    }

    /**
     * Render the exception into a standard JSON envelope response (HTTP 409).
     */
    public function render(Request $request): JsonResponse
    {
        $errors = array_filter([
            'scanned_at' => $this->scannedAt,
            'scanned_by' => $this->scannedByName,
        ], fn ($val) => ! is_null($val));

        return response()->json([
            'success' => false,
            'message' => $this->getMessage(),
            'error_code' => 'TICKET_ALREADY_CHECKED_IN',
            'errors' => $errors,
            'server_time' => now()->toISOString(),
        ], 409);
    }
}
