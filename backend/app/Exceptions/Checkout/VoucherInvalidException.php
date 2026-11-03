<?php

namespace App\Exceptions\Checkout;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VoucherInvalidException extends Exception
{
    protected string $errorCode;

    public function __construct(
        string $message = 'Voucher tidak valid.',
        string $errorCode = 'VOUCHER_INVALID',
        int $statusCode = 422,
        ?Exception $previous = null
    ) {
        $this->errorCode = $errorCode;
        parent::__construct($message, $statusCode, $previous);
    }

    public function getErrorCode(): string
    {
        return $this->errorCode;
    }

    public static function notFoundOrInactive(string $message = 'Kode voucher tidak ditemukan atau sudah tidak aktif.'): self
    {
        return new self($message, 'VOUCHER_INVALID');
    }

    public static function expired(string $message = 'Masa berlaku voucher telah berakhir.'): self
    {
        return new self($message, 'VOUCHER_EXPIRED');
    }

    public static function notStarted(string $message = 'Periode penggunaan voucher belum dimulai.'): self
    {
        return new self($message, 'VOUCHER_INVALID');
    }

    public static function quotaExceeded(string $message = 'Kuota penggunaan voucher telah habis.'): self
    {
        return new self($message, 'QUOTA_EXCEEDED');
    }

    public static function minPurchaseNotMet(float $minPurchase): self
    {
        $formatted = number_format($minPurchase, 0, ',', '.');

        return new self("Total belanja belum memenuhi syarat minimum pembelian voucher (Rp {$formatted}).", 'VOUCHER_INVALID');
    }

    public static function invalidItemType(string $itemType): self
    {
        return new self("Voucher ini tidak dapat digunakan untuk kategori pesanan {$itemType}.", 'VOUCHER_INVALID');
    }

    public static function invalidTarget(string $message = 'Voucher ini tidak dapat digunakan untuk item yang Anda pilih.'): self
    {
        return new self($message, 'VOUCHER_INVALID');
    }

    /**
     * Render the exception into a standard JSON envelope response.
     */
    public function render(Request $request): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $this->getMessage(),
            'error_code' => $this->errorCode,
            'server_time' => now()->toISOString(),
        ], 422);
    }
}
