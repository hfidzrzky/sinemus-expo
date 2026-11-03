<?php

namespace Tests\Unit\Checkout;

use App\Models\User;
use App\Services\Checkout\MidtransSnapService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Tests\TestCase;

class MidtransSnapServiceTest extends TestCase
{
    use RefreshDatabase;

    protected MidtransSnapService $service;

    protected function setUp(): void
    {
        parent::setUp();
        config([
            'services.midtrans.server_key' => 'SB-Mid-server-sample-key',
            'services.midtrans.is_production' => false,
        ]);
        $this->service = new MidtransSnapService;
    }

    public function test_create_transaction_returns_token_and_redirect_url(): void
    {
        Http::fake([
            MidtransSnapService::SANDBOX_URL => Http::response([
                'token' => 'mock-snap-token-abc-123',
                'redirect_url' => 'https://app.sandbox.midtrans.com/snap/v2/vtweb/mock-snap-token-abc-123',
            ], 201),
        ]);

        $result = $this->service->createTransaction([
            'transaction_details' => [
                'order_id' => 'SNM-TKT-20260901-0001',
                'gross_amount' => 100000,
            ],
        ]);

        $this->assertEquals('mock-snap-token-abc-123', $result['token']);
        $this->assertStringContainsString('mock-snap-token-abc-123', $result['redirect_url']);
    }

    public function test_create_ticket_snap_token_builds_correct_payload(): void
    {
        $user = User::factory()->create([
            'name' => 'Budi Santoso',
            'email' => 'budi@example.com',
            'phone_number' => '081234567890',
        ]);

        Http::fake([
            MidtransSnapService::SANDBOX_URL => function ($request) use ($user) {
                $data = $request->data();

                $this->assertEquals('SNM-TKT-20260901-0002', $data['transaction_details']['order_id']);
                $this->assertEquals(75000, $data['transaction_details']['gross_amount']);
                $this->assertEquals($user->name, $data['customer_details']['first_name']);
                $this->assertEquals($user->email, $data['customer_details']['email']);
                $this->assertEquals($user->phone_number, $data['customer_details']['phone']);
                $this->assertEquals(15, $data['expiry']['duration']);

                return Http::response([
                    'token' => 'mock-token-ticket-456',
                    'redirect_url' => 'https://app.sandbox.midtrans.com/snap/v2/vtweb/mock-token-ticket-456',
                ], 201);
            },
        ]);

        $token = $this->service->createTicketSnapToken(
            'SNM-TKT-20260901-0002',
            75000.00,
            $user,
            [],
            15
        );

        $this->assertEquals('mock-token-ticket-456', $token);
    }

    public function test_throws_exception_if_server_key_is_missing(): void
    {
        config(['services.midtrans.server_key' => '']);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Midtrans Server Key belum dikonfigurasi di environment.');

        $this->service->createTransaction([
            'transaction_details' => [
                'order_id' => 'SNM-TKT-20260901-0003',
                'gross_amount' => 50000,
            ],
        ]);
    }

    public function test_throws_exception_if_api_returns_error(): void
    {
        Http::fake([
            MidtransSnapService::SANDBOX_URL => Http::response([
                'error_messages' => ['transaction_details.order_id has already been taken'],
            ], 400),
        ]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Gagal menerbitkan token pembayaran Midtrans:');

        $this->service->createTransaction([
            'transaction_details' => [
                'order_id' => 'SNM-TKT-20260901-0004',
                'gross_amount' => 50000,
            ],
        ]);
    }
}
