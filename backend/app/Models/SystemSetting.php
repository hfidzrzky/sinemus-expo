<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SystemSetting extends Model
{
    use HasFactory;

    public const GROUP_BUSINESS_POLICIES = 'business_policies';

    public const GROUP_PUBLIC_CONTACT = 'public_contact';

    public const GROUP_EMERGENCY_CONTROLS = 'emergency_controls';

    protected $fillable = [
        'group',
        'payload',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
        ];
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
