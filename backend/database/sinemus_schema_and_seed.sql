-- ==============================================================================
-- SINEMUS SCREEN (Campus Software Expo Edition)
-- Full Database Schema (DDL) & Initial Seed Data
-- Target Database: sinemus_expo (or sinemus)
-- Compatible with MySQL 8.0+ and MariaDB 10.4+
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+07:00";

-- Pilih database aktif (sesuai database di phpMyAdmin Anda)
CREATE DATABASE IF NOT EXISTS `sinemus_expo` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `sinemus_expo`;

-- ==============================================================================
-- 1. STRUKTUR TABEL (DDL)
-- ==============================================================================

DROP TABLE IF EXISTS `ticket_checkins`;
DROP TABLE IF EXISTS `seat_locks`;
DROP TABLE IF EXISTS `seats`;
DROP TABLE IF EXISTS `schedules`;
DROP TABLE IF EXISTS `event_venues`;
DROP TABLE IF EXISTS `event_transactions`;
DROP TABLE IF EXISTS `user_movie_access`;
DROP TABLE IF EXISTS `movie_transactions`;
DROP TABLE IF EXISTS `banners`;
DROP TABLE IF EXISTS `vouchers`;
DROP TABLE IF EXISTS `movies`;
DROP TABLE IF EXISTS `events`;
DROP TABLE IF EXISTS `system_settings`;
DROP TABLE IF EXISTS `personal_access_tokens`;
DROP TABLE IF EXISTS `sessions`;
DROP TABLE IF EXISTS `cache`;
DROP TABLE IF EXISTS `cache_locks`;
DROP TABLE IF EXISTS `jobs`;
DROP TABLE IF EXISTS `failed_jobs`;
DROP TABLE IF EXISTS `job_batches`;
DROP TABLE IF EXISTS `users`;

-- ------------------------------------------------------------------------------
-- Tabel: users
-- ------------------------------------------------------------------------------
CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `google_id` varchar(100) NOT NULL COMMENT 'Sub claim dari Google Identity Services',
  `email` varchar(191) NOT NULL COMMENT 'Email resmi dari Google (Read-only, immutable)',
  `name` varchar(100) NOT NULL COMMENT 'Nama lengkap penonton',
  `avatar_url` varchar(255) DEFAULT NULL COMMENT 'URL avatar profil dari Google',
  `phone_number` varchar(20) DEFAULT NULL COMMENT 'No WhatsApp (08xx / +628xx)',
  `is_phone_locked` tinyint(1) NOT NULL DEFAULT 0 COMMENT '1 = Terkunci permanen setelah diisi perdana',
  `birth_date` date DEFAULT NULL COMMENT 'Tanggal lahir penonton untuk verifikasi rating usia',
  `role` enum('customer','super_admin') NOT NULL DEFAULT 'customer' COMMENT 'Peran akses sistem',
  `last_login_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_google_id_unique` (`google_id`),
  UNIQUE KEY `users_email_unique` (`email`),
  UNIQUE KEY `users_phone_number_unique` (`phone_number`),
  KEY `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Tabel: movies (Katalog VoD / Streaming)
-- ------------------------------------------------------------------------------
CREATE TABLE `movies` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `slug` varchar(191) NOT NULL,
  `title` varchar(255) NOT NULL,
  `synopsis` text NOT NULL,
  `poster_path` varchar(255) NOT NULL COMMENT 'Poster portrait 2:3 di Cloudflare Images',
  `backdrop_path` varchar(255) NOT NULL COMMENT 'Banner landscape 16:9 di Cloudflare Images',
  `director` varchar(150) NOT NULL,
  `cast` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'Array nama pemeran' CHECK (json_valid(`cast`)),
  `genre` varchar(100) NOT NULL,
  `age_rating` enum('SU','13+','17+','21+') NOT NULL DEFAULT 'SU',
  `access_model` enum('rental','free','pass_only') NOT NULL DEFAULT 'rental',
  `duration_minutes` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `rental_duration_hours` int(10) UNSIGNED NOT NULL DEFAULT 48,
  `cloudflare_trailer_uid` char(32) DEFAULT NULL,
  `cloudflare_video_uid` char(32) NOT NULL,
  `look_films` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Array URL foto still 16:9' CHECK (`look_films` is null or json_valid(`look_films`)),
  `is_featured` tinyint(1) NOT NULL DEFAULT 0,
  `release_year` year(4) NOT NULL,
  `is_published` tinyint(1) NOT NULL DEFAULT 0,
  `scheduled_publish_at` datetime DEFAULT NULL,
  `scheduled_unpublish_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `movies_slug_unique` (`slug`),
  KEY `idx_movies_browse` (`is_published`,`genre`),
  KEY `idx_movies_publishing_schedule` (`is_published`,`scheduled_publish_at`,`scheduled_unpublish_at`),
  KEY `idx_movies_featured` (`is_featured`,`is_published`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Tabel: events (Screening Event Sinemus)
-- ------------------------------------------------------------------------------
CREATE TABLE `events` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `slug` varchar(191) NOT NULL,
  `event_type` enum('regular') NOT NULL DEFAULT 'regular' COMMENT 'Screening reguler Sinemus Space (assigned seating / GA)',
  `seating_type` enum('assigned_seating','general_admission') NOT NULL DEFAULT 'assigned_seating',
  `sales_start_at` datetime DEFAULT NULL COMMENT 'Batas awal pembukaan penjualan tiket',
  `sales_end_at` datetime DEFAULT NULL COMMENT 'Batas penutupan penjualan tiket',
  `event_concludes_at` datetime DEFAULT NULL COMMENT 'Batas waktu penayangan selesai dan otomatis draf',
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `synopsis_short` varchar(255) NOT NULL,
  `poster_path` varchar(255) DEFAULT NULL,
  `backdrop_path` varchar(255) DEFAULT NULL,
  `director` varchar(150) NOT NULL,
  `genre` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (`genre` is null or json_valid(`genre`)),
  `duration_minutes` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `release_year` smallint(5) UNSIGNED DEFAULT NULL,
  `age_rating` enum('SU','13+','17+','21+') NOT NULL DEFAULT 'SU',
  `cast` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`cast`)),
  `cloudflare_teaser_uid` char(32) DEFAULT NULL,
  `venue_name` varchar(255) DEFAULT NULL,
  `cinema_partner` varchar(100) DEFAULT NULL,
  `venue_address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `target_screening_month` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `is_featured` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `events_slug_unique` (`slug`),
  KEY `idx_events_active_city` (`is_active`,`city`),
  KEY `idx_events_featured` (`is_featured`,`is_active`),
  KEY `idx_events_seating_type` (`event_type`,`seating_type`),
  KEY `idx_events_sales_window` (`sales_start_at`,`sales_end_at`),
  KEY `idx_events_concludes_active` (`is_active`,`event_concludes_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Tabel: event_venues (Venue Bioskop / Bioskop Komunitas)
