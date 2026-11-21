<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Opsi B (Full Cleanup):
     * 1. Menghapus baris transaksi peninggalan sistem presale bioskop (M-Tix/XXI/CGV/Smart Ingest)
     *    beserta relasi ticket_checkins & seat_locks, serta merilis kursi fisik yang dibebaskan.
     * 2. Menghapus permanen 7 kolom legacy presale dari tabel event_transactions.
     */
    public function up(): void
    {
        // 1. Hard-delete transaksi yang masih membawa artefak sistem presale bioskop
        if (Schema::hasColumn('event_transactions', 'cinema_booking_code')) {
            DB::transaction(function (): void {
                $legacyTransactions = DB::table('event_transactions')
                    ->where(function ($query): void {
                        $query->whereNotNull('cinema_booking_code')
                            ->orWhereNotNull('cinema_passcode')
                            ->orWhereNotNull('cinema_qr_image_path')
                            ->orWhereNotNull('cinema_ticket_notes')
                            ->orWhereNotNull('fulfilled_at')
                            ->orWhereNotNull('fulfilled_by_admin_id');
                    })
                    ->get(['id', 'order_id', 'schedule_id', 'snapshot_seats']);

                if ($legacyTransactions->isNotEmpty()) {
                    $legacyIds = $legacyTransactions->pluck('id')->all();
                    $legacyOrderIds = $legacyTransactions->pluck('order_id')->all();

                    // Hapus relasi check-in & seat_locks terkait transaksi presale lama
                    if (Schema::hasTable('ticket_checkins')) {
                        DB::table('ticket_checkins')
                            ->whereIn('transaction_id', $legacyIds)
                            ->delete();
                    }

                    if (Schema::hasTable('seat_locks')) {
                        DB::table('seat_locks')
                            ->whereIn('order_id', $legacyOrderIds)
                            ->delete();
                    }

                    // Hapus transaksi presale lama
                    DB::table('event_transactions')
                        ->whereIn('id', $legacyIds)
                        ->delete();

                    // Rilis kursi fisik yang sebelumnya dibooking oleh transaksi yang dihapus
                    // (hanya jika tidak dipakai oleh transaksi paid lain yang masih aktif)
                    if (Schema::hasTable('seats')) {
                        foreach ($legacyTransactions as $tx) {
                            if (empty($tx->schedule_id) || empty($tx->snapshot_seats)) {
                                continue;
                            }

                            $seats = is_string($tx->snapshot_seats)
                                ? json_decode($tx->snapshot_seats, true)
                                : (array) $tx->snapshot_seats;

                            if (! is_array($seats) || empty($seats)) {
                                continue;
                            }

                            $seatCodes = array_values(array_filter(array_map(function ($s): string {
                                if (is_array($s) && isset($s['seat_code'])) {
                                    return (string) $s['seat_code'];
                                }

                                return is_scalar($s) ? (string) $s : '';
                            }, $seats)));

                            if (empty($seatCodes)) {
                                continue;
                            }

                            // Kumpulkan kursi yang masih dibayar oleh transaksi lain pada schedule yang sama
                            $stillBookedSeats = [];
                            $otherPaid = DB::table('event_transactions')
                                ->where('schedule_id', $tx->schedule_id)
                                ->where('payment_status', 'paid')
                                ->pluck('snapshot_seats');

                            foreach ($otherPaid as $raw) {
                                $decoded = is_string($raw) ? json_decode($raw, true) : (array) $raw;
                                if (is_array($decoded)) {
                                    foreach ($decoded as $item) {
                                        $code = is_array($item) && isset($item['seat_code'])
                                            ? (string) $item['seat_code']
                                            : (is_scalar($item) ? (string) $item : '');
                                        if ($code !== '') {
                                            $stillBookedSeats[] = $code;
                                        }
                                    }
                                }
                            }

                            $seatsToRelease = array_values(array_diff($seatCodes, array_unique($stillBookedSeats)));
                            if (! empty($seatsToRelease)) {
                                DB::table('seats')
                                    ->where('schedule_id', $tx->schedule_id)
                                    ->whereIn('seat_code', $seatsToRelease)
                                    ->where('status', 'booked')
                                    ->update(['status' => 'available']);
                            }
                        }
                    }
                }
            });
        }

        // 2. Drop foreign key, index, dan 7 kolom legacy presale dari event_transactions
        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            $this->rebuildEventTransactionsTableForSqlite();

            return;
        }

        Schema::table('event_transactions', function (Blueprint $table): void {
            if (Schema::hasColumn('event_transactions', 'fulfilled_by_admin_id')) {
                $table->dropForeign(['fulfilled_by_admin_id']);
            }

            if (Schema::hasColumn('event_transactions', 'fulfillment_status')) {
                $table->dropIndex('idx_event_trx_fulfillment');
            }
        });

        $columnsToDrop = array_values(array_filter([
            'fulfillment_status',
            'cinema_booking_code',
            'cinema_passcode',
            'cinema_qr_image_path',
            'cinema_ticket_notes',
            'fulfilled_at',
            'fulfilled_by_admin_id',
        ], fn (string $col): bool => Schema::hasColumn('event_transactions', $col)));

        if (! empty($columnsToDrop)) {
            Schema::table('event_transactions', function (Blueprint $table) use ($columnsToDrop): void {
                $table->dropColumn($columnsToDrop);
            });
        }
    }

    /**
     * SQLite tidak mendukung DROP COLUMN pada kolom yang memiliki definisi FOREIGN KEY.
     * Rebuild tabel secara aman tanpa 7 kolom legacy presale.
     */
    protected function rebuildEventTransactionsTableForSqlite(): void
    {
        DB::statement('PRAGMA foreign_keys = OFF');

        try {
            DB::transaction(function (): void {
                Schema::create('event_transactions_clean', function (Blueprint $table): void {
                    $table->id();
                    $table->string('order_id', 50)->unique();
                    $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                    $table->foreignId('schedule_id')->constrained('schedules')->restrictOnDelete();
                    $table->foreignId('voucher_id')->nullable()->constrained('vouchers')->nullOnDelete();
                    $table->unsignedInteger('ticket_quantity')->default(1);
                    $table->decimal('gross_amount', 12, 2);
                    $table->decimal('discount_amount', 12, 2)->default(0.00);
                    $table->decimal('net_amount', 12, 2);
                    $table->string('snap_token', 255)->nullable();
                    $table->string('payment_status', 32)->default('pending');
                    $table->string('payment_type', 50)->nullable();
                    $table->dateTime('paid_at')->nullable();
                    $table->string('ticket_code', 50)->nullable()->unique();
                    $table->string('qr_hash', 64)->nullable()->unique();
                    $table->enum('checkin_status', ['pending', 'checked_in'])->default('pending');
                    $table->dateTime('checkin_at')->nullable();
                    $table->json('snapshot_event_data');
                    $table->json('snapshot_seats')->nullable();
                    $table->timestamps();
                });

                DB::statement('
                    INSERT INTO event_transactions_clean (
                        id, order_id, user_id, schedule_id, voucher_id, ticket_quantity,
                        gross_amount, discount_amount, net_amount, snap_token,
                        payment_status, payment_type, paid_at, ticket_code, qr_hash,
                        checkin_status, checkin_at, snapshot_event_data, snapshot_seats,
                        created_at, updated_at
                    )
                    SELECT
                        id, order_id, user_id, schedule_id, voucher_id, ticket_quantity,
                        gross_amount, discount_amount, net_amount, snap_token,
                        payment_status, payment_type, paid_at, ticket_code, qr_hash,
                        checkin_status, checkin_at, snapshot_event_data, snapshot_seats,
                        created_at, updated_at
                    FROM event_transactions
                ');

                Schema::drop('event_transactions');
                Schema::rename('event_transactions_clean', 'event_transactions');

                Schema::table('event_transactions', function (Blueprint $table): void {
                    $table->index(['user_id', 'payment_status'], 'idx_event_trx_user_status');
                    $table->index('schedule_id', 'idx_event_trx_schedule');
                    $table->index('checkin_status', 'idx_event_trx_checkin');
                });
            });
        } finally {
            DB::statement('PRAGMA foreign_keys = ON');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('event_transactions', function (Blueprint $table): void {
            if (! Schema::hasColumn('event_transactions', 'fulfillment_status')) {
                $table->enum('fulfillment_status', ['unfulfilled', 'awaiting_cinema_ticket', 'fulfilled', 'cancelled'])
                    ->default('unfulfilled')
                    ->after('checkin_at');
                $table->index('fulfillment_status', 'idx_event_trx_fulfillment');
            }
            if (! Schema::hasColumn('event_transactions', 'cinema_booking_code')) {
                $table->string('cinema_booking_code', 100)->nullable()->after('fulfillment_status');
            }
            if (! Schema::hasColumn('event_transactions', 'cinema_passcode')) {
                $table->string('cinema_passcode', 50)->nullable()->after('cinema_booking_code');
            }
            if (! Schema::hasColumn('event_transactions', 'cinema_qr_image_path')) {
                $table->string('cinema_qr_image_path', 255)->nullable()->after('cinema_passcode');
            }
            if (! Schema::hasColumn('event_transactions', 'cinema_ticket_notes')) {
                $table->text('cinema_ticket_notes')->nullable()->after('cinema_qr_image_path');
            }
            if (! Schema::hasColumn('event_transactions', 'fulfilled_at')) {
                $table->dateTime('fulfilled_at')->nullable()->after('cinema_ticket_notes');
            }
            if (! Schema::hasColumn('event_transactions', 'fulfilled_by_admin_id')) {
                $table->foreignId('fulfilled_by_admin_id')->nullable()->after('fulfilled_at')->constrained('users')->nullOnDelete();
            }
        });
    }
};
