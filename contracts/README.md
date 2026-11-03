# 📜 Sinemus Platform — API & Domain Contracts Index

Direktori ini berisi **Single Source of Truth (SSOT)** spesifikasi kontrak API antara Backend (Laravel 11) dan Frontend (Next.js 15) untuk platform Sinemus Indonesia.

Seluruh berkas kontrak di direktori ini sengaja diformat dalam **Pure JSON Schema (Draft 2020-12)** yang bersih, ringkas, dan bebas dari komentar berulang (*noise*) agar:
1. Dapat langsung digunakan oleh tooling otomatis (TypeScript Type Generator, Mock Service Worker, Postman, Swagger/OpenAPI exporter).
2. Bersih dan mudah di-copy/paste saat membuat Data Mock di Frontend (`frontend/src/mocks/`).
3. Seluruh dokumentasi, penjelasan baris per baris, dan panduan teknis terpusat secara rapi di berkas `README.md` ini.

---

## 🗂️ Matriks Berkas Kontrak & Pemetaan Domain

| No | Berkas Kontrak | Deskripsi Domain | Tabel Database Terkait | Jumlah Endpoint |
|---|---|---|---|:---:|
| 1 | [`auth.contract.json`](./auth.contract.json) | Autentikasi Google OAuth2, Profil, & Token Sanctum | `users` | 4 |
| 2 | [`banners.contract.json`](./banners.contract.json) | Hero Carousel Beranda (Rich & Image-Only 16:9) | `banners` | 1 |
| 3 | [`movies.contract.json`](./movies.contract.json) | Katalog Film VoD & Playback Stream Token HLS | `movies`, `user_movie_access` | 3 |
| 4 | [`events.contract.json`](./events.contract.json) | Screening Bioskop Fisik, Jadwal, & Denah Kursi | `events`, `schedules`, `seats`, `seat_locks` | 4 |
| 5 | [`checkout.contract.json`](./checkout.contract.json) | Midtrans Snap, Voucher Diskon, & Webhook | `vouchers`, `event_transactions`, `movie_transactions` | 5 |
| 6 | [`tickets.contract.json`](./tickets.contract.json) | Tiket Saya (QR/PDF) & Tab Film Saya (VoD Aktif) | `event_transactions`, `user_movie_access` | 3 |
| 7 | [`admin.contract.json`](./admin.contract.json) | Scanner QR Mobile, Hibah Akses, & Audit Order | `ticket_checkins`, `user_movie_access`, transaksi | 5 |

---

## 📖 Dokumentasi Rinci per Domain Kontrak

### 1. [`auth.contract.json`](./auth.contract.json) — Autentikasi & Profil Pengguna
Mengatur seluruh alur identitas pengguna berbasis **Google-Only OAuth2 ID Token**.

- **`POST /api/v1/auth/google` (googleAuth):**
  - **Fungsi:** Satu-satunya pintu login dan registrasi akun penonton via Google Identity Services SDK.
  - **Request:** `{ id_token: string }`
  - **Response:** Bearer token Sanctum, flag `is_new_user`, dan entitas `User`.
- **`GET /api/v1/auth/me` (currentUser):**
  - **Fungsi:** Mengambil data profil pengguna yang sedang login beserta status kelengkapan profil (`is_profile_completed`).
- **`PUT /api/v1/user/profile` (updateProfile):**
  - **Fungsi:** Melengkapi nama lengkap, tanggal lahir (validasi usia rating film), dan nomor WhatsApp perdana.
  - **Aturan Bisnis:** Nomor WhatsApp **hanya dapat diisi 1 kali** (jika bernilai null). Jika sudah terisi, nomor akan dikunci permanen oleh backend untuk mencegah fraud tiket.
- **`POST /api/v1/auth/logout` (logout):**
  - **Fungsi:** Mencabut token Sanctum yang sedang aktif dari database backend.

---

### 2. [`banners.contract.json`](./banners.contract.json) — Banner Promo & Hero Carousel
Mengatur daftar slide tayang beranda dengan rasio landscape sinematik **16:9**.