-- ------------------------------------------------------------------------------
CREATE TABLE `event_venues` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `event_id` bigint(20) UNSIGNED NOT NULL,
  `venue_name` varchar(255) NOT NULL,
  `cinema_partner` varchar(100) DEFAULT NULL,
  `venue_address` text NOT NULL,
  `city` varchar(100) NOT NULL,
  `google_maps_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_event_venues_event_city` (`event_id`,`city`),
  CONSTRAINT `fk_event_venues_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Tabel: schedules (Jadwal & Sesi Penayangan)
-- ------------------------------------------------------------------------------
CREATE TABLE `schedules` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `event_id` bigint(20) UNSIGNED NOT NULL,
  `studio_name` varchar(50) DEFAULT 'Studio 1',
  `event_venue_id` bigint(20) UNSIGNED DEFAULT NULL,
  `show_time` datetime NOT NULL COMMENT 'Waktu pemutaran film',
  `ticket_price` decimal(12,2) NOT NULL COMMENT 'Harga tiket reguler',
  `vip_ticket_price` decimal(12,2) DEFAULT NULL COMMENT 'Harga tiket VIP',
  `total_seats` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_schedules_event_showtime` (`event_id`,`show_time`,`is_active`),
  KEY `idx_schedules_venue_showtime` (`event_venue_id`,`show_time`,`is_active`),
  CONSTRAINT `fk_schedules_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_schedules_venue` FOREIGN KEY (`event_venue_id`) REFERENCES `event_venues` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Tabel: seats (Master Kursi Fisik)
