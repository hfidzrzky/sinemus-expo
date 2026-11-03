# Sinemus Screen — Design System & Engineering Protocol (`DESIGN.md`)

> **Single Source of Truth (SSOT)** untuk seluruh antarmuka visual, tokens, typography, komponen, dan standar estetika UI/UX pada proyek **Sinemus Screen — Campus Software Expo Edition (`sinemus-expo`)**.  
> Wajib dipatuhi oleh seluruh AI Agent, Developer, dan Desainer sebelum membuat, merefaktor, atau menata komponen antarmuka.

---

## 1. Brand Identity & Visual Vibe

### 1.1 Aesthetic Direction: Obsidian Dark Cinema & High-Performance Minimalist
Sinemus Screen menggabungkan nuansa **Bioskop Gelap Premium (Obsidian Dark Cinema)** dengan disiplin arsitektur visual **Vercel-Inspired High-Performance Minimalist**:
- **Pure Black Foundation**: Kanvas berakar pada Pitch Black murni (`#000000`), bukan warna ungu/slate kebiruan yang generik.
- **Razor-Sharp 1px Borders**: Kedalaman dan hierarki visual dibangun melalui garis batas tipis (`1px border`) dengan kontras terkontrol (`#2E2E2E` / `border-neutral-800`), bukan menggunakan bayangan kabur yang tebal.
- **Precision Color Anchoring**: Palet warna didominasi monokrom netral gelap yang tenang, dengan aksen tunggal **Sinemus Electric Royal Blue (`#0066FF`)** sebagai penanda aksi utama, navigasi aktif, dan status penting.
- **Tactile & Functional**: Setiap komponen dirancang fungsional, padat, berbobot, dan memberikan umpan balik taktil mikro (*tactile micro-interactions*) yang reaktif.

### 1.2 Anti-Patterns & Zero Visual Slop Mandates (STRICT)
Dilarang keras menggunakan elemen *AI visual slop* berikut di seluruh kode antarmuka:
- ❌ **DILARANG Ambient Glow / Neon Blobs**: Tidak boleh menggunakan `from-purple-500 to-indigo-500`, lingkaran blur dekoratif (`blur-3xl bg-blue-500/20`), atau efek pendaran neon di latar belakang.
- ❌ **DILARANG Cliché Gradient Text**: Tidak boleh menggunakan teks gradien klise (`bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent`) untuk judul, kecuali secara eksplisit didefinisikan untuk hero poster artwork.
- ❌ **DILARANG Spam Uppercase / Wide Tracking**: Jangan memberi `uppercase tracking-widest` secara sembarangan pada semua teks atau label tombol. Simpan hanya untuk micro-badge metadata (`10px`).
- ❌ **DILARANG Arbitrary Hardcoded Hex**: Dilarang menggunakan nilai heksadesimal acak di inline classes (misal: `bg-[#0f172a]`, `border-[#1e293b]`). Seluruh warna wajib menggunakan Tailwind utility tokens (`bg-vercel-card`, `bg-neutral-900`, `border-neutral-800`, `text-white`).
- ❌ **DILARANG Floating Icon Squircle Boxes**: Hindari kotak ikon dekoratif dengan gradien mengambang khas template SaaS generik.
- ❌ **DILARANG Fluffy Drop Shadows**: Hindari `shadow-2xl` dengan spread buram berwarna cerah. Gunakan bayangan flat terkalibrasi: `shadow-vercel-card` (`0 4px 20px rgba(0, 0, 0, 0.8)`).

---

## 2. Typography Hierarchy

Sistem tipografi Sinemus Screen menggunakan 3 keluarga font Google Fonts yang dimuat secara terkurasi:

| Token Tailwind | Font Family | Tujuan & Karakter |
| :--- | :--- | :--- |
| `font-sans` | **Plus Jakarta Sans**, Inter, system-ui, sans-serif | Teks bodi standar, label input, dialog teks, kontrol interaktif. Geometris, bersih, dan sangat mudah dibaca (*high legibility*). |
| `font-display` | **Outfit**, Plus Jakarta Sans, sans-serif | Judul film, hero banner, heading section besar. Karakter sinematik tebal, tegas, dan berwibawa. |
| `font-mono` | **JetBrains Mono**, Geist Mono, monospace | Kode transaksi (`SNM-TKT-XXXX`), kursi bioskop (`A-04`), countdown timer, angka harga, QR code, metadata teknis. |

