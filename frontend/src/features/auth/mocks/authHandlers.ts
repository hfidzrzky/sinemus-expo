import { http, HttpResponse } from 'msw';
import type { ApiResponse } from '@/types/api';
import type { GoogleAuthResponseData, UpdateProfilePayload, User } from '../types';
import { initialMockUser } from './authFixtures';

let currentMockUser: User = { ...initialMockUser };

export function resetMockUser(): void {
  currentMockUser = { ...initialMockUser };
}

export function setMockUser(user: User): void {
  currentMockUser = { ...user };
}

export const authHandlers = [
  // Auth: Google Login Mock
  http.post('*/api/v1/auth/google', async () => {
    const responseData: ApiResponse<GoogleAuthResponseData> = {
      success: true,
      message: 'Autentikasi berhasil',
      data: {
        token: 'mock-sanctum-token-xyz123',
        is_new_user: false,
        user: currentMockUser,
      },
      server_time: new Date().toISOString(),
    };

    return HttpResponse.json(responseData, { status: 200 });
  }),

  // Auth: Current User Profile Mock
  http.get('*/api/v1/auth/me', () => {
    const responseData: ApiResponse<User> = {
      success: true,
      message: 'Data pengguna berhasil diambil',
      data: currentMockUser,
      server_time: new Date().toISOString(),
    };

    return HttpResponse.json(responseData, { status: 200 });
  }),

  // Auth: Update Profile Mock
  http.put('*/api/v1/user/profile', async ({ request }) => {
    const body = (await request.json()) as UpdateProfilePayload;

    let normalizedPhone = body.phone_number
      ? body.phone_number.trim()
      : currentMockUser.phone_number;
    if (normalizedPhone) {
      if (normalizedPhone.startsWith('+628')) {
        normalizedPhone = '08' + normalizedPhone.substring(4);
      } else if (normalizedPhone.startsWith('628')) {
        normalizedPhone = '08' + normalizedPhone.substring(3);
      }
    }

    // Phone Lock Guard: Jika nomor sudah terkunci dan nomor baru berbeda, tolak
    if (currentMockUser.is_phone_locked && normalizedPhone !== currentMockUser.phone_number) {
      return HttpResponse.json(
        {
          success: false,
          message: 'Nomor WhatsApp sudah terkunci permanen dan tidak dapat diubah',
          server_time: new Date().toISOString(),
        },
        { status: 422 }
      );
    }

    const updatedPhone = normalizedPhone ?? currentMockUser.phone_number;
    const isLocked = Boolean(updatedPhone) || currentMockUser.is_phone_locked;
    const updatedBirthDate = body.birth_date ?? currentMockUser.birth_date;

    currentMockUser = {
      ...currentMockUser,
      name: body.name ? body.name.trim() : currentMockUser.name,
      phone_number: updatedPhone,
      is_phone_locked: isLocked,
      birth_date: updatedBirthDate,
      is_profile_completed: Boolean(updatedPhone && updatedBirthDate),
    };

    const responseData: ApiResponse<User> = {
      success: true,
      message: 'Profil berhasil diperbarui',
      data: currentMockUser,
      server_time: new Date().toISOString(),
    };

    return HttpResponse.json(responseData, { status: 200 });
  }),

  // Auth: Logout Mock
  http.post('*/api/v1/auth/logout', () => {
    return HttpResponse.json(
      {
        success: true,
        message: 'Berhasil keluar dari sesi akun',
        server_time: new Date().toISOString(),
      },
      { status: 200 }
    );
  }),
];
