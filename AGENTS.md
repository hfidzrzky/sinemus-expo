# AGENT.md — Strict Execution & Anti-Technical-Debt Blueprint
## Sinemus Indonesia Platform v2 (`sinemus-platform`)

Dokumen ini adalah acuan baku mutlak (*Rules of Engagement*) bagi setiap AI Agent / Developer. **DILARANG** melakukan generasi kode secara asal (*lazy code*), mengabaikan proteksi keamanan, atau meninggalkan *technical debt*.

---

## 0. Mandatory Execution Protocol (Graphify & Plan-First SOP)

Setiap permintaan fitur baru, refactor, perbaikan bug, atau perubahan kode **WAJIB** mengikuti siklus kerja terstruktur tanpa perlu diminta berulang kali:

```
[Permintaan User] 
       ▼
1. GRAPHIFY KNOWLEDGE EXPLORATION (Query graphify / AST Graph)
       ▼
2. IMPLEMENTATION PLAN (Rencana aksi terstruktur & dampak berkas)
       ▼
3. USER ALIGNMENT / KONFIRMASI (Review & validasi rencana sebelum eksekusi)
       ▼
4. KODE EKSEKUSI (Strict Types, Zero Placeholder, ACID Transaksi)
       ▼
5. GATEKEEPER-QA AUDIT (Kepatuhan Arsitektur & Keamanan Tanpa Toleransi)
       ▼
6. VERIFIKASI & SYNC (Compile check & graphify update .)
       ▼
7. MANDATORY WALKTHROUGH (Dokumentasi & pelacakan hasil perubahan untuk user)
```

1. **Step 1 — Graphify First:**
   * Sebelum menulis kode atau berasumsi tentang arsitektur, AI Agent **WAJIB** mengecek knowledge graph via `query_graph` / `graphify query "<konsep>"`.
   * Cek dependensi, model, contract, atau relasi file terkait sebelum menentukan solusi.
2. **Step 2 — Implementation Plan Wajib:**
   * **DILARANG LANGSUNG MENULIS KODE SEBELUM RENCANA DITETAPKAN.**
   * Buat rencana implementasi yang jelas mencakup:
     - Analisis masalah / kebutuhan.
     - Berkas yang akan diubah / dibuat (Frontend / Backend / Contract).
     - Langkah implementasi berurutan.
     - Checklist verifikasi & mitigasi risiko.
3. **Step 3 — Eksekusi Kode Berkualitas Tinggi:**
   * Eksekusi hanya dilakukan setelah alur implementasi dipetakan dengan jelas.
   * Patuhi standar Section 1 s.d. Section 6.
4. **Step 4 — Gatekeeper-QA Subagent Audit:**
   * Semua kode yang telah dihasilkan **WAJIB** diintersepsi dan dikirimkan ke subagent `Gatekeeper-QA` untuk diaudit sebelum push ke branch mana pun.
   * Kode harus memperoleh status `[STATUS]: DISETUJUI` sebelum diizinkan untuk di-push.
   * **LARANGAN PUSH OTOMATIS:** AI Agent **DILARANG KERAS** melakukan `git push` secara otomatis. Semua operasi push tetap berada di bawah kendali manual Anda (pengguna), kecuali Anda secara eksplisit memerintahkannya.
5. **Step 5 — Post-Execution Sync:**
   * Setelah file kode selesai dimodifikasi, diaudit lolos, dan diverifikasi, jalankan `graphify update .` agar knowledge graph tetap up-to-date.