### 2.1 Type Scale & Application Specs

```
Hero Display H1   : font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] text-white
Section Title H2  : font-display text-xl sm:text-2xl md:text-3xl font-bold tracking-tight leading-tight text-white
Card / Modal H3   : font-sans text-base sm:text-lg font-semibold tracking-tight leading-snug text-white
Subsection H4     : font-sans text-sm sm:text-base font-medium text-neutral-300
Body Regular      : font-sans text-sm font-normal leading-relaxed text-neutral-200
Body Muted        : font-sans text-sm font-normal leading-relaxed text-neutral-400
Caption / Small   : font-sans text-xs sm:text-[13px] text-neutral-400
Micro Metadata    : font-mono text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-neutral-300
Numeric / Price   : font-mono font-semibold tabular-nums text-white / text-blue-400
```

---

## 3. Color System & Tokens

### 3.1 Primitive Hex & Tailwind Palette Foundations

#### A. Vercel Obsidian Neutral Foundations
| Token Tailwind | Nilai Hex | Penggunaan Konkret |
| :--- | :--- | :--- |
| `bg-vercel-black` | `#000000` | Latar belakang root aplikasi (`body`, full bleed black). |
| `bg-vercel-canvas` | `#0A0A0A` | Kanvas permukaan utama, layout container bodi halaman. |
| `bg-vercel-card` | `#121212` | Permukaan kartu konten, panel form, container daftar item. |
| `bg-vercel-elevated` | `#1A1A1A` | Modal popup, drawer sheet mobile, dropdown popover. |
| `bg-vercel-overlay` | `#222222` | Hover surface pada list item, background chip interaktif. |
| `border-vercel-border` | `#2E2E2E` | Garis batas 1px standar untuk kartu, panel, dan header. |
| `border-vercel-border-subtle` | `#1F1F1F` | Garis batas pemisah internal (divider horizontal/vertikal). |

#### B. Sinemus Brand Blue (Solid, Flat, No Glow)
| Token Tailwind | Nilai Hex | Penggunaan Konkret |
| :--- | :--- | :--- |
| `bg-sinemus-blue` / `text-sinemus-blue` | `#0066FF` | **Electric Royal Blue**: Tombol aksi utama, active route indicator, selection border, focus ring. |
| `bg-sinemus-blue-hover` | `#0052D4` | Hover state pada tombol aksi utama. |
| `border-sinemus-blue-cobalt` | `#0040C1` | Garis aksen penanda aktif, badge border tipis. |
| `bg-sinemus-blue-dark` | `#070D24` | Midnight navy untuk aksen latar belakang kartu VoD premium. |
| `text-sinemus-blue-light` | `#38BDF8` | Sky cyan untuk status dot streaming aktif & teks highlight. |

#### C. Cinema & Semantic Status Accents
| Kategori Token | Nilai Hex | Penggunaan Konkret |
| :--- | :--- | :--- |
| `cinema-amber` | `#F59E0B` | Bintang rating film, badge presale, peringatan kursi segera kedaluwarsa. |
| `destructive` | `#F43F5E` (Rose 500) | Tombol batal pesanan, notifikasi error checkout, peringatan kegagalan pembayaran. |
| `success` | `#10B981` (Emerald 500) | Tiket sukses terverifikasi, status lunas, scanner venue approved. |

### 3.2 Shadcn UI CSS Variables Integration (`src/index.css`)

```css
:root {
  --background: 0 0% 0%;             /* #000000 (Pitch Black) */
  --foreground: 0 0% 98%;           /* #FAFAFA (Vercel Pure White) */
  --card: 0 0% 5%;                  /* #0D0D0D */
  --card-foreground: 0 0% 98%;
  --popover: 0 0% 7%;               /* #121212 */
  --popover-foreground: 0 0% 98%;
  --primary: 0 0% 98%;               /* #FAFAFA (High-Contrast White Button) */
  --primary-foreground: 0 0% 0%;     /* #000000 (Black text on White) */
  --secondary: 0 0% 10%;            /* #1A1A1A */
  --secondary-foreground: 0 0% 98%;
  --muted: 0 0% 12%;                /* #1F1F1F */
  --muted-foreground: 0 0% 63%;     /* #A1A1A1 */
  --destructive: 349 89% 60%;       /* #F43F5E (Rose 500) */
  --destructive-foreground: 0 0% 98%;
  --border: 0 0% 16%;               /* #292929 */
  --input: 0 0% 16%;                /* #292929 */
  --ring: 217 100% 50%;             /* #0066FF (Sinemus Blue Focus Ring) */
  --radius: 0.625rem;               /* 10px */
}
```

