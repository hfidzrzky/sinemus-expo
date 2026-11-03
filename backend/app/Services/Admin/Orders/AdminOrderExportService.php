<?php

namespace App\Services\Admin\Orders;

use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminOrderExportService
{
    public function __construct(
        protected AdminOrderAuditService $orderAuditService
    ) {}

    /**
     * Mengekspor riwayat transaksi lintas domain ke format CSV secara hemat memori (streaming).
     *
     * @param  array<string, mixed>  $filters
     */
    public function exportOrdersCsv(array $filters): StreamedResponse
    {
        $filename = 'sinemus_orders_export_'.now()->format('Ymd_His').'.csv';

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function () use ($filters) {
            $file = fopen('php://output', 'w');
            // Menulis Byte Order Mark (BOM) UTF-8 agar karakter terbaca rapi di Microsoft Excel
            fwrite($file, "\xEF\xBB\xBF");

            // Header Kolom CSV
            fputcsv($file, [
                'Order ID',
                'Tipe Pesanan',
                'Nama Pembeli',
                'Email Pembeli',
                'No. WhatsApp',
                'Item / Produk',
                'Total Kotor (Rp)',
                'Diskon (Rp)',
                'Total Bersih (Rp)',
                'Status Pembayaran',
                'Metode Pembayaran',
                'Waktu Bayar',
                'Waktu Transaksi',
            ]);

            $query = $this->orderAuditService->getUnifiedOrdersQuery($filters)->orderBy('created_at', 'desc');

            // Chunk batch 500 baris untuk membatasi konsumsi memori PHP
            $query->chunk(500, function ($orders) use ($file) {
                foreach ($orders as $order) {
                    $itemTitle = $order->item_title;
                    if ($itemTitle === 'Tiket Bioskop' && ! empty($order->snapshot_event_data)) {
                        $snap = is_string($order->snapshot_event_data) ? json_decode($order->snapshot_event_data, true) : (array) $order->snapshot_event_data;
                        $itemTitle = $snap['event_title'] ?? ($snap['title'] ?? $itemTitle);
                    }

                    fputcsv($file, [
                        $this->sanitizeCsvField($order->order_id),
                        $order->order_type === 'ticket' ? 'Tiket Bioskop' : 'Sewa Film VoD',
                        $this->sanitizeCsvField($order->user_name),
                        $this->sanitizeCsvField($order->user_email),
                        $this->sanitizeCsvField($order->user_phone ?? '-'),
                        $this->sanitizeCsvField($itemTitle),
                        number_format((float) $order->gross_amount, 2, '.', ''),
                        number_format((float) $order->discount_amount, 2, '.', ''),
                        number_format((float) $order->net_amount, 2, '.', ''),
                        strtoupper($order->payment_status),
                        $order->payment_type ? strtoupper($order->payment_type) : '-',
                        $order->paid_at ?? '-',
                        $order->created_at,
                    ]);
                }
            });

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Sanitasi field CSV untuk mitigasi CSV Formula Injection (CWE-1236).
     * Mencegah eksekusi rumus/makro saat file dibuka di Microsoft Excel / LibreOffice.
     */
    protected function sanitizeCsvField(mixed $value): string
    {
        if ($value === null) {
            return '-';
        }

        $str = (string) $value;

        if (preg_match('/^[=\+\-@\t\r]/', $str)) {
            return "'".$str;
        }

        return $str;
    }
}
