---
trigger: always_on
description: Mandatory UI/UX Engineering & Anti-Slop Protocol. Enforces reading DESIGN.md tokens and eliminating AI visual slop before touching any UI component.
---

# Visual & UI Design Engineering Protocol (Anti-Slop & DESIGN.md SSOT)

Setiap kali membuat, merombak, merefaktor, atau memberi styling pada komponen antarmuka pengguna (React, Next.js, Tailwind CSS), AI Agent **WAJIB** mematuhi protokol berikut tanpa perlu diminta berulang kali:

## 1. Wajib Baca & Patuhi `DESIGN.md` Terlebih Dahulu
- Sebelum menulis kode JSX/TSX atau class styling apa pun, AI Agent **WAJIB** memeriksa dan mematuhi token desain, skala warna, aturan tipografi, radius, dan constraint komponen yang telah ditetapkan di `DESIGN.md` pada root direktori.
- Gunakan Tailwind tokens dan CSS variables yang telah dikonfigurasi (`bg-vercel-black`, `bg-vercel-card`, `border-neutral-800`, `text-white`, `bg-sinemus-blue` / `bg-[#0066FF]`) alih-alih nilai heksadesimal acak (misal: `bg-[#0f172a]`, `border-slate-800`).

## 2. Zero AI Visual Slop (Anti-Slop Rules)
- **DILARANG Ambient Glow / Neon Blobs**: Dilarang menggunakan gradien ungu/indigo klise (`from-purple-500 to-indigo-500`), blur lingkaran dekoratif latar belakang (`blur-3xl bg-blue-500/20`), atau pendaran neon tanpa izin eksplisit di `DESIGN.md`.
- **DILARANG Cliché Gradient Text**: Dilarang menggunakan teks heading gradien klise (`bg-gradient-to-r ... bg-clip-text text-transparent`) untuk judul.
- **DILARANG Spam Uppercase / Wide Tracking**: Dilarang membubuhkan `uppercase tracking-widest` secara sembarangan pada teks biasa atau label tombol.
- **DILARANG Generic SaaS Clichés**: Hindari bayangan mengambang berlebih (*fluffy drop shadows*), kotak ikon dekoratif dengan gradien, dan rantai utilitas Tailwind yang redundan.
- **DILARANG Arbitrary Border Colors**: Hanya gunakan sistem border proyek (`border-neutral-800`, `border-neutral-800/60`, `border-vercel-border`).

## 3. Disiplin Layout & Micro-Interactions
- Prioritaskan struktur tata letak (Flexbox / Grid), hierarki spasial, dan kontras tipografi sebelum menambahkan pemanis visual.
- Sediakan state interaktif taktil yang lengkap pada setiap elemen yang dapat diklik (`hover:`, `active:scale-[0.98]` atau `active:scale-95`, `focus-visible:ring-2 focus-visible:ring-[#0066FF]`).
- Terapkan aturan ketat dari `.agents/skills/anti-slop/SKILL.md`.
