<!-- Transaction Details Table Card -->
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: separate; border-spacing: 0; background-color: transparent; border: 1px solid #27272a; border-radius: 16px; margin: 28px 0; overflow: hidden;">
    <!-- Row: Acara / Film -->
    <tr>
        <td valign="middle" style="padding: 14px 20px; font-size: 13px; color: #a1a1aa; border-bottom: 1px solid #27272a; width: 38%; white-space: nowrap;">
            Acara / Film
        </td>
        <td valign="middle" align="right" style="padding: 14px 20px; font-size: 14px; font-weight: 700; color: #ffffff; border-bottom: 1px solid #27272a; text-align: right; width: 62%;">
            {{ $eventTitle }}
        </td>
    </tr>

    <!-- Row: Lokasi Venue -->
    <tr>
        <td valign="middle" style="padding: 14px 20px; font-size: 13px; color: #a1a1aa; border-bottom: 1px solid #27272a; width: 38%; white-space: nowrap;">
            Lokasi Venue
        </td>
        <td valign="middle" align="right" style="padding: 14px 20px; font-size: 13px; font-weight: 600; color: #e4e4e7; border-bottom: 1px solid #27272a; text-align: right; width: 62%;">
            {{ $venueName }}
            @if(!empty($studioName) && $studioName !== '-')
                <span style="color: #71717a; font-weight: 400;">({{ $studioName }})</span>
            @endif
        </td>
    </tr>

    <!-- Row: Jadwal Penayangan -->
    @if(!empty($showTimeFormatted) && $showTimeFormatted !== '-')
    <tr>
        <td valign="middle" style="padding: 14px 20px; font-size: 13px; color: #a1a1aa; border-bottom: 1px solid #27272a; width: 38%; white-space: nowrap;">
            Jadwal Penayangan
        </td>
        <td valign="middle" align="right" style="padding: 14px 20px; font-size: 13px; font-weight: 600; color: #ffffff; border-bottom: 1px solid #27272a; text-align: right; width: 62%;">
            {{ $showTimeFormatted }}
        </td>
    </tr>
    @endif

    <!-- Row: Kursi / Akses -->
    <tr>
        <td valign="middle" style="padding: 14px 20px; font-size: 13px; color: #a1a1aa; border-bottom: 1px solid #27272a; width: 38%; white-space: nowrap;">
            {{ !empty($hasAssignedSeats) ? 'Nomor Kursi' : 'Tipe Akses / Kursi' }}
        </td>
        <td valign="middle" align="right" style="padding: 14px 20px; font-size: 14px; font-weight: 700; color: #ffffff; border-bottom: 1px solid #27272a; text-align: right; width: 62%; letter-spacing: 0.5px;">
            {{ $seatsText }}
        </td>
    </tr>

    <!-- Row: Jumlah Tiket -->
    <tr>
        <td valign="middle" style="padding: 14px 20px; font-size: 13px; color: #a1a1aa; border-bottom: 1px solid #27272a; width: 38%; white-space: nowrap;">
            Jumlah Tiket
        </td>
        <td valign="middle" align="right" style="padding: 14px 20px; font-size: 13px; font-weight: 600; color: #ffffff; border-bottom: 1px solid #27272a; text-align: right; width: 62%;">
            {{ $ticketQuantity }} Tiket
        </td>
    </tr>

    <!-- Row: Total Pembayaran (Footer) -->
    <tr>
        <td valign="middle" style="padding: 18px 20px; font-size: 13px; font-weight: 600; color: #a1a1aa; background-color: #121214; width: 38%; white-space: nowrap;">
            Total Pembayaran
        </td>
        <td valign="middle" align="right" style="padding: 18px 20px; font-size: 16px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px; background-color: #121214; text-align: right; width: 62%;">
            Rp {{ $totalFormatted }}
        </td>
    </tr>
</table>