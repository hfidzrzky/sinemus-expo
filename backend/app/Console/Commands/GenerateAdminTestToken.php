<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class GenerateAdminTestToken extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'admin:token {email=superadmin@sinemus.id}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate a Sanctum Bearer token for Super Admin testing';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $email = $this->argument('email');

        $user = User::where('email', $email)->orWhere('role', 'super_admin')->first();

        if (! $user) {
            $user = User::create([
                'name' => 'Super Administrator',
                'email' => $email,
                'google_id' => 'admin_test_'.Str::random(10),
                'role' => 'super_admin',
                'phone_number' => '0812'.rand(10000000, 99999999),
                'is_phone_locked' => true,
            ]);
        }

        if ($user->role !== 'super_admin') {
            $user->role = 'super_admin';
            $user->save();
        }

        $token = $user->createToken('admin-api-testing')->plainTextToken;

        $this->info("Super Admin Token for [{$user->email}]:");
        $this->line($token);

        return self::SUCCESS;
    }
}
