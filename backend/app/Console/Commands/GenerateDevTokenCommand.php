<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class GenerateDevTokenCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'dev:generate-token {email=customer@sinemus.id} {--role=customer} {--name=Customer Sinemus}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Menghasilkan Sanctum Bearer Token untuk keperluan pengujian API / Postman';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $email = (string) $this->argument('email');
        $role = (string) $this->option('role');
        $name = (string) $this->option('name');

        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'google_id' => 'google_dev_'.Str::random(16),
                'phone_number' => '0812'.rand(10000000, 99999999),
                'is_phone_locked' => true,
                'role' => $role,
            ]
        );

        // Terbitkan token Sanctum baru
        $token = $user->createToken('postman-dev-token')->plainTextToken;

        $this->newLine();
        $this->info('====================================================');
        $this->info('  SANCTUM BEARER TOKEN BERHASIL DITERBITKAN');
        $this->info('====================================================');
        $this->line("<fg=yellow;options=bold>User Email :</> {$user->email}");
        $this->line("<fg=yellow;options=bold>User Role  :</> {$user->role}");
        $this->line("<fg=yellow;options=bold>User ID    :</> {$user->id}");
        $this->newLine();
        $this->line('<fg=green;options=bold>BEARER TOKEN (Salin ke Postman):</>');
        $this->line("<fg=cyan>{$token}</>");
        $this->info('====================================================');
        $this->newLine();

        return self::SUCCESS;
    }
}
