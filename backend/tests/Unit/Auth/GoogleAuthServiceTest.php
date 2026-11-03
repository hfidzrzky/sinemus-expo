<?php

namespace Tests\Unit\Auth;

use App\Exceptions\Auth\InvalidGoogleTokenException;
use App\Models\User;
use App\Services\Auth\GoogleAuthService;
use Google\Auth\Cache\FileSystemCacheItemPool;
use Google_Client;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class GoogleAuthServiceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.google.client_id' => 'sinemus-client-id.apps.googleusercontent.com']);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_authenticates_new_user_and_issues_sanctum_token(): void
    {
        $mockClient = Mockery::mock(Google_Client::class);
        $mockClient->shouldReceive('verifyIdToken')
            ->once()
            ->with('valid-google-token')
            ->andReturn([
                'sub' => 'google-uid-1001',
                'aud' => 'sinemus-client-id.apps.googleusercontent.com',
                'email' => 'newuser@sinemus.id',
                'name' => 'Budi Santoso',
                'picture' => 'https://lh3.googleusercontent.com/avatar1001.png',
                'email_verified' => true,
            ]);

        $service = new GoogleAuthService($mockClient);
        $result = $service->authenticate('valid-google-token');

        $this->assertTrue($result['is_new_user']);
        $this->assertNotEmpty($result['token']);
        $this->assertInstanceOf(User::class, $result['user']);
        $this->assertEquals('google-uid-1001', $result['user']->google_id);
        $this->assertEquals('newuser@sinemus.id', $result['user']->email);
        $this->assertEquals('Budi Santoso', $result['user']->name);
        $this->assertEquals('https://lh3.googleusercontent.com/avatar1001.png', $result['user']->avatar_url);
        $this->assertEquals('customer', $result['user']->role);
        $this->assertFalse($result['user']->is_phone_locked);

        $this->assertDatabaseHas('users', [
            'google_id' => 'google-uid-1001',
            'email' => 'newuser@sinemus.id',
        ]);
    }

    public function test_authenticates_existing_user_by_google_id(): void
    {
        $existingUser = User::create([
            'google_id' => 'google-uid-2002',
            'email' => 'existing@sinemus.id',
            'name' => 'Existing User',
            'avatar_url' => 'https://old-avatar.png',
            'role' => 'customer',
            'is_phone_locked' => false,
        ]);

        $mockClient = Mockery::mock(Google_Client::class);
        $mockClient->shouldReceive('verifyIdToken')
            ->once()
            ->with('existing-user-token')
            ->andReturn([
                'sub' => 'google-uid-2002',
                'aud' => 'sinemus-client-id.apps.googleusercontent.com',
                'email' => 'existing@sinemus.id',
                'name' => 'Updated Name',
                'picture' => 'https://new-avatar.png',
                'email_verified' => true,
            ]);

        $service = new GoogleAuthService($mockClient);
        $result = $service->authenticate('existing-user-token');

        $this->assertFalse($result['is_new_user']);
        $this->assertEquals($existingUser->id, $result['user']->id);
        $this->assertEquals('Updated Name', $result['user']->name);
        $this->assertEquals('https://new-avatar.png', $result['user']->avatar_url);
        $this->assertEquals(1, User::count());
    }

    public function test_authenticates_existing_user_by_email_and_links_google_id(): void
    {
        $existingUser = User::create([
            'google_id' => 'temp-google-id',
            'email' => 'link@sinemus.id',
            'name' => 'Link Target',
            'avatar_url' => null,
            'role' => 'customer',
            'is_phone_locked' => false,
        ]);

        $mockClient = Mockery::mock(Google_Client::class);
        $mockClient->shouldReceive('verifyIdToken')
            ->once()
            ->with('link-token')
            ->andReturn([
                'sub' => 'new-linked-google-sub-3003',
                'aud' => 'sinemus-client-id.apps.googleusercontent.com',
                'email' => 'link@sinemus.id',
                'name' => 'Link Target',
                'picture' => 'https://linked-avatar.png',
                'email_verified' => true,
            ]);

        $service = new GoogleAuthService($mockClient);
        $result = $service->authenticate('link-token');

        $this->assertFalse($result['is_new_user']);
        $this->assertEquals($existingUser->id, $result['user']->id);
        $this->assertEquals('new-linked-google-sub-3003', $result['user']->google_id);
        $this->assertEquals(1, User::count());
    }

    public function test_throws_exception_on_invalid_or_expired_token(): void
    {
        $mockClient = Mockery::mock(Google_Client::class);
        $mockClient->shouldReceive('verifyIdToken')
            ->once()
            ->with('bad-token')
            ->andReturn(false);

        $service = new GoogleAuthService($mockClient);

        $this->expectException(InvalidGoogleTokenException::class);
        $this->expectExceptionMessage('Token autentikasi Google tidak valid atau telah kedaluwarsa');

        $service->authenticate('bad-token');
    }

    public function test_throws_exception_on_empty_token(): void
    {
        $mockClient = Mockery::mock(Google_Client::class);
        $service = new GoogleAuthService($mockClient);

        $this->expectException(InvalidGoogleTokenException::class);
        $this->expectExceptionMessage('Token autentikasi Google tidak boleh kosong');

        $service->authenticate('   ');
    }

    public function test_throws_exception_if_google_email_not_verified(): void
    {
        $mockClient = Mockery::mock(Google_Client::class);
        $mockClient->shouldReceive('verifyIdToken')
            ->once()
            ->with('unverified-email-token')
            ->andReturn([
                'sub' => 'google-uid-4004',
                'aud' => 'sinemus-client-id.apps.googleusercontent.com',
                'email' => 'unverified@sinemus.id',
                'name' => 'Unverified User',
                'email_verified' => false,
            ]);

        $service = new GoogleAuthService($mockClient);

        $this->expectException(InvalidGoogleTokenException::class);
        $this->expectExceptionMessage('Email akun Google belum diverifikasi');

        $service->authenticate('unverified-email-token');
    }

    public function test_throws_exception_on_mismatched_audience(): void
    {
        $mockClient = Mockery::mock(Google_Client::class);
        $mockClient->shouldReceive('verifyIdToken')
            ->once()
            ->with('mismatched-aud-token')
            ->andReturn([
                'sub' => 'google-uid-5005',
                'aud' => 'attacker-malicious-app.apps.googleusercontent.com',
                'email' => 'victim@sinemus.id',
                'name' => 'Victim User',
                'email_verified' => true,
            ]);

        $service = new GoogleAuthService($mockClient);

        $this->expectException(InvalidGoogleTokenException::class);
        $this->expectExceptionMessage('Token audience Google tidak valid untuk platform ini');

        $service->authenticate('mismatched-aud-token');
    }

    public function test_service_initializes_with_filesystem_cache_pool_by_default(): void
    {
        $service = new GoogleAuthService;
        $reflection = new \ReflectionClass($service);
        $clientProp = $reflection->getProperty('googleClient');
        $clientProp->setAccessible(true);
        /** @var Google_Client $client */
        $client = $clientProp->getValue($service);

        $this->assertInstanceOf(Google_Client::class, $client);
        $this->assertInstanceOf(FileSystemCacheItemPool::class, $client->getCache());
        $this->assertDirectoryExists(storage_path('framework/cache/data/google-auth'));
    }
}