6. **Step 6 — Mandatory Walkthrough & User Tracking:**
   * **WAJIB:** Setiap kali selesai melakukan modifikasi atau generasi kode, AI Agent **DILARANG BERHENTI** tanpa menyajikan **Walkthrough** yang komprehensif untuk kebutuhan pelacakan (*tracking*) pengguna.
   * Format Walkthrough harus mencakup:
     - **Ringkasan Perubahan (*High-Level Overview*):** Maksud dan tujuan perubahan, fitur yang ditambah/diperbaiki.
     - **Daftar Berkas Terkait (*File Changes*):** Rincian berkas yang dibuat atau diubah disertai tautan file format markdown (`[nama_file](file:///...)`).
     - **Poin Kunci Implementasi (*Key Highlights*):** Penjelasan teknis spesifik mengenai logika, hook, komponen, API, atau query yang diimplementasikan.
     - **Hasil Verifikasi & Status QA:** Status lolos type-check/linter dan hasil audit `Gatekeeper-QA`.
     - **Panduan Pengujian / Langkah Lanjutan (*Testing Steps / Next Steps*):** Panduan jelas bagi pengguna untuk menguji perubahan secara lokal atau catatan langkah manual selanjutnya.

---

## 1. Non-Negotiable Core Invariants

1. **Model Bisnis & Aktor (Lean Scope):**
   * Platform: Direct Cinema Management & VoD Streaming (Tanpa Seller Dashboard).
   * 2 Peran Pengguna: **`customer`** (penonton) & **`super_admin`** (pengelola & mobile scanner venue).
2. **Autentikasi (Google-Only):**
   * Login/Register 100% via Google OAuth2 ID Token. Dilarang membuat form login/register email-password manual.
   * `email` bersifat *read-only*. `phone_number` (No. WhatsApp) **TERKUNCI PERMANEN (`is_phone_locked = true`)** setelah pertama kali diisi.
3. **Infrastruktur Video (Cloudflare Stream Only):**
   * Seluruh video (Full Movie, Trailer, Teaser) dialirkan melalui **Cloudflare Stream**. Dilarang menggunakan YouTube.
   * Full Movie VoD wajib menggunakan *Signed Playback Tokens* JWT (`.m3u8`).
4. **Pemisahan Domain Transaksi:**
   * **Tiket Bioskop:** Tabel `event_transactions` (Order: `SNM-TKT-XXXX`, modal: `EventCheckoutModal`, lock kursi 15m).
   * **Sewa Film VoD:** Tabel `user_movie_access` (Order: `SNM-VOD-XXXX`, modal: `MovieRentalModal`, sewa aktif 48 jam).

---

## 2. Strict Security & Anti-Vulnerability Guardrails

Setiap baris kode yang digenerate **WAJIB** mematuhi 7 prinsip keamanan ketat:

1. **Zero Hardcoded Secrets:** Dilarang keras menaruh API Key, Server Key Midtrans, Private Key Cloudflare, atau kredensial database di dalam kode. Seluruhnya wajib melalui `config()` / `.env`.
2. **Anti-SQL Injection & Mass Assignment:**
   * Dilarang query SQL string mentah tanpa *parameter binding*.
   * Model Eloquent wajib mendefinisikan `$fillable` secara eksplisit. Dilarang menggunakan `$guarded = []`.
3. **Pessimistic Concurrency Guard:**
   * Reservasi kursi dan pemotongan voucher wajib berada di dalam `DB::transaction(fn() => ...)` dan memanggil `->lockForUpdate()`.
4. **Timing-Safe Cryptography:**
   * Validasi hash webhook Midtrans wajib menggunakan fungsi `hash_equals($expected, $received)` untuk mencegah *timing attacks*.
   * QR e-tiket wajib menggunakan string hash acak terenkripsi (`Str::random(32)` / `bin2hex(random_bytes(16))`).
5. **Sanctum & OAuth Server Verification:**
   * Backend wajib memverifikasi JWT token Google secara *server-side* ke Google API sebelum menerbitkan Sanctum Token.
   * Endpoint privat wajib dilindungi middleware `auth:sanctum` dan `role:super_admin`.
6. **Input Sanitization & Type Coercion:**
   * Semua input wajib divalidasi via `FormRequest` (Laravel) dan Zod/TypeScript interface (React).
   * Validasi format nomor telepon Indonesia: `^(08|\+628)[0-9]{8,12}$`.
