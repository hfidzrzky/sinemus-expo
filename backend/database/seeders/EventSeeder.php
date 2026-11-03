<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\Schedule;
use App\Models\Seat;
use App\Models\SeatLock;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EventSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Seed Master Events (5 Event realistis sesuai frontend fixtures)
        $eventsData = [
            [
                'slug' => 'cinta-dan-sejarah-xxi-plaza-senayan',
                'event_type' => 'regular',
                'seating_type' => 'assigned_seating',
                'title' => 'CINTA DAN SEJARAH (Special Cinema Premiere)',
                'description' => 'Sebuah mahakarya sinema yang menelusuri lorong waktu perjuangan kemerdekaan melalui surat-surat cinta rahasia yang terkubur selama tujuh dekade. Menghadirkan sinematografi 35mm memukau dan tata suara surround 7.1 yang diproduksi khusus untuk pengalaman layar lebar.',
                'synopsis_short' => 'Kisah romansa epik dua insan di tengah gejolak revolusi kemerdekaan yang terpisah oleh garis pertempuran.',
                'poster_path' => 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&q=80',
                'backdrop_path' => 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1280&q=80',
                'director' => 'Baskara Mahendra Putra',
                'cast' => ['Reza Rahadian', 'Laura Basuki', 'Chicco Jerikho', 'Putri Marino'],
                'cloudflare_teaser_uid' => '5d5b376379fc387d9c9e32305193433d',
                'venue_name' => 'Cinema XXI Plaza Senayan',
                'cinema_partner' => 'Cinema 21 / XXI',
                'venue_address' => 'Plaza Senayan Lantai 5, Jl. Asia Afrika No.8, Gelora, Tanah Abang',
                'city' => 'Jakarta Pusat',
                'target_screening_month' => 'November 2026',
                'is_active' => true,
                'is_featured' => true,
            ],
            [
                'slug' => 'imtihan-ifi-thamrin',
                'event_type' => 'regular',
                'seating_type' => 'assigned_seating',
                'title' => 'IMTIHAN (Premiere + Q&A Sutradara)',
                'description' => 'Penayangan eksklusif film pemenang kategori dokumenter terbaik Festival Film Tempo, diikuti sesi diskusi hangat dan tanya jawab interaktif bersama sutradara dan produser eksekutif.',
                'synopsis_short' => 'Pergulatan sebuah keluarga santri di pedalaman Jawa Timur dalam mempertahankan tradisi di tengah pusaran industrialisasi pabrik semen.',
                'poster_path' => 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=600&q=80',
                'backdrop_path' => 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1280&q=80',
                'director' => 'Ahmad Fauzi Ridwan',
                'cast' => ['K.H. Syarifuddin', 'Nyai Siti Aminah', 'Gus Wildan'],
                'cloudflare_teaser_uid' => null,
                'venue_name' => 'Auditorium IFI Thamrin',
                'cinema_partner' => 'Institut Français Indonesia',
                'venue_address' => 'Jl. M.H. Thamrin No.20, Gondangdia, Menteng',
                'city' => 'Jakarta Pusat',
                'target_screening_month' => 'November 2026',
                'is_active' => true,
                'is_featured' => true,
            ],
            [
                'slug' => 'mengejar-embun-cgv-gi',
                'event_type' => 'regular',
                'seating_type' => 'assigned_seating',
                'title' => 'MENGEJAR EMBUN KE UJUNG SENJA',
                'description' => 'Kisah road trip penuh kehangatan melintasi jalur selatan pulau Jawa mencari arti perpisahan dan penerimaan diri.',
                'synopsis_short' => 'Dua sahabat lama bertemu kembali dalam perjalanan mobil tua melintasi pesisir pantai selatan.',
                'poster_path' => 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=600&q=80',
                'backdrop_path' => 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1280&q=80',
                'director' => 'Arya Wicaksono',
                'cast' => ['Angga Yunanda', 'Shenina Cinnamon', 'Dion Wiyoko'],
                'cloudflare_teaser_uid' => '5d5b376379fc387d9c9e32305193433d',
                'venue_name' => 'CGV Grand Indonesia',
                'cinema_partner' => 'CGV Cinemas',
                'venue_address' => 'Grand Indonesia West Mall Lt. 8, Jl. M.H. Thamrin No.1',
                'city' => 'Jakarta Pusat',
                'target_screening_month' => 'Desember 2026',
                'is_active' => true,
                'is_featured' => false,
            ],
            [
                'slug' => 'suara-dari-hilir-ifi-bandung',
                'event_type' => 'regular',
                'seating_type' => 'general_admission',
                'title' => 'SUARA DARI HILIR (Dokumenter Spesial)',
                'description' => 'Dokumenter investigatif mendalam tentang perjuangan komunitas nelayan bantaran sungai Citarum.',
                'synopsis_short' => 'Potret kehidupan nelayan muara sungai Citarum menghadapi arus modernisasi zaman.',
                'poster_path' => 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=600&q=80',
                'backdrop_path' => 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1280&q=80',
                'director' => 'Maya Lestari',
                'cast' => ['Komunitas Nelayan Muara Gembong', 'Dr. Budi Santoso (Peneliti Hidrologi)'],
                'cloudflare_teaser_uid' => null,
                'venue_name' => 'Institut Français Indonesia',
                'cinema_partner' => 'IFI Bandung',
                'venue_address' => 'Jl. Purnawarman No.32, Babakan Ciamis, Sumur Bandung',
                'city' => 'Bandung',
                'target_screening_month' => 'Desember 2026',
                'is_active' => true,
                'is_featured' => false,
            ],
            [
                'slug' => 'nyanyian-senja-misbar',
                'event_type' => 'regular',
                'seating_type' => 'general_admission',
                'title' => 'NYANYIAN SENJA (Screening Terbuka)',
                'description' => 'Pemutaran film layar tancap modern (Gerimis Bersama / Misbar) di bawah langit malam Purbalingga.',
                'synopsis_short' => 'Di sebuah stasiun radio tua pedesaan, siaran malam membuka misteri masa lalu yang terkubur.',
                'poster_path' => 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&q=80',
                'backdrop_path' => 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1280&q=80',
                'director' => 'Tito Pamungkas',
                'cast' => ['Whani Darmawan', 'Siti Fauziah'],
                'cloudflare_teaser_uid' => null,
                'venue_name' => 'Bioskop Mini Misbar',
                'cinema_partner' => 'Komunitas Film Purbalingga',
                'venue_address' => 'Taman Kota Usman Janatin, Jl. Ahmad Yani No. 12',
                'city' => 'Purbalingga',
                'target_screening_month' => 'Desember 2026',
                'is_active' => true,
                'is_featured' => false,
            ],
        ];

        $events = [];
        foreach ($eventsData as $data) {
            $events[$data['slug']] = Event::updateOrCreate(
                ['slug' => $data['slug']],
                $data
            );
        }

        // 2. Seed Schedules untuk masing-masing Event
        $schedulesData = [
            // Event 1: Cinta dan Sejarah (4 sesi - Cinema XXI Plaza Senayan)
            [
                'id' => 1001,
                'event_id' => $events['cinta-dan-sejarah-xxi-plaza-senayan']->id,
                'studio_name' => 'Studio 1 (XXI)',
                'show_time' => '2026-11-28 19:00:00',
                'ticket_price' => 50000,
                'total_seats' => 140,
                'is_active' => true,
            ],
            [
                'id' => 1002,
                'event_id' => $events['cinta-dan-sejarah-xxi-plaza-senayan']->id,
                'studio_name' => 'Studio 1 (XXI)',
                'show_time' => '2026-11-28 21:30:00',
                'ticket_price' => 50000,
                'total_seats' => 140,
                'is_active' => true,
            ],
            [
                'id' => 1003,
                'event_id' => $events['cinta-dan-sejarah-xxi-plaza-senayan']->id,
                'studio_name' => 'Studio 2 (XXI)',
                'show_time' => '2026-11-29 16:00:00',
                'ticket_price' => 55000,
                'total_seats' => 80,
                'is_active' => true,
            ],
            [
                'id' => 1004,
                'event_id' => $events['cinta-dan-sejarah-xxi-plaza-senayan']->id,
                'studio_name' => 'Studio 2 (XXI)',
                'show_time' => '2026-11-29 19:00:00',
                'ticket_price' => 55000,
                'total_seats' => 80,
                'is_active' => true,
            ],
            // Event 2: Imtihan (2 sesi - Auditorium IFI Thamrin)
            [
                'id' => 2001,
                'event_id' => $events['imtihan-ifi-thamrin']->id,
                'studio_name' => 'Auditorium Utama',
                'show_time' => '2026-11-29 15:30:00',
                'ticket_price' => 35000,
                'total_seats' => 56,
                'is_active' => true,
            ],
            [
                'id' => 2002,
                'event_id' => $events['imtihan-ifi-thamrin']->id,
                'studio_name' => 'Auditorium Utama',
                'show_time' => '2026-11-29 19:00:00',
                'ticket_price' => 35000,
                'total_seats' => 56,
                'is_active' => true,
            ],
            // Event 3: Mengejar Embun (1 sesi - CGV Grand Indonesia)
            [
                'id' => 3001,
                'event_id' => $events['mengejar-embun-cgv-gi']->id,
                'studio_name' => 'Audi 3 (CGV)',
                'show_time' => '2026-12-05 18:45:00',
                'ticket_price' => 50000,
                'total_seats' => 80,
                'is_active' => true,
            ],
            // Event 4: Suara Dari Hilir (1 sesi general admission - IFI Bandung)
            [
                'id' => 4001,
                'event_id' => $events['suara-dari-hilir-ifi-bandung']->id,
                'studio_name' => 'Amphitheater Outdoor',
                'show_time' => '2026-12-06 16:00:00',
                'ticket_price' => 30000,
                'total_seats' => 50,
                'is_active' => true,
            ],
            // Event 5: Nyanyian Senja (1 sesi general admission - Misbar Purbalingga)
            [
                'id' => 5001,
                'event_id' => $events['nyanyian-senja-misbar']->id,
                'studio_name' => 'Panggung Misbar',
                'show_time' => '2026-12-10 19:30:00',
                'ticket_price' => 25000,
                'total_seats' => 40,
                'is_active' => true,
            ],
        ];

        foreach ($schedulesData as $schData) {
            Schedule::updateOrCreate(
                ['id' => $schData['id']],
                $schData
            );
        }

        // 3. Seed Seats Grid untuk seluruh jadwal dengan assigned_seating
        $demoUser = User::firstOrCreate(
            ['email' => 'seatlock.demo@sinemus.id'],
            [
                'google_id' => 'demo-google-seat-lock-user-001',
                'name' => 'Demo Seat Lock User',
                'role' => 'customer',
            ]
        );

        $xxiSaturdayRows = ['J', 'I', 'H', 'G', 'F', 'E', 'D', 'C', 'B', 'A'];
        $xxiSundayRows = ['H', 'G', 'F', 'E', 'D', 'C', 'B', 'A'];
        $ifiRows = ['G', 'F', 'E', 'D', 'C', 'B', 'A'];

        // Cinema XXI Plaza Senayan - Hari Sabtu (Studio 1): 10 baris x 14 kolom = 140 kursi per sesi
        $this->seedSeatsForSchedule(1001, $xxiSaturdayRows, 14, $demoUser, true);
        $this->seedSeatsForSchedule(1002, $xxiSaturdayRows, 14, $demoUser, false);

        // Cinema XXI Plaza Senayan - Hari Minggu (Studio 2): 8 baris x 10 kolom = 80 kursi per sesi
        $this->seedSeatsForSchedule(1003, $xxiSundayRows, 10, $demoUser, false);
        $this->seedSeatsForSchedule(1004, $xxiSundayRows, 10, $demoUser, false);

        // Auditorium IFI Thamrin (7 baris x 8 kolom = 56 kursi per sesi)
        $this->seedSeatsForSchedule(2001, $ifiRows, 8, $demoUser, false);
        $this->seedSeatsForSchedule(2002, $ifiRows, 8, $demoUser, false);

        // CGV Grand Indonesia (8 baris x 10 kolom = 80 kursi per sesi)
        $this->seedSeatsForSchedule(3001, $xxiSundayRows, 10, $demoUser, false);
    }

    /**
     * Seeding denah kursi fisik realistis untuk satu sesi jadwal bioskop.
     *
     * @param  array<int, string>  $rows
     */
    protected function seedSeatsForSchedule(
        int $scheduleId,
        array $rows,
        int $cols,
        User $demoUser,
        bool $seedDemoLock = false
    ): void {
        DB::transaction(function () use ($scheduleId, $rows, $cols, $demoUser, $seedDemoLock) {
            SeatLock::where('schedule_id', $scheduleId)->delete();
            Seat::where('schedule_id', $scheduleId)->delete();

            $seatsData = [];
            $now = now();

            foreach ($rows as $row) {
                for ($col = 1; $col <= $cols; $col++) {
                    $seatCode = "{$row}{$col}";

                    // Status awal seluruh kursi adalah available (status booked ditentukan oleh transaksi sah)
                    $status = 'available';

                    $seatType = in_array($row, ['A', 'B'], true) ? 'vip' : 'standard';

                    $seatsData[] = [
                        'schedule_id' => $scheduleId,
                        'seat_code' => $seatCode,
                        'row_label' => $row,
                        'grid_column' => $col,
                        'seat_number' => $col,
                        'seat_type' => $seatType,
                        'status' => $status,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }
            }

            Seat::insert($seatsData);

            // Buat 2 kursi terkunci (C7 & C8) di seat_locks untuk Schedule 1001
            if ($seedDemoLock && $scheduleId === 1001) {
                $lockedSeats = Seat::where('schedule_id', $scheduleId)
                    ->where('row_label', 'C')
                    ->whereIn('seat_number', [7, 8])
                    ->get();

                foreach ($lockedSeats as $lSeat) {
                    SeatLock::create([
                        'schedule_id' => $scheduleId,
                        'seat_id' => $lSeat->id,
                        'user_id' => $demoUser->id,
                        'quantity' => 1,
                        'order_id' => 'SNM-TKT-DEMO-LOCK',
                        'expires_at' => now()->addMinutes(15),
                    ]);
                }
            }
        });
    }
}