---

## 4. Layout & Spacing Rules

### 4.1 Container & Grid Layouts
- **Max Container Width**: `max-w-[1400px]` (`2xl: 1400px`), centered secara otomatis (`mx-auto`).
- **Horizontal Container Padding**: `px-4 sm:px-6 lg:px-8`.
- **Navigation Bar**: Sticky di posisi paling atas (`top-0 z-40`), tinggi `h-16`, dibalut utilitas `.vercel-glass` (`rgba(0,0,0,0.85)` + `backdrop-filter: blur(12px)` + `border-b border-white/[0.08]`).
- **Section Spacing Rhythm**:
  - Jarak antar seksi vertikal utama: `py-10 sm:py-16 md:py-20`.
  - Jarak antar judul seksi dan baris konten: `mb-4 sm:mb-6`.
  - Grid poster katalog film/event:
    - Mobile: `grid-cols-2 gap-3` atau horizontal snap slider (`overflow-x-auto snap-x scrollbar-none`).
    - Tablet: `sm:grid-cols-3 md:grid-cols-4 gap-4`.
    - Desktop: `lg:grid-cols-5 xl:grid-cols-6 gap-5`.

### 4.2 Border Radius Hierarchy
| Token | Ukuran | Komponen Sasaran |
| :--- | :--- | :--- |
| `rounded` / `rounded-md` | `4px - 6px` | Tag metadata mini, pill indikator kecil, checkbox. |
| `rounded-lg` | `0.625rem` (10px) | Tombol aksi (Button), input formulir, search bar, tooltip. |
| `rounded-xl` | `0.75rem` (12px) | Poster film, kartu katalog, dropdown menu, dialog konfirmasi kecil. |
| `rounded-2xl` | `1rem` (16px) | Panel seksi, banner hero, kartu ringkasan checkout. |
| `rounded-3xl` / `rounded-t-[28px]` | `1.5rem` / `28px` | Modal dialog desktop (`sm:rounded-3xl`), Mobile drawer bottom sheet (`rounded-t-[28px]`). |
| `rounded-full` | `9999px` | Avatar profil, pill badges, status dots, icon buttons bulat. |

---

## 5. Component Mechanics

### 5.1 Buttons
- **High-Contrast Primary Button (Vercel Style)**:
  ```tsx
  className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black shadow-sm transition-all hover:bg-neutral-200 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#0066FF] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
  ```
- **Sinemus Brand Primary Button (Cinema Blue)**:
  ```tsx
  className="rounded-lg bg-[#0066FF] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#0052D4] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#0066FF] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
  ```
- **Secondary / Outline Button**:
  ```tsx
  className="rounded-lg border border-neutral-800 bg-neutral-900/90 px-4 py-2 text-sm font-medium text-neutral-300 transition-all hover:border-neutral-700 hover:text-white active:scale-[0.98]"
  ```
- **Destructive Button**:
  ```tsx
  className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-400 transition-all hover:bg-rose-500/20 active:scale-[0.98]"
  ```
- **Ghost / Icon Button**:
  ```tsx
  className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-white active:scale-95"
  ```

### 5.2 Cards & Movie Posters
- **Movie Poster Card Mechanics**:
  - Menggunakan aspect ratio sinematik baku `aspect-[2/3]`.
  - Kontainer bodi: `overflow-hidden rounded-xl bg-neutral-900 relative group cursor-pointer select-none`.
  - Poster image: `h-full w-full object-cover transition-transform duration-300 group-hover:scale-105`.
  - Hover vignette: `pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100`.
  - Age & Access Model Badges: `absolute top-2 left-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md`.

### 5.3 Forms & Inputs
- **Base Input Style**:
  ```tsx
  className="w-full rounded-xl border border-neutral-800 bg-neutral-900/90 px-3.5 py-2.5 text-sm text-white placeholder:text-neutral-500 transition-colors focus:border-[#0066FF] focus:outline-none focus:ring-1 focus:ring-[#0066FF]"
  ```