- **`GET /api/v1/banners` (listActiveBanners):**
  - **Fungsi:** Mengambil slide hero aktif yang sedang berada dalam rentang tanggal tayang (`start_date` s.d. `end_date`), terurut berdasarkan `order_priority`.
  - **Format Mode Tampilan:**
    - `rich_content`: Menampilkan Judul, Badge, Subtitle sinopsis, dan tombol aksi (CTA).
    - `image_only`: Menampilkan poster/grafis murni 16:9 clickable tanpa overlay teks.
  - **Tipe Tautan (link_type):** Mengarahkan ke film (`movie`), event screening (`event`), kupon promo (`voucher`), atau URL eksternal (`url`).

---

### 3. [`movies.contract.json`](./movies.contract.json) — Video on Demand (VoD)
Mengatur eksplorasi film digital, sinopsis, trailer, dan hak pemutaran video berbayar.

- **`GET /api/v1/movies` (listMovies):**
  - **Fungsi:** Menampilkan katalog film VoD dengan query parameter `genre`, `search`, `featured`, dan paginasi standar.
  - **Output Entitas:** `MovieSummary` (ringkas untuk card grid katalog dengan poster rasio 2:3).
- **`GET /api/v1/movies/{id_or_slug}` (getMovieDetail):**
  - **Fungsi:** Mengambil detail lengkap sinopsis, cast & crew, poster portrait (2:3), backdrop landscape (16:9), Cloudflare trailer UID, serta status hak tonton user saat ini (`locked`, `active`, `expired`).
- **`GET /api/v1/movies/{id}/stream` (getStreamAccess):**
  - **Fungsi:** Menerbitkan JWT Signed URL Cloudflare Stream HLS (`.m3u8`) khusus bagi penonton yang memiliki hak sewa aktif (validasi tabel `user_movie_access`).

---

### 4. [`events.contract.json`](./events.contract.json) — Screening Bioskop & Denah Kursi
Mengatur jadwal pemutaran film di studio fisik dan sistem denah kursi interaktif.

- **`GET /api/v1/events` (listEvents):**
  - **Fungsi:** Menampilkan katalog event pemutaran screening bioskop di berbagai kota dengan filter `city` dan `search`.
- **`GET /api/v1/events/{id_or_slug}` (getEventDetail):**
  - **Fungsi:** Detail event pemutaran fisik, alamat venue/studio, aturan screening, dan daftar sesi jam tayang (`schedules`).
- **`GET /api/v1/schedules/{schedule_id}/seats` (getScheduleSeats):**
  - **Fungsi:** Mengembalikan struktur matriks denah kursi studio (baris A-G, kolom 1-8) dan status real-time tiap kursi:
    - `available`: Kursi kosong dan siap dipilih.
    - `locked`: Kursi sedang dikunci user lain (dalam masa checkout 15 menit).
    - `booked`: Kursi sudah lunas terbeli.
    - `disabled`: Kursi dinonaktifkan (kursi teknisi/rusak).
- **`POST /api/v1/bookings/reserve` (reserveSeats):**
  - **Fungsi:** Mengunci kursi (maksimal 6 kursi per transaksi) selama **15 menit** menggunakan database *Pessimistic Locking* dan menerbitkan token pembayaran Midtrans.

---

### 5. [`checkout.contract.json`](./checkout.contract.json) — Pembayaran & Gateway Midtrans
Shared Payment Gateway terpadu untuk Tiket Bioskop Fisik dan Sewa Film VoD.

- **`POST /api/v1/checkout/voucher/apply` (applyVoucher):**
  - **Fungsi:** Memvalidasi kode kupon promo dan menghitung potongan harga diskon secara real-time.
- **`POST /api/v1/movies/{id}/rent` (rentMovie):**
  - **Fungsi:** Inisialisasi sewa film VoD 48 jam dan menerbitkan Snap Token (Format Order ID: `SNM-VOD-YYYY-XXXX`).
- **`POST /api/v1/bookings/reserve` (reserveEventSeats):**
  - **Fungsi:** Mengunci kursi bioskop dan menerbitkan Snap Token (Format Order ID: `SNM-TKT-YYYY-XXXX`).
