<?php

namespace App\Services\Checkout;

use App\Exceptions\Checkout\VoucherInvalidException;
use App\Models\Voucher;
use Illuminate\Support\Facades\DB;

class VoucherService
{
    /**
     * Memvalidasi voucher promo dan menghitung nilai potongan harga serta net amount.
     *
     * @return array{code: string, discount_amount: float, net_amount: float, description: string, voucher_id: int}
     *
     * @throws VoucherInvalidException
     */
    public function applyVoucher(string $code, float $grossAmount, string $itemType, ?int $targetId = null): array
    {
        $voucher = Voucher::with(['event', 'movie'])->where('code', $code)->first();

        if (! $voucher || ! $voucher->is_active) {
            throw VoucherInvalidException::notFoundOrInactive();
        }

        $now = now();

        if ($voucher->valid_from > $now) {
            throw VoucherInvalidException::notStarted();
        }

        if ($voucher->valid_until < $now) {
            throw VoucherInvalidException::expired();
        }

        if ($voucher->quota_used >= $voucher->quota_total) {
            throw VoucherInvalidException::quotaExceeded();
        }

        if ($voucher->item_type !== 'all' && $voucher->item_type !== $itemType) {
            throw VoucherInvalidException::invalidItemType($itemType);
        }

        // Validasi pembatasan khusus Event Bioskop
        if ($voucher->event_id !== null) {
            if ($itemType !== 'ticket' || $targetId === null || (int) $targetId !== (int) $voucher->event_id) {
                $eventName = $voucher->event?->title ?? 'event bioskop tertentu';
                throw VoucherInvalidException::invalidTarget("Voucher ini hanya berlaku khusus untuk tiket penayangan '{$eventName}'.");
            }
        }

        // Validasi pembatasan khusus Film VoD Streaming
        if ($voucher->movie_id !== null) {
            if ($itemType !== 'movie_rental' || $targetId === null || (int) $targetId !== (int) $voucher->movie_id) {
                $movieTitle = $voucher->movie?->title ?? 'film tertentu';
                throw VoucherInvalidException::invalidTarget("Voucher ini hanya berlaku khusus untuk sewa film '{$movieTitle}'.");
            }
        }

        if ($grossAmount < (float) $voucher->min_purchase) {
            throw VoucherInvalidException::minPurchaseNotMet((float) $voucher->min_purchase);
        }

        $discountAmount = $this->calculateDiscount($voucher, $grossAmount);
        $netAmount = max(0.00, round($grossAmount - $discountAmount, 2));
        $description = $this->generateDescription($voucher);

        return [
            'code' => $voucher->code,
            'discount_amount' => $discountAmount,
            'net_amount' => $netAmount,
            'description' => $description,
            'voucher_id' => $voucher->id,
        ];
    }

    /**
     * Menghitung besaran diskon berdasarkan nominal gross belanja dan konfigurasi voucher.
     */
    public function calculateDiscount(Voucher $voucher, float $grossAmount): float
    {
        if ($voucher->discount_type === 'percentage') {
            $calculated = ($grossAmount * (float) $voucher->discount_value) / 100.0;
            if ($voucher->max_discount !== null && $calculated > (float) $voucher->max_discount) {
                return (float) $voucher->max_discount;
            }

            return round(min($calculated, $grossAmount), 2);
        }

        if ($voucher->discount_type === 'slashed_price') {
            $cut = (float) $voucher->discount_value;

            return round(min($cut, $grossAmount), 2);
        }

        // Fixed discount nominal
        $fixed = (float) $voucher->discount_value;

        return round(min($fixed, $grossAmount), 2);
    }