- **Error State**: Tambahkan `border-rose-500 focus:border-rose-500 focus:ring-rose-500`.
- **Disabled State**: `opacity-50 cursor-not-allowed bg-neutral-950`.

### 5.4 Modals & Mobile Drawers
- **Responsive Sheet Strategy**:
  - Mobile (`< 640px`): Muncul sebagai bottom sheet drawer menempel di bawah (`fixed inset-x-0 bottom-0 rounded-t-[28px] max-h-[92vh] overflow-y-auto bg-neutral-950`). Memiliki pegangan visual di atas: `mx-auto mt-2.5 h-1 w-12 rounded-full bg-neutral-800`.
  - Desktop (`>= 640px`): Mengapung presisi di tengah layar (`sm:items-center sm:justify-center sm:rounded-3xl sm:border sm:border-neutral-800/60 sm:max-w-lg`).
  - Backdrop: `fixed inset-0 z-50 bg-black/80 backdrop-blur-md`.

### 5.5 State Indicators & Status Dots
- Menggunakan komponen baku `StatusDot` (`src/components/ui/status-dot.tsx`):
  - `READY` / `active`: Hijau / Biru dengan efek riak lembut (`iconiq-status-dot-ripple`).
  - `ERROR`: Rose-500 tanpa riak agresif.
  - `BUILDING` / `QUEUED`: Netral / Abu-abu dengan pulsa statis.
- Non-Distracting Motion: Animasi riak otomatis nonaktif pada user dengan preferensi `prefers-reduced-motion: reduce`.

---

## 6. Micro-Interactions & Animation Standards

### 6.1 Transition Times & Curves
- **Micro-Transitions (Button hover, border color, text opacity)**: `duration-150 ease-out`.
- **Card Hover Elevation & Poster Scale**: `duration-300 ease-out`.
- **Modal / Popover Enter Animation**: `animate-in fade-in zoom-in-95 duration-150`.
- **Dropdown Menu / Sheet Drawer**: `duration-200 ease-out`.

### 6.2 Tactile Click Feedback
Semua elemen yang dapat diklik (tombol, tab, kartu, pill) **WAJIB** memiliki feedback klik taktil:
- Tombol aksi utama & sekunder: `active:scale-[0.98]`.
- Icon buttons kecil: `active:scale-95`.
- Navigasi link: Sliding highlight bar presisi di bawah teks aktif (`bg-[#0066FF] h-[2.5px] rounded-full duration-300 ease-out`).

### 6.3 Minimalist Custom Scrollbars
Gunakan utility classes yang telah terkalibrasi di `src/index.css`:
- **Default Scrollbar**: Lebar `6px`, thumb `#27272a`, hover `#3f3f46`, track transparan.
- **Admin Sidebar (`.admin-sidebar-scrollbar`)**: Transparan saat idle, muncul `#27272a` saat hover, hover thumb `#0066ff`.
- **Seatmap Canvas (`.admin-canvas-scrollbar`)**: Khusus kanvas interaktif layout kursi venue bioskop.

---

## 7. Checklist Kepatuhan UI untuk Setiap Komponen Baru

Sebelum mengajukan komponen UI baru ke peninjauan QA:
- [ ] Apakah `DESIGN.md` telah dibaca dan dipatuhi secara tuntas?
- [ ] Bebas dari *ambient purple/indigo glow*, *gradient text* klise, dan *decorative blur blobs*?
- [ ] Menggunakan Tailwind tokens (`bg-vercel-card`, `bg-neutral-900`, `border-neutral-800`) tanpa hardcoded hex sembarangan?
- [ ] Font family konsisten (`font-display` untuk judul film/heading, `font-sans` untuk teks kontrol, `font-mono` untuk waktu/kode/harga)?
- [ ] Responsif: Mendukung mobile bottom sheet drawer dan desktop centered dialog?
- [ ] State interaktif lengkap: `hover:`, `active:scale-[0.98]`, `focus-visible:ring-2`?
- [ ] Aksesibilitas: Mendukung navigasi keyboard (`role`, `tabIndex`, `onKeyDown`) dan kontras warna terbaca?
