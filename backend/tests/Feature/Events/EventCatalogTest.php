<?php

namespace Tests\Feature\Events;

use App\Models\Event;
use App\Models\Schedule;
use App\Models\Seat;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class EventCatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_list_active_events_with_pagination_and_envelope_structure(): void
    {
        $event = Event::create([
            'slug' => 'cinta-dan-sejarah-xxi-plaza-senayan',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'title' => 'CINTA DAN SEJARAH (Special Cinema Premiere)',
            'description' => 'Deskripsi film sejarah kemerdekaan...',
            'synopsis_short' => 'Kisah romansa epik dua insan.',
            'poster_path' => 'https://images.unsplash.com/photo-poster-1',
            'backdrop_path' => 'https://images.unsplash.com/photo-backdrop-1',
            'director' => 'Baskara Mahendra Putra',
            'cast' => ['Reza Rahadian', 'Laura Basuki'],
            'rules' => ['Dilarang Merekam', 'Mode Hening'],
            'cloudflare_teaser_uid' => 'cf-teaser-uid-12345',
            'venue_name' => 'Cinema XXI Plaza Senayan',
            'cinema_partner' => 'Cinema 21 / XXI',
            'venue_address' => 'Plaza Senayan Lt 5',
            'city' => 'Jakarta Pusat',
            'is_active' => true,
            'is_featured' => true,
        ]);

        $schedule = Schedule::create([
            'event_id' => $event->id,
            'show_time' => '2026-11-28 19:00:00',
            'ticket_price' => 50000,
            'total_seats' => 56,
            'is_active' => true,
        ]);

        Seat::create([
            'schedule_id' => $schedule->id,
            'row_label' => 'A',
            'seat_number' => 1,
            'seat_code' => 'A1',
            'seat_type' => 'vip',
            'status' => 'available',
        ]);

        $response = $this->getJson('/api/v1/events');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    '*' => [
                        'id',
                        'slug',
                        'title',
                        'poster_url',
                        'backdrop_url',
                        'venue_name',
                        'city',
                        'earliest_show_time',
                        'starting_price',
                        'formatted_starting_price',
                        'event_type',
                        'seating_type',
                        'remaining_seats_count',
                    ],
                ],
                'meta' => [
                    'current_page',
                    'from',
                    'last_page',
                    'per_page',
                    'to',
                    'total',
                    'available_cities',
                    'available_formats',
                ],
                'server_time',
            ])
            ->assertJson([
                'success' => true,
                'message' => 'Daftar event aktif berhasil diambil',
            ]);

        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals('cinta-dan-sejarah-xxi-plaza-senayan', $data[0]['slug']);
        $this->assertEquals(50000, $data[0]['starting_price']);
        $this->assertEquals('Rp 50.000', $data[0]['formatted_starting_price']);
        $this->assertEquals(1, $data[0]['remaining_seats_count']);
    }

    public function test_can_filter_events_by_city(): void
    {
        Event::create([
            'slug' => 'event-jakarta',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'title' => 'Screening Jakarta',
            'description' => 'Deskripsi Jakarta',
            'synopsis_short' => 'Sinopsis Jakarta',
            'poster_path' => 'events/jkt.jpg',
            'backdrop_path' => 'events/jkt-bd.jpg',
            'director' => 'Sutradara Jkt',
            'cast' => ['Aktor Jkt'],
            'rules' => ['Rule 1'],
            'venue_name' => 'Auditorium IFI Thamrin',
            'venue_address' => 'Jl Thamrin',
            'city' => 'Jakarta Pusat',
            'is_active' => true,
        ]);

        Event::create([
            'slug' => 'event-bandung',
            'event_type' => 'regular',
            'seating_type' => 'general_admission',
            'title' => 'Screening Bandung',
            'description' => 'Deskripsi Bandung',
            'synopsis_short' => 'Sinopsis Bandung',
            'poster_path' => 'events/bdg.jpg',
            'backdrop_path' => 'events/bdg-bd.jpg',
            'director' => 'Sutradara Bdg',
            'cast' => ['Aktor Bdg'],
            'rules' => ['Rule 1'],
            'venue_name' => 'IFI Bandung',
            'venue_address' => 'Jl Purnawarman',
            'city' => 'Bandung',
            'is_active' => true,
        ]);

        $responseJakarta = $this->getJson('/api/v1/events?city=Jakarta Pusat');
        $responseJakarta->assertStatus(200);
        $dataJkt = $responseJakarta->json('data');
        $this->assertCount(1, $dataJkt);
        $this->assertEquals('event-jakarta', $dataJkt[0]['slug']);

        $responseBandung = $this->getJson('/api/v1/events?city=Bandung');
        $responseBandung->assertStatus(200);
        $dataBdg = $responseBandung->json('data');
        $this->assertCount(1, $dataBdg);
        $this->assertEquals('event-bandung', $dataBdg[0]['slug']);
    }

    public function test_can_search_events_by_keyword(): void
    {
        Event::create([
            'slug' => 'mengejar-embun',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'title' => 'Mengejar Embun ke Ujung Senja',
            'description' => 'Film road trip puitis melintasi pesisir pantai.',
            'synopsis_short' => 'Perjalanan dua sahabat.',
            'poster_path' => 'events/embun.jpg',
            'backdrop_path' => 'events/embun-bd.jpg',
            'director' => 'Arya Wicaksono',
            'cast' => ['Angga Yunanda'],
            'rules' => ['Pemeriksaan tas'],
            'venue_name' => 'CGV Grand Indonesia',
            'venue_address' => 'Grand Indonesia',
            'city' => 'Jakarta Pusat',
            'is_active' => true,
        ]);

        Event::create([
            'slug' => 'suara-dari-hilir',
            'event_type' => 'regular',
            'seating_type' => 'general_admission',
            'title' => 'Suara Dari Hilir',
            'description' => 'Dokumenter nelayan sungai Citarum.',
            'synopsis_short' => 'Potret komunitas nelayan.',
            'poster_path' => 'events/hilir.jpg',
            'backdrop_path' => 'events/hilir-bd.jpg',
            'director' => 'Maya Lestari',
            'cast' => ['Komunitas Nelayan'],
            'rules' => ['Dilarang Buang Sampah'],
            'venue_name' => 'Institut Français Indonesia',
            'venue_address' => 'Bandung',
            'city' => 'Bandung',
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/v1/events?search=Embun');
        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals('mengejar-embun', $data[0]['slug']);
    }

    public function test_inactive_events_are_excluded_from_catalog(): void
    {
        Event::create([
            'slug' => 'event-aktif',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'title' => 'Event Aktif',
            'description' => 'Deskripsi Aktif',
            'synopsis_short' => 'Sinopsis Aktif',
            'poster_path' => 'events/aktif.jpg',
            'backdrop_path' => 'events/aktif-bd.jpg',
            'director' => 'Sutradara',
            'cast' => ['Aktor'],
            'rules' => ['Rule'],
            'venue_name' => 'Venue A',
            'venue_address' => 'Alamat A',
            'city' => 'Jakarta',
            'is_active' => true,
        ]);

        Event::create([
            'slug' => 'event-nonaktif',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'title' => 'Event Nonaktif',
            'description' => 'Deskripsi Nonaktif',
            'synopsis_short' => 'Sinopsis Nonaktif',
            'poster_path' => 'events/nonaktif.jpg',
            'backdrop_path' => 'events/nonaktif-bd.jpg',
            'director' => 'Sutradara',
            'cast' => ['Aktor'],
            'rules' => ['Rule'],
            'venue_name' => 'Venue B',
            'venue_address' => 'Alamat B',
            'city' => 'Jakarta',
            'is_active' => false,
        ]);

        $response = $this->getJson('/api/v1/events');
        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals('event-aktif', $data[0]['slug']);
    }

    public function test_can_get_event_detail_by_slug(): void
    {
        $event = Event::create([
            'slug' => 'imtihan-ifi-thamrin',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'title' => 'IMTIHAN (Premiere + Q&A Sutradara)',
            'description' => 'Penayangan eksklusif film pemenang tempo.',
            'synopsis_short' => 'Pergulatan sebuah keluarga santri.',
            'poster_path' => 'https://images.unsplash.com/imtihan-poster',
            'backdrop_path' => 'https://images.unsplash.com/imtihan-backdrop',
            'director' => 'Ahmad Fauzi Ridwan',
            'cast' => ['K.H. Syarifuddin', 'Nyai Siti Aminah'],
            'rules' => ['Wajib hadir 30 menit sebelum acara'],
            'cloudflare_teaser_uid' => null,
            'venue_name' => 'Auditorium IFI Thamrin',
            'venue_address' => 'Jl. M.H. Thamrin No.20',
            'city' => 'Jakarta Pusat',
            'is_active' => true,
        ]);

        $schedule = Schedule::create([
            'event_id' => $event->id,
            'show_time' => '2026-11-29 15:30:00',
            'ticket_price' => 35000,
            'total_seats' => 2,
            'is_active' => true,
        ]);

        Seat::create([
            'schedule_id' => $schedule->id,
            'row_label' => 'A',
            'seat_number' => 1,
            'seat_code' => 'A1',
            'seat_type' => 'vip',
            'status' => 'available',
        ]);

        Seat::create([
            'schedule_id' => $schedule->id,
            'row_label' => 'A',
            'seat_number' => 2,
            'seat_code' => 'A2',
            'seat_type' => 'vip',
            'status' => 'booked',
        ]);

        $response = $this->getJson('/api/v1/events/imtihan-ifi-thamrin');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'id',
                    'slug',
                    'title',
                    'description',
                    'synopsis_short',
                    'poster_url',
                    'backdrop_url',
                    'director',
                    'cast',
                    'cloudflare_teaser_uid',
                    'venue_name',
                    'venue_address',
                    'city',
                    'schedules' => [
                        '*' => [
                            'id',
                            'show_time',
                            'ticket_price',
                            'formatted_ticket_price',
                            'available_seats_count',
                            'total_seats',
                        ],
                    ],
                ],
                'server_time',
            ])
            ->assertJson([
                'success' => true,
                'message' => 'Detail event berhasil diambil',
                'data' => [
                    'slug' => 'imtihan-ifi-thamrin',
                    'director' => 'Ahmad Fauzi Ridwan',
                    'schedules' => [
                        [
                            'id' => $schedule->id,
                            'ticket_price' => 35000,
                            'formatted_ticket_price' => 'Rp 35.000',
                            'available_seats_count' => 1,
                            'total_seats' => 2,
                        ],
                    ],
                ],
            ]);
    }

    public function test_can_get_event_detail_by_numeric_id(): void
    {
        $event = Event::create([
            'slug' => 'event-by-id',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'title' => 'Event By ID',
            'description' => 'Deskripsi',
            'synopsis_short' => 'Sinopsis',
            'poster_path' => 'poster.jpg',
            'backdrop_path' => 'backdrop.jpg',
            'director' => 'Director',
            'cast' => ['Actor'],
            'rules' => ['Rule'],
            'venue_name' => 'Venue',
            'venue_address' => 'Address',
            'city' => 'Jakarta',
            'is_active' => true,
        ]);

        $response = $this->getJson("/api/v1/events/{$event->id}");
        $response->assertStatus(200);
        $this->assertEquals('event-by-id', $response->json('data.slug'));
    }

    public function test_returns_404_when_event_not_found_or_inactive(): void
    {
        $inactive = Event::create([
            'slug' => 'event-tersembunyi',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'title' => 'Event Tersembunyi',
            'description' => 'Deskripsi',
            'synopsis_short' => 'Sinopsis',
            'poster_path' => 'poster.jpg',
            'backdrop_path' => 'backdrop.jpg',
            'director' => 'Director',
            'cast' => ['Actor'],
            'rules' => ['Rule'],
            'venue_name' => 'Venue',
            'venue_address' => 'Address',
            'city' => 'Jakarta',
            'is_active' => false,
        ]);

        $response1 = $this->getJson('/api/v1/events/non-existent-slug');
        $response1->assertStatus(404)
            ->assertJson([
                'success' => false,
                'message' => 'Event screening tidak ditemukan atau sudah tidak aktif.',
            ])
            ->assertJsonStructure(['success', 'message', 'server_time']);

        $response2 = $this->getJson("/api/v1/events/{$inactive->id}");
        $response2->assertStatus(404)
            ->assertJson([
                'success' => false,
                'message' => 'Event screening tidak ditemukan atau sudah tidak aktif.',
            ]);

        $response3 = $this->getJson('/api/v1/events/event-tersembunyi');
        $response3->assertStatus(404)
            ->assertJson([
                'success' => false,
                'message' => 'Event screening tidak ditemukan atau sudah tidak aktif.',
            ]);
    }

    public function test_can_filter_events_by_event_type(): void
    {
        Event::create([
            'slug' => 'event-komunitas-regular',
            'event_type' => 'regular',
            'seating_type' => 'general_admission',
            'title' => 'Screening Komunitas',
            'description' => 'Deskripsi Regular',
            'synopsis_short' => 'Sinopsis Regular',
            'poster_path' => 'events/regular.jpg',
            'backdrop_path' => 'events/regular-bd.jpg',
            'director' => 'Sutradara',
            'cast' => ['Aktor'],
            'rules' => ['Rule'],
            'venue_name' => 'Venue Regular',
            'venue_address' => 'Alamat',
            'city' => 'Bandung',
            'is_active' => true,
        ]);

        // 1. Filter event_type = regular
        $responseRegular = $this->getJson('/api/v1/events?event_type=regular');
        $responseRegular->assertStatus(200);
        $dataRegular = $responseRegular->json('data');
        $this->assertCount(1, $dataRegular);
        $this->assertEquals('event-komunitas-regular', $dataRegular[0]['slug']);

        // 2. Reject retired presale_cinema format
        $responsePresale = $this->getJson('/api/v1/events?event_type=presale_cinema');
        $responsePresale->assertStatus(422);
    }

    public function test_meta_contains_dynamic_available_cities(): void
    {
        Event::create([
            'slug' => 'event-di-purbalingga',
            'event_type' => 'regular',
            'seating_type' => 'general_admission',
            'title' => 'Event Purbalingga',
            'description' => 'Deskripsi',
            'synopsis_short' => 'Sinopsis',
            'poster_path' => 'events/pbg.jpg',
            'backdrop_path' => 'events/pbg-bd.jpg',
            'director' => 'Sutradara',
            'cast' => ['Aktor'],
            'rules' => ['Rule'],
            'venue_name' => 'Misbar',
            'venue_address' => 'Purbalingga',
            'city' => 'Purbalingga',
            'is_active' => true,
        ]);

        Event::create([
            'slug' => 'event-di-jakarta',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'title' => 'Event Jakarta',
            'description' => 'Deskripsi',
            'synopsis_short' => 'Sinopsis',
            'poster_path' => 'events/jkt.jpg',
            'backdrop_path' => 'events/jkt-bd.jpg',
            'director' => 'Sutradara',
            'cast' => ['Aktor'],
            'rules' => ['Rule'],
            'venue_name' => 'XXI',
            'venue_address' => 'Jakarta',
            'city' => 'Jakarta Pusat',
            'is_active' => true,
        ]);

        // Kota dari event nonaktif tidak boleh muncul di available_cities
        Event::create([
            'slug' => 'event-di-surabaya-nonaktif',
            'event_type' => 'regular',
            'seating_type' => 'general_admission',
            'title' => 'Event Surabaya',
            'description' => 'Deskripsi',
            'synopsis_short' => 'Sinopsis',
            'poster_path' => 'events/sby.jpg',
            'backdrop_path' => 'events/sby-bd.jpg',
            'director' => 'Sutradara',
            'cast' => ['Aktor'],
            'rules' => ['Rule'],
            'venue_name' => 'Surabaya',
            'venue_address' => 'Surabaya',
            'city' => 'Surabaya',
            'is_active' => false,
        ]);

        $response = $this->getJson('/api/v1/events');
        $response->assertStatus(200);

        $availableCities = $response->json('meta.available_cities');
        $this->assertIsArray($availableCities);
        $this->assertContains('Jakarta Pusat', $availableCities);
        $this->assertContains('Purbalingga', $availableCities);
        $this->assertNotContains('Surabaya', $availableCities);
    }

    public function test_can_get_active_cities_from_dedicated_endpoint(): void
    {
        Event::create([
            'slug' => 'event-bandung',
            'event_type' => 'regular',
            'seating_type' => 'general_admission',
            'title' => 'Event Bandung',
            'description' => 'Deskripsi',
            'synopsis_short' => 'Sinopsis',
            'poster_path' => 'events/bdg.jpg',
            'backdrop_path' => 'events/bdg-bd.jpg',
            'director' => 'Sutradara',
            'cast' => ['Aktor'],
            'rules' => ['Rule'],
            'venue_name' => 'IFI',
            'venue_address' => 'Bandung',
            'city' => 'Bandung',
            'is_active' => true,
        ]);

        Event::create([
            'slug' => 'event-jakarta',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'title' => 'Event Jakarta',
            'description' => 'Deskripsi',
            'synopsis_short' => 'Sinopsis',
            'poster_path' => 'events/jkt.jpg',
            'backdrop_path' => 'events/jkt-bd.jpg',
            'director' => 'Sutradara',
            'cast' => ['Aktor'],
            'rules' => ['Rule'],
            'venue_name' => 'XXI',
            'venue_address' => 'Jakarta',
            'city' => 'Jakarta Pusat',
            'is_active' => true,
        ]);

        // Kota nonaktif
        Event::create([
            'slug' => 'event-bali-nonaktif',
            'event_type' => 'regular',
            'seating_type' => 'general_admission',
            'title' => 'Event Bali',
            'description' => 'Deskripsi',
            'synopsis_short' => 'Sinopsis',
            'poster_path' => 'events/bali.jpg',
            'backdrop_path' => 'events/bali-bd.jpg',
            'director' => 'Sutradara',
            'cast' => ['Aktor'],
            'rules' => ['Rule'],
            'venue_name' => 'Denpasar',
            'venue_address' => 'Bali',
            'city' => 'Bali',
            'is_active' => false,
        ]);

        $response = $this->getJson('/api/v1/events/cities');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data',
                'server_time',
            ])
            ->assertJson([
                'success' => true,
                'message' => 'Daftar kota event aktif berhasil diambil',
            ]);

        $cities = $response->json('data');
        $this->assertEquals(['Bandung', 'Jakarta Pusat'], $cities);
        $this->assertNotContains('Bali', $cities);
    }

    public function test_meta_contains_dynamic_available_formats(): void
    {
        // 2 event regular aktif
        Event::create([
            'slug' => 'event-regular-1',
            'event_type' => 'regular',
            'seating_type' => 'general_admission',
            'title' => 'Event Regular 1',
            'description' => 'Deskripsi',
            'synopsis_short' => 'Sinopsis',
            'poster_path' => 'poster1.jpg',
            'backdrop_path' => 'backdrop1.jpg',
            'director' => 'Sutradara',
            'cast' => ['Aktor'],
            'rules' => ['Rule'],
            'venue_name' => 'Venue',
            'venue_address' => 'Alamat',
            'city' => 'Bandung',
            'is_active' => true,
        ]);

        Event::create([
            'slug' => 'event-regular-2',
            'event_type' => 'regular',
            'seating_type' => 'general_admission',
            'title' => 'Event Regular 2',
            'description' => 'Deskripsi',
            'synopsis_short' => 'Sinopsis',
            'poster_path' => 'poster2.jpg',
            'backdrop_path' => 'backdrop2.jpg',
            'director' => 'Sutradara',
            'cast' => ['Aktor'],
            'rules' => ['Rule'],
            'venue_name' => 'Venue',
            'venue_address' => 'Alamat',
            'city' => 'Purbalingga',
            'is_active' => true,
        ]);

        // 1 event regular tambahan aktif
        Event::create([
            'slug' => 'event-regular-extra',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'title' => 'Event Regular Extra',
            'description' => 'Deskripsi',
            'synopsis_short' => 'Sinopsis',
            'poster_path' => 'poster3.jpg',
            'backdrop_path' => 'backdrop3.jpg',
            'director' => 'Sutradara',
            'cast' => ['Aktor'],
            'rules' => ['Rule'],
            'venue_name' => 'XXI',
            'venue_address' => 'Alamat',
            'city' => 'Jakarta Pusat',
            'is_active' => true,
        ]);

        // 1 event nonaktif (tidak boleh menambah total_events)
        Event::create([
            'slug' => 'event-regular-nonaktif',
            'event_type' => 'regular',
            'seating_type' => 'general_admission',
            'title' => 'Event Nonaktif',
            'description' => 'Deskripsi',
            'synopsis_short' => 'Sinopsis',
            'poster_path' => 'poster4.jpg',
            'backdrop_path' => 'backdrop4.jpg',
            'director' => 'Sutradara',
            'cast' => ['Aktor'],
            'rules' => ['Rule'],
            'venue_name' => 'Venue',
            'venue_address' => 'Alamat',
            'city' => 'Bandung',
            'is_active' => false,
        ]);

        $response = $this->getJson('/api/v1/events');
        $response->assertStatus(200);

        $formats = collect($response->json('meta.available_formats'))->keyBy('value');

        $this->assertTrue($formats->has('regular'));
        $this->assertEquals('Screening Komunitas', $formats['regular']['label']);
        $this->assertEquals(3, $formats['regular']['total_events']);
        $this->assertFalse($formats->has('presale_cinema'));
    }

    public function test_can_get_active_formats_from_dedicated_endpoint(): void
    {
        Event::create([
            'slug' => 'event-regular-only',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'title' => 'Event Regular Aktif',
            'description' => 'Deskripsi',
            'synopsis_short' => 'Sinopsis',
            'poster_path' => 'poster.jpg',
            'backdrop_path' => 'backdrop.jpg',
            'director' => 'Sutradara',
            'cast' => ['Aktor'],
            'rules' => ['Rule'],
            'venue_name' => 'XXI',
            'venue_address' => 'Alamat',
            'city' => 'Jakarta Pusat',
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/v1/events/formats');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    '*' => [
                        'value',
                        'label',
                        'total_events',
                    ],
                ],
                'server_time',
            ])
            ->assertJson([
                'success' => true,
                'message' => 'Daftar format acara aktif berhasil diambil',
            ]);

        $formats = collect($response->json('data'))->keyBy('value');
        $this->assertTrue($formats->has('regular'));
        $this->assertFalse($formats->has('presale_cinema'));
    }

    public function test_event_routes_have_throttle_middleware(): void
    {
        $routes = collect(Route::getRoutes());

        $indexRoute = $routes->first(fn ($r) => $r->uri() === 'api/v1/events');
        $this->assertNotNull($indexRoute);
        $this->assertContains('throttle:60,1', $indexRoute->middleware());

        $citiesRoute = $routes->first(fn ($r) => $r->uri() === 'api/v1/events/cities');
        $this->assertNotNull($citiesRoute);
        $this->assertContains('throttle:60,1', $citiesRoute->middleware());

        $formatsRoute = $routes->first(fn ($r) => $r->uri() === 'api/v1/events/formats');
        $this->assertNotNull($formatsRoute);
        $this->assertContains('throttle:60,1', $formatsRoute->middleware());

        $showRoute = $routes->first(fn ($r) => $r->uri() === 'api/v1/events/{id_or_slug}');
        $this->assertNotNull($showRoute);
        $this->assertContains('throttle:60,1', $showRoute->middleware());
    }
}
