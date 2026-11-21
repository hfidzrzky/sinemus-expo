<?php

namespace App\Exceptions\Tickets;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TicketAlreadyCheckedInException extends Exception
{
    protected ?string $scannedAt;

    protected ?string $scannedByName;

    protected ?string $buyerName;

    /**
     * @var array<string>|null
     */
    protected ?array $seatCodes;

    protected ?string $ticketCode;

    protected ?int $ticketQuantity;

    /**
     * Create a new exception instance.
     *
     * @param  array<string>|null  $seatCodes
     */
    public function __construct(
        string $message = 'Tiket ini SUDAH DIGUNAKAN sebelumnya (Double Check-in terdeteksi).',
        ?string $scannedAt = null,
        ?string $scannedByName = null,
        ?string $buyerName = null,
        ?array $seatCodes = null,
        ?string $ticketCode = null,
        ?int $ticketQuantity = null,
        int $code = 409,
        ?Exception $previous = null
    ) {
        $this->scannedAt = $scannedAt;
        $this->scannedByName = $scannedByName;
        $this->buyerName = $buyerName;
        $this->seatCodes = $seatCodes;
        $this->ticketCode = $ticketCode;
        $this->ticketQuantity = $ticketQuantity;

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

    public function getBuyerName(): ?string
    {
        return $this->buyerName;
    }

    /**
     * @return array<string>|null
     */
    public function getSeatCodes(): ?array
    {
        return $this->seatCodes;
    }

    public function getTicketCode(): ?string
    {
        return $this->ticketCode;
    }

    public function getTicketQuantity(): ?int
    {
        return $this->ticketQuantity;
    }

    /**
     * Render the exception into a standard JSON envelope response (HTTP 409).
     */
    public function render(Request $request): JsonResponse
    {
        $errors = array_filter([
            'scanned_at' => $this->scannedAt,
            'scanned_by' => $this->scannedByName,
            'buyer_name' => $this->buyerName,
            'seat_codes' => $this->seatCodes,
            'ticket_code' => $this->ticketCode,
            'ticket_quantity' => $this->ticketQuantity,
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