7. **Rate Limiting (Throttle):**
   * Terapkan middleware `throttle:60,1` pada endpoint publik dan `throttle:10,1` pada endpoint pemesanan/pembayaran.

---

## 3. Production-Ready, Clean Code & Architecture Integrity Standards

Setiap baris kode yang digenerate **WAJIB** berstatus *production-ready*, bebas *technical debt*, dan konsisten dengan arsitektur yang ada:

1. **Zero Technical Debt & Zero Placeholder:**
   * Dilarang keras meninggalkan kode placeholder: `// TODO`, `// nanti dihandle`, `// mock for now`, fungsi kosongan, atau *workaround* sementara di file produksi.
   * Seluruh fungsi, hook, service, dan komponen wajib ditulis lengkap, fungsional, tuntas menangani *edge cases* (null, undefined, race condition, network timeout), dan dapat langsung di-compile.
   * Penanganan error (*error handling*) wajib komprehensif dengan status code semantik dan pesan yang informatif.

2. **Clean Code, Readability & Sustainability:**
   * **Self-Documenting Code:** Penamaan variabel, fungsi, class, dan interface wajib jelas, deskriptif, dan mengekspresikan intensi (*intention-revealing*) tanpa singkatan ambigu.
   * **Guard Clauses / Early Return:** Hindari percabangan bertingkat yang dalam (*deep nesting / arrow anti-pattern*).
   * **DRY (Don't Repeat Yourself):** Ekstraksi logika repetitif ke reusable domain utility atau custom hook tanpa over-engineering.
   * **Maintainable & Scalable:** Kode dirancang agar mudah dirawat dan dikembangkan oleh developer lain tanpa efek samping (*side effects* liar).

3. **SOLID Principles & Single Responsibility Principle (SRP):**
   * **S (SRP - Single Responsibility):** Setiap berkas, class, function, hook, dan komponen hanya memiliki **satu alasan untuk berubah**.
     - *Controller*: Hanya memvalidasi request & membungkus response (Skinny Controller).
     - *Service*: Hanya menangani satu domain transaksi / business logic.
     - *React Component*: Hanya bertugas merender tampilan (Presentational Dumb JSX).
     - *Custom Hook*: Hanya mengelola satu state logika headless.
   * **O (Open/Closed):** Modul terbuka untuk ekstensi namun tertutup untuk modifikasi yang memecah kontrak lama.
   * **L (Liskov Substitution):** Implementasi interface/kontrak harus dapat saling menggantikan tanpa merusak perilaku sistem.
   * **I (Interface Segregation):** Tipe data dan interface harus modular dan spesifik, tidak memaksakan properti yang tidak relevan.
   * **D (Dependency Inversion):** Modul high-level dan low-level bergantung pada abstraksi/kontrak (Contracts SSOT), bukan implementasi konkret yang saling terikat erat (*tight coupling*).

4. **Single Source of Truth (SSOT) & Architectural Consistency:**
   * **Contracts as SSOT:** Berkas `contracts/*.contract.json` adalah acuan tunggal bentuk data antara Backend dan Frontend. Setiap perubahan skema data wajib diselaraskan dengan contract terlebih dahulu.
   * **Server Time as SSOT:** Seluruh perhitungan sisa waktu (lock kursi 15 menit & sewa film 48 jam) wajib menghitung selisih `server_time` backend. Dilarang mengandalkan jam lokal `new Date()`.
   * **Strict Layering Invariant:** Dilarang membobol arsitektur yang telah ditentukan (misal: Controller mengeksekusi query Eloquent langsung tanpa Service, atau Komponen React melakukan `fetch`/`axios` langsung tanpa melalui layer `features/[domain]/api/`).

5. **Strict TypeScript (No `any`):**
   * Dilarang menggunakan tipe data `any` di TypeScript. Buat tipe data eksplisit di `features/[domain]/types/` yang sinkron dengan kontrak API.

6. **Response Envelope Consistency:**
   * Seluruh API response wajib mengembalikan format amplop standar:
     ```json
     { "success": true, "message": "...", "data": { ... }, "server_time": "ISO-8601" }
     ```
   * Error responses wajib menggunakan status code HTTP semantik (400, 401, 403, 404, 409, 422, 500).

7. **No Deep Imports (Public Gateway Only):**
   * Impor lintas domain di frontend hanya boleh melalui `import { ... } from '@/features/[domain]'`.

8. **Strict Naming Conventions:**
   * Wajib mematuhi konvensi di `docs/03-Development-Guide/Coding-Standards.md` (Komponen `PascalCase.tsx`, Hooks `use-*.ts`, Controller/Service `PascalCase.php`, Tabel `snake_case` plural, variabel representatif tanpa singkatan tak jelas).

---

## 4. Backend Layering Standards (Laravel 11)

```
HTTP Request ──► FormRequest ──► Skinny Controller ──► Domain Service ──► JsonResource ──► JSON Response
```
* **Skinny Controller:** Hanya bertugas mengekstrak input, memanggil Service, dan membungkus hasil ke Resource.
* **Domain Service:** Menangani transaksi ACID, `lockForUpdate()`, interaksi Midtrans, dan Cloudflare token signing.
* **JsonResource:** Menjadi *Anti-Corruption Layer* agar struktur database internal tidak bocor ke publik.

---

## 5. Frontend Feature-Driven Standards (React + Vite)

```
src/features/[domain]/
├── api/            ──► Server State (TanStack Query: useQuery, useMutation)
├── hooks/          ──► Headless Client Logic (useSeatSelector, useSnapPayment, useEventDrawer)
├── components/     ──► Presentational Dumb JSX Views
├── mocks/          ──► MSW Fixtures & Handlers (Sprint UI mandiri tanpa backend)
├── types/          ──► TypeScript Interfaces sinkron dengan /contracts
└── index.ts        ──► Public API Gateway (Satu-satunya pintu ekspor domain)
```

---

## 6. Checklist Eksekusi Sebelum Selesai Generate Kode

Setiap kali menyelesaikan pembuatan/modifikasi file, AI Agent wajib memverifikasi:
* [ ] **Zero Tech Debt & Zero Placeholder:** Tidak ada `TODO`, komentar penundaan, atau fungsi kosongan; penanganan *error* & *edge cases* tuntas.
* [ ] **SOLID & SRP:** Setiap file/fungsi/komponen/service hanya memiliki satu tanggung jawab yang jelas.
* [ ] **Architectural Consistency:** Backend mengikuti `FormRequest -> Controller -> Service -> Resource`; Frontend mengikuti `features/[domain]` melalui public gateway `index.ts`.
* [ ] **SSOT Alignment:** Struktur data sinkron dengan `contracts/*.contract.json` dan perhitungan waktu berdasar `server_time`.
* [ ] **Security Guardrails:** Tidak ada rahasia ter-hardcode, query kritis memakai transaksi ACID + `lockForUpdate()`, parameter binding aktif.
* [ ] **Strict Typing:** Tipe data TypeScript *strictly typed* tanpa `any`.
* [ ] **Response Envelope:** Response backend mengembalikan amplop baku `{ success, message, data, server_time }`.
* [ ] **Build & Compile Ready:** Kode dapat di-compile tanpa error (`npm run type-check` & `php artisan route:list`).
* [ ] **Mandatory Walkthrough & Tracking Terbuat:** Walkthrough komprehensif telah dibuat dan disajikan untuk memudahkan pelacakan perubahan oleh pengguna (mencakup ringkasan perubahan, rincian berkas yang diubah/dibuat, highlight teknis implementasi, hasil verifikasi, dan instruksi pengujian).

---

## 7. Rujukan Berkas Kunci
* **Kontrak SSOT:** `contracts/*.contract.json` (`auth`, `movies`, `events`, `checkout`, `tickets`, `admin`).
* **Dokumentasi Utama:** `docs/Home.md`, `docs/01-Architecture/PRD.md`, `docs/01-Architecture/Event-and-Ticketing-Workflow.md`.