- **`GET /api/v1/checkout/orders/{order_id}/status` (getPaymentStatus):**
  - **Fungsi:** Polling status transaksi (`pending`, `paid`, `expired`, `failed`) dari sisi frontend.
- **`POST /api/v1/webhooks/midtrans` (midtransWebhook):**
  - **Fungsi:** Endpoint webhook HTTP POST dari Midtrans dengan validasi keamanan SHA-512 Signature Key. Bersifat *idempotent* dan otomatis membedakan rute fulfillment antara prefix `SNM-TKT-` (terbitkan tiket QR) dan `SNM-VOD-` (terbitkan hak sewa di `user_movie_access`).

---

### 6. [`tickets.contract.json`](./tickets.contract.json) — Tiket Saya & Akses Sewa
Mengatur e-tiket penonton dan inventaris film yang sedang disewa.

- **`GET /api/v1/user/tickets` (listMyTickets):**
  - **Fungsi:** Menampilkan daftar riwayat tiket screening bioskop (filter `upcoming` atau `past`).
- **`GET /api/v1/user/tickets/{ticket_code}` (getTicketDetail):**
  - **Fungsi:** Mengambil detail e-tiket penonton, payload hash QR Code terenkripsi untuk modal barcode scanner, dan data cetak PDF.
- **`GET /api/v1/user/films` (listMyFilms):**
  - **Fungsi:** Menampilkan daftar film VoD yang sedang aktif disewa beserta sisa waktu hitung mundur (`remaining_seconds`).

---

### 7. [`admin.contract.json`](./admin.contract.json) — Super Admin & Petugas Scanner
Mengatur operasional studio, scanner barcode gerbang masuk, dan hibah hak akses.

- **`POST /api/v1/admin/tickets/validate` (validateTicketQR):**
  - **Fungsi:** Dipanggil oleh aplikasi mobile scanner petugas gerbang masuk bioskop untuk memverifikasi keaslian QR tiket dan mencatat status `checked_in` secara instan.
- **`GET /api/v1/admin/dashboard/stats` (getDashboardStats):**
  - **Fungsi:** Menyajikan ringkasan metrik statistik real-time (Total Revenue, Tiket Terjual, Total Film & Event Aktif).
- **`POST /api/v1/admin/movie-access/grant` (grantMovieAccess):**
  - **Fungsi:** Hibah hak tonton film gratis/promo kepada akun pengguna tanpa transaksi finansial (untuk reviewer, pemenang giveaway, atau partner).
- **`POST /api/v1/admin/movie-access/{id}/revoke` (revokeMovieAccess):**
  - **Fungsi:** Pencabutan paksa hak tonton film user disertai pencatatan alasan (*audit trail*).
- **`GET /api/v1/admin/orders` (listAdminOrders):**
  - **Fungsi:** Rekapitulasi transaksi gabungan tiket bioskop dan sewa film untuk audit finansial.

---

## 🛠️ Panduan Integrasi Developer (Frontend & Backend)

### Standar Amplop Respons (Envelope Response)
Semua endpoint wajib membalas dengan struktur JSON seragam:
```json
{
  "success": true,
  "message": "Operasi berhasil dieksekusi",
  "data": { ... },
  "meta": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 12,
    "total": 60
  },
  "server_time": "2026-09-04T12:00:00Z"
}
```

### Panduan Frontend (Next.js 15 Mock Generator)
1. Simpan data tiruan di `frontend/src/mocks/` sesuai dengan nama domain kontrak (contoh: `movies.mock.ts`, `events.mock.ts`).
2. Pastikan properti dan tipe data meniru 100% definisi skema di berkas `.contract.json` (gunakan `snake_case` untuk JSON response agar sinkron dengan Laravel 11).

### Panduan Backend (Laravel 11 Resource & Request)
1. Buat **Form Request Validation** (`app/Http/Requests/...`) sesuai dengan bagian `request.properties` dan `request.required` pada file kontrak.
2. Buat **Eloquent API Resource** (`app/Http/Resources/...`) sesuai dengan bagian `definitions.*` pada file kontrak.

