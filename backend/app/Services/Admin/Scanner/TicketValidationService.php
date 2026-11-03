<?php

namespace App\Services\Admin\Scanner;

use App\Exceptions\Tickets\TicketAlreadyCheckedInException;
use App\Exceptions\Tickets\TicketNotFoundException;
use App\Models\EventTransaction;
use App\Models\TicketCheckin;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

class TicketValidationService
{
    /**
     * Memvalidasi hash QR tiket dari kamera mobile scanner staf dan melakukan check-in instan.
     *
     * @param  array{qr_hash: string, device_info?: ?string}  $data
     *
     * @throws TicketNotFoundException
     * @throws TicketAlreadyCheckedInException
     * @throws HttpException
     */
    public function validateAndCheckin(array $data, User $staffUser, ?string $ipAddress = null): EventTransaction
    {
        return DB::transaction(function () use ($data, $staffUser, $ipAddress) {
            $queryHash = trim($data['qr_hash']);
            /** @var EventTransaction|null $transaction */
            $transaction = EventTransaction::where('qr_hash', $queryHash)
                ->orWhere('ticket_code', $queryHash)
                ->orWhere('order_id', $queryHash)
                ->lockForUpdate()
                ->first();

            if (! $transaction) {
                throw new TicketNotFoundException('QR Tiket tidak valid atau tidak terdaftar di sistem.');
            }

            // 1. Cek status pembayaran: pastikan status transaksi 'paid'
            if ($transaction->payment_status !== 'paid') {
                throw new HttpException(
                    422,
                    'Tiket belum dibayar atau status transaksi tidak valid ('.strtoupper($transaction->payment_status).').'
                );
            }

            // 2. Cek tipe event: Scanner pintu masuk HANYA untuk screening reguler, TIDAK BISA untuk presale bioskop
            $eventType = $transaction->schedule?->event?->event_type
                ?? ($transaction->snapshot_event_data['event_type'] ?? 'regular');

            if ($eventType === 'presale_cinema') {
                throw new HttpException(
                    422,
                    'Tiket ini adalah tiket Presale Bioskop Komersial (XXI/CGV). Tiket presale wajib dicetak fisik di Kiosk bioskop mitra menggunakan kode booking, tidak dapat di-scan di gerbang masuk Sinemus.'
                );
            }

            // 2. Cek apakah tiket sudah pernah di-checkin sebelumnya (Anti Double Check-in)
            if ($transaction->checkin_status === 'checked_in') {
                $lastCheckin = TicketCheckin::where('transaction_id', $transaction->id)
                    ->with('scannedBy:id,name')
                    ->latest('scanned_at')
                    ->first();

                $scannedAtStr = $lastCheckin?->scanned_at
                    ? $lastCheckin->scanned_at->toISOString()
                    : ($transaction->checkin_at ? $transaction->checkin_at->toISOString() : null);

                $scannedByName = $lastCheckin?->scannedBy?->name ?? 'Petugas Gerbang Venue';

                $waktuWib = $lastCheckin?->scanned_at
                    ? $lastCheckin->scanned_at->copy()->timezone('Asia/Jakarta')->format('H:i').' WIB'
                    : 'waktu sebelumnya';

                $msg = "PERINGATAN: Tiket ini SUDAH DIGUNAKAN pada pukul {$waktuWib} oleh Petugas {$scannedByName}!";

                throw new TicketAlreadyCheckedInException(
                    $msg,
                    $scannedAtStr,
                    $scannedByName
                );
            }

            // 3. Cek masa berlaku jadwal / sesi: pastikan sesi belum kadaluarsa
            // Sesi kadaluarsa jika show_time sudah lewat lebih dari 12 jam (toleransi wajar pemutaran film)
            $showTime = $transaction->schedule?->show_time;
            if ($showTime && $showTime->copy()->addHours(12)->isPast()) {
                throw new HttpException(
                    422,
                    'Sesi penayangan untuk tiket ini telah berakhir pada '.$showTime->copy()->timezone('Asia/Jakarta')->format('d M Y H:i').' WIB.'
                );
            }

            // 4. Mutasi status check-in pada transaksi
            $now = now();
            $transaction->checkin_status = 'checked_in';
            $transaction->checkin_at = $now;
            $transaction->save();

            // 5. Rekam audit log ke tabel ticket_checkins
            TicketCheckin::create([
                'transaction_id' => $transaction->id,
                'scanned_by_user_id' => $staffUser->id,
                'device_info' => $data['device_info'] ?? null,
                'ip_address' => $ipAddress,
                'scanned_at' => $now,
            ]);

            // Eager load relations for resource output
            $transaction->loadMissing([
                'user:id,name,email',
                'schedule.event:id,title,seating_type,slug',
            ]);

            return $transaction;
        });
    }
}
