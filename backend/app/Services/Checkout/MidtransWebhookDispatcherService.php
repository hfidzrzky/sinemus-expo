<?php

namespace App\Services\Checkout;

use App\Exceptions\Checkout\InvalidWebhookSignatureException;
use InvalidArgumentException;
use RuntimeException;

class MidtransWebhookDispatcherService
{
    public function __construct(
        protected TicketPaymentService $ticketPaymentService,
        protected MovieRentalPaymentService $movieRentalPaymentService
    ) {}

    /**
     * Memvalidasi signature SHA-512 webhook dan mendelegasikan payload ke domain service terkait.
     *
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     *
     * @throws InvalidWebhookSignatureException|InvalidArgumentException|RuntimeException
     */
    public function handleWebhook(array $payload): array
    {
        // 1. Timing-Safe Signature Verification
        $this->verifySignature($payload);

        $orderId = (string) ($payload['order_id'] ?? '');

        // 2. SRP Domain Routing berdasarkan prefix Order ID
        if (str_starts_with($orderId, 'SNM-TKT-')) {
            return $this->ticketPaymentService->handleNotification($payload);
        }

        if (str_starts_with($orderId, 'SNM-VOD-')) {
            return $this->movieRentalPaymentService->handleNotification($payload);
        }

        throw new InvalidArgumentException("Prefix Order ID {$orderId} tidak valid atau tidak didukung.");
    }

    /**
     * Verifikasi signature SHA-512 Midtrans secara timing-safe menggunakan hash_equals().
     *
     * Formula: SHA512(order_id + status_code + gross_amount + ServerKey)
     *
     * @param  array<string, mixed>  $payload
     *
     * @throws InvalidWebhookSignatureException|RuntimeException
     */
    public function verifySignature(array $payload): void
    {
        $serverKey = (string) config('services.midtrans.server_key');
        if (empty($serverKey)) {
            throw new RuntimeException('Midtrans Server Key belum terkonfigurasi di server backend.');
        }

        $orderId = (string) ($payload['order_id'] ?? '');
        $statusCode = (string) ($payload['status_code'] ?? '');
        $grossAmount = (string) ($payload['gross_amount'] ?? '');
        $receivedSignature = (string) ($payload['signature_key'] ?? '');

        $rawInput = $orderId.$statusCode.$grossAmount.$serverKey;
        $expectedSignature = hash('sha512', $rawInput);

        if (! hash_equals($expectedSignature, $receivedSignature)) {
            throw new InvalidWebhookSignatureException('Signature key webhook Midtrans tidak valid.');
        }
    }
}
