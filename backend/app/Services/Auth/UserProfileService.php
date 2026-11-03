<?php

namespace App\Services\Auth;

use App\Exceptions\Auth\PhoneLockedException;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class UserProfileService
{
    /**
     * Perbarui profil pengguna dengan proteksi immutabilitas nomor WhatsApp.
     *
     * @param  array{name?: string, birth_date?: string, phone_number?: string}  $data
     *
     * @throws PhoneLockedException
     */
    public function updateProfile(User $user, array $data): User
    {
        return DB::transaction(function () use ($user, $data) {
            /** @var User $lockedUser */
            $lockedUser = User::where('id', $user->id)
                ->lockForUpdate()
                ->firstOrFail();

            // 1. Phone Guard: Validasi penguncian nomor WhatsApp
            if (array_key_exists('phone_number', $data) && $data['phone_number'] !== null) {
                $newPhoneNumber = trim((string) $data['phone_number']);

                if ($lockedUser->is_phone_locked) {
                    // Jika nomor sudah terkunci dan nomor baru berbeda, tolak perubahan
                    if ($lockedUser->phone_number !== $newPhoneNumber) {
                        throw new PhoneLockedException('Nomor WhatsApp sudah terkunci permanen dan tidak dapat diubah');
                    }
                    // Jika nomor baru sama dengan nomor yang tersimpan, operasi bersifat idempoten
                } else {
                    // Pengisian nomor telepon untuk pertama kali: isi dan kunci permanen
                    $lockedUser->phone_number = $newPhoneNumber;
                    $lockedUser->is_phone_locked = true;
                }
            }

            // 2. Pembaruan nama penonton jika disediakan
            if (array_key_exists('name', $data) && $data['name'] !== null) {
                $trimmedName = trim((string) $data['name']);
                if ($trimmedName !== '') {
                    $lockedUser->name = $trimmedName;
                }
            }

            // 3. Pembaruan tanggal lahir jika disediakan
            if (array_key_exists('birth_date', $data) && $data['birth_date'] !== null) {
                $lockedUser->birth_date = $data['birth_date'];
            }

            $lockedUser->save();

            return $lockedUser->fresh();
        });
    }
}
