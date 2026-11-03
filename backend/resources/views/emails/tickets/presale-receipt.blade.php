@extends('emails.layouts.master', [
    'accentGradient' => 'linear-gradient(90deg, #d97706 0%, #b45309 100%)',
    'subject' => "Bukti Reservasi Kursi Presale: {$eventTitle} ({$orderId})"
])

@section('content')
<!-- Header Intro -->
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
        <td align="center" style="text-align: center;">
            <div style="display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 6px 16px; border-radius: 9999px; background-color: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); color: #fbbf24;">
                Reservasi Terkonfirmasi
            </div>
            <h1 style="font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; margin: 16px 0 8px; line-height: 1.3;">
                Kursi Anda Telah Terkunci!
            </h1>
            <p style="font-size: 14px; color: #a1a1aa; line-height: 1.6; margin: 0;">
                Halo <strong class="highlight" style="color: #ffffff;">{{ $userName }}</strong>, pembayaran pesanan <strong style="color: #fbbf24;">{{ $orderId }}</strong> telah kami terima.
            </p>
        </td>
    </tr>
</table>

<!-- Order & Ticket Status Strip -->
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 28px; background-color: #18181b; border: 1px dashed #3f3f46; border-radius: 12px;">
    <tr>
        <td class="stack-column" valign="middle" align="left" style="padding: 14px 20px; font-size: 12px; color: #a1a1aa; font-weight: 600;">
            KODE: <strong class="highlight" style="color: #ffffff;">{{ $orderId }}</strong>
        </td>
        <td class="stack-column" valign="middle" align="right" style="padding: 14px 20px; font-size: 12px; color: #a1a1aa; font-weight: 600; text-align: right;">
            STATUS: <strong style="color: #fbbf24;">MENUNGGU TIKET</strong>
        </td>
    </tr>
</table>

<!-- Transaction Details Component -->
@include('emails.components.transaction-details')

<!-- Distribution Workflow Card -->
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #121214; border: 1px solid #27272a; border-radius: 16px; margin-bottom: 24px;">
    <tr>
        <td style="padding: 24px;">
            <div style="font-size: 13px; font-weight: 700; color: #e4e4e7; margin-bottom: 18px; text-transform: uppercase; letter-spacing: 1px;">
                Alur Distribusi Tiket:
            </div>
            
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <!-- Step 1 -->
                <tr>
                    <td valign="top" style="width: 28px; padding-bottom: 18px;">
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                                <td align="center" valign="middle" width="24" height="24" style="width: 24px; height: 24px; background-color: #e4e4e7; color: #09090b; border-radius: 50%; font-size: 12px; font-weight: 800; line-height: 24px;">
                                    &#10003;
                                </td>
                            </tr>
                        </table>
                    </td>
                    <td valign="top" style="padding-left: 12px; padding-bottom: 18px;">
                        <div style="font-size: 14px; font-weight: 600; color: #ffffff;">1. Pembayaran Diverifikasi</div>
                        <div style="font-size: 13px; color: #a1a1aa; margin-top: 3px; line-height: 1.5;">Nomor kursi Anda telah dipesan dan diamankan.</div>
                    </td>
                </tr>

                <!-- Step 2 -->
                <tr>
                    <td valign="top" style="width: 28px; padding-bottom: 18px;">
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                                <td align="center" valign="middle" width="24" height="24" style="width: 24px; height: 24px; background-color: #27272a; color: #ffffff; border-radius: 50%; border: 1px solid #52525b; font-size: 12px; font-weight: 800; line-height: 24px;">
                                    2
                                </td>
                            </tr>
                        </table>
                    </td>
                    <td valign="top" style="padding-left: 12px; padding-bottom: 18px;">
                        <div style="font-size: 14px; font-weight: 600; color: #e4e4e7;">2. Input Tiket Mitra Bioskop</div>
                        <div style="font-size: 13px; color: #a1a1aa; margin-top: 3px; line-height: 1.5;">Admin memproses kode booking dari jaringan bioskop mitra.</div>
                    </td>
                </tr>

                <!-- Step 3 -->
                <tr>
                    <td valign="top" style="width: 28px;">
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                                <td align="center" valign="middle" width="24" height="24" style="width: 24px; height: 24px; background-color: transparent; color: #71717a; border-radius: 50%; border: 1px dashed #3f3f46; font-size: 12px; font-weight: 800; line-height: 24px;">
                                    3
                                </td>
                            </tr>
                        </table>
                    </td>
                    <td valign="top" style="padding-left: 12px;">
                        <div style="font-size: 14px; font-weight: 600; color: #71717a;">3. Tiket Siap Dicetak</div>
                        <div style="font-size: 13px; color: #52525b; margin-top: 3px; line-height: 1.5;">Anda akan menerima email pemberitahuan kedua berisi QR Code resmi.</div>
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
                Unduh Bukti PDF
            </a>
        </td>
        <td class="stack-column-space" style="width: 4%; font-size: 1px; line-height: 1px;">&nbsp;</td>
        <td class="stack-column" align="center" style="width: 48%; padding: 0;">
            <a href="{{ $ticketWebUrl }}" target="_blank" style="display: block; text-align: center; font-size: 13px; font-weight: 600; padding: 13px 18px; border-radius: 10px; text-decoration: none; background-color: #d97706; border: 1px solid #d97706; color: #ffffff;">
                Pantau Reservasi &rarr;
            </a>
        </td>
    </tr>
</table>
@endsection