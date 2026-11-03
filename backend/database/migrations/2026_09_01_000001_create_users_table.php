<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('google_id', 100)->unique()->comment('Sub claim dari Google Identity Services');
            $table->string('email', 191)->unique()->comment('Email resmi dari Google (Read-only, immutable)');
            $table->string('name', 100)->comment('Nama lengkap penonton');
            $table->string('avatar_url', 255)->nullable()->comment('URL avatar profil dari Google');
            $table->string('phone_number', 20)->nullable()->unique()->comment('No WhatsApp (08xx / +628xx)');
            $table->boolean('is_phone_locked')->default(false)->comment('1 = Terkunci permanen setelah diisi perdana');
            $table->date('birth_date')->nullable()->comment('Tanggal lahir penonton untuk verifikasi rating usia');
            $table->enum('role', ['customer', 'super_admin'])->default('customer')->comment('Peran akses sistem');
            $table->dateTime('last_login_at')->nullable();
            $table->timestamps();

            $table->index('role', 'idx_users_role');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
