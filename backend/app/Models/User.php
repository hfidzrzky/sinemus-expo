<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\HasApiTokens;

/**
 * App\Models\User
 *
 * @property int $id
 * @property string|null $google_id
 * @property string $name
 * @property string $email
 * @property string $role
 * @property string|null $avatar_url
 * @property string|null $phone_number
 * @property bool $is_phone_locked
 * @property Carbon|null $birth_date
 * @property bool $is_profile_completed
 * @property Carbon|null $last_login_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The accessors to append to the model's array form.
     *
     * @var array<int, string>
     */
    protected $appends = [
        'is_profile_completed',
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'google_id',
        'email',
        'name',
        'avatar_url',
        'phone_number',
        'birth_date',
        'last_login_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'google_id',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'is_phone_locked' => 'boolean',
            'last_login_at' => 'datetime',
        ];
    }

    /**
     * Tentukan secara deterministik apakah profil penonton sudah lengkap.
     */
    protected function isProfileCompleted(): Attribute
    {
        return Attribute::make(
            get: fn (): bool => ! empty($this->phone_number) && ! empty($this->birth_date)
        );
    }

    /**
     * Cek apakah pengguna memiliki peran Super Admin.
     */
    public function isSuperAdmin(): bool
    {
        return $this->role === 'super_admin';
    }

    /**
     * Relasi ke transaksi tiket bioskop.
     */
    public function eventTransactions(): HasMany
    {
        return $this->hasMany(EventTransaction::class);
    }

    /**
     * Relasi ke kunci reservasi kursi sementara.
     */
    public function seatLocks(): HasMany
    {
        return $this->hasMany(SeatLock::class);
    }

    /**
     * Relasi ke riwayat check-in yang dilakukan oleh staff scanner ini.
     */
    public function scannedCheckins(): HasMany
    {
        return $this->hasMany(TicketCheckin::class, 'scanned_by_user_id');
    }

    /**
     * Relasi ke transaksi sewa film VoD.
     */
    public function movieTransactions(): HasMany
    {
        return $this->hasMany(MovieTransaction::class);
    }

    /**
     * Relasi ke hak akses sewa film VoD pengguna.
     */
    public function movieAccess(): HasMany
    {
        return $this->hasMany(UserMovieAccess::class);
    }
}