-- ------------------------------------------------------------------------------
CREATE TABLE `seats` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `schedule_id` bigint(20) UNSIGNED NOT NULL,
  `row_label` varchar(5) NOT NULL COMMENT 'Label baris (A, B, C...)',
  `grid_column` int(10) UNSIGNED DEFAULT NULL COMMENT 'Posisi koordinat kolom (1..N)',
  `seat_number` int(10) UNSIGNED NOT NULL,
  `seat_code` varchar(10) NOT NULL COMMENT 'Kode gabungan (A1, B8)',
  `seat_type` enum('standard','vip','aisle') NOT NULL DEFAULT 'standard',
  `status` enum('available','booked','disabled') NOT NULL DEFAULT 'available',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_schedule_seat_code` (`schedule_id`,`seat_code`),
  KEY `idx_seats_schedule_status` (`schedule_id`,`status`),
  KEY `idx_seats_grid_pos` (`schedule_id`,`row_label`,`grid_column`),
  CONSTRAINT `fk_seats_schedule` FOREIGN KEY (`schedule_id`) REFERENCES `schedules` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Tabel: seat_locks (Kunci Kursi Sementara Saat Checkout)
-- ------------------------------------------------------------------------------
CREATE TABLE `seat_locks` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `schedule_id` bigint(20) UNSIGNED NOT NULL,
  `seat_id` bigint(20) UNSIGNED DEFAULT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `quantity` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `order_id` varchar(50) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_seat_locks_schedule_expiry` (`schedule_id`,`expires_at`),
  KEY `idx_seat_locks_seat_id` (`seat_id`),
  KEY `idx_seat_locks_order_expiry` (`order_id`,`expires_at`),
  KEY `idx_seat_locks_user` (`user_id`),
  CONSTRAINT `fk_seat_locks_schedule` FOREIGN KEY (`schedule_id`) REFERENCES `schedules` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_seat_locks_seat` FOREIGN KEY (`seat_id`) REFERENCES `seats` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_seat_locks_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Tabel: vouchers (Diskon & Promo)
-- ------------------------------------------------------------------------------
CREATE TABLE `vouchers` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `promo_type` varchar(32) NOT NULL DEFAULT 'voucher_code',
  `code` varchar(50) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `discount_type` varchar(32) NOT NULL DEFAULT 'percentage',
  `discount_value` decimal(12,2) NOT NULL,
  `min_purchase` decimal(12,2) NOT NULL DEFAULT 0.00,
  `max_discount` decimal(12,2) DEFAULT NULL,
  `item_type` enum('all','ticket','movie_rental') NOT NULL DEFAULT 'all',
  `event_id` bigint(20) UNSIGNED DEFAULT NULL,
  `movie_id` bigint(20) UNSIGNED DEFAULT NULL,
  `quota_total` int(10) UNSIGNED NOT NULL DEFAULT 100,
  `quota_used` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `max_uses_per_user` int(10) UNSIGNED DEFAULT NULL,
  `valid_from` datetime NOT NULL,
  `valid_until` datetime NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `vouchers_code_unique` (`code`),
  KEY `idx_vouchers_promo_type` (`promo_type`),
  KEY `idx_vouchers_event_id` (`event_id`),
  KEY `idx_vouchers_movie_id` (`movie_id`),
  KEY `idx_vouchers_validation` (`code`,`is_active`,`valid_from`,`valid_until`),
  CONSTRAINT `fk_vouchers_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_vouchers_movie` FOREIGN KEY (`movie_id`) REFERENCES `movies` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Tabel: event_transactions (Transaksi Tiket Event)
-- ------------------------------------------------------------------------------
CREATE TABLE `event_transactions` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` varchar(50) NOT NULL COMMENT 'Format: SNM-TKT-YYYY-XXXX',
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `schedule_id` bigint(20) UNSIGNED NOT NULL,
  `voucher_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ticket_quantity` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `gross_amount` decimal(12,2) NOT NULL,
  `discount_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `net_amount` decimal(12,2) NOT NULL,
  `snap_token` varchar(255) DEFAULT NULL,
  `payment_status` enum('pending','paid','expired','failed','cancelled') NOT NULL DEFAULT 'pending',
  `payment_type` varchar(50) DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `ticket_code` varchar(50) DEFAULT NULL,
  `qr_hash` varchar(64) DEFAULT NULL,
  `checkin_status` enum('pending','checked_in') NOT NULL DEFAULT 'pending',
  `checkin_at` datetime DEFAULT NULL,
  `snapshot_event_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`snapshot_event_data`)),
  `snapshot_seats` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (`snapshot_seats` is null or json_valid(`snapshot_seats`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `event_transactions_order_id_unique` (`order_id`),
  UNIQUE KEY `event_transactions_ticket_code_unique` (`ticket_code`),
  UNIQUE KEY `event_transactions_qr_hash_unique` (`qr_hash`),
  KEY `idx_event_trx_user_status` (`user_id`,`payment_status`),
  KEY `idx_event_trx_schedule` (`schedule_id`),
  KEY `idx_event_trx_checkin` (`checkin_status`),
  CONSTRAINT `fk_event_trx_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_event_trx_schedule` FOREIGN KEY (`schedule_id`) REFERENCES `schedules` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_event_trx_voucher` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Tabel: ticket_checkins (Riwayat Scan Tiket di Venue)
-- ------------------------------------------------------------------------------
CREATE TABLE `ticket_checkins` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `transaction_id` bigint(20) UNSIGNED NOT NULL,
  `scanned_by_user_id` bigint(20) UNSIGNED NOT NULL,
  `device_info` varchar(255) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `scanned_at` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_checkins_trx` (`transaction_id`),
  KEY `idx_checkins_staff` (`scanned_by_user_id`),
  CONSTRAINT `fk_checkins_trx` FOREIGN KEY (`transaction_id`) REFERENCES `event_transactions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_checkins_staff` FOREIGN KEY (`scanned_by_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Tabel: banners (Hero Banner Carousel Beranda)
-- ------------------------------------------------------------------------------
CREATE TABLE `banners` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` varchar(255) DEFAULT NULL,
  `subtitle` text DEFAULT NULL,
  `badge_text` varchar(50) DEFAULT NULL,
  `age_rating` varchar(20) DEFAULT NULL,
  `genre` varchar(100) DEFAULT NULL,
  `release_year` smallint(5) UNSIGNED DEFAULT NULL,
  `duration_minutes` smallint(5) UNSIGNED DEFAULT NULL,
  `image_path` varchar(255) NOT NULL,
  `display_mode` varchar(50) NOT NULL DEFAULT 'spotlight',
  `link_type` enum('movie','event','voucher','url') NOT NULL DEFAULT 'movie',
  `movie_id` bigint(20) UNSIGNED DEFAULT NULL,
  `event_id` bigint(20) UNSIGNED DEFAULT NULL,
  `target_url` varchar(255) DEFAULT NULL,
  `button_text` varchar(50) NOT NULL DEFAULT 'Lihat Detail',
  `order_priority` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `start_at` datetime DEFAULT NULL,
  `end_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_banners_active_order` (`is_active`,`order_priority`),
  KEY `idx_banners_schedule` (`is_active`,`start_at`,`end_at`),
  CONSTRAINT `fk_banners_movie` FOREIGN KEY (`movie_id`) REFERENCES `movies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_banners_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Tabel: movie_transactions (Transaksi Sewa VoD)
-- ------------------------------------------------------------------------------
CREATE TABLE `movie_transactions` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` varchar(50) NOT NULL COMMENT 'Format: SNM-VOD-YYYY-XXXX',
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `movie_id` bigint(20) UNSIGNED NOT NULL,
  `voucher_id` bigint(20) UNSIGNED DEFAULT NULL,
  `gross_amount` decimal(12,2) NOT NULL,
  `discount_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `net_amount` decimal(12,2) NOT NULL,
  `snap_token` varchar(255) DEFAULT NULL,
  `payment_status` enum('pending','paid','expired','failed','cancelled') NOT NULL DEFAULT 'pending',
  `payment_type` varchar(50) DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `snapshot_movie_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`snapshot_movie_data`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `movie_transactions_order_id_unique` (`order_id`),
  KEY `idx_movie_trx_user_status` (`user_id`,`payment_status`),
  KEY `idx_movie_trx_movie_id` (`movie_id`),
  CONSTRAINT `fk_movie_trx_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_movie_trx_movie` FOREIGN KEY (`movie_id`) REFERENCES `movies` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_movie_trx_voucher` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Tabel: user_movie_access (Hak Akses Nonton VoD Pengguna)
-- ------------------------------------------------------------------------------
CREATE TABLE `user_movie_access` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `movie_id` bigint(20) UNSIGNED NOT NULL,
  `transaction_id` bigint(20) UNSIGNED DEFAULT NULL,
  `access_status` enum('active','expired','revoked') NOT NULL DEFAULT 'active',
  `rental_start_at` datetime NOT NULL,
  `rental_expires_at` datetime NOT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `revoke_reason` enum('none','refund','violation','system_error','manual_admin') NOT NULL DEFAULT 'none',
  `admin_notes` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_access_fast_check` (`user_id`,`movie_id`,`access_status`,`rental_expires_at`),
  KEY `idx_access_expiry` (`rental_expires_at`),
  KEY `idx_access_trx` (`transaction_id`),
  CONSTRAINT `fk_access_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_access_movie` FOREIGN KEY (`movie_id`) REFERENCES `movies` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_access_trx` FOREIGN KEY (`transaction_id`) REFERENCES `movie_transactions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Tabel: system_settings (Konfigurasi Global & Emergency)
-- ------------------------------------------------------------------------------
CREATE TABLE `system_settings` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `group` varchar(50) NOT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`payload`)),
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `system_settings_group_unique` (`group`),
  KEY `system_settings_group_index` (`group`),
  KEY `system_settings_updated_by_foreign` (`updated_by`),
  CONSTRAINT `fk_system_settings_admin` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Tabel Infrastruktur: personal_access_tokens, sessions, cache, jobs
-- ------------------------------------------------------------------------------
CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==============================================================================
-- 2. INSERT INITIAL DATA (SEEDS)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- Data Users
-- ------------------------------------------------------------------------------
INSERT INTO `users` (`id`, `google_id`, `email`, `name`, `avatar_url`, `phone_number`, `is_phone_locked`, `birth_date`, `role`, `created_at`, `updated_at`) VALUES
(1, 'google_superadmin_001', 'admin@sinemus.id', 'Super Admin Sinemus', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', '081234567890', 1, '1995-01-01', 'super_admin', NOW(), NOW()),
(2, 'google_customer_001', 'penonton@sinemus.id', 'Sineas Muslim Indonesia', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', '081298765432', 1, '2000-05-15', 'customer', NOW(), NOW()),
(3, 'google_customer_002', 'user_b@example.com', 'Penonton B (Demo Anti-IDOR)', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', '081345678901', 1, '1998-08-20', 'customer', NOW(), NOW());

-- ------------------------------------------------------------------------------
-- Data System Settings
-- ------------------------------------------------------------------------------
INSERT INTO `system_settings` (`id`, `group`, `payload`, `updated_by`, `created_at`, `updated_at`) VALUES
(1, 'business_policies', '{"seat_lock_duration_minutes": 15, "vod_rental_duration_hours": 48, "platform_service_fee": 0, "max_tickets_per_order": 8, "enable_ticket_cancellation": false}', 1, NOW(), NOW()),
(2, 'public_contact', '{"whatsapp_admin_number": "6281234567890", "whatsapp_prefill_template": "Halo Sinemus, saya mengalami kendala terkait pemesanan tiket/pemutaran...", "support_email": "support@sinemus.id", "ticket_sender_name": "Sinemus Screen", "ticket_sender_email": "tiket@sinemus.id", "social_media": {"instagram": "https://instagram.com/sinemus.id", "tiktok": "https://tiktok.com/@sinemus.id", "youtube": "https://youtube.com/@sinemusscreen"}, "operating_hours": "Senin - Minggu: 09:00 - 22:00 WIB"}', 1, NOW(), NOW()),
(3, 'emergency_controls', '{"is_maintenance_mode": false, "maintenance_message": "Sistem Sinemus sedang dalam pemeliharaan berkala untuk peningkatan performa. Silakan kembali beberapa saat lagi.", "freeze_cinema_ticket_sales": false, "freeze_vod_rentals": false, "emergency_alert_banner": {"is_active": false, "message": "", "type": "warning"}}', 1, NOW(), NOW());

-- ------------------------------------------------------------------------------
-- Data Master Film VoD (Katalog Streaming)
-- ------------------------------------------------------------------------------
INSERT INTO `movies` (`id`, `slug`, `title`, `synopsis`, `poster_path`, `backdrop_path`, `director`, `cast`, `genre`, `age_rating`, `access_model`, `duration_minutes`, `price`, `rental_duration_hours`, `cloudflare_trailer_uid`, `cloudflare_video_uid`, `look_films`, `is_featured`, `release_year`, `is_published`, `created_at`, `updated_at`) VALUES
(1, 'surat-terakhir-sang-kyai', 'Surat Terakhir Sang Kyai', 'Kisah perjuangan dakwah dan kebangsaan seorang ulama sepuh di pelosok pesantren Jawa Timur menjelang masa revolusi kemerdekaan. Sarat dengan pesan nilai persatuan, keteguhan akidah, dan keikhlasan pengorbanan.', 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&q=80', 'https://images.unsplash.com/photo-1518676599903-889d7010f368?w=1280&q=80', 'Ahmad Fauzi Rahman', '["Deddy Mizwar", "Christine Hakim", "Reza Rahadian"]', 'Drama Religi', 'SU', 'rental', 115, 25000.00, 48, '3b7b40974cfca4578168a2bf61036cb5', '3b7b40974cfca4578168a2bf61036cb5', '["https://images.unsplash.com/photo-1518676599903-889d7010f368?w=800&q=80"]', 1, 2025, 1, NOW(), NOW()),
(2, 'cahaya-di-ufuk-timur', 'Cahaya di Ufuk Timur', 'Perjalanan inspiratif relawan medis muslim muda yang mengabdikan hidupnya di wilayah kepulauan terpencil Indonesia Timur, mendamaikan konflik horizontal lewat pendekatan kemanusiaan.', 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=600&q=80', 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1280&q=80', 'Siti Maryam Alatas', '["Fedi Nuril", "Laudya Cynthia Bella", "Lukman Sardi"]', 'Inspiratif', '13+', 'rental', 108, 20000.00, 48, '7f341b3a165b5ec1e699cb4f46995648', '7f341b3a165b5ec1e699cb4f46995648', '["https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&q=80"]', 1, 2026, 1, NOW(), NOW());

-- ------------------------------------------------------------------------------
-- Data Master Event Screening
-- ------------------------------------------------------------------------------
INSERT INTO `events` (`id`, `slug`, `event_type`, `seating_type`, `sales_start_at`, `sales_end_at`, `event_concludes_at`, `title`, `description`, `synopsis_short`, `poster_path`, `backdrop_path`, `director`, `genre`, `duration_minutes`, `release_year`, `age_rating`, `cast`, `cloudflare_teaser_uid`, `venue_name`, `cinema_partner`, `venue_address`, `city`, `target_screening_month`, `is_active`, `is_featured`, `created_at`, `updated_at`) VALUES
(1, 'cinta-dan-sejarah-xxi-plaza-senayan', 'regular', 'assigned_seating', NOW() - INTERVAL 5 DAY, NOW() + INTERVAL 25 DAY, NOW() + INTERVAL 30 DAY, 'CINTA DAN SEJARAH (Special Cinema Premiere)', 'Sebuah mahakarya sinema yang menelusuri lorong waktu perjuangan kemerdekaan melalui surat-surat cinta rahasia yang terkubur selama tujuh dekade. Menghadirkan sinematografi 35mm memukau dan tata suara surround 7.1 yang diproduksi khusus untuk pengalaman layar lebar.', 'Kisah romansa epik dua insan di tengah gejolak revolusi kemerdekaan yang terpisah oleh garis pertempuran.', 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&q=80', 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1280&q=80', 'Baskara Mahendra Putra', '["Drama", "Sejarah", "Romansa"]', 125, 2026, '13+', '["Reza Rahadian", "Laura Basuki", "Chicco Jerikho", "Putri Marino"]', '5d5b376379fc387d9c9e32305193433d', 'Cinema XXI Plaza Senayan', 'Cinema 21 / XXI', 'Plaza Senayan Lantai 5, Jl. Asia Afrika No.8, Gelora, Tanah Abang', 'Jakarta Pusat', 'November 2026', 1, 1, NOW(), NOW()),
(2, 'merajut-asa-cgv-grand-indonesia', 'regular', 'assigned_seating', NOW() - INTERVAL 3 DAY, NOW() + INTERVAL 20 DAY, NOW() + INTERVAL 25 DAY, 'MERAJUT ASA (Exclusive Premiere Screening)', 'Dokumenter naratif menyentuh hati tentang kebangkitan pengrajin tenun tradisional Lombok pasca bencana. Film ini memotret keuletan perempuan penenun dalam mempertahankan tradisi leluhur sekaligus bertransformasi secara ekonomi digital modern.', 'Potret keuletan penenun tradisional Lombok menjaga warisan kain pusaka di era modern.', 'https://images.unsplash.com/photo-1518676599903-889d7010f368?w=600&q=80', 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1280&q=80', 'Nurul Annisa Fitriani', '["Dokumenter", "Humanis", "Budaya"]', 98, 2026, 'SU', '["Baiq Ratna Sari", "Dian Sastrowardoyo (Narator)", "Gusti Randa"]', '9a7e6c5b4d3f2a1e0b8c7d6e5f4a3b2c', 'CGV Grand Indonesia', 'CGV Cinemas', 'Grand Indonesia Mall West Mall Lt.8, Jl. M.H. Thamrin No.1', 'Jakarta Pusat', 'Desember 2026', 1, 1, NOW(), NOW());

-- ------------------------------------------------------------------------------
-- Data Event Venues
-- ------------------------------------------------------------------------------
INSERT INTO `event_venues` (`id`, `event_id`, `venue_name`, `cinema_partner`, `venue_address`, `city`, `google_maps_url`, `created_at`, `updated_at`) VALUES
(1, 1, 'Cinema XXI Plaza Senayan', 'Cinema 21 / XXI', 'Plaza Senayan Lantai 5, Jl. Asia Afrika No.8, Gelora, Tanah Abang', 'Jakarta Pusat', 'https://maps.google.com/?q=Cinema+XXI+Plaza+Senayan', NOW(), NOW()),
(2, 2, 'CGV Grand Indonesia', 'CGV Cinemas', 'Grand Indonesia Mall West Mall Lt.8, Jl. M.H. Thamrin No.1', 'Jakarta Pusat', 'https://maps.google.com/?q=CGV+Grand+Indonesia', NOW(), NOW());

-- ------------------------------------------------------------------------------
-- Data Jadwal Sesi (Schedules)
-- ------------------------------------------------------------------------------
INSERT INTO `schedules` (`id`, `event_id`, `studio_name`, `event_venue_id`, `show_time`, `ticket_price`, `vip_ticket_price`, `total_seats`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, 'Studio 1 Premiere', 1, DATE_ADD(NOW(), INTERVAL 3 DAY), 50000.00, 75000.00, 48, 1, NOW(), NOW()),
(2, 1, 'Studio 1 Premiere (Malam)', 1, DATE_ADD(NOW(), INTERVAL 4 DAY), 50000.00, 75000.00, 48, 1, NOW(), NOW()),
(3, 2, 'Audi 3 Gold Class', 2, DATE_ADD(NOW(), INTERVAL 5 DAY), 60000.00, 85000.00, 36, 1, NOW(), NOW());

-- ------------------------------------------------------------------------------
-- Data Kursi Sample (Studio 1 Premiere - 48 Kursi: Row A - D)
-- ------------------------------------------------------------------------------
INSERT INTO `seats` (`schedule_id`, `row_label`, `grid_column`, `seat_number`, `seat_code`, `seat_type`, `status`, `created_at`, `updated_at`) VALUES
(1, 'A', 1, 1, 'A1', 'standard', 'available', NOW(), NOW()),
(1, 'A', 2, 2, 'A2', 'standard', 'available', NOW(), NOW()),
(1, 'A', 3, 3, 'A3', 'standard', 'available', NOW(), NOW()),
(1, 'A', 4, 4, 'A4', 'standard', 'available', NOW(), NOW()),
(1, 'A', 5, 5, 'A5', 'standard', 'available', NOW(), NOW()),
(1, 'A', 6, 6, 'A6', 'standard', 'available', NOW(), NOW()),
(1, 'B', 1, 1, 'B1', 'standard', 'available', NOW(), NOW()),
(1, 'B', 2, 2, 'B2', 'standard', 'available', NOW(), NOW()),
(1, 'B', 3, 3, 'B3', 'standard', 'booked', NOW(), NOW()),
(1, 'B', 4, 4, 'B4', 'standard', 'booked', NOW(), NOW()),
(1, 'B', 5, 5, 'B5', 'standard', 'available', NOW(), NOW()),
(1, 'B', 6, 6, 'B6', 'standard', 'available', NOW(), NOW()),
(1, 'C', 1, 1, 'C1', 'vip', 'available', NOW(), NOW()),
(1, 'C', 2, 2, 'C2', 'vip', 'available', NOW(), NOW()),
(1, 'C', 3, 3, 'C3', 'vip', 'available', NOW(), NOW()),
(1, 'C', 4, 4, 'C4', 'vip', 'available', NOW(), NOW()),
(1, 'C', 5, 5, 'C5', 'vip', 'available', NOW(), NOW()),
(1, 'C', 6, 6, 'C6', 'vip', 'available', NOW(), NOW()),
(1, 'D', 1, 1, 'D1', 'vip', 'available', NOW(), NOW()),
(1, 'D', 2, 2, 'D2', 'vip', 'available', NOW(), NOW()),
(1, 'D', 3, 3, 'D3', 'vip', 'available', NOW(), NOW()),
(1, 'D', 4, 4, 'D4', 'vip', 'available', NOW(), NOW()),
(1, 'D', 5, 5, 'D5', 'vip', 'available', NOW(), NOW()),
(1, 'D', 6, 6, 'D6', 'vip', 'available', NOW(), NOW());

-- ------------------------------------------------------------------------------
-- Data Vouchers
-- ------------------------------------------------------------------------------
INSERT INTO `vouchers` (`id`, `promo_type`, `code`, `name`, `discount_type`, `discount_value`, `min_purchase`, `max_discount`, `item_type`, `event_id`, `movie_id`, `quota_total`, `quota_used`, `max_uses_per_user`, `valid_from`, `valid_until`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'voucher_code', 'SINEMUSHEMAT', 'Diskon Launching 20%', 'percentage', 20.00, 40000.00, 25000.00, 'all', NULL, NULL, 500, 12, 1, NOW() - INTERVAL 1 DAY, NOW() + INTERVAL 30 DAY, 1, NOW(), NOW()),
(2, 'voucher_code', 'POTONGAN10RB', 'Potongan Langsung Rp10.000', 'fixed', 10000.00, 50000.00, NULL, 'ticket', 1, NULL, 200, 5, 1, NOW() - INTERVAL 1 DAY, NOW() + INTERVAL 14 DAY, 1, NOW(), NOW()),
(3, 'voucher_code', 'STREAMINGSERU', 'Diskon VoD 50%', 'percentage', 50.00, 20000.00, 15000.00, 'movie_rental', NULL, 1, 300, 8, 2, NOW() - INTERVAL 1 DAY, NOW() + INTERVAL 30 DAY, 1, NOW(), NOW());

-- ------------------------------------------------------------------------------
-- Data Banners
-- ------------------------------------------------------------------------------
INSERT INTO `banners` (`id`, `title`, `subtitle`, `badge_text`, `age_rating`, `genre`, `release_year`, `duration_minutes`, `image_path`, `display_mode`, `link_type`, `movie_id`, `event_id`, `target_url`, `button_text`, `order_priority`, `is_active`, `start_at`, `end_at`, `created_at`, `updated_at`) VALUES
(1, 'CINTA DAN SEJARAH', 'Sebuah mahakarya sinema epik kemerdekaan kini hadir di layar lebar.', 'PREMIERE EKSKLUSIF', '13+', 'Drama Sejarah', 2026, 125, 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1280&q=80', 'spotlight', 'event', NULL, 1, NULL, 'Pesan Tiket Sekarang', 1, 1, NOW() - INTERVAL 1 DAY, NOW() + INTERVAL 30 DAY, NOW(), NOW()),
(2, 'Surat Terakhir Sang Kyai', 'Saksikan tayangan eksklusif di Sinemus VoD dalam kualitas Full HD.', 'VOD PILIHAN', 'SU', 'Drama Religi', 2025, 115, 'https://images.unsplash.com/photo-1518676599903-889d7010f368?w=1280&q=80', 'spotlight', 'movie', 1, NULL, NULL, 'Sewa Film Sekarang', 2, 1, NOW() - INTERVAL 1 DAY, NOW() + INTERVAL 30 DAY, NOW(), NOW());

-- ------------------------------------------------------------------------------
-- Data Sample Tiket Aktif (User Customer ID: 2)
-- ------------------------------------------------------------------------------
INSERT INTO `event_transactions` (`id`, `order_id`, `user_id`, `schedule_id`, `voucher_id`, `ticket_quantity`, `gross_amount`, `discount_amount`, `net_amount`, `snap_token`, `payment_status`, `payment_type`, `paid_at`, `ticket_code`, `qr_hash`, `checkin_status`, `checkin_at`, `snapshot_event_data`, `snapshot_seats`, `created_at`, `updated_at`) VALUES
(1, 'SNM-TKT-2026-0001', 2, 1, 1, 2, 100000.00, 20000.00, 80000.00, 'dummy_snap_token_001', 'paid', 'qris', NOW(), 'TKT-2026-8891', 'snm_qr_a8f9c1e0d2b34a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f', 'pending', NULL, '{"title": "CINTA DAN SEJARAH", "venue": "Cinema XXI Plaza Senayan", "studio": "Studio 1 Premiere", "show_time": "2026-11-10 19:30:00"}', '[{"seat_code": "B3", "seat_type": "standard"}, {"seat_code": "B4", "seat_type": "standard"}]', NOW(), NOW());

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;
