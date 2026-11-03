<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use PDO;
use Throwable;

class SyncPlatformDatabaseCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:sync-platform
                            {--source=sinemus_platform : Nama database sumber}
                            {--target=sinemus_expo : Nama database target}
                            {--force : Lewati konfirmasi interaktif}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sinkronkan seluruh data domain dari database sinemus_platform ke sinemus_expo dengan pemetaan nama kolom presisi';

    /**
     * Daftar tabel domain yang disinkronisasikan.
     *
     * @var array<int, string>
     */
    private const DOMAIN_TABLES = [
        'users',
        'banners',
        'event_venues',
        'events',
        'movies',
        'schedules',
        'seats',
        'seat_locks',
        'vouchers',
        'event_transactions',
        'ticket_checkins',
        'movie_transactions',
        'user_movie_access',
        'system_settings',
        'personal_access_tokens',
    ];

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $sourceDb = (string) $this->option('source');
        $targetDb = (string) $this->option('target');
        $isForced = (bool) $this->option('force');

        // 1. Validasi Keamanan: Karakter Identifier Database (Anti-SQL Injection)
        if (! preg_match('/^[a-zA-Z0-9_]+$/', $sourceDb) || ! preg_match('/^[a-zA-Z0-9_]+$/', $targetDb)) {
            $this->error('Format nama database sumber atau target tidak valid (hanya alfanumerik dan underscore yang diizinkan).');

            return self::FAILURE;
        }

        // 2. Proteksi Kritis: Cegah malapetaka penghapusan data jika sumber dan target identik
        if ($sourceDb === $targetDb) {
            $this->error("Database sumber dan target tidak boleh sama [{$sourceDb}]! Operasi dibatalkan demi mencegah penghapusan data permanen.");

            return self::FAILURE;
        }

        // 3. Proteksi Environment Production
        if (app()->environment('production') && ! $isForced) {
            $this->error('Perintah sinkronisasi database destruktif ditolak pada lingkungan production tanpa konfirmasi eksplisit.');

            return self::FAILURE;
        }

        $this->info("Menyiapkan sinkronisasi database: [{$sourceDb}] -> [{$targetDb}]");

        if (! $isForced && ! $this->confirm("Apakah Anda yakin ingin menimpa data 15 tabel domain di [{$targetDb}] dengan data dari [{$sourceDb}]?", false)) {
            $this->warn('Operasi sinkronisasi dibatalkan oleh pengguna.');

            return self::SUCCESS;
        }

        $pdo = DB::connection()->getPdo();

        // 4. Validasi Keberadaan Database Sumber dan Target
        $stmtDb = $pdo->prepare('SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = :db_name');

        $stmtDb->execute(['db_name' => $sourceDb]);
        if (! $stmtDb->fetchColumn()) {
            $this->error("Database sumber [{$sourceDb}] tidak ditemukan pada server database aktif.");

            return self::FAILURE;
        }

        $stmtDb->execute(['db_name' => $targetDb]);
        if (! $stmtDb->fetchColumn()) {
            $this->error("Database target [{$targetDb}] tidak ditemukan pada server database aktif.");

            return self::FAILURE;
        }

        try {
            // 1. Matikan pengecekan Foreign Key
            $this->line('<comment>[1/4]</comment> Menonaktifkan foreign key checks...');
            $pdo->exec('SET FOREIGN_KEY_CHECKS = 0;');

            // 2. Truncate dan Salin Data Setiap Tabel Domain dengan Named Column Mapping
            $this->line('<comment>[2/4]</comment> Menyalin data tabel domain dengan pemetaan kolom presisi...');
            foreach (self::DOMAIN_TABLES as $table) {
                // Ambil daftar kolom yang sama antara tabel sumber dan target
                $colsStmt = $pdo->prepare(
                    'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
                     WHERE TABLE_SCHEMA = :source_db AND TABLE_NAME = :table_name
                     ORDER BY ORDINAL_POSITION'
                );
                $colsStmt->execute(['source_db' => $sourceDb, 'table_name' => $table]);
                $sourceCols = $colsStmt->fetchAll(PDO::FETCH_COLUMN);

                $targetColsStmt = $pdo->prepare(
                    'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
                     WHERE TABLE_SCHEMA = :target_db AND TABLE_NAME = :table_name
                     ORDER BY ORDINAL_POSITION'
                );
                $targetColsStmt->execute(['target_db' => $targetDb, 'table_name' => $table]);
                $targetCols = $targetColsStmt->fetchAll(PDO::FETCH_COLUMN);

                $commonCols = array_values(array_intersect($sourceCols, $targetCols));
                if (empty($commonCols)) {
                    $this->warn("  Tabel `{$table}` dilewati: tidak memiliki kolom yang cocok atau tabel belum dibuat di database.");

                    continue;
                }

                $quotedCols = implode(', ', array_map(fn (string $col): string => "`{$col}`", $commonCols));

                $pdo->exec("TRUNCATE TABLE `{$targetDb}`.`{$table}`");
                $rowCount = $pdo->exec(
                    "INSERT INTO `{$targetDb}`.`{$table}` ({$quotedCols})
                     SELECT {$quotedCols} FROM `{$sourceDb}`.`{$table}`"
                );

                $this->line(sprintf('  <info>✓</info> Tabel %-25s : %d baris berhasil disalin', "`{$table}`", (int) $rowCount));
            }

            // 3. Aktifkan Kembali Pengecekan Foreign Key
            $this->line('<comment>[3/4]</comment> Mengaktifkan kembali foreign key checks...');
            $pdo->exec('SET FOREIGN_KEY_CHECKS = 1;');

            // 4. Verifikasi Integritas Row Count
            $this->line('<comment>[4/4]</comment> Memverifikasi integritas jumlah baris data...');
            $allValid = true;
            $tableRows = [];

            $tableExistsStmt = $pdo->prepare(
                'SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = :db_name AND TABLE_NAME = :table_name'
            );

            foreach (self::DOMAIN_TABLES as $table) {
                $tableExistsStmt->execute(['db_name' => $sourceDb, 'table_name' => $table]);
                $sourceExists = (int) $tableExistsStmt->fetchColumn() > 0;

                $tableExistsStmt->execute(['db_name' => $targetDb, 'table_name' => $table]);
                $targetExists = (int) $tableExistsStmt->fetchColumn() > 0;

                if (! $sourceExists || ! $targetExists) {
                    $allValid = false;
                    $tableRows[] = [
                        $table,
                        $sourceExists ? 'EXISTS' : 'NOT FOUND',
                        $targetExists ? 'EXISTS' : 'NOT FOUND',
                        '<error>TABLE MISSING</error>',
                    ];

                    continue;
                }

                $sourceCount = (int) $pdo->query("SELECT COUNT(*) FROM `{$sourceDb}`.`{$table}`")->fetchColumn();
                $targetCount = (int) $pdo->query("SELECT COUNT(*) FROM `{$targetDb}`.`{$table}`")->fetchColumn();

                $status = ($sourceCount === $targetCount) ? '<info>MATCH</info>' : '<error>MISMATCH</error>';
                if ($sourceCount !== $targetCount) {
                    $allValid = false;
                }

                $tableRows[] = [
                    $table,
                    (string) $sourceCount,
                    (string) $targetCount,
                    $status,
                ];
            }

            $this->table(['Tabel Domain', "Sumber ({$sourceDb})", "Target ({$targetDb})", 'Status'], $tableRows);

            if ($allValid) {
                $this->info("BERHASIL: Seluruh 15 tabel domain tersinkronisasi 100% sempurna ke database [{$targetDb}]!");

                return self::SUCCESS;
            }

            $this->warn('PERINGATAN: Terdapat perbedaan jumlah baris atau tabel yang hilang pada database target.');

            return self::FAILURE;

        } catch (Throwable $e) {
            $this->error('GAGAL: Terjadi kesalahan saat sinkronisasi: '.$e->getMessage());

            return self::FAILURE;
        } finally {
            // Pastikan foreign key checks selalu dipulihkan dalam kondisi kegagalan apa pun
            $pdo->exec('SET FOREIGN_KEY_CHECKS = 1;');
        }
    }
}
