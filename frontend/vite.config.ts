import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    headers: {
      // WAJIB untuk Google Identity Services (GIS) popup flow.
      // 'same-origin-allow-popups' mengizinkan popup dari accounts.google.com
      // berkomunikasi kembali ke halaman ini via postMessage.
      // JANGAN diubah ke 'same-origin' — akan memblokir GIS sepenuhnya.
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',

      // Mencegah browser menebak MIME type (mitigasi content sniffing attack)
      'X-Content-Type-Options': 'nosniff',

      // Mencegah halaman ini di-embed di iframe dari domain lain (anti-clickjacking)
      'X-Frame-Options': 'SAMEORIGIN',

      // Paksa referrer dikirim hanya ke origin yang sama
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@tanstack')) {
              return 'vendor-tanstack';
            }
            if (id.includes('html5-qrcode') || id.includes('qrcode.react')) {
              return 'vendor-scanner';
            }
            return 'vendor-core';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
