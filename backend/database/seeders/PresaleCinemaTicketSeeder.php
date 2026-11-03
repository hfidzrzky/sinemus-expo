<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\EventTransaction;
use App\Models\EventVenue;
use App\Models\Schedule;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class PresaleCinemaTicketSeeder extends Seeder
{
    /**
     * Jalankan database seeder untuk pengujian E2E Modul 17 (Admin Presale Injection).
     */
    public function run(): void
    {
        // 1. Pastikan Super Admin tersedia untuk pengujian Postman
        $admin = User::firstOrCreate(
            ['email' => 'admin@sinemus.id'],
            [
                'name' => 'Super Admin Sinemus',
                'role' => 'super_admin',
                'google_id' => 'google_admin_seed_001',
                'phone_number' => '081100000001',
                'is_phone_locked' => true,
            ]
        );
        $admin->update(['role' => 'super_admin']);

        // 2. Pastikan Customer Penonton tersedia
        $customer = User::firstOrCreate(
            ['email' => 'penonton@sinemus.id'],
            [
                'name' => 'Dimas Penonton Presale',
                'role' => 'customer',
                'google_id' => 'google_cust_seed_001',
                'phone_number' => '081288492099',
                'is_phone_locked' => true,
            ]
        );

        // 3. Buat Master Presale Cinema Event (Cinema XXI)
        $presaleEvent = Event::updateOrCreate(
            ['slug' => 'bumi-manusia-special-presale-xxi'],
            [
                'event_type' => 'presale_cinema',
                'seating_type' => 'assigned_seating',
                'title' => 'Bumi Manusia (Special Remastered 4K) - Presale XXI',
                'description' => 'Penayangan eksklusif bioskop presale Cinema XXI Plaza Senayan Studio 1.',
                'synopsis_short' => 'Adaptasi mahakarya Pramoedya Ananta Toer.',
                'poster_path' => 'events/posters/bumi-manusia.jpg',
                'backdrop_path' => 'events/backdrops/bumi-manusia.jpg',
                'director' => 'Hanung Bramantyo',
                'cast' => ['Iqbaal Ramadhan', 'Mawar de Jongh', 'Sha Ine Febriyanti'],
                'venue_name' => 'Cinema XXI Plaza Senayan',
                'cinema_partner' => 'Cinema 21 / XXI',
                'venue_address' => 'Plaza Senayan Lantai 5, Jl. Asia Afrika No.8, Jakarta Pusat',
                'city' => 'Jakarta Pusat',
                'target_screening_month' => 'November 2026',
                'presale_start_at' => Carbon::now()->subDays(5),
                'presale_end_at' => Carbon::now()->addDays(15),
                'is_active' => true,
                'is_featured' => true,
            ]
        );

        // 3.1. Buat Multi-Venue untuk Presale Cinema Event
        $venueSenayan = EventVenue::firstOrCreate(
            [
                'event_id' => $presaleEvent->id,
                'venue_name' => 'Cinema XXI Plaza Senayan',
            ],
            [
                'cinema_partner' => 'Cinema 21 / XXI',
                'venue_address' => 'Plaza Senayan Lantai 5, Jl. Asia Afrika No.8, Jakarta Pusat',
                'city' => 'Jakarta Pusat',
            ]
        );

        $venueGading = EventVenue::firstOrCreate(
            [
                'event_id' => $presaleEvent->id,
                'venue_name' => 'Cinema XXI Mall Kelapa Gading',
            ],
            [
                'cinema_partner' => 'Cinema 21 / XXI',
                'venue_address' => 'Mall Kelapa Gading 3 Lantai 3, Jl. Boulevard Kelapa Gading, Jakarta Utara',
                'city' => 'Jakarta Utara',
            ]
        );

        // 4. Buat Schedule Pemutaran Presale
        $presaleSchedule = Schedule::firstOrCreate(
            [
                'event_id' => $presaleEvent->id,
                'studio_name' => 'Studio 1 XXI',
            ],
            [
                'event_venue_id' => $venueSenayan->id,
                'show_time' => Carbon::now()->addDays(20)->setTime(19, 30),
                'ticket_price' => 60000,
                'total_seats' => 140,
                'is_active' => true,
            ]
        );
        $presaleSchedule->update(['event_venue_id' => $venueSenayan->id]);

        $presaleSchedule2 = Schedule::firstOrCreate(
            [
                'event_id' => $presaleEvent->id,
                'studio_name' => 'Studio 2 XXI',
            ],
            [
                'event_venue_id' => $venueGading->id,
                'show_time' => Carbon::now()->addDays(21)->setTime(16, 0),
                'ticket_price' => 60000,
                'total_seats' => 120,
                'is_active' => true,
            ]
        );
        $presaleSchedule2->update(['event_venue_id' => $venueGading->id]);

        // 5. Buat Master Regular Screening Event (Untuk Uji Kasus Penolakan 422 Non-Presale)
        $regularEvent = Event::updateOrCreate(
            ['slug' => 'screening-komunitas-film-pendek'],
            [
                'event_type' => 'regular',
                'seating_type' => 'assigned_seating',
                'title' => 'Screening Komunitas Sineas Independen',
                'description' => 'Screening komunitas indie di Sinemus Space.',
                'synopsis_short' => 'Kompilasi film pendek sineas muda.',
                'poster_path' => 'events/posters/komunitas.jpg',
                'backdrop_path' => 'events/backdrops/komunitas.jpg',
                'director' => 'Komunitas Sineas',
                'cast' => ['Aktor Komunitas 1'],
                'venue_name' => 'Sinemus Space Jakarta',
                'city' => 'Jakarta Selatan',
                'venue_address' => 'Jl. Merdeka No. 10',
                'is_active' => true,
            ]
        );

        $regularSchedule = Schedule::firstOrCreate(
            [
                'event_id' => $regularEvent->id,
                'studio_name' => 'Mini Theater A',
            ],
            [
                'show_time' => Carbon::now()->addDays(10)->setTime(16, 0),
                'ticket_price' => 45000,
                'total_seats' => 40,
                'is_active' => true,
            ]
        );

        // 6. Buat Skenario Data Transaksi Presale (Pending Awaiting Cinema Ticket)

        // Skenario A: Tiket Presale Menunggu Injeksi (Kursi C5, C6) -> Target Single Inject & Matching
        EventTransaction::updateOrCreate(
            ['order_id' => 'SNM-TKT-PRESALE-001'],
            [
                'user_id' => $customer->id,
                'schedule_id' => $presaleSchedule->id,
                'ticket_quantity' => 2,
                'gross_amount' => 120000,
                'discount_amount' => 0,
                'net_amount' => 120000,
                'payment_status' => 'paid',
                'paid_at' => Carbon::now()->subDays(2),
                'fulfillment_status' => 'awaiting_cinema_ticket',
                'snapshot_event_data' => [
                    'event_title' => $presaleEvent->title,
                    'event_type' => 'presale_cinema',
                    'venue_name' => $presaleEvent->venue_name,
                    'studio_name' => $presaleSchedule->studio_name,
                    'show_time' => $presaleSchedule->show_time->toIso8601String(),
                ],
                'snapshot_seats' => ['C5', 'C6'],
            ]
        );

        // Skenario B: Tiket Presale Menunggu Injeksi (Kursi D10) -> Target Smart Ingest Preview
        EventTransaction::updateOrCreate(
            ['order_id' => 'SNM-TKT-PRESALE-002'],
            [
                'user_id' => $customer->id,
                'schedule_id' => $presaleSchedule->id,
                'ticket_quantity' => 1,
                'gross_amount' => 60000,
                'discount_amount' => 0,
                'net_amount' => 60000,
                'payment_status' => 'paid',
                'paid_at' => Carbon::now()->subDays(1),
                'fulfillment_status' => 'awaiting_cinema_ticket',
                'snapshot_event_data' => [
                    'event_title' => $presaleEvent->title,
                    'event_type' => 'presale_cinema',
                    'venue_name' => $presaleEvent->venue_name,
                    'studio_name' => $presaleSchedule->studio_name,
                    'show_time' => $presaleSchedule->show_time->toIso8601String(),
                ],
                'snapshot_seats' => ['D10'],
            ]
        );

        // Skenario C: Tiket Presale Menunggu Injeksi (Kursi E1, E2, E3) -> Target Bulk CSV
        EventTransaction::updateOrCreate(
            ['order_id' => 'SNM-TKT-PRESALE-003'],
            [
                'user_id' => $customer->id,
                'schedule_id' => $presaleSchedule->id,
                'ticket_quantity' => 3,
                'gross_amount' => 180000,
                'discount_amount' => 0,
                'net_amount' => 180000,
                'payment_status' => 'paid',
                'paid_at' => Carbon::now()->subHours(12),
                'fulfillment_status' => 'awaiting_cinema_ticket',
                'snapshot_event_data' => [
                    'event_title' => $presaleEvent->title,
                    'event_type' => 'presale_cinema',
                    'venue_name' => $presaleEvent->venue_name,
                    'studio_name' => $presaleSchedule->studio_name,
                    'show_time' => $presaleSchedule->show_time->toIso8601String(),
                ],
                'snapshot_seats' => ['E1', 'E2', 'E3'],
            ]
        );

        // Skenario D: Tiket Presale yang SUDAH Fulfilled -> Target Uji Penolakan 409 Conflict
        EventTransaction::updateOrCreate(
            ['order_id' => 'SNM-TKT-PRESALE-004'],
            [
                'user_id' => $customer->id,
                'schedule_id' => $presaleSchedule->id,
                'ticket_quantity' => 1,
                'gross_amount' => 60000,
                'discount_amount' => 0,
                'net_amount' => 60000,
                'payment_status' => 'paid',
                'paid_at' => Carbon::now()->subDays(3),
                'fulfillment_status' => 'fulfilled',
                'cinema_booking_code' => 'MTX-ALREADYFULFILLED',
                'cinema_passcode' => '999111',
                'cinema_qr_image_path' => 'cinema-tickets/permanent/2026/09/demo_qr.png',
                'fulfilled_at' => Carbon::now()->subDays(1),
                'fulfilled_by_admin_id' => $admin->id,
                'snapshot_event_data' => [
                    'event_title' => $presaleEvent->title,
                    'event_type' => 'presale_cinema',
                    'venue_name' => $presaleEvent->venue_name,
                    'studio_name' => $presaleSchedule->studio_name,
                    'show_time' => $presaleSchedule->show_time->toIso8601String(),
                ],
                'snapshot_seats' => ['A1'],
            ]
        );

        // Skenario E: Tiket Reguler Non-Presale -> Target Uji Penolakan 422 Non-Presale
        EventTransaction::updateOrCreate(
            ['order_id' => 'SNM-TKT-REGULAR-001'],
            [
                'user_id' => $customer->id,
                'schedule_id' => $regularSchedule->id,
                'ticket_quantity' => 1,
                'gross_amount' => 45000,
                'discount_amount' => 0,
                'net_amount' => 45000,
                'payment_status' => 'paid',
                'paid_at' => Carbon::now()->subHours(6),
                'fulfillment_status' => 'unfulfilled',
                'snapshot_event_data' => [
                    'event_title' => $regularEvent->title,
                    'event_type' => 'regular',
                ],
                'snapshot_seats' => ['B1'],
            ]
        );
    }
}
