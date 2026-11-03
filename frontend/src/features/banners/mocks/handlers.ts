import { http, HttpResponse } from 'msw';
import { MOCK_BANNERS } from './fixtures';

export const bannersHandlers = [
  // Banners: Active Hero Banners Mock
  http.get('*/api/v1/banners', () => {
    return HttpResponse.json({
      success: true,
      message: 'Daftar banner aktif berhasil diambil.',
      data: MOCK_BANNERS,
      server_time: new Date().toISOString(),
    });
  }),
];
