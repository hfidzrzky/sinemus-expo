# Changelog

All notable changes to the **Sinemus Indonesia Platform v2** (`sinemus-platform`) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0-beta.2] - 2026-10-28

### Milestone
**Admin Studio, Financial Audit & Venue Gate Scanner Integration Complete**

This pre-release marks the completion and integration of all Super Admin Studio capabilities, Venue Gate Mobile QR Scanner, Banner Management, Voucher Promo Engine, and Cinema Presale Ticket Injection workflow on top of the existing customer core platform.

### Added
- **Admin Studio Operations (`admin`):**
  - Event & Screening Schedule management with dynamic seat layout controls.
  - VoD Movie management with Cloudflare Stream signed playback URL tokens.
  - Orders & Financial Audit dashboard with detailed revenue breakdown, CSV export, and email notification resend.
  - Promotional Voucher Management with flexible discount types (fixed & percentage), usage quotas, and event target binding.
  - Banner & Promotion Management with dynamic display modes (Slider, Promo Pop-up, Static Highlight).
  - CDS Presale Ticket Injection Studio (3 Schemes: Manual, Booking Ref, and Bulk Import) for M-Tix / Cinema Kiosk integration.
  - Mobile QR Venue Scanner for gate operations with sound effects, camera flash toggle, and offline grace-period handling.
- **Quality & Security Guardrails (`gatekeeper-qa`):**
  - Integrated `Gatekeeper-QA` subagent mandate with 25 audit pillars across security, architecture, performance, and scalability.
  - Strict non-conversational audit intercept protocol prior to git branch operations.

---

## [2.0.0-beta.1] - 2026-09-29

### Milestone
**Customer Core Modules & E-Commerce Flow Complete**

This pre-release marks the completion and integration of all customer-facing features on the `staging` environment prior to the development of the Admin Studio & Scanner modules.

### Added
- **Authentication Domain (`auth`):**
  - Google OAuth2 ID Token server-side verification with Google Client API.
  - Permanent WhatsApp phone number locking (`is_phone_locked = true`) on first profile completion.
  - Sanctum token lifecycle with user role segregation (`customer` vs `super_admin`).
- **Screening & Catalog Domain (`events` & `movies`):**
  - Event screening schedule and VoD movie catalog browsing.
  - Integration with Cloudflare Stream for trailer and signed JWT playback tokens for VoD movies.
  - Real-time seat layout visualizer with dynamic availability status.
- **Checkout & Payment Domain (`checkout`):**
  - Midtrans Snap gateway integration with automatic transaction expiration.
  - Pessimistic concurrency guard (`lockForUpdate`) with 15-minute seat reservation lock in database transactions.
  - Zero-trust Midtrans webhook handler with `hash_equals` timing-safe signature verification.
  - Support for presale vouchers and promotional discount deductions.
- **Tickets Domain (`tickets`):**
  - Customer ticket management dashboard (`MyTicketsPage`) with active, checked-in, and expired states.
  - Dynamic e-ticket generation with encrypted single-use QR verification payloads.
  - Presale ticket grace period lifecycle handling.
  - PDF e-ticket export and rendering capability.

### Architecture & Security
- Strict API envelope structure (`{ success, message, data, server_time }`) using backend `server_time` as the Single Source of Truth (SSOT).
- Monorepo structure with Feature-Driven frontend architecture (Public Gateways, React Query, Tailwind CSS, TypeScript).
- Backend Skinny Controller, FormRequest input validation, and Domain Service ACID layers in Laravel 11.

---

## [Roadmap to v2.0.0 Final]
- **`2.0.0-beta.1`**: Customer Core Modules Complete (Customer Experience, Checkout, VoD Streaming). [COMPLETED]
- **`2.0.0-beta.2`**: Admin Studio & Venue Scanner Integrated (Management, Financial Audit, Injeksi Tiket, Gate Scanner). [COMPLETED]
- **`2.0.0-rc.1`**: Release Candidate (End-to-end UAT, Staging load testing, and Penetration testing).
- **`2.0.0`**: Official Production Launch (Go-Live).