    /**
     * Mencari promosi direct discount (coret harga) aktif untuk item tertentu (film atau event).
     *
     * @return array{has_discount: bool, original_price: ?float, discounted_price: float, discount_amount: float, voucher: ?Voucher}
     */
    public function getActiveDirectDiscount(float $basePrice, string $itemType, ?int $targetId = null): array
    {
        if ($basePrice <= 0) {
            return [
                'has_discount' => false,
                'original_price' => null,
                'discounted_price' => $basePrice,
                'discount_amount' => 0.0,
                'voucher' => null,
            ];
        }

        $now = now();
        /** @var Voucher|null $voucher */
        $voucher = Voucher::query()
            ->where('promo_type', 'direct_discount')
            ->where('is_active', true)
            ->where('valid_from', '<=', $now)
            ->where('valid_until', '>=', $now)
            ->whereColumn('quota_used', '<', 'quota_total')
            ->where(function ($query) use ($itemType, $targetId) {
                $query->where('item_type', 'all')
                    ->orWhere(function ($sub) use ($itemType, $targetId) {
                        $sub->where('item_type', $itemType);
                        if ($itemType === 'movie_rental' && $targetId !== null) {
                            $sub->where(function ($targetSub) use ($targetId) {
                                $targetSub->whereNull('movie_id')
                                    ->orWhere('movie_id', $targetId);
                            });
                        } elseif ($itemType === 'ticket' && $targetId !== null) {
                            $sub->where(function ($targetSub) use ($targetId) {
                                $targetSub->whereNull('event_id')
                                    ->orWhere('event_id', $targetId);
                            });
                        }
                    });
            })
            // Prioritaskan yang terikat spesifik ke targetId daripada yang umum
            ->orderByRaw('CASE WHEN movie_id IS NOT NULL OR event_id IS NOT NULL THEN 0 ELSE 1 END')
            ->orderByDesc('id')
            ->first();

        if (! $voucher) {
            return [
                'has_discount' => false,
                'original_price' => null,
                'discounted_price' => $basePrice,
                'discount_amount' => 0.0,
                'voucher' => null,
            ];
        }

        // Cek syarat minimum belanja jika ada
        if ((float) $voucher->min_purchase > 0 && $basePrice < (float) $voucher->min_purchase) {
            return [
                'has_discount' => false,
                'original_price' => null,
                'discounted_price' => $basePrice,
                'discount_amount' => 0.0,
                'voucher' => null,
            ];
        }

        $discountAmount = $this->calculateDiscount($voucher, $basePrice);

        if ($discountAmount <= 0) {
            return [
                'has_discount' => false,
                'original_price' => null,
                'discounted_price' => $basePrice,
                'discount_amount' => 0.0,
                'voucher' => null,
            ];
        }

        $discountedPrice = round(max(0, $basePrice - $discountAmount), 2);

        return [
            'has_discount' => true,
            'original_price' => $basePrice,
            'discounted_price' => $discountedPrice,
            'discount_amount' => $discountAmount,
            'voucher' => $voucher,
        ];
    }

    /**
     * Menambah pemakaian kuota voucher secara atomik dengan pessimistic locking (ACID transaction).
     *
     * @throws VoucherInvalidException
     */
    public function incrementUsage(int $voucherId): Voucher
    {
        return DB::transaction(function () use ($voucherId) {
            $voucher = Voucher::where('id', $voucherId)
                ->lockForUpdate()
                ->first();

            if (! $voucher || ! $voucher->is_active) {
                throw VoucherInvalidException::notFoundOrInactive();
            }

            if ($voucher->quota_used >= $voucher->quota_total) {
                throw VoucherInvalidException::quotaExceeded();
            }

            $voucher->increment('quota_used');
            $voucher->refresh();

            return $voucher;
        });
    }

    /**
     * Menghasilkan teks deskripsi voucher yang informatif.
     */
    protected function generateDescription(Voucher $voucher): string
    {
        if ($voucher->discount_type === 'percentage') {
            $percent = (int) $voucher->discount_value == $voucher->discount_value
                ? (int) $voucher->discount_value
                : number_format((float) $voucher->discount_value, 2);

            $desc = "Diskon {$percent}%";
            if ($voucher->max_discount !== null) {
                $maxFormatted = number_format((float) $voucher->max_discount, 0, ',', '.');
                $desc .= " hingga Rp {$maxFormatted}";
            }
        } elseif ($voucher->discount_type === 'slashed_price') {
            $cutFormatted = number_format((float) $voucher->discount_value, 0, ',', '.');
            $desc = "Potongan coret harga Rp {$cutFormatted}";
        } else {
            $fixedFormatted = number_format((float) $voucher->discount_value, 0, ',', '.');
            $desc = "Potongan harga Rp {$fixedFormatted}";
        }

        if ((float) $voucher->min_purchase > 0) {
            $minFormatted = number_format((float) $voucher->min_purchase, 0, ',', '.');
            $desc .= " (Min. Transaksi Rp {$minFormatted})";
        }

        return $desc;
    }
}
