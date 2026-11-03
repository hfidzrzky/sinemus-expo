<?php

namespace Tests\Unit\Auth;

use App\Exceptions\Auth\PhoneLockedException;
use App\Models\User;
use App\Services\Auth\UserProfileService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserProfileServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_set_phone_number_for_the_first_time(): void
    {
        $user = User::create([
            'google_id' => 'uid-phone-1',
            'email' => 'phone1@sinemus.id',
            'name' => 'Phone Test 1',
            'phone_number' => null,
            'is_phone_locked' => false,
            'role' => 'customer',
        ]);

        $service = new UserProfileService;
        $updatedUser = $service->updateProfile($user, [
            'phone_number' => '081234567890',
        ]);

        $this->assertEquals('081234567890', $updatedUser->phone_number);
        $this->assertTrue($updatedUser->is_phone_locked);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'phone_number' => '081234567890',
            'is_phone_locked' => 1,
        ]);
    }

    public function test_user_cannot_change_phone_number_once_locked(): void
    {
        $user = User::forceCreate([
            'google_id' => 'uid-phone-2',
            'email' => 'phone2@sinemus.id',
            'name' => 'Phone Test 2',
            'phone_number' => '081234567890',
            'is_phone_locked' => true,
            'role' => 'customer',
        ]);

        $service = new UserProfileService;

        $this->expectException(PhoneLockedException::class);
        $this->expectExceptionMessage('Nomor WhatsApp sudah terkunci permanen dan tidak dapat diubah');

        $service->updateProfile($user, [
            'phone_number' => '089876543210',
        ]);
    }

    public function test_updating_profile_with_same_phone_number_is_idempotent(): void
    {
        $user = User::forceCreate([
            'google_id' => 'uid-phone-3',
            'email' => 'phone3@sinemus.id',
            'name' => 'Old Name',
            'phone_number' => '081234567890',
            'is_phone_locked' => true,
            'role' => 'customer',
        ]);

        $service = new UserProfileService;
        $updatedUser = $service->updateProfile($user, [
            'phone_number' => '081234567890',
            'name' => 'New Name',
        ]);

        $this->assertEquals('081234567890', $updatedUser->phone_number);
        $this->assertEquals('New Name', $updatedUser->name);
        $this->assertTrue($updatedUser->is_phone_locked);
    }

    public function test_updates_name_and_birth_date(): void
    {
        $user = User::create([
            'google_id' => 'uid-phone-4',
            'email' => 'phone4@sinemus.id',
            'name' => 'Original Name',
            'role' => 'customer',
        ]);

        $service = new UserProfileService;
        $updatedUser = $service->updateProfile($user, [
            'name' => 'Updated Name',
            'birth_date' => '1995-08-17',
        ]);

        $this->assertEquals('Updated Name', $updatedUser->name);
        $this->assertEquals('1995-08-17', $updatedUser->birth_date?->format('Y-m-d'));
    }

    public function test_is_profile_completed_calculated_correctly(): void
    {
        $user = User::create([
            'google_id' => 'uid-phone-5',
            'email' => 'phone5@sinemus.id',
            'name' => 'Profile Status Test',
            'role' => 'customer',
        ]);

        $this->assertFalse($user->is_profile_completed);

        $service = new UserProfileService;

        // 1. Baru isi nomor telepon -> belum lengkap
        $userAfterPhone = $service->updateProfile($user, [
            'phone_number' => '081234567890',
        ]);
        $this->assertFalse($userAfterPhone->is_profile_completed);

        // 2. Isi tanggal lahir -> sekarang lengkap
        $userAfterBirthDate = $service->updateProfile($userAfterPhone, [
            'birth_date' => '2000-01-01',
        ]);
        $this->assertTrue($userAfterBirthDate->is_profile_completed);
    }
}
