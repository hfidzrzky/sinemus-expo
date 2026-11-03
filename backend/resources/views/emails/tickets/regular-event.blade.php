@extends('emails.layouts.master', [
    'accentGradient' => 'linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)',
    'subject' => "E-Tiket Siap: {$eventTitle} ({$orderId})"
])

@section('content')
<!-- Header Intro -->
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
        <td align="center" style="text-align: center;">
            <div style="display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 6px 16px; border-radius: 9999px; background-color: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); color: #60a5fa;">
                E-Tiket Terbit Resmi
            </div>
            <h1 style="font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; margin: 16px 0 8px; line-height: 1.3;">
                Tiket Nonton Anda Sudah Siap!
            </h1>
            <p style="font-size: 14px; color: #a1a1aa; line-height: 1.6; margin: 0;">
                Halo <strong class="highlight" style="color: #ffffff;">{{ $userName }}</strong>, transaksi pemesanan <strong style="color: #60a5fa;">{{ $orderId }}</strong> telah lunas. E-tiket resmi Anda telah siap diakses.
            </p>
        </td>
    </tr>
</table>

<!-- Order & Ticket Code Strip -->
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 28px; background-color: #18181b; border: 1px dashed #3f3f46; border-radius: 12px;">
    <tr>
        <td class="stack-column" valign="middle" align="left" style="padding: 14px 20px; font-size: 12px; color: #a1a1aa; font-weight: 600;">
            KODE: <strong class="highlight" style="color: #ffffff;">{{ $orderId }}</strong>
        </td>
        <td class="stack-column" valign="middle" align="right" style="padding: 14px 20px; font-size: 12px; color: #a1a1aa; font-weight: 600; text-align: right;">
            E-TIKET: <strong class="highlight" style="color: #ffffff;">{{ $ticketCode }}</strong>
        </td>
    </tr>
</table>

<!-- Transaction Details Component -->
@include('emails.components.transaction-details')

<!-- Instructions Card -->
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #121214; border: 1px solid #27272a; border-radius: 16px; margin-bottom: 8px;">
    <tr>
        <td style="padding: 24px;">
            <div style="font-size: 13px; font-weight: 700; color: #93c5fd; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;">
                Petunjuk Masuk Venue Screening
            </div>
            <p style="font-size: 13px; color: #a1a1aa; line-height: 1.6; margin: 0 0 24px;">
                Tunjukkan QR Code ke petugas gerbang venue saat memasuki auditorium. Anda dapat mengunduh berkas tiket PDF resmi atau membuka e-pass interaktif langsung melalui website Sinemus Screen.
            </p>

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
                        <a href="{{ $ticketWebUrl }}" target="_blank" style="display: block; text-align: center; font-size: 13px; font-weight: 600; padding: 13px 18px; border-radius: 10px; text-decoration: none; background-color: #2563eb; border: 1px solid #2563eb; color: #ffffff;">
                            Buka E-Pass Interaktif &rarr;
                        </a>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
@endsection