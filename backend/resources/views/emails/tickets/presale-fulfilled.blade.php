@extends('emails.layouts.master', [
    'accentGradient' => 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
    'subject' => "Tiket Bioskop Siap Dicetak: {$eventTitle} ({$orderId})"
])

@section('content')
<!-- Header Intro -->
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
        <td align="center" style="text-align: center;">
            <div style="display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 6px 16px; border-radius: 9999px; background-color: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); color: #34d399;">
                Tiket Bioskop Telah Terbit
            </div>
            <h1 style="font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; margin: 16px 0 8px; line-height: 1.3;">
                Tiket Bioskop Anda Sudah Siap!
            </h1>
            <p style="font-size: 14px; color: #a1a1aa; line-height: 1.6; margin: 0;">
                Halo <strong class="highlight" style="color: #ffffff;">{{ $userName }}</strong>, pesanan presale <strong style="color: #34d399;">{{ $orderId }}</strong> telah selesai diproses. Kredensial cetak tiket resmi Anda siap digunakan.
            </p>
        </td>
    </tr>
</table>

<!-- Kiosk Credentials Card -->
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 28px; background: #064e3b; background: linear-gradient(135deg, rgba(6, 78, 59, 0.3) 0%, rgba(2, 44, 34, 0.3) 100%); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 16px; margin-bottom: 24px;">
    <tr>
        <td style="padding: 24px; text-align: center;">
            <div style="font-size: 13px; font-weight: 700; color: #34d399; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px;">
                Kredensial Resmi Cetak Kiosk
            </div>
            
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                    <td class="stack-column" valign="top" style="width: 48%; padding: 0;">
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: rgba(0, 0, 0, 0.2); border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.05);">
                            <tr>
                                <td align="center" style="padding: 16px;">
                                    <div style="font-size: 11px; color: #a7f3d0; text-transform: uppercase; letter-spacing: 0.5px;">Booking Code</div>
                                    <div style="font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: 2px; margin-top: 8px; font-family: monospace;">{{ $cinemaBookingCode }}</div>
                                </td>
                            </tr>
                        </table>
                    </td>
                    <td class="stack-column-space" style="width: 4%; font-size: 1px; line-height: 1px;">&nbsp;</td>
                    <td class="stack-column" valign="top" style="width: 48%; padding: 0;">
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: rgba(0, 0, 0, 0.2); border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.05);">
                            <tr>
                                <td align="center" style="padding: 16px;">
                                    <div style="font-size: 11px; color: #a7f3d0; text-transform: uppercase; letter-spacing: 0.5px;">Passcode / PIN</div>
                                    <div style="font-size: 24px; font-weight: 800; color: #34d399; letter-spacing: 2px; margin-top: 8px; font-family: monospace;">{{ $cinemaPasscode }}</div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>

<!-- QR Code Section -->
@if(!empty($qrDataUri) || !empty($qrBinary) || !empty($qrLocalPath))
@php
    $qrExt = ($qrMime ?? 'image/png') === 'image/jpeg' ? 'jpg' : (($qrMime ?? '') === 'image/svg+xml' ? 'svg' : 'png');
    $qrSrc = (isset($message) && !empty($qrLocalPath) && file_exists($qrLocalPath))
        ? $message->embed($qrLocalPath)
        : ((isset($message) && !empty($qrBinary))
            ? $message->embedData($qrBinary, 'cinema-ticket-qr.' . $qrExt, $qrMime ?? 'image/png')
            : ($qrDataUri ?: ''));
@endphp
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #121214; border: 1px solid #27272a; border-radius: 16px; margin-bottom: 24px;">
    <tr>
        <td align="center" style="padding: 24px; text-align: center;">
            <div style="font-size: 13px; font-weight: 700; color: #e4e4e7; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px;">
                Scan QR Code di Kiosk Bioskop
            </div>
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
                <tr>
                    <td align="center" style="padding: 16px; background-color: #ffffff; border-radius: 16px;">
                        <img src="{{ $qrSrc }}" alt="Barcode Tiket Bioskop" width="160" height="160" style="width: 160px; height: 160px; display: block;" />
                    </td>
                </tr>
            </table>
            <div style="font-size: 12px; color: #a1a1aa; margin-top: 14px; line-height: 1.5;">
                Arahkan layar ponsel ke scanner mesin kiosk untuk pencetakan tiket fisik.
            </div>
            @if(!empty($ticketCode) && $ticketCode !== $orderId)
                <div style="font-family: monospace; font-size: 11px; font-weight: 700; color: #71717a; margin-top: 6px; letter-spacing: 0.5px;">
                    REF: {{ $ticketCode }}
                </div>
            @endif
        </td>
    </tr>
</table>
@endif

<!-- Transaction Details Component -->
@include('emails.components.transaction-details')

<!-- Kiosk Print Instructions -->
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #121214; border: 1px solid #27272a; border-radius: 16px; margin-bottom: 24px;">
    <tr>
        <td style="padding: 24px;">
            <div style="font-size: 13px; font-weight: 700; color: #60a5fa; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px;">
                Langkah Cetak Tiket:
            </div>
            
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                    <td valign="top" style="width: 24px; font-weight: 700; color: #60a5fa; font-size: 14px; line-height: 1.6;">
                        1.
                    </td>
                    <td valign="top" style="padding-bottom: 14px; font-size: 13px; color: #d4d4d8; line-height: 1.6;">
                        Kunjungi <strong>Mesin Tiket Mandiri (Kiosk)</strong> di bioskop mitra sebelum jadwal tayang.
                    </td>
                </tr>
                <tr>
                    <td valign="top" style="width: 24px; font-weight: 700; color: #60a5fa; font-size: 14px; line-height: 1.6;">
                        2.
                    </td>
                    <td valign="top" style="padding-bottom: 14px; font-size: 13px; color: #d4d4d8; line-height: 1.6;">
                        Pilih menu <strong>Cetak Tiket / Pick Up Ticket</strong> pada layar mesin.
                    </td>
                </tr>
                <tr>
                    <td valign="top" style="width: 24px; font-weight: 700; color: #60a5fa; font-size: 14px; line-height: 1.6;">
                        3.
                    </td>
                    <td valign="top" style="font-size: 13px; color: #d4d4d8; line-height: 1.6;">
                        Pindai <strong>QR Code</strong>, atau ketik manual <strong>Booking Code</strong> &amp; <strong>Passcode</strong>.
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>

<!-- Action Buttons Table -->
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="btn-table">
    <tr>
        <td class="stack-column" align="center" style="width: 48%; padding: 0;">
            <a href="{{ $ticketPdfUrl }}" target="_blank" style="display: block; text-align: center; font-size: 13px; font-weight: 600; padding: 13px 18px; border-radius: 10px; text-decoration: none; background-color: transparent; border: 1px solid #3f3f46; color: #e4e4e7;">
                Unduh PDF
            </a>
        </td>
        <td class="stack-column-space" style="width: 4%; font-size: 1px; line-height: 1px;">&nbsp;</td>
        <td class="stack-column" align="center" style="width: 48%; padding: 0;">
            <a href="{{ $ticketWebUrl }}" target="_blank" style="display: block; text-align: center; font-size: 13px; font-weight: 600; padding: 13px 18px; border-radius: 10px; text-decoration: none; background-color: #10b981; border: 1px solid #10b981; color: #ffffff;">
                Buka Detail Web &rarr;
            </a>
        </td>
    </tr>
</table>
@endsection