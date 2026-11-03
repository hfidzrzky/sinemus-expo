# Getting Started Backend (Laravel Herd & Production-Parity Setup)
## Sinemus Indonesia Platform v2

Panduan ini mendokumentasikan langkah-langkah inisialisasi dan pengoperasian backend Sinemus Indonesia Platform di lingkungan local development. Setup ini menggunakan Laravel Herd sebagai web server (menggantikan `php artisan serve`) serta menyelaraskan proses queue worker dan task scheduler agar arsitektur backend berjalan identik dengan konfigurasi production server.

---

## 1. Prasyarat Sistem

Sebelum memulai, pastikan perangkat lokal telah terinstal:
- Laravel Herd (Windows / macOS) dengan PHP 8.2 atau 8.3 aktif.
- Composer (v2.7 ke atas, terintegrasi di Herd atau global).
- Database MySQL 8.0 ke atas (bisa menggunakan layanan MySQL di Herd Pro, Docker, atau MySQL lokal di port 3306).
- Redis (opsional di local, default queue dan cache menggunakan driver database).

---

## 2. Inisialisasi Project Backend

Lakukan inisialisasi awal dependensi dan konfigurasi environment:

```bash
# Pindah ke direktori backend
cd backend

# Instal dependensi PHP
composer install

# Salin konfigurasi environment jika belum ada
cp .env.example .env

# Generate application key
php artisan key:generate
```

### Konfigurasi File .env
Buka file `.env` dan sesuaikan parameter berikut:

```ini
APP_NAME="Sinemus Screen"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://api-sinemus.test

# Konfigurasi Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=sinemus_platform
DB_USERNAME=root
DB_PASSWORD=

# Driver Queue, Cache, dan Session
QUEUE_CONNECTION=database
CACHE_STORE=database
SESSION_DRIVER=database

# URL Frontend (untuk validasi CORS)
FRONTEND_URL=http://localhost:5173
```

---

## 3. Migrasi Database dan Storage Link

Jalankan migrasi tabel database dan generate symlink untuk media storage:

```bash
# Jalankan migrasi dan seeder awal
php artisan migrate:fresh --seed

# Buat symbolic link untuk public storage
php artisan storage:link
```

---

## 4. Konfigurasi Web Server dengan Laravel Herd

Backend project ini tidak menggunakan `php artisan serve`. Semua request HTTP/HTTPS dikelola langsung oleh web server Nginx bawaan Laravel Herd.

### Langkah Menghubungkan Project ke Herd:
1. Buka terminal di folder `backend`:
   ```bash
   cd backend
   herd link api-sinemus
   ```
2. Herd akan membuat domain virtual lokal:
   - URL Backend: `http://api-sinemus.test`
   - Direktori root otomatis mengarah ke `backend/public`.
3. Jika membutuhkan protokol HTTPS lokal, jalankan:
   ```bash
   herd secure api-sinemus
   # Backend aktif di https://api-sinemus.test
   ```

Setelah langkah ini selesai, endpoint API sudah dapat diakses langsung melalui browser atau Postman di `http://api-sinemus.test/api/v1/health` atau route lainnya tanpa perlu menyalakan `php artisan serve`.

---

## 5. Menjalankan Task Scheduler (Cronjob Parity)

Di server production, scheduler dijalankan melalui daemon cron sistem operasi setiap 60 detik:
`* * * * * cd /path-to-project && php artisan schedule:run >> /dev/null 2>&1`

Pada arsitektur Sinemus, scheduler mengelola tugas-tugas kritis pada `routes/console.php`:
- `bookings:prune-expired-locks`: Membersihkan kursi dan transaksi pending yang kedaluwarsa (setiap 1 menit).
- `events:close-expired-sales`: Menutup penjualan tiket event yang telah lewat waktu (setiap 5 menit).
- `tickets:prune-expired-pdf-cache`: Membersihkan file PDF tiket kedaluwarsa.
- `sanctum:prune-expired`: Membersihkan token sesi API kedaluwarsa.

### Cara Menjalankan Scheduler di Local:
Buka satu jendela terminal khusus dan jalankan:

```bash
cd backend
php artisan schedule:work
```

Command ini akan berjalan terus menerus di foreground dan mengeksekusi tugas setiap menit, memastikan mekanisme kedaluwarsa pending dan pembersihan lock kursi bekerja secara realtime seperti di server live.

### Memeriksa Jadwal Aktif:
Untuk melihat seluruh jadwal dan status eksekusi berikutnya:
```bash
php artisan schedule:list
```

### Testing Manual Task Tertentu (Tanpa Menunggu Interval):
Jika sedang melakukan pengujian alur tiket dan ingin langsung membatalkan lock pending:
```bash
php artisan bookings:prune-expired-locks
```

---

## 6. Menjalankan Queue Worker (Background Jobs)

Sinemus Platform memproses pembuatan file PDF tiket, pengiriman email notifikasi, dan injeksi massal secara asinkron menggunakan job queue (`backend/app/Jobs`).

Jika queue worker tidak dijalankan, job akan tertimbun di tabel `jobs` dan file PDF tiket atau email transaksi tidak akan terkirim.

### Cara Menjalankan Queue Worker di Local:
Buka jendela terminal khusus terpisah dan jalankan:

```bash
cd backend
php artisan queue:listen --tries=3 --timeout=120
```

Catatan:
- Gunakan `queue:listen` di lingkungan local agar perubahan kode pada Job/Service langsung terbaca tanpa perlu me-restart worker setiap kali file diubah.
- Jika menggunakan `queue:work`, worker wajib di-restart (`Ctrl+C` lalu jalankan ulang) setelah ada modifikasi kode pada class Job.

---

## 7. Standar Terminal Saat Development

Untuk memastikan seluruh layer arsitektur backend bekerja optimal dan setara dengan lingkungan production, jalankan proses berikut pada terminal terpisah:

1. Web Server:
   - Dikelola otomatis oleh background service Laravel Herd (`http://api-sinemus.test`).
   - Tidak memerlukan terminal aktif.

2. Terminal 1 (Task Scheduler):
   ```bash
   cd backend
   php artisan schedule:work
   ```

3. Terminal 2 (Queue Worker):
   ```bash
   cd backend
   php artisan queue:listen
   ```

4. Terminal 3 (Pekerjaan Developer / Artisan Ad-hoc):
   - Digunakan untuk menjalankan perintah migrasi, tinker, route check, atau unit test:
   ```bash
   php artisan test
   php artisan route:list --path=api
   ```

---

## 8. Verifikasi Integrasi Frontend

Setelah backend aktif di Herd, pastikan file `frontend/.env` telah diarahkan ke domain Herd:

```ini
VITE_ENABLE_MOCK=false
VITE_API_BASE_URL=http://api-sinemus.test/api/v1
```

Jalankan frontend:
```bash
cd frontend
npm run dev
```

Seluruh request dari frontend (`localhost:5173`) akan diteruskan ke Laravel Herd (`api-sinemus.test`), job asinkron akan langsung diproses oleh queue worker, dan status kedaluwarsa transaksi/kursi akan dipantau setiap menit oleh scheduler worker.
