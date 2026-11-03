/**
 * Static UI Copy Constants (SSOT)
 * Acuan baku seluruh teks tampilan statis, label tombol, panduan, disclaimer, dan alert.
 */

export const UI_COPY = {
  // ==========================================
  // 1. AUTENTIKASI & PROFIL PENGGUNA
  // ==========================================
  AUTH: {
    LOGIN_MODAL_TITLE: 'Masuk ke Sinemus',
    LOGIN_MODAL_SUBTITLE:
      'Nikmati penayangan film indie eksklusif dan pesan tiket bioskop komunitas dalam satu platform.',
    GOOGLE_BUTTON: 'Lanjutkan dengan Google',
    TERMS_NOTICE:
      'Dengan masuk, Anda menyetujui Syarat & Ketentuan serta Kebijakan Privasi Sinemus Indonesia.',
    PHONE_LOCK_NOTICE:
      'Nomor WhatsApp hanya dapat diisi satu kali dan akan terkunci permanen untuk verifikasi kepemilikan tiket Anda.',
    PROFILE_COMPLETE_TITLE: 'Lengkapi Data Profil Anda',
    PROFILE_COMPLETE_SUBTITLE:
      'Data ini diperlukan untuk penerbitan e-tiket resmi dan validasi rating usia penonton.',
  },

  // ==========================================
  // 2. DENAH KURSI & SEAT MAP (EVENTS)
  // ==========================================
  SEAT_MAP: {
    SCREEN_LABEL: 'LAYAR BIOSKOP / AUDITORIUM',
    LEGEND_AVAILABLE: 'Tersedia',
    LEGEND_SELECTED: 'Dipilih',
    LEGEND_BOOKED: 'Terjual',
    LEGEND_LOCKED: 'Sedang Dipesan',
    MAX_SEAT_WARNING: 'Batas maksimal pembelian adalah 6 kursi per transaksi.',
    SELECT_SEAT_PROMPT: 'Silakan pilih minimal 1 kursi pada denah.',
    DRAWER_TRIGGER_BUTTON: 'Detail Lengkap & Aturan ▾',
  },

  // ==========================================
  // 3. PRESALE FILM CDS & BIOSKOP KOMERSIAL
  // ==========================================
  PRESALE: {
    BADGE_LABEL: 'PENAYANGAN SPESIAL BIOSKOP',
    AWAITING_TITLE: 'Bukti Reservasi Kursi Resmi',
    AWAITING_BADGE: 'Kursi Terkonfirmasi',
    AWAITING_DESCRIPTION:
      'Kursi Anda telah aman dan terdaftar resmi di sistem bioskop mitra. Kode cetak tiket fisik dan barcode akses studio akan otomatis terbit di halaman ini mendekati jadwal penayangan film.',
    FULFILLED_BADGE: 'Tiket Bioskop Siap Digunakan',
    PAST_BADGE: 'Selesai Ditonton',
    PAST_DESCRIPTION:
      'Sesi penayangan film telah berakhir. Terima kasih telah menonton bersama Sinemus!',
    PAST_MODAL_TITLE: 'Penayangan Telah Selesai',
    PAST_MODAL_DESC:
      'Jadwal sesi pemutaran di bioskop telah berakhir. E-pass ini disimpan sebagai bukti arsip riwayat transaksi Anda.',
    PAST_MODAL_NOTICE: 'Tiket dan kode ini sudah tidak dapat digunakan di mesin kiosk bioskop.',
    BTN_VIEW_ARCHIVE: 'Detail Riwayat',
    KIOSK_GUIDE_TITLE: 'Cara Cetak Tiket Fisik di Bioskop:',
    KIOSK_GUIDE_STEPS: [
      'Tiba di bioskop setidaknya 20–30 menit sebelum jadwal penayangan dimulai.',
      'Kunjungi Mesin Tiket Mandiri (Self-Ticketing Kiosk) yang tersedia di lobi bioskop.',
      'Pindai Barcode / QR Code atau ketik Kode Booking & Passcode yang tercantum di atas.',
      'Ambil tiket fisik yang keluar dari mesin dan tunjukkan kepada petugas pintu studio.',
    ],
  },

  // ==========================================
  // 4. CHECKOUT, PROMO, & PEMBAYARAN MIDTRANS
  // ==========================================
  CHECKOUT: {
    MODAL_TITLE: 'Ringkasan Pembayaran',
    COUNTDOWN_LABEL: 'Selesaikan pembayaran dalam:',
    VOUCHER_PLACEHOLDER: 'Punya kode promo? Masukkan di sini',
    VOUCHER_APPLY_BUTTON: 'Terapkan',
    VOUCHER_APPLIED_SUCCESS: 'Kode promo berhasil diterapkan!',
    PAY_BUTTON: 'Bayar Sekarang',
    PAYMENT_PROCESSING: 'Menghubungkan ke Gateway Pembayaran...',
    SNAP_POPUP_NOTICE: 'Jendela pembayaran aman akan terbuka secara otomatis.',
  },

  // ==========================================
  // 5. TIKET SAYA & VOD STREAMING
  // ==========================================
  TICKETS: {
    TAB_UPCOMING: 'Tiket Mendatang',
    TAB_PAST: 'Riwayat Tiket',
    DOWNLOAD_RECEIPT_PDF: 'Unduh Tanda Terima Presale (PDF)',
    DOWNLOAD_TICKET_PDF: 'Unduh E-Tiket Resmi (PDF)',
    DOWNLOAD_QR_IMAGE: 'Simpan Gambar QR',
    STATUS_CHECKED_IN: 'Sudah Masuk',
    STATUS_ACTIVE: 'Tiket Aktif',
    STATUS_PAST: 'Riwayat',
    STATUS_EXPIRED: 'Lewat Jadwal',
    GATE_NOTICE_ACTIVE: 'Tunjukkan QR Code ke petugas gerbang venue saat memasuki auditorium.',
    GATE_NOTICE_CHECKED_IN: 'Tiket sudah digunakan. Selamat menikmati pemutaran film!',
    GATE_NOTICE_EXPIRED: 'Sesi penayangan telah berakhir. Tiket sudah tidak dapat digunakan.',
    CHECKED_IN_MODAL_TITLE: 'Tiket Telah Digunakan',
    CHECKED_IN_MODAL_DESC: 'E-tiket ini telah berhasil dipindai oleh petugas di pintu masuk venue.',
    EXPIRED_MODAL_TITLE: 'Screening Telah Berakhir',
    EXPIRED_MODAL_DESC:
      'Jadwal pemutaran film telah selesai. Tiket ini tidak sempat dipindai saat acara berlangsung dan masa berlakunya telah berakhir.',
    EXPIRED_MODAL_NOTICE: 'E-tiket ini disimpan sebagai arsip bukti riwayat transaksi resmi Anda.',
    BTN_VIEW_QR: 'Tampilkan QR',
    BTN_VIEW_PASS: 'Lihat Tiket',
    EMPTY_TICKETS: 'Anda belum memiliki tiket pemutaran fisik.',
    EMPTY_STATE_ALL_TITLE: 'Belum Ada Tiket',
    EMPTY_STATE_ALL_DESC:
      'Anda belum memiliki riwayat transaksi tiket pemutaran fisik atau presale bioskop.',
    EMPTY_STATE_UPCOMING_TITLE: 'Tidak Ada Jadwal Mendatang',
    EMPTY_STATE_UPCOMING_DESC:
      'Anda belum memiliki tiket pemutaran yang akan datang. Temukan jadwal screening dan presale bioskop menarik sekarang!',
    EMPTY_STATE_PAST_TITLE: 'Belum Ada Riwayat Pemutaran',
    EMPTY_STATE_PAST_DESC_ACTIVE:
      'Tiket Anda saat ini masih aktif dan belum selesai ditonton. Tiket yang sudah selesai tayang atau sudah discan di pintu masuk akan tersimpan di sini.',
    EMPTY_STATE_PAST_DESC_EMPTY:
      'Belum ada pemutaran film yang telah Anda hadiri. Riwayat tiket yang sudah selesai tayang akan tersimpan rapi di sini.',
    EMPTY_STATE_BTN_EXPLORE: 'Cari Jadwal Screening',
    EMPTY_STATE_BTN_VIEW_UPCOMING: 'Lihat Tiket Mendatang',
  },

  VOD: {
    TAB_MY_MOVIES: 'Film Saya',
    RENT_BUTTON: 'Akses Film',
    REMAINING_TIME_LABEL: 'Masa Akses Nonton:',
    EXPIRED_NOTICE: 'Masa akses menonton film telah berakhir.',
    EMPTY_VOD: 'Belum ada koleksi film aktif.',
  },

  // ==========================================
  // 6. PESAN UMUM & FEEDBACK SISTEM
  // ==========================================
  COMMON: {
    BUTTON_CLOSE: 'Tutup',
    BUTTON_BACK: 'Kembali',
    BUTTON_CONFIRM: 'Mengerti & Lanjutkan',
    BUTTON_COPY: 'Salin',
    COPIED_SUCCESS: 'Berhasil disalin!',
    ERROR_GENERAL: 'Terjadi kendala pada sistem. Silakan coba beberapa saat lagi.',
    LOADING: 'Memuat data...',
  },
} as const;
