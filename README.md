# Sinemus Screen — Campus Software Expo Edition

> **Platform Hybrid Cinema Terintegrasi untuk Perfilman Independen Indonesia: Reservasi Kursi Bioskop Interaktif & Video on Demand (VoD).**

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)
[![Backend](https://img.shields.io/badge/Backend-Laravel%2011%20(PHP%208.3)-FF2D20?logo=laravel)](backend/)
[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite%20%2B%20TypeScript-61DAFB?logo=react)](frontend/)
[![Styling](https://img.shields.io/badge/Styling-Tailwind%20CSS-06B6D4?logo=tailwindcss)](frontend/)
[![Edition](https://img.shields.io/badge/Showcase-Campus%20Software%20Expo-8A2BE2)](#-tentang-proyek-expo)

---

## Tentang Proyek Expo

**Sinemus Screen (Expo Edition)** adalah purwarupa sistem perangkat lunak yang memadukan dua pilar ekosistem pemutaran film ke dalam satu platform web modern:
1. **Physical Cinema Ticketing (Screening Bioskop Fisik):** Pemesanan tiket pemutaran film komunitas/indie dengan denah kursi visual interaktif (*Interactive Seat Map*) serta perlindungan anti-bentrok (*Concurrency Lock*).
2. **Video on Demand (VoD Streaming):** Layanan penayangan karya film secara legal langsung dari peramban web pengguna.
3. **E-Ticket & QR Venue Scanner:** Penerbitan tiket digital aman berbasis QR code dinamis yang dapat divalidasi langsung oleh petugas venue pemutaran.

> [!NOTE]
> Repositori ini dikembangkan khusus sebagai materi pameran (*software showcase*) pada ajang Expo Software Kampus. Untuk tujuan demonstrasi yang cepat dan aman, sistem ini dilengkapi dengan *Standalone Mock Mode* sehingga seluruh alur dapat diuji coba tanpa ketergantungan layanan eksternal berbayar.

---

## Fitur Utama & Rekayasa Perangkat Lunak

* **Interactive Seat Selection:** Pemilihan kursi bioskop secara *real-time* dengan visualisasi denah studio responsif.
* **Concurrency & Race Condition Guard:** Pencegahan pemesanan ganda kursi bioskop menggunakan transaksi database ACID dan *pessimistic row locking*.
* **Feature-Sliced Frontend Architecture:** Antarmuka React 19 modular berbasis TypeScript ketat (*Strict Types, Zero Any*) dan Tailwind CSS.
* **Decoupled API Contracts:** Standardisasi komunikasi data antara frontend dan backend berbasis JSON Contracts tunggal (*Single Source of Truth*).
* **Zero-Touch Mock Engine:** Integrasi *Mock Service Worker (MSW)* yang memungkinkan aplikasi berjalan penuh di sisi peramban untuk keperluan demonstrasi *offline* di booth pameran.
* **Mobile-Friendly Venue Scanner:** Antarmuka scanner QR Code untuk validasi kehadiran penonton di pintu masuk studio.

---

## Tech Stack

| Komponen | Teknologi |
| :--- | :--- |
| **Frontend** | React 19, Vite, TypeScript, Tailwind CSS, Lucide Icons, TanStack Query |
| **Backend API** | Laravel 11 (PHP 8.3), REST API, FormRequest Validation, JsonResources |
| **Database** | MySQL / SQLite (Kompatibel untuk demonstrasi lokal) |
| **Simulasi & Mocking**| Mock Service Worker (MSW) Browser Integration |

---

## Struktur Direktori

```text
sinemus-expo/
├── contracts/        # Spesifikasi dan skema kontrak JSON data
├── backend/          # RESTful API Service (Laravel 11)
│   ├── app/          # Controllers, Models, Services, Requests
│   └── routes/       # Endpoint API
├── frontend/         # Web Application (React 19 + TypeScript)
│   ├── src/features/ # Domain modular (events, movies, tickets, auth)
│   ├── src/components/ # Komponen UI atomik & tata letak
│   └── src/mocks/    # Handler simulasi data demo
└── LICENSE           # GNU Affero General Public License v3.0
```

---

## Panduan Menjalankan Demo (Quick Start)

Untuk keperluan demonstrasi cepat di lingkungan lokal atau booth pameran:

### Mode 1: Jalur Cepat Frontend (Standar Demo Booth)
Mode ini menggunakan engine simulasi data internal (MSW) sehingga Anda tidak perlu menyalakan database atau server backend:

```bash
# 1. Masuk ke direktori frontend
cd frontend

# 2. Pasang dependensi
npm install

# 3. Buat file konfigurasi demo
cp .env.example .env

# 4. Jalankan aplikasi web
npm run dev
```
Buka peramban di `http://localhost:5173`.

---

### Mode 2: Jalur Full-Stack (Frontend + Backend API)
Jika ingin menjalankan backend database secara penuh:

```bash
# 1. Setup Backend
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve

# 2. Setup Frontend di terminal terpisah
cd ../frontend
npm install
cp .env.example .env
npm run dev
```

---

## Lisensi & Hak Cipta

Perangkat lunak ini dirilis di bawah lisensi **[GNU Affero General Public License v3.0 (AGPL-3.0)](LICENSE)**.

```text
Sinemus Screen — Campus Software Expo Edition
Copyright (C) 2026 Muhammad Hafidz & Sinemus Team
```

Lisensi ini menjamin bahwa seluruh pengguna bebas mempelajari, menjalankan, dan mengembangkan kode ini, dengan kewajiban bahwa setiap turunan perangkat lunak yang disebarluaskan atau dioperasikan sebagai layanan jaringan wajib tetap terbuka di bawah lisensi AGPLv3 yang sama.